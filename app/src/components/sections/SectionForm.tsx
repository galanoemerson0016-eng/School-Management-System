import { useState, useEffect, useMemo } from 'react';
import { useAppStore, useAuthStore } from '../../stores';
import type { Section } from '../../types';
import { STANDARD_SUBJECTS, SPECIAL_SUBJECTS, findElectiveInCatalog, GRADE_11_CORE_SUBJECTS, getClustersForGrade11Track, type GradeLevel } from '../../lib/curriculum';
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
        'Hospitality and Tourism',
        'ICT Support and Computer Programming',
        'Aesthetic, Wellness, and Human Care',
        'Agri-Fishery Business and Food Innovation',
        'Artisanry and Creative Enterprise',
        'Automotive and Small Engine Technologies',
        'Construction and Building Technologies',
        'Creative Arts and Design Technologies',
        'Industrial Technologies',
        'Maritime'
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
            return ['SSHS', 'Arts, Social Sciences, and Humanities', 'Business and Entrepreneurship', 'STEM', 'Sports, Health, and Wellness', 'Field Experience'];
        }
        if (normalizedTrack === 'techpro' || normalizedTrack === 'tvl') {
            return STRANDS.TechPro;
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
    const { addSection, updateSection, subjects, schoolProfile, updateSchoolProfile, showNotification } = useAppStore();
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
        teaching_subjects: [],
        is_teaching_load: false,
        is_advisory: false,
        track: '',
        strand: '',
        cluster: ''
    });

    // Handle initial role defaults for NEW sections
    useEffect(() => {
        if (!section) {
            setFormData(prev => ({
                ...prev,
                is_advisory: false,
                is_teaching_load: false,
                taught_subjects: [],
                teaching_subjects: []
            }));
        }
    }, [section]);

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

        const uniqueList: { name: string; code: string }[] = [];
        const seenNames = new Set<string>();

        const addToList = (name: string, code: string) => {
            if (!name) return;
            const key = name.trim().toLowerCase();
            if (!seenNames.has(key)) {
                seenNames.add(key);
                uniqueList.push({ name, code });
            }
        };

        // 1. Section-specific subjects (if configured in database)
        if (formData.id) {
            const sectionSubjects = subjects.filter(s => 
                s.grade_level === grade && 
                !s.is_teaching_load &&
                s.section_id === formData.id
            );
            sectionSubjects.forEach(s => addToList(s.subject_name, s.subject_code || ''));
        }

        // 2. Grade-level generic subjects in database
        const genericSubjects = subjects.filter(s => 
            s.grade_level === grade && 
            !s.is_teaching_load &&
            !s.section_id
        );
        genericSubjects.forEach(s => addToList(s.subject_name, s.subject_code || ''));

        // 3. Standard curriculum templates (Core & Academic Electives)
        const standard = STANDARD_SUBJECTS[grade] || [];
        standard.forEach(s => addToList(s.name, s.code || ''));

        // 4. Special curriculum templates (TechPro Electives, Specializations, etc.)
        const special = SPECIAL_SUBJECTS[grade as keyof typeof SPECIAL_SUBJECTS] || [];
        special.forEach(s => addToList(s.name, s.code || ''));

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
                const indexB = standardOrder.findIndex(name => normalizeSubjectLabel(name) === normalizeSubjectLabel(a.name));

                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [formData.section_grade_level, formData.id, subjects]);

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
        const current = formData.teaching_subjects || [];
        const toAdd = categorySubjects.map(s => s.name);
        const next = Array.from(new Set([...current, ...toAdd]));
        setFormData({ ...formData, teaching_subjects: next });
    };

    const clearAllInCategory = (categorySubjects: { name: string }[]) => {
        const current = formData.teaching_subjects || [];
        const toRemove = new Set(categorySubjects.map(s => s.name));
        const next = current.filter(name => !toRemove.has(name));
        setFormData({ ...formData, teaching_subjects: next });
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
        const gradeNum = parseInt(grade.replace(/\D/g, '')) || 0;
        
        if (gradeNum === 11) {
            catOrder = [
                'Core Subject (All Tracks)',
                'Academic Elective (All Other Electives)',
                'Academic Elective (Field Experience/ Exposure, and Sports and Arts)',
                'TechPro Elective (All Other Elective)'
            ];
        } else {
            catOrder = [
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
        setFormData(prev => ({ 
            ...prev, 
            is_advisory: checked,
            adviser_name: checked ? (schoolProfile?.adviser_name || user?.displayName || '') : ''
        }));
    };

    const handleTeachingChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            is_teaching_load: checked,
            teaching_subjects: checked ? (prev.teaching_subjects && prev.teaching_subjects.length > 0 ? prev.teaching_subjects : []) : []
        }));
    };

    const toggleSubject = (subjectName: string) => {
        const current = formData.teaching_subjects || [];
        if (current.includes(subjectName)) {
            setFormData({ ...formData, teaching_subjects: current.filter(s => s !== subjectName) });
        } else {
            setFormData({ ...formData, teaching_subjects: [...current, subjectName] });
        }
    };

    useEffect(() => {
        if (section) {
            const profileName = (schoolProfile?.adviser_name || '').trim();
            const isGenericProfile = profileName.toLowerCase() === 'admin' || profileName === '';
            const isAdvisory = section.is_advisory ?? !section.is_teaching_load;
            const isTeaching = section.is_teaching_load ?? false;
            const teachingSubjs = section.teaching_subjects 
                || (isTeaching && !isAdvisory ? (section.taught_subjects || (section.subject_name ? [section.subject_name] : [])) : []) 
                || [];
            
            // Legacy Migration: If is_advisory is undefined, infer it
            setFormData({
                ...section,
                // Force update adviser name if profile name is set and it is an advisory class. Otherwise keep it empty/as is.
                adviser_name: isAdvisory 
                    ? ((!isGenericProfile && profileName) ? profileName : (section.adviser_name || ''))
                    : '',
                is_advisory: isAdvisory,
                is_teaching_load: isTeaching,
                taught_subjects: section.taught_subjects || (section.subject_name ? [section.subject_name] : []),
                teaching_subjects: teachingSubjs,
                track: section.track || '',
                strand: section.strand || '',
                cluster: section.cluster || (section.section_grade_level?.includes('Grade 11') ? section.strand || '' : '')
            });
        }
    }, [section, schoolProfile?.adviser_name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.section_name || !formData.section_grade_level) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        if (!formData.is_advisory && !formData.is_teaching_load) {
            showNotification('Please select at least one role: Advisory or Teaching.', 'error');
            return;
        }

        const isG11 = formData.section_grade_level?.includes('Grade 11');
        const isG12 = formData.section_grade_level?.includes('Grade 12');
        const isTeaching = !!formData.is_teaching_load;
        const isAdvisory = !!formData.is_advisory;

        try {
            const validSubjectNames = new Set(availableSubjects.map(s => s.name));
            const validTeachingSubjects = isTeaching
                ? (formData.teaching_subjects || []).filter(s => validSubjectNames.has(s))
                : [];
            
            // Preserve existing advisory curriculum taught_subjects if present
            const existingTaughtSubjects = section?.taught_subjects || [];
            const finalTaughtSubjects = isAdvisory 
                ? (existingTaughtSubjects.length > 0 ? existingTaughtSubjects : (isTeaching ? validTeachingSubjects : []))
                : validTeachingSubjects;

            const sectionData: Section = {
                id: formData.id || `section_${Date.now()}`,
                section_name: formData.section_name!,
                section_grade_level: formData.section_grade_level!,
                adviser_id: formData.adviser_id || '',
                adviser_name: isAdvisory ? (formData.adviser_name || '') : '',
                subject_name: formData.subject_name,
                taught_subjects: finalTaughtSubjects,
                teaching_subjects: validTeachingSubjects,
                is_teaching_load: isTeaching,
                is_advisory: isAdvisory,
                track: (isG11 || isG12)
                    ? formData.track || ''
                    : undefined,
                strand: (isG11 || isG12)
                    ? (isG11 ? formData.cluster || formData.strand || '' : formData.strand || '')
                    : undefined,
                cluster: isG11
                    ? formData.cluster || formData.strand || ''
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
                className="relative bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border border-slate-200 dark:border-white/10"
            >
                {/* Header */}
                <div className="bg-deped-blue dark:bg-[#0f172a] p-8 text-white relative shrink-0 border-b border-deped-blue/30 dark:border-white/10">
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-2xl font-black tracking-tight mb-1">
                        {section ? 'Edit Section' : 'Create New Section'}
                    </h3>
                    <p className="text-blue-200/60 dark:text-blue-300/60 font-bold uppercase tracking-widest text-[9px]">
                        {section ? `Modifying ${section.section_name}` : (formData.is_advisory ? 'Setup your official advisory class' : 'Add a section for your teaching load')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-5">
                        {/* Grade Level First */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">Grade Level *</label>
                            <select 
                                required
                                className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                value={formData.section_grade_level}
                                onChange={(e) => setFormData({ ...formData, section_grade_level: e.target.value })}
                            >
                                {GRADE_LEVELS.map(g => <option key={g} value={g} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{g}</option>)}
                            </select>
                        </div>

                        {/* Section Name Second */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">Section Name *</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. Einstein"
                                className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={formData.section_name}
                                onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                            />
                        </div>

                        {/* Track Selection (SHS only: Grade 11 or Grade 12) */}
                        {(formData.section_grade_level?.includes('Grade 11') || formData.section_grade_level?.includes('Grade 12')) && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">SHS Track *</label>
                                <select 
                                    required
                                    className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                    value={formData.track || ''}
                                    onChange={(e) => setFormData({ ...formData, track: e.target.value, strand: '', cluster: '' })}
                                >
                                    <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select SHS Track</option>
                                    {formData.section_grade_level?.includes('Grade 11') ? (
                                        <>
                                            <option value="Academic" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Academic</option>
                                            <option value="TechPro" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">TechPro</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Academic" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Academic</option>
                                            <option value="TVL" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">TVL</option>
                                            <option value="Sports" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Sports</option>
                                            <option value="Arts and Design" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Arts and Design</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        )}

                        {/* SSHS Curriculum Cluster Selection for Grade 11 */}
                        {formData.section_grade_level?.includes('Grade 11') && formData.track && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">
                                    SSHS Curriculum Cluster *
                                </label>
                                <select 
                                    required
                                    className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                    value={formData.cluster || formData.strand || ''}
                                    onChange={(e) => setFormData({ ...formData, cluster: e.target.value, strand: e.target.value })}
                                >
                                    <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Curriculum Cluster</option>
                                    {getClustersForGrade11Track(formData.track).map((cluster) => (
                                        <option key={cluster} value={cluster} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">
                                            {cluster}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Strand Selection (SHS only: Grade 12 and Track selected) */}
                        {formData.section_grade_level?.includes('Grade 12') && formData.track && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">SHS Strand *</label>
                                <select 
                                    required
                                    className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                    value={formData.strand || ''}
                                    onChange={(e) => setFormData({ ...formData, strand: e.target.value })}
                                >
                                    <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select SHS Strand</option>
                                    {getStrandsForTrack(formData.track, formData.section_grade_level).map((s) => (
                                        <option key={s} value={s} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* ROLE CONFIGURATION */}
                        <div className="col-span-2 bg-slate-50/50 dark:bg-white/5 rounded-2.5xl p-5 border border-slate-100 dark:border-white/10">
                            <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-4 ml-1">Role Configuration</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Advisory Role */}
                                <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${formData.is_advisory ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40 shadow-xs' : 'bg-white dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.is_advisory ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-300'}`}>
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-xs font-black ${formData.is_advisory ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>Advisory</div>
                                        <div className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase">Class Adviser</div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-2 border-slate-200 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" 
                                        checked={formData.is_advisory}
                                        onChange={(e) => handleAdvisoryChange(e.target.checked)}
                                    />
                                </label>

                                {/* Teaching Role */}
                                <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${formData.is_teaching_load ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 shadow-xs' : 'bg-white dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.is_teaching_load ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none' : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-300'}`}>
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-xs font-black ${formData.is_teaching_load ? 'text-amber-900 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}>Teaching</div>
                                        <div className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase">Subject Teacher</div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-2 border-slate-200 dark:border-white/10 text-amber-500 focus:ring-amber-500 transition-all cursor-pointer" 
                                        checked={formData.is_teaching_load}
                                        onChange={(e) => handleTeachingChange(e.target.checked)}
                                    />
                                </label>
                            </div>

                            {/* SUBJECT SELECTION GRID - ONLY SHOWN FOR TEACHING LOAD */}
                            {formData.is_teaching_load ? (
                                <motion.div 
                                    initial={{ opacity: 0, height: 'auto' }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6"
                                >
                                    <div className="flex items-center justify-between mb-4 ml-1">
                                        <label className="block text-[9px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest">
                                            Subjects Taught ({formData.teaching_subjects?.length || 0})
                                        </label>
                                        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                                            Select subjects you teach in this section
                                        </span>
                                    </div>
                                        
                                        {availableSubjects.length > 0 ? (
                                            <div className="space-y-4">
                                                {Object.entries(groupedSubjects).map(([category, list]) => {
                                                    const grade = formData.section_grade_level || 'Grade 11';
                                                    const isSHS = grade.includes('11') || grade.includes('12');
                                                    const isCollapsed = category ? (collapsedCategories[category] ?? isSHS) : false;
                                                    
                                                    return (
                                                        <div key={category} className="bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
                                                            {/* Category Header */}
                                                            {category && (
                                                                <div className="bg-slate-100/80 dark:bg-white/10 px-4 py-3 flex items-center justify-between border-b border-slate-200/50 dark:border-white/10">
                                                                    <div 
                                                                        onClick={() => toggleCategory(category)}
                                                                        className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                                                                    >
                                                                        <ChevronRight className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                                                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-200 uppercase tracking-wider truncate">
                                                                            {category}
                                                                        </span>
                                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-300">
                                                                            {list.length}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider select-none shrink-0 pl-4">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => selectAllInCategory(list)}
                                                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors font-bold cursor-pointer"
                                                                        >
                                                                            Select All
                                                                        </button>
                                                                        <span className="text-slate-300 dark:text-slate-600">|</span>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => clearAllInCategory(list)}
                                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold cursor-pointer"
                                                                        >
                                                                            Clear All
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Category Grid */}
                                                            {!isCollapsed && (
                                                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white dark:bg-[#0f172a]">
                                                                    {list.map((subj) => {
                                                                        const isSHS = (formData.section_grade_level || '').includes('11') || (formData.section_grade_level || '').includes('12');
                                                                        const electiveInfo = isSHS ? findElectiveInCatalog(subj.name) : undefined;
                                                                        const isSelected = formData.teaching_subjects?.includes(subj.name);
                                                                        return (
                                                                            <div 
                                                                                key={subj.name}
                                                                                onClick={() => toggleSubject(subj.name)}
                                                                                className={`group p-2.5 ps-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 ${isSelected ? 'bg-white dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 shadow-xs' : 'bg-white/50 dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-amber-200 dark:hover:border-amber-500/40'}`}
                                                                            >
                                                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                                                <div className={`w-4.5 h-4.5 rounded border-2 transition-all shrink-0 flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500 text-white shadow-xs' : 'border-slate-200 dark:border-white/20 group-hover:border-amber-400'}`}>
                                                                                        {isSelected && (
                                                                                            <Check className="w-3 h-3 stroke-[3.5]" />
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <span className={`text-[9px] font-black uppercase tracking-tight block truncate ${isSelected ? 'text-amber-600 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                                                                            {subj.name}
                                                                                        </span>
                                                                                        {electiveInfo?.prerequisites && electiveInfo.prerequisites.length > 0 && (
                                                                                            <span className="text-[7.5px] font-semibold text-slate-400 dark:text-slate-500 block truncate">
                                                                                                Prereq: {electiveInfo.prerequisites.join(', ')}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Badges for Hours and NC level */}
                                                                                {electiveInfo && (
                                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                                                                                            {electiveInfo.hours}h
                                                                                        </span>
                                                                                        {electiveInfo.ncLevel && (
                                                                                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                                                                                                {electiveInfo.ncLevel}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic">No standard subjects found.</p>
                                        )}
                                </motion.div>
                            ) : formData.is_advisory ? (
                                <div className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6">
                                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100/70 dark:border-indigo-800/30 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tight mb-0.5">
                                                Official Advisory Class
                                            </h5>
                                            <p className="text-[9.5px] font-medium text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                                                The curriculum subjects for this advisory class are configured in the <span className="font-bold underline">Subjects</span> tab (powers SF9, SF10, & Summary of Grades). If you also teach subjects to this class, check <span className="font-bold">Teaching</span> above.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6">
                                    <div className="p-5 text-center bg-slate-50/50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-400">
                                            Select a role above (<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Advisory</span> or <span className="text-amber-600 dark:text-amber-400 font-extrabold">Teaching</span>) to configure this section.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Adviser / Teacher (LOCKED) */}
                        <div className="col-span-2">
                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
                                {formData.is_advisory ? 'Adviser Name' : 'Subject Teacher Name'} (LOCKED)
                                <Shield className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                            </label>
                            <div className="relative group/locked">
                                <input 
                                    readOnly
                                    className="w-full bg-slate-100 dark:bg-white/10 border-2 border-slate-200/50 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-500 dark:text-slate-200 outline-none cursor-not-allowed transition-all"
                                    value={formData.is_advisory ? (formData.adviser_name || '') : (schoolProfile?.adviser_name || user?.displayName || '')}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                    <Shield className="w-4 h-4 text-slate-300 dark:text-slate-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="flex gap-4 p-4 bg-blue-50/50 dark:bg-blue-950/40 rounded-2.5xl border border-blue-100/50 dark:border-blue-800/40">
                        <AlertCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[9px] font-black text-blue-700 dark:text-blue-300 leading-relaxed uppercase tracking-tighter">
                            Advisory classes will appear in official SF forms, while teaching roles are for Grade management and E-Class Record.
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
