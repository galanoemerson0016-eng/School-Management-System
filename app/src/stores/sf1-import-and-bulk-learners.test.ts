import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { db } from '../services/database';
import { useAppStore } from './app-store';
import type { Student, Enrollment, ClassRecord, AttendanceRecord, ObservedValues, SF2Sheet } from '../types';

function createTestStudent(overrides: Partial<Student> & { lrn: string }): Student {
  return {
    first_name: 'Test',
    last_name: 'Student',
    gender: 'Male',
    birthday: '2015-01-01',
    age: 11,
    address: 'Manila, Philippines',
    grade_level: 'Grade 5',
    student_section: 'Section A',
    ...overrides,
  };
}

describe('Phase 3 (Work Package D) - SF1 Import and Bulk Learner Operations', () => {
  beforeEach(async () => {
    await db.resetConnection();
    db.releaseInstallWriteBarrier();
    db.setDatabaseEncryptionKey(null);
    globalThis.indexedDB = new IDBFactory();
    globalThis.IDBKeyRange = IDBKeyRange;
    localStorage.clear();

    useAppStore.setState({
      students: [],
      studentProfiles: [],
      classRecords: [],
      gradingSheetRecords: [],
      enrollments: [],
      attendanceRecords: [],
      observedValues: [],
      sf2Sheets: [],
      activeSF2Sheet: null,
      pendingConflicts: [],
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.resetConnection();
  });

  it('upgrades temporary LRN to official LRN across all stores and PACE multi-year records', async () => {
    const tempStudent = createTestStudent({
      lrn: 'TEMP-GRADE1-001',
      first_name: 'Maria',
      last_name: 'Santos',
      gender: 'Female',
      birthday: '2019-05-15',
      grade_level: 'Grade 1',
      student_section: 'Mabini',
      awardEvaluations: [
        {
          id: 'TEMP-GRADE1-001_2026-2027_1_Leadership',
          student_lrn: 'TEMP-GRADE1-001',
          schoolYear: '2026-2027',
          term: 1,
          awardType: 'Leadership',
        },
      ],
    });

    await db.putRecord('students', tempStudent);
    await db.putRecord('enrollments', {
      id: `enr_${tempStudent.lrn}`,
      student_lrn: tempStudent.lrn,
      section_id: 'sec-1',
    } as unknown as Enrollment);
    await db.putRecord('classRecords', {
      id: `cr_${tempStudent.lrn}`,
      student_lrn: tempStudent.lrn,
      subject_id: 'sub-1',
    } as unknown as ClassRecord);
    await db.putRecord('gradingSheetRecords', {
      id: `gs_${tempStudent.lrn}`,
      student_lrn: tempStudent.lrn,
      subject_id: 'sub-1',
    } as unknown as ClassRecord);
    await db.putRecord('attendanceRecords', {
      id: `att_${tempStudent.lrn}`,
      student_lrn: tempStudent.lrn,
      month: 'August',
    } as unknown as AttendanceRecord);
    await db.putRecord('observedValues', {
      id: `obs_${tempStudent.lrn}`,
      student_lrn: tempStudent.lrn,
      quarter: 'Q1',
    } as unknown as ObservedValues);
    await db.putRecord('sf2Sheets', {
      id: 'sf2-1',
      attendance: { [tempStudent.lrn]: { 1: 'P' } },
      remarks: { [tempStudent.lrn]: 'Transferred in' },
    } as unknown as SF2Sheet);

    // Seed SF10 and PACE v2 envelope
    localStorage.setItem(
      'sf10-storage',
      JSON.stringify({
        state: {
          overrides: { [`${tempStudent.lrn}_sheet`]: { A1: 'Grade 1 Math' } },
          history: {},
        },
        version: 0,
      })
    );
    localStorage.setItem(
      'formease_pace_v2_reading_ratings',
      JSON.stringify({
        version: 2,
        records: {
          [`2026-2027::${tempStudent.lrn}`]: {
            schoolYear: '2026-2027',
            lrn: tempStudent.lrn,
            ratings: { item1: 'Proficient' },
          },
        },
        unresolved: [],
      })
    );

    const incomingStudent = createTestStudent({
      lrn: '123456789012',
      first_name: 'Maria',
      last_name: 'Santos',
      gender: 'Female',
      birthday: '2019-05-15',
      grade_level: 'Grade 1',
      student_section: 'Mabini',
    });

    const result = await useAppStore.getState().importStudentsFromSF1([incomingStudent], 'Mabini');

    expect(result.count).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.imported).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.outcomes[0].status).toBe('updated');

    // Verify database state: old temporary record is gone, new official record is present
    expect(await db.getRecord('students', 'TEMP-GRADE1-001')).toBeUndefined();
    const updatedStudent = await db.getRecord<Student>('students', '123456789012');
    expect(updatedStudent).toBeDefined();
    expect(updatedStudent?.first_name).toBe('Maria');
    expect(updatedStudent?.birthday).toBe('2019-05-15');
    // Award evaluation IDs and LRNs updated
    expect(updatedStudent?.awardEvaluations?.[0].student_lrn).toBe('123456789012');
    expect(updatedStudent?.awardEvaluations?.[0].id).toBe('123456789012_2026-2027_1_Leadership');

    // All related stores updated
    for (const store of ['enrollments', 'classRecords', 'gradingSheetRecords', 'attendanceRecords', 'observedValues']) {
      const records = await db.getAllRecords<{ id: string; student_lrn: string }>(store);
      expect(records).toHaveLength(1);
      expect(records[0].student_lrn).toBe('123456789012');
    }

    // SF2 sheet updated
    const sheet = await db.getRecord<SF2Sheet>('sf2Sheets', 'sf2-1');
    expect(sheet?.attendance['123456789012']).toEqual({ 1: 'P' });
    expect(sheet?.attendance['TEMP-GRADE1-001']).toBeUndefined();
    expect(sheet?.remarks['123456789012']).toBe('Transferred in');
    expect(sheet?.remarks['TEMP-GRADE1-001']).toBeUndefined();

    // SF10 storage updated
    const sf10 = JSON.parse(localStorage.getItem('sf10-storage') || '{}');
    expect(sf10.state.overrides['123456789012_sheet']).toBeDefined();
    expect(sf10.state.overrides['TEMP-GRADE1-001_sheet']).toBeUndefined();

    // PACE v2 envelope updated
    const pace = JSON.parse(localStorage.getItem('formease_pace_v2_reading_ratings') || '{}');
    expect(pace.records['2026-2027::123456789012']).toBeDefined();
    expect(pace.records['2026-2027::TEMP-GRADE1-001']).toBeUndefined();
  });

  it('preserves the original learner and relationships if cascade aborts during import', async () => {
    const tempStudent = createTestStudent({
      lrn: 'TEMP-FAIL-001',
      first_name: 'Pedro',
      last_name: 'Penduko',
      student_section: 'Rizal',
    });
    await db.putRecord('students', tempStudent);
    await db.putRecord('enrollments', {
      id: `enr_${tempStudent.lrn}`,
      student_lrn: tempStudent.lrn,
    } as unknown as Enrollment);
    await db.putRecord('sf2Sheets', {
      id: 'sheet-fail',
      attendance: { [tempStudent.lrn]: { 1: 'P' } },
      remarks: {},
    } as unknown as SF2Sheet);

    // Mock an IDB abort during sf2Sheets put inside transaction
    const originalPut = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = originalPut.apply(this, args);
      if (this.name === 'sf2Sheets') {
        request.addEventListener('success', () => this.transaction.abort());
      }
      return request;
    });

    const incoming = createTestStudent({
      lrn: '987654321098',
      first_name: 'Pedro',
      last_name: 'Penduko',
      student_section: 'Rizal',
    });

    const result = await useAppStore.getState().importStudentsFromSF1([incoming], 'Rizal');

    expect(result.failed).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.imported).toBe(0);

    // Verify original student and related record remain completely untouched
    expect(await db.getRecord('students', 'TEMP-FAIL-001')).toBeDefined();
    expect(await db.getRecord('students', '987654321098')).toBeUndefined();
    expect(await db.getRecord('enrollments', `enr_${tempStudent.lrn}`)).toBeDefined();
  });

  it('rejects duplicate LRNs in the same import file without overwriting', async () => {
    const duplicateRow1 = createTestStudent({
      lrn: '111122223333',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      student_section: 'Section A',
      address: 'First Address',
    });
    const duplicateRow2 = createTestStudent({
      lrn: '111122223333',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      student_section: 'Section A',
      address: 'Conflicting Second Address',
    });

    const result = await useAppStore.getState().importStudentsFromSF1([duplicateRow1, duplicateRow2], 'Section A');

    expect(result.total).toBe(2);
    expect(result.imported).toBe(1);
    expect(result.conflicted).toBe(1);
    expect(result.outcomes[0].status).toBe('imported');
    expect(result.outcomes[1].status).toBe('conflicted');
    expect(result.outcomes[1].error).toContain('Duplicate LRN 111122223333');

    // The database must retain the first row, not the second
    const saved = await db.getRecord<Student>('students', '111122223333');
    expect(saved?.address).toBe('First Address');
  });

  it('treats two same-name temporary learners as separate and does not guess which one to overwrite', async () => {
    const learner1 = createTestStudent({
      lrn: 'TEMP-TWIN-001',
      first_name: 'Jose',
      last_name: 'Rizal',
      student_section: 'Section 1',
    });
    const learner2 = createTestStudent({
      lrn: 'TEMP-TWIN-002',
      first_name: 'Jose',
      last_name: 'Rizal',
      student_section: 'Section 2',
    });

    await db.putRecord('students', learner1);
    await db.putRecord('students', learner2);

    const incoming = createTestStudent({
      lrn: '123456789999',
      first_name: 'Jose',
      last_name: 'Rizal',
      student_section: 'Section 1',
    });

    // Because there are TWO temporary learners matching name Jose Rizal, the importer must NOT guess!
    const result = await useAppStore.getState().importStudentsFromSF1([incoming], 'Section 1');

    expect(result.imported).toBe(1);
    expect(result.updated).toBe(0);

    // Both original temporary learners must remain intact!
    expect(await db.getRecord('students', 'TEMP-TWIN-001')).toBeDefined();
    expect(await db.getRecord('students', 'TEMP-TWIN-002')).toBeDefined();
    // And the incoming learner is added as a separate identity
    expect(await db.getRecord('students', '123456789999')).toBeDefined();
  });

  it('handles conflict resolution modal and fetches fresh database revision before writing', async () => {
    const existing = createTestStudent({
      lrn: '123456000001',
      first_name: 'Andres',
      last_name: 'Bonifacio',
      birthday: '2010-11-30',
      address: 'Tondo, Manila',
    });
    await db.putRecord('students', existing);

    const incoming = createTestStudent({
      lrn: '123456000001',
      first_name: 'Andres',
      last_name: 'Bonifacio',
      birthday: '2010-11-30',
      address: 'Caloocan, Manila', // Differs from existing
    });

    // Start import in background
    const importPromise = useAppStore.getState().importStudentsFromSF1([incoming], 'Katipunan');

    // Wait for merge conflict to appear in state
    await new Promise((r) => setTimeout(r, 10));
    const conflicts = useAppStore.getState().pendingConflicts;
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].lrn).toBe('123456000001');

    // Concurrent edit occurs in DB while conflict dialog is open
    await db.putRecord('students', {
      ...existing,
      contact_number: '09171234567',
    });

    // User chooses to keep incoming address
    useAppStore.getState().resolveMergeConflict({
      address: 'Caloocan, Manila',
    });

    const result = await importPromise;
    expect(result.updated).toBe(1);

    // Fresh record includes both the concurrent contact number and the chosen merged address
    const saved = await db.getRecord<Student>('students', '123456000001');
    expect(saved?.address).toBe('Caloocan, Manila');
    expect(saved?.contact_number).toBe('09171234567');
  });

  it('marks row as skipped if user cancels or skips merge conflict dialog', async () => {
    const existing = createTestStudent({
      lrn: '123456000002',
      first_name: 'Emilio',
      last_name: 'Aguinaldo',
      address: 'Kawit, Cavite',
    });
    await db.putRecord('students', existing);

    const incoming = createTestStudent({
      lrn: '123456000002',
      first_name: 'Emilio',
      last_name: 'Aguinaldo',
      address: 'Updated Cavite',
    });

    const importPromise = useAppStore.getState().importStudentsFromSF1([incoming], 'Magdalo');

    await new Promise((r) => setTimeout(r, 10));
    expect(useAppStore.getState().pendingConflicts).toHaveLength(1);

    // User skips by passing null
    useAppStore.getState().resolveMergeConflict(null);

    const result = await importPromise;
    expect(result.skipped).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.outcomes[0].status).toBe('skipped');

    // Address remains Kawit, Cavite
    const saved = await db.getRecord<Student>('students', '123456000002');
    expect(saved?.address).toBe('Kawit, Cavite');
  });

  it('bulkAddStudents rejects batches with internal duplicate LRNs', async () => {
    const batch: Student[] = [
      createTestStudent({ lrn: '555555555555', first_name: 'A', last_name: 'B', gender: 'Male' }),
      createTestStudent({ lrn: '555555555555', first_name: 'C', last_name: 'D', gender: 'Female' }),
    ];

    await expect(useAppStore.getState().bulkAddStudents(batch)).rejects.toThrow(
      'Duplicate LRN(s) in batch: 555555555555'
    );
    expect(await db.getRecord('students', '555555555555')).toBeUndefined();
  });

  it('bulkAddStudents rejects batches that collide with existing database records', async () => {
    const existing = createTestStudent({
      lrn: '777777777777',
      first_name: 'Existing',
      last_name: 'Student',
    });
    await db.putRecord('students', existing);

    const batch: Student[] = [
      createTestStudent({ lrn: '777777777777', first_name: 'Imposter', last_name: 'Student' }),
    ];

    await expect(useAppStore.getState().bulkAddStudents(batch)).rejects.toThrow(
      'The following LRN(s) already exist: 777777777777'
    );

    // The existing student record was NOT replaced
    const current = await db.getRecord<Student>('students', '777777777777');
    expect(current?.first_name).toBe('Existing');
  });

  it('clearSection atomically purges all students and all related records belonging to the section', async () => {
    const studentA = createTestStudent({
      lrn: 'SEC-A-001',
      first_name: 'Alpha',
      last_name: 'One',
      student_section: 'Gold',
    });
    const studentB = createTestStudent({
      lrn: 'SEC-A-002',
      first_name: 'Alpha',
      last_name: 'Two',
      student_section: 'Gold',
    });
    const otherStudent = createTestStudent({
      lrn: 'SEC-B-001',
      first_name: 'Beta',
      last_name: 'One',
      student_section: 'Silver',
    });

    await db.putRecord('students', studentA);
    await db.putRecord('students', studentB);
    await db.putRecord('students', otherStudent);

    // Seed related records for studentA and otherStudent
    await db.putRecord('enrollments', { id: 'enr_SEC-A-001', student_lrn: 'SEC-A-001' } as unknown as Enrollment);
    await db.putRecord('enrollments', { id: 'enr_SEC-B-001', student_lrn: 'SEC-B-001' } as unknown as Enrollment);
    await db.putRecord('classRecords', { id: 'cr_SEC-A-001', student_lrn: 'SEC-A-001' } as unknown as ClassRecord);
    await db.putRecord('classRecords', { id: 'cr_SEC-B-001', student_lrn: 'SEC-B-001' } as unknown as ClassRecord);
    await db.putRecord('sf2Sheets', {
      id: 'sheet-multi',
      attendance: { 'SEC-A-001': { 1: 'P' }, 'SEC-B-001': { 1: 'P' } },
      remarks: { 'SEC-A-001': 'None', 'SEC-B-001': 'Present' },
    } as unknown as SF2Sheet);

    await useAppStore.getState().clearSection('Gold');

    // Section Gold students must be completely gone
    expect(await db.getRecord('students', 'SEC-A-001')).toBeUndefined();
    expect(await db.getRecord('students', 'SEC-A-002')).toBeUndefined();
    expect(await db.getRecord('enrollments', 'enr_SEC-A-001')).toBeUndefined();
    expect(await db.getRecord('classRecords', 'cr_SEC-A-001')).toBeUndefined();

    // Section Silver student must remain completely intact!
    expect(await db.getRecord('students', 'SEC-B-001')).toBeDefined();
    expect(await db.getRecord('enrollments', 'enr_SEC-B-001')).toBeDefined();
    expect(await db.getRecord('classRecords', 'cr_SEC-B-001')).toBeDefined();

    // SF2 sheet must have Gold student stripped and Silver student preserved
    const sheet = await db.getRecord<SF2Sheet>('sf2Sheets', 'sheet-multi');
    expect(sheet?.attendance['SEC-A-001']).toBeUndefined();
    expect(sheet?.attendance['SEC-B-001']).toEqual({ 1: 'P' });
    expect(sheet?.remarks['SEC-A-001']).toBeUndefined();
    expect(sheet?.remarks['SEC-B-001']).toBe('Present');
  });

  it('clearSection preserves all records if cascade deletion aborts', async () => {
    const student = createTestStudent({
      lrn: 'ABORT-001',
      first_name: 'Fail',
      last_name: 'Safe',
      student_section: 'Bronze',
    });
    await db.putRecord('students', student);
    await db.putRecord('enrollments', { id: 'enr_ABORT-001', student_lrn: 'ABORT-001' } as unknown as Enrollment);

    const originalDelete = IDBObjectStore.prototype.delete;
    vi.spyOn(IDBObjectStore.prototype, 'delete').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = originalDelete.apply(this, args);
      if (this.name === 'enrollments') {
        request.addEventListener('success', () => this.transaction.abort());
      }
      return request;
    });

    await expect(useAppStore.getState().clearSection('Bronze')).rejects.toThrow();

    // Record remains intact
    expect(await db.getRecord('students', 'ABORT-001')).toBeDefined();
    expect(await db.getRecord('enrollments', 'enr_ABORT-001')).toBeDefined();
  });
});
