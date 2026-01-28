// OmniCommunity.tsx - Community Inspiration
import React from 'react';

export const OmniCommunity: React.FC = () => {
  const designs = [
    { id: 1, name: 'Studio Noir', author: 'Elena K.', likes: 124 },
    { id: 2, name: 'Minimal Latte', author: 'Sarah J.', likes: 89 },
    { id: 3, name: 'Urban Charcoal', author: 'Mike R.', likes: 67 },
    { id: 4, name: 'Emerald City', author: 'DesignLab', likes: 210 },
    { id: 5, name: 'Classic Navy', author: 'Tom W.', likes: 45 },
    { id: 6, name: 'Desert Sand', author: 'Anna L.', likes: 112 },
  ];

  return (
    <>
      <style>{`
        .omni-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 1rem;
        }

        .omni-card {
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s;
            background: #fff;
        }

        .omni-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border-color: #1a1a1a;
        }

        .omni-card-preview {
            aspect-ratio: 1;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: rgba(0,0,0,0.1);
        }

        .omni-card-meta {
            padding: 0.75rem;
        }

        .omni-card-title {
            font-family: 'PP Editorial Old', serif;
            font-feature-settings: "liga" 1, "dlig" 1, "calt" 1, "swsh" 1, "salt" 1;
            font-size: 1rem;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }

        .omni-card-author {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.6rem;
            opacity: 0.5;
            text-transform: uppercase;
        }
      `}</style>
      
      <div style={{ paddingBottom: '2rem' }}>
        <p style={{ fontFamily: 'PP Editorial Old, serif', fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.8 }}>
            Discover configurations created by the community. Select a design to load it as a starting point.
        </p>

        <div className="omni-grid">
            {designs.map(d => (
                <div key={d.id} className="omni-card">
                    <div className="omni-card-preview">👜</div>
                    <div className="omni-card-meta">
                        <div className="omni-card-title">{d.name}</div>
                        <div className="omni-card-author">by {d.author}</div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </>
  );
};

