import { useEffect, useCallback } from 'react';

function Lightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!images || images.length === 0) return null;

  return (
    <div
      className="modal is-active"
      onClick={onClose}
      style={{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      <div
        className="modal-background"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      ></div>

      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'auto',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 关闭按钮 */}
        <button
          className="modal-close is-large"
          aria-label="close"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        />

        {/* 左箭头 */}
        {images.length > 1 && (
          <button
            className="button is-dark is-medium"
            style={{
              position: 'absolute',
              left: '-3rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <span className="icon"><i className="fas fa-chevron-left"></i></span>
          </button>
        )}

        {/* 图片 */}
        <img
          src={images[currentIndex]}
          alt={`preview-${currentIndex}`}
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: '4px',
          }}
        />

        {/* 右箭头 */}
        {images.length > 1 && (
          <button
            className="button is-dark is-medium"
            style={{
              position: 'absolute',
              right: '-3rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <span className="icon"><i className="fas fa-chevron-right"></i></span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Lightbox;