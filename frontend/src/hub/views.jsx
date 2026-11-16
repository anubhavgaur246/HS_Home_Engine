import React, { useEffect, useMemo, useRef } from 'react';
import {
  ARROW,
  BACK,
  CHECK,
  DOC,
  EXT,
  HOME,
  ICONS,
  LOCK,
  NEWS,
  PLAY,
  SPARK,
  BELL,
  MEGA,
} from './icons';
import { ILLO } from './illustrations';
import {
  HUB,
  LIVE,
  T,
  TOOLS,
  allUpdates,
  first,
  fmt,
  initials,
  iso,
  monthKey,
  pd,
} from './data';
import { Raw } from './parts';

const reduce =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const finePointer =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(pointer:fine)').matches;

export function Cover({ update, className = '' }) {
  const t = T[update.tool] || HUB;
  return (
    <div className={`cover ${className}`} style={{ '--accent': t.accent }}>
      {update.cover ? (
        <img src={update.cover} alt="" />
      ) : (
        <Raw html={ILLO[update.tool] || ILLO.hub} />
      )}
    </div>
  );
}

export function Tag({ id }) {
  const t = T[id] || HUB;
  return (
    <span className="tag" style={{ '--accent': t.accent }}>
      {t.name}
    </span>
  );
}

export function ToolCard({
  tool,
  user,
  notify,
  onOpen,
  onNotify,
  onRes,
  onLaunch,
  clone,
  index = 0,
}) {
  const t = tool;
  const access = !!user && Array.isArray(user.access) && user.access.includes(t.id);
  const notifyOn = notify.has(t.id);

  let cls = '';
  let status;
  let primary;
  if (t.soon) {
    cls = 'soon';
    status = (
      <span className="status muted">
        <i></i>Coming soon
      </span>
    );
    primary = (
      <button
        className={`btn${notifyOn ? '' : ' accent'}`}
        tabIndex={clone ? -1 : undefined}
        onClick={() => onNotify(t.id)}
      >
        <Raw html={notifyOn ? CHECK : BELL} />
        {notifyOn ? 'Launch alert on' : 'Notify me at launch'}
      </button>
    );
  } else if (!user) {
    status = (
      <span className="status">
        <i></i>Live
      </span>
    );
    primary = (
      <button
        className="btn accent"
        tabIndex={clone ? -1 : undefined}
        onClick={() => onOpen(t.id)}
      >
        <Raw html={LOCK} />
        Log in to open
      </button>
    );
  } else if (access) {
    status = (
      <span className="status">
        <i></i>Ready
      </span>
    );
    primary = (
      <a
        className="btn accent"
        tabIndex={clone ? -1 : undefined}
        href={t.url}
        target="_blank"
        rel="noopener"
        onClick={() => onLaunch(t.id)}
      >
        Open {t.name.split(' ')[0]}
        <Raw html={EXT} />
      </a>
    );
  } else {
    cls = 'locked';
    status = (
      <span className="status muted">
        <Raw html={LOCK} />
        No access
      </span>
    );
    primary = (
      <button
        className="btn"
        tabIndex={clone ? -1 : undefined}
        onClick={() => onOpen(t.id)}
      >
        <Raw html={LOCK} />
        Request access
      </button>
    );
  }

  const sec = t.soon ? (
    <>
      <button className="btn sm" disabled tabIndex={clone ? -1 : undefined}>
        <Raw html={DOC} />
        User guide
      </button>
      <button className="btn sm" disabled tabIndex={clone ? -1 : undefined}>
        <Raw html={PLAY} />
        Tool demo
      </button>
    </>
  ) : (
    <>
      <a
        className="btn sm"
        tabIndex={clone ? -1 : undefined}
        href={t.manual}
        target="_blank"
        rel="noopener"
        onClick={() => onRes(`${t.name} user guide`)}
      >
        <Raw html={DOC} />
        User guide
      </a>
      <a
        className="btn sm"
        tabIndex={clone ? -1 : undefined}
        href={t.demo}
        target="_blank"
        rel="noopener"
        onClick={() => onRes(`${t.name} demo`)}
      >
        <Raw html={PLAY} />
        Tool demo
      </a>
    </>
  );

  return (
    <article
      className={`tool-card ${cls}`}
      style={{ '--accent': t.accent, animationDelay: `${clone ? 0 : index * 70}ms` }}
      aria-hidden={clone ? 'true' : undefined}
      onPointerMove={(e) => {
        if (reduce || !finePointer || e.buttons) return;
        if (e.currentTarget.closest('.car-viewport')?.classList.contains('dragging')) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        e.currentTarget.style.setProperty('--mx', `${x * 100}%`);
        e.currentTarget.style.setProperty('--my', `${y * 100}%`);
        e.currentTarget.style.transform = `perspective(1000px) rotateX(${
          (0.5 - y) * 4
        }deg) rotateY(${(x - 0.5) * 6}deg) translateY(-6px)`;
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = '';
      }}
    >
      <div className="tc-cover">
        <Raw html={ILLO[t.id] || ILLO.hub} />
        <div className="tc-badges">
          {t.isNew ? (
            <span className="new-badge">
              <Raw html={SPARK} />
              New
            </span>
          ) : (
            <span></span>
          )}
          {status}
        </div>
        <span className="lock-overlay">
          <Raw html={LOCK} />
        </span>
      </div>
      <div className="tc-body">
        <div className="tc-title">
          <span className="tc-mini">
            <Raw html={ICONS[t.id]} />
          </span>
          <div>
            <h3>{t.name}</h3>
            <span className="tc-sub">{t.sub}</span>
          </div>
        </div>
        <p className="tc-desc">{t.desc}</p>
        {t.isNew ? <p className="tc-new">New: {t.isNew}</p> : null}
        <ul className="tc-feat">
          {t.features.map((f) => (
            <li key={f}>
              <Raw html={CHECK} />
              {f}
            </li>
          ))}
        </ul>
        <div className="tc-actions">
          {primary}
          <div className="tc-sec">{sec}</div>
        </div>
      </div>
    </article>
  );
}

function useCarousel() {
  const vpRef = useRef(null);
  const api = useRef({ nav: () => {} });

  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const s = {
      pos: 0,
      hover: false,
      dragging: false,
      moved: false,
      sx: 0,
      sl: 0,
      autoSet: false,
      vel: 0,
      lastX: 0,
      lastT: 0,
      inertia: 0,
    };
    const half = () => (vp.firstElementChild ? vp.firstElementChild.scrollWidth / 2 : 0);
    const wrap = () => {
      const h = half();
      if (!h) return;
      if (s.pos >= h) s.pos -= h;
      if (s.pos < 0) s.pos += h;
    };
    const onScroll = () => {
      if (s.autoSet) {
        s.autoSet = false;
        return;
      }
      s.pos = vp.scrollLeft;
      wrap();
    };
    const onEnter = () => (s.hover = true);
    const onLeave = () => (s.hover = false);
    const onFocusIn = () => (s.hover = true);
    const onFocusOut = () => (s.hover = false);
    const onPointerDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      s.dragging = true;
      s.moved = false;
      s.sx = e.clientX;
      s.sl = s.pos;
      s.lastX = e.clientX;
      s.lastT = performance.now();
      s.vel = 0;
      s.inertia = 0;
    };
    const onClickCapture = (e) => {
      if (s.moved) {
        e.stopPropagation();
        e.preventDefault();
        s.moved = false;
      }
    };
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        e.preventDefault();
        s.pos += e.shiftKey ? e.deltaY : e.deltaX;
        wrap();
        s.autoSet = true;
        vp.scrollLeft = s.pos;
      }
    };
    const onMove = (e) => {
      if (!s.dragging) return;
      const dx = e.clientX - s.sx;
      if (Math.abs(dx) > 5) {
        s.moved = true;
        vp.classList.add('dragging');
      }
      s.pos = s.sl - dx;
      wrap();
      s.autoSet = true;
      vp.scrollLeft = s.pos;
      const now = performance.now();
      s.vel = ((s.lastX - e.clientX) / Math.max(1, now - s.lastT)) * 16;
      s.lastX = e.clientX;
      s.lastT = now;
    };
    const onUp = () => {
      if (!s.dragging) return;
      s.dragging = false;
      vp.classList.remove('dragging');
      if (s.moved) s.inertia = Math.max(-40, Math.min(40, s.vel));
    };

    vp.addEventListener('scroll', onScroll);
    vp.addEventListener('mouseenter', onEnter);
    vp.addEventListener('mouseleave', onLeave);
    vp.addEventListener('focusin', onFocusIn);
    vp.addEventListener('focusout', onFocusOut);
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('click', onClickCapture, true);
    vp.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    api.current.nav = (dir) => {
      s.hover = true;
      const c = vp.querySelector('.tool-card');
      const w = (c ? c.getBoundingClientRect().width : 300) + 24;
      s.pos += dir * w;
      wrap();
      s.autoSet = true;
      vp.scrollTo({ left: s.pos, behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(() => {
        s.hover = vp.matches(':hover');
      }, 900);
    };

    let raf;
    const loop = () => {
      if (vp.isConnected && !s.dragging && !document.querySelector('.backdrop.open')) {
        if (Math.abs(s.inertia) > 0.2) {
          s.pos += s.inertia;
          s.inertia *= 0.94;
        } else if (!s.hover && !reduce) {
          s.pos += 0.5;
        }
        wrap();
        s.autoSet = true;
        vp.scrollLeft = s.pos;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      vp.removeEventListener('scroll', onScroll);
      vp.removeEventListener('mouseenter', onEnter);
      vp.removeEventListener('mouseleave', onLeave);
      vp.removeEventListener('focusin', onFocusIn);
      vp.removeEventListener('focusout', onFocusOut);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('click', onClickCapture, true);
      vp.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return { vpRef, nav: (dir) => api.current.nav(dir) };
}

export function HomeView({
  user,
  updates,
  notify,
  onOpen,
  onNotify,
  onRes,
  onLaunch,
  onPost,
  onAsk,
  toolTab,
  setToolTab,
  onNavigate,
}) {
  const { vpRef, nav } = useCarousel();
  const now = new Date();

  if (!user) {
    return (
      <div className="home-view">
        <div className="aurora" aria-hidden="true">
          <div className="grid-bg"></div>
          <i></i>
          <i></i>
          <i></i>
        </div>
        <section className="glance" id="tools">
          <div className="wrap glance-head">
            <div>
              <p className="hello">Built for every team at Highspring</p>
              <h1>
                Empowering teams through <span className="hl">intelligent technology.</span>
              </h1>
              <p className="g-sub">
                Connecting people, processes and technology across Highspring.
              </p>
            </div>
            <div className="glance-chips">
              <span className="g-chip ok">
                <b>{LIVE.length}</b>Live tools
              </span>
              <span className="g-chip">
                <b>{TOOLS.length - LIVE.length}</b>Coming soon
              </span>
            </div>
          </div>
          <div style={{ padding: '28px 40px 0' }}>
            <h2
              style={{
                fontFamily: 'var(--display)',
                fontSize: 'clamp(26px,3vw,34px)',
                fontWeight: 700,
                background: 'var(--primary-bg)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'inline-block',
              }}
            >
              Our tools
            </h2>
          </div>
          <div className="car-wrap">
            <button
              type="button"
              className="car-nav prev"
              onClick={() => nav(-1)}
              aria-label="Scroll tools left"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div
              className="car-viewport"
              id="carViewport"
              ref={vpRef}
              role="region"
              aria-label="Highspring tools. Drag or scroll sideways to browse."
            >
              <div className="car-track" id="carTrack">
                {TOOLS.map((t, i) => (
                  <ToolCard
                    key={t.id}
                    tool={t}
                    index={i}
                    user={user}
                    notify={notify}
                    onOpen={onOpen}
                    onNotify={onNotify}
                    onRes={onRes}
                    onLaunch={onLaunch}
                  />
                ))}
                {TOOLS.map((t, i) => (
                  <ToolCard
                    key={`clone-${t.id}`}
                    tool={t}
                    index={i}
                    clone
                    user={user}
                    notify={notify}
                    onOpen={onOpen}
                    onNotify={onNotify}
                    onRes={onRes}
                    onLaunch={onLaunch}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              className="car-nav next"
              onClick={() => nav(1)}
              aria-label="Scroll tools right"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </section>
      </div>
    );
  }

  const userAccess = Array.isArray(user.access) ? user.access : [];
  const ready = userAccess.length;
  const locked = LIVE.length - ready;
  const monthUps = updates.filter((u) => u.date.slice(0, 7) === iso(now).slice(0, 7)).length;
  const buckets = {
    ready: TOOLS.filter((t) => !t.soon && userAccess.includes(t.id)),
    locked: TOOLS.filter((t) => !t.soon && !userAccess.includes(t.id)),
    soon: TOOLS.filter((t) => t.soon),
  };
  const list = buckets[toolTab] || [];
  const greeting = () => {
    const h = now.getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div className="home-view">
      <section className="wrap">
        <div className="welcome">
          <div>
            <p className="w-date">
              {now.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1>
              {greeting()}, <span className="nm">{first(user.name)}</span>{' '}
              <span className="wave" aria-hidden="true">
                👋
              </span>
            </h1>
            <p className="w-sub">Here’s everything you can open today.</p>
            <div className="w-meta">
              <span className="w-pill">{user.role}</span>
              <span className="w-pill">
                <b>{ready}</b> of {LIVE.length} tools ready
              </span>
              {locked ? (
                <span className="w-pill">
                  <b>{locked}</b> locked
                </span>
              ) : null}
              <span className="w-pill">
                <b>{monthUps}</b> updates this month
              </span>
            </div>
          </div>
          <div className="w-actions">
            {user.canPost && (
              <button className="btn w-cta" onClick={onPost}>
                <Raw html={MEGA} />
                <span>Post an update</span>
              </button>
            )}
          </div>
        </div>
      </section>
      <section className="section" id="tools" style={{ paddingTop: 28 }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <h2>Your tools</h2>
              <p>Each tool opens in its own tab. Manuals and demos are on every card.</p>
            </div>
            <div className="seg" id="toolTabs" role="tablist" aria-label="Filter your tools">
              <button
                type="button"
                role="tab"
                aria-selected={toolTab === 'ready'}
                onClick={() => setToolTab('ready')}
              >
                Ready<b>{buckets.ready.length}</b>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={toolTab === 'locked'}
                onClick={() => setToolTab('locked')}
              >
                Locked<b>{buckets.locked.length}</b>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={toolTab === 'soon'}
                onClick={() => setToolTab('soon')}
              >
                Coming soon<b>{buckets.soon.length}</b>
              </button>
            </div>
          </div>
          <div className="tools-grid" id="toolsGrid">
            {list.length ? (
              list.map((t, i) => (
                <ToolCard
                  key={t.id}
                  tool={t}
                  index={i}
                  user={user}
                  notify={notify}
                  onOpen={onOpen}
                  onNotify={onNotify}
                  onRes={onRes}
                  onLaunch={onLaunch}
                />
              ))
            ) : (
              <div className="empty">
                <b>Nothing here yet</b>No tools in this category.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export function NewsPage({
  updates,
  user,
  filters,
  setFilters,
  onPost,
  onNavigate,
}) {
  const top = updates[0];
  const toolsF = [{ id: 'all', name: 'All', accent: '#4A5E78' }, ...TOOLS, HUB];
  const filtering = filters.tool !== 'all' || filters.from || filters.to;
  const list = updates.filter(
    (u) =>
      (filtering || u.id !== top?.id) &&
      (filters.tool === 'all' || u.tool === filters.tool) &&
      (!filters.from || u.date >= filters.from) &&
      (!filters.to || u.date <= filters.to)
  );

  const range = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    setFilters({ ...filters, from: iso(d), to: iso(new Date()) });
  };

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-top">
          <a className="btn icon-only" href="#top" aria-label="Back to home" title="Back to home">
            <Raw html={HOME} />
          </a>
          <div>
            <p className="crumb">
              <a href="#top">Home</a> / What’s new
            </p>
            <h1>What’s new</h1>
          </div>
          {user && user.canPost && (
            <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={onPost}>
              <Raw html={MEGA} />
              Post an update
            </button>
          )}
        </div>

        {top && (
          <a className="feature" href={`#update-${top.id}`}>
            <Cover update={top} />
            <div className="feature-body">
              <span className="latest-flag">
                <Raw html={SPARK} />
                Latest
              </span>
              <div className="meta">
                <Tag id={top.tool} />
                <span className="type">{top.type}</span>
                <span>{fmt(top.date)}</span>
              </div>
              <h2>{top.title}</h2>
              <p>{top.summary}</p>
              <div className="author">
                <span className="avatar">{initials(top.author)}</span>
                <span>
                  {top.author}
                  <small>{top.role || 'Highspring'}</small>
                </span>
              </div>
            </div>
          </a>
        )}

        <div className="filters">
          <h2>History</h2>
          <div className="fgroup">
            <span className="lbl" style={{ margin: 0 }}>
              Tool
            </span>
            <div className="fchips" id="fTools">
              {toolsF.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="fchip-btn"
                  style={{ '--accent': t.accent }}
                  aria-pressed={filters.tool === t.id}
                  onClick={() => setFilters({ ...filters, tool: t.id })}
                >
                  {t.id !== 'all' && <i></i>}
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="fgroup">
            <span className="lbl" style={{ margin: 0 }}>
              Date
            </span>
            <div className="daterow">
              <label htmlFor="fFrom">From</label>
              <input
                type="date"
                id="fFrom"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
              <label htmlFor="fTo">To</label>
              <input
                type="date"
                id="fTo"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
              <div className="fchips">
                <button type="button" className="fchip-btn" onClick={() => range(30)}>
                  Last 30 days
                </button>
                <button type="button" className="fchip-btn" onClick={() => range(90)}>
                  Last 90 days
                </button>
                <button
                  type="button"
                  className="fchip-btn"
                  onClick={() => setFilters({ tool: 'all', from: '', to: '' })}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="result-count" aria-live="polite">
          {filtering
            ? `${list.length} update${list.length === 1 ? '' : 's'} match your filters`
            : `${list.length} earlier update${list.length === 1 ? '' : 's'}`}
        </p>

        <div>
          {list.length === 0 ? (
            <div className="empty">
              <b>No updates match</b>Try another tool or a wider date range.
            </div>
          ) : (
            (() => {
              let month = '';
              return list.map((u, i) => {
                const k = monthKey(u.date);
                const heading = k !== month;
                month = k;
                return (
                  <React.Fragment key={u.id}>
                    {heading && <div className="month">{k}</div>}
                    <a
                      className="hist"
                      href={`#update-${u.id}`}
                      style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
                    >
                      <div>
                        <div className="meta">
                          <Tag id={u.tool} />
                          <span className="type">{u.type}</span>
                          <span>{fmt(u.date)}</span>
                        </div>
                        <h3>{u.title}</h3>
                        <p>{u.summary}</p>
                      </div>
                      <Cover update={u} />
                    </a>
                  </React.Fragment>
                );
              });
            })()
          )}
        </div>
      </div>
    </div>
  );
}

export function ArticlePage({ update, updates, docURLs, onOpenTool, onMissingDoc }) {
  if (!update) {
    return (
      <div className="page">
        <div className="wrap">
          <div className="empty">
            <b>That update isn’t here</b>
            <a className="btn" href="#whats-new" style={{ marginTop: 12 }}>
              <Raw html={BACK} />
              All updates
            </a>
          </div>
        </div>
      </div>
    );
  }

  const more = updates
    .filter((x) => x.id !== update.id)
    .sort((a, b) => (b.tool === update.tool) - (a.tool === update.tool))
    .slice(0, 3);
  const tool = T[update.tool];

  return (
    <div className="page">
      <div className="wrap">
        <article className="article">
          <div className="page-top">
            <a className="btn" href="#whats-new">
              <Raw html={BACK} />
              All updates
            </a>
            <a className="btn icon-only" href="#top" aria-label="Back to home" title="Back to home">
              <Raw html={HOME} />
            </a>
          </div>
          <div className="meta">
            <Tag id={update.tool} />
            <span className="type">{update.type}</span>
            <span>{fmt(update.date)}</span>
          </div>
          <h1>{update.title}</h1>
          <p className="dek">{update.summary}</p>
          <div className="author">
            <span className="avatar">{initials(update.author)}</span>
            <span>
              {update.author}
              <small>
                {update.role ? `${update.role}, ` : ''}
                {fmt(update.date)}
              </small>
            </span>
          </div>
          <Cover update={update} className="" />
          <div className="prose">
            {update.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {update.doc && (
            <div className="attach">
              <span className="ai">
                <Raw html={DOC} />
              </span>
              <span>
                {update.doc.name}
                <small>{update.doc.size}</small>
              </span>
              {docURLs[update.id] ? (
                <a className="btn sm" href={docURLs[update.id]} download={update.doc.name}>
                  Download
                </a>
              ) : (
                <button className="btn sm" type="button" onClick={() => onMissingDoc?.()}>
                  Download
                </button>
              )}
            </div>
          )}
          {tool && !tool.soon && update.tool !== 'hub' && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn accent"
                style={{
                  '--accent': tool.accent,
                  '--acc-strong': `color-mix(in srgb,${tool.accent} 78%,#000)`,
                }}
                onClick={() => onOpenTool(update.tool)}
              >
                Open {tool.name}
                <Raw html={EXT} />
              </button>
              <a className="btn" href={tool.manual} target="_blank" rel="noopener">
                <Raw html={DOC} />
                User guide
              </a>
            </div>
          )}
          <div className="more-list">
            <h2>More updates</h2>
            {more.map((x, i) => (
              <a
                className="hist"
                href={`#update-${x.id}`}
                key={x.id}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div>
                  <div className="meta">
                    <Tag id={x.tool} />
                    <span>{fmt(x.date)}</span>
                  </div>
                  <h3>{x.title}</h3>
                  <p>{x.summary}</p>
                </div>
                <Cover update={x} />
              </a>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
