import React, { useEffect, useMemo, useState } from 'react';
import { ConfigurationStateV2, Product } from '../types-tree';
import { SpecSentence } from './SpecSentence';

type Chapter = 'spec' | 'info' | 'community';

interface HangtagChaptersProps {
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeIdOrSelection: string) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  onLoginRequest: () => void;
  onPartHighlight?: (partId: string | null) => void;
  highlightedPart?: string | null;
}

export const HangtagChapters: React.FC<HangtagChaptersProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
  highlightedPart,
}) => {
  const [chapter, setChapter] = useState<Chapter>('spec');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Chapter rules:
  // - Info/Community always expand the tag (they need full canvas)
  // - Spec can be collapsed to a "peek"
  useEffect(() => {
    if (chapter !== 'spec') setIsExpanded(true);
  }, [chapter]);

  const size = useMemo(() => {
    if (isMobile) {
      if (!isExpanded && chapter === 'spec') return { height: '22vh', width: '100%' };
      if (chapter === 'spec') return { height: '46vh', width: '100%' };
      return { height: '70vh', width: '100%' };
    }
    // Desktop
    if (chapter === 'spec') return { height: isExpanded ? '520px' : '120px', width: 'min(520px, 100%)' };
    return { height: 'min(680px, 80vh)', width: 'min(720px, 100%)' };
  }, [chapter, isExpanded, isMobile]);

  return (
    <>
      <style>{`
        .ht-tag {
          position: relative;
          border: 1px solid rgba(0,0,0,1);
          background: rgba(248,245,240,1);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Right-edge "die-cut spine" */
        .ht-spine {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 34px;
          border-left: 1px solid rgba(0,0,0,1);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
          padding: 12px 0;
          background: rgba(248,245,240,1);
          z-index: 5;
        }

        .ht-spine-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 8px 0;
          opacity: 0.55;
        }

        .ht-spine-btn.active {
          opacity: 1;
          font-weight: 700;
        }

        /* Content area leaves room for spine */
        .ht-content {
          height: 100%;
          padding-right: 34px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .ht-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.12);
          gap: 12px;
        }

        .ht-title {
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          font-size: 18px;
          font-style: italic;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ht-subtitle {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          opacity: 0.5;
        }

        .ht-body {
          flex: 1;
          min-height: 0;
          overflow: auto;
        }

        .ht-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-top: 1px solid rgba(0,0,0,0.12);
        }

        .ht-btn {
          border: 1px solid rgba(0,0,0,1);
          background: transparent;
          padding: 10px 12px;
          cursor: pointer;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ht-btn-primary {
          background: rgba(0,0,0,1);
          color: rgba(248,245,240,1);
        }

        .ht-peek-toggle {
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.6;
          padding: 0;
        }
      `}</style>

      <div className="ht-tag" style={{ ...size }}>
        <div className="ht-spine" aria-label="Tag chapters">
          <button
            className={`ht-spine-btn ${chapter === 'spec' ? 'active' : ''}`}
            onClick={() => setChapter('spec')}
            aria-label="Spec chapter"
          >
            S
          </button>
          <button
            className={`ht-spine-btn ${chapter === 'info' ? 'active' : ''}`}
            onClick={() => setChapter('info')}
            aria-label="Info chapter"
          >
            I
          </button>
          <button
            className={`ht-spine-btn ${chapter === 'community' ? 'active' : ''}`}
            onClick={() => setChapter('community')}
            aria-label="Community chapter"
          >
            C
          </button>
        </div>

        <div className="ht-content">
          <div className="ht-header">
            <div style={{ minWidth: 0 }}>
              <div className="ht-title">{product.name}</div>
              <div className="ht-subtitle">
                {chapter === 'spec' ? 'Spec' : chapter === 'info' ? 'Info' : 'Community'}
              </div>
            </div>

            {chapter === 'spec' && (
              <button
                className="ht-peek-toggle"
                onClick={() => setIsExpanded((v) => !v)}
                aria-label={isExpanded ? 'Collapse tag' : 'Expand tag'}
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
            )}

            {chapter !== 'spec' && (
              <button className="ht-btn" onClick={() => setChapter('spec')}>
                Back to Customize
              </button>
            )}
          </div>

          <div className="ht-body">
            {chapter === 'spec' ? (
              <SpecSentence
                layout="embedded"
                configuration={configuration}
                product={product}
                onNodeClick={onNodeClick}
                totalPrice={totalPrice}
                onOpenPrice={onOpenPrice}
                onLoginRequest={onLoginRequest}
                onPartHighlight={onPartHighlight}
                highlightedPart={highlightedPart}
              />
            ) : chapter === 'info' ? (
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <div className="ht-subtitle">Delivery</div>
                  <div style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', fontSize: '16px' }}>
                    Made to order. Estimated production 10–14 days.
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div className="ht-subtitle">Care</div>
                  <div style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', fontSize: '16px' }}>
                    Store in dust bag. Avoid prolonged moisture. Condition as needed.
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div className="ht-subtitle">Warranty</div>
                  <div style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', fontSize: '16px' }}>
                    2-year workmanship warranty.
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div className="ht-subtitle">Materials / Provenance</div>
                  <div style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', fontSize: '16px' }}>
                    Documented spec + sourcing notes live here (hook for merchant-provided content).
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div className="ht-subtitle">Community designs</div>
                  <div style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', fontSize: '16px' }}>
                    Full-canvas gallery surface (filters, presets, remix/apply flows belong here).
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        border: '1px solid rgba(0,0,0,0.18)',
                        padding: '12px',
                        minHeight: '88px',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="ht-subtitle">Preset {i + 1}</div>
                      <div style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', fontSize: '16px' }}>
                        Tap to preview/apply
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Keep global actions consistent across chapters */}
          <div className="ht-actions">
            <button className="ht-btn" onClick={onLoginRequest}>
              Save
            </button>
            <button className="ht-btn" onClick={onOpenPrice}>
              Price
            </button>
            <button className="ht-btn ht-btn-primary">
              Add to Cart — £{totalPrice}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HangtagChapters;



