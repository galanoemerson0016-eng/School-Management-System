import React, { useState, useMemo } from 'react';
import { X, Search, Users, HelpCircle, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import type { Section, Subject } from '../../types';
import { getClassSizeLimit, isGrade11CoreSubject, resolveSubjectOfferedTerms } from '../../lib/curriculum';
import { normalizeSubjectName } from '../../lib/subjectConfig';
import { generateUUID } from '../../utils/idGenerator';

interface SubjectEnrollmentModalProps {
    open: boolean;
    subject: Subject | null;
    /** The teaching/advisory section currently being managed, when known. */
    section?: Section | null;
    onClose: () => void;
    /** Lets the calling E-Class switch to a newly-created section offering. */
    onSubjectSaved?: (subject: Subject) => void;
}

export function SubjectEnrollmentModal({ open, subject, section, onClose, onSubjectSaved }: SubjectEnrollmentModalProps) {
    const { students, sections, subjects, addSubject, updateSubject, showNotification } = useAppStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllGradeStudents, setShowAllGradeStudents] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Track selections in local state first, initialized when subject opens
    const [selectedLrns, setSelectedLrns] = useState<string[]>([]);

    // Get the section name from a known page context or section_id.
    const parentSection = useMemo(() => {
        if (!subject) return null;
        return section || sections.find(s => s.id === subject.section_id || s.section_name === subject.section_id) || null;
    }, [section, sections, subject]);

    // When a generic library definition was selected, prefer an existing
    // section-owned offering with the same name.  Library definitions must not
    // own a section's learner roster.
    const enrollmentSubject = useMemo(() => {
        if (!subject || !parentSection) return subject;
        if (subject.section_id === parentSection.id) return subject;
        const name = normalizeSubjectName(subject.subject_name);
        return subjects.find(s =>
            s.section_id === parentSection.id &&
            normalizeSubjectName(s.subject_name) === name
        ) || subject;
    }, [subject, parentSection, subjects]);

    const sectionName = parentSection ? parentSection.section_name : (subject?.section_id || 'Unknown Section');

    // `undefined` is deliberately the compact representation for "all
    // learners in this section".  Show that truthfully in the dialog so an
    // adviser cannot accidentally turn an all-class subject into an empty one
    // by opening and saving without selecting anyone.
    const defaultSectionLrns = useMemo(() => {
        if (!enrollmentSubject) return [];
        return students
            .filter(student =>
                student.grade_level === enrollmentSubject.grade_level &&
                (student.student_section === sectionName || student.student_section === parentSection?.id || student.student_section === enrollmentSubject.section_id)
            )
            .map(student => student.lrn);
    }, [students, enrollmentSubject, sectionName, parentSection]);

    // Initialize selected LRNs when modal opens.
    React.useEffect(() => {
        if (open && enrollmentSubject) {
            setSelectedLrns(enrollmentSubject.enrolled_student_lrns ?? defaultSectionLrns);
            setSearchQuery('');
            setShowAllGradeStudents(false);
        }
    }, [open, enrollmentSubject, defaultSectionLrns]);

    // DO 017 Table 7 Class Size Compliance info
    const classSizeInfo = useMemo(() => {
        if (!enrollmentSubject) return { maxStudents: 40, category: 'core' as const, categoryLabel: 'Standard Class Size' };
        return getClassSizeLimit(enrollmentSubject.subject_name, enrollmentSubject.grade_level);
    }, [enrollmentSubject]);

    const isExceedingClassSize = selectedLrns.length > classSizeInfo.maxStudents;

    // Filter students based on selection (either this section or the entire grade level)
    const eligibleStudents = useMemo(() => {
        if (!enrollmentSubject) return [];
        return students.filter(student => {
            // Check grade level match
            const matchesGrade = student.grade_level === enrollmentSubject.grade_level;
            if (!matchesGrade) return false;

            if (showAllGradeStudents) {
                return true;
            } else {
                // Only students in the specific advisory section
                return student.student_section === sectionName || student.student_section === parentSection?.id || student.student_section === enrollmentSubject.section_id;
            }
        });
    }, [students, enrollmentSubject, sectionName, parentSection, showAllGradeStudents]);

    // Apply search query filter
    const filteredStudents = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return eligibleStudents;

        return eligibleStudents.filter(student => {
            const fullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.toLowerCase();
            return fullName.includes(query) || (student.lrn && student.lrn.includes(query));
        });
    }, [eligibleStudents, searchQuery]);

    // Separate into Male and Female to align with DepEd conventions
    const males = useMemo(() => {
        return filteredStudents.filter(s => s.gender === 'Male').sort((a, b) => a.last_name.localeCompare(b.last_name));
    }, [filteredStudents]);

    const females = useMemo(() => {
        return filteredStudents.filter(s => s.gender === 'Female').sort((a, b) => a.last_name.localeCompare(b.last_name));
    }, [filteredStudents]);

    const handleToggleStudent = (lrn: string) => {
        setSelectedLrns(prev => 
            prev.includes(lrn) ? prev.filter(l => l !== lrn) : [...prev, lrn]
        );
    };

    const handleSelectAllFiltered = () => {
        const filteredLrns = filteredStudents.map(s => s.lrn);
        setSelectedLrns(prev => {
            const union = new Set([...prev, ...filteredLrns]);
            return Array.from(union);
        });
    };

    const handleDeselectAllFiltered = () => {
        const filteredLrns = new Set(filteredStudents.map(s => s.lrn));
        setSelectedLrns(prev => prev.filter(lrn => !filteredLrns.has(lrn)));
    };

    const handleSave = async () => {
        if (!enrollmentSubject) return;
        setIsSaving(true);
        try {
            // A generic Subject Library definition cannot hold a section's
            // roster.  Materialize it as a section-owned offering on first
            // use, retaining its grading configuration as the template.
            const isSectionOwned = Boolean(parentSection && enrollmentSubject.section_id === parentSection.id);
            const updatedSubject: Subject = {
                ...enrollmentSubject,
                id: isSectionOwned ? enrollmentSubject.id : generateUUID(),
                section_id: parentSection?.id || enrollmentSubject.section_id,
                enrolled_student_lrns: selectedLrns
            };

            if (isSectionOwned) {
                await updateSubject(updatedSubject);
            } else {
                await addSubject(updatedSubject);
            }

            // Grade 11 SSHS cores are shared by everyone.  For elective
            // offerings, a learner may belong to only one elective that runs
            // in the same term within this section.  Remove newly selected
            // learners from any competing section-owned elective; no subject
            // or grades are deleted.
            let adjustedOfferings = 0;
            const isGrade11 = (parentSection?.section_grade_level || updatedSubject.grade_level || '').includes('11');
            const targetTerms = parentSection
                ? resolveSubjectOfferedTerms(updatedSubject, parentSection)
                : [];
            if (parentSection && isGrade11 && !isGrade11CoreSubject(updatedSubject.subject_name) && targetTerms.length > 0) {
                const sectionLearnerLrns = students
                    .filter(s => s.student_section === parentSection.section_name || s.student_section === parentSection.id)
                    .map(s => s.lrn);
                const selected = new Set(selectedLrns);
                const offeredNames = new Set((parentSection.taught_subjects || []).map(normalizeSubjectName));
                const candidates = [...subjects, ...(isSectionOwned ? [] : [updatedSubject])].filter(other => {
                    if (other.id === updatedSubject.id || other.section_id !== parentSection.id) return false;
                    if (isGrade11CoreSubject(other.subject_name)) return false;
                    if (offeredNames.size > 0 && !offeredNames.has(normalizeSubjectName(other.subject_name))) return false;
                    return resolveSubjectOfferedTerms(other, parentSection).some(term => targetTerms.includes(term));
                });

                for (const other of candidates) {
                    const currentRoster = other.enrolled_student_lrns === undefined
                        ? sectionLearnerLrns
                        : other.enrolled_student_lrns;
                    const nextRoster = currentRoster.filter(lrn => !selected.has(lrn));
                    if (nextRoster.length !== currentRoster.length) {
                        await updateSubject({ ...other, enrolled_student_lrns: nextRoster });
                        adjustedOfferings++;
                    }
                }
            }

            onSubjectSaved?.(updatedSubject);
            showNotification(
                adjustedOfferings > 0
                    ? `Enrollment saved. Learners were removed from ${adjustedOfferings} competing elective offering${adjustedOfferings === 1 ? '' : 's'} in the same term.`
                    : 'Subject enrollment updated successfully',
                'success'
            );
            onClose();
        } catch (error) {
            console.error('Error saving subject enrollment:', error);
            showNotification('Failed to update subject enrollment', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!open || !subject || !enrollmentSubject) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-3xl bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-deped-blue/10 dark:bg-white/5 text-deped-blue dark:text-white animate-pulse">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                                Manage Subject Enrollment
                            </h3>
                            <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                {enrollmentSubject.subject_name} — {enrollmentSubject.grade_level} • {sectionName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Sub-header / Filters */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {/* Search Input */}
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search student name or LRN..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-900/50 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-deped-blue focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Cross-Section Toggle */}
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showAllGradeStudents}
                                onChange={(e) => setShowAllGradeStudents(e.target.checked)}
                                className="rounded text-deped-blue focus:ring-deped-blue border-slate-300 dark:border-white/10 dark:bg-slate-900 w-4 h-4 cursor-pointer"
                            />
                            <span>Allow Cross-Section Enrollment (Show all {enrollmentSubject.grade_level} learners)</span>
                        </label>
                    </div>

                    {/* Quick Selection Actions */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="text-slate-500 font-medium">
                            Enrolled: <span className={`font-black ${isExceedingClassSize ? 'text-amber-600 dark:text-amber-400' : 'text-deped-blue dark:text-indigo-400'}`}>{selectedLrns.length}</span> / {classSizeInfo.maxStudents} learners ({sectionName})
                            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-350 font-bold">
                                {classSizeInfo.categoryLabel}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSelectAllFiltered}
                                className="font-extrabold text-deped-blue dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                                Select All Filtered
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                                onClick={handleDeselectAllFiltered}
                                className="font-extrabold text-rose-600 dark:text-rose-450 hover:underline cursor-pointer"
                            >
                                Deselect All Filtered
                            </button>
                        </div>
                    </div>

                    {/* Table 7 Advisory Banner */}
                    {isExceedingClassSize && (
                        <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 animate-in fade-in duration-150">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>
                                <strong>Class Size Advisory (DO 017 Table 7):</strong> Enrolled learners ({selectedLrns.length}) exceed the prescribed maximum of {classSizeInfo.maxStudents} learners per class.
                            </span>
                        </div>
                    )}
                </div>

                {/* Student Checkbox List */}
                <div className="flex-1 p-6 overflow-y-auto max-h-[45vh] custom-scrollbar space-y-6">
                    {filteredStudents.length === 0 ? (
                        <div className="py-12 text-center">
                            <HelpCircle className="h-10 w-10 text-slate-350 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500">No students matched the criteria.</p>
                            <p className="text-xs text-slate-450 mt-1">Try resetting the search or allowing cross-section enrollment.</p>
                        </div>
                    ) : (
                        <>
                            {/* Males Section */}
                            {males.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                                        Male ({males.length})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {males.map(student => {
                                            const isChecked = selectedLrns.includes(student.lrn);
                                            return (
                                                <div
                                                    key={student.lrn}
                                                    onClick={() => handleToggleStudent(student.lrn)}
                                                    className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer select-none transition-all ${
                                                        isChecked 
                                                            ? 'border-deped-blue bg-deped-blue/5 dark:border-indigo-500 dark:bg-indigo-550/10 shadow-sm' 
                                                            : 'border-slate-150 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/2'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isChecked ? (
                                                            <CheckSquare className="h-5 w-5 text-deped-blue dark:text-indigo-400 shrink-0" />
                                                        ) : (
                                                            <Square className="h-5 w-5 text-slate-350 shrink-0" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-750 dark:text-slate-200 truncate">
                                                                {student.last_name}, {student.first_name} {student.middle_name ? `${student.middle_name[0]}.` : ''}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-medium">
                                                                LRN: {student.lrn} {showAllGradeStudents && `• ${student.student_section}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Females Section */}
                            {females.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                                        Female ({females.length})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {females.map(student => {
                                            const isChecked = selectedLrns.includes(student.lrn);
                                            return (
                                                <div
                                                    key={student.lrn}
                                                    onClick={() => handleToggleStudent(student.lrn)}
                                                    className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer select-none transition-all ${
                                                        isChecked 
                                                            ? 'border-deped-blue bg-deped-blue/5 dark:border-indigo-500 dark:bg-indigo-550/10 shadow-sm' 
                                                            : 'border-slate-150 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/2'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isChecked ? (
                                                            <CheckSquare className="h-5 w-5 text-deped-blue dark:text-indigo-400 shrink-0" />
                                                        ) : (
                                                            <Square className="h-5 w-5 text-slate-350 shrink-0" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-750 dark:text-slate-200 truncate">
                                                                {student.last_name}, {student.first_name} {student.middle_name ? `${student.middle_name[0]}.` : ''}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-medium">
                                                                LRN: {student.lrn} {showAllGradeStudents && `• ${student.student_section}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3 bg-slate-50/30 dark:bg-white/1">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2 text-sm font-bold text-white bg-deped-blue hover:bg-deped-blue/90 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
