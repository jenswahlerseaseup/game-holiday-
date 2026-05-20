// ── Opening Scene ─────────────────────────────────────────────────────────────
// Black screen.  Rain sounds.  "Summer, 1994" fades in.
// Click / any key starts the car scene.
class OpeningScene extends Phaser.Scene {
  constructor() { super({ key: 'OpeningScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // Pure black background
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 1).setDepth(0);

    // Procedural rain-on-glass layer (canvas texture)
    this._buildGlassTexture(W, H);

    const glass = this.add.image(0, 0, 'glass').setOrigin(0, 0).setAlpha(0).setDepth(1);
    this.tweens.add({ targets: glass, alpha: 0.9, delay: 800, duration: 2000, ease: 'Sine.easeIn' });

    // Animated drip graphics
    this._drips = [];
    this._dripGfx = this.add.graphics().setDepth(2).setAlpha(0);
    for (let i = 0; i < 18; i++) this._drips.push(this._newDrip(W, H));
    this.tweens.add({ targets: this._dripGfx, alpha: 0.7, delay: 1200, duration: 1800 });

    // Title text lines
    const lineStyle = {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '15px',
      color: '#a0b0c0',
      align: 'center',
    };

    const t1 = this.add.text(W/2, H/2 - 30, 'Summer, 1994', {
      ...lineStyle, fontSize: '22px', color: '#c0ccd8',
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    const t2 = this.add.text(W/2, H/2 + 10, 'A countryside house near the forest.', {
      ...lineStyle,
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    const t3 = this.add.text(W/2, H/2 + 50, '— click or press any key to begin —', {
      ...lineStyle, fontSize: '12px', color: '#5a6a7a',
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.tweens.add({ targets: t1, alpha: 1, delay: 2200, duration: 1800 });
    this.tweens.add({ targets: t2, alpha: 1, delay: 3800, duration: 1800 });
    this.tweens.add({ targets: t3, alpha: 1, delay: 5600, duration: 1200 });

    // Pulse the prompt
    this.time.delayedCall(6800, () => {
      this.tweens.add({
        targets: t3, alpha: { from: 0.9, to: 0.15 },
        yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut',
      });
    });

    // Start audio on first interaction (browser policy)
    const advance = () => {
      Audio.resume();
      Audio.startRain(0.32);
      Audio.startWipers(1100);
      // Delay 300ms before fade so rain can start
      this.time.delayedCall(300, () => {
        this.cameras.main.fadeOut(1200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          Audio.stopWipers();
          this.scene.start('CarScene');
        });
      });
      this.input.off('pointerdown', advance);
      this.input.keyboard.off('keydown', advance);
    };

    // Wait until the prompt is visible before accepting input
    this.time.delayedCall(5800, () => {
      this.input.once('pointerdown', advance);
      this.input.keyboard.once('keydown', advance);
    });
  }

  _buildGlassTexture(W, H) {
    const tex = this.textures.createCanvas('glass', W, H);
    const ctx = tex.getContext();

    // Dark overlay
    ctx.fillStyle = '#06090f';
    ctx.fillRect(0, 0, W, H);

    // Vertical streak highlights (condensation on glass)
    for (let i = 0; i < 40; i++) {
      const x   = Math.random() * W;
      const len = 40 + Math.random() * 120;
      const y   = Math.random() * H;
      const g   = ctx.createLinearGradient(x, y, x, y + len);
      const a   = 0.08 + Math.random() * 0.18;
      g.addColorStop(0,   'rgba(180,200,220,0)');
      g.addColorStop(0.4, `rgba(180,200,220,${a})`);
      g.addColorStop(1,   'rgba(180,200,220,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, 1 + Math.random(), len);
    }

    // Very faint outside silhouettes (trees passing in dark)
    ctx.fillStyle = 'rgba(8,14,10,0.45)';
    for (let x = 0; x < W; x += 60 + Math.random() * 40) {
      const h = 60 + Math.random() * 100;
      ctx.fillRect(x - 10, H * 0.3, 18, h);
    }

    tex.refresh();
  }

  _newDrip(W, H) {
    return {
      x:     30 + Math.random() * (W - 60),
      y:     -10 - Math.random() * 80,
      speed: 18 + Math.random() * 25,
      len:   12 + Math.random() * 30,
      alpha: 0.15 + Math.random() * 0.35,
      trail: [],
    };
  }

  update(time, delta) {
    const W = this.scale.width, H = this.scale.height;
    const dt = delta / 1000;
    this._dripGfx.clear();

    for (const d of this._drips) {
      d.y += d.speed * dt;
      d.trail.push({ x: d.x, y: d.y });
      if (d.trail.length > 6) d.trail.shift();

      this._dripGfx.lineStyle(1.5, 0xb0c8e0, d.alpha);
      this._dripGfx.beginPath();
      this._dripGfx.moveTo(d.x, d.y - d.len);
      this._dripGfx.lineTo(d.x, d.y);
      this._dripGfx.strokePath();

      // Small bead at head
      this._dripGfx.fillStyle(0xc0d4e8, d.alpha * 0.8);
      this._dripGfx.fillCircle(d.x, d.y, 2);

      if (d.y > H + 20) {
        d.y   = -10 - Math.random() * 60;
        d.x   = 30 + Math.random() * (W - 60);
        d.len = 12 + Math.random() * 30;
        d.trail = [];
      }
    }
  }
}
