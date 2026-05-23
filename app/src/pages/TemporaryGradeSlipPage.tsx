import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores';
import { ArrowLeft, Printer, Layout, Plus, Minus } from 'lucide-react';
import { sortSubjects, normalizeSubjectName } from '../lib/subjectConfig';
import type { Section, Student, Subject, ClassRecord, SchoolProfile } from '../types';

type PaperSize = 'a4' | 'letter' | 'folio';

export function TemporaryGradeSlipPage() {
    const { students, sections, subjects, schoolProfile, setCurrentView, gradingSheetRecords, activeSchoolYear } = useAppStore();
    const [selectedSection, setSelectedSection] = useState('');
    const [paperSize, setPaperSize] = useState<PaperSize>('letter');
    const [zoom, setZoom] = useState(1);

    const sortedSections = useMemo(() => {
        const advisory = sections.filter(s => s.is_advisory || (s as Section & { is_advisory_class?: boolean }).is_advisory_class);
        return [...advisory].sort((a, b) => a.section_grade_level.localeCompare(b.section_grade_level));
    }, [sections]);

    // Auto-select the first available advisory section
    useEffect(() => {
        if (!selectedSection && sortedSections.length > 0) {
            const timer = setTimeout(() => {
                setSelectedSection(sortedSections[0].section_name);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [sortedSections, selectedSection]);

    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        return students.filter(s => s.student_section === selectedSection)
            .sort((a, b) => {
                if (a.gender !== b.gender) {
                    return a.gender === 'Male' ? -1 : 1;
                }
                return a.last_name.localeCompare(b.last_name);
            });
    }, [students, selectedSection]);

    const selectedSectionObj = useMemo(() => {
        return sections.find(s => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

    // Gather subjects for this section
    const sectionSubjects = useMemo(() => {
        if (!selectedSectionObj) return [];
        const sectionGradeNum = parseInt(selectedSectionObj.section_grade_level.replace(/\D/g, '')) || 0;
        let dbSubjects = subjects.filter(s => s.section_id === selectedSectionObj.id);
        
        if (dbSubjects.length === 0) {
            dbSubjects = subjects.filter(s => {
                const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
                return !s.section_id && subjectGradeNum === sectionGradeNum;
            });
        }
        
        return sortSubjects(dbSubjects, s => s.subject_name);
    }, [subjects, selectedSectionObj]);

    const handlePrint = () => {
        window.print();
    };

    // Calculate dimensions based on paper size
    const printDimensions = {
        a4: { height: '297mm', width: '210mm', cssSize: 'A4 portrait' },
        letter: { height: '279.4mm', width: '215.9mm', cssSize: 'letter portrait' },
        folio: { height: '330.2mm', width: '215.9mm', cssSize: '8.5in 13in portrait' }
    };
    
    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden font-sans print:bg-white print:h-auto print:overflow-visible">
            <style dangerouslySetInnerHTML={{ __html: `
                .print-page {
                    width: ${printDimensions[paperSize].width};
                    height: ${printDimensions[paperSize].height};
                    padding: 0;
                    margin: 20px auto;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(2, 1fr);
                    gap: 0;
                    background: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border-radius: 4px;
                    position: relative;
                }

                /* Crossline cut guides */
                .print-page::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    border-top: 1px dashed #999;
                    z-index: 5;
                }
                .print-page::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 0;
                    bottom: 0;
                    border-left: 1px dashed #999;
                    z-index: 5;
                }
                /* Small cross marks at intersection */
                .cut-cross {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 6;
                    width: 12px;
                    height: 12px;
                }
                .cut-cross::before, .cut-cross::after {
                    content: '';
                    position: absolute;
                    background: #999;
                }
                .cut-cross::before {
                    width: 12px;
                    height: 1px;
                    top: 50%;
                    left: 0;
                    transform: translateY(-50%);
                }
                .cut-cross::after {
                    width: 1px;
                    height: 12px;
                    left: 50%;
                    top: 0;
                    transform: translateX(-50%);
                }

                .grade-slip-card {
                    box-sizing: border-box;
                    padding: 4mm;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    height: 100%;
                    font-family: "Bookman Old Style", "Bookman", "Georgia", serif;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    background: white;
                }

                /* Standard table styles to match the layout precisely */
                .grade-table {
                    width: 100%;
                    height: 100%;
                    border-collapse: collapse;
                    font-size: 8.5px;
                    table-layout: fixed;
                }
                .grade-table th, .grade-table td {
                    border: 1px solid #000;
                    padding: 2px 3px;
                }
                .grade-table th {
                    font-weight: bold;
                    text-align: center;
                }
                .grade-table .subject-col {
                    width: 48%;
                    text-align: left;
                }
                .grade-table .q-col {
                    width: 9%;
                    text-align: center;
                }
                .grade-table .final-col {
                    width: 11%;
                    text-align: center;
                    font-weight: bold;
                }
                .grade-table .remarks-col {
                    width: 14%;
                    text-align: center;
                }

                @media print {
                    @page {
                        size: ${printDimensions[paperSize].cssSize};
                        margin: 0;
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: visible !important;
                    }
                    .print-page {
                        width: 100vw !important;
                        height: 100vh !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        page-break-after: always;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-page:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    .grade-slip-card {
                        box-shadow: none !important;
                        height: 100% !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-preview-container {
                        transform: none !important;
                        width: 100% !important;
                    }
                }
            ` }} />

            {/* Header Toolbar */}
            <div className="h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm print:hidden">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setCurrentView('school-forms')}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Temporary Grade Slip</h2>
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                            {selectedSectionObj ? `${selectedSectionObj.section_grade_level} - ${selectedSectionObj.section_name}` : 'Student Resource Tool'}
                        </p>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    <div className="flex items-center gap-3">
                        {/* Advisory class loaded automatically */}

                        <select 
                            className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer"
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                        >
                            <option value="letter">Letter (8.5 x 11in)</option>
                            <option value="a4">A4 Size (210 x 297mm)</option>
                            <option value="folio">Folio / Long (8.5 x 13in)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Zoom Control */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm"
                            title="Zoom Out"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 w-12 text-center tabular-nums">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button 
                            onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm"
                            title="Zoom In"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200" />

                     <button
                        onClick={handlePrint}
                        disabled={sectionStudents.length === 0}
                        className="h-11 px-6 rounded-xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print Slips
                    </button>
                </div>
            </div>

            {/* Layout Preview */}
            <div className="flex-1 overflow-auto p-8 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar">
                {sectionStudents.length > 0 ? (
                    <div className="print-preview-container print:w-full flex flex-col items-center transition-all duration-300 ease-out origin-top print:scale-100" style={{ transform: `scale(${zoom})` }}>
                        <div className="print:w-full flex flex-col items-center gap-8 print:gap-0">
                            {/* PDF-like Paginated View */}
                            {Array.from({ length: Math.ceil(sectionStudents.length / 4) }).map((_, pageIdx) => (
                                <div key={pageIdx} className="print-page relative">
                                    {/* Page Number Indicator */}
                                    <div className="absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden">
                                        Page {pageIdx + 1} of {Math.ceil(sectionStudents.length / 4)}
                                    </div>
                                    {/* Center cross mark for cutting */}
                                    <div className="cut-cross" />
                                    
                                    {sectionStudents.slice(pageIdx * 4, (pageIdx + 1) * 4).map((student) => (
                                        <GradeSlipCard 
                                            key={student.lrn} 
                                            student={student} 
                                            schoolProfile={schoolProfile}
                                            section={selectedSectionObj}
                                            subjects={sectionSubjects}
                                            records={gradingSheetRecords}
                                            activeSchoolYear={activeSchoolYear}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md">
                        <div className="w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6">
                            <Layout className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">No Advisory Class Set</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Please set up your advisory grade level and section details in your Profile to generate temporary grade slips.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface GradeSlipCardProps {
    student: Student;
    schoolProfile: SchoolProfile;
    section: Section | undefined;
    subjects: Subject[];
    records: ClassRecord[];
    activeSchoolYear: string;
}

function GradeSlipCard({ student, schoolProfile, section, subjects, records, activeSchoolYear }: GradeSlipCardProps) {
    const baseUrl = import.meta.env.BASE_URL;
    const logoUrl = schoolProfile.logo_url || 'school-logo.png';
    const depedLogo = `${baseUrl}deped_logo_left.png`;
    
    // Extract grades for this student for all 3 terms
    const studentGrades = useMemo(() => {
        const subjectGrades: Record<string, { q1: string, q2: string, q3: string, final: string, remarks: string }> = {};
        let finalTotal = 0;
        let finalCount = 0;

        // Per-term totals for general average per term
        const termTotals = { t1: 0, t2: 0, t3: 0 };
        const termCounts = { t1: 0, t2: 0, t3: 0 };

        subjects.forEach((subj: Subject) => {
            let q1 = '', q2 = '', q3 = '';
            let sTotal = 0, sCount = 0;

            for (let q = 1; q <= 3; q++) {
                const r = records.find((rec: ClassRecord) => rec.student_lrn === student.lrn && rec.subject_id === subj.id && Number(rec.quarter) === q && rec.school_year === activeSchoolYear);
                if (r && r.final_grade && Number(r.final_grade) > 0) {
                    const g = Number(r.final_grade);
                    if (q === 1) { q1 = g.toString(); termTotals.t1 += g; termCounts.t1++; }
                    if (q === 2) { q2 = g.toString(); termTotals.t2 += g; termCounts.t2++; }
                    if (q === 3) { q3 = g.toString(); termTotals.t3 += g; termCounts.t3++; }
                    sTotal += g;
                    sCount++;
                }
            }

            let finalGrade = '';
            let remarks = '';
            
            if (sCount > 0) {
                const avg = Math.round(sTotal / sCount);
                finalGrade = avg.toString();
                finalTotal += avg;
                finalCount++;
                remarks = avg >= 75 ? 'Passed' : 'Failed';
            }

            subjectGrades[subj.id] = { q1, q2, q3, final: finalGrade, remarks };
        });

        const genAvg = finalCount > 0 ? Math.round(finalTotal / finalCount).toString() : '';
        const genRemarks = genAvg ? (Number(genAvg) >= 75 ? 'Passed' : 'Failed') : '';

        const genT1 = termCounts.t1 > 0 ? Math.round(termTotals.t1 / termCounts.t1).toString() : '';
        const genT2 = termCounts.t2 > 0 ? Math.round(termTotals.t2 / termCounts.t2).toString() : '';
        const genT3 = termCounts.t3 > 0 ? Math.round(termTotals.t3 / termCounts.t3).toString() : '';

        return { subjectGrades, genAvg, genRemarks, genT1, genT2, genT3 };
    }, [subjects, records, student.lrn, activeSchoolYear]);

    const studentFullName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''}`.trim();
    
    const nameFontSize = useMemo(() => {
        if (studentFullName.length > 35) return 'text-[7.5px] leading-tight';
        if (studentFullName.length > 25) return 'text-[8.2px] leading-tight';
        return 'text-[9px]';
    }, [studentFullName]);

    const getSubjectFontSizeStyle = (name: string) => {
        const len = name.length;
        if (len === 0) return { fontSize: '10px' };

        const isSub = normalizeSubjectName(name).includes('music') || 
                      normalizeSubjectName(name).includes('arts') ||
                      normalizeSubjectName(name).includes('physical') ||
                      normalizeSubjectName(name).includes('health');
                      
        // Usable width in pixels (for A4 width = 97mm inner card width).
        // Subject col is 48% of 97mm = 46.56mm = 176px.
        // Horizontal cell padding is 3px each side -> 6px -> 170px.
        // Subcomponent has pl-3 (12px) -> 158px.
        const usableWidth = isSub ? 158 : 170;
        
        // Bookman Old Style average character width factor is around 0.55.
        // Using 0.54 to maximize font size and let text stretch closer to the margins
        // without wrapping.
        const charWidthRatio = 0.54;
        
        // Calculate dynamic font size to perfectly fit the column width
        const calculatedSize = usableWidth / (len * charWidthRatio);
        
        // Cap the font size:
        // Maximum size: 10px (looks incredibly clear, legible, and balanced)
        // Minimum size: 7.5px (still readable and prevents table clipping)
        const finalSize = Math.max(7.5, Math.min(10, calculatedSize));
        
        return {
            fontSize: `${finalSize.toFixed(2)}px`,
            lineHeight: finalSize < 8.5 ? '1' : '1.1'
        };
    };

    return (
        <div className="grade-slip-card font-serif text-[9px] relative text-black leading-tight">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-1.5 px-1 shrink-0">
                <img src={depedLogo} className="w-10 h-10 object-contain" alt="DepEd" />
                <div className="text-center font-bold leading-none">
                    <p className="uppercase text-[9px]">{schoolProfile.name}</p>
                    <p className="uppercase text-[9px] font-normal tracking-wide mt-0.5">SCHOOL YEAR: {activeSchoolYear}</p>
                    <h3 className="text-[9px] font-black tracking-widest mt-1.5 uppercase leading-none">Grade Slip</h3>
                </div>
                <img src={logoUrl} className="w-10 h-10 object-contain" alt="School" />
            </div>

            {/* Student Info */}
            <div className="mb-1.5 px-1 shrink-0 text-[9px]">
                <div className="flex mb-0.5 items-baseline">
                    <span className="w-10 text-[9px]">Name:</span>
                    <span className={`flex-1 border-b border-black font-bold uppercase pb-0.5 leading-none ${nameFontSize}`}>
                        {studentFullName}
                    </span>
                </div>
                <div className="flex gap-4 mb-0.5">
                    <div className="flex flex-1">
                        <span className="w-10">LRN:</span>
                        <span className="flex-1 border-b border-black font-bold pb-0.5 leading-none">{student.lrn}</span>
                    </div>
                    <div className="flex w-[80px]">
                        <span className="w-8">Age:</span>
                        <span className="flex-1 border-b border-black font-bold pb-0.5 leading-none text-center">{student.age || ''}</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-1">
                        <span className="w-[60px]">Grade Level:</span>
                        <span className="flex-1 border-b border-black font-bold leading-none text-center pb-0.5">
                            {section?.section_grade_level?.replace(/Grade/i, '').trim() || ''}
                        </span>
                    </div>
                    <div className="flex flex-1">
                        <span className="w-[45px]">Section:</span>
                        <span className="flex-1 border-b border-black font-bold leading-none text-center uppercase pb-0.5">
                            {section?.section_name || ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="flex-1 min-h-0 mb-1.5 px-1">
                <table className="grade-table">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="subject-col">LEARNING AREAS</th>
                            <th colSpan={3}>TERM</th>
                            <th rowSpan={2} className="final-col leading-tight"><div className="w-min mx-auto">FINAL GRADE</div></th>
                            <th rowSpan={2} className="remarks-col">REMARKS</th>
                        </tr>
                        <tr>
                            <th className="q-col">1</th>
                            <th className="q-col">2</th>
                            <th className="q-col">3</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map((subj: Subject) => {
                            const grades = studentGrades.subjectGrades[subj.id];
                            const isSubComponent = normalizeSubjectName(subj.subject_name).includes('music') || 
                                                   normalizeSubjectName(subj.subject_name).includes('arts') ||
                                                   normalizeSubjectName(subj.subject_name).includes('physical') ||
                                                   normalizeSubjectName(subj.subject_name).includes('health');
                                                   
                            return (
                                <tr key={subj.id}>
                                    <td 
                                        className={`subject-col ${isSubComponent ? 'italic pl-3' : ''}`}
                                        style={getSubjectFontSizeStyle(subj.subject_name)}
                                    >
                                        {subj.subject_name}
                                    </td>
                                    <td className="q-col">{grades.q1 || '\u00A0'}</td>
                                    <td className="q-col">{grades.q2 || '\u00A0'}</td>
                                    <td className="q-col">{grades.q3 || '\u00A0'}</td>
                                    <td className="final-col">{grades.final || '\u00A0'}</td>
                                    <td className="remarks-col text-[6.5px] tracking-tighter uppercase">{grades.remarks || '\u00A0'}</td>
                                </tr>
                            );
                        })}
                        {/* Visual Separator Row */}
                        <tr style={{ height: '2px' }}>
                            <td 
                                colSpan={6} 
                                style={{ 
                                    backgroundColor: 'black', 
                                    height: '2px', 
                                    padding: 0, 
                                    borderLeft: '1px solid black',
                                    borderRight: '1px solid black',
                                    borderTop: '1px solid black',
                                    borderBottom: '1px solid black'
                                }} 
                            />
                        </tr>
                        <tr>
                            <td className="subject-col font-bold text-[10px] text-center pb-1 pt-1">General Average</td>
                            <td className="q-col font-bold">{studentGrades.genT1 || '\u00A0'}</td>
                            <td className="q-col font-bold">{studentGrades.genT2 || '\u00A0'}</td>
                            <td className="q-col font-bold">{studentGrades.genT3 || '\u00A0'}</td>
                            <td className="final-col font-bold">{studentGrades.genAvg || '\u00A0'}</td>
                            <td className="remarks-col text-[6.5px] tracking-tighter uppercase font-bold">{studentGrades.genRemarks || '\u00A0'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer Signatures */}
            <div className="mt-auto px-1 flex flex-col items-center justify-center shrink-0 w-full text-center">
                <p className="text-[8px] mb-1 w-full text-center">Prepared by:</p>
                <div className="w-[180px] mx-auto text-center mt-2.5">
                    <div className="font-bold text-[9px] uppercase border-b border-black pb-0.5 leading-none">
                        {schoolProfile.adviser_name || '_________________________'}
                    </div>
                    <p className="text-[8px] italic mt-0.5">Adviser</p>
                </div>
            </div>
        </div>
    );
}
