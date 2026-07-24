import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

interface BouncingWordsProps {
  onBack: () => void;
}

const PHASE = {
  SETUP: 'setup',
  GAME: 'game',
  REVEAL: 'reveal',
} as const;

type Phase = typeof PHASE[keyof typeof PHASE];

interface BouncingWord {
  text: string;
  originalIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
}

export function BouncingWords({ onBack }: BouncingWordsProps) {
  const [phase, setPhase] = useState<Phase>(PHASE.SETUP);
  const [inputSentence, setInputSentence] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [shuffledWords, setShuffledWords] = useState<{ text: string; originalIndex: number }[]>([]);
  const [builtSentence, setBuiltSentence] = useState<{ text: string; originalIndex: number }[]>([]);
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState<'' | 'success' | 'error'>('');

  const [bouncingWords, setBouncingWords] = useState<BouncingWord[]>([]);
  const bounceContainerRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [hintTargetIndex, setHintTargetIndex] = useState<number | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showSentenceFlash, setShowSentenceFlash] = useState(false);
  const hintTimeoutRef = useRef<number | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameCardRef = useRef<HTMLDivElement>(null);

  const parseSentence = (sentence: string): string[] => {
    return sentence
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
  };

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const startGame = () => {
    const parsed = parseSentence(inputSentence);
    if (parsed.length === 0) return;
    setWords(parsed);
    const shuffled = shuffleArray(parsed.map((text, i) => ({ text, originalIndex: i })));
    setShuffledWords(shuffled);
    setBuiltSentence([]);
    setResultMessage('');
    setResultType('');
    setPhase(PHASE.GAME);
  };

  useEffect(() => {
    if (phase !== PHASE.GAME) return;

    const container = bounceContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const padding = 16;

    const initialBouncing = shuffledWords.map((sw) => {
      const el = document.getElementById(`word-chip-${sw.originalIndex}`);
      const w = el?.offsetWidth ?? 80;
      const h = el?.offsetHeight ?? 36;
      const maxX = Math.max(padding, rect.width - w - padding);
      const maxY = Math.max(padding, rect.height - h - padding);
      return {
        text: sw.text,
        originalIndex: sw.originalIndex,
        x: padding + Math.random() * (maxX - padding),
        y: padding + Math.random() * (maxY - padding),
        vx: (Math.random() - 0.5) * 2.5 + (Math.random() > 0.5 ? 0.8 : -0.8),
        vy: (Math.random() - 0.5) * 2.5 + (Math.random() > 0.5 ? 0.8 : -0.8),
        width: w,
        height: h,
      };
    });

    setBouncingWords(initialBouncing);

    let currentBouncing = [...initialBouncing];

    const tickBounce = () => {
      const containerInner = bounceContainerRef.current;
      if (!containerInner) return;
      const rectInner = containerInner.getBoundingClientRect();
      const pad = 16;

      currentBouncing = currentBouncing.map((bw) => {
        let nx = bw.x + bw.vx;
        let ny = bw.y + bw.vy;
        let nvx = bw.vx;
        let nvy = bw.vy;

        const maxX = Math.max(pad, rectInner.width - bw.width - pad);
        const maxY = Math.max(pad, rectInner.height - bw.height - pad);

        if (nx <= pad) {
          nx = pad;
          nvx = Math.abs(nvx);
        } else if (nx >= maxX) {
          nx = maxX;
          nvx = -Math.abs(nvx);
        }

        if (ny <= pad) {
          ny = pad;
          nvy = Math.abs(nvy);
        } else if (ny >= maxY) {
          ny = maxY;
          nvy = -Math.abs(nvy);
        }

        return { ...bw, x: nx, y: ny, vx: nvx, vy: nvy };
      });

      setBouncingWords(currentBouncing);
      animFrameIdRef.current = requestAnimationFrame(tickBounce);
    };

    animFrameIdRef.current = requestAnimationFrame(tickBounce);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [phase, shuffledWords]);

  const selectWord = (originalIndex: number) => {
    if (phase !== PHASE.GAME) return;
    const wordObj = shuffledWords.find((sw) => sw.originalIndex === originalIndex);
    if (!wordObj) return;

    setBuiltSentence((prev) => [...prev, wordObj]);
    setBouncingWords((prev) => prev.filter((bw) => bw.originalIndex !== originalIndex));
    setResultMessage('');
    setResultType('');
  };

  const removeBuiltWord = (index: number) => {
    const removed = builtSentence[index];
    if (!removed) return;
    const newBuilt = [...builtSentence];
    newBuilt.splice(index, 1);
    setBuiltSentence(newBuilt);

    const container = bounceContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const padding = 16;
    const el = document.getElementById(`word-chip-${removed.originalIndex}`);
    const w = el?.offsetWidth ?? 80;
    const h = el?.offsetHeight ?? 36;
    const maxX = Math.max(padding, rect.width - w - padding);
    const maxY = Math.max(padding, rect.height - h - padding);

    setBouncingWords((prev) => [
      ...prev,
      {
        text: removed.text,
        originalIndex: removed.originalIndex,
        x: padding + Math.random() * (maxX - padding),
        y: padding + Math.random() * (maxY - padding),
        vx: (Math.random() - 0.5) * 2.5 + (Math.random() > 0.5 ? 0.8 : -0.8),
        vy: (Math.random() - 0.5) * 2.5 + (Math.random() > 0.5 ? 0.8 : -0.8),
        width: w,
        height: h,
      },
    ]);
  };

  const checkSentence = () => {
    if (builtSentence.length !== words.length) {
      setResultMessage('Sentence is incomplete.');
      setResultType('error');
      return;
    }
    const isCorrect = builtSentence.every((w, i) => w.originalIndex === i);
    if (isCorrect) {
      setResultMessage('Correct! Great job!');
      setResultType('success');
    } else {
      setResultMessage('Not quite right. Try again!');
      setResultType('error');
    }
  };

  const revealAnswer = () => {
    setPhase(PHASE.REVEAL);
  };

  const resetGame = () => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    setPhase(PHASE.SETUP);
    setInputSentence('');
    setWords([]);
    setShuffledWords([]);
    setBuiltSentence([]);
    setBouncingWords([]);
    setResultMessage('');
    setResultType('');
    setHintsRemaining(3);
    setHintTargetIndex(null);
    setShowSkeleton(false);
    setShowSentenceFlash(false);
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
  };

  const backToSetup = () => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    setPhase(PHASE.SETUP);
    setBuiltSentence([]);
    setBouncingWords([]);
    setResultMessage('');
    setResultType('');
    setHintsRemaining(3);
    setHintTargetIndex(null);
    setShowSkeleton(false);
    setShowSentenceFlash(false);
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
  };

  const useHint = () => {
    if (hintsRemaining <= 0) return;
    setHintsRemaining((prev) => prev - 1);
    setResultMessage('');
    setResultType('');

    const currentLevel = 3 - (hintsRemaining - 1);

    if (currentLevel === 1) {
      const nextIndex = builtSentence.length;
      setHintTargetIndex(nextIndex);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = window.setTimeout(() => {
        setHintTargetIndex(null);
      }, 3000);
    } else if (currentLevel === 2) {
      setShowSkeleton(true);
      setHintTargetIndex(null);
    } else {
      setShowSentenceFlash(true);
      setShowSkeleton(false);
      setHintTargetIndex(null);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = window.setTimeout(() => {
        setShowSentenceFlash(false);
      }, 3000);
    }
  };

  const toggleFullscreen = () => {
    const el = gameCardRef.current;
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
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div
        ref={gameCardRef}
        className={`bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm ${
          isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen flex flex-col p-8' : ''
        }`}
      >
        <div className="flex items-center gap-4 mb-6 flex-wrap justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Bouncing Words</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Students rebuild the correct sentence from jumbled bouncing words.</p>
            </div>
          </div>
        </div>

        {phase === PHASE.SETUP ? (
          <div className="flex flex-col gap-4 max-w-lg mx-auto w-full py-8">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Enter a sentence</label>
            <textarea
              value={inputSentence}
              onChange={(e) => setInputSentence(e.target.value)}
              rows={3}
              placeholder="e.g. The quick brown fox jumps over the lazy dog"
              className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-sm font-semibold resize-none"
            />
            <button
              onClick={startGame}
              disabled={parseSentence(inputSentence).length === 0}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold rounded-xl shadow-md transition w-full"
            >
              Start Game
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Bouncing Area */}
            <div ref={bounceContainerRef} className="relative w-full h-80 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex-1 min-h-0">
              {bouncingWords.map((bw) => (
                <div
                  key={bw.originalIndex}
                  id={`word-chip-${bw.originalIndex}`}
                  onClick={() => selectWord(bw.originalIndex)}
                  className={`absolute left-0 top-0 px-4 py-1.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/5 rounded-full font-bold text-slate-800 dark:text-white cursor-pointer select-none shadow-sm hover:border-amber-500 transition-colors ${
                    hintTargetIndex !== null && bw.originalIndex === hintTargetIndex ? 'border-amber-500 shadow-md animate-pulse bg-amber-50 dark:bg-amber-950/20' : ''
                  }`}
                  style={{ transform: `translate3d(${bw.x}px, ${bw.y}px, 0)` }}
                >
                  {bw.text}
                </div>
              ))}
              {bouncingWords.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold">
                  All words selected!
                </div>
              )}
              {showSentenceFlash && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-4">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Correct Sentence</span>
                  <span className="text-2xl font-black text-white text-center">{words.join(' ')}</span>
                </div>
              )}
            </div>

            {/* Built Sentence Panel */}
            <div className="w-full">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Built Sentence</span>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl min-h-14 items-center">
                {builtSentence.map((w, i) => (
                  <div
                    key={`built-${w.originalIndex}-${i}`}
                    onClick={() => removeBuiltWord(i)}
                    className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-500 rounded-full font-bold text-slate-800 dark:text-amber-300 cursor-pointer shadow-sm hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition"
                  >
                    {w.text}
                  </div>
                ))}
                {showSkeleton &&
                  words.slice(builtSentence.length).map((word, idx) => (
                    <div key={`skeleton-${idx}`} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full font-bold text-slate-400 cursor-default">
                      {word.charAt(0).toUpperCase()}___
                    </div>
                  ))}
                {builtSentence.length === 0 && !showSkeleton && (
                  <span className="text-slate-400 text-sm font-medium">Click bouncing words in the correct order</span>
                )}
              </div>
            </div>

            {resultMessage && (
              <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold w-fit mx-auto ${
                resultType === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-red-50 dark:bg-red-950/20 text-red-600'
              }`}>
                {resultType === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {resultMessage}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2 justify-center flex-wrap mt-2">
              <button onClick={backToSetup} className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition text-sm">
                Back to Setup
              </button>
              <button onClick={checkSentence} disabled={builtSentence.length === 0} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-md transition disabled:opacity-40 text-sm">
                Check
              </button>
              {phase !== PHASE.REVEAL && (
                <button onClick={revealAnswer} className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition text-sm">
                  Reveal
                </button>
              )}
              <button onClick={resetGame} className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition text-sm">
                Reset
              </button>
              <button onClick={useHint} disabled={hintsRemaining <= 0 || showSentenceFlash} className="flex items-center gap-1 px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition disabled:opacity-40 text-sm">
                <Lightbulb className="w-4 h-4" /> Hint ({hintsRemaining})
              </button>
              <button onClick={toggleFullscreen} className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition text-sm">
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </div>

            {phase === PHASE.REVEAL && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-center">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block mb-1">Correct Sentence</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-white">{words.join(' ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
