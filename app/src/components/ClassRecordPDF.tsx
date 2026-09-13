import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Student, SchoolProfile } from '../types';

// Register fonts if needed, otherwise use built-in Helvetica
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 10,
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    logoLeft: {
        width: 50,
        height: 50,
    },
    logoRight: {
        width: 100, // DepEd Logo is wider usually
        height: 50,
        objectFit: 'contain',
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subHeaderText: {
        fontSize: 9,
        textAlign: 'center',
    },
    tableContainer: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#000',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        height: 15, // Fixed row height for consistency
        alignItems: 'center',
    },
    cell: {
        borderRightWidth: 1,
        borderRightColor: '#000',
        padding: 1,
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    nameCell: {
        width: 150, // Fixed width for names
        textAlign: 'left',
        paddingLeft: 2,
    },
    scoreCell: {
        flex: 1, // Distribute remaining space
    },
    totalCell: {
        width: 25,
        backgroundColor: '#f0f0f0',
    },
    gradeCell: {
        width: 30,
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    remarksCell: {
        width: 40,
    },
    sectionHeader: {
        backgroundColor: '#e0e0e0',
        fontWeight: 'bold',
        paddingLeft: 5,
        justifyContent: 'center',
        height: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    bgRed500: { backgroundColor: '#ef4444', color: '#ffffff' },
    bgGray100: { backgroundColor: '#f3f4f6' },
    bgGray200: { backgroundColor: '#e5e7eb' },
    textRed600: { color: '#dc2626' },
    textGreen700: { color: '#15803d' },
    // Styles for the official template
    headerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
    },
    headerSubtitle: {
        fontSize: 8,
        textAlign: 'center',
        color: '#cc0000', // Red color for "Pursuant to..."
        fontStyle: 'italic',
        marginBottom: 5,
    },
    infoGrid: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: '#000',
    },
    infoBox: {
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
        padding: 2,
        fontSize: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        fontWeight: 'bold',
        marginRight: 4,
    },
    infoValue: {
        flex: 1,
        fontFamily: 'Helvetica-Bold', // Simulate bold input
    },
    quarterRow: {
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderTopWidth: 1, // Double border effect logic needs care, but standard 1px is fine
        borderColor: '#000',
        height: 20,
    },
    quarterCellFirst: {
        backgroundColor: '#fefce8', // Yellow-ish
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
        fontWeight: 'bold',
    },
    quarterCell: {
        justifyContent: 'center',
        paddingLeft: 4,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
    },
});

interface ClassRecordPDFProps {
    schoolProfile: SchoolProfile;
    activeSchoolYear: string;
    quarter: number;
    sectionGradeLevel: string;
    sectionName: string;
    teacherName: string;
    subjectName: string;
    hps: { ww: (number | string)[]; pt: (number | string)[]; qa: number | string };
    currentWeights: { written_works: number; performance_tasks: number; quarterly_exam: number };
    maleStudents: Student[];
    femaleStudents: Student[];
    // Helper function to calculate student grades needs to be passed or logic duplicated
    getStudentSummary: (student: Student) => StudentSummary;
}

interface StudentSummary {
    ww: number[];
    wwTotalScore: number;
    wwPS: number;
    wwWS: number;
    pt: number[];
    ptTotalScore: number;
    ptPS: number;
    ptWS: number;
    qaScore: number;
    qaPS: number;
    qaWS: number;
    initialGrade: number;
    quarterlyGrade: number;
}

export const ClassRecordPDF = ({
    schoolProfile,
    activeSchoolYear,
    quarter,
    sectionGradeLevel,
    sectionName,
    teacherName,
    subjectName,
    hps,
    currentWeights,
    maleStudents,
    femaleStudents,
    getStudentSummary
}: ClassRecordPDFProps) => {

    const renderStudentRow = (student: Student, idx: number) => {
        const s = getStudentSummary(student);

        return (
            <View style={styles.row} key={student.lrn}>
                <View style={[styles.cell, styles.nameCell]}>
                    <Text>{idx + 1}. {`${student.last_name}, ${student.first_name}`.toUpperCase()}</Text>
                </View>
                {/* WW */}
                {s.ww.map((val: number, i: number) => (
                    <View style={[styles.cell, styles.scoreCell]} key={`ww-${i}`}><Text>{val || ''}</Text></View>
                ))}
                <View style={[styles.cell, styles.totalCell, { backgroundColor: '#ffffff' }]}><Text>{s.wwTotalScore}</Text></View>
                <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]}><Text>{s.wwPS.toFixed(2)}</Text></View>
                <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]}><Text>{s.wwWS.toFixed(2)}</Text></View>

                {/* PT */}
                {s.pt.map((val: number, i: number) => (
                    <View style={[styles.cell, styles.scoreCell]} key={`pt-${i}`}><Text>{val || ''}</Text></View>
                ))}
                <View style={[styles.cell, styles.totalCell, { backgroundColor: '#ffffff' }]}><Text>{s.ptTotalScore}</Text></View>
                <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]}><Text>{s.ptPS.toFixed(2)}</Text></View>
                <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]}><Text>{s.ptWS.toFixed(2)}</Text></View>

                {/* QA */}
                <View style={[styles.cell, styles.scoreCell, { flex: 2 }]}><Text>{s.qaScore || ''}</Text></View>
                <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]}><Text>{s.qaPS.toFixed(2)}</Text></View>
                <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]}><Text>{s.qaWS.toFixed(2)}</Text></View>

                {/* Final */}
                <View style={[styles.cell, styles.gradeCell, { backgroundColor: '#ffffff' }]}><Text>{s.initialGrade.toFixed(2)}</Text></View>
                <View style={[
                    styles.cell,
                    styles.remarksCell,
                    s.quarterlyGrade < 75 ? { backgroundColor: '#ff0000', color: '#ffffff', fontWeight: 'bold' } : { backgroundColor: '#ffffff' }
                ]}><Text>{s.quarterlyGrade}</Text></View>
            </View>
        );
    };

    const getQuarterName = (q: number) => {
        switch (q) {
            case 1: return 'TERM 1';
            case 2: return 'TERM 2';
            case 3: return 'TERM 3';
            case 4: return 'LEGACY QUARTER 4';
            default: return 'TERM 1';
        }
    };

    return (
        <Document>
            <Page size={[936, 612]} style={styles.page}>
                {/* Header Section */}
                <View style={{ marginBottom: 10 }}>
                    <View style={styles.headerRow}>
                        {/* School Logo */}
                        {schoolProfile.logo_url && (
                            <Image style={styles.logoLeft} src={schoolProfile.logo_url} />
                        )}
                        {!schoolProfile.logo_url && <View style={styles.logoLeft} />}

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>CLASS RECORD</Text>
                            <Text style={styles.headerSubtitle}>(Pursuant to DepEd Order 15 series of 2026)</Text>
                        </View>

                        {/* DepEd Logo */}
                        <Image style={styles.logoRight} src={`${import.meta.env.BASE_URL}deped_logo_right.png`} />
                    </View>

                    {/* Info Grid - Top Row */}
                    <View style={styles.infoGrid}>
                        <View style={[styles.infoBox, { flex: 1.2, borderLeftWidth: 0 }]}>
                            <Text style={styles.infoLabel}>REGION</Text>
                            <Text style={styles.infoValue}>{schoolProfile.region}</Text>
                        </View>
                        <View style={[styles.infoBox, { flex: 1.5 }]}>
                            <Text style={styles.infoLabel}>DIVISION</Text>
                            <Text style={styles.infoValue}>{schoolProfile.division}</Text>
                        </View>
                        <View style={[styles.infoBox, { flex: 1.5 }]}>
                            <Text style={styles.infoLabel}>DISTRICT</Text>
                            <Text style={styles.infoValue}>{schoolProfile.district}</Text>
                        </View>
                    </View>
                    {/* Info Grid - Bottom Row */}
                    <View style={[styles.infoGrid, { borderTopWidth: 0 }]}>
                        <View style={[styles.infoBox, { flex: 2, borderLeftWidth: 0 }]}>
                            <Text style={styles.infoLabel}>SCHOOL NAME</Text>
                            <Text style={styles.infoValue}>{schoolProfile.name}</Text>
                        </View>
                        <View style={[styles.infoBox, { flex: 0.9 }]}>
                            <Text style={styles.infoLabel}>SCHOOL ID</Text>
                            <Text style={styles.infoValue}>{schoolProfile.school_id}</Text>
                        </View>
                        <View style={[styles.infoBox, { flex: 0.9 }]}>
                            <Text style={styles.infoLabel}>SCHOOL YEAR</Text>
                            <Text style={styles.infoValue}>{activeSchoolYear}</Text>
                        </View>
                    </View>
                </View>

                {/* Quarter & Class Info Row */}
                <View style={styles.quarterRow}>
                    <View style={[styles.quarterCellFirst, { flex: 1, backgroundColor: '#ffff00' }]}>
                        <Text>{getQuarterName(quarter)}</Text>
                    </View>
                    <View style={[styles.quarterCell, { flex: 1.5 }]}>
                        <Text style={{ fontFamily: 'Helvetica-Bold' }}>GRADE & SECTION: {sectionGradeLevel} - {sectionName}</Text>
                    </View>
                    <View style={[styles.quarterCell, { flex: 1.5 }]}>
                        <Text style={{ fontFamily: 'Helvetica-Bold' }}>TEACHER: {teacherName}</Text>
                    </View>
                    <View style={[styles.quarterCell, { flex: 1 }]}>
                        <Text style={{ fontFamily: 'Helvetica-Bold' }}>SUBJECT: {subjectName}</Text>
                    </View>
                </View>

                {/* Main Table */}
                <View style={[styles.tableContainer, { borderTopWidth: 0 }]}>
                    {/* Header Row 1 */}
                    <View style={[styles.row, { backgroundColor: '#d1d5db', height: 25 }]}>
                        <View style={[styles.cell, styles.nameCell, { justifyContent: 'center' }]}><Text>LEARNERS' NAMES</Text></View>
                        <View style={[styles.cell, { flex: 13, backgroundColor: '#d1d5db' }]}>
                            <Text style={{ fontWeight: 'bold' }}>WRITTEN WORKS ({Math.round(currentWeights.written_works * 100)}%)</Text>
                            {/* Sub-Header Row - Level 2 */}
                            <View style={{ flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#000', marginTop: 2, backgroundColor: '#ffffff' }}>
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <View key={i} style={[styles.cell, { flex: 1, borderRightWidth: i === 9 ? 0 : 1 }]}><Text>{i + 1}</Text></View>
                                ))}
                                <View style={[styles.cell, { width: 25, borderRightWidth: 1, borderLeftWidth: 1, backgroundColor: '#d1d5db' }]}><Text>Total</Text></View>
                                <View style={[styles.cell, { flex: 1, borderRightWidth: 1, backgroundColor: '#d1d5db' }]}><Text>PS</Text></View>
                                <View style={[styles.cell, { flex: 1, backgroundColor: '#d1d5db' }]}><Text>WS</Text></View>
                            </View>
                        </View>
                        <View style={[styles.cell, { flex: 13, backgroundColor: '#d1d5db' }]}>
                            <Text style={{ fontWeight: 'bold' }}>PERFORMANCE TASKS ({Math.round(currentWeights.performance_tasks * 100)}%)</Text>
                            <View style={{ flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#000', marginTop: 2, backgroundColor: '#ffffff' }}>
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <View key={i} style={[styles.cell, { flex: 1, borderRightWidth: i === 9 ? 0 : 1 }]}><Text>{i + 1}</Text></View>
                                ))}
                                <View style={[styles.cell, { width: 25, borderRightWidth: 1, borderLeftWidth: 1, backgroundColor: '#d1d5db' }]}><Text>Total</Text></View>
                                <View style={[styles.cell, { flex: 1, borderRightWidth: 1, backgroundColor: '#d1d5db' }]}><Text>PS</Text></View>
                                <View style={[styles.cell, { flex: 1, backgroundColor: '#d1d5db' }]}><Text>WS</Text></View>
                            </View>
                        </View>
                        <View style={[styles.cell, { flex: 5, backgroundColor: '#d1d5db' }]}>
                            <Text style={{ fontWeight: 'bold', fontSize: 7 }}>TERM ASSESSMENT ({Math.round(currentWeights.quarterly_exam * 100)}%)</Text>
                            <View style={{ flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#000', marginTop: 2, backgroundColor: '#ffffff' }}>
                                <View style={[styles.cell, { flex: 1, borderRightWidth: 1 }]}><Text>1</Text></View>
                                <View style={[styles.cell, { flex: 1, borderRightWidth: 1, backgroundColor: '#d1d5db' }]}><Text>PS</Text></View>
                                <View style={[styles.cell, { flex: 1, backgroundColor: '#d1d5db' }]}><Text>WS</Text></View>
                            </View>
                        </View>
                        <View style={[styles.cell, styles.gradeCell, { backgroundColor: '#e0ffff' }]}><Text style={{ fontSize: 7 }}>INITIAL GRADE</Text></View>
                        <View style={[styles.cell, styles.remarksCell, { backgroundColor: '#90ee90' }]}><Text style={{ fontSize: 7 }}>TERM GRADE</Text></View>
                    </View>

                    {/* HPS Row - Web uses bg-blue-50 with gray summaries */}
                    <View style={[styles.row, { height: 16 }]}>
                        <View style={[styles.cell, styles.nameCell, { backgroundColor: '#e0ffff' }]}><Text>HIGHEST POSSIBLE SCORE</Text></View>
                        {hps.ww.map((val, i) => <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]} key={`hps-ww-${i}`}><Text>{val || ''}</Text></View>)}
                        <View style={[styles.cell, styles.totalCell, { backgroundColor: '#ffffff' }]}><Text>{hps.ww.some(v => String(v) !== '') ? hps.ww.reduce((a: number, b) => a + Number(b), 0) : ''}</Text></View>
                        <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]}><Text>100.00</Text></View>
                        <View style={[styles.cell, styles.scoreCell, { fontWeight: 'bold', backgroundColor: '#d1d5db' }]}><Text>{Math.round(currentWeights.written_works * 100)}%</Text></View>

                        {hps.pt.map((val, i) => <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]} key={`hps-pt-${i}`}><Text>{val || ''}</Text></View>)}
                        <View style={[styles.cell, styles.totalCell, { backgroundColor: '#ffffff' }]}><Text>{hps.pt.some(v => String(v) !== '') ? hps.pt.reduce((a: number, b) => a + Number(b), 0) : ''}</Text></View>
                        <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]}><Text>100.00</Text></View>
                        <View style={[styles.cell, styles.scoreCell, { fontWeight: 'bold', backgroundColor: '#d1d5db' }]}><Text>{Math.round(currentWeights.performance_tasks * 100)}%</Text></View>

                        <View style={[styles.cell, styles.scoreCell, { flex: 2, backgroundColor: '#ffffff' }]}><Text>{hps.qa || ''}</Text></View>
                        <View style={[styles.cell, styles.scoreCell, { backgroundColor: '#ffffff' }]}><Text>100.00</Text></View>
                        <View style={[styles.cell, styles.scoreCell, { fontWeight: 'bold', backgroundColor: '#d1d5db' }]}><Text>{Math.round(currentWeights.quarterly_exam * 100)}%</Text></View>

                        <View style={[styles.cell, styles.gradeCell, { backgroundColor: '#e0ffff' }]}></View>
                        <View style={[styles.cell, styles.remarksCell, { backgroundColor: '#90ee90' }]}></View>
                    </View>

                    {/* Male */}
                    <View style={[styles.sectionHeader, { backgroundColor: '#f3f4f6' }]}><Text>MALE</Text></View>
                    {maleStudents.map((s, i) => renderStudentRow(s, i))}

                    {/* Female */}
                    <View style={[styles.sectionHeader, { backgroundColor: '#f3f4f6' }]}><Text>FEMALE</Text></View>
                    {femaleStudents.map((s, i) => renderStudentRow(s, i))}
                </View>
            </Page>
        </Document>
    );
};
