import React, { useState, useRef } from 'react'
import { Button, Label } from '@medimate/components'
import { Upload, Camera, X, Loader2 } from 'lucide-react'
import { prescriptionOCR } from '../services/ocr'
import toast from 'react-hot-toast'

interface PrescriptionUploadProps {
  onDataExtracted: (data: any) => void
}

export function PrescriptionUpload({ onDataExtracted }: PrescriptionUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload and process
    await processImage(file)
  }

  const processImage = async (file: File) => {
    setIsUploading(true)
    
    console.log('🔍 [OCR Debug] Starting OCR process...')
    console.log('🔍 [OCR Debug] File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    })
    
    try {
      // Extract text using OCR with the file blob
      console.log('🔍 [OCR Debug] Calling prescriptionOCR.extractMedicationData...')
      const result = await prescriptionOCR.extractMedicationData(file)
      
      console.log('🔍 [OCR Debug] OCR Result:', {
        data: result.data,
        confidence: result.confidence,
        rawTextLength: result.rawText?.length || 0,
        rawTextPreview: result.rawText?.substring(0, 200) + '...'
      })
      
      if (result.data && Object.keys(result.data).length > 0) {
        toast.success('Prescription data extracted successfully!')
        
        // Map extracted data to form fields
        const extractedData = {
          name: result.data.name || '',
          dosage: result.data.dosage || '',
          unit: result.data.unit || 'mg',
          instructions: result.data.instructions || '',
          prescribedBy: result.data.prescribedBy || '',
          quantity: result.data.quantity || '',
          frequency: result.data.frequency || 'once_daily',
        }
        
        console.log('🔍 [OCR Debug] Extracted data being passed to form:', extractedData)
        onDataExtracted(extractedData)
        
        // Show confidence level
        if (result.confidence < 0.7) {
          toast('Please verify the extracted information', {
            icon: '⚠️',
            duration: 5000,
          })
        }
        
        // Show full raw text for debugging
        console.log('🔍 [OCR Debug] Full Raw Text:', result.rawText)
      } else {
        console.log('🔍 [OCR Debug] No data extracted from OCR result')
        toast.error('Could not extract prescription information from the image')
        
        // If we got raw text but couldn't parse it, show it to the user
        if (result.rawText && result.rawText.length > 10) {
          toast('Tip: The image may be too curved or blurry. Try taking a photo of the flattest part of the label.', {
            icon: '💡',
            duration: 6000,
          })
          
          // Still pass empty data to allow manual entry
          onDataExtracted({
            name: '',
            dosage: '',
            unit: 'mg',
            instructions: '',
            prescribedBy: '',
            quantity: '',
            frequency: 'once_daily',
          })
        }
      }
    } catch (error: any) {
      console.error('🔍 [OCR Debug] OCR error:', error)
      console.error('🔍 [OCR Debug] Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      })
      toast.error('Failed to process image. Please try again.')
    } finally {
      setIsUploading(false)
      console.log('🔍 [OCR Debug] OCR process completed')
    }
  }

  const clearImage = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Quick Fill from Prescription</Label>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearImage}
            className="h-8 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Processing prescription...
                </p>
              </>
            ) : (
              <>
                <div className="flex gap-3">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Upload prescription photo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Take a clear photo of your prescription label
                  </p>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium">Tips for best results:</p>
                  <ul className="text-left space-y-0.5">
                    <li>• Flatten the label if possible</li>
                    <li>• Use good lighting, avoid shadows</li>
                    <li>• Hold camera parallel to text</li>
                    <li>• For curved bottles, focus on the flattest part</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border">
          <img
            src={preview}
            alt="Prescription preview"
            className="w-full h-48 object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Extracting prescription data...</p>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Your photo will be processed securely and deleted immediately after extraction
      </p>
    </div>
  )
}