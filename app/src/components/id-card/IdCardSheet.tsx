/**
 * A single print sheet (A4/Letter) tiling multiple CR80 cards with dashed cut
 * guides — for guillotine/scissor cutting. One IdCardSheet === one PDF page.
 * Fronts and backs are emitted on separate sheets in matching grid positions so
 * a duplex stack lines up after cutting.
 */
import type { IdCardViewModel } from '../../services/id-card/idCardData';
import { IdCardFront } from './IdCardFront';
import { IdCardBack } from './IdCardBack';
import { PAPER_MM, type SheetPaper } from './sheetLayout';

interface Props {
    models: IdCardViewModel[];
    side: 'front' | 'back';
    paper: SheetPaper;
}

export function IdCardSheet({ models, side: _side, paper }: Props) {
    const { w, h } = PAPER_MM[paper];

    return (
        <div
            className="id-card-sheet"
            style={{
                width: `${w}mm`,
                height: `${h}mm`,
                boxSizing: 'border-box',
                padding: '0 8mm',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                printColorAdjust: 'exact',
                WebkitPrintColorAdjust: 'exact',
            }}
        >
            {models.map((model) => (
                <div
                    key={`fold-${model.lrn}`}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '53.98mm',
                        position: 'relative',
                    }}
                >
                    {/* Front Side */}
                    <div style={{ width: '53.98mm', height: '85.6mm', outline: '0.18mm dashed #94a3b8', outlineOffset: '0.8mm', zIndex: 2 }}>
                        <IdCardFront model={model} />
                    </div>
                    
                    {/* Crease/Fold Guide */}
                    <div style={{ 
                        width: '100%', 
                        height: 'calc(4mm - 7pt)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <div style={{ width: '120%', borderTop: '0.25mm dashed #f43f5e' }} />
                    </div>

                    {/* Back Side (Rotated 180 deg) */}
                    <div style={{ 
                        width: '53.98mm', 
                        height: '85.6mm', 
                        outline: '0.18mm dashed #94a3b8', 
                        outlineOffset: '0.8mm',
                        transform: 'rotate(180deg)',
                        WebkitTransform: 'rotate(180deg)',
                        transformOrigin: 'center',
                        zIndex: 2
                    }}>
                        <IdCardBack model={model} />
                    </div>
                </div>
            ))}
        </div>
    );
}
