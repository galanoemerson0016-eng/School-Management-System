import React, { useState, useRef } from 'react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

interface CoinFlipProps {
  onBack: () => void;
}

export function CoinFlip({ onBack }: CoinFlipProps) {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [prediction, setPrediction] = useState<'heads' | 'tails' | null>(null);
  const [flipCount, setFlipCount] = useState(0);
  const [headsCount, setHeadsCount] = useState(0);
  const [tailsCount, setTailsCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };

  const playCoinFlipSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio fallback
    }
  };

  const playLandingClinkSound = (isWinPrediction: boolean) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isWinPrediction ? 987.77 : 523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio fallback
    }
  };

  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    setResult(null);
    playCoinFlipSound();

    setTimeout(() => {
      const isHeads = Math.random() < 0.5;
      const res = isHeads ? 'heads' : 'tails';
      setResult(res);
      setFlipCount((prev) => prev + 1);
      if (isHeads) {
        setHeadsCount((prev) => prev + 1);
      } else {
        setTailsCount((prev) => prev + 1);
      }
      const isCorrectGuess = prediction === res;
      playLandingClinkSound(isCorrectGuess);
      setFlipping(false);
    }, 1200);
  };

  const reset = () => {
    setResult(null);
    setPrediction(null);
    setFlipCount(0);
    setHeadsCount(0);
    setTailsCount(0);
    setFlipping(false);
  };

  const headsPerc = flipCount > 0 ? Math.round((headsCount / flipCount) * 100) : 0;
  const tailsPerc = flipCount > 0 ? Math.round((tailsCount / flipCount) * 100) : 0;

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
              🪙 3D Coin Flip Simulator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Flip a metallic coin for quick decisions or probability lessons!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30'
                : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-white/5 dark:border-white/5'
            }`}
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          {flipCount > 0 && (
            <button
              onClick={reset}
              disabled={flipping}
              className="px-3.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Stats
            </button>
          )}
        </div>
      </div>

      {/* Main Arena */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-8 lg:p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-110 space-y-6">
        {/* Prediction Selector */}
        <div className="space-y-2">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Guess Outcome (Optional)
          </span>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPrediction('heads')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                prediction === 'heads'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Predict HEADS
            </button>
            <button
              onClick={() => setPrediction('tails')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                prediction === 'tails'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Predict TAILS
            </button>
          </div>
        </div>

        {/* 3D Metallic Gold Coin */}
        <div className="relative w-44 h-44 perspective-[1000px] my-4">
          <div
            className={`w-full h-full relative transform-3d transition-transform duration-150 ${
              flipping
                ? 'animate-[coinFlip_1.2s_ease-in-out_forwards]'
                : result === 'tails'
                ? 'transform-[rotateY(180deg)]'
                : 'transform-[rotateY(0deg)]'
            }`}
          >
            {/* Front Face (Heads) */}
            <div className="absolute inset-0 w-full h-full backface-hidden rounded-full bg-linear-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-amber-600 flex flex-col items-center justify-center shadow-xl shadow-amber-500/20">
              <span className="text-6xl font-black text-amber-950 font-serif drop-shadow-xs">H</span>
              <span className="text-[10px] font-black uppercase text-amber-900 tracking-widest">HEADS</span>
            </div>
            {/* Back Face (Tails) */}
            <div className="absolute inset-0 w-full h-full backface-hidden transform-[rotateY(180deg)] rounded-full bg-linear-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-amber-600 flex flex-col items-center justify-center shadow-xl shadow-amber-500/20">
              <span className="text-6xl font-black text-amber-950 font-serif drop-shadow-xs">T</span>
              <span className="text-[10px] font-black uppercase text-amber-900 tracking-widest">TAILS</span>
            </div>
          </div>
        </div>

        {/* Flip Result Announcement */}
        {result && !flipping && (
          <div className="space-y-2 animate-bounce">
            <div className="text-3xl lg:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
              {result}!
            </div>
            {prediction && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                {prediction === result ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Correct Guess!
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Wrong Guess!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={flip}
          disabled={flipping}
          className="px-10 py-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
        >
          {flipping ? 'FLIPPING COIN...' : 'FLIP COIN NOW'}
        </button>

        {/* Stats Tally */}
        {flipCount > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-white/5 w-full max-w-sm">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{flipCount}</span>
              <span className="text-[10px] font-black uppercase text-slate-400 block mt-0.5">Total Flips</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{headsCount}</span>
              <span className="text-[10px] font-black uppercase text-amber-600/80 dark:text-amber-400/80 block mt-0.5">Heads ({headsPerc}%)</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{tailsCount}</span>
              <span className="text-[10px] font-black uppercase text-blue-600/80 dark:text-blue-400/80 block mt-0.5">Tails ({tailsPerc}%)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
