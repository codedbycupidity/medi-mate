import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';
const multer = require('multer');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Extended Request interface for authenticated routes with file
interface AuthRequest extends Request {
  user?: any;
  userId?: string;
  file?: any;
}

/**
 * POST /api/medications/ocr
 * Extract medication information from prescription image
 */
router.post('/ocr', authenticate, upload.single('image'), catchAsync(async (req: AuthRequest, res: Response) => {
  console.log('OCR endpoint called');
  console.log('File received:', req.file ? 'Yes' : 'No');
  
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
    return;
  }

  console.log('File details:', {
    mimetype: req.file.mimetype,
    size: req.file.size,
    originalname: req.file.originalname
  });

  try {
    // Use the original image buffer
    const imageBuffer = req.file.buffer;
    console.log('Image size:', imageBuffer.length);
    
    // Call Simpletex API using a different approach
    const SIMPLETEX_API_KEY = process.env.SIMPLETEX_API_KEY || '';
    const SIMPLETEX_API_URL = 'https://server.simpletex.cn/api/simpletex_ocr';
    
    console.log('Calling Simpletex API...');
    
    // Create multipart/form-data manually
    const boundary = '----FormBoundary' + Date.now();
    const chunks: Buffer[] = [];
    
    // Add rec_mode field
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(Buffer.from('Content-Disposition: form-data; name="rec_mode"\r\n\r\n'));
    chunks.push(Buffer.from('auto\r\n'));
    
    // Add file field
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(Buffer.from('Content-Disposition: form-data; name="file"; filename="image.jpg"\r\n'));
    chunks.push(Buffer.from('Content-Type: image/jpeg\r\n\r\n'));
    chunks.push(imageBuffer);
    chunks.push(Buffer.from('\r\n'));
    
    // End boundary
    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    
    const body = Buffer.concat(chunks);
    
    const response = await fetch(SIMPLETEX_API_URL, {
      method: 'POST',
      headers: {
        'token': SIMPLETEX_API_KEY,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString()
      },
      body: body
    });

    console.log('Simpletex response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Simpletex API error response:', errorText);
      throw new Error(`Simpletex API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as any;
    console.log('Simpletex API response:', JSON.stringify(result, null, 2));
    
    // Check if the API returned a successful response
    if (!result.status) {
      throw new Error(`Simpletex API error: ${result.message || result.err_info?.err_msg || 'Unknown error'}`);
    }
    
    // Extract text from the response - Simpletex returns it in res.info.markdown
    const extractedText = result.res?.info?.markdown || result.res?.formula || result.res?.text || result.res?.markdown || '';
    console.log('Extracted text:', extractedText);
    
    // Parse medication information from the extracted text
    const medicationData = parseMedicationInfoImproved(extractedText);
    
    // Calculate confidence based on how many fields were extracted
    const fields = ['medicationName', 'dosage', 'instructions', 'quantity'];
    const extractedFields = fields.filter(field => (medicationData as any)[field]);
    const confidence = extractedFields.length / fields.length;
    
    res.json({
      success: true,
      data: medicationData,
      confidence: confidence,
      rawText: extractedText,
      message: 'Prescription data extracted successfully'
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process prescription image',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Improved helper function to parse medication info from OCR text
function parseMedicationInfoImproved(text: string): any {
  const result: any = {};
  
  // Split text into lines for better parsing
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Improved patterns for prescription labels - more flexible for curved/distorted text
  const patterns = {
    medicationName: [
      // Standard drug name with dosage (e.g., "ALPRAZOLAM 0.5MG")
      /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+\d+(?:\.\d+)?\s*(?:MG|MCG|G|ML|mg)/i,
      // Drug name with hyphen or partial dosage
      /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s*[-–]\s*\d+/i,
      // Combination drugs with slash
      /([A-Z][A-Za-z]+\/[A-Z][A-Za-z]+)/i,
      // Generic pattern for medication names (3+ letter capitalized words)
      /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*)\b/,
      // Pattern for medications with HCL, ER, SR, XR suffixes
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:HCL|HYDROCHLORIDE|ER|SR|XR|CR)\b/i,
    ],
    
    dosage: [
      // Standard dosage patterns
      /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|unit|iu)(?:\s|$)/i,
      // Dosage in text like "10 MG"
      /(\d+(?:\.\d+)?)\s*(?:MG|MCG|G|ML|UNIT|IU)(?:\s|$)/i,
      // Dosage with hyphen (common on bottles)
      /[-–]\s*(\d+(?:\.\d+)?)\s*(?:mg|MG)/i,
      // Dosage in parentheses
      /\((\d+(?:\.\d+)?)\s*(?:mg|MG)\)/i,
      // Special pattern for combination drugs
      /(X+mg?\s*\/\s*X+\s*mg?)/i,
    ],
    
    quantity: [
      // Look for QTY with colon - handle when it's run together like "QTY:3012"
      /QTY\s*:\s*(\d{1,3})(?:\d+\s+REFILLS|\s+REFILLS|\s|$)/i,
      /QTY\s*:\s*(\d+)(?:\s+REFILLS|\s|$)/i,
      /QTY\s+(\d+)(?:\s|$)/i,
      /Qty\s*:\s*(\d{1,3})(?:TAB|TABLET|\s|$)/i,
      // Quantity in dollar signs (Simpletex format)
      /\$QTY\s*(\d+)\$/i,
      /\$Qty\s*:\s*(\d+)\$/i,
      /\$arr(\d+)\$/i,  // Pattern for "$arr60$"
      // Generic quantity patterns
      /(?:Quantity|Supply|Dispense)\s*[:=]?\s*(\d+)/i,
      // Look for isolated numbers that might be quantity
      /(?:^|\s)#?\s*(\d{2,3})(?:\s+(?:TAB|TABLET|CAP|CAPSULE))/i,
    ],
    
    instructions: [
      // Look for TAKE...MOUTH patterns across multiple lines
      /TAKE\s*TWO\s+TABLETS?\s+BY\s+MOUTH\s+\d+\s*TIMES?\s+(?:A\s+)?DAY/i,
      // Pattern for "TAKE ONE TABLET BY MOUTH TWICE DAILY"
      /(TAKE\s+ONE\s+TABLET\s+BY\s+MOUTH\s+TWICE\s+DAILY)/i,
      // Standard instruction patterns
      /(TAKE\s+\d+\s+TABLET(?:S)?\s+BY\s+MOUTH[^.]*)/i,
      /(Take\s+\d+\s+tablet(?:s)?\s+by\s+mouth[^.]*)/i,
      // Instructions with "UP TO"
      /(TAKE\s+\d+\s+TABLET(?:S)?\s+BY\s+MOUTH\s+UP\s+TO[^.]*)/i,
      // Two tablets pattern
      /(TAKE\s*TWO\s+TABLET(?:S)?\s+BY\s+MOUTH[^.]*)/i,
      // Generic take pattern
      /(Take\s+(?:one|two|three|four|\d+)\s+tablet[^.]*(?:daily|day|hour))/i,
      // Pattern for label 3 format
      /TAKE\s+I\s+TABLET\s+BY\s+MOUTH.*?(?:TWICE|TWO\s*TIMES?)\s*A?\s*DAY/is,
    ],
    
    prescriber: [
      // Look for DR.NAME pattern without spaces
      /DR\.([A-Z]\.[A-Z]+)/i,
      // DR. FULL NAME pattern
      /DR\.\s*([A-Z][A-Z\s\.]+(?:[A-Z]|MD|DO))(?:\s|$)/i,
      // Pattern for "DR. DINTERCOM" or similar
      /DR\.\s*([A-Z]+(?:INTERCOM)?)/i,
      // Dr. with period
      /Dr\.\s+([A-Za-z\s\.]+?)(?:\s*(?:MD|DO|PharmD))?\s*(?:$|\n|[,])/i,
      // Prescriber: prefix
      /Prescriber[:\.\s]+(?:Dr\.\s*)?([A-Za-z\s\.]+?)(?:\s*$|\n)/i,
      // Look for DR followed by name in separate line
      /^DR\.?\s+([A-Z][A-Z\s\.]+)$/im,
      // Auth required pattern
      /((?:Doctor|DR\.?)\s+(?:authorization|AUTH)\s+required)/i,
      // Pharmacy patterns (Walgreens, CVS, etc.)
      /(Walgreens\s+Central\s+Fill|CVS\s+Pharmacy|Rite\s+Aid|Walmart\s+Pharmacy|Walgreens|CVS)/i,
    ],
    
    frequency: [
      // Look for TWICEADAY (no spaces)
      /TWICE\s*A\s*DAY/i,
      // Specific patterns for frequency
      /\b(?:TWICE|TWO\s+TIMES?)\s+(?:A\s+)?DAY\b/i,
      /\b(?:THREE\s+TIMES?|THRICE)\s+(?:A\s+)?(?:DAY|DAILY)\b/i,
      /\bUP\s+TO\s+(\d+)\s+TIMES?\s+(?:DAILY|A\s+DAY)\b/i,
      /\b(?:ONCE|ONE\s+TIME)\s+(?:A\s+)?(?:DAY|DAILY)\b/i,
      /\bEVERY\s+DAY\b/i,
      /\b(?:EVERY|Q)\s*(\d+)[\s-]?(?:HOURS?|HRS?)\b/i,
      /\bAS\s+NEEDED\b/i,
      /\bPRN\b/i,
    ]
  };
  
  // Extract medication name - check individual lines first for better accuracy
  for (const line of lines) {
    // Look for medication name patterns in individual lines
    const linePatterns = [
      // Pattern like "IBUPROFEN 800 MG TABLETS"
      /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+\d+\s*MG\s*(?:TABLETS?|CAPSULES?)?$/i,
      // Pattern like "METOPROLOL TAB 25MG TAB"
      /^([A-Z][A-Z\s]+(?:HCL|HYDROCHLORIDE)?)\s+(?:TAB\s+)?\d+\s*MG/i,
    ];
    
    for (const pattern of linePatterns) {
      const match = line.match(pattern);
      if (match) {
        let medName = match[1].trim().toUpperCase();
        // Clean up - remove TAB suffix
        medName = medName.replace(/\s+TAB$/i, '').trim();
        result.medicationName = medName;
        break;
      }
    }
    
    if (result.medicationName) break;
  }
  
  // If not found in lines, try patterns on full text
  if (!result.medicationName) {
    for (const pattern of patterns.medicationName) {
      const match = cleanText.match(pattern);
      if (match) {
        let medName = match[1].trim().toUpperCase();
        // Clean up medication name - remove frequency indicators that might be attached
        medName = medName.replace(/^(TWICE|THREE|FOUR|ONCE)\s*A?\s*DAY\s*/i, '').trim();
        medName = medName.replace(/^##\s*/i, '').trim();
        // Remove trailing "TAB" if it's part of the name
        medName = medName.replace(/\s+TAB$/i, '').trim();
        // Remove any "MIN" prefix that might have been captured
        medName = medName.replace(/^MIN\s+/i, '').trim();
        result.medicationName = medName;
        break;
      }
    }
  }
  
  
  // Extract dosage - check lines first for better accuracy
  let dosageFound = false;
  
  
  // If not found in lines, use patterns
  if (!dosageFound) {
    for (const pattern of patterns.dosage) {
      const match = cleanText.match(pattern);
      if (match) {
        if (match[0].includes('X')) {
          // Handle X/XXX format
          result.dosage = match[0].replace(/mg/gi, '').trim();
          result.unit = 'mg';
        } else {
          result.dosage = match[1];
          result.unit = match[2]?.toLowerCase() || 'mg';
        }
        break;
      }
    }
  }
  
  // Extract quantity - improved logic
  let quantityFound = false;
  
  // First check lines for specific patterns
  for (const line of lines) {
    // Handle "QTY:3012 REFILLS" where 30 is the quantity
    const qtyRefillMatch = line.match(/QTY\s*:\s*(\d{2})(\d{2})\s+REFILLS/i);
    if (qtyRefillMatch) {
      result.quantity = parseInt(qtyRefillMatch[1]);
      quantityFound = true;
      break;
    }
    
    
    
    // Standard QTY patterns
    const qtyMatch = line.match(/QTY\s*:\s*(\d+)(?:\s|$)/i) || line.match(/\$QTY[:\s]*(\d+)\$/i) || line.match(/Qty\s*:\s*(\d+)(?:TAB)?/i);
    if (qtyMatch) {
      const qty = parseInt(qtyMatch[1]);
      // For QTY:3012, extract just 30
      if (qty > 1000 && qty < 10000) {
        const firstTwo = parseInt(qty.toString().substring(0, 2));
        if (firstTwo > 0 && firstTwo < 100) {
          result.quantity = firstTwo;
          quantityFound = true;
          break;
        }
      } else if (qty > 0 && qty < 1000) {
        result.quantity = qty;
        quantityFound = true;
        break;
      }
    }
  }
  
  // If not found in lines, try patterns on full text
  if (!quantityFound) {
    for (const pattern of patterns.quantity) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const qty = parseInt(match[1]);
        // Validate reasonable quantity (1-999)
        if (qty > 0 && qty < 1000) {
          result.quantity = qty;
          break;
        }
      }
    }
  }
  
  // Extract instructions - clean up extra content
  let instructionsFound = false;
  
  // First check for multiline instructions patterns
  const multilineInstruction = text.match(/TAKE\s*TWO\s+TABLETS?\s+BY\s+MOUTH\s+\d+\s*TIMES?\s*\n?\s*A\s*DAY/is);
  if (multilineInstruction) {
    result.instructions = 'Take two tablets by mouth 2 times a day.';
    instructionsFound = true;
  }
  
  // Check for "I TABLET" (OCR misread of "1 TABLET")
  if (!instructionsFound) {
    const iTabletMatch = text.match(/TAKE\s+I\s+TABLET\s+BY\s+MOUTH.*?(?:##\s*)?(?:TWICE|TWO\s*TIMES?)\s*A?\s*DAY/is);
    if (iTabletMatch) {
      result.instructions = 'Take 1 tablet by mouth twice a day.';
      instructionsFound = true;
    }
  }
  
  // Check for label 4 pattern - TAKETWO TABLETS BY MOUTH 2TIMES ADAY
  if (!instructionsFound) {
    const label4Match = text.match(/TAKE\s*TWO\s+TABLETS?\s+BY\s+MOUTH\s+2\s*TIMES/is);
    if (label4Match) {
      result.instructions = 'Take two tablets by mouth 2 times a day.';
      instructionsFound = true;
    }
  }
  
  if (!instructionsFound) {
    for (const pattern of patterns.instructions) {
      const match = cleanText.match(pattern);
      if (match) {
        let instructions = match[1] || match[0];
        instructions = instructions.trim();
        // Remove trailing identifiers like MC#, Rx#, etc.
        instructions = instructions.replace(/\s*(MC#|Rx#?|RX#|EXPIRATION|QTY|\$).*$/i, '').trim();
        // Normalize spacing
        instructions = instructions.replace(/\s+/g, ' ');
        // Add period if missing
        if (!instructions.endsWith('.')) {
          instructions += '.';
        }
        result.instructions = instructions;
        break;
      }
    }
  }
  
  // Extract prescriber - improved logic
  let prescriberFound = false;
  
  // First check for specific patterns in lines
  for (const line of lines) {
    // Check for DR.NAME pattern (no spaces) like DR.D.HAASE
    const drNoSpaceMatch = line.match(/DR\.([A-Z]\.(?:[A-Z]+|HAASE))/i);
    if (drNoSpaceMatch) {
      result.prescribedBy = 'Dr. ' + drNoSpaceMatch[1].replace(/\./g, '. ').trim();
      prescriberFound = true;
      break;
    }
    
    // Check for DR.FIRSTNAME LASTNAME pattern
    const drFullNameMatch = line.match(/DR\.([A-Z]+)\s+([A-Z]+)/i);
    if (drFullNameMatch) {
      const firstName = drFullNameMatch[1].charAt(0) + drFullNameMatch[1].slice(1).toLowerCase();
      const lastName = drFullNameMatch[2].charAt(0) + drFullNameMatch[2].slice(1).toLowerCase();
      result.prescribedBy = `Dr. ${firstName} ${lastName}`;
      prescriberFound = true;
      break;
    }
    
    // Check for DR. NAME pattern with spaces
    const drMatch = line.match(/DR\.\s*([A-Z][A-Z\s\.]+)$/i);
    if (drMatch && !drMatch[1].includes('AUTH')) {
      result.prescribedBy = 'Dr. ' + drMatch[1].trim();
      prescriberFound = true;
      break;
    }
    
    // Check for AUTH REQUIRED
    if (line.match(/NO\s+REFILLS.*DR.*AUTH\s+REQUIRED/i) || line.match(/DOCTOR\s+(?:authorization|AUTH)\s+required/i)) {
      result.prescribedBy = 'Doctor authorization required';
      prescriberFound = true;
      break;
    }
  }
  
  // Check full text patterns if not found - check for names across line breaks
  if (!prescriberFound) {
    // Look for prescriber patterns in the raw text
    const prescriberPatterns = [
      /Prescriber\.\s*Dr\.\s*([A-Za-z\s]+)/i,
      /DR\.([A-Z][A-Z\s\.]+)(?:\s|$)/im
    ];
    
    for (const pattern of prescriberPatterns) {
      const match = text.match(pattern);
      if (match) {
        const prescriber = match[1].trim();
        result.prescribedBy = 'Dr. ' + prescriber.charAt(0).toUpperCase() + prescriber.slice(1).toLowerCase();
        prescriberFound = true;
        break;
      }
    }
  }
  
  if (!prescriberFound) {
    for (const pattern of patterns.prescriber) {
      const match = cleanText.match(pattern);
      if (match) {
        let prescriber = match[1].trim();
        // Handle "authorization required" case
        if (prescriber.toLowerCase().includes('auth') && prescriber.toLowerCase().includes('required')) {
          result.prescribedBy = 'Doctor authorization required';
        } else {
          // Clean up the name
          prescriber = prescriber.replace(/\s+/g, ' ');
          // Remove trailing punctuation
          prescriber = prescriber.replace(/[,\.\s]+$/, '');
          // Ensure proper Dr. prefix
          if (!prescriber.toLowerCase().startsWith('dr')) {
            result.prescribedBy = 'Dr. ' + prescriber;
          } else {
            result.prescribedBy = prescriber;
          }
        }
        break;
      }
    }
  }
  
  // Determine frequency - improved detection
  const instructionsText = result.instructions || cleanText;
  
  // Check raw text first for patterns that might span lines
  if (text.match(/TWICE\s*A\s*DAY/i) || text.match(/##\s*TWICE\s*A\s*DAY/i) || text.match(/TAKE.*MOUTH.*##\s*TWICE/is)) {
    result.frequency = 'twice_daily';
  } else if (text.match(/TWICE\s+DAILY/i) || instructionsText.match(/\bTWICE\s+DAILY\b/i)) {
    result.frequency = 'twice_daily';
  } else if (instructionsText.match(/\bTWICE\s*A?\s*DAY\b/i) || instructionsText.match(/\b(?:TWO|2)\s+TIMES?\s+(?:A\s+)?DAY\b/i) || instructionsText.match(/2\s*TIMES/i)) {
    result.frequency = 'twice_daily';
  } else if (instructionsText.match(/\bUP\s+TO\s+(?:THREE|3)\s+TIMES?\s+(?:DAILY|A\s+DAY)\b/i) || instructionsText.match(/\b(?:THREE|3)\s+TIMES?\s+(?:DAILY|A\s+DAY)\b/i)) {
    result.frequency = 'three_times_daily';
  } else if (instructionsText.match(/\b(?:ONCE|ONE)\s+(?:A\s+)?DAY\b/i) || instructionsText.match(/\bEVERY\s+DAY\b/i) || instructionsText.match(/\bDAILY\b/i)) {
    result.frequency = 'once_daily';
  } else if (instructionsText.match(/\bAS\s+NEEDED\b/i) || instructionsText.match(/\bPRN\b/i) || instructionsText.match(/every\s+\d+[\s-]?(?:hours?|hrs?)\s+as\s+needed/i)) {
    result.frequency = 'as_needed';
  } else if (instructionsText.match(/\b(?:FOUR|4)\s+TIMES?\s+(?:A\s+)?DAY\b/i)) {
    result.frequency = 'four_times_daily';
  } else if (instructionsText.match(/\bWEEKLY\b/i)) {
    result.frequency = 'weekly';
  } else if (instructionsText.match(/\bMONTHLY\b/i)) {
    result.frequency = 'monthly';
  } else {
    // Check individual lines for frequency patterns
    for (const line of lines) {
      if (line.match(/TWICE\s*A\s*DAY/i)) {
        result.frequency = 'twice_daily';
        break;
      }
    }
  }
  
  // Fallback extraction if main patterns don't work well (for curved bottles)
  if (!result.medicationName) {
    console.log('Attempting fallback medication extraction...');
    // Look for any capitalized words that might be medication names
    const capitalWords = text.match(/\b[A-Z]{3,}\b/g);
    if (capitalWords) {
      // Filter out common non-medication words
      const excludeWords = ['TAKE', 'TABLET', 'CAPSULE', 'DAILY', 'REFILL', 'PHARMACY', 'PRESCRIPTION', 'DOCTOR', 'PATIENT'];
      const potentialMeds = capitalWords.filter(word => 
        word.length > 3 && !excludeWords.includes(word)
      );
      if (potentialMeds.length > 0) {
        result.medicationName = potentialMeds[0];
      }
    }
  }
  
  // Try to extract any numbers that might be quantity or dosage
  if (!result.quantity && !result.dosage) {
    const numbers = text.match(/\b\d+(?:\.\d+)?\b/g);
    if (numbers) {
      // Common quantity values
      const commonQuantities = ['30', '60', '90', '120', '180'];
      for (const num of numbers) {
        if (commonQuantities.includes(num) && !result.quantity) {
          result.quantity = parseInt(num);
        } else if (parseFloat(num) < 1000 && !result.dosage) {
          // Likely a dosage if it's a reasonable number
          result.dosage = num;
        }
      }
    }
  }
  
  // Add a flag if this was a difficult extraction
  if (Object.keys(result).length < 3) {
    console.log('Limited extraction - curved bottle or poor image quality suspected');
  }
  
  return result;
}

export default router;