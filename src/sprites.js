// Procedural pixel-art sprite generator — Ghibli/Totoro palette
// All sprites are drawn on CanvasTextures and registered with Phaser's TextureManager

const Sprites = {

  _draw(scene, key, w, h, fn) {
    const tex = scene.textures.createCanvas(key, w, h);
    fn(tex.getContext());
    tex.refresh();
  },

  all(scene) {
    this.grass(scene);
    this.ores(scene);
    this.miner(scene);
    this.belts(scene);
    this.smelter(scene);
    this.chest(scene);
    this.items(scene);
    this.ui(scene);
  },

  // ── GRASS ─────────────────────────────────────────────────────────────────

  grass(scene) {
    const variants = [
      { base: PAL.G2, shade: PAL.G1, hi: PAL.G3, dot: PAL.G5 },
      { base: PAL.G3, shade: PAL.G2, hi: PAL.G4, dot: PAL.G5 },
      { base: PAL.G2, shade: PAL.G1, hi: PAL.G4, dot: PAL.G3 },
    ];
    variants.forEach((v, i) => {
      this._draw(scene, `grass_${i}`, T, T, ctx => {
        ctx.fillStyle = v.base;
        ctx.fillRect(0, 0, T, T);
        // shade edges
        ctx.fillStyle = v.shade;
        ctx.fillRect(0, 0, T, 2);
        ctx.fillRect(0, 0, 2, T);
        // highlight patches (seeded by variant)
        ctx.fillStyle = v.hi;
        const pts = i === 0
          ? [[6,8],[18,4],[34,12],[10,28],[30,30],[42,20]]
          : i === 1
          ? [[4,6],[22,10],[38,6],[8,30],[26,34],[40,28]]
          : [[10,6],[24,4],[40,14],[6,32],[30,28],[44,36]];
        pts.forEach(([px, py]) => {
          ctx.fillRect(px, py, 4, 3);
          ctx.fillRect(px + 1, py - 1, 2, 2);
        });
        // bright specks
        ctx.fillStyle = v.dot;
        [[12, 14], [28, 8], [8, 38], [40, 24], [22, 36]].forEach(([px, py]) => {
          ctx.fillRect(px, py, 2, 2);
        });
      });
    });
  },

  // ── ORE TILES ─────────────────────────────────────────────────────────────

  ores(scene) {
    [
      ['iron_ore',    PAL.I2, PAL.I4, PAL.I1, PAL.I5],
      ['coal',        PAL.C2, PAL.C4, PAL.C1, PAL.C5],
      ['copper_ore',  PAL.U2, PAL.U4, PAL.U1, PAL.U5],
    ].forEach(([key, mid, hi, lo, spark]) => {
      this._draw(scene, key, T, T, ctx => {
        // grass base
        ctx.fillStyle = PAL.G2;
        ctx.fillRect(0, 0, T, T);
        ctx.fillStyle = PAL.G1;
        ctx.fillRect(0, 0, T, 2);
        ctx.fillRect(0, 0, 2, T);

        // dirt ring under rocks
        ctx.fillStyle = PAL.D2;
        ctx.fillRect(8, 8, 32, 32);

        // rocks (4 overlapping rectangles)
        const rocks = [
          [9, 10, 16, 14],
          [22, 8,  14, 16],
          [8,  24, 14, 14],
          [24, 26, 14, 12],
        ];
        rocks.forEach(([rx, ry, rw, rh]) => {
          ctx.fillStyle = lo;
          ctx.fillRect(rx, ry, rw, rh);
          ctx.fillStyle = mid;
          ctx.fillRect(rx + 2, ry + 2, rw - 3, rh - 3);
          ctx.fillStyle = hi;
          ctx.fillRect(rx + 3, ry + 2, Math.min(5, rw - 4), 3);
        });

        // ore sparkles
        ctx.fillStyle = spark;
        [[14, 14], [28, 12], [11, 28], [30, 30]].forEach(([px, py]) => {
          ctx.fillRect(px, py, 3, 2);
          ctx.fillRect(px + 1, py - 1, 1, 1);
        });
      });
    });
  },

  // ── MINER ─────────────────────────────────────────────────────────────────

  miner(scene) {
    this._draw(scene, 'miner', T, T, ctx => {
      // stone foundation
      ctx.fillStyle = PAL.S2;
      ctx.fillRect(2, 2, T - 4, T - 4);

      // inset shadow
      ctx.fillStyle = PAL.S1;
      ctx.fillRect(2, 2, T - 4, 2);
      ctx.fillRect(2, 2, 2, T - 4);

      // highlight edge
      ctx.fillStyle = PAL.S4;
      ctx.fillRect(T - 4, 4, 2, T - 6);
      ctx.fillRect(4, T - 4, T - 6, 2);

      // wooden roof/cap (top 14px)
      ctx.fillStyle = PAL.W2;
      ctx.fillRect(4, 4, T - 8, 14);
      ctx.fillStyle = PAL.W3;
      ctx.fillRect(6, 5, T - 12, 10);
      ctx.fillStyle = PAL.W4;
      ctx.fillRect(8, 6, T - 16, 5);

      // drill body (center)
      ctx.fillStyle = PAL.S3;
      ctx.fillRect(14, 18, 20, 20);
      ctx.fillStyle = PAL.S4;
      ctx.fillRect(16, 20, 16, 16);
      ctx.fillStyle = PAL.S5;
      ctx.fillRect(20, 24, 8, 8);
      ctx.fillStyle = PAL.D3;
      ctx.fillRect(22, 26, 4, 4);

      // side bolts
      ctx.fillStyle = PAL.S5;
      ctx.fillRect(6, 30, 6, 6);
      ctx.fillRect(36, 30, 6, 6);

      // output direction arrow (warm yellow strip on right side)
      ctx.fillStyle = PAL.F4;
      ctx.fillRect(T - 6, 18, 4, 4);
      ctx.fillRect(T - 8, 20, 6, 4);
      ctx.fillRect(T - 6, 24, 4, 4);
    });
  },

  // ── BELTS ─────────────────────────────────────────────────────────────────

  belts(scene) {
    ['R', 'D', 'L', 'U'].forEach((d, di) => {
      this._draw(scene, `belt_${d}`, T, T, ctx => {
        const isH = d === 'R' || d === 'L';

        // track base
        ctx.fillStyle = PAL.D2;
        ctx.fillRect(0, 0, T, T);

        // outer rails
        ctx.fillStyle = PAL.D1;
        if (isH) {
          ctx.fillRect(0, 0, T, 5);
          ctx.fillRect(0, T - 5, T, 5);
        } else {
          ctx.fillRect(0, 0, 5, T);
          ctx.fillRect(T - 5, 0, 5, T);
        }

        // center belt strip
        ctx.fillStyle = PAL.D3;
        if (isH) ctx.fillRect(0, 16, T, 16);
        else      ctx.fillRect(16, 0, 16, T);

        // planks (perpendicular cross-hatches)
        ctx.fillStyle = PAL.W2;
        [8, 16, 24, 32, 40].forEach(pos => {
          if (isH) ctx.fillRect(pos - 1, 5, 3, T - 10);
          else     ctx.fillRect(5, pos - 1, T - 10, 3);
        });

        // plank highlight
        ctx.fillStyle = PAL.W3;
        [8, 16, 24, 32, 40].forEach(pos => {
          if (isH) ctx.fillRect(pos - 1, 5, 1, T - 10);
          else     ctx.fillRect(5, pos - 1, T - 10, 1);
        });

        // direction arrow
        ctx.fillStyle = PAL.F5;
        const cx = 24, cy = 24;
        if (d === 'R') {
          ctx.fillRect(10, cy - 2, 22, 4);
          ctx.fillRect(26, cy - 5, 4, 10);
          ctx.fillRect(30, cy - 3, 4, 6);
          ctx.fillRect(34, cy - 1, 4, 2);
        } else if (d === 'L') {
          ctx.fillRect(16, cy - 2, 22, 4);
          ctx.fillRect(18, cy - 5, 4, 10);
          ctx.fillRect(14, cy - 3, 4, 6);
          ctx.fillRect(10, cy - 1, 4, 2);
        } else if (d === 'D') {
          ctx.fillRect(cx - 2, 10, 4, 22);
          ctx.fillRect(cx - 5, 26, 10, 4);
          ctx.fillRect(cx - 3, 30, 6, 4);
          ctx.fillRect(cx - 1, 34, 2, 4);
        } else { // U
          ctx.fillRect(cx - 2, 16, 4, 22);
          ctx.fillRect(cx - 5, 18, 10, 4);
          ctx.fillRect(cx - 3, 14, 6, 4);
          ctx.fillRect(cx - 1, 10, 2, 4);
        }
      });
    });
  },

  // ── SMELTER ───────────────────────────────────────────────────────────────

  smelter(scene) {
    this._draw(scene, 'smelter', T, T, ctx => {
      // stone body
      ctx.fillStyle = PAL.S2;
      ctx.fillRect(0, 0, T, T);

      // brick pattern
      ctx.fillStyle = PAL.S1;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          const offset = row % 2 === 0 ? 0 : 8;
          ctx.fillRect(col * 16 + offset, row * 12, 15, 1);
          ctx.fillRect(col * 16 + offset, row * 12, 1, 11);
        }
      }

      // corner stones
      ctx.fillStyle = PAL.S3;
      ctx.fillRect(2, 2, 8, 8);
      ctx.fillRect(38, 2, 8, 8);
      ctx.fillRect(2, 38, 8, 8);
      ctx.fillRect(38, 38, 8, 8);

      // chimney
      ctx.fillStyle = PAL.S1;
      ctx.fillRect(18, 0, 12, 16);
      ctx.fillStyle = PAL.S2;
      ctx.fillRect(20, 2, 8, 14);
      // smoke wisps
      ctx.fillStyle = 'rgba(180,180,180,0.5)';
      ctx.fillRect(22, 0, 4, 3);
      ctx.fillStyle = 'rgba(200,200,200,0.3)';
      ctx.fillRect(20, 0, 3, 2);

      // wooden beam accent
      ctx.fillStyle = PAL.W3;
      ctx.fillRect(2, 16, T - 4, 4);

      // fire opening
      ctx.fillStyle = PAL.S1;
      ctx.fillRect(12, 24, 24, 22);
      ctx.fillStyle = PAL.F1;
      ctx.fillRect(14, 26, 20, 18);
      ctx.fillStyle = PAL.F2;
      ctx.fillRect(16, 28, 16, 14);
      ctx.fillStyle = PAL.F3;
      ctx.fillRect(18, 30, 12, 10);
      ctx.fillStyle = PAL.F4;
      ctx.fillRect(20, 32, 8, 7);
      ctx.fillStyle = PAL.F5;
      ctx.fillRect(22, 34, 4, 4);
    });
  },

  // ── CHEST ─────────────────────────────────────────────────────────────────

  chest(scene) {
    this._draw(scene, 'chest', T, T, ctx => {
      // main body (wood)
      ctx.fillStyle = PAL.W2;
      ctx.fillRect(2, 14, T - 4, T - 16);

      // lid
      ctx.fillStyle = PAL.W3;
      ctx.fillRect(2, 8, T - 4, 12);
      ctx.fillStyle = PAL.W4;
      ctx.fillRect(4, 10, T - 8, 8);
      // lid highlight
      ctx.fillStyle = PAL.W5;
      ctx.fillRect(5, 10, T - 10, 3);

      // metal corner brackets
      ctx.fillStyle = PAL.S4;
      [[2, 10], [T - 8, 10], [2, T - 8], [T - 8, T - 8]].forEach(([bx, by]) => {
        ctx.fillRect(bx, by, 6, 6);
      });

      // horizontal metal band
      ctx.fillStyle = PAL.S3;
      ctx.fillRect(2, 20, T - 4, 4);

      // front wood face
      ctx.fillStyle = PAL.W1;
      ctx.fillRect(6, 24, T - 12, T - 26);

      // lock
      ctx.fillStyle = PAL.S4;
      ctx.fillRect(18, 16, 12, 10);
      ctx.fillStyle = PAL.F4;
      ctx.fillRect(20, 18, 8, 8);
      ctx.fillStyle = PAL.F5;
      ctx.fillRect(22, 20, 4, 4);
      ctx.fillStyle = PAL.S1;
      ctx.fillRect(23, 22, 2, 4); // keyhole
    });
  },

  // ── ITEMS (small, drawn on belt) ─────────────────────────────────────────

  items(scene) {
    [
      ['item_iron_ore',    PAL.I1, PAL.I3, PAL.I5],
      ['item_coal',        PAL.C1, PAL.C3, PAL.C5],
      ['item_copper_ore',  PAL.U1, PAL.U3, PAL.U5],
      ['item_iron_plate',  '#485868', '#7090a8', '#b0c8e0'],
      ['item_copper_plate','#7a3818', '#ba6838', '#e89848'],
    ].forEach(([key, lo, mid, hi]) => {
      const isPlate = key.includes('plate');
      this._draw(scene, key, 14, 14, ctx => {
        if (isPlate) {
          // flat rectangular bar
          ctx.fillStyle = lo;
          ctx.fillRect(1, 4, 12, 7);
          ctx.fillStyle = mid;
          ctx.fillRect(1, 4, 12, 5);
          ctx.fillStyle = hi;
          ctx.fillRect(2, 5, 6, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(3, 5, 2, 1);
        } else {
          // irregular ore chunk
          ctx.fillStyle = lo;
          ctx.fillRect(2, 2, 10, 10);
          ctx.fillRect(1, 4, 12, 6);
          ctx.fillStyle = mid;
          ctx.fillRect(3, 3, 8, 7);
          ctx.fillRect(2, 5, 4, 4);
          ctx.fillStyle = hi;
          ctx.fillRect(4, 4, 4, 3);
          ctx.fillRect(3, 5, 2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(5, 4, 2, 1);
        }
      });
    });
  },

  // ── UI ELEMENTS ───────────────────────────────────────────────────────────

  ui(scene) {
    // Normal button bg
    this._draw(scene, 'btn_bg', 64, 64, ctx => {
      ctx.fillStyle = '#1a2830';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#243040';
      ctx.fillRect(2, 2, 60, 60);
      ctx.fillStyle = '#304050';
      ctx.fillRect(2, 2, 60, 3);
      ctx.fillRect(2, 2, 3, 60);
      ctx.fillStyle = '#141c22';
      ctx.fillRect(2, 61, 60, 1);
      ctx.fillRect(61, 2, 1, 60);
    });

    // Selected button bg
    this._draw(scene, 'btn_sel', 64, 64, ctx => {
      ctx.fillStyle = '#3a5830';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#4a7040';
      ctx.fillRect(2, 2, 60, 60);
      ctx.fillStyle = '#5a8848';
      ctx.fillRect(2, 2, 60, 3);
      ctx.fillRect(2, 2, 3, 60);
      ctx.fillStyle = '#2a4020';
      ctx.fillRect(2, 61, 60, 1);
      ctx.fillRect(61, 2, 1, 60);
    });

    // Remove button bg
    this._draw(scene, 'btn_remove', 64, 64, ctx => {
      ctx.fillStyle = '#302010';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#483018';
      ctx.fillRect(2, 2, 60, 60);
      ctx.fillStyle = PAL.F2;
      // X mark
      for (let i = 0; i < 28; i++) {
        ctx.fillRect(18 + i, 18 + i, 3, 3);
        ctx.fillRect(46 - i, 18 + i, 3, 3);
      }
    });

    // Toolbar background strip
    this._draw(scene, 'toolbar_bg', 8, 8, ctx => {
      ctx.fillStyle = 'rgba(10,18,28,0.88)';
      ctx.fillRect(0, 0, 8, 8);
    });
  },
};
