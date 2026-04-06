import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { useAppStore } from '../stores';
import type { Student } from '../types';

// SF10-JHS (Form 137) Styles - Landscape orientation
const styles = StyleSheet.create({
    page: {
        padding: 15,
        fontSize: 7,
        fontFamily: 'Helvetica',
    },
    // Header
    header: {
        textAlign: 'center',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    formNumber: {
        position: 'absolute',
        top: 15,
        left: 15,
        fontSize: 8,
        fontWeight: 'bold',
    },
    // Learner Information Section
    infoSection: {
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#000',
        padding: 5,
    },
    sectionTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        backgroundColor: '#d0d0d0',
        padding: 3,
        marginBottom: 5,
        textAlign: 'center',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    infoItem: {
        width: '25%',
        flexDirection: 'row',
        marginBottom: 3,
    },
    infoItemWide: {
        width: '50%',
        flexDirection: 'row',
        marginBottom: 3,
    },
    infoLabel: {
        fontWeight: 'bold',
        marginRight: 3,
    },
    infoValue: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        flex: 1,
        marginRight: 10,
    },
    // Eligibility Section
    eligibilitySection: {
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#000',
        padding: 5,
    },
    // Scholastic Record Section
    scholasticSection: {
        marginBottom: 8,
    },
    gradeYearHeader: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#e0e0e0',
    },
    gradeYearCell: {
        padding: 3,
        borderRightWidth: 1,
        borderRightColor: '#000',
        fontSize: 6,
    },
    // Grade Table
    gradeTable: {
        borderWidth: 1,
        borderColor: '#000',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    tableRowLast: {
        flexDirection: 'row',
    },
    subjectCell: {
        width: '20%',
        padding: 2,
        borderRightWidth: 1,
        borderRightColor: '#000',
        fontSize: 6,
    },
    quarterCell: {
        width: '5%',
        padding: 2,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        fontSize: 6,
    },
    finalGradeCell: {
        width: '6%',
        padding: 2,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        fontSize: 6,
        fontWeight: 'bold',
    },
    remarksCell: {
        width: '8%',
        padding: 2,
        textAlign: 'center',
        fontSize: 6,
    },
    headerCell: {
        backgroundColor: '#e0e0e0',
        fontWeight: 'bold',
    },
    // Remedial Section
    remedialSection: {
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#000',
        padding: 3,
    },
    remedialTitle: {
        fontSize: 7,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    remedialRow: {
        flexDirection: 'row',
        fontSize: 6,
    },
    // Certification Section
    certificationSection: {
        marginTop: 10,
        flexDirection: 'row',
    },
    certBlock: {
        width: '33%',
        textAlign: 'center',
        padding: 5,
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        marginTop: 25,
        marginHorizontal: 10,
    },
    signatureLabel: {
        fontSize: 6,
        marginTop: 2,
    },
});

// JHS Learning Areas for SF10
const SF10_LEARNING_AREAS = [
    'Filipino',
    'English',
    'Mathematics',
    'Science',
    'Araling Panlipunan (AP)',
    'Edukasyon sa Pagpapakatao (EsP)',
    'Technology and Livelihood Education (TLE)',
    'MAPEH',
    '  Music',
    '  Arts',
    '  Physical Education',
    '  Health',
];

interface SF10DocumentProps {
    student: Student;
    schoolName: string;
    schoolYear: string;
}

function SF10Document({ student, schoolName, schoolYear }: SF10DocumentProps) {
    // Demo grades for multiple years - in production from Firestore
    const gradeHistory: Record<string, Record<string, number[]>> = {
        'Grade 7': {
            'Filipino': [85, 86, 87, 88],
            'English': [82, 84, 85, 86],
            'Mathematics': [80, 81, 83, 85],
            'Science': [78, 80, 82, 84],
            'Araling Panlipunan (AP)': [83, 84, 85, 86],
            'Edukasyon sa Pagpapakatao (EsP)': [88, 89, 90, 91],
            'Technology and Livelihood Education (TLE)': [85, 86, 87, 88],
            'MAPEH': [86, 87, 88, 89],
            '  Music': [85, 86, 87, 88],
            '  Arts': [86, 87, 88, 89],
            '  Physical Education': [87, 88, 89, 90],
            '  Health': [86, 87, 88, 89],
        },
    };

    const calcFinal = (grades: number[]) => grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0;
    const getRemarks = (avg: number) => avg >= 75 ? 'Passed' : 'Failed';

    const renderGradeTable = (gradeLevel: string, schoolYearLabel: string) => {
        const grades = gradeHistory[gradeLevel] || {};
        const hasData = Object.keys(grades).length > 0;

        // Calculate general average
        const mainSubjects = SF10_LEARNING_AREAS.filter(s => !s.startsWith('  '));
        const generalAvg = hasData ? Math.round(
            mainSubjects.reduce((sum, subj) => {
                const subjectGrades = grades[subj] || [0, 0, 0, 0];
                return sum + calcFinal(subjectGrades);
            }, 0) / mainSubjects.length
        ) : 0;

        return (
            <View style={styles.scholasticSection}>
                {/* School/Year Header */}
                <View style={styles.gradeYearHeader}>
                    <View style={[styles.gradeYearCell, { width: '25%' }]}>
                        <Text style={{ fontWeight: 'bold' }}>School: {schoolName}</Text>
                    </View>
                    <View style={[styles.gradeYearCell, { width: '15%' }]}>
                        <Text>School ID: 123456</Text>
                    </View>
                    <View style={[styles.gradeYearCell, { width: '10%' }]}>
                        <Text>District: I</Text>
                    </View>
                    <View style={[styles.gradeYearCell, { width: '15%' }]}>
                        <Text style={{ fontWeight: 'bold' }}>Grade: {gradeLevel}</Text>
                    </View>
                    <View style={[styles.gradeYearCell, { width: '15%' }]}>
                        <Text>Section: Einstein</Text>
                    </View>
                    <View style={[styles.gradeYearCell, { width: '10%', borderRightWidth: 0 }]}>
                        <Text>SY: {schoolYearLabel}</Text>
                    </View>
                </View>

                {/* Grade Table */}
                <View style={styles.gradeTable}>
                    {/* Header Row */}
                    <View style={[styles.tableRow, styles.headerCell]}>
                        <View style={[styles.subjectCell, styles.headerCell]}><Text>Learning Areas</Text></View>
                        <View style={[styles.quarterCell, styles.headerCell]}><Text>1</Text></View>
                        <View style={[styles.quarterCell, styles.headerCell]}><Text>2</Text></View>
                        <View style={[styles.quarterCell, styles.headerCell]}><Text>3</Text></View>
                        <View style={[styles.quarterCell, styles.headerCell]}><Text>4</Text></View>
                        <View style={[styles.finalGradeCell, styles.headerCell]}><Text>Final</Text></View>
                        <View style={[styles.remarksCell, styles.headerCell]}><Text>Remarks</Text></View>
                    </View>

                    {/* Subject Rows */}
                    {SF10_LEARNING_AREAS.map((subject, idx) => {
                        const subjectGrades = grades[subject] || [];
                        const final = calcFinal(subjectGrades);
                        const isLast = idx === SF10_LEARNING_AREAS.length - 1;
                        const isSubRow = subject.startsWith('  ');

                        return (
                            <View key={subject} style={isLast ? styles.tableRowLast : styles.tableRow}>
                                <View style={styles.subjectCell}>
                                    <Text style={isSubRow ? { fontSize: 5 } : {}}>{subject}</Text>
                                </View>
                                <View style={styles.quarterCell}><Text>{subjectGrades[0] || '-'}</Text></View>
                                <View style={styles.quarterCell}><Text>{subjectGrades[1] || '-'}</Text></View>
                                <View style={styles.quarterCell}><Text>{subjectGrades[2] || '-'}</Text></View>
                                <View style={styles.quarterCell}><Text>{subjectGrades[3] || '-'}</Text></View>
                                <View style={styles.finalGradeCell}><Text>{final || '-'}</Text></View>
                                <View style={styles.remarksCell}>
                                    <Text style={{ color: final >= 75 ? 'green' : 'red' }}>{final ? getRemarks(final) : '-'}</Text>
                                </View>
                            </View>
                        );
                    })}

                    {/* General Average Row */}
                    <View style={[styles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                        <View style={styles.subjectCell}><Text style={{ fontWeight: 'bold' }}>General Average</Text></View>
                        <View style={styles.quarterCell}><Text></Text></View>
                        <View style={styles.quarterCell}><Text></Text></View>
                        <View style={styles.quarterCell}><Text></Text></View>
                        <View style={styles.quarterCell}><Text></Text></View>
                        <View style={styles.finalGradeCell}><Text style={{ fontWeight: 'bold' }}>{generalAvg || '-'}</Text></View>
                        <View style={styles.remarksCell}>
                            <Text style={{ fontWeight: 'bold', color: generalAvg >= 75 ? 'green' : 'red' }}>
                                {generalAvg ? getRemarks(generalAvg) : '-'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Remedial Classes */}
                <View style={styles.remedialSection}>
                    <Text style={styles.remedialTitle}>Remedial Classes</Text>
                    <View style={styles.remedialRow}>
                        <Text style={{ width: '30%' }}>Learning Areas: _____________</Text>
                        <Text style={{ width: '20%' }}>Final Rating: _____</Text>
                        <Text style={{ width: '25%' }}>Remedial Class Mark: _____</Text>
                        <Text style={{ width: '25%' }}>Recomputed Final Grade: _____</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Document>
            <Page size="LETTER" orientation="landscape" style={styles.page}>
                {/* Form Number */}
                <Text style={styles.formNumber}>SF10-JHS</Text>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={{ fontSize: 9 }}>Republic of the Philippines</Text>
                    <Text style={styles.headerTitle}>DEPARTMENT OF EDUCATION</Text>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 3 }}>Learner Permanent Academic Record for Junior High School (SF10-JHS)</Text>
                    <Text style={{ fontSize: 7 }}>(Formerly Form 137)</Text>
                </View>

                {/* Learner Information */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>LEARNER'S INFORMATION</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItemWide}>
                            <Text style={styles.infoLabel}>LAST NAME:</Text>
                            <Text style={styles.infoValue}>{student.last_name}</Text>
                        </View>
                        <View style={styles.infoItemWide}>
                            <Text style={styles.infoLabel}>FIRST NAME:</Text>
                            <Text style={styles.infoValue}>{student.first_name}</Text>
                        </View>
                        <View style={styles.infoItemWide}>
                            <Text style={styles.infoLabel}>MIDDLE NAME:</Text>
                            <Text style={styles.infoValue}>{student.middle_name || ''}</Text>
                        </View>
                        <View style={styles.infoItemWide}>
                            <Text style={styles.infoLabel}>EXTENSION (JR, II, III):</Text>
                            <Text style={styles.infoValue}></Text>
                        </View>
                        <View style={styles.infoItemWide}>
                            <Text style={styles.infoLabel}>Learner Reference No. (LRN):</Text>
                            <Text style={styles.infoValue}>{student.lrn}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Birthdate:</Text>
                            <Text style={styles.infoValue}>{student.birthday}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Sex:</Text>
                            <Text style={styles.infoValue}>{student.gender}</Text>
                        </View>
                    </View>
                </View>

                {/* Eligibility for JHS */}
                <View style={styles.eligibilitySection}>
                    <Text style={styles.sectionTitle}>ELIGIBILITY FOR JHS ENROLLMENT</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItemWide}>
                            <Text style={styles.infoLabel}>Elementary School Completer:</Text>
                            <Text style={styles.infoValue}></Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>General Average:</Text>
                            <Text style={styles.infoValue}></Text>
                        </View>
                        <View style={styles.infoItemWide}>
                            <Text style={styles.infoLabel}>Name of Elementary School:</Text>
                            <Text style={styles.infoValue}></Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>School ID:</Text>
                            <Text style={styles.infoValue}></Text>
                        </View>
                        <View style={styles.infoItemWide}>
                            <Text style={styles.infoLabel}>Address of School:</Text>
                            <Text style={styles.infoValue}></Text>
                        </View>
                    </View>
                </View>

                {/* Scholastic Record */}
                <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 3 }}>SCHOLASTIC RECORD</Text>

                {/* Grade 7 */}
                {renderGradeTable('Grade 7', '2022-2023')}

                {/* Grade 8 */}
                {renderGradeTable('Grade 8', '2023-2024')}
            </Page>

            {/* Page 2: Grades 9-10 */}
            <Page size="LETTER" orientation="landscape" style={styles.page}>
                <Text style={styles.formNumber}>SF10-JHS (Back)</Text>

                {/* Grade 9 */}
                {renderGradeTable('Grade 9', '2024-2025')}

                {/* Grade 10 */}
                {renderGradeTable('Grade 10', '2025-2026')}

                {/* Certification */}
                <View style={styles.certificationSection}>
                    <View style={styles.certBlock}>
                        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>Prepared by:</Text>
                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureLabel}>Class Adviser</Text>
                    </View>
                    <View style={styles.certBlock}>
                        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>Certified True and Correct:</Text>
                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureLabel}>School Head</Text>
                    </View>
                    <View style={styles.certBlock}>
                        <Text style={{ fontSize: 6 }}>Date Issued: ______________</Text>
                        <Text style={{ fontSize: 6, marginTop: 5 }}>Official School Stamp:</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

export function SF10Page() {
    const { students, sections, schoolProfile, activeSchoolYear } = useAppStore();
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const sectionStudents = selectedSection
        ? students.filter((s) => s.student_section === selectedSection)
        : [];

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Filter by Section</label>
                        <select
                            value={selectedSection}
                            onChange={(e) => {
                                setSelectedSection(e.target.value);
                                setSelectedStudent(null);
                            }}
                            className="form-input"
                        >
                            <option value="">Select Section</option>
                            {sections.map((s) => (
                                <option key={s.id} value={s.section_name}>
                                    {s.section_grade_level} - {s.section_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-deped-blue">Select Student</label>
                        <select
                            value={selectedStudent?.lrn || ''}
                            onChange={(e) => {
                                const student = sectionStudents.find((s) => s.lrn === e.target.value);
                                setSelectedStudent(student || null);
                            }}
                            className="form-input"
                            disabled={!selectedSection}
                        >
                            <option value="">Select Student</option>
                            {sectionStudents.map((s) => (
                                <option key={s.lrn} value={s.lrn}>
                                    {s.last_name}, {s.first_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        {selectedStudent && (
                            <PDFDownloadLink
                                document={
                                    <SF10Document
                                        student={selectedStudent}
                                        schoolName={schoolProfile.name}
                                        schoolYear={activeSchoolYear}
                                    />
                                }
                                fileName={`SF10_${selectedStudent.last_name}_${selectedStudent.first_name}.pdf`}
                                className="btn-primary w-full text-center"
                            >
                                {({ loading }) => (loading ? 'Generating...' : '📄 Download PDF')}
                            </PDFDownloadLink>
                        )}
                    </div>
                </div>
            </div>

            {/* PDF Preview */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-deped-blue text-white">
                    <h3 className="text-lg font-bold">SF10 Permanent Record Preview (Form 137)</h3>
                </div>

                {!selectedStudent ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-2">📜</div>
                        <p>Select a section and student to preview SF10</p>
                    </div>
                ) : (
                    <div style={{ height: '600px' }}>
                        <PDFViewer width="100%" height="100%">
                            <SF10Document
                                student={selectedStudent}
                                schoolName={schoolProfile.name}
                                schoolYear={activeSchoolYear}
                            />
                        </PDFViewer>
                    </div>
                )}
            </div>
        </div>
    );
}
