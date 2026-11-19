import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from './modals';
import { ICONS, SPARK } from './icons';
import { TOOLS, setApiTools } from './data';
import { Raw } from './parts';

const API_BASE = '/api';

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

const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const errText = (result, fallback) =>
  result?.error || result?.message || result?.detail || fallback;

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const mapApiUser = (user) => ({
  id: user.id,
  apiUser: true,
  name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.hs_email_id,
  ldap: (user.ldap || user.hs_email_id?.split('@')[0] || '').toUpperCase(),
  email: user.hs_email_id,
  role: ROLE_LABEL[user.role] || user.role || 'Employee',
  rawRole: user.role,
  project: user.projectname || user.team || '—',
  level: user.level || '—',
  status: user.status || '',
  fromTeamsphere: !!user.from_teamsphere,
  raw: user,
});

const configsFromTools = (tools = []) =>
  Object.fromEntries(
    tools.map((tool) => [
      tool.id,
      {
        enabled: !!tool.enabled,
        manual: tool.manual || '',
        demo: tool.demo || '',
        apiId: tool.apiId,
      },
    ])
  );

function Field({ label, value, onChange, type = 'text', required, invalid, labelStyle, children }) {
  return (
    <div className={`ff${invalid ? ' invalid' : ''}`}>
      {children || (
        <input
          type={type}
          placeholder=" "
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
        />
      )}
      <label style={labelStyle}>{label}</label>
      {required ? <p className="err">Required</p> : null}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required, invalid, labelStyle }) {
  return (
    <div className={`ff${invalid ? ' invalid' : ''}`}>
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
      <label style={labelStyle}>{label}</label>
      {required ? <p className="err">Required</p> : null}
    </div>
  );
}

const EMPTY_TOOL_EDIT = {
  name: '',
  link: '',
  description: '',
  user_guide_url: '',
  video_url: '',
  poc_id: '',
  is_product_live: false,
  is_upcoming: false,
};

function ToolEditModal({ open, tool, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_TOOL_EDIT);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !tool) return;
    const raw = tool.raw || {};
    setForm({
      name: raw.name || tool.name || '',
      link: raw.link || tool.url || '',
      description: raw.description || tool.desc || '',
      user_guide_url: raw.user_guide_url || tool.manual || '',
      video_url: raw.video_url || tool.demo || '',
      poc_id: raw.poc_id ?? '',
      is_product_live: raw.is_product_live ?? !!tool.enabled,
      is_upcoming: raw.is_upcoming ?? !!tool.soon,
    });
    setError('');
    setBusy(false);
  }, [open, tool]);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError('Tool name is required.');
      return;
    }
    const poc = String(form.poc_id).trim();
    const payload = {
      name,
      link: form.link.trim() || null,
      description: form.description.trim() || null,
      user_guide_url: form.user_guide_url.trim() || null,
      video_url: form.video_url.trim() || null,
      poc_id: poc ? Number(poc) : null,
      is_product_live: !!form.is_product_live,
      is_upcoming: !!form.is_upcoming,
    };
    if (payload.poc_id !== null && Number.isNaN(payload.poc_id)) {
      setError('POC ID must be a number.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(payload);
    } catch (saveError) {
      setError(saveError.message || 'Unable to update this tool.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="tool-edit-modal" labelledBy="teTitle">
      <h2 id="teTitle">Edit tool</h2>
      <p className="lead">Update the tool configuration shown on the homepage.</p>
      {error ? (
        <div className="form-error show" role="alert" style={{ marginBottom: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.5" />
          </svg>
          {error}
        </div>
      ) : null}
      <form onSubmit={submit} noValidate>
        <div className="tool-form">
          <Field label="Tool name *" value={form.name} onChange={set('name')} required />
          <Field label="POC ID" type="number" value={form.poc_id} onChange={set('poc_id')} />
          <Field label="App URL" value={form.link} onChange={set('link')} />
          <Field label="User guide URL" value={form.user_guide_url} onChange={set('user_guide_url')} />
          <Field label="Demo URL" value={form.video_url} onChange={set('video_url')} />
          <div className="ff no-ic full">
            <textarea
              placeholder=" "
              value={form.description}
              onChange={(event) => set('description')(event.target.value)}
            />
            <label>Description</label>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={!!form.is_product_live}
              onChange={(event) => set('is_product_live')(event.target.checked)}
            />
            <span className="track"></span>Enabled
          </label>
          <label className="switch">
            <input
              type="checkbox"
              checked={!!form.is_upcoming}
              onChange={(event) => set('is_upcoming')(event.target.checked)}
            />
            <span className="track"></span>Coming soon
          </label>
        </div>
        <div className="tool-form-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className={`btn primary${busy ? ' loading' : ''}`} type="submit" disabled={busy}>
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

const EMPTY_USER = { email: '', role: 'USER' };
const CREATABLE_ROLES = ['USER', 'ADMIN', 'MANAGER', 'LEAD', 'CO_LEAD', 'HR', 'TA'];

function AddUserModal({ open, onClose, user, onAdded, toast }) {
  const [form, setForm] = useState(EMPTY_USER);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState({});

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (invalid[key]) {
      setInvalid((current) => ({ ...current, [key]: false }));
    }
    if (error) setError('');
  };

  const openModal = () => {
    setSuccess('');
    setError('');
    setInvalid({});
  };

  useEffect(() => {
    if (open) openModal();
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    const email = String(form.email || '').trim();
    if (!email) {
      setInvalid({ email: true });
      return;
    }

    const row = {
      id: Date.now(),
      name: email.split('@')[0],
      email,
      role: ROLE_LABEL[form.role] || form.role,
      rawRole: form.role,
      status: 'Active',
      fromTeamsphere: false,
    };

    if (!user?.token) {
      onAdded(row);
      setForm(EMPTY_USER);
      setSuccess(`${email} has been added.`);
      toast(`User ${email} added`);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { ...authHeaders(user.token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: form.role }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        throw new Error(errText(result, 'Unable to add this user.'));
      }

      setForm(EMPTY_USER);
      setSuccess(`${email} has been added.`);
      toast(`User ${email} added`);
      await onAdded(row);
    } catch (submitError) {
      setError(submitError.message || 'Unable to add this user.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="add-user-modal"
      labelledBy="auTitle"
    >
      {success ? (
        <div className="success show" role="status">
          <svg className="check-anim" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="32" />
            <path d="M20 33l8 8 16-17" />
          </svg>
          <h2>User added</h2>
          <p className="lead">{success}</p>
          <button className="btn" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <>
          <h2 id="auTitle">Add new user</h2>
          <p className="lead">
            Users created here are managed by this home engine. They must reset their password at first sign-in.
          </p>
          {error ? (
            <div className="form-error show" role="alert" style={{ marginBottom: 14 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16.5v.5" />
              </svg>
              {error}
            </div>
          ) : null}
          <form onSubmit={submit} noValidate>
            <div className="user-form">
              <Field
                label="Email Address *"
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                invalid={invalid.email}
              />
              <SelectField
                label="Role *"
                value={form.role}
                onChange={set('role')}
                options={CREATABLE_ROLES}
                required
              />
            </div>
            <div className="form-foot" style={{ marginTop: 20 }}>
              <button className="btn" type="button" onClick={onClose}>
                Cancel
              </button>
              <button
                className={`btn primary${busy ? ' loading' : ''}`}
                type="submit"
                disabled={busy}
                style={{ minHeight: 52, padding: '0 28px' }}
              >
                <span className="spinner" />
                <span className="btn-label">Save user</span>
              </button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}

export function AdminView({ user, updatesCount = 0, onNavigate, toast }) {
  const [tab, setTab] = useState('overview');
  const [nonTeamsphereUsers, setNonTeamsphereUsers] = useState([]);
  const [teamsphereUsers, setTeamsphereUsers] = useState([]);
  const [teamspherePage, setTeamspherePage] = useState(1);
  const [teamspherePaging, setTeamspherePaging] = useState({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  });
  const [usersLoading, setUsersLoading] = useState(false);
  const [featureList, setFeatureList] = useState([]);
  const [toolState, setToolState] = useState(() => ({
    tools: [...TOOLS],
    configs: configsFromTools(TOOLS),
  }));
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [newTool, setNewTool] = useState({ name: '', sub: '', desc: '', url: '' });
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const loadUsers = useCallback(
    async (quiet = false) => {
      if (!user?.token) {
        setNonTeamsphereUsers([]);
        setTeamsphereUsers([]);
        return;
      }
      setUsersLoading(true);
      try {
        const [otherResponse, teamsphereResponse] = await Promise.all([
          fetch(`${API_BASE}/users/non-teamsphere`, {
            headers: authHeaders(user.token),
          }),
          fetch(`${API_BASE}/users/teamsphere?page=${teamspherePage}`, {
            headers: authHeaders(user.token),
          }),
        ]);
        const [otherResult, teamsphereResult] = await Promise.all([
          otherResponse.json().catch(() => ({})),
          teamsphereResponse.json().catch(() => ({})),
        ]);
        if (!otherResponse.ok || otherResult?.success === false) {
          throw new Error(errText(otherResult, 'Unable to load users.'));
        }
        if (!teamsphereResponse.ok || teamsphereResult?.success === false) {
          throw new Error(errText(teamsphereResult, 'Unable to load users.'));
        }

        const paging = teamsphereResult?.data || {};
        const totalPages = Math.max(1, paging.total_pages || 1);
        setNonTeamsphereUsers((otherResult?.data?.users || []).map(mapApiUser));
        setTeamsphereUsers((paging.users || []).map(mapApiUser));
        setTeamspherePaging({
          total: paging.total || 0,
          page: paging.page || 1,
          page_size: paging.page_size || 20,
          total_pages: totalPages,
        });
        setTeamspherePage((current) => Math.min(current, totalPages));
      } catch (error) {
        setNonTeamsphereUsers([]);
        setTeamsphereUsers([]);
        if (!quiet) toastRef.current?.(error.message || 'Unable to load users.');
      } finally {
        setUsersLoading(false);
      }
    },
    [user?.token, teamspherePage]
  );

  const loadTools = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/tools`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        throw new Error(errText(result, 'Unable to load tools.'));
      }
      const nextTools = setApiTools(result?.data?.tools || []);
      setToolState({ tools: nextTools, configs: configsFromTools(nextTools) });
    } catch (error) {
      setApiTools([]);
      setToolState({ tools: [], configs: {} });
      toastRef.current?.(error.message || 'Unable to load tools.');
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadTools();
  }, [loadUsers, loadTools]);

  const totalUsers = nonTeamsphereUsers.length + teamspherePaging.total;
  const activeUsers = [...nonTeamsphereUsers, ...teamsphereUsers].filter(
    (entry) => entry.status === 'Active'
  ).length;
  const enabledTools = Object.values(toolState.configs).filter((config) => config.enabled).length;

  const setToolConfig = (id, patch) => {
    setToolState((current) => ({
      ...current,
      configs: {
        ...current.configs,
        [id]: { ...current.configs[id], ...patch },
      },
    }));
  };

  const toggleTool = async (id) => {
    const tool = toolState.tools.find((entry) => entry.id === id);
    const enabled = !toolState.configs[id]?.enabled;

    if (user?.token && tool?.apiId) {
      try {
        const response = await fetch(`${API_BASE}/tools/${tool.apiId}`, {
          method: 'PATCH',
          headers: {
            ...authHeaders(user.token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_product_live: enabled }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result?.success === false) {
          throw new Error(errText(result, 'Unable to update this tool.'));
        }
        await loadTools();
        toast?.(`${tool.name}${enabled ? ' enabled' : ' disabled'}`);
      } catch (error) {
        toast?.(error.message || 'Unable to update this tool.');
      }
      return;
    }

    setToolState((current) => ({
      ...current,
      configs: {
        ...current.configs,
        [id]: { ...current.configs[id], enabled },
      },
    }));
    toast?.(`${tool?.name || 'Tool'}${enabled ? ' enabled' : ' disabled'}`);
  };

  const deleteTool = (id) => {
    const tool = toolState.tools.find((entry) => entry.id === id);
    if (!tool || !window.confirm(`Delete ${tool.name}?`)) return;
    setToolState((current) => {
      const configs = { ...current.configs };
      delete configs[id];
      return {
        tools: current.tools.filter((entry) => entry.id !== id),
        configs,
      };
    });
    toast?.('Tool deleted');
  };

  const addTool = async () => {
    const name = newTool.name.trim();
    if (!name) {
      toast?.('Enter a tool name');
      return;
    }

    const localTool = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      sub: newTool.sub.trim() || 'New tool',
      accent: '#1C5BDB',
      url: newTool.url.trim() || '#',
      manual: '',
      demo: '',
      desc: newTool.desc.trim() || name,
      features: [],
      soon: false,
    };

    if (user?.token) {
      try {
        const response = await fetch(`${API_BASE}/tools`, {
          method: 'POST',
          headers: {
            ...authHeaders(user.token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            link: newTool.url.trim() || null,
            description: newTool.desc.trim() || name,
            is_product_live: true,
            is_upcoming: false,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result?.success === false) {
          throw new Error(errText(result, 'Unable to add this tool.'));
        }
      } catch (error) {
        toast?.(error.message || 'Unable to add this tool.');
        return;
      }
    }

    setToolState((current) => {
      if (current.tools.some((tool) => tool.id === localTool.id)) {
        return current;
      }
      return {
        tools: [...current.tools, localTool],
        configs: {
          ...current.configs,
          [localTool.id]: { enabled: true, manual: '', demo: '' },
        },
      };
    });
    setNewTool({ name: '', sub: '', desc: '', url: '' });
    if (user?.token) await loadTools();
    toast?.(`${name} added`);
  };

  const saveTool = async (payload) => {
    const tool = editingTool;
    if (!tool) return;

    if (user?.token && tool.apiId) {
      const response = await fetch(`${API_BASE}/tools/${tool.apiId}`, {
        method: 'PUT',
        headers: {
          ...authHeaders(user.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        throw new Error(errText(result, 'Unable to update this tool.'));
      }
      await loadTools();
    } else {
      setToolState((current) => ({
        ...current,
        tools: current.tools.map((entry) => {
          if (entry.id !== tool.id) return entry;
          const enabled = !!payload.is_product_live;
          const upcoming = !!payload.is_upcoming;
          return {
            ...entry,
            name: payload.name,
            url: payload.link || '',
            manual: payload.user_guide_url || '',
            demo: payload.video_url || '',
            desc: payload.description || '',
            enabled,
            soon: upcoming,
            inactive: !enabled && !upcoming,
            sub: upcoming ? 'Coming soon' : enabled ? 'Live tool' : 'Inactive',
            raw: { ...(entry.raw || {}), ...payload },
          };
        }),
        configs: {
          ...current.configs,
          [tool.id]: {
            ...current.configs[tool.id],
            enabled: !!payload.is_product_live,
            manual: payload.user_guide_url || '',
            demo: payload.video_url || '',
          },
        },
      }));
    }

    setEditingTool(null);
    toast?.(`${payload.name} updated`);
  };

  const addFeature = () => {
    const title = window.prompt('Feature title:');
    if (!title) return;
    const tool = window.prompt('Tool (or Hub):');
    setFeatureList((current) => [
      ...current,
      {
        id: `f${Date.now()}`,
        title,
        tool: tool || 'Hub',
        status: 'Planned',
        date: iso(new Date()),
      },
    ]);
    toast?.('Feature added');
  };

  const cycleFeature = (id) => {
    const statuses = ['Planned', 'In progress', 'Done'];
    setFeatureList((current) =>
      current.map((feature) => {
        if (feature.id !== id) return feature;
        const next = statuses[(statuses.indexOf(feature.status) + 1) % statuses.length];
        toast?.(`${feature.title}: ${next}`);
        return { ...feature, status: next };
      })
    );
  };

  const deleteFeature = (id) => {
    setFeatureList((current) => current.filter((feature) => feature.id !== id));
    toast?.('Feature removed');
  };

  const removeUser = async (entry) => {
    if (!window.confirm(`Remove ${entry.name}?`)) return;
    if (entry.apiUser && user?.token) {
      try {
        const response = await fetch(`${API_BASE}/users/${entry.id}`, {
          method: 'DELETE',
          headers: authHeaders(user.token),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result?.success === false) {
          throw new Error(errText(result, 'Unable to remove this user.'));
        }
        await loadUsers();
      } catch (error) {
        toast?.(error.message || 'Unable to remove this user.');
        return;
      }
    } else {
      setNonTeamsphereUsers((current) => current.filter((item) => item.id !== entry.id));
      setTeamsphereUsers((current) => current.filter((item) => item.id !== entry.id));
    }
    toast?.('User removed');
  };

  const addLocalUser = async (row) => {
    if (!user?.token) {
      setNonTeamsphereUsers((current) => [...current, row]);
      return;
    }
    await loadUsers();
  };

  const renderUserRows = (list, emptyText, showActions = true) => {
    const colSpan = showActions ? 8 : 7;
    if (usersLoading) {
      return (
        <tr>
          <td colSpan={colSpan}>Loading users…</td>
        </tr>
      );
    }
    if (!list.length) {
      return (
        <tr>
          <td colSpan={colSpan}>{emptyText}</td>
        </tr>
      );
    }
    return list.map((entry) => (
      <tr key={entry.id} className={entry.status === 'Inactive' ? 'row-inactive' : undefined}>
        <td style={{ fontWeight: 700 }}>{entry.name}</td>
        <td>{entry.ldap}</td>
        <td>{entry.email}</td>
        <td>{entry.role}</td>
        <td>{entry.project}</td>
        <td>{entry.level}</td>
        <td>
          <span className={`badge-sm ${entry.status === 'Active' ? 'ok' : 'warn'}`}>
            {entry.status}
          </span>
        </td>
        {showActions ? (
          <td>
            <div className="a-actions">
              {entry.rawRole !== 'SUPER_ADMIN' ? (
                <button
                  type="button"
                  className="btn sm"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => removeUser(entry)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </td>
        ) : null}
      </tr>
    ));
  };

  const toolName = (tool) => tool.name;

  return (
    <div className="admin-wrap">
      <div className="wrap">
        <div style={{ marginBottom: 22 }}>
          <p className="crumb">
            <a href="#top">Home</a> / Admin
          </p>
          <h1 style={{ fontSize: 'clamp(28px,3.2vw,40px)', fontWeight: 700, marginTop: 4 }}>
            Admin panel
          </h1>
        </div>
        <nav className="admin-nav" role="tablist" aria-label="Admin sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'overview'}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tools'}
            onClick={() => setTab('tools')}
          >
            Tools<span className="cnt">{toolState.tools.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'users'}
            onClick={() => setTab('users')}
          >
            Users<span className="cnt">{totalUsers}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'features'}
            onClick={() => setTab('features')}
          >
            Upcoming features
          </button>
        </nav>

        <div className="a-panel" hidden={tab !== 'overview'}>
          <div className="stat-row">
            <div className="stat">
              <b>{totalUsers}</b>
              <span>Total users</span>
            </div>
            <div className="stat">
              <b>{activeUsers}</b>
              <span>Active users</span>
            </div>
            <div className="stat">
              <b>{enabledTools}</b>
              <span>Tools enabled</span>
            </div>
            <div className="stat">
              <b>{updatesCount}</b>
              <span>Published updates</span>
            </div>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Your tools</h3>
          <div className="card-grid">
            {toolState.tools.map((tool) => {
              const config = toolState.configs[tool.id] || { enabled: false };
              return (
                <div className="a-card" key={tool.id} style={{ '--accent': tool.accent }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <span
                      className="tc-mini"
                      style={{ width: 48, height: 48, borderRadius: 16 }}
                    >
                      <Raw html={ICONS[tool.iconKey] || ICONS.hub} />
                    </span>
                    <div>
                      <h3>{tool.name}</h3>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
                        {tool.sub}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`toggle ${config.enabled ? 'on' : 'off'}`}
                      onClick={() => toggleTool(tool.id)}
                      style={{ marginLeft: 'auto' }}
                      aria-label={`${config.enabled ? 'Disable' : 'Enable'} ${toolName(tool)}`}
                    />
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 12px' }}>
                    {tool.desc}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="btn sm" onClick={() => setTab('tools')}>
                      Configure
                    </button>
                    <a className="btn sm" href="#whats-new">
                      Updates
                    </a>
                    {!tool.soon ? (
                      <button
                        type="button"
                        className="btn sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => deleteTool(tool.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="a-panel" hidden={tab !== 'tools'}>
          <div className="tool-config">
            <div>
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Tool</th>
                    <th>Enabled</th>
                    <th>User guide URL</th>
                    <th>Demo URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {toolState.tools.map((tool) => {
                    const config = toolState.configs[tool.id] || {};
                    return (
                      <tr key={tool.id}>
                        <td style={{ fontWeight: 700 }}>{tool.name}</td>
                        <td>
                          <button
                            type="button"
                            className={`toggle ${config.enabled ? 'on' : 'off'}`}
                            onClick={() => toggleTool(tool.id)}
                            aria-label={`${config.enabled ? 'Disable' : 'Enable'} ${tool.name}`}
                          />
                        </td>
                        <td>
                          <div className="url-row">
                            <input
                              value={config.manual || ''}
                              onChange={(event) =>
                                setToolConfig(tool.id, { manual: event.target.value })
                              }
                              placeholder="Paste URL"
                            />
                          </div>
                        </td>
                        <td>
                          <div className="url-row">
                            <input
                              value={config.demo || ''}
                              onChange={(event) =>
                                setToolConfig(tool.id, { demo: event.target.value })
                              }
                              placeholder="Paste URL"
                            />
                          </div>
                        </td>
                        <td>
                          <div className="a-actions">
                            <button
                              type="button"
                              className="btn sm"
                              onClick={() => setEditingTool(tool)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn sm"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => deleteTool(tool.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="config-side">
              <h3>Add a new tool</h3>
              <div className="ff no-ic">
                <input
                  placeholder=" "
                  value={newTool.name}
                  onChange={(event) => setNewTool({ ...newTool, name: event.target.value })}
                />
                <label>Tool name</label>
              </div>
              <div className="ff no-ic">
                <input
                  placeholder=" "
                  value={newTool.sub}
                  onChange={(event) => setNewTool({ ...newTool, sub: event.target.value })}
                />
                <label>Category (e.g. Scheduling)</label>
              </div>
              <div className="ff no-ic">
                <input
                  placeholder=" "
                  value={newTool.desc}
                  onChange={(event) => setNewTool({ ...newTool, desc: event.target.value })}
                />
                <label>Short description</label>
              </div>
              <div className="ff no-ic">
                <input
                  placeholder=" "
                  value={newTool.url}
                  onChange={(event) => setNewTool({ ...newTool, url: event.target.value })}
                />
                <label>App URL</label>
              </div>
              <button
                type="button"
                className="btn primary"
                style={{ width: '100%' }}
                onClick={addTool}
              >
                <Raw html={SPARK} />
                Add tool
              </button>
            </div>
          </div>
        </div>

        <div className="a-panel" hidden={tab !== 'users'}>
          <div className="a-head">
            <h2>Users</h2>
            <button
              type="button"
              className="btn primary"
              onClick={() => setAddUserOpen(true)}
            >
              <Raw html={SPARK} />
              Add new user
            </button>
          </div>
          <section className="a-user-section">
            <div className="a-subhead">
              <h3>Users not from Teamsphere</h3>
              <span className="badge-sm muted">{nonTeamsphereUsers.length}</span>
            </div>
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>LDAP</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Project</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{renderUserRows(nonTeamsphereUsers, 'No users outside Teamsphere.')}</tbody>
            </table>
          </section>

          <section className="a-user-section">
            <div className="a-subhead">
              <h3>Users from Teamsphere</h3>
              <span className="badge-sm muted">{teamspherePaging.total}</span>
            </div>
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>LDAP</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Project</th>
                  <th>Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>{renderUserRows(teamsphereUsers, 'No Teamsphere users yet.', false)}</tbody>
            </table>
            <div className="a-pagination">
              <span>
                Page {teamspherePaging.page} of {teamspherePaging.total_pages} ·{' '}
                {teamspherePaging.page_size} users per page
              </span>
              <div className="a-pagination-actions">
                <button
                  type="button"
                  className="btn sm"
                  disabled={usersLoading || teamspherePaging.page <= 1}
                  onClick={() => setTeamspherePage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn sm"
                  disabled={
                    usersLoading || teamspherePaging.page >= teamspherePaging.total_pages
                  }
                  onClick={() =>
                    setTeamspherePage((current) =>
                      Math.min(teamspherePaging.total_pages, current + 1)
                    )
                  }
                >
                  Next
                </button>
                <button
                  type="button"
                  className="btn sm"
                  disabled={usersLoading}
                  onClick={() => loadUsers()}
                >
                  Refresh
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="a-panel" hidden={tab !== 'features'}>
          <div className="a-head">
            <h2>Upcoming features</h2>
            <button type="button" className="btn primary" onClick={addFeature}>
              <Raw html={SPARK} />
              Add feature
            </button>
          </div>
          {featureList.length ? (
            <table className="a-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Tool</th>
                  <th>Status</th>
                  <th>Target</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {featureList.map((feature) => (
                  <tr key={feature.id}>
                    <td style={{ fontWeight: 700 }}>{feature.title}</td>
                    <td>{feature.tool}</td>
                    <td>
                      <span
                        className={`badge-sm ${
                          feature.status === 'In progress' ? 'ok' : 'muted'
                        }`}
                      >
                        {feature.status}
                      </span>
                    </td>
                    <td>{feature.date}</td>
                    <td>
                      <div className="a-actions">
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => cycleFeature(feature.id)}
                        >
                          Cycle status
                        </button>
                        <button
                          type="button"
                          className="btn sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => deleteFeature(feature.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              <b>No upcoming features</b>Add one with the button above.
            </div>
          )}
        </div>
      </div>

      <AddUserModal
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        user={user}
        onAdded={addLocalUser}
        toast={toast}
      />
      <ToolEditModal
        open={!!editingTool}
        tool={editingTool}
        onClose={() => setEditingTool(null)}
        onSave={saveTool}
      />
    </div>
  );
}
