import React, { useState } from 'react';
import { Palette, Type, Ruler, MousePointer, Layout, Ban, CheckCircle2, Maximize, Grid } from 'lucide-react';

type SectionId = 'manifesto' | 'color' | 'typography' | 'structure' | 'interaction';

const StyleGuideLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('manifesto');

  const navItems = [
    { id: 'manifesto', label: '00. The Manifesto', icon: Layout },
    { id: 'color', label: '01. Ink & Paper', icon: Palette },
    { id: 'typography', label: '02. Dual Voice Type', icon: Type },
    { id: 'structure', label: '03. Layout & Frame', icon: Ruler },
    { id: 'interaction', label: '04. Mechanical Input', icon: MousePointer },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[800px] border border-charcoal bg-cream mb-24 relative">
      {/* Decorative Technical Markers */}
      <div className="absolute top-0 left-0 w-2 h-2 border-r border-b border-charcoal" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-l border-t border-charcoal" />

      {/* LEFT PANE: Navigation */}
      <div className="w-full md:w-[320px] border-r border-charcoal overflow-y-auto bg-cream">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8 pb-2 border-b border-charcoal">
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase">System Spec</h3>
            <span className="font-mono text-[9px] text-charcoal/50">V.2.0</span>
          </div>
          
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id as SectionId)}
                    className={`
                      w-full text-left px-4 py-4 transition-all flex items-center gap-4 border-l-2
                      ${isActive 
                        ? 'bg-white border-charcoal' 
                        : 'border-transparent hover:bg-white hover:border-charcoal/20'}
                    `}
                  >
                    <item.icon size={14} className={isActive ? 'text-charcoal' : 'text-charcoal/50'} />
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${isActive ? 'text-charcoal font-bold' : 'text-charcoal/70'}`}>
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="p-6 mt-12">
            <div className="border border-dashed border-charcoal/30 p-4">
                <p className="font-mono text-[9px] text-charcoal/60 leading-relaxed uppercase">
                    "This is not a web app.<br/>It is a digital drafting table."
                </p>
            </div>
        </div>
      </div>

      {/* RIGHT PANE: Content */}
      <div className="w-full flex-1 bg-white overflow-y-auto relative">
         {/* Background Grid */}
         <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />

        <div className="p-8 md:p-16 max-w-4xl mx-auto">
            
            {/* MANIFESTO SECTION */}
            {activeSection === 'manifesto' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-4">The Philosophy</span>
                        <h1 className="text-6xl font-serif italic text-charcoal mb-6">Functional Brutalism</h1>
                        <p className="text-xl font-mono text-charcoal/70 leading-relaxed max-w-2xl">
                            The design system treats the screen as a high-precision tool. Content is framed, indexed, and explicit.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="border border-charcoal p-8">
                            <h3 className="font-mono text-[10px] uppercase tracking-widest mb-4 border-b border-charcoal pb-2">Rule 01: No Softness</h3>
                            <p className="font-mono text-xs leading-relaxed text-charcoal/80 mb-4">
                                Shadows are hard (solid offsets). Corners are tight (0-2px) within the content.
                                No blurs. No gradients (except subtle noise/grid). 
                            </p>
                            <div className="flex gap-4 mt-4">
                                <div className="h-12 w-12 bg-white border border-charcoal shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-mono text-[10px]">YES</div>
                                <div className="h-12 w-12 bg-white border border-charcoal/20 shadow-lg rounded-lg flex items-center justify-center font-mono text-[10px] opacity-50 relative overflow-hidden">
                                    NO
                                    <div className="absolute inset-0 border-2 border-red-500 transform rotate-45"></div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-charcoal p-8">
                            <h3 className="font-mono text-[10px] uppercase tracking-widest mb-4 border-b border-charcoal pb-2">Rule 02: Explicit Structure</h3>
                            <p className="font-mono text-xs leading-relaxed text-charcoal/80">
                                Nothing floats. Everything exists within a grid cell, a panel, or a defined list. 
                                Use borders (solid or dashed) to separate logic.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* COLOR SECTION */}
            {activeSection === 'color' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <header>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-4">01. Ink & Paper</span>
                        <h1 className="text-5xl font-serif italic text-charcoal mb-6">Color System</h1>
                        <p className="font-mono text-xs text-charcoal/70 max-w-lg">
                            We do not use grey paint. We use black ink with varied opacity. 
                            The background is never pure white, it is "Bone" or "Cream".
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Primary Palette */}
                        <div className="space-y-6">
                            <h3 className="font-serif italic text-2xl border-b border-charcoal pb-2">The Canvas</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-6 group">
                                    <div className="w-24 h-24 rounded-full border border-charcoal bg-[#F8F5F0] shadow-hard relative group-hover:scale-105 transition-transform"></div>
                                    <div>
                                        <div className="font-mono text-xs font-bold uppercase tracking-widest">Cream (Bone)</div>
                                        <div className="font-mono text-[10px] text-charcoal/60 mt-1">#F8F5F0</div>
                                        <div className="font-serif italic text-sm mt-1 text-charcoal/80">Global background.</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 group">
                                    <div className="w-24 h-24 rounded-full border border-charcoal bg-[#FFFFFF] shadow-hard relative group-hover:scale-105 transition-transform"></div>
                                    <div>
                                        <div className="font-mono text-xs font-bold uppercase tracking-widest">White (Paper)</div>
                                        <div className="font-mono text-[10px] text-charcoal/60 mt-1">#FFFFFF</div>
                                        <div className="font-serif italic text-sm mt-1 text-charcoal/80">Active/Focused panels only.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ink Palette */}
                        <div className="space-y-6">
                            <h3 className="font-serif italic text-2xl border-b border-charcoal pb-2">The Ink</h3>
                             <div className="space-y-4">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-[#000000] border border-charcoal"></div>
                                    <div>
                                        <div className="font-mono text-xs font-bold uppercase tracking-widest">Charcoal</div>
                                        <div className="font-mono text-[10px] text-charcoal/60 mt-1">#000000</div>
                                        <div className="font-serif italic text-sm mt-1 text-charcoal/80">Primary text, borders, shadows.</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-[#C20000] border border-charcoal"></div>
                                    <div>
                                        <div className="font-mono text-xs font-bold uppercase tracking-widest">Accent Red</div>
                                        <div className="font-mono text-[10px] text-charcoal/60 mt-1">#C20000</div>
                                        <div className="font-serif italic text-sm mt-1 text-charcoal/80">System status, selection checks.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* The Grey Rule */}
                    <div className="border border-charcoal bg-cream p-8 mt-12 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-[100px] text-charcoal/5 font-serif italic pointer-events-none">Grey</div>
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4 relative z-10">Crucial Rule: The "No Grey" Policy</h3>
                        
                        <div className="grid grid-cols-2 gap-8 relative z-10">
                            <div className="bg-white p-6 border border-charcoal">
                                <div className="flex items-center gap-2 mb-4 text-green-700 font-mono text-[10px] uppercase">
                                    <CheckCircle2 size={12} /> Correct
                                </div>
                                <p className="font-mono text-sm text-charcoal/50">
                                    use text-charcoal/50
                                </p>
                                <p className="font-mono text-[10px] mt-2">
                                    Use opacity (alpha) to create hierarchy. It allows the cream background to bleed through, creating warmth.
                                </p>
                            </div>
                            <div className="bg-white p-6 border border-charcoal opacity-50">
                                <div className="flex items-center gap-2 mb-4 text-red-700 font-mono text-[10px] uppercase">
                                    <Ban size={12} /> Incorrect
                                </div>
                                <p className="font-mono text-sm text-[#999999]">
                                    use text-[#999999]
                                </p>
                                <p className="font-mono text-[10px] mt-2">
                                    Do not use solid grey hex codes. They look dead and digital against the cream paper.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

             {/* TYPOGRAPHY SECTION */}
             {activeSection === 'typography' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-4">02. Dual Voice</span>
                        <h1 className="text-5xl font-serif italic text-charcoal mb-6">Typography</h1>
                        <p className="font-mono text-xs text-charcoal/70 max-w-lg">
                            We separate <strong>Emotion</strong> from <strong>Logic</strong> using two distinct typefaces.
                        </p>
                    </header>

                    <div className="space-y-12">
                        {/* Serif */}
                        <div className="border-l-2 border-charcoal pl-8 py-2">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-6xl font-serif italic">The Soul</h2>
                                <span className="font-mono text-[10px] bg-charcoal text-cream px-2 py-1">PP Editorial Old</span>
                            </div>
                            <p className="font-mono text-xs text-charcoal/60 mb-6 max-w-md">
                                Used for: Product names, H1/H2 headers, "Human" content. Almost always Italic.
                            </p>
                            <div className="space-y-4">
                                <div className="text-5xl font-serif italic text-charcoal">Aurora Bag <span className="text-xs font-mono not-italic opacity-40 ml-4">text-5xl</span></div>
                                <div className="text-4xl font-serif italic text-charcoal">The Configurator <span className="text-xs font-mono not-italic opacity-40 ml-4">text-4xl</span></div>
                                <div className="text-2xl font-serif text-charcoal">Standard Body Serif (Rare) <span className="text-xs font-mono not-italic opacity-40 ml-4">text-2xl</span></div>
                            </div>
                        </div>

                        {/* Mono */}
                        <div className="border-l-2 border-charcoal pl-8 py-2">
                             <div className="flex justify-between items-start mb-4">
                                <h2 className="text-4xl font-mono uppercase tracking-tighter">The Machine</h2>
                                <span className="font-mono text-[10px] bg-charcoal text-cream px-2 py-1">JetBrains Mono</span>
                            </div>
                             <p className="font-mono text-xs text-charcoal/60 mb-6 max-w-md">
                                Used for: Specs, Labels, Buttons, Navigation, Prices. Always Uppercase for labels.
                            </p>
                            <div className="space-y-4">
                                <div className="font-mono text-xs uppercase tracking-[0.2em] text-charcoal">
                                    SPECIFICATION LABEL
                                    <span className="text-charcoal/40 ml-4">// text-xs tracking-[0.2em]</span>
                                </div>
                                <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                                    Secondary Meta Data
                                    <span className="text-charcoal/40 ml-4">// text-[10px] tracking-widest</span>
                                </div>
                                <div className="font-mono text-xs text-charcoal">
                                    Standard body text for descriptions. No tracking.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STRUCTURE SECTION */}
            {activeSection === 'structure' && (
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-4">03. Layout & Fluidity</span>
                        <h1 className="text-5xl font-serif italic text-charcoal mb-6">Structure</h1>
                    </header>

                    {/* THE FRAME RULE */}
                    <div>
                        <h3 className="font-mono text-[10px] uppercase tracking-widest mb-6 border-b border-charcoal pb-2 flex items-center gap-2">
                            <Maximize size={12} /> The "Frame" Paradox
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="relative">
                                <div className="h-40 w-full border border-charcoal rounded-[24px] bg-cream shadow-xl flex items-center justify-center relative">
                                    <span className="font-serif italic text-2xl text-charcoal/20">The Macro</span>
                                    <div className="absolute top-0 left-0 border-r border-b border-charcoal p-2 rounded-tl-[24px] rounded-br-[4px]">
                                        <span className="font-mono text-[9px]">40px</span>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-mono text-xs font-bold uppercase mb-1">Outer Shell</h4>
                                    <p className="font-mono text-[10px] text-charcoal/60 leading-relaxed">
                                        The application container mimics a physical object or device. 
                                        It is the <strong>only</strong> element allowed significant organic curvature (`rounded-[40px]`).
                                    </p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="h-40 w-full border border-charcoal rounded-none bg-white flex items-center justify-center relative">
                                    <span className="font-mono uppercase text-xs tracking-widest text-charcoal/20">The Micro</span>
                                    <div className="absolute top-0 left-0 w-2 h-2 border-r border-b border-charcoal"></div>
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-l border-t border-charcoal"></div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-mono text-xs font-bold uppercase mb-1">Inner Content</h4>
                                    <p className="font-mono text-[10px] text-charcoal/60 leading-relaxed">
                                        Inside the shell, everything is brutalist. Buttons, cards, and inputs have `rounded-none` or max `rounded-[2px]`.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BORDERS & DIVIDERS */}
                    <div>
                         <h3 className="font-mono text-[10px] uppercase tracking-widest mb-6 border-b border-charcoal pb-2 flex items-center gap-2">
                            <Grid size={12} /> Lines & Separation
                        </h3>
                         <div className="space-y-6">
                             <div>
                                 <div className="h-12 w-full border border-charcoal flex items-center justify-center font-mono text-xs">Solid 1px</div>
                                 <p className="font-mono text-[9px] text-charcoal/50 mt-2">Primary containers. Defines the "real" edges of content.</p>
                             </div>
                             <div>
                                 <div className="h-12 w-full border border-dashed border-charcoal flex items-center justify-center font-mono text-xs">Dashed 1px</div>
                                 <p className="font-mono text-[9px] text-charcoal/50 mt-2">Logical separation. Use for "cuts", "folds", or connecting properties.</p>
                             </div>
                             <div>
                                 <div className="h-12 w-full border-b border-charcoal flex items-end justify-center pb-2 font-mono text-xs">Underline Header</div>
                                 <p className="font-mono text-[9px] text-charcoal/50 mt-2">Section headers always have a full-width bottom border.</p>
                             </div>
                         </div>
                    </div>

                    {/* SPACING */}
                    <div>
                         <h3 className="font-mono text-[10px] uppercase tracking-widest mb-6 border-b border-charcoal pb-2">Spacing Rhythm</h3>
                         <div className="flex gap-4 items-end">
                            <div className="w-4 h-4 bg-charcoal/10 border border-charcoal/20 flex items-center justify-center text-[8px]">4</div>
                            <div className="w-12 h-12 bg-charcoal/10 border border-charcoal/20 flex items-center justify-center text-[10px]">12 (3x)</div>
                            <div className="w-24 h-24 bg-charcoal/10 border border-charcoal/20 flex items-center justify-center text-[10px]">24 (6x)</div>
                            <div className="w-48 h-48 bg-charcoal/10 border border-charcoal/20 flex items-center justify-center text-[10px]">48 (12x)</div>
                         </div>
                         <p className="font-mono text-[10px] text-charcoal/50 mt-4">
                             Base unit: 4px. Common padding: 24px (Mobile/Card), 48px (Section).
                         </p>
                    </div>

                    {/* ACCENT UNDERSCORE */}
                    <div>
                         <h3 className="font-mono text-[10px] uppercase tracking-widest mb-6 border-b border-charcoal pb-2 flex items-center gap-2">
                             The Accent Underscore
                        </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="bg-cream border border-charcoal/10 p-12 relative overflow-hidden">
                                {/* Grid Pattern for Technical Feel */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                                    style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                                />
                                
                                <div className="relative z-10">
                                    <h1 className="text-5xl font-serif italic text-charcoal leading-none mb-2">Product Model</h1>
                                    <div className="w-16 h-[4px] bg-accent mb-6"></div>
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/50">
                                        Specification Configuration
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <p className="font-mono text-xs text-charcoal/70 leading-relaxed mb-6">
                                    The accent underscore is the system's "Identity Signal". It creates a hard, architectural break between the emotional header (Serif) and the technical body (Mono).
                                </p>
                                <div className="space-y-3 font-mono text-[10px] text-charcoal/60 border-l border-accent/20 pl-4">
                                    <div className="flex flex-col">
                                        <span className="uppercase text-charcoal/40 tracking-widest mb-1">Color</span>
                                        <span className="text-accent font-bold">#C20000 (Accent)</span>
                                    </div>
                                    <div className="flex flex-col mt-3">
                                        <span className="uppercase text-charcoal/40 tracking-widest mb-1">Geometry</span>
                                        <span>Height: 3px–6px (Block)</span>
                                    </div>
                                    <div className="flex flex-col mt-3">
                                        <span className="uppercase text-charcoal/40 tracking-widest mb-1">Placement</span>
                                        <span>Left-aligned, Independent of text baseline</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* INTERACTION SECTION */}
            {activeSection === 'interaction' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <header>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/40 block mb-4">04. Mechanical Input</span>
                        <h1 className="text-5xl font-serif italic text-charcoal mb-6">Interaction</h1>
                        <p className="font-mono text-xs text-charcoal/70 max-w-lg">
                            Interactions should feel physical. Buttons don't fade; they click.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 gap-8 max-w-xl">
                        {/* Hover State */}
                        <div className="flex items-center gap-8">
                            <div className="w-32">
                                <span className="font-mono text-[10px] uppercase tracking-widest block mb-1">Passive</span>
                            </div>
                            <button className="px-6 py-3 border border-charcoal/20 bg-transparent text-charcoal font-mono text-xs uppercase tracking-widest">
                                Button
                            </button>
                        </div>

                         {/* Hover State */}
                         <div className="flex items-center gap-8">
                            <div className="w-32">
                                <span className="font-mono text-[10px] uppercase tracking-widest block mb-1">Hover</span>
                                <span className="font-mono text-[9px] text-charcoal/40">border-charcoal</span>
                            </div>
                            <button className="px-6 py-3 border border-charcoal bg-white text-charcoal font-mono text-xs uppercase tracking-widest">
                                Button
                            </button>
                        </div>

                         {/* Active State */}
                         <div className="flex items-center gap-8">
                            <div className="w-32">
                                <span className="font-mono text-[10px] uppercase tracking-widest block mb-1">Selected</span>
                                <span className="font-mono text-[9px] text-charcoal/40">Inverted + Shadow</span>
                            </div>
                            <button className="px-6 py-3 border border-charcoal bg-charcoal text-cream font-mono text-xs uppercase tracking-widest shadow-hard -translate-x-0.5 -translate-y-0.5">
                                Button
                            </button>
                        </div>

                        {/* Shadows */}
                        <div className="border-t border-dashed border-charcoal/30 pt-8 mt-4">
                             <h3 className="font-mono text-[10px] uppercase tracking-widest mb-4">The "Hard" Shadow</h3>
                             <div className="p-4 bg-cream border border-charcoal/10">
                                 <code className="block font-mono text-[10px] bg-white p-2 border border-charcoal/10">
                                     box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
                                 </code>
                                 <div className="mt-4 h-12 w-24 bg-white border border-charcoal shadow-hard flex items-center justify-center font-mono text-[10px]">
                                     Sample
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-24"></div>
        </div>
      </div>
    </div>
  );
};

export default StyleGuideLayout;


