import type { Student, SchoolProfile, Section, ClassRecord, Subject, User, SchoolCurriculum } from '../types';
import { getSubjectsForGrade, normalizeSubjectName } from '../lib/subjectConfig';

/**
 * Standard DepEd JHS Subject List (SF10)
 * These are the official learning areas for Junior High School.
 */
const STANDARD_JHS_SUBJECTS_G79 = [
  { label: 'Filipino', key: 'filipino' },
  { label: 'English', key: 'english' },
  { label: 'Mathematics', key: 'mathematics' },
  { label: 'Science', key: 'science' },
  { label: 'Araling Panlipunan (AP)', key: 'ap' },
  { label: 'Values Education', key: 'valuesEducation' },
  { label: 'Technology and Livelihood Education (TLE)', key: 'tle' },
  { label: 'MAPEH', key: 'mapeh' },
  { label: 'Music and Arts', key: 'musicAndArts' },
  { label: 'Physical Education and Health', key: 'peAndHealth' },
  { label: 'Specialization', key: 'specialization' },
];

const STANDARD_JHS_SUBJECTS_G10 = [
  { label: 'Filipino', key: 'filipino' },
  { label: 'English', key: 'english' },
  { label: 'Mathematics', key: 'mathematics' },
  { label: 'Science', key: 'science' },
  { label: 'Araling Panlipunan (AP)', key: 'ap' },
  { label: 'Values Education', key: 'valuesEducation' },
  { label: 'Technology and Livelihood Education (TLE)', key: 'tle' },
  { label: 'MAPEH', key: 'mapeh' },
  { label: 'Music and Arts', key: 'musicAndArts' },
  { label: 'Physical Education and Health', key: 'peAndHealth' },
  { label: 'Specialization', key: 'specialization' },
];

/**
 * Get JHS subjects for a given grade level
 * Uses custom curriculum if available, otherwise returns standard subjects
 */
export function getStandardJhsSubjects(gradeLevel: number, customCurriculum?: SchoolCurriculum) {
  if (customCurriculum) {
    const curriculumSubjects = getSubjectsForGrade(gradeLevel, customCurriculum);
    // Convert custom curriculum format to SF10 format with auto-generated keys
    return curriculumSubjects.map((subj, idx) => ({
      label: subj.name,
      key: `subject_${idx}` // Auto-generate keys for custom subjects
    }));
  }

  if (parseInt(String(gradeLevel)) >= 7 && parseInt(String(gradeLevel)) <= 9) {
    return STANDARD_JHS_SUBJECTS_G79;
  }
  return STANDARD_JHS_SUBJECTS_G10;
}

/** Creates a blank subject grade entry */
function blankSubjectGrade() {
  return { q1: '', q2: '', q3: '', q4: '', finalRating: '', remarks: '' };
}

type SubjectGradeEntry = ReturnType<typeof blankSubjectGrade>;
type SubjectsData = Record<string, SubjectGradeEntry | string>;

function getSubjectGradeEntry(subjectsData: SubjectsData, key: string): SubjectGradeEntry | undefined {
  const value = subjectsData[key];
  return value && typeof value !== 'string' ? value : undefined;
}

/** Creates the full blank subjects object for a specific curriculum */
function blankSubjects(gradeLevel: number, customCurriculum?: SchoolCurriculum) {
  const subjects: SubjectsData = {};
  for (const s of getStandardJhsSubjects(gradeLevel, customCurriculum)) {
    subjects[s.key] = blankSubjectGrade();
  }
  subjects.generalAverage = '';
  return subjects;
}

/**
 * Tries to match a subject name from the database to a standard SF10 subject key.
 * Returns the matched key or null if no match.
 */
function matchSubjectKey(subjectName: string, subjectsData: SubjectsData): string | null {
  const name = subjectName.toLowerCase().trim();

  let key: string | null = null;
  if (name.includes('filipino')) key = 'filipino';
  else if (name.includes('english')) key = 'english';
  else if (name.includes('math')) key = 'mathematics';
  else if (name.includes('science')) key = 'science';
  else if (name.includes('araling') || name === 'ap' || name.includes('panlipunan')) key = 'ap';
  else if (name.includes('values education') || name.includes('values')) key = 'valuesEducation';
  else if (name.includes('edukasyon') || name === 'esp' || name.includes('pagpapakatao')) key = 'esp';
  else if (name.includes('tle') || name.includes('technology') || name.includes('livelihood')) key = 'tle';
  else if (name === 'mapeh') key = 'mapeh';
  else if (name.includes('music and arts')) key = 'musicAndArts';
  else if (name.includes('physical education and health')) key = 'peAndHealth';
  else if (name.includes('music') || name.includes('musika')) key = 'music';
  else if (name.includes('arts') || name.includes('sining')) key = 'arts';
  else if (name.includes('physical education') || name === 'pe' || name.includes('p.e.')) key = 'physicalEducation';
  else if (name.includes('health') || name.includes('kalusugan')) key = 'health';
  else if (name.includes('specialization')) key = 'specialization';

  if (!key) return null;

  // Fallback: If key is 'valuesEducation' but doesn't exist in subjectsData, try 'esp' and vice-versa
  if (key === 'valuesEducation' && !subjectsData[key] && subjectsData['esp']) return 'esp';
  if (key === 'esp' && !subjectsData[key] && subjectsData['valuesEducation']) return 'valuesEducation';

  return key;
}

interface MapperParams {
  student: Student;
  profile: SchoolProfile;
  schoolYear: string;
  sections: Section[];
  teachers?: User[];
  subjects?: Subject[];
  gradingSheetRecords?: ClassRecord[];
}

/**
 * Maps student and school data to the nested structure required by SF10SpecRenderer.
 * 
 * - Populates school info (name, ID, district, division, region) for all grade blocks
 * - Populates section and adviser from sections data for the student's current grade
 * - Uses the standard DepEd JHS subject list for all blocks
 * - Grades are left blank unless actual classRecords are provided
 */
export function mapStudentToSpecData({
  student,
  profile,
  schoolYear,
  sections,
  teachers = [],
  gradingSheetRecords = [],
  subjects: dbSubjects = [],
}: MapperParams) {

  // Find the student's current section record for adviser info
  const studentSection = sections.find(
    s => s.id === student.student_section || s.section_name === student.student_section
  );
  const resolvedSectionName = studentSection?.section_name || student.student_section || '';

  // Resolve adviser name: first try adviser_id -> teachers lookup, then fallback to adviser_name
  let adviserName = '';
  if (studentSection?.adviser_id) {
    const teacher = teachers.find(t => t.uid === studentSection.adviser_id);
    adviserName = teacher?.displayName || '';
  }
  if (!adviserName && studentSection?.adviser_name) {
    adviserName = studentSection.adviser_name;
  }

  // Parse the student's current grade level number
  const currentGradeNum = parseInt(student.grade_level?.toString().replace(/\D/g, '') || '0');

  // If school curriculum exists but doesn't yet include Specialization,
  // augment it using actual subject entries found in the database per grade.
  const effectiveCurriculum: SchoolCurriculum | undefined = (() => {
    if (!profile.curriculum) return undefined;

    const hasSpecializationInGrade = (grade: number) =>
      dbSubjects.some((subject) => {
        const subjectGradeNum = parseInt(subject.grade_level?.replace(/\D/g, '') || '0');
        return subjectGradeNum === grade && normalizeSubjectName(subject.subject_name) === 'specialization';
      });

    const addSpecializationIfNeeded = (subjectsList: Array<{ name: string; code?: string }>) => {
      const hasSpecialization = subjectsList.some(
        (subject) => normalizeSubjectName(subject.name) === 'specialization'
      );
      if (!hasSpecialization) {
        subjectsList.push({ name: 'Specialization', code: '' });
      }
      return subjectsList;
    };

    const nextCurriculum: SchoolCurriculum = { ...profile.curriculum };

    if (hasSpecializationInGrade(7) && nextCurriculum.grade_7_subjects?.length) {
      nextCurriculum.grade_7_subjects = addSpecializationIfNeeded([...nextCurriculum.grade_7_subjects]);
    }
    if (hasSpecializationInGrade(8) && nextCurriculum.grade_8_subjects?.length) {
      nextCurriculum.grade_8_subjects = addSpecializationIfNeeded([...nextCurriculum.grade_8_subjects]);
    }
    if (hasSpecializationInGrade(9) && nextCurriculum.grade_9_subjects?.length) {
      nextCurriculum.grade_9_subjects = addSpecializationIfNeeded([...nextCurriculum.grade_9_subjects]);
    }
    if (hasSpecializationInGrade(10) && nextCurriculum.grade_10_subjects?.length) {
      nextCurriculum.grade_10_subjects = addSpecializationIfNeeded([...nextCurriculum.grade_10_subjects]);
    }

    return nextCurriculum;
  })();

  /**
   * Build a scholastic record block for a given grade level.
   * School info is always populated. Section/adviser are only populated
   * for the student's current grade level (since we don't have historical records).
   * Grades are blank unless classRecords contain data for this student.
   */
  function buildScholasticBlock(gradeLevel: number) {
    const isCurrentGrade = gradeLevel === currentGradeNum;

    // Start with blank subjects
    const subjectsData = blankSubjects(gradeLevel, effectiveCurriculum);
    const standardSubjectsForGrade = getStandardJhsSubjects(gradeLevel, effectiveCurriculum);

    // If we have actual grading sheet records for this student, try to fill in real grades
    if (gradingSheetRecords.length > 0) {
      const studentRecords = gradingSheetRecords.filter(r => {
        if (r.student_lrn !== student.lrn) return false;
        const dbSubject = dbSubjects.find(s => s.id === r.subject_id);
        if (!dbSubject) return false;
        // Ensure the subject belongs to the grade level being built for this block
        const subjectGradeNum = parseInt(dbSubject.grade_level.replace(/\D/g, '')) || 0;
        return subjectGradeNum === gradeLevel;
      });

      // Group records by subject for each term
      for (const record of studentRecords) {
        const dbSubject = dbSubjects.find(s => s.id === record.subject_id);
        if (!dbSubject) continue;

        let sf10Key = matchSubjectKey(dbSubject.subject_name, subjectsData);

        // Fallback for dynamic/custom curriculum keys (e.g. subject_0, subject_10)
        if ((!sf10Key || !subjectsData[sf10Key]) && effectiveCurriculum) {
          const matchedCustomSubject = standardSubjectsForGrade.find(
            s => normalizeSubjectName(s.label) === normalizeSubjectName(dbSubject.subject_name)
          );
          if (matchedCustomSubject?.key) {
            sf10Key = matchedCustomSubject.key;
          }
        }

        if (!sf10Key || !subjectsData[sf10Key]) continue;
        const mappedSubject = getSubjectGradeEntry(subjectsData, sf10Key);
        if (!mappedSubject) continue;

        const quarter = record.quarter;
        const grade = record.final_grade;
        // Verify it isn't an invalid/empty grade or 0
        if (grade && Number(grade) > 0) {
          const qKey = `q${quarter}` as 'q1' | 'q2' | 'q3' | 'q4';
          mappedSubject[qKey] = String(Math.round(Number(grade)));
        }
      }

      // Special handling for MAPEH using preferred combined components, with fallback for legacy split records.
      ['q1', 'q2', 'q3', 'q4'].forEach(qKey => {
        const q = qKey as 'q1' | 'q2' | 'q3' | 'q4';

        // Matatag Curriculum Correction: MAPEH = (Music and Arts + PE and Health) / 2
        const musicArts = getSubjectGradeEntry(subjectsData, 'musicAndArts');
        const peHealth = getSubjectGradeEntry(subjectsData, 'peAndHealth');
        
        let maGrade = Number(musicArts?.[q]) || 0;
        let peGrade = Number(peHealth?.[q]) || 0;

        // Fallback for independent components if the composite subjects are missing
        if (maGrade <= 0) {
          const m = Number(getSubjectGradeEntry(subjectsData, 'music')?.[q]) || 0;
          const a = Number(getSubjectGradeEntry(subjectsData, 'arts')?.[q]) || 0;
          if (m > 0 && a > 0) maGrade = Math.round((m + a) / 2);
          else if (m > 0) maGrade = m;
          else if (a > 0) maGrade = a;
        }

        if (peGrade <= 0) {
          const p = Number(getSubjectGradeEntry(subjectsData, 'physicalEducation')?.[q]) || 0;
          const h = Number(getSubjectGradeEntry(subjectsData, 'health')?.[q]) || 0;
          if (p > 0 && h > 0) peGrade = Math.round((p + h) / 2);
          else if (p > 0) peGrade = p;
          else if (h > 0) peGrade = h;
        }

        const mapeh = getSubjectGradeEntry(subjectsData, 'mapeh');
        if (mapeh) {
          if (maGrade > 0 && peGrade > 0) {
            mapeh[q] = String(Math.round((maGrade + peGrade) / 2));
          } else if (maGrade > 0) {
            mapeh[q] = String(maGrade);
          } else if (peGrade > 0) {
            mapeh[q] = String(peGrade);
          }
        }
      });

      // Compute final ratings and general average for subjects that have grades
      let totalFinal = 0;
      let countFinal = 0;

      for (const s of standardSubjectsForGrade) {
        const sub = getSubjectGradeEntry(subjectsData, s.key);
        if (!sub) continue;
        const terms = [sub.q1, sub.q2, sub.q3].map(Number).filter(v => v > 0);
        if (terms.length === 3) {
          const avg = Math.round(terms.reduce((a: number, b: number) => a + b, 0) / 3);
          sub.finalRating = String(avg);
          sub.remarks = avg >= 75 ? 'PASSED' : 'FAILED';
          // Only count main subjects (not MAPEH sub-components) for gen average
          const subComponents = ['music', 'arts', 'physicalEducation', 'health', 'musicAndArts', 'peAndHealth'];
          if (!subComponents.includes(s.key)) {
            totalFinal += avg;
            countFinal++;
          }
        }
      }

      if (countFinal > 0) {
        subjectsData.generalAverage = String(Math.round(totalFinal / countFinal));
      }
    }

    return {
      schoolName: isCurrentGrade ? (profile.name || '') : '',
      schoolId: isCurrentGrade ? (profile.school_id || '') : '',
      district: isCurrentGrade ? (profile.district || '') : '',
      division: isCurrentGrade ? (profile.division || '') : '',
      region: isCurrentGrade ? (profile.region || '') : '',
      gradeLevel: isCurrentGrade ? String(gradeLevel) : '',
      gradeLevelNum: gradeLevel,
      section: isCurrentGrade ? (resolvedSectionName || '') : '',
      schoolYear: isCurrentGrade ? schoolYear : '',
      adviserTeacher: isCurrentGrade ? adviserName : '',
      signature: '',
      subjects: subjectsData,
      remedial: {
        fromDate: '',
        toDate: '',
        rows: [
          { learningArea: '', finalRating: '', remedialClassMark: '', recomputedFinalGrade: '', remarks: '' },
          { learningArea: '', finalRating: '', remedialClassMark: '', recomputedFinalGrade: '', remarks: '' },
        ],
      },
    };
  }

  // Build 4 blocks for Grades 7-10, plus a 5th empty overflow block
  const scholasticRecords = [
    buildScholasticBlock(7),
    buildScholasticBlock(8),
    buildScholasticBlock(9),
    buildScholasticBlock(10),
    {
      schoolName: '',
      schoolId: '',
      district: '',
      division: '',
      region: '',
      gradeLevel: '',
      section: '',
      schoolYear: '',
      adviserTeacher: '',
      signature: '',
      subjects: blankSubjects(11, effectiveCurriculum), // Just an empty one
      remedial: {
        fromDate: '',
        toDate: '',
        rows: [
          { learningArea: '', finalRating: '', remedialClassMark: '', recomputedFinalGrade: '', remarks: '' },
          { learningArea: '', finalRating: '', remedialClassMark: '', recomputedFinalGrade: '', remarks: '' },
        ],
      },
    },
  ];

  return {
    curriculum: effectiveCurriculum,
    learner: {
      lastName: student.last_name?.toUpperCase() || '',
      firstName: student.first_name?.toUpperCase() || '',
      nameExtension: (student.name_extension || '').toUpperCase(),
      middleName: (student.middle_name || '').toUpperCase(),
      lrn: student.lrn || '',
      birthdate: student.birthday || '',
      sex: student.gender || '',
    },
    eligibility: {
      elementaryCompleter: {
        checked: !!student.elementary_school,
      },
      generalAverage: student.average_grade || '',
      citation: student.citation || '',
      elementarySchoolName: student.elementary_school || '',
      elementarySchoolId: student.elementary_school_id || '',
      elementarySchoolAddress: student.elementary_school_address || '',
      pept: {
        checked: !!student.pept_rating,
        rating: student.pept_rating || '',
        examDate: student.pept_date || '',
      },
      als: {
        checked: !!student.als_rating,
        rating: student.als_rating || '',
        testingCenter: student.testing_center || '',
      },
      others: {
        checked: !!student.other_credentials,
        specification: student.other_credentials || '',
      },
      // Aliases for the renderer
      dateOfExamination: student.pept_date || '',
      testingCenter: student.testing_center || '',
    },
    scholasticRecords,
    certification: {
      page1: {
        recordOf: '',
        lrn: '',
        admissionGrade: '',
        schoolName: '',
        schoolId: '',
        lastSchoolYearAttended: '',
        date: '',
        principalSignatureName: '',
        schoolSeal: '',
      },
      page2: {
        recordOf: '',
        lrn: '',
        admissionGrade: '',
        schoolName: '',
        schoolId: '',
        lastSchoolYearAttended: '',
        date: '',
        principalSignatureName: '',
        schoolSeal: '',
      },
    },
  };
}

/**
 * Legacy support for Excel-based structure if needed.
 */
export function getSF10LegacyMapping(_student: Student, _profile: SchoolProfile, _schoolYear: string, _sheetName: 'Front' | 'Back') {
  // Keeping this for potential fallback or reference
  void _student;
  void _profile;
  void _schoolYear;
  void _sheetName;
  return {}; 
}
