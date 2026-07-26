import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, RotateCcw, CheckCircle, Maximize2, Minimize2, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface TugOfWarProps {
  onBack: () => void;
}

export function TugOfWar({ onBack }: TugOfWarProps) {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [teamAName, setTeamAName] = useState<string>('Team Alpha');
  const [teamBName, setTeamBName] = useState<string>('Team Bravo');
  const [teamAScore, setTeamAScore] = useState<number>(0);
  const [teamBScore, setTeamBScore] = useState<number>(0);

  const [ropePosition, setRopePosition] = useState(50);
  const [winner, setWinner] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullingTeam, setPullingTeam] = useState<'a' | 'b' | null>(null);
  const [lastPull, setLastPull] = useState(0);
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

  const playPullSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio fallback
    }
  };

  const playVictoryFanfare = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } catch {
      // Audio fallback
    }
  };

  const pull = (team: 'a' | 'b') => {
    if (winner || pulling) return;
    setPulling(true);
    setPullingTeam(team);
    playPullSound();

    const strength = Math.floor(Math.random() * 10) + 1;
    setLastPull(strength);

    const diff = team === 'a' ? -strength : strength;
    const nextPos = Math.max(0, Math.min(100, ropePosition + diff * 2));
    setRopePosition(nextPos);

    if (nextPos <= 0) {
      setWinner(teamAName);
      setTeamAScore((prev) => prev + 1);
      playVictoryFanfare();
    } else if (nextPos >= 100) {
      setWinner(teamBName);
      setTeamBScore((prev) => prev + 1);
      playVictoryFanfare();
    }

    setTimeout(() => {
      setPulling(false);
      setPullingTeam(null);
    }, 500);
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
    <div className="w-full max-w-5xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
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
              ⚔️ Classroom Tug of War Battle
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Classroom group quiz competition — correct answers pull the rope!
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
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Arena */}
      <div
        ref={gameAreaRef}
        className={`relative flex flex-col gap-6 items-center p-6 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden select-none ${
          isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen justify-center bg-white dark:bg-slate-900 p-8' : ''
        }`}
      >
        {/* Team Score Header */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1">
            <input
              type="text"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              className="w-full text-center bg-transparent text-sm font-black text-blue-600 dark:text-blue-400 outline-none uppercase tracking-wider"
            />
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{teamAScore} <span className="text-xs font-bold text-slate-400">Wins</span></div>
          </div>
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-1">
            <input
              type="text"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              className="w-full text-center bg-transparent text-sm font-black text-red-600 dark:text-red-400 outline-none uppercase tracking-wider"
            />
            <div className="text-3xl font-black text-red-600 dark:text-red-400">{teamBScore} <span className="text-xs font-bold text-slate-400">Wins</span></div>
          </div>
        </div>

        {/* Rope Track Stage */}
        <div className="relative flex justify-between items-center w-full min-h-64 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/50 dark:border-white/5 overflow-hidden">
          {/* Ground Line */}
          <div className="absolute left-4 right-4 bottom-6 h-2 bg-slate-300 dark:bg-slate-700 rounded-full z-0" />

          {/* Rope Track */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 flex items-center z-10 overflow-visible">
            <div
              className="h-3 bg-amber-700 border-y border-amber-900 rounded-l-md transition-all duration-300 ease-out shadow-xs"
              style={{ width: `${ropePosition}%` }}
            />
            <div className="flex-1 h-3 bg-amber-700 border-y border-amber-900 rounded-r-md transition-all duration-300 ease-out shadow-xs" />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg transition-all duration-300 ease-out flex items-center justify-center text-[9px] font-black text-white"
              style={{ left: `${ropePosition}%` }}
            >
              🚩
            </div>
          </div>

          {/* Team A Pullers */}
          <div className="flex items-end gap-1 z-20">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className={`origin-bottom transition-all ${
                  pullingTeam === 'a' ? 'animate-bounce' : ''
                }`}
              >
                <div className="text-5xl lg:text-6xl select-none">🧑‍🤝‍🧑</div>
              </div>
            ))}
          </div>

          {/* Team B Pullers */}
          <div className="flex items-end gap-1 z-20 scale-x-[-1]">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className={`origin-bottom transition-all ${
                  pullingTeam === 'b' ? 'animate-bounce' : ''
                }`}
              >
                <div className="text-5xl lg:text-6xl select-none">🧑‍🤝‍🧑</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pull Actions */}
        <div className="flex w-full justify-between items-center gap-4 px-4 flex-wrap">
          <button
            onClick={() => pull('a')}
            disabled={pulling || !!winner}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> {teamAName} Correct Answer (+Pull!)
          </button>

          {lastPull > 0 && (
            <button
              onClick={resetGame}
              className="px-4 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Reset Rope
            </button>
          )}

          <button
            onClick={() => pull('b')}
            disabled={pulling || !!winner}
            className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-red-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> {teamBName} Correct Answer (+Pull!)
          </button>
        </div>

        {/* Victory Celebration Overlay */}
        {winner && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-fade-in p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center shadow-inner animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4" /> VICTORY CELEBRATION <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-3xl lg:text-4xl font-black text-white mt-1">{winner} Wins the Tug of War!</h3>
            </div>
            <button
              onClick={resetGame}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Play Next Round
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
