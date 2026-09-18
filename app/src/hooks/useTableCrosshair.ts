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

    const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
    const activeColKeyRef = useRef<string | null>(null);
    const activeRowKeyRef = useRef<string | null>(null);

    const containerRef = useCallback((node: HTMLDivElement | null) => {
        setContainerEl(node);
    }, []);

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

    const clearHighlights = useCallback(() => {
        activeColKeyRef.current = null;
        activeRowKeyRef.current = null;
        if (!containerEl) return;
        const highlightedCols = containerEl.querySelectorAll('.crosshair-col-active, .crosshair-th-active');
        highlightedCols.forEach((el) => el.classList.remove('crosshair-col-active', 'crosshair-th-active'));
        const highlightedRows = containerEl.querySelectorAll('.crosshair-row-active');
        highlightedRows.forEach((el) => el.classList.remove('crosshair-row-active'));
    }, [containerEl]);

    useEffect(() => {
        if (!containerEl) return;
        const container = containerEl;
        if (!container) return;

        if (!isEnabled) {
            clearHighlights();
            return;
        }

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
            } else if (newColKey) {
                // Check if React re-render stripped class on active columns
                const matchingCells = container.querySelectorAll<HTMLElement>(`[data-col-key="${CSS.escape(newColKey)}"]`);
                matchingCells.forEach((el) => {
                    const cls = el.tagName.toLowerCase() === 'th' ? 'crosshair-th-active' : 'crosshair-col-active';
                    if (!el.classList.contains(cls)) {
                        el.classList.add(cls);
                    }
                });
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
            } else if (tr && !tr.classList.contains('crosshair-row-active')) {
                // Row key unchanged, but class stripped by React re-render
                tr.classList.add('crosshair-row-active');
            }
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // Check if user is actively focused on an input inside the table
            const activeEl = document.activeElement as HTMLElement | null;
            const isInputFocused = activeEl && container.contains(activeEl) && (activeEl.tagName === 'INPUT' || activeEl.isContentEditable);

            if (isInputFocused) {
                // Strict Focus Authority: while typing into a cell, mouse hovering other rows must NOT steal highlight
                const cellWithCol = target.closest<HTMLElement>('[data-col-key]');
                const activeCell = activeEl.closest<HTMLElement>('[data-col-key]');
                if (cellWithCol !== activeCell) {
                    return;
                }
            }

            applyHighlights(target);
        };

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            applyHighlights(target);
        };

        const handleInput = (e: Event) => {
            const target = e.target as HTMLElement | null;
            if (target && container.contains(target)) {
                applyHighlights(target);
            }
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
        container.addEventListener('input', handleInput);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.addEventListener('focusout', handleFocusOut);

        // If an element is already focused upon mount/update, highlight it immediately
        const currentActive = document.activeElement as HTMLElement | null;
        if (currentActive && container.contains(currentActive)) {
            applyHighlights(currentActive);
        }

        return () => {
            container.removeEventListener('mouseover', handleMouseOver);
            container.removeEventListener('focusin', handleFocusIn);
            container.removeEventListener('input', handleInput);
            container.removeEventListener('mouseleave', handleMouseLeave);
            container.removeEventListener('focusout', handleFocusOut);
            clearHighlights();
        };
    }, [isEnabled, containerEl, clearHighlights]);

    return {
        containerRef,
        isCrosshairEnabled: isEnabled,
        toggleCrosshair,
        clearHighlights,
    };
}
