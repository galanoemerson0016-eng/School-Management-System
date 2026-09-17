/**
 * Subject Configuration Utility
 * Handles both standard DepEd subjects and custom school curricula
 */

import type { CurriculumSubject, SchoolCurriculum } from '../types';

// Standard DepEd subjects for grades 7-10
// Standard DepEd subjects for grades 1-12
const STANDARD_SUBJECTS = {
  Grade1: [
    { name: 'Language', code: '' },
    { name: 'Reading and Literacy', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Makabansa', code: '' }
  ] as CurriculumSubject[],
  Grade2: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Makabansa', code: '' }
  ] as CurriculumSubject[],
  Grade3: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Makabansa', code: '' }
  ] as CurriculumSubject[],
  Grade4: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'EPP', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
  ] as CurriculumSubject[],
  Grade5: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'EPP', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
  ] as CurriculumSubject[],
  Grade6: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'EPP', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
  ] as CurriculumSubject[],
  Grade7: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
  ] as CurriculumSubject[],
  Grade8: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
  ] as CurriculumSubject[],
  Grade9: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
  ] as CurriculumSubject[],
  Grade10: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
  ] as CurriculumSubject[],
  Grade11: [
    { name: 'Effective Communication', code: '' },
    { name: 'Mabisang Komunikasyon', code: '' },
    { name: 'General Mathematics', code: '' },
    { name: 'General Science', code: '' },
    { name: 'Life and Career Skills', code: '' },
    { name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', code: '' },
    { name: 'Physical Education and Health 1', code: '' },
    { name: 'Physical Education and Health 2', code: '' }
  ] as CurriculumSubject[],
  Grade12: [
    // Core Subjects
    { name: '21st Century Literature from the Philippines and the World', code: '' },
    { name: 'Contemporary Philippine Arts from the Regions', code: '' },
    { name: 'Disaster Readiness and Risk Reduction', code: '' },
    { name: 'Earth and Life Science', code: '' },
    { name: 'Earth Science', code: '' },
    { name: 'General Mathematics', code: '' },
    { name: 'Health Optimizing Physical Education and Health 1', code: '' },
    { name: 'Health Optimizing Physical Education and Health 2', code: '' },
    { name: 'Health Optimizing Physical Education and Health 3', code: '' },
    { name: 'Health Optimizing Physical Education and Health 4', code: '' },
    { name: 'Introduction to Philosophy of the Human Person', code: '' },
    { name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', code: '' },
    { name: 'Media and Information Literacy', code: '' },
    { name: 'Oral Communication in Context', code: '' },
    { name: 'Pagbasa at Pagsusuri ng Iba’t ibang Teksto Tungo sa Pananaliksik', code: '' },
    { name: 'Personal Development', code: '' },
    { name: 'Physical Education 1', code: '' },
    { name: 'Physical Education 2', code: '' },
    { name: 'Physical Education 3', code: '' },
    { name: 'Physical Education 4', code: '' },
    { name: 'Physical Science', code: '' },
    { name: 'Reading and Writing Skills', code: '' },
    { name: 'Statistics and Probability', code: '' },
    { name: 'Understanding Culture, Society and Politics', code: '' },

    // Applied Subjects
    { name: 'Empowerment Technologies', code: '' },
    { name: 'English for Academic and Professional Purposes', code: '' },
    { name: 'Entrepreneurship', code: '' },
    { name: 'Filipino sa Piling Larang (Akademik)', code: '' },
    { name: 'Filipino sa Piling Larang (Isports)', code: '' },
    { name: 'Filipino sa Piling Larang (Sining at Disenyo)', code: '' },
    { name: 'Filipino sa Piling Larang (Teknikal-Bokasyunal)', code: '' },
    { name: 'Inquiries, Investigations and Immersion', code: '' },
    { name: 'Practical Research 1', code: '' },
    { name: 'Practical Research 2', code: '' },

    // Specialized Subjects
    // ABM
    { name: 'Applied Economics', code: '' },
    { name: 'Business Ethics and Social Responsibility', code: '' },
    { name: 'Business Finance', code: '' },
    { name: 'Business Math', code: '' },
    { name: 'Fundumentals of Accountancy, Bus, and Mgt 1', code: '' },
    { name: 'Fundamentals of Accountancy, Bus, and Mgt 2', code: '' },
    { name: 'Organization and Management', code: '' },
    { name: 'Principles of Marketing', code: '' },
    // HUMMS
    { name: 'Community Engagement, Solidarity and Citizenship', code: '' },
    { name: 'Creative Nonfiction', code: '' },
    { name: 'Creative Writing', code: '' },
    { name: 'Culminating Activity', code: '' },
    { name: 'Disciplines and Ideas in the Applied Social Sciences', code: '' },
    { name: 'Disciplines and Ideas in the Social Sciences', code: '' },
    { name: 'Introduction of World Religions and Belief System', code: '' },
    { name: 'Malikhaing Pagsulat', code: '' },
    { name: 'Philippines Politics and Governance', code: '' },
    { name: 'Trend, Networks, and Critical Thinking in the 21st Century', code: '' },
    // STEM
    { name: 'Basic Calculus', code: '' },
    { name: 'Biology 1', code: '' },
    { name: 'Biology 2', code: '' },
    { name: 'General Chemistry 1', code: '' },
    { name: 'General Chemistry 2', code: '' },
    { name: 'General Physics 1', code: '' },
    { name: 'General Physics 2', code: '' },
    { name: 'Pre - Calculus', code: '' },
    // Arts and Design Track
    { name: 'Apprenticeship and Exploration in the Performing Arts (Music)', code: '' },
    { name: 'Creative Industries I - Arts and Design Appreciation and Productions', code: '' },
    { name: 'Creative Industries II: Performing Arts', code: '' },
    { name: 'Developing Filipino Identity in the Arts', code: '' },
    { name: 'Integrating Elements and Principles of Organization in the Arts', code: '' },
    { name: 'Leadership and Management in Different Arts and Fields', code: '' },
    { name: 'Physical and Personal Dev. In the Arts', code: '' },
    { name: 'Production in the Performing Arts', code: '' },
    // Sports Track
    { name: 'Apprenticeship (Off - Campus)', code: '' },
    { name: 'Fitness, Sports, and Recreation', code: '' },
    { name: 'Fitness Testing and Basic Exercise Programming', code: '' },
    { name: 'Fundamentals of Coaching', code: '' },
    { name: 'Human Movement', code: '' },
    { name: 'Practicum (In - Campus)', code: '' },
    { name: 'Psychosocial Aspects of Sports and Exercise', code: '' },
    { name: 'Safety and First Aid', code: '' },
    { name: 'Sports Officiating and Activity Management', code: '' }
  ] as CurriculumSubject[]
};

// Old curriculum (pre-MATATAG) JHS subjects for Grade 7-9
// MAPEH sub-components are listed separately: Music, Arts, Physical Education, Health
const OLD_CURRICULUM_JHS_SUBJECTS = [
  { name: 'Filipino', code: '' },
  { name: 'English', code: '' },
  { name: 'Mathematics', code: '' },
  { name: 'Science', code: '' },
  { name: 'Araling Panlipunan (AP)', code: '' },
  { name: 'Values Education', code: '' },
  { name: 'Technology and Livelihood Education (TLE)', code: '' },
  { name: 'MAPEH', code: '' },
  { name: 'Music', code: 'MAPEH' },
  { name: 'Arts', code: 'MAPEH' },
  { name: 'Physical Education', code: 'MAPEH' },
  { name: 'Health', code: 'MAPEH' },
] as CurriculumSubject[];

/**
 * Get subjects for a specific grade level
 * Uses custom curriculum if available, otherwise returns standard subjects
 */
export function getSubjectsForGrade(gradeLevel: string | number, customCurriculum?: SchoolCurriculum): CurriculumSubject[] {
  let grade = String(gradeLevel).toLowerCase();
  if (/^\d+$/.test(grade)) {
    grade = `grade ${grade}`;
  }
  
  let result: CurriculumSubject[] = [];
  
  let isFromCustom = false;
  // Check custom curriculum first
  if (customCurriculum) {
    if (grade === 'grade 1' && customCurriculum.grade_1_subjects?.length) { result = customCurriculum.grade_1_subjects; isFromCustom = true; }
    else if (grade === 'grade 2' && customCurriculum.grade_2_subjects?.length) { result = customCurriculum.grade_2_subjects; isFromCustom = true; }
    else if (grade === 'grade 3' && customCurriculum.grade_3_subjects?.length) { result = customCurriculum.grade_3_subjects; isFromCustom = true; }
    else if (grade === 'grade 4' && customCurriculum.grade_4_subjects?.length) { result = customCurriculum.grade_4_subjects; isFromCustom = true; }
    else if (grade === 'grade 5' && customCurriculum.grade_5_subjects?.length) { result = customCurriculum.grade_5_subjects; isFromCustom = true; }
    else if (grade === 'grade 6' && customCurriculum.grade_6_subjects?.length) { result = customCurriculum.grade_6_subjects; isFromCustom = true; }
    else if (grade === 'grade 7' && customCurriculum.grade_7_subjects?.length) { result = customCurriculum.grade_7_subjects; isFromCustom = true; }
    else if (grade === 'grade 8' && customCurriculum.grade_8_subjects?.length) { result = customCurriculum.grade_8_subjects; isFromCustom = true; }
    else if (grade === 'grade 9' && customCurriculum.grade_9_subjects?.length) { result = customCurriculum.grade_9_subjects; isFromCustom = true; }
    else if (grade === 'grade 10' && customCurriculum.grade_10_subjects?.length) { result = customCurriculum.grade_10_subjects; isFromCustom = true; }
    else if (grade === 'grade 11' && customCurriculum.grade_11_subjects?.length) { result = customCurriculum.grade_11_subjects; isFromCustom = true; }
    else if (grade === 'grade 12' && customCurriculum.grade_12_subjects?.length) { result = customCurriculum.grade_12_subjects; isFromCustom = true; }
  }

  if (result.length === 0) {
    // Fall back to standard subjects
    if (grade === 'grade 1') result = [...STANDARD_SUBJECTS.Grade1];
    else if (grade === 'grade 2') result = [...STANDARD_SUBJECTS.Grade2];
    else if (grade === 'grade 3') result = [...STANDARD_SUBJECTS.Grade3];
    else if (grade === 'grade 4') result = [...STANDARD_SUBJECTS.Grade4];
    else if (grade === 'grade 5') result = [...STANDARD_SUBJECTS.Grade5];
    else if (grade === 'grade 6') result = [...STANDARD_SUBJECTS.Grade6];
    else if (grade === 'grade 7') result = [...STANDARD_SUBJECTS.Grade7];
    else if (grade === 'grade 8') result = [...STANDARD_SUBJECTS.Grade8];
    else if (grade === 'grade 9') result = [...STANDARD_SUBJECTS.Grade9];
    else if (grade === 'grade 10') result = [...STANDARD_SUBJECTS.Grade10];
    else if (grade === 'grade 11') result = [...STANDARD_SUBJECTS.Grade11];
    else if (grade === 'grade 12') result = [...STANDARD_SUBJECTS.Grade12];
    else {
      // Return empty rows for overflow/extra blocks
      return Array(11).fill(null).map(() => ({ name: ' ', code: '' }));
    }
  }

  // Final safety deduplication
  const seen = new Set<string>();
  const unique = result.filter((s: CurriculumSubject) => {
    const norm = normalizeSubjectName(s.name);
    if (!norm) return true; // Keep empty/placeholder rows
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });

  // Preserve teacher's customized arrangement if explicitly configured
  if (isFromCustom) {
    return unique;
  }

  return sortSubjects(unique, (s) => s.name);
}

/**
 * Get SF10 subject rows with proper formatting.
 * Implements the core principle: MAPEH header -> Components -> Final Average
 */
export function getSF10RowsForGrade(gradeLevel: string | number, customCurriculum?: SchoolCurriculum, options?: { useOldCurriculum?: boolean }) {
  let subjects = getSubjectsForGrade(gradeLevel, customCurriculum);

  // Override with old curriculum (pre-MATATAG) for previous JHS grade records ONLY if no custom curriculum was set
  const gradeNumCheck = parseInt(String(gradeLevel).match(/\d+/)?.[0] || String(gradeLevel)) || 0;
  const gradeKey = `grade_${gradeNumCheck}_subjects` as keyof SchoolCurriculum;
  const hasCustomCurriculumForGrade = customCurriculum && Array.isArray(customCurriculum[gradeKey]) && (customCurriculum[gradeKey] as CurriculumSubject[]).length > 0;

  if (!hasCustomCurriculumForGrade && options?.useOldCurriculum && gradeNumCheck >= 7 && gradeNumCheck <= 9) {
    subjects = [...OLD_CURRICULUM_JHS_SUBJECTS];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];

  const getStandardSf10Key = (subjectName: string, idx: number) => {
    const normalized = normalizeSubjectName(subjectName);
    if (normalized.includes('arabic')) return 'arabic';
    if (normalized.includes('islamic')) return 'islamic';
    if (normalized.includes('language')) return 'language';
    if (normalized.includes('readingandliteracy')) return 'readingAndLiteracy';
    if (normalized.includes('filipino')) return 'filipino';
    if (normalized.includes('english')) return 'english';
    if (normalized.includes('generalmathematics') || normalized === 'genmath') return 'generalMathematics';
    if (normalized.includes('generalscience') || normalized === 'genscience') return 'generalScience';
    if (normalized.includes('lifeandcareerskills')) return 'lifeAndCareerSkills';
    if (normalized.includes('pagaaralngkasaysayan') || normalized.includes('kasaysayanatlipunangpilipino')) return 'pagAaralNgKasaysayan';
    if (normalized.includes('effectivecommunication') || normalized.includes('mabisangkomunikasyon')) return 'effectiveCommunication';
    if (normalized.includes('mathematics') || normalized.includes('math')) return 'mathematics';
    if (normalized.includes('science')) return 'science';
    if (normalized.includes('aralingpanlipunan') || normalized === 'ap') return 'ap';
    if (normalized.includes('makabansa')) return 'makabansa';
    if (normalized.includes('gmrc') || normalized.includes('goodmanners')) return 'gmrc';
    if (normalized.includes('valueseducation') || normalized.includes('values')) return 'valuesEducation';
    if (normalized.includes('epp') || normalized.includes('tle')) return 'tle';
    if (normalized.includes('ict')) return 'ict';
    if (normalized.includes('musicandarts') || normalized.includes('musicarts') || (normalized.includes('music') && normalized.includes('arts'))) return 'musicAndArts';
    if (normalized.includes('physicaleducationandhealth') || normalized.includes('physicaleducationhealth') || normalized.includes('peandhealth') || normalized.includes('pehealth') || (normalized.includes('physicaleducation') && normalized.includes('health')) || (normalized.includes('pe') && normalized.includes('health'))) return 'peAndHealth';
    // Old curriculum individual MAPEH components
    if (normalized === 'music') return 'music';
    if (normalized === 'arts') return 'arts';
    if (normalized === 'physicaleducation') return 'physicalEducation';
    if (normalized === 'health') return 'health';
    if (normalized.includes('mapeh')) return 'mapeh';
    return `subject_${idx}`;
  };

  // Track MAPEH components to insert Final Average correctly
  const componentIndices: number[] = [];
  subjects.forEach((s, i) => {
    const norm = normalizeSubjectName(s.name);
    if (s.code === 'MAPEH' || 
        norm.includes('musicandarts') || norm.includes('musicarts') || 
        norm.includes('physicaleducationandhealth') || norm.includes('physicaleducationhealth') || norm.includes('pehealth') || 
        (norm.includes('physicaleducation') && norm.includes('health')) || (norm.includes('pe') && norm.includes('health')) ||
        norm === 'music' || norm === 'arts' || norm === 'physicaleducation' || norm === 'health' || norm === 'pe') {
      componentIndices.push(i);
    }
  });

  subjects.forEach((subject, idx) => {
    const norm = normalizeSubjectName(subject.name);
    const isMapehHeader = norm === 'mapeh';
    const isComponent = componentIndices.includes(idx);
    
    rows.push({
      label: subject.name,
      key: getStandardSf10Key(subject.name, idx),
      indent: isComponent,
      isHeader: isMapehHeader
    });
  });

  // Ensure correct row count: ES=15, JHS=14 (extra 2 rows for special programs like SSC, SPS)
  const gradeStr = String(gradeLevel).toLowerCase();
  const gradeNum = parseInt(gradeStr.match(/\d+/)?.[0] || gradeStr) || 0;
  const isElementary = gradeNum > 0 && gradeNum <= 6;
  
  const TARGET_TOTAL = isElementary ? 15 : 14;
  const PAD_LIMIT = isElementary ? 13 : 14;

  // For ES, we want to separate ALIVE subjects and put them at the bottom
  const isAL = (r: { label: string; key: string }) => r.label.includes('Arabic') || r.key === 'arabic';
  const isIVE = (r: { label: string; key: string }) => r.label.includes('Islamic') || r.key === 'islamic';

  const coreRows = rows.filter(r => !isAL(r) && !isIVE(r));
  const alRow = rows.find(isAL) || { key: "arabic", label: "*Arabic Language" };
  const iveRow = rows.find(isIVE) || { key: "islamic", label: "*Islamic Values Education" };

  const finalRows = [...coreRows];
  
  // Padding
  while (finalRows.length < PAD_LIMIT) {
    finalRows.push({
      label: ' ',
      key: `extra_reserved_${finalRows.length}`
    });
  }

  // Add ALIVE at bottom for ES
  if (isElementary) {
    finalRows.push(alRow);
    finalRows.push(iveRow);
  }

  // Final trim or pad to target total
  if (finalRows.length > TARGET_TOTAL) {
    return finalRows.slice(0, TARGET_TOTAL);
  }
  while (finalRows.length < TARGET_TOTAL) {
     finalRows.push({ label: ' ', key: `extra_reserved_${finalRows.length}` });
  }

  return finalRows;
}

/**
 * Get SF9 subject list for a specific grade
 */
export function getSF9SubjectsForGrade(gradeLevel: string | number, customCurriculum?: SchoolCurriculum) {
  const subjects = getSubjectsForGrade(gradeLevel, customCurriculum);
  const rows: { name: string; isHeader?: boolean; isComponent?: boolean; isComputed?: boolean; isReserved?: boolean }[] = [];
  
  // Normalized names for identification
  const mapehNorm = 'mapeh';
  const componentsNorms = [
    'musicandarts', 'musicarts',
    'physicaleducationandhealth', 'peandhealth', 'pehealth',
    'music', 'arts', 'physicaleducation', 'health'
  ];

  // Identify components in the curriculum
  const componentIndices = subjects.map((s, i) => {
    const norm = normalizeSubjectName(s.name);
    return componentsNorms.some(c => norm.includes(c)) ? i : -1;
  }).filter(i => i !== -1);

  subjects.forEach((subj, idx) => {
    const norm = normalizeSubjectName(subj.name);
    const isMapeh = norm === mapehNorm;
    const isComponent = componentIndices.includes(idx);

    rows.push({
      name: subj.name,
      isHeader: isMapeh,
      isComponent: isComponent
    });
  });

  // Add 3 reserved rows for possible extra subjects
  for (let i = 1; i <= 3; i++) {
    rows.push({
      name: `extra_reserved_${i}`,
      isReserved: true
    });
  }

  return rows;
}

export function normalizeSubjectName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Canonical subject normalization for DepEd Grades 1-10 deduplication.
 * Stems common subject variations and strips trailing grade numbers so:
 * "FILIPINO 4" / "Filipino" -> "filipino"
 * "ENGLISH 4" / "English" -> "english"
 * "GMRC 4" / "GMRC (Good Manners and Right Conduct)" -> "gmrc"
 * "MAPEH 4" / "MAPEH" -> "mapeh"
 */
export function getCanonicalSubjectKey(name: string, gradeLevel?: string | number): string {
  if (!name) return '';
  const norm = normalizeSubjectName(name);

  // If it is HOPE (Health Optimizing Physical Education)
  if (norm.includes('healthoptimizing') || norm.startsWith('hope')) {
    const num = norm.match(/[1-4]/)?.[0] || '';
    return `healthoptimizingphysicaleducation${num}`;
  }

  // PE and Health / Physical Education and Health (all grade levels, with or without 1-4)
  if (
    norm.includes('physicaleducationandhealth') ||
    norm.includes('peandhealth') ||
    norm.includes('pehealth') ||
    ((norm.includes('physicaleducation') || norm.startsWith('pe')) && norm.includes('health')) ||
    /^pe[1-4]$/.test(norm)
  ) {
    const num = norm.match(/[1-4]$/)?.[0] || '';
    return `physicaleducationandhealth${num}`;
  }

  // Computer Programming specializations (Java, .Net, Oracle)
  if (norm.includes('computerprogrammingjava') || norm.includes('programmingjava')) {
    return 'computerprogrammingjava';
  }
  if (norm.includes('computerprogrammingdotnet') || norm.includes('programmingdotnet') || norm.includes('programmingnet')) {
    return 'computerprogrammingdotnet';
  }
  if (norm.includes('computerprogrammingoracle') || norm.includes('programmingoracle')) {
    return 'computerprogrammingoracle';
  }

  const gNum = gradeLevel ? (typeof gradeLevel === 'number' ? gradeLevel : parseInt(String(gradeLevel).replace(/\D/g, '')) || 0) : 0;
  const isSHS = gNum === 11 || gNum === 12;

  // In SHS (Grades 11-12) and sequential electives (Chemistry 1/2, Biology 1/2, Physics 1/2, PR 1/2, etc.),
  // trailing digits indicate distinct sequential offerings and must never be stripped
  const isSequentialStem = norm.includes('chemistry') || norm.includes('biology') || norm.includes('physics') || 
                           norm.includes('research') || norm.startsWith('hope') || /^pe[1-4]$/.test(norm) || 
                           norm.includes('creativeindustries') || norm.includes('literature') ||
                           norm.includes('finitemath') || norm.includes('advancedmath') ||
                           norm.startsWith('filipino1') || norm.startsWith('filipino2') ||
                           norm.startsWith('english1') || norm.startsWith('english2');
  if (isSHS || isSequentialStem) {
    return norm;
  }

  // For Grades 1-10:
  // 1. Strip trailing grade digits (e.g. "filipino4" -> "filipino", "english4" -> "english", "grade4" -> "")
  let stripped = norm.replace(/(grade)?\d+$/, '');
  if (!stripped) stripped = norm;

  // 2. Canonical core stems
  if (stripped.startsWith('filipino')) return 'filipino';
  if (stripped.startsWith('english')) return 'english';
  if (stripped === 'language' || stripped.includes('matataglanguage')) return 'language';
  if (stripped.includes('readingandliteracy') || stripped.includes('readingliteracy') || (stripped.includes('reading') && stripped.includes('literacy'))) return 'readingandliteracy';
  if (stripped.startsWith('math')) return 'mathematics';
  if (stripped.startsWith('science')) return 'science';
  if (stripped.startsWith('gmrc') || stripped.includes('goodmanners')) return 'gmrc';
  if (stripped.startsWith('makabansa')) return 'makabansa';
  if (stripped === 'ap' || stripped.includes('aralingpanlipunan') || stripped.includes('panlipunan')) return 'aralingpanlipunan';
  if ((stripped.includes('valueseducation') || stripped.includes('esp') || stripped.includes('pagpapakatao')) && !stripped.includes('gmrc')) return 'valueseducation';
  if (stripped.startsWith('epp') || stripped.includes('edukasyongpantahanan')) return 'epp';
  if (stripped.startsWith('tle') || stripped.includes('technologyandlivelihood')) return 'tle';
  if (stripped === 'mapeh') return 'mapeh';

  // MAPEH Components
  if (stripped.includes('musicandarts') || stripped.includes('musicarts')) return 'musicandarts';
  if (stripped.includes('physicaleducationandhealth') || stripped.includes('peandhealth') || stripped.includes('pehealth')) return 'physicaleducationandhealth';
  if (stripped === 'music') return 'music';
  if (stripped === 'arts') return 'arts';
  if (stripped === 'physicaleducation' || stripped === 'pe') return 'physicaleducation';
  if (stripped === 'health') return 'health';

  // ALIVE subjects
  if (stripped.includes('arabic')) return 'arabiclanguage';
  if (stripped.includes('islamic')) return 'islamicvalueseducation';

  return stripped;
}

/**
 * Global sorting priority for DepEd Curriculum (G1-12)
 * Returns a numerical rank to ensure subjects appear in the correct official order
 */
export function getStandardSubjectPriority(name: string): number {
    const normalized = normalizeSubjectName(name);
    
    // 1. Special Religious/Alternative Subjects (Identify these early to avoid general keyword matches)
    if (normalized.includes('arabic')) return 90;
    if (normalized.includes('islamic')) return 91;

    // 2. Matatag G1-3 Core Priorities
    if (normalized.includes('readingandliteracy')) return 2;
    if (normalized.includes('language')) return 1;
    
    // 2.5. SSHS G11 Core Priorities
    if (normalized.includes('effectivecommunication') || normalized.includes('mabisangkomunikasyon')) return 5;
    if (normalized.includes('generalmathematics')) return 6;
    if (normalized.includes('generalscience')) return 7;
    if (normalized.includes('lifeandcareerskills')) return 8;
    if (normalized.includes('pagaaralngkasaysayan') || normalized.includes('kasaysayanatlipunangpilipino')) return 9;
    
    // Check if this is an SHS elective or specialized subject (must NOT match elementary core priorities below)
    const isShsElective = 
        normalized.includes('elective') || 
        normalized.includes('calculus') || 
        normalized.includes('chemistry') || 
        normalized.includes('physics') || 
        normalized.includes('biology') ||
        normalized.includes('finitemathematics') ||
        normalized.includes('advancedmathematics') ||
        normalized.includes('earthandspace') ||
        normalized.includes('akademikongfilipino') ||
        normalized.startsWith('filipino1') ||
        normalized.startsWith('filipino2') ||
        normalized.includes('pilinglarang') ||
        normalized.includes('creativeindustries') ||
        normalized.includes('contemporaryliterature') ||
        normalized.includes('creativecomposition') ||
        normalized.includes('malikhaingpagsulat') ||
        normalized.includes('contemporarymarketing') ||
        normalized.includes('organizationandmanagement') ||
        normalized.includes('humanmovement') ||
        normalized.includes('firstaid') ||
        normalized.includes('sports') ||
        normalized.includes('broadband') ||
        normalized.includes('servicing') ||
        normalized.includes('programming');

    if (!isShsElective) {
        // 3. Core Academic Subjects
        if (normalized.includes('filipino')) return 10;
        if (normalized.includes('english')) return 20;
        if (normalized.includes('mathematics') || normalized.includes('math')) return 30;
        if (normalized.includes('science')) return 40;
        if (normalized.includes('gmrc') || normalized.includes('goodmanners')) return 45;
        if (normalized === 'aralingpanlipunan' || normalized === 'ap' || normalized.includes('aralingpanlipunan')) return 50;
        if (normalized.includes('makabansa')) return 55;
        if (normalized.includes('valueseducation') || normalized.includes('values') || normalized.includes('esp') || normalized.includes('edukasyonsapagpapakatao')) return 60;
        if (normalized.includes('epp')) return 65;
        if (normalized.includes('technologyandlivelihood') || normalized.includes('tle')) return 70;
    }
    
    // 4. MAPEH Header
    if (normalized === 'mapeh') return 80;
    
    // 5. MAPEH Components
    if (normalized.includes('musicandarts') || normalized.includes('musicarts')) return 81;
    if (normalized.includes('physicaleducationandhealth') || normalized.includes('peandhealth') || normalized.includes('pehealth')) return 82;
    // Old curriculum individual MAPEH components
    if (normalized === 'music') return 81;
    if (normalized === 'arts') return 82;
    if (normalized === 'physicaleducation') return 83;
    if (normalized === 'health') return 84;
    
    // 6. TVE Specialization (Always Last among standard subjects)
    if (normalized.includes('tvespecialization') || normalized.includes('sptve')) return 1000;

    // Academic Electives / Applied Subjects: priority 500
    // TechPro Electives / Specialized: priority 700
    if (isShsElective) {
        if (normalized.includes('techpro') || normalized.includes('servicing') || normalized.includes('programming') || normalized.includes('broadband')) {
            return 700;
        }
        return 500;
    }

    // Others (General electives, etc.)
    return 500;
}

/**
 * Sorts an array of subjects based on official priority
 */
export function sortSubjects<T>(items: T[], getName: (item: T) => string): T[] {
    return [...items].sort((a, b) => {
        const priorityA = getStandardSubjectPriority(getName(a));
        const priorityB = getStandardSubjectPriority(getName(b));
        
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        return getName(a).localeCompare(getName(b));
    });
}

/**
 * Find a subject in the list by name (with fuzzy matching)
 */
export function findSubject(subjectName: string, subjects: CurriculumSubject[]): CurriculumSubject | undefined {
  const normalized = normalizeSubjectName(subjectName);
  return subjects.find(s => normalizeSubjectName(s.name) === normalized);
}

/**
 * Returns the official DepEd SHS subject category for display and grouping
 */
export function getSubjectCategory(subjectName: string, gradeLevel: string): string {
    const isSHS = gradeLevel.includes('11') || gradeLevel.includes('12');
    if (!isSHS) {
        return '';
    }

    const normalized = subjectName.trim().toLowerCase();
    const isG12 = gradeLevel.includes('12');

    if (isG12) {
        const norm = normalized.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // 1. Core Subjects
        const cores = [
            "21st century literature from the philippines and the world",
            "contemporary philippine arts from the regions",
            "disaster readiness and risk reduction",
            "earth and life science",
            "earth science",
            "general mathematics",
            "introduction to philosophy of the human person",
            "komunikasyon at pananaliksik sa wika at kulturang pilipino",
            "media and information literacy",
            "oral communication in context",
            "pagbasa at pagsusuri ng ibat ibang teksto tungo sa pananaliksik",
            "pagbasa at pagsusuri ng iba't ibang teksto tungo sa pananaliksik",
            "personal development",
            "physical education and health 1",
            "physical education and health 2",
            "physical education and health 3",
            "physical education and health 4",
            "health optimizing physical education and health 1",
            "health optimizing physical education and health 2",
            "health optimizing physical education and health 3",
            "health optimizing physical education and health 4",
            "health optimizing physical education 1",
            "health optimizing physical education 2",
            "health optimizing physical education 3",
            "health optimizing physical education 4",
            "hope 1",
            "hope 2",
            "hope 3",
            "hope 4",
            "physical science",
            "reading and writing skills",
            "statistics and probability",
            "understanding culture society and politics",
            "understanding culture, society and politics",
            "21st century literature",
            "contemporary philippine arts",
            "pe and health 1",
            "pe and health 2",
            "pe and health 3",
            "pe and health 4",
            "physical education 1",
            "physical education 2",
            "physical education 3",
            "physical education 4",
            "pe 1",
            "pe 2",
            "pe 3",
            "pe 4"
        ];
        if (cores.some(c => {
            const cNorm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
            return norm === cNorm || norm.includes(cNorm) || cNorm.includes(norm);
        })) {
            return 'Core';
        }

        // 2. Applied Subjects
        const applied = [
            "empowerment technologies",
            "english for academic and professional purposes",
            "entrepreneurship",
            "filipino sa piling larang akademik",
            "filipino sa piling larang akademiko",
            "filipino sa piling larang isports",
            "filipino sa piling larang sining at disenyo",
            "filipino sa piling larang teknikal bokasyunal",
            "filipino sa piling larang teknikal-bokasyunal",
            "filipino sa piling larang",
            "inquiries investigations and immersion",
            "inquiries, investigations and immersion",
            "practical research 1",
            "practical research 2"
        ];
        if (applied.some(a => {
            const aNorm = a.toLowerCase().replace(/[^a-z0-9]/g, '');
            return norm === aNorm || norm.includes(aNorm) || aNorm.includes(norm);
        })) {
            return 'Applied';
        }

        // 3. Specialized Subjects
        return 'Specialized';
    }

    const norm = normalized;

    // 1. Core Subject (All Tracks)
    const cores = [
        'effective communication',
        'mabisang komunikasyon',
        'general mathematics',
        'general science',
        'life and career skills',
        'pag-aaral ng kasaysayan at lipunang pilipino',
        'kasaysayan at lipunang pilipino'
    ];
    if (cores.some(c => norm.includes(c))) {
        return 'Core Subject (All Tracks)';
    }

    // 2. TechPro Elective (Work Immersion)
    if (norm.startsWith('work immersion')) {
        return 'TechPro Elective (Work Immersion)';
    }

    // 3. Academic Elective (Field Experience / Exposure, and Sports and Arts)
    if (norm.startsWith('field exposure') || norm.startsWith('field experience') || norm.includes('apprenticeship')) {
        return 'Academic Elective (Field Experience / Exposure, and Sports and Arts)';
    }

    // 4. TechPro Electives (All Other Electives)
    const techProElectives = [
        'beauty care', 'barbering', 'caregiving', 'hairdressing', 'wellness', 'massage', 'hilot',
        'agricultural crops', 'agro-entrepreneurship', 'aquaculture', 'fish capture', 'food processing',
        'organic agriculture', 'poultry', 'ruminants', 'swine', 'garments', 'handicrafts', 'weaving',
        'automotive servicing', 'electrical repair', 'engine and chassis', 'driving and automotive',
        'motorcycle', 'small engine', 'carpentry', 'construction operation', 'metal arc welding',
        'technical drafting', 'animation', 'illustration', 'visual graphics', 'bakery operation',
        'events management', 'food and beverage operation', 'hotel operation', 'housekeeping',
        'kitchen operations', 'tourism services', 'commercial air-conditioning', 'domestic refrigeration',
        'electrical installation', 'electronics product', 'mechatronics', 'photovoltaic',
        'broadband installation', 'computer programming', 'computer systems servicing',
        'contact center services', 'marine engineering', 'marine transportation', 'ships catering'
    ];
    if (techProElectives.some(tp => norm.includes(tp))) {
        return 'TechPro Elective (All Other Electives)';
    }

    // 5. Academic Elective (All Other Electives)
    return 'Academic Elective (All Other Electives)';
}

