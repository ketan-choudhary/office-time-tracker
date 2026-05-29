import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('ott-install-dismissed') === '1';
  });

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    if (isIOS()) {
      setShowIOS(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem('ott-install-dismissed', '1');
    setDismissed(true);
    setShowIOS(false);
    setDeferred(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (dismissed || isStandalone()) return null;
  if (!showIOS && !deferred) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(5rem+var(--safe-bottom))] z-50 animate-slide-up">
      <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-elevated">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-lg">
            ⏱
          </div>
          <div className="flex-1">
            <p className="font-semibold text-text-primary">Install Office Time Tracker</p>
            {showIOS ? (
              <p className="mt-1 text-sm text-text-secondary">
                Tap <span className="font-medium">Share</span> then{' '}
                <span className="font-medium">Add to Home Screen</span> for offline access.
              </p>
            ) : (
              <p className="mt-1 text-sm text-text-secondary">
                Add to your home screen for quick access and full offline support.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-text-muted"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
        {!showIOS && (
          <button type="button" onClick={install} className="btn-primary mt-3 w-full">
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
