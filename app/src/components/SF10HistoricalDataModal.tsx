import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { X, Save, History, Trash2, Info, ChevronDown, Check, RotateCcw, Sparkles } from 'lucide-react';
import { useAppStore } from '../stores/app-store';
import { useSF10Store } from '../stores/sf10-store';
import type { SF10Version } from '../stores/sf10-store';
import type { Student, SchoolProfile } from '../types';
import { getSF10RowsForGrade, getSubjectsForGrade } from '../lib/subjectConfig';
import { isThreeTermSchoolYear } from '../lib/terms';
import { calculateQuarterlyFinalGrade, calculateWeightedGradeAverage } from '../services/grade-calculation';

interface SF10HistoricalDataModalProps {
    student: Student;
    schoolProfile: SchoolProfile;
    onClose: () => void;
}

interface GradeVal {
    q1?: string;
    q2?: string;
    q3?: string;
    q4?: string;
    finalRating?: string;
    remarks?: string;
    label?: string;
}

interface SubjectComboboxProps {
    value: string;
    defaultValue: string;
    isComponent: boolean;
    rowKey: string;
    rowIdx: number;
    totalRows: number;
    disabled?: boolean;
    options: { category: string; name: string }[];
    onChange: (newLabel: string) => void;
    onReset?: () => void;
}

function SubjectCombobox({
    value,
    defaultValue,
    isComponent,
    rowIdx,
    totalRows,
    disabled,
    options,
    onChange,
    onReset
}: SubjectComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const isCustomized = defaultValue !== '' && value !== defaultValue && value.trim() !== '';
    const isBlank = value.trim() === '';
    const openUpwards = rowIdx >= Math.max(5, totalRows - 5);

    // Filter options based on input text
    const filteredOptions = useMemo(() => {
        const query = value.trim().toLowerCase();
        if (!query) return options;
        return options.filter(opt => opt.name.toLowerCase().includes(query));
    }, [options, value]);

    // Group filtered options by category
    const grouped = useMemo(() => {
        const map = new Map<string, string[]>();
        filteredOptions.forEach(opt => {
            if (!map.has(opt.category)) {
                map.set(opt.category, []);
            }
            map.get(opt.category)!.push(opt.name);
        });
        return Array.from(map.entries());
    }, [filteredOptions]);

    return (
        <div ref={containerRef} className="relative w-full">
            <div className={`flex items-center gap-1.5 w-full rounded-xl transition-all ${isComponent ? 'pl-5' : ''}`}>
                <input
                    ref={inputRef}
                    type="text"
                    disabled={disabled}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={defaultValue ? defaultValue : "-- Reserved Blank Row --"}
                    className={`w-full bg-transparent px-2 py-1 text-xs font-bold outline-none border-b transition-colors ${
                        isBlank 
                            ? 'border-dashed border-slate-300 text-slate-400 italic placeholder:text-slate-300' 
                            : isCustomized
                                ? 'border-blue-400 text-blue-800 font-extrabold focus:border-blue-600'
                                : 'border-transparent hover:border-slate-300 focus:border-blue-500 text-slate-800'
                    }`}
                />

                {isComponent && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                        Component
                    </span>
                )}

                {isCustomized && onReset && (
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={onReset}
                        disabled={disabled}
                        title={`Reset to original "${defaultValue}"`}
                        className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors shrink-0 cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3" />
                    </button>
                )}

                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onClick={() => setIsOpen(prev => !prev)}
                    title="Choose from subjects list"
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div 
                    className={`absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden min-w-64 max-h-64 flex flex-col ${
                        openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                    }`}
                >
                    {/* Quick Action Buttons */}
                    <div className="p-1.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                            }}
                            className="flex-1 px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>🚫 Blank Reserved Row</span>
                        </button>
                        {defaultValue && defaultValue !== value && (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(defaultValue);
                                    setIsOpen(false);
                                }}
                                className="px-2 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset Default</span>
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
                        {grouped.length > 0 ? (
                            grouped.map(([category, items]) => (
                                <div key={category} className="mb-1.5 last:mb-0">
                                    <div className="px-2.5 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 rounded-md">
                                        {category}
                                    </div>
                                    <div className="space-y-0.5 mt-0.5">
                                        {items.map(name => {
                                            const isSelected = name.toLowerCase() === value.trim().toLowerCase();
                                            return (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => {
                                                        onChange(name);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                                                        isSelected 
                                                            ? 'bg-blue-600 text-white font-bold shadow-xs' 
                                                            : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                                                    }`}
                                                >
                                                    <span className="truncate">{name}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-center">
                                <p className="text-xs text-slate-500 font-medium">No predefined match.</p>
                                <p className="text-[10px] text-slate-400 mt-1">Press Tab to keep custom name "{value}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function SF10HistoricalDataModal({
    student,
    schoolProfile,
    onClose
}: SF10HistoricalDataModalProps) {
    const { overrides, setOverride, clearOverrides, history, restoreSnapshot } = useSF10Store();
    const gradeNum = parseInt(student.grade_level?.replace(/\D/g, '') || '0');
    const curriculumType: 'ES' | 'JHS' = gradeNum <= 6 ? 'ES' : 'JHS';
    
    // Determine which blocks to show based on curriculum type
    const availableBlocks = curriculumType === 'ES' ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10];
    const [selectedBlockGrade, setSelectedBlockGrade] = useState(availableBlocks[0]);

    const [unlockedBlockGrade, setUnlockedBlockGrade] = useState<number | null>(null);

    const isCurrentGrade = selectedBlockGrade === gradeNum;
    const isUnlocked = unlockedBlockGrade === selectedBlockGrade;
    const isLocked = isCurrentGrade && !isUnlocked;
    
    // Map block grade to index and page
    // For ES: G1-G4 -> Page 1 (Idx 0-3), G5-G6 -> Page 2 (Idx 4-5)
    // For JHS: G7-G8 -> Page 1 (Idx 0-1), G9-G10 -> Page 2 (Idx 2-3)
    const blockIdx = curriculumType === 'ES' ? (selectedBlockGrade - 1) : (selectedBlockGrade - 7);
    const pageNum = curriculumType === 'ES' ? (selectedBlockGrade <= 4 ? 1 : 2) : (selectedBlockGrade <= 8 ? 1 : 2);
    
    const overrideKey = `${student.lrn}_page_${pageNum}`;
    const currentOverrides = useMemo(() => overrides[overrideKey] || {}, [overrides, overrideKey]);

    const activeSchoolYear = useAppStore(state => state.activeSchoolYear);
    const currentSy = activeSchoolYear || '2026-2027';
    const currentSyMatch = currentSy.match(/(\d{4})/);
    const currentStartYear = currentSyMatch ? parseInt(currentSyMatch[1], 10) : 2026;
    const yearDiff = gradeNum - selectedBlockGrade;
    const inferredSy = `${currentStartYear - yearDiff}-${currentStartYear - yearDiff + 1}`;
    const blockSy = currentOverrides[`scholasticRecords[${blockIdx}].schoolYear`] || inferredSy;
    const is3Term = isThreeTermSchoolYear(blockSy);

    const getVal = useCallback((path: string) => currentOverrides[path] || '', [currentOverrides]);

    // Form state for block metadata derived directly from overrides
    const metadata = useMemo(() => ({
        schoolName: getVal(`scholasticRecords[${blockIdx}].schoolName`),
        schoolId: getVal(`scholasticRecords[${blockIdx}].schoolId`),
        district: getVal(`scholasticRecords[${blockIdx}].district`),
        division: getVal(`scholasticRecords[${blockIdx}].division`),
        region: getVal(`scholasticRecords[${blockIdx}].region`),
        section: getVal(`scholasticRecords[${blockIdx}].section`),
        schoolYear: getVal(`scholasticRecords[${blockIdx}].schoolYear`),
        adviserTeacher: getVal(`scholasticRecords[${blockIdx}].adviserTeacher`),
    }), [blockIdx, getVal]);

    // Subjects in school database
    const dbSubjects = useAppStore(state => state.subjects);

    // Curated subject options categorized for easy selection
    const availableSubjects = useMemo(() => {
        const list: { category: string; name: string }[] = [];
        
        // 1. DepEd Standard for this grade
        const standardForGrade = getSubjectsForGrade(selectedBlockGrade);
        standardForGrade.forEach(s => {
            if (s.name && !list.some(item => item.name.toLowerCase() === s.name.toLowerCase())) {
                list.push({ category: `DepEd Grade ${selectedBlockGrade} Standard`, name: s.name });
            }
        });

        // 2. Pre-MATATAG / 2016 K-12 subjects for JHS
        if (curriculumType === 'JHS') {
            const k12Subjects = [
                'Edukasyon sa Pagpapakatao (EsP)',
                'Music',
                'Arts',
                'Physical Education',
                'Health'
            ];
            k12Subjects.forEach(name => {
                if (!list.some(item => item.name.toLowerCase() === name.toLowerCase())) {
                    list.push({ category: 'DepEd 2016 K-12 Standard', name });
                }
            });
        }

        // 3. Database subjects matching this grade or marked as special program
        dbSubjects.forEach(s => {
            const matchesGrade = s.grade_level?.includes(String(selectedBlockGrade));
            if ((matchesGrade || s.is_special_program) && s.subject_name) {
                if (!list.some(item => item.name.toLowerCase() === s.subject_name.toLowerCase())) {
                    list.push({ category: 'School Database Subjects', name: s.subject_name });
                }
            }
        });

        // 4. Common TVE / Specialized Electives
        const tveElectives = [
            'ICT',
            'Computer Systems Servicing (CSS)',
            'Technical Drafting',
            'Home Economics',
            'Cookery',
            'Bread and Pastry Production',
            'Food and Beverage Services',
            'Beauty Care / Nail Care',
            'Dressmaking',
            'Agri-Fishery Arts',
            'Crop Production',
            'Animal Production',
            'Industrial Arts',
            'Electrical Installation & Maintenance (EIM)',
            'Shielded Metal Arc Welding (SMAW)',
            'Automotive Servicing',
            'Specialization I',
            'Specialization II',
            'Journalism',
            'Foreign Language (SPFL)',
            'Robotics'
        ];
        tveElectives.forEach(name => {
            if (!list.some(item => item.name.toLowerCase() === name.toLowerCase())) {
                list.push({ category: 'Specialized & TVE Electives', name });
            }
        });

        return list;
    }, [selectedBlockGrade, curriculumType, dbSubjects]);

    // Subjects for the selected grade
    const rows = useMemo(() => {
        const customCurriculum = schoolProfile.sf10_curriculum || schoolProfile.curriculum;
        const useOldCurriculum = curriculumType === 'JHS' && gradeNum >= 9 && selectedBlockGrade > 0 && selectedBlockGrade < gradeNum;
        const finalRows = getSF10RowsForGrade(selectedBlockGrade, customCurriculum, { useOldCurriculum });
        
        return finalRows;
    }, [selectedBlockGrade, schoolProfile, curriculumType, gradeNum]);

    const isComponentSubject = useCallback((rowKey: string, label?: string): boolean => {
        const norm = (label || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (norm === 'mapeh') return false;
        
        if (
            norm.includes('musicandarts') || 
            norm.includes('musicarts') || 
            norm.includes('peandhealth') || 
            norm.includes('pehealth') || 
            norm.includes('physicaleducationandhealth') ||
            norm === 'music' || 
            norm === 'arts' || 
            norm === 'physicaleducation' || 
            norm === 'health' || 
            norm === 'pe'
        ) {
            return true;
        }
        
        const targetRow = rows.find(r => r.key === rowKey);
        if (targetRow?.indent && targetRow?.key !== 'mapeh' && (!label || label === targetRow.label)) {
            return true;
        }
        return false;
    }, [rows]);

    // Load grades from overrides
    const grades = useMemo(() => {
        const newGrades: Record<string, GradeVal | string> = {};
        rows.forEach(row => {
            const base = `scholasticRecords[${blockIdx}].subjects.${row.key}`;
            const dotKey = `${base}.label`;
            const underKey = `scholasticRecords[${blockIdx}].subjects.${row.key}_label`;
            const hasOverride = (dotKey in currentOverrides) || (underKey in currentOverrides);
            const customLabel = hasOverride
                ? (currentOverrides[dotKey] !== undefined ? currentOverrides[dotKey] : currentOverrides[underKey])
                : undefined;
            const defaultLabel = row.key.startsWith('extra_') ? '' : row.label;

            newGrades[row.key] = {
                label: customLabel !== undefined ? customLabel : defaultLabel,
                q1: getVal(`${base}.q1`),
                q2: getVal(`${base}.q2`),
                q3: getVal(`${base}.q3`),
                q4: getVal(`${base}.q4`),
                finalRating: getVal(`${base}.finalRating`),
                remarks: getVal(`${base}.remarks`),
            };
        });
        // General Average
        newGrades['generalAverage'] = getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`);
        return newGrades;
    }, [blockIdx, currentOverrides, getVal, rows]);

    const recalcGeneralAverage = useCallback((currentGrades: Record<string, GradeVal | string>) => {
        const averageEntries: Array<{ grade: number; weight: number }> = [];
        
        Object.keys(currentGrades).forEach(key => {
            if (key === 'generalAverage') return;
            const gradeObj = currentGrades[key];
            if (typeof gradeObj === 'object' && gradeObj !== null) {
                const label = gradeObj.label;
                const hasValidLabel = label !== undefined ? label.trim() !== '' : !key.startsWith('extra_');
                const isComponentRow = isComponentSubject(key, label);
                const final = parseFloat(gradeObj.finalRating || '') || 0;
                
                if (final > 0 && !isComponentRow && hasValidLabel) {
                    averageEntries.push({ grade: final, weight: 1 });
                }
            }
        });

        const genAvg = calculateWeightedGradeAverage(averageEntries);
        if (genAvg !== null) {
            const roundedAverage = Math.round(genAvg);
            currentGrades['generalAverage'] = roundedAverage.toString();
            setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].subjects.generalAverage`, roundedAverage.toString());
        } else {
            currentGrades['generalAverage'] = '';
            setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].subjects.generalAverage`, '');
        }
    }, [blockIdx, isComponentSubject, pageNum, setOverride, student.lrn]);

    const handleMetadataChange = (field: string, value: string) => {
        setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].${field}`, value);
        
        // Auto-ensure grade level info is present
        setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].gradeLevel`, `Grade ${selectedBlockGrade}`);
        setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].gradeLevelNum`, String(selectedBlockGrade));
    };

    const handleLabelChange = useCallback((subjectKey: string, newLabel: string) => {
        const isBlank = newLabel.trim() === '' || newLabel === '-- Reserved Blank Row --';
        const finalLabel = isBlank ? '' : newLabel;

        setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].subjects.${subjectKey}.label`, finalLabel);
        setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].subjects.${subjectKey}_label`, finalLabel);

        const prevRow = (grades[subjectKey] as GradeVal) || {};
        const isComponentRow = isComponentSubject(subjectKey, finalLabel);

        const updatedRow: GradeVal = {
            ...prevRow,
            label: finalLabel
        };

        const base = `scholasticRecords[${blockIdx}].subjects.${subjectKey}`;

        if (isBlank) {
            updatedRow.q1 = '';
            updatedRow.q2 = '';
            updatedRow.q3 = '';
            updatedRow.q4 = '';
            updatedRow.finalRating = '';
            updatedRow.remarks = '';
            setOverride(student.lrn, `page_${pageNum}`, `${base}.q1`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.q2`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.q3`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.q4`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, '');
        } else if (isComponentRow) {
            updatedRow.finalRating = '';
            updatedRow.remarks = '';
            setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, '');
        } else {
            const q1 = parseFloat(updatedRow.q1 || '') || 0;
            const q2 = parseFloat(updatedRow.q2 || '') || 0;
            const q3 = parseFloat(updatedRow.q3 || '') || 0;
            const q4 = parseFloat(updatedRow.q4 || '') || 0;
            const requiredTerms = is3Term ? [1, 2, 3] : [1, 2, 3, 4];
            const finalResult = calculateQuarterlyFinalGrade([q1, q2, q3, q4], requiredTerms);
            if (finalResult.status !== 'missing') {
                const avg = finalResult.value;
                updatedRow.finalRating = avg.toString();
                updatedRow.remarks = avg >= 75 ? 'PASSED' : 'FAILED';
                setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, avg.toString());
                setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, updatedRow.remarks);
            } else {
                updatedRow.finalRating = '';
                updatedRow.remarks = '';
                setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, '');
                setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, '');
            }
        }

        const nextGrades = { ...grades, [subjectKey]: updatedRow };
        recalcGeneralAverage(nextGrades);
    }, [blockIdx, grades, is3Term, isComponentSubject, pageNum, recalcGeneralAverage, setOverride, student.lrn]);

    const handleGradeChange = (subjectKey: string, quarter: string, value: string) => {
        const currentGradeVal = typeof grades[subjectKey] === 'object' 
            ? (grades[subjectKey] as GradeVal) 
            : {};
        const subjectGrade: GradeVal = { ...currentGradeVal, [quarter]: value };

        // Auto-calculate Final Rating
        const q1 = parseFloat(subjectGrade.q1 || '') || 0;
        const q2 = parseFloat(subjectGrade.q2 || '') || 0;
        const q3 = parseFloat(subjectGrade.q3 || '') || 0;
        const q4 = parseFloat(subjectGrade.q4 || '') || 0;

        const requiredTerms = is3Term ? [1, 2, 3] : [1, 2, 3, 4];
        const finalResult = calculateQuarterlyFinalGrade([q1, q2, q3, q4], requiredTerms);
            
        const targetRow = rows.find(r => r.key === subjectKey);
        const label = subjectGrade.label !== undefined ? subjectGrade.label : (targetRow?.key.startsWith('extra_') ? '' : targetRow?.label || '');
        const hasLabel = (label?.trim() || '') !== '';
        const isComponent = isComponentSubject(subjectKey, label);

        const base = `scholasticRecords[${blockIdx}].subjects.${subjectKey}`;
        if (isComponent) {
            // MAPEH components should not have final rating or remarks in SF10
            subjectGrade.finalRating = '';
            subjectGrade.remarks = '';
            setOverride(student.lrn, `page_${pageNum}`, `${base}.${quarter}`, value);
            setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, '');
        } else if (finalResult.status !== 'missing' && hasLabel) {
            const avg = finalResult.value;
            subjectGrade.finalRating = avg.toString();
            subjectGrade.remarks = avg >= 75 ? 'PASSED' : 'FAILED';
            
            // Save to overrides
            setOverride(student.lrn, `page_${pageNum}`, `${base}.${quarter}`, value);
            setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, avg.toString());
            setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, subjectGrade.remarks);
        } else {
            // Clear everything if no grades are left or no label is present
            subjectGrade.finalRating = '';
            subjectGrade.remarks = '';
            setOverride(student.lrn, `page_${pageNum}`, `${base}.${quarter}`, value);
            setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, '');
        }

        const updatedGrades = { ...grades, [subjectKey]: subjectGrade };
        recalcGeneralAverage(updatedGrades);
    };

    // Batch Presets
    const applyMatatagPreset = useCallback(() => {
        let presetNames: string[] = [];
        if (curriculumType === 'JHS') {
            presetNames = [
                'Filipino',
                'English',
                'Mathematics',
                'Science',
                'Araling Panlipunan (AP)',
                'Values Education',
                'Technology and Livelihood Education (TLE)',
                'MAPEH',
                'Music and Arts',
                'Physical Education and Health',
                '', '', '', ''
            ];
        } else {
            const std = getSubjectsForGrade(selectedBlockGrade);
            presetNames = std.map(s => s.name);
        }
        rows.forEach((row, idx) => {
            const newName = presetNames[idx] ?? '';
            handleLabelChange(row.key, newName);
        });
    }, [curriculumType, handleLabelChange, rows, selectedBlockGrade]);

    const applyK12Preset = useCallback(() => {
        if (curriculumType !== 'JHS') return;
        const presetNames = [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Edukasyon sa Pagpapakatao (EsP)',
            'Technology and Livelihood Education (TLE)',
            'MAPEH',
            'Music',
            'Arts',
            'Physical Education',
            'Health',
            '', ''
        ];
        rows.forEach((row, idx) => {
            const newName = presetNames[idx] ?? '';
            handleLabelChange(row.key, newName);
        });
    }, [curriculumType, handleLabelChange, rows]);

    const resetAllRowLabels = useCallback(() => {
        rows.forEach((row) => {
            const defaultLabel = row.key.startsWith('extra_') ? '' : row.label;
            handleLabelChange(row.key, defaultLabel);
        });
    }, [handleLabelChange, rows]);

    const handleReset = () => {
        if (confirm(`Are you sure you want to reset Grade ${selectedBlockGrade} to system-computed data? All manual edits for this block will be cleared.`)) {
            clearOverrides(student.lrn, `page_${pageNum}`);
        }
    };

    const blockSnapshots = useMemo(() => {
        const key = `${student.lrn}_page_${pageNum}`;
        return (history[key] || []).sort((a, b) => b.timestamp - a.timestamp);
    }, [history, student.lrn, pageNum]);

    return (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manage Historical SF10 Data</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student.last_name}, {student.first_name} • {curriculumType === 'ES' ? 'Elementary' : 'Junior High'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto flex">
                    {/* Sidebar - Block Selection */}
                    <div className="w-64 bg-slate-50/50 border-r border-slate-100 p-6 space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Grade Levels</span>
                        {availableBlocks.map(g => (
                            <button
                                key={g}
                                onClick={() => setSelectedBlockGrade(g)}
                                className={`w-full px-4 py-3 rounded-2xl text-left font-bold transition-all flex items-center justify-between group ${selectedBlockGrade === g ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                            >
                                <span>Grade {g}</span>
                                {selectedBlockGrade === g && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                            </button>
                        ))}
                        
                        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase">Note</span>
                            </div>
                            <p className="text-[10px] text-blue-600/70 font-medium leading-relaxed">
                                Manual entries here will override system-computed grades for this block. Auto-computation is applied on entry.
                            </p>
                        </div>

                        {/* Snapshots / Version History */}
                        {blockSnapshots.length > 0 && (
                            <div className="mt-8 space-y-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Version History</span>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {blockSnapshots.map((snap: SF10Version) => (
                                        <div key={snap.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500">{new Date(snap.timestamp).toLocaleString()}</span>
                                                <button 
                                                    onClick={() => restoreSnapshot(student.lrn, `page_${pageNum}`, snap.id)}
                                                    className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-400 italic truncate">"{snap.label}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Form */}
                    <div className="flex-1 p-8 overflow-auto custom-scrollbar relative">
                        {isLocked && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col items-center gap-6 max-w-sm text-center">
                                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                                        <Info className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-2">Current Grade Protected</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                            This is the student's current grade level. Manual overrides are disabled to prevent data mismatch with the e-Class Record.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setUnlockedBlockGrade(selectedBlockGrade)}
                                        className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                                    >
                                        Unlock Manual Editing
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Information</span>
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-2 text-rose-500 hover:text-rose-600 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Reset Block to System Data</span>
                            </button>
                        </div>

                        {/* School Metadata Grid */}
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.schoolName}
                                    onChange={(e) => handleMetadataChange('schoolName', e.target.value)}
                                    placeholder="Enter school name"
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School ID</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-center"
                                    value={metadata.schoolId}
                                    onChange={(e) => handleMetadataChange('schoolId', e.target.value)}
                                    placeholder="ID"
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School Year</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-center"
                                    value={metadata.schoolYear}
                                    onChange={(e) => handleMetadataChange('schoolYear', e.target.value)}
                                    placeholder="YYYY-YYYY"
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.district}
                                    onChange={(e) => handleMetadataChange('district', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Division</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.division}
                                    onChange={(e) => handleMetadataChange('division', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Region</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.region}
                                    onChange={(e) => handleMetadataChange('region', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.section}
                                    onChange={(e) => handleMetadataChange('section', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adviser</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.adviserTeacher}
                                    onChange={(e) => handleMetadataChange('adviserTeacher', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                        </div>

                        {/* Learning Areas Header with Presets Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                                    Learning Areas & Ratings
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                                    (Click subject to choose or type custom name)
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                                    Presets:
                                </span>
                                <button
                                    type="button"
                                    onClick={applyMatatagPreset}
                                    disabled={isLocked}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-[9px] uppercase tracking-wider transition-all border border-blue-200 shadow-xs active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                                    title="Apply DepEd MATATAG (2024-Present) subject names"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    <span>MATATAG (2024)</span>
                                </button>
                                {curriculumType === 'JHS' && (
                                    <button
                                        type="button"
                                        onClick={applyK12Preset}
                                        disabled={isLocked}
                                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[9px] uppercase tracking-wider transition-all border border-indigo-200 shadow-xs active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                                        title="Apply 2016 K-12 subject names (with EsP & 4 MAPEH components)"
                                    >
                                        <span>2016 K-12 (EsP)</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={resetAllRowLabels}
                                    disabled={isLocked}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[9px] uppercase tracking-wider transition-all border border-slate-200 shadow-xs active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                                    title="Reset all subject names to curriculum defaults"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset Names</span>
                                </button>
                            </div>
                        </div>

                        {/* Grades Grid */}
                        <div className="bg-slate-50 rounded-4xl border border-slate-100 overflow-visible shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-900 text-white">
                                        <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-left border-r border-slate-700/50">Learning Areas</th>
                                        <th className="w-16 px-2 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">1</th>
                                        <th className="w-16 px-2 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">2</th>
                                        <th className="w-16 px-2 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">3</th>
                                        {!is3Term && <th className="w-16 px-2 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">4</th>}
                                        <th className="w-24 px-4 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">Final</th>
                                        <th className="w-32 px-6 py-4 font-black uppercase text-[10px] tracking-widest text-center">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {rows.map((row, rIdx) => {
                                        const rowGrade = grades[row.key] as GradeVal | undefined;
                                        const defaultLabel = row.key.startsWith('extra_') ? '' : row.label;
                                        const currentVal = rowGrade?.label !== undefined ? rowGrade.label : defaultLabel;
                                        const isComp = isComponentSubject(row.key, currentVal);

                                        return (
                                            <tr key={row.key} className="hover:bg-white transition-colors group">
                                                <td className="px-3 py-2 font-bold text-slate-700 border-r border-slate-200">
                                                    <SubjectCombobox
                                                        value={currentVal}
                                                        defaultValue={defaultLabel}
                                                        isComponent={isComp}
                                                        rowKey={row.key}
                                                        rowIdx={rIdx}
                                                        totalRows={rows.length}
                                                        disabled={isLocked}
                                                        options={availableSubjects}
                                                        onChange={(val) => handleLabelChange(row.key, val)}
                                                        onReset={() => handleLabelChange(row.key, defaultLabel)}
                                                    />
                                                </td>
                                                {['q1', 'q2', 'q3', ...(!is3Term ? ['q4'] : [])].map((q) => (
                                                    <td key={q} className="p-1.5 border-r border-slate-200 bg-slate-50/50 group-hover:bg-transparent transition-colors">
                                                        <input
                                                            type="text"
                                                            className="w-full h-10 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-xl text-center font-black text-slate-900 outline-none transition-all tabular-nums shadow-sm"
                                                            value={rowGrade?.[q as keyof GradeVal] || ''}
                                                            onChange={(e) => handleGradeChange(row.key, q, e.target.value)}
                                                            maxLength={3}
                                                            placeholder="-"
                                                            disabled={isLocked}
                                                        />
                                                    </td>
                                                ))}
                                                {(() => {
                                                    const isComponentRow = ['music', 'arts', 'physicalEducation', 'health', 'musicAndArts', 'peAndHealth', 'musicarts', 'pehealth'].includes(row.key) || (row.indent && row.key !== 'mapeh');
                                                    return (
                                                        <>
                                                            <td className="px-4 text-center border-r border-slate-200">
                                                                {!isComponentRow ? (
                                                                    <span className={`inline-block px-3 py-1 rounded-lg font-black tabular-nums ${parseFloat(rowGrade?.finalRating || '') > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                                        {(rowGrade?.label?.trim() !== '' || !row.key.startsWith('extra_')) ? (rowGrade?.finalRating || '--') : '--'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 font-medium">--</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 text-center">
                                                                {!isComponentRow ? (
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${rowGrade?.remarks === 'PASSED' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                        {(rowGrade?.label?.trim() !== '' || !row.key.startsWith('extra_')) ? (rowGrade?.remarks || '--') : '--'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 font-medium">--</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    );
                                                })()}
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-slate-900/5 font-black">
                                        <td className="px-6 py-6 text-right uppercase tracking-widest text-xs text-slate-500 border-r border-slate-200">General Average</td>
                                        <td colSpan={is3Term ? 3 : 4} className="border-r border-slate-200"></td>
                                        <td className="px-4 text-center border-r border-slate-200">
                                            <div className="w-full h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg">
                                                {(grades.generalAverage as string) || '--'}
                                            </div>
                                        </td>
                                        <td className="px-6 text-center">
                                            <span className={`text-xs font-black uppercase tracking-widest ${parseFloat((grades.generalAverage as string) || '0') >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {parseFloat((grades.generalAverage as string) || '0') >= 75 ? 'PROMOTED' : (parseFloat((grades.generalAverage as string) || '0') > 0 ? 'RETAINED' : '')}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                        Close
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                    >
                        <Save className="w-4 h-4" />
                        Finish Encoding
                    </button>
                </div>
            </div>
        </div>
    );
}
