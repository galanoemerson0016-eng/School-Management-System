import { useState, useEffect, type FormEvent } from 'react';
import { useAppStore } from '../../stores';
import type { Student } from '../../types';
import { db } from '../../services/database';
import { ConfirmationModal } from '../ui/ConfirmationModal';

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

const TRACKS = ['Academic', 'TVL', 'Sports', 'Arts and Design'];

const STRAND_MAPPING: Record<string, string> = {
    'STEM': 'Science, Technology, Engineering, and Mathematics',
    'ABM': 'Accountancy, Business, and Management',
    'HUMSS': 'Humanities and Social Sciences',
    'GAS': 'General Academic Strand',
    'ICT': 'Information and Communications Technology'
};

const STRANDS: Record<string, string[]> = {
    Academic: [
        'Science, Technology, Engineering, and Mathematics',
        'Accountancy, Business, and Management',
        'Humanities and Social Sciences',
        'General Academic Strand'
    ],
    TVL: [
        'Home Economics',
        'Agri-Fishery Arts',
        'Industrial Arts',
        'Information and Communications Technology'
    ],
    Sports: ['Sports Track'],
    'Arts and Design': ['Arts and Design Track'],
};

export function StudentForm({ student, onClose, initialData, isSimplified = false }: StudentFormProps) {
    const { addStudent, updateStudent, sections } = useAppStore();
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
        jhs_graduation_date: '',
        shs_pept_rating: '',
        shs_pept_date: '',
        shs_als_rating: '',
        shs_als_clc_name_address: '',
        shs_other_credentials: '',
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

        // Auto-sync Grade Level when Section changes
        if (name === 'student_section' && value) {
            const sectionObj = sections.find(s => s.section_name === value || s.id === value);
            if (sectionObj) {
                setFormData(prev => ({ 
                    ...prev, 
                    student_section: value, 
                    grade_level: sectionObj.section_grade_level 
                }));
                return;
            }
        }

        setFormData((prev) => ({ ...prev, [name]: value }));

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

        // Validate LRN
        if (!formData.lrn || !/^\d{12}$/.test(formData.lrn)) {
            alert('LRN must be exactly 12 digits');
            setIsLoading(false);
            setSaveStatus('idle');
            return;
        }

        const studentData: Student = {
            lrn: formData.lrn!,
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
            track: formData.track || '',
            strand: formData.strand || '',
            enrollment_date: student?.enrollment_date || new Date().toISOString(),
            // SF10 Fields
            elementary_school: formData.elementary_school || '',
            elementary_school_id: formData.elementary_school_id || '',
            elementary_school_address: formData.elementary_school_address || '',
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
            jhs_graduation_date: formData.jhs_graduation_date || '',
            shs_pept_rating: formData.shs_pept_rating || '',
            shs_pept_date: formData.shs_pept_date || '',
            shs_als_rating: formData.shs_als_rating || '',
            shs_als_clc_name_address: formData.shs_als_clc_name_address || '',
            shs_other_credentials: formData.shs_other_credentials || '',
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

    const gradeInt = parseInt(formData.grade_level?.match(/\d+/)?.[0] || '0');
    const isElementary = gradeInt >= 1 && gradeInt <= 6;
    const isSHS = gradeInt >= 11 && gradeInt <= 12;
    const isGrade11 = gradeInt === 11;
    const isGrade12 = gradeInt === 12;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center sticky top-0">
                    <h3 className="text-xl font-bold">{student ? 'Edit Student' : 'Add New Student'}</h3>
                    <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h4 className="text-lg font-bold text-deped-blue mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">LRN (12 digits) *</label>
                                <input
                                    type="text"
                                    name="lrn"
                                    value={formData.lrn}
                                    onChange={handleChange}
                                    onBlur={() => {
                                        void tryHydrateFromHistory();
                                    }}
                                    pattern="[0-9]{12}"
                                    maxLength={12}
                                    required
                                    placeholder="123456789012"
                                    className="form-input"
                                />
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
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Last Name *</label>
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
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">First Name *</label>
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
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Middle Name</label>
                                <input
                                    type="text"
                                    name="middle_name"
                                    value={formData.middle_name}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                            {!isSimplified && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-deped-blue">Name Extension (Jr, I, II)</label>
                                    <input
                                        type="text"
                                        name="name_extension"
                                        value={formData.name_extension || ''}
                                        onChange={handleChange}
                                        placeholder="Jr, I, II"
                                        className="form-input text-center"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Gender *</label>
                                <select name="gender" value={formData.gender || ''} onChange={handleChange} required className="form-input">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            {!isSimplified && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Birthday *</label>
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
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Age</label>
                                        <input type="number" name="age" value={formData.age} readOnly className="form-input bg-gray-100" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Contact Number</label>
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
                                            <label className="block text-sm font-semibold mb-2 text-deped-blue">Date of SHS Admission (mm/dd/yyyy)</label>
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
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Address *</label>
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
                            {/* Academic Information */}
                            <div>
                                <h4 className="text-lg font-bold text-deped-blue mb-4">Academic Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Grade Level *</label>
                                        <select 
                                            name="grade_level" 
                                            value={formData.grade_level} 
                                            onChange={handleChange} 
                                            required 
                                            disabled={!!student || !!initialData?.student_section}
                                            className={`form-input ${(!!student || !!initialData?.student_section) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                        >
                                            {GRADE_LEVELS.map(gl => (
                                                <option key={gl} value={gl}>{gl}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Section</label>
                                        <select 
                                            name="student_section" 
                                            value={formData.student_section || ''} 
                                            onChange={handleChange} 
                                            disabled={!!student || !!initialData?.student_section}
                                            className={`form-input ${(!!student || !!initialData?.student_section) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                        >
                                            <option value="">Select Section</option>
                                            {sections
                                                .filter(s => {
                                                    const effectiveIsAdvisory = s.is_advisory ?? !s.is_teaching_load;
                                                    return effectiveIsAdvisory && s.section_grade_level === formData.grade_level;
                                                })
                                                .map((s) => (
                                                    <option key={s.id} value={s.section_name}>{s.section_name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    {isSHS && (
                                        <>
                                            <div className={isGrade11 ? "md:col-span-2" : ""}>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Track *</label>
                                                <select name="track" value={formData.track || ''} onChange={handleChange} required className="form-input">
                                                    <option value="">Select Track</option>
                                                    {(isGrade11 ? ['Academic', 'TechPro'] : TRACKS).map((t) => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {isGrade12 && (
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2 text-deped-blue">Strand *</label>
                                                    <select name="strand" value={formData.strand || ''} onChange={handleChange} required className="form-input">
                                                        <option value="">Select Strand</option>
                                                        {formData.track && STRANDS[formData.track]?.map((s) => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Health Information (SF8) */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h4 className="text-lg font-bold text-deped-blue mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                    Health Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Weight (kg)</label>
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
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Height (m)</label>
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
                                <p className="mt-2 text-xs text-gray-500 italic">Used for SF8 BMI calculations.</p>
                            </div>

                            {/* Eligibility Section (Grade Dependent) */}
                            {isElementary ? (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-lg font-bold text-deped-blue mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                        Eligibility for Elementary Enrolment
                                    </h4>
                                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-100">
                                        <p className="text-sm font-semibold text-deped-blue mb-2 italic">Credential Presented for Grade 1:</p>
                                        <div className="flex flex-wrap gap-4">
                                            {[
                                                { id: 'kinder_progress_report', label: 'Kinder Progress Report' },
                                                { id: 'eccd_checklist', label: 'ECCD Checklist' },
                                                { id: 'kinder_completion_cert', label: 'Kindergarten Certificate of Completion' }
                                            ].map(item => (
                                                <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="block text-sm font-semibold mb-2 text-deped-blue">Name of School</label>
                                            <input type="text" name="elementary_school" value={formData.elementary_school || ''} onChange={handleChange} className="form-input" placeholder="Enter school name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-deped-blue">School ID</label>
                                            <input type="text" name="elementary_school_id" value={formData.elementary_school_id || ''} onChange={handleChange} className="form-input" placeholder="ID" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1 text-deped-blue">Address of School</label>
                                            <input type="text" name="elementary_school_address" value={formData.elementary_school_address || ''} onChange={handleChange} className="form-input" placeholder="Address" />
                                        </div>
                                    </div>
                                </div>
                            ) : isSHS ? (
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                                    <h4 className="text-lg font-bold text-deped-blue mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                        Eligibility for SHS Enrolment
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 gap-6">
                                        {/* HS Completer Card */}
                                        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_hs_completer"
                                                    checked={!!formData.is_hs_completer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_hs_completer: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800">High School Completer *</span>
                                            </label>
                                            
                                            {formData.is_hs_completer && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pl-8">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">Gen. Ave</label>
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
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">Date of Graduation/Completion (mm/dd/yyyy)</label>
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
                                        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_jhs_completer"
                                                    checked={!!formData.is_jhs_completer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_jhs_completer: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800">Junior High School Completer</span>
                                            </label>
                                            
                                            {formData.is_jhs_completer && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 pl-8">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">Gen. Ave</label>
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
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">Date of Graduation (mm/dd/yyyy)</label>
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
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">Name of School</label>
                                                        <input 
                                                            type="text" 
                                                            name="jhs_school_name" 
                                                            value={formData.jhs_school_name || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="School Name"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-4">
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">School Address</label>
                                                        <input 
                                                            type="text" 
                                                            name="jhs_school_address" 
                                                            value={formData.jhs_school_address || ''} 
                                                            onChange={handleChange} 
                                                            className="form-input text-sm"
                                                            placeholder="School Address"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* PEPT Passer Card */}
                                        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_pept_passer"
                                                    checked={!!formData.is_pept_passer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_pept_passer: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800">PEPT Passer **</span>
                                            </label>
                                            
                                            {formData.is_pept_passer && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pl-8">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">Rating</label>
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
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">Date of Examination/Assessment (mm/dd/yyyy)</label>
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
                                        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_als_passer"
                                                    checked={!!formData.is_als_passer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_als_passer: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800">ALS A&E Passer ***</span>
                                            </label>
                                            
                                            {formData.is_als_passer && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pl-8">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">Rating</label>
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
                                                        <label className="block text-xs font-semibold mb-1 text-deped-blue">Name & Address of CLC (Community Learning Center)</label>
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
                                        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_other_eligibility"
                                                    checked={!!formData.is_other_eligibility}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_other_eligibility: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                                />
                                                <span className="font-bold text-gray-800">Others (Pls. Specify)</span>
                                            </label>
                                            
                                            {formData.is_other_eligibility && (
                                                <div className="mt-3 pl-8">
                                                    <label className="block text-xs font-semibold mb-1 text-deped-blue">Specify Credential</label>
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
                                    <div className="text-[10px] text-gray-500 space-y-1 border-t border-gray-200 pt-4 mt-2">
                                        <p>* High School Completers are students who graduated from secondary school under the old curriculum</p>
                                        <p>** PEPT - Philippine Educational Placement Test for JHS</p>
                                        <p>*** ALS A&E - Alternative Learning System Accreditation and Equivalency Test for JHS</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h4 className="text-lg font-bold text-deped-blue mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                            Eligibility for Secondary Enrolment
                                        </h4>
                                        <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-blue-800 mb-4">Basis of SF10 Eligibility</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {[
                                                    { id: 'is_elem_completer', label: 'Elem. Completer' },
                                                    { id: 'is_pept_passer', label: 'PEPT Passer' },
                                                    { id: 'is_als_passer', label: 'ALS A&E Passer' },
                                                    { id: 'is_other_eligibility', label: 'Others' }
                                                ].map((item) => (
                                                    <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors group">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!formData[item.id as keyof Student]}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                        <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">{item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Previous School Name</label>
                                                <input type="text" name="elementary_school" value={formData.elementary_school || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">School ID</label>
                                                <input type="text" name="elementary_school_id" value={formData.elementary_school_id || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-1 text-deped-blue">School Address</label>
                                                <input type="text" name="elementary_school_address" value={formData.elementary_school_address || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Gen. Average</label>
                                                <input type="text" name="average_grade" value={formData.average_grade || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Citation (if any)</label>
                                                <input type="text" name="citation" value={formData.citation || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Universal Other Credentials */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h4 className="text-lg font-bold text-deped-blue mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-linear-to-b from-deped-blue to-blue-400 rounded-full" />
                                            Other Credential Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">PEPT Rating</label>
                                                <input type="text" name="pept_rating" value={formData.pept_rating || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">ALS Rating</label>
                                                <input type="text" name="als_rating" value={formData.als_rating || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Others (Pls. Specify)</label>
                                                <input type="text" name="other_credentials" value={formData.other_credentials || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Date of Exam (mm/dd/yyyy)</label>
                                                <input type="text" name="pept_date" value={formData.pept_date || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Testing Center Address</label>
                                                <input type="text" name="testing_center" value={formData.testing_center || ''} onChange={handleChange} className="form-input" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white">
                        <button type="button" onClick={onClose} className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-50 min-w-[140px]">
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : student ? 'Update Student' : 'Add Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
