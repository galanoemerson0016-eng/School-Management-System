import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface NoiseDetectionProps {
  onBack: () => void;
}

const THRESHOLDS = {
  quiet: { max: 30, color: '#059669', text: 'Great job! Room is quiet.', bg: '#ECFDF5', bgDark: 'rgba(5, 150, 105, 0.15)' },
  moderate: { max: 70, color: '#F59E0B', text: 'Getting loud. Lower your voices.', bg: '#FFFBEB', bgDark: 'rgba(245, 158, 11, 0.15)' },
  loud: { max: 100, color: '#DC2626', text: 'Too loud! Please be quiet.', bg: '#FEF2F2', bgDark: 'rgba(220, 38, 38, 0.15)' },
};

export function NoiseDetection({ onBack }: NoiseDetectionProps) {
  const [isListening, setIsListening] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [statusText, setStatusText] = useState('Ready');
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicPermission('granted');

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const mic = audioCtx.createMediaStreamSource(stream);
      mic.connect(analyser);
      microphoneRef.current = mic;

      setIsListening(true);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setMicPermission('denied');
        setStatusText('Microphone permission denied.');
      } else {
        setStatusText('Could not access microphone.');
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    setVolumeLevel(0);
    setStatusText('Monitoring paused');
  };

  useEffect(() => {
    if (!isListening) return;

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Map 0-128 range to 0-100
      const normalized = Math.min(100, Math.round((average / 128) * 100));
      setVolumeLevel(normalized);

      // Determine status
      if (normalized <= THRESHOLDS.quiet.max) {
        setStatusText(THRESHOLDS.quiet.text);
      } else if (normalized <= THRESHOLDS.moderate.max) {
        setStatusText(THRESHOLDS.moderate.text);
      } else {
        setStatusText(THRESHOLDS.loud.text);
      }

      animationFrameIdRef.current = requestAnimationFrame(updateVolume);
    };

    animationFrameIdRef.current = requestAnimationFrame(updateVolume);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isListening]);

  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (microphoneRef.current) microphoneRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const getStatusBg = () => {
    if (!isListening) return '';
    if (volumeLevel <= THRESHOLDS.quiet.max) return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-300';
    if (volumeLevel <= THRESHOLDS.moderate.max) return 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-700 dark:text-amber-300';
    return 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-300';
  };

  const getMeterColor = () => {
    if (!isListening) return 'bg-slate-300 dark:bg-slate-600';
    if (volumeLevel <= THRESHOLDS.quiet.max) return 'bg-emerald-500';
    if (volumeLevel <= THRESHOLDS.moderate.max) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Noise Detection</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Monitor classroom sound levels in real time</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-xl mx-auto py-4">
          <div
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition ${
              isListening ? getStatusBg() : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="shrink-0">
              {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">{isListening ? statusText : 'Monitoring paused'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full h-9 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-100 ease-out ${getMeterColor()}`}
                style={{ width: `${volumeLevel}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Quiet</span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-white">{isListening ? `${volumeLevel}%` : '--'}</span>
              <span>Loud</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Quiet (0–30%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Moderate (31–70%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span>Loud (71–100%)</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 mt-2">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl shadow-md transition w-full max-w-xs ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/20'
              }`}
            >
              {isListening ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              {isListening ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>

            {micPermission === 'denied' && (
              <p className="text-center text-xs text-red-500 leading-normal max-w-md">
                Microphone access was blocked. Please allow microphone access in your browser or app settings to use this tool.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
