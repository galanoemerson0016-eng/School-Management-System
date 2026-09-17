import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { useTableCrosshair } from '../hooks/useTableCrosshair';

describe('Table Crosshair Highlighter (useTableCrosshair)', () => {
    const TEST_STORAGE_KEY = 'test_crosshair_storage_key';

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('initializes with enabled state defaulted to true if localStorage is empty', () => {
        const { result } = renderHook(() => useTableCrosshair({ storageKey: TEST_STORAGE_KEY }));
        expect(result.current.isCrosshairEnabled).toBe(true);
    });

    it('initializes with saved state from localStorage', () => {
        localStorage.setItem(TEST_STORAGE_KEY, 'false');
        const { result } = renderHook(() => useTableCrosshair({ storageKey: TEST_STORAGE_KEY }));
        expect(result.current.isCrosshairEnabled).toBe(false);
    });

    it('toggles crosshair state and updates localStorage accordingly', () => {
        const { result } = renderHook(() => useTableCrosshair({ storageKey: TEST_STORAGE_KEY }));
        expect(result.current.isCrosshairEnabled).toBe(true);

        act(() => {
            result.current.toggleCrosshair();
        });
        expect(result.current.isCrosshairEnabled).toBe(false);
        expect(localStorage.getItem(TEST_STORAGE_KEY)).toBe('false');

        act(() => {
            result.current.toggleCrosshair();
        });
        expect(result.current.isCrosshairEnabled).toBe(true);
        expect(localStorage.getItem(TEST_STORAGE_KEY)).toBe('true');
    });

    describe('DOM Event Delegation & Crosshair Highlights', () => {
        const TestTable = () => {
            const { containerRef, isCrosshairEnabled, toggleCrosshair } = useTableCrosshair({ storageKey: TEST_STORAGE_KEY });
            return (
                <div ref={containerRef} className="eclass-zoom-shell" data-testid="table-container">
                    <button data-testid="toggle-btn" onClick={toggleCrosshair}>
                        {isCrosshairEnabled ? 'Disable' : 'Enable'}
                    </button>
                    <table className="crosshair-table">
                        <thead>
                            <tr>
                                <th data-col-key="col-num">No.</th>
                                <th data-col-key="col-name">LEARNER'S NAME</th>
                                <th data-col-key="ww-1">WW 1</th>
                                <th data-col-key="ww-2">WW 2</th>
                                <th data-col-key="pt-1">PT 1</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="grade-row" data-row-key="learner-1">
                                <td data-col-key="col-num">1</td>
                                <td data-col-key="col-name" className="student-name-cell">DELA CRUZ, JUAN</td>
                                <td data-col-key="ww-1"><input type="number" defaultValue="10" /></td>
                                <td data-col-key="ww-2"><input type="number" defaultValue="15" /></td>
                                <td data-col-key="pt-1"><input type="number" defaultValue="20" /></td>
                            </tr>
                            <tr className="grade-row" data-row-key="learner-2">
                                <td data-col-key="col-num">2</td>
                                <td data-col-key="col-name" className="student-name-cell">SANTOS, MARIA</td>
                                <td data-col-key="ww-1"><input type="number" defaultValue="9" /></td>
                                <td data-col-key="ww-2"><input type="number" defaultValue="14" /></td>
                                <td data-col-key="pt-1"><input type="number" defaultValue="18" /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            );
        };

        it('highlights row and column when hovering over a cell', () => {
            const { getByTestId } = render(<TestTable />);
            const shell = getByTestId('table-container');

            // Trigger mouseover on Dela Cruz's WW 1 cell input
            const row1 = shell.querySelector('tr[data-row-key="learner-1"]') as HTMLTableRowElement;
            const row2 = shell.querySelector('tr[data-row-key="learner-2"]') as HTMLTableRowElement;
            const ww1Header = shell.querySelector('th[data-col-key="ww-1"]') as HTMLTableCellElement;
            const ww1Cell1 = row1.querySelector('td[data-col-key="ww-1"]') as HTMLTableCellElement;
            const ww1Cell2 = row2.querySelector('td[data-col-key="ww-1"]') as HTMLTableCellElement;
            const ww2Cell1 = row1.querySelector('td[data-col-key="ww-2"]') as HTMLTableCellElement;

            const input = ww1Cell1.querySelector('input')!;
            input.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

            // Row 1 should be active, Row 2 should not
            expect(row1.classList.contains('crosshair-row-active')).toBe(true);
            expect(row2.classList.contains('crosshair-row-active')).toBe(false);

            // WW 1 header and cells should have column active classes
            expect(ww1Header.classList.contains('crosshair-th-active')).toBe(true);
            expect(ww1Cell1.classList.contains('crosshair-col-active')).toBe(true);
            expect(ww1Cell2.classList.contains('crosshair-col-active')).toBe(true);

            // Other column should not be highlighted
            expect(ww2Cell1.classList.contains('crosshair-col-active')).toBe(false);
        });

        it('switches row and column highlight seamlessly when moving to another cell', () => {
            const { getByTestId } = render(<TestTable />);
            const shell = getByTestId('table-container');

            const row1 = shell.querySelector('tr[data-row-key="learner-1"]') as HTMLTableRowElement;
            const row2 = shell.querySelector('tr[data-row-key="learner-2"]') as HTMLTableRowElement;
            const ww1Header = shell.querySelector('th[data-col-key="ww-1"]') as HTMLTableCellElement;
            const pt1Header = shell.querySelector('th[data-col-key="pt-1"]') as HTMLTableCellElement;

            // Hover on row 1, col ww-1
            const cellRow1Ww1 = row1.querySelector('td[data-col-key="ww-1"]')!;
            cellRow1Ww1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

            expect(row1.classList.contains('crosshair-row-active')).toBe(true);
            expect(ww1Header.classList.contains('crosshair-th-active')).toBe(true);

            // Move hover to row 2, col pt-1
            const cellRow2Pt1 = row2.querySelector('td[data-col-key="pt-1"]')!;
            cellRow2Pt1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

            // Previous highlights removed
            expect(row1.classList.contains('crosshair-row-active')).toBe(false);
            expect(ww1Header.classList.contains('crosshair-th-active')).toBe(false);

            // New highlights applied
            expect(row2.classList.contains('crosshair-row-active')).toBe(true);
            expect(pt1Header.classList.contains('crosshair-th-active')).toBe(true);
        });

        it('clears highlights when mouse leaves the container and no element is focused', () => {
            const { getByTestId } = render(<TestTable />);
            const shell = getByTestId('table-container');

            const row1 = shell.querySelector('tr[data-row-key="learner-1"]') as HTMLTableRowElement;
            const ww1Header = shell.querySelector('th[data-col-key="ww-1"]') as HTMLTableCellElement;
            const cellRow1Ww1 = row1.querySelector('td[data-col-key="ww-1"]')!;

            cellRow1Ww1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            expect(row1.classList.contains('crosshair-row-active')).toBe(true);
            expect(ww1Header.classList.contains('crosshair-th-active')).toBe(true);

            shell.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            expect(row1.classList.contains('crosshair-row-active')).toBe(false);
            expect(ww1Header.classList.contains('crosshair-th-active')).toBe(false);
        });

        it('supports keyboard navigation via focusin and focusout', () => {
            const { getByTestId } = render(<TestTable />);
            const shell = getByTestId('table-container');

            const row2 = shell.querySelector('tr[data-row-key="learner-2"]') as HTMLTableRowElement;
            const ww2Header = shell.querySelector('th[data-col-key="ww-2"]') as HTMLTableCellElement;
            const inputRow2Ww2 = row2.querySelector('td[data-col-key="ww-2"] input')!;

            // Tab into input
            inputRow2Ww2.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            expect(row2.classList.contains('crosshair-row-active')).toBe(true);
            expect(ww2Header.classList.contains('crosshair-th-active')).toBe(true);

            // Tab out of table
            shell.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
            expect(row2.classList.contains('crosshair-row-active')).toBe(false);
            expect(ww2Header.classList.contains('crosshair-th-active')).toBe(false);
        });

        it('enforces Focus Authority: moves single crosshair to next row on Enter/Arrow and ignores stationary mouse', () => {
            const { getByTestId } = render(<TestTable />);
            const shell = getByTestId('table-container');

            const row1 = shell.querySelector('tr[data-row-key="learner-1"]') as HTMLTableRowElement;
            const row2 = shell.querySelector('tr[data-row-key="learner-2"]') as HTMLTableRowElement;
            const inputRow1 = row1.querySelector('td[data-col-key="ww-1"] input') as HTMLInputElement;
            const inputRow2 = row2.querySelector('td[data-col-key="ww-1"] input') as HTMLInputElement;

            // 1. User clicks into Row 1 input (mouse position at 100, 100)
            inputRow1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 100, clientY: 100 }));
            inputRow1.focus();
            inputRow1.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

            expect(row1.classList.contains('crosshair-row-active')).toBe(true);
            expect(row2.classList.contains('crosshair-row-active')).toBe(false);

            // 2. User presses Enter, focus moves to Row 2 input
            inputRow2.focus();
            inputRow2.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

            // Row 1 highlight is extinguished, ONLY Row 2 is active
            expect(row1.classList.contains('crosshair-row-active')).toBe(false);
            expect(row2.classList.contains('crosshair-row-active')).toBe(true);

            // 3. Stationary mouse over Row 1 sends a synthetic mouseover event (e.g. table scroll under mouse)
            inputRow1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 100, clientY: 100 }));

            // Row 2 remains the SOLE active row; stationary mouse did not steal or duplicate highlight
            expect(row1.classList.contains('crosshair-row-active')).toBe(false);
            expect(row2.classList.contains('crosshair-row-active')).toBe(true);
        });

        it('does not apply highlights when crosshair is toggled off', () => {
            const { getByTestId } = render(<TestTable />);
            const shell = getByTestId('table-container');
            const toggleBtn = getByTestId('toggle-btn');

            // Turn off via toggle button
            act(() => {
                toggleBtn.click();
            });

            const row1 = shell.querySelector('tr[data-row-key="learner-1"]') as HTMLTableRowElement;
            const ww1Header = shell.querySelector('th[data-col-key="ww-1"]') as HTMLTableCellElement;
            const cellRow1Ww1 = row1.querySelector('td[data-col-key="ww-1"]')!;

            cellRow1Ww1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            expect(row1.classList.contains('crosshair-row-active')).toBe(false);
            expect(ww1Header.classList.contains('crosshair-th-active')).toBe(false);
        });
    });
});
