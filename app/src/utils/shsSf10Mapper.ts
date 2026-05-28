import type { Student, SchoolProfile, Section, ClassRecord, Subject, User } from '../types';

interface ShsMapperParams {
  student: Student;
  profile: SchoolProfile;
  schoolYear: string;
  sections: Section[];
  teachers?: User[];
  subjects?: Subject[];
  gradingSheetRecords?: ClassRecord[];
}

/**
 * Maps Senior High School student details and academic records to the SF10-SHS structure.
 * This is completely separated from Elementary and JHS to avoid any regressions or changes.
 */
export function mapStudentToShsSf10Data({
  student,
  profile,
  schoolYear,
  sections,
  teachers = [],
  gradingSheetRecords = [],
  subjects = [],
}: ShsMapperParams) {
  
  // 1. Resolve student section & adviser
  const studentSection = sections.find(
    s => s.id === student.student_section || s.section_name === student.student_section
  );
  
  let adviserName = '';
  if (studentSection?.adviser_name) {
    adviserName = studentSection.adviser_name;
  } else if (studentSection?.adviser_id) {
    const teacher = teachers.find(t => t.uid === studentSection.adviser_id);
    adviserName = teacher?.displayName || '';
  }

  // 2. Map Learner's Basic Info
  const learnerInfo = {
    lastName: student.last_name?.toUpperCase() || '',
    firstName: student.first_name?.toUpperCase() || '',
    middleName: student.middle_name?.toUpperCase() || '',
    nameExtension: student.name_extension?.toUpperCase() || '',
    lrn: student.lrn || '',
    birthdate: student.birthday || '',
    sex: student.gender || '',
    shsAdmissionDate: student.shs_admission_date || '',
  };

  // 3. Map Eligibility Info specifically for Senior High School
  const eligibilityInfo = {
    isHsCompleter: student.is_hs_completer || false,
    hsGenAve: student.hs_gen_ave || '',
    hsGraduationDate: student.hs_graduation_date || '',
    
    isJhsCompleter: student.is_jhs_completer || false,
    jhsGenAve: student.jhs_gen_ave || '',
    jhsSchoolName: student.jhs_school_name || '',
    jhsSchoolAddress: student.jhs_school_address || '',
    jhsGraduationDate: student.jhs_graduation_date || '',
    
    isPeptPasser: student.is_pept_passer || false,
    peptRating: student.shs_pept_rating || student.pept_rating || '',
    peptDate: student.shs_pept_date || student.pept_date || '',
    
    isAlsPasser: student.is_als_passer || false,
    alsRating: student.shs_als_rating || student.als_rating || '',
    alsClcNameAddress: student.shs_als_clc_name_address || '',
    
    isOther: student.is_other_eligibility || false,
    otherCredentials: student.shs_other_credentials || student.other_credentials || '',
  };

  // 4. Map Academic Semester Records (SHS uses Semesters instead of Quarters)
  // Grade 11: 1st Sem & 2nd Sem, Grade 12: 1st Sem & 2nd Sem
  const buildSemesterAcademicRecord = (gradeLevelNum: number) => {
    // Collect records matching grade level (Grade 11/12) and semester
    const semRecords = gradingSheetRecords.filter(r => {
      if (r.student_lrn !== student.lrn) return false;
      const dbSubject = subjects.find(s => s.id === r.subject_id);
      if (!dbSubject || dbSubject.term === 'none') return false;
      const subjectGradeNum = parseInt(dbSubject.grade_level.replace(/\D/g, '')) || 0;
      return subjectGradeNum === gradeLevelNum;
    });

    // Translate database records to SHS subject row items
    // (SHS has fields for Subject Name, 1st Quarter, 2nd Quarter, Sem Final Grade, and Action taken)
    return semRecords.map(r => {
      const dbSubject = subjects.find(s => s.id === r.subject_id);
      return {
        subjectName: dbSubject?.subject_name || '',
        subjectCode: dbSubject?.subject_code || '',
        quarter1Grade: r.quarter === 1 ? r.final_grade : '',
        quarter2Grade: r.quarter === 2 ? r.final_grade : '',
        finalGrade: r.quarter === 3 ? r.final_grade : r.final_grade, // Custom semester logic
        remarks: Number(r.final_grade) >= 75 ? 'PASSED' : 'FAILED',
      };
    });
  };

  const scholasticRecords = [
    {
      gradeLevel: 11,
      semester: 1,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      track: student.track || '',
      strand: student.strand || '',
      schoolYear: schoolYear,
      adviser: adviserName,
      subjects: buildSemesterAcademicRecord(11),
    },
    {
      gradeLevel: 11,
      semester: 2,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      track: student.track || '',
      strand: student.strand || '',
      schoolYear: schoolYear,
      adviser: adviserName,
      subjects: buildSemesterAcademicRecord(11),
    },
    {
      gradeLevel: 12,
      semester: 1,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      track: student.track || '',
      strand: student.strand || '',
      schoolYear: schoolYear,
      adviser: adviserName,
      subjects: buildSemesterAcademicRecord(12),
    },
    {
      gradeLevel: 12,
      semester: 2,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      track: student.track || '',
      strand: student.strand || '',
      schoolYear: schoolYear,
      adviser: adviserName,
      subjects: buildSemesterAcademicRecord(12),
    }
  ];

  return {
    isSHS: true,
    learner: learnerInfo,
    eligibility: eligibilityInfo,
    scholasticRecords,
    track: student.track || '',
    strand: student.strand || '',
  };
}
