import React from 'react';
import { Bot, ChevronDown, FileJson2, Moon, Sun, Search, UserPlus, Users, X } from 'lucide-react';

export function Header({ theme, onToggleTheme, onOpenAssistant, onUserManagementSelect, onGoHome, searchQuery, setSearchQuery, user, onLogin, onLogout }) {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header className="site-header" role="banner">
      <div className="container header-inner">
        {/* Brand & Wordmark */}
        <a
          className="brand-wrapper"
          href={user?.role === 'SUPER_ADMIN' ? '/admin' : '/'}
          onClick={(event) => {
            event.preventDefault();
            onGoHome();
          }}
          aria-label="Highspring Digital Solutions Hub home"
        >
          <img className="brand-logo brand-logo-dark" src="https://www.highspring.com/wp-content/uploads/sites/2/2025/01/HS-white-logo.svg" alt="Highspring" />
          <img className="brand-logo brand-logo-light" src="https://www.highspring.com/wp-content/uploads/sites/2/2025/01/HS-black-logo.svg" alt="Highspring" />
          <span className="brand-hub-label">Digital Solutions Hub</span>
        </a>

        {/* Status & Utility Actions */}
        <div className="header-actions">
          <div className="header-search" role="search">
            <Search size={15} aria-hidden="true" />
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search solutions" aria-label="Search solutions" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={14} /></button>}
          </div>
          {/* Operational Status Pill */}
          <div
            className="status-badge-premium"
            title="All 3 core internal tools active and operational"
            role="status"
            aria-live="polite"
          >
            <span className="status-live-dot" />
            <span className="status-text">All Systems Online</span>
          </div>


          

          {/* Quick Assistant / User Guide Trigger */}
          <button
            type="button"
            className="header-assistant-btn"
            onClick={onOpenAssistant}
            title="Open Highspring Assistant & User Guides"
            aria-label="Open Assistant and User Guides"
          >
            <Bot size={16} className="btn-bot-icon" />
            <span>Hub Assistant & Manuals</span>
          </button>

          {user?.role === 'SUPER_ADMIN' && (
            <div className="user-management-menu-wrap header-user-management">
              <button
                type="button"
                className="user-management-menu-trigger"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <Users size={16} />
                <span>User Management</span>
                <ChevronDown size={15} />
              </button>
              {userMenuOpen && (
                <div className="user-management-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => { onUserManagementSelect('all'); setUserMenuOpen(false); }}>
                    <Users size={16} />All Users
                  </button>
                  <button type="button" role="menuitem" onClick={() => { onUserManagementSelect('add-admin'); setUserMenuOpen(false); }}>
                    <UserPlus size={16} />Add Admin
                  </button>
                  <button type="button" role="menuitem" onClick={() => { onUserManagementSelect('import-users'); setUserMenuOpen(false); }}>
                    <FileJson2 size={16} />Import Users
                  </button>
                </div>
              )}
            </div>
          )}

          <button type="button" className="header-login-btn" onClick={user ? onLogout : onLogin}>
            {user ? 'Sign out' : 'Login'}
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle-premium"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Executive Dark'} mode`}
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}
