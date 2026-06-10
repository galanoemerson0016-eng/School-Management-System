import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';

interface WordSearchProps {
  onBack: () => void;
}

export function WordSearch({ onBack }: WordSearchProps) {
  const [wordList, setWordList] = useState<string[]>(['REACT', 'HTML', 'CSS', 'VITE', 'TAILWIND']);
  const [newWord, setNewWord] = useState('');
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ r: number; c: number }[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  const GRID_SIZE = 12;

  const addWord = () => {
    const word = newWord.trim().toUpperCase();
    if (!word) return;
    if (word.length > GRID_SIZE) {
      alert(`Word cannot be longer than ${GRID_SIZE} letters.`);
      return;
    }
    if (!wordList.includes(word)) {
      setWordList([...wordList, word]);
    }
    setNewWord('');
  };

  const removeWord = (idx: number) => {
    setWordList(wordList.filter((_, i) => i !== idx));
  };

  const generatePuzzle = () => {
    if (wordList.length === 0) return;

    // Create empty grid
    const tempGrid: string[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(''));

    const directions = [
      { r: 0, c: 1 },  // horizontal right
      { r: 1, c: 0 },  // vertical down
      { r: 1, c: 1 },  // diagonal down-right
      { r: -1, c: 1 }, // diagonal up-right
    ];

    const sortedWords = [...wordList].sort((a, b) => b.length - a.length);

    sortedWords.forEach((word) => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startR = Math.floor(Math.random() * GRID_SIZE);
        const startC = Math.floor(Math.random() * GRID_SIZE);

        // Check if word fits
        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const r = startR + dir.r * i;
          const c = startC + dir.c * i;

          if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
            fits = false;
            break;
          }

          if (tempGrid[r][c] !== '' && tempGrid[r][c] !== word[i]) {
            fits = false;
            break;
          }
        }

        if (fits) {
          for (let i = 0; i < word.length; i++) {
            const r = startR + dir.r * i;
            const c = startC + dir.c * i;
            tempGrid[r][c] = word[i];
          }
          placed = true;
        }
      }
    });

    // Fill remaining cells with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (tempGrid[r][c] === '') {
          tempGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    setGrid(tempGrid);
    setFoundWords([]);
    setSelectedCells([]);
    setGameStarted(true);
  };

  const handleCellClick = (r: number, c: number) => {
    // Toggle cell selection
    const index = selectedCells.findIndex((cell) => cell.r === r && cell.c === c);
    const nextSelected = [...selectedCells];
    if (index >= 0) {
      nextSelected.splice(index, 1);
    } else {
      nextSelected.push({ r, c });
    }
    setSelectedCells(nextSelected);

    // Check if the selected letters form any of the words (both forwards and backwards)
    const selectedString = nextSelected.map((cell) => grid[cell.r][cell.c]).join('');
    const reversedString = selectedString.split('').reverse().join('');

    const matchWord = wordList.find(
      (w) =>
        (w === selectedString || w === reversedString) &&
        !foundWords.includes(w)
    );

    if (matchWord) {
      setFoundWords([...foundWords, matchWord]);
      setSelectedCells([]);
    }
  };

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some((cell) => cell.r === r && cell.c === c);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGrid([]);
    setFoundWords([]);
    setSelectedCells([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Word Search Generator</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Generate a custom word search puzzle board.</p>
            </div>
          </div>
          {gameStarted && (
            <button
              onClick={resetGame}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold transition"
            >
              <RotateCcw className="w-4 h-4" /> Setup Board
            </button>
          )}
        </div>

        {!gameStarted ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Word List ({wordList.length} words)
              </span>
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto border border-slate-100 dark:border-white/5 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/50">
                {wordList.map((word, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white dark:bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-xs font-bold shadow-xs">
                    <span className="text-slate-700 dark:text-slate-300">{word}</span>
                    <button onClick={() => removeWord(idx)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {wordList.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-8">No words added yet.</div>
                )}
              </div>
              <button
                onClick={generatePuzzle}
                disabled={wordList.length === 0}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold rounded-xl text-sm transition shadow-md"
              >
                Generate Puzzle Board
              </button>
            </div>

            <div className="flex flex-col gap-4 border border-slate-200 dark:border-white/10 p-4 rounded-2xl bg-white dark:bg-[#1e293b]/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Add Word</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && addWord()}
                  placeholder="Enter a word..."
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-xs font-semibold"
                />
                <button onClick={addWord} className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:border-amber-500">
                  <Plus className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">Words will automatically be converted to uppercase. Diagonal, horizontal, and vertical placement is supported.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6">
            {/* Grid display */}
            <div className="flex justify-center items-center">
              <div className="grid grid-cols-12 gap-1 bg-slate-100 dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-white/5 rounded-2xl max-w-[400px] w-full">
                {grid.map((row, rIdx) =>
                  row.map((letter, cIdx) => (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      className={`aspect-square flex items-center justify-center font-bold text-xs rounded-lg cursor-pointer transition select-none ${
                        isCellSelected(rIdx, cIdx)
                          ? 'bg-amber-500 text-slate-900 font-extrabold shadow-sm scale-105'
                          : 'bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {letter}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Side Word Panel */}
            <div className="flex flex-col gap-4 border border-slate-200 dark:border-white/10 p-4 rounded-2xl bg-white dark:bg-[#1e293b]/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Words to Find
              </span>
              <div className="flex flex-col gap-1.5">
                {wordList.map((word, idx) => {
                  const isFound = foundWords.includes(word);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                        isFound
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 line-through decoration-2'
                          : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{word}</span>
                      {isFound && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
