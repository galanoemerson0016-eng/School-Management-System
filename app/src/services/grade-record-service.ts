import type { ClassRecord, HPSRecord } from '../types';
import { db } from './database';
import { isSameSubject } from '../utils/grading-helpers';

export interface EClassChanges {
  records: ClassRecord[];
  /** Explicit calculated projections, e.g. a MAPEH composite with no raw row. */
  officialRecords?: ClassRecord[];
  removedRecords?: ClassRecord[];
  hpsRecords?: HPSRecord[];
}

let gradeWriteQueue: Promise<unknown> = Promise.resolve();
export function enqueueGradeWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = gradeWriteQueue.then(operation);
  gradeWriteQueue = result.catch(() => undefined);
  return result;
}

/** New IDs include every ownership boundary; legacy IDs remain readable. */
export function gradeRecordId(record: Pick<ClassRecord, 'student_lrn' | 'subject_id' | 'section_id' | 'school_year' | 'quarter'>): string {
  return `grade:${JSON.stringify([record.school_year, record.section_id, record.student_lrn, record.subject_id, Number(record.quarter)])}`;
}

export function sameGradeScope(left: ClassRecord, right: ClassRecord): boolean {
  return String(left.student_lrn).trim() === String(right.student_lrn).trim()
    && left.school_year === right.school_year
    && left.section_id === right.section_id
    && Number(left.quarter) === Number(right.quarter)
    && isSameSubject(left.subject_id, left.subject_name, right.subject_id, right.subject_name);
}

/** A direct/ambiguous legacy grade is not permission for E-Class to overwrite it. */
function ownedByEClass(record: ClassRecord): boolean {
  return record.grade_source === 'eclass_sync';
}

export async function commitEClassChanges(changes: EClassChanges, official: ClassRecord[]): Promise<ClassRecord[]> {
  const puts: ClassRecord[] = [];
  const deletes = new Set<string>();
  const projections = new Map([...changes.records, ...(changes.officialRecords || [])].map(record => [gradeRecordId(record), record]));
  for (const record of projections.values()) {
    if (!record.student_lrn || !record.subject_id || !record.section_id || !record.school_year) {
      throw new Error('Select a learner, subject, section and school year before saving grades.');
    }
    const grade = Number(record.final_grade);
    if (!Number.isFinite(grade) || grade < 0 || grade > 100) throw new Error('The calculated grade is outside the supported range.');
    const matches = official.filter(candidate => sameGradeScope(candidate, record));
    // Preserve explicit manual/direct grades and ambiguous legacy data until reviewed.
    if (matches.some(candidate => !ownedByEClass(candidate))) continue;
    for (const candidate of matches) deletes.add(candidate.id);
    const previous = matches[0];
    puts.push({
      ...previous,
      ...record,
      id: `official:${gradeRecordId(record)}`,
      grade_source: 'eclass_sync',
      written_works: previous?.written_works || [],
      performance_tasks: previous?.performance_tasks || [],
      quarterly_exam: previous?.quarterly_exam ?? '',
    });
  }
  for (const removed of changes.removedRecords || []) {
    for (const candidate of official) {
      if (ownedByEClass(candidate) && sameGradeScope(candidate, removed)) deletes.add(candidate.id);
    }
  }
  await db.commitRecordChanges([
    { store: 'classRecords', puts: changes.records, deletes: (changes.removedRecords || []).map(record => record.id) },
    { store: 'gradingSheetRecords', puts, deletes: [...deletes] },
    { store: 'hpsRecords', puts: changes.hpsRecords },
  ]);
  return [...official.filter(record => !deletes.has(record.id)), ...puts];
}
