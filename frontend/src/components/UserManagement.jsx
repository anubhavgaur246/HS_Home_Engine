import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Plus, Save, Search, Trash2, UserPlus, X } from 'lucide-react';
import { EmployeeJsonImport } from './EmployeeJsonImport';

const EDITABLE_ROLES = ['USER', 'ADMIN', 'LEAD', 'MANAGER', 'HR', 'TA', 'CO_LEAD'];

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.detail || result.error || result.message || 'The request could not be completed.');
  }
  return result.data;
}

function EditUserDialog({ user, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name || '',
    hs_email_id: user.hs_email_id,
    role: user.role,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await requestJson(`/api/auth/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="user-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="user-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
        <button className="login-close" type="button" onClick={onClose} aria-label="Close edit user dialog"><X size={18} /></button>
        <p className="data-upload-eyebrow">USER MANAGEMENT</p>
        <h2 id="edit-user-title">Edit user</h2>
        <form className="login-form" onSubmit={submit}>
          <label>First name<input required maxLength={100} value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} /></label>
          <label>Last name<input maxLength={100} value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} /></label>
          <label>Highspring email<input type="email" required maxLength={255} value={form.hs_email_id} onChange={(event) => setForm({ ...form, hs_email_id: event.target.value })} /></label>
          <label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{EDITABLE_ROLES.map((role) => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}</select></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <div className="user-form-actions">
            <button type="button" className="upload-clear-button" onClick={onClose}>Cancel</button>
            <button className="upload-submit-button" disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function UserManagement({ user, section, onSectionChange, onGoHome }) {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [adminForm, setAdminForm] = useState({ first_name: '', last_name: '', hs_email_id: '', password: '' });
  const [creating, setCreating] = useState(false);

  const loadUsers = async (searchTerm = appliedSearch, requestedPage = page) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ search: searchTerm, page: String(requestedPage) });
      const result = await requestJson(`/api/auth/users?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setUsers(result?.users || []);
      setTotalUsers(result?.total || 0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (section === 'all') loadUsers();
  }, [section, user.token, appliedSearch, page]);

  useEffect(() => {
    const searchTerm = searchInput.trim();
    if (!searchTerm) return undefined;

    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setAppliedSearch(searchTerm);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const totalPages = Math.max(1, Math.ceil(totalUsers / 100));

  const createAdmin = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError('');
    setNotice('');
    try {
      await requestJson('/api/auth/users/admin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminForm),
      });
      setAdminForm({ first_name: '', last_name: '', hs_email_id: '', password: '' });
      setNotice('Admin account created. They will be asked to reset the initial password when they sign in.');
      onSectionChange('all');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (selectedUser) => {
    const displayName = `${selectedUser.first_name} ${selectedUser.last_name || ''}`.trim();
    if (!window.confirm(`Delete ${displayName} (${selectedUser.hs_email_id})? This cannot be undone.`)) return;
    setError('');
    setNotice('');
    try {
      await requestJson(`/api/auth/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotice(`${displayName} was deleted.`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="user-management-page">
      <div className="user-management-heading">
        <div>
          <p className="data-upload-eyebrow">ADMINISTRATION</p>
          <h1>User Management</h1>
          <p>Manage user access and administrator accounts.</p>
        </div>
        <button type="button" className="user-management-home-button" onClick={onGoHome}>
          <ArrowLeft size={16} />Admin dashboard
        </button>
      </div>

      {notice && <p className="user-management-notice" role="status">{notice}</p>}
      {error && <p className="user-management-error" role="alert">{error}</p>}

      {section === 'import-users' ? (
        <EmployeeJsonImport user={user} />
      ) : section === 'all' ? (
        <div className="user-table-wrap">
          <div className="user-table-heading">
            <h2>All Users</h2>
            <span>{totalUsers.toLocaleString()} matching users</span>
          </div>
          <form className="user-search-form" onSubmit={submitSearch} role="search">
            <label className="user-search-field">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchInput(value);
                  setPage(1);
                  if (!value.trim()) {
                    setAppliedSearch('');
                  }
                }}
                placeholder="Search by name or Highspring email"
                aria-label="Search users by name or email"
              />
            </label>
            <button type="submit" className="upload-submit-button" disabled={loading}>
              <Search size={16} />Search
            </button>
          </form>
          {loading ? <p className="user-table-state">Loading users...</p> : users.length === 0 ? <p className="user-table-state">No users found.</p> : (
            <table className="user-management-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
              <tbody>{users.map((row) => {
                const protectedUser = row.role === 'SUPER_ADMIN';
                return (
                  <tr key={row.id}>
                    <td data-label="User">{`${row.first_name} ${row.last_name || ''}`.trim()}</td>
                    <td data-label="Email">{row.hs_email_id}</td>
                    <td data-label="Role"><span className={`user-role-badge role-${row.role.toLowerCase()}`}>{row.role.replaceAll('_', ' ')}</span></td>
                    <td data-label="Actions">
                      <div className="user-row-actions">
                        <button type="button" className="user-action-button" disabled={protectedUser} onClick={() => setEditingUser(row)} aria-label={`Edit ${row.hs_email_id}`} title="Edit user"><Pencil size={15} /></button>
                        <button type="button" className="user-action-button danger" disabled={protectedUser} onClick={() => deleteUser(row)} aria-label={`Delete ${row.hs_email_id}`} title="Delete user"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
          <div className="user-table-pagination">
            <span>Page {page} of {totalPages} · 100 users per page</span>
            <div className="user-pagination-actions">
              <button type="button" className="user-action-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={loading || page <= 1} aria-label="Previous page" title="Previous page">
                <ChevronLeft size={17} />
              </button>
              <button type="button" className="user-action-button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={loading || page >= totalPages} aria-label="Next page" title="Next page">
                <ChevronRight size={17} />
              </button>
              <button type="button" className="user-refresh-button" onClick={() => loadUsers()} disabled={loading}>Refresh</button>
            </div>
          </div>
        </div>
      ) : (
        <form className="user-admin-form" onSubmit={createAdmin}>
          <div className="user-table-heading"><h2><UserPlus size={20} />Add Admin</h2><span>Role: ADMIN</span></div>
          <div className="user-admin-form-grid">
            <label>First name<input required maxLength={100} value={adminForm.first_name} onChange={(event) => setAdminForm({ ...adminForm, first_name: event.target.value })} /></label>
            <label>Last name<input maxLength={100} value={adminForm.last_name} onChange={(event) => setAdminForm({ ...adminForm, last_name: event.target.value })} /></label>
            <label className="user-admin-email">Highspring email<input type="email" required maxLength={255} value={adminForm.hs_email_id} onChange={(event) => setAdminForm({ ...adminForm, hs_email_id: event.target.value })} /></label>
            <label className="user-admin-password">Initial password<input type="password" required minLength={12} maxLength={255} autoComplete="new-password" value={adminForm.password} onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} /><small>At least 12 characters. The admin must reset it at first sign-in.</small></label>
          </div>
          <div className="user-form-actions"><button className="upload-submit-button" disabled={creating}><Plus size={17} />{creating ? 'Creating...' : 'Create admin'}</button></div>
        </form>
      )}

      {editingUser && <EditUserDialog user={editingUser} token={user.token} onClose={() => setEditingUser(null)} onSaved={loadUsers} />}
    </section>
  );
}
