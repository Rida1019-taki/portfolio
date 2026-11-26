"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PORTFOLIO_THEMES, ThemeId, useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { LAB_SELECT_EVENT, LAB_TABS } from "./EngineeringLab";
import { playClick, playPop } from "@/lib/sound";

interface VimCommandBarProps {
  onOpenBooking: () => void;
}

const SECTION_ALIASES: Record<string, string> = {
  about: "about",
  whoami: "about",
  home: "about",
  now: "now",
  skills: "skills",
  stack: "skills",
  work: "work",
  projects: "work",
  projets: "work",
  lab: "lab",
  arch: "architecture",
  architecture: "architecture",
  api: "api-playground",
  playground: "api-playground",
  terminal: "terminal",
  term: "terminal",
  challenge: "challenge",
  bug: "challenge",
  exp: "experience",
  experience: "experience",
  github: "github-activity",
  git: "github-activity",
  education: "education",
  edu: "education",
  hackathons: "hackathons",
  cv: "resume",
  resume: "resume",
  contact: "contact",
  hire: "contact",
};

export default function VimCommandBar({ onOpenBooking }: VimCommandBarProps) {
  const { theme, setTheme } = useTheme();
  const { lang } = useLanguage();
  const fr = lang === "fr";
  const [command, setCommand] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const showStatus = useCallback((msg: string) => {
    setStatusMsg(msg);
    window.setTimeout(() => {
      setStatusMsg((curr) => (curr === msg ? "" : curr));
    }, 3200);
  }, []);

  const executeVimCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const parts = trimmed.split(/\s+/);
      const name = parts[0].toLowerCase();
      const arg = (parts[1] || "").toLowerCase();

      if (name === "q" || name === "q!" || name === "qa") {
        setCommand(null);
        return;
      }

      if (name === "help" || name === "?") {
        showStatus(
          fr
            ? "Cmds: :theme <obsidian|circuit|sora|amber|paper> · :e <work|lab|terminal|git|cv> · :hire"
            : "Cmds: :theme <obsidian|circuit|sora|amber|paper> · :e <work|lab|terminal|git|cv> · :hire"
        );
        return;
      }

      if (name === "theme" || name === "colorscheme" || name === "colo") {
        if (!arg) {
          showStatus(`:colorscheme ${theme}  (${PORTFOLIO_THEMES.map((t) => t.id).join(" | ")})`);
          return;
        }
        const matches = PORTFOLIO_THEMES.filter(
          (t) => t.id === arg || t.id.startsWith(arg) || t.name.toLowerCase().startsWith(arg)
        );
        if (matches.length === 1) {
          setTheme(matches[0].id as ThemeId);
          playPop();
          showStatus(`:colorscheme ${matches[0].id}`);
          return;
        }
        if (matches.length > 1) {
          showStatus(`E185: ${matches.map((m) => m.id).join(" · ")}`);
          return;
        }
        showStatus(`E185: Cannot find color scheme '${arg}'`);
        return;
      }

      const directTheme = PORTFOLIO_THEMES.find((t) => t.id === name);
      if (directTheme && !arg) {
        setTheme(directTheme.id as ThemeId);
        playPop();
        showStatus(`:colorscheme ${directTheme.id}`);
        return;
      }

      if (name === "book" || name === "call" || name === "meeting") {
        playPop();
        onOpenBooking();
        showStatus("-- OPENING BOOKING MODAL --");
        return;
      }

      const targetKey = name === "e" || name === "edit" || name === "cd" ? arg : name;
      const sectionId = SECTION_ALIASES[targetKey];
      if (sectionId) {
        if ((LAB_TABS as readonly string[]).includes(sectionId)) {
          playClick();
          window.dispatchEvent(new CustomEvent(LAB_SELECT_EVENT, { detail: sectionId }));
          document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" });
          showStatus(`~/ridataki/lab/${sectionId}`);
          return;
        }
        const el = document.getElementById(sectionId);
        if (el) {
          playClick();
          el.scrollIntoView({ behavior: "smooth" });
          showStatus(`~/ridataki/${sectionId}`);
          return;
        }
      }

      showStatus(`E492: Not an editor command: ${trimmed}`);
    },
    [fr, onOpenBooking, setTheme, showStatus, theme]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const insideInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable ||
          Boolean(target.closest("[cmdk-dialog], [role='dialog']")));

      if (command !== null) {
        if (e.key === "Escape") {
          e.preventDefault();
          setCommand(null);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const cmd = command;
          setCommand(null);
          executeVimCommand(cmd);
          return;
        }
        if (e.key === "Backspace") {
          e.preventDefault();
          setCommand((prev) => (prev && prev.length > 0 ? prev.slice(0, -1) : null));
          return;
        }
        if (e.key.length === 1) {
          e.preventDefault();
          setCommand((prev) => (prev ?? "") + e.key);
        }
        return;
      }

      if (insideInput) return;

      if (e.key === ":") {
        e.preventDefault();
        playPop();
        setCommand("");
        return;
      }

      if (e.key === "j") {
        window.scrollBy({ top: 140, behavior: "smooth" });
      } else if (e.key === "k") {
        window.scrollBy({ top: -140, behavior: "smooth" });
      } else if (e.key === "g") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (e.key === "G") {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [command, executeVimCommand]);

  if (command === null && !statusMsg) return null;

  return (
    <div className="keep-dark fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,540px)] animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#D9A441]/50 bg-neutral-950/95 px-4 py-2.5 font-mono text-xs text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        {command !== null ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="rounded bg-[#D9A441] px-1.5 py-0.5 text-[10px] font-bold text-black shrink-0">
              CMD
            </span>
            <span className="text-[#D9A441] font-bold">:</span>
            <span className="text-white truncate">{command}</span>
            <span className="inline-block h-3.5 w-1.5 bg-[#D9A441] animate-pulse shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
              VIM
            </span>
            <span className="text-gray-200 truncate">{statusMsg}</span>
          </div>
        )}

        <span className="text-[10px] text-gray-500 shrink-0 hidden sm:inline">
          {command !== null ? "Enter · Esc" : `:${theme}`}
        </span>
      </div>
    </div>
  );
}
