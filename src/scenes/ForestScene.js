// ── Forest Scene ──────────────────────────────────────────────────────────────
// The summer house exterior at dusk/night.
// Hiro pauses at the door — and sees something between the trees.
class ForestScene extends Phaser.Scene {
  constructor() { super({ key: 'ForestScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this._W = W; this._H = H;

    this._buildBackground(W, H);
    this._buildForeground(W, H);
    this._buildHiro(W, H);

    this._dlg    = new DialogueSystem(this, W, H);
    this._eyeGfx = this.add.graphics().setDepth(8);
    this._eyeGfx.setAlpha(0);

    // Rain fades to lighter (cicadas begin)
    this._rainGfx  = this.add.graphics().setDepth(6).setScrollFactor(0);
    this._rain     = [];
    for (let i = 0; i < 60; i++) {
      this._rain.push({
        x: Math.random() * W, y: Math.random() * H,
        vy: 200 + Math.random() * 100, vx: 30 + Math.random() * 20,
        len: 5 + Math.random() * 8, a: 0.08 + Math.random() * 0.15,
      });
    }

    // Leaves rustling system
    this._leaves   = [];
    this._leafGfx  = this.add.graphics().setDepth(7);

    this._phase    = 'arrive'; // arrive → pause → look → creature → inside

    this.cameras.main.fadeIn(1400, 0, 0, 0);

    this.time.delayedCall(1600, () => this._arriveDialogue());
  }

  _buildBackground(W, H) {
    const tex = this.textures.createCanvas('forest-bg', W, H);
    const ctx = tex.getContext();

    // Dusk sky — slightly lighter than night, hint of dark blue-green
    DrawUtils.sky(ctx, W, H, '#0a1418', '#1a2e28');
    DrawUtils.glow(ctx, W * 0.15, H * 0.08, 120, '#102820', 0.5); // moon glow

    // Distant mountains, very dark
    DrawUtils.mountains(ctx, W, H * 0.42, '#0c1810', 3);

    // Forest — fills the right side and background
    DrawUtils.treeLine(ctx, W, H * 0.46, '#060c06', 1.8);
    // A second closer treeline for depth
    for (let x = W * 0.45; x < W + 30; x += 22 + Math.sin(x * 0.12) * 8) {
      const h = 80 + Math.abs(Math.sin(x * 0.09) * 50);
      DrawUtils.tree(ctx, x, H * 0.68, h, '#040808');
    }

    // Ground
    const grd = ctx.createLinearGradient(0, H * 0.66, 0, H);
    grd.addColorStop(0, '#0e1810');
    grd.addColorStop(1, '#060c08');
    ctx.fillStyle = grd; ctx.fillRect(0, H * 0.66, W, H);

    // Path from house to forest
    ctx.fillStyle = '#141c14';
    ctx.beginPath();
    ctx.moveTo(W * 0.3, H * 0.68);
    ctx.lineTo(W * 0.25, H);
    ctx.lineTo(W * 0.45, H);
    ctx.lineTo(W * 0.5, H * 0.68);
    ctx.closePath(); ctx.fill();

    // Overgrown grass along path
    ctx.strokeStyle = '#1a2e18';
    ctx.lineWidth = 2;
    for (let gx = W * 0.25; gx < W * 0.5; gx += 8) {
      const bx = gx + Math.sin(gx * 0.3) * 4;
      const by = H * 0.69 + Math.random() * (H - H * 0.69);
      ctx.beginPath();
      ctx.moveTo(bx, by + 10);
      ctx.lineTo(bx - 3, by);
      ctx.stroke();
    }

    DrawUtils.vignette(ctx, W, H, 0.55);
    tex.refresh();
    this.add.image(0, 0, 'forest-bg').setOrigin(0, 0).setDepth(1);
  }

  _buildForeground(W, H) {
    const tex = this.textures.createCanvas('forest-house', W, H);
    const ctx = tex.getContext();

    // Summer house — left side of scene
    const hx = 40, hy = H * 0.32, hw = 300, hh = H * 0.36;

    // House body
    ctx.fillStyle = '#1a1810';
    ctx.fillRect(hx, hy, hw, hh);

    // Roof (sloped gable)
    ctx.fillStyle = '#14100a';
    ctx.beginPath();
    ctx.moveTo(hx - 18, hy);
    ctx.lineTo(hx + hw / 2, hy - 60);
    ctx.lineTo(hx + hw + 18, hy);
    ctx.closePath(); ctx.fill();

    // Roof ridge
    ctx.strokeStyle = '#0e0c08'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx - 18, hy); ctx.lineTo(hx + hw + 18, hy); ctx.stroke();

    // Window — warm glow inside
    DrawUtils.glow(ctx, hx + 90, hy + 50, 55, '#ffcc60', 0.45);
    ctx.fillStyle = '#ffd070';
    ctx.fillRect(hx + 65, hy + 30, 50, 40);
    ctx.strokeStyle = '#2c2010'; ctx.lineWidth = 3;
    ctx.strokeRect(hx + 65, hy + 30, 50, 40);
    // Window cross
    ctx.beginPath();
    ctx.moveTo(hx + 90, hy + 30); ctx.lineTo(hx + 90, hy + 70);
    ctx.moveTo(hx + 65, hy + 50); ctx.lineTo(hx + 115, hy + 50);
    ctx.stroke();

    // Second window (dim)
    ctx.fillStyle = '#cc9030';
    ctx.fillRect(hx + 160, hy + 35, 40, 32);
    ctx.strokeStyle = '#2c2010'; ctx.lineWidth = 2;
    ctx.strokeRect(hx + 160, hy + 35, 40, 32);

    // Door
    ctx.fillStyle = '#2a1e12';
    ctx.fillRect(hx + 110, hy + hh - 70, 38, 70);
    ctx.strokeStyle = '#3c2c18'; ctx.lineWidth = 2;
    ctx.strokeRect(hx + 110, hy + hh - 70, 38, 70);
    // Door knob
    ctx.fillStyle = '#c09030';
    ctx.beginPath(); ctx.arc(hx + 145, hy + hh - 35, 3, 0, Math.PI * 2); ctx.fill();

    // Steps
    ctx.fillStyle = '#1a2018';
    ctx.fillRect(hx + 100, hy + hh, 60, 10);
    ctx.fillRect(hx + 95, hy + hh + 10, 70, 10);

    // Porch wind-chime (faint chain)
    ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 1;
    for (let cx = hx + 84; cx < hx + 105; cx += 5) {
      ctx.beginPath();
      ctx.moveTo(cx, hy - 2); ctx.lineTo(cx, hy + 18); ctx.stroke();
    }

    // Overgrown stone lantern
    ctx.fillStyle = '#282820';
    ctx.fillRect(hx + 52, hy + hh - 30, 18, 30);
    ctx.fillRect(hx + 48, hy + hh - 32, 26, 8);
    DrawUtils.glow(ctx, hx + 61, hy + hh - 15, 20, '#ffaa40', 0.35);

    tex.refresh();
    this.add.image(0, 0, 'forest-house').setOrigin(0, 0).setDepth(3);
  }

  _buildHiro(W, H) {
    const tex = this.textures.createCanvas('hiro-fg', 36, 74);
    const ctx = tex.getContext();
    DrawUtils.boy(ctx, 18, 70, 'right', 0.85);
    tex.refresh();
    this._hiro = this.add.image(W * 0.38, H * 0.68, 'hiro-fg')
      .setOrigin(0.5, 1).setDepth(5);
  }

  _arriveDialogue() {
    Audio.stopRain(3);
    Audio.startCicadas(0.08);

    this._dlg.play([
      { speaker: '',     text: "The rain had softened to a whisper." },
      { speaker: '',     text: "He stood at the steps with his suitcase." },
    ], () => this._pauseMoment());
  }

  _pauseMoment() {
    this._phase = 'pause';
    // A beat of silence — just the cicadas
    this.time.delayedCall(2800, () => this._lookAtForest());
  }

  _lookAtForest() {
    this._phase = 'look';

    // Hiro turns slightly — small tween to mimic looking
    this.tweens.add({
      targets: this._hiro,
      x: this._hiro.x + 18,
      duration: 600,
      ease: 'Sine.easeInOut',
      onComplete: () => this._spawnCreature(),
    });
  }

  _spawnCreature() {
    this._phase = 'creature';
    Audio.chime(); // soft distant sound

    // Eyes appear — two soft glowing dots between the trees (right side)
    const eyeX1 = this._W * 0.74, eyeX2 = this._W * 0.80;
    const eyeY  = this._H * 0.56;

    this.tweens.add({
      targets: this._eyeGfx,
      alpha: 1,
      duration: 800,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Blink
        this.tweens.add({
          targets: this._eyeGfx,
          alpha: { from: 1, to: 0 },
          duration: 120,
          yoyo: true,
          delay: 600,
          onComplete: () => {
            this.time.delayedCall(400, () => {
              this._creatureDashes();
            });
          },
        });
      },
    });

    this._eyeX1 = eyeX1; this._eyeX2 = eyeX2; this._eyeY = eyeY;

    // Spawn rustling leaves
    for (let i = 0; i < 12; i++) {
      this._leaves.push({
        x: eyeX1 + (Math.random() - 0.5) * 80,
        y: eyeY  + (Math.random() - 0.5) * 40,
        vx: -30 - Math.random() * 50,
        vy: -20 - Math.random() * 30,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 4,
        life: 1.0,
        maxLife: 0.8 + Math.random() * 0.6,
      });
    }
  }

  _creatureDashes() {
    // Eyes rapidly move right and disappear
    this.tweens.add({
      targets: this._eyeGfx,
      x: 80,
      duration: 220,
      ease: 'Power2',
      onUpdate: (tween) => {
        this._eyeOffsetX = tween.getValue();
      },
      onComplete: () => {
        this.tweens.add({
          targets: this._eyeGfx, alpha: 0, duration: 180,
          onComplete: () => this._afterCreature(),
        });
      },
    });
    this._eyeDashing = true;
  }

  _afterCreature() {
    this._phase = 'after';
    this.time.delayedCall(1200, () => {
      this._dlg.play([
        { speaker: 'Hiro', text: "..." },
        { speaker: 'Hiro', text: "Was that...?" },
        { speaker: '',     text: "He looked again. The forest was still." },
        { speaker: 'Hiro', text: "...Okay." },
        { speaker: '',     text: "He picked up his suitcase and went inside." },
        { speaker: '',     text: "But he kept thinking about those eyes." },
      ], () => this._endScene());
    });
  }

  _endScene() {
    Audio.stopCicadas(2);
    this.cameras.main.fadeOut(1800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ShopScene');
    });
  }

  update(time, delta) {
    const W = this._W, H = this._H;
    const dt = delta / 1000;

    // Rain (light)
    this._rainGfx.clear();
    for (const r of this._rain) {
      r.x += r.vx * dt; r.y += r.vy * dt;
      if (r.y > H || r.x > W) { r.y = -8; r.x = Math.random() * W; }
      this._rainGfx.lineStyle(1, 0x90aabf, r.a);
      this._rainGfx.lineBetween(r.x, r.y, r.x - r.vx * 0.03, r.y - r.len);
    }

    // Leaf particles
    this._leafGfx.clear();
    for (let i = this._leaves.length - 1; i >= 0; i--) {
      const l = this._leaves[i];
      l.x   += l.vx * dt;
      l.y   += l.vy * dt;
      l.vy  += 18 * dt; // gravity
      l.rot += l.vrot * dt;
      l.life -= dt / l.maxLife;
      if (l.life <= 0) { this._leaves.splice(i, 1); continue; }

      const a = l.life * 0.7;
      this._leafGfx.fillStyle(0x2a4a28, a);
      this._leafGfx.fillRect(l.x - 4, l.y - 2, 8, 4);
    }

    // Creature eyes
    if (this._eyeX1 && this._eyeGfx.alpha > 0) {
      const dx     = this._eyeDashing ? (this._eyeOffsetX || 0) : 0;
      const pulse  = 0.7 + Math.sin(time * 0.003) * 0.2;
      const eyeA   = this._eyeGfx.alpha;

      this._eyeGfx.clear();

      const ex1 = this._eyeX1 + dx, ex2 = this._eyeX2 + dx;
      const ey  = this._eyeY;

      // Outer halo
      this._eyeGfx.fillStyle(0x224422, 0.3 * pulse * eyeA);
      this._eyeGfx.fillCircle(ex1, ey, 18 * pulse);
      this._eyeGfx.fillCircle(ex2, ey, 18 * pulse);

      // Main glow
      this._eyeGfx.fillStyle(0x88ffaa, 0.55 * pulse * eyeA);
      this._eyeGfx.fillCircle(ex1, ey, 10 * pulse);
      this._eyeGfx.fillCircle(ex2, ey, 10 * pulse);

      // Bright core
      this._eyeGfx.fillStyle(0xeeffee, 0.9 * eyeA);
      this._eyeGfx.fillCircle(ex1, ey, 4 * pulse);
      this._eyeGfx.fillCircle(ex2, ey, 4 * pulse);

      // Pupil
      this._eyeGfx.fillStyle(0x040804, 0.8 * eyeA);
      this._eyeGfx.fillCircle(ex1, ey, 2.2);
      this._eyeGfx.fillCircle(ex2, ey, 2.2);
    }

    // Hiro subtle idle sway
    if (this._phase !== 'creature') {
      this._hiro.y = this._H * 0.68 + Math.sin(time * 0.0008) * 1.5;
    }
  }
}
