import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../stores/app-store';
import { useAuthStore } from '../stores/auth-store';
import { ArrowLeft, FileText, Plus, Minus, Printer, ChevronDown, Layout as AppLogo, Download, ShieldCheck } from 'lucide-react';
import { filterSF9Sections } from '../lib/rbac';
import { formatLearnerName } from '../utils/student-name';
import { resolveStudentQuarterGrade, isMatchingSubject } from '../utils/grading-helpers';
import { getShsSubjectUnitInfo } from '../lib/curriculum';

export function SF5Page() {
    const students = useAppStore(s => s.students);
    const sections = useAppStore(s => s.sections);
    const subjects = useAppStore(s => s.subjects);
    const gradingSheetRecords = useAppStore(s => s.gradingSheetRecords);
    const classRecords = useAppStore(s => s.classRecords);
    const hpsRecords = useAppStore(s => s.hpsRecords);
    const schoolProfile = useAppStore(s => s.schoolProfile);
    const activeSchoolYear = useAppStore(s => s.activeSchoolYear);
    const teachers = useAppStore(s => s.teachers);
    const setCurrentView = useAppStore(s => s.setCurrentView);
    const showNotification = useAppStore(s => s.showNotification);
    const { user } = useAuthStore();
    
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [paperSize, setPaperSize] = useState<'a4' | 'folio'>('a4');
    const [zoom, setZoom] = useState<number>(0.8); // Default zoom for preview
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [showAdviserSig, setShowAdviserSig] = useState<boolean>(() => {
        return localStorage.getItem('formease_sf5_show_adviser_sig') !== 'false';
    });
    const [showHeadSig, setShowHeadSig] = useState<boolean>(() => {
        return localStorage.getItem('formease_sf5_show_head_sig') !== 'false';
    });
    const [sigDropdownOpen, setSigDropdownOpen] = useState(false);
    const sigBtnRef = useRef<HTMLButtonElement>(null);
    
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
            setSelectedSection(sortedSections[0].id);
        }
    }, [sortedSections, selectedSection]);

    const currentSectionInfo = useMemo(() => {
        return sections.find(s => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

    const curriculumLabel = useMemo(() => {
        const gradeText = (currentSectionInfo?.section_grade_level || '').toString().toLowerCase();
        const gradeNum = parseInt(gradeText.replace(/\D/g, '')) || 0;

        if (gradeNum === 11) return 'Strengthened Senior High School';
        if (gradeNum === 12) return 'K-12';
        return 'Revised K-10';
    }, [currentSectionInfo?.section_grade_level]);

    // Helpers to compute average and status
    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        const sectionId = currentSectionInfo?.id || '';
        const sName = currentSectionInfo?.section_name || '';
        return students.filter(s => s.student_section === sName || s.student_section === sectionId);
    }, [students, selectedSection, currentSectionInfo]);

    const sectionSubjects = useMemo(() => {
        if (!currentSectionInfo) return [];
        const sectionGradeNum = parseInt(currentSectionInfo.section_grade_level.replace(/\D/g, '')) || 0;
        const isSHS = currentSectionInfo.section_grade_level.includes('11') || currentSectionInfo.section_grade_level.includes('12');
        const sectionTrack = (currentSectionInfo.track || '').toLowerCase();
        const taughtRaw = currentSectionInfo.taught_subjects || [];

        let candidates = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            return (s.section_id === currentSectionInfo.id || (!s.section_id && subjectGradeNum === sectionGradeNum)) && s.term !== 'none';
        });

        const sectionSpecific = candidates.filter(s => s.section_id === currentSectionInfo.id);
        if (sectionSpecific.length > 0) {
            candidates = sectionSpecific;
        }

        if (taughtRaw.length > 0) {
            candidates = candidates.filter(s => taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name)) || s.section_id === currentSectionInfo.id || s.is_special_program);
        } else if (isSHS && sectionTrack) {
            candidates = candidates.filter(s => {
                const unitInfo = getShsSubjectUnitInfo(s.subject_name, currentSectionInfo.section_grade_level);
                if (unitInfo.category === 'core') return true;
                if (sectionTrack.includes('acad')) {
                    return unitInfo.category === 'academic_elective' || unitInfo.category === 'arts_elective';
                }
                if (sectionTrack.includes('tech') || sectionTrack.includes('tvl')) {
                    return unitInfo.category === 'techpro_elective' || unitInfo.category === 'work_immersion';
                }
                return true;
            });
        }

        return candidates;
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
                                return resolveStudentQuarterGrade(
                                    student.lrn,
                                    component.id,
                                    quarter,
                                    activeSchoolYear,
                                    classRecords,
                                    gradingSheetRecords,
                                    hpsRecords,
                                    currentSectionInfo?.section_grade_level,
                                    currentSectionInfo?.track
                                );
                            })
                            .filter((grade) => grade > 0);

                        const peHealthGrades = peHealthComponents
                            .map((component) => {
                                return resolveStudentQuarterGrade(
                                    student.lrn,
                                    component.id,
                                    quarter,
                                    activeSchoolYear,
                                    classRecords,
                                    gradingSheetRecords,
                                    hpsRecords,
                                    currentSectionInfo?.section_grade_level,
                                    currentSectionInfo?.track
                                );
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
                    const grade = resolveStudentQuarterGrade(
                        student.lrn,
                        subject.id,
                        quarter,
                        activeSchoolYear,
                        classRecords,
                        gradingSheetRecords,
                        hpsRecords,
                        currentSectionInfo?.section_grade_level,
                        currentSectionInfo?.track
                    );
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
    }, [sectionStudents, sectionSubjects, gradingSheetRecords, classRecords, hpsRecords, activeSchoolYear, currentSectionInfo]);

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
            let advancing = 0, benchmarking = 0, connecting = 0, developing = 0, emerging = 0;
            studentsList.forEach(st => {
                if (st.genAve >= 90) advancing++;
                else if (st.genAve >= 80) benchmarking++;
                else if (st.genAve >= 75) connecting++;
                else if (st.genAve >= 65) developing++;
                else if (st.genAve > 0) emerging++;
            });
            return { advancing, benchmarking, connecting, developing, emerging };
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

    const resolvedAdviserName = useMemo(() => {
        const fromProfile = (schoolProfile?.adviser_name || '').trim();
        const isGenericProfile = fromProfile.toLowerCase() === 'admin' || fromProfile === '';

        const fromSection = (currentSectionInfo?.adviser_name || '').trim();
        const isPlaceholder = !fromSection || 
                              isRecoveredAdviserPlaceholder(fromSection) ||
                              fromSection.toLowerCase().includes('maria') || 
                              fromSection.toLowerCase().includes('santos') || 
                              fromSection.toLowerCase().includes('juan') || 
                              fromSection.toLowerCase() === 'tba';

        if (currentSectionInfo?.adviser_id && !currentSectionInfo.adviser_id.startsWith('adv-')) {
            const teacher = teachers.find(t => t.uid === currentSectionInfo.adviser_id);
            if (teacher?.displayName) return teacher.displayName;
        }

        if (fromSection && !isPlaceholder) {
            return fromSection;
        }

        if (!isGenericProfile && fromProfile) return fromProfile;

        return fromProfile || 'Class Adviser';
    }, [currentSectionInfo, teachers, schoolProfile]);

    const tableRows = useMemo(() => [
        ...males.map(s => ({ type: 'student' as const, data: s })),
        { type: 'total' as const, label: 'TOTAL MALE' },
        ...females.map(s => ({ type: 'student' as const, data: s })),
        { type: 'total' as const, label: 'TOTAL FEMALE' },
        { type: 'total' as const, label: 'COMBINED TOTAL' },
    ], [males, females]);

    const pages = useMemo(() => {
        const result: typeof tableRows[] = [];
        let currentPage: typeof tableRows = [];
        
        tableRows.forEach((row) => {
            const pageIdx = result.length;
            const limit = pageIdx === 0 ? 28 : 38; // 28 rows on Page 1, 38 rows on Page 2+
            
            currentPage.push(row);
            if (currentPage.length === limit) {
                result.push(currentPage);
                currentPage = [];
            }
        });
        
        if (currentPage.length > 0) {
            result.push(currentPage);
        }
        
        return result.length > 0 ? result : [[]];
    }, [tableRows]);

    const totalPages = pages.length;

    const handlePrintSF5 = () => {
        const sectionName = sortedSections.find(s => s.id === selectedSection || s.section_name === selectedSection)?.section_name || 'Record';
        const originalTitle = document.title;
        document.title = `SF5_${schoolProfile.name || 'School'}_${sectionName}_${activeSchoolYear}`;
        window.print();
        document.title = originalTitle;
    };

    const handleDownloadSF5 = async () => {
        const selectedSectionName = sortedSections.find(s => s.id === selectedSection || s.section_name === selectedSection)?.section_name || 'Record';
        const filename = `SF5_${schoolProfile.name || 'School'}_${selectedSectionName}_${activeSchoolYear}.pdf`;

        const printPages = Array.from(document.querySelectorAll('.sf5-print-page')) as HTMLElement[];
        if (printPages.length === 0) {
            showNotification('Nothing to download. Please select a section first.', 'error');
            return;
        }

        setIsDownloading(true);
        const parentTransforms: string[] = [];
        const parentsToRestore: HTMLElement[] = [];

        try {
            const html2canvas = (await import('html2canvas-pro')).default;
            const { jsPDF } = await import('jspdf');

            // Temporarily reset zoom scale transforms on the parent wrappers
            printPages.forEach(p => {
                const parent = p.parentElement;
                if (parent) {
                    parentTransforms.push(parent.style.transform);
                    parentsToRestore.push(parent);
                    parent.style.transform = 'none';
                }
            });

            // Force a layout reflow
            if (parentsToRestore.length > 0) {
                void parentsToRestore[0].offsetHeight;
            }

            // Derive PDF dimensions dynamically from the selected paperSize
            const paperWidthMm = paperSize === 'a4' ? 297 : 330.2;
            const paperHeightMm = paperSize === 'a4' ? 210 : 215.9;
            const pdfFormat = [paperWidthMm, paperHeightMm];

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: pdfFormat
            });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 4;
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;
            const pdfRatio = usableW / usableH;

            for (let i = 0; i < printPages.length; i++) {
                if (i > 0) {
                    pdf.addPage(pdfFormat, 'landscape');
                }
                const pageEl = printPages[i];

                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (clonedDoc) => {
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = `
                            ::-webkit-scrollbar {
                                display: none !important;
                            }
                            * {
                                scrollbar-width: none !important;
                                -ms-overflow-style: none !important;
                            }
                        `;
                        clonedDoc.head.appendChild(style);
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const canvasRatio = canvas.width / canvas.height;

                let imgW = usableW;
                let imgH = usableH;
                let xOffset = margin;
                let yOffset = margin;

                if (canvasRatio > pdfRatio) {
                    imgW = usableW;
                    imgH = usableW / canvasRatio;
                    yOffset = margin + (usableH - imgH) / 2;
                } else {
                    imgH = usableH;
                    imgW = usableH * canvasRatio;
                    xOffset = margin + (usableW - imgW) / 2;
                }

                pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgW, imgH);
            }

            pdf.save(filename);
            showNotification('SF5 Report downloaded successfully!', 'success');
        } catch (err) {
            console.error('Download failed:', err);
            showNotification('Failed to download SF5 Report. Please try again.', 'error');
        } finally {
            // Restore original parent transforms
            parentsToRestore.forEach((parent, idx) => {
                parent.style.transform = parentTransforms[idx] || '';
            });
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans">
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm relative print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30" />
                <div className="h-14 px-2.5 lg:px-3 flex items-center justify-between gap-2.5 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="flex items-center gap-2 min-w-0 shrink-0">
                        <button
                            onClick={() => setCurrentView('school-forms')}
                            className="w-8 h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0 select-none">
                            <AppLogo className="w-4 h-4" />
                        </div>
                        <h2 className="text-[9px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                            SF5 Report
                        </h2>
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10 shrink-0" />

                    <div className="flex items-center gap-2 min-w-0 shrink-0">
                        {sortedSections.length > 1 && (
                            <div className="relative group shrink-0">
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-7 text-[8px] lg:text-[9px] font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-27.5 lg:w-32.5 duration-200"
                                >
                                    <option value="">Section</option>
                                    {sortedSections.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.section_grade_level} - {s.section_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                            </div>
                        )}

                        {/* Paper Size */}
                        <div className="relative group shrink-0">
                            <select
                                value={paperSize}
                                onChange={(e) => setPaperSize(e.target.value as 'a4' | 'folio')}
                                className="appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-7 text-[8px] lg:text-[9px] font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-20 lg:w-22.5 duration-200"
                            >
                                <option value="a4">A4</option>
                                <option value="folio">Folio</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-3" />

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Signatures Toggle */}
                        <div className="shrink-0">
                            <button
                                ref={sigBtnRef}
                                onClick={() => setSigDropdownOpen(prev => !prev)}
                                className="h-8 px-2.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 rounded-lg text-[8px] lg:text-[9px] font-black text-slate-900 dark:text-white flex items-center gap-1 transition-all duration-200 select-none"
                            >
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Signatures</span>
                                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${sigDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {sigDropdownOpen && createPortal(
                                <>
                                    <div className="fixed inset-0 z-9998" onClick={() => setSigDropdownOpen(false)} />
                                    <div
                                        className="fixed w-44 bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl p-2.5 z-9999 space-y-2"
                                        style={(() => {
                                            const rect = sigBtnRef.current?.getBoundingClientRect();
                                            if (!rect) return { top: 0, left: 0 };
                                            return { top: rect.bottom + 4, left: Math.max(8, rect.right - 176) };
                                        })()}
                                    >
                                        <label className="flex items-center gap-2 cursor-pointer select-none text-[9px] font-bold text-slate-900 dark:text-white">
                                            <input
                                                type="checkbox"
                                                checked={showAdviserSig}
                                                onChange={(e) => {
                                                    const val = e.target.checked;
                                                    setShowAdviserSig(val);
                                                    localStorage.setItem('formease_sf5_show_adviser_sig', String(val));
                                                }}
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 focus:ring-2"
                                            />
                                            <span>Adviser Signature</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none text-[9px] font-bold text-slate-900">
                                            <input
                                                type="checkbox"
                                                checked={showHeadSig}
                                                onChange={(e) => {
                                                    const val = e.target.checked;
                                                    setShowHeadSig(val);
                                                    localStorage.setItem('formease_sf5_show_head_sig', String(val));
                                                }}
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 focus:ring-2"
                                            />
                                            <span>School Head Signature</span>
                                        </label>
                                    </div>
                                </>,
                                document.body
                            )}
                        </div>

                        {/* Zoom Control */}
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all shadow-sm active:scale-90 duration-200"
                                title="Zoom Out"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all shadow-sm active:scale-90 duration-200"
                                title="Zoom In"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Download PDF Button */}
                        <button
                            onClick={handleDownloadSF5}
                            disabled={!selectedSection || isDownloading}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-black active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center group duration-200"
                            title="Download PDF"
                        >
                            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </button>

                        {/* Print Primary Button */}
                        <button
                            onClick={handlePrintSF5}
                            disabled={!selectedSection}
                            className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 hover:scale-[1.01] hover:-translate-y-px active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center group duration-200"
                            title="Print Official SF5"
                        >
                            <Printer className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
             </div>

             {/* Main Workspace Area */}
             <div className="flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar">
                {!selectedSection ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-10 p-10 z-10">
                        <div className="relative">
                            <div className="absolute -inset-20 bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] rounded-full" />
                            <div className="relative w-48 h-48 bg-white dark:bg-white/5 rounded-[3rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform rotate-6 border-dashed">
                                <FileText className="w-20 h-20 text-slate-200 dark:text-slate-600" />
                                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center shadow-xl">
                                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400 italic">SF5</span>
                                </div>
                            </div>
                        </div>
                        <div className="max-w-md space-y-4">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Report Generator</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
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
                                {pages.map((pageRows, pageIdx) => {
                                    const isLastPage = pageIdx === pages.length - 1;
                                    
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
                                                                <div className="border border-black px-2 flex-1 h-5.5 flex items-center font-bold tracking-wide">{schoolProfile.region || 'Test Region'}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">School ID</span>
                                                                <div className="border border-black px-2 flex-1 h-5.5 flex items-center font-bold tracking-wide">{schoolProfile.school_id || '123456'}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">School Name</span>
                                                                <div className="border border-black px-2 flex-1 h-5.5 flex items-center font-bold tracking-wide">{schoolProfile.name || 'Test School'}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">Division</span>
                                                                <div className="border border-black px-2 flex-1 h-5.5 flex items-center font-bold tracking-wide">{schoolProfile.division || 'Test Division'}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">School Year</span>
                                                                <div className="border border-black px-2 flex-1 h-5.5 flex items-center font-bold tracking-wide">{activeSchoolYear}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">District</span>
                                                                <div className="border border-black px-2 flex-1 h-5.5 flex items-center font-bold tracking-wide">{schoolProfile.district || 'Test District'}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">Curriculum</span>
                                                                <div className="border border-black px-2 flex-1 h-5.5 flex items-center font-bold tracking-wide">{curriculumLabel}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-20 shrink-0 text-[12px] whitespace-nowrap">Grade Level</span>
                                                                <div className="border border-black px-2 w-18 flex-none h-5.5 flex items-center justify-center font-bold tracking-wide">
                                                                    {currentSectionInfo?.section_grade_level?.replace('Grade ', '') || 'Grade 1'}
                                                                </div>
                                                                <span className="ml-0.5 shrink-0 text-[12px] whitespace-nowrap">Section</span>
                                                                <div className="border border-black px-2 flex-1 h-5.5 flex items-center font-bold tracking-wide">
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
                                                    <table className="w-full border-collapse text-center text-[10.5px] font-sans">
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
                                                                    <div className="leading-tight mb-0.5 mt-0.5">INCOMPLETE SUBJECT/S</div>
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
                                                                        <td className="border border-black py-[0.5px] px-2 text-left uppercase font-sans font-bold text-[11px] leading-tight whitespace-nowrap">{formatLearnerName(student)}</td>
                                                                        <td className="border border-black py-[0.5px] px-1 font-sans text-[12px] font-bold leading-tight">{student.genAve > 0 ? student.genAve : ''}</td>
                                                                        <td className="border border-black py-[0.5px] px-1 font-sans text-[12px] leading-tight">{student.actionTaken}</td>
                                                                        <td className="border border-black py-[0.5px] px-1 text-[12px] leading-tight"></td>
                                                                        <td className="border border-black py-[0.5px] px-1 text-[8.5px] wrap-break-word whitespace-normal align-top leading-[1.1] italic text-left">{student.failedSubjects}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="flex-1 flex flex-col gap-3 pl-2 pb-6 min-w-0 font-sans">
                                                    {pageIdx === 0 && (
                                                        <div className="flex flex-col gap-3">
                                                            <table className="w-full border-collapse text-center text-[11px]">
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

                                                            <table className="w-full border-collapse text-center text-[11px] mt-0.5">
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
                                                                            <span className="text-[10px]">Emerging</span><br/>
                                                                            <span className="text-[9px]">(64 and below)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.emerging || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.emerging || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.emerging + proficiencyData.females.emerging) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-tight">
                                                                            <span className="text-[10px]">Developing</span><br/>
                                                                            <span className="text-[9px]">(65-74)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.developing || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.developing || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.developing + proficiencyData.females.developing) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-tight">
                                                                            <span className="text-[10px]">Connecting</span><br/>
                                                                            <span className="text-[9px]">(75-79)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.connecting || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.connecting || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.connecting + proficiencyData.females.connecting) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-tight">
                                                                            <span className="text-[10px]">Benchmarking</span><br/>
                                                                            <span className="text-[9px]">(80-89)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.benchmarking || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.benchmarking || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.benchmarking + proficiencyData.females.benchmarking) || '0'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="border border-black py-1 text-center px-1 leading-tight">
                                                                            <span className="text-[10px]">Advancing</span><br/>
                                                                            <span className="text-[9px]">(90-100)</span>
                                                                        </td>
                                                                        <td className="border border-black py-1">{proficiencyData.males.advancing || '0'}</td>
                                                                        <td className="border border-black py-1">{proficiencyData.females.advancing || '0'}</td>
                                                                        <td className="border border-black py-1 font-bold">{(proficiencyData.males.advancing + proficiencyData.females.advancing) || '0'}</td>
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
                                                                <div className="relative">
                                                                    <p className="mb-3 text-left">PREPARED BY:</p>
                                                                    {showAdviserSig && schoolProfile?.adviser_signature_url && (
                                                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-8.75 w-24 h-10 flex items-center justify-center pointer-events-none z-10">
                                                                            <img 
                                                                                src={schoolProfile.adviser_signature_url} 
                                                                                alt="Adviser Signature" 
                                                                                className="max-h-full max-w-full object-contain" 
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <div className="text-center font-bold tracking-wide">
                                                                        {resolvedAdviserName.toUpperCase()}
                                                                    </div>
                                                                    <div className="border-t border-black text-center pt-0.5 mx-auto w-full leading-tight">
                                                                        Class Adviser<br/>
                                                                        <span className="text-[11px]">(Name and Signature)</span>
                                                                    </div>
                                                                </div>
                                                                <div className="relative">
                                                                    <p className="mb-3 text-left">CERTIFIED CORRECT & SUBMITTED:</p>
                                                                    {showHeadSig && schoolProfile?.head_signature_url && (
                                                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-8.75 w-24 h-10 flex items-center justify-center pointer-events-none z-10">
                                                                            <img 
                                                                                src={schoolProfile.head_signature_url} 
                                                                                alt="School Head Signature" 
                                                                                className="max-h-full max-w-full object-contain" 
                                                                            />
                                                                        </div>
                                                                    )}
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
            <style>{`
                @media print {
                    @page { size: ${paperSize === 'folio' ? '330mm 216mm' : '297mm 210mm'}; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
