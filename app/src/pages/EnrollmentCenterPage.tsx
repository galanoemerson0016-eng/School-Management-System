import { useMemo, useState } from 'react';
import { useAppStore } from '../stores';
import type { Section } from '../types';

const SOURCE_GRADES = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

export function EnrollmentCenterPage() {
    const {
        activeSchoolYear,
        schoolYears,
        sections,
        enrollments,
        studentProfiles,
        promoteStudentsFromYear,
        enrollReturningStudent,
        setCurrentView,
    } = useAppStore();

    const [sourceSchoolYear, setSourceSchoolYear] = useState('2026-2027');
    const [sourceGradeLevel, setSourceGradeLevel] = useState('Grade 7');
    const [targetSectionId, setTargetSectionId] = useState('');
    const [isPromoting, setIsPromoting] = useState(false);

    const [returningLrn, setReturningLrn] = useState('');
    const [returningSectionId, setReturningSectionId] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);

    const historicalSchoolYears = useMemo(() => {
        const values = Array.from(new Set([
            ...schoolYears.map((year) => year.label),
            ...enrollments.map((entry) => entry.school_year),
            '2026-2027',
        ])).filter(Boolean);

        return values
            .filter((year) => year !== activeSchoolYear)
            .sort((a, b) => b.localeCompare(a));
    }, [schoolYears, enrollments, activeSchoolYear]);

    const eligibleCount = useMemo(() => {
        const fromEnrollments = enrollments.filter((entry) => (
            entry.school_year === sourceSchoolYear &&
            entry.grade_level === sourceGradeLevel
        )).length;
        if (fromEnrollments > 0) return fromEnrollments;
        // Fallback for installs without enrollment history: learners currently
        // sitting on the source grade level (mirrors promoteStudentsFromYear).
        return studentProfiles.filter((s) => s.grade_level === sourceGradeLevel).length;
    }, [enrollments, studentProfiles, sourceSchoolYear, sourceGradeLevel]);

    const expectedNextGrade = useMemo(() => {
        const match = sourceGradeLevel.match(/(\d+)/);
        if (!match) return sourceGradeLevel;
        const next = Number(match[1]) + 1;
        return `Grade ${next}`;
    }, [sourceGradeLevel]);

    const targetSections = useMemo(() => {
        return sections
            .filter((section) => section.section_grade_level === expectedNextGrade)
            .sort((a, b) => a.section_name.localeCompare(b.section_name));
    }, [sections, expectedNextGrade]);

    const lrnProfile = useMemo(() => {
        const lrn = returningLrn.trim();
        if (!/^\d{12}$/.test(lrn)) return null;
        return studentProfiles.find((student) => student.lrn === lrn) || null;
    }, [studentProfiles, returningLrn]);

    const handlePromote = async () => {
        if (!sourceSchoolYear || !sourceGradeLevel || !targetSectionId) {
            window.alert('Please select source school year, source grade level, and target section.');
            return;
        }

        setIsPromoting(true);
        try {
            const promoted = await promoteStudentsFromYear(sourceSchoolYear, sourceGradeLevel, targetSectionId);
            window.alert(promoted > 0
                ? `Promotion complete. ${promoted} learner(s) moved to ${activeSchoolYear}.`
                : 'No learners were promoted.');
        } catch (error) {
            window.alert(`Promotion failed: ${(error as Error).message}`);
        } finally {
            setIsPromoting(false);
        }
    };

    const handleEnrollReturning = async () => {
        const lrn = returningLrn.trim();
        if (!/^\d{12}$/.test(lrn)) {
            window.alert('Please enter a valid 12-digit LRN.');
            return;
        }
        if (!returningSectionId) {
            window.alert('Please choose a destination section.');
            return;
        }

        setIsEnrolling(true);
        try {
            await enrollReturningStudent(lrn, returningSectionId);
            window.alert('Returning learner enrolled successfully.');
        } catch (error) {
            window.alert(`Enrollment failed: ${(error as Error).message}`);
        } finally {
            setIsEnrolling(false);
        }
    };

    const sortedSections = useMemo(() => {
        return [...sections].sort((a, b) => {
            const glCompare = (a.section_grade_level || '').localeCompare(b.section_grade_level || '', undefined, { numeric: true });
            if (glCompare !== 0) return glCompare;
            return (a.section_name || '').localeCompare(b.section_name || '');
        });
    }, [sections]);

    const groupedSections = useMemo(() => {
        const groups: Record<string, Section[]> = {
            'ELEMENTARY': [],
            'JUNIOR HIGH SCHOOL': [],
            'SENIOR HIGH SCHOOL': []
        };
        
        sortedSections.forEach(s => {
            const gl = (s.section_grade_level || '').toLowerCase();
            const num = parseInt(gl.replace(/\D/g, '')) || 0;
            
            if (gl.includes('kinder') || (num >= 1 && num <= 6)) {
                groups['ELEMENTARY'].push(s);
            } else if (num >= 7 && num <= 10) {
                groups['JUNIOR HIGH SCHOOL'].push(s);
            } else if (num >= 11 && num <= 12) {
                groups['SENIOR HIGH SCHOOL'].push(s);
            }
        });
        
        return groups;
    }, [sortedSections]);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-2xl font-black text-slate-800">Enrollment Center</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Active school year: <span className="font-bold text-slate-700">{activeSchoolYear}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-black text-slate-800">Promote From Previous Year</h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Recommended for Grade 7 to Grade 8, Grade 8 to Grade 9, etc.
                    </p>

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Source school year</label>
                            <select
                                value={sourceSchoolYear}
                                onChange={(e) => setSourceSchoolYear(e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            >
                                {historicalSchoolYears.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Source grade</label>
                            <select
                                value={sourceGradeLevel}
                                onChange={(e) => setSourceGradeLevel(e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            >
                                {SOURCE_GRADES.map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Target section ({expectedNextGrade})</label>
                            <select
                                value={targetSectionId}
                                onChange={(e) => setTargetSectionId(e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            >
                                <option value="">Select section</option>
                                {targetSections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.section_grade_level} - {section.section_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            Eligible learners from {sourceSchoolYear} / {sourceGradeLevel}: <span className="font-black text-slate-800">{eligibleCount}</span>
                        </div>

                        <button
                            onClick={() => {
                                void handlePromote();
                            }}
                            disabled={isPromoting || !targetSectionId}
                            className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isPromoting ? 'Promoting...' : `Promote To ${activeSchoolYear}`}
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-black text-slate-800">Enroll Returning Learner</h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Enter existing LRN and assign section for {activeSchoolYear}.
                    </p>

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Learner reference number (LRN)</label>
                            <input
                                type="text"
                                value={returningLrn}
                                onChange={(e) => setReturningLrn(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                placeholder="12-digit LRN"
                            />
                        </div>

                        {lrnProfile && (
                            <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                                Found: <span className="font-black">{lrnProfile.last_name}, {lrnProfile.first_name}</span>
                                <div className="text-xs text-blue-600">Last known: {lrnProfile.grade_level || '-'} / {lrnProfile.student_section || '-'}</div>
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Destination section</label>
                            <select
                                value={returningSectionId}
                                onChange={(e) => setReturningSectionId(e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            >
                                <option value="">Select section</option>
                                {Object.entries(groupedSections).map(([group, groupSections]) => (
                                    groupSections.length > 0 && (
                                        <optgroup key={group} label={group}>
                                            {groupSections.map((section) => (
                                                <option key={section.id} value={section.id}>
                                                    {section.section_grade_level} - {section.section_name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                void handleEnrollReturning();
                            }}
                            disabled={isEnrolling || !returningSectionId}
                            className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isEnrolling ? 'Enrolling...' : 'Enroll Returning Learner'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-black text-slate-800">Grade 1 New Entrants</h3>
                <p className="mt-1 text-sm text-slate-500">
                    For new Grade 1 learners: use manual add or SF1 import in the Students page.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <button
                        onClick={() => setCurrentView('students')}
                        className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                        Go To Students Page
                    </button>
                    <button
                        onClick={() => setCurrentView('students')}
                        className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                        Import SF1 In Students
                    </button>
                </div>
            </div>
        </div>
    );
}
