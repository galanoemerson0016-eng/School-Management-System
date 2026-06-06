import type { Student, SchoolProfile, Section, ClassRecord, Subject } from '../types';

interface ShsSf9MapperParams {
  student: Student;
  profile: SchoolProfile;
  schoolYear: string;
  sectionObj: Section;
  subjects: Subject[];
  gradingSheetRecords: ClassRecord[];
}

/**
 * Maps Senior High School student details and term grades to the SF9 Report Card structure.
 * Separated from elementary and JHS to avoid regression/changes.
 */
export function mapStudentToShsSf9Data({
  student,
  profile,
  schoolYear,
  sectionObj,
  subjects,
  gradingSheetRecords,
}: ShsSf9MapperParams) {
  
  // Resolve core details
  const gradeLevelNum = parseInt(sectionObj.section_grade_level.replace(/\D/g, '')) || 0;
  
  // Filter subjects taught in this Grade 11 or 12 section
  const sectionSubjects = subjects.filter(
    s => (s.section_id === sectionObj.id || (!s.section_id && parseInt(s.grade_level.replace(/\D/g, '')) === gradeLevelNum)) && s.term !== 'none'
  );

  // Compute grades per Term
  const computeGradesForSubject = (subjId: string, subjectName: string, subjectTerm?: 1 | 2 | 3 | 'all' | 'none') => {
    const getGrade = (q: number) => {
      const rec = gradingSheetRecords.find(
        r => r.student_lrn === student.lrn && r.subject_id === subjId && r.school_year === schoolYear && r.quarter === q
      );
      return rec && rec.final_grade ? Math.round(Number(rec.final_grade)) : 0;
    };

    const t1 = getGrade(1);
    const t2 = getGrade(2);
    const t3 = getGrade(3);

    let final = 0;
    
    // Check custom electives matching Academic Electives
    const normName = subjectName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normName === 'academicelective1') {
      if (t1 > 0 && t3 > 0) final = Math.round((t1 + t3) / 2);
      else final = t1 || t3 || 0;
    } else if (normName === 'academicelective2') {
      if (t2 > 0 && t3 > 0) final = Math.round((t2 + t3) / 2);
      else final = t2 || t3 || 0;
    } else if (normName === 'academicelective3') {
      final = t3;
    } else if (normName === 'techproelective1') {
      let sum = 0;
      let count = 0;
      if (t1 > 0) { sum += t1; count++; }
      if (t2 > 0) { sum += t2; count++; }
      if (t3 > 0) { sum += t3; count++; }
      final = count > 0 ? Math.round(sum / count) : 0;
    } else {
      const numericTerm = subjectTerm ? Number(subjectTerm) : undefined;
      if (numericTerm === 1) {
        final = t1;
      } else if (numericTerm === 2) {
        final = t2;
      } else if (numericTerm === 3) {
        final = t3;
      } else {
        // Core subject (all terms) - average of all 3 terms
        if (t1 > 0 && t2 > 0 && t3 > 0) {
          final = Math.round((t1 + t2 + t3) / 3);
        }
      }
    }

    return { t1, t2, t3, final };
  };

  const subjectGrades = sectionSubjects.map(s => ({
    id: s.id,
    subjectName: s.subject_name,
    subjectCode: s.subject_code || '',
    term: s.term,
    grades: computeGradesForSubject(s.id, s.subject_name, s.term),
  }));

  const STRAND_MAPPING: Record<string, string> = {
    'STEM': 'Science, Technology, Engineering, and Mathematics',
    'ABM': 'Accountancy, Business, and Management',
    'HUMSS': 'Humanities and Social Sciences',
    'GAS': 'General Academic Strand',
    'ICT': 'Information and Communications Technology'
  };

  const rawStrand = student.strand || '';
  const displayStrand = STRAND_MAPPING[rawStrand] || rawStrand;

  return {
    student: {
      lrn: student.lrn,
      fullName: `${student.last_name}, ${student.first_name} ${student.middle_name || ''}`.trim().toUpperCase(),
      gender: student.gender,
      age: student.age,
      track: student.track || '',
      strand: displayStrand,
      shsAdmissionDate: student.shs_admission_date || '',
    },
    schoolProfile: {
      name: profile.name,
      region: profile.region,
      division: profile.division,
      district: profile.district,
      schoolYear,
      section: sectionObj.section_name,
      adviser: profile.adviser_name || '',
      principal: profile.head_name || '',
    },
    subjectGrades,
  };
}
