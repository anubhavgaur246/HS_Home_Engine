import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ARROW,
  BACK,
  BUG,
  CHAT,
  CHECK,
  DOC,
  EYE,
  EYE_OFF,
  GO,
  GO as GO_IC,
  ICONS,
  LOCK,
  MEGA,
  MOON,
  NEWS,
  PLAY,
  SPARK,
  SUN,
  SW,
  BELL,
} from './icons';
import { initials, first, fmt, t12, emailOk, iso, pd, T, HUB, LIVE, TOOLS, SLOTS } from './data';

export function Raw({ html, className, style }) {
  return (
    <span
      className={className}
      style={{ display: 'contents', ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function SiteHeader({
  user,
  theme,
  onToggleTheme,
  onLogin,
  onLogout,
  onBug,
  onDemo,
  query,
  setQuery,
  searchIndex,
  onAsk,
  onSearchPick,
  onPost,
  onNews,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const toks = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = useMemo(() => {
    if (!toks.length) {
      return searchIndex
        .filter(
          (x) =>
            x.g === 'Tools' ||
            (x.g === 'Actions' &&
              ['What’s new', 'Book a demo', 'Post an update'].includes(x.title))
        )
        .map((x) => ({ ...x, g: x.g === 'Tools' ? 'Jump to' : 'Actions' }));
    }
    const sc = [];
    searchIndex.forEach((x) => {
      const t = x.title.toLowerCase();
      const k = `${x.title} ${x.sub} ${x.k}`.toLowerCase();
      if (!toks.every((w) => k.includes(w))) return;
      let s = 0;
      toks.forEach((w) => {
        s += t.startsWith(w) ? 4 : t.includes(w) ? 2 : 1;
      });
      sc.push({ ...x, s });
    });
    const list = [];
    ['Tools', 'Features', 'Manuals and demos', 'Updates', 'Actions'].forEach((g) => {
      sc.filter((x) => x.g === g)
        .sort((a, b) => b.s - a.s)
        .slice(0, 4)
        .forEach((x) => list.push(x));
    });
    return list;
  }, [toks.join(' '), searchIndex]);

  useEffect(() => {
    setActive(results.length ? 0 : -1);
  }, [results.length, query]);

  useEffect(() => {
    if (!open || active < 0) return;
    const el = document.getElementById(`qo${active}`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
      if (!e.target.closest('#userWrap')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setOpen(false);
      }
      const tg = (e.target.tagName || '').toLowerCase();
      const typing =
        tg === 'input' || tg === 'textarea' || tg === 'select' || e.target.isContentEditable;
      if (document.querySelector('.backdrop.open')) return;
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const hl = (s) => {
    let out = String(s).replace(/[&<>"]/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    })[c]);
    toks.forEach((t) => {
      const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return { __html: out };
  };

  const pick = (item) => {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    item?.run?.();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length) {
        setActive((a) => (a + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) {
        setActive((a) => (a - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && results[active]) pick(results[active]);
      else if (!results.length && query.trim()) {
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
        onAsk?.(query.trim());
      }
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="site-head">
      <div className="wrap head-row">
        <a href="#top" className="logo" aria-label="Highspring Digital Solutions Hub, home">
          <span className="brand-lockup">
            <svg className="logo-mark" viewBox="0 0 45 45" aria-hidden="true">
              <use href="#hsMark" />
            </svg>
            <span className="logo-word">Highspring</span>
          </span>
          <span className="logo-div" aria-hidden="true"></span>
          <span className="logo-sub">Digital Solutions Hub</span>
        </a>

        <div className="search" id="search" ref={wrapRef}>
          <svg
            className="icon s-ic"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <label htmlFor="q" className="sr">
            Search the hub
          </label>
          <input
            id="q"
            ref={inputRef}
            type="search"
            placeholder="Search tools, manuals, updates"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls="qResults"
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `qo${active}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
          />
          <kbd aria-hidden="true">/</kbd>
          <div
            className={`q-results${open ? ' open' : ''}`}
            id="qResults"
            role="listbox"
            aria-label="Search results"
            onMouseDown={(e) => e.preventDefault()}
          >
            {results.length === 0 ? (
              <>
                <div className="q-empty">
                  <b>No results for “{query}”</b>
                  <br />
                  Try a tool name like “HAT” or a task like “calendar”.
                </div>
                <button
                  type="button"
                  className="q-item"
                  onClick={() => {
                    const q = query.trim();
                    setOpen(false);
                    setQuery('');
                    inputRef.current?.blur();
                    onAsk?.(q);
                  }}
                >
                  <span className="q-ic">
                    <Raw html={SW(CHAT)} />
                  </span>
                  <span className="t">
                    Ask the hub assistant
                    <small>Get help with “{query}”</small>
                  </span>
                  <Raw html={GO_IC} />
                </button>
              </>
            ) : (
              results.map((x, i) => {
                const showGroup = i === 0 || results[i - 1].g !== x.g;
                return (
                  <React.Fragment key={`${x.g}-${x.title}-${i}`}>
                    {showGroup && <div className="q-group">{x.g}</div>}
                    <button
                      type="button"
                      className={`q-item${i === active ? ' active' : ''}`}
                      role="option"
                      id={`qo${i}`}
                      style={{ '--accent': x.ac, animationDelay: `${Math.min(i, 8) * 25}ms` }}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(x)}
                    >
                      <span className="q-ic">
                        <Raw html={x.ic} />
                      </span>
                      <span className="t">
                        <span dangerouslySetInnerHTML={hl(x.title)} />
                        <small dangerouslySetInnerHTML={hl(x.sub)} />
                      </span>
                      <Raw html={GO} />
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        <div className="head-actions">
          <button className="btn ghost icon-only" onClick={onBug} aria-label="Report a bug" title="Report a bug">
            <Raw html={BUG} />
          </button>
          <button
            className="btn ghost icon-only theme-btn"
            onClick={onToggleTheme}
            aria-label="Switch theme"
            title="Switch theme"
          >
            <svg
              className="icon"
              id="themeIc"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: theme === 'dark' ? SUN : MOON }}
            />
          </button>
          {!user && (
            <button className="btn" id="demoBtn" onClick={onDemo}>
              <svg
                className="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4.5" width="18" height="16" rx="3" />
                <path d="M8 2.5v4M16 2.5v4M3 10h18" />
              </svg>
              <span className="demo-text">Book a demo</span>
              <span className="sr">Book a demo</span>
            </button>
          )}
          {!user && (
            <button className="btn primary" id="loginBtn" onClick={() => onLogin()}>
              <span>Log in</span>
              <Raw html={ARROW} />
            </button>
          )}
          <div id="userWrap" style={{ position: 'relative', display: user ? '' : 'none' }}>
            <button
              className="avatar-btn"
              id="avatarBtn"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
            >
              <span className="avatar" id="avatarInitials">
                {initials(user?.name || '')}
              </span>
              <span id="avatarName">{first(user?.name || '')}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div className={`menu${menuOpen ? ' open' : ''}`} id="userMenu" role="menu">
              <div className="menu-head">
                <b>{user?.name}</b>
                <span>{user?.email}</span>
                <br />
                <span className="tag" style={{ marginTop: 8 }}>
                  {user?.role}
                </span>
              </div>
              {user?.canPost && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onPost?.();
                  }}
                >
                  <Raw html={MEGA} />
                  Post an update
                </button>
              )}
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onNews?.();
                }}
              >
                <Raw html={NEWS} />
                What’s new
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onBug?.();
                }}
              >
                <Raw html={BUG} />
                Report a bug
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function NewsBar({ updates, onOpenNews }) {
  const items = updates.slice(0, 2);
  return (
    <div className="newsbar" aria-label="Latest updates">
      <div className="wrap nb-row">
        <span className="nb-label">
          <span className="live-dot" aria-hidden="true"></span>What’s new
        </span>
        <div className="nb-items" id="nbItems">
          {items.map((u) => {
            const t = T[u.tool] || HUB;
            return (
              <a className="nb-item" href={`#update-${u.id}`} key={u.id}>
                <span className="tag" style={{ '--accent': t.accent }}>
                  {t.name}
                </span>
                <span className="tt">{u.title}</span>
                <time>{fmt(u.date)}</time>
              </a>
            );
          })}
        </div>
        <a className="nb-all" href="#whats-new" onClick={onOpenNews}>
          <span className="txt">All updates</span>
          <span className="arr">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
          <span className="sr">Open What’s new</span>
        </a>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap foot-row">
        <span>© 2026 Highspring Technologies Inc.</span>
        <span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Internal network, enterprise SSO
        </span>
      </div>
    </footer>
  );
}

export function Toasts({ items }) {
  return (
    <div className="toasts" id="toasts" aria-live="polite">
      {items.map((t) => (
        <div className={`toast${t.out ? ' out' : ''}`} key={t.id}>
          <Raw html={CHECK} />
          <span>{t.msg}</span>
          {t.action && (
            <a href={t.action.href} target="_blank" rel="noopener">
              {t.action.label}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
