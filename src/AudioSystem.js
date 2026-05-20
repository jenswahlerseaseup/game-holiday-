// Procedural audio — no audio files needed, everything synthesised via Web Audio API.
// Needs a user gesture before AudioContext can start (browser policy).
class AudioSystem {
  constructor() {
    this._ctx    = null;
    this._master = null;
    this._nodes  = {};
  }

  _boot() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._master = this._ctx.createGain();
    this._master.gain.value = 1;
    this._master.connect(this._ctx.destination);
  }

  // ── white-noise helper ──────────────────────────────────────────────
  _noise(duration = 3) {
    const len    = Math.ceil(this._ctx.sampleRate * duration);
    const buf    = this._ctx.createBuffer(1, len, this._ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this._ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;
    return src;
  }

  // ── rain ─────────────────────────────────────────────────────────────
  startRain(vol = 0.35) {
    this._boot();
    if (this._nodes.rain) return;

    const src = this._noise();

    const hp = this._ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 800;

    const bp = this._ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.6;

    const lp = this._ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 6000;

    const gain = this._ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(vol, this._ctx.currentTime + 1.5);

    src.connect(hp); hp.connect(bp); bp.connect(lp); lp.connect(gain);
    gain.connect(this._master);
    src.start();

    this._nodes.rain = { src, gain };
  }

  stopRain(fade = 1.5) {
    const n = this._nodes.rain;
    if (!n) return;
    n.gain.gain.linearRampToValueAtTime(0, this._ctx.currentTime + fade);
    setTimeout(() => { try { n.src.stop(); } catch(_){} delete this._nodes.rain; }, (fade + 0.2) * 1000);
  }

  // ── wind ─────────────────────────────────────────────────────────────
  startWind(vol = 0.18) {
    this._boot();
    if (this._nodes.wind) return;

    const src = this._noise(5);

    const lp = this._ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 400;

    const gain = this._ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(vol, this._ctx.currentTime + 2);

    // Slow modulation (wind gusts)
    const lfo = this._ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = this._ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain); lfoGain.connect(gain.gain);
    lfo.start();

    src.connect(lp); lp.connect(gain); gain.connect(this._master);
    src.start();

    this._nodes.wind = { src, gain, lfo };
  }

  stopWind(fade = 2) {
    const n = this._nodes.wind;
    if (!n) return;
    n.gain.gain.linearRampToValueAtTime(0, this._ctx.currentTime + fade);
    setTimeout(() => {
      try { n.src.stop(); n.lfo.stop(); } catch(_){}
      delete this._nodes.wind;
    }, (fade + 0.2) * 1000);
  }

  // ── wiper ticks ──────────────────────────────────────────────────────
  startWipers(intervalMs = 900) {
    this._boot();
    if (this._nodes.wipers) return;
    const tick = () => {
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'square'; osc.frequency.value = 80;
      gain.gain.setValueAtTime(0.12, this._ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.06);
      osc.connect(gain); gain.connect(this._master);
      osc.start(); osc.stop(this._ctx.currentTime + 0.06);
    };
    tick();
    this._nodes.wipers = setInterval(tick, intervalMs);
  }

  stopWipers() {
    if (this._nodes.wipers) {
      clearInterval(this._nodes.wipers);
      delete this._nodes.wipers;
    }
  }

  // ── thunder ──────────────────────────────────────────────────────────
  thunder() {
    this._boot();
    const src  = this._noise(1);
    const lp   = this._ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 150;
    const gain = this._ctx.createGain();
    gain.gain.setValueAtTime(0.8, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 1.8);
    src.connect(lp); lp.connect(gain); gain.connect(this._master);
    src.start(); src.stop(this._ctx.currentTime + 2);
  }

  // ── cicadas ───────────────────────────────────────────────────────────
  startCicadas(vol = 0.12) {
    this._boot();
    if (this._nodes.cicadas) return;

    const src = this._noise(4);
    const bp  = this._ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 4000; bp.Q.value = 5;

    // AM modulation at ~18 Hz (cicada rhythm)
    const carrier = this._ctx.createGain();
    carrier.gain.value = vol;
    const lfo  = this._ctx.createOscillator();
    lfo.frequency.value = 18;
    const lfoG = this._ctx.createGain();
    lfoG.gain.value = vol * 0.8;
    lfo.connect(lfoG); lfoG.connect(carrier.gain);
    lfo.start();

    src.connect(bp); bp.connect(carrier); carrier.connect(this._master);
    src.start();
    this._nodes.cicadas = { src, lfo, carrier };
  }

  stopCicadas(fade = 3) {
    const n = this._nodes.cicadas;
    if (!n) return;
    n.carrier.gain.linearRampToValueAtTime(0, this._ctx.currentTime + fade);
    setTimeout(() => {
      try { n.src.stop(); n.lfo.stop(); } catch(_){}
      delete this._nodes.cicadas;
    }, (fade + 0.2) * 1000);
  }

  // ── wind chime ────────────────────────────────────────────────────────
  chime() {
    this._boot();
    const freqs = [880, 1108, 1318, 1568, 1760];
    freqs.forEach((f, i) => {
      const delay = i * 90 + Math.random() * 60;
      setTimeout(() => {
        const osc  = this._ctx.createOscillator();
        const gain = this._ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = f;
        gain.gain.setValueAtTime(0.08, this._ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 1.6);
        osc.connect(gain); gain.connect(this._master);
        osc.start(); osc.stop(this._ctx.currentTime + 1.8);
      }, delay);
    });
  }

  // ── master fade ───────────────────────────────────────────────────────
  fadeOut(duration = 2) {
    if (!this._master) return;
    this._master.gain.linearRampToValueAtTime(0, this._ctx.currentTime + duration);
  }

  fadeIn(duration = 2) {
    if (!this._master) return;
    this._master.gain.linearRampToValueAtTime(1, this._ctx.currentTime + duration);
  }

  resume() {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
  }
}

const Audio = new AudioSystem();
