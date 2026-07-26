import React, { useState, useRef, useMemo } from 'react';
import { ArrowLeft, Printer, HelpCircle, Volume2, VolumeX, Plus, Trash2, Sparkles, Edit3 } from 'lucide-react';

interface CrosswordGeneratorProps {
  onBack: () => void;
}

export interface InputWordPair {
  id: string;
  word: string;
  clue: string;
}

export interface PlacedWord {
  id: string;
  word: string;
  clue: string;
  direction: 'across' | 'down';
  row: number;
  col: number;
  number: number;
}

const PRESET_TOPICS: { name: string; words: InputWordPair[] }[] = [
  {
    name: 'Science & Technology',
    words: [
      { id: 's1', word: 'GRAVITY', clue: 'Force pulling objects down to Earth' },
      { id: 's2', word: 'ATOM', clue: 'Basic fundamental building block of matter' },
      { id: 's3', word: 'SOLAR', clue: 'Energy produced directly by the sun' },
      { id: 's4', word: 'CELL', clue: 'Basic structural unit of all living organisms' },
      { id: 's5', word: 'OXYGEN', clue: 'Gas essential for human respiration' },
      { id: 's6', word: 'ENERGY', clue: 'The quantitative property needed to perform work' },
    ],
  },
  {
    name: 'Araling Panlipunan (History)',
    words: [
      { id: 'h1', word: 'KATIPUNAN', clue: 'Secret revolutionary society founded by Andres Bonifacio' },
      { id: 'h2', word: 'BAYANIHAN', clue: 'Filipino spirit of communal unity and cooperation' },
      { id: 'h3', word: 'LUNETA', clue: 'Historic park in Manila where Jose Rizal was executed' },
      { id: 'h4', word: 'KALAYAAN', clue: 'Tagalog word for Freedom and Independence' },
      { id: 'h5', word: 'BANDILA', clue: 'Tagalog word for the National Flag' },
    ],
  },
  {
    name: 'Mathematics',
    words: [
      { id: 'm1', word: 'PERIMETER', clue: 'Total distance around the outside edge of a 2D shape' },
      { id: 'm2', word: 'ANGLE', clue: 'Figure formed by two rays sharing a common endpoint' },
      { id: 'm3', word: 'TRIANGLE', clue: 'Three-sided polygon with interior angles summing to 180 degrees' },
      { id: 'm4', word: 'FRACTION', clue: 'Numerical quantity that is not a whole number' },
      { id: 'm5', word: 'RADIUS', clue: 'Straight line from center to circumference of a circle' },
    ],
  },
];

// Automatic Crossword Grid Layout Algorithm
function generateCrosswordGrid(inputWords: InputWordPair[], gridSize: number = 10): PlacedWord[] {
  const sorted = [...inputWords]
    .map((item) => ({ ...item, word: item.word.trim().toUpperCase() }))
    .filter((item) => item.word.length >= 2 && item.word.length <= gridSize)
    .sort((a, b) => b.word.length - a.word.length);

  if (sorted.length === 0) return [];

  const grid: (string | null)[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  const placedWords: PlacedWord[] = [];
  let currentNum = 1;

  // Place first word centered across
  const first = sorted[0];
  const firstRow = Math.floor(gridSize / 2);
  const firstCol = Math.max(0, Math.floor((gridSize - first.word.length) / 2));

  for (let i = 0; i < first.word.length; i++) {
    grid[firstRow][firstCol + i] = first.word[i];
  }

  placedWords.push({
    id: first.id,
    word: first.word,
    clue: first.clue,
    direction: 'across',
    row: firstRow,
    col: firstCol,
    number: currentNum++,
  });

  // Try placing subsequent words by finding matching intersecting letters
  for (let w = 1; w < sorted.length; w++) {
    const item = sorted[w];
    let bestPlacement: { row: number; col: number; dir: 'across' | 'down' } | null = null;

    placementLoop: for (let p = 0; p < placedWords.length; p++) {
      const placed = placedWords[p];

      for (let i = 0; i < item.word.length; i++) {
        const char = item.word[i];

        for (let j = 0; j < placed.word.length; j++) {
          if (placed.word[j] === char) {
            const newDir = placed.direction === 'across' ? 'down' : 'across';

            let newRow: number;
            let newCol: number;

            if (newDir === 'down') {
              newRow = placed.row - i;
              newCol = placed.col + j;
            } else {
              newRow = placed.row + j;
              newCol = placed.col - i;
            }

            if (newRow < 0 || newCol < 0) continue;
            if (newDir === 'across' && newCol + item.word.length > gridSize) continue;
            if (newDir === 'down' && newRow + item.word.length > gridSize) continue;

            let isValid = true;
            for (let k = 0; k < item.word.length; k++) {
              const r = newDir === 'across' ? newRow : newRow + k;
              const c = newDir === 'across' ? newCol + k : newCol;

              const currentCell = grid[r][c];
              if (currentCell !== null && currentCell !== item.word[k]) {
                isValid = false;
                break;
              }
            }

            if (isValid) {
              bestPlacement = { row: newRow, col: newCol, dir: newDir };
              break placementLoop;
            }
          }
        }
      }
    }

    if (bestPlacement) {
      const { row, col, dir } = bestPlacement;
      const existingWordAtStart = placedWords.find((pw) => pw.row === row && pw.col === col);
      const wordNum = existingWordAtStart ? existingWordAtStart.number : currentNum++;

      for (let k = 0; k < item.word.length; k++) {
        const r = dir === 'across' ? row : row + k;
        const c = dir === 'across' ? col + k : col;
        grid[r][c] = item.word[k];
      }

      placedWords.push({
        id: item.id,
        word: item.word,
        clue: item.clue,
        direction: dir,
        row,
        col,
        number: wordNum,
      });
    }
  }

  return placedWords;
}

export function CrosswordGenerator({ onBack }: CrosswordGeneratorProps) {
  const [customWords, setCustomWords] = useState<InputWordPair[]>(PRESET_TOPICS[0].words);
  const [newWord, setNewWord] = useState('');
  const [newClue, setNewClue] = useState('');
  const [userGrid, setUserGrid] = useState<{ [key: string]: string }>({});
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const gridSize = 10;

  // Generate crossword layout dynamically whenever customWords changes
  const placedWords = useMemo(() => {
    return generateCrosswordGrid(customWords, gridSize);
  }, [customWords]);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio fallback
    }
  };

  const playRevealSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
    } catch {
      // Audio fallback
    }
  };

  // Build coordinate map of grid
  const cellMap = useMemo(() => {
    const map: { [key: string]: { char: string; num?: number } } = {};
    placedWords.forEach((w) => {
      for (let i = 0; i < w.word.length; i++) {
        const r = w.direction === 'across' ? w.row : w.row + i;
        const c = w.direction === 'across' ? w.col + i : w.col;
        const key = `${r}-${c}`;
        if (!map[key]) {
          map[key] = { char: w.word[i] };
        }
        if (i === 0) {
          map[key].num = w.number;
        }
      }
    });
    return map;
  }, [placedWords]);

  const handleCellChange = (r: number, c: number, val: string) => {
    const key = `${r}-${c}`;
    if (val) playClickSound();
    setUserGrid({
      ...userGrid,
      [key]: val.toUpperCase().slice(-1),
    });
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newClue.trim()) return;
    const wordObj: InputWordPair = {
      id: Date.now().toString(),
      word: newWord.trim().toUpperCase(),
      clue: newClue.trim(),
    };
    setCustomWords((prev) => [...prev, wordObj]);
    setNewWord('');
    setNewClue('');
    setUserGrid({});
  };

  const handleRemoveWord = (id: string) => {
    setCustomWords((prev) => prev.filter((w) => w.id !== id));
    setUserGrid({});
  };

  const handleLoadPreset = (presetIndex: number) => {
    setCustomWords(PRESET_TOPICS[presetIndex].words);
    setUserGrid({});
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-4 lg:p-6 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              🧩 Crossword Puzzle Generator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Create, solve, and print custom interactive crossword puzzle boards
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
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
          >
            <Edit3 className="w-4 h-4" />
            Customize Words ({customWords.length})
          </button>
          <button
            onClick={() => {
              if (!showAnswers) playRevealSound();
              setShowAnswers(!showAnswers);
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
              showAnswers ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200'
            }`}
          >
            {showAnswers ? 'Hide Answers' : 'Reveal Answers'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <Printer className="w-4 h-4" />
            Print Board
          </button>
        </div>
      </div>

      {/* Main Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Crossword Grid */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-xs flex flex-col items-center justify-center min-h-100">
          {placedWords.length === 0 ? (
            <div className="text-center space-y-3 p-6 text-slate-400">
              <p className="text-sm font-bold">No words placed. Click "Customize Words" to add vocabulary terms!</p>
              <button
                onClick={() => setShowCustomModal(true)}
                className="px-4 py-2 bg-amber-500 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Add Words & Clues
              </button>
            </div>
          ) : (
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
              {Array.from({ length: gridSize }).map((_, r) =>
                Array.from({ length: gridSize }).map((_, c) => {
                  const key = `${r}-${c}`;
                  const cellData = cellMap[key];
                  if (!cellData) {
                    return (
                      <div
                        key={key}
                        className="w-9 h-9 lg:w-11 lg:h-11 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5"
                      />
                    );
                  }

                  const userChar = userGrid[key] || '';
                  const isCorrect = userChar === cellData.char;

                  return (
                    <div
                      key={key}
                      className="w-9 h-9 lg:w-11 lg:h-11 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-800 dark:border-white/40 relative flex items-center justify-center font-black text-base lg:text-lg select-none"
                    >
                      {cellData.num && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-black text-amber-600 dark:text-amber-400">
                          {cellData.num}
                        </span>
                      )}

                      {showAnswers ? (
                        <span className="text-amber-500">{cellData.char}</span>
                      ) : (
                        <input
                          type="text"
                          maxLength={1}
                          value={userChar}
                          onChange={(e) => handleCellChange(r, c, e.target.value)}
                          className={`w-full h-full text-center outline-none uppercase font-black bg-transparent ${
                            userChar ? (isCorrect ? 'text-emerald-600' : 'text-slate-800 dark:text-white') : ''
                          }`}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right: Clues List */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-500" />
              Crossword Clues ({placedWords.length} Placed)
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-black uppercase text-amber-600 tracking-wider mb-2">ACROSS</h4>
              {placedWords.filter((w) => w.direction === 'across').length === 0 ? (
                <p className="text-xs text-slate-400 italic">No across clues.</p>
              ) : (
                <ul className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {placedWords
                    .filter((w) => w.direction === 'across')
                    .map((w) => (
                      <li key={w.id} className="flex items-start gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-black text-[10px]">
                          {w.number}
                        </span>
                        <span>{w.clue}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-xs font-black uppercase text-amber-600 tracking-wider mb-2">DOWN</h4>
              {placedWords.filter((w) => w.direction === 'down').length === 0 ? (
                <p className="text-xs text-slate-400 italic">No down clues.</p>
              ) : (
                <ul className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {placedWords
                    .filter((w) => w.direction === 'down')
                    .map((w) => (
                      <li key={w.id} className="flex items-start gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-black text-[10px]">
                          {w.number}
                        </span>
                        <span>{w.clue}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customize Words & Clues Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/10 p-6 lg:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Customize Crossword Words
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Add custom words and clues or load built-in subject presets.
                </p>
              </div>
            </div>

            {/* Presets Bar */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TOPICS.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLoadPreset(idx)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    {topic.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Word Form */}
            <form onSubmit={handleAddWord} className="space-y-3 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5">
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Add New Word & Clue</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Word (e.g. PHOTOSYNTHESIS)"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="p-2.5 bg-white dark:bg-slate-900 border rounded-xl font-bold uppercase text-xs outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Clue (e.g. Process plants use...)"
                  value={newClue}
                  onChange={(e) => setNewClue(e.target.value)}
                  className="p-2.5 bg-white dark:bg-slate-900 border rounded-xl font-medium text-xs outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> Add Word to Puzzle
              </button>
            </form>

            {/* Existing Words List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Current Word List ({customWords.length})</span>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {customWords.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs">
                    <div>
                      <span className="font-black text-amber-600 dark:text-amber-400 mr-2">{item.word}</span>
                      <span className="text-slate-600 dark:text-slate-400 font-medium">— {item.clue}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveWord(item.id)}
                      className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowCustomModal(false)}
              className="w-full py-3 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-black text-xs rounded-2xl cursor-pointer"
            >
              Done & Generate Grid
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
