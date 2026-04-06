import { useState, useEffect, type FormEvent } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Section, User } from '../types';

export function ClassesPage() {
    const { sections, addSection, deleteSection, updateSection } = useAppStore();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        section_name: '',
        section_grade_level: '',
        section_room: '',
        adviser_id: ''
    });
    const [teachers, setTeachers] = useState<User[]>([]);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

    // Fetch teachers for dropdown
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const sectionData: Section = {
            id: editingSectionId || `section-${Date.now()}`,
            section_name: formData.section_name,
            section_grade_level: formData.section_grade_level,
            section_room: formData.section_room,
            adviser_id: formData.adviser_id || undefined
        };

        if (editingSectionId) {
            await updateSection(sectionData);
        } else {
            await addSection(sectionData);
        }

        handleCloseModal();
    };

    const handleEdit = (section: Section) => {
        setEditingSectionId(section.id);
        setFormData({
            section_name: section.section_name,
            section_grade_level: section.section_grade_level,
            section_room: section.section_room || '',
            adviser_id: section.adviser_id || ''
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setFormData({ section_name: '', section_grade_level: '', section_room: '', adviser_id: '' });
        setEditingSectionId(null);
        setIsModalOpen(false);
    };

    const getAdviserName = (adviserId?: string) => {
        if (!adviserId) return 'TBA';
        const teacher = teachers.find(t => t.uid === adviserId);
        return teacher ? teacher.displayName : 'Unknown';
    };

    // Group sections by grade level
    const sectionsByGrade: Record<string, Section[]> = {};
    sections.forEach((section) => {
        const grade = section.section_grade_level || 'Not Set';
        if (!sectionsByGrade[grade]) sectionsByGrade[grade] = [];
        sectionsByGrade[grade].push(section);
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                {isAdmin && (
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center space-x-2">
                        <span>➕</span>
                        <span>Add Section</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-deped-blue text-white">
                    <h3 className="text-lg font-bold">Class Sections ({sections.length})</h3>
                </div>

                {sections.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📖</div>
                        <p className="text-gray-600">No sections created yet</p>
                        {isAdmin && <button onClick={() => setIsModalOpen(true)} className="mt-4 btn-primary">Add First Section</button>}
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {Object.entries(sectionsByGrade)
                            .sort(([a], [b]) => {
                                const getGradeNum = (g: string) => {
                                    const match = g.match(/Grade\s*(\d+)/i);
                                    return match ? parseInt(match[1], 10) : 999;
                                };
                                return getGradeNum(a) - getGradeNum(b);
                            })
                            .map(([grade, gradeSections]) => (
                                <div key={grade}>
                                    <h4 className="text-lg font-bold text-deped-blue mb-3">{grade}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {gradeSections
                                            .sort((a, b) => a.section_name.localeCompare(b.section_name)) // Sort alphabetically
                                            .map((section) => {
                                                const adviserName = getAdviserName(section.adviser_id);
                                                return (
                                                    <div key={section.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-deped-blue relative group">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-bold text-lg">{section.section_name}</p>
                                                                <p className="text-sm text-gray-600 block">
                                                                    {section.section_room ? `Room: ${section.section_room}` : 'No room assigned'}
                                                                </p>
                                                                <p className="text-sm text-deped-blue font-medium mt-1">
                                                                    👨‍🏫 {adviserName}
                                                                </p>
                                                            </div>
                                                            {isAdmin && (
                                                                <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleEdit(section)}
                                                                        className="text-blue-500 hover:text-blue-700"
                                                                        title="Edit Section"
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                    <button
                                                                        onClick={() => deleteSection(section.id)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                        title="Delete Section"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Section Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
                            <h3 className="text-xl font-bold">{editingSectionId ? 'Edit Section' : 'Add Section'}</h3>
                            <button onClick={handleCloseModal} className="text-white text-2xl hover:text-gray-200">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Section Name *</label>
                                <input
                                    type="text"
                                    value={formData.section_name}
                                    onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                                    required
                                    placeholder="e.g., Einstein"
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Grade Level *</label>
                                <select
                                    value={formData.section_grade_level}
                                    onChange={(e) => setFormData({ ...formData, section_grade_level: e.target.value })}
                                    required
                                    className="form-input"
                                >
                                    <option value="">Select Grade Level</option>
                                    {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Room</label>
                                <input
                                    type="text"
                                    value={formData.section_room}
                                    onChange={(e) => setFormData({ ...formData, section_room: e.target.value })}
                                    placeholder="e.g., Room 101"
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-deped-blue">Adviser</label>
                                <select
                                    value={formData.adviser_id}
                                    onChange={(e) => setFormData({ ...formData, adviser_id: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="">No Adviser Assigned</option>
                                    {teachers.map((t) => (
                                        <option key={t.uid} value={t.uid}>{t.displayName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {editingSectionId ? 'Update Section' : 'Add Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
