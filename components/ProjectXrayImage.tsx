"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ScanLine, Maximize2 } from "lucide-react";

interface ProjectXrayImageProps {
  src: string;
  alt: string;
  accent?: string;
  xrayEnabled: boolean;
  onToggleXray?: () => void;
  onOpenLightbox?: () => void;
  className?: string;
}

const BAND = 0.34;
const AUTO_DURATION = 2400;

function hexToRgb(color: string): [number, number, number] {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return [217, 164, 65];
  probe.fillStyle = color || "#D9A441";
  const hex = probe.fillStyle;
  if (hex.startsWith("#") && hex.length >= 7) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }
  const m = hex.match(/\d+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [217, 164, 65];
}

export default function ProjectXrayImage({
  src,
  alt,
  accent = "#D9A441",
  xrayEnabled,
  onOpenLightbox,
  className = "",
}: ProjectXrayImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const edgesCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [scanRatio, setScanRatio] = useState<number>(0.33);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);

  // Build Sobel edge-detection offscreen canvas once image loads or accent changes
  const buildEdges = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!img || !img.naturalWidth || !canvas || !frame) return;

    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(1000, Math.max(320, Math.round(rect.width * dpr)));
    const h = Math.max(180, Math.round(w / (rect.width / rect.height)));

    canvas.width = w;
    canvas.height = h;

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const offCtx = off.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return;

    // Cover-fit drawImage matching object-cover object-center
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = w / h;
    let sx = 0,
      sy = 0,
      sw = img.naturalWidth,
      sh = img.naturalHeight;
    if (imgRatio > boxRatio) {
      sw = img.naturalHeight * boxRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / boxRatio;
      sy = (img.naturalHeight - sh) / 2;
    }

    offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    const srcData = offCtx.getImageData(0, 0, w, h);
    const outData = offCtx.createImageData(w, h);
    const gray = new Float32Array(w * h);

    for (let i = 0; i < gray.length; i++) {
      const idx = i * 4;
      gray[i] =
        srcData.data[idx] * 0.2126 +
        srcData.data[idx + 1] * 0.7152 +
        srcData.data[idx + 2] * 0.0722;
    }

    const [r, g, b] = hexToRgb(accent);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx =
          -gray[i - w - 1] +
          gray[i - w + 1] -
          2 * gray[i - 1] +
          2 * gray[i + 1] -
          gray[i + w - 1] +
          gray[i + w + 1];
        const gy =
          -gray[i - w - 1] -
          2 * gray[i - w] -
          gray[i - w + 1] +
          gray[i + w - 1] +
          2 * gray[i + w] +
          gray[i + w + 1];

        const mag = Math.hypot(gx, gy);
        const alpha = Math.min(240, Math.max(0, (mag - 16) * 1.15));
        const p = i * 4;
        outData.data[p] = r;
        outData.data[p + 1] = g;
        outData.data[p + 2] = b;
        outData.data[p + 3] = alpha;
      }
    }

    offCtx.putImageData(outData, 0, 0);
    edgesCanvasRef.current = off;
    setReady(true);
  }, [accent]);

  // Draw the current X-Ray lens slice when xrayEnabled or scanRatio changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const edges = edgesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!xrayEnabled || !edges || !ready) return;

    const bandPx = canvas.width * BAND;
    const leftPx = scanRatio * (canvas.width - bandPx);

    ctx.save();
    ctx.beginPath();
    ctx.rect(leftPx, 0, bandPx, canvas.height);
    ctx.clip();

    // Dark X-Ray slate background inside lens + faint grid
    ctx.fillStyle = "rgba(6, 8, 10, 0.94)";
    ctx.fillRect(leftPx, 0, bandPx, canvas.height);

    // Subtle schematic grid inside X-Ray lens
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    const step = 24;
    for (let gx = Math.floor(leftPx / step) * step; gx < leftPx + bandPx; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, canvas.height);
      ctx.stroke();
    }
    for (let gy = 0; gy < canvas.height; gy += step) {
      ctx.beginPath();
      ctx.moveTo(leftPx, gy);
      ctx.lineTo(leftPx + bandPx, gy);
      ctx.stroke();
    }

    ctx.drawImage(edges, 0, 0);
    ctx.restore();

    // Vertical laser scan borders
    ctx.fillStyle = accent;
    ctx.fillRect(leftPx, 0, 2, canvas.height);
    ctx.fillRect(leftPx + bandPx - 2, 0, 2, canvas.height);
  }, [xrayEnabled, scanRatio, ready, accent]);

  // Smooth auto sweep animation when X-Ray is enabled and not dragging
  useEffect(() => {
    if (!xrayEnabled || dragging) return;
    let raf = 0;
    let start = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - start) % (AUTO_DURATION * 2);
      const t = elapsed / AUTO_DURATION;
      const pingPong = t <= 1 ? t : 2 - t;
      // Ease in-out
      const eased = pingPong * pingPong * (3 - 2 * pingPong);
      setScanRatio(eased);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [xrayEnabled, dragging]);

  // Rebuild edge mask on resize
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const ro = new ResizeObserver(() => buildEdges());
    ro.observe(frame);
    return () => ro.disconnect();
  }, [buildEdges]);

  const updatePointerRatio = (clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    const normalized = Math.max(0, Math.min(1, (rel - BAND / 2) / (1 - BAND)));
    setScanRatio(normalized);
  };

  return (
    <div
      ref={frameRef}
      onPointerDown={(e) => {
        if (!xrayEnabled) return;
        setDragging(true);
        updatePointerRatio(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!xrayEnabled) return;
        if (dragging || e.pointerType === "mouse") {
          setDragging(true);
          updatePointerRatio(e.clientX);
        }
      }}
      onPointerLeave={() => setDragging(false)}
      onPointerUp={() => setDragging(false)}
      className={`keep-dark relative aspect-[16/10] overflow-hidden rounded-xl bg-neutral-900 select-none ${
        xrayEnabled ? "cursor-ew-resize" : ""
      } ${className}`}
    >
      {/* Underlying Real Project Screenshot */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={buildEdges}
        className={`h-full w-full object-cover object-center transition-transform duration-700 ease-out ${
          xrayEnabled ? "scale-100" : "group-hover:scale-105"
        }`}
      />

      {/* Sobel Edge Detection X-Ray Canvas Overlay */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${
          xrayEnabled ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* X-Ray Telemetry Pill when active */}
      {xrayEnabled && (
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-2.5 py-1 text-[10px] font-mono text-white backdrop-blur-md">
          <ScanLine size={11} style={{ color: accent }} />
          <span>X-RAY SOBEL WIREFRAME • GLISSER</span>
        </div>
      )}

      {/* Lightbox Zoom Button */}
      {onOpenLightbox && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox();
          }}
          title="Ouvrir en plein écran (Lightbox)"
          aria-label="Voir la capture en plein écran"
          className="absolute bottom-2.5 right-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/75 text-white/85 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-[#D9A441] hover:text-white cursor-pointer"
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  );
}
