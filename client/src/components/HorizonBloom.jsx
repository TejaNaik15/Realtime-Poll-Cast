import { useEffect, useRef } from 'react';

export default function HorizonBloom() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    // stars
    const STAR_COUNT = 320;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.4 + 0.1,
    }));

    // atmosphere particles (dust / haze near horizon)
    const DUST_COUNT = 60;
    const dust = Array.from({ length: DUST_COUNT }, () => ({
      x: Math.random(),
      y: 0.48 + Math.random() * 0.12,
      r: Math.random() * 3 + 1,
      a: Math.random() * 0.18,
      speed: (Math.random() - 0.5) * 0.00012,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // ── 1. Deep space background ──────────────────────────────────────
      const space = ctx.createLinearGradient(0, 0, 0, H);
      space.addColorStop(0,    '#00000f');
      space.addColorStop(0.38, '#05020f');
      space.addColorStop(0.58, '#0d0518');
      space.addColorStop(0.72, '#1a0a2e');
      space.addColorStop(0.82, '#2d0f3f');
      space.addColorStop(0.90, '#4a1060');
      space.addColorStop(0.96, '#7a1f6e');
      space.addColorStop(1,    '#c43060');
      ctx.fillStyle = space;
      ctx.fillRect(0, 0, W, H);

      // ── 2. Stars ──────────────────────────────────────────────────────
      stars.forEach(s => {
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t * s.speed + s.a * 10));
        // stars fade out near the horizon (bottom 35%)
        const horizonFade = Math.max(0, 1 - Math.max(0, (s.y - 0.55) / 0.1));
        ctx.globalAlpha = twinkle * horizonFade * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ── 3. Planet body ────────────────────────────────────────────────
      const planetR  = W * 0.72;
      const planetCX = W * 0.5;
      const planetCY = H * 0.68 + planetR;   // sits mostly below frame

      // dark planet fill
      const planetGrad = ctx.createRadialGradient(
        planetCX, planetCY - planetR * 0.15, planetR * 0.1,
        planetCX, planetCY, planetR
      );
      planetGrad.addColorStop(0,   '#0a0614');
      planetGrad.addColorStop(0.6, '#060310');
      planetGrad.addColorStop(1,   '#020108');
      ctx.beginPath();
      ctx.arc(planetCX, planetCY, planetR, 0, Math.PI * 2);
      ctx.fillStyle = planetGrad;
      ctx.fill();

      // ── 4. Sunrise corona / glow behind planet edge ───────────────────
      // wide outer halo
      const haloR = planetR + W * 0.18;
      const halo = ctx.createRadialGradient(planetCX, planetCY, planetR * 0.92, planetCX, planetCY, haloR);
      halo.addColorStop(0,    'rgba(255, 120, 40, 0.55)');
      halo.addColorStop(0.18, 'rgba(220, 60, 120, 0.38)');
      halo.addColorStop(0.42, 'rgba(140, 30, 180, 0.18)');
      halo.addColorStop(0.72, 'rgba(80, 10, 120, 0.07)');
      halo.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(planetCX, planetCY, haloR, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // tight bright limb glow (the actual sunrise line)
      const limbPulse = 0.82 + 0.18 * Math.sin(t * 0.4);
      const limb = ctx.createRadialGradient(planetCX, planetCY, planetR * 0.97, planetCX, planetCY, planetR * 1.09);
      limb.addColorStop(0,   `rgba(255, 200, 80, ${0.9 * limbPulse})`);
      limb.addColorStop(0.3, `rgba(255, 100, 30, ${0.65 * limbPulse})`);
      limb.addColorStop(0.7, `rgba(200, 40, 100, ${0.3 * limbPulse})`);
      limb.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(planetCX, planetCY, planetR * 1.09, 0, Math.PI * 2);
      ctx.fillStyle = limb;
      ctx.fill();

      // ── 5. Horizon atmospheric band ───────────────────────────────────
      const horizonY = planetCY - planetR;   // top of planet arc
      const atmH = H * 0.22;
      const atm = ctx.createLinearGradient(0, horizonY - atmH, 0, horizonY + H * 0.04);
      atm.addColorStop(0,    'rgba(0,0,0,0)');
      atm.addColorStop(0.45, 'rgba(180, 50, 80, 0.08)');
      atm.addColorStop(0.78, 'rgba(255, 120, 40, 0.22)');
      atm.addColorStop(1,    'rgba(255, 180, 60, 0.38)');
      ctx.fillStyle = atm;
      ctx.fillRect(0, horizonY - atmH, W, atmH + H * 0.04);

      // ── 6. Sun disc peeking over the limb ─────────────────────────────
      const sunX  = planetCX + W * 0.04 * Math.sin(t * 0.08);
      const sunY  = horizonY + 2;
      const sunR  = W * 0.028;
      // clip to only show the part above the planet
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, horizonY + 4);
      ctx.clip();

      // sun outer glow
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 5);
      sunGlow.addColorStop(0,    `rgba(255, 240, 160, ${0.55 * limbPulse})`);
      sunGlow.addColorStop(0.2,  `rgba(255, 180, 60, ${0.4 * limbPulse})`);
      sunGlow.addColorStop(0.55, `rgba(255, 80, 20, ${0.15 * limbPulse})`);
      sunGlow.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 5, 0, Math.PI * 2);
      ctx.fillStyle = sunGlow;
      ctx.fill();

      // sun core
      const sunCore = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
      sunCore.addColorStop(0,   '#fffde0');
      sunCore.addColorStop(0.5, '#ffe080');
      sunCore.addColorStop(1,   '#ff9020');
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fillStyle = sunCore;
      ctx.fill();
      ctx.restore();

      // ── 7. Dust / haze particles near horizon ─────────────────────────
      dust.forEach(d => {
        d.x += d.speed;
        if (d.x > 1.05) d.x = -0.05;
        if (d.x < -0.05) d.x = 1.05;
        ctx.globalAlpha = d.a * (0.5 + 0.5 * Math.sin(t * 0.3 + d.x * 10));
        ctx.fillStyle = '#ff9060';
        ctx.beginPath();
        ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ── 8. Subtle vignette ────────────────────────────────────────────
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
      vig.addColorStop(0,   'rgba(0,0,0,0)');
      vig.addColorStop(1,   'rgba(0,0,0,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      t += 0.012;
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
