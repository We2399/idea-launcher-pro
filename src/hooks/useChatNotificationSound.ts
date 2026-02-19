import { useCallback, useEffect, useRef } from 'react';

export const useChatNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  // Unlock AudioContext on first user interaction (required by browser autoplay policy)
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            console.log('[ChatSound] AudioContext unlocked via user gesture');
            unlockedRef.current = true;
          });
        } else {
          unlockedRef.current = true;
        }
        
        // Play a silent buffer to fully unlock on iOS
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (e) {
        console.log('[ChatSound] Failed to unlock AudioContext:', e);
      }
    };

    document.addEventListener('click', unlock, { once: false });
    document.addEventListener('touchstart', unlock, { once: false });
    document.addEventListener('keydown', unlock, { once: false });

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // First tone (C6)
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(1047, now);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);

      // Second tone (E6)
      const oscillator2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      oscillator2.frequency.setValueAtTime(1319, now + 0.1);
      oscillator2.type = 'sine';
      gainNode2.gain.setValueAtTime(0, now + 0.1);
      gainNode2.gain.linearRampToValueAtTime(0.2, now + 0.11);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      oscillator2.start(now + 0.1);
      oscillator2.stop(now + 0.4);

      console.log('[ChatSound] Notification sound played');
    } catch (error) {
      console.log('[ChatSound] Could not play notification sound:', error);
    }
  }, []);

  return { playNotificationSound };
};
