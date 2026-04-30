import React from 'react';
import { getSF10RowsForGrade } from '../lib/subjectConfig';

interface BoundData {
    [key: string]: unknown;
}

type AnyObject = Record<string, unknown>;

const asString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
};

interface SF10SpecRendererProps {
    pageNumber: number;
    data: BoundData;
    onUpdate?: (path: string, value: string) => void;
}

const AutoShrinkText: React.FC<{ text: string; minScale?: number }> = ({ text, minScale = 0.5 }) => {
    const [scale, setScale] = React.useState(1);
    const textRef = React.useRef<HTMLSpanElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        if (textRef.current && containerRef.current) {
            const textWidth = textRef.current.scrollWidth;
            const containerWidth = containerRef.current.clientWidth;
            if (textWidth > containerWidth && containerWidth > 0) {
                setScale(Math.max(minScale, containerWidth / textWidth));
            } else {
                setScale(1);
            }
        }
    }, [text]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-end justify-center overflow-hidden relative">
            <span 
                ref={textRef} 
                className="inline-block whitespace-nowrap"
                style={{ 
                    transform: `scaleX(${scale})`, 
                    transformOrigin: 'center bottom',
                }}
            >
                {text}
            </span>
        </div>
    );
};

export const SF10SpecRenderer: React.FC<SF10SpecRendererProps> = ({ pageNumber, data, onUpdate }) => {
    
    // Helper to resolve nested data paths (e.g., 'learner.lastName')
    const getRaw = (path: string): unknown => {
        if (!path) return '';
        
        // Priority 1: Check if the exact path exists as a key (for overrides)
        if (data[path] !== undefined) return data[path];

        const parts = path.split('.');
        let current: unknown = data;
        for (const part of parts) {
            if (!current) break;
            const currentObj = current as Record<string, unknown>;
            if (part.includes('[')) {
                const [p, rest] = part.split('[');
                const idx = parseInt(rest.replace(']', ''));
                const listValue = currentObj[p];
                current = Array.isArray(listValue) ? listValue[idx] : undefined;
            } else {
                current = currentObj[part];
            }
        }
        return current ?? '';
    };

    const getVal = (path: string): string => asString(getRaw(path));

    const getLearningAreaIndentClass = (row: { label?: string; indent?: boolean }) => {
        if (!row.indent) return 'font-bold';
        const label = String(row.label || '').trim();
        if (label === 'Music and Arts' || label === 'Physical Education and Health') {
            return 'pl-[30px]';
        }
        return 'pl-10';
    };

    // Date Formatter (Ensures mm/dd/yyyy)
    const formatDate = (val: unknown): string => {
        if (!val || val === 'HIDDEN') return '';
        if (typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
        try {
            if (!(typeof val === 'string' || typeof val === 'number' || val instanceof Date)) {
                return asString(val);
            }
            const d = new Date(val);
            if (isNaN(d.getTime())) return asString(val);
            const mm = (d.getMonth() + 1).toString().padStart(2, '0');
            const dd = d.getDate().toString().padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${mm}/${dd}/${yyyy}`;
        } catch {
            return asString(val);
        }
    };

    // Correct Base URL for assets
    const baseUrl = import.meta.env.BASE_URL || '/';
    const logoLeft = `${baseUrl}deped_logo_left.png`;
    const logoRight = `${baseUrl}deped_logo_right.png`;

    // PAGE 2 (High-Fidelity Implementation)
    if (pageNumber === 2) {
        return (
            <div className="sf10-container bg-white flex flex-col items-center font-['Arial_Narrow',Arial,sans-serif] antialiased p-8 print:p-0">
                <div className="page w-[8.5in] h-[12.95in] bg-white p-[20pt_0.35in_0.3in_0.35in] flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none leading-[1.1]">
                    <style dangerouslySetInnerHTML={{ __html: `
                        @page { size: 8.5in 13in; margin: 0in; }
                        body { font-family: "Arial Narrow", Arial, sans-serif; font-stretch: condensed; }
                        .fill-blank { 
                            border-bottom: 1px solid black; 
                            display: inline-flex; 
                            align-items: flex-end; 
                            justify-content: center !important;
                            white-space: nowrap; 
                            overflow: hidden; 
                            padding-bottom: -1px;
                            font-family: inherit;
                            font-stretch: condensed;
                            font-weight: bold !important;
                            text-align: center !important;
                        }
                        .sf-header-shade { background-color: #C4BD97 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .excel-table { width: 100%; border-collapse: collapse; border: 1px solid black; }
                        .excel-table th, .excel-table td { border: 1px solid black !important; padding: 0px 4px; height: 14px; min-height: 14px; font-size: 10px; }
                        .border-thick { border: 1.5pt solid black !important; }
                        .border-thick-b { border-bottom: 1.5pt solid black !important; }
                        .h-spacer td { height: 3pt !important; min-height: 0 !important; padding: 0 !important; line-height: 0; }
                        .h-subject-row td { height: 14px !important; min-height: 14px !important; padding: 0px 4px !important; }
                    ` }} />

                    <div className="flex-grow">
                        {/* Page 2 Header */}
                        <div className="flex justify-between items-start mb-0 px-1 text-[10px] font-bold mt-1">
                            <div>SF10-JHS</div>
                            <div>Page 2 of <span className="fill-blank min-w-[20px]"></span></div>
                        </div>

                        {[2, 3, 4].map((blockIdx) => (
                            <div key={blockIdx} className="mt-1 mb-1 border-thick overflow-hidden">
                                <div className="p-0 text-[11px]">
                                    <div className="px-2 py-1 space-y-0.5 border-thick-b">
                                        <div className="flex items-end mb-0.5 flex-nowrap shrink-0">
                                            <span className="mr-1 whitespace-nowrap">School:</span>
                                            <span className="fill-blank flex-grow uppercase px-1" style={{ fontWeight: 'bold' }}>{getVal(`scholasticRecords[${blockIdx}].schoolName`)}</span>
                                            <span className="mx-1 whitespace-nowrap">School ID:</span>
                                            <span className="fill-blank min-w-[60px] px-1 uppercase">{getVal(`scholasticRecords[${blockIdx}].schoolId`)}</span>
                                            <span className="mx-1 whitespace-nowrap">District:</span>
                                            <span className="fill-blank min-w-[80px] px-1 uppercase">{getVal(`scholasticRecords[${blockIdx}].district`)}</span>
                                            <span className="mx-1 whitespace-nowrap">Division:</span>
                                            <span className="fill-blank min-w-[100px] px-1 uppercase text-center">
                                                {getVal(`scholasticRecords[${blockIdx}].division`).replace(/Division of/i, '').trim()}
                                            </span>
                                            <span className="mx-1 whitespace-nowrap">Region:</span>
                                            <span className="fill-blank min-w-[30px] px-1 uppercase">
                                                {getVal(`scholasticRecords[${blockIdx}].region`).replace(/Region/i, '').trim()}
                                            </span>
                                        </div>
                                        <div className="flex items-end mb-0.5 flex-nowrap shrink-0">
                                            <span className="mr-1 whitespace-nowrap">Classified as Grade:</span>
                                            <span className="fill-blank min-w-[30px] px-1 uppercase">{getVal(`scholasticRecords[${blockIdx}].gradeLevel`)}</span>
                                            <span className="mx-1 whitespace-nowrap">Section:</span>
                                            <span className="fill-blank flex-grow uppercase px-1">{getVal(`scholasticRecords[${blockIdx}].section`)}</span>
                                            <span className="mx-1 whitespace-nowrap">School Year:</span>
                                            <span className="fill-blank min-w-[70px] px-1 uppercase">{getVal(`scholasticRecords[${blockIdx}].schoolYear`)}</span>
                                            <span className="mx-1 whitespace-nowrap">Name of Adviser/Teacher:</span>
                                            <span className="fill-blank flex-grow uppercase px-1">{getVal(`scholasticRecords[${blockIdx}].adviserTeacher`)}</span>
                                            <span className="mx-1 whitespace-nowrap">Signature:</span>
                                            <span className="fill-blank min-w-[30px] flex-grow"></span>
                                        </div>
                                    </div>
                                    
                                    {/* Grades Table */}
                                    <table className="excel-table text-[11px] text-center border-b-0 border-t-0 border-black">
                                        <thead className="bg-white font-bold">
                                            <tr className="h-[17px]">
                                                <td rowSpan={2} className="w-[30%] border-r-black border-r">LEARNING AREAS</td>
                                                <td colSpan={3} className="border-l-black border-l">Term Rating</td>
                                                <td rowSpan={2} className="w-[10%] leading-tight">FINAL<br/>RATING</td>
                                                <td rowSpan={2} className="w-[16%]">REMARKS</td>
                                            </tr>
                                            <tr className="h-[17px] text-[10px]">
                                                <td className="w-[8%] border-l-black border-l">1</td>
                                                <td className="w-[8%]">2</td>
                                                <td className="w-[8%]">3</td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const rawGrade = getVal(`scholasticRecords[${blockIdx}].gradeLevel`) || '';
                                                const rawGradeLevelNum = Number(getRaw(`scholasticRecords[${blockIdx}].gradeLevelNum`));
                                                const gradeNum = Number.isFinite(rawGradeLevelNum) && rawGradeLevelNum > 0
                                                    ? rawGradeLevelNum
                                                    : parseInt(rawGrade.replace(/\D/g, '')) || 0;
                                                
                                                const customCurriculum = (getRaw('curriculum') as any);
                                                const rows = getSF10RowsForGrade(gradeNum, customCurriculum);
                                                
                                                return rows.map((row, rIdx) => {
                                                    const sub = (getRaw(`scholasticRecords[${blockIdx}].subjects.${row.key}`) as AnyObject) || {};
                                                    return (
                                                        <tr key={rIdx} className="h-subject-row">
                                                            <td className={`text-left ${getLearningAreaIndentClass(row)}`}>
                                                                {row.key.startsWith('extra') ? (
                                                                    <input 
                                                                        type="text" 
                                                                        className="w-full border-none bg-transparent focus:outline-none uppercase"
                                                                        value={getVal(`scholasticRecords[${blockIdx}].subjects.${row.key}_label`)}
                                                                        onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}_label`, e.target.value)}
                                                                    />
                                                                ) : row.label}
                                                            </td>
                                                            <td>{asString(sub.q1)}</td>
                                                            <td>{asString(sub.q2)}</td>
                                                            <td>{asString(sub.q3)}</td>
                                                            <td className="font-bold">{asString(sub.finalRating)}</td>
                                                            <td className="uppercase text-[9px]">{asString(sub.remarks)}</td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                    <tr className="font-bold h-[15px]">
                                        <td></td>
                                        <td colSpan={3} className="text-center uppercase">General Average</td>
                                        <td>{getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`)}</td>
                                        <td className="uppercase text-[9px]">
                                            {parseFloat(getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`)) >= 75 ? 'PASSED' : ''}
                                        </td>
                                    </tr>
                                    <tr className="h-spacer sf-header-shade border-thick-b">
                                        <td colSpan={7}></td>
                                    </tr>
                                </tbody>
                            </table>

                                    {/* Remedial Table */}
                                    <table className="excel-table text-[11px] text-center border-b-0 border-t-0 border-black mt-[-1px]">
                                        <thead className="bg-white font-bold">
                                            <tr className="bg-white">
                                                <td className="text-center py-[2px] px-2 italic uppercase text-[9px]">Remedial Classes</td>
                                                <td colSpan={4} className="text-left py-[2px] px-2 text-[9px]">
                                                    <span className="font-normal normal-case text-[10px]">Conducted from (mm/dd/yyyy) </span><span className="fill-blank w-24"></span>
                                                    <span className="font-normal normal-case text-[10px] ml-6">to (mm/dd/yyyy) </span><span className="fill-blank w-24"></span>
                                                </td>
                                            </tr>
                                            <tr className="uppercase text-[9px] h-[17px]">
                                                <td className="w-[30%]">Learning Areas</td>
                                                <td className="w-[15%]">Final Rating</td>
                                                <td className="w-[20%]">Remedial Class Mark</td>
                                                <td className="w-[20%] uppercase text-[8px]">Recomputed Final Grade</td>
                                                <td className="w-[15%]">Remarks</td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="h-[15px]"><td></td><td></td><td></td><td></td><td></td></tr>
                                            <tr className="h-[15px]"><td></td><td></td><td></td><td></td><td></td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}

                        {/* JHS Completion / Transfer Label */}
                        <div className="text-[10px] font-bold mt-0 px-1 uppercase leading-tight">For Transfer Out / JHS Completer Only</div>

                        {/* Page 2 Certification */}
                        <div className="mt-0 mb-1 border-thick bg-white overflow-hidden">
                            <div className="text-center font-bold sf-header-shade border-thick-b py-0 text-[14pt]">CERTIFICATION</div>
                            <div className="p-1 px-4 text-[11px] leading-relaxed">
                                <div className="flex items-end mb-0 mt-0 flex-nowrap shrink-0">
                                    <span className="mr-1 whitespace-nowrap">I CERTIFY that this is a true record of</span>
                                    <span className="fill-blank flex-grow uppercase px-2" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                        <input 
                                            type="text"
                                            className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                            value={getVal('certification.page2.recordOf')}
                                            onChange={(e) => onUpdate?.('certification.page2.recordOf', e.target.value)}
                                            placeholder="Enter Name"
                                        />
                                    </span>
                                    <span className="mx-1 whitespace-nowrap">with LRN</span>
                                    <span className="fill-blank min-w-[120px] px-2 uppercase" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                        <input 
                                            type="text"
                                            className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                            value={getVal('certification.page2.lrn')}
                                            onChange={(e) => onUpdate?.('certification.page2.lrn', e.target.value)}
                                            placeholder="LRN"
                                        />
                                    </span>
                                    <span className="mx-1 whitespace-nowrap">and that he/she is eligible for admission to Grade</span>
                                    <span className="fill-blank min-w-[30px] px-1 uppercase" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                        <input 
                                            type="text"
                                            className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                            value={getVal('certification.page2.admissionGrade')}
                                            onChange={(e) => onUpdate?.('certification.page2.admissionGrade', e.target.value)}
                                            placeholder="G"
                                        />
                                    </span>
                                </div>
                                <div className="flex items-end mb-1 mt-0 flex-nowrap shrink-0">
                                    <span className="mr-1 whitespace-nowrap">Name of School:</span>
                                    <span className="fill-blank flex-grow uppercase px-2" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                        <input 
                                            type="text"
                                            className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                            value={getVal('certification.page2.schoolName')}
                                            onChange={(e) => onUpdate?.('certification.page2.schoolName', e.target.value)}
                                            placeholder="Enter School Name"
                                        />
                                    </span>
                                    <span className="mx-1 whitespace-nowrap">School ID:</span>
                                    <span className="fill-blank min-w-[80px] px-1 uppercase" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                        <input 
                                            type="text"
                                            className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                            value={getVal('certification.page2.schoolId')}
                                            onChange={(e) => onUpdate?.('certification.page2.schoolId', e.target.value)}
                                            placeholder="ID"
                                        />
                                    </span>
                                    <span className="mx-1 whitespace-nowrap">Last School Year Attended:</span>
                                    <span className="fill-blank min-w-[80px] px-1 uppercase" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                        <input 
                                            type="text"
                                            className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                            value={getVal('certification.page2.lastSchoolYearAttended')}
                                            onChange={(e) => onUpdate?.('certification.page2.lastSchoolYearAttended', e.target.value)}
                                            placeholder="YYYY-YYYY"
                                        />
                                    </span>
                                </div>
                                <div className="flex justify-between items-end mt-3 px-4 pb-0">
                                    <div className="min-w-[100px] text-center relative group">
                                        <div className="border-b border-black w-full mb-[2px] min-h-[15px] font-bold text-center flex justify-center uppercase px-2">
                                            <input 
                                                type="text"
                                                className={`border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent ${getVal('certification.page2.date') === 'HIDDEN' ? 'opacity-0' : 'opacity-100'}`}
                                                value={formatDate(getVal('certification.page2.date'))}
                                                onChange={(e) => onUpdate?.('certification.page2.date', e.target.value)}
                                                placeholder="MM/DD/YYYY"
                                            />
                                        </div>
                                        <div className="text-[11px] uppercase">Date</div>
                                        
                                        {/* Visibility Toggle */}
                                        <button 
                                            onClick={() => {
                                                const current = getVal('certification.page2.date');
                                                onUpdate?.('certification.page2.date', current === 'HIDDEN' ? '' : 'HIDDEN');
                                            }}
                                            className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 p-1 text-[10px] text-gray-400 hover:text-blue-500 print:hidden transition-opacity"
                                            title="Toggle Visibility"
                                        >
                                            {getVal('certification.page2.date') === 'HIDDEN' ? '👁️' : '✕'}
                                        </button>
                                    </div>
                                    <div className="flex-grow mx-8 text-center">
                                        <div className="border-b border-black w-full mb-[2px] min-h-[15px] flex items-center justify-center">
                                            <input 
                                                type="text"
                                                className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent text-[11px]"
                                                value={getVal('certification.page2.principalSignatureName')}
                                                onChange={(e) => onUpdate?.('certification.page2.principalSignatureName', e.target.value)}
                                                placeholder="Principal / School Head Name"
                                            />
                                        </div>
                                        <div className="text-[11px] uppercase leading-tight pt-1">Signature of Principal/School Head over Printed Name</div>
                                    </div>
                                    <div className="w-[150px] text-center pb-[2px]">
                                        <div className="text-[11px] uppercase">(Affix School Seal Here)</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Page 2 Footer Metadata */}
                        <div className="flex justify-between items-end mt-2 px-1 text-[8px] italic shrink-0">
                            <div>(May add Certification box if needed)</div>
                            <div>Revised 2025 based on DepEd Order No. 10, s. 2024</div>
                        </div>

                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @page { size: 8.5in 13in; margin: 0mm; }
                    @media print {
                        html, body { height: 13in !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
                        .sf10-container { background: white !important; padding: 0 !important; margin: 0 !important; height: 13in !important; min-height: 13in !important; display: block !important; overflow: hidden !important; }
                        .page { box-shadow: none !important; margin: 0 !important; padding: 5pt 0.35in 0.35in 0.35in !important; height: 12.95in !important; width: 8.5in !important; display: block !important; break-after: avoid-page !important; position: relative !important; }
                    }
                ` }} />
            </div>
        );
    }

    // PAGE 1 (Matching User Template Exactly)
    return (
        <div className="sf10-container bg-white flex flex-col items-center font-['Arial_Narrow',Arial,sans-serif] antialiased p-8 print:p-0">
            
            <div className="page w-[8.5in] h-[12.95in] bg-white p-[30pt_0.35in_0.2in_0.35in] flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none leading-[1.1]">
                <style dangerouslySetInnerHTML={{ __html: `
                    @page { size: 8.5in 13in; margin: 0in; }
                    body { font-family: "Arial Narrow", Arial, sans-serif; font-stretch: condensed; }
                    .fill-blank { 
                        border-bottom: 1px solid black; 
                        display: inline-flex; 
                        align-items: flex-end; 
                        justify-content: center !important;
                        white-space: nowrap; 
                        overflow: hidden; 
                        padding-bottom: -1px;
                        font-family: inherit;
                        font-stretch: condensed;
                        font-weight: bold !important;
                        text-align: center !important;
                    }
                    .sf-header-shade { background-color: #C4BD97 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .excel-table { width: 100%; border-collapse: collapse; border: 1px solid black; }
                    .excel-table th, .excel-table td { border: 1px solid black !important; padding: 0px 4px; height: 14px; min-height: 14px; font-size: 10px; }
                    .border-thick { border: 1.5pt solid black !important; }
                    .border-thick-b { border-bottom: 1.5pt solid black !important; }
                    .h-spacer td { height: 3pt !important; min-height: 0 !important; padding: 0 !important; line-height: 0; }
                ` }} />

                <div className="flex-grow">
                    {/* Header */}
                    <div className="flex items-start mb-1 relative h-20">
                        <div className="absolute top-0 left-0 w-24">
                            <div className="text-[10px] font-bold">SF10-JHS</div>
                            <img src={logoLeft} alt="Logo Left" className="h-11 mx-auto mt-1" />
                        </div>
                        <div className="w-full text-center leading-tight">
                            <div className="text-[11px] mb-0.5">Republic of the Philippines</div>
                            <div className="text-[11px] mb-0.5">Department of Education</div>
                            <div className="text-[13px] font-bold mt-1 uppercase tracking-tight leading-none px-20">
                                Learner Permanent Academic Record for Junior High School (SF10-JHS)
                            </div>
                            <div className="text-[10px] italic">(Formerly Form 137)</div>
                        </div>
                        <div className="absolute top-0 right-0 w-24">
                            <img src={logoRight} alt="Logo Right" className="h-14 mx-auto" />
                        </div>
                    </div>

                    {/* Learner's Information */}
                    <div className="mt-1 mb-1 border-thick overflow-hidden">
                        <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[14pt]">LEARNER'S INFORMATION</div>
                        <div className="p-1 px-4 text-[11px]">
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap">LAST NAME:</span>
                                <span className="fill-blank min-w-[120px] px-2 uppercase" style={{ fontWeight: 'bold' }}>{getVal('learner.lastName')}</span>
                                <span className="mx-1 whitespace-nowrap">FIRST NAME:</span>
                                <span className="fill-blank flex-grow px-2 uppercase" style={{ fontWeight: 'bold' }}>{getVal('learner.firstName')}</span>
                                <span className="mx-1 whitespace-nowrap">NAME EXTN. (Jr,I,II):</span>
                                <span className="fill-blank min-w-[50px] px-1 uppercase">{getVal('learner.nameExtension')}</span>
                                <span className="mx-1 whitespace-nowrap">MIDDLE NAME:</span>
                                <span className="fill-blank min-w-[100px] px-2 uppercase">{getVal('learner.middleName')}</span>
                            </div>
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap">Learner Reference Number (LRN):</span>
                                <span className="fill-blank min-w-[150px] px-4 uppercase" style={{ fontWeight: 'bold', fontSize: '12px' }}>{getVal('learner.lrn')}</span>
                                <span className="mx-4 whitespace-nowrap">Birthdate (mm/dd/yyyy):</span>
                                <span className="fill-blank min-w-[100px] px-2 uppercase">{formatDate(getVal('learner.birthdate'))}</span>
                                <span className="mx-4 whitespace-nowrap">Sex:</span>
                                <span className="fill-blank flex-grow px-1 uppercase">{getVal('learner.sex')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Eligibility */}
                    <div className="mt-1 mb-1 border-thick overflow-hidden">
                        <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[14pt]">ELIGIBILITY FOR JHS ENROLMENT</div>
                        <div className="p-1 px-2 text-[10pt]">
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <div className="w-3 h-3 border border-black mb-[2px] mr-2 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {getRaw('eligibility.elementaryCompleter.checked') ? '✓' : ''}
                                </div>
                                <span className="mr-1 whitespace-nowrap">Elementary School Completer</span>
                                <span className="mx-1 whitespace-nowrap">General Average:</span>
                                <span className="fill-blank min-w-[40px] px-1 uppercase text-[9pt]">
                                    <AutoShrinkText text={getVal('eligibility.elementaryCompleter.generalAverage')} />
                                </span>
                                <span className="mx-2 whitespace-nowrap">Citation (if any):</span>
                                <span className="fill-blank flex-grow px-1 uppercase text-[9pt]">
                                    <AutoShrinkText text={getVal('eligibility.elementaryCompleter.citation')} />
                                </span>
                            </div>
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap">Name of Elementary School:</span>
                                <span className="fill-blank min-w-[150px] flex-grow px-2 uppercase text-[9pt]">
                                    <AutoShrinkText text={getVal('eligibility.nameOfElementarySchool')} />
                                </span>
                                <span className="mx-2 whitespace-nowrap">School ID:</span>
                                <span className="fill-blank min-w-[60px] px-1 uppercase text-[9pt]">
                                    <AutoShrinkText text={getVal('eligibility.schoolId')} />
                                </span>
                                <span className="mx-2 whitespace-nowrap">Address of School:</span>
                                <span className="fill-blank flex-grow px-2 uppercase leading-none text-[9pt]">
                                    <AutoShrinkText text={getVal('eligibility.addressOfSchool')} />
                                </span>
                            </div>
                            <div className="flex items-end mb-0 flex-nowrap shrink-0">
                                <div className="w-3 h-3 border border-black mb-[2px] mr-2 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {getRaw('eligibility.peptPasser.checked') ? '✓' : ''}
                                </div>
                                <span className="mr-1 whitespace-nowrap">PEPT Passer</span>
                                <span className="mx-2 whitespace-nowrap">Rating:</span>
                                <span className="fill-blank min-w-[50px] px-1 uppercase text-[9pt]">
                                    <AutoShrinkText text={getVal('eligibility.peptPasser.rating')} />
                                </span>
                                <div className="w-3 h-3 border border-black mb-[2px] ml-4 mr-2 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {getRaw('eligibility.alsPasser.checked') ? '✓' : ''}
                                </div>
                                <span className="mr-1 whitespace-nowrap">ALS A&E Passer</span>
                                <span className="mx-2 whitespace-nowrap">Rating:</span>
                                <span className="fill-blank min-w-[50px] px-1 uppercase text-[9pt]">
                                    <AutoShrinkText text={getVal('eligibility.alsPasser.rating')} />
                                </span>
                                <div className="w-3 h-3 border border-black mb-[2px] ml-4 mr-2 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {getRaw('eligibility.other.checked') ? '✓' : ''}
                                </div>
                                <span className="mr-1 whitespace-nowrap">Others (Specify):</span>
                                <span className="fill-blank min-w-[80px] flex-grow px-1 uppercase text-[9pt]">
                                    <AutoShrinkText text={getVal('eligibility.other.specify')} />
                                </span>
                            </div>
                            <div className="flex items-end mb-1 mt-1 flex-nowrap shrink-0">
                                <span className="mr-2 whitespace-nowrap">Date of Examination/Assessment (mm/dd/yyyy):</span>
                                <span className="fill-blank min-w-[100px] px-2 uppercase text-[9pt]">
                                    <AutoShrinkText text={formatDate(getVal('eligibility.dateOfExamination'))} />
                                </span>
                                <span className="mx-2 whitespace-nowrap">Name and Address of Testing Center:</span>
                                <span className="fill-blank flex-grow px-2 uppercase text-[9pt]" style={{ fontWeight: 'bold' }}>
                                    <AutoShrinkText text={getVal('eligibility.testingCenter') || getVal('eligibility.nameAndAddressOfTestingCenter')} />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Scholastic Record Blocks (Page 1: Indices 0, 1) */}
                    {[0, 1].map((blockIdx) => (
                        <div key={blockIdx} className="mt-1 mb-1 border-thick overflow-hidden">
                        {blockIdx === 0 && (
                            <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[12pt]">SCHOLASTIC RECORD</div>
                        )}
                            <div className="p-0 text-[11px]">
                                <div className="px-2 py-1 space-y-0.5 border-thick-b">
                                    <div className="flex items-end mb-0.5 flex-nowrap shrink-0">
                                        <span className="mr-1 whitespace-nowrap">School:</span>
                                        <span className="fill-blank flex-grow uppercase px-1" style={{ fontWeight: 'bold' }}>{getVal(`scholasticRecords[${blockIdx}].schoolName`)}</span>
                                        <span className="mx-1 whitespace-nowrap">School ID:</span>
                                        <span className="fill-blank min-w-[60px] px-1 uppercase">{getVal(`scholasticRecords[${blockIdx}].schoolId`)}</span>
                                        <span className="mx-1 whitespace-nowrap">District:</span>
                                        <span className="fill-blank min-w-[80px] px-1 uppercase">{getVal(`scholasticRecords[${blockIdx}].district`)}</span>
                                        <span className="mx-1 whitespace-nowrap">Division:</span>
                                        <span className="fill-blank min-w-[100px] px-1 uppercase text-center">
                                            {getVal(`scholasticRecords[${blockIdx}].division`).replace(/Division of/i, '').trim()}
                                        </span>
                                        <span className="mx-1 whitespace-nowrap">Region:</span>
                                        <span className="fill-blank min-w-[30px] px-1 uppercase">
                                            {getVal(`scholasticRecords[${blockIdx}].region`).replace(/Region/i, '').trim()}
                                        </span>
                                    </div>
                                    <div className="flex items-end mb-0.5 flex-nowrap shrink-0">
                                        <span className="mr-1 whitespace-nowrap">Classified as Grade:</span>
                                        <span className="fill-blank min-w-[30px] px-1 uppercase">{getVal(`scholasticRecords[${blockIdx}].gradeLevel`)}</span>
                                        <span className="mx-1 whitespace-nowrap">Section:</span>
                                        <span className="fill-blank flex-grow uppercase px-1">{getVal(`scholasticRecords[${blockIdx}].section`)}</span>
                                        <span className="mx-1 whitespace-nowrap">School Year:</span>
                                        <span className="fill-blank min-w-[70px] px-1 uppercase">{getVal(`scholasticRecords[${blockIdx}].schoolYear`)}</span>
                                        <span className="mx-1 whitespace-nowrap">Name of Adviser/Teacher:</span>
                                        <span className="fill-blank flex-grow uppercase px-1">{getVal(`scholasticRecords[${blockIdx}].adviserTeacher`)}</span>
                                        <span className="mx-1 whitespace-nowrap">Signature:</span>
                                        <span className="fill-blank min-w-[30px] flex-grow"></span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Grades Table */}
                            <table className="excel-table text-[11px] text-center border-b-0 border-t-0 border-black">
                                <thead className="bg-white font-bold">
                                    <tr className="h-[17px]">
                                        <td rowSpan={2} className="w-[30%] border-r-black border-r">LEARNING AREAS</td>
                                        <td colSpan={3} className="border-l-black border-l">Term Rating</td>
                                        <td rowSpan={2} className="w-[10%] leading-tight">FINAL<br/>RATING</td>
                                        <td rowSpan={2} className="w-[16%]">REMARKS</td>
                                    </tr>
                                    <tr className="h-[17px] text-[10px]">
                                        <td className="w-[8%] border-l-black border-l">1</td>
                                        <td className="w-[8%]">2</td>
                                        <td className="w-[8%]">3</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const rawGrade = getVal(`scholasticRecords[${blockIdx}].gradeLevel`) || '';
                                        const rawGradeLevelNum = Number(getRaw(`scholasticRecords[${blockIdx}].gradeLevelNum`));
                                        const gradeNum = Number.isFinite(rawGradeLevelNum) && rawGradeLevelNum > 0
                                            ? rawGradeLevelNum
                                            : parseInt(rawGrade.replace(/\D/g, '')) || 0;
                                        
                                        const customCurriculum = (getRaw('curriculum') as any);
                                        const rows = getSF10RowsForGrade(gradeNum, customCurriculum);
                                        
                                        return rows.map((row, rIdx) => {
                                            const sub = (getRaw(`scholasticRecords[${blockIdx}].subjects.${row.key}`) as AnyObject) || {};
                                            return (
                                                <tr key={rIdx} className="h-subject-row">
                                                    <td className={`text-left ${getLearningAreaIndentClass(row)}`}>
                                                        {row.key.startsWith('extra') ? (
                                                            <input 
                                                                type="text" 
                                                                className="w-full border-none bg-transparent focus:outline-none uppercase"
                                                                value={getVal(`scholasticRecords[${blockIdx}].subjects.${row.key}_label`)}
                                                                onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}_label`, e.target.value)}
                                                            />
                                                        ) : row.label}
                                                    </td>
                                                    <td>{asString(sub.q1)}</td>
                                                    <td>{asString(sub.q2)}</td>
                                                    <td>{asString(sub.q3)}</td>
                                                    <td className="font-bold">{asString(sub.finalRating)}</td>
                                                    <td className="uppercase text-[9px]">{asString(sub.remarks)}</td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                    <tr className="font-bold h-[16px]">
                                        <td></td>
                                        <td colSpan={3} className="text-center uppercase">General Average</td>
                                        <td>{getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`)}</td>
                                        <td className="uppercase text-[9px]">
                                            {parseFloat(getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`)) >= 75 ? 'PASSED' : ''}
                                        </td>
                                    </tr>
                                    <tr className="h-spacer sf-header-shade border-thick-b">
                                        <td colSpan={7}></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Remedial Table */}
                            <table className="excel-table text-[11px] text-center border-b-0 border-t-0 border-black mt-[-1px]">
                                <thead className="bg-white font-bold">
                                    <tr className="bg-white">
                                        <td className="text-center py-[2px] px-2 italic uppercase text-[9px]">Remedial Classes</td>
                                        <td colSpan={4} className="text-left py-[2px] px-2 text-[9px]">
                                            <span className="font-normal normal-case text-[10px]">Conducted from (mm/dd/yyyy) </span><span className="fill-blank w-24"></span>
                                            <span className="font-normal normal-case text-[10px] ml-6">to (mm/dd/yyyy) </span><span className="fill-blank w-24"></span>
                                        </td>
                                    </tr>
                                    <tr className="uppercase text-[9px] h-[17px]">
                                        <td className="w-[30%]">Learning Areas</td>
                                        <td className="w-[15%]">Final Rating</td>
                                        <td className="w-[20%]">Remedial Class Mark</td>
                                        <td className="w-[20%] uppercase text-[8px]">Recomputed Final Grade</td>
                                        <td className="w-[15%]">Remarks</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="h-[15px]"><td></td><td></td><td></td><td></td><td></td></tr>
                                    <tr className="h-[15px]"><td></td><td></td><td></td><td></td><td></td></tr>
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {/* Certification */}
                    <div className="mt-1 mb-1 border-thick bg-white overflow-hidden">
                        <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[12pt]">CERTIFICATION</div>
                        <div className="p-2 px-4 text-[11px] leading-relaxed">
                            <div className="flex items-end mb-0 mt-0 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap">I CERTIFY that this is a true record of</span>
                                <span className="fill-blank flex-grow uppercase px-2" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                    <input 
                                        type="text"
                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                        value={getVal('certification.page1.recordOf')}
                                        onChange={(e) => onUpdate?.('certification.page1.recordOf', e.target.value)}
                                        placeholder="Enter Name"
                                    />
                                </span>
                                <span className="mx-1 whitespace-nowrap">with LRN</span>
                                <span className="fill-blank min-w-[120px] px-2 uppercase" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                    <input 
                                        type="text"
                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                        value={getVal('certification.page1.lrn')}
                                        onChange={(e) => onUpdate?.('certification.page1.lrn', e.target.value)}
                                        placeholder="LRN"
                                    />
                                </span>
                                <span className="mx-1 whitespace-nowrap">and that he/she is eligible for admission to Grade</span>
                                <span className="fill-blank min-w-[30px] px-1 uppercase" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                    <input 
                                        type="text"
                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                        value={getVal('certification.page1.admissionGrade')}
                                        onChange={(e) => onUpdate?.('certification.page1.admissionGrade', e.target.value)}
                                        placeholder="G"
                                    />
                                </span>
                            </div>
                            <div className="flex items-end mb-1 mt-0 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap">Name of School:</span>
                                <span className="fill-blank flex-grow uppercase px-2" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                    <input 
                                        type="text"
                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                        value={getVal('certification.page1.schoolName')}
                                        onChange={(e) => onUpdate?.('certification.page1.schoolName', e.target.value)}
                                        placeholder="Enter School Name"
                                    />
                                </span>
                                <span className="mx-1 whitespace-nowrap">School ID:</span>
                                <span className="fill-blank min-w-[80px] px-1 uppercase" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                    <input 
                                        type="text"
                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                        value={getVal('certification.page1.schoolId')}
                                        onChange={(e) => onUpdate?.('certification.page1.schoolId', e.target.value)}
                                        placeholder="ID"
                                    />
                                </span>
                                <span className="mx-1 whitespace-nowrap">Last School Year Attended:</span>
                                <span className="fill-blank min-w-[80px] px-1 uppercase" style={{ fontWeight: 'bold', justifyContent: 'center', textAlign: 'center' }}>
                                    <input 
                                        type="text"
                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent"
                                        value={getVal('certification.page1.lastSchoolYearAttended')}
                                        onChange={(e) => onUpdate?.('certification.page1.lastSchoolYearAttended', e.target.value)}
                                        placeholder="YYYY-YYYY"
                                    />
                                </span>
                            </div>
                            <div className="flex justify-between items-end mt-3 px-4 pb-0">
                                <div className="min-w-[100px] text-center relative group">
                                    <div className="border-b border-black w-full mb-[2px] min-h-[12px] font-bold text-center flex justify-center uppercase px-2">
                                        <input 
                                            type="text"
                                            className={`border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent ${getVal('certification.page1.date') === 'HIDDEN' ? 'opacity-0' : 'opacity-100'}`}
                                            value={formatDate(getVal('certification.page1.date'))}
                                            onChange={(e) => onUpdate?.('certification.page1.date', e.target.value)}
                                            placeholder="MM/DD/YYYY"
                                        />
                                    </div>
                                    <div className="text-[11px] uppercase">Date</div>
                                    
                                    {/* Visibility Toggle */}
                                    <button 
                                        onClick={() => {
                                            const current = getVal('certification.page1.date');
                                            onUpdate?.('certification.page1.date', current === 'HIDDEN' ? '' : 'HIDDEN');
                                        }}
                                        className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 p-1 text-[10px] text-gray-400 hover:text-blue-500 print:hidden transition-opacity"
                                        title="Toggle Visibility"
                                    >
                                        {getVal('certification.page1.date') === 'HIDDEN' ? '👁️' : '✕'}
                                    </button>
                                </div>
                                <div className="flex-grow mx-8 text-center">
                                    <div className="border-b border-black w-full mb-[2px] min-h-[12px] flex items-center justify-center">
                                        <input 
                                            type="text"
                                            className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none placeholder:text-gray-300 print:placeholder:text-transparent text-[11px]"
                                            value={getVal('certification.page1.principalSignatureName')}
                                            onChange={(e) => onUpdate?.('certification.page1.principalSignatureName', e.target.value)}
                                            placeholder="Principal / School Head Name"
                                        />
                                    </div>
                                    <div className="text-[11px] uppercase leading-tight pt-1">Signature of Principal/School Head over Printed Name</div>
                                </div>
                                <div className="w-[150px] text-center pb-[2px]">
                                    <div className="text-[10px] uppercase">(Affix School Seal Here)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            
            <style dangerouslySetInnerHTML={{ __html: `
                @page { size: 8.5in 13in; margin: 0mm; }
                @media print {
                    html, body { height: 13in !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
                    .sf10-container { background: white !important; padding: 0 !important; margin: 0 !important; height: 13in !important; min-height: 13in !important; display: block !important; overflow: hidden !important; }
                    .page { box-shadow: none !important; margin: 0 !important; padding: 30pt 0.35in 0.1in 0.35in !important; height: 12.9in !important; width: 8.5in !important; display: block !important; break-after: avoid-page !important; position: relative !important; }
                }
            ` }} />
        </div>
    );
};

export default SF10SpecRenderer;
