import { NextResponse } from "next/server";
import {
  FALLBACK_SNAPSHOT,
  GitHubDay,
  GitHubSnapshot,
  LANG_COLORS,
  REPO_DESCRIPTIONS,
} from "@/lib/githubData";

const GITHUB_USER = "Rida1019-taki";
export const revalidate = 3600; // Cache live response for 1 hour

interface RawGitHubRepo {
  name: string;
  fork: boolean;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  html_url: string;
}

function parseContributions(html: string): { total: number; days: GitHubDay[] } {
  const totalMatch = html.match(/(\d[\d,]*)\s+contributions\s+in\s+the\s+last\s+year/);
  const total = totalMatch ? Number(totalMatch[1].replace(/,/g, "")) : 0;

  const tooltipCounts = new Map<string, number>();
  const tooltipRegex = /for="(contribution-day-component-[^"]+)"[^>]*>([^<]+)<\/tool-tip>/g;
  for (const match of html.matchAll(tooltipRegex)) {
    const [, id, text] = match;
    if (text.trim().startsWith("No contributions")) {
      tooltipCounts.set(id, 0);
    } else {
      const countMatch = text.match(/(\d+)\s+contribution/);
      tooltipCounts.set(id, countMatch ? Number(countMatch[1]) : 0);
    }
  }

  const days: GitHubDay[] = [];
  const cellRegex =
    /data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="(contribution-day-component-[^"]+)"[^>]*data-level="([0-4])"/g;
  for (const match of html.matchAll(cellRegex)) {
    const [, date, id, levelStr] = match;
    const level = Number(levelStr);
    days.push({
      date,
      level,
      count: tooltipCounts.get(id) ?? level * 2,
    });
  }

  if (days.length === 0) {
    const fallbackRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"/g;
    for (const match of html.matchAll(fallbackRegex)) {
      const level = Number(match[2]);
      days.push({ date: match[1], level, count: level * 2 });
    }
  }

  days.sort((a, b) => a.date.localeCompare(b.date));
  return { total, days };
}

export async function GET() {
  try {
    const headers = { "User-Agent": "ridataki-portfolio" };
    const [userRes, reposRes, contribRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`, {
        headers,
        next: { revalidate },
      }),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, {
        headers,
        next: { revalidate },
      }),
      fetch(`https://github.com/users/${GITHUB_USER}/contributions`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate },
      }),
    ]);

    if (!userRes.ok || !reposRes.ok) {
      return NextResponse.json(FALLBACK_SNAPSHOT);
    }

    const user = await userRes.json();
    const repos = (await reposRes.json()) as RawGitHubRepo[];
    const contribHtml = contribRes.ok ? await contribRes.text() : "";
    const parsed = contribHtml
      ? parseContributions(contribHtml)
      : { total: FALLBACK_SNAPSHOT.totalContributions, days: FALLBACK_SNAPSHOT.days };

    const ownRepos = repos.filter((r) => !r.fork);
    const langCounts = new Map<string, number>();
    let totalStars = 0;
    let totalForks = 0;

    for (const repo of ownRepos) {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      if (repo.language) {
        langCounts.set(repo.language, (langCounts.get(repo.language) || 0) + 1);
      }
    }

    const totalLangRepos = Array.from(langCounts.values()).reduce((a, b) => a + b, 0) || 1;
    const languages = Array.from(langCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        repos: count,
        percent: Math.round((count / totalLangRepos) * 100),
        color: LANG_COLORS[name] || "#D9A441",
      }));

    const repoMap = new Map(ownRepos.map((r) => [r.name, r]));
    const priorityNames = [
      "healthcare-web",
      "logitrack-api",
      "logitrack-frontend",
      "ebank-core-api",
      "expense-tracker-api",
      "SmartPatiens",
    ];
    const picked: RawGitHubRepo[] = [];
    for (const name of priorityNames) {
      const match = repoMap.get(name);
      if (match) picked.push(match);
    }
    for (const repo of ownRepos) {
      if (picked.length >= 4) break;
      if (!picked.some((p) => p.name === repo.name) && repo.language) {
        picked.push(repo);
      }
    }

    const featuredRepos = picked.slice(0, 4).map((repo) => ({
      name: repo.name,
      desc:
        repo.description ||
        REPO_DESCRIPTIONS[repo.name] ||
        `Projet ${repo.language || "Full Stack"} développé par Rida Taki.`,
      lang: repo.language || "Full Stack",
      color: LANG_COLORS[repo.language || ""] || "#D9A441",
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      pushedAt: (repo.pushed_at || "").slice(0, 10),
      url: repo.html_url,
    }));

    const days = parsed.days.length > 0 ? parsed.days : FALLBACK_SNAPSHOT.days;
    const livePayload: GitHubSnapshot = {
      username: GITHUB_USER,
      fetchedAt: user.updated_at || new Date().toISOString(),
      followers: user.followers ?? FALLBACK_SNAPSHOT.followers,
      publicRepos: user.public_repos ?? ownRepos.length,
      stars: totalStars,
      forks: totalForks,
      totalContributions:
        parsed.total || days.reduce((sum, d) => sum + d.count, 0) || FALLBACK_SNAPSHOT.totalContributions,
      from: days[0]?.date || FALLBACK_SNAPSHOT.from,
      to: days[days.length - 1]?.date || FALLBACK_SNAPSHOT.to,
      days,
      languages: languages.length > 0 ? languages : FALLBACK_SNAPSHOT.languages,
      featuredRepos: featuredRepos.length > 0 ? featuredRepos : FALLBACK_SNAPSHOT.featuredRepos,
      source: "live",
    };

    return NextResponse.json(livePayload);
  } catch {
    return NextResponse.json(FALLBACK_SNAPSHOT);
  }
}
