import React, { useState, useRef } from 'react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Dices } from 'lucide-react';

interface DiceRollerProps {
  onBack: () => void;
}

export function DiceRoller({ onBack }: DiceRollerProps) {
  const [rolling, setRolling] = useState(false);
  const [diceCount, setDiceCount] = useState(2);
  const [diceValues, setDiceValues] = useState<number[]>([4, 6]);
  const [total, setTotal] = useState(10);
  const [hasRolled, setHasRolled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [history, setHistory] = useState<{ id: number; values: number[]; total: number }[]>([]);

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

  const playDiceRollSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      // Multiple clatter clicks to sound like rolling dice
      [0, 0.1, 0.22, 0.35, 0.48, 0.6].forEach((timeOffset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600 - i * 50, ctx.currentTime + timeOffset);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + timeOffset + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.05);
      });
    } catch {
      // Audio fallback
    }
  };

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setHasRolled(true);
    playDiceRollSound();

    setTimeout(() => {
      const values: number[] = [];
      let sum = 0;
      for (let i = 0; i < diceCount; i++) {
        const val = Math.floor(Math.random() * 6) + 1;
        values.push(val);
        sum += val;
      }
      setDiceValues(values);
      setTotal(sum);
      setHistory((prev) => [{ id: Date.now(), values, total: sum }, ...prev.slice(0, 4)]);
      setRolling(false);
    }, 800);
  };

  const reset = () => {
    setDiceValues([]);
    setTotal(0);
    setHistory([]);
    setHasRolled(false);
    setRolling(false);
  };

  const handleSetDiceCount = (n: number) => {
    setDiceCount(n);
    setDiceValues([]);
    setTotal(0);
    setHasRolled(false);
  };

  const dieFace = (d: number) => {
    const dots: Record<number, string[]> = {
      1: ['M50 50'],
      2: ['M25 25', 'M75 75'],
      3: ['M25 25', 'M50 50', 'M75 75'],
      4: ['M25 25', 'M75 25', 'M25 75', 'M75 75'],
      5: ['M25 25', 'M75 25', 'M50 50', 'M25 75', 'M75 75'],
      6: ['M25 25', 'M75 25', 'M25 50', 'M75 50', 'M25 75', 'M75 75'],
    };
    return dots[d] || [];
  };

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
              🎲 3D Interactive Dice Roller
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Roll 1 to 5 dice for math exercises, board games, or class pickers!
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
          {history.length > 0 && (
            <button
              onClick={reset}
              disabled={rolling}
              className="px-3.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Arena */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-8 lg:p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-110 space-y-8">
        {/* Dice Count Selector */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-2 rounded-2xl border border-slate-200/60 dark:border-white/5">
          <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 px-2">Number of Dice:</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => handleSetDiceCount(n)}
                className={`w-10 h-10 rounded-xl font-black text-sm transition-all cursor-pointer ${
                  diceCount === n
                    ? 'bg-amber-500 text-white shadow-md scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Rolling Dice View */}
        <div className="flex gap-6 flex-wrap justify-center items-center min-h-32 py-4">
          {diceValues.map((val, i) => (
            <div
              key={i}
              className={`flex flex-col items-center ${
                rolling ? 'animate-bounce scale-110' : !rolling && hasRolled ? 'animate-fade-in' : ''
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="bg-linear-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 p-2.5 rounded-3xl shadow-xl border-2 border-slate-300 dark:border-white/10">
                <svg viewBox="0 0 100 100" width="90" height="90" className="stroke-slate-300 dark:stroke-slate-700">
                  <rect x="4" y="4" width="92" height="92" rx="18" fill="currentColor" className="text-white dark:text-slate-900" strokeWidth="2" />
                  {dieFace(val).map((dot, idx) => {
                    const parts = dot.split(' ');
                    const cx = parts[0].slice(1);
                    const cy = parts[1];
                    return <circle key={idx} cx={cx} cy={cy} r="9" fill="currentColor" className="text-red-600 dark:text-red-500" />;
                  })}
                </svg>
              </div>
            </div>
          ))}

          {Array.from({ length: Math.max(0, diceCount - diceValues.length) }).map((_, n) => (
            <div key={`empty-${n}`} className="flex flex-col items-center opacity-30">
              <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/10">
                <svg viewBox="0 0 100 100" width="90" height="90">
                  <rect x="4" y="4" width="92" height="92" rx="18" fill="none" stroke="currentColor" className="text-slate-400" strokeWidth="2" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Total Score Display */}
        {diceValues.length > 0 && !rolling && (
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-6 py-2.5 rounded-2xl text-lg font-black text-slate-800 dark:text-white">
            <Dices className="w-5 h-5 text-amber-500" />
            Total Sum: <span className="text-2xl text-amber-600 dark:text-amber-400">{total}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={roll}
          disabled={rolling}
          className="px-10 py-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Dices className="w-5 h-5" />
          {rolling ? 'ROLLING DICE...' : 'ROLL DICE NOW'}
        </button>

        {/* History Breakdown */}
        {history.length > 0 && (
          <div className="w-full max-w-md pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Recent Rolls History</span>
            <div className="flex flex-col gap-1.5">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Dice: [{h.values.join(', ')}]</span>
                  <span className="text-amber-500 font-black">Sum: {h.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
