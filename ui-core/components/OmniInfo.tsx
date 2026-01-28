// OmniInfo.tsx - Trust & Reassurance
import React from 'react';

export const OmniInfo: React.FC = () => {
  return (
    <div style={{ fontFamily: 'PP Editorial Old, serif', fontSize: '1.1rem', lineHeight: '1.6' }}>
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.5 }}>Delivery</h3>
        <p>
            Each piece is made to order in our Milan atelier. Please allow 10–14 days for production before shipping. 
            Express shipping is available at checkout.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.5 }}>Warranty</h3>
        <p>
            We stand by the quality of our craftsmanship. Your purchase includes a 2-year warranty covering any manufacturing defects.
            Repairs outside of warranty are available for a nominal fee.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.5 }}>Care Instructions</h3>
        <p>
            Store in the provided dust bag when not in use. Avoid prolonged exposure to direct sunlight and moisture. 
            For leather care, we recommend professional cleaning only.
        </p>
      </section>

      <section>
        <h3 style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.5 }}>Materials</h3>
        <p>
            Our leathers are sourced from Gold-rated tanneries in Italy, ensuring the highest standards of environmental responsibility.
            Hardware is PVD coated for durability and resistance to tarnishing.
        </p>
      </section>
    </div>
  );
};

