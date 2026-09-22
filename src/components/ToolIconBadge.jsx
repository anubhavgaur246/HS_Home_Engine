import React from 'react';

export function ToolIconBadge({ type, accent }) {
  switch (type) {
    case 'calendar':
      return (
        <div className="icon-badge-root icon-badge-cyan">
          <svg viewBox="0 0 64 64" fill="none" className="icon-badge-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="calBg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0E2A47" />
                <stop offset="1" stopColor="#071526" />
              </linearGradient>
              <linearGradient id="calCyan" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" />
                <stop offset="1" stopColor="#0284C7" />
              </linearGradient>
              <linearGradient id="calHeader" x1="12" y1="10" x2="52" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0284C7" />
                <stop offset="1" stopColor="#0369A1" />
              </linearGradient>
              <filter id="glowCyan" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Back Ambient Glow */}
            <circle cx="32" cy="32" r="24" fill="#38BDF8" opacity="0.15" filter="url(#glowCyan)" />

            {/* Main Calendar Body */}
            <rect x="11" y="13" width="42" height="40" rx="10" fill="url(#calBg)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />

            {/* Top Header Bar */}
            <path d="M11 23C11 17.4772 15.4772 13 21 13H43C48.5228 13 53 17.4772 53 23V25H11V23Z" fill="url(#calHeader)" />

            {/* Binder Rings */}
            <rect x="20" y="8" width="4" height="8" rx="2" fill="#E0F2FE" />
            <rect x="40" y="8" width="4" height="8" rx="2" fill="#E0F2FE" />

            {/* Calendar Grid Cells */}
            <circle cx="21" cy="33" r="2" fill="#7DD3FC" opacity="0.8" />
            <circle cx="32" cy="33" r="2" fill="#7DD3FC" opacity="0.8" />
            <circle cx="43" cy="33" r="2" fill="#7DD3FC" opacity="0.8" />
            <circle cx="21" cy="42" r="2" fill="#7DD3FC" opacity="0.8" />
            <circle cx="32" cy="42" r="2" fill="#7DD3FC" opacity="0.8" />

            {/* Floating Clock / Meeting Sync Badge */}
            <g transform="translate(32, 32)">
              <circle cx="11" cy="11" r="10" fill="#0369A1" stroke="#38BDF8" strokeWidth="1.8" />
              <path d="M22 11C22 17.0751 17.0751 22 11 22C4.92487 22 0 17.0751 0 11C0 4.92487 4.92487 0 11 0C17.0751 0 22 4.92487 22 11Z" fill="url(#calCyan)" opacity="0.25" />
              {/* Clock Hands */}
              <path d="M11 7V11L14 13" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
      );

    case 'assessment':
      return (
        <div className="icon-badge-root icon-badge-indigo">
          <svg viewBox="0 0 64 64" fill="none" className="icon-badge-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="brainBg" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop stopColor="#221551" />
                <stop offset="1" stopColor="#100A26" />
              </linearGradient>
              <linearGradient id="violetGrad" x1="14" y1="12" x2="50" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C084FC" />
                <stop offset="0.5" stopColor="#818CF8" />
                <stop offset="1" stopColor="#4F46E5" />
              </linearGradient>
              <filter id="glowIndigo" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Back Ambient Aura */}
            <circle cx="32" cy="32" r="24" fill="#818CF8" opacity="0.18" filter="url(#glowIndigo)" />

            {/* Shield / Hexagon Enclosure */}
            <rect x="11" y="11" width="42" height="42" rx="12" fill="url(#brainBg)" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />

            {/* Synaptic Network & Intelligence Nodes */}
            <g stroke="url(#violetGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {/* Left Hemisphere Circuit */}
              <path d="M26 21C22 21 19 24 19 28C19 31 20 33 22 34C19 36 18 39 19 42C20 45 23 46 26 45" />
              {/* Right Hemisphere Circuit */}
              <path d="M38 21C42 21 45 24 45 28C45 31 44 33 42 34C45 36 46 39 45 42C44 45 41 46 38 45" />
              {/* Central Bridge */}
              <path d="M26 28H38" />
              <path d="M22 34H42" />
              <path d="M26 40H38" />
            </g>

            {/* Glowing Central Processing Core */}
            <circle cx="32" cy="34" r="4" fill="#A855F7" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="21" cy="28" r="2" fill="#E9D5FF" />
            <circle cx="43" cy="28" r="2" fill="#E9D5FF" />
            <circle cx="21" cy="42" r="2" fill="#E9D5FF" />
            <circle cx="43" cy="42" r="2" fill="#E9D5FF" />
          </svg>
        </div>
      );

    case 'rating':
      return (
        <div className="icon-badge-root icon-badge-amber">
          <svg viewBox="0 0 64 64" fill="none" className="icon-badge-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="starBg" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop stopColor="#382104" />
                <stop offset="1" stopColor="#1C0F02" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="16" y1="14" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE68A" />
                <stop offset="0.3" stopColor="#F59E0B" />
                <stop offset="1" stopColor="#D97706" />
              </linearGradient>
              <filter id="glowAmber" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Ambient Aura */}
            <circle cx="32" cy="32" r="24" fill="#F59E0B" opacity="0.16" filter="url(#glowAmber)" />

            {/* Container Base */}
            <rect x="11" y="11" width="42" height="42" rx="12" fill="url(#starBg)" stroke="rgba(245, 158, 11, 0.45)" strokeWidth="1.5" />

            {/* Dimensional 3D Star Emblem */}
            <path
              d="M32 17L36.3 25.8L46 27.2L39 34L40.7 43.6L32 39.1L23.3 43.6L25 34L18 27.2L27.7 25.8L32 17Z"
              fill="url(#goldGrad)"
              stroke="#FFFBEB"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* Score Metric Bars at the bottom */}
            <rect x="22" y="47" width="5" height="3" rx="1.5" fill="#FBBF24" opacity="0.7" />
            <rect x="29" y="45" width="6" height="5" rx="1.5" fill="#FBBF24" opacity="0.9" />
            <rect x="37" y="43" width="5" height="7" rx="1.5" fill="#F59E0B" />
          </svg>
        </div>
      );

    case 'ai':
      return (
        <div className="icon-badge-root icon-badge-emerald">
          <svg viewBox="0 0 64 64" fill="none" className="icon-badge-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="aiBg" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop stopColor="#062E20" />
                <stop offset="1" stopColor="#031710" />
              </linearGradient>
              <linearGradient id="mintGrad" x1="16" y1="14" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6EE7B7" />
                <stop offset="0.5" stopColor="#10B981" />
                <stop offset="1" stopColor="#059669" />
              </linearGradient>
              <filter id="glowEmerald" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Glowing Neural Ambient Aura */}
            <circle cx="32" cy="32" r="24" fill="#10B981" opacity="0.2" filter="url(#glowEmerald)" />

            {/* Outer Hex/Squircle Base */}
            <rect x="11" y="11" width="42" height="42" rx="12" fill="url(#aiBg)" stroke="rgba(16, 185, 129, 0.45)" strokeWidth="1.5" />

            {/* Quantum AI Sparkle Diamond Core */}
            <path
              d="M32 17C32 24.5 24.5 32 17 32C24.5 32 32 39.5 32 47C32 39.5 39.5 32 47 32C39.5 32 32 24.5 32 17Z"
              fill="url(#mintGrad)"
            />

            {/* Secondary Satellite Spark */}
            <path
              d="M44 19C44 21.5 41.5 24 39 24C41.5 24 44 26.5 44 29C44 26.5 46.5 24 49 24C46.5 24 44 21.5 44 19Z"
              fill="#A7F3D0"
            />

            {/* Center Core Light Pulse */}
            <circle cx="32" cy="32" r="3.5" fill="#FFFFFF" />
          </svg>
        </div>
      );

    default:
      return null;
  }
}

