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
  mapApiAnnouncements,
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
  const rawRole = String(data.role || 'USER').toUpperCase();
  const canPost = ['MANAGER', 'LEAD'].includes(rawRole);
  return {
    id: data.id,
    email,
    name: prettifyName(email),
    role: ROLE_LABEL[rawRole] || rawRole,
    rawRole,
    canPost,
    isAdmin: rawRole === 'SUPER_ADMIN',
    token: data.access_token,
  };
};

const readAuthLink = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('auth_token');
  const action = params.get('auth_action');
  return token && ['setup', 'recovery'].includes(action) ? { token, action } : null;
};

const loadUser = () => {
  try {
    const raw = sessionStorage.getItem('hs_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.email) {
        const mapped = mapBackendUser({
          email: u.email,
          role: u.rawRole || u.role,
          access_token: u.token,
        });
        return {
          ...mapped,
          ...u,
          canPost: mapped.canPost,
          isAdmin: mapped.isAdmin,
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
  const [authLink, setAuthLink] = useState(readAuthLink);
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

  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [notify, setNotify] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('hs_notify') || '[]'));
    } catch (e) {
      return new Set();
    }
  });
  const [route, setRoute] = useState(() => decodeURIComponent(window.location.hash.slice(1)));
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(() => (authLink ? 'login' : null));
  const [pendingTool, setPendingTool] = useState(null);
  const [naTool, setNaTool] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantAsk, setAssistantAsk] = useState(null);
  const [toolTab, setToolTab] = useState('ready');
  const [filters, setFilters] = useState({ tool: 'all', from: '', to: '' });
  const [toasts, setToasts] = useState([]);
  const [announcementError, setAnnouncementError] = useState('');

  useEffect(() => {
    if (authLink) window.history.replaceState({}, '', `${pathname}${window.location.hash}`);
  }, [authLink, pathname]);

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
      ...mapBackendUser(result),
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
  const closeModal = () => {
    setModal(null);
    setEditingPost(null);
    setAuthLink(null);
  };

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
          requiresSetupLink: true,
          setupLinkSent: !!data.setup_link_sent,
          email: data.email || email,
          message:
            result?.message ||
            'Your account needs setup. Check your work email for a password link.',
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

  const handleAuthLinkRequest = async (email, purpose) => {
    try {
      const response = await fetch(
        `${AUTH_API_BASE}/${purpose === 'setup' ? 'signup' : 'forgot-password'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        return { ok: false, error: result?.detail || result?.error || result?.message || 'Unable to send the link.' };
      }
      return { ok: true, message: result?.message };
    } catch (e) {
      return { ok: false, error: 'Unable to contact the server. Please try again.' };
    }
  };

  const handleCompleteAuthLink = async (token, newPassword) => {
    try {
      const response = await fetch(`${AUTH_API_BASE}/complete-password-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        return { ok: false, error: result?.detail || result?.error || result?.message || 'This password link is invalid or expired.' };
      }

      const email = result?.data?.email;
      const loginResponse = await fetch(`${AUTH_API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword }),
      });
      const loginResult = await loginResponse.json().catch(() => ({}));
      const data = loginResult?.data || {};
      if (!loginResponse.ok || !data.access_token) {
        return { ok: true, afterLogin: () => toast('Password updated. Please log in with your new password.') };
      }
      const u = mapBackendUser(data);
      setUser(u);
      const p = pendingTool;
      setPendingTool(null);
      return { ok: true, afterLogin: () => finishLogin(u, p) };
    } catch (e) {
      return { ok: false, error: 'Unable to update your password. Please try again.' };
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

  const openPost = (post = null) => {
    if (!user || !user.canPost) {
      toast('Only managers and leads can post updates');
      return;
    }
    setEditingPost(post);
    setModal('post');
  };

  const publish = async (draft, coverFile, documentFile, editingId) => {
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const upload = async (file, kind) => {
        if (!file) return null;
        const form = new FormData();
        form.append('file', file);
        form.append('kind', kind);
        const response = await fetch('/api/announcements/media', {
          method: 'POST',
          headers,
          body: form,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result?.success === false) {
          throw new Error(result?.message || `Unable to upload ${kind}`);
        }
        return result.data.object_ref;
      };
      const payload = {
        type: {
          'Feature launch': 'FEATURE_LAUNCH',
          Update: 'UPDATE',
          Fix: 'FIX',
          Announcement: 'ANNOUNCEMENT',
        }[draft.type],
        email_subject: draft.emailSubject.trim() || null,
        cc: draft.cc
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
        tool_id: draft.tool === 'hub' ? null : T[draft.tool]?.apiId || null,
        publish_date: draft.date,
        title: draft.title,
        summary: draft.summary,
        description: draft.body,
      };
      const imageRef = await upload(coverFile, 'image');
      const documentRef = await upload(documentFile, 'document');
      if (imageRef) payload.image_url = imageRef;
      if (documentRef) payload.document_url = documentRef;

      const response = await fetch(
        editingId ? `/api/announcements/${editingId}` : '/api/announcements',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || 'Unable to save the update');
      }
      const saved = mapApiAnnouncements([result.data])[0];
      const isPublished = saved.date <= iso(new Date());
      setPosts((current) => {
        const remaining = current.filter((item) => item.id !== saved.id);
        return isPublished ? [saved, ...remaining] : remaining;
      });
      setAnnouncementError('');
      toast(editingId ? 'Update saved' : isPublished ? 'Update published' : 'Update scheduled');
      if (isPublished) navigate(`update-${saved.id}`);
      else navigate('whats-new');
      return true;
    } catch (error) {
      toast(error.message || 'Unable to save the update');
      return false;
    }
  };

  const editAnnouncement = async (post) => {
    try {
      const response = await fetch(`/api/announcements/${post.id}/manage`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || 'Unable to open this update for editing');
      }
      setEditingPost(mapApiAnnouncements([result.data])[0]);
      setModal('post');
    } catch (error) {
      toast(error.message || 'Unable to open this update for editing');
    }
  };

  const deleteAnnouncement = async (post) => {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    try {
      const response = await fetch(`/api/announcements/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || 'Unable to delete this update');
      }
      setPosts((current) => current.filter((item) => item.id !== post.id));
      navigate('whats-new');
      toast('Update deleted');
    } catch (error) {
      toast(error.message || 'Unable to delete this update');
    }
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
    let cancelled = false;
    const loadAnnouncements = async () => {
      try {
        const announcements = [];
        let offset = 0;
        let total = Infinity;
        while (offset < total) {
          const response = await fetch(`/api/announcements?offset=${offset}&limit=100`);
          const result = await response.json().catch(() => ({}));
          if (!response.ok || result?.success === false) {
            throw new Error(result?.message || 'Unable to load updates');
          }
          const page = result?.data?.announcements || [];
          announcements.push(...page);
          total = Number(result?.data?.total) || 0;
          offset += page.length;
          if (!page.length) break;
        }
        if (!cancelled) {
          setPosts(mapApiAnnouncements(announcements));
          setAnnouncementError('');
        }
      } catch (error) {
        if (!cancelled) {
          setPosts([]);
          setAnnouncementError(error.message || 'Unable to load updates');
        }
      }
    };
    loadAnnouncements();
    return () => {
      cancelled = true;
    };
  }, []);

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
              error={announcementError}
              filters={filters}
              setFilters={setFilters}
              onPost={openPost}
              onNavigate={navigate}
            />
          ) : articleId ? (
            <ArticlePage
              update={article}
              updates={updates}
              onOpenTool={tryOpen}
              canManageUpdate={!!user?.canPost && String(user.id) === String(article?.postedById)}
              onEdit={() => editAnnouncement(article)}
              onDelete={() => deleteAnnouncement(article)}
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
        onRequestLink={handleAuthLinkRequest}
        onCompleteAuthLink={handleCompleteAuthLink}
        authLink={authLink}
      />
      <DemoModal open={modal === 'demo'} onClose={closeModal} onBooked={() => toast('Demo booked')} />
      <PostModal
        open={modal === 'post'}
        onClose={closeModal}
        user={user}
        initialPost={editingPost}
        onPublish={publish}
      />
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
