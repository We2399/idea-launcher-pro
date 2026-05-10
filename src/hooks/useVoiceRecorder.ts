import { useCallback, useEffect, useRef, useState } from 'react';

export const MAX_RECORDING_SECONDS = 180; // 3 minutes
export const MIN_RECORDING_SECONDS = 1;

export interface RecordingResult {
  blob: Blob;
  durationSeconds: number;
  mimeType: string;
}

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const resolveRef = useRef<((r: RecordingResult | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setElapsedSeconds(0);
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Pick a supported mime type
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const mimeType = candidates.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const wasCancelled = cancelledRef.current;
        cleanup();
        if (resolveRef.current) {
          if (wasCancelled) {
            resolveRef.current(null);
          } else {
            resolveRef.current({ blob, durationSeconds, mimeType: finalMime });
          }
          resolveRef.current = null;
        }
      };

      startTimeRef.current = Date.now();
      recorder.start(250);
      setIsRecording(true);
      setElapsedSeconds(0);

      intervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 250);

      return true;
    } catch (e) {
      console.error('[VoiceRecorder] start failed', e);
      cleanup();
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup]);

  const stopRecording = useCallback((): Promise<RecordingResult | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }
      resolveRef.current = resolve;
      cancelledRef.current = false;
      mediaRecorderRef.current.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      cleanup();
      return;
    }
    cancelledRef.current = true;
    if (resolveRef.current) {
      // Already awaiting a stop() - mark cancelled so it resolves null
    } else {
      resolveRef.current = () => {};
    }
    try {
      mediaRecorderRef.current.stop();
    } catch {
      cleanup();
    }
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isRecording, elapsedSeconds, startRecording, stopRecording, cancelRecording };
};
