import React from 'react';
import { Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="hero-section-premium" aria-labelledby="hero-title">
      <div className="container hero-container">
        {/* Shimmering Brand Eyebrow */}
        <div className="hero-eyebrow-wrap">
          <div className="hero-eyebrow-pill">
            <Sparkles size={14} className="eyebrow-icon" aria-hidden="true" />
            <span>HIGHSPRING DIGITAL SOLUTIONS</span>
          </div>
        </div>

        {/* Hero Title */}
        <h1 id="hero-title" className="hero-title-premium">
          Empowering teams through{' '}
          <span className="hero-title-gradient">intelligent technology.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="hero-description-premium">
          Your central place for recruitment, staffing, and performance evaluation solutions.
        </p>

      </div>
    </section>
  );
}
