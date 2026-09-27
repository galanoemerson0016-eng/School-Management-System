import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { db } from '../services/database';
import { useAppStore } from './app-store';
import type { Section, Subject, Student, Enrollment, ClassRecord } from '../types';

describe('Phase 4 (Work Package E) - Section and Subject Cascades', () => {
  beforeEach(async () => {
    await db.resetConnection();
    db.releaseInstallWriteBarrier();
    db.setDatabaseEncryptionKey(null);
    globalThis.indexedDB = new IDBFactory();
    globalThis.IDBKeyRange = IDBKeyRange;
    localStorage.clear();

    useAppStore.setState({
      sections: [],
      subjects: [],
      students: [],
      studentProfiles: [],
      enrollments: [],
      classRecords: [],
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.resetConnection();
  });

  it('updateSection atomically renames section and updates students and enrollments', async () => {
    const section: Section = {
      id: 'sec-apple',
      section_name: 'Apple',
      section_grade_level: 'Grade 7',
      is_advisory: true,
      taught_subjects: ['Science 7'],
    };
    const student: Student = {
      lrn: '100000000001',
      first_name: 'Ana',
      last_name: 'Cruz',
      gender: 'Female',
      birthday: '2012-01-01',
      age: 14,
      address: 'Cavite',
      grade_level: 'Grade 7',
      student_section: 'Apple',
    };
    const enrollment: Enrollment = {
      id: 'enr-1',
      student_lrn: '100000000001',
      school_year: '2026-2027',
      student_section: 'Apple',
    };

    await db.putRecord('sections', section);
    await db.putRecord('students', student);
    await db.putRecord('enrollments', enrollment);

    await useAppStore.getState().updateSection({
      ...section,
      section_name: 'Honeycrisp',
    });

    // Verify atomic commit
    const updatedSec = await db.getRecord<Section>('sections', 'sec-apple');
    expect(updatedSec?.section_name).toBe('Honeycrisp');

    const updatedStud = await db.getRecord<Student>('students', '100000000001');
    expect(updatedStud?.student_section).toBe('Honeycrisp');

    const updatedEnr = await db.getRecord<Enrollment>('enrollments', 'enr-1');
    expect(updatedEnr?.student_section).toBe('Honeycrisp');

    // Zustand store in sync
    expect(useAppStore.getState().sections[0].section_name).toBe('Honeycrisp');
    expect(useAppStore.getState().students[0].student_section).toBe('Honeycrisp');
    expect(useAppStore.getState().enrollments[0].student_section).toBe('Honeycrisp');
  });

  it('updateSection rejects renaming if target section name already exists', async () => {
    const sec1: Section = { id: 'sec-1', section_name: 'Rose', section_grade_level: 'Grade 8', is_advisory: true };
    const sec2: Section = { id: 'sec-2', section_name: 'Lily', section_grade_level: 'Grade 8', is_advisory: true };
    await db.putRecord('sections', sec1);
    await db.putRecord('sections', sec2);

    await expect(
      useAppStore.getState().updateSection({ ...sec1, section_name: 'Lily' })
    ).rejects.toThrow('A section named "Lily" already exists.');

    // Disk remains untouched
    expect((await db.getRecord<Section>('sections', 'sec-1'))?.section_name).toBe('Rose');
  });

  it('updateSection rolls back completely if commit aborts during rename', async () => {
    const section: Section = { id: 'sec-fail', section_name: 'Original', section_grade_level: 'Grade 9', is_advisory: true };
    const student: Student = {
      lrn: '100000000002',
      first_name: 'Bob',
      last_name: 'Lee',
      gender: 'Male',
      birthday: '2011-01-01',
      age: 15,
      address: 'Laguna',
      grade_level: 'Grade 9',
      student_section: 'Original',
    };
    await db.putRecord('sections', section);
    await db.putRecord('students', student);

    const originalPut = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const req = originalPut.apply(this, args);
      if (this.name === 'students') {
        req.addEventListener('success', () => this.transaction.abort());
      }
      return req;
    });

    await expect(
      useAppStore.getState().updateSection({ ...section, section_name: 'Renamed' })
    ).rejects.toThrow();

    // Both section and student remain Original
    expect((await db.getRecord<Section>('sections', 'sec-fail'))?.section_name).toBe('Original');
    expect((await db.getRecord<Student>('students', '100000000002'))?.student_section).toBe('Original');
  });

  it('deleteSection atomically deletes section and clears student and enrollment assignments (D04 test)', async () => {
    const section: Section = { id: 'sec-del', section_name: 'Diamond', section_grade_level: 'Grade 10', is_advisory: true };
    const student: Student = {
      lrn: '100000000003',
      first_name: 'Clara',
      last_name: 'Oswald',
      gender: 'Female',
      birthday: '2010-01-01',
      age: 16,
      address: 'Manila',
      grade_level: 'Grade 10',
      student_section: 'Diamond',
    };
    const enrollment: Enrollment = {
      id: 'enr-del',
      student_lrn: '100000000003',
      school_year: '2026-2027',
      student_section: 'Diamond',
    };

    await db.putRecord('sections', section);
    await db.putRecord('students', student);
    await db.putRecord('enrollments', enrollment);

    await useAppStore.getState().deleteSection('sec-del');

    expect(await db.getRecord('sections', 'sec-del')).toBeUndefined();
    expect((await db.getRecord<Student>('students', '100000000003'))?.student_section).toBe('');
    expect((await db.getRecord<Enrollment>('enrollments', 'enr-del'))?.student_section).toBe('');
  });

  it('deleteSection failure injection preserves section and student assignment', async () => {
    const section: Section = { id: 'sec-abort', section_name: 'Emerald', section_grade_level: 'Grade 10', is_advisory: true };
    const student: Student = {
      lrn: '100000000004',
      first_name: 'David',
      last_name: 'Tennant',
      gender: 'Male',
      birthday: '2010-01-01',
      age: 16,
      address: 'Manila',
      grade_level: 'Grade 10',
      student_section: 'Emerald',
    };

    await db.putRecord('sections', section);
    await db.putRecord('students', student);

    const originalDelete = IDBObjectStore.prototype.delete;
    vi.spyOn(IDBObjectStore.prototype, 'delete').mockImplementation(function (this: IDBObjectStore, ...args) {
      const req = originalDelete.apply(this, args);
      if (this.name === 'sections') {
        req.addEventListener('success', () => this.transaction.abort());
      }
      return req;
    });

    await expect(useAppStore.getState().deleteSection('sec-abort')).rejects.toThrow();

    // Section and student remain intact
    expect(await db.getRecord('sections', 'sec-abort')).toBeDefined();
    expect((await db.getRecord<Student>('students', '100000000004'))?.student_section).toBe('Emerald');
  });

  it('updateSubject scopes section taught_subjects synchronization strictly to matching grade level (Finding D07)', async () => {
    const subjG7: Subject = {
      id: 'sub-g7-math',
      subject_name: 'Mathematics',
      grade_level: 'Grade 7',
      term: 'all',
    };
    const secG7: Section = {
      id: 'sec-g7',
      section_name: 'Grade 7 - Mabini',
      section_grade_level: 'Grade 7',
      is_advisory: true,
      taught_subjects: ['Mathematics', 'English'],
    };
    const secG8: Section = {
      id: 'sec-g8',
      section_name: 'Grade 8 - Rizal',
      section_grade_level: 'Grade 8',
      is_advisory: true,
      taught_subjects: ['Mathematics', 'English'],
    };

    await db.putRecord('subjects', subjG7);
    await db.putRecord('sections', secG7);
    await db.putRecord('sections', secG8);

    // Rename Mathematics in Grade 7 to "General Mathematics 7"
    await useAppStore.getState().updateSubject({
      ...subjG7,
      subject_name: 'General Mathematics 7',
    });

    // Grade 7 section must be updated
    const freshG7 = await db.getRecord<Section>('sections', 'sec-g7');
    expect(freshG7?.taught_subjects).toEqual(['General Mathematics 7', 'English']);

    // Grade 8 section MUST NOT be changed! Same-name subject in another grade remains independent!
    const freshG8 = await db.getRecord<Section>('sections', 'sec-g8');
    expect(freshG8?.taught_subjects).toEqual(['Mathematics', 'English']);
  });

  it('deleteSubject removes subject only from sections in matching grade level and preserves subject_name on classRecords (Finding D07)', async () => {
    const subjG9: Subject = {
      id: 'sub-g9-sci',
      subject_name: 'Science',
      grade_level: 'Grade 9',
      term: 'all',
    };
    const secG9: Section = {
      id: 'sec-g9',
      section_name: 'Grade 9 - Einstein',
      section_grade_level: 'Grade 9',
      is_advisory: true,
      taught_subjects: ['Science', 'Math'],
    };
    const secG10: Section = {
      id: 'sec-g10',
      section_name: 'Grade 10 - Newton',
      section_grade_level: 'Grade 10',
      is_advisory: true,
      taught_subjects: ['Science', 'Math'],
    };
    const classRecord: ClassRecord = {
      id: 'cr-1',
      student_lrn: '100000000005',
      subject_id: 'sub-g9-sci',
      section_id: 'sec-g9',
    } as unknown as ClassRecord;

    await db.putRecord('subjects', subjG9);
    await db.putRecord('sections', secG9);
    await db.putRecord('sections', secG10);
    await db.putRecord('classRecords', classRecord);

    await useAppStore.getState().deleteSubject('sub-g9-sci');

    // Subject is deleted
    expect(await db.getRecord('subjects', 'sub-g9-sci')).toBeUndefined();

    // Grade 9 section has Science removed
    const freshG9 = await db.getRecord<Section>('sections', 'sec-g9');
    expect(freshG9?.taught_subjects).toEqual(['Math']);

    // Grade 10 section STILL HAS Science!
    const freshG10 = await db.getRecord<Section>('sections', 'sec-g10');
    expect(freshG10?.taught_subjects).toEqual(['Science', 'Math']);

    // classRecord has subject_name preserved
    const freshCr = await db.getRecord<ClassRecord>('classRecords', 'cr-1');
    expect(freshCr?.subject_name).toBe('Science');
  });

  it('deleteSubjectsBulk removes multiple subjects atomically with scoped section synchronization', async () => {
    const s1: Subject = { id: 's-1', subject_name: 'PE 1', grade_level: 'Grade 1', term: 'all' };
    const s2: Subject = { id: 's-2', subject_name: 'Health 1', grade_level: 'Grade 1', term: 'all' };
    const sec1: Section = {
      id: 'sec-1',
      section_name: 'Grade 1 - Sampaguita',
      section_grade_level: 'Grade 1',
      is_advisory: true,
      taught_subjects: ['PE 1', 'Health 1', 'Math 1'],
    };
    const sec2: Section = {
      id: 'sec-2',
      section_name: 'Grade 2 - Camia',
      section_grade_level: 'Grade 2',
      is_advisory: true,
      taught_subjects: ['PE 1', 'Math 2'], // Unrelated section that happens to have same string
    };

    await db.putRecord('subjects', s1);
    await db.putRecord('subjects', s2);
    await db.putRecord('sections', sec1);
    await db.putRecord('sections', sec2);

    await useAppStore.getState().deleteSubjectsBulk(['s-1', 's-2']);

    expect(await db.getRecord('subjects', 's-1')).toBeUndefined();
    expect(await db.getRecord('subjects', 's-2')).toBeUndefined();

    // Grade 1 section had PE 1 and Health 1 removed
    const freshSec1 = await db.getRecord<Section>('sections', 'sec-1');
    expect(freshSec1?.taught_subjects).toEqual(['Math 1']);

    // Grade 2 section was NOT modified
    const freshSec2 = await db.getRecord<Section>('sections', 'sec-2');
    expect(freshSec2?.taught_subjects).toEqual(['PE 1', 'Math 2']);
  });
});
