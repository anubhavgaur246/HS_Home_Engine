import React from 'react';
import { ToolCard } from './ToolCard';
import { RotateCcw } from 'lucide-react';

export function ToolGrid({ tools, searchQuery, onResetSearch, user, onRequireLogin }) {
  const filteredTools = (tools || []).filter((tool) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = String(tool?.name || '').toLowerCase();
    const description = String(tool?.description || '').toLowerCase();
    const category = String(tool?.category || '').toLowerCase();
    const capabilities = Array.isArray(tool?.capabilities) ? tool.capabilities : [];
    return (
      name.includes(q) ||
      description.includes(q) ||
      category.includes(q) ||
      capabilities.some((cap) => String(cap).toLowerCase().includes(q))
    );
  });

  return (
    <section className="tools-section-container" aria-labelledby="suite-section-title">
      <div className="container">
        {/* Section Header */}
        <div className="suite-header-row">
          <div className="suite-title-group">
            <span className="suite-eyebrow">Enterprise Core Tools</span>
            <h2 id="suite-section-title" className="suite-title">
              Internal Applications
            </h2>
          </div>

          <div className="suite-header-actions">
            <div className="suite-coming-soon-banner" role="status">
              <span className="suite-coming-soon-kicker">New</span>
              <span className="suite-coming-soon-title">Capacitor Tool</span>
              <span className="suite-coming-soon-detail">Coming soon</span>
            </div>
            <div className="suite-count-pill">
              <span>{filteredTools.length} of {tools.length} Tools Ready</span>
            </div>
          </div>
        </div>

        {/* 4 Tool Cards Grid */}
        {filteredTools.length > 0 ? (
          <div className="tools-grid-premium" role="list">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                user={user}
                onRequireLogin={onRequireLogin}
              />
            ))}
          </div>
        ) : (
          <div className="search-empty-state">
            <p className="empty-state-text">
              No internal tools matched "<strong>{searchQuery}</strong>".
            </p>
            <button
              type="button"
              className="reset-search-btn"
              onClick={onResetSearch}
            >
              <RotateCcw size={15} />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
