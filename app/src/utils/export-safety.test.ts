import { describe, expect, it } from 'vitest';
import { escapeHtml } from './html-escape';
import { csvCell } from './csv-export';

describe('untrusted school records in generated documents', () => {
  it('renders names and injected tags as text', () => {
    const element = document.createElement('div');
    const input = 'Peña & <img src=x onerror=alert(1)> "Name"';
    element.innerHTML = escapeHtml(input);
    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toBe(input);
  });
  it('neutralizes spreadsheet formulas while preserving numbers and Unicode', () => {
    for (const text of ['=1+1', '+CMD', '@SUM(1)', '-1+2', '\t=1+1']) expect(csvCell(text).startsWith('"\'')).toBe(true);
    expect(csvCell(-2)).toBe('"-2"');
    expect(csvCell('Peña, "José"')).toBe('"Peña, ""José"""');
  });
});
