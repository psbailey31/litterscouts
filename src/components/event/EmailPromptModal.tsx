import { useEffect, useRef } from 'react';

interface EmailPromptModalProps {
  onClose: () => void;
  onAddEmail: () => void;
  onContinue: () => void;
}

export function EmailPromptModal({ onClose, onAddEmail, onContinue }: EmailPromptModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => { document.removeEventListener('keydown', handleKeyDown); prev?.focus(); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="email-prompt-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div ref={modalRef} className="relative inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full z-10">
          <div className="bg-white px-6 pt-6 pb-4">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 id="email-prompt-title" className="text-lg font-semibold text-gray-900 mb-2">
                Add an Email Address?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                You don't have an email address registered. Adding one will allow you to receive notifications about event changes or cancellations.
              </p>
              <p className="text-xs text-gray-500">
                You'll be directed to your profile page where you can manage your account settings.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 space-y-2">
            <button
              onClick={onAddEmail}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Email Address
            </button>
            <button
              onClick={onContinue}
              className="w-full bg-white text-gray-700 py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
            >
              Continue Without Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
