import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut } from 'lucide-react';
import { createPortal } from 'react-dom';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "destructive" // "destructive" or "default"
}) => {
  if (!isOpen) return null;

  const isDestructive = variant === "destructive";
  const Icon = isDestructive ? AlertTriangle : LogOut;
  const iconBgClass = isDestructive ? "bg-red-500/10" : "bg-primary/10";
  const iconTextClass = isDestructive ? "text-red-500" : "text-primary";

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full ${iconBgClass} flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 ${iconTextClass}`} />
          </div>
          <h2 className="text-lg font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button 
              variant={isDestructive ? "destructive" : "default"}
              onClick={onConfirm} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Please wait...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
