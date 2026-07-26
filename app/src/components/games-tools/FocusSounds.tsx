import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, CloudRain, Trees, Coffee, Waves, Disc } from 'lucide-react';

interface FocusSoundsProps {
  onBack: () => void;
}

interface SoundTrack {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
}

export function FocusSounds({ onBack }: FocusSoundsProps) {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const tracks: SoundTrack[] = [
    { id: 'rain', name: 'Gentle Rain', description: 'Soft raindrops for deep focus and reading', icon: CloudRain, color: '#0284C7', bgColor: '#E0F2FE' },
    { id: 'forest', name: 'Forest & Birds', description: 'Calming nature ambience and gentle breeze', icon: Trees, color: '#059669', bgColor: '#D1FAE5' },
    { id: 'cafe', name: 'Cozy Library Cafe', description: 'Subtle background murmur and page turns', icon: Coffee, color: '#D97706', bgColor: '#FEF3C7' },
    { id: 'waves', name: 'Ocean Waves', description: 'Rhythmic shore waves for exam concentration', icon: Waves, color: '#2563EB', bgColor: '#EFF6FF' },
    { id: 'binaural', name: 'Deep Focus Drift', description: 'Alpha wave white noise for silent seatwork', icon: Disc, color: '#7C3AED', bgColor: '#F3E8FF' },
  ];

  // Stop current audio generator
  const stopAudio = () => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
      } catch {
        // Fallback
      }
      noiseNodeRef.current = null;
    }
  };

  // Synthesize realistic ambient noise loops via Web Audio API
  const startAudioTrack = (trackId: string) => {
    stopAudio();

    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Synthesize pink/brown noise for ambient soundscapes
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (trackId === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
      } else if (trackId === 'waves') {
        filter.type = 'lowpass';
        filter.frequency.value = 400;
      } else if (trackId === 'forest') {
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 800;
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
      gainNodeRef.current = gain;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseNodeRef.current = noise;
    } catch {
      // Fallback
    }
  };

  const handleSelectTrack = (id: string) => {
    if (activeTrackId === id && isPlaying) {
      setIsPlaying(false);
      stopAudio();
    } else {
      setActiveTrackId(id);
      setIsPlaying(true);
      startAudioTrack(id);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAudio();
    } else if (activeTrackId) {
      setIsPlaying(true);
      startAudioTrack(activeTrackId);
    } else {
      handleSelectTrack('rain');
    }
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume * 0.3, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-4 lg:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              🎧 Classroom Focus & Ambient Sounds
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Calming background ambience for silent seatwork and exams
            </p>
          </div>
        </div>

        {/* Master Play Button */}
        <button
          onClick={handleTogglePlay}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md ${
            isPlaying
              ? 'bg-amber-500 text-white shadow-amber-500/25'
              : 'bg-emerald-600 text-white shadow-emerald-600/25'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'PAUSE AMBIENCE' : 'PLAY AMBIENCE'}
        </button>
      </div>

      {/* Main Player & Volume Controls */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 lg:p-8 shadow-sm space-y-8">
        {/* Equalizer Wave Visualizer */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-1.5 h-12">
            {[40, 70, 30, 90, 50, 80, 40, 60, 100, 50, 80, 30].map((h, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  isPlaying ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-white/20'
                }`}
                style={{
                  height: isPlaying ? `${h}%` : '20%',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 w-full max-w-xs pt-2">
            <VolumeX className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer"
            />
            <Volume2 className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Ambient Sound Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => {
            const Icon = track.icon;
            const isSelected = activeTrackId === track.id && isPlaying;
            return (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track.id)}
                className={`p-4 rounded-2xl border flex items-start gap-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 shadow-md scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/5 hover:border-amber-400'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: track.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: track.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    {track.name}
                    {isSelected && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {track.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
