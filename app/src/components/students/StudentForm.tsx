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

const GRADE_LEVELS = ['Grade 7'];

const TRACKS = ['Academic', 'TVL', 'Sports', 'Arts and Design'];

const STRANDS: Record<string, string[]> = {
    Academic: ['STEM', 'ABM', 'HUMSS', 'GAS'],
    TVL: ['Home Economics', 'Agri-Fishery Arts', 'Industrial Arts', 'ICT'],
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
        grade_level: 'Grade 7',
        student_section: '',
        track: '',
        strand: '',
        // SF10 Eligibility Info
        elementary_school: '',
        elementary_school_id: '',
        elementary_school_address: '',
        average_grade: '',
        citation: '',
        pept_rating: '',
        pept_date: '',
        als_rating: '',
        testing_center: '',
        other_credentials: '',
        eligibility_type: 'Elementary',
        is_elem_completer: true,
        is_pept_passer: false,
        is_als_passer: false,
        is_other_eligibility: false,
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
            setFormData({
                ...student,
                is_elem_completer: student.is_elem_completer ?? !!(student.elementary_school || '').trim(),
                is_pept_passer: student.is_pept_passer ?? false,
                is_als_passer: student.is_als_passer ?? false,
                is_other_eligibility: student.is_other_eligibility ?? false,
            });
        } else if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData
            }));
        }
    }, [student, initialData]);

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

        setFormData((prev) => ({
            ...prev,
            ...pendingProfile,
            lrn: prev.lrn,
            grade_level: prev.grade_level || pendingProfile.grade_level || '',
            student_section: prev.student_section || '',
            weight: prev.weight ?? pendingProfile.weight ?? '',
            height: prev.height ?? pendingProfile.height ?? '',
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
            average_grade: formData.average_grade || '',
            citation: formData.citation || '',
            pept_rating: formData.pept_rating || '',
            pept_date: formData.pept_date || '',
            als_rating: formData.als_rating || '',
            testing_center: formData.testing_center || '',
            other_credentials: formData.other_credentials || '',
            eligibility_type: formData.eligibility_type || 'Elementary',
            is_elem_completer: formData.is_elem_completer ?? false,
            is_pept_passer: formData.is_pept_passer ?? false,
            is_als_passer: formData.is_als_passer ?? false,
            is_other_eligibility: formData.is_other_eligibility ?? false,
        };

        // Remove artificial delay
        // await new Promise((resolve) => setTimeout(resolve, 300));

        try {
            const savePromise = student
                ? updateStudent(student.lrn, studentData)
                : addStudent(studentData);

            const result = await Promise.race<"resolved" | "verified" | "timeout">([
                savePromise.then(() => 'resolved'),
                waitForStudentPersistence(studentData).then((ok) => ok ? 'verified' : 'timeout')
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

    const isSeniorHigh = formData.grade_level === 'Grade 11' || formData.grade_level === 'Grade 12';

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
                                            // Switch to date picker only when focused
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
                                            className="form-input bg-gray-100 cursor-not-allowed"
                                            disabled
                                        >
                                            <option value="Grade 7">Grade 7</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Section</label>
                                        <select name="student_section" value={formData.student_section || ''} onChange={handleChange} className="form-input">
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

                                    {/* Track & Strand for Senior High */}
                                    {isSeniorHigh && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Track *</label>
                                                <select name="track" value={formData.track || ''} onChange={handleChange} required className="form-input">
                                                    <option value="">Select Track</option>
                                                    {TRACKS.map((t) => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Strand *</label>
                                                <select name="strand" value={formData.strand || ''} onChange={handleChange} required className="form-input">
                                                    <option value="">Select Strand</option>
                                                    {formData.track && STRANDS[formData.track]?.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Health Information */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h4 className="text-lg font-bold text-deped-blue mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-gradient-to-b from-deped-blue to-blue-400 rounded-full" />
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
                                <p className="mt-2 text-xs text-gray-500">
                                    These fields are used by SF8 to calculate BMI, BMI category, and height-for-age.
                                </p>
                            </div>

                            {/* Eligibility for JHS Enrolment */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h4 className="text-lg font-bold text-deped-blue mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-gradient-to-b from-deped-blue to-blue-400 rounded-full" />
                                    Eligibility for JHS Enrolment
                                </h4>
                                
                                <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-800 mb-4">Basis of SF10 Eligibility (Check to appear on SF10)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { id: 'is_elem_completer', label: 'Elem. Completer' },
                                            { id: 'is_pept_passer', label: 'PEPT Passer' },
                                            { id: 'is_als_passer', label: 'ALS A&E Passer' },
                                            { id: 'is_other_eligibility', label: 'Others' }
                                        ].map((item) => (
                                            <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors group">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        name={item.id}
                                                        checked={!!(formData as any)[item.id]}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Name of Elementary School</label>
                                        <input
                                            type="text"
                                            name="elementary_school"
                                            value={formData.elementary_school || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">School ID</label>
                                        <input
                                            type="text"
                                            name="elementary_school_id"
                                            value={formData.elementary_school_id || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1 text-deped-blue">Address of School</label>
                                        <input
                                            type="text"
                                            name="elementary_school_address"
                                            value={formData.elementary_school_address || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">General Average</label>
                                        <input
                                            type="text"
                                            name="average_grade"
                                            value={formData.average_grade || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Citation (if any)</label>
                                        <input
                                            type="text"
                                            name="citation"
                                            value={formData.citation || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Other Credentials Presented */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h4 className="text-lg font-bold text-deped-blue mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-gradient-to-b from-deped-blue to-blue-400 rounded-full" />
                                    Other Credentials Presented
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">PEPT Rating</label>
                                        <input
                                            type="text"
                                            name="pept_rating"
                                            value={formData.pept_rating || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">ALS Rating</label>
                                        <input
                                            type="text"
                                            name="als_rating"
                                            value={formData.als_rating || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Others (Pls. Specify)</label>
                                        <input
                                            type="text"
                                            name="other_credentials"
                                            value={formData.other_credentials || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Date of Exam (mm/dd/yyyy)</label>
                                        <input
                                            type="text"
                                            name="pept_date"
                                            value={formData.pept_date || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Testing Center Name and Address</label>
                                        <input
                                            type="text"
                                            name="testing_center"
                                            value={formData.testing_center || ''}
                                            onChange={handleChange}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}


                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-50">
                            {saveStatus === 'saving'
                                ? 'Saving...'
                                : saveStatus === 'saved'
                                    ? 'Saved'
                                    : student
                                        ? 'Update Student'
                                        : 'Add Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
