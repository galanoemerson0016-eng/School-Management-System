import { gradeRecordId } from '../services/grade-record-service';
import { calculateCompositeTermGrade, calculateQuarterlyFinalGrade, calculateWeightedGradeAverage, countMissingGradeValues, countMissingOfferedGradeValues } from '../services/grade-calculation';
import type { GradeCompletionStatus } from '../services/grade-calculation';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, Fragment, useEffect, useCallback, memo, useRef } from 'react';
import { useAppStore } from '../stores/app-store';
import { useAuthStore } from '../stores/auth-store';
import { Printer, ArrowLeft, ChevronDown, RefreshCcw, Trash2, FileSpreadsheet, Upload, Plus, Minus, Download, Bug, AlertTriangle, CheckCircle2, Lock, Unlock, ChevronLeft, ChevronRight, RefreshCw, X, Search, RotateCcw, Sparkles, Crosshair } from 'lucide-react';
import * as XLSX from 'xlsx';
import { assertSafeWorkbookFile, readSafeWorkbook } from '../utils/safe-workbook-reader';
import { filterSF9Sections } from '../lib/rbac';
import { formatGradeForDisplay } from '../lib/grading';
import { getSubjectsForGrade, normalizeSubjectName, sortSubjects, getCanonicalSubjectKey, getSubjectCategory, getStandardSubjectPriority } from '../lib/subjectConfig';
import { getDefaultTermForSubject, getShsSubjectUnitInfo, getCurriculumTemplatesForSection, SPECIAL_SUBJECTS, isGrade11CoreSubject, resolveSubjectOfferedTerms } from '../lib/curriculum';
import { resolveStudentQuarterGrade, isMatchingSubject, isSameSubject, normalizeGrade12PESubjectName, cleanSubjectQuery, isQuarterMatch, isSubjectInTeachingLoad, extractSubjectSequence, isStudentInSection, isMaleStudent, isFemaleStudent } from '../utils/grading-helpers';
import { autoRepairSectionCurriculum } from '../services/curriculumSync';
import { getCurriculumPreset } from '../lib/curriculumPresets';
import type { Subject, ClassRecord, Section, Student } from '../types';
import { useTableCrosshair } from '../hooks/useTableCrosshair';

type QuarterGrades = {
    q1?: QuarterGradeCell;
    q2?: QuarterGradeCell;
    q3?: QuarterGradeCell;
    q4?: QuarterGradeCell;
    final?: number;
    finalStatus?: GradeCompletionStatus;
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

const getDescriptor = (grade: number | string, _gradeLevel?: string) => {
    if (!grade && grade !== 0) return '';
    
    const strVal = String(grade).trim().toUpperCase();
    if (strVal === 'A') return 'Advancing';
    if (strVal === 'B') return 'Benchmarking';
    if (strVal === 'C') return 'Connecting';
    if (strVal === 'D') return 'Developing';
    if (strVal === 'E') return 'Emerging';

    const num = Number(grade);
    if (isNaN(num) || num <= 0) return '';
    
    // Unified Word Descriptors for all Grade Levels
    if (num >= 90) return 'Advancing';
    if (num >= 80) return 'Benchmarking';
    if (num >= 75) return 'Connecting';
    if (num >= 65) return 'Developing';
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
    generalAverageStatus?: GradeCompletionStatus;
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

const isEcmkParent = (name: string) => name.toLowerCase().includes('effective communication') && name.toLowerCase().includes('mabisang komunikasyon');
const GENERAL_AVERAGE_COLUMN_WIDTH = 66;
const AVERAGE_COLUMN_WIDTH = GENERAL_AVERAGE_COLUMN_WIDTH;










const GradeInput = ({ 
    studentLrn, subjectId, subjectName, quarter, value, className, activeSchoolYear, 
    subjects, sectionObj, updateGradingSheetRecord: _updateGradingSheetRecord, row, col,
    isMissing, isLocked
}: any) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const valueRef = useRef(value);
    const localValueRef = useRef(localValue);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        valueRef.current = value;
        // Do not overwrite what the user is actively typing if the input is currently focused or debouncing
        if (document.activeElement !== inputRef.current && !timeoutRef.current) {
            setLocalValue(value || '');
            localValueRef.current = value || '';
        }
    }, [value]);

    const saveChanges = async (targetVal: string) => {
        if (targetVal === valueRef.current) return;

        if (isLocked) {
            useAppStore.getState().showNotification(`Term ${quarter} is locked. Unlock it in the Lock menu to edit.`, 'error');
            setLocalValue(valueRef.current || '');
            localValueRef.current = valueRef.current || '';
            return;
        }

        const valNum = Number(targetVal);
        if (targetVal !== '' && (isNaN(valNum) || valNum < 0 || valNum > 100)) {
            useAppStore.getState().showNotification('Grades must be between 0 and 100.', 'error');
            setLocalValue(valueRef.current || '');
            localValueRef.current = valueRef.current || '';
            return;
        }

        setIsSaving(true);
        try {
            const subject = (subjects || []).find((s: any) => s.id === subjectId);
            const section = sectionObj;

            if (!section) {
                console.error("Section not found for grading record");
                return;
            }

            const { updateGradingSheetRecord } = useAppStore.getState();
            const recordId = `official:${gradeRecordId({ student_lrn: studentLrn, subject_id: subjectId, section_id: section.id, school_year: activeSchoolYear, quarter: quarter as 1 | 2 | 3 | 4 })}`;
            const resolvedSubName = subjectName || subject?.subject_name || cleanSubjectQuery(subjectId).replace(/_/g, ' ') || '';

            {
                // Preserve an intentional blank so raw-score fallback cannot resurrect it.
                await updateGradingSheetRecord({
                    id: recordId,
                    student_lrn: studentLrn,
                    subject_id: subjectId,
                    subject_name: resolvedSubName,
                    section_id: section.id,
                    quarter: quarter as 1 | 2 | 3,
                    school_year: activeSchoolYear,
                    final_grade: targetVal === '' ? '' : valNum,
                    grade_source: 'manual_override',
                    written_works: [],
                    performance_tasks: [],
                    quarterly_exam: 0
                });
            }
            valueRef.current = targetVal;
        } catch (error) {
            console.error("Failed to update grading record", error);
        } finally {
            setIsSaving(false);
        }
    };

    const saveChangesRef = useRef(saveChanges);
    saveChangesRef.current = saveChanges;

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (localValueRef.current !== valueRef.current) {
                saveChangesRef.current(localValueRef.current);
            }
        };
    }, []);

    const handleBlur = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        saveChanges(localValueRef.current);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        localValueRef.current = val;
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            saveChanges(val);
        }, 400);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            saveChanges(localValueRef.current);
            (e.target as HTMLInputElement).blur();
            return;
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            saveChanges(localValueRef.current);
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
        <div 
            className={`relative w-full h-full group ${isMissing ? 'bg-amber-100/80 dark:bg-amber-950/50 is-missing' : ''} ${isLocked ? 'bg-slate-100/60 dark:bg-slate-800/40' : ''}`}
            title={isLocked ? `Term ${quarter} is locked against editing.` : undefined}
        >
            <input
                ref={inputRef}
                type="number"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isSaving || isLocked}
                data-row={row}
                data-col={col}
                className={`grade-input-field w-full h-full bg-transparent text-center focus:bg-blue-50 focus:outline-none transition-colors border-none p-0 hide-number-arrows text-[9px] font-medium ${isSaving ? 'opacity-50' : ''} ${isLocked ? 'cursor-not-allowed opacity-55 text-slate-400 font-normal select-none' : ''} ${isMissing ? 'is-missing text-amber-900 dark:text-amber-200 placeholder-amber-400 font-bold' : ''} ${className || ''}`}
                style={{ appearance: 'none', MozAppearance: 'textfield' }}
                placeholder={isMissing ? '—' : ''}
            />
            {/* Subtle hover & missing / locked indicator */}
            <div className={`absolute inset-0 border pointer-events-none transition-colors ${isLocked ? 'border-transparent' : isMissing ? 'border-amber-400 dark:border-amber-500 group-hover:border-amber-600' : 'border-transparent group-hover:border-blue-200'}`}></div>
            {isLocked && (
                <div className="absolute top-0.5 right-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <Lock className="w-2 h-2 text-slate-400" />
                </div>
            )}
            {isSaving && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                </div>
            )}
        </div>
    );
};

const formatLearnerName = (student: any) => {
    const middleInitial = typeof student.middle_name === 'string' && student.middle_name ? `${student.middle_name.charAt(0)}.` : '';
    return `${student.last_name || ''}, ${student.first_name || ''} ${middleInitial}`.trim().replace(/\s+/g, ' ').toUpperCase();
};

const TERM_LABELS = {
    q1: 'TERM 1',
    q2: 'TERM 2',
    q3: 'TERM 3',
    all: 'Final & General Average'
} as const;

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
    highlightMissingGrades?: boolean;
    lockedQuarters?: ('q1' | 'q2' | 'q3' | 'q4')[];
    customColumnWidths?: Record<string, number>;
    averageColWidth?: number;
    generalAvgColWidth?: number;
    descriptorColWidth?: number;
    getSubjectOfferedTerms?: (sub: any) => number[];
}

const areEqual = (prev: StudentGradeRowProps, next: StudentGradeRowProps) => {
    if (prev.studentRow !== next.studentRow) return false;
    if (prev.highlightMissingGrades !== next.highlightMissingGrades) return false;
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
    if (prev.lockedQuarters !== next.lockedQuarters) return false;
    if (prev.customColumnWidths !== next.customColumnWidths) return false;
    if (prev.averageColWidth !== next.averageColWidth) return false;
    if (prev.generalAvgColWidth !== next.generalAvgColWidth) return false;
    if (prev.descriptorColWidth !== next.descriptorColWidth) return false;
    if (prev.getSubjectOfferedTerms !== next.getSubjectOfferedTerms) return false;
    
    if (prev.subjectColumns?.length !== next.subjectColumns?.length) return false;
    
    const prevData = prev.data || {};
    const nextData = next.data || {};
    if (prevData.generalAverageStatus !== nextData.generalAverageStatus ||
        prevData.generalAverage !== nextData.generalAverage ||
        prevData.termAverage !== nextData.termAverage) return false;
    for (let i = 0; i < prev.subjectColumns.length; i++) {
        const colId = prev.subjectColumns[i].subject.id;
        const prevColData = prevData[colId];
        const nextColData = nextData[colId];
        if (prevColData !== nextColData) {
            if (!prevColData || !nextColData) return false;
            if (prevColData.q1 !== nextColData.q1 ||
                prevColData.q2 !== nextColData.q2 ||
                prevColData.q3 !== nextColData.q3 ||
                prevColData.final !== nextColData.final ||
                prevColData.finalStatus !== nextColData.finalStatus) {
                return false;
            }
        }
    }
    return true;
};

const ColumnResizeHandle = memo(({
    colKey,
    currentWidth,
    onResizeStart,
    onAutoFit
}: {
    colKey: string;
    currentWidth: number;
    onResizeStart: (e: React.MouseEvent, key: string, currentWidth: number) => void;
    onAutoFit: (key: string) => void;
}) => (
    <div
        className="absolute top-0 right-0 w-2.5 h-full cursor-col-resize hover:bg-indigo-500/40 active:bg-indigo-600 transition-colors z-30 select-none no-print group/handle flex items-center justify-center"
        onMouseDown={(e) => onResizeStart(e, colKey, currentWidth)}
        onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAutoFit(colKey);
        }}
        title="Drag to resize column | Double-click to auto-fit"
    >
        <div className="w-[1.5px] h-3 bg-slate-400/80 group-hover/handle:bg-indigo-600 dark:bg-slate-500 rounded-full opacity-0 group-hover/handle:opacity-100 transition-opacity" />
    </div>
));

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
    highlightMissingGrades,
    lockedQuarters,
    customColumnWidths,
    averageColWidth,
    generalAvgColWidth,
    descriptorColWidth,
    getSubjectOfferedTerms,
}: StudentGradeRowProps) => {
    const isQuarterLocked = (q: string | number) => {
        const key = (typeof q === 'number' ? `q${q}` : q.toLowerCase()) as 'q1' | 'q2' | 'q3' | 'q4';
        return (lockedQuarters || []).includes(key);
    };

    const getSubColWidth = (subId: string, _subject?: any) => {
        if (customColumnWidths && customColumnWidths[subId]) return customColumnWidths[subId];
        return subjectColumnWidth;
    };
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
        <tr className="hover:bg-blue-50/20 grade-row" data-row-key={student.lrn}>
            <td className={`consolidated-learner-name student-name-cell border border-black ${isElementary ? 'p-0.5 pl-1.5' : 'p-1 pl-2'} font-medium truncate whitespace-nowrap uppercase`} data-col-key="learner-name" style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px` }}>
                <span className="inline-block w-4 text-gray-500 mr-1 text-[7px] text-center font-bold tracking-tighter">
                    {studentRow + 1}
                </span> 
                {formatLearnerName(student)}
            </td>
            {subjectColumns.map((column, index) => {
                const sData = data[column.subject.id] || {};
                const currentCol = colIndices[index];
                const subWidth = getSubColWidth(column.subject.id);
                return (
                    <Fragment key={`${student.lrn}-${column.baseId}-${index}`}>
                        {selectedTerm !== 'all' && (column.subject as any)._mapehGroups ? (
                            <>
                                {(() => {
                                    const maVal = activeQuarterTerm ? getQuarterGradeDetail(sData[activeQuarterTerm])?.musicArts : undefined;
                                    const isMaMissing = Boolean(highlightMissingGrades && activeQuarterTerm && (!maVal && maVal !== 0));
                                    const phVal = activeQuarterTerm ? getQuarterGradeDetail(sData[activeQuarterTerm])?.peHealth : undefined;
                                    const isPhMissing = Boolean(highlightMissingGrades && activeQuarterTerm && (!phVal && phVal !== 0));
                                    const maComp = column.subject._mapehGroups?.musicArts?.[0] || {
                                        id: `virtual_music_arts_${sectionObj?.id || 'sec'}`,
                                        subject_name: 'Music and Arts'
                                    };
                                    const phComp = column.subject._mapehGroups?.peHealth?.[0] || {
                                        id: `virtual_pe_health_${sectionObj?.id || 'sec'}`,
                                        subject_name: 'Physical Education and Health'
                                    };
                                    return (
                                        <>
                                            <td className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isMaMissing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`} data-col-key={`sub-${column.subject.id}-ma`} style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                {activeQuarterTerm ? (
                                                    <GradeInput 
                                                        studentLrn={student.lrn} 
                                                        subjectId={maComp.id} 
                                                        subjectName={maComp.subject_name}
                                                        quarter={activeQuarterTerm === 'q1' ? 1 : activeQuarterTerm === 'q2' ? 2 : activeQuarterTerm === 'q3' ? 3 : 4} 
                                                        value={maVal} 
                                                        activeSchoolYear={activeSchoolYear}
                                                        subjects={subjects}
                                                        sectionObj={sectionObj}
                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                        row={studentRow} col={currentCol}
                                                        isMissing={isMaMissing}
                                                        isLocked={isQuarterLocked(activeQuarterTerm)}
                                                    />
                                                ) : ''}
                                            </td>
                                            <td className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isPhMissing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`} data-col-key={`sub-${column.subject.id}-ph`} style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                {activeQuarterTerm ? (
                                                    <GradeInput 
                                                        studentLrn={student.lrn} 
                                                        subjectId={phComp.id} 
                                                        subjectName={phComp.subject_name}
                                                        quarter={activeQuarterTerm === 'q1' ? 1 : activeQuarterTerm === 'q2' ? 2 : activeQuarterTerm === 'q3' ? 3 : 4} 
                                                        value={phVal} 
                                                        activeSchoolYear={activeSchoolYear}
                                                        subjects={subjects}
                                                        sectionObj={sectionObj}
                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                        row={studentRow} col={currentCol + 1}
                                                        isMissing={isPhMissing}
                                                        isLocked={isQuarterLocked(activeQuarterTerm)}
                                                    />
                                                ) : ''}
                                            </td>
                                            <td className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-semibold bg-gray-200" data-col-key={`sub-${column.subject.id}`} style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>{activeQuarterTerm ? (getQuarterGradeValue(sData[activeQuarterTerm]) || '') : ''}</td>
                                        </>
                                    );
                                })()}
                            </>
                        ) : selectedTerm !== 'all' && isEcmkParent(column.subject.subject_name) ? (
                            <>
                                {(() => {
                                    const ecVal = activeQuarterTerm ? getQuarterGradeDetail(sData[activeQuarterTerm])?.effectiveComm : undefined;
                                    const isEcMissing = Boolean(highlightMissingGrades && activeQuarterTerm && (!ecVal && ecVal !== 0));
                                    const mkVal = activeQuarterTerm ? getQuarterGradeDetail(sData[activeQuarterTerm])?.mabisangKom : undefined;
                                    const isMkMissing = Boolean(highlightMissingGrades && activeQuarterTerm && (!mkVal && mkVal !== 0));
                                    const ecComp = column.subject._ecmkGroups?.effectiveComm?.[0] || {
                                        id: `virtual_effective_comm_${sectionObj?.id || 'sec'}`,
                                        subject_name: 'Effective Communication'
                                    };
                                    const mkComp = column.subject._ecmkGroups?.mabisangKom?.[0] || {
                                        id: `virtual_mabisang_kom_${sectionObj?.id || 'sec'}`,
                                        subject_name: 'Mabisang Komunikasyon'
                                    };
                                    return (
                                        <>
                                            <td className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isEcMissing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`} data-col-key={`sub-${column.subject.id}-ec`} style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                {activeQuarterTerm ? (
                                                    <GradeInput 
                                                        studentLrn={student.lrn} 
                                                        subjectId={ecComp.id} 
                                                        subjectName={ecComp.subject_name}
                                                        quarter={activeQuarterTerm === 'q1' ? 1 : activeQuarterTerm === 'q2' ? 2 : activeQuarterTerm === 'q3' ? 3 : 4} 
                                                        value={ecVal} 
                                                        activeSchoolYear={activeSchoolYear}
                                                        subjects={subjects}
                                                        sectionObj={sectionObj}
                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                        row={studentRow} col={currentCol}
                                                        isMissing={isEcMissing}
                                                        isLocked={isQuarterLocked(activeQuarterTerm)}
                                                    />
                                                ) : ''}
                                            </td>
                                            <td className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isMkMissing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`} data-col-key={`sub-${column.subject.id}-mk`} style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                {activeQuarterTerm ? (
                                                    <GradeInput 
                                                        studentLrn={student.lrn} 
                                                        subjectId={mkComp.id} 
                                                        subjectName={mkComp.subject_name}
                                                        quarter={activeQuarterTerm === 'q1' ? 1 : activeQuarterTerm === 'q2' ? 2 : activeQuarterTerm === 'q3' ? 3 : 4} 
                                                        value={mkVal} 
                                                        activeSchoolYear={activeSchoolYear}
                                                        subjects={subjects}
                                                        sectionObj={sectionObj}
                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                        row={studentRow} col={currentCol + 1}
                                                        isMissing={isMkMissing}
                                                        isLocked={isQuarterLocked(activeQuarterTerm)}
                                                    />
                                                ) : ''}
                                            </td>
                                            <td className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-semibold bg-gray-200" data-col-key={`sub-${column.subject.id}`} style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>{activeQuarterTerm ? (getQuarterGradeValue(sData[activeQuarterTerm]) || '') : ''}</td>
                                        </>
                                    );
                                })()}
                            </>
                        ) : (
                            <>
                                {(() => {
                                    const q1Val = getQuarterGradeValue(sData.q1);
                                    const isQ1Missing = Boolean(highlightMissingGrades && (!q1Val && q1Val !== 0));
                                    const q2Val = getQuarterGradeValue(sData.q2);
                                    const isQ2Missing = Boolean(highlightMissingGrades && (!q2Val && q2Val !== 0));
                                    const q3Val = getQuarterGradeValue(sData.q3);
                                    const isQ3Missing = Boolean(highlightMissingGrades && (!q3Val && q3Val !== 0));
                                    
                                    const offered = getSubjectOfferedTerms 
                                        ? getSubjectOfferedTerms(column.subject) 
                                        : resolveSubjectOfferedTerms(column.subject, sectionObj);

                                    if (selectedTerm === 'all') {
                                        const isT1 = offered.includes(1);
                                        const isT2 = offered.includes(2);
                                        const isT3 = offered.includes(3);

                                        const isQ1Missing = Boolean(highlightMissingGrades && isT1 && (!q1Val && q1Val !== 0));
                                        const isQ2Missing = Boolean(highlightMissingGrades && isT2 && (!q2Val && q2Val !== 0));
                                        const isQ3Missing = Boolean(highlightMissingGrades && isT3 && (!q3Val && q3Val !== 0));

                                        let finalVal = sData.final;
                                        if (finalVal === undefined || finalVal === null) {
                                            const offeredGrades = [
                                                isT1 ? q1Val : null,
                                                isT2 ? q2Val : null,
                                                isT3 ? q3Val : null,
                                            ].filter((v): v is number => typeof v === 'number' && v > 0);
                                            if (offeredGrades.length > 0) {
                                                finalVal = Math.round(offeredGrades.reduce((a, b) => a + b, 0) / offeredGrades.length);
                                            }
                                        }

                                        return (
                                            <>
                                                {isT1 ? (
                                                    <td
                                                        className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isQ1Missing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`}
                                                        data-col-key={`sub-${column.subject.id}-q1`}
                                                        style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                    >
                                                        {formatGradeForDisplay(q1Val, sectionObj?.section_grade_level || '') || ''}
                                                    </td>
                                                ) : (
                                                    <td
                                                        className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-normal bg-gray-200/90 dark:bg-slate-800 text-gray-400 dark:text-slate-500 select-none cursor-not-allowed"
                                                        data-col-key={`sub-${column.subject.id}-q1`}
                                                        style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                        title="Not offered in Term 1"
                                                    >
                                                        —
                                                    </td>
                                                )}

                                                {isT2 ? (
                                                    <td
                                                        className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isQ2Missing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`}
                                                        data-col-key={`sub-${column.subject.id}-q2`}
                                                        style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                    >
                                                        {formatGradeForDisplay(q2Val, sectionObj?.section_grade_level || '') || ''}
                                                    </td>
                                                ) : (
                                                    <td
                                                        className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-normal bg-gray-200/90 dark:bg-slate-800 text-gray-400 dark:text-slate-500 select-none cursor-not-allowed"
                                                        data-col-key={`sub-${column.subject.id}-q2`}
                                                        style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                        title="Not offered in Term 2"
                                                    >
                                                        —
                                                    </td>
                                                )}

                                                {isT3 ? (
                                                    <td
                                                        className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isQ3Missing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`}
                                                        data-col-key={`sub-${column.subject.id}-q3`}
                                                        style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                    >
                                                        {formatGradeForDisplay(q3Val, sectionObj?.section_grade_level || '') || ''}
                                                    </td>
                                                ) : (
                                                    <td
                                                        className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-normal bg-gray-200/90 dark:bg-slate-800 text-gray-400 dark:text-slate-500 select-none cursor-not-allowed"
                                                        data-col-key={`sub-${column.subject.id}-q3`}
                                                        style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                        title="Not offered in Term 3"
                                                    >
                                                        —
                                                    </td>
                                                )}

                                                <td
                                                    className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-bold bg-gray-200"
                                                    data-col-key={`sub-${column.subject.id}-final`}
                                                    style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                    title={sData.finalStatus === 'complete'
                                                        ? 'Final grade is complete for this subject’s offered terms.'
                                                        : sData.finalStatus === 'provisional'
                                                            ? 'Incomplete: one or more offered terms are missing.'
                                                            : 'No final grade is available.'}
                                                >
                                                    <span className="inline-flex items-center justify-center gap-0.5">
                                                        {formatGradeForDisplay(finalVal, sectionObj?.section_grade_level || '') || ''}
                                                    </span>
                                                </td>
                                            </>
                                        );
                                    }

                                    const currentTermNum = selectedTerm === 'q1' ? 1 : selectedTerm === 'q2' ? 2 : selectedTerm === 'q3' ? 3 : 4;
                                    const isCurrentTermOffered = offered.includes(currentTermNum);

                                    if (!isCurrentTermOffered) {
                                        return (
                                            <td
                                                className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-normal bg-gray-200/90 dark:bg-slate-800 text-gray-400 dark:text-slate-500 select-none cursor-not-allowed"
                                                data-col-key={`sub-${column.subject.id}`}
                                                style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                title={`Not offered in ${TERM_LABELS[selectedTerm as keyof typeof TERM_LABELS] || 'this term'}`}
                                            >
                                                —
                                            </td>
                                        );
                                    }

                                    return (
                                        <>
                                            {selectedTerm === 'q1' && (
                                                <td className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isQ1Missing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`} data-col-key={`sub-${column.subject.id}`} style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                    <GradeInput 
                                                        studentLrn={student.lrn} 
                                                        subjectId={column.subject.id} 
                                                        subjectName={column.subject.subject_name}
                                                        quarter={1} 
                                                        value={sData.q1} 
                                                        activeSchoolYear={activeSchoolYear}
                                                        subjects={subjects}
                                                        sectionObj={sectionObj}
                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                        row={studentRow} col={currentCol}
                                                        isMissing={isQ1Missing}
                                                        isLocked={isQuarterLocked('q1')}
                                                    />
                                                </td>
                                            )}
                                            {selectedTerm === 'q2' && (
                                                <td className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isQ2Missing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`} data-col-key={`sub-${column.subject.id}`} style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                    <GradeInput 
                                                        studentLrn={student.lrn} 
                                                        subjectId={column.subject.id} 
                                                        subjectName={column.subject.subject_name}
                                                        quarter={2} 
                                                        value={sData.q2} 
                                                        activeSchoolYear={activeSchoolYear}
                                                        subjects={subjects}
                                                        sectionObj={sectionObj}
                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                        row={studentRow} col={currentCol}
                                                        isMissing={isQ2Missing}
                                                        isLocked={isQuarterLocked('q2')}
                                                    />
                                                </td>
                                            )}
                                            {selectedTerm === 'q3' && (
                                                <td className={`consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium ${isQ3Missing ? 'bg-amber-100/70 dark:bg-amber-950/40 ring-1 ring-inset ring-amber-400' : ''}`} data-col-key={`sub-${column.subject.id}`} style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                    <GradeInput 
                                                        studentLrn={student.lrn} 
                                                        subjectId={column.subject.id} 
                                                        subjectName={column.subject.subject_name}
                                                        quarter={3} 
                                                        value={sData.q3} 
                                                        activeSchoolYear={activeSchoolYear}
                                                        subjects={subjects}
                                                        sectionObj={sectionObj}
                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                        row={studentRow} col={currentCol}
                                                        isMissing={isQ3Missing}
                                                        isLocked={isQuarterLocked('q3')}
                                                    />
                                                </td>
                                            )}
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </Fragment>
                );
            })}
            {showGenAvg && (
                <>
                    <td className={`consolidated-average-col border border-black ${isElementary ? 'p-0.5' : 'p-1'} text-center font-bold bg-gray-50/50 tabular-nums`} data-col-key="col-average" style={{ width: `${averageColWidth || 65}px`, minWidth: `${averageColWidth || 65}px` }} title={data.generalAverageStatus === 'complete' ? 'Average is complete for the applicable offered subjects.' : data.generalAverageStatus === 'provisional' ? 'General average (applicable subject grades are incomplete).' : 'No average is available.'}>{data.termAverage || ''}</td>
                    <td className={`consolidated-general-average-col border border-black ${isElementary ? 'p-0.5' : 'p-1'} text-center font-bold bg-gray-100/50 tabular-nums`} data-col-key="col-generalAverage" style={{ width: `${generalAvgColWidth || 75}px`, minWidth: `${generalAvgColWidth || 75}px` }} title={data.generalAverageStatus === 'complete' ? 'Average is complete for the applicable offered subjects.' : data.generalAverageStatus === 'provisional' ? 'General average (applicable subject grades are incomplete).' : 'No average is available.'}>
                        <span className="inline-flex items-center justify-center gap-1">{data.generalAverage || ''}</span>
                    </td>
                    {showDescriptor && (
                        <td className="consolidated-descriptor-col border border-black p-1 text-center font-bold bg-gray-200 text-[6px] leading-tight uppercase" data-col-key="col-descriptor" style={{ width: `${descriptorColWidth || 100}px`, minWidth: `${descriptorColWidth || 100}px` }}>
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
        sections, subjects, students, gradingSheetRecords, updateGradingSheetRecord, bulkUpdateGradingSheetRecords,
        activeSchoolYear, schoolProfile, setCurrentView,
        selectedSection, setSelectedSection, classRecords, hpsRecords, showNotification
    } = useAppStore();
    const { user } = useAuthStore();

    const [selectedTerm, setSelectedTerm] = useState<'q1' | 'q2' | 'q3' | 'all'>('q1');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [highlightMissingGrades, setHighlightMissingGrades] = useState(false);
    const [showMissingOnly, setShowMissingOnly] = useState(false);
    const [showMissingGradesPopover, setShowMissingGradesPopover] = useState(false);
    const [isLockPopoverOpen, setIsLockPopoverOpen] = useState(false);
    const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
    const [addSubjectSearchQuery, setAddSubjectSearchQuery] = useState('');
    const [customSubjectName, setCustomSubjectName] = useState('');
    const [zoom, setZoom] = useState(0.9);
    const { containerRef, isCrosshairEnabled, toggleCrosshair } = useTableCrosshair();
    const showGenAvg = selectedTerm !== 'all';

    // Derived State
    const sectionObj = useMemo(() => sections.find(s => s.id === selectedSection || s.section_name === selectedSection), [sections, selectedSection]);

    // Quarter Lock Helpers
    const lockedQuarters: ('q1' | 'q2' | 'q3' | 'q4')[] = useMemo(() => {
        return sectionObj?.section_metadata?.lockedQuarters || [];
    }, [sectionObj?.section_metadata?.lockedQuarters]);

    const isQuarterLocked = useCallback((q: string | number) => {
        const key = (typeof q === 'number' ? `q${q}` : String(q).toLowerCase()) as 'q1' | 'q2' | 'q3' | 'q4';
        return lockedQuarters.includes(key);
    }, [lockedQuarters]);

    const handleToggleQuarterLock = async (qKey: 'q1' | 'q2' | 'q3' | 'q4') => {
        if (!sectionObj) return;
        const exists = lockedQuarters.includes(qKey);
        const updatedLocked = exists
            ? lockedQuarters.filter(k => k !== qKey)
            : [...lockedQuarters, qKey];

        const updatedSection: Section = {
            ...sectionObj,
            section_metadata: {
                ...sectionObj.section_metadata,
                lockedQuarters: updatedLocked
            }
        };
        try {
            await useAppStore.getState().updateSection(updatedSection);
            const termNum = qKey.replace('q', '');
            showNotification(
                exists ? `Unlocked Term ${termNum}` : `Locked Term ${termNum} against accidental edits`,
                'success'
            );
        } catch (err) {
            console.error('Failed to update term lock:', err);
            showNotification('Failed to update term lock status.', 'error');
        }
    };

    const handleBatchLockQuarters = async (quarters: ('q1' | 'q2' | 'q3' | 'q4')[]) => {
        if (!sectionObj) return;
        const updatedSection: Section = {
            ...sectionObj,
            section_metadata: {
                ...sectionObj.section_metadata,
                lockedQuarters: quarters
            }
        };
        try {
            await useAppStore.getState().updateSection(updatedSection);
            showNotification(
                quarters.length > 0 ? 'All terms locked.' : 'All terms unlocked.',
                'success'
            );
        } catch (err) {
            console.error('Failed to batch update term locks:', err);
            showNotification('Failed to update term locks.', 'error');
        }
    };

    // ADVISORY CHECK: Is the current user the adviser of this section or an admin?
    const isAdviser = useMemo(() => {
        if (!sectionObj || !user) return false;
        if (user.role === 'admin' || user.role === 'principal' || user.role === 'registrar') return true;
        
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
        if (!sectionObj || !isAdviser) {
            showNotification('Sync is only available in your Advisory Class.', 'info');
            return;
        }

        const baseQuarters: (1 | 2 | 3)[] = selectedTerm === 'all'
            ? [1, 2, 3]
            : [parseInt(selectedTerm.replace('q', '')) as 1 | 2 | 3];
        const quartersToSync = baseQuarters.filter(q => !isQuarterLocked(q));

        if (quartersToSync.length === 0) {
            showNotification('Selected term(s) are locked against syncing. Unlock them in the Lock menu first.', 'error');
            return;
        }
        if (quartersToSync.length < baseQuarters.length) {
            showNotification('Skipped locked term(s) during sync.', 'info');
        }
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

        // Filter subjects that belong to the adviser's personal teaching load in this section
        const teachingLoadSubjects = sectionSubjects.filter(sub => isSubjectInTeachingLoad(sub, sectionObj, classRecords));

        if (teachingLoadSubjects.length === 0) {
            showNotification('No subjects in this section are part of your personal teaching load. Grades for subjects taught by other teachers are preserved for manual input.', 'info');
            return;
        }

        setIsSyncing(true);
        const recordsToSync: ClassRecord[] = [];
        const recordsToDelete: string[] = [];
        const { gradingSheetRecords: currentGradingRecords, deleteGradingSheetRecord } = useAppStore.getState();

        const findExistingGradingRecord = (studentLrn: string, subId: string, subName: string | undefined, q: number) => {
            return currentGradingRecords.find(r =>
                (r.student_lrn === studentLrn || String(r.student_lrn).trim() === String(studentLrn).trim()) &&
                isQuarterMatch(r.quarter, q) &&
                (!activeSchoolYear || !r.school_year || r.school_year === activeSchoolYear) &&
                (r.subject_id === subId || isSameSubject(r.subject_id, r.subject_name, subId, subName))
            );
        };

        try {
            // Process each quarter in quartersToSync
            for (const quarter of quartersToSync) {
                // Process each student in the section
                for (const student of sectionStudents) {
                    // Process ONLY subjects in the adviser's teaching load
                    for (const subject of teachingLoadSubjects) {
                        if (subject._mapehGroups) {
                            const maComps = (subject._mapehGroups.musicArts || []).filter(comp => isSubjectInTeachingLoad(comp, sectionObj, classRecords));
                            const peComps = (subject._mapehGroups.peHealth || []).filter(comp => isSubjectInTeachingLoad(comp, sectionObj, classRecords));
                            for (const comp of [...maComps, ...peComps]) {
                                const compGrade = resolveStudentQuarterGrade({
                                    studentLrn: student.lrn,
                                    subjectId: comp.id,
                                    subjectName: comp.subject_name,
                                    sectionId: sectionObj.id,
                                    quarter,
                                    schoolYear: activeSchoolYear,
                                    classRecords,
                                    gradingSheetRecords: [],
                                    hpsRecords,
                                    sectionGradeLevel,
                                    sectionTrack,
                                    subjectObj: comp
                                });
                                if (compGrade > 0) {
                                    recordsToSync.push({
                                        id: `${student.lrn}_${comp.id}_${quarter}_${activeSchoolYear}`,
                                        student_lrn: student.lrn,
                                        subject_id: comp.id,
                                        subject_name: comp.subject_name,
                                        section_id: sectionObj.id,
                                        quarter: quarter as 1 | 2 | 3,
                                        school_year: activeSchoolYear,
                                        final_grade: compGrade,
                    grade_source: 'eclass_sync',
                                        written_works: [],
                                        performance_tasks: [],
                                        quarterly_exam: 0
                                    });
                                }
                            }
                            // Also clear any rogue parent MAPEH record if present
                            const oldParent = findExistingGradingRecord(student.lrn, subject.id, subject.subject_name, quarter);
                            if (oldParent?.id) recordsToDelete.push(oldParent.id);
                        } else if (isEcmkParent(subject.subject_name) || subject._ecmkGroups) {
                            const ecmkGroups = (subject as any)._ecmkGroups;
                            const ecComps = (ecmkGroups?.effectiveComm || []).filter((comp: any) => isSubjectInTeachingLoad(comp, sectionObj, classRecords));
                            const mkComps = (ecmkGroups?.mabisangKom || []).filter((comp: any) => isSubjectInTeachingLoad(comp, sectionObj, classRecords));
                            for (const comp of [...ecComps, ...mkComps]) {
                                const compGrade = resolveStudentQuarterGrade({
                                    studentLrn: student.lrn,
                                    subjectId: comp.id,
                                    subjectName: comp.subject_name,
                                    sectionId: sectionObj.id,
                                    quarter,
                                    schoolYear: activeSchoolYear,
                                    classRecords,
                                    gradingSheetRecords: [],
                                    hpsRecords,
                                    sectionGradeLevel,
                                    sectionTrack,
                                    subjectObj: comp
                                });
                                if (compGrade > 0) {
                                    recordsToSync.push({
                                        id: `${student.lrn}_${comp.id}_${quarter}_${activeSchoolYear}`,
                                        student_lrn: student.lrn,
                                        subject_id: comp.id,
                                        subject_name: comp.subject_name,
                                        section_id: sectionObj.id,
                                        quarter: quarter as 1 | 2 | 3,
                                        school_year: activeSchoolYear,
                                        final_grade: compGrade,
                    grade_source: 'eclass_sync',
                                        written_works: [],
                                        performance_tasks: [],
                                        quarterly_exam: 0
                                    });
                                }
                            }
                            // Also clear any rogue parent EC/MK record if present
                            const oldParent = findExistingGradingRecord(student.lrn, subject.id, subject.subject_name, quarter);
                            if (oldParent?.id) recordsToDelete.push(oldParent.id);
                        } else {
                            const finalGrade = resolveStudentQuarterGrade({
                                studentLrn: student.lrn,
                                subjectId: subject.id,
                                subjectName: subject.subject_name,
                                sectionId: sectionObj.id,
                                quarter,
                                schoolYear: activeSchoolYear,
                                classRecords,
                                gradingSheetRecords: [],
                                hpsRecords,
                                sectionGradeLevel,
                                sectionTrack,
                                subjectObj: subject
                            });

                        if (finalGrade > 0) {
                            recordsToSync.push({
                                id: `${student.lrn}_${subject.id}_${quarter}_${activeSchoolYear}`,
                                student_lrn: student.lrn,
                                subject_id: subject.id,
                                subject_name: subject.subject_name,
                                section_id: sectionObj.id,
                                quarter: quarter as 1 | 2 | 3,
                                school_year: activeSchoolYear,
                                final_grade: finalGrade,
                    grade_source: 'eclass_sync',
                                written_works: [],
                                performance_tasks: [],
                                quarterly_exam: 0
                            });
                        }
                    }
                }
            }
        }

            // 1. Delete stale records for subjects in teaching load with no grades in E-Class Record
            const uniqueDeleteIds = Array.from(new Set(recordsToDelete));
            for (const delId of uniqueDeleteIds) {
                await deleteGradingSheetRecord(delId);
            }

            // 2. Add / update active records from E-Class Record
            const syncResult = recordsToSync.length > 0
                ? await bulkUpdateGradingSheetRecords(recordsToSync)
                : { updated: 0, skippedManualOverrides: 0 };

            const otherSubjectsCount = sectionSubjects.length - teachingLoadSubjects.length;
            const otherSubjectsMsg = otherSubjectsCount > 0 ? ` (${otherSubjectsCount} subject(s) assigned to other teachers were preserved)` : '';

            const overridesMsg = syncResult.skippedManualOverrides > 0 ? ` ${syncResult.skippedManualOverrides} manual override(s) were preserved.` : '';
            if (syncResult.updated > 0 && uniqueDeleteIds.length > 0) {
                showNotification(`Synced ${syncResult.updated} grades for your teaching load subjects and cleared ${uniqueDeleteIds.length} empty record(s).${overridesMsg}${otherSubjectsMsg}`, 'success');
            } else if (syncResult.updated > 0) {
                showNotification(`Successfully synced ${syncResult.updated} grades for your teaching load subjects!${overridesMsg}${otherSubjectsMsg}`, 'success');
            } else if (syncResult.skippedManualOverrides > 0) {
                showNotification(`No grades were overwritten.${overridesMsg}${otherSubjectsMsg}`, 'info');
            } else if (uniqueDeleteIds.length > 0) {
                showNotification(`Synchronized with E-Class Records: cleared ${uniqueDeleteIds.length} empty grade(s).${otherSubjectsMsg}`, 'info');
            } else {
                showNotification(`E-Class Records and Grade Management are already synchronized.${otherSubjectsMsg}`, 'info');
            }
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

        const usedSheetNames = new Set<string>();

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
            
            // Sanitize sheet name: Remove illegal Excel characters (: \ / ? * [ ]) and deduplicate
            const sanitizedName = subject.subject_name.replace(/[:\\/?*[\]]/g, '').trim() || 'Subject';
            let sheetName = sanitizedName.substring(0, 31);
            let count = 1;
            while (usedSheetNames.has(sheetName.toUpperCase())) {
                sheetName = `${sanitizedName.substring(0, 27)}_${count++}`;
            }
            usedSheetNames.add(sheetName.toUpperCase());

            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        const fileName = `Grading_Template_${sectionObj.section_name}_${termLabel}_${activeSchoolYear}.xlsx`.replace(/\s+/g, '_');
        XLSX.writeFile(wb, fileName);
        showNotification('Professional grading template downloaded!', 'success');
    };

    const handleImportGrades = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !sectionObj || selectedTerm === 'all') return;
        try { assertSafeWorkbookFile(file); } catch (error) { showNotification((error as Error).message, 'error'); return; }

        const quarter = parseInt(selectedTerm.replace('q', '')) as 1 | 2 | 3;
        if (isQuarterLocked(quarter)) {
            showNotification(`Cannot import: Term ${quarter} is locked against edits. Unlock it in the Lock menu first.`, 'error');
            return;
        }
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const workbook = readSafeWorkbook(event.target?.result as ArrayBuffer);
                let importCount = 0;
                let skipCount = 0;

                for (const sheetName of workbook.SheetNames) {
                    const ws = workbook.Sheets[sheetName];
                    // Convert to AOA (Array of Arrays) to read metadata from specific cells
                    const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    
                    if (aoa.length < 6) continue;

                    // Extract Subject ID from Row 1, Col 2 (Cell B1) and Subject Name from Row 2, Col 2 (Cell B2)
                    const rawSubjectId = String(aoa[0][1] || '').trim();
                    const rawSubjectName = String(aoa[1][1] || sheetName || '').trim();

                    // Find matching subject from sectionSubjects or database subjects
                    const subject = 
                        sectionSubjects.find(s => s.id === rawSubjectId) ||
                        subjects.find(s => s.id === rawSubjectId) ||
                        sectionSubjects.find(s => isMatchingSubject(rawSubjectId, s.id, s.subject_name)) ||
                        sectionSubjects.find(s => isMatchingSubject(rawSubjectName, s.id, s.subject_name)) ||
                        subjects.find(s => isMatchingSubject(rawSubjectName, s.id, s.subject_name));

                    if (!subject) {
                        console.warn(`Subject ID ${rawSubjectId} / Name ${rawSubjectName} in sheet ${sheetName} not found in system.`);
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
                                subject_name: subject.subject_name,
                                section_id: sectionObj.id,
                                quarter: quarter,
                                school_year: activeSchoolYear,
                                final_grade: grade,
                    grade_source: 'subject_teacher',
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
        const advisoryOnly = sections.filter(s => s.is_advisory);
        const base = advisoryOnly.length > 0 ? advisoryOnly : filterSF9Sections(user, sections);
        return [...base].sort((a, b) => {
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
            } else {
                groups['ELEMENTARY'].push(s);
            }
        });
        
        return groups;
    }, [availableSections]);

    const [isAutoRepairing, setIsAutoRepairing] = useState(false);

    // Silent auto-repair for advisory classes with empty taught_subjects (e.g. Regular MATATAG)
    useEffect(() => {
        if (
            sectionObj &&
            sectionObj.is_advisory &&
            (!sectionObj.program || sectionObj.program === 'Regular') &&
            (!sectionObj.taught_subjects || sectionObj.taught_subjects.length === 0)
        ) {
            const { addSubject, updateSubject, updateSection } = useAppStore.getState();
            autoRepairSectionCurriculum(sectionObj, subjects, { addSubject, updateSubject, updateSection })
                .catch(err => console.warn('Silent auto-repair of advisory curriculum:', err));
        }
    }, [sectionObj, subjects]);

    const handleAutoRepairSection = async () => {
        if (!sectionObj) return;
        setIsAutoRepairing(true);
        try {
            const { addSubject, updateSubject, updateSection, showNotification } = useAppStore.getState();
            const result = await autoRepairSectionCurriculum(
                sectionObj,
                subjects,
                { addSubject, updateSubject, updateSection }
            );
            if (result.success) {
                showNotification(result.message, 'success');
            } else {
                showNotification(result.message, 'error');
            }
        } catch (err) {
            console.error('Failed to auto-repair section curriculum:', err);
            useAppStore.getState().showNotification('Failed to auto-repair section.', 'error');
        } finally {
            setIsAutoRepairing(false);
        }
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

        // 0. Hidden subjects filter helper (from section_metadata.hiddenConsolidatedSubjects)
        const hiddenList = sectionObj.section_metadata?.hiddenConsolidatedSubjects || [];
        const isSubjectHidden = (subName: string, subId?: string): boolean => {
            if (!hiddenList || hiddenList.length === 0 || !subName) return false;
            const normSub = normalizeSubjectName(subName);
            const canonSub = getCanonicalSubjectKey(subName, sectionObj.section_grade_level);

            const isMapehParentHidden = hiddenList.some(h => normalizeSubjectName(h) === 'mapeh');
            if (isMapehParentHidden && !isSHS) {
                if (normSub === 'mapeh' || normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health') || normSub.includes('physical')) {
                    return true;
                }
            }

            const isEcmkParentHidden = hiddenList.some(h => isEcmkParent(h));
            if (isEcmkParentHidden) {
                if (isEcmkParent(subName) || normSub === 'effectivecommunication' || normSub === 'mabisangkomunikasyon') {
                    return true;
                }
            }

            for (const h of hiddenList) {
                if (!h) continue;
                if (h.toLowerCase().trim() === subName.toLowerCase().trim()) return true;
                const normH = normalizeSubjectName(h);
                if (normH && normH === normSub) return true;
                const canonH = getCanonicalSubjectKey(h, sectionObj.section_grade_level);
                if (canonH && (canonH === canonSub || canonH === normSub || normH === canonSub)) return true;
                if (isSameSubject(subId, subName, undefined, h)) return true;
                if (isMatchingSubject(h, subId, subName)) return true;
            }
            return false;
        };

        // 1. Get the official list of subjects for this grade level from the curriculum
        const standardTemplates = getSubjectsForGrade(sectionObj.section_grade_level, schoolProfile.curriculum);
        const programTemplates = getCurriculumTemplatesForSection(
            sectionObj.section_grade_level,
            sectionObj.program,
            sectionObj.spa_majors
        );
        const intendedSubjects = [
            ...standardTemplates,
            ...programTemplates.filter(pt => !standardTemplates.some(st => normalizeSubjectName(st.name) === normalizeSubjectName(pt.name)))
        ];
        
        // 2. Get all actual subject records for this section or grade level from the database
        const sectionGradeNum = parseInt(sectionObj.section_grade_level.replace(/\D/g, '')) || 0;
        const isSHS = sectionGradeNum === 11 || sectionGradeNum === 12;
        
        const getEffectiveTerm = (s: Subject | { subject_name: string; grade_level?: string; term?: string | number | null; id?: string }): 1 | 2 | 3 | 'all' | 'none' => {
            const sectionTermOverride = (sectionObj?.section_metadata as Record<string, unknown> | undefined)?.subjectTerms as Record<string, 1 | 2 | 3 | 'all' | 'none'> | undefined;
            if (sectionTermOverride) {
                if (sectionTermOverride[s.subject_name] !== undefined) {
                    return sectionTermOverride[s.subject_name];
                }
                const normName = normalizeSubjectName(s.subject_name);
                for (const [key, val] of Object.entries(sectionTermOverride)) {
                    if (normalizeSubjectName(key) === normName || isMatchingSubject(key, (s as Subject).id, s.subject_name)) {
                        return val;
                    }
                }
            }
            if (sectionGradeNum === 11 && isGrade11CoreSubject(s.subject_name)) {
                return 'all';
            }
            if (s.term !== undefined && s.term !== null) {
                const t = s.term;
                if (t === 'all' || t === 'none' || t === 1 || t === 2 || t === 3) return t;
                if (t === '1') return 1;
                if (t === '2') return 2;
                if (t === '3') return 3;
            }
            return getDefaultTermForSubject(s.subject_name, (s as Subject).grade_level || sectionObj.section_grade_level);
        };

        const sectionTrack = (sectionObj.track || '').toLowerCase();
        let taughtRaw = (sectionObj.taught_subjects || []).filter(t => !isSubjectHidden(t));
        if (taughtRaw.length === 0 && sectionObj.is_advisory && (!sectionObj.program || sectionObj.program === 'Regular')) {
            const preset = getCurriculumPreset(sectionObj.section_grade_level, sectionObj.track, sectionObj.strand || sectionObj.cluster, 'Regular');
            if (preset && preset.subjects.length > 0) {
                taughtRaw = isSHS && sectionGradeNum === 11
                    ? preset.subjects.filter(s => isGrade11CoreSubject(s.name)).map(s => s.name)
                    : preset.subjects.map(s => s.name);
            }
        }

        let candidates = subjects.filter(s => {
            // Never include standalone 'Specialization' subject (not part of official curriculum)
            if (normalizeSubjectName(s.subject_name) === 'specialization') return false;
            // Never include hidden subjects
            if (isSubjectHidden(s.subject_name, s.id)) return false;

            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            const isMatchingGrade = subjectGradeNum === sectionGradeNum;
            const isMatchingSection = s.section_id === sectionObj.id;
            if (!isMatchingGrade && !isMatchingSection) return false;

            const effTerm = getEffectiveTerm(s);
            if (effTerm === 'none') {
                const isExplicitlyTaught = taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name));
                const isDirectOrSpecial = s.section_id === sectionObj.id || s.is_special_program || Boolean(s.program_type);
                return isExplicitlyTaught || isDirectOrSpecial;
            }
            return true;
        });

        // Helper: Check if a subject is section-specific, an imported special program offering, or has grades in this section
        const isSpecialOrImported = (s: Subject) => {
            if (isSubjectHidden(s.subject_name, s.id)) return false;

            const hasGrades = gradingSheetRecords.some(r => isSameSubject(r.subject_id, r.subject_name, s.id, s.subject_name) && r.section_id === sectionObj.id && Number(r.final_grade) > 0) ||
                              classRecords.some(r => isSameSubject(r.subject_id, r.subject_name, s.id, s.subject_name) && (r as any).section_id === sectionObj.id && Number((r as any).final_grade) > 0);
            if (hasGrades) return true;

            // In SHS (Grades 11 & 12): Electives must NEVER be auto-injected or kept unless explicitly in taughtRaw or having grades
            if (isSHS) {
                if (taughtRaw.length > 0) {
                    return taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name));
                }
                if (sectionGradeNum === 11) {
                    return isGrade11CoreSubject(s.subject_name);
                }
                return false;
            }

            if (s.section_id === sectionObj.id) return true;
            
            // Check if section belongs to a specialized program matching this subject
            const isSectionInSpecialProgram = Boolean(
                sectionObj.program && 
                sectionObj.program !== 'Regular' && 
                (s.program_type === sectionObj.program || (s.is_special_program && s.subject_name.toLowerCase().includes(sectionObj.program.toLowerCase())))
            );
            if (isSectionInSpecialProgram) return true;

            const specialTemplates = SPECIAL_SUBJECTS[sectionObj.section_grade_level] || [];
            const isSpecialTemplate = specialTemplates.some(t => isMatchingSubject(t.name, s.id, s.subject_name) || normalizeSubjectName(t.name) === normalizeSubjectName(s.subject_name));

            // Only fallback to special templates if the section does NOT have an explicit taught roster
            if (taughtRaw.length <= 1) {
                if (isSpecialTemplate) return true;
                if (intendedSubjects.some(intended => isMatchingSubject(intended.name, s.id, s.subject_name) || normalizeSubjectName(intended.name) === normalizeSubjectName(s.subject_name))) {
                    return true;
                }
            }

            return false;
        };

        // For SHS (Grades 11 & 12): filter electives based on taughtSet or sectionTrack
        if (isSHS) {
            if (taughtRaw.length > 0) {
                // Ensure all explicitly taught subjects are present
                for (const tName of taughtRaw) {
                    if (isSubjectHidden(tName)) continue;
                    const alreadyHas = candidates.some(s => isMatchingSubject(tName, s.id, s.subject_name));
                    if (!alreadyHas) {
                        candidates.push({
                            id: `virtual_${tName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                            subject_name: tName,
                            subject_code: '',
                            grade_level: sectionObj.section_grade_level,
                            section_id: sectionObj.id,
                            term: getEffectiveTerm({ subject_name: tName, grade_level: sectionObj.section_grade_level })
                        });
                    }
                }

                // Filter to match explicitly taught subjects OR section-specific / special program subjects
                candidates = candidates.filter(s => {
                    return taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name)) || isSpecialOrImported(s);
                });

                // Use the exact subject name from taught_subjects, normalizing Old K-12 PE
                const isExplicitSSHS = (sectionObj.track || '').toLowerCase().includes('sshs') || (sectionObj.track || '').toLowerCase().includes('cluster');
                candidates = candidates.map(s => {
                    const matchedTaught = taughtRaw.find(t => isMatchingSubject(t, s.id, s.subject_name));
                    let name = matchedTaught || s.subject_name;
                    if (sectionGradeNum === 12 && !isExplicitSSHS) {
                        name = normalizeGrade12PESubjectName(name, false);
                    }
                    if (name !== s.subject_name) {
                        return { ...s, subject_name: name };
                    }
                    return s;
                });
            } else if (sectionTrack) {
                candidates = candidates.filter(s => {
                    const hasGrades = gradingSheetRecords.some(r => isSameSubject(r.subject_id, r.subject_name, s.id, s.subject_name) && r.section_id === sectionObj.id && Number(r.final_grade) > 0) ||
                                      classRecords.some(r => isSameSubject(r.subject_id, r.subject_name, s.id, s.subject_name) && (r as any).section_id === sectionObj.id && Number((r as any).final_grade) > 0);
                    if (hasGrades) return true;
                    if (sectionGradeNum === 11) {
                        // For Grade 11 SSHS: Only Core subjects auto-populate if taught_subjects is empty!
                        return isGrade11CoreSubject(s.subject_name);
                    }
                    if (isSpecialOrImported(s)) return true;
                    const unitInfo = getShsSubjectUnitInfo(s.subject_name, sectionObj.section_grade_level);
                    if (sectionTrack.includes('acad')) {
                        return unitInfo.category === 'academic_elective' || unitInfo.category === 'arts_elective';
                    }
                    if (sectionTrack.includes('tech') || sectionTrack.includes('tvl')) {
                        return unitInfo.category === 'techpro_elective' || unitInfo.category === 'work_immersion';
                    }
                    return true;
                });
            }
            if (sectionGradeNum === 12 && !((sectionObj.track || '').toLowerCase().includes('sshs') || (sectionObj.track || '').toLowerCase().includes('cluster'))) {
                candidates = candidates.map(s => {
                    const normName = normalizeGrade12PESubjectName(s.subject_name, false);
                    return normName !== s.subject_name ? { ...s, subject_name: normName } : s;
                });
            }
        }
        // For JHS (Grades 7–10) & Elementary (Grades 1–6):
        if (!isSHS) {
            if (taughtRaw.length > 0) {
                for (const tName of taughtRaw) {
                    if (isSubjectHidden(tName)) continue;
                    const alreadyHas = candidates.some(s => isMatchingSubject(tName, s.id, s.subject_name));
                    if (!alreadyHas) {
                        candidates.push({
                            id: `virtual_${tName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${sectionObj.id}`,
                            subject_name: tName,
                            subject_code: '',
                            grade_level: sectionObj.section_grade_level,
                            section_id: sectionObj.id,
                            term: getEffectiveTerm({ subject_name: tName, grade_level: sectionObj.section_grade_level })
                        });
                    }
                }
            }
            const isSubjectAllowedInTaught = (subId: string, subName: string) => {
                if (isSubjectHidden(subName, subId)) return false;
                return taughtRaw.some(t => {
                    if (isMatchingSubject(t, subId, subName)) return true;
                    const normT = normalizeSubjectName(t);
                    const normSub = normalizeSubjectName(subName);
                    if (normT === 'mapeh') {
                        return normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health') || normSub.includes('physical');
                    }
                    return false;
                });
            };

            if (taughtRaw.length > 1) {
                // If an explicit subject roster was selected in the Subjects tab, strictly respect it,
                // while always preserving section-specific subjects and imported special program offerings
                candidates = candidates.filter(s => isSubjectAllowedInTaught(s.id, s.subject_name) || isSpecialOrImported(s));
            } else {
                // If taught_subjects is not explicitly set (or single legacy pollution), allow standard intended curriculum subjects or special/imported subjects
                candidates = candidates.filter(s => {
                    if (isSubjectHidden(s.subject_name, s.id)) return false;
                    const isIntended = intendedSubjects.some(intended => isMatchingSubject(intended.name, s.id, s.subject_name) || normalizeSubjectName(intended.name) === normalizeSubjectName(s.subject_name));
                    const isExplicitlyTaught = isSubjectAllowedInTaught(s.id, s.subject_name);
                    return isIntended || isExplicitlyTaught || isSpecialOrImported(s);
                });
            }
        }

        let sectionDbSubjects = candidates.filter(s => !isSubjectHidden(s.subject_name, s.id));

        // Filter based on the selected term (quarter) if it's a specific term (1, 2, 3)
        // Strict Term Isolation: In SHS, subjects only render in their active offering term (zero ghost blanks)
        if (selectedTerm !== 'all') {
            const termNum = selectedTerm === 'q1' ? 1 : selectedTerm === 'q2' ? 2 : selectedTerm === 'q3' ? 3 : null;
            if (termNum !== null) {
                sectionDbSubjects = sectionDbSubjects.filter(s => {
                    const effTerm = getEffectiveTerm(s);
                    // Elementary & JHS subjects run all year
                    if (!isSHS) return true;
                    if (!effTerm || effTerm === 'all') return true;
                    if (sectionGradeNum === 11 && isGrade11CoreSubject(s.subject_name)) {
                        return true;
                    }
                    if (typeof effTerm === 'string' && effTerm.includes(',')) {
                        return effTerm.split(',').map(Number).includes(termNum);
                    }
                    return Number(effTerm) === termNum;
                });
            }
        }

        const isElemSection = (sectionGradeNum >= 1 && sectionGradeNum <= 6) || (sectionObj.section_grade_level || '').toLowerCase().includes('elem');
        const isJhsSection = (sectionGradeNum >= 7 && sectionGradeNum <= 10) || (sectionObj.section_grade_level || '').toLowerCase().includes('jhs');

        sectionDbSubjects = sectionDbSubjects.map(s => {
            if (isElemSection && normalizeSubjectName(s.subject_name) === 'gmrc') {
                return { ...s, subject_name: 'GMRC (Good Manners and Right Conduct)' };
            }
            if (isJhsSection && normalizeSubjectName(s.subject_name) === 'gmrc') {
                return { ...s, subject_name: 'Values Education' };
            }
            return s;
        });

        // Prioritize section-specific subjects over generic ones, then deduplicate by normalized name
        sectionDbSubjects.sort((a, b) => {
            const aDirect = a.section_id === sectionObj.id ? 1 : 0;
            const bDirect = b.section_id === sectionObj.id ? 1 : 0;
            return bDirect - aDirect;
        });

        const seenSubjectNames = new Set<string>();
        const uniqueDbSubjects: Subject[] = [];
        for (const s of sectionDbSubjects) {
            const canon = getCanonicalSubjectKey(s.subject_name, sectionGradeNum) || normalizeSubjectName(s.subject_name);
            if (canon && seenSubjectNames.has(canon)) continue;
            if (canon) seenSubjectNames.add(canon);
            uniqueDbSubjects.push(s);
        }
        sectionDbSubjects = uniqueDbSubjects;

        // 3. Determine the base list of subjects:
        // Use existing DB subjects and seamlessly merge with any missing intended curriculum subjects
        const matchedNorms = new Set<string>();
        const baseList: VirtualSectionSubject[] = [];

        // Add DB subjects first
        for (const s of sectionDbSubjects) {
            const norm = normalizeSubjectName(s.subject_name);
            if (norm === 'specialization') continue; // Never include standalone Specialization
            if (isSubjectHidden(s.subject_name, s.id)) continue;
            if (norm) matchedNorms.add(norm);
            baseList.push({ ...s, is_virtual: false } as VirtualSectionSubject);
        }

        // Merge any missing intended curriculum subjects (for this grade level & selected term)
        const relevantIntended = intendedSubjects.filter(intended => {
            // Never auto-inject standalone 'Specialization' for any grade level
            if (normalizeSubjectName(intended.name) === 'specialization') {
                return false;
            }
            // Never inject hidden subjects
            if (isSubjectHidden(intended.name)) {
                return false;
            }
            // Strict Section Isolation: Never auto-inject unselected electives!
            if (isSHS) {
                // In SHS (Grades 11 & 12): Electives/Specialized subjects must NEVER be auto-injected.
                // An advisory section only takes electives that were explicitly chosen in taught_subjects.
                // Only official Core subjects (which all Grade 11 learners must take) are allowed to be auto-injected if missing.
                const isG11Core = sectionGradeNum === 11 ? isGrade11CoreSubject(intended.name) : false;
                const isTaught = taughtRaw.length > 0 && taughtRaw.some(t => isMatchingSubject(t, '', intended.name));
                if (!isG11Core && !isTaught) {
                    return false;
                }
            } else if (taughtRaw.length > 1) {
                const isAllowed = taughtRaw.some(t => {
                    if (isMatchingSubject(t, '', intended.name)) return true;
                    const normT = normalizeSubjectName(t);
                    const normInt = normalizeSubjectName(intended.name);
                    if (normT === 'mapeh') {
                        return normInt.includes('music') || normInt.includes('arts') || normInt.includes('pe') || normInt.includes('health') || normInt.includes('physical');
                    }
                    return false;
                });
                const isSpecialSection = Boolean(sectionObj.program && sectionObj.program !== 'Regular');
                const isSpecialIntended = isSpecialSection && Boolean(
                    (intended as any).is_special_program ||
                    (intended as any).program === sectionObj.program
                );
                if (!isAllowed && !isSpecialIntended) return false;
            }
            const defaultTerm = getDefaultTermForSubject(intended.name, sectionObj.section_grade_level);
            if (defaultTerm === 'none') return false;
            
            if (selectedTerm !== 'all') {
                const termNum = selectedTerm === 'q1' ? 1 : selectedTerm === 'q2' ? 2 : selectedTerm === 'q3' ? 3 : null;
                if (termNum !== null) {
                    if (!isSHS) return true;
                    if (sectionGradeNum === 11 && (defaultTerm === 'all' || isGrade11CoreSubject(intended.name))) return true;
                    return Number(defaultTerm) === termNum;
                }
            }
            return true;
        });

        for (const intended of relevantIntended) {
            const norm = normalizeSubjectName(intended.name);
            if (isSubjectHidden(intended.name)) continue;
            let alreadyCovered = matchedNorms.has(norm);
            if (!alreadyCovered) {
                const seqNorm = extractSubjectSequence(norm);
                for (const m of matchedNorms) {
                    const seqM = extractSubjectSequence(m);
                    if (seqNorm && seqM && seqNorm !== seqM) continue;
                    if (m === norm || m.includes(norm) || norm.includes(m)) {
                        alreadyCovered = true;
                        break;
                    }
                }
            }
            if (!alreadyCovered) {
                matchedNorms.add(norm);
                baseList.push({
                    id: `virtual-${norm}-${sectionObj.id}`,
                    subject_name: intended.name,
                    section_id: sectionObj.id,
                    grade_level: sectionObj.section_grade_level,
                    is_virtual: true
                } as VirtualSectionSubject);
            }
        }

        // Special Case: If we have MAPEH components but no MAPEH header row, create a virtual one
        const hasMapehHeader = !isSHS && !isSubjectHidden('MAPEH') && baseList.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');
        const hasMapehComponents = !isSHS && !isSubjectHidden('MAPEH') && baseList.some(s => {
            if (isSubjectHidden(s.subject_name, s.id)) return false;
            const n = normalizeSubjectName(s.subject_name);
            return n.includes('musicandarts') || n.includes('musicarts') || 
                   n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth') ||
                   n === 'music' || n === 'arts' || n === 'pe' || n === 'health';
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
        const hasEcmkHeader = baseList.some(s => isEcmkParent(s.subject_name));
        const hasEc = baseList.some(s => normalizeSubjectName(s.subject_name) === 'effectivecommunication' && !isSubjectHidden(s.subject_name, s.id));
        const hasMk = baseList.some(s => normalizeSubjectName(s.subject_name) === 'mabisangkomunikasyon' && !isSubjectHidden(s.subject_name, s.id));

        if (hasEc && hasMk && !hasEcmkHeader && !isSubjectHidden('Effective Communication & Mabisang Komunikasyon')) {
            baseList.push({
                id: `virtual-ecmk-${sectionObj.id}`,
                subject_name: 'Effective Communication & Mabisang Komunikasyon',
                section_id: sectionObj.id,
                grade_level: sectionObj.section_grade_level,
                is_virtual: true
            } as VirtualSectionSubject);
        }

        // 4. Post-process: Identify MAPEH and EC&MK groups for all items in the list
        const isMusicArtsSubject = (name: string) => {
            const n = normalizeSubjectName(name);
            return n.includes('musicandarts') || n.includes('musicarts') || (n.includes('music') && n.includes('arts')) || n === 'music' || n === 'arts';
        };

        const isPeHealthSubject = (name: string) => {
            const n = normalizeSubjectName(name);
            return n.includes('physicaleducationandhealth') || 
                   n.includes('physicaleducationhealth') || 
                   n.includes('peandhealth') || 
                   n.includes('pehealth') || 
                   (n.includes('physicaleducation') && n.includes('health')) || 
                   (n.includes('pe') && n.includes('health')) ||
                   n === 'physicaleducation' || n === 'pe' || n === 'health';
        };

        const isEffCommComp = (name: string) => {
            const n = normalizeSubjectName(name);
            return (n.includes('effectivecommunication') || n.startsWith('effectivecomm')) && !n.includes('mabisang');
        };

        const isMabKomComp = (name: string) => {
            const n = normalizeSubjectName(name);
            return (n.includes('mabisangkomunikasyon') || n.startsWith('mabisangkom')) && !n.includes('effective');
        };

        const withGroupData = baseList.map(base => {
            const norm = normalizeSubjectName(base.subject_name);
            if (norm === 'mapeh' && !isSHS) {
                let musicArts = sectionDbSubjects.filter(s => isMusicArtsSubject(s.subject_name));
                let peHealth = sectionDbSubjects.filter(s => isPeHealthSubject(s.subject_name));
                if (musicArts.length === 0) {
                    musicArts = subjects.filter(s => isMusicArtsSubject(s.subject_name) && (s.grade_level === sectionObj.section_grade_level || !s.grade_level));
                }
                if (peHealth.length === 0) {
                    peHealth = subjects.filter(s => isPeHealthSubject(s.subject_name) && (s.grade_level === sectionObj.section_grade_level || !s.grade_level));
                }
                if (musicArts.length === 0) {
                    musicArts = [{
                        id: `virtual_music_arts_${sectionObj.id}`,
                        subject_name: 'Music and Arts',
                        section_id: sectionObj.id,
                        grade_level: sectionObj.section_grade_level,
                        is_virtual: true
                    } as Subject];
                }
                if (peHealth.length === 0) {
                    peHealth = [{
                        id: `virtual_pe_health_${sectionObj.id}`,
                        subject_name: 'Physical Education and Health',
                        section_id: sectionObj.id,
                        grade_level: sectionObj.section_grade_level,
                        is_virtual: true
                    } as Subject];
                }
                return {
                    ...base,
                    _mapehGroups: {
                        musicArts,
                        peHealth
                    }
                };
            }
            if (isEcmkParent(base.subject_name)) {
                let effectiveComm = sectionDbSubjects.filter(s => isEffCommComp(s.subject_name));
                let mabisangKom = sectionDbSubjects.filter(s => isMabKomComp(s.subject_name));

                if (effectiveComm.length === 0) {
                    effectiveComm = subjects.filter(s => 
                        isEffCommComp(s.subject_name) && 
                        (s.grade_level === sectionObj.section_grade_level || !s.grade_level)
                    );
                }
                if (mabisangKom.length === 0) {
                    mabisangKom = subjects.filter(s => 
                        isMabKomComp(s.subject_name) && 
                        (s.grade_level === sectionObj.section_grade_level || !s.grade_level)
                    );
                }

                if (effectiveComm.length === 0) {
                    effectiveComm = [{
                        id: `virtual_effective_comm_${sectionObj.id}`,
                        subject_name: 'Effective Communication',
                        section_id: sectionObj.id,
                        grade_level: sectionObj.section_grade_level,
                        is_virtual: true
                    } as Subject];
                }
                if (mabisangKom.length === 0) {
                    mabisangKom = [{
                        id: `virtual_mabisang_kom_${sectionObj.id}`,
                        subject_name: 'Mabisang Komunikasyon',
                        section_id: sectionObj.id,
                        grade_level: sectionObj.section_grade_level,
                        is_virtual: true
                    } as Subject];
                }

                return {
                    ...base,
                    _ecmkGroups: {
                        effectiveComm,
                        mabisangKom
                    }
                };
            }
            return base;
        });

        // 5. Subject Ordering:
        // In DepEd Senior High School (DO 017 s. 2026 for G11 SSHS, DO 8 s. 2015 for G12):
        // Core subjects MUST ALWAYS appear first on the left, followed by Electives/Applied/Specialized.
        const taughtOrder = sectionObj?.taught_subjects || [];
        const gradeLevelStr = sectionObj?.section_grade_level || '';
        const isG11 = sectionGradeNum === 11;

        const getShsCategoryRank = (name: string): number => {
            const cat = getSubjectCategory(name, gradeLevelStr);
            if (isG11) {
                if (cat.startsWith('Core')) return 1;
                if (cat.startsWith('Academic Elective')) return 2;
                if (cat.startsWith('TechPro Elective')) return 3;
                return 4;
            } else {
                if (cat === 'Core' || cat.startsWith('Core')) return 1;
                if (cat === 'Applied' || cat.startsWith('Academic')) return 2;
                if (cat === 'Specialized' || cat.startsWith('TechPro')) return 3;
                return 4;
            }
        };

        const getG11CoreOrderIndex = (name: string): number => {
            const norm = normalizeSubjectName(name);
            if (norm.includes('effectivecommunication') || norm.includes('mabisangkomunikasyon')) return 1;
            if (norm.includes('generalmathematics')) return 2;
            if (norm.includes('generalscience')) return 3;
            if (norm.includes('lifeandcareerskills')) return 4;
            if (norm.includes('pagaaralngkasaysayan') || norm.includes('kasaysayanatlipunangpilipino')) return 5;
            return 99;
        };

        const getTaughtIndex = (subName: string) => {
            const norm = normalizeSubjectName(subName);
            return taughtOrder.findIndex(t => {
                const normT = normalizeSubjectName(t);
                if (normT === norm) return true;
                if (norm === 'mapeh' && (normT.includes('music') || normT.includes('pe') || normT.includes('arts') || normT.includes('health'))) return true;
                return isMatchingSubject(t, '', subName);
            });
        };

        let orderedSubjects: typeof withGroupData;
        if (isSHS) {
            orderedSubjects = [...withGroupData].sort((a, b) => {
                // 1. DepEd SHS Category grouping: Core subjects must always precede electives
                const rankA = getShsCategoryRank(a.subject_name);
                const rankB = getShsCategoryRank(b.subject_name);
                if (rankA !== rankB) {
                    return rankA - rankB;
                }

                // 2. Canonical DO 017 s. 2026 Core ordering for Grade 11
                if (isG11 && rankA === 1) {
                    const coreIdxA = getG11CoreOrderIndex(a.subject_name);
                    const coreIdxB = getG11CoreOrderIndex(b.subject_name);
                    if (coreIdxA !== coreIdxB) {
                        return coreIdxA - coreIdxB;
                    }
                }

                // 3. Within the same category, respect explicit taughtOrder if configured
                if (taughtOrder.length > 1) {
                    const idxA = getTaughtIndex(a.subject_name);
                    const idxB = getTaughtIndex(b.subject_name);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                }

                // 4. Fallback: priority then alphabetical
                const priorityA = getStandardSubjectPriority(a.subject_name);
                const priorityB = getStandardSubjectPriority(b.subject_name);
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                return a.subject_name.localeCompare(b.subject_name);
            });
        } else if (taughtOrder.length > 1) {
            orderedSubjects = [...withGroupData].sort((a, b) => {
                const idxA = getTaughtIndex(a.subject_name);
                const idxB = getTaughtIndex(b.subject_name);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
            });
        } else {
            orderedSubjects = sortSubjects(withGroupData, s => s.subject_name);
        }

        // 6. Filter out hidden subjects and individual MAPEH/ECMK subcomponents
        return orderedSubjects.filter(sub => {
            const norm = normalizeSubjectName(sub.subject_name);
            if (norm === 'specialization') return false; // Never show standalone Specialization
            if (isSubjectHidden(sub.subject_name, sub.id)) return false;

            const isMapehComponent = !isSHS && (isMusicArtsSubject(sub.subject_name) || isPeHealthSubject(sub.subject_name));
            
            // Filter out EC/MK individual components only if a parent group exists
            const hasEcmkParentInList = orderedSubjects.some(s => isEcmkParent(s.subject_name));
            const isEcOrMkComponent = hasEcmkParentInList && (norm === 'effectivecommunication' || norm === 'mabisangkomunikasyon');

            return (!isMapehComponent || norm === 'mapeh') && !isEcOrMkComponent;
        });
    }, [subjects, sectionObj, schoolProfile.curriculum, selectedTerm, classRecords, gradingSheetRecords]);




    const selectableSubjects = useMemo(() => {
        return sectionSubjects.filter((subject) => subject.subject_name.toUpperCase() !== 'MAPEH' && !isEcmkParent(subject.subject_name));
    }, [sectionSubjects]);

    const [overrideSubjectSelections, setOverrideSubjectSelections] = useState<Record<string, Record<string, string>>>({});

    const subjectColumnSelections = useMemo(() => {
        if (!sectionObj) return {};
        return overrideSubjectSelections[sectionObj.id] || sectionObj.section_metadata?.sf9SubjectSelections || {};
    }, [sectionObj, overrideSubjectSelections]);

    const handleUpdateSubjectSelection = async (baseId: string, selectedId: string) => {
        if (!sectionObj) return;
        
        const newSelections = { ...subjectColumnSelections, [baseId]: selectedId };
        setOverrideSubjectSelections(prev => ({
            ...prev,
            [sectionObj.id]: newSelections
        }));
        
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
        if (!selectedSection && !sectionObj) return [];
        return students.filter(s => isStudentInSection(s, sectionObj, selectedSection));
    }, [students, selectedSection, sectionObj]);

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

    const termColSpan = useCallback((sub: VirtualSectionSubject) => {
        if (selectedTerm === 'all') return 4;
        if ((sub as any)._mapehGroups || isEcmkParent(sub.subject_name)) return 3;
        return 1;
    }, [selectedTerm]);

    // Contiguous category grouping for clean DepEd-compliant header display (merges same-category columns into a single header block)
    const categoryGroups = useMemo(() => {
        const groups: { category: string; colSpan: number; key: string }[] = [];
        subjectColumns.forEach((col, idx) => {
            const cat = getSubjectCategory(col.subject.subject_name, sectionObj?.section_grade_level || '');
            const span = termColSpan(col.subject);
            const last = groups[groups.length - 1];
            if (last && last.category === cat) {
                last.colSpan += span;
            } else {
                groups.push({
                    category: cat,
                    colSpan: span,
                    key: `cat-group-${idx}-${cat}`
                });
            }
        });
        return groups;
    }, [subjectColumns, sectionObj?.section_grade_level, termColSpan]);

    const BASE_PAGE_WIDTH = 1248; // Standard 13in Folio Landscape at 96 DPI
    const SHEET_PADDING = 48; // p-6 = 24px left + 24px right

    const [customColumnWidths, setCustomColumnWidths] = useState<Record<string, number>>({});
    const [resizingCol, setResizingCol] = useState<{
        key: string;
        startX: number;
        startWidth: number;
    } | null>(null);

    useEffect(() => {
        if (sectionObj?.section_metadata?.customColumnWidths) {
            setCustomColumnWidths(sectionObj.section_metadata.customColumnWidths);
        } else {
            setCustomColumnWidths({});
        }
    }, [sectionObj?.id, sectionObj?.section_metadata?.customColumnWidths]);

    const learnerNameWidth = useMemo(() => {
        return customColumnWidths['name'] || learnerNameColumnWidth;
    }, [customColumnWidths, learnerNameColumnWidth]);

    const averageColWidth = useMemo(() => {
        return customColumnWidths['average'] || AVERAGE_COLUMN_WIDTH;
    }, [customColumnWidths]);

    const generalAvgColWidth = useMemo(() => {
        return customColumnWidths['generalAverage'] || GENERAL_AVERAGE_COLUMN_WIDTH;
    }, [customColumnWidths]);

    const descriptorColWidth = useMemo(() => {
        return customColumnWidths['descriptor'] || 100;
    }, [customColumnWidths]);

    const summaryColsWidth = useMemo(() => {
        if (!showGenAvg) return 0;
        return averageColWidth + generalAvgColWidth + (showDescriptor ? descriptorColWidth : 0);
    }, [showGenAvg, averageColWidth, generalAvgColWidth, showDescriptor, descriptorColWidth]);

    const totalSubjectSubCols = useMemo(() => {
        return Math.max(1, subjectColumns.reduce((acc, col) => acc + termColSpan(col.subject), 0));
    }, [subjectColumns, termColSpan]);

    const minSubColWidth = useMemo(() => {
        if (selectedTerm === 'all') return 34;
        return 65;
    }, [selectedTerm]);

    const baseAvailableForSubjects = Math.max(0, BASE_PAGE_WIDTH - SHEET_PADDING - learnerNameWidth - summaryColsWidth);
    const subjectColumnWidth = useMemo(() => {
        const dynamicSlotWidth = Math.floor(baseAvailableForSubjects / totalSubjectSubCols);
        return Math.max(minSubColWidth, dynamicSlotWidth);
    }, [baseAvailableForSubjects, totalSubjectSubCols, minSubColWidth]);

    const getSubjectSubColWidth = useCallback((subjectId: string) => {
        return customColumnWidths[subjectId] || subjectColumnWidth;
    }, [customColumnWidths, subjectColumnWidth]);

    const getSubjectOfferedTerms = useCallback((sub: any) => {
        return resolveSubjectOfferedTerms(sub, sectionObj);
    }, [sectionObj]);

    const totalSubjectColumnsWidth = useMemo(() => {
        return subjectColumns.reduce((acc, col) => {
            const subWidth = getSubjectSubColWidth(col.subject.id);
            return acc + (subWidth * termColSpan(col.subject));
        }, 0);
    }, [subjectColumns, getSubjectSubColWidth, termColSpan]);

    const usableTableWidth = useMemo(() => {
        return learnerNameWidth + totalSubjectColumnsWidth + summaryColsWidth;
    }, [learnerNameWidth, totalSubjectColumnsWidth, summaryColsWidth]);

    const sheetWidth = useMemo(() => {
        return Math.max(BASE_PAGE_WIDTH, usableTableWidth + SHEET_PADDING);
    }, [usableTableWidth]);

    const hasCustomWidths = useMemo(() => {
        return Object.keys(customColumnWidths).length > 0;
    }, [customColumnWidths]);

    const handleResizeStart = useCallback((e: React.MouseEvent, key: string, currentWidth: number) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingCol({
            key,
            startX: e.clientX,
            startWidth: currentWidth
        });
    }, []);

    const handleAutoFit = useCallback(async (key: string) => {
        let autoWidth: number;
        if (key === 'name') {
            const longestName = sectionStudents.reduce((longest, student) => {
                const currentName = formatLearnerName(student);
                return currentName.length > longest.length ? currentName : longest;
            }, '');
            autoWidth = Math.max(150, Math.min(Math.ceil(longestName.length * 6.2 + 32), 360));
        } else if (key === 'average') {
            autoWidth = AVERAGE_COLUMN_WIDTH;
        } else if (key === 'generalAverage') {
            autoWidth = GENERAL_AVERAGE_COLUMN_WIDTH;
        } else if (key === 'descriptor') {
            autoWidth = 100;
        } else {
            const sub = subjectColumns.find(c => c.subject.id === key)?.subject;
            const subName = sub?.subject_name || '';
            if (selectedTerm === 'all') {
                autoWidth = 34;
            } else {
                autoWidth = Math.max(65, Math.min(Math.ceil(subName.length * 5.8 + 20), 160));
            }
        }

        setCustomColumnWidths(prev => ({
            ...prev,
            [key]: autoWidth
        }));

        if (sectionObj) {
            const updatedSection: Section = {
                ...sectionObj,
                section_metadata: {
                    ...sectionObj.section_metadata,
                    customColumnWidths: {
                        ...(sectionObj.section_metadata?.customColumnWidths || {}),
                        [key]: autoWidth
                    }
                }
            };
            try {
                await useAppStore.getState().updateSection(updatedSection);
            } catch (err) {
                console.error('Failed to auto-fit column width:', err);
            }
        }
    }, [sectionStudents, subjectColumns, selectedTerm, sectionObj]);

    const handleResetColumnWidths = useCallback(async () => {
        setCustomColumnWidths({});
        if (sectionObj) {
            const { customColumnWidths: _, ...remainingMeta } = sectionObj.section_metadata || {};
            const updatedSection: Section = {
                ...sectionObj,
                section_metadata: remainingMeta
            };
            try {
                await useAppStore.getState().updateSection(updatedSection);
                showNotification('Column widths reset to default.', 'success');
            } catch (err) {
                console.error('Failed to reset column widths:', err);
            }
        }
    }, [sectionObj, showNotification]);

    useEffect(() => {
        if (!resizingCol) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - resizingCol.startX;
            let minW = 45;
            let maxW = 450;
            if (resizingCol.key === 'name') {
                minW = 120;
                maxW = 450;
            } else if (resizingCol.key === 'average' || resizingCol.key === 'generalAverage') {
                minW = 50;
                maxW = 150;
            } else if (resizingCol.key === 'descriptor') {
                minW = 60;
                maxW = 200;
            } else if (selectedTerm === 'all') {
                minW = 25;
                maxW = 150;
            }

            const newWidth = Math.max(minW, Math.min(maxW, Math.round(resizingCol.startWidth + delta)));
            setCustomColumnWidths(prev => ({
                ...prev,
                [resizingCol.key]: newWidth
            }));
        };

        const handleMouseUp = async (e: MouseEvent) => {
            const delta = e.clientX - resizingCol.startX;
            const currentW = resizingCol.startWidth;
            const finalKey = resizingCol.key;
            setResizingCol(null);

            let minW = 45;
            let maxW = 450;
            if (finalKey === 'name') {
                minW = 120;
                maxW = 450;
            } else if (finalKey === 'average' || finalKey === 'generalAverage') {
                minW = 50;
                maxW = 150;
            } else if (finalKey === 'descriptor') {
                minW = 60;
                maxW = 200;
            } else if (selectedTerm === 'all') {
                minW = 25;
                maxW = 150;
            }
            const finalWidth = Math.max(minW, Math.min(maxW, Math.round(currentW + delta)));

            if (sectionObj) {
                const updatedWidths = {
                    ...(sectionObj.section_metadata?.customColumnWidths || {}),
                    [finalKey]: finalWidth
                };
                const updatedSection: Section = {
                    ...sectionObj,
                    section_metadata: {
                        ...sectionObj.section_metadata,
                        customColumnWidths: updatedWidths
                    }
                };
                try {
                    await useAppStore.getState().updateSection(updatedSection);
                } catch (err) {
                    console.error('Failed to save column width:', err);
                }
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [resizingCol, sectionObj, selectedTerm]);

    const maleStudents = useMemo(() => sectionStudents.filter(s => isMaleStudent(s) || !isFemaleStudent(s)).sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);
    const femaleStudents = useMemo(() => sectionStudents.filter(s => isFemaleStudent(s)).sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);

    // PERFORMANCE OPTIMIZATION: Index records by student LRN once
    const recordsByLrn = useMemo(() => {
        const map = new Map<string, { classRecs: ClassRecord[]; gradingRecs: ClassRecord[] }>();
        sectionStudents.forEach(s => {
            const entry = { classRecs: [] as ClassRecord[], gradingRecs: [] as ClassRecord[] };
            map.set(s.lrn, entry);
            map.set(String(s.lrn).trim(), entry);
        });
        classRecords.forEach(r => {
            const entry = map.get(r.student_lrn) || map.get(String(r.student_lrn).trim());
            if (entry) entry.classRecs.push(r);
        });
        gradingSheetRecords.forEach(r => {
            const entry = map.get(r.student_lrn) || map.get(String(r.student_lrn).trim());
            if (entry) entry.gradingRecs.push(r);
        });
        return map;
    }, [sectionStudents, classRecords, gradingSheetRecords]);

    const handleMoveSubject = async (subjectName: string, direction: 'left' | 'right') => {
        if (!sectionObj) return;
        const currentOrder = sectionSubjects.map(s => s.subject_name);
        const currentIndex = currentOrder.findIndex(s => s.toLowerCase() === subjectName.toLowerCase());
        if (currentIndex === -1) return;

        const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

        // In SHS: prevent reordering across categories (Core subjects and Electives must remain grouped)
        if (isSHSSection) {
            const currentCat = getSubjectCategory(subjectName, sectionObj.section_grade_level || '');
            const targetCat = getSubjectCategory(currentOrder[targetIndex], sectionObj.section_grade_level || '');
            if (currentCat !== targetCat) {
                showNotification(`Cannot move "${subjectName}" across subject categories (${currentCat} ↔ ${targetCat}). Core and Elective subjects must remain grouped per DepEd standards.`, 'info');
                return;
            }
        }

        const updatedOrder = [...currentOrder];
        const temp = updatedOrder[currentIndex];
        updatedOrder[currentIndex] = updatedOrder[targetIndex];
        updatedOrder[targetIndex] = temp;

        const updatedSection: Section = {
            ...sectionObj,
            taught_subjects: updatedOrder
        };

        try {
            await useAppStore.getState().updateSection(updatedSection);
            showNotification(`Moved ${subjectName} ${direction === 'left' ? 'left' : 'right'}.`, 'success');
        } catch (err) {
            console.error('Failed to move subject:', err);
            showNotification('Failed to reorder subject.', 'error');
        }
    };

    const availableSubjectsToAdd = useMemo(() => {
        const currentNames = new Set(sectionSubjects.map(s => s.subject_name.toLowerCase().trim()));

        // Exclude subcomponents that are already embedded inside composite columns (e.g. MAPEH, ECMK)
        sectionSubjects.forEach(s => {
            const nameUpper = s.subject_name.toUpperCase();
            if ((s as any)._mapehGroups || nameUpper === 'MAPEH') {
                currentNames.add('music and arts');
                currentNames.add('physical education and health');
                currentNames.add('pe and health');
                currentNames.add('music & arts');
                currentNames.add('pe & health');
                currentNames.add('music');
                currentNames.add('arts');
                currentNames.add('physical education');
                currentNames.add('health');
            }
            if (isEcmkParent(s.subject_name) || (s as any)._ecmkGroups) {
                currentNames.add('effective communication');
                currentNames.add('mabisang komunikasyon');
            }
        });

        // Filter and deduplicate by subject name to avoid repeating catalog items
        const seenNames = new Set<string>();
        const uniqueSubjects: typeof subjects = [];

        const candidates = subjects.filter(s => {
            const norm = s.subject_name.trim().toLowerCase();
            if (currentNames.has(norm)) return false;

            if (s.grade_level && sectionObj?.section_grade_level) {
                return s.grade_level.toLowerCase().trim() === sectionObj.section_grade_level.toLowerCase().trim();
            }
            return !s.grade_level;
        }).sort((a, b) => a.subject_name.localeCompare(b.subject_name));

        for (const s of candidates) {
            const norm = s.subject_name.trim().toLowerCase();
            if (!seenNames.has(norm)) {
                seenNames.add(norm);
                uniqueSubjects.push(s);
            }
        }

        return uniqueSubjects;
    }, [subjects, sectionSubjects, sectionObj?.section_grade_level]);

    const handleQuickAddSubject = async (subjectName: string) => {
        if (!sectionObj) return;
        const trimmed = subjectName.trim();
        if (!trimmed) return;
        const currentTaught = [...(sectionObj.taught_subjects || sectionSubjects.map(s => s.subject_name))];
        if (currentTaught.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
            showNotification(`"${trimmed}" is already on the sheet.`, 'info');
            return;
        }

        const normTrimmed = normalizeSubjectName(trimmed);
        const canonTrimmed = getCanonicalSubjectKey(trimmed, sectionObj.section_grade_level);

        const updatedTaught = [...currentTaught, trimmed];
        const prevHidden = sectionObj.section_metadata?.hiddenConsolidatedSubjects || [];
        const updatedHidden = prevHidden.filter(h => {
            if (h.toLowerCase().trim() === trimmed.toLowerCase()) return false;
            if (normalizeSubjectName(h) === normTrimmed) return false;
            const canonH = getCanonicalSubjectKey(h, sectionObj.section_grade_level);
            if (canonH && (canonH === canonTrimmed || canonH === normTrimmed)) return false;
            if (isSameSubject(undefined, h, undefined, trimmed)) return false;
            return true;
        });

        const updatedSection: Section = {
            ...sectionObj,
            taught_subjects: updatedTaught,
            section_metadata: {
                ...sectionObj.section_metadata,
                hiddenConsolidatedSubjects: updatedHidden
            }
        };

        try {
            await useAppStore.getState().updateSection(updatedSection);
            showNotification(`Added "${trimmed}" column to sheet!`, 'success');
            setIsAddSubjectModalOpen(false);
            setCustomSubjectName('');
            setAddSubjectSearchQuery('');
        } catch (err) {
            console.error('Failed to add subject:', err);
            showNotification('Failed to add subject.', 'error');
        }
    };

    const handleDeleteColumn = async (subjectName: string, baseId?: string) => {
        if (!sectionObj) return;
        const trimmed = subjectName.trim();
        if (!trimmed) return;
        const confirmed = window.confirm(
            `Are you sure you want to delete the "${trimmed}" column from ${sectionObj.section_name}?\n\nThis will remove the column from Grade Management and Summary of Grades.`
        );
        if (!confirmed) return;

        const normTrimmed = normalizeSubjectName(trimmed);
        const canonTrimmed = getCanonicalSubjectKey(trimmed, sectionObj.section_grade_level);

        // 1. Target subject names to add to hiddenConsolidatedSubjects
        const prevHidden = sectionObj.section_metadata?.hiddenConsolidatedSubjects || [];
        const isTargetMatch = (s: string) => {
            if (s.toLowerCase().trim() === trimmed.toLowerCase()) return true;
            if (normalizeSubjectName(s) === normTrimmed) return true;
            const canon = getCanonicalSubjectKey(s, sectionObj.section_grade_level);
            if (canon && (canon === canonTrimmed || canon === normTrimmed)) return true;
            if (isSameSubject(undefined, s, undefined, trimmed)) return true;
            if (isMatchingSubject(trimmed, undefined, s)) return true;
            return false;
        };

        const alreadyInHidden = prevHidden.some(h => isTargetMatch(h));
        const updatedHidden = alreadyInHidden ? [...prevHidden] : [...prevHidden, trimmed];

        // If deleting MAPEH, also hide its subcomponents
        if (normTrimmed === 'mapeh') {
            const mapehSubs = ['Music and Arts', 'Physical Education and Health', 'Music', 'Arts', 'Physical Education', 'Health'];
            mapehSubs.forEach(ms => {
                if (!updatedHidden.some(h => normalizeSubjectName(h) === normalizeSubjectName(ms))) {
                    updatedHidden.push(ms);
                }
            });
        }

        // 2. Filter taught_subjects
        const currentTaught = sectionObj.taught_subjects && sectionObj.taught_subjects.length > 0
            ? sectionObj.taught_subjects
            : sectionSubjects.map(s => s.subject_name);
        const updatedTaught = currentTaught.filter(s => !isTargetMatch(s));

        // 3. Filter teaching_subjects (teaching load)
        const updatedTeaching = sectionObj.teaching_subjects
            ? sectionObj.teaching_subjects.filter(s => !isTargetMatch(s))
            : undefined;

        // 4. Prune sf9SubjectSelections
        const prevSelections = sectionObj.section_metadata?.sf9SubjectSelections || {};
        const updatedSelections: Record<string, string> = { ...(prevSelections as Record<string, string>) };
        if (baseId && updatedSelections[baseId]) {
            delete updatedSelections[baseId];
        }
        for (const [k, v] of Object.entries(updatedSelections)) {
            if (k.toLowerCase().includes(normTrimmed) || (typeof v === 'string' && (isTargetMatch(v) || normalizeSubjectName(v) === normTrimmed))) {
                delete updatedSelections[k];
            }
        }

        // 5. Build updated section
        const updatedSection: Section = {
            ...sectionObj,
            taught_subjects: updatedTaught,
            ...(updatedTeaching !== undefined ? { teaching_subjects: updatedTeaching } : {}),
            section_metadata: {
                ...sectionObj.section_metadata,
                hiddenConsolidatedSubjects: updatedHidden,
                sf9SubjectSelections: updatedSelections
            }
        };

        // 6. Prune local overrideSubjectSelections
        setOverrideSubjectSelections(prev => {
            const next = { ...prev };
            delete next[sectionObj.id];
            return next;
        });

        try {
            const { 
                gradingSheetRecords: allGradingRecords, 
                deleteGradingSheetRecord, 
                subjects: allDbSubjects, 
                deleteSubject 
            } = useAppStore.getState();

            // 7. Delete orphaned gradingSheetRecords for this section & subject
            const recordsToDelete = allGradingRecords.filter(r => 
                r.section_id === sectionObj.id && 
                (isTargetMatch(r.subject_name || '') || 
                 (r.subject_id && (isSameSubject(r.subject_id, r.subject_name, undefined, trimmed) || cleanSubjectQuery(r.subject_id).includes(normTrimmed))))
            );

            for (const rec of recordsToDelete) {
                await deleteGradingSheetRecord(rec.id);
            }

            // 8. Delete section-specific subject from DB if one exists
            const sectionDbSubject = allDbSubjects.find(s => 
                s.section_id === sectionObj.id && 
                (isTargetMatch(s.subject_name) || (baseId && s.id === baseId))
            );
            if (sectionDbSubject) {
                await deleteSubject(sectionDbSubject.id);
            }

            // 9. Update section in store & DB
            await useAppStore.getState().updateSection(updatedSection);
            showNotification(`Deleted "${trimmed}" column.`, 'success');
        } catch (err) {
            console.error('Failed to delete subject column:', err);
            showNotification('Failed to delete column.', 'error');
        }
    };

    const handleResetDepEdOrder = async () => {
        if (!sectionObj) return;
        const currentSubjects = sectionSubjects.map(s => s.subject_name);
        const gradeLevelStr = sectionObj.section_grade_level || '';
        const isG11 = isSHSSection && (gradeLevelStr.includes('11') || gradeLevelStr === '11');

        const getShsCategoryRank = (name: string): number => {
            const cat = getSubjectCategory(name, gradeLevelStr);
            if (isG11) {
                if (cat.startsWith('Core')) return 1;
                if (cat.startsWith('Academic Elective')) return 2;
                if (cat.startsWith('TechPro Elective')) return 3;
                return 4;
            } else {
                if (cat === 'Core' || cat.startsWith('Core')) return 1;
                if (cat === 'Applied' || cat.startsWith('Academic')) return 2;
                if (cat === 'Specialized' || cat.startsWith('TechPro')) return 3;
                return 4;
            }
        };

        const getG11CoreOrderIndex = (name: string): number => {
            const norm = normalizeSubjectName(name);
            if (norm.includes('effectivecommunication') || norm.includes('mabisangkomunikasyon')) return 1;
            if (norm.includes('generalmathematics')) return 2;
            if (norm.includes('generalscience')) return 3;
            if (norm.includes('lifeandcareerskills')) return 4;
            if (norm.includes('pagaaralngkasaysayan') || norm.includes('kasaysayanatlipunangpilipino')) return 5;
            return 99;
        };

        const sorted = [...currentSubjects].sort((a, b) => {
            if (isSHSSection) {
                const rankA = getShsCategoryRank(a);
                const rankB = getShsCategoryRank(b);
                if (rankA !== rankB) return rankA - rankB;

                if (isG11 && rankA === 1) {
                    const coreIdxA = getG11CoreOrderIndex(a);
                    const coreIdxB = getG11CoreOrderIndex(b);
                    if (coreIdxA !== coreIdxB) return coreIdxA - coreIdxB;
                }
            }
            const prioA = getStandardSubjectPriority(a);
            const prioB = getStandardSubjectPriority(b);
            if (prioA !== prioB) return prioA - prioB;
            return a.localeCompare(b);
        });

        const updatedSection: Section = {
            ...sectionObj,
            taught_subjects: sorted
        };

        try {
            await useAppStore.getState().updateSection(updatedSection);
            showNotification('Reset subjects to official DepEd order.', 'success');
        } catch (err) {
            console.error('Failed to reset subject order:', err);
            showNotification('Failed to reset subject order.', 'error');
        }
    };

    const handleSubjectHeaderAction = async (column: { baseId: string; subject: VirtualSectionSubject }, actionValue: string) => {
        if (!actionValue || !sectionObj) return;

        if (actionValue === '__RESET_DEPED_ORDER__') {
            await handleResetDepEdOrder();
            return;
        }

        if (actionValue === '__DELETE_COLUMN__') {
            await handleDeleteColumn(column.subject.subject_name, column.baseId);
            return;
        }

        if (actionValue === '__RESET_WIDTHS__') {
            await handleResetColumnWidths();
            return;
        }

        if (actionValue === '__ADD_COLUMN__') {
            setIsAddSubjectModalOpen(true);
            return;
        }

        if (actionValue.startsWith('__ADD_SPECIFIC__:')) {
            const subjectToAdd = actionValue.replace('__ADD_SPECIFIC__:', '');
            await handleQuickAddSubject(subjectToAdd);
            return;
        }

        if (actionValue.startsWith('__SWITCH__:')) {
            const selectedId = actionValue.replace('__SWITCH__:', '');
            await handleUpdateSubjectSelection(column.baseId, selectedId);
            return;
        }

        await handleUpdateSubjectSelection(column.baseId, actionValue);
    };

    const handleSyncSingleSubject = async (targetSubject: VirtualSectionSubject) => {
        if (!sectionObj || !isAdviser) {
            showNotification('Sync is only available in your Advisory Class.', 'info');
            return;
        }

        if (!isSubjectInTeachingLoad(targetSubject, sectionObj, classRecords)) {
            showNotification(`"${targetSubject.subject_name}" is assigned to another subject teacher and is not part of your personal teaching load. Grades must be entered manually.`, 'info');
            return;
        }

        const baseQuarters: (1 | 2 | 3)[] = selectedTerm === 'all'
            ? [1, 2, 3]
            : [parseInt(selectedTerm.replace('q', '')) as 1 | 2 | 3];
        const quartersToSync = baseQuarters.filter(q => !isQuarterLocked(q));

        if (quartersToSync.length === 0) {
            showNotification('Selected term(s) are locked against syncing. Unlock them in the Lock menu first.', 'error');
            return;
        }

        const sectionGradeLevel = sectionObj.section_grade_level || '';
        let sectionTrack = 'Academic Track';
        if (sectionObj.track) {
            const tr = sectionObj.track;
            if (tr === 'Academic') {
                sectionTrack = sectionObj.strand ? `Academic - ${sectionObj.strand}` : 'Academic Track';
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
        const recordsToSync: ClassRecord[] = [];
        const recordsToDelete: string[] = [];
        const { gradingSheetRecords: currentGradingRecords, deleteGradingSheetRecord, bulkUpdateGradingSheetRecords } = useAppStore.getState();

        const findExistingGradingRecord = (studentLrn: string, subId: string, subName: string | undefined, q: number) => {
            return currentGradingRecords.find(r =>
                (r.student_lrn === studentLrn || String(r.student_lrn).trim() === String(studentLrn).trim()) &&
                isQuarterMatch(r.quarter, q) &&
                (!activeSchoolYear || !r.school_year || r.school_year === activeSchoolYear) &&
                (r.subject_id === subId || isSameSubject(r.subject_id, r.subject_name, subId, subName))
            );
        };

        try {
            for (const quarter of quartersToSync) {
                for (const student of sectionStudents) {
                    if (targetSubject._mapehGroups) {
                        const maComps = (targetSubject._mapehGroups.musicArts || []).filter(comp => isSubjectInTeachingLoad(comp, sectionObj, classRecords));
                        const peComps = (targetSubject._mapehGroups.peHealth || []).filter(comp => isSubjectInTeachingLoad(comp, sectionObj, classRecords));
                        for (const comp of [...maComps, ...peComps]) {
                            const compGrade = resolveStudentQuarterGrade({
                                studentLrn: student.lrn,
                                subjectId: comp.id,
                                subjectName: comp.subject_name,
                                sectionId: sectionObj.id,
                                quarter,
                                schoolYear: activeSchoolYear,
                                classRecords,
                                gradingSheetRecords: [],
                                hpsRecords,
                                sectionGradeLevel,
                                sectionTrack,
                                subjectObj: comp
                            });
                            if (compGrade > 0) {
                                recordsToSync.push({
                                    id: `${student.lrn}_${comp.id}_${quarter}_${activeSchoolYear}`,
                                    student_lrn: student.lrn,
                                    subject_id: comp.id,
                                    subject_name: comp.subject_name,
                                    section_id: sectionObj.id,
                                    quarter: quarter as 1 | 2 | 3,
                                    school_year: activeSchoolYear,
                                    final_grade: compGrade,
                    grade_source: 'eclass_sync',
                                    written_works: [],
                                    performance_tasks: [],
                                    quarterly_exam: 0
                                });
                            }
                        }
                        // Clear rogue parent MAPEH record if present
                        const oldParent = findExistingGradingRecord(student.lrn, targetSubject.id, targetSubject.subject_name, quarter);
                        if (oldParent?.id) recordsToDelete.push(oldParent.id);
                    } else if (isEcmkParent(targetSubject.subject_name)) {
                        const ecmkGroups = (targetSubject as any)._ecmkGroups;
                        const ecComps = (ecmkGroups?.effectiveComm || []).filter((comp: any) => isSubjectInTeachingLoad(comp, sectionObj, classRecords));
                        const mkComps = (ecmkGroups?.mabisangKom || []).filter((comp: any) => isSubjectInTeachingLoad(comp, sectionObj, classRecords));
                        for (const comp of [...ecComps, ...mkComps]) {
                            const compGrade = resolveStudentQuarterGrade({
                                studentLrn: student.lrn,
                                subjectId: comp.id,
                                subjectName: comp.subject_name,
                                sectionId: sectionObj.id,
                                quarter,
                                schoolYear: activeSchoolYear,
                                classRecords,
                                gradingSheetRecords: [],
                                hpsRecords,
                                sectionGradeLevel,
                                sectionTrack,
                                subjectObj: comp
                            });
                            if (compGrade > 0) {
                                recordsToSync.push({
                                    id: `${student.lrn}_${comp.id}_${quarter}_${activeSchoolYear}`,
                                    student_lrn: student.lrn,
                                    subject_id: comp.id,
                                    subject_name: comp.subject_name,
                                    section_id: sectionObj.id,
                                    quarter: quarter as 1 | 2 | 3,
                                    school_year: activeSchoolYear,
                                    final_grade: compGrade,
                    grade_source: 'eclass_sync',
                                    written_works: [],
                                    performance_tasks: [],
                                    quarterly_exam: 0
                                });
                            }
                        }
                        // Clear rogue parent EC/MK record if present
                        const oldParent = findExistingGradingRecord(student.lrn, targetSubject.id, targetSubject.subject_name, quarter);
                        if (oldParent?.id) recordsToDelete.push(oldParent.id);
                    } else {
                        const directGrade = resolveStudentQuarterGrade({
                            studentLrn: student.lrn,
                            subjectId: targetSubject.id,
                            subjectName: targetSubject.subject_name,
                            sectionId: sectionObj.id,
                            quarter,
                            schoolYear: activeSchoolYear,
                            classRecords,
                            gradingSheetRecords: [],
                            hpsRecords,
                            sectionGradeLevel,
                            sectionTrack,
                            subjectObj: targetSubject
                        });
                        if (directGrade > 0) {
                            recordsToSync.push({
                                id: `${student.lrn}_${targetSubject.id}_${quarter}_${activeSchoolYear}`,
                                student_lrn: student.lrn,
                                subject_id: targetSubject.id,
                                subject_name: targetSubject.subject_name,
                                section_id: sectionObj.id,
                                quarter: quarter as 1 | 2 | 3,
                                school_year: activeSchoolYear,
                                final_grade: directGrade,
                    grade_source: 'eclass_sync',
                                written_works: [],
                                performance_tasks: [],
                                quarterly_exam: 0
                            });
                        }
                    }
                }
            }

            const syncResult = recordsToSync.length > 0
                ? await bulkUpdateGradingSheetRecords(recordsToSync)
                : { updated: 0, skippedManualOverrides: 0 };
            if (recordsToDelete.length > 0) {
                for (const dId of recordsToDelete) {
                    await deleteGradingSheetRecord(dId);
                }
            }

            if (syncResult.updated > 0) {
                const overridesMsg = syncResult.skippedManualOverrides > 0 ? ` ${syncResult.skippedManualOverrides} manual override(s) were preserved.` : '';
                showNotification(`Successfully synced ${targetSubject.subject_name} from E-Class Record (${syncResult.updated} grades updated)!${overridesMsg}`, 'success');
            } else if (syncResult.skippedManualOverrides > 0) {
                showNotification(`No grades were overwritten for ${targetSubject.subject_name}. ${syncResult.skippedManualOverrides} manual override(s) were preserved.`, 'info');
            } else {
                showNotification(`No new grades found in E-Class Record for ${targetSubject.subject_name}.`, 'info');
            }
        } catch (err) {
            console.error('Single subject sync error:', err);
            showNotification(`Failed to sync ${targetSubject.subject_name} from E-Class Record.`, 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const isExcludedFromGeneralAverage = (subj: Subject) =>
        subj.counts_in_general_average === false ||
        Boolean(subj.is_component) ||
        subj.subject_name.startsWith('*') ||
        subj.subject_name.toLowerCase().includes('arabic language') ||
        subj.subject_name.toLowerCase().includes('islamic values');

    const getSubjectTermUnits = (subj: Subject & { _ecmkGroups?: { effectiveComm: Subject[]; mabisangKom: Subject[] } }): number => {
        const gradeLvl = sectionObj?.section_grade_level || 'Grade 11';
        if (subj._ecmkGroups) {
            const ecSub = subj._ecmkGroups.effectiveComm[0];
            const mkSub = subj._ecmkGroups.mabisangKom[0];
            const ecUnits = (ecSub?.units && ecSub.units > 0) ? ecSub.units : getShsSubjectUnitInfo('Effective Communication', gradeLvl).unitsPerTerm;
            const mkUnits = (mkSub?.units && mkSub.units > 0) ? mkSub.units : getShsSubjectUnitInfo('Mabisang Komunikasyon', gradeLvl).unitsPerTerm;
            return ecUnits + mkUnits;
        }
        if (subj.units && subj.units > 0) return subj.units;
        return getShsSubjectUnitInfo(subj.subject_name, gradeLvl).unitsPerTerm;
    };

    const getSubjectYearUnits = (subj: Subject & { _ecmkGroups?: { effectiveComm: Subject[]; mabisangKom: Subject[] } }, offeredTermsCount: number): number => {
        const termUnits = getSubjectTermUnits(subj);
        return termUnits * Math.max(1, offeredTermsCount);
    };

    // GRADES COMPUTATION
    const gradesData = useMemo(() => {
        const data: GradesData = {};
        const gradeCache = new Map<string, number>();

        sectionStudents.forEach(student => {
            const studentData: StudentGradeRow = {};
            const finalAverageEntries: Array<{ grade: number; weight: number }> = [];
            const finalAverageStatuses: Array<'complete' | 'provisional' | 'missing'> = [];

            const stRecs = recordsByLrn.get(student.lrn) || recordsByLrn.get(String(student.lrn).trim()) || { classRecs: [], gradingRecs: [] };

            const getStudentQuarterGrade = (subjectId: string, q: number, subjectName?: string) => {
                const cacheKey = `${student.lrn}_${subjectId}_${q}_${subjectName || ''}`;
                if (gradeCache.has(cacheKey)) return gradeCache.get(cacheKey)!;
                const val = resolveStudentQuarterGrade({
                    studentLrn: student.lrn,
                    subjectId,
                    subjectName,
                    sectionId: sectionObj?.id,
                    quarter: q,
                    schoolYear: activeSchoolYear,
                    classRecords: [], // Grade Management strictly displays records saved/synced into Grade Management (gradingSheetRecords)
                    gradingSheetRecords: stRecs.gradingRecs,
                    hpsRecords,
                    sectionGradeLevel: sectionObj?.section_grade_level,
                    sectionTrack: sectionObj?.track
                });
                gradeCache.set(cacheKey, val);
                return val;
            };

            sectionSubjects.forEach(subject => {
                if (subject._mapehGroups) {
                    const subjectGrades: any = {};
                    const virtualTermGrades: Array<number | null> = [null, null, null];
                    const completeTermGrades: Array<number | null> = [null, null, null];

                    for (let q = 1; q <= 4; q++) {
                        const qKey = `q${q}` as QuarterKey;
                        const musicArtsResults: number[] = [];
                        const peHealthResults: number[] = [];

                        subject._mapehGroups.musicArts.forEach(comp => {
                            const val = getStudentQuarterGrade(comp.id, q, comp.subject_name);
                            if (val > 0) musicArtsResults.push(val);
                        });

                        subject._mapehGroups.peHealth.forEach(comp => {
                            const val = getStudentQuarterGrade(comp.id, q, comp.subject_name);
                            if (val > 0) peHealthResults.push(val);
                        });

                        const composite = calculateCompositeTermGrade([musicArtsResults, peHealthResults]);
                        if (composite.value !== null) {
                            const [maAvg, phAvg] = composite.componentAverages;
                            const qAvg = composite.value;

                            subjectGrades[qKey] = {
                                value: qAvg,
                                musicArts: maAvg,
                                peHealth: phAvg
                            };

                            if (q <= 3) virtualTermGrades[q - 1] = qAvg;
                            if (q <= 3 && composite.complete) completeTermGrades[q - 1] = qAvg;
                        }
                    }

                    const offeredTerms = resolveSubjectOfferedTerms(subject, sectionObj).filter(term => term <= 3);
                    const finalGrade = calculateQuarterlyFinalGrade(virtualTermGrades, offeredTerms, offeredTerms, completeTermGrades);
                    const isExcluded = isExcludedFromGeneralAverage(subject);
                    if (!isExcluded && offeredTerms.length > 0) finalAverageStatuses.push(finalGrade.status);
                    if (finalGrade.status !== 'missing') {
                        const finalRating = finalGrade.value;
                        subjectGrades.final = finalRating;
                        subjectGrades.finalStatus = finalGrade.status;
                        studentData[subject.id] = subjectGrades;

                        if (!isExcluded) {
                            if (isSHSSection) {
                                const yearUnits = getSubjectYearUnits(subject, offeredTerms.length);
                                finalAverageEntries.push({ grade: finalRating, weight: yearUnits });
                            } else {
                                finalAverageEntries.push({ grade: finalRating, weight: 1 });
                            }
                        }
                    } else {
                        studentData[subject.id] = {};
                    }
                } else if (subject._ecmkGroups) {
                    // EC & MK parent: average Effective Communication and Mabisang Komunikasyon
                    const subjectGrades: any = {};
                    const virtualTermGrades: Array<number | null> = [null, null, null];
                    const completeTermGrades: Array<number | null> = [null, null, null];

                    for (let q = 1; q <= 4; q++) {
                        const qKey = `q${q}` as QuarterKey;
                        const ecResults: number[] = [];
                        const mkResults: number[] = [];

                        subject._ecmkGroups.effectiveComm.forEach(comp => {
                            const val = getStudentQuarterGrade(comp.id, q, comp.subject_name);
                            if (val > 0) ecResults.push(val);
                        });

                        subject._ecmkGroups.mabisangKom.forEach(comp => {
                            const val = getStudentQuarterGrade(comp.id, q, comp.subject_name);
                            if (val > 0) mkResults.push(val);
                        });

                        const composite = calculateCompositeTermGrade([ecResults, mkResults]);
                        if (composite.value !== null) {
                            const [ecAvg, mkAvg] = composite.componentAverages;
                            const qAvg = composite.value;

                            subjectGrades[qKey] = {
                                value: qAvg,
                                effectiveComm: ecAvg,
                                mabisangKom: mkAvg
                            };

                            if (q <= 3) virtualTermGrades[q - 1] = qAvg;
                            if (q <= 3 && composite.complete) completeTermGrades[q - 1] = qAvg;
                        }
                    }

                    const offeredTerms = resolveSubjectOfferedTerms(subject, sectionObj).filter(term => term <= 3);
                    const finalGrade = calculateQuarterlyFinalGrade(virtualTermGrades, offeredTerms, offeredTerms, completeTermGrades);
                    const isExcluded = isExcludedFromGeneralAverage(subject);
                    if (!isExcluded && offeredTerms.length > 0) finalAverageStatuses.push(finalGrade.status);
                    if (finalGrade.status !== 'missing') {
                        const finalRating = finalGrade.value;
                        subjectGrades.final = finalRating;
                        subjectGrades.finalStatus = finalGrade.status;
                        studentData[subject.id] = subjectGrades;
                        
                        if (!isExcluded) {
                            if (isSHSSection) {
                                const yearUnits = getSubjectYearUnits(subject, offeredTerms.length);
                                finalAverageEntries.push({ grade: finalRating, weight: yearUnits });
                            } else {
                                finalAverageEntries.push({ grade: finalRating, weight: 1 });
                            }
                        }
                    } else {
                        studentData[subject.id] = {};
                    }
                } else {
                    const subjectGrades: QuarterGrades = {};
                    const subjectTermGrades: Array<number | null> = [null, null, null];

                    for (let q = 1; q <= 4; q++) {
                        const gradeVal = getStudentQuarterGrade(subject.id, q, subject.subject_name);

                        if (gradeVal > 0) {
                            const qKey = `q${q}` as QuarterKey;
                            subjectGrades[qKey] = gradeVal;
                            if (q <= 3) subjectTermGrades[q - 1] = gradeVal;
                        }
                    }

                    const offeredTerms = resolveSubjectOfferedTerms(subject, sectionObj).filter(term => term <= 3);
                    const finalGrade = calculateQuarterlyFinalGrade(subjectTermGrades, offeredTerms, offeredTerms);
                    const isExcluded = isExcludedFromGeneralAverage(subject);
                    if (!isExcluded && offeredTerms.length > 0) finalAverageStatuses.push(finalGrade.status);
                    if (finalGrade.status !== 'missing') {
                        const finalRating = finalGrade.value;
                        subjectGrades.final = finalRating;
                        subjectGrades.finalStatus = finalGrade.status;
                        studentData[subject.id] = subjectGrades;

                        if (!isExcluded) {
                            if (isSHSSection) {
                                const yearUnits = getSubjectYearUnits(subject, offeredTerms.length);
                                finalAverageEntries.push({ grade: finalRating, weight: yearUnits });
                            } else {
                                finalAverageEntries.push({ grade: finalRating, weight: 1 });
                            }
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

            const genAvg = calculateWeightedGradeAverage(finalAverageEntries);
            studentData.generalAverageStatus = genAvg === null
                ? 'missing'
                : finalAverageStatuses.length > 0 && finalAverageStatuses.every(status => status === 'complete')
                    ? 'complete'
                    : 'provisional';
            if (genAvg !== null) {
                studentData.generalAverage = String(Math.round(genAvg));
                studentData.termAverage = genAvg.toFixed(2);
            } else {
                studentData.generalAverage = '';
                studentData.termAverage = '';
            }

            // Calculate average for the selected term using visible subject columns
            const activeTerm = selectedTerm === 'all' ? null : selectedTerm;
            if (activeTerm) {
                const seenSubjectIds = new Set<string>();
                const termAverageEntries: Array<{ grade: number; weight: number }> = [];
                let termExpectedGradeCount = 0;
                let termMissingGradeCount = 0;
                const activeTermNum = activeTerm === 'q1' ? 1 : activeTerm === 'q2' ? 2 : activeTerm === 'q3' ? 3 : 4;
                subjectColumns.forEach(({ subject }) => {
                    // Avoid double-counting if the same subject is selected for multiple columns
                    if (seenSubjectIds.has(subject.id)) return;
                    seenSubjectIds.add(subject.id);

                    const sData = studentData[subject.id] || {};
                    const val = getQuarterGradeValue(sData[activeTerm as QuarterKey]);
                    const isExcluded = isExcludedFromGeneralAverage(subject);
                    const offeredTerms = resolveSubjectOfferedTerms(subject, sectionObj);
                    if (!isExcluded && offeredTerms.includes(activeTermNum)) {
                        const detail = sData[activeTerm as QuarterKey] as any;
                        const requiredValues = subject._mapehGroups
                            ? [detail?.musicArts, detail?.peHealth]
                            : subject._ecmkGroups
                                ? [detail?.effectiveComm, detail?.mabisangKom]
                                : [val];
                        termExpectedGradeCount += requiredValues.length;
                        termMissingGradeCount += countMissingGradeValues(requiredValues);
                    }

                    if (val !== null && val > 0 && !isExcluded && offeredTerms.includes(activeTermNum)) {
                        if (isSHSSection) {
                            const termUnits = getSubjectTermUnits(subject);
                            termAverageEntries.push({ grade: val, weight: termUnits });
                        } else {
                            termAverageEntries.push({ grade: val, weight: 1 });
                        }
                    }
                });

                const avg = calculateWeightedGradeAverage(termAverageEntries);
                studentData.generalAverageStatus = termExpectedGradeCount === 0 || avg === null
                    ? 'missing'
                    : termMissingGradeCount === 0
                        ? 'complete'
                        : termMissingGradeCount < termExpectedGradeCount
                            ? 'provisional'
                            : 'missing';
                if (avg !== null) {
                    studentData.termAverage = avg.toFixed(2);
                    studentData.generalAverage = String(Math.round(avg));
                } else {
                    studentData.termAverage = '';
                    studentData.generalAverage = '';
                }
            }

            data[student.lrn] = studentData;
        });

        return data;
    }, [sectionStudents, sectionSubjects, subjectColumns, recordsByLrn, hpsRecords, activeSchoolYear, sectionObj, selectedTerm, isSHSSection]);

    const missingGradesSummary = useMemo(() => {
        if (!sectionStudents.length || !sectionSubjects.length) {
            return { totalMissing: 0, bySubject: [] as { subjectId: string; subjectName: string; missingCount: number }[], studentsWithMissing: new Set<string>() };
        }

        const bySubjectMap = new Map<string, { name: string; count: number }>();
        sectionSubjects.forEach(s => {
            bySubjectMap.set(s.id, { name: s.subject_name, count: 0 });
        });

        let total = 0;
        const studentsWithMissing = new Set<string>();

        sectionStudents.forEach(student => {
            const studentGrades = gradesData[student.lrn] || {};

            sectionSubjects.forEach(subject => {
                const sData = studentGrades[subject.id] || {};

                const offered = resolveSubjectOfferedTerms(subject, sectionObj);
                if (selectedTerm !== 'all') {
                    const termNum = selectedTerm === 'q1' ? 1 : selectedTerm === 'q2' ? 2 : selectedTerm === 'q3' ? 3 : 4;
                    if (!offered.includes(termNum)) return;

                    const qKey = selectedTerm as QuarterKey;
                    if (subject._mapehGroups) {
                        const detail = sData[qKey] as any;
                        const missingInMapeh = countMissingGradeValues([detail?.musicArts, detail?.peHealth]);
                        if (missingInMapeh > 0) {
                            total += missingInMapeh;
                            studentsWithMissing.add(student.lrn);
                            const curr = bySubjectMap.get(subject.id);
                            if (curr) curr.count += missingInMapeh;
                        }
                    } else if (subject._ecmkGroups) {
                        const detail = sData[qKey] as any;
                        const missingInEcmk = countMissingGradeValues([detail?.effectiveComm, detail?.mabisangKom]);
                        if (missingInEcmk > 0) {
                            total += missingInEcmk;
                            studentsWithMissing.add(student.lrn);
                            const curr = bySubjectMap.get(subject.id);
                            if (curr) curr.count += missingInEcmk;
                        }
                    } else {
                        const gradeCell = sData[qKey] as QuarterGradeCell | undefined;
                        const val = isQuarterGradeDetail(gradeCell) ? gradeCell.value : gradeCell;
                        if (countMissingGradeValues([val]) > 0) {
                            total++;
                            studentsWithMissing.add(student.lrn);
                            const curr = bySubjectMap.get(subject.id);
                            if (curr) curr.count++;
                        }
                    }
                } else {
                    const quarters: { key: QuarterKey; termNum: number }[] = [
                        { key: 'q1', termNum: 1 },
                        { key: 'q2', termNum: 2 },
                        { key: 'q3', termNum: 3 }
                    ];
                    const quarterValues = quarters.map(({ key: qKey, termNum }) => {
                            const detail = sData[qKey] as any;
                            if (subject._mapehGroups) {
                                return { term: termNum, values: [detail?.musicArts, detail?.peHealth] };
                            }
                            if (subject._ecmkGroups) {
                                return { term: termNum, values: [detail?.effectiveComm, detail?.mabisangKom] };
                            }
                            const gradeCell = sData[qKey] as QuarterGradeCell | undefined;
                            const value = isQuarterGradeDetail(gradeCell) ? gradeCell.value : gradeCell;
                            return { term: termNum, values: [value] };
                        });
                    const missingForSubject = countMissingOfferedGradeValues(quarterValues, offered);
                    if (missingForSubject > 0) {
                        total += missingForSubject;
                        studentsWithMissing.add(student.lrn);
                        const curr = bySubjectMap.get(subject.id);
                        if (curr) curr.count += missingForSubject;
                    }
                }
            });
        });

        const bySubject = Array.from(bySubjectMap.entries())
            .map(([id, info]) => ({ subjectId: id, subjectName: info.name, missingCount: info.count }))
            .filter(item => item.missingCount > 0)
            .sort((a, b) => b.missingCount - a.missingCount);

        return { totalMissing: total, bySubject, studentsWithMissing };
    }, [sectionStudents, sectionSubjects, gradesData, selectedTerm, sectionObj]);

    const displayedMaleStudents = useMemo(() => {
        if (!showMissingOnly) return maleStudents;
        return maleStudents.filter(s => missingGradesSummary.studentsWithMissing.has(s.lrn));
    }, [maleStudents, showMissingOnly, missingGradesSummary.studentsWithMissing]);

    const displayedFemaleStudents = useMemo(() => {
        if (!showMissingOnly) return femaleStudents;
        return femaleStudents.filter(s => missingGradesSummary.studentsWithMissing.has(s.lrn));
    }, [femaleStudents, showMissingOnly, missingGradesSummary.studentsWithMissing]);

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
        const activeTerm = isQuarter ? (selectedTerm as QuarterKey) : null;
        
        const checkStudent = (student: Student) => {
            const sData = gradesData[student.lrn];
            if (!sData || !sData.generalAverage || sData.generalAverageStatus !== 'complete') return null;

            const avgStr = activeTerm ? sData.termAverage : sData.generalAverage;
            if (!avgStr || avgStr === '') return null;
            const avg = Number(avgStr);
            if (isNaN(avg) || avg < 90) return null;

            // Verify no subject grade is below 85 (DepEd Order No. 36, s. 2016)
            for (const { subject } of subjectColumns) {
                if (isExcludedFromGeneralAverage(subject)) continue;
                const subjEntry = sData[subject.id];
                const gradeVal = activeTerm
                    ? (typeof subjEntry?.[activeTerm] === 'object' ? subjEntry[activeTerm]?.value : subjEntry?.[activeTerm])
                    : subjEntry?.final;
                if (typeof gradeVal === 'number' && gradeVal > 0 && gradeVal < 85) {
                    return null;
                }
            }

            return avg;
        };

        const maleStudents = sectionStudents.filter(s => isMaleStudent(s));
        const femaleStudents = sectionStudents.filter(s => isFemaleStudent(s));

        maleStudents.forEach(student => {
            const avg = checkStudent(student);
            if (avg !== null) {
                const studentName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''}`;
                stats.male++;
                stats.students.push({ name: studentName, average: avg.toFixed(2), lrn: student.lrn });
            }
        });

        femaleStudents.forEach(student => {
            const avg = checkStudent(student);
            if (avg !== null) {
                const studentName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''}`;
                stats.female++;
                stats.students.push({ name: studentName, average: avg.toFixed(2), lrn: student.lrn });
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
        const subWidth = getSubjectSubColWidth(sub.id);
        const width = termColSpan(sub) * subWidth;
        return { width: `${width}px`, minWidth: `${width}px` };
    };

    const totalColumns = useMemo(() => {
        return 1 + totalSubjectSubCols + (showGenAvg ? (showDescriptor ? 3 : 2) : 0);
    }, [totalSubjectSubCols, showGenAvg, showDescriptor]);
    
    const tableMinWidth = usableTableWidth;

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
        const renderSubjectHeaderCellInner = (column: { baseId: string; subject: VirtualSectionSubject }) => {
            const inTeachingLoad = isSubjectInTeachingLoad(column.subject, sectionObj, classRecords);
            const currentTermNum = selectedTerm === 'q1' ? 1 : selectedTerm === 'q2' ? 2 : selectedTerm === 'q3' ? 3 : 4;
            const isOfferedInCurrentTerm = selectedTerm === 'all' || getSubjectOfferedTerms(column.subject).includes(currentTermNum);
            return (
                <div className="relative w-full h-full flex flex-col items-center justify-center py-0.5">
                    <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5 pointer-events-none">
                        {column.subject.subject_name}
                    </span>
                    <span 
                        className={`no-print inline-block mt-0.5 px-1 py-0.2 rounded text-[5px] font-bold uppercase tracking-tight select-none ${
                            !isOfferedInCurrentTerm
                                ? 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                                : inTeachingLoad 
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' 
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                        }`}
                        title={
                            !isOfferedInCurrentTerm
                                ? `Not offered in ${TERM_LABELS[selectedTerm as keyof typeof TERM_LABELS] || 'this term'}`
                                : inTeachingLoad 
                                    ? 'Syncs from your personal E-Class Record' 
                                    : 'Assigned to another subject teacher (Manual grade entry)'
                        }
                    >
                        {!isOfferedInCurrentTerm ? 'Not Offered' : inTeachingLoad ? 'E-Class' : 'Manual'}
                    </span>
                    <select
                        value=""
                        onChange={(e) => void handleSubjectHeaderAction(column, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 no-print"
                        title={`Manage "${column.subject.subject_name}" column (Click for options) - ${inTeachingLoad ? 'Syncs from E-Class' : 'Manual entry from other teacher'}`}
                    >
                        <option value="" disabled>
                            ⚙️ Column: {column.subject.subject_name}
                        </option>
                        <optgroup label="Column Actions">
                            <option value="__ADD_COLUMN__">➕ Add Column...</option>
                            <option value="__DELETE_COLUMN__">🗑️ Delete This Column</option>
                            <option value="__RESET_WIDTHS__">📏 Reset All Column Widths</option>
                            <option value="__RESET_DEPED_ORDER__">🔄 Reset to Official DepEd Order</option>
                        </optgroup>
                        {availableSubjectsToAdd.length > 0 && (
                            <optgroup label="➕ Quick Add Column (From Catalog)">
                                {availableSubjectsToAdd.map((opt) => (
                                    <option key={`add-${opt.id}`} value={`__ADD_SPECIFIC__:${opt.subject_name}`}>
                                        ➕ Add: {opt.subject_name}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                        <optgroup label="🔄 Switch Column To:">
                            <option value={column.baseId}>
                                {column.subject.subject_name} (Current / Default)
                            </option>
                            {selectableSubjects
                                .filter((opt) => opt.id !== column.subject.id && opt.subject_name !== column.subject.subject_name)
                                .map((option) => (
                                    <option key={option.id} value={`__SWITCH__:${option.id}`}>
                                        {option.subject_name}
                                    </option>
                                ))}
                        </optgroup>
                    </select>
                </div>
            );
        };

        const renderHeaderHoverActions = (column: any, index: number) => {
            const inTeachingLoad = isSubjectInTeachingLoad(column.subject, sectionObj, classRecords);
            return (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-0.5 bg-slate-900 text-white rounded-full px-1.5 py-0.5 shadow-lg text-[8px] z-30 no-print transition-all whitespace-nowrap">
                    {index > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                void handleMoveSubject(column.subject.subject_name, 'left');
                            }}
                            className="p-0.5 hover:text-indigo-400 cursor-pointer"
                            title={`Move ${column.subject.subject_name} left`}
                        >
                            <ChevronLeft className="w-2.5 h-2.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            void handleSyncSingleSubject(column.subject);
                        }}
                        disabled={isSyncing}
                        className={`p-0.5 cursor-pointer flex items-center gap-0.5 ${
                            inTeachingLoad 
                                ? 'hover:text-emerald-400 text-white' 
                                : 'hover:text-amber-400 text-amber-300/90'
                        }`}
                        title={inTeachingLoad ? `Sync ${column.subject.subject_name} from E-Class Record` : `"${column.subject.subject_name}" is assigned to another teacher (Manual entry)`}
                    >
                        <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                    {index < subjectColumns.length - 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                void handleMoveSubject(column.subject.subject_name, 'right');
                            }}
                            className="p-0.5 hover:text-indigo-400 cursor-pointer"
                            title={`Move ${column.subject.subject_name} right`}
                        >
                            <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                    )}
                </div>
            );
        };

        return (
            <table
                className={`crosshair-table consolidated-print-table consolidated-grades-table w-full border-collapse border border-black ${isElementary ? 'text-[7px]' : 'text-[8px]'}`}
                style={{
                    width: `${usableTableWidth}px`,
                    minWidth: `${usableTableWidth}px`,
                    tableLayout: 'fixed'
                }}
            >
                <colgroup>
                    <col style={{ width: `${learnerNameWidth}px`, minWidth: `${learnerNameWidth}px` }} />
                    {subjectColumns.map((column, index) => {
                        const subWidth = getSubjectSubColWidth(column.subject.id);
                        if (selectedTerm !== 'all' && (column.subject as any)._mapehGroups) {
                            return (
                                <Fragment key={`col-group-mapeh-${column.baseId}-${index}`}>
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                </Fragment>
                            );
                        }
                        if (selectedTerm !== 'all' && isEcmkParent(column.subject.subject_name)) {
                            return (
                                <Fragment key={`col-group-ecmk-${column.baseId}-${index}`}>
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                </Fragment>
                            );
                        }
                        return (
                            <Fragment key={`col-group-std-${column.baseId}-${index}`}>
                                {(selectedTerm === 'q1' || selectedTerm === 'all') && (
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                )}
                                {(selectedTerm === 'q2' || selectedTerm === 'all') && (
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                )}
                                {(selectedTerm === 'q3' || selectedTerm === 'all') && (
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                )}
                                {selectedTerm === 'all' && (
                                    <col style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }} />
                                )}
                            </Fragment>
                        );
                    })}
                    {showGenAvg && (
                        <>
                            <col style={{ width: `${averageColWidth}px`, minWidth: `${averageColWidth}px` }} />
                            <col style={{ width: `${generalAvgColWidth}px`, minWidth: `${generalAvgColWidth}px` }} />
                            {showDescriptor && (
                                <col style={{ width: `${descriptorColWidth}px`, minWidth: `${descriptorColWidth}px` }} />
                            )}
                        </>
                    )}
                </colgroup>
                <thead>
                    {isSHSSection ? (
                        <>
                            {/* Row 1: SHS Categories */}
                            <tr className="text-center font-bold text-[8px] uppercase tracking-wider h-8">
                                <th rowSpan={3} data-col-key="learner-name" className="consolidated-name-col border border-black p-2 font-bold text-center bg-gray-100 relative group" style={{ width: `${learnerNameWidth}px`, minWidth: `${learnerNameWidth}px` }}>
                                    <span>NAME OF LEARNERS</span>
                                    <ColumnResizeHandle colKey="name" currentWidth={learnerNameWidth} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                </th>
                                {categoryGroups.map((group) => {
                                    const parts = group.category.split(' (');
                                    return (
                                        <th
                                            key={group.key}
                                            colSpan={group.colSpan}
                                            className="border border-black p-1 text-center font-black text-[7px] leading-tight bg-gray-100 uppercase"
                                        >
                                            {parts.length > 1 ? (
                                                <>
                                                    {parts[0]}<br />({parts[1]}
                                                </>
                                            ) : (
                                                group.category
                                            )}
                                        </th>
                                    );
                                })}
                                {showGenAvg && (
                                    <>
                                        <th rowSpan={3} data-col-key="col-average" className="consolidated-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100 relative group" style={{ width: `${averageColWidth}px`, minWidth: `${averageColWidth}px` }}>
                                            <span>AVERAGE</span>
                                            <ColumnResizeHandle colKey="average" currentWidth={averageColWidth} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                        </th>
                                        <th rowSpan={3} data-col-key="col-generalAverage" className="consolidated-general-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100 relative group" style={{ width: `${generalAvgColWidth}px`, minWidth: `${generalAvgColWidth}px` }}>
                                            <span>GENERAL AVERAGE</span>
                                            <ColumnResizeHandle colKey="generalAverage" currentWidth={generalAvgColWidth} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                        </th>
                                        {showDescriptor && (
                                            <th rowSpan={3} data-col-key="col-descriptor" className="consolidated-descriptor-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100 relative group" style={{ width: `${descriptorColWidth}px`, minWidth: `${descriptorColWidth}px` }}>
                                                <span>DESCRIPTOR</span>
                                                <ColumnResizeHandle colKey="descriptor" currentWidth={descriptorColWidth} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                            </th>
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
                                            data-col-key={`sub-${column.subject.id}`}
                                            rowSpan={2}
                                            className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50 group relative"
                                            title={column.subject.subject_name}
                                            style={getSubjectHeaderStyle(column.subject)}
                                        >
                                            {renderHeaderHoverActions(column, index)}
                                            {renderSubjectHeaderCellInner(column)}
                                            <ColumnResizeHandle colKey={column.subject.id} currentWidth={getSubjectSubColWidth(column.subject.id)} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                        </th>
                                    ) : (
                                        <th key={`subject-column-${column.baseId}-${index}`} data-col-key={`sub-${column.subject.id}`} colSpan={termColSpan(column.subject)} className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50 group relative" title={column.subject.subject_name} style={getSubjectHeaderStyle(column.subject)}>
                                            {renderHeaderHoverActions(column, index)}
                                            {renderSubjectHeaderCellInner(column)}
                                            <ColumnResizeHandle colKey={column.subject.id} currentWidth={getSubjectSubColWidth(column.subject.id)} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                        </th>
                                    )
                                ))}
                            </tr>
                        </>
                    ) : (
                        /* Row 1: JHS/Elementary Subject Names (Categories omitted) */
                        <tr className="text-center font-bold text-[8px] uppercase tracking-wider h-8">
                            <th rowSpan={2} data-col-key="learner-name" className="consolidated-name-col border border-black p-2 font-bold text-center bg-gray-100 relative group" style={{ width: `${learnerNameWidth}px`, minWidth: `${learnerNameWidth}px` }}>
                                <span>NAME OF LEARNERS</span>
                                <ColumnResizeHandle colKey="name" currentWidth={learnerNameWidth} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                            </th>
                            {subjectColumns.map((column, index) => (
                                selectedTerm !== 'all' && !(column.subject as any)._mapehGroups && !isEcmkParent(column.subject.subject_name) ? (
                                    <th
                                        key={`subject-column-${column.baseId}-${index}`}
                                        data-col-key={`sub-${column.subject.id}`}
                                        rowSpan={2}
                                        className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50 group relative"
                                        title={column.subject.subject_name}
                                        style={getSubjectHeaderStyle(column.subject)}
                                    >
                                        {renderHeaderHoverActions(column, index)}
                                        {renderSubjectHeaderCellInner(column)}
                                        <ColumnResizeHandle colKey={column.subject.id} currentWidth={getSubjectSubColWidth(column.subject.id)} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                    </th>
                                ) : (
                                    <th key={`subject-column-${column.baseId}-${index}`} data-col-key={`sub-${column.subject.id}`} colSpan={termColSpan(column.subject)} className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50 group relative" title={column.subject.subject_name} style={getSubjectHeaderStyle(column.subject)}>
                                        {renderHeaderHoverActions(column, index)}
                                        {renderSubjectHeaderCellInner(column)}
                                        <ColumnResizeHandle colKey={column.subject.id} currentWidth={getSubjectSubColWidth(column.subject.id)} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                    </th>
                                )
                            ))}
                            {showGenAvg && (
                                <>
                                    <th rowSpan={2} data-col-key="col-average" className="consolidated-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100 relative group" style={{ width: `${averageColWidth}px`, minWidth: `${averageColWidth}px` }}>
                                        <span>AVERAGE</span>
                                        <ColumnResizeHandle colKey="average" currentWidth={averageColWidth} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                    </th>
                                    <th rowSpan={2} data-col-key="col-generalAverage" className="consolidated-general-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100 relative group" style={{ width: `${generalAvgColWidth}px`, minWidth: `${generalAvgColWidth}px` }}>
                                        <span>GENERAL AVERAGE</span>
                                        <ColumnResizeHandle colKey="generalAverage" currentWidth={generalAvgColWidth} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                    </th>
                                    {showDescriptor && (
                                        <th rowSpan={2} data-col-key="col-descriptor" className="consolidated-descriptor-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100 relative group" style={{ width: `${descriptorColWidth}px`, minWidth: `${descriptorColWidth}px` }}>
                                            <span>DESCRIPTOR</span>
                                            <ColumnResizeHandle colKey="descriptor" currentWidth={descriptorColWidth} onResizeStart={handleResizeStart} onAutoFit={handleAutoFit} />
                                        </th>
                                    )}
                                </>
                            )}
                        </tr>
                    )}

                    {/* Row 3: Subheaders (T1, T2, T3, Final, Music, Arts, etc.) */}
                    <tr className="">
                        {subjectColumns.map((column, index) => {
                            const subWidth = getSubjectSubColWidth(column.subject.id);
                            return (
                                <Fragment key={`subject-subheader-${column.baseId}-${index}`}>
                                    {selectedTerm !== 'all' && (column.subject as any)._mapehGroups && (
                                        <>
                                            <th data-col-key={`sub-${column.subject.id}-ma`} className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                Music &<br/>Arts
                                                <span className={`no-print block text-[4.5px] font-bold uppercase mt-0.5 ${
                                                    isSubjectInTeachingLoad({ id: 'music_arts', subject_name: 'Music and Arts' }, sectionObj, classRecords)
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : 'text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    {isSubjectInTeachingLoad({ id: 'music_arts', subject_name: 'Music and Arts' }, sectionObj, classRecords) ? 'E-Class' : 'Manual'}
                                                </span>
                                            </th>
                                            <th data-col-key={`sub-${column.subject.id}-ph`} className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                PE &<br/>Health
                                                <span className={`no-print block text-[4.5px] font-bold uppercase mt-0.5 ${
                                                    isSubjectInTeachingLoad({ id: 'pe_health', subject_name: 'Physical Education and Health' }, sectionObj, classRecords)
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : 'text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    {isSubjectInTeachingLoad({ id: 'pe_health', subject_name: 'Physical Education and Health' }, sectionObj, classRecords) ? 'E-Class' : 'Manual'}
                                                </span>
                                            </th>
                                            <th data-col-key={`sub-${column.subject.id}`} className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>FINAL<br/>GRADE</th>
                                        </>
                                    )}
                                    {selectedTerm !== 'all' && isEcmkParent(column.subject.subject_name) && (
                                        <>
                                            <th data-col-key={`sub-${column.subject.id}-ec`} className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                Effective<br/>Communication
                                                <span className={`no-print block text-[4.5px] font-bold uppercase mt-0.5 ${
                                                    isSubjectInTeachingLoad({ id: 'effective_comm', subject_name: 'Effective Communication' }, sectionObj, classRecords)
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : 'text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    {isSubjectInTeachingLoad({ id: 'effective_comm', subject_name: 'Effective Communication' }, sectionObj, classRecords) ? 'E-Class' : 'Manual'}
                                                </span>
                                            </th>
                                            <th data-col-key={`sub-${column.subject.id}-mk`} className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1] bg-gray-50" style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>
                                                Mabisang<br/>Komunikasyon
                                                <span className={`no-print block text-[4.5px] font-bold uppercase mt-0.5 ${
                                                    isSubjectInTeachingLoad({ id: 'mabisang_kom', subject_name: 'Mabisang Komunikasyon' }, sectionObj, classRecords)
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : 'text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    {isSubjectInTeachingLoad({ id: 'mabisang_kom', subject_name: 'Mabisang Komunikasyon' }, sectionObj, classRecords) ? 'E-Class' : 'Manual'}
                                                </span>
                                            </th>
                                            <th data-col-key={`sub-${column.subject.id}`} className="consolidated-subject-col border border-black p-0.5 text-center font-bold text-[6px] leading-[1.1] bg-gray-200" style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}>FINAL<br/>GRADE</th>
                                        </>
                                    )}
                                    
                                    {selectedTerm === 'all' && (() => {
                                        const offered = getSubjectOfferedTerms(column.subject);
                                        const isT1 = offered.includes(1);
                                        const isT2 = offered.includes(2);
                                        const isT3 = offered.includes(3);
                                        return (
                                            <>
                                                <th
                                                    data-col-key={`sub-${column.subject.id}-q1`}
                                                    className={`consolidated-subject-col border border-black p-0.5 text-center font-normal ${
                                                        isT1 
                                                            ? 'bg-gray-50 text-slate-800' 
                                                            : 'bg-gray-200/90 dark:bg-slate-800 text-gray-400 dark:text-slate-500 select-none cursor-not-allowed'
                                                    }`}
                                                    style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                    title={isT1 ? 'Term 1' : 'Not offered in Term 1'}
                                                >
                                                    T1
                                                </th>
                                                <th
                                                    data-col-key={`sub-${column.subject.id}-q2`}
                                                    className={`consolidated-subject-col border border-black p-0.5 text-center font-normal ${
                                                        isT2 
                                                            ? 'bg-gray-50 text-slate-800' 
                                                            : 'bg-gray-200/90 dark:bg-slate-800 text-gray-400 dark:text-slate-500 select-none cursor-not-allowed'
                                                    }`}
                                                    style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                    title={isT2 ? 'Term 2' : 'Not offered in Term 2'}
                                                >
                                                    T2
                                                </th>
                                                <th
                                                    data-col-key={`sub-${column.subject.id}-q3`}
                                                    className={`consolidated-subject-col border border-black p-0.5 text-center font-normal ${
                                                        isT3 
                                                            ? 'bg-gray-50 text-slate-800' 
                                                            : 'bg-gray-200/90 dark:bg-slate-800 text-gray-400 dark:text-slate-500 select-none cursor-not-allowed'
                                                    }`}
                                                    style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                    title={isT3 ? 'Term 3' : 'Not offered in Term 3'}
                                                >
                                                    T3
                                                </th>
                                                <th
                                                    data-col-key={`sub-${column.subject.id}-final`}
                                                    className="consolidated-subject-col border border-black p-0.5 text-center font-bold bg-gray-200 text-slate-900"
                                                    style={{ width: `${subWidth}px`, minWidth: `${subWidth}px` }}
                                                >
                                                    Final
                                                </th>
                                            </>
                                        );
                                    })()}
                                </Fragment>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-gray-200"><td colSpan={totalColumns} className="border border-black p-1 font-bold pl-2 text-[10px] uppercase bg-gray-200">{genderLabel}</td></tr>
                    {studentsList.length === 0 ? (
                        <tr>
                            <td colSpan={totalColumns} className="border border-black p-3 text-center text-[10px] text-slate-500 italic bg-gray-50/50">
                                {showMissingOnly 
                                    ? `No ${genderLabel.toLowerCase()} students with incomplete grades.` 
                                    : `No ${genderLabel.toLowerCase()} students enrolled.`}
                            </td>
                        </tr>
                    ) : (
                        studentsList.map((student, idx) => {
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
                                learnerNameColumnWidth={learnerNameWidth}
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
                                highlightMissingGrades={highlightMissingGrades}
                                lockedQuarters={lockedQuarters}
                                customColumnWidths={customColumnWidths}
                                averageColWidth={averageColWidth}
                                generalAvgColWidth={generalAvgColWidth}
                                descriptorColWidth={descriptorColWidth}
                                getSubjectOfferedTerms={getSubjectOfferedTerms}
                            />
                        );
                    })
                )}
                </tbody>
            </table>
        );
    };

    return (
        <div className="h-full min-h-0 flex flex-col space-y-4">
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
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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

                {/* Right: Real-time Sync Status Indicator */}
                {selectedSection && (
                    <div className="flex items-center gap-2.5 shrink-0">
                        {missingGradesSummary.totalMissing === 0 ? (
                            <div 
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold shadow-xs select-none"
                                title="All subject grades for this term are complete and synced."
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>🟢 All Subjects Synced</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMissingOnly(prev => !prev);
                                    setHighlightMissingGrades(true);
                                }}
                                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer border select-none ${
                                    showMissingOnly
                                        ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/40 shadow-amber-500/20'
                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:scale-[1.02]'
                                }`}
                                title="Click to filter directly to students with incomplete grades"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <span>
                                    🟡 {missingGradesSummary.totalMissing} Incomplete {missingGradesSummary.totalMissing === 1 ? 'Grade' : 'Grades'} in {selectedTerm === 'all' ? 'All Terms' : (TERM_LABELS[selectedTerm] || selectedTerm.toUpperCase().replace('Q', 'TERM '))}
                                </span>
                                <span className="text-[10px] font-semibold underline ml-0.5 opacity-90">
                                    {showMissingOnly ? '(Showing Missing)' : '(Click to Filter)'}
                                </span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* TIER 3: Filter & Action Toolbar */}
            <div className="flex flex-wrap 2xl:flex-nowrap items-center justify-between gap-1.5 bg-white dark:bg-white/5 p-2 rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-white/10 no-print relative z-20 mb-4 mx-4 sm:mx-6">
                {/* LEFT: Dropdowns */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="relative w-36 sm:w-44 shrink-0">
                        <select
                            className="h-7.5 w-full appearance-none bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium py-0.5 pl-2.5 pr-6 rounded-md text-[11px] focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors cursor-pointer hover:bg-slate-50"
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                            <ChevronDown className="w-3 h-3" />
                        </div>
                    </div>

                    <div className="relative w-28 sm:w-32 shrink-0">
                        <select
                            className="h-7.5 w-full appearance-none bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium py-0.5 pl-2.5 pr-6 rounded-md text-[11px] focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors cursor-pointer hover:bg-slate-50"
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value as typeof selectedTerm)}
                        >
                            {Object.entries(TERM_LABELS).map(([value, label]) => {
                                const locked = isQuarterLocked(value);
                                return (
                                    <option key={value} value={value}>
                                        {label} {locked ? '🔒' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                            <ChevronDown className="w-3 h-3" />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 justify-end shrink-0">
                    {selectedSection && (
                        <div className="flex items-center gap-0.5 h-7.5 px-1 rounded-md bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded cursor-pointer"
                                title="Zoom Out"
                            >
                                <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[9.5px] font-black text-slate-700 dark:text-slate-200 w-8 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded cursor-pointer"
                                title="Zoom In"
                            >
                                <Plus className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    )}
                    {selectedSection && (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={toggleCrosshair}
                            className={`h-7.5 px-2 rounded-md border text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                                isCrosshairEnabled
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700/60 shadow-xs'
                                    : 'bg-white dark:bg-[#0B1121] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:text-slate-700'
                            }`}
                            title={isCrosshairEnabled ? 'Turn off Crosshair Guide' : 'Turn on Crosshair Guide'}
                        >
                            <Crosshair className={`w-3 h-3 ${isCrosshairEnabled ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                            <span>Guide</span>
                        </button>
                    )}
                    {selectedSection && isAdviser && selectedTerm !== 'all' && (
                        <>
                            <button
                                onClick={handleExportTemplate}
                                className="flex items-center gap-1 h-7.5 px-2 rounded-md bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all font-bold text-[9px] uppercase tracking-tight shadow-xs active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                                title="Download Template"
                            >
                                <FileSpreadsheet className="w-3 h-3 text-slate-400" />
                                <span className="hidden 2xl:inline">Template</span>
                            </button>

                            <div className="relative group shrink-0">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleImportGrades}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <button
                                    className="flex items-center gap-1 h-7.5 px-2 rounded-md bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all font-bold text-[9px] uppercase tracking-tight shadow-xs active:scale-95 group-hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                                    title="Import Grades from Excel"
                                >
                                    <Upload className="w-3 h-3 text-slate-400" />
                                    <span className="hidden 2xl:inline">Import</span>
                                </button>
                            </div>

                            <button
                                onClick={handleSyncFromEClass}
                                disabled={isSyncing}
                                className={`flex items-center gap-1 h-7.5 px-2 rounded-md transition-all font-bold text-[9px] uppercase tracking-tight shadow-xs border active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${
                                    isSyncing 
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10' 
                                    : 'bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                                title="Sync your teaching load subjects from E-Class Records (grades for other teachers' subjects are preserved)"
                            >
                                <RefreshCcw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span className="hidden 2xl:inline">Sync</span>
                            </button>

                            {hasCustomWidths && (
                                <button
                                    onClick={handleResetColumnWidths}
                                    className="flex items-center gap-1 h-7.5 px-2 rounded-md bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-bold text-[9px] uppercase tracking-tight shadow-xs active:scale-95 whitespace-nowrap shrink-0 cursor-pointer animate-in fade-in duration-150"
                                    title="Reset all column widths to default"
                                >
                                    <RotateCcw className="w-3 h-3 text-slate-500" />
                                    <span className="hidden 2xl:inline">Reset Widths</span>
                                </button>
                            )}

                            {/* Missing Grade Spotlight Filter */}
                            <label 
                                className={`flex items-center gap-1.5 h-7.5 px-2.5 rounded-md transition-all font-bold text-[9px] uppercase tracking-tight shadow-xs border cursor-pointer select-none shrink-0 ${
                                    showMissingOnly
                                        ? 'bg-amber-500 text-white border-amber-600 ring-1 ring-amber-400/40 shadow-amber-500/20'
                                        : 'bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                                title="Show students with missing grades only"
                            >
                                <input
                                    type="checkbox"
                                    checked={showMissingOnly}
                                    onChange={(e) => {
                                        setShowMissingOnly(e.target.checked);
                                        if (e.target.checked) setHighlightMissingGrades(true);
                                    }}
                                    className="w-3 h-3 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                                />
                                <span className="hidden xl:inline">Missing Grades Only</span>
                                <span className="xl:hidden">Missing Only</span>
                                {missingGradesSummary.studentsWithMissing.size > 0 && (
                                    <span className={`px-1 py-0.2 rounded-full text-[8.5px] font-black ${
                                        showMissingOnly
                                            ? 'bg-white text-amber-700'
                                            : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                                    }`}>
                                        {missingGradesSummary.studentsWithMissing.size}
                                    </span>
                                )}
                            </label>

                            {/* Highlight Missing Grades Toggle & Breakdown Popover */}
                            <div className="relative shrink-0">
                                <div className="inline-flex rounded-md shadow-xs">
                                    <button
                                        onClick={() => {
                                            setHighlightMissingGrades(prev => !prev);
                                            setShowMissingGradesPopover(false);
                                        }}
                                        className={`flex items-center gap-1 h-7.5 px-2 rounded-l-md transition-all font-bold text-[9px] uppercase tracking-tight active:scale-95 whitespace-nowrap shrink-0 cursor-pointer border ${
                                            highlightMissingGrades
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                        }`}
                                        title={highlightMissingGrades ? "Turn off Missing Grades highlight" : "Highlight all missing/unfilled grades"}
                                    >
                                        <AlertTriangle className={`w-3 h-3 ${highlightMissingGrades ? 'text-white animate-pulse' : 'text-amber-600 dark:text-amber-400'}`} />
                                        <span className="hidden 2xl:inline">Highlight</span>
                                        <span className={`px-1 py-0.2 rounded-full text-[8.5px] font-black ${
                                            highlightMissingGrades
                                                ? 'bg-white text-amber-700'
                                                : missingGradesSummary.totalMissing > 0
                                                    ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}>
                                            {missingGradesSummary.totalMissing}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setShowMissingGradesPopover(prev => !prev)}
                                        className={`h-7.5 px-1 rounded-r-md border-y border-r transition-all cursor-pointer ${
                                            highlightMissingGrades
                                                ? 'bg-amber-600 text-white border-amber-600'
                                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                        }`}
                                        title="View Missing Grades Summary by Subject"
                                    >
                                        <ChevronDown className="w-2.5 h-2.5" />
                                    </button>
                                </div>

                                {/* Popover Dropdown */}
                                {showMissingGradesPopover && (
                                    <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5">
                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                <span className="font-bold text-xs">Missing Grades</span>
                                            </div>
                                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                                                {missingGradesSummary.totalMissing} unfilled
                                            </span>
                                        </div>

                                        <div className="py-2 text-[11px] text-slate-500 dark:text-slate-400">
                                            {missingGradesSummary.totalMissing === 0 ? (
                                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold py-2 justify-center">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>All grades are complete!</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                    {missingGradesSummary.bySubject.map(item => (
                                                        <div key={item.subjectId} className="flex items-center justify-between text-[11px] py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-white/5">
                                                            <span className="font-medium truncate max-w-35" title={item.subjectName}>{item.subjectName}</span>
                                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40">
                                                                {item.missingCount} missing
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {missingGradesSummary.totalMissing > 0 && (
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => {
                                                            setShowMissingOnly(true);
                                                            setHighlightMissingGrades(true);
                                                            setShowMissingGradesPopover(false);
                                                        }}
                                                        className="flex-1 py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] text-center transition-colors cursor-pointer"
                                                    >
                                                        Spotlight Incomplete Rows
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setHighlightMissingGrades(true);
                                                            setShowMissingGradesPopover(false);
                                                            setTimeout(() => {
                                                                const el = document.querySelector('.is-missing input, input.is-missing') as HTMLInputElement;
                                                                if (el) {
                                                                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                                                                    el.focus();
                                                                }
                                                            }, 100);
                                                        }}
                                                        className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] text-center transition-colors cursor-pointer"
                                                    >
                                                        Jump
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setHighlightMissingGrades(!highlightMissingGrades);
                                                        setShowMissingGradesPopover(false);
                                                    }}
                                                    className="w-full py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                                                >
                                                    {highlightMissingGrades ? 'Unhighlight Cells' : 'Highlight Cells'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Term Lock Dropdown Button */}
                            <div className="relative shrink-0">
                                <button
                                    onClick={() => setIsLockPopoverOpen(prev => !prev)}
                                    className={`flex items-center gap-1 h-7.5 px-2 rounded-md transition-all font-bold text-[9px] uppercase tracking-tight shadow-xs border active:scale-95 whitespace-nowrap cursor-pointer ${
                                        lockedQuarters.length > 0
                                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/60'
                                            : 'bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50'
                                    }`}
                                    title="Lock or unlock term grades to prevent accidental modifications"
                                >
                                    <Lock className={`w-3 h-3 ${lockedQuarters.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                                    <span className="hidden 2xl:inline">Term Lock</span>
                                    {lockedQuarters.length > 0 && (
                                        <span className="px-1 py-0.2 rounded-full text-[8.5px] bg-rose-200 dark:bg-rose-900/60 font-black text-rose-900 dark:text-rose-100">
                                            {lockedQuarters.length}
                                        </span>
                                    )}
                                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                                </button>

                                {isLockPopoverOpen && (
                                    <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-bold text-[11px] text-slate-800 dark:text-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                                <span>Term Lock Controls</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsLockPopoverOpen(false)}
                                                className="p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 py-2 leading-relaxed">
                                            Locked terms disable manual editing and protect against sync/import overwrites.
                                        </p>

                                        <div className="space-y-1.5 py-1">
                                            {(['q1', 'q2', 'q3'] as const).map((qKey) => {
                                                const isLocked = lockedQuarters.includes(qKey);
                                                const qNum = qKey.replace('q', '');
                                                return (
                                                    <div key={qKey} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800">
                                                        <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200">
                                                            Term {qNum}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleQuarterLock(qKey)}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-black uppercase transition cursor-pointer ${
                                                                isLocked
                                                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-sm'
                                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                                                            }`}
                                                        >
                                                            {isLocked ? (
                                                                <>
                                                                    <Lock className="w-2.5 h-2.5" />
                                                                    <span>Locked</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Unlock className="w-2.5 h-2.5" />
                                                                    <span>Open</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleBatchLockQuarters(['q1', 'q2', 'q3'])}
                                                className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition text-center"
                                            >
                                                Lock All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleBatchLockQuarters([])}
                                                className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition text-center"
                                            >
                                                Unlock All
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Grade Sync Inspector Button */}
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('formease-open-grade-debugger', {
                                detail: {
                                    sectionId: sectionObj?.id || selectedSection,
                                    quarter: selectedTerm !== 'all' ? parseInt(selectedTerm.replace('q', '')) : 1
                                }
                            }));
                        }}
                        className="flex items-center gap-1 h-7.5 px-2 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all font-bold text-[9px] uppercase tracking-tight shadow-xs active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                        title="Open Grade Sync Inspector & Live Diagnostics"
                    >
                        <Bug className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span className="hidden 2xl:inline">Inspect</span>
                    </button>

                    {selectedSection && (
                        <>
                            <button
                                onClick={async () => {
                                    const termName = selectedTerm === 'all' ? 'All Terms' : (TERM_LABELS[selectedTerm as keyof typeof TERM_LABELS] || selectedTerm);
                                    const sectionName = sectionObj?.section_name || selectedSection;
                                    if (confirm(`Are you sure you want to clear entries for "${sectionName}" (${termName}) on this Summary Sheet?\n\nNOTE: This will only clear this summary sheet and will NEVER delete or modify any teacher E-Class Records.`)) {
                                        const studentLrns = sectionStudents.map(s => s.lrn);
                                        await useAppStore.getState().clearGradingSheet(
                                            sectionObj?.id || selectedSection,
                                            selectedTerm === 'all' ? undefined : parseInt(selectedTerm.replace('q', '')),
                                            activeSchoolYear,
                                            studentLrns
                                        );
                                    }
                                }}
                                className="flex items-center gap-1 h-7.5 px-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent transition-all font-bold text-[9px] uppercase tracking-tight active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                                title="Clear Summary Sheet for this Section"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span className="hidden 2xl:inline">Clear</span>
                            </button>

                            <button
                                onClick={handlePrintConsolidated}
                                className="flex items-center gap-1 h-7.5 px-2.5 rounded-md bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] hover:bg-slate-800 dark:hover:bg-slate-200 transition-all font-black text-[9px] uppercase tracking-tight shadow-xs active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                                <Printer className="w-3 h-3" />
                                <span>Print</span>
                            </button>

                            <button
                                onClick={handleDownloadConsolidated}
                                disabled={isDownloading}
                                className="flex items-center gap-1 h-7.5 px-2.5 rounded-md bg-green-600 dark:bg-green-500 text-white dark:text-white hover:bg-green-700 dark:hover:bg-green-600 transition-all font-black text-[9px] uppercase tracking-tight shadow-xs active:scale-95 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
                            >
                                <Download className="w-3 h-3" />
                                <span>{isDownloading ? '...' : 'Download'}</span>
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
                    <div className="w-full min-h-full flex overflow-x-auto py-2 bg-slate-100 dark:bg-slate-900/40 rounded-xl">
                        <div
                            ref={containerRef}
                            className="consolidated-zoom-shell origin-top flex flex-col gap-8 transition-all duration-300 m-auto"
                            style={{ transform: `scale(${zoom})`, width: 'fit-content' }}
                        >
                            {/* Spotlight Filter Active Alert Bar */}
                            {showMissingOnly && (
                                <div className="w-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-sm no-print">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <span className="font-semibold">
                                            Spotlight Filter Active: Showing {displayedMaleStudents.length + displayedFemaleStudents.length} learner(s) with missing grades out of {sectionStudents.length} total enrolled ({selectedTerm === 'all' ? 'All Terms' : (TERM_LABELS[selectedTerm] || selectedTerm.toUpperCase().replace('Q', 'TERM '))}).
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowMissingOnly(false)}
                                        className="px-3 py-1 bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                                    >
                                        Show All Students
                                    </button>
                                </div>
                            )}

                            {/* In-Situ Curriculum Health Check & Auto-Repair Banner */}
                            {selectedSection && subjectColumns.length === 0 && (
                                <div className="w-full max-w-2xl mx-auto my-8 p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 shadow-lg text-center no-print">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-black text-amber-950 dark:text-amber-100 mb-1">
                                        No Subjects Configured for {TERM_LABELS[selectedTerm as keyof typeof TERM_LABELS] || 'this term'}
                                    </h3>
                                    <p className="text-xs text-amber-800 dark:text-amber-300/80 mb-5 leading-relaxed max-w-lg mx-auto">
                                        <strong>{sectionObj?.section_grade_level} - {sectionObj?.section_name}</strong> currently has no subjects scheduled for <strong>{TERM_LABELS[selectedTerm as keyof typeof TERM_LABELS] || 'this term'}</strong>. You can automatically configure and repair this section with official DepEd subjects and terms in 1 click.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleAutoRepairSection}
                                        disabled={isAutoRepairing}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {isAutoRepairing ? 'Configuring DepEd Subjects...' : '✨ 1-Click Auto-Repair DepEd Curriculum'}
                                    </button>
                                </div>
                            )}

                            {/* Page 1: Male Table */}
                            <div
                                className="consolidated-sheet mx-auto bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-md border border-slate-200/80 mb-6 print:mb-0 print:border-none print:shadow-none transition-all duration-200"
                                style={{ width: `${sheetWidth}px`, minWidth: `${sheetWidth}px`, maxWidth: `${sheetWidth}px`, boxSizing: 'border-box' }}
                            >
                                {renderHeaderAndMetadata('MALE')}
                                {renderGradesTable(displayedMaleStudents, 0, 'MALE')}
                            </div>

                            {/* Page 2: Female Table */}
                            <div
                                className="consolidated-sheet mx-auto bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-md border border-slate-200/80 mb-6 print:mb-0 print:border-none print:shadow-none transition-all duration-200"
                                style={{ width: `${sheetWidth}px`, minWidth: `${sheetWidth}px`, maxWidth: `${sheetWidth}px`, boxSizing: 'border-box' }}
                            >
                                {renderHeaderAndMetadata('FEMALE')}
                                {renderGradesTable(displayedFemaleStudents, displayedMaleStudents.length, 'FEMALE')}
                            </div>

                            {/* Page 3: Summary Reports */}
                            {showDescriptor && (
                                <div
                                    className="consolidated-sheet mx-auto bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-md border border-slate-200/80 mb-6 print:mb-0 print:border-none print:shadow-none transition-all duration-200"
                                    style={{ width: `${sheetWidth}px`, minWidth: `${sheetWidth}px`, maxWidth: `${sheetWidth}px`, boxSizing: 'border-box' }}
                                >
                                    {renderHeaderAndMetadata('SUMMARY OF REPORTS')}
                                    
                                    <div className="flex flex-col gap-3 w-full no-print-break-inside text-[9px]">
                                        {/* Two Columns Layout */}
                                        <div className="mt-2 flex flex-col md:flex-row gap-6 items-start justify-start w-full print:break-inside-avoid" style={{ width: '100%', maxWidth: `${usableTableWidth}px` }}>
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

            {/* Quick Add Subject Column Modal */}
            {isAddSubjectModalOpen && sectionObj && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsAddSubjectModalOpen(false)}
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">Add Subject Column</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {sectionObj.section_name} &bull; {sectionObj.section_grade_level}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddSubjectModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Catalog Subject Search & Pick */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span>From School Catalog</span>
                                <span className="text-[11px] font-normal text-slate-400">({availableSubjectsToAdd.length} available)</span>
                            </div>
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search subjects..."
                                    value={addSubjectSearchQuery}
                                    onChange={(e) => setAddSubjectSearchQuery(e.target.value)}
                                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-xl p-1 space-y-1 bg-slate-50/50 dark:bg-slate-950/30">
                                {availableSubjectsToAdd.filter(s =>
                                    !addSubjectSearchQuery || s.subject_name.toLowerCase().includes(addSubjectSearchQuery.toLowerCase())
                                ).length === 0 ? (
                                    <div className="text-xs text-slate-400 p-3 text-center">
                                        {addSubjectSearchQuery ? 'No matching subjects found.' : 'All catalog subjects for this grade are already added!'}
                                    </div>
                                ) : (
                                    availableSubjectsToAdd
                                        .filter(s =>
                                            !addSubjectSearchQuery || s.subject_name.toLowerCase().includes(addSubjectSearchQuery.toLowerCase())
                                        )
                                        .map(subj => (
                                            <div
                                                key={subj.id}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition"
                                            >
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">
                                                    {subj.subject_name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleQuickAddSubject(subj.subject_name)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm cursor-pointer transition active:scale-95 shrink-0"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    <span>Add</span>
                                                </button>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>

                        {/* Custom Subject Input */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Or Add a Custom Subject
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g. Journalism, Robotics, etc."
                                    value={customSubjectName}
                                    onChange={(e) => setCustomSubjectName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && customSubjectName.trim()) {
                                            void handleQuickAddSubject(customSubjectName.trim());
                                        }
                                    }}
                                    className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    disabled={!customSubjectName.trim()}
                                    onClick={() => void handleQuickAddSubject(customSubjectName.trim())}
                                    className="px-3 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer transition active:scale-95 shrink-0"
                                >
                                    Add Custom
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
