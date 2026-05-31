// HUD / Toolbar overlay — always on top, fixed camera

class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    const W_PX = this.scale.width;
    const H_PX = this.scale.height;

    // Tool definitions
    this.tools = [
      { id: 'miner',   label: 'Miner',   tex: 'miner',   key: 'M' },
      { id: 'belt',    label: 'Belt',    tex: 'belt_R',  key: 'B' },
      { id: 'smelter', label: 'Smelt',   tex: 'smelter', key: 'F' },
      { id: 'chest',   label: 'Chest',   tex: 'chest',   key: 'C' },
      { id: 'remove',  label: 'Remove',  tex: null,      key: 'X' },
    ];

    this.selectedTool = null;
    this.buildDir     = DIR.R;
    this.dirLabels    = ['→', '↓', '←', '↑'];

    // Toolbar dimensions
    const BTN  = 64;
    const PAD  = 8;
    const BARH = BTN + PAD * 2;
    const totalW = (BTN + PAD) * this.tools.length + PAD + BTN + PAD * 3; // tools + rotate
    const barX   = (W_PX - totalW) / 2;
    const barY   = H_PX - BARH - 10;

    // Background panel
    this.add.rectangle(W_PX / 2, H_PX - BARH / 2 - 10, W_PX, BARH + 20, 0x0a1218, 0.85)
      .setScrollFactor(0)
      .setDepth(10);

    // Tool buttons
    this.btnObjs = [];
    this.tools.forEach((tool, i) => {
      const bx = barX + PAD + i * (BTN + PAD) + BTN / 2;
      const by = barY + PAD + BTN / 2;

      const bg = this.add.image(bx, by, 'btn_bg')
        .setScrollFactor(0).setDepth(11).setDisplaySize(BTN, BTN);

      let icon;
      if (tool.tex) {
        icon = this.add.image(bx, by, tool.tex)
          .setScrollFactor(0).setDepth(12)
          .setDisplaySize(40, 40);
      } else {
        // Remove button: red X
        icon = this.add.image(bx, by, 'btn_remove')
          .setScrollFactor(0).setDepth(12).setDisplaySize(BTN, BTN);
        bg.setVisible(false);
      }

      const label = this.add.text(bx, by + BTN / 2 - 2, tool.label, {
        fontSize: '9px', color: '#8090a0', fontFamily: 'Georgia, serif',
      }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(13);

      const hotkey = this.add.text(bx - BTN / 2 + 5, by - BTN / 2 + 3, tool.key, {
        fontSize: '8px', color: '#506070', fontFamily: 'monospace',
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(13);

      bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this._selectTool(tool.id));
      if (icon && tool.tex) icon.setInteractive({ useHandCursor: true }).on('pointerdown', () => this._selectTool(tool.id));
      if (!tool.tex) icon.setInteractive({ useHandCursor: true }).on('pointerdown', () => this._selectTool(tool.id));

      this.btnObjs.push({ tool, bg, icon, label });
    });

    // Rotate button
    const rotX = barX + PAD + this.tools.length * (BTN + PAD) + PAD + BTN / 2;
    const rotY = barY + PAD + BTN / 2;

    this.rotBg = this.add.image(rotX, rotY, 'btn_bg')
      .setScrollFactor(0).setDepth(11).setDisplaySize(BTN, BTN);

    this.rotLabel = this.add.text(rotX, rotY, this.dirLabels[this.buildDir], {
      fontSize: '28px', color: '#c8d8a0', fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(12);

    this.add.text(rotX, rotY + BTN / 2 - 2, 'Rotate', {
      fontSize: '9px', color: '#8090a0', fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(13);

    this.add.text(rotX - BTN / 2 + 5, rotY - BTN / 2 + 3, 'R', {
      fontSize: '8px', color: '#506070', fontFamily: 'monospace',
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(13);

    this.rotBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this._rotate());
    this.rotLabel.setInteractive({ useHandCursor: true }).on('pointerdown', () => this._rotate());

    // Stats text (top-left)
    this.statsText = this.add.text(12, 12, '', {
      fontSize: '11px', color: '#a0c0b0', fontFamily: 'Georgia, serif',
      lineSpacing: 4,
    }).setScrollFactor(0).setDepth(20).setAlpha(0.9);

    this.add.rectangle(6, 6, 180, 140, 0x0a1218, 0.7)
      .setScrollFactor(0).setDepth(19).setOrigin(0, 0);

    // Help text (top-right)
    this.add.text(W_PX - 12, 12,
      'Click to place  |  Right-click / X to remove\nWASD or drag to scroll  |  R to rotate',
      { fontSize: '9px', color: '#405060', fontFamily: 'Georgia, serif', align: 'right', lineSpacing: 4 }
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-M', () => this._selectTool('miner'));
    this.input.keyboard.on('keydown-B', () => this._selectTool('belt'));
    this.input.keyboard.on('keydown-F', () => this._selectTool('smelter'));
    this.input.keyboard.on('keydown-C', () => this._selectTool('chest'));
    this.input.keyboard.on('keydown-X', () => this._selectTool('remove'));
    this.input.keyboard.on('keydown-R', () => this._rotate());
    this.input.keyboard.on('keydown-ESC', () => this._selectTool(null));

    // Stats refresh every second
    this.time.addEvent({ delay: 800, loop: true, callback: this._updateStats, callbackScope: this });
    this._updateStats();

    this._refreshButtons();

    // Goal completion banner
    this.goalBanner = this.add.text(W_PX / 2, 80, '', {
      fontSize: '16px', color: '#ffd040', fontFamily: 'Georgia, serif',
      stroke: '#0a1218', strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(25).setAlpha(0);

    this.registry.events.on('goalReached', goal => this._showGoalBanner(goal.name));
  }

  // ── TOOL SELECTION ───────────────────────────────────────────────────────

  _selectTool(id) {
    this.selectedTool = this.selectedTool === id ? null : id;
    this.registry.set('selectedTool', this.selectedTool);
    this._refreshButtons();
  }

  _rotate() {
    this.buildDir = (this.buildDir + 1) % 4;
    this.registry.set('buildDir', this.buildDir);
    this.rotLabel.setText(this.dirLabels[this.buildDir]);
    // If belt is selected, also update the belt preview key
    this._refreshButtons();
  }

  _refreshButtons() {
    this.btnObjs.forEach(({ tool, bg, icon }) => {
      const sel = tool.id === this.selectedTool;
      if (tool.id === 'remove') {
        // Remove button uses icon only (bg is hidden); tint red when selected
        icon.setTint(sel ? 0xff7070 : 0xffffff);
      } else {
        bg.setTexture(sel ? 'btn_sel' : 'btn_bg');
        if (icon) icon.setTint(sel ? 0xeeffcc : 0xffffff);
      }
      // Belt icon tracks current rotation direction
      if (tool.id === 'belt' && icon) {
        icon.setTexture(`belt_${['R','D','L','U'][this.buildDir]}`);
      }
    });
    this.rotBg.setTexture('btn_bg');
  }

  // ── STATS ─────────────────────────────────────────────────────────────────

  _updateStats() {
    const gs = this.registry.get('gameScene');
    if (!gs) return;

    const stats = gs.getStats();
    const lines = [
      '~ Factory Stats',
      `  Iron plates:   ${stats.iron_plate   || 0}`,
      `  Copper plates: ${stats.copper_plate || 0}`,
      `  Belts: ${gs.belts.length}  Miners: ${gs.miners.length}`,
    ];

    if (gs.goalIdx >= GOALS.length) {
      lines.push('', '~ All Goals Complete!');
    } else {
      const goal = GOALS[gs.goalIdx];
      lines.push('', `Goal: ${goal.name}`);
      Object.entries(goal.req).forEach(([type, need]) => {
        const have  = gs.produced[type] || 0;
        const label = type.replace('_', ' ');
        lines.push(`  ${label}: ${Math.min(have, need)}/${need}${have >= need ? ' ✓' : ''}`);
      });
    }

    this.statsText.setText(lines.join('\n'));
  }

  _showGoalBanner(name) {
    this.tweens.killTweensOf(this.goalBanner);
    this.goalBanner.setText(`~ ${name} ~`).setAlpha(1).setY(80);
    this.tweens.add({
      targets: this.goalBanner,
      alpha: 0,
      y: 50,
      delay: 1500,
      duration: 2500,
      ease: 'Power2',
    });
  }
}
