import React from 'react';
import { ArrowLeft, Volume2, Bell, Award, HelpCircle, Ban, RefreshCw, Clock } from 'lucide-react';

interface SoundboardProps {
  onBack: () => void;
}

interface SoundItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
  play: (ctx: AudioContext) => void;
}

export function Soundboard({ onBack }: SoundboardProps) {
  const playCorrectSound = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;
    
    // Arpeggio
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.start(now);
    osc.stop(now + 0.65);
  };

  const playIncorrectSound = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.start(now);
    osc.stop(now + 0.5);
  };

  const playBellSound = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(880, now); // A5

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.start(now);
    osc.stop(now + 1.3);
  };

  const playChimeSound = (ctx: AudioContext) => {
    const now = ctx.currentTime;
    const notes = [587.33, 659.25, 783.99, 880.00, 987.77]; // D5, E5, G5, A5, B5
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  };

  const playTickingSound = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(4000, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.06);
  };

  const playDrumrollSound = (ctx: AudioContext) => {
    const now = ctx.currentTime;
    const duration = 1.5;
    
    // Create noise buffer for drum snare
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);

    const gain = ctx.createGain();
    
    // Drum roll amplitude modulation
    for (let t = 0; t < duration; t += 0.08) {
      gain.gain.setValueAtTime(0.08 + Math.random() * 0.1, now + t);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);

    // Final crash cymbal at the end
    setTimeout(() => {
      const crashOsc = ctx.createOscillator();
      const crashGain = ctx.createGain();
      crashOsc.connect(crashGain);
      crashGain.connect(ctx.destination);
      crashOsc.type = 'triangle';
      crashOsc.frequency.setValueAtTime(80, ctx.currentTime);
      crashGain.gain.setValueAtTime(0.35, ctx.currentTime);
      crashGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      crashOsc.start();
      crashOsc.stop(ctx.currentTime + 0.6);
    }, duration * 1000);
  };

  const sounds: SoundItem[] = [
    { id: 'correct', name: 'Correct Chime', description: 'Rewarding sound for correct answers.', icon: Award, color: '#10B981', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20 hover:border-emerald-500', play: playCorrectSound },
    { id: 'wrong', name: 'Wrong Buzzer', description: 'Alert for incorrect or try again.', icon: Ban, color: '#EF4444', bgColor: 'bg-red-50 dark:bg-red-950/20 hover:border-red-500', play: playIncorrectSound },
    { id: 'bell', name: 'Attention Bell', description: 'Clean bell ring to focus the room.', icon: Bell, color: '#F59E0B', bgColor: 'bg-amber-50 dark:bg-amber-950/20 hover:border-amber-500', play: playBellSound },
    { id: 'chime', name: 'Wind Chime', description: 'Soothing sweep for transition cues.', icon: RefreshCw, color: '#3B82F6', bgColor: 'bg-blue-50 dark:bg-blue-950/20 hover:border-blue-500', play: playChimeSound },
    { id: 'tick', name: 'Clock Tick', description: 'Quick warning sound for countdowns.', icon: Clock, color: '#8B5CF6', bgColor: 'bg-purple-50 dark:bg-purple-950/20 hover:border-purple-500', play: playTickingSound },
    { id: 'drumroll', name: 'Drum Roll', description: 'Build suspense before revealing winners.', icon: HelpCircle, color: '#EC4899', bgColor: 'bg-pink-50 dark:bg-pink-950/20 hover:border-pink-500', play: playDrumrollSound },
  ];

  const handlePlay = (playFn: (ctx: AudioContext) => void) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      playFn(ctx);
    } catch (err) {
      console.error('Failed to play sound: ', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Classroom Soundboard</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Play quick audio cues to manage transitions and give feedback.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {sounds.map((sound) => {
            const Icon = sound.icon;
            return (
              <div
                key={sound.id}
                onClick={() => handlePlay(sound.play)}
                className={`flex items-center gap-4 p-4 border-2 border-slate-200 dark:border-white/5 rounded-2xl cursor-pointer transition select-none shadow-xs group hover:scale-[1.02] active:scale-95 ${sound.bgColor}`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5">
                  <Icon className="w-6 h-6" style={{ color: sound.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white group-hover:text-amber-600 transition-colors">
                    {sound.name}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2">
                    {sound.description}
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
