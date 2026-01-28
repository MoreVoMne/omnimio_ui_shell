
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ConfigurationStateV2, Product } from '../types-tree';
import { OmniSentence } from './OmniSentence';
import { IdentityTagV2 } from './IdentityTagV2';
import { AdminControls } from './AdminControls';
import { X, ArrowRight, ArrowLeft, Menu } from 'lucide-react';
import logoUrl from '../logo.svg';

interface AdminControlsProps {
  isOpen: boolean;
  onToggle: () => void;
  onUploadModel: (file: File) => void;
  onUploadTexture: () => void;
  onClearModel: () => void;
  hasCustomModel: boolean;
  viewMode: string;
  onSetViewMode: (mode: any) => void;
  activePart: string | null;
  uiMode: string;
  onSetUiMode: (mode: string) => void;
  decalEditor: any;
  hotspotEditor: any;
}

interface OmniLayoutProps {
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeIdOrSelection: string) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  onLoginRequest: () => void;
  onPartHighlight?: (partId: string | null) => void;
  highlightedPart?: string | null;
  adminProps?: Omit<AdminControlsProps, 'isOpen' | 'onToggle' | 'embedded'>;
}

export type OmniMode = 'sentence' | 'tag' | 'community' | 'info';

export const OmniLayout: React.FC<OmniLayoutProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
  highlightedPart,
  adminProps,
}) => {
  const [activeMode, setActiveMode] = useState<OmniMode>('sentence');
  const [showAdmin, setShowAdmin] = useState(false);

  // Helper to close overlay
  const closeOverlay = () => setActiveMode('sentence');

  return (
    <>
      <style>{`

        .omni-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 40;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
        }

        /* --- NOTCHES & TITLE --- */
        .omni-title-block {
          position: absolute;
          top: 2rem;
          left: 0;
          right: 0;
          padding: 0 1.5rem;
          display: grid;
          grid-template-columns: 44px 1fr 44px;
          align-items: center;
          pointer-events: none; /* don't block the scene; enable on interactive children */
          z-index: 45;
        }

        .omni-brand {
          justify-self: center;
          pointer-events: auto;
          display: flex;
          align-items: center;
          color: #C20000;
        }

        .omni-top-spacer {
          width: 44px;
          height: 1px;
        }

        .omni-model-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #1a1a1a;
          line-height: 1;
        }

        .omni-logo {
          height: clamp(24px, 3.2vw, 44px);
          width: auto;
          display: block;
          object-fit: contain;
          color: #C20000;
        }

        /* Portrait mobile: make logo ~10% bigger */
        @media (max-width: 768px) and (orientation: portrait) {
          .omni-logo {
            height: clamp(26.4px, 3.52vw, 48.4px);
          }
        }

        /* RIGHT DOCK CONTAINER */
        .omni-right-dock {
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 0; /* unified block; separators handled on items */
            z-index: 45;
            pointer-events: auto;
            background: #F8F5F0;
            border: 1px dashed rgba(26, 26, 26, 0.35);
            border-right: none;
            border-radius: 4px 0 0 4px;
            overflow: hidden;
            right: -1px; /* sit flush to the viewport edge */
        }

        /* Mobile: move the dock into the top half of the screen */
        @media (max-width: 1023px) {
          .omni-right-dock {
            top: 12vh;
            transform: none;
          }
        }

        .omni-notch {
          background: transparent;
          border: none;
          border-radius: 0;
          padding: 1rem 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          right: 0;
        }

        .omni-notch + .omni-notch {
          border-top: 1px dashed rgba(26, 26, 26, 0.25);
        }

        .omni-notch:hover {
          background: #fff;
        }
        
        .omni-notch.active {
            background: #1a1a1a;
            color: #fff;
        }

        .notch-label {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: inherit;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .omni-notch.active .notch-label {
            color: #fff;
        }


        /* --- OVERLAYS --- */
        .omni-overlay-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(248, 245, 240, 0.85);
          backdrop-filter: blur(8px);
          z-index: 50;
          pointer-events: auto;
        }

        .omni-panel {
          position: absolute;
          top: 0;
          bottom: 0;
          background: #F8F5F0;
          z-index: 60;
          pointer-events: auto;
          display: flex;
          flex-direction: column;
          border-left: 1px solid #1a1a1a;
          overflow: hidden;
        }

        .omni-panel.right {
          right: 0;
          width: 100%;
          max-width: 480px;
        }

        .omni-panel.left {
          left: 0;
          width: 100%;
          max-width: 320px;
          border-right: 1px solid #1a1a1a;
          border-left: none;
        }
        
        .omni-panel.left .omni-content {
          overflow: visible !important;
          overflow-y: visible !important;
          padding-bottom: 1.5rem;
        }

        .omni-menu-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
            margin-right: 0.5rem;
            color: #1a1a1a;
            pointer-events: auto; /* overrides parent pointer-events:none */
            justify-self: start;
            margin-right: 0;
        }

        .omni-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #1a1a1a;
          min-height: 80px;
        }

        .omni-title {
          font-family: 'PP Editorial Old', serif;
          font-feature-settings: "liga" 1, "dlig" 1, "calt" 1, "swsh" 1, "salt" 1, "ss01" 1;
          font-size: 1.5rem;
          font-style: italic;
          color: #1a1a1a;
        }

        .omni-close {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        
        .omni-close:hover {
          opacity: 1;
        }

        .omni-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          padding-bottom: 6rem;
        }
        
        .omni-mobile-footer {
          display: none;
        }

        /* Responsive overrides */
        @media (max-width: 768px) {
          .omni-title-block {
              top: 1rem;
              padding: 0 1rem;
          }
          
          /* Mobile: keep the dock in the top third (not vertically centered) */
          .omni-right-dock {
              top: 10vh;
              bottom: auto;
              right: 0;
              transform: none;
              gap: 0;
              border-radius: 6px 0 0 6px;
          }

          .omni-notch {
             padding: 1rem 0.5rem;
          }
          
          .notch-label {
             font-size: 0.55rem;
          }

          .omni-panel.right {
            max-width: 100%;
            border-left: none; /* Remove left border on mobile full-screen */
          }
          
          .omni-panel {
              padding-top: env(safe-area-inset-top); 
          }
          
          .omni-mobile-footer {
             display: flex;
             justify-content: center;
             padding: 1.5rem;
             border-top: 1px solid rgba(0,0,0,0.06);
             background: #F8F5F0;
             margin-top: auto;
          }
          
          .omni-close-btn-mobile {
              width: 100%;
              padding: 1rem;
              background: #1a1a1a;
              color: #F8F5F0;
              font-family: 'JetBrains Mono', monospace;
              text-transform: uppercase;
              font-size: 0.7rem;
              letter-spacing: 0.1em;
              border: none;
              cursor: pointer;
          }
        }

        /* Panel content is rendered by IdentityTagV2 (original widget) */
      `}</style>

      <div className="omni-container">
        
        {/* TOP LEFT TITLE */}
        <div className="omni-title-block">
          <button className="omni-menu-btn" onClick={() => setShowAdmin(true)} aria-label="Menu">
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <div className="omni-brand">
            <img className="omni-logo" src={logoUrl} alt="OMNIMIO" />
          </div>
          <div className="omni-top-spacer" aria-hidden="true" />
        </div>

        {/* RIGHT DOCK - STACKED TABS */}
        <div className="omni-right-dock">
            
            <button 
                className={`omni-notch ${activeMode === 'info' ? 'active' : ''}`}
                onClick={() => setActiveMode(activeMode === 'info' ? 'sentence' : 'info')}
                aria-label="Info"
            >
                <div className="notch-label">
                    Info
                </div>
            </button>

            <button 
                className={`omni-notch ${activeMode === 'community' ? 'active' : ''}`}
                onClick={() => setActiveMode(activeMode === 'community' ? 'sentence' : 'community')}
                aria-label="Explore & Remix"
            >
                <div className="notch-label">
                    Explore & Remix
                </div>
            </button>

            <button 
                className={`omni-notch ${activeMode === 'tag' ? 'active' : ''}`}
                onClick={() => setActiveMode(activeMode === 'tag' ? 'sentence' : 'tag')}
                aria-label="Your Build"
            >
                <div className="notch-label">
                    Your Build
                </div>
            </button>

        </div>
        
        {/* SENTENCE LAYER (Always visible at bottom) */}
        <OmniSentence
          configuration={configuration}
          product={product}
          onNodeClick={onNodeClick}
          totalPrice={totalPrice}
          onOpenPrice={onOpenPrice}
          onLoginRequest={onLoginRequest}
          onPartHighlight={onPartHighlight}
          highlightedPart={highlightedPart}
          onOpenMode={setActiveMode}
        />

        <AnimatePresence>
          {showAdmin && (
            <motion.div
              className="omni-panel left"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
               <div className="omni-header" style={{ justifyContent: 'space-between', borderBottom: 'none', padding: '1.5rem 2rem' }}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal">v2.0 / Studio</span>
                  <button className="omni-close" onClick={() => setShowAdmin(false)}>
                    <X size={24} strokeWidth={1} />
                  </button>
               </div>
               <div className="omni-content" style={{ padding: '0 2rem 2rem 2rem', overflowY: 'auto' }}>
                  <div className="mb-8">
                     <h2 className="font-serif text-4xl italic text-charcoal">Admin Studio</h2>
                     <div className="w-12 h-[2px] bg-accent mt-4" />
                  </div>
                  
                  {adminProps ? (
                      <AdminControls 
                          {...adminProps}
                          isOpen={true} 
                          onToggle={() => {}} 
                          embedded={true} 
                      />
                  ) : (
                      <div className="text-sm font-mono text-gray-500">
                          Admin controls not available
                      </div>
                  )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
            .admin-menu-item {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.8rem;
                text-transform: uppercase;
                padding: 1.25rem 0;
                border-bottom: 1px solid rgba(0,0,0,0.1);
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: padding-left 0.2s, color 0.2s;
            }
            .admin-menu-item:hover {
                padding-left: 0.5rem;
                color: #C20000; /* Accent color */
            }
        `}</style>

        {/* OVERLAYS */}
        <AnimatePresence>
          {(activeMode !== 'sentence' || showAdmin) && (
            <motion.div 
              className="omni-overlay-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                  closeOverlay();
                  setShowAdmin(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* RIGHT PANEL (Unified for all modes) */}
        <AnimatePresence>
          {activeMode !== 'sentence' && (
            <motion.div
              className="omni-panel right"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) closeOverlay();
              }}
            >
              <div className="omni-header" style={{ borderBottom: 'none', padding: '0.5rem 1rem', minHeight: 'auto', justifyContent: 'flex-start' }}>
                <button className="omni-close" onClick={closeOverlay}>
                  <X size={24} strokeWidth={1} />
                </button>
              </div>

              {/* EXACT original panel widget (tabs + content + styling) */}
              <div className="omni-content" style={{ padding: 0 }}>
                <IdentityTagV2
                  expanded={true}
                  onToggle={closeOverlay}
                  hideTabBar={true}
                  embedded={true}
                  initialTab={
                    activeMode === 'info'
                      ? 'INFO'
                      : activeMode === 'community'
                        ? 'GALLERY'
                        : 'CUSTOMIZE'
                  }
                  configuration={configuration}
                  product={product}
                  onNodeClick={onNodeClick}
                  totalPrice={totalPrice}
                  onOpenPrice={onOpenPrice}
                  onLoginRequest={onLoginRequest}
                />
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};
