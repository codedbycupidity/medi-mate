import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { IMedication } from '../models/Medication';

// Initialize Pinecone only if API key is available
let pinecone: Pinecone | null = null;
if (process.env.PINECONE_API_KEY) {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
} else {
  console.warn('PINECONE_API_KEY not found - vector store features will be disabled');
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const INDEX_NAME = 'medications';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const SIMILARITY_THRESHOLD = 0.95; // Increased threshold for fallback embeddings

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;
  existingMedication?: {
    id: string;
    name: string;
    dosage: string;
    unit: string;
    userId: string;
  };
}

export class VectorStoreService {
  private index: any;
  private initialized = false;

  async initialize() {
    if (this.initialized || !pinecone) return;
    
    try {
      const indexes = await pinecone.listIndexes();
      const indexExists = indexes.indexes?.some((idx: any) => idx.name === INDEX_NAME);
      
      if (!indexExists) {
        await pinecone.createIndex({
          name: INDEX_NAME,
          dimension: 1536,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });
        
        console.log(`Created new Pinecone index: ${INDEX_NAME}`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      this.index = pinecone.index(INDEX_NAME);
      this.initialized = true;
      console.log('VectorStore service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VectorStore:', error);
      throw error;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error: any) {
      console.error('Failed to generate embedding with OpenAI:', error.message);
      
      // Fallback: Generate a simple hash-based embedding for testing
      console.log('Using fallback embedding generation for testing...');
      return this.generateFallbackEmbedding(text);
    }
  }
  
  private generateFallbackEmbedding(text: string): number[] {
    // Create a more sophisticated deterministic embedding
    // Better for testing but still not production-ready
    const embedding = new Array(1536).fill(0);
    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/);
    
    // Generate hash for each word to create more distinct embeddings
    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      let wordHash = 0;
      
      for (let i = 0; i < word.length; i++) {
        wordHash = ((wordHash << 5) - wordHash) + word.charCodeAt(i);
        wordHash = wordHash & wordHash;
      }
      
      // Distribute word features across embedding
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i);
        const baseIndex = (w * 100 + i * 10) % 1536;
        const spread = 5; // Spread features across nearby dimensions
        
        for (let j = 0; j < spread; j++) {
          const index = (baseIndex + j) % 1536;
          embedding[index] += (charCode / 255 - 0.5) * (1 / (j + 1));
        }
      }
      
      // Add word-level features
      const wordFeatureBase = (wordHash % 500) + 500;
      for (let i = 0; i < 10; i++) {
        const index = (wordFeatureBase + i) % 1536;
        embedding[index] += Math.sin(wordHash + i) * 0.2;
      }
    }
    
    // Add position-based features to distinguish order
    for (let i = 0; i < Math.min(normalizedText.length, 200); i++) {
      const index = (i * 7) % 1536;
      embedding[index] += normalizedText.charCodeAt(i) / 1000;
    }
    
    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  private createMedicationText(medication: Partial<IMedication>): string {
    const parts = [
      medication.name,
      medication.dosage,
      medication.unit,
      medication.frequency,
      medication.instructions || '',
    ].filter(Boolean);
    
    return parts.join(' ').toLowerCase().trim();
  }

  async checkForDuplicate(
    userId: string,
    medication: {
      name: string;
      dosage: string;
      unit: string;
      frequency?: string;
      instructions?: string;
    }
  ): Promise<DuplicateCheckResult> {
    // Skip if Pinecone is not configured
    if (!pinecone || !openai) {
      return {
        isDuplicate: false,
        similarity: 0,
      };
    }
    
    await this.initialize();
    
    try {
      const medicationText = this.createMedicationText(medication);
      const embedding = await this.generateEmbedding(medicationText);
      
      const queryResponse = await this.index.namespace(userId).query({
        vector: embedding,
        topK: 1,
        includeMetadata: true,
      });
      
      if (queryResponse.matches && queryResponse.matches.length > 0) {
        const topMatch = queryResponse.matches[0];
        
        if (topMatch.score >= SIMILARITY_THRESHOLD) {
          return {
            isDuplicate: true,
            similarity: topMatch.score,
            existingMedication: {
              id: topMatch.id,
              name: topMatch.metadata?.name || '',
              dosage: topMatch.metadata?.dosage || '',
              unit: topMatch.metadata?.unit || '',
              userId: topMatch.metadata?.userId || '',
            },
          };
        }
      }
      
      return {
        isDuplicate: false,
        similarity: 0,
      };
    } catch (error) {
      console.error('Duplicate check failed:', error);
      return {
        isDuplicate: false,
        similarity: 0,
      };
    }
  }

  async indexMedication(medication: IMedication): Promise<void> {
    // Skip if Pinecone is not configured
    if (!pinecone || !openai) {
      return;
    }
    
    await this.initialize();
    
    try {
      const medicationText = this.createMedicationText(medication);
      const embedding = await this.generateEmbedding(medicationText);
      
      await this.index.namespace(medication.userId.toString()).upsert([
        {
          id: (medication._id as any).toString(),
          values: embedding,
          metadata: {
            name: medication.name,
            dosage: medication.dosage,
            unit: medication.unit,
            frequency: medication.frequency,
            userId: medication.userId.toString(),
            active: medication.active,
            createdAt: medication.createdAt.toISOString(),
          },
        },
      ]);
      
      console.log(`Indexed medication: ${medication.name} for user: ${medication.userId}`);
    } catch (error) {
      console.error('Failed to index medication:', error);
      throw error;
    }
  }

  async updateMedicationIndex(medication: IMedication): Promise<void> {
    await this.indexMedication(medication);
  }

  async deleteMedicationFromIndex(medicationId: string, userId: string): Promise<void> {
    // Skip if Pinecone is not configured
    if (!pinecone) {
      return;
    }
    
    await this.initialize();
    
    try {
      await this.index.namespace(userId).deleteOne(medicationId);
      console.log(`Deleted medication from index: ${medicationId}`);
    } catch (error) {
      console.error('Failed to delete medication from index:', error);
      throw error;
    }
  }

  async findSimilarMedications(
    userId: string,
    medicationName: string,
    limit: number = 5
  ): Promise<Array<{
    id: string;
    name: string;
    dosage: string;
    unit: string;
    similarity: number;
  }>> {
    await this.initialize();
    
    try {
      const embedding = await this.generateEmbedding(medicationName.toLowerCase());
      
      const queryResponse = await this.index.namespace(userId).query({
        vector: embedding,
        topK: limit,
        includeMetadata: true,
      });
      
      if (!queryResponse.matches) return [];
      
      return queryResponse.matches.map((match: any) => ({
        id: match.id,
        name: match.metadata?.name || '',
        dosage: match.metadata?.dosage || '',
        unit: match.metadata?.unit || '',
        similarity: match.score,
      }));
    } catch (error) {
      console.error('Failed to find similar medications:', error);
      return [];
    }
  }
}

export const vectorStore = new VectorStoreService();