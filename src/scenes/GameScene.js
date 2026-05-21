// Main game scene — world rendering, simulation, input

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ── CREATE ──────────────────────────────────────────────────────────────

  create() {
    // Generate world
    this.world = this._genWorld();

    // Procedural sprites
    Sprites.all(this);

    // Render static terrain into a RenderTexture
    this.terrainRT = this.add.renderTexture(0, 0, W * T, H * T);
    this._drawTerrain();

    // Building data structures
    this.grid    = new BuildingGrid();
    this.miners  = [];
    this.belts   = [];
    this.smelters= [];
    this.chests  = [];

    // Building sprites map: grid-key -> Phaser.GameObjects.Image
    this.bldSprites = new Map();

    // Graphics layer for belt items (redrawn every frame) — depth above buildings
    this.itemsGfx = this.add.graphics();
    this.itemsGfx.setDepth(3);

    // Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W * T, H * T);
    cam.setScroll(
      (W * T - this.scale.width)  / 2,
      (H * T - this.scale.height) / 2
    );

    // Input
    this._setupInput();

    // Expose this scene to UIScene via registry
    this.registry.set('gameScene', this);
    this.registry.set('buildDir', DIR.R);
    this.registry.set('selectedTool', null);

    // Start UIScene as overlay
    this.scene.launch('UIScene');

    // Subtle grid overlay (very faint)
    this._drawGrid();
  }

  // ── WORLD GENERATION ────────────────────────────────────────────────────

  _genWorld() {
    const world = Array.from({ length: H }, (_, gy) =>
      Array.from({ length: W }, (_, gx) => ({
        ore:     null,
        variant: (gx * 7 + gy * 13 + gx * gy) % 3,
      }))
    );

    // Ore clusters: 6 per ore type
    const oreTypes = ['iron_ore', 'copper_ore', 'coal'];
    let seed = 42;
    const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

    for (let c = 0; c < 18; c++) {
      const type = oreTypes[c % 3];
      const cx = 4 + Math.floor(rng() * (W - 8));
      const cy = 4 + Math.floor(rng() * (H - 8));
      const n  = 5 + Math.floor(rng() * 6);
      for (let j = 0; j < n; j++) {
        const ox = Math.max(0, Math.min(W - 1, cx + Math.round((rng() - 0.5) * 7)));
        const oy = Math.max(0, Math.min(H - 1, cy + Math.round((rng() - 0.5) * 7)));
        world[oy][ox].ore = type;
      }
    }

    return world;
  }

  _drawTerrain() {
    for (let gy = 0; gy < H; gy++) {
      for (let gx = 0; gx < W; gx++) {
        const tile = this.world[gy][gx];
        const key  = tile.ore ? tile.ore : `grass_${tile.variant}`;
        // drawFrame accepts a texture key string (draw() does not)
        this.terrainRT.drawFrame(key, undefined, gx * T, gy * T);
      }
    }
  }

  _drawGrid() {
    const g = this.add.graphics();
    g.setDepth(1);
    g.lineStyle(1, 0x304050, 0.18);
    for (let gx = 0; gx <= W; gx++) g.lineBetween(gx * T, 0, gx * T, H * T);
    for (let gy = 0; gy <= H; gy++) g.lineBetween(0, gy * T, W * T, gy * T);
  }

  // ── INPUT ────────────────────────────────────────────────────────────────

  _setupInput() {
    const cam = this.cameras.main;

    // Keyboard scroll
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({ W: 87, A: 65, S: 83, D: 68 });

    // Mouse / touch drag + click
    let dragStart   = null;
    let scrollStart = null;
    let dragged     = false;

    this.input.on('pointerdown', pointer => {
      // Ignore clicks inside the toolbar strip at the bottom
      if (pointer.y > this.scale.height - 95) return;

      if (pointer.button === 2) {
        this._handleRemove(pointer);
        return;
      }
      dragStart   = { x: pointer.x, y: pointer.y };
      scrollStart = { x: cam.scrollX, y: cam.scrollY };
      dragged     = false;
    });

    this.input.on('pointermove', pointer => {
      if (!pointer.isDown || !dragStart) return;
      const dx = pointer.x - dragStart.x;
      const dy = pointer.y - dragStart.y;
      if (!dragged && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) dragged = true;
      if (dragged) {
        cam.scrollX = scrollStart.x - dx;
        cam.scrollY = scrollStart.y - dy;
      }
    });

    this.input.on('pointerup', pointer => {
      if (pointer.button === 2) return;
      if (!dragged) this._handleClick(pointer);
      dragStart = null;
    });

    // Disable default right-click context menu
    this.game.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  _handleClick(pointer) {
    if (pointer.y > this.scale.height - 95) return;
    const gx   = Math.floor(pointer.worldX / T);
    const gy   = Math.floor(pointer.worldY / T);
    if (gx < 0 || gx >= W || gy < 0 || gy >= H) return;

    const tool = this.registry.get('selectedTool');
    const dir  = this.registry.get('buildDir') ?? DIR.R;
    if (!tool) return;

    if (tool === 'remove') {
      this._removeBuilding(gx, gy);
    } else {
      this._placeBuilding(tool, gx, gy, dir);
    }
  }

  _handleRemove(pointer) {
    if (pointer.y > this.scale.height - 95) return;
    const gx = Math.floor(pointer.worldX / T);
    const gy = Math.floor(pointer.worldY / T);
    if (gx < 0 || gx >= W || gy < 0 || gy >= H) return;
    this._removeBuilding(gx, gy);
  }

  // ── BUILDING PLACEMENT ───────────────────────────────────────────────────

  _placeBuilding(type, gx, gy, dir) {
    const k = this.grid.key(gx, gy);
    if (this.grid.has(k)) return;

    let b;
    switch (type) {
      case 'miner': {
        const tile = this.world[gy][gx];
        if (!tile.ore) return; // miners only go on ore tiles
        b = new Miner(gx, gy, dir, tile.ore);
        this.miners.push(b);
        break;
      }
      case 'belt':
        b = new Belt(gx, gy, dir);
        this.belts.push(b);
        break;
      case 'smelter':
        b = new Smelter(gx, gy, dir);
        this.smelters.push(b);
        break;
      case 'chest':
        b = new Chest(gx, gy);
        this.chests.push(b);
        break;
      default: return;
    }

    this.grid.set(k, b);

    // Sprite
    const texKey = type === 'belt'
      ? `belt_${['R','D','L','U'][dir]}`
      : type;
    const spr = this.add.image(gx * T + T / 2, gy * T + T / 2, texKey);
    spr.setDepth(2);
    // Rotate directional buildings so output arrow points the right way
    if (type === 'miner' || type === 'smelter') {
      spr.setAngle(dir * 90); // sprite is drawn facing R; 90° steps for D/L/U
    }
    this.bldSprites.set(k, spr);

    // Notify UI to update stats
    this.registry.events.emit('buildingsChanged');
  }

  _removeBuilding(gx, gy) {
    const k = this.grid.key(gx, gy);
    const b = this.grid.get(k);
    if (!b) return;

    this.grid.delete(k);
    this.miners   = this.miners.filter(m => m !== b);
    this.belts    = this.belts.filter(bl => bl !== b);
    this.smelters = this.smelters.filter(s => s !== b);
    this.chests   = this.chests.filter(c => c !== b);

    const spr = this.bldSprites.get(k);
    if (spr) { spr.destroy(); this.bldSprites.delete(k); }

    this.registry.events.emit('buildingsChanged');
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  update(_time, delta) {
    const dt = Math.min(delta / 1000, 0.1); // cap to avoid spiral of death

    // Keyboard scroll
    const cam   = this.cameras.main;
    const speed = 280; // px/sec
    if (this.cursors.left.isDown  || this.wasd.A.isDown) cam.scrollX -= speed * dt;
    if (this.cursors.right.isDown || this.wasd.D.isDown) cam.scrollX += speed * dt;
    if (this.cursors.up.isDown    || this.wasd.W.isDown) cam.scrollY -= speed * dt;
    if (this.cursors.down.isDown  || this.wasd.S.isDown) cam.scrollY += speed * dt;

    // Simulate
    this.miners.forEach(m => m.update(dt, this.grid));
    // Belts: update from the "end" of chains first (prevents double-stepping)
    // Simple approach: just iterate multiple times at small steps if needed
    this.belts.forEach(bl => bl.update(dt, this.grid));
    this.smelters.forEach(s => s.update(dt, this.grid));

    // Draw items on belts + smelter fire overlay
    this._drawItems();
  }

  // ── RENDER ITEMS ─────────────────────────────────────────────────────────

  _drawItems() {
    const gfx = this.itemsGfx;
    gfx.clear();

    for (const belt of this.belts) {
      for (const item of belt.items) {
        const [dx, dy] = DVEC[belt.dir];
        const wx = belt.gx * T + T / 2 + dx * (item.progress - 0.5) * T;
        const wy = belt.gy * T + T / 2 + dy * (item.progress - 0.5) * T;
        this._drawItem(gfx, item.type, wx, wy);
      }
    }

    // Smelter output waiting items (show as dots above building)
    for (const sm of this.smelters) {
      // Fire pulsing overlay
      if (sm.processing) {
        const alpha = 0.25 + 0.15 * Math.sin(Date.now() / 200);
        gfx.fillStyle(0xf07000, alpha);
        gfx.fillRect(sm.gx * T + 14, sm.gy * T + 28, 20, 16);
      }
      // Output stack indicator
      if (sm.output.length > 0) {
        const wx = sm.gx * T + T / 2;
        const wy = sm.gy * T + 6;
        sm.output.forEach((type, i) => {
          this._drawItem(gfx, type, wx + (i - sm.output.length / 2) * 10, wy);
        });
      }
    }

    // Miner activity flash
    for (const mn of this.miners) {
      const pct = mn.timer / mn.rate;
      if (pct > 0.85) {
        gfx.fillStyle(0xffd040, (pct - 0.85) / 0.15 * 0.4);
        gfx.fillRect(mn.gx * T + 2, mn.gy * T + 2, T - 4, T - 4);
      }
    }
  }

  _drawItem(gfx, type, wx, wy) {
    const cols = ITEM_COL[type];
    if (!cols) return;
    const c0 = parseInt(cols[1].replace('#', ''), 16);
    const c2 = parseInt(cols[3].replace('#', ''), 16);
    const c4 = parseInt(cols[4].replace('#', ''), 16);
    const s = 6; // half-size

    gfx.fillStyle(c0);
    gfx.fillRect(wx - s, wy - s, s * 2, s * 2);
    gfx.fillStyle(c2);
    gfx.fillRect(wx - s + 2, wy - s + 2, s - 1, s - 1);
    gfx.fillStyle(c4);
    gfx.fillRect(wx - s + 3, wy - s + 3, 2, 2);
  }

  // ── STATS HELPER (called by UIScene) ─────────────────────────────────────

  getStats() {
    const totals = {};
    this.chests.forEach(ch => {
      Object.entries(ch.inventory).forEach(([t, n]) => {
        totals[t] = (totals[t] || 0) + n;
      });
    });
    return totals;
  }
}
