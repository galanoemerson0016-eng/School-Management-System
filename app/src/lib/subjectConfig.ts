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
    { name: 'Makabansa', code: '' },
    { name: '*Arabic Language', code: '' },
    { name: '*Islamic Values Education', code: '' }
  ] as CurriculumSubject[],
  Grade2: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Makabansa', code: '' },
    { name: '*Arabic Language', code: '' },
    { name: '*Islamic Values Education', code: '' }
  ] as CurriculumSubject[],
  Grade3: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Makabansa', code: '' },
    { name: '*Arabic Language', code: '' },
    { name: '*Islamic Values Education', code: '' }
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
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: '*Arabic Language', code: '' },
    { name: '*Islamic Values Education', code: '' }
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
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: '*Arabic Language', code: '' },
    { name: '*Islamic Values Education', code: '' }
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
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: '*Arabic Language', code: '' },
    { name: '*Islamic Values Education', code: '' }
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
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: 'Specialization', code: '' }
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
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: 'Specialization', code: '' }
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
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: 'Specialization', code: '' }
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
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: 'Specialization', code: '' }
  ] as CurriculumSubject[],
  Grade11: [
    { name: 'Effective Communication / Mabisang Komunikasyon', code: '' },
    { name: 'General Mathematics', code: '' },
    { name: 'General Science', code: '' },
    { name: 'Life and Career Skills', code: '' },
    { name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', code: '' },
    { name: 'Elective: Biology 1', code: '' },
    { name: 'Elective: Chemistry 1', code: '' },
    { name: 'Elective: Physics 1', code: '' },
    { name: 'Elective: Business 1 (Basic Accounting)', code: '' },
    { name: 'Elective: Introduction to Philosophy', code: '' },
    { name: 'Elective: Human Movement 1 (Basic Anatomy)', code: '' },
    { name: 'Elective: Physical Education 1 (Fitness and Recreation)', code: '' },
    { name: 'Elective: Caregiving (Child Care)', code: '' },
    { name: 'Elective: Food Processing', code: '' },
    { name: 'Elective: Computer Programming (Java)', code: '' },
    { name: 'Elective: Technical Drafting', code: '' }
  ] as CurriculumSubject[],
  Grade12: [
    // Core Subjects
    { name: '21st Century Literature from the Philippines and the World', code: '' },
    { name: 'Contemporary Philippine Arts from the Regions', code: '' },
    { name: 'Disaster Readiness and Risk Reduction', code: '' },
    { name: 'Earth and Life Science', code: '' },
    { name: 'Earth Science', code: '' },
    { name: 'General Mathematics', code: '' },
    { name: 'Introduction to Philosophy of the Human Person', code: '' },
    { name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', code: '' },
    { name: 'Media and Information Literacy', code: '' },
    { name: 'Oral Communication in Context', code: '' },
    { name: 'Pagbasa at Pagsusuri ng Iba’t ibang Teksto Tungo sa Pananaliksik', code: '' },
    { name: 'Personal Development', code: '' },
    { name: 'Physical Education and Health 1', code: '' },
    { name: 'Physical Education and Health 2', code: '' },
    { name: 'Physical Education and Health 3', code: '' },
    { name: 'Physical Education and Health 4', code: '' },
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
  
  // Check custom curriculum first
  if (customCurriculum) {
    if (grade === 'grade 1' && customCurriculum.grade_1_subjects) result = customCurriculum.grade_1_subjects;
    else if (grade === 'grade 2' && customCurriculum.grade_2_subjects) result = customCurriculum.grade_2_subjects;
    else if (grade === 'grade 3' && customCurriculum.grade_3_subjects) result = customCurriculum.grade_3_subjects;
    else if (grade === 'grade 4' && customCurriculum.grade_4_subjects) result = customCurriculum.grade_4_subjects;
    else if (grade === 'grade 5' && customCurriculum.grade_5_subjects) result = customCurriculum.grade_5_subjects;
    else if (grade === 'grade 6' && customCurriculum.grade_6_subjects) result = customCurriculum.grade_6_subjects;
    else if (grade === 'grade 7' && customCurriculum.grade_7_subjects) result = customCurriculum.grade_7_subjects;
    else if (grade === 'grade 8' && customCurriculum.grade_8_subjects) result = customCurriculum.grade_8_subjects;
    else if (grade === 'grade 9' && customCurriculum.grade_9_subjects) result = customCurriculum.grade_9_subjects;
    else if (grade === 'grade 10' && customCurriculum.grade_10_subjects) result = customCurriculum.grade_10_subjects;
    else if (grade === 'grade 11' && customCurriculum.grade_11_subjects) result = customCurriculum.grade_11_subjects;
    else if (grade === 'grade 12' && customCurriculum.grade_12_subjects) result = customCurriculum.grade_12_subjects;
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

  return sortSubjects(unique, (s) => s.name);
}

/**
 * Get SF10 subject rows with proper formatting.
 * Implements the core principle: MAPEH header -> Components -> Final Average
 */
export function getSF10RowsForGrade(gradeLevel: string | number, customCurriculum?: SchoolCurriculum, options?: { useOldCurriculum?: boolean }) {
  let subjects = getSubjectsForGrade(gradeLevel, customCurriculum);

  // Override with old curriculum (pre-MATATAG) for previous JHS grade records
  const gradeNumCheck = parseInt(String(gradeLevel).match(/\d+/)?.[0] || String(gradeLevel)) || 0;
  if (options?.useOldCurriculum && gradeNumCheck >= 7 && gradeNumCheck <= 9) {
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
    if (normalized.includes('musicandarts') || normalized.includes('musicarts')) return 'musicAndArts';
    if (normalized.includes('physicaleducationandhealth') || normalized.includes('peandhealth') || normalized.includes('pehealth')) return 'peAndHealth';
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
    if (s.code === 'MAPEH' || norm.includes('musicandarts') || norm.includes('physicaleducationandhealth')) {
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
  const componentsNorms = ['musicandarts', 'musicarts', 'physicaleducationandhealth', 'peandhealth', 'pehealth'];

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
    
    // 6. Specialization (Always Last)
    if (normalized.includes('specialization')) return 1000;

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
