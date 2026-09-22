import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  ExternalLink,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Compass,
  CalendarCheck,
  Star,
  BrainCircuit,
  FileText,
} from 'lucide-react';
import { TOOLS, USER_MANUALS } from '../config/tools';

export function HubAssistant({ isOpen, onClose, onOpen }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      isWelcomeHero: true,
      text: "Welcome to the **Highspring Digital Solutions Hub** AI Assistant. I can provide instant overviews of our internal applications, direct you to official enterprise operations manuals, or guide you through candidate scheduling and rating workflows.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, isTyping]);

  // Global keyboard listener for Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const generateBotResponse = (query) => {
    const q = query.toLowerCase().trim();

    // 1. Manuals / Documentation queries
    if (
      q.includes('manual') ||
      q.includes('guide') ||
      q.includes('docs') ||
      q.includes('documentation') ||
      q.includes('user manual')
    ) {
      if (q.includes('interview') || q.includes('schedule') || q.includes('career')) {
        return {
          text: `### Career Portal: Enterprise User Guide & Operations Manual\n\nThis official operations guide covers:\n• **Interviewer Panels**: Configuring availability and interviewer routing\n• **Calendar Synchronization**: Automated Outlook & Google Calendar integrations\n• **Candidate Workflow**: Automated notifications, reminder sequences, and reschedule management\n• **Panel Calibrations**: Interviewer assignments and room reservations`,
          actions: [
            {
              type: 'manual',
              label: 'Open Interview Operations Manual',
              subtitle: 'Official Google Docs Guide',
              url: USER_MANUALS.INTERVIEW_SCHEDULING.url,
            },
            {
              type: 'tool',
              label: 'Launch Interview Scheduling Portal',
              subtitle: 'Staffing Portal Endpoint',
              url: TOOLS[0].url,
            },
          ],
        };
      }

      if (q.includes('rating') || q.includes('ratting') || q.includes('performance') || q.includes('eval')) {
        return {
          text: `### Employee Performance Hub: Operations & Rating Manual\n\nThis official enterprise guide details:\n• **Score Normalization**: Standardized rating scales and algorithmic score leveling\n• **Consensus Workflows**: Automated debrief compilations and reviewer calibrations\n• **Scorecard Audits**: Real-time evaluation histories and unconscious bias mitigation\n• **Talent Calibrations**: Post-interview decision matrices`,
          actions: [
            {
              type: 'manual',
              label: 'Open Rating Operations Manual',
              subtitle: 'Official Google Docs Guide',
              url: USER_MANUALS.RATING_AUTOMATION.url,
            },
            {
              type: 'tool',
              label: 'Launch Rating Automation Tool',
              subtitle: 'Evaluation Portal Endpoint',
              url: TOOLS[2].url,
            },
          ],
        };
      }

      return {
        text: `### Official Highspring Operations Manuals\n\nSelect an enterprise manual below to open the complete Google Docs documentation:`,
        actions: [
          {
            type: 'manual',
            label: 'Career Portal: Enterprise User Guide & Operations Manual',
            subtitle: 'Interview scheduling, panel routing, and calendar sync',
            url: USER_MANUALS.INTERVIEW_SCHEDULING.url,
          },
          {
            type: 'manual',
            label: 'Employee Performance Hub: Rating & Operations Guide',
            subtitle: 'Scorecard compilation, consensus calibrations, and rubrics',
            url: USER_MANUALS.RATING_AUTOMATION.url,
          },
        ],
      };
    }

    // 2. Overview / "What does this app do" / "Overview of this app"
    if (
      q.includes('overview') ||
      q.includes('what does this app do') ||
      q.includes('what is this') ||
      q.includes('about') ||
      q.includes('purpose') ||
      q.includes('all apps')
    ) {
      return {
        text: `### Highspring Digital Solutions Hub Overview\n\n1. **Staffing Solution - Interview**: Candidate interview coordination and calendar sync.\n2. **Recruitment Solution - HAT**: Structured assessments for interns and entry-level engineers.\n3. **Performance Evaluation Solution - Rating**: Scorecard compilation and rating normalization.\n\nMore AI solutions are coming soon (Quality AI).`,
        quickReplies: [
          "Open User Manuals",
          "Interview Tool Details",
          "Rating Tool Details",
          "HAT Tool Details",
        ],
      };
    }

    // 3. Interview Scheduling
    if (q.includes('interview') || q.includes('scheduling') || q.includes('schedule') || q.includes('calendar')) {
      const tool = TOOLS.find((t) => t.id === 'interview');
      return {
        text: `### ${tool.name}\n\n**Purpose**: ${tool.purpose}\n\n**Core Capabilities**:\n• **Multi-Panel Coordination**: Orchestrates schedules across diverse interviewer panels\n• **Calendar Sync**: Live two-way integration with Outlook and Google Calendar\n• **Automated Notifications**: Automated candidate invitations and confirmation links`,
        actions: [
          {
            type: 'tool',
            label: 'Launch Interview Scheduling Portal',
            subtitle: 'Direct SSO Hand-off',
            url: tool.url,
          },
          {
            type: 'manual',
            label: 'Open Interview Operations Manual',
            subtitle: 'Official Google Docs Guide',
            url: tool.manualUrl,
          },
        ],
      };
    }

    // 4. Rating Automation
    if (q.includes('rating') || q.includes('ratting') || q.includes('performance') || q.includes('score')) {
      const tool = TOOLS.find((t) => t.id === 'rating');
      return {
        text: `### ${tool.name}\n\n**Purpose**: ${tool.purpose}\n\n**Core Capabilities**:\n• **Score Normalization**: Removes reviewer scoring biases and levels evaluation variance\n• **Consensus Reports**: Generates automated consensus debrief decks for hiring panels\n• **Live Scorecards**: Instant digital scorecard generation with rubric adherence`,
        actions: [
          {
            type: 'tool',
            label: 'Launch Rating Automation Tool',
            subtitle: 'Direct SSO Hand-off',
            url: tool.url,
          },
          {
            type: 'manual',
            label: 'Open Rating Operations Manual',
            subtitle: 'Official Google Docs Guide',
            url: tool.manualUrl,
          },
        ],
      };
    }

    // 5. Hiring Assessment
    if (q.includes('assessment') || q.includes('hiring') || q.includes('evaluat') || q.includes('test')) {
      const tool = TOOLS.find((t) => t.id === 'hat');
      return {
        text: `### ${tool.name}\n\n**Purpose**: ${tool.purpose}\n\n**Core Capabilities**:\n• **Standardized Rubrics**: Objective competency matrices across technical and behavioral skills\n• **Blind Evaluation**: Anonymous candidate grading to mitigate unconscious bias\n• **Automated Benchmarking**: Instant percentile rankings against talent benchmarks`,
        actions: [
          {
            type: 'tool',
            label: 'Launch Hiring Assessment Tool',
            subtitle: 'Direct SSO Hand-off',
            url: tool.url,
          },
        ],
      };
    }

    // 6. Quality AI
    if (false && (q.includes('quality') || q.includes('ai') || q.includes('transcript') || q.includes('intelligence'))) {
      const tool = TOOLS.find((t) => t.id === 'quality-ai');
      return {
        text: `### ${tool.name}\n\n**Purpose**: ${tool.purpose}\n\n**Core Capabilities**:\n• **Semantic Analysis**: Deep evaluation of candidate interview transcripts and dialogue dynamics\n• **QA Auditing**: Real-time auditing for interview compliance and standardized question delivery\n• **Predictive Insights**: Generates automated executive summaries for hiring managers`,
        actions: [
          {
            type: 'tool',
            label: 'Launch Quality AI Portal',
            subtitle: 'Direct SSO Hand-off',
            url: tool.url,
          },
        ],
      };
    }

    // 7. Search query matcher
    const matches = TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.capabilities.some((c) => c.toLowerCase().includes(q)) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );

    if (matches.length > 0) {
      return {
        text: `### Search Results for "${query}"\nFound **${matches.length} matching internal application(s)**:`,
        actions: matches.map((m) => ({
          type: 'tool',
          label: `Launch ${m.name}`,
          subtitle: m.purpose,
          url: m.url,
        })),
      };
    }

    // Default Fallback
    return {
      text: `### How can I assist you?\n\nI am configured with full knowledge of Highspring's internal applications and operations manuals. Try choosing an option below:`,
      quickReplies: [
        "What does this app do?",
        "User manuals & guides",
        "Interview Scheduling Guide",
        "Rating Tool Guide",
      ],
    };
  };

  const handleSend = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateBotResponse(text);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        ...botResponse,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 420);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        isWelcomeHero: true,
        text: "Welcome to the **Highspring Digital Solutions Hub** AI Assistant. I can provide instant overviews of our internal applications, direct you to official enterprise operations manuals, or guide you through candidate scheduling and rating workflows.",
      },
    ]);
  };

  return (
    <>
      {/* Executive Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          className="bot-launcher-executive"
          onClick={onOpen}
          aria-label="Open Highspring AI Assistant"
          title="Open AI Assistant & User Manuals"
        >
          <div className="launcher-specular-ring" aria-hidden="true" />
          <div className="launcher-avatar-core">
            <Sparkles size={18} className="launcher-sparkle" />
            <span className="launcher-live-beacon" />
          </div>
        </button>
      )}

      {/* Luxury Copilot Floating Window */}
      {isOpen && (
        <aside
          className="bot-copilot-window"
          role="dialog"
          aria-labelledby="copilot-title"
          aria-modal="false"
        >
          {/* Top Iridescent Ambient Light Edge */}
          <div className="copilot-top-edge" aria-hidden="true" />

          {/* Copilot Header */}
          <div className="copilot-header">
            <div className="copilot-header-brand">
              <div className="copilot-emblem-wrap">
                <Sparkles size={18} className="copilot-sparkle-icon" />
                <span className="copilot-beacon-pulse" />
              </div>
              <div className="copilot-title-group">
                <div className="copilot-title-row">
                  <h3 id="copilot-title" className="copilot-title">
                    Highspring Assistant
                  </h3>
                  <span className="copilot-badge">AI COPILOT</span>
                </div>
                <span className="copilot-meta">Enterprise Knowledge & Operations</span>
              </div>
            </div>

            <div className="copilot-header-actions">
              <button
                type="button"
                className="copilot-icon-btn"
                onClick={resetChat}
                title="Reset conversation"
                aria-label="Reset chat"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="copilot-icon-btn"
                onClick={onClose}
                title="Close assistant (Esc)"
                aria-label="Close assistant"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="copilot-stream">
            {messages.map((msg) => (
              <div key={msg.id} className={`copilot-msg-row ${msg.sender === 'user' ? 'msg-is-user' : 'msg-is-bot'}`}>
                {msg.sender === 'bot' && (
                  <div className="copilot-avatar-circle" aria-hidden="true">
                    <Bot size={15} />
                  </div>
                )}

                <div className="copilot-bubble-card">
                  {/* Optional Welcome Hero Card inside chat */}
                  {msg.isWelcomeHero && (
                    <div className="copilot-welcome-card">
                      <div className="welcome-tag">
                        <Compass size={13} />
                        <span>INTELLIGENT WORKFLOW COPILOT</span>
                      </div>
                      <h4 className="welcome-heading">How can I assist your workflow today?</h4>
                      <div className="welcome-quick-grid">
                        <button
                          type="button"
                          className="welcome-grid-btn"
                          onClick={() => handleSend("User manuals & guides")}
                        >
                          <BookOpen size={16} className="btn-icon-cyan" />
                          <div className="btn-text-wrap">
                            <span className="btn-primary-text">Operations Manuals</span>
                            <span className="btn-secondary-text">Google Docs Guides</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="welcome-grid-btn"
                          onClick={() => handleSend("What does this app do?")}
                        >
                          <Compass size={16} className="btn-icon-indigo" />
                          <div className="btn-text-wrap">
                            <span className="btn-primary-text">App Overview</span>
                            <span className="btn-secondary-text">Capabilities & Tools</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="welcome-grid-btn"
                          onClick={() => handleSend("Interview Scheduling Guide")}
                        >
                          <CalendarCheck size={16} className="btn-icon-cyan" />
                          <div className="btn-text-wrap">
                            <span className="btn-primary-text">Interview Hub</span>
                            <span className="btn-secondary-text">Panel & Calendar Sync</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="welcome-grid-btn"
                          onClick={() => handleSend("Rating Tool Guide")}
                        >
                          <Star size={16} className="btn-icon-amber" />
                          <div className="btn-text-wrap">
                            <span className="btn-primary-text">Rating Tool</span>
                            <span className="btn-secondary-text">Scorecards & Normalization</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="copilot-body-text">
                    {msg.text.split('\n').map((line, i) => {
                      if (line.startsWith('### ')) {
                        return (
                          <h4 key={i} className="copilot-heading-3">
                            {line.replace(/^###\s*/, '')}
                          </h4>
                        );
                      }
                      if (line.startsWith('• ') || line.startsWith('- ')) {
                        return (
                          <div key={i} className="copilot-bullet">
                            <span className="copilot-bullet-dot" />
                            <span>{renderFormattedText(line.replace(/^[•-]\s*/, ''))}</span>
                          </div>
                        );
                      }
                      if (/^\d+\.\s/.test(line)) {
                        return (
                          <div key={i} className="copilot-numbered-line">
                            <span className="copilot-number-badge">{line.match(/^\d+/)[0]}</span>
                            <span>{renderFormattedText(line.replace(/^\d+\.\s*/, ''))}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={i} className="copilot-paragraph">
                          {renderFormattedText(line)}
                        </p>
                      );
                    })}
                  </div>

                  {/* Direct Action Cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="copilot-action-cards-grid">
                      {msg.actions.map((act, idx) => (
                        <a
                          key={idx}
                          href={act.url}
                          target={act.type === 'manual' ? '_blank' : '_self'}
                          rel={act.type === 'manual' ? 'noopener noreferrer' : undefined}
                          className={`copilot-action-card ${act.type === 'manual' ? 'action-is-manual' : 'action-is-tool'}`}
                        >
                          <div className="action-card-lead">
                            {act.type === 'manual' ? (
                              <div className="action-icon-badge badge-manual">
                                <BookOpen size={16} />
                              </div>
                            ) : (
                              <div className="action-icon-badge badge-tool">
                                <ArrowRight size={16} />
                              </div>
                            )}
                            <div className="action-card-text">
                              <span className="action-card-title">{act.label}</span>
                              {act.subtitle && (
                                <span className="action-card-sub">{act.subtitle}</span>
                              )}
                            </div>
                          </div>
                          <div className="action-card-tail">
                            {act.type === 'manual' ? (
                              <span className="gdoc-pill">
                                Google Docs ↗
                              </span>
                            ) : (
                              <span className="launch-pill">
                                Open Portal →
                              </span>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.quickReplies && (
                    <div className="copilot-chips-cluster">
                      {msg.quickReplies.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="copilot-chip"
                          onClick={() => handleSend(chip)}
                        >
                          <span>{chip}</span>
                          <ArrowRight size={11} className="chip-arrow" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="copilot-msg-row msg-is-bot">
                <div className="copilot-avatar-circle" aria-hidden="true">
                  <Bot size={15} />
                </div>
                <div className="copilot-bubble-card typing-box">
                  <div className="typing-wave">
                    <span className="wave-dot" />
                    <span className="wave-dot" />
                    <span className="wave-dot" />
                  </div>
                  <span className="typing-label">Consulting knowledge base...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Command Input Bar */}
          <div className="copilot-input-zone">
            <div className="copilot-input-frame">
              <input
                ref={inputRef}
                type="text"
                className="copilot-text-input"
                placeholder="Ask anything (e.g. 'overview', 'user manuals', 'rating tool')..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Type a question for Highspring Assistant"
              />
              <button
                type="button"
                className="copilot-send-button"
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                title="Send message"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="copilot-input-meta">
              <span>Press <kbd>Enter ↵</kbd> to ask</span>
              <span className="meta-sep">•</span>
              <span><kbd>Esc</kbd> to close</span>
              <span className="meta-sep">•</span>
              <span style={{ color: 'var(--cyan-core)' }}>Direct Manual Links</span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}

// Markdown bold helper
function renderFormattedText(text) {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
