// Dialogue system — manages the typewriter text box at the bottom of the screen.
// Instantiated once per scene and re-used across dialogue lines.
class DialogueSystem {
  constructor(scene, w = 960, h = 540) {
    this.scene   = scene;
    this.w       = w;
    this.h       = h;
    this._typing = false;
    this._skip   = false;
    this._queue  = [];
    this._onDone = null;

    this._buildUI();
    this.hide();
  }

  _buildUI() {
    const s = this.scene;
    const bh = 130; // box height
    const by = this.h - bh - 12;
    const pad = 20;

    // Background panel
    this._bg = s.add.graphics();
    this._bg.fillStyle(0x06090f, 0.92);
    this._bg.fillRoundedRect(10, by, this.w - 20, bh, 6);
    this._bg.lineStyle(1, 0x283446, 0.8);
    this._bg.strokeRoundedRect(10, by, this.w - 20, bh, 6);

    // Name tag
    this._nameBox = s.add.graphics();
    this._nameBox.fillStyle(0x141c28, 1);
    this._nameBox.fillRoundedRect(20, by - 24, 140, 26, 4);
    this._nameBox.lineStyle(1, 0x283446, 0.7);
    this._nameBox.strokeRoundedRect(20, by - 24, 140, 26, 4);

    this._nameText = s.add.text(90, by - 11, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#c8a060',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // Dialogue body text
    this._bodyText = s.add.text(pad + 10, by + 16, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#fff4e0',
      lineSpacing: 7,
      wordWrap: { width: this.w - 60 },
    });

    // Continue arrow
    this._arrow = s.add.text(this.w - 34, this.h - 22, '▼', {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      color: '#88aacc',
    }).setOrigin(0.5, 0.5);

    this.scene.tweens.add({
      targets: this._arrow,
      alpha: { from: 1, to: 0.1 },
      yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut',
    });

    // Click to skip / advance
    s.input.on('pointerdown', () => this._onPointer());
    s.input.keyboard.on('keydown', () => this._onPointer());

    this._container = [this._bg, this._nameBox, this._nameText, this._bodyText, this._arrow];
    this._setDepth(100);
  }

  _setDepth(d) {
    this._container.forEach(o => o.setDepth(d));
  }

  // Show a single line.  speaker = '' for narration.
  say(speaker, text, cb) {
    this.show();
    this._typing = true;
    this._skip   = false;
    this._onDone = cb || null;

    this._nameText.setText(speaker.toUpperCase());
    this._nameBox.setVisible(speaker !== '');
    this._nameText.setVisible(speaker !== '');

    this._bodyText.setText('');
    this._arrow.setAlpha(0);

    let i = 0;
    const full = text;
    const tick = this.scene.time.addEvent({
      delay: 30,
      repeat: full.length - 1,
      callback: () => {
        if (this._skip) {
          this._bodyText.setText(full);
          tick.remove();
          this._finishLine();
          return;
        }
        i++;
        this._bodyText.setText(full.substring(0, i));
        if (i >= full.length) this._finishLine();
      },
    });
    this._currentTick = tick;
  }

  _finishLine() {
    this._typing = false;
    this._arrow.setAlpha(1);
  }

  _onPointer() {
    if (!this.visible) return;
    if (this._typing) {
      this._skip = true;
      return;
    }
    // Advance to next line or call done
    if (this._queue.length > 0) {
      const { speaker, text } = this._queue.shift();
      this.say(speaker, text, this._onDone);
    } else if (this._onDone) {
      const cb = this._onDone;
      this._onDone = null;
      this.hide();
      cb();
    }
  }

  // Queue an array of {speaker, text} and run them in sequence.
  // callback fires when the last line is dismissed.
  play(lines, callback) {
    if (!lines || lines.length === 0) { if (callback) callback(); return; }
    this._queue = lines.slice(1);
    this._onDone = callback || null;
    const first = lines[0];
    this.say(first.speaker, first.text, callback);
  }

  show() {
    this.visible = true;
    this._container.forEach(o => o.setVisible(true));
  }

  hide() {
    this.visible = false;
    this._container.forEach(o => o.setVisible(false));
  }

  destroy() {
    this._container.forEach(o => o.destroy());
  }
}
