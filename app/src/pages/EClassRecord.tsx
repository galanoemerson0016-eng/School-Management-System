import { useState, useMemo, useEffect } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { getSubjectCluster, getWeights, transmuteGrade } from '../lib/grading';

export function EClassRecord() {
    const {
        students,
        sections,
        subjects,
        schoolProfile,
        activeSchoolYear,
        classRecords,
        updateClassRecord,
        hpsRecords,
        updateHPSRecord,
        selectedSection: globalSection,
        selectedSubject: globalSubject,
        setSelectedSection: setGlobalSection,
        setSelectedSubject: setGlobalSubject,
        showNotification
    } = useAppStore();
    const { user } = useAuthStore();
    const isTeacher = user?.role === 'teacher';

    const [selectedSection, setSelectedSection] = useState(globalSection || '');
    const [selectedSubject, setSelectedSubject] = useState(globalSubject || '');
    const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(1);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    // Sync store with local state
    useEffect(() => {
        if (globalSection && globalSection !== selectedSection) {
            setSelectedSection(globalSection);
        }
    }, [globalSection]);

    useEffect(() => {
        if (globalSubject && globalSubject !== selectedSubject) {
            setSelectedSubject(globalSubject);
        }
    }, [globalSubject]);

    // Get the selected section's grade level
    const selectedSectionObj = useMemo(() => {
        return sections.find(s => s.section_name === selectedSection);
    }, [sections, selectedSection]);

    const sectionGradeLevel = selectedSectionObj?.section_grade_level || '';

    // Sort Sections: Grade Level (Asc) -> Name (Asc)
    // Filter: If Teacher, only show sections where they are Adviser OR have a Subject assigned
    const sortedSections = useMemo(() => {
        let filteredSections = sections;

        if (isTeacher && user?.uid) {
            filteredSections = sections.filter(sec => {
                // 1. Is Adviser?
                if (sec.adviser_id === user.uid) return true;

                // 2. Has Subject Assigned in this Section?
                const hasSubject = subjects.some(sub =>
                    sub.section_id === sec.id && sub.teacher_id === user.uid
                );
                return hasSubject;
            });
        }

        return [...filteredSections].sort((a, b) => {
            const getGradeNum = (g: string) => {
                const match = g.match(/\d+/);
                return match ? parseInt(match[0], 10) : 999;
            };
            const gradeA = getGradeNum(a.section_grade_level);
            const gradeB = getGradeNum(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, subjects, isTeacher, user]);

    // Update global store when local selection changes
    const onSectionChange = (val: string) => {
        setSelectedSection(val);
        setGlobalSection(val);
        setSelectedSubject(''); // Reset subject when section changes
        setGlobalSubject('');
    };

    const onSubjectChange = (val: string) => {
        setSelectedSubject(val);
        setGlobalSubject(val);
    };

    // Filter & Sort Subjects: Strictly by Section ID & Teacher Assignment
    const filteredSubjects = useMemo(() => {
        if (!selectedSectionObj) return [];

        let subjs = subjects.filter(s => s.section_id === selectedSectionObj.id);

        if (isTeacher && user?.uid) {
            subjs = subjs.filter(s => s.teacher_id === user.uid);
        }

        return subjs.sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    }, [subjects, selectedSectionObj, isTeacher, user]);

    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        return students.filter((s) => s.student_section === selectedSection);
    }, [students, selectedSection]);

    // Highest Possible Scores (HPS) - Persistent
    const hps = useMemo(() => {
        if (!selectedSubject) {
            return { ww: Array(10).fill(0), pt: Array(10).fill(0), qa: 0 };
        }

        const record = hpsRecords.find(r =>
            r.subject_id === selectedSubject &&
            r.school_year === activeSchoolYear &&
            r.quarter === quarter
        );

        return {
            ww: record?.written_works || Array(10).fill(0),
            pt: record?.performance_tasks || Array(10).fill(0),
            qa: record?.quarterly_exam || 0
        };
    }, [hpsRecords, selectedSubject, activeSchoolYear, quarter]);

    // Get current subject and its weight cluster
    const selectedSubjectObj = useMemo(() => {
        return subjects.find(s => s.id === selectedSubject);
    }, [subjects, selectedSubject]);

    const currentCluster = useMemo(() => {
        if (!selectedSubjectObj) return 'languages_ap_esp';
        return getSubjectCluster(selectedSubjectObj.subject_name);
    }, [selectedSubjectObj]);

    const currentWeights = useMemo(() => {
        return getWeights(currentCluster);
    }, [currentCluster]);

    // Fetch Teacher Name
    const [teacherName, setTeacherName] = useState('');

    useEffect(() => {
        const fetchTeacher = async () => {
            if (!selectedSubjectObj?.teacher_id) {
                setTeacherName('');
                return;
            }

            if (user?.uid === selectedSubjectObj.teacher_id) {
                setTeacherName(user.displayName?.toUpperCase() || 'TEACHER');
                return;
            }

            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../lib/firebase');
                const userDoc = await getDoc(doc(db, 'users', selectedSubjectObj.teacher_id));
                if (userDoc.exists()) {
                    setTeacherName(userDoc.data().displayName?.toUpperCase() || 'UNKNOWN TEACHER');
                } else {
                    setTeacherName('UNKNOWN TEACHER');
                }
            } catch (error) {
                console.error("Error fetching teacher:", error);
                setTeacherName('ERROR');
            }
        };

        fetchTeacher();
    }, [selectedSubjectObj, user]);

    const maleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Male').sort((a, b) => {
        const nameA = `${a.last_name}, ${a.first_name}`.toLowerCase();
        const nameB = `${b.last_name}, ${b.first_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
    }), [sectionStudents]);

    const femaleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Female').sort((a, b) => {
        const nameA = `${a.last_name}, ${a.first_name}`.toLowerCase();
        const nameB = `${b.last_name}, ${b.first_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
    }), [sectionStudents]);

    const getStudentSummary = (student: typeof students[0]) => {
        const record = classRecords.find(r =>
            r.student_lrn === student.lrn &&
            r.subject_id === selectedSubject &&
            r.quarter === quarter
        );

        const sGrades = record || {
            written_works: Array(10).fill(0),
            performance_tasks: Array(10).fill(0),
            quarterly_exam: 0
        };

        const wwTotalScore = sGrades.written_works.reduce((a, b) => Number(a) + Number(b), 0);
        const wwTotalHPS = hps.ww.reduce((a, b) => a + b, 0);
        const wwPS = wwTotalHPS === 0 ? 0 : (wwTotalScore / wwTotalHPS) * 100;
        const wwWS = wwPS * currentWeights.written_works;

        const ptTotalScore = sGrades.performance_tasks.reduce((a, b) => Number(a) + Number(b), 0);
        const ptTotalHPS = hps.pt.reduce((a, b) => a + b, 0);
        const ptPS = ptTotalHPS === 0 ? 0 : (ptTotalScore / ptTotalHPS) * 100;
        const ptWS = ptPS * currentWeights.performance_tasks;

        const qaScore = Number(sGrades.quarterly_exam) || 0;
        const qaHPS = Number(hps.qa) || 0;
        const qaPS = qaHPS === 0 ? 0 : (qaScore / qaHPS) * 100;
        const qaWS = qaPS * currentWeights.quarterly_exam;

        const initialGrade = wwWS + ptWS + qaWS;

        const hasScores =
            sGrades.written_works.some(s => s !== '' && s !== 0) ||
            sGrades.performance_tasks.some(s => s !== '' && s !== 0) ||
            (sGrades.quarterly_exam !== '' && sGrades.quarterly_exam !== 0);

        const quarterlyGrade = hasScores ? transmuteGrade(initialGrade) : 0;

        return {
            ww: sGrades.written_works,
            pt: sGrades.performance_tasks,
            qa: sGrades.quarterly_exam,
            wwTotalScore, wwTotalHPS, wwPS, wwWS,
            ptTotalScore, ptTotalHPS, ptPS, ptWS,
            qaScore, qaHPS, qaPS, qaWS,
            initialGrade,
            quarterlyGrade
        };
    };

    const proficiencyData = useMemo(() => {
        const levels = [
            { key: 'outstanding', min: 90, max: 100 },
            { key: 'verySatisfactory', min: 85, max: 89 },
            { key: 'satisfactory', min: 80, max: 84 },
            { key: 'fairlySatisfactory', min: 75, max: 79 },
            { key: 'failed', min: 0, max: 74 }
        ] as const;

        const data: Record<string, { male: number; female: number; total: number }> = {};

        levels.forEach(level => {
            const m = maleStudents.filter(s => {
                const g = getStudentSummary(s).quarterlyGrade;
                return g > 0 && g >= level.min && g <= level.max;
            }).length;
            const f = femaleStudents.filter(s => {
                const g = getStudentSummary(s).quarterlyGrade;
                return g > 0 && g >= level.min && g <= level.max;
            }).length;
            data[level.key] = { male: m, female: f, total: m + f };
        });

        return data;
    }, [maleStudents, femaleStudents, classRecords, quarter, hps, currentWeights, selectedSubject]);

    const mpsData = useMemo(() => {
        const getMps = (list: typeof maleStudents) => {
            const grades = list.map(s => getStudentSummary(s).quarterlyGrade).filter(g => g > 0);
            return grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
        };
        return {
            maleMps: getMps(maleStudents),
            femaleMps: getMps(femaleStudents),
            totalMps: getMps([...maleStudents, ...femaleStudents]),
        };
    }, [maleStudents, femaleStudents, classRecords, quarter, hps, currentWeights, selectedSubject]);

    const updateHPS = (type: 'ww' | 'pt' | 'qa', index: number, value: number) => {
        if (!selectedSubject) return;

        // Find existing record or create new one
        const existingRecord = hpsRecords.find(r =>
            r.subject_id === selectedSubject &&
            r.school_year === activeSchoolYear &&
            r.quarter === quarter
        );

        const newRecord = existingRecord ? { ...existingRecord } : {
            id: `hps_${selectedSubject}_Q${quarter}_${activeSchoolYear}`,
            subject_id: selectedSubject,
            school_year: activeSchoolYear,
            quarter: quarter,
            written_works: Array(10).fill(''),
            performance_tasks: Array(10).fill(''),
            quarterly_exam: ''
        };

        if (type === 'qa') {
            newRecord.quarterly_exam = value;
        } else if (type === 'ww') {
            const newWW = [...newRecord.written_works];
            newWW[index] = value;
            newRecord.written_works = newWW;
        } else if (type === 'pt') {
            const newPT = [...newRecord.performance_tasks];
            newPT[index] = value;
            newRecord.performance_tasks = newPT;
        }



        updateHPSRecord(newRecord);
    };

    const updateGrade = (lrn: string, type: 'ww' | 'pt' | 'qa', index: number, value: string) => {
        if (!selectedSection || !selectedSubject) return;

        const existingRecord = classRecords.find(r =>
            r.student_lrn === lrn &&
            r.subject_id === selectedSubject &&
            r.quarter === quarter
        );

        const record = existingRecord ? { ...existingRecord } : {
            id: `grade_${lrn}_${selectedSubject}_Q${quarter}`,
            student_lrn: lrn,
            section_id: sections.find(s => s.section_name === selectedSection)?.id || '',
            subject_id: selectedSubject,
            school_year: activeSchoolYear,
            quarter: quarter,
            written_works: Array(10).fill(''),
            performance_tasks: Array(10).fill(''),
            quarterly_exam: '',
            final_grade: ''
        };

        const parsedVal = value === '' ? '' : value === '0' ? '0' : Number(value);

        // Validation: Do not allow score higher than HPS
        if (typeof parsedVal === 'number') {
            let currentHPS = 0;
            if (type === 'ww') currentHPS = Number(hps.ww[index]);
            else if (type === 'pt') currentHPS = Number(hps.pt[index]);
            else if (type === 'qa') currentHPS = Number(hps.qa);

            if (parsedVal > currentHPS) {
                showNotification(`Score (${parsedVal}) cannot be higher than the Highest Possible Score (${currentHPS}).`, 'error');
                return;
            }
        }

        if (type === 'qa') {
            record.quarterly_exam = parsedVal as any;
        } else if (type === 'ww') {
            const newWW = [...record.written_works];
            newWW[index] = parsedVal as any;
            record.written_works = newWW;
        } else if (type === 'pt') {
            const newPT = [...record.performance_tasks];
            newPT[index] = parsedVal as any;
            record.performance_tasks = newPT;
        }

        const wwTotalScore = record.written_works.reduce((a, b) => Number(a) + Number(b), 0);
        const wwTotalHPS = hps.ww.reduce((a, b) => a + b, 0);
        const wwPS = wwTotalHPS === 0 ? 0 : (wwTotalScore / wwTotalHPS) * 100;
        const wwWS = wwPS * currentWeights.written_works;

        const ptTotalScore = record.performance_tasks.reduce((a, b) => Number(a) + Number(b), 0);
        const ptTotalHPS = hps.pt.reduce((a, b) => a + b, 0);
        const ptPS = ptTotalHPS === 0 ? 0 : (ptTotalScore / ptTotalHPS) * 100;
        const ptWS = ptPS * currentWeights.performance_tasks;

        const qaScore = Number(record.quarterly_exam) || 0;
        const qaHPS = Number(hps.qa) || 0;
        const qaPS = qaHPS === 0 ? 0 : (qaScore / qaHPS) * 100;
        const qaWS = qaPS * currentWeights.quarterly_exam;

        const initialGrade = wwWS + ptWS + qaWS;

        // Check if there are any scores entered
        const hasScores =
            record.written_works.some(s => s !== '' && s !== 0) ||
            record.performance_tasks.some(s => s !== '' && s !== 0) ||
            (record.quarterly_exam !== '' && record.quarterly_exam !== 0);

        if (!hasScores) {
            record.final_grade = undefined;
        } else {
            record.final_grade = transmuteGrade(initialGrade);
        }

        updateClassRecord(record);
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        const sectionName = selectedSectionObj ? `${selectedSectionObj.section_grade_level}-${selectedSectionObj.section_name}` : '';
        const subjectName = selectedSubjectObj?.subject_name || '';
        document.title = `Class_Record_${sectionName}_${subjectName}_Q${quarter}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };

    return (
        <div className="space-y-6">
            <style>{`
                @media print {
                    @page {
                        size: 13in 8.5in;
                        margin: 0.25in;
                    }
                    body {
                        visibility: hidden;
                    }
                    #printable-class-record {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        overflow: visible !important;
                    }
                    #printable-class-record * {
                        visibility: visible;
                    }
                    .no-print, header, nav, aside {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-lg shadow-md p-4 no-print">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Section</label>
                        <select
                            value={selectedSection}
                            onChange={(e) => onSectionChange(e.target.value)}
                            className="form-input"
                        >
                            <option value="">Select Section</option>
                            {sortedSections.map((s) => (
                                <option key={s.id} value={s.section_name}>{s.section_grade_level} - {s.section_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Subject {sectionGradeLevel && `(${sectionGradeLevel})`}</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => onSubjectChange(e.target.value)}
                            className="form-input"
                            disabled={!selectedSection}
                        >
                            <option value="">{selectedSection ? 'Select Subject' : 'Select a section first'}</option>
                            {filteredSubjects.map((s) => (
                                <option key={s.id} value={s.id}>{s.subject_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Quarter</label>
                        <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)} className="form-input">
                            <option value={1}>1st Quarter</option>
                            <option value={2}>2nd Quarter</option>
                            <option value={3}>3rd Quarter</option>
                            <option value={4}>4th Quarter</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={handlePrint} className="btn-primary w-full flex items-center justify-center gap-2">
                            <span>🖨️</span> Print Class Record
                        </button>
                    </div>
                </div>
            </div>

            <div id="printable-class-record" className="bg-white shadow-lg overflow-x-auto print:shadow-none print:w-[1300px]">
                <div className="min-w-[1200px] print:min-w-full">
                    {[
                        { gender: 'MALE' as const, students: maleStudents },
                        { gender: 'FEMALE' as const, students: femaleStudents }
                    ].map((section, sectionIdx) => (
                        <div key={section.gender} className={`p-4 print:p-0 ${sectionIdx === 0 ? 'print:break-after-page' : 'print:mt-8'}`}>
                            <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2 px-4">
                                <div className="w-24 h-24 flex items-center justify-center">
                                    <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="text-center flex-1 mx-4">
                                    <h1 className="text-xl font-bold font-serif tracking-wide text-black mb-0 uppercase">Class Record</h1>
                                    <p className="text-[10px] italic text-red-600 font-serif mb-2">(Pursuant to DepEd Order 8 series of 2015)</p>
                                    <div className="flex items-center justify-center gap-2 mb-1 text-xs font-bold uppercase">
                                        <div className="flex items-center">
                                            <span className="mr-2">REGION</span>
                                            <div className="border border-black px-2 py-0.5 min-w-[100px] text-left">{schoolProfile.region}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-2">DIVISION</span>
                                            <div className="border border-black px-2 py-0.5 min-w-[180px] text-left">{schoolProfile.division}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-2">DISTRICT</span>
                                            <div className="border border-black px-2 py-0.5 min-w-[150px] text-left">{schoolProfile.district || ''}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase">
                                        <div className="flex items-center">
                                            <span className="mr-2">SCHOOL NAME</span>
                                            <div className="border border-black px-2 py-0.5 min-w-[280px] text-left">{schoolProfile.name}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-2">SCHOOL ID</span>
                                            <div className="border border-black px-2 py-0.5 min-w-[80px] text-left">{schoolProfile.school_id}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-2">SCHOOL YEAR</span>
                                            <div className="border border-black px-2 py-0.5 min-w-[100px] text-left">{activeSchoolYear}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-40 h-24 flex items-center justify-center">
                                    <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-auto object-contain" />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 border-2 border-black mb-px text-sm">
                                <div className="p-1 border-r border-black font-bold bg-yellow-100 flex items-center justify-center">
                                    {quarter === 1 ? 'FIRST' : quarter === 2 ? 'SECOND' : quarter === 3 ? 'THIRD' : 'FOURTH'} QUARTER
                                </div>
                                <div className="p-1 border-r border-black flex items-center">
                                    <span className="font-bold mr-2">GRADE & SECTION:</span>
                                    <span className="uppercase">{sectionGradeLevel} - {selectedSection}</span>
                                </div>
                                <div className="p-1 border-r border-black flex items-center">
                                    <span className="font-bold mr-2">TEACHER:</span>
                                    <span className="uppercase">{teacherName || ''}</span>
                                </div>
                                <div className="p-1 flex items-center">
                                    <span className="font-bold mr-2">SUBJECT:</span>
                                    <span className="uppercase">{subjects.find(s => s.id === selectedSubject)?.subject_name || ''}</span>
                                </div>
                            </div>

                            <table className="w-full border-collapse border-2 border-black text-[10px] text-center">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th rowSpan={2} className="border border-black min-w-[200px] p-1 align-middle">LEARNERS' NAMES</th>
                                        <th colSpan={13} className="border border-black p-1">WRITTEN WORKS ({Math.round(currentWeights.written_works * 100)}%)</th>
                                        <th colSpan={13} className="border border-black p-1">PERFORMANCE TASKS ({Math.round(currentWeights.performance_tasks * 100)}%)</th>
                                        <th colSpan={3} className="border border-black p-1">QUARTERLY ASSESSMENT ({Math.round(currentWeights.quarterly_exam * 100)}%)</th>
                                        <th rowSpan={3} className="border border-black w-10 p-1 align-middle bg-yellow-50">INITIAL GRADE</th>
                                        <th rowSpan={3} className="border border-black w-10 p-1 align-middle bg-green-100">QUARTERLY GRADE</th>
                                    </tr>
                                    <tr className="bg-gray-100">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <th key={`ww-${i}`} className="border border-black w-6">{i}</th>)}
                                        <th className="border border-black w-8 bg-gray-200">Total</th>
                                        <th className="border border-black w-8 bg-gray-200">PS</th>
                                        <th className="border border-black w-8 bg-gray-200">WS</th>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <th key={`pt-${i}`} className="border border-black w-6">{i}</th>)}
                                        <th className="border border-black w-8 bg-gray-200">Total</th>
                                        <th className="border border-black w-8 bg-gray-200">PS</th>
                                        <th className="border border-black w-8 bg-gray-200">WS</th>
                                        <th className="border border-black w-8">1</th>
                                        <th className="border border-black w-8 bg-gray-200">PS</th>
                                        <th className="border border-black w-8 bg-gray-200">WS</th>
                                    </tr>
                                    <tr className="bg-blue-50 font-bold">
                                        <td className="border border-black p-1 text-left">HIGHEST POSSIBLE SCORE</td>
                                        {hps.ww.map((val, i) => (
                                            <td key={`hps-ww-${i}`} className="border border-black p-0">
                                                <input
                                                    type="number"
                                                    value={val === 0 ? '' : val}
                                                    onChange={(e) => updateHPS('ww', i, Number(e.target.value))}
                                                    className="w-full h-full text-center bg-transparent outline-none p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-gray-100">{hps.ww.reduce((a, b) => a + b, 0)}</td>
                                        <td className="border border-black bg-gray-100">100.00</td>
                                        <td className="border border-black bg-gray-100">{currentWeights.written_works * 100}%</td>
                                        {hps.pt.map((val, i) => (
                                            <td key={`hps-pt-${i}`} className="border border-black p-0">
                                                <input
                                                    type="number"
                                                    value={val === 0 ? '' : val}
                                                    onChange={(e) => updateHPS('pt', i, Number(e.target.value))}
                                                    className="w-full h-full text-center bg-transparent outline-none p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-gray-100">{hps.pt.reduce((a, b) => a + b, 0)}</td>
                                        <td className="border border-black bg-gray-100">100.00</td>
                                        <td className="border border-black bg-gray-100">{currentWeights.performance_tasks * 100}%</td>
                                        <td className="border border-black p-0">
                                            <input
                                                type="number"
                                                value={hps.qa === 0 ? '' : hps.qa}
                                                onChange={(e) => updateHPS('qa', 0, Number(e.target.value))}
                                                className="w-full h-full text-center bg-transparent outline-none p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </td>
                                        <td className="border border-black bg-gray-100">100.00</td>
                                        <td className="border border-black bg-gray-100">{currentWeights.quarterly_exam * 100}%</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-gray-100 font-bold">
                                        <td colSpan={32} className="border border-black text-left px-2 py-1">{section.gender}</td>
                                    </tr>
                                    {section.students.map((student, idx) => {
                                        const summary = getStudentSummary(student);
                                        return (
                                            <tr key={student.lrn} className="hover:bg-gray-50">
                                                <td className="border border-black p-1 text-left truncate max-w-[200px]">
                                                    {idx + 1}. {student.last_name}, {student.first_name}
                                                </td>
                                                {summary.ww.map((score, i) => (
                                                    <td key={`ww-${i}`} className="border border-black p-0">
                                                        <input
                                                            type="number"
                                                            value={score === 0 ? '' : score}
                                                            onChange={(e) => updateGrade(student.lrn, 'ww', i, e.target.value)}
                                                            className="w-full h-full text-center outline-none p-0 focus:bg-blue-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="border border-black bg-blue-50">{summary.wwTotalScore}</td>
                                                <td className="border border-black bg-blue-50">{summary.wwPS.toFixed(2)}</td>
                                                <td className="border border-black bg-blue-100 font-semibold">{summary.wwWS.toFixed(2)}</td>
                                                {summary.pt.map((score, i) => (
                                                    <td key={`pt-${i}`} className="border border-black p-0">
                                                        <input
                                                            type="number"
                                                            value={score === 0 ? '' : score}
                                                            onChange={(e) => updateGrade(student.lrn, 'pt', i, e.target.value)}
                                                            className="w-full h-full text-center outline-none p-0 focus:bg-green-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="border border-black bg-green-50">{summary.ptTotalScore}</td>
                                                <td className="border border-black bg-green-50">{summary.ptPS.toFixed(2)}</td>
                                                <td className="border border-black bg-green-100 font-semibold">{summary.ptWS.toFixed(2)}</td>
                                                <td className="border border-black p-0">
                                                    <input
                                                        type="number"
                                                        value={summary.qaScore === 0 ? '' : summary.qaScore}
                                                        onChange={(e) => updateGrade(student.lrn, 'qa', 0, e.target.value)}
                                                        className="w-full h-full text-center outline-none p-0 focus:bg-yellow-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>
                                                <td className="border border-black bg-yellow-50">{summary.qaPS.toFixed(2)}</td>
                                                <td className="border border-black bg-yellow-100 font-semibold">{summary.qaWS.toFixed(2)}</td>
                                                <td className="border border-black bg-gray-100 font-bold">{summary.initialGrade.toFixed(2)}</td>
                                                <td className={`border border-black font-bold ${summary.quarterlyGrade > 0 ? (summary.quarterlyGrade < 75 ? 'bg-red-500 text-white' : 'bg-deped-blue text-white') : 'bg-gray-50'}`}>
                                                    {summary.quarterlyGrade > 0 ? summary.quarterlyGrade : ''}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {section.gender === 'FEMALE' && (
                                        <>
                                            <tr className="bg-gray-200 mt-4 border-t-4 border-black cursor-pointer hover:bg-gray-300 transition-colors no-print" onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}>
                                                <td colSpan={32} className="border border-black p-2 font-bold bg-yellow-100 uppercase text-center">
                                                    <div className="flex items-center justify-between">
                                                        <span>QUARTERLY SUMMARY OF LEARNERS' GRADES & ANALYTICS</span>
                                                        <span className="text-xl">{isAnalyticsOpen ? '▼' : '▶'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isAnalyticsOpen && (
                                                <tr className="bg-white no-print">
                                                    <td colSpan={32} className="p-0 border border-black border-t-0">
                                                        <div className="flex flex-col gap-4 p-4">
                                                            <div className="flex flex-col lg:flex-row gap-6">
                                                                <div className="flex-1 flex flex-col gap-4">
                                                                    <div className="border border-black overflow-hidden rounded">
                                                                        <div className="bg-gray-100 p-2 font-bold text-xs border-b border-black text-center">PROFICIENCY LEVELS</div>
                                                                        <table className="w-full text-center text-[10px]">
                                                                            <thead>
                                                                                <tr className="bg-gray-50 border-b border-black">
                                                                                    <th className="p-1 border-r border-black w-32">DESCRIPTORS</th>
                                                                                    <th className="p-1 border-r border-black w-24">REMARKS</th>
                                                                                    <th className="p-1 border-r border-black">MALE</th>
                                                                                    <th className="p-1 border-r border-black">FEMALE</th>
                                                                                    <th className="p-1">TOTAL</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {[
                                                                                    { desc: 'Outstanding (90-100)', remark: 'Passed', min: 90, max: 100, dataKey: 'outstanding' },
                                                                                    { desc: 'Very Satisfactory (85-89)', remark: 'Passed', min: 85, max: 89, dataKey: 'verySatisfactory' },
                                                                                    { desc: 'Satisfactory (80-84)', remark: 'Passed', min: 80, max: 84, dataKey: 'satisfactory' },
                                                                                    { desc: 'Fairly Satisfactory (75-79)', remark: 'Passed', min: 75, max: 79, dataKey: 'fairlySatisfactory' },
                                                                                    { desc: 'Did Not Meet Expectations (< 75)', remark: 'Failed', min: 0, max: 74, dataKey: 'failed' }
                                                                                ].map((level, idx) => {
                                                                                    const m = proficiencyData[level.dataKey].male;
                                                                                    const f = proficiencyData[level.dataKey].female;
                                                                                    return (
                                                                                        <tr key={idx} className="border-b border-gray-200">
                                                                                            <td className="p-1 border-r border-black text-left pl-2">{level.desc}</td>
                                                                                            <td className={`p-1 border-r border-black ${level.min < 75 ? 'text-red-600 font-bold' : 'text-green-700'}`}>{level.remark}</td>
                                                                                            <td className="p-1 border-r border-black">{m}</td>
                                                                                            <td className="p-1 border-r border-black">{f}</td>
                                                                                            <td className="p-1 font-bold">{m + f}</td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                                <tr className="bg-gray-100 font-bold border-t border-black">
                                                                                    <td className="p-1 border-r border-black" colSpan={2}>TOTAL</td>
                                                                                    <td className="p-1 border-r border-black">{maleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length}</td>
                                                                                    <td className="p-1 border-r border-black">{femaleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length}</td>
                                                                                    <td className="p-1 font-bold">{maleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length + femaleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length}</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                    <div className="border border-black overflow-hidden rounded">
                                                                        <div className="bg-gray-100 p-2 font-bold text-xs border-b border-black text-center">STATISTICS</div>
                                                                        <table className="w-full text-center text-[10px]">
                                                                            <thead>
                                                                                <tr className="bg-gray-50 border-b border-black">
                                                                                    <th className="p-1 border-r border-black">METRIC</th>
                                                                                    <th className="p-1 border-r border-black">MALE</th>
                                                                                    <th className="p-1 border-r border-black">FEMALE</th>
                                                                                    <th className="p-1">TOTAL</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {[
                                                                                    { label: 'Mean Percentage Score (MPS)', key: 'mps' },
                                                                                    { label: 'Highest Score', key: 'high' },
                                                                                    { label: 'Lowest Score', key: 'low' },
                                                                                ].map((stat, idx) => {
                                                                                    const getStats = (studentsList: typeof maleStudents) => {
                                                                                        const grades = studentsList.map(s => getStudentSummary(s).quarterlyGrade).filter(g => g > 0);
                                                                                        if (grades.length === 0) return 0;
                                                                                        if (stat.key === 'mps') return (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
                                                                                        if (stat.key === 'high') return Math.max(...grades);
                                                                                        if (stat.key === 'low') return Math.min(...grades);
                                                                                        return 0;
                                                                                    };
                                                                                    return (
                                                                                        <tr key={idx} className="border-b border-gray-200">
                                                                                            <td className="p-1 border-r border-black text-left pl-2 font-bold">{stat.label}</td>
                                                                                            <td className="p-1 border-r border-black">{getStats(maleStudents)}</td>
                                                                                            <td className="p-1 border-r border-black">{getStats(femaleStudents)}</td>
                                                                                            <td className="p-1 font-bold">{getStats([...maleStudents, ...femaleStudents])}</td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 flex flex-col gap-4">
                                                                    <div className="border border-gray-300 rounded p-2 bg-white flex flex-col items-center justify-center shadow-sm">
                                                                        <h4 className="text-xs font-bold text-gray-600 mb-2">Proficiency Level Distribution</h4>
                                                                        <div className="w-full h-40">
                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                <BarChart data={[
                                                                                    { name: 'O', count: proficiencyData.outstanding.total },
                                                                                    { name: 'VS', count: proficiencyData.verySatisfactory.total },
                                                                                    { name: 'S', count: proficiencyData.satisfactory.total },
                                                                                    { name: 'FS', count: proficiencyData.fairlySatisfactory.total },
                                                                                    { name: 'Failed', count: proficiencyData.failed.total },
                                                                                ]}>
                                                                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                                                                    <YAxis tick={{ fontSize: 10 }} />
                                                                                    <Tooltip />
                                                                                    <Bar dataKey="count" fill="#8884d8">
                                                                                        {[
                                                                                            { name: 'O', color: '#10B981' },
                                                                                            { name: 'VS', color: '#34D399' },
                                                                                            { name: 'S', color: '#60A5FA' },
                                                                                            { name: 'FS', color: '#FBBF24' },
                                                                                            { name: 'Failed', color: '#EF4444' }
                                                                                        ].map((entry, index) => (
                                                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                                                        ))}
                                                                                    </Bar>
                                                                                </BarChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    </div>
                                                                    <div className="border border-gray-300 rounded p-2 bg-white flex flex-col items-center justify-center shadow-sm">
                                                                        <h4 className="text-xs font-bold text-gray-600 mb-2">MPS by Gender</h4>
                                                                        <div className="w-full h-40">
                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                <BarChart layout="vertical" data={[
                                                                                    { name: 'Male', mps: Number(mpsData.maleMps.toFixed(2)) },
                                                                                    { name: 'Female', mps: Number(mpsData.femaleMps.toFixed(2)) },
                                                                                ]}>
                                                                                    <XAxis type="number" domain={[0, 100]} hide />
                                                                                    <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 10 }} />
                                                                                    <Tooltip />
                                                                                    <Bar dataKey="mps" fill="#3B82F6" barSize={20} label={{ position: 'right', fill: '#666', fontSize: 10 }}>
                                                                                        <Cell fill="#60A5FA" />
                                                                                        <Cell fill="#F472B6" />
                                                                                    </Bar>
                                                                                </BarChart>
                                                                            </ResponsiveContainer>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col md:flex-row gap-4">
                                                                <div className="flex-1 border border-red-200 rounded overflow-hidden">
                                                                    <div className="bg-red-50 p-2 font-bold text-xs border-b border-red-200 text-red-700 uppercase flex items-center gap-2">
                                                                        <span>🚨 At-Risk Learners (Below 75)</span>
                                                                    </div>
                                                                    <div className="max-h-60 overflow-y-auto">
                                                                        <table className="w-full text-center text-[10px]">
                                                                            <thead className="sticky top-0 bg-red-50 shadow-sm">
                                                                                <tr className="text-red-800">
                                                                                    <th className="p-2 text-left w-2/3">NAME</th>
                                                                                    <th className="p-2">GRADE</th>
                                                                                    <th className="p-2">REMARKS</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {[...maleStudents, ...femaleStudents]
                                                                                    .map(s => ({ ...s, grade: getStudentSummary(s).quarterlyGrade }))
                                                                                    .filter(s => s.grade > 0 && s.grade < 75)
                                                                                    .sort((a, b) => a.grade - b.grade)
                                                                                    .map((s, idx) => (
                                                                                        <tr key={s.lrn} className="border-b border-red-50 hover:bg-red-50 transition-colors">
                                                                                            <td className="p-2 text-left truncate font-medium text-gray-700">{idx + 1}. {s.last_name}, {s.first_name}</td>
                                                                                            <td className="p-2 font-bold text-red-600">{s.grade}</td>
                                                                                            <td className="p-2 text-red-600 font-bold text-[9px] uppercase tracking-wider">Failed</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                {[...maleStudents, ...femaleStudents].filter(s => getStudentSummary(s).quarterlyGrade > 0 && getStudentSummary(s).quarterlyGrade < 75).length === 0 && (
                                                                                    <tr><td colSpan={3} className="p-4 text-gray-400 italic text-center">No learners at risk. Great job! 🎉</td></tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 border border-green-200 rounded overflow-hidden">
                                                                    <div className="bg-green-50 p-2 font-bold text-xs border-b border-green-200 text-green-700 uppercase flex items-center gap-2">
                                                                        <span>🏆 Top Performers (Outstanding)</span>
                                                                    </div>
                                                                    <div className="max-h-60 overflow-y-auto">
                                                                        <table className="w-full text-center text-[10px]">
                                                                            <thead className="sticky top-0 bg-green-50 shadow-sm">
                                                                                <tr className="text-green-800">
                                                                                    <th className="p-2 text-left w-2/3">NAME</th>
                                                                                    <th className="p-2">GRADE</th>
                                                                                    <th className="p-2">RANK</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {[...maleStudents, ...femaleStudents]
                                                                                    .map(s => ({ ...s, grade: getStudentSummary(s).quarterlyGrade }))
                                                                                    .filter(s => s.grade >= 90)
                                                                                    .sort((a, b) => b.grade - a.grade)
                                                                                    .slice(0, 10)
                                                                                    .map((s, idx) => (
                                                                                        <tr key={s.lrn} className="border-b border-green-50 hover:bg-green-50 transition-colors">
                                                                                            <td className="p-2 text-left truncate font-medium text-gray-700">{idx + 1}. {s.last_name}, {s.first_name}</td>
                                                                                            <td className="p-2 font-bold text-green-700">{s.grade}</td>
                                                                                            <td className="p-2 font-bold text-green-800 bg-green-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto text-[9px]">#{idx + 1}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                {[...maleStudents, ...femaleStudents].filter(s => getStudentSummary(s).quarterlyGrade >= 90).length === 0 && (
                                                                                    <tr><td colSpan={3} className="p-4 text-gray-400 italic text-center">No outstanding learners yet. Keep encouraging them! 💪</td></tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
