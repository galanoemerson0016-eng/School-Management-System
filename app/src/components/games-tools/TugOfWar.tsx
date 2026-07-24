import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Scale, Trophy, RotateCcw, CheckCircle, Maximize2, Minimize2 } from 'lucide-react';

interface TugOfWarProps {
  onBack: () => void;
}

export function TugOfWar({ onBack }: TugOfWarProps) {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [ropePosition, setRopePosition] = useState(50);
  const [winner, setWinner] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullingTeam, setPullingTeam] = useState<'a' | 'b' | null>(null);
  const [lastPull, setLastPull] = useState(0);

  const pull = (team: 'a' | 'b') => {
    if (winner || pulling) return;
    setPulling(true);
    setPullingTeam(team);

    const strength = Math.floor(Math.random() * 10) + 1;
    setLastPull(strength);

    const diff = team === 'a' ? -strength : strength;
    const nextPos = Math.max(0, Math.min(100, ropePosition + diff * 2));
    setRopePosition(nextPos);

    if (nextPos <= 0) {
      setWinner('Team A');
    } else if (nextPos >= 100) {
      setWinner('Team B');
    }

    setTimeout(() => {
      setPulling(false);
      setPullingTeam(null);
    }, 600);
  };

  const resetGame = () => {
    setRopePosition(50);
    setWinner(null);
    setLastPull(0);
    setPulling(false);
    setPullingTeam(null);
  };

  const toggleFullscreen = () => {
    const el = gameAreaRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm relative">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tug of War</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ask any question — click the team with the correct answer to pull the rope.</p>
              </div>
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>

        <div
          ref={gameAreaRef}
          className={`relative flex flex-col gap-6 items-center p-4 bg-slate-50 dark:bg-[#090d16] rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden ${
            isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen justify-center' : ''
          }`}
        >
          <div className={`relative flex justify-between items-center w-full min-h-65 pb-6 px-4`}>
            {/* Ground Floor */}
            <div className="absolute left-2 right-2 bottom-6 h-1.5 bg-linear-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600 rounded-full z-0" />

            {/* Rope Track */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 flex items-center z-10 overflow-visible">
              <div
                className="h-2 bg-amber-800 border-y border-amber-900 rounded-l-md transition-all duration-500 ease-out"
                style={{ width: `${ropePosition}%` }}
              />
              <div
                className="flex-1 h-2 bg-amber-800 border-y border-amber-900 rounded-r-md transition-all duration-500 ease-out"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md transition-all duration-500 ease-out"
                style={{ left: `${ropePosition}%` }}
              />
            </div>

            {/* Team A Kids */}
            <div className={`flex items-end gap-2 z-20`}>
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`origin-bottom ${
                    pullingTeam === 'a'
                      ? 'animate-[struggleA_0.12s_ease-in-out_infinite]'
                      : pullingTeam === 'b'
                      ? 'animate-[pulledForwardA_0.18s_ease-in-out_infinite]'
                      : 'animate-[idleBobA_2.2s_ease-in-out_infinite]'
                  }`}
                  style={{ animationDelay: `${idx * 0.35}s` }}
                >
                  <svg width="80" height="150" viewBox="0 0 56 90" style={{ overflow: 'visible' }}>
                    <circle cx="24" cy="18" r="11" fill="#FFD1A9" />
                    <circle cx="26" cy="17" r="1.5" fill="#111827" />
                    <circle cx="33" cy="17" r="1.5" fill="#111827" />
                    <path d="M27,23 Q30,25 33,23" fill="none" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" />
                    <rect x="14" y="30" width="28" height="26" rx="7" fill="#2563EB" transform="rotate(-22 28 43)" />
                    <rect x="34" y="34" width="26" height="7" rx="3" fill="#FFD1A9" transform="rotate(-4 47 37.5)" />
                    <circle cx="60" cy="37" r="4" fill="#FFD1A9" />
                    <rect x="14" y="52" width="28" height="14" rx="5" fill="#DC2626" transform="rotate(-22 28 59)" />
                    <rect x="14" y="62" width="9" height="22" rx="4" fill="#FFD1A9" transform="rotate(20 18.5 73)" />
                    <ellipse cx="15" cy="84" rx="7" ry="4" fill="#FACC15" transform="rotate(20 15 84)" />
                  </svg>
                </div>
              ))}
            </div>

            {/* Team B Kids */}
            <div className={`flex items-end gap-2 z-20`}>
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`origin-bottom ${
                    pullingTeam === 'b'
                      ? 'animate-[struggleB_0.12s_ease-in-out_infinite]'
                      : pullingTeam === 'a'
                      ? 'animate-[pulledForwardB_0.18s_ease-in-out_infinite]'
                      : 'animate-[idleBobB_2.2s_ease-in-out_infinite]'
                  }`}
                  style={{ animationDelay: `${idx * 0.35}s` }}
                >
                  <svg width="80" height="150" viewBox="0 0 56 90" style={{ overflow: 'visible' }}>
                    <circle cx="32" cy="18" r="11" fill="#FFD1A9" />
                    <circle cx="23" cy="17" r="1.5" fill="#111827" />
                    <circle cx="30" cy="17" r="1.5" fill="#111827" />
                    <path d="M27,23 Q24,25 21,23" fill="none" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" />
                    <rect x="14" y="30" width="28" height="26" rx="7" fill="#DC2626" transform="rotate(22 28 43)" />
                    <rect x="-4" y="34" width="26" height="7" rx="3" fill="#FFD1A9" transform="rotate(4 9 37.5)" />
                    <circle cx="-4" cy="37" r="4" fill="#FFD1A9" />
                    <rect x="14" y="52" width="28" height="14" rx="5" fill="#F97316" transform="rotate(22 28 59)" />
                    <rect x="33" y="62" width="9" height="22" rx="4" fill="#FFD1A9" transform="rotate(-20 37.5 73)" />
                    <ellipse cx="41" cy="84" rx="7" ry="4" fill="#FACC15" transform="rotate(-20 41 84)" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex w-full justify-between items-center gap-4 px-4 flex-wrap mt-4">
            <div className="flex flex-col items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold rounded-full text-xs">Team A</span>
              {!winner && (
                <button
                  onClick={() => pull('a')}
                  disabled={pulling}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition"
                >
                  <CheckCircle className="w-4 h-4" /> Correct
                </button>
              )}
            </div>

            <div className="flex flex-col items-center">
              {lastPull > 0 && (
                <button
                  onClick={resetGame}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-700 dark:text-slate-300 font-semibold transition"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="px-3 py-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold rounded-full text-xs">Team B</span>
              {!winner && (
                <button
                  onClick={() => pull('b')}
                  disabled={pulling}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl transition"
                >
                  <CheckCircle className="w-4 h-4" /> Correct
                </button>
              )}
            </div>
          </div>

          {winner && (
            <div className="absolute inset-0 bg-white/95 dark:bg-[#0f172a]/95 flex flex-col items-center justify-center z-30 animate-fade-in p-6">
              <Trophy className="w-16 h-16 text-amber-500 mb-2 animate-bounce" />
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">{winner} Wins!</h3>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-md transition"
              >
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
