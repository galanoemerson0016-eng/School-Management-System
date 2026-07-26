import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Flame, Play, RotateCcw, Volume2, VolumeX, Eye, EyeOff, Sparkles, Zap } from 'lucide-react';

interface BombPassProps {
  onBack: () => void;
}

export function BombPass({ onBack }: BombPassProps) {
  const [minRandom, setMinRandom] = useState<number>(15);
  const [maxRandom, setMaxRandom] = useState<number>(45);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [totalTime, setTotalTime] = useState<number>(30);
  const [hideTimer, setHideTimer] = useState<boolean>(true); // Hidden timer for maximum thrill & anticipation!
  const [passCount, setPassCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };

  // Synthetic audio tick beep
  const playAudioTone = useCallback((freq: number, durationMs: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio fallback
    }
  }, [soundEnabled]);

  // Synthetic Pass Sound
  const playPassSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Fallback
    }
  };

  // Explosive synth blast sound
  const playExplosionSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();

      // Noise buffer synthesis for explosion blast
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.5);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();
    } catch {
      // Fallback
    }
  }, [soundEnabled]);

  const handleStart = () => {
    const min = Math.max(5, minRandom);
    const max = Math.max(min + 5, maxRandom);
    // Secret random duration for pure suspense!
    const secretSeconds = Math.floor(Math.random() * (max - min + 1)) + min;

    setTotalTime(secretSeconds);
    setTimeLeft(secretSeconds);
    setPassCount(0);
    setIsExploded(false);
    setIsRunning(true);
  };

  const handlePass = () => {
    if (!isRunning || isExploded) return;
    setPassCount((prev) => prev + 1);
    playPassSound();
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsExploded(false);
    setPassCount(0);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
  };

  useEffect(() => {
    if (!isRunning) return;

    tickIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
          setIsRunning(false);
          setIsExploded(true);
          playExplosionSound();
          return 0;
        }

        // Ticking audio accelerates & increases pitch as time runs out
        const percentLeft = prev / totalTime;
        const tickFreq = percentLeft < 0.2 ? 1100 : percentLeft < 0.4 ? 850 : 600;
        playAudioTone(tickFreq, 70, 'square');
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isRunning, totalTime, playAudioTone, playExplosionSound]);

  const progressPerc = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isDangerPhase = progressPerc < 30;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Top Header */}
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
              💣 Bomb Pass / Hot Potato
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pass the potato fast before the secret random bomb explodes!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideTimer(!hideTimer)}
            className={`px-3 py-2 rounded-2xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
              hideTimer
                ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30'
                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/5'
            }`}
            title="Toggle Hidden Suspense Timer"
          >
            {hideTimer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {hideTimer ? 'Timer: Hidden' : 'Timer: Visible'}
          </button>

          {isRunning && (
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30'
                : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-white/5 dark:border-white/5'
            }`}
            title="Toggle Ticking Audio"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Arena */}
      <div className="bg-linear-to-b from-slate-900 via-slate-950 to-black rounded-3xl border border-red-500/20 p-8 lg:p-12 shadow-2xl text-center relative overflow-hidden flex flex-col items-center justify-center min-h-120 select-none">
        {/* Glow ambient background rings */}
        <div className={`absolute -inset-20 rounded-full blur-3xl opacity-20 transition-all duration-500 pointer-events-none ${
          isExploded ? 'bg-red-600 opacity-60 animate-ping' : isRunning ? (isDangerPhase ? 'bg-red-500 opacity-40 animate-pulse' : 'bg-amber-500') : 'bg-slate-700'
        }`} />

        {isExploded ? (
          /* Explosive Shockwave Blast Screen */
          <div className="space-y-6 z-10 animate-bounce">
            <div className="relative inline-block">
              <div className="text-9xl lg:text-10xl animate-ping opacity-75 absolute inset-0">💥</div>
              <div className="text-9xl lg:text-10xl relative z-10 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]">💥</div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-red-500/20 text-red-400 font-black text-xs uppercase tracking-widest border border-red-500/30">
                <Zap className="w-4 h-4 fill-red-400" /> BOMB EXPLODED!
              </div>
              <h3 className="text-4xl lg:text-5xl font-black text-red-500 uppercase tracking-wider drop-shadow-md">
                BOOM! TIME IS UP!
              </h3>
              <p className="text-sm font-bold text-slate-300 max-w-md mx-auto">
                The hot potato exploded! Whoever is holding the potato answers the recitation question!
              </p>
              {passCount > 0 && (
                <p className="text-xs font-black text-amber-400 uppercase tracking-widest pt-2">
                  🥔 Potato Passed {passCount} Times Before Explosion!
                </p>
              )}
            </div>

            <button
              onClick={handleStart}
              className="px-8 py-4 bg-linear-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-red-600/40 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
          </div>
        ) : isRunning ? (
          /* Thrilling Ticking Bomb State */
          <div className="space-y-8 w-full max-w-md z-10">
            {/* Animated 3D Bomb */}
            <div className="relative inline-flex items-center justify-center py-2">
              <div className={`text-8xl lg:text-9xl transition-transform ${isDangerPhase ? 'animate-ping scale-110' : 'animate-bounce'}`}>
                💣
              </div>
              <div className="absolute -top-3 right-0 text-amber-400 animate-pulse drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">
                <Flame className="w-12 h-12 fill-amber-400 animate-bounce" />
              </div>
            </div>

            {/* Timer Display (Hidden or Visible based on toggle) */}
            {hideTimer ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black text-xs uppercase tracking-widest animate-pulse">
                  <Sparkles className="w-4 h-4" /> SECRET SUSPENSE TIMER RUNNING <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                  PASS THE POTATO FAST! 🔥
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  No one knows when it will explode! Keep passing!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-6xl font-black text-white tabular-nums tracking-tight">
                  {timeLeft}
                  <span className="text-lg font-bold text-slate-400 ml-1">sec</span>
                </span>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">
                  Pass the Potato Fast! 🔥
                </p>
                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/10 mt-2">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      progressPerc < 30 ? 'bg-red-500' : progressPerc < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPerc}%` }}
                  />
                </div>
              </div>
            )}

            {/* Pass Potato Button Counter */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handlePass}
                className="w-full py-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-black text-base uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🥔</span> PASS BOMB TO NEXT PLAYER!
              </button>
              {passCount > 0 && (
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  Passed {passCount} {passCount === 1 ? 'time' : 'times'}!
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Idle Configuration State */
          <div className="space-y-8 max-w-md w-full z-10">
            <div className="relative inline-block">
              <div className="text-8xl lg:text-9xl drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">💣</div>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-wide">Random Bomb Pass</h3>
              <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                Set secret random time bounds. The timer is hidden for pure suspense!
              </p>
            </div>

            {/* Duration Range Picker */}
            <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 space-y-3 text-left">
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block text-center">
                🎲 Secret Random Time Range
              </span>
              <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <span>Min:</span>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={minRandom}
                    onChange={(e) => setMinRandom(Number(e.target.value))}
                    className="w-16 p-2 text-center bg-slate-950 border border-white/10 rounded-xl font-black text-white outline-none focus:border-amber-500"
                  />
                  <span>sec</span>
                </div>
                <span className="text-slate-600">·</span>
                <div className="flex items-center gap-2">
                  <span>Max:</span>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={maxRandom}
                    onChange={(e) => setMaxRandom(Number(e.target.value))}
                    className="w-16 p-2 text-center bg-slate-950 border border-white/10 rounded-xl font-black text-white outline-none focus:border-amber-500"
                  />
                  <span>sec</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full py-4 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-base uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              START BOMB TIMER
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
