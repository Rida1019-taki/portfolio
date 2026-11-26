"use client";

import React, { useEffect, useRef } from "react";

const JAVA_CODE_LINES = [
  "@RestController @RequestMapping(\"/api/v1/patients\")",
  "public class PatientController extends BaseController {",
  "    private final PatientService patientService;",
  "    @PreAuthorize(\"hasAnyRole('ADMIN','DOCTOR')\")",
  "    @PostMapping public ResponseEntity<PatientDTO> create(@Valid @RequestBody CreatePatientReq req) {",
  "        return ResponseEntity.status(HttpStatus.CREATED).body(patientService.register(req));",
  "    }",
  "}",
  "",
  "@Service @Transactional(rollbackFor = Exception.class)",
  "public class JwtAuthenticationFilter extends OncePerRequestFilter {",
  "    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {",
  "        String jwt = extractBearerToken(req.getHeader(\"Authorization\"));",
  "        if (jwt != null && jwtService.isTokenValid(jwt)) {",
  "            SecurityContextHolder.getContext().setAuthentication(jwtService.getAuth(jwt));",
  "        }",
  "        chain.doFilter(req, res);",
  "    }",
  "}",
  "",
  "export interface ArchitectureMetrics { latencyMs: number; availability: string; throughput: number; }",
  "const springGateway = createReactiveRouter({ rateLimit: '1200/min', tls: 'TLSv1.3', cache: 'Redis' });",
];

export default function CodeWallBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let offset = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const accent =
        getComputedStyle(document.documentElement).getPropertyValue("--theme-accent").trim() ||
        "#D9A441";

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "12px 'JetBrains Mono', monospace";

      const lineH = 22;
      const totalRows = Math.ceil(canvas.height / lineH) + 4;
      const scrollPx = offset % (JAVA_CODE_LINES.length * lineH);

      for (let i = 0; i < totalRows; i++) {
        const lineIndex = i % JAVA_CODE_LINES.length;
        const text = JAVA_CODE_LINES[lineIndex];
        const y = i * lineH - scrollPx + 24;

        // Vertical fade mask near top & bottom
        const relY = y / Math.max(1, canvas.height);
        const edgeFade = Math.min(1, Math.min(relY * 4, (1 - relY) * 4));
        if (edgeFade <= 0) continue;

        ctx.globalAlpha = 0.08 * edgeFade;
        ctx.fillStyle = text.startsWith("@") || text.startsWith("export") ? accent : "#9ca3af";
        ctx.fillText(`${String(lineIndex + 1).padStart(2, "0")}  ${text}`, 24, y);
      }

      ctx.globalAlpha = 1;
      offset += 0.22;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
    />
  );
}
