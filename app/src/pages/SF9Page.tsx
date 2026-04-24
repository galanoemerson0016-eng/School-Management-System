import React, { useState, useMemo, useEffect, useRef, useTransition } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image, Font, usePDF } from '@react-pdf/renderer';
Font.registerHyphenationCallback(word => [word]);
import { useAppStore, useAuthStore } from '../stores';
import type { Student, User, Section, Subject, ClassRecord, ObservedValues, SF2Sheet, SchoolProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Printer, FileText, Layout, Download, Edit3, Settings, X, Plus, Minus } from 'lucide-react';
import { filterSF9Sections } from '../lib/rbac';
import { getSF9SubjectsForGrade } from '../lib/subjectConfig';

// SF9-JHS Official Template - Landscape Format
const styles = StyleSheet.create({
    page: { paddingTop: 20, paddingBottom: 20, paddingHorizontal: 30, fontSize: 10, fontFamily: 'Times-Roman' },
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
    lpHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#FFFFFF', height: 32 },
    lpRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', flex: 1 },
    lpCell: { borderRightWidth: 1, borderColor: '#000', padding: 4, fontSize: 9, justifyContent: 'center' },
    lpCellLast: { padding: 4, fontSize: 9, justifyContent: 'center' },
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

function normalizeSubjectName(name: string) {
    return name.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
}

function computeStudentGrades(student: Student, sectionObj: Section, subjects: Subject[], gradingSheetRecords: ClassRecord[], schoolYear: string, schoolProfile?: SchoolProfile) {
    const grades: Record<string, number[]> = {};
    const gradeLevelNum = parseInt(sectionObj.section_grade_level.replace(/\D/g, '')) || 0;
    const currentSubjects = getSF9SubjectsForGrade(gradeLevelNum, schoolProfile?.curriculum);

    const getSubjectGrades = (subjectName: string) => {
        const normalizedTarget = normalizeSubjectName(subjectName);
        const matchingSubject = subjects.find(s => {
            if (s.section_id !== sectionObj.id) return false;
            const dbName = s.subject_name.toLowerCase();
            const targetName = subjectName.toLowerCase();
            if (dbName === targetName) return true;
            const normalizedDb = normalizeSubjectName(s.subject_name);
            if (normalizedDb === normalizedTarget) return true;
            if (normalizedTarget === 'araling panlipunan' && (dbName === 'ap' || dbName.includes('panlipunan'))) return true;
            if (normalizedTarget === 'technology and livelihood education' && (dbName === 'tle' || dbName.includes('livelihood'))) return true;
            if (normalizedTarget === 'values education' && (dbName === 'esp' || dbName.includes('pagpapakatao'))) return true;
            if (normalizedTarget === 'edukasyon sa pagpapakatao' && (dbName === 'values' || dbName.includes('values education'))) return true;
            return false;
        });

        if (matchingSubject) {
            const getQuarterGrade = (q: 1 | 2 | 3) => {
                const r = gradingSheetRecords.find(rec =>
                    rec.student_lrn === student.lrn &&
                    rec.subject_id === matchingSubject.id &&
                    rec.school_year === schoolYear &&
                    Number(rec.quarter) === q
                );
                return (r && r.final_grade && Number(r.final_grade) > 0) ? Number(r.final_grade) : 0;
            };
            return [getQuarterGrade(1), getQuarterGrade(2), getQuarterGrade(3)];
        }
        return [0, 0, 0];
    };

    currentSubjects.forEach(sf9Subject => {
        if (sf9Subject.name === 'MAPEH') {
            const musicArtsGrades = getSubjectGrades('Music and Arts');
            const peHealthGrades = getSubjectGrades('Physical Education and Health');

            const mapehGrades = [0, 1, 2].map(qIdx => {
                const ma = musicArtsGrades[qIdx] || 0;
                const pe = peHealthGrades[qIdx] || 0;

                // MATATAG Rule: MAPEH = (Music and Arts + Physical Education and Health) / 2
                if (ma > 0 || pe > 0) {
                    return Math.round((ma + pe) / 2);
                }
                return 0;
            });

            grades[sf9Subject.name] = mapehGrades;
        } else {
            grades[sf9Subject.name] = getSubjectGrades(sf9Subject.name);
        }
    });

    return grades;
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
        // Aggressive case-insensitive match by section name/id and month
        const sheet = sf2Sheets.find(s => {
            const sectionMatch = 
                (s.section_id?.toString().toLowerCase() === sectionObj?.id?.toString().toLowerCase()) ||
                (s.section_id?.toString().toLowerCase() === sectionObj?.section_name?.toString().toLowerCase());
            
            const monthMatch = s.month?.toString().toUpperCase() === month.toUpperCase();
            const yearMatch = s.school_year === schoolYear;
            
            return sectionMatch && monthMatch && yearMatch;
        });

        if (sheet) {
            const dateLabels = sheet.date_labels || {};
            
            // Aggressive fuzzy LRN match (space-tolerant, case-insensitive, type-agnostic)
            const targetLRN = student.lrn.toString().trim().toLowerCase();
            const attendanceKeys = Object.keys(sheet.attendance || {});
            const matchedKey = attendanceKeys.find(k => k.toString().trim().toLowerCase() === targetLRN);
            const studentAttendance = matchedKey ? sheet.attendance[matchedKey] : {};
            
            let mAbsent = 0;
            let mFilled = 0;

            for (let d = 1; d <= 25; d++) {
                const label = dateLabels[d];
                if (label && (label as string).trim() !== '') {
                    mFilled++;
                    const status = studentAttendance[d];
                    const normalizedStatus = (status || '').toString().toLowerCase().trim();
                    if (normalizedStatus === 'absent' || normalizedStatus === 'x') {
                        mAbsent++;
                    }
                }
            }
            
            schoolDays.push(mFilled);
            daysAbsent.push(mAbsent);
            daysPresent.push(Math.max(0, mFilled - mAbsent));
        } else {
            schoolDays.push(0);
            daysPresent.push(0);
            daysAbsent.push(0);
        }
    });

    const totalSchoolDays = schoolDays.reduce((a, b) => a + b, 0);
    const totalPresent = daysPresent.reduce((a, b) => a + b, 0);
    const totalAbsent = daysAbsent.reduce((a, b) => a + b, 0);

    return {
        months: [...months.map(m => m.substring(0, 3)), 'TOTAL'],
        schoolDays: [...schoolDays, totalSchoolDays],
        daysPresent: [...daysPresent, totalPresent],
        daysAbsent: [...daysAbsent, totalAbsent]
    };
}

function calculateGeneralAverage(grades: Record<string, number[]>): number {
    let totalSum = 0;
    let subjectCount = 0;
    const excludedSubjects = ['Music and Arts', 'Physical Education and Health'];
    Object.entries(grades).forEach(([subjectName, qGrades]) => {
        if (excludedSubjects.includes(subjectName)) return;
        const allTermsComplete = qGrades.length === 3 && qGrades.every(g => g > 0);
        if (allTermsComplete) {
            const avg = qGrades.reduce((a, b) => a + b, 0) / 3;
            totalSum += avg;
            subjectCount++;
        }
    });
    return subjectCount > 0 ? Math.round(totalSum / subjectCount) : 0;
}

function calculateFinalGrade(quarterGrades: number[]): number {
    if (quarterGrades.length !== 3 || !quarterGrades.every(g => g > 0)) return 0;
    return Math.round(quarterGrades.reduce((a, b) => a + b, 0) / 3);
}

function getRemarks(grade: number): string {
    if (grade <= 0) return '';
    return grade >= 75 ? 'Passed' : 'Failed';
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
}

function SF9Pages({
    student, schoolName, schoolYear, section, region, division, district,
    adviser, principal, principalTitle, grades, observedValues, attendance, pageSize, logoUrl, schoolProfile
}: SF9ExactDocumentProps) {

    return (
        <>
            <Page size={pageSize} orientation="landscape" style={styles.page}>
                <View style={styles.page1Container}>
                    <View style={styles.leftColumn}>
                        <Text style={styles.attendanceTitle}>REPORT ON ATTENDANCE</Text>
                        <View style={styles.attendanceTable}>
                            <View style={styles.attHeaderRow}>
                                <View style={styles.attLabelCell}><Text> </Text></View>
                                {attendance.months.map((month, idx) => (
                                    <View key={idx} style={idx === attendance.months.length - 1 ? styles.attDataCellLast : styles.attMonthCell}>
                                        <Text>{month}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.attRow}>
                                <View style={styles.attLabelCell}><Text>No. of school{'\n'}days</Text></View>
                                {attendance.schoolDays.map((days, idx) => (
                                    <View key={idx} style={idx === attendance.schoolDays.length - 1 ? styles.attDataCellLast : styles.attDataCell}>
                                        <Text>{days}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.attRow}>
                                <View style={styles.attLabelCell}><Text>No. of days{'\n'}present</Text></View>
                                {attendance.daysPresent.map((days, idx) => (
                                    <View key={idx} style={idx === attendance.daysPresent.length - 1 ? styles.attDataCellLast : styles.attDataCell}>
                                        <Text>{days}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.attRowLast}>
                                <View style={styles.attLabelCell}><Text>No. of days{'\n'}absent</Text></View>
                                {attendance.daysAbsent.map((days, idx) => (
                                    <View key={idx} style={idx === attendance.daysAbsent.length - 1 ? styles.attDataCellLast : styles.attDataCell}>
                                        <Text>{days}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={styles.parentSection}>
                            <Text style={styles.parentTitle}>PARENT/GUARDIAN'S SIGNATURE</Text>
                            {[{ num: '1', suffix: 'st' }, { num: '2', suffix: 'nd' }, { num: '3', suffix: 'rd' }].map((quarter, idx) => (
                                <View key={idx} style={styles.signatureRow}>
                                    <Text style={styles.quarterLabel}>{quarter.num}<Text style={{ fontSize: 7, verticalAlign: 'super' }}>{quarter.suffix}</Text>{' Term'}</Text>
                                    <View style={styles.signatureLine} />
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.rightColumn}>
                        <Text style={styles.sf9Label}>SF9-JHS</Text>
                        <View style={styles.headerContainer}>
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
                        <Text style={styles.schoolName}>{schoolName}</Text>
                        <Text style={styles.reportTitle}>LEARNER'S PROGRESS REPORT CARD</Text>
                        <View style={styles.studentInfoGrid}>
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
                        <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 10, fontWeight: 'bold' }}>Dear Parents:</Text>
                        <Text style={{ marginTop: 10, textAlign: 'center', lineHeight: 1.4, fontSize: 9 }}>
                            This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values.
                        </Text>
                        <Text style={{ marginTop: 5, textAlign: 'center', fontSize: 9 }}>
                            The school welcomes you should you desire to know more about your child's progress.
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
                            <View style={{ width: '45%', alignItems: 'center' }}>
                                <Text style={{ borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: 10, marginBottom: 2 }}>{principal?.toUpperCase()}</Text>
                                <Text style={{ fontSize: 9 }}>{principalTitle || 'Secondary School Principal I'}</Text>
                            </View>
                            <View style={{ width: '45%', alignItems: 'center' }}>
                                <Text style={{ borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: 10, marginBottom: 2 }}>{adviser?.toUpperCase()}</Text>
                                <Text style={{ fontSize: 9 }}>Teacher Adviser</Text>
                            </View>
                        </View>
                        <View style={styles.transferSection}>
                            <Text style={styles.transferTitle}>CERTIFICATE OF TRANSFER</Text>
                            <View style={styles.transferRow}>
                                <Text style={styles.transferLabel}>Admitted to Grade:</Text>
                                <View style={styles.transferLine} />
                                <Text style={[styles.transferLabel, { width: 60, marginLeft: 15 }]}>Section:</Text>
                                <View style={styles.transferLine} />
                            </View>
                            <View style={styles.transferRow}>
                                <Text style={styles.transferLabel}>Eligible for Admission to Grade:</Text>
                                <View style={styles.transferLine} />
                            </View>
                            <View style={[styles.transferRow, { marginTop: 15 }]}>
                                <Text style={styles.transferLabel}>Approved:</Text>
                            </View>
                            <View style={[styles.signatureLineBottom, { marginTop: 25 }]}>
                                <View style={styles.signatureBlock}>
                                    <Text style={styles.signatureName}></Text>
                                    <Text style={styles.signatureTitle}>OIC-School Head, HT-VI</Text>
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
                        <Text style={[styles.attendanceTitle, { fontSize: 11 }]}>REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</Text>
                        <View style={styles.lpTable}>
                            <View style={[styles.lpHeaderRow]}>
                                <View style={[styles.lpHeaderCell, { width: '40%', borderBottomWidth: 0, alignItems: 'center' }]}><Text>LEARNING AREAS</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '34%', padding: 0 }]}>
                                    <View style={{ borderBottomWidth: 1, borderColor: '#000', padding: 2, alignItems: 'center' }}><Text>TERM</Text></View>
                                    <View style={{ flexDirection: 'row', flex: 1 }}>
                                        <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>1</Text></View>
                                        <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>2</Text></View>
                                        <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text>3</Text></View>
                                    </View>
                                </View>
                                <View style={[styles.lpHeaderCell, { width: '11%', borderBottomWidth: 0 }]}><Text>FINAL GRADE</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '15%', borderBottomWidth: 0, borderRightWidth: 0 }]}><Text>REMARKS</Text></View>
                            </View>
                            {(() => {
                                const gradeLevelNum = parseInt(student.grade_level?.replace(/\D/g, '') || '0');
                                const currentSubjects = getSF9SubjectsForGrade(gradeLevelNum, schoolProfile?.curriculum);
                                return currentSubjects.map((subj, idx) => {
                                    const gradeRow = grades[subj.name] || [0, 0, 0, 0];
                                    const finalGrade = calculateFinalGrade(gradeRow);
                                    return (
                                        <View key={idx} style={styles.lpRow}>
                                            <View style={[styles.lpCell, { width: '40%', paddingLeft: subj.isComponent ? 15 : 4 }]}> 
                                                <Text style={{ fontWeight: subj.isComponent ? 'normal' : 'bold' }}>{subj.name}</Text>
                                            </View>
                                            <View style={[styles.lpCell, { width: '34%', padding: 0 }]}>
                                                <View style={{ flexDirection: 'row', flex: 1 }}>
                                                    <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{gradeRow[0] || ''}</Text></View>
                                                    <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{gradeRow[1] || ''}</Text></View>
                                                    <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text>{gradeRow[2] || ''}</Text></View>
                                                </View>
                                            </View>
                                            <View style={[styles.lpCell, { width: '11%', textAlign: 'center' }]}><Text>{finalGrade || ''}</Text></View>
                                            <View style={[styles.lpCellLast, { width: '15%', textAlign: 'center' }]}><Text>{getRemarks(finalGrade)}</Text></View>
                                        </View>
                                    );
                                });
                            })()}
                            <View style={[styles.lpRow, { borderBottomWidth: 0 }]}>
                                <View style={[styles.lpCell, { width: '40%', alignItems: 'flex-end', paddingRight: 5 }]}><Text style={{ fontWeight: 'bold' }}>General Average</Text></View>
                                <View style={[styles.lpCell, { width: '34%' }]}><Text></Text></View>
                                <View style={[styles.lpCell, { width: '11%', textAlign: 'center' }]}><Text>{calculateGeneralAverage(grades) || ''}</Text></View>
                                <View style={[styles.lpCellLast, { width: '15%', textAlign: 'center' }]}><Text>{getRemarks(calculateGeneralAverage(grades))}</Text></View>
                            </View>
                        </View>
                        <View style={styles.legendContainer}>
                            <Text style={styles.attendanceTitle}>Descriptors & Grading Scale</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                <View style={{ width: '40%' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2 }}>Descriptors</Text></View>
                                <View style={{ width: '30%', alignItems: 'center' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2 }}>Grading Scale</Text></View>
                                <View style={{ width: '30%', alignItems: 'center' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2 }}>Remarks</Text></View>
                            </View>
                            {[
                                { desc: 'Advancing (Namumukod-tangi)', scale: '90-100', rem: 'Passed' },
                                { desc: 'Benchmarking (Napamamalas)', scale: '80-89', rem: 'Passed' },
                                { desc: 'Connecting (Natutungo)', scale: '75-79', rem: 'Passed' },
                                { desc: 'Developing (Napauunlad)', scale: '65-74', rem: 'Failed' },
                                { desc: 'Emerging (Nasisimula)', scale: '0-64', rem: 'Failed' },
                            ].map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                    <View style={{ width: '40%' }}><Text>{item.desc}</Text></View>
                                    <View style={{ width: '30%', alignItems: 'center' }}><Text>{item.scale}</Text></View>
                                    <View style={{ width: '30%', alignItems: 'center' }}><Text>{item.rem}</Text></View>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.page2Right}>
                        <Text style={[styles.attendanceTitle, { fontSize: 11 }]}>REPORT ON LEARNER'S OBSERVED VALUES</Text>
                        <View style={styles.ovTable}>
                            <View style={[styles.ovHeaderRow, { height: 30 }]}>
                                <View style={[styles.lpHeaderCell, { width: '26%', borderBottomWidth: 0, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 4 }]}><Text>CORE VALUES</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '40%', borderBottomWidth: 0, justifyContent: 'center', alignItems: 'center' }]}><Text>BEHAVIOR STATEMENTS</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '34%', padding: 0, borderRightWidth: 0 }]}>
                                    <View style={{ borderBottomWidth: 1, borderColor: '#000', padding: 2, alignItems: 'center' }}><Text>TERM</Text></View>
                                    <View style={{ flexDirection: 'row', flex: 1 }}>
                                        <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>1</Text></View>
                                        <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>2</Text></View>
                                        <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text>3</Text></View>
                                    </View>
                                </View>
                            </View>
                            {CORE_VALUES.map((cv, cvIdx) => {
                                const grades = observedValues[cv.name] || [];
                                return (
                                    <View key={cvIdx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', flex: cv.behaviors.length * 0.5 }}>
                                        <View style={[styles.ovCell, { width: '26%', borderRightWidth: 1, borderBottomWidth: 0, justifyContent: 'center', textAlign: 'left', paddingLeft: 4, padding: 2 }]}>
                                            <Text>{cv.name}</Text>
                                        </View>
                                        <View style={{ width: '74%', flexDirection: 'column' }}>
                                            {cv.behaviors.map((behavior, bIdx) => {
                                                const isLastBehavior = bIdx === cv.behaviors.length - 1;
                                                return (
                                                    <View key={bIdx} style={{ flexDirection: 'row', borderBottomWidth: isLastBehavior ? 0 : 1, borderColor: '#000', flex: 1 }}>
                                                        <View style={{ width: '54%', padding: 2, fontSize: 9, borderRightWidth: 1, borderColor: '#000', justifyContent: 'center' }}>
                                                            <Text>{behavior}</Text>
                                                        </View>
                                                        <View style={{ width: '46%', padding: 0 }}>
                                                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{grades[bIdx * 3 + 0] || ''}</Text></View>
                                                                <View style={{ width: '33.33%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{grades[bIdx * 3 + 1] || ''}</Text></View>
                                                                <View style={{ width: '33.34%', justifyContent: 'center', alignItems: 'center' }}><Text>{grades[bIdx * 3 + 2] || ''}</Text></View>
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
                            <Text style={styles.attendanceTitle}>Non-numerical Rating</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                <View style={{ width: '30%' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2 }}>Marking</Text></View>
                                <View style={{ width: '70%' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2 }}>Non-numerical Rating</Text></View>
                            </View>
                            {[
                                { mark: 'AO', rating: 'Always Observed' },
                                { mark: 'SO', rating: 'Sometimes Observed' },
                                { mark: 'RO', rating: 'Rarely Observed' },
                                { mark: 'NO', rating: 'Not Observed' },
                            ].map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                    <View style={{ width: '30%' }}><Text>{item.mark}</Text></View>
                                    <View style={{ width: '70%' }}><Text>{item.rating}</Text></View>
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
}

const SF9PagesMemo = React.memo(SF9Pages);

function SF9BatchDocument({
    students, sections, sectionObj, subjects, gradingSheetRecords, schoolProfile, activeSchoolYear, observedValues, sf2Sheets, adviser, pageSize
}: SF9BatchDocumentProps) {
    return (
        <Document title={`SF9 Batch - ${sectionObj.section_name}`}>
            {students.map((student) => {
                const grades = computeStudentGrades(student, sectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile);
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
                        observedValues={values}
                        attendance={attendance}
                        pageSize={pageSize}
                        logoUrl={schoolProfile.logo_url || ''}
                        schoolProfile={schoolProfile}
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
        if (schoolProfile.adviser_name) return schoolProfile.adviser_name;
        const t = teacherList.find(t => t.uid === selectedSectionObj?.adviser_id);
        return t?.displayName || '';
    }, [selectedSectionObj, teacherList, schoolProfile.adviser_name]);

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
        if (!selectedStudent || !selectedSectionObj) return {};
        return computeStudentGrades(selectedStudent, selectedSectionObj, subjects, gradingSheetRecords, activeSchoolYear, schoolProfile);
    }, [selectedStudent, selectedSectionObj, gradingSheetRecords, activeSchoolYear, subjects, schoolProfile]);

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
                grades={studentGrades} 
                observedValues={studentValues} 
                attendance={attendance}
                pageSize={pageSize} 
                logoUrl={schoolProfile.logo_url || ''}
                schoolProfile={schoolProfile}
            />
        );
    }, [selectedStudent, selectedSectionObj, schoolProfile, activeSchoolYear, adviserName, studentGrades, studentValues, sf2Sheets, pageSize, sections]);

    const batchDocument = useMemo(() => {
        if (!isGeneratingBatch || !selectedSectionObj || sectionStudents.length === 0) return null;
        const sortedStudents = [...males, ...females];
        return (
            <SF9BatchDocument 
                students={sortedStudents}
                sections={sections}
                sectionObj={selectedSectionObj}
                subjects={subjects}
                gradingSheetRecords={gradingSheetRecords}
                schoolProfile={schoolProfile}
                activeSchoolYear={activeSchoolYear}
                observedValues={observedValues}
                sf2Sheets={sf2Sheets}
                adviser={adviserName}
                pageSize={pageSize}
            />
        );
    }, [isGeneratingBatch, sectionStudents, selectedSectionObj, subjects, gradingSheetRecords, schoolProfile, activeSchoolYear, observedValues, sf2Sheets, adviserName, pageSize, sections, males, females]);

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
                quarter: q as 1 | 2 | 3 | 4,
                values: { ...(existing?.values || {}), ...changesForQ }
            };
            
            // Fire and forget most updates, we trust the optimistic store
            void updateObservedValue(newValue);
        }
        
        setPendingChanges({});
        setIsValuesModalOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans">
             {/* Sticky Premium Top Toolbar */}
             <div className="h-20 px-6 flex items-center justify-between z-[100] bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm relative print:hidden shrink-0">
                <div className="flex items-center gap-5">
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
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">SF9 Report</h2>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Progress Report Card</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1.5" />

                    {/* Learner & Section Selector */}
                    <div className="flex items-center gap-2.5">
                        {filteredSections.length > 1 && (
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Grade & Section</span>
                                <select 
                                    className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2 text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                    value={selectedSection}
                                    onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudent(null); setIsBatchReady(false); }}
                                >
                                    <option value="">Choose Section</option>
                                    {filteredSections.map(s => <option key={s.id} value={s.id}>{s.section_grade_level} - {s.section_name}</option>)}
                                </select>
                            </div>
                        )}

                        {!isBatchReady && (
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Learner Database</span>
                                <select 
                                    className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2 text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer min-w-[200px] disabled:opacity-30"
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
                            </div>
                        )}

                        <div className="flex flex-col ml-1">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mode</span>
                             <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                <button
                                    onClick={() => setIsBatchReady(false)}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isBatchReady ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Individual
                                </button>
                                <button
                                    onClick={() => { setIsBatchReady(true); setSelectedStudent(null); }}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isBatchReady ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Batch
                                </button>
                             </div>
                        </div>

                        {selectedStudent && !isBatchReady && (
                            <button
                                onClick={() => {
                                    setPendingChanges({});
                                    setIsValuesModalOpen(true);
                                }}
                                className="mt-5 h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center gap-2"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                Values
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Paper Size */}
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Paper</span>
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button
                                onClick={() => setPageSize('A4')}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pageSize === 'A4' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                            >
                                A4
                            </button>
                            <button
                                onClick={() => setPageSize('LETTER')}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pageSize === 'LETTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                            >
                                Letter
                            </button>
                        </div>
                    </div>

                    {/* Zoom Control */}
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Zoom</span>
                        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-black text-slate-900 w-12 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-200" />

                    {/* Print Primary Button */}
                    <div className="flex items-center gap-2">
                        {!isBatchReady && singleDocument && (
                                <PDFDownloadLink
                                    document={singleDocument}
                                    fileName={`SF9_${selectedSectionObj?.section_name || 'Record'}_${selectedStudent?.last_name || 'Student'}_${activeSchoolYear}.pdf`}
                                    className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group whitespace-nowrap"
                                >
                                    {({ loading }) => (
                                        <>
                                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Printer className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />}
                                            {loading ? 'Generating...' : 'Print Official SF9'}
                                        </>
                                    )}
                                </PDFDownloadLink>
                            )
                        }
                    </div>
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
        </div>
    );
}
