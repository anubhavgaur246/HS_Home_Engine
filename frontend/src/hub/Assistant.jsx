import React, { useEffect, useRef, useState } from 'react';
import { CHAT, SPARK } from './icons';
import { HUB, LIVE, T, TOOLS, allUpdates, first } from './data';
import { Raw } from './parts';

const reduce =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const WELCOME = 'Hi. I can explain any tool, find a manual or demo, or tell you what you have access to.';

export function Assistant({
  open,
  onClose,
  onOpen,
  user,
  updates,
  onNavigate,
  onBug,
  onLogin,
  onOpenTool,
  askRequest,
  onAskConsumed,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);
  const lastAsk = useRef(null);

  const scroll = () => {
    if (bodyRef.current) bodyRef.current.scrollTop = 1e6;
  };

  const reset = () => {
    setMessages([
      {
        id: 'welcome',
        html: `Hi${user ? ' ' + first(user.name) : ''}. I can explain any tool, find a manual or demo, or tell you what you have access to.`,
        me: false,
        welcome: true,
      },
    ]);
  };

  useEffect(() => {
    if (open) {
      if (!started.current) {
        started.current = true;
        reset();
      }
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    scroll();
  }, [messages, typing]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [user]);

  const reply = (q) => {
    q = q.toLowerCase();
    const tool = TOOLS.find(
      (t) =>
        q.includes(t.id) ||
        q.includes(t.name.toLowerCase()) ||
        (t.id === 'hat' && q.includes('recruit')) ||
        (t.id === 'staffing' && (q.includes('schedul') || q.includes('calendar'))) ||
        (t.id === 'performance' && (q.includes('scor') || q.includes('rating')))
    );
    if (q.includes('access') || q.includes('can i')) {
      return user
        ? `As <b>${user.role}</b> you can open ${(Array.isArray(user.access) ? user.access : [])
            .map((a) => `<button class="inline" data-go="${a}">${T[a]?.name}</button>`)
            .join(', ')}. Locked tools have a Request access button.`
        : `Log in first and I’ll show your tools. <button class="inline" data-go="login">Log in</button>`;
    }
    if (q.includes('manual') || q.includes('guide') || q.includes('demo')) {
      return (
        'Every tool card has a Manual and a Tool demo button: ' +
        LIVE.map(
          (t) => `<a href="${t.manual}" target="_blank" rel="noopener">${t.name} manual</a>`
        ).join(', ') +
        '.'
      );
    }
    if (q.includes('new') || q.includes('update')) {
      return `The latest is “${esc(updates[0]?.title || '')}”. <button class="inline" data-go="news">See all updates</button>`;
    }
    if (q.includes('bug') || q.includes('broken') || q.includes('error')) {
      return `Sorry about that. <button class="inline" data-go="bug">Report a bug</button> and the product team will follow up.`;
    }
    if (tool) {
      return tool.soon
        ? `${tool.name} is coming soon. <button class="inline" data-go="${tool.id}">Turn on a launch alert</button>`
        : `<b>${tool.name}</b> (${tool.sub}): ${tool.desc} <button class="inline" data-go="${tool.id}">Open ${tool.name}</button>`;
    }
    return 'I can help with tools, manuals, access, updates and bugs. Try “What does HAT do?” or “Where’s the Staffing manual?”';
  };

  const ask = (q) => {
    if (!q) return;
    const uid = 'u' + Date.now() + Math.random().toString(36).slice(2);
    setMessages((m) => [...m, { id: uid, html: esc(q), me: true }]);
    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        setMessages((m) => [
          ...m,
          {
            id: 'b' + Date.now() + Math.random().toString(36).slice(2),
            html: reply(q),
            me: false,
          },
        ]);
      },
      reduce ? 50 : 700
    );
  };

  useEffect(() => {
    if (askRequest && open && askRequest.id !== lastAsk.current) {
      lastAsk.current = askRequest.id;
      ask(askRequest.q);
      onAskConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askRequest, open]);

  const go = (v) => {
    if (v === 'news') {
      onClose();
      onNavigate('whats-new');
    } else if (v === 'bug') {
      onClose();
      onBug();
    } else if (v === 'login') {
      onLogin();
    } else {
      onOpenTool(v);
    }
  };

  return (
    <>
      <button
        className="fab"
        onClick={() => (open ? onClose() : onOpen())}
        aria-expanded={open}
        aria-controls="assistant"
      >
        <span className="fab-ic">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
            <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
          </svg>
        </span>
        <span className="fab-text">Ask the hub</span>
      </button>

      <section
        className={`assistant${open ? ' open' : ''}`}
        id="assistant"
        aria-label="Hub assistant"
        aria-hidden={!open}
      >
        <div className="as-head">
          <span className="fab-ic">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
            </svg>
          </span>
          <div>
            <b>Hub assistant</b>
            <br />
            <small>Tools, manuals and access</small>
          </div>
          <button className="btn ghost icon-only" onClick={reset} aria-label="Start over">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
            </svg>
          </button>
          <button className="btn ghost icon-only" onClick={onClose} aria-label="Close assistant">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div
          className="as-body"
          ref={bodyRef}
          onClick={(e) => {
            const b = e.target.closest('[data-go]');
            if (b) go(b.dataset.go);
          }}
        >
          {messages.map((m, i) => (
            <React.Fragment key={m.id}>
              <div className={`msg ${m.me ? 'me' : 'bot'}`} dangerouslySetInnerHTML={{ __html: m.html }} />
              {m.welcome && (
                <div className="quick">
                  {[
                    ['Manuals', 'User manual for each tool'],
                    ['My access', 'What can I open?'],
                    ['What’s new', 'Latest launches'],
                    ['Report a bug', 'Something broken?'],
                  ].map(([q, s]) => (
                    <button type="button" key={q} onClick={() => ask(q)}>
                      {q}
                      <small>{s}</small>
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
          {typing && (
            <div className="msg bot typing">
              <i></i>
              <i></i>
              <i></i>
            </div>
          )}
        </div>
        <form
          className="as-input"
          onSubmit={(e) => {
            e.preventDefault();
            const v = input.trim();
            if (!v) return;
            setInput('');
            ask(v);
          }}
        >
          <label htmlFor="asInput" className="sr">
            Ask a question
          </label>
          <input
            id="asInput"
            ref={inputRef}
            placeholder="Ask about a tool, manual or access"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn primary icon-only" aria-label="Send">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </form>
      </section>
    </>
  );
}
