// Building classes and simulation logic

class Building {
  constructor(type, gx, gy, dir) {
    this.type = type;
    this.gx = gx;
    this.gy = gy;
    this.dir = dir; // 0=R 1=D 2=L 3=U
  }
  update(_dt, _grid) {}
}

// ── MINER ────────────────────────────────────────────────────────────────────

class Miner extends Building {
  constructor(gx, gy, dir, oreType) {
    super('miner', gx, gy, dir);
    this.oreType = oreType;
    this.timer   = 0;
    this.rate    = 2.0; // seconds per ore
    this.active  = false;
  }

  update(dt, grid) {
    this.timer += dt;
    if (this.timer < this.rate) return;

    const [dx, dy] = DVEC[this.dir];
    const nb = grid.get(`${this.gx + dx},${this.gy + dy}`);

    if (nb instanceof Belt && nb.canAccept()) {
      nb.addItem(this.oreType, 0);
      this.timer -= this.rate;
      if (this.timer > this.rate) this.timer = this.rate;
      this.active = true;
    }
    // If blocked, clamp so we don't accumulate infinite time
    if (this.timer > this.rate) this.timer = this.rate;
  }
}

// ── BELT ─────────────────────────────────────────────────────────────────────

class Belt extends Building {
  constructor(gx, gy, dir) {
    super('belt', gx, gy, dir);
    this.items = []; // { type:string, progress:number } sorted ascending progress
  }

  // Can we accept a new item at the entry end?
  canAccept() {
    if (this.items.length === 0) return true;
    return this.items[0].progress >= 0.32;
  }

  // Add item, keep sorted by progress
  addItem(type, progress) {
    this.items.push({ type, progress: Math.max(0, progress) });
    this.items.sort((a, b) => a.progress - b.progress);
  }

  update(dt, grid) {
    // Process items from front (highest progress) to back
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item  = this.items[i];
      const ahead = this.items[i + 1]; // higher-progress item in front

      // Cap so we don't crowd the item ahead
      const cap = ahead ? ahead.progress - 0.32 : 1.0;

      const newP = Math.min(item.progress + BELT_SPEED * dt, cap);

      if (newP >= 1.0 && !ahead) {
        // Reached exit — try to transfer to next tile
        const nx = this.gx + DVEC[this.dir][0];
        const ny = this.gy + DVEC[this.dir][1];
        const nb = grid.get(`${nx},${ny}`);

        let ok = false;
        if (nb instanceof Belt && nb.canAccept()) {
          nb.addItem(item.type, Math.max(0, newP - 1.0));
          this.items.splice(i, 1);
          ok = true;
        } else if (nb instanceof Smelter && nb.canAcceptItem(item.type)) {
          nb.giveItem(item.type);
          this.items.splice(i, 1);
          ok = true;
        } else if (nb instanceof Chest) {
          nb.addItem(item.type, 1);
          this.items.splice(i, 1);
          ok = true;
        }

        if (!ok) item.progress = Math.min(newP, 0.99); // jam
      } else {
        item.progress = newP;
      }
    }
  }
}

// ── SMELTER ──────────────────────────────────────────────────────────────────

class Smelter extends Building {
  constructor(gx, gy, dir) {
    super('smelter', gx, gy, dir);
    this.inventory  = {}; // type -> count (input buffer)
    this.processing = null; // { recipe, timer }
    this.output     = []; // queued output items
    this.maxIn      = 6;
    this.maxOut     = 4;
    this.heat       = 0; // 0..1 visual indicator
  }

  canAcceptItem(type) {
    if (!RECIPES.some(r => r.inputs[type] !== undefined)) return false;
    return (this.inventory[type] || 0) < this.maxIn;
  }

  giveItem(type) {
    this.inventory[type] = (this.inventory[type] || 0) + 1;
  }

  update(dt, grid) {
    // Start a recipe if idle and inputs available
    if (!this.processing && this.output.length < this.maxOut) {
      for (const recipe of RECIPES) {
        const ok = Object.entries(recipe.inputs)
          .every(([t, n]) => (this.inventory[t] || 0) >= n);
        if (ok) {
          Object.entries(recipe.inputs).forEach(([t, n]) => {
            this.inventory[t] = (this.inventory[t] || 0) - n;
          });
          this.processing = { recipe, timer: 0 };
          break;
        }
      }
    }

    // Advance processing
    if (this.processing) {
      this.processing.timer += dt;
      this.heat = Math.min(1, this.heat + dt * 0.6);
      if (this.processing.timer >= this.processing.recipe.time) {
        this.output.push(this.processing.recipe.output);
        this.processing = null;
      }
    } else {
      this.heat = Math.max(0, this.heat - dt * 0.2);
    }

    // Push output to adjacent belt in output direction
    if (this.output.length > 0) {
      const [dx, dy] = DVEC[this.dir];
      const nb = grid.get(`${this.gx + dx},${this.gy + dy}`);
      if (nb instanceof Belt && nb.canAccept()) {
        nb.addItem(this.output.shift(), 0);
      }
    }
  }
}

// ── CHEST ────────────────────────────────────────────────────────────────────

class Chest extends Building {
  constructor(gx, gy) {
    super('chest', gx, gy, 0);
    this.inventory = {}; // type -> count
    this.max       = 200;
  }

  addItem(type, n = 1) {
    this.inventory[type] = Math.min(this.max, (this.inventory[type] || 0) + n);
  }

  total() {
    return Object.values(this.inventory).reduce((s, v) => s + v, 0);
  }
}

// ── BUILDING GRID ────────────────────────────────────────────────────────────

// A thin wrapper around Map used by all scenes; kept here so Buildings file
// has a single place to find all grid look-ups.
class BuildingGrid {
  constructor() {
    this._map = new Map();
  }

  key(gx, gy) { return `${gx},${gy}`; }
  get(k)      { return this._map.get(k); }
  getXY(x, y) { return this._map.get(this.key(x, y)); }
  set(k, b)   { this._map.set(k, b); }
  delete(k)   { this._map.delete(k); }
  has(k)      { return this._map.has(k); }
  values()    { return this._map.values(); }
  entries()   { return this._map.entries(); }
  forEach(fn) { this._map.forEach(fn); }
}
