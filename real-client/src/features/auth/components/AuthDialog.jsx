import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import AuthForm from "./AuthForm";
import "./AuthDialog.css";

function AuthDialog({ mode, onClose, onSwitchMode, onSubmit, onGoogleSignIn, authError }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const isOpen = Boolean(mode);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll("button:not(:disabled), input:not(:disabled)")];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    // Switching between sign-in and join replaces the form fields in place.
    if (mode) dialogRef.current?.querySelector('input:not([type="radio"])')?.focus();
  }, [mode]);

  if (!isOpen) return null;

  return (
    <div
      className="auth-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      role="presentation"
    >
      <section
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className="auth-dialog"
        role="dialog"
      >
        <div className="auth-dialog-top">
          <span className="auth-dialog-brand">Jogaar</span>
          <button aria-label="Close account dialog" className="auth-dialog-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={19} />
          </button>
        </div>
        {/* Forward callbacks to the form; the dialog itself owns no auth logic. */}
        <AuthForm
          key={mode}
          mode={mode}
          onGoogleSignIn={onGoogleSignIn}
          onSubmit={onSubmit}
          authError={authError}
          onSwitchMode={onSwitchMode}
          titleId={titleId}
        />
      </section>
    </div>
  );
}

export default AuthDialog;
