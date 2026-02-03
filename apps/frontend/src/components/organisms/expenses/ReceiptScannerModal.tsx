/**
 * ReceiptScannerModal Organism
 * Capture receipts and auto-extract expense data using OCR
 */

import { useState, useCallback, useRef } from 'react';
import { Camera, Upload, Scan, Check, RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import Tesseract from 'tesseract.js';

import { Modal, ModalFooter, Button, Spinner } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { parseReceiptText, type ParsedReceipt } from '@/lib/utils/receiptParser';
import { cn } from '@/lib/utils/cn';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtracted: (data: { amount: string; description: string; date: string }) => void;
}

type ScanStep = 'capture' | 'processing' | 'review';

export function ReceiptScannerModal({ isOpen, onClose, onExtracted }: ReceiptScannerModalProps) {
  const [step, setStep] = useState<ScanStep>('capture');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep('capture');
    setImageUrl(null);
    setOcrProgress(0);
    setParsedData(null);
    setError(null);
    setAmount('');
    setDescription('');
    setDate('');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const processImage = useCallback(async (imageDataUrl: string) => {
    setStep('processing');
    setOcrProgress(0);
    setError(null);

    try {
      const result = await Tesseract.recognize(imageDataUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const parsed = parseReceiptText(result.data.text);
      setParsedData(parsed);

      // Set editable fields
      setAmount(parsed.amount?.toFixed(2) || '');
      setDescription(parsed.description || '');
      setDate(parsed.date || new Date().toISOString().split('T')[0]);

      setStep('review');
    } catch (err) {
      setError('Failed to process receipt. Please try again.');
      setStep('capture');
    }
  }, []);

  const handleCameraCapture = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Camera on mobile
        const photo = await CapacitorCamera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          quality: 90,
        });

        if (photo.dataUrl) {
          setImageUrl(photo.dataUrl);
          await processImage(photo.dataUrl);
        }
      } else {
        // On web, use file input
        fileInputRef.current?.click();
      }
    } catch (err) {
      if ((err as Error).message !== 'User cancelled photos app') {
        setError('Failed to capture image. Please try again.');
      }
    }
  }, [processImage]);

  const handleGallerySelect = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const photo = await CapacitorCamera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
          quality: 90,
        });

        if (photo.dataUrl) {
          setImageUrl(photo.dataUrl);
          await processImage(photo.dataUrl);
        }
      } else {
        fileInputRef.current?.click();
      }
    } catch (err) {
      if ((err as Error).message !== 'User cancelled photos app') {
        setError('Failed to select image. Please try again.');
      }
    }
  }, [processImage]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
      await processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }, [processImage]);

  const handleConfirm = useCallback(() => {
    onExtracted({
      amount,
      description,
      date,
    });
    handleClose();
  }, [amount, description, date, onExtracted, handleClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Scan Receipt"
      description="Capture a receipt to auto-fill expense details"
      size="md"
    >
      {/* Hidden file input for web */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Step 1: Capture */}
      {step === 'capture' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCameraCapture}
              className="flex-1 p-6 bg-surface-muted rounded-bento border-2 border-dashed border-border hover:border-casha-primary hover:bg-casha-primary/5 transition-colors"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-casha-primary/10 rounded-full">
                  <Camera className="h-6 w-6 text-casha-primary" />
                </div>
                <span className="font-medium text-text-primary">Take Photo</span>
                <span className="text-xs text-text-muted">Use camera</span>
              </div>
            </button>

            <button
              onClick={handleGallerySelect}
              className="flex-1 p-6 bg-surface-muted rounded-bento border-2 border-dashed border-border hover:border-casha-primary hover:bg-casha-primary/5 transition-colors"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-casha-primary/10 rounded-full">
                  <Upload className="h-6 w-6 text-casha-primary" />
                </div>
                <span className="font-medium text-text-primary">Upload Image</span>
                <span className="text-xs text-text-muted">From gallery</span>
              </div>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-bento-sm">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <ModalFooter>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </ModalFooter>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 'processing' && (
        <div className="py-8">
          <div className="flex flex-col items-center gap-4">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Receipt"
                className="max-h-40 rounded-bento object-contain"
              />
            )}

            <div className="flex items-center gap-3">
              <Spinner size="lg" />
              <div>
                <p className="font-medium text-text-primary">Scanning receipt...</p>
                <p className="text-sm text-text-muted">{ocrProgress}% complete</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-surface-muted rounded-full h-2">
              <div
                className="bg-casha-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Edit */}
      {step === 'review' && (
        <div className="space-y-4">
          {/* Receipt preview */}
          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Receipt"
                className="w-full max-h-32 rounded-bento object-contain bg-surface-muted"
              />
              <button
                onClick={resetState}
                className="absolute top-2 right-2 p-1.5 bg-surface rounded-full shadow-md hover:bg-surface-hover"
              >
                <RefreshCw className="h-4 w-4 text-text-muted" />
              </button>
            </div>
          )}

          {/* Confidence indicator */}
          {parsedData && (
            <div className={cn(
              'flex items-center gap-2 p-2 rounded-bento-sm text-sm',
              parsedData.confidence >= 60 ? 'bg-success/10 text-success' :
              parsedData.confidence >= 30 ? 'bg-warning/10 text-warning' :
              'bg-error/10 text-error'
            )}>
              <Scan className="h-4 w-4" />
              <span>
                {parsedData.confidence >= 60 ? 'Good scan quality' :
                 parsedData.confidence >= 30 ? 'Some details may need adjustment' :
                 'Low quality - please verify details'}
              </span>
            </div>
          )}

          {/* Editable fields */}
          <FormField
            label="Amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <FormField
            label="Description"
            placeholder="Store name or item description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <FormField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <ModalFooter>
            <Button variant="secondary" onClick={resetState}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Rescan
            </Button>
            <Button onClick={handleConfirm} disabled={!amount}>
              <Check className="h-4 w-4 mr-2" />
              Use This Data
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
