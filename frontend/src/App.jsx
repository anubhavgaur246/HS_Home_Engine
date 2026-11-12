import React, { useState, useEffect } from 'react';
import { X, LockKeyhole, LogOut, Eye, EyeOff } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ToolGrid } from './components/ToolGrid';
import { Footer } from './components/Footer';
import { HubAssistant } from './components/HubAssistant';
import { UserManagement } from './components/UserManagement';
import { TOOLS } from './config/tools';

export function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('highspring-theme') || 'dark';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [adminSection, setAdminSection] = useState('all');
  const [user, setUser] = useState(() => {
    const token = sessionStorage.getItem('hs-access-token');
    const email = sessionStorage.getItem('hs-user-email');
    const role = sessionStorage.getItem('hs-user-role');
    return token && email ? { token, email, role } : null;
  });
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

  const navigate = (path, replace = false) => {
    if (window.location.pathname !== path) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    }
    setPathname(path);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('highspring-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const isAdminPath = pathname === '/admin' || pathname === '/admin/users';
    if (user?.role === 'SUPER_ADMIN' && !isAdminPath) {
      navigate('/admin', true);
    } else if (pathname.startsWith('/admin') && user?.role !== 'SUPER_ADMIN') {
      navigate('/', true);
    }
  }, [pathname, user?.role]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setSessionUser = (result) => {
    sessionStorage.setItem('hs-access-token', result.access_token);
    sessionStorage.setItem('hs-user-email', result.email);
    sessionStorage.setItem('hs-user-role', result.role || '');
    setUser({ token: result.access_token, email: result.email, role: result.role || '' });
    navigate(result.role === 'SUPER_ADMIN' ? '/admin' : '/');
  };

  const resetLoginForm = () => {
    setShowLogin(false);
    setLoginEmail('');
    setLoginPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLoginMessage('');
    setResetRequired(false);
    setResetToken('');
    setShowLoginPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.detail || result?.error || 'Unable to sign in.');
      }

      const data = result?.data || {};
      if (data.requires_password_reset) {
        setResetRequired(true);
        setResetToken(data.reset_token || '');
        setLoginPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setLoginMessage('Your password needs to be reset. Please choose a new password and confirm it to continue.');
        return;
      }

      setSessionUser(data);
      resetLoginForm();
    } catch (error) {
      setLoginMessage(error.message || 'Unable to sign in.');
    } finally {
      setLoginLoading(false);
    }
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginMessage('');

    if (!newPassword || !confirmPassword) {
      setLoginMessage('Both password fields are required.');
      setLoginLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setLoginMessage('The new password and confirm password do not match.');
      setLoginLoading(false);
      return;
    }

    try {
      const resetResponse = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, new_password: newPassword }),
      });

      const resetResult = await resetResponse.json().catch(() => ({}));
      if (!resetResponse.ok) {
        throw new Error(resetResult?.detail || resetResult?.error || 'Unable to reset your password.');
      }

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: newPassword }),
      });

      const loginResult = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) {
        throw new Error(loginResult?.detail || loginResult?.error || 'Login failed after password reset.');
      }

      setSessionUser(loginResult.data || {});
      resetLoginForm();
    } catch (error) {
      setLoginMessage(error.message || 'Unable to reset password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('hs-access-token');
    sessionStorage.removeItem('hs-user-email');
    sessionStorage.removeItem('hs-user-role');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="app-canvas">
      <div className="ambient-backdrop-refined" aria-hidden="true">
        <div className="subtle-precision-grid" />
        <div className="ambient-top-glow" />
        <div className="ambient-bottom-glow" />
      </div>

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onUserManagementSelect={(section) => {
          setAdminSection(section);
          navigate('/admin/users');
        }}
        onGoHome={() => navigate(user?.role === 'SUPER_ADMIN' ? '/admin' : '/')}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onLogin={() => setShowLogin(true)}
        onLogout={logout}
      />

      <main id="main-content" className="main-content-flow">
        {pathname === '/admin/users' && user?.role === 'SUPER_ADMIN' ? (
          <UserManagement
            user={user}
            section={adminSection}
            onSectionChange={setAdminSection}
            onGoHome={() => navigate('/admin')}
          />
        ) : (
          <>
            <Hero />
            <ToolGrid
              tools={TOOLS}
              searchQuery={searchQuery}
              onResetSearch={() => setSearchQuery('')}
            />
          </>
        )}
      </main>

      <Footer />

      {showLogin && (
        <div className="login-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) resetLoginForm(); }}>
          <section className="login-card" role="dialog" aria-modal="true" aria-labelledby="login-title">
            <button className="login-close" type="button" onClick={resetLoginForm} aria-label="Close login"><X size={19} /></button>
            <span className="login-icon"><LockKeyhole size={22} /></span>
            <p className="data-upload-eyebrow">SECURE ACCESS</p>
            <h2 id="login-title">{resetRequired ? 'Reset your password' : 'Welcome back'}</h2>
            {!resetRequired && <p className="login-intro">Sign in to access the tools dashboard.</p>}

            {resetRequired ? (
              <form className="login-form" onSubmit={submitResetPassword}>
                <label>
                  New password
                  <div className="password-input-wrap">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowNewPassword((value) => !value)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                <label>
                  Confirm new password
                  <div className="password-input-wrap">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword((value) => !value)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                {confirmPassword && (
                  <p className={passwordsMatch ? 'password-match-status success' : 'password-match-status error'} role="status">
                    {passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'}
                  </p>
                )}

                {loginMessage && <p className="login-error" role="alert">{loginMessage}</p>}
                <button className="upload-submit-button login-submit" disabled={loginLoading}>
                  {loginLoading ? 'Resetting…' : 'Set new password'}
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={submitLogin}>
                <label>
                  Email address
                  <input type="email" autoComplete="username" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
                </label>
                <label>
                  Password
                  <div className="password-input-wrap">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowLoginPassword((value) => !value)}
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                {loginMessage && <p className="login-error" role="alert">{loginMessage}</p>}
                <button className="upload-submit-button login-submit" disabled={loginLoading}>
                  {loginLoading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      <HubAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onOpen={() => setIsAssistantOpen(true)}
      />
    </div>
  );
}

export default App;
