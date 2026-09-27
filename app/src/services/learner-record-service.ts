import { db, type AtomicRecordChange } from './database';
import type { SF2Sheet, Student } from '../types';
import { renamePaceLrn } from './pace-record-service';

const RELATED_STORES = ['enrollments', 'classRecords', 'gradingSheetRecords', 'attendanceRecords', 'observedValues'] as const;
interface LearnerReference { id: string; student_lrn: string }

// Prevent simultaneous identity edits from preparing plans from stale records.
let pendingMutation: Promise<unknown> = Promise.resolve();
export function withLearnerMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingMutation.then(operation);
  pendingMutation = result.catch(() => undefined);
  return result;
}

function renamedSf10Settings(oldLrn: string, newLrn: string): Record<string, string> {
  const raw = localStorage.getItem('sf10-storage');
  if (!raw) return {};
  const storage = JSON.parse(raw);
  if (!storage || typeof storage.state !== 'object') throw new Error('SF10 storage is invalid. Repair it before changing an LRN.');
  for (const field of ['overrides', 'history']) {
    const entries = storage.state[field];
    if (!entries) continue;
    for (const key of Object.keys(entries)) {
      if (!key.startsWith(`${oldLrn}_`)) continue;
      const newKey = `${newLrn}${key.slice(oldLrn.length)}`;
      if (Object.prototype.hasOwnProperty.call(entries, newKey)) {
        throw new Error('The new LRN already has SF10 history. Existing records were not changed.');
      }
      entries[newKey] = entries[key];
      delete entries[key];
    }
  }
  return { 'sf10-storage': JSON.stringify(storage) };
}

function renamedPaceSettings(oldLrn: string, newLrn: string): Record<string, string> {
  return renamePaceLrn(oldLrn, newLrn);
}

export async function persistLearnerUpdate(oldLrn: string, student: Student): Promise<void> {
  if (!student.lrn || student.lrn !== student.lrn.trim()) throw new Error('A valid LRN is required.');
  if (oldLrn === student.lrn) {
    await db.putRecord('students', student);
    return;
  }
  if (await db.getRecord('students', student.lrn)) throw new Error('A learner with the new LRN already exists.');

  let studentToPut = student;
  if (student.awardEvaluations && student.awardEvaluations.length > 0) {
    studentToPut = {
      ...student,
      awardEvaluations: student.awardEvaluations.map((ae) => ({
        ...ae,
        student_lrn: student.lrn,
        id: ae.id ? ae.id.replace(oldLrn, student.lrn) : ae.id,
      })),
    };
  }

  const changes: AtomicRecordChange[] = [{ store: 'students', deletes: [oldLrn], puts: [studentToPut] }];
  for (const store of RELATED_STORES) {
    const records = await db.getRecordsByIndex<LearnerReference>(store, 'by-student-lrn', oldLrn);
    const puts = records.map(record => ({ ...record, id: record.id.replace(oldLrn, student.lrn), student_lrn: student.lrn }));
    const oldIds = new Set(records.map(record => record.id));
    for (const record of puts) {
      if (!oldIds.has(record.id) && await db.getRecord(store, record.id)) {
        throw new Error('The new LRN conflicts with existing related records. Existing records were not changed.');
      }
    }
    changes.push({ store, deletes: records.map(record => record.id), puts });
  }
  const sheets = await db.getAllRecords<SF2Sheet>('sf2Sheets');
  const puts: SF2Sheet[] = [];
  for (const sheet of sheets) {
    const attendance = { ...sheet.attendance };
    const remarks = { ...sheet.remarks };
    let changed = false;
    for (const map of [attendance, remarks]) {
      if (!Object.prototype.hasOwnProperty.call(map, oldLrn)) continue;
      if (Object.prototype.hasOwnProperty.call(map, student.lrn)) throw new Error('The new LRN already has SF2 records.');
      map[student.lrn] = map[oldLrn];
      delete map[oldLrn];
      changed = true;
    }
    if (changed) puts.push({ ...sheet, attendance, remarks });
  }
  changes.push({ store: 'sf2Sheets', puts });
  await db.commitRecordChanges(changes, {
    ...renamedSf10Settings(oldLrn, student.lrn),
    ...renamedPaceSettings(oldLrn, student.lrn),
  });
}

export async function persistLearnersDelete(lrns: string[]): Promise<void> {
  const uniqueLrns = Array.from(new Set(lrns.filter(lrn => Boolean(lrn && lrn.trim()))));
  if (uniqueLrns.length === 0) return;

  const changes: AtomicRecordChange[] = [{ store: 'students', deletes: uniqueLrns }];

  for (const store of RELATED_STORES) {
    const deletes: string[] = [];
    for (const lrn of uniqueLrns) {
      const records = await db.getRecordsByIndex<LearnerReference>(store, 'by-student-lrn', lrn);
      for (const r of records) {
        deletes.push(r.id);
      }
    }
    if (deletes.length > 0) {
      changes.push({ store, deletes });
    }
  }

  const sheets = await db.getAllRecords<SF2Sheet>('sf2Sheets');
  const puts: SF2Sheet[] = [];
  for (const sheet of sheets) {
    let changed = false;
    const attendance = { ...sheet.attendance };
    const remarks = { ...sheet.remarks };
    for (const lrn of uniqueLrns) {
      if (Object.prototype.hasOwnProperty.call(attendance, lrn)) {
        delete attendance[lrn];
        changed = true;
      }
      if (Object.prototype.hasOwnProperty.call(remarks, lrn)) {
        delete remarks[lrn];
        changed = true;
      }
    }
    if (changed) {
      puts.push({ ...sheet, attendance, remarks });
    }
  }
  if (puts.length > 0) {
    changes.push({ store: 'sf2Sheets', puts });
  }

  // Historical SF10 snapshots remain recoverable; deleting learners must not
  // silently erase their permanent record history from localStorage.
  await db.commitRecordChanges(changes);
}

export async function persistLearnerDelete(lrn: string): Promise<void> {
  await persistLearnersDelete([lrn]);
}
