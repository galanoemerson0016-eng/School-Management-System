import React, { useState, useMemo, useEffect, useTransition, useCallback, useRef } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image, Font } from '@react-pdf/renderer';
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
import type { Student, User, Section, Subject, ClassRecord, ObservedValues, SF2Sheet, SchoolProfile, CalendarEvent, SF9SignatureSettings, AttendanceRecord } from '../types';
import { db } from '../services/database';
import { resolveStudentQuarterGrade, isMatchingSubject, normalizeGrade12PESubjectName } from '../utils/grading-helpers';
import { computeStudentAttendance } from '../utils/sf9-attendance';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Printer, FileText, Layout, Download, Edit3, Settings, Settings2, X, Volume2, VolumeX, ChevronDown, Clock3, FileSpreadsheet, Bug } from 'lucide-react';
import { exportSF9ToExcel, exportSF9BatchToExcel } from '../services/sf9-excel-export';
import { isGrade1 } from '../services/sf9-g1-excel-export';
import type { SF9ExcelExportOptions } from '../services/sf9-excel-export';
import { filterSF9Sections } from '../lib/rbac';
import { formatGradeForDisplay } from '../lib/grading';
import { formatLearnerName } from '../utils/student-name';
import { getShsSubjectUnitInfo } from '../lib/curriculum';
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

import { getSF9SubjectsForGrade, getSubjectsForGrade, normalizeSubjectName, getCanonicalSubjectKey, sortSubjects } from '../lib/subjectConfig';

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
    JUNE: [1, 2, 3, 4, 5, 8, 9, 10, 11, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30],
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

function getActiveWeeks(month: string, schoolYear: string, includeSaturdays: boolean): number[] {
    const monthMap: Record<string, number> = {
        'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3, 'MAY': 4, 'JUNE': 5,
        'JULY': 6, 'AUGUST': 7, 'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
    };
    const monthIndex = monthMap[month];
    if (monthIndex === undefined) return [0, 1, 2, 3];

    const [startYear, endYear] = schoolYear.split('-').map(Number);
    const year = monthIndex >= 5 ? startYear : endYear;

    const limitDow = includeSaturdays ? 6 : 5;
    const firstDateOfMonth = new Date(year, monthIndex, 1);
    const firstDayOffset = firstDateOfMonth.getDay() === 0 ? 6 : firstDateOfMonth.getDay() - 1;

    let calendarDays: number[] = [];
    if (schoolYear === '2026-2027' && SCHOOL_CALENDAR_2026_2027[month]) {
        calendarDays = [...SCHOOL_CALENDAR_2026_2027[month]];
        if (includeSaturdays && calendarDays.length > 0) {
            const firstSchoolDay = calendarDays[0];
            const lastSchoolDay = calendarDays[calendarDays.length - 1];
            let holidays: string[] = [];
            try {
                const storedEvents = localStorage.getItem('school_calendar_events');
                if (storedEvents) {
                    const parsedEvents = JSON.parse(storedEvents);
                    if (Array.isArray(parsedEvents)) {
                        holidays = parsedEvents
                            .filter((e: CalendarEvent) => e.type === 'holiday' || e.type === 'suspension')
                            .flatMap((e: CalendarEvent) => {
                                const dates: string[] = [];
                                try {
                                    const curr = new Date(e.date + 'T00:00:00');
                                    const end = e.end_date ? new Date(e.end_date + 'T00:00:00') : new Date(curr);
                                    if (!isNaN(curr.getTime()) && !isNaN(end.getTime())) {
                                        while (curr <= end) {
                                            dates.push(curr.toISOString().split('T')[0]);
                                            curr.setDate(curr.getDate() + 1);
                                        }
                                    }
                                } catch (dateErr) {
                                    console.error('Error parsing date range for event:', e, dateErr);
                                }
                                return dates;
                            });
                    }
                }
            } catch (e) {
                console.error('Failed to load holidays for active weeks', e);
            }

            for (let d = firstSchoolDay; d <= lastSchoolDay; d++) {
                const dateObj = new Date(year, monthIndex, d);
                if (dateObj.getDay() === 6) {
                    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (!holidays.includes(dateStr) && !calendarDays.includes(d)) {
                        calendarDays.push(d);
                    }
                }
            }
            calendarDays.sort((a, b) => a - b);
        }
    } else {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            calendarDays.push(d);
        }
    }

    const activeWeekSet = new Set<number>();
    calendarDays.forEach(d => {
        const dateObj = new Date(year, monthIndex, d);
        const dow = dateObj.getDay();
        if (dow >= 1 && dow <= limitDow) {
            const totalDaysFromMondayOfFirstWeek = d + firstDayOffset - 1;
            const weekIndex = Math.floor(totalDaysFromMondayOfFirstWeek / 7);
            activeWeekSet.add(weekIndex);
        }
    });

    const activeWeeks = Array.from(activeWeekSet).sort((a, b) => a - b);
    if (activeWeeks.length === 0) return [0, 1, 2, 3];
    return activeWeeks;
}

function getSf2TotalColumns(month: string, schoolYear: string, includeSaturdays: boolean): number {
    const activeWeeks = getActiveWeeks(month, schoolYear, includeSaturdays);
    return activeWeeks.length * (includeSaturdays ? 6 : 5);
}

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

    const includeSaturdays = localStorage.getItem('formease_sf2_include_saturdays') === 'true';
    const totalCols = getSf2TotalColumns(month, schoolYear, includeSaturdays);
    const colDays = Array.from({ length: totalCols }, (_, i) => i + 1);

    // Fetch calendar holidays from localStorage
    let holidays: string[] = [];
    try {
        const storedEvents = localStorage.getItem('school_calendar_events');
        if (storedEvents) {
            const parsedEvents = JSON.parse(storedEvents);
            if (Array.isArray(parsedEvents)) {
                holidays = parsedEvents
                    .filter((e: CalendarEvent) => e.type === 'holiday' || e.type === 'suspension')
                    .flatMap((e: CalendarEvent) => {
                        const dates: string[] = [];
                        try {
                            const curr = new Date(e.date + 'T00:00:00');
                            const end = e.end_date ? new Date(e.end_date + 'T00:00:00') : new Date(curr);
                            if (!isNaN(curr.getTime()) && !isNaN(end.getTime())) {
                                while (curr <= end) {
                                    dates.push(curr.toISOString().split('T')[0]);
                                    curr.setDate(curr.getDate() + 1);
                                }
                            }
                        } catch (dateErr) {
                            console.error('Error parsing date range for event:', e, dateErr);
                        }
                        return dates;
                    });
            }
        }
    } catch (e) {
        console.error('Failed to load/parse calendar events for holiday filter', e);
    }

    const limitDow = includeSaturdays ? 6 : 5;
    const weekMultiplier = includeSaturdays ? 6 : 5;

    const activeWeeks = getActiveWeeks(month, schoolYear, includeSaturdays);

    if (schoolYear === '2026-2027' && SCHOOL_CALENDAR_2026_2027[month]) {
        const calendarDays = [...SCHOOL_CALENDAR_2026_2027[month]];
        if (calendarDays.length === 0) return labels;

        const firstSchoolDay = calendarDays[0];
        const lastSchoolDay = calendarDays[calendarDays.length - 1];

        const firstDateOfMonth = new Date(year, monthIndex, 1);
        const firstDayOffset = firstDateOfMonth.getDay() === 0 ? 6 : firstDateOfMonth.getDay() - 1;

        if (includeSaturdays) {
            for (let d = firstSchoolDay; d <= lastSchoolDay; d++) {
                const dateObj = new Date(year, monthIndex, d);
                if (dateObj.getDay() === 6) { // Saturday
                    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (!holidays.includes(dateStr) && !calendarDays.includes(d)) {
                        calendarDays.push(d);
                    }
                }
            }
            calendarDays.sort((a, b) => a - b);
        }

        calendarDays.forEach((d) => {
            const dateObj = new Date(year, monthIndex, d);
            const dow = dateObj.getDay();

            if (dow >= 1 && dow <= limitDow) {
                const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                if (holidays.includes(dateStr)) {
                    return;
                }

                const totalDaysFromMondayOfFirstWeek = d + firstDayOffset - 1;
                const calendarWeekIndex = Math.floor(totalDaysFromMondayOfFirstWeek / 7);
                const weekIndex = activeWeeks.indexOf(calendarWeekIndex);
                if (weekIndex !== -1) {
                    const colIndex = (weekIndex * weekMultiplier) + (dow - 1);
                    if (colIndex >= 0 && colIndex < totalCols) {
                        labels[colDays[colIndex]] = d.toString();
                    }
                }
            }
        });

        return labels;
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDateOfMonth = new Date(year, monthIndex, 1);
    const firstDayOffset = firstDateOfMonth.getDay() === 0 ? 6 : firstDateOfMonth.getDay() - 1;

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, monthIndex, d);
        const dow = dateObj.getDay();

        if (dow >= 1 && dow <= limitDow) {
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (holidays.includes(dateStr)) {
                continue;
            }

            const totalDaysFromMondayOfFirstWeek = d + firstDayOffset - 1;
            const calendarWeekIndex = Math.floor(totalDaysFromMondayOfFirstWeek / 7);
            const weekIndex = activeWeeks.indexOf(calendarWeekIndex);
            if (weekIndex !== -1) {
                const colIndex = (weekIndex * weekMultiplier) + (dow - 1);
                if (colIndex >= 0 && colIndex < totalCols) {
                    labels[colDays[colIndex]] = d.toString();
                }
            }
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
    const isSHS = gradeLevelNum === 11 || gradeLevelNum === 12;
    const taughtRaw = sectionObj.taught_subjects || [];
    const taughtNorms = taughtRaw.map(s => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
    const taughtSet = new Set(taughtNorms);
    const sectionTrack = (sectionObj.track || student.track || '').toLowerCase();

    // Determine candidate subjects for this section/grade
    let candidates = subjects.filter(s => {
        const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
        const isMatchingGrade = subjectGradeNum === gradeLevelNum;
        const isMatchingSection = s.section_id === sectionObj.id;
        return (isMatchingGrade || isMatchingSection) && s.term !== 'none';
    });

    if (isSHS) {
        if (taughtRaw.length > 0) {
            // Ensure all explicitly taught subjects are present
            for (const tName of taughtRaw) {
                const alreadyHas = candidates.some(s => isMatchingSubject(tName, s.id, s.subject_name));
                if (!alreadyHas) {
                    candidates.push({
                        id: `virtual_${tName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                        subject_name: tName,
                        subject_code: '',
                        grade_level: sectionObj.section_grade_level,
                        section_id: sectionObj.id,
                        term: 'all'
                    });
                }
            }

            // Filter to only match explicitly taught subjects
            candidates = candidates.filter(s => {
                return taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name));
            });

            // Use the exact subject name from taught_subjects, normalizing Old K-12 PE
            const isExplicitSSHS = (sectionObj?.track || '').toLowerCase().includes('sshs') || (sectionObj?.track || '').toLowerCase().includes('cluster');
            candidates = candidates.map(s => {
                const matchedTaught = taughtRaw.find(t => isMatchingSubject(t, s.id, s.subject_name));
                let name = matchedTaught || s.subject_name;
                if (gradeLevelNum === 12 && !isExplicitSSHS) {
                    name = normalizeGrade12PESubjectName(name, false);
                }
                if (name !== s.subject_name) {
                    return { ...s, subject_name: name };
                }
                return s;
            });
        } else if (sectionTrack) {
            candidates = candidates.filter(s => {
                const unitInfo = getShsSubjectUnitInfo(s.subject_name, sectionObj.section_grade_level);
                if (unitInfo.category === 'core' && gradeLevelNum === 11) return true;
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
        const intendedSubjects = getSubjectsForGrade(gradeLevelNum, schoolProfile?.curriculum);
        const isSubjectAllowedInTaught = (subId: string, subName: string) => {
            return taughtRaw.some(t => {
                if (isMatchingSubject(t, subId, subName)) return true;
                const normT = normalizeSubjectName(t);
                const normSub = normalizeSubjectName(subName);
                if (normT === 'mapeh') {
                    return normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health') || normSub.includes('physical');
                }
                return false;
            });
        };

        if (taughtRaw.length > 1) {
            candidates = candidates.filter(s => isSubjectAllowedInTaught(s.id, s.subject_name));
        } else {
            candidates = candidates.filter(s => {
                const isIntended = intendedSubjects.some((intended: { name: string }) => isMatchingSubject(intended.name, s.id, s.subject_name) || normalizeSubjectName(intended.name) === normalizeSubjectName(s.subject_name));
                const isExplicitlyTaught = isSubjectAllowedInTaught(s.id, s.subject_name);
                return isIntended || isExplicitlyTaught;
            });
        }
    }

    // Prioritize clean standard names and direct section subjects, then deduplicate by canonical name
    candidates.sort((a, b) => {
        if (!isSHS) {
            const aHasDigit = /\d+$/.test(a.subject_name.trim()) ? 1 : 0;
            const bHasDigit = /\d+$/.test(b.subject_name.trim()) ? 1 : 0;
            if (aHasDigit !== bHasDigit) return aHasDigit - bHasDigit;
        }
        const aDirect = a.section_id === sectionObj.id ? 1 : 0;
        const bDirect = b.section_id === sectionObj.id ? 1 : 0;
        return bDirect - aDirect;
    });

    const seenSubjectNames = new Set<string>();
    const uniqueDbSubjects: Subject[] = [];
    for (const sub of candidates) {
        const canonical = getCanonicalSubjectKey(sub.subject_name, gradeLevelNum);
        if (canonical && seenSubjectNames.has(canonical)) continue;
        if (canonical) seenSubjectNames.add(canonical);
        uniqueDbSubjects.push(sub);
    }
    const sectionDbSubjects = uniqueDbSubjects;

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
    const hasNumericKeys = !!(subjectSelections && Object.keys(subjectSelections).some(k => /^\d+$/.test(k)));

    if (isSHS) {
        // Resolve target list of subjects
        const selectedSubjects: typeof baseSubjects = [];
        if (hasNumericKeys) {
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
                    "health optimizing physical education and health 1",
                    "health optimizing physical education and health 2",
                    "health optimizing physical education and health 3",
                    "health optimizing physical education and health 4",
                    "health optimizing physical education 1",
                    "health optimizing physical education 2",
                    "health optimizing physical education 3",
                    "health optimizing physical education 4",
                    "hope 1",
                    "hope 2",
                    "hope 3",
                    "hope 4",
                    "physical science",
                    "reading and writing skills",
                    "statistics and probability",
                    "understanding culture society and politics",
                    "understanding culture, society and politics",
                    "21st century literature",
                    "contemporary philippine arts",
                    "pe and health 1",
                    "pe and health 2",
                    "pe and health 3",
                    "pe and health 4",
                    "physical education 1",
                    "physical education 2",
                    "physical education 3",
                    "physical education 4",
                    "pe 1",
                    "pe 2",
                    "pe 3",
                    "pe 4"
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
    } else if (hasNumericKeys) {
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
        // 1. Deduplicate base subjects & sort according to standard priority
        const seenInBase = new Set<string>();
        const uniqueBase: typeof baseSubjects = [];
        for (const s of baseSubjects) {
            const canonical = getCanonicalSubjectKey(s.name, gradeLevelNum);
            if (canonical && seenInBase.has(canonical)) continue;
            if (canonical) seenInBase.add(canonical);
            uniqueBase.push(s);
        }
        const sortedBase = sortSubjects(uniqueBase, s => s.name);
        
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
        const canonicalTarget = getCanonicalSubjectKey(subjectName, gradeLevelNum);
        
        // Find ALL matching subjects and average them (to handle potential duplicates or components)
        const matchingSubjects = sectionDbSubjects.filter(s => {
            const normalizedDb = normalizeSubjectName(s.subject_name);
            if (normalizedDb === normalizedTarget) return true;
            const canonicalDb = getCanonicalSubjectKey(s.subject_name, gradeLevelNum);
            if (canonicalDb && canonicalTarget && canonicalDb === canonicalTarget) return true;
            
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
                const classRecords = useAppStore.getState().classRecords;
                const hpsRecords = useAppStore.getState().hpsRecords;

                matchingSubjects.forEach(subject => {
                    const gradeVal = resolveStudentQuarterGrade(
                        student.lrn,
                        subject.id,
                        q,
                        schoolYear,
                        classRecords,
                        gradingSheetRecords,
                        hpsRecords,
                        sectionObj?.section_grade_level,
                        sectionObj?.track
                    );
                    if (gradeVal > 0) {
                        results.push(gradeVal);
                    }
                });
                return results.length > 0 ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : 0;
            };
            return [getQuarterAverage(1), getQuarterAverage(2), getQuarterAverage(3)];
        }

        // Direct subject name fallback if not in sectionDbSubjects
        const getDirectQuarterGrade = (q: 1 | 2 | 3) => {
            const classRecords = useAppStore.getState().classRecords;
            const hpsRecords = useAppStore.getState().hpsRecords;
            return resolveStudentQuarterGrade(
                student.lrn,
                subjectName,
                q,
                schoolYear,
                classRecords,
                gradingSheetRecords,
                hpsRecords,
                sectionObj?.section_grade_level,
                sectionObj?.track
            );
        };
        return [getDirectQuarterGrade(1), getDirectQuarterGrade(2), getDirectQuarterGrade(3)];
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

function calculateGeneralAverage(grades: Record<string, number[]>, currentSubjectsList: SF9SubjectItem[] = [], gradeLevel?: string) {
    let total = 0;
    let count = 0;
    let totalWeighted = 0;
    let totalUnits = 0;
    const dbSubjects = useAppStore.getState().subjects;
    const isSHS = (gradeLevel || '').includes('11') || (gradeLevel || '').includes('12');

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
                if (isSHS) {
                    const unitInfo = getShsSubjectUnitInfo(key, gradeLevel || 'Grade 11');
                    const yearUnits = unitInfo.yearUnits;
                    totalWeighted += finalGrade * yearUnits;
                    totalUnits += yearUnits;
                } else {
                    total += finalGrade;
                    count++;
                }
            }
        }
    });

    if (isSHS) {
        return totalUnits > 0 ? Math.round(totalWeighted / totalUnits) : 0;
    }
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
    comments?: string[];
    g1Remarks?: {
        term1CanDo?: string;
        term1ToImprove?: string;
        term2CanDo?: string;
        term2ToImprove?: string;
        term3CanDo?: string;
        term3ToImprove?: string;
    };
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
    showAdviserSig?: boolean;
    showHeadSig?: boolean;
    adviserSigWidth?: number;
    adviserSigHeight?: number;
    adviserSigOffset?: number;
    headSigWidth?: number;
    headSigHeight?: number;
    headSigOffset?: number;
    hideLearnerInfo?: boolean;
    hideAttendance?: boolean;
    hideGrades?: boolean;
    hideAdviserName?: boolean;
    hideHeadName?: boolean;
}

const isGrade1Level = (gLevel?: string): boolean => {
    if (!gLevel) return false;
    const g = gLevel.toString().trim().toLowerCase();
    const digits = g.replace(/\D/g, '');
    if (digits === '10' || digits === '11' || digits === '12') return false;
    return digits === '1' || g === 'g1' || /^grade\s*1(\D|$)/i.test(g);
};

function SF9Pages({
    student, schoolName, schoolYear, section, region, division, district,
    adviser, principal, principalTitle,
    grades, subjects: currentSubjects, comments = ['', '', ''], g1Remarks, attendance, pageSize, logoUrl, printMode = 'full', schoolProfile,
    showAdviserSig = true,
    showHeadSig = true,
    adviserSigWidth = 60,
    adviserSigHeight = 18,
    adviserSigOffset = 10,
    headSigWidth = 60,
    headSigHeight = 18,
    headSigOffset = 10,
    hideLearnerInfo = false,
    hideAttendance = false,
    hideGrades = false,
    hideAdviserName = false,
    hideHeadName = false
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
        if (hideGrades) return false;
        if (printMode === 'full') return true;
        if (printMode === 'term1') return termIndex === 0;
        if (printMode === 'term2') return termIndex === 1;
        if (printMode === 'term3') return termIndex === 2;
        return true;
    };

    // Whether to show final grade & remarks (only in full or term3)
    const showFinalAndRemarks = !hideGrades && (printMode === 'full' || printMode === 'term3');

    // Filter attendance months by term
    const getAttendanceValue = (idx: number, value: number): number | string => {
        if (hideAttendance || value < 0) return '';
        if (printMode === 'full') return value;
        const monthAbbr = attendance.months[idx];
        if (monthAbbr === 'TOTAL') return '';
        const termKey = printMode;
        const termMonths = TERM_MONTHS[termKey] || [];
        return termMonths.includes(monthAbbr) ? value : '';
    };

    const calculateTotal = (dataArr: number[]) => {
        if (hideAttendance || printMode === 'term1' || printMode === 'term2') return '';
        const values = dataArr.slice(0, 11);
        const sum = values.filter(v => v >= 0).reduce((a, b) => a + b, 0);
        const hasAnyData = values.some(v => v >= 0);
        return hasAnyData ? sum : '';
    };

    const generalAverage = calculateGeneralAverage(grades, currentSubjects, student.grade_level);

    const cleanDivision = (division || '')
        .replace(/schools division office of/i, '')
        .replace(/schools division of/i, '')
        .trim()
        .toUpperCase();

        const isG1 = isGrade1Level(student.grade_level);
        if (isG1) {
            return (
                <Page size={pageSize} orientation="portrait" style={{ padding: 10, fontFamily: 'BookmanOldStyle' }}>
                    <View style={[styles.singleBorderWrapper, isValuesOnly ? { borderColor: transparentBorder } : {}]}>
                        <View style={{ flex: 1, padding: 8 }}>
                            {/* Header spanning full width */}
                            <View style={[styles.singleHeaderContainer, isValuesOnly ? { opacity: 0 } : {}, { marginBottom: 4 }]}>
                                <Image src={`${import.meta.env.BASE_URL}deped_logo_left.png`} style={[styles.singleLogo, { width: 48, height: 48 }]} />
                                <View style={styles.singleHeaderCenter}>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle', fontSize: 7.5 }]}>Republic of the Philippines</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle', fontSize: 7.5 }]}>Department of Education</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle', fontSize: 7.5 }]}>{region || '"RegionVIII'}</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>SCHOOLS DIVISION OFFICE OF {cleanDivision || 'LEYTE'}</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle', fontSize: 7.5 }]}>{district || 'District of Creative'}</Text>
                                    <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle', fontSize: 7.5 }]}>
                                        {(() => {
                                            const muniCity = schoolProfile?.municipality || schoolProfile?.city || '';
                                            const prov = schoolProfile?.province || '';
                                            return (muniCity && prov) ? `${muniCity}, ${prov}` : (muniCity || prov || 'Municipality/City, Province');
                                        })()}
                                    </Text>
                                    <Text style={[styles.singleHeaderText, { marginTop: 2, fontFamily: 'BookmanOldStyle-Bold', fontSize: 9 }]}>{schoolName || 'RIC CREATIVE NATIONAL HIGH SCHOOL'}</Text>
                                </View>
                                <Image src={logoUrl || `${import.meta.env.BASE_URL}school-logo.png`} style={[styles.singleLogo, { width: 48, height: 48 }]} />
                            </View>

                            <Text style={{ textAlign: 'center', marginBottom: 6, marginTop: 1 }}>
                                <Text style={[styles.singleReportTitle, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 12 }]}>{"LEARNER'S PROGRESS REPORT\n"}</Text>
                                <Text style={[styles.singleSchoolYear, { fontFamily: 'BookmanOldStyle', fontSize: 8 }]}>{"School Year: " + schoolYear}</Text>
                            </Text>

                            {/* Student Info Bar (Full width) */}
                            <View style={{ marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4 }}>
                                <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                    <View style={{ width: '27%', flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 7.2, width: 28 }}>LRN:</Text>
                                        <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.2 }]}>{hideLearnerInfo ? ' ' : (student.lrn || ' ')}</Text>
                                    </View>
                                    <View style={{ width: '58%', flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 7.2, width: 30 }}>Name:</Text>
                                        <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.2 }]}>{hideLearnerInfo ? ' ' : formatLearnerName(student).toUpperCase()}</Text>
                                    </View>
                                    <View style={{ width: '15%', flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 7.2, width: 22 }}>Sex:</Text>
                                        <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.2 }]}>{hideLearnerInfo ? ' ' : (student.gender || ' ').toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ width: '27%', flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 7.2, width: 66 }}>Grade & Section:</Text>
                                        <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.2 }]}>{hideLearnerInfo ? ' ' : `1 - ${section}`}</Text>
                                    </View>
                                    <View style={{ width: '58%', flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 7.2, width: 36 }}>Adviser:</Text>
                                        <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.2 }]}>{!hideAdviserName && adviser ? adviser.toUpperCase() : ' '}</Text>
                                    </View>
                                    <View style={{ width: '15%', flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 7.2, width: 22 }}>Age:</Text>
                                        <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.2 }]}>{hideLearnerInfo ? ' ' : (student.age || ' ')}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Main Content Area (2 Columns) */}
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                {/* Left Column (50% Width) */}
                                <View style={{ width: '49%', paddingRight: 8, borderRightWidth: 1, borderColor: '#CCC', justifyContent: 'space-between' }}>
                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.5, marginBottom: 4, lineHeight: 1.2 }}>
                                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold' }}>{"Dear Parents/Guardians,\n"}</Text>
                                        {"This report provides a descriptive account of your child's learning progress for each term. It highlights what your child can already do, what they are currently developing, and how they can be further supported.\n\nThis report is based on varied evidence of learning including classroom activities, observations, learner outputs, and assessments. It is designed to give a clearer development rather than relying on numerical or letter grades."}
                                    </Text>

                                    {(() => {
                                        const g1R = g1Remarks || {};
                                        const termConfig = [
                                            { title: 'TERM 1 (UNANG TERMINO)', canDo: !hideGrades ? (g1R.term1CanDo || '') : '', toImprove: !hideGrades ? (g1R.term1ToImprove || '') : '' },
                                            { title: 'TERM 2 (IKALAWANG TERMINO)', canDo: !hideGrades ? (g1R.term2CanDo || '') : '', toImprove: !hideGrades ? (g1R.term2ToImprove || '') : '' },
                                            { title: 'TERM 3 (IKATLONG TERMINO)', canDo: !hideGrades ? (g1R.term3CanDo || '') : '', toImprove: !hideGrades ? (g1R.term3ToImprove || '') : '' },
                                        ];

                                        return termConfig.map((tItem, tIdx) => (
                                            <View key={tIdx} style={{ flex: 1, marginBottom: tIdx === 2 ? 0 : 8, justifyContent: 'space-between' }}>
                                                <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5, textAlign: 'center', marginBottom: 3 }}>{tItem.title}</Text>
                                                <View style={{ borderWidth: 1, borderColor: '#000', flex: 1, minHeight: 44, flexDirection: 'row', marginBottom: 3 }}>
                                                    <View style={{ width: '38%', borderRightWidth: 1, borderColor: '#000', padding: 2, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 5.5, textAlign: 'center' }}>{"What Your Child\nCan Do\n(Mga Nagagawa)"}</Text>
                                                    </View>
                                                    <View style={{ width: '62%', padding: 3, justifyContent: 'center' }}>
                                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.5, lineHeight: 1.25 }}>{tItem.canDo}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ borderWidth: 1, borderColor: '#000', flex: 1, minHeight: 44, flexDirection: 'row', marginBottom: 3 }}>
                                                    <View style={{ width: '38%', borderRightWidth: 1, borderColor: '#000', padding: 2, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 5.5, textAlign: 'center' }}>{"What Your Child\nIs Learning to Improve\n(Dapat Linangin)"}</Text>
                                                    </View>
                                                    <View style={{ width: '62%', padding: 3, justifyContent: 'center' }}>
                                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.5, lineHeight: 1.25 }}>{tItem.toImprove}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.5, width: 105 }}>Parent's/Guardian Signature:</Text>
                                                    <View style={{ flex: 1, borderBottomWidth: 1, borderColor: '#000' }} />
                                                </View>
                                            </View>
                                        ));
                                    })()}
                                </View>

                                {/* Right Column (50% Width) */}
                                <View style={{ width: '49%', paddingLeft: 8, justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 9, textAlign: 'center', marginBottom: 4 }}>ATTENDANCE RECORD</Text>
                                        <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 4 }}>
                                            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#F9FAFB' }}>
                                                <View style={{ width: '12%', borderRightWidth: 1, borderColor: '#000', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5 }}>Term</Text></View>
                                                <View style={{ width: '20%', borderRightWidth: 1, borderColor: '#000', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5 }}>Month</Text></View>
                                                <View style={{ width: '23%', borderRightWidth: 1, borderColor: '#000', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6, textAlign: 'center' }}>{"No. of School\nDays"}</Text></View>
                                                <View style={{ width: '23%', borderRightWidth: 1, borderColor: '#000', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6, textAlign: 'center' }}>{"No. of Days\nPresent"}</Text></View>
                                                <View style={{ width: '22%', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6, textAlign: 'center' }}>{"No. of Days\nAbsent"}</Text></View>
                                            </View>

                                            {[
                                                { term: '1', months: [{ name: 'June', idx: 0 }, { name: 'July', idx: 1 }, { name: 'August', idx: 2 }, { name: 'September', idx: 3 }] },
                                                { term: '2', months: [{ name: 'September', idx: 4 }, { name: 'October', idx: 5 }, { name: 'November', idx: 6 }, { name: 'December', idx: 7 }] },
                                                { term: '3', months: [{ name: 'January', idx: 8 }, { name: 'February', idx: 9 }, { name: 'March', idx: 10 }, { name: 'April', idx: 11 }] },
                                            ].map((tg, tgIdx) => (
                                                <View key={tgIdx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
                                                    <View style={{ width: '12%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                                                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7 }}>{tg.term}</Text>
                                                    </View>
                                                    <View style={{ width: '88%' }}>
                                                        {tg.months.map((m, mInTerm) => {
                                                            const days = !hideAttendance && attendance.schoolDays[m.idx] >= 0 ? attendance.schoolDays[m.idx] : '';
                                                            const pres = !hideAttendance && attendance.daysPresent[m.idx] >= 0 ? attendance.daysPresent[m.idx] : '';
                                                            const abs = !hideAttendance && attendance.daysAbsent[m.idx] >= 0 ? attendance.daysAbsent[m.idx] : '';
                                                            return (
                                                                <View key={m.idx} style={{ flexDirection: 'row', borderBottomWidth: mInTerm === 3 ? 0 : 1, borderColor: '#000', height: 14.5 }}>
                                                                    <View style={{ width: '22.727%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6 }}>{m.name}</Text></View>
                                                                    <View style={{ width: '26.136%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6 }}>{days}</Text></View>
                                                                    <View style={{ width: '26.136%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6 }}>{pres}</Text></View>
                                                                    <View style={{ width: '25%', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6 }}>{abs}</Text></View>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            ))}

                                            <View style={{ flexDirection: 'row', height: 16 }}>
                                                <View style={{ width: '32%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5 }}>TOTAL</Text></View>
                                                <View style={{ width: '23%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5 }}>{calculateTotal(attendance.schoolDays)}</Text></View>
                                                <View style={{ width: '23%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5 }}>{calculateTotal(attendance.daysPresent)}</Text></View>
                                                <View style={{ width: '22%', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5 }}>{calculateTotal(attendance.daysAbsent)}</Text></View>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ marginTop: 8, marginBottom: 8 }}>
                                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5, textAlign: 'center', marginBottom: 6 }}>IMPORTANT NOTE TO PARENTS/GUARDIANS</Text>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6, marginBottom: 6, lineHeight: 1.35 }}>
                                            A detailed record of your child's progress across specific learning competencies is attached in the succeeding pages. This includes the monitoring of skills in Reading and Literacy, Language, Mathematics, Good Manners and Right Conduct, and Makabansa.
                                        </Text>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6, marginBottom: 6 }}>Performance levels used in monitoring:</Text>
                                        <View style={{ borderWidth: 1, borderColor: '#000' }}>
                                            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#F9FAFB' }}>
                                                <View style={{ width: '15%', borderRightWidth: 1, borderColor: '#000', padding: 2.5, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 5.5, textAlign: 'center' }}>{"Letter\nGrade"}</Text></View>
                                                <View style={{ width: '30%', borderRightWidth: 1, borderColor: '#000', padding: 2.5, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 5.5, textAlign: 'center' }}>Descriptor</Text></View>
                                                <View style={{ width: '55%', padding: 2.5, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 5.5, textAlign: 'center' }}>Description</Text></View>
                                            </View>
                                            {[
                                                { grade: 'A', desc: 'Advancing\n(Namumukod-tangi)', detail: 'Consistently demonstrates skills and understanding beyond expectations; applies learning independently and confidently.' },
                                                { grade: 'B', desc: 'Benchmarking\n(Naipamamalas)', detail: 'Meets expected learning standards; demonstrates skills and understanding with consistency.' },
                                                { grade: 'C', desc: 'Connecting\n(Natutungo)', detail: 'Shows developing understanding and skills; requires minimal guidance to meet expectations.' },
                                                { grade: 'D', desc: 'Developing\n(Napauunlad)', detail: 'Demonstrates emerging skills and understanding; requires regular guidance and support.' },
                                                { grade: 'E', desc: 'Emerging\n(Nagsisimula)', detail: 'Beginning to demonstrate basic skills; requires close supervision and targeted intervention.' },
                                            ].map((rItem, rIdx) => (
                                                <View key={rIdx} style={{ flexDirection: 'row', borderBottomWidth: rIdx === 4 ? 0 : 1, borderColor: '#000' }}>
                                                    <View style={{ width: '15%', borderRightWidth: 1, borderColor: '#000', padding: 3, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6 }}>{rItem.grade}</Text></View>
                                                    <View style={{ width: '30%', borderRightWidth: 1, borderColor: '#000', padding: 3, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2, textAlign: 'center' }}>{rItem.desc}</Text></View>
                                                    <View style={{ width: '55%', padding: 3, justifyContent: 'center' }}><Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2, lineHeight: 1.25 }}>{rItem.detail}</Text></View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={{ marginTop: 4 }}>
                                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5, textAlign: 'center', marginBottom: 4 }}>CERTIFICATE OF TRANSFER</Text>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6, marginBottom: 5 }}>
                                            This is to certify that the above-named learner has satisfactory completed the requirements for the grade level indicated.
                                        </Text>
                                        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6 }}>Admitted to Grade: </Text>
                                            <View style={{ width: '65%', borderBottomWidth: 1, borderColor: '#000' }} />
                                        </View>
                                        <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6 }}>Eligible for Admission to Grade: </Text>
                                            <View style={{ width: '45%', borderBottomWidth: 1, borderColor: '#000' }} />
                                        </View>
                                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6, marginBottom: 14 }}>Approved:</Text>

                                        <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center', marginBottom: 12 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7, borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center' }}>{!hideAdviserName && adviser ? adviser.toUpperCase() : ' '}</Text>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Italic', fontSize: 6, marginTop: 1 }}>Adviser</Text>
                                        </View>

                                        <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center', marginBottom: 14 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7, borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center' }}>{!hideHeadName && principal ? principal.toUpperCase() : ' '}</Text>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Italic', fontSize: 6, marginTop: 1 }}>School Head</Text>
                                        </View>

                                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 8, textAlign: 'center', marginBottom: 4 }}>CANCELLATION OF ELIGIBILITY TO TRANSFER</Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <View style={{ width: '60%', flexDirection: 'row' }}>
                                                <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6 }}>Admitted in: </Text>
                                                <View style={{ flex: 1, borderBottomWidth: 1, borderColor: '#000' }} />
                                            </View>
                                            <View style={{ width: '36%', flexDirection: 'row' }}>
                                                <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6 }}>Date: </Text>
                                                <View style={{ flex: 1, borderBottomWidth: 1, borderColor: '#000' }} />
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center' }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7, borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center' }}>{!hideHeadName && principal ? principal.toUpperCase() : ' '}</Text>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Italic', fontSize: 6, marginTop: 1 }}>School Head</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </Page>
            );
        }

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
                                                {hideLearnerInfo ? ' ' : fullName}
                                            </Text>
                                        </View>
                                        {/* Age Cell — 11%, short underline */}
                                        <View style={{ width: '11%', flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 22 }}>Age:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>
                                                {hideLearnerInfo ? ' ' : (student.age || ' ')}
                                            </Text>
                                        </View>
                                        {/* Sex Cell — 24%, long underline */}
                                        <View style={{ width: '24%', flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 22 }}>Sex:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>
                                                {hideLearnerInfo ? ' ' : (student.gender || ' ').toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.singleInfoRow}>
                                        {/* LRN Cell — 45% */}
                                        <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 30 }}>LRN:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>
                                                {hideLearnerInfo ? ' ' : (student.lrn || ' ')}
                                            </Text>
                                        </View>
                                        {/* Grade Cell — 12%, short underline */}
                                        <View style={{ width: '12%', flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 28 }}>Grade:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'left', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8, paddingLeft: 2 }]}>
                                                {hideLearnerInfo ? ' ' : (student.grade_level.replace('Grade ', '') || ' ')}
                                            </Text>
                                        </View>
                                        {/* Section Cell — 43%, long underline */}
                                        <View style={{ width: '43%', flexDirection: 'row', alignItems: 'center', paddingLeft: 5 }}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, width: 38 }}>Section:</Text>
                                            <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>
                                                {hideLearnerInfo ? ' ' : (section || ' ').toUpperCase()}
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
                                                        {hideLearnerInfo ? ' ' : (trackDisplay || ' ')}
                                                    </Text>
                                                </View>
                                                {/* Strand Cell — 62% */}
                                                <View style={{ width: '62%', flexDirection: 'row', alignItems: 'center', paddingLeft: 10 }}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, marginRight: 4 }}>Strand:</Text>
                                                    <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: strandFontSize }]}>
                                                        {hideLearnerInfo ? ' ' : (strandDisplay || ' ')}
                                                    </Text>
                                                </View>
                                            </>
                                        ) : (
                                            /* Grade 11 or other grade levels */
                                            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 8, marginRight: 4 }}>Track (if SHS only):</Text>
                                                <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'left', fontFamily: 'BookmanOldStyle-Bold', fontSize: trackFontSize, paddingLeft: 4 }]}>
                                                    {hideLearnerInfo ? ' ' : (isSHS ? trackDisplay : ' ')}
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
                                        <View style={[styles.singleLpHeaderCell, { width: '42%', borderBottomWidth: 0, alignItems: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 } : { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 }}>Learning Areas</Text></View>
                                        <View style={[styles.singleLpHeaderCell, { width: '24%', padding: 0 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <View style={{ borderBottomWidth: 1, borderColor: borderColor, padding: 1, alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 } : { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 }}>TERM</Text></View>
                                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 } : { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 }}>1</Text></View>
                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 } : { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 }}>2</Text></View>
                                                <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 } : { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 }}>3</Text></View>
                                            </View>
                                        </View>
                                        <View style={[styles.singleLpHeaderCell, { width: '14%', borderBottomWidth: 0 }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 } : { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 }}>Final Grade</Text></View>
                                        <View style={[styles.singleLpHeaderCell, { width: '20%', borderBottomWidth: 0, borderRightWidth: 0 }]}><Text style={isValuesOnly ? { color: transparentBorder, fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 } : { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5 }}>Remarks</Text></View>
                                    </View>
                                    {currentSubjects.filter(subj => {
                                        if (subj.isReserved) return false;
                                        const norm = normalizeSubjectName(subj.name);
                                        if (norm.includes('arabic') || norm.includes('islamic')) {
                                            const row = grades[subj.name] || [0, 0, 0];
                                            const hasAnyGrade = row.some(g => g > 0);
                                            if (!hasAnyGrade) return false;
                                        }
                                        return true;
                                    }).map((subj, idx) => {
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
                                                                {!hideGrades && !isCategoryHeader && isOfferedInTerm(1) && showTermValue(0) && gradeRow[0] ? formatGradeForDisplay(gradeRow[0], student.grade_level) : ''}
                                                            </Text>
                                                        </View>
                                                        <View style={[{ width: '33.33%', borderRightWidth: 1, borderColor: borderColor, justifyContent: 'center', alignItems: 'center' }, (!isCategoryHeader && !isReserved && !isOfferedInTerm(2)) ? { backgroundColor: '#E5E7EB' } : {}]}>
                                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }}>
                                                                {!hideGrades && !isCategoryHeader && isOfferedInTerm(2) && showTermValue(1) && gradeRow[1] ? formatGradeForDisplay(gradeRow[1], student.grade_level) : ''}
                                                            </Text>
                                                        </View>
                                                        <View style={[{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }, (!isCategoryHeader && !isReserved && !isOfferedInTerm(3)) ? { backgroundColor: '#E5E7EB' } : {}]}>
                                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }}>
                                                                {!hideGrades && !isCategoryHeader && isOfferedInTerm(3) && showTermValue(2) && gradeRow[2] ? formatGradeForDisplay(gradeRow[2], student.grade_level) : ''}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <View style={[styles.singleLpCell, { width: '14%', textAlign: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }}>
                                                        {!hideGrades && !isCategoryHeader && showFinalAndRemarks && finalGrade ? formatGradeForDisplay(finalGrade, student.grade_level) : ''}
                                                    </Text>
                                                </View>
                                                <View style={[styles.singleLpCellLast, { width: '20%', textAlign: 'center' }]}>
                                                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 7.5 }}>
                                                        {!hideGrades && !isCategoryHeader && showFinalAndRemarks && finalGrade ? getRemarks(finalGrade) : ''}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                    <View style={[styles.singleLpRow, { borderBottomWidth: 0 }, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <View style={[styles.singleLpCell, { width: '66%', alignItems: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}><Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5, ...(isValuesOnly ? { color: transparentBorder } : {}) }}>General Average</Text></View>
                                        <View style={[styles.singleLpCell, { width: '14%', textAlign: 'center', justifyContent: 'center' }, isValuesOnly ? { borderRightColor: transparentBorder } : {}]}>
                                            <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }}>
                                                {!hideGrades && showFinalAndRemarks && generalAverage > 0 ? formatGradeForDisplay(generalAverage, student.grade_level) : ''}
                                            </Text>
                                        </View>
                                        <View style={[styles.singleLpCellLast, { width: '20%', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }]}>
                                            {!hideGrades && showFinalAndRemarks && generalAverage > 0 ? getGeneralAverageRemarks(generalAverage, grades, currentSubjects, student.lrn, schoolYear).map((line, i) => (
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
                                        <Text style={[styles.singleCommentValue, { fontFamily: 'BookmanOldStyle' }]}>{!hideGrades && showTermValue(0) ? (comments[0] || '') : ''}</Text>
                                    </View>
                                    <View style={[styles.singleCommentTermRow, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <Text style={[styles.singleCommentLabel, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>Term 2</Text>
                                        <Text style={[styles.singleCommentValue, { fontFamily: 'BookmanOldStyle' }]}>{!hideGrades && showTermValue(1) ? (comments[1] || '') : ''}</Text>
                                    </View>
                                    <View style={[styles.singleCommentTermRowLast, isValuesOnly ? { borderBottomColor: transparentBorder } : {}]}>
                                        <Text style={[styles.singleCommentLabel, isValuesOnly ? { color: transparentBorder } : {}, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 8 }]}>Term 3</Text>
                                        <Text style={[styles.singleCommentValue, { fontFamily: 'BookmanOldStyle' }]}>{!hideGrades && showTermValue(2) ? (comments[2] || '') : ''}</Text>
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
                                    <View style={{ width: '45%', alignItems: 'center', position: 'relative' }}>
                                        {showHeadSig && schoolProfile?.head_signature_url && (
                                            <View style={{ position: 'absolute', bottom: headSigOffset, left: 0, right: 0, alignItems: 'center' }}>
                                                <Image 
                                                    src={schoolProfile.head_signature_url} 
                                                    style={{ height: headSigHeight, width: headSigWidth, objectFit: 'contain' }} 
                                                />
                                            </View>
                                        )}
                                        <Text style={[{ fontSize: 7.5, fontFamily: 'BookmanOldStyle-Bold', textAlign: 'center', minHeight: 9 }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                            {!hideHeadName ? (principal || '').toUpperCase() : ' '}
                                        </Text>
                                        <View style={{ borderBottomWidth: 1, borderBottomColor: borderColor, width: '100%', marginTop: 1 }} />
                                        <Text style={[{ fontSize: 6.5, fontFamily: 'BookmanOldStyle', marginTop: 1, textAlign: 'center' }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                            {(principalTitle || 'School Head').toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ width: '45%', alignItems: 'center', position: 'relative' }}>
                                        {showAdviserSig && schoolProfile?.adviser_signature_url && (
                                            <View style={{ position: 'absolute', bottom: adviserSigOffset, left: 0, right: 0, alignItems: 'center' }}>
                                                <Image 
                                                    src={schoolProfile.adviser_signature_url} 
                                                    style={{ height: adviserSigHeight, width: adviserSigWidth, objectFit: 'contain' }} 
                                                />
                                            </View>
                                        )}
                                        <Text style={[{ fontSize: 7.5, fontFamily: 'BookmanOldStyle-Bold', textAlign: 'center', minHeight: 9 }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                            {!hideAdviserName ? (adviser || '').toUpperCase() : ' '}
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
                                    <View style={{ width: '45%', alignItems: 'center', position: 'relative' }}>
                                        {showHeadSig && schoolProfile?.head_signature_url && (
                                            <View style={{ position: 'absolute', bottom: headSigOffset, left: 0, right: 0, alignItems: 'center' }}>
                                                <Image 
                                                    src={schoolProfile.head_signature_url} 
                                                    style={{ height: headSigHeight, width: headSigWidth, objectFit: 'contain' }} 
                                                />
                                            </View>
                                        )}
                                        <Text style={[{ fontSize: 7.5, fontFamily: 'BookmanOldStyle-Bold', textAlign: 'center', minHeight: 9 }, isValuesOnly ? { color: transparentBorder } : {}]}>
                                            {!hideHeadName ? (principal || '').toUpperCase() : ' '}
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
    attendanceRecords?: AttendanceRecord[];
    adviser: string;
    pageSize: 'A4' | 'LETTER';
    printMode?: SF9PrintMode;
    subjectSelections?: Record<number, string>;
}

const SF9PagesMemo = React.memo(SF9Pages);

export function SF9BatchDocument({
    students, sections, sectionObj, subjects, gradingSheetRecords, schoolProfile, activeSchoolYear, observedValues, sf2Sheets, attendanceRecords = [], adviser, pageSize, printMode = 'full', subjectSelections
}: SF9BatchDocumentProps) {
    const sigSettings = sectionObj.section_metadata?.sf9SignatureSettings || {};

    return (
        <Document title={`SF9 Batch - ${sectionObj.section_name}`}>
            {students.filter(student => {
                if (printMode === 'full') return true;
                const q = printMode === 'term1' ? 1 : printMode === 'term2' ? 2 : 3;
                const comment = observedValues.find(v => v.student_lrn === student.lrn && v.school_year === activeSchoolYear && v.quarter === q)?.values?.['teacher_comment'] || '';
                return comment.trim() !== '';
            }).map((student) => {
                const { subjects: computedSubjects, grades } = computeStudentGrades(student, sectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile, subjectSelections);
                const values = computeStudentValues(student, observedValues, activeSchoolYear);
                const attendance = computeStudentAttendance(student, sf2Sheets, activeSchoolYear, sectionObj, attendanceRecords);
                
                // Resolve student's section name (supports both ID and name stored in student_section)
                const resolvedSection = sections.find(s => s.id === student.student_section || s.section_name === student.student_section);
                const sectionName = resolvedSection?.section_name || sectionObj.section_name;

                const getQComment = (q: number) => observedValues.find(v => v.student_lrn === student.lrn && v.school_year === activeSchoolYear && v.quarter === q)?.values?.['teacher_comment'] || '';
                const studentComments = [getQComment(1), getQComment(2), getQComment(3)];

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
                        principalTitle={schoolProfile.head_position || 'School Head'}
                        grades={grades}
                        subjects={computedSubjects}
                        observedValues={values}
                        comments={studentComments}
                        attendance={attendance}
                        pageSize={pageSize}
                        logoUrl={schoolProfile.logo_url || ''}
                        schoolProfile={schoolProfile}
                        printMode={printMode}
                        showAdviserSig={sigSettings.showAdviserSig !== false}
                        showHeadSig={sigSettings.showHeadSig !== false}
                        adviserSigWidth={sigSettings.adviserSigWidth ?? 60}
                        adviserSigHeight={sigSettings.adviserSigHeight ?? 18}
                        adviserSigOffset={sigSettings.adviserSigOffset ?? 10}
                        headSigWidth={sigSettings.headSigWidth ?? 60}
                        headSigHeight={sigSettings.headSigHeight ?? 18}
                        headSigOffset={sigSettings.headSigOffset ?? 10}
                        hideLearnerInfo={sigSettings.hideLearnerInfo ?? false}
                        hideAttendance={sigSettings.hideAttendance ?? false}
                        hideGrades={sigSettings.hideGrades ?? false}
                        hideAdviserName={sigSettings.hideAdviserName ?? false}
                        hideHeadName={sigSettings.hideHeadName ?? false}
                    />
                );
            })}
        </Document>
    );
}

export function SF9Page() {

    const students = useAppStore(state => state.students);
    const sections = useAppStore(state => state.sections);
    const schoolProfile = useAppStore(state => state.schoolProfile);
    const activeSchoolYear = useAppStore(state => state.activeSchoolYear);
    const gradingSheetRecords = useAppStore(state => state.gradingSheetRecords);
    const subjects = useAppStore(state => state.subjects);
    const observedValues = useAppStore(state => state.observedValues);
    const storeSf2Sheets = useAppStore(state => state.sf2Sheets);
    const storeAttendanceRecords = useAppStore(state => state.attendanceRecords);
    const setSF2Sheets = useAppStore(state => state.setSF2Sheets);
    const updateObservedValue = useAppStore(state => state.updateObservedValue);
    const setCurrentView = useAppStore(state => state.setCurrentView);
    const teachers = useAppStore(state => state.teachers);
    const { user } = useAuthStore();
    const [hydratedSf2Sheets, setHydratedSf2Sheets] = useState<SF2Sheet[]>([]);
    const [hydratedAttendanceRecords, setHydratedAttendanceRecords] = useState<AttendanceRecord[]>([]);

    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [pageSize, setPageSize] = useState<'A4' | 'LETTER'>('A4');
    const [isValuesModalOpen, setIsValuesModalOpen] = useState(false);
    const [modalQuarter, setModalQuarter] = useState<1 | 2 | 3>(1);
    const teacherList: User[] = teachers;
    const [isBatchReady, setIsBatchReady] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);
    const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [isStabilizing, setIsStabilizing] = useState(false);
    const [isPending] = useTransition();
    const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
    const [layoutModalInitialTab, setLayoutModalInitialTab] = useState<'subjects' | 'signatures'>('subjects');

    // Local Signature Preview States
    const [showAdviserSig, setShowAdviserSig] = useState(true);
    const [adviserSigWidth, setAdviserSigWidth] = useState(60);
    const [adviserSigHeight, setAdviserSigHeight] = useState(18);
    const [adviserSigOffset, setAdviserSigOffset] = useState(10);

    const [showHeadSig, setShowHeadSig] = useState(true);
    const [headSigWidth, setHeadSigWidth] = useState(60);
    const [headSigHeight, setHeadSigHeight] = useState(18);
    const [headSigOffset, setHeadSigOffset] = useState(10);

    // Hide Elements States
    const [hideLearnerInfo, setHideLearnerInfo] = useState(false);
    const [hideAttendance, setHideAttendance] = useState(false);
    const [hideGrades, setHideGrades] = useState(false);
    const [hideAdviserName, setHideAdviserName] = useState(false);
    const [hideHeadName, setHideHeadName] = useState(false);

    const [printMode, setPrintMode] = useState<SF9PrintMode>('full');
    const [suggestionTab, setSuggestionTab] = useState<'academic' | 'behavior' | 'growth'>('academic');
    const [suggestionMode, setSuggestionMode] = useState<'replace' | 'append'>('append');
    const [suggestionTone, setSuggestionTone] = useState<'positive' | 'neutral' | 'negative'>('positive');

    // Local state for Evaluated Values to prevent lag
    const [pendingChanges, setPendingChanges] = useState<Record<number, Record<string, string>>>({});

    // Local state for batch PDF blob URL
    const [batchBlobUrl, setBatchBlobUrl] = useState<string | null>(null);

    // Grade 1 Learner Progress Modal & Remarks State
    const [isG1ModalOpen, setIsG1ModalOpen] = useState(false);
    const [g1RemarksState, setG1RemarksState] = useState({
        term1CanDo: '',
        term1ToImprove: '',
        term2CanDo: '',
        term2ToImprove: '',
        term3CanDo: '',
        term3ToImprove: '',
    });
    const [tempG1Remarks, setTempG1Remarks] = useState(g1RemarksState);

    useEffect(() => {
        if (selectedStudent) {
            try {
                const stored = localStorage.getItem(`g1_remarks_${selectedStudent.lrn}_${activeSchoolYear}`);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setG1RemarksState(parsed);
                    setTempG1Remarks(parsed);
                } else {
                    const empty = { term1CanDo: '', term1ToImprove: '', term2CanDo: '', term2ToImprove: '', term3CanDo: '', term3ToImprove: '' };
                    setG1RemarksState(empty);
                    setTempG1Remarks(empty);
                }
            } catch (e) {
                console.error('Failed to load G1 remarks:', e);
            }
        }
    }, [selectedStudent, activeSchoolYear]);

    const handleSaveG1Progress = () => {
        setG1RemarksState(tempG1Remarks);
        if (selectedStudent) {
            localStorage.setItem(`g1_remarks_${selectedStudent.lrn}_${activeSchoolYear}`, JSON.stringify(tempG1Remarks));
        }
        setIsG1ModalOpen(false);
    };

    useEffect(() => {
        let isMounted = true;

        const hydrateData = async () => {
            try {
                const [allSf2Sheets, allAttendanceRecords] = await Promise.all([
                    db.getAllRecords<SF2Sheet>('sf2Sheets'),
                    db.getAllRecords<AttendanceRecord>('attendanceRecords')
                ]);
                if (isMounted) {
                    setHydratedSf2Sheets(allSf2Sheets);
                    setHydratedAttendanceRecords(allAttendanceRecords);
                }
            } catch (error) {
                console.error('Failed to hydrate SF2 sheets/attendance for SF9:', error);
            }
        };

        hydrateData();

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

    const attendanceRecords = useMemo(() => {
        const byId = new Map<string, AttendanceRecord>();
        hydratedAttendanceRecords.forEach((r) => byId.set(r.id, r));
        storeAttendanceRecords.forEach((r) => byId.set(r.id, r));
        return Array.from(byId.values());
    }, [hydratedAttendanceRecords, storeAttendanceRecords]);

    const selectedSectionObj = useMemo(() => sections.find(s => s.id === selectedSection), [sections, selectedSection]);
    const isCurrentG1 = useMemo(() => isGrade1(selectedStudent?.grade_level || selectedSectionObj?.section_grade_level), [selectedStudent, selectedSectionObj]);

    useEffect(() => {
        if (selectedSectionObj) {
            const sigSettings = selectedSectionObj.section_metadata?.sf9SignatureSettings || {};
            setShowAdviserSig(sigSettings.showAdviserSig !== false);
            setAdviserSigWidth(sigSettings.adviserSigWidth ?? 60);
            setAdviserSigHeight(sigSettings.adviserSigHeight ?? 18);
            setAdviserSigOffset(sigSettings.adviserSigOffset ?? 10);

            setShowHeadSig(sigSettings.showHeadSig !== false);
            setHeadSigWidth(sigSettings.headSigWidth ?? 60);
            setHeadSigHeight(sigSettings.headSigHeight ?? 18);
            setHeadSigOffset(sigSettings.headSigOffset ?? 10);

            setHideLearnerInfo(sigSettings.hideLearnerInfo ?? false);
            setHideAttendance(sigSettings.hideAttendance ?? false);
            setHideGrades(sigSettings.hideGrades ?? false);
            setHideAdviserName(sigSettings.hideAdviserName ?? false);
            setHideHeadName(sigSettings.hideHeadName ?? false);
        }
    }, [selectedSectionObj]);
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
        return gradeNum >= 1 && gradeNum <= 10;
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

    const currentSignatureSettings = useMemo(() => {
        if (!selectedSectionObj) return {};
        return selectedSectionObj.section_metadata?.sf9SignatureSettings || {};
    }, [selectedSectionObj]);

    const handleUpdateLayout = async (selections: Record<number, string>, sigSettings?: SF9SignatureSettings) => {
        if (!selectedSectionObj) return;
        
        try {
            const updatedSection = {
                ...selectedSectionObj,
                section_metadata: {
                    ...selectedSectionObj.section_metadata,
                    sf9SubjectSelections: selections,
                    sf9SignatureSettings: sigSettings
                }
            };
            await useAppStore.getState().updateSection(updatedSection);

            // Immediately update local signature states to the saved values
            // so the PDF preview reflects the new settings without a reload.
            // We cannot rely on handleCloseLayoutModal reading selectedSectionObj
            // because that memoized ref is still stale at this point.
            if (sigSettings) {
                setShowAdviserSig(sigSettings.showAdviserSig !== false);
                setAdviserSigWidth(sigSettings.adviserSigWidth ?? 60);
                setAdviserSigHeight(sigSettings.adviserSigHeight ?? 18);
                setAdviserSigOffset(sigSettings.adviserSigOffset ?? 10);
                setShowHeadSig(sigSettings.showHeadSig !== false);
                setHeadSigWidth(sigSettings.headSigWidth ?? 60);
                setHeadSigHeight(sigSettings.headSigHeight ?? 18);
                setHeadSigOffset(sigSettings.headSigOffset ?? 10);
                setHideLearnerInfo(sigSettings.hideLearnerInfo ?? false);
                setHideAttendance(sigSettings.hideAttendance ?? false);
                setHideGrades(sigSettings.hideGrades ?? false);
                setHideAdviserName(sigSettings.hideAdviserName ?? false);
                setHideHeadName(sigSettings.hideHeadName ?? false);
            }

            setIsLayoutModalOpen(false);
            useAppStore.getState().showNotification('SF9 layout and signature settings saved', 'success');
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

    // Automatically resolve default suggestion tone from student grades when modal state changes
    useEffect(() => {
        if (isValuesModalOpen && selectedStudent) {
            const gradesList: number[] = [];
            if (studentGrades?.grades) {
                Object.values(studentGrades.grades).forEach((termGrades) => {
                    const gradeVal = termGrades[modalQuarter - 1];
                    if (gradeVal && gradeVal > 0) {
                        gradesList.push(gradeVal);
                    }
                });
            }
            if (gradesList.length === 0) {
                setSuggestionTone('positive');
            } else {
                const avg = gradesList.reduce((a, b) => a + b, 0) / gradesList.length;
                if (avg >= 85) {
                    setSuggestionTone('positive');
                } else if (avg >= 75) {
                    setSuggestionTone('neutral');
                } else {
                    setSuggestionTone('negative');
                }
            }
        }
    }, [isValuesModalOpen, selectedStudent, modalQuarter, studentGrades]);

    const singleDocument = useMemo(() => {
        if (!selectedStudent || !selectedSectionObj) return null;
        
        const attendance = computeStudentAttendance(selectedStudent, sf2Sheets, activeSchoolYear, selectedSectionObj, attendanceRecords);

        const studentResolvedSection = sections.find(s => s.id === selectedStudent.student_section || s.section_name === selectedStudent.student_section);
        const resolvedSectionName = studentResolvedSection?.section_name || selectedSectionObj.section_name;

        const getQComment = (q: number) => observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === q)?.values?.['teacher_comment'] || '';
        const studentComments = [getQComment(1), getQComment(2), getQComment(3)];

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
                principalTitle={schoolProfile.head_position || 'School Head'} 
                grades={studentGrades.grades || {}} 
                subjects={studentGrades.subjects || []}
                observedValues={studentValues} 
                comments={studentComments}
                g1Remarks={g1RemarksState}
                attendance={attendance}
                pageSize={pageSize} 
                logoUrl={schoolProfile.logo_url || ''}
                schoolProfile={schoolProfile}
                printMode={printMode}
                showAdviserSig={showAdviserSig}
                showHeadSig={showHeadSig}
                adviserSigWidth={adviserSigWidth}
                adviserSigHeight={adviserSigHeight}
                adviserSigOffset={adviserSigOffset}
                headSigWidth={headSigWidth}
                headSigHeight={headSigHeight}
                headSigOffset={headSigOffset}
                hideLearnerInfo={hideLearnerInfo}
                hideAttendance={hideAttendance}
                hideGrades={hideGrades}
                hideAdviserName={hideAdviserName}
                hideHeadName={hideHeadName}
            />
        );
    }, [selectedStudent, selectedSectionObj, schoolProfile, activeSchoolYear, adviserName, studentGrades, studentValues, g1RemarksState, observedValues, sf2Sheets, attendanceRecords, pageSize, sections, printMode, showAdviserSig, showHeadSig, adviserSigWidth, adviserSigHeight, adviserSigOffset, headSigWidth, headSigHeight, headSigOffset, hideLearnerInfo, hideAttendance, hideGrades, hideAdviserName, hideHeadName]);

    const handleCloseLayoutModal = () => {
        if (selectedSectionObj) {
            const sigSettings = selectedSectionObj.section_metadata?.sf9SignatureSettings || {};
            setShowAdviserSig(sigSettings.showAdviserSig !== false);
            setAdviserSigWidth(sigSettings.adviserSigWidth ?? 60);
            setAdviserSigHeight(sigSettings.adviserSigHeight ?? 18);
            setAdviserSigOffset(sigSettings.adviserSigOffset ?? 10);

            setShowHeadSig(sigSettings.showHeadSig !== false);
            setHeadSigWidth(sigSettings.headSigWidth ?? 60);
            setHeadSigHeight(sigSettings.headSigHeight ?? 18);
            setHeadSigOffset(sigSettings.headSigOffset ?? 10);

            setHideLearnerInfo(sigSettings.hideLearnerInfo ?? false);
            setHideAttendance(sigSettings.hideAttendance ?? false);
            setHideGrades(sigSettings.hideGrades ?? false);
            setHideAdviserName(sigSettings.hideAdviserName ?? false);
            setHideHeadName(sigSettings.hideHeadName ?? false);
        }
        setIsLayoutModalOpen(false);
    };

    const handlePrint = useCallback(async () => {
        if (!selectedStudent || !singleDocument || isShsSf9Section) return;
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(singleDocument).toBlob();
            const url = URL.createObjectURL(blob);
            
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.focus();
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                };
            } else {
                alert('Could not open print window. Please check if popups are blocked.');
            }
        } catch (error) {
            console.error('Print failed:', error);
            useAppStore.getState().showNotification('Failed to generate print document', 'error');
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

    const generateBatchPDF = async () => {
        setIsGeneratingBatch(true);
        setBatchProgress(2);
        if (batchBlobUrl) {
            URL.revokeObjectURL(batchBlobUrl);
            setBatchBlobUrl(null);
        }
        
        try {
            const { PDFDocument } = await import('pdf-lib');
            const { pdf } = await import('@react-pdf/renderer');
            
            if (!selectedSectionObj) {
                useAppStore.getState().showNotification('Please select a section first.', 'error');
                setIsGeneratingBatch(false);
                setBatchProgress(0);
                return;
            }

            const sortedStudents = [...males, ...females].filter(student => {
                if (printMode === 'full') return true;
                const q = printMode === 'term1' ? 1 : printMode === 'term2' ? 2 : 3;
                const comment = observedValues.find(v => v.student_lrn === student.lrn && v.school_year === activeSchoolYear && v.quarter === q)?.values?.['teacher_comment'] || '';
                return comment.trim() !== '';
            });

            if (sortedStudents.length === 0) {
                useAppStore.getState().showNotification('No students found to generate.', 'error');
                setIsGeneratingBatch(false);
                setBatchProgress(0);
                return;
            }

            const mergedPdf = await PDFDocument.create();
            const total = sortedStudents.length;

            for (let idx = 0; idx < total; idx++) {
                const student = sortedStudents[idx];
                
                // Map student data
                const { subjects: compSubjects, grades } = computeStudentGrades(student, selectedSectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile, currentSubjectSelections);
                const values = computeStudentValues(student, observedValues, activeSchoolYear);
                const attendance = computeStudentAttendance(student, sf2Sheets, activeSchoolYear, selectedSectionObj, attendanceRecords);
                const resolvedSection = sections.find(s => s.id === student.student_section || s.section_name === student.student_section);
                const sectionName = resolvedSection?.section_name || selectedSectionObj.section_name;
                const getQComment = (q: number) => observedValues.find(v => v.student_lrn === student.lrn && v.school_year === activeSchoolYear && v.quarter === q)?.values?.['teacher_comment'] || '';
                const studentComments = [getQComment(1), getQComment(2), getQComment(3)];

                // Create individual student PDF document react element
                const studentDoc = (
                    <Document title={`SF9 - ${student.last_name}`}>
                        <SF9PagesMemo 
                            student={student}
                            schoolName={schoolProfile.name}
                            schoolYear={activeSchoolYear}
                            section={sectionName}
                            region={schoolProfile.region}
                            division={schoolProfile.division}
                            district={schoolProfile.district}
                            adviser={adviserName}
                            principal={schoolProfile.head_name || ''}
                            principalTitle={schoolProfile.head_position || 'School Head'}
                            grades={grades}
                            subjects={compSubjects}
                            observedValues={values}
                            comments={studentComments}
                            attendance={attendance}
                            pageSize={pageSize}
                            logoUrl={schoolProfile.logo_url || ''}
                            schoolProfile={schoolProfile}
                            printMode={printMode}
                            showAdviserSig={showAdviserSig}
                            showHeadSig={showHeadSig}
                            adviserSigWidth={adviserSigWidth}
                            adviserSigHeight={adviserSigHeight}
                            adviserSigOffset={adviserSigOffset}
                            headSigWidth={headSigWidth}
                            headSigHeight={headSigHeight}
                            headSigOffset={headSigOffset}
                            hideLearnerInfo={hideLearnerInfo}
                            hideAttendance={hideAttendance}
                            hideGrades={hideGrades}
                            hideAdviserName={hideAdviserName}
                            hideHeadName={hideHeadName}
                        />
                    </Document>
                );

                // Generate blob
                const blob = await pdf(studentDoc).toBlob();
                
                // Load and copy pages into merged document
                const arrayBuffer = await blob.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));

                // Update progress
                setBatchProgress(Math.round(((idx + 1) / total) * 95));
                
                // Yield main thread to keep UI responsive
                await new Promise(resolve => setTimeout(resolve, 30));
            }

            setIsStabilizing(true);
            await new Promise(resolve => setTimeout(resolve, 100));

            const mergedPdfBytes = await mergedPdf.save();
            const mergedBlob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
            const mergedUrl = URL.createObjectURL(mergedBlob);

            setBatchBlobUrl(mergedUrl);
            setBatchProgress(100);
            setShowCompletionModal(true);
        } catch (error) {
            console.error('Batch generation failed:', error);
            useAppStore.getState().showNotification('Batch generation failed: ' + (error as Error).message, 'error');
            setBatchProgress(0);
        } finally {
            setIsGeneratingBatch(false);
            setIsStabilizing(false);
        }
    };

    useEffect(() => {
        return () => {
            if (batchBlobUrl) {
                URL.revokeObjectURL(batchBlobUrl);
            }
        };
    }, [batchBlobUrl]);

    /** Builds the subjectTerm resolver callback for the Excel exporter */
    const buildSubjectTermResolver = useCallback(() => {
        return (subjectName: string, subjectId?: string) => {
            const dbSubjects = useAppStore.getState().subjects;
            const dbSubj = subjectId
                ? dbSubjects.find(s => s.id === subjectId)
                : dbSubjects.find(s => s.subject_name.toLowerCase().trim() === subjectName.toLowerCase().trim());
            return dbSubj?.term;
        };
    }, []);

    /** Export single student SF9 to Excel */
    const handleExcelExport = useCallback(async () => {
        if (!selectedStudent || !selectedSectionObj) return;
        try {
            const attendance = computeStudentAttendance(selectedStudent, sf2Sheets, activeSchoolYear, selectedSectionObj, attendanceRecords);
            const resolvedSection = sections.find(s => s.id === selectedStudent.student_section || s.section_name === selectedStudent.student_section);
            const resolvedSectionName = resolvedSection?.section_name || selectedSectionObj.section_name;
            const getQComment = (q: number) => observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === q)?.values?.['teacher_comment'] || '';
            const studentComments = [getQComment(1), getQComment(2), getQComment(3)];
            const sortedStudents = [...males, ...females].map(st => {
                const { grades: stGrades } = (st.lrn === selectedStudent.lrn)
                    ? { grades: studentGrades.grades || {} }
                    : computeStudentGrades(st, selectedSectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile, currentSubjectSelections);
                const stAttendance = (st.lrn === selectedStudent.lrn)
                    ? attendance
                    : computeStudentAttendance(st, sf2Sheets, activeSchoolYear, selectedSectionObj, attendanceRecords);
                return { ...st, grades: stGrades || {}, attendance: stAttendance };
            });

            const getPaceRatingsForStudent = (sLrn: string) => {
                try {
                    const reading = JSON.parse(localStorage.getItem('formease_pace_reading_ratings') || localStorage.getItem('formease_pace_ratings') || '{}');
                    const language = JSON.parse(localStorage.getItem('formease_pace_language_ratings') || '{}');
                    const math = JSON.parse(localStorage.getItem('formease_pace_math_ratings') || '{}');
                    const gmrcMakabansa = JSON.parse(localStorage.getItem('formease_pace_gmrc_makabansa_ratings') || '{}');

                    return {
                        reading: reading[sLrn]?.ratings || {},
                        language: language[sLrn]?.ratings || {},
                        math: math[sLrn]?.ratings || {},
                        gmrcMakabansa: gmrcMakabansa[sLrn]?.ratings || {},
                    };
                } catch {
                    return undefined;
                }
            };

            const studentTrack = selectedStudent.track || selectedStudent.strand || selectedSectionObj?.track || selectedSectionObj?.strand;

            const exportOpts: SF9ExcelExportOptions = {
                student: selectedStudent,
                schoolProfile,
                schoolYear: activeSchoolYear,
                section: resolvedSectionName,
                track: studentTrack,
                adviser: adviserName,
                principal: schoolProfile.head_name || '',
                principalTitle: schoolProfile.head_position || 'School Head',
                grades: studentGrades.grades || {},
                subjects: studentGrades.subjects || [],
                observedValues: studentValues,
                comments: studentComments,
                g1Remarks: g1RemarksState,
                paceRatings: getPaceRatingsForStudent(selectedStudent.lrn),
                sectionStudents: sortedStudents,
                getStudentRemarks: (sLrn: string) => {
                    try {
                        const stored = localStorage.getItem(`g1_remarks_${sLrn}_${activeSchoolYear}`);
                        return stored ? JSON.parse(stored) : undefined;
                    } catch {
                        return undefined;
                    }
                },
                attendance,
                gradeLevel: selectedStudent.grade_level,
                subjectTerm: buildSubjectTermResolver(),
                pageSize: pageSize,
            };

            await exportSF9ToExcel(exportOpts);
            useAppStore.getState().showNotification('SF9 Excel exported successfully', 'success');
        } catch (error) {
            console.error('Excel export failed:', error);
            useAppStore.getState().showNotification('Failed to export SF9 to Excel: ' + (error as Error).message, 'error');
        }
    }, [selectedStudent, selectedSectionObj, sf2Sheets, activeSchoolYear, attendanceRecords, sections, observedValues, schoolProfile, adviserName, studentGrades, studentValues, g1RemarksState, males, females, buildSubjectTermResolver, pageSize, currentSubjectSelections, gradingSheetRecords, subjects]);

    /** Export batch SF9 (all students in section) to Excel */
    const handleBatchExcelExport = useCallback(async () => {
        if (!selectedSectionObj) return;
        try {
            useAppStore.getState().showNotification('Generating SF9 Excel batch...', 'info');
            const sortedStudents = [...males, ...females];
            if (sortedStudents.length === 0) {
                useAppStore.getState().showNotification('No students found to export.', 'error');
                return;
            }

            const getG1RemarksForStudent = (sLrn: string) => {
                try {
                    const stored = localStorage.getItem(`g1_remarks_${sLrn}_${activeSchoolYear}`);
                    return stored ? JSON.parse(stored) : undefined;
                } catch {
                    return undefined;
                }
            };

            const getPaceRatingsForStudent = (sLrn: string) => {
                try {
                    const reading = JSON.parse(localStorage.getItem('formease_pace_reading_ratings') || localStorage.getItem('formease_pace_ratings') || '{}');
                    const language = JSON.parse(localStorage.getItem('formease_pace_language_ratings') || '{}');
                    const math = JSON.parse(localStorage.getItem('formease_pace_math_ratings') || '{}');
                    const gmrcMakabansa = JSON.parse(localStorage.getItem('formease_pace_gmrc_makabansa_ratings') || '{}');

                    return {
                        reading: reading[sLrn]?.ratings || {},
                        language: language[sLrn]?.ratings || {},
                        math: math[sLrn]?.ratings || {},
                        gmrcMakabansa: gmrcMakabansa[sLrn]?.ratings || {},
                    };
                } catch {
                    return undefined;
                }
            };

            const allEnrichedStudents = sortedStudents.map(st => {
                const { grades: stGrades } = computeStudentGrades(st, selectedSectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile, currentSubjectSelections);
                const stAttendance = computeStudentAttendance(st, sf2Sheets, activeSchoolYear, selectedSectionObj, attendanceRecords);
                return { ...st, grades: stGrades || {}, attendance: stAttendance };
            });

            const batchOptions: SF9ExcelExportOptions[] = allEnrichedStudents.map(student => {
                const { subjects: compSubjects, grades } = computeStudentGrades(student, selectedSectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile, currentSubjectSelections);
                const values = computeStudentValues(student, observedValues, activeSchoolYear);
                const attendance = computeStudentAttendance(student, sf2Sheets, activeSchoolYear, selectedSectionObj, attendanceRecords);
                const resolvedSection = sections.find(s => s.id === student.student_section || s.section_name === student.student_section);
                const sectionName = resolvedSection?.section_name || selectedSectionObj.section_name;
                const sectionTrack = student.track || student.strand || selectedSectionObj.track || selectedSectionObj.strand;
                const getQComment = (q: number) => observedValues.find(v => v.student_lrn === student.lrn && v.school_year === activeSchoolYear && v.quarter === q)?.values?.['teacher_comment'] || '';
                const studentComments = [getQComment(1), getQComment(2), getQComment(3)];

                return {
                    student,
                    schoolProfile,
                    schoolYear: activeSchoolYear,
                    section: sectionName,
                    track: sectionTrack,
                    adviser: adviserName,
                    principal: schoolProfile.head_name || '',
                    principalTitle: schoolProfile.head_position || 'School Head',
                    grades,
                    subjects: compSubjects,
                    observedValues: values,
                    comments: studentComments,
                    g1Remarks: getG1RemarksForStudent(student.lrn),
                    paceRatings: getPaceRatingsForStudent(student.lrn),
                    sectionStudents: allEnrichedStudents,
                    getStudentRemarks: getG1RemarksForStudent,
                    attendance,
                    gradeLevel: student.grade_level,
                    subjectTerm: buildSubjectTermResolver(),
                    pageSize: pageSize,
                };
            });

            await exportSF9BatchToExcel(batchOptions, selectedSectionObj.section_name, activeSchoolYear);
            useAppStore.getState().showNotification('SF9 Excel batch exported successfully', 'success');
        } catch (error) {
            console.error('Batch Excel export failed:', error);
            useAppStore.getState().showNotification('Failed to export batch SF9 to Excel: ' + (error as Error).message, 'error');
        }
    }, [selectedSectionObj, males, females, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile, currentSubjectSelections, observedValues, sf2Sheets, attendanceRecords, sections, adviserName, buildSubjectTermResolver, pageSize]);

    const handleCommitValues = async () => {
        if (!selectedStudent || Object.keys(pendingChanges).length === 0) {
            setIsValuesModalOpen(false);
            return;
        }

        const quarters = Object.keys(pendingChanges).map(Number);
        
        // Validate that comments do not exceed 250 characters
        for (const q of quarters) {
            const commentVal = pendingChanges[q]?.['teacher_comment'];
            if (commentVal && commentVal.length > 250) {
                useAppStore.getState().showNotification(`Term ${q} comments/remarks exceed the 250 characters limit. Cannot save.`, "error");
                return;
            }
        }
        
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
        <div className="flex flex-col h-full bg-linear-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-[#080d1a] dark:via-[#0b1329] dark:to-[#0d1630] relative overflow-hidden font-sans">
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/80 dark:bg-[#0d1225]/90 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/10 shadow-[0_4px_20px_rgba(15,23,42,0.04)] relative print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 z-30" />
                <div className="flex items-center justify-between w-full h-13 px-2.5 sm:px-4 gap-1.5 sm:gap-2 select-none">
                    
                    {/* Identity & Context (Left) */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-7.5 h-7.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        {!isBatchReady && (
                            <div className="relative group shrink-0">
                                <select 
                                    className="appearance-none h-7.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 rounded-lg px-2 pr-6 text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-1.5 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer max-w-32.5 sm:max-w-38.75 lg:max-w-43.75 truncate"
                                    value={selectedSection}
                                    onChange={(e) => {
                                        setSelectedSection(e.target.value);
                                        setSelectedStudent(null);
                                    }}
                                    title="Select Advisory Section"
                                >
                                    <option value="">Select Section</option>
                                    {filteredSections.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.section_grade_level} - {s.section_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}

                        {!isBatchReady && (
                            <div className="relative group shrink-0">
                                <select 
                                    className="appearance-none h-7.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 rounded-lg px-2 pr-6 text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-1.5 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer max-w-35 sm:max-w-42.5 lg:max-w-50 truncate disabled:opacity-30"
                                    value={selectedStudent?.lrn || ''}
                                    onChange={(e) => setSelectedStudent(students.find(s => s.lrn === e.target.value) || null)}
                                    disabled={!selectedSection || isShsSf9Section}
                                    title="Select Learner"
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
                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* View & Formatting Controls (Center) */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {!isCurrentG1 && (
                            <div className="relative group shrink-0">
                                <select
                                    value={printMode}
                                    onChange={(e) => setPrintMode(e.target.value as SF9PrintMode)}
                                    className="appearance-none h-7.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 rounded-lg px-2 pr-5 text-[9px] font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                                    title="Report Term Filter"
                                >
                                    <option value="full">Full Report</option>
                                    <option value="term1">Term 1</option>
                                    <option value="term2">Term 2</option>
                                    <option value="term3">Term 3</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}

                        <div className="relative group shrink-0">
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(e.target.value as 'A4' | 'LETTER')}
                                className="appearance-none h-7.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 rounded-lg px-1.5 pr-4.5 text-[9px] font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer w-14"
                                title="Page Size"
                            >
                                <option value="A4">A4</option>
                                <option value="LETTER">Letter</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Layout Modal Button */}
                        <button
                            onClick={() => { setLayoutModalInitialTab('subjects'); setIsLayoutModalOpen(true); }}
                            className="h-7.5 px-2 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/15 hover:border-indigo-300 text-slate-700 dark:text-slate-200 text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs shrink-0 active:scale-95"
                            title="SF9 Subject Order, Signatures & Display Options"
                        >
                            <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Layout</span>
                        </button>
                    </div>

                    {/* Data and Actions (Right) */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {selectedStudent && !isBatchReady && !isShsSf9Section && !isGrade1Level(selectedStudent.grade_level) && (
                            <button
                                onClick={() => { setPendingChanges({}); setIsValuesModalOpen(true); }}
                                className="h-7.5 px-2 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[8.5px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-1 shadow-xs shrink-0 active:scale-95"
                                title="Edit Core Values & General Average Remarks"
                            >
                                <Edit3 className="w-3 h-3 text-blue-500" />
                                <span className="hidden xl:inline">{isGrade1to10 ? 'Remarks' : 'Values'}</span>
                            </button>
                        )}

                        {selectedStudent && !isShsSf9Section && (
                            <div className="flex items-center bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shrink-0 h-7.5">
                                <button
                                    onClick={handleSpeak}
                                    className={`h-full px-1.5 rounded-md flex items-center gap-1 text-[9px] font-black transition-all ${isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                                    title={isSpeaking ? "Stop Reading" : `Read Grades Aloud (${speechRate}x)`}
                                >
                                    {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                </button>
                                <select
                                    value={speechRate}
                                    onChange={(e) => setSpeechRate(Number(e.target.value))}
                                    className="bg-transparent text-[8.5px] font-black text-slate-500 dark:text-slate-400 outline-none cursor-pointer pr-1"
                                    title="Speech Rate"
                                >
                                    <option value="1">1x</option>
                                    <option value="1.5">1.5x</option>
                                    <option value="2">2x</option>
                                    <option value="2.5">2.5x</option>
                                    <option value="3">3x</option>
                                </select>
                            </div>
                        )}

                        <div className="flex items-center bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shrink-0 h-7.5">
                            <button
                                onClick={() => setIsBatchReady(false)}
                                disabled={isShsSf9Section}
                                className={`px-2 h-full rounded-md text-[8px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${!isBatchReady ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Indiv
                            </button>
                            <button
                                onClick={() => { setIsBatchReady(true); setSelectedStudent(null); }}
                                disabled={isShsSf9Section}
                                className={`px-2 h-full rounded-md text-[8px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${isBatchReady ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Batch
                            </button>
                        </div>

                        {!isBatchReady && singleDocument && !isShsSf9Section && (
                            <div className="flex items-center gap-1 shrink-0">
                                {isGrade1Level(selectedStudent?.grade_level) && (
                                    <button
                                        onClick={() => {
                                            setTempG1Remarks(g1RemarksState);
                                            setIsG1ModalOpen(true);
                                        }}
                                        className="h-7.5 px-2.5 rounded-lg bg-purple-600 text-white font-black text-[8px] uppercase tracking-wider shadow-xs hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap shrink-0"
                                        title="Edit Grade 1 Learner Progress"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        Progress
                                    </button>
                                )}
                                <button
                                    onClick={handlePrint}
                                    className="h-7.5 px-2.5 sm:px-3 rounded-lg bg-blue-600 text-white font-black text-[8.5px] uppercase tracking-wider shadow-sm hover:bg-blue-700 active:scale-95 disabled:opacity-30 transition-all flex items-center gap-1 group whitespace-nowrap"
                                >
                                    <Printer className="w-3 h-3" />
                                    <span>Print SF9</span>
                                </button>
                                <PDFDownloadLink
                                    document={singleDocument}
                                    fileName={`SF9_${selectedSectionObj?.section_name || 'Record'}_${selectedStudent?.last_name || 'Student'}_${activeSchoolYear}.pdf`}
                                    className="h-7.5 w-7.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-white/10 transition-all flex items-center justify-center shrink-0 active:scale-95"
                                    title="Download PDF"
                                >
                                    <Download className="w-3 h-3" />
                                </PDFDownloadLink>
                                <button
                                    onClick={handleExcelExport}
                                    className="h-7.5 w-7.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-700 border border-emerald-200/60 dark:border-emerald-700/30 transition-all flex items-center justify-center shrink-0 active:scale-95"
                                    title="Export to Excel"
                                >
                                    <FileSpreadsheet className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('formease-open-grade-debugger', {
                                            detail: {
                                                sectionId: selectedSectionObj?.id || selectedSection,
                                                studentLrn: selectedStudent?.lrn
                                            }
                                        }));
                                    }}
                                    className="h-7.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:text-amber-700 border border-amber-200/60 dark:border-amber-700/30 transition-all flex items-center gap-1 shrink-0 active:scale-95 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                    title="Inspect & Debug Grade Sync"
                                >
                                    <Bug className="w-3 h-3" />
                                    <span className="hidden xl:inline">Inspect Sync</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
             </div>

             {/* Workspace Viewer Area */}
             <div className="flex-1 overflow-auto bg-linear-to-b from-slate-100/70 to-blue-100/40 dark:from-[#080d1a] dark:to-[#0c142c] relative custom-scrollbar">
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
                        <div className="absolute inset-0 bg-white">
                            <PDFViewer 
                                key={`${selectedStudent.lrn}_${selectedSectionObj?.id || ''}_${showAdviserSig}_${adviserSigWidth}_${adviserSigHeight}_${adviserSigOffset}_${showHeadSig}_${headSigWidth}_${headSigHeight}_${headSigOffset}_${hideLearnerInfo}_${hideAttendance}_${hideGrades}_${hideAdviserName}_${hideHeadName}_${printMode}_${pageSize}`}
                                width="100%" 
                                height="100%" 
                                showToolbar={false} 
                                className="border-none w-full h-full"
                            >
                                {singleDocument!}
                            </PDFViewer>
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
                                <div className="flex flex-wrap items-center justify-center gap-3.5 mt-4">
                                    <motion.button
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        onClick={() => {
                                            void generateBatchPDF();
                                        }}
                                        disabled={isPending}
                                        className={`px-8 py-3.5 rounded-xl text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-3 ${isPending ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-blue-500/30'}`}
                                    >
                                        {isPending ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Printer className="w-4 h-4" />
                                        )}
                                        {isPending ? 'Preparing Engine...' : 'Generate Batch PDF'}
                                    </motion.button>

                                    <motion.button
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        onClick={() => {
                                            void handleBatchExcelExport();
                                        }}
                                        disabled={isPending}
                                        className="px-8 py-3.5 rounded-xl text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95 shadow-emerald-500/30 transition-all flex items-center gap-3 cursor-pointer"
                                        title="Export All Students to Official DepEd Excel format"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span>Export Excel Batch</span>
                                    </motion.button>
                                </div>
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
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                                            {isGrade1to10 ? "Teacher's Comments/Remarks" : 'Evaluate Values'}
                                        </h2>
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

                            {/* Evaluation Grid or Remarks Textarea */}
                            <div className={`flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20 ${isGrade1to10 ? 'p-4 md:p-6' : 'p-12'}`}>
                                <div className="max-w-5xl mx-auto">
                                    {isGrade1to10 ? (() => {
                                        const currentComment = pendingChanges[modalQuarter]?.['teacher_comment'] !== undefined
                                            ? pendingChanges[modalQuarter]['teacher_comment']
                                            : observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === modalQuarter)?.values?.['teacher_comment'] || '';
                                        
                                        const pronoun = selectedStudent.gender?.toLowerCase() === 'female' ? 'She' : 'He';
                                        const possessive = selectedStudent.gender?.toLowerCase() === 'female' ? 'her' : 'his';
                                        const object = selectedStudent.gender?.toLowerCase() === 'female' ? 'her' : 'him';
                                        const studentName = selectedStudent.first_name || 'The student';

                                        const getSuggestionsForTab = () => {
                                            // Academic Performance-based Suggestions
                                            if (suggestionTab === 'academic') {
                                                if (suggestionTone === 'positive') {
                                                    return [
                                                        `${studentName} demonstrates outstanding academic performance, showing strong critical thinking and consistency across all subjects.`,
                                                        `${studentName} exhibits an excellent grasp of concepts and consistently produces work of high quality.`,
                                                        `${studentName} is a highly self-motivated learner who shows advanced comprehension and analytical skills.`,
                                                        `${studentName} consistently delivers exceptional performance in both oral and written works.`,
                                                        `${studentName} has a sharp mind and displays an outstanding ability to solve complex problems.`,
                                                        `${studentName} maintains excellent academic standards and is very dedicated to learning.`,
                                                        `${studentName} possesses a quick understanding of the concepts taught.`,
                                                        `${studentName} displays superior work in all academic areas.`
                                                    ];
                                                }
                                                if (suggestionTone === 'neutral') {
                                                    return [
                                                        `${studentName} performs satisfactorily in class, meeting the basic expectations across most subjects.`,
                                                        `${studentName} has shown steady academic progress and completes requirements with acceptable quality.`,
                                                        `${studentName} displays a fair understanding of the lessons and participates regularly in class.`,
                                                        `${studentName} is working at a steady pace and is meeting the grade-level standards.`,
                                                        `${studentName} shows a balanced performance and completes tasks with satisfactory results.`,
                                                        `${studentName} is making progress but needs to focus more on lesson reviews.`,
                                                        `${studentName} exhibits satisfactory work and completes most requirements.`,
                                                        `${studentName} participates fairly in subjects, showing potential to do better.`
                                                    ];
                                                }
                                                // negative / needs improvement
                                                return [
                                                    `${studentName} struggled with basic concepts this term and needs constant guidance and review at home.`,
                                                    `${studentName} needs significant academic support and guidance to help ${object} meet the grade-level expectations.`,
                                                    `${studentName} has missed several tasks and needs to catch up on lessons to avoid falling behind.`,
                                                    `${studentName} needs to practice reading comprehension and mathematical skills regularly.`,
                                                    `${studentName} requires closer monitoring of homework and class requirements to improve ${possessive} marks.`,
                                                    `${studentName} needs to practice reading and math skills regularly.`,
                                                    `${studentName} needs to pay closer attention to guidelines and deadlines.`,
                                                    `${studentName} is capable of improvement if regular class attendance is maintained.`
                                                ];
                                            }

                                            // Behavior & Attitude-based Suggestions
                                            if (suggestionTab === 'behavior') {
                                                if (suggestionTone === 'positive') {
                                                    return [
                                                        `${pronoun} is polite, cooperative, and actively leads in class discussions and activities.`,
                                                        `${pronoun} shows exemplary leadership skills and is always willing to support ${possessive} peers.`,
                                                        `${pronoun} maintains an excellent focus in class and serves as a positive role model for classmates.`,
                                                        `${pronoun} displays outstanding character traits and is highly respected by peers.`,
                                                        `${pronoun} handles classroom responsibilities with maturity and integrity.`,
                                                        `${pronoun} exhibits great maturity and responsibility in daily tasks.`,
                                                        `${pronoun} is highly dependable and always displays positive behaviors.`,
                                                        `${pronoun} demonstrates excellent self-discipline and work habits.`
                                                    ];
                                                }
                                                if (suggestionTone === 'neutral') {
                                                    return [
                                                        `${pronoun} shows respect and maintains good relationships with classmates.`,
                                                        `${pronoun} is generally cooperative during group tasks and is helpful around the classroom.`,
                                                        `${pronoun} follows classroom guidelines and displays a friendly, polite attitude.`,
                                                        `${pronoun} is well-behaved and cooperative under direct teacher supervision.`,
                                                        `${pronoun} gets along well with classmates, though occasionally socializes during study time.`,
                                                        `${pronoun} is well-behaved and follows instructions well.`,
                                                        `${pronoun} is polite and shows good manners towards classmates and teachers.`,
                                                        `${pronoun} exhibits a positive attitude towards classmates.`
                                                    ];
                                                }
                                                // negative / behavior concerns
                                                return [
                                                    `${pronoun} must focus more on ${possessive} studies and avoid distractions during class discussions.`,
                                                    `${pronoun} needs to improve behavior and respect school/classroom rules.`,
                                                    `${pronoun} needs to show more cooperative behavior and participate positively in group activities.`,
                                                    `${pronoun} needs to develop better self-control and avoid disruptive behavior during lectures.`,
                                                    `${pronoun} needs constant reminders to stay seated, listen attentively, and focus on task.`,
                                                    `${pronoun} needs to improve behavior and respect classroom policies.`,
                                                    `${pronoun} needs to show more cooperative behavior during group activities.`,
                                                    `${pronoun} needs to develop better self-control and focus in class.`
                                                ];
                                            }

                                            // Growth & Next Steps-based Suggestions
                                            if (suggestionTab === 'growth') {
                                                if (suggestionTone === 'positive') {
                                                    return [
                                                        `Keep up the excellent work and continue to strive for academic excellence!`,
                                                        `${pronoun} is encouraged to maintain this outstanding level of dedication and curiosity.`,
                                                        `Continue to challenge yourself with more advanced reading and tasks.`,
                                                        `Your dedication to learning is highly commendable. Keep shining!`,
                                                        `Keep exploring new ideas and sharing your valuable insights in class.`,
                                                        `Keep up the outstanding effort and lead your classmates by example!`,
                                                        `Maintain your exceptional focus and passion for learning.`,
                                                        `Continue to set high standards for yourself in all subjects.`
                                                    ];
                                                }
                                                if (suggestionTone === 'neutral') {
                                                    return [
                                                        `Continue this good progress and aim even higher next term!`,
                                                        `Striving for more active participation will help ${object} reach ${possessive} full potential.`,
                                                        `Keep up the good work and maintain this positive momentum.`,
                                                        `Reviewing your notes daily will help you feel more confident during exams.`,
                                                        `With more consistent effort, you are capable of achieving even better results.`,
                                                        `Keep up the great effort and keep challenging yourself daily.`,
                                                        `Maintain this level of interest and focus next term.`,
                                                        `You have what it takes to reach even higher goals. Keep it up!`
                                                    ];
                                                }
                                                // negative / growth concerns
                                                return [
                                                    `Attending remediation classes and doing daily home reviews are highly recommended.`,
                                                    `A closer parent-teacher coordination is needed to support ${possessive} academic needs.`,
                                                    `${pronoun} is urged to put more effort and focus into ${possessive} studies starting next term.`,
                                                    `Seeking peer tutoring or extra teacher guidance would greatly help ${object} improve.`,
                                                    `Please ensure all late assignments are completed and submitted to catch up.`,
                                                    `A structured study plan at home will help improve your grades.`,
                                                    `Please ensure all late assignments are completed and submitted.`,
                                                    `Do not hesitate to ask for help when a topic seems difficult.`
                                                ];
                                            }

                                            return [];
                                        };

                                        const suggestions = getSuggestionsForTab();

                                        const applySuggestion = (suggestion: string) => {
                                            let finalComment = suggestion;

                                            // Dynamic Pronoun-to-Firstname substitution:
                                            // If the current comment box is empty, automatically replace starting He/She with student's first name.
                                            if (!currentComment.trim()) {
                                                if (suggestion.startsWith('He ')) {
                                                    finalComment = studentName + suggestion.slice(2);
                                                } else if (suggestion.startsWith('She ')) {
                                                    finalComment = studentName + suggestion.slice(3);
                                                }
                                            }

                                            if (suggestionMode === 'append') {
                                                if (currentComment.trim()) {
                                                    const trimmed = currentComment.trim();
                                                    // Check if it ends with a punctuation (. or ! or ?)
                                                    const endsWithPunct = /[.!?]$/.test(trimmed);
                                                    finalComment = trimmed + (endsWithPunct ? '' : '.') + ' ' + suggestion;
                                                }
                                            }

                                            if (finalComment.length > 250) {
                                                useAppStore.getState().showNotification('Adding this remark would exceed the 250-character limit.', 'error');
                                                return;
                                            }

                                            setPendingChanges(prev => ({
                                                ...prev,
                                                [modalQuarter]: {
                                                    ...(prev[modalQuarter] || {}),
                                                    'teacher_comment': finalComment
                                                }
                                            }));
                                        };

                                        return (
                                            <div className="space-y-4">
                                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label htmlFor={`comments-textarea-term-${modalQuarter}`} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            Teacher's Comments / Remarks (Term {modalQuarter})
                                                        </label>
                                                        <p className="text-xs text-slate-500 font-medium">
                                                            Enter remarks and comments regarding the student's progress and behavior for Term {modalQuarter}. These will be printed on the SF9 report card.
                                                        </p>
                                                    </div>
                                                    <textarea
                                                        id={`comments-textarea-term-${modalQuarter}`}
                                                        value={currentComment}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val.length > 250) {
                                                                useAppStore.getState().showNotification('Comments/remarks cannot exceed 250 characters.', 'error');
                                                                return;
                                                                }
                                                            setPendingChanges(prev => ({
                                                                ...prev,
                                                                [modalQuarter]: {
                                                                    ...(prev[modalQuarter] || {}),
                                                                    'teacher_comment': val
                                                                }
                                                            }));
                                                        }}
                                                        placeholder={`Type comments/remarks for Term ${modalQuarter} here...`}
                                                        rows={4}
                                                        maxLength={250}
                                                        className="w-full p-4.5 bg-slate-50/60 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-2xl text-slate-700 font-medium text-sm leading-relaxed transition-all outline-none resize-none focus:ring-4 focus:ring-indigo-100"
                                                    />
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                                        <div className="flex items-center gap-4">
                                                            <span>Maximum 250 characters</span>
                                                            {currentComment.length > 0 && (
                                                                <>
                                                                    <span className="text-slate-300">|</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setPendingChanges(prev => ({
                                                                                ...prev,
                                                                                [modalQuarter]: {
                                                                                    ...(prev[modalQuarter] || {}),
                                                                                    'teacher_comment': ''
                                                                                }
                                                                            }));
                                                                        }}
                                                                        className="text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest text-[9px] font-black cursor-pointer"
                                                                    >
                                                                        Clear Text
                                                                    </button>
                                                                    <span className="text-slate-300">|</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(currentComment);
                                                                            useAppStore.getState().showNotification('Comment copied to clipboard!', 'success');
                                                                        }}
                                                                        className="text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest text-[9px] font-black cursor-pointer"
                                                                    >
                                                                        Copy Text
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                        <span className={currentComment.length >= 225 ? 'text-amber-500 font-black' : ''}>
                                                            {currentComment.length} / 250
                                                        </span>
                                                    </div>

                                                    {/* Suggested Remarks Builder Section */}
                                                    <div className="flex flex-col gap-3 pt-3.5 border-t border-slate-100">
                                                        {/* Category and Tone Toggles */}
                                                        <div className="flex flex-col gap-2.5">
                                                            {/* Category Row */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                        Remarks Category:
                                                                    </span>
                                                                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                                                                        {(['academic', 'behavior', 'growth'] as const).map((tab) => (
                                                                            <button
                                                                                key={tab}
                                                                                type="button"
                                                                                onClick={() => setSuggestionTab(tab)}
                                                                                className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${suggestionTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                            >
                                                                                {tab}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 self-start sm:self-center">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mode:</span>
                                                                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSuggestionMode('replace')}
                                                                            className={`px-2.5 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all ${suggestionMode === 'replace' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                        >
                                                                            Replace
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSuggestionMode('append')}
                                                                            className={`px-2.5 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all ${suggestionMode === 'append' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                        >
                                                                            Append
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Tone/Performance Level Row */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                    Remarks Tone:
                                                                </span>
                                                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                                                                    {([
                                                                        { key: 'positive', label: 'Positive' },
                                                                        { key: 'neutral', label: 'Neutral' },
                                                                        { key: 'negative', label: 'Needs Improvement' }
                                                                    ] as const).map((tone) => (
                                                                        <button
                                                                            key={tone.key}
                                                                            type="button"
                                                                            onClick={() => setSuggestionTone(tone.key)}
                                                                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${suggestionTone === tone.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                                        >
                                                                            {tone.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col gap-1.5">
                                                            {suggestions.map((suggestion, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => applySuggestion(suggestion)}
                                                                    className="w-full text-left p-2.5 bg-slate-50/50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 rounded-xl text-slate-600 hover:text-indigo-600 font-semibold text-xs transition-all duration-200 active:scale-[0.995] cursor-pointer flex justify-between items-center group"
                                                                >
                                                                    <span className="flex-1 pr-4 leading-relaxed">{suggestion}</span>
                                                                    <span className="text-[9px] font-black text-indigo-400 group-hover:text-indigo-600 uppercase tracking-wider whitespace-nowrap shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        {suggestionMode === 'append' ? '+ Append' : '✓ Replace'}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <div className="space-y-12">
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
                                    )}
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
                                {batchBlobUrl && (
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                if (batchBlobUrl) {
                                                    const win = window.open(batchBlobUrl, '_blank');
                                                    if (win) {
                                                        win.addEventListener('load', () => {
                                                            win.print();
                                                        });
                                                    }
                                                }
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
                                            href={batchBlobUrl}
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
                                        <button
                                            onClick={() => {
                                                handleBatchExcelExport();
                                                setShowCompletionModal(false);
                                                setIsGeneratingBatch(false);
                                                setBatchProgress(0);
                                            }}
                                            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-[12px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FileSpreadsheet className="w-4 h-4" />
                                            Download Excel Version
                                        </button>
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
                        onClose={handleCloseLayoutModal}
                        currentSelections={currentSubjectSelections}
                        subjects={subjects.filter(s => s.section_id === selectedSectionObj?.id)}
                        signatureSettings={currentSignatureSettings}
                        initialTab={layoutModalInitialTab}
                        
                        showAdviserSig={showAdviserSig}
                        setShowAdviserSig={setShowAdviserSig}
                        adviserSigWidth={adviserSigWidth}
                        setAdviserSigWidth={setAdviserSigWidth}
                        adviserSigHeight={adviserSigHeight}
                        setAdviserSigHeight={setAdviserSigHeight}
                        adviserSigOffset={adviserSigOffset}
                        setAdviserSigOffset={setAdviserSigOffset}
                        
                        showHeadSig={showHeadSig}
                        setShowHeadSig={setShowHeadSig}
                        headSigWidth={headSigWidth}
                        setHeadSigWidth={setHeadSigWidth}
                        headSigHeight={headSigHeight}
                        setHeadSigHeight={setHeadSigHeight}
                        headSigOffset={headSigOffset}
                        setHeadSigOffset={setHeadSigOffset}
                        
                        hideLearnerInfo={hideLearnerInfo}
                        setHideLearnerInfo={setHideLearnerInfo}
                        hideAttendance={hideAttendance}
                        setHideAttendance={setHideAttendance}
                        hideGrades={hideGrades}
                        setHideGrades={setHideGrades}
                        hideAdviserName={hideAdviserName}
                        setHideAdviserName={setHideAdviserName}
                        hideHeadName={hideHeadName}
                        setHideHeadName={setHideHeadName}

                        onSave={handleUpdateLayout}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isG1ModalOpen && selectedStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Grade 1 Learner Progress</h3>
                                        <p className="text-xs font-semibold text-slate-500">{formatLearnerName(selectedStudent)} — Progress Notes for Terms 1, 2, & 3</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsG1ModalOpen(false)} 
                                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { termNum: 1, title: 'TERM 1 (UNANG TERMINO)', canDoKey: 'term1CanDo', toImproveKey: 'term1ToImprove' },
                                    { termNum: 2, title: 'TERM 2 (IKALAWANG TERMINO)', canDoKey: 'term2CanDo', toImproveKey: 'term2ToImprove' },
                                    { termNum: 3, title: 'TERM 3 (IKATLONG TERMINO)', canDoKey: 'term3CanDo', toImproveKey: 'term3ToImprove' }
                                ].map((t) => (
                                    <div key={t.termNum} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                                        <h4 className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider">{t.title}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    What Your Child Can Do (Mga Nagagawa)
                                                </label>
                                                <textarea
                                                    value={tempG1Remarks[t.canDoKey as keyof typeof tempG1Remarks] || ''}
                                                    onChange={(e) => setTempG1Remarks(prev => ({ ...prev, [t.canDoKey]: e.target.value }))}
                                                    rows={3}
                                                    placeholder="Enter learner's achievements and progress..."
                                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    What Your Child Is Learning to Improve (Dapat Linangin)
                                                </label>
                                                <textarea
                                                    value={tempG1Remarks[t.toImproveKey as keyof typeof tempG1Remarks] || ''}
                                                    onChange={(e) => setTempG1Remarks(prev => ({ ...prev, [t.toImproveKey]: e.target.value }))}
                                                    rows={3}
                                                    placeholder="Enter skills and areas needing guidance..."
                                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setIsG1ModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveG1Progress}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 active:scale-95 transition-all"
                                >
                                    Save Progress
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface LayoutModalProps {
    onClose: () => void;
    currentSelections: Record<number, string>;
    subjects: Subject[];
    signatureSettings: SF9SignatureSettings;
    initialTab?: 'subjects' | 'signatures' | 'display';
    onSave: (selections: Record<number, string>, sigSettings: SF9SignatureSettings) => Promise<void>;

    // Controlled Signature States for real-time live preview
    showAdviserSig: boolean;
    setShowAdviserSig: (v: boolean) => void;
    adviserSigWidth: number;
    setAdviserSigWidth: (v: number) => void;
    adviserSigHeight: number;
    setAdviserSigHeight: (v: number) => void;
    adviserSigOffset: number;
    setAdviserSigOffset: (v: number) => void;

    showHeadSig: boolean;
    setShowHeadSig: (v: boolean) => void;
    headSigWidth: number;
    setHeadSigWidth: (v: number) => void;
    headSigHeight: number;
    setHeadSigHeight: (v: number) => void;
    headSigOffset: number;
    setHeadSigOffset: (v: number) => void;

    // Display & Hide Options
    hideLearnerInfo: boolean;
    setHideLearnerInfo: (v: boolean) => void;
    hideAttendance: boolean;
    setHideAttendance: (v: boolean) => void;
    hideGrades: boolean;
    setHideGrades: (v: boolean) => void;
    hideAdviserName: boolean;
    setHideAdviserName: (v: boolean) => void;
    hideHeadName: boolean;
    setHideHeadName: (v: boolean) => void;
}

function SF9LayoutModal({ 
    onClose, currentSelections, subjects, initialTab = 'subjects', onSave,
    showAdviserSig, setShowAdviserSig, adviserSigWidth, setAdviserSigWidth, adviserSigHeight, setAdviserSigHeight, adviserSigOffset, setAdviserSigOffset,
    showHeadSig, setShowHeadSig, headSigWidth, setHeadSigWidth, headSigHeight, setHeadSigHeight, headSigOffset, setHeadSigOffset,
    hideLearnerInfo, setHideLearnerInfo, hideAttendance, setHideAttendance, hideGrades, setHideGrades, hideAdviserName, setHideAdviserName, hideHeadName, setHideHeadName
}: LayoutModalProps) {
    const [localSelections, setLocalSelections] = useState<Record<number, string>>(currentSelections);
    const [isSaving, setIsSaving] = useState(false);

    // Local signature states to enable lag-free slider rendering at 60fps
    const [localShowAdviser, setLocalShowAdviser] = useState(showAdviserSig);
    const [localAdviserWidth, setLocalAdviserWidth] = useState(adviserSigWidth);
    const [localAdviserHeight, setLocalAdviserHeight] = useState(adviserSigHeight);
    const [localAdviserOffset, setLocalAdviserOffset] = useState(adviserSigOffset);

    const [localShowHead, setLocalShowHead] = useState(showHeadSig);
    const [localHeadWidth, setLocalHeadWidth] = useState(headSigWidth);
    const [localHeadHeight, setLocalHeadHeight] = useState(headSigHeight);
    const [localHeadOffset, setLocalHeadOffset] = useState(headSigOffset);

    // Local hide states
    const [localHideLearnerInfo, setLocalHideLearnerInfo] = useState(hideLearnerInfo);
    const [localHideAttendance, setLocalHideAttendance] = useState(hideAttendance);
    const [localHideGrades, setLocalHideGrades] = useState(hideGrades);
    const [localHideAdviserName, setLocalHideAdviserName] = useState(hideAdviserName);
    const [localHideHeadName, setLocalHideHeadName] = useState(hideHeadName);

    // Debounce refs and handler
    const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
    const debouncePropUpdate = useCallback(<T,>(key: string, value: T, setter: (v: T) => void) => {
        if (timeoutsRef.current[key]) {
            clearTimeout(timeoutsRef.current[key]);
        }
        timeoutsRef.current[key] = setTimeout(() => {
            setter(value);
        }, 250); // 250ms debounce
    }, []);

    // Clean up timeouts on unmount
    useEffect(() => {
        const timeouts = timeoutsRef.current;
        return () => {
            Object.values(timeouts).forEach(clearTimeout);
        };
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(localSelections, {
                showAdviserSig: localShowAdviser,
                adviserSigWidth: localAdviserWidth,
                adviserSigHeight: localAdviserHeight,
                adviserSigOffset: localAdviserOffset,
                showHeadSig: localShowHead,
                headSigWidth: localHeadWidth,
                headSigHeight: localHeadHeight,
                headSigOffset: localHeadOffset,
                hideLearnerInfo: localHideLearnerInfo,
                hideAttendance: localHideAttendance,
                hideGrades: localHideGrades,
                hideAdviserName: localHideAdviserName,
                hideHeadName: localHideHeadName
            });
            // Do NOT call onClose() here. handleUpdateLayout already closes
            // the modal and sets the local states to the saved values.
            // Calling onClose() would trigger handleCloseLayoutModal which
            // reads from the stale memoized selectedSectionObj and reverts
            // the local states back to the OLD pre-save values.
        } finally {
            setIsSaving(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'subjects' | 'signatures' | 'display'>(initialTab);

    const handleResetSignatures = () => {
        setLocalShowAdviser(true);
        setLocalAdviserWidth(60);
        setLocalAdviserHeight(18);
        setLocalAdviserOffset(10);
        
        setLocalShowHead(true);
        setLocalHeadWidth(60);
        setLocalHeadHeight(18);
        setLocalHeadOffset(10);

        setShowAdviserSig(true);
        setAdviserSigWidth(60);
        setAdviserSigHeight(18);
        setAdviserSigOffset(10);
        setShowHeadSig(true);
        setHeadSigWidth(60);
        setHeadSigHeight(18);
        setHeadSigOffset(10);
    };

    const handleResetDisplay = () => {
        setLocalHideLearnerInfo(false);
        setLocalHideAttendance(false);
        setLocalHideGrades(false);
        setLocalHideAdviserName(false);
        setLocalHideHeadName(false);

        setHideLearnerInfo(false);
        setHideAttendance(false);
        setHideGrades(false);
        setHideAdviserName(false);
        setHideHeadName(false);
    };

    return (
        <div className="fixed inset-0 z-110 overflow-hidden pointer-events-none">
            <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute inset-y-0 left-0 w-full max-w-md bg-white shadow-2xl flex flex-col h-full z-110 border-r border-slate-200 pointer-events-auto"
            >
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">SF9 Layout & Options</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Customize subject rows, signatures, and visibility</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex border-b border-slate-100 px-8 py-2 gap-4 shrink-0 bg-slate-50/20 overflow-x-auto custom-scrollbar">
                    <button 
                        onClick={() => setActiveTab('subjects')}
                        className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === 'subjects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Subject Order
                    </button>
                    <button 
                        onClick={() => setActiveTab('signatures')}
                        className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === 'signatures' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Signatures
                    </button>
                    <button 
                        onClick={() => setActiveTab('display')}
                        className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === 'display' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Display Options
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'subjects' ? (
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
                    ) : activeTab === 'signatures' ? (
                        <div className="space-y-8">
                            {/* Adviser Signature Group */}
                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-150/60 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Class Adviser Signature</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Toggle and customize size or vertical offset</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={localShowAdviser} 
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                setLocalShowAdviser(val);
                                                setShowAdviserSig(val);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {localShowAdviser && (
                                    <div className="space-y-4 pt-2 border-t border-slate-200/50">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Signature Width</span>
                                                <span className="text-blue-600">{localAdviserWidth}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="30" 
                                                max="150" 
                                                value={localAdviserWidth}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setLocalAdviserWidth(val);
                                                    debouncePropUpdate('adviserSigWidth', val, setAdviserSigWidth);
                                                }}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Signature Height</span>
                                                <span className="text-blue-600">{localAdviserHeight}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="5" 
                                                max="50" 
                                                value={localAdviserHeight}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setLocalAdviserHeight(val);
                                                    debouncePropUpdate('adviserSigHeight', val, setAdviserSigHeight);
                                                }}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Vertical Offset (Alignment)</span>
                                                <span className="text-blue-600">{localAdviserOffset}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="-20" 
                                                max="50" 
                                                value={localAdviserOffset}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setLocalAdviserOffset(val);
                                                    debouncePropUpdate('adviserSigOffset', val, setAdviserSigOffset);
                                                }}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* School Head Signature Group */}
                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-150/60 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">School Head / Principal Signature</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Toggle and customize size or vertical offset</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={localShowHead} 
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                setLocalShowHead(val);
                                                setShowHeadSig(val);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {localShowHead && (
                                    <div className="space-y-4 pt-2 border-t border-slate-200/50">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Signature Width</span>
                                                <span className="text-blue-600">{localHeadWidth}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="30" 
                                                max="150" 
                                                value={localHeadWidth}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setLocalHeadWidth(val);
                                                    debouncePropUpdate('headSigWidth', val, setHeadSigWidth);
                                                }}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Signature Height</span>
                                                <span className="text-blue-600">{localHeadHeight}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="5" 
                                                max="50" 
                                                value={localHeadHeight}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setLocalHeadHeight(val);
                                                    debouncePropUpdate('headSigHeight', val, setHeadSigHeight);
                                                }}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Vertical Offset (Alignment)</span>
                                                <span className="text-blue-600">{localHeadOffset}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="-20" 
                                                max="50" 
                                                value={localHeadOffset}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setLocalHeadOffset(val);
                                                    debouncePropUpdate('headSigOffset', val, setHeadSigOffset);
                                                }}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Display & Hide Options Tab */
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-slate-600 text-xs leading-relaxed">
                                Control which sections and identifiers appear on the printed SF9 document. Hidden fields remain formatted with underlines and blank table cells.
                            </div>

                            {/* Option 1: Hide Learner Info */}
                            <div className="p-4 rounded-2xl border border-slate-150/80 bg-slate-50/40 hover:bg-slate-50 transition-all flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Hide Learner's Information</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Hides Name, LRN, Age, Sex, Grade, Section, Track/Strand</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={localHideLearnerInfo} 
                                        onChange={(e) => {
                                            const val = e.target.checked;
                                            setLocalHideLearnerInfo(val);
                                            setHideLearnerInfo(val);
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Option 2: Hide Attendance */}
                            <div className="p-4 rounded-2xl border border-slate-150/80 bg-slate-50/40 hover:bg-slate-50 transition-all flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Hide Attendance Record</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Hides Monthly School Days, Days Present, Days Absent, and Totals</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={localHideAttendance} 
                                        onChange={(e) => {
                                            const val = e.target.checked;
                                            setLocalHideAttendance(val);
                                            setHideAttendance(val);
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Option 3: Hide Grades */}
                            <div className="p-4 rounded-2xl border border-slate-150/80 bg-slate-50/40 hover:bg-slate-50 transition-all flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Hide Grades & Remarks</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Hides Quarterly/Term Grades, Final Grade, General Average & Remarks</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={localHideGrades} 
                                        onChange={(e) => {
                                            const val = e.target.checked;
                                            setLocalHideGrades(val);
                                            setHideGrades(val);
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Option 4: Hide Adviser Name */}
                            <div className="p-4 rounded-2xl border border-slate-150/80 bg-slate-50/40 hover:bg-slate-50 transition-all flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Hide Class Adviser Name</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Hides printed name above signature lines (keeps lines & labels)</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={localHideAdviserName} 
                                        onChange={(e) => {
                                            const val = e.target.checked;
                                            setLocalHideAdviserName(val);
                                            setHideAdviserName(val);
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Option 5: Hide Head Name */}
                            <div className="p-4 rounded-2xl border border-slate-150/80 bg-slate-50/40 hover:bg-slate-50 transition-all flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Hide School Head Name</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Hides printed principal/head name above signature lines</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={localHideHeadName} 
                                        onChange={(e) => {
                                            const val = e.target.checked;
                                            setLocalHideHeadName(val);
                                            setHideHeadName(val);
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                    {activeTab === 'subjects' ? (
                        <button 
                            onClick={() => setLocalSelections({})}
                            className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all active:scale-95"
                        >
                            Clear All
                        </button>
                    ) : activeTab === 'signatures' ? (
                        <button 
                            onClick={handleResetSignatures}
                            className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-650 hover:bg-blue-50/50 transition-all active:scale-95"
                        >
                            Reset Signatures
                        </button>
                    ) : (
                        <button 
                            onClick={handleResetDisplay}
                            className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-650 hover:bg-blue-50/50 transition-all active:scale-95"
                        >
                            Show All
                        </button>
                    )}
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
                            {isSaving ? 'Saving...' : 'Save & Apply'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

