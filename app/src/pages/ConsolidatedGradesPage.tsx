import { useState, useMemo } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { Printer, ArrowLeft } from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.registerHyphenationCallback(word => [word]);

// Styles for PDF
const styles = StyleSheet.create({
    page: { padding: 15, fontSize: 8, fontFamily: 'Helvetica', flexDirection: 'column' },
    headerContainer: { marginBottom: 10 },
    headerTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, textTransform: 'uppercase' },
    headerMetaContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: 9 },
    metaColumn: { width: '32%', flexDirection: 'column', gap: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    metaLabel: { width: '35%', fontWeight: 'bold', fontSize: 8, textAlign: 'right', paddingRight: 4 },
    metaValue: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', paddingLeft: 2, fontSize: 9, height: 12 },

    // Table Styles
    table: { width: '100%', borderWidth: 1, borderColor: '#000', marginTop: 5 },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', alignItems: 'center', height: 16 },
    headerRow: { height: 25, backgroundColor: '#f0f0f0' },
    subHeaderRow: { height: 14, backgroundColor: '#f0f0f0' },

    // Cells
    cell: { borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', justifyContent: 'center' },
    cellText: { fontSize: 6.5 },

    nameCell: { width: '15%', paddingLeft: 2, textAlign: 'left' },
    // subjectCol: { width: '10.2%' }, 
    genAvgCell: { width: '3.4%', fontWeight: 'bold', fontSize: 7, backgroundColor: '#f0f0f0' },
});

const ConsolidatedGradesDocument = ({
    schoolProfile,
    sy,
    section,
    gradeLevel,
    subjectsList,
    studentsList,
    gradesData
}: any) => {
    // Helper to render header row
    const renderMetadtaRow = (label: string, value: string) => (
        <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{label}</Text>
            <View style={styles.metaValue}><Text>{value}</Text></View>
        </View>
    );

    return (
        <Document>
            <Page size="LEGAL" orientation="landscape" style={styles.page}>
                {/* Custom DepEd Header Layout */}
                <View style={styles.headerContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <Image src={`${import.meta.env.BASE_URL}deped_logo_left.png`} style={{ width: 60, height: 60 }} />
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={styles.headerTitle}>FINAL GRADES AND GENERAL AVERAGE</Text>
                        </View>
                        <Image src={`${import.meta.env.BASE_URL}deped_logo_right.png`} style={{ width: 70, height: 70 }} />
                    </View>

                    {/* Metadata Grid (3 Columns) */}
                    <View style={styles.headerMetaContainer}>
                        {/* Col 1 */}
                        <View style={styles.metaColumn}>
                            {renderMetadtaRow("REGION", schoolProfile.region)}
                            {renderMetadtaRow("SCHOOL NAME", schoolProfile.name)}
                        </View>
                        {/* Col 2 */}
                        <View style={styles.metaColumn}>
                            {renderMetadtaRow("DIVISION", schoolProfile.division)}
                            {renderMetadtaRow("SCHOOL ID", schoolProfile.school_id)}
                        </View>
                        {/* Col 3 */}
                        <View style={styles.metaColumn}>
                            {renderMetadtaRow("SCHOOL YEAR", sy)}
                            {renderMetadtaRow("GRADE & SECTION", `${gradeLevel} - ${section}`)}
                        </View>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header Row 1: Subject Names */}
                    <View style={[styles.row, styles.headerRow, { height: 20 }]}>
                        <View style={[styles.cell, styles.nameCell, { height: '100%' }]}>
                            <Text style={[styles.cellText, { fontWeight: 'bold' }]}>NAMES OF LEARNERS</Text>
                        </View>
                        {subjectsList.map((subj: any) => (
                            <View key={subj.id} style={[styles.cell, { width: '10.2%', height: '100%', backgroundColor: '#fff' }]}>
                                <Text style={[styles.cellText, { fontWeight: 'bold', fontSize: 6 }]}>{subj.subject_name}</Text>
                            </View>
                        ))}
                        <View style={[styles.cell, styles.genAvgCell, { height: '100%' }]}>
                            <Text style={[styles.cellText, { fontSize: 5 }]}>GEN. AVG.</Text>
                        </View>
                    </View>

                    {/* Header Row 2: Q1-4 */}
                    <View style={[styles.row, styles.subHeaderRow]}>
                        <View style={[styles.cell, styles.nameCell]}><Text></Text></View>
                        {subjectsList.map((subj: any) => (
                            <View key={subj.id + '-sub'} style={{ width: '10.2%', flexDirection: 'row', height: '100%' }}>
                                <View style={[styles.cell, { width: '18%' }]}><Text style={{ fontSize: 5 }}>1</Text></View>
                                <View style={[styles.cell, { width: '18%' }]}><Text style={{ fontSize: 5 }}>2</Text></View>
                                <View style={[styles.cell, { width: '18%' }]}><Text style={{ fontSize: 5 }}>3</Text></View>
                                <View style={[styles.cell, { width: '18%' }]}><Text style={{ fontSize: 5 }}>4</Text></View>
                                <View style={[styles.cell, { width: '28%', backgroundColor: '#e6e6e6' }]}><Text style={{ fontSize: 5, fontWeight: 'bold' }}>FINAL</Text></View>
                            </View>
                        ))}
                        <View style={[styles.cell, styles.genAvgCell]}><Text></Text></View>
                    </View>

                    {/* Male Students */}
                    <View style={[styles.row, { backgroundColor: '#e5e7eb', height: 12 }]}>
                        <Text style={{ fontSize: 7, fontWeight: 'bold', paddingLeft: 5 }}>MALE</Text>
                    </View>
                    {studentsList.male.map((student: any, idx: number) => {
                        const data = gradesData[student.lrn] || {};
                        return (
                            <View key={student.lrn} style={styles.row}>
                                <View style={[styles.cell, styles.nameCell, { alignItems: 'flex-start' }]}>
                                    <Text style={styles.cellText}>{idx + 1}. {student.last_name}, {student.first_name}</Text>
                                </View>
                                {subjectsList.map((subj: any) => {
                                    const sData = data[subj.id] || {};
                                    return (
                                        <View key={subj.id} style={{ width: '10.2%', flexDirection: 'row', height: '100%' }}>
                                            <View style={[styles.cell, { width: '18%' }]}><Text style={styles.cellText}>{sData.q1 || ''}</Text></View>
                                            <View style={[styles.cell, { width: '18%' }]}><Text style={styles.cellText}>{sData.q2 || ''}</Text></View>
                                            <View style={[styles.cell, { width: '18%' }]}><Text style={styles.cellText}>{sData.q3 || ''}</Text></View>
                                            <View style={[styles.cell, { width: '18%' }]}><Text style={styles.cellText}>{sData.q4 || ''}</Text></View>
                                            <View style={[styles.cell, { width: '28%', backgroundColor: '#f3f4f6', fontWeight: 'bold' }]}><Text style={styles.cellText}>{sData.final || ''}</Text></View>
                                        </View>
                                    );
                                })}
                                <View style={[styles.cell, styles.genAvgCell]}>
                                    <Text style={styles.cellText}>{data.generalAverage || ''}</Text>
                                </View>
                            </View>
                        );
                    })}

                    {/* Female Students */}
                    <View style={[styles.row, { backgroundColor: '#e5e7eb', height: 12 }]}>
                        <Text style={{ fontSize: 7, fontWeight: 'bold', paddingLeft: 5 }}>FEMALE</Text>
                    </View>
                    {studentsList.female.map((student: any, idx: number) => {
                        const data = gradesData[student.lrn] || {};
                        return (
                            <View key={student.lrn} style={styles.row}>
                                <View style={[styles.cell, styles.nameCell, { alignItems: 'flex-start' }]}>
                                    <Text style={styles.cellText}>{idx + 1}. {student.last_name}, {student.first_name}</Text>
                                </View>
                                {subjectsList.map((subj: any) => {
                                    const sData = data[subj.id] || {};
                                    return (
                                        <View key={subj.id} style={{ width: '10.2%', flexDirection: 'row', height: '100%' }}>
                                            <View style={[styles.cell, { width: '18%' }]}><Text style={styles.cellText}>{sData.q1 || ''}</Text></View>
                                            <View style={[styles.cell, { width: '18%' }]}><Text style={styles.cellText}>{sData.q2 || ''}</Text></View>
                                            <View style={[styles.cell, { width: '18%' }]}><Text style={styles.cellText}>{sData.q3 || ''}</Text></View>
                                            <View style={[styles.cell, { width: '18%' }]}><Text style={styles.cellText}>{sData.q4 || ''}</Text></View>
                                            <View style={[styles.cell, { width: '20%', backgroundColor: '#f3f4f6' }]}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{sData.final || ''}</Text></View>
                                        </View>
                                    );
                                })}
                                <View style={[styles.cell, styles.genAvgCell]}>
                                    <Text style={styles.cellText}>{data.generalAverage || ''}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </Page>
        </Document>
    );
};


export function ConsolidatedGradesPage() {
    const {
        sections, subjects, students, classRecords,
        activeSchoolYear, schoolProfile, setCurrentView
    } = useAppStore();
    const { user } = useAuthStore();
    const isTeacher = user?.role === 'teacher';

    const [selectedSection, setSelectedSection] = useState('');

    // Derived State
    const sectionObj = useMemo(() => sections.find(s => s.section_name === selectedSection), [sections, selectedSection]);

    // Filter Sections for Select & Sort by Grade Level -> Name
    const availableSections = useMemo(() => {
        let filtered = sections;
        if (isTeacher) {
            filtered = sections.filter(sec => sec.adviser_id === user?.uid);
        }

        return filtered.sort((a, b) => {
            // Extract numeric grade level
            const getGrade = (g: string) => {
                const match = g.match(/\d+/);
                return match ? parseInt(match[0], 10) : 999;
            };
            const gradeA = getGrade(a.section_grade_level);
            const gradeB = getGrade(b.section_grade_level);

            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, isTeacher, user]);

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

        // Filter out strict MAPEH components from the main list if we are going to synthesize MAPEH
        // Grade 7-9: Music and Arts, Physical Education and Health
        // Grade 10: Music, Arts, Physical Education, Health
        const isMapehComponent = (name: string) => {
            const n = name.trim().toLowerCase();

            // Check for exact match or simple inclusion if reasonable, but avoid "Industrial Arts" or "Language Arts"
            // "Arts" is the dangerous one.
            if (n === 'arts') return true;
            if (n === 'music') return true;
            if (n === 'health') return true;
            if (n === 'physical education') return true;
            if (n === 'music and arts') return true;
            if (n === 'physical education and health') return true;

            // Allow "PE" abbreviation if it exists
            if (n === 'pe') return true;

            return false;
        };

        const rawSubjects = subjects.filter(s => s.section_id === sectionObj.id);

        // Check if we need to synthesize MAPEH
        const hasMapehSubject = rawSubjects.some(s => s.subject_name.toUpperCase() === 'MAPEH');
        const mapehComponents = rawSubjects.filter(s => isMapehComponent(s.subject_name) && s.subject_name.toUpperCase() !== 'MAPEH');

        let displaySubjects = rawSubjects.filter(s => !isMapehComponent(s.subject_name) && s.subject_name.toUpperCase() !== 'MAPEH');

        // Allow components to pass if they are not being aggregated (e.g. if we fail to find components but no consolidated MAPEH either?)
        // Actually, user wants "MAPEH". So we must have MAPEH.
        // If "MAPEH" exists as a real subject, use it.
        // If not, creates a virtual one IF components exist.

        let finalSubjects: any[] = [...displaySubjects];

        if (hasMapehSubject) {
            finalSubjects.push(rawSubjects.find(s => s.subject_name.toUpperCase() === 'MAPEH'));
        } else if (mapehComponents.length > 0) {
            // Create Virtual MAPEH Subject
            finalSubjects.push({
                id: 'virtual-mapeh',
                subject_name: 'MAPEH',
                section_id: sectionObj.id,
                // store components for grade calc
                _components: mapehComponents
            });
        }

        return finalSubjects.sort((a, b) => {
            const indexA = ORDER.findIndex(o => a.subject_name.trim().toLowerCase().includes(o.toLowerCase()));
            const indexB = ORDER.findIndex(o => b.subject_name.trim().toLowerCase().includes(o.toLowerCase()));

            // If both key subjects, sort by index
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If only A is key, A comes first
            if (indexA !== -1) return -1;
            // If only B is key, B comes first
            if (indexB !== -1) return 1;

            // Otherwise alpha sort
            return a.subject_name.localeCompare(b.subject_name);
        });
    }, [subjects, sectionObj]);

    // SECTION STUDENTS
    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        return students.filter(s => s.student_section === selectedSection);
    }, [students, selectedSection]);

    const maleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Male').sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);
    const femaleStudents = useMemo(() => sectionStudents.filter(s => s.gender === 'Female').sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);

    // GRADES COMPUTATION
    const gradesData = useMemo(() => {
        const data: Record<string, any> = {};

        sectionStudents.forEach(student => {
            const studentData: any = {};
            let totalFinal = 0;
            let subjectCount = 0;

            sectionSubjects.forEach(subject => {
                // If it's the Virtual MAPEH
                if (subject.id === 'virtual-mapeh' && subject._components) {
                    const qGrades: { [key: number]: number[] } = { 1: [], 2: [], 3: [], 4: [] };

                    // Calculate for each component
                    subject._components.forEach((comp: any) => {
                        for (let q = 1; q <= 4; q++) {
                            const r = classRecords.find(rec =>
                                rec.student_lrn === student.lrn &&
                                rec.subject_id === comp.id &&
                                rec.quarter === q
                            );
                            const hasScores = r && (
                                r.written_works.some(s => s > 0) ||
                                r.performance_tasks.some(s => s > 0) ||
                                r.quarterly_exam > 0
                            );

                            if (r && r.final_grade && hasScores) {
                                qGrades[q].push(r.final_grade);
                            }
                        }
                    });

                    const subjectGrades: any = {};
                    let virtualFinalTotal = 0;
                    let virtualQCount = 0;

                    // Compute aggregates per quarter
                    for (let q = 1; q <= 4; q++) {
                        const grades = qGrades[q];
                        if (grades.length > 0) {
                            // Average of available components
                            const qAvg = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
                            subjectGrades[`q${q}`] = qAvg;
                            virtualFinalTotal += qAvg;
                            virtualQCount++;
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
                    // Regular Subject Logic
                    const subjectGrades: any = {};
                    let subjectFinalTotal = 0;
                    let qCount = 0;

                    // For each quarter 1-4
                    for (let q = 1; q <= 4; q++) {
                        const record = classRecords.find(r =>
                            r.student_lrn === student.lrn &&
                            r.subject_id === subject.id &&
                            r.quarter === q
                        );

                        // Check if there are any actual scores
                        const hasScores = record && (
                            record.written_works.some(s => s > 0) ||
                            record.performance_tasks.some(s => s > 0) ||
                            record.quarterly_exam > 0
                        );

                        if (record && record.final_grade && hasScores) {
                            subjectGrades[`q${q}`] = record.final_grade;
                            subjectFinalTotal += record.final_grade;
                            qCount++;
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

            // General Average
            if (subjectCount > 0) {
                const genAvg = totalFinal / subjectCount;
                studentData.generalAverage = genAvg.toFixed(2);
            } else {
                studentData.generalAverage = '';
            }

            data[student.lrn] = studentData;
        });

        return data;
    }, [sectionStudents, sectionSubjects, classRecords]);


    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setCurrentView('reports')} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-deped-blue" />
                        </button>
                        <h2 className="text-xl md:text-2xl font-bold text-deped-blue whitespace-nowrap">Consolidated Grade Sheet</h2>
                    </div>

                    <div className="h-8 w-px bg-gray-200 hidden sm:block mx-2"></div>

                    <div className="relative w-full sm:w-72">
                        <select
                            className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2.5 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-deped-blue focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm hover:border-gray-300"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="">Select Section to View</option>
                            {availableSections.map(s => (
                                <option key={s.id} value={s.section_name}>
                                    {s.section_grade_level} - {s.section_name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {selectedSection && (
                        <button
                            onClick={() => window.print()}
                            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                        >
                            <Printer className="w-5 h-5" />
                            <span>Print</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 p-4 overflow-auto">
                {/* HTML Table Preview - Styled to match PDF */}
                {!selectedSection ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                        <div className="text-4xl">📊</div>
                        <p className="font-medium">Please select a section to view the grade sheet.</p>
                    </div>
                ) : (
                    <div className="min-w-[1000px] mx-auto bg-white p-4">
                        {/* Header Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Left" className="w-16 h-16 object-contain" />
                                <div className="text-center">
                                    <h1 className="text-xl font-bold uppercase text-black mb-1">Final Grades and General Average</h1>
                                    <div className="text-sm">Republic of the Philippines</div>
                                    <div className="text-sm font-bold">Department of Education</div>
                                </div>
                                <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd Right" className="w-20 h-20 object-contain" />
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">REGION:</span>
                                    <span className="border-b border-black flex-1 ml-2 px-2">{schoolProfile.region}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">DIVISION:</span>
                                    <span className="border-b border-black flex-1 ml-2 px-2">{schoolProfile.division}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">SCHOOL YEAR:</span>
                                    <span className="border-b border-black flex-1 ml-2 px-2">{activeSchoolYear}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-bold">SCHOOL NAME:</span>
                                    <span className="border-b border-black flex-1 ml-2 px-2">{schoolProfile.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">SCHOOL ID:</span>
                                    <span className="border-b border-black flex-1 ml-2 px-2">{schoolProfile.school_id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">GRADE & SECTION:</span>
                                    <span className="border-b border-black flex-1 ml-2 px-2">{sectionObj?.section_grade_level} - {selectedSection}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <table className="w-full border-collapse border border-black text-[10px]">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th rowSpan={2} className="border border-black p-2 font-bold text-center w-[15%]">NAMES OF LEARNERS</th>
                                    {sectionSubjects.map(sub => (
                                        <th key={sub.id} colSpan={5} className="border border-black p-1 text-center font-bold uppercase text-[9px] break-words leading-tight" title={sub.subject_name}>
                                            {sub.subject_name}
                                        </th>
                                    ))}
                                    <th rowSpan={2} className="border border-black p-1 text-center font-bold bg-gray-100 w-[4%]">GEN AVG</th>
                                </tr>
                                <tr className="bg-gray-100">
                                    {sectionSubjects.map(sub => (
                                        <>
                                            <th key={sub.id + 'q1'} className="border border-black p-0.5 text-center font-normal w-[2%]">1</th>
                                            <th key={sub.id + 'q2'} className="border border-black p-0.5 text-center font-normal w-[2%]">2</th>
                                            <th key={sub.id + 'q3'} className="border border-black p-0.5 text-center font-normal w-[2%]">3</th>
                                            <th key={sub.id + 'q4'} className="border border-black p-0.5 text-center font-normal w-[2%]">4</th>
                                            <th key={sub.id + 'fin'} className="border border-black p-0.5 text-center font-bold bg-gray-200 w-[3%]">Final</th>
                                        </>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-gray-200"><td colSpan={100} className="border border-black p-1 font-bold pl-2 text-xs">MALE</td></tr>
                                {maleStudents.map((student, idx) => {
                                    const data = gradesData[student.lrn] || {};
                                    return (
                                        <tr key={student.lrn} className="hover:bg-blue-50/20">
                                            <td className="border border-black p-1 pl-2 font-medium truncate whitespace-nowrap">{idx + 1}. {student.last_name}, {student.first_name}</td>
                                            {sectionSubjects.map(sub => {
                                                const sData = data[sub.id] || {};
                                                return (
                                                    <>
                                                        <td className="border border-black p-0.5 text-center">{sData.q1 || ''}</td>
                                                        <td className="border border-black p-0.5 text-center">{sData.q2 || ''}</td>
                                                        <td className="border border-black p-0.5 text-center">{sData.q3 || ''}</td>
                                                        <td className="border border-black p-0.5 text-center">{sData.q4 || ''}</td>
                                                        <td className="border border-black p-0.5 text-center font-bold bg-gray-50">{sData.final || ''}</td>
                                                    </>
                                                );
                                            })}
                                            <td className="border border-black p-1 text-center font-bold bg-gray-50">{data.generalAverage || ''}</td>
                                        </tr>
                                    );
                                })}

                                <tr className="bg-gray-200"><td colSpan={100} className="border border-black p-1 font-bold pl-2 text-xs">FEMALE</td></tr>
                                {femaleStudents.map((student, idx) => {
                                    const data = gradesData[student.lrn] || {};
                                    return (
                                        <tr key={student.lrn} className="hover:bg-blue-50/20">
                                            <td className="border border-black p-1 pl-2 font-medium truncate whitespace-nowrap">{idx + 1}. {student.last_name}, {student.first_name}</td>
                                            {sectionSubjects.map(sub => {
                                                const sData = data[sub.id] || {};
                                                return (
                                                    <>
                                                        <td className="border border-black p-0.5 text-center">{sData.q1 || ''}</td>
                                                        <td className="border border-black p-0.5 text-center">{sData.q2 || ''}</td>
                                                        <td className="border border-black p-0.5 text-center">{sData.q3 || ''}</td>
                                                        <td className="border border-black p-0.5 text-center">{sData.q4 || ''}</td>
                                                        <td className="border border-black p-0.5 text-center font-bold bg-gray-50">{sData.final || ''}</td>
                                                    </>
                                                );
                                            })}
                                            <td className="border border-black p-1 text-center font-bold bg-gray-50">{data.generalAverage || ''}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
