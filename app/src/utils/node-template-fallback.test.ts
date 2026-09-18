import { describe, expect, it } from 'vitest';
import { isZipTemplate, readNodeTemplateFallback } from './node-template-fallback';

describe('node template fallback', () => {
  it('loads a bundled template during Node-based tests without browser fs imports', async () => {
    const bytes = await readNodeTemplateFallback(
      ['G3 School Form 9 (SY 26-27).xlsx'],
      1000,
    );

    expect(isZipTemplate(bytes)).toBe(true);
  });

  it('returns null when no candidate template exists', async () => {
    const bytes = await readNodeTemplateFallback(['missing-template.xlsx'], 1000);
    expect(bytes).toBeNull();
  });
});
