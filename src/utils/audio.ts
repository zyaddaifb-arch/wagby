"use client";

// Web Audio API utility for programmatic sound effects (No external files needed)
export const playSound = (type: 'success' | 'click' | 'pop' | 'error') => {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext;
    if (!AudioContext) return;
    
    // Create context on the fly to avoid early initialization issues in browsers
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      // Pleasant double chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc.start(now);
      osc.stop(now + 0.5);
    } 
    else if (type === 'pop') {
      // Soft bubble pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.15);
    }
    else if (type === 'click') {
      // Very short, subtle click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      osc.start(now);
    } else if (type === 'error') {
      // Low double thump
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(100, now + 0.1);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
