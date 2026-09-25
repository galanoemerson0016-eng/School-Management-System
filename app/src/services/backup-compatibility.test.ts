import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { extractBackupPayload, db } from './database';
import { isStudentInSection } from '../utils/grading-helpers';

// In-memory IndexedDB mock for jsdom environment
interface MockRequest<T = unknown> {
  onsuccess: ((event: { target: MockRequest<T> }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  result?: T;
  transaction?: unknown;
  onupgradeneeded?: ((event: { target: MockRequest<T> }) => void) | null;
}

interface MockRecord {
  lrn?: string;
  id?: string;
  school_id?: string;
  [key: string]: unknown;
}

function setupMockIndexedDB() {
  const tables = new Map<string, Map<string, unknown>>();

  function getTable(name: string) {
    if (!tables.has(name)) {
      tables.set(name, new Map());
    }
    return tables.get(name)!;
  }

  function createStoreMock(storeName: string) {
    const tbl = getTable(storeName);
    const keyPath = storeName === 'students' ? 'lrn' : (storeName === 'schoolProfile' ? 'school_id' : 'id');
    return {
      keyPath,
      indexNames: {
        contains: (_idx: string) => false,
      },
      clear: () => {
        tbl.clear();
        const req: MockRequest<undefined> = { onsuccess: null, onerror: null };
        queueMicrotask(() => req.onsuccess?.({ target: req }));
        return req;
      },
      put: (item: MockRecord) => {
        const key = item.lrn || item.id || item.school_id || String(Math.random());
        tbl.set(key, item);
        const req: MockRequest<string> = { onsuccess: null, onerror: null, result: key };
        queueMicrotask(() => req.onsuccess?.({ target: req }));
        return req;
      },
      getAll: () => {
        const items = Array.from(tbl.values());
        const req: MockRequest<unknown[]> = { onsuccess: null, onerror: null, result: items };
        queueMicrotask(() => req.onsuccess?.({ target: req }));
        return req;
      },
      get: (key: string) => {
        const req: MockRequest<unknown> = { onsuccess: null, onerror: null, result: tbl.get(key) };
        queueMicrotask(() => req.onsuccess?.({ target: req }));
        return req;
      },
      delete: (key: string) => {
        tbl.delete(key);
        const req: MockRequest<undefined> = { onsuccess: null, onerror: null };
        queueMicrotask(() => req.onsuccess?.({ target: req }));
        return req;
      },
      createIndex: () => {},
    };
  }

  const mockDb = {
    objectStoreNames: {
      contains: (_name: string) => true,
    },
    createObjectStore: (name: string, _opts?: { keyPath?: string }) => createStoreMock(name),
    deleteObjectStore: (_name: string) => {},
    transaction: (_storeNames: string | string[], _mode?: string) => {
      const tx = {
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        abort: () => {},
        objectStore: (storeName: string) => createStoreMock(storeName)
      };
      queueMicrotask(() => tx.oncomplete?.());
      return tx;
    }
  };

  (globalThis as unknown as { indexedDB: unknown }).indexedDB = {
    open: (_name: string, _version?: number) => {
      const req: MockRequest<typeof mockDb> = {
        result: mockDb,
        transaction: mockDb.transaction(['students']),
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };
      queueMicrotask(() => {
        if (req.onupgradeneeded) {
          req.onupgradeneeded({ target: req });
        }
        req.onsuccess?.({ target: req });
      });
      return req;
    }
  };
}

describe('Backup Backward Compatibility & Restoration', () => {
  beforeAll(() => {
    setupMockIndexedDB();
  });

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('extractBackupPayload (Recursive unwrapping)', () => {
    it('unwraps AutomatedBackupEntry with data.payload', () => {
      const emergencySnapshot = {
        id: 'backup_1710000000000',
        label: 'Pre-Action Checkpoint',
        timestamp: 1710000000000,
        data: {
          metadata: { appVersion: '3.5.0' },
          summary: { studentsCount: 45 },
          payload: {
            students: [{ lrn: '109283746501', first_name: 'Juan', last_name: 'Dela Cruz', student_section: 'Rizal' }],
            sections: [{ id: 'sec-1', section_name: 'Rizal', section_grade_level: 'Grade 7' }],
            subjects: [{ id: 'sub-1', subject_name: 'Mathematics', grade_level: 'Grade 7' }],
            classRecords: [{ id: 'cr-1', student_lrn: '109283746501', subject_id: 'sub-1', quarter: 1, initial_grade: 88, transmuted_grade: 92 }],
            schoolProfile: { school_id: '300123', school_name: 'National High School', school_year: '2025-2026' }
          }
        }
      };

      const extracted = extractBackupPayload(emergencySnapshot);
      expect(extracted).not.toBeNull();
      expect(Array.isArray(extracted?.students)).toBe(true);
      expect((extracted?.students as unknown[]).length).toBe(1);
      expect((extracted?.sections as unknown[]).length).toBe(1);
      expect((extracted?.classRecords as unknown[]).length).toBe(1);
      expect((extracted?.schoolProfile as Record<string, unknown>).school_year).toBe('2025-2026');
    });

    it('unwraps ComprehensiveBackup format with payload', () => {
      const comprehensive = {
        version: '3.5.10',
        timestamp: 1710000000000,
        payload: {
          students: [{ lrn: '109283746502', first_name: 'Maria', last_name: 'Santos' }],
          sections: [{ id: 'sec-2', section_name: 'Bonifacio' }]
        }
      };

      const extracted = extractBackupPayload(comprehensive);
      expect(extracted).not.toBeNull();
      expect((extracted?.students as unknown[]).length).toBe(1);
      expect((extracted?.sections as unknown[]).length).toBe(1);
    });

    it('unwraps legacy backup format with data wrapper', () => {
      const legacyBackup = {
        timestamp: '2025-08-01T00:00:00.000Z',
        data: {
          students: [{ lrn: '109283746503', first_name: 'Pedro', last_name: 'Penduko' }],
          classes: [{ section_id: 'sec-3', name: 'Mabini' }]
        }
      };

      const extracted = extractBackupPayload(legacyBackup);
      expect(extracted).not.toBeNull();
      expect((extracted?.students as unknown[]).length).toBe(1);
      expect((extracted?.classes as unknown[]).length).toBe(1);
    });

    it('accepts raw direct store dump without wrapper', () => {
      const rawDump = {
        students: [{ lrn: '109283746504', first_name: 'Jose', last_name: 'Rizal' }],
        sections: [{ id: 'sec-4', section_name: 'Katipunan' }]
      };

      const extracted = extractBackupPayload(rawDump);
      expect(extracted).not.toBeNull();
      expect(extracted?.students).toEqual(rawDump.students);
      expect(extracted?.sections).toEqual(rawDump.sections);
    });

    it('handles deeply nested backup wraps up to 5 levels', () => {
      const deeplyNested = {
        level1: {
          backup: {
            data: {
              payload: {
                students: [{ lrn: '109283746505', first_name: 'Andres', last_name: 'Bonifacio' }]
              }
            }
          }
        }
      };

      const extracted = extractBackupPayload(deeplyNested.level1);
      expect(extracted).not.toBeNull();
      expect((extracted?.students as unknown[]).length).toBe(1);
    });

    it('returns null for empty or invalid payloads', () => {
      expect(extractBackupPayload(null)).toBeNull();
      expect(extractBackupPayload(undefined)).toBeNull();
      expect(extractBackupPayload('string-data')).toBeNull();
    });

    it('successfully parses serialized JSON string backup payloads', () => {
      const jsonStr = JSON.stringify({
        students: [{ lrn: '123456789012', first_name: 'Maria', last_name: 'Santos' }]
      });
      const extracted = extractBackupPayload(jsonStr);
      expect(extracted).not.toBeNull();
      expect((extracted?.students as unknown[]).length).toBe(1);
    });
  });

  describe('Field & Table Aliases & Primary Key Sanitization in importFromBackup', () => {
    it('normalizes legacy table names (learners, classes, learningAreas, grades, school_profile)', async () => {
      const legacyPayload = {
        learners: [
          { student_lrn: '123456789012', first_name: 'Ana', last_name: 'Reyes', student_section: 'Grade 8 - Ruby' },
          { LRN: '123456789013', first_name: 'Ben', last_name: 'Santos', student_section: 'Ruby' }
        ],
        classes: [
          { section_id: 'legacy-sec-1', name: 'Ruby', section_grade_level: 'Grade 8' }
        ],
        learningAreas: [
          { subject_id: 'legacy-sub-1', name: 'Science', grade_level: 'Grade 8' }
        ],
        grades: [
          { student_lrn: '123456789012', subject_id: 'legacy-sub-1', quarter: 1, initial_grade: 85, transmuted_grade: 90, school_year: '2024-2025' }
        ],
        school_profile: {
          id: 'school-999',
          school_name: 'Mabini Memorial NHS',
          school_year: '2024-2025'
        }
      };

      // Import the legacy data using db.importFromBackup
      await db.importFromBackup(legacyPayload);

      // Verify school year was synchronized to localStorage
      expect(localStorage.getItem('activeSchoolYear')).toBe('2024-2025');
      expect(localStorage.getItem('formease_active_school_year')).toBe('2024-2025');

      // Verify students were loaded and sanitized with primary key `lrn`
      const students = await db.getAllRecords<{ lrn: string; first_name: string; student_section: string }>('students');
      expect(students.length).toBe(2);
      expect(students.some(s => s.lrn === '123456789012')).toBe(true);
      expect(students.some(s => s.lrn === '123456789013')).toBe(true);

      // Verify sections were loaded and sanitized with primary key `id` and `section_name`
      const sections = await db.getAllRecords<{ id: string; section_name: string }>('sections');
      expect(sections.length).toBe(1);
      expect(sections[0].id).toBe('legacy-sec-1');
      expect(sections[0].section_name).toBe('Ruby');

      // Verify subjects were loaded and sanitized with primary key `id` and `subject_name`
      const subjects = await db.getAllRecords<{ id: string; subject_name: string }>('subjects');
      expect(subjects.length).toBe(1);
      expect(subjects[0].id).toBe('legacy-sub-1');
      expect(subjects[0].subject_name).toBe('Science');

      // Verify grades (classRecords) were loaded and sanitized with an ID
      const classRecords = await db.getAllRecords<{ id: string; student_lrn: string; subject_id: string; transmuted_grade: number }>('classRecords');
      expect(classRecords.length).toBe(1);
      expect(classRecords[0].student_lrn).toBe('123456789012');
      expect(classRecords[0].transmuted_grade).toBe(90);
      expect(classRecords[0].id).toBeDefined();

      // Verify schoolProfile record exists with school_id
      const profile = await db.getAllRecords<{ school_id: string; school_name: string; school_year: string }>('schoolProfile');
      expect(profile.length).toBe(1);
      expect(profile[0].school_id).toBe('school-999');
      expect(profile[0].school_year).toBe('2024-2025');
    });

    it('infers school_year from classRecords when schoolProfile is absent', async () => {
      const payloadWithoutProfile = {
        students: [{ lrn: '111222333444', first_name: 'Clara', last_name: 'Claudio' }],
        classRecords: [
          { student_lrn: '111222333444', subject_id: 'sub-math', quarter: 2, school_year: '2025-2026' }
        ]
      };

      await db.importFromBackup(payloadWithoutProfile);

      expect(localStorage.getItem('activeSchoolYear')).toBe('2025-2026');
      expect(localStorage.getItem('formease_active_school_year')).toBe('2025-2026');
    });

    it('safely restores backups containing users table without throwing', async () => {
      const payloadWithUsers = {
        students: [{ lrn: '555666777888', first_name: 'David', last_name: 'Dizon' }],
        sections: [{ id: 'sec-sapphire', section_name: 'Sapphire', section_grade_level: 'Grade 9' }],
        users: [{ id: 'user-001', username: 'teacher1', displayName: 'Teacher 1' }],
        schoolProfile: { school_id: '300001', school_name: 'Test High School', school_year: '2025-2026' }
      };

      await expect(db.importFromBackup(payloadWithUsers)).resolves.not.toThrow();

      const students = await db.getAllRecords<{ lrn: string }>('students');
      expect(students.some(s => s.lrn === '555666777888')).toBe(true);

      const sections = await db.getAllRecords<{ id: string }>('sections');
      expect(sections.some(sec => sec.id === 'sec-sapphire')).toBe(true);
    });
  });

  describe('UI Section Matching Compatibility (isStudentInSection)', () => {
    const mockSection = {
      id: 'sec-diamond-7',
      section_name: 'Diamond',
      section_grade_level: 'Grade 7'
    };

    it('matches student with section ID directly', () => {
      const student = { student_section: 'sec-diamond-7' };
      expect(isStudentInSection(student, mockSection)).toBe(true);
    });

    it('matches student with exact section name', () => {
      const student = { student_section: 'Diamond' };
      expect(isStudentInSection(student, mockSection)).toBe(true);
    });

    it('matches student with case-insensitive section name', () => {
      const student = { student_section: 'diamond' };
      expect(isStudentInSection(student, mockSection)).toBe(true);
    });

    it('matches compound "Grade 7 - Diamond"', () => {
      const student = { student_section: 'Grade 7 - Diamond' };
      expect(isStudentInSection(student, mockSection)).toBe(true);
    });

    it('matches compound "Grade 7-Diamond"', () => {
      const student = { student_section: 'Grade 7-Diamond' };
      expect(isStudentInSection(student, mockSection)).toBe(true);
    });

    it('matches compound "Grade 7 Diamond"', () => {
      const student = { student_section: 'Grade 7 Diamond' };
      expect(isStudentInSection(student, mockSection)).toBe(true);
    });

    it('matches short grade "G7 - Diamond"', () => {
      const student = { student_section: 'G7 - Diamond' };
      expect(isStudentInSection(student, mockSection)).toBe(true);
    });

    it('matches short grade "G7-Diamond"', () => {
      const student = { student_section: 'G7-Diamond' };
      expect(isStudentInSection(student, mockSection)).toBe(true);
    });

    it('matches short grade "G7 Diamond"', () => {
      const student = { student_section: 'G7 Diamond' };
      expect(isStudentInSection(student, mockSection)).toBe(true);
    });

    it('matches using selectedSectionFallback when section is null', () => {
      const student = { student_section: 'Diamond' };
      expect(isStudentInSection(student, null, 'Diamond')).toBe(true);
      expect(isStudentInSection(student, null, 'sec-diamond-7')).toBe(false);
      expect(isStudentInSection({ student_section: 'sec-diamond-7' }, null, 'sec-diamond-7')).toBe(true);
    });

    it('returns false for students in different sections', () => {
      const student = { student_section: 'Emerald' };
      expect(isStudentInSection(student, mockSection)).toBe(false);
    });

    it('returns false for empty or null inputs safely', () => {
      expect(isStudentInSection(null, mockSection)).toBe(false);
      expect(isStudentInSection({ student_section: '' }, mockSection)).toBe(false);
      expect(isStudentInSection({ student_section: undefined }, mockSection)).toBe(false);
      expect(isStudentInSection({ student_section: 'Diamond' }, null)).toBe(false);
    });
  });
});
