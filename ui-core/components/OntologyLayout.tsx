import React, { useState, useEffect, useRef } from 'react';
import { ontologyData } from '../ontologyData';
import { ArrowRight, Box, ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';

declare global {
  interface Window {
    mermaid: any;
  }
}

const OntologyLayout: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>(ontologyData[0].id);
  const [isMermaidLoaded, setIsMermaidLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const graphRef = useRef<HTMLDivElement>(null);

  const activeSection = ontologyData.find(s => s.id === activeSectionId) || ontologyData[0];

  // 1. Initialize Mermaid
  useEffect(() => {
    const checkMermaid = () => {
      if (window.mermaid) {
        try {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            securityLevel: 'loose',
            flowchart: {
                useMaxWidth: false, // Critical: Stop mermaid from auto-scaling to container width
                htmlLabels: true,
            },
            themeVariables: {
              fontFamily: 'JetBrains Mono',
              fontSize: '16px',
              primaryColor: '#F8F5F0',
              primaryTextColor: '#000000',
              primaryBorderColor: '#000000',
              lineColor: '#000000',
              secondaryColor: '#C20000',
              tertiaryColor: '#fff',
            }
          });
          setIsMermaidLoaded(true);
        } catch (e) {
          console.error("Mermaid initialization failed", e);
        }
      } else {
        setTimeout(checkMermaid, 100);
      }
    };

    checkMermaid();
  }, []);

  // 2. Render Graph
  useEffect(() => {
    const renderGraph = async () => {
      if (!isMermaidLoaded || !graphRef.current) return;
      
      setError(null);
      // Reset zoom on tab change to a sensible default
      setScale(1);

      try {
        graphRef.current.innerHTML = `
          <div class="flex flex-col items-center justify-center p-24 text-charcoal/40">
            <span class="animate-pulse font-mono text-xs uppercase tracking-widest mb-2">Generating Visual Graph...</span>
          </div>
        `;
        
        const id = `mermaid-${activeSection.id}-${Date.now()}`;
        
        // Clean the code
        const cleanCode = activeSection.code
          .split('\n')
          .map(line => line.trim())
          .join('\n');

        // Render
        const { svg } = await window.mermaid.render(id, cleanCode);
        
        if (graphRef.current) {
          graphRef.current.innerHTML = svg;
          
          // CRITICAL FIX: Force SVG to use its natural size derived from viewBox
          const svgElement = graphRef.current.querySelector('svg');
          if (svgElement) {
            // Remove the default style that squashes it
            svgElement.removeAttribute('style');
            svgElement.style.maxWidth = 'none';
            
            // If viewBox exists, use it to enforce minimum dimensions
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const [,, width, height] = viewBox.split(' ').map(parseFloat);
                svgElement.style.width = `${width}px`;
                svgElement.style.height = `${height}px`;
            } else {
                svgElement.style.width = 'auto';
                svgElement.style.height = 'auto';
            }
          }
        }
      } catch (e: any) {
        console.error('Mermaid rendering error:', e);
        setError(e.message || 'Unknown rendering error');
        if (graphRef.current) {
            graphRef.current.innerHTML = '';
        }
      }
    };

    renderGraph();
  }, [activeSectionId, isMermaidLoaded]);

  return (
    <div className="flex flex-col md:flex-row h-[800px] border border-charcoal bg-cream mb-24 relative">
      {/* Decorative Technical Markers */}
      <div className="absolute top-0 left-0 w-2 h-2 border-r border-b border-charcoal" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-l border-t border-charcoal" />

      {/* LEFT PANE: Navigation */}
      <div className="w-full md:w-[320px] border-r border-charcoal overflow-y-auto bg-cream flex flex-col h-[300px] md:h-auto border-b md:border-b-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8 pb-2 border-b border-charcoal">
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase">Ontology Index</h3>
            <span className="font-mono text-[9px] text-charcoal/50">SYS-ROOT</span>
          </div>

          <ul className="space-y-1">
            {ontologyData.map((section, idx) => {
              const isActive = activeSectionId === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSectionId(section.id)}
                    className={`
                      w-full text-left px-4 py-3 transition-all flex justify-between items-center group border-l-2
                      ${isActive 
                        ? 'bg-white border-charcoal' 
                        : 'border-transparent hover:bg-white hover:border-charcoal/20'}
                    `}
                  >
                    <div>
                      <div className={`font-mono text-[10px] uppercase tracking-wider mb-1 ${isActive ? 'text-charcoal font-bold' : 'text-charcoal/70'}`}>
                        {idx === 0 ? 'MASTER' : `0${idx}.`} {section.title.replace(/^\d+\.\s*/, '')}
                      </div>
                    </div>
                    {isActive && <ArrowRight size={12} className="text-charcoal" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* RIGHT PANE: Visual Graph */}
      <div className="w-full flex-1 bg-white overflow-hidden relative flex flex-col">
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />

        {/* Header */}
        <div className="p-6 border-b border-charcoal flex justify-between items-center bg-white z-10 shadow-sm">
          <div>
            <h2 className="font-serif italic text-2xl md:text-3xl text-charcoal">{activeSection.title}</h2>
            <p className="font-mono text-[10px] text-charcoal/40 uppercase tracking-widest mt-1">
              Visual Relationship Graph
            </p>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 hover:bg-cream border border-transparent hover:border-charcoal/10 rounded-sm" title="Zoom Out">
                <ZoomOut size={14} className="text-charcoal" />
             </button>
             <span className="font-mono text-[9px] w-8 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 hover:bg-cream border border-transparent hover:border-charcoal/10 rounded-sm" title="Zoom In">
                <ZoomIn size={14} className="text-charcoal" />
             </button>
             <button onClick={() => setScale(1)} className="p-2 hover:bg-cream border border-transparent hover:border-charcoal/10 rounded-sm ml-2" title="Reset Zoom">
                <RefreshCcw size={14} className="text-charcoal" />
             </button>
             
             <div className="hidden md:flex items-center gap-2 px-3 py-1 border border-charcoal/20 rounded-sm ml-4">
                <Box size={14} className="text-charcoal/40" />
                <span className="font-mono text-[9px] text-charcoal/60">LIVE RENDER</span>
             </div>
          </div>
        </div>

        {/* Graph Container Area - Scrollable */}
        <div className="flex-1 overflow-auto bg-[#ffffff] relative cursor-grab active:cursor-grabbing">
          
          {error ? (
            <div className="p-12 text-red-600 font-mono text-xs border border-red-200 bg-red-50 m-8">
              <p className="font-bold mb-2">RENDERING ERROR</p>
              <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
          ) : (
             <div 
                className="inline-block p-12 transition-transform duration-200 origin-top-left min-w-full min-h-full"
                style={{ 
                    transform: `scale(${scale})`,
                    // Ensure the container grows to fit content, preventing squash
                    width: 'max-content',
                    height: 'max-content'
                }}
             >
                <div 
                  ref={graphRef} 
                  className="mermaid-container"
                />
             </div>
          )}
          
          {!isMermaidLoaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
               <span className="font-mono text-xs animate-pulse">LOADING GRAPH ENGINE...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OntologyLayout;


