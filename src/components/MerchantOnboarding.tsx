import React from 'react';

interface MerchantOnboardingProps {
  onPathSelect: (path: 'model-ready' | 'need-model' | 'demo' | 'tour') => void;
  onSkip: () => void;
}

const OptionCard: React.FC<{
  title: string;
  subtitle: string;
  onClick: () => void;
  hasPattern?: boolean;
  showArrow?: boolean;
}> = ({ title, subtitle, onClick, hasPattern = false, showArrow = true }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className="w-full h-full text-left group relative p-6 lg:p-12 overflow-hidden cursor-pointer z-10 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-2"
    style={
      hasPattern
        ? {
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%231a1a1a' stroke-width='0.5' stroke-opacity='0.18'%3E%3Cline x1='0' y1='0' x2='0' y2='10'/%3E%3Cline x1='0' y1='0' x2='10' y2='0'/%3E%3Cline x1='5' y1='0' x2='5' y2='10' stroke-dasharray='0.5,0.5'/%3E%3Cline x1='0' y1='5' x2='10' y2='5' stroke-dasharray='0.5,0.5'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: '10px 10px',
          }
        : undefined
    }
  >
    {showArrow && (
      <div className="absolute right-4 sm:right-8 lg:right-16 top-1/2 -translate-y-1/2 pointer-events-none group-hover:translate-x-2 transition-transform duration-300 ease-out z-0">
        <svg
          className="w-16 sm:w-20 lg:w-28 h-auto"
          viewBox="0 0 120 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 100 L100 100 M100 100 L85 85 M100 100 L85 115"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-charcoal"
          />
          <line
            x1="20"
            y1="100"
            x2="100"
            y2="100"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2,4"
            className="text-charcoal"
          />
        </svg>
      </div>
    )}

    <div className={`relative z-10 ${showArrow ? 'pr-16 sm:pr-20 lg:pr-32' : ''}`}>
      <div className="mb-3 lg:mb-6">
        <span className="font-serif text-2xl lg:text-4xl xl:text-5xl text-charcoal leading-[0.9]">
          {title}
        </span>
      </div>
      <p className="font-mono text-[10px] lg:text-xs leading-relaxed text-charcoal uppercase tracking-wide max-w-md">
        {subtitle}
      </p>
    </div>
  </button>
);

const MerchantOnboarding: React.FC<MerchantOnboardingProps> = ({ onPathSelect, onSkip: _onSkip }) => {
  return (
    <div className="min-h-screen w-full bg-cream text-charcoal flex items-center justify-center p-[3px] lg:p-[5px]">
      <div className="w-full border border-charcoal bg-cream relative overflow-hidden rounded-[20px] sm:rounded-[24px] md:rounded-[32px] flex flex-col h-[calc(100vh-6px)] lg:h-[calc(100vh-10px)]">
        <div className="h-[60%] border-b border-charcoal grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-charcoal">
          <div className="p-6 sm:p-8 lg:p-12 xl:p-16 flex flex-col justify-center min-h-[40vh] md:min-h-0">
            <div className="mb-4 lg:mb-8">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-charcoal leading-[0.9] tracking-tight">
                Omnimio <br />
                <span className="italic text-charcoal/90">Customizer Studio</span>
              </h1>
              <div className="w-12 lg:w-16 h-[2px] bg-accent mt-2 lg:mt-4" />
            </div>

            <div className="max-w-md lg:max-w-lg">
              <p className="font-mono text-xs sm:text-sm lg:text-base leading-relaxed text-charcoal uppercase tracking-wide">
                Customers design. You get production files.
              </p>
            </div>
          </div>

          <OptionCard
            title="Start Setup"
            subtitle="Upload model, define options, set rules"
            onClick={() => onPathSelect('model-ready')}
            hasPattern
          />
        </div>

        <div className="flex-1 grid grid-cols-2 divide-x divide-charcoal border-b border-charcoal md:min-h-0 min-h-[25vh]">
          <OptionCard
            title="Try Demo"
            subtitle="See configured product in action"
            onClick={() => onPathSelect('demo')}
            showArrow={false}
          />

          <OptionCard
            title="Quick Tour"
            subtitle="Learn the setup workflow"
            onClick={() => onPathSelect('tour')}
            showArrow={false}
          />
        </div>

        <div className="p-4 lg:p-6 bg-charcoal text-cream flex flex-wrap items-center justify-center gap-3 lg:gap-6 shrink-0">
          <button
            onClick={() => onPathSelect('need-model')}
            className="font-mono text-[10px] lg:text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            Assets
          </button>
          <span className="font-mono text-base lg:text-lg tracking-widest">&bull;</span>
          <button
            onClick={() => {}}
            className="font-mono text-[10px] lg:text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            Integration
          </button>
          <span className="font-mono text-base lg:text-lg tracking-widest">&bull;</span>
          <button
            onClick={() => {}}
            className="font-mono text-[10px] lg:text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            FAQ
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerchantOnboarding;
