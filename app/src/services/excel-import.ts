/**
 * Excel/CSV Import Service
 * Handles bulk import of students, sections, subjects, and other data from Excel files
 */

import * as XLSX from 'xlsx';
import { db } from './database';
import type { Student, Section, Subject } from '../types';
import { readSafeWorkbook } from '../utils/safe-workbook-reader';

const MAX_IMPORT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function assertValidXlsx(buffer: ArrayBuffer): void {
  const bytes = new Uint8Array(buffer, 0, 4);
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (!isZip) throw new Error('File does not appear to be a valid Excel (.xlsx) file.');
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  records: unknown[];
}

/**
 * Import students from Excel file
 * Expected columns: LRN, First Name, Last Name, Middle Name, Gender, Birthday, Age, Address, Grade Level, Section
 */
export async function importStudentsFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMPORT_SIZE_BYTES) {
      reject(new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 20 MB.`));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        assertValidXlsx(data as ArrayBuffer);
        const workbook = readSafeWorkbook(data as ArrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        const result: ImportResult = {
          success: 0,
          failed: 0,
          errors: [],
          records: [],
        };

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] as Record<string, unknown>;

          try {
            const student: Student = {
              lrn: String(row['LRN'] || row['lrn'] || '').trim(),
              first_name: String(row['First Name'] || row['first_name'] || '').trim(),
              last_name: String(row['Last Name'] || row['last_name'] || '').trim(),
              middle_name: String(row['Middle Name'] || row['middle_name'] || '').trim() || undefined,
              name_extension: String(row['Name Extension'] || row['name_extension'] || '').trim() || undefined,
              gender: (String(row['Gender'] || row['gender'] || '').trim() as 'Male' | 'Female') || 'Male',
              birthday: String(row['Birthday'] || row['birthday'] || '').trim(),
              age: Number(row['Age'] || row['age']) || 0,
              address: String(row['Address'] || row['address'] || '').trim(),
              contact_number: String(row['Contact'] || row['contact_number'] || '').trim() || undefined,
              grade_level: String(row['Grade Level'] || row['grade_level'] || '').trim(),
              student_section: String(row['Section'] || row['student_section'] || '').trim() || undefined,
            };

            // Validate required fields and formats
            if (!student.lrn || !student.first_name || !student.last_name) {
              throw new Error('Missing required fields: LRN, First Name, Last Name');
            }

            if (!/^\d{12}$/.test(student.lrn) && !student.lrn.startsWith('TEMP-')) {
              throw new Error(`Invalid LRN: "${student.lrn}". LRN must be exactly 12 numeric digits or start with "TEMP-".`);
            }

            // Check for duplicates
            const existing = await db.getRecord<Student>('students', student.lrn);
            if (existing) {
              result.errors.push(`Row ${i + 1}: Student ${student.lrn} already exists`);
              result.failed++;
              continue;
            }

            await db.putRecord('students', student);
            result.success++;
            result.records.push(student);
          } catch (error) {
            result.errors.push(`Row ${i + 1}: ${(error as Error).message}`);
            result.failed++;
          }
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Import sections from Excel file
 * Expected columns: ID, Section Name, Grade Level, Adviser Name
 */
export async function importSectionsFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMPORT_SIZE_BYTES) {
      reject(new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 20 MB.`));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        assertValidXlsx(data as ArrayBuffer);
        const workbook = readSafeWorkbook(data as ArrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        const result: ImportResult = {
          success: 0,
          failed: 0,
          errors: [],
          records: [],
        };

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] as Record<string, unknown>;

          try {
            const section: Section = {
              id: String(row['ID'] || row['id'] || `sec-${Date.now()}-${i}`).trim(),
              section_name: String(row['Section Name'] || row['section_name'] || '').trim(),
              section_grade_level: String(row['Grade Level'] || row['section_grade_level'] || '').trim(),
              adviser_name: String(row['Adviser Name'] || row['adviser_name'] || '').trim() || undefined,
            };

            // Validate required fields
            if (!section.section_name || !section.section_grade_level) {
              throw new Error('Missing required fields: Section Name, Grade Level');
            }

            await db.putRecord('sections', section);
            result.success++;
            result.records.push(section);
          } catch (error) {
            result.errors.push(`Row ${i + 1}: ${(error as Error).message}`);
            result.failed++;
          }
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Import subjects from Excel file
 * Expected columns: ID, Subject Name, Subject Code, Grade Level, Section ID
 */
export async function importSubjectsFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMPORT_SIZE_BYTES) {
      reject(new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 20 MB.`));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        assertValidXlsx(data as ArrayBuffer);
        const workbook = readSafeWorkbook(data as ArrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        const result: ImportResult = {
          success: 0,
          failed: 0,
          errors: [],
          records: [],
        };

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] as Record<string, unknown>;

          try {
            const subject: Subject = {
              id: String(row['ID'] || row['id'] || `subj-${Date.now()}-${i}`).trim(),
              subject_name: String(row['Subject Name'] || row['subject_name'] || '').trim(),
              subject_code: String(row['Subject Code'] || row['subject_code'] || '').trim() || undefined,
              grade_level: String(row['Grade Level'] || row['grade_level'] || '').trim(),
              section_id: String(row['Section ID'] || row['section_id'] || '').trim() || undefined,
              order: Number(row['Order'] || row['order']) || undefined,
            };

            // Validate required fields
            if (!subject.subject_name || !subject.grade_level) {
              throw new Error('Missing required fields: Subject Name, Grade Level');
            }

            await db.putRecord('subjects', subject);
            result.success++;
            result.records.push(subject);
          } catch (error) {
            result.errors.push(`Row ${i + 1}: ${(error as Error).message}`);
            result.failed++;
          }
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export current data to Excel file
 */
export async function exportDataToExcel(dataType: 'students' | 'sections' | 'subjects' | 'all') {
  try {
    const data: Record<string, unknown[]> = {};

    if (dataType === 'students' || dataType === 'all') {
      data.Students = await db.getAllRecords('students');
    }
    if (dataType === 'sections' || dataType === 'all') {
      data.Sections = await db.getAllRecords('sections');
    }
    if (dataType === 'subjects' || dataType === 'all') {
      data.Subjects = await db.getAllRecords('subjects');
    }

    const workbook = XLSX.utils.book_new();

    for (const [sheet, records] of Object.entries(data)) {
      const worksheet = XLSX.utils.json_to_sheet(records);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet);
    }

    const fileName = `FormEase_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}

export const excel = {
  importStudentsFromExcel,
  importSectionsFromExcel,
  importSubjectsFromExcel,
  exportDataToExcel,
};
