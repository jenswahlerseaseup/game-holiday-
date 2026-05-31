// Procedural audio via Web Audio API — all sounds synthesised, no files needed
const GameAudio = (() => {
  let ctx = null;

  function _ctx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function _play(fn) {
    try {
      const c = _ctx();
      if (c.state === 'suspended') c.resume();
      fn(c);
    } catch (_) {}
  }

  // Short chirp when a building is placed
  function place() {
    _play(c => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, c.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
      osc.start(c.currentTime); osc.stop(c.currentTime + 0.12);
    });
  }

  // Crunchy noise burst when a miner ejects ore
  function mine() {
    _play(c => {
      const buf  = c.createBuffer(1, Math.ceil(c.sampleRate * 0.07), c.sampleRate);
      const d    = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src  = c.createBufferSource();
      const filt = c.createBiquadFilter();
      const gain = c.createGain();
      src.buffer = buf; filt.type = 'bandpass'; filt.frequency.value = 900; filt.Q.value = 2;
      src.connect(filt); filt.connect(gain); gain.connect(c.destination);
      gain.gain.value = 0.18;
      src.start(c.currentTime);
    });
  }

  // Low thump when a smelter finishes a plate
  function smelt() {
    _play(c => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, c.currentTime + 0.22);
      gain.gain.setValueAtTime(0.09, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
      osc.start(c.currentTime); osc.stop(c.currentTime + 0.22);
    });
  }

  // Ascending C-E-G-C arpeggio for goal completion
  function goalComplete() {
    _play(c => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc  = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'sine'; osc.frequency.value = freq;
        const t0 = c.currentTime + i * 0.13;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.16, t0 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
        osc.start(t0); osc.stop(t0 + 0.45);
      });
    });
  }

  // Low buzz for invalid placement
  function invalid() {
    _play(c => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.15);
      gain.gain.setValueAtTime(0.07, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
      osc.start(c.currentTime); osc.stop(c.currentTime + 0.15);
    });
  }

  return { place, mine, smelt, goalComplete, invalid };
})();
