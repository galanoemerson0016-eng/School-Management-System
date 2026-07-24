/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, Fragment, useEffect, useCallback, memo, useRef } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { Printer, ArrowLeft, ChevronDown, RefreshCcw, Trash2, FileSpreadsheet, Upload, Plus, Minus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { filterSF9Sections } from '../lib/rbac';
import { getSubjectCluster, getWeights, transmuteGrade, computeExamsWeightedScore, formatGradeForDisplay } from '../lib/grading';
import { getSubjectsForGrade, normalizeSubjectName, sortSubjects } from '../lib/subjectConfig';
import { getDefaultTermForSubject } from '../lib/curriculum';
import type { Subject } from '../types';

type QuarterGrades = {
    q1?: QuarterGradeCell;
    q2?: QuarterGradeCell;
    q3?: QuarterGradeCell;
    q4?: QuarterGradeCell;
    final?: number;
};

const isKeyStage1 = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('grade')) {
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        return num >= 1 && num <= 3;
    }
    return false;
};

const isKeyStage2To4 = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('grade')) {
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        return num >= 4 && num <= 12;
    }
    return false;
};

const getDescriptor = (grade: number, gradeLevel: string) => {
    if (!grade || grade <= 0) return '';
    
    // Key Stage 1 (Grades 1-3)
    if (isKeyStage1(gradeLevel)) {
        if (grade >= 90) return 'A';
        if (grade >= 80) return 'B';
        if (grade >= 75) return 'C';
        if (grade >= 65) return 'D';
        return 'E';
    }

    // Key Stage 2 to 4 (Grades 4-12)
    if (grade >= 90) return 'Advancing';
    if (grade >= 80) return 'Benchmarking';
    if (grade >= 75) return 'Connecting';
    if (grade >= 65) return 'Developing';
    return 'Emerging';
};

const isElementaryLevel = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('grade')) {
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        return num >= 1 && num <= 6;
    }
    return false;
};

const getSubjectCategory = (subjectName: string, gradeLevel: string): string => {
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
            "physical science",
            "reading and writing skills",
            "statistics and probability",
            "understanding culture society and politics",
            "understanding culture, society and politics",
            "21st century literature",
            "contemporary philippine arts",
            "pe and health 3",
            "pe and health 4"
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








    

type QuarterKey = 'q1' | 'q2' | 'q3' | 'q4';

type QuarterGradeDetail = {
    value: number;
    musicArts?: number | null;
    peHealth?: number | null;
    effectiveComm?: number | null;
    mabisangKom?: number | null;
};

type QuarterGradeCell = number | QuarterGradeDetail;

type StudentGradeRow = Record<string, QuarterGrades> & {
    generalAverage?: string;
    termAverage?: string;
};

type GradesData = Record<string, StudentGradeRow>;

type VirtualSectionSubject = Subject & { 
    is_virtual?: boolean;
    _mapehGroups?: { 
        musicArts: Subject[], 
        peHealth: Subject[] 
    };
    _ecmkGroups?: {
        effectiveComm: Subject[],
        mabisangKom: Subject[]
    }
};

const isQuarterGradeDetail = (value: QuarterGradeCell | undefined): value is QuarterGradeDetail => {
    return typeof value === 'object' && value !== null;
};

const getQuarterGradeValue = (value: QuarterGradeCell | undefined) => {
    return isQuarterGradeDetail(value) ? value.value : value;
};

const getQuarterGradeDetail = (value: QuarterGradeCell | undefined) => {
    return isQuarterGradeDetail(value) ? value : undefined;
};

const SUBJECT_COLUMN_WIDTH = 55;
const MAPEH_SUBCOLUMN_WIDTH = 48;
const ECMK_SUBCOLUMN_WIDTH = 80;

const isEcmkParent = (name: string) => name.toLowerCase().includes('effective communication') && name.toLowerCase().includes('mabisang komunikasyon');
const GENERAL_AVERAGE_COLUMN_WIDTH = 66;
const AVERAGE_COLUMN_WIDTH = GENERAL_AVERAGE_COLUMN_WIDTH;
const showLegacyQuarter4 = false;










const GradeInput = ({ 
    studentLrn, subjectId, quarter, value, className, activeSchoolYear, 
    subjects, sectionObj, updateGradingSheetRecord, row, col
}: any) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const valueRef = useRef(value);

    useEffect(() => {
        valueRef.current = value;
        setLocalValue(value || '');
    }, [value]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const saveChanges = async (targetVal: string) => {
        if (targetVal === valueRef.current) return;

        const valNum = Number(targetVal);
        if (targetVal !== '' && (isNaN(valNum) || valNum < 0 || valNum > 100)) {
            useAppStore.getState().showNotification('Grades must be between 0 and 100.', 'error');
            setLocalValue(valueRef.current || '');
            return;
        }

        setIsSaving(true);
        try {
            const recordId = `${studentLrn}_${subjectId}_${quarter}_${activeSchoolYear}`;
            const subject = subjects.find((s: any) => s.id === subjectId);
            const section = sectionObj;

            if (!subject || !section) {
                console.error("Subject or Section not found for grading record");
                return;
            }

            await updateGradingSheetRecord({
                id: recordId,
                student_lrn: studentLrn,
                subject_id: subjectId,
                section_id: section.id,
                quarter: quarter as 1 | 2 | 3,
                school_year: activeSchoolYear,
                final_grade: targetVal || 0,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0
            });
            valueRef.current = targetVal;
        } catch (error) {
            console.error("Failed to update grading record", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBlur = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        saveChanges(localValue);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            saveChanges(val);
        }, 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
            return;
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();

            const row = parseInt((e.target as HTMLElement).getAttribute('data-row') || '0');
            const col = parseInt((e.target as HTMLElement).getAttribute('data-col') || '0');
            
            let targetRow = row;
            let targetCol = col;

            if (e.key === 'ArrowLeft') targetCol = col - 1;
            else if (e.key === 'ArrowRight') targetCol = col + 1;
            else if (e.key === 'ArrowUp') targetRow = row - 1;
            else if (e.key === 'ArrowDown') targetRow = row + 1;

            const target = document.querySelector(`.consolidated-grades-table .grade-input-field[data-row="${targetRow}"][data-col="${targetCol}"]`) as HTMLInputElement;
            
            if (target) {
                target.focus();
                target.select();
            }
        }
    };

    return (
        <div className="relative w-full h-full group">
            <input
                type="number"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                data-row={row}
                data-col={col}
                className={`grade-input-field w-full h-full bg-transparent text-center focus:bg-blue-50 focus:outline-none transition-colors border-none p-0 hide-number-arrows text-[9px] font-medium ${isSaving ? 'opacity-50' : ''} ${className || ''}`}
                style={{ appearance: 'none', MozAppearance: 'textfield' }}
            />
            {/* Subtle hover indicator */}
            <div className="absolute inset-0 border border-transparent group-hover:border-blue-200 pointer-events-none transition-colors"></div>
            {isSaving && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                </div>
            )}
        </div>
    );
};

const WW_COUNT = 5;
const PT_COUNT = 3;
const ST_COUNT = 3;

const normalizeScores = (scores: (number | string)[] | undefined, count: number): (number | string)[] => {
    const src = Array.isArray(scores) ? scores : [];
    return Array.from({ length: count }, (_, i) => src[i] ?? '');
};

const formatLearnerName = (student: any) => {
    const middleInitial = typeof student.middle_name === 'string' && student.middle_name ? `${student.middle_name.charAt(0)}.` : '';
    return `${student.last_name || ''}, ${student.first_name || ''} ${middleInitial}`.trim().replace(/\s+/g, ' ').toUpperCase();
};

interface StudentGradeRowProps {
    student: any;
    studentRow: number;
    data: any;
    activeQuarterTerm: string | null;
    isElementary: boolean;
    learnerNameColumnWidth: number;
    subjectColumns: any[];
    selectedTerm: string;
    activeSchoolYear: string;
    subjects: any[];
    sectionObj: any;
    updateGradingSheetRecord: any;
    subjectColumnWidth: number;
    showGenAvg: boolean;
    showDescriptor: boolean;
    descriptorGradeLevel: string;
}

const areEqual = (prev: StudentGradeRowProps, next: StudentGradeRowProps) => {
    if (prev.studentRow !== next.studentRow) return false;
    if (prev.isElementary !== next.isElementary) return false;
    if (prev.learnerNameColumnWidth !== next.learnerNameColumnWidth) return false;
    if (prev.selectedTerm !== next.selectedTerm) return false;
    if (prev.activeSchoolYear !== next.activeSchoolYear) return false;
    if (prev.subjectColumnWidth !== next.subjectColumnWidth) return false;
    if (prev.showGenAvg !== next.showGenAvg) return false;
    if (prev.showDescriptor !== next.showDescriptor) return false;
    if (prev.descriptorGradeLevel !== next.descriptorGradeLevel) return false;
    if (prev.student?.lrn !== next.student?.lrn) return false;
    if (prev.sectionObj !== next.sectionObj) return false;
    
    if (prev.subjectColumns?.length !== next.subjectColumns?.length) return false;
    
    const prevData = prev.data || {};
    const nextData = next.data || {};
    
    if (prevData.termAverage !== nextData.termAverage) return false;
    if (prevData.generalAverage !== nextData.generalAverage) return false;
    
    const keys = prev.subjectColumns.map(col => col.subject.id);
    for (const key of keys) {
        const pSub = prevData[key] || {};
        const nSub = nextData[key] || {};
        
        if (typeof pSub === 'object' && typeof nSub === 'object') {
            if (pSub.value !== nSub.value) return false;
            if (pSub.musicArts !== nSub.musicArts) return false;
            if (pSub.peHealth !== nSub.peHealth) return false;
            if (pSub.effectiveComm !== nSub.effectiveComm) return false;
            if (pSub.mabisangKom !== nSub.mabisangKom) return false;
        } else {
            if (pSub.q1 !== nSub.q1) return false;
            if (pSub.q2 !== nSub.q2) return false;
            if (pSub.q3 !== nSub.q3) return false;
            if (pSub.q4 !== nSub.q4) return false;
            if (pSub.final !== nSub.final) return false;
        }
    }
    
    return true;
};

const StudentGradeRow = memo(({
    student,
    studentRow,
    data,
    activeQuarterTerm,
    isElementary,
    learnerNameColumnWidth,
    subjectColumns,
    selectedTerm,
    activeSchoolYear,
    subjects,
    sectionObj,
    updateGradingSheetRecord,
    subjectColumnWidth,
    showGenAvg,
    showDescriptor,
    descriptorGradeLevel,
}: StudentGradeRowProps) => {
    const colIndices = useMemo(() => {
        const indices: number[] = [];
        let currentIndex = 0;
        for (let i = 0; i < subjectColumns.length; i++) {
            const column = subjectColumns[i];
            indices.push(currentIndex);
            if (selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() === 'MAPEH' && column.subject._mapehGroups) {
                currentIndex += 2;
            } else if (selectedTerm !== 'all' && isEcmkParent(column.subject.subject_name) && column.subject._ecmkGroups) {
                currentIndex += 2;
            } else if (selectedTerm !== 'all') {
                currentIndex += 1;
            }
        }
        return indices;
    }, [subjectColumns, selectedTerm]);

    return (
        <tr className="hover:bg-blue-50/20">
            <td className={`consolidated-learner-name border border-black ${isElementary ? 'p-0.5 pl-1.5' : 'p-1 pl-2'} font-medium truncate whitespace-nowrap uppercase`} style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px`, maxWidth: `${learnerNameColumnWidth}px` }}>
                <span className="inline-block w-4 text-gray-500 mr-1 text-[7px] text-center font-bold tracking-tighter">
                    {studentRow + 1}
                </span> 
                {formatLearnerName(student)}
            </td>
            {subjectColumns.map((column, index) => {
                const sData = data[column.subject.id] || {};
                const currentCol = colIndices[index];
                return (
                    <Fragment key={`${student.lrn}-${column.baseId}-${index}`}>
                        {selectedTerm !== 'all' && (column.subject as any)._mapehGroups ? (
                            <>
                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>
                                    {activeQuarterTerm && column.subject._mapehGroups?.musicArts[0] && (
                                        <GradeInput
                                            studentLrn={student.lrn}
                                            subjectId={column.subject._mapehGroups.musicArts[0].id}
                                            quarter={parseInt(activeQuarterTerm.replace('q', ''))}
                                            value={getQuarterGradeDetail(sData[activeQuarterTerm])?.musicArts}
                                            activeSchoolYear={activeSchoolYear}
                                            subjects={subjects}
                                            sectionObj={sectionObj}
                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                            row={studentRow} col={currentCol}
                                        />
                                    )}
                                </td>
                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>
                                    {activeQuarterTerm && column.subject._mapehGroups?.peHealth[0] && (
                                        <GradeInput
                                            studentLrn={student.lrn}
                                            subjectId={column.subject._mapehGroups.peHealth[0].id}
                                            quarter={parseInt(activeQuarterTerm.replace('q', ''))}
                                            value={getQuarterGradeDetail(sData[activeQuarterTerm])?.peHealth}
                                            activeSchoolYear={activeSchoolYear}
                                            subjects={subjects}
                                            sectionObj={sectionObj}
                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                            row={studentRow} col={currentCol + 1}
                                        />
                                    )}
                                </td>
                                <td className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-semibold" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>{activeQuarterTerm ? (getQuarterGradeValue(sData[activeQuarterTerm]) || '') : ''}</td>
                            </>
                        ) : selectedTerm !== 'all' && isEcmkParent(column.subject.subject_name) ? (
                            <>
                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums" style={{ width: `${ECMK_SUBCOLUMN_WIDTH}px`, minWidth: `${ECMK_SUBCOLUMN_WIDTH}px`, maxWidth: `${ECMK_SUBCOLUMN_WIDTH}px` }}>
                                    {activeQuarterTerm && column.subject._ecmkGroups?.effectiveComm[0] && (
                                        <GradeInput
                                            studentLrn={student.lrn}
                                            subjectId={column.subject._ecmkGroups.effectiveComm[0].id}
                                            quarter={parseInt(activeQuarterTerm.replace('q', ''))}
                                            value={getQuarterGradeDetail(sData[activeQuarterTerm])?.effectiveComm}
                                            activeSchoolYear={activeSchoolYear}
                                            subjects={subjects}
                                            sectionObj={sectionObj}
                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                            row={studentRow} col={currentCol}
                                        />
                                    )}
                                </td>
                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums" style={{ width: `${ECMK_SUBCOLUMN_WIDTH}px`, minWidth: `${ECMK_SUBCOLUMN_WIDTH}px`, maxWidth: `${ECMK_SUBCOLUMN_WIDTH}px` }}>
                                    {activeQuarterTerm && column.subject._ecmkGroups?.mabisangKom[0] && (
                                        <GradeInput
                                            studentLrn={student.lrn}
                                            subjectId={column.subject._ecmkGroups.mabisangKom[0].id}
                                            quarter={parseInt(activeQuarterTerm.replace('q', ''))}
                                            value={getQuarterGradeDetail(sData[activeQuarterTerm])?.mabisangKom}
                                            activeSchoolYear={activeSchoolYear}
                                            subjects={subjects}
                                            sectionObj={sectionObj}
                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                            row={studentRow} col={currentCol + 1}
                                        />
                                    )}
                                </td>
                                <td className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-semibold bg-gray-200" style={{ width: `${ECMK_SUBCOLUMN_WIDTH}px`, minWidth: `${ECMK_SUBCOLUMN_WIDTH}px`, maxWidth: `${ECMK_SUBCOLUMN_WIDTH}px` }}>{activeQuarterTerm ? (getQuarterGradeValue(sData[activeQuarterTerm]) || '') : ''}</td>
                            </>
                        ) : (
                            <>
                                {(selectedTerm === 'q1' || selectedTerm === 'all') && (
                                    <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>
                                        {selectedTerm === 'q1' ? (
                                            <GradeInput 
                                                studentLrn={student.lrn} 
                                                subjectId={column.subject.id} 
                                                quarter={1} 
                                                value={sData.q1} 
                                                activeSchoolYear={activeSchoolYear}
                                                subjects={subjects}
                                                sectionObj={sectionObj}
                                                updateGradingSheetRecord={updateGradingSheetRecord}
                                                row={studentRow} col={currentCol}
                                            />
                                            ) : (formatGradeForDisplay(getQuarterGradeValue(sData.q1), sectionObj?.section_grade_level || '') || '')}
                                    </td>
                                )}
                                {(selectedTerm === 'q2' || selectedTerm === 'all') && (
                                    <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>
                                        {selectedTerm === 'q2' ? (
                                            <GradeInput 
                                                studentLrn={student.lrn} 
                                                subjectId={column.subject.id} 
                                                quarter={2} 
                                                value={sData.q2} 
                                                activeSchoolYear={activeSchoolYear}
                                                subjects={subjects}
                                                sectionObj={sectionObj}
                                                updateGradingSheetRecord={updateGradingSheetRecord}
                                                row={studentRow} col={currentCol}
                                            />
                                            ) : (formatGradeForDisplay(getQuarterGradeValue(sData.q2), sectionObj?.section_grade_level || '') || '')}
                                    </td>
                                )}
                                {(selectedTerm === 'q3' || selectedTerm === 'all') && (
                                    <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>
                                        {selectedTerm === 'q3' ? (
                                            <GradeInput 
                                                studentLrn={student.lrn} 
                                                subjectId={column.subject.id} 
                                                quarter={3} 
                                                value={sData.q3} 
                                                activeSchoolYear={activeSchoolYear}
                                                subjects={subjects}
                                                sectionObj={sectionObj}
                                                updateGradingSheetRecord={updateGradingSheetRecord}
                                                row={studentRow} col={currentCol}
                                            />
                                            ) : (formatGradeForDisplay(getQuarterGradeValue(sData.q3), sectionObj?.section_grade_level || '') || '')}
                                    </td>
                                )}
                                {selectedTerm === 'all' && <td className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-bold bg-gray-200" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>{formatGradeForDisplay(sData.final, sectionObj?.section_grade_level || '') || ''}</td>}
                            </>
                        )}
                    </Fragment>
                );
            })}
            {showGenAvg && (
                <>
                    <td className={`consolidated-average-col border border-black ${isElementary ? 'p-0.5' : 'p-1'} text-center font-bold bg-gray-50/50 tabular-nums`} style={{ width: `${AVERAGE_COLUMN_WIDTH}px`, minWidth: `${AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${AVERAGE_COLUMN_WIDTH}px` }}>{data.termAverage || ''}</td>
                    <td className={`consolidated-general-average-col border border-black ${isElementary ? 'p-0.5' : 'p-1'} text-center font-bold bg-gray-100/50 tabular-nums`} style={{ width: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, minWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px` }}>{data.generalAverage || ''}</td>
                    {showDescriptor && (
                        <td className="consolidated-descriptor-col border border-black p-1 text-center font-bold bg-gray-200 text-[6px] leading-tight uppercase" style={{ width: `100px`, minWidth: `100px`, maxWidth: `100px` }}>
                            {data.generalAverage ? getDescriptor(Number(data.generalAverage), descriptorGradeLevel || "") : ''}
                        </td>
                    )}
                </>
            )}
        </tr>
    );
}, areEqual);

export function ConsolidatedGradesPage() {
    

    const {
        sections, subjects, students, gradingSheetRecords, updateGradingSheetRecord,
        activeSchoolYear, schoolProfile, setCurrentView,
        selectedSection, setSelectedSection, classRecords, hpsRecords, showNotification
    } = useAppStore();
    const { user } = useAuthStore();

    const [selectedTerm, setSelectedTerm] = useState<'q1' | 'q2' | 'q3' | 'all'>('q1');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [zoom, setZoom] = useState(0.9);
    const [sheetWidth, setSheetWidth] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const showGenAvg = selectedTerm !== 'all';

    // Derived State
    const sectionObj = useMemo(() => sections.find(s => s.id === selectedSection || s.section_name === selectedSection), [sections, selectedSection]);

    // ADVISORY CHECK: Is the current user the adviser of this section?
    const isAdviser = useMemo(() => {
        if (!sectionObj || !user) return false;
        
        // 1. Check by ID if available
        if (sectionObj.adviser_id === user.uid) return true;
        
        // 2. Check by Name if ID is missing (fallback)
        const profileAdviser = (schoolProfile.adviser_name || '').trim().toLowerCase();
        const sectionAdviser = (sectionObj.adviser_name || '').trim().toLowerCase();
        const userDisplayName = (user.displayName || '').trim().toLowerCase();
        
        // Match either the school profile adviser or the section-specific adviser name
        return (userDisplayName !== '' && (userDisplayName === profileAdviser || userDisplayName === sectionAdviser)) || sectionObj.is_advisory === true;
    }, [sectionObj, user, schoolProfile.adviser_name]);

    const handleSyncFromEClass = async () => {
        if (!sectionObj || !isAdviser || selectedTerm === 'all') {
            showNotification('Sync is only available for specific terms (Q1-Q3) in your Advisory Class.', 'info');
            return;
        }

        const quarter = parseInt(selectedTerm.replace('q', '')) as 1 | 2 | 3;
        const sectionGradeLevel = sectionObj.section_grade_level || '';
        let sectionTrack = 'Academic Track';
        if (sectionObj.track) {
            const tr = sectionObj.track;
            if (tr === 'Academic') {
                if (sectionObj.strand) {
                    sectionTrack = `Academic - ${sectionObj.strand}`;
                } else {
                    sectionTrack = 'Academic Track';
                }
            } else if (tr === 'TechPro') {
                sectionTrack = 'TechPro Track';
            } else if (tr === 'TVL') {
                sectionTrack = 'Technical-Vocational-Livelihood (TVL)';
            } else {
                sectionTrack = `${tr} Track`;
            }
        } else {
            const trackNorm = (sectionObj.section_name || '').toUpperCase();
            if (trackNorm.includes('STEM')) sectionTrack = 'Academic - STEM';
            else if (trackNorm.includes('ABM')) sectionTrack = 'Academic - ABM';
            else if (trackNorm.includes('HUMSS')) sectionTrack = 'Academic - HUMSS';
            else if (trackNorm.includes('GAS')) sectionTrack = 'Academic - GAS';
            else if (trackNorm.includes('TVL') || trackNorm.includes('TECHPRO') || trackNorm.includes('HE') || trackNorm.includes('ICT')) sectionTrack = 'Technical-Vocational-Livelihood (TVL)';
        }

        setIsSyncing(true);
        let syncCount = 0;

        try {
            // Process each student in the section
            for (const student of sectionStudents) {
                // Process each subject in the section
                for (const subject of sectionSubjects) {
                    if (subject.is_virtual && ((subject as any)._mapehGroups || isEcmkParent(subject.subject_name))) continue;

                    // 1. Find HPS for this subject/quarter
                    const hpsRec = hpsRecords.find(r => 
                        r.subject_id === subject.id && 
                        r.school_year === activeSchoolYear && 
                        Number(r.quarter) === quarter
                    );

                    if (!hpsRec) continue; // No E-Class setup for this subject yet

                    // 2. Find Student Record
                    const record = classRecords.find(r => 
                        r.student_lrn === student.lrn && 
                        r.subject_id === subject.id && 
                        Number(r.quarter) === quarter
                    );

                    if (!record) continue;

                    // 3. Calculation Logic (Matching EClassRecord.tsx)
                    const hps_ww = normalizeScores(hpsRec.written_works, WW_COUNT).map(v => v === '' ? 0 : Number(v));
                    const hps_pt = normalizeScores(hpsRec.performance_tasks, PT_COUNT).map(v => v === '' ? 0 : Number(v));
                    const rawHpsQa = (hpsRec as any).summative_tests;
                    const hps_qa = normalizeScores(rawHpsQa, ST_COUNT).map((v, i) => {
                        if (i === 2 && (v === undefined || v === '')) return Number(hpsRec.quarterly_exam) || 0;
                        return Number(v) || 0;
                    });

                    const wwScores = normalizeScores(record.written_works, WW_COUNT).map(v => Number(v) || 0);
                    const ptScores = normalizeScores(record.performance_tasks, PT_COUNT).map(v => Number(v) || 0);
                    const rawQa = (record as any).summative_tests;
                    const qaScores = normalizeScores(rawQa, ST_COUNT).map((v, i) => {
                        if (i === 2 && (v === undefined || v === '')) return Number(record.quarterly_exam) || 0;
                        return Number(v) || 0;
                    });

                    const wwTotalScore = wwScores.reduce((a, b) => a + b, 0);
                    const wwTotalHPS = hps_ww.reduce((a, b) => a + b, 0);
                    const ptTotalScore = ptScores.reduce((a, b) => a + b, 0);
                    const ptTotalHPS = hps_pt.reduce((a, b) => a + b, 0);

                    const cluster = getSubjectCluster(subject.subject_name, sectionGradeLevel, sectionTrack);
                    const weights = getWeights(cluster, subject);
                    const wwWS = wwTotalHPS === 0 ? 0 : (wwTotalScore / wwTotalHPS) * 100 * weights.written_works;
                    const ptWS = ptTotalHPS === 0 ? 0 : (ptTotalScore / ptTotalHPS) * 100 * weights.performance_tasks;

                    const st1Score = qaScores[0] || 0;
                    const st1HPS = hps_qa[0] || 0;
                    const st2Score = qaScores[1] || 0;
                    const st2HPS = hps_qa[1] || 0;
                    const teScore = qaScores[2] || 0;
                    const teHPS = hps_qa[2] || 0;

                    const qaPS = computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, cluster);
                    const qaWS = qaPS * weights.quarterly_exam;

                    const initialGrade = wwWS + ptWS + qaWS;
                    const finalGrade = transmuteGrade(initialGrade, activeSchoolYear);

                    if (finalGrade > 0) {
                        await updateGradingSheetRecord({
                            id: `${student.lrn}_${subject.id}_${quarter}_${activeSchoolYear}`,
                            student_lrn: student.lrn,
                            subject_id: subject.id,
                            section_id: sectionObj.id,
                            quarter: quarter as 1 | 2 | 3,
                            school_year: activeSchoolYear,
                            final_grade: finalGrade,
                            written_works: [],
                            performance_tasks: [],
                            quarterly_exam: 0
                        });
                        syncCount++;
                    }
                }
            }
            showNotification(`Successfully synced ${syncCount} grades from E-Class Records!`, 'success');
        } catch (error) {
            console.error('Sync error:', error);
            showNotification('Failed to sync grades. Please check your connection.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExportTemplate = () => {
        if (!sectionObj || selectedTerm === 'all') {
            showNotification('Please select a specific term to download a template.', 'info');
            return;
        }

        const termLabel = TERM_LABELS[selectedTerm];
        const wb = XLSX.utils.book_new();

        const subjectsToExport: VirtualSectionSubject[] = [];
        sectionSubjects.forEach(sub => {
            if (sub.subject_name.toUpperCase() === 'MAPEH') {
                if (sub._mapehGroups) {
                    subjectsToExport.push(...(sub._mapehGroups.musicArts || []));
                    subjectsToExport.push(...(sub._mapehGroups.peHealth || []));
                } else {
                    subjectsToExport.push(sub);
                }
            } else if (isEcmkParent(sub.subject_name)) {
                if (sub._ecmkGroups) {
                    subjectsToExport.push(...(sub._ecmkGroups.effectiveComm || []));
                    subjectsToExport.push(...(sub._ecmkGroups.mabisangKom || []));
                }
            } else {
                subjectsToExport.push(sub);
            }
        });

        subjectsToExport.forEach(subject => {
            // 1. Create Metadata Rows (Rows 1-5)
            const metadata = [
                ['SUBJECT_ID:', subject.id],
                ['SUBJECT_NAME:', subject.subject_name],
                ['SECTION:', sectionObj.section_name],
                ['TERM:', termLabel],
                ['INSTRUCTIONS:', 'PLEASE DO NOT EDIT COLUMNS A & B. INPUT GRADES IN COLUMN C ONLY.']
            ];

            // 2. Create Data Headers (Row 6)
            const headers = [['LRN', 'Learner Name', 'Grade']];

            // 3. Create Student Rows (Separated by Gender and Alphabetical)
            const maleRows = maleStudents.map(student => [
                student.lrn,
                formatLearnerName(student),
                ''
            ]);

            const femaleRows = femaleStudents.map(student => [
                student.lrn,
                formatLearnerName(student),
                ''
            ]);

            // Combine all rows with Gender Headers
            const allRows = [
                ...metadata,
                [''], // Spacer
                ...headers,
                ['MALE', '', ''],
                ...maleRows,
                [''], // Spacer
                ['FEMALE', '', ''],
                ...femaleRows
            ];

            // Create Worksheet
            const ws = XLSX.utils.aoa_to_sheet(allRows);
            
            // Set column widths
            ws['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 10 }];
            
            XLSX.utils.book_append_sheet(wb, ws, subject.subject_name.substring(0, 31));
        });

        const fileName = `Grading_Template_${sectionObj.section_name}_${termLabel}_${activeSchoolYear}.xlsx`.replace(/\s+/g, '_');
        XLSX.writeFile(wb, fileName);
        showNotification('Professional grading template downloaded!', 'success');
    };

    const handleImportGrades = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !sectionObj || selectedTerm === 'all') return;

        const quarter = parseInt(selectedTerm.replace('q', '')) as 1 | 2 | 3;
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                let importCount = 0;
                let skipCount = 0;

                for (const sheetName of workbook.SheetNames) {
                    const ws = workbook.Sheets[sheetName];
                    // Convert to AOA (Array of Arrays) to read metadata from specific cells
                    const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    
                    if (aoa.length < 6) continue;

                    // Extract Subject ID from Row 1, Col 2 (Cell B1)
                    const subjectId = String(aoa[0][1] || '').trim();
                    const subject = subjects.find(s => s.id === subjectId);

                    if (!subject) {
                        console.warn(`Subject ID ${subjectId} in sheet ${sheetName} not found in system.`);
                        continue;
                    }

                    // Data starts from Row 7 (Index 6)
                    const dataRows = aoa.slice(6);

                    for (const row of dataRows) {
                        const lrn = String(row[0] || '').trim();
                        const grade = parseFloat(row[2]); // Grade is in column 3 (Index 2)

                        if (lrn && !isNaN(grade) && grade >= 0) {
                            if (grade < 0 || grade > 100) {
                                skipCount++;
                                continue;
                            }
                            
                            await updateGradingSheetRecord({
                                id: `${lrn}_${subject.id}_${quarter}_${activeSchoolYear}`,
                                student_lrn: lrn,
                                subject_id: subject.id,
                                section_id: sectionObj.id,
                                quarter: quarter,
                                school_year: activeSchoolYear,
                                final_grade: grade,
                                written_works: [],
                                performance_tasks: [],
                                quarterly_exam: 0
                            });
                            importCount++;
                        }
                    }
                }

                if (skipCount > 0) {
                    showNotification(`Imported ${importCount} grades. ${skipCount} grades were skipped because they were not between 0 and 100.`, 'info');
                } else {
                    showNotification(`Successfully imported ${importCount} grades with ID matching!`, 'success');
                }
                e.target.value = '';
            } catch (error) {
                console.error('Import error:', error);
                showNotification('Failed to import Excel file. Please use the official template.', 'error');









            }
        };

        reader.readAsArrayBuffer(file);
    };

    const availableSections = useMemo(() => {
        const filtered = filterSF9Sections(user, sections);
        return filtered.sort((a, b) => {
            const getGrade = (g: string) => {
                const match = g.match(/\d+/);
                return match ? parseInt(match[0], 10) : 999;
            };
            const gradeA = getGrade(a.section_grade_level);
            const gradeB = getGrade(b.section_grade_level);

            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user]);

const groupedSections = useMemo(() => {
        const groups: Record<string, any[]> = {
            'ELEMENTARY': [],
            'JUNIOR HIGH SCHOOL': [],
            'SENIOR HIGH SCHOOL': []
        };
        
        availableSections.forEach(s => {
            const gl = (s.section_grade_level || '').toLowerCase();
            const num = parseInt(gl.replace(/\D/g, '')) || 0;
            
            if (gl.includes('kinder') || (num >= 1 && num <= 6)) {
                groups['ELEMENTARY'].push(s);
            } else if (num >= 7 && num <= 10) {
                groups['JUNIOR HIGH SCHOOL'].push(s);
            } else if (num >= 11 && num <= 12) {
                groups['SENIOR HIGH SCHOOL'].push(s);
            }
        });
        
        return groups;
    }, [availableSections]);

    const TERM_LABELS = {
        q1: 'First Term',
        q2: 'Second Term',
        q3: 'Third Term',
        all: 'Final & General Average'
    };

    // Update selectedSection if it's no longer available
    useEffect(() => {
        if (selectedSection && availableSections.length > 0) {
            const exists = availableSections.some(s => s.section_name === selectedSection);
            if (!exists) {
                const advisory = availableSections.find(s => s.is_advisory);
                setSelectedSection(advisory ? advisory.section_name : availableSections[0].section_name);
            }
        } else if (!selectedSection && availableSections.length > 0) {
            const advisory = availableSections.find(s => s.is_advisory);
            setSelectedSection(advisory ? advisory.section_name : availableSections[0].section_name);
        }
    }, [availableSections, selectedSection, setSelectedSection]);

    // SECTION SUBJECTS - Strictly following the Subjects Page (Source of Truth)
    const sectionSubjects = useMemo(() => {
        if (!sectionObj) return [];

        // 1. Get the official list of subjects for this grade level from the curriculum
        const intendedSubjects = getSubjectsForGrade(sectionObj.section_grade_level, schoolProfile.curriculum);
        
        // 2. Get all actual subject records for this section or grade level from the database
        const sectionGradeNum = parseInt(sectionObj.section_grade_level.replace(/\D/g, '')) || 0;
        const isSHS = sectionGradeNum === 11 || sectionGradeNum === 12;
        
        const getEffectiveTerm = (s: Subject) => {
            if (s.term !== undefined && s.term !== null) return s.term;
            return getDefaultTermForSubject(s.subject_name, s.grade_level);
        };

        let sectionDbSubjects = subjects.filter(s => s.section_id === sectionObj.id && getEffectiveTerm(s) !== 'none');
        
        // If no section-specific subjects exist, look for grade-level templates
        if (sectionDbSubjects.length === 0) {
            sectionDbSubjects = subjects.filter(s => {
                const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
                return !s.section_id && subjectGradeNum === sectionGradeNum && getEffectiveTerm(s) !== 'none';
            });
        }

        // Filter based on the selected term (quarter) if it's a specific term (1, 2, 3)
        if (selectedTerm !== 'all') {
            const termNum = selectedTerm === 'q1' ? 1 : selectedTerm === 'q2' ? 2 : selectedTerm === 'q3' ? 3 : null;
            if (termNum !== null) {
                sectionDbSubjects = sectionDbSubjects.filter(s => {
                    const effTerm = getEffectiveTerm(s);
                    return effTerm === 'all' || Number(effTerm) === termNum;
                });
            }
        }

        // 3. Determine the base list of subjects
        // If there are actual subjects in the DB for this section, we use those as the primary source.
        // If the section is new/empty, we fall back to the curriculum/standard list.
        let baseList: VirtualSectionSubject[] = [];

        if (sectionDbSubjects.length > 0) {
            // Use existing DB subjects
            baseList = sectionDbSubjects.map(s => ({ ...s, is_virtual: false } as VirtualSectionSubject));
            
            // Special Case: If we have MAPEH components but no MAPEH header row in the DB, create a virtual one
            const hasMapehHeader = !isSHS && sectionDbSubjects.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');
            const hasMapehComponents = !isSHS && sectionDbSubjects.some(s => {
                const n = normalizeSubjectName(s.subject_name);
                return n.includes('musicandarts') || n.includes('musicarts') || 
                       n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth');
            });

            if (hasMapehComponents && !hasMapehHeader) {
                baseList.push({
                    id: `virtual-mapeh-${sectionObj.id}`,
                    subject_name: 'MAPEH',
                    section_id: sectionObj.id,
                    grade_level: sectionObj.section_grade_level,
                    is_virtual: true
                } as VirtualSectionSubject);
            }

            // Special Case: If we have both EC and MK components but no parent header, create a virtual one
            const hasEcmkHeader = sectionDbSubjects.some(s => isEcmkParent(s.subject_name));
            const hasEc = sectionDbSubjects.some(s => normalizeSubjectName(s.subject_name) === 'effectivecommunication');
            const hasMk = sectionDbSubjects.some(s => normalizeSubjectName(s.subject_name) === 'mabisangkomunikasyon');

            if (hasEc && hasMk && !hasEcmkHeader) {
                baseList.push({
                    id: `virtual-ecmk-${sectionObj.id}`,
                    subject_name: 'Effective Communication & Mabisang Komunikasyon',
                    section_id: sectionObj.id,
                    grade_level: sectionObj.section_grade_level,
                    is_virtual: true
                } as VirtualSectionSubject);
            }
        } else {
            // Fallback to intended curriculum (Standard/Custom config)
            const virtualSubjects = intendedSubjects.filter(intended => {
                const defaultTerm = getDefaultTermForSubject(intended.name, sectionObj.section_grade_level);
                if (defaultTerm === 'none') return false;
                
                if (selectedTerm !== 'all') {
                    const termNum = selectedTerm === 'q1' ? 1 : selectedTerm === 'q2' ? 2 : selectedTerm === 'q3' ? 3 : null;
                    if (termNum !== null) {
                        return defaultTerm === 'all' || Number(defaultTerm) === termNum;
                    }
                }
                return true;
            });

            baseList = virtualSubjects.map(intended => ({
                id: `virtual-${normalizeSubjectName(intended.name)}-${sectionObj.id}`,
                subject_name: intended.name,
                section_id: sectionObj.id,
                grade_level: sectionObj.section_grade_level,
                is_virtual: true
            } as VirtualSectionSubject));
        }

        // 4. Post-process: Identify MAPEH and EC&MK groups for all items in the list
        const withGroupData = baseList.map(base => {
            const norm = normalizeSubjectName(base.subject_name);
            if (norm === 'mapeh' && !isSHS) {
                const musicArts = sectionDbSubjects.filter(s => {
                    const n = normalizeSubjectName(s.subject_name);
                    return n.includes('musicandarts') || n.includes('musicarts');
                });
                const peHealth = sectionDbSubjects.filter(s => {
                    const n = normalizeSubjectName(s.subject_name);
                    return n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth');
                });
                if (musicArts.length > 0 && peHealth.length > 0) {
                    return {
                        ...base,
                        _mapehGroups: {
                            musicArts,
                            peHealth
                        }
                    };
                }
            }
            if (isEcmkParent(base.subject_name)) {
                return {
                    ...base,
                    _ecmkGroups: {
                        effectiveComm: sectionDbSubjects.filter(s => normalizeSubjectName(s.subject_name) === 'effectivecommunication'),
                        mabisangKom: sectionDbSubjects.filter(s => normalizeSubjectName(s.subject_name) === 'mabisangkomunikasyon')
                    }
                };
            }
            return base;
        });

        // 5. Apply Global Standard Ordering (Filipino -> English -> ... -> MAPEH -> Specialization)
        const sortedSubjects = sortSubjects(withGroupData, s => s.subject_name);

        // 6. Filter out individual MAPEH components and EC/MK components from the main row list (they are sub-columns under their parent header)
        return sortedSubjects.filter(sub => {
            const norm = normalizeSubjectName(sub.subject_name);
            const isMapehComponent = !isSHS && (norm.includes('musicandarts') || norm.includes('musicarts') || 
                               norm.includes('physicaleducationandhealth') || norm.includes('peandhealth') || norm.includes('pehealth'));
            
            // Filter out EC/MK individual components only if a parent group exists
            const hasEcmkParentInList = sortedSubjects.some(s => isEcmkParent(s.subject_name));
            const isEcOrMkComponent = hasEcmkParentInList && (norm === 'effectivecommunication' || norm === 'mabisangkomunikasyon');

            return (!isMapehComponent || norm === 'mapeh') && !isEcOrMkComponent;
        });
    }, [subjects, sectionObj, schoolProfile.curriculum, selectedTerm]);




    const selectableSubjects = useMemo(() => {
        return sectionSubjects.filter((subject) => subject.subject_name.toUpperCase() !== 'MAPEH' && !isEcmkParent(subject.subject_name));
    }, [sectionSubjects]);

    const [subjectColumnSelections, setSubjectColumnSelections] = useState<Record<string, string>>({});

    useEffect(() => {
        if (sectionObj?.section_metadata?.sf9SubjectSelections) {
            setSubjectColumnSelections(sectionObj.section_metadata.sf9SubjectSelections);
        } else {
            setSubjectColumnSelections({});
        }
    }, [sectionObj]);

    const handleUpdateSubjectSelection = async (baseId: string, selectedId: string) => {
        if (!sectionObj) return;
        
        const newSelections = { ...subjectColumnSelections, [baseId]: selectedId };
        setSubjectColumnSelections(newSelections);
        
        try {
            const updatedSection = {
                ...sectionObj,
                section_metadata: {
                    ...sectionObj.section_metadata,
                    sf9SubjectSelections: newSelections
                }
            };
            await useAppStore.getState().updateSection(updatedSection);
        } catch (error) {
            console.error('Failed to save subject selection:', error);
        }
    };

    const subjectColumns = useMemo(() => {
        return sectionSubjects.map((baseSubject) => {
            if ((baseSubject as any)._mapehGroups || isEcmkParent(baseSubject.subject_name)) {
                return { baseId: baseSubject.id, subject: baseSubject };
            }

            const selectedId = subjectColumnSelections[baseSubject.id] || baseSubject.id;
            const selectedSubject = selectableSubjects.find((option) => option.id === selectedId) || baseSubject;
            return { baseId: baseSubject.id, subject: selectedSubject };
        });
    }, [sectionSubjects, selectableSubjects, subjectColumnSelections]);

    // SECTION STUDENTS
    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        return students.filter(s => s.student_section === selectedSection || (sectionObj?.id && s.student_section === sectionObj.id));
    }, [students, selectedSection, sectionObj?.id]);

    const isElementary = useMemo(() => {
        if (!sectionObj) return false;
        return isElementaryLevel(sectionObj.section_grade_level);
    }, [sectionObj]);

    const isSHSSection = useMemo(() => {
        if (!sectionObj) return false;
        const gradeNum = parseInt((sectionObj.section_grade_level || '').replace(/\D/g, '')) || 0;
        return gradeNum === 11 || gradeNum === 12;
    }, [sectionObj]);

    
    const learnerNameColumnWidth = useMemo(() => {
        const longestName = sectionStudents.reduce((longest, student) => {
            const currentName = formatLearnerName(student);
            return currentName.length > longest.length ? currentName : longest;
        }, '');
        const estimatedWidth = longestName.length > 0 ? Math.ceil(longestName.length * 5.2 + 28) : 160;
        return Math.max(150, Math.min(estimatedWidth, 280));
    }, [sectionStudents]);

    const showDescriptor = useMemo(() => {
        if (!sectionObj) return false;
        return isKeyStage1(sectionObj.section_grade_level) || isKeyStage2To4(sectionObj.section_grade_level);
    }, [sectionObj]);

    const subjectColumnWidth = useMemo(() => {
        if (selectedTerm === 'all') return 30;

        // 1. Calculate total logical sub-columns (MAPEH and EC&MK take 3 slots, others take 1)
        const totalSubCols = sectionSubjects.reduce((acc, sub) => {
            if ((sub as any)._mapehGroups || isEcmkParent(sub.subject_name)) return acc + 3;
            return acc + 1;
        }, 0);

        if (totalSubCols === 0) return SUBJECT_COLUMN_WIDTH;

        // 2. Determine available width for subjects
        // Standard Folio Landscape (13in) is approx 1248px at 96dpi
        const pageWidth = 1200; 
        const avgColsWidth = showGenAvg ? (AVERAGE_COLUMN_WIDTH + GENERAL_AVERAGE_COLUMN_WIDTH) : 0;
        const availableWidth = pageWidth - learnerNameColumnWidth - avgColsWidth - 100; // 100px for padding/borders

        // 3. Compute dynamic width per slot
        const dynamicWidth = Math.floor(availableWidth / totalSubCols);

        // 4. Clamp to ensure readability but prioritize fitting the page
        // Minimum 45px (enough for 3 digits), Maximum 120px
        return Math.max(45, Math.min(120, dynamicWidth));
    }, [sectionSubjects, selectedTerm, learnerNameColumnWidth, showGenAvg]);

    const maleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Male').sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);
    const femaleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Female').sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);

    // GRADES COMPUTATION
    const gradesData = useMemo(() => {
        const data: GradesData = {};

        sectionStudents.forEach(student => {
            const studentData: StudentGradeRow = {};
            let totalFinal = 0;
            let subjectCount = 0;

            sectionSubjects.forEach(subject => {
                if (subject._mapehGroups) {
                    const subjectGrades: any = {};
                    let virtualFinalTotal = 0;
                    let virtualQCount = 0;

                    for (let q = 1; q <= 4; q++) {
                        const qKey = `q${q}` as QuarterKey;
                        const musicArtsResults: number[] = [];
                        const peHealthResults: number[] = [];

                        subject._mapehGroups.musicArts.forEach(comp => {
                            const r = gradingSheetRecords.find(rec => rec.student_lrn === student.lrn && rec.subject_id === comp.id && Number(rec.quarter) === q);
                            if (r && r.final_grade && Number(r.final_grade) > 0) {
                                musicArtsResults.push(Number(r.final_grade));
                            }
                        });

                        subject._mapehGroups.peHealth.forEach(comp => {
                            const r = gradingSheetRecords.find(rec => rec.student_lrn === student.lrn && rec.subject_id === comp.id && Number(rec.quarter) === q);
                            if (r && r.final_grade && Number(r.final_grade) > 0) {
                                peHealthResults.push(Number(r.final_grade));
                            }
                        });

                        if (musicArtsResults.length > 0 || peHealthResults.length > 0) {
                            const maAvg = musicArtsResults.length > 0 ? Math.round(musicArtsResults.reduce((a, b) => a + b, 0) / musicArtsResults.length) : null;
                            const phAvg = peHealthResults.length > 0 ? Math.round(peHealthResults.reduce((a, b) => a + b, 0) / peHealthResults.length) : null;
                            
                            const ma = maAvg || 0;
                            const ph = phAvg || 0;
                            let qAvg = null;
                            if (ma > 0 && ph > 0) qAvg = Math.round((ma + ph) / 2);
                            else if (ma > 0) qAvg = ma;
                            else if (ph > 0) qAvg = ph;

                            subjectGrades[qKey] = {
                                value: qAvg,
                                musicArts: maAvg,
                                peHealth: phAvg
                            };

                            if (q <= 3 && qAvg !== null) {
                                virtualFinalTotal += qAvg;
                                virtualQCount++;
                            }
                        }
                    }

                    if (virtualQCount > 0) {
                        const finalRating = Math.round(virtualFinalTotal / virtualQCount);
                        subjectGrades.final = finalRating;
                        studentData[subject.id] = subjectGrades;
                        
                        const isExcluded = subject.subject_name.startsWith('*') || 
                                          subject.subject_name.toLowerCase().includes('arabic language') || 
                                          subject.subject_name.toLowerCase().includes('islamic values');

                        if (!isExcluded) {
                            totalFinal += finalRating;
                            subjectCount++;
                        }
                    } else {
                        studentData[subject.id] = {};
                    }
                } else if (subject._ecmkGroups) {
                    // EC & MK parent: average Effective Communication and Mabisang Komunikasyon
                    const subjectGrades: any = {};
                    let virtualFinalTotal = 0;
                    let virtualQCount = 0;

                    for (let q = 1; q <= 4; q++) {
                        const qKey = `q${q}` as QuarterKey;
                        const ecResults: number[] = [];
                        const mkResults: number[] = [];

                        subject._ecmkGroups.effectiveComm.forEach(comp => {
                            const r = gradingSheetRecords.find(rec => rec.student_lrn === student.lrn && rec.subject_id === comp.id && Number(rec.quarter) === q);
                            if (r && r.final_grade && Number(r.final_grade) > 0) {
                                ecResults.push(Number(r.final_grade));
                            }
                        });

                        subject._ecmkGroups.mabisangKom.forEach(comp => {
                            const r = gradingSheetRecords.find(rec => rec.student_lrn === student.lrn && rec.subject_id === comp.id && Number(rec.quarter) === q);
                            if (r && r.final_grade && Number(r.final_grade) > 0) {
                                mkResults.push(Number(r.final_grade));
                            }
                        });

                        if (ecResults.length > 0 || mkResults.length > 0) {
                            const ecAvg = ecResults.length > 0 ? Math.round(ecResults.reduce((a, b) => a + b, 0) / ecResults.length) : null;
                            const mkAvg = mkResults.length > 0 ? Math.round(mkResults.reduce((a, b) => a + b, 0) / mkResults.length) : null;
                            
                            const ec = ecAvg || 0;
                            const mk = mkAvg || 0;
                            let qAvg = null;
                            if (ec > 0 && mk > 0) qAvg = Math.round((ec + mk) / 2);
                            else if (ec > 0) qAvg = ec;
                            else if (mk > 0) qAvg = mk;

                            subjectGrades[qKey] = {
                                value: qAvg,
                                effectiveComm: ecAvg,
                                mabisangKom: mkAvg
                            };

                            if (q <= 3 && qAvg !== null) {
                                virtualFinalTotal += qAvg;
                                virtualQCount++;
                            }
                        }
                    }

                    if (virtualQCount > 0) {
                        const finalRating = Math.round(virtualFinalTotal / virtualQCount);
                        subjectGrades.final = finalRating;
                        studentData[subject.id] = subjectGrades;
                        
                        totalFinal += finalRating;
                        subjectCount++;
                    } else {
                        studentData[subject.id] = {};
                    }
                } else {
                    const subjectGrades: QuarterGrades = {};
                    let subjectFinalTotal = 0;
                    let qCount = 0;

                    for (let q = 1; q <= 4; q++) {
                        const record = gradingSheetRecords.find(r =>
                            r.student_lrn === student.lrn &&
                            r.subject_id === subject.id &&
                            Number(r.quarter) === q
                        );

                        if (record && record.final_grade && Number(record.final_grade) > 0) {
                            const qKey = `q${q}` as QuarterKey;
                            subjectGrades[qKey] = Number(record.final_grade);
                            if (q <= 3) {
                                subjectFinalTotal += Number(record.final_grade);
                                qCount++;
                            }
                        }
                    }

                    if (qCount > 0) {
                        const finalRating = Math.round(subjectFinalTotal / qCount);
                        subjectGrades.final = finalRating;
                        studentData[subject.id] = subjectGrades;

                        const isExcluded = subject.subject_name.startsWith('*') || 
                                          subject.subject_name.toLowerCase().includes('arabic language') || 
                                          subject.subject_name.toLowerCase().includes('islamic values');

                        if (!isExcluded) {
                            totalFinal += finalRating;
                            subjectCount++;
                        }
                    } else {
                        studentData[subject.id] = {};
                    }
                }
            });

            // General Average & Term Average
            const getQuarterGradeValue = (gradeData: any): number | null => {
                if (typeof gradeData === 'number') return gradeData;
                if (gradeData && typeof gradeData === 'object' && 'value' in gradeData) return gradeData.value;
                return null;
            };

            let genAvg = 0;
            if (subjectCount > 0) {
                genAvg = totalFinal / subjectCount;
                studentData.generalAverage = String(Math.round(genAvg));
            } else {
                studentData.generalAverage = '';
            }

            // Calculate average for the selected term using visible subject columns
            const activeTerm = selectedTerm === 'all' ? null : selectedTerm;
            if (activeTerm) {
                const seenSubjectIds = new Set<string>();
                let termTotal = 0;
                let termSubjectCount = 0;
                subjectColumns.forEach(({ subject }) => {
                    // Avoid double-counting if the same subject is selected for multiple columns
                    if (seenSubjectIds.has(subject.id)) return;
                    seenSubjectIds.add(subject.id);

                    const sData = studentData[subject.id];
                    if (sData) {
                        const val = getQuarterGradeValue(sData[activeTerm as QuarterKey]);
                        const isExcluded = subject.subject_name.startsWith('*') || 
                                          subject.subject_name.toLowerCase().includes('arabic language') || 
                                          subject.subject_name.toLowerCase().includes('islamic values');

                        if (val !== null && val > 0 && !isExcluded) {
                            termTotal += val;
                            termSubjectCount++;
                        }
                    }
                });

                if (termSubjectCount > 0) {
                    const avg = termTotal / termSubjectCount;
                    // Term Average uses 2 decimal places for precision
                    const computedTermAverage = avg.toFixed(2);
                    studentData.termAverage = computedTermAverage;
                    // General Average is rounded to the nearest whole number
                    studentData.generalAverage = String(Math.round(genAvg));
                } else {
                    studentData.termAverage = '';
                    studentData.generalAverage = '';
                }
            }

            data[student.lrn] = studentData;
        });

        return data;
    }, [sectionStudents, sectionSubjects, subjectColumns, gradingSheetRecords, selectedTerm]);

    const promotionStats = useMemo(() => {
        const stats = {
            passed: { male: 0, female: 0 },
            failed: { male: 0, female: 0 },
            highest: 0,
            lowest: 100,
            classSum: 0,
            classCount: 0,
        };

        let highestGrade = 0;
        let lowestGrade = 100;
        let sumGrade = 0;
        let countGrade = 0;

        maleStudents.forEach(student => {
            const data = gradesData[student.lrn];
            if (data && data.generalAverage !== '') {
                const grade = Number(data.generalAverage);
                if (grade >= 75) stats.passed.male++;
                else stats.failed.male++;

                if (grade > highestGrade) highestGrade = grade;
                if (grade < lowestGrade) lowestGrade = grade;
                sumGrade += grade;
                countGrade++;
            }
        });

        femaleStudents.forEach(student => {
            const data = gradesData[student.lrn];
            if (data && data.generalAverage !== '') {
                const grade = Number(data.generalAverage);
                if (grade >= 75) stats.passed.female++;
                else stats.failed.female++;

                if (grade > highestGrade) highestGrade = grade;
                if (grade < lowestGrade) lowestGrade = grade;
                sumGrade += grade;
                countGrade++;
            }
        });

        stats.highest = highestGrade;
        stats.lowest = countGrade > 0 ? lowestGrade : 0;
        stats.classSum = sumGrade;
        stats.classCount = countGrade;

        return stats;
    }, [maleStudents, femaleStudents, gradesData]);

    const academicExcellenceStats = useMemo(() => {
        const stats = {
            male: 0,
            female: 0,
            students: [] as any[],
            total: 0
        };

        const isQuarter = selectedTerm !== 'all';
        
        sectionStudents.forEach(student => {
            const sData = gradesData[student.lrn];
            if (!sData) return;

            const avgStr = isQuarter ? sData.termAverage : sData.generalAverage;
            if (!avgStr || avgStr === '') return;
            const avg = Number(avgStr);

            if (avg >= 90) {
                let hasGradeBelow80 = false;
                let hasGrades = false;
                
                subjectColumns.forEach(({ subject }) => {
                    const subGradeObj = sData[subject.id];
                    if (subGradeObj) {
                        const gradeVal = getQuarterGradeValue(isQuarter ? subGradeObj[selectedTerm as QuarterKey] : subGradeObj.final);
                        if (typeof gradeVal === 'number' && gradeVal > 0) {
                            hasGrades = true;
                            if (gradeVal < 80) {
                                hasGradeBelow80 = true;
                            }
                        }
                    }
                });

                if (hasGrades && !hasGradeBelow80) {
                    const studentName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''}`;
                    const isMale = (student.gender || '').toLowerCase() === 'male';
                    const record = { name: studentName, average: avg.toFixed(2), lrn: student.lrn };

                    if (isMale) stats.male++;
                    else stats.female++;
                    stats.students.push(record);
                }
            }
        });
        
        // Per DepEd Order: awardees shall be listed ALPHABETICALLY to promote fairness
        stats.students.sort((a, b) => a.name.localeCompare(b.name));

        stats.total = stats.male + stats.female;

        return stats;
    }, [sectionStudents, gradesData, selectedTerm, subjectColumns]);

    const subjectPerformanceStats = useMemo(() => {
        const list: any[] = [];
        const isQuarter = selectedTerm !== 'all';
        
        const uniqueSubjectsMap = new Map<string, typeof sectionSubjects[0]>();
        subjectColumns.forEach(({ subject }) => {
            if (!uniqueSubjectsMap.has(subject.id)) {
                uniqueSubjectsMap.set(subject.id, subject);
            }
        });

        uniqueSubjectsMap.forEach((subject) => {
            let totalGrade = 0;
            let gradedCount = 0;
            let failedCount = 0;
            
            sectionStudents.forEach((student) => {
                const sData = gradesData[student.lrn];
                if (sData) {
                    const subGradeObj = sData[subject.id];
                    if (subGradeObj) {
                        const gradeVal = getQuarterGradeValue(isQuarter ? subGradeObj[selectedTerm as QuarterKey] : subGradeObj.final);
                        if (typeof gradeVal === 'number' && gradeVal > 0) {
                            totalGrade += gradeVal;
                            gradedCount++;
                            if (gradeVal < 75) {
                                failedCount++;
                            }
                        }
                    }
                }
            });

            if (gradedCount > 0) {
                const mean = totalGrade / gradedCount;
                const passRate = ((gradedCount - failedCount) / gradedCount) * 100;
                list.push({
                    id: subject.id,
                    name: subject.subject_name,
                    mean: mean.toFixed(2),
                    failed: failedCount,
                    passRate: passRate.toFixed(1),
                    total: gradedCount
                });
            }
        });

        return list;
    }, [sectionStudents, subjectColumns, gradesData, selectedTerm]);

    const remediationRoster = useMemo(() => {
        const list: any[] = [];
        const isQuarter = selectedTerm !== 'all';

        sectionStudents.forEach((student) => {
            const sData = gradesData[student.lrn];
            if (!sData) return;

            const failedSubjectsList: { name: string; grade: number }[] = [];

            subjectColumns.forEach(({ subject }) => {
                const subGradeObj = sData[subject.id];
                if (subGradeObj) {
                    const gradeVal = getQuarterGradeValue(isQuarter ? subGradeObj[selectedTerm as QuarterKey] : subGradeObj.final);
                    if (typeof gradeVal === 'number' && gradeVal > 0 && gradeVal < 75) {
                        failedSubjectsList.push({
                            name: subject.subject_name,
                            grade: gradeVal
                        });
                    }
                }
            });

            if (failedSubjectsList.length > 0) {
                const studentName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''}`;
                list.push({
                    lrn: student.lrn,
                    name: studentName,
                    gender: student.gender || 'Male',
                    failedSubjects: failedSubjectsList
                });
            }
        });

        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [sectionStudents, subjectColumns, gradesData, selectedTerm]);



    const getSubjectHeaderStyle = (sub: VirtualSectionSubject) => {
        if (showGenAvg && (sub as any)._mapehGroups) {
            const width = 3 * MAPEH_SUBCOLUMN_WIDTH;
            return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
        }
        if (showGenAvg && isEcmkParent(sub.subject_name)) {
            const width = 3 * ECMK_SUBCOLUMN_WIDTH;
            return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
        }

        const width = termColSpan(sub) * subjectColumnWidth;
        return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
    };
    
    const termColSpan = useCallback((sub: VirtualSectionSubject) => {
        if (selectedTerm === 'all') return 4;
        if ((sub as any)._mapehGroups || isEcmkParent(sub.subject_name)) return 3;
        return 1;
    }, [selectedTerm]);

    const totalColumns = useMemo(() => {
        return 1 + subjectColumns.reduce((acc, col) => acc + termColSpan(col.subject), 0) + (showGenAvg ? (showDescriptor ? 3 : 2) : 0);
    }, [subjectColumns, termColSpan, showGenAvg, showDescriptor]);
    
    const tableMinWidth = useMemo(() => {
        const nameColWidth = learnerNameColumnWidth;
        const avgColsWidth = showGenAvg ? (AVERAGE_COLUMN_WIDTH + GENERAL_AVERAGE_COLUMN_WIDTH) : 0;
        const subjectCols = subjectColumns.reduce((acc, col) => acc + termColSpan(col.subject), 0);
        const subjectColWidth = subjectColumnWidth;
        
        const estimatedWidth = (subjectCols * subjectColWidth) + nameColWidth + avgColsWidth;
        return Math.max(selectedTerm === 'all' ? 1200 : 900, estimatedWidth);
    }, [subjectColumns, selectedTerm, showGenAvg, learnerNameColumnWidth, subjectColumnWidth, termColSpan]);

    useEffect(() => {
        setSheetWidth(null);
        
        let active = true;
        requestAnimationFrame(() => {
            if (!active || !containerRef.current) return;
            const sheets = containerRef.current.querySelectorAll('.consolidated-sheet');
            if (sheets.length > 0) {
                let maxWidth = 0;
                sheets.forEach(sheet => {
                    maxWidth = Math.max(maxWidth, sheet.clientWidth);
                });
                if (maxWidth > 0) {
                    setSheetWidth(maxWidth);
                }
            }
        });
        
        return () => {
            active = false;
        };
    }, [selectedSection, selectedTerm, showGenAvg, showDescriptor, subjectColumns, sectionStudents]);

    const handlePrintConsolidated = () => {
        const sectionName = sectionObj?.section_name || 'Record';
        const originalTitle = document.title;
        document.title = `ConsolidatedGrades_${schoolProfile.name || 'School'}_${sectionName}_${activeSchoolYear}`;
        window.print();
        document.title = originalTitle;
    };

    const handleDownloadConsolidated = async () => {
        const sectionName = sectionObj?.section_name || 'Record';
        const filename = `ConsolidatedGrades_${schoolProfile.name || 'School'}_${sectionName}_${activeSchoolYear}.pdf`;

        // If in Electron, print to PDF natively (generates multiple vector pages natively)
        if (window.electronAPI?.printToPDF) {
            try {
                await window.electronAPI.printToPDF({ defaultFilename: filename, autoSave: true });
                showNotification('Grade sheet downloaded successfully!', 'success');
            } catch (err) {
                console.error('Download failed via Electron:', err);
                showNotification('Failed to download PDF. Please try again.', 'error');
            }
            return;
        }

        // Web browser html2canvas + jsPDF fallback (multiple pages supported)
        const el = document.getElementById('printable-consolidated-grades');
        if (!el) {
            showNotification('Nothing to download. Please select a section first.', 'error');
            return;
        }

        setIsDownloading(true);
        const originalHeights: string[] = [];
        const pagesToRestore: HTMLElement[] = [];

        try {
            const html2canvas = (await import('html2canvas-pro')).default;
            const { jsPDF } = await import('jspdf');

            // Find zoom shell and reset zoom temporarily for clean capture
            const zoomShell = el.querySelector('.consolidated-zoom-shell') as HTMLElement | null;
            const prevTransform = zoomShell?.style.transform || '';
            const prevTransition = zoomShell?.style.transition || '';
            if (zoomShell) {
                zoomShell.style.transition = 'none';
                zoomShell.style.transform = 'none';
                // Force a layout reflow to apply the transition/transform change synchronously
                void zoomShell.offsetHeight;
            }

            // Get all sheet pages to download
            const pages = Array.from(el.querySelectorAll('.consolidated-sheet')) as HTMLElement[];
            if (pages.length === 0) {
                const sheetEl = el.querySelector('.consolidated-sheet') as HTMLElement | null || el;
                pages.push(sheetEl);
            }

            // Set up landscape PDF format (Folio for 'all' terms, Legal for single terms)
            const pdfFormat = selectedTerm === 'all' ? [330.2, 215.9] : [355.6, 215.9];
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: pdfFormat
            });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 4;
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;
            const pdfRatio = usableW / usableH;

            // Measure the tallest sheet to ensure uniform page size
            const maxHeight = Math.max(...pages.map(p => p.clientHeight));
            const targetHeight = Math.max(maxHeight, Math.round(tableMinWidth / pdfRatio));
            
            pages.forEach(p => {
                originalHeights.push(p.style.height);
                pagesToRestore.push(p);
                p.style.height = `${targetHeight}px`;
                p.style.boxSizing = 'border-box';
            });
            
            // Force a layout reflow
            if (pages.length > 0) {
                void pages[0].offsetHeight;
            }

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) {
                    pdf.addPage(pdfFormat, 'landscape');
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

                        // Swap inputs to static spans to capture dynamic values (if any are present)
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

                        // Remove select elements to avoid rendering native select controls as gray bars in PDF
                        const clonedSelects = clonedPageEl.querySelectorAll('select');
                        clonedSelects.forEach(select => {
                            select.remove();
                        });
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                
                // Preserve aspect ratio and fit proportionally in the PDF page, centering the content
                const canvasRatio = canvas.width / canvas.height;
                const pdfRatio = usableW / usableH;
                
                let imgW = usableW;
                let imgH = usableH;
                let xOffset = margin;
                let yOffset = margin;
                
                if (canvasRatio > pdfRatio) {
                    // Canvas is wider than PDF aspect ratio, fit to width and center vertically
                    imgW = usableW;
                    imgH = usableW / canvasRatio;
                    yOffset = margin + (usableH - imgH) / 2;
                } else {
                    // Canvas is taller than PDF aspect ratio, fit to height and center horizontally
                    imgH = usableH;
                    imgW = usableH * canvasRatio;
                    xOffset = margin + (usableW - imgW) / 2;
                }
                
                pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgW, imgH);
            }

            // Restore zoom
            if (zoomShell) {
                zoomShell.style.transition = prevTransition;
                zoomShell.style.transform = prevTransform;
            }

            pdf.save(filename);
            showNotification('Grade sheet downloaded successfully!', 'success');
        } catch (err) {
            console.error('Download failed:', err);
            showNotification('Failed to download grade sheet. Please try again.', 'error');
        } finally {
            // Restore original heights
            pagesToRestore.forEach((p, idx) => {
                p.style.height = originalHeights[idx] || '';
            });
            setIsDownloading(false);
        }
    };

    const renderHeaderAndMetadata = (titleSuffix: string) => {
        const isSummary = titleSuffix === 'SUMMARY OF REPORTS';
        return (
            <div className={`consolidated-header ${isSummary ? 'mb-2' : 'mb-4'}`}>
                <div className={`flex justify-between items-center ${isSummary ? 'mb-2' : 'mb-6'} px-2`}>
                    <img 
                        src="/deped_logo_left.png" 
                        alt="DepEd Left" 
                        className={`consolidated-logo-left ${isSummary ? 'w-14 h-14' : 'w-20 h-20'} object-contain`} 
                        onError={(e) => { (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}deped_logo_left.png` }} 
                    />
                    <div className="text-center">
                        <h1 className={`consolidated-title ${isSummary ? 'text-lg' : (isElementary ? 'text-xl' : 'text-2xl')} font-bold uppercase text-black`}>
                            Summary of Grades for {selectedTerm === 'all' ? 'Final & General Average' : (TERM_LABELS[selectedTerm as keyof typeof TERM_LABELS] || 'Master Sheet')}
                            {titleSuffix ? ` - ${titleSuffix}` : ''}
                        </h1>
                    </div>
                    <img 
                        src="/deped_logo_right.png" 
                        alt="DepEd Right" 
                        className={`consolidated-logo-right ${isSummary ? 'w-28 h-14' : 'w-36 h-20'} object-contain`} 
                        onError={(e) => { (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}deped_logo_right.png` }} 
                    />
                </div>

                {/* Metadata Grid - Boxed Style */}
                <div className={`grid grid-cols-3 gap-0 ${isSummary ? 'text-[9.5px]' : 'text-[11px]'} border-t border-l border-black`}>
                    <div className={`${isSummary ? 'p-0.5 px-2' : 'p-1 px-3'} border-r border-b border-black flex items-center justify-start gap-2`}>
                        <span className="font-bold whitespace-nowrap">REGION :</span>
                        <span className="uppercase text-left">{schoolProfile.region || 'XXX'}</span>
                    </div>
                    <div className={`${isSummary ? 'p-0.5 px-2' : 'p-1 px-3'} border-r border-b border-black flex items-center justify-start gap-2`}>
                        <span className="font-bold whitespace-nowrap">DIVISION :</span>
                        <span className="uppercase text-left">{schoolProfile.division || 'MATATAG DIVISION'}</span>
                    </div>
                    <div className={`${isSummary ? 'p-0.5 px-2' : 'p-1 px-3'} border-r border-b border-black flex items-center justify-start gap-2`}>
                        <span className="font-bold whitespace-nowrap">SCHOOL YEAR :</span>
                        <span className="text-left">{activeSchoolYear}</span>
                    </div>
                    <div className={`${isSummary ? 'p-0.5 px-2' : 'p-1 px-3'} border-r border-b border-black flex items-center justify-start gap-2 min-w-0`}>
                        <span className="font-bold whitespace-nowrap">SCHOOL NAME :</span>
                        <span className="uppercase text-left min-w-0 wrap-break-word">{schoolProfile.name}</span>
                    </div>
                    <div className={`${isSummary ? 'p-0.5 px-2' : 'p-1 px-3'} border-r border-b border-black flex items-center justify-start gap-2 min-w-0`}>
                        <span className="font-bold whitespace-nowrap">GRADE & SECTION :</span>
                        <span className="uppercase text-left min-w-0 wrap-break-word">{sectionObj?.section_grade_level} - {selectedSection}</span>
                    </div>
                    <div className={`${isSummary ? 'p-0.5 px-2' : 'p-1 px-3'} border-r border-b border-black flex items-center justify-start gap-2 min-w-0`}>
                        <span className="font-bold whitespace-nowrap">SCHOOL ID :</span>
                        <span className="text-left min-w-0 wrap-break-word">{schoolProfile.school_id}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderGradesTable = (studentsList: typeof maleStudents, startRowIdx: number, genderLabel: string) => {
        return (
            <table className={`consolidated-print-table consolidated-grades-table w-full border-collapse border border-black ${isElementary ? 'text-[7px]' : 'text-[8px]'}`}>
                <colgroup>
                    <col style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px` }} />
                    {subjectColumns.map((column, index) => {
                        if (selectedTerm !== 'all' && (column.subject as any)._mapehGroups) {
                            return (
                                <Fragment key={`col-group-mapeh-${column.baseId}-${index}`}>
                                    <col style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }} />
                                    <col style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }} />
                                    <col style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }} />
                                </Fragment>
                            );
                        }
                        if (selectedTerm !== 'all' && isEcmkParent(column.subject.subject_name)) {
                            return (
                                <Fragment key={`col-group-ecmk-${column.baseId}-${index}`}>
                                    <col style={{ width: `${ECMK_SUBCOLUMN_WIDTH}px`, minWidth: `${ECMK_SUBCOLUMN_WIDTH}px` }} />
                                    <col style={{ width: `${ECMK_SUBCOLUMN_WIDTH}px`, minWidth: `${ECMK_SUBCOLUMN_WIDTH}px` }} />
                                    <col style={{ width: `${ECMK_SUBCOLUMN_WIDTH}px`, minWidth: `${ECMK_SUBCOLUMN_WIDTH}px` }} />
                                </Fragment>
                            );
                        }
                        return (
                            <Fragment key={`col-group-std-${column.baseId}-${index}`}>
                                {(selectedTerm === 'q1' || selectedTerm === 'all') && (
                                    <col style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px` }} />
                                )}
                                {(selectedTerm === 'q2' || selectedTerm === 'all') && (
                                    <col style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px` }} />
                                )}
                                {(selectedTerm === 'q3' || selectedTerm === 'all') && (
                                    <col style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px` }} />
                                )}
                                {selectedTerm === 'all' && (
                                    <col style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px` }} />
                                )}
                            </Fragment>
                        );
                    })}
                    {showGenAvg && (
                        <>
                            <col style={{ width: `${AVERAGE_COLUMN_WIDTH}px`, minWidth: `${AVERAGE_COLUMN_WIDTH}px` }} />
                            <col style={{ width: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, minWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px` }} />
                            {showDescriptor && (
                                <col style={{ width: `100px`, minWidth: `100px` }} />
                            )}
                        </>
                    )}
                </colgroup>
                <thead>
                    {isSHSSection ? (
                        <>
                            {/* Row 1: SHS Categories */}
                            <tr className="text-center font-bold text-[8px] uppercase tracking-wider h-8">
                                <th rowSpan={3} className="consolidated-name-col border border-black p-2 font-bold text-center bg-gray-100" style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px`, maxWidth: `${learnerNameColumnWidth}px` }}>NAME OF LEARNERS</th>
                                {subjectColumns.map((column, index) => {
                                    const cat = getSubjectCategory(column.subject.subject_name, sectionObj?.section_grade_level || '');
                                    const parts = cat.split(' (');
                                    return (
                                        <th
                                            key={`subject-type-${column.baseId}-${index}`}
                                            colSpan={termColSpan(column.subject)}
                                            className="border border-black p-1 text-center font-black text-[7px] leading-tight bg-gray-100"
                                        >
                                            {parts.length > 1 ? (
                                                <>
                                                    {parts[0]}<br />({parts[1]}
                                                </>
                                            ) : (
                                                cat
                                            )}
                                        </th>
                                    );
                                })}
                                {showGenAvg && (
                                    <>
                                        <th rowSpan={3} className="consolidated-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100" style={{ width: `${AVERAGE_COLUMN_WIDTH}px`, minWidth: `${AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${AVERAGE_COLUMN_WIDTH}px` }}>AVERAGE</th>
                                        <th rowSpan={3} className="consolidated-general-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100" style={{ width: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, minWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px` }}>GENERAL AVERAGE</th>
                                        {showDescriptor && (
                                            <th rowSpan={3} className="consolidated-descriptor-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100" style={{ width: `100px`, minWidth: `100px`, maxWidth: `100px` }}>DESCRIPTOR</th>
                                        )}
                                    </>
                                )}
                            </tr>
                            {/* Row 2: Subject Names */}
                            <tr className="">
                                {subjectColumns.map((column, index) => (
                                    selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() !== 'MAPEH' && !isEcmkParent(column.subject.subject_name) ? (
                                        <th
                                            key={`subject-column-${column.baseId}-${index}`}
                                            rowSpan={2}
                                            className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50"
                                            title={column.subject.subject_name}
                                            style={getSubjectHeaderStyle(column.subject)}
                                        >
                                            {selectedTerm === 'q1' ? (
                                                <div className="relative w-full">
                                                    <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5 pointer-events-none">
                                                        {column.subject.subject_name}
                                                    </span>
                                                    <select
                                                        value={subjectColumnSelections[column.baseId] || column.subject.id}
                                                        onChange={(e) => handleUpdateSubjectSelection(column.baseId, e.target.value)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    >
                                                        <option value={column.baseId}>{column.subject.subject_name} (Default)</option>
                                                        {selectableSubjects.map((option) => (
                                                            <option key={option.id} value={option.id}>
                                                                {option.subject_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5">
                                                    {column.subject.subject_name}
                                                </span>
                                            )}
                                        </th>
                                    ) : (
                                        <th key={`subject-column-${column.baseId}-${index}`} colSpan={termColSpan(column.subject)} className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50" title={column.subject.subject_name} style={getSubjectHeaderStyle(column.subject)}>
                                            {(column.subject as any)._mapehGroups || isEcmkParent(column.subject.subject_name) ? (
                                                column.subject.subject_name
                                            ) : (
                                                selectedTerm === 'q1' ? (
                                                    <div className="relative w-full">
                                                        <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5 pointer-events-none">
                                                            {column.subject.subject_name}
                                                        </span>
                                                        <select
                                                            value={subjectColumnSelections[column.baseId] || column.subject.id}
                                                            onChange={(e) => {
                                                                const nextId = e.target.value;
                                                                setSubjectColumnSelections((prev) => ({ ...prev, [column.baseId]: nextId }));
                                                            }}
                                                            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                                                            aria-label={`Select subject for column ${index + 1}`}
                                                        >
                                                            {selectableSubjects.map((option) => (
                                                                <option key={option.id} value={option.id}>
                                                                    {option.subject_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5">
                                                        {column.subject.subject_name}
                                                    </span>
                                                )
                                            )}
                                        </th>
                                    )
                                ))}
                            </tr>
                        </>
                    ) : (
                        /* Row 1: JHS/Elementary Subject Names (Categories omitted) */
                        <tr className="text-center font-bold text-[8px] uppercase tracking-wider h-8">
                            <th rowSpan={2} className="consolidated-name-col border border-black p-2 font-bold text-center bg-gray-100" style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px`, maxWidth: `${learnerNameColumnWidth}px` }}>NAME OF LEARNERS</th>
                            {subjectColumns.map((column, index) => (
                                selectedTerm !== 'all' && !(column.subject as any)._mapehGroups && !isEcmkParent(column.subject.subject_name) ? (
                                    <th
                                        key={`subject-column-${column.baseId}-${index}`}
                                        rowSpan={2}
                                        className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50"
                                        title={column.subject.subject_name}
                                        style={getSubjectHeaderStyle(column.subject)}
                                    >
                                        {selectedTerm === 'q1' ? (
                                            <div className="relative w-full">
                                                <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5 pointer-events-none">
                                                    {column.subject.subject_name}
                                                </span>
                                                <select
                                                    value={subjectColumnSelections[column.baseId] || column.subject.id}
                                                    onChange={(e) => handleUpdateSubjectSelection(column.baseId, e.target.value)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                >
                                                    <option value={column.baseId}>{column.subject.subject_name} (Default)</option>
                                                    {selectableSubjects.map((option) => (
                                                        <option key={option.id} value={option.id}>
                                                            {option.subject_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5">
                                                {column.subject.subject_name}
                                            </span>
                                        )}
                                    </th>
                                ) : (
                                    <th key={`subject-column-${column.baseId}-${index}`} colSpan={termColSpan(column.subject)} className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50" title={column.subject.subject_name} style={getSubjectHeaderStyle(column.subject)}>
                                        {(column.subject as any)._mapehGroups || isEcmkParent(column.subject.subject_name) ? (
                                            column.subject.subject_name
                                        ) : (
                                            selectedTerm === 'q1' ? (
                                                <div className="relative w-full">
                                                    <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5 pointer-events-none">
                                                        {column.subject.subject_name}
                                                    </span>
                                                    <select
                                                        value={subjectColumnSelections[column.baseId] || column.subject.id}
                                                        onChange={(e) => {
                                                            const nextId = e.target.value;
                                                            setSubjectColumnSelections((prev) => ({ ...prev, [column.baseId]: nextId }));
                                                        }}
                                                        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                                                        aria-label={`Select subject for column ${index + 1}`}
                                                    >
                                                        {selectableSubjects.map((option) => (
                                                            <option key={option.id} value={option.id}>
                                                                {option.subject_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5">
                                                    {column.subject.subject_name}
                                                </span>
                                            )
                                        )}
                                    </th>
                                )
                            ))}
                            {showGenAvg && (
                                <>
                                    <th rowSpan={2} className="consolidated-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100" style={{ width: `${AVERAGE_COLUMN_WIDTH}px`, minWidth: `${AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${AVERAGE_COLUMN_WIDTH}px` }}>AVERAGE</th>
                                    <th rowSpan={2} className="consolidated-general-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100" style={{ width: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, minWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px` }}>GENERAL AVERAGE</th>
                                    {showDescriptor && (
                                        <th rowSpan={2} className="consolidated-descriptor-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100" style={{ width: `100px`, minWidth: `100px`, maxWidth: `100px` }}>DESCRIPTOR</th>
                                    )}
                                </>
                            )}
                        </tr>
                    )}

                    {/* Row 3: Subheaders (T1, T2, T3, Final, Music, Arts, etc.) */}
                    <tr className="">
                        {subjectColumns.map((column, index) => (
                            <Fragment key={`subject-subheader-${column.baseId}-${index}`}>
                                {selectedTerm !== 'all' && (column.subject as any)._mapehGroups && (
                                    <>
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>Music &<br/>Arts</th>
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>PE &<br/>Health</th>
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>FINAL<br/>GRADE</th>
                                    </>
                                )}
                                {selectedTerm !== 'all' && isEcmkParent(column.subject.subject_name) && (
                                    <>
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${ECMK_SUBCOLUMN_WIDTH}px`, minWidth: `${ECMK_SUBCOLUMN_WIDTH}px`, maxWidth: `${ECMK_SUBCOLUMN_WIDTH}px` }}>Effective<br/>Communication</th>
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${ECMK_SUBCOLUMN_WIDTH}px`, minWidth: `${ECMK_SUBCOLUMN_WIDTH}px`, maxWidth: `${ECMK_SUBCOLUMN_WIDTH}px` }}>Mabisang<br/>Komunikasyon</th>
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-bold text-[6px] leading-[1.1] bg-gray-200" style={{ width: `${ECMK_SUBCOLUMN_WIDTH}px`, minWidth: `${ECMK_SUBCOLUMN_WIDTH}px`, maxWidth: `${ECMK_SUBCOLUMN_WIDTH}px` }}>FINAL<br/>GRADE</th>
                                    </>
                                )}
                                
                                {selectedTerm === 'all' && (
                                    <>
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal bg-gray-50" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>T1</th>
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal bg-gray-50" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>T2</th>
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal bg-gray-50" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>T3</th>
                                        {showLegacyQuarter4 && <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal bg-gray-50" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>LQ4</th>}
                                        <th className="consolidated-subject-col border border-black p-0.5 text-center font-bold bg-gray-200" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>Final</th>
                                    </>
                                )}
                            </Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-gray-200"><td colSpan={totalColumns} className="border border-black p-1 font-bold pl-2 text-[10px] uppercase bg-gray-200">{genderLabel}</td></tr>
                    {studentsList.map((student, idx) => {
                        const data = gradesData[student.lrn] || {};
                        const activeQuarterTerm = selectedTerm === 'q1' || selectedTerm === 'q2' || selectedTerm === 'q3'
                            ? selectedTerm
                            : null;
                        const studentRow = startRowIdx + idx;
                        
                        return (
                            <StudentGradeRow
                                key={student.lrn}
                                student={student}
                                studentRow={studentRow}
                                data={data}
                                activeQuarterTerm={activeQuarterTerm}
                                isElementary={isElementary}
                                learnerNameColumnWidth={learnerNameColumnWidth}
                                subjectColumns={subjectColumns}
                                selectedTerm={selectedTerm}
                                activeSchoolYear={activeSchoolYear}
                                subjects={subjects}
                                sectionObj={sectionObj}
                                updateGradingSheetRecord={updateGradingSheetRecord}
                                subjectColumnWidth={subjectColumnWidth}
                                showGenAvg={showGenAvg}
                                showDescriptor={showDescriptor}
                                descriptorGradeLevel={sectionObj?.section_grade_level || ""}
                            />
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <style>{`
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                    appearance: textfield;
                }

                .consolidated-grades-table {
                    table-layout: fixed !important;
                    width: 100%;
                }

                @media print {
                    @page { size: ${selectedTerm === 'all' ? 'folio landscape' : 'legal landscape'}; margin: 6mm; }
                    #printable-consolidated-grades { width: auto !important; min-width: fit-content !important; margin: 0 !important; }
                    .consolidated-zoom-shell { transform: none !important; display: flex !important; flex-direction: column !important; gap: 0 !important; }
                    .no-print { display: none !important; }
                    select { display: none !important; }
                    .consolidated-sheet {
                        page-break-after: always !important;
                        break-after: page !important;
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
            {/* TIER 2: Page Context Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 mb-6 bg-white dark:bg-[#0B1121] border-b border-[#E5E7EB] dark:border-white/10 no-print">
                {/* Left: Breadcrumb / Back */}
                <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => setCurrentView('reports')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors group" title="Back to Reports">
                        <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-[#0f172a] dark:group-hover:text-white transition-colors" />
                    </button>
                    <div className="hidden sm:flex items-center gap-2 text-[13px]">
                        <span className="font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" onClick={() => setCurrentView('dashboard')}>Dashboard</span>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="font-bold text-[#0f172a] dark:text-white">Grade Management</span>
                    </div>
                    <div className="sm:hidden font-bold text-[#0f172a] dark:text-white text-[13px]">
                        Grade Management
                    </div>
                </div>

                {/* Right: Global Actions (Removed per user request) */}
            </div>

            {/* TIER 3: Filter & Action Toolbar */}
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 bg-white dark:bg-white/5 p-2.5 lg:p-3 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-white/10 no-print relative z-20 mb-6 mx-6">
                {/* LEFT: Dropdowns */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-45 shrink-0">
                        <select
                            className="h-8 w-full appearance-none bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium py-1 pl-2.5 pr-7 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors cursor-pointer hover:bg-slate-50"
                            value={selectedSection ?? ''}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="" disabled>Select Section</option>
                            
                                        {Object.entries(groupedSections).map(([group, groupSections]) => (
                                            groupSections.length > 0 && (
                                                <optgroup key={group} label={group}>
                                                    {groupSections.map(s => (
                                                        <option key={s.id} value={s.section_name}>
                                                            {s.section_grade_level} - {s.section_name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )
                                        ))}

                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    <div className="relative w-30 shrink-0">
                        <select
                            className="h-8 w-full appearance-none bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium py-1 pl-2.5 pr-7 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors cursor-pointer hover:bg-slate-50"
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value as typeof selectedTerm)}
                        >
                            {Object.entries(TERM_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Actions */}
                <div className="flex flex-nowrap items-center gap-1.5 justify-end shrink-0">
                    {selectedSection && (
                        <div className="flex items-center gap-1 h-8 px-1 rounded-md bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded"
                                title="Zoom Out"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 w-9 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded"
                                title="Zoom In"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    {selectedSection && isAdviser && selectedTerm !== 'all' && (
                        <>
                            <button
                                onClick={handleExportTemplate}
                                className="flex items-center gap-1 h-8 px-2.5 rounded-md bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm active:scale-95 whitespace-nowrap shrink-0"
                                title="Download Template"
                            >
                                <FileSpreadsheet className="w-3 h-3 text-slate-400" />
                                <span className="hidden xl:inline">Template</span>
                            </button>

                            <div className="relative group shrink-0">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleImportGrades}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <button
                                    className="flex items-center gap-1 h-8 px-2.5 rounded-md bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm active:scale-95 group-hover:bg-slate-50 whitespace-nowrap shrink-0"
                                >
                                    <Upload className="w-3 h-3 text-slate-400" />
                                    <span className="hidden xl:inline">Import</span>
                                </button>
                            </div>

                            <button
                                onClick={handleSyncFromEClass}
                                disabled={isSyncing}
                                className={`flex items-center gap-1 h-8 px-2.5 rounded-md transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm border active:scale-95 whitespace-nowrap shrink-0 ${
                                    isSyncing 
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10' 
                                    : 'bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                            >
                                <RefreshCcw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span className="hidden xl:inline">Sync</span>
                            </button>
                        </>
                    )}

                    {selectedSection && (
                        <>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete ALL grades in this Grade Management sheet? This cannot be undone.')) {
                                        await useAppStore.getState().clearGradingSheet();
                                    }
                                }}
                                className="flex items-center gap-1 h-8 px-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent transition-all font-bold text-[10px] uppercase tracking-wider active:scale-95 whitespace-nowrap shrink-0"
                                title="Clear All Grades"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span className="hidden xl:inline">Clear All</span>
                            </button>

                            <button
                                onClick={handlePrintConsolidated}
                                className="flex items-center gap-1 h-8 px-2.5 sm:px-4 rounded-md bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] hover:bg-slate-800 dark:hover:bg-slate-200 transition-all font-black text-[10px] uppercase tracking-wider shadow-md active:scale-95 ml-0.5 whitespace-nowrap shrink-0"
                            >
                                <Printer className="w-3 h-3" />
                                <span className="hidden sm:inline">Print</span>
                            </button>

                            <button
                                onClick={handleDownloadConsolidated}
                                disabled={isDownloading}
                                className="flex items-center gap-1 h-8 px-2.5 sm:px-4 rounded-md bg-green-600 dark:bg-green-500 text-white dark:text-white hover:bg-green-700 dark:hover:bg-green-600 transition-all font-black text-[10px] uppercase tracking-wider shadow-md active:scale-95 ml-0.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                            >
                                <Download className="w-3 h-3" />
                                <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Download'}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div id="printable-consolidated-grades" className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 p-4 overflow-auto">
                {/* HTML Table Preview - Styled to match PDF */}
                {!selectedSection ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                        <div className="text-4xl">📊</div>
                        <p className="font-medium">Please select a section to view the grade sheet.</p>
                    </div>
                ) : (
                    <div className="w-full min-h-full flex justify-center overflow-x-auto py-2 bg-slate-100 dark:bg-slate-900/40 rounded-xl">
                        <div
                            ref={containerRef}
                            className="consolidated-zoom-shell origin-top flex flex-col gap-8 transition-all duration-300"
                            style={{ transform: `scale(${zoom})`, width: 'fit-content' }}
                        >
                            {/* Page 1: Male Table */}
                            <div className="consolidated-sheet mx-auto bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-md border border-slate-200/80 mb-6 print:mb-0 print:border-none print:shadow-none" style={{ width: sheetWidth ? `${sheetWidth}px` : 'auto', minWidth: `${tableMinWidth}px` }}>
                                {renderHeaderAndMetadata('MALE')}
                                {renderGradesTable(maleStudents, 0, 'MALE')}
                            </div>

                            {/* Page 2: Female Table */}
                            <div className="consolidated-sheet mx-auto bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-md border border-slate-200/80 mb-6 print:mb-0 print:border-none print:shadow-none" style={{ width: sheetWidth ? `${sheetWidth}px` : 'auto', minWidth: `${tableMinWidth}px` }}>
                                {renderHeaderAndMetadata('FEMALE')}
                                {renderGradesTable(femaleStudents, maleStudents.length, 'FEMALE')}
                            </div>

                            {/* Page 3: Summary Reports */}
                            {showDescriptor && (
                                <div className="consolidated-sheet mx-auto bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-md border border-slate-200/80 mb-6 print:mb-0 print:border-none print:shadow-none" style={{ width: sheetWidth ? `${sheetWidth}px` : 'auto', minWidth: `${tableMinWidth}px` }}>
                                    {renderHeaderAndMetadata('SUMMARY OF REPORTS')}
                                    
                                    <div className="flex flex-col gap-3 w-full no-print-break-inside text-[9px]">
                                        {/* Two Columns Layout */}
                                        <div className="mt-2 flex flex-col md:flex-row gap-6 items-start justify-start w-full print:break-inside-avoid" style={{ maxWidth: '1200px' }}>
                                            {/* Column A: Left Column */}
                                            <div className="flex flex-col gap-3 flex-1 w-full max-w-137.5">
                                                {/* Learning Progress and Achievement */}
                                                <div className="border border-black overflow-hidden rounded-sm shadow-sm w-full">
                                                    <div className="bg-gray-200 p-1.5 font-bold text-[10px] border-b border-black text-center uppercase tracking-wider">
                                                        Learning Progress and Achievement
                                                    </div>
                                                    <table className="w-full text-center text-[9px] border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-black font-bold">
                                                                <th className="p-1.5 border-r border-black text-left pl-3 uppercase tracking-tight">Descriptors & Grading Scale</th>
                                                                <th className="p-1.5 border-r border-black w-20 uppercase">REMARKS</th>
                                                                <th className="p-1.5 border-r border-black w-14 uppercase">MALE</th>
                                                                <th className="p-1.5 border-r border-black w-14 uppercase">FEMALE</th>
                                                                <th className="p-1.5 w-14 uppercase">TOTAL</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {[
                                                                { desc: 'Advancing (90-100)', remark: 'Passed', min: 90, max: 100 },
                                                                { desc: 'Benchmarking (80-89)', remark: 'Passed', min: 80, max: 89 },
                                                                { desc: 'Connecting (75-79)', remark: 'Passed', min: 75, max: 79 },
                                                                { desc: 'Developing (65-74)', remark: 'Failed', min: 65, max: 74 },
                                                                { desc: 'Emerging (0-64)', remark: 'Failed', min: 0, max: 64 }
                                                            ].map((level, idx) => {
                                                                const getCounts = (studentsList: typeof maleStudents) => {
                                                                    return studentsList.filter(s => {
                                                                        const isQuarter = selectedTerm !== 'all';
                                                                        const rawAvg = isQuarter ? gradesData[s.lrn]?.termAverage : gradesData[s.lrn]?.generalAverage;
                                                                        if (!rawAvg || rawAvg === '') return false;
                                                                        const avg = Number(rawAvg);
                                                                        return avg >= level.min && avg <= level.max;
                                                                    }).length;
                                                                };
                                                                const mCount = getCounts(maleStudents);
                                                                const fCount = getCounts(femaleStudents);
                                                                const total = mCount + fCount;
                                                                
                                                                return (
                                                                    <tr key={idx} className="border-b border-black">
                                                                        <td className="p-1 border-r border-black text-left pl-3 font-medium">{level.desc}</td>
                                                                        <td className={`p-1 border-r border-black font-bold ${level.min < 75 ? 'text-red-600' : 'text-green-700'}`}>{level.remark}</td>
                                                                        <td className="p-1 border-r border-black tabular-nums font-medium">{mCount || '-'}</td>
                                                                        <td className="p-1 border-r border-black tabular-nums font-medium">{fCount || '-'}</td>
                                                                        <td className="p-1 bg-gray-50 tabular-nums font-bold">{total || '-'}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            <tr className="bg-gray-200 font-bold border-b border-black">
                                                                <td className="p-1 border-r border-black text-left pl-3" colSpan={2}>TOTAL</td>
                                                                <td className="p-1 border-r border-black tabular-nums">{maleStudents.filter(s => {
                                                                    const rawAvg = selectedTerm !== 'all' ? gradesData[s.lrn]?.termAverage : gradesData[s.lrn]?.generalAverage;
                                                                    return rawAvg !== '' && Number(rawAvg) > 0;
                                                                }).length}</td>
                                                                <td className="p-1 border-r border-black tabular-nums">{femaleStudents.filter(s => {
                                                                    const rawAvg = selectedTerm !== 'all' ? gradesData[s.lrn]?.termAverage : gradesData[s.lrn]?.generalAverage;
                                                                    return rawAvg !== '' && Number(rawAvg) > 0;
                                                                }).length}</td>
                                                                <td className="p-1 tabular-nums bg-gray-300">{sectionStudents.filter(s => {
                                                                    const rawAvg = selectedTerm !== 'all' ? gradesData[s.lrn]?.termAverage : gradesData[s.lrn]?.generalAverage;
                                                                    return rawAvg !== '' && Number(rawAvg) > 0;
                                                                }).length}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Academic Excellence Awards Summary */}
                                                <div className="border border-black overflow-hidden rounded-sm shadow-sm w-full">
                                                    <div className="bg-gray-200 p-1.5 font-bold text-[10px] border-b border-black text-center uppercase tracking-wider">
                                                        Academic Excellence Awards (Honor Roll) Summary
                                                    </div>
                                                    <table className="w-full text-center text-[9px] border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-black font-bold">
                                                                <th className="p-1.5 border-r border-black text-left pl-3 uppercase tracking-tight">Award Category</th>
                                                                <th className="p-1.5 border-r border-black w-20 uppercase">Grading Scale</th>
                                                                <th className="p-1.5 border-r border-black w-14 uppercase">MALE</th>
                                                                <th className="p-1.5 border-r border-black w-14 uppercase">FEMALE</th>
                                                                <th className="p-1.5 w-14 uppercase">TOTAL</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr className="border-b border-black">
                                                                <td className="p-1 border-r border-black text-left pl-3 font-bold text-deped-blue">🏆 Academic Excellence Award</td>
                                                                <td className="p-1 border-r border-black font-medium text-slate-600">90.00 - 100.00</td>
                                                                <td className="p-1 border-r border-black tabular-nums font-medium">{academicExcellenceStats.male || '-'}</td>
                                                                <td className="p-1 border-r border-black tabular-nums font-medium">{academicExcellenceStats.female || '-'}</td>
                                                                <td className="p-1 bg-gray-50 tabular-nums font-bold">{academicExcellenceStats.total || '-'}</td>
                                                            </tr>
                                                            <tr className="bg-gray-200 font-bold border-b border-black">
                                                                <td className="p-1 border-r border-black text-left pl-3" colSpan={2}>TOTAL EXCELLENCE AWARDEES</td>
                                                                <td className="p-1 border-r border-black tabular-nums">{academicExcellenceStats.male || '-'}</td>
                                                                <td className="p-1 border-r border-black tabular-nums">{academicExcellenceStats.female || '-'}</td>
                                                                <td className="p-1 tabular-nums bg-gray-300">{academicExcellenceStats.total || '-'}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <div className="p-2 bg-slate-50 border-t border-black text-[8px] leading-relaxed">
                                                        <div className="font-bold uppercase tracking-wider mb-1 text-slate-800 border-b border-slate-200 pb-0.5">Awardees Roster (No final grades below 80)</div>
                                                        {academicExcellenceStats.total === 0 ? (
                                                            <div className="italic text-slate-500 text-center py-0.5">No awardees for this term. (Average 90.00+ and no grade below 80 required)</div>
                                                        ) : (
                                                            <div className="space-y-0.5 max-h-20 overflow-y-auto custom-scrollbar">
                                                                <div>
                                                                    <span className="font-bold text-deped-blue">Awardees (Alphabetical):</span>{' '}
                                                                    <span className="text-slate-700">{academicExcellenceStats.students.map(st => `${st.name} (${st.average})`).join(', ')}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column B: Right Column */}
                                            <div className="flex flex-col gap-3 flex-1 w-full max-w-137.5">
                                                {/* Summary of Promotion */}
                                                <div className="border border-black overflow-hidden rounded-sm shadow-sm w-full">
                                                    <div className="bg-gray-200 p-1.5 font-bold text-[10px] border-b border-black text-center uppercase tracking-wider">
                                                        Summary of Promotion (General Performance)
                                                    </div>
                                                    <table className="w-full text-center text-[9px] border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-black font-bold">
                                                                <th className="p-1.5 border-r border-black text-left pl-3 uppercase tracking-tight">Promotion Status</th>
                                                                <th className="p-1.5 border-r border-black w-20 uppercase">REMARKS</th>
                                                                <th className="p-1.5 border-r border-black w-14 uppercase">MALE</th>
                                                                <th className="p-1.5 border-r border-black w-14 uppercase">FEMALE</th>
                                                                <th className="p-1.5 w-14 uppercase">TOTAL</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr className="border-b border-black">
                                                                <td className="p-1 border-r border-black text-left pl-3 font-medium">Passed (Promoted)</td>
                                                                <td className="p-1 border-r border-black font-bold text-green-700">PROMOTED</td>
                                                                <td className="p-1 border-r border-black tabular-nums font-medium">{promotionStats.passed.male || '-'}</td>
                                                                <td className="p-1 border-r border-black tabular-nums font-medium">{promotionStats.passed.female || '-'}</td>
                                                                <td className="p-1 bg-gray-50 tabular-nums font-bold">{promotionStats.passed.male + promotionStats.passed.female || '-'}</td>
                                                            </tr>
                                                            <tr className="border-b border-black">
                                                                <td className="p-1 border-r border-black text-left pl-3 font-medium">Failed (Retained)</td>
                                                                <td className="p-1 border-r border-black font-bold text-red-600">RETAINED</td>
                                                                <td className="p-1 border-r border-black tabular-nums font-medium">{promotionStats.failed.male || '-'}</td>
                                                                <td className="p-1 border-r border-black tabular-nums font-medium">{promotionStats.failed.female || '-'}</td>
                                                                <td className="p-1 bg-gray-50 tabular-nums font-bold">{promotionStats.failed.male + promotionStats.failed.female || '-'}</td>
                                                            </tr>
                                                            <tr className="bg-gray-200 font-bold border-b border-black">
                                                                <td className="p-1 border-r border-black text-left pl-3" colSpan={2}>TOTAL</td>
                                                                <td className="p-1 border-r border-black tabular-nums">{promotionStats.passed.male + promotionStats.failed.male || '-'}</td>
                                                                <td className="p-1 border-r border-black tabular-nums">{promotionStats.passed.female + promotionStats.failed.female || '-'}</td>
                                                                <td className="p-1 tabular-nums bg-gray-300">{promotionStats.passed.male + promotionStats.passed.female + promotionStats.failed.male + promotionStats.failed.female || '-'}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Class Performance Metrics */}
                                                <div className="border border-black overflow-hidden rounded-sm shadow-sm bg-slate-50 p-2 w-full text-[8.5px]">
                                                    <div className="font-bold text-[9px] uppercase border-b border-black pb-0.5 mb-1.5 tracking-wide text-slate-800">
                                                        Class Achievement Analytics
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                        <div className="flex justify-between border-b border-slate-200 pb-0.5">
                                                            <span className="text-slate-600 font-medium">Total Enrolled Learners:</span>
                                                            <span className="font-bold text-slate-900">{sectionStudents.length}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-slate-200 pb-0.5">
                                                            <span className="text-slate-600 font-medium">Class General Average:</span>
                                                            <span className="font-bold text-slate-900">{promotionStats.classCount > 0 ? (promotionStats.classSum / promotionStats.classCount).toFixed(2) : '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-slate-200 pb-0.5">
                                                            <span className="text-slate-600 font-medium">Highest General Average:</span>
                                                            <span className="font-bold text-green-700">{promotionStats.classCount > 0 ? promotionStats.highest : '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-slate-200 pb-0.5">
                                                            <span className="text-slate-600 font-medium">Lowest General Average:</span>
                                                            <span className="font-bold text-red-600">{promotionStats.classCount > 0 ? promotionStats.lowest : '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Learning Area (Subject) Performance Profile */}
                                                <div className="border border-black overflow-hidden rounded-sm shadow-sm w-full">
                                                    <div className="bg-gray-200 p-1.5 font-bold text-[10px] border-b border-black text-center uppercase tracking-wider">
                                                        Learning Area (Subject) Performance Profile
                                                    </div>
                                                    <table className="w-full text-center text-[9px] border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-black font-bold">
                                                                <th className="p-1.5 border-r border-black text-left pl-3 uppercase tracking-tight">Learning Area (Subject)</th>
                                                                <th className="p-1.5 border-r border-black w-14 uppercase">Graded</th>
                                                                <th className="p-1.5 border-r border-black w-20 uppercase">Mean Grade</th>
                                                                <th className="p-1.5 border-r border-black w-14 uppercase">Failed</th>
                                                                <th className="p-1.5 w-20 uppercase">Passing Rate</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {subjectPerformanceStats.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={5} className="p-2 italic text-slate-500 text-center">No graded subject columns present.</td>
                                                                </tr>
                                                            ) : (
                                                                subjectPerformanceStats.map((item, idx) => {
                                                                    const rate = Number(item.passRate);
                                                                    const rateColor = rate < 75.0 ? 'text-red-600 font-bold' : rate >= 90.0 ? 'text-green-700 font-bold' : 'text-slate-800 font-medium';
                                                                    return (
                                                                        <tr key={idx} className="border-b border-black">
                                                                            <td className="p-1 border-r border-black text-left pl-3 font-semibold uppercase">{item.name}</td>
                                                                            <td className="p-1 border-r border-black tabular-nums font-medium">{item.total}</td>
                                                                            <td className="p-1 border-r border-black tabular-nums font-bold">{item.mean}</td>
                                                                            <td className={`p-1 border-r border-black tabular-nums ${item.failed > 0 ? 'text-red-600 font-bold' : 'text-slate-500 font-medium'}`}>{item.failed || '-'}</td>
                                                                            <td className={`p-1 bg-gray-50 tabular-nums ${rateColor}`}>{item.passRate}%</td>
                                                                        </tr>
                                                                    );
                                                                })
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Third Row: Learner Intervention & Remediation Roster */}
                                        <div className="mt-2 mb-1 w-full print:break-inside-avoid" style={{ maxWidth: '1200px' }}>
                                            <div className="border border-black overflow-hidden rounded-sm shadow-sm w-full">
                                                <div className="bg-gray-200 p-1.5 font-bold text-[10px] border-b border-black text-center uppercase tracking-wider">
                                                    Remediation & Intervention Roster
                                                </div>
                                                {remediationRoster.length === 0 ? (
                                                    <div className="p-4 bg-green-50 border-t border-green-200 text-center flex flex-col items-center justify-center gap-1">
                                                        <span className="text-xl">🎉</span>
                                                        <div className="font-bold text-green-800 text-[10px] uppercase tracking-wide">Excellent Class Performance</div>
                                                        <div className="text-green-700 text-[9px] font-medium">100% of the class has met or exceeded academic expectations for this period. No learners require intervention or remediation.</div>
                                                    </div>
                                                ) : (
                                                    <table className="w-full text-center text-[9px] border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-black font-bold">
                                                                <th className="p-1.5 border-r border-black w-24 uppercase">LRN</th>
                                                                <th className="p-1.5 border-r border-black text-left pl-3 uppercase tracking-tight">Learner Name</th>
                                                                <th className="p-1.5 border-r border-black w-14 uppercase">Gender</th>
                                                                <th className="p-1.5 border-r border-black text-left pl-3 uppercase tracking-tight">Subjects Requiring Remediation (Failing Grade)</th>
                                                                <th className="p-1.5 w-28 uppercase">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {remediationRoster.map((student, idx) => (
                                                                <tr key={idx} className="border-b border-black">
                                                                    <td className="p-1 border-r border-black tabular-nums font-medium">{student.lrn}</td>
                                                                    <td className="p-1 border-r border-black text-left pl-3 font-bold uppercase">{student.name}</td>
                                                                    <td className="p-1 border-r border-black uppercase font-medium">{student.gender}</td>
                                                                    <td className="p-1 border-r border-black text-left pl-3 text-red-600 font-semibold leading-tight">
                                                                        {student.failedSubjects.map((sub: any) => `${sub.name} (${sub.grade})`).join(', ')}
                                                                    </td>
                                                                    <td className="p-1 bg-red-50/50 font-bold text-red-700 text-[8px] tracking-wide uppercase">
                                                                        <span className="px-1.5 py-0.5 border border-red-300 rounded bg-white">For Intervention</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
