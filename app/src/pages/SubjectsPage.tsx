import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Subject, User, Section } from '../types';

export function SubjectsPage() {
    const { subjects, sections, addSubject, deleteSubject, updateSubject } = useAppStore(); // Ensure updateSubject is available
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    // View State
    const [viewMode, setViewMode] = useState<'grades' | 'sections' | 'subjects'>('grades');
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

    // Data State
    const [teachers, setTeachers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        subject_name: '',
        subject_code: '',
        grade_level: '',
        section_id: '',
        teacher_id: ''
    });
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

    // Fetch teachers
    useEffect(() => {
        const fetchTeachers = async () => {
            const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
            const snapshot = await getDocs(q);
            const fetchedTeachers = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            })) as User[];
            setTeachers(fetchedTeachers);
        };
        fetchTeachers();
    }, []);

    // Derived Data
    const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

    const filteredSections = useMemo(() => {
        if (!selectedGrade) return [];
        return sections.filter(s => s.section_grade_level === selectedGrade);
    }, [sections, selectedGrade]);

    const selectedSection = useMemo(() => {
        return sections.find(s => s.id === selectedSectionId);
    }, [sections, selectedSectionId]);

    const filteredSubjects = useMemo(() => {
        if (!selectedSectionId) return [];
        return subjects.filter(s => s.section_id === selectedSectionId);
    }, [subjects, selectedSectionId]);

    // Handlers
    const handleGradeClick = (grade: string) => {
        setSelectedGrade(grade);
        setViewMode('sections');
    };

    const handleSectionClick = (sectionId: string) => {
        setSelectedSectionId(sectionId);
        setViewMode('subjects');
    };

    const handleBackToGrades = () => {
        setSelectedGrade(null);
        setViewMode('grades');
    };

    const handleBackToSections = () => {
        setSelectedSectionId(null);
        setViewMode('sections');
    };

    const openAddModal = () => {
        setEditingSubjectId(null);
        setFormData({
            subject_name: '',
            subject_code: '',
            grade_level: selectedGrade || '',
            section_id: selectedSectionId || '',
            teacher_id: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (subject: Subject) => {
        setEditingSubjectId(subject.id);
        setFormData({
            subject_name: subject.subject_name,
            subject_code: subject.subject_code || '',
            grade_level: subject.grade_level,
            section_id: subject.section_id || '',
            teacher_id: subject.teacher_id || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const subjectData: Subject = {
            id: editingSubjectId || `subject-${Date.now()}`,
            subject_name: formData.subject_name,
            subject_code: formData.subject_code,
            grade_level: formData.grade_level,
            section_id: formData.section_id || undefined,
            teacher_id: formData.teacher_id || undefined
        };

        if (editingSubjectId) {
            await updateSubject(subjectData);
        } else {
            await addSubject(subjectData);
        }

        setIsModalOpen(false);
    };

    // Standard Subjects Configuration (Based on User Input)
    const standardSubjects = {
        'Grade 7': [
            { name: 'Filipino', code: '' },
            { name: 'English', code: '' },
            { name: 'Mathematics', code: '' },
            { name: 'Science', code: '' },
            { name: 'Araling Panlipunan', code: '' },
            { name: 'Values Education', code: '' },
            { name: 'Technology and Livelihood Education', code: '' },
            { name: 'Music and Arts', code: 'MAPEH' },
            { name: 'Physical Education and Health', code: 'MAPEH' }
        ],
        'Grade 8': [
            { name: 'Filipino', code: '' },
            { name: 'English', code: '' },
            { name: 'Mathematics', code: '' },
            { name: 'Science', code: '' },
            { name: 'Araling Panlipunan', code: '' },
            { name: 'Values Education', code: '' },
            { name: 'Technology and Livelihood Education', code: '' },
            { name: 'Music and Arts', code: 'MAPEH' },
            { name: 'Physical Education and Health', code: 'MAPEH' }
        ],
        'Grade 9': [
            { name: 'Filipino', code: '' },
            { name: 'English', code: '' },
            { name: 'Mathematics', code: '' },
            { name: 'Science', code: '' },
            { name: 'Araling Panlipunan', code: '' },
            { name: 'Values Education', code: '' },
            { name: 'Technology and Livelihood Education', code: '' },
            { name: 'Music and Arts', code: 'MAPEH' },
            { name: 'Physical Education and Health', code: 'MAPEH' }
        ],
        'Grade 10': [
            { name: 'Filipino', code: '' },
            { name: 'English', code: '' },
            { name: 'Mathematics', code: '' },
            { name: 'Science', code: '' },
            { name: 'Araling Panlipunan', code: '' },
            { name: 'Edukasyon sa Pagpapakatao', code: '' },
            { name: 'Technology and Livelihood Education', code: '' },
            { name: 'Music', code: 'MAPEH' },
            { name: 'Arts', code: 'MAPEH' },
            { name: 'Physical Education', code: 'MAPEH' },
            { name: 'Health', code: 'MAPEH' }
        ]
    };

    const handleLoadStandardSubjects = async () => {
        if (!selectedSection || !selectedGrade) return;

        const templates = standardSubjects[selectedGrade as keyof typeof standardSubjects];
        if (!templates) {
            alert(`No standard subjects defined for ${selectedGrade}`);
            return;
        }

        if (!confirm(`Add ${templates.length} standard subjects to ${selectedSection.section_name}?`)) return;

        try {
            for (const template of templates) {
                const newSubject: Subject = {
                    id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    subject_name: template.name,
                    subject_code: template.code,
                    grade_level: selectedGrade,
                    section_id: selectedSection.id,
                    // teacher_id: null // Firestore handles null better than undefined, or just omit if optional
                };
                await addSubject(newSubject);
            }
            alert("Subjects added successfully!");
        } catch (error) {
            console.error("Error adding subjects:", error);
            alert("Failed to add some subjects. Please try again.");
        }
    };

    // Helper to get teacher name
    const getTeacherName = (id?: string) => {
        if (!id) return 'Unassigned';
        const t = teachers.find(teacher => teacher.uid === id);
        return t ? t.displayName : 'Unknown';
    };

    // Helper for Grade Colors
    const getGradeColor = (grade: string) => {
        if (grade.includes('7')) return 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
        if (grade.includes('8')) return 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100';
        if (grade.includes('9')) return 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100';
        if (grade.includes('10')) return 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100';
        return 'text-gray-700 bg-gray-50 border-gray-200';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {viewMode === 'grades' && 'Manage Subjects - Grade Levels'}
                        {viewMode === 'sections' && `Sections in ${selectedGrade}`}
                        {viewMode === 'subjects' && `Subjects - ${selectedSection?.section_name}`}
                    </h2>
                    <p className="text-gray-500">
                        {viewMode === 'grades' && 'Select a grade level to view sections.'}
                        {viewMode === 'sections' && 'Select a section to manage subjects.'}
                        {viewMode === 'subjects' && 'Manage subjects and assign teachers.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {viewMode === 'sections' && (
                        <button onClick={handleBackToGrades} className="btn-secondary">
                            ⬅ Back to Grades
                        </button>
                    )}
                    {viewMode === 'subjects' && (
                        <button onClick={handleBackToSections} className="btn-secondary">
                            ⬅ Back to Sections
                        </button>
                    )}
                    {viewMode === 'subjects' && isAdmin && (
                        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                            <span>➕</span> Add Subject
                        </button>
                    )}
                </div>
            </div>

            {/* View: Grades */}
            {viewMode === 'grades' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {grades.map((grade) => (
                        <div
                            key={grade}
                            onClick={() => handleGradeClick(grade)}
                            className={`cursor-pointer rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between h-40 ${getGradeColor(grade)}`}
                        >
                            <h3 className="text-2xl font-bold">{grade}</h3>
                            <p className="text-sm opacity-80 font-medium">View Sections</p>
                        </div>
                    ))}
                </div>
            )}

            {/* View: Sections */}
            {viewMode === 'sections' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredSections.length === 0 ? (
                        <div className="col-span-3 text-center py-12 text-gray-500">
                            No sections found for {selectedGrade}. Please create sections in the "Classes" page first.
                        </div>
                    ) : (
                        filteredSections.map((section) => (
                            <div
                                key={section.id}
                                onClick={() => handleSectionClick(section.id)}
                                className="p-6 bg-white rounded-lg shadow-sm border hover:border-deped-blue cursor-pointer transition-all group"
                            >
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-deped-blue">{section.section_name}</h3>
                                <p className="text-sm text-gray-500">{section.section_room || 'No Room'}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* View: Subjects */}
            {viewMode === 'subjects' && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {filteredSubjects.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="mb-4">No subjects assigned to this section yet.</p>
                            {isAdmin && (
                                <button onClick={handleLoadStandardSubjects} className="btn-primary">
                                    📚 Load Standard {selectedGrade} Subjects
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Teacher</th>
                                        {isAdmin && <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSubjects.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{subject.subject_name}</div>
                                                {subject.subject_code && <div className="text-sm text-gray-500">{subject.subject_code}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subject.teacher_id ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {getTeacherName(subject.teacher_id)}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(subject)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSubject(subject.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
                            <h3 className="text-xl font-bold">{editingSubjectId ? 'Edit Subject' : 'Add Subject'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                                <input
                                    type="text"
                                    value={formData.subject_name}
                                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                                    className="form-input mt-1 block w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject Code (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.subject_code}
                                    onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                                    className="form-input mt-1 block w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assigned Teacher</label>
                                <select
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                    className="form-input mt-1 block w-full"
                                >
                                    <option value="">Unassigned</option>
                                    {teachers.map((t) => (
                                        <option key={t.uid} value={t.uid}>{t.displayName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {editingSubjectId ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
