import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import StandardLayout, { StandardButton } from '../layout/StandardLayout';

type ThemeStatus = 'checking' | 'compatible' | 'incompatible' | 'skipped';

interface ThemeCheckScreenProps {
  onNext: () => void;
  onBack: () => void;
}

const ThemeCheckScreen: React.FC<ThemeCheckScreenProps> = ({ onNext, onBack }) => {
  const [status, setStatus] = useState<ThemeStatus>('checking');

  // Simulate theme check on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock: theme is compatible (for demo purposes)
      setStatus('compatible');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    setStatus('skipped');
    onNext();
  };

  const handleOpenThemeEditor = () => {
    // In real app, this would open Shopify theme editor
    window.open('https://admin.shopify.com/themes', '_blank');
  };

  return (
    <StandardLayout
      header={{
        title: 'Check Theme Compatibility',
        showBack: true,
        onBack,
      }}
      stickyContent={
        <div className="mb-2.5 text-left">
          <p className="text-mono-body text-muted-medium">
            We need a Shopify theme that supports app blocks (Online Store 2.0).
          </p>
        </div>
      }
      footer={{
        rightContent: (
          <>
            {status === 'incompatible' && (
              <StandardButton variant="secondary" onClick={handleSkip}>
                Skip for now
              </StandardButton>
            )}
            <StandardButton 
              onClick={onNext} 
              disabled={status === 'checking'}
            >
              Continue
            </StandardButton>
          </>
        ),
      }}
    >
      <div className="content-padding flex items-center justify-center min-h-[400px]">
        <div className="max-w-md w-full">
          {/* Status Card */}
          <div className="border border-charcoal/20 rounded-lg p-8 text-center">
            {status === 'checking' && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-6 text-charcoal/40 animate-spin" />
                <h2 className="text-serif-xl text-charcoal mb-2">Checking your theme...</h2>
                <p className="text-mono-body text-muted">
                  This will only take a moment.
                </p>
              </>
            )}

            {status === 'compatible' && (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green" />
                <h2 className="text-serif-xl text-charcoal mb-2">Your theme is compatible</h2>
                <p className="text-mono-body text-muted mb-4">
                  Great! Your theme supports app blocks and is ready for Omnimio.
                </p>
                <div className="text-mono-sm text-muted-light uppercase tracking-widest">
                  Theme: Dawn 12.0
                </div>
              </>
            )}

            {status === 'incompatible' && (
              <>
                <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-yellow" />
                <h2 className="text-serif-xl text-charcoal mb-2">Your theme needs an upgrade</h2>
                <p className="text-mono-body text-muted mb-4">
                  Your current theme doesn't support app blocks. You'll need to switch to an Online Store 2.0 theme.
                </p>
                <button
                  onClick={handleOpenThemeEditor}
                  className="inline-flex items-center gap-2 text-mono-sm text-charcoal underline underline-offset-4 hover:text-accent transition-colors"
                >
                  Open Theme Editor
                  <ExternalLink className="w-3 h-3" />
                </button>
              </>
            )}

            {status === 'skipped' && (
              <>
                <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-yellow" />
                <h2 className="text-serif-xl text-charcoal mb-2">Theme check skipped</h2>
                <p className="text-mono-body text-muted">
                  You can continue setup, but you'll need a compatible theme to publish.
                </p>
              </>
            )}
          </div>

          {/* Help Link */}
          {(status === 'incompatible' || status === 'skipped') && (
            <div className="mt-6 text-center">
              <a
                href="https://help.shopify.com/en/manual/online-store/themes"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-mono-sm text-muted hover:text-charcoal transition-colors"
              >
                How to switch to a compatible theme
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </StandardLayout>
  );
};

export default ThemeCheckScreen;
