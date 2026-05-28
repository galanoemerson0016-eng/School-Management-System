/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Printer, CloudUpload, Plus, Minus } from 'lucide-react';
import type { ClassRecord, HPSRecord, Subject } from '../types';
import { getTermUpperLabel } from '../lib/terms';

import { getSubjectCluster, getWeights, transmuteGrade, getGradeDescriptorWithFilipino, formatGradeForDisplay } from '../lib/grading';
import { filterSectionsForUser, filterSubjectsForSection } from '../lib/rbac';

const WW_COUNT = 5;
const PT_COUNT = 3;
const ST_COUNT = 3;

const normalizeScores = (scores: (number | string)[] | undefined, count: number): (number | string)[] => {
    const src = Array.isArray(scores) ? scores : [];
    return Array.from({ length: count }, (_, i) => src[i] ?? '');
};

const getSubjectCategory = (subjectName: string, gradeLevel: string): string => {
    const norm = subjectName.trim().toLowerCase();
    const isG12 = gradeLevel.includes('12');

    if (isG12) {
        const normalized = norm.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        
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
            return normalized === cNorm || normalized.includes(cNorm) || cNorm.includes(normalized);
        })) {
            return 'Core';
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
            return normalized === aNorm || normalized.includes(aNorm) || aNorm.includes(normalized);
        })) {
            return 'Applied';
        }

        // 3. Specialized Subjects
        return 'Specialized';
    }

    // 1. Core Subject (All Tracks)
    const cores = [
        'effective communication',
        'mabisang komunikasyon',
        'general mathematics',
        'general science',
        'life and career skills',
        'pag-aaral ng kasaysayan at lipunang pilipino',
        'kasaysayan at lipunang pilipino'
    ];
    if (cores.some(c => norm.includes(c))) {
        return 'Core Subject (All Tracks)';
    }

    // 2. TechPro Elective (Work Immersion)
    if (norm.startsWith('work immersion')) {
        return 'TechPro Elective (Work Immersion)';
    }

    // 3. Academic Elective (Field Experience / Exposure, and Sports and Arts)
    if (norm.startsWith('field exposure') || norm.startsWith('field experience') || norm.includes('apprenticeship')) {
        return 'Academic Elective (Field Experience / Exposure, and Sports and Arts)';
    }

    // 4. TechPro Electives (All Other Electives)
    const techProElectives = [
        'beauty care', 'barbering', 'caregiving', 'hairdressing', 'wellness', 'massage', 'hilot',
        'agricultural crops', 'agro-entrepreneurship', 'aquaculture', 'fish capture', 'food processing',
        'organic agriculture', 'poultry', 'ruminants', 'swine', 'garments', 'handicrafts', 'weaving',
        'automotive servicing', 'electrical repair', 'engine and chassis', 'driving and automotive',
        'motorcycle', 'small engine', 'carpentry', 'construction operation', 'metal arc welding',
        'technical drafting', 'animation', 'illustration', 'visual graphics', 'bakery operation',
        'events management', 'food and beverage operation', 'hotel operation', 'housekeeping',
        'kitchen operations', 'tourism services', 'commercial air-conditioning', 'domestic refrigeration',
        'electrical installation', 'electronics product', 'mechatronics', 'photovoltaic',
        'broadband installation', 'computer programming', 'computer systems servicing',
        'contact center services', 'marine engineering', 'marine transportation', 'ships catering'
    ];
    if (techProElectives.some(tp => norm.includes(tp))) {
        return 'TechPro Elective (All Other Electives)';
    }

    // 5. Academic Elective (All Other Electives)
    return 'Academic Elective (All Other Electives)';
};


export function ShsEClassRecord() {
    const {
        students,
        sections,
        subjects,
        selectedSection: globalSection,
        selectedSubject: globalSubject,
        schoolProfile,
        activeSchoolYear,
        classRecords,
        updateClassRecord,
        deleteClassRecord,
        hpsRecords,
        updateHPSRecord,
        setSelectedSection: setGlobalSection,
        setSelectedSubject: setGlobalSubject,
        showNotification,
        teachers
    } = useAppStore();
    const { user } = useAuthStore();

    const [selectedSection, setSelectedSection] = useState(globalSection || '');
    const [selectedSubject, setSelectedSubject] = useState(globalSubject || '');
    const [quarter, setQuarter] = useState<1 | 2 | 3 | 'summary' | 'summary_t1' | 'summary_t2' | 'summary_t3' | 'summary_final'>(1);
    const [zoom, setZoom] = useState(0.95);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    const formatStudentFullName = (student: typeof students[number]) => {
        const middleName = student.middle_name?.trim();
        return `${student.last_name}, ${student.first_name}${middleName ? ` ${middleName}` : ''}`.toUpperCase();
    };

    // Sync store with local state
    useEffect(() => {
        if (globalSection && globalSection !== selectedSection) {
            setSelectedSection(globalSection);
        }
    }, [globalSection, selectedSection]);

    useEffect(() => {
        if (globalSubject && globalSubject !== selectedSubject) {
            setSelectedSubject(globalSubject);
        }
    }, [globalSubject, selectedSubject]);

    // Get the selected section's grade level
    const selectedSectionObj = useMemo(() => {
        return sections.find(s => s.section_name === selectedSection);
    }, [sections, selectedSection]);

    const sectionGradeLevel = selectedSectionObj?.section_grade_level || '';
    const selectedSubjectObj = useMemo(() => {
        return subjects.find(s => s.id === selectedSubject);
    }, [subjects, selectedSubject]);

    // Sort Sections
    const sortedSections = useMemo(() => {
        return [...filterSectionsForUser(user, sections, subjects)].sort((a, b) => {
            const getGradeNum = (g: string) => {
                const match = g.match(/\d+/);
                return match ? parseInt(match[0], 10) : 999;
            };
            const gradeA = getGradeNum(a.section_grade_level);
            const gradeB = getGradeNum(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, subjects, user]);

    // Update global store when local selection changes
    const onSectionChange = (val: string) => {
        setSelectedSection(val);
        setGlobalSection(val);
        setSelectedSubject('');
        setGlobalSubject('');
    };

    const onSubjectChange = (val: string) => {
        setSelectedSubject(val);
        setGlobalSubject(val);
    };

    // Filter & Sort Subjects
    const filteredSubjects = useMemo(() => {
        if (!selectedSectionObj) return [];
        let base = [...filterSubjectsForSection(user, selectedSectionObj, subjects)].filter(s => s.term !== 'none');

        // Filter based on the selected term (quarter) if it's a specific term (1, 2, 3)
        if (typeof quarter === 'number') {
            base = base.filter(s => s.term === undefined || s.term === null || s.term === 'all' || Number(s.term) === quarter);
        } else if (quarter === 'summary_t1') {
            base = base.filter(s => s.term === undefined || s.term === null || s.term === 'all' || Number(s.term) === 1);
        } else if (quarter === 'summary_t2') {
            base = base.filter(s => s.term === undefined || s.term === null || s.term === 'all' || Number(s.term) === 2);
        } else if (quarter === 'summary_t3') {
            base = base.filter(s => s.term === undefined || s.term === null || s.term === 'all' || Number(s.term) === 3);
        }
        return base.sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    }, [subjects, selectedSectionObj, user, quarter]);

    // Group subjects by category if it's SHS
    const groupedSubjects = useMemo(() => {
        const isG12 = sectionGradeLevel.includes('12');

        if (isG12) {
            const grouped = {
                'Core': [] as Subject[],
                'Applied': [] as Subject[],
                'Specialized': [] as Subject[]
            };

            filteredSubjects.forEach(s => {
                const cat = getSubjectCategory(s.subject_name, sectionGradeLevel);
                if (grouped[cat as keyof typeof grouped]) {
                    grouped[cat as keyof typeof grouped].push(s);
                } else {
                    grouped['Specialized'].push(s);
                }
            });

            return grouped;
        } else {
            const grouped = {
                'Core Subject (All Tracks)': [] as Subject[],
                'Academic Elective (All Other Electives)': [] as Subject[],
                'Academic Elective (Field Experience / Exposure, and Sports and Arts)': [] as Subject[],
                'TechPro Elective (All Other Electives)': [] as Subject[],
                'TechPro Elective (Work Immersion)': [] as Subject[]
            };

            filteredSubjects.forEach(s => {
                const cat = getSubjectCategory(s.subject_name, sectionGradeLevel);
                if (grouped[cat as keyof typeof grouped]) {
                    grouped[cat as keyof typeof grouped].push(s);
                } else {
                    grouped['Academic Elective (All Other Electives)'].push(s);
                }
            });

            return grouped;
        }
    }, [filteredSubjects, sectionGradeLevel]);

    // Reset selected subject if it's no longer offered in the current term
    useEffect(() => {
        if (selectedSubject && filteredSubjects.length > 0) {
            const exists = filteredSubjects.some(s => s.id === selectedSubject);
            if (!exists) {
                setSelectedSubject('');
                setGlobalSubject('');
            }
        }
    }, [quarter, filteredSubjects, selectedSubject, setGlobalSubject]);

    const effectiveSubjectId = selectedSubject;

    const subjectName = useMemo(() => {
        return subjects.find(s => s.id === effectiveSubjectId)?.subject_name || '';
    }, [subjects, effectiveSubjectId]);

    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        return students.filter((s) => s.student_section === selectedSection || (selectedSectionObj?.id && s.student_section === selectedSectionObj.id));
    }, [students, selectedSection, selectedSectionObj]);

    // Highest Possible Scores (HPS) - Persistent
    const hps = useMemo(() => {
        if (!effectiveSubjectId) {
            return { ww: Array(WW_COUNT).fill(''), pt: Array(PT_COUNT).fill(''), qa: Array(ST_COUNT).fill('') };
        }

        const record = hpsRecords.find(r =>
            r.subject_id === effectiveSubjectId &&
            r.school_year === activeSchoolYear &&
            Number(r.quarter) === quarter
        );

        const rawQa = (record as (HPSRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;

        const hps_ww = normalizeScores(record?.written_works, WW_COUNT).map(v => v === '' ? '' : Number(v));
        const hps_pt = normalizeScores(record?.performance_tasks, PT_COUNT).map(v => v === '' ? '' : Number(v));
        const hps_qa = normalizeScores(rawQa, ST_COUNT).map((v, i) => {
            if (i === 2 && (v === undefined || v === '')) {
                const legacy = record?.quarterly_exam;
                return (legacy === undefined || legacy === '') ? '' : Number(legacy);
            }
            return v === '' ? '' : Number(v);
        });

        return {
            ww: hps_ww,
            pt: hps_pt,
            qa: hps_qa
        };
    }, [hpsRecords, effectiveSubjectId, activeSchoolYear, quarter]);

    // Track/Strand determination
    const sectionTrack = useMemo(() => {
        if (!selectedSection) return '';
        const norm = selectedSection.toUpperCase();
        if (norm.includes('STEM')) return 'Academic - STEM';
        if (norm.includes('ABM')) return 'Academic - ABM';
        if (norm.includes('HUMSS')) return 'Academic - HUMSS';
        if (norm.includes('GAS')) return 'Academic - GAS';
        if (norm.includes('TVL') || norm.includes('TECHPRO') || norm.includes('HE') || norm.includes('ICT')) return 'Technical-Vocational-Livelihood (TVL)';
        return 'Academic Track';
    }, [selectedSection]);

    const currentCluster = useMemo(() => {
        return getSubjectCluster(subjectName, sectionGradeLevel, sectionTrack);
    }, [subjectName, sectionGradeLevel, sectionTrack]);

    const currentWeights = useMemo(() => {
        return getWeights(currentCluster);
    }, [currentCluster]);

    // Fetch Teacher Name
    const [teacherName, setTeacherName] = useState('');
    useEffect(() => {
        const fetchTeacher = async () => {
            if (user?.email?.includes('galanoemerson') || user?.displayName?.toLowerCase().includes('emerson')) {
                setTeacherName("EMERSON M. GALANO");
                return;
            }
            const targetSubject = subjects.find(s => s.id === effectiveSubjectId) || selectedSubjectObj;
            if (targetSubject?.teacher_id) {
                if (user?.uid === targetSubject.teacher_id) {
                    setTeacherName(user.displayName?.toUpperCase() || schoolProfile?.adviser_name?.toUpperCase() || "TEACHER");
                    return;
                }
                const teacher = teachers.find((entry) => entry.uid === targetSubject.teacher_id);
                if (teacher) {
                    setTeacherName(teacher.displayName?.toUpperCase() || "UNKNOWN TEACHER");
                    return;
                }
            }
            const fallbackName = selectedSectionObj?.adviser_name || schoolProfile?.adviser_name || user?.displayName || "";
            setTeacherName(fallbackName.toUpperCase());
        };
        fetchTeacher();
    }, [selectedSubjectObj, effectiveSubjectId, selectedSectionObj, user, teachers, schoolProfile, subjects]);

    const maleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Male').sort((a, b) => {
        return `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`);
    }), [sectionStudents]);

    const femaleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Female').sort((a, b) => {
        return `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`);
    }), [sectionStudents]);

    const optimalNameColumnWidth = 280;

    const getStudentSummary = useCallback((student: typeof students[0]) => {
        const record = classRecords.find(r =>
            r.student_lrn === student.lrn &&
            r.subject_id === effectiveSubjectId &&
            Number(r.quarter) === quarter
        );

        const sGrades: Pick<ClassRecord, 'written_works' | 'performance_tasks' | 'quarterly_exam'> = record || {
            written_works: Array(WW_COUNT).fill(''),
            performance_tasks: Array(PT_COUNT).fill(''),
            quarterly_exam: ''
        };

        const wwScores = normalizeScores(sGrades.written_works, WW_COUNT).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });
        const ptScores = normalizeScores(sGrades.performance_tasks, PT_COUNT).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });
        const rawQaRec = (record as (ClassRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;
        const qaScores = normalizeScores(rawQaRec, ST_COUNT).map(s => {
            const n = Number(s);
            return (s === '' || s === null || s === undefined || isNaN(n)) ? '' : n;
        });

        if (qaScores[2] === '' && sGrades.quarterly_exam !== '' && sGrades.quarterly_exam !== 0 && sGrades.quarterly_exam !== '0') {
            qaScores[2] = Number(sGrades.quarterly_exam);
        }

        const wwTotalScore = wwScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const wwTotalHPS = hps.ww.reduce<number>((a, b) => a + Number(b), 0);
        const wwPS = wwTotalHPS === 0 ? 0 : (wwTotalScore / wwTotalHPS) * 100;
        const wwWS = wwPS * (currentWeights.written_works || 0);

        const ptTotalScore = ptScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const ptTotalHPS = hps.pt.reduce<number>((a, b) => a + Number(b), 0);
        const ptPS = ptTotalHPS === 0 ? 0 : (ptTotalScore / ptTotalHPS) * 100;
        const ptWS = ptPS * (currentWeights.performance_tasks || 0);

        const qaScore = qaScores.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const qaHPS = hps.qa.reduce<number>((a, b) => a + Number(b), 0);
        const qaPS = qaHPS === 0 ? 0 : (qaScore / qaHPS) * 100;
        const qaWS = qaPS * (currentWeights.quarterly_exam || 0);

        const initialGrade = (wwWS || 0) + (ptWS || 0) + (qaWS || 0);

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            wwScores.some(isValidScore) ||
            ptScores.some(isValidScore) ||
            qaScores.some(isValidScore);

        const quarterlyGrade = hasScores ? transmuteGrade(initialGrade) : 0;

        return {
            ww: wwScores,
            pt: ptScores,
            qa: qaScores,
            hasScores,
            wwTotalScore, wwTotalHPS, wwPS, wwWS,
            ptTotalScore, ptTotalHPS, ptPS, ptWS,
            qaScore, qaHPS, qaPS, qaWS,
            initialGrade: isNaN(initialGrade) ? 0 : initialGrade,
            quarterlyGrade: isNaN(quarterlyGrade) ? 0 : quarterlyGrade
        };
    }, [classRecords, effectiveSubjectId, quarter, hps, currentWeights]);

    const getGradeDescriptor = useCallback((grade: number, hasScores: boolean) => {
        if (!hasScores || grade <= 0) return '';
        return getGradeDescriptorWithFilipino(grade, sectionGradeLevel);
    }, [sectionGradeLevel]);

    const getSummaryGrades = useCallback((student: typeof students[0]) => {
        let total = 0;
        let count = 0;
        const terms = [1, 2, 3].map(q => {
            const record = classRecords.find(r =>
                r.student_lrn === student.lrn &&
                r.subject_id === selectedSubject &&
                Number(r.quarter) === q
            );
            const grade = record?.final_grade ? Number(record.final_grade) : 0;
            if (grade > 0) {
                total += grade;
                count++;
            }
            return grade > 0 ? grade : '';
        });

        const final = count > 0 ? Math.round(total / count) : '';
        const descriptor = final !== '' ? getGradeDescriptor(Number(final), true) : '';

        return {
            t1: terms[0],
            t2: terms[1],
            t3: terms[2],
            final,
            descriptor
        };
    }, [classRecords, selectedSubject, getGradeDescriptor]);

    const proficiencyData = useMemo(() => {
        const levels = [
            { key: 'advancing', min: 90, max: 100 },
            { key: 'benchmarking', min: 80, max: 89 },
            { key: 'connecting', min: 75, max: 79 },
            { key: 'developing', min: 65, max: 74 },
            { key: 'emerging', min: 0, max: 64 }
        ] as const;

        const data: Record<string, { male: number; female: number; total: number }> = {};

        levels.forEach(level => {
            const m = maleStudents.filter(s => {
                const summary = getStudentSummary(s);
                const g = summary.quarterlyGrade;
                return g > 0 && g >= level.min && g <= level.max;
            }).length;
            const f = femaleStudents.filter(s => {
                const summary = getStudentSummary(s);
                const g = summary.quarterlyGrade;
                return g > 0 && g >= level.min && g <= level.max;
            }).length;
            data[level.key] = { male: m, female: f, total: m + f };
        });

        return data;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maleStudents, femaleStudents, quarter, hps, currentWeights, selectedSubject, getStudentSummary]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maleStudents, femaleStudents, quarter, hps, currentWeights, selectedSubject, getStudentSummary]);

    const summativeAnalysis = useMemo(() => {
        const results = [0, 1, 2].map(index => {
            const scores = [...maleStudents, ...femaleStudents]
                .map(s => getStudentSummary(s).qa[index])
                .filter(s => s !== '' && s !== null && s !== undefined)
                .map(s => Number(s));
            
            const totalStudents = scores.length;
            const hpsVal = Number(hps.qa[index]) || 0;
            
            if (totalStudents === 0 || hpsVal === 0) {
                return {
                    count: 0,
                    hps: hpsVal,
                    criterion: { above75: 0, above75Pct: 0, below75: 0, below75Pct: 0 },
                    norm: { mean: 0, median: 0, sd: 0, mps: 0 },
                    other: { high: 0, low: 0, total: 0 }
                };
            }

            const above75 = scores.filter(s => (s / hpsVal) * 100 >= 75).length;
            const below75 = totalStudents - above75;

            const mean = scores.reduce((a, b) => a + b, 0) / totalStudents;
            const sorted = [...scores].sort((a, b) => a - b);
            const median = totalStudents % 2 === 0 
                ? (sorted[totalStudents / 2 - 1] + sorted[totalStudents / 2]) / 2 
                : sorted[Math.floor(totalStudents / 2)];
            
            const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / totalStudents;
            const sd = Math.sqrt(variance);
            const mps = (mean / hpsVal) * 100;

            return {
                count: totalStudents,
                hps: hpsVal,
                criterion: {
                    above75,
                    above75Pct: (above75 / totalStudents) * 100,
                    below75,
                    below75Pct: (below75 / totalStudents) * 100
                },
                norm: { mean, median, sd, mps },
                other: {
                    high: Math.max(...scores),
                    low: Math.min(...scores),
                    total: scores.reduce((a, b) => a + b, 0)
                }
            };
        });

        return { st1: results[0], st2: results[1], te: results[2] };
    }, [maleStudents, femaleStudents, hps.qa, getStudentSummary]);

    const updateHPS = (type: 'ww' | 'pt' | 'qa', index: number, value: string) => {
        if (!effectiveSubjectId) return;

        const numVal: number | string = value === '' ? '' : Number(value);
        if (typeof numVal === 'number' && isNaN(numVal)) return;

        const existingRecord = hpsRecords.find(r =>
            r.subject_id === effectiveSubjectId &&
            r.school_year === activeSchoolYear &&
            Number(r.quarter) === (quarter as number)
        );

        const newRecord: HPSRecord = existingRecord ? { ...existingRecord } : {
            id: `hps_${effectiveSubjectId}_Q${quarter}_${activeSchoolYear}`,
            subject_id: effectiveSubjectId,
            school_year: activeSchoolYear,
            quarter: quarter as any,
            written_works: Array(WW_COUNT).fill(''),
            performance_tasks: Array(PT_COUNT).fill(''),
            quarterly_exam: ''
        };

        const hpsWithSummative = newRecord as HPSRecord & { summative_tests?: (number | string)[] };
        const currentQa = normalizeScores(hpsWithSummative.summative_tests, ST_COUNT);

        if (type === 'qa') {
            currentQa[index] = numVal;
            hpsWithSummative.summative_tests = currentQa;
            newRecord.quarterly_exam = currentQa[2];
        } else if (type === 'ww') {
            const newWW = [...newRecord.written_works];
            newWW[index] = numVal;
            newRecord.written_works = newWW;
        } else if (type === 'pt') {
            const newPT = [...newRecord.performance_tasks];
            newPT[index] = numVal;
            newRecord.performance_tasks = newPT;
        }

        updateHPSRecord(newRecord);
    };

    const updateGrade = (lrn: string, type: 'ww' | 'pt' | 'qa', index: number, value: string) => {
        if (!selectedSection || !effectiveSubjectId) return;

        const existingRecord = classRecords.find(r =>
            r.student_lrn === lrn &&
            r.subject_id === effectiveSubjectId &&
            Number(r.quarter) === (quarter as number)
        );

        const record: ClassRecord = existingRecord ? { ...existingRecord } : {
            id: `grade_${lrn}_${effectiveSubjectId}_Q${quarter}`,
            student_lrn: lrn,
            section_id: sections.find(s => s.section_name === selectedSection)?.id || '',
            subject_id: effectiveSubjectId,
            school_year: activeSchoolYear,
            quarter: quarter as any,
            written_works: Array(WW_COUNT).fill(''),
            performance_tasks: Array(PT_COUNT).fill(''),
            quarterly_exam: '',
            final_grade: '',
            is_teaching_load: true
        };

        const recordWithSummative = record as ClassRecord & { summative_tests?: (number | string)[] };
        const qaScores = normalizeScores(recordWithSummative.summative_tests, ST_COUNT);
        if (!qaScores[2] && recordWithSummative.quarterly_exam !== '') qaScores[2] = recordWithSummative.quarterly_exam;

        const parsedVal: number | string = value === '' ? '' : Number(value);

        if (typeof parsedVal === 'number') {
            let currentHPS = 0;
            if (type === 'ww') currentHPS = Number(hps.ww[index]);
            else if (type === 'pt') currentHPS = Number(hps.pt[index]);
            else if (type === 'qa') currentHPS = Number(hps.qa[index]);

            if (parsedVal > currentHPS) {
                showNotification(`Score (${parsedVal}) cannot be higher than the Highest Possible Score (${currentHPS}).`, 'error');
                return;
            }
        }

        if (type === 'qa') {
            qaScores[index] = parsedVal;
            recordWithSummative.summative_tests = qaScores;
            record.quarterly_exam = qaScores[2];
        } else if (type === 'ww') {
            const newWW = [...record.written_works];
            newWW[index] = parsedVal;
            record.written_works = newWW;
        } else if (type === 'pt') {
            const newPT = [...record.performance_tasks];
            newPT[index] = parsedVal;
            record.performance_tasks = newPT;
        }

        const normalizedWW = normalizeScores(record.written_works, WW_COUNT);
        const normalizedPT = normalizeScores(record.performance_tasks, PT_COUNT);

        const wwTotalScore = normalizedWW.reduce<number>((a, b) => a + Number(b), 0);
        const wwTotalHPS = hps.ww.reduce((a, b) => a + b, 0);
        const wwPS = wwTotalHPS === 0 ? 0 : (wwTotalScore / wwTotalHPS) * 100;
        const wwWS = wwPS * currentWeights.written_works;

        const ptTotalScore = normalizedPT.reduce<number>((a, b) => a + Number(b), 0);
        const ptTotalHPS = hps.pt.reduce((a, b) => a + b, 0);
        const ptPS = ptTotalHPS === 0 ? 0 : (ptTotalScore / ptTotalHPS) * 100;
        const ptWS = ptPS * currentWeights.performance_tasks;

        const qaScore = qaScores.reduce<number>((a, b) => a + Number(b), 0);
        const qaHPS = hps.qa.reduce((a, b) => a + Number(b), 0);
        const qaPS = qaHPS === 0 ? 0 : (qaScore / qaHPS) * 100;
        const qaWS = qaPS * currentWeights.quarterly_exam;

        const initialGrade = wwWS + ptWS + qaWS;

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            normalizedWW.some(isValidScore) ||
            normalizedPT.some(isValidScore) ||
            qaScores.some(isValidScore);

        if (!hasScores) {
            deleteClassRecord(record.id);
            const { deleteGradingSheetRecord } = useAppStore.getState();
            deleteGradingSheetRecord(`${record.student_lrn}_${record.subject_id}_${record.quarter}_${record.school_year}`);
        } else {
            record.final_grade = transmuteGrade(initialGrade);
            updateClassRecord(record);

            const { updateGradingSheetRecord } = useAppStore.getState();
            updateGradingSheetRecord({
                id: `${record.student_lrn}_${record.subject_id}_${record.quarter}_${record.school_year}`,
                student_lrn: record.student_lrn,
                subject_id: record.subject_id,
                section_id: record.section_id,
                quarter: record.quarter as 1|2|3,
                school_year: record.school_year,
                final_grade: record.final_grade,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
            let nextRow = rowIndex;
            let nextCol = colIndex;

            if (e.key === 'ArrowUp') nextRow--;
            else if (e.key === 'ArrowDown' || e.key === 'Enter') nextRow++;
            else if (e.key === 'ArrowLeft') nextCol--;
            else if (e.key === 'ArrowRight') nextCol++;
            else return;

            e.preventDefault();
            const nextInput = document.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`) as HTMLInputElement;
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        }
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        const sectionName = selectedSectionObj ? `${selectedSectionObj.section_grade_level}-${selectedSectionObj.section_name}` : '';
        const subjectName = selectedSubjectObj?.subject_name || '';
        document.title = `SHS_Class_Record_${sectionName}_${subjectName}_T${quarter}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };


    return (
        <div className="h-full min-h-0 flex flex-col gap-3">
            <style>{`
                @media print {
                    @page {
                        size: ${quarter === 'summary' ? '8.5in 13in' : '13in 8.5in'};
                        margin: ${quarter === 'summary' ? '0.5in 0.25in' : '0.12in 0.18in'};
                    }
                    body {
                        visibility: hidden;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #printable-class-record, #printable-summary-record {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: 100%;
                        margin: 0;
                        padding: 0 0.06in;
                        overflow: visible !important;
                        box-sizing: border-box;
                    }
                    #printable-class-record * {
                        visibility: visible;
                    }
                    .eclass-zoom-shell {
                        transform: none !important;
                    }
                    .no-print, header, nav, aside {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="bg-white rounded-lg shadow-md p-3 no-print">
                <div className="flex flex-col lg:flex-row lg:flex-nowrap lg:items-end gap-3 lg:gap-2.5">
                    <div className="w-full lg:w-[210px] shrink-0">
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[13px] font-semibold text-deped-blue">Section</label>
                        </div>
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
                    <div className="w-full lg:flex-1 lg:min-w-0">
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[13px] font-semibold text-deped-blue">
                                Subject {sectionGradeLevel && `(${sectionGradeLevel})`}
                            </label>
                        </div>
                        <select
                            value={selectedSubject}
                            onChange={(e) => onSubjectChange(e.target.value)}
                            className="form-input"
                            disabled={!selectedSection}
                        >
                            <option value="">{selectedSection ? 'Select Subject' : 'Select a section first'}</option>
                            {groupedSubjects ? (
                                Object.entries(groupedSubjects).map(([category, items]) => {
                                    if (items.length === 0) return null;
                                    return (
                                        <optgroup key={category} label={category}>
                                            {items.map((s) => (
                                                <option key={s.id} value={s.id}>{s.subject_name}</option>
                                            ))}
                                        </optgroup>
                                    );
                                })
                            ) : (
                                filteredSubjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.subject_name}</option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="w-full lg:w-[150px] shrink-0">
                        <label className="block text-[13px] font-semibold mb-1.5 text-deped-blue">Term</label>
                        <select value={quarter} onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('summary')) {
                                setQuarter(val as any);
                            } else {
                                setQuarter(Number(val) as any);
                            }
                        }} className="form-input">
                            <option value={1}>Term 1</option>
                            <option value={2}>Term 2</option>
                            <option value={3}>Term 3</option>
                            <option value="summary_final">Final Summary</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-1.5 h-9 px-1 rounded-xl bg-slate-100 border border-slate-200">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                                title="Zoom Out"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-black text-slate-900 w-10 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                                title="Zoom In"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <button onClick={handlePrint} className="btn-primary flex items-center justify-center gap-2 h-9 px-4 whitespace-nowrap">
                            <Printer className="w-4 h-4" /> Print Record
                        </button>
                        <button
                            onClick={async () => {
                                if (!selectedSubjectObj || !sectionStudents.length || (typeof quarter === 'string' && quarter.startsWith('summary'))) return;
                                
                                const termName = quarter === 1 ? '1st' : quarter === 2 ? '2nd' : '3rd';
                                const confirmMsg = `Publish ${termName} Term grades for ${selectedSubjectObj.subject_name} to the official Grade Management?\n\nThis will update the SF9/Advisory records for ${selectedSection}.`;
                                if (!window.confirm(confirmMsg)) return;

                                try {
                                    const { updateGradingSheetRecord } = useAppStore.getState();
                                    let count = 0;
                                    for (const student of sectionStudents) {
                                        const summary = getStudentSummary(student);
                                        if (summary.hasScores && summary.quarterlyGrade > 0) {
                                            const recordId = `${student.lrn}_${selectedSubject}_${quarter}_${activeSchoolYear}`;
                                            await updateGradingSheetRecord({
                                                id: recordId,
                                                student_lrn: student.lrn,
                                                subject_id: selectedSubject,
                                                section_id: selectedSectionObj?.id || '',
                                                quarter: quarter as 1|2|3,
                                                school_year: activeSchoolYear,
                                                final_grade: summary.quarterlyGrade,
                                                written_works: [],
                                                performance_tasks: [],
                                                quarterly_exam: 0
                                            });
                                            count++;
                                        }
                                    }
                                    showNotification(`Successfully published ${count} grades to official records!`, 'success');
                                } catch {
                                    showNotification("Failed to publish grades.", "error");
                                }
                            }}
                            disabled={!selectedSubject || sectionStudents.length === 0 || (typeof quarter === 'string' && quarter.startsWith('summary'))}
                            className="h-9 px-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all flex items-center gap-2 group disabled:opacity-30 disabled:grayscale"
                        >
                            <CloudUpload className="w-4 h-4" /> Publish
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-200/60 flex-1 min-h-0">
                <div className="bg-slate-50/50 p-3 md:p-4 h-full min-h-0 overflow-auto custom-scrollbar">
                    <div className="w-full min-h-full flex justify-center overflow-x-auto py-2">
                    <div
                        className="eclass-zoom-shell origin-top transition-all duration-300"
                        style={{ transform: `scale(${zoom})` }}
                    >
                    {typeof quarter === 'string' && quarter.startsWith('summary') ? (
                        <div id="printable-summary-record" className="w-[816px] max-w-full bg-white px-8 py-10 mx-auto print:p-0 font-sans shadow-[0_0_50px_rgba(0,0,0,0.05)] print:shadow-none border border-gray-100 print:border-none">
                            <div className="flex flex-col mb-4">
                                <div className="flex justify-between items-center w-full px-4 print:px-1 mb-2">
                                    <div className="w-20 h-20 shrink-0">
                                        <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="text-center flex-1 mx-4 text-black">
                                        <h1 className="text-xl font-bold font-sans tracking-tight text-black mb-0">Strengthened Senior High School Class Record</h1>
                                        <p className="text-[8px] italic text-[#1d4ed8] font-sans mt-1.5 font-bold mb-0">
                                            (Pursuant to DepEd Order 8 series of 2015)
                                        </p>
                                    </div>
                                    <div className="w-32 h-20 shrink-0 flex items-center justify-center">
                                        <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-bold text-black uppercase w-full">
                                    <div className="flex flex-col gap-0 w-[38%] text-[11px] font-bold text-black">
                                        <div className="flex items-center">
                                            <span className="w-24 text-right pr-2 font-black text-[11px]">REGION</span>
                                            <div className="border border-black px-2 py-0.5 flex-1 bg-white truncate h-[22px] flex items-center font-bold text-[11px]">{schoolProfile.region}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-24 text-right pr-2 font-black text-[11px]">SCHOOL NAME</span>
                                            <div className="border-x border-b border-black px-2 py-0.5 flex-1 bg-white truncate h-[22px] flex items-center font-bold text-[11px]">{schoolProfile.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-0 w-[32%] text-[11px] font-bold text-black">
                                        <div className="flex items-center">
                                            <span className="w-20 text-right pr-2 font-black text-[11px]">DIVISION</span>
                                            <div className="border border-black px-2 py-0.5 flex-1 bg-white truncate h-[22px] flex items-center font-bold text-[11px]">{schoolProfile.division}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-20 text-right pr-2 font-black text-[11px]">SCHOOL ID</span>
                                            <div className="border-x border-b border-black px-2 py-0.5 flex-1 bg-white truncate h-[22px] flex items-center font-bold text-[11px]">{schoolProfile.school_id}</div>
                                        </div>
                                    </div>
                                    <div className="w-[30%] flex items-stretch h-[44px]">
                                        <div className="px-3 flex items-center bg-transparent font-black text-[11px] uppercase whitespace-nowrap">SCHOOL YEAR</div>
                                        <div className="border border-black flex-1 bg-white flex items-center justify-center font-bold text-[11px]">{activeSchoolYear}</div>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full border-collapse border border-black text-[9px] font-sans text-black mb-2 bg-white">
                                <tbody>
                                    <tr className="h-6">
                                        <td rowSpan={2} className="border border-black text-center font-black text-[11px] uppercase w-[12%] px-2">
                                            {quarter === 'summary_final' ? 'FINAL SUMMARY' :
                                             quarter === 'summary_t1' ? 'TERM 1 SUMMARY' :
                                             quarter === 'summary_t2' ? 'TERM 2 SUMMARY' :
                                             quarter === 'summary_t3' ? 'TERM 3 SUMMARY' :
                                             'SUMMARY OF GRADES'}
                                        </td>
                                        <td rowSpan={2} className="border border-black px-2 py-0.5 text-black font-black text-[11px] w-[13%] text-center uppercase leading-tight">
                                            GRADE LEVEL AND<br/>SECTION
                                        </td>
                                        <td rowSpan={2} className="border border-black text-center font-black text-[11px] w-[15%] uppercase px-1 whitespace-nowrap">
                                            {sectionGradeLevel.replace('Grade ', '')} - {selectedSection.replace(sectionGradeLevel.replace('Grade ', ''), '').replace('-', '').trim()}
                                        </td>
                                        <td className="border border-black px-2 py-1 w-[30%] text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">TEACHER:</span>
                                                <span className="uppercase font-bold text-black text-[11px] flex-1 leading-none">{teacherName}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black px-2 py-1 w-[30%] text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">SUBJECT:</span>
                                                <span className="uppercase font-bold text-black text-[11px] truncate flex-1 leading-none" title={subjectName}>{subjectName}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="h-6">
                                        <td className="border border-black px-2 py-1 text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">TRACK:</span>
                                                <span className="uppercase font-bold text-black text-[11px] flex-1 leading-none">{sectionTrack}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black px-2 py-1 text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">SUBJECT TYPE:</span>
                                                <span className="uppercase font-bold text-black text-[11px] flex-1 leading-none">{getSubjectCategory(subjectName, sectionGradeLevel)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="w-full border-collapse border border-black text-[11px] font-sans bg-white text-black">
                                <thead className="print:table-header-group bg-white font-bold uppercase">
                                    <tr className="text-center text-[10px] font-bold bg-gray-100 h-10">
                                        <th className="border border-black w-8"></th>
                                        <th className="border border-black p-2 align-middle w-[250px] text-center tracking-wider">LEARNERS' NAMES</th>
                                        <th className="border border-black p-1 w-[80px]">TERM 1</th>
                                        <th className="border border-black p-1 w-[80px]">TERM 2</th>
                                        <th className="border border-black p-1 w-[80px]">TERM 3</th>
                                        <th className="border border-black p-1 w-[90px]">FINAL GRADE</th>
                                        <th className="border border-black p-1 w-[100px]">DESCRIPTOR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-gray-200 font-bold">
                                        <td colSpan={7} className="border border-black text-left px-2 py-0.5 text-[10px] tracking-widest uppercase">MALE</td>
                                    </tr>
                                    {maleStudents.map((student, i) => {
                                        const summary = getSummaryGrades(student);
                                        return (
                                            <tr key={student.lrn} className="h-7 hover:bg-gray-50 transition-colors">
                                                <td className="border border-black text-center font-bold text-[10px]">{i + 1}</td>
                                                <td className="border border-black text-left px-2 uppercase text-[10px] font-bold truncate max-w-[250px]">
                                                    {formatStudentFullName(student)}
                                                </td>
                                                <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t1, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t2, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t3, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-bold bg-gray-50 text-[9px] text-deped-blue px-1 whitespace-normal wrap-break-word">{summary.descriptor}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-gray-200 font-bold">
                                        <td colSpan={7} className="border border-black text-left px-2 py-0.5 text-[10px] tracking-widest uppercase">FEMALE</td>
                                    </tr>
                                    {femaleStudents.map((student, i) => {
                                        const summary = getSummaryGrades(student);
                                        return (
                                            <tr key={student.lrn} className="h-7 hover:bg-gray-50 transition-colors">
                                                <td className="border border-black text-center font-bold text-[10px]">{i + 1}</td>
                                                <td className="border border-black text-left px-2 uppercase text-[10px] font-bold truncate max-w-[250px]">
                                                    {formatStudentFullName(student)}
                                                </td>
                                                <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t1, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t2, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-semibold">{formatGradeForDisplay(summary.t3, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                <td className="border border-black text-center font-bold bg-gray-50 text-[9px] text-deped-blue px-1 whitespace-normal wrap-break-word">{summary.descriptor}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                    <div className="bg-slate-50/50 p-3 md:p-4 text-black">
                        <div id="printable-class-record" className="min-w-[1200px] bg-white p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.05)] border border-gray-100 mx-auto">
                            {[
                                { gender: 'MALE' as const, students: maleStudents },
                                { gender: 'FEMALE' as const, students: femaleStudents }
                            ].map((section, sectionIdx) => (
                            <div key={section.gender} className={`p-4 print:p-0 ${sectionIdx === 0 ? 'print:break-after-page' : 'print:mt-6'}`}>
                             <div className="flex flex-col mb-4">
                                 <div className="flex justify-between items-center w-full px-4 print:px-1 mb-2">
                                     <div className="w-20 h-20 shrink-0">
                                         <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                     </div>
                                     <div className="text-center flex-1 mx-4 text-black">
                                         <h1 className="text-xl font-bold font-sans tracking-tight text-black mb-0">Strengthened Senior High School Class Record</h1>
                                         <p className="text-[8px] italic text-[#1d4ed8] font-sans mt-1.5 font-bold mb-0">
                                             (Pursuant to DepEd Order 8 series of 2015)
                                         </p>
                                     </div>
                                     <div className="w-32 h-20 shrink-0 flex items-center justify-center">
                                         <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                     </div>
                                 </div>

                                 <div className="flex items-center justify-between text-[11px] font-bold text-black uppercase w-full">
                                     <div className="flex flex-col gap-0 w-[38%] text-[11px] font-bold text-black">
                                         <div className="flex items-center">
                                             <span className="w-24 text-right pr-2 font-black text-[11px]">REGION</span>
                                             <div className="border border-black px-2 py-0.5 flex-1 bg-white truncate h-[22px] flex items-center font-bold text-[11px]">{schoolProfile.region}</div>
                                         </div>
                                         <div className="flex items-center">
                                             <span className="w-24 text-right pr-2 font-black text-[11px]">SCHOOL NAME</span>
                                             <div className="border-x border-b border-black px-2 py-0.5 flex-1 bg-white truncate h-[22px] flex items-center font-bold text-[11px]">{schoolProfile.name}</div>
                                         </div>
                                     </div>
                                     <div className="flex flex-col gap-0 w-[32%] text-[11px] font-bold text-black">
                                         <div className="flex items-center">
                                             <span className="w-20 text-right pr-2 font-black text-[11px]">DIVISION</span>
                                             <div className="border border-black px-2 py-0.5 flex-1 bg-white truncate h-[22px] flex items-center font-bold text-[11px]">{schoolProfile.division}</div>
                                         </div>
                                         <div className="flex items-center">
                                             <span className="w-20 text-right pr-2 font-black text-[11px]">SCHOOL ID</span>
                                             <div className="border-x border-b border-black px-2 py-0.5 flex-1 bg-white truncate h-[22px] flex items-center font-bold text-[11px]">{schoolProfile.school_id}</div>
                                         </div>
                                     </div>
                                     <div className="w-[30%] flex items-stretch h-[44px]">
                                         <div className="px-3 flex items-center bg-transparent font-black text-[11px] uppercase whitespace-nowrap">SCHOOL YEAR</div>
                                         <div className="border border-black flex-1 bg-white flex items-center justify-center font-bold text-[11px]">{activeSchoolYear}</div>
                                     </div>
                                 </div>
                             </div>

                            <table className="w-full border-collapse border border-black text-[9px] font-sans text-black mb-2 bg-white">
                                <tbody>
                                    <tr className="h-6">
                                        <td rowSpan={2} className="border border-black text-center font-black text-[11px] uppercase w-[12%] px-2">
                                            {typeof quarter === 'string' && quarter.startsWith('summary') ? (
                                                quarter === 'summary_final' ? 'FINAL SUMMARY' :
                                                quarter === 'summary_t1' ? 'TERM 1 SUMMARY' :
                                                quarter === 'summary_t2' ? 'TERM 2 SUMMARY' :
                                                quarter === 'summary_t3' ? 'TERM 3 SUMMARY' :
                                                'SUMMARY OF GRADES'
                                            ) : (
                                                getTermUpperLabel(quarter as any)
                                            )}
                                        </td>
                                        <td rowSpan={2} className="border border-black px-2 py-0.5 text-black font-black text-[11px] w-[13%] text-center uppercase leading-tight">
                                            GRADE LEVEL AND<br/>SECTION
                                        </td>
                                        <td rowSpan={2} className="border border-black text-center font-black text-[11px] w-[15%] uppercase px-1 whitespace-nowrap">
                                            {sectionGradeLevel.replace('Grade ', '')} - {selectedSection.replace(sectionGradeLevel.replace('Grade ', ''), '').replace('-', '').trim()}
                                        </td>
                                        <td className="border border-black px-2 py-1 w-[30%] text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">TEACHER:</span>
                                                <span className="uppercase font-bold text-black text-[11px] flex-1 leading-none">{teacherName}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black px-2 py-1 w-[30%] text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">SUBJECT:</span>
                                                <span className="uppercase font-bold text-black text-[11px] truncate flex-1 leading-none" title={subjectName}>{subjectName}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="h-6">
                                        <td className="border border-black px-2 py-1 text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">TRACK:</span>
                                                <span className="uppercase font-bold text-black text-[11px] flex-1 leading-none">{sectionTrack}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black px-2 py-1 text-left align-middle">
                                            <div className="flex items-center h-full leading-none">
                                                <span className="font-black text-black mr-1.5 text-[11px] shrink-0">SUBJECT TYPE:</span>
                                                <span className="uppercase font-bold text-black text-[11px] flex-1 leading-none">{getSubjectCategory(subjectName, sectionGradeLevel)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="w-full table-fixed border-collapse border-2 border-black text-[10px] text-center bg-white text-black font-sans">
                                <thead>
                                    <tr className="bg-gray-100 h-10">
                                        <th rowSpan={2} className="border border-black p-1 align-middle text-[9px] tracking-wide font-black" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>LEARNERS' NAMES</th>
                                        <th colSpan={8} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8px] tracking-wider bg-blue-50/50">WRITTEN / ORAL WORKS ({Math.round(currentWeights.written_works * 100)}%)</th>
                                        <th colSpan={6} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8px] tracking-wider bg-green-50/50 leading-tight">
                                            <span>PRODUCT / PERFORMANCE</span><br />
                                            <span>TASKS ({Math.round(currentWeights.performance_tasks * 100)}%)</span>
                                        </th>
                                        <th colSpan={6} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8px] tracking-wider bg-yellow-50/50 leading-tight">
                                            <span>SUMMATIVE TESTS & TERM</span><br />
                                            <span>EXAMINATION ({Math.round(currentWeights.quarterly_exam * 100)}%)</span>
                                        </th>
                                        <th rowSpan={3} className="border border-black w-14 min-w-14 max-w-14 p-1 align-middle bg-yellow-100/50 font-bold leading-none text-[8px]">INITIAL GRADE</th>
                                        <th rowSpan={3} className="border border-black w-20 min-w-20 max-w-20 p-1 align-middle bg-green-100 font-bold leading-none text-[8px] whitespace-normal wrap-break-word">TRANSMUTED GRADE</th>
                                        <th rowSpan={3} className="border border-black w-20 min-w-20 max-w-20 p-1 align-middle bg-blue-100 font-bold leading-none text-[8px] whitespace-normal wrap-break-word">DESCRIPTOR</th>
                                    </tr>
                                    <tr className="bg-gray-50 h-7 text-[8px]">
                                        {[1, 2, 3, 4, 5].map(i => <th key={`ww-${i}`} className="border border-black w-6 font-bold">{i}</th>)}
                                        <th className="border border-black w-10 bg-slate-100 font-bold">Total</th>
                                        <th className="border border-black w-12 bg-slate-100 font-bold">PS</th>
                                        <th className="border border-black w-12 bg-slate-100 font-bold">WS</th>
                                        {[1, 2, 3].map(i => <th key={`pt-${i}`} className="border border-black w-6 font-bold">{i}</th>)}
                                        <th className="border border-black w-10 bg-slate-100 font-bold">Total</th>
                                        <th className="border border-black w-12 bg-slate-100 font-bold">PS</th>
                                        <th className="border border-black w-12 bg-slate-100 font-bold">WS</th>
                                        <th className="border border-black w-10 font-bold">ST1</th>
                                        <th className="border border-black w-10 font-bold">ST2</th>
                                        <th className="border border-black w-10 font-bold">TE</th>
                                        <th className="border border-black w-10 bg-slate-100 font-bold">Total</th>
                                        <th className="border border-black w-12 bg-slate-100 font-bold">PS</th>
                                        <th className="border border-black w-12 bg-slate-100 font-bold">WS</th>
                                    </tr>
                                    <tr className="bg-blue-50/40 font-bold h-8 text-[8px]">
                                        <td className="border border-black p-1 text-left whitespace-nowrap tracking-wide text-[9px] font-black uppercase bg-slate-100" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>HIGHEST POSSIBLE SCORE</td>
                                        {hps.ww.map((val, i) => (
                                            <td key={`hps-ww-${i}`} className="border border-black p-0">
                                                <input
                                                    type="number"
                                                    value={val === '' ? '' : val}
                                                    onChange={(e) => updateHPS('ww', i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, i)}
                                                    data-row={0}
                                                    data-col={i}
                                                    className="w-full h-full text-center bg-transparent outline-none p-1 focus:bg-blue-100 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-slate-200">{hps.ww.some(v => v !== '') ? hps.ww.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                        <td className="border border-black bg-slate-200">100.00</td>
                                        <td className="border border-black bg-slate-200">{Math.round(currentWeights.written_works * 100)}%</td>
                                        {hps.pt.map((val, i) => (
                                            <td key={`hps-pt-${i}`} className="border border-black p-0">
                                                <input
                                                    type="number"
                                                    value={val === '' ? '' : val}
                                                    onChange={(e) => updateHPS('pt', i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, 5 + i)}
                                                    data-row={0}
                                                    data-col={5 + i}
                                                    className="w-full h-full text-center bg-transparent outline-none p-1 focus:bg-blue-100 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-slate-200">{hps.pt.some(v => v !== '') ? hps.pt.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                        <td className="border border-black bg-slate-200">100.00</td>
                                        <td className="border border-black bg-slate-200">{Math.round(currentWeights.performance_tasks * 100)}%</td>
                                        {hps.qa.map((val, i) => (
                                            <td key={`hps-qa-${i}`} className="border border-black p-0">
                                                <input
                                                    type="number"
                                                    value={val === '' ? '' : val}
                                                    onChange={(e) => updateHPS('qa', i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, 8 + i)}
                                                    data-row={0}
                                                    data-col={8 + i}
                                                    className="w-full h-full text-center bg-transparent outline-none p-1 focus:bg-blue-100 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-slate-200">{hps.qa.some(v => v !== '') ? hps.qa.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                        <td className="border border-black bg-slate-200">100.00</td>
                                        <td className="border border-black bg-slate-200">{Math.round(currentWeights.quarterly_exam * 100)}%</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-gray-100 font-bold text-left h-6">
                                        <td colSpan={24} className="border border-black px-2 text-[9px] uppercase tracking-wider font-black">{section.gender}</td>
                                    </tr>
                                    {section.students.map((student, idx) => {
                                        const summary = getStudentSummary(student);
                                        const descriptor = getGradeDescriptor(summary.quarterlyGrade, summary.hasScores);
                                        return (
                                            <tr key={student.lrn} className="hover:bg-gray-50 h-6.5 text-[9px]">
                                                <td className="border border-black p-1 text-left text-[10px] leading-none whitespace-nowrap font-bold uppercase truncate" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>
                                                    {idx + 1}. {formatStudentFullName(student)}
                                                </td>
                                                {summary.ww.map((score, i) => (
                                                    <td key={`ww-${i}`} className="border border-black p-0">
                                                        <input
                                                            type="number"
                                                            value={score === '' ? '' : score}
                                                            onChange={(e) => updateGrade(student.lrn, 'ww', i, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, (sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx, i)}
                                                            data-row={(sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx}
                                                            data-col={i}
                                                            className="w-full h-full text-center outline-none p-0 focus:bg-blue-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="border border-black bg-blue-50/30">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwTotalScore : ''}</td>
                                                <td className="border border-black bg-blue-50/30">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwPS.toFixed(2) : ''}</td>
                                                <td className="border border-black bg-blue-100/50 font-semibold">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwWS.toFixed(2) : ''}</td>
                                                {summary.pt.map((score, i) => (
                                                    <td key={`pt-${i}`} className="border border-black p-0">
                                                        <input
                                                            type="number"
                                                            value={score === '' ? '' : score}
                                                            onChange={(e) => updateGrade(student.lrn, 'pt', i, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, (sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx, 5 + i)}
                                                            data-row={(sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx}
                                                            data-col={5 + i}
                                                            className="w-full h-full text-center outline-none p-0 focus:bg-green-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="border border-black bg-green-50/30">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptTotalScore : ''}</td>
                                                <td className="border border-black bg-green-50/30">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptPS.toFixed(2) : ''}</td>
                                                <td className="border border-black bg-green-100/50 font-semibold">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptWS.toFixed(2) : ''}</td>
                                                {summary.qa.map((score, i) => (
                                                    <td key={`qa-${i}`} className="border border-black p-0">
                                                        <input
                                                            type="number"
                                                            value={score === '' ? '' : score}
                                                            onChange={(e) => updateGrade(student.lrn, 'qa', i, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, (sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx, 8 + i)}
                                                            data-row={(sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx}
                                                            data-col={8 + i}
                                                            className="w-full h-full text-center outline-none p-0 focus:bg-yellow-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="border border-black bg-yellow-50/30">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaScore : ''}</td>
                                                <td className="border border-black bg-yellow-50/30">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaPS.toFixed(2) : ''}</td>
                                                <td className="border border-black bg-yellow-100/50 font-semibold">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaWS.toFixed(2) : ''}</td>
                                                <td className="border border-black bg-slate-100 font-bold">{summary.initialGrade.toFixed(2)}</td>
                                                <td className={`border border-black w-20 min-w-20 max-w-20 font-bold text-[9.5px] leading-tight whitespace-normal wrap-break-word ${summary.quarterlyGrade > 0 ? (summary.quarterlyGrade < 75 ? 'bg-red-500 text-white' : 'bg-deped-blue text-white') : 'bg-gray-50'}`}>
                                                    {summary.quarterlyGrade > 0 ? formatGradeForDisplay(summary.quarterlyGrade, sectionGradeLevel) : ''}
                                                </td>
                                                <td className="border border-black bg-blue-50 font-bold text-[9px] text-deped-blue leading-tight whitespace-normal wrap-break-word px-1">
                                                    {descriptor}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {section.gender === 'FEMALE' && (
                                        <>
                                            <tr className="bg-gray-200 mt-4 border-t-4 border-black cursor-pointer hover:bg-gray-300 transition-colors no-print" onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}>
                                                <td colSpan={24} className="border border-black p-2 font-bold bg-yellow-100 uppercase text-center">
                                                    <div className="flex items-center justify-between">
                                                        <span>TERM SUMMARY OF LEARNERS' GRADES & ANALYTICS</span>
                                                        <span className="text-xl">{isAnalyticsOpen ? '▼' : '▶'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isAnalyticsOpen && (
                                                <tr className="bg-white no-print">
                                                    <td colSpan={24} className="p-0 border border-black border-t-0">
                                                        <div className="flex flex-col gap-4 p-4 text-black text-left">
                                                            <div className="flex flex-col lg:flex-row gap-6">
                                                                <div className="flex-1 flex flex-col gap-4">
                                                                    <div className="border border-black overflow-hidden rounded">
                                                                        <div className="bg-gray-100 p-2 font-bold text-xs border-b border-black text-center uppercase">Learning Progress and Achievement</div>
                                                                        <table className="w-full text-center text-[10px]">
                                                                            <thead>
                                                                                <tr className="bg-gray-50 border-b border-black text-[9px]">
                                                                                    <th className="p-1 border-r border-black w-32 uppercase">Descriptors & Grading Scale</th>
                                                                                    <th className="p-1 border-r border-black w-24 uppercase">REMARKS</th>
                                                                                    <th className="p-1 border-r border-black uppercase">MALE</th>
                                                                                    <th className="p-1 border-r border-black uppercase">FEMALE</th>
                                                                                    <th className="p-1 uppercase">TOTAL</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {[
                                                                                    { desc: 'Advancing (90-100)', remark: 'Passed', min: 90, max: 100, dataKey: 'advancing' },
                                                                                    { desc: 'Benchmarking (80-89)', remark: 'Passed', min: 80, max: 89, dataKey: 'benchmarking' },
                                                                                    { desc: 'Connecting (75-79)', remark: 'Passed', min: 75, max: 79, dataKey: 'connecting' },
                                                                                    { desc: 'Developing (65-74)', remark: 'Failed', min: 65, max: 74, dataKey: 'developing' },
                                                                                    { desc: 'Emerging (0-64)', remark: 'Failed', min: 0, max: 64, dataKey: 'emerging' }
                                                                                ].map((level, idx) => {
                                                                                    const m = proficiencyData[level.dataKey]?.male || 0;
                                                                                    const f = proficiencyData[level.dataKey]?.female || 0;
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
                                                                                    { name: 'Advancing', count: proficiencyData.advancing?.total || 0 },
                                                                                    { name: 'Benchmarking', count: proficiencyData.benchmarking?.total || 0 },
                                                                                    { name: 'Connecting', count: proficiencyData.connecting?.total || 0 },
                                                                                    { name: 'Developing', count: proficiencyData.developing?.total || 0 },
                                                                                    { name: 'Emerging', count: proficiencyData.emerging?.total || 0 },
                                                                                ]}>
                                                                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                                                                    <YAxis tick={{ fontSize: 10 }} />
                                                                                    <Tooltip />
                                                                                    <Bar dataKey="count" fill="#8884d8">
                                                                                        {[
                                                                                            { name: 'Advancing', color: '#10B981' },
                                                                                            { name: 'Benchmarking', color: '#34D399' },
                                                                                            { name: 'Connecting', color: '#60A5FA' },
                                                                                            { name: 'Developing', color: '#FBBF24' },
                                                                                            { name: 'Emerging', color: '#EF4444' }
                                                                                        ].map((entry, index) => {
                                                                                            const colorMap: Record<string, string> = {
                                                                                                'Advancing': '#10B981',
                                                                                                'Benchmarking': '#34D399',
                                                                                                'Connecting': '#60A5FA',
                                                                                                'Developing': '#FBBF24',
                                                                                                'Emerging': '#EF4444'
                                                                                            };
                                                                                            return <Cell key={`cell-${index}`} fill={colorMap[entry.name] || '#999'} />;
                                                                                        })}
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
                                                            <div className="flex-1 flex flex-col gap-6">
                                                                <div className="border border-black overflow-hidden rounded bg-white shadow-sm">
                                                                    <div className="bg-slate-800 text-white p-2 font-black text-[11px] border-b border-black text-center uppercase tracking-widest">
                                                                        Test / Exam Result Analysis
                                                                    </div>
                                                                    <div className="p-4 space-y-4">
                                                                        {/* General Info */}
                                                                        <table className="w-full text-center border-collapse border border-black text-[10px]">
                                                                            <thead>
                                                                                <tr className="bg-slate-50 border-b border-black">
                                                                                    <th className="p-1 border-r border-black w-1/3 text-left pl-3">METRIC</th>
                                                                                    <th className="p-1 border-r border-black">ST1</th>
                                                                                    <th className="p-1 border-r border-black">ST2</th>
                                                                                    <th className="p-1">TE</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr className="border-b border-black">
                                                                                    <td className="p-1 border-r border-black text-left pl-3 font-medium">Number of Examinees:</td>
                                                                                    <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st1.count}</td>
                                                                                    <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st2.count}</td>
                                                                                    <td className="p-1 font-bold">{summativeAnalysis.te.count}</td>
                                                                                </tr>
                                                                                <tr className="bg-slate-50">
                                                                                    <td className="p-1 border-r border-black text-left pl-3 font-medium">Highest Possible Score:</td>
                                                                                    <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st1.hps}</td>
                                                                                    <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st2.hps}</td>
                                                                                    <td className="p-1 font-bold">{summativeAnalysis.te.hps}</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>

                                                                        {/* Criterion-Referenced */}
                                                                        <table className="w-full text-center border-collapse border border-black text-[10px]">
                                                                            <thead>
                                                                                <tr className="bg-blue-900 text-white border-b border-black">
                                                                                    <th className="p-1 border-r border-black w-1/3 text-left pl-3 font-black">CRITERION-REFERENCED</th>
                                                                                    <th className="p-1 border-r border-black">ST1</th>
                                                                                    <th className="p-1 border-r border-black">ST2</th>
                                                                                    <th className="p-1">TE</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr className="border-b border-black">
                                                                                    <td className="p-1 border-r border-black text-left pl-3">Got 75% & above</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st1.criterion.above75}</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st2.criterion.above75}</td>
                                                                                    <td className="p-1">{summativeAnalysis.te.criterion.above75}</td>
                                                                                </tr>
                                                                                <tr className="border-b border-black bg-slate-50">
                                                                                    <td className="p-1 border-r border-black text-left pl-3 font-medium">Percentage</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st1.criterion.above75Pct.toFixed(2)}%</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st2.criterion.above75Pct.toFixed(2)}%</td>
                                                                                    <td className="p-1">{summativeAnalysis.te.criterion.above75Pct.toFixed(2)}%</td>
                                                                                </tr>
                                                                                <tr className="border-b border-black">
                                                                                    <td className="p-1 border-r border-black text-left pl-3">Got below 75%</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st1.criterion.below75}</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st2.criterion.below75}</td>
                                                                                    <td className="p-1">{summativeAnalysis.te.criterion.below75}</td>
                                                                                </tr>
                                                                                <tr className="bg-slate-50">
                                                                                    <td className="p-1 border-r border-black text-left pl-3 font-medium">Percentage</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st1.criterion.below75Pct.toFixed(2)}%</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st2.criterion.below75Pct.toFixed(2)}%</td>
                                                                                    <td className="p-1">{summativeAnalysis.te.criterion.below75Pct.toFixed(2)}%</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>

                                                                        {/* Norm-Referenced */}
                                                                        <table className="w-full text-center border-collapse border border-black text-[10px]">
                                                                            <thead>
                                                                                <tr className="bg-emerald-800 text-white border-b border-black">
                                                                                    <th className="p-1 border-r border-black w-1/3 text-left pl-3 font-black">NORM-REFERENCED</th>
                                                                                    <th className="p-1 border-r border-black">ST1</th>
                                                                                    <th className="p-1 border-r border-black">ST2</th>
                                                                                    <th className="p-1">TE</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {['Mean', 'Median', 'SD', 'MPS/PL'].map((metric, i) => (
                                                                                    <tr key={metric} className={`border-b border-black ${i % 2 === 1 ? 'bg-slate-50' : ''}`}>
                                                                                        <td className="p-1 border-r border-black text-left pl-3">{metric}</td>
                                                                                        <td className="p-1 border-r border-black">
                                                                                            {metric === 'Mean' ? summativeAnalysis.st1.norm.mean.toFixed(2) :
                                                                                             metric === 'Median' ? summativeAnalysis.st1.norm.median.toFixed(2) :
                                                                                             metric === 'SD' ? summativeAnalysis.st1.norm.sd.toFixed(2) :
                                                                                             summativeAnalysis.st1.norm.mps.toFixed(2) + '%'}
                                                                                        </td>
                                                                                        <td className="p-1 border-r border-black">
                                                                                            {metric === 'Mean' ? summativeAnalysis.st2.norm.mean.toFixed(2) :
                                                                                             metric === 'Median' ? summativeAnalysis.st2.norm.median.toFixed(2) :
                                                                                             metric === 'SD' ? summativeAnalysis.st2.norm.sd.toFixed(2) :
                                                                                             summativeAnalysis.st2.norm.mps.toFixed(2) + '%'}
                                                                                        </td>
                                                                                        <td className="p-1">
                                                                                            {metric === 'Mean' ? summativeAnalysis.te.norm.mean.toFixed(2) :
                                                                                             metric === 'Median' ? summativeAnalysis.te.norm.median.toFixed(2) :
                                                                                             metric === 'SD' ? summativeAnalysis.te.norm.sd.toFixed(2) :
                                                                                             summativeAnalysis.te.norm.mps.toFixed(2) + '%'}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>

                                                                        {/* Other Info */}
                                                                        <table className="w-full text-center border-collapse border border-black text-[10px]">
                                                                            <thead>
                                                                                <tr className="bg-slate-700 text-white border-b border-black">
                                                                                    <th className="p-1 border-r border-black w-1/3 text-left pl-3 font-black">OTHER INFO</th>
                                                                                    <th className="p-1 border-r border-black">ST1</th>
                                                                                    <th className="p-1 border-r border-black">ST2</th>
                                                                                    <th className="p-1">TE</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr className="border-b border-black">
                                                                                    <td className="p-1 border-r border-black text-left pl-3">Highest Score</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st1.other.high}</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st2.other.high}</td>
                                                                                    <td className="p-1">{summativeAnalysis.te.other.high}</td>
                                                                                </tr>
                                                                                <tr className="border-b border-black bg-slate-50">
                                                                                    <td className="p-1 border-r border-black text-left pl-3">Lowest Score</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st1.other.low}</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st2.other.low}</td>
                                                                                    <td className="p-1">{summativeAnalysis.te.other.low}</td>
                                                                                </tr>
                                                                                <tr className="font-bold">
                                                                                    <td className="p-1 border-r border-black text-left pl-3">Total Score</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st1.other.total}</td>
                                                                                    <td className="p-1 border-r border-black">{summativeAnalysis.st2.other.total}</td>
                                                                                    <td className="p-1">{summativeAnalysis.te.other.total}</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
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
                    )}
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
