import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title,
  description, 
  confirmText,
  cancelText,
  Icon = AlertTriangle,
  isDanger = true
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // дефолтні тексти, якщо вони не передані через пропси
  const finalConfirmText = confirmText || t('common.buttons.delete');
  const finalCancelText = cancelText || t('common.buttons.cancel');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');
    try {
      await onConfirm(); 
      onClose();
    } catch (err) {
      setError(err.message || t('common.errors.unexpected'));
    } finally {
      setIsLoading(false);
    }
  };

  const iconColor = isDanger ? "#ef4444" : "var(--text-main)";
  const iconBg = isDanger ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 255, 255, 0.08)";
  const confirmBtnClass = isDanger ? "btn-modal-action btn-modal-danger" : "btn-modal-action btn-modal-primary";

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} 
      style={{ maxWidth: '420px', padding: '2rem' }}>
        
        <button className="btn-close-modal" onClick={onClose}>
          <X size={24} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          
          <div style={{ background: iconBg, padding: '0.8rem', borderRadius: '50%' }}>
            <Icon size={32} color={iconColor} />
          </div>
          
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: 0 }}>
            {title}
          </h2>
          
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', margin: 0, fontSize: '0.95rem' }}>
            {description}
          </p>

          {error && <div className="general-error" style={{ width: '100%' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
            <button onClick={onClose} className="btn-modal-action btn-modal-cancel" disabled={isLoading}>
              {finalCancelText}
            </button>
            <button onClick={handleConfirm} className={confirmBtnClass} disabled={isLoading}>
              {isLoading ? t('common.buttons.wait') : finalConfirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;