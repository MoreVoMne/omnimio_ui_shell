import React, { useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';

interface AssetTrayProps {
  compact?: boolean;
  className?: string;
}

const AssetTray: React.FC<AssetTrayProps> = ({ compact = false, className = '' }) => {
  const { assets } = useCanvasStore();
  const [expanded, setExpanded] = useState(false);

  const allAssets = [
    ...assets.models,
    ...assets.textures,
    ...assets.images,
    ...assets.fonts,
  ];

  const displayedAssets = compact
    ? allAssets
    : expanded
      ? allAssets
      : allAssets.slice(0, 8);

  const handleDragStart = (e: React.DragEvent, assetId: string) => {
    e.dataTransfer.setData('asset-id', assetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`w-full ${compact ? '' : 'px-4 py-3'} ${className}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em]">ASSETS</div>
          {allAssets.length > 8 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
            >
              {expanded ? 'Collapse ▼' : 'Expand ▲'}
            </button>
          )}
        </div>
      )}

      <div className={`flex gap-2 ${compact ? 'flex-nowrap overflow-x-auto' : 'flex-wrap'}`}>
        {displayedAssets.map((asset) => {
          return (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => handleDragStart(e, asset.id)}
              className={`relative ${compact ? 'w-10 h-10 rounded-[6px]' : 'w-12 h-12 rounded-[8px]'} border border-charcoal/40 overflow-hidden cursor-move ${
                asset.used ? 'ring-2 ring-green-500' : ''
              } hover:ring-2 hover:ring-charcoal transition-all active:scale-105`}
              title={`${asset.name} - Drag to 3D model to assign`}
            >
            {asset.type === 'model' ? (
              (asset as any).previewUrl ? (
                <img
                  src={(asset as any).previewUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if preview fails
                    const target = e.target as HTMLImageElement;
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<div class="w-full h-full bg-desk flex items-center justify-center"><span class="text-lg">📦</span></div>';
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-desk flex items-center justify-center">
                  <span className="text-lg">📦</span>
                </div>
              )
            ) : asset.url && asset.type !== 'font' ? (
              asset.name.toLowerCase().endsWith('.svg') ? (
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                  }}
                />
              ) : (
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                  }}
                />
              )
            ) : (
                <div className="w-full h-full bg-desk flex items-center justify-center">
                  <span className="text-xs">
                    {asset.type === 'font' ? 'Aa' : '📄'}
                  </span>
                </div>
              )}
              {asset.used && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-cream" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetTray;

