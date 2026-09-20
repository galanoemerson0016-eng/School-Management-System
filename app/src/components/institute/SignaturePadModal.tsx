import { useRef, useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Check, PenTool, Eraser, Sparkles } from 'lucide-react';

interface SignaturePadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dataUrl: string) => void;
    title?: string;
    signerName?: string;
    signerRole?: string;
}

export function SignaturePadModal({
    isOpen,
    onClose,
    onSave,
    title = 'Digital Specimen Signature Studio',
    signerName,
    signerRole,
}: SignaturePadModalProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasStrokes, setHasStrokes] = useState(false);
    const [strokeColor, setStrokeColor] = useState('#0f172a'); // DepEd Midnight slate/black
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [history, setHistory] = useState<ImageData[]>([]);

    // Initialize Canvas
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ensure high-DPI crisp rendering
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.clearRect(0, 0, rect.width, rect.height);
        setHistory([]);
        setHasStrokes(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Small delay to allow modal layout to compute dimensions
            const timer = setTimeout(() => {
                initCanvas();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initCanvas]);

    const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;

        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const saveHistoryState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => [...prev.slice(-15), state]); // Keep last 15 states
    };

    const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        saveHistoryState();
        setIsDrawing(true);
        setHasStrokes(true);

        const pt = getCanvasPoint(e);
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.moveTo(pt.x, pt.y);
    };

    const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pt = getCanvasPoint(e);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
    };

    const handleEnd = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        e.preventDefault();
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.closePath();
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const previousState = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        ctx.putImageData(previousState, 0, 0);

        if (history.length <= 1) {
            setHasStrokes(false);
        }
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        saveHistoryState();
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        setHasStrokes(false);
    };

    // Trim whitespace around drawn signature and export clean PNG data URL
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasStrokes) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        let minX = w, minY = h, maxX = 0, maxY = 0;
        let found = false;

        // Scan non-transparent pixels (alpha > 15)
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const alpha = data[(y * w + x) * 4 + 3];
                if (alpha > 15) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    found = true;
                }
            }
        }

        if (!found) {
            alert('Please draw your signature before saving.');
            return;
        }

        // Add 16px padding around signature
        const pad = 16;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.min(w - cropX, (maxX - minX) + (pad * 2));
        const cropH = Math.min(h - cropY, (maxY - minY) + (pad * 2));

        // Create temporary canvas for cropped result
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;
        const croppedCtx = croppedCanvas.getContext('2d');
        if (!croppedCtx) return;

        croppedCtx.drawImage(
            canvas,
            cropX, cropY, cropW, cropH,
            0, 0, cropW, cropH
        );

        const dataUrl = croppedCanvas.toDataURL('image/png');
        onSave(dataUrl);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <PenTool className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
                                {title}
                            </h3>
                            <p className="text-[10.5px] text-slate-400 font-medium">
                                Sign with your mouse, stylus, or finger. Exports as a transparent specimen PNG.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Signer Info Badge if provided */}
                {(signerName || signerRole) && (
                    <div className="px-5 py-2 bg-blue-50/40 dark:bg-blue-950/20 border-b border-blue-100/50 dark:border-blue-900/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                Signer: <strong className="text-blue-600 dark:text-blue-400">{signerName || 'Designated Official'}</strong>
                            </span>
                        </div>
                        {signerRole && (
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                                {signerRole}
                            </span>
                        )}
                    </div>
                )}

                {/* Canvas Area */}
                <div className="p-5 flex flex-col gap-3">
                    {/* Controls Bar */}
                    <div className="flex items-center justify-between text-xs">
                        {/* Ink Color Picker */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Ink:</span>
                            {[
                                { color: '#0f172a', label: 'Black' },
                                { color: '#1e40af', label: 'DepEd Blue' },
                                { color: '#0369a1', label: 'Cyan' },
                            ].map(item => (
                                <button
                                    key={item.color}
                                    type="button"
                                    onClick={() => setStrokeColor(item.color)}
                                    className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                                        strokeColor === item.color
                                            ? 'scale-110 border-blue-500 ring-2 ring-blue-400/30'
                                            : 'border-white dark:border-slate-800 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: item.color }}
                                    title={item.label}
                                />
                            ))}
                        </div>

                        {/* Stroke Thickness */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Width:</span>
                            {[
                                { width: 2, label: 'Fine' },
                                { width: 3, label: 'Medium' },
                                { width: 5, label: 'Bold' },
                            ].map(w => (
                                <button
                                    key={w.width}
                                    type="button"
                                    onClick={() => setStrokeWidth(w.width)}
                                    className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md transition-colors cursor-pointer ${
                                        strokeWidth === w.width
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                    }`}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>

                        {/* Undo & Clear */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleUndo}
                                disabled={history.length === 0}
                                className="px-2 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-colors"
                                title="Undo last stroke"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Undo
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                disabled={!hasStrokes}
                                className="px-2 py-1 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-colors"
                                title="Clear signature canvas"
                            >
                                <Eraser className="w-3.5 h-3.5" />
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Canvas Wrapper with Authentic DepEd Specimen Signature Line */}
                    <div className="relative w-full h-56 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 overflow-hidden shadow-inner group">
                        {/* Signature Guideline */}
                        <div className="absolute inset-x-8 bottom-12 border-b border-slate-300/80 dark:border-slate-700/80 flex items-center justify-between pointer-events-none select-none">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 dark:text-slate-600">
                                Official Specimen Line
                            </span>
                            <span className="text-[9px] uppercase font-semibold text-slate-300 dark:text-slate-600">
                                Sign Above Line
                            </span>
                        </div>

                        {!hasStrokes && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 pointer-events-none select-none gap-1">
                                <PenTool className="w-6 h-6 opacity-40 animate-pulse" />
                                <span className="text-xs font-medium">Draw your signature here</span>
                            </div>
                        )}

                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleStart}
                            onMouseMove={handleMove}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                            onTouchStart={handleStart}
                            onTouchMove={handleMove}
                            onTouchEnd={handleEnd}
                            className="w-full h-full cursor-crosshair touch-none"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasStrokes}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Check className="w-4 h-4" />
                        Apply Specimen Signature
                    </button>
                </div>
            </div>
        </div>
    );
}
