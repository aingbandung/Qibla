/**
 * Web Audio API synthesizer & Browser Notification service
 * Pure browser implementation: 100% offline-ready, zero broken external audio URLs
 */

export type SoundProfile = 'makkah' | 'takbeer' | 'chime' | 'bowl' | 'silent';

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;

  private initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Request system notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  /**
   * Show push notification
   */
  public showNotification(
    title: string,
    options: {
      body: string;
      icon?: string;
      tag?: string;
    }
  ) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag || 'prayer-alert',
          silent: true, // We play our synthesized sound via Web Audio API for consistency
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('Could not display notification:', err);
      }
    }

    // Trigger haptic vibration if supported
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150, 80, 250]);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Play selected sound profile
   */
  public playProfile(profile: SoundProfile, customVolume?: number) {
    if (profile === 'silent' || this.isMuted) return;

    this.initAudio();
    if (!this.audioCtx) return;

    const vol = customVolume !== undefined ? customVolume : this.volume;

    switch (profile) {
      case 'makkah':
        this.playMakkahAdhan(vol);
        break;
      case 'takbeer':
        this.playTakbeer(vol);
        break;
      case 'chime':
        this.playGentleChime(vol);
        break;
      case 'bowl':
        this.playSingingBowl(vol);
        break;
    }
  }

  /**
   * Synthesize resonant Takbeer / Adhan phrase (Maqam Bayati / Rast cadence)
   */
  private playMakkahAdhan(gainLevel: number) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Master gain
    const master = ctx.createGain();
    master.gain.setValueAtTime(gainLevel * 0.9, now);
    master.connect(ctx.destination);

    // Warm Islamic vocal formant simulation: Re (293.66 Hz), Mi-b (311 Hz), Fa (349.23 Hz), Sol (392.00 Hz), La (440.00 Hz)
    // Melody phrasing for "Allahu Akbar":
    // [note, duration, startTimeOffset]
    const notes: Array<[number, number, number]> = [
      [293.66, 0.55, 0.0],  // Al-
      [349.23, 0.85, 0.55], // laa-
      [392.00, 1.25, 1.35], // huuu
      [349.23, 0.45, 2.55], // Ak-
      [293.66, 1.6, 2.95],  // baaar
      // Second phrase
      [293.66, 0.55, 4.8],  // Al-
      [349.23, 0.85, 5.35], // laa-
      [440.00, 1.35, 6.15], // huuu
      [392.00, 0.5, 7.45],  // Ak-
      [349.23, 1.8, 7.9],   // baaar
    ];

    notes.forEach(([freq, dur, offset]) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Warm overtone: triangle + lowpass
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + offset);

      // Vocal warmth filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now + offset);
      filter.Q.setValueAtTime(3, now + offset);

      // ADSR envelope
      const t = now + offset;
      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.exponentialRampToValueAtTime(0.4, t + 0.12);
      noteGain.gain.setValueAtTime(0.35, t + dur - 0.2);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(master);

      osc.start(t);
      osc.stop(t + dur + 0.1);

      // Sub-harmonic for body
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(freq / 2, t);
      subGain.gain.setValueAtTime(0.001, t);
      subGain.gain.exponentialRampToValueAtTime(0.18, t + 0.1);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      sub.connect(subGain);
      subGain.connect(master);
      sub.start(t);
      sub.stop(t + dur + 0.1);
    });
  }

  /**
   * Takbeer phrase (Allahu Akbar x2)
   */
  private playTakbeer(gainLevel: number) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(gainLevel * 0.9, now);
    master.connect(ctx.destination);

    const notes: Array<[number, number, number]> = [
      [329.63, 0.4, 0.0],  // Al-
      [392.00, 0.7, 0.4],  // laa-
      [440.00, 1.1, 1.05], // hu
      [392.00, 0.35, 2.1], // Ak-
      [329.63, 1.4, 2.4],  // bar
    ];

    notes.forEach(([freq, dur, offset]) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + offset);

      const t = now + offset;
      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.exponentialRampToValueAtTime(0.5, t + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(noteGain);
      noteGain.connect(master);

      osc.start(t);
      osc.stop(t + dur);
    });
  }

  /**
   * Gentle acoustic morning chime
   */
  private playGentleChime(gainLevel: number) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(gainLevel, now);
    master.connect(ctx.destination);

    // E major / Pentatonic celestial arpeggio
    const chord = [329.63, 415.3, 493.88, 659.25, 830.61];

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const t = now + idx * 0.15;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.exponentialRampToValueAtTime(0.35, t + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      osc.connect(noteGain);
      noteGain.connect(master);

      osc.start(t);
      osc.stop(t + 2.6);
    });
  }

  /**
   * Resonant Tibetan / Islamic singing bowl chime
   */
  private playSingingBowl(gainLevel: number) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(gainLevel * 0.95, now);
    master.connect(ctx.destination);

    const fundamental = 216; // Deep soothing frequency
    const harmonics = [1, 2.76, 5.4, 8.1];
    const weights = [0.6, 0.25, 0.1, 0.05];

    harmonics.forEach((h, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * h, now);

      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(weights[i], now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(g);
      g.connect(master);

      osc.start(now);
      osc.stop(now + 4.6);
    });
  }

  /**
   * Audio feedback for compass alignment (soft holy ping)
   */
  public playAlignmentHaptic() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(g);
      g.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);

      if ('vibrate' in navigator) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch {
      // ignore
    }
  }
}

export const soundService = new SoundService();
