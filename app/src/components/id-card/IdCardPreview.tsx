/**
 * ID Card Preview component.
 * Supports side-by-side layout and interactive 3D flip card mode.
 */
import { useState, type RefObject } from 'react';
import type { IdCardViewModel } from '../../services/id-card/idCardData';
import { IdCardFront } from './IdCardFront';
import { IdCardBack } from './IdCardBack';
import { CARD_WIDTH_MM, CARD_HEIGHT_MM } from './idCardDimensions';
import { LayoutGrid, RotateCw } from 'lucide-react';

interface Props {
    model: IdCardViewModel;
    frontRef?: RefObject<HTMLDivElement | null>;
    backRef?: RefObject<HTMLDivElement | null>;
    scale?: number;
    showBack?: boolean;
}

function ScaledCard({ scale, children }: { scale: number; children: React.ReactNode }) {
    return (
        <div
            style={{
                width: `${CARD_WIDTH_MM * scale}mm`,
                height: `${CARD_HEIGHT_MM * scale}mm`,
                flexShrink: 0,
            }}
        >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
        </div>
    );
}

export function IdCardPreview({ model, frontRef, backRef, scale = 2, showBack = true }: Props) {
    const [viewMode, setViewMode] = useState<'split' | 'flip'>('split');
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="flex flex-col items-center gap-6">
            {/* View Mode Tabs */}
            {showBack && (
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 select-none shadow-sm">
                    <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5 rounded-md transition-all ${
                            viewMode === 'split'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" /> Side-by-Side
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('flip')}
                        className={`px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5 rounded-md transition-all ${
                            viewMode === 'flip'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <RotateCw className="w-3.5 h-3.5" /> 3D Flip Card
                    </button>
                </div>
            )}

            {viewMode === 'split' || !showBack ? (
                /* Split View */
                <div className="flex flex-wrap items-start justify-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Front</span>
                        <ScaledCard scale={scale}>
                            <div ref={frontRef}>
                                <IdCardFront model={model} />
                            </div>
                        </ScaledCard>
                    </div>
                    {showBack && (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Back</span>
                            <ScaledCard scale={scale}>
                                <div ref={backRef}>
                                    <IdCardBack model={model} />
                                </div>
                            </ScaledCard>
                        </div>
                    )}
                </div>
            ) : (
                /* 3D Flip Card View */
                <div className="flex flex-col items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Click card to flip ({isFlipped ? 'BACK' : 'FRONT'})
                    </span>
                    
                    <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="group relative select-none flip-card-container"
                        style={{
                            width: `${CARD_WIDTH_MM * scale}mm`,
                            height: `${CARD_HEIGHT_MM * scale}mm`,
                            perspective: '1200px',
                            cursor: 'pointer',
                        }}
                    >
                        <div
                            className="w-full h-full duration-700 ease-out transition-transform"
                            style={{
                                transformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                position: 'relative',
                            }}
                        >
                            {/* Front Face */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    zIndex: isFlipped ? 1 : 2,
                                }}
                            >
                                <ScaledCard scale={scale}>
                                    {/* We wrap with ref only so pdf-export gets the front element if queried */}
                                    <div ref={frontRef}>
                                        <IdCardFront model={model} />
                                    </div>
                                </ScaledCard>
                            </div>

                            {/* Back Face */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    zIndex: isFlipped ? 2 : 1,
                                }}
                            >
                                <ScaledCard scale={scale}>
                                    <div ref={backRef}>
                                        <IdCardBack model={model} />
                                    </div>
                                </ScaledCard>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
