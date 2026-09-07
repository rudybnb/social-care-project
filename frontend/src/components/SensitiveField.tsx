import React, { useState, useCallback, useEffect, useRef } from 'react';

interface SensitiveFieldProps {
  value: string | null | undefined;
  label: string;
  displayPrefix?: string;
}

const SensitiveField: React.FC<SensitiveFieldProps> = ({ value, label, displayPrefix = '' }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const heldRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const maskValue = useCallback(() => {
    heldRef.current = false;
    setIsRevealed(false);
  }, []);

  const startReveal = useCallback(() => {
    heldRef.current = true;
    setIsRevealed(true);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startReveal();
  }, [startReveal]);

  const handleMouseUp = useCallback(() => {
    if (heldRef.current) maskValue();
  }, [maskValue]);

  const handleMouseLeave = useCallback(() => {
    if (heldRef.current) maskValue();
  }, [maskValue]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    startReveal();
  }, [startReveal]);

  const handleTouchEnd = useCallback(() => {
    if (heldRef.current) maskValue();
  }, [maskValue]);

  const handleTouchCancel = useCallback(() => {
    if (heldRef.current) maskValue();
  }, [maskValue]);

  useEffect(() => {
    const handleWindowBlur = () => {
      if (heldRef.current) maskValue();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && heldRef.current) maskValue();
    };

    const handleBeforePrint = () => {
      if (heldRef.current) maskValue();
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [maskValue]);

  const hasValue = value && value.trim() !== '' && value !== '—';
  const masked = '••••••••••••';
  const displayValue = hasValue ? `${displayPrefix}${value}` : '—';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        color: '#9ca3af',
        fontSize: '14px',
        padding: '10px 0',
        flex: 1,
        userSelect: 'none',
        letterSpacing: isRevealed && hasValue ? 'normal' : (hasValue ? '2px' : 'normal')
      }}>
        {isRevealed && hasValue ? displayValue : (hasValue ? masked : '—')}
      </div>
      {hasValue && (
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            padding: '6px 10px',
            backgroundColor: isRevealed ? '#4f46e5' : '#3a3a3a',
            color: isRevealed ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            touchAction: 'none',
            lineHeight: '1'
          }}
          aria-label={`Hold to reveal ${label}`}
        >
          {isRevealed ? '👁 Releasing...' : '🔒 Hold to view'}
        </button>
      )}
    </div>
  );
};

export default SensitiveField;
