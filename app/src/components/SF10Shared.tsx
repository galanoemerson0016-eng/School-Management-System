import React from 'react';

export interface BoundData {
    [key: string]: unknown;
}

export type AnyObject = Record<string, unknown>;

export const asString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
};

export interface SF10RendererProps {
    pageNumber: number;
    data: BoundData;
    onUpdate?: (path: string, value: string) => void;
}

export const AutoShrinkText: React.FC<{ text: string; minScale?: number; align?: 'left' | 'center' | 'right' }> = ({ text, minScale = 0.5, align = 'center' }) => {
    const [scale, setScale] = React.useState(1);
    const textRef = React.useRef<HTMLSpanElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        if (textRef.current && containerRef.current) {
            const textWidth = textRef.current.scrollWidth;
            const containerWidth = containerRef.current.clientWidth;
            if (textWidth > containerWidth && containerWidth > 0) {
                setScale(Math.max(minScale, containerWidth / textWidth));
            } else {
                setScale(1);
            }
        }
    }, [text, minScale]);

    const justifyClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
    const originX = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';

    return (
        <div ref={containerRef} className={`w-full h-full flex items-end ${justifyClass} overflow-hidden relative`}>
            <span
                ref={textRef}
                className="inline-block whitespace-nowrap"
                style={{
                    transform: `scaleX(${scale})`,
                    transformOrigin: `${originX} bottom`,
                }}
            >
                {text}
            </span>
        </div>
    );
};
