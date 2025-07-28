// components/CopyModal.tsx
type Props = {
  isOpen: boolean;
  onClose: () => void;
  message: string;
};

export default function CopyModal({ isOpen, onClose, message }: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          width: '280px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#007bff' }}>
          ✅ コピー完了
        </h3>
        <p style={{ marginBottom: '16px', fontSize: '16px', color: '#333' }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            padding: '10px 16px',
            fontSize: '16px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
