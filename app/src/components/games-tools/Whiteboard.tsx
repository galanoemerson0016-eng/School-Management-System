import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, Download, Minus, Plus, Eraser, Pen } from 'lucide-react';

interface WhiteboardProps {
  onBack: () => void;
}

export function Whiteboard({ onBack }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#111827');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const colors = [
    '#111827',
    '#DC2626',
    '#2563EB',
    '#059669',
    '#D97706',
    '#7C3AED',
    '#DB2777',
    '#0891B2',
  ];

  const getPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getPoint(e);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
  };

  const setColor = (color: string) => {
    setIsEraser(false);
    setBrushColor(color);
  };

  const changeSize = (delta: number) => {
    setBrushSize((prev) => Math.max(1, Math.min(50, prev + delta)));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const isEraserRef = useRef(isEraser);

  useEffect(() => {
    brushColorRef.current = brushColor;
    brushSizeRef.current = brushSize;
    isEraserRef.current = isEraser;
  }, [brushColor, brushSize, isEraser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    const parent = canvas.parentElement;
    if (!parent) return;

    let isInitialized = false;

    const updateSize = () => {
      const rect = parent.getBoundingClientRect();
      const newWidth = Math.floor(rect.width);
      const newHeight = Math.floor(rect.height);
      if (newWidth <= 0 || newHeight <= 0) return;

      if (!isInitialized) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newWidth, newHeight);
        isInitialized = true;
      } else if (canvas.width !== newWidth || canvas.height !== newHeight) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newWidth, newHeight);
        if (tempCtx) {
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }

      ctx.lineWidth = brushSizeRef.current;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isEraserRef.current ? '#FFFFFF' : brushColorRef.current;
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Sync brush properties with canvas context
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#FFFFFF' : brushColor;
  }, [brushSize, brushColor, isEraser]);

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-[calc(100vh-120px)] p-2 sm:p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4 sm:p-6 shadow-xs flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-4 mb-6 flex-wrap justify-between shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Whiteboard</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Draw ideas, diagrams, and notes. Export as PNG when done.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Toolbar */}
          <div className="flex items-center gap-4 flex-wrap p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsEraser(false)}
                className={`p-2 rounded-lg border transition cursor-pointer ${
                  !isEraser
                    ? 'bg-amber-500 border-amber-500 text-slate-900'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <Pen className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEraser(true)}
                className={`p-2 rounded-lg border transition cursor-pointer ${
                  isEraser
                    ? 'bg-amber-500 border-amber-500 text-slate-900'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />

            {/* Colors */}
            <div className="flex items-center gap-1.5">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition hover:scale-110 cursor-pointer ${
                    brushColor === color && !isEraser
                      ? 'border-slate-800 dark:border-white scale-110 shadow-xs'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />

            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <button onClick={() => changeSize(-2)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-9 text-center">
                {brushSize}px
              </span>
              <button onClick={() => changeSize(2)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={clearCanvas} className="p-2 border border-slate-200 dark:border-white/10 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 dark:text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={exportCanvas} className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition cursor-pointer">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden relative min-h-0 w-full h-full">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full block bg-white cursor-crosshair touch-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
