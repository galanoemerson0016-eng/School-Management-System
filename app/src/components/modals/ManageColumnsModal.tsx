import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Columns3, X, ArrowUp, ArrowDown, Plus, Trash2, Eye, EyeOff, 
    RotateCcw, Save, Info
} from 'lucide-react';
import type { Section, Subject } from '../../types';
import { sortSubjects, normalizeSubjectName } from '../../lib/subjectConfig';
import { getDefaultTermForSubject } from '../../lib/curriculum';

interface ManageColumnsModalProps {
    isOpen: boolean;
    onClose: () => void;
    section: Section;
    allSubjects: Subject[];
    onSave: (
        updatedTaughtSubjects: string[], 
        hiddenSubjects: string[], 
        subjectTerms?: Record<string, 1 | 2 | 3 | 'all'>
    ) => Promise<void>;
}

export const ManageColumnsModal: React.FC<ManageColumnsModalProps> = ({
    isOpen,
    onClose,
    section,
    allSubjects,
    onSave
}) => {
    const [items, setItems] = useState<string[]>([]);
    const [hidden, setHidden] = useState<Set<string>>(new Set());
    const [selectedToAdd, setSelectedToAdd] = useState<string>('');
    const [customSubjectName, setCustomSubjectName] = useState<string>('');
    const [customSubjectTerm, setCustomSubjectTerm] = useState<1 | 2 | 3 | 'all'>(1);
    const [subjectTerms, setSubjectTerms] = useState<Record<string, 1 | 2 | 3 | 'all'>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirmSubject, setDeleteConfirmSubject] = useState<string | null>(null);

    const isSHS = useMemo(() => {
        const grade = section?.section_grade_level || '';
        return grade.includes('11') || grade.includes('12');
    }, [section?.section_grade_level]);

    // Initialize state from section when modal opens
    useEffect(() => {
        if (isOpen && section) {
            const rawTaught = section.taught_subjects || [];
            setItems([...rawTaught].filter(s => normalizeSubjectName(s) !== 'specialization'));

            const hiddenList = section.section_metadata?.hiddenConsolidatedSubjects || [];
            setHidden(new Set(hiddenList.map(h => normalizeSubjectName(h))));
            
            const existingTerms = section.section_metadata?.subjectTerms || {};
            setSubjectTerms({ ...existingTerms });

            setSelectedToAdd('');
            setCustomSubjectName('');
            setCustomSubjectTerm(1);
            setDeleteConfirmSubject(null);
        }
    }, [isOpen, section]);

    // Subjects in catalog for this grade that are not yet in items
    const availableToAdd = useMemo(() => {
        const currentNorms = new Set(items.map(s => normalizeSubjectName(s)));
        const gradeLevel = section.section_grade_level || '';

        const candidates = allSubjects.filter(s => 
            s.grade_level === gradeLevel &&
            !s.is_teaching_load &&
            normalizeSubjectName(s.subject_name) !== 'specialization' &&
            (!s.section_id || s.section_id === section.id)
        );

        const unique: { id: string; name: string }[] = [];
        const seen = new Set<string>();

        for (const s of candidates) {
            const norm = normalizeSubjectName(s.subject_name);
            if (norm === 'specialization') continue;
            if (!currentNorms.has(norm) && !seen.has(norm)) {
                seen.add(norm);
                unique.push({ id: s.id, name: s.subject_name });
            }
        }

        return unique.sort((a, b) => a.name.localeCompare(b.name));
    }, [allSubjects, section, items]);

    if (!isOpen) return null;

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        setItems(prev => {
            const next = [...prev];
            const temp = next[index - 1];
            next[index - 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    const handleMoveDown = (index: number) => {
        if (index >= items.length - 1) return;
        setItems(prev => {
            const next = [...prev];
            const temp = next[index + 1];
            next[index + 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    const handleToggleHide = (subjectName: string) => {
        const norm = normalizeSubjectName(subjectName);
        setHidden(prev => {
            const next = new Set(prev);
            if (next.has(norm)) {
                next.delete(norm);
            } else {
                next.add(norm);
            }
            return next;
        });
    };

    const handleRemove = (subjectName: string) => {
        setItems(prev => prev.filter(s => s !== subjectName));
        const norm = normalizeSubjectName(subjectName);
        setHidden(prev => {
            const next = new Set(prev);
            next.delete(norm);
            return next;
        });
        setDeleteConfirmSubject(null);
    };

    const handleAddSelected = () => {
        if (!selectedToAdd.trim()) return;
        if (normalizeSubjectName(selectedToAdd) === 'specialization') return;
        if (!items.includes(selectedToAdd)) {
            setItems(prev => [...prev, selectedToAdd]);
            const gradeNum = parseInt((section.section_grade_level || '12').replace(/\D/g, '')) || 12;
            const defTerm = getDefaultTermForSubject(selectedToAdd, gradeNum);
            setSubjectTerms(prev => ({
                ...prev,
                [selectedToAdd]: isSHS ? (defTerm === 'none' ? 1 : (defTerm || 1)) : 'all'
            }));
        }
        setSelectedToAdd('');
    };

    const handleAddCustom = () => {
        const trimmed = customSubjectName.trim();
        if (!trimmed) return;
        const norm = normalizeSubjectName(trimmed);
        if (norm === 'specialization') return;
        if (!items.some(s => normalizeSubjectName(s) === norm)) {
            setItems(prev => [...prev, trimmed]);
            setSubjectTerms(prev => ({
                ...prev,
                [trimmed]: isSHS ? customSubjectTerm : 'all'
            }));
        }
        setCustomSubjectName('');
    };

    const handleResetToDepEd = () => {
        const sorted = sortSubjects(items.filter(s => normalizeSubjectName(s) !== 'specialization'), s => s);
        setItems(sorted);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(
                items.filter(s => normalizeSubjectName(s) !== 'specialization'), 
                Array.from(hidden),
                subjectTerms
            );
            onClose();
        } catch (error) {
            console.error('Failed to save columns:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const activeCount = items.filter(s => !hidden.has(normalizeSubjectName(s))).length;
    const hiddenCount = items.filter(s => hidden.has(normalizeSubjectName(s))).length;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="relative w-full max-w-2xl bg-white dark:bg-[#0d1225] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-5 bg-deped-blue dark:bg-[#0f172a] text-white flex items-center justify-between shrink-0 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                <Columns3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black tracking-tight text-white">
                                    Manage Grade Sheet Columns
                                </h3>
                                <p className="text-[11px] font-medium text-blue-200/80">
                                    {section.section_name} • {section.section_grade_level}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Toolbar / Presets */}
                    <div className="px-6 py-3 bg-slate-50 dark:bg-white/5 border-b border-slate-200/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            <span>{activeCount} active column{activeCount !== 1 ? 's' : ''}</span>
                            {hiddenCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                                    {hiddenCount} hidden
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleResetToDepEd}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/20 text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                title="Restore official DepEd order (Filipino, English, Math, Science, AP, GMRC, TLE, MAPEH)"
                            >
                                <RotateCcw className="w-3 h-3 text-indigo-500" />
                                Reset to DepEd Order
                            </button>
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                        {/* Notice Banner */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl flex items-start gap-2.5 text-blue-900 dark:text-blue-200 text-xs">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                                Columns reflect this section's official curriculum. Use <strong>▲/▼</strong> to reorder. Click <strong>👁️</strong> to temporarily hide a column without losing any recorded student grades.
                            </div>
                        </div>

                        {/* Columns List */}
                        <div className="space-y-2">
                            {items.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-slate-500 text-xs">
                                    No subjects currently configured for this section. Use the dropdown below to add subjects.
                                </div>
                            ) : (
                                items.map((subjectName, index) => {
                                    const norm = normalizeSubjectName(subjectName);
                                    const isHidden = hidden.has(norm);
                                    const isConfirmingDelete = deleteConfirmSubject === subjectName;

                                    return (
                                        <div
                                            key={`${subjectName}-${index}`}
                                            className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                                                isHidden
                                                    ? 'bg-slate-50 dark:bg-white/5 border-dashed border-slate-200 dark:border-white/10 opacity-60'
                                                    : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 shadow-xs'
                                            }`}
                                        >
                                            {/* Left: Reorder & Number */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <div className="flex flex-col gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0}
                                                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                                        title="Move Up"
                                                    >
                                                        <ArrowUp className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === items.length - 1}
                                                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                                        title="Move Down"
                                                    >
                                                        <ArrowDown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <span className="w-6 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 tabular-nums">
                                                    #{index + 1}
                                                </span>
                                            </div>

                                            {/* Middle: Name and Badges */}
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold truncate ${isHidden ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                                                        {subjectName}
                                                    </span>
                                                    {isHidden && (
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-wider shrink-0">
                                                            Hidden
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Offering Term Badge / Switcher */}
                                                <div className="flex items-center gap-1.5">
                                                    {isSHS ? (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Term:</span>
                                                            {(['all', 1, 2, 3] as const).map(t => {
                                                                const gradeNum = parseInt((section.section_grade_level || '12').replace(/\D/g, '')) || 12;
                                                                const defTerm = getDefaultTermForSubject(subjectName, gradeNum);
                                                                const eff = subjectTerms[subjectName] ?? (defTerm === 'none' ? 1 : (defTerm || 1));
                                                                const isActive = eff === t;
                                                                return (
                                                                    <button
                                                                        key={t}
                                                                        type="button"
                                                                        onClick={() => setSubjectTerms(prev => ({ ...prev, [subjectName]: t }))}
                                                                        className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer ${
                                                                            isActive
                                                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                                                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20'
                                                                        }`}
                                                                        title={`Offer in ${t === 'all' ? 'All Terms' : `Term ${t}`}`}
                                                                    >
                                                                        {t === 'all' ? 'All' : `T${t}`}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/40">
                                                            All Terms (Full Year)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {/* Hide / Show Toggle */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleHide(subjectName)}
                                                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                                                        isHidden
                                                            ? 'bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100'
                                                    }`}
                                                    title={isHidden ? 'Click to Show Column' : 'Click to Hide Column (grades preserved)'}
                                                >
                                                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>

                                                {/* Delete / Remove */}
                                                {isConfirmingDelete ? (
                                                    <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 p-1 rounded-xl border border-red-200 dark:border-red-900/50">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemove(subjectName)}
                                                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteConfirmSubject(null)}
                                                            className="px-2 py-1 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteConfirmSubject(subjectName)}
                                                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                                                        title="Remove subject from this section"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Add Subject Section */}
                        <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-white/10 space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                                Add Subject to this Section
                            </label>

                            {/* Option 1: Pick from existing catalog */}
                            {availableToAdd.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedToAdd}
                                        onChange={(e) => setSelectedToAdd(e.target.value)}
                                        className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                                    >
                                        <option value="">Select subject from catalog ({availableToAdd.length} available)</option>
                                        {availableToAdd.map(subj => (
                                            <option key={subj.id} value={subj.name}>
                                                {subj.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddSelected}
                                        disabled={!selectedToAdd}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add
                                    </button>
                                </div>
                            )}

                            {/* Option 2: Custom Subject Name */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Or type custom subject name (e.g. Robotics, Journalism)..."
                                    value={customSubjectName}
                                    onChange={(e) => setCustomSubjectName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCustom();
                                        }
                                    }}
                                    className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                                {isSHS && (
                                    <select
                                        value={customSubjectTerm}
                                        onChange={(e) => {
                                            const val = e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2 | 3);
                                            setCustomSubjectTerm(val);
                                        }}
                                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                                    >
                                        <option value="1">Term 1</option>
                                        <option value="2">Term 2</option>
                                        <option value="3">Term 3</option>
                                        <option value="all">All Terms</option>
                                    </select>
                                )}
                                <button
                                    type="button"
                                    onClick={handleAddCustom}
                                    disabled={!customSubjectName.trim()}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Custom
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-deped-blue hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {isSaving ? 'Saving...' : 'Save Columns'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
