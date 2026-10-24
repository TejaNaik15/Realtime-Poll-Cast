import { useEffect, useRef } from 'react';

export default function BlackHole() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Stars ────────────────────────────────────────────────────────────
    const STAR_COUNT = 420;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.1 + 0.15,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.6 + 0.2,
    }));

    // ── Smoke / accretion particles ───────────────────────────────────────
    const SMOKE_COUNT = 180;
    const smoke = Array.from({ length: SMOKE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 0.14 + Math.random() * 0.22;   // fraction of min(W,H)/2
      return {
        angle,
        dist,
        r:     Math.random() * 28 + 8,
        alpha: Math.random() * 0.18 + 0.04,
        speed: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
        drift: (Math.random() - 0.5) * 0.0006,
        hue:   Math.random() < 0.6 ? 260 : (Math.random() < 0.5 ? 200 : 30),
      };
    });

    // ── Photon ring arcs ──────────────────────────────────────────────────
    const RING_ARCS = 5;
    const ringArcs = Array.from({ length: RING_ARCS }, (_, i) => ({
      startAngle: (i / RING_ARCS) * Math.PI * 2,
      span:       Math.PI * (0.3 + Math.random() * 0.5),
      width:      1.5 + Math.random() * 2.5,
      alpha:      0.55 + Math.random() * 0.35,
      speed:      0.0008 + Math.random() * 0.0012,
    }));

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const cx = W * 0.5;
      const cy = H * 0.5;
      const base = Math.min(W, H) * 0.5;
      const bhR  = base * 0.13;   // black hole event horizon radius

      ctx.clearRect(0, 0, W, H);

      // ── 1. Deep space ──────────────────────────────────────────────────
      const space = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 1.4);
      space.addColorStop(0,    '#08001a');
      space.addColorStop(0.35, '#04000e');
      space.addColorStop(0.7,  '#020008');
      space.addColorStop(1,    '#000000');
      ctx.fillStyle = space;
      ctx.fillRect(0, 0, W, H);

      // ── 2. Stars (lensed — avoid the BH centre) ────────────────────────
      stars.forEach(s => {
        const sx = s.x * W;
        const sy = s.y * H;
        const dFromBH = Math.hypot(sx - cx, sy - cy);
        if (dFromBH < bhR * 2.2) return;   // hidden behind/near BH
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t * s.speed + s.phase));
        ctx.globalAlpha = twinkle * 0.85;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ── 3. Outer gravitational lensing glow ───────────────────────────
      const lensR = base * 1.1;
      const lens = ctx.createRadialGradient(cx, cy, bhR * 1.8, cx, cy, lensR);
      lens.addColorStop(0,    'rgba(100, 60, 255, 0.22)');
      lens.addColorStop(0.18, 'rgba(60,  20, 180, 0.14)');
      lens.addColorStop(0.45, 'rgba(30,   5, 100, 0.07)');
      lens.addColorStop(1,    'rgba(0,    0,   0, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, lensR, 0, Math.PI * 2);
      ctx.fillStyle = lens;
      ctx.fill();

      // ── 4. Accretion disc (ellipse, tilted) ───────────────────────────
      const discRX = base * 0.52;
      const discRY = base * 0.13;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.18);

      // outer warm glow
      const discGlow = ctx.createRadialGradient(0, 0, bhR, 0, 0, discRX);
      discGlow.addColorStop(0,    'rgba(255, 160,  40, 0.0)');
      discGlow.addColorStop(0.25, 'rgba(255, 120,  20, 0.28)');
      discGlow.addColorStop(0.55, 'rgba(200,  60, 180, 0.18)');
      discGlow.addColorStop(0.8,  'rgba(100,  20, 200, 0.09)');
      discGlow.addColorStop(1,    'rgba(0,     0,   0, 0)');
      ctx.scale(1, discRY / discRX);
      ctx.beginPath();
      ctx.arc(0, 0, discRX, 0, Math.PI * 2);
      ctx.fillStyle = discGlow;
      ctx.fill();
      ctx.restore();

      // ── 5. Smoke / warped light particles ─────────────────────────────
      smoke.forEach(p => {
        p.angle += p.speed;
        p.dist  += p.drift;
        if (p.dist < 0.10) p.dist = 0.10;
        if (p.dist > 0.38) p.dist = 0.38;

        const px = cx + Math.cos(p.angle) * p.dist * base;
        const py = cy + Math.sin(p.angle) * p.dist * base * 0.55;

        // fade smoke that's "behind" the BH (simple depth cue)
        const depthAlpha = p.angle % (Math.PI * 2) > Math.PI ? 0.45 : 1.0;

        ctx.globalAlpha = p.alpha * depthAlpha * (0.6 + 0.4 * Math.sin(t * 0.3 + p.angle));
        const sg = ctx.createRadialGradient(px, py, 0, px, py, p.r);
        sg.addColorStop(0,   `hsla(${p.hue}, 80%, 70%, 0.9)`);
        sg.addColorStop(0.5, `hsla(${p.hue}, 60%, 40%, 0.4)`);
        sg.addColorStop(1,   `hsla(${p.hue}, 40%, 20%, 0)`);
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = sg;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ── 6. Photon ring ────────────────────────────────────────────────
      const photonR = bhR * 1.42;
      ringArcs.forEach(arc => {
        arc.startAngle += arc.speed;
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.2 + arc.startAngle);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.55);   // flatten to match disc tilt
        ctx.beginPath();
        ctx.arc(0, 0, photonR, arc.startAngle, arc.startAngle + arc.span);
        ctx.strokeStyle = `rgba(255, 220, 100, ${arc.alpha * pulse})`;
        ctx.lineWidth = arc.width;
        ctx.shadowColor = 'rgba(255, 200, 60, 0.9)';
        ctx.shadowBlur  = 14;
        ctx.stroke();
        ctx.restore();
      });

      // secondary blue/violet photon ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.55);
      ctx.beginPath();
      ctx.arc(0, 0, photonR * 1.06, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(160, 100, 255, ${0.18 + 0.08 * Math.sin(t * 0.7)})`;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(140, 80, 255, 0.6)';
      ctx.shadowBlur  = 10;
      ctx.stroke();
      ctx.restore();

      // ── 7. Event horizon (the black hole itself) ──────────────────────
      // outer soft edge
      const bhEdge = ctx.createRadialGradient(cx, cy, bhR * 0.7, cx, cy, bhR * 1.35);
      bhEdge.addColorStop(0,   'rgba(0,0,0,1)');
      bhEdge.addColorStop(0.6, 'rgba(0,0,0,0.95)');
      bhEdge.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, bhR * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = bhEdge;
      ctx.fill();

      // hard black core
      ctx.beginPath();
      ctx.arc(cx, cy, bhR, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // ── 8. Vignette ───────────────────────────────────────────────────
      const vig = ctx.createRadialGradient(cx, cy, base * 0.4, cx, cy, base * 1.3);
      vig.addColorStop(0,   'rgba(0,0,0,0)');
      vig.addColorStop(1,   'rgba(0,0,0,0.72)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      t += 0.01;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
}
