import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, RotateCcw } from 'lucide-react';

interface ScoreboardProps {
  onBack: () => void;
}

interface Team {
  id: string;
  name: string;
  score: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

const COLOR_PALETTES = [
  { color: '#DC2626', bgColor: 'bg-red-50 dark:bg-red-950/20', borderColor: 'border-red-500', text: 'text-red-600 dark:text-red-400' },
  { color: '#2563EB', bgColor: 'bg-blue-50 dark:bg-blue-950/20', borderColor: 'border-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  { color: '#059669', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20', borderColor: 'border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  { color: '#D97706', bgColor: 'bg-amber-50 dark:bg-amber-950/20', borderColor: 'border-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  { color: '#7C3AED', bgColor: 'bg-purple-50 dark:bg-purple-950/20', borderColor: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400' },
  { color: '#DB2777', bgColor: 'bg-pink-50 dark:bg-pink-950/20', borderColor: 'border-pink-500', text: 'text-pink-600 dark:text-pink-400' },
];

export function Scoreboard({ onBack }: ScoreboardProps) {
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Team A', score: 0, color: '#DC2626', bgColor: 'bg-red-50 dark:bg-red-950/20', borderColor: 'border-red-500' },
    { id: '2', name: 'Team B', score: 0, color: '#2563EB', bgColor: 'bg-blue-50 dark:bg-blue-950/20', borderColor: 'border-blue-500' },
  ]);

  const addTeam = () => {
    if (teams.length >= 6) return;
    const nextIndex = teams.length;
    const palette = COLOR_PALETTES[nextIndex % COLOR_PALETTES.length];
    const newTeam: Team = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Team ${String.fromCharCode(65 + nextIndex)}`,
      score: 0,
      color: palette.color,
      bgColor: palette.bgColor,
      borderColor: palette.borderColor,
    };
    setTeams([...teams, newTeam]);
  };

  const removeTeam = (id: string) => {
    if (teams.length <= 1) return;
    setTeams(teams.filter((t) => t.id !== id));
  };

  const updateScore = (id: string, amount: number) => {
    setTeams(
      teams.map((t) => {
        if (t.id === id) {
          return { ...t, score: Math.max(0, t.score + amount) };
        }
        return t;
      })
    );
  };

  const renameTeam = (id: string, newName: string) => {
    setTeams(
      teams.map((t) => {
        if (t.id === id) {
          return { ...t, name: newName };
        }
        return t;
      })
    );
  };

  const resetScores = () => {
    setTeams(teams.map((t) => ({ ...t, score: 0 })));
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
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Class Scoreboard</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Keep score for games and group activities.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addTeam}
              disabled={teams.length >= 6}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold rounded-lg text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Team
            </button>
            <button
              onClick={resetScores}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold transition"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-4">
          {teams.map((team, index) => {
            const palette = COLOR_PALETTES[index % COLOR_PALETTES.length];
            return (
              <div
                key={team.id}
                className={`relative flex flex-col items-center p-6 border-2 rounded-2xl shadow-xs transition ${team.bgColor} ${team.borderColor}`}
              >
                {teams.length > 2 && (
                  <button
                    onClick={() => removeTeam(team.id)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-xs font-bold font-sans"
                  >
                    ×
                  </button>
                )}
                
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => renameTeam(team.id, e.target.value)}
                  className={`text-center font-black text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-400 focus:outline-none w-full max-w-[150px] mb-4 ${palette.text}`}
                />

                <div className="text-6xl font-black text-slate-800 dark:text-white mb-6 select-none transition-transform duration-200 active:scale-110">
                  {team.score}
                </div>

                <div className="flex gap-3 w-full justify-center">
                  <button
                    onClick={() => updateScore(team.id, -1)}
                    className="w-12 h-12 flex items-center justify-center border-2 border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition active:scale-90"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateScore(team.id, 1)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition active:scale-90 shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
