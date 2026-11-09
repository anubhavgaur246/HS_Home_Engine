import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, FileJson2, Upload, X, LockKeyhole, LogOut } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ToolGrid } from './components/ToolGrid';
import { Footer } from './components/Footer';
import { HubAssistant } from './components/HubAssistant';
import { TOOLS } from './config/tools';

export function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('highspring-theme') || 'dark';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const token = sessionStorage.getItem('hs-access-token');
    const email = sessionStorage.getItem('hs-user-email');
    return token && email ? { token, email } : null;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [jsonFile, setJsonFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const jsonInputRef = useRef(null);

  // Sync theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('highspring-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const submitEmployeeData = async (event) => {
    event.preventDefault();
    if (!jsonFile) {
      setUploadState('error');
      setUploadMessage('Select an employee JSON file before submitting.');
      return;
    }

    setUploadState('loading');
    setUploadMessage('Importing employee data…');

    try {
      const payload = JSON.parse(await jsonFile.text());
      const response = await fetch('/api/data-upload/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = result?.detail;
        throw new Error(
          typeof detail === 'string'
            ? detail
            : 'The employee data could not be imported. Check the file and try again.',
        );
      }

      const skippedMessage = result.skipped
        ? ` Skipped ${result.skipped} duplicate${result.skipped === 1 ? '' : 's'}.`
        : '';
      const missingEmailMessage = result.skipped_missing_email
        ? ` Skipped ${result.skipped_missing_email} record${result.skipped_missing_email === 1 ? '' : 's'} without a Highspring email.`
        : '';
      setUploadState('success');
      setUploadMessage(
        `Imported ${result.created} employee${result.created === 1 ? '' : 's'}.${skippedMessage}${missingEmailMessage}`,
      );
    } catch (error) {
      setUploadState('error');
      setUploadMessage(
        error instanceof SyntaxError
          ? 'The selected file is not valid JSON.'
          : error.message || 'Unable to connect to the data import API.',
      );
    }
  };

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
      if (!response.ok) throw new Error(result.detail || 'Unable to sign in.');
      sessionStorage.setItem('hs-access-token', result.access_token);
      sessionStorage.setItem('hs-user-email', result.email);
      setUser({ token: result.access_token, email: result.email });
      setShowLogin(false);
      setLoginPassword('');
    } catch (error) {
      setLoginMessage(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('hs-access-token');
    sessionStorage.removeItem('hs-user-email');
    setUser(null);
    clearSelectedFiles();
  };

  const clearSelectedFiles = () => {
    setJsonFile(null);
    setUploadState('idle');
    setUploadMessage('');
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  return (
    <div className="app-canvas">
      {/* Simple, Elegant, Executive Background */}
      <div className="ambient-backdrop-refined" aria-hidden="true">
        <div className="subtle-precision-grid" />
        <div className="ambient-top-glow" />
        <div className="ambient-bottom-glow" />
      </div>

      {/* Navigation Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onLogin={() => setShowLogin(true)}
        onLogout={logout}
      />

      {/* Main Content */}
      <main id="main-content" className="main-content-flow">
        {user ? <section className="dashboard container" aria-labelledby="dashboard-title">
          <div className="dashboard-welcome">
            <div><span className="data-upload-eyebrow">ADMIN DASHBOARD</span><h1 id="dashboard-title">Employee data</h1><p>Signed in as {user.email}. Import employee records from a JSON file.</p></div>
            <button className="dashboard-logout" type="button" onClick={logout}><LogOut size={16} /> Sign out</button>
          </div>
          <section className="data-upload-section" aria-labelledby="data-upload-title">
          <div className="data-upload-heading">
            <div>
              <span className="data-upload-eyebrow">EMPLOYEE DATA</span>
              <h2 id="data-upload-title">Import employee data</h2>
              <p>Upload the employee JSON file. We’ll import the records into the user database and skip any duplicate email IDs.</p>
            </div>
            <div className="data-upload-icon" aria-hidden="true"><FileJson2 size={23} /></div>
          </div>

          <form className="data-upload-form" onSubmit={submitEmployeeData}>
            <div className="upload-file-grid">
              <div className="upload-file-control">
                <input
                  ref={jsonInputRef}
                  id="employee-json-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => { setJsonFile(event.target.files?.[0] || null); setUploadState('idle'); setUploadMessage(''); }}
                />
                <label className="upload-file-label" htmlFor="employee-json-file">
                  <span className="upload-file-icon"><FileJson2 size={19} /></span>
                  <span className="upload-file-copy">
                    <strong>Employee JSON</strong>
                    <small>{jsonFile ? jsonFile.name : 'Choose a .json file'}</small>
                  </span>
                  <span className="upload-choose-button">Upload</span>
                </label>
              </div>
            </div>

            <div className="upload-form-footer">
              <div className={`upload-status ${uploadState}`} role="status" aria-live="polite">
                {uploadMessage && <>
                  {uploadState === 'error' && <AlertCircle size={16} />}
                  {uploadState === 'success' && <CheckCircle2 size={16} />}
                  <span>{uploadMessage}</span>
                </>}
              </div>
              <div className="upload-form-actions">
                {jsonFile && <button type="button" className="upload-clear-button" onClick={clearSelectedFiles}><X size={15} /> Clear</button>}
                <button type="submit" className="upload-submit-button" disabled={uploadState === 'loading'}>
                  {uploadState === 'loading' ? <><span className="upload-spinner" /> Importing</> : <><Upload size={16} /> Import users</>}
                </button>
              </div>
            </div>
          </form>
          </section>
        </section> : <><Hero /><ToolGrid
          tools={TOOLS}
          searchQuery={searchQuery}
          onResetSearch={() => setSearchQuery('')}
        /></>}
      </main>

      {/* Enterprise Footer */}
      <Footer />

      {showLogin && <div className="login-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowLogin(false); }}>
        <section className="login-card" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <button className="login-close" type="button" onClick={() => setShowLogin(false)} aria-label="Close login"><X size={19} /></button>
          <span className="login-icon"><LockKeyhole size={22} /></span>
          <p className="data-upload-eyebrow">SECURE ACCESS</p><h2 id="login-title">Welcome back</h2>
          <p className="login-intro">Sign in to access the employee data dashboard.</p>
          <form className="login-form" onSubmit={submitLogin}>
            <label>Email address<input type="email" autoComplete="username" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} /></label>
            <label>Password<input type="password" autoComplete="current-password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} /></label>
            {loginMessage && <p className="login-error" role="alert">{loginMessage}</p>}
            <button className="upload-submit-button login-submit" disabled={loginLoading}>{loginLoading ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </section>
      </div>}

      {/* Interactive Highspring Assistant & User Manuals Bot */}
      <HubAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onOpen={() => setIsAssistantOpen(true)}
      />
    </div>
  );
}

export default App;
