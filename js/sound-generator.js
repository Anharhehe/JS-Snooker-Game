// This file generates collision sounds as Data URIs
// Run this in browser console to generate MP3s

function generateCollisionSounds() {
  // Generate a simple collision sound using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  function createCollisionSound(frequency, duration) {
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Create a short beep that decays
    for (let i = 0; i < buffer.length; i++) {
      const t = i / audioContext.sampleRate;
      const decay = Math.exp(-5 * t); // Exponential decay
      const envelope = Math.cos(2 * Math.PI * frequency * t) * decay;
      data[i] = envelope * 0.3;
    }
    
    return buffer;
  }
  
  // Create three different collision sounds
  const sound1 = createCollisionSound(800, 0.1); // High pitched
  const sound2 = createCollisionSound(600, 0.12); // Mid pitched
  const sound3 = createCollisionSound(400, 0.15); // Low pitched
  
  // You would need to use an audio encoder to convert to MP3
  // For now, we'll just log that this would be used
  console.log('Collision sounds generated', [sound1, sound2, sound3]);
}

// Call this to generate sounds
// generateCollisionSounds();
