import type { Student, SchoolProfile, Section, ClassRecord, Subject, User } from '../types';
import { getShsSubjectUnitInfo, getStandardShsSemester } from '../lib/curriculum';
import { isMatchingSubject, normalizeGrade12PESubjectName, isStudentEligibleForSectionSubject } from './grading-helpers';

interface ShsMapperParams {
  student: Student;
  profile: SchoolProfile;
  schoolYear: string;
  sections: Section[];
  teachers?: User[];
  subjects?: Subject[];
  gradingSheetRecords?: ClassRecord[];
  classRecords?: ClassRecord[];
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
  classRecords = [],
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
  // 4. Map Academic Semester Records with Strict Semester Isolation (Zero Cross-Semester Leakage)
  const buildSemesterAcademicRecord = (gradeLevelNum: number, targetSemester: 1 | 2) => {
    const studentSecGradeNum = parseInt(studentSection?.section_grade_level?.replace(/\D/g, '') || '0', 10);
    const taughtRaw = (studentSecGradeNum === 0 || studentSecGradeNum === gradeLevelNum) ? (studentSection?.taught_subjects || []) : [];
    const sectionTrack = (effectiveTrack || '').toLowerCase();

    // Filter candidate subjects for this grade level
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
            term: targetSemester === 1 ? 1 : 2,
            semester: targetSemester
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
        if (unitInfo.category === 'core') return true;
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

    // Strict Semester Isolation: Zero cross-semester leakage!
    candidateSubjects = candidateSubjects.filter(s => {
      if (s.semester === 1) return targetSemester === 1;
      if (s.semester === 2) return targetSemester === 2;
      if (s.term === 1) return targetSemester === 1;
      if (s.term === 2 || s.term === 3) return targetSemester === 2;
      return getStandardShsSemester(s.subject_name, gradeLevelNum) === targetSemester;
    });

    // Strict learner-specific & elective conflict filtering for SF10
    candidateSubjects = candidateSubjects.filter(s => {
      const actualSubject = subjects.find(sub => sub.id === s.id || isMatchingSubject(s.subject_name, sub.id, sub.subject_name)) || s;
      return isStudentEligibleForSectionSubject(student.lrn, studentSection, actualSubject, subjects);
    });

    return candidateSubjects.map(dbSubject => {
      const getGrade = (q: number) => {
        const matchRecord = (r: ClassRecord) =>
          (r.student_lrn === student.lrn || String(r.student_lrn).trim() === String(student.lrn).trim()) &&
          (r.subject_id === dbSubject.id || isMatchingSubject(dbSubject.subject_name, r.subject_id, r.subject_name)) &&
          Number(r.quarter) === q &&
          (!schoolYear || !r.school_year || r.school_year === schoolYear);

        // Priority 1: Official consolidated gradingSheetRecords (transmuted final grade)
        const gRec = gradingSheetRecords.find(matchRecord);
        if (gRec && gRec.final_grade && Number(gRec.final_grade) > 0) {
          return Math.round(Number(gRec.final_grade));
        }

        // Priority 2: Direct teacher classRecords fallback
        const cRec = classRecords.find(matchRecord);
        if (cRec && cRec.final_grade && Number(cRec.final_grade) > 0) {
          return Math.round(Number(cRec.final_grade));
        }

        return 0;
      };

      // Map quarter grades appropriately based on semester
      let q1 = 0;
      let q2 = 0;
      if (targetSemester === 1) {
        q1 = getGrade(1);
        q2 = getGrade(2);
      } else {
        // Semester 2: Quarter 3/4 in 4-quarter mode, or Term 2/3 in 3-term mode
        const g4 = getGrade(4);
        const g3 = getGrade(3);
        const g2 = getGrade(2);
        if (g4 > 0) {
          q1 = g3 > 0 ? g3 : g2;
          q2 = g4;
        } else {
          q1 = g2 > 0 ? g2 : g3;
          q2 = g3 > 0 && q1 !== g3 ? g3 : 0;
        }
      }

      let finalRating = 0;
      if (q1 > 0 && q2 > 0) {
        finalRating = Math.round((q1 + q2) / 2);
      } else {
        finalRating = q1 || q2 || 0;
      }

      return {
        subjectName: dbSubject.subject_name,
        subjectCode: dbSubject.subject_code || '',
        quarter1Grade: q1 > 0 ? String(q1) : '',
        quarter2Grade: q2 > 0 ? String(q2) : '',
        quarter3Grade: '',
        finalGrade: finalRating > 0 ? String(finalRating) : '',
        remarks: finalRating >= 75 ? 'PASSED' : finalRating > 0 ? 'FAILED' : '',
      };
    });
  };

  const createScholasticBlock = (gradeLevelNum: 11 | 12, semesterNum: 1 | 2) => {
    const semSubjects = buildSemesterAcademicRecord(gradeLevelNum, semesterNum);
    let sum = 0;
    let count = 0;
    semSubjects.forEach(s => {
      const g = Number(s.finalGrade);
      if (g > 0) {
        sum += g;
        count++;
      }
    });
    const genAvg = count > 0 ? String(Math.round(sum / count)) : '';
    const genAvgRem = genAvg ? (Number(genAvg) >= 75 ? 'PROMOTED' : 'RETAINED') : '';

    return {
      gradeLevel: gradeLevelNum,
      semester: semesterNum,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      track: effectiveTrack,
      strand: effectiveStrand,
      section: studentSection?.section_name || '',
      schoolYear: schoolYear,
      adviser: adviserName,
      subjects: semSubjects,
      generalAverage: genAvg,
      generalAverageRemarks: genAvgRem,
    };
  };

  const scholasticRecords = [
    createScholasticBlock(11, 1),
    createScholasticBlock(11, 2),
    createScholasticBlock(12, 1),
    createScholasticBlock(12, 2)
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
