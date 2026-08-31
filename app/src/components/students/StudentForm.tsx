import { useState, useEffect, type FormEvent } from 'react';
import { useAppStore } from '../../stores';
import type { Student } from '../../types';
import { db } from '../../services/database';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { PhotoUploadCrop } from '../id-card/PhotoUploadCrop';
import { getClustersForGrade11Track } from '../../lib/curriculum';

interface StudentFormProps {
    student: Student | null;
    onClose: () => void;
    initialData?: Partial<Student>;
    isSimplified?: boolean;
}

const GRADE_LEVELS = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12'
];

const TRACKS = ['Academic', 'TechPro', 'TVL', 'Sports', 'Arts and Design'];

const STRAND_MAPPING: Record<string, string> = {
    'Science, Technology, Engineering, and Mathematics': 'STEM',
    'Accountancy, Business, and Management': 'ABM',
    'Humanities and Social Sciences': 'HUMSS',
    'General Academic Strand': 'GAS',
    'Home Economics': 'Home Economics (HE)',
    'Information and Communications Technology': 'Information and Communications Technology (ICT)',
    'Agri-Fishery Arts': 'Agri-Fishery Arts (AFA)',
    'Industrial Arts': 'Industrial Arts (IA)',
    'STEM': 'STEM',
    'ABM': 'ABM',
    'HUMSS': 'HUMSS',
    'GAS': 'GAS',
    'HE': 'Home Economics (HE)',
    'ICT': 'Information and Communications Technology (ICT)',
    'IA': 'Industrial Arts (IA)',
    'AFA': 'Agri-Fishery Arts (AFA)'
};

const STRANDS: Record<string, string[]> = {
    Academic: [
        'STEM',
        'ABM',
        'HUMSS',
        'GAS',
        'Arts, Social Sciences, and Humanities',
        'Business and Entrepreneurship',
        'Science, Technology, Engineering, and Mathematics',
        'Sports, Health, and Wellness',
        'Field Experience'
    ],
    TVL: [
        'Home Economics (HE)',
        'Information and Communications Technology (ICT)',
        'Industrial Arts (IA)',
        'Agri-Fishery Arts (AFA)',
        'Maritime',
        'Aesthetic, Wellness, and Human Care',
        'Agri-Fishery Business and Food Innovation',
        'Artisanry and Creative Enterprise',
        'Automotive and Small Engine Technologies',
        'Construction and Building Technologies',
        'Creative Arts and Design Technologies',
        'Hospitality and Tourism',
        'ICT Support and Computer Programming Technologies',
        'Industrial Technologies'
    ],
    TechPro: [
        'Home Economics (HE)',
        'Information and Communications Technology (ICT)',
        'Industrial Arts (IA)',
        'Agri-Fishery Arts (AFA)',
        'Maritime',
        'Aesthetic, Wellness, and Human Care',
        'Agri-Fishery Business and Food Innovation',
        'Artisanry and Creative Enterprise',
        'Automotive and Small Engine Technologies',
        'Construction and Building Technologies',
        'Creative Arts and Design Technologies',
        'Hospitality and Tourism',
        'ICT Support and Computer Programming Technologies',
        'Industrial Technologies'
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


export function StudentForm({ student, onClose, initialData, isSimplified = false }: StudentFormProps) {
    const { addStudent, updateStudent, sections, students, showNotification } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [pendingProfile, setPendingProfile] = useState<Student | null>(null);

    const waitForStudentPersistence = async (payload: Student, timeoutMs = 6000) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const data = await db.getRecord<Student>('students', payload.lrn);
            if (data) {
                const persisted =
                    (data.first_name || '') === (payload.first_name || '') &&
                    (data.last_name || '') === (payload.last_name || '') &&
                    (data.grade_level || '') === (payload.grade_level || '') &&
                    (data.student_section || '') === (payload.student_section || '');

                if (persisted) {
                    return true;
                }
            }

            await new Promise<void>((resolve) => {
                window.setTimeout(() => resolve(), 350);
            });
        }

        return false;
    };

    const [formData, setFormData] = useState<Partial<Student>>({
        lrn: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        name_extension: '',
        gender: undefined,
        birthday: '',
        age: 0,
        address: '',
        contact_number: '',
        weight: '',
        height: '',
        grade_level: 'Grade 1',
        student_section: '',
        track: '',
        strand: '',
        // SF10 Eligibility Info (Unified)
        elementary_school: '',
        elementary_school_id: '',
        elementary_school_address: '',
        elementary_school_type: '',
        sy_last_attended: '',
        average_grade: '',
        citation: '',
        pept_rating: '',
        pept_date: '',
        als_rating: '',
        testing_center: '',
        other_credentials: '',
        // Elem Specific
        kinder_progress_report: false,
        eccd_checklist: false,
        kinder_completion_cert: false,
        pept_checked: false,
        other_checked: false,
        // Flags
        is_elem_completer: true,
        is_pept_passer: false,
        is_als_passer: false,
        is_other_eligibility: false,
        // SHS Specific
        shs_admission_date: '',
        is_hs_completer: false,
        hs_gen_ave: '',
        hs_graduation_date: '',
        is_jhs_completer: false,
        jhs_gen_ave: '',
        jhs_school_name: '',
        jhs_school_address: '',
        jhs_school_type: '',
        jhs_graduation_date: '',
        shs_pept_rating: '',
        shs_pept_date: '',
        shs_als_rating: '',
        shs_als_clc_name_address: '',
        photo_url: '',
        father_name: '',
        mother_name: '',
        guardian_name: '',
        guardian_relationship: '',
        parent_contact: '',
        parent_email: '',
        parent_name: '',
        is_4ps: false,
        household_id: '',
        enrollment_type: 'Regular',
        is_als: false,
        als_center_address: '',
        first_day_attendance: '2026-06-08',
        first_day_attendance_sem: '1st Term',
        req_birth_cert: false,
        req_report_card: false,
        req_sf10: false,
        req_good_moral: false,
        req_homeroom_guidance: false,
        req_brigada_eskwela: false,
        req_beef: false,
        req_undertaking: false,
        req_1st_term: false,
        req_2nd_term: false,
        req_3rd_term: false,
        ...initialData
    });

    const [inputType, setInputType] = useState('text');

    const formatDateForDisplay = (isoDate: string | undefined) => {
        if (!isoDate) return '';
        const [y, m, d] = isoDate.split('-');
        return `${m}/${d}/${y}`;
    };

    useEffect(() => {
        if (student) {
            const mappedStrand = STRAND_MAPPING[student.strand || ''] || student.strand || '';
            setFormData({
                ...student,
                strand: mappedStrand,
                elementary_school_type: student.elementary_school_type ?? '',
                jhs_school_type: student.jhs_school_type ?? '',
                is_elem_completer: student.is_elem_completer ?? !!(student.elementary_school || '').trim(),
                is_pept_passer: student.is_pept_passer ?? false,
                is_als_passer: student.is_als_passer ?? false,
                is_other_eligibility: student.is_other_eligibility ?? false,
                // Prefill SHS spec
                shs_admission_date: student.shs_admission_date ?? '',
                is_hs_completer: student.is_hs_completer ?? false,
                hs_gen_ave: student.hs_gen_ave ?? '',
                hs_graduation_date: student.hs_graduation_date ?? '',
                is_jhs_completer: student.is_jhs_completer ?? false,
                jhs_gen_ave: student.jhs_gen_ave ?? '',
                jhs_school_name: student.jhs_school_name ?? '',
                jhs_school_address: student.jhs_school_address ?? '',
                jhs_graduation_date: student.jhs_graduation_date ?? '',
                shs_pept_rating: student.shs_pept_rating ?? '',
                shs_pept_date: student.shs_pept_date ?? '',
                shs_als_rating: student.shs_als_rating ?? '',
                shs_als_clc_name_address: student.shs_als_clc_name_address ?? '',
                shs_other_credentials: student.shs_other_credentials ?? '',
                // Profile mapping details
                is_4ps: student.is_4ps ?? false,
                household_id: student.household_id ?? '',
                enrollment_type: student.enrollment_type ?? 'Regular',
                is_als: student.is_als ?? false,
                als_center_address: student.als_center_address ?? '',
                first_day_attendance: student.first_day_attendance || '2026-06-08',
                first_day_attendance_sem: student.first_day_attendance_sem ?? '1st Term',
                req_birth_cert: student.req_birth_cert ?? false,
                req_report_card: student.req_report_card ?? false,
                req_sf10: student.req_sf10 ?? false,
                req_good_moral: student.req_good_moral ?? false,
                req_homeroom_guidance: student.req_homeroom_guidance ?? false,
                req_brigada_eskwela: student.req_brigada_eskwela ?? false,
                req_beef: student.req_beef ?? false,
                req_undertaking: student.req_undertaking ?? false,
                req_1st_term: student.req_1st_term ?? false,
                req_2nd_term: student.req_2nd_term ?? false,
                req_3rd_term: student.req_3rd_term ?? false,
            });
        } else if (initialData) {
            const mappedStrand = STRAND_MAPPING[initialData.strand || ''] || initialData.strand || '';
            setFormData(prev => ({
                ...prev,
                ...initialData,
                strand: mappedStrand
            }));
        }
    }, [student, initialData]);

    // Ensure Grade Level stays in sync with Section's grade level
    useEffect(() => {
        if (formData.student_section) {
            const sectionObj = sections.find(s => s.section_name === formData.student_section || s.id === formData.student_section);
            if (sectionObj && sectionObj.section_grade_level !== formData.grade_level) {
                setFormData(prev => ({ ...prev, grade_level: sectionObj.section_grade_level }));
            }
        }
    }, [formData.student_section, sections, formData.grade_level]);

    // Keep student's track and strand in sync with selected section's track and strand if configured
    useEffect(() => {
        if (formData.student_section) {
            const sectionObj = sections.find(s => s.section_name === formData.student_section || s.id === formData.student_section);
            if (sectionObj) {
                setFormData(prev => {
                    const nextTrack = sectionObj.track || '';
                    const nextStrand = sectionObj.strand || '';
                    if (prev.track !== nextTrack || prev.strand !== nextStrand) {
                        return {
                            ...prev,
                            track: nextTrack,
                            strand: nextStrand
                        };
                    }
                    return prev;
                });
            }
        }
    }, [formData.student_section, sections]);

    useEffect(() => {
        if (saveStatus !== 'saved') return;

        const closeTimer = window.setTimeout(() => {
            onClose();
        }, 1000);

        return () => {
            window.clearTimeout(closeTimer);
        };
    }, [saveStatus, onClose]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (saveStatus !== 'idle') {
            setSaveStatus('idle');
        }
        // If Grade Level changes, clear section, track, and strand to avoid mismatch and allow new selection
        if (name === 'grade_level') {
            setFormData(prev => ({ 
                ...prev, 
                grade_level: value, 
                student_section: '',
                track: '',
                strand: ''
            }));
            return;
        }

        // Auto-sync Grade Level, Track, Strand, and Cluster when Section changes
        if (name === 'student_section' && value) {
            const sectionObj = sections.find(s => s.section_name === value || s.id === value);
            if (sectionObj) {
                setFormData(prev => ({ 
                    ...prev, 
                    student_section: value, 
                    grade_level: sectionObj.section_grade_level,
                    track: sectionObj.track || '',
                    strand: sectionObj.strand || sectionObj.cluster || '',
                    cluster: sectionObj.cluster || sectionObj.strand || ''
                }));
                return;
            }
        }

        if (name === 'enrollment_type') {
            setFormData(prev => ({ 
                ...prev, 
                enrollment_type: value as Student['enrollment_type'],
                is_als: value === 'ALS' ? true : prev.is_als,
                is_als_passer: value === 'ALS' ? true : prev.is_als_passer
            }));
            return;
        }

        setFormData((prev) => {
            const nextState = { ...prev, [name]: value };
            if (name === 'als_center_address') {
                nextState.testing_center = value;
                nextState.shs_als_clc_name_address = value;
            } else if (name === 'testing_center') {
                nextState.als_center_address = value;
                nextState.shs_als_clc_name_address = value;
            } else if (name === 'shs_als_clc_name_address') {
                nextState.als_center_address = value;
                nextState.testing_center = value;
            }
            return nextState;
        });

        // Auto-calculate age from birthday
        if (name === 'birthday' && value) {
            const birth = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            setFormData((prev) => ({ ...prev, age }));
        }

        // Clear strand when track changes
        if (name === 'track') {
            setFormData((prev) => ({ ...prev, strand: '' }));
        }
    };

    const tryHydrateFromHistory = async () => {
        if (student) return;
        const lrn = (formData.lrn || '').trim();
        if (!/^\d{12}$/.test(lrn)) return;

        try {
            const existing = await db.getRecord<Student>('students', lrn);
            if (!existing) return;
            setPendingProfile(existing);
        } catch (error) {
            console.error('Failed to load existing student profile', error);
        }
    };

    const applyPendingProfile = () => {
        if (!pendingProfile) return;

        const mappedStrand = STRAND_MAPPING[pendingProfile.strand || ''] || pendingProfile.strand || '';
        setFormData((prev) => ({
            ...prev,
            ...pendingProfile,
            lrn: prev.lrn,
            grade_level: prev.grade_level || pendingProfile.grade_level || '',
            student_section: prev.student_section || '',
            weight: prev.weight ?? pendingProfile.weight ?? '',
            height: prev.height ?? pendingProfile.height ?? '',
            strand: prev.strand || mappedStrand
        }));
        setPendingProfile(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSaveStatus('saving');

        let finalLrn = (formData.lrn || '').trim();

        // If LRN is empty (bypassed)
        if (!finalLrn) {
            if (student) {
                // Keep the existing LRN if we're editing
                finalLrn = student.lrn;
            } else {
                // Generate a temporary LRN for a new student
                finalLrn = `TEMP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            }
        }

        // Validate LRN (allow 12 digits or TEMP- format)
        if (!/^\d{12}$/.test(finalLrn) && !finalLrn.startsWith('TEMP-')) {
            showNotification('LRN must be exactly 12 digits', 'error');
            setIsLoading(false);
            setSaveStatus('idle');
            return;
        }

        // Check for duplicates (prevent multiple students from having the same LRN)
        const duplicate = students.find((s) => s.lrn === finalLrn);
        if (duplicate && (!student || student.lrn !== finalLrn)) {
            showNotification(`A student named ${duplicate.first_name} ${duplicate.last_name} already has the LRN ${finalLrn}.`, 'error');
            setIsLoading(false);
            setSaveStatus('idle');
            return;
        }

        const studentData: Student = {
            lrn: finalLrn,
            first_name: formData.first_name!,
            last_name: formData.last_name!,
            middle_name: formData.middle_name || '',
            name_extension: formData.name_extension || '',
            gender: formData.gender as 'Male' | 'Female',
            birthday: formData.birthday || '2000-01-01',
            age: formData.age || 0,
            address: formData.address || 'N/A',
            contact_number: formData.contact_number || '',
            weight: formData.weight ?? '',
            height: formData.height ?? '',
            grade_level: formData.grade_level!,
            student_section: formData.student_section || '',
            track: (formData.grade_level?.includes('11') || formData.grade_level?.includes('12')) ? formData.track || '' : '',
            strand: formData.grade_level?.includes('12') ? formData.strand || '' : '',
            enrollment_date: student?.enrollment_date || new Date().toISOString(),
            // SF10 Fields
            elementary_school: formData.elementary_school || '',
            elementary_school_id: formData.elementary_school_id || '',
            elementary_school_address: formData.elementary_school_address || '',
            elementary_school_type: (formData.elementary_school_type as 'Public' | 'Private') || undefined,
            sy_last_attended: formData.sy_last_attended || '',
            average_grade: formData.average_grade || '',
            citation: formData.citation || '',
            pept_rating: formData.pept_rating || '',
            pept_date: formData.pept_date || '',
            als_rating: formData.als_rating || '',
            testing_center: formData.testing_center || '',
            other_credentials: formData.other_credentials || '',
            is_elem_completer: formData.is_elem_completer ?? false,
            is_pept_passer: formData.is_pept_passer ?? false,
            is_als_passer: formData.is_als_passer ?? false,
            is_other_eligibility: formData.is_other_eligibility ?? false,
            // Elem Specific
            kinder_progress_report: !!formData.kinder_progress_report,
            eccd_checklist: !!formData.eccd_checklist,
            kinder_completion_cert: !!formData.kinder_completion_cert,
            pept_checked: !!formData.pept_checked,
            other_checked: !!formData.other_checked,
            // SHS Specific
            shs_admission_date: formData.shs_admission_date || '',
            is_hs_completer: !!formData.is_hs_completer,
            hs_gen_ave: formData.hs_gen_ave || '',
            hs_graduation_date: formData.hs_graduation_date || '',
            is_jhs_completer: !!formData.is_jhs_completer,
            jhs_gen_ave: formData.jhs_gen_ave || '',
            jhs_school_name: formData.jhs_school_name || '',
            jhs_school_address: formData.jhs_school_address || '',
            jhs_school_type: (formData.jhs_school_type as 'Public' | 'Private') || undefined,
            jhs_graduation_date: formData.jhs_graduation_date || '',
            shs_pept_rating: formData.shs_pept_rating || '',
            shs_pept_date: formData.shs_pept_date || '',
            shs_als_rating: formData.shs_als_rating || '',
            shs_als_clc_name_address: formData.shs_als_clc_name_address || '',
            shs_other_credentials: formData.shs_other_credentials || '',
            // Parent / Guardian & Photo Info
            photo_url: formData.photo_url || '',
            father_name: formData.father_name || '',
            mother_name: formData.mother_name || '',
            guardian_name: formData.guardian_name || '',
            guardian_relationship: formData.guardian_relationship || '',
            parent_contact: formData.parent_contact || '',
            parent_email: formData.parent_email || '',
            parent_name: formData.guardian_name || formData.father_name || formData.mother_name || '',
            // Profile mapping details
            is_4ps: !!formData.is_4ps,
            household_id: formData.is_4ps ? formData.household_id || '' : '',
            enrollment_type: formData.enrollment_type || 'Regular',
            is_als: !!formData.is_als,
            als_center_address: formData.is_als ? formData.als_center_address || '' : '',
            first_day_attendance: formData.first_day_attendance || '2026-06-08',
            first_day_attendance_sem: formData.first_day_attendance_sem || '1st Term',
            req_birth_cert: !!formData.req_birth_cert,
            req_report_card: !!formData.req_report_card,
            req_sf10: !!formData.req_sf10,
            req_good_moral: !!formData.req_good_moral,
            req_homeroom_guidance: !!formData.req_homeroom_guidance,
            req_brigada_eskwela: !!formData.req_brigada_eskwela,
            req_beef: !!formData.req_beef,
            req_undertaking: !!formData.req_undertaking,
            req_1st_term: !!formData.req_1st_term,
            req_2nd_term: !!formData.req_2nd_term,
            req_3rd_term: !!formData.req_3rd_term,
        };

        try {
            const savePromise = student
                ? updateStudent(student.lrn, studentData)
                : addStudent(studentData);

            const result = await Promise.race<"resolved" | "verified" | "timeout">([
                savePromise.then(() => 'resolved' as const),
                waitForStudentPersistence(studentData).then((ok) => ok ? 'verified' as const : 'timeout' as const)
            ]);

            if (result === 'resolved' || result === 'verified') {
                setSaveStatus('saved');
            } else {
                setSaveStatus('idle');
                alert('Save is still syncing. Please wait a moment and try again.');
            }

            void savePromise.catch((error) => {
                console.error('Background save failed after optimistic UI update:', error);
                setSaveStatus('idle');
            });
        } catch (error) {
            console.error("Failed to save student:", error);
            alert("Error saving student: " + (error as Error).message);
            setSaveStatus('idle');
        } finally {
            setIsLoading(false);
        }
    };
    const isLrnEditable = true;

    const getLrnDisplayValue = () => {
        if (!formData.lrn) return '';
        const isTemp = formData.lrn.startsWith('TEMP-') || (formData.lrn.startsWith('99') && formData.lrn.length === 12);
        if (isTemp) {
            return isLrnEditable && student ? '' : (isLrnEditable && !student ? formData.lrn : 'TEMP (Bypassed)');
        }
        return formData.lrn;
    };

    const gradeInt = parseInt(formData.grade_level?.match(/\d+/)?.[0] || '0');
    const isElementary = gradeInt >= 1 && gradeInt <= 6;
    const isSHS = gradeInt >= 11 && gradeInt <= 12;
    const isGrade11 = gradeInt === 11;
    const isGrade12 = gradeInt === 12;

    const selectedSectionObj = formData.student_section
        ? sections.find(s => s.section_name === formData.student_section || s.id === formData.student_section)
        : null;
    const isTrackLocked = !!(selectedSectionObj && selectedSectionObj.track);
    const isStrandLocked = !!(selectedSectionObj && selectedSectionObj.strand);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                <div className="bg-deped-blue dark:bg-[#0f172a] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-deped-blue/30 dark:border-white/10">
                    <h3 className="text-xl font-bold">{student ? 'Edit Student' : 'Add New Student'}</h3>
                    <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl cursor-pointer">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">
                                    LRN (12 digits) {isSimplified && <span className="text-xs font-normal text-slate-400">(Optional)</span>}
                                </label>
                                <input
                                    type="text"
                                    name="lrn"
                                    value={getLrnDisplayValue()}
                                    onChange={handleChange}
                                    onBlur={() => {
                                        void tryHydrateFromHistory();
                                    }}
                                    pattern={!isLrnEditable || !formData.lrn ? undefined : (formData.lrn?.startsWith('TEMP-') || formData.lrn?.startsWith('99') ? undefined : "[0-9]{12}")}
                                    maxLength={!isLrnEditable || (formData.lrn?.startsWith('TEMP-') || formData.lrn?.startsWith('99')) ? undefined : 12}
                                    disabled={!isLrnEditable}
                                    placeholder="123456789012 (Leave blank to bypass)"
                                    className={`form-input ${!isLrnEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                {isLrnEditable && (
                                    <p className="mt-1 text-xs text-gray-500 font-medium">
                                        {isSimplified 
                                            ? "Leave blank for subject-only/names-only enrollment (auto-generates temp ID)." 
                                            : "Leave blank to automatically bypass and generate a temporary LRN."}
                                    </p>
                                )}
                            </div>

                            {pendingProfile && (
                                <ConfirmationModal
                                    open={pendingProfile !== null}
                                    title={`Use previous profile for ${pendingProfile.first_name} ${pendingProfile.last_name}?`}
                                    message="A matching student record already exists for this LRN. You can prefill this form with the existing profile data."
                                    details={`LRN: ${pendingProfile.lrn}\nGrade: ${pendingProfile.grade_level || 'N/A'}\nSection: ${pendingProfile.student_section || 'N/A'}`}
                                    confirmLabel="Prefill Form"
                                    intent="info"
                                    onConfirm={applyPendingProfile}
                                    onCancel={() => setPendingProfile(null)}
                                />
                            )}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Last Name *</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">First Name *</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Middle Name</label>
                                <input
                                    type="text"
                                    name="middle_name"
                                    value={formData.middle_name}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Name Extension (Jr, I, II)</label>
                                <input
                                    type="text"
                                    name="name_extension"
                                    value={formData.name_extension || ''}
                                    onChange={handleChange}
                                    placeholder="Jr, I, II"
                                    className="form-input text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Gender *</label>
                                <select name="gender" value={formData.gender || ''} onChange={handleChange} required className="form-input">
                                    <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Gender</option>
                                    <option value="Male" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Male</option>
                                    <option value="Female" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Female</option>
                                </select>
                            </div>

                            {!isSimplified && (
                                <>
                                    <div className="md:col-span-2 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row items-center gap-4 mb-2">
                                        <div className="shrink-0">
                                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Student Photo</label>
                                            <PhotoUploadCrop
                                                value={formData.photo_url}
                                                onChange={(dataUrl) => setFormData(prev => ({ ...prev, photo_url: dataUrl }))}
                                                onRemove={() => setFormData(prev => ({ ...prev, photo_url: undefined }))}
                                            />
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                            Upload/crop a student photo for generating IDs. Fixed 1:1 square crop. Compressed to save disk space and backups.
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Birthday *</label>
                                        <input
                                            type={inputType}
                                            name="birthday"
                                            placeholder="mm/dd/yyyy"
                                            value={inputType === 'date' ? formData.birthday : formatDateForDisplay(formData.birthday)}
                                            onFocus={() => setInputType('date')}
                                            onBlur={() => setInputType('text')}
                                            onChange={handleChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Age</label>
                                        <input type="number" name="age" value={formData.age} readOnly className="form-input bg-gray-100 dark:bg-white/10 dark:text-slate-200 dark:border-white/10" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Contact Number</label>
                                        <input
                                            type="tel"
                                            name="contact_number"
                                            value={formData.contact_number}
                                            onChange={handleChange}
                                            placeholder="09XX-XXX-XXXX"
                                            className="form-input"
                                        />
                                    </div>
                                    {isSHS && (
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Date of SHS Admission (mm/dd/yyyy)</label>
                                            <input
                                                type="date"
                                                name="shs_admission_date"
                                                value={formData.shs_admission_date || ''}
                                                onChange={handleChange}
                                                className="form-input"
                                            />
                                        </div>
                                    )}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Address *</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                            rows={2}
                                            className="form-input"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {!isSimplified && (
                        <>
                            {/* Parent & Guardian Information */}
                            <div>
                                <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 mb-4">Parent & Guardian Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-150 dark:border-white/10 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Father's Full Name</label>
                                        <input
                                            type="text"
                                            name="father_name"
                                            value={formData.father_name || ''}
                                            onChange={handleChange}
                                            placeholder="First Middle Last"
                                            className="form-input bg-white dark:bg-white/5 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Mother's Maiden Name</label>
                                        <input
                                            type="text"
                                            name="mother_name"
                                            value={formData.mother_name || ''}
                                            onChange={handleChange}
                                            placeholder="First Middle Last"
                                            className="form-input bg-white dark:bg-white/5 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Guardian's Full Name</label>
                                        <input
                                            type="text"
                                            name="guardian_name"
                                            value={formData.guardian_name || ''}
                                            onChange={handleChange}
                                            placeholder="First Middle Last"
                                            className="form-input bg-white dark:bg-white/5 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Guardian Relationship</label>
                                        <input
                                            type="text"
                                            name="guardian_relationship"
                                            value={formData.guardian_relationship || ''}
                                            onChange={handleChange}
                                            placeholder="e.g. Grandparent, Aunt"
                                            className="form-input bg-white dark:bg-white/5 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Parent/Guardian Contact No.</label>
                                        <input
                                            type="tel"
                                            name="parent_contact"
                                            value={formData.parent_contact || ''}
                                            onChange={handleChange}
                                            placeholder="09XX-XXX-XXXX"
                                            className="form-input bg-white dark:bg-white/5 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Parent/Guardian Email</label>
                                        <input
                                            type="email"
                                            name="parent_email"
                                            value={formData.parent_email || ''}
                                            onChange={handleChange}
                                            placeholder="email@example.com"
                                            className="form-input bg-white dark:bg-white/5 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Academic Information */}
                            <div>
                                <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 mb-4">Academic Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Grade Level *</label>
                                        <select 
                                            name="grade_level" 
                                            value={formData.grade_level} 
                                            onChange={handleChange} 
                                            required 
                                            disabled={!!student || !!initialData?.student_section}
                                            className={`form-input ${(!!student || !!initialData?.student_section) ? 'bg-gray-100 dark:bg-white/10 cursor-not-allowed' : 'bg-white dark:bg-white/5 dark:text-white'}`}
                                        >
                                            {GRADE_LEVELS.map(gl => (
                                                <option key={gl} value={gl}>{gl}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Section</label>
                                        <select 
                                            name="student_section" 
                                            value={formData.student_section || ''} 
                                            onChange={handleChange} 
                                            disabled={!!student || !!initialData?.student_section}
                                            className={`form-input ${(!!student || !!initialData?.student_section) ? 'bg-gray-100 dark:bg-white/10 dark:text-slate-200 cursor-not-allowed' : 'bg-white dark:bg-white/5 dark:text-white'}`}
                                        >
                                            <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Section</option>
                                            {sections
                                                .filter(s => {
                                                    const effectiveIsAdvisory = s.is_advisory ?? !s.is_teaching_load;
                                                    return effectiveIsAdvisory && s.section_grade_level === formData.grade_level;
                                                })
                                                .map((s) => (
                                                    <option key={s.id} value={s.section_name} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{s.section_name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    {isSHS && (
                                        <>
                                            <div className={isGrade11 ? "md:col-span-2" : ""}>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Track *</label>
                                                <select 
                                                    name="track" 
                                                    value={formData.track || ''} 
                                                    onChange={handleChange} 
                                                    required 
                                                    disabled={isTrackLocked}
                                                    className={`form-input ${isTrackLocked ? 'bg-gray-100 dark:bg-white/10 dark:text-slate-200 cursor-not-allowed' : 'bg-white dark:bg-white/5 dark:text-white'}`}
                                                >
                                                    <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Track</option>
                                                    {(isGrade11 ? ['Academic', 'TechPro'] : TRACKS).map((t) => (
                                                        <option key={t} value={t} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {isGrade11 && formData.track && (
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">SSHS Curriculum Cluster *</label>
                                                    <select 
                                                        name="cluster" 
                                                        value={formData.cluster || formData.strand || ''} 
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData(prev => ({ ...prev, cluster: val, strand: val }));
                                                        }} 
                                                        required 
                                                        disabled={isStrandLocked}
                                                        className={`form-input ${isStrandLocked ? 'bg-gray-100 dark:bg-white/10 dark:text-slate-200 cursor-not-allowed' : 'bg-white dark:bg-white/5 dark:text-white'}`}
                                                    >
                                                        <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Curriculum Cluster</option>
                                                        {getClustersForGrade11Track(formData.track).map((cluster) => (
                                                            <option key={cluster} value={cluster} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{cluster}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            {isGrade12 && (
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Strand *</label>
                                                    <select 
                                                        name="strand" 
                                                        value={formData.strand || ''} 
                                                        onChange={handleChange} 
                                                        required 
                                                        disabled={isStrandLocked}
                                                        className={`form-input ${isStrandLocked ? 'bg-gray-100 dark:bg-white/10 dark:text-slate-200 cursor-not-allowed' : 'bg-white dark:bg-white/5 dark:text-white'}`}
                                                    >
                                                        <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Strand</option>
                                                        {getStrandsForTrack(formData.track, formData.grade_level).map((s) => (
                                                            <option key={s} value={s} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Health Information (SF8) */}
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10">
                                <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                    Health Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Weight (kg)</label>
                                        <input
                                            type="number"
                                            name="weight"
                                            step="0.1"
                                            min="0"
                                            value={formData.weight || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Height (m)</label>
                                        <input
                                            type="number"
                                            name="height"
                                            step="0.01"
                                            min="0"
                                            value={formData.height || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 italic">Used for SF8 BMI calculations.</p>
                            </div>

                            {/* Eligibility Section (Grade Dependent) */}
                            {isElementary ? (
                                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10">
                                    <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                        Eligibility for Elementary Enrolment
                                    </h4>
                                    <div className="mb-4 p-3 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                                        <p className="text-sm font-semibold text-deped-blue dark:text-blue-300 mb-2 italic">Credential Presented for Grade 1:</p>
                                        <div className="flex flex-wrap gap-4">
                                            {[
                                                { id: 'kinder_progress_report', label: 'Kinder Progress Report' },
                                                { id: 'eccd_checklist', label: 'ECCD Checklist' },
                                                { id: 'kinder_completion_cert', label: 'Kindergarten Certificate of Completion' }
                                            ].map(item => (
                                                <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 dark:text-slate-200">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!formData[item.id as keyof Student]} 
                                                        onChange={(e) => setFormData(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                        className="w-4 h-4 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                    />
                                                    {item.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Name of School</label>
                                            <input type="text" name="elementary_school" value={formData.elementary_school || ''} onChange={handleChange} className="form-input" placeholder="Enter school name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">School ID</label>
                                            <input type="text" name="elementary_school_id" value={formData.elementary_school_id || ''} onChange={handleChange} className="form-input" placeholder="ID" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Address of School</label>
                                            <input type="text" name="elementary_school_address" value={formData.elementary_school_address || ''} onChange={handleChange} className="form-input" placeholder="Address" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">School Type</label>
                                            <select 
                                                name="elementary_school_type" 
                                                value={formData.elementary_school_type || ''} 
                                                onChange={handleChange} 
                                                className="form-input bg-white dark:bg-white/5 dark:text-white"
                                            >
                                                <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Type</option>
                                                <option value="Public" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Public</option>
                                                <option value="Private" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Private</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : isSHS ? (
                                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 space-y-6">
                                    <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                        Eligibility for SHS Enrolment
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Elementary School Completed Card */}
                                        <div className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:shadow-xs transition-shadow">
                                            <h5 className="font-bold mb-3 uppercase tracking-wider text-xs border-b border-gray-200 dark:border-white/10 pb-1.5 text-deped-blue/80 dark:text-blue-300">Elementary School Completed</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Name of Elementary Completed</label>
                                                    <input 
                                                        type="text" 
                                                        name="elementary_school" 
                                                        value={formData.elementary_school || ''} 
                                                        onChange={handleChange} 
                                                        className="form-input text-sm"
                                                        placeholder="Elementary School Name"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Address of School</label>
                                                    <input 
                                                        type="text" 
                                                        name="elementary_school_address" 
                                                        value={formData.elementary_school_address || ''} 
                                                        onChange={handleChange} 
                                                        className="form-input text-sm"
                                                        placeholder="School Address"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">School Type</label>
                                                    <select 
                                                        name="elementary_school_type" 
                                                        value={formData.elementary_school_type || ''} 
                                                        onChange={handleChange} 
                                                        className="form-input text-sm bg-white dark:bg-white/5 dark:text-white"
                                                    >
                                                        <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Type</option>
                                                        <option value="Public" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Public</option>
                                                        <option value="Private" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Private</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* HS Completer Card */}
                                        <div className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:shadow-xs transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_hs_completer"
                                                    checked={!!formData.is_hs_completer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_hs_completer: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800 dark:text-white">High School Completer *</span>
                                            </label>
                                            
                                            {formData.is_hs_completer && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pl-8">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Gen. Ave</label>
                                                        <input 
                                                            type="text" 
                                                            name="hs_gen_ave" 
                                                            value={formData.hs_gen_ave || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm" 
                                                            placeholder="00.00"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Date of Graduation/Completion (mm/dd/yyyy)</label>
                                                        <input 
                                                            type="text" 
                                                            name="hs_graduation_date" 
                                                            value={formData.hs_graduation_date || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm" 
                                                            placeholder="MM / DD / YYYY"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* JHS Completer Card */}
                                        <div className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:shadow-xs transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_jhs_completer"
                                                    checked={!!formData.is_jhs_completer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_jhs_completer: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800 dark:text-white">Junior High School Completer</span>
                                            </label>
                                            
                                            {formData.is_jhs_completer && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 pl-8">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Gen. Ave</label>
                                                        <input 
                                                            type="text" 
                                                            name="jhs_gen_ave" 
                                                            value={formData.jhs_gen_ave || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="00.00"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Date of Graduation (mm/dd/yyyy)</label>
                                                        <input 
                                                            type="text" 
                                                            name="jhs_graduation_date" 
                                                            value={formData.jhs_graduation_date || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="MM / DD / YYYY"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Name of School</label>
                                                        <input 
                                                            type="text" 
                                                            name="jhs_school_name" 
                                                            value={formData.jhs_school_name || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="School Name"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-3">
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">School Address</label>
                                                        <input 
                                                            type="text" 
                                                            name="jhs_school_address" 
                                                            value={formData.jhs_school_address || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="School Address"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">School Type</label>
                                                        <select 
                                                            name="jhs_school_type" 
                                                            value={formData.jhs_school_type || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm bg-white dark:bg-white/5 dark:text-white"
                                                        >
                                                            <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Type</option>
                                                            <option value="Public" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Public</option>
                                                            <option value="Private" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Private</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* PEPT Passer Card */}
                                        <div className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:shadow-xs transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_pept_passer"
                                                    checked={!!formData.is_pept_passer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_pept_passer: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800 dark:text-white">PEPT Passer **</span>
                                            </label>
                                            
                                            {formData.is_pept_passer && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pl-8">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Rating</label>
                                                        <input 
                                                            type="text" 
                                                            name="shs_pept_rating" 
                                                            value={formData.shs_pept_rating || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="Rating"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Date of Examination/Assessment (mm/dd/yyyy)</label>
                                                        <input 
                                                            type="text" 
                                                            name="shs_pept_date" 
                                                            value={formData.shs_pept_date || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="MM / DD / YYYY"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* ALS A&E Passer Card */}
                                        <div className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:shadow-xs transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_als_passer"
                                                    checked={!!formData.is_als_passer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_als_passer: e.target.checked, is_als: e.target.checked ? true : prev.is_als }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800 dark:text-white">ALS A&E Passer ***</span>
                                            </label>
                                            
                                            {formData.is_als_passer && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pl-8">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Rating</label>
                                                        <input 
                                                            type="text" 
                                                            name="shs_als_rating" 
                                                            value={formData.shs_als_rating || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="Rating"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Name & Address of CLC (Community Learning Center)</label>
                                                        <input 
                                                            type="text" 
                                                            name="shs_als_clc_name_address" 
                                                            value={formData.shs_als_clc_name_address || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="CLC Name & Address"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Others Card */}
                                        <div className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:shadow-xs transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_other_eligibility"
                                                    checked={!!formData.is_other_eligibility}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_other_eligibility: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800 dark:text-white">Others (Pls. Specify)</span>
                                            </label>
                                            
                                            {formData.is_other_eligibility && (
                                                <div className="mt-3 pl-8">
                                                    <label className="block text-xs font-semibold mb-1 text-deped-blue dark:text-blue-300">Specify Credential</label>
                                                    <input 
                                                        type="text" 
                                                        name="shs_other_credentials" 
                                                        value={formData.shs_other_credentials || ''} 
                                                        onChange={handleChange} 
                                                        className="form-input text-sm"
                                                        placeholder="Specify credential presented..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footnotes */}
                                    <div className="text-[10px] text-gray-500 dark:text-slate-400 space-y-1 border-t border-gray-200 dark:border-white/10 pt-4 mt-2">
                                        <p>* High School Completers are students who graduated from secondary school under the old curriculum</p>
                                        <p>** PEPT - Philippine Educational Placement Test for JHS</p>
                                        <p>*** ALS A&E - Alternative Learning System Accreditation and Equivalency Test for JHS</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10">
                                        <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                            Eligibility for Secondary Enrolment
                                        </h4>
                                        <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100/50 dark:border-white/10">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-4">Basis of SF10 Eligibility</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {[
                                                    { id: 'is_elem_completer', label: 'Elem. Completer' },
                                                    { id: 'is_pept_passer', label: 'PEPT Passer' },
                                                    { id: 'is_als_passer', label: 'ALS A&E Passer' },
                                                    { id: 'is_other_eligibility', label: 'Others' }
                                                ].map((item) => (
                                                    <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:bg-blue-50 dark:hover:bg-white/10 transition-colors group">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!formData[item.id as keyof Student]}
                                                            onChange={(e) => setFormData(prev => {
                                                                const nextState = { ...prev, [item.id]: e.target.checked };
                                                                if (item.id === 'is_als_passer') {
                                                                    nextState.is_als = e.target.checked ? true : prev.is_als;
                                                                    nextState.enrollment_type = e.target.checked ? 'ALS' : prev.enrollment_type;
                                                                }
                                                                return nextState;
                                                            })}
                                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                        <span className="text-sm font-bold text-gray-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">{item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Previous School Name</label>
                                                <input type="text" name="elementary_school" value={formData.elementary_school || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">School ID</label>
                                                <input type="text" name="elementary_school_id" value={formData.elementary_school_id || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">School Address</label>
                                                <input type="text" name="elementary_school_address" value={formData.elementary_school_address || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">School Type</label>
                                                <select 
                                                    name="elementary_school_type" 
                                                    value={formData.elementary_school_type || ''} 
                                                    onChange={handleChange} 
                                                    className="form-input bg-white dark:bg-white/5 dark:text-white"
                                                >
                                                    <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Type</option>
                                                    <option value="Public" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Public</option>
                                                    <option value="Private" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Private</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Gen. Average</label>
                                                <input type="text" name="average_grade" value={formData.average_grade || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Citation (if any)</label>
                                                <input type="text" name="citation" value={formData.citation || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Universal Other Credentials */}
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10">
                                        <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                            Other Credential Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">PEPT Rating</label>
                                                <input type="text" name="pept_rating" value={formData.pept_rating || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">ALS Rating</label>
                                                <input type="text" name="als_rating" value={formData.als_rating || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Others (Pls. Specify)</label>
                                                <input type="text" name="other_credentials" value={formData.other_credentials || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Date of Exam (mm/dd/yyyy)</label>
                                                <input type="text" name="pept_date" value={formData.pept_date || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Testing Center Address</label>
                                                <input type="text" name="testing_center" value={formData.testing_center || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Section: Credentials Checklist */}
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-150 dark:border-white/10 space-y-4">
                                        <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                            Document Credentials Checklist
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    name="req_birth_cert"
                                                    checked={!!formData.req_birth_cert} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, req_birth_cert: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">PSA Birth Certificate</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    name="req_report_card"
                                                    checked={!!formData.req_report_card} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, req_report_card: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Final Report Card (SF9)</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    name="req_sf10"
                                                    checked={!!formData.req_sf10} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, req_sf10: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Form 137 / SF10</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    name="req_good_moral"
                                                    checked={!!formData.req_good_moral} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, req_good_moral: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Good Moral Certificate</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    name="req_homeroom_guidance"
                                                    checked={!!formData.req_homeroom_guidance} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, req_homeroom_guidance: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Homeroom Guidance Form</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    name="req_brigada_eskwela"
                                                    checked={!!formData.req_brigada_eskwela} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, req_brigada_eskwela: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Brigada Eskwela Slip</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    name="req_beef"
                                                    checked={!!formData.req_beef} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, req_beef: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Enrolment Form (Annex 1)</span>
                                            </label>

                                            {isSHS && (
                                                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        name="req_undertaking"
                                                        checked={!!formData.req_undertaking} 
                                                        onChange={(e) => setFormData(prev => ({ ...prev, req_undertaking: e.target.checked }))}
                                                        className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Confirmation Slip</span>
                                                </label>
                                            )}

                                            <div className="col-span-1 md:col-span-2 border-t border-slate-200/60 dark:border-white/10 my-2 pt-2">
                                                <p className="text-xs font-bold text-deped-blue dark:text-blue-300 mb-2 uppercase tracking-wider">Enrollment Terms</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            name="req_1st_term"
                                                            checked={!!formData.req_1st_term} 
                                                            onChange={(e) => setFormData(prev => ({ ...prev, req_1st_term: e.target.checked }))}
                                                            className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                        />
                                                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">1st Term</span>
                                                    </label>
                                                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            name="req_2nd_term"
                                                            checked={!!formData.req_2nd_term} 
                                                            onChange={(e) => setFormData(prev => ({ ...prev, req_2nd_term: e.target.checked }))}
                                                            className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                        />
                                                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">2nd Term</span>
                                                    </label>
                                                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            name="req_3rd_term"
                                                            checked={!!formData.req_3rd_term} 
                                                            onChange={(e) => setFormData(prev => ({ ...prev, req_3rd_term: e.target.checked }))}
                                                            className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                        />
                                                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">3rd Term</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Additional Information */}
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-150 dark:border-white/10 space-y-4">
                                        <h4 className="text-lg font-bold text-deped-blue dark:text-blue-400 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                            Additional Profile Mapping Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-white/5 p-4 rounded-lg border border-gray-200 dark:border-white/10">
                                            {/* 4Ps Beneficiary Info */}
                                            <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-white/5 rounded-xl border border-slate-100/50 dark:border-white/10 flex flex-col justify-start">
                                                <span className="block text-sm font-semibold text-deped-blue dark:text-blue-300">4Ps Beneficiary?</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, is_4ps: true }))}
                                                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition-all border ${
                                                            formData.is_4ps 
                                                                ? 'bg-deped-blue text-white border-deped-blue shadow-xs' 
                                                                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
                                                        }`}
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, is_4ps: false, household_id: '' }))}
                                                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition-all border ${
                                                            !formData.is_4ps 
                                                                ? 'bg-deped-blue text-white border-deped-blue shadow-xs' 
                                                                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
                                                        }`}
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                                {formData.is_4ps && (
                                                    <div className="pt-2 animate-fade-in space-y-1">
                                                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Household ID Number</label>
                                                        <input 
                                                            type="text" 
                                                            name="household_id"
                                                            value={formData.household_id || ''} 
                                                            onChange={handleChange}
                                                            placeholder="Enter 4Ps Household ID"
                                                            className="form-input text-sm focus:ring-deped-blue"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Enrollment Type & Status */}
                                            <div className="space-y-4 p-4 bg-slate-50/50 dark:bg-white/5 rounded-xl border border-slate-100/50 dark:border-white/10 flex flex-col justify-start">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">Enrollment Type</label>
                                                    <select 
                                                        name="enrollment_type" 
                                                        value={formData.enrollment_type || 'Regular'} 
                                                        onChange={handleChange}
                                                        className="form-input bg-white dark:bg-white/5 dark:text-white text-sm focus:ring-deped-blue"
                                                    >
                                                        <option value="Regular" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Regular</option>
                                                        <option value="Irregular" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Irregular</option>
                                                        <option value="Transferee" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Transferee</option>
                                                        <option value="Balik-Aral" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Balik-Aral</option>
                                                        <option value="ALS" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Alternative Learning System (ALS)</option>
                                                    </select>
                                                </div>

                                                {(formData.enrollment_type === 'ALS' || formData.is_als) && (
                                                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-white/10 space-y-3 animate-fade-in mt-2">
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                name="is_als"
                                                                checked={formData.is_als || formData.enrollment_type === 'ALS'} 
                                                                onChange={(e) => setFormData(prev => ({ ...prev, is_als: e.target.checked, is_als_passer: e.target.checked ? true : prev.is_als_passer }))}
                                                                className="w-4 h-4 rounded border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                            />
                                                            <span className="font-semibold text-gray-800 dark:text-white text-xs">Confirm ALS Enrolled Status</span>
                                                        </label>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold mb-1 text-deped-blue dark:text-blue-300">ALS Center Address</label>
                                                            <input 
                                                                type="text" 
                                                                name="als_center_address"
                                                                value={formData.als_center_address || ''} 
                                                                onChange={handleChange}
                                                                placeholder="CLC Name/Address"
                                                                className="form-input text-xs bg-white dark:bg-white/5 dark:text-white focus:ring-deped-blue"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* First Day of Attendance */}
                                            <div className="space-y-4 p-4 bg-slate-50/50 dark:bg-white/5 rounded-xl border border-slate-100/50 dark:border-white/10 flex flex-col justify-start">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2 text-deped-blue dark:text-blue-300">First Day of Attendance</label>
                                                    <input 
                                                        type="date" 
                                                        name="first_day_attendance"
                                                        value={formData.first_day_attendance || ''} 
                                                        onChange={handleChange}
                                                        className="form-input text-sm bg-white dark:bg-white/5 dark:text-white focus:ring-deped-blue"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-white/10 sticky bottom-0 bg-white dark:bg-[#0d1225] p-2 z-10">
                        <button type="button" onClick={onClose} className="px-6 py-2 border-2 border-gray-300 dark:border-white/20 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-50 min-w-35 rounded-xl cursor-pointer shadow-md">
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : student ? 'Update Student' : 'Add Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
