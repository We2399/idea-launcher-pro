import { useCallback, useRef } from 'react';

export const useChatNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (required for autoplay policies)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // Create oscillator for bell-like sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Bell-like frequency (C6 note)
      oscillator.frequency.setValueAtTime(1047, now);
      oscillator.type = 'sine';
      
      // Quick attack, short decay for bell effect
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator.start(now);
      oscillator.stop(now + 0.3);

      // Second tone for pleasant chime
      const oscillator2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      
      // Higher frequency (E6 note)
      oscillator2.frequency.setValueAtTime(1319, now + 0.1);
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0, now + 0.1);
      gainNode2.gain.linearRampToValueAtTime(0.2, now + 0.11);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      oscillator2.start(now + 0.1);
      oscillator2.stop(now + 0.4);
      
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, []);

  return { playNotificationSound };
};
