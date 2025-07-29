'use client'

type ConfirmModalProps = {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  onClose?: () => void;   // ✅ モーダルを閉じる即時処理を呼べるよう追加（オプション）
};

export default function ConfirmModal({
  isOpen,
  title = '確認',
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'キャンセル',
  onClose
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // ✅ OKボタン押した時の即時閉じる処理
  const handleConfirmClick = () => {
    if (onClose) onClose();   // ✅ 呼び出し元で setConfirmModalOpen(false) を即座に実行
    onConfirm();              // ✅ 予約確定処理はそのまま呼ぶ
  };

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

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          {/* キャンセルボタン */}
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#ccc',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>

          {/* ✅ OKボタン（押した瞬間にモーダル閉じる） */}
          <button
            onClick={handleConfirmClick}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#007BFF',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'transform 0.1s ease'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {confirmText}
          </button>

        </div>
      </div>
    </div>
  );
}
