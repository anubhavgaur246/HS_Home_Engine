import React from 'react';
import { ArrowUpRight, CheckCircle2, ShieldCheck, BookOpen, Video } from 'lucide-react';
import { ToolIconBadge } from './ToolIconBadge';

export function ToolCard({ tool }) {
  const openSolution = () => {
    window.open(tool.url, tool.openInNewTab ? '_blank' : '_self', tool.openInNewTab ? 'noopener,noreferrer' : undefined);
  };

  const handleCardKeyDown = (event) => {
    if (event.target.closest('a, button, input')) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSolution();
    }
  };

  return (
    <article
      className={`tool-card-premium theme-${tool.themeKey}`}
      role="listitem"
      tabIndex="0"
      onClick={(event) => {
        if (!event.target.closest('a, button, input')) openSolution();
      }}
      onKeyDown={handleCardKeyDown}
      aria-label={`Open ${tool.name}`}
    >
      {/* Specular Edge Gradient Layer */}
      <div className="card-ambient-glow" aria-hidden="true" />
      <div className="card-specular-border" aria-hidden="true" />
      {tool.isNew && (
        <div className="card-new-banner" role="status">
          <span className="card-new-banner-kicker">New release</span>
          <span className="card-new-banner-label">{tool.newLabel}</span>
        </div>
      )}

      {/* Card Header: Multi-layered Custom Icon & Badges */}
      <div className="card-top-row">
        <ToolIconBadge type={tool.iconType} accent={tool.accent} />

        <div className="card-top-badges">
          <span className="card-category-tag">{tool.badge}</span>
          <div className="card-status-pill">
            <span className="status-live-dot" />
            <span>Operational</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-content-block">
        <h2 className="card-title-premium">
          <span>{tool.name}</span>
          <ArrowUpRight size={20} className="card-arrow-icon" aria-hidden="true" />
        </h2>

        <p className="card-description-premium">{tool.description}</p>

        {/* Feature Capabilities */}
        {tool.capabilities && (
          <ul className="capabilities-wrap" aria-label="Key tool capabilities">
            {tool.capabilities.map((cap, i) => (
              <li key={i} className="capability-tag">
                <CheckCircle2 size={12} className="cap-icon" aria-hidden="true" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="card-action-footer">
        {tool.manualUrl ? (
          <a
            href={tool.manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-manual-link"
            title={`Open ${tool.manualName || 'User Guide'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <BookOpen size={13} aria-hidden="true" />
            <span>User Manual</span>
          </a>
        ) : (
          <div className="card-sso-indicator">
            <ShieldCheck size={14} className="sso-icon" aria-hidden="true" />
            <span>SSO Protected</span>
          </div>
        )}

        {tool.videoUrl && (
          <a href={tool.videoUrl} target="_blank" rel="noopener noreferrer" className="card-video-link" onClick={(event) => event.stopPropagation()}>
            <Video size={13} aria-hidden="true" />
            <span>Video Manual</span>
          </a>
        )}
        <a href={tool.url} target={tool.openInNewTab ? '_blank' : '_self'} rel={tool.openInNewTab ? 'noopener noreferrer' : undefined} className="action-launch-btn" aria-label={`Launch ${tool.name}`} onClick={(event) => event.stopPropagation()}>
          <ArrowUpRight size={14} aria-hidden="true" />
          <span>Launch</span>
        </a>
      </div>
    </article>
  );
}
