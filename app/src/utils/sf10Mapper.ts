import type { Student, SchoolProfile, Section, ClassRecord, Subject, User, SchoolCurriculum, CurriculumSubject } from '../types';
import { normalizeSubjectName, getSF10RowsForGrade, sortSubjects } from '../lib/subjectConfig';
import { formatLearnerName } from './student-name';
import { resolveStudentQuarterGrade } from './grading-helpers';
import { useAppStore } from '../stores';

/**
 * Standard DepEd JHS Subject List (SF10)
 * These are the official learning areas for Junior High School.
 */


/**
 * Get JHS subjects for a given grade level
 * Uses custom curriculum if available, otherwise returns standard subjects
 */
export function getStandardJhsSubjects(gradeLevel: number, customCurriculum?: SchoolCurriculum, options?: { useOldCurriculum?: boolean }) {
  return getSF10RowsForGrade(gradeLevel, customCurriculum, options);
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
function blankSubjects(gradeLevel: number, customCurriculum?: SchoolCurriculum, options?: { useOldCurriculum?: boolean }) {
  const subjects: SubjectsData = {};
  for (const s of getStandardJhsSubjects(gradeLevel, customCurriculum, options)) {
    subjects[s.key] = blankSubjectGrade();
  }
  subjects.generalAverage = '';
  subjects.generalAverageQ1 = '';
  subjects.generalAverageQ2 = '';
  subjects.generalAverageQ3 = '';
  subjects.generalAverageQ4 = '';
  return subjects;
}
/**
 * Tries to match a subject name from the database to a standard SF10 subject key.
 * Returns the matched key or null if no match.
 */
function matchSubjectKey(subjectName: string, subjectsData: SubjectsData): string | null {
  const name = normalizeSubjectName(subjectName);

  let key: string | null = null;
  if (name.includes('arabic')) key = 'arabic';
  else if (name.includes('islamic')) key = 'islamic';
  else if (name.includes('filipino')) key = 'filipino';
  else if (name.includes('english')) key = 'english';
  else if (name.includes('mathematics') || name.includes('math')) key = 'mathematics';
  else if (name.includes('science')) key = 'science';
  else if (name.includes('aralingpanlipunan') || name === 'ap') key = 'ap';
  else if (name.includes('gmrc') || name.includes('goodmanners')) key = 'gmrc';
  else if (name.includes('valueseducation') || name.includes('values')) key = 'valuesEducation';
  else if (name.includes('edukasyon') || name === 'esp' || name.includes('pagpapakatao')) key = 'esp';
  else if (name.includes('epp') || name.includes('tle') || name.includes('technologyandlivelihood')) key = 'tle';
  else if (name.includes('ict')) key = 'ict';
  else if (name.includes('musicandarts') || name.includes('musicarts') || (name.includes('music') && name.includes('arts'))) key = 'musicAndArts';
  else if (name.includes('physicaleducationandhealth') || name.includes('physicaleducationhealth') || name.includes('peandhealth') || name.includes('pehealth') || (name.includes('physicaleducation') && name.includes('health')) || (name.includes('pe') && name.includes('health'))) key = 'peAndHealth';
  else if (name.includes('mapeh')) key = 'mapeh';
  else if (name.includes('music') || name.includes('musika')) key = 'music';
  else if (name.includes('arts') || name.includes('sining')) key = 'arts';
  else if (name.includes('physicaleducation') || name === 'pe' || name.includes('pe.')) key = 'physicalEducation';
  else if (name.includes('health') || name.includes('kalusugan')) key = 'health';
  else if (name.includes('specialization')) key = 'specialization';


  if (!key) return null;

  // Fallback: If key is 'valuesEducation' but doesn't exist in subjectsData, try 'esp' or 'gmrc' and vice-versa
  if (key === 'valuesEducation' && !subjectsData[key]) {
      if (subjectsData['esp']) return 'esp';
      if (subjectsData['gmrc']) return 'gmrc';
  }
  if (key === 'gmrc' && !subjectsData[key]) {
      if (subjectsData['valuesEducation']) return 'valuesEducation';
      if (subjectsData['esp']) return 'esp';
  }
  if (key === 'esp' && !subjectsData[key]) {
      if (subjectsData['valuesEducation']) return 'valuesEducation';
      if (subjectsData['gmrc']) return 'gmrc';
  }

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
        return subjectGradeNum === grade && s.term !== 'none';
      });

      const seen = new Set<string>();
      if (grade === currentGradeNum && studentSection) {
        dbSubjectsForGrade = dbSubjectsForGrade.filter(s => {
          const isGeneric = !s.section_id;
          const isDirect = s.section_id === studentSection.id;
          return isGeneric || isDirect;
        });

        // Prioritize direct section subjects over generic ones
        dbSubjectsForGrade.sort((a, b) => {
          const aDirect = a.section_id === studentSection.id ? 1 : 0;
          const bDirect = b.section_id === studentSection.id ? 1 : 0;
          return bDirect - aDirect;
        });
      }

      // Final deduplication by name
      dbSubjectsForGrade = dbSubjectsForGrade.filter(s => {
        const norm = normalizeSubjectName(s.subject_name);
        if (seen.has(norm)) return false;
        seen.add(norm);
        return true;
      });

      // If we have manual selections for the current grade, use that order!
      const selections = studentSection?.section_metadata?.sf9SubjectSelections;
      const hasNumericKeys = selections && Object.keys(selections).some(k => /^\d+$/.test(k));
      if (grade === currentGradeNum && hasNumericKeys && selections) {
          const orderedList: CurriculumSubject[] = [];
          
          const seenOrdered = new Set<string>();
          for (let i = 0; i < 13; i++) {
              const subjId = selections[i];
              if (subjId && subjId !== 'none') {
                  const subj = dbSubjects.find(s => s.id === subjId);
                  if (subj) {
                      const norm = normalizeSubjectName(subj.subject_name);
                      if (seenOrdered.has(norm)) continue;
                      seenOrdered.add(norm);

                      orderedList.push({ name: subj.subject_name, code: subj.subject_code || '' });
                      
                      // Handle MAPEH components auto-insertion logic for SF10
                      if (norm === 'mapeh') {
                          const components = dbSubjects.filter(s => {
                              // Check if it's a section-specific subject OR a generic subject for this grade level
                              const isGenericMatch = !s.section_id && (parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0') === currentGradeNum);
                              const isDirectMatch = s.section_id === studentSection.id;
                              if (!isGenericMatch && !isDirectMatch) return false;

                              const n = normalizeSubjectName(s.subject_name);
                              return (n.includes('musicandarts') || n.includes('musicarts') || 
                                     n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth')) &&
                                     !seenOrdered.has(n);
                          });
                          components.forEach(c => {
                              const n = normalizeSubjectName(c.subject_name);
                              if (!seenOrdered.has(n)) {
                                  orderedList.push({ name: c.subject_name, code: c.subject_code || 'MAPEH' });
                                  seenOrdered.add(n);
                              }
                          });
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

        // 1. Sort the list according to global priority (Core -> MAPEH -> Specialization)
        const sorted = sortSubjects(newList, s => s.name);

        // 2. Specialized MAPEH logic: Ensure components follow header
        const final: CurriculumSubject[] = [];
        const mapehHeader = sorted.find(s => normalizeSubjectName(s.name) === 'mapeh');
        const mapehComponents = sorted.filter(s => {
            const n = normalizeSubjectName(s.name);
            return n !== 'mapeh' && (
                n.includes('musicandarts') || n.includes('musicarts') || 
                n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth')
            );
        });

        // Add subjects, inserting components after header
        sorted.forEach(s => {
            const n = normalizeSubjectName(s.name);
            const isComponent = mapehComponents.some(c => c.name === s.name);
            if (isComponent) return; // Skip components for now

            final.push(s);

            if (n === 'mapeh') {
                mapehComponents.forEach(c => final.push({ ...c, code: 'MAPEH' }));
            }
        });

        // 3. Fallback: If components exist but no header was in the DB, add the header
        if (mapehComponents.length > 0 && !mapehHeader) {
            // Find insertion point (after TLE)
            const tleIndex = final.findIndex(s => normalizeSubjectName(s.name).includes('tle'));
            const insertIdx = tleIndex !== -1 ? tleIndex + 1 : 0;
            final.splice(insertIdx, 0, { name: 'MAPEH' }, ...mapehComponents.map(c => ({ ...c, code: 'MAPEH' })));
        }

        return final;
      }

      return currentList ? sortSubjects([...currentList], s => s.name) : [];
    };

    const nextCurriculum: SchoolCurriculum = profile.curriculum ? { ...profile.curriculum } : { school_id: profile.school_id };

    nextCurriculum.grade_1_subjects = augmentGradeSubjects(1, nextCurriculum.grade_1_subjects);
    nextCurriculum.grade_2_subjects = augmentGradeSubjects(2, nextCurriculum.grade_2_subjects);
    nextCurriculum.grade_3_subjects = augmentGradeSubjects(3, nextCurriculum.grade_3_subjects);
    nextCurriculum.grade_4_subjects = augmentGradeSubjects(4, nextCurriculum.grade_4_subjects);
    nextCurriculum.grade_5_subjects = augmentGradeSubjects(5, nextCurriculum.grade_5_subjects);
    nextCurriculum.grade_6_subjects = augmentGradeSubjects(6, nextCurriculum.grade_6_subjects);
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

    // Determine if this block should use old curriculum (pre-MATATAG)
    const useOldCurriculum = currentGradeNum >= 9 && gradeLevel < currentGradeNum && gradeLevel >= 7;
    const oldCurrOptions = { useOldCurriculum };

    // Start with blank subjects
    const subjectsData = blankSubjects(gradeLevel, effectiveCurriculum, oldCurrOptions);
    const standardSubjectsForGrade = getStandardJhsSubjects(gradeLevel, effectiveCurriculum, oldCurrOptions);

    // If we have actual grading sheet records or class records for this student, try to fill in real grades
    const classRecords = useAppStore.getState().classRecords || [];
    const hpsRecords = useAppStore.getState().hpsRecords || [];
    const allRecords = [...classRecords, ...gradingSheetRecords];

    if (allRecords.length > 0) {
      const studentRecords = allRecords.filter(r => {
        if (r.student_lrn !== student.lrn) return false;
        
        const dbSubject = dbSubjects.find(s => s.id === r.subject_id);
        if (!dbSubject || dbSubject.term === 'none') return false;

        const subjectGradeNum = parseInt(dbSubject.grade_level.replace(/\D/g, '')) || 0;
        if (subjectGradeNum !== gradeLevel) return false;

        // School Year Logic:
        // If this is the student's CURRENT grade level, ONLY show records for the active school year.
        if (isCurrentGrade) {
            return r.school_year === schoolYear;
        }

        // If this is a PREVIOUS grade level, hide records that match the current active year (test data)
        if (r.school_year === schoolYear) return false;
        
        return true;
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
        const gradeVal = resolveStudentQuarterGrade(
            student.lrn,
            record.subject_id,
            Number(quarter),
            record.school_year || schoolYear,
            classRecords,
            gradingSheetRecords,
            hpsRecords,
            dbSubject.grade_level,
            undefined,
            dbSubjects,
            record.section_id
        );

        const grade = gradeVal > 0 ? gradeVal : record.final_grade;
        // Verify it isn't an invalid/empty grade or 0
        if (grade && Number(grade) > 0) {
          const qKey = `q${quarter}` as 'q1' | 'q2' | 'q3' | 'q4';
          mappedSubject[qKey] = String(Math.round(Number(grade)));
        }
      }

      // Compute MAPEH from components
      ['q1', 'q2', 'q3', 'q4'].forEach(qKey => {
        const q = qKey as 'q1' | 'q2' | 'q3' | 'q4';

        const mapehRow = getSubjectGradeEntry(subjectsData, 'mapeh');

        // MATATAG combined components
        const musicArts = getSubjectGradeEntry(subjectsData, 'musicAndArts');
        const peHealth = getSubjectGradeEntry(subjectsData, 'peAndHealth');
        
        // Old curriculum individual components
        const musicEntry = getSubjectGradeEntry(subjectsData, 'music');
        const artsEntry = getSubjectGradeEntry(subjectsData, 'arts');
        const peEntry = getSubjectGradeEntry(subjectsData, 'physicalEducation');
        const healthEntry = getSubjectGradeEntry(subjectsData, 'health');

        const maGrade = Number(musicArts?.[q]) || 0;
        const peGrade = Number(peHealth?.[q]) || 0;

        // Check for old curriculum individual components
        const musicGrade = Number(musicEntry?.[q]) || 0;
        const artsGrade = Number(artsEntry?.[q]) || 0;
        const peIndivGrade = Number(peEntry?.[q]) || 0;
        const healthGrade = Number(healthEntry?.[q]) || 0;
        const hasIndividual = musicGrade > 0 || artsGrade > 0 || peIndivGrade > 0 || healthGrade > 0;

        if (mapehRow) {
          if (hasIndividual) {
            // Old curriculum: average of individual components
            const components = [musicGrade, artsGrade, peIndivGrade, healthGrade].filter(v => v > 0);
            if (components.length > 0) {
              mapehRow[q] = String(Math.round(components.reduce((a: number, b: number) => a + b, 0) / components.length));
            }
          } else if (maGrade > 0 && peGrade > 0) {
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

        const is3Term = gradeLevel >= currentGradeNum;
        const terms = is3Term 
            ? [sub.q1, sub.q2, sub.q3].map(Number).filter(v => v > 0)
            : [sub.q1, sub.q2, sub.q3, sub.q4].map(Number).filter(v => v > 0);
        
        const isComplete = is3Term ? terms.length === 3 : terms.length === 4;

        const isComponent = excludedFromGPA.includes(s.key) || s.indent || (s.code === 'MAPEH' && s.key !== 'mapeh');

        if (isComponent) {
          // MAPEH components do not have a final rating or remarks in SF10
          sub.finalRating = '';
          sub.remarks = '';
        } else if (isComplete) {
          const avg = Math.round(terms.reduce((a: number, b: number) => a + b, 0) / terms.length);
          sub.finalRating = String(avg);
          sub.remarks = avg >= 75 ? 'PASSED' : 'FAILED';

          // GPA Calculation
          // Include main subjects and MAPEH (even if it's a header)
          const isMapeh = s.key === 'mapeh';
          const isExcluded = s.label?.startsWith('*') || 
                            s.label?.toLowerCase().includes('arabic language') || 
                            s.label?.toLowerCase().includes('islamic values');
          
          const isStandardSubject = !excludedFromGPA.includes(s.key) && (!s.isHeader || isMapeh) && !isExcluded;
          
          if (isStandardSubject && !s.key.startsWith('extra_reserved')) {
            totalFinal += avg;
            countFinal++;
          }
        }
      }

      // Compute per-term General Averages
      ['q1', 'q2', 'q3', 'q4'].forEach(qKey => {
          const q = qKey as 'q1' | 'q2' | 'q3' | 'q4';
          let totalTerm = 0;
          let countTerm = 0;

          for (const s of standardSubjectsForGrade) {
              const sub = getSubjectGradeEntry(subjectsData, s.key);
              if (!sub) continue;

              const val = Number(sub[q]);
              if (val > 0) {
                  // GPA Filter Logic
                  const isMapeh = s.key === 'mapeh';
                  const isExcluded = s.label?.startsWith('*') || 
                                    s.label?.toLowerCase().includes('arabic language') || 
                                    s.label?.toLowerCase().includes('islamic values');
                  
                  const isStandardSubject = !excludedFromGPA.includes(s.key) && (!s.isHeader || isMapeh) && !isExcluded;
                  
                  if (isStandardSubject && !s.key.startsWith('extra_reserved')) {
                      totalTerm += val;
                      countTerm++;
                  }
              }
          }

          if (countTerm > 0) {
              const avgKey = `generalAverage${q.toUpperCase()}` as 'generalAverageQ1' | 'generalAverageQ2' | 'generalAverageQ3' | 'generalAverageQ4';
              subjectsData[avgKey] = String(Math.round(totalTerm / countTerm));
          }
      });

      if (countFinal > 0) {
        const genAvg = Math.round(totalFinal / countFinal);
        subjectsData.generalAverage = String(genAvg);
        subjectsData.remarks = genAvg >= 75 ? 'PROMOTED' : 'RETAINED';
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
      is3Term: gradeLevel >= currentGradeNum,
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

  // Build blocks based on curriculum category
  let scholasticRecords: ReturnType<typeof buildScholasticBlock>[] = [];
  const isElementary = currentGradeNum >= 1 && currentGradeNum <= 6;

  if (isElementary) {
    // Build 6 blocks for Grades 1-6
    scholasticRecords = [
      buildScholasticBlock(1),
      buildScholasticBlock(2),
      buildScholasticBlock(3),
      buildScholasticBlock(4),
      buildScholasticBlock(5),
      buildScholasticBlock(6),
    ];
  } else {
    // Build 4 blocks for Grades 7-10, plus a 5th empty overflow block
    scholasticRecords = [
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
        subjects: blankSubjects(0, effectiveCurriculum),
        is3Term: true,
        gradeLevelNum: 0,
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
  }

    // Source of Truth: ONLY check the boxes if the explicit flags are TRUE.
    const hasElem = student.is_elem_completer === true || (student.is_elem_completer === undefined && !!(student.elementary_school || '').trim());
    const hasPept = student.is_pept_passer === true;
    const hasAls = student.is_als_passer === true;
    const hasOther = student.is_other_eligibility === true;

    const fullName = formatLearnerName(student).toUpperCase();
    const nextGrade = String(currentGradeNum + 1);
    const todayDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const certBase = {
      recordOf: fullName,
      lrn: (student.lrn && !student.lrn.startsWith('TEMP-')) ? student.lrn : '',
      admissionGrade: nextGrade,
      eligibleForGrade: nextGrade,
      schoolName: profile.name || '',
      schoolId: profile.school_id || '',
      division: profile.division || '',
      lastSchoolYearAttended: schoolYear || '',
      date: todayDate,
      principalSignatureName: profile.head_name || '',
      schoolSeal: '',
    };

    const certBlank = {
      recordOf: '',
      lrn: '',
      admissionGrade: '',
      eligibleForGrade: '',
      schoolName: '',
      schoolId: '',
      division: '',
      lastSchoolYearAttended: '',
      date: '',
      principalSignatureName: '',
      schoolSeal: '',
    };

    // Grade 7-8: pre-fill Page 1 cert only; Grade 9-10: pre-fill Page 2 cert only
    const isPage1Grade = currentGradeNum >= 7 && currentGradeNum <= 8;

    return {
    isES: isElementary,
    curriculum: effectiveCurriculum,
    learner: {
      lastName: student.last_name?.toUpperCase() || '',
      firstName: student.first_name?.toUpperCase() || '',
      nameExtension: (student.name_extension || '').toUpperCase(),
      middleName: (student.middle_name || '').toUpperCase(),
      lrn: (student.lrn && !student.lrn.startsWith('TEMP-')) ? student.lrn : '',
      birthdate: student.birthday || '',
      sex: student.gender || '',
      gradeLevel: student.grade_level || '',
    },
    eligibility: {
      elementaryCompleter: {
        checked: hasElem,
        generalAverage: student.average_grade || '',
        citation: student.citation || '',
      },
      nameOfElementarySchool: student.elementary_school || '',
      schoolId: student.elementary_school_id || '',
      addressOfSchool: student.elementary_school_address || '',
      peptPasser: {
        checked: hasPept,
        rating: student.pept_rating || '',
      },
      alsPasser: {
        checked: hasAls,
        rating: student.als_rating || '',
      },
      other: {
        checked: hasOther,
        specify: student.other_credentials || '',
      },
      // Keep these for direct lookup if needed
      dateOfExamination: student.pept_date || '',
      testingCenter: student.testing_center || '',
      // ES Specific
      kinderProgressReport: { checked: !!student.is_elem_completer }, // Placeholder for ES logic if needed
      eccdChecklist: { checked: false },
      kinderCertificate: { checked: false },
    },
    scholasticRecords,
    certification: {
      page1: isPage1Grade ? { ...certBase } : { ...certBlank },
      page2_cert1: !isPage1Grade ? { ...certBase } : { ...certBlank },
      page2_cert2: { ...certBlank },
      page2_cert3: { ...certBlank },
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
