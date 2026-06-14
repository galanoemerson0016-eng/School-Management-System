import React, { useState, useMemo, useEffect, useRef, useTransition, useCallback } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image, Font, usePDF } from '@react-pdf/renderer';
Font.registerHyphenationCallback(word => [word]);

const base = import.meta.env.BASE_URL || '/';
const fontPath = `${base.endsWith('/') ? base : base + '/'}fonts`;

try {
    Font.register({ family: 'BookmanOldStyle', src: `${fontPath}/BOOKOS.TTF` });
    Font.register({ family: 'BookmanOldStyle-Bold', src: `${fontPath}/BOOKOSB.TTF` });
    Font.register({ family: 'BookmanOldStyle-Italic', src: `${fontPath}/BOOKOSI.TTF` });
    Font.register({ family: 'BookmanOldStyle-BoldItalic', src: `${fontPath}/BOOKOSBI.TTF` });
} catch (e) {
    console.error('Failed to register Bookman Old Style fonts:', e);
}

import { useAppStore, useAuthStore } from '../stores';
import type { Student, User, Section, Subject, ClassRecord, ObservedValues, SF2Sheet, SchoolProfile } from '../types';
import { db } from '../services/database';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Printer, FileText, Layout, Download, Edit3, Settings, Settings2, X, Plus, Minus, Volume2, VolumeX, ChevronDown, Clock3 } from 'lucide-react';
import { filterSF9Sections } from '../lib/rbac';
import { formatGradeForDisplay } from '../lib/grading';
import { formatLearnerName } from '../utils/student-name';
const isKeyStage1 = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('grade')) {
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        return num >= 1 && num <= 3;
    }
    return false;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const SF2_MONTHS = ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'] as const;

const normalizeSectionToken = (value?: string | number) =>
    (value ?? '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizeMonthToken = (value?: string | number): string | null => {
    const raw = (value ?? '').toString().trim().toUpperCase();
    if (!raw) return null;

    const numeric = Number.parseInt(raw, 10);
    if (!Number.isNaN(numeric)) {
        const byNumber: Record<number, string> = {
            1: 'JANUARY',
            2: 'FEBRUARY',
            3: 'MARCH',
            4: 'APRIL',
            5: 'MAY',
            6: 'JUNE',
            7: 'JULY',
            8: 'AUGUST',
            9: 'SEPTEMBER',
            10: 'OCTOBER',
            11: 'NOVEMBER',
            12: 'DECEMBER'
        };
        if (numeric >= 1 && numeric <= 12) return byNumber[numeric];
        if (numeric >= 0 && numeric <= 11) return byNumber[numeric + 1];
    }

    const compact = raw.replace(/[^A-Z]/g, '');
    for (const month of SF2_MONTHS) {
        if (compact === month || compact === month.slice(0, 3) || month.startsWith(compact)) {
            return month;
        }
    }

    return null;
};

const extractMonthFromSf2Id = (id?: string): string | null => {
    const normalizedId = (id ?? '').toString().trim().toUpperCase();
    if (!normalizedId) return null;
    const parts = normalizedId.split('_').filter(Boolean);
    if (parts.length === 0) return null;
    return normalizeMonthToken(parts[parts.length - 1]);
};

const SCHOOL_CALENDAR_2026_2027: Record<string, number[]> = {
    JUNE: [8, 9, 10, 11, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30],
    JULY: [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31],
    AUGUST: [3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 24, 25, 26, 27, 28],
    SEPTEMBER: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30],
    OCTOBER: [1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30],
    NOVEMBER: [3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27],
    DECEMBER: [1, 2, 3, 4, 7, 9, 10, 11, 14, 15, 16, 17, 18],
    JANUARY: [4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29],
    FEBRUARY: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26],
    MARCH: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 29, 30, 31],
    APRIL: [1, 2, 5, 6, 7, 8]
};

const SF2_TOTAL_COLUMNS = 25;
const SF2_DAYS = Array.from({ length: SF2_TOTAL_COLUMNS }, (_, i) => i + 1);

function buildDefaultSf2DateLabels(month: string, schoolYear: string): Record<number, string> {
    const labels: Record<number, string> = {};

    const monthMap: Record<string, number> = {
        JANUARY: 0,
        FEBRUARY: 1,
        MARCH: 2,
        APRIL: 3,
        MAY: 4,
        JUNE: 5,
        JULY: 6,
        AUGUST: 7,
        SEPTEMBER: 8,
        OCTOBER: 9,
        NOVEMBER: 10,
        DECEMBER: 11
    };

    const monthIndex = monthMap[month];
    if (monthIndex == null) return labels;

    const [startYearRaw, endYearRaw] = (schoolYear || '').split('-');
    const startYear = Number.parseInt(startYearRaw, 10);
    const endYear = Number.parseInt(endYearRaw, 10);
    const year = monthIndex >= 5
        ? (Number.isFinite(startYear) ? startYear : new Date().getFullYear())
        : (Number.isFinite(endYear) ? endYear : Number.isFinite(startYear) ? startYear + 1 : new Date().getFullYear());

    if (schoolYear === '2026-2027' && SCHOOL_CALENDAR_2026_2027[month]) {
        const calendarDays = SCHOOL_CALENDAR_2026_2027[month];
        const firstDateOfMonth = new Date(year, monthIndex, 1);
        const firstDayOffset = firstDateOfMonth.getDay() === 0 ? 6 : firstDateOfMonth.getDay() - 1;

        calendarDays.forEach((d) => {
            const dateObj = new Date(year, monthIndex, d);
            const dow = dateObj.getDay();

            if (dow >= 1 && dow <= 5) {
                const totalDaysFromMondayOfFirstWeek = d + firstDayOffset - 1;
                const weekIndex = Math.floor(totalDaysFromMondayOfFirstWeek / 7);
                const colIndex = (weekIndex * 5) + (dow - 1);

                if (colIndex >= 0 && colIndex < SF2_TOTAL_COLUMNS) {
                    labels[SF2_DAYS[colIndex]] = d.toString();
                }
            }
        });

        return labels;
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let firstSchoolDayDate = 0;
    let firstSchoolDayDow = 0;

    for (let d = 1; d <= 7; d++) {
        const date = new Date(year, monthIndex, d);
        const dow = date.getDay();
        if (dow >= 1 && dow <= 5) {
            firstSchoolDayDate = d;
            firstSchoolDayDow = dow;
            break;
        }
    }

    if (firstSchoolDayDate === 0) return labels;

    let currentIndex = firstSchoolDayDow - 1;
    for (let d = firstSchoolDayDate; d <= daysInMonth; d++) {
        const date = new Date(year, monthIndex, d);
        const dow = date.getDay();

        if (dow >= 1 && dow <= 5 && currentIndex < SF2_TOTAL_COLUMNS) {
            labels[SF2_DAYS[currentIndex]] = d.toString();
            currentIndex++;
        }
    }

    return labels;
}

// Term-to-month mapping for attendance
const TERM_MONTHS: Record<string, string[]> = {
    term1: ['JUN', 'JUL', 'AUG'],
    term2: ['SEP', 'OCT', 'NOV', 'DEC'],
    term3: ['JAN', 'FEB', 'MAR', 'APR'],
};

// SF9-JHS Official Template - Landscape Format
const styles = StyleSheet.create({
    page: { paddingTop: 30, paddingBottom: 40, paddingHorizontal: 30, fontSize: 10, fontFamily: 'BookmanOldStyle' },
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

    // SINGLE PAGE STYLES (for Grades 1-10)
    singlePage: { paddingTop: 10, paddingBottom: 10, paddingHorizontal: 15, fontSize: 9.5, fontFamily: 'BookmanOldStyle' },
    singleBorderWrapper: { borderWidth: 1, borderColor: '#000', paddingTop: 6, paddingBottom: 6, paddingHorizontal: 12, flex: 1, flexDirection: 'column' },
    singleContainer: { flexDirection: 'row', flex: 1 },
    singleLeftColumn: { width: '50%', paddingRight: 12, flexDirection: 'column', justifyContent: 'space-between' },
    singleRightColumn: { width: '50%', paddingLeft: 12, flexDirection: 'column', justifyContent: 'space-between' },
    
    singleHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    singleLogo: { width: 40, height: 40, borderRadius: 20 },
    singleHeaderCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
    singleHeaderText: { fontSize: 8.5, textAlign: 'center', marginBottom: 1 },
    singleReportTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
    singleSchoolYear: { fontSize: 10, textAlign: 'center', marginBottom: 6 },
    
    singleStudentInfoGrid: { marginBottom: 4 },
    singleInfoRow: { flexDirection: 'row', marginBottom: 1, alignItems: 'center', minHeight: 14 },
    singleInfoLabel: { fontSize: 8 },
    singleInfoValue: { borderBottomWidth: 1, borderBottomColor: '#000', fontSize: 8, paddingBottom: 1, paddingLeft: 4 },
    
    singleDearParents: { fontSize: 9, fontWeight: 'bold', marginBottom: 0, marginTop: 2 },
    singleMessageText: { fontSize: 8.5, lineHeight: 1.3, marginBottom: 3, textAlign: 'justify' },
    
    singleLpTable: { borderWidth: 1, borderColor: '#000', width: '100%', marginBottom: 3 },
    singleLpHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#FFFFFF', minHeight: 18 },
    singleLpRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', minHeight: 14.5 },
    singleLpCell: { borderRightWidth: 1, borderColor: '#000', paddingHorizontal: 4, paddingVertical: 1, fontSize: 8.5, justifyContent: 'center' },
    singleLpCellLast: { paddingHorizontal: 4, paddingVertical: 1, fontSize: 8.5, justifyContent: 'center' },
    singleLpHeaderCell: { borderRightWidth: 1, borderColor: '#000', padding: 1, fontSize: 8.5, fontWeight: 'bold', textAlign: 'center', justifyContent: 'center' },
    
    singleLegendContainer: { flexDirection: 'column', marginTop: 2, paddingLeft: 0, width: '96%', alignSelf: 'center' },
    singleLegendTitle: { fontWeight: 'bold', fontSize: 8.5, marginBottom: 2, textAlign: 'left' },

    singleAttendanceTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
    singleAttendanceTable: { borderWidth: 1, borderColor: '#000', marginBottom: 3 },
    singleAttHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 22 },
    singleAttRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 22 },
    singleAttRowLast: { flexDirection: 'row', minHeight: 22 },
    singleAttMonthCell: { width: '7.1%', borderRightWidth: 1, borderRightColor: '#000', padding: 1, fontSize: 6.5, textAlign: 'center', justifyContent: 'center' },
    singleAttLabelCell: { width: '14%', borderRightWidth: 1, borderRightColor: '#000', padding: 1, fontSize: 8, justifyContent: 'center' },
    singleAttDataCell: { width: '7.1%', borderRightWidth: 1, borderRightColor: '#000', padding: 1, fontSize: 8.5, textAlign: 'center', justifyContent: 'center' },
    singleAttDataCellLast: { width: '7.9%', padding: 1, fontSize: 8.5, textAlign: 'center', justifyContent: 'center' },

    singleCommentsContainer: { marginBottom: 2 },
    singleCommentsBox: { borderWidth: 1, borderColor: '#000', borderRadius: 2, flexDirection: 'column' },
    singleCommentTermRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', minHeight: 36, alignItems: 'flex-start', paddingTop: 2, paddingHorizontal: 4 },
    singleCommentTermRowLast: { flexDirection: 'row', minHeight: 36, alignItems: 'flex-start', paddingTop: 2, paddingHorizontal: 4 },
    singleCommentLabel: { width: '15%', fontSize: 9, fontWeight: 'bold' },
    singleCommentValue: { flex: 1, fontSize: 9 },

    singleSignaturesContainer: { marginBottom: 2, paddingHorizontal: 30 },
    singleSignatureRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'center' },
    singleSignatureLabel: { fontSize: 9, fontWeight: 'bold', width: 40 },
    singleSignatureLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', height: 20 },

    singleTransferSection: { paddingTop: 2, marginBottom: 2 },
    singleTransferTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
    singleTransferText: { fontSize: 8.5, lineHeight: 1.3, marginBottom: 2, textAlign: 'justify' },
    singleTransferRow: { flexDirection: 'row', marginBottom: 2, alignItems: 'center' },
    singleTransferLabel: { fontSize: 8.5, width: 110 },
    singleTransferLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', height: 10 },
    
    singleApprovedRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    singleApprovedSignatory: { width: '45%', alignItems: 'center' },
    singleApprovedLine: { borderBottomWidth: 1, borderBottomColor: '#000', width: '100%', height: 10 },
    singleApprovedLabel: { fontSize: 8.5, marginTop: 1, textAlign: 'center', fontWeight: 'bold' },

    singleCancellationSection: { paddingTop: 2 },
    singleCancellationTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
    singleCancellationRow: { flexDirection: 'row', marginBottom: 2, alignItems: 'center' },
    singleCancellationLabel: { fontSize: 8.5, width: 50 },
    singleCancellationLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', height: 10 },
    singleCancellationDateLabel: { fontSize: 8.5, width: 30, marginLeft: 15 },
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



interface SF9SubjectItem {
    name: string;
    id?: string;
    isHeader?: boolean;
    isComponent?: boolean;
    isReserved?: boolean;
}

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
    let sectionDbSubjects = subjects.filter(s => s.section_id === sectionObj.id && s.term !== 'none');
    
    // 2. If none, get DB subjects for this grade level
    if (sectionDbSubjects.length === 0) {
        sectionDbSubjects = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            return !s.section_id && subjectGradeNum === gradeLevelNum && s.term !== 'none';
        });
    }

    let baseSubjects: SF9SubjectItem[] = [];

    if (sectionDbSubjects.length > 0) {
        // Use DB Subjects
        baseSubjects = sectionDbSubjects.map(s => ({ name: s.subject_name, id: s.id }));
        
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
    const currentSubjects: SF9SubjectItem[] = [];
    
    const isSHS = gradeLevelNum === 11 || gradeLevelNum === 12;

    if (isSHS) {
        // Resolve target list of subjects
        const selectedSubjects: typeof baseSubjects = [];
        if (subjectSelections && Object.keys(subjectSelections).length > 0) {
            for (let i = 0; i < 13; i++) {
                const selectedId = subjectSelections[i];
                if (selectedId && selectedId !== 'none') {
                    const subject = subjects.find(s => s.id === selectedId);
                    if (subject) {
                        selectedSubjects.push({ name: subject.subject_name, id: subject.id });
                    }
                }
            }
        } else {
            selectedSubjects.push(...baseSubjects);
        }

        const isGrade12 = gradeLevelNum === 12;

        if (isGrade12) {
            const coresList: typeof baseSubjects = [];
            const appliedList: typeof baseSubjects = [];
            const specializedList: typeof baseSubjects = [];

            selectedSubjects.forEach(s => {
                if (s.isReserved || s.isHeader) return;
                const normName = s.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

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

                if (cores.some(c => {
                    const cNorm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return normName === cNorm || normName.includes(cNorm) || cNorm.includes(normName);
                })) {
                    coresList.push(s);
                } else if (applied.some(a => {
                    const aNorm = a.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return normName === aNorm || normName.includes(aNorm) || aNorm.includes(normName);
                })) {
                    appliedList.push(s);
                } else {
                    specializedList.push(s);
                }
            });

            const sortedCores = sortSubjects(coresList, s => s.name);
            const sortedApplied = sortSubjects(appliedList, s => s.name);
            const sortedSpecialized = sortSubjects(specializedList, s => s.name);

            if (sortedCores.length > 0) {
                currentSubjects.push({ name: 'Core Subjects', isHeader: true });
                sortedCores.forEach(s => currentSubjects.push(s));
            }
            if (sortedApplied.length > 0) {
                currentSubjects.push({ name: 'Applied Subjects', isHeader: true });
                sortedApplied.forEach(s => currentSubjects.push(s));
            }
            if (sortedSpecialized.length > 0) {
                currentSubjects.push({ name: 'Specialized Subjects', isHeader: true });
                sortedSpecialized.forEach(s => currentSubjects.push(s));
            }

            while (currentSubjects.length < 13) {
                currentSubjects.push({ name: `reserved_extra_${currentSubjects.length}`, isReserved: true });
            }
        } else {
            const coreSubjectsList: typeof baseSubjects = [];
            const electiveSubjectsList: typeof baseSubjects = [];

            selectedSubjects.forEach(s => {
                if (s.isReserved || s.isHeader) return;
                const norm = s.name.trim().toLowerCase();
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
                    coreSubjectsList.push(s);
                } else {
                     electiveSubjectsList.push(s);
                }
            });

            const commSubjs = coreSubjectsList.filter(s => {
                const n = normalizeSubjectName(s.name);
                return n === 'effectivecommunication' || n === 'mabisangkomunikasyon';
            });
            
            const otherCores = coreSubjectsList.filter(s => {
                const n = normalizeSubjectName(s.name);
                return n !== 'effectivecommunication' && n !== 'mabisangkomunikasyon';
            });

            const sortedOtherCores = sortSubjects(otherCores, s => s.name);
            const sortedElectives = sortSubjects(electiveSubjectsList, s => s.name);

            const finalCores: typeof baseSubjects = [];
            if (commSubjs.length > 0) {
                const effComm = commSubjs.find(s => normalizeSubjectName(s.name) === 'effectivecommunication');
                const mabKom = commSubjs.find(s => normalizeSubjectName(s.name) === 'mabisangkomunikasyon');
                
                finalCores.push({ name: 'Effective Communication / Mabisang Komunikasyon' });
                if (effComm) {
                    finalCores.push({ ...effComm, isComponent: true });
                }
                if (mabKom) {
                    finalCores.push({ ...mabKom, isComponent: true });
                }
            }
            finalCores.push(...sortedOtherCores);

            if (finalCores.length > 0) {
                currentSubjects.push({ name: 'Core Subjects', isHeader: true });
                finalCores.forEach(s => currentSubjects.push(s));
            }

            if (sortedElectives.length > 0) {
                currentSubjects.push({ name: 'Elective Subjects', isHeader: true });
                sortedElectives.forEach(s => currentSubjects.push({ name: s.name, id: s.id }));
            }

            while (currentSubjects.length < 13) {
                currentSubjects.push({ name: `reserved_extra_${currentSubjects.length}`, isReserved: true });
            }
        }
    } else if (subjectSelections && Object.keys(subjectSelections).length > 0) {
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
                    currentSubjects.push({ name: `reserved_extra_${i}`, isReserved: true });
                }
            } else {
                currentSubjects.push({ name: `reserved_extra_${i}`, isReserved: true });
            }
        }
    } else {
        // 1. Sort base subjects according to standard priority
        const sortedBase = sortSubjects(baseSubjects, s => s.name);
        
        // 2. Identify and group MAPEH
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
            currentSubjects.push({ name: `reserved_extra_${currentSubjects.length}`, isReserved: true });
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

    const effectiveCommGrades = getSubjectGrades('Effective Communication');
    const mabisangKomGrades = getSubjectGrades('Mabisang Komunikasyon');
    const parentCommGrades = [0, 1, 2].map(qIdx => {
        const ec = effectiveCommGrades[qIdx] || 0;
        const mk = mabisangKomGrades[qIdx] || 0;
        if (ec > 0 && mk > 0) return Math.round((ec + mk) / 2);
        if (ec > 0) return ec;
        if (mk > 0) return mk;
        return 0;
    });

    currentSubjects.forEach(sf9Subject => {
        const normName = normalizeSubjectName(sf9Subject.name);
        if (normName === 'mapeh') {
            // MAPEH Header shows the average of components
            grades[sf9Subject.name] = mapehFinalGrades;
        } else if (normName === 'effectivecommunicationmabisangkomunikasyon') {
            grades[sf9Subject.name] = parentCommGrades;
        } else {
            grades[sf9Subject.name] = getSubjectGrades(sf9Subject.name);
        }
    });

    return { subjects: currentSubjects, grades };
}

function calculateGeneralAverage(grades: Record<string, number[]>, currentSubjectsList: SF9SubjectItem[] = []) {
    let total = 0;
    let count = 0;
    const dbSubjects = useAppStore.getState().subjects;

    Object.keys(grades).forEach(key => {
        const norm = normalizeSubjectName(key);
        const subjItem = currentSubjectsList.find(s => s.name === key);
        
        // Exclude components from the average count (they are part of MAPEH or parent subjects)
        const isComponent = norm.includes('musicandarts') || norm.includes('musicarts') || 
                           norm.includes('physicaleducationandhealth') || norm.includes('peandhealth') || norm.includes('pehealth') ||
                           subjItem?.isComponent;
                           
        const isExcluded = key.startsWith('*') || 
                          key.toLowerCase().includes('arabic language') || 
                          key.toLowerCase().includes('islamic values');

        // Exclude category headers from the average
        if (
            subjItem?.name === 'Core Subjects' || 
            subjItem?.name === 'Electives' || 
            subjItem?.name === 'Elective Subjects' || 
            subjItem?.name === 'Applied Subjects' || 
            subjItem?.name === 'Specialized Subjects'
        ) return;

        // Exclude reserved rows, components, and specific excluded subjects
        if (!key.startsWith('reserved_extra') && !isComponent && !isExcluded) {
            const gradeRow = grades[key] || [0, 0, 0];
            
            // Find subject term
            const dbSubj = subjItem?.id 
                ? dbSubjects.find(s => s.id === subjItem.id) 
                : dbSubjects.find(s => s.subject_name.toLowerCase().trim() === key.toLowerCase().trim());
            const term = dbSubj?.term;
            if (term === 'none') return;

            const finalGrade = calculateFinalGrade(gradeRow, term, key);
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

    const SCHOOL_CALENDAR_2026_2027_COUNTS: Record<string, number> = {
        JUNE: 16,
        JULY: 23,
        AUGUST: 19,
        SEPTEMBER: 22,
        OCTOBER: 22,
        NOVEMBER: 19,
        DECEMBER: 13,
        JANUARY: 20,
        FEBRUARY: 20,
        MARCH: 21,
        APRIL: 6
    };

    const getFallbackSchoolDays = (monthName: string) => {
        if (schoolYear === '2026-2027' && SCHOOL_CALENDAR_2026_2027_COUNTS[monthName] != null) {
            return SCHOOL_CALENDAR_2026_2027_COUNTS[monthName];
        }

        const monthIndexMap: Record<string, number> = {
            JANUARY: 0,
            FEBRUARY: 1,
            MARCH: 2,
            APRIL: 3,
            MAY: 4,
            JUNE: 5,
            JULY: 6,
            AUGUST: 7,
            SEPTEMBER: 8,
            OCTOBER: 9,
            NOVEMBER: 10,
            DECEMBER: 11
        };

        const monthIndex = monthIndexMap[monthName];
        if (monthIndex == null) return 0;

        const [startYearRaw, endYearRaw] = (schoolYear || '').split('-');
        const startYear = Number.parseInt(startYearRaw, 10);
        const endYear = Number.parseInt(endYearRaw, 10);
        const resolvedYear = monthIndex >= 5
            ? (Number.isFinite(startYear) ? startYear : new Date().getFullYear())
            : (Number.isFinite(endYear) ? endYear : Number.isFinite(startYear) ? startYear + 1 : new Date().getFullYear());

        const daysInMonth = new Date(resolvedYear, monthIndex + 1, 0).getDate();
        let weekdays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dow = new Date(resolvedYear, monthIndex, day).getDay();
            if (dow >= 1 && dow <= 5) weekdays++;
        }
        return weekdays;
    };

    const normalizeText = (value?: string | number) => (value ?? '').toString().trim().toUpperCase();
    const normalizeSectionToken = (value?: string | number) =>
        (value ?? '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

    const monthByNumber: Record<number, string> = {
        1: 'JANUARY',
        2: 'FEBRUARY',
        3: 'MARCH',
        4: 'APRIL',
        5: 'MAY',
        6: 'JUNE',
        7: 'JULY',
        8: 'AUGUST',
        9: 'SEPTEMBER',
        10: 'OCTOBER',
        11: 'NOVEMBER',
        12: 'DECEMBER'
    };

    const normalizeMonthToken = (value?: string | number): string | null => {
        const raw = normalizeText(value);
        if (!raw) return null;

        const asNumber = Number.parseInt(raw, 10);
        if (!Number.isNaN(asNumber)) {
            if (asNumber >= 1 && asNumber <= 12) return monthByNumber[asNumber];
            if (asNumber >= 0 && asNumber <= 11) return monthByNumber[asNumber + 1];
        }

        const compact = raw.replace(/[^A-Z]/g, '');
        if (!compact) return null;

        for (const monthName of months) {
            if (compact === monthName) return monthName;
            if (compact === monthName.substring(0, 3)) return monthName;
            if (monthName.startsWith(compact) || compact.startsWith(monthName.substring(0, 3))) {
                return monthName;
            }
        }

        return null;
    };

    const extractMonthFromId = (id?: string): string | null => {
        const normalizedId = normalizeText(id);
        if (!normalizedId) return null;

        const parts = normalizedId.split('_').filter(Boolean);
        if (parts.length === 0) return null;

        return normalizeMonthToken(parts[parts.length - 1]);
    };

    const dbSections = useAppStore.getState().sections;
    const advisorySection = dbSections.find(s => 
        (s.id === student.student_section || s.section_name === student.student_section) &&
        (s.is_advisory || !s.is_teaching_load)
    ) || sectionObj;

    const targetSectionTokens = new Set<string>([
        normalizeSectionToken(advisorySection?.id),
        normalizeSectionToken(advisorySection?.section_name)
    ].filter(Boolean));

    const targetSchoolYear = normalizeText(schoolYear);
    const targetStartYear = targetSchoolYear.match(/\d{4}/)?.[0] || '';

    const getSheetMonth = (sheet: SF2Sheet) => normalizeMonthToken(sheet.month) || extractMonthFromId(sheet.id);

    const isSchoolYearMatch = (sheetYearRaw?: string) => {
        const sheetYear = normalizeText(sheetYearRaw);
        if (!sheetYear) return !targetSchoolYear;
        if (sheetYear === targetSchoolYear) return true;
        if (sheetYear.includes(targetSchoolYear) || targetSchoolYear.includes(sheetYear)) return true;

        const sheetStartYear = sheetYear.match(/\d{4}/)?.[0] || '';
        return !!(sheetStartYear && targetStartYear && sheetStartYear === targetStartYear);
    };

    const getSectionTokensForSheet = (sheet: SF2Sheet) => {
        const baseTokens = [normalizeSectionToken(sheet.section_id)];
        const fromId = sheet.id?.split('_').filter(Boolean) || [];
        if (fromId.length >= 3) {
            baseTokens.push(normalizeSectionToken(fromId.slice(0, fromId.length - 2).join('_')));
        }
        return baseTokens.filter(Boolean);
    };

    const isSectionMatch = (sheet: SF2Sheet) => {
        if (!targetSectionTokens.size) return true;
        const sheetTokens = getSectionTokensForSheet(sheet);
        if (!sheetTokens.length) return false;

        return sheetTokens.some(sheetToken => {
            for (const targetToken of targetSectionTokens) {
                if (!targetToken) continue;
                if (sheetToken === targetToken) return true;
                if (sheetToken.includes(targetToken) || targetToken.includes(sheetToken)) return true;
            }
            return false;
        });
    };

    const getSheetDataScore = (sheet: SF2Sheet) => {
        const dateLabelCount = Object.values(sheet.date_labels || {}).filter(v => String(v || '').trim() !== '').length;
        const attendanceCount = Object.keys(sheet.attendance || {}).length;
        return dateLabelCount * 100 + attendanceCount;
    };

    const sf2MonthlySheetMap = new Map<string, SF2Sheet>();
    sf2Sheets.forEach(sheet => {
        const sheetMonth = getSheetMonth(sheet);
        if (!sheetMonth) return;
        if (!months.includes(sheetMonth)) return;
        if (!isSectionMatch(sheet)) return;
        if (!isSchoolYearMatch(sheet.school_year)) return;

        const existing = sf2MonthlySheetMap.get(sheetMonth);
        if (!existing) {
            sf2MonthlySheetMap.set(sheetMonth, sheet);
            return;
        }

        const existingScore = getSheetDataScore(existing);
        const currentScore = getSheetDataScore(sheet);
        if (currentScore > existingScore) {
            sf2MonthlySheetMap.set(sheetMonth, sheet);
            return;
        }

        if (currentScore === existingScore) {
            const existingUpdatedAt = Date.parse(existing.updated_at || '') || 0;
            const currentUpdatedAt = Date.parse(sheet.updated_at || '') || 0;
            if (currentUpdatedAt >= existingUpdatedAt) {
                sf2MonthlySheetMap.set(sheetMonth, sheet);
            }
        }
    });

    months.forEach(month => {
        const sheet = sf2MonthlySheetMap.get(month);

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
                const label = (dateLabels as Record<string, string | number>)[dayKey];
                if (label && label.toString().trim() !== '') {
                    mFilled++;
                    
                    // Check student's status for this specific school day
                    const status = (studentAttendance as Record<string, string | number>)[dayKey];
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
            // Auto-fill missing SF2 month with calendar defaults to avoid blank SF9 cells.
            const fallbackDays = getFallbackSchoolDays(month);
            schoolDays.push(fallbackDays);
            daysPresent.push(fallbackDays);
            daysAbsent.push(0);
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

function calculateFinalGrade(quarterGrades: number[], term?: 1 | 2 | 3 | 'all' | 'none', subjectName?: string): number {
    if (term === 'none') return 0;
    
    // Handle special Grade 11 electives final grade
    if (subjectName) {
        const normName = normalizeSubjectName(subjectName);
        if (normName === 'academicelective1') {
            const g1 = quarterGrades[0] || 0;
            const g3 = quarterGrades[2] || 0;
            if (g1 > 0 && g3 > 0) return Math.round((g1 + g3) / 2);
            return g1 || g3 || 0;
        }
        if (normName === 'academicelective2') {
            const g2 = quarterGrades[1] || 0;
            const g3 = quarterGrades[2] || 0;
            if (g2 > 0 && g3 > 0) return Math.round((g2 + g3) / 2);
            return g2 || g3 || 0;
        }
        if (normName === 'academicelective3') {
            return quarterGrades[2] || 0;
        }
        if (normName === 'techproelective1') {
            const g1 = quarterGrades[0] || 0;
            const g2 = quarterGrades[1] || 0;
            const g3 = quarterGrades[2] || 0;
            let sum = 0;
            let count = 0;
            if (g1 > 0) { sum += g1; count++; }
            if (g2 > 0) { sum += g2; count++; }
            if (g3 > 0) { sum += g3; count++; }
            return count > 0 ? Math.round(sum / count) : 0;
        }
    }

    if (term === 1 || Number(term) === 1) return quarterGrades[0] || 0;
    if (term === 2 || Number(term) === 2) return quarterGrades[1] || 0;
    if (term === 3 || Number(term) === 3) return quarterGrades[2] || 0;

    if (quarterGrades.length !== 3 || !quarterGrades.every(g => g > 0)) return 0;
    return Math.round(quarterGrades.reduce((a, b) => a + b, 0) / 3);
}

function getRemarks(grade: number): string {
    if (grade <= 0) return '';
    return grade >= 75 ? 'Passed' : 'Failed';
}

function getGeneralAverageRemarks(
    genAvg: number, 
    grades: Record<string, number[]> = {}, 
    currentSubjectsList: SF9SubjectItem[] = [],
    studentLrn?: string,
    schoolYear?: string
): string[] {
    if (genAvg <= 0) return [''];
    if (genAvg < 75) return ['Retained'];
    
    const remarks = ['Promoted'];
    
    // Check if qualifies for Academic Excellence Award
    // Criteria: GA >= 90 AND no final grade below 80 in any of the averaged learning areas
    if (genAvg >= 90) {
        const dbSubjects = useAppStore.getState().subjects;
        let hasGradeBelow80 = false;
        let hasGrades = false;

        Object.keys(grades).forEach(key => {
            const norm = normalizeSubjectName(key);
            const subjItem = currentSubjectsList.find(s => s.name === key);
            
            // Exclude components from the average count (they are part of MAPEH or parent subjects)
            const isComponent = norm.includes('musicandarts') || norm.includes('musicarts') || 
                               norm.includes('physicaleducationandhealth') || norm.includes('peandhealth') || norm.includes('pehealth') ||
                               subjItem?.isComponent;
                               
            const isExcluded = key.startsWith('*') || 
                              key.toLowerCase().includes('arabic language') || 
                              key.toLowerCase().includes('islamic values');

            // Exclude category headers from the average
            if (
                subjItem?.name === 'Core Subjects' || 
                subjItem?.name === 'Electives' || 
                subjItem?.name === 'Elective Subjects' || 
                subjItem?.name === 'Applied Subjects' || 
                subjItem?.name === 'Specialized Subjects'
            ) return;

            // Exclude reserved rows, components, and specific excluded subjects
            if (!key.startsWith('reserved_extra') && !isComponent && !isExcluded) {
                const gradeRow = grades[key] || [0, 0, 0];
                
                // Find subject term
                const dbSubj = subjItem?.id 
                    ? dbSubjects.find(s => s.id === subjItem.id) 
                    : dbSubjects.find(s => s.subject_name.toLowerCase().trim() === key.toLowerCase().trim());
                const term = dbSubj?.term;
                if (term === 'none') return;

                const finalGrade = calculateFinalGrade(gradeRow, term, key);
                if (finalGrade > 0) {
                    hasGrades = true;
                    if (finalGrade < 80) {
                        hasGradeBelow80 = true;
                    }
                }
            }
        });

        if (hasGrades && !hasGradeBelow80) {
            remarks.push('with Academic');
            remarks.push('Excellence Award');
        }
    }

    // Append custom/nominated awards
    if (studentLrn) {
        const student = useAppStore.getState().students.find(s => s.lrn === studentLrn);
        if (student && student.awardEvaluations) {
            // Find all matching evaluations for this school year and EOSY
            const evals = student.awardEvaluations.filter(e => 
                (!schoolYear || e.schoolYear === schoolYear) &&
                (e.term === 'EOSY' || e.term === 3)
            );
            evals.forEach(e => {
                let title = '';
                switch (e.awardType) {
                    case 'PerfectAttendance':
                        title = 'Perfect Attendance Awardee';
                        break;
                    case 'CharacterTrait':
                        title = `${e.characterTraitId || 'Core Value'} Trait: ${e.characterTraitTitle || 'Awardee'}`;
                        break;
                    case 'GMRCMerit':
                        title = 'GMRC Certificate of Merit';
                        break;
                    case 'Leadership':
                        title = 'Leadership Excellence Awardee';
                        break;
                    case 'Research':
                        title = 'Excellence in Research Awardee';
                        break;
                    case 'Innovation':
                        title = 'Excellence in Design & Innovation Awardee';
                        break;
                    case 'WorkImmersion':
                        title = 'Excellence in Work Immersion Awardee';
                        break;
                    case 'SpecialRecognition':
                        title = e.specialRecognitionTitle || 'Special Recognition Awardee';
                        break;
                }
                if (title && !remarks.includes(title)) {
                    remarks.push(title);
                }
            });
        }
    }
    
    return remarks;
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
    subjects: SF9SubjectItem[];
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
    adviser, principal, principalTitle,
    grades, subjects: currentSubjects, attendance, pageSize, logoUrl, printMode = 'full', schoolProfile
}: SF9ExactDocumentProps) {

    const STRAND_MAPPING: Record<string, string> = {
        'STEM': 'Science, Technology, Engineering, and Mathematics',
        'ABM': 'Accountancy, Business, and Management',
        'HUMSS': 'Humanities and Social Sciences',
        'GAS': 'General Academic Strand',
        'ICT': 'Information and Communications Technology'
    };

    const strandDisplay = student.strand ? (STRAND_MAPPING[student.strand] || student.strand).toUpperCase() : '';
    const trackDisplay = student.track ? student.track.toUpperCase() : '';

    // Print mode helpers
    const isValuesOnly = printMode === 'term2' || printMode === 'term3';
    const transparentBorder = '#FFFFFF';
    const borderColor = isValuesOnly ? transparentBorder : '#000';

    // Determine SF9 Label and Alignment
    const gradeNum = parseInt(student.grade_level?.replace(/\D/g, '') || '0');
    const isSHS = gradeNum === 11 || gradeNum === 12;

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

    const calculateTotal = (dataArr: number[]) => {
        if (printMode === 'term1' || printMode === 'term2') return '';
        const values = dataArr.slice(0, 10);
        const sum = values.filter(v => v >= 0).reduce((a, b) => a + b, 0);
        const hasAnyData = values.some(v => v >= 0);
        return hasAnyData ? sum : '';
    };

    const generalAverage = calculateGeneralAverage(grades, currentSubjects);

        const cleanDivision = (division || '')
            .replace(/schools division office of/i, '')
            .replace(/schools division of/i, '')
            .trim()
            .toUpperCase();

        return (
            <Page size={pageSize} orientation="landscape" style={styles.singlePage}>
                <View style={[styles.singleBorderWrapper, isValuesOnly ? { borderColor: transparentBorder } : {}]}>
                    <View style={styles.singleContainer}>
                        <View style={styles.singleLeftColumn}>
                            <View style={[styles.singleHeaderContainer, isValuesOnly ? { opacity: 0 } : {}]}>
                                <Image src={`${import.meta.env.BASE_URL}deped_logo_left.png`} style={styles.singleLogo} />
                                <View style={styles.singleHeaderCenter}>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle' }]}>Republic of the Philippines</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle' }]}>Department of Education</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle' }]}>{region || 'Region'}</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle-Bold' }]}>SCHOOLS DIVISION OFFICE OF {cleanDivision || '_________________'}</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle' }]}>{district || 'District'}</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle' }]}>
                                        {(() => {
                                            const muniCity = schoolProfile?.municipality || schoolProfile?.city || '';
                                            const prov = schoolProfile?.province || '';
                                            if (muniCity && prov) {
                                                return `${muniCity}, ${prov}`;
                                            }
                                            return muniCity || prov || 'Municipality/City, Province';
                                        })()}
                                    </Text>
                                    <Text style={[styles.singleHeaderText, { marginTop: 4, fontFamily: 'BookmanOldStyle-Bold' }]}>{schoolName}</Text>
                                </View>
                                <Image src={logoUrl || `${import.meta.env.BASE_URL}school-logo.png`} style={styles.singleLogo} />
                            </View>
                            <Text style={{ textAlign: 'center', marginBottom: 6, marginTop: -15 }}>
                                <Text style={[styles.singleReportTitle, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 14 }]}>{"LEARNER'S PERFORMANCE REPORT\n"}</Text>
                                <Text style={[styles.singleSchoolYear, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle', fontSize: 9 }]}>{"School Year " + schoolYear}</Text>
                            </Text>
                            
                            {(() => {
                                  const fullName = formatLearnerName(student).toUpperCase();
                                  const nameFontSize = fullName.length > 52 ? 5.5 : (fullName.length > 45 ? 6.5 : (fullName.length > 35 ? 7.5 : 8));
                                  const trackFontSize = trackDisplay.length > 25 ? 6 : (trackDisplay.length > 15 ? 7 : 8);
                                  const strandFontSize = strandDisplay.length > 45 ? 5.5 : (strandDisplay.length > 35 ? 6.5 : (strandDisplay.length > 25 ? 7.5 : 8));
                                  return (
                                <View style={[styles.singleStudentInfoGrid, isValuesOnly ? { opacity: 0 } : {}, { marginTop: -15 }]}>
                                    <View style={styles.singleInfoRow}>
                                        {/* Name Cell — 65%, dynamic font */}
                                        <View style={{ width: '65%', flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 30 }}>Name:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: nameFontSize }]}>
                                                {fullName}
                                            </Text>
                                        </View>
                                        {/* Age Cell — 11%, short underline */}
                                        <View style={{ width: '11%', flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 22 }}>Age:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>
                                                {student.age || ' '}
                                            </Text>
                                        </View>
                                        {/* Sex Cell — 24%, long underline */}
                                        <View style={{ width: '24%', flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 22 }}>Sex:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>
                                                {(student.gender || ' ').toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.singleInfoRow}>
                                        {/* LRN Cell — 45% */}
                                        <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 30 }}>LRN:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>
                                                {student.lrn || ' '}
                                            </Text>
                                        </View>
                                        {/* Grade Cell — 12%, short underline */}
                                        <View style={{ width: '12%', flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 28 }}>Grade:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'left', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8, paddingLeft: 2 }]}>
                                                {student.grade_level.replace('Grade ', '') || ' '}
                                            </Text>
                                        </View>
                                        {/* Section Cell — 43%, long underline */}
                                        <View style={{ width: '43%', flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 38 }}>Section:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>
                                                {(section || ' ').toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.singleInfoRow}>
                                        {gradeNum === 12 ? (
                                            <>
                                                {/* Track Cell — 38% */}
                                                <View style={{ width: '38%', flexDirection: 'row', alignItems: 'center' }}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, marginRight: 4 }}>Track (if SHS only):</Text>
                                                    <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: trackFontSize }]}>
                                                        {trackDisplay || ' '}
                                                    </Text>
                                                </View>
                                                {/* Strand Cell — 62% */}
                                                <View style={{ width: '62%', flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, marginRight: 4 }}>Strand:</Text>
                                                    <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: strandFontSize }]}>
                                                        {strandDisplay || ' '}
                                                    </Text>
                                                </View>
                                            </>
                                        ) : (
                                            /* Grade 11 or other grade levels */
                                            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, marginRight: 4 }}>Track (if SHS only):</Text>
                                                <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'left', fontFamily: 'BookmanOldStyle-Bold', fontSize: trackFontSize, paddingLeft: 4 }]}>
                                                    {isSHS ? trackDisplay : ' '}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                );
                            })()}

                            <Text style={[styles.singleMessageText, isValuesOnly ? { color: transparentBorder } : {}, { marginTop: -20 }]}>
                                <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 9 }}>{"Dear Parents,\n"}</Text>
                                <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8.5 }}>{"\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0This Performance Report shows the ability and progress your child has made in the different learning areas as well as his/her core values.\n\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0The school welcomes you should you desire to know more about your child's progress."}</Text>
                            </Text>

                            <View style={{ flexDirection: 'column' }}>
                                <Text style={[{ fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, marginTop: -15 }, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold' }]}>LEARNING PROGRESS AND ACHIEVEMENT</Text>
                                <View style={[styles.singleLpTable, isValuesOnly ? { borderColor: transparentBorder } : {}]}>
                                    <View style={[styles.singleLpHeaderRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <View style={[styles.singleLpHeaderCell, { width: '42%', borderBottomWidth: 0, alignItems: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold' } : { fontFamily: 'BookmanOldStyle-Bold' }}>Learning Areas</Text></View>
                                        <View style={[styles.singleLpHeaderCell, { width: '24%', padding: 0 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <View style={{ borderBottomWidth: 1, borderColor: borderColor, padding: 1, alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold' } : { fontFamily: 'BookmanOldStyle-Bold' }}>TERM</Text></View>
                                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold' } : { fontFamily: 'BookmanOldStyle-Bold' }}>1</Text></View>
                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold' } : { fontFamily: 'BookmanOldStyle-Bold' }}>2</Text></View>
                                                <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold' } : { fontFamily: 'BookmanOldStyle-Bold' }}>3</Text></View>
                                            </View>
                                        </View>
                                        <View style={[styles.singleLpHeaderCell, { width: '14%', borderBottomWidth: 0 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold' } : { fontFamily: 'BookmanOldStyle-Bold' }}>Final Grade</Text></View>
                                        <View style={[styles.singleLpHeaderCell, { width: '20%', borderBottomWidth: 0, borderRightWidth: 0 }]}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold' } : { fontFamily: 'BookmanOldStyle-Bold' }}>Remarks</Text></View>
                                    </View>
                                    {currentSubjects.filter(subj => !subj.isReserved).map((subj, idx) => {
                                        const gradeRow = grades[subj.name] || [0, 0, 0];
                                        const dbSubjects = useAppStore.getState().subjects;
                                        const dbSubj = subj.id 
                                            ? dbSubjects.find(s => s.id === subj.id) 
                                            : dbSubjects.find(s => s.subject_name.toLowerCase().trim() === subj.name.toLowerCase().trim());
                                        const term = dbSubj?.term;
                                        const finalGrade = calculateFinalGrade(gradeRow, term, subj.name);
                                        const isReserved = subj.isReserved;
                                        const isHeader = subj.isHeader;
                                        const isCategoryHeader = isHeader && (
                                            subj.name === 'Core Subjects' || 
                                            subj.name === 'Electives' ||
                                            subj.name === 'Elective Subjects' ||
                                            subj.name === 'Applied Subjects' ||
                                            subj.name === 'Specialized Subjects'
                                        );
                                        
                                        const isOfferedInTerm = (tNum: number) => {
                                            if (isCategoryHeader || isReserved) return false;
                                            
                                            // Handle special Grade 11 electives offered terms
                                            const normName = normalizeSubjectName(subj.name);
                                            if (normName === 'academicelective1') {
                                                return tNum === 1 || tNum === 3;
                                            }
                                            if (normName === 'academicelective2') {
                                                return tNum === 2 || tNum === 3;
                                            }
                                            if (normName === 'academicelective3') {
                                                return tNum === 3;
                                            }
                                            if (normName === 'techproelective1') {
                                                return true;
                                            }

                                            if (term === undefined || term === null || term === 'all') return true;
                                            return Number(term) === tNum;
                                        };

                                        return (
                                            <View key={idx} style={[styles.singleLpRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}, isCategoryHeader ? { backgroundColor: '#E5E7EB' } : {}]}>
                                                <View style={[styles.singleLpCell, { width: '42%', paddingLeft: subj.isComponent ? 15 : 4 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}> 
                                                    <Text style={{ fontFamily: subj.isComponent ? 'BookmanOldStyle-Italic' : 'BookmanOldStyle-Bold', fontSize: (subj.name && subj.name.length > 35) ? 6.5 : 7.5, ...(isValuesOnly ? { color: transparentBorder } : {}) }}>
                                                        {isReserved ? '' : isCategoryHeader ? subj.name.toUpperCase() : subj.name}
                                                    </Text>
                                                </View>
                                                <View style={[styles.singleLpCell, { width: '24%', padding: 0 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                                    <View style={{ flexDirection: 'row', flex: 1 }}>
                                                        <View style={[{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }, (!isCategoryHeader && !isReserved && !isOfferedInTerm(1)) ? { backgroundColor: '#E5E7EB' } : {}]}>
                                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }}>
                                                                {!isCategoryHeader && isOfferedInTerm(1) && showTermValue(0) && gradeRow[0] ? formatGradeForDisplay(gradeRow[0], student.grade_level) : ''}
                                                            </Text>
                                                        </View>
                                                        <View style={[{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }, (!isCategoryHeader && !isReserved && !isOfferedInTerm(2)) ? { backgroundColor: '#E5E7EB' } : {}]}>
                                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }}>
                                                                {!isCategoryHeader && isOfferedInTerm(2) && showTermValue(1) && gradeRow[1] ? formatGradeForDisplay(gradeRow[1], student.grade_level) : ''}
                                                            </Text>
                                                        </View>
                                                        <View style={[{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }, (!isCategoryHeader && !isReserved && !isOfferedInTerm(3)) ? { backgroundColor: '#E5E7EB' } : {}]}>
                                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }}>
                                                                {!isCategoryHeader && isOfferedInTerm(3) && showTermValue(2) && gradeRow[2] ? formatGradeForDisplay(gradeRow[2], student.grade_level) : ''}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View style={[styles.singleLpCell, { width: '14%', textAlign: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }}>
                                                        {!isCategoryHeader && showFinalAndRemarks && finalGrade ? formatGradeForDisplay(finalGrade, student.grade_level) : ''}
                                                    </Text>
                                                </View>
                                                <View style={[styles.singleLpCellLast, { width: '20%', textAlign: 'center' }]}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 7.5 }}>
                                                        {!isCategoryHeader && showFinalAndRemarks && finalGrade ? getRemarks(finalGrade) : ''}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                    <View style={[styles.singleLpRow, { borderBottomWidth: 0 }, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <View style={[styles.singleLpCell, { width: '66%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5, ...(isValuesOnly ? { color: transparentBorder } : {}) }}>General Average</Text></View>
                                        <View style={[styles.singleLpCell, { width: '14%', textAlign: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }}>
                                                {showFinalAndRemarks && generalAverage > 0 ? formatGradeForDisplay(generalAverage, student.grade_level) : ''}
                                            </Text>
                                        </View>
                                        <View style={[styles.singleLpCellLast, { width: '20%', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }]}>
                                            {showFinalAndRemarks && generalAverage > 0 ? getGeneralAverageRemarks(generalAverage, grades, currentSubjects, student.lrn, schoolYear).map((line, i) => (
                                                <Text key={i} style={{ fontSize: 6.5, lineHeight: 1.1, fontFamily: 'BookmanOldStyle-Bold' }}>{line}</Text>
                                            )) : <Text></Text>}
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.singleLegendContainer}>
                                <Text style={[styles.singleLegendTitle, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold' }]}>PERFORMANCE DESCRIPTORS</Text>
                                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                                    <View style={{ width: '30%', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5, ...(isValuesOnly ? { color: transparentBorder } : {}) }}>Grading Scale</Text></View>
                                    <View style={{ width: '45%', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5, ...(isValuesOnly ? { color: transparentBorder } : {}) }}>Description</Text></View>
                                    <View style={{ width: '25%', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5, ...(isValuesOnly ? { color: transparentBorder } : {}) }}>Remarks</Text></View>
                                </View>
                                {[
                                    { scale: '90-100', desc: 'Advancing', rem: 'Passed' },
                                    { scale: '80-89', desc: 'Benchmarking', rem: 'Passed' },
                                    { scale: '75-79', desc: 'Connecting', rem: 'Passed' },
                                    { scale: '65-74', desc: 'Developing', rem: 'Failed' },
                                    { scale: '0-64', desc: 'Emerging', rem: 'Failed' },
                                ].map((item, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 1 }}>
                                        <View style={{ width: '30%', alignItems: 'center' }}><Text style={[isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle', fontSize: 7 }]}>{item.scale}</Text></View>
                                        <View style={{ width: '45%', alignItems: 'center' }}><Text style={[isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle', fontSize: 7 }]}>{item.desc}</Text></View>
                                        <View style={{ width: '25%', alignItems: 'center' }}><Text style={[isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle', fontSize: 7 }]}>{item.rem}</Text></View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.singleRightColumn}>
                            <Text style={[styles.singleAttendanceTitle, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 11 }]}>ATTENDANCE RECORD</Text>
                                <View style={[styles.singleAttendanceTable, isValuesOnly ? { borderColor: transparentBorder } : {}]}>
                                    {/* Header row — show actual months from SF2 */}
                                    <View style={[styles.singleAttHeaderRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <View style={[styles.singleAttLabelCell, { width: '20%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5, textAlign: 'center' } : { fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5, textAlign: 'center' }}>Month</Text>
                                        </View>
                                        {attendance.months.slice(0, 11).map((month, idx) => (
                                            <View key={idx} style={[styles.singleAttMonthCell, { width: '6%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                                <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5, textAlign: 'center' }}>{isValuesOnly ? '' : month}</Text>
                                            </View>
                                        ))}
                                        {Array.from({ length: Math.max(0, 11 - attendance.months.slice(0, 11).length) }).map((_, idx) => (
                                            <View key={`pad-${idx}`} style={[styles.singleAttMonthCell, { width: '6%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]} />
                                        ))}
                                        <View style={[styles.singleAttDataCellLast, { width: '14%', borderLeftWidth: 1, borderLeftColor: borderColor, justifyContent: 'center', alignItems: 'center' }]}>
                                            <Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5, textAlign: 'center' } : { fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5, textAlign: 'center' }}>Total</Text>
                                        </View>
                                    </View>
                                    {/* No. of Class Days */}
                                    <View style={[styles.singleAttRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <View style={[styles.singleAttLabelCell, { width: '20%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle', fontSize: 6, textAlign: 'center' } : { fontFamily: 'BookmanOldStyle', fontSize: 6, textAlign: 'center' }}>{"No. of Class\nDays"}</Text>
                                        </View>
                                        {attendance.schoolDays.slice(0, 11).map((days, idx) => {
                                            const val = getAttendanceValue(idx, days);
                                            return (
                                                <View key={idx} style={[styles.singleAttDataCell, { width: '6%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6, textAlign: 'center' }}>{val !== '' ? val : ''}</Text>
                                                </View>
                                            );
                                        })}
                                        {Array.from({ length: Math.max(0, 11 - attendance.schoolDays.slice(0, 11).length) }).map((_, idx) => (
                                            <View key={`pad-${idx}`} style={[styles.singleAttDataCell, { width: '6%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]} />
                                        ))}
                                        <View style={[styles.singleAttDataCellLast, { width: '14%', borderLeftWidth: 1, borderLeftColor: borderColor, justifyContent: 'center', alignItems: 'center' }]}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5, textAlign: 'center' }}>{calculateTotal(attendance.schoolDays)}</Text>
                                        </View>
                                    </View>
                                    {/* No. of Days Present */}
                                    <View style={[styles.singleAttRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <View style={[styles.singleAttLabelCell, { width: '20%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle', fontSize: 6, textAlign: 'center' } : { fontFamily: 'BookmanOldStyle', fontSize: 6, textAlign: 'center' }}>{"No. of Days\nPresent"}</Text>
                                        </View>
                                        {attendance.daysPresent.slice(0, 11).map((days, idx) => {
                                            const val = getAttendanceValue(idx, days);
                                            return (
                                                <View key={idx} style={[styles.singleAttDataCell, { width: '6%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6, textAlign: 'center' }}>{val !== '' ? val : ''}</Text>
                                                </View>
                                            );
                                        })}
                                        {Array.from({ length: Math.max(0, 11 - attendance.daysPresent.slice(0, 11).length) }).map((_, idx) => (
                                            <View key={`pad-${idx}`} style={[styles.singleAttDataCell, { width: '6%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]} />
                                        ))}
                                        <View style={[styles.singleAttDataCellLast, { width: '14%', borderLeftWidth: 1, borderLeftColor: borderColor, justifyContent: 'center', alignItems: 'center' }]}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5, textAlign: 'center' }}>{calculateTotal(attendance.daysPresent)}</Text>
                                        </View>
                                    </View>
                                    {/* No. of Days Absent */}
                                    <View style={[styles.singleAttRowLast, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <View style={[styles.singleAttLabelCell, { width: '20%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle', fontSize: 6, textAlign: 'center' } : { fontFamily: 'BookmanOldStyle', fontSize: 6, textAlign: 'center' }}>{"No. of Days\nAbsent"}</Text>
                                        </View>
                                        {attendance.daysAbsent.slice(0, 11).map((days, idx) => {
                                            const val = getAttendanceValue(idx, days);
                                            return (
                                                <View key={idx} style={[styles.singleAttDataCell, { width: '6%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6, textAlign: 'center' }}>{val !== '' ? val : ''}</Text>
                                                </View>
                                            );
                                        })}
                                        {Array.from({ length: Math.max(0, 11 - attendance.daysAbsent.slice(0, 11).length) }).map((_, idx) => (
                                            <View key={`pad-${idx}`} style={[styles.singleAttDataCell, { width: '6%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]} />
                                        ))}
                                        <View style={[styles.singleAttDataCellLast, { width: '14%', borderLeftWidth: 1, borderLeftColor: borderColor, justifyContent: 'center', alignItems: 'center' }]}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5, textAlign: 'center' }}>{calculateTotal(attendance.daysAbsent)}</Text>
                                        </View>
                                    </View>
                                </View>
                                                   <View style={styles.singleCommentsContainer}>
                                <Text style={[styles.singleAttendanceTitle, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 11 }]}>TEACHER'S COMMENTS/REMARKS</Text>
                                <View style={[styles.singleCommentsBox, isValuesOnly ? { borderColor: transparentBorder } : {}]}>
                                    <View style={[styles.singleCommentTermRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <Text style={[styles.singleCommentLabel, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>Term 1</Text>
                                        <Text style={[styles.singleCommentValue, { fontFamily: 'BookmanOldStyle' }]}></Text>
                                    </View>
                                    <View style={[styles.singleCommentTermRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <Text style={[styles.singleCommentLabel, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>Term 2</Text>
                                        <Text style={[styles.singleCommentValue, { fontFamily: 'BookmanOldStyle' }]}></Text>
                                    </View>
                                    <View style={[styles.singleCommentTermRowLast, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <Text style={[styles.singleCommentLabel, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>Term 3</Text>
                                        <Text style={[styles.singleCommentValue, { fontFamily: 'BookmanOldStyle' }]}></Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.singleSignaturesContainer}>
                                <Text style={[styles.singleAttendanceTitle, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 11 }]}>PARENTS/GUARDIAN'S SIGNATURE</Text>
                                <View style={styles.singleSignatureRow}>
                                    <Text style={[styles.singleSignatureLabel, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5, width: 50 }]}>Term 1</Text>
                                    <View style={[styles.singleSignatureLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                                </View>
                                <View style={styles.singleSignatureRow}>
                                    <Text style={[styles.singleSignatureLabel, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5, width: 50 }]}>Term 2</Text>
                                    <View style={[styles.singleSignatureLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                                </View>
                                <View style={styles.singleSignatureRow}>
                                    <Text style={[styles.singleSignatureLabel, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5, width: 50 }]}>Term 3</Text>
                                    <View style={[styles.singleSignatureLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                                </View>
                            </View>

                            <View style={styles.singleTransferSection}>
                                <Text style={[styles.singleTransferTitle, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 11 }]}>CERTIFICATE OF TRANSFER</Text>
                                <Text style={[styles.singleTransferText, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle', fontSize: 8.5, lineHeight: 1.2 }]}>
                                       This is to certify that the above-named learner has satisfactorily completed the requirements for the grade level indicated.
                                </Text>
                                <View style={[styles.singleTransferRow, { marginBottom: 7 }]}>
                                    <Text style={[{ fontSize: 8.5, fontFamily: 'BookmanOldStyle' }, isValuesOnly ? { color: transparentBorder } : {}]}>Admitted to Grade:</Text>
                                    <View style={[styles.singleTransferLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                                </View>
                                <View style={[styles.singleTransferRow, { marginBottom: 2 }]}>
                                    <Text style={[{ fontSize: 8.5, fontFamily: 'BookmanOldStyle' }, isValuesOnly ? { color: transparentBorder } : {}]}>Eligible for Admission to Grade:</Text>
                                    <View style={[styles.singleTransferLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                                </View>
                                <Text style={[{ fontSize: 8.5, fontFamily: 'BookmanOldStyle', marginTop: 2 }, isValuesOnly ? { color: transparentBorder } : {}]}>Approved:</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                                    <View style={{ width: '45%', alignItems: 'center' }}>
                                        <Text style={[{ fontSize: 7.5, fontFamily: 'BookmanOldStyle-Bold', textAlign: 'center', minHeight: 9 }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                            {(principal || '').toUpperCase()}
                                        </Text>
                                        <View style={{ borderBottomWidth: 1, borderBottomColor: borderColor, width: '100%', marginTop: 1 }} />
                                        <Text style={[{ fontSize: 6.5, fontFamily: 'BookmanOldStyle', marginTop: 1, textAlign: 'center' }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                            {(principalTitle || 'School Head').toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ width: '45%', alignItems: 'center' }}>
                                        <Text style={[{ fontSize: 7.5, fontFamily: 'BookmanOldStyle-Bold', textAlign: 'center', minHeight: 9 }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                            {(adviser || '').toUpperCase()}
                                        </Text>
                                        <View style={{ borderBottomWidth: 1, borderBottomColor: borderColor, width: '100%', marginTop: 1 }} />
                                        <Text style={[{ fontSize: 6.5, fontFamily: 'BookmanOldStyle', marginTop: 1, textAlign: 'center' }, isValuesOnly ? { color: transparentBorder } : {}]}>CLASS ADVISER</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.singleCancellationSection}>
                                <Text style={[styles.singleCancellationTitle, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 11 }]}>CANCELLATION OF ELIGIBILITY TO TRANSFER</Text>
                                <View style={[styles.singleCancellationRow, { marginBottom: 2 }]}>
                                    <Text style={[{ fontSize: 8.5, fontFamily: 'BookmanOldStyle' }, isValuesOnly ? { color: transparentBorder } : {}]}>Admitted in:</Text>
                                    <View style={[styles.singleCancellationLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                                    <Text style={[{ fontSize: 8.5, fontFamily: 'BookmanOldStyle', marginLeft: 15 }, isValuesOnly ? { color: transparentBorder } : {}]}>Date:</Text>
                                    <View style={[styles.singleCancellationLine, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]} />
                                </View>
                                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                                    <View style={{ width: '45%', alignItems: 'center' }}>
                                        <Text style={[{ fontSize: 7.5, fontFamily: 'BookmanOldStyle-Bold', textAlign: 'center', minHeight: 9 }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                            {(principal || '').toUpperCase()}
                                        </Text>
                                        <View style={{ borderBottomWidth: 1, borderBottomColor: borderColor, width: '100%', marginTop: 1 }} />
                                        <Text style={[{ fontSize: 6.5, fontFamily: 'BookmanOldStyle', marginTop: 1, textAlign: 'center' }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                            {(principalTitle || 'School Head').toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }} />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
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

export function SF9BatchDocument({
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

    const { students, sections, schoolProfile, activeSchoolYear, gradingSheetRecords, subjects, observedValues, sf2Sheets: storeSf2Sheets, setSF2Sheets, updateObservedValue, setCurrentView, teachers } = useAppStore();
    const { user } = useAuthStore();
    const [hydratedSf2Sheets, setHydratedSf2Sheets] = useState<SF2Sheet[]>([]);

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

    useEffect(() => {
        let isMounted = true;

        const hydrateSf2Sheets = async () => {
            try {
                const allSf2Sheets = await db.getAllRecords<SF2Sheet>('sf2Sheets');
                if (isMounted) {
                    setHydratedSf2Sheets(allSf2Sheets);
                }
            } catch (error) {
                console.error('Failed to hydrate SF2 sheets for SF9:', error);
            }
        };

        hydrateSf2Sheets();

        return () => {
            isMounted = false;
        };
    }, [activeSchoolYear]);

    const sf2Sheets = useMemo(() => {
        const byId = new Map<string, SF2Sheet>();
        hydratedSf2Sheets.forEach((sheet) => byId.set(sheet.id, sheet));
        storeSf2Sheets.forEach((sheet) => byId.set(sheet.id, sheet));
        return Array.from(byId.values());
    }, [hydratedSf2Sheets, storeSf2Sheets]);

    const selectedSectionObj = useMemo(() => sections.find(s => s.id === selectedSection), [sections, selectedSection]);
    const isAdvisorySection = useCallback((section: Section) => {
        const legacy = 'is_advisory_class' in section ? (section as Section & { is_advisory_class?: boolean }).is_advisory_class : false;
        return !!section.is_advisory || !!legacy;
    }, []);

    useEffect(() => {
        if (!selectedSectionObj) return;
        if (!isAdvisorySection(selectedSectionObj)) return;

        const sectionTokens = new Set<string>([
            normalizeSectionToken(selectedSectionObj.id),
            normalizeSectionToken(selectedSectionObj.section_name)
        ].filter(Boolean));

        const sectionSheets = sf2Sheets.filter((sheet) => {
            const sheetTokens = [normalizeSectionToken(sheet.section_id)];
            const idParts = (sheet.id || '').split('_').filter(Boolean);
            if (idParts.length >= 3) {
                sheetTokens.push(normalizeSectionToken(idParts.slice(0, idParts.length - 2).join('_')));
            }

            const sectionMatch = sheetTokens.some((token) => {
                for (const target of sectionTokens) {
                    if (!target) continue;
                    if (token === target || token.includes(target) || target.includes(token)) {
                        return true;
                    }
                }
                return false;
            });

            if (!sectionMatch) return false;

            const sheetYear = (sheet.school_year || '').trim();
            return sheetYear === activeSchoolYear;
        });

        const existingMonths = new Set<string>();
        sectionSheets.forEach((sheet) => {
            const month = normalizeMonthToken(sheet.month) || extractMonthFromSf2Id(sheet.id);
            if (month) existingMonths.add(month);
        });

        const missingMonths = SF2_MONTHS.filter((month) => !existingMonths.has(month));
        if (missingMonths.length === 0) return;

        let isMounted = true;

        const createMissingSf2Sheets = async () => {
            const sectionKey = selectedSectionObj.section_name || selectedSectionObj.id;
            const now = new Date().toISOString();

            const generatedSheets: SF2Sheet[] = missingMonths.map((month) => ({
                id: `${sectionKey}_${activeSchoolYear}_${month}`,
                section_id: sectionKey,
                school_year: activeSchoolYear,
                month,
                date_labels: buildDefaultSf2DateLabels(month, activeSchoolYear),
                attendance: {},
                remarks: {},
                updated_at: now
            }));

            try {
                await Promise.all(generatedSheets.map((sheet) => db.putRecord('sf2Sheets', sheet)));
                if (!isMounted) return;

                setHydratedSf2Sheets((prev) => {
                    const merged = new Map<string, SF2Sheet>();
                    prev.forEach((sheet) => merged.set(sheet.id, sheet));
                    generatedSheets.forEach((sheet) => merged.set(sheet.id, sheet));
                    return Array.from(merged.values());
                });

                const mergedStoreMap = new Map<string, SF2Sheet>();
                storeSf2Sheets.forEach((sheet) => mergedStoreMap.set(sheet.id, sheet));
                generatedSheets.forEach((sheet) => mergedStoreMap.set(sheet.id, sheet));
                setSF2Sheets(Array.from(mergedStoreMap.values()));
            } catch (error) {
                console.error('Failed to create missing SF2 month sheets from SF9:', error);
            }
        };

        createMissingSf2Sheets();

        return () => {
            isMounted = false;
        };
    }, [selectedSectionObj, activeSchoolYear, sf2Sheets, storeSf2Sheets, setSF2Sheets, isAdvisorySection]);

    const filteredSections = useMemo(() => {
        return [...filterSF9Sections(user, sections)]
            .filter(isAdvisorySection)
            .sort((a, b) => {
            const getGN = (g: string) => parseInt(g.match(/\d+/)?.[0] || '999');
            const gA = getGN(a.section_grade_level);
            const gB = getGN(b.section_grade_level);
            return gA !== gB ? gA - gB : a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user, isAdvisorySection]);

    // Auto-select advisory section only
    useEffect(() => {
        if (!selectedSection && filteredSections.length > 0) {
            // Defer update to avoid direct setState-in-effect lint violation.
            setTimeout(() => setSelectedSection(filteredSections[0].id), 0);
        }
    }, [filteredSections, selectedSection]);
    const isShsSf9Section = useMemo(() => {
        return false;
    }, []);



    const isGrade1to10 = useMemo(() => {
        if (!selectedStudent) return false;
        const gradeNum = parseInt(selectedStudent.grade_level?.replace(/\D/g, '') || '0');
        return gradeNum >= 1 && gradeNum <= 12;
    }, [selectedStudent]);

    useEffect(() => {
        if (isShsSf9Section) {
            setSelectedStudent(null);
            setIsBatchReady(false);
        }
    }, [isShsSf9Section]);
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

    const handlePrint = useCallback(async () => {
        if (!selectedStudent || !singleDocument || isShsSf9Section) return;
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
    }, [selectedStudent, singleDocument, isShsSf9Section]);

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
        const fullName = formatLearnerName(selectedStudent).toUpperCase();
        
        // 2. LRN: Dashed format for digit-by-digit reading
        const dashedLRN = selectedStudent.lrn.split('').join('-');
        
        let textToSpeak = `${fullName}. `;
        textToSpeak += `LRN: ${dashedLRN}. `;

        // 3. Subjects & Grades: Subject Name 1st, 2nd, 3rd, Final
        studentGrades.subjects.forEach((subj: SF9SubjectItem) => {
            if (subj.isReserved) return;
            
            const gradeRow = studentGrades.grades[subj.name] || [0, 0, 0];
            const finalGrade = calculateFinalGrade(gradeRow, undefined, subj.name);
            
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
            const remarksLines = getGeneralAverageRemarks(genAvg, studentGrades.grades, studentGrades.subjects, selectedStudent.lrn, activeSchoolYear);
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
        <div className="flex flex-col h-screen bg-linear-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 relative overflow-hidden font-sans">
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/75 backdrop-blur-2xl border-b border-slate-200/70 shadow-[0_8px_28px_rgba(15,23,42,0.05)] relative print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 z-30" />
                <div className="flex items-center justify-center w-full h-18 px-3 lg:px-5 gap-2.5 lg:gap-3 select-none overflow-x-auto scrollbar-none">
                    
                    {/* Identity & Context (Left) */}
                    <div className="flex items-center gap-1.5 lg:gap-2 shrink-0 min-w-0">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 hover:border-slate-300 transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        {!isBatchReady && (
                            <div className="relative group shrink-0">
                                <select 
                                    className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-35 lg:min-w-38.75 disabled:opacity-30 duration-200"
                                    value={selectedStudent?.lrn || ''}
                                    onChange={(e) => setSelectedStudent(students.find(s => s.lrn === e.target.value) || null)}
                                    disabled={!selectedSection || isShsSf9Section}
                                >
                                    <option value="">{isShsSf9Section ? 'Template Locked' : 'Select Learner'}</option>
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
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                            </div>
                        )}

                    </div>

                    {/* View & Formatting Controls (Center) */}
                    <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                        <div className="relative group shrink-0">
                            <select
                                value={printMode}
                                onChange={(e) => setPrintMode(e.target.value as SF9PrintMode)}
                                className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-21.25 lg:min-w-23.75 duration-200"
                            >
                                <option value="full">Full Report</option>
                                <option value="term1">Term 1 Only</option>
                                <option value="term2">Term 2 Only</option>
                                <option value="term3">Term 3 Only</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                        </div>

                        <div className="relative group shrink-0">
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(e.target.value as 'A4' | 'LETTER')}
                                className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-18.75 lg:w-20 duration-200"
                            >
                                <option value="A4">A4</option>
                                <option value="LETTER">Letter</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                        </div>

                        <button
                            onClick={() => setIsLayoutModalOpen(true)}
                            className="h-9 px-2.5 rounded-xl bg-white border border-slate-200 text-[8.5px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:border-blue-400 transition-all flex items-center gap-1 shadow-sm shrink-0 duration-200 active:scale-95"
                        >
                            <Settings2 className="w-3 h-3 text-indigo-500" />
                            Layout
                        </button>

                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
                            <button 
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                                title="Zoom Out"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[9px] font-black text-slate-900 w-8 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                                title="Zoom In"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Data and Actions (Right) */}
                    <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                        {/* Divider between Center and Right */}
                        <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" />
                        {selectedStudent && !isBatchReady && !isShsSf9Section && !isGrade1to10 && (
                            <button
                                onClick={() => { setPendingChanges({}); setIsValuesModalOpen(true); }}
                                className="h-9 px-2.5 rounded-xl bg-white border border-slate-200 text-[8.5px] font-black uppercase tracking-wider text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-1 shadow-sm shrink-0 duration-200 active:scale-95"
                            >
                                <Edit3 className="w-3 h-3 text-blue-500" />
                                Values
                            </button>
                        )}

                        {selectedStudent && !isShsSf9Section && (
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={handleSpeak}
                                    className={`h-9 w-9 rounded-xl border transition-all flex items-center justify-center shadow-sm shrink-0 active:scale-95 duration-200 ${isSpeaking ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'}`}
                                    title={isSpeaking ? "Stop Reading" : `Read Grades Aloud (${speechRate}x)`}
                                >
                                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                </button>
                                <div className="relative group shrink-0">
                                    <select
                                        value={speechRate}
                                        onChange={(e) => setSpeechRate(Number(e.target.value))}
                                        className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 rounded-xl px-1.5 text-[9px] font-bold text-slate-600 outline-none w-11.25 duration-200 cursor-pointer text-center"
                                        title="Speech Rate"
                                    >
                                        <option value="1">1.0x</option>
                                        <option value="1.5">1.5x</option>
                                        <option value="2">2.0x</option>
                                        <option value="2.5">2.5x</option>
                                        <option value="3">3.0x</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Thin divider before toggle & print/download */}
                        <div className="h-6 w-px bg-slate-200 shrink-0" />

                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0 h-9">
                            <button
                                onClick={() => setIsBatchReady(false)}
                                disabled={isShsSf9Section}
                                className={`px-2 h-full rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${!isBatchReady ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Indiv
                            </button>
                            <button
                                onClick={() => { setIsBatchReady(true); setSelectedStudent(null); }}
                                disabled={isShsSf9Section}
                                className={`px-2 h-full rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${isBatchReady ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Batch
                            </button>
                        </div>

                        {!isBatchReady && singleDocument && !isShsSf9Section && (
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={handlePrint}
                                    className="h-9 px-3 lg:px-3.5 rounded-xl bg-blue-600 text-white font-black text-[8.5px] uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 hover:scale-[1.01] hover:-translate-y-px active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200"
                                >
                                    <Printer className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                                    Print SF9
                                </button>
                                <PDFDownloadLink
                                    document={singleDocument}
                                    fileName={`SF9_${selectedSectionObj?.section_name || 'Record'}_${selectedStudent?.last_name || 'Student'}_${activeSchoolYear}.pdf`}
                                    className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60 hover:border-slate-300 transition-all flex items-center justify-center shrink-0 active:scale-95 duration-200"
                                    title="Download PDF"
                                >
                                    <Download className="w-3 h-3" />
                                </PDFDownloadLink>
                            </div>
                        )}
                    </div>
                </div>
             </div>

             {/* Workspace Viewer Area */}
             <div className="flex-1 overflow-auto bg-linear-to-b from-slate-100/70 to-blue-100/40 relative custom-scrollbar">
                <div className="w-full min-h-full flex flex-col items-center justify-start py-6 sm:py-8 px-3 sm:px-6 lg:px-10 relative">
                    {isShsSf9Section && selectedSectionObj ? (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center py-3 sm:py-6"
                        >
                            <div className="relative w-full rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_24px_60px_rgba(30,64,175,0.12)] overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-br from-blue-100/45 via-transparent to-indigo-100/35" />
                                <div className="absolute -top-16 -left-12 w-56 h-56 rounded-full bg-blue-300/20 blur-3xl" />
                                <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-indigo-300/20 blur-3xl" />

                                <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 p-6 sm:p-8 lg:p-10 items-center">
                                    <div className="space-y-5">
                                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                                            <Clock3 className="w-3.5 h-3.5" />
                                            Preparing Official DepEd-Compliant Template
                                        </span>

                                        <div className="space-y-3">
                                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-[1.05]">
                                                Senior High School SF9 Template Coming Soon
                                            </h2>
                                            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold max-w-2xl">
                                                The Grade 11 and Grade 12 SF9 generation module is currently being finalized to align with the latest official DepEd formatting standards.
                                            </p>
                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-2xl">
                                                All core processing logic and student data handling are already in place. The preview and export features will be re-enabled once the final template structure is completed.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative h-64 sm:h-72 rounded-3xl border border-white/70 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_30px_rgba(15,23,42,0.08)] overflow-hidden">
                                        <div className="absolute inset-x-0 top-0 h-11 bg-linear-to-r from-blue-500/15 to-indigo-500/20 border-b border-slate-200/60" />
                                        <motion.div
                                            initial={{ y: 4, opacity: 0.8 }}
                                            animate={{ y: [-2, 4, -2], opacity: [0.85, 1, 0.85] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute top-6 left-6 right-6 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider">SF9 SHS Layout Queue</div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-2 rounded-full bg-slate-200/80" />
                                                <div className="h-2 rounded-full bg-slate-200/80 w-10/12" />
                                                <div className="h-2 rounded-full bg-blue-200/70 w-8/12" />
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            initial={{ y: -2, opacity: 0.8 }}
                                            animate={{ y: [4, -2, 4], opacity: [0.8, 1, 0.8] }}
                                            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                                            className="absolute bottom-5 right-5 w-36 rounded-2xl border border-blue-100 bg-blue-50/90 p-3 shadow-sm"
                                        >
                                            <div className="text-[9px] font-black uppercase tracking-wider text-blue-700">Status</div>
                                            <div className="mt-1 text-[11px] font-bold text-slate-700 leading-tight">Template validation in progress</div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : selectedStudent && singleDocument && !isBatchReady ? (
                        <div
                            className="transition-all duration-700 ease-out origin-top flex flex-col items-center"
                            style={{
                                transform: `scale(${zoom}) translateZ(0)`,
                                transformOrigin: 'top center',
                                willChange: 'transform',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                height: 'calc(100vh - 200px)'
                            }}
                        >
                            <div className="w-full h-full min-w-280.5 min-h-198.25 bg-white rounded-sm border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden relative group">
                                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                                <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none w-full h-full">
                                    {singleDocument!}
                                </PDFViewer>
                            </div>
                        </div>
                    ) : isBatchReady && selectedSectionObj ? (
                        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-8 py-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-4xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mx-auto relative z-10 transform -rotate-6">
                                    <Printer className="w-10 h-10 text-white" />
                                </div>
                                <div className="absolute inset-x-0 -bottom-3 h-6 bg-blue-900/10 blur-xl rounded-full scale-110" />
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Batch Generation Center</h2>
                                <p className="text-lg text-slate-500 font-medium">
                                    Preparing official SF9 records for <span className="text-blue-600 font-bold">{selectedSectionObj.section_name}</span>
                                </p>
                            </div>

                            <div className="w-full max-w-xl bg-white rounded-4xl border border-slate-200/60 shadow-xl p-8 space-y-6">
                                {batchProgress > 0 && (
                                    <div className="space-y-4">
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                                            <motion.div
                                                className="h-full bg-linear-to-r from-blue-600 to-indigo-600 rounded-full"
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
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center py-8"
                        >
                            <div className="relative w-full rounded-3xl border border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] px-6 sm:px-10 py-10 sm:py-12 text-center overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-br from-indigo-50/70 via-white/60 to-blue-50/60" />
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-40 bg-blue-300/20 blur-3xl rounded-full" />

                                <div className="relative flex flex-col items-center gap-7">
                                    <div className="relative group">
                                        <div className="absolute -inset-10 bg-indigo-500/10 blur-3xl rounded-full opacity-70 group-hover:opacity-100 transition-all duration-700" />
                                        <div className="relative w-52 h-52 sm:w-56 sm:h-56 bg-white rounded-[3rem] border border-slate-200 flex items-center justify-center transform group-hover:-translate-y-1 transition-all duration-500 shadow-xl">
                                            <FileText className="w-24 h-24 text-slate-200" />
                                            <div className="absolute -bottom-5 -right-5 w-22 h-22 bg-linear-to-br from-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl ring-8 ring-white">
                                                <span className="text-3xl font-black text-white italic tracking-tighter">SF9</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">Ready to Generate</h2>
                                        <p className="text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
                                            Select a learner for individual report preview, or switch to batch mode to generate official SF9 cards for the entire section.
                                        </p>
                                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-blue-700/75">
                                            Fast workflow • Clean exports • Teacher-friendly controls
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
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
                        className="fixed inset-0 z-1000 flex items-center justify-center p-8 bg-[#0f172a]/80 backdrop-blur-md"
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
                            <div className="px-12 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0 w-full overflow-x-auto custom-scrollbar">
                                <div className="flex items-center gap-8">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                                        <Edit3 className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Evaluate Values</h2>
                                        <div className="flex items-center gap-3 mt-2.5">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-indigo-100">{selectedStudent.lrn}</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formatLearnerName(selectedStudent)}</span>
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
                            <div className="px-12 py-4 bg-white border-b border-slate-50 flex items-center gap-3 shrink-0 overflow-x-auto custom-scrollbar">
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
                                                                <div className="flex items-center gap-1.5 shrink-0 w-full overflow-x-auto custom-scrollbar">
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
                             <div className="px-12 py-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0 w-full overflow-x-auto custom-scrollbar">
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
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
    onClose: () => void;
    currentSelections: Record<number, string>;
    subjects: Subject[];
    onSave: (selections: Record<number, string>) => Promise<void>;
}

function SF9LayoutModal({ onClose, currentSelections, subjects, onSave }: LayoutModalProps) {
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
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
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
                className="relative w-full max-w-2xl bg-white rounded-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
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

