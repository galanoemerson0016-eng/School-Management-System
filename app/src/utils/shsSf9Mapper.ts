import type { Student, SchoolProfile, Section, ClassRecord, Subject } from '../types';
import { formatLearnerName } from './student-name';
import { getShsSubjectUnitInfo } from '../lib/curriculum';

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
 * Implements DepEd Order No. 017, s. 2026 Annex E Unit-Weighted Grading.
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
  const isSHS = gradeLevelNum === 11 || gradeLevelNum === 12;
  const sectionTrack = (sectionObj.track || student.track || '').toLowerCase();
  const taughtRaw = sectionObj.taught_subjects || [];
  const taughtNorms = taughtRaw.map(s => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
  const taughtSet = new Set(taughtNorms);

  // Filter subjects taught in this Grade 11 or 12 section
  let candidateSubjects = subjects.filter(
    s => (s.section_id === sectionObj.id || (!s.section_id && parseInt(s.grade_level.replace(/\D/g, '')) === gradeLevelNum)) && s.term !== 'none'
  );

  // Prioritize direct section subjects over generic ones
  candidateSubjects.sort((a, b) => {
    const aDirect = a.section_id === sectionObj.id ? 1 : 0;
    const bDirect = b.section_id === sectionObj.id ? 1 : 0;
    return bDirect - aDirect;
  });

  if (taughtSet.size > 0) {
    candidateSubjects = candidateSubjects.filter(s => {
      const unitInfo = getShsSubjectUnitInfo(s.subject_name, sectionObj.section_grade_level);
      if (unitInfo.category === 'core') return true;
      const sNorm = s.subject_name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (taughtSet.has(sNorm)) return true;
      for (const t of taughtSet) {
        if (sNorm === t || sNorm.includes(t) || t.includes(sNorm)) return true;
      }
      return false;
    });
  } else if (isSHS && sectionTrack) {
    candidateSubjects = candidateSubjects.filter(s => {
      const unitInfo = getShsSubjectUnitInfo(s.subject_name, sectionObj.section_grade_level);
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

  const sectionSubjects = uniqueShsSubjects;

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
        let sum = 0;
        let count = 0;
        if (t1 > 0) { sum += t1; count++; }
        if (t2 > 0) { sum += t2; count++; }
        if (t3 > 0) { sum += t3; count++; }
        final = count > 0 ? Math.round(sum / count) : 0;
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

  // Compute General Average using DO 017 Annex E Unit System
  let genT1Total = 0, genT1Units = 0;
  let genT2Total = 0, genT2Units = 0;
  let genT3Total = 0, genT3Units = 0;
  let genFinalTotal = 0, genFinalUnits = 0;

  subjectGrades.forEach(sg => {
    const isExcluded = sg.subjectName.startsWith('*') || 
                      sg.subjectName.toLowerCase().includes('arabic language') || 
                      sg.subjectName.toLowerCase().includes('islamic values');
    if (isExcluded) return;

    const unitInfo = getShsSubjectUnitInfo(sg.subjectName, sectionObj.section_grade_level);
    const termUnits = unitInfo.unitsPerTerm;
    const yearUnits = unitInfo.yearUnits;

    if (sg.grades.t1 > 0) {
      genT1Total += sg.grades.t1 * termUnits;
      genT1Units += termUnits;
    }
    if (sg.grades.t2 > 0) {
      genT2Total += sg.grades.t2 * termUnits;
      genT2Units += termUnits;
    }
    if (sg.grades.t3 > 0) {
      genT3Total += sg.grades.t3 * termUnits;
      genT3Units += termUnits;
    }
    if (sg.grades.final > 0) {
      genFinalTotal += sg.grades.final * yearUnits;
      genFinalUnits += yearUnits;
    }
  });

  const generalAverage = {
    t1: genT1Units > 0 ? Math.round(genT1Total / genT1Units) : 0,
    t2: genT2Units > 0 ? Math.round(genT2Total / genT2Units) : 0,
    t3: genT3Units > 0 ? Math.round(genT3Total / genT3Units) : 0,
    final: genFinalUnits > 0 ? Math.round(genFinalTotal / genFinalUnits) : 0,
  };

  const STRAND_MAPPING: Record<string, string> = {
    'STEM': 'Science, Technology, Engineering, and Mathematics',
    'ABM': 'Accountancy, Business, and Management',
    'HUMSS': 'Humanities and Social Sciences',
    'GAS': 'General Academic Strand',
    'ICT': 'Information and Communications Technology'
  };

  const rawStrand = student.strand || sectionObj.strand || '';
  const displayStrand = STRAND_MAPPING[rawStrand] || rawStrand;

  return {
    student: {
      lrn: (student.lrn && !student.lrn.startsWith('TEMP-')) ? student.lrn : '',
      fullName: formatLearnerName(student).toUpperCase(),
      gender: student.gender,
      age: student.age,
      track: student.track || sectionObj.track || '',
      strand: displayStrand || 'SSHS',
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
    generalAverage,
  };
}
