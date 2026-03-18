"use client";

// Web Audio API utility for programmatic sound effects (No external files needed)

// Singleton AudioContext to prevent exhaustion on mobile
let audioCtx: AudioContext | null = null;

export const playSound = (type: 'success' | 'click' | 'pop' | 'error') => {
  if (typeof window === 'undefined') return;

  // Defer audio playback so it never blocks the main UI thread (fixes button freezing on mobile)
  setTimeout(() => {
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
      }

      // Resume the context if it's suspended (required by mobile browsers)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const ctx = audioCtx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.5);
      } 
      else if (type === 'pop') {
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
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        // automatically stop slightly later instead of hanging
        osc.stop(now + 0.1);
      } else if (type === 'error') {
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
  }, 0);
};
