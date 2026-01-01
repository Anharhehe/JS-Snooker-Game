// Sound effect management using Web Audio API
let soundManager = {
  audioContext: null,
  collisionOscillators: [],
  lastCollisionTime: 0,
  minTimeBetweenSounds: 30, // milliseconds to prevent sound spam
  masterVolume: 0.2,
  enabled: true,

  init: function() {
    // Initialize Web Audio API
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
      return;
    }
  },

  playCollisionSound: function(intensity = 1) {
    if (!this.enabled || !this.audioContext) return;

    // Prevent sound spam
    const now = Date.now();
    if (now - this.lastCollisionTime < this.minTimeBetweenSounds) {
      return;
    }
    this.lastCollisionTime = now;

    try {
      // Create a short collision sound using Web Audio API
      const ctx = this.audioContext;
      
      // Resume audio context if needed (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      // Pick random frequency based on intensity
      const baseFreq = 300 + Math.random() * 400;
      const frequency = baseFreq + intensity * 200;
      
      // Create oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      // Set up oscillator
      osc.type = 'sine';
      osc.frequency.value = frequency;

      // Set up filter for smoother sound
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      // Create quick amplitude envelope
      const now = ctx.currentTime;
      const duration = 0.05 + intensity * 0.05; // 50-100ms
      
      gain.gain.setValueAtTime(this.masterVolume * intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      // Pitch bend - frequency slides down
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, now + duration);

      // Play sound
      osc.start(now);
      osc.stop(now + duration);

      // Clean up
      setTimeout(() => {
        try {
          osc.disconnect();
          gain.disconnect();
          filter.disconnect();
        } catch (e) {}
      }, duration * 1000 + 100);

    } catch (e) {
      console.warn('Error playing collision sound:', e);
    }
  },

  setVolume: function(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  },

  setEnabled: function(enabled) {
    this.enabled = enabled;
  }
};
