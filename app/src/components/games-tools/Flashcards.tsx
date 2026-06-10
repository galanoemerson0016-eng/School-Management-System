import React, { useState } from 'react';
import { ArrowLeft, Trash2, BookOpen, Layers } from 'lucide-react';

interface FlashcardsProps {
  onBack: () => void;
}

interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

export function Flashcards({ onBack }: FlashcardsProps) {
  const [cards, setCards] = useState<Flashcard[]>([
    { id: '1', term: 'Photosynthesis', definition: 'The process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy.' },
    { id: '2', term: 'Mitochondria', definition: 'The powerhouse of the cell, responsible for generating energy.' },
    { id: '3', term: 'Osmosis', definition: 'The movement of water molecules from a solution with a high concentration of water molecules to one with a lower concentration.' },
  ]);

  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [mode, setMode] = useState<'manage' | 'review' | 'match'>('manage');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Match Game State
  const [matchCards, setMatchCards] = useState<{ id: string; text: string; type: 'term' | 'def'; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<number[]>([]);
  const [matchTimer, setMatchTimer] = useState(0);
  const [matchIntervalId, setMatchIntervalId] = useState<number | null>(null);
  const [matchComplete, setMatchComplete] = useState(false);

  const addCard = () => {
    if (!term.trim() || !definition.trim()) return;
    setCards([...cards, { id: Math.random().toString(36).substr(2, 9), term: term.trim(), definition: definition.trim() }]);
    setTerm('');
    setDefinition('');
  };

  const removeCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
  };

  const startReview = () => {
    if (cards.length === 0) return;
    setReviewIndex(0);
    setIsFlipped(false);
    setMode('review');
  };

  const startMatchGame = () => {
    if (cards.length < 3) return;
    const items: typeof matchCards = [];
    cards.forEach((c) => {
      items.push({ id: c.id, text: c.term, type: 'term', isFlipped: false, isMatched: false });
      items.push({ id: c.id, text: c.definition, type: 'def', isFlipped: false, isMatched: false });
    });

    // Shuffle
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setMatchCards(shuffled);
    setSelectedMatch([]);
    setMatchTimer(0);
    setMatchComplete(false);
    setMode('match');

    if (matchIntervalId) clearInterval(matchIntervalId);
    const interval = window.setInterval(() => {
      setMatchTimer((prev) => prev + 1);
    }, 1000);
    setMatchIntervalId(interval);
  };

  const handleMatchSelect = (index: number) => {
    if (selectedMatch.length >= 2 || matchCards[index].isMatched || matchCards[index].isFlipped) return;

    const newCards = [...matchCards];
    newCards[index].isFlipped = true;
    setMatchCards(newCards);

    const newSelected = [...selectedMatch, index];
    setSelectedMatch(newSelected);

    if (newSelected.length === 2) {
      const first = matchCards[newSelected[0]];
      const second = matchCards[newSelected[1]];

      if (first.id === second.id && first.type !== second.type) {
        // Match!
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[newSelected[0]].isMatched = true;
          matchedCards[newSelected[1]].isMatched = true;
          setMatchCards(matchedCards);
          setSelectedMatch([]);

          // Check if all matched
          if (matchedCards.every((c) => c.isMatched)) {
            if (matchIntervalId) clearInterval(matchIntervalId);
            setMatchComplete(true);
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[newSelected[0]].isFlipped = false;
          resetCards[newSelected[1]].isFlipped = false;
          setMatchCards(resetCards);
          setSelectedMatch([]);
        }, 1200);
      }
    }
  };

  const stopMatchTimer = () => {
    if (matchIntervalId) {
      clearInterval(matchIntervalId);
      setMatchIntervalId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => {
                if (mode !== 'manage') {
                  stopMatchTimer();
                  setMode('manage');
                } else {
                  onBack();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" /> {mode === 'manage' ? 'Back' : 'Manage Decks'}
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {mode === 'manage' ? 'Flashcards & Study Match' : mode === 'review' ? 'Flashcard Review' : 'Memory Match'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {mode === 'manage'
                  ? 'Create custom flashcard decks to study or play memory match games.'
                  : mode === 'review'
                  ? 'Flip cards to test your knowledge.'
                  : 'Match terms to their definitions as fast as you can!'}
              </p>
            </div>
          </div>
        </div>

        {mode === 'manage' && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Deck List ({cards.length} Cards)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={startReview}
                    disabled={cards.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold rounded-lg text-xs transition shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Review Deck
                  </button>
                  <button
                    onClick={startMatchGame}
                    disabled={cards.length < 3}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition shadow-sm"
                  >
                    <Layers className="w-3.5 h-3.5" /> Play Match
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto border border-slate-100 dark:border-white/5 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/50">
                {cards.map((c) => (
                  <div key={c.id} className="flex justify-between items-start bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-xs gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-xs text-amber-500">{c.term}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {c.definition}
                      </div>
                    </div>
                    <button onClick={() => removeCard(c.id)} className="text-slate-400 hover:text-red-500 self-center shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-8">
                    No flashcards created yet. Add your first card!
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 border border-slate-200 dark:border-white/10 p-4 rounded-2xl bg-white dark:bg-[#1e293b]/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Add New Card</span>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Term / Question</label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="e.g. Mitochondria"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-xs font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Definition / Answer</label>
                <textarea
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  rows={3}
                  placeholder="e.g. Powerhouse of the cell..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-xs font-semibold resize-none"
                />
              </div>
              <button
                onClick={addCard}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-xl text-xs transition"
              >
                Add Card
              </button>
            </div>
          </div>
        )}

        {mode === 'review' && cards.length > 0 && (
          <div className="flex flex-col items-center gap-6 max-w-lg mx-auto py-8">
            <div className="text-xs font-bold text-slate-400">
              Card {reviewIndex + 1} of {cards.length}
            </div>

            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full h-60 perspective-[1000px] cursor-pointer select-none"
            >
              <div
                className={`w-full h-full relative transform-3d transition-transform duration-500 ${
                  isFlipped ? 'transform-[rotateY(180deg)]' : 'transform-[rotateY(0deg)]'
                }`}
              >
                {/* Front (Term) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500 flex flex-col items-center justify-center p-6 text-center shadow-lg">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Question / Term</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white">{cards[reviewIndex].term}</span>
                  <span className="text-[10px] text-slate-400 mt-8">Click to flip</span>
                </div>

                {/* Back (Definition) */}
                <div className="absolute inset-0 w-full h-full backface-hidden transform-[rotateY(180deg)] rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-center p-6 text-center shadow-lg">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Answer / Definition</span>
                  <span className="text-base font-bold text-white leading-relaxed">{cards[reviewIndex].definition}</span>
                  <span className="text-[10px] text-slate-400 mt-8">Click to flip</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                disabled={reviewIndex === 0}
                onClick={() => {
                  setReviewIndex((prev) => prev - 1);
                  setIsFlipped(false);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl hover:border-amber-500 font-semibold text-xs transition disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={reviewIndex === cards.length - 1}
                onClick={() => {
                  setReviewIndex((prev) => prev + 1);
                  setIsFlipped(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-xl text-xs transition disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {mode === 'match' && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex justify-between items-center w-full max-w-2xl px-2">
              <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Timer: <span className="font-mono text-amber-500">{matchTimer}s</span>
              </div>
              {matchComplete && (
                <div className="text-emerald-500 font-extrabold text-sm animate-pulse">
                  Finished in {matchTimer} seconds!
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full max-w-2xl">
              {matchCards.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => handleMatchSelect(idx)}
                  className={`h-24 rounded-xl border-2 flex items-center justify-center p-3 text-center cursor-pointer transition select-none shadow-xs text-xs font-semibold ${
                    c.isMatched
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 scale-95 opacity-50 cursor-default'
                      : c.isFlipped
                      ? 'bg-amber-50 dark:bg-amber-950/25 border-amber-500 text-slate-800 dark:text-white font-extrabold'
                      : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10 text-transparent'
                  }`}
                >
                  <span className={c.isFlipped || c.isMatched ? 'line-clamp-4 leading-normal' : 'hidden'}>
                    {c.text}
                  </span>
                  {!c.isFlipped && !c.isMatched && (
                    <span className="text-slate-400 font-bold font-mono text-sm">?</span>
                  )}
                </div>
              ))}
            </div>

            {matchComplete && (
              <button
                onClick={startMatchGame}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-md transition"
              >
                Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
