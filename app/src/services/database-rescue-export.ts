import { csvCell } from '../utils/csv-export';
/**
 * DepEd FormEase Pro — Complete Database Rescue & Direct Offline Extraction Service
 *
 * Directly extracts all underlying data from local browser storage (IndexedDB "FormEaseDB"
 * and localStorage) without depending on active UI screen states, selected dropdowns,
 * or quarter filters.
 *
 * Packages every single DepEd record into a comprehensive, multi-sheet Excel (.xlsx) file
 * or individual CSV files for complete data rescue and emergency audit.
 */

import * as XLSX from 'xlsx';
import { db } from './database';
import type {
    Student,
    Section,
    Subject,
    ClassRecord,
    HPSRecord,
    AttendanceRecord,
    SF2Sheet,
    Enrollment,
    SchoolProfile,
    ObservedValues,
    Announcement
} from '../types';
import {
    getSubjectCluster,
    getWeights,
    transmuteGrade,
    getGradeDescriptorWithFilipino,
    normalizeWeightFraction
} from '../lib/grading';
import { isMatchingSubject } from '../utils/grading-helpers';
import { getTotalPaceRecordCount, loadPaceEnvelope, PACE_SUBJECTS } from './pace-record-service';

export interface StoreHealthStatus {
    status: 'healthy' | 'partial' | 'unreadable' | 'unavailable';
    count: number | null;
    quarantined: number;
    error?: string;
}

export interface DatabaseHealthCounts {
    students: number;
    sections: number;
    subjects: number;
    classRecords: number;
    hpsRecords: number;
    gradingSheetRecords: number;
    attendanceRecords: number;
    sf2Sheets: number;
    enrollments: number;
    schoolProfile: number;
    observedValues: number;
    announcements?: number;
    users?: number;
    paceRatings?: number;
    totalRecords: number;
    hasData: boolean;
    storeStatuses?: Record<string, StoreHealthStatus>;
    hasUnreadableStores?: boolean;
    quarantinedCount?: number;
    pendingJournal?: boolean;
}

export type DatabaseRecordCounts = DatabaseHealthCounts;

export interface BackupUser {
    uid: string;
    username: string;
    email: string;
    displayName: string;
    roles?: string[];
    primaryRole?: string;
    adviserSectionId?: string;
    adviserSectionName?: string;
    createdAt?: string;
}

/**
 * Directly inspects the underlying FormEaseDB IndexedDB stores and returns
 * live record counts regardless of what is visible on the current screen.
 */
export async function getLiveDatabaseRecordCounts(): Promise<DatabaseHealthCounts> {
    const storeStatuses: Record<string, StoreHealthStatus> = {};
    let hasUnreadableStores = false;

    async function fetchStore<T>(storeName: string): Promise<T[]> {
        try {
            const records = await db.getAllRecords<T>(storeName);
            storeStatuses[storeName] = {
                status: 'healthy',
                count: records.length,
                quarantined: 0,
            };
            return records;
        } catch (err) {
            hasUnreadableStores = true;
            storeStatuses[storeName] = {
                status: 'unreadable',
                count: null,
                quarantined: 0,
                error: err instanceof Error ? err.message : String(err),
            };
            return [];
        }
    }

    try {
        const [
            students,
            sections,
            subjects,
            classRecords,
            hpsRecords,
            gradingSheetRecords,
            attendanceRecords,
            sf2Sheets,
            enrollments,
            schoolProfile,
            observedValues,
            announcements,
            users
        ] = await Promise.all([
            fetchStore<Student>('students'),
            fetchStore<Section>('sections'),
            fetchStore<Subject>('subjects'),
            fetchStore<ClassRecord>('classRecords'),
            fetchStore<HPSRecord>('hpsRecords'),
            fetchStore<ClassRecord>('gradingSheetRecords'),
            fetchStore<AttendanceRecord>('attendanceRecords'),
            fetchStore<SF2Sheet>('sf2Sheets'),
            fetchStore<Enrollment>('enrollments'),
            fetchStore<SchoolProfile>('schoolProfile'),
            fetchStore<ObservedValues>('observedValues'),
            fetchStore<Announcement>('announcements'),
            fetchStore<BackupUser>('users')
        ]);

        // Count Grade 1 PACE Form records in localStorage
        let paceCount = 0;
        try {
            paceCount = getTotalPaceRecordCount();
            if (paceCount === 0) {
                const paceKeys = [
                    'formease_pace_reading_ratings',
                    'formease_pace_language_ratings',
                    'formease_pace_math_ratings',
                    'formease_pace_gmrc_makabansa_ratings',
                    'formease_pace_ratings'
                ];
                for (const key of paceKeys) {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        paceCount += Object.keys(parsed).length;
                    }
                }
            }
        } catch {
            // localStorage not available or parse error
        }

        const quarantineStats = db.getQuarantineStats ? db.getQuarantineStats() : { total: 0, byStore: {} };
        const counts: DatabaseHealthCounts = {
            students: students.length,
            sections: sections.length,
            subjects: subjects.length,
            classRecords: classRecords.length,
            hpsRecords: hpsRecords.length,
            gradingSheetRecords: gradingSheetRecords.length,
            attendanceRecords: attendanceRecords.length,
            sf2Sheets: sf2Sheets.length,
            enrollments: enrollments.length,
            schoolProfile: schoolProfile.length,
            observedValues: observedValues.length,
            announcements: announcements.length,
            users: users.length,
            paceRatings: paceCount,
            totalRecords:
                students.length +
                sections.length +
                subjects.length +
                classRecords.length +
                hpsRecords.length +
                gradingSheetRecords.length +
                attendanceRecords.length +
                sf2Sheets.length +
                enrollments.length +
                schoolProfile.length +
                observedValues.length +
                announcements.length +
                users.length +
                paceCount,
            hasData: false,
            storeStatuses,
            hasUnreadableStores,
            quarantinedCount: quarantineStats.total,
        };

        counts.hasData = counts.totalRecords > 0;
        return counts;
    } catch (e) {
        console.error('Failed to query live database counts:', e);
        return {
            students: 0,
            sections: 0,
            subjects: 0,
            classRecords: 0,
            hpsRecords: 0,
            gradingSheetRecords: 0,
            attendanceRecords: 0,
            sf2Sheets: 0,
            enrollments: 0,
            schoolProfile: 0,
            observedValues: 0,
            announcements: 0,
            users: 0,
            paceRatings: 0,
            totalRecords: 0,
            hasData: false
        };
    }
}

/**
 * Generates an Excel-safe worksheet name strictly <= 31 characters according to
 * Microsoft Excel OpenXML specifications.
 * 
 * Guarantees:
 * - Length strictly <= 31 characters.
 * - Strips all forbidden characters: \ / ? * [ ] :
 * - Strips leading/trailing single quotes.
 * - Standardizes Grade Level (e.g. "Grade 7" -> "G7", "Kindergarten" -> "Kinder")
 * - Standardizes DepEd subject abbreviations (e.g. "Mathematics" -> "Math", "Araling Panlipunan" -> "AP")
 * - Handles collisions via unique suffixes (_2, _3) while never exceeding 31 chars.
 */
export function generateSafeExcelSheetName(
    gradeLevel: string | undefined,
    sectionName: string | undefined,
    subjectName: string | undefined,
    existingSheetNames: Set<string>,
    quarter?: number | string
): string {
    // 1. Standardize Grade Level
    let gStr = '';
    const rawGrade = (gradeLevel || '').trim();
    if (/kinder/i.test(rawGrade)) {
        gStr = 'Kinder';
    } else {
        const gradeMatch = rawGrade.match(/\d+/);
        if (gradeMatch) {
            gStr = `G${gradeMatch[0]}`;
        }
    }

    // 2. Clean Section Name
    let secStr = (sectionName || '').trim();
    // Remove embedded "Grade X - " or "Grade X: " prefix
    secStr = secStr.replace(/^Grade\s*\d+\s*[-_–:]\s*/i, '');
    secStr = secStr.replace(/^Section\s+/i, '');
    secStr = secStr.replace(/[/\\?*[\]:]/g, '-').replace(/\s+/g, '');

    // 3. Abbreviate Subject Name
    const rawSub = (subjectName || '').trim();
    const SUBJ_ABBREVIATIONS: Record<string, string> = {
        'mathematics': 'Math',
        'general mathematics': 'GenMath',
        'english': 'English',
        'science': 'Science',
        'filipino': 'Filipino',
        'araling panlipunan': 'AP',
        'edukasyon sa pagpapakatao': 'EsP',
        'esp': 'EsP',
        'music': 'Music',
        'arts': 'Arts',
        'physical education': 'PE',
        'health': 'Health',
        'physical education and health': 'PEH',
        'peh': 'PEH',
        'mapeh': 'MAPEH',
        'mother tongue': 'MT',
        'mother tongue-based multilingual education': 'MTB-MLE',
        'mtb-mle': 'MTB-MLE',
        'technology and livelihood education': 'TLE',
        'tle': 'TLE',
        'contemporary philippine arts from the regions': 'CPAR',
        'cpar': 'CPAR',
        'disaster readiness and risk reduction': 'DRRR',
        'drrr': 'DRRR',
        'empowerment technologies': 'EmpowermentTech',
        'understanding culture, society and politics': 'UCSP',
        'ucsp': 'UCSP',
        'introduction to the philosophy of the human person': 'Philosophy',
        'media and information literacy': 'MIL',
        'mil': 'MIL',
        'earth and life science': 'EarthLifeSci',
        'physical science': 'PhysSci',
        'komunikasyon at pananaliksik sa wika at kulturang pilipino': 'Komunikasyon',
        'pagbasa at pagsusuri ng iba\'t ibang teksto tungo sa pananaliksik': 'Pagbasa',
        'science, technology, and society': 'STS',
        'core curriculum subject': 'CoreSubj',
        'general subject': 'General'
    };

    let subStr = SUBJ_ABBREVIATIONS[rawSub.toLowerCase()];
    if (!subStr) {
        subStr = rawSub.replace(/[/\\?*[\]:]/g, '').replace(/\s+/g, '');
    }

    // Quarter suffix if quarter > 1
    const qNum = Number(quarter);
    const qSuffix = (!isNaN(qNum) && qNum > 1) ? `_Q${qNum}` : '';

    // Build base candidate
    let candidate = '';
    if (gStr && secStr) {
        candidate = `${gStr}-${secStr}_${subStr}${qSuffix}`;
    } else if (secStr) {
        candidate = `${secStr}_${subStr}${qSuffix}`;
    } else {
        candidate = `${subStr || 'Class'}${qSuffix}`;
    }

    // Sanitize forbidden characters
    candidate = candidate.replace(/[/\\?*[\]:]/g, '-').replace(/^'+|'+$/g, '');
    if (!candidate) candidate = 'Class_Record';

    // Truncate to maximum 31 characters
    if (candidate.length > 31) {
        const allowedBase = 31 - qSuffix.length;
        candidate = candidate.slice(0, Math.max(1, allowedBase)) + qSuffix;
        candidate = candidate.slice(0, 31);
    }

    // Ensure uniqueness within workbook
    let finalName = candidate;
    let counter = 2;
    while (existingSheetNames.has(finalName.toLowerCase())) {
        const suffix = `_${counter}`;
        const allowedBase = 31 - suffix.length;
        finalName = candidate.slice(0, Math.max(1, allowedBase)) + suffix;
        counter++;
    }

    existingSheetNames.add(finalName.toLowerCase());
    return finalName;
}

/**
 * Direct Extraction & Rescue of All DepEd Records into a single Multi-Sheet Excel (.xlsx) file.
 * Formats full E-Class Records with raw Written Works (WW1-10), Performance Tasks (PT1-10),
 * Summative Tests, Periodic Exams, HPS, Percentage Scores (PS), Weighted Scores (WS),
 * Initial Grades, Transmuted Grades, Descriptors, Grade 1 PACE Form qualitative ratings,
 * SF2 monthly attendance, SF2 monthly summary metrics, Teacher Remarks Masterlist,
 * Teacher-Adviser assignments, Announcements, School Calendar, and DepEd Core Values.
 */
export async function exportDirectDatabaseToExcel(): Promise<{
    success: boolean;
    totalRecords: number;
    breakdown: Record<string, number>;
}> {
    const [
        students,
        sections,
        subjects,
        classRecords,
        hpsRecords,
        gradingSheetRecords,
        attendanceRecords,
        sf2Sheets,
        enrollments,
        schoolProfile,
        observedValues,
        announcements,
        users
    ] = await Promise.all([
        db.getAllRecords<Student>('students', { strict: true }),
        db.getAllRecords<Section>('sections', { strict: true }),
        db.getAllRecords<Subject>('subjects', { strict: true }),
        db.getAllRecords<ClassRecord>('classRecords', { strict: true }),
        db.getAllRecords<HPSRecord>('hpsRecords', { strict: true }),
        db.getAllRecords<ClassRecord>('gradingSheetRecords', { strict: true }),
        db.getAllRecords<AttendanceRecord>('attendanceRecords', { strict: true }),
        db.getAllRecords<SF2Sheet>('sf2Sheets', { strict: true }),
        db.getAllRecords<Enrollment>('enrollments', { strict: true }),
        db.getAllRecords<SchoolProfile>('schoolProfile', { strict: true }),
        db.getAllRecords<ObservedValues>('observedValues', { strict: true }),
        db.getAllRecords<Announcement>('announcements', { strict: true }),
        db.getAllRecords<BackupUser>('users', { strict: true })
    ]);

    const activeSchoolYear =
        (typeof localStorage !== 'undefined' ? localStorage.getItem('activeSchoolYear') : null) ||
        '2026-2027';

    // Lookup Maps for human-readable spreadsheet output
    const studentMap = new Map<string, Student>();
    for (const s of students) {
        studentMap.set(s.lrn, s);
    }

    const sectionMap = new Map<string, string>();
    for (const sec of sections) {
        const displayName = sec.section_grade_level ? `${sec.section_grade_level} - ${sec.section_name}` : sec.section_name;
        sectionMap.set(sec.id, displayName);
        sectionMap.set(sec.section_name, displayName);
    }

    const subjectMap = new Map<string, string>();
    for (const sub of subjects) {
        subjectMap.set(sub.id, sub.subject_name);
    }

    const workbook = XLSX.utils.book_new();
    const breakdown: Record<string, number> = {};

    // Build HPS Lookup for component computations
    const findHps = (subjectId: string, quarter: number | string, sy: string, sectionId?: string, subjName?: string): HPSRecord | undefined => {
        const qNum = Number(quarter);
        const matchesSubj = (r: HPSRecord) =>
            r.subject_id === subjectId ||
            (subjName && isMatchingSubject(subjName, r.subject_id));
        const matchesSy = (r: HPSRecord) =>
            !r.school_year || !sy || r.school_year === sy || r.school_year.includes(sy) || sy.includes(r.school_year);

        return (
            hpsRecords.find(
                (r) =>
                    matchesSubj(r) &&
                    Number(r.quarter) === qNum &&
                    matchesSy(r) &&
                    (r.section_id === sectionId || (sectionId && r.id?.includes(sectionId)))
            ) ||
            hpsRecords.find(
                (r) =>
                    matchesSubj(r) &&
                    Number(r.quarter) === qNum &&
                    matchesSy(r)
            ) ||
            hpsRecords.find((r) => matchesSubj(r) && Number(r.quarter) === qNum)
        );
    };

    // =========================================================================
    // SHEET 1: DepEd E-Class Records (Exact DepEd Visual Template Format matching UI)
    // Guaranteed to generate for ALL active sections & curriculum subjects,
    // including complete student rosters (MALE & FEMALE) even before grades are entered.
    // =========================================================================
    const mergedGradeRecordsMap = new Map<string, {
        rec: ClassRecord;
        source: 'E-Class Record Store' | 'Published Grading Sheet';
    }>();

    // 1. Add classRecords (primary rich scores)
    for (const cr of classRecords) {
        const key = `${cr.student_lrn}_${cr.subject_id}_${cr.quarter}_${cr.school_year || ''}`;
        mergedGradeRecordsMap.set(key, { rec: cr, source: 'E-Class Record Store' });
    }

    // 2. Add or merge gradingSheetRecords
    for (const gr of gradingSheetRecords) {
        const key = `${gr.student_lrn}_${gr.subject_id}_${gr.quarter}_${gr.school_year || ''}`;
        if (!mergedGradeRecordsMap.has(key)) {
            mergedGradeRecordsMap.set(key, { rec: gr, source: 'Published Grading Sheet' });
        } else {
            const existing = mergedGradeRecordsMap.get(key)!;
            if ((!existing.rec.final_grade || Number(existing.rec.final_grade) === 0) && gr.final_grade) {
                existing.rec.final_grade = gr.final_grade;
            }
        }
    }

    const allEcrEntries = Array.from(mergedGradeRecordsMap.values());

    if (sections.length > 0 || allEcrEntries.length > 0) {
        const prof = schoolProfile[0] || {} as Partial<SchoolProfile>;
        const schoolNameStr = prof.name || 'MATATAG HIGH SCHOOL';
        const schoolIdStr = prof.school_id || '';
        const regionStr = prof.region || '';
        const divisionStr = prof.division || '';
        const districtStr = prof.district || '';
        const teacherDefaultStr = prof.adviser_name || prof.head_name || '';

        // Group ECR entries by: Section + Subject + Quarter + School Year
        type EcrGroupKey = string;
        const ecrGroups = new Map<EcrGroupKey, Array<{ rec: ClassRecord; source: string }>>();

        // 1. Ensure every section and its assigned curriculum subjects have a class record block
        for (const sec of sections) {
            let secSubjects = subjects.filter(
                (sub) => sub.section_id === sec.id || (sub.grade_level && sub.grade_level === sec.section_grade_level)
            );
            if (secSubjects.length === 0) {
                secSubjects = subjects.filter((sub) => !sub.section_id);
            }
            if (secSubjects.length === 0 && subjects.length > 0) {
                secSubjects = subjects.slice(0, 1);
            }
            if (secSubjects.length === 0) {
                secSubjects = [{ id: 'core_subject', subject_name: 'Core Curriculum Subject' } as Subject];
            }

            for (const sub of secSubjects) {
                const groupKey = `${sec.id}____${sub.id}____1____${activeSchoolYear}`;
                if (!ecrGroups.has(groupKey)) {
                    ecrGroups.set(groupKey, []);
                }
            }
        }

        // 2. Add or merge any entries from allEcrEntries (e.g. Quarters 2, 3, 4, or existing grade records)
        for (const entry of allEcrEntries) {
            const student = studentMap.get(entry.rec.student_lrn);
            const secKey = entry.rec.section_id || student?.student_section || 'default_section';
            
            // If entry's subject_id is not directly in subjects, resolve it to matching active subject
            let subKey = entry.rec.subject_id || 'default_subject';
            const targetSub = subjects.find(s => s.id === subKey) ||
                              subjects.find(s => isMatchingSubject(s.subject_name, entry.rec.subject_id, entry.rec.subject_name));
            if (targetSub) {
                subKey = targetSub.id;
            }

            const qKey = String(entry.rec.quarter || 1);
            const syKey = entry.rec.school_year || activeSchoolYear;
            const groupKey = `${secKey}____${subKey}____${qKey}____${syKey}`;

            if (!ecrGroups.has(groupKey)) {
                ecrGroups.set(groupKey, []);
            }
            const list = ecrGroups.get(groupKey)!;
            if (!list.some((item) => item.rec.student_lrn === entry.rec.student_lrn)) {
                list.push(entry);
            }
        }

        const existingSheetNames = new Set<string>();
        const ecrDirectoryRows: Array<Record<string, unknown>> = [];
        const classSheets: Array<{ name: string; ws: XLSX.WorkSheet; count: number }> = [];

        const masterAoa: unknown[][] = [];
        const masterMerges: XLSX.Range[] = [];
        let totalStudentRowsCount = 0;

        const classCols = [
            { wch: 32 }, // Learners' Names
            { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, // WW 1-5
            { wch: 9 }, { wch: 9 }, { wch: 9 }, // WW Total, PS, WS
            { wch: 6 }, { wch: 6 }, { wch: 6 }, // PT 1-3
            { wch: 9 }, { wch: 9 }, { wch: 9 }, // PT Total, PS, WS
            { wch: 7 }, { wch: 7 }, { wch: 8 }, // ST1, ST2, TE
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, // ST WS, PS, WS
            { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 10 } // Initial Grade, Term Grade, Descriptor, Remarks
        ];

        for (const [groupKey, entries] of ecrGroups.entries()) {
            const [secId, subId, qStr, syStr] = groupKey.split('____');
            const qNum = Number(qStr) || 1;
            const secName = (secId ? sectionMap.get(secId) : '') || secId || 'Unassigned Section';
            const subjName = (subId ? subjectMap.get(subId) : '') || subId || 'General Subject';
            const termLabel = qNum === 1 ? 'TERM 1' : qNum === 2 ? 'TERM 2' : qNum === 3 ? 'TERM 3' : `QUARTER ${qNum}`;

            const cluster = getSubjectCluster(subjName);
            const weights = getWeights(cluster);
            const wwWeightPct = Math.round(weights.written_works * 100);
            const ptWeightPct = Math.round(weights.performance_tasks * 100);
            const qaWeightPct = Math.round(weights.quarterly_exam * 100);

            // Fetch HPS
            const hps = findHps(subId, qNum, syStr, secId, subjName);
            const hpsWw = Array.isArray(hps?.written_works) ? hps.written_works : [];
            const hpsPt = Array.isArray(hps?.performance_tasks) ? hps.performance_tasks : [];
            const rawHpsQa = (hps as (HPSRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;
            const hpsQa = Array.isArray(rawHpsQa) ? rawHpsQa : [];

            const hpsWwTotal = hpsWw.map(Number).filter((v) => !isNaN(v) && v > 0).reduce((a, b) => a + b, 0);
            const hpsPtTotal = hpsPt.map(Number).filter((v) => !isNaN(v) && v > 0).reduce((a, b) => a + b, 0);
            const hpsSt1 = Number(hpsQa[0] || 0);
            const hpsSt2 = Number(hpsQa[1] || 0);
            const hpsQaExam = Number(hpsQa[2] || hps?.quarterly_exam || 0);

            const secObj = sections.find((s) => s.id === secId || s.section_name === secId);
            const teacherAssigned = secObj?.adviser_name || teacherDefaultStr;
            const gradeLevel = secObj?.section_grade_level || 'Grade 7';

            // Generate safe unique sheet name for this class (<= 31 chars, sanitized)
            const safeSheetName = generateSafeExcelSheetName(
                gradeLevel,
                secObj?.section_name || secName,
                subjName,
                existingSheetNames,
                qNum
            );

            // Class-specific sheet structures
            const classAoa: unknown[][] = [];
            const classMerges: XLSX.Range[] = [];
            const classStartRow = 0;
            const masterStartRow = masterAoa.length;

            // Row 1: CLASS RECORD
            const rClassRecord = ['CLASS RECORD', ...Array(26).fill('')];
            classAoa.push(rClassRecord);
            masterAoa.push(rClassRecord);
            classMerges.push({ s: { r: classStartRow, c: 0 }, e: { r: classStartRow, c: 26 } });
            masterMerges.push({ s: { r: masterStartRow, c: 0 }, e: { r: masterStartRow, c: 26 } });

            // Row 2: Subtitle
            const rSubtitle = ['(Pursuant to DepEd Order 15 series of 2026 / DepEd Order 8 series of 2015)', ...Array(26).fill('')];
            classAoa.push(rSubtitle);
            masterAoa.push(rSubtitle);
            classMerges.push({ s: { r: classStartRow + 1, c: 0 }, e: { r: classStartRow + 1, c: 26 } });
            masterMerges.push({ s: { r: masterStartRow + 1, c: 0 }, e: { r: masterStartRow + 1, c: 26 } });

            // Row 3: School Administrative Metadata - Region / Division / District
            const rAdmin = [
                'REGION:', regionStr, '', '',
                'DIVISION:', divisionStr, '', '',
                'DISTRICT:', districtStr, ...Array(18).fill('')
            ];
            classAoa.push(rAdmin);
            masterAoa.push(rAdmin);

            // Row 4: School Name / ID / SY
            const rSchool = [
                'SCHOOL NAME:', schoolNameStr, '', '',
                'SCHOOL ID:', schoolIdStr, '', '',
                'SCHOOL YEAR:', syStr || activeSchoolYear, ...Array(18).fill('')
            ];
            classAoa.push(rSchool);
            masterAoa.push(rSchool);

            // Row 5: Term Banner: TERM | GRADE & SECTION | TEACHER | SUBJECT
            const rBanner = [
                termLabel,
                `GRADE & SECTION: ${secName.toUpperCase()}`, '', '', '', '', '', '', '',
                `TEACHER: ${teacherAssigned.toUpperCase()}`, '', '', '', '', '',
                `SUBJECT: ${subjName.toUpperCase()}`, ...Array(10).fill('')
            ];
            classAoa.push(rBanner);
            masterAoa.push(rBanner);
            classMerges.push({ s: { r: classStartRow + 4, c: 1 }, e: { r: classStartRow + 4, c: 8 } });
            classMerges.push({ s: { r: classStartRow + 4, c: 9 }, e: { r: classStartRow + 4, c: 15 } });
            classMerges.push({ s: { r: classStartRow + 4, c: 16 }, e: { r: classStartRow + 4, c: 26 } });
            masterMerges.push({ s: { r: masterStartRow + 4, c: 1 }, e: { r: masterStartRow + 4, c: 8 } });
            masterMerges.push({ s: { r: masterStartRow + 4, c: 9 }, e: { r: masterStartRow + 4, c: 15 } });
            masterMerges.push({ s: { r: masterStartRow + 4, c: 16 }, e: { r: masterStartRow + 4, c: 26 } });

            // Table Header Row 1 (Row 5)
            const rHead1 = [
                "LEARNERS' NAMES",
                `WRITTEN / ORAL WORKS (${wwWeightPct}%)`, '', '', '', '', '', '', '',
                `PRODUCT / PERFORMANCE TASKS (${ptWeightPct}%)`, '', '', '', '', '',
                `SUMMATIVE TESTS AND TERM EXAMINATIONS (${qaWeightPct}%)`, '', '', '', '', '', '', '',
                'INITIAL GRADE',
                'TERM GRADE',
                'DESCRIPTOR',
                'REMARKS'
            ];
            // Table Header Row 2 (Row 6)
            const rHead2 = [
                '',
                '1', '2', '3', '4', '5', 'Total', 'PS', 'WS',
                '1', '2', '3', 'Total', 'PS', 'WS',
                'ST1', 'ST2', 'TE', 'WS ST1 (10%)', 'WS ST2 (10%)', 'WS TE (10%)', 'PS (ST & TE)', 'WS (ST & TE)',
                '', '', '', ''
            ];
            classAoa.push(rHead1, rHead2);
            masterAoa.push(rHead1, rHead2);

            const ch1 = classStartRow + 5;
            const ch2 = classStartRow + 6;
            classMerges.push({ s: { r: ch1, c: 0 }, e: { r: ch2, c: 0 } });
            classMerges.push({ s: { r: ch1, c: 1 }, e: { r: ch1, c: 8 } });
            classMerges.push({ s: { r: ch1, c: 9 }, e: { r: ch1, c: 14 } });
            classMerges.push({ s: { r: ch1, c: 15 }, e: { r: ch1, c: 22 } });
            classMerges.push({ s: { r: ch1, c: 23 }, e: { r: ch2, c: 23 } });
            classMerges.push({ s: { r: ch1, c: 24 }, e: { r: ch2, c: 24 } });
            classMerges.push({ s: { r: ch1, c: 25 }, e: { r: ch2, c: 25 } });
            classMerges.push({ s: { r: ch1, c: 26 }, e: { r: ch2, c: 26 } });

            const mh1 = masterStartRow + 5;
            const mh2 = masterStartRow + 6;
            masterMerges.push({ s: { r: mh1, c: 0 }, e: { r: mh2, c: 0 } });
            masterMerges.push({ s: { r: mh1, c: 1 }, e: { r: mh1, c: 8 } });
            masterMerges.push({ s: { r: mh1, c: 9 }, e: { r: mh1, c: 14 } });
            masterMerges.push({ s: { r: mh1, c: 15 }, e: { r: mh1, c: 22 } });
            masterMerges.push({ s: { r: mh1, c: 23 }, e: { r: mh2, c: 23 } });
            masterMerges.push({ s: { r: mh1, c: 24 }, e: { r: mh2, c: 24 } });
            masterMerges.push({ s: { r: mh1, c: 25 }, e: { r: mh2, c: 25 } });
            masterMerges.push({ s: { r: mh1, c: 26 }, e: { r: mh2, c: 26 } });

            // Row startRow + 7: HIGHEST POSSIBLE SCORE
            const rHps = [
                'HIGHEST POSSIBLE SCORE',
                hpsWw[0] ?? '', hpsWw[1] ?? '', hpsWw[2] ?? '', hpsWw[3] ?? '', hpsWw[4] ?? '',
                hpsWwTotal > 0 ? hpsWwTotal : '', '100.00%', `${wwWeightPct}%`,
                hpsPt[0] ?? '', hpsPt[1] ?? '', hpsPt[2] ?? '',
                hpsPtTotal > 0 ? hpsPtTotal : '', '100.00%', `${ptWeightPct}%`,
                hpsSt1 > 0 ? hpsSt1 : '', hpsSt2 > 0 ? hpsSt2 : '', hpsQaExam > 0 ? hpsQaExam : '',
                '10.00%', '10.00%', '10.00%', '100.00%', `${qaWeightPct}%`,
                '', '', '', ''
            ];
            classAoa.push(rHps);
            masterAoa.push(rHps);

            // Gather enrolled students for this section
            const enrolledInSec = students.filter(
                (s) =>
                    s.student_section === secId ||
                    s.student_section === secName ||
                    (secId && s.student_section === secObj?.section_name)
            );

            // Deduplicate all students for this class table
            const studentRosterMap = new Map<string, Student>();
            for (const s of enrolledInSec) {
                studentRosterMap.set(s.lrn, s);
            }
            for (const item of entries) {
                if (!studentRosterMap.has(item.rec.student_lrn)) {
                    const s = studentMap.get(item.rec.student_lrn);
                    if (s) studentRosterMap.set(s.lrn, s);
                    else {
                        studentRosterMap.set(item.rec.student_lrn, {
                            lrn: item.rec.student_lrn,
                            last_name: item.rec.student_lrn,
                            first_name: '',
                            gender: ''
                        } as unknown as Student);
                    }
                }
            }

            // Separate students into MALE and FEMALE
            const maleEntries: Array<{ rec: ClassRecord; student?: Student }> = [];
            const femaleEntries: Array<{ rec: ClassRecord; student?: Student }> = [];

            for (const s of studentRosterMap.values()) {
                const existing = entries.find((e) => e.rec.student_lrn === s.lrn) ||
                    allEcrEntries.find((e) =>
                        e.rec.student_lrn === s.lrn &&
                        Number(e.rec.quarter) === qNum &&
                        (!e.rec.school_year || !syStr || e.rec.school_year === syStr || e.rec.school_year.includes(syStr) || syStr.includes(e.rec.school_year)) &&
                        (
                            e.rec.subject_id === subId ||
                            (subjName && isMatchingSubject(subjName, e.rec.subject_id, e.rec.subject_name))
                        )
                    );
                const rec: ClassRecord = existing?.rec || ({
                    id: `${s.lrn}_${subId}_${qNum}`,
                    student_lrn: s.lrn,
                    subject_id: subId,
                    section_id: secId,
                    school_year: syStr,
                    quarter: qNum as ClassRecord['quarter'],
                    written_works: [],
                    performance_tasks: [],
                    quarterly_exam: '',
                    final_grade: ''
                } as ClassRecord);

                const gUpper = (s.gender || '').trim().toUpperCase();
                if (gUpper.startsWith('M')) {
                    maleEntries.push({ rec, student: s });
                } else {
                    femaleEntries.push({ rec, student: s });
                }
            }

            const sortByName = (a: { student?: Student }, b: { student?: Student }) => {
                const nameA = a.student ? `${a.student.last_name}, ${a.student.first_name}` : '';
                const nameB = b.student ? `${b.student.last_name}, ${b.student.first_name}` : '';
                return nameA.localeCompare(nameB);
            };

            maleEntries.sort(sortByName);
            femaleEntries.sort(sortByName);

            let classGradedCount = 0;
            let classStudentRowsCount = 0;

            const buildStudentRow = (idx: number, g: ClassRecord, student?: Student) => {
                totalStudentRowsCount++;
                classStudentRowsCount++;
                const studentName = student
                    ? `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`.toUpperCase()
                    : (g.student_lrn || 'STUDENT');

                const ww = Array.isArray(g.written_works) ? g.written_works : [];
                const pt = Array.isArray(g.performance_tasks) ? g.performance_tasks : [];
                const rawRec = g as ClassRecord & { summative_tests?: (number | string)[]; initial_grade?: number | string };
                const st = Array.isArray(rawRec.summative_tests) ? rawRec.summative_tests : [];

                const wwScores = ww.map((v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) ? Number(v) : null));
                const ptScores = pt.map((v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) ? Number(v) : null));
                const wwTotal = wwScores.filter((v): v is number => v !== null).reduce((a, b) => a + b, 0);
                const ptTotal = ptScores.filter((v): v is number => v !== null).reduce((a, b) => a + b, 0);

                const wwPS = hpsWwTotal > 0 && wwScores.some((v) => v !== null)
                    ? Math.round((wwTotal / hpsWwTotal) * 10000) / 100
                    : '';
                const ptPS = hpsPtTotal > 0 && ptScores.some((v) => v !== null)
                    ? Math.round((ptTotal / hpsPtTotal) * 10000) / 100
                    : '';

                const st1Val = st[0] !== '' && st[0] !== null && st[0] !== undefined ? Number(st[0]) : null;
                const st2Val = st[1] !== '' && st[1] !== null && st[1] !== undefined ? Number(st[1]) : null;
                const qaScoreVal = st[2] || g.quarterly_exam || '';
                const qaScoreNum = Number(qaScoreVal);
                const validExam = !isNaN(qaScoreNum) && qaScoreVal !== '' ? qaScoreNum : null;

                const st1WS = st1Val !== null && hpsSt1 > 0 ? Math.round((st1Val / hpsSt1) * 10 * 100) / 100 : '';
                const st2WS = st2Val !== null && hpsSt2 > 0 ? Math.round((st2Val / hpsSt2) * 10 * 100) / 100 : '';
                const teWS = validExam !== null && hpsQaExam > 0 ? Math.round((validExam / hpsQaExam) * 10 * 100) / 100 : '';

                const qaPS = validExam !== null && hpsQaExam > 0 ? Math.round((validExam / hpsQaExam) * 10000) / 100 : '';
                const wwWS = typeof wwPS === 'number' ? Math.round(wwPS * normalizeWeightFraction(weights.written_works) * 100) / 100 : '';
                const ptWS = typeof ptPS === 'number' ? Math.round(ptPS * normalizeWeightFraction(weights.performance_tasks) * 100) / 100 : '';
                const qaWS = typeof qaPS === 'number' ? Math.round(qaPS * normalizeWeightFraction(weights.quarterly_exam) * 100) / 100 : '';

                const validWS = [wwWS, ptWS, qaWS].filter((v): v is number => typeof v === 'number');
                const computedInitial = validWS.length > 0 ? Math.round(validWS.reduce((a, b) => a + b, 0) * 100) / 100 : '';
                const rawInit = rawRec.initial_grade ?? computedInitial;
                const initialGrade = typeof rawInit === 'number' && rawInit > 100 && rawInit <= 10000 ? Math.round((rawInit / 100) * 100) / 100 : rawInit;

                let finalGradeVal = g.final_grade ?? '';
                if (typeof initialGrade === 'number' && initialGrade > 0 && (Number(finalGradeVal) === 100 || !finalGradeVal || Number(finalGradeVal) === 0)) {
                    finalGradeVal = transmuteGrade(initialGrade, g.school_year || undefined);
                }

                const finalGradeNum = Number(finalGradeVal);
                let descriptor = '';
                let remarks = '';
                if (!isNaN(finalGradeNum) && finalGradeNum > 0) {
                    classGradedCount++;
                    const studentGradeLevel = student?.grade_level || secObj?.section_grade_level || 'Grade 7';
                    descriptor = getGradeDescriptorWithFilipino(finalGradeNum, studentGradeLevel, g.school_year || undefined);
                    remarks = finalGradeNum >= 75 ? 'PASSED' : 'FAILED';
                }

                return [
                    `${idx + 1}. ${studentName}`,
                    ww[0] ?? '', ww[1] ?? '', ww[2] ?? '', ww[3] ?? '', ww[4] ?? '',
                    wwScores.some((v) => v !== null) ? wwTotal : '', wwPS, wwWS,
                    pt[0] ?? '', pt[1] ?? '', pt[2] ?? '',
                    ptScores.some((v) => v !== null) ? ptTotal : '', ptPS, ptWS,
                    st[0] ?? '', st[1] ?? '', qaScoreVal,
                    st1WS, st2WS, teWS, qaPS, qaWS,
                    initialGrade, finalGradeVal, descriptor, remarks
                ];
            };

            // MALE SECTION
            const rMaleHeader = ['MALE', ...Array(26).fill('')];
            classAoa.push(rMaleHeader);
            masterAoa.push(rMaleHeader);
            if (maleEntries.length === 0) {
                const rEmptyMale = ['(No male students enrolled in section)', ...Array(26).fill('')];
                classAoa.push(rEmptyMale);
                masterAoa.push(rEmptyMale);
            } else {
                maleEntries.forEach(({ rec: g, student }, i) => {
                    const row = buildStudentRow(i, g, student);
                    classAoa.push(row);
                    masterAoa.push(row);
                });
            }

            // FEMALE SECTION
            const rFemaleHeader = ['FEMALE', ...Array(26).fill('')];
            classAoa.push(rFemaleHeader);
            masterAoa.push(rFemaleHeader);
            if (femaleEntries.length === 0) {
                const rEmptyFemale = ['(No female students enrolled in section)', ...Array(26).fill('')];
                classAoa.push(rEmptyFemale);
                masterAoa.push(rEmptyFemale);
            } else {
                femaleEntries.forEach(({ rec: g, student }, i) => {
                    const row = buildStudentRow(i, g, student);
                    classAoa.push(row);
                    masterAoa.push(row);
                });
            }

            // Spacing rows between multiple section/subject/term blocks in master sheet
            masterAoa.push(Array(27).fill(''));
            masterAoa.push(Array(27).fill(''));

            // Build individual class worksheet
            const classWs = XLSX.utils.aoa_to_sheet(classAoa);
            classWs['!merges'] = classMerges;
            classWs['!cols'] = classCols;
            classSheets.push({ name: safeSheetName, ws: classWs, count: classStudentRowsCount });

            // Record in directory
            ecrDirectoryRows.push({
                'Sheet Tab Name': safeSheetName,
                'Grade Level': gradeLevel,
                'Section Name': secObj?.section_name || secName,
                'Subject': subjName,
                'Term / Quarter': termLabel,
                'Teacher / Adviser': teacherAssigned,
                'Male Students': maleEntries.length,
                'Female Students': femaleEntries.length,
                'Total Students': maleEntries.length + femaleEntries.length,
                'Graded Students': classGradedCount,
                'School Year': syStr || activeSchoolYear
            });
        }

        // 1. Directory Sheet: ECR_Classes_Directory
        if (ecrDirectoryRows.length > 0) {
            const dirWs = XLSX.utils.json_to_sheet(ecrDirectoryRows);
            dirWs['!cols'] = [
                { wch: 28 }, // Sheet Tab Name
                { wch: 14 }, // Grade Level
                { wch: 20 }, // Section Name
                { wch: 26 }, // Subject
                { wch: 16 }, // Term / Quarter
                { wch: 26 }, // Teacher / Adviser
                { wch: 14 }, // Male Students
                { wch: 16 }, // Female Students
                { wch: 14 }, // Total Students
                { wch: 16 }, // Graded Students
                { wch: 14 }  // School Year
            ];
            XLSX.utils.book_append_sheet(workbook, dirWs, 'ECR_Classes_Directory');
            breakdown['ECR_Classes_Directory'] = ecrDirectoryRows.length;
        }

        // 2. Individual Class Worksheets (e.g. G7-Sampaguita_English, G7-Sampaguita_Math)
        for (const cs of classSheets) {
            XLSX.utils.book_append_sheet(workbook, cs.ws, cs.name);
            breakdown[cs.name] = cs.count;
        }

        // 3. Master Roll: DepEd_EClass_Records (All classes combined)
        const masterWs = XLSX.utils.aoa_to_sheet(masterAoa);
        masterWs['!merges'] = masterMerges;
        masterWs['!cols'] = classCols;
        XLSX.utils.book_append_sheet(workbook, masterWs, 'DepEd_EClass_Records');
        breakdown['DepEd_EClass_Records'] = totalStudentRowsCount > 0 ? totalStudentRowsCount : allEcrEntries.length;
    }

    // =========================================================================
    // SHEET 2: Highest Possible Scores (HPS) for ECR Standards
    // =========================================================================
    if (hpsRecords.length > 0) {
        const hpsRows = hpsRecords.map((h) => {
            const secName = (h.section_id ? sectionMap.get(h.section_id) : '') || h.section_id || 'All Sections';
            const subjName = (h.subject_id ? subjectMap.get(h.subject_id) : '') || h.subject_id || 'All Subjects';
            const rawQa = (h as (HPSRecord & { summative_tests?: (number | string)[] })).summative_tests;
            const qa = Array.isArray(rawQa) ? rawQa : [];

            const hpsWw = Array.isArray(h.written_works) ? h.written_works : [];
            const hpsPt = Array.isArray(h.performance_tasks) ? h.performance_tasks : [];
            const totalWw = hpsWw.map(Number).filter((v) => !isNaN(v) && v > 0).reduce((a, b) => a + b, 0);
            const totalPt = hpsPt.map(Number).filter((v) => !isNaN(v) && v > 0).reduce((a, b) => a + b, 0);

            const cluster = getSubjectCluster(subjName);
            const weights = getWeights(cluster);

            return {
                'Section': secName,
                'Subject': subjName,
                'Quarter / Term': h.quarter ? `Quarter ${h.quarter}` : '',
                'School Year': h.school_year || '',
                // HPS Written Works
                'HPS WW1': hpsWw[0] ?? '',
                'HPS WW2': hpsWw[1] ?? '',
                'HPS WW3': hpsWw[2] ?? '',
                'HPS WW4': hpsWw[3] ?? '',
                'HPS WW5': hpsWw[4] ?? '',
                'HPS WW6': hpsWw[5] ?? '',
                'HPS WW7': hpsWw[6] ?? '',
                'HPS WW8': hpsWw[7] ?? '',
                'HPS WW9': hpsWw[8] ?? '',
                'HPS WW10': hpsWw[9] ?? '',
                'Total HPS WW': totalWw > 0 ? totalWw : '',
                'WW Weight (%)': `${Math.round(weights.written_works * 100)}%`,
                // HPS Performance Tasks
                'HPS PT1': hpsPt[0] ?? '',
                'HPS PT2': hpsPt[1] ?? '',
                'HPS PT3': hpsPt[2] ?? '',
                'HPS PT4': hpsPt[3] ?? '',
                'HPS PT5': hpsPt[4] ?? '',
                'HPS PT6': hpsPt[5] ?? '',
                'HPS PT7': hpsPt[6] ?? '',
                'HPS PT8': hpsPt[7] ?? '',
                'HPS PT9': hpsPt[8] ?? '',
                'HPS PT10': hpsPt[9] ?? '',
                'Total HPS PT': totalPt > 0 ? totalPt : '',
                'PT Weight (%)': `${Math.round(weights.performance_tasks * 100)}%`,
                // HPS Quarterly Assessment
                'HPS ST1': qa[0] ?? '',
                'HPS ST2': qa[1] ?? '',
                'HPS Exam': qa[2] || h.quarterly_exam || '',
                'QA Weight (%)': `${Math.round(weights.quarterly_exam * 100)}%`
            };
        });

        const ws = XLSX.utils.json_to_sheet(hpsRows);
        XLSX.utils.book_append_sheet(workbook, ws, 'HPS_Highest_Possible_Scores');
        breakdown['HPS_Highest_Possible_Scores'] = hpsRecords.length;
    }

    // =========================================================================
    // SHEET 3: Consolidated Term Grades (Summary across Quarters / SF9 & SF10)
    // Guaranteed to generate for all enrolled learners and curriculum subjects.
    // =========================================================================
    const allGradeSources = [...classRecords, ...gradingSheetRecords];
    if (students.length > 0 || allGradeSources.length > 0) {
        const summaryMap = new Map<string, {
            lrn: string;
            studentName: string;
            gender: string;
            section: string;
            subject: string;
            sy: string;
            gradeLevel: string;
            q1: number | string;
            q2: number | string;
            q3: number | string;
            q4: number | string;
        }>();

        // 1. Initialize for all enrolled students across all assigned curriculum subjects
        for (const s of students) {
            const studentSec = sections.find(
                (sec) => sec.id === s.student_section || sec.section_name === s.student_section
            );
            const secName = (studentSec ? sectionMap.get(studentSec.id) : '') || studentSec?.section_name || s.student_section || 'Unassigned Section';
            let studentSubjects = subjects.filter(
                (sub) => sub.section_id === studentSec?.id || (sub.grade_level && sub.grade_level === s.grade_level)
            );
            if (studentSubjects.length === 0) {
                studentSubjects = subjects.filter((sub) => !sub.section_id);
            }
            if (studentSubjects.length === 0 && subjects.length > 0) {
                studentSubjects = subjects;
            }

            const studentName = `${s.last_name}, ${s.first_name}${s.middle_name ? ' ' + s.middle_name : ''}`;

            for (const sub of studentSubjects) {
                const key = `${s.lrn}_${sub.id}_${activeSchoolYear}`;
                summaryMap.set(key, {
                    lrn: s.lrn,
                    studentName,
                    gender: s.gender || '',
                    section: secName,
                    subject: sub.subject_name,
                    sy: activeSchoolYear,
                    gradeLevel: s.grade_level || 'Grade 7',
                    q1: '',
                    q2: '',
                    q3: '',
                    q4: ''
                });
            }
        }

        // 2. Add or update grades from allGradeSources
        for (const g of allGradeSources) {
            const key = `${g.student_lrn}_${g.subject_id}_${g.school_year || activeSchoolYear}`;
            const student = studentMap.get(g.student_lrn);
            const studentName = student
                ? `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`
                : '';
            const secName = (g.section_id ? sectionMap.get(g.section_id) : '') || g.section_id || student?.student_section || '';
            const subjName = (g.subject_id ? subjectMap.get(g.subject_id) : '') || g.subject_name || g.subject_id || '';

            if (!summaryMap.has(key)) {
                summaryMap.set(key, {
                    lrn: g.student_lrn,
                    studentName,
                    gender: student?.gender || '',
                    section: secName,
                    subject: subjName,
                    sy: g.school_year || activeSchoolYear,
                    gradeLevel: student?.grade_level || 'Grade 7',
                    q1: '',
                    q2: '',
                    q3: '',
                    q4: ''
                });
            }

            const entry = summaryMap.get(key)!;
            const q = Number(g.quarter);
            const gradeVal = g.final_grade ?? '';
            if (q === 1 && entry.q1 === '') entry.q1 = gradeVal;
            else if (q === 2 && entry.q2 === '') entry.q2 = gradeVal;
            else if (q === 3 && entry.q3 === '') entry.q3 = gradeVal;
            else if (q === 4 && entry.q4 === '') entry.q4 = gradeVal;
        }

        const consolidatedRows = Array.from(summaryMap.values()).map((row) => {
            const validGrades = [row.q1, row.q2, row.q3, row.q4]
                .map((v) => Number(v))
                .filter((v) => !isNaN(v) && v > 0);
            const avg = validGrades.length > 0
                ? Math.round((validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length) * 100) / 100
                : '';

            let descriptor = '';
            let action = '';
            if (typeof avg === 'number' && avg > 0) {
                descriptor = getGradeDescriptorWithFilipino(avg, row.gradeLevel, row.sy || undefined);
                action = avg >= 75 ? 'PASSED' : 'FAILED';
            }

            return {
                'Student LRN': row.lrn,
                'Learner Name': row.studentName,
                'Gender': row.gender,
                'Grade Level': row.gradeLevel,
                'Section': row.section,
                'Subject': row.subject,
                'School Year': row.sy,
                '1st Quarter': row.q1,
                '2nd Quarter': row.q2,
                '3rd Quarter': row.q3,
                '4th Quarter': row.q4,
                'Final Rating / General Average': avg,
                'Descriptor': descriptor,
                'Remarks': action
            };
        });

        consolidatedRows.sort((a, b) => {
            const gradeCmp = (a['Grade Level'] || '').localeCompare(b['Grade Level'] || '');
            if (gradeCmp !== 0) return gradeCmp;
            const secCmp = (a['Section'] || '').localeCompare(b['Section'] || '');
            if (secCmp !== 0) return secCmp;
            const subCmp = (a['Subject'] || '').localeCompare(b['Subject'] || '');
            if (subCmp !== 0) return subCmp;
            return (a['Learner Name'] || '').localeCompare(b['Learner Name'] || '');
        });

        if (consolidatedRows.length > 0) {
            const ws = XLSX.utils.json_to_sheet(consolidatedRows);
            ws['!cols'] = [
                { wch: 16 }, { wch: 26 }, { wch: 8 }, { wch: 14 }, { wch: 22 }, { wch: 24 },
                { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
                { wch: 28 }, { wch: 24 }, { wch: 12 }
            ];
            XLSX.utils.book_append_sheet(workbook, ws, 'Consolidated_Term_Grades');
            breakdown['Consolidated_Term_Grades'] = consolidatedRows.length;
        }
    }

    // =========================================================================
    // SHEET 4: SF2 Monthly Totals & Attendance Summary (DepEd SF2 Monthly Metrics)
    // Enrolment M/F, Class Days, Total Present, Absences, ADA, Monthly Attendance %,
    // 5+ Consecutive Absences, NLS Dropouts, and Transfers In/Out.
    // =========================================================================
    if (sections.length > 0) {
        const sf2SummaryRows: Array<Record<string, unknown>> = [];
        const _DEPED_MONTHS = ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'];

        for (const sec of sections) {
            const secDisplayName = sec.section_grade_level ? `${sec.section_grade_level} - ${sec.section_name}` : sec.section_name;
            const secStudents = students.filter((s) => s.student_section === sec.id || s.student_section === sec.section_name);
            const males = secStudents.filter((s) => (s.gender || '').trim().toLowerCase() === 'male');
            const females = secStudents.filter((s) => (s.gender || '').trim().toLowerCase() === 'female');
            const adviserName = sec.adviser_name || schoolProfile[0]?.adviser_name || '';

            const sectionSheets = sf2Sheets.filter((sheet) => sheet.section_id === sec.id || sheet.section_id === sec.section_name);
            const monthsToProcess = sectionSheets.length > 0
                ? Array.from(new Set(sectionSheets.map((s) => (s.month || '').toUpperCase()).filter(Boolean)))
                : ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER'];

            for (const month of monthsToProcess) {
                const sheet = sectionSheets.find((s) => (s.month || '').toUpperCase() === month);
                const dateLabels = sheet?.date_labels || {};
                const filledDaysCount = Object.values(dateLabels).filter((v) => String(v || '').trim() !== '').length || 20;
                const attData = sheet?.attendance || {};

                let totalMalePresent = 0;
                let totalMaleAbsent = 0;
                let totalMaleTardy = 0;
                let maleConsecutive = 0;

                for (const s of males) {
                    const record = attData[s.lrn] || {};
                    let absent = 0;
                    let tardy = 0;
                    let consecutive = 0;
                    let had5Consecutive = false;

                    for (let d = 1; d <= 30; d++) {
                        const dateVal = dateLabels[d];
                        const key = dateVal && dateVal.trim() ? `date_${dateVal.trim()}` : d;
                        const status = String(record[key] !== undefined ? record[key] : (record[d] || '')).toLowerCase();

                        if (status === 'absent' || status === 'x') {
                            absent++;
                            consecutive++;
                            if (consecutive >= 5) had5Consecutive = true;
                        } else if (status.includes('tardy') || status.includes('late') || status === 'cutting') {
                            tardy++;
                            consecutive = 0;
                        } else {
                            consecutive = 0;
                        }
                    }
                    const present = Math.max(0, filledDaysCount - absent);
                    totalMalePresent += present;
                    totalMaleAbsent += absent;
                    totalMaleTardy += tardy;
                    if (had5Consecutive) maleConsecutive++;
                }

                let totalFemalePresent = 0;
                let totalFemaleAbsent = 0;
                let totalFemaleTardy = 0;
                let femaleConsecutive = 0;

                for (const s of females) {
                    const record = attData[s.lrn] || {};
                    let absent = 0;
                    let tardy = 0;
                    let consecutive = 0;
                    let had5Consecutive = false;

                    for (let d = 1; d <= 30; d++) {
                        const dateVal = dateLabels[d];
                        const key = dateVal && dateVal.trim() ? `date_${dateVal.trim()}` : d;
                        const status = String(record[key] !== undefined ? record[key] : (record[d] || '')).toLowerCase();

                        if (status === 'absent' || status === 'x') {
                            absent++;
                            consecutive++;
                            if (consecutive >= 5) had5Consecutive = true;
                        } else if (status.includes('tardy') || status.includes('late') || status === 'cutting') {
                            tardy++;
                            consecutive = 0;
                        } else {
                            consecutive = 0;
                        }
                    }
                    const present = Math.max(0, filledDaysCount - absent);
                    totalFemalePresent += present;
                    totalFemaleAbsent += absent;
                    totalFemaleTardy += tardy;
                    if (had5Consecutive) femaleConsecutive++;
                }

                const maleRegistered = males.length;
                const femaleRegistered = females.length;
                const totalRegistered = maleRegistered + femaleRegistered;

                const maleADA = filledDaysCount > 0 ? Math.round((totalMalePresent / filledDaysCount) * 100) / 100 : 0;
                const femaleADA = filledDaysCount > 0 ? Math.round((totalFemalePresent / filledDaysCount) * 100) / 100 : 0;
                const totalADA = Math.round((maleADA + femaleADA) * 100) / 100;

                const malePerc = maleRegistered > 0 ? Math.round((maleADA / maleRegistered) * 10000) / 100 : 0;
                const femalePerc = femaleRegistered > 0 ? Math.round((femaleADA / femaleRegistered) * 10000) / 100 : 0;
                const totalPerc = totalRegistered > 0 ? Math.round((totalADA / totalRegistered) * 10000) / 100 : 0;

                sf2SummaryRows.push({
                    'Section': secDisplayName,
                    'Grade Level': sec.section_grade_level || '',
                    'Month': month,
                    'School Year': sheet?.school_year || activeSchoolYear,
                    'Class Adviser': adviserName,
                    'Days of Classes': filledDaysCount,
                    // Enrolment Baseline
                    'Baseline Enrolment (Male)': maleRegistered,
                    'Baseline Enrolment (Female)': femaleRegistered,
                    'Baseline Enrolment (Total)': totalRegistered,
                    // Registered Learners
                    'Registered Learners (Male)': maleRegistered,
                    'Registered Learners (Female)': femaleRegistered,
                    'Registered Learners (Total)': totalRegistered,
                    'Enrolment Rate (%)': '100.00%',
                    // Total Days Present
                    'Total Days Present (Male)': totalMalePresent,
                    'Total Days Present (Female)': totalFemalePresent,
                    'Total Days Present (Combined)': totalMalePresent + totalFemalePresent,
                    // Total Days Absent & Tardy
                    'Total Days Absent (Male)': totalMaleAbsent,
                    'Total Days Absent (Female)': totalFemaleAbsent,
                    'Total Days Absent (Combined)': totalMaleAbsent + totalFemaleAbsent,
                    'Total Days Tardy (Male)': totalMaleTardy,
                    'Total Days Tardy (Female)': totalFemaleTardy,
                    'Total Days Tardy (Combined)': totalMaleTardy + totalFemaleTardy,
                    // Average Daily Attendance (ADA)
                    'Average Daily Attendance (Male)': maleADA,
                    'Average Daily Attendance (Female)': femaleADA,
                    'Average Daily Attendance (Combined)': totalADA,
                    // Monthly Attendance Rate (%)
                    'Attendance Rate (Male %)': `${malePerc}%`,
                    'Attendance Rate (Female %)': `${femalePerc}%`,
                    'Attendance Rate (Combined %)': `${totalPerc}%`,
                    // 5+ Consecutive Absences
                    '5+ Consecutive Absences (Male)': maleConsecutive,
                    '5+ Consecutive Absences (Female)': femaleConsecutive,
                    '5+ Consecutive Absences (Total)': maleConsecutive + femaleConsecutive,
                    // Dropouts & Transfers
                    'No Longer in School (NLS / Dropout)': 0,
                    'Transferred Out': 0,
                    'Transferred In': 0
                });
            }
        }

        if (sf2SummaryRows.length > 0) {
            const ws = XLSX.utils.json_to_sheet(sf2SummaryRows);
            ws['!cols'] = [
                { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
                { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
                { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
                { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
                { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
                { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
                { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 16 }
            ];
            XLSX.utils.book_append_sheet(workbook, ws, 'SF2_Monthly_Totals_Summary');
            breakdown['SF2_Monthly_Totals_Summary'] = sf2SummaryRows.length;
        }
    }

    // =========================================================================
    // SHEET 5: SF2 Monthly Attendance Register (School Form 2 Student Register)
    // =========================================================================
    if (sf2Sheets.length > 0 || sections.length > 0) {
        const sf2Rows: Array<Record<string, unknown>> = [];
        if (sf2Sheets.length > 0) {
            for (const sheet of sf2Sheets) {
                const secName = (sheet.section_id ? sectionMap.get(sheet.section_id) : '') || sheet.section_id;
                const attData = sheet.attendance || {};
                for (const [lrn, dayMap] of Object.entries(attData)) {
                    const student = studentMap.get(lrn);
                    const studentName = student
                        ? `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`
                        : '';

                    let presentCount = 0;
                    let absentCount = 0;
                    let tardyCount = 0;

                    if (dayMap && typeof dayMap === 'object') {
                        for (const val of Object.values(dayMap)) {
                            const s = String(val).toLowerCase();
                            if (s === 'absent') absentCount++;
                            else if (s === 'tardy' || s === 'late') tardyCount++;
                            else if (s === 'present') presentCount++;
                        }
                    }

                    const totalDays = presentCount + absentCount + tardyCount;
                    const rate = totalDays > 0 ? Math.round((presentCount / totalDays) * 10000) / 100 : '';

                    sf2Rows.push({
                        'Month': sheet.month || '',
                        'School Year': sheet.school_year || activeSchoolYear,
                        'Section': secName,
                        'Student LRN': lrn,
                        'Learner Name': studentName,
                        'Gender': student?.gender || '',
                        'Days Present': presentCount,
                        'Days Absent': absentCount,
                        'Days Tardy': tardyCount,
                        'Total Recorded Days': totalDays,
                        'Attendance Rate (%)': rate,
                        'Remarks / Status': sheet.remarks?.[lrn] || ''
                    });
                }
            }
        }

        // If no attendance records have been manually filled, populate roster with default attendance rows
        if (sf2Rows.length === 0 && students.length > 0) {
            for (const s of students) {
                const secName = (s.student_section ? sectionMap.get(s.student_section) : '') || s.student_section || 'General Section';
                const studentName = `${s.last_name}, ${s.first_name}${s.middle_name ? ' ' + s.middle_name : ''}`;
                sf2Rows.push({
                    'Month': 'JUNE',
                    'School Year': activeSchoolYear,
                    'Section': secName,
                    'Student LRN': s.lrn,
                    'Learner Name': studentName,
                    'Gender': s.gender || '',
                    'Days Present': 20,
                    'Days Absent': 0,
                    'Days Tardy': 0,
                    'Total Recorded Days': 20,
                    'Attendance Rate (%)': 100,
                    'Remarks / Status': s.remarks || ''
                });
            }
        }

        if (sf2Rows.length > 0) {
            const ws = XLSX.utils.json_to_sheet(sf2Rows);
            ws['!cols'] = [
                { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 26 },
                { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
                { wch: 18 }, { wch: 20 }
            ];
            XLSX.utils.book_append_sheet(workbook, ws, 'SF2_Monthly_Attendance');
            breakdown['SF2_Monthly_Attendance'] = sf2Rows.length;
        }
    }

    // =========================================================================
    // SHEET 6: Teacher Remarks Masterlist
    // Compiles SF2 attendance remarks, SF9 Grade 1 MATATAG Progress Observations,
    // permanent student advisory & guidance notes, and quarterly evaluations.
    // =========================================================================
    const teacherRemarkRows: Array<Record<string, unknown>> = [];

    // 1. SF2 Monthly Attendance Remarks
    for (const sheet of sf2Sheets) {
        const secName = (sheet.section_id ? sectionMap.get(sheet.section_id) : '') || sheet.section_id;
        for (const [lrn, rem] of Object.entries(sheet.remarks || {})) {
            if (rem && rem.trim()) {
                const student = studentMap.get(lrn);
                const studentName = student
                    ? `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`
                    : '';
                teacherRemarkRows.push({
                    'Student LRN': lrn,
                    'Learner Name': studentName,
                    'Gender': student?.gender || '',
                    'Section': secName,
                    'Grade Level': student?.grade_level || '',
                    'School Year': sheet.school_year || activeSchoolYear,
                    'Category / Source': 'SF2 Monthly Attendance Remark (Absence / NLS / Transfer)',
                    'Term / Month': sheet.month || '',
                    'Teacher Remark / Observation': rem.trim()
                });
            }
        }
    }

    // 2. Grade 1 MATATAG Progress Remarks from localStorage
    for (const s of students) {
        try {
            const key = `g1_remarks_${s.lrn}_${activeSchoolYear}`;
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                const secName = (s.student_section ? sectionMap.get(s.student_section) : '') || s.student_section || '';
                const studentName = `${s.last_name}, ${s.first_name}${s.middle_name ? ' ' + s.middle_name : ''}`;

                const checkAndPush = (term: string, type: string, text?: string) => {
                    if (text && text.trim()) {
                        teacherRemarkRows.push({
                            'Student LRN': s.lrn,
                            'Learner Name': studentName,
                            'Gender': s.gender || '',
                            'Section': secName,
                            'Grade Level': s.grade_level || 'Grade 1',
                            'School Year': activeSchoolYear,
                            'Category / Source': `Grade 1 MATATAG Progress Observation (${type})`,
                            'Term / Month': term,
                            'Teacher Remark / Observation': text.trim()
                        });
                    }
                };

                checkAndPush('Term 1', 'Can Do', parsed.term1CanDo);
                checkAndPush('Term 1', 'To Improve', parsed.term1ToImprove);
                checkAndPush('Term 2', 'Can Do', parsed.term2CanDo);
                checkAndPush('Term 2', 'To Improve', parsed.term2ToImprove);
                checkAndPush('Term 3', 'Can Do', parsed.term3CanDo);
                checkAndPush('Term 3', 'To Improve', parsed.term3ToImprove);
            }
        } catch {
            // ignore
        }
    }

    // 3. Permanent Student Advisory & Guidance Remarks
    for (const s of students) {
        if (s.remarks && s.remarks.trim()) {
            const secName = (s.student_section ? sectionMap.get(s.student_section) : '') || s.student_section || '';
            const studentName = `${s.last_name}, ${s.first_name}${s.middle_name ? ' ' + s.middle_name : ''}`;
            teacherRemarkRows.push({
                'Student LRN': s.lrn,
                'Learner Name': studentName,
                'Gender': s.gender || '',
                'Section': secName,
                'Grade Level': s.grade_level || '',
                'School Year': activeSchoolYear,
                'Category / Source': 'Permanent Advisory & Guidance Remark',
                'Term / Month': 'Annual Record',
                'Teacher Remark / Observation': s.remarks.trim()
            });
        }
    }

    if (teacherRemarkRows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(teacherRemarkRows);
        ws['!cols'] = [
            { wch: 16 }, { wch: 26 }, { wch: 8 }, { wch: 22 }, { wch: 12 },
            { wch: 14 }, { wch: 38 }, { wch: 16 }, { wch: 45 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'Teacher_Remarks_Masterlist');
        breakdown['Teacher_Remarks_Masterlist'] = teacherRemarkRows.length;
    }

    // =========================================================================
    // SHEET 7: DepEd Core Values (SF9 Character Building / Observed Values)
    // =========================================================================
    if (observedValues.length > 0) {
        const ovMap = new Map<string, {
            lrn: string;
            sy: string;
            ratings: Record<string, Record<number, string>>;
        }>();

        for (const ov of observedValues) {
            const key = `${ov.student_lrn}_${ov.school_year || ''}`;
            if (!ovMap.has(key)) {
                ovMap.set(key, { lrn: ov.student_lrn, sy: ov.school_year || '', ratings: {} });
            }
            const entry = ovMap.get(key)!;
            const q = Number(ov.quarter) || 1;
            const vals = ov.values || {};
            for (const [compId, rating] of Object.entries(vals)) {
                if (!entry.ratings[compId]) entry.ratings[compId] = {};
                entry.ratings[compId][q] = rating;
            }
        }

        const coreValueRows = Array.from(ovMap.values()).map((entry) => {
            const student = studentMap.get(entry.lrn);
            const studentName = student
                ? `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`
                : '';
            const secName = (student?.student_section ? sectionMap.get(student.student_section) : '') || student?.student_section || '';

            const getQ = (compId: string, q: number) => entry.ratings[compId]?.[q] || '';

            return {
                'Student LRN': entry.lrn,
                'Learner Name': studentName,
                'Gender': student?.gender || '',
                'Section': secName,
                'School Year': entry.sy,
                // Maka-Diyos
                'Maka-Diyos 1 (Spiritual Beliefs) - Q1': getQ('maka_diyos_1', 1),
                'Maka-Diyos 1 (Spiritual Beliefs) - Q2': getQ('maka_diyos_1', 2),
                'Maka-Diyos 1 (Spiritual Beliefs) - Q3': getQ('maka_diyos_1', 3),
                'Maka-Diyos 1 (Spiritual Beliefs) - Q4': getQ('maka_diyos_1', 4),
                'Maka-Diyos 2 (Respects Beliefs) - Q1': getQ('maka_diyos_2', 1),
                'Maka-Diyos 2 (Respects Beliefs) - Q2': getQ('maka_diyos_2', 2),
                'Maka-Diyos 2 (Respects Beliefs) - Q3': getQ('maka_diyos_2', 3),
                'Maka-Diyos 2 (Respects Beliefs) - Q4': getQ('maka_diyos_2', 4),
                // Makatao
                'Makatao 1 (Sensitive to Differences) - Q1': getQ('makatao_1', 1),
                'Makatao 1 (Sensitive to Differences) - Q2': getQ('makatao_1', 2),
                'Makatao 1 (Sensitive to Differences) - Q3': getQ('makatao_1', 3),
                'Makatao 1 (Sensitive to Differences) - Q4': getQ('makatao_1', 4),
                'Makatao 2 (Demonstrates Solidarity) - Q1': getQ('makatao_2', 1),
                'Makatao 2 (Demonstrates Solidarity) - Q2': getQ('makatao_2', 2),
                'Makatao 2 (Demonstrates Solidarity) - Q3': getQ('makatao_2', 3),
                'Makatao 2 (Demonstrates Solidarity) - Q4': getQ('makatao_2', 4),
                // Makakalikasan
                'Makakalikasan 1 (Cares for Environment) - Q1': getQ('makakalikasan_1', 1),
                'Makakalikasan 1 (Cares for Environment) - Q2': getQ('makakalikasan_1', 2),
                'Makakalikasan 1 (Cares for Environment) - Q3': getQ('makakalikasan_1', 3),
                'Makakalikasan 1 (Cares for Environment) - Q4': getQ('makakalikasan_1', 4),
                // Makabansa
                'Makabansa 1 (National Pride) - Q1': getQ('makabansa_1', 1),
                'Makabansa 1 (National Pride) - Q2': getQ('makabansa_1', 2),
                'Makabansa 1 (National Pride) - Q3': getQ('makabansa_1', 3),
                'Makabansa 1 (National Pride) - Q4': getQ('makabansa_1', 4),
                'Makabansa 2 (Rights & Responsibilities) - Q1': getQ('makabansa_2', 1),
                'Makabansa 2 (Rights & Responsibilities) - Q2': getQ('makabansa_2', 2),
                'Makabansa 2 (Rights & Responsibilities) - Q3': getQ('makabansa_2', 3),
                'Makabansa 2 (Rights & Responsibilities) - Q4': getQ('makabansa_2', 4),
                'Rating Legend': 'AO = Always Observed, SO = Sometimes Observed, RO = Rarely Observed, NO = Not Observed'
            };
        });

        const ws = XLSX.utils.json_to_sheet(coreValueRows);
        XLSX.utils.book_append_sheet(workbook, ws, 'DepEd_Core_Values');
        breakdown['DepEd_Core_Values'] = coreValueRows.length;
    }

    // =========================================================================
    // SHEET 8: Grade 1 MATATAG PACE Form Qualitative Evaluations
    // =========================================================================
    try {
        const paceLearningAreas: Array<{ label: string; keys: string[] }> = [
            { label: 'Reading & Literacy', keys: ['formease_pace_reading_ratings', 'formease_pace_ratings'] },
            { label: 'Language', keys: ['formease_pace_language_ratings'] },
            { label: 'Mathematics', keys: ['formease_pace_math_ratings'] },
            { label: 'GMRC & Makabansa', keys: ['formease_pace_gmrc_makabansa_ratings'] }
        ];

        const paceRows: Array<Record<string, unknown>> = [];

        const paceSubjectLabels: Record<string, string> = {
            reading: 'Reading & Literacy',
            language: 'Language',
            math: 'Mathematics',
            'gmrc-makabansa': 'GMRC & Makabansa'
        };

        for (const subj of PACE_SUBJECTS) {
            const env = loadPaceEnvelope(subj);
            const label = paceSubjectLabels[subj] || subj;
            for (const record of Object.values(env.records)) {
                const sLrn = record.lrn;
                const student = studentMap.get(sLrn);
                const studentName = student
                    ? `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`
                    : record.studentName || '';
                const secName = (student?.student_section ? sectionMap.get(student.student_section) : '') || student?.student_section || record.section || '';

                if (record.ratings && typeof record.ratings === 'object') {
                    for (const [compId, rating] of Object.entries(record.ratings)) {
                        if (rating && (rating.t1 || rating.t2 || rating.t3)) {
                            paceRows.push({
                                'School Year': record.schoolYear,
                                'Student LRN': sLrn,
                                'Learner Name': studentName,
                                'Gender': student?.gender || '',
                                'Section': secName,
                                'Learning Area': label,
                                'Competency Code / Key': compId,
                                'Term 1 Rating': rating.t1 || '',
                                'Term 2 Rating': rating.t2 || '',
                                'Term 3 Rating': rating.t3 || '',
                                'Rating Standard': 'A = Advanced, B = Proficient, C = Approaching, D = Developing, E = Beginning'
                            });
                        }
                    }
                }
            }
        }

        if (paceRows.length === 0) {
            for (const area of paceLearningAreas) {
                let parsedData: Record<string, { ratings?: Record<string, { t1?: string; t2?: string; t3?: string }> }> = {};
                for (const key of area.keys) {
                    const item = localStorage.getItem(key);
                    if (item) {
                        try {
                            parsedData = { ...parsedData, ...JSON.parse(item) };
                        } catch {
                            // ignore
                        }
                    }
                }

                for (const [sLrn, entry] of Object.entries(parsedData)) {
                    const student = studentMap.get(sLrn);
                    const studentName = student
                        ? `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`
                        : '';
                    const secName = (student?.student_section ? sectionMap.get(student.student_section) : '') || student?.student_section || '';

                    if (entry && entry.ratings && typeof entry.ratings === 'object') {
                        for (const [compId, rating] of Object.entries(entry.ratings)) {
                            if (rating && (rating.t1 || rating.t2 || rating.t3)) {
                                paceRows.push({
                                    'School Year': '',
                                    'Student LRN': sLrn,
                                    'Learner Name': studentName,
                                    'Gender': student?.gender || '',
                                    'Section': secName,
                                    'Learning Area': area.label,
                                    'Competency Code / Key': compId,
                                    'Term 1 Rating': rating.t1 || '',
                                    'Term 2 Rating': rating.t2 || '',
                                    'Term 3 Rating': rating.t3 || '',
                                    'Rating Standard': 'A = Advanced, B = Proficient, C = Approaching, D = Developing, E = Beginning'
                                });
                            }
                        }
                    }
                }
            }
        }

        if (paceRows.length > 0) {
            const ws = XLSX.utils.json_to_sheet(paceRows);
            ws['!cols'] = [
                { wch: 16 }, { wch: 26 }, { wch: 8 }, { wch: 22 }, { wch: 22 },
                { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 35 }
            ];
            XLSX.utils.book_append_sheet(workbook, ws, 'Grade1_MATATAG_PACE_Form');
            breakdown['Grade1_MATATAG_PACE_Form'] = paceRows.length;
        }
    } catch (e) {
        console.warn('Could not extract Grade 1 PACE ratings:', e);
    }

    // =========================================================================
    // SHEET 9: Daily Attendance Logs
    // =========================================================================
    if (attendanceRecords.length > 0) {
        const attRows = attendanceRecords.map((a) => {
            const student = studentMap.get(a.student_lrn);
            const studentName = student
                ? `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`
                : '';
            const secName = (a.section_id ? sectionMap.get(a.section_id) : '') || a.section_id || student?.student_section || '';

            return {
                'Date': a.date || '',
                'Student LRN': a.student_lrn || '',
                'Learner Name': studentName,
                'Gender': student?.gender || '',
                'Section': secName,
                'Status': a.status || 'present',
                'Time In': a.time_in || '',
                'Time Out': a.time_out || ''
            };
        });

        const ws = XLSX.utils.json_to_sheet(attRows);
        ws['!cols'] = [
            { wch: 12 }, { wch: 16 }, { wch: 26 }, { wch: 8 },
            { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 14 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'Daily_Attendance');
        breakdown['Daily_Attendance'] = attendanceRecords.length;
    }

    // =========================================================================
    // SHEET 10: Teacher & Class Adviser Assignments
    // =========================================================================
    if (sections.length > 0 || users.length > 0) {
        const teacherRows: Array<Record<string, unknown>> = [];
        for (const sec of sections) {
            const matchedUser = users.find((u) => u.uid === sec.adviser_id || u.displayName === sec.adviser_name);
            teacherRows.push({
                'Section Name': sec.section_name || '',
                'Grade Level': sec.section_grade_level || '',
                'Track / Strand': `${sec.track || 'N/A'} / ${sec.strand || 'N/A'}`,
                'Class Adviser': sec.adviser_name || matchedUser?.displayName || 'Unassigned',
                'Username': matchedUser?.username || '',
                'Email / Contact': matchedUser?.email || '',
                'Primary Role': matchedUser?.primaryRole || 'Class Adviser'
            });
        }
        for (const u of users) {
            if (!sections.some((s) => s.adviser_id === u.uid || s.adviser_name === u.displayName)) {
                teacherRows.push({
                    'Section Name': u.adviserSectionName || 'N/A',
                    'Grade Level': 'N/A',
                    'Track / Strand': 'N/A',
                    'Class Adviser': u.displayName || u.username,
                    'Username': u.username || '',
                    'Email / Contact': u.email || '',
                    'Role': u.primaryRole || (Array.isArray(u.roles) ? u.roles.join(', ') : 'Faculty')
                });
            }
        }
        if (teacherRows.length > 0) {
            const ws = XLSX.utils.json_to_sheet(teacherRows);
            ws['!cols'] = [
                { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 24 },
                { wch: 18 }, { wch: 26 }, { wch: 18 }
            ];
            XLSX.utils.book_append_sheet(workbook, ws, 'Teacher_Adviser_Assignments');
            breakdown['Teacher_Adviser_Assignments'] = teacherRows.length;
        }
    }

    // =========================================================================
    // SHEET 11: School Announcements & Broadcasts
    // =========================================================================
    if (announcements.length > 0) {
        const annRows = announcements.map((a) => ({
            'Announcement Title': a.announcement_title || '',
            'Message Content': a.announcement_content || '',
            'Date Published': a.announcement_date || '',
            'Announcement Type': a.announcement_type || 'general',
            'Category': a.category || 'School',
            'Is Pinned': a.is_pinned ? 'Yes' : 'No',
            'Author': a.created_by || ''
        }));
        const ws = XLSX.utils.json_to_sheet(annRows);
        ws['!cols'] = [
            { wch: 26 }, { wch: 45 }, { wch: 16 }, { wch: 18 },
            { wch: 16 }, { wch: 12 }, { wch: 18 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'School_Announcements');
        breakdown['School_Announcements'] = announcements.length;
    }

    // =========================================================================
    // SHEET 12: School Calendar & Academic Cycles
    // =========================================================================
    const calendarRows: Array<Record<string, unknown>> = [];
    calendarRows.push({
        'School Year': activeSchoolYear,
        'Status': 'ACTIVE SCHOOL YEAR',
        'Event / Milestone Title': 'Official School Year Academic Cycle',
        'Date / Schedule': activeSchoolYear,
        'Category': 'Academic Year'
    });
    try {
        const rawEvents = localStorage.getItem('school_calendar_events');
        if (rawEvents) {
            const events = JSON.parse(rawEvents);
            if (Array.isArray(events)) {
                for (const ev of events) {
                    calendarRows.push({
                        'School Year': activeSchoolYear,
                        'Status': 'Scheduled Event',
                        'Event / Milestone Title': ev.title || 'School Event',
                        'Date / Schedule': ev.date || ev.start_date || '',
                        'Category': ev.type || ev.category || 'School Calendar'
                    });
                }
            }
        }
    } catch {
        // ignore
    }
    if (calendarRows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(calendarRows);
        ws['!cols'] = [
            { wch: 16 }, { wch: 22 }, { wch: 35 }, { wch: 18 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'School_Years_Calendar');
        breakdown['School_Years_Calendar'] = calendarRows.length;
    }

    // =========================================================================
    // SHEET 13: Students Masterlist / DepEd SF1 (Register of Learners)
    // =========================================================================
    if (students.length > 0) {
        const studentRows = students.map((s) => ({
            'LRN': s.lrn,
            'Last Name': s.last_name || '',
            'First Name': s.first_name || '',
            'Middle Name': s.middle_name || '',
            'Extension Name': s.name_extension || '',
            'Sex / Gender': s.gender || '',
            'Birthdate': s.birthday || '',
            'Age': s.age ?? '',
            'Mother Tongue': s.mother_tongue || '',
            'Ethnic Group': s.ethnic_group || '',
            'Religion': s.religion || '',
            'Address': s.address || '',
            'Contact Number': s.contact_number || '',
            'Father Full Name': s.father_name || '',
            'Mother Maiden Name': s.mother_name || '',
            'Guardian Full Name': s.guardian_name || '',
            'Guardian Relationship': s.guardian_relationship || '',
            'Grade Level': s.grade_level || '',
            'Section Assigned': (s.student_section ? sectionMap.get(s.student_section) : '') || s.student_section || '',
            'Enrollment Type': s.enrollment_type || 'Regular',
            'Enrollment Date': s.enrollment_date || ''
        }));

        const ws = XLSX.utils.json_to_sheet(studentRows);
        ws['!cols'] = [
            { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 8 },
            { wch: 8 }, { wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 14 },
            { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 22 },
            { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 16 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'Students_Masterlist');
        breakdown['Students_Masterlist'] = students.length;
    }

    // =========================================================================
    // SHEET 14: Sections Masterlist
    // =========================================================================
    if (sections.length > 0) {
        const sectionRows = sections.map((sec) => ({
            'Section Name': sec.section_name || '',
            'Grade Level': sec.section_grade_level || '',
            'Track (SHS)': sec.track || 'N/A',
            'Strand (SHS)': sec.strand || 'N/A',
            'Adviser Name': sec.adviser_name || '',
            'Total Enrolled Students': students.filter((s) => s.student_section === sec.section_name || s.student_section === sec.id).length
        }));
        const ws = XLSX.utils.json_to_sheet(sectionRows);
        ws['!cols'] = [
            { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
            { wch: 24 }, { wch: 24 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'Sections_Masterlist');
        breakdown['Sections_Masterlist'] = sections.length;
    }

    // =========================================================================
    // SHEET 15: Subjects Masterlist
    // =========================================================================
    if (subjects.length > 0) {
        const subjectRows = subjects.map((sub) => ({
            'Subject Name': sub.subject_name || '',
            'Subject Code': sub.subject_code || '',
            'Grade Level': sub.grade_level || '',
            'Section Assigned': sub.section_id ? (sectionMap.get(sub.section_id) || sub.section_id) : '',
            'Order': sub.order ?? '',
            'Is Component (e.g. MAPEH)': sub.is_component ? 'Yes' : 'No'
        }));
        const ws = XLSX.utils.json_to_sheet(subjectRows);
        ws['!cols'] = [
            { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
            { wch: 8 }, { wch: 22 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'Subjects_Masterlist');
        breakdown['Subjects_Masterlist'] = subjects.length;
    }

    // =========================================================================
    // SHEET 16: Enrollments History & Tracking
    // =========================================================================
    if (enrollments.length > 0) {
        const enrollRows = enrollments.map((enr) => {
            const student = studentMap.get(enr.student_lrn);
            const studentName = student
                ? `${student.last_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`
                : '';
            const secName = (enr.student_section ? sectionMap.get(enr.student_section) : '') || enr.student_section || '';

            return {
                'Enrollment ID': enr.id,
                'Student LRN': enr.student_lrn,
                'Learner Name': studentName,
                'Section': secName,
                'Grade Level': enr.grade_level || '',
                'School Year': enr.school_year || '',
                'Enrolled At': enr.enrolled_at || ''
            };
        });
        const ws = XLSX.utils.json_to_sheet(enrollRows);
        ws['!cols'] = [
            { wch: 22 }, { wch: 16 }, { wch: 26 }, { wch: 22 },
            { wch: 12 }, { wch: 14 }, { wch: 18 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'Enrollments_History');
        breakdown['Enrollments_History'] = enrollments.length;
    }

    // =========================================================================
    // SHEET 17: School Profile (DepEd Institutional Metadata)
    // Strictly sanitizes out activation_key, is_activated, or licensing flags.
    // =========================================================================
    if (schoolProfile.length > 0) {
        const prof = schoolProfile[0];
        const profRows = [{
            'School ID': prof.school_id || '',
            'School Name': prof.name || '',
            'Region': prof.region || '',
            'Division': prof.division || '',
            'District': prof.district || '',
            'School Head / Principal': prof.head_name || '',
            'Head Position': prof.head_position || '',
            'Grade Levels Offered': prof.grade_levels_offered || '',
            'Adviser Name': prof.adviser_name || '',
            'Section': prof.section || ''
        }];
        const ws = XLSX.utils.json_to_sheet(profRows);
        ws['!cols'] = [
            { wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 22 }, { wch: 20 },
            { wch: 26 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 18 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws, 'School_Profile');
        breakdown['School_Profile'] = schoolProfile.length;
    }

    const totalRecords = Object.values(breakdown).reduce((sum, c) => sum + c, 0);

    // Provide friendly aliases for UI consumers without inflating totalRecords
    breakdown['Students'] = breakdown['Students_Masterlist'] || students.length;
    breakdown['Sections'] = breakdown['Sections_Masterlist'] || sections.length;
    breakdown['Subjects'] = breakdown['Subjects_Masterlist'] || subjects.length;
    breakdown['ClassRecords'] = breakdown['DepEd_EClass_Records'] || (classRecords.length + gradingSheetRecords.length);
    breakdown['Attendance'] = (breakdown['Daily_Attendance'] || 0) + (breakdown['SF2_Monthly_Attendance'] || 0) || attendanceRecords.length;
    breakdown['Enrollments'] = breakdown['Enrollments_History'] || enrollments.length;

    // If database is completely empty
    if (totalRecords === 0) {
        const emptyWs = XLSX.utils.aoa_to_sheet([
            ['DepEd FormEase Pro — Database Rescue Report'],
            ['No physical records detected in local browser storage (FormEaseDB / localStorage).'],
            ['Please verify if data was entered in another browser (e.g. Chrome vs Edge) or in Incognito mode.']
        ]);
        XLSX.utils.book_append_sheet(workbook, emptyWs, 'Empty_Database');
    }

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `FormEase_Complete_DepEd_Database_Rescue_${dateStr}.xlsx`);

    return {
        success: true,
        totalRecords,
        breakdown
    };
}

/**
 * Direct Extraction & CSV Download of a specific IndexedDB table
 */
export async function exportDirectDatabaseStoreToCSV(storeName: string): Promise<number> {
    const rawRecords = await db.getAllRecords<Record<string, unknown>>(storeName, { strict: true });
    if (rawRecords.length === 0) {
        return 0;
    }

    const SENSITIVE_KEYS = new Set([
        'activation_key',
        'is_activated',
        'activated_at',
        'subscription_end_date',
        'is_trial',
        'trial_started_at',
        'license_key',
        'ciphertext',
        'iv',
        'logo_url',
        'head_signature_url',
        'adviser_signature_url',
        'password',
        'password_hash',
        'salt',
        'id_card_config',
        'receipt_counter',
        'last_sync_timestamp'
    ]);

    // Handle School Profile specially: NEVER expose activation_key or internal licensing flags
    if (storeName === 'schoolProfile') {
        const rows = rawRecords.map((r) => ({
            'School ID': r.school_id || '',
            'School Name': r.name || '',
            'Region': r.region || '',
            'Division': r.division || '',
            'District': r.district || '',
            'School Head / Principal': r.head_name || '',
            'Head Position': r.head_position || '',
            'Grade Levels Offered': r.grade_levels_offered || '',
            'Adviser Name': r.adviser_name || '',
            'Section': r.section || ''
        }));
        return downloadArrayOfObjectsAsCSV(rows, `FormEase_${storeName}_DirectDB`);
    }

    // Handle Announcements specially
    if (storeName === 'announcements') {
        const rows = rawRecords.map((r) => {
            const a = r as unknown as Announcement;
            return {
                'Announcement Title': a.announcement_title || '',
                'Message Content': a.announcement_content || '',
                'Date Published': a.announcement_date || '',
                'Announcement Type': a.announcement_type || 'general',
                'Category': a.category || 'School',
                'Is Pinned': a.is_pinned ? 'Yes' : 'No',
                'Author': a.created_by || ''
            };
        });
        return downloadArrayOfObjectsAsCSV(rows, `FormEase_${storeName}_DirectDB`);
    }

    // Handle Users specially
    if (storeName === 'users') {
        const rows = rawRecords.map((r) => {
            const u = r as unknown as BackupUser;
            return {
                'User ID': u.uid || '',
                'Username': u.username || '',
                'Display Name': u.displayName || '',
                'Email': u.email || '',
                'Primary Role': u.primaryRole || 'Faculty',
                'Roles': Array.isArray(u.roles) ? u.roles.join(', ') : '',
                'Adviser Section ID': u.adviserSectionId || '',
                'Adviser Section Name': u.adviserSectionName || '',
                'Created At': u.createdAt || ''
            };
        });
        return downloadArrayOfObjectsAsCSV(rows, `FormEase_${storeName}_DirectDB`);
    }

    // Handle HPS Records specially: unpack arrays into clean columns and resolve names
    if (storeName === 'hpsRecords') {
        const [sections, subjects] = await Promise.all([
            db.getAllRecords<Section>('sections', { strict: true }),
            db.getAllRecords<Subject>('subjects', { strict: true })
        ]);
        const secMap = new Map(sections.map((s) => [s.id, s.section_grade_level ? `${s.section_grade_level} - ${s.section_name}` : s.section_name]));
        const subMap = new Map(subjects.map((s) => [s.id, s.subject_name]));

        const rows = rawRecords.map((r) => {
            const h = r as unknown as HPSRecord;
            const secName = (h.section_id ? secMap.get(h.section_id) : '') || h.section_id || 'All Sections';
            const subjName = (h.subject_id ? subMap.get(h.subject_id) : '') || h.subject_id || 'All Subjects';
            const ww = Array.isArray(h.written_works) ? h.written_works : [];
            const pt = Array.isArray(h.performance_tasks) ? h.performance_tasks : [];
            const rawQa = (h as unknown as { summative_tests?: (number | string)[] })?.summative_tests;
            const qa = Array.isArray(rawQa) ? rawQa : [];

            const wwTotal = ww.map(Number).filter((v) => !isNaN(v) && v > 0).reduce((a, b) => a + b, 0);
            const ptTotal = pt.map(Number).filter((v) => !isNaN(v) && v > 0).reduce((a, b) => a + b, 0);

            return {
                'Section': secName,
                'Subject': subjName,
                'Quarter / Term': h.quarter ? `Quarter ${h.quarter}` : '',
                'School Year': h.school_year || '',
                'HPS WW 1': ww[0] ?? '',
                'HPS WW 2': ww[1] ?? '',
                'HPS WW 3': ww[2] ?? '',
                'HPS WW 4': ww[3] ?? '',
                'HPS WW 5': ww[4] ?? '',
                'Total HPS WW': wwTotal > 0 ? wwTotal : '',
                'HPS PT 1': pt[0] ?? '',
                'HPS PT 2': pt[1] ?? '',
                'HPS PT 3': pt[2] ?? '',
                'Total HPS PT': ptTotal > 0 ? ptTotal : '',
                'HPS ST 1': qa[0] ?? '',
                'HPS ST 2': qa[1] ?? '',
                'HPS Periodic Exam': qa[2] || h.quarterly_exam || ''
            };
        });
        return downloadArrayOfObjectsAsCSV(rows, `FormEase_${storeName}_DirectDB`);
    }

    // Handle Class Records and Published Grading Sheets: unpack arrays into clean columns
    if (storeName === 'classRecords' || storeName === 'gradingSheetRecords') {
        const [students, sections, subjects] = await Promise.all([
            db.getAllRecords<Student>('students', { strict: true }),
            db.getAllRecords<Section>('sections', { strict: true }),
            db.getAllRecords<Subject>('subjects', { strict: true })
        ]);
        const stuMap = new Map(students.map((s) => [s.lrn, `${s.last_name}, ${s.first_name}${s.middle_name ? ' ' + s.middle_name : ''}`.toUpperCase()]));
        const genderMap = new Map(students.map((s) => [s.lrn, s.gender || '']));
        const secMap = new Map(sections.map((s) => [s.id, s.section_grade_level ? `${s.section_grade_level} - ${s.section_name}` : s.section_name]));
        const subMap = new Map(subjects.map((s) => [s.id, s.subject_name]));

        const rows = rawRecords.map((r) => {
            const g = r as unknown as ClassRecord;
            const studentName = stuMap.get(g.student_lrn) || g.student_lrn;
            const gender = genderMap.get(g.student_lrn) || '';
            const secName = (g.section_id ? secMap.get(g.section_id) : '') || g.section_id || '';
            const subjName = (g.subject_id ? subMap.get(g.subject_id) : '') || g.subject_name || g.subject_id || '';
            const ww = Array.isArray(g.written_works) ? g.written_works : [];
            const pt = Array.isArray(g.performance_tasks) ? g.performance_tasks : [];
            const rawRec = g as ClassRecord & { summative_tests?: (number | string)[]; initial_grade?: number | string };
            const st = Array.isArray(rawRec.summative_tests) ? rawRec.summative_tests : [];

            const wwScores = ww.map((v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) ? Number(v) : null));
            const ptScores = pt.map((v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) ? Number(v) : null));
            const wwTotal = wwScores.filter((v): v is number => v !== null).reduce((a, b) => a + b, 0);
            const ptTotal = ptScores.filter((v): v is number => v !== null).reduce((a, b) => a + b, 0);

            const finalGradeNum = Number(g.final_grade);
            const remarks = !isNaN(finalGradeNum) && finalGradeNum > 0 ? (finalGradeNum >= 75 ? 'PASSED' : 'FAILED') : '';

            const rawInitNum = Number(rawRec.initial_grade);
            const healedInit = !isNaN(rawInitNum) && rawInitNum > 100 && rawInitNum <= 10000 ? Math.round((rawInitNum / 100) * 100) / 100 : (rawRec.initial_grade ?? '');
            const healedFinal = !isNaN(rawInitNum) && rawInitNum > 100 && rawInitNum <= 10000 && Number(g.final_grade) === 100 ? transmuteGrade(rawInitNum / 100, g.school_year || undefined) : (g.final_grade ?? '');

            return {
                'Student LRN': g.student_lrn,
                'Learner Name': studentName,
                'Gender': gender,
                'Section': secName,
                'Subject': subjName,
                'Quarter / Term': g.quarter ? `Quarter ${g.quarter}` : '',
                'School Year': g.school_year || '',
                'WW 1': ww[0] ?? '',
                'WW 2': ww[1] ?? '',
                'WW 3': ww[2] ?? '',
                'WW 4': ww[3] ?? '',
                'WW 5': ww[4] ?? '',
                'Total WW': wwScores.some((v) => v !== null) ? wwTotal : '',
                'PT 1': pt[0] ?? '',
                'PT 2': pt[1] ?? '',
                'PT 3': pt[2] ?? '',
                'Total PT': ptScores.some((v) => v !== null) ? ptTotal : '',
                'ST 1': st[0] ?? '',
                'ST 2': st[1] ?? '',
                'Periodic Exam': st[2] || g.quarterly_exam || '',
                'Initial Grade': healedInit,
                'Quarterly Final Grade': healedFinal,
                'Remarks': remarks
            };
        });
        return downloadArrayOfObjectsAsCSV(rows, `FormEase_${storeName}_DirectDB`);
    }

    // Generic fallback for other stores: filter out sensitive/licensing/crypto keys
    const keySet = new Set<string>();
    for (const rec of rawRecords) {
        if (rec && typeof rec === 'object') {
            for (const key of Object.keys(rec)) {
                if (!SENSITIVE_KEYS.has(key)) {
                    keySet.add(key);
                }
            }
        }
    }
    const headers = Array.from(keySet);

    const csvRows: string[] = [];
    csvRows.push(headers.map(csvCell).join(','));

    for (const row of rawRecords) {
        const values = headers.map((h) => {
            const val = row[h];
            if (val === undefined || val === null) return '""';
            if (Array.isArray(val)) {
                return csvCell(val.map(String).join(' | '));
            }
            if (typeof val === 'object') {
                return csvCell(JSON.stringify(val));
            }
            return csvCell(val);
        });
        csvRows.push(values.join(','));
    }

    return downloadCsvContent(csvRows.join('\n'), `FormEase_${storeName}_DirectDB`, rawRecords.length);
}

function downloadArrayOfObjectsAsCSV(rows: Array<Record<string, unknown>>, filePrefix: string): number {
    if (rows.length === 0) return 0;
    const headers = Object.keys(rows[0]);
    const csvRows: string[] = [headers.map(csvCell).join(',')];

    for (const row of rows) {
        const values = headers.map((h) => {
            const val = row[h];
            if (val === undefined || val === null) return '""';
            return csvCell(val);
        });
        csvRows.push(values.join(','));
    }

    return downloadCsvContent(csvRows.join('\n'), filePrefix, rows.length);
}

function downloadCsvContent(csvContent: string, filePrefix: string, count: number): number {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    return count;
}

/**
 * Direct Extraction & CSV Download of All IndexedDB tables sequentially
 */
export async function exportAllDirectDatabaseStoresToCSV(): Promise<Record<string, number>> {
    const stores = [
        'students',
        'sections',
        'subjects',
        'classRecords',
        'hpsRecords',
        'gradingSheetRecords',
        'attendanceRecords',
        'sf2Sheets',
        'observedValues',
        'enrollments',
        'announcements',
        'users',
        'schoolProfile'
    ];

    const results: Record<string, number> = {};
    for (let i = 0; i < stores.length; i++) {
        const store = stores[i];
        try {
            const count = await exportDirectDatabaseStoreToCSV(store);
            results[store] = count;
            if (i < stores.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 300));
            }
        } catch (err) {
            console.error(`Error exporting ${store} to CSV:`, err);
            results[store] = 0;
        }
    }
    return results;
}
