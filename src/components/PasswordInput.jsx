import { useLayoutEffect, useRef, useState } from 'react';
import './PasswordInput.css';

export default function PasswordInput({ className = '', disabled, ...props }) {
  const [visible, setVisible] = useState(false);
  const input = useRef(null);
  const selection = useRef(null);
  useLayoutEffect(() => {
    const saved = selection.current;
    selection.current = null;
    if (saved && document.activeElement === input.current) input.current.setSelectionRange(saved.start, saved.end);
  }, [visible]);
  return <div className="bstore-password-field">
    <input {...props} ref={input} className={className} disabled={disabled} type={visible ? 'text' : 'password'} />
    <button type="button" className="bstore-password-eye" disabled={disabled}
      aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}
      onMouseDown={event => event.preventDefault()}
      onClick={() => {
        const field = input.current;
        if (document.activeElement === field && field.selectionStart !== null && field.selectionEnd !== null) selection.current = { start: field.selectionStart, end: field.selectionEnd };
        setVisible(current => !current);
      }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {visible && <path d="m3 3 18 18" />}
      </svg>
    </button>
  </div>;
}
