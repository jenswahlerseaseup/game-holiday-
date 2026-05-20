// ── Shop Scene ────────────────────────────────────────────────────────────────
// The next morning.  Hiro visits the village grocery shop on an errand.
// He meets Kenta — a man whose eyes hold nothing.
class ShopScene extends Phaser.Scene {
  constructor() { super({ key: 'ShopScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this._W = W; this._H = H;

    this._buildInterior(W, H);
    this._buildCharacters(W, H);

    this._dlg = new DialogueSystem(this, W, H);

    // Dust motes (warm, slow particles)
    this._motes = [];
    for (let i = 0; i < 28; i++) this._motes.push(this._newMote(W, H));
    this._moteGfx = this.add.graphics().setDepth(6);

    this.cameras.main.fadeIn(1600, 0, 0, 0);
    this.time.delayedCall(1800, () => this._startScene());
  }

  _buildInterior(W, H) {
    const tex = this.textures.createCanvas('shop-bg', W, H);
    const ctx = tex.getContext();

    // Warm interior — cream/amber walls
    const wall = ctx.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, '#1c1610');
    wall.addColorStop(1, '#261e14');
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);

    // Floor — dark wood planks
    ctx.fillStyle = '#181008';
    ctx.fillRect(0, H * 0.74, W, H);
    ctx.strokeStyle = '#201408'; ctx.lineWidth = 1.5;
    for (let x = 30; x < W; x += 60 + Math.sin(x * 0.02) * 10) {
      ctx.beginPath();
      ctx.moveTo(x, H * 0.74); ctx.lineTo(x, H); ctx.stroke();
    }
    // Floor horizontal grain
    for (let y = H * 0.76; y < H; y += 10) {
      ctx.strokeStyle = `rgba(28,18,8,${0.3 + Math.sin(y * 0.2) * 0.1})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Ceiling lamp glow
    DrawUtils.glow(ctx, W * 0.5, 0, 240, '#ffcc60', 0.4);
    DrawUtils.glow(ctx, W * 0.5, 0, 120, '#ffe090', 0.3);

    // Lamp fixture
    ctx.fillStyle = '#2c2010';
    ctx.fillRect(W * 0.5 - 30, 0, 60, 14);
    ctx.strokeStyle = '#3a2c18'; ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.5 - 30, 0, 60, 14);
    // Cord
    ctx.strokeStyle = '#201810'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 0); ctx.lineTo(W * 0.5, -20); ctx.stroke();

    // ── Shelves ──────────────────────────────────────────────────────

    // Back wall shelves (left section)
    this._drawShelfUnit(ctx, 30, H * 0.18, 280, H * 0.50);

    // Back wall shelves (right section)
    this._drawShelfUnit(ctx, W - 310, H * 0.18, 280, H * 0.50);

    // Counter (centre-left)
    this._drawCounter(ctx, W * 0.12, H * 0.58, W * 0.38, H * 0.16, W, H);

    // Window — morning light spilling in
    DrawUtils.glow(ctx, W * 0.82, H * 0.25, 100, '#ffe0a0', 0.4);
    ctx.fillStyle = '#ffe8b0';
    ctx.fillRect(W * 0.76, H * 0.08, 100, 90);
    ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 4;
    ctx.strokeRect(W * 0.76, H * 0.08, 100, 90);
    ctx.beginPath();
    ctx.moveTo(W * 0.826, H * 0.08); ctx.lineTo(W * 0.826, H * 0.08 + 90);
    ctx.moveTo(W * 0.76, H * 0.08 + 45); ctx.lineTo(W * 0.76 + 100, H * 0.08 + 45);
    ctx.stroke();

    // Door (right side, screen door feel)
    ctx.fillStyle = '#1e1608';
    ctx.fillRect(W * 0.86, H * 0.3, W * 0.12, H * 0.44);
    ctx.strokeStyle = '#2c2010'; ctx.lineWidth = 3;
    ctx.strokeRect(W * 0.86, H * 0.3, W * 0.12, H * 0.44);
    // Door cross bars
    for (let dy = H * 0.34; dy < H * 0.72; dy += (H * 0.44 / 4)) {
      ctx.beginPath();
      ctx.moveTo(W * 0.86, dy); ctx.lineTo(W * 0.98, dy); ctx.stroke();
    }
    // Bell above door
    ctx.fillStyle = '#c09030';
    ctx.beginPath(); ctx.arc(W * 0.92, H * 0.3 - 8, 5, 0, Math.PI * 2); ctx.fill();

    DrawUtils.vignette(ctx, W, H, 0.4);
    tex.refresh();
    this.add.image(0, 0, 'shop-bg').setOrigin(0, 0).setDepth(1);
  }

  _drawShelfUnit(ctx, x, y, w, h) {
    // Frame
    ctx.fillStyle = '#2a1e0e';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Shelves
    const shelfCount = 4;
    const shelfH = (h - 8) / shelfCount;
    ctx.fillStyle = '#2a1e0e';
    for (let i = 0; i <= shelfCount; i++) {
      ctx.fillRect(x + 4, y + 4 + i * shelfH - 3, w - 8, 5);
    }

    // Items on shelves (abstract goods — cans, bottles, boxes)
    const colours = ['#8a4030', '#305080', '#406030', '#806020', '#504040', '#304860'];
    for (let s = 0; s < shelfCount; s++) {
      const sy = y + 4 + s * shelfH + 8;
      let ix = x + 10;
      while (ix < x + w - 14) {
        const itemW = 10 + Math.floor(Math.random() * 12);
        const itemH = 16 + Math.floor(Math.random() * 14);
        const col   = colours[Math.floor(Math.random() * colours.length)];
        ctx.fillStyle = col;
        ctx.fillRect(ix, sy + shelfH - itemH - 6, itemW, itemH);
        // Label
        ctx.fillStyle = 'rgba(240,230,210,0.4)';
        ctx.fillRect(ix + 1, sy + shelfH - itemH - 2, itemW - 2, 5);
        ix += itemW + 4 + Math.floor(Math.random() * 6);
      }
    }
  }

  _drawCounter(ctx, x, y, w, h, W, H) {
    // Counter body
    ctx.fillStyle = '#2c2010';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#3a2c18';
    ctx.fillRect(x, y, w, 8); // top edge
    ctx.strokeStyle = '#4a3c24'; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Cash register silhouette
    ctx.fillStyle = '#201808';
    ctx.fillRect(x + w - 70, y - 38, 52, 38);
    ctx.fillStyle = '#181008';
    ctx.fillRect(x + w - 66, y - 34, 44, 22);
    // Screen glow
    DrawUtils.glow(ctx, x + w - 44, y - 23, 18, '#90c040', 0.45);
    ctx.fillStyle = '#60a030';
    ctx.fillRect(x + w - 55, y - 30, 22, 14);

    // Small items on counter (paper bag, etc.)
    ctx.fillStyle = '#c8a060';
    ctx.fillRect(x + 20, y - 22, 40, 22);
    ctx.fillStyle = '#e0b878';
    ctx.fillRect(x + 22, y - 24, 36, 4);
  }

  _buildCharacters(W, H) {
    const ground = H * 0.74 - 2;

    // Shop owner behind counter
    const ownerTex = this.textures.createCanvas('harue', 34, 72);
    DrawUtils.shopOwner(ownerTex.getContext(), 17, 68, 'right', 0.82);
    ownerTex.refresh();
    this._harue = this.add.image(W * 0.32, ground - 48, 'harue')
      .setOrigin(0.5, 1).setDepth(4);

    // Kenta — stands at the counter, facing left
    const kentaTex = this.textures.createCanvas('kenta', 38, 76);
    DrawUtils.kenta(kentaTex.getContext(), 19, 72, 'left', 0.9);
    kentaTex.refresh();
    this._kenta = this.add.image(W * 0.28, ground, 'kenta')
      .setOrigin(0.5, 1).setDepth(5);

    // Hiro — enters from right, smaller
    const hiroTex = this.textures.createCanvas('hiro-shop', 30, 62);
    DrawUtils.boy(hiroTex.getContext(), 15, 58, 'left', 0.72);
    hiroTex.refresh();
    this._hiro = this.add.image(W * 0.82, ground, 'hiro-shop')
      .setOrigin(0.5, 1).setDepth(5).setAlpha(0);

    // Kenta greyscale-ish (desaturation via tint)
    this._kenta.setTint(0xb0b8c0); // slightly cool, drained
  }

  _startScene() {
    this._dlg.play([
      { speaker: '',       text: "The next morning was grey and still." },
      { speaker: 'Mom',    text: "Go to Harue's shop — the one near the post box. Get rice and tofu." },
      { speaker: 'Hiro',   text: "By myself?" },
      { speaker: 'Mom',    text: "It's three minutes away. You'll be fine." },
    ], () => this._hiroEnters());
  }

  _hiroEnters() {
    // Slide Hiro in from the right
    this._hiro.setAlpha(1).x = this._W * 1.02;
    this.tweens.add({
      targets: this._hiro,
      x: this._W * 0.68,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => this._shopDialogue(),
    });
  }

  _shopDialogue() {
    this._dlg.play([
      { speaker: 'Harue',  text: "Oh! A new face. You must be the ones renting the Mizuki house." },
      { speaker: 'Hiro',   text: "Yes. My mom sent me for groceries." },
      { speaker: 'Harue',  text: "Of course, of course. Take your time." },
      { speaker: '',       text: "He looked around the shop. Then he noticed the man at the counter." },
    ], () => this._kentaMoment());
  }

  _kentaMoment() {
    // Kenta slowly turns, then drops coins
    this.tweens.add({
      targets: this._kenta,
      x: this._W * 0.24,
      duration: 1400,
      ease: 'Sine.easeInOut',
      onComplete: () => this._coinsDropped(),
    });
  }

  _coinsDropped() {
    // Coin flash: small gfx
    const g = this.add.graphics().setDepth(7);
    g.fillStyle(0xc8a838, 0.8);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(
        this._W * 0.26 + (Math.random() - 0.5) * 40,
        this._H * 0.74 - 4,
        3 + Math.random() * 3,
      );
    }
    this.time.delayedCall(2000, () => g.destroy());

    this._dlg.play([
      { speaker: '',       text: "He dropped his coins. They scattered across the floor." },
      { speaker: '',       text: "Hiro picked them up." },
      { speaker: 'Hiro',   text: "Here." },
      { speaker: '',       text: "Kenta looked at the coins for a long moment.  Then at the boy." },
      { speaker: 'Kenta',  text: "...Thank you." },
      { speaker: '',       text: "His eyes didn't focus.  He turned and walked out slowly." },
      { speaker: '',       text: "The bell above the door rang once." },
      { speaker: '',       text: "Then silence." },
    ], () => this._afterKenta());
  }

  _afterKenta() {
    // Kenta exits
    this.tweens.add({
      targets: this._kenta,
      x: this._W * 1.1,
      alpha: 0,
      duration: 1000,
      ease: 'Sine.easeIn',
    });

    this.time.delayedCall(600, () => {
      this._dlg.play([
        { speaker: 'Harue',  text: "Don't mind him.  That's Kenta.  Poor man." },
        { speaker: 'Hiro',   text: "Is he sick?" },
        { speaker: 'Harue',  text: "He went into the forest.  Last spring." },
        { speaker: 'Hiro',   text: "...Oh." },
        { speaker: 'Harue',  text: "Will you be here all summer?  The festival is next month—" },
        { speaker: '',       text: "She changed the subject quickly, already scanning the groceries." },
        { speaker: '',       text: "Hiro said nothing.  He kept thinking about the word she'd used." },
        { speaker: '',       text: "Went." },
        { speaker: '',       text: "Not 'was in.'  Not 'visited.'" },
        { speaker: '',       text: "Went." },
      ], () => this._endChapter());
    });
  }

  _endChapter() {
    this.cameras.main.fadeOut(2000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('EndScene');
    });
  }

  _newMote(W, H) {
    return {
      x: Math.random() * W,
      y: H * 0.1 + Math.random() * H * 0.6,
      vx: (Math.random() - 0.5) * 8,
      vy: -3 - Math.random() * 6,
      r:  0.8 + Math.random() * 1.8,
      a:  0.1 + Math.random() * 0.25,
      life: Math.random(),
    };
  }

  update(time, delta) {
    const W = this._W, H = this._H;
    const dt = delta / 1000;

    this._moteGfx.clear();
    for (let i = this._motes.length - 1; i >= 0; i--) {
      const m = this._motes[i];
      m.x += m.vx * dt; m.y += m.vy * dt;
      m.life += dt * 0.15;
      if (m.y < 0 || m.x < 0 || m.x > W || m.life > 1) {
        this._motes[i] = this._newMote(W, H);
        continue;
      }
      const pulse = Math.sin(m.life * Math.PI);
      this._moteGfx.fillStyle(0xffe0a0, m.a * pulse);
      this._moteGfx.fillCircle(m.x, m.y, m.r);
    }
  }
}
