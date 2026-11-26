"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaGithub, FaStar, FaCodeBranch } from "react-icons/fa";
import { ExternalLink, GitCommit, Flame, Play, RotateCcw, Radio } from "lucide-react";
import { playClick, playPop } from "@/lib/sound";
import { useLanguage } from "@/components/LanguageProvider";
import { FALLBACK_SNAPSHOT, GitHubDay, GitHubSnapshot } from "@/lib/githubData";

const GAUGE_CELLS = 14;
const MONTHS_FR = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildAsciiGauge(percent: number) {
  const filled = percent > 0 ? Math.max(1, Math.min(GAUGE_CELLS, Math.round((percent / 100) * GAUGE_CELLS))) : 0;
  return {
    on: "█".repeat(filled),
    off: "░".repeat(GAUGE_CELLS - filled),
  };
}

function computeStreak(days: GitHubDay[]): number {
  if (!days.length) return 0;
  let i = days.length - 1;
  if (days[i].count === 0 && i > 0) i--;
  let current = 0;
  while (i >= 0 && days[i].count > 0) {
    current++;
    i--;
  }
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  return current > 0 ? current : longest;
}

export default function GitHubStats() {
  const { lang } = useLanguage();
  const fr = lang === "fr";

  const [data, setData] = useState<GitHubSnapshot>(FALLBACK_SNAPSHOT);
  const [hoveredDay, setHoveredDay] = useState<GitHubDay | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(FALLBACK_SNAPSHOT.days.length);
  const [activeMonthLabel, setActiveMonthLabel] = useState<string>("");
  const replayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/github")
      .then((res) => (res.ok ? res.json() : null))
      .then((live: GitHubSnapshot | null) => {
        if (!active || !live || !Array.isArray(live.days) || live.days.length === 0) return;
        setData(live);
        setVisibleCount(live.days.length);
      })
      .catch(() => {});

    return () => {
      active = false;
      if (replayTimerRef.current) window.clearTimeout(replayTimerRef.current);
    };
  }, []);

  const githubUrl = `https://github.com/${data.username}`;
  const monthsArr = fr ? MONTHS_FR : MONTHS_EN;

  const { columns, monthSteps } = useMemo(() => {
    const days = data.days || [];
    if (!days.length) return { columns: [], monthSteps: [] };

    const firstDate = new Date(`${days[0].date}T00:00:00Z`);
    const leadingBlanks = firstDate.getUTCDay();
    const padded: (GitHubDay | null)[] = [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...days,
    ];

    const cols: { cells: { day: GitHubDay | null; flatIdx: number }[]; monthLabel?: string }[] = [];
    const seenMonths = new Set<string>();

    for (let i = 0; i < padded.length; i += 7) {
      const slice = padded.slice(i, i + 7);
      const cells = slice.map((day, offset) => ({
        day,
        flatIdx: i + offset - leadingBlanks,
      }));
      const firstReal = slice.find(Boolean);
      let monthLabel: string | undefined;
      if (firstReal) {
        const ym = firstReal.date.slice(0, 7);
        if (!seenMonths.has(ym)) {
          seenMonths.add(ym);
          monthLabel = monthsArr[new Date(`${firstReal.date}T00:00:00Z`).getUTCMonth()];
        }
      }
      cols.push({ cells, monthLabel });
    }

    const steps: { month: string; endIndex: number; commits: number }[] = [];
    days.forEach((d, idx) => {
      const ym = d.date.slice(0, 7);
      const last = steps[steps.length - 1];
      if (!last || last.month !== ym) {
        steps.push({ month: ym, endIndex: idx + 1, commits: d.count });
      } else {
        last.endIndex = idx + 1;
        last.commits += d.count;
      }
    });

    return { columns: cols, monthSteps: steps };
  }, [data.days, monthsArr]);

  const startReplay = () => {
    playPop();
    if (replayTimerRef.current) window.clearTimeout(replayTimerRef.current);
    setReplaying(true);
    setVisibleCount(0);

    let stepIdx = 0;
    const tick = () => {
      if (stepIdx >= monthSteps.length) {
        setVisibleCount(data.days.length);
        setActiveMonthLabel(
          fr
            ? `// terminé · ${monthSteps.length} mois · ${data.totalContributions} contributions`
            : `// done · ${monthSteps.length} months · ${data.totalContributions} contributions`
        );
        setReplaying(false);
        return;
      }
      const step = monthSteps[stepIdx];
      setVisibleCount(step.endIndex);
      setActiveMonthLabel(`renderMonth("${step.month}", { commits: ${step.commits} });`);
      stepIdx++;
      replayTimerRef.current = window.setTimeout(tick, 210);
    };

    tick();
  };

  const resetHeatmap = () => {
    playClick();
    if (replayTimerRef.current) window.clearTimeout(replayTimerRef.current);
    setReplaying(false);
    setVisibleCount(data.days.length);
    setActiveMonthLabel("");
  };

  const getCellColor = (level: number, visible: boolean) => {
    if (!visible) return "bg-white/[0.03] opacity-25";
    switch (level) {
      case 4:
        return "bg-[#D9A441] shadow-[0_0_8px_rgba(217,164,65,0.65)]";
      case 3:
        return "bg-[#10B981]";
      case 2:
        return "bg-[#10B981]/65";
      case 1:
        return "bg-white/25";
      default:
        return "bg-white/[0.06]";
    }
  };

  const streakDays = useMemo(() => computeStreak(data.days), [data.days]);
  const primaryLang =
    data.languages.find((l) => l.name === "Java") || data.languages[0] || { name: "Java", percent: 34 };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-4 sm:p-6 lg:p-8 backdrop-blur-2xl shadow-2xl space-y-6 min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white shadow-lg">
            <FaGithub size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white font-mono">
                @{data.username}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
                <Radio size={10} className={data.source === "live" ? "animate-pulse" : ""} />
                <span>{data.source === "live" ? "Live GitHub Sync" : "GitHub Snapshot"}</span>
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              {fr
                ? `Données publiques réelles synchronisées depuis github.com/${data.username}`
                : `Real public stats synced from github.com/${data.username}`}
            </p>
          </div>
        </div>

        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playClick()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-mono font-semibold text-white transition-all duration-300 hover:border-[#D9A441] hover:bg-[#D9A441]/10 hover:text-[#D9A441] cursor-pointer"
        >
          <span>{fr ? "Voir le Profil GitHub" : "View GitHub Profile"}</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Metrics Row (Verified Real GitHub Stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 font-mono">
          <div className="text-[11px] text-gray-400 uppercase tracking-wider">
            {fr ? "Contributions (1 an)" : "Contributions (1 yr)"}
          </div>
          <div className="text-2xl font-bold text-white mt-1">{data.totalContributions}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            {data.from} → {data.to}
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 font-mono">
          <div className="text-[11px] text-gray-400 uppercase tracking-wider">
            {fr ? "Dépôts Publics" : "Public Repos"}
          </div>
          <div className="text-2xl font-bold text-white mt-1">{data.publicRepos}</div>
          <div className="text-[10px] text-[#D9A441] mt-0.5">
            {data.followers} {fr ? "abonnés" : "followers"} · {data.stars} ★
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 font-mono">
          <div className="text-[11px] text-gray-400 uppercase tracking-wider">
            {fr ? "Série / Record" : "Streak"}
          </div>
          <div className="text-2xl font-bold text-white mt-1 flex items-center gap-1.5">
            <span>
              {streakDays} {fr ? "jours" : "days"}
            </span>
            <Flame size={16} className="text-amber-500" />
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {fr ? "Activité vérifiée" : "Verified activity"}
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 font-mono">
          <div className="text-[11px] text-gray-400 uppercase tracking-wider">
            {fr ? "Langage Phare" : "Top Language"}
          </div>
          <div className="text-2xl font-bold text-[#D9A441] mt-1">{primaryLang.name}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {primaryLang.percent}% {fr ? "des repos typés" : "of typed repos"}
          </div>
        </div>
      </div>

      {/* Contribution Heatmap Card + Month Replay Animation */}
      <div className="keep-dark rounded-2xl border border-white/10 bg-black/70 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono text-gray-400">
          <div className="flex flex-wrap items-center gap-2.5">
            <GitCommit size={14} className="text-[#D9A441]" />
            <span className="font-semibold text-white">
              {fr
                ? `Graphique de Contributions (${data.totalContributions})`
                : `Contribution Graph (${data.totalContributions})`}
            </span>
            <button
              type="button"
              onClick={replaying ? resetHeatmap : startReplay}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-mono text-gray-200 hover:border-[#D9A441] hover:text-[#D9A441] transition-colors cursor-pointer"
            >
              {replaying ? (
                <>
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </>
              ) : (
                <>
                  <Play size={10} />
                  <span>Replay renderMonth()</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px]">
            <span>{fr ? "Moins" : "Less"}</span>
            <span className="h-2.5 w-2.5 rounded-sm bg-white/5" />
            <span className="h-2.5 w-2.5 rounded-sm bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]/65" />
            <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" />
            <span className="h-2.5 w-2.5 rounded-sm bg-[#D9A441]" />
            <span>{fr ? "Plus" : "More"}</span>
          </div>
        </div>

        {/* Live Telemetry Line */}
        <div className="min-h-[20px] flex items-center justify-between text-[11px] font-mono text-gray-400 border-b border-white/5 pb-2">
          <span className="truncate text-[#D9A441]">
            {hoveredDay
              ? `${hoveredDay.date} · ${hoveredDay.count} contribution${hoveredDay.count === 1 ? "" : "s"}`
              : activeMonthLabel ||
                `$ node calendar.mjs ${data.from.slice(0, 4)} // ${
                  fr ? "Survolez une case ou lancez Replay" : "Hover a cell or click Replay"
                }`}
          </span>
        </div>

        {/* Real 52-Week Calendar Grid */}
        <div className="overflow-x-auto pb-2 -mx-1 px-1 touch-pan-x">
          <div className="inline-flex flex-col gap-1 min-w-full">
            <div className="inline-flex gap-1 text-[9px] font-mono text-gray-500 h-3.5">
              {columns.map((col, wIdx) => (
                <div key={wIdx} className="w-2.5 shrink-0 relative">
                  {col.monthLabel && (
                    <span className="absolute left-0 top-0 whitespace-nowrap capitalize">
                      {col.monthLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="inline-flex gap-1">
              {columns.map((col, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {col.cells.map(({ day, flatIdx }, dIdx) =>
                    day ? (
                      <div
                        key={day.date}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={`${day.date} : ${day.count} contribution(s)`}
                        className={`h-2.5 w-2.5 rounded-[2px] transition-all duration-150 hover:scale-125 ${getCellColor(
                          day.level,
                          flatIdx < visibleCount
                        )}`}
                      />
                    ) : (
                      <div key={`pad-${wIdx}-${dIdx}`} className="h-2.5 w-2.5" />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal ASCII Stack Gauges + Visual Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-gray-400">
          <span>{fr ? "Distribution des Langages (Jauges ASCII)" : "Language Distribution (ASCII Gauges)"}</span>
          <span className="text-[10px] text-gray-500">
            {fr
              ? `Calculé sur les ${data.publicRepos} dépôts GitHub de @${data.username}`
              : `Computed across @${data.username}'s ${data.publicRepos} GitHub repos`}
          </span>
        </div>

        {/* Multi-segmented bar */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          {data.languages.map((langItem) => (
            <div
              key={langItem.name}
              style={{ width: `${langItem.percent}%`, backgroundColor: langItem.color }}
              title={`${langItem.name}: ${langItem.percent}% (${langItem.repos} repos)`}
              className="h-full transition-all duration-500"
            />
          ))}
        </div>

        {/* ASCII Gauges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {data.languages.map((langItem) => {
            const g = buildAsciiGauge(langItem.percent);
            return (
              <div
                key={langItem.name}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: langItem.color }}
                  />
                  <span className="text-gray-200 font-semibold truncate">{langItem.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[11px]">
                  <span className="tracking-tighter">
                    <span className="text-[#D9A441]">{g.on}</span>
                    <span className="text-gray-600">{g.off}</span>
                  </span>
                  <span className="text-gray-400 w-9 text-right">{langItem.percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Featured Repositories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {data.featuredRepos.map((repo) => (
          <a
            key={repo.name}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playClick()}
            className="group rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-[#D9A441]/40 hover:bg-white/[0.04] flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold font-mono text-white group-hover:text-[#D9A441] transition-colors truncate">
                  {repo.name}
                </span>
                <ExternalLink size={12} className="text-gray-500 group-hover:text-white shrink-0 transition-colors" />
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                {repo.desc}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: repo.color }} />
                <span>{repo.lang}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <FaStar size={11} className="text-[#D9A441]" />
                  <span>{repo.stars}</span>
                </span>
                <span className="flex items-center gap-1">
                  <FaCodeBranch size={10} className="text-gray-500" />
                  <span>{repo.forks}</span>
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
