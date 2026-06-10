import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Flag, Timer as TimerIcon, Watch } from 'lucide-react';

interface TimerStopwatchProps {
  onBack: () => void;
}

export function TimerStopwatch({ onBack }: TimerStopwatchProps) {
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch');

  // Stopwatch state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<{ index: number; time: number; split: number }[]>([]);
  const stopwatchIntervalRef = useRef<number | null>(null);
  const stopwatchStartTimeRef = useRef(0);
  const stopwatchPausedAtRef = useRef(0);

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRemainingMs, setTimerRemainingMs] = useState(0);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);
  const timerEndAtRef = useRef(0);

  const activeTimerMinutes = useMemo(() => {
    const totalSeconds = Math.ceil(timerRemainingMs / 1000);
    return Math.floor(totalSeconds / 60);
  }, [timerRemainingMs]);

  const activeTimerSeconds = useMemo(() => {
    const totalSeconds = Math.ceil(timerRemainingMs / 1000);
    return totalSeconds % 60;
  }, [timerRemainingMs]);

  const formatTime = (totalMs: number): string => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const ms = Math.floor((totalMs % 1000) / 10);
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    const mss = String(ms).padStart(2, '0');
    if (h > 0) {
      const hh = String(h).padStart(2, '0');
      return `${hh}:${mm}:${ss}.${mss}`;
    }
    return `${mm}:${ss}.${mss}`;
  };

  const formatTimerDisplay = (minutes: number, seconds: number): string => {
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Stopwatch controls
  const startStopwatch = () => {
    if (isRunning) return;
    setIsRunning(true);
    stopwatchStartTimeRef.current = performance.now() - stopwatchPausedAtRef.current;
    stopwatchIntervalRef.current = window.setInterval(() => {
      setElapsedMs(performance.now() - stopwatchStartTimeRef.current);
    }, 10);
  };

  const stopStopwatch = () => {
    if (!isRunning) return;
    setIsRunning(false);
    stopwatchPausedAtRef.current = elapsedMs;
    if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
      stopwatchIntervalRef.current = null;
    }
  };

  const resetStopwatch = () => {
    stopStopwatch();
    setElapsedMs(0);
    stopwatchPausedAtRef.current = 0;
    setLaps([]);
  };

  const lapStopwatch = () => {
    if (!isRunning) return;
    const lastLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
    const split = elapsedMs - lastLapTime;
    setLaps((prev) => [
      ...prev,
      {
        index: prev.length + 1,
        time: elapsedMs,
        split,
      },
    ]);
  };

  // Timer controls
  const startTimer = () => {
    if (timerIsRunning) return;
    const totalMs = (timerMinutes * 60 + timerSeconds) * 1000;
    if (totalMs <= 0) return;
    setTimerRemainingMs(totalMs);
    setTimerIsRunning(true);
    timerEndAtRef.current = performance.now() + totalMs;
    timerIntervalRef.current = window.setInterval(() => {
      const remaining = timerEndAtRef.current - performance.now();
      if (remaining <= 0) {
        setTimerRemainingMs(0);
        setTimerIsRunning(false);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      } else {
        setTimerRemainingMs(remaining);
      }
    }, 10);
  };

  const stopTimer = () => {
    if (!timerIsRunning) return;
    setTimerIsRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    setTimerRemainingMs(0);
  };

  const toggleTimer = () => {
    if (timerIsRunning) {
      stopTimer();
    } else {
      if (timerRemainingMs > 0) {
        setTimerIsRunning(true);
        timerEndAtRef.current = performance.now() + timerRemainingMs;
        timerIntervalRef.current = window.setInterval(() => {
          const remaining = timerEndAtRef.current - performance.now();
          if (remaining <= 0) {
            setTimerRemainingMs(0);
            setTimerIsRunning(false);
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
          } else {
            setTimerRemainingMs(remaining);
          }
        }, 10);
      } else {
        startTimer();
      }
    }
  };

  const adjustTimerMinutes = (delta: number) => {
    setTimerMinutes((prev) => Math.max(0, Math.min(99, prev + delta)));
  };

  const adjustTimerSeconds = (delta: number) => {
    setTimerSeconds((prev) => Math.max(0, Math.min(59, prev + delta)));
  };

  useEffect(() => {
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

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
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Timer & Stopwatch</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Track time with stopwatch or set a countdown timer</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 items-center py-4">
          <div className="inline-flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setMode('stopwatch')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition ${
                mode === 'stopwatch'
                  ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Watch className="w-4 h-4" /> Stopwatch
            </button>
            <button
              onClick={() => setMode('timer')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition ${
                mode === 'timer'
                  ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TimerIcon className="w-4 h-4" /> Timer
            </button>
          </div>

          {mode === 'stopwatch' ? (
            <div className="flex flex-col items-center gap-6 w-full max-w-md">
              <div className="text-5xl font-extrabold text-slate-800 dark:text-white font-mono tracking-tight leading-none tabular-nums">
                {formatTime(elapsedMs)}
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={resetStopwatch}
                  disabled={!isRunning && elapsedMs === 0}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition disabled:opacity-40"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>

                <button
                  onClick={isRunning ? stopStopwatch : startStopwatch}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-md transition"
                >
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isRunning ? 'Stop' : 'Start'}
                </button>

                <button
                  onClick={lapStopwatch}
                  disabled={!isRunning}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition disabled:opacity-40"
                >
                  <Flag className="w-4 h-4" /> Lap
                </button>
              </div>

              {laps.length > 0 && (
                <div className="w-full flex flex-col border border-slate-200 dark:border-white/10 rounded-xl p-2 max-h-56 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-white/5 mb-1">
                    <span>Lap</span>
                    <span>Split</span>
                    <span>Total</span>
                  </div>
                  {[...laps].reverse().map((lap) => (
                    <div key={lap.index} className="grid grid-cols-3 gap-2 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono tabulator-nums odd:bg-slate-50 dark:odd:bg-white/2 rounded">
                      <span>#{lap.index}</span>
                      <span>{formatTime(lap.split)}</span>
                      <span>{formatTime(lap.time)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 w-full max-w-md">
              {timerIsRunning || timerRemainingMs > 0 ? (
                <div className="text-6xl font-extrabold text-slate-800 dark:text-white font-mono tracking-tight leading-none tabular-nums">
                  {formatTimerDisplay(activeTimerMinutes, activeTimerSeconds)}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => adjustTimerMinutes(1)} className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-lg font-bold">+</button>
                    <span className="text-4xl font-extrabold text-slate-800 dark:text-white font-mono">{String(timerMinutes).padStart(2, '0')}</span>
                    <button onClick={() => adjustTimerMinutes(-1)} className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-lg font-bold">-</button>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">min</span>
                  </div>
                  <span className="text-4xl font-black text-slate-800 dark:text-white pb-6">:</span>
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => adjustTimerSeconds(1)} className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-lg font-bold">+</button>
                    <span className="text-4xl font-extrabold text-slate-800 dark:text-white font-mono">{String(timerSeconds).padStart(2, '0')}</span>
                    <button onClick={() => adjustTimerSeconds(-1)} className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-lg font-bold">-</button>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">sec</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetTimer}
                  disabled={!timerIsRunning && timerRemainingMs === 0}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition disabled:opacity-40"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>

                <button
                  onClick={toggleTimer}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-md transition"
                >
                  {timerIsRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {timerIsRunning ? 'Pause' : 'Start'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
