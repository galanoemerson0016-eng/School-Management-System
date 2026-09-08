/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Printer, CloudUpload, Plus, Minus, Download, FileText, Users, FileSpreadsheet, Bug } from 'lucide-react';
import type { ClassRecord, HPSRecord, Subject } from '../types';
import { getTermUpperLabel } from '../lib/terms';
import { SubjectEnrollmentModal } from '../components/sections/SubjectEnrollmentModal';
import { exportSSHSEClassRecord, resolveSSHSMetadata, SSHS_GRADE11_CATALOG } from '../services/sshs-excel-export';
import { exportSHSG12EClassRecord, resolveSHSG12Terms } from '../services/shs-g12-excel-export';
import { exportDirectDatabaseToExcel } from '../services/database-rescue-export';
import { isGrade11CoreSubject, SSHS_ELECTIVE_CATALOG } from '../lib/curriculum';
import { isMatchingSubject } from '../utils/grading-helpers';

import { getSubjectCluster, getWeights, transmuteGrade, getGradeDescriptorWithFilipino, formatGradeForDisplay, computeExamsWeightedScore } from '../lib/grading';
import { filterSectionsForUser, filterSubjectsForSection } from '../lib/rbac';

const SSHS_WW_COUNT = 10;
const SSHS_PT_COUNT = 10;
const G12_WW_COUNT = 10;
const G12_PT_COUNT = 10;
const WW_COUNT = 5;
const PT_COUNT = 3;
const ST_COUNT = 3;

type PaperSize = 'folio' | 'a4' | 'letter';

const PAPER_SIZES: Record<PaperSize, { label: string; landscape: string; portrait: string; margins: string; summaryMargins: string; jspdfFormat: string | [number, number]; previewWidthLandscape: string; previewWidthPortrait: string }> = {
    folio: {
        label: 'Folio',
        landscape: '13in 8.5in',
        portrait: '8.5in 13in',
        margins: '0.12in 0.18in',
        summaryMargins: '0.5in 0.25in',
        jspdfFormat: 'legal',
        previewWidthLandscape: '1380px',
        previewWidthPortrait: '816px',
    },
    a4: {
        label: 'A4',
        landscape: '297mm 210mm',
        portrait: '210mm 297mm',
        margins: '0.1in 0.15in',
        summaryMargins: '0.4in 0.2in',
        jspdfFormat: 'a4',
        previewWidthLandscape: '1340px',
        previewWidthPortrait: '794px',
    },
    letter: {
        label: 'Letter',
        landscape: '11in 8.5in',
        portrait: '8.5in 11in',
        margins: '0.1in 0.15in',
        summaryMargins: '0.4in 0.2in',
        jspdfFormat: 'letter',
        previewWidthLandscape: '1300px',
        previewWidthPortrait: '816px',
    },
};

const normalizeScores = (scores: (number | string)[] | undefined, count: number): (number | string)[] => {
    const src = Array.isArray(scores) ? scores : [];
    return Array.from({ length: count }, (_, i) => src[i] ?? '');
};

const getDynamicFontSizeClass = (text: string, baseClass: string = "text-[11px]") => {
    if (!text) return baseClass;
    if (text.length > 30) return "text-[8px] leading-none";
    if (text.length > 20) return "text-[9px] leading-tight";
    return baseClass;
};

const getSubjectCategory = (subjectName: string, gradeLevel: string): string => {
    const norm = subjectName.trim().toLowerCase();
    const isG12 = gradeLevel.includes('12');

    if (isG12) {
        const normalized = norm.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        
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
            return normalized === cNorm || normalized.includes(cNorm) || cNorm.includes(normalized);
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
            return normalized === aNorm || normalized.includes(aNorm) || aNorm.includes(normalized);
        })) {
            return 'Applied';
        }

        // 3. Specialized Subjects
        return 'Specialized';
    }

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
    student: any;
    idx: number;
    sectionIdx: number;
    maleStudentsCount: number;
    hps: { ww: any[]; pt: any[]; qa: any[] };
    currentWeights: any;
    currentCluster: any;
    activeSchoolYear: string;
    sectionGradeLevel: string;
    optimalNameColumnWidth: number;
    record: any;
    updateGrade: (lrn: string, type: 'ww' | 'pt' | 'qa', index: number, value: string) => void;
    handleKeyDown: (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => void;
    formatStudentFullName: (student: any) => string;
    activeWwCount: number;
    activePtCount: number;
    isZeroExam: boolean;
    isSSHS: boolean;
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
    activeWwCount,
    activePtCount,
    isZeroExam,
    isSSHS,
}: StudentGradeRowProps) => {
    const summary = useMemo(() => {
        const sGrades: Pick<ClassRecord, 'written_works' | 'performance_tasks' | 'quarterly_exam'> = record || {
            written_works: Array(activeWwCount).fill(''),
            performance_tasks: Array(activePtCount).fill(''),
            quarterly_exam: ''
        };

        const rawQaRec = (record as any)?.summative_tests;
        const qaScores = normalizeScores(rawQaRec, 3).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });

        if (qaScores[2] === '' && sGrades.quarterly_exam !== '' && sGrades.quarterly_exam !== 0 && sGrades.quarterly_exam !== '0') {
            qaScores[2] = Number(sGrades.quarterly_exam);
        }

        const wwScores = normalizeScores(sGrades.written_works, activeWwCount).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });

        // For Grade 12: relocate Summative Test 1 and 2 to Written Works 6 and 7 if empty
        if (!isSSHS) {
            if ((wwScores[5] === '' || wwScores[5] === undefined) && qaScores[0] !== '') {
                wwScores[5] = qaScores[0];
            }
            if ((wwScores[6] === '' || wwScores[6] === undefined) && qaScores[1] !== '') {
                wwScores[6] = qaScores[1];
            }
        }

        const ptScores = normalizeScores(sGrades.performance_tasks, activePtCount).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });

        const effectiveHpsWw = [...hps.ww];
        if (!isSSHS) {
            if ((effectiveHpsWw[5] === '' || effectiveHpsWw[5] === undefined || effectiveHpsWw[5] === 0) && Number(hps.qa[0]) > 0) {
                effectiveHpsWw[5] = hps.qa[0];
            }
            if ((effectiveHpsWw[6] === '' || effectiveHpsWw[6] === undefined || effectiveHpsWw[6] === 0) && Number(hps.qa[1]) > 0) {
                effectiveHpsWw[6] = hps.qa[1];
            }
        }

        const wwTotalScore = wwScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const wwTotalHPS = effectiveHpsWw.reduce<number>((a, b) => a + Number(b), 0);
        const wwPS = wwTotalHPS === 0 ? 0 : Math.round((wwTotalScore / wwTotalHPS) * 100 * 100) / 100;
        const wwWS = Math.round(wwPS * (currentWeights.written_works || 0) * 100) / 100;

        const ptTotalScore = ptScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const ptTotalHPS = hps.pt.reduce<number>((a, b) => a + Number(b), 0);
        const ptPS = ptTotalHPS === 0 ? 0 : Math.round((ptTotalScore / ptTotalHPS) * 100 * 100) / 100;
        const ptWS = Math.round(ptPS * (currentWeights.performance_tasks || 0) * 100) / 100;

        const st1Score = typeof qaScores[0] === 'number' ? qaScores[0] : (qaScores[0] === '' || qaScores[0] === null || qaScores[0] === undefined ? null : Number(qaScores[0]));
        const st1HPS = Number(hps.qa[0]) || 0;
        const st2Score = typeof qaScores[1] === 'number' ? qaScores[1] : (qaScores[1] === '' || qaScores[1] === null || qaScores[1] === undefined ? null : Number(qaScores[1]));
        const st2HPS = Number(hps.qa[1]) || 0;
        const teScore = typeof qaScores[2] === 'number' ? qaScores[2] : (qaScores[2] === '' || qaScores[2] === null || qaScores[2] === undefined ? null : Number(qaScores[2]));
        const teHPS = Number(hps.qa[2]) || 0;

        const st1WS = (st1HPS > 0 && st1Score !== null && !isNaN(st1Score as number)) ? Math.round(((st1Score as number) / st1HPS) * 30 * 100) / 100 : null;
        const st2WS = (st2HPS > 0 && st2Score !== null && !isNaN(st2Score as number)) ? Math.round(((st2Score as number) / st2HPS) * 30 * 100) / 100 : null;
        const teWS = (teHPS > 0 && teScore !== null && !isNaN(teScore as number)) ? Math.round(((teScore as number) / teHPS) * 40 * 100) / 100 : null;

        let qaScore = 0;
        let qaHPS = 0;
        if (isSSHS) {
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
        } else {
            if (teHPS > 0 && teScore !== null && !isNaN(teScore as number)) {
                qaHPS = teHPS;
                qaScore = (teScore as number);
            }
        }

        const qaPS = isZeroExam ? 0 : computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
        const qaWS = isZeroExam ? 0 : Math.round(qaPS * (currentWeights.quarterly_exam || 0) * 100) / 100;

        const initialGrade = Math.round(((wwWS || 0) + (ptWS || 0) + (qaWS || 0)) * 100) / 100;

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            wwScores.some(isValidScore) ||
            ptScores.some(isValidScore) ||
            (!isZeroExam && (isSSHS ? qaScores.some(isValidScore) : isValidScore(qaScores[2])));

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
            teHPS,
            initialGrade: isNaN(initialGrade) ? 0 : initialGrade,
            quarterlyGrade: isNaN(quarterlyGrade) ? 0 : quarterlyGrade
        };
    }, [record, hps, currentWeights, currentCluster, activeSchoolYear, activeWwCount, activePtCount, isZeroExam, isSSHS]);

    const rowNum = (sectionIdx === 0 ? 1 : maleStudentsCount + 1) + idx;

    return (
        <tr className="hover:bg-gray-50 h-5.5 text-[8.5px]">
            <td className="border border-black border-r-2 border-r-black p-0.5 text-left text-[9.5px] leading-none whitespace-nowrap font-bold uppercase truncate" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>
                {idx + 1}. {formatStudentFullName(student)}
            </td>
            {summary.ww.map((score, i) => (
                <td key={`ww-${i}`} className="border border-black p-0">
                    <DebouncedInput
                        type="number"
                        value={score === '' ? '' : score}
                        onChange={(v) => updateGrade(student.lrn, 'ww', i, v)}
                        onKeyDown={(e) => handleKeyDown(e, rowNum, i)}
                        data-row={rowNum}
                        data-col={i}
                        className="w-full h-full text-center outline-none p-0 focus:bg-blue-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                    />
                </td>
            ))}
            <td className="border border-black bg-blue-100/60 font-medium text-center">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwTotalScore : ''}</td>
            <td className="border border-black bg-blue-100/60 text-[8px] text-center">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwPS.toFixed(2) : ''}</td>
            <td className="border border-black border-r-2 border-r-black bg-blue-200/60 font-bold text-[8.5px] text-center">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwWS.toFixed(2) : ''}</td>
            {summary.pt.map((score, i) => (
                <td key={`pt-${i}`} className="border border-black p-0">
                    <DebouncedInput
                        type="number"
                        value={score === '' ? '' : score}
                        onChange={(v) => updateGrade(student.lrn, 'pt', i, v)}
                        onKeyDown={(e) => handleKeyDown(e, rowNum, activeWwCount + i)}
                        data-row={rowNum}
                        data-col={activeWwCount + i}
                        className="w-full h-full text-center outline-none p-0 focus:bg-green-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                    />
                </td>
            ))}
            <td className="border border-black bg-green-100/60 font-medium text-center">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptTotalScore : ''}</td>
            <td className="border border-black bg-green-100/60 text-[8px] text-center">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptPS.toFixed(2) : ''}</td>
            <td className="border border-black border-r-2 border-r-black bg-green-200/60 font-bold text-[8.5px] text-center">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptWS.toFixed(2) : ''}</td>
            
            {/* Examination Inputs & Sub-weights */}
            {!isZeroExam && isSSHS && (
                <>
                    {summary.qa.map((score, i) => (
                        <td key={`qa-${i}`} className="border border-black p-0">
                            <DebouncedInput
                                type="number"
                                value={score === '' ? '' : score}
                                onChange={(v) => updateGrade(student.lrn, 'qa', i, v)}
                                onKeyDown={(e) => handleKeyDown(e, rowNum, activeWwCount + activePtCount + i)}
                                data-row={rowNum}
                                data-col={activeWwCount + activePtCount + i}
                                className="w-full h-full text-center outline-none p-0 focus:bg-yellow-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                            />
                        </td>
                    ))}
                    <td className="border border-black bg-yellow-100/50 text-[8px] text-center">{summary.st1WS !== null ? summary.st1WS.toFixed(2) : ''}</td>
                    <td className="border border-black bg-yellow-100/50 text-[8px] text-center">{summary.st2WS !== null ? summary.st2WS.toFixed(2) : ''}</td>
                    <td className="border border-black bg-yellow-100/50 text-[8px] text-center">{summary.teWS !== null ? summary.teWS.toFixed(2) : ''}</td>
                    <td className="border border-black bg-yellow-100/60 text-[8px] text-center">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaPS.toFixed(2) : ''}</td>
                    <td className="border border-black border-r-2 border-r-black bg-yellow-200/60 font-bold text-[8.5px] text-center">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaWS.toFixed(2) : ''}</td>
                </>
            )}

            {!isZeroExam && !isSSHS && (
                <>
                    <td className="border border-black p-0">
                        <DebouncedInput
                            type="number"
                            value={summary.qa[2] === '' ? '' : summary.qa[2]}
                            onChange={(v) => updateGrade(student.lrn, 'qa', 2, v)}
                            onKeyDown={(e) => handleKeyDown(e, rowNum, activeWwCount + activePtCount)}
                            data-row={rowNum}
                            data-col={activeWwCount + activePtCount}
                            className="w-full h-full text-center outline-none p-0 focus:bg-yellow-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                        />
                    </td>
                    <td className="border border-black bg-yellow-100/60 text-[8px] text-center">{summary.teHPS > 0 && summary.qa[2] !== '' ? summary.qaPS.toFixed(2) : ''}</td>
                    <td className="border border-black border-r-2 border-r-black bg-yellow-200/60 font-bold text-[8.5px] text-center">{summary.teHPS > 0 && summary.qa[2] !== '' ? summary.qaWS.toFixed(2) : ''}</td>
                </>
            )}

            <td className="border border-black border-r-2 border-r-black bg-yellow-50/50 font-bold text-center text-[9.5px] whitespace-nowrap">{summary.hasScores ? summary.initialGrade.toFixed(2) : ''}</td>
            <td className={`border border-black font-black text-center text-[10.5px] leading-tight whitespace-nowrap ${summary.quarterlyGrade > 0 ? (summary.quarterlyGrade < 75 ? 'bg-red-500 text-white' : 'bg-deped-blue text-white') : 'bg-white'}`}>
                {summary.quarterlyGrade > 0 ? formatGradeForDisplay(summary.quarterlyGrade, sectionGradeLevel) : ''}
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
        prev.optimalNameColumnWidth === next.optimalNameColumnWidth &&
        prev.activeWwCount === next.activeWwCount &&
        prev.activePtCount === next.activePtCount &&
        prev.isZeroExam === next.isZeroExam &&
        prev.isSSHS === next.isSSHS
    );
});

export function ShsEClassRecord() {
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
    const { user } = useAuthStore();

    const [selectedSection, setSelectedSection] = useState(globalSection || '');
    const [selectedSubject, setSelectedSubject] = useState(globalSubject || '');
    const [quarter, setQuarter] = useState<1 | 2 | 3 | 'summary' | 'summary_t1' | 'summary_t2' | 'summary_t3' | 'summary_final'>(1);
    const [zoom, setZoom] = useState(0.95);
    const [paperSize, setPaperSize] = useState<PaperSize>('folio');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

    const formatStudentFullName = useCallback((student: typeof students[number]) => {
        const middleName = student.middle_name?.trim();
        return `${student.last_name}, ${student.first_name}${middleName ? ` ${middleName}` : ''}`.toUpperCase();
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

    const sectionGradeLevel = selectedSectionObj?.section_grade_level || '';
    const selectedSubjectObj = useMemo(() => {
        return subjects.find(s => s.id === selectedSubject);
    }, [subjects, selectedSubject]);

    // Compute which terms the selected subject is offered in
    const offeredTerms = useMemo(() => {
        if (!selectedSubjectObj) return [1, 2, 3];
        const termVal = selectedSubjectObj.term;
        if (termVal === undefined || termVal === null || termVal === 'all') return [1, 2, 3];
        if (termVal === 'none') return [];
        return [Number(termVal)];
    }, [selectedSubjectObj]);

    // Sort Sections
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
            const secSubjects = filterSubjectsForSection(user, targetSec, subjects).filter(s => s.term !== 'none');
            if (secSubjects.length > 0) {
                setSelectedSubject(secSubjects[0].id);
                setGlobalSubject(secSubjects[0].id);
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

    // Filter & Sort Subjects
    const filteredSubjects = useMemo(() => {
        if (!selectedSectionObj) return [];
        let base = [...filterSubjectsForSection(user, selectedSectionObj, subjects)].filter(s => s.term !== 'none');

        // Deduplicate base subjects by normalized subject name
        const seenNames = new Set<string>();
        const uniqueBase: Subject[] = [];
        for (const s of base) {
            const norm = s.subject_name.trim().toLowerCase();
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
        return base.sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    }, [subjects, selectedSectionObj, user, quarter]);

    // Group subjects by category if it's SHS
    const groupedSubjects = useMemo(() => {
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
            const isValid = selectedSubject && filteredSubjects.some(s => s.id === selectedSubject);
            if (!isValid) {
                const firstSub = filteredSubjects[0].id;
                setSelectedSubject(firstSub);
                setGlobalSubject(firstSub);
            }
        }
    }, [selectedSection, filteredSubjects, selectedSubject, setGlobalSubject]);

    const effectiveSubjectId = selectedSubject;

    const subjectName = useMemo(() => {
        return subjects.find(s => s.id === effectiveSubjectId)?.subject_name || '';
    }, [subjects, effectiveSubjectId]);

    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        const baseStudents = students.filter((s) => s.student_section === selectedSection || (selectedSectionObj?.id && s.student_section === selectedSectionObj.id));
        
        // Find subject enrollment if defined
        const subj = subjects.find(s => s.id === selectedSubject);
        if (subj?.enrolled_student_lrns && subj.enrolled_student_lrns.length > 0) {
            return baseStudents.filter(s => subj.enrolled_student_lrns?.includes(s.lrn));
        }
        
        return baseStudents;
    }, [students, selectedSection, selectedSectionObj, selectedSubject, subjects]);

    const isGrade11 = (sectionGradeLevel || '').includes('11');
    const isGrade12 = (sectionGradeLevel || '').includes('12');

    // Track/Strand determination
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

    // Smart Filtering Engine to distinguish New SSHS (DO 15/17, s. 2026) vs Old Legacy K-12 (DO 8, s. 2015)
    // Note: Even though the entire school adopts the 3-Term calendar for SY 2026-2027,
    // Grade 12 Old K-12 is identified by Track, Strand, and Subject Catalog vs SSHS Clusters & Electives.
    const isSSHS = useMemo(() => {
        if (isGrade11) return true; // Grade 11 is always Strengthened SHS (DO 15, s. 2026)
        if (!isGrade12) return true; // Non-Grade 12 SHS defaults to SSHS
        if (!selectedSubjectObj) return false;

        const subjAny = selectedSubjectObj as any;
        const norm = (selectedSubjectObj.subject_name || '').trim().toLowerCase();
        const normClean = norm.replace(/[^a-z0-9]/g, '');

        // 1. Explicit Curriculum / Version Flags
        if (subjAny.is_sshs === true || subjAny.sshs === true || subjAny.curriculum === 'sshs' || subjAny.curriculum === '2026' || subjAny.curriculum === 'do15' || subjAny.curriculum === 'do17') {
            return true;
        }
        if (subjAny.is_legacy === true || subjAny.is_old === true || subjAny.curriculum === 'legacy' || subjAny.curriculum === 'old' || subjAny.curriculum === '2016' || subjAny.curriculum === 'do8' || subjAny.curriculum === 'k12') {
            return false;
        }

        // 2. Known Distinct Legacy K-12 Grade 12 Subjects & Core/Applied/Specialized (DO 8, s. 2015)
        const legacyDistinctSubjects = [
            'practical research 2',
            'practical research 1',
            'inquiries investigations and immersion',
            'inquiries, investigations and immersion',
            'inquiries investigations & immersion',
            '3is',
            'empowerment technologies',
            'english for academic and professional purposes',
            'eapp',
            'entrepreneurship',
            'filipino sa piling larang',
            'filipino sa piling larang akademik',
            'filipino sa piling larang akademiko',
            'filipino sa piling larang isports',
            'filipino sa piling larang sining at disenyo',
            'filipino sa piling larang teknikal bokasyunal',
            'filipino sa piling larang teknikal-bokasyunal',
            'contemporary philippine arts from the regions',
            'cpar',
            'media and information literacy',
            'mil',
            'physical education and health 1',
            'physical education and health 2',
            'physical education and health 3',
            'physical education and health 4',
            'health optimizing physical education and health 1',
            'health optimizing physical education and health 2',
            'health optimizing physical education and health 3',
            'health optimizing physical education and health 4',
            'health optimizing physical education 1',
            'health optimizing physical education 2',
            'health optimizing physical education 3',
            'health optimizing physical education 4',
            'hope 1',
            'hope 2',
            'hope 3',
            'hope 4',
            'pe and health 1',
            'pe and health 2',
            'pe and health 3',
            'pe and health 4',
            'physical education 1',
            'physical education 2',
            'physical education 3',
            'physical education 4',
            'pe 1',
            'pe 2',
            'pe 3',
            'pe 4',
            'understanding culture society and politics',
            'understanding culture, society and politics',
            'ucsp',
            'intro to philosophy',
            'introduction to philosophy of the human person',
            'personal development',
            'perdev',
            '21st century literature from the philippines and the world',
            '21st century literature',
            // Legacy Specialized Subjects
            'basic calculus',
            'general chemistry 1',
            'general chemistry 2',
            'general physics 1',
            'general physics 2',
            'general biology 1',
            'general biology 2',
            'fundamentals of accountancy, business and management 1',
            'fundamentals of accountancy, business and management 2',
            'fabm 1',
            'fabm 2',
            'business finance',
            'principles of marketing',
            'organization and management',
            'business ethics and social responsibility',
            'business math',
            'business mathematics',
            'philippine politics and governance',
            'ppg',
            'disciplines and ideas in the social sciences',
            'diss',
            'disciplines and ideas in the applied social sciences',
            'diass',
            'community engagement, solidarity and citizenship',
            'cesc',
            'trends, networks, and critical thinking in the 21st century culture',
            'trends networks and critical thinking',
            'tnct'
        ];
        if (legacyDistinctSubjects.some(l => normClean === l.replace(/[^a-z0-9]/g, '') || norm.includes(l))) {
            return false;
        }

        // 3. Section Track / Strand check:
        // If the section is configured with legacy K-12 Strands (STEM, ABM, HUMSS, GAS, ICT, HE, IA, AFA)
        // and does NOT have explicit SSHS elective catalog match
        const rawStrand = ((selectedSectionObj as any)?.section_strand || sectionTrack || '').toLowerCase();
        const isLegacyStrand = ['abm', 'humss', 'gas', 'tvl - ict', 'tvl - he', 'tvl - ia', 'tvl - afa'].some(st => rawStrand.includes(st));

        // 4. SSHS Official DO 17 s. 2026 Elective Catalogs (Pilot Schools & 2026 Offerings)
        const inElectiveCatalog = SSHS_ELECTIVE_CATALOG.some(e => {
            const eNorm = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            return eNorm === normClean || norm.includes(e.title.toLowerCase()) || e.title.toLowerCase().includes(norm);
        });
        if (inElectiveCatalog) return true;

        const inFullCatalog = SSHS_GRADE11_CATALOG.some(c => {
            const cNorm = c.subject.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cNorm === normClean || norm.includes(c.subject.toLowerCase()) || c.subject.toLowerCase().includes(norm);
        });
        if (inFullCatalog && !isLegacyStrand) return true;

        if (isGrade11CoreSubject(norm) && !isLegacyStrand) return true;

        // Default for Grade 12 without explicit SSHS elective is Old K-12
        return false;
    }, [isGrade11, isGrade12, selectedSubjectObj, selectedSectionObj, sectionTrack]);

    const activeWwCount = isSSHS ? SSHS_WW_COUNT : (isGrade12 ? G12_WW_COUNT : WW_COUNT);
    const activePtCount = isSSHS ? SSHS_PT_COUNT : (isGrade12 ? G12_PT_COUNT : PT_COUNT);

    // Highest Possible Scores (HPS) - Persistent
    const hps = useMemo(() => {
        if (!effectiveSubjectId) {
            return { ww: Array(activeWwCount).fill(''), pt: Array(activePtCount).fill(''), qa: Array(ST_COUNT).fill('') };
        }

        const secId = selectedSectionObj?.id || selectedSection;
        const secName = selectedSectionObj?.section_name || selectedSection;
        const fullSecName = selectedSectionObj ? `${selectedSectionObj.section_grade_level} - ${selectedSectionObj.section_name}` : selectedSection;

        const record = hpsRecords.find(r =>
            (r.subject_id === effectiveSubjectId || (subjectName && isMatchingSubject(subjectName, r.subject_id))) &&
            r.school_year === activeSchoolYear &&
            Number(r.quarter) === quarter &&
            (
                r.section_id === secId ||
                r.section_id === secName ||
                r.section_id === fullSecName ||
                r.section_id === selectedSection ||
                (secId && r.id.includes(secId)) ||
                (secName && r.id.includes(secName))
            )
        ) || hpsRecords.find(r =>
            (r.subject_id === effectiveSubjectId || (subjectName && isMatchingSubject(subjectName, r.subject_id))) &&
            r.school_year === activeSchoolYear &&
            Number(r.quarter) === quarter &&
            !r.section_id
        );

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

        // For Grade 12: relocate Summative Test 1 and 2 HPS to Written Works 6 and 7 if empty
        if (!isSSHS) {
            if ((hps_ww[5] === '' || hps_ww[5] === undefined || hps_ww[5] === 0) && Number(hps_qa[0]) > 0) {
                hps_ww[5] = hps_qa[0];
            }
            if ((hps_ww[6] === '' || hps_ww[6] === undefined || hps_ww[6] === 0) && Number(hps_qa[1]) > 0) {
                hps_ww[6] = hps_qa[1];
            }
        }

        return {
            ww: hps_ww,
            pt: hps_pt,
            qa: hps_qa
        };
    }, [hpsRecords, effectiveSubjectId, subjectName, activeSchoolYear, quarter, selectedSection, selectedSectionObj, activeWwCount, activePtCount, isSSHS]);

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
            if (user?.email?.includes('galanoemerson') || user?.displayName?.toLowerCase().includes('emerson')) {
                setTeacherName("EMERSON M. GALANO");
                return;
            }
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
            const fallbackName = selectedSectionObj?.adviser_name || schoolProfile?.adviser_name || user?.displayName || "";
            setTeacherName(fallbackName.toUpperCase());
        };
        fetchTeacher();
    }, [selectedSubjectObj, effectiveSubjectId, selectedSectionObj, user, teachers, schoolProfile, subjects]);

    const maleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Male').sort((a, b) => {
        return `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`);
    }), [sectionStudents]);

    const femaleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Female').sort((a, b) => {
        return `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`);
    }), [sectionStudents]);

    const isFieldExposure = currentCluster === 'shs_field_exposure';
    const isZeroExam = currentWeights.quarterly_exam === 0 || isFieldExposure;

    const maxLearnerNameLength = useMemo(() => {
        return sectionStudents.reduce((max, s) => Math.max(max, formatStudentFullName(s).length), 0);
    }, [sectionStudents, formatStudentFullName]);

    const optimalNameColumnWidth = useMemo(() => {
        return Math.max(145, Math.ceil(maxLearnerNameLength * 6.0 + 14));
    }, [maxLearnerNameLength]);

    const sshsMeta = useMemo(() => {
        if (!selectedSubjectObj) return null;
        return resolveSSHSMetadata(selectedSubjectObj, isGrade11 ? 11 : 12);
    }, [selectedSubjectObj, isGrade11]);

    const displayGradeNum = sectionGradeLevel.match(/\d+/)?.[0] || (isGrade11 ? '11' : '12');
    const displaySectionClean = (selectedSectionObj?.section_name || selectedSection)
        .replace(new RegExp(`Grade\\s*${displayGradeNum}`, 'i'), '')
        .replace(new RegExp(`^${displayGradeNum}\\s*-\\s*`, 'i'), '')
        .trim();
    const displaySubjectName = (isSSHS ? (sshsMeta?.subject || selectedSubjectObj?.subject_name || subjectName || '') : (selectedSubjectObj?.subject_name || subjectName || '')).toUpperCase();
    const displayCluster = (isSSHS ? (sshsMeta?.cluster || currentCluster || 'CORE') : (sectionTrack || currentCluster || 'CORE')).toUpperCase();
    const unitsPerTerm = (sshsMeta?.terms === 3 ? 2 : ((selectedSubjectObj as any)?.hours ? Math.round((selectedSubjectObj as any).hours / 40) : 2)) || 2;
    const unitsPerYear = (sshsMeta ? (sshsMeta.terms * unitsPerTerm) : 6) || 6;

    const subjectType = useMemo(() => {
        return getSubjectCategory(selectedSubjectObj?.subject_name || subjectName || '', sectionGradeLevel).toUpperCase();
    }, [selectedSubjectObj, subjectName, sectionGradeLevel]);

    const totalNonNameCols = (activeWwCount + 3) + (activePtCount + 3) + (!isZeroExam ? (isSSHS ? 8 : 3) : 0) + 2;
    const colSpanGls = Math.max(3, Math.round(totalNonNameCols * 0.20));
    const colSpanSection = Math.max(4, Math.round(totalNonNameCols * 0.24));
    const colSpanTeacher = Math.max(5, Math.round(totalNonNameCols * 0.30));
    const colSpanSubject = totalNonNameCols - (colSpanGls + colSpanSection + colSpanTeacher);

    const getStudentSummary = useCallback((student: typeof students[0]) => {
        const record = classRecords.find(r =>
            r.student_lrn === student.lrn &&
            (r.subject_id === effectiveSubjectId || (subjectName && isMatchingSubject(subjectName, r.subject_id, r.subject_name))) &&
            Number(r.quarter) === quarter
        );

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

        const wwTotalScore = wwScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const wwTotalHPS = hps.ww.reduce<number>((a, b) => a + Number(b), 0);
        const wwPS = wwTotalHPS === 0 ? 0 : Math.round((wwTotalScore / wwTotalHPS) * 100 * 100) / 100;
        const wwWS = Math.round(wwPS * (currentWeights.written_works || 0) * 100) / 100;

        const ptTotalScore = ptScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const ptTotalHPS = hps.pt.reduce<number>((a, b) => a + Number(b), 0);
        const ptPS = ptTotalHPS === 0 ? 0 : Math.round((ptTotalScore / ptTotalHPS) * 100 * 100) / 100;
        const ptWS = Math.round(ptPS * (currentWeights.performance_tasks || 0) * 100) / 100;

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

        const qaPS = isZeroExam ? 0 : computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
        const qaWS = isZeroExam ? 0 : Math.round(qaPS * (currentWeights.quarterly_exam || 0) * 100) / 100;

        const initialGrade = Math.round(((wwWS || 0) + (ptWS || 0) + (qaWS || 0)) * 100) / 100;

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            wwScores.some(isValidScore) ||
            ptScores.some(isValidScore) ||
            (!isZeroExam && qaScores.some(isValidScore));

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
    }, [classRecords, effectiveSubjectId, subjectName, quarter, hps, currentWeights, currentCluster, activeSchoolYear, activeWwCount, activePtCount, isZeroExam]);

    const getGradeDescriptor = useCallback((grade: number, hasScores: boolean) => {
        if (!hasScores || grade <= 0) return '';
        return getGradeDescriptorWithFilipino(grade, sectionGradeLevel, activeSchoolYear);
    }, [sectionGradeLevel, activeSchoolYear]);

    const getSummaryGrades = useCallback((student: typeof students[0]) => {
        const targetSubjectObj = subjects.find(s => s.id === selectedSubject);
        const isTermOffered = (subj: typeof targetSubjectObj | undefined, q: number) => {
            if (!subj) return true;
            const termVal = subj.term;
            if (termVal === undefined || termVal === null || termVal === 'all') return true;
            if (termVal === 'none') return false;
            return Number(termVal) === q;
        };

        let total = 0;
        let count = 0;
        const terms = [1, 2, 3].map(q => {
            if (!isTermOffered(targetSubjectObj, q)) {
                return '';
            }
            const record = classRecords.find(r =>
                r.student_lrn === student.lrn &&
                (r.subject_id === selectedSubject || (targetSubjectObj && isMatchingSubject(targetSubjectObj.subject_name, r.subject_id, r.subject_name))) &&
                Number(r.quarter) === q
            );
            const grade = record?.final_grade ? Number(record.final_grade) : 0;
            if (grade > 0) {
                total += grade;
                count++;
            }
            return grade > 0 ? grade : '';
        });

        const final = count > 0 ? Math.round(total / count) : '';
        const descriptor = final !== '' ? getGradeDescriptor(Number(final), true) : '';

        return {
            t1: terms[0],
            t2: terms[1],
            t3: terms[2],
            final,
            descriptor
        };
    }, [classRecords, selectedSubject, getGradeDescriptor, subjects]);

    const proficiencyData = useMemo(() => {
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
        const fullSecName = selectedSectionObj ? `${selectedSectionObj.section_grade_level} - ${selectedSectionObj.section_name}` : selectedSection;

        const stateHpsRecords = useAppStore.getState().hpsRecords;
        const existingRecord = stateHpsRecords.find(r =>
            r.subject_id === effectiveSubjectId &&
            r.school_year === activeSchoolYear &&
            Number(r.quarter) === (quarter as number) &&
            (
                r.section_id === secId ||
                r.section_id === secName ||
                r.section_id === fullSecName ||
                r.section_id === selectedSection ||
                (secId && r.id.includes(secId)) ||
                (secName && r.id.includes(secName))
            )
        );

        const legacyRecord = !existingRecord ? stateHpsRecords.find(r =>
            r.subject_id === effectiveSubjectId &&
            r.school_year === activeSchoolYear &&
            Number(r.quarter) === (quarter as number) &&
            !r.section_id
        ) : null;

        const newRecord: HPSRecord = existingRecord ? { ...existingRecord, section_id: secId } : {
            id: `hps_${effectiveSubjectId}_${secId}_Q${quarter}_${activeSchoolYear}`,
            subject_id: effectiveSubjectId,
            school_year: activeSchoolYear,
            quarter: quarter as any,
            written_works: legacyRecord ? [...legacyRecord.written_works] : Array(activeWwCount).fill(''),
            performance_tasks: legacyRecord ? [...legacyRecord.performance_tasks] : Array(activePtCount).fill(''),
            quarterly_exam: legacyRecord ? legacyRecord.quarterly_exam : '',
            section_id: secId
        };

        const hpsWithSummative = newRecord as HPSRecord & { summative_tests?: (number | string)[] };
        
        if (legacyRecord) {
            const legacyWithSummative = legacyRecord as HPSRecord & { summative_tests?: (number | string)[] };
            if (legacyWithSummative.summative_tests) {
                hpsWithSummative.summative_tests = [...legacyWithSummative.summative_tests];
            }
        }

        const currentQa = normalizeScores(hpsWithSummative.summative_tests, ST_COUNT);
        
        if (type === 'qa') {
            currentQa[index] = numVal;
            hpsWithSummative.summative_tests = currentQa;
            newRecord.quarterly_exam = currentQa[2];
        } else if (type === 'ww') {
            const newWW = [...newRecord.written_works];
            newWW[index] = numVal;
            newRecord.written_works = newWW;
        } else if (type === 'pt') {
            const newPT = [...newRecord.performance_tasks];
            newPT[index] = numVal;
            newRecord.performance_tasks = newPT;
        }

        updateHPSRecord(newRecord);

        // Recalculate and update final_grade for all section students with scores to prevent stale calculations
        const stateClassRecords = useAppStore.getState().classRecords;
        const currentHpsWw = normalizeScores(newRecord.written_works, activeWwCount).map(v => Number(v) || 0);
        const currentHpsPt = normalizeScores(newRecord.performance_tasks, activePtCount).map(v => Number(v) || 0);
        const currentHpsQa = normalizeScores(currentQa, ST_COUNT).map(v => Number(v) || 0);

        const hpsWwTotal = currentHpsWw.reduce((a, b) => a + b, 0);
        const hpsPtTotal = currentHpsPt.reduce((a, b) => a + b, 0);

        sectionStudents.forEach(st => {
            const cr = stateClassRecords.find(r =>
                r.student_lrn === st.lrn &&
                (r.subject_id === effectiveSubjectId || (subjectName && isMatchingSubject(subjectName, r.subject_id, r.subject_name))) &&
                Number(r.quarter) === Number(quarter)
            );
            if (!cr) return;

            const sWw = normalizeScores(cr.written_works, activeWwCount);
            const sPt = normalizeScores(cr.performance_tasks, activePtCount);
            const sQa = normalizeScores((cr as any).summative_tests, ST_COUNT);
            if (!sQa[2] && cr.quarterly_exam !== '') sQa[2] = cr.quarterly_exam;

            const isValid = (v: any) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v));
            const hasScores = sWw.some(isValid) || sPt.some(isValid) || (!isZeroExam && sQa.some(isValid));
            if (!hasScores) return;

            const sWwTotal = sWw.reduce<number>((a, b) => a + (isValid(b) ? Number(b) : 0), 0);
            const sPtTotal = sPt.reduce<number>((a, b) => a + (isValid(b) ? Number(b) : 0), 0);

            const wwPS = hpsWwTotal === 0 ? 0 : Math.round((sWwTotal / hpsWwTotal) * 100 * 100) / 100;
            const wwWS = Math.round(wwPS * (currentWeights.written_works || 0) * 100) / 100;

            const ptPS = hpsPtTotal === 0 ? 0 : Math.round((sPtTotal / hpsPtTotal) * 100 * 100) / 100;
            const ptWS = Math.round(ptPS * (currentWeights.performance_tasks || 0) * 100) / 100;

            const st1Score = sQa[0] === '' || sQa[0] === null || sQa[0] === undefined ? null : Number(sQa[0]);
            const st1HPS = Number(currentHpsQa[0]) || 0;
            const st2Score = sQa[1] === '' || sQa[1] === null || sQa[1] === undefined ? null : Number(sQa[1]);
            const st2HPS = Number(currentHpsQa[1]) || 0;
            const teScore = sQa[2] === '' || sQa[2] === null || sQa[2] === undefined ? null : Number(sQa[2]);
            const teHPS = Number(currentHpsQa[2]) || 0;

            const qaPS = isZeroExam ? 0 : computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
            const qaWS = isZeroExam ? 0 : Math.round(qaPS * (currentWeights.quarterly_exam || 0) * 100) / 100;

            const initialGrade = Math.round(((wwWS || 0) + (ptWS || 0) + (qaWS || 0)) * 100) / 100;
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
    }, [effectiveSubjectId, subjectName, activeSchoolYear, quarter, selectedSection, selectedSectionObj, sections, sectionStudents, currentWeights, currentCluster, updateHPSRecord, updateClassRecord, activeWwCount, activePtCount, isZeroExam]);

    const updateGrade = useCallback((lrn: string, type: 'ww' | 'pt' | 'qa', index: number, value: string) => {
        if (!selectedSection || !effectiveSubjectId) return;

        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        if (isSummaryMode) return;

        const stateClassRecords = useAppStore.getState().classRecords;
        const existingRecord = stateClassRecords.find(r =>
            r.student_lrn === lrn &&
            r.subject_id === effectiveSubjectId &&
            Number(r.quarter) === (quarter as number)
        );

        const record: ClassRecord = existingRecord ? { ...existingRecord } : {
            id: `grade_${lrn}_${effectiveSubjectId}_Q${quarter}`,
            student_lrn: lrn,
            section_id: selectedSectionObj?.id || sections.find(s => s.id === selectedSection || s.section_name === selectedSection)?.id || '',
            subject_id: effectiveSubjectId,
            school_year: activeSchoolYear,
            quarter: quarter as any,
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

        const wwTotalScore = normalizedWW.reduce<number>((a, b) => a + (b !== '' && !isNaN(Number(b)) ? Number(b) : 0), 0);
        const wwTotalHPS = hps.ww.reduce<number>((a, b) => a + Number(b), 0);
        const wwPS = wwTotalHPS === 0 ? 0 : Math.min(100, Math.max(0, (wwTotalScore / wwTotalHPS) * 100));
        const wwWS = wwPS * (currentWeights.written_works || 0);

        const ptTotalScore = normalizedPT.reduce<number>((a, b) => a + (b !== '' && !isNaN(Number(b)) ? Number(b) : 0), 0);
        const ptTotalHPS = hps.pt.reduce<number>((a, b) => a + Number(b), 0);
        const ptPS = ptTotalHPS === 0 ? 0 : Math.min(100, Math.max(0, (ptTotalScore / ptTotalHPS) * 100));
        const ptWS = ptPS * (currentWeights.performance_tasks || 0);

        const st1Score = qaScores[0] === '' || qaScores[0] === null || qaScores[0] === undefined ? null : Number(qaScores[0]);
        const st1HPS = Number(hps.qa[0]) || 0;
        const st2Score = qaScores[1] === '' || qaScores[1] === null || qaScores[1] === undefined ? null : Number(qaScores[1]);
        const st2HPS = Number(hps.qa[1]) || 0;
        const teScore = qaScores[2] === '' || qaScores[2] === null || qaScores[2] === undefined ? null : Number(qaScores[2]);
        const teHPS = Number(hps.qa[2]) || 0;

        const qaPS = isZeroExam ? 0 : computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
        const qaWS = isZeroExam ? 0 : Math.round(qaPS * (currentWeights.quarterly_exam || 0) * 100) / 100;

        const initialGrade = Math.min(100, Math.max(0, (wwWS || 0) + (ptWS || 0) + (qaWS || 0)));

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            normalizedWW.some(isValidScore) ||
            normalizedPT.some(isValidScore) ||
            (!isZeroExam && qaScores.some(isValidScore));

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
    }, [selectedSection, effectiveSubjectId, subjectName, quarter, selectedSectionObj, activeSchoolYear, hps, currentWeights, currentCluster, updateClassRecord, deleteClassRecord, showNotification, sections, activeWwCount, activePtCount, isZeroExam]);

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
        document.title = `SHS_Class_Record_${sectionName}_${subjectName}_T${quarter}`;
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
            const pdf = new jsPDF({ orientation, unit: 'mm', format: pSize.jspdfFormat as any });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 4;
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) {
                    pdf.addPage(pSize.jspdfFormat as any, orientation);
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
            pdf.save(`SHS_Class_Record_${sectionName}_${subjName}_${termLabel}.pdf`);

            showNotification('Class record downloaded successfully!', 'success');
        } catch (err) {
            console.error('Download failed:', err);
            showNotification('Failed to download class record. Please try again.', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleExcelExport = async () => {
        if (!selectedSectionObj || !selectedSubjectObj) {
            showNotification('Please select both a section and a subject to export.', 'error');
            return;
        }
        try {
            setIsDownloading(true);
            if (isSSHS) {
                // Grade 11 SSHS (DO 15, s. 2026) export
                await exportSSHSEClassRecord({
                    schoolProfile: schoolProfile || null,
                    schoolYear: activeSchoolYear,
                    section: selectedSectionObj,
                    subject: selectedSubjectObj,
                    students: sectionStudents,
                    classRecords,
                    hpsRecords,
                    teacherName,
                    termBlock: (selectedSubjectObj as any)?.term_block || '1ST, 2ND, 3RD',
                    numTerms: 3
                });
                showNotification('SSHS E-Class Record exported to Excel successfully!', 'success');
            } else {
                // Grade 12 Legacy K-12 (DO 8, s. 2015) export
                const resolvedTerms = resolveSHSG12Terms(
                    selectedSubjectObj,
                    classRecords,
                    hpsRecords,
                    activeSchoolYear
                );
                await exportSHSG12EClassRecord({
                    schoolProfile: schoolProfile || null,
                    schoolYear: activeSchoolYear,
                    section: selectedSectionObj,
                    subject: selectedSubjectObj,
                    students: sectionStudents,
                    classRecords,
                    hpsRecords,
                    teacherName,
                    track: sectionTrack,
                    termBlock: resolvedTerms.termBlock,
                    numTerms: resolvedTerms.numTerms
                });
                showNotification('SHS Grade 12 E-Class Record exported to Excel successfully!', 'success');
            }
        } catch (err: any) {
            console.error('SHS Excel Export Error:', err);
            showNotification(err?.message || 'Failed to export SHS Excel record.', 'error');
        } finally {
            setIsDownloading(false);
        }
    };


    return (
        <div className="h-full min-h-0 flex flex-col gap-3">
            <style>{`
                @media print {
                    @page {
                        size: ${typeof quarter === 'string' && quarter.startsWith('summary') ? PAPER_SIZES[paperSize].portrait : PAPER_SIZES[paperSize].landscape};
                        margin: ${typeof quarter === 'string' && quarter.startsWith('summary') ? PAPER_SIZES[paperSize].summaryMargins : PAPER_SIZES[paperSize].margins};
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

            <div className="bg-white rounded-lg shadow-md p-2.5 no-print overflow-x-auto">
                <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-end gap-2 lg:gap-2.5">
                    <div className="w-full lg:w-40 shrink-0">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[11px] font-semibold text-deped-blue whitespace-nowrap">Section</label>
                        </div>
                        <select
                            value={selectedSection}
                            onChange={(e) => onSectionChange(e.target.value)}
                            className="form-input h-8 py-1 px-2 text-[11px] rounded-xl"
                        >
                            <option value="">Select Section</option>
                            {sortedSections.map((s) => (
                                <option key={s.id} value={s.section_name}>{s.section_grade_level} - {s.section_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full lg:flex-1 lg:min-w-35">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[11px] font-semibold text-deped-blue whitespace-nowrap">
                                Subject {sectionGradeLevel && `(${sectionGradeLevel})`}
                            </label>
                        </div>
                        <select
                            value={selectedSubject}
                            onChange={(e) => onSubjectChange(e.target.value)}
                            className="form-input h-8 py-1 px-2 text-[11px] rounded-xl"
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

                    <div className="w-full lg:w-27.5 shrink-0">
                        <label className="block text-[11px] font-semibold mb-1 text-deped-blue whitespace-nowrap">Term</label>
                        <select value={quarter} onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('summary')) {
                                setQuarter(val as any);
                            } else {
                                setQuarter(Number(val) as any);
                            }
                        }} className="form-input h-8 py-1 px-2 text-[11px] rounded-xl">
                            <option value={1}>Term 1</option>
                            <option value={2}>Term 2</option>
                            <option value={3}>Term 3</option>
                            <option value="summary_final">Final Summary</option>
                        </select>
                    </div>
                    <div className="w-full lg:w-27.5 shrink-0">
                        <label className="text-[11px] font-semibold mb-1 text-deped-blue flex items-center gap-1 whitespace-nowrap">
                            <FileText className="w-3.5 h-3.5" /> Paper Size
                        </label>
                        <select
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                            className="form-input h-8 py-1 px-2 text-[11px] rounded-xl"
                        >
                            {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 h-8 px-1 rounded-xl bg-slate-100 border border-slate-200">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                                title="Zoom Out"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] font-black text-slate-900 w-8 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                                title="Zoom In"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                        {selectedSubject && (
                            <button 
                                onClick={() => setIsEnrollmentModalOpen(true)}
                                className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 hover:scale-[1.02] transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                                title="Manage Enrolled Students"
                            >
                                <Users className="w-3.5 h-3.5" /> Enrolled Learners
                            </button>
                        )}
                        <button onClick={handlePrint} className="btn-primary flex items-center justify-center gap-1.5 h-8 px-3 text-[10px] rounded-xl whitespace-nowrap">
                            <Printer className="w-3.5 h-3.5" /> Print Record
                        </button>
                        <button
                            onClick={handleExcelExport}
                            disabled={isDownloading || !selectedSubject || sectionStudents.length === 0}
                            className="h-8 px-3 bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-800 hover:scale-[1.02] transition-all flex items-center gap-1.5 group disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                            title={!selectedSubject ? "Please select a subject first to export Excel" : (isSSHS ? "Export official DepEd SSHS Excel File (.xlsx)" : "Export official DepEd Grade 12 E-Class Record (.xlsx)")}
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                        </button>
                        <button 
                            onClick={handleDownload}
                            disabled={isDownloading || !selectedSubject || sectionStudents.length === 0}
                            className="h-8 px-3 bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-700 hover:scale-[1.02] transition-all flex items-center gap-1.5 group disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap"
                            title={!selectedSubject ? "Please select a subject first to enable download" : "Download PDF Class Record"}
                        >
                            {isDownloading ? (
                                <>
                                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Downloading…
                                </>
                            ) : (
                                <><Download className="w-3.5 h-3.5" /> Download</>  
                            )}
                        </button>
                        <button
                            onClick={async () => {
                                if (!selectedSubjectObj || !sectionStudents.length || (typeof quarter === 'string' && quarter.startsWith('summary'))) return;
                                
                                const termName = quarter === 1 ? '1st' : quarter === 2 ? '2nd' : '3rd';
                                const confirmMsg = `Publish ${termName} Term grades for ${selectedSubjectObj.subject_name} to the official Grade Management?\n\nThis will update the SF9/Advisory records for ${selectedSection}.`;
                                if (!window.confirm(confirmMsg)) return;

                                try {
                                    const { updateGradingSheetRecord } = useAppStore.getState();
                                    let count = 0;
                                    for (const student of sectionStudents) {
                                        const summary = getStudentSummary(student);
                                        if (summary.hasScores && summary.quarterlyGrade > 0) {
                                            const recordId = `${student.lrn}_${selectedSubject}_${quarter}_${activeSchoolYear}`;
                                            await updateGradingSheetRecord({
                                                id: recordId,
                                                student_lrn: student.lrn,
                                                subject_id: selectedSubject,
                                                section_id: selectedSectionObj?.id || '',
                                                quarter: quarter as 1|2|3,
                                                school_year: activeSchoolYear,
                                                final_grade: summary.quarterlyGrade,
                                                written_works: [],
                                                performance_tasks: [],
                                                quarterly_exam: 0
                                            });
                                            count++;
                                        }
                                    }
                                    showNotification(`Successfully published ${count} grades to official records!`, 'success');
                                } catch {
                                    showNotification("Failed to publish grades.", "error");
                                }
                            }}
                            disabled={!selectedSubject || sectionStudents.length === 0 || (typeof quarter === 'string' && quarter.startsWith('summary'))}
                            className="h-8 px-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all flex items-center gap-1.5 group disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap"
                            title={!selectedSubject ? "Please select a subject first to publish grades" : "Publish grades to Grade Management"}
                        >
                            <CloudUpload className="w-3.5 h-3.5" /> Publish
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
                            className="h-8 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
                            title="Open Grade Sync Inspector & Live Diagnostics"
                        >
                            <Bug className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
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
                            className="h-8 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
                            title="Download Complete Database to Excel (.xlsx) - Bypasses all filters & includes all DepEd records"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden xl:inline">Excel Rescue</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0d1225] shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-200/60 dark:border-white/10 flex-1 min-h-0">
                <div className="bg-slate-50/50 dark:bg-[#070a12] p-3 md:p-4 h-full min-h-0 overflow-auto custom-scrollbar">
                    <div className="w-full min-h-full flex justify-center overflow-x-auto py-2">
                    <div
                        className="eclass-zoom-shell origin-top transition-all duration-300 m-auto"
                        style={{ transform: `scale(${zoom})` }}
                    >
                    {typeof quarter === 'string' && quarter.startsWith('summary') ? (
                        <div id="printable-summary-record" className="bg-white px-8 py-10 mx-auto print:p-0 font-sans shadow-[0_0_50px_rgba(0,0,0,0.05)] print:shadow-none border border-gray-100 print:border-none transition-all duration-300 max-w-full" style={{ width: PAPER_SIZES[paperSize].previewWidthPortrait }}>
                            <div className="flex flex-col mb-4">
                                <div className="flex justify-between items-center w-full px-4 print:px-1 mb-2">
                                    <div className="w-16 h-16 shrink-0">
                                        <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Seal" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="text-center flex-1 mx-4 text-black">
                                        <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-black mb-0">
                                            {isGrade11 ? 'Strengthened Senior High School Class Record' : 'Senior High School Class Record'}
                                        </h1>
                                        <p className="text-[9px] italic text-black/80 font-sans mt-0.5 font-medium mb-0">
                                            (Pursuant to DepEd Order 15, series of 2026)
                                        </p>
                                    </div>
                                    <div className="w-24 h-16 shrink-0 flex items-center justify-center">
                                        <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                    </div>
                                </div>

                                <div className="flex items-stretch justify-between text-[10px] font-bold text-black uppercase w-full gap-4">
                                    <div className="flex flex-col gap-1 w-[56%]">
                                        <div className="flex items-stretch gap-2">
                                            <div className="flex items-center flex-[1.1]">
                                                <span className="w-20 text-right pr-2 font-bold text-[10px] shrink-0">REGION</span>
                                                <div className="border border-black px-2 py-0.5 flex-1 bg-white text-center font-bold">{schoolProfile.region}</div>
                                            </div>
                                            <div className="flex items-center flex-[1.2]">
                                                <span className="w-18 text-right pr-2 font-bold text-[10px] shrink-0">DIVISION</span>
                                                <div className="border border-black px-2 py-0.5 flex-1 bg-white text-center font-bold">{schoolProfile.division}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-20 text-right pr-2 font-bold text-[10px] shrink-0">SCHOOL NAME</span>
                                            <div className="border border-black px-2 py-0.5 flex-1 bg-white text-center font-bold">{schoolProfile.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 w-[38%]">
                                        <div className="flex items-center">
                                            <span className="w-24 text-right pr-2 font-bold text-[10px] shrink-0">SCHOOL ID</span>
                                            <div className="border border-black px-2 py-0.5 flex-1 bg-white text-center font-bold">{schoolProfile.school_id}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-24 text-right pr-2 font-bold text-[10px] shrink-0">SCHOOL YEAR</span>
                                            <div className="border border-black px-2 py-0.5 flex-1 bg-white text-center font-bold">{activeSchoolYear}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full border-collapse border border-black text-[9px] font-sans text-black mb-2 bg-white">
                                <tbody>
                                    <tr className="h-6">
                                        <td rowSpan={2} className="border border-black text-center font-black text-[11px] uppercase w-[12%] px-2">
                                            {quarter === 'summary_final' ? 'FINAL SUMMARY' :
                                             quarter === 'summary_t1' ? 'TERM 1 SUMMARY' :
                                             quarter === 'summary_t2' ? 'TERM 2 SUMMARY' :
                                             quarter === 'summary_t3' ? 'TERM 3 SUMMARY' :
                                             'SUMMARY OF GRADES'}
                                        </td>
                                        <td rowSpan={2} className="border border-black px-2 py-0.5 text-black font-black text-[11px] w-[13%] text-center uppercase leading-tight">
                                            GRADE LEVEL AND<br/>SECTION
                                        </td>
                                        <td rowSpan={2} className="border border-black text-center font-black text-[11px] w-[15%] uppercase px-1 whitespace-nowrap">
                                            {sectionGradeLevel.replace('Grade ', '')} - {selectedSection.replace(sectionGradeLevel.replace('Grade ', ''), '').replace('-', '').trim()}
                                        </td>
                                        <td className="border border-black px-2 py-1 w-[30%] text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">TEACHER:</span>
                                                <span className="uppercase font-bold text-black text-[11px] flex-1 leading-none">{teacherName}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black px-2 py-1 w-[30%] text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">SUBJECT:</span>
                                                <span className="uppercase font-bold text-black text-[11px] truncate flex-1 leading-none" title={subjectName}>{subjectName}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="h-6">
                                        <td className="border border-black px-2 py-1 text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">TRACK:</span>
                                                <span className="uppercase font-bold text-black text-[11px] flex-1 leading-none">{sectionTrack}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black px-2 py-1 text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">SUBJECT TYPE:</span>
                                                <span className="uppercase font-bold text-black text-[11px] flex-1 leading-none">{getSubjectCategory(subjectName, sectionGradeLevel)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="w-full border-collapse border border-black text-[11px] font-sans bg-white text-black">
                                <thead className="print:table-header-group bg-white font-bold uppercase">
                                    <tr className="text-center text-[10px] font-bold bg-gray-100 h-10">
                                        <th className="border border-black w-8"></th>
                                        <th className="border border-black p-2 align-middle w-62.5 text-center tracking-wider">LEARNERS' NAMES</th>
                                        {offeredTerms.map(t => (
                                            <th key={t} className="border border-black p-1 w-20">TERM {t}</th>
                                        ))}
                                        <th className="border border-black p-1 w-22.5">FINAL GRADE</th>
                                        <th className="border border-black p-1 w-25">DESCRIPTOR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={3 + offeredTerms.length} className="bg-gray-200 border border-black text-left px-2 py-0.5 text-[10px] tracking-widest uppercase font-bold">MALE</td>
                                        <td className="bg-gray-200 border border-black"></td>
                                    </tr>
                                    {maleStudents.map((student, i) => {
                                        const summary = getSummaryGrades(student);
                                        const termGrades = [summary.t1, summary.t2, summary.t3];
                                        return (
                                            <tr key={student.lrn} className="h-7 hover:bg-gray-50 transition-colors">
                                                <td className="border border-black text-center font-bold text-[10px]">{i + 1}</td>
                                                <td className="border border-black text-left px-2 uppercase text-[10px] font-bold truncate max-w-62.5">
                                                    {formatStudentFullName(student)}
                                                </td>
                                                {offeredTerms.map(t => (
                                                    <td key={t} className="border border-black text-center font-semibold">{formatGradeForDisplay(termGrades[t - 1], sectionGradeLevel)}</td>
                                                ))}
                                                <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-bold bg-gray-50 text-[9px] text-deped-blue px-1 whitespace-normal wrap-break-word">{summary.descriptor}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td colSpan={3 + offeredTerms.length} className="bg-gray-200 border border-black text-left px-2 py-0.5 text-[10px] tracking-widest uppercase font-bold">FEMALE</td>
                                        <td className="bg-gray-200 border border-black"></td>
                                    </tr>
                                    {femaleStudents.map((student, i) => {
                                        const summary = getSummaryGrades(student);
                                        const termGrades = [summary.t1, summary.t2, summary.t3];
                                        return (
                                            <tr key={student.lrn} className="h-7 hover:bg-gray-50 transition-colors">
                                                <td className="border border-black text-center font-bold text-[10px]">{i + 1}</td>
                                                <td className="border border-black text-left px-2 uppercase text-[10px] font-bold truncate max-w-62.5">
                                                    {formatStudentFullName(student)}
                                                </td>
                                                {offeredTerms.map(t => (
                                                    <td key={t} className="border border-black text-center font-semibold">{formatGradeForDisplay(termGrades[t - 1], sectionGradeLevel)}</td>
                                                ))}
                                                <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-bold bg-gray-50 text-[9px] text-deped-blue px-1 whitespace-normal wrap-break-word">{summary.descriptor}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                    <div className="bg-slate-50/50 dark:bg-[#070a12] p-3 md:p-4 text-black overflow-x-auto">
<div id="printable-class-record" className="bg-white text-black p-3 md:p-5 shadow-xl border border-gray-100 mx-auto transition-all duration-300 rounded-lg" style={{ width: `${Math.max(1300, optimalNameColumnWidth + 1120)}px`, minWidth: `${Math.max(1300, optimalNameColumnWidth + 1120)}px` }}>
                            {[
                                { gender: 'MALE' as const, students: maleStudents },
                                { gender: 'FEMALE' as const, students: femaleStudents }
                            ].map((section, sectionIdx) => (
                                <div key={section.gender} className={`class-record-page bg-white p-2 print:p-0 w-full ${sectionIdx === 0 ? 'print:break-after-page' : 'print:mt-4'}`}>                              <div className="flex flex-col mb-2">
                                   <div className="flex justify-between items-center w-full px-2 mb-1.5">
                                       <div className="w-12 h-12 shrink-0">
                                           <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Seal" className="w-full h-full object-contain" />
                                       </div>
                                       <div className="text-center flex-1 mx-4 text-black">
                                           <h1 className="text-lg md:text-xl font-bold font-sans tracking-tight text-black mb-0">
                                               {isSSHS ? 'Strengthened Senior High School Class Record' : 'Senior High School Class Record'}
                                           </h1>
                                           <p className="text-[8.5px] italic text-blue-600 font-sans mt-0.5 font-medium mb-0">
                                               {isSSHS ? '(Pursuant to DepEd Order 15 series of 2026)' : '(Pursuant to DepEd Order No. 8, s. 2015 and DepEd Order No. 13, s. 2025)'}
                                           </p>
                                       </div>
                                       <div className="w-20 h-12 shrink-0 flex items-center justify-center">
                                           <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                       </div>
                                   </div>

                                   <div className="flex items-stretch justify-between text-[9.5px] font-bold text-black uppercase w-full gap-3">
                                       {/* Left Columns: Region, School Name */}
                                       <div className="flex flex-col gap-0.5 flex-[1.2]">
                                           <div className="flex items-center">
                                               <span className="w-20 text-right pr-2 font-bold text-[9px] shrink-0">REGION</span>
                                               <div className="border border-black px-2 py-0.5 flex-1 bg-white text-center font-bold truncate">{schoolProfile.region}</div>
                                           </div>
                                           <div className="flex items-center">
                                               <span className="w-20 text-right pr-2 font-bold text-[9px] shrink-0">SCHOOL NAME</span>
                                               <div className="border border-black px-2 py-0.5 flex-1 bg-white text-center font-bold truncate">{schoolProfile.name}</div>
                                           </div>
                                       </div>

                                       {/* Middle Columns: Division, School ID */}
                                       <div className="flex flex-col gap-0.5 flex-[1.1]">
                                           <div className="flex items-center">
                                               <span className="w-16 text-right pr-2 font-bold text-[9px] shrink-0">DIVISION</span>
                                               <div className="border border-black px-2 py-0.5 flex-1 bg-white text-center font-bold truncate">{schoolProfile.division}</div>
                                           </div>
                                           <div className="flex items-center">
                                               <span className="w-16 text-right pr-2 font-bold text-[9px] shrink-0">SCHOOL ID</span>
                                               <div className="border border-black px-2 py-0.5 flex-1 bg-white text-center font-bold truncate">{schoolProfile.school_id}</div>
                                           </div>
                                       </div>

                                       {/* Right Column: School Year (spanning full 2-row height) */}
                                       <div className="flex items-center flex-[0.8] justify-end">
                                           <span className="text-right pr-2 font-bold text-[9px] shrink-0">SCHOOL YEAR</span>
                                           <div className="border border-black px-4 py-2.5 bg-white text-center font-bold min-w-28 flex items-center justify-center">{activeSchoolYear}</div>
                                       </div>
                                   </div>
                               </div>

                             <table className="w-full table-fixed border-collapse border-2 border-black text-[9.5px] text-center bg-white text-black font-sans">
                                 <colgroup>
                                     {/* 1. Name */}
                                     <col style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px` }} />

                                     {/* 2..11: WW 1..10 or 1..5 */}
                                     {Array.from({ length: activeWwCount }).map((_, i) => (
                                         <col key={`col-ww-${i}`} style={{ width: '24px' }} />
                                     ))}
                                     {/* WW Total, WW PS, WW WS */}
                                     <col style={{ width: '34px' }} />
                                     <col style={{ width: '38px' }} />
                                     <col style={{ width: '38px' }} />

                                     {/* PT 1..10 or 1..3 */}
                                     {Array.from({ length: activePtCount }).map((_, i) => (
                                         <col key={`col-pt-${i}`} style={{ width: '24px' }} />
                                     ))}
                                     {/* PT Total, PT PS, PT WS */}
                                     <col style={{ width: '34px' }} />
                                     <col style={{ width: '38px' }} />
                                     <col style={{ width: '38px' }} />

                                     {/* EXs: SSHS=8 cols (ST1,ST2,TE,WS ST1,WS ST2,WS TE,PS,WS), G12 K-12=3 cols (TE,PS,WS) */}
                                     {!isZeroExam && isSSHS && (
                                         <>
                                             <col style={{ width: '26px' }} />
                                             <col style={{ width: '26px' }} />
                                             <col style={{ width: '26px' }} />
                                             <col style={{ width: '34px' }} />
                                             <col style={{ width: '34px' }} />
                                             <col style={{ width: '34px' }} />
                                             <col style={{ width: '38px' }} />
                                             <col style={{ width: '38px' }} />
                                         </>
                                     )}
                                     {!isZeroExam && !isSSHS && (
                                         <>
                                             <col style={{ width: '30px' }} />
                                             <col style={{ width: '42px' }} />
                                             <col style={{ width: '42px' }} />
                                         </>
                                     )}

                                     {/* INITIAL GRADE, TERM/QUARTERLY GRADE */}
                                     <col style={{ width: '56px', minWidth: '56px' }} />
                                     <col style={{ width: '56px', minWidth: '56px' }} />
                                 </colgroup>
                                 <thead>
                                     {/* Top Integrated Metadata Rows */}
                                     {!isSSHS ? (
                                         /* OLD SHS GRADE 12 METADATA HEADER LAYOUT */
                                         <>
                                             {/* Row 1 */}
                                             <tr className="h-6 text-[8.5px] font-bold border-b border-black">
                                                 {/* 1. Term Block spanning 2 rows */}
                                                 <th
                                                     rowSpan={2}
                                                     className="border-2 border-black p-0.5 align-middle text-sm font-black uppercase text-center bg-white tracking-wide"
                                                     style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}
                                                 >
                                                     {typeof quarter === 'string' && quarter.startsWith('summary') ? (
                                                         quarter === 'summary_final' ? 'FINAL SUMMARY' :
                                                         quarter === 'summary_t1' ? 'TERM 1 SUMMARY' :
                                                         quarter === 'summary_t2' ? 'TERM 2 SUMMARY' :
                                                         quarter === 'summary_t3' ? 'TERM 3 SUMMARY' :
                                                         'SUMMARY'
                                                     ) : (
                                                         getTermUpperLabel(quarter as any)
                                                     )}
                                                 </th>

                                                 {/* 2. GRADE LEVEL AND SECTION */}
                                                 <th
                                                     rowSpan={2}
                                                     colSpan={colSpanGls}
                                                     className="border-2 border-black p-1 align-middle text-center font-black text-[9px] uppercase bg-white leading-tight"
                                                 >
                                                     GRADE LEVEL AND<br />SECTION
                                                 </th>

                                                 {/* 3. Section Name (e.g. 12 - PACIOLI) */}
                                                 <th
                                                     rowSpan={2}
                                                     colSpan={colSpanSection}
                                                     className="border-2 border-black p-1 align-middle text-center font-black text-[10px] uppercase bg-white truncate"
                                                 >
                                                     {displayGradeNum} - {displaySectionClean}
                                                 </th>

                                                 {/* 4. TEACHER */}
                                                 <th
                                                     colSpan={colSpanTeacher}
                                                     className="border-2 border-black border-b border-b-black px-2 text-left font-black text-[9px] uppercase bg-white truncate"
                                                 >
                                                     <span className="font-black mr-1 text-black">TEACHER:</span>
                                                     <span className="font-black text-black">{teacherName}</span>
                                                 </th>

                                                 {/* 5. SUBJECT */}
                                                 <th
                                                     colSpan={colSpanSubject}
                                                     className="border-2 border-black border-b border-b-black px-2 text-left font-black text-[9px] uppercase bg-white truncate"
                                                 >
                                                     <span className="font-black mr-1 text-black">SUBJECT:</span>
                                                     <span className="font-black text-black">{displaySubjectName}</span>
                                                 </th>
                                             </tr>

                                             {/* Row 2 */}
                                             <tr className="h-6 text-[8.5px] font-bold border-b-2 border-black">
                                                 {/* 4. TRACK */}
                                                 <th
                                                     colSpan={colSpanTeacher}
                                                     className="border-2 border-black border-t-0 px-2 text-left font-black text-[9px] uppercase bg-white truncate"
                                                 >
                                                     <span className="font-black mr-1 text-black">TRACK:</span>
                                                     <span className="font-black text-black">{sectionTrack || displayCluster}</span>
                                                 </th>

                                                 {/* 5. SUBJECT TYPE */}
                                                 <th
                                                     colSpan={colSpanSubject}
                                                     className="border-2 border-black border-t-0 px-2 text-left font-black text-[9px] uppercase bg-white truncate"
                                                 >
                                                     <span className="font-black mr-1 text-black">SUBJECT TYPE:</span>
                                                     <span className="font-black text-black">{subjectType}</span>
                                                 </th>
                                             </tr>
                                         </>
                                     ) : (
                                         /* NEW SSHS GRADE 11 / SSHS GRADE 12 METADATA HEADER LAYOUT */
                                         <>
                                             <tr className="h-5 text-[8.5px] font-bold border-b border-black">
                                                 <th
                                                     rowSpan={2}
                                                     className="border-2 border-black p-0.5 align-middle text-sm md:text-base font-black uppercase text-center bg-white tracking-wide"
                                                     style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}
                                                 >
                                                     {typeof quarter === 'string' && quarter.startsWith('summary') ? (
                                                         quarter === 'summary_final' ? 'FINAL SUMMARY' :
                                                         quarter === 'summary_t1' ? 'TERM 1 SUMMARY' :
                                                         quarter === 'summary_t2' ? 'TERM 2 SUMMARY' :
                                                         quarter === 'summary_t3' ? 'TERM 3 SUMMARY' :
                                                         'SUMMARY'
                                                     ) : (
                                                         getTermUpperLabel(quarter as any)
                                                     )}
                                                 </th>

                                                 {/* GRADE LEVEL */}
                                                 <th colSpan={3} className="border border-black text-center font-bold text-[8.5px] bg-white px-1">
                                                     GRADE LEVEL
                                                 </th>
                                                 <th colSpan={2} className="border border-black text-center font-black text-[9px] bg-white px-1">
                                                     {displayGradeNum}
                                                 </th>

                                                 {/* SECTION */}
                                                 <th colSpan={3} className="border border-black text-center font-bold text-[8.5px] bg-white px-1">
                                                     SECTION
                                                 </th>
                                                 <th colSpan={5} className="border border-black text-center font-black uppercase text-[9px] bg-white px-1 truncate">
                                                     {displaySectionClean}
                                                 </th>

                                                 {/* SUBJECT */}
                                                 <th colSpan={3} className="border border-black text-center font-bold text-blue-600 text-[8.5px] bg-white px-1">
                                                     SUBJECT
                                                 </th>
                                                 <th colSpan={10} className="border border-black text-left pl-2 font-black text-blue-600 uppercase text-[9.5px] bg-white truncate">
                                                     {displaySubjectName}
                                                 </th>

                                                 {/* Over Examinations (8 cols or 3 cols) & Summary Grades (2 cols) */}
                                                 <th colSpan={(!isZeroExam ? (isSSHS ? 8 : 3) : 0) + 2} className="border border-black bg-white"></th>
                                             </tr>

                                             <tr className="h-5 text-[8.5px] font-bold border-b-2 border-black">
                                                 {/* TEACHER */}
                                                 <th colSpan={3} className="border border-black text-center font-bold text-[8.5px] bg-white px-1">
                                                     TEACHER
                                                 </th>
                                                 <th colSpan={10} className="border border-black text-left pl-2 font-black uppercase text-[9px] bg-white truncate">
                                                     {teacherName}
                                                 </th>

                                                 {/* CLUSTER */}
                                                 <th colSpan={3} className="border border-black text-center font-bold text-[8.5px] bg-white px-1">
                                                     CLUSTER
                                                 </th>
                                                 <th colSpan={10} className="border border-black text-left pl-2 font-black uppercase text-[9px] bg-white truncate">
                                                     {displayCluster}
                                                 </th>

                                                 {/* UNITS */}
                                                 {!isZeroExam && (
                                                     <>
                                                         <th colSpan={2} className="border border-black text-center font-bold text-[8px] bg-white px-0.5">
                                                             UNITS
                                                         </th>
                                                         <th colSpan={1} className="border border-black text-center font-black text-[8px] bg-white px-0.5">
                                                             {unitsPerTerm}
                                                         </th>
                                                         <th colSpan={2} className="border border-black text-center text-[7px] italic text-gray-600 font-medium bg-white px-0.5 whitespace-nowrap">
                                                             / TERM
                                                         </th>
                                                         <th colSpan={1} className="border border-black text-center font-black text-[8px] bg-white px-0.5">
                                                             {unitsPerYear}
                                                         </th>
                                                         <th colSpan={2} className="border border-black text-center text-[7px] italic text-gray-600 font-medium bg-white px-0.5 whitespace-nowrap">
                                                             / YEAR
                                                         </th>
                                                     </>
                                                 )}

                                                 {/* Over Summary Grades (2 cols: Initial Grade + Term Grade) */}
                                                 <th colSpan={2} className="border border-black bg-white"></th>
                                             </tr>
                                         </>
                                     )}

                                    {/* Component Titles Row */}
                                    <tr className="h-7.5 border-b border-black">
                                        <th
                                            rowSpan={2}
                                            className="bg-gray-100 border-2 border-black p-0.5 align-middle text-[8.5px] tracking-wide font-black"
                                            style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}
                                        >
                                            LEARNERS' NAMES
                                        </th>
                                        <th colSpan={activeWwCount + 3} className="border-2 border-black px-1 py-0.5 text-center align-middle font-bold text-[8px] tracking-wider bg-blue-100/70">
                                            <div className="font-black text-[8.5px] tracking-wide">WRITTEN / ORAL WORKS (WWs)</div>
                                            <div className="italic font-bold text-[8px]">{Math.round((currentWeights.written_works || 0) * 100)}%</div>
                                        </th>
                                        <th colSpan={activePtCount + 3} className="border-2 border-black px-1 py-0.5 text-center align-middle font-bold text-[8px] tracking-wider bg-green-100/70 leading-tight">
                                            <div className="font-black text-[8.5px] tracking-wide">PRODUCT / PERFORMANCE TASKS (PTs)</div>
                                            <div className="italic font-bold text-[8px]">{Math.round((currentWeights.performance_tasks || 0) * 100)}%</div>
                                        </th>
                                        {!isZeroExam && (
                                            <th colSpan={isSSHS ? 8 : 3} className="border-2 border-black px-1 py-0.5 text-center align-middle font-bold text-[8px] tracking-wider bg-yellow-100/70 leading-tight">
                                                <div className="font-black text-[8.5px] tracking-wide">{isSSHS ? 'EXAMINATIONS (EXs)' : 'TERM EXAM'}</div>
                                                <div className="italic font-bold text-[8px]">{Math.round((currentWeights.quarterly_exam || 0) * 100)}%</div>
                                            </th>
                                        )}
                                        <th rowSpan={2} className="border-2 border-black p-0.5 align-middle bg-yellow-100/70 font-black leading-tight text-[8.5px] text-center whitespace-nowrap">
                                            <div className="leading-tight">INITIAL<br />GRADE</div>
                                        </th>
                                        <th rowSpan={2} className="border-2 border-black p-0.5 align-middle bg-green-100/70 font-black leading-tight text-[8.5px] text-center whitespace-nowrap">
                                            <div className="leading-tight">{isSSHS ? <>TERM<br />GRADE</> : <>QUARTERLY<br />GRADE</>}</div>
                                        </th>
                                    </tr>

                                    {/* Sub-columns Row (1..10, Total, PS, WS, etc.) */}
                                    <tr className="h-5 text-[7.5px] border-b-2 border-black">
                                        {Array.from({ length: activeWwCount }, (_, i) => i + 1).map(i => (
                                            <th key={`ww-${i}`} className="bg-white border border-black font-bold">{i}</th>
                                        ))}
                                        <th className="border border-black bg-blue-100/70 font-bold">TOTAL</th>
                                        <th className="border border-black bg-blue-100/70 font-bold">PS</th>
                                        <th className="border border-black border-r-2 border-r-black bg-blue-200/70 font-bold">WS</th>

                                        {Array.from({ length: activePtCount }, (_, i) => i + 1).map(i => (
                                            <th key={`pt-${i}`} className="bg-white border border-black font-bold">{i}</th>
                                        ))}
                                        <th className="border border-black bg-green-100/70 font-bold">TOTAL</th>
                                        <th className="border border-black bg-green-100/70 font-bold">PS</th>
                                        <th className="border border-black border-r-2 border-r-black bg-green-200/70 font-bold">WS</th>

                                        {/* SSHS: ST1, ST2, TE, WS ST1, WS ST2, WS TE, PS, WS */}
                                        {!isZeroExam && isSSHS && <th className="bg-white border border-black font-bold text-[7.5px]">ST 1</th>}
                                        {!isZeroExam && isSSHS && <th className="bg-white border border-black font-bold text-[7.5px]">ST 2</th>}
                                        {!isZeroExam && <th className="bg-white border border-black font-bold text-[7.5px]">TE</th>}
                                        {!isZeroExam && isSSHS && <th className="border border-black text-[7px] font-bold leading-none bg-yellow-100/70">WS ST1</th>}
                                        {!isZeroExam && isSSHS && <th className="border border-black text-[7px] font-bold leading-none bg-yellow-100/70">WS ST2</th>}
                                        {!isZeroExam && isSSHS && <th className="border border-black text-[7px] font-bold leading-none bg-yellow-100/70">WS TE</th>}
                                        {!isZeroExam && <th className="border border-black bg-yellow-100/70 font-bold text-[7.5px] leading-none">PS</th>}
                                        {!isZeroExam && <th className="border border-black border-r-2 border-r-black bg-yellow-200/70 font-bold text-[7.5px] leading-none">WS</th>}
                                    </tr>

                                    {/* Highest Possible Score Row */}
                                    <tr className="font-bold h-5.5 text-[7.5px] border-b-2 border-black">
                                        <td className="border-2 border-black p-0.5 text-left whitespace-nowrap tracking-wide text-[8px] font-black italic uppercase bg-slate-100" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>
                                            HIGHEST POSSIBLE SCORE
                                        </td>
                                        {hps.ww.map((val, i) => (
                                            <td key={`hps-ww-${i}`} className="bg-white border border-black p-0">
                                                <DebouncedInput
                                                    type="number"
                                                    value={val === '' ? '' : val}
                                                    onChange={(v) => updateHPS('ww', i, v)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, i)}
                                                    data-row={0}
                                                    data-col={i}
                                                    className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-blue-100/50 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-blue-100/80 font-bold">{hps.ww.some(v => v !== '') ? hps.ww.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                        <td className="border border-black bg-blue-100/80 font-bold">100</td>
                                        <td className="border border-black border-r-2 border-r-black bg-blue-200/80 font-black italic">{Math.round((currentWeights.written_works || 0) * 100)}%</td>

                                        {hps.pt.map((val, i) => (
                                            <td key={`hps-pt-${i}`} className="bg-white border border-black p-0">
                                                <DebouncedInput
                                                    type="number"
                                                    value={val === '' ? '' : val}
                                                    onChange={(v) => updateHPS('pt', i, v)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, activeWwCount + i)}
                                                    data-row={0}
                                                    data-col={activeWwCount + i}
                                                    className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-green-100/50 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-green-100/80 font-bold">{hps.pt.some(v => v !== '') ? hps.pt.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                        <td className="border border-black bg-green-100/80 font-bold">100</td>
                                        <td className="border border-black border-r-2 border-r-black bg-green-200/80 font-black italic">{Math.round((currentWeights.performance_tasks || 0) * 100)}%</td>

                                        {/* SSHS: 3 exam HPS inputs (ST1, ST2, TE) + 3 sub-weights + PS + WS = 8 cols */}
                                        {!isZeroExam && isSSHS && hps.qa.map((val, i) => (
                                            <td key={`hps-qa-${i}`} className="bg-white border border-black p-0">
                                                <DebouncedInput
                                                    type="number"
                                                    value={val === '' ? '' : val}
                                                    onChange={(v) => updateHPS('qa', i, v)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, activeWwCount + activePtCount + i)}
                                                    data-row={0}
                                                    data-col={activeWwCount + activePtCount + i}
                                                    className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-yellow-100/50 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        {!isZeroExam && isSSHS && <td className="border border-black bg-yellow-100/70 font-bold italic text-[7px]">30</td>}
                                        {!isZeroExam && isSSHS && <td className="border border-black bg-yellow-100/70 font-bold italic text-[7px]">30</td>}
                                        {!isZeroExam && isSSHS && <td className="border border-black bg-yellow-100/70 font-bold italic text-[7px]">40</td>}
                                        {!isZeroExam && isSSHS && <td className="border border-black bg-yellow-100/80 font-bold">100</td>}
                                        {!isZeroExam && isSSHS && <td className="border border-black border-r-2 border-r-black bg-yellow-200/80 font-black italic">{Math.round((currentWeights.quarterly_exam || 0) * 100)}%</td>}
                                        {/* G12 K-12: 1 exam HPS input (TE) + PS + WS = 3 cols */}
                                        {!isZeroExam && !isSSHS && (
                                            <td className="bg-white border border-black p-0">
                                                <DebouncedInput
                                                    type="number"
                                                    value={hps.qa[2] === '' ? '' : hps.qa[2]}
                                                    onChange={(v) => updateHPS('qa', 2, v)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, activeWwCount + activePtCount)}
                                                    data-row={0}
                                                    data-col={activeWwCount + activePtCount}
                                                    className="w-full h-full text-center bg-transparent outline-none p-0 focus:bg-yellow-100/50 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        )}
                                        {!isZeroExam && !isSSHS && <td className="border border-black bg-yellow-100/80 font-bold">100</td>}
                                        {!isZeroExam && !isSSHS && <td className="border border-black border-r-2 border-r-black bg-yellow-200/80 font-black italic">{Math.round((currentWeights.quarterly_exam || 0) * 100)}%</td>}

                                        {/* Empty cells for Initial Grade & Term Grade */}
                                        <td className="border border-black border-r-2 border-r-black bg-yellow-50/50"></td>
                                        <td className="border-2 border-black bg-green-50/50"></td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-gray-100 font-bold text-left h-5">
                                        <td colSpan={1 + (activeWwCount + 3) + (activePtCount + 3) + (!isZeroExam ? (isSSHS ? 8 : 3) : 0) + 2} className="border-2 border-black px-2 text-[8.5px] uppercase tracking-wider font-black">{section.gender}</td>
                                    </tr>
                                    {section.students.map((student, idx) => {
                                        const record = classRecords.find(r =>
                                            r.student_lrn === student.lrn &&
                                            (r.subject_id === effectiveSubjectId || (subjectName && isMatchingSubject(subjectName, r.subject_id, r.subject_name))) &&
                                            Number(r.quarter) === quarter
                                        );
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
                                                activeWwCount={activeWwCount}
                                                activePtCount={activePtCount}
                                                isZeroExam={isZeroExam}
                                                isSSHS={isSSHS}
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
                                                            <td className="p-1 border-r border-black">{item.key === 'mps' ? summativeAnalysis.st1.norm.mps.toFixed(1) + '%' : (summativeAnalysis.st1.norm as any)[item.key].toFixed(1)}</td>
                                                            <td className="p-1 border-r border-black">{item.key === 'mps' ? summativeAnalysis.st2.norm.mps.toFixed(1) + '%' : (summativeAnalysis.st2.norm as any)[item.key].toFixed(1)}</td>
                                                            <td className="p-1">{item.key === 'mps' ? summativeAnalysis.te.norm.mps.toFixed(1) + '%' : (summativeAnalysis.te.norm as any)[item.key].toFixed(1)}</td>
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
                subject={subjects.find(s => s.id === selectedSubject) || null}
                onClose={() => setIsEnrollmentModalOpen(false)}
            />
        </div>
    );
}
