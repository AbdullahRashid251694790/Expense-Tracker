/**
 * Confirm Dialog Component
 * Cross-platform replacement for window.confirm()
 * Works properly on Android WebView
 */

import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={false}
    >
      <div className="text-center">
        {variant !== 'default' && (
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            variant === 'danger' ? 'bg-error/10' : 'bg-warning/10'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              variant === 'danger' ? 'text-error' : 'text-warning'
            }`} />
          </div>
        )}

        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h3>

        <p className="text-text-secondary text-sm">
          {message}
        </p>
      </div>

      <ModalFooter className="justify-center">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={handleConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
