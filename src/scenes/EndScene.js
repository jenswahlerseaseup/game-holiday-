// ── End of Chapter One ────────────────────────────────────────────────────────
// A quiet title card.  The world breathing.
class EndScene extends Phaser.Scene {
  constructor() { super({ key: 'EndScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(W/2, H/2, W, H, 0x000000, 1);

    const style = {
      fontFamily: 'Georgia, "Times New Roman", serif',
      color: '#8090a0',
      align: 'center',
    };

    const title = this.add.text(W/2, H/2 - 55, 'THE FOREST EATS MEMORIES', {
      ...style,
      fontSize: '20px',
      color: '#c0ccd4',
      letterSpacing: 6,
    }).setOrigin(0.5).setAlpha(0);

    const chapter = this.add.text(W/2, H/2 - 8, 'Chapter One  —  Arrived', {
      ...style,
      fontSize: '14px',
      color: '#60707a',
    }).setOrigin(0.5).setAlpha(0);

    const note = this.add.text(W/2, H/2 + 48, '"He went into the forest.  Last spring."', {
      ...style,
      fontSize: '13px',
      color: '#4a5860',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    const restart = this.add.text(W/2, H * 0.88, '[ click to restart ]', {
      ...style,
      fontSize: '11px',
      color: '#384048',
    }).setOrigin(0.5).setAlpha(0);

    this.cameras.main.fadeIn(1200, 0, 0, 0);

    this.tweens.add({ targets: title,   alpha: 1, delay: 1500, duration: 2000 });
    this.tweens.add({ targets: chapter, alpha: 1, delay: 2800, duration: 1500 });
    this.tweens.add({ targets: note,    alpha: 1, delay: 4200, duration: 1800 });
    this.tweens.add({ targets: restart, alpha: 1, delay: 6000, duration: 1200 });

    this.time.delayedCall(6200, () => {
      this.tweens.add({
        targets: restart,
        alpha: { from: 0.9, to: 0.15 },
        yoyo: true, repeat: -1, duration: 1100,
      });
      this.input.once('pointerdown', () => this._restart());
      this.input.keyboard.once('keydown', () => this._restart());
    });

    // Slow breathing of the background (very subtle noise layer)
    this._breathGfx = this.add.graphics().setDepth(1).setAlpha(0.06);
    this._t = 0;
  }

  _restart() {
    Audio.fadeOut(1.5);
    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // clean up textures so scenes rebuild correctly on replay
      const keys = ['glass','car-bg','car-int','car-glass','village-bg','boy-walk',
                    'mom-walk','forest-bg','forest-house','hiro-fg','shop-bg',
                    'harue','kenta','hiro-shop'];
      keys.forEach(k => { if (this.textures.exists(k)) this.textures.remove(k); });
      this.scene.start('OpeningScene');
    });
  }

  update(time) {
    this._t = time * 0.0004;
    this._breathGfx.clear();
    const W = this.scale.width, H = this.scale.height;
    const g = Math.floor(10 + Math.sin(this._t) * 4);
    this._breathGfx.fillStyle(Phaser.Display.Color.GetColor(0, g, g + 4), 1);
    this._breathGfx.fillRect(0, 0, W, H);
  }
}
