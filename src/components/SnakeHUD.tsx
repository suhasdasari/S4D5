import { useEffect, useRef, useState } from "react";

const BASE_VALUE = 1_240_500;
const MAX_POINTS = 80;
const UPDATE_MS = 1800;

interface Point {
  x: number; // 0–1 normalized time
  y: number; // 0–1 normalized value (0 = bottom, 1 = top)
  value: number;
}

const SnakeHUD = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const [displayValue, setDisplayValue] = useState(BASE_VALUE);
  const minRef = useRef(BASE_VALUE - 20_000);
  const maxRef = useRef(BASE_VALUE + 20_000);

  // Seed initial points
  useEffect(() => {
    const seed: Point[] = [];
    let v = BASE_VALUE;
    for (let i = 0; i < 40; i++) {
      v = Math.max(BASE_VALUE - 18_000, v + (Math.random() - 0.48) * 1_200);
      seed.push({ x: i / 40, y: 0, value: v });
    }
    pointsRef.current = seed;
  }, []);

  // Live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const pts = pointsRef.current;
      const last = pts[pts.length - 1]?.value ?? BASE_VALUE;
      const delta = (Math.random() - 0.47) * 1_400;
      const next = Math.max(BASE_VALUE - 18_000, last + delta);
      setDisplayValue(next);

      const newPts = [
        ...pts.slice(-(MAX_POINTS - 1)),
        { x: 1, y: 0, value: next },
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
    const draw = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        animFrame = requestAnimationFrame(draw);
        return;
      }
      const W = container.clientWidth;
      const H = container.clientHeight;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) { animFrame = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);

      const pts = pointsRef.current;
      if (pts.length < 2) { animFrame = requestAnimationFrame(draw); return; }

      const range = maxRef.current - minRef.current || 1;
      const toX = (nx: number) => nx * W;
      const toY = (v: number) => H - ((v - minRef.current) / range) * H * 0.85 - H * 0.075;

      // ── Fading tail (gradient stroke) ──
      for (let i = 1; i < pts.length; i++) {
        const alpha = i / pts.length;
        ctx.beginPath();
        ctx.moveTo(toX(pts[i - 1].x), toY(pts[i - 1].value));
        ctx.lineTo(toX(pts[i].x), toY(pts[i].value));
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── Area fill under the line ──
      ctx.beginPath();
      ctx.moveTo(toX(pts[0].x), toY(pts[0].value));
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(toX(pts[i].x), toY(pts[i].value));
      }
      ctx.lineTo(toX(pts[pts.length - 1].x), H);
      ctx.lineTo(toX(pts[0].x), H);
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

      // outer glow rings
      [14, 9, 5].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(hx, hy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${[0.04, 0.08, 0.15][idx]})`;
        ctx.fill();
      });
      // core dot
      ctx.beginPath();
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#FFFFFF";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      animFrame = requestAnimationFrame(draw);
    };
    animFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const isUp = displayValue >= BASE_VALUE;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20">
      {/* Faint grid background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hud-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hud-grid)" />
      </svg>

      {/* Snake canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Portfolio value counter — top left */}
      <div className="absolute top-4 left-4 z-30">
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
