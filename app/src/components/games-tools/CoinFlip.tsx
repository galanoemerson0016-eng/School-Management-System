import React, { useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface CoinFlipProps {
  onBack: () => void;
}

export function CoinFlip({ onBack }: CoinFlipProps) {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [flipCount, setFlipCount] = useState(0);
  const [headsCount, setHeadsCount] = useState(0);
  const [tailsCount, setTailsCount] = useState(0);

  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    setResult(null);

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
      setFlipping(false);
    }, 1200);
  };

  const reset = () => {
    setResult(null);
    setFlipCount(0);
    setHeadsCount(0);
    setTailsCount(0);
    setFlipping(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Games & Tools
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Coin Flip</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Flip a virtual coin — Heads or Tails!</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 py-8">
          <div className="relative w-40 h-40 perspective-[1000px]">
            <div
              className={`w-full h-full relative transform-3d transition-transform duration-100 ${
                flipping
                  ? 'animate-[coinFlip_1.2s_ease-in-out_forwards]'
                  : result === 'tails'
                  ? 'transform-[rotateY(180deg)]'
                  : 'transform-[rotateY(0deg)]'
              }`}
            >
              {/* Front Face (Heads) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-full bg-amber-400 border-4 border-amber-600 flex items-center justify-center shadow-lg">
                <span className="text-6xl font-black text-amber-950 font-serif">H</span>
              </div>
              {/* Back Face (Tails) */}
              <div className="absolute inset-0 w-full h-full backface-hidden transform-[rotateY(180deg)] rounded-full bg-amber-400 border-4 border-amber-600 flex items-center justify-center shadow-lg">
                <span className="text-6xl font-black text-amber-950 font-serif">T</span>
              </div>
            </div>
          </div>

          {result && !flipping && (
            <div className="text-3xl font-extrabold text-slate-800 dark:text-white capitalize">
              {result}!
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={flip}
              disabled={flipping}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-slate-900 font-bold rounded-xl shadow-md transition"
            >
              {flipping ? 'Flipping...' : 'Flip Coin'}
            </button>

            {flipCount > 0 && (
              <button
                onClick={reset}
                disabled={flipping}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>

          {flipCount > 0 && (
            <div className="flex gap-6 mt-4">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{flipCount}</span>
                <span className="text-xs uppercase font-bold text-slate-400">Flips</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-extrabold text-amber-500">{headsCount}</span>
                <span className="text-xs uppercase font-bold text-slate-400">Heads</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{tailsCount}</span>
                <span className="text-xs uppercase font-bold text-slate-400">Tails</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
