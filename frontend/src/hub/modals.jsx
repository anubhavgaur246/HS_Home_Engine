import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ARROW,
  BELL,
  CHECK,
  DOC,
  EYE,
  EYE_OFF,
  GO,
  ICONS,
  LOCK,
  SPARK,
} from './icons';
import { ILLO } from './illustrations';
import {
  HUB,
  LIVE,
  SLOTS,
  T,
  TOOLS,
  emailOk,
  first,
  initials,
  iso,
  pd,
  t12,
} from './data';
import { Raw } from './parts';

const reduce =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function CloseBtn({ onClose }) {
  return (
    <button className="close-btn" type="button" onClick={onClose} aria-label="Close">
      <svg
        className="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

export function Modal({ open, onClose, className = '', labelledBy, children }) {
  const ref = useRef(null);
  const lastFocus = useRef(null);
  useEffect(() => {
    if (!open) {
      if (lastFocus.current) {
        lastFocus.current.focus?.({ preventScroll: true });
        lastFocus.current = null;
      }
      return undefined;
    }
    lastFocus.current = document.activeElement;
    const t = setTimeout(() => {
      const el = ref.current?.querySelector(
        'input:not([type=checkbox]):not([type=file]),select,.btn.primary'
      );
      el?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div
      className={`backdrop${open ? ' open' : ''}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        <CloseBtn onClose={onClose} />
        {children}
      </div>
    </div>
  );
}

function Success({ show, title, text, extra, onClose }) {
  return (
    <div className={`success${show ? ' show' : ''}`} role="status">
      <svg className="check-anim" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="32" />
        <path d="M20 33l8 8 16-17" />
      </svg>
      <h2>{title}</h2>
      {extra}
      <p className="lead">{text}</p>
      <button className="btn" onClick={onClose}>
        Done
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export function LoginModal({
  open,
  onClose,
  pendingTool,
  onLogin,
  onResetPassword,
  onRequestLink,
  onCompleteAuthLink,
  authLink,
}) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [invalidField, setInvalidField] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [resetRequired, setResetRequired] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [flow, setFlow] = useState('login');
  const [requestPurpose, setRequestPurpose] = useState('recovery');
  const [linkSent, setLinkSent] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const emailRef = useRef(null);
  const passRef = useRef(null);
  const formRef = useRef(null);

  const pending = pendingTool ? T[pendingTool] : null;

  useEffect(() => {
    if (!open) {
      setError(false);
      setErrorMsg('');
      setInvalidField('');
      setDone(false);
      setBusy(false);
      setFlow('login');
      setResetRequired(false);
      setResetToken('');
      setLinkSent(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 120);
    }
  }, [open]);

  useEffect(() => {
    if (open && authLink) {
      setFlow('link');
      setResetToken(authLink.token);
      setResetRequired(false);
      setLinkSent(false);
      setError(false);
    }
  }, [open, authLink]);

  const submit = async (e) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    const pw = pass;
    if (!em || !pw) {
      setError(false);
      setInvalidField(!em ? 'email' : 'pass');
      (!em ? emailRef : passRef).current?.focus();
      return;
    }
    setInvalidField('');
    setBusy(true);
    setError(false);
    const result = await onLogin(em, pw);
    setBusy(false);
    if (result.requiresSetupLink) {
      setFlow('request');
      setRequestPurpose('setup');
      setEmail(result.email || em);
      setPass('');
      setLinkSent(result.setupLinkSent);
      setError(!result.setupLinkSent);
      setErrorMsg(result.setupLinkSent ? '' : result.message || 'Unable to send the setup link. Contact your administrator.');
      return;
    }
    if (result.requiresReset) {
      setResetRequired(true);
      setResetToken(result.resetToken || '');
      setPass('');
      setNewPass('');
      setConfirmPass('');
      setError(true);
      setErrorMsg(result.message || 'Your password needs to be reset.');
      return;
    }
    if (!result.ok) {
      setErrorMsg(result.error || 'Email or password is incorrect.');
      setError(true);
      passRef.current?.select();
      return;
    }
    setDone(true);
    await sleep(600);
    onClose();
    setDone(false);
    setError(false);
    setEmail('');
    setPass('');
    formRef.current?.reset();
    result.afterLogin?.();
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (!newPass || !confirmPass) {
      setErrorMsg('Both password fields are required.');
      setError(true);
      return;
    }
    if (newPass !== confirmPass) {
      setErrorMsg('The new password and confirm password do not match.');
      setError(true);
      return;
    }
    setBusy(true);
    setError(false);
    const result = await onResetPassword(resetToken, newPass, email);
    setBusy(false);
    if (!result.ok) {
      setErrorMsg(result.error || 'Unable to reset your password.');
      setError(true);
      return;
    }
    setDone(true);
    await sleep(500);
    onClose();
    setResetRequired(false);
    setResetToken('');
    setNewPass('');
    setConfirmPass('');
    setDone(false);
    result.afterLogin?.();
  };

  const startLinkRequest = (purpose) => {
    setFlow('request');
    setRequestPurpose(purpose);
    setLinkSent(false);
    setError(false);
    setErrorMsg('');
  };

  const submitLinkRequest = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const allowedEmail = normalizedEmail.endsWith('@highspring.in') ||
      (import.meta.env.DEV && normalizedEmail.endsWith('@yopmail.com'));
    if (!allowedEmail) {
      setErrorMsg(import.meta.env.DEV
        ? 'Use your @highspring.in or @yopmail.com email.'
        : 'Use your @highspring.in work email.');
      setError(true);
      return;
    }
    setBusy(true);
    setError(false);
    const result = await onRequestLink(normalizedEmail, requestPurpose);
    setBusy(false);
    if (!result.ok) {
      setErrorMsg(result.error || 'Unable to send the link. Please try again.');
      setError(true);
      return;
    }
    setEmail(normalizedEmail);
    setLinkSent(true);
  };

  const submitAuthLinkPassword = async (e) => {
    e.preventDefault();
    if (!newPass) {
      setErrorMsg('Enter a new password.');
      setError(true);
      return;
    }
    if (newPass !== confirmPass) {
      setErrorMsg('The new password and confirm password do not match.');
      setError(true);
      return;
    }
    setBusy(true);
    setError(false);
    const result = await onCompleteAuthLink(resetToken, newPass);
    setBusy(false);
    if (!result.ok) {
      setErrorMsg(result.error || 'This password link is invalid or expired.');
      setError(true);
      return;
    }
    setDone(true);
    await sleep(500);
    setDone(false);
    setFlow('login');
    setResetToken('');
    setNewPass('');
    setConfirmPass('');
    onClose();
    result.afterLogin?.();
  };

  return (
    <Modal open={open} onClose={onClose} className="login-modal" labelledBy="loginTitle">
      <div className="login-art" aria-hidden="true">
        <span className="blob b1"></span>
        <span className="blob b2"></span>
        <div className="orbit-wrap">
          <div className="orbit-ring"></div>
          <div className="orbit-ring inner"></div>
          <div className="orbit-core">
            <svg width="44" height="44" viewBox="0 0 45 45">
              <use href="#hsMark" />
            </svg>
          </div>
          <div className="orbit-spin" id="orbitSpin">
            {LIVE.map((t, i) => {
              const a = (i / LIVE.length) * Math.PI * 2 - Math.PI / 2;
              return (
                <span
                  className="sat"
                  key={t.id}
                  style={{
                    '--c': t.accent,
                    left: `${50 + 50 * Math.cos(a)}%`,
                    top: `${50 + 50 * Math.sin(a)}%`,
                  }}
                  dangerouslySetInnerHTML={{ __html: ICONS[t.iconKey] || ICONS.hub }}
                />
              );
            })}
          </div>
        </div>
        <div className="la-copy">
          <h3>One login for every Highspring tool.</h3>
          <p>Sign in once and move between your tools without signing in again.</p>
        </div>
      </div>
      <div className="login-form-side">
        <div className={`pending${pending ? ' show' : ''}`} style={{ '--pc': pending?.accent }}>
          {pending && (
            <>
              <span className="pi" id="pendingIc" dangerouslySetInnerHTML={{ __html: ICONS[pending.iconKey] || ICONS.hub }} />
              <span id="pendingText">
                {pending.soon
                  ? `Log in to turn on ${pending.name} launch alerts`
                  : `Log in to open ${pending.name}`}
              </span>
            </>
          )}
        </div>

        {resetRequired ? (
          <div>
            <h2 id="loginTitle">Reset your password</h2>
            <p className="lead">Choose a new password for {email}.</p>
          </div>
        ) : flow === 'link' ? (
          <div>
            <h2 id="loginTitle">{authLink?.action === 'setup' ? 'Set up your password' : 'Reset your password'}</h2>
            <p className="lead">Choose a new password and confirm it to continue.</p>
          </div>
        ) : flow === 'request' ? (
          <div>
            <h2 id="loginTitle">{requestPurpose === 'setup' ? 'Set up your account' : 'Forgot password?'}</h2>
            <p className="lead">Enter your Highspring work email and we’ll send a secure link.</p>
          </div>
        ) : (
          <div>
            <h2 id="loginTitle">Welcome back</h2>
            <p className="lead">Log in with your Highspring work email.</p>
          </div>
        )}

        {resetRequired ? (
          <form className="login-form" onSubmit={submitReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className={`form-error${error ? ' show' : ''}`} role="alert">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16.5v.5" />
              </svg>
              {errorMsg}
            </div>
            <div className="login-fields">
              <div className="ff">
                <input
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder=" "
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  style={{ paddingRight: 56 }}
                />
                <label>New password</label>
                <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="3" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <button type="button" className="eye" onClick={() => setShowNew((v) => !v)} aria-label="Show password">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: showNew ? EYE_OFF : EYE }} />
                </button>
              </div>
              <div className="ff">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder=" "
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  style={{ paddingRight: 56 }}
                />
                <label>Confirm new password</label>
                <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="3" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <button type="button" className="eye" onClick={() => setShowConfirm((v) => !v)} aria-label="Show password">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: showConfirm ? EYE_OFF : EYE }} />
                </button>
              </div>
            </div>
            <button className={`btn primary login-submit${done ? ' done' : ''}${busy ? ' loading' : ''}`} disabled={busy} type="submit">
              <span className="spinner"></span>
              <span className="btn-label">Set new password</span>
              <Raw html={ARROW} />
              <svg className="icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </button>
          </form>
        ) : flow === 'link' ? (
          <form className="login-form" onSubmit={submitAuthLinkPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className={`form-error${error ? ' show' : ''}`} role="alert">{errorMsg}</div>
            <div className="login-fields">
              <div className="ff">
                <input type="password" autoComplete="new-password" placeholder=" " value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                <label>New password</label>
                <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="3" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              </div>
              <div className="ff">
                <input type="password" autoComplete="new-password" placeholder=" " value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                <label>Confirm new password</label>
                <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="3" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              </div>
            </div>
            <button className={`btn primary login-submit${done ? ' done' : ''}${busy ? ' loading' : ''}`} disabled={busy} type="submit">
              <span className="spinner"></span><span className="btn-label">Confirm password</span><Raw html={ARROW} />
            </button>
            <button type="button" className="link-btn" onClick={() => { setFlow('login'); setResetToken(''); }}>Back to login</button>
          </form>
        ) : flow === 'request' ? (
          <form className="login-form" onSubmit={submitLinkRequest} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className={`form-error${error ? ' show' : ''}`} role="alert">{errorMsg}</div>
            {linkSent && <p className="lead" role="status">If an eligible account exists, a password link has been sent to that email address.</p>}
            <div className="login-fields">
              <div className="ff">
                <input type="email" autoComplete="email" placeholder=" " value={email} onChange={(e) => { setEmail(e.target.value); setLinkSent(false); }} />
                <label>Highspring work email</label>
                <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></svg>
              </div>
            </div>
            <button className={`btn primary login-submit${busy ? ' loading' : ''}`} disabled={busy} type="submit">
              <span className="spinner"></span><span className="btn-label">Send {requestPurpose === 'setup' ? 'setup' : 'reset'} link</span><Raw html={ARROW} />
            </button>
            <button type="button" className="link-btn" onClick={() => { setFlow('login'); setError(false); }}>Back to login</button>
          </form>
        ) : (
          <form className="login-form" ref={formRef} onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className={`form-error${error ? ' show' : ''}`} id="loginError" role="alert">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16.5v.5" />
              </svg>
              {errorMsg || 'Email or password is incorrect.'}
            </div>
            <div className="login-fields">
              <div className={`ff${invalidField === 'email' ? ' invalid' : ''}`} id="emailFF">
                <input
                  ref={emailRef}
                  id="lgEmail"
                  type="email"
                  autoComplete="username"
                  placeholder=" "
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (invalidField === 'email') setInvalidField('');
                  }}
                />
                <label htmlFor="lgEmail">Work email</label>
                <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
              <div className={`ff${invalidField === 'pass' ? ' invalid' : ''}`} id="passFF">
                <input
                  ref={passRef}
                  id="lgPass"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder=" "
                  style={{ paddingRight: 56 }}
                  value={pass}
                  onChange={(e) => {
                    setPass(e.target.value);
                    if (invalidField === 'pass') setInvalidField('');
                  }}
                  onKeyUp={(e) => setCaps(!!(e.getModifierState && e.getModifierState('CapsLock')))}
                />
                <label htmlFor="lgPass">Password</label>
                <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="3" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: showPass ? EYE_OFF : EYE }} />
                </button>
                <p className={`caps${caps ? ' show' : ''}`}>Caps Lock is on</p>
              </div>
            </div>
            <div className="row-between">
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="track"></span>Keep me logged in
              </label>
              <button type="button" className="link-btn" onClick={() => startLinkRequest('recovery')}>
                Forgot password?
              </button>
            </div>
            <button className={`btn primary login-submit${done ? ' done' : ''}${busy ? ' loading' : ''}`} type="submit" disabled={busy}>
              <span className="spinner"></span>
              <span className="btn-label">Log in</span>
              <Raw html={ARROW} />
              <svg className="icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </button>
            <button type="button" className="link-btn" onClick={() => startLinkRequest('setup')}>
              Set up your account
            </button>
            <p className="secure">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Secured for Highspring employees
            </p>
          </form>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Dropzone
// ---------------------------------------------------------------------------
function Drop({ accept, kind, defaultValue, value, onChange }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (!value && inputRef.current) inputRef.current.value = '';
  }, [value]);

  const take = (file) => {
    if (!file) return;
    const size =
      file.size > 1048576
        ? (file.size / 1048576).toFixed(1) + ' MB'
        : Math.max(1, Math.round(file.size / 1024)) + ' KB';
    if (kind === 'image') {
      const r = new FileReader();
      r.onload = () => onChange({ file, size, dataURL: r.result });
      r.readAsDataURL(file);
    } else {
      onChange({ file, size });
    }
  };
  return (
    <label
      className={`drop${value ? ' has' : ''}${over ? ' over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => take(e.target.files[0])}
      />
      <span className="di">
        {kind === 'image' && value?.dataURL ? (
          <img src={value.dataURL} alt="" />
        ) : kind === 'doc' && value ? (
          <Raw html={DOC} />
        ) : kind === 'doc' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <circle cx="9" cy="10" r="2" />
            <path d="m21 16-5-5-9 9" />
          </svg>
        )}
      </span>
      <span className="dt">
        <b>{value ? value.file.name : defaultValue[0]}</b>
        <small>{value ? value.size : defaultValue[1]}</small>
      </span>
      <button
        type="button"
        className="rm"
        aria-label="Remove file"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(null);
          if (inputRef.current) inputRef.current.value = '';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Book a demo
// ---------------------------------------------------------------------------
function Calendar({ cal, setCal }) {
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const first = new Date(cal.y, cal.m, 1);
  const start = (first.getDay() + 6) % 7;
  const days = new Date(cal.y, cal.m + 1, 0).getDate();
  const canPrev = cal.y > now.getFullYear() || (cal.y === now.getFullYear() && cal.m > now.getMonth());
  const change = (n) => {
    let m = cal.m + n;
    let y = cal.y;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    setCal({ ...cal, y, m, sel: null, time: null });
  };
  const cells = [];
  for (let i = 0; i < start; i++) cells.push(<span key={`e${i}`}></span>);
  for (let d = 1; d <= days; d++) {
    const dt = new Date(cal.y, cal.m, d);
    const k = iso(dt);
    const dis = dt < t0 || dt.getDay() === 0 || dt.getDay() === 6;
    cells.push(
      <button
        type="button"
        key={k}
        className={`day${k === iso(t0) ? ' today' : ''}`}
        aria-pressed={cal.sel === k}
        disabled={dis}
        onClick={() => setCal({ ...cal, sel: k, time: null })}
        aria-label={dt.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      >
        {d}
      </button>
    );
  }
  return (
    <div className="cal">
      <div className="cal-head">
        <button
          type="button"
          className="btn ghost icon-only"
          onClick={() => change(-1)}
          aria-label="Previous month"
          disabled={!canPrev}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <b>{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b>
        <button type="button" className="btn ghost icon-only" onClick={() => change(1)} aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className="cal-grid">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <span className="dow" key={d}>
            {d}
          </span>
        ))}
        {cells}
      </div>
    </div>
  );
}

export function DemoModal({ open, onClose, onBooked }) {
  const now = new Date();
  const [selected, setSelected] = useState(new Set());
  const [cal, setCal] = useState({ y: now.getFullYear(), m: now.getMonth(), sel: null, time: null });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [team, setTeam] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const confettiRef = useRef(null);

  useEffect(() => {
    if (open) {
      const n = new Date();
      setCal({ y: n.getFullYear(), m: n.getMonth(), sel: null, time: null });
      setSuccess('');
      setErrors({});
    }
  }, [open]);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    if (next.size) setErrors((e) => ({ ...e, tools: false }));
  };

  const schedText =
    cal.sel && cal.time
      ? `${pd(cal.sel).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at ${t12(cal.time)} IST`
      : cal.sel
      ? `${pd(cal.sel).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, now pick a time`
      : 'No time picked yet';

  const confetti = () => {
    if (reduce || !confettiRef.current) return;
    const c = confettiRef.current;
    c.innerHTML = '';
    const cols = ['#2DBFF9', '#1C5BDB', '#0F9A6C', '#D86C0A', '#7ACBFA'];
    for (let i = 0; i < 36; i++) {
      const s = document.createElement('i');
      const a = Math.random() * Math.PI * 2;
      const d = 120 + Math.random() * 200;
      s.style.cssText = `background:${cols[i % 5]};--x:${Math.cos(a) * d}px;--y:${
        Math.sin(a) * d - 60
      }px;--r:${Math.random() * 720}deg;animation-delay:${Math.random() * 0.1}s`;
      c.appendChild(s);
    }
    setTimeout(() => (c.innerHTML = ''), 1300);
  };

  const now2 = new Date();
  const isToday = cal.sel === iso(now2);
  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!name.trim()) err.name = true;
    if (!emailOk(email.trim())) err.email = true;
    if (!selected.size) err.tools = true;
    if (!(cal.sel && cal.time)) err.sched = true;
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    await sleep(900);
    setBusy(false);
    const names = [...selected].map((i) => T[i].name).join(', ');
    const text = `Thanks, ${first(name.trim())}. Your ${names} demo is set for ${schedText}. A calendar invite is on its way to ${email.trim()}.`;
    setSuccess(text);
    confetti();
    onBooked?.();
    setName('');
    setEmail('');
    setTeam('');
    setNotes('');
    setSelected(new Set());
  };

  return (
    <Modal open={open} onClose={onClose} className="demo-modal" labelledBy="demoTitle">
      <div className="confetti" ref={confettiRef} aria-hidden="true"></div>
      {!success ? (
        <div>
          <h2 id="demoTitle">Book a tool demo</h2>
          <p className="lead">Pick the tools and a time. A product specialist will walk your team through them.</p>
          <form onSubmit={submit} noValidate>
            <div className="demo-grid">
              <div className="form">
                <div className={`ff full${errors.name ? ' invalid' : ''}`}>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder=" " autoComplete="name" />
                  <label>Full name</label>
                  <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <p className="err">Enter your name.</p>
                </div>
                <div className={`ff full${errors.email ? ' invalid' : ''}`}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " autoComplete="email" />
                  <label>Work email</label>
                  <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  <p className="err">Enter a valid work email.</p>
                </div>
                <div className="ff full">
                  <input value={team} onChange={(e) => setTeam(e.target.value)} placeholder=" " />
                  <label>Team or business unit</label>
                  <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="9" cy="8" r="3" />
                    <circle cx="17" cy="9" r="2.5" />
                    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 2 6 5" />
                  </svg>
                </div>
                <fieldset className={`ffs full${errors.tools ? ' invalid' : ''}`}>
                  <legend>Tools you’re interested in</legend>
                  <div className="chips">
                    {LIVE.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        className="chip-toggle"
                        style={{ '--accent': t.accent }}
                        aria-pressed={selected.has(t.id)}
                        onClick={() => toggle(t.id)}
                      >
                        <span className="cdot">
                          <Raw html={CHECK} />
                        </span>
                        {t.name}
                      </button>
                    ))}
                  </div>
                  <p className="err">Pick at least one tool.</p>
                </fieldset>
                <div className="ff no-ic full">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder=" " />
                  <label>Anything we should know? (optional)</label>
                </div>
              </div>
              <div className={`sched${errors.sched ? ' invalid' : ''}`}>
                <span className="lbl" style={{ marginBottom: 0 }}>
                  Pick a date
                </span>
                <Calendar cal={cal} setCal={setCal} />
                <span className="lbl" style={{ marginBottom: 0 }}>
                  Pick a time (IST)
                </span>
                <div className="slots">
                  {!cal.sel ? (
                    <span style={{ gridColumn: '1/-1', color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>
                      Pick a date to see open times.
                    </span>
                  ) : (
                    SLOTS.map((s, i) => {
                      const [h, m] = s.split(':').map(Number);
                      const past = isToday && h * 60 + m <= now2.getHours() * 60 + now2.getMinutes() + 30;
                      return (
                        <button
                          type="button"
                          key={s}
                          className="slot"
                          aria-pressed={cal.time === s}
                          disabled={past}
                          style={{ animationDelay: `${i * 25}ms` }}
                          onClick={() => {
                            setCal({ ...cal, time: s });
                            setErrors((e) => ({ ...e, sched: false }));
                          }}
                        >
                          {t12(s)}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="sched-sum">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <span>{schedText}</span>
                </div>
                <p className="err">Pick a date and a time.</p>
              </div>
            </div>
            <div className="form-foot" style={{ marginTop: 18 }}>
              <small>We send a calendar invite to your work email.</small>
              <button className={`btn primary${busy ? ' loading' : ''}`} style={{ minHeight: 52, padding: '0 26px' }} type="submit" disabled={busy}>
                <span className="spinner"></span>
                <span className="btn-label">Request demo</span>
                <Raw html={ARROW} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <Success show title="Demo booked" text={success} onClose={onClose} />
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Post an update
// ---------------------------------------------------------------------------
export function PostModal({ open, onClose, user, initialPost, onPublish }) {
  const [type, setType] = useState('Feature launch');
  const [tool, setTool] = useState(TOOLS[0]?.id || HUB.id);
  const [date, setDate] = useState(iso(new Date()));
  const [emailSubject, setEmailSubject] = useState('');
  const [cc, setCc] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [cover, setCover] = useState(null);
  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setType(initialPost?.type || 'Feature launch');
      setTool(initialPost?.tool || TOOLS[0]?.id || HUB.id);
      setDate(initialPost?.date || iso(new Date()));
      setEmailSubject(initialPost?.emailSubject || '');
      setCc((initialPost?.cc || []).join(', '));
      setTitle(initialPost?.title || '');
      setSummary(initialPost?.summary || '');
      setBody((initialPost?.body || []).join('\n\n'));
      setCover(null);
      setDoc(null);
      setErrors({});
    }
  }, [open, initialPost]);

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!title.trim()) err.title = true;
    if (!summary.trim()) err.summary = true;
    if (!body.trim()) err.body = true;
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    const saved = await onPublish({
      tool,
      type,
      date: date || iso(new Date()),
      emailSubject,
      cc,
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim(),
    }, cover?.file || null, doc?.file || null, initialPost?.id);
    setBusy(false);
    if (!saved) return;
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="post-modal" labelledBy="postTitle">
      <h2 id="postTitle">{initialPost ? 'Edit update' : 'Post an update'}</h2>
      <p className="lead">Share a feature launch or update. It goes to the top of What’s new for everyone.</p>
      <form className="form" onSubmit={submit} noValidate>
        <div className="full">
          <span className="lbl">Type</span>
          <div className="seg" role="group" aria-label="Update type">
            {['Feature launch', 'Update', 'Fix', 'Announcement'].map((v) => (
              <button
                type="button"
                key={v}
                aria-pressed={type === v}
                onClick={() => setType(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="ff full no-ic">
          <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder=" " maxLength={255} />
          <label>Email subject line</label>
        </div>
        <div className="ff full no-ic">
          <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder=" " />
          <label>CC (comma-separated emails)</label>
        </div>
        <div className="ff">
          <select value={tool} onChange={(e) => setTool(e.target.value)}>
            {[...TOOLS, HUB].map((t) => (
              <option value={t.id} key={t.id}>
                {t.id === 'hub' ? 'Hub (all tools)' : t.name}
              </option>
            ))}
          </select>
          <label>Tool</label>
          <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
          </svg>
        </div>
        <div className="ff">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <label>Publish date</label>
          <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="3" y="4.5" width="18" height="16" rx="3" />
            <path d="M8 2.5v4M16 2.5v4M3 10h18" />
          </svg>
        </div>
        <div className={`ff full no-ic${errors.title ? ' invalid' : ''}`}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder=" " maxLength={100} />
          <label>Title</label>
          <p className="err">Add a title.</p>
        </div>
        <div className={`ff full no-ic${errors.summary ? ' invalid' : ''}`}>
          <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder=" " maxLength={180} />
          <label>One-line summary</label>
          <p className="err">Add a short summary.</p>
        </div>
        <div className={`ff full no-ic${errors.body ? ' invalid' : ''}`}>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder=" " rows={5} />
          <label>What changed? Leave a blank line between paragraphs.</label>
          <p className="err">Describe the update.</p>
        </div>
        <div>
          <span className="lbl">Cover image (optional)</span>
          {initialPost?.cover && (
            <p><a href={initialPost.cover} target="_blank" rel="noopener">View current cover image</a></p>
          )}
          <Drop
            accept=".jpg,.jpeg,.png,.webp"
            kind="image"
            defaultValue={['Upload an image', 'PNG or JPG, shown at the top']}
            value={cover}
            onChange={setCover}
          />
        </div>
        <div>
          <span className="lbl">Attach a document (optional)</span>
          {initialPost?.docURL && (
            <p><a href={initialPost.docURL} target="_blank" rel="noopener">View current attachment</a></p>
          )}
          <Drop
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md"
            kind="doc"
            defaultValue={['Attach a file', 'PDF, Word, slides or sheets']}
            value={doc}
            onChange={setDoc}
          />
        </div>
        <div className="form-foot">
          <small>Posting as {user?.name}, {user?.role}</small>
          <button className={`btn primary${busy ? ' loading' : ''}`} style={{ minHeight: 52, padding: '0 26px' }} type="submit" disabled={busy}>
            <span className="spinner"></span>
            <span className="btn-label">{initialPost ? 'Save changes' : 'Publish update'}</span>
            <Raw html={ARROW} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Report a bug
// ---------------------------------------------------------------------------
export function BugModal({ open, onClose, user, onReport }) {
  const [where, setWhere] = useState('hub');
  const [email, setEmail] = useState('');
  const [sev, setSev] = useState('Medium');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [shot, setShot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setTicket('');
      setErrors({});
      if (user) setEmail(user.email);
    }
  }, [open, user]);

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!emailOk(email.trim())) err.email = true;
    if (!title.trim()) err.title = true;
    if (!desc.trim()) err.desc = true;
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    await sleep(800);
    setBusy(false);
    const tid = 'BUG-' + String(Math.floor(1000 + Math.random() * 9000));
    setTicket(tid);
    onReport?.(tid, sev, T[where].name, email.trim());
    setTitle('');
    setDesc('');
    setShot(null);
    setSev('Medium');
    setWhere('hub');
  };

  return (
    <Modal open={open} onClose={onClose} className="bug-modal" labelledBy="bugTitle">
      {!ticket ? (
        <div>
          <h2 id="bugTitle">Report a bug</h2>
          <p className="lead">Tell us what went wrong. The product team will follow up by email.</p>
          <form className="form" onSubmit={submit} noValidate>
            <div className="ff">
              <select value={where} onChange={(e) => setWhere(e.target.value)}>
                {[HUB, ...TOOLS.filter((t) => !t.soon)].map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.id === 'hub' ? 'Hub (this site)' : t.name}
                  </option>
                ))}
              </select>
              <label>Where did it happen?</label>
              <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" />
              </svg>
            </div>
            <div className={`ff${errors.email ? ' invalid' : ''}`}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " autoComplete="email" />
              <label>Your email</label>
              <svg className="ic icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <p className="err">Enter a valid email.</p>
            </div>
            <div className="full">
              <span className="lbl">How bad is it?</span>
              <div className="seg sev" role="group" aria-label="Severity">
                {['Low', 'Medium', 'High', 'Blocker'].map((v) => (
                  <button type="button" key={v} data-v={v} aria-pressed={sev === v} onClick={() => setSev(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className={`ff full no-ic${errors.title ? ' invalid' : ''}`}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder=" " maxLength={100} />
              <label>Short title</label>
              <p className="err">Add a short title.</p>
            </div>
            <div className={`ff full no-ic${errors.desc ? ' invalid' : ''}`}>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder=" " rows={4} />
              <label>What happened, and what did you expect?</label>
              <p className="err">Describe the problem.</p>
            </div>
            <div className="full">
              <span className="lbl">Screenshot (optional)</span>
              <Drop
                accept="image/*"
                kind="image"
                defaultValue={['Add a screenshot', 'Helps us find it faster']}
                value={shot}
                onChange={setShot}
              />
            </div>
            <div className="form-foot">
              <small>Page and browser details are attached automatically.</small>
              <button className={`btn primary${busy ? ' loading' : ''}`} style={{ minHeight: 52, padding: '0 26px' }} type="submit" disabled={busy}>
                <span className="spinner"></span>
                <span className="btn-label">Send report</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <Success
          show
          title="Thanks, bug reported"
          extra={<p className="ticket">{ticket}</p>}
          text={`${sev} priority, ${T[where].name}. We’ll follow up at ${email.trim()}.`}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// No access
// ---------------------------------------------------------------------------
export function NoAccessModal({ open, onClose, tool, user, onRequest }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setBusy(false);
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} labelledBy="naTitle">
      <div className="na-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="3" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>
      <h2 id="naTitle">You don’t have access to {tool?.name}</h2>
      <p className="lead" style={{ margin: '8px 0 22px' }}>
        Your role ({user?.role}) doesn’t include {tool?.name}. Send a request and your hub admin will review it.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          className={`btn primary${busy ? ' loading' : ''}`}
          onClick={async () => {
            setBusy(true);
            await sleep(800);
            setBusy(false);
            onRequest?.();
          }}
          disabled={busy}
        >
          <span className="spinner"></span>
          <span className="btn-label">Request access</span>
        </button>
        <button className="btn" onClick={onClose}>
          Not now
        </button>
      </div>
    </Modal>
  );
}
