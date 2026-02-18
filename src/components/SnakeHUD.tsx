import { useEffect, useRef, useState, useCallback } from "react";

const BASE_VALUE = 1_240_500;
const INITIAL_CAPITAL = 1_000_000;
const MAX_POINTS = 80;
const UPDATE_MS = 1800;

interface Point {
  x: number;
  y: number;
  value: number;
  time: Date;
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  x: number;
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
  const candlesRef = useRef<Candle[]>([]);
  const [displayValue, setDisplayValue] = useState(BASE_VALUE);
  const minRef = useRef(BASE_VALUE - 20_000);
  const maxRef = useRef(BASE_VALUE + 20_000);
  const sessionAthRef = useRef(BASE_VALUE);
  const sessionStartRef = useRef(new Date());
  const [headPos, setHeadPos] = useState<{ x: number; y: number } | null>(null);
  const [isUp, setIsUp] = useState(true);

  const resetPoints = useCallback(() => {
    const seed: Point[] = [];
    const candles: Candle[] = [];
    let v = BASE_VALUE;
    const now = Date.now();
    sessionStartRef.current = new Date(now - MAX_POINTS * UPDATE_MS);
    for (let i = 0; i < 40; i++) {
      const prev = v;
      v = Math.max(BASE_VALUE - 18_000, v + (Math.random() - 0.48) * 1_200);
      seed.push({ x: i / 40, y: 0, value: v, time: new Date(now - (40 - i) * UPDATE_MS) });
      if (i % 4 === 0) {
        const range = Math.abs(v - prev) * 2 + 800;
        candles.push({
          open: prev, close: v,
          high: Math.max(prev, v) + Math.random() * range * 0.3,
          low: Math.min(prev, v) - Math.random() * range * 0.3,
          x: i / 40,
        });
      }
    }
    pointsRef.current = seed;
    candlesRef.current = candles;
  }, []);

  useEffect(() => { resetPoints(); }, [resetPoints]);

  // Live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const pts = pointsRef.current;
      const last = pts[pts.length - 1]?.value ?? BASE_VALUE;
      const prev = pts[pts.length - 2]?.value ?? BASE_VALUE;
      const delta = (Math.random() - 0.47) * 1_400;
      const next = Math.max(BASE_VALUE - 18_000, last + delta);

      setDisplayValue(next);
      setIsUp(next >= prev);

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

      if (Math.random() > 0.6) {
        const cands = candlesRef.current;
        const lastCand = cands[cands.length - 1];
        const range = Math.abs(next - (lastCand?.close ?? BASE_VALUE)) * 2 + 800;
        const newCand: Candle = {
          open: lastCand?.close ?? BASE_VALUE, close: next,
          high: Math.max(lastCand?.close ?? BASE_VALUE, next) + Math.random() * range * 0.2,
          low: Math.min(lastCand?.close ?? BASE_VALUE, next) - Math.random() * range * 0.2,
          x: newPts[newPts.length - 1].x,
        };
        candlesRef.current = [...cands.slice(-19), newCand].map((c, i, arr) => ({ ...c, x: i / (arr.length - 1) }));
      }
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
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
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

      // ── Candlestick layer (very faint — 0.05 opacity) ──
      const candles = candlesRef.current;
      const candleW = Math.max(3, plotW / candles.length * 0.5);
      candles.forEach((c) => {
        const cx = toX(c.x);
        const openY = toY(c.open);
        const closeY = toY(c.close);
        const highY = toY(c.high);
        const lowY = toY(c.low);
        const bullish = c.close >= c.open;
        const color = bullish ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.04)";

        // Wick
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        ctx.moveTo(cx, highY); ctx.lineTo(cx, lowY);
        ctx.stroke();

        // Body
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(1, Math.abs(closeY - openY));
        ctx.fillStyle = color;
        ctx.fillRect(cx - candleW / 2, bodyTop, candleW, bodyH);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx - candleW / 2, bodyTop, candleW, bodyH);
      });

      // ── Y-Axis (very faint) ──
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(AXIS_LEFT, 8); ctx.lineTo(AXIS_LEFT, 8 + plotH);
      ctx.stroke();

      const yTicks = 4;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      for (let t = 0; t <= yTicks; t++) {
        const val = minRef.current + (t / yTicks) * range;
        const y = 8 + plotH - (t / yTicks) * plotH * 0.85 - plotH * 0.075;
        ctx.fillText(`$${(val / 1000).toFixed(0)}K`, AXIS_LEFT - 4, y + 3);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.moveTo(AXIS_LEFT, y); ctx.lineTo(AXIS_LEFT + plotW, y);
        ctx.stroke();
      }

      // ── X-Axis — timeline from initial deposit ──
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(AXIS_LEFT, 8 + plotH); ctx.lineTo(AXIS_LEFT + plotW, 8 + plotH);
      ctx.stroke();

      const xTicks = 4;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      const sessionStart = sessionStartRef.current.getTime();
      const sessionEnd = Date.now();
      const sessionRange = sessionEnd - sessionStart || 1;
      for (let t = 0; t <= xTicks; t++) {
        const x = AXIS_LEFT + (t / xTicks) * plotW;
        const ts = new Date(sessionStart + (t / xTicks) * sessionRange);
        const label = ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
        ctx.fillText(label, x, 8 + plotH + 16);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.moveTo(x, 8); ctx.lineTo(x, 8 + plotH);
        ctx.stroke();
      }

      // ── Fading tail ──
      const lastVal = pts[pts.length - 1]?.value ?? BASE_VALUE;
      const prevVal = pts[pts.length - 2]?.value ?? BASE_VALUE;
      const headRgb = lastVal >= prevVal ? "0,255,0" : "255,0,0";

      for (let i = 1; i < pts.length; i++) {
        const alpha = i / pts.length;
        ctx.beginPath();
        ctx.moveTo(toX(pts[i - 1].x), toY(pts[i - 1].value));
        ctx.lineTo(toX(pts[i].x), toY(pts[i].value));
        ctx.strokeStyle = `rgba(${headRgb},${alpha * 0.7})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── Area fill ──
      ctx.beginPath();
      ctx.moveTo(toX(pts[0].x), toY(pts[0].value));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(toX(pts[i].x), toY(pts[i].value));
      ctx.lineTo(toX(pts[pts.length - 1].x), 8 + plotH);
      ctx.lineTo(toX(pts[0].x), 8 + plotH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, lastVal >= prevVal ? "rgba(0,255,0,0.08)" : "rgba(255,0,0,0.08)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Glowing snake head ──
      const head = pts[pts.length - 1];
      const hx = toX(head.x);
      const hy = toY(head.value);
      const glowRgb = lastVal >= prevVal ? "0,255,0" : "255,0,0";
      const glowHex = lastVal >= prevVal ? "#00FF00" : "#FF0000";

      [18, 11, 6].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(hx, hy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${glowRgb},${[0.04, 0.09, 0.18][idx]})`;
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = glowHex;
      ctx.shadowColor = glowHex;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      setHeadPos({ x: hx, y: hy });
      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const pnl = displayValue - INITIAL_CAPITAL;
  const isProfit = pnl >= 0;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-50">
      {/* Faint grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hud-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hud-grid)" />
      </svg>

      {/* Snake + candlestick canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Floating ticker label pinned to snake head */}
      {headPos && (
        <div
          className="absolute pointer-events-none z-50"
          style={{ left: headPos.x + 10, top: headPos.y - 24 }}
        >
          <span
            className="text-[9px] font-mono font-bold whitespace-nowrap px-1.5 py-0.5 rounded-sm"
            style={{
              background: "rgba(0,0,0,0.85)",
              border: `1px solid ${isProfit ? "rgba(0,255,0,0.5)" : "rgba(255,0,0,0.5)"}`,
              color: isProfit ? "hsl(120 100% 50%)" : "hsl(0 100% 50%)",
              textShadow: isProfit ? "0 0 8px hsl(120 100% 50% / 0.8)" : "0 0 8px hsl(0 100% 50% / 0.8)",
            }}
          >
            ${displayValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Portfolio NAV counter — top left */}
      <div className="absolute top-3 left-14 z-30">
        <p className="text-[8px] font-display tracking-[0.25em] uppercase text-foreground/40 mb-0.5">
          Portfolio NAV
        </p>
        <p
          className="text-xl font-mono font-bold tracking-tight leading-none"
          style={{
            color: isUp ? "hsl(120 100% 50%)" : "hsl(0 100% 50%)",
            textShadow: isUp ? "0 0 18px rgba(0,255,0,0.4)" : "0 0 18px rgba(255,0,0,0.4)",
          }}
        >
          ${displayValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p
          className="text-[9px] font-mono mt-0.5"
          style={{ color: isProfit ? "hsl(120 100% 50%)" : "hsl(0 100% 50%)" }}
        >
          {isProfit ? "▲" : "▼"} {isProfit ? "+" : ""}{((displayValue - INITIAL_CAPITAL) / INITIAL_CAPITAL * 100).toFixed(2)}%
          &nbsp;
          <span style={{ color: isProfit ? "hsl(120 100% 50%)" : "hsl(0 100% 50%)" }}>
            ({isProfit ? "+" : ""}{pnl.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
          </span>
        </p>
        <p className="text-[8px] font-mono mt-0.5 tracking-[0.1em] uppercase" style={{ color: "hsl(0 0% 45%)" }}>
          Initial Capital: $1,000,000.00
        </p>
      </div>
    </div>
  );
};

export default SnakeHUD;
