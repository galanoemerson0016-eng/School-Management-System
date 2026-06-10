import { useState, useEffect, useMemo } from 'react';
import { useAppStore, useAuthStore } from '../../stores';
import type { Section } from '../../types';
import { STANDARD_SUBJECTS, type GradeLevel } from '../../lib/curriculum';
import { motion } from 'framer-motion';
import { X, Save, Shield, BookOpen, AlertCircle, ChevronRight, Check } from 'lucide-react';

interface SectionFormProps {
    section: Section | null;
    onClose: () => void;
}

const GRADE_LEVELS = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12'
];

const STRANDS: Record<string, string[]> = {
    Academic: ['STEM', 'ABM', 'HUMSS', 'GAS'],
    TVL: [
        'Home Economics (HE)',
        'Information and Communications Technology (ICT)',
        'Industrial Arts (IA)',
        'Agri-Fishery Arts (AFA)'
    ],
    TechPro: [
        'Home Economics (HE)',
        'Information and Communications Technology (ICT)',
        'Industrial Arts (IA)',
        'Agri-Fishery Arts (AFA)'
    ],
    Sports: ['Sports Track'],
    'Arts and Design': ['Arts and Design Track'],
};

const getStrandsForTrack = (trackName: string | undefined, gradeLevel: string | undefined): string[] => {
    if (!trackName || !gradeLevel) return [];
    const normalizedTrack = trackName.trim().toLowerCase();
    const isG11 = gradeLevel.includes('11');

    if (isG11) {
        if (normalizedTrack === 'academic') {
            return ['SSHS'];
        }
        if (normalizedTrack === 'techpro' || normalizedTrack === 'tvl') {
            return STRANDS.TVL;
        }
    } else {
        if (normalizedTrack === 'academic') {
            return STRANDS.Academic;
        }
        if (normalizedTrack === 'tvl' || normalizedTrack === 'techpro') {
            return STRANDS.TVL;
        }
        if (normalizedTrack === 'sports') {
            return STRANDS.Sports;
        }
        if (normalizedTrack === 'arts and design' || normalizedTrack.includes('arts')) {
            return STRANDS['Arts and Design'];
        }
    }
    return [];
};

const normalizeSubjectLabel = (value: string) =>
    value.toLowerCase().replace(/\s+/g, ' ').replace(/\s*\([^)]*\)/g, '').trim();

const getShsCategoryForSubject = (subjectName: string, gradeLevel: string): string => {
    const normalized = subjectName.trim().toLowerCase();
    const isG11 = gradeLevel.includes('11');
    const isG12 = gradeLevel.includes('12');

    if (isG11) {
        const cores = [
            'effective communication',
            'mabisang komunikasyon',
            'general mathematics',
            'general science',
            'life and career skills',
            'pag-aaral ng kasaysayan at lipunang pilipino',
            'kasaysayan at lipunang pilipino'
        ];
        if (cores.some(c => normalized.includes(c))) {
            return 'Core Subject (All Tracks)';
        }

        if (normalized.startsWith('field exposure') || normalized.startsWith('field experience') || normalized.includes('apprenticeship')) {
            return 'Academic Elective (Field Experience/ Exposure, and Sports and Arts)';
        }

        const techPros = [
            'aesthetic services', 'aesthethic services', 'aesthetic', 'aesthethic', 'beauty care', 'barbering services', 'caregiving', 'hairdressing', 'wellness services', 'hilot',
            'agricultural crops', 'agro-entrepreneurship', 'aquaculture', 'fish capture', 'food processing',
            'organic agriculture', 'poultry production', 'ruminants production', 'swine production', 'garments artisanry',
            'handicrafts', 'weaving', 'automotive servicing', 'electrical repair', 'engine and chassis', 'driving',
            'motorcycle', 'small engine', 'carpentry', 'construction operation', 'manual metal arc welding', 'welding',
            'technical drafting', 'animation', 'illustration', 'visual graphics', 'visual graphic', 'bakery operation',
            'events management', 'food and beverage', 'hotel operation', 'front office', 'housekeeping', 'kitchen operations',
            'kitchen operation', 'tourism services', 'commercial air-conditioning', 'domestic refrigeration',
            'electrical installation', 'electronics product', 'mechatronics', 'photovoltaic systems', 'broadband installation',
            'computer programming', 'java', '.net', 'oracle', 'computer systems servicing', 'contact center', 'marine engineering',
            'marine transportation', 'support level', 'ships catering'
        ];
        if (techPros.some(tp => normalized.includes(tp))) {
            return 'TechPro Elective (All Other Elective)';
        }

        return 'Academic Elective (All Other Electives)';
    }

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
            return 'Core Subjects';
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
            return 'Applied Subjects';
        }

        // 3. Specialized Subjects
        return 'Specialized Subjects';
    }

    return '';
};

const getCategoryForSubject = (subjectName: string, gradeLevel: string): string => {
    const normalized = subjectName.trim().toLowerCase();
    const isSHS = gradeLevel.includes('11') || gradeLevel.includes('12');

    if (isSHS) {
        return getShsCategoryForSubject(subjectName, gradeLevel);
    }

    const isJHS = gradeLevel.includes('Grade 7') || gradeLevel.includes('Grade 8') || gradeLevel.includes('Grade 9') || gradeLevel.includes('Grade 10');

    if (isJHS) {
        const cores = ['filipino', 'english', 'mathematics', 'science', 'araling panlipunan'];
        if (cores.some(c => normalized.includes(c) || normalized === 'ap' || normalized === 'math')) {
            return 'Core Academic Subjects';
        }
        const values = ['values education', 'gmrc', 'good manners'];
        if (values.some(v => normalized.includes(v))) {
            return 'Values / Character Education';
        }
        const livelihood = ['technology and livelihood', 'tle', 'specialization', 'e.p.p.', 'epp'];
        if (livelihood.some(l => normalized.includes(l))) {
            return 'Technology & Livelihood (TLE)';
        }
        const mapeh = ['music', 'arts', 'physical education', 'health', 'mapeh', 'pe '];
        if (mapeh.some(m => normalized.includes(m) || normalized === 'pe' || normalized === 'pe.')) {
            return 'MAPEH (Music, Arts, PE, Health)';
        }
        return 'Other Subjects';
    }

    // Elementary (Grade 1 - 6)
    const cores = ['filipino', 'english', 'mathematics', 'science', 'araling panlipunan'];
    if (cores.some(c => normalized.includes(c) || normalized === 'ap' || normalized === 'math')) {
        return 'Core Academic Subjects';
    }
    const values = ['gmrc', 'good manners', 'values education', 'islamic values'];
    if (values.some(v => normalized.includes(v))) {
        return 'Values / Character Education';
    }
    const languages = ['language', 'reading', 'literacy', 'arabic language', 'mother tongue'];
    if (languages.some(l => normalized.includes(l))) {
        return 'Languages & Literacy';
    }
    const livelihood = ['makabansa', 'e.p.p.', 'epp', 'tle', 'technology and livelihood', 'specialization'];
    if (livelihood.some(l => normalized.includes(l))) {
        return 'Livelihood & Makabansa';
    }
    const mapeh = ['mapeh', 'music', 'arts', 'physical education', 'health', 'pe '];
    if (mapeh.some(m => normalized.includes(m) || normalized === 'pe' || normalized === 'pe.')) {
        return 'MAPEH (Music, Arts, PE, Health)';
    }

    return 'Other Subjects';
};

export function SectionForm({ section, onClose }: SectionFormProps) {
    const { sections, addSection, updateSection, subjects, schoolProfile, updateSchoolProfile, showNotification } = useAppStore();
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
        is_advisory: false, // Default to false, will be set in useEffect
        track: '',
        strand: ''
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
        
        if (formData.is_advisory && isGeneric && schoolProfile?.adviser_name) {
            setFormData(prev => ({ 
                ...prev, 
                adviser_name: schoolProfile.adviser_name
            }));
        }
    }, [schoolProfile, formData.adviser_name, formData.is_advisory]);

    const availableSubjects = useMemo(() => {
        const grade = formData.section_grade_level as GradeLevel;

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
                const indexB = standardOrder.findIndex(name => normalizeSubjectLabel(name) === normalizeSubjectLabel(b.name));

                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [formData.section_grade_level, subjects]);

    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (categoryName: string) => {
        setCollapsedCategories(prev => {
            const currentVal = prev[categoryName] ?? true; // Default to collapsed
            return {
                ...prev,
                [categoryName]: !currentVal
            };
        });
    };

    const selectAllInCategory = (categorySubjects: { name: string }[]) => {
        const current = formData.taught_subjects || [];
        const toAdd = categorySubjects.map(s => s.name);
        const next = Array.from(new Set([...current, ...toAdd]));
        setFormData({ ...formData, taught_subjects: next });
    };

    const clearAllInCategory = (categorySubjects: { name: string }[]) => {
        const current = formData.taught_subjects || [];
        const toRemove = new Set(categorySubjects.map(s => s.name));
        const next = current.filter(name => !toRemove.has(name));
        setFormData({ ...formData, taught_subjects: next });
    };

    const groupedSubjects = useMemo(() => {
        const grade = formData.section_grade_level || 'Grade 11';
        const isSHS = grade.includes('11') || grade.includes('12');

        if (!isSHS) {
            return {
                '': availableSubjects
            };
        }
        
        let catOrder: string[] = [];
        if (isSHS) {
            const gradeNum = parseInt(grade.replace(/\D/g, '')) || 0;
            catOrder = gradeNum === 11 ? [
                'Core Subject (All Tracks)',
                'Academic Elective (All Other Electives)',
                'Academic Elective (Field Experience/ Exposure, and Sports and Arts)',
                'TechPro Elective (All Other Elective)'
            ] : [
                'Core Subjects',
                'Applied Subjects',
                'Specialized Subjects'
            ];
        }

        const groups: Record<string, typeof availableSubjects> = {};
        
        catOrder.forEach(cat => {
            groups[cat] = [];
        });

        availableSubjects.forEach((subject) => {
            const cat = getCategoryForSubject(subject.name, grade);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(subject);
        });

        const filtered: Record<string, typeof availableSubjects> = {};
        Object.entries(groups).forEach(([cat, list]) => {
            if (list.length > 0) {
                filtered[cat] = list;
            }
        });

        return filtered;
    }, [availableSubjects, formData.section_grade_level]);

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
        setFormData(prev => ({ 
            ...prev, 
            is_advisory: checked,
            adviser_name: checked ? (schoolProfile?.adviser_name || user?.displayName || '') : ''
        }));
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
            const isAdvisory = section.is_advisory ?? !section.is_teaching_load;
            
            // Legacy Migration: If is_advisory is undefined, infer it
            setFormData({
                ...section,
                // Force update adviser name if profile name is set and it is an advisory class. Otherwise keep it empty/as is.
                adviser_name: isAdvisory 
                    ? ((!isGenericProfile && profileName) ? profileName : (section.adviser_name || ''))
                    : '',
                is_advisory: isAdvisory,
                taught_subjects: section.taught_subjects || (section.subject_name ? [section.subject_name] : []),
                track: section.track || '',
                strand: section.strand || ''
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
                adviser_name: formData.is_advisory ? (formData.adviser_name || '') : '',
                subject_name: formData.subject_name,
                taught_subjects: formData.is_teaching_load 
                    ? (formData.taught_subjects || []).filter(s => validSubjectNames.has(s))
                    : [],
                is_teaching_load: !!formData.is_teaching_load,
                is_advisory: !!formData.is_advisory,
                track: (formData.section_grade_level?.includes('Grade 11') || formData.section_grade_level?.includes('Grade 12'))
                    ? formData.track || ''
                    : undefined,
                strand: formData.section_grade_level?.includes('Grade 12')
                    ? formData.strand || ''
                    : undefined
            };

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
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
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

                        {/* Track Selection (SHS only: Grade 11 or Grade 12) */}
                        {(formData.section_grade_level?.includes('Grade 11') || formData.section_grade_level?.includes('Grade 12')) && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">SHS Track *</label>
                                <select 
                                    required
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                    value={formData.track || ''}
                                    onChange={(e) => setFormData({ ...formData, track: e.target.value, strand: '' })}
                                >
                                    <option value="">Select SHS Track</option>
                                    {formData.section_grade_level?.includes('Grade 11') ? (
                                        <>
                                            <option value="Academic">Academic</option>
                                            <option value="TechPro">TechPro</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Academic">Academic</option>
                                            <option value="TVL">TVL</option>
                                            <option value="Sports">Sports</option>
                                            <option value="Arts and Design">Arts and Design</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        )}

                        {/* Strand Selection (SHS only: Grade 12 and Track selected) */}
                        {formData.section_grade_level?.includes('Grade 12') && formData.track && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">SHS Strand *</label>
                                <select 
                                    required
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                    value={formData.strand || ''}
                                    onChange={(e) => setFormData({ ...formData, strand: e.target.value })}
                                >
                                    <option value="">Select SHS Strand</option>
                                    {getStrandsForTrack(formData.track, formData.section_grade_level).map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}

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
                                        <div className="space-y-4">
                                            {Object.entries(groupedSubjects).map(([category, list]) => {
                                                const grade = formData.section_grade_level || 'Grade 11';
                                                const isSHS = grade.includes('11') || grade.includes('12');
                                                const isCollapsed = category ? (collapsedCategories[category] ?? isSHS) : false;
                                                
                                                return (
                                                    <div key={category} className="bg-slate-50 border border-slate-200/50 rounded-2xl overflow-hidden shadow-xs">
                                                        {/* Category Header */}
                                                        {category && (
                                                            <div className="bg-slate-100/80 px-4 py-3 flex items-center justify-between border-b border-slate-200/50">
                                                                <div 
                                                                    onClick={() => toggleCategory(category)}
                                                                    className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                                                                >
                                                                    <ChevronRight className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider truncate">
                                                                        {category}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500">
                                                                        {list.length}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider select-none shrink-0 pl-4">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => selectAllInCategory(list)}
                                                                        className="text-indigo-600 hover:text-indigo-800 transition-colors font-bold animate-pulse hover:animate-none"
                                                                    >
                                                                        Select All
                                                                    </button>
                                                                    <span className="text-slate-300">|</span>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => clearAllInCategory(list)}
                                                                        className="text-slate-400 hover:text-slate-600 transition-colors font-bold"
                                                                    >
                                                                        Clear All
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Category Grid */}
                                                        {!isCollapsed && (
                                                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                                                                {list.map((subj) => (
                                                                    <div 
                                                                        key={subj.name}
                                                                        onClick={() => toggleSubject(subj.name)}
                                                                        className={`group p-2.5 ps-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2.5 ${formData.taught_subjects?.includes(subj.name) ? 'bg-white border-amber-400 shadow-sm' : 'bg-white/50 border-slate-100 hover:border-amber-200'}`}
                                                                    >
                                                                        <div className={`w-4.5 h-4.5 rounded border-2 transition-all shrink-0 flex items-center justify-center ${formData.taught_subjects?.includes(subj.name) ? 'bg-amber-500 border-amber-500 text-white shadow-sm' : 'border-slate-200 group-hover:border-amber-400'}`}>
                                                                            {formData.taught_subjects?.includes(subj.name) && (
                                                                                <Check className="w-3 h-3 stroke-[3.5]" />
                                                                            )}
                                                                        </div>
                                                                        <span className={`text-[9px] font-black uppercase tracking-tight truncate ${formData.taught_subjects?.includes(subj.name) ? 'text-amber-600' : 'text-slate-500'}`}>
                                                                            {subj.name}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
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
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
                                {formData.is_advisory ? 'Adviser Name' : 'Subject Teacher Name'} (LOCKED)
                                <Shield className="w-3 h-3 text-blue-500" />
                            </label>
                            <div className="relative group/locked">
                                <input 
                                    readOnly
                                    className="w-full bg-slate-100 border-2 border-slate-200/50 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-500 outline-none cursor-not-allowed transition-all"
                                    value={formData.is_advisory ? (formData.adviser_name || '') : (schoolProfile?.adviser_name || user?.displayName || '')}
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
