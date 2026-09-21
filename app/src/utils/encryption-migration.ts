import { isEncryptedDatabaseEnvelope } from '../services/database';
import type { WrappedDataEncryptionKey } from './db-crypto';

/** Durable states for the v3.5.18 legacy password-key to DEK migration. */
export type EncryptionMigrationState =
  | 'migration_prepared'
  | 'migration_in_progress'
  | 'migration_verifying'
  | 'migrated'
  | 'migration_failed_recoverable';

export interface WrappedDekMetadata {
  version: 1;
  encryptionSchemaVersion: 'dek-v1';
  state: EncryptionMigrationState;
  passwordWrappedDek: WrappedDataEncryptionKey;
  /** A non-secret SHA-256 fingerprint, used only to detect mismatched recovery material. */
  dekFingerprint: string;
  recoveryProtector: 'electron-safe-storage-v1' | 'unavailable';
}

export interface MigrationDatabase {
  setDatabaseEncryptionKey(key: CryptoKey | null, fallbackKeys?: CryptoKey[], runIndexingMigration?: boolean): void;
  getAllRecords<T>(storeName: string): Promise<T[]>;
  putRecordsBulk<T>(storeName: string, records: T[]): Promise<void>;
}

export interface MigrationHooks {
  /** Test-only fault injection hook. It is never provided by production code. */
  afterStage?: (stage: EncryptionMigrationState) => Promise<void> | void;
}

interface StoreSnapshot {
  count: number;
  identifiers: string[];
}

function identifierOf(record: unknown, index: number): string {
  const item = record as Record<string, unknown>;
  // All encrypted production stores use either id or lrn as their primary key.
  // The positional fallback preserves verification for legacy malformed test data.
  return String(item?.lrn ?? item?.id ?? `position:${index}`);
}

function snapshot(records: unknown[]): StoreSnapshot {
  return {
    count: records.length,
    identifiers: records.map(identifierOf).sort(),
  };
}

function assertReadable(storeName: string, records: unknown[]): void {
  if (records.some(isEncryptedDatabaseEnvelope)) {
    throw new Error(`Encrypted ${storeName} record could not be decrypted.`);
  }
}

async function readAndSnapshot(
  database: MigrationDatabase,
  stores: readonly string[],
): Promise<Map<string, StoreSnapshot>> {
  const expected = new Map<string, StoreSnapshot>();
  for (const storeName of stores) {
    const records = await database.getAllRecords<unknown>(storeName);
    assertReadable(storeName, records);
    expected.set(storeName, snapshot(records));
  }
  return expected;
}

/**
 * Re-encrypt every encrypted store in place while accepting both keys until
 * all records have been proven readable under the DEK alone. Re-running this
 * operation is safe: records already using the DEK decrypt with the primary
 * key; remaining legacy records decrypt with the in-memory fallback key.
 */
export async function migrateLegacyEncryptedDatabase(args: {
  database: MigrationDatabase;
  stores: readonly string[];
  legacyKey: CryptoKey;
  dek: CryptoKey;
  metadata: WrappedDekMetadata;
  saveMetadata: (metadata: WrappedDekMetadata) => void;
  hooks?: MigrationHooks;
}): Promise<WrappedDekMetadata> {
  const { database, stores, legacyKey, dek, saveMetadata, hooks } = args;
  let metadata = args.metadata;

  if (metadata.state === 'migrated') {
    database.setDatabaseEncryptionKey(dek);
    return metadata;
  }

  // This is the recoverable checkpoint: either key can still open records.
  database.setDatabaseEncryptionKey(dek, [legacyKey], false);
  metadata = { ...metadata, state: 'migration_prepared' };
  saveMetadata(metadata);
  await hooks?.afterStage?.('migration_prepared');

  try {
    metadata = { ...metadata, state: 'migration_in_progress' };
    saveMetadata(metadata);
    await hooks?.afterStage?.('migration_in_progress');

    const expected = await readAndSnapshot(database, stores);
    for (const storeName of stores) {
      const records = await database.getAllRecords<unknown>(storeName);
      assertReadable(storeName, records);
      // A bulk put is intentionally a no-op for an empty store. This preserves
      // a valid empty store without deleting or fabricating records.
      await database.putRecordsBulk(storeName, records);
    }

    metadata = { ...metadata, state: 'migration_verifying' };
    saveMetadata(metadata);
    await hooks?.afterStage?.('migration_verifying');

    // Verification must not have the legacy fallback. Otherwise a partly
    // migrated store could be falsely marked complete.
    database.setDatabaseEncryptionKey(dek, [], false);
    for (const storeName of stores) {
      const records = await database.getAllRecords<unknown>(storeName);
      assertReadable(storeName, records);
      const actual = snapshot(records);
      const before = expected.get(storeName)!;
      if (actual.count !== before.count || actual.identifiers.join('\u0000') !== before.identifiers.join('\u0000')) {
        throw new Error(`Migration integrity check failed for ${storeName}.`);
      }
    }

    await hooks?.afterStage?.('migrated');
    metadata = { ...metadata, state: 'migrated' };
    saveMetadata(metadata);
    return metadata;
  } catch (error) {
    // A failed verification remains explicitly recoverable on the next normal
    // login; it never falls through to a blank or replacement database.
    database.setDatabaseEncryptionKey(dek, [legacyKey], false);
    saveMetadata({ ...metadata, state: 'migration_failed_recoverable' });
    throw error;
  }
}
