import React, { useState, useMemo, useEffect } from 'react';
import {
    X,
    Search,
    RotateCcw,
    Save,
    Check,
    Shield,
    TableProperties,
    BookOpen,
    Filter,
    AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import type { Subject } from '../../types';
import { isSubjectAllowedForProgram } from '../../lib/curriculum';

interface TeachingLoadMatrixModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TeachingLoadMatrixModal: React.FC<TeachingLoadMatrixModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { sections, subjects, updateSection, showNotification } = useAppStore();

    const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyAdvisory, setOnlyAdvisory] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Local draft state: sectionId -> string[] of teaching subject names
    const [draftAssignments, setDraftAssignments] = useState<Record<string, string[]>>({});

    // Initialize draftAssignments whenever modal opens or sections change
    useEffect(() => {
        if (!isOpen) return;
        const initial: Record<string, string[]> = {};
        sections.forEach(sec => {
            initial[sec.id] = [...(sec.teaching_subjects || [])];
        });
        setDraftAssignments(initial);
    }, [isOpen, sections]);

    // Available grade levels present across sections
    const availableGradeLevels = useMemo(() => {
        const set = new Set<string>();
        sections.forEach(s => {
            if (s.section_grade_level) set.add(s.section_grade_level);
        });
        return Array.from(set).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });
    }, [sections]);

    // Filter sections based on grade, advisory flag, and search term
    const visibleSections = useMemo(() => {
        return sections.filter(sec => {
            if (selectedGradeFilter !== 'all' && sec.section_grade_level !== selectedGradeFilter) {
                return false;
            }
            if (onlyAdvisory && !sec.is_advisory) {
                return false;
            }
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase();
                const matchName = sec.section_name.toLowerCase().includes(q);
                const matchGrade = sec.section_grade_level.toLowerCase().includes(q);
                if (!matchName && !matchGrade) return false;
            }
            return true;
        }).sort((a, b) => {
            const numA = parseInt(a.section_grade_level.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.section_grade_level.replace(/\D/g, '')) || 0;
            if (numA !== numB) return numA - numB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, selectedGradeFilter, onlyAdvisory, searchTerm]);

    // Distinct subjects relevant to visible sections
    const relevantSubjects = useMemo(() => {
        // Collect candidate subjects from the subjects store
        const visibleGradeSet = new Set(visibleSections.map(s => s.section_grade_level.toLowerCase().trim()));
        
        const map = new Map<string, Subject>();
        subjects.forEach(subj => {
            const subjGrade = subj.grade_level?.toLowerCase().trim() || '';
            // If filter is active, only show subjects matching visible grade levels
            if (selectedGradeFilter !== 'all' && subjGrade && !visibleGradeSet.has(subjGrade)) {
                return;
            }
            // Skip sub-components like individual Music / Arts if they have parent MAPEH
            if (subj.is_component) return;

            const normName = subj.subject_name.trim();
            if (!map.has(normName)) {
                map.set(normName, subj);
            }
        });

        // Also include any subjects that might already be assigned in visible sections
        visibleSections.forEach(sec => {
            const assigned = draftAssignments[sec.id] || [];
            assigned.forEach(subjName => {
                if (!map.has(subjName)) {
                    map.set(subjName, {
                        id: `custom_${subjName}`,
                        subject_name: subjName,
                        grade_level: sec.section_grade_level
                    });
                }
            });
        });

        return Array.from(map.values()).sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    }, [subjects, visibleSections, selectedGradeFilter, draftAssignments]);

    // Check which sections have changes compared to store
    const modifiedSectionIds = useMemo(() => {
        const modified: string[] = [];
        sections.forEach(sec => {
            const original = (sec.teaching_subjects || []).slice().sort();
            const draft = (draftAssignments[sec.id] || []).slice().sort();
            if (original.length !== draft.length || original.some((val, idx) => val !== draft[idx])) {
                modified.push(sec.id);
            }
        });
        return modified;
    }, [sections, draftAssignments]);

    // Toggle cell
    const toggleSubjectForSection = (sectionId: string, subjectName: string) => {
        setDraftAssignments(prev => {
            const current = prev[sectionId] || [];
            const exists = current.includes(subjectName);
            const updated = exists
                ? current.filter(name => name !== subjectName)
                : [...current, subjectName];
            return { ...prev, [sectionId]: updated };
        });
    };

    // Toggle whole row (section)
    const selectAllForSection = (sectionId: string) => {
        const sec = sections.find(s => s.id === sectionId);
        setDraftAssignments(prev => {
            const allowedNames = relevantSubjects
                .filter(s => {
                    if (!sec) return true;
                    return isSubjectAllowedForProgram(s.subject_name, sec.section_grade_level, sec.program);
                })
                .map(s => s.subject_name);
            return { ...prev, [sectionId]: allowedNames };
        });
    };

    const clearAllForSection = (sectionId: string) => {
        setDraftAssignments(prev => {
            return { ...prev, [sectionId]: [] };
        });
    };

    // Toggle whole column (subject across visible sections)
    const toggleSubjectForAllVisible = (subjectName: string) => {
        const allChecked = visibleSections.every(sec => (draftAssignments[sec.id] || []).includes(subjectName));
        setDraftAssignments(prev => {
            const next = { ...prev };
            visibleSections.forEach(sec => {
                const current = next[sec.id] || [];
                if (allChecked) {
                    next[sec.id] = current.filter(n => n !== subjectName);
                } else {
                    if (!current.includes(subjectName)) {
                        next[sec.id] = [...current, subjectName];
                    }
                }
            });
            return next;
        });
    };

    // Reset draft
    const handleReset = () => {
        const initial: Record<string, string[]> = {};
        sections.forEach(sec => {
            initial[sec.id] = [...(sec.teaching_subjects || [])];
        });
        setDraftAssignments(initial);
    };

    // Save changes
    const handleSave = async () => {
        if (modifiedSectionIds.length === 0) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            for (const sectionId of modifiedSectionIds) {
                const sec = sections.find(s => s.id === sectionId);
                if (!sec) continue;
                const updated = draftAssignments[sectionId] || [];
                const isTeaching = updated.length > 0;
                await updateSection({
                    ...sec,
                    teaching_subjects: updated,
                    is_teaching_load: sec.is_advisory ? isTeaching : true
                });
            }
            showNotification(`Successfully updated teaching load for ${modifiedSectionIds.length} section(s)!`, 'success');
            onClose();
        } catch (err: unknown) {
            console.error('Failed to save teaching load matrix:', err);
            showNotification('Failed to save some teaching loads. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                            <TableProperties className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                Teaching Load Assignment Matrix
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Configure your personal teaching subjects across all sections on one centralized grid.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Grade Level Dropdown */}
                        <div className="flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedGradeFilter}
                                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Grade Levels ({sections.length} sections)</option>
                                {availableGradeLevels.map(gl => (
                                    <option key={gl} value={gl}>{gl}</option>
                                ))}
                            </select>
                        </div>

                        {/* Advisory Only Filter */}
                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer select-none text-slate-700 dark:text-slate-300 font-medium">
                            <input
                                type="checkbox"
                                checked={onlyAdvisory}
                                onChange={(e) => setOnlyAdvisory(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Advisory Sections Only</span>
                        </label>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter sections..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Matrix Table */}
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    {visibleSections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                            <AlertCircle className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
                            <p className="font-semibold text-sm">No sections match the current filters.</p>
                            <p className="text-xs mt-1">Try selecting 'All Grade Levels' or clearing the search.</p>
                        </div>
                    ) : relevantSubjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                            <BookOpen className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
                            <p className="font-semibold text-sm">No subjects registered for this grade level.</p>
                            <p className="text-xs mt-1">Add subjects in Subject Library first.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse text-left text-xs">
                            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs">
                                <tr>
                                    {/* Sticky First Column Header */}
                                    <th className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 p-2.5 min-w-60 font-black uppercase tracking-wider text-[11px]">
                                        Section Name & Actions
                                    </th>

                                    {/* Subject Headers */}
                                    {relevantSubjects.map(subj => {
                                        const isAllChecked = visibleSections.every(sec => (draftAssignments[sec.id] || []).includes(subj.subject_name));
                                        return (
                                            <th
                                                key={subj.subject_name}
                                                className="border-b border-r border-slate-200 dark:border-slate-700 p-2 text-center min-w-30 max-w-35 font-bold text-[10.5px] uppercase tracking-wider"
                                                title={subj.subject_name}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="truncate max-w-30">{subj.subject_name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSubjectForAllVisible(subj.subject_name)}
                                                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition cursor-pointer"
                                                        title={`Toggle ${subj.subject_name} for all visible sections`}
                                                    >
                                                        {isAllChecked ? 'Clear All' : 'Set All'}
                                                    </button>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {visibleSections.map(sec => {
                                    const assigned = draftAssignments[sec.id] || [];
                                    const isModified = modifiedSectionIds.includes(sec.id);

                                    return (
                                        <tr
                                            key={sec.id}
                                            className={`hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-colors ${
                                                isModified ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                                            }`}
                                        >
                                            {/* Sticky Section Row Label */}
                                            <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                                                            <span>{sec.section_name}</span>
                                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                                {sec.section_grade_level}
                                                            </span>
                                                            {sec.is_advisory && (
                                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                                                                    <Shield className="w-2.5 h-2.5" />
                                                                    ADV
                                                                </span>
                                                            )}
                                                            {isModified && (
                                                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Has unsaved changes" />
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                            {assigned.length} assigned subject{assigned.length === 1 ? '' : 's'}
                                                        </div>
                                                    </div>

                                                    {/* Quick Row Buttons */}
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => selectAllForSection(sec.id)}
                                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                                                            title="Select all subjects for this section"
                                                        >
                                                            All
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => clearAllForSection(sec.id)}
                                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 cursor-pointer"
                                                            title="Clear all subjects for this section"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Matrix Subject Cells */}
                                            {relevantSubjects.map(subj => {
                                                const isChecked = assigned.includes(subj.subject_name);

                                                return (
                                                    <td
                                                        key={`${sec.id}-${subj.subject_name}`}
                                                        onClick={() => toggleSubjectForSection(sec.id, subj.subject_name)}
                                                        className={`border-r border-slate-100 dark:border-slate-800/80 p-2 text-center cursor-pointer select-none transition-all ${
                                                            isChecked
                                                                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                                                                : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-300 dark:text-slate-600'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-center">
                                                            {isChecked ? (
                                                                <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                                                    <Check className="w-3.5 h-3.5 stroke-3" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 hover:border-indigo-400 transition" />
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                            Showing {visibleSections.length} section(s) & {relevantSubjects.length} subject(s)
                        </span>
                        {modifiedSectionIds.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold text-[10px]">
                                {modifiedSectionIds.length} modified
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {modifiedSectionIds.length > 0 && (
                            <button
                                onClick={handleReset}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Changes</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || modifiedSectionIds.length === 0}
                            className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer transition"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSaving ? 'Saving...' : `Save Changes (${modifiedSectionIds.length})`}</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
