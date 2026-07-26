import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, RotateCcw, Volume2, VolumeX, Sparkles, Maximize2, Minimize2, Play } from 'lucide-react';

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
  colorBg: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
}

const PRESET_SENTENCES = [
  { topic: 'English', text: 'The quick brown fox jumps over the lazy dog' },
  { topic: 'Science', text: 'Plants convert sunlight into energy through photosynthesis' },
  { topic: 'History', text: 'Jose Rizal wrote Noli Me Tangere to awaken the nation' },
  { topic: 'Values', text: 'Communal unity and cooperation are essential for bayanihan' },
];

const BUBBLE_PALETTES = [
  'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30',
  'bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/30',
  'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30',
  'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/30',
  'bg-linear-to-r from-rose-500 to-red-600 text-white shadow-red-500/30',
  'bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/30',
];

export function BouncingWords({ onBack }: BouncingWordsProps) {
  const [phase, setPhase] = useState<Phase>(PHASE.SETUP);
  const [inputSentence, setInputSentence] = useState('The quick brown fox jumps over the lazy dog');
  const [words, setWords] = useState<string[]>([]);
  const [shuffledWords, setShuffledWords] = useState<{ text: string; originalIndex: number }[]>([]);
  const [builtSentence, setBuiltSentence] = useState<{ text: string; originalIndex: number }[]>([]);
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState<'' | 'success' | 'error'>('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [bouncingWords, setBouncingWords] = useState<BouncingWord[]>([]);
  const bounceContainerRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const confettiFrameRef = useRef<number | null>(null);

  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [hintTargetIndex, setHintTargetIndex] = useState<number | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showSentenceFlash, setShowSentenceFlash] = useState(false);
  const hintTimeoutRef = useRef<number | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameCardRef = useRef<HTMLDivElement>(null);

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

  const playPopSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio fallback
    }
  };

  const playReturnSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
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

  const playWrongBuzzer = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
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

  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = canvas.parentElement?.clientHeight || 400;

    const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899'];
    const particles: ConfettiParticle[] = Array.from({ length: 70 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    }));

    const renderConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      particles.forEach((p) => {
        if (p.opacity <= 0) return;
        aliveCount++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.018;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (aliveCount > 0) {
        confettiFrameRef.current = requestAnimationFrame(renderConfetti);
      }
    };

    renderConfetti();
  };

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
    const padding = 20;

    const initialBouncing = shuffledWords.map((sw, idx) => {
      const el = document.getElementById(`word-chip-${sw.originalIndex}`);
      const w = el?.offsetWidth ?? 90;
      const h = el?.offsetHeight ?? 40;
      const maxX = Math.max(padding, rect.width - w - padding);
      const maxY = Math.max(padding, rect.height - h - padding);
      return {
        text: sw.text,
        originalIndex: sw.originalIndex,
        x: padding + Math.random() * (maxX - padding),
        y: padding + Math.random() * (maxY - padding),
        vx: (Math.random() - 0.5) * 3 + (Math.random() > 0.5 ? 1 : -1),
        vy: (Math.random() - 0.5) * 3 + (Math.random() > 0.5 ? 1 : -1),
        width: w,
        height: h,
        colorBg: BUBBLE_PALETTES[idx % BUBBLE_PALETTES.length],
      };
    });

    setBouncingWords(initialBouncing);

    let currentBouncing = [...initialBouncing];

    const tickBounce = () => {
      const containerInner = bounceContainerRef.current;
      if (!containerInner) return;
      const rectInner = containerInner.getBoundingClientRect();
      const pad = 20;

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

    playPopSound();
    setBuiltSentence((prev) => [...prev, wordObj]);
    setBouncingWords((prev) => prev.filter((bw) => bw.originalIndex !== originalIndex));
    setResultMessage('');
    setResultType('');
  };

  const removeBuiltWord = (index: number) => {
    const removed = builtSentence[index];
    if (!removed) return;
    playReturnSound();

    const newBuilt = [...builtSentence];
    newBuilt.splice(index, 1);
    setBuiltSentence(newBuilt);

    const container = bounceContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const padding = 20;
    const el = document.getElementById(`word-chip-${removed.originalIndex}`);
    const w = el?.offsetWidth ?? 90;
    const h = el?.offsetHeight ?? 40;
    const maxX = Math.max(padding, rect.width - w - padding);
    const maxY = Math.max(padding, rect.height - h - padding);

    setBouncingWords((prev) => [
      ...prev,
      {
        text: removed.text,
        originalIndex: removed.originalIndex,
        x: padding + Math.random() * (maxX - padding),
        y: padding + Math.random() * (maxY - padding),
        vx: (Math.random() - 0.5) * 3 + (Math.random() > 0.5 ? 1 : -1),
        vy: (Math.random() - 0.5) * 3 + (Math.random() > 0.5 ? 1 : -1),
        width: w,
        height: h,
        colorBg: BUBBLE_PALETTES[removed.originalIndex % BUBBLE_PALETTES.length],
      },
    ]);
  };

  const checkSentence = () => {
    if (builtSentence.length !== words.length) {
      playWrongBuzzer();
      setResultMessage('Sentence is incomplete.');
      setResultType('error');
      return;
    }
    const isCorrect = builtSentence.every((w, i) => w.originalIndex === i);
    if (isCorrect) {
      playVictoryFanfare();
      triggerConfetti();
      setResultMessage('🎉 CORRECT! EXCELLENT JOB!');
      setResultType('success');
    } else {
      playWrongBuzzer();
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
      if (confettiFrameRef.current) cancelAnimationFrame(confettiFrameRef.current);
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
              ✨ Bouncing Words Sentence Rebuilder
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Click floating physics word bubbles in the correct order to rebuild the sentence!
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

      {/* Main Container */}
      <div
        ref={gameCardRef}
        className={`bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 lg:p-8 shadow-sm ${
          isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen flex flex-col p-8 bg-white dark:bg-slate-900' : ''
        }`}
      >
        {phase === PHASE.SETUP ? (
          /* Setup Configuration Phase */
          <div className="flex flex-col gap-6 max-w-xl mx-auto w-full py-8 text-center">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" /> Enter a Sentence to Jumble
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Type a sentence or select a quick subject preset below.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Quick Subject Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SENTENCES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputSentence(preset.text)}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <span className="text-amber-500 dark:text-amber-400 mr-1.5 font-black">[{preset.topic}]</span>
                    {preset.text.slice(0, 24)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Sentence Input Box */}
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Target Sentence</label>
              <textarea
                value={inputSentence}
                onChange={(e) => setInputSentence(e.target.value)}
                rows={3}
                placeholder="e.g. The quick brown fox jumps over the lazy dog"
                className="w-full p-4 border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-amber-500 font-bold text-sm leading-relaxed resize-none"
              />
            </div>

            <button
              onClick={startGame}
              disabled={parseSentence(inputSentence).length === 0}
              className="w-full py-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              START BOUNCING WORDS GAME
            </button>
          </div>
        ) : (
          /* Active Bouncing Words Game Arena */
          <div className="flex flex-col gap-6 flex-1 min-h-0">
            {/* Bouncing Physics Glass Stage */}
            <div
              ref={bounceContainerRef}
              className="relative w-full h-96 bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex-1 min-h-0 shadow-2xl select-none"
            >
              <canvas ref={confettiCanvasRef} className="absolute inset-0 pointer-events-none w-full h-full z-20" />

              {/* Bouncing Neon Capsules */}
              {bouncingWords.map((bw) => (
                <div
                  key={bw.originalIndex}
                  id={`word-chip-${bw.originalIndex}`}
                  onClick={() => selectWord(bw.originalIndex)}
                  className={`absolute left-0 top-0 px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-wide cursor-pointer select-none shadow-lg transition-transform active:scale-95 border border-white/20 ${bw.colorBg} ${
                    hintTargetIndex !== null && bw.originalIndex === hintTargetIndex ? 'ring-4 ring-amber-400 animate-ping' : ''
                  }`}
                  style={{ transform: `translate3d(${bw.x}px, ${bw.y}px, 0)` }}
                >
                  {bw.text}
                </div>
              ))}

              {bouncingWords.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 font-black text-base gap-2 z-10">
                  <Sparkles className="w-8 h-8 text-amber-500 animate-bounce" />
                  All words selected! Click "Check Sentence" below to verify!
                </div>
              )}

              {showSentenceFlash && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center animate-fade-in">
                  <span className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> REVEALED SENTENCE
                  </span>
                  <span className="text-2xl lg:text-3xl font-black text-white leading-relaxed">{words.join(' ')}</span>
                </div>
              )}
            </div>

            {/* Built Sentence Panel */}
            <div className="w-full space-y-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Your Built Sentence</span>
              <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl min-h-16 items-center">
                {builtSentence.map((w, i) => (
                  <div
                    key={`built-${w.originalIndex}-${i}`}
                    onClick={() => removeBuiltWord(i)}
                    className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-full font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 transition active:scale-95"
                  >
                    {w.text}
                  </div>
                ))}
                {showSkeleton &&
                  words.slice(builtSentence.length).map((word, idx) => (
                    <div key={`skeleton-${idx}`} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full font-black text-xs text-slate-400 cursor-default">
                      {word.charAt(0).toUpperCase()}___
                    </div>
                  ))}
                {builtSentence.length === 0 && !showSkeleton && (
                  <span className="text-slate-400 text-xs font-bold">Click bouncing word bubbles in the correct order...</span>
                )}
              </div>
            </div>

            {resultMessage && (
              <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black w-fit mx-auto shadow-sm ${
                resultType === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
              }`}>
                {resultType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {resultMessage}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex gap-2 justify-center flex-wrap pt-2">
              <button onClick={backToSetup} className="px-4 py-2.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl text-slate-700 dark:text-slate-300 font-extrabold text-xs transition cursor-pointer">
                Back to Setup
              </button>
              <button onClick={checkSentence} disabled={builtSentence.length === 0} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition disabled:opacity-40 cursor-pointer">
                Check Sentence
              </button>
              {phase !== PHASE.REVEAL && (
                <button onClick={revealAnswer} className="px-4 py-2.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl text-slate-700 dark:text-slate-300 font-extrabold text-xs transition cursor-pointer">
                  Reveal Answer
                </button>
              )}
              <button onClick={resetGame} className="px-4 py-2.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl text-slate-700 dark:text-slate-300 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button onClick={useHint} disabled={hintsRemaining <= 0 || showSentenceFlash} className="px-4 py-2.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-2xl text-slate-700 dark:text-slate-300 font-extrabold text-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Hint ({hintsRemaining})
              </button>
            </div>

            {phase === PHASE.REVEAL && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest block mb-1">Correct Sentence</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{words.join(' ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
