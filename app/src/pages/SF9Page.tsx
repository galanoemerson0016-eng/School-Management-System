import React, { useState, useMemo, useEffect, useRef, useTransition } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image, Font, usePDF } from '@react-pdf/renderer';
Font.registerHyphenationCallback(word => [word]);
import { useAppStore, useAuthStore } from '../stores';
import type { Student, User, Section, Subject, ClassRecord, ObservedValues, SF2Sheet, SchoolProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Printer, FileText, Layout, Download, Edit3, Settings, Settings2, X, Plus, Minus, Volume2, VolumeX } from 'lucide-react';
import { filterSF9Sections } from '../lib/rbac';
const isKeyStage1 = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('grade')) {
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        return num >= 1 && num <= 3;
    }
    return false;
};

const getDescriptor = (grade: number, gradeLevel: string) => {
    if (!grade || grade <= 0) return '';
    
    // Key Stage 1 (Grades 1-3)
    if (isKeyStage1(gradeLevel)) {
        if (grade >= 90) return 'Consistent';
        if (grade >= 80) return 'Developing';
        return 'Beginning';
    }

    // Key Stage 2 to 4 (Grades 4-12)
    if (grade >= 90) return 'Advancing';
    if (grade >= 80) return 'Benchmarking';
    if (grade >= 75) return 'Connecting';
    if (grade >= 65) return 'Developing';
    return 'Emerging';
};

import { getSF9SubjectsForGrade, normalizeSubjectName, sortSubjects } from '../lib/subjectConfig';

// Print mode type for term-specific printing
type SF9PrintMode = 'full' | 'term1' | 'term2' | 'term3';

// Term-to-month mapping for attendance
const TERM_MONTHS: Record<string, string[]> = {
    term1: ['JUN', 'JUL', 'AUG'],
    term2: ['SEP', 'OCT', 'NOV', 'DEC'],
    term3: ['JAN', 'FEB', 'MAR', 'APR'],
};

// SF9-JHS Official Template - Landscape Format
const styles = StyleSheet.create({
    page: { paddingTop: 30, paddingBottom: 40, paddingHorizontal: 30, fontSize: 10, fontFamily: 'Times-Roman' },
    // PAGE 1 STYLES
    page1Container: { flexDirection: 'row', height: '100%' },
    leftColumn: { width: '50%', paddingRight: 15 },
    rightColumn: { width: '50%', paddingLeft: 15 },
    sf9Label: { fontSize: 10, fontStyle: 'italic', textAlign: 'right', marginBottom: 15 },
    attendanceTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
    attendanceTable: { borderWidth: 1, borderColor: '#000', marginBottom: 25 },
    attHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    attRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    attRowLast: { flexDirection: 'row' },
    attMonthCell: { width: '7%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, fontSize: 7, textAlign: 'center', justifyContent: 'center' },
    attLabelCell: { width: '11%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, fontSize: 8, justifyContent: 'center' },
    attDataCell: { width: '7%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, fontSize: 8, textAlign: 'center', justifyContent: 'center' },
    attDataCellLast: { width: '12%', padding: 2, fontSize: 8, textAlign: 'center', justifyContent: 'center' },
    parentSection: { marginTop: 15 },
    parentTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    signatureRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
    quarterLabel: { width: '20%', fontSize: 10 },
    signatureLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', height: 16 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
    headerText: { fontSize: 10, textAlign: 'center', marginBottom: 1 },
    schoolName: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginTop: 4, marginBottom: 8 },
    reportTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    logo: { width: 55, height: 55 },
    studentInfoGrid: { marginBottom: 10 },
    infoRow: { flexDirection: 'row', marginBottom: 6 },
    infoLabel: { fontSize: 10, width: 50 },
    infoValue: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', fontSize: 10, paddingBottom: 2 },
    infoValueShort: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', fontSize: 10, paddingBottom: 2, marginLeft: 10 },
    infoLabelRight: { fontSize: 10, width: 70, marginLeft: 10 },
    dearParents: { fontSize: 10, fontWeight: 'bold', marginBottom: 5, marginTop: 25 },
    messageText: { fontSize: 9, lineHeight: 1.5, marginBottom: 8, textAlign: 'justify' },
    signatureLineBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    signatureBlock: { width: '48%', alignItems: 'center' },
    signatureName: { borderBottomWidth: 1, borderBottomColor: '#000', width: '100%', textAlign: 'center', paddingBottom: 2, marginBottom: 2, fontSize: 10, fontWeight: 'bold' },
    signatureTitle: { fontSize: 9, textAlign: 'center' },
    transferSection: { marginTop: 35, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 10 },
    transferTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    transferRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
    transferLabel: { fontSize: 9, width: 150 },
    transferLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', height: 15 },

    // PAGE 2 STYLES
    page2Container: { flexDirection: 'row', height: '100%' },
    page2Left: { width: '50%', paddingRight: 10 },
    page2Right: { width: '50%', paddingLeft: 10 },

    // Learning Progress Table Styles
    lpTable: { borderWidth: 1, borderColor: '#000', width: '100%', marginBottom: 6, flex: 1 },
    lpHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#FFFFFF', minHeight: 32 },
    lpRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', flex: 1, minHeight: 20.5 },
    lpCell: { borderRightWidth: 1, borderColor: '#000', padding: 4, fontSize: 8.5, justifyContent: 'center' },
    lpCellLast: { padding: 4, fontSize: 8.5, justifyContent: 'center' },
    lpHeaderCell: { borderRightWidth: 1, borderColor: '#000', padding: 2, fontSize: 8, fontWeight: 'bold', textAlign: 'center', justifyContent: 'center' },

    // Observed Values Table Styles
    ovTable: { borderWidth: 1, borderColor: '#000', width: '100%', marginBottom: 6, flex: 1 },
    ovHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#FFFFFF' },
    ovRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
    ovCell: { borderRightWidth: 1, borderColor: '#000', padding: 6, fontSize: 9 },

    // Legend Styles
    legendContainer: { flexDirection: 'column', marginTop: 10 },
    legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    legendItem: { fontSize: 9, flexDirection: 'row', alignItems: 'center' },
    legendTitle: { fontWeight: 'bold', fontSize: 10, marginBottom: 5 },
});

const CORE_VALUES = [
    {
        name: '1. MAKA-DIYOS',
        behaviors: [
            "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others",
            "Shows adherence to ethical principles by upholding truth in all undertakings"
        ]
    },
    {
        name: '2. MAKATAO',
        behaviors: [
            "Is sensitive to individual, social and cultural differences; resists stereotyping people",
            "Demonstrates contributions toward solidarity"
        ]
    },
    {
        name: '3. MAKA\nKALIKASAN',
        behaviors: [
            "Cares for the environment and utilizes resources wisely, judiciously and economically"
        ]
    },
    {
        name: '4. MAKABANSA',
        behaviors: [
            "Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen",
            "Demonstrates appropriate behavior in carrying out activities in the school, community and country"
        ]
    },
];



function computeStudentGrades(
    student: Student, 
    sectionObj: Section, 
    subjects: Subject[], 
    gradingSheetRecords: ClassRecord[], 
    schoolYear: string, 
    schoolProfile?: SchoolProfile,
    subjectSelections?: Record<number, string>
) {
    const grades: Record<string, number[]> = {};
    const gradeLevelNum = parseInt(sectionObj.section_grade_level.replace(/\D/g, '')) || 0;
    // Determine the base list of subjects for SF9
    // 1. Get DB subjects for this section
    let sectionDbSubjects = subjects.filter(s => s.section_id === sectionObj.id);
    
    // 2. If none, get DB subjects for this grade level
    if (sectionDbSubjects.length === 0) {
        sectionDbSubjects = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            return !s.section_id && subjectGradeNum === gradeLevelNum;
        });
    }

    let baseSubjects: { name: string; isHeader?: boolean; isComponent?: boolean; isReserved?: boolean }[] = [];

    if (sectionDbSubjects.length > 0) {
        // Use DB Subjects
        baseSubjects = sectionDbSubjects.map(s => ({ name: s.subject_name }));
        
        // Ensure MAPEH Header exists if missing but components exist
        const hasMapehHeader = sectionDbSubjects.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');
        const hasMapehComponents = sectionDbSubjects.some(s => {
            const n = normalizeSubjectName(s.subject_name);
            return n.includes('musicandarts') || n.includes('musicarts') || 
                   n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth');
        });

        if (hasMapehComponents && !hasMapehHeader) {
            baseSubjects.push({ name: 'MAPEH', isHeader: true });
        }
    } else {
        // Fallback to Curriculum
        baseSubjects = getSF9SubjectsForGrade(gradeLevelNum, schoolProfile?.curriculum);
    }

    // Build the final order for SF9 display
    let currentSubjects: any[] = [];
    
    // If we have manual selections, use them to build the list
    if (subjectSelections && Object.keys(subjectSelections).length > 0) {
        for (let i = 0; i < 13; i++) {
            const selectedId = subjectSelections[i];
            if (selectedId && selectedId !== 'none') {
                const subject = subjects.find(s => s.id === selectedId);
                if (subject) {
                    currentSubjects.push({ name: subject.subject_name, id: subject.id });
                    
                    // Automatically add components if it's MAPEH
                    if (normalizeSubjectName(subject.subject_name) === 'mapeh') {
                        const components = subjects.filter(s => {
                            // Check if it's a section-specific subject OR a generic subject for this grade level
                            const isGenericMatch = !s.section_id && (parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0') === gradeLevelNum);
                            const isDirectMatch = s.section_id === sectionObj.id;
                            if (!isGenericMatch && !isDirectMatch) return false;

                            const n = normalizeSubjectName(s.subject_name);
                            return n.includes('musicandarts') || n.includes('musicarts') || 
                                   n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth');
                        });
                        components.forEach(c => currentSubjects.push({ name: c.subject_name, id: c.id, isComponent: true }));
                    }
                } else {
                    currentSubjects.push({ name: `reserved_extra_${i}`, isReserved: true } as any);
                }
            } else {
                currentSubjects.push({ name: `reserved_extra_${i}`, isReserved: true } as any);
            }
        }
    } else {
        // 1. Sort base subjects according to standard priority
        const sortedBase = sortSubjects(baseSubjects, s => s.name);
        
        // 2. Identify and group MAPEH
        const mapehHeader = sortedBase.find(s => normalizeSubjectName(s.name) === 'mapeh');
        const mapehComponents = sortedBase.filter(s => {
            const n = normalizeSubjectName(s.name);
            return n !== 'mapeh' && (
                n.includes('musicandarts') || n.includes('musicarts') || 
                n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth')
            );
        });

        // 3. Construct final list
        sortedBase.forEach(s => {
            const n = normalizeSubjectName(s.name);
            const isComponent = mapehComponents.some(c => c.name === s.name);
            
            // Skip components here, we'll insert them after the header
            if (isComponent) return;

            currentSubjects.push(s);

            // If this is the MAPEH header, insert components immediately after
            if (n === 'mapeh') {
                mapehComponents.forEach(c => currentSubjects.push({ ...c, isComponent: true }));
            }
        });

        // 4. Padding for table consistency
        while (currentSubjects.length < 13) {
            currentSubjects.push({ name: `reserved_extra_${currentSubjects.length}`, isReserved: true } as any);
        }
    }

    const getSubjectGrades = (subjectName: string) => {
        const normalizedTarget = normalizeSubjectName(subjectName);
        
        // Find ALL matching subjects and average them (to handle potential duplicates or components)
        const matchingSubjects = sectionDbSubjects.filter(s => {
            const normalizedDb = normalizeSubjectName(s.subject_name);
            if (normalizedDb === normalizedTarget) return true;
            
            // Fuzzy matches (using normalized strings for comparison)
            if (normalizedTarget.includes('aralingpanlipunan') && (normalizedDb === 'ap' || normalizedDb.includes('panlipunan'))) return true;
            if (normalizedTarget.includes('technologyandlivelihood') && (normalizedDb === 'tle' || normalizedDb.includes('livelihood'))) return true;
            if (normalizedTarget.includes('valueseducation') && (normalizedDb === 'esp' || normalizedDb.includes('pagpapakatao'))) return true;
            if (normalizedTarget.includes('edukasyonsapagpapakatao') && (normalizedDb === 'values' || normalizedDb.includes('valueseducation'))) return true;
            
            // MAPEH Component fuzzy matches
            if (normalizedTarget.includes('musicandarts') && (normalizedDb.includes('musicandarts') || normalizedDb.includes('musicarts'))) return true;
            if (normalizedTarget.includes('physicaleducationandhealth') && (normalizedDb.includes('physicaleducation') || normalizedDb.includes('peandhealth') || normalizedDb.includes('pehealth'))) return true;
            
            return false;
        });

        if (matchingSubjects.length > 0) {
            const getQuarterAverage = (q: 1 | 2 | 3) => {
                const results: number[] = [];
                matchingSubjects.forEach(subject => {
                    const r = gradingSheetRecords.find(rec =>
                        rec.student_lrn === student.lrn &&
                        rec.subject_id === subject.id &&
                        rec.school_year === schoolYear &&
                        Number(rec.quarter) === q
                    );
                    if (r && r.final_grade && Number(r.final_grade) > 0) {
                        results.push(Number(r.final_grade));
                    }
                });
                return results.length > 0 ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : 0;
            };
            return [getQuarterAverage(1), getQuarterAverage(2), getQuarterAverage(3)];
        }
        return [0, 0, 0];
    };

    // Pre-calculate MAPEH components for the Final Average row
    const musicArtsGrades = getSubjectGrades('Music and Arts');
    const peHealthGrades = getSubjectGrades('Physical Education and Health');
    const mapehFinalGrades = [0, 1, 2].map(qIdx => {
        const ma = musicArtsGrades[qIdx] || 0;
        const pe = peHealthGrades[qIdx] || 0;
        if (ma > 0 && pe > 0) return Math.round((ma + pe) / 2);
        if (ma > 0) return ma;
        if (pe > 0) return pe;
        return 0;
    });

    currentSubjects.forEach(sf9Subject => {
        if (normalizeSubjectName(sf9Subject.name) === 'mapeh') {
            // MAPEH Header shows the average of components
            grades[sf9Subject.name] = mapehFinalGrades;
        } else {
            grades[sf9Subject.name] = getSubjectGrades(sf9Subject.name);
        }
    });

    return { subjects: currentSubjects, grades };
}

function calculateGeneralAverage(grades: Record<string, number[]>) {
    let total = 0;
    let count = 0;
    Object.keys(grades).forEach(key => {
        const norm = normalizeSubjectName(key);
        // Exclude components from the average count (they are part of MAPEH)
        const isComponent = norm.includes('musicandarts') || norm.includes('musicarts') || 
                           norm.includes('physicaleducationandhealth') || norm.includes('peandhealth') || norm.includes('pehealth');
        const isExcluded = key.startsWith('*') || 
                          key.toLowerCase().includes('arabic language') || 
                          key.toLowerCase().includes('islamic values');

        // Exclude reserved rows, components, and specific excluded subjects
        if (!key.startsWith('reserved_extra') && !isComponent && !isExcluded) {
            const gradeRow = grades[key] || [0, 0, 0];
            const finalGrade = calculateFinalGrade(gradeRow);
            if (finalGrade > 0) {
                total += finalGrade;
                count++;
            }
        }
    });
    return count > 0 ? Math.round(total / count) : 0;
}

function computeStudentValues(student: Student, observedValues: ObservedValues[], schoolYear: string) {
    const values: Record<string, string[]> = {};
    CORE_VALUES.forEach(cv => {
        const rawValues: string[] = [];
            cv.behaviors.forEach((_, bIdx) => {
            const key = `${cv.name}_${bIdx}`;
            const getQ = (q: number) => observedValues.find(v => v.student_lrn === student.lrn && v.school_year === schoolYear && v.quarter === q)?.values[key] || '';
                rawValues.push(getQ(1), getQ(2), getQ(3));
        });
        values[cv.name] = rawValues;
    });
    return values;
}

function computeStudentAttendance(student: Student, sf2Sheets: SF2Sheet[], schoolYear: string, sectionObj?: Section) {
    const months = ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'];
    const schoolDays: number[] = [];
    const daysPresent: number[] = [];
    const daysAbsent: number[] = [];

    months.forEach(month => {
        // Aggressive fuzzy match by section name/id, month (full or abbr), and school year
        const sheet = sf2Sheets.find(s => {
            const sId = s.section_id?.toString().toLowerCase().trim();
            const targetId = sectionObj?.id?.toString().toLowerCase().trim();
            const targetName = sectionObj?.section_name?.toString().toLowerCase().trim();
            
            const sectionMatch = (sId === targetId) || 
                                 (sId === targetName) || 
                                 (sId && targetName?.includes(sId)) || 
                                 (targetName && sId?.includes(targetName));
            
            const sMonth = s.month?.toString().toUpperCase().trim();
            const targetMonth = month.toUpperCase();
            const targetMonthAbbr = month.substring(0, 3).toUpperCase();
            
            // Numeric month mapping (1=JAN, 6=JUNE, etc.) and 0-indexed month mapping
            const MONTH_MAP: Record<string, string> = {
                '1': 'JANUARY', '2': 'FEBRUARY', '3': 'MARCH', '4': 'APRIL', '5': 'MAY', '6': 'JUNE',
                '7': 'JULY', '8': 'AUGUST', '9': 'SEPTEMBER', '10': 'OCTOBER', '11': 'NOVEMBER', '12': 'DECEMBER'
            };
            const mappedMonth = sMonth ? MONTH_MAP[sMonth] : null;
            const monthIdx = months.indexOf(month);
            
            const monthMatch = sMonth === targetMonth || 
                               sMonth === targetMonthAbbr || 
                               (sMonth && targetMonth.startsWith(sMonth)) ||
                               (mappedMonth === targetMonth) ||
                               (sMonth === monthIdx.toString()) ||
                               (sMonth === (monthIdx + 1).toString());
            
            // Lenient year match (e.g., "2026" should match "2026-2027")
            const sYear = s.school_year?.toString().trim();
            const targetYear = schoolYear?.toString().trim();
            const yearMatch = sYear === targetYear || 
                               (sYear && targetYear?.includes(sYear)) || 
                               (targetYear && sYear?.includes(targetYear?.substring(0, 4)));
            
            return sectionMatch && monthMatch && yearMatch;
        });

        if (sheet) {
            const dateLabels = sheet.date_labels || {};
            
            // Aggressive fuzzy LRN match
            const targetLRN = student.lrn.toString().trim().toLowerCase();
            const attendanceKeys = Object.keys(sheet.attendance || {});
            const matchedKey = attendanceKeys.find(k => k.toString().trim().toLowerCase() === targetLRN);
            const studentAttendance = matchedKey ? sheet.attendance[matchedKey] : {};
            
            let mAbsent = 0;
            let mFilled = 0;

            // Get all days that have a valid date label (this defines a school day)
            const dayKeys = Object.keys(dateLabels);
            dayKeys.forEach(dayKey => {
                const label = dateLabels[dayKey as any];
                if (label && label.toString().trim() !== '') {
                    mFilled++;
                    
                    // Check student's status for this specific school day
                    const status = studentAttendance[dayKey as any];
                    const normalizedStatus = (status || '').toString().toLowerCase().trim();
                    
                    // Standard DEPED absence markers
                    if (normalizedStatus === 'absent' || normalizedStatus === 'x' || normalizedStatus === 'a') {
                        mAbsent++;
                    }
                }
            });
            
            schoolDays.push(mFilled);
            daysAbsent.push(mAbsent);
            daysPresent.push(Math.max(0, mFilled - mAbsent));
        } else {
            // Push -1 or null to signify "no data found" vs "zero data"
            schoolDays.push(-1);
            daysPresent.push(-1);
            daysAbsent.push(-1);
        }
    });

    const sumFilter = (arr: number[]) => arr.filter(v => v >= 0).reduce((a, b) => a + b, 0);
    const hasAnyData = schoolDays.some(v => v >= 0);

    const totalSchoolDays = hasAnyData ? sumFilter(schoolDays) : -1;
    const totalPresent = hasAnyData ? sumFilter(daysPresent) : -1;
    const totalAbsent = hasAnyData ? sumFilter(daysAbsent) : -1;

    return {
        months: [...months.map(m => m.substring(0, 3)), 'TOTAL'],
        schoolDays: [...schoolDays, totalSchoolDays],
        daysPresent: [...daysPresent, totalPresent],
        daysAbsent: [...daysAbsent, totalAbsent]
    };
}

function calculateFinalGrade(quarterGrades: number[]): number {
    if (quarterGrades.length !== 3 || !quarterGrades.every(g => g > 0)) return 0;
    return Math.round(quarterGrades.reduce((a, b) => a + b, 0) / 3);
}

function getRemarks(grade: number): string {
    if (grade <= 0) return '';
    return grade >= 75 ? 'Passed' : 'Failed';
}

function getGeneralAverageRemarks(genAvg: number): string[] {
    if (genAvg <= 0) return [''];
    if (genAvg < 75) return ['Retained'];
    if (genAvg <= 89) return ['Promoted'];
    if (genAvg <= 94) return ['Promoted', 'With Honors'];
    if (genAvg <= 97) return ['Promoted', 'With High Honors'];
    return ['Promoted', 'With Highest Honors'];
}

interface SF9ExactDocumentProps {
    student: Student;
    schoolName: string;
    schoolYear: string;
    section: string;
    region: string;
    division: string;
    district: string;
    adviser: string;
    principal: string;
    principalTitle: string;
    grades: Record<string, number[]>;
    subjects: any[];
    observedValues: Record<string, string[]>;
    attendance: {
        months: string[];
        schoolDays: number[];
        daysPresent: number[];
        daysAbsent: number[];
    };
    pageSize: 'A4' | 'LETTER';
    logoUrl: string;
    schoolProfile?: SchoolProfile;
    printMode?: SF9PrintMode;
}

function SF9Pages({
    student, schoolName, schoolYear, section, region, division, district,
    adviser, principal, principalTitle, grades, subjects: currentSubjects, observedValues, attendance, pageSize, logoUrl, schoolProfile, printMode = 'full'
}: SF9ExactDocumentProps) {

    // Print mode helpers
    const isValuesOnly = printMode === 'term2' || printMode === 'term3';
    const transparentBorder = '#FFFFFF';
    const borderColor = isValuesOnly ? transparentBorder : '#000';

    // Determine which term columns to show values for
    const showTermValue = (termIndex: number): boolean => {
        if (printMode === 'full') return true;
        if (printMode === 'term1') return termIndex === 0;
        if (printMode === 'term2') return termIndex === 1;
        if (printMode === 'term3') return termIndex === 2;
        return true;
    };

    // Whether to show final grade & remarks (only in full or term3)
    const showFinalAndRemarks = printMode === 'full' || printMode === 'term3';

    // Filter attendance months by term
    const getAttendanceValue = (idx: number, value: number): number | string => {
        if (value < 0) return '';
        if (printMode === 'full') return value;
        const monthAbbr = attendance.months[idx];
        if (monthAbbr === 'TOTAL') return '';
        const termKey = printMode;
        const termMonths = TERM_MONTHS[termKey] || [];
        return termMonths.includes(monthAbbr) ? value : '';
    };

    // Recalculate attendance total for current term
    const getTermTotal = (dataArr: number[]) => {
        // If we are in T1 or T2, the user wants the total column blank
        if (printMode === 'term1' || printMode === 'term2') return '';

        // For Full and Term 3, show the GRAND TOTAL (T1+T2+T3)
        // We exclude the last element because it's the pre-calculated total
        const monthsOnly = dataArr.slice(0, -1);
        const total = monthsOnly.filter(v => v >= 0).reduce((a, b) => a + b, 0);
        
        // If no data at all, return blank instead of 0
        const hasAnyData = monthsOnly.some(v => v >= 0);
        return hasAnyData ? total : '';
    };

    return (
        <>
            <Page size={pageSize} orientation="landscape" style={styles.page}>
                <View style={styles.page1Container}>
                    <View style={styles.leftColumn}>
                        <Text style={[styles.attendanceTitle, isValuesOnly ? { color: transparentBorder } : {}]}>REPORT ON ATTENDANCE</Text>
                        <View style={[styles.attendanceTable, isValuesOnly ? { borderColor: transparentBorder } : {}]}>
                            <View style={[styles.attHeaderRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                <View style={[styles.attLabelCell, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder } : {}}> </Text></View>
                                {attendance.months.map((month, idx) => (
                                    <View key={idx} style={[idx === attendance.months.length - 1 ? styles.attDataCellLast : styles.attMonthCell, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                        <Text style={isValuesOnly ? { color: transparentBorder } : {}}>{month}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={[styles.attRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                <View style={[styles.attLabelCell, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>No. of school{'\n'}days</Text></View>
                                {attendance.schoolDays.map((days, idx) => {
                                    const isTotal = idx === attendance.schoolDays.length - 1;
                                    const val = isTotal ? getTermTotal(attendance.schoolDays) : getAttendanceValue(idx, days);
                                    return (
                                        <View key={idx} style={[isTotal ? styles.attDataCellLast : styles.attDataCell, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text>{val !== '' ? val : ''}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                            <View style={[styles.attRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                <View style={[styles.attLabelCell, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>No. of days{'\n'}present</Text></View>
                                {attendance.daysPresent.map((days, idx) => {
                                    const isTotal = idx === attendance.daysPresent.length - 1;
                                    const val = isTotal ? getTermTotal(attendance.daysPresent) : getAttendanceValue(idx, days);
                                    return (
                                        <View key={idx} style={[isTotal ? styles.attDataCellLast : styles.attDataCell, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text>{val !== '' ? val : ''}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                            <View style={[styles.attRowLast, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                <View style={[styles.attLabelCell, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>No. of days{'\n'}absent</Text></View>
                                {attendance.daysAbsent.map((days, idx) => {
                                    const isTotal = idx === attendance.daysAbsent.length - 1;
                                    const val = isTotal ? getTermTotal(attendance.daysAbsent) : getAttendanceValue(idx, days);
                                    return (
                                        <View key={idx} style={[isTotal ? styles.attDataCellLast : styles.attDataCell, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text>{val !== '' ? val : ''}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                        <View style={styles.parentSection}>
                            <Text style={[styles.parentTitle, isValuesOnly ? { color: transparentBorder } : {}]}>PARENT/GUARDIAN'S SIGNATURE</Text>
                            {[{ num: '1', suffix: 'st' }, { num: '2', suffix: 'nd' }, { num: '3', suffix: 'rd' }].map((quarter, idx) => (
                                <View key={idx} style={[styles.signatureRow, isValuesOnly ? { borderColor: transparentBorder } : {}]}>
                                    <Text style={[styles.quarterLabel, isValuesOnly ? { color: transparentBorder } : {}]}>{quarter.num}<Text style={{ fontSize: 7, verticalAlign: 'super' }}>{quarter.suffix}</Text>{' Term'}</Text>
                                    <View style={[styles.signatureLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.rightColumn}>
                        <Text style={[styles.sf9Label, isValuesOnly ? { color: transparentBorder } : {}]}>SF9-JHS</Text>
                        <View style={[styles.headerContainer, isValuesOnly ? { opacity: 0 } : {}]}>
                            <Image src={`${import.meta.env.BASE_URL}deped_logo_left.png`} style={styles.logo} />
                            <View style={styles.headerCenter}>
                                <Text style={styles.headerText}>Republic of the Philippines</Text>
                                <Text style={styles.headerText}>DEPARTMENT OF EDUCATION</Text>
                                <Text style={styles.headerText}>{region}</Text>
                                <Text style={styles.headerText}>{division}</Text>
                                <Text style={styles.headerText}>{district}</Text>
                            </View>
                            <Image src={logoUrl || `${import.meta.env.BASE_URL}deped_logo_right.png`} style={styles.logo} />
                        </View>
                        <Text style={[styles.schoolName, isValuesOnly ? { color: transparentBorder } : {}]}>{schoolName}</Text>
                        <Text style={[styles.reportTitle, isValuesOnly ? { color: transparentBorder } : {}]}>LEARNER'S PROGRESS REPORT CARD</Text>
                        <View style={[styles.studentInfoGrid, isValuesOnly ? { opacity: 0 } : {}]}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Name:</Text>
                                <Text style={styles.infoValue}>{student.last_name}, {student.first_name} {student.middle_name}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>LRN:</Text>
                                <Text style={styles.infoValue}>{student.lrn}</Text>
                                <Text style={styles.infoLabelRight}>Gender:</Text>
                                <Text style={styles.infoValueShort}>{student.gender}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Age:</Text>
                                <Text style={styles.infoValue}>{student.age || ''}</Text>
                                <Text style={styles.infoLabelRight}>Section:</Text>
                                <Text style={styles.infoValueShort}>{section}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Grade:</Text>
                                <Text style={styles.infoValue}>{student.grade_level.replace('Grade ', '')}</Text>
                                <Text style={styles.infoLabelRight}>School Year:</Text>
                                <Text style={styles.infoValueShort}>{schoolYear}</Text>
                            </View>
                        </View>
                        <Text style={[{ marginTop: 20, textAlign: 'left', fontSize: 10, fontWeight: 'bold' }, isValuesOnly ? { color: transparentBorder } : {}]}>Dear Parents:</Text>
                        <Text style={[{ marginTop: 10, textAlign: 'justify', lineHeight: 1.4, fontSize: 9 }, isValuesOnly ? { color: transparentBorder } : {}]}>
                            This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values.
                        </Text>
                        <Text style={[{ marginTop: 5, textAlign: 'justify', fontSize: 9 }, isValuesOnly ? { color: transparentBorder } : {}]}>
                            The school welcomes you should you desire to know more about your child's progress.
                        </Text>
                        <View style={[{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }, isValuesOnly ? { opacity: 0 } : {}]}>
                            <View style={{ width: '45%', alignItems: 'center' }}>
                                <Text style={{ borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: 10, marginBottom: 2 }}>{principal?.toUpperCase()}</Text>
                                <Text style={{ fontSize: 9 }}>{principalTitle || 'Secondary School Principal I'}</Text>
                            </View>
                            <View style={{ width: '45%', alignItems: 'center' }}>
                                <Text style={{ borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: 10, marginBottom: 2 }}>{adviser?.toUpperCase()}</Text>
                                <Text style={{ fontSize: 9 }}>Teacher Adviser</Text>
                            </View>
                        </View>
                        <View style={[styles.transferSection, isValuesOnly ? { borderTopColor: transparentBorder } : {}]}>
                            <Text style={[styles.transferTitle, isValuesOnly ? { color: transparentBorder } : {}]}>CERTIFICATE OF TRANSFER</Text>
                            <View style={styles.transferRow}>
                                <Text style={[styles.transferLabel, isValuesOnly ? { color: transparentBorder } : {}]}>Admitted to Grade:</Text>
                                <View style={[styles.transferLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                                <Text style={[styles.transferLabel, { width: 60, marginLeft: 15 }, isValuesOnly ? { color: transparentBorder } : {}]}>Section:</Text>
                                <View style={[styles.transferLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                            </View>
                            <View style={styles.transferRow}>
                                <Text style={[styles.transferLabel, isValuesOnly ? { color: transparentBorder } : {}]}>Eligible for Admission to Grade:</Text>
                                <View style={[styles.transferLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                            </View>
                            <View style={[styles.transferRow, { marginTop: 15 }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                <Text style={[styles.transferLabel, isValuesOnly ? { color: transparentBorder } : {}]}>Approved:</Text>
                            </View>
                            <View style={[styles.signatureLineBottom, { marginTop: 25 }, isValuesOnly ? { opacity: 0 } : {}]}>
                                <View style={styles.signatureBlock}>
                                    <Text style={styles.signatureName}></Text>
                                    <Text style={styles.signatureTitle}>{principalTitle || 'Secondary School Principal I'}</Text>
                                </View>
                                <View style={styles.signatureBlock}>
                                    <Text style={styles.signatureName}></Text>
                                    <Text style={styles.signatureTitle}>Teacher Adviser</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>

            <Page size={pageSize} orientation="landscape" style={styles.page}>
                <View style={styles.page2Container}>
                    <View style={styles.page2Left}>
                        <Text style={[styles.attendanceTitle, { fontSize: 11 }, isValuesOnly ? { color: transparentBorder } : {}]}>REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</Text>
                        <View style={[styles.lpTable, isValuesOnly ? { borderColor: transparentBorder } : {}]}>
                            <View style={[styles.lpHeaderRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                <View style={[styles.lpHeaderCell, { width: '36%', borderBottomWidth: 0, alignItems: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>LEARNING AREAS</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '30%', padding: 0 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                    <View style={{ borderBottomWidth: 1, borderColor: borderColor, padding: 2, alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>TERM</Text></View>
                                    <View style={{ flexDirection: 'row', flex: 1 }}>
                                        <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>1</Text></View>
                                        <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>2</Text></View>
                                        <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>3</Text></View>
                                    </View>
                                </View>
                                <View style={[styles.lpHeaderCell, { width: '11%', borderBottomWidth: 0 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>FINAL GRADE</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '23%', borderBottomWidth: 0, borderRightWidth: 0 }]}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>REMARKS</Text></View>
                            </View>
                            {currentSubjects.map((subj, idx) => {
                                const gradeRow = grades[subj.name] || [0, 0, 0];
                                const finalGrade = calculateFinalGrade(gradeRow);
                                const isReserved = (subj as any).isReserved;
                                return (
                                    <View key={idx} style={[styles.lpRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <View style={[styles.lpCell, { width: '36%', paddingLeft: subj.isComponent ? 15 : 4 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}> 
                                            <Text style={{ fontWeight: subj.isComponent ? 'normal' : 'bold', fontSize: (subj.name && subj.name.length > 35) ? 7 : 8.5, ...(isValuesOnly ? { color: transparentBorder } : {}) }}>
                                                {isReserved ? '' : subj.name}
                                            </Text>
                                        </View>
                                        <View style={[styles.lpCell, { width: '30%', padding: 0 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text>{showTermValue(0) ? (gradeRow[0] || '') : ''}</Text></View>
                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text>{showTermValue(1) ? (gradeRow[1] || '') : ''}</Text></View>
                                                <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text>{showTermValue(2) ? (gradeRow[2] || '') : ''}</Text></View>
                                            </View>
                                        </View>
                                        <View style={[styles.lpCell, { width: '11%', textAlign: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text>{showFinalAndRemarks ? (finalGrade || '') : ''}</Text></View>
                                        <View style={[styles.lpCellLast, { width: '23%', textAlign: 'center' }]}><Text>{showFinalAndRemarks ? getRemarks(finalGrade) : ''}</Text></View>
                                    </View>
                                );
                            })}
                            <View style={[styles.lpRow, { borderBottomWidth: 0 }, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                <View style={[styles.lpCell, { width: '36%', alignItems: 'flex-end', paddingRight: 5 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={{ fontWeight: 'bold', ...(isValuesOnly ? { color: transparentBorder } : {}) }}>General Average</Text></View>
                                <View style={[styles.lpCell, { width: '30%' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text></Text></View>
                                <View style={[styles.lpCell, { width: '11%', textAlign: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text>{showFinalAndRemarks ? (calculateGeneralAverage(grades) || '') : ''}</Text></View>
                                <View style={[styles.lpCellLast, { width: '23%', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }]}>
                                    {showFinalAndRemarks ? getGeneralAverageRemarks(calculateGeneralAverage(grades)).map((line, i) => (
                                        <Text key={i} style={{ fontSize: 7, lineHeight: 1.2 }}>{line}</Text>
                                    )) : <Text></Text>}
                                </View>
                            </View>
                        </View>
                        <View style={styles.legendContainer}>
                            <Text style={[styles.attendanceTitle, isValuesOnly ? { color: transparentBorder } : {}]}>Descriptors & Grading Scale</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                <View style={{ width: '40%' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2, ...(isValuesOnly ? { color: transparentBorder, borderBottomColor: transparentBorder } : {}) }}>Descriptors</Text></View>
                                <View style={{ width: '30%', alignItems: 'center' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2, ...(isValuesOnly ? { color: transparentBorder, borderBottomColor: transparentBorder } : {}) }}>Grading Scale</Text></View>
                                <View style={{ width: '30%', alignItems: 'center' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2, ...(isValuesOnly ? { color: transparentBorder, borderBottomColor: transparentBorder } : {}) }}>Remarks</Text></View>
                            </View>
                            {[
                                { desc: 'Advancing (Namumukod-tangi)', scale: '90-100', rem: 'Passed' },
                                { desc: 'Benchmarking (Napamamalas)', scale: '80-89', rem: 'Passed' },
                                { desc: 'Connecting (Natutungo)', scale: '75-79', rem: 'Passed' },
                                { desc: 'Developing (Napauunlad)', scale: '65-74', rem: 'Failed' },
                                { desc: 'Emerging (Nasisimula)', scale: '0-64', rem: 'Failed' },
                            ].map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                    <View style={{ width: '40%' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>{item.desc}</Text></View>
                                    <View style={{ width: '30%', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>{item.scale}</Text></View>
                                    <View style={{ width: '30%', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>{item.rem}</Text></View>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.page2Right}>
                        <Text style={[styles.attendanceTitle, { fontSize: 11 }, isValuesOnly ? { color: transparentBorder } : {}]}>REPORT ON LEARNER'S OBSERVED VALUES</Text>
                        <View style={[styles.ovTable, isValuesOnly ? { borderColor: transparentBorder } : {}]}>
                            <View style={[styles.ovHeaderRow, { height: 30 }, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                <View style={[styles.lpHeaderCell, { width: '26%', borderBottomWidth: 0, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 4 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>CORE VALUES</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '40%', borderBottomWidth: 0, justifyContent: 'center', alignItems: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>BEHAVIOR STATEMENTS</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '34%', padding: 0, borderRightWidth: 0 }]}>
                                    <View style={{ borderBottomWidth: 1, borderColor: borderColor, padding: 2, alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>TERM</Text></View>
                                    <View style={{ flexDirection: 'row', flex: 1 }}>
                                        <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>1</Text></View>
                                        <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>2</Text></View>
                                        <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>3</Text></View>
                                    </View>
                                </View>
                            </View>
                            {CORE_VALUES.map((cv, cvIdx) => {
                                const grades = observedValues[cv.name] || [];
                                return (
                                    <View key={cvIdx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: borderColor, flex: cv.behaviors.length * 0.5 }}>
                                        <View style={[styles.ovCell, { width: '26%', borderRightWidth: 1, borderBottomWidth: 0, justifyContent: 'center', textAlign: 'left', paddingLeft: 4, padding: 2 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text style={isValuesOnly ? { color: transparentBorder } : {}}>{cv.name}</Text>
                                        </View>
                                        <View style={{ width: '74%', flexDirection: 'column' }}>
                                            {cv.behaviors.map((behavior, bIdx) => {
                                                const isLastBehavior = bIdx === cv.behaviors.length - 1;
                                                return (
                                                    <View key={bIdx} style={{ flexDirection: 'row', borderBottomWidth: isLastBehavior ? 0 : 1, borderColor: borderColor, flex: 1 }}>
                                                        <View style={{ width: '54%', padding: 2, fontSize: 9, borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center' }}>
                                                            <Text style={isValuesOnly ? { color: transparentBorder } : {}}>{behavior}</Text>
                                                        </View>
                                                        <View style={{ width: '46%', padding: 0 }}>
                                                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text>{showTermValue(0) ? (grades[bIdx * 3 + 0] || '') : ''}</Text></View>
                                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text>{showTermValue(1) ? (grades[bIdx * 3 + 1] || '') : ''}</Text></View>
                                                                <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text>{showTermValue(2) ? (grades[bIdx * 3 + 2] || '') : ''}</Text></View>
                                                            </View>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                        <View style={[styles.legendContainer, { marginTop: -5 }]}>
                            <Text style={[styles.attendanceTitle, isValuesOnly ? { color: transparentBorder } : {}]}>Non-numerical Rating</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                <View style={{ width: '30%' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2, ...(isValuesOnly ? { color: transparentBorder, borderBottomColor: transparentBorder } : {}) }}>Marking</Text></View>
                                <View style={{ width: '70%' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2, ...(isValuesOnly ? { color: transparentBorder, borderBottomColor: transparentBorder } : {}) }}>Non-numerical Rating</Text></View>
                            </View>
                            {[
                                { mark: 'AO', rating: 'Always Observed' },
                                { mark: 'SO', rating: 'Sometimes Observed' },
                                { mark: 'RO', rating: 'Rarely Observed' },
                                { mark: 'NO', rating: 'Not Observed' },
                            ].map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                    <View style={{ width: '30%' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>{item.mark}</Text></View>
                                    <View style={{ width: '70%' }}><Text style={isValuesOnly ? { color: transparentBorder } : {}}>{item.rating}</Text></View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </Page>
        </>
    );
}

function SF9ExactDocument(props: SF9ExactDocumentProps) {
    return (
        <Document>
            <SF9Pages {...props} />
        </Document>
    );
}

interface SF9BatchDocumentProps {
    students: Student[];
    sections: Section[];
    sectionObj: Section;
    subjects: Subject[];
    gradingSheetRecords: ClassRecord[];
    schoolProfile: SchoolProfile;
    activeSchoolYear: string;
    observedValues: ObservedValues[];
    sf2Sheets: SF2Sheet[];
    adviser: string;
    pageSize: 'A4' | 'LETTER';
    printMode?: SF9PrintMode;
    subjectSelections?: Record<number, string>;
}

const SF9PagesMemo = React.memo(SF9Pages);

function SF9BatchDocument({
    students, sections, sectionObj, subjects, gradingSheetRecords, schoolProfile, activeSchoolYear, observedValues, sf2Sheets, adviser, pageSize, printMode = 'full', subjectSelections
}: SF9BatchDocumentProps) {
    return (
        <Document title={`SF9 Batch - ${sectionObj.section_name}`}>
            {students.map((student) => {
                const { subjects: computedSubjects, grades } = computeStudentGrades(student, sectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile, subjectSelections);
                const values = computeStudentValues(student, observedValues, activeSchoolYear);
                const attendance = computeStudentAttendance(student, sf2Sheets, activeSchoolYear, sectionObj);
                
                // Resolve student's section name (supports both ID and name stored in student_section)
                const resolvedSection = sections.find(s => s.id === student.student_section || s.section_name === student.student_section);
                const sectionName = resolvedSection?.section_name || sectionObj.section_name;

                return (
                    <SF9PagesMemo 
                        key={student.lrn}
                        student={student}
                        schoolName={schoolProfile.name}
                        schoolYear={activeSchoolYear}
                        section={sectionName}
                        region={schoolProfile.region}
                        division={schoolProfile.division}
                        district={schoolProfile.district}
                        adviser={adviser}
                        principal={schoolProfile.head_name || ''}
                        principalTitle={schoolProfile.head_position || 'Secondary School Principal I'}
                        grades={grades}
                        subjects={computedSubjects}
                        observedValues={values}
                        attendance={attendance}
                        pageSize={pageSize}
                        logoUrl={schoolProfile.logo_url || ''}
                        schoolProfile={schoolProfile}
                        printMode={printMode}
                    />
                );
            })}
        </Document>
    );
}

export function SF9Page() {

    const { students, sections, schoolProfile, activeSchoolYear, gradingSheetRecords, subjects, observedValues, sf2Sheets, updateObservedValue, setCurrentView, teachers } = useAppStore();
    const { user } = useAuthStore();

    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [pageSize, setPageSize] = useState<'A4' | 'LETTER'>('A4');
    const [isValuesModalOpen, setIsValuesModalOpen] = useState(false);
    const [modalQuarter, setModalQuarter] = useState<1 | 2 | 3>(1);
    const teacherList: User[] = teachers;
    const [isBatchReady, setIsBatchReady] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [batchProgress, setBatchProgress] = useState(0);
    const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [isStabilizing, setIsStabilizing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
    const [printMode, setPrintMode] = useState<SF9PrintMode>('full');
    const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stabilizationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Local state for Evaluated Values to prevent lag
    const [pendingChanges, setPendingChanges] = useState<Record<number, Record<string, string>>>({});

    // Optimized PDF Generation Hook
    const [batchInstance, updateBatchInstance] = usePDF({ document: undefined });

    const filteredSections = useMemo(() => {
        return [...filterSF9Sections(user, sections)].sort((a, b) => {
            const getGN = (g: string) => parseInt(g.match(/\d+/)?.[0] || '999');
            const gA = getGN(a.section_grade_level);
            const gB = getGN(b.section_grade_level);
            return gA !== gB ? gA - gB : a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user]);

    const groupedSections = useMemo(() => {
        const groups: Record<string, any[]> = {
            'ELEMENTARY': [],
            'JUNIOR HIGH SCHOOL': [],
            'SENIOR HIGH SCHOOL': []
        };
        
        filteredSections.forEach(s => {
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
    }, [filteredSections]);

    // Auto-select advisory section first, then fallback to first available
    useEffect(() => {
        if (!selectedSection && filteredSections.length > 0) {
            const advisory = filteredSections.find(s => {
                const legacy = 'is_advisory_class' in s ? (s as { is_advisory_class?: boolean }).is_advisory_class : false;
                return s.is_advisory || !!legacy;
            });
            // Defer update to avoid direct setState-in-effect lint violation.
            setTimeout(() => setSelectedSection(advisory ? advisory.id : filteredSections[0].id), 0);
        }
    }, [filteredSections, selectedSection]);

    const selectedSectionObj = useMemo(() => sections.find(s => s.id === selectedSection), [sections, selectedSection]);
    const adviserName = useMemo(() => {
        const fromProfile = (schoolProfile?.adviser_name || '').trim();
        const isGenericProfile = fromProfile.toLowerCase() === 'admin' || fromProfile === '';

        // Source of Truth: If profile has a real name, use it!
        if (!isGenericProfile && fromProfile) return fromProfile;

        const t = teacherList.find(t => t.uid === selectedSectionObj?.adviser_id);
        if (t?.displayName) return t.displayName;

        const fromSection = (selectedSectionObj?.adviser_name || '').trim();
        const isPlaceholder = fromSection.toLowerCase().includes('juan') || fromSection.toLowerCase().includes('recovered');
        
        if (fromSection && !isPlaceholder && fromSection.toLowerCase() !== 'tba') {
            return fromSection;
        }

        return fromProfile || '';
    }, [selectedSectionObj, teacherList, schoolProfile.adviser_name]);

    // Derived subject selections from section metadata
    const currentSubjectSelections = useMemo(() => {
        if (!selectedSectionObj) return {};
        return selectedSectionObj.section_metadata?.sf9SubjectSelections || {};
    }, [selectedSectionObj]);

    const handleUpdateLayout = async (selections: Record<number, string>) => {
        if (!selectedSectionObj) return;
        
        try {
            const updatedSection = {
                ...selectedSectionObj,
                section_metadata: {
                    ...selectedSectionObj.section_metadata,
                    sf9SubjectSelections: selections
                }
            };
            await useAppStore.getState().updateSection(updatedSection);
            setIsLayoutModalOpen(false);
            useAppStore.getState().showNotification('SF9 subject layout saved', 'success');
        } catch (error) {
            console.error('Failed to save layout:', error);
            useAppStore.getState().showNotification('Failed to save layout', 'error');
        }
    };

    const studentValues = useMemo(() => {
        if (!selectedStudent) return {};
        const values: Record<string, string[]> = {};
        CORE_VALUES.forEach(cv => {
            const raw: string[] = [];
            cv.behaviors.forEach((_, bIdx) => {
                const key = `${cv.name}_${bIdx}`;
                const getQ = (q: number) => observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === q)?.values[key] || '';
                raw.push(getQ(1), getQ(2), getQ(3));
            });
            values[cv.name] = raw;
        });
        return values;
    }, [selectedStudent, observedValues, activeSchoolYear]);

    const sectionStudents = useMemo(() => {
        if (!selectedSectionObj) return [];
        return students.filter(s => s.student_section === selectedSectionObj.section_name || s.student_section === selectedSectionObj.id);
    }, [students, selectedSectionObj]);

    const males = useMemo(() => sectionStudents.filter(s => s.gender === 'Male').sort((a, b) => a.last_name.localeCompare(b.last_name)), [sectionStudents]);
    const females = useMemo(() => sectionStudents.filter(s => s.gender === 'Female').sort((a, b) => a.last_name.localeCompare(b.last_name)), [sectionStudents]);

    const studentGrades = useMemo(() => {
        if (!selectedStudent || !selectedSectionObj) return { subjects: [], grades: {} };
        return computeStudentGrades(selectedStudent, selectedSectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile, currentSubjectSelections);
    }, [selectedStudent, selectedSectionObj, gradingSheetRecords, activeSchoolYear, subjects, schoolProfile, currentSubjectSelections]);

    const singleDocument = useMemo(() => {
        if (!selectedStudent || !selectedSectionObj) return null;
        
        const attendance = computeStudentAttendance(selectedStudent, sf2Sheets, activeSchoolYear, selectedSectionObj);

        const studentResolvedSection = sections.find(s => s.id === selectedStudent.student_section || s.section_name === selectedStudent.student_section);
        const resolvedSectionName = studentResolvedSection?.section_name || selectedSectionObj.section_name;

        return (
            <SF9ExactDocument 
                student={selectedStudent} 
                schoolName={schoolProfile.name} 
                schoolYear={activeSchoolYear} 
                section={resolvedSectionName} 
                region={schoolProfile.region} 
                division={schoolProfile.division} 
                district={schoolProfile.district} 
                adviser={adviserName} 
                principal={schoolProfile.head_name || ''} 
                principalTitle={schoolProfile.head_position || 'Secondary School Principal I'} 
                grades={studentGrades.grades || {}} 
                subjects={studentGrades.subjects || []}
                observedValues={studentValues} 
                attendance={attendance}
                pageSize={pageSize} 
                logoUrl={schoolProfile.logo_url || ''}
                schoolProfile={schoolProfile}
                printMode={printMode}
            />
        );
    }, [selectedStudent, selectedSectionObj, schoolProfile, activeSchoolYear, adviserName, studentGrades, studentValues, sf2Sheets, pageSize, sections, printMode]);

    const handlePrint = async () => {
        if (!selectedStudent || !singleDocument) return;
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(singleDocument).toBlob();
            const url = URL.createObjectURL(blob);
            
            // Create a hidden iframe for direct printing
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);
            
            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow?.print();
                    // Clean up after some time to allow print dialog to finish
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                            URL.revokeObjectURL(url);
                        }
                    }, 5000);
                }, 500);
            };
        } catch (error) {
            console.error('Print failed:', error);
        }
    };

    // Override Ctrl+P to use the official print engine
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                handlePrint();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [singleDocument, selectedStudent, handlePrint]);

    const handlePrintBatch = () => {
        if (!batchInstance.url) return;
        const win = window.open(batchInstance.url, '_blank');
        if (win) {
            win.addEventListener('load', () => {
                win.print();
            });
        }
    };

    const batchDocument = useMemo(() => {
        if (!isGeneratingBatch || !selectedSectionObj || sectionStudents.length === 0) return null;
        const sortedStudents = [...males, ...females];
        return (
            <Document title={`SF9 Batch - ${selectedSectionObj.section_name}`}>
                {sortedStudents.map((student) => {
                    const { subjects: compSubjects, grades } = computeStudentGrades(student, selectedSectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile, currentSubjectSelections);
                    const values = computeStudentValues(student, observedValues, activeSchoolYear);
                    const attendance = computeStudentAttendance(student, sf2Sheets, activeSchoolYear, selectedSectionObj);
                    
                    const resolvedSection = sections.find(s => s.id === student.student_section || s.section_name === student.student_section);
                    const sectionName = resolvedSection?.section_name || selectedSectionObj.section_name;

                    return (
                        <SF9PagesMemo 
                            key={student.lrn}
                            student={student}
                            schoolName={schoolProfile.name}
                            schoolYear={activeSchoolYear}
                            section={sectionName}
                            region={schoolProfile.region}
                            division={schoolProfile.division}
                            district={schoolProfile.district}
                            adviser={adviserName}
                            principal={schoolProfile.head_name || ''}
                            principalTitle={schoolProfile.head_position || 'Secondary School Principal I'}
                            grades={grades}
                            subjects={compSubjects}
                            observedValues={values}
                            attendance={attendance}
                            pageSize={pageSize}
                            logoUrl={schoolProfile.logo_url || ''}
                            schoolProfile={schoolProfile}
                            printMode={printMode}
                        />
                    );
                })}
            </Document>
        );
    }, [isGeneratingBatch, sectionStudents, selectedSectionObj, subjects, gradingSheetRecords, schoolProfile, activeSchoolYear, observedValues, sf2Sheets, adviserName, pageSize, sections, males, females, currentSubjectSelections, printMode]);

    useEffect(() => {
        if (isGeneratingBatch && batchDocument) {
            updateBatchInstance(batchDocument);
        }
    }, [isGeneratingBatch, batchDocument, updateBatchInstance]);

    // Handle Generation Progress & Completion
    useEffect(() => {
        if (isGeneratingBatch) {
            if (batchInstance.loading && batchProgress === 0) {
                if (!progressTimerRef.current) {
                    progressTimerRef.current = setInterval(() => {
                        setBatchProgress(prev => {
                            if (prev >= 95) return prev;
                            if (prev < 20) return prev + 1;
                            return prev + (Math.random() * 0.3);
                        });
                    }, 200);
                }
            } else if (!batchInstance.loading && batchInstance.url && batchProgress > 0 && !isStabilizing && !showCompletionModal) {
                setTimeout(() => {
                    setIsStabilizing(true);
                    setBatchProgress(98);
                }, 0);
                
                if (progressTimerRef.current) {
                    clearInterval(progressTimerRef.current);
                    progressTimerRef.current = null;
                }

                if (!stabilizationTimerRef.current) {
                    stabilizationTimerRef.current = setTimeout(() => {
                        setBatchProgress(100);
                        setShowCompletionModal(true);
                        setIsStabilizing(false);
                        stabilizationTimerRef.current = null;
                    }, 800); 
                }
            }
        } else {
            // Immediate cleanup
            if (batchProgress !== 0) setTimeout(() => setBatchProgress(0), 0);
            if (isStabilizing) setTimeout(() => setIsStabilizing(false), 0);
        }
    }, [batchInstance.loading, batchInstance.url, isGeneratingBatch, batchProgress, isStabilizing, showCompletionModal]);

    const handleCommitValues = async () => {
        if (!selectedStudent || Object.keys(pendingChanges).length === 0) {
            setIsValuesModalOpen(false);
            return;
        }

        const quarters = Object.keys(pendingChanges).map(Number);
        
        for (const q of quarters) {
            const changesForQ = pendingChanges[q];
            if (!changesForQ || Object.keys(changesForQ).length === 0) continue;

            const existing = observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === q);
            
            const newValue: ObservedValues = {
                id: existing?.id || `ov_${selectedStudent.lrn}_${activeSchoolYear}_${q}_${Date.now()}`,
                student_lrn: selectedStudent.lrn,
                school_year: activeSchoolYear,
                quarter: q as 1 | 2 | 3,
                values: { ...(existing?.values || {}), ...changesForQ }
            };
            
            // Fire and forget most updates, we trust the optimistic store
            void updateObservedValue(newValue);
        }
        
        setPendingChanges({});
        setIsValuesModalOpen(false);
    };

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechRate, setSpeechRate] = useState(2.5);
    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        if (!selectedStudent || !studentGrades.subjects) return;

        const utterance = new SpeechSynthesisUtterance();
        
        // 1. Name: LAST NAME, FIRST NAME MIDDLE NAME
        const fullName = `${selectedStudent.last_name.toUpperCase()}, ${selectedStudent.first_name.toUpperCase()} ${selectedStudent.middle_name?.toUpperCase() || ''}`.trim();
        
        // 2. LRN: Dashed format for digit-by-digit reading
        const dashedLRN = selectedStudent.lrn.split('').join('-');
        
        let textToSpeak = `${fullName}. `;
        textToSpeak += `LRN: ${dashedLRN}. `;

        // 3. Subjects & Grades: Subject Name 1st, 2nd, 3rd, Final
        studentGrades.subjects.forEach((subj: any) => {
            if (subj.isReserved) return;
            
            const gradeRow = studentGrades.grades[subj.name] || [0, 0, 0];
            const finalGrade = calculateFinalGrade(gradeRow);
            
            // Custom Pronunciation for Subjects
            let displayName = subj.name;
            const normName = normalizeSubjectName(subj.name);
            
            if (normName.includes('aralingpanlipunan') || normName === 'ap') {
                displayName = "A.P.";
            } else if (normName.includes('technologyandlivelihood') || normName === 'tle') {
                displayName = "T L E";
            } else if (normName === 'mapeh') {
                displayName = "MAH-peh";
            } else if (normName === 'edukasyonsapagpapakatao' || normName === 'esp') {
                displayName = "E S P";
            }
            
            // Only read if there is at least one grade
            if (gradeRow.some(g => g > 0) || finalGrade > 0) {
                textToSpeak += `${displayName}: ${gradeRow[0] || 0}, ${gradeRow[1] || 0}, ${gradeRow[2] || 0}, ${finalGrade || 0}. `;
            }
        });

        // 4. General Average + Remarks
        const genAvg = calculateGeneralAverage(studentGrades.grades);
        if (genAvg > 0) {
            const remarksLines = getGeneralAverageRemarks(genAvg);
            const remarksText = remarksLines.filter(l => l).join(', ');
            textToSpeak += `General Average: ${genAvg}. ${remarksText}.`;
        }

        utterance.text = textToSpeak;
        utterance.rate = speechRate; // Dynamic rate
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    // Cleanup speech on unmount
    useEffect(() => {
      return () => {
        window.speechSynthesis.cancel();
      };
    }, []);

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans">
             {/* Sticky Premium Top Toolbar */}
             <div className="h-20 px-6 flex items-center justify-between z-[100] bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm relative print:hidden shrink-0">
                <div className="flex items-center gap-5">
                    {/* Brand/Back Hook */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setCurrentView('main')}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-0.5">SF9 Report</h2>
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.1em]">Progress Report</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1.5" />

                    <div className="flex items-center gap-2">
                        {filteredSections.length > 1 && (
                            <select 
                                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                value={selectedSection}
                                onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudent(null); setIsBatchReady(false); }}
                            >
                                <option value="">Section</option>
                                {Object.entries(groupedSections).map(([group, groupSections]) => (
                                    groupSections.length > 0 && (
                                        <optgroup key={group} label={group}>
                                            {groupSections.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.section_grade_level} - {s.section_name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )
                                ))}
                            </select>
                        )}

                        {!isBatchReady && (
                            <select 
                                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer min-w-[150px] disabled:opacity-30"
                                value={selectedStudent?.lrn || ''}
                                onChange={(e) => setSelectedStudent(students.find(s => s.lrn === e.target.value) || null)}
                                disabled={!selectedSection}
                            >
                                <option value="">Select Student</option>
                                {males.length > 0 && (
                                    <optgroup label="MALE">
                                        {males.map(s => <option key={s.lrn} value={s.lrn}>{s.last_name}, {s.first_name}</option>)}
                                    </optgroup>
                                )}
                                {females.length > 0 && (
                                    <optgroup label="FEMALE">
                                        {females.map(s => <option key={s.lrn} value={s.lrn}>{s.last_name}, {s.first_name}</option>)}
                                    </optgroup>
                                )}
                            </select>
                        )}

                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setIsBatchReady(false)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!isBatchReady ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Indiv
                            </button>
                            <button
                                onClick={() => { setIsBatchReady(true); setSelectedStudent(null); }}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isBatchReady ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Batch
                            </button>
                        </div>

                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 ml-1">
                            <button
                                onClick={() => setPrintMode('full')}
                                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${printMode === 'full' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Full
                            </button>
                            {['term1', 'term2', 'term3'].map((m, i) => (
                                <button
                                    key={m}
                                    onClick={() => setPrintMode(m as any)}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${printMode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    T{i + 1}
                                </button>
                            ))}
                        </div>

                        {selectedStudent && !isBatchReady && (
                            <button
                                onClick={() => { setPendingChanges({}); setIsValuesModalOpen(true); }}
                                className="h-8 px-2.5 rounded-xl bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-1.5 shadow-sm ml-1"
                            >
                                <Edit3 className="w-3 h-3" />
                                Values
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setPageSize('A4')}
                            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${pageSize === 'A4' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            A4
                        </button>
                        <button
                            onClick={() => setPageSize('LETTER')}
                            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${pageSize === 'LETTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            LTR
                        </button>
                    </div>

                    <button
                        onClick={() => setIsLayoutModalOpen(true)}
                        className="h-8 px-2.5 rounded-xl bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:border-blue-400 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <Settings2 className="w-3 h-3" />
                        Layout
                    </button>

                    <div className="flex items-center gap-2 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] font-black text-slate-900 w-10 text-center tabular-nums">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button 
                            onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="h-10 w-px bg-slate-200" />

                    {selectedStudent && (
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-xl shadow-sm">
                                <button 
                                    onClick={() => setSpeechRate(prev => Math.max(0.5, prev - 0.1))}
                                    className="w-6 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    title="Slower"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-[9px] font-black text-slate-600 w-10 text-center tabular-nums uppercase">
                                    {speechRate.toFixed(1)}x
                                </span>
                                <button 
                                    onClick={() => setSpeechRate(prev => Math.min(3.0, prev + 0.1))}
                                    className="w-6 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    title="Faster"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>

                            <button
                                onClick={handleSpeak}
                                className={`h-9 px-3 rounded-xl border transition-all flex items-center gap-2 shadow-sm ${isSpeaking ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'}`}
                                title={isSpeaking ? "Stop Reading" : "Read Grades Aloud"}
                            >
                                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                <span className="text-[9px] font-black uppercase tracking-widest">{isSpeaking ? 'Stop' : 'Read'}</span>
                            </button>
                        </div>
                    )}

                    {!isBatchReady && singleDocument && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="h-9 px-4 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                <Printer className="w-4 h-4" />
                                Print SF9
                            </button>
                            <PDFDownloadLink
                                document={singleDocument}
                                fileName={`SF9_${selectedSectionObj?.section_name || 'Record'}_${selectedStudent?.last_name || 'Student'}_${activeSchoolYear}.pdf`}
                                className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center"
                                title="Download PDF"
                            >
                                <Download className="w-4 h-4" />
                            </PDFDownloadLink>
                        </div>
                    )}
                </div>
             </div>

             {/* Workspace Viewer Area */}
             <div className="flex-1 overflow-auto bg-slate-100 relative custom-scrollbar">
                <div className="w-full min-h-full flex flex-col items-center justify-start py-10 px-10 relative">
                    {selectedStudent && singleDocument && !isBatchReady ? (
                        <div 
                            className="transition-all duration-700 ease-out origin-top flex flex-col items-center"
                            style={{ transform: `scale(${zoom})`, height: 'calc(100vh - 200px)' }}
                        >
                             <div className="w-full h-full min-w-[1122px] min-h-[793px] bg-white rounded-sm border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden relative group">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                                <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none w-full h-full">
                                    {singleDocument!}
                                </PDFViewer>
                            </div>
                        </div>
                    ) : (isBatchReady && selectedSectionObj) ? (
                        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-8 py-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-[2rem] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mx-auto relative z-10 transform -rotate-6">
                                    <Printer className="w-10 h-10 text-white" />
                                </div>
                                <div className="absolute inset-x-0 -bottom-3 h-6 bg-blue-900/10 blur-xl rounded-full scale-110" />
                            </div>
                            
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Batch Generation Center</h2>
                                <p className="text-lg text-slate-500 font-medium">Preparing official SF9 records for <span className="text-blue-600 font-bold">{selectedSectionObj.section_name}</span></p>
                            </div>

                            <div className="w-full max-w-xl bg-white rounded-[2rem] border border-slate-200/60 shadow-xl p-8 space-y-6">
                                {batchProgress > 0 && (
                                    <div className="space-y-4">
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                                            <motion.div 
                                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${batchProgress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                            <span className={batchProgress === 100 ? 'text-emerald-600 animate-pulse' : 'text-blue-600'}>
                                                {isStabilizing ? 'Main-thread recovering...' : batchProgress >= 95 ? 'Finishing PDF...' : 'Compiling Student Data...'}
                                            </span>
                                            <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{Math.round(batchProgress)}%</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 text-left space-y-2">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <Layout className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Students</div>
                                            <div className="text-2xl font-black text-slate-900">{sectionStudents.length}</div>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 text-left space-y-2">
                                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Layout</div>
                                            <div className="text-2xl font-black text-slate-900 text-nowrap">{pageSize === 'A4' ? 'A4' : 'Letter'} Landscape</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!isGeneratingBatch && (
                                <motion.button
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    onClick={() => {
                                        startTransition(() => {
                                            setIsGeneratingBatch(true);
                                        });
                                        setBatchProgress(5);
                                    }}
                                    disabled={isPending}
                                    className={`px-8 py-3.5 rounded-xl text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-3 mt-4 ${isPending ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-blue-500/30'}`}
                                >
                                    {isPending ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Printer className="w-4 h-4" />
                                    )}
                                    {isPending ? 'Preparing Engine...' : 'Start Generation'}
                                </motion.button>
                            )}

                            <div className="flex items-center justify-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-white/50 px-4 py-2 rounded-full border border-slate-200/50">
                                <Settings className="w-3.5 h-3.5 animate-spin-slow" />
                                <span>Optimization active: Workspace preview disabled</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10">
                            <div className="relative group">
                                <div className="absolute -inset-20 bg-indigo-500/5 blur-[120px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-1000" />
                                <div className="relative w-56 h-56 bg-white rounded-[4rem] border border-slate-200 flex items-center justify-center transform group-hover:rotate-6 hover:scale-105 transition-all duration-700 shadow-xl">
                                    <FileText className="w-24 h-24 text-slate-100 drop-shadow-[0_0_10px_rgba(0,0,0,0.02)]" />
                                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all duration-500">
                                        <span className="text-3xl font-black text-white italic tracking-tighter">SF9</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Ready to Generate</h2>
                                <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60">
                                    Select a learner or switch to batch mode from the top toolbar to prepare progress reports.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
             </div>

            {/* Observed Values Modal */}
            <AnimatePresence>
                {isValuesModalOpen && selectedStudent && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-[#0f172a]/80 backdrop-blur-md"
                        onClick={handleCommitValues}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[3rem] w-full max-w-6xl h-full max-h-[92vh] overflow-hidden flex flex-col shadow-3xl border border-slate-200"
                        >
                            {/* Modal Header */}
                            <div className="px-12 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-8">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                                        <Edit3 className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Evaluate Values</h2>
                                        <div className="flex items-center gap-3 mt-2.5">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-indigo-100">{selectedStudent.lrn}</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedStudent.last_name}, {selectedStudent.first_name}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handleCommitValues}
                                    className="w-12 h-12 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all group"
                                >
                                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>

                            {/* Quarter Selection Bar */}
                            <div className="px-12 py-4 bg-white border-b border-slate-50 flex items-center gap-3 shrink-0 overflow-x-auto no-scrollbar">
                                {[1, 2, 3].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setModalQuarter(q as 1 | 2 | 3)}
                                        className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2rem] transition-all whitespace-nowrap ${modalQuarter === q ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        Term {q}
                                    </button>
                                ))}
                            </div>

                            {/* Evaluation Grid */}
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/20">
                                <div className="max-w-5xl mx-auto space-y-12">
                                    {CORE_VALUES.map((cv) => (
                                        <div key={cv.name} className="space-y-6">
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{cv.name}</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                {cv.behaviors.map((behavior, bIdx) => {
                                                    const key = `${cv.name}_${bIdx}`;
                                                    const pendingForQ = pendingChanges[modalQuarter]?.[key];
                                                    const currentRating = pendingForQ !== undefined 
                                                        ? pendingForQ 
                                                        : observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === modalQuarter)?.values[key] || '';
                                                    
                                                    return (
                                                        <div key={bIdx} className="bg-white p-6 rounded-2.5xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                                <p className="text-sm font-bold text-slate-600 leading-relaxed max-w-2xl">
                                                                    {behavior}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    {[
                                                                        { val: 'AO', label: 'AO', color: 'bg-emerald-500', desc: 'Always Observed' },
                                                                        { val: 'SO', label: 'SO', color: 'bg-indigo-500', desc: 'Sometimes Observed' },
                                                                        { val: 'RO', label: 'RO', color: 'bg-amber-500', desc: 'Rarely Observed' },
                                                                        { val: 'NO', label: 'NO', color: 'bg-rose-500', desc: 'Not Observed' }
                                                                    ].map((opt) => (
                                                                        <button
                                                                            key={opt.val}
                                                                            onClick={() => {
                                                                                setPendingChanges(prev => ({
                                                                                    ...prev,
                                                                                    [modalQuarter]: {
                                                                                        ...(prev[modalQuarter] || {}),
                                                                                        [key]: opt.val
                                                                                    }
                                                                                }));
                                                                            }}
                                                                            className={`w-12 h-12 rounded-xl font-black text-[10px] transition-all relative ${currentRating === opt.val ? `${opt.color} text-white shadow-lg scale-110 z-10` : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}
                                                                            title={opt.desc}
                                                                        >
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Information */}
                             <div className="px-12 py-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                    {Object.keys(pendingChanges).length > 0 ? `${Object.values(pendingChanges).reduce((acc, q) => acc + Object.keys(q).length, 0)} changes pending` : 'No changes made'}
                                 </span>
                                <button 
                                    onClick={handleCommitValues}
                                    className="px-10 h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    Finish
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Completion Modal */}
            <AnimatePresence>
                {showCompletionModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCompletionModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center space-y-6"
                        >
                            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                                <Download className="w-10 h-10" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Batch Ready!</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    The SF9 records for <span className="text-blue-600 font-bold">{selectedSectionObj?.section_name}</span> has been successfully generated and is ready for download.
                                </p>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                {batchInstance.url && (
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                handlePrintBatch();
                                                setShowCompletionModal(false);
                                                setIsGeneratingBatch(false);
                                                setBatchProgress(0);
                                            }}
                                            className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-[12px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Print Official Batch
                                        </button>
                                        <a
                                            href={batchInstance.url}
                                            download={`SF9_BATCH_${selectedSectionObj?.section_name || 'Record'}_${activeSchoolYear}.pdf`}
                                            onClick={() => {
                                                setShowCompletionModal(false);
                                                setIsGeneratingBatch(false);
                                                setBatchProgress(0);
                                            }}
                                            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-[12px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Official PDF
                                        </a>
                                    </div>
                                )}
                                <button 
                                    onClick={() => {
                                        setShowCompletionModal(false);
                                        setIsGeneratingBatch(false);
                                        setBatchProgress(0);
                                    }}
                                    className="w-full py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-[12px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isLayoutModalOpen && (
                    <SF9LayoutModal 
                        isOpen={isLayoutModalOpen}
                        onClose={() => setIsLayoutModalOpen(false)}
                        currentSelections={currentSubjectSelections}
                        subjects={subjects.filter(s => s.section_id === selectedSectionObj?.id)}
                        onSave={handleUpdateLayout}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface LayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSelections: Record<number, string>;
    subjects: Subject[];
    onSave: (selections: Record<number, string>) => Promise<void>;
}

function SF9LayoutModal({ isOpen, onClose, currentSelections, subjects, onSave }: LayoutModalProps) {
    const [localSelections, setLocalSelections] = useState<Record<number, string>>(currentSelections);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(localSelections);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Configure SF9 Subject Order</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Select subjects for each of the 13 slots</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 13 }).map((_, idx) => {
                            const slotNum = idx;
                            return (
                                <div key={slotNum} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all bg-slate-50/30">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400 shrink-0">
                                        {slotNum + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <select
                                            value={localSelections[slotNum] || 'none'}
                                            onChange={(e) => {
                                                setLocalSelections(prev => ({ ...prev, [slotNum]: e.target.value }));
                                            }}
                                            className="w-full bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 focus:outline-none p-0 cursor-pointer"
                                        >
                                            <option value="none">-- Reserved Row --</option>
                                            {subjects.map(subj => (
                                                <option key={subj.id} value={subj.id}>{subj.subject_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <button 
                        onClick={() => setLocalSelections({})}
                        className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all"
                    >
                        Clear All
                    </button>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            {isSaving ? 'Saving...' : 'Save & Apply Layout'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
