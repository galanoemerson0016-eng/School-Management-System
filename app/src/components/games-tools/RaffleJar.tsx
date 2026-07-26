import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores';
import { ArrowLeft, Ticket, Plus, Trash2, Trophy, Volume2, VolumeX, Sparkles } from 'lucide-react';
import type { Student } from '../../types';

interface RaffleJarProps {
  onBack: () => void;
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
  const [winnerIndex, setWinnerIndex] = useState<number>(-1);
  const [selectedSectionName, setSelectedSectionName] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiAnimationFrameRef = useRef<number | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };

  const playShuffleTick = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 300, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio fallback
    }
  };

  const playWinnerFanfare = () => {
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

  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = canvas.parentElement?.clientHeight || 400;

    const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899'];
    const particles: ConfettiParticle[] = Array.from({ length: 60 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.7) * 14,
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
        p.opacity -= 0.02;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (aliveCount > 0) {
        confettiAnimationFrameRef.current = requestAnimationFrame(renderConfetti);
      }
    };

    renderConfetti();
  };

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

  const removeWinner = () => {
    if (winnerIndex >= 0 && winnerIndex < tickets.length) {
      removeTicket(winnerIndex);
      setWinner(null);
      setWinnerIndex(-1);
    }
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

    const interval = setInterval(() => {
      playShuffleTick();
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      const idx = Math.floor(Math.random() * tickets.length);
      setWinner(tickets[idx]);
      setWinnerIndex(idx);
      setIsDrawing(false);
      playWinnerFanfare();
      triggerConfetti();
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (confettiAnimationFrameRef.current) {
        cancelAnimationFrame(confettiAnimationFrameRef.current);
      }
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
              🎟️ Raffle Ticket Jar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Draw random winning student tickets out of a glass raffle jar!
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
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Raffle Jar Canvas Stage */}
        <div className="relative aspect-square w-full max-w-105 mx-auto flex flex-col items-center justify-center border-4 border-amber-500/30 bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden p-8">
          <canvas ref={confettiCanvasRef} className="absolute inset-0 pointer-events-none w-full h-full z-20" />

          {/* Glass Jar Shell */}
          <div className="absolute inset-6 rounded-3xl border-2 border-white/40 dark:border-white/10 shadow-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
            {isDrawing ? (
              <div className="flex flex-col items-center gap-4 animate-bounce">
                <div className="w-20 h-12 bg-amber-500 border-2 border-amber-600 rounded-2xl shadow-lg flex items-center justify-center font-black text-white text-2xl animate-spin">
                  🎟️
                </div>
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest animate-pulse">
                  Shuffling Tickets...
                </span>
              </div>
            ) : winner ? (
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner animate-bounce">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> WINNER DRAWN <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mt-1">
                    {winner}
                  </h3>
                </div>
                <button
                  onClick={removeWinner}
                  className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
                >
                  Remove Winner from Jar
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-2">
                <Ticket className="w-12 h-12 text-amber-500 opacity-80" />
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                  {tickets.length} Tickets in Jar
                </span>
                <p className="text-xs text-slate-400 font-medium">Click "Draw Ticket" to pick a random student winner.</p>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="flex flex-col gap-4 bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-200/80 dark:border-white/5">
          <button
            onClick={drawWinner}
            disabled={isDrawing || tickets.length === 0}
            className="w-full py-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Ticket className="w-5 h-5 fill-white" />
            {isDrawing ? 'DRAWING TICKET...' : 'DRAW WINNING TICKET'}
          </button>

          {/* Load section dropdown */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-white/10">
            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Load Learners from Section</label>
            <div className="flex gap-2">
              <select
                value={selectedSectionName}
                onChange={(e) => setSelectedSectionName(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
              >
                <option value="">-- Select Section --</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.section_name}>
                    {sec.section_name} ({sec.section_grade_level})
                  </option>
                ))}
              </select>
              <button
                onClick={loadLearnersFromClass}
                disabled={!selectedSectionName}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Load
              </button>
            </div>
          </div>

          {/* Add ticket name */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter name..."
              value={newTicketName}
              onChange={(e) => setNewTicketName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTicket()}
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none placeholder:text-slate-400"
            />
            <button onClick={addTicket} className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition cursor-pointer">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Counter + clear */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold pt-1">
            <span>{tickets.length} Tickets</span>
            <button onClick={clearAll} disabled={tickets.length === 0} className="hover:text-red-500 flex items-center gap-1 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          {/* Ticket list */}
          <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
            {tickets.map((name, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs font-bold group">
                <span className="truncate text-slate-800 dark:text-slate-200">{name}</span>
                <button onClick={() => removeTicket(idx)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
