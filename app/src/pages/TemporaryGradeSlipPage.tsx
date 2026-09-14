import { useState, useMemo } from 'react';
import { useAppStore } from '../stores';
import { ArrowLeft, Printer, Layout, Plus, Minus, Bug } from 'lucide-react';
import { sortSubjects, normalizeSubjectName, getCanonicalSubjectKey, getSubjectsForGrade } from '../lib/subjectConfig';
import { getShsSubjectUnitInfo } from '../lib/curriculum';
import type { Section, Student, Subject, ClassRecord, SchoolProfile } from '../types';
import { resolveStudentQuarterGrade, isMatchingSubject, normalizeGrade12PESubjectName } from '../utils/grading-helpers';

type PaperSize = 'a4' | 'letter' | 'folio';

export function TemporaryGradeSlipPage() {
    const { 
        students, 
        sections, 
        subjects, 
        schoolProfile, 
        setCurrentView, 
        gradingSheetRecords, 
        activeSchoolYear,
        selectedSection: globalSelectedSection,
        setSelectedSection: setGlobalSelectedSection
    } = useAppStore();
    const [paperSize, setPaperSize] = useState<PaperSize>('letter');
    const [zoom, setZoom] = useState(1);

    const sortedSections = useMemo(() => {
        if (!sections || sections.length === 0) return [];
        const advisoryOnly = sections.filter(s => s.is_advisory);
        const base = advisoryOnly.length > 0 ? advisoryOnly : sections;
        // Sort strictly by grade level (numeric) then section name (alphabetical)
        return [...base].sort((a, b) => {
            const getGradeNum = (gl?: string) => {
                if (!gl) return 99;
                const num = parseInt(gl.replace(/\D/g, ''), 10);
                return isNaN(num) ? 99 : num;
            };

            const glA = getGradeNum(a.section_grade_level);
            const glB = getGradeNum(b.section_grade_level);

            if (glA !== glB) return glA - glB;
            return (a.section_name || '').localeCompare(b.section_name || '', undefined, { sensitivity: 'base' });
        });
    }, [sections]);

    const selectedSection = useMemo(() => {
        if (globalSelectedSection && sortedSections.some(s => s.section_name === globalSelectedSection || s.id === globalSelectedSection)) {
            const match = sortedSections.find(s => s.section_name === globalSelectedSection || s.id === globalSelectedSection);
            return match ? match.section_name : globalSelectedSection;
        }
        return sortedSections[0]?.section_name || '';
    }, [globalSelectedSection, sortedSections]);

    const setSelectedSection = (val: string) => {
        setGlobalSelectedSection(val);
    };

    const selectedSectionObj = useMemo(() => {
        return sections.find(s => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        return students
            .filter(s => s.student_section === selectedSection || (selectedSectionObj?.id && s.student_section === selectedSectionObj.id))
            .sort((a, b) => {
                if (a.gender !== b.gender) {
                    return a.gender === 'Male' ? -1 : 1;
                }
                return a.last_name.localeCompare(b.last_name);
            });
    }, [students, selectedSection, selectedSectionObj]);

    // Gather subjects for this section
    const sectionSubjects = useMemo(() => {
        if (!selectedSectionObj) return [];
        const sectionGradeNum = parseInt(selectedSectionObj.section_grade_level.replace(/\D/g, '')) || 0;
        const isSHS = selectedSectionObj.section_grade_level.includes('11') || selectedSectionObj.section_grade_level.includes('12');
        const sectionTrack = (selectedSectionObj.track || '').toLowerCase();
        const taughtSet = (selectedSectionObj.taught_subjects || []);

        // 1. All active subjects matching this section's grade level or assigned to this section
        let candidates = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            const isMatchingGrade = subjectGradeNum === sectionGradeNum;
            const isMatchingSection = s.section_id === selectedSectionObj.id;
            return (isMatchingGrade || isMatchingSection) && s.term !== 'none';
        });

        // 2. Exclude subjects explicitly assigned to a different section
        candidates = candidates.filter(s => !s.section_id || s.section_id === selectedSectionObj.id);

        // 3. For SHS (Grades 11 & 12): filter electives based on taughtSet or sectionTrack, keeping Core subjects
        if (isSHS) {
            if (taughtSet.length > 0) {
                // Ensure all explicitly taught subjects are present
                for (const tName of taughtSet) {
                    const alreadyHas = candidates.some(s => isMatchingSubject(tName, s.id, s.subject_name));
                    if (!alreadyHas) {
                        candidates.push({
                            id: `virtual_${tName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                            subject_name: tName,
                            subject_code: '',
                            grade_level: selectedSectionObj.section_grade_level,
                            section_id: selectedSectionObj.id,
                            term: 'all'
                        });
                    }
                }

                candidates = candidates.filter(s => {
                    return taughtSet.some(t => isMatchingSubject(t, s.id, s.subject_name));
                });

                // Use the exact subject name from taught_subjects, normalizing Old K-12 PE
                const isExplicitSSHS = (selectedSectionObj?.track || '').toLowerCase().includes('sshs') || (selectedSectionObj?.track || '').toLowerCase().includes('cluster');
                const isG12 = selectedSectionObj?.section_grade_level?.includes('12');
                candidates = candidates.map(s => {
                    const matchedTaught = taughtSet.find(t => isMatchingSubject(t, s.id, s.subject_name));
                    let name = matchedTaught || s.subject_name;
                    if (isG12 && !isExplicitSSHS) {
                        name = normalizeGrade12PESubjectName(name, false);
                    }
                    if (name !== s.subject_name) {
                        return { ...s, subject_name: name };
                    }
                    return s;
                });
            } else if (sectionTrack) {
                candidates = candidates.filter(s => {
                    const unitInfo = getShsSubjectUnitInfo(s.subject_name, selectedSectionObj.section_grade_level);
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
        } else {
            // For JHS / Elementary: if taught_subjects is configured, filter candidates by taughtSet
            const intendedSubjects = getSubjectsForGrade(selectedSectionObj.section_grade_level, schoolProfile?.curriculum);
            const isSubjectAllowedInTaught = (subId: string, subName: string) => {
                return taughtSet.some(t => {
                    if (isMatchingSubject(t, subId, subName)) return true;
                    const normT = normalizeSubjectName(t);
                    const normSub = normalizeSubjectName(subName);
                    if (normT === 'mapeh') {
                        return normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health') || normSub.includes('physical');
                    }
                    return false;
                });
            };

            if (taughtSet.length > 1) {
                candidates = candidates.filter(s => isSubjectAllowedInTaught(s.id, s.subject_name));
            } else {
                candidates = candidates.filter(s => {
                    const isIntended = intendedSubjects.some(intended => isMatchingSubject(intended.name, s.id, s.subject_name) || normalizeSubjectName(intended.name) === normalizeSubjectName(s.subject_name));
                    const isExplicitlyTaught = isSubjectAllowedInTaught(s.id, s.subject_name);
                    return isIntended || isExplicitlyTaught;
                });
            }
        }

        // 4. Prioritize clean standard names and section-specific subjects
        candidates.sort((a, b) => {
            if (!isSHS) {
                const aHasDigit = /\d+$/.test(a.subject_name.trim()) ? 1 : 0;
                const bHasDigit = /\d+$/.test(b.subject_name.trim()) ? 1 : 0;
                if (aHasDigit !== bHasDigit) return aHasDigit - bHasDigit;
            }
            const aDirect = a.section_id === selectedSectionObj.id ? 1 : 0;
            const bDirect = b.section_id === selectedSectionObj.id ? 1 : 0;
            return bDirect - aDirect;
        });

        // 5. Strictly deduplicate by canonical subject name
        const seenNames = new Set<string>();
        const uniqueSubjects: Subject[] = [];
        for (const s of candidates) {
            const canonical = getCanonicalSubjectKey(s.subject_name, selectedSectionObj.section_grade_level);
            if (canonical && seenNames.has(canonical)) continue;
            if (canonical) seenNames.add(canonical);
            uniqueSubjects.push(s);
        }

        // Ensure parent MAPEH header exists if components exist (for JHS and Elementary)
        if (!isSHS) {
            const hasMapehHeader = uniqueSubjects.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');
            const hasMapehComponents = uniqueSubjects.some(s => {
                const n = normalizeSubjectName(s.subject_name);
                return n.includes('musicandarts') || n.includes('musicarts') || 
                       n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth') ||
                       n === 'music' || n === 'arts' || n === 'physicaleducation' || n === 'health';
            });

            if (hasMapehComponents && !hasMapehHeader) {
                uniqueSubjects.push({
                    id: `virtual-mapeh-${selectedSectionObj.id}`,
                    subject_name: 'MAPEH',
                    section_id: selectedSectionObj.id,
                    grade_level: selectedSectionObj.section_grade_level,
                    term: 'all'
                } as Subject);
            }
        }

        // 6. Fallback: If no subjects exist in DB for this grade level, load standard curriculum subjects
        if (uniqueSubjects.length === 0) {
            const standardList = getSubjectsForGrade(selectedSectionObj.section_grade_level);
            for (const item of standardList) {
                if (item.name && item.name.trim()) {
                    const canonical = getCanonicalSubjectKey(item.name, selectedSectionObj.section_grade_level);
                    if (!seenNames.has(canonical)) {
                        seenNames.add(canonical);
                        uniqueSubjects.push({
                            id: `curriculum-${canonical}`,
                            subject_name: item.name,
                            grade_level: selectedSectionObj.section_grade_level,
                            term: 'all'
                        } as Subject);
                    }
                }
            }
        }

        return sortSubjects(uniqueSubjects, s => s.subject_name);
    }, [subjects, selectedSectionObj, schoolProfile?.curriculum]);

    const handlePrint = () => {
        window.print();
    };

    // Calculate dimensions based on paper size
    const printDimensions = {
        a4: { height: '297mm', width: '210mm', cssSize: 'A4 portrait' },
        letter: { height: '279.4mm', width: '215.9mm', cssSize: 'letter portrait' },
        folio: { height: '330.2mm', width: '215.9mm', cssSize: '8.5in 13in portrait' }
    };
    
    return (
        <div className="h-full bg-slate-50 dark:bg-[#080d1a] flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible">
            <style>{`
                .print-page {
                    width: ${printDimensions[paperSize].width};
                    height: ${printDimensions[paperSize].height};
                    padding: 0;
                    margin: 20px auto;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(2, 1fr);
                    gap: 0;
                    background: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border-radius: 4px;
                    position: relative;
                }

                /* Crossline cut guides */
                .print-page::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    border-top: 1px dashed #999;
                    z-index: 5;
                }
                .print-page::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 0;
                    bottom: 0;
                    border-left: 1px dashed #999;
                    z-index: 5;
                }
                /* Small cross marks at intersection */
                .cut-cross {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 6;
                    width: 12px;
                    height: 12px;
                }
                .cut-cross::before, .cut-cross::after {
                    content: '';
                    position: absolute;
                    background: #999;
                }
                .cut-cross::before {
                    width: 12px;
                    height: 1px;
                    top: 50%;
                    left: 0;
                    transform: translateY(-50%);
                }
                .cut-cross::after {
                    width: 1px;
                    height: 12px;
                    left: 50%;
                    top: 0;
                    transform: translateX(-50%);
                }

                .grade-slip-card {
                    box-sizing: border-box;
                    padding: 4mm;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    height: 100%;
                    font-family: "Bookman Old Style", "Bookman", "Georgia", serif;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    background: white;
                }

                /* Standard table styles to match the layout precisely */
                .grade-table {
                    width: 100%;
                    height: 100%;
                    border-collapse: collapse;
                    font-size: 8.5px;
                    table-layout: fixed;
                }
                .grade-table th, .grade-table td {
                    border: 1px solid #000;
                    padding: 2px 3px;
                }
                .grade-table th {
                    font-weight: bold;
                    text-align: center;
                }
                .grade-table .subject-col {
                    width: 48%;
                    text-align: left;
                }
                .grade-table .q-col {
                    width: 9%;
                    text-align: center;
                }
                .grade-table .final-col {
                    width: 11%;
                    text-align: center;
                    font-weight: bold;
                }
                .grade-table .remarks-col {
                    width: 14%;
                    text-align: center;
                }

                @media print {
                    @page {
                        size: ${printDimensions[paperSize].cssSize};
                        margin: 0;
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: visible !important;
                    }
                    .print-page {
                        width: 100vw !important;
                        height: 100vh !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        page-break-after: always;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-page:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    .grade-slip-card {
                        box-shadow: none !important;
                        height: 100% !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-preview-container {
                        transform: none !important;
                        width: 100% !important;
                    }
                }
            `}</style>

            {/* Header Toolbar */}
            <div className="h-20 px-8 flex items-center justify-between bg-white dark:bg-[#0d1225]/95 border-b border-slate-200 dark:border-white/10 sticky top-0 z-100 shadow-sm print:hidden">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setCurrentView('school-forms')}
                        className="p-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl transition-all text-slate-600 dark:text-slate-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Section Selection Dropdown */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline-block">Section:</label>
                            <select 
                                className="bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer min-w-55"
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                            >
                                {sortedSections.length === 0 ? (
                                    <option value="">No sections available</option>
                                ) : (
                                    sortedSections.map(sec => (
                                        <option key={sec.id || sec.section_name} value={sec.section_name}>
                                            {sec.section_grade_level} - {sec.section_name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <select 
                            className="bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer"
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                        >
                            <option value="letter">Letter (8.5 x 11in)</option>
                            <option value="a4">A4 Size (210 x 297mm)</option>
                            <option value="folio">Folio / Long (8.5 x 13in)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Zoom Control */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                        <button 
                            onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-lg transition-all shadow-sm"
                            title="Zoom Out"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 dark:text-white w-12 text-center tabular-nums">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button 
                            onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-lg transition-all shadow-sm"
                            title="Zoom In"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />

                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('formease-open-grade-debugger', {
                                detail: {
                                    sectionId: selectedSectionObj?.id || selectedSection
                                }
                            }));
                        }}
                        className="h-11 px-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 font-black text-[11px] uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                        title="Inspect & Debug Grade Sync"
                    >
                        <Bug className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="hidden sm:inline">Inspect Sync</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        disabled={sectionStudents.length === 0}
                        className="h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print Slips
                    </button>
                </div>
            </div>

            {/* Layout Preview */}
            <div className="flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 dark:bg-[#080d1a] print:bg-white print:p-0 print:overflow-visible custom-scrollbar">
                {sectionStudents.length > 0 ? (
                    <div className="print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100" style={{ transform: `scale(${zoom})` }}>
                        <div className="print:w-full flex flex-col items-center gap-8 print:gap-0">
                            {/* PDF-like Paginated View */}
                            {Array.from({ length: Math.ceil(sectionStudents.length / 4) }).map((_, pageIdx) => (
                                <div key={pageIdx} className="print-page relative">
                                    {/* Page Number Indicator */}
                                    <div className="absolute -top-6 right-0 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest print:hidden">
                                        Page {pageIdx + 1} of {Math.ceil(sectionStudents.length / 4)}
                                    </div>
                                    {/* Center cross mark for cutting */}
                                    <div className="cut-cross" />
                                    
                                     {sectionStudents.slice(pageIdx * 4, (pageIdx + 1) * 4).map((student) => {
                                         const gradeLevelNum = parseInt(selectedSectionObj?.section_grade_level?.replace(/\D/g, '') || '0');
                                         const isSHS = gradeLevelNum === 11 || gradeLevelNum === 12;
                                         if (isSHS) {
                                             return (
                                                 <ShsGradeSlipCard 
                                                     key={student.lrn} 
                                                     student={student} 
                                                     schoolProfile={schoolProfile}
                                                     section={selectedSectionObj}
                                                     subjects={sectionSubjects}
                                                     records={gradingSheetRecords}
                                                     activeSchoolYear={activeSchoolYear}
                                                 />
                                             );
                                         }
                                         return (
                                             <GradeSlipCard 
                                                 key={student.lrn} 
                                                 student={student} 
                                                 schoolProfile={schoolProfile}
                                                 section={selectedSectionObj}
                                                 subjects={sectionSubjects}
                                                 records={gradingSheetRecords}
                                                 activeSchoolYear={activeSchoolYear}
                                             />
                                         );
                                     })}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md">
                        <div className="w-20 h-20 bg-slate-200 dark:bg-white/10 rounded-3xl flex items-center justify-center mb-6">
                            <Layout className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No Advisory Class Set</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface GradeSlipCardProps {
    student: Student;
    schoolProfile: SchoolProfile;
    section: Section | undefined;
    subjects: Subject[];
    records: ClassRecord[];
    activeSchoolYear: string;
}

function GradeSlipCard({ student, schoolProfile, section, subjects, records, activeSchoolYear }: GradeSlipCardProps) {
    const baseUrl = import.meta.env.BASE_URL;
    const logoUrl = schoolProfile.logo_url || 'school-logo.png';
    const depedLogo = `${baseUrl}deped_logo_left.png`;

    // Deduplicate incoming subjects as safeguard
    const dedupedSubjects = useMemo(() => {
        const seen = new Set<string>();
        const res: Subject[] = [];
        const sorted = [...subjects].sort((a, b) => {
            const aHasDigit = /\d+$/.test(a.subject_name.trim()) ? 1 : 0;
            const bHasDigit = /\d+$/.test(b.subject_name.trim()) ? 1 : 0;
            return aHasDigit - bHasDigit;
        });
        for (const s of sorted) {
            const canonical = getCanonicalSubjectKey(s.subject_name, section?.section_grade_level);
            if (canonical && seen.has(canonical)) continue;
            if (canonical) seen.add(canonical);
            res.push(s);
        }

        // Ensure parent MAPEH header exists if components exist (for JHS and Elementary)
        const isSHS = section?.section_grade_level?.includes('11') || section?.section_grade_level?.includes('12');
        if (!isSHS) {
            const hasMapehHeader = res.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');
            const hasMapehComponents = res.some(s => {
                const n = normalizeSubjectName(s.subject_name);
                return n.includes('musicandarts') || n.includes('musicarts') || 
                       n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth') ||
                       n === 'music' || n === 'arts' || n === 'physicaleducation' || n === 'health';
            });

            if (hasMapehComponents && !hasMapehHeader) {
                res.push({
                    id: `virtual-mapeh-${section?.id || 'temp'}`,
                    subject_name: 'MAPEH',
                    section_id: section?.id,
                    grade_level: section?.section_grade_level,
                    term: 'all'
                } as Subject);
            }
        }

        return sortSubjects(res, s => s.subject_name);
    }, [subjects, section?.section_grade_level, section?.id]);
    
    // Extract grades for this student for all 3 terms
    const studentGrades = useMemo(() => {
        const subjectGrades: Record<string, { q1: string, q2: string, q3: string, final: string, remarks: string }> = {};
        let finalTotal = 0;
        let finalCount = 0;

        // Per-term totals for general average per term
        const termTotals = { t1: 0, t2: 0, t3: 0 };
        const termCounts = { t1: 0, t2: 0, t3: 0 };

        const classRecords = useAppStore.getState().classRecords || [];
        const hpsRecords = useAppStore.getState().hpsRecords || [];

        const hasParentMapeh = dedupedSubjects.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');

        // First pass: compute grades for individual non-MAPEH subjects
        dedupedSubjects.forEach((subj: Subject) => {
            const normName = normalizeSubjectName(subj.subject_name);
            if (normName === 'mapeh') return; // Handled in second pass

            let q1 = '', q2 = '', q3 = '';
            let sTotal = 0, sCount = 0;

            const isComponent = hasParentMapeh && (
                normName.includes('musicandarts') || normName.includes('musicarts') ||
                normName.includes('physicaleducationandhealth') || normName.includes('peandhealth') || normName.includes('pehealth') ||
                normName === 'music' || normName === 'arts' || normName === 'physicaleducation' || normName === 'health' || normName === 'pe'
            );

            const isExcludedFromAverage = isComponent || 
                subj.subject_name.startsWith('*') || 
                subj.subject_name.toLowerCase().includes('arabic language') || 
                subj.subject_name.toLowerCase().includes('islamic values');

            for (let q = 1; q <= 3; q++) {
                const g = resolveStudentQuarterGrade(
                    student.lrn,
                    subj.id,
                    q,
                    activeSchoolYear,
                    classRecords,
                    records,
                    hpsRecords,
                    section?.section_grade_level,
                    section?.track
                );
                if (g > 0) {
                    if (q === 1) { q1 = g.toString(); if (!isExcludedFromAverage) { termTotals.t1 += g; termCounts.t1++; } }
                    if (q === 2) { q2 = g.toString(); if (!isExcludedFromAverage) { termTotals.t2 += g; termCounts.t2++; } }
                    if (q === 3) { q3 = g.toString(); if (!isExcludedFromAverage) { termTotals.t3 += g; termCounts.t3++; } }
                    sTotal += g;
                    sCount++;
                }
            }

            let finalGrade = '';
            let remarks = '';
            
            // Only compute final grade and remarks if all 3 terms are complete
            if (sCount === 3) {
                const avg = Math.round(sTotal / 3);
                finalGrade = avg.toString();
                if (!isExcludedFromAverage) {
                    finalTotal += avg;
                    finalCount++;
                }
                remarks = avg >= 75 ? 'Passed' : 'Failed';
            }

            subjectGrades[subj.id] = { q1, q2, q3, final: finalGrade, remarks };
        });

        // Second pass: compute parent MAPEH grades
        const mapehSubj = dedupedSubjects.find(s => normalizeSubjectName(s.subject_name) === 'mapeh');
        if (mapehSubj) {
            let q1 = '', q2 = '', q3 = '';
            let sTotal = 0, sCount = 0;

            for (let q = 1; q <= 3; q++) {
                const qKey = `q${q}` as 'q1' | 'q2' | 'q3';
                let g = resolveStudentQuarterGrade(
                    student.lrn,
                    mapehSubj.id,
                    q,
                    activeSchoolYear,
                    classRecords,
                    records,
                    hpsRecords,
                    section?.section_grade_level,
                    section?.track
                );

                if (g === 0) {
                    const maSubs = dedupedSubjects.filter(s => {
                        const n = normalizeSubjectName(s.subject_name);
                        return n.includes('musicandarts') || n.includes('musicarts') || n === 'music' || n === 'arts';
                    });
                    const peSubs = dedupedSubjects.filter(s => {
                        const n = normalizeSubjectName(s.subject_name);
                        return n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth') || n === 'physicaleducation' || n === 'health' || n === 'pe';
                    });

                    const maScores = maSubs.map(s => Number(subjectGrades[s.id]?.[qKey] || 0)).filter(v => v > 0);
                    const peScores = peSubs.map(s => Number(subjectGrades[s.id]?.[qKey] || 0)).filter(v => v > 0);

                    const maAvg = maScores.length > 0 ? Math.round(maScores.reduce((a, b) => a + b, 0) / maScores.length) : 0;
                    const peAvg = peScores.length > 0 ? Math.round(peScores.reduce((a, b) => a + b, 0) / peScores.length) : 0;

                    if (maAvg > 0 && peAvg > 0) {
                        g = Math.round((maAvg + peAvg) / 2);
                    } else if (maAvg > 0) {
                        g = maAvg;
                    } else if (peAvg > 0) {
                        g = peAvg;
                    }
                }

                if (g > 0) {
                    if (q === 1) { q1 = g.toString(); termTotals.t1 += g; termCounts.t1++; }
                    if (q === 2) { q2 = g.toString(); termTotals.t2 += g; termCounts.t2++; }
                    if (q === 3) { q3 = g.toString(); termTotals.t3 += g; termCounts.t3++; }
                    sTotal += g;
                    sCount++;
                }
            }

            let finalGrade = '';
            let remarks = '';
            // Only compute final grade and remarks if all 3 terms are complete
            if (sCount === 3) {
                const avg = Math.round(sTotal / 3);
                finalGrade = avg.toString();
                finalTotal += avg;
                finalCount++;
                remarks = avg >= 75 ? 'Passed' : 'Failed';
            }

            subjectGrades[mapehSubj.id] = { q1, q2, q3, final: finalGrade, remarks };
        }

        // Count expected subjects that contribute to general average
        let expectedSubjCount = 0;
        dedupedSubjects.forEach(s => {
            const normName = normalizeSubjectName(s.subject_name);
            if (hasParentMapeh) {
                if (normName === 'mapeh') {
                    expectedSubjCount++;
                    return;
                }
                const isComponent = normName.includes('musicandarts') || normName.includes('musicarts') ||
                    normName.includes('physicaleducationandhealth') || normName.includes('peandhealth') || normName.includes('pehealth') ||
                    normName === 'music' || normName === 'arts' || normName === 'physicaleducation' || normName === 'health' || normName === 'pe';
                if (isComponent) return;
            } else if (normName === 'mapeh') {
                return;
            }

            if (s.subject_name.startsWith('*') || 
                s.subject_name.toLowerCase().includes('arabic language') || 
                s.subject_name.toLowerCase().includes('islamic values')) {
                return;
            }

            expectedSubjCount++;
        });

        // 3 terms are complete only if every expected subject has all 3 terms graded
        const areAll3TermsComplete = expectedSubjCount > 0 && 
            finalCount === expectedSubjCount &&
            termCounts.t1 === expectedSubjCount &&
            termCounts.t2 === expectedSubjCount &&
            termCounts.t3 === expectedSubjCount;

        // If the 3 terms are not complete yet:
        // Do not compute or show final grade yet, as well as general average per term and remarks
        if (!areAll3TermsComplete) {
            Object.keys(subjectGrades).forEach(id => {
                subjectGrades[id].final = '';
                subjectGrades[id].remarks = '';
            });
        }

        const genAvg = areAll3TermsComplete && finalCount > 0 ? Math.round(finalTotal / finalCount).toString() : '';
        const genRemarks = areAll3TermsComplete && genAvg ? (Number(genAvg) >= 75 ? 'Passed' : 'Failed') : '';

        const genT1 = areAll3TermsComplete && termCounts.t1 > 0 ? Math.round(termTotals.t1 / termCounts.t1).toString() : '';
        const genT2 = areAll3TermsComplete && termCounts.t2 > 0 ? Math.round(termTotals.t2 / termCounts.t2).toString() : '';
        const genT3 = areAll3TermsComplete && termCounts.t3 > 0 ? Math.round(termTotals.t3 / termCounts.t3).toString() : '';

        return { subjectGrades, genAvg, genRemarks, genT1, genT2, genT3 };
    }, [dedupedSubjects, records, student.lrn, activeSchoolYear, section?.section_grade_level, section?.track]);

    const studentFullName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''}`.trim();
    
    const nameFontSize = useMemo(() => {
        if (studentFullName.length > 35) return 'text-[7.5px] leading-tight';
        if (studentFullName.length > 25) return 'text-[8.2px] leading-tight';
        return 'text-[9px]';
    }, [studentFullName]);

    const getSubjectFontSizeStyle = (name: string) => {
        const len = name.length;
        if (len === 0) return { fontSize: '10px' };

        const isSub = normalizeSubjectName(name).includes('music') || 
                      normalizeSubjectName(name).includes('arts') ||
                      normalizeSubjectName(name).includes('physical') ||
                      normalizeSubjectName(name).includes('health');
                      
        // Usable width in pixels (for A4 width = 97mm inner card width).
        // Subject col is 48% of 97mm = 46.56mm = 176px.
        // Horizontal cell padding is 3px each side -> 6px -> 170px.
        // Subcomponent has pl-3 (12px) -> 158px.
        const usableWidth = isSub ? 158 : 170;
        
        // Bookman Old Style average character width factor is around 0.55.
        // Using 0.54 to maximize font size and let text stretch closer to the margins
        // without wrapping.
        const charWidthRatio = 0.54;
        
        // Calculate dynamic font size to perfectly fit the column width
        const calculatedSize = usableWidth / (len * charWidthRatio);
        
        // Cap the font size:
        // Maximum size: 10px (looks incredibly clear, legible, and balanced)
        // Minimum size: 7.5px (still readable and prevents table clipping)
        const finalSize = Math.max(7.5, Math.min(10, calculatedSize));
        
        return {
            fontSize: `${finalSize.toFixed(2)}px`,
            lineHeight: finalSize < 8.5 ? '1' : '1.1'
        };
    };

    return (
        <div className="grade-slip-card font-serif text-[9px] relative text-black leading-tight">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-1.5 px-1 shrink-0">
                <img src={depedLogo} className="w-10 h-10 object-contain" alt="DepEd" />
                <div className="text-center font-bold leading-none">
                    <p className="uppercase text-[9px]">{schoolProfile.name}</p>
                    <p className="uppercase text-[9px] font-normal tracking-wide mt-0.5">SCHOOL YEAR: {activeSchoolYear}</p>
                    <h3 className="text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none">Grade Slip</h3>
                </div>
                <img src={logoUrl} className="w-10 h-10 object-contain" alt="School" />
            </div>

            {/* Student Info */}
            <div className="mb-1.5 px-1 shrink-0 text-[9px]">
                <div className="flex mb-0.5 items-baseline">
                    <span className="w-10 text-[9px]">Name:</span>
                    <span className={`flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ${nameFontSize}`}>
                        {studentFullName}
                    </span>
                </div>
                <div className="flex gap-4 mb-0.5">
                    <div className="flex flex-1">
                        <span className="w-10">LRN:</span>
                        <span className="flex-1 border-b border-black font-bold pb-0.5 leading-none">{student.lrn}</span>
                    </div>
                    <div className="flex w-20">
                        <span className="w-8">Age:</span>
                        <span className="flex-1 border-b border-black font-bold pb-0.5 leading-none text-center">{student.age || ''}</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-1">
                        <span className="w-15">Grade Level:</span>
                        <span className="flex-1 border-b border-black font-bold leading-none text-center pb-0.5">
                            {section?.section_grade_level?.replace(/Grade/i, '').trim() || ''}
                        </span>
                    </div>
                    <div className="flex flex-1">
                        <span className="w-11.25">Section:</span>
                        <span className="flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5">
                            {section?.section_name || ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="flex-1 min-h-0 mb-1.5 px-1">
                <table className="grade-table">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="subject-col">LEARNING AREAS</th>
                            <th colSpan={3}>TERM</th>
                            <th rowSpan={2} className="final-col leading-tight"><div className="w-min mx-auto">FINAL GRADE</div></th>
                            <th rowSpan={2} className="remarks-col">REMARKS</th>
                        </tr>
                        <tr>
                            <th className="q-col">1</th>
                            <th className="q-col">2</th>
                            <th className="q-col">3</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dedupedSubjects.filter((subj: Subject) => {
                            const norm = normalizeSubjectName(subj.subject_name);
                            if (norm.includes('arabic') || norm.includes('islamic')) {
                                const grades = studentGrades.subjectGrades[subj.id];
                                const hasAnyGrade = grades && (grades.q1 || grades.q2 || grades.q3 || grades.final);
                                if (!hasAnyGrade) return false;
                            }
                            return true;
                        }).map((subj: Subject) => {
                            const grades = studentGrades.subjectGrades[subj.id] || { q1: '', q2: '', q3: '', final: '', remarks: '' };
                            const norm = normalizeSubjectName(subj.subject_name);
                            const isParentMapeh = norm === 'mapeh';
                            const hasParentMapeh = dedupedSubjects.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');
                            const isSubComponent = hasParentMapeh && (
                                norm.includes('music') || 
                                norm.includes('arts') ||
                                norm.includes('physical') ||
                                norm.includes('health')
                            );
                                                   
                            return (
                                <tr key={subj.id}>
                                    <td 
                                        className={`subject-col ${isParentMapeh ? 'font-bold' : ''} ${isSubComponent ? 'italic pl-3' : ''}`}
                                        style={getSubjectFontSizeStyle(subj.subject_name)}
                                    >
                                        {subj.subject_name}
                                    </td>
                                    <td className={`q-col ${isParentMapeh ? 'font-bold' : ''}`}>{grades.q1 || '\u00A0'}</td>
                                    <td className={`q-col ${isParentMapeh ? 'font-bold' : ''}`}>{grades.q2 || '\u00A0'}</td>
                                    <td className={`q-col ${isParentMapeh ? 'font-bold' : ''}`}>{grades.q3 || '\u00A0'}</td>
                                    <td className={`final-col ${isParentMapeh ? 'font-bold' : ''}`}>{grades.final || '\u00A0'}</td>
                                    <td className={`remarks-col text-[6.5px] tracking-tighter uppercase ${isParentMapeh ? 'font-bold' : ''}`}>{grades.remarks || '\u00A0'}</td>
                                </tr>
                            );
                        })}
                        {/* Visual Separator Row */}
                        <tr style={{ height: '2px' }}>
                            <td 
                                colSpan={6} 
                                style={{ 
                                    backgroundColor: 'black', 
                                    height: '2px', 
                                    padding: 0, 
                                    borderLeft: '1px solid black',
                                    borderRight: '1px solid black',
                                    borderTop: '1px solid black',
                                    borderBottom: '1px solid black'
                                }} 
                            />
                        </tr>
                        <tr>
                            <td className="subject-col font-bold text-[10px] text-center pb-1 pt-1">General Average</td>
                            <td className="q-col font-bold">{studentGrades.genT1 || '\u00A0'}</td>
                            <td className="q-col font-bold">{studentGrades.genT2 || '\u00A0'}</td>
                            <td className="q-col font-bold">{studentGrades.genT3 || '\u00A0'}</td>
                            <td className="final-col font-bold">{studentGrades.genAvg || '\u00A0'}</td>
                            <td className="remarks-col text-[6.5px] tracking-tighter uppercase font-bold">{studentGrades.genRemarks || '\u00A0'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer Signatures */}
            <div className="mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center">
                <p className="text-[8px] mb-1 w-full text-center">Prepared by:</p>
                <div className="w-45 mx-auto text-center mt-2.5 relative">
                    {schoolProfile.adviser_signature_url && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-3.5 w-20 h-10 flex items-center justify-center pointer-events-none z-10">
                            <img 
                                src={schoolProfile.adviser_signature_url} 
                                alt="Adviser Signature" 
                                className="max-h-full max-w-full object-contain" 
                            />
                        </div>
                    )}
                    <div className="font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none">
                        {schoolProfile.adviser_name || '_________________________'}
                    </div>
                    <p className="text-[8px] italic mt-0.5">Adviser</p>
                </div>
            </div>
        </div>
    );
}

interface ShsGradeSlipCardProps {
    student: Student;
    schoolProfile: SchoolProfile;
    section: Section | undefined;
    subjects: Subject[];
    records: ClassRecord[];
    activeSchoolYear: string;
}

function isOffTerm(term: Subject['term'] | undefined, q: number) {
    if (term === undefined || term === 'all' || term === 'none' || term === null) return false;
    const termNum = Number(term);
    if (isNaN(termNum)) return false;
    return termNum !== q;
}

function ShsGradeSlipCard({ student, schoolProfile, section, subjects, records, activeSchoolYear }: ShsGradeSlipCardProps) {
    const baseUrl = import.meta.env.BASE_URL;
    const logoUrl = schoolProfile.logo_url || 'school-logo.png';
    const depedLogo = `${baseUrl}deped_logo_left.png`;

    // Deduplicate incoming subjects as safeguard
    const dedupedSubjects = useMemo(() => {
        const seen = new Set<string>();
        const res: Subject[] = [];
        for (const s of subjects) {
            const norm = normalizeSubjectName(s.subject_name);
            if (norm && seen.has(norm)) continue;
            if (norm) seen.add(norm);
            res.push(s);
        }
        return res;
    }, [subjects]);

    const studentGrades = useMemo(() => {
        const rawGrades: Record<string, { q1: number; q2: number; q3: number; final: number; term?: Subject['term'] }> = {};
        const classRecords = useAppStore.getState().classRecords || [];
        const hpsRecords = useAppStore.getState().hpsRecords || [];
        
        dedupedSubjects.forEach((subj) => {
            let q1 = 0, q2 = 0, q3 = 0;
            for (let q = 1; q <= 3; q++) {
                const g = resolveStudentQuarterGrade(
                    student.lrn,
                    subj.id,
                    q,
                    activeSchoolYear,
                    classRecords,
                    records,
                    hpsRecords,
                    section?.section_grade_level,
                    section?.track
                );
                if (g > 0) {
                    if (q === 1) q1 = g;
                    if (q === 2) q2 = g;
                    if (q === 3) q3 = g;
                }
            }
            
            const term = subj.term;
            let final = 0;
            if (term === 1 || Number(term) === 1) {
                final = q1;
            } else if (term === 2 || Number(term) === 2) {
                final = q2;
            } else if (term === 3 || Number(term) === 3) {
                final = q3;
            } else {
                let sum = 0;
                let cnt = 0;
                if (q1 > 0) { sum += q1; cnt++; }
                if (q2 > 0) { sum += q2; cnt++; }
                if (q3 > 0) { sum += q3; cnt++; }
                final = cnt === 3 ? Math.round(sum / 3) : 0;
            }
            
            rawGrades[subj.id] = { q1, q2, q3, final, term };
        });

        const coreSubjectsList = dedupedSubjects.filter(subj => {
            const norm = subj.subject_name.trim().toLowerCase();
            const cores = [
                'effective communication',
                'mabisang komunikasyon',
                'general mathematics',
                'general science',
                'life and career skills',
                'pag-aaral ng kasaysayan at lipunang pilipino',
                'kasaysayan at lipunang pilipino'
            ];
            return cores.some(c => norm.includes(c));
        });

        const commSubjs = coreSubjectsList.filter(s => {
            const n = normalizeSubjectName(s.subject_name);
            return n === 'effectivecommunication' || n === 'mabisangkomunikasyon';
        });

        let parentQ1 = 0, parentQ2 = 0, parentQ3 = 0, parentFinal = 0;
        let parentTerm: Subject['term'] = undefined;

        if (commSubjs.length > 0) {
            const effComm = commSubjs.find(s => normalizeSubjectName(s.subject_name) === 'effectivecommunication');
            const mabKom = commSubjs.find(s => normalizeSubjectName(s.subject_name) === 'mabisangkomunikasyon');
            
            if (effComm && effComm.term) parentTerm = effComm.term;
            else if (mabKom && mabKom.term) parentTerm = mabKom.term;

            const ecGrade = effComm ? rawGrades[effComm.id] : null;
            const mkGrade = mabKom ? rawGrades[mabKom.id] : null;

            const ec1 = ecGrade?.q1 || 0;
            const mk1 = mkGrade?.q1 || 0;
            if (ec1 > 0 && mk1 > 0) parentQ1 = Math.round((ec1 + mk1) / 2);
            else if (ec1 > 0) parentQ1 = ec1;
            else if (mk1 > 0) parentQ1 = mk1;

            const ec2 = ecGrade?.q2 || 0;
            const mk2 = mkGrade?.q2 || 0;
            if (ec2 > 0 && mk2 > 0) parentQ2 = Math.round((ec2 + mk2) / 2);
            else if (ec2 > 0) parentQ2 = ec2;
            else if (mk2 > 0) parentQ2 = mk2;

            const ec3 = ecGrade?.q3 || 0;
            const mk3 = mkGrade?.q3 || 0;
            if (ec3 > 0 && mk3 > 0) parentQ3 = Math.round((ec3 + mk3) / 2);
            else if (ec3 > 0) parentQ3 = ec3;
            else if (mk3 > 0) parentQ3 = mk3;

            if (parentTerm === 1 || Number(parentTerm) === 1) {
                parentFinal = parentQ1;
            } else if (parentTerm === 2 || Number(parentTerm) === 2) {
                parentFinal = parentQ2;
            } else if (parentTerm === 3 || Number(parentTerm) === 3) {
                parentFinal = parentQ3;
            } else {
                let sum = 0;
                let cnt = 0;
                if (parentQ1 > 0) { sum += parentQ1; cnt++; }
                if (parentQ2 > 0) { sum += parentQ2; cnt++; }
                if (parentQ3 > 0) { sum += parentQ3; cnt++; }
                parentFinal = cnt === 3 ? Math.round(sum / 3) : 0;
            }
        }

        let genAvgQ1Total = 0, genAvgQ1Units = 0;
        let genAvgQ2Total = 0, genAvgQ2Units = 0;
        let genAvgQ3Total = 0, genAvgQ3Units = 0;
        let genAvgFinalTotal = 0, genAvgFinalUnits = 0;

        let expectedYearUnits = 0;
        let expectedT1Units = 0;
        let expectedT2Units = 0;
        let expectedT3Units = 0;

        const isComponentId = (id: string) => {
            const subj = dedupedSubjects.find(s => s.id === id);
            if (!subj) return false;
            const norm = normalizeSubjectName(subj.subject_name);
            return norm === 'effectivecommunication' || norm === 'mabisangkomunikasyon';
        };

        const gradeLevel = section?.section_grade_level || 'Grade 11';

        dedupedSubjects.forEach((subj) => {
            if (isComponentId(subj.id)) return;

            const rg = rawGrades[subj.id];
            const unitInfo = getShsSubjectUnitInfo(subj.subject_name, gradeLevel);
            const termUnits = unitInfo.unitsPerTerm;
            const yearUnits = unitInfo.yearUnits;
            
            expectedYearUnits += yearUnits;
            if (!isOffTerm(rg.term, 1)) expectedT1Units += termUnits;
            if (!isOffTerm(rg.term, 2)) expectedT2Units += termUnits;
            if (!isOffTerm(rg.term, 3)) expectedT3Units += termUnits;

            if (rg.q1 > 0 && !isOffTerm(rg.term, 1)) {
                genAvgQ1Total += rg.q1 * termUnits;
                genAvgQ1Units += termUnits;
            }
            if (rg.q2 > 0 && !isOffTerm(rg.term, 2)) {
                genAvgQ2Total += rg.q2 * termUnits;
                genAvgQ2Units += termUnits;
            }
            if (rg.q3 > 0 && !isOffTerm(rg.term, 3)) {
                genAvgQ3Total += rg.q3 * termUnits;
                genAvgQ3Units += termUnits;
            }
            if (rg.final > 0) {
                genAvgFinalTotal += rg.final * yearUnits;
                genAvgFinalUnits += yearUnits;
            }
        });

        if (commSubjs.length > 0) {
            const ecUnitInfo = getShsSubjectUnitInfo('Effective Communication', gradeLevel);
            const ecTermUnits = ecUnitInfo.unitsPerTerm;
            const ecYearUnits = ecUnitInfo.yearUnits;

            expectedYearUnits += ecYearUnits;
            if (!isOffTerm(parentTerm, 1)) expectedT1Units += ecTermUnits;
            if (!isOffTerm(parentTerm, 2)) expectedT2Units += ecTermUnits;
            if (!isOffTerm(parentTerm, 3)) expectedT3Units += ecTermUnits;

            if (parentQ1 > 0 && !isOffTerm(parentTerm, 1)) {
                genAvgQ1Total += parentQ1 * ecTermUnits;
                genAvgQ1Units += ecTermUnits;
            }
            if (parentQ2 > 0 && !isOffTerm(parentTerm, 2)) {
                genAvgQ2Total += parentQ2 * ecTermUnits;
                genAvgQ2Units += ecTermUnits;
            }
            if (parentQ3 > 0 && !isOffTerm(parentTerm, 3)) {
                genAvgQ3Total += parentQ3 * ecTermUnits;
                genAvgQ3Units += ecTermUnits;
            }
            if (parentFinal > 0) {
                genAvgFinalTotal += parentFinal * ecYearUnits;
                genAvgFinalUnits += ecYearUnits;
            }
        }

        const areAll3TermsCompleteShs = 
            expectedT1Units > 0 && genAvgQ1Units >= expectedT1Units &&
            expectedT2Units > 0 && genAvgQ2Units >= expectedT2Units &&
            expectedT3Units > 0 && genAvgQ3Units >= expectedT3Units &&
            expectedYearUnits > 0 && genAvgFinalUnits >= expectedYearUnits;

        const gradesLookup: Record<string, { q1: string; q2: string; q3: string; final: string; remarks: string; term?: Subject['term'] }> = {};
        
        gradesLookup['parent_ec_mk'] = {
            q1: parentQ1 > 0 ? parentQ1.toString() : '',
            q2: parentQ2 > 0 ? parentQ2.toString() : '',
            q3: parentQ3 > 0 ? parentQ3.toString() : '',
            final: areAll3TermsCompleteShs && parentFinal > 0 ? parentFinal.toString() : '',
            remarks: areAll3TermsCompleteShs && parentFinal > 0 ? (parentFinal >= 75 ? 'Passed' : 'Failed') : '',
            term: parentTerm
        };

        dedupedSubjects.forEach((subj) => {
            const rg = rawGrades[subj.id];
            gradesLookup[subj.id] = {
                q1: rg.q1 > 0 ? rg.q1.toString() : '',
                q2: rg.q2 > 0 ? rg.q2.toString() : '',
                q3: rg.q3 > 0 ? rg.q3.toString() : '',
                final: areAll3TermsCompleteShs && rg.final > 0 ? rg.final.toString() : '',
                remarks: areAll3TermsCompleteShs && rg.final > 0 ? (rg.final >= 75 ? 'Passed' : 'Failed') : '',
                term: rg.term
            };
        });

        const genT1 = areAll3TermsCompleteShs && genAvgQ1Units > 0 ? Math.round(genAvgQ1Total / genAvgQ1Units).toString() : '';
        const genT2 = areAll3TermsCompleteShs && genAvgQ2Units > 0 ? Math.round(genAvgQ2Total / genAvgQ2Units).toString() : '';
        const genT3 = areAll3TermsCompleteShs && genAvgQ3Units > 0 ? Math.round(genAvgQ3Total / genAvgQ3Units).toString() : '';
        const genAvg = areAll3TermsCompleteShs && genAvgFinalUnits > 0 ? Math.round(genAvgFinalTotal / genAvgFinalUnits).toString() : '';
        const genRemarks = areAll3TermsCompleteShs && genAvg ? (Number(genAvg) >= 75 ? 'Passed' : 'Failed') : '';

        return { subjectGrades: gradesLookup, genAvg, genRemarks, genT1, genT2, genT3 };
    }, [dedupedSubjects, records, student.lrn, activeSchoolYear, section?.section_grade_level, section?.track]);

    const studentFullName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''}`.trim();
    
    const nameFontSize = useMemo(() => {
        if (studentFullName.length > 35) return 'text-[7.5px] leading-tight';
        if (studentFullName.length > 25) return 'text-[8.2px] leading-tight';
        return 'text-[9px]';
    }, [studentFullName]);

    const getSubjectFontSizeStyle = (name: string, isComponent?: boolean) => {
        const len = name.length;
        if (len === 0) return { fontSize: '10px' };

        const usableWidth = isComponent ? 158 : 170;
        const charWidthRatio = 0.54;
        const calculatedSize = usableWidth / (len * charWidthRatio);
        const finalSize = Math.max(7.5, Math.min(10, calculatedSize));
        
        return {
            fontSize: `${finalSize.toFixed(2)}px`,
            lineHeight: finalSize < 8.5 ? '1' : '1.1'
        };
    };

    const sortedRows = useMemo(() => {
        const coreSubjectsList: Subject[] = [];
        const electiveSubjectsList: Subject[] = [];

        dedupedSubjects.forEach((subj) => {
            const norm = subj.subject_name.trim().toLowerCase();
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
                coreSubjectsList.push(subj);
            } else {
                electiveSubjectsList.push(subj);
            }
        });

        const commSubjs = coreSubjectsList.filter(s => {
            const n = normalizeSubjectName(s.subject_name);
            return n === 'effectivecommunication' || n === 'mabisangkomunikasyon';
        });

        const otherCores = coreSubjectsList.filter(s => {
            const n = normalizeSubjectName(s.subject_name);
            return n !== 'effectivecommunication' && n !== 'mabisangkomunikasyon';
        });

        const sortedOtherCores = sortSubjects(otherCores, s => s.subject_name);
        const sortedElectives = sortSubjects(electiveSubjectsList, s => s.subject_name);

        type ShsSubjectItem = 
            | { type: 'header'; name: string }
            | { type: 'parent'; name: string; id: string; term?: Subject['term'] }
            | { type: 'subject'; name: string; id: string; isComponent?: boolean; term?: Subject['term'] };

        const finalRows: ShsSubjectItem[] = [];

        const finalCores: ShsSubjectItem[] = [];
        if (commSubjs.length > 0) {
            const effComm = commSubjs.find(s => normalizeSubjectName(s.subject_name) === 'effectivecommunication');
            const mabKom = commSubjs.find(s => normalizeSubjectName(s.subject_name) === 'mabisangkomunikasyon');
            const parentTerm = effComm?.term || mabKom?.term;

            finalCores.push({
                type: 'parent',
                name: 'Effective Communication & Mabisang Komunikasyon',
                id: 'parent_ec_mk',
                term: parentTerm
            });

            if (effComm) {
                finalCores.push({
                    type: 'subject',
                    name: effComm.subject_name,
                    id: effComm.id,
                    isComponent: true,
                    term: effComm.term
                });
            }
            if (mabKom) {
                finalCores.push({
                    type: 'subject',
                    name: mabKom.subject_name,
                    id: mabKom.id,
                    isComponent: true,
                    term: mabKom.term
                });
            }
        }

        sortedOtherCores.forEach(s => {
            finalCores.push({
                type: 'subject',
                name: s.subject_name,
                id: s.id,
                term: s.term
            });
        });

        if (finalCores.length > 0) {
            finalRows.push({ type: 'header', name: 'Core Subjects' });
            finalRows.push(...finalCores);
        }

        if (sortedElectives.length > 0) {
            finalRows.push({ type: 'header', name: 'Electives' });
            sortedElectives.forEach(s => {
                finalRows.push({
                    type: 'subject',
                    name: s.subject_name,
                    id: s.id,
                    term: s.term
                });
            });
        }

        return finalRows;
    }, [dedupedSubjects]);

    return (
        <div className="grade-slip-card font-serif text-[9px] relative text-black leading-tight">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-1.5 px-1 shrink-0">
                <img src={depedLogo} className="w-10 h-10 object-contain" alt="DepEd" />
                <div className="text-center font-bold leading-none">
                    <p className="uppercase text-[9px]">{schoolProfile.name}</p>
                    <p className="uppercase text-[9px] font-normal tracking-wide mt-0.5">SCHOOL YEAR: {activeSchoolYear}</p>
                    <h3 className="text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none">Grade Slip</h3>
                </div>
                <img src={logoUrl} className="w-10 h-10 object-contain" alt="School" />
            </div>

            {/* Student Info */}
            <div className="mb-1.5 px-1 shrink-0 text-[9px]">
                <div className="flex mb-0.5 items-baseline">
                    <span className="w-10 text-[9px]">Name:</span>
                    <span className={`flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ${nameFontSize}`}>
                        {studentFullName}
                    </span>
                </div>
                <div className="flex gap-4 mb-0.5">
                    <div className="flex flex-1">
                        <span className="w-10">LRN:</span>
                        <span className="flex-1 border-b border-black font-bold pb-0.5 leading-none">{student.lrn}</span>
                    </div>
                    <div className="flex w-20">
                        <span className="w-8">Age:</span>
                        <span className="flex-1 border-b border-black font-bold pb-0.5 leading-none text-center">{student.age || ''}</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-1">
                        <span className="w-15 shrink-0">Grade Level:</span>
                        <span className="flex-1 border-b border-black font-bold leading-none text-center pb-0.5">
                            {section?.section_grade_level?.replace(/Grade/i, '').trim() || ''}
                        </span>
                    </div>
                    <div className="flex flex-1">
                        <span className="w-10 shrink-0">Section:</span>
                        <span className="flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5">
                            {section?.section_name || ''}
                        </span>
                    </div>
                    <div className="flex flex-[1.2]">
                        <span className="w-10 shrink-0">Track:</span>
                        <span className="flex-1 border-b border-black font-bold leading-none pb-0.5 uppercase text-center">
                            {student.track || section?.track || ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="flex-1 min-h-0 mb-1.5 px-1">
                <table className="grade-table">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="subject-col">LEARNING AREAS</th>
                            <th colSpan={3}>TERM</th>
                            <th rowSpan={2} className="final-col leading-tight"><div className="w-min mx-auto">FINAL GRADE</div></th>
                            <th rowSpan={2} className="remarks-col">REMARKS</th>
                        </tr>
                        <tr>
                            <th className="q-col">1</th>
                            <th className="q-col">2</th>
                            <th className="q-col">3</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, idx) => {
                            if (row.type === 'header') {
                                return (
                                    <tr key={`header-${idx}`}>
                                        <td 
                                            colSpan={6} 
                                            style={{ 
                                                backgroundColor: '#E5E7EB', 
                                                fontWeight: 'bold', 
                                                textAlign: 'left', 
                                                padding: '2px 4px',
                                                fontSize: '8px',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {row.name}
                                        </td>
                                    </tr>
                                );
                            }

                            const isParent = row.type === 'parent';
                            const id = isParent ? 'parent_ec_mk' : row.id;
                            const grades = studentGrades.subjectGrades[id] || { q1: '', q2: '', q3: '', final: '', remarks: '', term: undefined };
                            const isComponent = !isParent && row.isComponent;

                            return (
                                <tr key={`${row.type}-${id}-${idx}`}>
                                    <td 
                                        className={`subject-col ${isComponent ? 'pl-3 font-normal' : 'font-bold'}`}
                                        style={{
                                            ...getSubjectFontSizeStyle(row.name, isComponent),
                                            fontWeight: isComponent ? 'normal' : 'bold'
                                        }}
                                    >
                                        {row.name}
                                    </td>
                                    {[1, 2, 3].map(q => {
                                        const offTerm = isOffTerm(row.term, q);
                                        if (offTerm) {
                                            return (
                                                <td key={q} className="q-col" style={{ backgroundColor: '#E5E7EB' }}>
                                                    {'\u00A0'}
                                                </td>
                                            );
                                        }
                                        const qVal = q === 1 ? grades.q1 : q === 2 ? grades.q2 : grades.q3;
                                        return (
                                            <td key={q} className="q-col">
                                                {qVal || '\u00A0'}
                                            </td>
                                        );
                                    })}
                                    <td className="final-col">{grades.final || '\u00A0'}</td>
                                    <td className="remarks-col text-[6.5px] tracking-tighter uppercase">{grades.remarks || '\u00A0'}</td>
                                </tr>
                            );
                        })}
                        {/* Visual Separator Row */}
                        <tr style={{ height: '2px' }}>
                            <td 
                                colSpan={6} 
                                style={{ 
                                    backgroundColor: 'black', 
                                    height: '2px', 
                                    padding: 0, 
                                    borderLeft: '1px solid black',
                                    borderRight: '1px solid black',
                                    borderTop: '1px solid black',
                                    borderBottom: '1px solid black'
                                }} 
                            />
                        </tr>
                        <tr>
                            <td className="subject-col font-bold text-[10px] text-center pb-1 pt-1">General Average</td>
                            <td className="q-col font-bold">{studentGrades.genT1 || '\u00A0'}</td>
                            <td className="q-col font-bold">{studentGrades.genT2 || '\u00A0'}</td>
                            <td className="q-col font-bold">{studentGrades.genT3 || '\u00A0'}</td>
                            <td className="final-col font-bold">{studentGrades.genAvg || '\u00A0'}</td>
                            <td className="remarks-col text-[6.5px] tracking-tighter uppercase font-bold">{studentGrades.genRemarks || '\u00A0'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer Signatures */}
            <div className="mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center">
                <p className="text-[8px] mb-1 w-full text-center">Prepared by:</p>
                <div className="w-45 mx-auto text-center mt-2.5 relative">
                    {schoolProfile.adviser_signature_url && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-3.5 w-20 h-10 flex items-center justify-center pointer-events-none z-10">
                            <img 
                                src={schoolProfile.adviser_signature_url} 
                                alt="Adviser Signature" 
                                className="max-h-full max-w-full object-contain" 
                            />
                        </div>
                    )}
                    <div className="font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none">
                        {schoolProfile.adviser_name || '_________________________'}
                    </div>
                    <p className="text-[8px] italic mt-0.5">Adviser</p>
                </div>
            </div>
        </div>
    );
}

