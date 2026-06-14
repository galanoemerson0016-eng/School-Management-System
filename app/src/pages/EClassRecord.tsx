/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Printer, CloudUpload, Plus, Minus, Download, FileText } from 'lucide-react';
import type { ClassRecord, HPSRecord, Subject } from '../types';
import { getTermUpperLabel } from '../lib/terms';

import { getSubjectCluster, getWeights, transmuteGrade, getGradeDescriptorWithFilipino, formatGradeForDisplay, computeExamsWeightedScore } from '../lib/grading';
import { filterSectionsForUser, filterSubjectsForSection } from '../lib/rbac';

const WW_COUNT = 5;
const PT_COUNT = 3;
const ST_COUNT = 3;

type PaperSize = 'folio' | 'a4' | 'letter';

const PAPER_SIZES: Record<PaperSize, { label: string; landscape: string; portrait: string; margins: string; summaryMargins: string; jspdfFormat: string | [number, number]; previewWidthLandscape: string; previewWidthPortrait: string }> = {
    folio: {
        label: 'Folio',
        landscape: '13in 8.5in',
        portrait: '8.5in 13in',
        margins: '0.12in 0.18in',
        summaryMargins: '0.5in 0.25in',
        jspdfFormat: 'legal',
        previewWidthLandscape: '1248px',
        previewWidthPortrait: '816px',
    },
    a4: {
        label: 'A4',
        landscape: '297mm 210mm',
        portrait: '210mm 297mm',
        margins: '0.1in 0.15in',
        summaryMargins: '0.4in 0.2in',
        jspdfFormat: 'a4',
        previewWidthLandscape: '1122px',
        previewWidthPortrait: '794px',
    },
    letter: {
        label: 'Letter',
        landscape: '11in 8.5in',
        portrait: '8.5in 11in',
        margins: '0.1in 0.15in',
        summaryMargins: '0.4in 0.2in',
        jspdfFormat: 'letter',
        previewWidthLandscape: '1056px',
        previewWidthPortrait: '816px',
    },
};

const normalizeScores = (scores: (number | string)[] | undefined, count: number): (number | string)[] => {
    const src = Array.isArray(scores) ? scores : [];
    return Array.from({ length: count }, (_, i) => src[i] ?? '');
};

const getDynamicFontSizeClass = (text: string, baseClass: string = "text-[10px]") => {
    if (!text) return baseClass;
    if (text.length > 30) return "text-[8px] leading-none";
    if (text.length > 20) return "text-[9px] leading-tight";
    return baseClass;
};

const getSubjectCategory = (subjectName: string, gradeLevel: string): string => {
    const isSHS = gradeLevel.includes('11') || gradeLevel.includes('12');
    if (!isSHS) {
        return 'Core Subject (All Tracks)';
    }

    const normalized = subjectName.trim().toLowerCase();
    const isG12 = gradeLevel.includes('12');

    if (isG12) {
        const norm = normalized.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        
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
            return norm === cNorm || norm.includes(cNorm) || cNorm.includes(norm);
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
            return norm === aNorm || norm.includes(aNorm) || aNorm.includes(norm);
        })) {
            return 'Applied';
        }

        // 3. Specialized Subjects
        return 'Specialized';
    }

    const norm = normalized;

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

export function EClassRecord() {
    

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
    const [selectedMapehComponentId, setSelectedMapehComponentId] = useState('');
    const [quarter, setQuarter] = useState<1 | 2 | 3 | 'summary' | 'summary_t1' | 'summary_t2' | 'summary_t3' | 'summary_final'>(1);
    const [zoom, setZoom] = useState(0.9);
    const [isDownloading, setIsDownloading] = useState(false);
    const [paperSize, setPaperSize] = useState<PaperSize>('folio');


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
    // Sort Sections: Grade Level (Asc) -> Name (Asc)
    // Filter: If Teacher, only show sections where they are Adviser OR have a Subject assigned
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
        setSelectedSubject(''); // Reset subject when section changes
        setGlobalSubject('');
    };

    const onSubjectChange = (val: string) => {
        setSelectedSubject(val);
        setGlobalSubject(val);
    };

    // Find MAPEH components for the current section
    const mapehComponents = useMemo(() => {
        if (!selectedSectionObj) return [];
        
        // Use the same filtering logic as the main dropdown to find components
        // This ensures generic subjects assigned to the section are also caught
        const sectionSubjects = filterSubjectsForSection(user, selectedSectionObj, subjects).filter(s => s.term !== 'none');
        
        return sectionSubjects.filter(s => {
            const n = s.subject_name.toLowerCase();
            return (n.includes('music') && n.includes('arts')) || 
                   ((n.includes('pe') || n.includes('physical')) && n.includes('health'));
        }).sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    }, [subjects, selectedSectionObj, user]);

    // Filter & Sort Subjects: Hide components, ensure MAPEH is present
    const filteredSubjects = useMemo(() => {
        if (!selectedSectionObj) return [];

        let base = [...filterSubjectsForSection(user, selectedSectionObj, subjects)].filter(s => s.term !== 'none');
        
        // Remove individual components from main dropdown
        base = base.filter(s => {
            const n = s.subject_name.toLowerCase();
            const isComponent = (n.includes('music') && n.includes('arts')) || 
                                ((n.includes('pe') || n.includes('physical')) && n.includes('health'));
            return !isComponent;
        });

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

        const hasMapeh = base.some(s => s.subject_name.toUpperCase() === 'MAPEH');
        if (!hasMapeh && mapehComponents.length > 0) {
            base.push({
                id: 'virtual_mapeh',
                subject_name: 'MAPEH',
                grade_level: selectedSectionObj.section_grade_level,
                section_id: selectedSectionObj.id,
                teacher_id: user?.uid
            } as Subject);
        }

        return base.sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    }, [subjects, selectedSectionObj, user, mapehComponents, quarter]);

    // Group subjects by category if it's SHS
    const groupedSubjects = useMemo(() => {
        const isSHS = sectionGradeLevel.includes('11') || sectionGradeLevel.includes('12');
        if (!isSHS) return null;

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
        if (selectedSubject && selectedSubject !== 'virtual_mapeh' && filteredSubjects.length > 0) {
            const exists = filteredSubjects.some(s => s.id === selectedSubject);
            if (!exists) {
                setSelectedSubject('');
                setGlobalSubject('');
            }
        }
    }, [quarter, filteredSubjects, selectedSubject, setGlobalSubject]);

    // Determine the actual subject ID to use for grading/fetching
    const effectiveSubjectId = useMemo(() => {
        const isMapeh = selectedSubject === 'virtual_mapeh' || 
                       subjects.find(s => s.id === selectedSubject)?.subject_name.toUpperCase() === 'MAPEH';
        
        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        if (isMapeh && !isSummaryMode) {
            return selectedMapehComponentId || mapehComponents[0]?.id || '';
        }
        return selectedSubject;
    }, [selectedSubject, selectedMapehComponentId, quarter, subjects, mapehComponents]);

    const subjectName = useMemo(() => {
        return subjects.find(s => s.id === effectiveSubjectId)?.subject_name || (selectedSubject === 'virtual_mapeh' ? 'MAPEH' : '');
    }, [subjects, effectiveSubjectId, selectedSubject]);

    useEffect(() => {
        const isMapeh = selectedSubject === 'virtual_mapeh' || 
                       subjects.find(s => s.id === selectedSubject)?.subject_name.toUpperCase() === 'MAPEH';
        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        if (isMapeh && mapehComponents.length > 0 && !selectedMapehComponentId && !isSummaryMode) {
            setSelectedMapehComponentId(mapehComponents[0].id);
        } else if (!isMapeh || isSummaryMode) {
            setSelectedMapehComponentId('');
        }
    }, [selectedSubject, mapehComponents, selectedMapehComponentId, subjects, quarter]);

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


    // Get current subject and its weight cluster


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
        return getWeights(currentCluster, selectedSubjectObj);
    }, [currentCluster, selectedSubjectObj]);

    // Fetch Teacher Name
    const [teacherName, setTeacherName] = useState('');

    useEffect(() => {
        const fetchTeacher = async () => {
            // Source of truth priority:
            // 1. Hardcoded Emerson check (User's special request)
            if (user?.email?.includes('galanoemerson') || user?.displayName?.toLowerCase().includes('emerson')) {
                setTeacherName("EMERSON M. GALANO");
                return;
            }

            // 2. Subject-assigned teacher (Check both main subject and effective component)
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

            // 3. Fallback to Section Adviser or School Profile Adviser
            const fallbackName = selectedSectionObj?.adviser_name || schoolProfile?.adviser_name || user?.displayName || "";
            setTeacherName(fallbackName.toUpperCase());
        };

        fetchTeacher();
    }, [selectedSubjectObj, effectiveSubjectId, selectedSectionObj, user, teachers, schoolProfile, subjects]);

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

    // Set fixed learners' names column width for consistency across all sections
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
        
        // Only use legacy quarterly_exam if it's not empty AND not 0 (to avoid default 0 issues)
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
        
        const st1Score = typeof qaScores[0] === 'number' ? qaScores[0] : 0;
        const st1HPS = Number(hps.qa[0]) || 0;
        const st2Score = typeof qaScores[1] === 'number' ? qaScores[1] : 0;
        const st2HPS = Number(hps.qa[1]) || 0;
        const teScore = typeof qaScores[2] === 'number' ? qaScores[2] : 0;
        const teHPS = Number(hps.qa[2]) || 0;

        const qaPS = computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
        const qaWS = qaPS * (currentWeights.quarterly_exam || 0);

        const initialGrade = (wwWS || 0) + (ptWS || 0) + (qaWS || 0);

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            wwScores.some(isValidScore) ||
            ptScores.some(isValidScore) ||
            qaScores.some(isValidScore);

        const quarterlyGrade = hasScores ? transmuteGrade(initialGrade, activeSchoolYear) : 0;

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
    }, [classRecords, effectiveSubjectId, quarter, hps, currentWeights, currentCluster, activeSchoolYear]);

    const getGradeDescriptor = useCallback((grade: number, hasScores: boolean) => {
        if (!hasScores || grade <= 0) return '';
        return getGradeDescriptorWithFilipino(grade, sectionGradeLevel, activeSchoolYear);
    }, [sectionGradeLevel, activeSchoolYear]);

    const getSummaryGrades = useCallback((student: typeof students[0]) => {
        const isMapeh = subjectName.toUpperCase() === 'MAPEH';
        
        const targetSubjectObj = subjects.find(s => s.id === selectedSubject);
        const isTermOffered = (subj: typeof targetSubjectObj | undefined, q: number) => {
            if (!subj) return true;
            const termVal = subj.term;
            if (termVal === undefined || termVal === null || termVal === 'all') return true;
            if (termVal === 'none') return false;
            return Number(termVal) === q;
        };

        if (isMapeh) {
            // Find component subjects for this section using the already calculated mapehComponents
            const maSubj = mapehComponents.find(s => {
                const n = s.subject_name.toLowerCase();
                return (n.includes('music') && n.includes('arts'));
            });
            const peSubj = mapehComponents.find(s => {
                const n = s.subject_name.toLowerCase();
                return ((n.includes('pe') || n.includes('physical')) && n.includes('health'));
            });

            const getGrade = (subjId?: string, q: number = 1) => {
                if (!subjId) return '';
                const subj = subjects.find(s => s.id === subjId);
                if (!isTermOffered(subj, q)) return '';

                const record = classRecords.find(r =>
                    r.student_lrn === student.lrn &&
                    r.subject_id === subjId &&
                    (r.quarter === q || Number(r.quarter) === q) &&
                    r.school_year === activeSchoolYear
                );

                // Only return if final_grade is a valid number > 0
                if (record && record.final_grade) {
                    const g = Number(record.final_grade);
                    return isNaN(g) ? '' : g;
                }
                return '';
            };

            // Handling specific summary modes
            if (quarter === 'summary_t1' || quarter === 'summary_t2' || quarter === 'summary_t3' || quarter === 'summary') {
                const targetTerm = quarter === 'summary_t2' ? 2 : quarter === 'summary_t3' ? 3 : 1;
                const ma = getGrade(maSubj?.id, targetTerm);
                const pe = getGrade(peSubj?.id, targetTerm);
                const maNum = typeof ma === 'number' ? ma : 0;
                const peNum = typeof pe === 'number' ? pe : 0;
                const final = (maNum > 0 && peNum > 0) ? Math.round((maNum + peNum) / 2) : (ma || pe || '');
                const descriptor = final !== '' ? getGradeDescriptor(Number(final), true) : '';
                return { ma, pe, final, descriptor, isMapeh: true, mapehMode: 'component' };
            }

            if (quarter === 'summary_final') {
                let total = 0;
                let count = 0;
                const termAverages = [1, 2, 3].map(q => {
                    const maOffered = maSubj ? isTermOffered(maSubj, q) : false;
                    const peOffered = peSubj ? isTermOffered(peSubj, q) : false;
                    if (!maOffered && !peOffered) return '';
                    
                    const ma = getGrade(maSubj?.id, q);
                    const pe = getGrade(peSubj?.id, q);
                    const maNum = typeof ma === 'number' ? ma : 0;
                    const peNum = typeof pe === 'number' ? pe : 0;
                    const avg = (maNum > 0 && peNum > 0) ? Math.round((maNum + peNum) / 2) : (maNum || peNum || 0);
                    if (avg > 0) {
                        total += Number(avg);
                        count++;
                    }
                    return avg > 0 ? avg : '';
                });
                const final = count > 0 ? Math.round(total / count) : '';
                const descriptor = final !== '' ? getGradeDescriptor(Number(final), true) : '';
                return { t1: termAverages[0], t2: termAverages[1], t3: termAverages[2], final, descriptor, isMapeh: true, mapehMode: 'final' };
            }
        }

        let total = 0;
        let count = 0;
        const terms = [1, 2, 3].map(q => {
            if (!isTermOffered(targetSubjectObj, q)) {
                return '';
            }
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
        const descriptor = final !== '' ? getGradeDescriptor(final, true) : '';
        
        return {
            t1: terms[0],
            t2: terms[1],
            t3: terms[2],
            final,
            descriptor,
            isMapeh: false
        };
    }, [classRecords, subjectName, selectedSubject, activeSchoolYear, quarter, mapehComponents, getGradeDescriptor, subjects]);

    const proficiencyDataCalc = useMemo(() => {
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

        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        if (isSummaryMode) return;

        // Find existing record or create new one
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

        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        if (isSummaryMode) return;

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

        // Validation: Do not allow score higher than HPS
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

        const st1Score = Number(qaScores[0]) || 0;
        const st1HPS = Number(hps.qa[0]) || 0;
        const st2Score = Number(qaScores[1]) || 0;
        const st2HPS = Number(hps.qa[1]) || 0;
        const teScore = Number(qaScores[2]) || 0;
        const teHPS = Number(hps.qa[2]) || 0;

        const qaPS = computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, currentCluster);
        const qaWS = qaPS * currentWeights.quarterly_exam;

        const initialGrade = wwWS + ptWS + qaWS;

        const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined;
        const hasScores =
            normalizedWW.some(isValidScore) ||
            normalizedPT.some(isValidScore) ||
            qaScores.some(isValidScore);

        if (!hasScores) {
            deleteClassRecord(record.id);
            
            // Clear Sync from Grading Sheet
            const { deleteGradingSheetRecord } = useAppStore.getState();
            deleteGradingSheetRecord(`${record.student_lrn}_${record.subject_id}_${record.quarter}_${record.school_year}`);
        } else {
            record.final_grade = transmuteGrade(initialGrade, record.school_year);
            updateClassRecord(record);
            
            // Live Sync to Grading Sheet (Official Records)
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
        document.title = `Class_Record_${sectionName}_${subjectName}_T${quarter}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };

    const handleDownload = async () => {
        const isSummaryMode = typeof quarter === 'string' && quarter.startsWith('summary');
        const elementId = isSummaryMode ? 'printable-summary-record' : 'printable-class-record';
        const el = document.getElementById(elementId);
        if (!el) {
            showNotification('Nothing to download. Please select a section and subject first.', 'error');
            return;
        }

        setIsDownloading(true);
        try {
            const html2canvas = (await import('html2canvas-pro')).default;
            const { jsPDF } = await import('jspdf');

            // Temporarily reset zoom for clean capture
            const zoomShell = el.closest('.eclass-zoom-shell') as HTMLElement | null;
            const prevTransform = zoomShell?.style.transform || '';
            if (zoomShell) zoomShell.style.transform = 'none';

            // Find all page containers inside the printable element (for summary, it's just the element itself)
            const pages = isSummaryMode 
                ? [el] 
                : Array.from(el.querySelectorAll('.class-record-page')) as HTMLElement[];

            if (pages.length === 0) {
                pages.push(el);
            }

            const orientation = isSummaryMode ? 'portrait' : 'landscape';
            const pSize = PAPER_SIZES[paperSize];
            const pdf = new jsPDF({ orientation, unit: 'mm', format: pSize.jspdfFormat as any });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 4;
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) {
                    pdf.addPage(pSize.jspdfFormat as any, orientation);
                }

                const pageEl = pages[i];
                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                });

                const imgData = canvas.toDataURL('image/png');
                const imgW = canvas.width;
                const imgH = canvas.height;
                const ratio = Math.min(usableW / imgW, usableH / imgH);
                const drawW = imgW * ratio;
                const drawH = imgH * ratio;
                const offsetX = margin + (usableW - drawW) / 2;
                const offsetY = margin;

                pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);
            }

            // Restore zoom
            if (zoomShell) zoomShell.style.transform = prevTransform;

            const sectionName = selectedSectionObj ? `${selectedSectionObj.section_grade_level}-${selectedSectionObj.section_name}` : 'Record';
            const subjName = selectedSubjectObj?.subject_name || '';
            const termLabel = isSummaryMode ? 'Summary' : `T${quarter}`;
            pdf.save(`Class_Record_${sectionName}_${subjName}_${termLabel}.pdf`);

            showNotification('Class record downloaded successfully!', 'success');
        } catch (err) {
            console.error('Download failed:', err);
            showNotification('Failed to download class record. Please try again.', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const proficiencyData = proficiencyDataCalc;
    
    return (
        <div className="h-full min-h-0 flex flex-col gap-3">
            <style>{`
                @media print {
                    @page {
                        size: ${quarter === 'summary' ? PAPER_SIZES[paperSize].portrait : PAPER_SIZES[paperSize].landscape};
                        margin: ${quarter === 'summary' ? PAPER_SIZES[paperSize].summaryMargins : PAPER_SIZES[paperSize].margins};
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

            <div className="bg-white rounded-lg shadow-md p-2.5 no-print">
                <div className="flex flex-col lg:flex-row lg:flex-nowrap lg:items-end gap-2 lg:gap-2">
                    <div className="w-full lg:w-[160px] shrink-0">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[11px] font-semibold text-deped-blue whitespace-nowrap">Section</label>
                        </div>
                        <select
                            value={selectedSection}
                            onChange={(e) => onSectionChange(e.target.value)}
                            className="form-input h-8 py-1 px-2 text-[11px] rounded-xl"
                        >
                            <option value="">Select Section</option>
                            {sortedSections.map((s) => (
                                <option key={s.id} value={s.section_name}>{s.section_grade_level} - {s.section_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full lg:flex-1 lg:min-w-[140px]">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[11px] font-semibold text-deped-blue whitespace-nowrap">
                                Subject {sectionGradeLevel && `(${sectionGradeLevel})`}
                            </label>
                        </div>
                        <select
                            value={selectedSubject}
                            onChange={(e) => onSubjectChange(e.target.value)}
                            className="form-input h-8 py-1 px-2 text-[11px] rounded-xl"
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

                    {/* Sub-Subject Dropdown for MAPEH components */}
                    {(selectedSubject === 'virtual_mapeh' || subjectName.toUpperCase() === 'MAPEH') && (typeof quarter !== 'string' || !quarter.startsWith('summary')) && mapehComponents.length > 0 && (
                        <div className="w-full lg:w-[140px] shrink-0">
                            <label className="block text-[11px] font-semibold mb-1 text-deped-blue whitespace-nowrap">MAPEH Component</label>
                            <select
                                value={selectedMapehComponentId}
                                onChange={(e) => setSelectedMapehComponentId(e.target.value)}
                                className="form-input border-amber-400 bg-amber-50 h-8 py-1 px-2 text-[11px] rounded-xl"
                            >
                                {mapehComponents.map((c) => (
                                    <option key={c.id} value={c.id}>{c.subject_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="w-full lg:w-[100px] shrink-0">
                        <label className="block text-[11px] font-semibold mb-1 text-deped-blue whitespace-nowrap">Term</label>
                        <select value={quarter} onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('summary')) {
                                setQuarter(val as any);
                            } else {
                                setQuarter(Number(val) as any);
                            }
                        }} className="form-input h-8 py-1 px-2 text-[11px] rounded-xl">
                            <option value={1}>Term 1</option>
                            <option value={2}>Term 2</option>
                            <option value={3}>Term 3</option>
                            {(selectedSubject === 'virtual_mapeh' || subjectName.toUpperCase() === 'MAPEH') ? (
                                <>
                                    <option value="summary_t1">Term 1 Summary</option>
                                    <option value="summary_t2">Term 2 Summary</option>
                                    <option value="summary_t3">Term 3 Summary</option>
                                    <option value="summary_final">Final Summary</option>
                                </>
                            ) : (
                                <option value="summary">Final Summary</option>
                            )}
                        </select>
                    </div>
                    <div className="w-full lg:w-[100px] shrink-0">
                        <label className="text-[11px] font-semibold mb-1 text-deped-blue flex items-center gap-1 whitespace-nowrap">
                            <FileText className="w-3.5 h-3.5" /> Paper Size
                        </label>
                        <select
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                            className="form-input h-8 py-1 px-2 text-[11px] rounded-xl"
                        >
                            {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 h-8 px-1 rounded-xl bg-slate-100 border border-slate-200">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                                title="Zoom Out"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] font-black text-slate-900 w-8 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                                title="Zoom In"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                        <button onClick={handlePrint} className="btn-primary flex items-center justify-center gap-1.5 h-8 px-3 text-[10px] rounded-xl whitespace-nowrap">
                            <Printer className="w-3.5 h-3.5" /> Print Record
                        </button>
                        <button 
                            onClick={handleDownload}
                            disabled={isDownloading || !selectedSubject || sectionStudents.length === 0}
                            className="h-8 px-3 bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-700 hover:scale-[1.02] transition-all flex items-center gap-1.5 group disabled:opacity-30 disabled:grayscale whitespace-nowrap"
                        >
                            {isDownloading ? (
                                <>
                                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Downloading…
                                </>
                            ) : (
                                <><Download className="w-3.5 h-3.5" /> Download</>  
                            )}
                        </button>
                        <button 
                            onClick={async () => {
                                if (!selectedSubjectObj || !sectionStudents.length || quarter === 'summary') return;
                                
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
                            className="h-8 px-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all flex items-center gap-1.5 group disabled:opacity-30 disabled:grayscale whitespace-nowrap"
                        >
                            <CloudUpload className="w-3.5 h-3.5" /> Publish
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
                        <div id="printable-summary-record" className="bg-white px-8 py-10 mx-auto print:p-0 font-sans shadow-[0_0_50px_rgba(0,0,0,0.05)] print:shadow-none border border-gray-100 print:border-none transition-all duration-300 max-w-full" style={{ width: PAPER_SIZES[paperSize].previewWidthPortrait }}>
                            {/* Header Section matching image */}
                             <div className="flex justify-between items-start mb-6">
                                 <div className="w-14 h-14 shrink-0">
                                     <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                 </div>
                                 <div className="text-center flex-1 px-4">
                                     <h1 className="text-2xl font-bold uppercase tracking-wide text-black">
                                         {quarter === 'summary_final' ? 'SUMMARY OF GRADES' : 
                                          quarter === 'summary_t1' ? 'SUMMARY OF TERM 1 GRADES' : 
                                          quarter === 'summary_t2' ? 'SUMMARY OF TERM 2 GRADES' :
                                          quarter === 'summary_t3' ? 'SUMMARY OF TERM 3 GRADES' :
                                          'SUMMARY OF GRADES'}
                                     </h1>
                                     
                                     <div className="mt-4 grid gap-x-4 text-[10px] text-left" style={{ gridTemplateColumns: '55% 45%' }}>
                                         <div className="space-y-1">
                                             <div className="flex items-center min-h-[26px]">
                                                 <span className="w-20 font-bold uppercase shrink-0">REGION</span>
                                                 <div className={`border border-black px-2 py-0.5 flex-1 min-h-[20px] font-semibold text-center uppercase flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.region, "text-[10px]")}`}>{schoolProfile.region}</div>
                                             </div>
                                             <div className="flex items-center min-h-[26px]">
                                                 <span className="w-20 font-bold uppercase shrink-0">SCHOOL NAME</span>
                                                 <div className={`border border-black px-2 py-0.5 flex-1 min-h-[20px] font-semibold text-center uppercase flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.name, "text-[10px]")}`}>{schoolProfile.name}</div>
                                             </div>
                                         </div>
                                         <div className="space-y-1">
                                             <div className="flex items-center min-h-[26px]">
                                                 <span className="w-20 font-bold uppercase shrink-0">DIVISION</span>
                                                 <div className={`border border-black px-2 py-0.5 flex-1 min-h-[20px] font-semibold text-center uppercase flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.division, "text-[10px]")}`}>{schoolProfile.division}</div>
                                             </div>
                                             <div className="flex items-center min-h-[26px]">
                                                 <span className="w-20 font-bold uppercase shrink-0">SCHOOL ID</span>
                                                 <div className={`border border-black px-2 py-0.5 flex-1 min-h-[20px] font-semibold text-center uppercase flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.school_id, "text-[10px]")}`}>{schoolProfile.school_id}</div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="w-24 h-14 shrink-0">
                                     <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                 </div>
                             </div>

                            <table className="w-full border-collapse border border-black text-[11px] font-sans bg-white">
                                <thead className="print:table-header-group bg-white text-black font-bold uppercase">
                                    <tr>
                                        <th rowSpan={3} className="border border-black w-8"></th>
                                        <th rowSpan={3} className="border border-black p-2 align-middle w-[250px] text-center tracking-wider">LEARNERS' NAMES</th>
                                        <th colSpan={3} className="border border-black text-left p-1 text-[10px]">
                                            <div className="flex items-center overflow-hidden h-full">
                                                <span className="font-bold mr-2 whitespace-nowrap shrink-0">GRADE & SECTION:</span>
                                                <span className="flex-1 text-center font-normal uppercase truncate">{sectionGradeLevel} - {selectedSection}</span>
                                            </div>
                                        </th>
                                        <th colSpan={3} className="border border-black text-left p-1 text-[10px]">
                                            <div className="flex items-center overflow-hidden h-full">
                                                <span className="font-bold mr-2 whitespace-nowrap shrink-0">SCHOOL YEAR:</span>
                                                <span className="flex-1 text-center font-normal uppercase truncate">{activeSchoolYear}</span>
                                            </div>
                                        </th>
                                    </tr>
                                    <tr>
                                        <th colSpan={3} className="border border-black text-left p-1 text-[10px]">
                                            <div className="flex items-center overflow-hidden h-full">
                                                <span className="font-bold mr-2 whitespace-nowrap shrink-0">TEACHER:</span>
                                                <span className="flex-1 text-center font-normal uppercase truncate">{teacherName}</span>
                                            </div>
                                        </th>
                                        <th colSpan={3} className="border border-black text-left p-1 text-[10px]">
                                            <div className="flex items-center overflow-hidden h-full">
                                                <span className="font-bold mr-2 whitespace-nowrap shrink-0">SUBJECT:</span>
                                                <span className="flex-1 text-center font-normal uppercase truncate">{subjectName}</span>
                                            </div>
                                        </th>
                                    </tr>
                                    <tr className="text-center text-[10px] font-bold bg-white h-10">
                                        {subjectName.toUpperCase() === 'MAPEH' ? (
                                            quarter === 'summary_final' ? (
                                                <>
                                                    <th className="border border-black p-1 w-[100px]">TERM 1<br/>MAPEH</th>
                                                    <th className="border border-black p-1 w-[100px]">TERM 2<br/>MAPEH</th>
                                                    <th className="border border-black p-1 w-[100px]">TERM 3<br/>MAPEH</th>
                                                    <th className="border border-black p-1 w-[100px]">FINAL GRADE</th>
                                                    <th className="border border-black p-1 w-[100px]">DESCRIPTOR</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="border border-black p-1 w-[120px]">MUSIC & ARTS<br/>({quarter === 'summary_t2' ? 'TERM 2' : quarter === 'summary_t3' ? 'TERM 3' : 'TERM 1'})</th>
                                                    <th className="border border-black p-1 w-[120px]">PE & HEALTH<br/>({quarter === 'summary_t2' ? 'TERM 2' : quarter === 'summary_t3' ? 'TERM 3' : 'TERM 1'})</th>
                                                    <th className="border border-black p-1 w-[120px]">MAPEH<br/>({quarter === 'summary_t2' ? 'TERM 2' : quarter === 'summary_t3' ? 'TERM 3' : 'TERM 1'} GRADE)</th>
                                                    <th className="border border-black p-1 w-[120px]">DESCRIPTOR</th>
                                                </>
                                            )
                                        ) : (
                                            <>
                                                <th className="border border-black p-1 w-[70px]">TERM 1</th>
                                                <th className="border border-black p-1 w-[70px]">TERM 2</th>
                                                <th className="border border-black p-1 w-[70px]">TERM 3</th>
                                                <th className="border border-black p-1 w-[80px]">FINAL GRADE</th>
                                                <th className="border border-black p-1 w-[100px]">DESCRIPTOR</th>
                                                <th className="border border-black p-1 w-[80px]">REMARK</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-gray-200 font-bold">
                                        <td colSpan={8} className="border border-black text-left px-2 py-0.5 text-[10px] tracking-widest uppercase">MALE</td>
                                    </tr>
                                    {maleStudents.map((student, i) => {
                                        const summary = getSummaryGrades(student);
                                        return (
                                            <tr key={student.lrn} className="h-7 hover:bg-gray-50 transition-colors">
                                                <td className="border border-black text-center font-bold text-[10px]">{i + 1}</td>
                                                <td className="border border-black text-left px-2 uppercase text-[10px] font-bold truncate max-w-[250px]">
                                                    {formatStudentFullName(student)}
                                                </td>
                                                {summary.isMapeh ? (
                                                    (summary as any).mapehMode === 'final' ? (
                                                        <>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t1, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t2, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t3, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).ma, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).pe, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                        </>
                                                    )
                                                ) : (
                                                    <>
                                                        <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t1, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t2, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t3, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                        <td className={`border border-black text-center font-bold text-[9px] ${summary.final !== '' && Number(summary.final) >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                                                            {summary.final !== '' ? (Number(summary.final) >= 75 ? 'PASSED' : 'FAILED') : ''}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-gray-200 font-bold">
                                        <td colSpan={8} className="border border-black text-left px-2 py-0.5 text-[10px] tracking-widest uppercase">FEMALE</td>
                                    </tr>
                                    {femaleStudents.map((student, i) => {
                                        const summary = getSummaryGrades(student);
                                        return (
                                            <tr key={student.lrn} className="h-7 hover:bg-gray-50 transition-colors">
                                                <td className="border border-black text-center font-bold text-[10px]">{i + 1}</td>
                                                <td className="border border-black text-left px-2 uppercase text-[10px] font-bold truncate max-w-[250px]">
                                                    {formatStudentFullName(student)}
                                                </td>
                                                {summary.isMapeh ? (
                                                    (summary as any).mapehMode === 'final' ? (
                                                        <>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t1, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t2, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t3, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).ma, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).pe, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                            <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                        </>
                                                    )
                                                ) : (
                                                    <>
                                                        <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t1, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t2, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-semibold">{formatGradeForDisplay((summary as any).t3, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-bold bg-gray-50">{formatGradeForDisplay(summary.final, sectionGradeLevel)}</td>
                                                        <td className="border border-black text-center font-medium text-[9px]">{summary.descriptor || ''}</td>
                                                        <td className={`border border-black text-center font-bold text-[9px] ${summary.final !== '' && Number(summary.final) >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                                                            {summary.final !== '' ? (Number(summary.final) >= 75 ? 'PASSED' : 'FAILED') : ''}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                    <div className="bg-slate-50/50 p-3 md:p-4">
                        <div id="printable-class-record" className="bg-white p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.05)] border border-gray-100 mx-auto transition-all duration-300 max-w-full" style={{ width: PAPER_SIZES[paperSize].previewWidthLandscape }}>
                            {[
                                { gender: 'MALE' as const, students: maleStudents },
                                { gender: 'FEMALE' as const, students: femaleStudents }
                            ].map((section, sectionIdx) => (
                            <div key={section.gender} className={`class-record-page bg-white p-4 print:p-0 ${sectionIdx === 0 ? 'print:break-after-page' : 'print:mt-6'}`}>
                            <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2 px-4 print:px-1">
                                <div className="w-16 h-16 flex items-center justify-center shrink-0">
                                    <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="text-center flex-1 mx-4">
                                    <h1 className="text-2xl font-bold font-serif tracking-wide text-black mb-0 uppercase">Class Record</h1>
                                    <p className="text-[12px] italic text-red-600 font-serif mb-2">(Pursuant to DepEd Order 8 series of 2015)</p>
                                    <div className="grid gap-x-4 gap-y-3 text-[10px] font-bold uppercase mb-6 justify-center w-full px-2" style={{ gridTemplateColumns: '42% 33% 25%' }}>
                                        {/* Row 1, Col 1: Region */}
                                        <div className="flex items-center min-h-[26px]">
                                            <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">REGION</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-[100px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.region, "text-[10px]")}`}>
                                                {schoolProfile.region}
                                            </div>
                                        </div>
                                        {/* Row 1, Col 2: Division */}
                                        <div className="flex items-center min-h-[26px]">
                                            <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">DIVISION</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-[120px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.division, "text-[10px]")}`}>
                                                {schoolProfile.division}
                                            </div>
                                        </div>
                                        {/* Row 1, Col 3: District */}
                                        <div className="flex items-center min-h-[26px]">
                                            <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">DISTRICT</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-[120px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.district || '', "text-[10px]")}`}>
                                                {schoolProfile.district || ''}
                                            </div>
                                        </div>

                                        {/* Row 2, Col 1: School Name */}
                                        <div className="flex items-center min-h-[26px]">
                                            <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">SCHOOL NAME</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-[140px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.name, "text-[10px]")}`}>
                                                {schoolProfile.name}
                                            </div>
                                        </div>
                                        {/* Row 2, Col 2: School ID */}
                                        <div className="flex items-center min-h-[26px]">
                                            <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">SCHOOL ID</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-[80px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.school_id, "text-[10px]")}`}>
                                                {schoolProfile.school_id}
                                            </div>
                                        </div>
                                        {/* Row 2, Col 3: School Year */}
                                        <div className="flex items-center min-h-[26px]">
                                            <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">SCHOOL YEAR</span>
                                            <div className={`border border-black px-2 py-0.5 flex-1 min-w-[80px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(activeSchoolYear, "text-[10px]")}`}>
                                                {activeSchoolYear}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="w-28 h-16 flex items-center justify-center shrink-0">
                                    <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-auto object-contain" />
                                </div>
                            </div>

                            <div className="flex border-2 border-black mb-px text-[10px] leading-none">
                                <div className="h-9 px-3 border-r border-black font-bold bg-yellow-100 flex items-center justify-center text-center shrink-0">
                                    {(typeof quarter === 'string' && quarter.startsWith('summary')) ? 'SUMMARY OF GRADES' : getTermUpperLabel(quarter as any)}
                                </div>
                                <div className="h-9 px-3 border-r border-black flex items-center justify-center whitespace-nowrap grow">
                                    <span className="font-bold mr-1.5 shrink-0">GRADE & SECTION:</span>
                                    <span className="uppercase">{sectionGradeLevel} - {selectedSection}</span>
                                </div>
                                <div className="h-9 px-3 border-r border-black flex items-center justify-center whitespace-nowrap grow">
                                    <span className="font-bold mr-1.5 shrink-0">TEACHER:</span>
                                    <span className="uppercase">{teacherName || selectedSectionObj?.adviser_name || ''}</span>
                                </div>
                                <div className="h-9 px-3 flex items-center justify-center whitespace-nowrap grow">
                                    <span className="font-bold mr-1.5 shrink-0">SUBJECT:</span>
                                    <span className="uppercase">{subjectName || selectedSectionObj?.subject_name || ''}</span>
                                </div>
                            </div>

                            <table className="w-full table-fixed border-collapse border-2 border-black text-[10px] text-center">
                                <thead>
                                    <tr className="h-11">
                                        <th rowSpan={2} className="border border-black p-1 align-middle text-[9px] tracking-wide bg-gray-200" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>LEARNERS' NAMES</th>
                                        <th colSpan={8} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8px] bg-gray-200" style={{ letterSpacing: '0.02em' }}>WRITTEN / ORAL WORKS ({Math.round(currentWeights.written_works * 100)}%)</th>
                                        <th colSpan={6} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8px] leading-tight bg-gray-200" style={{ letterSpacing: '0.02em' }}>
                                            <span>PRODUCT / PERFORMANCE</span><br />
                                            <span>TASKS ({Math.round(currentWeights.performance_tasks * 100)}%)</span>
                                        </th>
                                        <th colSpan={6} className="border border-black px-2 py-1 text-center align-middle font-bold text-[8px] leading-tight bg-gray-200" style={{ letterSpacing: '0.02em' }}>
                                            <span>SUMMATIVE TESTS AND TERM</span><br />
                                            <span>EXAMINATIONS ({Math.round(currentWeights.quarterly_exam * 100)}%)</span>
                                        </th>
                                        <th rowSpan={3} className="border border-black w-16 min-w-16 max-w-16 p-1 align-middle bg-yellow-50 font-bold leading-none text-[9px]">INITIAL GRADE</th>
                                        <th rowSpan={3} className="border border-black w-20 min-w-20 max-w-20 p-1 align-middle bg-green-100 font-bold leading-none text-[8px] whitespace-normal wrap-break-word">TERM GRADE</th>
                                        <th rowSpan={3} className="border border-black w-24 min-w-24 max-w-24 p-1 align-middle bg-blue-100 font-bold leading-none text-[8px] whitespace-normal wrap-break-word">DESCRIPTOR</th>
                                    </tr>
                                    <tr className="h-8">
                                        {[1, 2, 3, 4, 5].map(i => <th key={`ww-${i}`} className="border border-black w-6 text-[9px] font-bold bg-gray-100">{i}</th>)}
                                        <th className="border border-black w-10 bg-gray-200">Total</th>
                                        <th className="border border-black w-14 bg-gray-200">PS</th>
                                        <th className="border border-black w-12 bg-gray-200">WS</th>
                                        {[1, 2, 3].map(i => <th key={`pt-${i}`} className="border border-black w-6 text-[9px] font-bold bg-gray-100">{i}</th>)}
                                        <th className="border border-black w-10 bg-gray-200">Total</th>
                                        <th className="border border-black w-14 bg-gray-200">PS</th>
                                        <th className="border border-black w-12 bg-gray-200">WS</th>
                                        <th className="border border-black w-10 text-[9px] font-bold leading-none py-0.5 bg-gray-100">ST1<br/><span className="text-[7px] font-normal">(30%)</span></th>
                                        <th className="border border-black w-10 text-[9px] font-bold leading-none py-0.5 bg-gray-100">ST2<br/><span className="text-[7px] font-normal">(30%)</span></th>
                                        <th className="border border-black w-10 text-[9px] font-bold leading-none py-0.5 bg-gray-100">TE<br/><span className="text-[7px] font-normal">(40%)</span></th>
                                        <th className="border border-black w-10 bg-gray-200">Total</th>
                                        <th className="border border-black w-14 bg-gray-200">PS</th>
                                        <th className="border border-black w-12 bg-gray-200">WS</th>
                                    </tr>
                                    <tr className="font-bold h-9">
                                        <td className="border border-black p-1 text-left whitespace-nowrap tracking-wide text-[7px] bg-blue-50" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>HIGHEST POSSIBLE SCORE</td>
                                        {hps.ww.map((val, i) => (
                                            <td key={`hps-ww-${i}`} className="border border-black p-0 bg-blue-50">
                                                <input
                                                    type="number"
                                                    value={val === '' ? '' : val}
                                                    onChange={(e) => updateHPS('ww', i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, i)}
                                                    data-row={0}
                                                    data-col={i}
                                                    className="w-full h-full text-center bg-transparent outline-none p-1 focus:bg-blue-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-gray-100 text-[8px]">{hps.ww.some(v => v !== '') ? hps.ww.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                        <td className="border border-black bg-gray-100 text-[8px]">100.00</td>
                                        <td className="border border-black bg-gray-100 text-[8px]">{currentWeights.written_works * 100}%</td>
                                        {hps.pt.map((val, i) => (
                                            <td key={`hps-pt-${i}`} className="border border-black p-0 bg-blue-50">
                                                <input
                                                    type="number"
                                                    value={val === '' ? '' : val}
                                                    onChange={(e) => updateHPS('pt', i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, 5 + i)}
                                                    data-row={0}
                                                    data-col={5 + i}
                                                    className="w-full h-full text-center bg-transparent outline-none p-1 focus:bg-blue-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-gray-100 text-[8px]">{hps.pt.some(v => v !== '') ? hps.pt.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                        <td className="border border-black bg-gray-100 text-[8px]">100.00</td>
                                        <td className="border border-black bg-gray-100 text-[8px]">{currentWeights.performance_tasks * 100}%</td>
                                        {hps.qa.map((val, i) => (
                                            <td key={`hps-qa-${i}`} className="border border-black p-0 bg-blue-50">
                                                <input
                                                    type="number"
                                                    value={val === '' ? '' : val}
                                                    onChange={(e) => updateHPS('qa', i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, 0, 8 + i)}
                                                    data-row={0}
                                                    data-col={8 + i}
                                                    className="w-full h-full text-center bg-transparent outline-none p-1 focus:bg-blue-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-black bg-gray-100 text-[8px]">{hps.qa.some(v => v !== '') ? hps.qa.reduce((a, b) => a + Number(b), 0) : ''}</td>
                                        <td className="border border-black bg-gray-100 text-[8px]">100.00</td>
                                        <td className="border border-black bg-gray-100 text-[8px]">{currentWeights.quarterly_exam * 100}%</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-gray-100 font-bold">
                                        <td colSpan={24} className="border border-black text-left px-2 py-1">{section.gender}</td>
                                    </tr>
                                    {section.students.map((student, idx) => {
                                        const summary = getStudentSummary(student);
                                        const descriptor = getGradeDescriptor(summary.quarterlyGrade, summary.hasScores);
                                        return (
                                            <tr key={student.lrn} className="hover:bg-gray-50">
                                                <td className="border border-black p-1 text-left text-[11px] leading-tight whitespace-nowrap font-bold uppercase" style={{ width: `${optimalNameColumnWidth}px`, minWidth: `${optimalNameColumnWidth}px`, maxWidth: `${optimalNameColumnWidth}px` }}>
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
                                                            className="w-full h-full text-center outline-none p-0 focus:bg-blue-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="border border-black bg-blue-50">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwTotalScore : ''}</td>
                                                <td className="border border-black bg-blue-50">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwPS.toFixed(2) : ''}</td>
                                                <td className="border border-black bg-blue-100 font-semibold">{summary.wwTotalHPS > 0 && summary.ww.some(s => s !== '') ? summary.wwWS.toFixed(2) : ''}</td>
                                                {summary.pt.map((score, i) => (
                                                    <td key={`pt-${i}`} className="border border-black p-0">
                                                        <input
                                                            type="number"
                                                            value={score === '' ? '' : score}
                                                            onChange={(e) => updateGrade(student.lrn, 'pt', i, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, (sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx, 5 + i)}
                                                            data-row={(sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx}
                                                            data-col={5 + i}
                                                            className="w-full h-full text-center outline-none p-0 focus:bg-green-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="border border-black bg-green-50">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptTotalScore : ''}</td>
                                                <td className="border border-black bg-green-50">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptPS.toFixed(2) : ''}</td>
                                                <td className="border border-black bg-green-100 font-semibold">{summary.ptTotalHPS > 0 && summary.pt.some(s => s !== '') ? summary.ptWS.toFixed(2) : ''}</td>
                                                {summary.qa.map((score, i) => (
                                                    <td key={`qa-${i}`} className="border border-black p-0">
                                                        <input
                                                            type="number"
                                                            value={score === '' ? '' : score}
                                                            onChange={(e) => updateGrade(student.lrn, 'qa', i, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, (sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx, 8 + i)}
                                                            data-row={(sectionIdx === 0 ? 1 : maleStudents.length + 1) + idx}
                                                            data-col={8 + i}
                                                            className="w-full h-full text-center outline-none p-0 focus:bg-yellow-100 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="border border-black bg-yellow-50">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaScore : ''}</td>
                                                <td className="border border-black bg-yellow-50">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaPS.toFixed(2) : ''}</td>
                                                <td className="border border-black bg-yellow-100 font-semibold">{summary.qaHPS > 0 && summary.qa.some(s => s !== '') ? summary.qaWS.toFixed(2) : ''}</td>
                                                <td className="border border-black bg-gray-100 font-bold">{summary.initialGrade.toFixed(2)}</td>
                                                <td className={`border border-black w-20 min-w-20 max-w-20 font-bold text-[10px] leading-tight whitespace-normal wrap-break-word ${summary.quarterlyGrade > 0 ? (summary.quarterlyGrade < 75 ? 'bg-red-500 text-white' : 'bg-deped-blue text-white') : 'bg-gray-50'}`}>
                                                    {summary.quarterlyGrade > 0 ? formatGradeForDisplay(summary.quarterlyGrade, sectionGradeLevel) : ''}
                                                </td>
                                                <td className="border border-black bg-blue-50 text-[10px] font-bold leading-tight whitespace-normal wrap-break-word px-1">
                                                    {descriptor}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                            ))}

                            {/* Page 3: Analytics Dashboard */}
                            <div className="class-record-page bg-white p-6 print:p-0 print:break-before-page mt-8">
                                {/* Header Section */}
                                <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2 px-4 print:px-1">
                                    <div className="w-16 h-16 flex items-center justify-center shrink-0">
                                        <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="text-center flex-1 mx-4">
                                        <h1 className="text-2xl font-bold font-serif tracking-wide text-black mb-2 uppercase">
                                            TERM SUMMARY OF LEARNERS' GRADES & ANALYTICS
                                        </h1>
                                        <div className="grid gap-x-4 gap-y-3 text-[10px] font-bold uppercase mb-2 justify-center w-full px-2" style={{ gridTemplateColumns: '42% 33% 25%' }}>
                                            {/* Row 1, Col 1: Region */}
                                            <div className="flex items-center min-h-[26px]">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">REGION</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-[100px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.region, "text-[10px]")}`}>
                                                    {schoolProfile.region}
                                                </div>
                                            </div>
                                            {/* Row 1, Col 2: Division */}
                                            <div className="flex items-center min-h-[26px]">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">DIVISION</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-[120px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.division, "text-[10px]")}`}>
                                                    {schoolProfile.division}
                                                </div>
                                            </div>
                                            {/* Row 1, Col 3: District */}
                                            <div className="flex items-center min-h-[26px]">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">DISTRICT</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-[120px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.district || '', "text-[10px]")}`}>
                                                    {schoolProfile.district || ''}
                                                </div>
                                            </div>

                                            {/* Row 2, Col 1: School Name */}
                                            <div className="flex items-center min-h-[26px]">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">SCHOOL NAME</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-[140px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.name, "text-[10px]")}`}>
                                                    {schoolProfile.name}
                                                </div>
                                            </div>
                                            {/* Row 2, Col 2: School ID */}
                                            <div className="flex items-center min-h-[26px]">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">SCHOOL ID</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-[80px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(schoolProfile.school_id, "text-[10px]")}`}>
                                                    {schoolProfile.school_id}
                                                </div>
                                            </div>
                                            {/* Row 2, Col 3: School Year */}
                                            <div className="flex items-center min-h-[26px]">
                                                <span className="text-slate-500 mr-2 whitespace-nowrap shrink-0">SCHOOL YEAR</span>
                                                <div className={`border border-black px-2 py-0.5 flex-1 min-w-[80px] text-center bg-white flex items-center justify-center wrap-break-word leading-tight ${getDynamicFontSizeClass(activeSchoolYear, "text-[10px]")}`}>
                                                    {activeSchoolYear}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-28 h-16 flex items-center justify-center shrink-0">
                                        <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Logo" className="w-full h-auto object-contain" />
                                    </div>
                                </div>

                                {/* Main Dashboard Grid (3 columns) */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {/* Column 1: Learning Progress and Achievement & Statistics */}
                                    <div className="space-y-3">
                                        <div className="border border-black rounded overflow-hidden">
                                            <div className="bg-slate-100 p-1.5 font-bold text-[9px] border-b border-black text-center uppercase tracking-wider">Learning Progress and Achievement</div>
                                            <table className="w-full text-center text-[8px] leading-tight">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-black text-[8px] font-bold">
                                                        <th className="p-1 border-r border-black w-28 uppercase text-left pl-2">Descriptors</th>
                                                        <th className="p-1 border-r border-black w-14 uppercase">Remarks</th>
                                                        <th className="p-1 border-r border-black w-10 uppercase">Male</th>
                                                        <th className="p-1 border-r border-black w-10 uppercase">Female</th>
                                                        <th className="p-1 w-10 uppercase">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { desc: 'Advancing (90-100)', remark: 'Passed', dataKey: 'advancing' },
                                                        { desc: 'Benchmarking (80-89)', remark: 'Passed', dataKey: 'benchmarking' },
                                                        { desc: 'Connecting (75-79)', remark: 'Passed', dataKey: 'connecting' },
                                                        { desc: 'Developing (65-74)', remark: 'Failed', dataKey: 'developing' },
                                                        { desc: 'Emerging (0-64)', remark: 'Failed', dataKey: 'emerging' }
                                                    ].map((level, idx) => {
                                                        const m = proficiencyData[level.dataKey]?.male || 0;
                                                        const f = proficiencyData[level.dataKey]?.female || 0;
                                                        return (
                                                            <tr key={idx} className="border-b border-gray-200">
                                                                <td className="p-1 border-r border-black text-left pl-2 font-medium">{level.desc}</td>
                                                                <td className={`p-1 border-r border-black font-bold ${level.remark === 'Failed' ? 'text-red-600' : 'text-green-700'}`}>{level.remark}</td>
                                                                <td className="p-1 border-r border-black">{m}</td>
                                                                <td className="p-1 border-r border-black">{f}</td>
                                                                <td className="p-1 font-bold">{m + f}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr className="bg-gray-100 font-bold border-t border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2" colSpan={2}>TOTAL</td>
                                                        <td className="p-1 border-r border-black">{maleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length}</td>
                                                        <td className="p-1 border-r border-black">{femaleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length}</td>
                                                        <td className="p-1 font-bold">{maleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length + femaleStudents.filter(s => getStudentSummary(s).quarterlyGrade > 0).length}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="border border-black rounded overflow-hidden">
                                            <div className="bg-slate-100 p-1.5 font-bold text-[9px] border-b border-black text-center uppercase tracking-wider">Statistics Summary</div>
                                            <table className="w-full text-center text-[8px] leading-tight">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-black font-bold">
                                                        <th className="p-1 border-r border-black text-left pl-2">Metric</th>
                                                        <th className="p-1 border-r border-black w-14">Male</th>
                                                        <th className="p-1 border-r border-black w-14">Female</th>
                                                        <th className="p-1 w-14">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { label: 'Mean Score (MPS)', key: 'mps' },
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
                                                                <td className="p-1 border-r border-black text-left pl-2 font-semibold">{stat.label}</td>
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

                                    {/* Column 2: Recharts Visualizations */}
                                    <div className="space-y-3">
                                        <div className="border border-black rounded p-2 bg-white flex flex-col items-center justify-center">
                                            <h4 className="text-[9px] font-bold text-gray-700 mb-1">Proficiency Level Distribution</h4>
                                            <div className="w-full h-[110px]">
                                                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
                                                    <BarChart data={[
                                                        { name: 'Advancing', count: proficiencyData.advancing?.total || 0 },
                                                        { name: 'Benchmarking', count: proficiencyData.benchmarking?.total || 0 },
                                                        { name: 'Connecting', count: proficiencyData.connecting?.total || 0 },
                                                        { name: 'Developing', count: proficiencyData.developing?.total || 0 },
                                                        { name: 'Emerging', count: proficiencyData.emerging?.total || 0 },
                                                    ]} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                                        <XAxis dataKey="name" tick={{ fontSize: 7 }} />
                                                        <YAxis tick={{ fontSize: 7 }} />
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

                                        <div className="border border-black rounded p-2 bg-white flex flex-col items-center justify-center">
                                            <h4 className="text-[9px] font-bold text-gray-700 mb-1">MPS by Gender</h4>
                                            <div className="w-full h-[70px]">
                                                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
                                                    <BarChart layout="vertical" data={[
                                                        { name: 'Male', mps: Number(mpsData.maleMps.toFixed(2)) },
                                                        { name: 'Female', mps: Number(mpsData.femaleMps.toFixed(2)) },
                                                    ]} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                                        <XAxis type="number" domain={[0, 100]} hide />
                                                        <YAxis dataKey="name" type="category" width={40} tick={{ fontSize: 8 }} />
                                                        <Tooltip />
                                                        <Bar dataKey="mps" fill="#3B82F6" barSize={12} label={{ position: 'right', fill: '#444', fontSize: 8 }}>
                                                            <Cell fill="#60A5FA" />
                                                            <Cell fill="#F472B6" />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Test / Exam Result Analysis */}
                                    <div className="border border-black overflow-hidden rounded bg-white">
                                        <div className="bg-slate-800 text-white p-1.5 font-bold text-[9px] border-b border-black text-center uppercase tracking-wider">
                                            Test / Exam Result Analysis
                                        </div>
                                        <div className="p-2 space-y-2 text-[8px] leading-tight">
                                            <table className="w-full text-center border-collapse border border-black">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-black font-bold">
                                                        <th className="p-1 border-r border-black text-left pl-2">Metric</th>
                                                        <th className="p-1 border-r border-black w-8">ST1</th>
                                                        <th className="p-1 border-r border-black w-8">ST2</th>
                                                        <th className="p-1 w-8">TE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2">Examinees</td>
                                                        <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st1.count}</td>
                                                        <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st2.count}</td>
                                                        <td className="p-1 font-bold">{summativeAnalysis.te.count}</td>
                                                    </tr>
                                                    <tr className="bg-slate-50 border-b border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2">HPS</td>
                                                        <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st1.hps}</td>
                                                        <td className="p-1 border-r border-black font-bold">{summativeAnalysis.st2.hps}</td>
                                                        <td className="p-1 font-bold">{summativeAnalysis.te.hps}</td>
                                                    </tr>
                                                    <tr className="border-b border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2">Passed (≥75%)</td>
                                                        <td className="p-1 border-r border-black">{summativeAnalysis.st1.criterion.above75} ({summativeAnalysis.st1.criterion.above75Pct.toFixed(0)}%)</td>
                                                        <td className="p-1 border-r border-black">{summativeAnalysis.st2.criterion.above75} ({summativeAnalysis.st2.criterion.above75Pct.toFixed(0)}%)</td>
                                                        <td className="p-1">{summativeAnalysis.te.criterion.above75} ({summativeAnalysis.te.criterion.above75Pct.toFixed(0)}%)</td>
                                                    </tr>
                                                    <tr className="bg-slate-50 border-b border-black">
                                                        <td className="p-1 border-r border-black text-left pl-2">Failed (&lt;75%)</td>
                                                        <td className="p-1 border-r border-black">{summativeAnalysis.st1.criterion.below75} ({summativeAnalysis.st1.criterion.below75Pct.toFixed(0)}%)</td>
                                                        <td className="p-1 border-r border-black">{summativeAnalysis.st2.criterion.below75} ({summativeAnalysis.st2.criterion.below75Pct.toFixed(0)}%)</td>
                                                        <td className="p-1">{summativeAnalysis.te.criterion.below75} ({summativeAnalysis.te.criterion.below75Pct.toFixed(0)}%)</td>
                                                    </tr>
                                                    {[
                                                        { label: 'Mean', key: 'mean' },
                                                        { label: 'Median', key: 'median' },
                                                        { label: 'SD', key: 'sd' },
                                                        { label: 'MPS/PL', key: 'mps' }
                                                    ].map((item, idx) => (
                                                        <tr key={idx} className={`border-b border-black ${idx % 2 === 0 ? '' : 'bg-slate-50'}`}>
                                                            <td className="p-1 border-r border-black text-left pl-2">{item.label}</td>
                                                            <td className="p-1 border-r border-black">{item.key === 'mps' ? summativeAnalysis.st1.norm.mps.toFixed(1) + '%' : (summativeAnalysis.st1.norm as any)[item.key].toFixed(1)}</td>
                                                            <td className="p-1 border-r border-black">{item.key === 'mps' ? summativeAnalysis.st2.norm.mps.toFixed(1) + '%' : (summativeAnalysis.st2.norm as any)[item.key].toFixed(1)}</td>
                                                            <td className="p-1">{item.key === 'mps' ? summativeAnalysis.te.norm.mps.toFixed(1) + '%' : (summativeAnalysis.te.norm as any)[item.key].toFixed(1)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: At-Risk & Top Performers side by side */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border border-red-200 rounded overflow-hidden bg-white">
                                        <div className="bg-red-50 p-1.5 font-bold text-[9px] border-b border-red-200 text-red-700 uppercase flex items-center gap-2">
                                            <span>🚨 Learners At Risk (Below 75)</span>
                                        </div>
                                        <table className="w-full text-center text-[8px] leading-tight">
                                            <thead className="bg-red-50">
                                                <tr className="text-red-800 font-bold border-b border-red-100">
                                                    <th className="p-1 text-left pl-2 w-2/3">Name</th>
                                                    <th className="p-1 w-16">Grade</th>
                                                    <th className="p-1 w-16">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...maleStudents, ...femaleStudents]
                                                    .map(s => ({ ...s, grade: getStudentSummary(s).quarterlyGrade }))
                                                    .filter(s => s.grade > 0 && s.grade < 75)
                                                    .sort((a, b) => a.grade - b.grade)
                                                    .slice(0, 5)
                                                    .map((s, idx) => (
                                                        <tr key={s.lrn} className="border-b border-red-50 hover:bg-red-50 transition-colors">
                                                            <td className="p-1 text-left pl-2 truncate font-medium text-gray-700">{idx + 1}. {s.last_name}, {s.first_name}</td>
                                                            <td className="p-1 font-bold text-red-600">{s.grade}</td>
                                                            <td className="p-1 text-red-600 font-bold uppercase tracking-wider">Failed</td>
                                                        </tr>
                                                    ))}
                                                {[...maleStudents, ...femaleStudents].filter(s => getStudentSummary(s).quarterlyGrade > 0 && getStudentSummary(s).quarterlyGrade < 75).length === 0 && (
                                                    <tr><td colSpan={3} className="p-3 text-gray-400 italic text-center">No learners at risk. Great job! 🎉</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="border border-green-200 rounded overflow-hidden bg-white">
                                        <div className="bg-green-50 p-1.5 font-bold text-[9px] border-b border-green-200 text-green-700 uppercase flex items-center gap-2">
                                            <span>🏆 Top Performers (Grade ≥ 90)</span>
                                        </div>
                                        <table className="w-full text-center text-[8px] leading-tight">
                                            <thead className="bg-green-50">
                                                <tr className="text-green-800 font-bold border-b border-green-100">
                                                    <th className="p-1 text-left pl-2 w-2/3">Name</th>
                                                    <th className="p-1 w-16">Grade</th>
                                                    <th className="p-1 w-16">Rank</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...maleStudents, ...femaleStudents]
                                                    .map(s => ({ ...s, grade: getStudentSummary(s).quarterlyGrade }))
                                                    .filter(s => s.grade >= 90)
                                                    .sort((a, b) => b.grade - a.grade)
                                                    .slice(0, 5)
                                                    .map((s, idx) => (
                                                        <tr key={s.lrn} className="border-b border-green-50 hover:bg-green-50 transition-colors">
                                                            <td className="p-1 text-left pl-2 truncate font-medium text-gray-700">{idx + 1}. {s.last_name}, {s.first_name}</td>
                                                            <td className="p-1 font-bold text-green-700">{s.grade}</td>
                                                            <td className="p-1"><span className="px-1 py-0.5 bg-green-100 text-green-800 font-bold rounded">#{idx + 1}</span></td>
                                                        </tr>
                                                    ))}
                                                {[...maleStudents, ...femaleStudents].filter(s => getStudentSummary(s).quarterlyGrade >= 90).length === 0 && (
                                                    <tr><td colSpan={3} className="p-3 text-gray-400 italic text-center">No outstanding learners yet.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                        </div>
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
