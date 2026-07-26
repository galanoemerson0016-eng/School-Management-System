import React, { useState, useRef } from 'react';
import { ArrowLeft, RotateCcw, HelpCircle, PlusCircle, Volume2, VolumeX } from 'lucide-react';

interface BalloonWordGameProps {
  onBack: () => void;
}

interface WordPreset {
  word: string;
  hint: string;
  category: string;
}

const PRESET_WORDS: WordPreset[] = [
  { word: 'PHOTOSYNTHESIS', hint: 'Process plants use to convert sunlight into food', category: 'Science' },
  { word: 'KATIPUNAN', hint: 'Secret revolutionary society founded by Andres Bonifacio', category: 'Philippine History' },
  { word: 'HYPOTENUSE', hint: 'The longest side of a right-angled triangle', category: 'Mathematics' },
  { word: 'METAPHOR', hint: 'A figure of speech that directly compares two things', category: 'English' },
  { word: 'BAYANIHAN', hint: 'Filipino spirit of communal unity and cooperation', category: 'Values Education' },
  { word: 'ATMOSPHERE', hint: 'Layer of gases surrounding planet Earth', category: 'Science' },
  { word: 'PERIMETER', hint: 'The total distance around the outside of a shape', category: 'Mathematics' },
];

export function BalloonWordGame({ onBack }: BalloonWordGameProps) {
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [customWord, setCustomWord] = useState<string>('');
  const [customHint, setCustomHint] = useState<string>('');
  const [activeWordObj, setActiveWordObj] = useState<WordPreset>(PRESET_WORDS[0]);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

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

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio fallback
    }
  };

  const playCorrectSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      [523.25, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } catch {
      // Audio fallback
    }
  };

  const playVictorySound = () => {
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
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } catch {
      // Audio fallback
    }
  };

  const playGameOverSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio fallback
    }
  };

  const wordUpper = activeWordObj.word.toUpperCase();
  const maxBalloons = 6;

  const wrongGuesses = guessedLetters.filter(
    (char) => !wordUpper.includes(char)
  );

  const balloonsRemaining = Math.max(0, maxBalloons - wrongGuesses.length);
  const isWon = wordUpper.split('').every((char) => char === ' ' || guessedLetters.includes(char));
  const isLost = balloonsRemaining === 0;

  const handleGuess = (letter: string) => {
    if (guessedLetters.includes(letter) || isWon || isLost) return;
    const newGuessed = [...guessedLetters, letter];
    setGuessedLetters(newGuessed);

    const isCorrect = wordUpper.includes(letter);
    if (isCorrect) {
      const willWin = wordUpper.split('').every((char) => char === ' ' || newGuessed.includes(char));
      if (willWin) {
        playVictorySound();
      } else {
        playCorrectSound();
      }
    } else {
      const newWrongCount = newGuessed.filter((char) => !wordUpper.includes(char)).length;
      if (newWrongCount >= maxBalloons) {
        playGameOverSound();
      } else {
        playPopSound();
      }
    }
  };

  const handleNextWord = () => {
    const nextIdx = (currentWordIdx + 1) % PRESET_WORDS.length;
    setCurrentWordIdx(nextIdx);
    setActiveWordObj(PRESET_WORDS[nextIdx]);
    setGuessedLetters([]);
  };

  const handleStartCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWord.trim()) return;
    setActiveWordObj({
      word: customWord.trim().toUpperCase(),
      hint: customHint.trim() || 'Custom Teacher Word',
      category: 'Teacher Custom',
    });
    setGuessedLetters([]);
    setShowCustomModal(false);
    setCustomWord('');
    setCustomHint('');
  };

  const balloonColors = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500'];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-4 lg:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              🎈 Save the Balloon (Word Guessing)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Guess the letters before all 6 floating balloons pop!
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
            onClick={() => setShowCustomModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Custom Word
          </button>
          <button
            onClick={handleNextWord}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Next Word
          </button>
        </div>
      </div>

      {/* Main Arena */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 lg:p-10 shadow-sm space-y-8 text-center">
        {/* Category & Hint */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest border border-slate-200/50 dark:border-white/5">
            {activeWordObj.category}
          </span>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            Hint: {activeWordObj.hint}
          </p>
        </div>

        {/* Floating Balloons Display */}
        <div className="flex items-center justify-center gap-3 py-4">
          {Array.from({ length: maxBalloons }).map((_, idx) => {
            const isPopped = idx >= balloonsRemaining;
            return (
              <div
                key={idx}
                className={`w-10 h-14 rounded-full flex items-center justify-center transition-all ${
                  isPopped
                    ? 'opacity-20 scale-75 grayscale'
                    : `${balloonColors[idx % balloonColors.length]} animate-bounce shadow-md`
                }`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {isPopped ? '💥' : '🎈'}
              </div>
            );
          })}
        </div>

        {/* Word Display Tiles */}
        <div className="flex flex-wrap items-center justify-center gap-2 py-4">
          {wordUpper.split('').map((char, index) => {
            if (char === ' ') {
              return <div key={index} className="w-6" />;
            }
            const isRevealed = guessedLetters.includes(char) || isLost;
            return (
              <div
                key={index}
                className={`w-11 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                  isRevealed
                    ? isLost && !guessedLetters.includes(char)
                      ? 'bg-red-500/10 border-red-500 text-red-500'
                      : 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-transparent'
                }`}
              >
                {isRevealed ? char : ''}
              </div>
            );
          })}
        </div>

        {/* Game Result Banners */}
        {isWon && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-lg animate-bounce">
            🎉 GREAT JOB! YOU SAVED THE BALLOONS!
          </div>
        )}

        {isLost && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-black text-lg">
            💥 OH NO! ALL BALLOONS POPPED! THE WORD WAS: {wordUpper}
          </div>
        )}

        {/* Interactive Keyboard */}
        <div className="grid grid-cols-7 lg:grid-cols-9 gap-2 max-w-2xl mx-auto pt-4">
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
            const isGuessed = guessedLetters.includes(letter);
            const isCorrect = isGuessed && wordUpper.includes(letter);
            return (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={isGuessed || isWon || isLost}
                className={`h-11 rounded-xl font-black text-sm transition-all cursor-pointer select-none ${
                  isGuessed
                    ? isCorrect
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : 'bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 shadow-xs'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Word Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleStartCustom}
            className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/10 p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Add Custom Word</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Secret Word / Term</label>
                <input
                  type="text"
                  required
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value)}
                  placeholder="e.g. MITOCHONDRIA"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold uppercase text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Clue / Hint</label>
                <input
                  type="text"
                  value={customHint}
                  onChange={(e) => setCustomHint(e.target.value)}
                  placeholder="e.g. Powerhouse of the cell"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium text-sm outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl"
              >
                Start Custom Word
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
