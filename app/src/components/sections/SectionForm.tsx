import { useState, useEffect, useMemo } from 'react';
import { useAppStore, useAuthStore } from '../../stores';
import type { Section } from '../../types';
import { STANDARD_SUBJECTS, SPECIAL_SUBJECTS, type GradeLevel } from '../../lib/curriculum';
import { motion } from 'framer-motion';
import { X, Save, Shield, BookOpen, AlertCircle } from 'lucide-react';

interface SectionFormProps {
    section: Section | null;
    onClose: () => void;
}

const GRADE_LEVELS = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12'
];

const normalizeSubjectLabel = (value: string) =>
    value.toLowerCase().replace(/\s+/g, ' ').replace(/\s*\([^)]*\)/g, '').trim();

export function SectionForm({ section, onClose }: SectionFormProps) {
    const { sections, addSection, updateSection, subjects, addSubject, schoolProfile, updateSchoolProfile, showNotification } = useAppStore();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Initial default name logic
    const getDefaultTeacherName = () => {
        return schoolProfile?.adviser_name || user?.displayName || '';
    };

    const [formData, setFormData] = useState<Partial<Section>>({
        id: '',
        section_name: '',
        section_grade_level: 'Grade 7',
        adviser_id: user?.uid || '',
        adviser_name: getDefaultTeacherName(),
        subject_name: '',
        taught_subjects: [],
        is_teaching_load: false,
        is_advisory: false // Default to false, will be set in useEffect
    });

    // Handle initial role defaults for NEW sections
    useEffect(() => {
        if (!section) {
            const hasExistingAdvisory = sections.some(s => s.is_advisory ?? !s.is_teaching_load);
            setFormData(prev => ({
                ...prev,
                is_advisory: !hasExistingAdvisory,
                is_teaching_load: hasExistingAdvisory
            }));
        }
    }, [sections, section]);

    // Update adviser_name automatically if it's generic/empty and profile details appear
    useEffect(() => {
        const currentName = formData.adviser_name || '';
        const isGeneric = currentName.toLowerCase() === 'admin' || currentName === '';
        
        if (isGeneric && schoolProfile?.adviser_name) {
            setFormData(prev => ({ 
                ...prev, 
                adviser_name: schoolProfile.adviser_name
            }));
        }
    }, [schoolProfile, formData.adviser_name]);

    const availableSubjects = useMemo(() => {
        const grade = formData.section_grade_level as GradeLevel;
        const currentSectionId = section?.id || formData.id;

        // The Subjects Hub is the Source of Truth.
        // We only show subjects that exist in the hub for this grade.
        // This includes:
        // 1. Grade-level templates (no section_id)
        // 2. Subjects already assigned to this specific section
        const hubSubjects = subjects.filter(s => 
            s.grade_level === grade && 
            !s.is_teaching_load
        );

        // Map to the format expected by the UI and ensure uniqueness by name
        const uniqueList: { name: string; code: string }[] = [];
        const seenNames = new Set<string>();

        const addToList = (name: string, code: string) => {
            const normalized = normalizeSubjectLabel(name);
            if (!seenNames.has(normalized)) {
                seenNames.add(normalized);
                uniqueList.push({ name, code });
            }
        };

        hubSubjects.forEach(s => addToList(s.subject_name, s.subject_code || ''));

        // FALLBACK: If the Subject Hub is empty for this grade, pull from the standard curriculum templates
        if (uniqueList.length === 0) {
            const standard = STANDARD_SUBJECTS[grade] || [];
            standard.forEach(s => addToList(s.name, s.code || ''));
        }

        // Sort them according to standard DepEd order if possible, otherwise alphabetical
        const standardOrder = [
            'Language', 'Reading and Literacy', 'Filipino', 'English', 
            'Mathematics', 'Science', 'Araling Panlipunan (AP)', 
            'GMRC (Good Manners and Right Conduct)', 'Values Education',
            'Makabansa', 'E.P.P.', 'Technology and Livelihood Education (TLE)', 
            'Music and Arts', 'Physical Education and Health', 'Specialization'
        ];

        return uniqueList
            .filter(a => normalizeSubjectLabel(a.name) !== 'mapeh')
            .sort((a, b) => {
                const indexA = standardOrder.findIndex(name => normalizeSubjectLabel(name) === normalizeSubjectLabel(a.name));
                const indexB = standardOrder.findIndex(name => normalizeSubjectLabel(name) === normalizeSubjectLabel(a.name)); // Fixed potential typo in original
                
                // Note: The original code had a bug where it compared name to a.name instead of b.name in indexB calculation
                const indexB_fixed = standardOrder.findIndex(name => normalizeSubjectLabel(name) === normalizeSubjectLabel(b.name));

                if (indexA !== -1 && indexB_fixed !== -1) return indexA - indexB_fixed;
                if (indexA !== -1) return -1;
                if (indexB_fixed !== -1) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [formData.id, formData.section_grade_level, section?.id, subjects]);

    const handleAdvisoryChange = (checked: boolean) => {
        if (checked) {
            // Check if any other section is already an advisory class
            // We use the legacy logic: if is_advisory is missing, it's an advisory class IF it's not a teaching load
            const existingAdvisory = sections.find(s => {
                const effectiveIsAdvisory = s.is_advisory ?? !s.is_teaching_load;
                return effectiveIsAdvisory && s.id !== section?.id;
            });

            if (existingAdvisory) {
                showNotification(`Role Conflict: ${existingAdvisory.section_grade_level} - ${existingAdvisory.section_name} is already your Advisory Class. You can only have ONE advisory class.`, 'error');
                return;
            }
        }
        setFormData({ ...formData, is_advisory: checked });
    };

    const toggleSubject = (subjectName: string) => {
        const current = formData.taught_subjects || [];
        if (current.includes(subjectName)) {
            setFormData({ ...formData, taught_subjects: current.filter(s => s !== subjectName) });
        } else {
            setFormData({ ...formData, taught_subjects: [...current, subjectName] });
        }
    };

    useEffect(() => {
        if (section) {
            const profileName = (schoolProfile?.adviser_name || '').trim();
            const isGenericProfile = profileName.toLowerCase() === 'admin' || profileName === '';
            
            // Legacy Migration: If is_advisory is undefined, infer it
            setFormData({
                ...section,
                // Force update adviser name if profile name is set and current one is a placeholder or generic
                adviser_name: (!isGenericProfile && profileName) ? profileName : (section.adviser_name || ''),
                is_advisory: section.is_advisory ?? !section.is_teaching_load,
                taught_subjects: section.taught_subjects || (section.subject_name ? [section.subject_name] : [])
            });
        }
    }, [section, schoolProfile?.adviser_name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.section_name || !formData.section_grade_level) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        // Final validation for advisory
        if (formData.is_advisory) {
            const existingAdvisory = sections.find(s => {
                const effectiveIsAdvisory = s.is_advisory ?? !s.is_teaching_load;
                return effectiveIsAdvisory && s.id !== section?.id;
            });
            if (existingAdvisory) {
                showNotification(`Cannot save: ${existingAdvisory.section_name} is already your Advisory Class.`, 'error');
                setIsLoading(false);
                return;
            }
        }

        try {
            const validSubjectNames = new Set(availableSubjects.map(s => s.name));
            const sectionData: Section = {
                id: formData.id || `section_${Date.now()}`,
                section_name: formData.section_name!,
                section_grade_level: formData.section_grade_level!,
                adviser_id: formData.adviser_id || '',
                adviser_name: formData.adviser_name || '',
                subject_name: formData.subject_name,
                taught_subjects: formData.is_teaching_load 
                    ? (formData.taught_subjects || []).filter(s => validSubjectNames.has(s))
                    : [],
                is_teaching_load: !!formData.is_teaching_load,
                is_advisory: !!formData.is_advisory
            };

            const sectionId = sectionData.id!;

            if (section) {
                await updateSection(sectionData);
                showNotification('Section updated successfully.', 'success');
            } else {
                await addSection(sectionData);
                showNotification('Section created successfully.', 'success');
            }

            // Sync with Institute Profile if this is the Advisory Class
            if (sectionData.is_advisory) {
                await updateSchoolProfile({
                    ...schoolProfile!,
                    grade_level: sectionData.section_grade_level,
                    section: sectionData.section_name
                });
            } else if (section && (section.is_advisory ?? !section.is_teaching_load)) {
                // If it WAS an advisory class but is now NOT, clear the profile fields
                await updateSchoolProfile({
                    ...schoolProfile!,
                    grade_level: '',
                    section: ''
                });
            }

            onClose();
        } catch (error) {
            console.error('Failed to save section:', error);
            showNotification('Failed to save section.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
            >
                {/* Header */}
                <div className="bg-deped-blue p-8 text-white relative shrink-0">
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-2xl font-black tracking-tight mb-1">
                        {section ? 'Edit Section' : 'Create New Section'}
                    </h3>
                    <p className="text-blue-200/60 font-bold uppercase tracking-widest text-[9px]">
                        {section ? `Modifying ${section.section_name}` : (formData.is_advisory ? 'Setup your official advisory class' : 'Add a section for your teaching load')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-5">
                        {/* Grade Level First */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Grade Level *</label>
                            <select 
                                required
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                value={formData.section_grade_level}
                                onChange={(e) => setFormData({ ...formData, section_grade_level: e.target.value })}
                            >
                                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        {/* Section Name Second */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Section Name *</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. Einstein"
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none"
                                value={formData.section_name}
                                onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                            />
                        </div>

                        {/* ROLE CONFIGURATION */}
                        <div className="col-span-2 bg-slate-50/50 rounded-2.5xl p-5 border border-slate-100">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Role Configuration</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Advisory Role */}
                                <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${formData.is_advisory ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.is_advisory ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-xs font-black ${formData.is_advisory ? 'text-indigo-900' : 'text-slate-600'}`}>Advisory</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase">Class Adviser</div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" 
                                        checked={formData.is_advisory}
                                        onChange={(e) => handleAdvisoryChange(e.target.checked)}
                                    />
                                </label>

                                {/* Teaching Role */}
                                <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${formData.is_teaching_load ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.is_teaching_load ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-slate-100 text-slate-400'}`}>
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-xs font-black ${formData.is_teaching_load ? 'text-amber-900' : 'text-slate-600'}`}>Teaching</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase">Subject Teacher</div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-2 border-slate-200 text-amber-500 focus:ring-amber-500 transition-all cursor-pointer" 
                                        checked={formData.is_teaching_load}
                                        onChange={(e) => setFormData({ ...formData, is_teaching_load: e.target.checked })}
                                    />
                                </label>
                            </div>

                            {/* SUBJECT SELECTION GRID */}
                            {formData.is_teaching_load && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-6 border-t border-slate-100 pt-6"
                                >
                                    <label className="block text-[9px] font-black text-amber-500 uppercase tracking-widest mb-4 ml-1">
                                        Subjects Taught ({formData.taught_subjects?.length || 0})
                                    </label>
                                    
                                    {availableSubjects.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {availableSubjects.map((subj) => (
                                                <div 
                                                    key={subj.name}
                                                    onClick={() => toggleSubject(subj.name)}
                                                    className={`group p-2.5 ps-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2.5 ${formData.taught_subjects?.includes(subj.name) ? 'bg-white border-amber-400 shadow-sm' : 'bg-white/50 border-slate-100 hover:border-amber-200'}`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded border-2 transition-all ${formData.taught_subjects?.includes(subj.name) ? 'bg-amber-500 border-amber-500' : 'border-slate-200 group-hover:border-amber-400'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-tight ${formData.taught_subjects?.includes(subj.name) ? 'text-amber-600' : 'text-slate-500'}`}>
                                                        {subj.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-slate-400 italic">No standard subjects found.</p>
                                    )}
                                    
                                    {/* Manual Subject Fallback */}
                                    <div className="mt-5">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Other Subjects (Comma separated)</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Robotics, Research"
                                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-5 py-3 text-xs font-bold transition-all outline-none focus:border-amber-500/20"
                                            value={formData.subject_name || ''}
                                            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Adviser / Teacher (LOCKED) */}
                        <div className="col-span-2">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
                                {formData.is_advisory ? 'Adviser Name' : 'Subject Teacher Name'} (LOCKED)
                                <Shield className="w-3 h-3 text-blue-500" />
                            </label>
                            <div className="relative group/locked">
                                <input 
                                    readOnly
                                    className="w-full bg-slate-100 border-2 border-slate-200/50 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-500 outline-none cursor-not-allowed transition-all"
                                    value={formData.adviser_name}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                    <Shield className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="flex gap-4 p-4 bg-blue-50/50 rounded-2.5xl border border-blue-100/50">
                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] font-black text-blue-700 leading-relaxed uppercase tracking-tighter">
                            Advisory classes will appear in official SF forms, while teaching roles are for Grade management and E-Class Record.
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Config
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
