import { useState, useMemo, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image, Font } from '@react-pdf/renderer';
Font.registerHyphenationCallback(word => [word]);
import { useAppStore, useAuthStore } from '../stores';
import type { Student, User } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StudentSelector } from '../components/StudentSelector';

// SF9-JHS Official Template - Landscape Format
const styles = StyleSheet.create({
    page: { paddingTop: 20, paddingBottom: 20, paddingHorizontal: 30, fontSize: 10, fontFamily: 'Times-Roman' },
    // PAGE 1 STYLES (Unchanged)
    page1Container: { flexDirection: 'row', height: '100%' },
    leftColumn: { width: '50%', paddingRight: 15 },
    rightColumn: { width: '50%', paddingLeft: 15 },
    sf9Label: { fontSize: 10, fontStyle: 'italic', textAlign: 'right', marginBottom: 15 },
    attendanceTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 }, // Updated marginBottom to 15px
    attendanceTable: { borderWidth: 1, borderColor: '#000', marginBottom: 25 },
    attHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    attRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    attRowLast: { flexDirection: 'row' },
    attMonthCell: { width: '7%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, fontSize: 7, textAlign: 'center', justifyContent: 'center' },
    attLabelCell: { width: '11%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, fontSize: 8, justifyContent: 'center' },
    attDataCell: { width: '7%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, fontSize: 8, textAlign: 'center', justifyContent: 'center' },
    attDataCellLast: { width: '12%', padding: 2, fontSize: 8, textAlign: 'center', justifyContent: 'center' },
    parentSection: { marginTop: 15 }, // Reduced from 25
    parentTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }, // Increased from 10
    signatureRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' }, // Increased from 6
    quarterLabel: { width: '20%', fontSize: 10 },
    signatureLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', height: 16 }, // Reduced height from 20
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }, // Reduced from 10
    headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
    headerText: { fontSize: 10, textAlign: 'center', marginBottom: 1 },
    schoolName: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginTop: 4, marginBottom: 8 }, // Reduced from 8/12
    reportTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }, // Reduced from 15
    logo: { width: 55, height: 55 },
    studentInfoGrid: { marginBottom: 10 }, // Reduced from 15
    infoRow: { flexDirection: 'row', marginBottom: 6 },
    infoLabel: { fontSize: 10, width: 50 },
    infoValue: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', fontSize: 10, paddingBottom: 2 },
    // Changed fixed width to flex: 1 to balance with the first column
    infoValueShort: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', fontSize: 10, paddingBottom: 2, marginLeft: 10 },
    infoLabelRight: { fontSize: 10, width: 70, marginLeft: 10 }, // Reduced width and margin to save space
    dearParents: { fontSize: 10, fontWeight: 'bold', marginBottom: 5, marginTop: 25 },
    messageText: { fontSize: 9, lineHeight: 1.5, marginBottom: 8, textAlign: 'justify' },
    signatureLineBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }, // Reduced from 15
    signatureBlock: { width: '48%', alignItems: 'center' },
    signatureName: { borderBottomWidth: 1, borderBottomColor: '#000', width: '100%', textAlign: 'center', paddingBottom: 2, marginBottom: 2, fontSize: 10, fontWeight: 'bold' },
    signatureTitle: { fontSize: 9, textAlign: 'center' },
    transferSection: { marginTop: 35, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 10 }, // Increased from 15
    transferTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }, // Reduced from 10
    transferRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
    transferLabel: { fontSize: 9, width: 150 },
    transferLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', height: 15 },

    // PAGE 2 STYLES (Refined Layout)
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

const SUBJECTS = [
    { name: 'Filipino' },
    { name: 'English' },
    { name: 'Mathematics' },
    { name: 'Science' },
    { name: 'Araling Panlipunan' },
    { name: 'Values Education' },
    { name: 'Technology and Livelihood Education' },
    { name: 'MAPEH' },
    { name: 'Music and Arts' },
    { name: 'Physical Education and Health' },
];

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


function calculateGeneralAverage(grades: Record<string, number[]>): number {
    let totalSum = 0;
    let subjectCount = 0;

    // Subjects to EXCLUDE from General Average (they're already part of MAPEH)
    const excludedSubjects = ['Music and Arts', 'Physical Education and Health'];

    Object.entries(grades).forEach(([subjectName, qGrades]) => {
        // Skip Music and Arts & PE and Health (already included in MAPEH)
        if (excludedSubjects.includes(subjectName)) {
            return;
        }

        // Only include subjects that have ALL 4 quarters completed
        const allQuartersComplete = qGrades.length === 4 && qGrades.every(g => g > 0);
        if (allQuartersComplete) {
            const avg = qGrades.reduce((a, b) => a + b, 0) / 4;
            totalSum += avg;
            subjectCount++;
        }
    });
    return subjectCount > 0 ? Math.round(totalSum / subjectCount) : 0;
}

// Calculate final grade for a single subject - only if all 4 quarters have grades
function calculateFinalGrade(quarterGrades: number[]): number {
    if (quarterGrades.length !== 4 || !quarterGrades.every(g => g > 0)) {
        return 0; // Don't compute if not all quarters have grades
    }
    return Math.round(quarterGrades.reduce((a, b) => a + b, 0) / 4);
}

function getRemarks(grade: number): string {
    if (grade <= 0) return ''; // No remarks if no final grade
    if (grade >= 75) return 'Passed';
    return 'Failed';
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
    pageSize: 'A4' | 'LETTER';
}

function SF9ExactDocument({
    student, schoolName, schoolYear, section, region, division, district,
    adviser, principal, principalTitle, grades, observedValues, pageSize
}: SF9ExactDocumentProps) {
    const attendance = {
        months: ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'TOTAL'],
        schoolDays: [22, 21, 21, 20, 16, 21, 20, 22, 20, 21, 20, 224],
        daysPresent: [22, 21, 21, 20, 16, 21, 20, 22, 20, 21, 20, 224],
        daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    return (
        <Document>
            {/* PAGE 1 */}
            <Page size={pageSize} orientation="landscape" style={styles.page}>
                <View style={styles.page1Container}>
                    {/* LEFT COLUMN - Attendance */}
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
                            {[{ num: '1', suffix: 'st' }, { num: '2', suffix: 'nd' }, { num: '3', suffix: 'rd' }, { num: '4', suffix: 'th' }].map((quarter, idx) => (
                                <View key={idx} style={styles.signatureRow}>
                                    <Text style={styles.quarterLabel}>{quarter.num}<Text style={{ fontSize: 7, verticalAlign: 'super' }}>{quarter.suffix}</Text>{' Quarter'}</Text>
                                    <View style={styles.signatureLine} />
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* RIGHT COLUMN - Header & Student Info */}
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
                            <Image src={`${import.meta.env.BASE_URL}deped_logo_right.png`} style={styles.logo} />
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
                        <Text style={styles.dearParents}>Dear Parents:</Text>
                        <Text style={styles.messageText}>This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values.</Text>
                        <Text style={styles.messageText}>The school welcomes you should you desire to know more about your child's progress.</Text>
                        <View style={styles.signatureLineBottom}>
                            <View style={styles.signatureBlock}>
                                <Text style={styles.signatureName}>{principal}</Text>
                                <Text style={styles.signatureTitle}>{principalTitle}</Text>
                            </View>
                            <View style={styles.signatureBlock}>
                                <Text style={styles.signatureName}>{adviser}</Text>
                                <Text style={styles.signatureTitle}>Teacher Adviser</Text>
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

            {/* PAGE 2 - JSON Based Implementation (Updated) */}
            <Page size={pageSize} orientation="landscape" style={styles.page}>
                <View style={styles.page2Container}>
                    {/* LEFT COLUMN - Learning Progress */}
                    {/* UPDATED COLUMNS: 40% | 8.5% | 8.5% | 8.5% | 8.5% | 11% | 15% */}
                    <View style={styles.page2Left}>
                        <Text style={[styles.attendanceTitle, { fontSize: 11 }]}>REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</Text>
                        <View style={styles.lpTable}>
                            {/* Header Row 1 */}
                            <View style={[styles.lpHeaderRow]}>
                                <View style={[styles.lpHeaderCell, { width: '40%', borderBottomWidth: 0, alignItems: 'center' }]}><Text>LEARNING AREAS</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '34%', padding: 0 }]}>
                                    <View style={{ borderBottomWidth: 1, borderColor: '#000', padding: 2, alignItems: 'center' }}><Text>QUARTER</Text></View>
                                    <View style={{ flexDirection: 'row', flex: 1 }}>
                                        <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>1</Text></View>
                                        <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>2</Text></View>
                                        <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>3</Text></View>
                                        <View style={{ width: '25%', justifyContent: 'center', alignItems: 'center' }}><Text>4</Text></View>
                                    </View>
                                </View>
                                <View style={[styles.lpHeaderCell, { width: '11%', borderBottomWidth: 0 }]}><Text>FINAL GRADE</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '15%', borderBottomWidth: 0, borderRightWidth: 0 }]}><Text>REMARKS</Text></View>
                            </View>

                            {/* Data Rows */}
                            {SUBJECTS.map((subj, idx) => {
                                const gradeRow = grades[subj.name] || [0, 0, 0, 0];
                                const finalGrade = calculateFinalGrade(gradeRow);
                                return (
                                    <View key={idx} style={styles.lpRow}>
                                        <View style={[styles.lpCell, { width: '40%' }]}><Text>{subj.name}</Text></View>

                                        {/* Matches Header Structure for perfect alignment */}
                                        <View style={[styles.lpCell, { width: '34%', padding: 0 }]}>
                                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                                <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{gradeRow[0] || ''}</Text></View>
                                                <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{gradeRow[1] || ''}</Text></View>
                                                <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{gradeRow[2] || ''}</Text></View>
                                                <View style={{ width: '25%', justifyContent: 'center', alignItems: 'center' }}><Text>{gradeRow[3] || ''}</Text></View>
                                            </View>
                                        </View>

                                        <View style={[styles.lpCell, { width: '11%', textAlign: 'center' }]}><Text>{finalGrade || ''}</Text></View>
                                        <View style={[styles.lpCellLast, { width: '15%', textAlign: 'center' }]}><Text>{getRemarks(finalGrade)}</Text></View>
                                    </View>
                                );
                            })}

                            {/* General Average Row - Flex: 1 to fill space evenly */}
                            <View style={[styles.lpRow, { borderBottomWidth: 0 }]}>
                                <View style={[styles.lpCell, { width: '40%', alignItems: 'flex-end', paddingRight: 5 }]}><Text style={{ fontWeight: 'bold' }}>General Average</Text></View>
                                <View style={[styles.lpCell, { width: '34%' }]}><Text></Text></View>
                                <View style={[styles.lpCell, { width: '11%', textAlign: 'center' }]}><Text>{calculateGeneralAverage(grades) || ''}</Text></View>
                                <View style={[styles.lpCellLast, { width: '15%', textAlign: 'center' }]}><Text>{getRemarks(calculateGeneralAverage(grades))}</Text></View>
                            </View>
                        </View>

                        {/* Legends - Grading Scale */}
                        <View style={styles.legendContainer}>
                            <Text style={styles.attendanceTitle}>Descriptors & Grading Scale</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                <View style={{ width: '40%' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2 }}>Descriptors</Text></View>
                                <View style={{ width: '30%', alignItems: 'center' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2 }}>Grading Scale</Text></View>
                                <View style={{ width: '30%', alignItems: 'center' }}><Text style={{ fontWeight: 'bold', borderBottomWidth: 1, marginBottom: 2 }}>Remarks</Text></View>
                            </View>
                            {[
                                { desc: 'Outstanding', scale: '90-100', rem: 'Passed' },
                                { desc: 'Very Satisfactory', scale: '85-89', rem: 'Passed' },
                                { desc: 'Satisfactory', scale: '80-84', rem: 'Passed' },
                                { desc: 'Fairly Satisfactory', scale: '75-79', rem: 'Passed' },
                                { desc: 'Did Not Meet Expectations', scale: 'Below 75', rem: 'Failed' },
                            ].map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '90%' }}>
                                    <View style={{ width: '40%' }}><Text>{item.desc}</Text></View>
                                    <View style={{ width: '30%', alignItems: 'center' }}><Text>{item.scale}</Text></View>
                                    <View style={{ width: '30%', alignItems: 'center' }}><Text>{item.rem}</Text></View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* RIGHT COLUMN - Observed Values (6 Columns: 20%, 46%, 8.5%, 8.5%, 8.5%, 8.5%) */}
                    <View style={styles.page2Right}>
                        <Text style={[styles.attendanceTitle, { fontSize: 11 }]}>REPORT ON LEARNER'S OBSERVED VALUES</Text>
                        <View style={styles.ovTable}>
                            {/* Header Row */}
                            <View style={[styles.ovHeaderRow, { height: 30 }]}>
                                <View style={[styles.lpHeaderCell, { width: '26%', borderBottomWidth: 0, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 4 }]}><Text>CORE VALUES</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '40%', borderBottomWidth: 0, justifyContent: 'center', alignItems: 'center' }]}><Text>BEHAVIOR STATEMENTS</Text></View>
                                <View style={[styles.lpHeaderCell, { width: '34%', padding: 0, borderRightWidth: 0 }]}>
                                    <View style={{ borderBottomWidth: 1, borderColor: '#000', padding: 2, alignItems: 'center' }}><Text>QUARTER</Text></View>
                                    <View style={{ flexDirection: 'row', flex: 1 }}>
                                        <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>1</Text></View>
                                        <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>2</Text></View>
                                        <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>3</Text></View>
                                        <View style={{ width: '25%', justifyContent: 'center', alignItems: 'center' }}><Text>4</Text></View>
                                    </View>
                                </View>
                            </View>

                            {/* Data Rows - Refactored for Merged Core Values & Flex Height */}
                            {CORE_VALUES.map((cv, cvIdx) => {
                                const grades = observedValues[cv.name] || [];
                                // Each behavior row gets 0.5 flex
                                const flexValue = cv.behaviors.length * 0.5;

                                return (
                                    <View key={cvIdx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', flex: flexValue }}>
                                        {/* Core Value Cell - Merged (Left, 26%) */}
                                        <View style={[styles.ovCell, { width: '26%', borderRightWidth: 1, borderBottomWidth: 0, justifyContent: 'center', textAlign: 'left', paddingLeft: 4, padding: 2 }]}>
                                            <Text>{cv.name}</Text>
                                        </View>

                                        {/* Behaviors Column (Right, 74%) */}
                                        <View style={{ width: '74%', flexDirection: 'column' }}>
                                            {cv.behaviors.map((behavior, bIdx) => {
                                                const isLastBehavior = bIdx === cv.behaviors.length - 1;
                                                return (
                                                    <View key={bIdx} style={{ flexDirection: 'row', borderBottomWidth: isLastBehavior ? 0 : 1, borderColor: '#000', flex: 1 }}>
                                                        {/* Behavior Statement (54% of 74% ≈ 40% of total) */}
                                                        <View style={{ width: '54%', padding: 2, fontSize: 9, borderRightWidth: 1, borderColor: '#000', justifyContent: 'center' }}>
                                                            <Text>{behavior}</Text>
                                                        </View>

                                                        {/* Quarter Cells Container (46% of 74% ≈ 34% of total) */}
                                                        <View style={{ width: '46%', padding: 0 }}>
                                                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                                                <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{grades[bIdx * 4 + 0] || ''}</Text></View>
                                                                <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{grades[bIdx * 4 + 1] || ''}</Text></View>
                                                                <View style={{ width: '25%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text>{grades[bIdx * 4 + 2] || ''}</Text></View>
                                                                <View style={{ width: '25%', justifyContent: 'center', alignItems: 'center' }}><Text>{grades[bIdx * 4 + 3] || ''}</Text></View>
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

                        {/* Legends - Marking Code */}
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
        </Document>
    );
}

export function SF9Page() {
    const { students, sections, schoolProfile, activeSchoolYear, classRecords, subjects, observedValues, updateObservedValue } = useAppStore();
    const { user } = useAuthStore();
    const isTeacher = user?.role === 'teacher';

    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [pageSize, setPageSize] = useState<'A4' | 'LETTER'>('A4');
    const [isValuesModalOpen, setIsValuesModalOpen] = useState(false);
    const [modalQuarter, setModalQuarter] = useState<1 | 2 | 3 | 4>(1);
    const [teachers, setTeachers] = useState<User[]>([]);

    // Fetch teachers to resolve adviser names
    useEffect(() => {
        const fetchTeachers = async () => {
            const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
            const snapshot = await getDocs(q);
            const fetchedTeachers = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            })) as User[];
            setTeachers(fetchedTeachers);
        };
        fetchTeachers();
    }, []);

    // Memoize the selected section object for reuse
    const selectedSectionObj = useMemo(() => {
        return sections.find(s => s.section_name === selectedSection);
    }, [sections, selectedSection]);

    // Resolve adviser name from UID
    const adviserName = useMemo(() => {
        const adviserId = selectedSectionObj?.adviser_id;
        if (!adviserId) return '';
        const teacher = teachers.find(t => t.uid === adviserId);
        return teacher?.displayName || '';
    }, [selectedSectionObj, teachers]);

    // Filter Sections for Advisers & Sort
    const filteredSections = useMemo(() => {
        let availableSections = sections;

        if (isTeacher && user?.uid) {
            availableSections = sections.filter(section => section.adviser_id === user.uid);
        }

        // Sort by Grade Level (numeric) then Section Name (alpha)
        return [...availableSections].sort((a, b) => {
            const getGradeNum = (g: string) => {
                const match = g.match(/\d+/);
                return match ? parseInt(match[0], 10) : 999;
            };
            const gradeA = getGradeNum(a.section_grade_level);
            const gradeB = getGradeNum(b.section_grade_level);

            if (gradeA !== gradeB) {
                return gradeA - gradeB;
            }
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, isTeacher, user]);

    // Calculate studentValues for the modal and PDF
    // We need to flatten the structure: CoreValue -> Behavior -> Quarters
    const studentValues = useMemo(() => {
        if (!selectedStudent) return {};
        const values: Record<string, string[]> = {};

        CORE_VALUES.forEach(cv => {
            const rawValues: string[] = [];
            cv.behaviors.forEach((_, bIdx) => {
                const key = `${cv.name}_${bIdx}`;
                const q1 = observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === 1)?.values[key] || '';
                const q2 = observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === 2)?.values[key] || '';
                const q3 = observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === 3)?.values[key] || '';
                const q4 = observedValues.find(v => v.student_lrn === selectedStudent.lrn && v.school_year === activeSchoolYear && v.quarter === 4)?.values[key] || '';
                rawValues.push(q1, q2, q3, q4);
            });
            values[cv.name] = rawValues;
        });
        return values;

    }, [selectedStudent, observedValues, activeSchoolYear]);

    // Filter students for the selected section
    const sectionStudents = useMemo(() => {
        return selectedSection ? students.filter(s => s.student_section === selectedSection) : [];
    }, [students, selectedSection]);

    const studentGrades = useMemo(() => {
        if (!selectedStudent || !selectedSectionObj) return {};
        const grades: Record<string, number[]> = {};

        // Helper function to get grades for a subject
        const getSubjectGrades = (subjectName: string): number[] => {
            // Correctly find the subject LINKED TO THIS SECTION
            const matchingSubject = subjects.find(s =>
                s.subject_name.toLowerCase() === subjectName.toLowerCase() &&
                s.section_id === selectedSectionObj.id
            );

            if (matchingSubject) {
                const getQuarterGrade = (q: 1 | 2 | 3 | 4) => {
                    const r = classRecords.find(rec =>
                        rec.student_lrn === selectedStudent.lrn &&
                        rec.subject_id === matchingSubject.id &&
                        rec.school_year === activeSchoolYear &&
                        rec.quarter === q
                    );

                    const hasScores = r && (
                        r.written_works.some(s => Number(s) > 0) ||
                        r.performance_tasks.some(s => Number(s) > 0) ||
                        Number(r.quarterly_exam) > 0
                    );

                    return hasScores ? Number(r?.final_grade || 0) : 0;
                };

                return [getQuarterGrade(1), getQuarterGrade(2), getQuarterGrade(3), getQuarterGrade(4)];
            }
            return [0, 0, 0, 0];
        };

        SUBJECTS.forEach(sf9Subject => {
            if (sf9Subject.name === 'MAPEH') {
                // MAPEH is a composite: average of Music and Arts + PE and Health
                const musicArtsGrades = getSubjectGrades('Music and Arts');
                const peHealthGrades = getSubjectGrades('Physical Education and Health');

                // Calculate average for each quarter (only if both components have grades)
                const mapehGrades = [0, 1, 2, 3].map(qIdx => {
                    const ma = musicArtsGrades[qIdx];
                    const pe = peHealthGrades[qIdx];
                    // If one is missing, use the other? Or require both?
                    // Standard is usually average. If one is 0/missing, it drags down the average or is incomplete.
                    // For now, let's just average them, considering 0 as 0. 
                    // If both are present: avg.
                    // If only one is present ... technically MAPEH grade should exist only if components exist.
                    // Let's stick to the previous safe logic:
                    if (ma > 0 && pe > 0) return Math.round((ma + pe) / 2);
                    if (ma > 0) return ma;
                    if (pe > 0) return pe;
                    return 0;
                });
                grades[sf9Subject.name] = mapehGrades;
            } else {
                // Regular subjects
                grades[sf9Subject.name] = getSubjectGrades(sf9Subject.name);
            }
        });
        return grades;
    }, [selectedStudent, selectedSectionObj, classRecords, activeSchoolYear, subjects]);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <div className="w-80 bg-white shadow-lg z-10 flex flex-col h-full border-r border-gray-200">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-deped-blue mb-1">SF9 Configuration</h2>
                    <p className="text-xs text-gray-500">Generate Learner's Progress Report Card</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-600">{activeSchoolYear}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Section</label>
                            <select className="form-select w-full" value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudent(null); }}>
                                <option value="">-- Choose Section --</option>
                                {filteredSections.map(section => <option key={section.id} value={section.section_name}>{section.section_grade_level} - {section.section_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                            <StudentSelector
                                students={sectionStudents}
                                selectedStudentLrn={selectedStudent?.lrn || null}
                                onSelect={(lrn) => {
                                    const student = students.find(s => s.lrn === lrn);
                                    setSelectedStudent(student || null);
                                }}
                                disabled={!selectedSection}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="pageSize" value="A4" checked={pageSize === 'A4'} onChange={(e) => setPageSize(e.target.value as 'A4')} className="text-deped-blue focus:ring-deped-blue" />
                                    <span className="text-sm text-gray-700">A4</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="pageSize" value="LETTER" checked={pageSize === 'LETTER'} onChange={(e) => setPageSize(e.target.value as 'LETTER')} className="text-deped-blue focus:ring-deped-blue" />
                                    <span className="text-sm text-gray-700">Letter</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 my-4"></div>
                    <div className="flex flex-col gap-3">
                        <button className="btn-secondary flex-1" onClick={() => setIsValuesModalOpen(true)} disabled={!selectedStudent}>✏️ Edit Values</button>
                        {selectedStudent ? (
                            <PDFDownloadLink
                                document={<SF9ExactDocument student={selectedStudent} schoolName={schoolProfile.name} schoolYear={activeSchoolYear} section={selectedSection} region="Region XXX" division="Division of Matatag Division" district="MATATAG DISTRICT" adviser={adviserName} principal={schoolProfile.head_name} principalTitle="OIC-School Head, HT-VI" grades={studentGrades} observedValues={studentValues} pageSize={pageSize} />}
                                fileName={`SF9_${selectedSection.replace(/\s+/g, '-')}_${selectedStudent.last_name}_${selectedStudent.first_name}_${activeSchoolYear}.pdf`}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {({ loading }) => (loading ? 'Generating...' : '📄 Download PDF')}
                            </PDFDownloadLink>
                        ) : (
                            <button className="btn-primary flex-1 opacity-50 cursor-not-allowed">📄 Download PDF</button>
                        )}
                    </div>
                </div>
                {selectedStudent && (
                    <div className="bg-white rounded-lg shadow p-6 animate-fade-in mt-6 hidden"></div>
                )}
            </div>
            <div className="flex-1 bg-gray-500/10 p-8 overflow-auto flex justify-center items-start">
                {selectedStudent ? (
                    <div className="bg-white shadow-2xl rounded-sm overflow-hidden" style={{ width: pageSize === 'A4' ? '297mm' : '279mm', height: pageSize === 'A4' ? '210mm' : '216mm' }}>
                        <PDFViewer width="100%" height="100%" showToolbar={true} className="w-full h-full">
                            <SF9ExactDocument student={selectedStudent} schoolName={schoolProfile.name} schoolYear={activeSchoolYear} section={selectedSection} region="Region XXX" division="Division of Matatag Division" district="MATATAG DISTRICT" adviser={adviserName} principal={schoolProfile.head_name} principalTitle="OIC-School Head, HT-VI" grades={studentGrades} observedValues={studentValues} pageSize={pageSize} />
                        </PDFViewer>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-lg font-medium">Select a student to preview SF9</p>
                    </div>
                )}
            </div>
            {isValuesModalOpen && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsValuesModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="text-xl font-bold">Edit Observed Values - {selectedStudent.first_name} {selectedStudent.last_name}</h3>
                            <button onClick={() => setIsValuesModalOpen(false)} className="text-white/80 hover:text-white text-2xl">×</button>
                        </div>
                        {/* Quarter Selector Tabs */}
                        <div className="flex border-b sticky top-[60px] bg-white z-10">
                            {[1, 2, 3, 4].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => setModalQuarter(q as 1 | 2 | 3 | 4)}
                                    className={`flex-1 py-3 text-center font-semibold transition-colors ${modalQuarter === q
                                        ? 'bg-deped-blue text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Quarter {q}
                                </button>
                            ))}
                        </div>
                        <div className="p-6">
                            {CORE_VALUES.map((cv) => {
                                return (
                                    <div key={cv.name} className="mb-6 pb-6 border-b last:border-b-0">
                                        <h4 className="font-bold text-lg text-deped-blue mb-3">{cv.name}</h4>
                                        {cv.behaviors.map((behavior, bIdx) => {
                                            const key = `${cv.name}_${bIdx}`;
                                            // Get the current value for this quarter
                                            const existingRecord = observedValues.find(
                                                v => v.student_lrn === selectedStudent.lrn &&
                                                    v.school_year === activeSchoolYear &&
                                                    v.quarter === modalQuarter
                                            );
                                            const currentValue = existingRecord?.values[key] || '';

                                            return (
                                                <div key={bIdx} className="mb-4">
                                                    <p className="text-sm text-gray-600 mb-2">{behavior}</p>
                                                    <select
                                                        className="form-input text-center w-24"
                                                        value={currentValue}
                                                        onChange={(e) => {
                                                            const updatedRecord = {
                                                                id: existingRecord?.id || Date.now().toString(),
                                                                student_lrn: selectedStudent.lrn,
                                                                school_year: activeSchoolYear,
                                                                quarter: modalQuarter,
                                                                values: { ...(existingRecord?.values || {}), [key]: e.target.value }
                                                            };
                                                            updateObservedValue(updatedRecord);
                                                        }}
                                                    >
                                                        <option value="">--</option>
                                                        <option value="AO">AO</option>
                                                        <option value="SO">SO</option>
                                                        <option value="RO">RO</option>
                                                        <option value="NO">NO</option>
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end sticky bottom-0">
                            <button onClick={() => setIsValuesModalOpen(false)} className="btn-primary">Close & Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
