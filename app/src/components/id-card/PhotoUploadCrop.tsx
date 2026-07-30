/**
 * Photo upload + crop for student IDs. Crops to a fixed 1:1 square, exports a
 * size-capped JPEG data URL (480x480, ~0.85 quality) so the base64 stored on
 * Student.photo_url stays small (~50-80KB) and keeps encrypted backups lean.
 * Dependency-free: drag to pan, slider to zoom, mapped onto a canvas for export.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImagePlus, X, Trash2 } from 'lucide-react';

const CROP_W = 240;
const CROP_H = 240; // 1:1 square
const OUT_W = 480;
const OUT_H = 480;

interface Props {
    value?: string;
    onChange: (dataUrl: string) => void;
    onRemove?: () => void;
    disabled?: boolean;
}

export function PhotoUploadCrop({ value, onChange, onRemove, disabled }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [src, setSrc] = useState<string | null>(null);

    const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setSrc(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = ''; // allow re-selecting the same file
    };

    return (
        <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-md overflow-hidden border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                {value ? (
                    <img src={value} alt="Student" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">No photo</span>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-deped-blue text-white hover:bg-deped-blue-dark disabled:opacity-40 transition-colors"
                >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {value ? 'Change Photo' : 'Upload Photo'}
                </button>
                {value && onRemove && (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={onRemove}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
            {src && (
                <CropModal
                    src={src}
                    onCancel={() => setSrc(null)}
                    onConfirm={(dataUrl) => {
                        onChange(dataUrl);
                        setSrc(null);
                    }}
                />
            )}
        </div>
    );
}

function CropModal({ src, onConfirm, onCancel }: { src: string; onConfirm: (d: string) => void; onCancel: () => void }) {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const drag = useRef<{ active: boolean; startX: number; startY: number; ox: number; oy: number }>({
        active: false, startX: 0, startY: 0, ox: 0, oy: 0,
    });

    // Load the image and compute the initial centered "cover" transform.
    useEffect(() => {
        const image = new Image();
        image.onload = () => {
            imgRef.current = image;
            setImg(image);
        };
        image.src = src;
    }, [src]);

    const baseScale = img ? Math.max(CROP_W / img.width, CROP_H / img.height) : 1;
    const displayScale = baseScale * zoom;
    const drawnW = img ? img.width * displayScale : CROP_W;
    const drawnH = img ? img.height * displayScale : CROP_H;

    const clamp = useCallback(
        (x: number, y: number) => ({
            x: Math.min(0, Math.max(CROP_W - drawnW, x)),
            y: Math.min(0, Math.max(CROP_H - drawnH, y)),
        }),
        [drawnW, drawnH],
    );

    useEffect(() => {
        setOffset(clamp((CROP_W - drawnW) / 2, (CROP_H - drawnH) / 2));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [img, zoom]);

    const onPointerDown = (e: React.PointerEvent) => {
        drag.current = { active: true, startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!drag.current.active) return;
        const nx = drag.current.ox + (e.clientX - drag.current.startX);
        const ny = drag.current.oy + (e.clientY - drag.current.startY);
        setOffset(clamp(nx, ny));
    };
    const onPointerUp = () => { drag.current.active = false; };

    const handleConfirm = () => {
        if (!img) return;
        const canvas = document.createElement('canvas');
        canvas.width = OUT_W;
        canvas.height = OUT_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUT_W, OUT_H);
        // Source rect in natural-image coordinates under the crop box.
        const sx = -offset.x / displayScale;
        const sy = -offset.y / displayScale;
        const sw = CROP_W / displayScale;
        const sh = CROP_H / displayScale;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
        onConfirm(canvas.toDataURL('image/jpeg', 0.85));
    };

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800 text-sm">Adjust Photo</h3>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 flex flex-col items-center gap-4">
                    <div
                        className="relative overflow-hidden rounded-lg border-2 border-deped-blue bg-slate-100 touch-none cursor-grab active:cursor-grabbing"
                        style={{ width: CROP_W, height: CROP_H }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                    >
                        {img && (
                            <img
                                src={src}
                                alt="crop"
                                draggable={false}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: drawnW,
                                    height: drawnH,
                                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                                    maxWidth: 'none',
                                    userSelect: 'none',
                                }}
                            />
                        )}
                    </div>
                    <div className="w-full flex items-center gap-3">
                        <span className="text-xs text-slate-500">Zoom</span>
                        <input
                            type="range" min={1} max={3} step={0.01} value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="flex-1 accent-deped-blue"
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 text-center">Drag to reposition • slide to zoom</p>
                </div>
                <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
                    <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-lg text-slate-600 hover:bg-slate-200">Cancel</button>
                    <button onClick={handleConfirm} className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-deped-blue text-white hover:bg-deped-blue-dark">Use Photo</button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
