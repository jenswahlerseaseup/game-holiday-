// ── Village Scene ─────────────────────────────────────────────────────────────
// Hiro and his mom walk through the village at night in the rain.
// Camera scrolls right.  Environmental storytelling: lights, rice fields, cats.
class VillageScene extends Phaser.Scene {
  constructor() { super({ key: 'VillageScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this._W = W; this._H = H;

    // The world is wider than the screen — we pan through it
    this._worldW = W * 2.8;

    this._buildPanorama(this._worldW, H);
    this._buildRain(W, H);
    this._buildCharacters(H);

    this._dlg = new DialogueSystem(this, W, H);

    // Start camera pan  position
    this.cameras.main.setBounds(0, 0, this._worldW, H);
    this.cameras.main.scrollX = 0;
    this._targetScrollX = 0;
    this._walking = false;
    this._walkTimer = 0;
    this._boyX = 60;
    this._momX = 30;
    this._stepTimer = 0;
    this._stepOffset = 0;

    // Lantern flicker
    this._lanternFlicker = [];
    this._lanternGfx = this.add.graphics().setDepth(4).setScrollFactor(1);

    // Lanterns positioned in world space (x, y, radius, warmth)
    this._lanterns = [
      { x: 480, y: H * 0.62, r: 60, warm: '#ffcc60' },
      { x: 820, y: H * 0.60, r: 55, warm: '#ffaa40' },
      { x: 1240, y: H * 0.62, r: 65, warm: '#ffd080' },
      { x: 1600, y: H * 0.60, r: 50, warm: '#ffcc60' },
      { x: 2050, y: H * 0.63, r: 70, warm: '#ffaa40' },
    ];

    // Chime spots (x in world space)
    this._chimeSpots = [480, 1240, 2050];
    this._chimeTriggered = new Set();

    this.cameras.main.fadeIn(1200, 0, 0, 0);

    this.time.delayedCall(1400, () => {
      this._dlg.play([
        { speaker: '',      text: "The village felt like it had always been here." },
        { speaker: 'Mom',   text: "This is it. Forest Ridge." },
        { speaker: 'Hiro',  text: "It's really quiet." },
        { speaker: 'Mom',   text: "People sleep early here." },
      ], () => this._startWalking());
    });
  }

  _buildPanorama(W, H) {
    const tex = this.textures.createCanvas('village-bg', W, H);
    const ctx = tex.getContext();

    // Sky
    DrawUtils.sky(ctx, W, H, '#0a1020', '#1e2e40');

    // Distant forest silhouette — runs full width in background
    DrawUtils.treeLine(ctx, W, H * 0.38, '#080e08', 1.2);

    // Mountain range further back
    DrawUtils.mountains(ctx, W, H * 0.34, '#0c1418', 4);

    // Ground — wet night
    const grd = ctx.createLinearGradient(0, H * 0.65, 0, H);
    grd.addColorStop(0, '#141c18');
    grd.addColorStop(1, '#0a100e');
    ctx.fillStyle = grd; ctx.fillRect(0, H * 0.65, W, H);

    // Street / path — slightly lighter
    ctx.fillStyle = '#181e24';
    ctx.fillRect(0, H * 0.72, W, H - H * 0.72);

    // Wet road reflections
    for (let i = 0; i < 8; i++) {
      DrawUtils.wetLine(ctx, 0, H * 0.73 + i * 14, W, 'rgba(40,60,80,0.18)');
    }

    // Rice fields (between buildings, mid-bg)
    for (let fx = 300; fx < W; fx += 380 + Math.sin(fx * 0.01) * 80) {
      DrawUtils.field(ctx, fx, H * 0.55, 120 + Math.abs(Math.sin(fx) * 60), 80);
    }

    // ── Buildings ──────────────────────────────────────────────────────
    const buildings = [
      { x: 100,  w: 130, h: 120, floors: 2 },
      { x: 260,  w: 90,  h: 90,  floors: 1 },
      { x: 420,  w: 160, h: 140, floors: 2 },
      { x: 650,  w: 110, h: 100, floors: 2 },
      { x: 830,  w: 140, h: 130, floors: 2 },
      { x: 1050, w: 80,  h: 80,  floors: 1 },
      { x: 1200, w: 170, h: 145, floors: 3 },
      { x: 1450, w: 100, h: 95,  floors: 2 },
      { x: 1620, w: 130, h: 115, floors: 2 },
      { x: 1850, w: 95,  h: 88,  floors: 1 },
      { x: 2020, w: 155, h: 130, floors: 2 },
      { x: 2240, w: 110, h: 100, floors: 2 },
      { x: 2410, w: 140, h: 120, floors: 2 },
    ];

    for (const b of buildings) {
      DrawUtils.building(ctx, b.x, H * 0.65 - b.h, b.w, b.h, '#ffcc60', b.floors);
    }

    // Foreground brush / fence posts
    ctx.fillStyle = '#0c140e';
    for (let x = 0; x < W; x += 70 + Math.sin(x * 0.02) * 20) {
      const fh = 8 + Math.sin(x * 0.1) * 5;
      ctx.fillRect(x, H * 0.72 - fh, 4, fh);
    }

    // Occasional lamp post
    for (let x = 200; x < W; x += 340 + Math.cos(x * 0.005) * 60) {
      ctx.fillStyle = '#141820';
      ctx.fillRect(x, H * 0.50, 5, H * 0.22);
      // Lamp head
      DrawUtils.glow(ctx, x + 2, H * 0.50, 28, '#ffcc60', 0.35);
      ctx.fillStyle = '#ffcc60';
      ctx.fillRect(x - 6, H * 0.498, 14, 6);
    }

    // Small details: vending machine glow (very Japanese)
    DrawUtils.glow(ctx, 720, H * 0.68, 35, '#3060c0', 0.45);
    ctx.fillStyle = '#1838a0';
    ctx.fillRect(710, H * 0.61, 20, 80);
    ctx.fillStyle = '#c0d8ff';
    ctx.fillRect(713, H * 0.63, 14, 12);
    ctx.fillRect(713, H * 0.77, 14, 10);

    DrawUtils.vignette(ctx, W, H, 0.35);
    tex.refresh();

    // Image is as wide as the world
    this.add.image(0, 0, 'village-bg').setOrigin(0, 0).setDepth(1).setScrollFactor(1);
  }

  _buildRain(W, H) {
    this._rainGfx = this.add.graphics().setDepth(6).setScrollFactor(0);
    this._rain = [];
    for (let i = 0; i < 150; i++) {
      this._rain.push({
        x: Math.random() * W, y: Math.random() * H,
        vy: 260 + Math.random() * 160, vx: 50 + Math.random() * 25,
        len: 7 + Math.random() * 11, a: 0.12 + Math.random() * 0.25,
      });
    }
  }

  _buildCharacters(H) {
    // Draw boy and mom onto textures
    this._boyTex = this.textures.createCanvas('boy-walk', 40, 80);
    const bc = this._boyTex.getContext();
    DrawUtils.boy(bc, 20, 76, 'right', 0.9);
    this._boyTex.refresh();

    this._momTex = this.textures.createCanvas('mom-walk', 36, 84);
    const mc = this._momTex.getContext();
    DrawUtils.mom(mc, 18, 80, 'right', 0.88);
    this._momTex.refresh();

    const groundY = H * 0.72 - 2;
    this._boySprite = this.add.image(this._boyX, groundY, 'boy-walk')
      .setOrigin(0.5, 1).setDepth(5);
    this._momSprite = this.add.image(this._momX, groundY, 'mom-walk')
      .setOrigin(0.5, 1).setDepth(5);
  }

  _startWalking() {
    this._walking = true;
    Audio.startWind(0.12);
  }

  _chimeCheck(worldX) {
    for (const cx of this._chimeSpots) {
      if (!this._chimeTriggered.has(cx) && Math.abs(worldX - cx) < 60) {
        this._chimeTriggered.add(cx);
        Audio.chime();
      }
    }
  }

  _midDialogue() {
    this._walking = false;
    this._dlg.play([
      { speaker: 'Hiro', text: "Who lives there?" },
      { speaker: 'Mom',  text: "I don't know everyone yet." },
      { speaker: '',     text: "An old man watched from an upstairs window. He didn't wave." },
      { speaker: 'Hiro', text: "Is the forest close?" },
      { speaker: 'Mom',  text: "Just past the house. Don't go near it." },
      { speaker: 'Hiro', text: "Why?" },
      { speaker: 'Mom',  text: "...Because it gets dark fast in there." },
    ], () => {
      this._walking = true;
    });
  }

  _arrivedAtHouse() {
    this._walking = false;
    this._dlg.play([
      { speaker: '',     text: "The summer house. Small. Wooden. Older than anyone could say." },
      { speaker: 'Mom',  text: "Go inside and wash up. I'll get the bags." },
      { speaker: 'Hiro', text: "Okay." },
      { speaker: '',     text: "He carried his suitcase up the stone steps." },
      { speaker: '',     text: "And then he stopped." },
    ], () => {
      this.cameras.main.fadeOut(1200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('ForestScene');
      });
    });
  }

  update(time, delta) {
    const W = this._W, H = this._H;
    const dt = delta / 1000;

    // ── Rain ────────────────────────────────────────────────────────
    this._rainGfx.clear();
    for (const r of this._rain) {
      r.x += r.vx * dt; r.y += r.vy * dt;
      if (r.y > H || r.x > W) { r.y = -8; r.x = Math.random() * W; }
      this._rainGfx.lineStyle(1, 0x90aabf, r.a);
      this._rainGfx.lineBetween(r.x, r.y, r.x - r.vx * 0.035, r.y - r.len);
    }

    // ── Lantern flicker ─────────────────────────────────────────────
    this._lanternGfx.clear();
    const camX = this.cameras.main.scrollX;
    for (const ln of this._lanterns) {
      const sx = ln.x - camX;
      if (sx < -100 || sx > W + 100) continue;
      const flicker = 0.85 + Math.sin(time * 0.004 + ln.x) * 0.1
                            + Math.sin(time * 0.009 + ln.x * 0.7) * 0.05;
      const r = ln.r * flicker;
      const ctx = this._lanternGfx;
      // Manual radial glow via fillStyle + arc
      ctx.fillStyle = this._glowStyle(0xff, 0xcc, 0x60, 0.25 * flicker);
      ctx.fillCircle(sx, ln.y, r);
      ctx.fillStyle = this._glowStyle(0xff, 0xe0, 0x80, 0.5 * flicker);
      ctx.fillCircle(sx, ln.y, r * 0.4);
    }

    if (!this._walking) return;

    // ── Character walking ───────────────────────────────────────────
    this._stepTimer += dt;
    if (this._stepTimer > 0.18) {
      this._stepTimer = 0;
      this._stepOffset = this._stepOffset === 0 ? 2 : 0;
    }

    const speed = 55;
    this._boyX += speed * dt;
    this._momX += speed * dt;

    // Gentle bob
    this._boySprite.y = H * 0.72 - 2 + this._stepOffset;
    this._momSprite.y = H * 0.72 - 2 + (this._stepOffset === 0 ? 2 : 0);

    // Camera follows boy (smooth lag)
    const targetCam = Math.max(0, this._boyX - W * 0.38);
    this.cameras.main.scrollX += (targetCam - this.cameras.main.scrollX) * 5 * dt;

    // Update sprite positions (in world space — camera handles offset)
    this._boySprite.x = this._boyX;
    this._momSprite.x = this._momX - 28;

    // Chime check
    this._chimeCheck(this._boyX);

    // Mid-dialogue trigger
    if (!this._midDone && this._boyX > 850) {
      this._midDone = true;
      this._midDialogue();
    }

    // Arrive at house (end of world)
    if (this._boyX > this._worldW * 0.9) {
      this._arrivedAtHouse();
    }
  }

  _glowStyle(r, g, b, a) {
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
  }
}
