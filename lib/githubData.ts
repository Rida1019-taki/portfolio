import snapshotJson from "@/data/github-snapshot.json";

export interface GitHubDay {
  date: string;
  level: number;
  count: number;
}

export interface GitHubLanguage {
  name: string;
  repos: number;
  percent: number;
  color: string;
}

export interface GitHubRepoSummary {
  name: string;
  desc: string;
  lang: string;
  color: string;
  stars: number;
  forks: number;
  pushedAt: string;
  url: string;
}

export interface GitHubSnapshot {
  username: string;
  fetchedAt: string | null;
  followers: number;
  publicRepos: number;
  stars: number;
  forks: number;
  totalContributions: number;
  from: string;
  to: string;
  days: GitHubDay[];
  languages: GitHubLanguage[];
  featuredRepos: GitHubRepoSummary[];
  source?: "live" | "snapshot";
}

export const LANG_COLORS: Record<string, string> = {
  Java: "#E76F00",
  JavaScript: "#F7DF1E",
  TypeScript: "#3178C6",
  HTML: "#E34F26",
  CSS: "#563D7C",
  Kotlin: "#7F52FF",
  Python: "#3572A5",
  Dart: "#00B4AB",
  PHP: "#4F5D95",
};

export const REPO_DESCRIPTIONS: Record<string, string> = {
  "healthcare-web": "Frontend React de gestion hospitalière : patients, rendez-vous et dossiers sécurisés.",
  "logitrack-api": "Backend Spring Boot 3 & JWT RBAC pour le pilotage logistique et suivi des commandes.",
  "logitrack-frontend": "Interface React + Material UI temps réel avec Role Guards et graphiques KPI.",
  "ebank-core-api": "API bancaire cœur Java/Spring Boot avec gestion transactionnelle ACID et virements.",
  "expense-tracker-api": "Service REST Java Spring Boot pour suivi budgétaire, catégorisation et rapports.",
  "SmartPatiens": "Module intelligent de suivi patient et automatisation du parcours clinique.",
};

export const FALLBACK_SNAPSHOT: GitHubSnapshot = {
  ...(snapshotJson as GitHubSnapshot),
  featuredRepos: (snapshotJson.featuredRepos || []).map((repo) => ({
    ...repo,
    desc: REPO_DESCRIPTIONS[repo.name] || repo.desc,
  })),
  source: "snapshot",
};
