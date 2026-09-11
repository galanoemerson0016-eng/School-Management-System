import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw, ArrowUp, ArrowDown, Sparkles, BookOpen, Layers, Save, Copy, Plus } from 'lucide-react';
import type { Subject, Section, SchoolProfile, CurriculumSubject } from '../../types';
import { normalizeSubjectName } from '../../lib/subjectConfig';

interface SF10LayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeGradeLevel: string | number;
    section?: Section;
    schoolProfile: SchoolProfile;
    dbSubjects: Subject[];
    onSaveGradeCurriculum: (gradeNum: number, subjects: CurriculumSubject[]) => Promise<void>;
    onSaveSectionSelections?: (selections: Record<number, string>) => Promise<void>;
}

import {
    getEducationLevel,
    getSubjectGroupsForLevel,
    filterDbSubjectsForLevel,
    ELEM_MATATAG_PRIMARY_PRESET,
    ELEM_MATATAG_INTERMEDIATE_PRESET,
    JHS_MATATAG_PRESET,
    JHS_OLD_K12_PRESET,
    JHS_TVE_PRESET,
    SHS_STEM_PRESET,
    SHS_ABM_PRESET,
    SHS_HUMSS_PRESET,
    type SF10EducationLevel
} from '../../lib/sf10Subjects';

export function SF10LayoutModal({
    isOpen,
    onClose,
    activeGradeLevel,
    section,
    schoolProfile,
    dbSubjects,
    onSaveGradeCurriculum,
    onSaveSectionSelections
}: SF10LayoutModalProps) {
    const rawGradeNum = parseInt(String(activeGradeLevel).replace(/\D/g, '')) || 7;
    const initialLevel = getEducationLevel(activeGradeLevel, 'jhs');
    const isES = initialLevel === 'elem';
    const isSHS = initialLevel === 'shs';
    const initialGrade = isES
        ? Math.max(1, Math.min(6, rawGradeNum || 1))
        : isSHS
        ? Math.max(11, Math.min(12, rawGradeNum || 11))
        : Math.max(7, Math.min(10, rawGradeNum || 7));

    const [selectedGrade, setSelectedGrade] = useState<number>(initialGrade);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const currentLevel: SF10EducationLevel = getEducationLevel(selectedGrade, initialLevel);
    const totalSlots = currentLevel === 'elem' ? 15 : (currentLevel === 'shs' ? 11 : 14);

    // Available grade tabs based on current level type
    const gradeTabs = useMemo(() => {
        if (isES) {
            return [1, 2, 3, 4, 5, 6];
        }
        if (isSHS) {
            return [11, 12];
        }
        return [7, 8, 9, 10];
    }, [isES, isSHS]);

    const optionGroups = useMemo(() => getSubjectGroupsForLevel(currentLevel), [currentLevel]);
    const allStandardForLevel = useMemo(() => optionGroups.flatMap(g => g.subjects), [optionGroups]);

    // School database subjects formatted with grade info if available, strictly filtered to currentLevel
    const dbCategorizedSubjects = useMemo(() => {
        const customDb = filterDbSubjectsForLevel(dbSubjects, currentLevel, allStandardForLevel);
        const seen = new Set<string>();
        const list: { id: string; name: string; displayName: string }[] = [];

        customDb
            .filter(s => s.term !== 'none' && Boolean(s.subject_name?.trim()))
            .forEach(s => {
                const name = s.subject_name.trim();
                const norm = normalizeSubjectName(name);
                if (!seen.has(norm)) {
                    seen.add(norm);
                    const gradeTag = s.grade_level ? ` (${s.grade_level})` : '';
                    list.push({
                        id: s.id,
                        name,
                        displayName: `${name}${gradeTag}`
                    });
                }
            });

        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [dbSubjects, currentLevel, allStandardForLevel]);

    // Set of all recognized subjects for the active level
    const knownSubjectNamesSet = useMemo(() => {
        const set = new Set<string>();
        allStandardForLevel.forEach(s => set.add(normalizeSubjectName(s)));
        dbCategorizedSubjects.forEach(s => set.add(normalizeSubjectName(s.name)));
        return set;
    }, [allStandardForLevel, dbCategorizedSubjects]);

    // Current slot configuration for the selected grade
    const [slots, setSlots] = useState<string[]>(() => Array(totalSlots).fill(''));

    // Load initial slots when tab changes or modal opens
    useEffect(() => {
        const effectiveCurriculum = schoolProfile.sf10_curriculum || schoolProfile.curriculum;
        const gradeKey = `grade_${selectedGrade}_subjects` as keyof typeof schoolProfile.curriculum;
        const customCurriculumList = effectiveCurriculum?.[gradeKey] as CurriculumSubject[] | undefined;

        // Check if current section has sf10SubjectSelections for this grade
        const sectionSelections = (selectedGrade === rawGradeNum)
            ? section?.section_metadata?.sf10SubjectSelections
            : undefined;

        const newSlots = Array(totalSlots).fill('');

        if (sectionSelections && Object.keys(sectionSelections).length > 0) {
            for (let i = 0; i < totalSlots; i++) {
                const subjId = sectionSelections[i];
                if (subjId && subjId !== 'none') {
                    const matchedDb = dbSubjects.find(s => s.id === subjId);
                    newSlots[i] = matchedDb?.subject_name || subjId;
                }
            }
        } else if (customCurriculumList && customCurriculumList.length > 0) {
            customCurriculumList.forEach((s, idx) => {
                if (idx < totalSlots) {
                    newSlots[idx] = s.name;
                }
            });
        } else {
            // Default presets based on educational level
            let defaultPreset: CurriculumSubject[] = [];
            if (currentLevel === 'elem') {
                defaultPreset = selectedGrade <= 3 ? ELEM_MATATAG_PRIMARY_PRESET : ELEM_MATATAG_INTERMEDIATE_PRESET;
            } else if (currentLevel === 'shs') {
                defaultPreset = SHS_STEM_PRESET;
            } else {
                defaultPreset = JHS_MATATAG_PRESET;
            }
            defaultPreset.forEach((s, idx) => {
                if (idx < totalSlots) {
                    newSlots[idx] = s.name;
                }
            });
        }

        setSlots(newSlots);
        setSaveSuccess(false);
    }, [selectedGrade, schoolProfile, section, rawGradeNum, totalSlots, dbSubjects, currentLevel]);

    // Apply standard preset
    const handleApplyPreset = (preset: CurriculumSubject[]) => {
        const newSlots = Array(totalSlots).fill('');
        preset.forEach((s, idx) => {
            if (idx < totalSlots) {
                newSlots[idx] = s.name;
            }
        });
        setSlots(newSlots);
    };

    // Copy layout from another grade
    const handleCopyFromGrade = (fromGrade: number) => {
        const effectiveCurriculum = schoolProfile.sf10_curriculum || schoolProfile.curriculum;
        const gradeKey = `grade_${fromGrade}_subjects` as keyof typeof schoolProfile.curriculum;
        const customCurriculumList = effectiveCurriculum?.[gradeKey] as CurriculumSubject[] | undefined;
        const newSlots = Array(totalSlots).fill('');

        if (customCurriculumList && customCurriculumList.length > 0) {
            customCurriculumList.forEach((s, idx) => {
                if (idx < totalSlots) {
                    newSlots[idx] = s.name;
                }
            });
        } else {
            let fallback: CurriculumSubject[] = [];
            if (fromGrade <= 3) fallback = ELEM_MATATAG_PRIMARY_PRESET;
            else if (fromGrade <= 6) fallback = ELEM_MATATAG_INTERMEDIATE_PRESET;
            else if (fromGrade >= 11) fallback = SHS_STEM_PRESET;
            else fallback = JHS_MATATAG_PRESET;
            fallback.forEach((s, idx) => {
                if (idx < totalSlots) {
                    newSlots[idx] = s.name;
                }
            });
        }
        setSlots(newSlots);
    };

    // Move slot up
    const handleMoveUp = (idx: number) => {
        if (idx === 0) return;
        setSlots(prev => {
            const next = [...prev];
            const temp = next[idx - 1];
            next[idx - 1] = next[idx];
            next[idx] = temp;
            return next;
        });
    };

    // Move slot down
    const handleMoveDown = (idx: number) => {
        if (idx === totalSlots - 1) return;
        setSlots(prev => {
            const next = [...prev];
            const temp = next[idx + 1];
            next[idx + 1] = next[idx];
            next[idx] = temp;
            return next;
        });
    };

    // Set slot value
    const handleSetSlot = (idx: number, value: string) => {
        setSlots(prev => {
            const next = [...prev];
            next[idx] = value === 'none' ? '' : value;
            return next;
        });
    };

    // Clear slot
    const handleClearSlot = (idx: number) => {
        setSlots(prev => {
            const next = [...prev];
            next[idx] = '';
            return next;
        });
    };

    // Insert blank slot at index and shift downwards
    const handleInsertBlank = (idx: number) => {
        setSlots(prev => {
            const next = [...prev];
            next.splice(idx, 0, '');
            return next.slice(0, totalSlots);
        });
    };

    // Save School-Wide for this Grade Level
    const handleSaveSchoolWide = async () => {
        setIsSaving(true);
        try {
            const activeSubjects: CurriculumSubject[] = slots
                .filter(name => Boolean(name && name.trim()))
                .map(name => {
                    const norm = normalizeSubjectName(name);
                    const isMapehComp = norm.includes('music') || norm.includes('arts') || norm.includes('pe') || norm.includes('health');
                    return {
                        name: name.trim(),
                        code: isMapehComp && norm !== 'mapeh' ? 'MAPEH' : ''
                    };
                });

            await onSaveGradeCurriculum(selectedGrade, activeSubjects);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
        } finally {
            setIsSaving(false);
        }
    };

    // Save Section-Specific (if viewing the section's grade level)
    const handleSaveSectionSpecific = async () => {
        if (!onSaveSectionSelections || !section) return;
        setIsSaving(true);
        try {
            const selectionsRecord: Record<number, string> = {};
            slots.forEach((name, idx) => {
                if (name && name.trim()) {
                    // Match to database subject ID if available, or store name
                    const matchedDb = dbSubjects.find(s => normalizeSubjectName(s.subject_name) === normalizeSubjectName(name));
                    selectionsRecord[idx] = matchedDb?.id || name.trim();
                } else {
                    selectionsRecord[idx] = 'none';
                }
            });

            await onSaveSectionSelections(selectionsRecord);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                    SF10 Subject Layout & Customizer
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Choose any subject from categorized lists or type custom titles to personalize row arrangement.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Grade Level Tabs & Presets Bar */}
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 px-8 py-2.5 bg-slate-50/30 dark:bg-slate-800/30 shrink-0 gap-2">
                        {/* Tabs */}
                        <div className="flex gap-1.5">
                            {gradeTabs.map(g => (
                                <button
                                    key={g}
                                    onClick={() => setSelectedGrade(g)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        selectedGrade === g
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    Grade {g}
                                    {g === rawGradeNum && (
                                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-md bg-white/20 uppercase">Active</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Presets & Copy Tools */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mr-0.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" /> Presets:
                            </span>
                            {currentLevel === 'elem' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset(ELEM_MATATAG_PRIMARY_PRESET)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer"
                                        title="DepEd MATATAG Primary Preset (Grades 1-3)"
                                    >
                                        MATATAG Primary (G1-3)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset(ELEM_MATATAG_INTERMEDIATE_PRESET)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all cursor-pointer"
                                        title="DepEd MATATAG Intermediate Preset (Grades 4-6)"
                                    >
                                        MATATAG Interm (G4-6)
                                    </button>
                                </>
                            ) : currentLevel === 'shs' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset(SHS_STEM_PRESET)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all cursor-pointer"
                                        title="Senior High School STEM Strand"
                                    >
                                        STEM Strand
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset(SHS_ABM_PRESET)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer"
                                        title="Senior High School ABM Strand"
                                    >
                                        ABM Strand
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset(SHS_HUMSS_PRESET)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all cursor-pointer"
                                        title="Senior High School HUMSS Strand"
                                    >
                                        HUMSS Strand
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset(JHS_MATATAG_PRESET)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer"
                                        title="Official DepEd MATATAG curriculum (Values Ed, Music & Arts, PE & Health)"
                                    >
                                        MATATAG (2024)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset(JHS_OLD_K12_PRESET)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all cursor-pointer"
                                        title="Pre-MATATAG K-12 curriculum (EsP, separate Music, Arts, PE, Health)"
                                    >
                                        Old K-12 (2016)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset(JHS_TVE_PRESET)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all cursor-pointer"
                                        title="Tech-Voc Track preset with Cookery, CSS, and Specializations"
                                    >
                                        TVE Track
                                    </button>
                                </>
                            )}

                            {/* Clone/Copy from another grade */}
                            <div className="relative group ml-1 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700">
                                <Copy className="w-3 h-3 text-slate-500 shrink-0" />
                                <select
                                    defaultValue=""
                                    onChange={(e) => {
                                        const g = parseInt(e.target.value);
                                        if (g) handleCopyFromGrade(g);
                                        e.target.value = '';
                                    }}
                                    className="text-[10px] font-black uppercase tracking-wider bg-transparent text-slate-600 dark:text-slate-300 border-none focus:outline-none cursor-pointer"
                                    title="Clone subject arrangement from another grade"
                                >
                                    <option value="" disabled>Copy from Grade...</option>
                                    {gradeTabs.filter(g => g !== selectedGrade).map(g => (
                                        <option key={g} value={g}>Grade {g}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSlots(Array(totalSlots).fill(''))}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer ml-1"
                                title="Clear all slots to blank"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Slots Grid */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Customize the <strong>{totalSlots} official SF10 rows</strong> for <strong>Grade {selectedGrade}</strong>. Choose from the categorized dropdown, or directly type custom learning areas in the rows.
                            </p>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                {slots.filter(s => Boolean(s && s.trim())).length} of {totalSlots} Assigned
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {slots.map((subjectName, idx) => {
                                const norm = normalizeSubjectName(subjectName);
                                const isMapehComp = norm.includes('music') ||
                                                    norm.includes('arts') ||
                                                    norm.includes('pe') ||
                                                    norm.includes('health');
                                const isMapehHeader = norm === 'mapeh';
                                const isKnown = knownSubjectNamesSet.has(norm);

                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all ${
                                            subjectName
                                                ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 shadow-2xs'
                                                : 'bg-slate-50/20 dark:bg-slate-800/10 border-dashed border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        {/* Slot Number */}
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                            subjectName
                                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                            {idx + 1}
                                        </div>

                                        {/* Subject Input & Dropdown Combo */}
                                        <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                            {/* Editable Text Input */}
                                            <input
                                                type="text"
                                                value={subjectName}
                                                onChange={(e) => handleSetSlot(idx, e.target.value)}
                                                placeholder="-- Reserved Blank Row --"
                                                className={`flex-1 min-w-0 bg-transparent text-xs font-bold focus:outline-none border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 py-1 transition-all ${
                                                    subjectName
                                                        ? isMapehHeader
                                                            ? 'text-blue-700 dark:text-blue-300 font-black'
                                                            : isMapehComp
                                                            ? 'text-slate-700 dark:text-slate-200 italic pl-1.5'
                                                            : 'text-slate-800 dark:text-white'
                                                        : 'text-slate-400 italic placeholder:text-slate-300 dark:placeholder:text-slate-600'
                                                }`}
                                            />

                                            {/* Categorized Dropdown Selector */}
                                            <div className="shrink-0">
                                                <select
                                                    value={isKnown ? subjectName : (subjectName ? 'custom' : 'none')}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'none') {
                                                            handleClearSlot(idx);
                                                        } else if (val !== 'custom') {
                                                            handleSetSlot(idx, val);
                                                        }
                                                    }}
                                                    className="w-24 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer truncate"
                                                    title="Select from categorized subjects"
                                                >
                                                    <option value="none">-- Blank --</option>
                                                    {subjectName && !isKnown && (
                                                        <option value="custom">Custom: {subjectName}</option>
                                                    )}
                                                    {optionGroups.map(group => (
                                                        <optgroup key={group.label} label={group.label}>
                                                            {group.subjects.map(name => (
                                                                <option key={`${group.label}_${name}`} value={name}>{name}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                    {dbCategorizedSubjects.length > 0 && (
                                                        <optgroup label={`🏫 School Database Subjects (${currentLevel.toUpperCase()})`}>
                                                            {dbCategorizedSubjects.map(s => (
                                                                <option key={`db_${s.id}`} value={s.name}>{s.displayName}</option>
                                                            ))}
                                                        </optgroup>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleInsertBlank(idx)}
                                                className="w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all"
                                                title="Insert blank row above"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                            {subjectName && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleClearSlot(idx)}
                                                    className="w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer transition-all"
                                                    title="Clear this slot"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleMoveUp(idx)}
                                                disabled={idx === 0}
                                                className="w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer transition-all"
                                                title="Move row up"
                                            >
                                                <ArrowUp className="w-3 h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveDown(idx)}
                                                disabled={idx === totalSlots - 1}
                                                className="w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer transition-all"
                                                title="Move row down"
                                            >
                                                <ArrowDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <div className="flex items-center gap-2">
                            {saveSuccess && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Subject Layout Saved Successfully!</span>
                                </motion.div>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                Close
                            </button>

                            {/* Section-only option if on active section's grade */}
                            {section && selectedGrade === rawGradeNum && onSaveSectionSelections && (
                                <button
                                    type="button"
                                    onClick={handleSaveSectionSpecific}
                                    disabled={isSaving}
                                    className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                                    title={`Apply this subject arrangement only to ${section.section_name}`}
                                >
                                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Save for Section Only</span>
                                </button>
                            )}

                            {/* School-Wide Grade Level Option */}
                            <button
                                type="button"
                                onClick={handleSaveSchoolWide}
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                                title={`Apply this subject arrangement across all Grade ${selectedGrade} SF10 records`}
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save for Grade {selectedGrade} (School-Wide)</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
