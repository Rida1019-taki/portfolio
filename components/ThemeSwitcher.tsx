"use client";

import React, { useState, useRef, useEffect } from "react";
import { Palette, Check, Film } from "lucide-react";
import { PORTFOLIO_THEMES, ThemeId, useTheme } from "./ThemeProvider";
import { playClick, playPop } from "@/lib/sound";
import { toast } from "sonner";

export default function ThemeSwitcher() {
  const { theme, activeTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleSelect = (id: ThemeId, name: string) => {
    playClick();
    setTheme(id);
    setOpen(false);
    toast.success(`Thème activé : ${name}`, {
      description:
        id === "paper"
          ? "Mode clair givré actif — vidéo ambiante préservée en arrière-plan."
          : "Palette et étalonnage vidéo mis à jour.",
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          playPop();
          setOpen((prev) => !prev);
        }}
        aria-label="Changer de thème"
        aria-expanded={open}
        title="Changer de thème (:theme)"
        className="flex items-center gap-2 rounded-2xl bg-neutral-950/80 px-3 py-2.5 border border-white/10 text-xs font-mono font-bold text-gray-200 hover:border-[#D9A441]/50 hover:text-white backdrop-blur-2xl transition-all duration-300 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
      >
        <span
          className="h-2.5 w-2.5 rounded-full ring-2 ring-white/20 shrink-0"
          style={{ backgroundColor: activeTheme.accent }}
        />
        <span className="hidden xl:inline text-[11px] uppercase tracking-wider">
          :{activeTheme.short.toLowerCase()}
        </span>
        <Palette size={13} className="xl:hidden text-[#D9A441]" />
      </button>

      {open && (
        <div
          className="keep-dark absolute right-0 mt-2.5 w-72 rounded-2xl border border-white/15 bg-neutral-950/95 p-2 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
          role="menu"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
              :colorscheme ({PORTFOLIO_THEMES.length})
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <Film size={10} />
              <span>Vidéo active</span>
            </span>
          </div>

          <div className="space-y-1">
            {PORTFOLIO_THEMES.map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(item.id, item.name)}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/10 border border-white/15 text-white"
                      : "border border-transparent text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold truncate">
                        {item.name}
                      </span>
                      {item.isLight && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-mono text-amber-300">
                          Light
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex -space-x-1">
                      {item.palette.map((color, idx) => (
                        <span
                          key={idx}
                          className="h-3 w-3 rounded-full border border-black/60"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {isSelected && <Check size={13} className="text-emerald-400 ml-1" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 px-3 py-1 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>Astuce : tapez <code className="text-gray-300">:theme</code></span>
            <span>ou <code className="text-gray-300">⌘K</code></span>
          </div>
        </div>
      )}
    </div>
  );
}
