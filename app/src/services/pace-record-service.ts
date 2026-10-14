import type { PaceFormData } from '../types/pace';

export type PaceFormSubject = 'reading' | 'language' | 'math' | 'gmrc-makabansa';

export const PACE_SUBJECTS: readonly PaceFormSubject[] = ['reading', 'language', 'math', 'gmrc-makabansa'] as const;

export interface PaceUnresolvedEntry {
  lrn: string;
  legacyKey: string;
  rawEntry: unknown;
  reason: string;
  foundAt: string;
}

export interface PaceStorageEnvelopeV2 {
  version: 2;
  records: Record<string, PaceFormData>; // composite key: `${schoolYear}::${lrn}`
  unresolved: Record<string, PaceUnresolvedEntry>; // key: `${legacyKey}::${lrn}`
  migratedAt?: string;
  updatedAt?: string;
}

export interface MigrationSummary {
  migratedCounts: Record<PaceFormSubject, number>;
  unresolvedCounts: Record<PaceFormSubject, number>;
}

export function isValidSchoolYear(sy: unknown): boolean {
  if (typeof sy !== 'string') return false;
  const trimmed = sy.trim();
  return /^\d{4}\s*-\s*\d{4}$/.test(trimmed);
}

export function normalizeSchoolYear(sy: string): string {
  return sy.trim().replace(/\s*-\s*/, '-');
}

export function makePaceRecordKey(schoolYear: string, lrn: string): string {
  return `${normalizeSchoolYear(schoolYear)}::${lrn.trim()}`;
}

export function parsePaceRecordKey(key: string): { schoolYear: string; lrn: string } | null {
  const parts = key.split('::');
  if (parts.length !== 2) return null;
  return { schoolYear: parts[0], lrn: parts[1] };
}

export function getPaceStorageKeyV2(subject: PaceFormSubject): string {
  const normalized = subject === 'gmrc-makabansa' ? 'gmrc_makabansa' : subject;
  return `formease_pace_v2_${normalized}_ratings`;
}

export function getLegacyPaceKeys(subject: PaceFormSubject): string[] {
  switch (subject) {
    case 'reading':
      return ['formease_pace_reading_ratings', 'formease_pace_ratings'];
    case 'language':
      return ['formease_pace_language_ratings'];
    case 'math':
      return ['formease_pace_math_ratings'];
    case 'gmrc-makabansa':
      return [
        'formease_pace_gmrc_makabansa_ratings',
        'formease_pace_gmrc_ratings',
        'formease_pace_makabansa_ratings',
      ];
  }
}

/**
 * Initializes or reads the versioned PACE storage envelope for a subject.
 * If the v2 envelope does not exist, it runs an idempotent migration from legacy stores,
 * preserving legacy maps as migration evidence without mutating or destroying them.
 */
export function loadPaceEnvelope(subject: PaceFormSubject): PaceStorageEnvelopeV2 {
  if (typeof localStorage === 'undefined') {
    return { version: 2, records: {}, unresolved: {} };
  }

  const v2Key = getPaceStorageKeyV2(subject);
  const rawV2 = localStorage.getItem(v2Key);

  if (rawV2) {
    try {
      const parsed = JSON.parse(rawV2);
      if (parsed && parsed.version === 2 && typeof parsed.records === 'object') {
        return parsed as PaceStorageEnvelopeV2;
      }
    } catch {
      // Corrupt v2 envelope: fall through to re-migrate from preserved legacy sources
    }
  }

  return migrateLegacyPaceSubject(subject);
}

/**
 * Persists the versioned envelope to localStorage.
 */
export function persistPaceEnvelope(subject: PaceFormSubject, envelope: PaceStorageEnvelopeV2): void {
  if (typeof localStorage === 'undefined') return;
  const v2Key = getPaceStorageKeyV2(subject);
  envelope.updatedAt = new Date().toISOString();
  localStorage.setItem(v2Key, JSON.stringify(envelope));
}

/**
 * Migrates legacy PACE stores for a subject into a versioned v2 envelope.
 * In accordance with Phase 2 requirements:
 * 1. Legacy source maps are preserved unchanged as migration evidence.
 * 2. Valid school years are used to key records by (schoolYear, lrn).
 * 3. Records with missing, blank, or invalid school years are quarantined into the unresolved set.
 */
export function migrateLegacyPaceSubject(subject: PaceFormSubject): PaceStorageEnvelopeV2 {
  const envelope: PaceStorageEnvelopeV2 = {
    version: 2,
    records: {},
    unresolved: {},
    migratedAt: new Date().toISOString(),
  };

  if (typeof localStorage === 'undefined') return envelope;

  const legacyKeys = getLegacyPaceKeys(subject);

  for (const legacyKey of legacyKeys) {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) continue;

    let parsedStore: Record<string, unknown>;
    try {
      parsedStore = JSON.parse(raw);
      if (!parsedStore || typeof parsedStore !== 'object' || Array.isArray(parsedStore)) {
        continue;
      }
    } catch {
      continue;
    }

    for (const [rawLrn, rawEntry] of Object.entries(parsedStore)) {
      const lrn = rawLrn.trim();
      if (!lrn || !rawEntry || typeof rawEntry !== 'object') continue;

      const candidate = rawEntry as Partial<PaceFormData>;
      const syCandidate = candidate.schoolYear;

      if (isValidSchoolYear(syCandidate)) {
        const normSy = normalizeSchoolYear(syCandidate!);
        const recKey = makePaceRecordKey(normSy, lrn);

        if (!envelope.records[recKey]) {
          envelope.records[recKey] = {
            lrn,
            studentName: candidate.studentName || '',
            gradeLevel: candidate.gradeLevel || 'Grade 1',
            section: candidate.section || '',
            schoolYear: normSy,
            teacherName: candidate.teacherName || '',
            ratings: (candidate.ratings && typeof candidate.ratings === 'object') ? candidate.ratings : {},
          };
        } else {
          // Merge ratings if another legacy key had complementary data (e.g. gmrc + makabansa)
          envelope.records[recKey].ratings = {
            ...envelope.records[recKey].ratings,
            ...(candidate.ratings || {}),
          };
        }
      } else {
        // Missing, blank, or malformed school year: quarantine into unresolved set
        const unresKey = `${legacyKey}::${lrn}`;
        if (!envelope.unresolved[unresKey]) {
          envelope.unresolved[unresKey] = {
            lrn,
            legacyKey,
            rawEntry,
            reason: syCandidate ? `Malformed school year: "${syCandidate}"` : 'Missing school year in legacy record',
            foundAt: new Date().toISOString(),
          };
        }
      }
    }
  }

  persistPaceEnvelope(subject, envelope);
  return envelope;
}

/**
 * Migrates all subjects and sets the version indicator.
 */
export function migrateAllPaceStores(force = false): MigrationSummary {
  const summary: MigrationSummary = {
    migratedCounts: { reading: 0, language: 0, math: 0, 'gmrc-makabansa': 0 },
    unresolvedCounts: { reading: 0, language: 0, math: 0, 'gmrc-makabansa': 0 },
  };

  for (const subject of PACE_SUBJECTS) {
    if (force && typeof localStorage !== 'undefined') {
      localStorage.removeItem(getPaceStorageKeyV2(subject));
    }
    const env = loadPaceEnvelope(subject);
    summary.migratedCounts[subject] = Object.keys(env.records).length;
    summary.unresolvedCounts[subject] = Object.keys(env.unresolved).length;
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('formease_pace_version', '2');
  }

  return summary;
}

/**
 * Retrieves a single PACE form record for a specific school year and learner.
 */
export function getPaceRecord(
  subject: PaceFormSubject,
  schoolYear: string,
  lrn: string
): PaceFormData | undefined {
  if (!schoolYear || !lrn) return undefined;
  const env = loadPaceEnvelope(subject);
  const key = makePaceRecordKey(schoolYear, lrn);
  return env.records[key];
}

/**
 * Returns all PACE form records for a specific school year, indexed by LRN.
 */
export function getPaceRecordsForSchoolYear(
  subject: PaceFormSubject,
  schoolYear: string
): Record<string, PaceFormData> {
  if (!schoolYear) return {};
  const env = loadPaceEnvelope(subject);
  const normSy = normalizeSchoolYear(schoolYear);
  const prefix = `${normSy}::`;

  const result: Record<string, PaceFormData> = {};
  for (const [key, record] of Object.entries(env.records)) {
    if (key.startsWith(prefix)) {
      result[record.lrn] = record;
    }
  }
  return result;
}

/**
 * Saves a PACE form record for a specific school year and learner.
 */
export function savePaceRecord(
  subject: PaceFormSubject,
  schoolYear: string,
  lrn: string,
  data: PaceFormData
): void {
  if (!schoolYear || !lrn) {
    throw new Error('School year and learner LRN are required to save PACE ratings.');
  }

  const normSy = normalizeSchoolYear(schoolYear);
  const cleanLrn = lrn.trim();
  const env = loadPaceEnvelope(subject);
  const key = makePaceRecordKey(normSy, cleanLrn);

  env.records[key] = {
    ...data,
    lrn: cleanLrn,
    schoolYear: normSy,
    ratings: data.ratings || {},
  };

  persistPaceEnvelope(subject, env);
}

/**
 * Batch saves PACE form records for a specific school year.
 */
export function savePaceRecordsBulk(
  subject: PaceFormSubject,
  schoolYear: string,
  records: PaceFormData[]
): void {
  if (!schoolYear || !records.length) return;
  const normSy = normalizeSchoolYear(schoolYear);
  const env = loadPaceEnvelope(subject);

  for (const record of records) {
    if (!record.lrn) continue;
    const cleanLrn = record.lrn.trim();
    const key = makePaceRecordKey(normSy, cleanLrn);
    env.records[key] = {
      ...record,
      lrn: cleanLrn,
      schoolYear: normSy,
      ratings: record.ratings || {},
    };
  }

  persistPaceEnvelope(subject, env);
}

/**
 * Returns all quarantined unresolved legacy entries for a subject.
 */
export function getPaceUnresolved(subject: PaceFormSubject): Record<string, PaceUnresolvedEntry> {
  const env = loadPaceEnvelope(subject);
  return env.unresolved || {};
}

/**
 * Reassigns an unresolved legacy record to a valid school year.
 */
export function resolvePaceUnresolvedEntry(
  subject: PaceFormSubject,
  unresolvedKey: string,
  targetSchoolYear: string
): void {
  if (!isValidSchoolYear(targetSchoolYear)) {
    throw new Error(`Invalid school year format: "${targetSchoolYear}". Expected YYYY-YYYY.`);
  }

  const env = loadPaceEnvelope(subject);
  const entry = env.unresolved[unresolvedKey];
  if (!entry) {
    throw new Error(`Unresolved PACE record "${unresolvedKey}" not found.`);
  }

  const normSy = normalizeSchoolYear(targetSchoolYear);
  const recKey = makePaceRecordKey(normSy, entry.lrn);

  const raw = entry.rawEntry as Partial<PaceFormData>;
  env.records[recKey] = {
    lrn: entry.lrn,
    studentName: raw.studentName || '',
    gradeLevel: raw.gradeLevel || 'Grade 1',
    section: raw.section || '',
    schoolYear: normSy,
    teacherName: raw.teacherName || '',
    ratings: (raw.ratings && typeof raw.ratings === 'object') ? raw.ratings : {},
  };

  delete env.unresolved[unresolvedKey];
  persistPaceEnvelope(subject, env);
}

/**
 * Renames a learner's LRN across all school years and subjects.
 * Used during atomic learner updates to ensure PACE records travel with the learner.
 * Returns settings journal entries to be committed alongside database changes.
 */
export function renamePaceLrn(oldLrn: string, newLrn: string): Record<string, string> {
  const cleanOld = oldLrn.trim();
  const cleanNew = newLrn.trim();
  if (!cleanOld || !cleanNew) throw new Error('Valid old and new LRNs are required.');
  if (cleanOld === cleanNew) return {};

  const journalSettings: Record<string, string> = {};

  for (const subject of PACE_SUBJECTS) {
    const env = loadPaceEnvelope(subject);
    let mutated = false;

    // 1. Check for collisions across all school years in v2 records
    for (const record of Object.values(env.records)) {
      if (record.lrn === cleanOld) {
        const targetKey = makePaceRecordKey(record.schoolYear, cleanNew);
        if (env.records[targetKey]) {
          throw new Error(
            `The new LRN already has PACE ${subject} ratings for school year ${record.schoolYear}.`
          );
        }
      }
    }

    // 2. Perform v2 records rename
    const updatedRecords: Record<string, PaceFormData> = {};
    for (const [key, record] of Object.entries(env.records)) {
      if (record.lrn === cleanOld) {
        const newKey = makePaceRecordKey(record.schoolYear, cleanNew);
        updatedRecords[newKey] = {
          ...record,
          lrn: cleanNew,
        };
        mutated = true;
      } else {
        updatedRecords[key] = record;
      }
    }

    // 3. Rename in unresolved set if present
    const updatedUnresolved: Record<string, PaceUnresolvedEntry> = {};
    for (const [key, entry] of Object.entries(env.unresolved)) {
      if (entry.lrn === cleanOld) {
        const newKey = `${entry.legacyKey}::${cleanNew}`;
        updatedUnresolved[newKey] = {
          ...entry,
          lrn: cleanNew,
        };
        mutated = true;
      } else {
        updatedUnresolved[key] = entry;
      }
    }

    if (mutated) {
      env.records = updatedRecords;
      env.unresolved = updatedUnresolved;
      env.updatedAt = new Date().toISOString();
      const v2Key = getPaceStorageKeyV2(subject);
      journalSettings[v2Key] = JSON.stringify(env);
    }

    // 4. Update legacy keys in journal for backward compatibility
    for (const legacyKey of getLegacyPaceKeys(subject)) {
      if (typeof localStorage === 'undefined') continue;
      const raw = localStorage.getItem(legacyKey);
      if (!raw) continue;
      try {
        const legacyStore = JSON.parse(raw);
        if (legacyStore && typeof legacyStore === 'object' && Object.prototype.hasOwnProperty.call(legacyStore, cleanOld)) {
          if (Object.prototype.hasOwnProperty.call(legacyStore, cleanNew)) {
            throw new Error(`The new LRN already has legacy PACE ratings in ${legacyKey}.`);
          }
          const entry = legacyStore[cleanOld];
          delete legacyStore[cleanOld];
          legacyStore[cleanNew] = { ...entry, lrn: cleanNew };
          journalSettings[legacyKey] = JSON.stringify(legacyStore);
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('The new LRN already has')) throw e;
      }
    }
  }

  // 5. Update Grade 1 remarks keys in journal
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(`g1_remarks_${cleanOld}_`)) continue;
      const suffix = key.slice(`g1_remarks_${cleanOld}_`.length);
      const newKey = `g1_remarks_${cleanNew}_${suffix}`;
      if (localStorage.getItem(newKey) !== null) {
        throw new Error('The new LRN already has Grade 1 remarks for this school year.');
      }
      journalSettings[newKey] = localStorage.getItem(key)!;
      localStorage.removeItem(key);
    }
  }

  return journalSettings;
}

/**
 * Returns total count of unique PACE student records across all subjects for health checks.
 */
export function getTotalPaceRecordCount(): number {
  let count = 0;
  for (const subject of PACE_SUBJECTS) {
    const env = loadPaceEnvelope(subject);
    count += Object.keys(env.records).length;
  }
  return count;
}

/**
 * Exports all PACE records across all subjects and school years for rescue exports.
 */
export function getAllPaceRecordsForExport(): Array<{
  subject: PaceFormSubject;
  schoolYear: string;
  lrn: string;
  data: PaceFormData;
}> {
  const result: Array<{
    subject: PaceFormSubject;
    schoolYear: string;
    lrn: string;
    data: PaceFormData;
  }> = [];

  for (const subject of PACE_SUBJECTS) {
    const env = loadPaceEnvelope(subject);
    for (const record of Object.values(env.records)) {
      result.push({
        subject,
        schoolYear: record.schoolYear,
        lrn: record.lrn,
        data: record,
      });
    }
  }

  return result;
}

/**
 * Clears all PACE stores (v2 and legacy) during full profile resets.
 */
export function clearAllPaceStores(): void {
  if (typeof localStorage === 'undefined') return;
  for (const subject of PACE_SUBJECTS) {
    localStorage.removeItem(getPaceStorageKeyV2(subject));
    for (const legKey of getLegacyPaceKeys(subject)) {
      localStorage.removeItem(legKey);
    }
  }
  localStorage.removeItem('formease_pace_version');
  localStorage.removeItem('formease_pace_active_form_type');
  localStorage.removeItem('formease_pace_active_assessment');
}
