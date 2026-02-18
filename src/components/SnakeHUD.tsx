import { useEffect, useRef, useState, useCallback } from "react";

const BASE_VALUE = 1_240_500;
const MAX_POINTS = 80;
const UPDATE_MS = 1800;

const INTERVALS = ["1M", "1H", "1D", "1W", "1Mo", "1Y"] as const;
type Interval = typeof INTERVALS[number];

interface Point {
  x: number;
  y: number;
  value: number;
  time: Date;
}

// ATH event bus — globe subscribes to flash white
export const athEventBus = {
  listeners: [] as (() => void)[],
  emit() { this.listeners.forEach((fn) => fn()); },
  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((l) => l !== fn); };
  },
};

const SnakeHUD = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const [displayValue, setDisplayValue] = useState(BASE_VALUE);
  const minRef = useRef(BASE_VALUE - 20_000);
  const maxRef = useRef(BASE_VALUE + 20_000);
  const [selectedInterval, setSelectedInterval] = useState<Interval>("1D");
  const sessionAthRef = useRef(BASE_VALUE);
  // Head screen position for floating label
  const headPosRef = useRef<{ x: number; y: number } | null>(null);
  const [headPos, setHeadPos] = useState<{ x: number; y: number } | null>(null);

  const resetPoints = useCallback(() => {
    const seed: Point[] = [];
    let v = BASE_VALUE;
    const now = Date.now();
    for (let i = 0; i < 40; i++) {
      v = Math.max(BASE_VALUE - 18_000, v + (Math.random() - 0.48) * 1_200);
      seed.push({ x: i / 40, y: 0, value: v, time: new Date(now - (40 - i) * 5000) });
    }
    pointsRef.current = seed;
  }, []);

  useEffect(() => { resetPoints(); }, [resetPoints]);

  // Live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const pts = pointsRef.current;
      const last = pts[pts.length - 1]?.value ?? BASE_VALUE;
      const delta = (Math.random() - 0.47) * 1_400;
      const next = Math.max(BASE_VALUE - 18_000, last + delta);
      setDisplayValue(next);

      // ATH detection
      if (next > sessionAthRef.current) {
        sessionAthRef.current = next;
        athEventBus.emit();
      }

      const newPts: Point[] = [
        ...pts.slice(-(MAX_POINTS - 1)),
        { x: 1, y: 0, value: next, time: new Date() },
      ].map((p, i, arr) => ({ ...p, x: i / (arr.length - 1) }));

      const vals = newPts.map((p) => p.value);
      minRef.current = Math.min(...vals) - 2_000;
      maxRef.current = Math.max(...vals) + 2_000;
      pointsRef.current = newPts;
    }, UPDATE_MS);
    return () => clearInterval(interval);
  }, []);

  // Canvas render loop
  useEffect(() => {
    let animFrame: number;
    const AXIS_LEFT = 52;
    const AXIS_BOTTOM = 28;

    const draw = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) { animFrame = requestAnimationFrame(draw); return; }

      const W = container.clientWidth;
      const H = container.clientHeight;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) { animFrame = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);

      const plotW = W - AXIS_LEFT - 8;
      const plotH = H - AXIS_BOTTOM - 8;

      const pts = pointsRef.current;
      if (pts.length < 2) { animFrame = requestAnimationFrame(draw); return; }

      const range = maxRef.current - minRef.current || 1;
      const toX = (nx: number) => AXIS_LEFT + nx * plotW;
      const toY = (v: number) => 8 + plotH - ((v - minRef.current) / range) * plotH * 0.85 - plotH * 0.075;

      // ── Y-Axis ──
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(AXIS_LEFT, 8);
      ctx.lineTo(AXIS_LEFT, 8 + plotH);
      ctx.stroke();

      // Y tick labels (4 ticks)
      const yTicks = 4;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      for (let t = 0; t <= yTicks; t++) {
        const val = minRef.current + (t / yTicks) * range;
        const y = 8 + plotH - (t / yTicks) * plotH * 0.85 - plotH * 0.075;
        ctx.fillText(`$${(val / 1000).toFixed(0)}K`, AXIS_LEFT - 4, y + 3);
        // grid line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.moveTo(AXIS_LEFT, y);
        ctx.lineTo(AXIS_LEFT + plotW, y);
        ctx.stroke();
      }

      // ── X-Axis ──
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(AXIS_LEFT, 8 + plotH);
      ctx.lineTo(AXIS_LEFT + plotW, 8 + plotH);
      ctx.stroke();

      // X tick labels (4 ticks)
      const xTicks = 4;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      for (let t = 0; t <= xTicks; t++) {
        const x = AXIS_LEFT + (t / xTicks) * plotW;
        const ptIdx = Math.floor((t / xTicks) * (pts.length - 1));
        const pt = pts[ptIdx];
        const label = pt
          ? pt.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
          : "";
        ctx.fillText(label, x, 8 + plotH + 16);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.moveTo(x, 8);
        ctx.lineTo(x, 8 + plotH);
        ctx.stroke();
      }

      // ── Fading tail ──
      for (let i = 1; i < pts.length; i++) {
        const alpha = i / pts.length;
        ctx.beginPath();
        ctx.moveTo(toX(pts[i - 1].x), toY(pts[i - 1].value));
        ctx.lineTo(toX(pts[i].x), toY(pts[i].value));
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── Area fill ──
      ctx.beginPath();
      ctx.moveTo(toX(pts[0].x), toY(pts[0].value));
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(toX(pts[i].x), toY(pts[i].value));
      }
      ctx.lineTo(toX(pts[pts.length - 1].x), 8 + plotH);
      ctx.lineTo(toX(pts[0].x), 8 + plotH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(255,255,255,0.08)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Glowing head ──
      const head = pts[pts.length - 1];
      const hx = toX(head.x);
      const hy = toY(head.value);

      headPosRef.current = { x: hx, y: hy };

      [14, 9, 5].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(hx, hy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${[0.04, 0.08, 0.15][idx]})`;
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#FFFFFF";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      setHeadPos({ x: hx, y: hy });
      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const isUp = displayValue >= BASE_VALUE;

  const handleIntervalSelect = (iv: Interval) => {
    setSelectedInterval(iv);
    resetPoints();
  };

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20">
      {/* Faint grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hud-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hud-grid)" />
      </svg>

      {/* Snake canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Floating value label that tracks the snake head */}
      {headPos && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: headPos.x + 10,
            top: headPos.y - 28,
            transform: "none",
          }}
        >
          <span
            className="text-[9px] font-mono font-bold whitespace-nowrap px-1.5 py-0.5 rounded-sm"
            style={{
              background: "rgba(0,0,0,0.75)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: isUp ? "hsl(120 100% 50%)" : "hsl(0 100% 50%)",
              textShadow: isUp ? "0 0 6px hsl(120 100% 50% / 0.6)" : "0 0 6px hsl(0 100% 50% / 0.6)",
            }}
          >
            ${displayValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Interval selector — top-left, pointer-events-auto */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-0 pointer-events-auto">
        {INTERVALS.map((iv, i) => (
          <button
            key={iv}
            onClick={() => handleIntervalSelect(iv)}
            className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 transition-colors ${
              selectedInterval === iv
                ? "text-foreground border border-foreground/40 bg-foreground/5"
                : "text-muted-foreground border border-transparent hover:text-foreground/70"
            } ${i === 0 ? "rounded-l-sm" : ""} ${i === INTERVALS.length - 1 ? "rounded-r-sm" : ""}`}
          >
            {iv}
          </button>
        ))}
      </div>

      {/* Portfolio value counter — below interval selector */}
      <div className="absolute top-10 left-4 z-30">
        <p className="text-[9px] font-display tracking-[0.25em] uppercase text-foreground/40 mb-0.5">
          Portfolio NAV
        </p>
        <p
          className={`text-2xl font-mono font-bold tracking-tight leading-none ${
            isUp ? "text-foreground" : "text-negative"
          }`}
          style={{ textShadow: isUp ? "0 0 20px rgba(255,255,255,0.35)" : "0 0 20px rgba(255,0,0,0.4)" }}
        >
          ${displayValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={`text-[10px] font-mono mt-0.5 ${isUp ? "text-positive" : "text-negative"}`}>
          {isUp ? "▲" : "▼"}{" "}
          {Math.abs(((displayValue - BASE_VALUE) / BASE_VALUE) * 100).toFixed(3)}%
        </p>
      </div>
    </div>
  );
};

export default SnakeHUD;
