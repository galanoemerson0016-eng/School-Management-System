import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { useAppStore } from '../stores/app-store';
import { useAuthStore } from '../stores/auth-store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Printer, CloudUpload, Plus, Minus, Download, FileText, Users, ArrowRight, FileSpreadsheet, ChevronDown, Bug, Shield, SlidersHorizontal, Crosshair } from 'lucide-react';
import { useTableCrosshair } from '../hooks/useTableCrosshair';
import type { ClassRecord, HPSRecord, Subject, Student } from '../types';
import { getTermUpperLabel } from '../lib/terms';
import { SubjectEnrollmentModal } from '../components/sections/SubjectEnrollmentModal';
import { isGrade1 } from '../services/sf9-g1-excel-export';
import { exportECRToExcel, exportECRBatchToZip, isGrade2To10, isGmrcVeSubject, normalizeSubjectForECR, isMapehSubject, isEppTleSubject, isEppTleComponent, isMusicArtsSubject, isPeHealthSubject } from '../services/ecr-excel-export';
import { exportDirectDatabaseToExcel } from '../services/database-rescue-export';
import { isMatchingSubject, isSameSubject, findHpsRecord, resolveStudentQuarterGrade, computeLiveTransmutedGradeFromRecord, isStudentInSection, isMaleStudent, isFemaleStudent } from '../utils/grading-helpers';
import { normalizeSubjectName } from '../lib/subjectConfig';

import { getSubjectCluster, getWeights, transmuteGrade, getGradeDescriptorWithFilipino, formatGradeForDisplay, computeExamsWeightedScore, normalizeWeightPercent, normalizeWeightFraction, type SubjectCluster } from '../lib/grading';
import { filterSectionsForUser, filterSubjectsForSection } from '../lib/rbac';

const WW_COUNT = 5;
const PT_COUNT = 3;
const ST_COUNT = 3;

const GMRC_WW_COUNT = 10;
const GMRC_PT_COUNT = 9;

type QuarterValue = 1 | 2 | 3 | 'summary' | 'summary_t1' | 'summary_t2' | 'summary_t3' | 'summary_final';

interface SummaryGradeResult {
    t1?: number | '';
    t2?: number | '';
    t3?: number | '';
    ma?: number | '';
    pe?: number | '';
    final: number | '';
    descriptor: string;
    isMapeh: boolean;
    mapehMode?: 'component' | 'final';
}

type PaperSize = 'folio' | 'a4' | 'letter';

const PAPER_SIZES: Record<PaperSize, { label: string; landscape: string; portrait: string; margins: string; summaryMargins: string; jspdfFormat: string | [number, number]; previewWidthLandscape: string; previewWidthPortrait: string }> = {
    folio: {
        label: 'Folio',
        landscape: '13in 8.5in',
        portrait: '8.5in 13in',
        margins: '0.12in 0.18in',
        summaryMargins: '0.5in 0.25in',
        jspdfFormat: 'legal',
        previewWidthLandscape: '1248px',
        previewWidthPortrait: '816px',
    },
    a4: {
        label: 'A4',
        landscape: '297mm 210mm',
        portrait: '210mm 297mm',
        margins: '0.1in 0.15in',
        summaryMargins: '0.4in 0.2in',
        jspdfFormat: 'a4',
        previewWidthLandscape: '1122px',
        previewWidthPortrait: '794px',
    },
    letter: {
        label: 'Letter',
        landscape: '11in 8.5in',
        portrait: '8.5in 11in',
        margins: '0.1in 0.15in',
        summaryMargins: '0.4in 0.2in',
        jspdfFormat: 'letter',
        previewWidthLandscape: '1056px',
        previewWidthPortrait: '816px',
    },
};

const normalizeScores = (scores: (number | string)[] | undefined, count: number): (number | string)[] => {
    const src = Array.isArray(scores) ? scores : [];
    return Array.from({ length: count }, (_, i) => src[i] ?? '');
};

const getDynamicFontSizeClass = (text: string, baseClass: string = "text-[10px]") => {
    if (!text) return baseClass;
    if (text.length > 30) return "text-[8px] leading-none";
    if (text.length > 20) return "text-[9px] leading-tight";
    return baseClass;
};

const getSubjectCategory = (subjectName: string, gradeLevel: string): string => {
    const isSHS = gradeLevel.includes('11') || gradeLevel.includes('12');
    if (!isSHS) {
        return 'Core Subject (All Tracks)';
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
};

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string | number;
    onChange: (val: string) => void;
    debounceMs?: number;
}

function DebouncedInput({
    value: initialValue,
    onChange,
    debounceMs = 300,
    ...props
}: DebouncedInputProps) {
    const [value, setValue] = useState(initialValue);
    const valueRef = useRef(value);
    const initialValueRef = useRef(initialValue);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        valueRef.current = value;
        initialValueRef.current = initialValue;
        onChangeRef.current = onChange;
    });

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (value !== initialValue) {
                onChange(String(value));
            }
        }, debounceMs);

        return () => clearTimeout(timeout);
    }, [value, onChange, initialValue, debounceMs]);

    // Flush any pending unsaved edit immediately on unmount
    useEffect(() => {
        return () => {
            if (valueRef.current !== initialValueRef.current) {
                onChangeRef.current(String(valueRef.current));
            }
        };
    }, []);

    const handleBlur = () => {
        if (value !== initialValue) {
            onChange(String(value));
        }
    };

    return (
        <input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
        />
    );
}

interface StudentGradeRowProps {
    student: Student;
    idx: number;
    sectionIdx: number;
    maleStudentsCount: number;
    hps: { ww: (number | string)[]; pt: (number | string)[]; qa: (number | string)[] };
    currentWeights: { written_works: number; performance_tasks: number; quarterly_exam: number };
    currentCluster: SubjectCluster;
    activeSchoolYear: string;
    sectionGradeLevel: string;
    optimalNameColumnWidth: number;
    record: ClassRecord | undefined;
    updateGrade: (lrn: string, type: 'ww' | 'pt' | 'qa', index: number, value: string) => void;
    handleKeyDown: (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => void;
    formatStudentFullName: (student: Student) => string;
    isGMRCSubject?: boolean;
}

const StudentGradeRow = memo(({
    student,
    idx,
    sectionIdx,
    maleStudentsCount,
    hps,
    currentWeights,
    currentCluster,
    activeSchoolYear,
    sectionGradeLevel,
    optimalNameColumnWidth,
    record,
    updateGrade,
    handleKeyDown,
    formatStudentFullName,
    isGMRCSubject = false,
}: StudentGradeRowProps) => {
    const summary = useMemo(() => {
        const activeWwCount = isGMRCSubject ? GMRC_WW_COUNT : WW_COUNT;
        const activePtCount = isGMRCSubject ? GMRC_PT_COUNT : PT_COUNT;

        const sGrades: Pick<ClassRecord, 'written_works' | 'performance_tasks' | 'quarterly_exam'> = record || {
            written_works: Array(activeWwCount).fill(''),
            performance_tasks: Array(activePtCount).fill(''),
            quarterly_exam: ''
        };

        const wwScores = normalizeScores(sGrades.written_works, activeWwCount).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });
        const ptScores = normalizeScores(sGrades.performance_tasks, activePtCount).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });
        const rawQaRec = (record as (ClassRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;
        const qaScores = normalizeScores(rawQaRec, ST_COUNT).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });
        
        if (qaScores[2] === '' && sGrades.quarterly_exam !== '' && sGrades.quarterly_exam !== 0 && sGrades.quarterly_exam !== '0') {
            qaScores[2] = Number(sGrades.quarterly_exam);
        }

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            wwScores.some(isValidScore) ||
            ptScores.some(isValidScore) ||
            qaScores.some(isValidScore);

        if (isGMRCSubject) {
            const wwCogScores = wwScores.slice(0, 5);
            const wwAffScores = wwScores.slice(5, 10);
            const ptCogScores = ptScores.slice(0, 3);
            const ptAffScores = ptScores.slice(3, 6);
            const ptBehScores = ptScores.slice(6, 9);

            const wwCogTotalScore = wwCogScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const wwCogTotalHPS = hps.ww.slice(0, 5).reduce<number>((a, b) => a + Number(b), 0);
            const wwCogPS = wwCogTotalHPS === 0 ? 0 : (wwCogTotalScore / wwCogTotalHPS) * 100;
            const wwCogWS = wwCogPS * 0.10;

            const wwAffTotalScore = wwAffScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const wwAffTotalHPS = hps.ww.slice(5, 10).reduce<number>((a, b) => a + Number(b), 0);
            const wwAffPS = wwAffTotalHPS === 0 ? 0 : (wwAffTotalScore / wwAffTotalHPS) * 100;
            const wwAffWS = wwAffPS * 0.10;

            const ptCogTotalScore = ptCogScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const ptCogTotalHPS = hps.pt.slice(0, 3).reduce<number>((a, b) => a + Number(b), 0);
            const ptCogPS = ptCogTotalHPS === 0 ? 0 : (ptCogTotalScore / ptCogTotalHPS) * 100;
            const ptCogWS = ptCogPS * 0.10;

            const ptAffTotalScore = ptAffScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const ptAffTotalHPS = hps.pt.slice(3, 6).reduce<number>((a, b) => a + Number(b), 0);
            const ptAffPS = ptAffTotalHPS === 0 ? 0 : (ptAffTotalScore / ptAffTotalHPS) * 100;
            const ptAffWS = ptAffPS * 0.10;

            const ptBehTotalScore = ptBehScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const ptBehTotalHPS = hps.pt.slice(6, 9).reduce<number>((a, b) => a + Number(b), 0);
            const ptBehPS = ptBehTotalHPS === 0 ? 0 : (ptBehTotalScore / ptBehTotalHPS) * 100;
            const ptBehWS = ptBehPS * 0.30;

            const st1Score = typeof qaScores[0] === 'number' ? qaScores[0] : (qaScores[0] === '' || qaScores[0] === null || qaScores[0] === undefined ? null : Number(qaScores[0]));
            const st1HPS = Number(hps.qa[0]) || 0;
            const st2Score = typeof qaScores[1] === 'number' ? qaScores[1] : (qaScores[1] === '' || qaScores[1] === null || qaScores[1] === undefined ? null : Number(qaScores[1]));
            const st2HPS = Number(hps.qa[1]) || 0;
            const teScore = typeof qaScores[2] === 'number' ? qaScores[2] : (qaScores[2] === '' || qaScores[2] === null || qaScores[2] === undefined ? null : Number(qaScores[2]));
            const teHPS = Number(hps.qa[2]) || 0;

            const st1WS = (st1HPS > 0 && st1Score !== null && !isNaN(st1Score as number)) ? ((st1Score as number) / st1HPS) * 30 : null;
            const st2WS = (st2HPS > 0 && st2Score !== null && !isNaN(st2Score as number)) ? ((st2Score as number) / st2HPS) * 30 : null;
            const teWS = (teHPS > 0 && teScore !== null && !isNaN(teScore as number)) ? ((teScore as number) / teHPS) * 40 : null;

            let qaScore = 0;
            let qaHPS = 0;
            if (st1HPS > 0 && st1Score !== null && !isNaN(st1Score as number)) {
                qaHPS += st1HPS;
                qaScore += (st1Score as number);
            }
            if (st2HPS > 0 && st2Score !== null && !isNaN(st2Score as number)) {
                qaHPS += st2HPS;
                qaScore += (st2Score as number);
            }
            if (teHPS > 0 && teScore !== null && !isNaN(teScore as number)) {
                qaHPS += teHPS;
                qaScore += (teScore as number);
            }

            const qaPS = (st1WS !== null || st2WS !== null || teWS !== null) ? ((st1WS || 0) + (st2WS || 0) + (teWS || 0)) : 0;
            const qaWS = qaPS * 0.30;

            const initialGrade = (wwCogWS || 0) + (wwAffWS || 0) + (ptCogWS || 0) + (ptAffWS || 0) + (ptBehWS || 0) + (qaWS || 0);
            const quarterlyGrade = hasScores ? transmuteGrade(initialGrade, activeSchoolYear) : 0;

            return {
                ww: wwScores,
                pt: ptScores,
                qa: qaScores,
                hasScores,
                wwTotalScore: 0,
                wwTotalHPS: 0,
                wwPS: 0,
                wwWS: 0,
                ptTotalScore: 0,
                ptTotalHPS: 0,
                ptPS: 0,
                ptWS: 0,
                wwCog: wwCogScores, wwCogTotalScore, wwCogTotalHPS, wwCogPS, wwCogWS,
                wwAff: wwAffScores, wwAffTotalScore, wwAffTotalHPS, wwAffPS, wwAffWS,
                ptCog: ptCogScores, ptCogTotalScore, ptCogTotalHPS, ptCogPS, ptCogWS,
                ptAff: ptAffScores, ptAffTotalScore, ptAffTotalHPS, ptAffPS, ptAffWS,
                ptBeh: ptBehScores, ptBehTotalScore, ptBehTotalHPS, ptBehPS, ptBehWS,
                st1WS, st2WS, teWS,
                qaScore, qaHPS, qaPS, qaWS,
                initialGrade: isNaN(initialGrade) ? 0 : initialGrade,
                quarterlyGrade: isNaN(quarterlyGrade) ? 0 : quarterlyGrade
            };
        }

        // Standard Academic / EPP / MAPEH
        const wwTotalScore = wwScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const wwTotalHPS = hps.ww.reduce<number>((a, b) => a + Number(b), 0);
        const wwPS = wwTotalHPS === 0 ? 0 : (wwTotalScore / wwTotalHPS) * 100;
        const wwWS = wwPS * (normalizeWeightFraction(currentWeights.written_works) || 0);

        const ptTotalScore = ptScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const ptTotalHPS = hps.pt.reduce<number>((a, b) => a + Number(b), 0);
        const ptPS = ptTotalHPS === 0 ? 0 : (ptTotalScore / ptTotalHPS) * 100;
        const ptWS = ptPS * (normalizeWeightFraction(currentWeights.performance_tasks) || 0);

        const st1Score = typeof qaScores[0] === 'number' ? qaScores[0] : (qaScores[0] === '' || qaScores[0] === null || qaScores[0] === undefined ? null : Number(qaScores[0]));
        const st1HPS = Number(hps.qa[0]) || 0;
        const st2Score = typeof qaScores[1] === 'number' ? qaScores[1] : (qaScores[1] === '' || qaScores[1] === null || qaScores[1] === undefined ? null : Number(qaScores[1]));
        const st2HPS = Number(hps.qa[1]) || 0;
        const teScore = typeof qaScores[2] === 'number' ? qaScores[2] : (qaScores[2] === '' || qaScores[2] === null || qaScores[2] === undefined ? null : Number(qaScores[2]));
        const teHPS = Number(hps.qa[2]) || 0;

        const st1WS = (st1HPS > 0 && st1Score !== null && !isNaN(st1Score as number)) ? ((st1Score as number) / st1HPS) * 30 : null;
        const st2WS = (st2HPS > 0 && st2Score !== null && !isNaN(st2Score as number)) ? ((st2Score as number) / st2HPS) * 30 : null;
        const teWS = (teHPS > 0 && teScore !== null && !isNaN(teScore as number)) ? ((teScore as number) / teHPS) * 40 : null;

        let qaScore = 0;
        let qaHPS = 0;
        if (st1HPS > 0 && st1Score !== null && !isNaN(st1Score as number)) {
            qaHPS += st1HPS;
            qaScore += (st1Score as number);
        }
        if (st2HPS > 0 && st2Score !== null && !isNaN(st2Score as number)) {
            qaHPS += st2HPS;
            qaScore += (st2Score as number);
        }
        if (teHPS > 0 && teScore !== null && !isNaN(teScore as number)) {
            qaHPS += teHPS;
            qaScore += (teScore as number);
        }

        const qaPS = computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
        const qaWS = qaPS * (normalizeWeightFraction(currentWeights.quarterly_exam) || 0);

        const rawInitial = (wwWS || 0) + (ptWS || 0) + (qaWS || 0);
        const initialGrade = rawInitial > 100 && rawInitial <= 10000 ? Math.round((rawInitial / 100) * 100) / 100 : Math.round(rawInitial * 100) / 100;
        const quarterlyGrade = hasScores ? transmuteGrade(initialGrade, activeSchoolYear) : 0;

        return {
            ww: wwScores,
            pt: ptScores,
            qa: qaScores,
            hasScores,
            wwTotalScore, wwTotalHPS, wwPS, wwWS,
            ptTotalScore, ptTotalHPS, ptPS, ptWS,
            st1WS, st2WS, teWS,
            qaScore, qaHPS, qaPS, qaWS,
            initialGrade: isNaN(initialGrade) ? 0 : initialGrade,
            quarterlyGrade: isNaN(quarterlyGrade) ? 0 : quarterlyGrade
        };
    }, [record, hps, currentWeights, currentCluster, activeSchoolYear, isGMRCSubject]);

    const descriptor = useMemo(() => {
        if (!summary.hasScores || summary.quarterlyGrade <= 0) return '';
        return getGradeDescriptorWithFilipino(summary.quarterlyGrade, sectionGradeLevel, activeSchoolYear);
    }, [summary.quarterlyGrade, summary.hasScores, sectionGradeLevel, activeSchoolYear]);

    const rowNum = (sectionIdx === 0 ? 1 : maleStudentsCount + 1) + idx;

    if (isGMRCSubject) {
        return (
            <tr className="grade-row hover:bg-gray-50" data-row-key={student.lrn}>
                <td className="student-name-cell border border-black px-2 py-0.5 text-left text-[10px] leading-tight whitespace-nowrap font-bold uppercase truncate" data-col-key="learner-name" title={`${idx + 1}. ${formatStudentFullName(student)}`} style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>
                    {idx + 1}. {formatStudentFullName(student)}
                </td>
                {/* WW Cognitive 1..5 (cols 0..4) */}
                {(summary.wwCog || []).map((score, i) => (
                    <td key={`ww-cog-${i}`} className="border border-black p-0" data-col-key={`ww-cog-${i}`}>
                        <DebouncedInput
                            type="number"
                            value={score === '' ? '' : score}
                            onChange={(v) => updateGrade(student.lrn, 'ww', i, v)}
                            onKeyDown={(e) => handleKeyDown(e, rowNum, i)}
                            data-row={rowNum}
                            data-col={i}
                            className="w-full h-full text-center outline-none p-0 focus:bg-blue-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </td>
                ))}
                <td className="border border-black bg-blue-50 text-[8px]" data-col-key="ww-cog-total">{summary.wwCogTotalHPS && summary.wwCogTotalHPS > 0 && summary.wwCog?.some(s => s !== '') ? summary.wwCogTotalScore : ''}</td>
                <td className="border border-black bg-blue-50 text-[8px]" data-col-key="ww-cog-ps">{summary.wwCogTotalHPS && summary.wwCogTotalHPS > 0 && summary.wwCog?.some(s => s !== '') ? summary.wwCogPS?.toFixed(2) : ''}</td>
                <td className="border border-black bg-blue-100 font-semibold text-[8px]" data-col-key="ww-cog-ws">{summary.wwCogTotalHPS && summary.wwCogTotalHPS > 0 && summary.wwCog?.some(s => s !== '') ? summary.wwCogWS?.toFixed(2) : ''}</td>

                {/* WW Affective 1..5 (cols 5..9) */}
                {(summary.wwAff || []).map((score, i) => (
                    <td key={`ww-aff-${i}`} className="border border-black p-0" data-col-key={`ww-aff-${i}`}>
                        <DebouncedInput
                            type="number"
                            value={score === '' ? '' : score}
                            onChange={(v) => updateGrade(student.lrn, 'ww', 5 + i, v)}
                            onKeyDown={(e) => handleKeyDown(e, rowNum, 5 + i)}
                            data-row={rowNum}
                            data-col={5 + i}
                            className="w-full h-full text-center outline-none p-0 focus:bg-blue-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </td>
                ))}
                <td className="border border-black bg-blue-50 text-[8px]" data-col-key="ww-aff-total">{summary.wwAffTotalHPS && summary.wwAffTotalHPS > 0 && summary.wwAff?.some(s => s !== '') ? summary.wwAffTotalScore : ''}</td>
                <td className="border border-black bg-blue-50 text-[8px]" data-col-key="ww-aff-ps">{summary.wwAffTotalHPS && summary.wwAffTotalHPS > 0 && summary.wwAff?.some(s => s !== '') ? summary.wwAffPS?.toFixed(2) : ''}</td>
                <td className="border border-black bg-blue-100 font-semibold text-[8px]" data-col-key="ww-aff-ws">{summary.wwAffTotalHPS && summary.wwAffTotalHPS > 0 && summary.wwAff?.some(s => s !== '') ? summary.wwAffWS?.toFixed(2) : ''}</td>

                {/* PT Cognitive 1..3 (cols 10..12) */}
                {(summary.ptCog || []).map((score, i) => (
                    <td key={`pt-cog-${i}`} className="border border-black p-0" data-col-key={`pt-cog-${i}`}>
                        <DebouncedInput
                            type="number"
                            value={score === '' ? '' : score}
                            onChange={(v) => updateGrade(student.lrn, 'pt', i, v)}
                            onKeyDown={(e) => handleKeyDown(e, rowNum, 10 + i)}
                            data-row={rowNum}
                            data-col={10 + i}
                            className="w-full h-full text-center outline-none p-0 focus:bg-green-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </td>
                ))}
                <td className="border border-black bg-green-50 text-[8px]" data-col-key="pt-cog-total">{summary.ptCogTotalHPS && summary.ptCogTotalHPS > 0 && summary.ptCog?.some(s => s !== '') ? summary.ptCogTotalScore : ''}</td>
                <td className="border border-black bg-green-50 text-[8px]" data-col-key="pt-cog-ps">{summary.ptCogTotalHPS && summary.ptCogTotalHPS > 0 && summary.ptCog?.some(s => s !== '') ? summary.ptCogPS?.toFixed(2) : ''}</td>
                <td className="border border-black bg-green-100 font-semibold text-[8px]" data-col-key="pt-cog-ws">{summary.ptCogTotalHPS && summary.ptCogTotalHPS > 0 && summary.ptCog?.some(s => s !== '') ? summary.ptCogWS?.toFixed(2) : ''}</td>

                {/* PT Affective 1..3 (cols 13..15) */}
                {(summary.ptAff || []).map((score, i) => (
                    <td key={`pt-aff-${i}`} className="border border-black p-0" data-col-key={`pt-aff-${i}`}>
                        <DebouncedInput
                            type="number"
                            value={score === '' ? '' : score}
                            onChange={(v) => updateGrade(student.lrn, 'pt', 3 + i, v)}
                            onKeyDown={(e) => handleKeyDown(e, rowNum, 13 + i)}
                            data-row={rowNum}
                            data-col={13 + i}
                            className="w-full h-full text-center outline-none p-0 focus:bg-green-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </td>
                ))}
                <td className="border border-black bg-green-50 text-[8px]" data-col-key="pt-aff-total">{summary.ptAffTotalHPS && summary.ptAffTotalHPS > 0 && summary.ptAff?.some(s => s !== '') ? summary.ptAffTotalScore : ''}</td>
                <td className="border border-black bg-green-50 text-[8px]" data-col-key="pt-aff-ps">{summary.ptAffTotalHPS && summary.ptAffTotalHPS > 0 && summary.ptAff?.some(s => s !== '') ? summary.ptAffPS?.toFixed(2) : ''}</td>
                <td className="border border-black bg-green-100 font-semibold text-[8px]" data-col-key="pt-aff-ws">{summary.ptAffTotalHPS && summary.ptAffTotalHPS > 0 && summary.ptAff?.some(s => s !== '') ? summary.ptAffWS?.toFixed(2) : ''}</td>

                {/* PT Behavioral 1..3 (cols 16..18) */}
                {(summary.ptBeh || []).map((score, i) => (
                    <td key={`pt-beh-${i}`} className="border border-black p-0" data-col-key={`pt-beh-${i}`}>
                        <DebouncedInput
                            type="number"
                            value={score === '' ? '' : score}
                            onChange={(v) => updateGrade(student.lrn, 'pt', 6 + i, v)}
                            onKeyDown={(e) => handleKeyDown(e, rowNum, 16 + i)}
                            data-row={rowNum}
                            data-col={16 + i}
                            className="w-full h-full text-center outline-none p-0 focus:bg-green-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </td>
                ))}
                <td className="border border-black bg-green-50 text-[8px]" data-col-key="pt-beh-total">{summary.ptBehTotalHPS && summary.ptBehTotalHPS > 0 && summary.ptBeh?.some(s => s !== '') ? summary.ptBehTotalScore : ''}</td>
                <td className="border border-black bg-green-50 text-[8px]" data-col-key="pt-beh-ps">{summary.ptBehTotalHPS && summary.ptBehTotalHPS > 0 && summary.ptBeh?.some(s => s !== '') ? summary.ptBehPS?.toFixed(2) : ''}</td>
                <td className="border border-black bg-green-100 font-semibold text-[8px]" data-col-key="pt-beh-ws">{summary.ptBehTotalHPS && summary.ptBehTotalHPS > 0 && summary.ptBeh?.some(s => s !== '') ? summary.ptBehWS?.toFixed(2) : ''}</td>

                {/* QA ST1, ST2, TE (cols 19..21) */}
                {summary.qa.map((score, i) => (
                    <td key={`qa-${i}`} className="border border-black p-0" data-col-key={`qa-${i}`}>
                        <DebouncedInput
                            type="number"
                            value={score === '' ? '' : score}
                            onChange={(v) => updateGrade(student.lrn, 'qa', i, v)}
                            onKeyDown={(e) => handleKeyDown(e, rowNum, 19 + i)}
                            data-row={rowNum}
                            data-col={19 + i}
                            className="w-full h-full text-center outline-none p-0 focus:bg-yellow-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </td>
                ))}
                <td className="border border-black bg-yellow-50/70 text-[8.5px]" data-col-key="st1-ws">{summary.st1WS !== null ? summary.st1WS.toFixed(2) : ''}</td>
                <td className="border border-black bg-yellow-50/70 text-[8.5px]" data-col-key="st2-ws">{summary.st2WS !== null ? summary.st2WS.toFixed(2) : ''}</td>
                <td className="border border-black bg-yellow-50/70 text-[8.5px]" data-col-key="te-ws">{summary.teWS !== null ? summary.teWS.toFixed(2) : ''}</td>
                <td className="border border-black bg-yellow-50 font-medium text-[8.5px]" data-col-key="qa-ps">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaPS.toFixed(2) : ''}</td>
                <td className="border border-black bg-yellow-100 font-semibold text-[8.5px]" data-col-key="qa-ws">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaWS.toFixed(2) : ''}</td>
                <td className="border border-black bg-gray-100 font-bold text-[8.5px]" data-col-key="initial-grade">{summary.hasScores ? summary.initialGrade.toFixed(2) : ''}</td>
                <td className={`border border-black font-bold text-[10px] leading-tight whitespace-normal wrap-break-word ${summary.quarterlyGrade > 0 ? (summary.quarterlyGrade < 75 ? 'bg-red-500 text-white' : 'bg-deped-blue text-white') : 'bg-gray-50'}`} data-col-key="term-grade">
                    {summary.quarterlyGrade > 0 ? formatGradeForDisplay(summary.quarterlyGrade, sectionGradeLevel) : ''}
                </td>
                <td className="border border-black bg-blue-50 text-[10px] font-bold leading-tight whitespace-normal wrap-break-word px-1" data-col-key="descriptor">
                    {descriptor}
                </td>
            </tr>
        );
    }

    return (
        <tr className="grade-row hover:bg-gray-50" data-row-key={student.lrn}>
            <td className="student-name-cell border border-black px-2 py-0.5 text-left text-[10px] leading-tight whitespace-nowrap font-bold uppercase truncate" data-col-key="learner-name" title={`${idx + 1}. ${formatStudentFullName(student)}`} style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>
                {idx + 1}. {formatStudentFullName(student)}
            </td>
            {summary.ww.map((score, i) => (
                <td key={`ww-${i}`} className="border border-black p-0" data-col-key={`ww-${i}`}>
                    <DebouncedInput
                        type="number"
                        value={score === '' ? '' : score}
                        onChange={(v) => updateGrade(student.lrn, 'ww', i, v)}
                        onKeyDown={(e) => handleKeyDown(e, rowNum, i)}
                        data-row={rowNum}
                        data-col={i}
                        className="w-full h-full text-center outline-none p-0 focus:bg-blue-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </td>
            ))}
            <td className="border border-black bg-blue-50" data-col-key="ww-total">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwTotalScore : ''}</td>
            <td className="border border-black bg-blue-50" data-col-key="ww-ps">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwPS.toFixed(2) : ''}</td>
            <td className="border border-black bg-blue-100 font-semibold" data-col-key="ww-ws">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwWS.toFixed(2) : ''}</td>
            {summary.pt.map((score, i) => (
                <td key={`pt-${i}`} className="border border-black p-0" data-col-key={`pt-${i}`}>
                    <DebouncedInput
                        type="number"
                        value={score === '' ? '' : score}
                        onChange={(v) => updateGrade(student.lrn, 'pt', i, v)}
                        onKeyDown={(e) => handleKeyDown(e, rowNum, 5 + i)}
                        data-row={rowNum}
                        data-col={5 + i}
                        className="w-full h-full text-center outline-none p-0 focus:bg-green-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </td>
            ))}
            <td className="border border-black bg-green-50" data-col-key="pt-total">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptTotalScore : ''}</td>
            <td className="border border-black bg-green-50" data-col-key="pt-ps">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptPS.toFixed(2) : ''}</td>
            <td className="border border-black bg-green-100 font-semibold" data-col-key="pt-ws">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptWS.toFixed(2) : ''}</td>
            {summary.qa.map((score, i) => (
                <td key={`qa-${i}`} className="border border-black p-0" data-col-key={`qa-${i}`}>
                    <DebouncedInput
                        type="number"
                        value={score === '' ? '' : score}
                        onChange={(v) => updateGrade(student.lrn, 'qa', i, v)}
                        onKeyDown={(e) => handleKeyDown(e, rowNum, 8 + i)}
                        data-row={rowNum}
                        data-col={8 + i}
                        className="w-full h-full text-center outline-none p-0 focus:bg-yellow-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </td>
            ))}
            <td className="border border-black bg-yellow-50/70 text-[9px]" data-col-key="st1-ws">{summary.st1WS !== null ? summary.st1WS.toFixed(2) : ''}</td>
            <td className="border border-black bg-yellow-50/70 text-[9px]" data-col-key="st2-ws">{summary.st2WS !== null ? summary.st2WS.toFixed(2) : ''}</td>
            <td className="border border-black bg-yellow-50/70 text-[9px]" data-col-key="te-ws">{summary.teWS !== null ? summary.teWS.toFixed(2) : ''}</td>
            <td className="border border-black bg-yellow-50 font-medium" data-col-key="qa-ps">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaPS.toFixed(2) : ''}</td>
            <td className="border border-black bg-yellow-100 font-semibold" data-col-key="qa-ws">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaWS.toFixed(2) : ''}</td>
            <td className="border border-black bg-gray-100 font-bold" data-col-key="initial-grade">{summary.hasScores ? summary.initialGrade.toFixed(2) : ''}</td>
            <td className={`border border-black w-20 min-w-20 max-w-20 font-bold text-[10px] leading-tight whitespace-normal wrap-break-word ${summary.quarterlyGrade > 0 ? (summary.quarterlyGrade < 75 ? 'bg-red-500 text-white' : 'bg-deped-blue text-white') : 'bg-gray-50'}`} data-col-key="term-grade">
                {summary.quarterlyGrade > 0 ? formatGradeForDisplay(summary.quarterlyGrade, sectionGradeLevel) : ''}
            </td>
            <td className="border border-black bg-blue-50 text-[10px] font-bold leading-tight whitespace-normal wrap-break-word px-1" data-col-key="descriptor">
                {descriptor}
            </td>
        </tr>
    );
}, (prev, next) => {
    return (
        prev.student.lrn === next.student.lrn &&
        prev.student.first_name === next.student.first_name &&
        prev.student.last_name === next.student.last_name &&
        prev.idx === next.idx &&
        prev.sectionIdx === next.sectionIdx &&
        prev.maleStudentsCount === next.maleStudentsCount &&
        prev.activeSchoolYear === next.activeSchoolYear &&
        prev.sectionGradeLevel === next.sectionGradeLevel &&
        prev.record === next.record &&
        prev.hps === next.hps &&
        prev.currentWeights === next.currentWeights &&
        prev.currentCluster === next.currentCluster &&
        prev.isGMRCSubject === next.isGMRCSubject
    );
});

export function EClassRecord() {
    const { containerRef, isCrosshairEnabled, toggleCrosshair } = useTableCrosshair();

    const students = useAppStore(state => state.students);
    const sections = useAppStore(state => state.sections);
    const subjects = useAppStore(state => state.subjects);
    const globalSection = useAppStore(state => state.selectedSection);
    const globalSubject = useAppStore(state => state.selectedSubject);
    const schoolProfile = useAppStore(state => state.schoolProfile);
    const activeSchoolYear = useAppStore(state => state.activeSchoolYear);
    const classRecords = useAppStore(state => state.classRecords);
    const updateClassRecord = useAppStore(state => state.updateClassRecord);
    const deleteClassRecord = useAppStore(state => state.deleteClassRecord);
    const hpsRecords = useAppStore(state => state.hpsRecords);
    const updateHPSRecord = useAppStore(state => state.updateHPSRecord);
    const setGlobalSection = useAppStore(state => state.setSelectedSection);
    const setGlobalSubject = useAppStore(state => state.setSelectedSubject);
    const showNotification = useAppStore(state => state.showNotification);
    const teachers = useAppStore(state => state.teachers);
    const gradingSheetRecords = useAppStore(state => state.gradingSheetRecords);
    const { user } = useAuthStore();

    const [selectedSection, setSelectedSection] = useState(globalSection || '');
    const [selectedSubject, setSelectedSubject] = useState(globalSubject || '');
    const [selectedMapehComponentId, setSelectedMapehComponentId] = useState('');
    const [quarter, setQuarter] = useState<1 | 2 | 3 | 'summary' | 'summary_t1' | 'summary_t2' | 'summary_t3' | 'summary_final'>(1);
    const [zoom, setZoom] = useState(0.9);
    const [isDownloading, setIsDownloading] = useState(false);
    const [paperSize, setPaperSize] = useState<PaperSize>('folio');
    const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);


    const formatStudentFullName = useCallback((student: typeof students[number]) => {
        const middleName = student.middle_name?.trim();
        const ext = student.name_extension?.trim();
        return `${student.last_name}, ${student.first_name}${middleName ? ` ${middleName}` : ''}${ext ? ` ${ext}` : ''}`.toUpperCase();
    }, []);

    // Sync store with local state
    useEffect(() => {
        if (globalSection && globalSection !== selectedSection) {
            setSelectedSection(globalSection);
        }
    }, [globalSection, selectedSection]);

    useEffect(() => {
        if (globalSubject && globalSubject !== selectedSubject) {
            setSelectedSubject(globalSubject);
        }
    }, [globalSubject, selectedSubject]);

    // Get the selected section's grade level
    const selectedSectionObj = useMemo(() => {
        return sections.find(s => s.id === selectedSection || s.section_name === selectedSection);
    }, [sections, selectedSection]);

    const setCurrentView = useAppStore((s) => s.setCurrentView);
    const sectionGradeLevel = selectedSectionObj?.section_grade_level || '';
    const isGrade1Section = isGrade1(sectionGradeLevel);
    const isG2ToG10Section = useMemo(() => isGrade2To10(sectionGradeLevel), [sectionGradeLevel]);
    const selectedSubjectObj = useMemo(() => {
        if (selectedSubject === 'virtual_mapeh') {
            return {
                id: 'virtual_mapeh',
                subject_name: 'MAPEH',
                grade_level: selectedSectionObj?.section_grade_level || '',
                section_id: selectedSectionObj?.id || ''
            } as Subject;
        }
        return subjects.find(s => s.id === selectedSubject);
    }, [subjects, selectedSubject, selectedSectionObj]);
    // Sort Sections: Grade Level (Asc) -> Name (Asc)
    // Filter: If Teacher, only show sections where they are Adviser OR have a Subject assigned
    const sortedSections = useMemo(() => {
        return [...filterSectionsForUser(user, sections, subjects)].sort((a, b) => {
            const getGradeNum = (g: string) => {
                const match = g.match(/\d+/);
                return match ? parseInt(match[0], 10) : 999;
            };
            const gradeA = getGradeNum(a.section_grade_level);
            const gradeB = getGradeNum(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, subjects, user]);



    // Update global store when local selection changes
    const onSectionChange = (val: string) => {
        setSelectedSection(val);
        setGlobalSection(val);
        const targetSec = sections.find(s => s.id === val || s.section_name === val);
        if (targetSec) {
            const secSubjects = filterSubjectsForSection(user, targetSec, subjects);
            const valid = secSubjects.filter(s => {
                const n = s.subject_name.toLowerCase();
                return !((n.includes('music') && n.includes('arts')) || ((n.includes('pe') || n.includes('physical')) && n.includes('health')));
            });
            if (valid.length > 0) {
                setSelectedSubject(valid[0].id);
                setGlobalSubject(valid[0].id);
                return;
            }
        }
        setSelectedSubject('');
        setGlobalSubject('');
    };

    const onSubjectChange = (val: string) => {
        setSelectedSubject(val);
        setGlobalSubject(val);
    };

    // Find MAPEH components for the current section
    const mapehComponents = useMemo(() => {
        if (!selectedSectionObj) return [];
        
        // 1. Primary: Use RBAC-filtered section subjects
        const sectionSubjects = filterSubjectsForSection(user, selectedSectionObj, subjects);
        
        const isMapehComp = (s: Subject) => {
            const n = s.subject_name.toLowerCase().trim();
            return (n.includes('music') && n.includes('arts')) || 
                   ((n.includes('pe') || n.includes('physical')) && n.includes('health')) ||
                   n === 'music' || n === 'arts' || n === 'physical education' || n === 'pe' || n === 'health' ||
                   s.is_component || s.subject_code === 'MAPEH';
        };

        const isMapehRelatedSubject = (s: Subject) => {
            const n = (s.subject_name || '').toLowerCase().trim();
            return n === 'mapeh' || 
                   s.subject_code === 'MAPEH' || 
                   s.is_component ||
                   isMapehComp(s);
        };

        // Only search/expose MAPEH components if MAPEH or any of its components is authorized in this section's teaching load
        const hasMapehAccess = sectionSubjects.some(isMapehRelatedSubject);
        if (!hasMapehAccess) {
            return [];
        }

        const comps = sectionSubjects.filter(isMapehComp);

        // Fallback: If both components ("Music and Arts" AND "PE & Health") aren't found in sectionSubjects,
        // search raw subjects for this grade level directly
        const hasMusicArts = comps.some(s => s.subject_name.toLowerCase().includes('music') && s.subject_name.toLowerCase().includes('arts'));
        const hasPeHealth = comps.some(s => (s.subject_name.toLowerCase().includes('pe') || s.subject_name.toLowerCase().includes('physical')) && s.subject_name.toLowerCase().includes('health'));

        if (!hasMusicArts || !hasPeHealth) {
            const secGradeNum = parseInt((selectedSectionObj.section_grade_level || '').replace(/\D/g, '')) || 0;
            const fallbackComps = subjects.filter(s => {
                const sGradeNum = parseInt((s.grade_level || '').replace(/\D/g, '')) || 0;
                if (sGradeNum !== secGradeNum && s.grade_level !== selectedSectionObj.section_grade_level) return false;
                if (s.section_id && s.section_id !== selectedSectionObj.id) return false;
                return isMapehComp(s);
            });
            for (const fc of fallbackComps) {
                if (!comps.some(c => c.id === fc.id || c.subject_name.trim().toLowerCase() === fc.subject_name.trim().toLowerCase())) {
                    comps.push(fc);
                }
            }
        }

        return comps.sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    }, [subjects, selectedSectionObj, user]);

    // Filter & Sort Subjects: Hide components, ensure MAPEH is present
    const filteredSubjects = useMemo(() => {
        if (!selectedSectionObj) return [];

        let base = [...filterSubjectsForSection(user, selectedSectionObj, subjects)];
        
        // Remove individual components from main dropdown
        base = base.filter(s => {
            const n = s.subject_name.toLowerCase().trim();
            const isComponent = (n.includes('music') && n.includes('arts')) || 
                                ((n.includes('pe') || n.includes('physical')) && n.includes('health')) ||
                                n === 'music' || n === 'arts' || n === 'physical education' || n === 'pe' || n === 'health' ||
                                s.is_component || s.subject_code === 'MAPEH';
            return !isComponent;
        });

        const secGradeNum = parseInt((selectedSectionObj.section_grade_level || '').replace(/\D/g, '')) || 0;
        const isElem = (secGradeNum >= 1 && secGradeNum <= 6) || (selectedSectionObj.section_grade_level || '').toLowerCase().includes('elem');
        const isJhs = (secGradeNum >= 7 && secGradeNum <= 10) || (selectedSectionObj.section_grade_level || '').toLowerCase().includes('jhs');

        base = base.map(s => {
            const norm = normalizeSubjectName(s.subject_name);
            if (isElem && norm === 'gmrc') {
                return { ...s, subject_name: 'GMRC (Good Manners and Right Conduct)' };
            }
            if (isJhs && norm === 'gmrc') {
                return { ...s, subject_name: 'Values Education' };
            }
            return s;
        });

        // Deduplicate base subjects by normalized subject name
        const seenNames = new Set<string>();
        const uniqueBase: Subject[] = [];
        for (const s of base) {
            const norm = normalizeSubjectName(s.subject_name) || s.subject_name.trim().toLowerCase();
            if (norm && seenNames.has(norm)) continue;
            if (norm) seenNames.add(norm);
            uniqueBase.push(s);
        }
        base = uniqueBase;

        // Filter based on the selected term (quarter) if it's a specific term (1, 2, 3)
        if (typeof quarter === 'number') {
            base = base.filter(s => s.term === undefined || s.term === null || s.term === 'all' || Number(s.term) === quarter);
        } else if (quarter === 'summary_t1') {
            base = base.filter(s => s.term === undefined || s.term === null || s.term === 'all' || Number(s.term) === 1);
        } else if (quarter === 'summary_t2') {
            base = base.filter(s => s.term === undefined || s.term === null || s.term === 'all' || Number(s.term) === 2);
        } else if (quarter === 'summary_t3') {
            base = base.filter(s => s.term === undefined || s.term === null || s.term === 'all' || Number(s.term) === 3);
        }

        const hasMapeh = base.some(s => s.subject_name.toUpperCase() === 'MAPEH');
        if (!hasMapeh && mapehComponents.length > 0) {
            base.push({
                id: 'virtual_mapeh',
                subject_name: 'MAPEH',
                grade_level: selectedSectionObj.section_grade_level,
                section_id: selectedSectionObj.id,
                teacher_id: user?.uid
            } as Subject);
        }

        return base.sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    }, [subjects, selectedSectionObj, user, mapehComponents, quarter]);

    // Group subjects by category if it's SHS
    const groupedSubjects = useMemo(() => {
        const isSHS = sectionGradeLevel.includes('11') || sectionGradeLevel.includes('12');
        if (!isSHS) return null;

        const isG12 = sectionGradeLevel.includes('12');

        if (isG12) {
            const grouped = {
                'Core': [] as Subject[],
                'Applied': [] as Subject[],
                'Specialized': [] as Subject[]
            };

            filteredSubjects.forEach(s => {
                const cat = getSubjectCategory(s.subject_name, sectionGradeLevel);
                if (grouped[cat as keyof typeof grouped]) {
                    grouped[cat as keyof typeof grouped].push(s);
                } else {
                    grouped['Specialized'].push(s);
                }
            });

            return grouped;
        } else {
            const grouped = {
                'Core Subject (All Tracks)': [] as Subject[],
                'Academic Elective (All Other Electives)': [] as Subject[],
                'Academic Elective (Field Experience / Exposure, and Sports and Arts)': [] as Subject[],
                'TechPro Elective (All Other Electives)': [] as Subject[],
                'TechPro Elective (Work Immersion)': [] as Subject[]
            };

            filteredSubjects.forEach(s => {
                const cat = getSubjectCategory(s.subject_name, sectionGradeLevel);
                if (grouped[cat as keyof typeof grouped]) {
                    grouped[cat as keyof typeof grouped].push(s);
                } else {
                    grouped['Academic Elective (All Other Electives)'].push(s);
                }
            });

            return grouped;
        }
    }, [filteredSubjects, sectionGradeLevel]);

    // Auto-select first available subject if no subject is currently selected or if the selected subject is invalid
    useEffect(() => {
        if (selectedSection && filteredSubjects.length > 0) {
            const isValid = Boolean(selectedSubject && filteredSubjects.some(s => s.id === selectedSubject));
            if (!isValid) {
                const firstSub = filteredSubjects[0].id;
                setSelectedSubject(firstSub);
                setGlobalSubject(firstSub);
            }
        }
    }, [selectedSection, filteredSubjects, selectedSubject, setGlobalSubject]);

    const isAdvisoryWithoutTeachingLoad = useMemo(() => {
        return Boolean(selectedSection && selectedSectionObj?.is_advisory && filteredSubjects.length === 0);
    }, [selectedSection, selectedSectionObj, filteredSubjects]);

    // Check if the currently selected subject is MAPEH (virtual or registered database subject)
    const isMapehSelected = useMemo(() => {
        if (selectedSubject === 'virtual_mapeh') return true;
        const s = subjects.find(sub => sub.id === selectedSubject);
        if (!s) return false;
        const n = s.subject_name.trim().toUpperCase();
        return n === 'MAPEH' || n.includes('MAPEH');
    }, [selectedSubject, subjects]);

    // Determine the actual subject ID to use for grading/fetching
    const effectiveSubjectId = useMemo(() => {
        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        if (isMapehSelected && mapehComponents.length > 0 && !isSummaryMode) {
            return selectedMapehComponentId || mapehComponents[0]?.id || '';
        }
        return selectedSubject;
    }, [selectedSubject, isMapehSelected, selectedMapehComponentId, quarter, mapehComponents]);

    const subjectName = useMemo(() => {
        return subjects.find(s => s.id === effectiveSubjectId)?.subject_name || (isMapehSelected ? 'MAPEH' : '');
    }, [subjects, effectiveSubjectId, isMapehSelected]);

    useEffect(() => {
        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        if (isMapehSelected && mapehComponents.length > 0 && !isSummaryMode) {
            if (!selectedMapehComponentId || !mapehComponents.some(c => c.id === selectedMapehComponentId)) {
                setSelectedMapehComponentId(mapehComponents[0].id);
            }
        } else if (!isMapehSelected || isSummaryMode) {
            setSelectedMapehComponentId('');
        }
    }, [selectedSubject, isMapehSelected, mapehComponents, selectedMapehComponentId, quarter]);

    const sectionStudents = useMemo(() => {
        if (!selectedSection && !selectedSectionObj) return [];
        const baseStudents = students.filter((s) => isStudentInSection(s, selectedSectionObj, selectedSection));
        
        // Find subject enrollment if defined
        const subj = subjects.find(s => s.id === (selectedSubject === 'virtual_mapeh' ? selectedMapehComponentId || mapehComponents[0]?.id : selectedSubject));
        if (subj?.enrolled_student_lrns && subj.enrolled_student_lrns.length > 0) {
            return baseStudents.filter(s => subj.enrolled_student_lrns?.includes(s.lrn));
        }
        
        return baseStudents;
    }, [students, selectedSection, selectedSectionObj, selectedSubject, subjects, selectedMapehComponentId, mapehComponents]);

    const isGMRCSubject = useMemo(() => {
        const sName = subjectName || selectedSubjectObj?.subject_name || '';
        return isGmrcVeSubject(sName);
    }, [subjectName, selectedSubjectObj]);

    // Highest Possible Scores (HPS) - Persistent
    const hps = useMemo(() => {
        const activeWwCount = isGMRCSubject ? GMRC_WW_COUNT : WW_COUNT;
        const activePtCount = isGMRCSubject ? GMRC_PT_COUNT : PT_COUNT;

        if (!effectiveSubjectId) {
            return { ww: Array(activeWwCount).fill(''), pt: Array(activePtCount).fill(''), qa: Array(ST_COUNT).fill('') };
        }

        const secId = selectedSectionObj?.id || selectedSection;
        const secName = selectedSectionObj?.section_name || selectedSection;

        const record = findHpsRecord(hpsRecords, {
            subjectId: effectiveSubjectId,
            subjectName: subjectName || selectedSubjectObj?.subject_name,
            sectionId: secId,
            sectionName: secName,
            sectionGradeLevel: selectedSectionObj?.section_grade_level,
            quarter,
            schoolYear: activeSchoolYear,
            subjects,
            classRecords
        });

        const rawQa = (record as (HPSRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;

        const hps_ww = normalizeScores(record?.written_works, activeWwCount).map(v => v === '' ? '' : Number(v));
        const hps_pt = normalizeScores(record?.performance_tasks, activePtCount).map(v => v === '' ? '' : Number(v));
        const hps_qa = normalizeScores(rawQa, ST_COUNT).map((v, i) => {
            if (i === 2 && (v === undefined || v === '')) {
                const legacy = record?.quarterly_exam;
                return (legacy === undefined || legacy === '') ? '' : Number(legacy);
            }
            return v === '' ? '' : Number(v);
        });

        return {
            ww: hps_ww,
            pt: hps_pt,
            qa: hps_qa
        };
    }, [hpsRecords, effectiveSubjectId, subjectName, selectedSubjectObj, activeSchoolYear, quarter, selectedSection, selectedSectionObj, isGMRCSubject, subjects, classRecords]);

    const isTermExamHpsMissing = useMemo(() => {
        if (!hps || !hps.qa) return false;
        const hasStHps = Number(hps.qa[0]) > 0 || Number(hps.qa[1]) > 0;
        const isTeHpsEmpty = !hps.qa[2] || Number(hps.qa[2]) === 0;
        return hasStHps && isTeHpsEmpty;
    }, [hps]);


    // Get current subject and its weight cluster


    const sectionTrack = useMemo(() => {
        if (selectedSectionObj?.track) {
            const tr = selectedSectionObj.track;
            if (tr === 'Academic') {
                if (selectedSectionObj.strand) {
                    return `Academic - ${selectedSectionObj.strand}`;
                }
                return 'Academic Track';
            }
            if (tr === 'TechPro') {
                return 'TechPro Track';
            }
            if (tr === 'TVL') {
                return 'Technical-Vocational-Livelihood (TVL)';
            }
            return `${tr} Track`;
        }
        if (!selectedSection) return '';
        const norm = selectedSection.toUpperCase();
        if (norm.includes('STEM')) return 'Academic - STEM';
        if (norm.includes('ABM')) return 'Academic - ABM';
        if (norm.includes('HUMSS')) return 'Academic - HUMSS';
        if (norm.includes('GAS')) return 'Academic - GAS';
        if (norm.includes('TVL') || norm.includes('TECHPRO') || norm.includes('HE') || norm.includes('ICT')) return 'Technical-Vocational-Livelihood (TVL)';
        return 'Academic Track';
    }, [selectedSection, selectedSectionObj]);

    const currentCluster = useMemo(() => {
        return getSubjectCluster(subjectName, sectionGradeLevel, sectionTrack);
    }, [subjectName, sectionGradeLevel, sectionTrack]);

    const currentWeights = useMemo(() => {
        return getWeights(currentCluster, selectedSubjectObj);
    }, [currentCluster, selectedSubjectObj]);

    // Fetch Teacher Name
    const [teacherName, setTeacherName] = useState('');

    useEffect(() => {
        const fetchTeacher = async () => {
            // Source of truth priority:
            // 1. Hardcoded Emerson check (User's special request)
            if (user?.email?.includes('galanoemerson') || user?.displayName?.toLowerCase().includes('emerson')) {
                setTeacherName("EMERSON M. GALANO");
                return;
            }

            // 2. Subject-assigned teacher (Check both main subject and effective component)
            const targetSubject = subjects.find(s => s.id === effectiveSubjectId) || selectedSubjectObj;
            if (targetSubject?.teacher_id) {
                if (user?.uid === targetSubject.teacher_id) {
                    setTeacherName(user.displayName?.toUpperCase() || schoolProfile?.adviser_name?.toUpperCase() || "TEACHER");
                    return;
                }

                const teacher = teachers.find((entry) => entry.uid === targetSubject.teacher_id);
                if (teacher) {
                    setTeacherName(teacher.displayName?.toUpperCase() || "UNKNOWN TEACHER");
                    return;
                }
            }

            // 3. Fallback to Section Adviser or School Profile Adviser
            const fallbackName = selectedSectionObj?.adviser_name || schoolProfile?.adviser_name || user?.displayName || "";
            setTeacherName(fallbackName.toUpperCase());
        };

        fetchTeacher();
    }, [selectedSubjectObj, effectiveSubjectId, selectedSectionObj, user, teachers, schoolProfile, subjects]);

    const maleStudents = useMemo(() => sectionStudents.filter(s => isMaleStudent(s) || !isFemaleStudent(s)).sort((a, b) => {
        const nameA = `${a.last_name}, ${a.first_name}`.toLowerCase();
        const nameB = `${b.last_name}, ${b.first_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
    }), [sectionStudents]);

    const femaleStudents = useMemo(() => sectionStudents.filter(s => isFemaleStudent(s)).sort((a, b) => {
        const nameA = `${a.last_name}, ${a.first_name}`.toLowerCase();
        const nameB = `${b.last_name}, ${b.first_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
    }), [sectionStudents]);

    // Set learners' names column width dynamically based on longest student name
    const optimalNameColumnWidth = useMemo(() => {
        const allStudents = [...maleStudents, ...femaleStudents];
        if (allStudents.length === 0) return 160;

        let maxLen = 0;
        allStudents.forEach((s, idx) => {
            const formatted = `${idx + 1}. ${formatStudentFullName(s)}`;
            if (formatted.length > maxLen) {
                maxLen = formatted.length;
            }
        });

        // 10px uppercase character ~ 6.0px + 14px cell padding
        const minFloor = 145; // Minimum needed to cleanly display "HIGHEST POSSIBLE SCORE" / "LEARNERS' NAMES"
        const calculated = Math.ceil(maxLen * 6.0 + 14);
        return Math.max(minFloor, calculated);
    }, [maleStudents, femaleStudents, formatStudentFullName]);

    const studentRecordMap = useMemo(() => {
        const map = new Map<string, ClassRecord>();
        const targetQ = typeof quarter === 'number' ? quarter : parseInt(String(quarter).replace(/\D/g, '')) || 1;
        for (let i = 0; i < classRecords.length; i++) {
            const r = classRecords[i];
            if (Number(r.quarter) !== targetQ) continue;
            if (activeSchoolYear && r.school_year && r.school_year !== activeSchoolYear && !r.school_year.includes(activeSchoolYear)) continue;
            if (r.subject_id === effectiveSubjectId || isSameSubject(r.subject_id, r.subject_name, effectiveSubjectId, subjectName)) {
                map.set(r.student_lrn, r);
            }
        }
        return map;
    }, [classRecords, effectiveSubjectId, subjectName, quarter, activeSchoolYear]);

    const getStudentSummary = useCallback((student: typeof students[0]) => {
        const activeWwCount = isGMRCSubject ? GMRC_WW_COUNT : WW_COUNT;
        const activePtCount = isGMRCSubject ? GMRC_PT_COUNT : PT_COUNT;

        const record = studentRecordMap.get(student.lrn);

        const sGrades: Pick<ClassRecord, 'written_works' | 'performance_tasks' | 'quarterly_exam'> = record || {
            written_works: Array(activeWwCount).fill(''),
            performance_tasks: Array(activePtCount).fill(''),
            quarterly_exam: ''
        };

        const wwScores = normalizeScores(sGrades.written_works, activeWwCount).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });
        const ptScores = normalizeScores(sGrades.performance_tasks, activePtCount).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });
        const rawQaRec = (record as (ClassRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;
        const qaScores = normalizeScores(rawQaRec, ST_COUNT).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });
        
        // Only use legacy quarterly_exam if it's not empty AND not 0 (to avoid default 0 issues)
        if (qaScores[2] === '' && sGrades.quarterly_exam !== '' && sGrades.quarterly_exam !== 0 && sGrades.quarterly_exam !== '0') {
            qaScores[2] = Number(sGrades.quarterly_exam);
        }

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            wwScores.some(isValidScore) ||
            ptScores.some(isValidScore) ||
            qaScores.some(isValidScore);

        if (isGMRCSubject) {
            const wwCogScores = wwScores.slice(0, 5);
            const wwAffScores = wwScores.slice(5, 10);
            const ptCogScores = ptScores.slice(0, 3);
            const ptAffScores = ptScores.slice(3, 6);
            const ptBehScores = ptScores.slice(6, 9);

            const wwCogTotalScore = wwCogScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const wwCogTotalHPS = hps.ww.slice(0, 5).reduce<number>((a, b) => a + Number(b), 0);
            const wwCogPS = wwCogTotalHPS === 0 ? 0 : (wwCogTotalScore / wwCogTotalHPS) * 100;
            const wwCogWS = wwCogPS * 0.10;

            const wwAffTotalScore = wwAffScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const wwAffTotalHPS = hps.ww.slice(5, 10).reduce<number>((a, b) => a + Number(b), 0);
            const wwAffPS = wwAffTotalHPS === 0 ? 0 : (wwAffTotalScore / wwAffTotalHPS) * 100;
            const wwAffWS = wwAffPS * 0.10;

            const ptCogTotalScore = ptCogScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const ptCogTotalHPS = hps.pt.slice(0, 3).reduce<number>((a, b) => a + Number(b), 0);
            const ptCogPS = ptCogTotalHPS === 0 ? 0 : (ptCogTotalScore / ptCogTotalHPS) * 100;
            const ptCogWS = ptCogPS * 0.10;

            const ptAffTotalScore = ptAffScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const ptAffTotalHPS = hps.pt.slice(3, 6).reduce<number>((a, b) => a + Number(b), 0);
            const ptAffPS = ptAffTotalHPS === 0 ? 0 : (ptAffTotalScore / ptAffTotalHPS) * 100;
            const ptAffWS = ptAffPS * 0.10;

            const ptBehTotalScore = ptBehScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
            const ptBehTotalHPS = hps.pt.slice(6, 9).reduce<number>((a, b) => a + Number(b), 0);
            const ptBehPS = ptBehTotalHPS === 0 ? 0 : (ptBehTotalScore / ptBehTotalHPS) * 100;
            const ptBehWS = ptBehPS * 0.30;

            const st1Score = typeof qaScores[0] === 'number' ? qaScores[0] : (qaScores[0] === '' || qaScores[0] === null || qaScores[0] === undefined ? null : Number(qaScores[0]));
            const st1HPS = Number(hps.qa[0]) || 0;
            const st2Score = typeof qaScores[1] === 'number' ? qaScores[1] : (qaScores[1] === '' || qaScores[1] === null || qaScores[1] === undefined ? null : Number(qaScores[1]));
            const st2HPS = Number(hps.qa[1]) || 0;
            const teScore = typeof qaScores[2] === 'number' ? qaScores[2] : (qaScores[2] === '' || qaScores[2] === null || qaScores[2] === undefined ? null : Number(qaScores[2]));
            const teHPS = Number(hps.qa[2]) || 0;

            const st1WS = (st1HPS > 0 && st1Score !== null && !isNaN(st1Score as number)) ? ((st1Score as number) / st1HPS) * 30 : null;
            const st2WS = (st2HPS > 0 && st2Score !== null && !isNaN(st2Score as number)) ? ((st2Score as number) / st2HPS) * 30 : null;
            const teWS = (teHPS > 0 && teScore !== null && !isNaN(teScore as number)) ? ((teScore as number) / teHPS) * 40 : null;

            let qaScore = 0;
            let qaHPS = 0;
            if (st1HPS > 0 && st1Score !== null && !isNaN(st1Score as number)) {
                qaHPS += st1HPS;
                qaScore += (st1Score as number);
            }
            if (st2HPS > 0 && st2Score !== null && !isNaN(st2Score as number)) {
                qaHPS += st2HPS;
                qaScore += (st2Score as number);
            }
            if (teHPS > 0 && teScore !== null && !isNaN(teScore as number)) {
                qaHPS += teHPS;
                qaScore += (teScore as number);
            }

            const qaPS = (st1WS !== null || st2WS !== null || teWS !== null) ? ((st1WS || 0) + (st2WS || 0) + (teWS || 0)) : 0;
            const qaWS = qaPS * 0.30;

            const initialGrade = (wwCogWS || 0) + (wwAffWS || 0) + (ptCogWS || 0) + (ptAffWS || 0) + (ptBehWS || 0) + (qaWS || 0);
            const quarterlyGrade = hasScores ? transmuteGrade(initialGrade, activeSchoolYear) : 0;

            return {
                ww: wwScores,
                pt: ptScores,
                qa: qaScores,
                hasScores,
                wwCog: wwCogScores, wwCogTotalScore, wwCogTotalHPS, wwCogPS, wwCogWS,
                wwAff: wwAffScores, wwAffTotalScore, wwAffTotalHPS, wwAffPS, wwAffWS,
                ptCog: ptCogScores, ptCogTotalScore, ptCogTotalHPS, ptCogPS, ptCogWS,
                ptAff: ptAffScores, ptAffTotalScore, ptAffTotalHPS, ptAffPS, ptAffWS,
                ptBeh: ptBehScores, ptBehTotalScore, ptBehTotalHPS, ptBehPS, ptBehWS,
                qaScore, qaHPS, qaPS, qaWS,
                initialGrade: isNaN(initialGrade) ? 0 : initialGrade,
                quarterlyGrade: isNaN(quarterlyGrade) ? 0 : quarterlyGrade
            };
        }

        const wwTotalScore = wwScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const wwTotalHPS = hps.ww.reduce<number>((a, b) => a + Number(b), 0);
        const wwPS = wwTotalHPS === 0 ? 0 : Math.min(100, Math.max(0, (wwTotalScore / wwTotalHPS) * 100));
        const wwWS = wwPS * (normalizeWeightFraction(currentWeights.written_works) || 0);

        const ptTotalScore = ptScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const ptTotalHPS = hps.pt.reduce<number>((a, b) => a + Number(b), 0);
        const ptPS = ptTotalHPS === 0 ? 0 : Math.min(100, Math.max(0, (ptTotalScore / ptTotalHPS) * 100));
        const ptWS = ptPS * (normalizeWeightFraction(currentWeights.performance_tasks) || 0);

        const st1Score = typeof qaScores[0] === 'number' ? qaScores[0] : (qaScores[0] === '' || qaScores[0] === null || qaScores[0] === undefined ? null : Number(qaScores[0]));
        const st1HPS = Number(hps.qa[0]) || 0;
        const st2Score = typeof qaScores[1] === 'number' ? qaScores[1] : (qaScores[1] === '' || qaScores[1] === null || qaScores[1] === undefined ? null : Number(qaScores[1]));
        const st2HPS = Number(hps.qa[1]) || 0;
        const teScore = typeof qaScores[2] === 'number' ? qaScores[2] : (qaScores[2] === '' || qaScores[2] === null || qaScores[2] === undefined ? null : Number(qaScores[2]));
        const teHPS = Number(hps.qa[2]) || 0;

        let qaScore = 0;
        let qaHPS = 0;
        if (st1HPS > 0 && st1Score !== null && !isNaN(st1Score as number)) {
            qaHPS += st1HPS;
            qaScore += (st1Score as number);
        }
        if (st2HPS > 0 && st2Score !== null && !isNaN(st2Score as number)) {
            qaHPS += st2HPS;
            qaScore += (st2Score as number);
        }
        if (teHPS > 0 && teScore !== null && !isNaN(teScore as number)) {
            qaHPS += teHPS;
            qaScore += (teScore as number);
        }

        const qaPS = computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
        const qaWS = qaPS * (normalizeWeightFraction(currentWeights.quarterly_exam) || 0);

        const rawInitial = (wwWS || 0) + (ptWS || 0) + (qaWS || 0);
        const initialGrade = rawInitial > 100 && rawInitial <= 10000 ? Math.min(100, Math.max(0, rawInitial / 100)) : Math.min(100, Math.max(0, rawInitial));
        const quarterlyGrade = hasScores ? transmuteGrade(initialGrade, activeSchoolYear) : 0;

        return {
            ww: wwScores,
            pt: ptScores,
            qa: qaScores,
            hasScores,
            wwTotalScore, wwTotalHPS, wwPS, wwWS,
            ptTotalScore, ptTotalHPS, ptPS, ptWS,
            qaScore, qaHPS, qaPS, qaWS,
            initialGrade: isNaN(initialGrade) ? 0 : initialGrade,
            quarterlyGrade: isNaN(quarterlyGrade) ? 0 : quarterlyGrade
        };
    }, [studentRecordMap, hps, currentWeights, currentCluster, activeSchoolYear, isGMRCSubject]);

    const getGradeDescriptor = useCallback((grade: number, hasScores: boolean) => {
        if (!hasScores || grade <= 0) return '';
        return getGradeDescriptorWithFilipino(grade, sectionGradeLevel, activeSchoolYear);
    }, [sectionGradeLevel, activeSchoolYear]);

    const getSummaryGrades = useCallback((student: Student): SummaryGradeResult => {
        const isMapeh = (isMapehSelected || subjectName.toUpperCase() === 'MAPEH') && mapehComponents.length > 0;
        
        const targetSubjectObj = subjects.find(s => s.id === selectedSubject);
        const isTermOffered = (subj: typeof targetSubjectObj | undefined, q: number) => {
            if (!subj) return true;
            const termVal = subj.term;
            if (termVal === undefined || termVal === null || termVal === 'all') return true;
            if (termVal === 'none') return false;
            return Number(termVal) === q;
        };

        // Authoritative quarter grade resolver: live computed from raw scores + HPS -> fallback to resolveStudentQuarterGrade
        const resolveQuarterGradeForSubj = (subj: Subject | undefined, q: number): number => {
            if (!subj || !isTermOffered(subj, q)) return 0;

            const record = classRecords.find(r =>
                r.student_lrn === student.lrn &&
                (r.subject_id === subj.id || isMatchingSubject(subj.subject_name, r.subject_id, r.subject_name)) &&
                (r.quarter === q || Number(r.quarter) === q) &&
                r.school_year === activeSchoolYear
            );

            const recordHps = findHpsRecord(hpsRecords, {
                subjectId: subj.id,
                subjectName: subj.subject_name,
                quarter: q,
                schoolYear: activeSchoolYear,
                sectionId: selectedSectionObj?.id || selectedSection,
            });

            const subjCluster = getSubjectCluster(subj.subject_name, sectionGradeLevel);
            const subjWeights = getWeights(subjCluster);

            let calculated = 0;
            if (record) {
                const live = computeLiveTransmutedGradeFromRecord(record, recordHps, {
                    gradeLevel: sectionGradeLevel,
                    schoolYear: activeSchoolYear,
                    weights: subjWeights,
                    cluster: subjCluster,
                    isZeroExam: false
                });
                if (live > 0) calculated = live;
            }

            if (!calculated || calculated <= 0) {
                const fallback = resolveStudentQuarterGrade({
                    studentLrn: student.lrn,
                    subjectId: subj.id,
                    subjectName: subj.subject_name,
                    quarter: q,
                    schoolYear: activeSchoolYear,
                    gradingSheetRecords,
                    classRecords,
                    hpsRecords,
                    sectionGradeLevel,
                });
                if (fallback > 0) calculated = fallback;
            }

            return calculated > 0 ? calculated : 0;
        };

        if (isMapeh) {
            // Find component subjects for this section using the already calculated mapehComponents
            const maSubj = mapehComponents.find(s => isMusicArtsSubject(s.subject_name)) || mapehComponents.find(s => {
                const n = s.subject_name.toLowerCase();
                return (n.includes('music') && n.includes('arts'));
            });
            const peSubj = mapehComponents.find(s => isPeHealthSubject(s.subject_name)) || mapehComponents.find(s => {
                const n = s.subject_name.toLowerCase();
                return ((n.includes('pe') || n.includes('physical')) && n.includes('health'));
            });

            // Legacy 4-component support fallback if dual components not present
            const musicSubj = !maSubj ? mapehComponents.find(s => s.subject_name.toLowerCase().trim() === 'music') : undefined;
            const artsSubj = !maSubj ? mapehComponents.find(s => s.subject_name.toLowerCase().trim() === 'arts' || s.subject_name.toLowerCase().trim() === 'art') : undefined;
            const peOnlySubj = !peSubj ? mapehComponents.find(s => s.subject_name.toLowerCase().trim() === 'pe' || s.subject_name.toLowerCase().trim() === 'physical education') : undefined;
            const healthSubj = !peSubj ? mapehComponents.find(s => s.subject_name.toLowerCase().trim() === 'health') : undefined;

            const getMaGrade = (q: number) => {
                if (maSubj) return resolveQuarterGradeForSubj(maSubj, q);
                if (musicSubj && artsSubj) {
                    const m = resolveQuarterGradeForSubj(musicSubj, q);
                    const a = resolveQuarterGradeForSubj(artsSubj, q);
                    if (m > 0 && a > 0) return Math.round((m + a) / 2);
                    return m || a || 0;
                }
                return 0;
            };

            const getPeGrade = (q: number) => {
                if (peSubj) return resolveQuarterGradeForSubj(peSubj, q);
                if (peOnlySubj && healthSubj) {
                    const p = resolveQuarterGradeForSubj(peOnlySubj, q);
                    const h = resolveQuarterGradeForSubj(healthSubj, q);
                    if (p > 0 && h > 0) return Math.round((p + h) / 2);
                    return p || h || 0;
                }
                return 0;
            };

            // Handling specific summary modes
            if (quarter === 'summary_t1' || quarter === 'summary_t2' || quarter === 'summary_t3' || quarter === 'summary') {
                const targetTerm = quarter === 'summary_t2' ? 2 : quarter === 'summary_t3' ? 3 : 1;
                const maNum = getMaGrade(targetTerm);
                const peNum = getPeGrade(targetTerm);
                let finalNum: number | '' = (maNum > 0 && peNum > 0) ? Math.round((maNum + peNum) / 2) : (maNum || peNum || '');

                if (finalNum === '') {
                    const mapehDirect = resolveStudentQuarterGrade({
                        studentLrn: student.lrn,
                        subjectId: selectedSubject,
                        subjectName: 'MAPEH',
                        quarter: targetTerm,
                        schoolYear: activeSchoolYear,
                        gradingSheetRecords,
                        classRecords,
                        hpsRecords,
                        sectionGradeLevel,
                    });
                    if (mapehDirect > 0) finalNum = mapehDirect;
                }

                const final = finalNum !== '' ? finalNum : '';
                const descriptor = final !== '' ? getGradeDescriptor(Number(final), true) : '';
                return {
                    ma: maNum > 0 ? maNum : '',
                    pe: peNum > 0 ? peNum : '',
                    final,
                    descriptor,
                    isMapeh: true,
                    mapehMode: 'component'
                };
            }

            if (quarter === 'summary_final') {
                let total = 0;
                let count = 0;
                const termAverages = [1, 2, 3].map(q => {
                    const maOffered = maSubj ? isTermOffered(maSubj, q) : true;
                    const peOffered = peSubj ? isTermOffered(peSubj, q) : true;
                    if (!maOffered && !peOffered) return '';
                    
                    const maNum = getMaGrade(q);
                    const peNum = getPeGrade(q);
                    let avg = (maNum > 0 && peNum > 0) ? Math.round((maNum + peNum) / 2) : (maNum || peNum || 0);

                    if (avg === 0) {
                        const mapehDirect = resolveStudentQuarterGrade({
                            studentLrn: student.lrn,
                            subjectId: selectedSubject,
                            subjectName: 'MAPEH',
                            quarter: q,
                            schoolYear: activeSchoolYear,
                            gradingSheetRecords,
                            classRecords,
                            hpsRecords,
                            sectionGradeLevel,
                        });
                        if (mapehDirect > 0) avg = mapehDirect;
                    }

                    if (avg > 0) {
                        total += avg;
                        count++;
                        return avg;
                    }
                    return '';
                });
                const final = count > 0 ? Math.round(total / count) : '';
                const descriptor = final !== '' ? getGradeDescriptor(Number(final), true) : '';
                return { t1: termAverages[0], t2: termAverages[1], t3: termAverages[2], final, descriptor, isMapeh: true, mapehMode: 'final' };
            }
        }

        let total = 0;
        let count = 0;
        const terms = [1, 2, 3].map(q => {
            if (!isTermOffered(targetSubjectObj, q)) {
                return '';
            }
            const grade = resolveQuarterGradeForSubj(targetSubjectObj, q);
            if (grade > 0) {
                total += grade;
                count++;
                return grade;
            }
            return '';
        });
        
        const final = count > 0 ? Math.round(total / count) : '';
        const descriptor = final !== '' ? getGradeDescriptor(Number(final), true) : '';
        
        return {
            t1: terms[0],
            t2: terms[1],
            t3: terms[2],
            final,
            descriptor,
            isMapeh: false
        };
    }, [classRecords, gradingSheetRecords, hpsRecords, subjectName, selectedSubject, activeSchoolYear, quarter, mapehComponents, getGradeDescriptor, subjects, isMapehSelected, selectedSectionObj, selectedSection, sectionGradeLevel]);

    const proficiencyDataCalc = useMemo(() => {
        const levels = [
            { key: 'advancing', min: 90, max: 100 },
            { key: 'benchmarking', min: 80, max: 89 },
            { key: 'connecting', min: 75, max: 79 },
            { key: 'developing', min: 65, max: 74 },
            { key: 'emerging', min: 0, max: 64 }
        ] as const;

        const data: Record<string, { male: number; female: number; total: number }> = {};

        levels.forEach(level => {
            const m = maleStudents.filter(s => {
                const summary = getStudentSummary(s);
                const g = summary.quarterlyGrade;
                return g > 0 && g >= level.min && g <= level.max;
            }).length;
            const f = femaleStudents.filter(s => {
                const summary = getStudentSummary(s);
                const g = summary.quarterlyGrade;
                return g > 0 && g >= level.min && g <= level.max;
            }).length;
            data[level.key] = { male: m, female: f, total: m + f };
        });

        return data;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maleStudents, femaleStudents, quarter, hps, currentWeights, selectedSubject, getStudentSummary]);

    const mpsData = useMemo(() => {
        const getMps = (list: typeof maleStudents) => {
            const grades = list.map(s => getStudentSummary(s).quarterlyGrade).filter(g => g > 0);
            return grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
        };
        return {
            maleMps: getMps(maleStudents),
            femaleMps: getMps(femaleStudents),
            totalMps: getMps([...maleStudents, ...femaleStudents]),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maleStudents, femaleStudents, quarter, hps, currentWeights, selectedSubject, getStudentSummary]);

    const summativeAnalysis = useMemo(() => {
        const results = [0, 1, 2].map(index => {
            const scores = [...maleStudents, ...femaleStudents]
                .map(s => getStudentSummary(s).qa[index])
                .filter(s => s !== '' && s !== null && s !== undefined)
                .map(s => Number(s));
            
            const totalStudents = scores.length;
            const hpsVal = Number(hps.qa[index]) || 0;
            
            if (totalStudents === 0 || hpsVal === 0) {
                return {
                    count: 0,
                    hps: hpsVal,
                    criterion: { above75: 0, above75Pct: 0, below75: 0, below75Pct: 0 },
                    norm: { mean: 0, median: 0, sd: 0, mps: 0 },
                    other: { high: 0, low: 0, total: 0 }
                };
            }

            const above75 = scores.filter(s => (s / hpsVal) * 100 >= 75).length;
            const below75 = totalStudents - above75;

            const mean = scores.reduce((a, b) => a + b, 0) / totalStudents;
            const sorted = [...scores].sort((a, b) => a - b);
            const median = totalStudents % 2 === 0 
                ? (sorted[totalStudents / 2 - 1] + sorted[totalStudents / 2]) / 2 
                : sorted[Math.floor(totalStudents / 2)];
            
            const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / totalStudents;
            const sd = Math.sqrt(variance);
            const mps = (mean / hpsVal) * 100;

            return {
                count: totalStudents,
                hps: hpsVal,
                criterion: {
                    above75,
                    above75Pct: (above75 / totalStudents) * 100,
                    below75,
                    below75Pct: (below75 / totalStudents) * 100
                },
                norm: { mean, median, sd, mps },
                other: {
                    high: Math.max(...scores),
                    low: Math.min(...scores),
                    total: scores.reduce((a, b) => a + b, 0)
                }
            };
        });

        return { st1: results[0], st2: results[1], te: results[2] };
    }, [maleStudents, femaleStudents, hps.qa, getStudentSummary]);

    const updateHPS = useCallback((type: 'ww' | 'pt' | 'qa', index: number, value: string) => {
        if (!effectiveSubjectId) return;

        const numVal: number | string = value === '' ? '' : Number(value);
        if (typeof numVal === 'number' && isNaN(numVal)) return;

        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        if (isSummaryMode) return;

        const secId = selectedSectionObj?.id || sections.find(s => s.id === selectedSection || s.section_name === selectedSection)?.id || selectedSection;
        const secName = selectedSectionObj?.section_name || selectedSection;

        const stateHpsRecords = useAppStore.getState().hpsRecords;
        const currentSubjects = useAppStore.getState().subjects;
        const currentClassRecords = useAppStore.getState().classRecords;
        const currentSubName = subjectName || selectedSubjectObj?.subject_name || currentSubjects.find(s => s.id === effectiveSubjectId)?.subject_name || '';

        const existingRecord = findHpsRecord(stateHpsRecords, {
            subjectId: effectiveSubjectId,
            subjectName: currentSubName,
            sectionId: secId,
            sectionName: secName,
            sectionGradeLevel: selectedSectionObj?.section_grade_level,
            quarter,
            schoolYear: activeSchoolYear,
            subjects: currentSubjects,
            classRecords: currentClassRecords
        });

        const activeWwCount = isGMRCSubject ? GMRC_WW_COUNT : WW_COUNT;
        const activePtCount = isGMRCSubject ? GMRC_PT_COUNT : PT_COUNT;

        const newRecord: HPSRecord = existingRecord ? {
            ...existingRecord,
            subject_id: effectiveSubjectId,
            subject_name: currentSubName || existingRecord.subject_name,
            school_year: activeSchoolYear || existingRecord.school_year,
            section_id: secId
        } : {
            id: `hps_${effectiveSubjectId}_${secId}_Q${quarter}_${activeSchoolYear}`,
            subject_id: effectiveSubjectId,
            subject_name: currentSubName,
            school_year: activeSchoolYear,
            quarter: (typeof quarter === 'number' ? quarter : 1) as 1 | 2 | 3 | 4,
            written_works: Array(activeWwCount).fill(''),
            performance_tasks: Array(activePtCount).fill(''),
            quarterly_exam: '',
            section_id: secId
        };

        const hpsWithSummative = newRecord as HPSRecord & { summative_tests?: (number | string)[] };

        const currentQa = normalizeScores(hpsWithSummative.summative_tests, ST_COUNT);
        
        if (type === 'qa') {
            currentQa[index] = numVal;
            hpsWithSummative.summative_tests = currentQa;
            newRecord.quarterly_exam = currentQa[2];
        } else if (type === 'ww') {
            const newWW = normalizeScores(newRecord.written_works, activeWwCount);
            newWW[index] = numVal;
            newRecord.written_works = newWW;
        } else if (type === 'pt') {
            const newPT = normalizeScores(newRecord.performance_tasks, activePtCount);
            newPT[index] = numVal;
            newRecord.performance_tasks = newPT;
        }

        updateHPSRecord(newRecord);

        // Recalculate and update final_grade for all section students with scores to prevent stale calculations
        const stateClassRecords = useAppStore.getState().classRecords;
        const currentHpsWw = normalizeScores(newRecord.written_works, activeWwCount).map(v => Number(v) || 0);
        const currentHpsPt = normalizeScores(newRecord.performance_tasks, activePtCount).map(v => Number(v) || 0);
        const currentHpsQa = normalizeScores(currentQa, ST_COUNT).map(v => Number(v) || 0);

        sectionStudents.forEach(st => {
            const cr = stateClassRecords.find(r =>
                r.student_lrn === st.lrn &&
                (r.subject_id === effectiveSubjectId || isSameSubject(r.subject_id, r.subject_name, effectiveSubjectId, subjectName)) &&
                Number(r.quarter) === Number(quarter) &&
                (!activeSchoolYear || !r.school_year || r.school_year === activeSchoolYear || r.school_year.includes(activeSchoolYear))
            );
            if (!cr) return;

            const sWw = normalizeScores(cr.written_works, activeWwCount);
            const sPt = normalizeScores(cr.performance_tasks, activePtCount);
            const sQa = normalizeScores((cr as ClassRecord & { summative_tests?: (number | string)[] }).summative_tests, ST_COUNT);
            if (!sQa[2] && cr.quarterly_exam !== '') sQa[2] = cr.quarterly_exam;

            const isValid = (v: unknown) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v));
            const hasScores = sWw.some(isValid) || sPt.some(isValid) || sQa.some(isValid);
            if (!hasScores) return;

            let initialGrade = 0;

            if (isGMRCSubject) {
                const sWwCogTotal = sWw.slice(0, 5).reduce<number>((a, b) => a + (isValid(b) ? Number(b) : 0), 0);
                const hpsWwCogTotal = currentHpsWw.slice(0, 5).reduce((a, b) => a + b, 0);
                const wwCogPS = hpsWwCogTotal === 0 ? 0 : Math.min(100, Math.max(0, (sWwCogTotal / hpsWwCogTotal) * 100));
                const wwCogWS = wwCogPS * 0.10;

                const sWwAffTotal = sWw.slice(5, 10).reduce<number>((a, b) => a + (isValid(b) ? Number(b) : 0), 0);
                const hpsWwAffTotal = currentHpsWw.slice(5, 10).reduce((a, b) => a + b, 0);
                const wwAffPS = hpsWwAffTotal === 0 ? 0 : Math.min(100, Math.max(0, (sWwAffTotal / hpsWwAffTotal) * 100));
                const wwAffWS = wwAffPS * 0.10;

                const sPtCogTotal = sPt.slice(0, 3).reduce<number>((a, b) => a + (isValid(b) ? Number(b) : 0), 0);
                const hpsPtCogTotal = currentHpsPt.slice(0, 3).reduce((a, b) => a + b, 0);
                const ptCogPS = hpsPtCogTotal === 0 ? 0 : Math.min(100, Math.max(0, (sPtCogTotal / hpsPtCogTotal) * 100));
                const ptCogWS = ptCogPS * 0.10;

                const sPtAffTotal = sPt.slice(3, 6).reduce<number>((a, b) => a + (isValid(b) ? Number(b) : 0), 0);
                const hpsPtAffTotal = currentHpsPt.slice(3, 6).reduce((a, b) => a + b, 0);
                const ptAffPS = hpsPtAffTotal === 0 ? 0 : Math.min(100, Math.max(0, (sPtAffTotal / hpsPtAffTotal) * 100));
                const ptAffWS = ptAffPS * 0.10;

                const sPtBehTotal = sPt.slice(6, 9).reduce<number>((a, b) => a + (isValid(b) ? Number(b) : 0), 0);
                const hpsPtBehTotal = currentHpsPt.slice(6, 9).reduce((a, b) => a + b, 0);
                const ptBehPS = hpsPtBehTotal === 0 ? 0 : Math.min(100, Math.max(0, (sPtBehTotal / hpsPtBehTotal) * 100));
                const ptBehWS = ptBehPS * 0.30;

                const st1Score = sQa[0] === '' || sQa[0] === null || sQa[0] === undefined ? null : Number(sQa[0]);
                const st1HPS = Number(currentHpsQa[0]) || 0;
                const st2Score = sQa[1] === '' || sQa[1] === null || sQa[1] === undefined ? null : Number(sQa[1]);
                const st2HPS = Number(currentHpsQa[1]) || 0;
                const teScore = sQa[2] === '' || sQa[2] === null || sQa[2] === undefined ? null : Number(sQa[2]);
                const teHPS = Number(currentHpsQa[2]) || 0;

                const st1WS = (st1HPS > 0 && st1Score !== null && !isNaN(st1Score)) ? (st1Score / st1HPS) * 30 : 0;
                const st2WS = (st2HPS > 0 && st2Score !== null && !isNaN(st2Score)) ? (st2Score / st2HPS) * 30 : 0;
                const teWS = (teHPS > 0 && teScore !== null && !isNaN(teScore)) ? (teScore / teHPS) * 40 : 0;
                const qaPS = st1WS + st2WS + teWS;
                const qaWS = qaPS * 0.30;

                initialGrade = Math.min(100, Math.max(0, wwCogWS + wwAffWS + ptCogWS + ptAffWS + ptBehWS + qaWS));
            } else {
                const sWwTotal = sWw.reduce<number>((a, b) => a + (isValid(b) ? Number(b) : 0), 0);
                const sPtTotal = sPt.reduce<number>((a, b) => a + (isValid(b) ? Number(b) : 0), 0);
                const hpsWwTotal = currentHpsWw.reduce((a, b) => a + b, 0);
                const hpsPtTotal = currentHpsPt.reduce((a, b) => a + b, 0);

                const wwPS = hpsWwTotal === 0 ? 0 : Math.min(100, Math.max(0, (sWwTotal / hpsWwTotal) * 100));
                const wwWS = wwPS * (normalizeWeightFraction(currentWeights.written_works) || 0);

                const ptPS = hpsPtTotal === 0 ? 0 : Math.min(100, Math.max(0, (sPtTotal / hpsPtTotal) * 100));
                const ptWS = ptPS * (normalizeWeightFraction(currentWeights.performance_tasks) || 0);

                const st1Score = sQa[0] === '' || sQa[0] === null || sQa[0] === undefined ? null : Number(sQa[0]);
                const st1HPS = Number(currentHpsQa[0]) || 0;
                const st2Score = sQa[1] === '' || sQa[1] === null || sQa[1] === undefined ? null : Number(sQa[1]);
                const st2HPS = Number(currentHpsQa[1]) || 0;
                const teScore = sQa[2] === '' || sQa[2] === null || sQa[2] === undefined ? null : Number(sQa[2]);
                const teHPS = Number(currentHpsQa[2]) || 0;

                const qaPS = computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
                const qaWS = qaPS * (normalizeWeightFraction(currentWeights.quarterly_exam) || 0);
                const rawInitial = wwWS + ptWS + qaWS;
                initialGrade = rawInitial > 100 && rawInitial <= 10000 ? Math.min(100, Math.max(0, rawInitial / 100)) : Math.min(100, Math.max(0, rawInitial));
            }

            const newFinalGrade = transmuteGrade(initialGrade, cr.school_year || activeSchoolYear);

            const updatedCr: ClassRecord = {
                ...cr,
                subject_id: effectiveSubjectId,
                subject_name: subjectName || cr.subject_name,
                final_grade: newFinalGrade
            };
            updateClassRecord(updatedCr);

            const { updateGradingSheetRecord } = useAppStore.getState();
            updateGradingSheetRecord({
                id: `${cr.student_lrn}_${effectiveSubjectId}_${cr.quarter}_${cr.school_year}`,
                student_lrn: cr.student_lrn,
                subject_id: effectiveSubjectId,
                subject_name: cr.subject_name || subjectName || '',
                section_id: cr.section_id,
                quarter: cr.quarter as 1|2|3,
                school_year: cr.school_year,
                final_grade: newFinalGrade,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0
            });
        });
    }, [effectiveSubjectId, subjectName, selectedSubjectObj?.subject_name, activeSchoolYear, quarter, selectedSection, selectedSectionObj, sections, sectionStudents, currentWeights, currentCluster, updateHPSRecord, updateClassRecord, isGMRCSubject]);

    const updateGrade = useCallback((lrn: string, type: 'ww' | 'pt' | 'qa', index: number, value: string) => {
        if (!selectedSection || !effectiveSubjectId) return;

        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        if (isSummaryMode) return;

        const activeWwCount = isGMRCSubject ? GMRC_WW_COUNT : WW_COUNT;
        const activePtCount = isGMRCSubject ? GMRC_PT_COUNT : PT_COUNT;

        const stateClassRecords = useAppStore.getState().classRecords;
        const existingRecord = stateClassRecords.find(r =>
            r.student_lrn === lrn &&
            (r.subject_id === effectiveSubjectId || isSameSubject(r.subject_id, r.subject_name, effectiveSubjectId, subjectName)) &&
            Number(r.quarter) === (quarter as number) &&
            (!activeSchoolYear || !r.school_year || r.school_year === activeSchoolYear || r.school_year.includes(activeSchoolYear))
        );

        const record: ClassRecord = existingRecord ? {
            ...existingRecord,
            subject_id: effectiveSubjectId,
            subject_name: subjectName || existingRecord.subject_name
        } : {
            id: `grade_${lrn}_${effectiveSubjectId}_Q${quarter}`,
            student_lrn: lrn,
            section_id: selectedSectionObj?.id || sections.find(s => s.id === selectedSection || s.section_name === selectedSection)?.id || '',
            subject_id: effectiveSubjectId,
            subject_name: subjectName,
            school_year: activeSchoolYear,
            quarter: (typeof quarter === 'number' ? quarter : 1) as 1 | 2 | 3 | 4,
            written_works: Array(activeWwCount).fill(''),
            performance_tasks: Array(activePtCount).fill(''),
            quarterly_exam: '',
            final_grade: '',
            is_teaching_load: true
        };

        const recordWithSummative = record as ClassRecord & { summative_tests?: (number | string)[] };
        const qaScores = normalizeScores(recordWithSummative.summative_tests, ST_COUNT);
        if (!qaScores[2] && recordWithSummative.quarterly_exam !== '') qaScores[2] = recordWithSummative.quarterly_exam;

        const parsedVal: number | string = value === '' ? '' : Number(value);

        // Validation: Do not allow score higher than HPS
        if (typeof parsedVal === 'number') {
            let currentHPS = 0;
            if (type === 'ww') currentHPS = Number(hps.ww[index]);
            else if (type === 'pt') currentHPS = Number(hps.pt[index]);
            else if (type === 'qa') currentHPS = Number(hps.qa[index]);

            if (currentHPS > 0 && parsedVal > currentHPS) {
                showNotification(`Score (${parsedVal}) cannot be higher than the Highest Possible Score (${currentHPS}).`, 'error');
                return;
            }
        }

        if (type === 'qa') {
            qaScores[index] = parsedVal;
            recordWithSummative.summative_tests = qaScores;
            record.quarterly_exam = qaScores[2];
        } else if (type === 'ww') {
            const newWW = normalizeScores(record.written_works, activeWwCount);
            newWW[index] = parsedVal;
            record.written_works = newWW;
        } else if (type === 'pt') {
            const newPT = normalizeScores(record.performance_tasks, activePtCount);
            newPT[index] = parsedVal;
            record.performance_tasks = newPT;
        }

        const normalizedWW = normalizeScores(record.written_works, activeWwCount);
        const normalizedPT = normalizeScores(record.performance_tasks, activePtCount);

        let initialGrade = 0;

        if (isGMRCSubject) {
            const wwCogTotal = normalizedWW.slice(0, 5).reduce<number>((a, b) => a + (b !== '' && !isNaN(Number(b)) ? Number(b) : 0), 0);
            const wwCogHPS = hps.ww.slice(0, 5).reduce<number>((a, b) => a + Number(b), 0);
            const wwCogPS = wwCogHPS === 0 ? 0 : (wwCogTotal / wwCogHPS) * 100;
            const wwCogWS = wwCogPS * 0.10;

            const wwAffTotal = normalizedWW.slice(5, 10).reduce<number>((a, b) => a + (b !== '' && !isNaN(Number(b)) ? Number(b) : 0), 0);
            const wwAffHPS = hps.ww.slice(5, 10).reduce<number>((a, b) => a + Number(b), 0);
            const wwAffPS = wwAffHPS === 0 ? 0 : (wwAffTotal / wwAffHPS) * 100;
            const wwAffWS = wwAffPS * 0.10;

            const ptCogTotal = normalizedPT.slice(0, 3).reduce<number>((a, b) => a + (b !== '' && !isNaN(Number(b)) ? Number(b) : 0), 0);
            const ptCogHPS = hps.pt.slice(0, 3).reduce<number>((a, b) => a + Number(b), 0);
            const ptCogPS = ptCogHPS === 0 ? 0 : (ptCogTotal / ptCogHPS) * 100;
            const ptCogWS = ptCogPS * 0.10;

            const ptAffTotal = normalizedPT.slice(3, 6).reduce<number>((a, b) => a + (b !== '' && !isNaN(Number(b)) ? Number(b) : 0), 0);
            const ptAffHPS = hps.pt.slice(3, 6).reduce<number>((a, b) => a + Number(b), 0);
            const ptAffPS = ptAffHPS === 0 ? 0 : (ptAffTotal / ptAffHPS) * 100;
            const ptAffWS = ptAffPS * 0.10;

            const ptBehTotal = normalizedPT.slice(6, 9).reduce<number>((a, b) => a + (b !== '' && !isNaN(Number(b)) ? Number(b) : 0), 0);
            const ptBehHPS = hps.pt.slice(6, 9).reduce<number>((a, b) => a + Number(b), 0);
            const ptBehPS = ptBehHPS === 0 ? 0 : (ptBehTotal / ptBehHPS) * 100;
            const ptBehWS = ptBehPS * 0.30;

            const st1Score = qaScores[0] === '' || qaScores[0] === null || qaScores[0] === undefined ? null : Number(qaScores[0]);
            const st1HPS = Number(hps.qa[0]) || 0;
            const st2Score = qaScores[1] === '' || qaScores[1] === null || qaScores[1] === undefined ? null : Number(qaScores[1]);
            const st2HPS = Number(hps.qa[1]) || 0;
            const teScore = qaScores[2] === '' || qaScores[2] === null || qaScores[2] === undefined ? null : Number(qaScores[2]);
            const teHPS = Number(hps.qa[2]) || 0;

            const st1WS = (st1HPS > 0 && st1Score !== null && !isNaN(st1Score)) ? (st1Score / st1HPS) * 30 : null;
            const st2WS = (st2HPS > 0 && st2Score !== null && !isNaN(st2Score)) ? (st2Score / st2HPS) * 30 : null;
            const teWS = (teHPS > 0 && teScore !== null && !isNaN(teScore)) ? (teScore / teHPS) * 40 : null;

            const qaPS = (st1WS !== null || st2WS !== null || teWS !== null) ? ((st1WS || 0) + (st2WS || 0) + (teWS || 0)) : 0;
            const qaWS = qaPS * 0.30;

            initialGrade = (wwCogWS || 0) + (wwAffWS || 0) + (ptCogWS || 0) + (ptAffWS || 0) + (ptBehWS || 0) + (qaWS || 0);
        } else {
            const wwTotalScore = normalizedWW.reduce<number>((a, b) => a + (b !== '' && !isNaN(Number(b)) ? Number(b) : 0), 0);
            const wwTotalHPS = hps.ww.reduce<number>((a, b) => a + Number(b), 0);
            const wwPS = wwTotalHPS === 0 ? 0 : Math.min(100, Math.max(0, (wwTotalScore / wwTotalHPS) * 100));
            const wwWS = wwPS * (normalizeWeightFraction(currentWeights.written_works) || 0);

            const ptTotalScore = normalizedPT.reduce<number>((a, b) => a + (b !== '' && !isNaN(Number(b)) ? Number(b) : 0), 0);
            const ptTotalHPS = hps.pt.reduce<number>((a, b) => a + Number(b), 0);
            const ptPS = ptTotalHPS === 0 ? 0 : Math.min(100, Math.max(0, (ptTotalScore / ptTotalHPS) * 100));
            const ptWS = ptPS * (normalizeWeightFraction(currentWeights.performance_tasks) || 0);

            const st1Score = qaScores[0] === '' || qaScores[0] === null || qaScores[0] === undefined ? null : Number(qaScores[0]);
            const st1HPS = Number(hps.qa[0]) || 0;
            const st2Score = qaScores[1] === '' || qaScores[1] === null || qaScores[1] === undefined ? null : Number(qaScores[1]);
            const st2HPS = Number(hps.qa[1]) || 0;
            const teScore = qaScores[2] === '' || qaScores[2] === null || qaScores[2] === undefined ? null : Number(qaScores[2]);
            const teHPS = Number(hps.qa[2]) || 0;

            const qaPS = computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
            const qaWS = qaPS * (normalizeWeightFraction(currentWeights.quarterly_exam) || 0);

            const rawInitial = wwWS + ptWS + qaWS;
            initialGrade = rawInitial > 100 && rawInitial <= 10000 ? Math.min(100, Math.max(0, rawInitial / 100)) : Math.min(100, Math.max(0, rawInitial));
        }

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            normalizedWW.some(isValidScore) ||
            normalizedPT.some(isValidScore) ||
            qaScores.some(isValidScore);

        if (!hasScores) {
            deleteClassRecord(record.id);
            if (existingRecord && existingRecord.id !== record.id) {
                deleteClassRecord(existingRecord.id);
            }
            
            // Clear Sync from Grading Sheet
            const { deleteGradingSheetRecord } = useAppStore.getState();
            deleteGradingSheetRecord(`${record.student_lrn}_${record.subject_id}_${record.quarter}_${record.school_year}`);
            if (existingRecord && existingRecord.subject_id !== record.subject_id) {
                deleteGradingSheetRecord(`${existingRecord.student_lrn}_${existingRecord.subject_id}_${existingRecord.quarter}_${existingRecord.school_year}`);
            }
        } else {
            record.final_grade = transmuteGrade(initialGrade, record.school_year);
            record.subject_id = effectiveSubjectId;
            record.subject_name = subjectName;
            if (existingRecord && existingRecord.id !== record.id) {
                deleteClassRecord(existingRecord.id);
            }
            updateClassRecord(record);
            
            // Live Sync to Grading Sheet (Official Records)
            const { updateGradingSheetRecord } = useAppStore.getState();
            updateGradingSheetRecord({
                id: `${record.student_lrn}_${record.subject_id}_${record.quarter}_${record.school_year}`,
                student_lrn: record.student_lrn,
                subject_id: record.subject_id,
                subject_name: record.subject_name || subjectName || '',
                section_id: record.section_id,
                quarter: record.quarter as 1|2|3,
                school_year: record.school_year,
                final_grade: record.final_grade,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0
            });
        }
    }, [selectedSection, effectiveSubjectId, subjectName, quarter, selectedSectionObj, activeSchoolYear, hps, currentWeights, currentCluster, updateClassRecord, deleteClassRecord, showNotification, sections, isGMRCSubject]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
            let nextRow = rowIndex;
            let nextCol = colIndex;

            if (e.key === 'ArrowUp') nextRow--;
            else if (e.key === 'ArrowDown' || e.key === 'Enter') nextRow++;
            else if (e.key === 'ArrowLeft') nextCol--;
            else if (e.key === 'ArrowRight') nextCol++;
            else return;

            e.preventDefault();
            const nextInput = document.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`) as HTMLInputElement;
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        }
    }, []);

    const handlePrint = () => {
        const originalTitle = document.title;
        const sectionName = selectedSectionObj ? `${selectedSectionObj.section_grade_level}-${selectedSectionObj.section_name}` : '';
        const subjectName = selectedSubjectObj?.subject_name || '';
        document.title = `Class_Record_${sectionName}_${subjectName}_T${quarter}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };

    const handleDownload = async () => {
        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        const elementId = isSummaryMode ? 'printable-summary-record' : 'printable-class-record';
        const el = document.getElementById(elementId);
        if (!el) {
            showNotification('Nothing to download. Please select a section and subject first.', 'error');
            return;
        }

        setIsDownloading(true);
        try {
            const html2canvas = (await import('html2canvas-pro')).default;
            const { jsPDF } = await import('jspdf');

            // Temporarily reset zoom for clean capture
            const zoomShell = el.closest('.eclass-zoom-shell') as HTMLElement | null;
            const prevTransform = zoomShell?.style.transform || '';
            if (zoomShell) zoomShell.style.transform = 'none';

            // Find all page containers inside the printable element (for summary, it's just the element itself)
            const pages = isSummaryMode 
                ? [el] 
                : Array.from(el.querySelectorAll('.class-record-page')) as HTMLElement[];

            if (pages.length === 0) {
                pages.push(el);
            }

            const orientation = isSummaryMode ? 'portrait' : 'landscape';
            const pSize = PAPER_SIZES[paperSize];
            const pdf = new jsPDF({ orientation, unit: 'mm', format: pSize.jspdfFormat as string | [number, number] });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 4;
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) {
                    pdf.addPage(pSize.jspdfFormat as string | [number, number], orientation);
                }

                const pageEl = pages[i];
                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (clonedDoc, clonedPageEl) => {
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = `
                            ::-webkit-scrollbar {
                                display: none !important;
                            }
                            * {
                                scrollbar-width: none !important;
                                -ms-overflow-style: none !important;
                            }
                        `;
                        clonedDoc.head.appendChild(style);

                        // Swap inputs to static spans to capture values
                        const origInputs = pageEl.querySelectorAll('input');
                        const clonedInputs = clonedPageEl.querySelectorAll('input');
                        origInputs.forEach((origInput, idx) => {
                            const clonedInput = clonedInputs[idx];
                            if (clonedInput) {
                                const val = (origInput as HTMLInputElement).value || '';
                                const span = clonedDoc.createElement('span');
                                span.textContent = val;
                                span.className = clonedInput.className;
                                span.style.cssText = clonedInput.style.cssText;
                                span.style.display = 'flex';
                                span.style.alignItems = 'center';
                                span.style.justifyContent = 'center';
                                span.style.width = '100%';
                                span.style.height = '100%';
                                if (clonedInput.parentNode) {
                                    clonedInput.parentNode.replaceChild(span, clonedInput);
                                }
                            }
                        });
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const imgW = canvas.width;
                const imgH = canvas.height;
                const ratio = Math.min(usableW / imgW, usableH / imgH);
                const drawW = imgW * ratio;
                const drawH = imgH * ratio;
                const offsetX = margin + (usableW - drawW) / 2;
                const offsetY = margin;

                pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);
            }

            // Restore zoom
            if (zoomShell) zoomShell.style.transform = prevTransform;

            const sectionName = selectedSectionObj ? `${selectedSectionObj.section_grade_level}-${selectedSectionObj.section_name}` : 'Record';
            const subjName = selectedSubjectObj?.subject_name || '';
            const termLabel = isSummaryMode ? 'Summary' : `T${quarter}`;
            pdf.save(`Class_Record_${sectionName}_${subjName}_${termLabel}.pdf`);

            showNotification('Class record downloaded successfully!', 'success');
        } catch (err) {
            console.error('Download failed:', err);
            showNotification('Failed to download class record. Please try again.', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleExportExcel = async (exportAll: boolean = false, templateOverride?: 'academic' | 'gmrc_ve' | 'epp_tle' | 'epp_tle_components' | 'mapeh') => {
        if (!selectedSectionObj || sectionStudents.length === 0) {
            showNotification('Please select a section with enrolled students first.', 'error');
            return;
        }

        if (!isG2ToG10Section) {
            showNotification('Official 3-Term E-Class Record export is only available for Grades 2 to 10.', 'info');
            return;
        }

        setIsExportingExcel(true);
        setShowExportMenu(false);

        try {
            if (exportAll) {
                // Collect subjects taught in this section
                const sectionSubjects = filterSubjectsForSection(user, selectedSectionObj, subjects);
                
                // Expand composite MAPEH into its official components if needed
                const targetSubjects: Subject[] = [];
                for (const sub of sectionSubjects) {
                    if (sub.subject_name.toUpperCase() === 'MAPEH' && mapehComponents.length > 0) {
                        targetSubjects.push(...mapehComponents);
                    } else {
                        targetSubjects.push(sub);
                    }
                }

                // Deduplicate by normalized name
                const uniqueSubjects = targetSubjects.filter((s, idx, self) => 
                    idx === self.findIndex(t => t.id === s.id || t.subject_name.trim().toLowerCase() === s.subject_name.trim().toLowerCase())
                );

                if (uniqueSubjects.length === 0) {
                    showNotification('No subjects found for this section.', 'error');
                    return;
                }

                const candidateSubjects = [
                    ...(mapehComponents.length > 0 ? mapehComponents : []),
                    ...(sectionSubjects.length > 0 ? sectionSubjects : []),
                    ...subjects
                ];

                const batchOptions = uniqueSubjects.map(sub => ({
                    schoolProfile,
                    schoolYear: activeSchoolYear,
                    section: selectedSectionObj,
                    subject: sub,
                    allSubjects: candidateSubjects,
                    teacherName: teacherName || selectedSectionObj.adviser_name,
                    students,
                    classRecords,
                    hpsRecords
                }));

                const cleanGrade = (selectedSectionObj.section_grade_level || 'Grade').replace(/[^a-zA-Z0-9]/g, '_');
                const cleanSection = (selectedSectionObj.section_name || 'Section').replace(/[^a-zA-Z0-9]/g, '_');
                const cleanSY = (activeSchoolYear || '').replace(/[^a-zA-Z0-9-]/g, '_');
                const zipName = `ECR_BATCH_${cleanGrade}_${cleanSection}_${cleanSY}.zip`;

                await exportECRBatchToZip(batchOptions, zipName);
                showNotification(`Successfully exported ${uniqueSubjects.length} E-Class Record(s) to ${zipName}!`, 'success');
            } else {
                // Export single subject
                let targetSubjectObj = subjects.find(s => s.id === effectiveSubjectId) || selectedSubjectObj;

                const isMapehSelected = selectedSubject === 'virtual_mapeh' ||
                    selectedSubjectObj?.subject_name.toUpperCase() === 'MAPEH' ||
                    isMapehSubject(targetSubjectObj?.subject_name || '');

                // Robust fallback for composite MAPEH
                if (isMapehSelected && (!targetSubjectObj || targetSubjectObj.id === 'virtual_mapeh')) {
                    if (selectedMapehComponentId) {
                        targetSubjectObj = subjects.find(s => s.id === selectedMapehComponentId) || mapehComponents.find(c => c.id === selectedMapehComponentId);
                    }
                    if (!targetSubjectObj && mapehComponents.length > 0) {
                        targetSubjectObj = mapehComponents[0];
                    }
                    if (!targetSubjectObj) {
                        targetSubjectObj = { id: 'virtual_mapeh', subject_name: 'MAPEH' } as Subject;
                    }
                } else if (!targetSubjectObj && selectedSubject) {
                    targetSubjectObj = { id: selectedSubject, subject_name: selectedSubject } as Subject;
                }

                if (!targetSubjectObj) {
                    showNotification('Please select a subject to export.', 'error');
                    return;
                }

                const sectionSubjects = filterSubjectsForSection(user, selectedSectionObj, subjects);
                const candidateSubjects = [
                    ...(mapehComponents.length > 0 ? mapehComponents : []),
                    ...(sectionSubjects.length > 0 ? sectionSubjects : []),
                    ...subjects
                ];

                await exportECRToExcel({
                    schoolProfile,
                    schoolYear: activeSchoolYear,
                    section: selectedSectionObj,
                    subject: targetSubjectObj,
                    allSubjects: candidateSubjects,
                    teacherName: teacherName || selectedSectionObj.adviser_name || schoolProfile?.adviser_name,
                    students,
                    classRecords,
                    hpsRecords,
                    templateOverride
                });

                const exportDesc = templateOverride === 'epp_tle_components'
                    ? 'Official DepEd EPP/TLE Per-Component E-Class Record exported!'
                    : `Official DepEd E-Class Record exported for ${targetSubjectObj.subject_name}!`;
                showNotification(exportDesc, 'success');
            }
        } catch (err) {
            console.error('Failed to export ECR to Excel:', err);
            const msg = err instanceof Error ? err.message : 'Failed to export E-Class Record. Please try again.';
            showNotification(msg, 'error');
        } finally {
            setIsExportingExcel(false);
        }
    };

    const isEppTleAvailable = isEppTleSubject(selectedSubjectObj?.subject_name || '') ||
        isEppTleComponent(selectedSubjectObj?.subject_name || '') ||
        filteredSubjects.some(s => isEppTleSubject(s.subject_name) || isEppTleComponent(s.subject_name));

    const proficiencyData = proficiencyDataCalc;
    
    return (
        <div className="h-full min-h-0 flex flex-col gap-3">
            <style>{`
                @media print {
                    @page {
                        size: ${quarter === 'summary' ? PAPER_SIZES[paperSize].portrait : PAPER_SIZES[paperSize].landscape};
                        margin: ${quarter === 'summary' ? PAPER_SIZES[paperSize].summaryMargins : PAPER_SIZES[paperSize].margins};
                    }
                    body {
                        visibility: hidden;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #printable-class-record, #printable-summary-record {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: 100%;
                        margin: 0;
                        padding: 0 0.06in;
                        overflow: visible !important;
                        box-sizing: border-box;
                    }
                    #printable-class-record * {
                        visibility: visible;
                    }
                    .eclass-zoom-shell {
                        transform: none !important;
                    }
                    .no-print, header, nav, aside {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white dark:bg-[#0d1225] border border-slate-200/60 dark:border-white/10 rounded-xl shadow-xs p-1.5 sm:p-2 no-print">
                <div className="flex flex-col lg:flex-row lg:flex-nowrap lg:items-end gap-1.5 w-full overflow-x-auto custom-scrollbar pb-0.5">
                    <div className="w-full sm:w-36 lg:w-36 shrink-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <label className="block text-[9.5px] font-bold text-deped-blue whitespace-nowrap">Section</label>
                        </div>
                        <select
                            value={selectedSection}
                            onChange={(e) => onSectionChange(e.target.value)}
                            className="form-input h-7.5 py-0.5 px-2 text-[10px] rounded-lg"
                        >
                            <option value="">Select Section</option>
                            {sortedSections.map((s) => (
                                <option key={s.id} value={s.section_name}>{s.section_grade_level} - {s.section_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-40 lg:flex-1 lg:max-w-44 lg:min-w-28 shrink-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <label className="block text-[9.5px] font-bold text-deped-blue whitespace-nowrap truncate" title={`Subject ${sectionGradeLevel ? `(${sectionGradeLevel})` : ''}`}>
                                Subject {sectionGradeLevel && `(${sectionGradeLevel})`}
                            </label>
                        </div>
                        <select
                            value={selectedSubject}
                            onChange={(e) => onSubjectChange(e.target.value)}
                            className="form-input h-7.5 py-0.5 px-2 text-[10px] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
                            disabled={!selectedSection}
                        >
                            <option value="">
                                {selectedSection 
                                    ? (filteredSubjects.length === 0 
                                        ? (selectedSectionObj?.is_advisory && !selectedSectionObj?.is_teaching_load 
                                            ? 'Advisory Class (No Teaching Load configured)' 
                                            : 'No teaching load configured for this section') 
                                        : 'Select Subject') 
                                    : 'Select a section first'}
                            </option>
                            {groupedSubjects ? (
                                Object.entries(groupedSubjects).map(([category, items]) => {
                                    if (items.length === 0) return null;
                                    return (
                                        <optgroup key={category} label={category}>
                                            {items.map((s) => (
                                                <option key={s.id} value={s.id}>{s.subject_name}</option>
                                            ))}
                                        </optgroup>
                                    );
                                })
                            ) : (
                                filteredSubjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.subject_name}</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Sub-Subject Dropdown for MAPEH components */}
                    {isMapehSelected && (typeof quarter !== 'string' || !quarter.startsWith('summary')) && mapehComponents.length > 0 && (
                        <div className="w-full sm:w-30 lg:w-30 shrink-0">
                            <label className="block text-[9.5px] font-bold mb-0.5 text-deped-blue whitespace-nowrap">MAPEH Component</label>
                            <select
                                value={selectedMapehComponentId}
                                onChange={(e) => setSelectedMapehComponentId(e.target.value)}
                                className="form-input border-amber-400 bg-amber-50 h-7.5 py-0.5 px-1.5 text-[10px] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
                            >
                                {mapehComponents.map((c) => (
                                    <option key={c.id} value={c.id}>{c.subject_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="w-full sm:w-20 lg:w-20 shrink-0">
                        <label className="block text-[9.5px] font-bold mb-0.5 text-deped-blue whitespace-nowrap">Term</label>
                        <select 
                            value={quarter} 
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val.startsWith('summary')) {
                                    setQuarter(val as QuarterValue);
                                } else {
                                    setQuarter(Number(val) as QuarterValue);
                                }
                            }} 
                            className="form-input h-7.5 py-0.5 px-1.5 text-[10px] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
                        >
                            <option value={1}>Term 1</option>
                            <option value={2}>Term 2</option>
                            <option value={3}>Term 3</option>
                            {(selectedSubject === 'virtual_mapeh' || subjectName.toUpperCase() === 'MAPEH') ? (
                                <>
                                    <option value="summary_t1">Term 1 Summary</option>
                                    <option value="summary_t2">Term 2 Summary</option>
                                    <option value="summary_t3">Term 3 Summary</option>
                                    <option value="summary_final">Final Summary</option>
                                </>
                            ) : (
                                <option value="summary">Final Summary</option>
                            )}
                        </select>
                    </div>
                    <div className="w-full sm:w-20 lg:w-20 shrink-0">
                        <label className="text-[9.5px] font-bold mb-0.5 text-deped-blue flex items-center gap-1 whitespace-nowrap">
                            <FileText className="w-3 h-3" /> Paper Size
                        </label>
                        <select
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                            className="form-input h-7.5 py-0.5 px-1.5 text-[10px] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
                        >
                            {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                        {/* PACE Form shortcut for Grade 1 */}
                        {isGrade1Section && (
                            <button
                                type="button"
                                onClick={() => setCurrentView('pace')}
                                className="h-7.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-black text-[8.5px] uppercase tracking-wider flex items-center gap-1 shadow-xs active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
                                title="Open official DepEd MATATAG PACE Form for Grade 1"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>PACE Form</span>
                            </button>
                        )}
                        <div className="flex items-center gap-1 h-7.5 px-1 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:bg-white/20 rounded transition-all"
                                title="Zoom Out"
                            >
                                <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[9px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:bg-white/20 rounded transition-all"
                                title="Zoom In"
                            >
                                <Plus className="w-2.5 h-2.5" />
                            </button>
                        </div>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={toggleCrosshair}
                            className={`h-7.5 px-2 rounded-lg border text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0 ${
                                isCrosshairEnabled
                                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700 shadow-blue-500/20'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                            }`}
                            title={isCrosshairEnabled ? "Crosshair Highlighter: Active (Click to disable)" : "Crosshair Highlighter: Disabled (Click to activate)"}
                        >
                            <Crosshair className="w-3 h-3" />
                            <span>Guide</span>
                        </button>
                        {selectedSubject && selectedSubject !== 'virtual_mapeh' && (
                            <button 
                                onClick={() => setIsEnrollmentModalOpen(true)}
                                className="h-7.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-[8.5px] font-black uppercase tracking-wider rounded-lg border border-slate-200 dark:border-white/10 hover:scale-[1.02] transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                title="Manage Enrolled Students"
                            >
                                <Users className="w-3 h-3" />
                                <span>Learners</span>
                            </button>
                        )}
                        <button 
                            onClick={handlePrint} 
                            className="btn-primary flex items-center justify-center gap-1 h-7.5 px-2 text-[8.5px] font-black uppercase tracking-wider rounded-lg whitespace-nowrap cursor-pointer"
                        >
                            <Printer className="w-3 h-3" />
                            <span>Print</span>
                        </button>
                        <button 
                            onClick={handleDownload}
                            disabled={isDownloading || !selectedSubject || sectionStudents.length === 0}
                            className="h-7.5 px-2 bg-sky-600 text-white text-[8.5px] font-black uppercase tracking-wider rounded-lg shadow-xs hover:bg-sky-700 hover:scale-[1.02] transition-all flex items-center gap-1 group disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale whitespace-nowrap cursor-pointer"
                        >
                            {isDownloading ? (
                                <>
                                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    <span>Downloading…</span>
                                </>
                            ) : (
                                <><Download className="w-3 h-3" /> <span>PDF</span></>  
                            )}
                        </button>

                        {/* Official DepEd E-Class Record Excel Exporter (Grades 2-10 only) */}
                        {isG2ToG10Section && (
                            <div className="relative inline-block text-left shrink-0">
                                <div className="inline-flex rounded-lg shadow-xs">
                                    <button
                                        onClick={() => {
                                            if (selectedSubject) {
                                                handleExportExcel(false);
                                            } else if (filteredSubjects.length > 0) {
                                                handleExportExcel(true);
                                            }
                                        }}
                                        disabled={isExportingExcel || sectionStudents.length === 0 || (!selectedSubject && filteredSubjects.length === 0)}
                                        className="h-7.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[8.5px] font-black uppercase tracking-wider rounded-l-lg transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale whitespace-nowrap cursor-pointer"
                                        title={selectedSubject ? "Export Official DepEd E-Class Record (.xlsx)" : "Export All Section Subjects (.zip)"}
                                    >
                                        {isExportingExcel ? (
                                            <>
                                                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                                </svg>
                                                <span>Exporting…</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileSpreadsheet className="w-3 h-3" />
                                                <span>Excel</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowExportMenu(prev => !prev)}
                                        disabled={isExportingExcel || !selectedSection || sectionStudents.length === 0}
                                        className="h-7.5 px-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-r-lg border-l border-emerald-500/40 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale cursor-pointer"
                                        title="More Excel Export Options"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                </div>

                                {showExportMenu && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setShowExportMenu(false)} 
                                        />
                                        <div className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                    Official DepEd 3-Term ECR (Grades 2–10)
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleExportExcel(false)}
                                                disabled={!selectedSubject && filteredSubjects.length === 0}
                                                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                <div>
                                                    <div className="font-bold">Current Subject (.xlsx)</div>
                                                    <div className="text-[10px] text-slate-500 font-normal">All 3 terms for {selectedSubjectObj?.subject_name || 'selected subject'}</div>
                                                </div>
                                            </button>
                                            {isEppTleAvailable && (
                                                <button
                                                    onClick={() => handleExportExcel(false, 'epp_tle_components')}
                                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800/80"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                    <div>
                                                        <div className="font-bold">EPP/TLE - Per Component (.xlsx)</div>
                                                        <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-normal">6 component tabs (ICT, AFA, FCS, IA) + Final Grades</div>
                                                    </div>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleExportExcel(true)}
                                                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-2 transition-colors cursor-pointer"
                                            >
                                                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                <div>
                                                    <div className="font-bold">All Section Subjects (.zip)</div>
                                                    <div className="text-[10px] text-slate-500 font-normal">Export complete ECRs for all subjects</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setShowExportMenu(false);
                                                    try {
                                                        showNotification('Extracting complete DepEd database from local storage...', 'info');
                                                        const res = await exportDirectDatabaseToExcel();
                                                        if (res.totalRecords > 0) {
                                                            showNotification(`Rescued ${res.totalRecords} DepEd records to Master Excel!`, 'success');
                                                        } else {
                                                            showNotification('No records found in local FormEaseDB. Check if entered in another browser.', 'info');
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        showNotification('Failed to export database rescue file.', 'error');
                                                    }
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800/80"
                                            >
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                <div>
                                                    <div className="font-bold">Complete Database Rescue (.xlsx)</div>
                                                    <div className="text-[10px] text-slate-500 font-normal">All ECRs, HPS, SF2, & DepEd tables (bypasses all filters)</div>
                                                </div>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        <button 
                            onClick={async () => {
                                if (!selectedSubjectObj || !sectionStudents.length) return;
                                
                                const isSummary = typeof quarter === 'string' && quarter.startsWith('summary');
                                const isMapeh = (isMapehSelected || subjectName.toUpperCase() === 'MAPEH') && mapehComponents.length > 0;
                                
                                let confirmMsg = '';
                                if (isMapeh) {
                                    if (quarter === 'summary_final') {
                                        confirmMsg = `Publish Final Summary MAPEH and component grades to the official Grade Management?\n\nThis will publish all term grades for Music and Arts, PE and Health, and MAPEH to update SF9/Advisory records for ${selectedSection}.`;
                                    } else if (typeof quarter === 'string' && quarter.startsWith('summary')) {
                                        const targetTerm = quarter === 'summary_t2' ? 2 : quarter === 'summary_t3' ? 3 : 1;
                                        confirmMsg = `Publish Term ${targetTerm} MAPEH and component grades to the official Grade Management?\n\nThis will update Music and Arts, PE and Health, and MAPEH composite records for ${selectedSection}.`;
                                    } else {
                                        confirmMsg = `Publish ${quarter === 1 ? '1st' : quarter === 2 ? '2nd' : '3rd'} Term grades for ${subjectName} to the official Grade Management?\n\nThis will update the SF9/Advisory records for ${selectedSection}.`;
                                    }
                                } else {
                                    if (isSummary) {
                                        confirmMsg = `Publish Final Summary grades for ${selectedSubjectObj.subject_name} to the official Grade Management?\n\nThis will publish all active term grades and update SF9/Advisory records for ${selectedSection}.`;
                                    } else {
                                        confirmMsg = `Publish ${quarter === 1 ? '1st' : quarter === 2 ? '2nd' : '3rd'} Term grades for ${selectedSubjectObj.subject_name} to the official Grade Management?\n\nThis will update the SF9/Advisory records for ${selectedSection}.`;
                                    }
                                }

                                if (!window.confirm(confirmMsg)) return;

                                try {
                                    const { updateGradingSheetRecord: storeUpdateGrading, updateClassRecord: storeUpdateClass } = useAppStore.getState();
                                    let count = 0;

                                    const maSubj = mapehComponents.find(s => isMusicArtsSubject(s.subject_name)) || mapehComponents.find(s => {
                                        const n = s.subject_name.toLowerCase();
                                        return (n.includes('music') && n.includes('arts'));
                                    });
                                    const peSubj = mapehComponents.find(s => isPeHealthSubject(s.subject_name)) || mapehComponents.find(s => {
                                        const n = s.subject_name.toLowerCase();
                                        return ((n.includes('pe') || n.includes('physical')) && n.includes('health'));
                                    });
                                    const mapehSubj = subjects.find(s => (s.id === selectedSubject && s.id !== 'virtual_mapeh') || (s.subject_name.trim().toUpperCase() === 'MAPEH' && (s.section_id === selectedSectionObj?.id || !s.section_id)));
                                    const mapehId = mapehSubj?.id || (selectedSubject !== 'virtual_mapeh' ? selectedSubject : 'virtual_mapeh');
                                    const mapehName = mapehSubj?.subject_name || 'MAPEH';

                                    const syncGradeRecord = async (studentLrn: string, subjId: string, subjName: string, qNum: 1|2|3, gradeVal: number) => {
                                        if (gradeVal <= 0) return;
                                        const recordId = `${studentLrn}_${subjId}_${qNum}_${activeSchoolYear}`;
                                        await storeUpdateGrading({
                                            id: recordId,
                                            student_lrn: studentLrn,
                                            subject_id: subjId,
                                            subject_name: subjName,
                                            section_id: selectedSectionObj?.id || '',
                                            quarter: qNum,
                                            school_year: activeSchoolYear,
                                            final_grade: gradeVal,
                                            written_works: [],
                                            performance_tasks: [],
                                            quarterly_exam: 0
                                        });
                                        count++;

                                        const existingCR = classRecords.find(
                                            cr => cr.student_lrn === studentLrn &&
                                                  (cr.subject_id === subjId || isMatchingSubject(subjName, cr.subject_id, cr.subject_name)) &&
                                                  Number(cr.quarter) === qNum &&
                                                  cr.school_year === activeSchoolYear
                                        );
                                        if (existingCR && existingCR.final_grade !== gradeVal) {
                                            await storeUpdateClass({
                                                ...existingCR,
                                                final_grade: gradeVal
                                            });
                                        }
                                    };

                                    if (isMapeh) {
                                        if (quarter === 'summary_final') {
                                            for (const student of sectionStudents) {
                                                for (const t of [1, 2, 3] as const) {
                                                    const sSummary = getSummaryGrades(student);
                                                    const tVal = t === 1 ? sSummary.t1 : t === 2 ? sSummary.t2 : sSummary.t3;
                                                    if (tVal && typeof tVal === 'number' && tVal > 0) {
                                                        await syncGradeRecord(student.lrn, mapehId, mapehName, t, tVal);
                                                    }
                                                }
                                            }
                                        } else if (typeof quarter === 'string' && quarter.startsWith('summary')) {
                                            const targetTerm = (quarter === 'summary_t2' ? 2 : quarter === 'summary_t3' ? 3 : 1) as 1|2|3;
                                            for (const student of sectionStudents) {
                                                const sSummary = getSummaryGrades(student);
                                                if (sSummary.isMapeh) {
                                                    const maVal = Number(sSummary.ma) || 0;
                                                    const peVal = Number(sSummary.pe) || 0;
                                                    const compVal = Number(sSummary.final) || 0;
                                                    if (maVal > 0 && maSubj) {
                                                        await syncGradeRecord(student.lrn, maSubj.id, maSubj.subject_name, targetTerm, maVal);
                                                    }
                                                    if (peVal > 0 && peSubj) {
                                                        await syncGradeRecord(student.lrn, peSubj.id, peSubj.subject_name, targetTerm, peVal);
                                                    }
                                                    if (compVal > 0) {
                                                        await syncGradeRecord(student.lrn, mapehId, mapehName, targetTerm, compVal);
                                                    }
                                                }
                                            }
                                        } else {
                                            const qNum = quarter as 1|2|3;
                                            for (const student of sectionStudents) {
                                                const summary = getStudentSummary(student);
                                                if (summary.hasScores && summary.quarterlyGrade > 0) {
                                                    await syncGradeRecord(student.lrn, effectiveSubjectId, subjectName, qNum, summary.quarterlyGrade);

                                                    const isCurrentMA = isMusicArtsSubject(subjectName);
                                                    const siblingSubj = isCurrentMA ? peSubj : maSubj;
                                                    if (siblingSubj) {
                                                        const siblingRecord = classRecords.find(
                                                            r => r.student_lrn === student.lrn &&
                                                                 (r.subject_id === siblingSubj.id || isMatchingSubject(siblingSubj.subject_name, r.subject_id, r.subject_name)) &&
                                                                 Number(r.quarter) === qNum &&
                                                                 r.school_year === activeSchoolYear
                                                        );
                                                        const siblingGrade = siblingRecord?.final_grade ? Number(siblingRecord.final_grade) : 0;
                                                        if (siblingGrade > 0) {
                                                            const mapehComposite = Math.round((summary.quarterlyGrade + siblingGrade) / 2);
                                                            await syncGradeRecord(student.lrn, mapehId, mapehName, qNum, mapehComposite);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        if (isSummary) {
                                            for (const student of sectionStudents) {
                                                const sSummary = getSummaryGrades(student);
                                                for (const t of [1, 2, 3] as const) {
                                                    const termGrade = t === 1 ? sSummary.t1 : t === 2 ? sSummary.t2 : sSummary.t3;
                                                    if (termGrade && typeof termGrade === 'number' && termGrade > 0) {
                                                        await syncGradeRecord(student.lrn, selectedSubject, selectedSubjectObj.subject_name, t, termGrade);
                                                    }
                                                }
                                            }
                                        } else {
                                            const qNum = quarter as 1|2|3;
                                            for (const student of sectionStudents) {
                                                const summary = getStudentSummary(student);
                                                if (summary.hasScores && summary.quarterlyGrade > 0) {
                                                    await syncGradeRecord(student.lrn, effectiveSubjectId, selectedSubjectObj.subject_name, qNum, summary.quarterlyGrade);
                                                }
                                            }
                                        }
                                    }

                                    showNotification(`Successfully published ${count} grades to official records!`, 'success');
                                } catch {
                                    showNotification("Failed to publish grades.", "error");
                                }
                            }}
                            disabled={!selectedSubject || sectionStudents.length === 0}
                            className="h-7.5 px-2 bg-emerald-600 text-white text-[8.5px] font-black uppercase tracking-wider rounded-lg shadow-xs hover:bg-emerald-700 hover:scale-[1.02] transition-all flex items-center gap-1 group disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                            title={!selectedSubject ? "Please select a subject first to publish grades" : "Publish grades to Grade Management"}
                        >
                            <CloudUpload className="w-3 h-3" /> <span>Publish</span>
                        </button>

                        {/* Grade Sync Inspector Button */}
                        <button
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('formease-open-grade-debugger', {
                                    detail: {
                                        sectionId: selectedSectionObj?.id || selectedSection,
                                        subjectId: selectedSubject,
                                        quarter: typeof quarter === 'number' ? quarter : 1
                                    }
                                }));
                            }}
                            className="h-7.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 font-black text-[8.5px] uppercase tracking-wider flex items-center gap-1 shadow-xs active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
                            title="Open Grade Sync Inspector & Live Diagnostics"
                        >
                            <Bug className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Inspect</span>
                        </button>

                        {/* Emergency Database Rescue Excel Button */}
                        <button
                            onClick={async () => {
                                try {
                                    showNotification('Extracting complete DepEd database from local storage...', 'info');
                                    const res = await exportDirectDatabaseToExcel();
                                    if (res.totalRecords > 0) {
                                        showNotification(`Rescued ${res.totalRecords} DepEd records to Master Excel!`, 'success');
                                    } else {
                                        showNotification('No records found in local FormEaseDB. Check if entered in another browser.', 'info');
                                    }
                                } catch (err) {
                                    console.error(err);
                                    showNotification('Failed to export database rescue file.', 'error');
                                }
                            }}
                            className="h-7.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-black text-[8.5px] uppercase tracking-wider flex items-center gap-1 shadow-xs active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
                            title="Download Complete Database to Excel (.xlsx) - Bypasses all filters & includes all DepEd records"
                        >
                            <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden xl:inline">Rescue</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0d1225] shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-200/60 dark:border-white/10 flex-1 min-h-0">
                <div className="bg-slate-50/50 dark:bg-[#070a12] p-3 md:p-4 h-full min-h-0 overflow-auto custom-scrollbar">
                    {/* Informative notification for Grade 1 with quick shortcut to PACE Form */}
                    {isGrade1Section && (
                        <div className="max-w-4xl mx-auto mb-3 px-4 py-2 bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl flex items-center justify-between gap-3 text-amber-800 dark:text-amber-200 text-xs shadow-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-base">📋</span>
                                <div>
                                    <span className="font-bold">Grade 1 DepEd Assessment:</span> Numerical E-Class Record is active for scoring and grading. For qualitative MATATAG competency assessment, you can also use the PACE Form.
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCurrentView('pace')}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-xs active:scale-95"
                            >
                                <span>Open PACE Form</span>
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    <div className="w-full min-h-full flex justify-center overflow-x-auto py-2">
                    <div
                        ref={containerRef}
                        className="eclass-zoom-shell origin-top transition-all duration-300 m-auto"
                        style={{ transform: `scale(${zoom})` }}
                    >
                    {isAdvisoryWithoutTeachingLoad ? (
                        <div className="w-full h-full min-h-100 flex items-center justify-center p-4 md:p-8">
                            <div className="max-w-3xl w-full bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] border border-indigo-100/80 dark:border-slate-800 shadow-[0_20px_60px_rgba(79,70,229,0.08)] p-6 md:p-8 text-center relative overflow-hidden animate-fade-in flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                {/* Ambient Soft Gradient Orbs */}
                                <div className="absolute -top-28 -left-28 w-56 h-56 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-28 -right-28 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                                {/* Left/Top Column: Floating 3D Icon Stack */}
                                <div className="shrink-0 flex justify-center mx-auto md:mx-0">
                                    <div className="w-28 h-28 md:w-36 md:h-36 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_15px_35px_rgba(79,70,229,0.08)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] flex items-center justify-center relative border border-slate-100 dark:border-slate-700/60 transition-transform duration-500 hover:scale-105">
                                        <Users className="w-14 h-14 md:w-18 md:h-18 text-indigo-400 dark:text-indigo-400 stroke-[1.5]" />
                                        
                                        {/* Overlapping Badge */}
                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-linear-to-br from-indigo-600 to-blue-600 text-white font-black text-xs md:text-sm tracking-wider flex items-center justify-center shadow-lg shadow-indigo-600/30 absolute -bottom-3 -right-3 border-2 border-white dark:border-slate-900">
                                            ADV
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Information & Action Buttons */}
                                <div className="flex-1 space-y-3.5 text-center md:text-left flex flex-col items-center md:items-start justify-center">
                                    {/* Status Pill Header */}
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-[10.5px] font-black uppercase tracking-widest shadow-xs">
                                        <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                        <span>CLASS ADVISER WORKSPACE</span>
                                    </div>

                                    {/* Title & Section Details */}
                                    <div className="space-y-1 w-full">
                                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                                            {sectionGradeLevel} - {selectedSection}
                                        </h2>
                                        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                            You are viewing this class as <span className="font-bold text-indigo-600 dark:text-indigo-400">Class Adviser</span>. There is currently no personal teaching load assigned to you for this section in E-Class Record.
                                        </p>
                                    </div>

                                    {/* Workflow Guidance Card */}
                                    <div className="p-3.5 bg-white dark:bg-slate-800/70 rounded-2xl border border-indigo-100/60 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 text-left w-full shadow-xs">
                                        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>How Grade Management Works</span>
                                        </div>
                                        <p className="leading-relaxed text-[10.5px]">
                                            Subject teachers record grades in their respective E-Class Records and submit them to your master sheet. In <strong>Grade Management</strong>, you can review consolidated quarterly grades, monitor ranking, compute general averages, and generate official SF9 (Report Cards) & SF10.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-3 pt-1 w-full justify-center md:justify-start">
                                        <button
                                            onClick={() => {
                                                if (selectedSection) setSelectedSection(selectedSection);
                                                setCurrentView('consolidated-grades');
                                            }}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-95 text-white text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/40 cursor-pointer"
                                        >
                                            <span>GO TO GRADE MANAGEMENT</span>
                                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                        </button>

                                        <button
                                            onClick={() => setCurrentView('sections')}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:scale-95 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                                        >
                                            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                                            <span>CONFIGURE TEACHING LOAD</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : typeof quarter === 'string' && quarter.startsWith('summary') ? (
                        <div id="printable-summary-record" className="bg-white text-black px-8 py-10 mx-auto print:p-0 font-sans shadow-[0_0_50px_rgba(0,0,0,0.05)] print:shadow-none border border-gray-100 print:border-none transition-all duration-300 max-w-full" style={{ width: PAPER_SIZES[paperSize].previewWidthPortrait }}>
                            {/* Header Section matching image */}
                             <div className="flex justify-between items-start mb-6 text-black">
                                 <div className="w-14 h-14 shrink-0">
                                     <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                 </div>
                                 <div className="text-center flex-1 px-4 text-black">
                                     <h1 className="text-2xl font-bold uppercase tracking-wide text-black mb-0">
                                         {quarter === 'summary_final' ? 'SUMMARY OF GRADES' : 
                                          quarter === 'summary_t1' ? 'SUMMARY OF TERM 1 GRADES' : 
                                          quarter === 'summary_t2' ? 'SUMMARY OF TERM 2 GRADES' :
                                          quarter === 'summary_t3' ? 'SUMMARY OF TERM 3 GRADES' :
                                          'SUMMARY OF GRADES'}
                                     </h1>
                                     
                                     <div className="mt-4 grid gap-x-4 text-[10px] text-left text-black" style={{ gridTemplateColumns: '55% 45%' }}>
                                         <div className="space-y-1 text-black">
                                             <div className="flex items-center min-h-6.5 text-black">
                                                 <span className="w-20 font-bold uppercase shrink-0 text-black">REGION</span>
                                                 <div className={`border border-black bg-white text-black px-2 py-0.5 flex-1 min-h-5 font-semibold text-center uppercase flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.region, "text-[10px]")}`}>{schoolProfile.region}</div>
                                             </div>
                                             <div className="flex items-center min-h-6.5 text-black">
                                                 <span className="w-20 font-bold uppercase shrink-0 text-black">SCHOOL NAME</span>
                                                 <div className={`border border-black bg-white text-black px-2 py-0.5 flex-1 min-h-5 font-semibold text-center uppercase flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.name, "text-[10px]")}`}>{schoolProfile.name}</div>
                                             </div>
                                         </div>
                                         <div className="space-y-1 text-black">
                                             <div className="flex items-center min-h-6.5 text-black">
                                                 <span className="w-20 font-bold uppercase shrink-0 text-black">DIVISION</span>
                                                 <div className={`border border-black bg-white text-black px-2 py-0.5 flex-1 min-h-5 font-semibold text-center uppercase flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.division, "text-[10px]")}`}>{schoolProfile.division}</div>
                                             </div>
                                             <div className="flex items-center min-h-6.5 text-black">
                                                 <span className="w-20 font-bold uppercase shrink-0 text-black">SCHOOL ID</span>
                                                 <div className={`border border-black bg-white text-black px-2 py-0.5 flex-1 min-h-5 font-semibold text-center uppercase flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.school_id, "text-[10px]")}`}>{schoolProfile.school_id}</div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="w-24 h-14 shrink-0">
                                     <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                 </div>
                             </div>

                            {(() => {
                                const isMapeh = subjectName.toUpperCase() === 'MAPEH';
                                const summaryNonNameCols = isMapeh ? (quarter === 'summary_final' ? 5 : 4) : 6;
                                const colSpanMeta1 = Math.ceil(summaryNonNameCols / 2);
                                const colSpanMeta2 = summaryNonNameCols - colSpanMeta1;
                                const totalSummaryCols = 2 + summaryNonNameCols;

                                return (
                                    <table className="w-full table-fixed border-collapse border border-black text-[11px] font-sans bg-white">
                                        <thead className="print:table-header-group bg-white text-black font-bold uppercase">
                                            <tr>
                                                <th rowSpan={3} className="border border-black w-8"></th>
                                                <th rowSpan={3} className="border border-black p-2 align-middle w-62.5 text-center tracking-wider">LEARNERS' NAMES</th>
                                                <th colSpan={colSpanMeta1} className="border border-black text-left p-1 text-[10px] overflow-hidden">
                                                    <div className="flex items-center overflow-hidden min-w-0 h-full">
                                                        <span className="font-bold mr-2 whitespace-nowrap shrink-0">GRADE & SECTION:</span>
                                                        <span className="flex-1 text-center font-normal uppercase truncate min-w-0" title={`${sectionGradeLevel} - ${selectedSection}`}>{sectionGradeLevel} - {selectedSection}</span>
                                                    </div>
                                                </th>
                                                <th colSpan={colSpanMeta2} className="border border-black text-left p-1 text-[10px] overflow-hidden">
                                                    <div className="flex items-center overflow-hidden min-w-0 h-full">
                                                        <span className="font-bold mr-2 whitespace-nowrap shrink-0">SCHOOL YEAR:</span>
                                                        <span className="flex-1 text-center font-normal uppercase truncate min-w-0" title={activeSchoolYear}>{activeSchoolYear}</span>
                                                    </div>
                                                </th>
                                            </tr>
                                            <tr>
                                                <th colSpan={colSpanMeta1} className="border border-black text-left p-1 text-[10px] overflow-hidden">
                                                    <div className="flex items-center overflow-hidden min-w-0 h-full">
                                                        <span className="font-bold mr-2 whitespace-nowrap shrink-0">TEACHER:</span>
                                                        <span className="flex-1 text-center font-normal uppercase truncate min-w-0" title={teacherName}>{teacherName}</span>
                                                    </div>
                                                </th>
                                                <th colSpan={colSpanMeta2} className="border border-black text-left p-1 text-[10px] overflow-hidden">
                                                    <div className="flex items-center overflow-hidden min-w-0 h-full">
                                                        <span className="font-bold mr-2 whitespace-nowrap shrink-0">SUBJECT:</span>
                                                        <span className="flex-1 text-center font-normal uppercase truncate min-w-0" title={subjectName}>{subjectName}</span>
                                                    </div>
                                                </th>
                                            </tr>
                                            <tr className="text-center text-[10px] font-bold bg-white h-10">
                                                {isMapeh ? (
                                                    quarter === 'summary_final' ? (
                                                        <>
                                                            <th className="border border-black p-1 w-25">TERM 1<br/>MAPEH</th>
                                                            <th className="border border-black p-1 w-25">TERM 2<br/>MAPEH</th>
                                                            <th className="border border-black p-1 w-25">TERM 3<br/>MAPEH</th>
                                                            <th className="border border-black p-1 w-25">FINAL GRADE</th>
                                                            <th className="border border-black p-1 w-25">DESCRIPTOR</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="border border-black p-1 w-30">MUSIC & ARTS<br/>({quarter === 'summary_t2' ? 'TERM 2' : quarter === 'summary_t3' ? 'TERM 3' : 'TERM 1'})</th>
                                                            <th className="border border-black p-1 w-30">PE & HEALTH<br/>({quarter === 'summary_t2' ? 'TERM 2' : quarter === 'summary_t3' ? 'TERM 3' : 'TERM 1'})</th>
                                                            <th className="border border-black p-1 w-30">MAPEH<br/>({quarter === 'summary_t2' ? 'TERM 2' : quarter === 'summary_t3' ? 'TERM 3' : 'TERM 1'} GRADE)</th>
                                                            <th className="border border-black p-1 w-30">DESCRIPTOR</th>
                                                        </>
                                                    )
                                                ) : (
                                                    <>
                                                        <th className="border border-black p-1 w-17.5">TERM 1</th>
                                                        <th className="border border-black p-1 w-17.5">TERM 2</th>
                                                        <th className="border border-black p-1 w-17.5">TERM 3</th>
                                                        <th className="border border-black p-1 w-20">FINAL GRADE</th>
                                                        <th className="border border-black p-1 w-25">DESCRIPTOR</th>
                                                        <th className="border border-black p-1 w-20">REMARK</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-gray-200 font-bold">
                                                <td colSpan={totalSummaryCols} className="border border-black text-left px-2 py-0.5 text-[10px] tracking-widest uppercase">MALE</td>
                                            </tr>
                                            {maleStudents.map((student, i) => {
                                                const summary = getSummaryGrades(student);
                                                return (
                                                    <tr key={student.lrn} className="h-7 hover:bg-gray-50 transition-colors">
                                                        <td className="border border-black text-center font-bold text-[10px]">{i + 1}</td>
                                                        <td className="border border-black text-left px-2 uppercase text-[10px] font-bold truncate max-w-62.5">
                                                            {formatStudentFullName(student)}
                                                        </td>
                                                        {summary.isMapeh ? (
                                                            summary.mapehMode === 'final' ? (
                                                                <>
                                                                    <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t1, sectionGradeLevel)}</td>
                                                                    <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t2, sectionGradeLevel)}</td>
                                                                    <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t3, sectionGradeLevel)}</td>
                                                                    <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                                    <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.ma, sectionGradeLevel)}</td>
                                                                    <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.pe, sectionGradeLevel)}</td>
                                                                    <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                                    <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                                </>
                                                            )
                                                        ) : (
                                                            <>
                                                                <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t1, sectionGradeLevel)}</td>
                                                                <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t2, sectionGradeLevel)}</td>
                                                                <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t3, sectionGradeLevel)}</td>
                                                                <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                                <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                                <td className={`border border-black text-center font-bold text-[9px] ${summary.final !== '' && Number(summary.final) >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                                                                    {summary.final !== '' ? (Number(summary.final) >= 75 ? 'PASSED' : 'FAILED') : ''}
                                                                </td>
                              </>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                            <tr className="bg-gray-200 font-bold">
                                                <td colSpan={totalSummaryCols} className="border border-black text-left px-2 py-0.5 text-[10px] tracking-widest uppercase">FEMALE</td>
                                            </tr>
                                    {femaleStudents.map((student, i) => {
                                        const summary = getSummaryGrades(student);
                                        return (
                                            <tr key={student.lrn} className="h-7 hover:bg-gray-50 transition-colors">
                                                <td className="border border-black text-center font-bold text-[10px]">{i + 1}</td>
                                                <td className="border border-black text-left px-2 uppercase text-[10px] font-bold truncate max-w-62.5">
                                                    {formatStudentFullName(student)}
                                                </td>
                                                {summary.isMapeh ? (
                                                    summary.mapehMode === 'final' ? (
                                                        <>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t1, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t2, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t3, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.ma, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.pe, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                        </>
                                                    )
                                                ) : (
                                                    <>
                                                        <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t1, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t2, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t3, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                        <td className={`border border-black text-center font-bold text-[9px] ${summary.final !== '' && Number(summary.final) >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                                                            {summary.final !== '' ? (Number(summary.final) >= 75 ? 'PASSED' : 'FAILED') : ''}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                                );
                            })()}
                        </div>
                    ) : (
                    <div className="bg-slate-50/50 dark:bg-[#070a12] p-3 md:p-4 overflow-x-auto">
                        <div id="printable-class-record" className="bg-white text-black p-4 md:p-6 shadow-xl border border-gray-100 mx-auto transition-all duration-300" style={{ width: isGMRCSubject ? `${optimalNameColumnWidth + 1330}px` : PAPER_SIZES[paperSize].previewWidthLandscape, minWidth: isGMRCSubject ? `${optimalNameColumnWidth + 1280}px` : undefined }}>
                            {[
                                { gender: 'MALE' as const, students: maleStudents },
                                { gender: 'FEMALE' as const, students: femaleStudents }
                            ].map((section, sectionIdx) => (
                            <div key={section.gender} className={`class-record-page bg-white text-black p-4 print:p-0 ${sectionIdx === 0 ? 'print:break-after-page' : 'print:mt-6'}`}>
                            <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2 px-4 print:px-1 text-black">
                                <div className="w-16 h-16 flex items-center justify-center shrink-0">
                                    <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="text-center flex-1 mx-4 text-black">
                                    <h1 className="text-2xl font-bold font-serif tracking-wide text-black mb-0 uppercase">Class Record</h1>
                                    <p className="text-[12px] italic text-red-600 font-serif mb-2">(Pursuant to DepEd Order 15 series of 2026)</p>
                                    <div className="grid gap-x-4 gap-y-3 text-[10px] font-bold uppercase mb-6 justify-center w-full px-2 text-black" style={{ gridTemplateColumns: '42% 33% 25%' }}>
                                        {/* Row 1, Col 1: Region */}
                                        <div className="flex items-center min-h-6.5 text-black">
                                            <span className="text-black font-bold mr-2 whitespace-nowrap shrink-0">REGION</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-25 text-center bg-white text-black flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.region, "text-[10px]")}`}>
                                                {schoolProfile.region}
                                            </div>
                                        </div>
                                        {/* Row 1, Col 2: Division */}
                                        <div className="flex items-center min-h-6.5 text-black">
                                            <span className="text-black font-bold mr-2 whitespace-nowrap shrink-0">DIVISION</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-30 text-center bg-white text-black flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.division, "text-[10px]")}`}>
                                                {schoolProfile.division}
                                            </div>
                                        </div>
                                        {/* Row 1, Col 3: District */}
                                        <div className="flex items-center min-h-6.5 text-black">
                                            <span className="text-black font-bold mr-2 whitespace-nowrap shrink-0">DISTRICT</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-30 text-center bg-white text-black flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.district || '', "text-[10px]")}`}>
                                                {schoolProfile.district || ''}
                                            </div>
                                        </div>

                                        {/* Row 2, Col 1: School Name */}
                                        <div className="flex items-center min-h-6.5 text-black">
                                            <span className="text-black font-bold mr-2 whitespace-nowrap shrink-0">SCHOOL NAME</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-35 text-center bg-white text-black flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.name, "text-[10px]")}`}>
                                                {schoolProfile.name}
                                            </div>
                                        </div>
                                        {/* Row 2, Col 2: School ID */}
                                        <div className="flex items-center min-h-6.5 text-black">
                                            <span className="text-black font-bold mr-2 whitespace-nowrap shrink-0">SCHOOL ID</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-20 text-center bg-white text-black flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.school_id, "text-[10px]")}`}>
                                                {schoolProfile.school_id}
                                            </div>
                                        </div>
                                        {/* Row 2, Col 3: School Year */}
                                        <div className="flex items-center min-h-6.5 text-black">
                                            <span className="text-black font-bold mr-2 whitespace-nowrap shrink-0">SCHOOL YEAR</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-20 text-center bg-white text-black flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(activeSchoolYear, "text-[10px]")}`}>
                                                {activeSchoolYear}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="w-28 h-16 flex items-center justify-center shrink-0">
                                    <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-auto object-contain" />
                                </div>
                            </div>

                            <div className="flex border-2 border-black mb-px text-[10px] leading-none bg-white">
                                <div className="h-9 px-3 border-r-2 border-black font-bold bg-yellow-100 flex items-center justify-center text-center shrink-0 min-w-28 text-[10.5px] uppercase tracking-wide">
                                    {(typeof quarter === 'string' && quarter.startsWith('summary')) ? 'SUMMARY OF GRADES' : getTermUpperLabel(Number(quarter))}
                                </div>
                                <div className="h-9 px-3 border-r-2 border-black flex items-center justify-center min-w-0 overflow-hidden flex-1 text-[10.5px]">
                                    <span className="font-bold mr-1.5 shrink-0">GRADE & SECTION:</span>
                                    <span className="uppercase font-semibold truncate min-w-0" title={`${sectionGradeLevel} - ${selectedSectionObj?.section_name || selectedSection}`}>{sectionGradeLevel} - {selectedSectionObj?.section_name || selectedSection}</span>
                                </div>
                                <div className="h-9 px-3 border-r-2 border-black flex items-center justify-center min-w-0 overflow-hidden flex-[1.4] text-[10.5px]">
                                    <span className="font-bold mr-1.5 shrink-0">TEACHER:</span>
                                    <span className="uppercase font-semibold ml-1 truncate min-w-0" title={teacherName || selectedSectionObj?.adviser_name || ''}>{teacherName || selectedSectionObj?.adviser_name || ''}</span>
                                </div>
                                <div className="h-9 px-3 flex items-center justify-center min-w-0 overflow-hidden flex-1 text-[10.5px]">
                                    <span className="font-bold mr-1.5 shrink-0">SUBJECT:</span>
                                    <span className="uppercase font-semibold ml-1 truncate min-w-0" title={isGMRCSubject ? normalizeSubjectForECR(subjectName || selectedSectionObj?.subject_name || '', undefined, sectionGradeLevel) : (subjectName || selectedSectionObj?.subject_name || '')}>
                                        {isGMRCSubject ? normalizeSubjectForECR(subjectName || selectedSectionObj?.subject_name || '', undefined, sectionGradeLevel) : (subjectName || selectedSectionObj?.subject_name || '')}
                                    </span>
                                </div>
                            </div>

                            {isTermExamHpsMissing && (
                                <div className="print:hidden mb-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 rounded-lg flex items-center gap-2.5 text-[11px] text-amber-800 dark:text-amber-200">
                                    <span className="text-base">⚠️</span>
                                    <div>
                                        <strong className="font-bold">Term Exam HPS Missing:</strong> Summative Test 1 or 2 has a Highest Possible Score, but the Term Exam (TE) HPS is blank. In official DepEd E-Class Records, Term Exam accounts for 40% of the exam weight (12% of final grade). Please provide the HPS for the Term Exam to ensure accurate transmuted final grades.
                                    </div>
                                </div>
                            )}

                            <table className="crosshair-table w-full table-fixed border-collapse border-2 border-black text-[10px] text-center">
                                {isGMRCSubject ? (
                                    <thead>
                                        <tr className="h-10">
                                            <th rowSpan={3} className="border border-black p-1 align-middle text-[9px] tracking-wide bg-gray-200" data-col-key="learner-name" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>LEARNERS' NAMES</th>
                                            <th colSpan={16} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8.5px] bg-gray-200" style={{ letterSpacing: '0.02em' }}>WRITTEN / ORAL WORKS (WWs) - 20%</th>
                                            <th colSpan={18} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8.5px] leading-tight bg-gray-200" style={{ letterSpacing: '0.02em' }}>
                                                PRODUCT / PERFORMANCE TASKS (PTs) - 50%
                                            </th>
                                            <th colSpan={8} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8.5px] leading-tight bg-gray-200" style={{ letterSpacing: '0.02em' }}>
                                                EXAMINATIONS (EXs) - 30%
                                            </th>
                                            <th rowSpan={4} className="border border-black w-14 min-w-14 max-w-14 p-1 align-middle bg-yellow-50 font-bold leading-none text-[8px]" data-col-key="initial-grade">INITIAL GRADE</th>
                                            <th rowSpan={4} className="border border-black w-16 min-w-16 max-w-16 p-1 align-middle bg-green-100 font-bold leading-none text-[8px] whitespace-normal wrap-break-word" data-col-key="term-grade">TERM GRADE</th>
                                            <th rowSpan={4} className="border border-black w-20 min-w-20 max-w-20 p-1 align-middle bg-blue-100 font-bold leading-none text-[8px] whitespace-normal wrap-break-word" data-col-key="descriptor">DESCRIPTOR</th>
                                        </tr>
                                        <tr className="h-6">
                                            <th colSpan={8} className="border border-black text-[7.5px] font-bold bg-gray-100">COGNITIVE DOMAIN</th>
                                            <th colSpan={8} className="border border-black text-[7.5px] font-bold bg-gray-100">AFFECTIVE DOMAIN</th>
                                            <th colSpan={6} className="border border-black text-[7.5px] font-bold bg-gray-100">COGNITIVE DOMAIN</th>
                                            <th colSpan={6} className="border border-black text-[7.5px] font-bold bg-gray-100">AFFECTIVE DOMAIN</th>
                                            <th colSpan={6} className="border border-black text-[7.5px] font-bold bg-gray-100">BEHAVIORAL DOMAIN</th>
                                            <th colSpan={8} className="border border-black text-[7.5px] font-bold bg-gray-100">SUMMATIVE AND TERM EXAMS</th>
                                        </tr>
                                        <tr className="h-7 text-[8px]">
                                            {[1, 2, 3, 4, 5].map(i => <th key={`ww-cog-${i}`} className="border border-black w-6 min-w-6 text-[8px] font-bold bg-gray-100" data-col-key={`ww-cog-${i - 1}`}>{i}</th>)}
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="ww-cog-total">Total</th>
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="ww-cog-ps">PS</th>
                                            <th className="border border-black w-9 min-w-9 bg-gray-200 text-[7px] leading-none" data-col-key="ww-cog-ws">WS<br/><span className="text-[6px] font-normal">(10%)</span></th>
                                            {[1, 2, 3, 4, 5].map(i => <th key={`ww-aff-${i}`} className="border border-black w-6 min-w-6 text-[8px] font-bold bg-gray-100" data-col-key={`ww-aff-${i - 1}`}>{i}</th>)}
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="ww-aff-total">Total</th>
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="ww-aff-ps">PS</th>
                                            <th className="border border-black w-9 min-w-9 bg-gray-200 text-[7px] leading-none" data-col-key="ww-aff-ws">WS<br/><span className="text-[6px] font-normal">(10%)</span></th>

                                            {[1, 2, 3].map(i => <th key={`pt-cog-${i}`} className="border border-black w-6 min-w-6 text-[8px] font-bold bg-gray-100" data-col-key={`pt-cog-${i - 1}`}>{i}</th>)}
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="pt-cog-total">Total</th>
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="pt-cog-ps">PS</th>
                                            <th className="border border-black w-9 min-w-9 bg-gray-200 text-[7px] leading-none" data-col-key="pt-cog-ws">WS<br/><span className="text-[6px] font-normal">(10%)</span></th>
                                            {[1, 2, 3].map(i => <th key={`pt-aff-${i}`} className="border border-black w-6 min-w-6 text-[8px] font-bold bg-gray-100" data-col-key={`pt-aff-${i - 1}`}>{i}</th>)}
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="pt-aff-total">Total</th>
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="pt-aff-ps">PS</th>
                                            <th className="border border-black w-9 min-w-9 bg-gray-200 text-[7px] leading-none" data-col-key="pt-aff-ws">WS<br/><span className="text-[6px] font-normal">(10%)</span></th>
                                            {[1, 2, 3].map(i => <th key={`pt-beh-${i}`} className="border border-black w-6 min-w-6 text-[8px] font-bold bg-gray-100" data-col-key={`pt-beh-${i - 1}`}>{i}</th>)}
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="pt-beh-total">Total</th>
                                            <th className="border border-black w-8 min-w-8 bg-gray-200 text-[7.5px]" data-col-key="pt-beh-ps">PS</th>
                                            <th className="border border-black w-9 min-w-9 bg-gray-200 text-[7px] leading-none" data-col-key="pt-beh-ws">WS<br/><span className="text-[6px] font-normal">(30%)</span></th>

                                            <th className="border border-black w-7 min-w-7 text-[8px] font-bold bg-gray-100" data-col-key="qa-0">ST1</th>
                                            <th className="border border-black w-7 min-w-7 text-[8px] font-bold bg-gray-100" data-col-key="qa-1">ST2</th>
                                            <th className="border border-black w-7 min-w-7 text-[8px] font-bold bg-gray-100" data-col-key="qa-2">TE</th>
                                            <th className="border border-black w-9 min-w-9 text-[7px] font-bold leading-none bg-yellow-100/70" data-col-key="st1-ws">WS ST1<br/><span className="text-[6px] font-normal">(30%)</span></th>
                                            <th className="border border-black w-9 min-w-9 text-[7px] font-bold leading-none bg-yellow-100/70" data-col-key="st2-ws">WS ST2<br/><span className="text-[6px] font-normal">(30%)</span></th>
                                            <th className="border border-black w-9 min-w-9 text-[7px] font-bold leading-none bg-yellow-100/70" data-col-key="te-ws">WS TE<br/><span className="text-[6px] font-normal">(40%)</span></th>
                                            <th className="border border-black w-9 min-w-9 bg-gray-200 text-[7px] font-bold leading-none" data-col-key="qa-ps">PS<br/><span className="text-[6px] font-normal">(100)</span></th>
                                            <th className="border border-black w-9 min-w-9 bg-gray-200 text-[7px] font-bold leading-none" data-col-key="qa-ws">WS<br/><span className="text-[6px] font-normal">(30%)</span></th>
                                        </tr>
                                        <tr className="font-bold h-8 text-[8px]">
                                            <td className="border border-black p-1 text-left whitespace-nowrap tracking-wide text-[7px] bg-gray-100" data-col-key="learner-name" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>HIGHEST POSSIBLE SCORE</td>
                                            {hps.ww.slice(0, 5).map((val, i) => (
                                                <td key={`hps-ww-cog-${i}`} className="border border-black p-0 bg-white" data-col-key={`ww-cog-${i}`}>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={val === '' ? '' : val}
                                                        onChange={(v) => updateHPS('ww', i, v)}
                                                        onKeyDown={(e) => handleKeyDown(e, 0, i)}
                                                        data-row={0}
                                                        data-col={i}
                                                        className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-blue-100/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="ww-cog-total">{hps.ww.slice(0, 5).some(v => v !== '') ? hps.ww.slice(0, 5).reduce((a, b) => a + Number(b), 0) : ''}</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="ww-cog-ps">100.00</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="ww-cog-ws">10%</td>

                                            {hps.ww.slice(5, 10).map((val, i) => (
                                                <td key={`hps-ww-aff-${i}`} className="border border-black p-0 bg-white" data-col-key={`ww-aff-${i}`}>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={val === '' ? '' : val}
                                                        onChange={(v) => updateHPS('ww', 5 + i, v)}
                                                        onKeyDown={(e) => handleKeyDown(e, 0, 5 + i)}
                                                        data-row={0}
                                                        data-col={5 + i}
                                                        className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-blue-100/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="ww-aff-total">{hps.ww.slice(5, 10).some(v => v !== '') ? hps.ww.slice(5, 10).reduce((a, b) => a + Number(b), 0) : ''}</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="ww-aff-ps">100.00</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="ww-aff-ws">10%</td>

                                            {hps.pt.slice(0, 3).map((val, i) => (
                                                <td key={`hps-pt-cog-${i}`} className="border border-black p-0 bg-white" data-col-key={`pt-cog-${i}`}>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={val === '' ? '' : val}
                                                        onChange={(v) => updateHPS('pt', i, v)}
                                                        onKeyDown={(e) => handleKeyDown(e, 0, 10 + i)}
                                                        data-row={0}
                                                        data-col={10 + i}
                                                        className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-green-100/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="pt-cog-total">{hps.pt.slice(0, 3).some(v => v !== '') ? hps.pt.slice(0, 3).reduce((a, b) => a + Number(b), 0) : ''}</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="pt-cog-ps">100.00</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="pt-cog-ws">10%</td>

                                            {hps.pt.slice(3, 6).map((val, i) => (
                                                <td key={`hps-pt-aff-${i}`} className="border border-black p-0 bg-white" data-col-key={`pt-aff-${i}`}>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={val === '' ? '' : val}
                                                        onChange={(v) => updateHPS('pt', 3 + i, v)}
                                                        onKeyDown={(e) => handleKeyDown(e, 0, 13 + i)}
                                                        data-row={0}
                                                        data-col={13 + i}
                                                        className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-green-100/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="pt-aff-total">{hps.pt.slice(3, 6).some(v => v !== '') ? hps.pt.slice(3, 6).reduce((a, b) => a + Number(b), 0) : ''}</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="pt-aff-ps">100.00</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="pt-aff-ws">10%</td>

                                            {hps.pt.slice(6, 9).map((val, i) => (
                                                <td key={`hps-pt-beh-${i}`} className="border border-black p-0 bg-white" data-col-key={`pt-beh-${i}`}>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={val === '' ? '' : val}
                                                        onChange={(v) => updateHPS('pt', 6 + i, v)}
                                                        onKeyDown={(e) => handleKeyDown(e, 0, 16 + i)}
                                                        data-row={0}
                                                        data-col={16 + i}
                                                        className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-green-100/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="pt-beh-total">{hps.pt.slice(6, 9).some(v => v !== '') ? hps.pt.slice(6, 9).reduce((a, b) => a + Number(b), 0) : ''}</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="pt-beh-ps">100.00</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="pt-beh-ws">30%</td>

                                            {hps.qa.map((val, i) => (
                                                <td key={`hps-qa-${i}`} className="border border-black p-0 bg-white" data-col-key={`qa-${i}`}>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={val === '' ? '' : val}
                                                        onChange={(v) => updateHPS('qa', i, v)}
                                                        onKeyDown={(e) => handleKeyDown(e, 0, 19 + i)}
                                                        data-row={0}
                                                        data-col={19 + i}
                                                        className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-yellow-100/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black bg-yellow-100/70 text-[7.5px]" data-col-key="st1-ws">30</td>
                                            <td className="border border-black bg-yellow-100/70 text-[7.5px]" data-col-key="st2-ws">30</td>
                                            <td className="border border-black bg-yellow-100/70 text-[7.5px]" data-col-key="te-ws">40</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="qa-ps">100.00</td>
                                            <td className="border border-black bg-gray-100 text-[7.5px]" data-col-key="qa-ws">30%</td>
                                        </tr>
                                    </thead>
                                ) : (
                                    <thead>
                                        <tr className="h-11">
                                            <th rowSpan={2} className="border border-black p-1 align-middle text-[9px] tracking-wide bg-gray-200" data-col-key="learner-name" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>LEARNERS' NAMES</th>
                                            <th colSpan={8} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8px] bg-gray-200" style={{ letterSpacing: '0.02em' }}>WRITTEN / ORAL WORKS ({normalizeWeightPercent(currentWeights.written_works)}%)</th>
                                            <th colSpan={6} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8px] leading-tight bg-gray-200" style={{ letterSpacing: '0.02em' }}>
                                                <span>PRODUCT / PERFORMANCE</span><br />
                                                <span>TASKS ({normalizeWeightPercent(currentWeights.performance_tasks)}%)</span>
                                            </th>
                                            <th colSpan={8} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8px] leading-tight bg-gray-200" style={{ letterSpacing: '0.02em' }}>
                                                <span>SUMMATIVE TESTS AND TERM</span><br />
                                                <span>EXAMINATIONS ({normalizeWeightPercent(currentWeights.quarterly_exam)}%)</span>
                                            </th>
                                            <th rowSpan={3} className="border border-black w-16 min-w-16 max-w-16 p-1 align-middle bg-yellow-50 font-bold leading-none text-[9px]" data-col-key="initial-grade">INITIAL GRADE</th>
                                            <th rowSpan={3} className="border border-black w-20 min-w-20 max-w-20 p-1 align-middle bg-green-100 font-bold leading-none text-[8px] whitespace-normal wrap-break-word" data-col-key="term-grade">TERM GRADE</th>
                                            <th rowSpan={3} className="border border-black w-24 min-w-24 max-w-24 p-1 align-middle bg-blue-100 font-bold leading-none text-[8px] whitespace-normal wrap-break-word" data-col-key="descriptor">DESCRIPTOR</th>
                                        </tr>
                                        <tr className="h-8">
                                            {[1, 2, 3, 4, 5].map(i => <th key={`ww-${i}`} className="border border-black w-6 text-[9px] font-bold bg-gray-100" data-col-key={`ww-${i - 1}`}>{i}</th>)}
                                            <th className="border border-black w-10 bg-gray-200" data-col-key="ww-total">Total</th>
                                            <th className="border border-black w-14 bg-gray-200" data-col-key="ww-ps">PS</th>
                                            <th className="border border-black w-12 bg-gray-200" data-col-key="ww-ws">WS</th>
                                            {[1, 2, 3].map(i => <th key={`pt-${i}`} className="border border-black w-6 text-[9px] font-bold bg-gray-100" data-col-key={`pt-${i - 1}`}>{i}</th>)}
                                            <th className="border border-black w-10 bg-gray-200" data-col-key="pt-total">Total</th>
                                            <th className="border border-black w-14 bg-gray-200" data-col-key="pt-ps">PS</th>
                                            <th className="border border-black w-12 bg-gray-200" data-col-key="pt-ws">WS</th>
                                            <th className="border border-black w-8 text-[9px] font-bold bg-gray-100" data-col-key="qa-0">ST1</th>
                                            <th className="border border-black w-8 text-[9px] font-bold bg-gray-100" data-col-key="qa-1">ST2</th>
                                            <th className="border border-black w-8 text-[9px] font-bold bg-gray-100" data-col-key="qa-2">TE</th>
                                            <th className="border border-black w-12 text-[7.5px] font-bold leading-none bg-yellow-100/70" data-col-key="st1-ws">WS ST1<br/><span className="text-[6.5px] font-normal">(30%)</span></th>
                                            <th className="border border-black w-12 text-[7.5px] font-bold leading-none bg-yellow-100/70" data-col-key="st2-ws">WS ST2<br/><span className="text-[6.5px] font-normal">(30%)</span></th>
                                            <th className="border border-black w-12 text-[7.5px] font-bold leading-none bg-yellow-100/70" data-col-key="te-ws">WS TE<br/><span className="text-[6.5px] font-normal">(40%)</span></th>
                                            <th className="border border-black w-14 bg-gray-200 text-[8px] font-bold leading-none" data-col-key="qa-ps">PS<br/><span className="text-[6.5px] font-normal">(ST & TE)</span></th>
                                            <th className="border border-black w-12 bg-gray-200 text-[8px] font-bold leading-none" data-col-key="qa-ws">WS<br/><span className="text-[6.5px] font-normal">(ST & TE)</span></th>
                                        </tr>
                                        <tr className="font-bold h-9">
                                            <td className="border border-black p-1 text-left whitespace-nowrap tracking-wide text-[7px] bg-gray-100" data-col-key="learner-name" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>HIGHEST POSSIBLE SCORE</td>
                                            {hps.ww.map((val, i) => (
                                                <td key={`hps-ww-${i}`} className="border border-black p-0 bg-white" data-col-key={`ww-${i}`}>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={val === '' ? '' : val}
                                                        onChange={(v) => updateHPS('ww', i, v)}
                                                        onKeyDown={(e) => handleKeyDown(e, 0, i)}
                                                        data-row={0}
                                                        data-col={i}
                                                        className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-blue-100/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black bg-gray-100 text-[8px]" data-col-key="ww-total">{hps.ww.some(v => v !== '') ? hps.ww.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                            <td className="border border-black bg-gray-100 text-[8px]" data-col-key="ww-ps">100.00</td>
                                            <td className="border border-black bg-gray-100 text-[8px]" data-col-key="ww-ws">{normalizeWeightPercent(currentWeights.written_works)}%</td>
                                            {hps.pt.map((val, i) => (
                                                <td key={`hps-pt-${i}`} className="border border-black p-0 bg-white" data-col-key={`pt-${i}`}>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={val === '' ? '' : val}
                                                        onChange={(v) => updateHPS('pt', i, v)}
                                                        onKeyDown={(e) => handleKeyDown(e, 0, 5 + i)}
                                                        data-row={0}
                                                        data-col={5 + i}
                                                        className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-green-100/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black bg-gray-100 text-[8px]" data-col-key="pt-total">{hps.pt.some(v => v !== '') ? hps.pt.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                            <td className="border border-black bg-gray-100 text-[8px]" data-col-key="pt-ps">100.00</td>
                                            <td className="border border-black bg-gray-100 text-[8px]" data-col-key="pt-ws">{normalizeWeightPercent(currentWeights.performance_tasks)}%</td>
                                            {hps.qa.map((val, i) => (
                                                <td key={`hps-qa-${i}`} className="border border-black p-0 bg-white" data-col-key={`qa-${i}`}>
                                                    <DebouncedInput
                                                        type="number"
                                                        value={val === '' ? '' : val}
                                                        onChange={(v) => updateHPS('qa', i, v)}
                                                        onKeyDown={(e) => handleKeyDown(e, 0, 8 + i)}
                                                        data-row={0}
                                                        data-col={8 + i}
                                                        className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-yellow-100/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black bg-yellow-100/70 text-[8px]" data-col-key="st1-ws">30</td>
                                            <td className="border border-black bg-yellow-100/70 text-[8px]" data-col-key="st2-ws">30</td>
                                            <td className="border border-black bg-yellow-100/70 text-[8px]" data-col-key="te-ws">40</td>
                                            <td className="border border-black bg-gray-100 text-[8px]" data-col-key="qa-ps">100.00</td>
                                            <td className="border border-black bg-gray-100 text-[8px]" data-col-key="qa-ws">{normalizeWeightPercent(currentWeights.quarterly_exam)}%</td>
                                        </tr>
                                    </thead>
                                )}
                                <tbody>
                                    <tr className="bg-gray-100 font-bold">
                                        <td colSpan={isGMRCSubject ? 46 : 26} className="border border-black text-left px-2 py-1">{section.gender}</td>
                                    </tr>
                                    {section.students.map((student, idx) => {
                                        const record = studentRecordMap.get(student.lrn);
                                        return (
                                            <StudentGradeRow
                                                key={student.lrn}
                                                student={student}
                                                idx={idx}
                                                sectionIdx={sectionIdx}
                                                maleStudentsCount={maleStudents.length}
                                                hps={hps}
                                                currentWeights={currentWeights}
                                                currentCluster={currentCluster}
                                                activeSchoolYear={activeSchoolYear}
                                                sectionGradeLevel={sectionGradeLevel}
                                                optimalNameColumnWidth={optimalNameColumnWidth}
                                                record={record}
                                                updateGrade={updateGrade}
                                                handleKeyDown={handleKeyDown}
                                                formatStudentFullName={formatStudentFullName}
                                                isGMRCSubject={isGMRCSubject}
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                            ))}

                            {/* Page 3: Analytics Dashboard */}
                            <div className="class-record-page bg-white p-6 print:p-0 print:break-before-page mt-8">
                                {/* Header Section */}
                                <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2 px-4 print:px-1">
                                    <div className="w-16 h-16 flex items-center justify-center shrink-0">
                                        <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="text-center flex-1 mx-4">
                                        <h1 className="text-2xl font-bold font-serif tracking-wide text-black mb-2 uppercase">
                                            TERM SUMMARY OF LEARNERS' GRADES & ANALYTICS
                                        </h1>
                                        <div className="grid gap-x-4 gap-y-3 text-[10px] font-bold uppercase mb-2 justify-center w-full px-2" style={{ gridTemplateColumns: '42% 33% 25%' }}>
                                            {/* Row 1, Col 1: Region */}
                                            <div className="flex items-center min-h-6.5">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">REGION</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-25 text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.region, "text-[10px]")}`}>
                                                    {schoolProfile.region}
                                                </div>
                                            </div>
                                            {/* Row 1, Col 2: Division */}
                                            <div className="flex items-center min-h-6.5">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">DIVISION</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-30 text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.division, "text-[10px]")}`}>
                                                    {schoolProfile.division}
                                                </div>
                                            </div>
                                            {/* Row 1, Col 3: District */}
                                            <div className="flex items-center min-h-6.5">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">DISTRICT</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-30 text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.district || '', "text-[10px]")}`}>
                                                    {schoolProfile.district || ''}
                                                </div>
                                            </div>

                                            {/* Row 2, Col 1: School Name */}
                                            <div className="flex items-center min-h-6.5">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">SCHOOL NAME</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-35 text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.name, "text-[10px]")}`}>
                                                    {schoolProfile.name}
                                                </div>
                                            </div>
                                            {/* Row 2, Col 2: School ID */}
                                            <div className="flex items-center min-h-6.5">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">SCHOOL ID</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-20 text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.school_id, "text-[10px]")}`}>
                                                    {schoolProfile.school_id}
                                                </div>
                                            </div>
                                            {/* Row 2, Col 3: School Year */}
                                            <div className="flex items-center min-h-6.5">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">SCHOOL YEAR</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-20 text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(activeSchoolYear, "text-[10px]")}`}>
                                                    {activeSchoolYear}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-28 h-16 flex items-center justify-center shrink-0">
                                        <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-auto object-contain" />
                                    </div>
                                </div>

                                {/* Main Dashboard Grid (3 columns) */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {/* Column 1: Learning Progress and Achievement & Statistics */}
                                    <div className="space-y-3">
                                        <div className="border border-black rounded overflow-hidden">
                                            <div className="bg-slate-100 p-1.5 font-bold text-[9px] border-b border-black text-center uppercase tracking-wider">Learning Progress and Achievement</div>
                                            <table className="w-full text-center text-[8px] leading-tight">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-black text-[8px] font-bold">
                                                        <th className="p-1 border-r border-black w-28 uppercase text-left pl-2">Descriptors</th>
                                                        <th className="p-1 border-r border-black w-14 uppercase">Remarks</th>
                                                        <th className="p-1 border-r border-black w-10 uppercase">Male</th>
                                                        <th className="p-1 border-r border-black w-10 uppercase">Female</th>
                                                        <th className="p-1 w-10 uppercase">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { desc: 'Advancing (90-100)', remark: 'Passed', dataKey: 'advancing' },
                                                        { desc: 'Benchmarking (80-89)', remark: 'Passed', dataKey: 'benchmarking' },
                                                        { desc: 'Connecting (75-79)', remark: 'Passed', dataKey: 'connecting' },
                                                        { desc: 'Developing (65-74)', remark: 'Failed', dataKey: 'developing' },
                                                        { desc: 'Emerging (0-64)', remark: 'Failed', dataKey: 'emerging' }
                                                    ].map((level, idx) => {
                                                        const m = proficiencyData[level.dataKey]?.male || 0;
                                                        const f = proficiencyData[level.dataKey]?.female || 0;
                                                        return (
                                                            <tr key={idx} className="border-b border-gray-200">
                                                                <td className="p-1 border-r border-black text-left pl-2 font-medium">{level.desc}</td>
                                                                <td className={`p-1 border-r border-black font-bold ${level.remark === 'Failed' ? 'text-red-600' : 'text-green-700'}`}>{level.remark}</td>
                                                                <td className="p-1 border-r border-black">{m}</td>
                                                                <td className="p-1 border-r border-black">{f}</td>
                                                                <td className="p-1 font-bold">{m + f}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr className="bg-gray-100 font-bold border-t border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2" colSpan={2}>TOTAL</td>
                                                        <td className="p-1 border-r border-black">{maleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length}</td>
                                                        <td className="p-1 border-r border-black">{femaleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length}</td>
                                                        <td className="p-1 font-bold">{maleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length + femaleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="border border-black rounded overflow-hidden">
                                            <div className="bg-slate-100 p-1.5 font-bold text-[9px] border-b border-black text-center uppercase tracking-wider">Statistics Summary</div>
                                            <table className="w-full text-center text-[8px] leading-tight">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-black font-bold">
                                                        <th className="p-1 border-r border-black text-left pl-2">Metric</th>
                                                        <th className="p-1 border-r border-black w-14">Male</th>
                                                        <th className="p-1 border-r border-black w-14">Female</th>
                                                        <th className="p-1 w-14">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { label: 'Mean Score (MPS)', key: 'mps' },
                                                        { label: 'Highest Score', key: 'high' },
                                                        { label: 'Lowest Score', key: 'low' },
                                                    ].map((stat, idx) => {
                                                        const getStats = (studentsList: typeof maleStudents) => {
                                                            const grades = studentsList.map(s => getStudentSummary(s).quarterlyGrade).filter(g => g > 0);
                                                            if (grades.length === 0) return 0;
                                                            if (stat.key === 'mps') return (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
                                                            if (stat.key === 'high') return Math.max(...grades);
                                                            if (stat.key === 'low') return Math.min(...grades);
                                                            return 0;
                                                        };
                                                        return (
                                                            <tr key={idx} className="border-b border-gray-200">
                                                                <td className="p-1 border-r border-black text-left pl-2 font-semibold">{stat.label}</td>
                                                                <td className="p-1 border-r border-black">{getStats(maleStudents)}</td>
                                                                <td className="p-1 border-r border-black">{getStats(femaleStudents)}</td>
                                                                <td className="p-1 font-bold">{getStats([...maleStudents, ...femaleStudents])}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Column 2: Recharts Visualizations */}
                                    <div className="space-y-3">
                                        <div className="border border-black rounded p-2 bg-white flex flex-col items-center justify-center">
                                            <h4 className="text-[9px] font-bold text-gray-700 mb-1">Proficiency Level Distribution</h4>
                                            <div className="w-full h-27.5">
                                                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
                                                    <BarChart data={[
                                                        { name: 'Advancing', count: proficiencyData.advancing?.total || 0 },
                                                        { name: 'Benchmarking', count: proficiencyData.benchmarking?.total || 0 },
                                                        { name: 'Connecting', count: proficiencyData.connecting?.total || 0 },
                                                        { name: 'Developing', count: proficiencyData.developing?.total || 0 },
                                                        { name: 'Emerging', count: proficiencyData.emerging?.total || 0 },
                                                    ]} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                                        <XAxis dataKey="name" tick={{ fontSize: 7 }} />
                                                        <YAxis tick={{ fontSize: 7 }} />
                                                        <Tooltip />
                                                        <Bar dataKey="count" fill="#8884d8">
                                                            {[
                                                                { name: 'Advancing', color: '#10B981' },
                                                                { name: 'Benchmarking', color: '#34D399' },
                                                                { name: 'Connecting', color: '#60A5FA' },
                                                                { name: 'Developing', color: '#FBBF24' },
                                                                { name: 'Emerging', color: '#EF4444' }
                                                            ].map((entry, index) => {
                                                                const colorMap: Record<string, string> = {
                                                                    'Advancing': '#10B981',
                                                                    'Benchmarking': '#34D399',
                                                                    'Connecting': '#60A5FA',
                                                                    'Developing': '#FBBF24',
                                                                    'Emerging': '#EF4444'
                                                                };
                                                                return <Cell key={`cell-${index}`} fill={colorMap[entry.name] || '#999'} />;
                                                            })}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="border border-black rounded p-2 bg-white flex flex-col items-center justify-center">
                                            <h4 className="text-[9px] font-bold text-gray-700 mb-1">MPS by Gender</h4>
                                            <div className="w-full h-17.5">
                                                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
                                                    <BarChart layout="vertical" data={[
                                                        { name: 'Male', mps: Number(mpsData.maleMps.toFixed(2)) },
                                                        { name: 'Female', mps: Number(mpsData.femaleMps.toFixed(2)) },
                                                    ]} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                                        <XAxis type="number" domain={[0, 100]} hide />
                                                        <YAxis dataKey="name" type="category" width={40} tick={{ fontSize: 8 }} />
                                                        <Tooltip />
                                                        <Bar dataKey="mps" fill="#3B82F6" barSize={12} label={{ position: 'right', fill: '#444', fontSize: 8 }}>
                                                            <Cell fill="#60A5FA" />
                                                            <Cell fill="#F472B6" />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Test / Exam Result Analysis */}
                                    <div className="border border-black overflow-hidden rounded bg-white">
                                        <div className="bg-slate-800 text-white p-1.5 font-bold text-[9px] border-b border-black text-center uppercase tracking-wider">
                                            Test / Exam Result Analysis
                                        </div>
                                        <div className="p-2 space-y-2 text-[8px] leading-tight">
                                            <table className="w-full text-center border-collapse border border-black">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-black font-bold">
                                                        <th className="p-1 border-r border-black text-left pl-2">Metric</th>
                                                        <th className="p-1 border-r border-black w-8">ST1</th>
                                                        <th className="p-1 border-r border-black w-8">ST2</th>
                                                        <th className="p-1 w-8">TE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2">Examinees</td>
                                                        <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st1.count}</td>
                                                        <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st2.count}</td>
                                                        <td className="p-1 font-bold">{summativeAnalysis.te.count}</td>
                                                    </tr>
                                                    <tr className="bg-slate-50 border-b border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2">HPS</td>
                                                        <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st1.hps}</td>
                                                        <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st2.hps}</td>
                                                        <td className="p-1 font-bold">{summativeAnalysis.te.hps}</td>
                                                    </tr>
                                                    <tr className="border-b border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2">Passed (≥75%)</td>
                                                        <td className="p-1 border-r border-black">{summativeAnalysis.st1.criterion.above75} ({summativeAnalysis.st1.criterion.above75Pct.toFixed(0)}%)</td>
                                                        <td className="p-1 border-r border-black">{summativeAnalysis.st2.criterion.above75} ({summativeAnalysis.st2.criterion.above75Pct.toFixed(0)}%)</td>
                                                        <td className="p-1">{summativeAnalysis.te.criterion.above75} ({summativeAnalysis.te.criterion.above75Pct.toFixed(0)}%)</td>
                                                    </tr>
                                                    <tr className="bg-slate-50 border-b border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2">Failed (&lt;75%)</td>
                                                        <td className="p-1 border-r border-black">{summativeAnalysis.st1.criterion.below75} ({summativeAnalysis.st1.criterion.below75Pct.toFixed(0)}%)</td>
                                                        <td className="p-1 border-r border-black">{summativeAnalysis.st2.criterion.below75} ({summativeAnalysis.st2.criterion.below75Pct.toFixed(0)}%)</td>
                                                        <td className="p-1">{summativeAnalysis.te.criterion.below75} ({summativeAnalysis.te.criterion.below75Pct.toFixed(0)}%)</td>
                                                    </tr>
                                                    {[
                                                        { label: 'Mean', key: 'mean' },
                                                        { label: 'Median', key: 'median' },
                                                        { label: 'SD', key: 'sd' },
                                                        { label: 'MPS/PL', key: 'mps' }
                                                    ].map((item, idx) => (
                                                        <tr key={idx} className={`border-b border-black ${idx % 2 === 0 ? '' : 'bg-slate-50'}`}>
                                                            <td className="p-1 border-r border-black text-left pl-2">{item.label}</td>
                                                            <td className="p-1 border-r border-black">{item.key === 'mps' ? summativeAnalysis.st1.norm.mps.toFixed(1) + '%' : (summativeAnalysis.st1.norm as Record<string, number>)[item.key].toFixed(1)}</td>
                                                            <td className="p-1 border-r border-black">{item.key === 'mps' ? summativeAnalysis.st2.norm.mps.toFixed(1) + '%' : (summativeAnalysis.st2.norm as Record<string, number>)[item.key].toFixed(1)}</td>
                                                            <td className="p-1">{item.key === 'mps' ? summativeAnalysis.te.norm.mps.toFixed(1) + '%' : (summativeAnalysis.te.norm as Record<string, number>)[item.key].toFixed(1)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: At-Risk & Top Performers side by side */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border border-red-200 rounded overflow-hidden bg-white">
                                        <div className="bg-red-50 p-1.5 font-bold text-[9px] border-b border-red-200 text-red-700 uppercase flex items-center gap-2">
                                            <span>🚨 Learners At Risk (Below 75)</span>
                                        </div>
                                        <table className="w-full text-center text-[8px] leading-tight">
                                            <thead className="bg-red-50">
                                                <tr className="text-red-800 font-bold border-b border-red-100">
                                                    <th className="p-1 text-left pl-2 w-2/3">Name</th>
                                                    <th className="p-1 w-16">Grade</th>
                                                    <th className="p-1 w-16">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...maleStudents, ...femaleStudents]
                                                    .map(s => ({ ...s, grade: getStudentSummary(s).quarterlyGrade }))
                                                    .filter(s => s.grade > 0 && s.grade < 75)
                                                    .sort((a, b) => a.grade - b.grade)
                                                    .slice(0, 5)
                                                    .map((s, idx) => (
                                                        <tr key={s.lrn} className="border-b border-red-50 hover:bg-red-50 transition-colors">
                                                            <td className="p-1 text-left pl-2 truncate font-medium text-gray-700">{idx + 1}. {s.last_name}, {s.first_name}</td>
                                                            <td className="p-1 font-bold text-red-600">{s.grade}</td>
                                                            <td className="p-1 text-red-600 font-bold uppercase tracking-wider">Failed</td>
                                                        </tr>
                                                    ))}
                                                {[...maleStudents, ...femaleStudents].filter(s => getStudentSummary(s).quarterlyGrade > 0 && getStudentSummary(s).quarterlyGrade < 75).length === 0 && (
                                                    <tr><td colSpan={3} className="p-3 text-gray-400 italic text-center">No learners at risk. Great job! 🎉</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="border border-green-200 rounded overflow-hidden bg-white">
                                        <div className="bg-green-50 p-1.5 font-bold text-[9px] border-b border-green-200 text-green-700 uppercase flex items-center gap-2">
                                            <span>🏆 Top Performers (Grade ≥ 90)</span>
                                        </div>
                                        <table className="w-full text-center text-[8px] leading-tight">
                                            <thead className="bg-green-50">
                                                <tr className="text-green-800 font-bold border-b border-green-100">
                                                    <th className="p-1 text-left pl-2 w-2/3">Name</th>
                                                    <th className="p-1 w-16">Grade</th>
                                                    <th className="p-1 w-16">Rank</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...maleStudents, ...femaleStudents]
                                                    .map(s => ({ ...s, grade: getStudentSummary(s).quarterlyGrade }))
                                                    .filter(s => s.grade >= 90)
                                                    .sort((a, b) => b.grade - a.grade)
                                                    .slice(0, 5)
                                                    .map((s, idx) => (
                                                        <tr key={s.lrn} className="border-b border-green-50 hover:bg-green-50 transition-colors">
                                                            <td className="p-1 text-left pl-2 truncate font-medium text-gray-700">{idx + 1}. {s.last_name}, {s.first_name}</td>
                                                            <td className="p-1 font-bold text-green-700">{s.grade}</td>
                                                            <td className="p-1"><span className="px-1 py-0.5 bg-green-100 text-green-800 font-bold rounded">#{idx + 1}</span></td>
                                                        </tr>
                                                    ))}
                                                {[...maleStudents, ...femaleStudents].filter(s => getStudentSummary(s).quarterlyGrade >= 90).length === 0 && (
                                                    <tr><td colSpan={3} className="p-3 text-gray-400 italic text-center">No outstanding learners yet.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                        </div>
                        </div>
                    </div>
                    )}
                    </div>
                    </div>
                </div>
            </div>
            <SubjectEnrollmentModal
                open={isEnrollmentModalOpen}
                subject={subjects.find(s => s.id === (selectedSubject === 'virtual_mapeh' ? selectedMapehComponentId || mapehComponents[0]?.id : selectedSubject)) || null}
                onClose={() => setIsEnrollmentModalOpen(false)}
            />
        </div>
    );
}
