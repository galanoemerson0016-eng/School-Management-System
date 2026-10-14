import { isEncryptedDatabaseEnvelope } from '../services/database';
import {
  exportDataEncryptionKey,
  generateDataEncryptionKey,
  getDataEncryptionKeyFingerprint,
  unwrapDataEncryptionKey,
  wrapDataEncryptionKey,
  type WrappedDataEncryptionKey,
} from './db-crypto';

/** Durable states for the v3.5.18 legacy password-key to DEK migration. */
export type EncryptionMigrationState =
  | 'migration_prepared'
  | 'migration_in_progress'
  | 'migration_verifying'
  | 'migrated'
  | 'migration_failed_recoverable';

export type EncryptionPreparationStage =
  | 'dek_generated'
  | 'password_wrapper_created'
  | 'recovery_protector_created';

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
  afterStage?: (stage: EncryptionMigrationState | EncryptionPreparationStage) => Promise<void> | void;
  /** Runs only after a complete IndexedDB bulk-write transaction for a store. */
  afterStore?: (storeName: string) => Promise<void> | void;
  /** Runs after a store is verified with the DEK and no legacy fallback. */
  afterVerificationStore?: (storeName: string) => Promise<void> | void;
}

/**
 * Builds and validates migration material before any IndexedDB record is
 * changed. A failure at any preparation boundary leaves legacy records and
 * durable migration metadata untouched.
 */
export async function prepareLegacyDekMigration(args: {
  passwordKek: CryptoKey;
  recoveryProtectorAvailable: boolean;
  protectRecoveryDek?: (rawDek: string) => Promise<boolean>;
  hooks?: MigrationHooks;
}): Promise<{ dek: CryptoKey; metadata: WrappedDekMetadata }> {
  const dek = await generateDataEncryptionKey();
  await args.hooks?.afterStage?.('dek_generated');

  const passwordWrappedDek = await wrapDataEncryptionKey(dek, args.passwordKek);
  await unwrapDataEncryptionKey(passwordWrappedDek, args.passwordKek);
  await args.hooks?.afterStage?.('password_wrapper_created');

  if (args.recoveryProtectorAvailable) {
    const protectedOk = await args.protectRecoveryDek?.(await exportDataEncryptionKey(dek));
    if (!protectedOk) throw new Error('Secure recovery protection could not be initialized.');
  }
  await args.hooks?.afterStage?.('recovery_protector_created');

  return {
    dek,
    metadata: {
      version: 1,
      encryptionSchemaVersion: 'dek-v1',
      state: 'migration_prepared',
      passwordWrappedDek,
      dekFingerprint: await getDataEncryptionKeyFingerprint(dek),
      recoveryProtector: args.recoveryProtectorAvailable ? 'electron-safe-storage-v1' : 'unavailable',
    },
  };
}

interface StoreSnapshot {
  count: number;
  identifiers: string[];
}

function identifierOf(storeName: string, record: unknown, index: number): string {
  const item = record as Record<string, unknown>;
  const key = storeName === 'students'
    ? (item?.lrn ?? item?.id)
    : storeName === 'schoolProfile'
      ? (item?.school_id ?? item?.id)
      : (item?.id ?? item?.lrn ?? item?.enrollment_id ?? item?.key ?? (item?.student_lrn ? `${item.student_lrn}_${item.subject_id || ''}_${item.quarter || ''}` : undefined));
  return String(key ?? `position:${index}`);
}

function snapshot(storeName: string, records: unknown[]): StoreSnapshot {
  return {
    count: records.length,
    identifiers: records.map((r, i) => identifierOf(storeName, r, i)).sort(),
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
    expected.set(storeName, snapshot(storeName, records));
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
  /** Additional known legacy keys used by older modes on this same profile. */
  legacyFallbackKeys?: CryptoKey[];
  dek: CryptoKey;
  metadata: WrappedDekMetadata;
  saveMetadata: (metadata: WrappedDekMetadata) => void;
  hooks?: MigrationHooks;
}): Promise<WrappedDekMetadata> {
  const { database, stores, legacyKey, dek, saveMetadata, hooks } = args;
  const legacyKeys = [legacyKey, ...(args.legacyFallbackKeys ?? []).filter(key => key !== legacyKey)];
  let metadata = args.metadata;

  if (metadata.state === 'migrated') {
    database.setDatabaseEncryptionKey(dek);
    return metadata;
  }

  // This is the recoverable checkpoint: either key can still open records.
  database.setDatabaseEncryptionKey(dek, legacyKeys, false);
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
      await hooks?.afterStore?.(storeName);
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
      const actual = snapshot(storeName, records);
      const before = expected.get(storeName)!;
      if (actual.count !== before.count || actual.identifiers.join('\u0000') !== before.identifiers.join('\u0000')) {
        // If before had records and actual has fewer readable records under DEK, key derivation or migration failed
        if (before.count > 0 && actual.count < before.count) {
          throw new Error(`Migration integrity check failed for ${storeName}: expected ${before.count}, verified ${actual.count} under DEK.`);
        }
        console.warn(`[Migration] Non-fatal record count difference in ${storeName}: expected ${before.count}, verified ${actual.count} under DEK.`);
      }
      await hooks?.afterVerificationStore?.(storeName);
    }

    await hooks?.afterStage?.('migrated');
    metadata = { ...metadata, state: 'migrated' };
    saveMetadata(metadata);
    return metadata;
  } catch (error) {
    // A failed verification remains explicitly recoverable on the next normal
    // login; it never falls through to a blank or replacement database.
    database.setDatabaseEncryptionKey(dek, legacyKeys, false);
    saveMetadata({ ...metadata, state: 'migration_failed_recoverable' });
    throw error;
  }
}
