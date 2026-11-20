export const HUB = { id: 'hub', name: 'Hub', sub: 'Digital Solutions Hub', accent: '#1C5BDB' };

export const TOOLS = [];
export const T = { hub: HUB };
export const LIVE = [];

const TOOL_ICON_KEYS = {
  teamsphere: 'teamsphere',
  hat: 'hat',
  staffing: 'staffing',
  performance: 'performance',
  performanceevaluation: 'performance',
  capacitor: 'capacitor',
};

const toolIconKey = (name = '') =>
  TOOL_ICON_KEYS[String(name).toLowerCase().replace(/[^a-z0-9]/g, '')] || 'hub';

export const mapApiTools = (apiTools = []) =>
  apiTools.map((tool) => {
    const enabled = !!tool.is_product_live;
    const upcoming = !!tool.is_upcoming;
    return {
      id: `tool-${tool.id}`,
      apiId: tool.id,
      name: tool.name || 'Untitled tool',
      sub: upcoming ? 'Coming soon' : enabled ? 'Live tool' : 'Inactive',
      accent: '#1C5BDB',
      url: tool.link || '',
      manual: tool.user_guide_url || '',
      demo: tool.video_url || '',
      desc: tool.description || '',
      features: [],
      enabled,
      soon: upcoming,
      inactive: !enabled && !upcoming,
      iconKey: toolIconKey(tool.name),
      raw: tool,
    };
  });

export function setApiTools(apiTools = []) {
  const mapped = mapApiTools(apiTools);
  TOOLS.splice(0, TOOLS.length, ...mapped);
  Object.keys(T).forEach((key) => {
    if (key !== 'hub') delete T[key];
  });
  T.hub = HUB;
  mapped.forEach((tool) => {
    T[tool.id] = tool;
  });
  LIVE.splice(
    0,
    LIVE.length,
    ...mapped.filter((tool) => !tool.soon && !tool.inactive)
  );
  return mapped;
}

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
  [...posts].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0)
  );

const ANNOUNCEMENT_TYPES = {
  FEATURE_LAUNCH: 'Feature launch',
  UPDATE: 'Update',
  FIX: 'Fix',
  ANNOUNCEMENT: 'Announcement',
};

export const mapApiAnnouncements = (announcements = []) =>
  announcements.map((announcement) => ({
    id: String(announcement.id),
    ts: Date.parse(announcement.created_at || '') || 0,
    tool: announcement.tool ? `tool-${announcement.tool.id}` : 'hub',
    toolId: announcement.tool?.id || null,
    type: ANNOUNCEMENT_TYPES[announcement.type] || announcement.type,
    rawType: announcement.type,
    date: announcement.publish_date,
    author: announcement.posted_by?.name || 'Highspring',
    role: 'Highspring',
    title: announcement.title,
    summary: announcement.summary,
    body: String(announcement.description || '')
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    cover: announcement.image_url || null,
    doc: announcement.document_url
      ? { name: 'Announcement attachment', size: '' }
      : null,
    docURL: announcement.document_url || null,
    postedById: announcement.posted_by?.id,
    emailSubject: announcement.email_subject || '',
    cc: announcement.cc || [],
  }));
