import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface VoiceMessagePlayerProps {
  audioPath: string; // storage path inside voice-messages bucket
  durationSeconds?: number | null;
  isOwnMessage: boolean;
}

const formatTime = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioPath,
  durationSeconds,
  isOwnMessage,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchUrl = async () => {
      const { data, error } = await supabase.storage
        .from('voice-messages')
        .createSignedUrl(audioPath, 3600);
      if (mounted && !error && data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
    };
    fetchUrl();
    return () => {
      mounted = false;
    };
  }, [audioPath]);

  const togglePlay = async () => {
    if (!signedUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(signedUrl);
      audioRef.current.addEventListener('timeupdate', () => {
        const a = audioRef.current!;
        if (a.duration > 0) {
          setProgress((a.currentTime / a.duration) * 100);
          setCurrentTime(a.currentTime);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      });
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setLoading(true);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error('Voice playback failed', e);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const displayedDuration = currentTime > 0 ? currentTime : durationSeconds || 0;

  return (
    <div className={`flex items-center gap-2 min-w-[180px] ${isOwnMessage ? 'text-primary-foreground' : 'text-foreground'}`}>
      <Button
        type="button"
        size="icon"
        variant={isOwnMessage ? 'secondary' : 'default'}
        className="h-9 w-9 rounded-full flex-shrink-0"
        onClick={togglePlay}
        disabled={!signedUrl || loading}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="flex-1 min-w-0">
        <div className={`h-1.5 rounded-full overflow-hidden ${isOwnMessage ? 'bg-primary-foreground/30' : 'bg-muted'}`}>
          <div
            className={`h-full transition-all ${isOwnMessage ? 'bg-primary-foreground' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={`flex items-center gap-1 mt-1 text-xs ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          <Mic className="h-3 w-3" />
          <span>{formatTime(displayedDuration)}</span>
        </div>
      </div>
    </div>
  );
};
