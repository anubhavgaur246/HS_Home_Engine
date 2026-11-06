import React from 'react';
import { Lock, Shield, Sparkles } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer-premium" role="contentinfo">
      <div className="container footer-content-wrap">
        {/* Left Side: Brand & Identity */}
        <div className="footer-brand-block">
          <div className="footer-brand-title">
            <span>Built for </span>
            <strong className="footer-brand-accent">Highspring</strong>
          </div>
          <p className="footer-tagline">
            Digital Solutions Hub • Central Enterprise Operations & Automation Portal
          </p>
          <p className="footer-copy-text">
            © {currentYear} Highspring Technologies Inc. All rights reserved.
          </p>
        </div>

        {/* Right Side: Security & Environment Badges */}
        <div className="footer-badges-block">
          <div className="footer-pill-secure">
            <Lock size={13} className="footer-secure-icon" aria-hidden="true" />
            <span>Highspring Internal Network</span>
          </div>
          <div className="footer-pill-secure">
            <Shield size={13} className="footer-secure-icon" aria-hidden="true" />
            <span>Enterprise SSO Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
