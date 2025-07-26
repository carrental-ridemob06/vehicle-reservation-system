'use client'

type ResultModalProps = {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
};

export default function ResultModal({
  isOpen,
  title = '結果',
  message,
  onClose,
  confirmText = 'OK'
}: ResultModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>{title}</h2>
        <p style={{ fontSize: '16px', marginBottom: '20px', whiteSpace: 'pre-line' }}>{message}</p>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
