import React from 'react';
import type { Student, SchoolProfile } from '../types';

interface LIRRendererProps {
    pageNumber: number;
    student: Student;
    profile: SchoolProfile;
    schoolYear: string;
    subject?: string;
    teacher?: string;
    fillColor?: string;
    outlineColor?: string;
    paperSize?: 'a4' | 'letter' | 'folio';
    gradeData?: {
        [term: number]: {
            scores: {
                ww: (number | string)[];
                pt: (number | string)[];
                st: (number | string)[];
                te: number | string;
            };
            hps: {
                ww: (number | string)[];
                pt: (number | string)[];
                st: (number | string)[];
                te: number | string;
            };
            finalGrade: number | string;
        }
    };
    attendanceData?: Record<string, number>; // Month -> Total Absences
}

export const LIRRenderer: React.FC<LIRRendererProps> = ({
    pageNumber: _pageNumber, student, profile, schoolYear, subject, teacher,
    fillColor = '#86efac', outlineColor = '#22c55e', gradeData,
    paperSize = 'folio', attendanceData = {}
}) => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const ATTENDANCE_DATE_COLUMNS = 25;

    const padAttendanceDates = (dates: Array<number | string>) => {
        return Array.from({ length: ATTENDANCE_DATE_COLUMNS }, (_, index) => dates[index] ?? '');
    };

    const isHoliday = (month: string, day: number | string) => {
        const d = Number(day);
        if (!d) return false;
        
        const m = month.toUpperCase();
        if (m === 'JUNE' && d === 12) return true;
        if (m === 'AUGUST' && (d === 21 || d === 31)) return true;
        if (m === 'NOVEMBER' && (d === 2 || d === 30)) return true;
        if (m === 'DECEMBER' && d === 8) return true;
        if (m === 'JANUARY' && d === 1) return true;
        
        return false;
    };

    // Default Folio Maximized Scaling
    let pageHeight = '13in';
    let pageWidth = '8.5in';
    let scale = 1.12; 
    
    // Size adjustments for header elements
    let schoolNameSize = 1.2;
    let lirCardTitleSize = 0.8;
    let schoolYearSize = 0.75;
    let headerTablePadding = 5;
    let subjectTeacherFontSize = 0.8;
    
    // Signature Box dimensions
    let sigBoxHeight = 40;
    let sigBoxWidth = 240;
    
    // DepEd Logo dimensions
    let depedLogoWidth = 100;
    let depedLogoHeight = 50;
    
    // Vertical shift for signature area
    let signatureAreaShift = '0px';

    if (paperSize === 'a4') {
        pageWidth = '210mm';
        pageHeight = '297mm';
        scale = 1.02; 
        schoolNameSize = 0.85; 
        lirCardTitleSize = 0.55;
        schoolYearSize = 0.5;
        headerTablePadding = 2; 
        subjectTeacherFontSize = 0.65;
        sigBoxHeight = 26;
        sigBoxWidth = 140;
        depedLogoWidth = 80;
        depedLogoHeight = 40;
    } else if (paperSize === 'letter') {
        pageWidth = '8.5in';
        pageHeight = '11in';
        scale = 0.98;
        schoolNameSize = 0.85;
        lirCardTitleSize = 0.55;
        schoolYearSize = 0.5;
        headerTablePadding = 3;
        subjectTeacherFontSize = 0.7;
        sigBoxHeight = 28;
        sigBoxWidth = 160;
        depedLogoWidth = 65;
        depedLogoHeight = 32;
        signatureAreaShift = '-11px';
    } else if (paperSize === 'folio') {
        pageWidth = '8.5in';
        pageHeight = '13in';
        scale = 0.98; 
        schoolNameSize = 0.85; 
        lirCardTitleSize = 0.55;
        schoolYearSize = 0.5;
        headerTablePadding = 3;
        subjectTeacherFontSize = 0.7;
        sigBoxHeight = 28;
        sigBoxWidth = 160;
        depedLogoWidth = 65;
        depedLogoHeight = 32;
        signatureAreaShift = '-11px';
    }

    const getDynamicFontSize = (text: string | undefined, baseRem: number) => {
        const str = (text || '').trim();
        if (str.length > 32) return baseRem * 0.65;
        if (str.length > 24) return baseRem * 0.78;
        if (str.length > 16) return baseRem * 0.88;
        return baseRem;
    };

    const subjectFontSize = getDynamicFontSize(subject, subjectTeacherFontSize * scale);
    const teacherFontSize = getDynamicFontSize(teacher, subjectTeacherFontSize * scale);

    return (
        <div className="lir-container bg-white flex flex-col items-center font-['Inter',sans-serif] antialiased p-8 print:p-0">
            <div 
                className="page bg-white flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none overflow-hidden shadow-2xl print:shadow-none"
                style={{ width: pageWidth, height: pageHeight }}
            >
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
                    @page { size: ${pageWidth} ${pageHeight}; margin: 0in; }
                    
                    .card-container-combined {
                        width: 100%;
                        background: white;
                        color: #000000;
                        color-scheme: light;
                        border: 4px solid ${outlineColor};
                        padding: ${8 * scale}px;
                        box-sizing: border-box;
                        margin: 0 auto;
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        overflow: hidden;
                    }

                    .half-page-section {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-evenly;
                        overflow: hidden;
                        padding: ${5 * scale}px 0;
                        width: 100%;
                        color: #000000;
                    }

                    .header-green {
                        background-color: ${fillColor};
                        border: 1px solid ${outlineColor};
                        color: #000000 !important;
                        text-align: center;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: ${3 * scale}px;
                        font-size: ${0.85 * scale}rem;
                        letter-spacing: 0.1em;
                        white-space: nowrap;
                    }

                    .label-green {
                        background-color: ${fillColor}dd;
                        border: 1px solid ${outlineColor};
                        color: #000000 !important;
                        font-size: ${0.6 * scale}rem;
                        text-align: center;
                        font-weight: 700;
                        text-transform: uppercase;
                        display: table-cell;
                        vertical-align: middle;
                    }

                    .data-field {
                        border: 1px solid ${outlineColor};
                        padding: ${2 * scale}px;
                        text-align: center;
                        font-weight: 700;
                        font-size: ${0.8 * scale}rem;
                        vertical-align: middle;
                        background-color: white;
                        color: #000000 !important;
                        display: table-cell;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: ${0.6 * scale}rem;
                        table-layout: fixed;
                        color: #000000;
                    }

                    .header-subject-table {
                        width: auto !important;
                        table-layout: auto !important;
                        border-collapse: collapse !important;
                    }

                    th, td {
                        border: 1px solid ${outlineColor};
                        padding: ${1.5 * scale}px;
                        text-align: center;
                        height: ${24 * scale}px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        color: #000000 !important;
                    }

                    .header-subject-table td {
                        overflow: visible !important;
                        text-overflow: clip !important;
                        white-space: nowrap !important;
                        width: auto !important;
                        height: auto !important;
                    }

                    .term-label {
                        color: #ef4444;
                        background-color: ${fillColor}44;
                        font-weight: 800;
                        font-size: ${0.6 * scale}rem;
                    }

                    .row-label {
                        background-color: ${fillColor}cc;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: ${0.6 * scale}rem;
                        width: ${70 * scale}px;
                        color: black;
                    }

                    .header-row-fill {
                        background-color: ${fillColor}99;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .signature-box {
                        border: 1px solid ${outlineColor};
                        border-radius: 8px;
                        height: ${sigBoxHeight * scale}px;
                        width: ${sigBoxWidth * scale}px;
                        margin: 0 auto;
                    }

                    /* Back Section Styles */
                    .lir-title-bar-custom { 
                        background-color: ${fillColor}; 
                        color: black; 
                        text-align: center; 
                        font-weight: 800; 
                        font-size: ${0.9 * scale}rem; 
                        padding: ${4 * scale}px; 
                        letter-spacing: 0.1em; 
                        border: 2px solid ${outlineColor}; 
                        border-radius: 4px; 
                    }

                    .attendance-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        border: 2px solid ${outlineColor}; 
                        table-layout: fixed;
                    }

                    .attendance-table th, .attendance-table td { 
                        border: 1px solid ${outlineColor}; 
                        text-align: center; 
                        font-size: ${0.5 * scale}rem; 
                        font-weight: 700; 
                        height: ${21 * scale}px; 
                        padding: ${1 * scale}px; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .month-col { 
                        background-color: ${fillColor}; 
                        width: 10%; 
                        text-align: center !important; 
                        font-size: ${0.5 * scale}rem;
                        font-weight: 800;
                        color: black !important;
                        border-right: 2px solid ${outlineColor} !important; 
                    }

                    .dates-header-bar { 
                        background-color: ${fillColor}; 
                        color: black !important; 
                        font-size: ${0.9 * scale}rem; 
                        letter-spacing: 0.1em; 
                        font-weight: 800;
                    }

                    .absences-header { 
                        background-color: ${fillColor}; 
                        color: black !important; 
                        width: 7%; 
                        font-size: ${0.45 * scale}rem; 
                        font-weight: 800;
                        white-space: normal !important;
                        line-height: 1;
                    }

                    .attendance-date-cell {
                        width: 3.32%; 
                        font-size: ${0.5 * scale}rem;
                        font-weight: 700;
                    }

                    .important-dates-box { 
                        flex: 1; 
                        display: flex; 
                        flex-direction: column; 
                        border-right: 2px solid ${outlineColor};
                        overflow: hidden;
                    }
                    .important-dates-box:last-child {
                        border-right: none;
                    }

                    .important-dates-header { 
                        background-color: ${fillColor}; 
                        color: black !important; 
                        text-align: center; 
                        font-weight: 800; 
                        padding: ${3 * scale}px; 
                        font-size: ${0.85 * scale}rem; 
                        border-bottom: 2px solid ${outlineColor}; 
                    }

                    .date-row { 
                        display: flex; 
                        border-bottom: 1px solid ${outlineColor}; 
                        font-size: ${0.45 * scale}rem; 
                        min-height: ${18 * scale}px; 
                        align-items: center; 
                        overflow: hidden;
                        white-space: nowrap;
                    }

                    .date-row:last-child { border-bottom: none; }

                    .date-val { 
                        width: ${95 * scale}px; 
                        border-right: 1px solid ${outlineColor}; 
                        padding: ${1.5 * scale}px ${4 * scale}px; 
                        font-weight: 800; 
                        color: black !important; 
                        height: 100%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        shrink: 0;
                    }

                    .date-label { 
                        padding: ${1.5 * scale}px ${4 * scale}px; 
                        font-weight: 700; 
                        font-size: ${0.42 * scale}rem; 
                        flex: 1; 
                        line-height: 1;
                        display: block;
                        overflow: hidden;
                        text-overflow: ellipsis; 
                        white-space: nowrap;
                        color: black;
                    }

                    .student-info-table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: auto;
                    }
                `}</style>

                <div className="card-container-combined print:m-0 print:shadow-none">
                    {/* --- FRONT SECTION --- */}
                    <div className="half-page-section">
                        {/* Header Section */}
                        <div className="flex justify-between items-center w-full overflow-hidden">
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="flex items-center justify-center bg-white overflow-hidden" style={{ width: 64 * scale, height: 64 * scale }}>
                                    <img
                                        src={profile.logo_url || `${baseUrl}school-logo.png`}
                                        alt="School Logo"
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `${baseUrl}school-logo.png`;
                                        }}
                                    />
                                </div>
                                <div>
                                    <h1 className="font-extrabold uppercase whitespace-nowrap" style={{ fontSize: schoolNameSize * scale + 'rem' }}>{profile.name || 'BAGONG BARRIO NATIONAL HIGH SCHOOL'}</h1>
                                    <p className="font-black uppercase italic" style={{ fontSize: lirCardTitleSize * scale + 'rem', color: outlineColor }}>Learner's Individual Record Card</p>
                                    <p className="font-bold" style={{ fontSize: schoolYearSize * scale + 'rem' }}>School Year: <span className="font-normal ml-2">{schoolYear}</span></p>
                                </div>
                            </div>

                            <div className="shrink-0 ml-auto">
                                <table className="header-subject-table border-collapse border-2" style={{ borderColor: outlineColor }}>
                                    <tbody>
                                        <tr>
                                            <td className="label-green border-2 whitespace-nowrap" style={{ fontSize: subjectTeacherFontSize * scale + 'rem', padding: `${headerTablePadding * scale}px ${headerTablePadding * 2 * scale}px`, borderColor: outlineColor }}>SUBJECT</td>
                                            <td className="data-field font-extrabold border-2 whitespace-nowrap" style={{ fontSize: subjectFontSize + 'rem', padding: `${headerTablePadding * scale}px ${headerTablePadding * 2.5 * scale}px`, borderColor: outlineColor }}>{subject}</td>
                                            <td className="label-green border-2 whitespace-nowrap" style={{ fontSize: subjectTeacherFontSize * scale + 'rem', padding: `${headerTablePadding * scale}px ${headerTablePadding * 2 * scale}px`, borderColor: outlineColor }}>TEACHER</td>
                                            <td className="data-field font-extrabold border-2 whitespace-nowrap" style={{ fontSize: teacherFontSize + 'rem', padding: `${headerTablePadding * scale}px ${headerTablePadding * 2.5 * scale}px`, borderColor: outlineColor }}>{teacher}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Student Info Section */}
                        <div className="flex gap-4 items-start w-full mt-2">
                            <div className="border-2 flex flex-col items-center justify-center text-center bg-white shrink-0 overflow-hidden" style={{ width: 1.0 * scale + 'in', height: 1.0 * scale + 'in', borderColor: outlineColor }}>
                                {student.photo_url ? (
                                    <img
                                        src={student.photo_url}
                                        alt="1x1 Learner Photo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="font-bold leading-tight" style={{ fontSize: 0.7 * scale + 'rem' }}>1 X 1<br />PHOTO</span>
                                )}
                            </div>

                            <div className="grow flex flex-col gap-1 overflow-hidden">
                                <table 
                                    className="student-info-table border-2" 
                                    style={{ 
                                        borderColor: outlineColor,
                                        height: 1.0 * scale + 'in' 
                                    }}
                                >
                                    <tbody>
                                        <tr style={{ height: 0.5 * scale + 'in' }}>
                                            <td className="data-field uppercase font-bold border-2 whitespace-nowrap" style={{ borderColor: outlineColor, height: 0.5 * scale + 'in' }}>{student.last_name}</td>
                                            <td className="data-field uppercase font-bold border-2 whitespace-nowrap" style={{ borderColor: outlineColor, height: 0.5 * scale + 'in' }}>{student.first_name}</td>
                                            <td className="data-field uppercase font-bold border-2 whitespace-nowrap px-1" style={{ width: '40px', borderColor: outlineColor, height: 0.5 * scale + 'in' }}>{student.middle_name?.charAt(0) || ''}</td>
                                            <td className="data-field uppercase font-bold border-2 whitespace-nowrap" style={{ borderColor: outlineColor, height: 0.5 * scale + 'in' }}>{student.student_section}</td>
                                            <td className="data-field uppercase font-bold border-2 whitespace-nowrap" style={{ borderColor: outlineColor, height: 0.5 * scale + 'in' }}>{student.lrn}</td>
                                        </tr>
                                        <tr style={{ height: 0.5 * scale + 'in' }}>
                                            <td className="label-green py-1 border-2" style={{ borderColor: outlineColor, height: 0.5 * scale + 'in' }}>LAST NAME</td>
                                            <td className="label-green py-1 border-2" style={{ borderColor: outlineColor, height: 0.5 * scale + 'in' }}>FIRST NAME</td>
                                            <td className="label-green py-1 border-2 px-1" style={{ width: '40px', borderColor: outlineColor, height: 0.5 * scale + 'in' }}>M.I</td>
                                            <td className="label-green py-1 border-2" style={{ borderColor: outlineColor, height: 0.5 * scale + 'in' }}>GRADE & SECTION</td>
                                            <td className="label-green py-1 border-2" style={{ borderColor: outlineColor, height: 0.5 * scale + 'in' }}>LRN</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Main Tables Section */}
                        <div className="grid grid-cols-2 gap-4 mt-2 w-full overflow-hidden">
                            {/* Written Works */}
                            <div>
                                <div className="header-green py-1" style={{ fontSize: 0.75 * scale + 'rem' }}>WRITTEN /ORAL WORKS (WWs)</div>
                                <table style={{ tableLayout: 'fixed' }}>
                                    <tbody>
                                        <tr className="header-row-fill">
                                            <td className="term-label" style={{ width: '15%' }}>TERM</td>
                                            {[1, 2, 3, 4, 5].map(n => <td key={n} style={{ width: '13%' }}>{n}</td>)}
                                            <td className="font-bold" style={{ width: '20%' }}>TOTAL</td>
                                        </tr>
                                        {[1, 2, 3].map(termNum => (
                                            <tr key={termNum}>
                                                <td className="row-label">{termNum === 1 ? 'FIRST' : termNum === 2 ? 'SECOND' : 'THIRD'}</td>
                                                {[...Array(5)].map((_, i) => <td key={i}>{gradeData?.[termNum]?.scores.ww[i] ?? ''}</td>)}
                                                <td className="font-bold">{gradeData?.[termNum]?.scores.ww.slice(0, 5).reduce<number>((a, b) => a + (Number(b) || 0), 0) || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Performance Task */}
                            <div>
                                <div className="header-green py-1" style={{ fontSize: 0.75 * scale + 'rem' }}>PRODUCT/PERFORMANCE TASK (PPTs)</div>
                                <table style={{ tableLayout: 'fixed' }}>
                                    <tbody>
                                        <tr className="header-row-fill">
                                            <td className="term-label" style={{ width: '20%' }}>TERM</td>
                                            {[1, 2, 3].map(n => <td key={n} style={{ width: '20%' }}>{n}</td>)}
                                            <td className="font-bold" style={{ width: '20%' }}>TOTAL</td>
                                        </tr>
                                        {[1, 2, 3].map(termNum => (
                                            <tr key={termNum}>
                                                <td className="row-label">{termNum === 1 ? 'FIRST' : termNum === 2 ? 'SECOND' : 'THIRD'}</td>
                                                {[...Array(3)].map((_, i) => <td key={i}>{gradeData?.[termNum]?.scores.pt[i] ?? ''}</td>)}
                                                <td className="font-bold">{gradeData?.[termNum]?.scores.pt.slice(0, 3).reduce<number>((a, b) => a + (Number(b) || 0), 0) || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summative / Exam / Final Grade Section */}
                        <div className="grid grid-cols-4 gap-4 items-start w-full mt-2 overflow-hidden">
                            <div className="col-span-1">
                                <div className="header-green py-1" style={{ fontSize: 0.7 * scale + 'rem' }}>SUMMATIVE TEST</div>
                                <table style={{ tableLayout: 'fixed' }}>
                                    <tbody>
                                        <tr className="header-row-fill">
                                            <td className="term-label" style={{ width: '40%' }}>TERM</td>
                                            {[1, 2].map(n => <td key={n}>{n}</td>)}
                                        </tr>
                                        {[1, 2, 3].map(termNum => (
                                            <tr key={termNum}>
                                                <td className="row-label">{termNum === 1 ? 'FIRST' : termNum === 2 ? 'SECOND' : 'THIRD'}</td>
                                                {[...Array(2)].map((_, i) => <td key={i}>{gradeData?.[termNum]?.scores.st[i] ?? ''}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="col-span-1">
                                <table style={{ tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr className="header-row-fill">
                                            <td colSpan={2} className="font-bold py-1" style={{ fontSize: 0.7 * scale + 'rem' }}>TERM EXAM</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3].map(termNum => (
                                            <tr key={termNum}>
                                                <td className="row-label py-1 px-1 border-2" style={{ borderColor: outlineColor }}>{termNum === 1 ? '1ST' : termNum === 2 ? '2ND' : '3RD'} TERM</td>
                                                <td className="font-bold">{gradeData?.[termNum]?.scores.te || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="col-span-1">
                                <table style={{ tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr className="header-row-fill">
                                            <td colSpan={2} className="font-bold py-1" style={{ fontSize: 0.7 * scale + 'rem' }}>FINAL GRADE</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3].map(termNum => (
                                            <tr key={termNum}>
                                                <td className="row-label py-1 px-1 border-2" style={{ borderColor: outlineColor }}>{termNum === 1 ? '1ST' : termNum === 2 ? '2ND' : '3RD'} TERM</td>
                                                <td className="font-bold">{gradeData?.[termNum]?.finalGrade || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ height: 1.5 * scale + 'px' }}><td colSpan={2} style={{ border: 'none' }}></td></tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="col-span-1 flex flex-col items-center justify-center pt-1" style={{ marginTop: signatureAreaShift }}>
                                <div className="mb-2">
                                    <img src={`${baseUrl}deped_logo_right.png`} alt="DepEd Logo" className="object-contain" style={{ width: depedLogoWidth * scale, height: depedLogoHeight * scale }} />
                                </div>
                                <div className="signature-box bg-white"></div>
                                <p 
                                    className="font-bold uppercase leading-none text-center" 
                                    style={{ 
                                        fontSize: 0.6 * scale + 'rem',
                                        marginTop: 14 * scale + 'px'
                                    }}
                                >
                                    Teacher's Signature
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* --- BACK SECTION --- */}
                    <div className="half-page-section border-t-4" style={{ borderColor: outlineColor }}>
                        {/* Title Bar */}
                        <div className="lir-title-bar-custom mb-3 uppercase tracking-widest">
                            Daily Attendance
                        </div>

                        {/* Attendance Table */}
                        <table className="attendance-table mb-3">
                            <colgroup>
                                <col style={{ width: '10%' }} />
                                {Array.from({ length: ATTENDANCE_DATE_COLUMNS }).map((_, index) => (
                                    <col key={index} style={{ width: '3.32%' }} />
                                ))}
                                <col style={{ width: '7%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th className="month-col uppercase">Months</th>
                                    <th colSpan={ATTENDANCE_DATE_COLUMNS} className="dates-header-bar uppercase">Dates</th>
                                    <th className="absences-header uppercase">Total Abs.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: 'JUNE', dates: [8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30] },
                                    { name: 'JULY', dates: [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31] },
                                    { name: 'AUGUST', dates: [3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 24, 25, 26, 27, 28, 31] },
                                    { name: 'SEPTEMBER', dates: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30] },
                                    { name: 'OCTOBER', dates: [1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30] },
                                    { name: 'NOVEMBER', dates: [2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27, 30] },
                                    { name: 'DECEMBER', dates: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18] },
                                    { name: 'JANUARY', dates: [1, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29] },
                                    { name: 'FEBRUARY', dates: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26] },
                                    { name: 'MARCH', dates: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 29, 30, 31] },
                                    { name: 'APRIL', dates: [1, 2, 5, 6, 7, 8] },
                                ].map(month => (
                                    <tr key={month.name}>
                                        <td className="month-col">{month.name}</td>
                                        {padAttendanceDates(month.dates).map((date, i) => (
                                            <td 
                                                key={i} 
                                                className="attendance-date-cell"
                                                style={{ color: isHoliday(month.name, date) ? 'red' : 'inherit' }}
                                            >
                                                {date}
                                            </td>
                                        ))}
                                        <td className="font-bold">{attendanceData[month.name] || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Important Dates Section */}
                        <div className="flex items-stretch border-2 w-full overflow-hidden" style={{ borderColor: outlineColor }}>
                            {/* Column 1 */}
                            <div className="important-dates-box">
                                <div className="important-dates-header uppercase italic">Important Dates</div>
                                {[
                                    ['June 8-11, 2026', 'Opening Block: Term 1'],
                                    ['July 6, 2026', 'Term 1: Summative Test #1'],
                                    ['July 28, 2026', 'Term 1: Summative Test #2'],
                                    ['Aug 28, 2026', 'Term 1 Examination'],
                                    ['Sept 1, 2026', 'Term 1 Examination'],
                                    ['Sept 2-15, 2026', 'End-of-Term Block'],
                                    ['Sept 16, 2026', 'Start of Term 2'],
                                ].map(([date, label]) => (
                                    <div key={date} className="date-row">
                                        <div className="date-val uppercase">{date}</div>
                                        <div className="date-label uppercase">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Column 2 */}
                            <div className="important-dates-box">
                                <div className="important-dates-header uppercase italic">Important Dates</div>
                                {[
                                    ['Oct 7, 2026', 'Term 2: Summative Test #1'],
                                    ['Oct 29, 2026', 'Term 2: Summative Test #2'],
                                    ['Dec 3-4, 2026', 'Term 2 Examination'],
                                    ['Dec 7-18, 2026', 'End-of-Term Block'],
                                    ['Dec 18, 2026', 'End of Term 2'],
                                    ['Jan 4, 2027', 'Start of Term 3'],
                                    ['Jan 25, 2027', 'Term 3: Summative Test #1'],
                                ].map(([date, label]) => (
                                    <div key={date} className="date-row">
                                        <div className="date-val uppercase">{date}</div>
                                        <div className="date-label uppercase">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Column 3 */}
                            <div className="important-dates-box">
                                <div className="important-dates-header uppercase italic">Important Dates</div>
                                {[
                                    ['Feb 16, 2027', 'Term 3: Summative Test #2'],
                                    ['Mar 15-16, 2027', 'Term 3 Exam (Graduating)'],
                                    ['Mar 22-23, 2027', 'Term 3 Exam (Non-Grad)'],
                                    ['Mar 24-31, 2027', 'End-of-Term Block'],
                                    ['Apr 1-8, 2027', 'End-of-Term Block'],
                                    ['Apr 6-7, 2027', 'EOSY Rites'],
                                    ['Apr 8, 2027', 'End of Term 3'],
                                ].map(([date, label]) => (
                                    <div key={date} className="date-row">
                                        <div className="date-val uppercase">{date}</div>
                                        <div className="date-label uppercase">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LIRRenderer;
