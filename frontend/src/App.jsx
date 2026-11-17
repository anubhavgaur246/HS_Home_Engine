import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SiteHeader, NewsBar, SiteFooter, Toasts } from './hub/parts';
import { HomeView, NewsPage, ArticlePage } from './hub/views';
import {
  LoginModal,
  DemoModal,
  PostModal,
  BugModal,
  NoAccessModal,
} from './hub/modals';
import { Assistant } from './hub/Assistant';
import { AdminView } from './hub/admin';
import {
  BUG,
  CHAT,
  DOC,
  ICONS,
  MEGA,
  MOON,
  NEWS,
  PLAY,
  SW,
} from './hub/icons';
import {
  HUB,
  T,
  TOOLS,
  allUpdates,
  emailOk,
  first,
  fmt,
  iso,
  setApiTools,
} from './hub/data';

const reduce =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  LEAD: 'Lead',
  CO_LEAD: 'Co-lead',
  HR: 'HR',
  TA: 'TA',
  USER: 'Employee',
};

const prettifyName = (email = '') =>
  email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const mapBackendUser = (data) => {
  const email = data.email || '';
  const rawRole = data.role || 'USER';
  const canPost = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'LEAD', 'CO_LEAD'].includes(rawRole);
  return {
    email,
    name: prettifyName(email),
    role: ROLE_LABEL[rawRole] || rawRole,
    rawRole,
    canPost,
    isAdmin: rawRole === 'SUPER_ADMIN',
    token: data.access_token,
  };
};

const loadUser = () => {
  try {
    const raw = sessionStorage.getItem('hs_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.email) {
        return {
          name: prettifyName(u.email),
          role: u.role || 'Employee',
          canPost: !!u.canPost,
          isAdmin: !!u.isAdmin,
          ...u,
        };
      }
    }
  } catch (e) {
    /* noop */
  }
  try {
    const token = sessionStorage.getItem('hs-access-token');
    const email = sessionStorage.getItem('hs-user-email');
    if (token && email) {
      return mapBackendUser({ access_token: token, email, role: sessionStorage.getItem('hs-user-role') });
    }
  } catch (e) {
    /* noop */
  }
  return null;
};

export function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return (
        localStorage.getItem('hs_theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      );
    } catch (e) {
      return 'light';
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [adminSection, setAdminSection] = useState('all');
  const [user, setUser] = useState(loadUser);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetRequired, setResetRequired] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toolsVersion, setToolsVersion] = useState(0);
  const AUTH_API_BASE = '/api/auth';

  const navigate = (h) => {
    const target = h.startsWith('#') ? h : `#${h}`;
    if (window.location.hash === target) {
      setRoute(decodeURIComponent(h.replace(/^#/, '')));
      return;
    }
    window.location.hash = target;
  };

  const [posts, setPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hs_posts') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [notify, setNotify] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('hs_notify') || '[]'));
    } catch (e) {
      return new Set();
    }
  });
  const [route, setRoute] = useState(() => decodeURIComponent(window.location.hash.slice(1)));
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [pendingTool, setPendingTool] = useState(null);
  const [naTool, setNaTool] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantAsk, setAssistantAsk] = useState(null);
  const [toolTab, setToolTab] = useState('ready');
  const [filters, setFilters] = useState({ tool: 'all', from: '', to: '' });
  const [docURLs, setDocURLs] = useState({});
  const [toasts, setToasts] = useState([]);

  const toast = (msg, action) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, action }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x)));
    }, action ? 6000 : 2800);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, action ? 6300 : 3100);
  };

  const setSessionUser = (result) => {
    sessionStorage.setItem('hs-access-token', result.access_token);
    sessionStorage.setItem('hs-user-email', result.email);
    sessionStorage.setItem('hs-user-role', result.role || '');
    sessionStorage.setItem('hs-user-level', result.level || '');
    sessionStorage.setItem('hs-user-team', result.team || '');
    sessionStorage.setItem('hs-user-programme-name', result.programme_name || '');
    sessionStorage.setItem('hs-user-project-name', result.projectname || '');
    sessionStorage.setItem('hs-user-manager', result.manager || '');
    sessionStorage.setItem('hs-user-lead', result.lead || '');
    setUser({
      token: result.access_token,
      email: result.email,
      role: result.role || '',
      level: result.level || '',
      team: result.team || '',
      programme_name: result.programme_name || '',
      projectname: result.projectname || '',
      manager: result.manager || '',
      lead: result.lead || '',
    });
    navigate(result.role === 'SUPER_ADMIN' ? 'admin' : 'top');
  };

  const openModal = (id) => setModal(id);
  const closeModal = () => setModal(null);

  const openLogin = (toolId) => {
    setPendingTool(toolId || null);
    setModal('login');
  };

  const updates = useMemo(() => allUpdates(posts), [posts]);

  const toggleNotifyFor = (u, id) => {
    if (!u) {
      openLogin(id);
      return;
    }
    const next = new Set(notify);
    const on = !next.has(id);
    if (on) next.add(id);
    else next.delete(id);
    setNotify(next);
    toast(
      on
        ? `We’ll email ${u.email} when ${T[id].name} launches`
        : `${T[id].name} launch alert turned off`
    );
  };

  const tryOpenFor = (u, id) => {
    const t = T[id];
    if (!t || id === 'hub') return;
    if (t.soon) {
      toggleNotifyFor(u, id);
      return;
    }
    if (t.inactive) {
      toast(`${t.name} is currently inactive`);
      return;
    }
    if (!u) {
      openLogin(id);
      return;
    }
    if (!t.url) {
      toast(`No app URL configured for ${t.name}`);
      return;
    }
    window.open(t.url, '_blank', 'noopener');
    toast(`Opening ${t.name} in a new tab`);
  };

  const tryOpen = (id) => tryOpenFor(user, id);
  const toggleNotify = (id) => toggleNotifyFor(user, id);

  const finishLogin = (u, p) => {
    if (u.isAdmin) {
      navigate('admin');
      toast(`Logged in as ${u.name}, ${u.role}`);
      return;
    }
    navigate('top');
    if (p) {
      const t = T[p];
      if (t?.soon) {
        toggleNotifyFor(u, p);
      } else if (t?.url) {
        toast(`Logged in. ${t.name} is ready.`, {
          label: `Open ${t.name}`,
          href: t.url,
        });
      } else {
        toast(`Logged in as ${u.name}`);
      }
    } else {
      toast(`Logged in as ${u.name}`);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${AUTH_API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));
      const data = result?.data || {};
      if (data.requires_password_reset) {
        return {
          requiresReset: true,
          resetToken: data.reset_token || '',
          message:
            result?.message ||
            'Your password needs to be reset. Please choose a new password and confirm it to continue.',
        };
      }
      if (!response.ok || result?.success === false || !data.access_token) {
        return {
          ok: false,
          error:
            result?.detail ||
            result?.error ||
            result?.message ||
            'Email or password is incorrect.',
        };
      }
      const u = mapBackendUser(data);
      setUser(u);
      const p = pendingTool;
      setPendingTool(null);
      return { ok: true, afterLogin: () => finishLogin(u, p) };
    } catch (e) {
      return { ok: false, error: 'Unable to sign in. Please check your connection and try again.' };
    }
  };

  const handleResetPassword = async (token, newPassword, email) => {
    try {
      const resetResponse = await fetch(`${AUTH_API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const resetResult = await resetResponse.json().catch(() => ({}));
      if (!resetResponse.ok || resetResult?.success === false) {
        return {
          ok: false,
          error:
            resetResult?.detail ||
            resetResult?.error ||
            resetResult?.message ||
            'Unable to reset your password.',
        };
      }
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword }),
      });
      const loginResult = await loginResponse.json().catch(() => ({}));
      const data = loginResult?.data || {};
      if (!loginResponse.ok || !data.access_token) {
        return {
          ok: false,
          error:
            loginResult?.detail ||
            loginResult?.error ||
            loginResult?.message ||
            'Login failed after password reset.',
        };
      }
      const u = mapBackendUser(data);
      setUser(u);
      const p = pendingTool;
      setPendingTool(null);
      return { ok: true, afterLogin: () => finishLogin(u, p) };
    } catch (e) {
      return { ok: false, error: 'Unable to reset your password. Please try again.' };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('hs-access-token');
    sessionStorage.removeItem('hs-user-email');
    sessionStorage.removeItem('hs-user-role');
    sessionStorage.removeItem('hs-user-level');
    sessionStorage.removeItem('hs-user-team');
    sessionStorage.removeItem('hs-user-programme-name');
    sessionStorage.removeItem('hs-user-project-name');
    sessionStorage.removeItem('hs-user-manager');
    sessionStorage.removeItem('hs-user-lead');
    setUser(null);
    try {
      sessionStorage.removeItem('hs_user');
      sessionStorage.removeItem('hs-access-token');
      sessionStorage.removeItem('hs-user-email');
      sessionStorage.removeItem('hs-user-role');
    } catch (e) {
      /* noop */
    }
    navigate('top');
    toast('Logged out');
  };

  const openPost = () => {
    if (!user || !user.canPost) {
      toast('Only managers and leads can post updates');
      return;
    }
    setModal('post');
  };

  const publish = (post, docFile) => {
    const next = [post, ...posts];
    setPosts(next);
    if (docFile) {
      const url = URL.createObjectURL(docFile);
      setDocURLs((d) => ({ ...d, [post.id]: url }));
    }
    let ok = true;
    try {
      localStorage.setItem('hs_posts', JSON.stringify(next));
    } catch (e) {
      ok = false;
      const fallback = next.map((p) => (p.id === post.id ? { ...p, cover: null } : p));
      try {
        localStorage.setItem('hs_posts', JSON.stringify(fallback));
        setPosts(fallback);
      } catch (e2) {
        /* noop */
      }
    }
    navigate('update-' + post.id);
    toast(
      ok
        ? 'Update published to What’s new'
        : 'Published. The cover image is too large to keep after a reload.'
    );
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('hs_theme', theme);
    } catch (e) {
      /* noop */
    }
  }, [theme]);

  useEffect(() => {
    try {
      if (user) {
        sessionStorage.setItem('hs_user', JSON.stringify(user));
        sessionStorage.setItem('hs-access-token', user.token || '');
        sessionStorage.setItem('hs-user-email', user.email || '');
        sessionStorage.setItem('hs-user-role', user.rawRole || '');
      } else {
        sessionStorage.removeItem('hs_user');
        sessionStorage.removeItem('hs-access-token');
        sessionStorage.removeItem('hs-user-email');
        sessionStorage.removeItem('hs-user-role');
      }
    } catch (e) {
      /* noop */
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/tools')
      .then((response) => response.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success === false) throw new Error(result?.message || 'Unable to load tools');
        setApiTools(result?.data?.tools || []);
        setToolsVersion((version) => version + 1);
      })
      .catch(() => {
        if (cancelled) return;
        setApiTools([]);
        setToolsVersion((version) => version + 1);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('hs_posts', JSON.stringify(posts));
    } catch (e) {
      /* noop */
    }
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem('hs_notify', JSON.stringify([...notify]));
    } catch (e) {
      /* noop */
    }
  }, [notify]);

  useEffect(() => {
    const onHash = () => setRoute(decodeURIComponent(window.location.hash.slice(1)));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (route === 'admin' && !user?.isAdmin) {
      navigate('top');
    }
  }, [route, user?.isAdmin]);

  useEffect(() => {
    const isHome = !route || route === 'top';
    document.documentElement.classList.toggle('onepage', isHome && !user);
    if (!isHome) window.scrollTo(0, 0);
  }, [route, user]);

  useEffect(() => {
    if (!user) return;
    if (TOOLS.some((t) => !t.soon && !t.inactive)) setToolTab('ready');
    else if (TOOLS.some((t) => t.soon)) setToolTab('soon');
    else if (TOOLS.some((t) => t.inactive)) setToolTab('inactive');
    else setToolTab('ready');
  }, [user, route, toolsVersion]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setModal(null);
        setAssistantOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const handler = (e) => {
      const b = e.target.closest(
        '.btn,.chip-toggle,.sug,.quick button,.w-act,.fchip-btn,.slot'
      );
      if (!b) return;
      const r = b.getBoundingClientRect();
      const s = Math.max(r.width, r.height) * 2;
      const sp = document.createElement('span');
      sp.className = 'ripple';
      sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${
        e.clientY - r.top - s / 2
      }px`;
      b.appendChild(sp);
      setTimeout(() => sp.remove(), 600);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  const askAssistant = (q) => {
    setAssistantOpen(true);
    setAssistantAsk({ q, id: Date.now() });
  };

  const searchIndex = useMemo(() => {
    const I = [];
    TOOLS.forEach((t) => {
      I.push({
        g: 'Tools',
        title: t.name,
        sub: t.soon ? 'Coming soon' : t.sub,
        ac: t.accent,
        ic: ICONS[t.iconKey] || ICONS.hub,
        k: `${t.name} ${t.desc}`,
        run: () => tryOpen(t.id),
      });
      if (!t.soon && t.manual) {
        I.push({
          g: 'Manuals and demos',
          title: `${t.name} manual`,
          sub: 'User manual',
          ac: t.accent,
          ic: SW(DOC),
          k: 'manual guide help docs',
          run: () => {
            window.open(t.manual, '_blank', 'noopener');
            toast(`Opening ${t.name} manual in a new tab`);
          },
        });
      }
      if (!t.soon && t.demo) {
        I.push({
          g: 'Manuals and demos',
          title: `${t.name} demo`,
          sub: 'Try the tool demo',
          ac: t.accent,
          ic: SW(PLAY),
          k: 'demo try sandbox video',
          run: () => {
            window.open(t.demo, '_blank', 'noopener');
            toast(`Opening ${t.name} demo in a new tab`);
          },
        });
      }
    });
    updates.forEach((u) => {
      const t = T[u.tool] || HUB;
      I.push({
        g: 'Updates',
        title: u.title,
        sub: `${t.name}, ${fmt(u.date)}`,
        ac: t.accent,
        ic: SW(NEWS),
        k: `${u.summary} ${u.type} update release`,
        run: () => navigate('update-' + u.id),
      });
    });
    const A = [
      [
        'What’s new',
        'All launches and updates',
        NEWS,
        'whats new updates history changelog',
        () => navigate('whats-new'),
      ],
      ['Report a bug', 'Tell the product team', BUG, 'bug issue problem broken report', () => setModal('bug')],
      [
        'Switch theme',
        'Light or dark',
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MOON}</svg>`,
        'dark light theme mode',
        () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      ],
      [
        'Ask the hub assistant',
        'Questions about tools and access',
        CHAT,
        'help assistant support question',
        () => setAssistantOpen(true),
      ],
    ];
    if (!user) {
      A.unshift([
        'Book a demo',
        'Pick a date and time',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/></svg>',
        'demo walkthrough book schedule',
        () => setModal('demo'),
      ]);
      A.unshift([
        'Log in',
        'One login for every tool',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>',
        'login sign in',
        () => openLogin(),
      ]);
    }
    if (user && user.canPost) {
      A.unshift(['Post an update', 'Feature launch or change', MEGA, 'post publish feature launch announce update', () => setModal('post')]);
    }
    A.forEach((a) =>
      I.push({ g: 'Actions', title: a[0], sub: a[1], ac: '#1C5BDB', ic: SW(a[2]), k: a[3], run: a[4] })
    );
    return I;
  }, [user, posts, notify, toolsVersion]);

  const isNews = route === 'whats-new';
  const articleId = route.startsWith('update-') ? route.slice(7) : null;
  const article = articleId ? updates.find((u) => u.id === articleId) : null;
  const isAdminRoute =
    !!user?.isAdmin && (route === 'admin' || route === 'top' || !route);

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <symbol id="hsMark" viewBox="0 0 45 45">
            <g
              fill="none"
              stroke="#2DBFF9"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="13.5" height="13" rx="4.5" />
              <path d="M6 15H29" />
              <path d="M29 15V6.5A4.5 4.5 0 0 1 33.5 2H38A4.5 4.5 0 0 1 42.5 6.5V38A4.5 4.5 0 0 1 38 42.5H33.5A4.5 4.5 0 0 1 29 38V29.5" />
              <path d="M15.5 20.5V29.5" />
              <path d="M6 29.5H29" />
              <rect x="2" y="29.5" width="13.5" height="13" rx="4.5" />
            </g>
          </symbol>
        </defs>
      </svg>

      <div className="aurora" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </div>
      <div className="grid-bg" aria-hidden="true"></div>

      <SiteHeader
        user={user}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onLogin={() => openLogin()}
        onLogout={logout}
        onBug={() => setModal('bug')}
        onDemo={() => setModal('demo')}
        onPost={openPost}
        onNews={() => navigate('whats-new')}
        onAdmin={() => navigate('admin')}
        query={query}
        setQuery={setQuery}
        searchIndex={searchIndex}
        onAsk={askAssistant}
      />

      <NewsBar updates={updates} onOpenNews={() => navigate('whats-new')} />

      <main id="top">
        <div id="view">
          {isAdminRoute ? (
            <AdminView
              user={user}
              updatesCount={updates.length}
              onNavigate={navigate}
              toast={toast}
            />
          ) : isNews ? (
            <NewsPage
              updates={updates}
              user={user}
              filters={filters}
              setFilters={setFilters}
              onPost={openPost}
              onNavigate={navigate}
            />
          ) : articleId ? (
            <ArticlePage
              update={article}
              updates={updates}
              docURLs={docURLs}
              onOpenTool={tryOpen}
              onMissingDoc={() =>
                toast('This prototype keeps attachments only until the page reloads')
              }
            />
          ) : (
            <HomeView
              key={user ? 'auth' : 'anon'}
              user={user}
              updates={updates}
              notify={notify}
              onOpen={tryOpen}
              onNotify={toggleNotify}
              onRes={(label) => toast(`Opening ${label} in a new tab`)}
              onLaunch={(id) => toast(`Opening ${T[id]?.name || 'tool'} in a new tab`)}
              onPost={openPost}
              onAsk={askAssistant}
              toolTab={toolTab}
              setToolTab={setToolTab}
              onNavigate={navigate}
            />
          )}
        </div>
      </main>

      <SiteFooter />

      <LoginModal
        open={modal === 'login'}
        onClose={closeModal}
        pendingTool={pendingTool}
        onLogin={handleLogin}
        onResetPassword={handleResetPassword}
        onForgot={() => toast('A reset link would go to your work email')}
      />
      <DemoModal open={modal === 'demo'} onClose={closeModal} onBooked={() => toast('Demo booked')} />
      <PostModal open={modal === 'post'} onClose={closeModal} user={user} onPublish={publish} />
      <BugModal
        open={modal === 'bug'}
        onClose={closeModal}
        user={user}
        onReport={(tid) => toast(`Bug ${tid} reported`)}
      />
      <NoAccessModal
        open={modal === 'noAccess'}
        onClose={closeModal}
        tool={naTool ? T[naTool] : null}
        user={user}
        onRequest={() => {
          closeModal();
          toast(`Access request sent for ${T[naTool].name}`);
        }}
      />
      <Assistant
        open={assistantOpen}
        onOpen={() => setAssistantOpen(true)}
        onClose={() => setAssistantOpen(false)}
        user={user}
        updates={updates}
        onNavigate={navigate}
        onBug={() => setModal('bug')}
        onLogin={() => openLogin()}
        onOpenTool={tryOpen}
        askRequest={assistantAsk}
        onAskConsumed={() => setAssistantAsk(null)}
      />

      <Toasts items={toasts} />
    </>
  );
}

export default App;
