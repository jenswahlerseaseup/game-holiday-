// ── Car Scene ─────────────────────────────────────────────────────────────────
// View from inside the car, looking forward through a wet windshield.
// Countryside rolls by.  Mom and Hiro exchange quiet words.
class CarScene extends Phaser.Scene {
  constructor() { super({ key: 'CarScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this._W = W; this._H = H;

    // ── static background ──────────────────────────────────────────────
    this._buildBackground(W, H);
    this._buildInterior(W, H);
    this._buildGlassOverlay(W, H);

    // ── scrolling parallax layers ──────────────────────────────────────
    this._scroll = { far: 0, mid: 0, near: 0 };
    this._bgScrollGfx  = this.add.graphics().setDepth(2);
    this._midScrollGfx = this.add.graphics().setDepth(3);
    this._fgScrollGfx  = this.add.graphics().setDepth(4);

    // ── rain on windshield (dynamic drips) ────────────────────────────
    this._drips = [];
    for (let i = 0; i < 35; i++) this._drips.push(this._newDrip(W, H));
    this._rainGfx = this.add.graphics().setDepth(8);

    // ── wiper arc ─────────────────────────────────────────────────────
    this._wiperAngle = -0.9;
    this._wiperDir   = 1;
    this._wiperGfx   = this.add.graphics().setDepth(9);
    this._wiperTimer  = 0;
    this._wiperPeriod = 1.1; // seconds per sweep

    // ── static rain (background, outside car) ─────────────────────────
    this._bgRain   = [];
    for (let i = 0; i < 120; i++) this._bgRain.push({
      x: Math.random() * W, y: Math.random() * H,
      vy: 280 + Math.random() * 180, vx: 55 + Math.random() * 30,
      len: 6 + Math.random() * 10, a: 0.15 + Math.random() * 0.3,
    });
    this._bgRainGfx = this.add.graphics().setDepth(5);

    // ── dialogue ──────────────────────────────────────────────────────
    this._dlg = new DialogueSystem(this, W, H);

    // ── fade in & start ───────────────────────────────────────────────
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.time.delayedCall(1200, () => this._startDialogue());
  }

  _buildBackground(W, H) {
    const tex = this.textures.createCanvas('car-bg', W, H);
    const ctx = tex.getContext();

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, '#0e1822');
    sky.addColorStop(1, '#243448');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.55);

    // Horizon glow (headlights reflecting off low clouds)
    DrawUtils.glow(ctx, W * 0.5, H * 0.52, 180, '#304870', 0.25);

    // Distant mountains
    DrawUtils.mountains(ctx, W, H * 0.46, '#0d1820', 6);

    // Far treeline
    DrawUtils.treeLine(ctx, W, H * 0.5, '#0a1210', 0.7);

    // Ground / road area
    const ground = ctx.createLinearGradient(0, H * 0.5, 0, H * 0.72);
    ground.addColorStop(0, '#141c1a');
    ground.addColorStop(1, '#0c1210');
    ctx.fillStyle = ground; ctx.fillRect(0, H * 0.5, W, H * 0.22);

    // Road
    DrawUtils.road(ctx, W, H);

    // Wet road sheen
    for (let i = 0; i < 6; i++) {
      DrawUtils.wetLine(ctx, 0, H * 0.75 + i * 10, W, 'rgba(50,80,100,0.2)');
    }

    // Fields on sides
    DrawUtils.field(ctx, 0, H * 0.48, W * 0.4, 60);
    DrawUtils.field(ctx, W * 0.6, H * 0.48, W * 0.4, 60);

    DrawUtils.vignette(ctx, W, H, 0.5);
    tex.refresh();
    this.add.image(0, 0, 'car-bg').setOrigin(0, 0).setDepth(1);
  }

  _buildInterior(W, H) {
    const tex = this.textures.createCanvas('car-int', W, H);
    const ctx = tex.getContext();

    // Dashboard — bottom strip
    const dash = ctx.createLinearGradient(0, H * 0.78, 0, H);
    dash.addColorStop(0, '#181c22');
    dash.addColorStop(1, '#0c0e12');
    ctx.fillStyle = dash; ctx.fillRect(0, H * 0.78, W, H);

    // Dashboard texture / panel lines
    ctx.strokeStyle = '#22282e'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H * 0.795); ctx.lineTo(W, H * 0.795); ctx.stroke();

    // Steering wheel (left side)
    ctx.strokeStyle = '#2a1e14'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(W * 0.18, H + 20, 80, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W * 0.18, H + 20); ctx.lineTo(W * 0.18, H * 0.8); ctx.stroke();

    // Speedometer glow
    DrawUtils.glow(ctx, W * 0.28, H * 0.9, 30, '#204060', 0.4);
    ctx.fillStyle = '#1a3050'; ctx.beginPath();
    ctx.arc(W * 0.28, H * 0.9, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8d8f0'; ctx.font = '8px monospace';
    ctx.fillText('60', W * 0.272, H * 0.905);

    // A-pillar (left)
    const pillarL = ctx.createLinearGradient(0, 0, W * 0.12, 0);
    pillarL.addColorStop(0, '#0a0c10');
    pillarL.addColorStop(1, 'rgba(10,12,16,0)');
    ctx.fillStyle = pillarL; ctx.fillRect(0, 0, W * 0.12, H);

    // A-pillar (right)
    const pillarR = ctx.createLinearGradient(W * 0.88, 0, W, 0);
    pillarR.addColorStop(0, 'rgba(10,12,16,0)');
    pillarR.addColorStop(1, '#0a0c10');
    ctx.fillStyle = pillarR; ctx.fillRect(W * 0.88, 0, W * 0.12, H);

    // Mom's silhouette (driving, left side)
    ctx.fillStyle = '#0c1018';
    // Body / seat profile
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(W * 0.07, H);
    ctx.lineTo(W * 0.1, H * 0.72);
    ctx.lineTo(W * 0.14, H * 0.55);
    ctx.bezierCurveTo(W * 0.16, H * 0.42, W * 0.21, H * 0.38, W * 0.2, H * 0.52);
    ctx.lineTo(W * 0.22, H * 0.7);
    ctx.lineTo(W * 0.24, H);
    ctx.closePath(); ctx.fill();

    // Hiro's silhouette — right side, head leaning slightly out
    ctx.fillStyle = '#0c1018';
    ctx.beginPath();
    ctx.moveTo(W, H);
    ctx.lineTo(W * 0.76, H);
    ctx.lineTo(W * 0.74, H * 0.72);
    ctx.lineTo(W * 0.76, H * 0.52);
    ctx.bezierCurveTo(W * 0.77, H * 0.40, W * 0.82, H * 0.34, W * 0.85, H * 0.38);
    ctx.bezierCurveTo(W * 0.88, H * 0.32, W * 0.92, H * 0.30, W * 0.93, H * 0.36);
    ctx.lineTo(W * 0.9, H * 0.52);
    ctx.lineTo(W * 0.92, H * 0.72);
    ctx.lineTo(W * 0.95, H);
    ctx.closePath(); ctx.fill();

    // Rear-view mirror
    ctx.fillStyle = '#181c24';
    ctx.fillRect(W * 0.47, H * 0.05, W * 0.06, H * 0.06);
    ctx.strokeStyle = '#22283a'; ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.47, H * 0.05, W * 0.06, H * 0.06);

    tex.refresh();
    this.add.image(0, 0, 'car-int').setOrigin(0, 0).setDepth(7);
  }

  _buildGlassOverlay(W, H) {
    const tex = this.textures.createCanvas('car-glass', W, H);
    const ctx = tex.getContext();
    DrawUtils.glassOverlay(ctx, W, H);
    // Windshield frame
    ctx.strokeStyle = 'rgba(12,14,20,0.9)';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, W - 14, H - 14);
    tex.refresh();
    this.add.image(0, 0, 'car-glass').setOrigin(0, 0).setDepth(6).setAlpha(0.75);
  }

  _newDrip(W, H) {
    return {
      x:     80 + Math.random() * (W - 160),
      y:     -5 - Math.random() * 50,
      vy:    12 + Math.random() * 20,
      len:   8  + Math.random() * 24,
      alpha: 0.2 + Math.random() * 0.5,
      veer:  (Math.random() - 0.5) * 0.4,
    };
  }

  _startDialogue() {
    const lines = [
      { speaker: 'Mom',   text: "We're almost there." },
      { speaker: 'Hiro',  text: "Does it always rain here?" },
      { speaker: 'Mom',   text: "Only in summer." },
      { speaker: '',      text: "The fields stretched all the way to the trees." },
      { speaker: 'Hiro',  text: "Is the forest big?" },
      { speaker: 'Mom',   text: "Big enough." },
      { speaker: '',      text: "They drove in silence for a while." },
      { speaker: 'Hiro',  text: "Will dad come visit?" },
      { speaker: 'Mom',   text: "..." },
      { speaker: 'Mom',   text: "Let's just enjoy the summer." },
      { speaker: '',      text: "A small sign passed in the dark:  FOREST RIDGE — 2 KM" },
    ];

    this._dlg.play(lines, () => this._arriveAtVillage());
  }

  _arriveAtVillage() {
    this.cameras.main.fadeOut(1400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('VillageScene');
    });
  }

  update(time, delta) {
    const W = this._W, H = this._H;
    const dt = delta / 1000;

    // Scroll far tree layer slowly
    this._scroll.far  += 18 * dt;
    this._scroll.mid  += 38 * dt;

    // Repaint scrolling trees
    this._bgScrollGfx.clear();
    this._bgScrollGfx.setAlpha(0.6);
    for (let i = -2; i < 5; i++) {
      const baseX = ((i * 220 - this._scroll.far) % (W + 220)) - 20;
      const seed  = i * 17.3;
      const h     = 50 + Math.abs(Math.sin(seed) * 20);
      // Tiny far tree silhouette
      this._bgScrollGfx.fillStyle(0x0a1410, 1);
      this._bgScrollGfx.fillRect(baseX, H * 0.5 - h, 5, h);
    }

    this._midScrollGfx.clear();
    for (let i = -2; i < 7; i++) {
      const baseX = ((i * 160 - this._scroll.mid) % (W + 200)) - 20;
      const seed  = i * 23.7;
      const h     = 30 + Math.abs(Math.sin(seed) * 18);
      this._midScrollGfx.fillStyle(0x080e08, 1);
      this._midScrollGfx.fillRect(baseX - 4, H * 0.52 - h, 9, h);
    }

    // Background rain
    this._bgRainGfx.clear();
    for (const r of this._bgRain) {
      r.x += r.vx * dt; r.y += r.vy * dt;
      if (r.y > H || r.x > W) { r.y = -10; r.x = Math.random() * W; }
      this._bgRainGfx.lineStyle(1, 0x90aabf, r.a);
      this._bgRainGfx.lineBetween(r.x, r.y, r.x - r.vx * 0.04, r.y - r.len);
    }

    // Windshield drips
    this._rainGfx.clear();
    for (const d of this._drips) {
      d.y  += d.vy * dt;
      d.x  += d.veer;
      if (d.y > H * 0.78 + 10 || d.x < 0 || d.x > W) {
        Object.assign(d, this._newDrip(W, H));
      }
      this._rainGfx.lineStyle(1.5, 0xb0c8e0, d.alpha);
      this._rainGfx.lineBetween(d.x, d.y - d.len, d.x, d.y);
      this._rainGfx.fillStyle(0xc0d4e8, d.alpha * 0.7);
      this._rainGfx.fillCircle(d.x, d.y, 2.2);
    }

    // Wiper
    this._wiperTimer += dt;
    const t = (this._wiperTimer % this._wiperPeriod) / this._wiperPeriod;
    // Ping-pong 0→1→0
    const swing = t < 0.5 ? t * 2 : (1 - t) * 2;
    const angle = -0.9 + swing * 1.8;
    this._wiperGfx.clear();
    this._wiperGfx.lineStyle(3, 0x1a2030, 0.9);
    const cx = W * 0.42, cy = H + 30, len = 170;
    this._wiperGfx.lineBetween(
      cx, cy,
      cx + Math.sin(angle) * len,
      cy - Math.cos(angle) * len,
    );
    // Clear a slight arc behind wiper
    this._wiperGfx.lineStyle(6, 0x06090f, 0.35);
    this._wiperGfx.beginPath();
    this._wiperGfx.arc(cx, cy, len * 0.85, Math.PI * 1.5 + (-0.9), Math.PI * 1.5 + angle, false);
    this._wiperGfx.strokePath();
  }
}
