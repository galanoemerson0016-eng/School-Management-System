import { describe, expect, it } from 'vitest';
import { deriveDbKey, decryptPayload, encryptPayload, generateDataEncryptionKey, wrapDataEncryptionKey } from './db-crypto';
import { migrateLegacyEncryptedDatabase, type WrappedDekMetadata } from './encryption-migration';

class SyntheticEncryptedDatabase {
  private primary: CryptoKey | null = null;
  private fallback: CryptoKey[] = [];
  private records = new Map<string, unknown[]>();

  constructor(seed: Record<string, unknown[]>) {
    Object.entries(seed).forEach(([store, values]) => this.records.set(store, values));
  }

  setDatabaseEncryptionKey(key: CryptoKey | null, fallbackKeys: CryptoKey[] = []): void {
    this.primary = key;
    this.fallback = fallbackKeys;
  }

  async getAllRecords<T>(store: string): Promise<T[]> {
    return Promise.all((this.records.get(store) || []).map(async (record) => {
      if (!(record as { is_encrypted?: boolean }).is_encrypted) return record as T;
      for (const key of [this.primary, ...this.fallback]) {
        if (!key) continue;
        try {
          const envelope = record as { ciphertext: string; iv: string };
          return await decryptPayload<T>(envelope.ciphertext, envelope.iv, key);
        } catch { /* try the next key */ }
      }
      return record as T;
    }));
  }

  async putRecordsBulk<T>(store: string, values: T[]): Promise<void> {
    if (!this.primary) throw new Error('No primary key');
    this.records.set(store, await Promise.all(values.map(async value => {
      const encrypted = await encryptPayload(value, this.primary!);
      const id = (value as Record<string, unknown>).id;
      const lrn = (value as Record<string, unknown>).lrn;
      return { ...encrypted, is_encrypted: true, ...(id ? { id } : {}), ...(lrn ? { lrn } : {}) };
    })));
  }

  raw(store: string): unknown[] { return this.records.get(store) || []; }
}

async function fixture() {
  const salt = new Uint8Array(32).fill(9);
  const legacyKey = await deriveDbKey('old password', salt);
  const dek = await generateDataEncryptionKey();
  const wrapped = await wrapDataEncryptionKey(dek, await deriveDbKey('old password', salt));
  const seeded: Record<string, unknown[]> = {
    students: [],
    classRecords: [],
    enrollments: [],
  };
  for (const [store, values] of Object.entries({
    students: [{ lrn: '1001', first_name: 'Synthetic' }],
    classRecords: [{ id: 'record-1', student_lrn: '1001', score: 85 }],
    enrollments: [{ id: 'enrollment-1', student_lrn: '1001' }],
  })) {
    seeded[store] = await Promise.all(values.map(async value => {
      const encrypted = await encryptPayload(value, legacyKey);
      const item = value as Record<string, unknown>;
      return { ...encrypted, is_encrypted: true, ...(item.lrn ? { lrn: item.lrn } : {}), ...(item.id ? { id: item.id } : {}) };
    }));
  }
  const metadata: WrappedDekMetadata = {
    version: 1, encryptionSchemaVersion: 'dek-v1', state: 'migration_prepared',
    passwordWrappedDek: wrapped, dekFingerprint: 'test-fingerprint', recoveryProtector: 'electron-safe-storage-v1',
  };
  return { database: new SyntheticEncryptedDatabase(seeded), legacyKey, dek, metadata };
}

describe('interruption-safe legacy encryption migration', () => {
  it('migrates every store and verifies it with the DEK alone', async () => {
    const { database, legacyKey, dek, metadata } = await fixture();
    let durable = metadata;
    const result = await migrateLegacyEncryptedDatabase({
      database, stores: ['students', 'classRecords', 'enrollments'], legacyKey, dek, metadata,
      saveMetadata: value => { durable = value; },
    });
    expect(result.state).toBe('migrated');
    expect(durable.state).toBe('migrated');
    expect(await database.getAllRecords('students')).toEqual([{ lrn: '1001', first_name: 'Synthetic' }]);
    expect(database.raw('students')).not.toEqual([]);
  });

  it.each(['migration_prepared', 'migration_in_progress', 'migration_verifying', 'migrated'] as const)(
    'recovers deterministically after interruption at %s', async (stage) => {
      const { database, legacyKey, dek, metadata } = await fixture();
      let durable = metadata;
      await expect(migrateLegacyEncryptedDatabase({
        database, stores: ['students', 'classRecords', 'enrollments'], legacyKey, dek, metadata,
        saveMetadata: value => { durable = value; },
        hooks: { afterStage: value => { if (value === stage) throw new Error('injected interruption'); } },
      })).rejects.toThrow('injected interruption');
      // An interruption immediately after the prepared checkpoint has no
      // catch/finally opportunity, so that durable state remains prepared.
      expect(durable.state).toBe(stage === 'migration_prepared' ? 'migration_prepared' : 'migration_failed_recoverable');
      const resumed = await migrateLegacyEncryptedDatabase({
        database, stores: ['students', 'classRecords', 'enrollments'], legacyKey, dek, metadata: durable,
        saveMetadata: value => { durable = value; },
      });
      expect(resumed.state).toBe('migrated');
      expect(await database.getAllRecords('enrollments')).toEqual([{ id: 'enrollment-1', student_lrn: '1001' }]);
    },
  );
});
