/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, Fragment, useEffect, useCallback } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { Printer, ArrowLeft, ChevronDown, RefreshCcw, Trash2, FileSpreadsheet, Upload, Plus, Minus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { filterSF9Sections } from '../lib/rbac';
import { getSubjectCluster, getWeights, transmuteGrade } from '../lib/grading';
import { getSubjectsForGrade, normalizeSubjectName, sortSubjects } from '../lib/subjectConfig';
import type { Subject } from '../types';

type QuarterGrades = {
    q1?: QuarterGradeCell;
    q2?: QuarterGradeCell;
    q3?: QuarterGradeCell;
    q4?: QuarterGradeCell;
    final?: number;
};

const isKeyStage1 = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('grade')) {
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        return num >= 1 && num <= 3;
    }
    return false;
};

const isKeyStage2To4 = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('grade')) {
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        return num >= 4 && num <= 12;
    }
    return false;
};

const getDescriptor = (grade: number, gradeLevel: string) => {
    if (!grade || grade <= 0) return '';
    
    // Key Stage 1 (Grades 1-3)
    if (isKeyStage1(gradeLevel)) {
        if (grade >= 90) return 'Consistent (Palagiang Naipapakita)';
        if (grade >= 80) return 'Developing (Umuusbong)';
        return 'Beginning (Nagsisimula)';
    }

    // Key Stage 2 to 4 (Grades 4-12)
    if (grade >= 90) return 'Advancing (Namumukod-tangi)';
    if (grade >= 80) return 'Benchmarking (Napamamalas)';
    if (grade >= 75) return 'Connecting (Natutungo)';
    if (grade >= 65) return 'Developing (Napauunlad)';
    return 'Emerging (Nasisimula)';
};

const isElementaryLevel = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('grade')) {
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        return num >= 1 && num <= 6;
    }
    return false;
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
    is_virtual?: boolean;
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
const MAPEH_SUBCOLUMN_WIDTH = 48;
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
                quarter: quarter as 1 | 2 | 3,
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
                className={`grade-input-field w-full h-full bg-transparent text-center focus:bg-blue-50 focus:outline-none transition-colors border-none p-0 hide-number-arrows text-[9px] font-medium ${isSaving ? 'opacity-50' : ''} ${className || ''}`}
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

const WW_COUNT = 5;
const PT_COUNT = 3;
const ST_COUNT = 3;

const normalizeScores = (scores: (number | string)[] | undefined, count: number): (number | string)[] => {
    const src = Array.isArray(scores) ? scores : [];
    return Array.from({ length: count }, (_, i) => src[i] ?? '');
};

const formatLearnerName = (student: any) => {
    const middleInitial = typeof student.middle_name === 'string' && student.middle_name ? `${student.middle_name.charAt(0)}.` : '';
    return `${student.last_name || ''}, ${student.first_name || ''} ${middleInitial}`.trim().replace(/\s+/g, ' ').toUpperCase();
};

export function ConsolidatedGradesPage() {
    

    const {
        sections, subjects, students, gradingSheetRecords, updateGradingSheetRecord,
        activeSchoolYear, schoolProfile, setCurrentView,
        selectedSection, setSelectedSection, classRecords, hpsRecords, showNotification
    } = useAppStore();
    const { user } = useAuthStore();

    const [selectedTerm, setSelectedTerm] = useState<'q1' | 'q2' | 'q3' | 'all'>('q1');
    const [isSyncing, setIsSyncing] = useState(false);
    const [zoom, setZoom] = useState(0.9);
    const showGenAvg = selectedTerm !== 'all';

    // Derived State
    const sectionObj = useMemo(() => sections.find(s => s.section_name === selectedSection), [sections, selectedSection]);

    // ADVISORY CHECK: Is the current user the adviser of this section?
    const isAdviser = useMemo(() => {
        if (!sectionObj || !user) return false;
        
        // 1. Check by ID if available
        if (sectionObj.adviser_id === user.uid) return true;
        
        // 2. Check by Name if ID is missing (fallback)
        const profileAdviser = (schoolProfile.adviser_name || '').trim().toLowerCase();
        const sectionAdviser = (sectionObj.adviser_name || '').trim().toLowerCase();
        const userDisplayName = (user.displayName || '').trim().toLowerCase();
        
        // Match either the school profile adviser or the section-specific adviser name
        return (userDisplayName !== '' && (userDisplayName === profileAdviser || userDisplayName === sectionAdviser)) || sectionObj.is_advisory === true;
    }, [sectionObj, user, schoolProfile.adviser_name]);

    const handleSyncFromEClass = async () => {
        if (!sectionObj || !isAdviser || selectedTerm === 'all') {
            showNotification('Sync is only available for specific terms (Q1-Q3) in your Advisory Class.', 'info');
            return;
        }

        const quarter = parseInt(selectedTerm.replace('q', '')) as 1 | 2 | 3;
        setIsSyncing(true);
        let syncCount = 0;

        try {
            // Process each student in the section
            for (const student of sectionStudents) {
                // Process each subject in the section
                for (const subject of sectionSubjects) {
                    if (subject.is_virtual && subject.subject_name.toUpperCase() === 'MAPEH') continue;

                    // 1. Find HPS for this subject/quarter
                    const hpsRec = hpsRecords.find(r => 
                        r.subject_id === subject.id && 
                        r.school_year === activeSchoolYear && 
                        Number(r.quarter) === quarter
                    );

                    if (!hpsRec) continue; // No E-Class setup for this subject yet

                    // 2. Find Student Record
                    const record = classRecords.find(r => 
                        r.student_lrn === student.lrn && 
                        r.subject_id === subject.id && 
                        Number(r.quarter) === quarter
                    );

                    if (!record) continue;

                    // 3. Calculation Logic (Matching EClassRecord.tsx)
                    const hps_ww = normalizeScores(hpsRec.written_works, WW_COUNT).map(v => v === '' ? 0 : Number(v));
                    const hps_pt = normalizeScores(hpsRec.performance_tasks, PT_COUNT).map(v => v === '' ? 0 : Number(v));
                    const rawHpsQa = (hpsRec as any).summative_tests;
                    const hps_qa = normalizeScores(rawHpsQa, ST_COUNT).map((v, i) => {
                        if (i === 2 && (v === undefined || v === '')) return Number(hpsRec.quarterly_exam) || 0;
                        return Number(v) || 0;
                    });

                    const wwScores = normalizeScores(record.written_works, WW_COUNT).map(v => Number(v) || 0);
                    const ptScores = normalizeScores(record.performance_tasks, PT_COUNT).map(v => Number(v) || 0);
                    const rawQa = (record as any).summative_tests;
                    const qaScores = normalizeScores(rawQa, ST_COUNT).map((v, i) => {
                        if (i === 2 && (v === undefined || v === '')) return Number(record.quarterly_exam) || 0;
                        return Number(v) || 0;
                    });

                    const wwTotalScore = wwScores.reduce((a, b) => a + b, 0);
                    const wwTotalHPS = hps_ww.reduce((a, b) => a + b, 0);
                    const ptTotalScore = ptScores.reduce((a, b) => a + b, 0);
                    const ptTotalHPS = hps_pt.reduce((a, b) => a + b, 0);
                    const qaScore = qaScores.reduce((a, b) => a + b, 0);
                    const qaHPS = hps_qa.reduce((a, b) => a + b, 0);

                    const weights = getWeights(getSubjectCluster(subject.subject_name));
                    const wwWS = wwTotalHPS === 0 ? 0 : (wwTotalScore / wwTotalHPS) * 100 * weights.written_works;
                    const ptWS = ptTotalHPS === 0 ? 0 : (ptTotalScore / ptTotalHPS) * 100 * weights.performance_tasks;
                    const qaWS = qaHPS === 0 ? 0 : (qaScore / qaHPS) * 100 * weights.quarterly_exam;

                    const initialGrade = wwWS + ptWS + qaWS;
                    const finalGrade = transmuteGrade(initialGrade);

                    if (finalGrade > 0) {
                        await updateGradingSheetRecord({
                            id: `${student.lrn}_${subject.id}_${quarter}_${activeSchoolYear}`,
                            student_lrn: student.lrn,
                            subject_id: subject.id,
                            section_id: sectionObj.id,
                            quarter: quarter as 1 | 2 | 3,
                            school_year: activeSchoolYear,
                            final_grade: finalGrade,
                            written_works: [],
                            performance_tasks: [],
                            quarterly_exam: 0
                        });
                        syncCount++;
                    }
                }
            }
            showNotification(`Successfully synced ${syncCount} grades from E-Class Records!`, 'success');
        } catch (error) {
            console.error('Sync error:', error);
            showNotification('Failed to sync grades. Please check your connection.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExportTemplate = () => {
        if (!sectionObj || selectedTerm === 'all') {
            showNotification('Please select a specific term to download a template.', 'info');
            return;
        }

        const termLabel = TERM_LABELS[selectedTerm];
        const wb = XLSX.utils.book_new();

        sectionSubjects.forEach(subject => {
            if (subject.is_virtual && subject.subject_name.toUpperCase() === 'MAPEH') return;

            // 1. Create Metadata Rows (Rows 1-5)
            const metadata = [
                ['SUBJECT_ID:', subject.id],
                ['SUBJECT_NAME:', subject.subject_name],
                ['SECTION:', sectionObj.section_name],
                ['TERM:', termLabel],
                ['INSTRUCTIONS:', 'PLEASE DO NOT EDIT COLUMNS A & B. INPUT GRADES IN COLUMN C ONLY.']
            ];

            // 2. Create Data Headers (Row 6)
            const headers = [['LRN', 'Learner Name', 'Grade']];

            // 3. Create Student Rows (Separated by Gender and Alphabetical)
            const maleRows = maleStudents.map(student => [
                student.lrn,
                formatLearnerName(student),
                ''
            ]);

            const femaleRows = femaleStudents.map(student => [
                student.lrn,
                formatLearnerName(student),
                ''
            ]);

            // Combine all rows with Gender Headers
            const allRows = [
                ...metadata,
                [''], // Spacer
                ...headers,
                ['MALE', '', ''],
                ...maleRows,
                [''], // Spacer
                ['FEMALE', '', ''],
                ...femaleRows
            ];

            // Create Worksheet
            const ws = XLSX.utils.aoa_to_sheet(allRows);
            
            // Set column widths
            ws['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 10 }];
            
            XLSX.utils.book_append_sheet(wb, ws, subject.subject_name.substring(0, 31));
        });

        const fileName = `Grading_Template_${sectionObj.section_name}_${termLabel}_${activeSchoolYear}.xlsx`.replace(/\s+/g, '_');
        XLSX.writeFile(wb, fileName);
        showNotification('Professional grading template downloaded!', 'success');
    };

    const handleImportGrades = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !sectionObj || selectedTerm === 'all') return;

        const quarter = parseInt(selectedTerm.replace('q', '')) as 1 | 2 | 3;
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                let importCount = 0;

                for (const sheetName of workbook.SheetNames) {
                    const ws = workbook.Sheets[sheetName];
                    // Convert to AOA (Array of Arrays) to read metadata from specific cells
                    const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    
                    if (aoa.length < 6) continue;

                    // Extract Subject ID from Row 1, Col 2 (Cell B1)
                    const subjectId = String(aoa[0][1] || '').trim();
                    const subject = subjects.find(s => s.id === subjectId);

                    if (!subject) {
                        console.warn(`Subject ID ${subjectId} in sheet ${sheetName} not found in system.`);
                        continue;
                    }

                    // Data starts from Row 7 (Index 6)
                    const dataRows = aoa.slice(6);

                    for (const row of dataRows) {
                        const lrn = String(row[0] || '').trim();
                        const grade = parseFloat(row[2]); // Grade is in column 3 (Index 2)

                        if (lrn && !isNaN(grade) && grade > 0) {
                            await updateGradingSheetRecord({
                                id: `${lrn}_${subject.id}_${quarter}_${activeSchoolYear}`,
                                student_lrn: lrn,
                                subject_id: subject.id,
                                section_id: sectionObj.id,
                                quarter: quarter,
                                school_year: activeSchoolYear,
                                final_grade: grade,
                                written_works: [],
                                performance_tasks: [],
                                quarterly_exam: 0
                            });
                            importCount++;
                        }
                    }
                }

                showNotification(`Successfully imported ${importCount} grades with ID matching!`, 'success');
                e.target.value = '';
            } catch (error) {
                console.error('Import error:', error);
                showNotification('Failed to import Excel file. Please use the official template.', 'error');









            }
        };

        reader.readAsArrayBuffer(file);
    };

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

const groupedSections = useMemo(() => {
        const groups: Record<string, any[]> = {
            'ELEMENTARY': [],
            'JUNIOR HIGH SCHOOL': [],
            'SENIOR HIGH SCHOOL': []
        };
        
        availableSections.forEach(s => {
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
    }, [availableSections]);

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

    // SECTION SUBJECTS - Strictly following the Subjects Page (Source of Truth)
    const sectionSubjects = useMemo(() => {
        if (!sectionObj) return [];

        // 1. Get the official list of subjects for this grade level from the curriculum
        const intendedSubjects = getSubjectsForGrade(sectionObj.section_grade_level, schoolProfile.curriculum);
        
        // 2. Get all actual subject records for this section or grade level from the database
        const sectionGradeNum = parseInt(sectionObj.section_grade_level.replace(/\D/g, '')) || 0;
        let sectionDbSubjects = subjects.filter(s => s.section_id === sectionObj.id);
        
        // If no section-specific subjects exist, look for grade-level templates
        if (sectionDbSubjects.length === 0) {
            sectionDbSubjects = subjects.filter(s => {
                const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
                return !s.section_id && subjectGradeNum === sectionGradeNum;
            });
        }

        // 3. Determine the base list of subjects
        // If there are actual subjects in the DB for this section, we use those as the primary source.
        // If the section is new/empty, we fall back to the curriculum/standard list.
        let baseList: VirtualSectionSubject[] = [];

        if (sectionDbSubjects.length > 0) {
            // Use existing DB subjects
            baseList = sectionDbSubjects.map(s => ({ ...s, is_virtual: false } as VirtualSectionSubject));
            
            // Special Case: If we have MAPEH components but no MAPEH header row in the DB, create a virtual one
            const hasMapehHeader = sectionDbSubjects.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');
            const hasMapehComponents = sectionDbSubjects.some(s => {
                const n = normalizeSubjectName(s.subject_name);
                return n.includes('musicandarts') || n.includes('musicarts') || 
                       n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth');
            });

            if (hasMapehComponents && !hasMapehHeader) {
                baseList.push({
                    id: `virtual-mapeh-${sectionObj.id}`,
                    subject_name: 'MAPEH',
                    section_id: sectionObj.id,
                    grade_level: sectionObj.section_grade_level,
                    is_virtual: true
                } as VirtualSectionSubject);
            }
        } else {
            // Fallback to intended curriculum (Standard/Custom config)
            baseList = intendedSubjects.map(intended => ({
                id: `virtual-${normalizeSubjectName(intended.name)}-${sectionObj.id}`,
                subject_name: intended.name,
                section_id: sectionObj.id,
                grade_level: sectionObj.section_grade_level,
                is_virtual: true
            } as VirtualSectionSubject));
        }

        // 4. Post-process: Identify MAPEH groups for all items in the list
        const withMapehData = baseList.map(base => {
            const norm = normalizeSubjectName(base.subject_name);
            if (norm === 'mapeh') {
                return {
                    ...base,
                    _mapehGroups: {
                        musicArts: sectionDbSubjects.filter(s => {
                            const n = normalizeSubjectName(s.subject_name);
                            return n.includes('musicandarts') || n.includes('musicarts');
                        }),
                        peHealth: sectionDbSubjects.filter(s => {
                            const n = normalizeSubjectName(s.subject_name);
                            return n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth');
                        })
                    }
                };
            }
            return base;
        });

        // 5. Apply Global Standard Ordering (Filipino -> English -> ... -> MAPEH -> Specialization)
        const sortedSubjects = sortSubjects(withMapehData, s => s.subject_name);

        // 6. Filter out individual MAPEH components from the main row list (they are sub-columns under MAPEH header)
        return sortedSubjects.filter(sub => {
            const norm = normalizeSubjectName(sub.subject_name);
            const isComponent = norm.includes('musicandarts') || norm.includes('musicarts') || 
                               norm.includes('physicaleducationandhealth') || norm.includes('peandhealth') || norm.includes('pehealth');
            
            return !isComponent || norm === 'mapeh';
        });
    }, [subjects, sectionObj, schoolProfile.curriculum]);



    const selectableSubjects = useMemo(() => {
        return sectionSubjects.filter((subject) => subject.subject_name.toUpperCase() !== 'MAPEH');
    }, [sectionSubjects]);

    const [subjectColumnSelections, setSubjectColumnSelections] = useState<Record<string, string>>({});

    useEffect(() => {
        if (sectionObj?.section_metadata?.sf9SubjectSelections) {
            setSubjectColumnSelections(sectionObj.section_metadata.sf9SubjectSelections);
        } else {
            setSubjectColumnSelections({});
        }
    }, [sectionObj]);

    const handleUpdateSubjectSelection = async (baseId: string, selectedId: string) => {
        if (!sectionObj) return;
        
        const newSelections = { ...subjectColumnSelections, [baseId]: selectedId };
        setSubjectColumnSelections(newSelections);
        
        try {
            const updatedSection = {
                ...sectionObj,
                section_metadata: {
                    ...sectionObj.section_metadata,
                    sf9SubjectSelections: newSelections
                }
            };
            await useAppStore.getState().updateSection(updatedSection);
        } catch (error) {
            console.error('Failed to save subject selection:', error);
        }
    };

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

    const isElementary = useMemo(() => {
        if (!sectionObj) return false;
        return isElementaryLevel(sectionObj.section_grade_level);
    }, [sectionObj]);

    
    const learnerNameColumnWidth = useMemo(() => {
        const longestName = sectionStudents.reduce((longest, student) => {
            const currentName = formatLearnerName(student);
            return currentName.length > longest.length ? currentName : longest;
        }, '');
        const estimatedWidth = longestName.length > 0 ? Math.ceil(longestName.length * 5.2 + 28) : 160;
        return Math.max(150, Math.min(estimatedWidth, 280));
    }, [sectionStudents]);

    const showDescriptor = useMemo(() => {
        if (!sectionObj) return false;
        return isKeyStage1(sectionObj.section_grade_level) || isKeyStage2To4(sectionObj.section_grade_level);
    }, [sectionObj]);

    const subjectColumnWidth = useMemo(() => {
        if (selectedTerm === 'all') return 30;

        // 1. Calculate total logical sub-columns (MAPEH takes 3 slots, others take 1)
        const totalSubCols = sectionSubjects.reduce((acc, sub) => {
            if (sub.subject_name.toUpperCase() === 'MAPEH') return acc + 3;
            return acc + 1;
        }, 0);

        if (totalSubCols === 0) return SUBJECT_COLUMN_WIDTH;

        // 2. Determine available width for subjects
        // Standard Folio Landscape (13in) is approx 1248px at 96dpi
        const pageWidth = 1200; 
        const avgColsWidth = showGenAvg ? (AVERAGE_COLUMN_WIDTH + GENERAL_AVERAGE_COLUMN_WIDTH) : 0;
        const availableWidth = pageWidth - learnerNameColumnWidth - avgColsWidth - 100; // 100px for padding/borders

        // 3. Compute dynamic width per slot
        const dynamicWidth = Math.floor(availableWidth / totalSubCols);

        // 4. Clamp to ensure readability but prioritize fitting the page
        // Minimum 45px (enough for 3 digits), Maximum 120px
        return Math.max(45, Math.min(120, dynamicWidth));
    }, [sectionSubjects, selectedTerm, learnerNameColumnWidth, showGenAvg]);

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
                            let qAvg = null;
                            if (ma > 0 && ph > 0) qAvg = Math.round((ma + ph) / 2);
                            else if (ma > 0) qAvg = ma;
                            else if (ph > 0) qAvg = ph;

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
                        
                        const isExcluded = subject.subject_name.startsWith('*') || 
                                          subject.subject_name.toLowerCase().includes('arabic language') || 
                                          subject.subject_name.toLowerCase().includes('islamic values');

                        if (!isExcluded) {
                            totalFinal += finalRating;
                            subjectCount++;
                        }
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

                        const isExcluded = subject.subject_name.startsWith('*') || 
                                          subject.subject_name.toLowerCase().includes('arabic language') || 
                                          subject.subject_name.toLowerCase().includes('islamic values');

                        if (!isExcluded) {
                            totalFinal += finalRating;
                            subjectCount++;
                        }
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

            let genAvg = 0;
            if (subjectCount > 0) {
                genAvg = totalFinal / subjectCount;
                studentData.generalAverage = String(Math.round(genAvg));
            } else {
                studentData.generalAverage = '';
            }

            // Calculate average for the selected term using visible subject columns
            const activeTerm = selectedTerm === 'all' ? null : selectedTerm;
            if (activeTerm) {
                const seenSubjectIds = new Set<string>();
                let termTotal = 0;
                let termSubjectCount = 0;
                subjectColumns.forEach(({ subject }) => {
                    // Avoid double-counting if the same subject is selected for multiple columns
                    if (seenSubjectIds.has(subject.id)) return;
                    seenSubjectIds.add(subject.id);

                    const sData = studentData[subject.id];
                    if (sData) {
                        const val = getQuarterGradeValue(sData[activeTerm as QuarterKey]);
                        const isExcluded = subject.subject_name.startsWith('*') || 
                                          subject.subject_name.toLowerCase().includes('arabic language') || 
                                          subject.subject_name.toLowerCase().includes('islamic values');

                        if (val !== null && val > 0 && !isExcluded) {
                            termTotal += val;
                            termSubjectCount++;
                        }
                    }
                });

                if (termSubjectCount > 0) {
                    const avg = termTotal / termSubjectCount;
                    // Term Average uses 2 decimal places for precision
                    const computedTermAverage = avg.toFixed(2);
                    studentData.termAverage = computedTermAverage;
                    // General Average is rounded to the nearest whole number
                    studentData.generalAverage = String(Math.round(genAvg));
                } else {
                    studentData.termAverage = '';
                    studentData.generalAverage = '';
                }
            }

            data[student.lrn] = studentData;
        });

        return data;
    }, [sectionStudents, sectionSubjects, subjectColumns, gradingSheetRecords, selectedTerm]);



    const getSubjectHeaderStyle = (sub: VirtualSectionSubject) => {
        if (showGenAvg && sub.subject_name.toUpperCase() === 'MAPEH') {
            const width = 3 * MAPEH_SUBCOLUMN_WIDTH;
            return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
        }

        const width = termColSpan(sub) * subjectColumnWidth;
        return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
    };
    
    const termColSpan = useCallback((sub: VirtualSectionSubject) => {
        if (selectedTerm === 'all') return 4;
        if (sub.subject_name.toUpperCase() === 'MAPEH') return 3;
        return 1;
    }, [selectedTerm]);

    const totalColumns = 1 + subjectColumns.reduce((acc, col) => acc + termColSpan(col.subject), 0) + (showGenAvg ? (showDescriptor ? 3 : 2) : 0);
    
    const tableMinWidth = useMemo(() => {
        const nameColWidth = learnerNameColumnWidth;
        const avgColsWidth = showGenAvg ? (AVERAGE_COLUMN_WIDTH + GENERAL_AVERAGE_COLUMN_WIDTH) : 0;
        const subjectCols = subjectColumns.reduce((acc, col) => acc + termColSpan(col.subject), 0);
        const subjectColWidth = subjectColumnWidth;
        
        const estimatedWidth = (subjectCols * subjectColWidth) + nameColWidth + avgColsWidth;
        return Math.max(selectedTerm === 'all' ? 1200 : 900, estimatedWidth);
    }, [subjectColumns, selectedTerm, showGenAvg, learnerNameColumnWidth, subjectColumnWidth, termColSpan]);

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
                    .consolidated-zoom-shell { transform: none !important; }
                    .no-print { display: none !important; }
                }
            `}</style>
            {/* TIER 2: Page Context Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 mb-6 bg-white dark:bg-[#0B1121] border-b border-[#E5E7EB] dark:border-white/10 no-print">
                {/* Left: Breadcrumb / Back */}
                <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => setCurrentView('reports')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors group" title="Back to Reports">
                        <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-[#0f172a] dark:group-hover:text-white transition-colors" />
                    </button>
                    <div className="hidden sm:flex items-center gap-2 text-[13px]">
                        <span className="font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" onClick={() => setCurrentView('dashboard')}>Dashboard</span>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="font-bold text-[#0f172a] dark:text-white">Grade Management</span>
                    </div>
                    <div className="sm:hidden font-bold text-[#0f172a] dark:text-white text-[13px]">
                        Grade Management
                    </div>
                </div>

                {/* Right: Global Actions (Removed per user request) */}
            </div>

            {/* TIER 3: Filter & Action Toolbar */}
            <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 bg-white dark:bg-white/5 p-2.5 lg:p-3 rounded-[16px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-white/10 no-print relative z-20 mb-6 mx-6">
                {/* LEFT: Dropdowns */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-[180px] shrink-0">
                        <select
                            className="h-8 w-full appearance-none bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium py-1 pl-2.5 pr-7 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors cursor-pointer hover:bg-slate-50"
                            value={selectedSection ?? ''}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="" disabled>Select Section</option>
                            
                                        {Object.entries(groupedSections).map(([group, groupSections]) => (
                                            groupSections.length > 0 && (
                                                <optgroup key={group} label={group}>
                                                    {groupSections.map(s => (
                                                        <option key={s.id} value={s.section_name}>
                                                            {s.section_grade_level} - {s.section_name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )
                                        ))}

                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    <div className="relative w-[120px] shrink-0">
                        <select
                            className="h-8 w-full appearance-none bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium py-1 pl-2.5 pr-7 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors cursor-pointer hover:bg-slate-50"
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value as typeof selectedTerm)}
                        >
                            {Object.entries(TERM_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Actions */}
                <div className="flex flex-nowrap items-center gap-1.5 justify-end shrink-0">
                    {selectedSection && (
                        <div className="flex items-center gap-1 h-8 px-1 rounded-md bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded"
                                title="Zoom Out"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 w-9 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded"
                                title="Zoom In"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    {selectedSection && isAdviser && selectedTerm !== 'all' && (
                        <>
                            <button
                                onClick={handleExportTemplate}
                                className="flex items-center gap-1 h-8 px-2.5 rounded-md bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm active:scale-95 whitespace-nowrap shrink-0"
                                title="Download Template"
                            >
                                <FileSpreadsheet className="w-3 h-3 text-slate-400" />
                                <span className="hidden xl:inline">Template</span>
                            </button>

                            <div className="relative group shrink-0">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleImportGrades}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <button
                                    className="flex items-center gap-1 h-8 px-2.5 rounded-md bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm active:scale-95 group-hover:bg-slate-50 whitespace-nowrap shrink-0"
                                >
                                    <Upload className="w-3 h-3 text-slate-400" />
                                    <span className="hidden xl:inline">Import</span>
                                </button>
                            </div>

                            <button
                                onClick={handleSyncFromEClass}
                                disabled={isSyncing}
                                className={`flex items-center gap-1 h-8 px-2.5 rounded-md transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm border active:scale-95 whitespace-nowrap shrink-0 ${
                                    isSyncing 
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10' 
                                    : 'bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                            >
                                <RefreshCcw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span className="hidden xl:inline">Sync</span>
                            </button>
                        </>
                    )}

                    {selectedSection && (
                        <>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete ALL grades in this Grade Management sheet? This cannot be undone.')) {
                                        await useAppStore.getState().clearGradingSheet();
                                    }
                                }}
                                className="flex items-center gap-1 h-8 px-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent transition-all font-bold text-[10px] uppercase tracking-wider active:scale-95 whitespace-nowrap shrink-0"
                                title="Clear All Grades"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span className="hidden xl:inline">Clear All</span>
                            </button>

                            <button
                                onClick={handlePrintConsolidated}
                                className="flex items-center gap-1 h-8 px-2.5 sm:px-4 rounded-md bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] hover:bg-slate-800 dark:hover:bg-slate-200 transition-all font-black text-[10px] uppercase tracking-wider shadow-md active:scale-95 ml-0.5 whitespace-nowrap shrink-0"
                            >
                                <Printer className="w-3 h-3" />
                                <span className="hidden sm:inline">Print</span>
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
                    <div className="w-full min-h-full flex justify-center overflow-x-auto py-2">
                    <div
                        className="consolidated-zoom-shell origin-top transition-all duration-300"
                        style={{ transform: `scale(${zoom})` }}
                    >
                    <div className="consolidated-sheet mx-auto bg-white p-4" style={{ minWidth: `${tableMinWidth}px` }}>
                        {/* Header Section */}
                        <div className="consolidated-header mb-4">
                            <div className="flex justify-between items-center mb-6 px-2">
                                <img src="/deped_logo_left.png" alt="DepEd Left" className="consolidated-logo-left w-20 h-20 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}deped_logo_left.png` }} />
                                <div className="text-center">
                                    <h1 className={`consolidated-title ${isElementary ? 'text-xl' : 'text-2xl'} font-bold uppercase text-black`}>
                                        Summary of Grades for {selectedTerm === 'all' ? 'Final & General Average' : (TERM_LABELS[selectedTerm as keyof typeof TERM_LABELS] || 'Master Sheet')}
                                    </h1>
                                </div>
                                <img src="/deped_logo_right.png" alt="DepEd Right" className="consolidated-logo-right w-24 h-24 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}deped_logo_right.png` }} />
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
                                    <span className="uppercase text-left min-w-0 wrap-break-word">{schoolProfile.name}</span>
                                </div>
                                <div className="border-r border-b border-black p-1 px-3 flex items-center justify-start gap-2 min-w-0">
                                    <span className="font-bold whitespace-nowrap">GRADE & SECTION :</span>
                                    <span className="uppercase text-left min-w-0 wrap-break-word">{sectionObj?.section_grade_level} - {selectedSection}</span>
                                </div>
                                <div className="border-r border-b border-black p-1 px-3 flex items-center justify-start gap-2 min-w-0">
                                    <span className="font-bold whitespace-nowrap">SCHOOL ID :</span>
                                    <span className="text-left min-w-0 wrap-break-word">{schoolProfile.school_id}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <table className={`consolidated-print-table consolidated-grades-table w-full border-collapse border border-black ${isElementary ? 'text-[7px]' : 'text-[8px]'}`}>
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th rowSpan={2} className="consolidated-name-col border border-black p-2 font-bold text-center" style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px`, maxWidth: `${learnerNameColumnWidth}px` }}>NAME OF LEARNERS</th>
                                    {subjectColumns.map((column, index) => (
                                        selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() !== 'MAPEH' ? (
                                            <th
                                                key={`subject-column-${column.baseId}-${index}`}
                                                rowSpan={2}
                                                className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50"
                                                title={column.subject.subject_name}
                                                style={getSubjectHeaderStyle(column.subject)}
                                            >
                                                {selectedTerm === 'q1' ? (
                                                    <div className="relative w-full">
                                                        <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5 pointer-events-none">
                                                            {column.subject.subject_name}
                                                        </span>
                                                        <select
                                                            value={subjectColumnSelections[column.baseId] || column.subject.id}
                                                            onChange={(e) => handleUpdateSubjectSelection(column.baseId, e.target.value)}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        >
                                                            <option value={column.baseId}>{column.subject.subject_name} (Default)</option>
                                                            {selectableSubjects.map((option) => (
                                                                <option key={option.id} value={option.id}>
                                                                    {option.subject_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5">
                                                        {column.subject.subject_name}
                                                    </span>
                                                )}
                                            </th>
                                        ) : (
                                            <th key={`subject-column-${column.baseId}-${index}`} colSpan={termColSpan(column.subject)} className="consolidated-subject-header border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-50/50" title={column.subject.subject_name} style={getSubjectHeaderStyle(column.subject)}>
                                                {column.subject.subject_name.toUpperCase() === 'MAPEH' ? (
                                                    column.subject.subject_name
                                                ) : (
                                                    selectedTerm === 'q1' ? (
                                                        <div className="relative w-full">
                                                            <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5 pointer-events-none">
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
                                                        <span className="block whitespace-normal wrap-break-word text-center font-bold uppercase text-[6px] leading-tight px-0.5">
                                                            {column.subject.subject_name}
                                                        </span>
                                                    )
                                                )}
                                            </th>
                                        )
                                    ))}
                                    {showGenAvg && (
                                        <>
                                            <th rowSpan={2} className="consolidated-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100" style={{ width: `${AVERAGE_COLUMN_WIDTH}px`, minWidth: `${AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${AVERAGE_COLUMN_WIDTH}px` }}>AVERAGE</th>
                                            <th rowSpan={2} className="consolidated-general-average-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100" style={{ width: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, minWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px` }}>GENERAL AVERAGE</th>
                                            {showDescriptor && (
                                                <th rowSpan={2} className="consolidated-descriptor-col border border-black p-1 text-center font-bold uppercase text-[7px] leading-tight bg-gray-100" style={{ width: `100px`, minWidth: `100px`, maxWidth: `100px` }}>DESCRIPTOR</th>
                                            )}
                                        </>
                                    )}
                                </tr>
                                <tr className="bg-gray-50/80">
                                    {subjectColumns.map((column, index) => (
                                        <Fragment key={`subject-subheader-${column.baseId}-${index}`}>
                                            {selectedTerm !== 'all' && column.subject.subject_name.toUpperCase() === 'MAPEH' && (
                                                <>
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1]" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>Music &<br/>Arts</th>
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1]" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>PE &<br/>Health</th>
                                                    <th className="consolidated-subject-col border border-black p-0.5 text-center font-normal text-[6px] leading-[1.1]" style={{ width: `${MAPEH_SUBCOLUMN_WIDTH}px`, minWidth: `${MAPEH_SUBCOLUMN_WIDTH}px`, maxWidth: `${MAPEH_SUBCOLUMN_WIDTH}px` }}>FINAL<br/>GRADE</th>
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
                                <tr className="bg-gray-200"><td colSpan={totalColumns} className="border border-black p-1 font-bold pl-2 text-[10px] uppercase bg-gray-200">MALE</td></tr>
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
                                                        <td className={`consolidated-learner-name border border-black ${isElementary ? 'p-0.5 pl-1.5' : 'p-1 pl-2'} font-medium truncate whitespace-nowrap uppercase`} style={{ width: `${learnerNameColumnWidth}px`, minWidth: `${learnerNameColumnWidth}px`, maxWidth: `${learnerNameColumnWidth}px` }}>
                                                            <span className="inline-block w-4 text-gray-500 mr-1 text-[7px] text-center font-bold tracking-tighter">
                                                                {studentRow + 1}
                                                            </span> 
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
                                                                <td className={`consolidated-average-col border border-black ${isElementary ? 'p-0.5' : 'p-1'} text-center font-bold bg-gray-50/50 tabular-nums`} style={{ width: `${AVERAGE_COLUMN_WIDTH}px`, minWidth: `${AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${AVERAGE_COLUMN_WIDTH}px` }}>{data.termAverage || ''}</td>
                                                                <td className={`consolidated-general-average-col border border-black ${isElementary ? 'p-0.5' : 'p-1'} text-center font-bold bg-gray-100/50 tabular-nums`} style={{ width: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, minWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px`, maxWidth: `${GENERAL_AVERAGE_COLUMN_WIDTH}px` }}>{data.generalAverage || ''}</td>
                                                                {showDescriptor && (
                                                                    <td className="consolidated-descriptor-col border border-black p-1 text-center font-bold bg-gray-200 text-[6px] leading-tight uppercase" style={{ width: `100px`, minWidth: `100px`, maxWidth: `100px` }}>
                                                                        {data.generalAverage ? getDescriptor(Number(data.generalAverage), sectionObj?.section_grade_level || "") : ''}
                                                                    </td>
                                                                )}
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}

                                            <tr className="bg-gray-200"><td colSpan={totalColumns} className="border border-black p-1 font-bold pl-2 text-[10px] uppercase bg-gray-200">FEMALE</td></tr>
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
                                                            <span className="inline-block w-4 text-gray-500 mr-1 text-[7px]">{studentRow + 1}</span> 
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
                                                                {showDescriptor && (
                                                                    <td className="consolidated-descriptor-col border border-black p-1 text-center font-bold bg-gray-200 text-[6px] leading-tight uppercase" style={{ width: `100px`, minWidth: `100px`, maxWidth: `100px` }}>
                                                                        {data.generalAverage ? getDescriptor(Number(data.generalAverage), sectionObj?.section_grade_level || "") : ''}
                                                                    </td>
                                                                )}
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
                        {/* Summary of Grades - Learning Progress and Achievement */}
                        {showDescriptor && selectedTerm !== 'all' && (
                            <div className="mt-8 mb-4 no-print" style={{ maxWidth: '600px' }}>
                                <div className="border-2 border-black overflow-hidden rounded-sm shadow-sm">
                                    <div className="bg-gray-200 p-2 font-bold text-xs border-b-2 border-black text-center uppercase tracking-wider">
                                        Learning Progress and Achievement
                                    </div>
                                    <table className="w-full text-center text-[10px] border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 border-b-2 border-black font-bold">
                                                <th className="p-2 border-r border-black text-left pl-4 uppercase tracking-tight">Descriptors & Grading Scale</th>
                                                <th className="p-2 border-r border-black w-24 uppercase">REMARKS</th>
                                                <th className="p-2 border-r border-black w-16 uppercase">MALE</th>
                                                <th className="p-2 border-r border-black w-16 uppercase">FEMALE</th>
                                                <th className="p-2 w-16 uppercase">TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { desc: 'Advancing (90-100)', remark: 'Passed', min: 90, max: 100 },
                                                { desc: 'Benchmarking (80-89)', remark: 'Passed', min: 80, max: 89 },
                                                { desc: 'Connecting (75-79)', remark: 'Passed', min: 75, max: 79 },
                                                { desc: 'Developing (65-74)', remark: 'Failed', min: 65, max: 74 },
                                                { desc: 'Emerging (0-64)', remark: 'Failed', min: 0, max: 64 }
                                            ].map((level, idx) => {
                                                const getCounts = (studentsList: typeof maleStudents) => {
                                                    return studentsList.filter(s => {
                                                        const avg = Number(gradesData[s.lrn]?.generalAverage || 0);
                                                        return avg >= level.min && avg <= level.max;
                                                    }).length;
                                                };
                                                const mCount = getCounts(maleStudents);
                                                const fCount = getCounts(femaleStudents);
                                                const total = mCount + fCount;
                                                
                                                return (
                                                    <tr key={idx} className="border-b border-black">
                                                        <td className="p-2 border-r border-black text-left pl-4 font-medium">{level.desc}</td>
                                                        <td className={`p-2 border-r border-black font-bold ${level.min < 75 ? 'text-red-600' : 'text-green-700'}`}>{level.remark}</td>
                                                        <td className="p-2 border-r border-black tabular-nums font-medium">{mCount || '-'}</td>
                                                        <td className="p-2 border-r border-black tabular-nums font-medium">{fCount || '-'}</td>
                                                        <td className="p-2 bg-gray-50 tabular-nums font-bold">{total || '-'}</td>
                                                    </tr>
                                                );
                                            })}
                                            <tr className="bg-gray-200 font-bold">
                                                <td className="p-2 border-r border-black text-left pl-4" colSpan={2}>TOTAL</td>
                                                <td className="p-2 border-r border-black tabular-nums">{maleStudents.filter(s => Number(gradesData[s.lrn]?.generalAverage || 0) > 0).length}</td>
                                                <td className="p-2 border-r border-black tabular-nums">{femaleStudents.filter(s => Number(gradesData[s.lrn]?.generalAverage || 0) > 0).length}</td>
                                                <td className="p-2 tabular-nums">{sectionStudents.filter(s => Number(gradesData[s.lrn]?.generalAverage || 0) > 0).length}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
    
                    </div>
                        </div>
                        </div>
                )}
            </div>
        </div>
    );
}
