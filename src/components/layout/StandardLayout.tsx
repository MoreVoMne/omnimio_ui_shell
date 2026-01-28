/**
 * Standard Layout Component
 * Provides consistent header and footer across all screens
 * 
 * Layout Template:
 * - Content containers use `w-full` (not `max-w-6xl`) to span full width
 * - Sticky content and main content both use `w-full` for consistent alignment
 * - Padding is handled by parent containers (e.g., `px-6 sm:px-8 lg:px-12`)
 * - Elements inside containers align to edges: left-aligned content, right-aligned filters/actions
 * 
 * Header Template:
 * - Height: `min-h-[100px]` with `py-6` padding
 * - Back button: `mb-2` margin-bottom
 * - Title (h1): Use `text-serif-title` class (responsive: 24px mobile, 30px tablet, 36px desktop)
 * - Title positioning: `mt-1` margin-top, positioned below back button with `pl-4` if back button exists
 * - Footer: `min-h-[80px]` for consistency
 * 
 * Sticky Content Template (required on all screens):
 * - Container padding: `pt-4 px-6 pb-4 sm:pt-5 sm:px-8 sm:pb-5 lg:pt-6 lg:px-12 lg:pb-6` (top and bottom padding match)
 * - Text wrapper: `mb-2.5 text-left`
 * - Text style: Use `text-mono-body` class (responsive: 10px mobile, 12px tablet, 14px desktop)
 * - Border appears on scroll: `border-b border-charcoal/20` when `isScrolled === true`
 * - All screens should include `stickyContent` prop with contextual instructions
 * 
 * Typography Classes (from index.css):
 * - text-mono-xs: 8px (tiny labels)
 * - text-mono-sm: 9px (buttons)
 * - text-mono-base: 10px (default)
 * - text-mono-md: 12px
 * - text-mono-body: responsive 10px → 12px → 14px
 * - text-mono-body-caps: responsive with uppercase
 * - text-mono-header: 10px with extra tracking
 * - text-serif-title: responsive 24px → 30px → 36px
 * - text-serif-xl: 20px
 * - text-serif-lg: 18px
 * - text-btn: 9px button text
 */

import React, { useState, useEffect, useRef } from 'react';

// Thin arrow icon (pattern-cutting style)
const ThinArrowLeft = () => (
  <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 1L2 5L7 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export interface StandardLayoutProps {
  children: React.ReactNode;
  header: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightContent?: React.ReactNode;
  };
  footer?: {
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    fullWidth?: boolean; // If true, footer content takes full width
    containerClassName?: string;
    contentClassName?: string;
  };
  toolbar?: React.ReactNode;
  stickyContent?: React.ReactNode; // Content that stays fixed at top of scrollable area
  stickyBorder?: boolean; // Show bottom border on sticky content (default: false)
  contentScroll?: 'auto' | 'none';
}

const StandardLayout: React.FC<StandardLayoutProps> = ({
  children,
  header,
  footer,
  toolbar,
  stickyContent,
  stickyBorder = false,
  contentScroll = 'auto',
}) => {
  const hasBack = header.showBack !== false && !!header.onBack;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrollable = contentScroll !== 'none';
  const resolvedStickyContent = stickyContent ?? (header.subtitle ? (
    <div className="mb-2.5 text-left">
      <p className="text-mono-body text-charcoal">
        {header.subtitle}
      </p>
    </div>
  ) : null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !resolvedStickyContent || !isScrollable) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [resolvedStickyContent, isScrollable]);

  return (
    <div className="min-h-screen w-full bg-cream text-charcoal p-[3px] lg:p-[5px]">
      <div className="w-full border border-charcoal bg-cream relative overflow-hidden rounded-[20px] sm:rounded-[24px] md:rounded-[32px] flex flex-col h-[calc(100vh-6px)] lg:h-[calc(100vh-10px)]">
        {/* Header - Fixed height */}
        <div className="border-b border-charcoal/60 px-4 sm:px-6 py-6 flex items-start justify-between shrink-0 min-h-[100px]">
          <div className="flex-1">
            {hasBack && (
              <button
                onClick={header.onBack}
                className="mb-2 inline-flex items-center gap-2 text-mono-base hover:underline"
                aria-label="Back"
              >
                <ThinArrowLeft />
                <span>Back</span>
              </button>
            )}
            <h1 className="text-serif-title text-charcoal">
              {header.title}
            </h1>
          </div>
          {header.rightContent && (
            <div className={`flex items-center gap-3 ml-4 ${hasBack ? 'mt-9' : ''}`}>
              {header.rightContent}
            </div>
          )}
        </div>

        {/* Toolbar (optional) */}
        {toolbar && (
          <div className="border-b border-charcoal/20 bg-cream/50 shrink-0">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              {toolbar}
            </div>
          </div>
        )}

        {/* Main Content - Scrollable */}
        <div
          ref={scrollContainerRef}
          className={
            isScrollable
              ? 'flex-1 overflow-y-auto min-h-0'
              : 'flex-1 min-h-0 overflow-hidden flex flex-col'
          }
        >
          {/* Sticky content (subtitle only, border appears on scroll) */}
          {resolvedStickyContent && (
            <div className={`sticky top-0 z-20 bg-cream transition-colors ${isScrolled ? 'border-b border-charcoal/20' : stickyBorder ? 'border-b border-charcoal/10' : ''}`}>
              <div className="bg-cream/30 sticky-padding">
                <div className="w-full">
                  {resolvedStickyContent}
                </div>
              </div>
            </div>
          )}
          {/* Main content wrapper with consistent padding */}
          {isScrollable ? (
            <div className="bg-cream/30 content-padding-full">
              <div className="w-full">
                {children}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col bg-cream/30">
              <div className="w-full flex-1 min-h-0 flex flex-col">
                {children}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed height */}
        {footer && (
          <div
            className={`border-t border-charcoal/60 bg-cream shrink-0 min-h-[80px] flex items-center ${footer.containerClassName ?? ''}`}
          >
            {footer.fullWidth ? (
              // Full width footer content
              <div className={`w-full ${footer.contentClassName ?? ''}`}>
                {footer.leftContent || footer.rightContent}
              </div>
            ) : (
              // Standard footer with left/right layout
              footer.leftContent || footer.rightContent ? (
                <div className={`w-full flex items-center px-4 sm:px-6 lg:px-8 ${footer.leftContent ? 'justify-between' : 'justify-end'} ${footer.contentClassName ?? ''}`}>
                  {/* Left side - Context info */}
                  {footer.leftContent && (
                    <div className="flex gap-6 sm:gap-8">
                      {footer.leftContent}
                    </div>
                  )}
                  
                  {/* Right side - Buttons */}
                  {footer.rightContent && (
                    <div className="flex gap-3">
                      {footer.rightContent}
                    </div>
                  )}
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Standard Button Component
export interface StandardButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const StandardButton: React.FC<StandardButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
}) => {
  const baseClasses = 'px-4 py-2 border border-charcoal text-btn transition-all flex items-center gap-2';
  
  const variantClasses = variant === 'primary'
    ? 'bg-charcoal text-cream hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'bg-cream text-charcoal hover:bg-desk disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
};

// Footer Info Item Component
export interface FooterInfoItemProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

export const FooterInfoItem: React.FC<FooterInfoItemProps> = ({ label, value, valueClassName }) => {
  return (
    <div className="flex flex-col">
      <span className="text-mono-sm text-muted-light">
        {label}
      </span>
      <span className={`text-mono-body ${valueClassName ?? 'text-charcoal'}`}>
        {value}
      </span>
    </div>
  );
};

export default StandardLayout;

