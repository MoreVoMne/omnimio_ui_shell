// FourCorners.tsx - The "Four Corners of the Atelier" Layout
// 1. Center Bottom: Narrative (Sentence UI) - Control
// 2. Top Right: Marketplace (Community) - Inspiration
// 3. Bottom Left: Assurance (Info) - Trust
// 4. Center Top/Floating: Deep Dive (Full Spec) - Power

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfigurationStateV2, Product } from '../types-tree';
import { SpecSentence } from './SpecSentence';
import { IdentityTagV2 } from './IdentityTagV2'; // Reuse for "Full Spec" if needed

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface FourCornersProps {
  configuration: ConfigurationStateV2;
  product: Product;
  onNodeClick: (nodeIdOrSelection: string) => void;
  totalPrice: number;
  onOpenPrice: () => void;
  onLoginRequest: () => void;
  onPartHighlight?: (partId: string | null) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1"/>
    <path d="M8 7V11M8 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HeartIcon = ({ filled = false }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"}>
    <path d="M8 14S1 9.5 1 5.5C1 3 3 1 5.5 1C7 1 8 2 8 2S9 1 10.5 1C13 1 15 3 15 5.5C15 9.5 8 14 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// 1. INFO MODAL (Bottom Left Trigger)
const InfoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="fc-backdrop"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div 
            className="fc-modal fc-info-modal"
            initial={{ opacity: 0, x: -20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="fc-modal-header">
              <span className="fc-modal-title">Specification & Care</span>
              <button className="fc-close-btn" onClick={onClose}><CloseIcon /></button>
            </div>
            <div className="fc-modal-content">
              <div className="fc-section">
                <span className="fc-label">Materials</span>
                <p className="fc-text">
                  Full-grain Tuscan leather. Hand-stitched with waxed linen thread. 
                  Edges are hand-painted and burnished for longevity.
                </p>
              </div>
              <div className="fc-section">
                <span className="fc-label">Hardware</span>
                <p className="fc-text">
                  Solid brass, unplated. Will develop a rich patina over time. 
                  Anti-tarnish coating available upon request.
                </p>
              </div>
              <div className="fc-section">
                <span className="fc-label">Delivery</span>
                <p className="fc-text">
                  Made to order in our London atelier. 
                  Lead time: 10–14 days. 
                  Global express shipping included.
                </p>
              </div>
              <div className="fc-section">
                <span className="fc-label">Warranty</span>
                <p className="fc-text">
                  Lifetime guarantee on all structural stitching and hardware.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// 2. COMMUNITY DRAWER (Top Right Trigger)
const CommunityDrawer = ({ isOpen, onClose, onLoginRequest }: { isOpen: boolean; onClose: () => void; onLoginRequest: () => void }) => {
  const designs = [
    { id: 1, name: 'Midnight Luxe', author: '@elena.v', likes: 234, liked: false },
    { id: 2, name: 'Coastal Breeze', author: '@marcus.d', likes: 189, liked: true },
    { id: 3, name: 'Urban Charcoal', author: '@sophie.k', likes: 156, liked: false },
    { id: 4, name: 'Rose Garden', author: '@amy.l', likes: 142, liked: false },
    { id: 5, name: 'Slate Minimal', author: '@alex.j', likes: 98, liked: false },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="fc-backdrop"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div 
            className="fc-drawer fc-community-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="fc-drawer-header">
              <span className="fc-modal-title">Community Market</span>
              <button className="fc-close-btn" onClick={onClose}><CloseIcon /></button>
            </div>
            
            <div className="fc-drawer-content">
              <div className="fc-promo-card">
                <div className="fc-promo-text">
                  <span className="fc-promo-title">Sell Your Design</span>
                  <p className="fc-promo-desc">
                    Save your configuration to the marketplace. 
                    Earn 5% credit when others buy it.
                  </p>
                </div>
                <button className="fc-btn-small" onClick={onLoginRequest}>Share</button>
              </div>

              <div className="fc-grid">
                {designs.map(design => (
                  <div key={design.id} className="fc-design-card">
                    <div className="fc-design-preview" />
                    <div className="fc-design-meta">
                      <div className="fc-design-info">
                        <span className="fc-design-name">{design.name}</span>
                        <span className="fc-design-author">{design.author}</span>
                      </div>
                      <div className={`fc-design-likes ${design.liked ? 'liked' : ''}`}>
                        <HeartIcon filled={design.liked} />
                        {design.likes}
                      </div>
                    </div>
                    <button className="fc-apply-btn">Apply</button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT (ORCHESTRATOR)
// ═══════════════════════════════════════════════════════════════════════════════

export const FourCorners: React.FC<FourCornersProps> = ({
  configuration,
  product,
  onNodeClick,
  totalPrice,
  onOpenPrice,
  onLoginRequest,
  onPartHighlight,
}) => {
  const [activeCorner, setActiveCorner] = useState<'info' | 'community' | 'fullspec' | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap');

        .fc-container {
          --bg: #F8F5F0;
          --ink: #1a1a1a;
          --accent: #C20000;
          --border: rgba(0, 0, 0, 0.12);
          --serif: 'PP Editorial Old', serif;
          --mono: 'JetBrains Mono', monospace;
          
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 40;
          overflow: hidden;
        }

        /* CORNER TRIGGERS */
        .fc-corner {
          position: absolute;
          pointer-events: auto;
          z-index: 50;
        }

        .fc-top-right {
          top: 1.5rem;
          right: 1.5rem;
        }

        .fc-bottom-left {
          bottom: 1.5rem;
          left: 1.5rem;
        }

        .fc-trigger-btn {
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 0.6rem 1rem;
          font-family: var(--mono);
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--ink);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .fc-trigger-btn:hover {
          border-color: var(--ink);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .fc-trigger-btn.active {
          background: var(--ink);
          color: var(--bg);
          border-color: var(--ink);
        }

        /* CENTER STAGE (Sentence) */
        .fc-center-stage {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          pointer-events: none; /* Let sentence handle its own pointer events */
          display: flex;
          justify-content: center;
          padding-bottom: 1.5rem;
        }

        /* MODAL & DRAWER STYLES */
        .fc-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(2px);
          z-index: 55;
          pointer-events: auto;
        }

        .fc-modal {
          position: absolute;
          background: var(--bg);
          border: 1px solid var(--ink);
          z-index: 60;
          pointer-events: auto;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }

        .fc-info-modal {
          bottom: 5rem;
          left: 1.5rem;
          width: 320px;
          border-radius: 12px;
          overflow: hidden;
        }

        .fc-drawer {
          position: absolute;
          background: var(--bg);
          border-left: 1px solid var(--ink);
          z-index: 60;
          pointer-events: auto;
          box-shadow: -12px 0 40px rgba(0,0,0,0.1);
          top: 0;
          bottom: 0;
          right: 0;
          width: 360px;
          display: flex;
          flex-direction: column;
        }

        .fc-modal-header, .fc-drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
        }

        .fc-modal-title {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-style: italic;
        }

        .fc-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.4rem;
          opacity: 0.5;
          transition: opacity 0.2s;
        }

        .fc-close-btn:hover {
          opacity: 1;
        }

        .fc-modal-content, .fc-drawer-content {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        /* Content Styling */
        .fc-section {
          margin-bottom: 1.5rem;
        }

        .fc-label {
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          opacity: 0.5;
          display: block;
          margin-bottom: 0.35rem;
        }

        .fc-text {
          font-family: var(--serif);
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--ink);
        }

        /* Community Styling */
        .fc-promo-card {
          background: rgba(0,0,0,0.03);
          border: 1px dashed var(--ink);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .fc-promo-title {
          font-family: var(--serif);
          font-style: italic;
          display: block;
          font-size: 1rem;
        }

        .fc-promo-desc {
          font-family: var(--mono);
          font-size: 0.5rem;
          opacity: 0.6;
          margin-top: 0.25rem;
          line-height: 1.4;
        }

        .fc-btn-small {
          background: var(--ink);
          color: var(--bg);
          border: none;
          font-family: var(--mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          white-space: nowrap;
        }

        .fc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .fc-design-card {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s;
          cursor: pointer;
        }

        .fc-design-card:hover {
          border-color: var(--ink);
          background: rgba(0,0,0,0.01);
        }

        .fc-design-preview {
          width: 60px;
          height: 60px;
          background: rgba(0,0,0,0.05);
          border-radius: 4px;
          flex-shrink: 0;
        }

        .fc-design-meta {
          flex: 1;
        }

        .fc-design-name {
          font-family: var(--serif);
          font-size: 1rem;
          display: block;
        }

        .fc-design-author {
          font-family: var(--mono);
          font-size: 0.55rem;
          opacity: 0.5;
          display: block;
        }

        .fc-design-likes {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-family: var(--mono);
          font-size: 0.55rem;
          margin-top: 0.25rem;
          opacity: 0.5;
        }

        .fc-apply-btn {
          background: transparent;
          border: 1px solid var(--border);
          padding: 0.4rem 0.6rem;
          font-family: var(--mono);
          font-size: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .fc-apply-btn:hover {
          border-color: var(--ink);
          background: var(--ink);
          color: var(--bg);
        }

        /* MOBILE OVERRIDES */
        @media (max-width: 767px) {
          .fc-top-right {
            top: 1rem;
            right: 1rem;
          }
          
          .fc-bottom-left {
            bottom: auto;
            top: 1rem;
            left: 1rem;
          }

          .fc-trigger-btn {
            padding: 0.5rem 0.8rem;
            font-size: 0.55rem;
          }

          .fc-info-modal {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 20px 20px 0 0;
            max-height: 80vh;
          }

          .fc-drawer {
            width: 100%;
          }
        }
      `}</style>

      <div className="fc-container">
        
        {/* 1. TOP RIGHT: MARKETPLACE */}
        <div className="fc-corner fc-top-right">
          <button 
            className={`fc-trigger-btn ${activeCorner === 'community' ? 'active' : ''}`}
            onClick={() => setActiveCorner(activeCorner === 'community' ? null : 'community')}
          >
            Community Market (721) →
          </button>
        </div>

        {/* 2. BOTTOM LEFT: INFO (Desktop only, moved to top left on mobile) */}
        <div className="fc-corner fc-bottom-left">
          <button 
            className={`fc-trigger-btn ${activeCorner === 'info' ? 'active' : ''}`}
            onClick={() => setActiveCorner(activeCorner === 'info' ? null : 'info')}
          >
            <InfoIcon /> Specification & Care
          </button>
        </div>

        {/* 3. CENTER STAGE: SENTENCE */}
        <div className="fc-center-stage">
          <SpecSentence
            configuration={configuration}
            product={product}
            onNodeClick={onNodeClick}
            totalPrice={totalPrice}
            onOpenPrice={onOpenPrice}
            onLoginRequest={onLoginRequest}
            onPartHighlight={onPartHighlight}
            layout="overlay" // Floats at bottom
          />
        </div>

        {/* MODALS & DRAWERS */}
        <InfoModal 
          isOpen={activeCorner === 'info'} 
          onClose={() => setActiveCorner(null)} 
        />
        
        <CommunityDrawer 
          isOpen={activeCorner === 'community'} 
          onClose={() => setActiveCorner(null)}
          onLoginRequest={onLoginRequest}
        />

      </div>
    </>
  );
};

export default FourCorners;

