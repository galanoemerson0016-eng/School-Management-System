import { useState, useMemo, useEffect } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Section, Subject, Student, ClassRecord } from '../types';

export function ClassRecordPage() {
    const { sections, subjects, students } = useAppStore();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';
    const isTeacher = user?.role === 'teacher';

    // UI State
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);

    // Data State
    const [records, setRecords] = useState<ClassRecord[]>([]);

    // 1. Filter & Sort Sections
    const sortedSections = useMemo(() => {
        return [...sections].sort((a, b) => {
            // Grade Level Sort
            const getGradeNum = (g: string) => {
                const match = g.match(/\d+/);
                return match ? parseInt(match[0], 10) : 999;
            };
            const gradeA = getGradeNum(a.section_grade_level);
            const gradeB = getGradeNum(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;

            // Alphabetical Sort
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections]);

    // 2. Filter Subjects by Section & Teacher
    const availableSubjects = useMemo(() => {
        if (!selectedSectionId) return [];
        return subjects.filter(sub => {
            const inSection = sub.section_id === selectedSectionId;
            if (!inSection) return false;

            // If Admin, show all. If Teacher, show only assigned.
            if (isAdmin) return true;
            if (isTeacher) return sub.teacher_id === user?.uid;
            return false;
        });
    }, [subjects, selectedSectionId, isAdmin, isTeacher, user]);

    // 3. Filter Students by Section
    const classStudents = useMemo(() => {
        if (!selectedSectionId) return [];
        return students
            .filter(s => s.student_section === sections.find(sec => sec.id === selectedSectionId)?.section_name)
            .sort((a, b) => {
                // Sort by Gender (M then F) then Last Name
                if (a.gender !== b.gender) return a.gender === 'Male' ? -1 : 1;
                return a.last_name.localeCompare(b.last_name);
            });
    }, [students, selectedSectionId, sections]);


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">E-Class Record 📒</h2>

            {/* Controls */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
                {/* Section Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Section</label>
                    <select
                        className="form-input mt-1 w-64"
                        value={selectedSectionId}
                        onChange={(e) => {
                            setSelectedSectionId(e.target.value);
                            setSelectedSubjectId(''); // Reset subject when section changes
                        }}
                    >
                        <option value="">-- Select Section --</option>
                        {sortedSections.map(sec => (
                            <option key={sec.id} value={sec.id}>
                                {sec.section_grade_level} - {sec.section_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Subject Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <select
                        className="form-input mt-1 w-64"
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        disabled={!selectedSectionId}
                    >
                        <option value="">-- Select Subject --</option>
                        {availableSubjects.map(sub => (
                            <option key={sub.id} value={sub.id}>
                                {sub.subject_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Quarter Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quarter</label>
                    <select
                        className="form-input mt-1 w-32"
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                    >
                        <option value={1}>1st Quarter</option>
                        <option value={2}>2nd Quarter</option>
                        <option value={3}>3rd Quarter</option>
                        <option value={4}>4th Quarter</option>
                    </select>
                </div>
            </div>

            {/* Grading Table Placeholder */}
            <div className="bg-white rounded-lg shadow overflow-hidden min-h-[400px]">
                {!selectedSectionId || !selectedSubjectId ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        Select a Section and Subject to view the Grade Sheet.
                    </div>
                ) : (
                    <div className="p-6">
                        <h3 className="text-lg font-bold mb-4">
                            Grading Sheet: {availableSubjects.find(s => s.id === selectedSubjectId)?.subject_name}
                            <span className="text-gray-500 font-normal text-sm ml-2">({selectedQuarter === 1 ? '1st' : selectedQuarter === 2 ? '2nd' : selectedQuarter === 3 ? '3rd' : '4th'} Quarter)</span>
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border p-2 text-left w-64">Student Name</th>
                                        <th className="border p-2 text-center">Initial Grade</th>
                                        <th className="border p-2 text-center">Transmuted Grade</th>
                                        <th className="border p-2 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classStudents.map(student => (
                                        <tr key={student.lrn}>
                                            <td className="border p-2">
                                                {student.last_name}, {student.first_name}
                                                <span className="text-xs text-gray-400 block">{student.gender}</span>
                                            </td>
                                            <td className="border p-2 text-center text-gray-400 italic">--</td>
                                            <td className="border p-2 text-center text-gray-400 italic">--</td>
                                            <td className="border p-2 text-center">
                                                <button className="text-blue-600 hover:underline text-sm">Input Grades</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {classStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-gray-500">No students found in this section.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
