import { useState, useMemo, useEffect } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { ArrowLeft, FileText, Plus, Minus, Printer } from 'lucide-react';
import { filterSF9Sections } from '../lib/rbac';

export function SF5Page() {
    const students = useAppStore(s => s.students);
    const sections = useAppStore(s => s.sections);
    const subjects = useAppStore(s => s.subjects);
    const gradingSheetRecords = useAppStore(s => s.gradingSheetRecords);
    const schoolProfile = useAppStore(s => s.schoolProfile);
    const activeSchoolYear = useAppStore(s => s.activeSchoolYear);
    const teachers = useAppStore(s => s.teachers);
    const setCurrentView = useAppStore(s => s.setCurrentView);
    const { user } = useAuthStore();
    
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [paperSize, setPaperSize] = useState<'a4' | 'folio'>('a4');
    const [zoom, setZoom] = useState<number>(1); // Default zoom for preview
    
    // 1. Sort Sections by Grade Level -> Alphabetical
    const sortedSections = useMemo(() => {
        return [...filterSF9Sections(user, sections)].sort((a, b) => {
            const getGradeNum = (val: string) => {
                const num = val.match(/\d+/);
                return num ? parseInt(num[0]) : 0;
            };
            const gradeA = getGradeNum(a.section_grade_level);
            const gradeB = getGradeNum(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user]);

    // Auto-select section if only one is available
    useEffect(() => {
        if (!selectedSection && sortedSections.length === 1) {
            setSelectedSection(sortedSections[0].section_name);
        }
    }, [sortedSections, selectedSection]);

    const currentSectionInfo = useMemo(() => {
        return sections.find(s => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

    // Helpers to compute average and status
    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        const sectionId = currentSectionInfo?.id || '';
        const sName = currentSectionInfo?.section_name || '';
        return students.filter(s => s.student_section === sName || s.student_section === sectionId);
    }, [students, selectedSection, currentSectionInfo]);

    const sectionSubjects = useMemo(() => {
        if (!currentSectionInfo) return [];
        return subjects.filter((subject) => subject.section_id === currentSectionInfo.id);
    }, [subjects, currentSectionInfo]);

    const isMusicArtsSubject = (name: string) => {
        const normalized = name.trim().toLowerCase();
        return normalized === 'arts' || normalized === 'music' || normalized === 'music and arts';
    };

    const isPeHealthSubject = (name: string) => {
        const normalized = name.trim().toLowerCase();
        return (
            normalized === 'health' ||
            normalized === 'physical education' ||
            normalized === 'pe' ||
            normalized === 'physical education and health'
        );
    };

    // Compute grades for SF5
    const studentData = useMemo(() => {
        const sectionSubjectIds = new Set(sectionSubjects.map((subject) => subject.id));

        const hasMapehSubject = sectionSubjects.some((subject) => subject.subject_name.trim().toUpperCase() === 'MAPEH');
        const musicArtsComponents = sectionSubjects.filter((subject) => isMusicArtsSubject(subject.subject_name) && subject.subject_name.trim().toUpperCase() !== 'MAPEH');
        const peHealthComponents = sectionSubjects.filter((subject) => isPeHealthSubject(subject.subject_name) && subject.subject_name.trim().toUpperCase() !== 'MAPEH');
        const nonComponentSubjects = sectionSubjects.filter((subject) => {
            const upperName = subject.subject_name.trim().toUpperCase();
            return !isMusicArtsSubject(subject.subject_name) && !isPeHealthSubject(subject.subject_name) && upperName !== 'MAPEH';
        });

        const effectiveSubjects = [...nonComponentSubjects];

        if (hasMapehSubject) {
            const mapehSubject = sectionSubjects.find((subject) => subject.subject_name.trim().toUpperCase() === 'MAPEH');
            if (mapehSubject) {
                effectiveSubjects.push(mapehSubject);
            }
        } else if (musicArtsComponents.length > 0 || peHealthComponents.length > 0) {
            effectiveSubjects.push({ id: 'virtual-mapeh', subject_name: 'MAPEH', grade_level: currentSectionInfo?.section_grade_level || '' });
        }

        // Pre-group Grade Management records by student LRN for faster lookups
        const recordsByLrn = new Map<string, typeof gradingSheetRecords>();
        const sectionLrns = new Set(sectionStudents.map(s => s.lrn));
        
        for (const r of gradingSheetRecords) {
            if (
                sectionLrns.has(r.student_lrn) &&
                r.school_year === activeSchoolYear &&
                sectionSubjectIds.has(r.subject_id)
            ) {
                if (!recordsByLrn.has(r.student_lrn)) {
                    recordsByLrn.set(r.student_lrn, []);
                }
                recordsByLrn.get(r.student_lrn)!.push(r);
            }
        }

        return sectionStudents.map(student => {
            const studentRecords = recordsByLrn.get(student.lrn) || [];

            let finalGradesTotal = 0;
            let subjectsCount = 0;
            const failedSubjects: string[] = [];

            effectiveSubjects.forEach((subject) => {
                const upperName = subject.subject_name.trim().toUpperCase();

                if (upperName === 'MAPEH') {
                    let mapehQuarterTotal = 0;
                    let mapehQuarterCount = 0;

                    for (let quarter = 1; quarter <= 3; quarter++) {
                        const musicArtsGrades = musicArtsComponents
                            .map((component) => {
                                const rec = studentRecords.find((record) => record.subject_id === component.id && Number(record.quarter) === quarter);
                                return Number(rec?.final_grade) || 0;
                            })
                            .filter((grade) => grade > 0);

                        const peHealthGrades = peHealthComponents
                            .map((component) => {
                                const rec = studentRecords.find((record) => record.subject_id === component.id && Number(record.quarter) === quarter);
                                return Number(rec?.final_grade) || 0;
                            })
                            .filter((grade) => grade > 0);

                        const maAvg = musicArtsGrades.length > 0
                            ? Math.round(musicArtsGrades.reduce((sum, grade) => sum + grade, 0) / musicArtsGrades.length)
                            : null;
                        const phAvg = peHealthGrades.length > 0
                            ? Math.round(peHealthGrades.reduce((sum, grade) => sum + grade, 0) / peHealthGrades.length)
                            : null;

                        // MATATAG Rule: MAPEH = (Music and Arts + Physical Education and Health) / 2
                        const ma = maAvg || 0;
                        const ph = phAvg || 0;
                        if (ma > 0 || ph > 0) {
                            const quarterAvg = Math.round((ma + ph) / 2);
                            mapehQuarterTotal += quarterAvg;
                            mapehQuarterCount++;
                        }
                    }

                    if (mapehQuarterCount > 0) {
                        const finalGrade = Math.round(mapehQuarterTotal / mapehQuarterCount);
                        finalGradesTotal += finalGrade;
                        subjectsCount++;
                        if (finalGrade < 75) {
                            failedSubjects.push(subject.subject_name);
                        }
                    }
                    return;
                }

                let subjectQuarterTotal = 0;
                let subjectQuarterCount = 0;

                for (let quarter = 1; quarter <= 3; quarter++) {
                    const record = studentRecords.find((r) => r.subject_id === subject.id && Number(r.quarter) === quarter);
                    const grade = Number(record?.final_grade) || 0;
                    if (grade > 0) {
                        subjectQuarterTotal += grade;
                        subjectQuarterCount++;
                    }
                }

                if (subjectQuarterCount > 0) {
                    const finalGrade = Math.round(subjectQuarterTotal / subjectQuarterCount);
                    finalGradesTotal += finalGrade;
                    subjectsCount++;
                    if (finalGrade < 75) {
                        failedSubjects.push(subject.subject_name);
                    }
                }
            });

            const genAve = subjectsCount > 0 ? Math.round(finalGradesTotal / subjectsCount) : 0;
            let actionTaken = 'PROMOTED';
            if (failedSubjects.length > 0 && failedSubjects.length <= 2) {
                actionTaken = '*Conditional';
            } else if (failedSubjects.length >= 3) {
                actionTaken = 'RETAINED';
            }

            if (subjectsCount === 0) actionTaken = ''; // Not graded yet

            const uniqueFailedSubjects = Array.from(new Set(failedSubjects)).filter(Boolean);

            return {
                ...student,
                genAve,
                actionTaken,
                failedSubjects: uniqueFailedSubjects.join(', '),
            };
        }).sort((a, b) => a.last_name.localeCompare(b.last_name));
    }, [sectionStudents, sectionSubjects, gradingSheetRecords, activeSchoolYear, currentSectionInfo]);

    const males = studentData.filter(s => (s.gender || '').toLowerCase() === 'male');
    const females = studentData.filter(s => (s.gender || '').toLowerCase() === 'female');

    const summaryData = useMemo(() => {
        return {
            males: {
                promoted: males.filter(s => s.actionTaken === 'PROMOTED').length,
                conditional: males.filter(s => s.actionTaken === '*Conditional').length,
                retained: males.filter(s => s.actionTaken === 'RETAINED').length,
            },
            females: {
                promoted: females.filter(s => s.actionTaken === 'PROMOTED').length,
                conditional: females.filter(s => s.actionTaken === '*Conditional').length,
                retained: females.filter(s => s.actionTaken === 'RETAINED').length,
            }
        };
    }, [males, females]);

    const proficiencyData = useMemo(() => {
        const calculateLevel = (studentsList: typeof studentData) => {
            let a = 0, p = 0, ap = 0, d = 0, b = 0;
            studentsList.forEach(st => {
                if (st.genAve >= 90) a++;
                else if (st.genAve >= 85) p++;
                else if (st.genAve >= 80) ap++;
                else if (st.genAve >= 75) d++;
                else if (st.genAve > 0) b++; // Need to have a grade
            });
            return { a, p, ap, d, b };
        };
        return {
            males: calculateLevel(males),
            females: calculateLevel(females),
        };
    }, [males, females]);

    const isRecoveredAdviserPlaceholder = (value?: string | null) => {
        const normalized = (value || '').trim().toLowerCase();
        return normalized === 'recovered adviser' || normalized === 'recovered advisor';
    };

    // Resolve adviser name: Priority 1: Institute Profile (Source of Truth), then section fallback
    const resolvedAdviserName = useMemo(() => {
        const fromProfile = (schoolProfile?.adviser_name || '').trim();
        const isGenericProfile = fromProfile.toLowerCase() === 'admin' || fromProfile === '';

        // Source of Truth: If profile has a real name, use it!
        if (!isGenericProfile && fromProfile) return fromProfile;

        if (!currentSectionInfo) return fromProfile || 'TEST ADVISER';
        
        if (currentSectionInfo.adviser_id) {
            const teacher = teachers.find(t => t.uid === currentSectionInfo.adviser_id);
            if (teacher?.displayName) return teacher.displayName;
        }
        
        const fromSection = (currentSectionInfo.adviser_name || '').trim();
        if (fromSection && !isRecoveredAdviserPlaceholder(fromSection) && fromSection.toLowerCase() !== 'tba') {
            return fromSection;
        }

        return fromProfile || 'TEST ADVISER';
    }, [currentSectionInfo, teachers, schoolProfile]);

    const tableRows = [
        ...males.map(s => ({ type: 'student' as const, data: s })),
        { type: 'total' as const, label: 'TOTAL MALE' },
        ...females.map(s => ({ type: 'student' as const, data: s })),
        { type: 'total' as const, label: 'TOTAL FEMALE' },
        { type: 'total' as const, label: 'COMBINED TOTAL' },
    ];

    const totalPages = Math.ceil(tableRows.length / 28) || 1;

    const handlePrintSF5 = () => {
        const sectionName = sortedSections.find(s => s.section_name === selectedSection)?.section_name || 'Record';
        const originalTitle = document.title;
        document.title = `SF5_${schoolProfile.name || 'School'}_${sectionName}_${activeSchoolYear}`;
        window.print();
        document.title = originalTitle;
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans">
             {/* Sticky Premium Top Toolbar */}
             <div className="h-24 px-8 flex items-center justify-between z-[100] bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm relative print:hidden shrink-0">
                <div className="flex items-center gap-8">
                    {/* Brand/Back Hook */}
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">SF5 Report</h2>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Report on Promotion</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    <div className="flex items-center gap-4">
                        {sortedSections.length > 1 && (
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Section</span>
                                <select 
                                    className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2 text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    <option value="">Select Section</option>
                                    {sortedSections.map(s => <option key={s.id} value={s.section_name}>{s.section_grade_level} - {s.section_name}</option>)}
                                </select>
                            </div>
                        )}
                        {/* Paper Size */}
                        <div className="flex flex-col ml-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Paper Size</span>
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                <button
                                    onClick={() => setPaperSize('a4')}
                                    className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paperSize === 'a4' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    A4
                                </button>
                                <button
                                    onClick={() => setPaperSize('folio')}
                                    className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paperSize === 'folio' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Folio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Zoom Control */}
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">View Zoom</span>
                        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-black text-slate-900 w-12 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-200" />

                    {/* Print Primary Button */}
                    <button
                        onClick={handlePrintSF5}
                        disabled={!selectedSection}
                        className="h-14 px-10 rounded-2.5xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-3 group"
                    >
                        <Printer className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                        Print Official SF5
                    </button>
                </div>
             </div>

             {/* Main Workspace Area */}
             <div className="flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar">
                {!selectedSection ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-10 p-10 z-10">
                        <div className="relative">
                            <div className="absolute -inset-20 bg-blue-500/5 blur-[100px] rounded-full" />
                            <div className="relative w-48 h-48 bg-white rounded-[3rem] border border-slate-200 flex items-center justify-center transform rotate-6 border-dashed">
                                <FileText className="w-20 h-20 text-slate-200" />
                                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-xl">
                                    <span className="text-2xl font-black text-blue-600 italic">SF5</span>
                                </div>
                            </div>
                        </div>
                        <div className="max-w-md space-y-4">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Report Generator</h2>
                            <p className="text-slate-500 font-bold leading-relaxed">
                                Please wait while we prepare the Summarized Report on Promotion for your section.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full min-h-full flex justify-center py-20 px-8 print:p-0 print:block overflow-x-auto">
                        <div 
                            className="transition-all duration-700 ease-out origin-top print:scale-100"
                            style={{ transform: `scale(${zoom})` }}
                        >
                                {Array.from({ length: totalPages }).map((_, pageIdx) => {
                                    const isLastPage = pageIdx === totalPages - 1;
                                    const pageRows = tableRows.slice(pageIdx * 28, (pageIdx + 1) * 28);
                                    
                                    return (
                                        <div 
                                            key={pageIdx}
                                            className={`bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.08)] print:shadow-none p-[5mm] print:p-[5mm] relative box-border font-serif print-landscape flex flex-col sf5-print-page mb-20 last:mb-0 print:mb-0 ${
                                                paperSize === 'a4' 
                                                    ? 'w-[297mm] print-a4 sf5-a4-page' 
                                                    : 'w-[330mm] print-legal'
                                            }`}
                                            style={{ 
                                                fontSize: '13px',
                                                backgroundColor: '#ffffff',
                                                color: '#000000',
                                                fontFamily: 'Arial, Helvetica, sans-serif',
                                                letterSpacing: '0px',
                                                textRendering: 'auto',
                                                WebkitFontSmoothing: 'antialiased',
                                                height: 'max-content',
                                                minHeight: paperSize === 'a4' ? '210mm' : '216mm',
                                                paddingBottom: '30px'
                                            }}
                                        >
                                            {/* Header */}
                                            {pageIdx === 0 && (
                                                <div className="mb-4 mt-2 px-1 font-sans print:mb-2 print:mt-1">
                                                    <div className="flex items-center justify-center gap-4 mb-4 print:mb-2">
                                                        <img 
                                                            src={`${import.meta.env.BASE_URL || '/'}deped_logo_left.png`} 
                                                            alt="DepEd Logo" 
                                                            className="h-16 w-16 object-contain shrink-0"
                                                        />
                                                        <div className="flex flex-col text-center">
                                                            <h1 className="text-3xl font-bold" style={{ color: '#000000', letterSpacing: '0px' }}>School Form 5 (SF 5) Report on Promotion & Level of Proficiency</h1>
                                                            <p className="italic text-[11px] leading-tight mt-0.5" style={{ color: '#4b5563', letterSpacing: '0px' }}>(This replaced Forms 18-E1, 18-E2, 18A and List of Graduates)</p>
                                                        </div>
                                                        <div className="w-16 shrink-0 invisible" aria-hidden="true" />
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-[12px] items-center text-left print:gap-y-2">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">Region</span>
                                                                <div className="border border-black px-2 flex-1 h-[22px] flex items-center font-bold tracking-wide">{schoolProfile.region || 'Test Region'}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">School ID</span>
                                                                <div className="border border-black px-2 flex-1 h-[22px] flex items-center font-bold tracking-wide">{schoolProfile.school_id || '123456'}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">School Name</span>
                                                                <div className="border border-black px-2 flex-1 h-[22px] flex items-center font-bold tracking-wide">{schoolProfile.name || 'Test School'}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">Division</span>
                                                                <div className="border border-black px-2 flex-1 h-[22px] flex items-center font-bold tracking-wide">{schoolProfile.division || 'Test Division'}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">School Year</span>
                                                                <div className="border border-black px-2 flex-1 h-[22px] flex items-center font-bold tracking-wide">{activeSchoolYear}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">District</span>
                                                                <div className="border border-black px-2 flex-1 h-[22px] flex items-center font-bold tracking-wide">{schoolProfile.district || 'Test District'}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">Curriculum</span>
                                                                <div className="border border-black px-2 flex-1 h-[22px] flex items-center font-bold tracking-wide">MATATAG</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">Grade Level</span>
                                                                <div className="border border-black px-2 w-[4.5rem] flex-none h-[22px] flex items-center justify-center font-bold tracking-wide">
                                                                    {currentSectionInfo?.section_grade_level?.replace('Grade ', '') || 'Grade 1'}
                                                                </div>
                                                                <span className="ml-[2px] shrink-0 text-[12px] whitespace-nowrap">Section</span>
                                                                <div className="border border-black px-2 flex-1 h-[22px] flex items-center font-bold tracking-wide">
                                                                    {currentSectionInfo?.section_name || 'Test Section'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tables Container */}
                                            <div className="flex gap-4 px-1 print:flex print:gap-3">
                                                <div className="flex-[3.3] flex flex-col">
                                                    <table className="w-full border-collapse border border-black text-center text-[10.5px] font-sans">
                                                        <thead>
                                                            <tr className="leading-tight">
                                                                <th className="border border-black p-1 w-[1%] whitespace-nowrap font-bold" rowSpan={2}>LRN</th>
                                                                <th className="border border-black p-1 w-[1%] whitespace-nowrap font-bold px-2" rowSpan={2}>
                                                                    LEARNER'S NAME<br/>
                                                                    <span className="text-[8.5px] font-normal tracking-wide">(Last Name, First Name, Middle Name)</span>
                                                                </th>
                                                                <th className="border border-black p-1 w-[10%] font-bold" rowSpan={2}>
                                                                    GENERAL<br/>AVERAGE<br/>
                                                                    <span className="text-[7.5px] font-normal leading-none block mt-0.5">
                                                                        (Numerical Value in 3 decimal places for honor learner, 2 for non-honor)
                                                                    </span>
                                                                </th>
                                                                <th className="border border-black p-1 w-[13%] font-normal text-[8.5px]" rowSpan={2}>
                                                                    ACTION TAKEN:<br/>PROMOTED,<br/>*Conditional or<br/>RETAINED
                                                                </th>
                                                                <th className="border border-black p-1 font-normal align-top text-[8.5px]" colSpan={2}>
                                                                    <div className="leading-tight mb-[2px] mt-0.5">INCOMPLETE SUBJECT/S</div>
                                                                    <div className="text-[7.5px] leading-none px-1 pb-1">
                                                                        (This column is for K to 12 Curriculum and remaining RBEC in High School.)
                                                                    </div>
                                                                </th>
                                                            </tr>
                                                            <tr className="leading-tight">
                                                                <th className="border border-black p-0.5 font-normal text-[8.5px] w-[14%]">Completed as of end of current SY</th>
                                                                <th className="border border-black p-0.5 font-normal text-[8.5px] w-[14%]">as of End of the current SY</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pageRows.map((row, rIdx) => {
                                                                if (row.type === 'total') {
                                                                    return (
                                                                        <tr key={`total-${rIdx}`} className="bg-gray-100 font-bold font-sans text-[12px]" style={{ backgroundColor: '#f3f4f6' }}>
                                                                            <td className="border border-black py-1.5 pr-2 text-right uppercase" style={{ letterSpacing: '0px' }} colSpan={2}>{row.label}</td>
                                                                            <td className="border border-black p-1"></td>
                                                                            <td className="border border-black p-1"></td>
                                                                            <td className="border border-black p-1"></td>
                                                                            <td className="border border-black p-1"></td>
                                                                        </tr>
                                                                    );
                                                                }
                                                                const student = row.data!;
                                                                return (
                                                                    <tr key={student.lrn}>
                                                                        <td className="border border-black py-[0.5px] px-1 font-sans text-[12px] font-bold leading-tight whitespace-nowrap">{student.lrn}</td>
                                                                        <td className="border border-black py-[0.5px] px-2 text-left uppercase font-sans font-bold text-[11px] leading-tight whitespace-nowrap">{student.last_name}, {student.first_name} {student.middle_name ? student.middle_name[0] + '.' : ''}</td>
                                                                        <td className="border border-black py-[0.5px] px-1 font-sans text-[12px] font-bold leading-tight">{student.genAve > 0 ? student.genAve : ''}</td>
                                                                        <td className="border border-black py-[0.5px] px-1 font-sans text-[12px] leading-tight">{student.actionTaken}</td>
                                                                        <td className="border border-black py-[0.5px] px-1 text-[12px] leading-tight"></td>
                                                                        <td className="border border-black py-[0.5px] px-1 text-[8.5px] break-words whitespace-normal align-top leading-[1.1] italic text-left">{student.failedSubjects}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="flex-1 flex flex-col gap-3 pl-2 pb-6 min-w-0 font-sans">
                                                    {pageIdx === 0 && (
                                                        <div className="flex flex-col gap-3">
                                                            <table className="w-full border-collapse border border-black text-center text-[11px]">
                                                                <thead>
                                                                    <tr className="font-bold">
                                                                        <th className="border border-black py-1 px-0 text-[11px]" style={{ letterSpacing: '0px' }} colSpan={4}>SUMMARY TABLE</th>
                                                                    </tr>
                                                                    <tr className="font-bold text-[9.5px]">
                                                                        <th className="border border-black py-1 px-1 w-[40%] text-center uppercase">STATUS</th>
                                                                        <th className="border border-black py-1 px-1 w-[20%] text-center uppercase">MALE</th>
                                                                        <th className="border border-black py-1 px-1 w-[20%] text-center uppercase">FEMALE</th>
                                                                        <th className="border border-black py-1 px-1 w-[20%] text-center uppercase">TOTAL</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-none uppercase">PROMOTED</td>
                                                                        <td className="border border-black py-1">{summaryData.males.promoted || '0'}</td>
                                                                        <td className="border border-black py-1">{summaryData.females.promoted || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(summaryData.males.promoted + summaryData.females.promoted) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-none">*Conditional</td>
                                                                        <td className="border border-black py-1">{summaryData.males.conditional || '0'}</td>
                                                                        <td className="border border-black py-1">{summaryData.females.conditional || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(summaryData.males.conditional + summaryData.females.conditional) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-none uppercase">RETAINED</td>
                                                                        <td className="border border-black py-1">{summaryData.males.retained || '0'}</td>
                                                                        <td className="border border-black py-1">{summaryData.females.retained || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(summaryData.males.retained + summaryData.females.retained) || '0'}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>

                                                            <table className="w-full border-collapse border border-black text-center text-[11px] mt-0.5">
                                                                <thead>
                                                                    <tr className="font-bold">
                                                                        <th className="border border-black py-1 tracking-tight text-[9px]" colSpan={4}>LEARNING PROGRESS AND ACHIEVEMENT (Based on Learners' General Average)</th>
                                                                    </tr>
                                                                    <tr className="font-bold text-[9.5px]">
                                                                        <th className="border border-black py-1 px-1 w-[40%] text-center leading-tight">Descriptors &<br/>Grading Scale</th>
                                                                        <th className="border border-black py-1 px-1 w-[20%] uppercase text-center">MALE</th>
                                                                        <th className="border border-black py-1 px-1 w-[20%] uppercase text-center">FEMALE</th>
                                                                        <th className="border border-black py-1 px-1 w-[20%] uppercase text-center">TOTAL</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-tight">
                                                                            <span className="text-[10px]">Did Not Meet Expectations</span><br/>
                                                                            <span className="text-[9px]">( 74 and below)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.b || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.b || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.b + proficiencyData.females.b) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-tight">
                                                                            <span className="text-[10px]">Fairly Satisfactory</span><br/>
                                                                            <span className="text-[9px]">( 75-79)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.d || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.d || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.d + proficiencyData.females.d) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-tight">
                                                                            <span className="text-[10px]">Satisfactory</span><br/>
                                                                            <span className="text-[9px]">( 80-84)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.ap || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.ap || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.ap + proficiencyData.females.ap) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-tight">
                                                                            <span className="text-[10px]">Very Satisfactory</span><br/>
                                                                            <span className="text-[9px]">( 85 -89)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.p || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.p || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.p + proficiencyData.females.p) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-tight">
                                                                            <span className="text-[10px]">Outstanding</span><br/>
                                                                            <span className="text-[9px]">( 90 -100)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.a || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.a || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.a + proficiencyData.females.a) || '0'}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {pageIdx !== 0 && !isLastPage && (
                                                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-slate-300 rounded-2xl m-8">
                                                            <div className="text-[12px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Section Continued</div>
                                                            <div className="text-[10px] mt-2" style={{ color: '#94a3b8' }}>Signatures on Final Page</div>
                                                        </div>
                                                    )}

                                                    {isLastPage && (
                                                        <div className="flex flex-col gap-3">
                                                            <div className="mt-1 flex flex-col gap-2.5 text-[12px] font-sans pr-2">
                                                                <div>
                                                                    <p className="mb-3 text-left">PREPARED BY:</p>
                                                                    <div className="text-center font-bold tracking-wide">
                                                                        {resolvedAdviserName.toUpperCase()}
                                                                    </div>
                                                                    <div className="border-t border-black text-center pt-0.5 mx-auto w-full leading-tight">
                                                                        Class Adviser<br/>
                                                                        <span className="text-[11px]">(Name and Signature)</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="mb-3 text-left">CERTIFIED CORRECT & SUBMITTED:</p>
                                                                    <div className="text-center font-bold tracking-wide">
                                                                    {(schoolProfile.head_name || 'TEST HEAD').toUpperCase()}
                                                                    </div>
                                                                    <div className="border-t border-black text-center pt-0.5 mx-auto w-full leading-tight">
                                                                        School Head<br/>
                                                                        <span className="text-[11px]">(Name and Signature)</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="mb-3 text-left">REVIEWED BY:</p>
                                                                    <div className="text-center font-bold text-transparent select-none tracking-wide text-[8px]">
                                                                    ______________________________
                                                                    </div>
                                                                    <div className="border-t border-black text-center pt-0.5 mx-auto w-full leading-tight">
                                                                        <span className="text-[11px]">(Name and Signature)</span><br/>
                                                                        Division Representative
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 text-[10px] font-sans leading-tight pr-2">
                                                                <h3 className="font-bold text-[11px] mb-1">GUIDELINES:</h3>
                                                                <div className="space-y-1.5 text-justify">
                                                                    <p className="italic font-bold">1. Do not include Dropouts and Transferred Out (D.O.4, 2014)</p>
                                                                    <p>2. To be prepared by the Adviser. The Adviser should indicate the General Average based on the learner's Form 138.</p>
                                                                    <p>
                                                                        3. On the summary table, reflect the total number of learners PROMOTED (Final Grade of at least <span className="font-bold uppercase">75 in ALL learning areas</span>), 
                                                                        RETAINED (Did Not Meet Expectations in <span className="font-bold uppercase">three (3) or more learning areas</span>) and 
                                                                        *CONDITIONAL (*Did Not Meet Expectations in <span className="font-bold uppercase">not more than two (2) learning areas</span>) 
                                                                        and the Learning Progress and Achievement according to the individual General Average. All provisions on classroom assessment and the grading system in the said Order shall be in effect for all grade levels - Deped Order 29, s. 2015.
                                                                    </p>
                                                                    <p>4. Did Not Meet Expectations of the Learning Areas. This refers to learning area/s that the learner had failed as of end of current SY. The learner may be for remediation or retention.</p>
                                                                    <p>5. Protocols of validation & submission is under the discretion of the Schools Division Superintendent.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="absolute bottom-1 right-2 text-[11px] text-right font-sans italic print:bottom-1 print:right-2">
                                                        School Form 5: Page {pageIdx + 1} of {totalPages}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                    </div>
                )}
            </div>
        </div>
    );
}
