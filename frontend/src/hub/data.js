export const TOOLS = [
  {
    id: 'teamsphere',
    name: 'TeamSphere',
    sub: 'Projects and people',
    accent: '#0F9A6C',
    url: 'https://example.com/teamsphere',
    manual: 'https://example.com/teamsphere/manual',
    demo: 'https://example.com/teamsphere/demo',
    desc: 'Plan projects, allocate people across business units and keep PMO reporting in one place.',
    features: ['Role-based views', 'Business-unit access', 'Resource allocation'],
  },
  {
    id: 'hat',
    name: 'HAT',
    sub: 'Recruitment',
    accent: '#2459E0',
    isNew: 'Graduate & early-career hiring',
    url: 'https://hiring.hipulse.in/login',
    manual:
      'https://docs.google.com/document/d/1XUF1lr3G7PU6oZHXtH2uwxxf-MT_vQaREj1mzbJpFNw/edit?tab=t.0#heading=h.qevzwlb86ous',
    demo: 'https://hiring.hipulse.in/login',
    desc: 'Run standardized candidate evaluations, technical skill assessments and competency benchmarking.',
    features: ['Standardized rubrics', 'Blind evaluation workflows', 'Automated competency scoring'],
  },
  {
    id: 'staffing',
    name: 'Staffing',
    sub: 'Interview scheduling',
    accent: '#0A8FC4',
    url: 'https://staffing.hipulse.in/#interviews',
    manual:
      'https://docs.google.com/document/d/1PACeEnQhRby6JBj6Dytiuts6x3srSEVoJq4NjDKpJsk/edit?pli=1&tab=t.zg5um7asnpzz#heading=h.xw8pywpyke42',
    demo: 'https://drive.google.com/file/d/1EjL_MMaPge8y72exZOnwdYz4Z-bn4Gd7/view?usp=sharing',
    desc: 'Automate panel availability, candidate invitations and calendar sync across global hiring pipelines.',
    features: ['Multi-panel coordination', 'Outlook & Google Calendar sync', 'Automated candidate reminders'],
  },
  {
    id: 'performance',
    name: 'Performance Evaluation',
    sub: 'Scoring',
    accent: '#D86C0A',
    url: 'https://eval.hipulse.in/login',
    manual:
      'https://docs.google.com/document/d/1rzr9tf8UXMWMdq1r9Uz93TtNe7wuDuM_OzNAUcaCb-w/edit?tab=t.0#heading=h.8yvjavk1ga4p',
    demo: 'https://drive.google.com/file/d/1mS9BH8VnDrJy3TuKSmPMgocRhwOozDNp/view?usp=drive_link',
    desc: 'Aggregate scores, normalize panel feedback and speed up consensus meetings with automated scorecards.',
    features: ['Bias mitigation', 'Automated consensus reports', 'Instant scorecard compilation'],
  },
  {
    id: 'capacitor',
    name: 'Capacitor',
    sub: 'Coming soon',
    accent: '#5B6F93',
    soon: true,
    desc: 'A new Highspring tool, launching soon on the hub. Turn on a launch alert to hear first.',
    features: ['Same login as every other tool', 'Launch alert by email'],
  },
];

export const HUB = { id: 'hub', name: 'Hub', sub: 'Digital Solutions Hub', accent: '#1C5BDB' };

export const T = Object.fromEntries([...TOOLS, HUB].map((t) => [t.id, t]));

export const LIVE = TOOLS.filter((t) => !t.soon);

export const DEMO_USER = {
  email: 'rahul.mehta@highspring.demo',
  pass: 'Hire@2026',
  name: 'Rahul Mehta',
  role: 'Hiring manager',
  canPost: true,
  access: ['teamsphere', 'hat', 'performance'],
};

export const SEED = [
  {
    id: 'u5',
    tool: 'hat',
    type: 'Feature launch',
    date: '2026-11-03',
    author: 'Product team',
    title: 'Graduate & early-career hiring is live in HAT',
    summary:
      'Campus and early-career hiring now has its own track, with rubrics built for first-time candidates.',
    body: [
      'HAT now supports graduate and early-career hiring as its own track. Recruiters can set up campus drives with rubrics designed for candidates who are new to the workforce.',
      'Interviewers score against the same standardized criteria as experienced hires, and blind evaluation stays on by default.',
      '[Add rollout details, links and who to contact.]',
    ],
  },
  {
    id: 'u4',
    tool: 'hub',
    type: 'Update',
    date: '2026-10-27',
    author: 'Product team',
    title: 'One login for every Highspring tool',
    summary:
      'Log in once on the hub and move between TeamSphere, HAT, Staffing and Performance Evaluation.',
    body: [
      'The Digital Solutions Hub now has a single login. Sign in once and every tool your role includes opens without asking you to sign in again.',
      'Tools your role doesn’t include show a lock, with a button to request access from your admin.',
    ],
  },
  {
    id: 'u3',
    tool: 'teamsphere',
    type: 'Feature launch',
    date: '2026-10-20',
    author: 'Product team',
    title: 'Role-based views in TeamSphere',
    summary: 'PMO, managers, account managers and ICs each get a workspace built for their job.',
    body: [
      'TeamSphere now opens on a view built for your role. PMO sees portfolio health, managers see their team’s allocation, account managers see their accounts, and ICs see their own projects.',
      'Business-unit data unlocks with the BU code, so one PMO role works across business units.',
    ],
  },
  {
    id: 'u2',
    tool: 'capacitor',
    type: 'Announcement',
    date: '2026-10-09',
    author: 'Product team',
    title: 'Capacitor is coming to the hub',
    summary: 'A new tool is joining the hub. Turn on a launch alert from its card to hear first.',
    body: [
      'Capacitor is the next tool joining the Digital Solutions Hub. It will use the same login as every other tool.',
      '[Add what Capacitor does and the expected launch window.]',
    ],
  },
  {
    id: 'u1',
    tool: 'staffing',
    type: 'Update',
    date: '2026-09-22',
    author: 'Product team',
    title: 'Calendar sync for Outlook and Google Calendar',
    summary: 'Interview invites now land in every panelist’s calendar automatically.',
    body: [
      'Staffing now syncs with both Outlook and Google Calendar. When a slot is confirmed, invites go out to every panelist and the candidate at once.',
      'Reschedules update everyone’s calendar, and candidates get a reminder before each round.',
    ],
  },
];

export const SLOTS = [
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

export const initials = (n = '') =>
  n
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

export const first = (n = '') => n.split(' ')[0];

export const iso = (d) =>
  d.getFullYear() +
  '-' +
  String(d.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(d.getDate()).padStart(2, '0');

export const pd = (s) => new Date(s + 'T00:00:00');

export const fmt = (s) =>
  pd(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const monthKey = (s) => pd(s).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export const t12 = (s) => {
  let [h, m] = s.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

export const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export const allUpdates = (posts = []) =>
  [...posts, ...SEED].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0)
  );
