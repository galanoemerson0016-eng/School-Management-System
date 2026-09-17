import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'formease_table_crosshair_enabled';

export interface UseTableCrosshairOptions {
    enabled?: boolean;
    storageKey?: string;
}

export function useTableCrosshair(options: UseTableCrosshairOptions = {}) {
    const { storageKey = STORAGE_KEY } = options;

    const [isEnabled, setIsEnabled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        try {
            const saved = localStorage.getItem(storageKey);
            return saved !== null ? saved === 'true' : true;
        } catch {
            return true;
        }
    });

    const containerRef = useRef<HTMLDivElement | null>(null);
    const activeColKeyRef = useRef<string | null>(null);
    const activeRowKeyRef = useRef<string | null>(null);

    const toggleCrosshair = useCallback(() => {
        setIsEnabled((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(storageKey, String(next));
            } catch {
                // ignore
            }
            return next;
        });
    }, [storageKey]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const clearHighlights = () => {
            activeColKeyRef.current = null;
            activeRowKeyRef.current = null;
            const highlightedCols = container.querySelectorAll('.crosshair-col-active, .crosshair-th-active');
            highlightedCols.forEach((el) => el.classList.remove('crosshair-col-active', 'crosshair-th-active'));
            const highlightedRows = container.querySelectorAll('.crosshair-row-active');
            highlightedRows.forEach((el) => el.classList.remove('crosshair-row-active'));
        };

        if (!isEnabled) {
            clearHighlights();
            return;
        }

        const lastPointerPosRef = { current: null as { x: number; y: number } | null };

        const applyHighlights = (target: HTMLElement) => {
            // 1. Column Highlighting
            const cellWithCol = target.closest<HTMLElement>('[data-col-key]');
            const newColKey = cellWithCol?.getAttribute('data-col-key') || null;

            if (newColKey !== activeColKeyRef.current) {
                // Remove previous col highlights
                if (activeColKeyRef.current) {
                    const oldCols = container.querySelectorAll('.crosshair-col-active, .crosshair-th-active');
                    oldCols.forEach((el) => el.classList.remove('crosshair-col-active', 'crosshair-th-active'));
                }

                activeColKeyRef.current = newColKey;

                if (newColKey) {
                    // Find all matching cells in this container
                    const matchingCells = container.querySelectorAll<HTMLElement>(`[data-col-key="${CSS.escape(newColKey)}"]`);
                    matchingCells.forEach((el) => {
                        if (el.tagName.toLowerCase() === 'th') {
                            el.classList.add('crosshair-th-active');
                        } else {
                            el.classList.add('crosshair-col-active');
                        }
                    });
                }
            }

            // 2. Row Highlighting
            const tr = target.closest<HTMLTableRowElement>('tr.grade-row');
            const newRowKey = tr?.getAttribute('data-row-key') || (tr ? 'row' : null);

            if (newRowKey !== activeRowKeyRef.current) {
                if (activeRowKeyRef.current) {
                    const oldRows = container.querySelectorAll('.crosshair-row-active');
                    oldRows.forEach((el) => el.classList.remove('crosshair-row-active'));
                }

                activeRowKeyRef.current = newRowKey;

                if (tr) {
                    tr.classList.add('crosshair-row-active');
                }
            }
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // Check if user is actively focused on an input inside the table
            const activeEl = document.activeElement as HTMLElement | null;
            const isInputFocused = activeEl && container.contains(activeEl) && (activeEl.tagName === 'INPUT' || activeEl.isContentEditable);

            if (isInputFocused) {
                // If an input is focused, only update hover if mouse physically moved (not stationary / scroll event)
                const lastPos = lastPointerPosRef.current;
                const hasMoved = lastPos && (Math.abs(e.clientX - lastPos.x) > 3 || Math.abs(e.clientY - lastPos.y) > 3);
                lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

                if (!hasMoved) {
                    // Ignore stationary mouse or scroll synthetic mouseover
                    return;
                }
            } else {
                lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
            }

            applyHighlights(target);
        };

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            applyHighlights(target);
        };

        const handleMouseLeave = () => {
            // If an element inside container currently has focus, keep crosshair locked on it!
            const activeEl = document.activeElement as HTMLElement | null;
            if (activeEl && container.contains(activeEl)) {
                applyHighlights(activeEl);
            } else {
                clearHighlights();
            }
        };

        const handleFocusOut = (e: FocusEvent) => {
            // If focus moved outside container
            const nextTarget = e.relatedTarget as HTMLElement | null;
            if (!nextTarget || !container.contains(nextTarget)) {
                clearHighlights();
            }
        };

        container.addEventListener('mouseover', handleMouseOver);
        container.addEventListener('focusin', handleFocusIn);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.addEventListener('focusout', handleFocusOut);

        return () => {
            container.removeEventListener('mouseover', handleMouseOver);
            container.removeEventListener('focusin', handleFocusIn);
            container.removeEventListener('mouseleave', handleMouseLeave);
            container.removeEventListener('focusout', handleFocusOut);
            clearHighlights();
        };
    }, [isEnabled]);

    return {
        containerRef,
        isCrosshairEnabled: isEnabled,
        toggleCrosshair,
    };
}
