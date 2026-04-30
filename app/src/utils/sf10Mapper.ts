import type { Student, SchoolProfile, Section, ClassRecord, Subject, User, SchoolCurriculum, CurriculumSubject } from '../types';
import { getSubjectsForGrade, normalizeSubjectName, getSF10RowsForGrade } from '../lib/subjectConfig';

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
  { label: ' ', key: 'extra1' },
  { label: ' ', key: 'extra2' },
  { label: ' ', key: 'extra3' },
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
  { label: ' ', key: 'extra1' },
  { label: ' ', key: 'extra2' },
  { label: ' ', key: 'extra3' },
];

/**
 * Get JHS subjects for a given grade level
 * Uses custom curriculum if available, otherwise returns standard subjects
 */
export function getStandardJhsSubjects(gradeLevel: number, customCurriculum?: SchoolCurriculum) {
  return getSF10RowsForGrade(gradeLevel, customCurriculum);
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
  const name = normalizeSubjectName(subjectName);

  let key: string | null = null;
  if (name.includes('filipino')) key = 'filipino';
  else if (name.includes('english')) key = 'english';
  else if (name.includes('mathematics') || name.includes('math')) key = 'mathematics';
  else if (name.includes('science')) key = 'science';
  else if (name.includes('aralingpanlipunan') || name === 'ap') key = 'ap';
  else if (name.includes('valueseducation') || name.includes('values')) key = 'valuesEducation';
  else if (name.includes('edukasyon') || name === 'esp' || name.includes('pagpapakatao')) key = 'esp';
  else if (name.includes('technologyandlivelihood') || name.includes('tle')) key = 'tle';
  else if (name.includes('musicandarts') || name.includes('musicarts')) key = 'musicAndArts';
  else if (name.includes('physicaleducationandhealth') || name.includes('peandhealth') || name.includes('pehealth')) key = 'peAndHealth';
  else if (name.includes('mapeh')) key = 'mapeh';
  else if (name.includes('music') || name.includes('musika')) key = 'music';
  else if (name.includes('arts') || name.includes('sining')) key = 'arts';
  else if (name.includes('physicaleducation') || name === 'pe' || name.includes('pe.')) key = 'physicalEducation';
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

  // Resolve adviser name: Priority 1: School Profile (Source of Truth), then fallback
  const profileAdviser = (profile?.adviser_name || '').trim();
  const isGenericProfile = profileAdviser.toLowerCase() === 'admin' || profileAdviser === '';
  
  let adviserName = '';
  
  // If the student's section is found, use the profile name as the primary source of truth
  // especially if the section adviser name is a placeholder
  if (!isGenericProfile) {
    adviserName = profileAdviser;
  } else if (studentSection?.adviser_id) {
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
    const augmentGradeSubjects = (grade: number, currentList: CurriculumSubject[] | undefined) => {
      // Get all subjects for this grade from the database
      let dbSubjectsForGrade = dbSubjects.filter(s => {
        const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
        return subjectGradeNum === grade;
      });

      // CRITICAL FIX: Deduplicate by name to avoid repeating subjects from different sections
      // However, if it's the current grade, we prioritize the student's current section
      if (grade === currentGradeNum && studentSection) {
        dbSubjectsForGrade = dbSubjectsForGrade.filter(s => s.section_id === studentSection.id);
      } else {
        // For other grades, just deduplicate by normalized name
        const seen = new Set<string>();
        dbSubjectsForGrade = dbSubjectsForGrade.filter(s => {
          const norm = normalizeSubjectName(s.subject_name);
          if (seen.has(norm)) return false;
          seen.add(norm);
          return true;
        });
      }

      // If we have manual selections for the current grade, use that order!
      if (grade === currentGradeNum && studentSection?.section_metadata?.sf9SubjectSelections) {
          const selections = studentSection.section_metadata.sf9SubjectSelections;
          const orderedList: CurriculumSubject[] = [];
          
          for (let i = 0; i < 13; i++) {
              const subjId = selections[i];
              if (subjId && subjId !== 'none') {
                  const subj = dbSubjects.find(s => s.id === subjId);
                  if (subj) {
                      orderedList.push({ name: subj.subject_name, code: subj.subject_code || '' });
                      
                      // Handle MAPEH components auto-insertion logic for SF10
                      if (normalizeSubjectName(subj.subject_name) === 'mapeh') {
                          const components = dbSubjects.filter(s => {
                              if (s.section_id !== studentSection.id) return false;
                              const n = normalizeSubjectName(s.subject_name);
                              return n.includes('musicandarts') || n.includes('musicarts') || 
                                     n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth');
                          });
                          components.forEach(c => orderedList.push({ name: c.subject_name, code: c.subject_code || 'MAPEH' }));
                      }
                  }
              }
          }
          
          if (orderedList.length > 0) return orderedList;
      }

      if (dbSubjectsForGrade.length > 0) {
        const newList: CurriculumSubject[] = dbSubjectsForGrade.map(s => ({
          name: s.subject_name,
          code: s.subject_code || ''
        }));

        // Ensure MAPEH header row exists if components are present
        const hasMapehHeader = newList.some(s => normalizeSubjectName(s.name) === 'mapeh');
        const hasMapehComponents = newList.some(s => {
          const n = normalizeSubjectName(s.name);
          return n.includes('musicandarts') || n.includes('musicarts') || 
                 n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth');
        });

        if (hasMapehComponents && !hasMapehHeader) {
          newList.push({ name: 'MAPEH' });
        }

        return newList;
      }

      return currentList ? [...currentList] : [];
    };

    const nextCurriculum: SchoolCurriculum = profile.curriculum ? { ...profile.curriculum } : { school_id: profile.school_id };

    nextCurriculum.grade_7_subjects = augmentGradeSubjects(7, nextCurriculum.grade_7_subjects);
    nextCurriculum.grade_8_subjects = augmentGradeSubjects(8, nextCurriculum.grade_8_subjects);
    nextCurriculum.grade_9_subjects = augmentGradeSubjects(9, nextCurriculum.grade_9_subjects);
    nextCurriculum.grade_10_subjects = augmentGradeSubjects(10, nextCurriculum.grade_10_subjects);

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

      // Compute MAPEH from components
      ['q1', 'q2', 'q3', 'q4'].forEach(qKey => {
        const q = qKey as 'q1' | 'q2' | 'q3' | 'q4';

        const musicArts = getSubjectGradeEntry(subjectsData, 'musicAndArts');
        const peHealth = getSubjectGradeEntry(subjectsData, 'peAndHealth');
        const mapehRow = getSubjectGradeEntry(subjectsData, 'mapeh');
        
        let maGrade = Number(musicArts?.[q]) || 0;
        let peGrade = Number(peHealth?.[q]) || 0;

        if (mapehRow) {
          if (maGrade > 0 && peGrade > 0) {
            mapehRow[q] = String(Math.round((maGrade + peGrade) / 2));
          } else if (maGrade > 0) {
            mapehRow[q] = String(maGrade);
          } else if (peGrade > 0) {
            mapehRow[q] = String(peGrade);
          }
        }
      });

      // Compute final ratings and general average
      let totalFinal = 0;
      let countFinal = 0;

      // Identify subjects that should be included in the General Average
      // Rule: Include all main subjects (including MAPEH header), but exclude individual components.
      const excludedFromGPA = [
        'music', 'arts', 'physicalEducation', 'health', 
        'musicAndArts', 'peAndHealth', 'musicarts', 'pehealth'
      ];

      for (const s of standardSubjectsForGrade) {
        const sub = getSubjectGradeEntry(subjectsData, s.key);
        if (!sub) continue;

        const terms = [sub.q1, sub.q2, sub.q3].map(Number).filter(v => v > 0);
        const isComplete = terms.length === 3;

        if (isComplete) {
          const avg = Math.round(terms.reduce((a: number, b: number) => a + b, 0) / terms.length);
          sub.finalRating = String(avg);
          sub.remarks = avg >= 75 ? 'PASSED' : 'FAILED';

          // GPA Calculation
          // Include main subjects and MAPEH (even if it's a header)
          const isMapeh = s.key === 'mapeh';
          const isStandardSubject = !excludedFromGPA.includes(s.key) && (!s.isHeader || isMapeh);
          
          if (isStandardSubject && !s.key.startsWith('extra_reserved')) {
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
        generalAverage: student.average_grade || '',
        citation: student.citation || '',
      },
      nameOfElementarySchool: student.elementary_school || '',
      schoolId: student.elementary_school_id || '',
      addressOfSchool: student.elementary_school_address || '',
      peptPasser: {
        checked: !!student.pept_rating,
        rating: student.pept_rating || '',
      },
      alsPasser: {
        checked: !!student.als_rating,
        rating: student.als_rating || '',
      },
      other: {
        checked: !!student.other_credentials,
        specify: student.other_credentials || '',
      },
      // Keep these for direct lookup if needed
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
