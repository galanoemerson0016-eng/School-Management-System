import React from 'react';
import { Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register hyphenation if needed
Font.registerHyphenationCallback(word => [word]);

const base = import.meta.env.BASE_URL || '/';
const fontPath = `${base.endsWith('/') ? base : base + '/'}fonts`;

try {
    Font.register({
        family: 'BookmanOldStyle',
        fonts: [
            { src: `${fontPath}/BOOKOS.TTF` },
            { src: `${fontPath}/BOOKOSB.TTF`, fontWeight: 'bold' },
            { src: `${fontPath}/BOOKOSI.TTF`, fontStyle: 'italic' },
            { src: `${fontPath}/BOOKOSBI.TTF`, fontWeight: 'bold', fontStyle: 'italic' }
        ]
    });
    Font.register({ family: 'BookmanOldStyle-Bold', src: `${fontPath}/BOOKOSB.TTF` });
    Font.register({ family: 'BookmanOldStyle-Italic', src: `${fontPath}/BOOKOSI.TTF` });
    Font.register({ family: 'BookmanOldStyle-BoldItalic', src: `${fontPath}/BOOKOSBI.TTF` });
} catch (e) {
    console.error('Failed to register Bookman Old Style fonts:', e);
}

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
    
    // PAGE 2 STYLES
    page2Container: { flexDirection: 'row', height: '100%' },
    page2Left: { width: '50%', paddingRight: 10 },
    page2Right: { width: '50%', paddingLeft: 10 },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderBottomWidth: 1, borderBottomColor: '#000', fontWeight: 'bold' },
    tableHeaderCell: { padding: 4, fontSize: 9, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', justifyContent: 'center' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    tableCellSubj: { width: '40%', padding: 4, fontSize: 9, borderRightWidth: 1, borderRightColor: '#000' },
    tableCellQ: { width: '10%', padding: 4, fontSize: 9, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    tableCellFinal: { width: '15%', padding: 4, fontSize: 9, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', fontWeight: 'bold' },
    tableCellRemarks: { width: '15%', padding: 4, fontSize: 7, textAlign: 'center', justifyContent: 'center' },
    
    // Values Section
    valuesTable: { borderWidth: 1, borderColor: '#000', marginTop: 5 },
    valuesHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#f1f5f9' },
    valuesHeaderCore: { width: '20%', padding: 4, fontSize: 9, fontWeight: 'bold', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
    valuesHeaderBehavior: { width: '35%', padding: 4, fontSize: 9, fontWeight: 'bold', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
    valuesHeaderQ: { width: '15%', padding: 4, fontSize: 8, fontWeight: 'bold', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
    valuesCoreCell: { width: '20%', padding: 4, fontSize: 8, fontWeight: 'bold', borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' },
    valuesBehaviorCell: { width: '35%', padding: 4, fontSize: 8, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' },
    valuesRatingCell: { width: '15%', padding: 4, fontSize: 9, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' },
    
    semesterTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginTop: 10, marginBottom: 5, backgroundColor: '#e2e8f0', padding: 2, borderWidth: 1 },
});

const CORE_VALUES = [
    { name: 'Maka-Diyos', behaviors: ['Expresses one\'s spiritual beliefs while respecting the spiritual beliefs of others', 'Shows adherence to ethical principles by upholding truth'] },
    { name: 'Makatao', behaviors: ['Is sensitive to individual, social, and cultural differences', 'Demonstrates contributions toward solidarity'] },
    { name: 'Makakalikasan', behaviors: ['Cares for the environment and utilizes resources wisely, judiciously, and economically'] },
    { name: 'Makabansa', behaviors: ['Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen', 'Demonstrates appropriate behavior in carrying out activities in the school, community, and country'] }
];

export interface SHSSubjectGrade {
    subjectName: string;
    term?: 1 | 2 | 3 | 'all';
    grades: {
        t1: number;
        t2: number;
        t3: number;
        final: number;
    };
}

export interface SHSSf9Data {
    student: {
        fullName: string;
        age: string | number;
        gender: string;
        track: string;
        strand: string;
        lrn: string;
    };
    schoolProfile: {
        region: string;
        division: string;
        name: string;
        section: string;
        schoolYear: string;
        adviser?: string;
        principal?: string;
    };
    subjectGrades: SHSSubjectGrade[];
}

export interface SF9SHSPagesProps {
    data: SHSSf9Data; // Result from shsSf9Mapper
    observedValues: Record<string, string[]>;
    attendance: {
        months: string[];
        schoolDays: number[];
        daysPresent: number[];
        daysAbsent: number[];
    };
    pageSize: 'A4' | 'LETTER';
    logoUrl: string;
    printMode?: string;
}

export const SF9SHSPages: React.FC<SF9SHSPagesProps> = ({
    data,
    observedValues,
    attendance,
    pageSize,
    logoUrl,
}) => {
    const { student, schoolProfile, subjectGrades } = data;

    const getShsCategoryForSubject = (subjectName: string, gradeNum: number): string => {
        const normalized = subjectName.trim();
        
        if (gradeNum === 11) {
            // Core Subject (All Tracks)
            const cores = [
                'Effective Communication',
                'Mabisang Komunikasyon',
                'General Mathematics',
                'General Science',
                'Life and Career Skills',
                'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
            ];
            if (cores.some(c => normalized.toLowerCase().includes(c.toLowerCase()))) {
                return 'Core Subject (All Tracks)';
            }
            
            // Academic Elective (Field Experience/ Exposure, and Sports and Arts)
            if (normalized.toLowerCase().startsWith('field exposure')) {
                return 'Academic Elective (Field Experience/ Exposure, and Sports and Arts)';
            }
            
            // TechPro Elective (All Other Elective)
            const techPros = [
                'Aesthethic Services', 'Barbering Services', 'Caregiving', 'Hairdressing', 'Wellness Services',
                'Agricultural Crops', 'Agro-entrepreneurship', 'Aquaculture', 'Fish Capture', 'Food Processing',
                'Organic Agriculture', 'Poultry Production', 'Ruminants Production', 'Swine Production', 'Garments Artisanry',
                'Handicrafts', 'Automotive Servicing', 'Driving and Automotive', 'Motorcycle', 'Carpentry',
                'Construction Operation', 'Manual Metal Arc Welding', 'Technical Drafting', 'Animation', 'Illustration',
                'Visual Graphics Design', 'Bakery Operation', 'Events Management', 'Food and Beverage', 'Hotel Operation',
                'Kitchen Operations', 'Tourism Services', 'Commercial Air-Conditioning', 'Domestic Refrigeration',
                'Electrical Installation', 'Electronics Product', 'Mechatronics', 'Photovoltaic Systems', 'Broadband Installation',
                'Computer Programming', 'Computer Systems Servicing', 'Contact Center Services', 'Marine Engineering',
                'Marine Transportation', 'Ships Catering Services'
            ];
            if (techPros.some(tp => normalized.toLowerCase().includes(tp.toLowerCase()))) {
                return 'TechPro Elective (All Other Elective)';
            }
            
            // Academic Elective (All Other Electives)
            return 'Academic Elective (All Other Electives)';
        }
        
        if (gradeNum === 12) {
            const norm = normalized.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            
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
            if (cores.some(c => {
                const cNorm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
                return norm === cNorm || norm.includes(cNorm) || cNorm.includes(norm);
            })) {
                return 'Core Subjects';
            }

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
            if (applied.some(a => {
                const aNorm = a.toLowerCase().replace(/[^a-z0-9]/g, '');
                return norm === aNorm || norm.includes(aNorm) || aNorm.includes(norm);
            })) {
                return 'Applied Subjects';
            }

            // 3. Specialized Subjects
            return 'Specialized Subjects';
        }
        
        return 'Academic Elective (All Other Electives)';
    };

    const renderScholasticRecord = (title: string, subjects: SHSSubjectGrade[]) => {
        let sum = 0;
        let count = 0;
        subjects.forEach((s) => {
            const final = s.grades.final;
            if (final > 0) {
                sum += final;
                count++;
            }
        });
        const genAve = count > 0 ? (sum / count).toFixed(2) : '';

        const gradeNum = parseInt(schoolProfile.section.match(/\d+/)?.[0] || '11') || 11;

        // Group subjects by category
        const groups: Record<string, SHSSubjectGrade[]> = {};
        subjects.forEach(subj => {
            const cat = getShsCategoryForSubject(subj.subjectName, gradeNum);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(subj);
        });

        const categoryOrder = gradeNum === 11 ? [
            'Core Subject (All Tracks)',
            'Academic Elective (All Other Electives)',
            'Academic Elective (Field Experience/ Exposure, and Sports and Arts)',
            'TechPro Elective (All Other Elective)'
        ] : [
            'Core Subjects',
            'Applied Subjects',
            'Specialized Subjects'
        ];

        return (
            <View>
                <Text style={styles.semesterTitle}>{title}</Text>
                <View style={{ borderWidth: 1, borderColor: '#000' }}>
                    <View style={styles.tableHeaderRow}>
                        <View style={[styles.tableHeaderCell, { width: '40%' }]}><Text>Learning Areas</Text></View>
                        <View style={[styles.tableHeaderCell, { width: '10%' }]}><Text>1</Text></View>
                        <View style={[styles.tableHeaderCell, { width: '10%' }]}><Text>2</Text></View>
                        <View style={[styles.tableHeaderCell, { width: '10%' }]}><Text>3</Text></View>
                        <View style={[styles.tableHeaderCell, { width: '15%' }]}><Text>Final</Text></View>
                        <View style={[styles.tableHeaderCell, { width: '15%', borderRightWidth: 0 }]}><Text>Remarks</Text></View>
                    </View>
                    {subjects.length > 0 ? (
                        categoryOrder.map((categoryName) => {
                            const catSubjects = groups[categoryName] || [];
                            if (catSubjects.length === 0) return null;

                            return (
                                <React.Fragment key={categoryName}>
                                    {/* Category Header Row */}
                                    <View style={[styles.tableRow, { backgroundColor: '#f1f5f9' }]}>
                                        <View style={{ width: '100%', padding: 4 }}>
                                            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1e293b' }}>
                                                {categoryName.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                     {/* Subjects in Category */}
                                     {catSubjects.map((subj, idx) => {
                                         const term = subj.term;
                                         const grades = subj.grades;
                                         const remarks = grades.final >= 75 ? 'PASSED' : grades.final > 0 ? 'FAILED' : '';
                                         
                                         const isTermActive = (t: number) => {
                                             if (!term || term === 'all') return true;
                                             return Number(term) === t;
                                         };

                                         return (
                                             <View key={idx} style={styles.tableRow}>
                                                 <View style={styles.tableCellSubj}><Text>{subj.subjectName}</Text></View>
                                                 <View style={styles.tableCellQ}><Text>{isTermActive(1) ? (grades.t1 || '') : '-'}</Text></View>
                                                 <View style={styles.tableCellQ}><Text>{isTermActive(2) ? (grades.t2 || '') : '-'}</Text></View>
                                                 <View style={styles.tableCellQ}><Text>{isTermActive(3) ? (grades.t3 || '') : '-'}</Text></View>
                                                 <View style={styles.tableCellFinal}><Text>{grades.final || ''}</Text></View>
                                                 <View style={[styles.tableCellRemarks, { borderRightWidth: 0 }]}><Text>{remarks}</Text></View>
                                             </View>
                                         );
                                    })}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <View style={styles.tableRow}>
                            <View style={[styles.tableCellSubj, { width: '100%', borderRightWidth: 0, padding: 10, textAlign: 'center' }]}><Text>No subjects recorded.</Text></View>
                        </View>
                    )}
                    <View style={[styles.tableRow, { backgroundColor: '#f8fafc', fontWeight: 'bold' }]}>
                        <View style={[styles.tableCellSubj, { width: '70%', textAlign: 'right', paddingRight: 10 }]}><Text>General Average</Text></View>
                        <View style={styles.tableCellFinal}><Text>{genAve}</Text></View>
                        <View style={[styles.tableCellRemarks, { borderRightWidth: 0 }]}><Text>{genAve ? (Number(genAve) >= 75 ? 'PASSED' : 'FAILED') : ''}</Text></View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <>
            <Page size={pageSize} orientation="landscape" style={styles.page}>
                {/* FRONT PAGE */}
                <View style={styles.page1Container}>
                    {/* Left Column - Attendance */}
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
                                <View style={styles.attLabelCell}><Text>No. of school days</Text></View>
                                {attendance.schoolDays.map((days, idx) => (
                                    <View key={idx} style={idx === attendance.schoolDays.length - 1 ? styles.attDataCellLast : styles.attDataCell}>
                                        <Text>{days >= 0 ? days : ''}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.attRow}>
                                <View style={styles.attLabelCell}><Text>No. of days present</Text></View>
                                {attendance.daysPresent.map((days, idx) => (
                                    <View key={idx} style={idx === attendance.daysPresent.length - 1 ? styles.attDataCellLast : styles.attDataCell}>
                                        <Text>{days >= 0 ? days : ''}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.attRowLast}>
                                <View style={styles.attLabelCell}><Text>No. of days absent</Text></View>
                                {attendance.daysAbsent.map((days, idx) => (
                                    <View key={idx} style={idx === attendance.daysAbsent.length - 1 ? [styles.attDataCellLast, { borderRightWidth: 0 }] : styles.attDataCell}>
                                        <Text>{days >= 0 ? days : ''}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.parentSection}>
                            <Text style={styles.parentTitle}>PARENT/GUARDIAN'S SIGNATURE</Text>
                            <View style={styles.signatureRow}>
                                <Text style={styles.quarterLabel}>1st Quarter</Text>
                                <View style={styles.signatureLine}></View>
                            </View>
                            <View style={styles.signatureRow}>
                                <Text style={styles.quarterLabel}>2nd Quarter</Text>
                                <View style={styles.signatureLine}></View>
                            </View>
                            <View style={styles.signatureRow}>
                                <Text style={styles.quarterLabel}>3rd Quarter</Text>
                                <View style={styles.signatureLine}></View>
                            </View>
                            <View style={styles.signatureRow}>
                                <Text style={styles.quarterLabel}>4th Quarter</Text>
                                <View style={styles.signatureLine}></View>
                            </View>
                        </View>
                    </View>

                    {/* Right Column - Learner Profile */}
                    <View style={styles.rightColumn}>
                        <Text style={styles.sf9Label}>SF9-SHS</Text>
                        <View style={styles.headerContainer}>
                            <Image src={logoLeftUrl || logoUrl} style={styles.logo} />
                            <View style={styles.headerCenter}>
                                <Text style={styles.headerText}>Republic of the Philippines</Text>
                                <Text style={styles.headerText}>Department of Education</Text>
                                <Text style={styles.headerText}>{schoolProfile.region}</Text>
                                <Text style={styles.headerText}>{schoolProfile.division}</Text>
                                <Text style={styles.schoolName}>{schoolProfile.name}</Text>
                            </View>
                            <Image src={logoRightUrl || logoUrl} style={styles.logo} />
                        </View>

                        <Text style={styles.reportTitle}>SENIOR HIGH SCHOOL PROGRESS REPORT</Text>

                        <View style={styles.studentInfoGrid}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Name:</Text>
                                <Text style={styles.infoValue}>{student.fullName}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Age:</Text>
                                <Text style={styles.infoValueShort}>{student.age}</Text>
                                <Text style={styles.infoLabelRight}>Sex:</Text>
                                <Text style={styles.infoValueShort}>{student.gender}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Grade:</Text>
                                <Text style={styles.infoValueShort}>{schoolProfile.section.match(/\d+/) || '11'}</Text>
                                <Text style={styles.infoLabelRight}>Section:</Text>
                                <Text style={styles.infoValueShort}>{schoolProfile.section}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Track/Strand:</Text>
                                <Text style={styles.infoValue}>{`${student.track} ${student.strand ? `- ${student.strand}` : ''}`}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>School Year:</Text>
                                <Text style={styles.infoValue}>{schoolProfile.schoolYear}</Text>
                                <Text style={styles.infoLabelRight}>LRN:</Text>
                                <Text style={styles.infoValueShort}>{student.lrn}</Text>
                            </View>
                        </View>

                        <Text style={styles.dearParents}>Dear Parent:</Text>
                        <Text style={styles.messageText}>
                            This report card shows the ability and progress your child has made in the different learning areas as well as his/her core values.
                        </Text>
                        <Text style={styles.messageText}>
                            The school welcomes you should you desire to know more about your child's progress.
                        </Text>

                        <View style={styles.signatureLineBottom}>
                            <View style={styles.signatureBlock}>
                                <Text style={styles.signatureName}>{schoolProfile.adviser || ''}</Text>
                                <Text style={styles.signatureTitle}>Teacher</Text>
                            </View>
                            <View style={styles.signatureBlock}>
                                <Text style={styles.signatureName}>{schoolProfile.principal || ''}</Text>
                                <Text style={styles.signatureTitle}>Principal</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
            
            {/* BACK PAGE */}
            <Page size={pageSize} orientation="landscape" style={styles.page}>
                <View style={styles.page2Container}>
                    {/* Left Column - Scholastic Record */}
                    <View style={styles.page2Left}>
                        <Text style={styles.reportTitle}>REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</Text>
                        {renderScholasticRecord('SCHOLASTIC RECORD', subjectGrades)}
                    </View>
                    
                    {/* Right Column - Core Values */}
                    <View style={styles.page2Right}>
                        <Text style={styles.reportTitle}>REPORT ON LEARNER'S OBSERVED VALUES</Text>
                        
                        <View style={styles.valuesTable}>
                            <View style={styles.valuesHeaderRow}>
                                <View style={styles.valuesHeaderCore}><Text>Core Values</Text></View>
                                <View style={styles.valuesHeaderBehavior}><Text>Behavior Statements</Text></View>
                                <View style={styles.valuesHeaderQ}><Text>1</Text></View>
                                <View style={styles.valuesHeaderQ}><Text>2</Text></View>
                                <View style={[styles.valuesHeaderQ, { borderRightWidth: 0 }]}><Text>3</Text></View>
                            </View>

                            {CORE_VALUES.map((cv, cvIdx) => (
                                <React.Fragment key={cvIdx}>
                                    {cv.behaviors.map((behavior, bIdx) => {
                                        const key = `${cv.name}_${bIdx}`;
                                        const rowVals = observedValues[key] || ['', '', ''];
                                        return (
                                            <View key={bIdx} style={styles.tableRow}>
                                                {bIdx === 0 && (
                                                    <View style={[styles.valuesCoreCell, { borderBottomWidth: 0 }]} wrap={false}>
                                                        <Text>{cv.name}</Text>
                                                    </View>
                                                )}
                                                {bIdx > 0 && (
                                                    <View style={[styles.valuesCoreCell, { borderBottomWidth: 0 }]}><Text> </Text></View>
                                                )}
                                                <View style={styles.valuesBehaviorCell}><Text>{behavior}</Text></View>
                                                <View style={styles.valuesRatingCell}><Text>{rowVals[0]}</Text></View>
                                                <View style={styles.valuesRatingCell}><Text>{rowVals[1]}</Text></View>
                                                <View style={[styles.valuesRatingCell, { borderRightWidth: 0 }]}><Text>{rowVals[2]}</Text></View>
                                            </View>
                                        );
                                    })}
                                    {/* Add bottom border for core value group */}
                                    <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', marginTop: -1 }}></View>
                                </React.Fragment>
                            ))}
                        </View>
                        
                        <View style={{ marginTop: 20 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>Observed Values Marking System:</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', fontSize: 9 }}>
                                <Text style={{ width: '50%', marginBottom: 3 }}>AO - Always Observed</Text>
                                <Text style={{ width: '50%', marginBottom: 3 }}>SO - Sometimes Observed</Text>
                                <Text style={{ width: '50%' }}>RO - Rarely Observed</Text>
                                <Text style={{ width: '50%' }}>NO - Not Observed</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </>
    );
};

// Use dummy logo if no URL is provided to prevent crashes
const logoLeftUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/84/Department_of_Education_%28DepEd%29.svg';
const logoRightUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/84/Department_of_Education_%28DepEd%29.svg';

export default SF9SHSPages;

