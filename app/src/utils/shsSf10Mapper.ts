import type { Student, SchoolProfile, Section, ClassRecord, Subject, User } from '../types';
import { getShsSubjectUnitInfo } from '../lib/curriculum';
import { isMatchingSubject, normalizeGrade12PESubjectName } from './grading-helpers';

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
 * Implements DepEd Order No. 017, s. 2026 track inheritance and subject scoping.
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

  const effectiveTrack = student.track || studentSection?.track || '';
  const effectiveStrand = student.strand || studentSection?.strand || 'SSHS';

  // 2. Map Learner's Basic Info
  const learnerInfo = {
    lastName: student.last_name?.toUpperCase() || '',
    firstName: student.first_name?.toUpperCase() || '',
    middleName: student.middle_name?.toUpperCase() || '',
    nameExtension: student.name_extension?.toUpperCase() || '',
    lrn: (student.lrn && !student.lrn.startsWith('TEMP-')) ? student.lrn : '',
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

  // 4. Map Academic Semester Records
  const buildSemesterAcademicRecord = (gradeLevelNum: number) => {
    const taughtRaw = studentSection?.taught_subjects || [];
    const sectionTrack = (effectiveTrack || '').toLowerCase();

    // Filter candidate subjects
    let candidateSubjects = subjects.filter(s => {
      if (s.term === 'none') return false;
      const subjectGradeNum = parseInt(s.grade_level?.replace(/\D/g, '') || '0');
      return subjectGradeNum === gradeLevelNum;
    });

    // Prioritize direct section subjects over generic ones
    candidateSubjects.sort((a, b) => {
      const aDirect = a.section_id === studentSection?.id ? 1 : 0;
      const bDirect = b.section_id === studentSection?.id ? 1 : 0;
      return bDirect - aDirect;
    });

    if (taughtRaw.length > 0) {
      // Ensure all explicitly taught subjects are present
      for (const tName of taughtRaw) {
        const alreadyHas = candidateSubjects.some(s => isMatchingSubject(tName, s.id, s.subject_name));
        if (!alreadyHas) {
          candidateSubjects.push({
            id: `virtual_${tName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            subject_name: tName,
            subject_code: '',
            grade_level: `Grade ${gradeLevelNum}`,
            section_id: studentSection?.id || '',
            term: 'all'
          });
        }
      }

      // Filter to only match explicitly taught subjects
      candidateSubjects = candidateSubjects.filter(s => {
        return taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name));
      });

      // Use the exact subject name from taught_subjects, normalizing Old K-12 PE
      const isExplicitSSHS = (studentSection?.track || '').toLowerCase().includes('sshs') || (studentSection?.track || '').toLowerCase().includes('cluster');
      candidateSubjects = candidateSubjects.map(s => {
        const matchedTaught = taughtRaw.find(t => isMatchingSubject(t, s.id, s.subject_name));
        let name = matchedTaught || s.subject_name;
        if (gradeLevelNum === 12 && !isExplicitSSHS) {
          name = normalizeGrade12PESubjectName(name, false);
        }
        if (name !== s.subject_name) {
          return { ...s, subject_name: name };
        }
        return s;
      });
    } else if (sectionTrack) {
      candidateSubjects = candidateSubjects.filter(s => {
        const unitInfo = getShsSubjectUnitInfo(s.subject_name, `Grade ${gradeLevelNum}`);
        if (unitInfo.category === 'core' && gradeLevelNum === 11) return true;
        if (sectionTrack.includes('acad')) {
          return unitInfo.category === 'academic_elective' || unitInfo.category === 'arts_elective';
        }
        if (sectionTrack.includes('tech') || sectionTrack.includes('tvl')) {
          return unitInfo.category === 'techpro_elective' || unitInfo.category === 'work_immersion';
        }
        return true;
      });
    }

    // Deduplicate by normalized name
    const seenShsNames = new Set<string>();
    const uniqueShsSubjects: Subject[] = [];
    for (const s of candidateSubjects) {
      const norm = s.subject_name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm && seenShsNames.has(norm)) continue;
      if (norm) seenShsNames.add(norm);
      uniqueShsSubjects.push(s);
    }
    candidateSubjects = uniqueShsSubjects;

    return candidateSubjects.map(dbSubject => {
      const getGrade = (q: number) => {
        const rec = gradingSheetRecords.find(
          r => r.student_lrn === student.lrn && r.subject_id === dbSubject.id && r.quarter === q
        );
        return rec && rec.final_grade ? Math.round(Number(rec.final_grade)) : 0;
      };

      const q1 = getGrade(1);
      const q2 = getGrade(2);
      const q3 = getGrade(3);

      let final = 0;
      let count = 0;
      if (q1 > 0) { final += q1; count++; }
      if (q2 > 0) { final += q2; count++; }
      if (q3 > 0) { final += q3; count++; }
      const finalRating = count > 0 ? Math.round(final / count) : 0;

      return {
        subjectName: dbSubject.subject_name,
        subjectCode: dbSubject.subject_code || '',
        quarter1Grade: q1 > 0 ? String(q1) : '',
        quarter2Grade: q2 > 0 ? String(q2) : '',
        quarter3Grade: q3 > 0 ? String(q3) : '',
        finalGrade: finalRating > 0 ? String(finalRating) : '',
        remarks: finalRating >= 75 ? 'PASSED' : finalRating > 0 ? 'FAILED' : '',
      };
    });
  };

  const scholasticRecords = [
    {
      gradeLevel: 11,
      semester: 1,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      track: effectiveTrack,
      strand: effectiveStrand,
      section: studentSection?.section_name || '',
      schoolYear: schoolYear,
      adviser: adviserName,
      subjects: buildSemesterAcademicRecord(11),
    },
    {
      gradeLevel: 11,
      semester: 2,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      track: effectiveTrack,
      strand: effectiveStrand,
      section: studentSection?.section_name || '',
      schoolYear: schoolYear,
      adviser: adviserName,
      subjects: buildSemesterAcademicRecord(11),
    },
    {
      gradeLevel: 12,
      semester: 1,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      track: effectiveTrack,
      strand: effectiveStrand,
      section: studentSection?.section_name || '',
      schoolYear: schoolYear,
      adviser: adviserName,
      subjects: buildSemesterAcademicRecord(12),
    },
    {
      gradeLevel: 12,
      semester: 2,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      track: effectiveTrack,
      strand: effectiveStrand,
      section: studentSection?.section_name || '',
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
    track: effectiveTrack,
    strand: effectiveStrand,
  };
}
