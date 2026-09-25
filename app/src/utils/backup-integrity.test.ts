import { describe, expect, it } from 'vitest';
import { computeChecksum, embedChecksum, validateEmbeddedChecksum } from './backup-integrity';

describe('backup checksum coverage', () => {
  const sample = () => ({
    metadata: { version: '2.0.0-local' },
    payload: {
      students: [{ lrn: 'SYNTHETIC-001', first_name: 'Before' }],
      classRecords: [{ id: 'SYNTHETIC-GRADE', final_grade: 88 }],
    },
  });

  it('rejects changes to nested learner and grade values', async () => {
    const backup = await embedChecksum(sample());
    const changed = structuredClone(backup);
    changed.payload.students[0].first_name = 'After';
    changed.payload.classRecords[0].final_grade = 0;

    expect((await validateEmbeddedChecksum(backup)).valid).toBe(true);
    expect((await validateEmbeddedChecksum(changed)).valid).toBe(false);
  });

  it('canonicalizes nested object keys without changing array order', async () => {
    expect(await computeChecksum({ payload: { a: 1, b: 2 } }))
      .toBe(await computeChecksum({ payload: { b: 2, a: 1 } }));
    expect(await computeChecksum({ payload: [{ a: 1 }, { a: 2 }] }))
      .not.toBe(await computeChecksum({ payload: [{ a: 2 }, { a: 1 }] }));
  });

  it('recognizes old weak checksums without calling them strong', async () => {
    const old = sample() as ReturnType<typeof sample> & { _checksum?: string };
    const serialized = JSON.stringify(old, Object.keys(old).sort());
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
    old._checksum = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');

    expect(await validateEmbeddedChecksum(old)).toMatchObject({ valid: true, strength: 'legacy' });
    expect(await validateEmbeddedChecksum(await embedChecksum(sample())))
      .toMatchObject({ valid: true, strength: 'strong' });
  });
});
