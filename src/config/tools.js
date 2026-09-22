/**
 * ============================================================================
 * HIGHSPRING DIGITAL SOLUTIONS HUB - TOOL & MANUAL CONFIGURATION
 * ============================================================================
 */

export const TOOL_URLS = {
  // 1. Staffing Solution - Interview
  INTERVIEW: "https://staffing.hipulse.in/#interviews",

  // 2. Recruitment Solution - HAT
  HAT: "https://hiring.hipulse.in/login",

  // 3. Performance Evaluation Solution - Rating
  RATING: "https://eval.hipulse.in/login",
};

export const USER_MANUALS = {
  HAT: {
    name: "Highspring Assessment Portal TA/QA User Guide",
    shortName: "HAT User Manual",
    url: "https://docs.google.com/document/d/1XUF1lr3G7PU6oZHXtH2uwxxf-MT_vQaREj1mzbJpFNw/edit?tab=t.0#heading=h.qevzwlb86ous",
  },
  // Backward-compatible aliases used by the in-app assistant.
  INTERVIEW_SCHEDULING: {
    name: "Highspring Assessment Portal TA/QA User Guide",
    shortName: "HAT User Manual",
    url: "https://docs.google.com/document/d/1XUF1lr3G7PU6oZHXtH2uwxxf-MT_vQaREj1mzbJpFNw/edit?tab=t.0#heading=h.qevzwlb86ous",
  },
  RATING_AUTOMATION: {
    name: "Highspring Assessment Portal TA/QA User Guide",
    shortName: "HAT User Manual",
    url: "https://docs.google.com/document/d/1XUF1lr3G7PU6oZHXtH2uwxxf-MT_vQaREj1mzbJpFNw/edit?tab=t.0#heading=h.qevzwlb86ous",
  },
};

/**
 * Detailed metadata and presentation configuration for the three core tools.
 */
export const TOOLS = [
  {
    id: "interview",
    name: "Staffing Solution",
    badge: "Talent Operations",
    tagline: "Candidate Coordination & Calendar Sync",
    purpose: "Coordinate candidate schedules and hiring workflows.",
    description:
      "Automates panel availability, candidate invitation workflows, and calendar synchronization across global hiring pipelines.",
    iconType: "calendar",
    url: TOOL_URLS.INTERVIEW,
    manualUrl: "https://docs.google.com/document/d/1PACeEnQhRby6JBj6Dytiuts6x3srSEVoJq4NjDKpJsk/edit?pli=1&tab=t.zg5um7asnpzz#heading=h.xw8pywpyke42",
    manualName: "Staffing Solution User Manual",
    videoUrl: "https://drive.google.com/file/d/1EjL_MMaPge8y72exZOnwdYz4Z-bn4Gd7/view?usp=sharing",
    openInNewTab: false,
    status: "Active System",
    category: "Talent Acquisition",
    themeKey: "cyan",
    accent: {
      primary: "#38BDF8",
      secondary: "#0284C7",
      glow: "rgba(56, 189, 248, 0.22)",
      border: "rgba(56, 189, 248, 0.3)",
      gradient: "linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)",
    },
    capabilities: [
      "Multi-panel coordination",
      "Outlook & Google Calendar sync",
      "Automated candidate reminders",
    ],
  },
  {
    id: "hat",
    name: "Recruitment Solution",
    badge: "Evaluation Engine",
    tagline: "Competency Scoring & Skills Testing",
    purpose: "Recruit interns and entry-level engineers with structured assessments.",
    description:
      "Conducts standardized candidate evaluations, technical skill assessments, and comprehensive competency benchmarking for hiring decisions.",
    iconType: "assessment",
    url: TOOL_URLS.HAT,
    manualUrl: USER_MANUALS.HAT.url,
    manualName: USER_MANUALS.HAT.shortName,
    isNew: true,
    newLabel: "Graduate & early-career hiring",
    openInNewTab: false,
    status: "Active System",
    category: "Candidate Evaluation",
    themeKey: "indigo",
    accent: {
      primary: "#818CF8",
      secondary: "#6366F1",
      glow: "rgba(129, 140, 248, 0.22)",
      border: "rgba(129, 140, 248, 0.3)",
      gradient: "linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)",
    },
    capabilities: [
      "Standardized rubrics",
      "Blind evaluation workflows",
      "Automated competency scoring",
    ],
  },
  {
    id: "rating",
    name: "Performance Evaluation Solution",
    badge: "Scoring Automation",
    tagline: "Score Normalization",
    purpose: "Automate candidate evaluation workflows.",
    description:
      "Streamlines scoring aggregation, normalizes panel feedback, and accelerates consensus meetings with automated scorecards.",
    iconType: "rating",
    url: TOOL_URLS.RATING,
    manualUrl: USER_MANUALS.RATING_AUTOMATION.url,
    manualName: "Performance Evaluation User Manual",
    videoUrl: "https://drive.google.com/file/d/1mS9BH8VnDrJy3TuKSmPMgocRhwOozDNp/view?usp=drive_link",
    openInNewTab: false,
    status: "Active System",
    category: "Workflow Automation",
    themeKey: "amber",
    accent: {
      primary: "#F59E0B",
      secondary: "#D97706",
      glow: "rgba(245, 158, 11, 0.22)",
      border: "rgba(245, 158, 11, 0.3)",
      gradient: "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)",
    },
    capabilities: [
      "Bias mitigation",
      "Automated consensus reports",
      "Instant scorecard compilation",
    ],
  },
];
