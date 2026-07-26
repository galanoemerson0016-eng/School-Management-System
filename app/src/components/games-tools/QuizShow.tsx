import React, { useState, useRef } from 'react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface QuizShowProps {
  onBack: () => void;
}

interface QuestionTile {
  id: string;
  points: number;
  question: string;
  answer: string;
  isAnswered: boolean;
}

interface QuizCategory {
  id: string;
  name: string;
  questions: QuestionTile[];
}

interface TeamScore {
  id: string;
  name: string;
  score: number;
  color: string;
}

export function QuizShow({ onBack }: QuizShowProps) {
  const [teams, setTeams] = useState<TeamScore[]>([
    { id: 't1', name: 'Team Alpha', score: 0, color: 'bg-red-500 text-white' },
    { id: 't2', name: 'Team Bravo', score: 0, color: 'bg-blue-500 text-white' },
    { id: 't3', name: 'Team Charlie', score: 0, color: 'bg-amber-500 text-white' },
  ]);

  const [categories, setCategories] = useState<QuizCategory[]>([
    {
      id: 'c1',
      name: 'Science & Nature',
      questions: [
        { id: 'c1-100', points: 100, question: 'What is the chemical symbol for Water?', answer: 'H2O', isAnswered: false },
        { id: 'c1-200', points: 200, question: 'What planet is known as the Red Planet?', answer: 'Mars', isAnswered: false },
        { id: 'c1-300', points: 300, question: 'What is the hardest natural substance on Earth?', answer: 'Diamond', isAnswered: false },
        { id: 'c1-400', points: 400, question: 'What process do plants use to make food using sunlight?', answer: 'Photosynthesis', isAnswered: false },
        { id: 'c1-500', points: 500, question: 'What organ pumps blood throughout the human body?', answer: 'Heart', isAnswered: false },
      ],
    },
    {
      id: 'c2',
      name: 'Mathematics',
      questions: [
        { id: 'c2-100', points: 100, question: 'What is 12 × 12?', answer: '144', isAnswered: false },
        { id: 'c2-200', points: 200, question: 'What is the square root of 81?', answer: '9', isAnswered: false },
        { id: 'c2-300', points: 300, question: 'How many sides does a hexagon have?', answer: '6', isAnswered: false },
        { id: 'c2-400', points: 400, question: 'What is 15% of 200?', answer: '30', isAnswered: false },
        { id: 'c2-500', points: 500, question: 'What is the value of Pi rounded to 2 decimal places?', answer: '3.14', isAnswered: false },
      ],
    },
    {
      id: 'c3',
      name: 'Araling Panlipunan',
      questions: [
        { id: 'c3-100', points: 100, question: 'Sino ang pambansang bayani ng Pilipinas?', answer: 'Dr. Jose Rizal', isAnswered: false },
        { id: 'c3-200', points: 200, question: 'Ano ang pinakamataas na bundok sa Pilipinas?', answer: 'Mount Apo', isAnswered: false },
        { id: 'c3-300', points: 300, question: 'Kailan ipinahayag ang Kalayaan ng Pilipinas?', answer: 'Hunyo 12, 1898', isAnswered: false },
        { id: 'c3-400', points: 400, question: 'Sino ang unang Pangulo ng Republika ng Pilipinas?', answer: 'Emilio Aguinaldo', isAnswered: false },
        { id: 'c3-500', points: 500, question: 'Ano ang pinakamatandang lungsod sa Pilipinas?', answer: 'Cebu City', isAnswered: false },
      ],
    },
    {
      id: 'c4',
      name: 'English & Literature',
      questions: [
        { id: 'c4-100', points: 100, question: 'What type of word describes a noun?', answer: 'Adjective', isAnswered: false },
        { id: 'c4-200', points: 200, question: 'What is the opposite of the word "Ancient"?', answer: 'Modern / New', isAnswered: false },
        { id: 'c4-300', points: 300, question: 'Who wrote the play "Romeo and Juliet"?', answer: 'William Shakespeare', isAnswered: false },
        { id: 'c4-400', points: 400, question: 'What figure of speech compares two things using "like" or "as"?', answer: 'Simile', isAnswered: false },
        { id: 'c4-500', points: 500, question: 'What is a word that is spelled the same backward and forward?', answer: 'Palindrome', isAnswered: false },
      ],
    },
  ]);

  const [activeTile, setActiveTile] = useState<{ categoryId: string; question: QuestionTile } | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
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

  const playTileSelectSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
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

  const playRevealSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  };

  const playAwardSound = (isPositive: boolean) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isPositive ? 'sine' : 'sawtooth';
      const startFreq = isPositive ? 440 : 250;
      const endFreq = isPositive ? 880 : 120;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio fallback
    }
  };

  const handleTileClick = (categoryId: string, q: QuestionTile) => {
    if (q.isAnswered) return;
    playTileSelectSound();
    setActiveTile({ categoryId, question: q });
    setShowAnswer(false);
  };

  const handleAwardPoints = (teamId: string, pts: number) => {
    playAwardSound(pts > 0);
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, score: t.score + pts } : t))
    );
  };

  const handleCloseQuestion = () => {
    if (activeTile) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === activeTile.categoryId
            ? {
                ...cat,
                questions: cat.questions.map((q) =>
                  q.id === activeTile.question.id ? { ...q, isAnswered: true } : q
                ),
              }
            : cat
        )
      );
    }
    setActiveTile(null);
    setShowAnswer(false);
  };

  const handleResetBoard = () => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        questions: cat.questions.map((q) => ({ ...q, isAnswered: false })),
      }))
    );
    setTeams((prev) => prev.map((t) => ({ ...t, score: 0 })));
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
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
              🏆 Quiz Show / Jeopardy Board
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Interactive category quiz board for class competitions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
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
            onClick={handleResetBoard}
            className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Board
          </button>
        </div>
      </div>

      {/* Team Scores Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-4 shadow-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${team.color}`}>
                {team.name}
              </span>
              <span className="text-2xl font-black text-slate-800 dark:text-white tabular-nums">
                {team.score} <span className="text-xs font-bold text-slate-400">pts</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAwardPoints(team.id, -100)}
                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 font-black flex items-center justify-center cursor-pointer"
                title="Deduct 100 points"
              >
                -
              </button>
              <button
                onClick={() => handleAwardPoints(team.id, 100)}
                className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-black flex items-center justify-center cursor-pointer"
                title="Add 100 points"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Grid Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-3">
            {/* Category Title Header */}
            <div className="bg-amber-500 text-white rounded-2xl p-3.5 text-center shadow-xs">
              <h3 className="font-black text-sm uppercase tracking-wider line-clamp-1">{cat.name}</h3>
            </div>

            {/* Questions Tiles */}
            {cat.questions.map((q) => (
              <div
                key={q.id}
                onClick={() => handleTileClick(cat.id, q)}
                className={`h-20 rounded-2xl border flex items-center justify-center font-black text-xl transition-all select-none ${
                  q.isAnswered
                    ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-700 border-slate-200 dark:border-white/5 cursor-not-allowed line-through'
                    : 'bg-white dark:bg-[#0f172a] text-amber-500 border-slate-200 dark:border-white/5 hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                }`}
              >
                {q.isAnswered ? '✓' : `$${q.points}`}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Question Modal Popup */}
      {activeTile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/10 p-6 lg:p-8 max-w-2xl w-full shadow-2xl space-y-6 text-center animate-fade-in relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 font-black text-xs uppercase tracking-widest">
              Point Value: ${activeTile.question.points}
            </div>

            <div className="space-y-4 py-4">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-relaxed">
                {activeTile.question.question}
              </h3>

              {showAnswer && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-lg animate-fade-in">
                  Answer: {activeTile.question.answer}
                </div>
              )}
            </div>

            {/* Modal Actions & Awarding */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5">
              {!showAnswer ? (
                <button
                  onClick={() => {
                    playRevealSound();
                    setShowAnswer(true);
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                  REVEAL ANSWER
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Award Points To:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          handleAwardPoints(t.id, activeTile.question.points);
                          handleCloseQuestion();
                        }}
                        className={`py-2.5 rounded-xl font-black text-xs uppercase cursor-pointer ${t.color}`}
                      >
                        {t.name} (+{activeTile.question.points})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleCloseQuestion}
                className="w-full py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs cursor-pointer"
              >
                Close Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
