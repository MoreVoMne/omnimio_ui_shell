/**
 * QuizCard - Shared bottom-center card component for wizard questions
 * Used in Screen 2 for capability configuration
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface QuizCardProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showNext?: boolean;
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({
  title,
  subtitle,
  onBack,
  onNext,
  onSkip,
  nextLabel = 'Continue',
  nextDisabled = false,
  showNext = true,
  children,
  className = '',
  collapsed = false,
}) => {
  if (collapsed) {
    // Collapsed mode for selection
    return (
      <div className={`bg-cream border-t border-charcoal/20 px-6 py-4 ${className}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
            {title}
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-cream border-t border-charcoal/20 ${className}`}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          {subtitle && (
            <div className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60 mb-2">
              {subtitle}
            </div>
          )}
          <h2 className="font-serif text-2xl md:text-3xl italic">{title}</h2>
        </div>

        {/* Content */}
        <div className="mb-6">{children}</div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {onSkip && (
              <button
                onClick={onSkip}
                className="border border-charcoal/30 font-mono text-[10px] uppercase tracking-widest py-3 px-6 hover:border-charcoal hover:bg-white transition-colors"
              >
                Skip
              </button>
            )}
            {showNext && onNext && (
              <button
                onClick={onNext}
                disabled={nextDisabled}
                className={`font-mono text-[10px] uppercase tracking-widest py-3 px-8 transition-colors ${
                  nextDisabled
                    ? 'bg-charcoal/20 text-charcoal/40 cursor-not-allowed'
                    : 'bg-charcoal text-cream hover:bg-charcoal/90'
                }`}
              >
                {nextLabel} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
