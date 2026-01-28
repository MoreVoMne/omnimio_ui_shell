import React, { useState } from 'react';
import { CheckCircle, ExternalLink, Plus, Layers, Save } from 'lucide-react';
import StandardLayout, { StandardButton } from '../layout/StandardLayout';

type ActivationStatus = 'not-activated' | 'activated' | 'skipped';

interface ActivationScreenProps {
  onNext: () => void;
  onBack: () => void;
}

const ActivationScreen: React.FC<ActivationScreenProps> = ({ onNext, onBack }) => {
  const [status, setStatus] = useState<ActivationStatus>('not-activated');

  const handleOpenThemeEditor = () => {
    // In real app, this would open Shopify theme editor with deep link
    window.open('https://admin.shopify.com/themes/current/editor', '_blank');
  };

  const handleMarkActivated = () => {
    setStatus('activated');
  };

  const handleSkip = () => {
    setStatus('skipped');
    onNext();
  };

  const steps = [
    {
      number: 1,
      icon: Plus,
      title: 'Add block',
      description: 'Click "Add block" in the theme editor sidebar',
    },
    {
      number: 2,
      icon: Layers,
      title: 'Choose Omnimio Customizer',
      description: 'Find and select "Omnimio Customizer" from the app blocks list',
    },
    {
      number: 3,
      icon: Save,
      title: 'Save',
      description: 'Click Save to publish the changes to your theme',
    },
  ];

  return (
    <StandardLayout
      header={{
        title: 'Enable Customizer',
        showBack: true,
        onBack,
      }}
      stickyContent={
        <div className="mb-2.5 text-left">
          <p className="text-mono-body text-muted-medium">
            Takes under a minute. You only do this once for the whole store.
          </p>
        </div>
      }
      footer={{
        rightContent: (
          <>
            {status === 'not-activated' && (
              <StandardButton variant="secondary" onClick={handleSkip}>
                Skip for now
              </StandardButton>
            )}
            <StandardButton onClick={onNext}>
              {status === 'activated' ? 'Continue' : 'I\'ve done this'}
            </StandardButton>
          </>
        ),
      }}
    >
      <div className="content-padding">
        <div className="max-w-2xl mx-auto">
          {/* Status Banner */}
          {status === 'activated' && (
            <div className="mb-8 p-4 bg-green/10 border border-green/20 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green flex-shrink-0" />
              <span className="text-mono-body text-charcoal">
                Activation complete — Omnimio is now enabled in your theme
              </span>
            </div>
          )}

          {status === 'skipped' && (
            <div className="mb-8 p-4 bg-yellow/10 border border-yellow/20 rounded-lg flex items-center gap-3">
              <span className="text-mono-body text-charcoal">
                You skipped activation. You'll need to complete this step before publishing.
              </span>
            </div>
          )}

          {/* Main CTA */}
          <div className="text-center mb-12">
            <button
              onClick={handleOpenThemeEditor}
              className="inline-flex items-center gap-3 px-8 py-4 bg-charcoal text-cream rounded-lg text-mono-md uppercase tracking-widest hover:bg-charcoal/90 transition-colors"
            >
              Open Theme Editor
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Steps Guide */}
          <div className="border border-charcoal/20 rounded-lg p-6 sm:p-8">
            <h3 className="text-mono-header text-muted mb-6">How to enable</h3>
            
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.number} className="flex gap-4">
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-charcoal text-cream flex items-center justify-center text-mono-sm">
                    {step.number}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <step.icon className="w-4 h-4 text-charcoal/60" />
                      <h4 className="text-serif-base text-charcoal font-medium">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-mono-body text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Confirmation */}
          {status === 'not-activated' && (
            <div className="mt-8 text-center">
              <button
                onClick={handleMarkActivated}
                className="text-mono-sm text-muted hover:text-charcoal underline underline-offset-4 transition-colors"
              >
                I've already done this
              </button>
            </div>
          )}
        </div>
      </div>
    </StandardLayout>
  );
};

export default ActivationScreen;
