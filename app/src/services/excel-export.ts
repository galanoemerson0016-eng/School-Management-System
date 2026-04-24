import * as XLSX from 'xlsx';
import type { Student, ClassRecord, Subject, Section, Enrollment } from '../types';

/**
 * Robust Data Portability Service
 * Provides bulk Excel export for students and grades
 */

/**
 * Export all students to a well-formatted Excel file
 */
export function exportStudentsToExcel(students: Student[], sections: Section[]) {
  const sectionMap = new Map(sections.map(s => [s.id, s.section_name]));
  
  const data = students.map(s => ({
    'LRN': s.lrn,
    'Last Name': s.last_name,
    'First Name': s.first_name,
    'Middle Name': s.middle_name || '',
    'Extension': s.name_extension || '',
    'Gender': s.gender,
    'Birthdate': s.birthday,
    'Age': s.age,
    'Grade Level': s.grade_level,
    'Section': (sectionMap.get(s.student_section || '') || s.student_section) || 'Unassigned',
    'Contact': s.contact_number || '',
    'Parent/Guardian': s.parent_name || '',
    'Parent Contact': s.parent_contact || '',
    'Address': s.address || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  // Set column widths
  const wscols = [
    { wch: 15 }, // LRN
    { wch: 20 }, // Last Name
    { wch: 20 }, // First Name
    { wch: 15 }, // Middle Name
    { wch: 10 }, // Extension
    { wch: 10 }, // Gender
    { wch: 12 }, // Birthdate
    { wch: 5 },  // Age
    { wch: 12 }, // Grade Level
    { wch: 15 }, // Section
    { wch: 15 }, // Contact
    { wch: 25 }, // Parent/Guardian
    { wch: 15 }, // Parent Contact
    { wch: 40 }  // Address
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Students_Masterlist_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export specific grades (by section or all) to Excel
 */
export function exportGradesToExcel(
  students: Student[], 
  grades: ClassRecord[], 
  subjects: Subject[], 
  sections: Section[],
  targetSectionId?: string
) {
  const sectionMap = new Map(sections.map(s => [s.id, s.section_name]));
  const subjectMap = new Map(subjects.map(s => [s.id, s.subject_name]));
  
  const filteredStudents = targetSectionId 
    ? students.filter(s => s.student_section === targetSectionId)
    : students;
    
  const data = [];
  
  for (const student of filteredStudents) {
    const studentGrades = grades.filter(g => g.student_lrn === student.lrn);
    
    // Group grades by subject
    const gradesBySubject = new Map<string, Record<number, number>>();
    for (const g of studentGrades) {
      if (!gradesBySubject.has(g.subject_id)) {
        gradesBySubject.set(g.subject_id, {});
      }
      gradesBySubject.get(g.subject_id)![g.quarter] = Number(g.final_grade) || 0;
    }
    
    // Add a row for each subject a student has grades for
    for (const [subjectId, qGrades] of gradesBySubject) {
      data.push({
        'LRN': student.lrn,
        'Name': `${student.last_name}, ${student.first_name}`,
        'Section': (sectionMap.get(student.student_section || '') || student.student_section) || 'Unassigned',
        'Subject': subjectMap.get(subjectId) || subjectId,
        'Q1': qGrades[1] || '',
        'Q2': qGrades[2] || '',
        'Q3': qGrades[3] || '',
        'Q4': qGrades[4] || '',
        'Final': Math.round(( (qGrades[1] || 0) + (qGrades[2] || 0) + (qGrades[3] || 0) + (qGrades[4] || 0) ) / 4) || ''
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Grades');
  
  const wscols = [
    { wch: 15 }, // LRN
    { wch: 30 }, // Name
    { wch: 15 }, // Section
    { wch: 25 }, // Subject
    { wch: 8 },  // Q1
    { wch: 8 },  // Q2
    { wch: 8 },  // Q3
    { wch: 8 },  // Q4
    { wch: 8 }   // Final
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Grades_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export all system data to multiple sheets in one Excel file (Master Portability)
 */
export function exportMasterDataToExcel(
  students: Student[],
  sections: Section[],
  subjects: Subject[],
  grades: ClassRecord[],
  enrollments: Enrollment[]
) {
  const workbook = XLSX.utils.book_new();

  // 1. Students Sheet
  const studentsData = students.map(s => ({
    lrn: s.lrn, last_name: s.last_name, first_name: s.first_name, middle_name: s.middle_name,
    gender: s.gender, birthday: s.birthday, address: s.address, contact: s.contact_number,
    section: s.student_section
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(studentsData), 'Students');

  // 2. Sections Sheet
  const sectionsData = sections.map(s => ({
    id: s.id, name: s.section_name, grade: s.section_grade_level, adviser: s.adviser_name
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sectionsData), 'Sections');

  // 3. Subjects Sheet
  const subjectsData = subjects.map(s => ({
    id: s.id, name: s.subject_name, code: s.subject_code, section: s.section_id
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(subjectsData), 'Subjects');

  // 4. Grades Sheet (Flat)
  const gradesData = grades.map(g => ({
    student_lrn: g.student_lrn, subject_id: g.subject_id, quarter: g.quarter, grade: g.final_grade
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(gradesData), 'Raw_Grades');

  XLSX.writeFile(workbook, `FormEase_System_Portability_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}
