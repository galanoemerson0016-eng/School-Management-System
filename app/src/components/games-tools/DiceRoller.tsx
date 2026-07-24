import React, { useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface DiceRollerProps {
  onBack: () => void;
}

export function DiceRoller({ onBack }: DiceRollerProps) {
  const [rolling, setRolling] = useState(false);
  const [diceCount, setDiceCount] = useState(1);
  const [diceValues, setDiceValues] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [hasRolled, setHasRolled] = useState(false);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setHasRolled(true);

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
      setRolling(false);
    }, 900);
  };

  const reset = () => {
    setDiceValues([]);
    setTotal(0);
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
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dice Roller</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Roll up to 5 virtual dice</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 py-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">Dice:</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => handleSetDiceCount(n)}
                  className={`w-9 h-9 rounded-lg border font-bold text-sm transition ${
                    diceCount === n
                      ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-sm'
                      : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-5 flex-wrap justify-center min-h-27.5 items-end pb-2">
            {diceValues.map((val, i) => (
              <div
                key={i}
                className={`flex flex-col items-center ${
                  rolling ? 'animate-[dieTumble_0.9s_ease-in-out]' : !rolling && hasRolled ? 'animate-[dieLand_0.35s_ease-out]' : ''
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-md border border-slate-200 dark:border-white/5">
                  <svg viewBox="0 0 100 100" width="80" height="80" className="stroke-slate-200 dark:stroke-slate-700">
                    <rect x="4" y="4" width="92" height="92" rx="14" fill="currentColor" className="text-white dark:text-slate-800" strokeWidth="2" />
                    {dieFace(val).map((dot, idx) => {
                      const parts = dot.split(' ');
                      const cx = parts[0].slice(1);
                      const cy = parts[1];
                      return <circle key={idx} cx={cx} cy={cy} r="8" fill="currentColor" className="text-slate-900 dark:text-slate-100" />;
                    })}
                  </svg>
                </div>
                <div
                  className={`w-15 h-2 bg-black/10 dark:bg-black/30 rounded-full mt-1 transition-all ${
                    rolling
                      ? 'animate-[shadowTumble_0.9s_ease-in-out]'
                      : !rolling && hasRolled
                      ? 'animate-[shadowLand_0.35s_ease-out]'
                      : ''
                  }`}
                />
              </div>
            ))}

            {Array.from({ length: Math.max(0, diceCount - diceValues.length) }).map((_, n) => (
              <div key={`empty-${n}`} className="flex flex-col items-center opacity-40">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
                  <svg viewBox="0 0 100 100" width="80" height="80">
                    <rect x="4" y="4" width="92" height="92" rx="14" fill="none" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" />
                  </svg>
                </div>
                <div className="w-15 h-2 bg-black/5 dark:bg-black/15 rounded-full mt-1" />
              </div>
            ))}
          </div>

          {diceValues.length > 0 && !rolling && (
            <div className="text-lg font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-full">
              Total: <strong className="text-amber-500 font-extrabold">{total}</strong>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={roll}
              disabled={rolling}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-slate-900 font-bold rounded-xl shadow-md transition"
            >
              {rolling ? 'Rolling...' : 'Roll Dice'}
            </button>

            {hasRolled && (
              <button
                onClick={reset}
                disabled={rolling}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
