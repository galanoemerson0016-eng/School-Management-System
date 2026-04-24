import { useState, useMemo, Fragment, useEffect } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { Printer, ArrowLeft, ChevronDown, Download, Lock, Unlock, RefreshCcw, Trash2 } from 'lucide-react';
import { filterSF9Sections } from '../lib/rbac';
import { getSubjectCluster, getWeights, transmuteGrade } from '../lib/grading';
import type { Subject, ClassRecord, HPSRecord, Student } from '../types';

type QuarterGrades = {
    q1?: QuarterGradeCell;
    q2?: QuarterGradeCell;
    q3?: QuarterGradeCell;
    q4?: QuarterGradeCell;
    final?: number;
};

type QuarterKey = 'q1' | 'q2' | 'q3' | 'q4';

type QuarterGradeDetail = {
    value: number;
    musicArts?: number | null;
    peHealth?: number | null;
};

type QuarterGradeCell = number | QuarterGradeDetail;

type StudentGradeRow = Record<string, QuarterGrades> & {
    generalAverage?: string;
    termAverage?: string;
};

type GradesData = Record<string, StudentGradeRow>;

type VirtualSectionSubject = Subject & { 
    _mapehGroups?: { 
        musicArts: Subject[], 
        peHealth: Subject[] 
    } 
};

const isQuarterGradeDetail = (value: QuarterGradeCell | undefined): value is QuarterGradeDetail => {
    return typeof value === 'object' && value !== null;
};

const getQuarterGradeValue = (value: QuarterGradeCell | undefined) => {
    return isQuarterGradeDetail(value) ? value.value : value;
};

const getQuarterGradeDetail = (value: QuarterGradeCell | undefined) => {
    return isQuarterGradeDetail(value) ? value : undefined;
};

const SUBJECT_COLUMN_WIDTH = 55;
const MAPEH_SUBCOLUMN_WIDTH = 64;
const GENERAL_AVERAGE_COLUMN_WIDTH = 66;
const AVERAGE_COLUMN_WIDTH = GENERAL_AVERAGE_COLUMN_WIDTH;
const showLegacyQuarter4 = false;

const GradeInput = ({ 
    studentLrn, subjectId, quarter, value, className, activeSchoolYear, 
    subjects, sectionObj, updateGradingSheetRecord, row, col
}: any) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    const handleBlur = async () => {
        if (localValue === value) return;

        setIsSaving(true);
        try {
            const recordId = `${studentLrn}_${subjectId}_${quarter}_${activeSchoolYear}`;
            const subject = subjects.find((s: any) => s.id === subjectId);
            const section = sectionObj;

            if (!subject || !section) {
                console.error("Subject or Section not found for grading record");
                return;
            }

            await updateGradingSheetRecord({
                id: recordId,
                student_lrn: studentLrn,
                subject_id: subjectId,
                section_id: section.id,
                quarter: quarter as 1 | 2 | 3 | 4,
                school_year: activeSchoolYear,
                final_grade: localValue || 0,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0
            });
        } catch (error) {
            console.error("Failed to update grading record", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
            return;
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();

            const row = parseInt((e.target as HTMLElement).getAttribute('data-row') || '0');
            const col = parseInt((e.target as HTMLElement).getAttribute('data-col') || '0');
            
            let targetRow = row;
            let targetCol = col;

            if (e.key === 'ArrowLeft') targetCol = col - 1;
            else if (e.key === 'ArrowRight') targetCol = col + 1;
            else if (e.key === 'ArrowUp') targetRow = row - 1;
            else if (e.key === 'ArrowDown') targetRow = row + 1;

            const target = document.querySelector(`.consolidated-grades-table .grade-input-field[data-row="${targetRow}"][data-col="${targetCol}"]`) as HTMLInputElement;
            
            if (target) {
                target.focus();
                target.select();
            }
        }
    };

    return (
        <div className="relative w-full h-full group">
            <input
                type="number"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                data-row={row}
                data-col={col}
                className={`grade-input-field w-full h-full bg-transparent text-center focus:bg-blue-50 focus:outline-none transition-colors border-none p-0 hide-number-arrows text-[11px] font-medium ${isSaving ? 'opacity-50' : ''} ${className || ''}`}
                style={{ appearance: 'none', MozAppearance: 'textfield' }}
            />
            {/* Subtle hover indicator */}
            <div className="absolute inset-0 border border-transparent group-hover:border-blue-200 pointer-events-none transition-colors"></div>
            {isSaving && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                </div>
            )}
        </div>
    );
};

export function ConsolidatedGradesPage() {
    const {
        sections, subjects, students, gradingSheetRecords, updateGradingSheetRecord,
        activeSchoolYear, schoolProfile, setCurrentView,
        selectedSection, setSelectedSection, classRecords
    } = useAppStore();
    const { user } = useAuthStore();

    const [selectedTerm, setSelectedTerm] = useState<'q1' | 'q2' | 'q3' | 'all'>('q1');
    const [isSyncing, setIsSyncing] = useState(false);

    // Derived State
    const sectionObj = useMemo(() => sections.find(s => s.section_name === selectedSection), [sections, selectedSection]);

    // Filter Sections for Select & Sort by Grade Level -> Name
    const availableSections = useMemo(() => {
        const filtered = filterSF9Sections(user, sections);
        return filtered.sort((a, b) => {
            const getGrade = (g: string) => {
                const match = g.match(/\d+/);
                return match ? parseInt(match[0], 10) : 999;
            };
            const gradeA = getGrade(a.section_grade_level);
            const gradeB = getGrade(b.section_grade_level);

            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user]);

    const TERM_LABELS = {
        q1: 'First Term',
        q2: 'Second Term',
        q3: 'Third Term',
        all: 'Final & General Average'
    };

    // Update selectedSection if it's no longer available
    useEffect(() => {
        if (selectedSection && availableSections.length > 0) {
            const exists = availableSections.some(s => s.section_name === selectedSection);
            if (!exists) {
                const advisory = availableSections.find(s => s.is_advisory);
                setSelectedSection(advisory ? advisory.section_name : availableSections[0].section_name);
            }
        } else if (!selectedSection && availableSections.length > 0) {
            const advisory = availableSections.find(s => s.is_advisory);
            setSelectedSection(advisory ? advisory.section_name : availableSections[0].section_name);
        }
    }, [availableSections, selectedSection, setSelectedSection]);

    // SECTION SUBJECTS
    const sectionSubjects = useMemo(() => {
        if (!sectionObj) return [];

        const ORDER = [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan',
            'Values Education',
            'Edukasyon sa Pagpapakatao',
            'Technology and Livelihood Education',
            'MAPEH'
        ];

        const isMusicArts = (name: string) => {
            const n = name.trim().toLowerCase();
            return n === 'arts' || n === 'music' || n === 'music and arts';
        };
        const isPEHealth = (name: string) => {
            const n = name.trim().toLowerCase();
            return n === 'health' || n === 'physical education' || n === 'pe' || n === 'physical education and health';
        };
        const isMapeh = (name: string) => {
            return name.trim().toUpperCase() === 'MAPEH';
        };

        const rawSubjects = subjects.filter(s => s.section_id === sectionObj.id);
        const sectionGradeLevel = sectionObj.section_grade_level;

        const standardSubjectNames = (sectionGradeLevel.includes('7') || sectionGradeLevel.includes('8') || sectionGradeLevel.includes('9') || sectionGradeLevel.includes('10'))
            ? ORDER.filter(name => name !== 'Edukasyon sa Pagpapakatao')
            : [];

        const normalizeName = (name: string) => {
            return name.trim()
                .toLowerCase()
                .replace(/\s*\(.*?\)\s*/g, '')
                .trim();
        };

        const displaySubjectsMap = new Map<string, VirtualSectionSubject>();

        rawSubjects.forEach(s => {
            if (!isMusicArts(s.subject_name) && !isPEHealth(s.subject_name) && !isMapeh(s.subject_name)) {
                const normalized = normalizeName(s.subject_name);
                if (!displaySubjectsMap.has(normalized)) {
                    displaySubjectsMap.set(normalized, s as VirtualSectionSubject);
                }
            }
        });

        if (standardSubjectNames.length > 0) {
            standardSubjectNames.forEach(name => {
                const normalized = normalizeName(name);
                if (!displaySubjectsMap.has(normalized) && !isMapeh(name)) {
                    displaySubjectsMap.set(normalized, {
                        id: `virtual-${normalized}-${sectionObj.id}`,
                        subject_name: name,
                        section_id: sectionObj.id,
                        grade_level: sectionGradeLevel,
                        is_virtual: true
                    } as any);
                }
            });
        }

        const musicArtsComponents = rawSubjects.filter(s => isMusicArts(s.subject_name) && !isMapeh(s.subject_name));
        const peHealthComponents = rawSubjects.filter(s => isPEHealth(s.subject_name) && !isMapeh(s.subject_name));
        const hasMapehSubject = rawSubjects.find(s => isMapeh(s.subject_name));

        const finalSubjects: VirtualSectionSubject[] = Array.from(displaySubjectsMap.values());

        if (hasMapehSubject) {
            const mapehSubject = { ...hasMapehSubject } as VirtualSectionSubject;
            mapehSubject._mapehGroups = {
                musicArts: musicArtsComponents,
                peHealth: peHealthComponents
            };
            finalSubjects.push(mapehSubject);
        } else if (musicArtsComponents.length > 0 || peHealthComponents.length > 0 || standardSubjectNames.some(n => isMapeh(n))) {
            finalSubjects.push({
                id: `virtual-mapeh-${sectionObj.id}`,
                subject_name: 'MAPEH',
                section_id: sectionObj.id,
                grade_level: sectionGradeLevel,
                is_virtual: true,
                _mapehGroups: {
                    musicArts: musicArtsComponents,
                    peHealth: peHealthComponents
                }
            } as any);
        }

        return finalSubjects.sort((a, b) => {
            const indexA = ORDER.findIndex(o => a.subject_name.trim().toLowerCase().includes(o.toLowerCase()));
            const indexB = ORDER.findIndex(o => b.subject_name.trim().toLowerCase().includes(o.toLowerCase()));

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            return a.subject_name.localeCompare(b.subject_name);
        });
    }, [subjects, sectionObj]);

    const selectableSubjects = useMemo(() => {
        return sectionSubjects.filter((subject) => subject.subject_name.toUpperCase() !== 'MAPEH');
    }, [sectionSubjects]);

    const [subjectColumnSelections, setSubjectColumnSelections] = useState<Record<string, string>>({});

    useEffect(() => {
        setSubjectColumnSelections((prev) => {
            const next: Record<string, string> = {};

            sectionSubjects.forEach((subject) => {
                if (subject.subject_name.toUpperCase() === 'MAPEH') return;

                const preservedSelection = prev[subject.id];
                const exists = selectableSubjects.some((option) => option.id === preservedSelection);
                next[subject.id] = exists ? preservedSelection : subject.id;
            });

            return next;
        });
    }, [sectionSubjects, selectableSubjects]);

    const subjectColumns = useMemo(() => {
        return sectionSubjects.map((baseSubject) => {
            if (baseSubject.subject_name.toUpperCase() === 'MAPEH') {
                return { baseId: baseSubject.id, subject: baseSubject };
            }

            const selectedId = subjectColumnSelections[baseSubject.id] || baseSubject.id;
            const selectedSubject = selectableSubjects.find((option) => option.id === selectedId) || baseSubject;
            return { baseId: baseSubject.id, subject: selectedSubject };
        });
    }, [sectionSubjects, selectableSubjects, subjectColumnSelections]);

    // SECTION STUDENTS
    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        return students.filter(s => s.student_section === selectedSection || (sectionObj?.id && s.student_section === sectionObj.id));
    }, [students, selectedSection, sectionObj?.id]);

    const formatLearnerName = (student: (typeof students)[number]) => {
        const middleInitial = student.middle_name ? `${student.middle_name.charAt(0)}.` : '';
        return `${student.last_name}, ${student.first_name} ${middleInitial}`.trim().replace(/\s+/g, ' ').toUpperCase();
    };

    const learnerNameColumnWidth = useMemo(() => {
        const longestName = sectionStudents.reduce((longest, student) => {
            const currentName = formatLearnerName(student);
            return currentName.length > longest.length ? currentName : longest;
        }, '');

        const estimatedWidth = longestName.length > 0
            ? Math.ceil(longestName.length * 7.2 + 34)
            : 220;

        return Math.max(220, Math.min(estimatedWidth, 340));
    }, [sectionStudents]);

    const subjectColumnWidth = useMemo(() => {
        if (selectedTerm === 'all') return 28;

        const subjectLabels = sectionSubjects.flatMap((sub) => {
            if (sub.subject_name.toUpperCase() === 'MAPEH') {
                return ['Music and Arts', 'Physical Education and Health'];
            }

            return [sub.subject_name];
        });

        const longestLabel = subjectLabels.reduce((longest, label) => {
            return label.length > longest.length ? label : longest;
        }, '');

        const estimatedWidth = longestLabel.length > 0
            ? Math.ceil(longestLabel.length * 2.2 + 14)
            : SUBJECT_COLUMN_WIDTH;

        return Math.max(60, Math.min(96, estimatedWidth));
    }, [sectionSubjects, selectedTerm]);

    const maleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Male').sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);
    const femaleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Female').sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);

    // GRADES COMPUTATION
    const gradesData = useMemo(() => {
        const data: GradesData = {};

        sectionStudents.forEach(student => {
            const studentData: StudentGradeRow = {};
            let totalFinal = 0;
            let subjectCount = 0;

            sectionSubjects.forEach(subject => {
                if (subject._mapehGroups) {
                    const subjectGrades: any = {};
                    let virtualFinalTotal = 0;
                    let virtualQCount = 0;

                    for (let q = 1; q <= 4; q++) {
                        const qKey = `q${q}` as QuarterKey;
                        const musicArtsResults: number[] = [];
                        const peHealthResults: number[] = [];

                        subject._mapehGroups.musicArts.forEach(comp => {
                            const r = gradingSheetRecords.find(rec => rec.student_lrn === student.lrn && rec.subject_id === comp.id && Number(rec.quarter) === q);
                            if (r && r.final_grade && Number(r.final_grade) > 0) {
                                musicArtsResults.push(Number(r.final_grade));
                            }
                        });

                        subject._mapehGroups.peHealth.forEach(comp => {
                            const r = gradingSheetRecords.find(rec => rec.student_lrn === student.lrn && rec.subject_id === comp.id && Number(rec.quarter) === q);
                            if (r && r.final_grade && Number(r.final_grade) > 0) {
                                peHealthResults.push(Number(r.final_grade));
                            }
                        });

                        if (musicArtsResults.length > 0 || peHealthResults.length > 0) {
                            const maAvg = musicArtsResults.length > 0 ? Math.round(musicArtsResults.reduce((a, b) => a + b, 0) / musicArtsResults.length) : null;
                            const phAvg = peHealthResults.length > 0 ? Math.round(peHealthResults.reduce((a, b) => a + b, 0) / peHealthResults.length) : null;
                            
                            const ma = maAvg || 0;
                            const ph = phAvg || 0;
                            const qAvg = (ma > 0 || ph > 0) ? Math.round((ma + ph) / 2) : null;

                            subjectGrades[qKey] = {
                                value: qAvg,
                                musicArts: maAvg,
                                peHealth: phAvg
                            };

                            if (q <= 3 && qAvg !== null) {
                                virtualFinalTotal += qAvg;
                                virtualQCount++;
                            }
                        }
                    }

                    if (virtualQCount > 0) {
                        const finalRating = Math.round(virtualFinalTotal / virtualQCount);
                        subjectGrades.final = finalRating;
                        studentData[subject.id] = subjectGrades;
                        totalFinal += finalRating;
                        subjectCount++;
                    } else {
                        studentData[subject.id] = {};
                    }
                } else {
                    const subjectGrades: QuarterGrades = {};
                    let subjectFinalTotal = 0;
                    let qCount = 0;

                    for (let q = 1; q <= 4; q++) {
                        const record = gradingSheetRecords.find(r =>
                            r.student_lrn === student.lrn &&
                            r.subject_id === subject.id &&
                            Number(r.quarter) === q
                        );

                        if (record && record.final_grade && Number(record.final_grade) > 0) {
                            const qKey = `q${q}` as QuarterKey;
                            subjectGrades[qKey] = Number(record.final_grade);
                            if (q <= 3) {
                                subjectFinalTotal += Number(record.final_grade);
                                qCount++;
                            }
                        }
                    }

                    if (qCount > 0) {
                        const finalRating = Math.round(subjectFinalTotal / qCount);
                        subjectGrades.final = finalRating;
                        studentData[subject.id] = subjectGrades;

                        totalFinal += finalRating;
                        subjectCount++;
                    } else {
                        studentData[subject.id] = {};
                    }
                }
            });

            // General Average & Term Average
            const getQuarterGradeValue = (gradeData: any): number | null => {
                if (typeof gradeData === 'number') return gradeData;
                if (gradeData && typeof gradeData === 'object' && 'value' in gradeData) return gradeData.value;
                return null;
            };

            if (subjectCount > 0) {
                const genAvg = totalFinal / subjectCount;
                studentData.generalAverage = String(Math.round(genAvg));
            } else {
                studentData.generalAverage = '';
            }

            // Calculate average for the selected term using visible subject columns
            const activeTerm = selectedTerm === 'all' ? null : selectedTerm;
            if (activeTerm) {
                let termTotal = 0;
                let termSubjectCount = 0;

                subjectColumns.forEach(({ subject }) => {
                    const sData = studentData[subject.id];
                    if (sData) {
                        const val = getQuarterGradeValue(sData[activeTerm as QuarterKey]);
                        if (val !== null && val > 0) {
                            termTotal += val;
                            termSubjectCount++;
                        }
                    }
                });
                if (termSubjectCount > 0) {
                    const computedTermAverage = String(Math.round(termTotal / termSubjectCount));
                    studentData.termAverage = computedTermAverage;
                    // In term-specific reports, General Average should reflect the same selected-term basis.
                    studentData.generalAverage = computedTermAverage;
                } else {
                    studentData.termAverage = '';
                    studentData.generalAverage = '';
                }
            }

            data[student.lrn] = studentData;
        });

        return data;
    }, [sectionStudents, sectionSubjects, subjectColumns, gradingSheetRecords, selectedTerm]);

    const showGenAvg = selectedTerm !== 'all';

    const getSubjectHeaderStyle = (sub: VirtualSectionSubject) => {
        if (showGenAvg && sub.subject_name.toUpperCase() === 'MAPEH') {
            const width = 3 * MAPEH_SUBCOLUMN_WIDTH;
            return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
        }

        const width = termColSpan(sub) * subjectColumnWidth;
        return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
    };
    
    const termColSpan = (sub: VirtualSectionSubject) => {
        if (selectedTerm === 'all') return 4;
        if (sub.subject_name.toUpperCase() === 'MAPEH') return 3;
        return 1;
    };

    const totalColumns = 1 + subjectColumns.reduce((acc, col) => acc + termColSpan(col.subject), 0) + (showGenAvg ? 2 : 0);
    
    const tableMinWidth = useMemo(() => {
        const nameColWidth = learnerNameColumnWidth;
        const avgColsWidth = showGenAvg ? (AVERAGE_COLUMN_WIDTH + GENERAL_AVERAGE_COLUMN_WIDTH) : 0;
        const subjectCols = subjectColumns.reduce((acc, col) => acc + termColSpan(col.subject), 0);
        const subjectColWidth = subjectColumnWidth;
        
        const estimatedWidth = (subjectCols * subjectColWidth) + nameColWidth + avgColsWidth;
        return Math.max(selectedTerm === 'all' ? 1200 : 900, estimatedWidth);
    }, [subjectColumns, selectedTerm, showGenAvg, learnerNameColumnWidth, subjectColumnWidth]);

    const handlePrintConsolidated = () => {
        const sectionName = sectionObj?.section_name || 'Record';
        const originalTitle = document.title;
        document.title = `ConsolidatedGrades_${schoolProfile.name || 'School'}_${sectionName}_${activeSchoolYear}`;
        window.print();
        document.title = originalTitle;
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <style>{`
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                    appearance: textfield;
                }

                @media print {
                    @page { size: ${selectedTerm === 'all' ? 'folio landscape' : 'legal landscape'}; margin: 6mm; }
                    #printable-consolidated-grades { width: auto !important; min-width: fit-content !important; margin: 0 !important; }
                    .no-print { display: none !important; }
                }
            `}</style>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setCurrentView('reports')} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-deped-blue" />
                        </button>
                        <h2 className="text-xl md:text-2xl font-bold text-deped-blue whitespace-nowrap">
                            Grade Management
                        </h2>
                    </div>

                    <div className="h-8 w-px bg-gray-200 hidden sm:block mx-2"></div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="relative min-w-[180px]">
                            <select
                                className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2.5 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-deped-blue focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm hover:border-gray-300"
                                value={selectedSection ?? ''}
                                onChange={(e) => setSelectedSection(e.target.value)}
                            >
                                <option value="" disabled>Select Section</option>
                                {availableSections.map(s => (
                                    <option key={s.id} value={s.section_name}>
                                        {s.section_grade_level} - {s.section_name}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="relative min-w-[180px]">
                            <select
                                className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2.5 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-deped-blue focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm hover:border-gray-300"
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value as typeof selectedTerm)}
                            >
                                {Object.entries(TERM_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {selectedSection && (
                        <>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete ALL grades in this Grade Management sheet? This cannot be undone.')) {
                                        await useAppStore.getState().clearGradingSheet();
                                    }
                                }}
                                className="bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold mr-2"
                                title="Clear All Grades"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Clear All</span>
                            </button>

                            <button
                                onClick={handlePrintConsolidated}
                                className="bg-deped-blue text-white flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 font-bold"
                            >
                                <Printer className="w-5 h-5" />
                                <span>Print</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div id="printable-consolidated-grades" className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 p-4 overflow-auto">
                {/* HTML Table Preview - Styled to match PDF */}
                {!selectedSection ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                        <div className="text-4xl">📊</div>
                        <p className="font-medium">Please select a section to view the grade sheet.</p>
                    </div>
                ) : (
                    <div className="consolidated-sheet mx-auto bg-white p-4" style={{ minWidth: `${tableMinWidth}px` }}>
                        {/* Header Section */}
                        <div className="consolidated-header mb-4">
                            <div className="flex justify-between items-center mb-6 px-2">
                                <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Left" className="consolidated-logo-left w-20 h-20 object-contain" />
                                <div className="text-center">
                                    <h1 className="consolidated-title text-2xl font-bold uppercase text-black">
                                        Summary of Grades for {selectedTerm === 'all' ? 'Final & General Average' : (TERM_LABELS[selectedTerm as keyof typeof TERM_LABELS] || 'Master Sheet')}
                                    </h1>
                                </div>
                                <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Right" className="consolidated-logo-right w-24 h-24 object-contain" />
                            </div>

                            {/* Metadata Grid - Boxed Style */}
                            <div className="grid grid-cols-3 gap-0 text-[11px] border-t border-l border-black">
                                <div className="border-r border-b border-black p-1 px-3 flex items-center justify-start gap-2">
                                    <span className="font-bold whitespace-nowrap">REGION :</span>
                                    <span className="uppercase text-left">{schoolProfile.region || 'XXX'}</span>
                                </div>
                                <div className="border-r border-b border-black p-1 px-3 flex items-center justify-start gap-2">
                                    <span className="font-bold whitespace-nowrap">DIVISION :</span>
                                    <span className="uppercase text-left">{schoolProfile.division || 'MATATAG DIVISION'}</span>
                                </div>
                                <div className="border-r border-b border-black p-1 px-3 flex items-center justify-start gap-2">
                                    <span className="font-bold whitespace-nowrap">SCHOOL YEAR :</span>
                                    <span className="text-left">{activeSchoolYear}</span>
                                </div>
                                <div className="border-r border-b border-black p-1 px-3 flex items-center justify-start gap-2 min-w-0">
                                    <span className="font-bold whitespace-nowrap">SCHOOL NAME :</span>
                                    <span className="uppercase text-left min-w-0 break-words">{schoolProfile.name}</span>
                                </div>
                                <div className="border-r border-b border-black p-1 px-3 flex items-center justify-start gap-2 min-w-0">
                                    <span className="font-bold whitespace-nowrap">GRADE & SECTION :</span>
                                    <span className="uppercase text-left min-w-0 break-words">{sectionObj?.section_grade_level} - {selectedSection}</span>
                                </div>
                                <div className="border-r border-b border-black p-1 px-3 flex items-center justify-start gap-2 min-w-0">
                                    <span className="font-bold whitespace-nowrap">SCHOOL ID :</span>
                                    <span className="text-left min-w-0 break-words">{schoolProfile.school_id}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <table className="consolidated-print-table consolidated-grades-table w-full border-collapse border border-black text-[10px]">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th rowSpan={2} className="consolidated-name-col border border-black p-2 font-bold text-center" style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px`, maxWidth: `${learnerNameColumnWidth}px` }}>NAME OF LEARNERS</th>
                                    {subjectColumns.map((column, index) => (
                                        selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() !== 'MAPEH' ? (
                                            <th
                                                key={`subject-column-${column.baseId}-${index}`}
                                                rowSpan={2}
                                                className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[9px] leading-tight bg-gray-50/50"
                                                title={column.subject.subject_name}
                                                style={getSubjectHeaderStyle(column.subject)}
                                            >
                                                {selectedTerm === 'q1' ? (
                                                    <div className="relative w-full">
                                                        <span className="block whitespace-normal break-words text-center font-bold uppercase text-[8px] leading-tight px-0.5 pointer-events-none">
                                                            {column.subject.subject_name}
                                                        </span>
                                                        <select
                                                            value={subjectColumnSelections[column.baseId] || column.subject.id}
                                                            onChange={(e) => {
                                                                const nextId = e.target.value;
                                                                setSubjectColumnSelections((prev) => ({ ...prev, [column.baseId]: nextId }));
                                                            }}
                                                            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                                                            aria-label={`Select subject for column ${index + 1}`}
                                                        >
                                                            {selectableSubjects.map((option) => (
                                                                <option key={option.id} value={option.id}>
                                                                    {option.subject_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <span className="block whitespace-normal break-words text-center font-bold uppercase text-[8px] leading-tight px-0.5">
                                                        {column.subject.subject_name}
                                                    </span>
                                                )}
                                            </th>
                                        ) : (
                                            <th key={`subject-column-${column.baseId}-${index}`} colSpan={termColSpan(column.subject)} className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[9px] leading-tight bg-gray-50/50" title={column.subject.subject_name} style={getSubjectHeaderStyle(column.subject)}>
                                                {column.subject.subject_name.toUpperCase() === 'MAPEH' ? (
                                                    column.subject.subject_name
                                                ) : (
                                                    selectedTerm === 'q1' ? (
                                                        <div className="relative w-full">
                                                            <span className="block whitespace-normal break-words text-center font-bold uppercase text-[8px] leading-tight px-0.5 pointer-events-none">
                                                                {column.subject.subject_name}
                                                            </span>
                                                            <select
                                                                value={subjectColumnSelections[column.baseId] || column.subject.id}
                                                                onChange={(e) => {
                                                                    const nextId = e.target.value;
                                                                    setSubjectColumnSelections((prev) => ({ ...prev, [column.baseId]: nextId }));
                                                                }}
                                                                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                                                                aria-label={`Select subject for column ${index + 1}`}
                                                            >
                                                                {selectableSubjects.map((option) => (
                                                                    <option key={option.id} value={option.id}>
                                                                        {option.subject_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <span className="block whitespace-normal break-words text-center font-bold uppercase text-[8px] leading-tight px-0.5">
                                                            {column.subject.subject_name}
                                                        </span>
                                                    )
                                                )}
                                            </th>
                                        )
                                    ))}
                                    {showGenAvg && (
                                        <>
                                            <th rowSpan={2} className="consolidated-average-col border border-black p-1 text-center font-bold uppercase text-[9px] leading-tight bg-gray-100" style={{ width: `${AVERAGE_COLUMN_WIDTH}px`, minWidth: `${AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${AVERAGE_COLUMN_WIDTH}px` }}>AVERAGE</th>
                                            <th rowSpan={2} className="consolidated-general-average-col border border-black p-1 text-center font-bold uppercase text-[9px] leading-tight bg-gray-100" style={{ width: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, minWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px` }}>GENERAL AVERAGE</th>
                                        </>
                                    )}
                                </tr>
                                <tr className="bg-gray-50/80">
                                    {subjectColumns.map((column, index) => (
                                        <Fragment key={`subject-subheader-${column.baseId}-${index}`}>
                                            {selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() === 'MAPEH' && (
                                                <>
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[8px] leading-tight" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>Music and Arts</th>
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[8px] leading-tight" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>Physical Education and Health</th>
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[8px] leading-tight" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>FINAL GRADE</th>
                                                </>
                                            )}
                                            
                                            {selectedTerm === 'all' && (
                                                <>
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>T1</th>
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>T2</th>
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>T3</th>
                                                    {showLegacyQuarter4 && <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>LQ4</th>}
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-bold bg-gray-200" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>Final</th>
                                                </>
                                            )}
                                        </Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-gray-200"><td colSpan={totalColumns} className="border border-black p-1 font-bold pl-2 text-xs uppercase">MALE</td></tr>
                                {(() => {
                                    let globalRowIndex = 0;
                                    return (
                                        <>
                                            {maleStudents.map((student) => {
                                                const data = gradesData[student.lrn] || {};
                                                const activeQuarterTerm = selectedTerm === 'q1' || selectedTerm === 'q2' || selectedTerm === 'q3'
                                                    ? selectedTerm
                                                    : null;
                                                const studentRow = globalRowIndex++;
                                                let inputColIndex = 0;
                                                
                                                return (
                                                    <tr key={student.lrn} className="hover:bg-blue-50/20">
                                                        <td className="consolidated-learner-name border border-black p-1 pl-2 font-medium truncate whitespace-nowrap uppercase" style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px`, maxWidth: `${learnerNameColumnWidth}px` }}>
                                                            <span className="inline-block w-4 text-gray-500 mr-1 text-[9px]">{studentRow + 1}</span> 
                                                            {formatLearnerName(student)}
                                                        </td>
                                                        {subjectColumns.map((column, index) => {
                                                            const sData = data[column.subject.id] || {};
                                                            const currentCol = inputColIndex;
                                                            
                                                            if (selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() === 'MAPEH' && column.subject._mapehGroups) {
                                                                inputColIndex += 2;
                                                            } else if (selectedTerm !== 'all') {
                                                                inputColIndex += 1;
                                                            }

                                                            return (
                                                                <Fragment key={`${student.lrn}-${column.baseId}-${index}`}>
                                                                    {selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() === 'MAPEH' ? (
                                                                        <>
                                                                            <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>
                                                                                {activeQuarterTerm && column.subject._mapehGroups?.musicArts[0] && (
                                                                                    <GradeInput
                                                                                        studentLrn={student.lrn}
                                                                                        subjectId={column.subject._mapehGroups.musicArts[0].id}
                                                                                        quarter={parseInt(activeQuarterTerm.replace('q', ''))}
                                                                                        value={getQuarterGradeDetail(sData[activeQuarterTerm])?.musicArts}
                                                                                        activeSchoolYear={activeSchoolYear}
                                                                                        subjects={subjects}
                                                                                        sectionObj={sectionObj}
                                                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                        row={studentRow} col={currentCol}
                                                                                    />
                                                                                )}
                                                                            </td>
                                                                            <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>
                                                                                {activeQuarterTerm && column.subject._mapehGroups?.peHealth[0] && (
                                                                                    <GradeInput
                                                                                        studentLrn={student.lrn}
                                                                                        subjectId={column.subject._mapehGroups.peHealth[0].id}
                                                                                        quarter={parseInt(activeQuarterTerm.replace('q', ''))}
                                                                                        value={getQuarterGradeDetail(sData[activeQuarterTerm])?.peHealth}
                                                                                        activeSchoolYear={activeSchoolYear}
                                                                                        subjects={subjects}
                                                                                        sectionObj={sectionObj}
                                                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                        
                                                                                        row={studentRow} col={currentCol + 1}
                                                                                    />
                                                                                )}
                                                                            </td>
                                                                            <td className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-semibold" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>{activeQuarterTerm ? (getQuarterGradeValue(sData[activeQuarterTerm]) || '') : ''}</td>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {(selectedTerm === 'q1' || selectedTerm === 'all') && (
                                                                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>
                                                                                    {selectedTerm === 'q1' ? (
                                                                                        <GradeInput 
                                                                                            studentLrn={student.lrn} 
                                                                                            subjectId={column.subject.id} 
                                                                                            quarter={1} 
                                                                                            value={sData.q1} 
                                                                                            activeSchoolYear={activeSchoolYear}
                                                                                            subjects={subjects}
                                                                                            sectionObj={sectionObj}
                                                                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                            
                                                                                            row={studentRow} col={currentCol}
                                                                                        />
                                                                                        ) : (getQuarterGradeValue(sData.q1) || '')}
                                                                                </td>
                                                                            )}
                                                                            {(selectedTerm === 'q2' || selectedTerm === 'all') && (
                                                                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>
                                                                                    {selectedTerm === 'q2' ? (
                                                                                        <GradeInput 
                                                                                            studentLrn={student.lrn} 
                                                                                            subjectId={column.subject.id} 
                                                                                            quarter={2} 
                                                                                            value={sData.q2} 
                                                                                            activeSchoolYear={activeSchoolYear}
                                                                                            subjects={subjects}
                                                                                            sectionObj={sectionObj}
                                                                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                            
                                                                                            row={studentRow} col={currentCol}
                                                                                        />
                                                                                        ) : (getQuarterGradeValue(sData.q2) || '')}
                                                                                </td>
                                                                            )}
                                                                            {(selectedTerm === 'q3' || selectedTerm === 'all') && (
                                                                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>
                                                                                    {selectedTerm === 'q3' ? (
                                                                                        <GradeInput 
                                                                                            studentLrn={student.lrn} 
                                                                                            subjectId={column.subject.id} 
                                                                                            quarter={3} 
                                                                                            value={sData.q3} 
                                                                                            activeSchoolYear={activeSchoolYear}
                                                                                            subjects={subjects}
                                                                                            sectionObj={sectionObj}
                                                                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                            
                                                                                            row={studentRow} col={currentCol}
                                                                                        />
                                                                                        ) : (getQuarterGradeValue(sData.q3) || '')}
                                                                                </td>
                                                                            )}
                                                                            {selectedTerm === 'all' && <td className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-bold bg-gray-200" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>{sData.final || ''}</td>}
                                                                        </>
                                                                    )}
                                                                </Fragment>
                                                            );
                                                        })}
                                                        {showGenAvg && (
                                                            <>
                                                                <td className="consolidated-average-col border border-black p-1 text-center font-bold bg-gray-50/50 tabular-nums" style={{ width: `${AVERAGE_COLUMN_WIDTH}px`, minWidth: `${AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${AVERAGE_COLUMN_WIDTH}px` }}>{data.termAverage || ''}</td>
                                                                <td className="consolidated-general-average-col border border-black p-1 text-center font-bold bg-gray-100/50 tabular-nums" style={{ width: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, minWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px` }}>{data.generalAverage || ''}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}

                                            <tr className="bg-gray-200"><td colSpan={totalColumns} className="border border-black p-1 font-bold pl-2 text-xs uppercase">FEMALE</td></tr>
                                            {femaleStudents.map((student) => {
                                                const data = gradesData[student.lrn] || {};
                                                const activeQuarterTerm = selectedTerm === 'q1' || selectedTerm === 'q2' || selectedTerm === 'q3'
                                                    ? selectedTerm
                                                    : null;
                                                const studentRow = globalRowIndex++;
                                                let inputColIndex = 0;

                                                return (
                                                    <tr key={student.lrn} className="hover:bg-blue-50/20">
                                                        <td className="consolidated-learner-name border border-black p-1 pl-2 font-medium truncate whitespace-nowrap uppercase" style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px`, maxWidth: `${learnerNameColumnWidth}px` }}>
                                                            <span className="inline-block w-4 text-gray-500 mr-1 text-[9px]">{studentRow + 1}</span> 
                                                            {formatLearnerName(student)}
                                                        </td>
                                                        {subjectColumns.map((column, index) => {
                                                            const sData = data[column.subject.id] || {};
                                                            const currentCol = inputColIndex;

                                                            if (selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() === 'MAPEH' && column.subject._mapehGroups) {
                                                                inputColIndex += 2;
                                                            } else if (selectedTerm !== 'all') {
                                                                inputColIndex += 1;
                                                            }

                                                            return (
                                                                <Fragment key={`${student.lrn}-${column.baseId}-${index}`}>
                                                                    {selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() === 'MAPEH' ? (
                                                                        <>
                                                                            <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>
                                                                                {activeQuarterTerm && column.subject._mapehGroups?.musicArts[0] && (
                                                                                    <GradeInput
                                                                                        studentLrn={student.lrn}
                                                                                        subjectId={column.subject._mapehGroups.musicArts[0].id}
                                                                                        quarter={parseInt(activeQuarterTerm.replace('q', ''))}
                                                                                        value={getQuarterGradeDetail(sData[activeQuarterTerm])?.musicArts}
                                                                                        activeSchoolYear={activeSchoolYear}
                                                                                        subjects={subjects}
                                                                                        sectionObj={sectionObj}
                                                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                        row={studentRow} col={currentCol}
                                                                                    />
                                                                                )}
                                                                            </td>
                                                                            <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>
                                                                                {activeQuarterTerm && column.subject._mapehGroups?.peHealth[0] && (
                                                                                    <GradeInput
                                                                                        studentLrn={student.lrn}
                                                                                        subjectId={column.subject._mapehGroups.peHealth[0].id}
                                                                                        quarter={parseInt(activeQuarterTerm.replace('q', ''))}
                                                                                        value={getQuarterGradeDetail(sData[activeQuarterTerm])?.peHealth}
                                                                                        activeSchoolYear={activeSchoolYear}
                                                                                        subjects={subjects}
                                                                                        sectionObj={sectionObj}
                                                                                        updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                        
                                                                                        row={studentRow} col={currentCol + 1}
                                                                                    />
                                                                                )}
                                                                            </td>
                                                                            <td className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-semibold" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>{activeQuarterTerm ? (getQuarterGradeValue(sData[activeQuarterTerm]) || '') : ''}</td>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {(selectedTerm === 'q1' || selectedTerm === 'all') && (
                                                                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>
                                                                                    {selectedTerm === 'q1' ? (
                                                                                        <GradeInput 
                                                                                            studentLrn={student.lrn} 
                                                                                            subjectId={column.subject.id} 
                                                                                            quarter={1} 
                                                                                            value={sData.q1} 
                                                                                            activeSchoolYear={activeSchoolYear}
                                                                                            subjects={subjects}
                                                                                            sectionObj={sectionObj}
                                                                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                            
                                                                                            row={studentRow} col={currentCol}
                                                                                        />
                                                                                        ) : (getQuarterGradeValue(sData.q1) || '')}
                                                                                </td>
                                                                            )}
                                                                            {(selectedTerm === 'q2' || selectedTerm === 'all') && (
                                                                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>
                                                                                    {selectedTerm === 'q2' ? (
                                                                                        <GradeInput 
                                                                                            studentLrn={student.lrn} 
                                                                                            subjectId={column.subject.id} 
                                                                                            quarter={2} 
                                                                                            value={sData.q2} 
                                                                                            activeSchoolYear={activeSchoolYear}
                                                                                            subjects={subjects}
                                                                                            sectionObj={sectionObj}
                                                                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                            
                                                                                            row={studentRow} col={currentCol}
                                                                                        />
                                                                                        ) : (getQuarterGradeValue(sData.q2) || '')}
                                                                                </td>
                                                                            )}
                                                                            {(selectedTerm === 'q3' || selectedTerm === 'all') && (
                                                                                <td className="consolidated-subject-col border border-black p-0 text-center tabular-nums font-medium" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>
                                                                                    {selectedTerm === 'q3' ? (
                                                                                        <GradeInput 
                                                                                            studentLrn={student.lrn} 
                                                                                            subjectId={column.subject.id} 
                                                                                            quarter={3} 
                                                                                            value={sData.q3} 
                                                                                            activeSchoolYear={activeSchoolYear}
                                                                                            subjects={subjects}
                                                                                            sectionObj={sectionObj}
                                                                                            updateGradingSheetRecord={updateGradingSheetRecord}
                                                                                            
                                                                                            row={studentRow} col={currentCol}
                                                                                        />
                                                                                        ) : (getQuarterGradeValue(sData.q3) || '')}
                                                                                </td>
                                                                            )}
                                                                            {selectedTerm === 'all' && <td className="consolidated-subject-col border border-black p-1 text-center tabular-nums font-bold bg-gray-200" style={{ width: `${subjectColumnWidth}px`, minWidth: `${subjectColumnWidth}px`, maxWidth: `${subjectColumnWidth}px` }}>{sData.final || ''}</td>}
                                                                        </>
                                                                    )}
                                                                </Fragment>
                                                            );
                                                        })}
                                                        {showGenAvg && (
                                                            <>
                                                                <td className="consolidated-average-col border border-black p-1 text-center font-bold bg-gray-50/50 tabular-nums" style={{ width: `${AVERAGE_COLUMN_WIDTH}px`, minWidth: `${AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${AVERAGE_COLUMN_WIDTH}px` }}>{data.termAverage || ''}</td>
                                                                <td className="consolidated-general-average-col border border-black p-1 text-center font-bold bg-gray-100/50 tabular-nums" style={{ width: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, minWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px` }}>{data.generalAverage || ''}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
