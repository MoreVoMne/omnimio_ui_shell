import React, { useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import type { PartRole } from '../../types/parts';

interface PartNamingPopupProps {
  meshIndex: number;
  meshName: string;
  onClose: () => void;
  onSave: (name: string, role: PartRole) => void;
}

const PartNamingPopup: React.FC<PartNamingPopupProps> = ({ meshIndex, meshName, onSave, onClose }) => {
  const [name, setName] = useState(meshName || '');
  const [role, setRole] = useState<PartRole>('main');

  // AI suggestions (placeholder)
  const suggestions = ['Body', 'Main Panel', 'Front', 'Back', 'Handle', 'Strap', 'Clasp'];

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), role);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
      <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-md w-full">
        <h2 className="font-serif text-xl mb-4">Name This Part</h2>

        <div className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest mb-2">
              What is this part called?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-charcoal rounded-full px-4 py-2 font-mono text-sm uppercase tracking-widest bg-cream"
              placeholder="Part name"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest mb-2">
              AI suggestions:
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setName(suggestion)}
                  className="border border-charcoal/40 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest mb-2">
              Part role:
            </label>
            <div className="space-y-2">
              {(['main', 'swappable', 'optional', 'add-on', 'decorative'] as PartRole[]).map(
                (r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`w-full text-left font-mono text-xs uppercase tracking-widest transition-colors ${
                      role === r ? 'text-charcoal' : 'text-charcoal/60 hover:text-charcoal'
                    }`}
                  >
                    {r === 'main' && '◉ Main (always present)'}
                    {r === 'swappable' && '○ Swappable (customer chooses)'}
                    {r === 'optional' && '○ Optional (add-on)'}
                    {r === 'add-on' && '○ Add-on'}
                    {r === 'decorative' && '○ Decorative'}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartNamingPopup;

