import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores/app-store';
import { Plus, Trash2, Play, Shuffle, ArrowLeft, Maximize2, Minimize2, Volume2, VolumeX, Trophy, Sparkles, UserCheck } from 'lucide-react';
import type { Student } from '../../types';

interface WheelOfNamesProps {
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

function getSpinAnimationConfig() {
  const totalSpins = 6 + Math.random() * 4;
  const targetAngle = totalSpins * 2 * Math.PI;
  const duration = 4500 + Math.random() * 1500;
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nameFormat, setNameFormat] = useState<'full' | 'last' | 'first'>('full');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSectionName, setSelectedSectionName] = useState<string>('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSliceIdxRef = useRef<number>(-1);
  const confettiAnimationFrameRef = useRef<number | null>(null);

  // Vibrant rich contrast color scheme
  const WHEEL_PALETTE = useMemo(() => [
    { bg1: '#0A3D91', bg2: '#1D62D5', text: '#FFFFFF' },
    { bg1: '#D97706', bg2: '#F59E0B', text: '#FFFFFF' },
    { bg1: '#059669', bg2: '#10B981', text: '#FFFFFF' },
    { bg1: '#DC2626', bg2: '#EF4444', text: '#FFFFFF' },
    { bg1: '#7C3AED', bg2: '#8B5CF6', text: '#FFFFFF' },
    { bg1: '#DB2777', bg2: '#EC4899', text: '#FFFFFF' },
    { bg1: '#0284C7', bg2: '#38BDF8', text: '#FFFFFF' },
    { bg1: '#EA580C', bg2: '#F97316', text: '#FFFFFF' },
    { bg1: '#0D9488', bg2: '#14B8A6', text: '#FFFFFF' },
    { bg1: '#4F46E5', bg2: '#6366F1', text: '#FFFFFF' },
  ], []);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };

  const playClickTickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Audio fallback
    }
  };

  const playWinnerFanfare = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.35, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.4);
      });
    } catch {
      // Audio fallback
    }
  };

  const hasNames = names.length >= 2;

  const formatStudentName = useCallback((student: Student, format: 'full' | 'last' | 'first' = nameFormat): string => {
    if (format === 'last') return student.last_name;
    if (format === 'first') return student.first_name;
    const middle = student.middle_name ? ` ${student.middle_name.charAt(0)}.` : '';
    const ext = student.name_extension ? ` ${student.name_extension}` : '';
    return `${student.last_name}, ${student.first_name}${middle}${ext}`;
  }, [nameFormat]);

  const loadLearnersFromClass = useCallback(() => {
    if (!selectedSectionName) return;
    const enrolled = students.filter((s) => s.student_section === selectedSectionName);
    const learnerNames = enrolled.map((l) => formatStudentName(l, nameFormat));
    setNames(learnerNames);
    setShowWinner(false);
  }, [selectedSectionName, students, formatStudentName, nameFormat]);

  useEffect(() => {
    if (selectedSectionName) {
      loadLearnersFromClass();
    }
  }, [nameFormat, loadLearnersFromClass, selectedSectionName]);

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

  // Confetti Explosion
  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = canvas.parentElement?.clientHeight || 500;

    const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
    const particles: ConfettiParticle[] = Array.from({ length: 80 }, () => ({
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
        p.vy += 0.3; // Gravity
        p.rotation += p.rotSpeed;
        p.opacity -= 0.015;

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

  // High-End Wheel Canvas Renderer with Radial Along-Ray Text Engine
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = Math.min(canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRimRadius = size / 2 - 12;
    const wheelRadius = outerRimRadius - 18;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (names.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, wheelRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add names to spin', centerX, centerY);
      return;
    }

    // 1. Draw Golden Metallic Outer Bevel Rim
    const goldGrad = ctx.createRadialGradient(centerX, centerY, wheelRadius, centerX, centerY, outerRimRadius);
    goldGrad.addColorStop(0, '#B45309');
    goldGrad.addColorStop(0.3, '#F59E0B');
    goldGrad.addColorStop(0.6, '#FEF3C7');
    goldGrad.addColorStop(1, '#78350F');

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRimRadius, 0, 2 * Math.PI);
    ctx.fillStyle = goldGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 2. Draw Golden Peg Bulbs / Studs around rim
    const totalPegs = Math.min(36, Math.max(16, names.length));
    const pegRadius = outerRimRadius - 9;
    for (let p = 0; p < totalPegs; p++) {
      const pegAngle = (p * 2 * Math.PI) / totalPegs;
      const pegX = centerX + Math.cos(pegAngle) * pegRadius;
      const pegY = centerY + Math.sin(pegAngle) * pegRadius;

      ctx.beginPath();
      ctx.arc(pegX, pegY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const sliceAngle = getSliceAngle();

    // Dynamic stroke width based on slice count
    const separatorLineWidth = names.length > 30 ? 1 : names.length > 20 ? 1.5 : 2.5;

    // 3. Draw Color Slices with Radial Gradients
    for (let i = 0; i < names.length; i++) {
      const startAngle = currentAngleRef.current + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      const palette = WHEEL_PALETTE[i % WHEEL_PALETTE.length];

      // Radial slice gradient
      const sliceGrad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, wheelRadius);
      sliceGrad.addColorStop(0, palette.bg2);
      sliceGrad.addColorStop(1, palette.bg1);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, wheelRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = sliceGrad;
      ctx.fill();

      // Slice separator lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = separatorLineWidth;
      ctx.stroke();

      // 4. Draw Radial Along-Ray Slice Text (Eliminates text overlap when there are many names)
      let normAngle = (startAngle + sliceAngle / 2) % (2 * Math.PI);
      if (normAngle < 0) normAngle += 2 * Math.PI;

      const textRadius = wheelRadius * 0.86;
      const textX = centerX + Math.cos(normAngle) * textRadius;
      const textY = centerY + Math.sin(normAngle) * textRadius;

      // Dynamic font size & max character truncation based on slice count
      let fontSize = 13;
      let maxChars = 16;
      if (names.length > 35) {
        fontSize = 8.5;
        maxChars = 10;
      } else if (names.length > 25) {
        fontSize = 9.5;
        maxChars = 12;
      } else if (names.length > 18) {
        fontSize = 11;
        maxChars = 14;
      }

      ctx.save();
      ctx.translate(textX, textY);

      // Flip text when on bottom/left half so it is always right-side-up to read!
      let fontAngle = normAngle;
      let align: CanvasTextAlign = 'right';
      if (normAngle > Math.PI / 2 && normAngle < (3 * Math.PI) / 2) {
        fontAngle = normAngle + Math.PI;
        align = 'left';
      }

      ctx.rotate(fontAngle);

      // High-contrast drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = palette.text;
      ctx.font = `800 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';

      let displayName = names[i];
      if (displayName.length > maxChars) {
        displayName = displayName.slice(0, maxChars) + '..';
      }
      ctx.fillText(displayName, 0, 0);
      ctx.restore();
    }

    // 5. Center Golden Metallic Hub
    const hubGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 28);
    hubGrad.addColorStop(0, '#FFFFFF');
    hubGrad.addColorStop(0.4, '#F59E0B');
    hubGrad.addColorStop(1, '#78350F');

    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center Gold Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    // 6. Styled 3D Gold Pointer Needle at Top
    const needleTopY = 4;
    const needleBottomY = 32;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(centerX, needleBottomY);
    ctx.lineTo(centerX - 16, needleTopY);
    ctx.lineTo(centerX + 16, needleTopY);
    ctx.closePath();

    const needleGrad = ctx.createLinearGradient(centerX - 16, 0, centerX + 16, 0);
    needleGrad.addColorStop(0, '#DC2626');
    needleGrad.addColorStop(0.5, '#EF4444');
    needleGrad.addColorStop(1, '#991B1B');

    ctx.fillStyle = needleGrad;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Ruby Jewel Center Dot on Needle
    ctx.beginPath();
    ctx.arc(centerX, needleTopY + 10, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#FEF3C7';
    ctx.fill();
    ctx.restore();
  }, [names, getSliceAngle, WHEEL_PALETTE]);

  const determineWinner = () => {
    const sliceAngle = getSliceAngle();
    let delta = (3 * Math.PI / 2 - currentAngleRef.current) % (2 * Math.PI);
    if (delta < 0) delta += 2 * Math.PI;
    const index = Math.floor(delta / sliceAngle) % names.length;
    setWinnerIndex(index);
    setWinner(names[index]);
    setShowWinner(true);
    playWinnerFanfare();
    triggerConfetti();
  };

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

      // Mechanical tick audio when crossing slice boundaries
      const sliceAngle = getSliceAngle();
      let delta = (3 * Math.PI / 2 - currentAngleRef.current) % (2 * Math.PI);
      if (delta < 0) delta += 2 * Math.PI;
      const currentSliceIdx = Math.floor(delta / sliceAngle) % names.length;
      if (currentSliceIdx !== lastSliceIdxRef.current) {
        lastSliceIdxRef.current = currentSliceIdx;
        playClickTickSound();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        determineWinner();
      }
    };

    requestAnimationFrame(animate);
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

  useEffect(() => {
    return () => {
      if (confettiAnimationFrameRef.current) {
        cancelAnimationFrame(confettiAnimationFrameRef.current);
      }
    };
  }, []);

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
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6 animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-black transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                🎡 Wheel of Names
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Spin the wheel to randomly select a student name</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30'
                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-[#0f172a] dark:border-white/5'
              }`}
              title="Toggle Spinning Sound Effects"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={exportNames} disabled={names.length === 0} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-amber-500 font-bold text-xs transition disabled:opacity-40 cursor-pointer">
              Export CSV
            </button>
            <button onClick={importNames} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-amber-500 font-bold text-xs transition cursor-pointer">
              Import CSV
            </button>
            <button onClick={toggleFullscreen} className="w-9.5 h-9.5 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div ref={wheelContainerRef} className={`grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 items-center ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-8 flex flex-col items-center justify-center' : ''}`}>
          <div className="relative aspect-square w-full max-w-120 mx-auto flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full" />
            <canvas ref={confettiCanvasRef} className="absolute inset-0 pointer-events-none w-full h-full z-20" />

            {/* Glassmorphic Winner Announcement Popup */}
            {showWinner && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center rounded-full z-30 animate-fade-in">
                <div className="bg-white/95 dark:bg-[#0f172a]/95 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> WINNER SELECTED <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mt-1">
                      {winner}
                    </h3>
                  </div>
                  <div className="flex gap-2 w-full pt-1">
                    <button
                      onClick={keepWinner}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer"
                    >
                      Keep
                    </button>
                    <button
                      onClick={removeWinner}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-200/80 dark:border-white/5">
            <button
              onClick={spin}
              disabled={isSpinning || !hasNames}
              className="w-full py-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-black text-base rounded-2xl shadow-lg shadow-amber-500/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-5 h-5 fill-white" />
              {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL'}
            </button>

            {/* Name Display Format Selector */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-white/10">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-500" /> Display Format on Wheel
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-200/60 dark:bg-white/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNameFormat('full')}
                  className={`py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    nameFormat === 'full' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Full Name
                </button>
                <button
                  type="button"
                  onClick={() => setNameFormat('last')}
                  className={`py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    nameFormat === 'last' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Last Only
                </button>
                <button
                  type="button"
                  onClick={() => setNameFormat('first')}
                  className={`py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    nameFormat === 'first' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  First Only
                </button>
              </div>
            </div>

            {/* Load from section dropdown */}
            <div className="flex flex-col gap-1.5 pt-1">
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

            {/* Input name */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addName()}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none placeholder:text-slate-400"
              />
              <button onClick={addName} className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Names counter + actions */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold pt-1">
              <span>{names.length} Names</span>
              <div className="flex gap-3">
                <button onClick={shuffleNames} disabled={names.length < 2} className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer">
                  <Shuffle className="w-3.5 h-3.5" /> Shuffle
                </button>
                <button onClick={clearAll} disabled={names.length === 0} className="hover:text-red-500 flex items-center gap-1 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </div>

            {/* List of names */}
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
              {names.map((name, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs font-bold group">
                  <span className="truncate text-slate-800 dark:text-slate-200">{name}</span>
                  <button onClick={() => removeName(idx)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
