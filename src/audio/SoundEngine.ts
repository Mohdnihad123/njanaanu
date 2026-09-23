/**
 * Procedural Web Audio Engine for Open-World Driving & City Ambience
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine Audio Nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Drift Screech
  private skidNode: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;

  // Horn
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;
  private isHornPlaying: boolean = false;

  // Rain & Ambience
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;

  // Radio loops
  private radioInterval: number | null = null;
  private currentRadioStation: string = 'off';

  // State
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.6;
  private isMuted: boolean = false;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initRainNoise();
      this.initSkidNoise();
    } catch {
      // AudioContext might require user gesture
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Engine sound setup
  public startEngine(pitchFactor: number = 1.0) {
    if (!this.ctx || this.isEngineRunning) return;
    this.resume();

    try {
      const now = this.ctx.currentTime;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.001, now);
      this.engineGain.gain.exponentialRampToValueAtTime(0.35, now + 0.3);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(260 * pitchFactor, now);
      this.engineFilter.Q.setValueAtTime(3.0, now);

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45 * pitchFactor, now);

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(90 * pitchFactor, now);

      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = 'sine';
      this.engineSubOsc.frequency.setValueAtTime(22.5 * pitchFactor, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      if (this.sfxGain) {
        this.engineGain.connect(this.sfxGain);
      }

      this.engineOsc1.start(now);
      this.engineOsc2.start(now);
      this.engineSubOsc.start(now);

      this.isEngineRunning = true;
    } catch {
      // Ignore
    }
  }

  public stopEngine() {
    if (!this.ctx || !this.isEngineRunning) return;
    try {
      const now = this.ctx.currentTime;
      if (this.engineGain) {
        this.engineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      }
      setTimeout(() => {
        try {
          this.engineOsc1?.stop();
          this.engineOsc2?.stop();
          this.engineSubOsc?.stop();
          this.engineOsc1?.disconnect();
          this.engineOsc2?.disconnect();
          this.engineSubOsc?.disconnect();
          this.engineFilter?.disconnect();
          this.engineGain?.disconnect();
        } catch {}
        this.isEngineRunning = false;
      }, 160);
    } catch {
      this.isEngineRunning = false;
    }
  }

  public updateEngine(speedKmh: number, maxSpeedKmh: number, throttle: boolean, nitro: boolean, pitchScale: number = 1.0) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineFilter || !this.engineGain) return;

    const speedRatio = Math.min(1.0, Math.abs(speedKmh) / Math.max(1, maxSpeedKmh));
    const gear = Math.min(5, Math.floor(speedRatio * 5) + 1);
    const gearProgress = (speedRatio * 5) % 1;
    
    // RPM calculated with gear shifts
    const idleHz = 40 * pitchScale;
    const maxRpmHz = 160 * pitchScale;
    const targetFreq = idleHz + (gearProgress * (maxRpmHz - idleHz)) + (speedRatio * 20);

    const targetFilterCutoff = throttle
      ? (350 + speedRatio * 900 + (nitro ? 600 : 0)) * pitchScale
      : 220 * pitchScale;

    const targetGain = throttle
      ? 0.32 + speedRatio * 0.18 + (nitro ? 0.1 : 0)
      : 0.18;

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.05);
    if (this.engineOsc2) this.engineOsc2.frequency.setTargetAtTime(targetFreq * 2, now, 0.05);
    if (this.engineSubOsc) this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(targetFilterCutoff, now, 0.08);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  // Skid Sound
  private initSkidNoise() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.skidFilter.Q.setValueAtTime(4.5, this.ctx.currentTime);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.skidSourceLoop(noiseBuffer);
    } catch {}
  }

  private skidSourceLoop(buffer: AudioBuffer) {
    if (!this.ctx || !this.skidFilter || !this.skidGain || !this.sfxGain) return;
    try {
      this.skidNode = this.ctx.createBufferSource();
      this.skidNode.buffer = buffer;
      this.skidNode.loop = true;
      this.skidNode.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.sfxGain);
      this.skidNode.start();
    } catch {}
  }

  public updateSkid(slipAmount: number) {
    if (!this.ctx || !this.skidGain) return;
    const intensity = Math.max(0, Math.min(1.0, (slipAmount - 0.25) / 0.75));
    const targetGain = intensity > 0.05 ? intensity * 0.35 : 0.0001;
    this.skidGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.03);
  }

  // Horn
  public startHorn() {
    if (!this.ctx || this.isHornPlaying) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.setValueAtTime(0.001, now);
      this.hornGain.gain.linearRampToValueAtTime(0.28, now + 0.03);

      this.hornOsc1 = this.ctx.createOscillator();
      this.hornOsc2 = this.ctx.createOscillator();
      this.hornOsc1.type = 'sawtooth';
      this.hornOsc2.type = 'sawtooth';

      // Standard dual car horn chord (F & A flat / C)
      this.hornOsc1.frequency.setValueAtTime(349.23, now); // F4
      this.hornOsc2.frequency.setValueAtTime(440.0, now);   // A4

      this.hornOsc1.connect(this.hornGain);
      this.hornOsc2.connect(this.hornGain);
      if (this.sfxGain) this.hornGain.connect(this.sfxGain);

      this.hornOsc1.start(now);
      this.hornOsc2.start(now);
      this.isHornPlaying = true;
    } catch {}
  }

  public stopHorn() {
    if (!this.ctx || !this.isHornPlaying) return;
    try {
      const now = this.ctx.currentTime;
      if (this.hornGain) {
        this.hornGain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      }
      setTimeout(() => {
        try {
          this.hornOsc1?.stop();
          this.hornOsc2?.stop();
          this.hornOsc1?.disconnect();
          this.hornOsc2?.disconnect();
          this.hornGain?.disconnect();
        } catch {}
        this.isHornPlaying = false;
      }, 50);
    } catch {
      this.isHornPlaying = false;
    }
  }

  // Collision Impact
  public playCollision(speedKmh: number = 30) {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    try {
      const intensity = Math.min(1.0, Math.max(0.15, Math.abs(speedKmh) / 100));
      const now = this.ctx.currentTime;

      // Sub-bass thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 * intensity, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.2);

      gain.gain.setValueAtTime(0.6 * intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.26);

      // Crunch noise
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      const noiseGain = this.ctx.createGain();
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800 * intensity + 400, now);

      noise.buffer = buffer;
      noiseGain.gain.setValueAtTime(0.4 * intensity, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
    } catch {}
  }

  // Rain noise loop
  private initRainNoise() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise approximation
        lastOut = (lastOut * 0.95) + (white * 0.05);
        data[i] = lastOut * 3.0;
      }

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'lowpass';
      this.rainFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = buffer;
      this.rainSource.loop = true;

      this.rainSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      if (this.sfxGain) this.rainGain.connect(this.sfxGain);

      this.rainSource.start();
    } catch {}
  }

  public updateRain(intensity: number) {
    if (!this.ctx || !this.rainGain || !this.rainFilter) return;
    const targetGain = intensity > 0.05 ? Math.min(0.3, intensity * 0.25) : 0.0001;
    const targetFreq = 500 + intensity * 1200;
    const now = this.ctx.currentTime;
    this.rainGain.gain.setTargetAtTime(targetGain, now, 0.2);
    this.rainFilter.frequency.setTargetAtTime(targetFreq, now, 0.2);
  }

  public playThunder() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.6);
    } catch {}
  }

  public playFootstep() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140 + Math.random() * 40, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public playCashSound() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [880, 1174.66, 1760]; // A5, D6, A6
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
    } catch {}
  }

  public playMissionComplete() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C
      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + 0.8);
      });
    } catch {}
  }

  // In-Game Radio Station Synthesizer
  public setRadioStation(station: 'pulse_synthwave' | 'metro_beats' | 'coastal_chill' | 'off') {
    if (this.currentRadioStation === station) return;
    this.currentRadioStation = station;
    if (this.radioInterval) {
      window.clearInterval(this.radioInterval);
      this.radioInterval = null;
    }

    if (station === 'off' || !this.ctx || !this.musicGain) return;
    this.resume();

    // Procedural beat pattern loop
    let step = 0;
    const bpm = station === 'pulse_synthwave' ? 124 : station === 'metro_beats' ? 110 : 85;
    const stepDuration = 60 / bpm / 2; // eighth notes

    const synthwaveNotes = [220, 261.63, 293.66, 329.63, 392, 440]; // A minor pentatonic
    const beatsChords = [196, 246.94, 293.66, 369.99]; // G maj7
    const chillNotes = [130.81, 164.81, 196, 246.94]; // C maj7

    this.radioInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.currentRadioStation === 'off') return;
      const now = this.ctx.currentTime;

      // Kick on 0, 4
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        kickGain.gain.setValueAtTime(0.3, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.15);
      }

      // Snare / clap on 2, 6
      if (step % 4 === 2) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, now);
        snareGain.gain.setValueAtTime(0.18, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        snareOsc.connect(snareGain);
        snareGain.connect(this.musicGain);
        snareOsc.start(now);
        snareOsc.stop(now + 0.12);
      }

      // Hi-hat on every off-beat
      if (step % 2 === 1) {
        const hihatOsc = this.ctx.createOscillator();
        const hihatGain = this.ctx.createGain();
        hihatOsc.type = 'square';
        hihatOsc.frequency.setValueAtTime(5000 + Math.random() * 2000, now);
        hihatGain.gain.setValueAtTime(0.05, now);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        hihatOsc.connect(hihatGain);
        hihatGain.connect(this.musicGain);
        hihatOsc.start(now);
        hihatOsc.stop(now + 0.04);
      }

      // Melody note
      if (step % 2 === 0) {
        const notes = station === 'pulse_synthwave' ? synthwaveNotes : station === 'metro_beats' ? beatsChords : chillNotes;
        const noteFreq = notes[Math.floor(Math.random() * notes.length)];
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = station === 'pulse_synthwave' ? 'sawtooth' : 'triangle';
        leadOsc.frequency.setValueAtTime(noteFreq * (station === 'coastal_chill' ? 1 : 2), now);
        leadGain.gain.setValueAtTime(0.09, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.5);
        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);
        leadOsc.start(now);
        leadOsc.stop(now + stepDuration * 1.6);
      }

      step = (step + 1) % 16;
    }, stepDuration * 1000);
  }

  public setVolumes(sfx: number, music: number) {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(music, this.ctx.currentTime, 0.05);
    }
  }
}

export const soundEngine = new SoundEngine();
