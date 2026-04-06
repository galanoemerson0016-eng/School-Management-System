import { useState, useEffect, type FormEvent } from 'react';
import { useAppStore } from '../../stores';
import type { Student } from '../../types';

interface StudentFormProps {
    student: Student | null;
    onClose: () => void;
    initialData?: Partial<Student>;
}

const GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const TRACKS = ['Academic', 'TVL', 'Sports', 'Arts and Design'];

const STRANDS: Record<string, string[]> = {
    Academic: ['STEM', 'ABM', 'HUMSS', 'GAS'],
    TVL: ['Home Economics', 'Agri-Fishery Arts', 'Industrial Arts', 'ICT'],
    Sports: ['Sports Track'],
    'Arts and Design': ['Arts and Design Track'],
};

export function StudentForm({ student, onClose, initialData }: StudentFormProps) {
    const { addStudent, updateStudent, sections } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);

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
        grade_level: '',
        student_section: '',
        track: '',
        strand: '',
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
            setFormData(student);
        } else if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData
            }));
        }
    }, [student, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validate LRN
        if (!formData.lrn || !/^\d{12}$/.test(formData.lrn)) {
            alert('LRN must be exactly 12 digits');
            setIsLoading(false);
            return;
        }

        const studentData: Student = {
            lrn: formData.lrn!,
            first_name: formData.first_name!,
            last_name: formData.last_name!,
            middle_name: formData.middle_name,
            name_extension: formData.name_extension,
            gender: formData.gender as 'Male' | 'Female',
            birthday: formData.birthday!,
            age: formData.age!,
            address: formData.address!,
            contact_number: formData.contact_number,
            grade_level: formData.grade_level!,
            student_section: formData.student_section,
            track: formData.track,
            strand: formData.strand,
            enrollment_date: student?.enrollment_date || new Date().toISOString(),
        };

        // Remove artificial delay
        // await new Promise((resolve) => setTimeout(resolve, 300));

        try {
            if (student) {
                await updateStudent(student.lrn, studentData);
            } else {
                await addStudent(studentData);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save student:", error);
            alert("Error saving student: " + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSections = sections.filter((s) => s.section_grade_level === formData.grade_level);
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
                                    pattern="[0-9]{12}"
                                    maxLength={12}
                                    required
                                    placeholder="123456789012"
                                    className="form-input"
                                />
                            </div>
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
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Gender *</label>
                                <select name="gender" value={formData.gender || ''} onChange={handleChange} required className="form-input">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
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
                        </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                        <h4 className="text-lg font-bold text-deped-blue mb-4">Academic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Grade Level *</label>
                                <select name="grade_level" value={formData.grade_level} onChange={handleChange} required className="form-input">
                                    <option value="">Select Grade Level</option>
                                    {GRADE_LEVELS.map((g) => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Section</label>
                                <select name="student_section" value={formData.student_section || ''} onChange={handleChange} className="form-input">
                                    <option value="">Select Section</option>
                                    {filteredSections.map((s) => (
                                        <option key={s.id} value={s.section_name}>{s.section_name}</option>
                                    ))}
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

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-50">
                            {isLoading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
