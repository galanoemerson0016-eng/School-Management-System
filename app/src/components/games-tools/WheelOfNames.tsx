import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores';
import { RotateCcw, Plus, Trash2, Play, Shuffle, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import type { Student } from '../../types';

interface WheelOfNamesProps {
  onBack: () => void;
}

function getSpinAnimationConfig() {
  const totalSpins = 5 + Math.random() * 5;
  const targetAngle = totalSpins * 2 * Math.PI;
  const duration = 4000 + Math.random() * 2000;
  const startTime = performance.now();
  return { targetAngle, duration, startTime };
}

export function WheelOfNames({ onBack }: WheelOfNamesProps) {
  const { sections, students } = useAppStore();

  const [names, setNames] = useState<string[]>(['Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Fiona']);
  const [newName, setNewName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const currentAngleRef = useRef(0);
  const [winner, setWinner] = useState('');
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [showWinner, setShowWinner] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedSectionName, setSelectedSectionName] = useState<string>('');

  const WHEEL_COLORS = useMemo(() => [
    '#0A4F8C', '#FCB932', '#059669', '#DC2626',
    '#7C3AED', '#EC4899', '#0891B2', '#F97316',
    '#14B8A6', '#EF4444', '#3B82F6', '#8B5CF6',
  ], []);

  const hasNames = names.length >= 2;

  const formatStudentName = (student: Student): string => {
    const middle = student.middle_name ? ` ${student.middle_name.charAt(0)}.` : '';
    const ext = student.name_extension ? ` ${student.name_extension}` : '';
    return `${student.last_name}, ${student.first_name}${middle}${ext}`;
  };

  const loadLearnersFromClass = () => {
    if (!selectedSectionName) return;
    const enrolled = students.filter((s) => s.student_section === selectedSectionName);
    const learnerNames = enrolled.map((l) => formatStudentName(l));
    setNames(learnerNames);
    setShowWinner(false);
  };

  const addName = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (names.includes(trimmed)) return;
    setNames((prev) => [...prev, trimmed]);
    setNewName('');
    setShowWinner(false);
  };

  const removeName = (index: number) => {
    const nextNames = [...names];
    nextNames.splice(index, 1);
    setNames(nextNames);
    setShowWinner(false);
  };

  const clearAll = () => {
    setNames([]);
    setShowWinner(false);
  };

  const shuffleNames = () => {
    const nextNames = [...names];
    for (let i = nextNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nextNames[i], nextNames[j]] = [nextNames[j], nextNames[i]];
    }
    setNames(nextNames);
    setShowWinner(false);
  };

  const getSliceAngle = useCallback(() => {
    return (2 * Math.PI) / names.length;
  }, [names.length]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = Math.min(canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (names.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#E5E7EB';
      ctx.fill();
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '600 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add names to spin', centerX, centerY);
      return;
    }

    const sliceAngle = getSliceAngle();

    for (let i = 0; i < names.length; i++) {
      const startAngle = currentAngleRef.current + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw name text
      const midAngle = startAngle + sliceAngle / 2;
      const textRadius = radius * 0.65;
      const textX = centerX + Math.cos(midAngle) * textRadius;
      const textY = centerY + Math.sin(midAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      const displayName = names[i].length > 12 ? names[i].slice(0, 12) + '...' : names[i];
      ctx.fillText(displayName, 0, 0);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#111827';
    ctx.fill();

    // Pointer at top
    ctx.beginPath();
    ctx.moveTo(centerX, 8);
    ctx.lineTo(centerX - 14, 30);
    ctx.lineTo(centerX + 14, 30);
    ctx.closePath();
    ctx.fillStyle = '#DC2626';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [names, getSliceAngle, WHEEL_COLORS]);

  const spin = () => {
    if (isSpinning || names.length < 2) return;
    setIsSpinning(true);
    setShowWinner(false);

    const { targetAngle, duration, startTime } = getSpinAnimationConfig();
    const startAngle = currentAngleRef.current;

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      currentAngleRef.current = startAngle + targetAngle * eased;
      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        determineWinner();
      }
    };

    requestAnimationFrame(animate);
  };

  const determineWinner = () => {
    const sliceAngle = getSliceAngle();
    let delta = (3 * Math.PI / 2 - currentAngleRef.current) % (2 * Math.PI);
    if (delta < 0) delta += 2 * Math.PI;
    const index = Math.floor(delta / sliceAngle) % names.length;
    setWinnerIndex(index);
    setWinner(names[index]);
    setShowWinner(true);
  };

  const removeWinner = () => {
    if (winnerIndex >= 0 && winnerIndex < names.length) {
      const nextNames = [...names];
      nextNames.splice(winnerIndex, 1);
      setNames(nextNames);
      setWinnerIndex(-1);
      setShowWinner(false);
    }
  };

  const keepWinner = () => {
    setWinnerIndex(-1);
    setShowWinner(false);
  };

  const toggleFullscreen = () => {
    const el = wheelContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    let size: number;
    if (document.fullscreenElement) {
      size = Math.min(parent.clientWidth, parent.clientHeight, 800);
    } else {
      const availWidth = window.innerWidth - 380;
      const availHeight = window.innerHeight - 220;
      size = Math.min(parent.clientWidth, Math.max(320, Math.min(availWidth, availHeight) * 0.9));
    }
    canvas.width = size;
    canvas.height = size;
    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(resizeCanvas, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const exportNames = () => {
    const header = 'Name';
    const rows = names.map((n) => (n.includes(',') ? `"${n.replace(/"/g, '""')}"` : n));
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wheel-names.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importNames = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = (ev.target?.result as string) || '';
          const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
          const importedNames: string[] = [];
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            if (i === 0 && line.toLowerCase() === 'name') continue;
            let name = line;
            if (name.startsWith('"') && name.endsWith('"')) {
              name = name.slice(1, -1).replace(/""/g, '"');
            }
            const trimmed = name.trim();
            if (trimmed && !importedNames.includes(trimmed)) {
              importedNames.push(trimmed);
            }
          }
          if (importedNames.length > 0) {
            setNames(importedNames);
            setShowWinner(false);
          }
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
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
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Wheel of Names</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Spin the wheel to randomly select a name</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportNames} disabled={names.length === 0} className="px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:border-amber-500 font-semibold text-xs transition disabled:opacity-40">
              Export CSV
            </button>
            <button onClick={importNames} className="px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:border-amber-500 font-semibold text-xs transition">
              Import CSV
            </button>
            <button onClick={toggleFullscreen} className="w-9 h-9 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50">
              {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <div ref={wheelContainerRef} className={`grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-[#0f172a] p-8 flex flex-col items-center justify-center' : ''}`}>
          <div className="relative aspect-square w-full max-w-[450px] mx-auto flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full" />
            {showWinner && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center rounded-full">
                <div className="bg-white dark:bg-slate-800 border-2 border-amber-500 rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4 max-w-xs text-center">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Winner</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{winner}</span>
                  <div className="flex gap-2 w-full">
                    <button onClick={keepWinner} className="flex-1 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500 rounded-xl font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition">
                      Keep
                    </button>
                    <button onClick={removeWinner} className="flex-1 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-500 rounded-xl font-bold text-xs text-red-700 dark:text-red-400 hover:bg-red-500 hover:text-white transition flex items-center justify-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isFullscreen && (
            <div className="flex flex-col gap-4 border border-slate-200 dark:border-white/10 p-4 rounded-2xl w-full">
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
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && addName()}
                  type="text"
                  placeholder="Enter a name..."
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-xs font-semibold"
                />
                <button onClick={addName} className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:border-amber-500">
                  <Plus className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto border border-slate-100 dark:border-white/5 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/50">
                {names.map((name, index) => (
                  <div key={index} className="flex justify-between items-center bg-white dark:bg-[#1e293b] px-3 py-1.5 rounded-lg border-l-4 border-slate-200 dark:border-white/10 text-xs font-bold shadow-xs" style={{ borderLeftColor: WHEEL_COLORS[index % WHEEL_COLORS.length] }}>
                    <span className="truncate text-slate-700 dark:text-slate-300 mr-2">{name}</span>
                    <button onClick={() => removeName(index)} className="text-slate-400 hover:text-red-500 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {names.length === 0 && <div className="text-center text-xs text-slate-400 py-4">No names added yet.</div>}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={spin}
                  disabled={!hasNames || isSpinning}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold rounded-xl text-sm transition shadow-md"
                >
                  <Play className="w-4 h-4 fill-slate-900" />
                  {isSpinning ? 'Spinning...' : 'Spin Wheel'}
                </button>
                <button onClick={shuffleNames} disabled={names.length < 2} className="p-2.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-500">
                  <Shuffle className="w-4 h-4" />
                </button>
                <button onClick={clearAll} disabled={names.length === 0} className="p-2.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-500">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
