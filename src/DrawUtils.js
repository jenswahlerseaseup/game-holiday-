// DrawUtils — canvas-2D drawing helpers used by scene CanvasTextures.
// ctx is always a native CanvasRenderingContext2D.  w/h are canvas dimensions.
const DrawUtils = {

  // Gradient sky, topHex and botHex are CSS hex strings e.g. '#1a2030'
  sky(ctx, w, h, topHex, botHex) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, topHex);
    g.addColorStop(1, botHex);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },

  // Distant mountain silhouette
  mountains(ctx, w, baseY, color, count = 5) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    let x = 0;
    while (x < w) {
      const peakH = 60 + Math.sin(x * 0.018) * 40 + Math.cos(x * 0.031) * 30;
      const peakW = 120 + Math.sin(x * 0.041) * 60;
      ctx.lineTo(x + peakW * 0.5, baseY - peakH);
      x += peakW;
    }
    ctx.lineTo(w, baseY);
    ctx.closePath();
    ctx.fill();
  },

  // Recursive tree silhouette
  _branch(ctx, x, y, len, angle, depth, color) {
    if (depth === 0 || len < 2) return;
    const ex = x + Math.sin(angle) * len;
    const ey = y - Math.cos(angle) * len;
    ctx.lineWidth = depth * 0.9;
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    const spread = 0.38 + depth * 0.04;
    const variance = () => (Math.random() - 0.5) * 0.15;
    DrawUtils._branch(ctx, ex, ey, len * 0.68, angle - spread + variance(), depth - 1, color);
    DrawUtils._branch(ctx, ex, ey, len * 0.68, angle + spread + variance(), depth - 1, color);
    if (depth > 3) DrawUtils._branch(ctx, ex, ey, len * 0.5, angle + variance(), depth - 2, color);
  },

  tree(ctx, x, y, height, color = '#0a100a') {
    ctx.lineCap = 'round';
    DrawUtils._branch(ctx, x, y, height, 0, 7, color);
  },

  // Dense treeline spanning the full width
  treeLine(ctx, w, groundY, color, density = 1) {
    const spacing = Math.round(18 / density);
    for (let x = -20; x < w + 20; x += spacing) {
      const jitter   = (Math.sin(x * 0.17) * 8 + Math.cos(x * 0.31) * 5);
      const h        = 55 + Math.abs(Math.sin(x * 0.09) * 35) + jitter;
      const baseY    = groundY + Math.sin(x * 0.05) * 4;
      DrawUtils.tree(ctx, x, baseY, h, color);
    }
  },

  // Simple rectangular building with glowing windows
  building(ctx, x, y, w, h, winColor = '#ffcc60', floors = 2) {
    ctx.fillStyle = '#0e151a';
    ctx.fillRect(x, y, w, h);

    // Roof edge
    ctx.fillStyle = '#0a1014';
    ctx.fillRect(x - 3, y - 6, w + 6, 8);

    const winW  = 10, winH = 9, padX = 8, padY = 10;
    const cols  = Math.max(1, Math.floor((w - padX * 2) / (winW + padX)));
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const wx = x + padX + c * (winW + padX);
        const wy = y + padY + f * (winH + padY + 6);
        if (wy + winH > y + h - 4) continue;
        // Random chance that a window is lit
        const lit = (Math.sin(wx * 0.7 + wy * 1.3) > -0.3);
        if (lit) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = winColor;
          ctx.fillStyle = winColor;
          ctx.fillRect(wx, wy, winW, winH);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#181c22';
          ctx.fillRect(wx, wy, winW, winH);
        }
      }
    }
  },

  // Perspective road stretching to horizon
  road(ctx, w, h, roadColor = '#181c22', stripeColor = '#2a3040') {
    const horizon = h * 0.52;
    ctx.fillStyle = roadColor;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, horizon);
    ctx.lineTo(w * 0.58, horizon);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Road edge lines
    ctx.strokeStyle = '#252e3a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, horizon); ctx.lineTo(0, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.58, horizon); ctx.lineTo(w, h);
    ctx.stroke();

    // Centre dashes
    ctx.strokeStyle = stripeColor;
    ctx.setLineDash([18, 22]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.50, horizon + 6);
    ctx.lineTo(w * 0.50, h);
    ctx.stroke();
    ctx.setLineDash([]);
  },

  // Rice field / paddy
  field(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#243c22');
    g.addColorStop(1, '#162014');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    // Paddy lines
    ctx.strokeStyle = 'rgba(20,40,20,0.7)';
    ctx.lineWidth = 1;
    const rows = Math.floor(h / 10);
    for (let i = 0; i < rows; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y + i * 10);
      ctx.lineTo(x + w, y + i * 10);
      ctx.stroke();
    }
  },

  // Soft radial glow (lantern, window spill, creature eye)
  glow(ctx, x, y, r, colorHex, alpha = 0.5) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, DrawUtils._hexA(colorHex, alpha));
    g.addColorStop(1, DrawUtils._hexA(colorHex, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  },

  _hexA(hex, a) {
    const n = parseInt(hex.replace('#',''), 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8)  & 0xff;
    const b =  n        & 0xff;
    return `rgba(${r},${g},${b},${a})`;
  },

  // Puddle reflection: blurred copy of colours above
  puddle(ctx, x, y, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#1a2c3c';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  },

  // Wet-road shimmer line
  wetLine(ctx, x, y, len, color = 'rgba(60,90,120,0.3)') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  },

  // ── Character drawing ────────────────────────────────────────────────

  // Boy — bottom-centre at (x, y), facing 'right' | 'left' | 'fwd'
  boy(ctx, x, y, facing = 'right', scale = 1) {
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    if (facing === 'left') ctx.scale(-1, 1);

    // Shoes
    ctx.fillStyle = '#181008';
    DrawUtils._ellipse(ctx, -5*s, 0, 6*s, 3*s);
    DrawUtils._ellipse(ctx,  5*s, 0, 6*s, 3*s);

    // Pants
    ctx.fillStyle = '#364050';
    ctx.fillRect(-8*s, -20*s, 7*s, 20*s);
    ctx.fillRect( 1*s, -20*s, 7*s, 20*s);

    // Jacket
    ctx.fillStyle = '#c03830';
    ctx.fillRect(-9*s, -40*s, 18*s, 22*s);

    // Collar / neck
    ctx.fillStyle = '#eebe82';
    ctx.fillRect(-3*s, -43*s, 6*s, 5*s);

    // Head
    ctx.fillStyle = '#eebe82';
    DrawUtils._ellipse(ctx, 0, -52*s, 11*s, 13*s);

    // Hair
    ctx.fillStyle = '#201410';
    ctx.beginPath();
    ctx.arc(0, -56*s, 11*s, Math.PI, 0, false);
    ctx.fill();
    ctx.fillRect(-11*s, -64*s, 22*s, 8*s);

    // Eye
    ctx.fillStyle = '#241810';
    DrawUtils._ellipse(ctx, 4*s, -52*s, 3.5*s, 4*s);
    ctx.fillStyle = '#ffffff';
    DrawUtils._ellipse(ctx, 5*s, -53.5*s, 1.2*s, 1.2*s);

    // Ear
    ctx.fillStyle = '#d8a870';
    DrawUtils._ellipse(ctx, -10*s, -52*s, 3*s, 3.5*s);

    ctx.restore();
  },

  // Mom — slightly taller, coat
  mom(ctx, x, y, facing = 'right', scale = 1) {
    const s = scale;
    ctx.save(); ctx.translate(x, y);
    if (facing === 'left') ctx.scale(-1, 1);

    // Shoes
    ctx.fillStyle = '#201818';
    DrawUtils._ellipse(ctx, -5*s, 0, 6*s, 3*s);
    DrawUtils._ellipse(ctx,  5*s, 0, 6*s, 3*s);

    // Skirt/pants
    ctx.fillStyle = '#2e3844';
    ctx.fillRect(-9*s, -24*s, 18*s, 24*s);

    // Coat
    ctx.fillStyle = '#3e4c5c';
    ctx.fillRect(-10*s, -46*s, 20*s, 24*s);
    // Lapel
    ctx.fillStyle = '#344050';
    ctx.beginPath();
    ctx.moveTo(0, -46*s); ctx.lineTo(-3*s, -30*s); ctx.lineTo(0, -36*s);
    ctx.closePath(); ctx.fill();

    // Neck
    ctx.fillStyle = '#eebe82';
    ctx.fillRect(-2.5*s, -49*s, 5*s, 5*s);

    // Head
    ctx.fillStyle = '#eebe82';
    DrawUtils._ellipse(ctx, 0, -58*s, 10*s, 12*s);

    // Hair (bob)
    ctx.fillStyle = '#3a2820';
    ctx.beginPath();
    ctx.arc(0, -61*s, 10*s, Math.PI * 1.1, 0, false);
    ctx.fill();
    ctx.fillRect(-10*s, -70*s, 20*s, 10*s);
    ctx.fillRect(-10*s, -68*s, 4*s, 12*s);
    ctx.fillRect( 6*s,  -68*s, 4*s, 12*s);

    // Eye
    ctx.fillStyle = '#241810';
    DrawUtils._ellipse(ctx, 4*s, -59*s, 2.8*s, 3.2*s);
    ctx.fillStyle = '#fff';
    DrawUtils._ellipse(ctx, 5*s, -60*s, 1*s, 1*s);

    ctx.restore();
  },

  // Kenta — hunched, desaturated, sad
  kenta(ctx, x, y, facing = 'right', scale = 1) {
    const s = scale;
    ctx.save(); ctx.translate(x, y);
    if (facing === 'left') ctx.scale(-1, 1);

    // Shoes (worn, dark)
    ctx.fillStyle = '#141010';
    DrawUtils._ellipse(ctx, -5*s, 0, 6*s, 3*s);
    DrawUtils._ellipse(ctx,  5*s, 0, 6*s, 3*s);

    // Legs
    ctx.fillStyle = '#383838';
    ctx.fillRect(-8*s, -22*s, 7*s, 22*s);
    ctx.fillRect( 1*s, -22*s, 7*s, 22*s);

    // Long coat (grey, slightly open)
    ctx.fillStyle = '#4e4e4e';
    // Main body — hunched, so offset upward and forward
    ctx.fillRect(-10*s, -46*s, 20*s, 26*s);
    // Hunch: shoulders raised
    ctx.fillRect(-12*s, -50*s, 24*s, 10*s);

    // Neck
    ctx.fillStyle = '#c0a880';
    ctx.fillRect(-2.5*s, -53*s, 5*s, 5*s);

    // Head (slightly lowered)
    ctx.fillStyle = '#c0a880';
    DrawUtils._ellipse(ctx, 2*s, -62*s, 10*s, 12*s);

    // Thinning grey hair
    ctx.fillStyle = '#888080';
    ctx.beginPath();
    ctx.arc(2*s, -65*s, 10*s, Math.PI * 1.15, 0, false);
    ctx.fill();
    ctx.fillRect(-8*s, -74*s, 20*s, 10*s);

    // Eyes (downcast, hollow)
    ctx.fillStyle = '#302820';
    DrawUtils._ellipse(ctx, 6*s, -63*s, 2.5*s, 2*s);

    // Eye shadow / bags
    ctx.strokeStyle = 'rgba(80,60,60,0.5)';
    ctx.lineWidth = 1.5*s;
    ctx.beginPath();
    ctx.arc(6*s, -61*s, 3*s, 0, Math.PI, false);
    ctx.stroke();

    ctx.restore();
  },

  // Shop owner — small, round, warm
  shopOwner(ctx, x, y, facing = 'right', scale = 1) {
    const s = scale;
    ctx.save(); ctx.translate(x, y);
    if (facing === 'left') ctx.scale(-1, 1);

    ctx.fillStyle = '#181410';
    DrawUtils._ellipse(ctx, -4*s, 0, 5*s, 3*s);
    DrawUtils._ellipse(ctx,  4*s, 0, 5*s, 3*s);

    ctx.fillStyle = '#4a3828';
    ctx.fillRect(-8*s, -20*s, 16*s, 20*s);

    ctx.fillStyle = '#c87840';
    ctx.fillRect(-9*s, -44*s, 18*s, 26*s);

    ctx.fillStyle = '#f0c088';
    ctx.fillRect(-2*s, -47*s, 4*s, 5*s);

    // Round head
    ctx.fillStyle = '#f0c088';
    DrawUtils._ellipse(ctx, 0, -56*s, 12*s, 13*s);

    // Grey hair, bun
    ctx.fillStyle = '#b0a898';
    ctx.beginPath();
    ctx.arc(0, -60*s, 12*s, Math.PI * 1.05, -0.1, false);
    ctx.fill();
    DrawUtils._ellipse(ctx, -2*s, -71*s, 6*s, 6*s);

    // Glasses
    ctx.strokeStyle = '#604830';
    ctx.lineWidth = 1.5*s;
    ctx.strokeRect(-9*s, -59*s, 7*s, 5*s);
    ctx.strokeRect( 2*s, -59*s, 7*s, 5*s);
    ctx.beginPath();
    ctx.moveTo(-2*s, -57*s); ctx.lineTo(2*s, -57*s); ctx.stroke();

    // Eyes behind glasses
    ctx.fillStyle = '#302010';
    DrawUtils._ellipse(ctx, -5.5*s, -57*s, 2*s, 2*s);
    DrawUtils._ellipse(ctx,  5.5*s, -57*s, 2*s, 2*s);

    // Smile
    ctx.strokeStyle = '#c87840';
    ctx.lineWidth = 1.5*s;
    ctx.beginPath();
    ctx.arc(0, -53*s, 4*s, 0.1, Math.PI - 0.1, false);
    ctx.stroke();

    ctx.restore();
  },

  // Shared ellipse helper
  _ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  // Vignette overlay (darkens edges)
  vignette(ctx, w, h, strength = 0.6) {
    const g = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },

  // Rain-on-glass overlay (static texture, not animated)
  glassOverlay(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#0c1828';
    ctx.fillRect(0, 0, w, h);
    // Faint vertical streaks
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * w;
      const len = 30 + Math.random() * 80;
      const grad = ctx.createLinearGradient(x, 0, x, len);
      grad.addColorStop(0, 'rgba(200,220,240,0)');
      grad.addColorStop(0.5, 'rgba(200,220,240,0.35)');
      grad.addColorStop(1, 'rgba(200,220,240,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, Math.random() * h, 1.5, len);
    }
    ctx.restore();
  },
};
