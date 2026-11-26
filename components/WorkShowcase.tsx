"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Tilt from "react-parallax-tilt";
import {
  ArrowUpRight,
  Sparkles,
  Server,
  ShieldCheck,
  Database,
  Cpu,
  CheckCircle2,
  Code2,
  Layout,
  Gauge,
  ScanLine,
  X,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { playClick, playPop } from "@/lib/sound";
import { useLanguage } from "@/components/LanguageProvider";
import ProjectXrayImage from "./ProjectXrayImage";

export interface ProjectItem {
  id: string;
  name: string;
  domain: string;
  subtitle: string;
  description: string;
  image: string;
  accent: string;
  githubBackend?: string;
  githubFrontend?: string;
  github?: string;
  tags: string[];
  specs?: { label: string; value: string }[];
  highlights?: string[];
}

interface WorkShowcaseProps {
  projects: ProjectItem[];
  t: {
    badge: string;
    title1: string;
    title2: string;
    desc: string;
    btnBackend: string;
    btnFrontend: string;
    btnRepo: string;
  };
}

export default function WorkShowcase({ projects, t }: WorkShowcaseProps) {
  const { lang } = useLanguage();
  const fr = lang === "fr";
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeTabs, setActiveTabs] = useState<Record<string, "preview" | "specs" | "highlights">>({
    healthcare: "preview",
    logitrack: "preview",
    fleetflow: "preview",
  });
  const [xrayMap, setXrayMap] = useState<Record<string, boolean>>({});
  const [lightboxProject, setLightboxProject] = useState<ProjectItem | null>(null);
  const [lightboxXray, setLightboxXray] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxProject) setLightboxProject(null);
        else setXrayMap({});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxProject]);

  useEffect(() => {
    if (!lightboxProject) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxProject]);

  const toggleXray = (projectId: string) => {
    playPop();
    setXrayMap((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const filteredProjects =
    activeFilter === "all"
      ? projects
      : projects.filter((p) => p.id === activeFilter);

  const setTab = (projectId: string, tab: "preview" | "specs" | "highlights") => {
    playPop();
    setActiveTabs((prev) => ({ ...prev, [projectId]: tab }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div className="w-full space-y-10">
      {/* ═══ 1. PROJECT FILTER TABS ═══ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => {
            playClick();
            setActiveFilter("all");
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-medium transition-all duration-300 cursor-pointer ${
            activeFilter === "all"
              ? "border border-[#D9A441] bg-[#D9A441]/15 text-white shadow-[0_0_20px_rgba(217,164,65,0.25)]"
              : "border border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white"
          }`}
        >
          <Sparkles size={12} className={activeFilter === "all" ? "text-[#D9A441]" : ""} />
          <span>{fr ? "Tous les Projets" : "All Projects"}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300">
            {projects.length}
          </span>
        </button>

        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              playClick();
              setActiveFilter(p.id);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-medium transition-all duration-300 cursor-pointer ${
              activeFilter === p.id
                ? "border border-[#D9A441] bg-[#D9A441]/15 text-white shadow-[0_0_20px_rgba(217,164,65,0.25)]"
                : "border border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.accent }}
            />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* ═══ 2. BENTO PROJECTS GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {filteredProjects.map((project) => {
          const isHero = project.id === "healthcare" && activeFilter === "all";
          const currentTab = activeTabs[project.id] || "preview";

          return (
            <div
              key={project.id}
              className={`${isHero ? "lg:col-span-12" : "lg:col-span-6"} h-full`}
            >
              <Tilt
                tiltMaxAngleX={3}
                tiltMaxAngleY={3}
                perspective={1400}
                glareEnable={false}
                className="h-full rounded-3xl"
              >
                <div
                  onMouseMove={handleMouseMove}
                  className="group relative h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent p-[1.5px] transition-all duration-500 hover:border-white/25 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
                  style={
                    {
                      "--mouse-x": "0px",
                      "--mouse-y": "0px",
                    } as React.CSSProperties
                  }
                >
                  {/* Spotlight Radial Glow on Hover */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-xl"
                    style={{
                      background: `radial-gradient(450px circle at var(--mouse-x) var(--mouse-y), ${project.accent}35, transparent 65%)`,
                    }}
                  />

                  <div className="relative h-full rounded-[23px] bg-neutral-950/90 p-6 sm:p-8 lg:p-9 backdrop-blur-2xl flex flex-col justify-between overflow-hidden">
                    {/* Top Status & View Selector Ribbon */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="font-mono text-xs font-bold border px-3 py-1 rounded-full flex items-center gap-1.5"
                          style={{
                            color: project.accent,
                            borderColor: `${project.accent}50`,
                            backgroundColor: `${project.accent}15`,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: project.accent }}
                          />
                          {project.id === "healthcare"
                            ? fr ? "01 • PROJET PHARE" : "01 • FLAGSHIP PROJECT"
                            : project.id === "logitrack"
                            ? fr ? "02 • LOGISTIQUE" : "02 • LOGISTICS"
                            : fr ? "03 • GESTION PARC" : "03 • FLEET MANAGEMENT"}
                        </span>
                        <span className="text-xs font-mono uppercase tracking-wider text-white/50 hidden sm:inline">
                          {project.domain}
                        </span>
                      </div>

                      {/* Interactive Card View Tabs */}
                      <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-1 text-[11px] font-mono">
                        <button
                          type="button"
                          onClick={() => setTab(project.id, "preview")}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                            currentTab === "preview"
                              ? "bg-white/15 text-white font-semibold shadow"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <Layout size={11} />
                          <span>{fr ? "Aperçu" : "Preview"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab(project.id, "specs")}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                            currentTab === "specs"
                              ? "bg-white/15 text-white font-semibold shadow"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <Cpu size={11} />
                          <span>Specs</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab(project.id, "highlights")}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                            currentTab === "highlights"
                              ? "bg-white/15 text-white font-semibold shadow"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <Gauge size={11} />
                          <span>Impact</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Content Based on Active Tab */}
                    {currentTab === "preview" ? (
                      /* ─── TAB 1: PREVIEW (Visual + Story) ─── */
                      <div
                        className={
                          isHero
                            ? "grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"
                            : "space-y-6"
                        }
                      >
                        {/* Information Column */}
                        <div className={isHero ? "lg:col-span-5 space-y-4" : "space-y-4"}>
                          <div>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                              {project.name}
                            </h3>
                            <p className="text-xs sm:text-sm font-mono text-[#D9A441] font-semibold mt-1">
                              {project.subtitle}
                            </p>
                          </div>

                          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
                            {project.description}
                          </p>

                          {/* Tech Pills */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-mono text-gray-300 transition-colors hover:border-white/20"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Visual Safari Browser Mockup Column */}
                        <div className={isHero ? "lg:col-span-7" : "pt-2"}>
                          <div className="keep-dark relative rounded-2xl border border-white/15 bg-neutral-950 p-2 sm:p-2.5 shadow-2xl transition-all duration-500 group-hover:border-white/30">
                            {/* Window Chrome Header */}
                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 mb-2 gap-2">
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                              </div>
                              <span className="text-[10px] font-mono text-gray-400 truncate">
                                {project.name.toLowerCase()}.ridataki.dev
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleXray(project.id)}
                                  title={fr ? "Inspecter les contours wireframe (Sobel X-Ray)" : "Inspect wireframe edges (Sobel X-Ray)"}
                                  aria-pressed={Boolean(xrayMap[project.id])}
                                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-mono transition-all cursor-pointer ${
                                    xrayMap[project.id]
                                      ? "border-[#D9A441] bg-[#D9A441]/20 text-[#D9A441] font-bold shadow-[0_0_12px_rgba(217,164,65,0.35)]"
                                      : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white"
                                  }`}
                                >
                                  <ScanLine size={10} />
                                  <span>X-Ray</span>
                                </button>
                                <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  {fr ? "En ligne" : "Online"}
                                </span>
                              </div>
                            </div>

                            {/* Interactive Sobel X-Ray Image Frame */}
                            <ProjectXrayImage
                              src={project.image}
                              alt={fr ? `Aperçu de ${project.name}` : `${project.name} Preview`}
                              accent={project.accent}
                              xrayEnabled={Boolean(xrayMap[project.id])}
                              onToggleXray={() => toggleXray(project.id)}
                              onOpenLightbox={() => {
                                playClick();
                                setLightboxXray(Boolean(xrayMap[project.id]));
                                setLightboxProject(project);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : currentTab === "specs" ? (
                      /* ─── TAB 2: SPECS (Engineering Details) ─── */
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div>
                          <h4 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                            <Cpu size={18} className="text-[#D9A441]" />
                            <span>
                              {fr
                                ? "Spécifications Techniques & Architecture"
                                : "Technical Specifications & Architecture"}
                            </span>
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {fr
                              ? `Normes d'ingénierie, sécurité et persistance mises en place pour ${project.name}.`
                              : `Engineering standards, security and persistence implemented for ${project.name}.`}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {project.specs?.map((spec, i) => (
                            <div
                              key={i}
                              className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md space-y-1 hover:border-[#D9A441]/40 transition-colors"
                            >
                              <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                {i === 0 ? (
                                  <Server size={12} className="text-[#D9A441]" />
                                ) : i === 1 ? (
                                  <ShieldCheck size={12} className="text-emerald-400" />
                                ) : i === 2 ? (
                                  <Database size={12} className="text-blue-400" />
                                ) : (
                                  <Cpu size={12} className="text-purple-400" />
                                )}
                                <span>{spec.label}</span>
                              </div>
                              <div className="text-sm font-mono font-bold text-white">
                                {spec.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-gray-300 space-y-2">
                          <div className="text-[#D9A441] font-semibold flex items-center gap-2">
                            <Code2 size={14} />
                            <span>{fr ? "Stack Principale :" : "Core Stack:"}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {project.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded bg-white/10 px-2 py-0.5 text-gray-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ─── TAB 3: HIGHLIGHTS & IMPACT (KPIs) ─── */
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div>
                          <h4 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                            <Gauge size={18} className="text-emerald-400" />
                            <span>{fr ? "Points Forts & Impact Métier" : "Highlights & Business Impact"}</span>
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {fr
                              ? "Résultats mesurables et fonctionnalités à forte valeur ajoutée."
                              : "Measurable results and high-value features."}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {project.highlights?.map((hl, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md hover:border-emerald-500/40 transition-colors"
                            >
                              <CheckCircle2
                                size={18}
                                className="text-emerald-400 shrink-0 mt-0.5"
                              />
                              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                                {hl}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Links Footer */}
                    <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-white/10">
                      {project.githubBackend && (
                        <a
                          href={project.githubBackend}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={playClick}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-mono font-semibold text-white transition-all duration-300 hover:border-[#D9A441] hover:bg-[#D9A441] hover:text-black hover:shadow-[0_0_20px_rgba(217,164,65,0.3)] cursor-pointer"
                        >
                          <FaGithub size={15} />
                          <span>{t.btnBackend}</span>
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                      {project.githubFrontend && (
                        <a
                          href={project.githubFrontend}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={playClick}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-mono font-semibold text-white transition-all duration-300 hover:border-[#D9A441] hover:bg-[#D9A441] hover:text-black hover:shadow-[0_0_20px_rgba(217,164,65,0.3)] cursor-pointer"
                        >
                          <FaGithub size={15} />
                          <span>{t.btnFrontend}</span>
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                      {project.github && !project.githubBackend && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={playClick}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-mono font-semibold text-white transition-all duration-300 hover:border-[#D9A441] hover:bg-[#D9A441] hover:text-black hover:shadow-[0_0_20px_rgba(217,164,65,0.3)] cursor-pointer"
                        >
                          <FaGithub size={15} />
                          <span>{t.btnRepo}</span>
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Tilt>
            </div>
          );
        })}
      </div>

      {/* ═══ 3. FULLSCREEN 4K PROJECT LIGHTBOX (PORTAL TO BODY) ═══ */}
      {lightboxProject &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="keep-dark fixed inset-0 z-[9995] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-2xl animate-in fade-in duration-200"
            onClick={() => setLightboxProject(null)}
          >
            <div
              className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/15 bg-neutral-950 p-4 sm:p-6 shadow-[0_30px_100px_rgba(0,0,0,0.9)] space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: lightboxProject.accent }}
                    />
                    <h4 className="text-base sm:text-lg font-bold text-white font-mono truncate">
                      {lightboxProject.name} — {lightboxProject.subtitle}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playPop();
                      setLightboxXray((prev) => !prev);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono transition-all cursor-pointer ${
                      lightboxXray
                        ? "border-[#D9A441] bg-[#D9A441]/20 text-[#D9A441] font-bold"
                        : "border-white/15 bg-white/5 text-gray-300 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <ScanLine size={13} />
                    <span>{lightboxXray ? "X-Ray ON" : "X-Ray"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxProject(null)}
                    aria-label={fr ? "Fermer l'aperçu" : "Close preview"}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <ProjectXrayImage
                src={lightboxProject.image}
                alt={`${lightboxProject.name} Lightbox Preview`}
                accent={lightboxProject.accent}
                xrayEnabled={lightboxXray}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono text-gray-400">
                <span>
                  {lightboxXray
                    ? fr
                      ? "Glissez le curseur sur l'image pour inspecter les bords Sobel."
                      : "Drag across the image to inspect Sobel wireframe edges."
                    : fr
                    ? "Appuyez sur Esc pour fermer."
                    : "Press Esc to close."}
                </span>
                <span className="text-emerald-400">{lightboxProject.domain}</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
