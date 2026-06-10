import React, { useState } from 'react';
import { useAppStore } from '../../stores';
import { ArrowLeft, Ticket, Plus, Trash2, Trophy, RotateCcw } from 'lucide-react';
import type { Student } from '../../types';

interface RaffleJarProps {
  onBack: () => void;
}

function getRaffleConfig() {
  const duration = 2500 + Math.random() * 1500;
  const startTime = performance.now();
  return { duration, startTime };
}

export function RaffleJar({ onBack }: RaffleJarProps) {
  const { sections, students } = useAppStore();

  const [tickets, setTickets] = useState<string[]>(['Emma', 'Liam', 'Olivia', 'Noah', 'Ava']);
  const [newTicketName, setNewTicketName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedSectionName, setSelectedSectionName] = useState<string>('');

  const formatStudentName = (student: Student): string => {
    const middle = student.middle_name ? ` ${student.middle_name.charAt(0)}.` : '';
    const ext = student.name_extension ? ` ${student.name_extension}` : '';
    return `${student.last_name}, ${student.first_name}${middle}${ext}`;
  };

  const loadLearnersFromClass = () => {
    if (!selectedSectionName) return;
    const enrolled = students.filter((s) => s.student_section === selectedSectionName);
    setTickets(enrolled.map((l) => formatStudentName(l)));
    setWinner(null);
  };

  const addTicket = () => {
    const trimmed = newTicketName.trim();
    if (!trimmed) return;
    setTickets((prev) => [...prev, trimmed]);
    setNewTicketName('');
    setWinner(null);
  };

  const removeTicket = (index: number) => {
    const nextTickets = [...tickets];
    nextTickets.splice(index, 1);
    setTickets(nextTickets);
    setWinner(null);
  };

  const clearAll = () => {
    setTickets([]);
    setWinner(null);
  };

  const drawWinner = () => {
    if (isDrawing || tickets.length === 0) return;
    setIsDrawing(true);
    setWinner(null);

    const { duration } = getRaffleConfig();

    setTimeout(() => {
      const idx = Math.floor(Math.random() * tickets.length);
      setWinner(tickets[idx]);
      setIsDrawing(false);
    }, duration);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Raffle & Ticket Jar</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Put names into a jar and draw a random winner.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Raffle Jar Visual */}
          <div className="relative aspect-square w-full max-w-[320px] mx-auto flex flex-col items-center justify-center border-4 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 rounded-full shadow-inner overflow-hidden p-6">
            
            {/* The Glass Jar Shell */}
            <div className="absolute inset-4 rounded-full border border-white/20 shadow-lg backdrop-blur-[2px] flex items-center justify-center">
              {isDrawing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-10 bg-amber-400 border-2 border-amber-600 rounded-lg animate-spin shadow-md flex items-center justify-center font-bold text-amber-950">
                    ?
                  </div>
                  <span className="text-xs font-bold text-slate-400 animate-pulse">Shuffling tickets...</span>
                </div>
              ) : winner ? (
                <div className="flex flex-col items-center gap-2 text-center p-4">
                  <Trophy className="w-8 h-8 text-amber-500 animate-bounce" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Winner Drawn!</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-tight">{winner}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-4 gap-1">
                  <Ticket className="w-8 h-8 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400">{tickets.length} Tickets Inside</span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Settings Panel */}
          <div className="flex flex-col gap-4 border border-slate-200 dark:border-white/10 p-4 rounded-2xl bg-white dark:bg-[#1e293b]/50">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Load from Class</label>
              <select
                value={selectedSectionName}
                onChange={(e) => setSelectedSectionName(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-sm font-semibold w-full"
              >
                <option value="">Select class...</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.section_name}>
                    Grade {s.section_grade_level} - {s.section_name}
                  </option>
                ))}
              </select>
              <button
                onClick={loadLearnersFromClass}
                disabled={!selectedSectionName}
                className="w-full py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-xl text-xs hover:opacity-90 disabled:opacity-50 transition"
              >
                Load Learners
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={newTicketName}
                onChange={(e) => setNewTicketName(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && addTicket()}
                type="text"
                placeholder="Enter a name..."
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-xs font-semibold"
              />
              <button onClick={addTicket} className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:border-amber-500">
                <Plus className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto border border-slate-100 dark:border-white/5 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/50">
              {tickets.map((name, index) => (
                <div key={index} className="flex justify-between items-center bg-white dark:bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 text-xs font-bold shadow-xs">
                  <span className="truncate text-slate-700 dark:text-slate-300 mr-2">{name}</span>
                  <button onClick={() => removeTicket(index)} className="text-slate-400 hover:text-red-500 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {tickets.length === 0 && <div className="text-center text-xs text-slate-400 py-4">No tickets added yet.</div>}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={drawWinner}
                disabled={tickets.length === 0 || isDrawing}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold rounded-xl text-sm transition shadow-md"
              >
                {isDrawing ? 'Drawing...' : 'Draw Ticket'}
              </button>
              <button onClick={clearAll} disabled={tickets.length === 0} className="p-2.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-500">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
