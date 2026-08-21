/**
 * Web Audio API synthesizer for referee whistle sounds and audio countdowns.
 */
class AudioSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playBeep(frequency = 800, durationMs = 150) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  }

  public playWhistle() {
    try {
      const ctx = this.getContext();

      // Dual oscillator referee whistle modulation
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Referee whistle frequencies (approx 2800 Hz and 2860 Hz with rapid tremolo)
      osc1.frequency.setValueAtTime(2800, ctx.currentTime);
      osc2.frequency.setValueAtTime(2880, ctx.currentTime);

      // Tremolo / pulse effect
      const LFO = ctx.createOscillator();
      LFO.frequency.value = 35; // 35Hz flutter
      const LFOgain = ctx.createGain();
      LFOgain.gain.value = 200;

      LFO.connect(LFOgain);
      LFOgain.connect(osc1.frequency);
      LFOgain.connect(osc2.frequency);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      LFO.start();
      osc1.start();
      osc2.start();

      const stopTime = ctx.currentTime + 0.8;
      LFO.stop(stopTime);
      osc1.stop(stopTime);
      osc2.stop(stopTime);
    } catch (e) {
      console.warn("Whistle playback error:", e);
    }
  }
}

export const audioSynth = new AudioSynthesizer();
