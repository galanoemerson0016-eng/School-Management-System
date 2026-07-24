import React from 'react';
import { AutoShrinkText, asString, type SF10RendererProps } from './SF10Shared';

export const SF10SHSRenderer: React.FC<SF10RendererProps> = ({ pageNumber, data, onUpdate }) => {
    const getRaw = (path: string): unknown => {
        if (!path) return '';
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

    const baseUrl = import.meta.env.BASE_URL || '/';
    const logoLeft = `${baseUrl}deped_logo_left.png`;
    const logoRight = `${baseUrl}deped_logo_right.png`;

    const renderScholasticBlock = (blockIdx: number) => {
        // blockIdx: 0 -> Grade 11 Sem 1, 1 -> Grade 11 Sem 2, 2 -> Grade 12 Sem 1, 3 -> Grade 12 Sem 2
        return (
            <div className="border-thick bg-white overflow-hidden flex flex-col shadow-sm mb-1.5">
                <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[10.5pt] uppercase">
                    Scholastic Record
                </div>
                <div className="px-2 py-0.5 space-y-0 border-thick-b text-[10px] bg-white">
                    <div className="flex items-end flex-nowrap shrink-0 gap-1">
                        <span className="whitespace-nowrap">School:</span>
                        <span className="fill-blank flex-[1.7] uppercase font-bold text-[9.3px]">
                            <AutoShrinkText align="left" text={getVal(`scholasticRecords[${blockIdx}].schoolName`)} />
                        </span>
                        <span className="whitespace-nowrap ml-1">School ID:</span>
                        <span className="fill-blank min-w-14 px-1 uppercase font-bold text-[9.3px]">
                            <AutoShrinkText text={getVal(`scholasticRecords[${blockIdx}].schoolId`)} />
                        </span>
                        <span className="whitespace-nowrap ml-1">GRADE:</span>
                        <span className="fill-blank min-w-7.5 px-1 uppercase font-bold text-center text-[9.3px]">
                            {getVal(`scholasticRecords[${blockIdx}].gradeLevel`)}
                        </span>
                        <span className="whitespace-nowrap ml-1">SEM:</span>
                        <span className="fill-blank min-w-7.5 px-1 uppercase font-bold text-center text-[9.3px]">
                            {getVal(`scholasticRecords[${blockIdx}].semester`)}
                        </span>
                    </div>
                    <div className="flex items-end mb-0 flex-nowrap shrink-0 gap-1">
                        <span className="whitespace-nowrap">Track/Strand:</span>
                        <span className="fill-blank flex-[1.7] uppercase font-bold text-[9.3px]">
                            <AutoShrinkText align="left" text={`${getVal(`scholasticRecords[${blockIdx}].track`)} ${getVal(`scholasticRecords[${blockIdx}].strand`) ? `- ${getVal(`scholasticRecords[${blockIdx}].strand`)}` : ''}`} />
                        </span>
                        <span className="whitespace-nowrap ml-1">Section:</span>
                        <span className="fill-blank flex-1 uppercase font-bold text-[9.3px]">
                            <AutoShrinkText text={getVal(`scholasticRecords[${blockIdx}].section`)} />
                        </span>
                        <span className="whitespace-nowrap ml-1">School Year:</span>
                        <span className="fill-blank min-w-15 px-1 uppercase font-bold text-center text-[9.3px]">
                            {getVal(`scholasticRecords[${blockIdx}].schoolYear`)}
                        </span>
                    </div>
                </div>

                <table className="excel-table text-[10px] text-center border-none w-full">
                    <thead className="bg-white font-bold">
                        <tr className="h-3.25">
                            <td rowSpan={2} className="w-[10%] border-r-black border-r">INDICATOR</td>
                            <td rowSpan={2} className="w-[45%] border-r-black border-r">LEARNING AREAS</td>
                            <td colSpan={2} className="border-b-black border-b">Quarter</td>
                            <td rowSpan={2} className="w-[12%] leading-tight text-[8.8px] border-l-black border-l">SEM FINAL<br/>GRADE</td>
                            <td rowSpan={2} className="w-[15%]">ACTION<br/>TAKEN</td>
                        </tr>
                        <tr className="h-3.25 text-[8.3px]">
                            <td className="w-[9%] border-l-black border-l border-r-black border-r">1</td>
                            <td className="w-[9%]">2</td>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 11 }).map((_, rIdx) => {
                            const sub = getRaw(`scholasticRecords[${blockIdx}].subjects[${rIdx}]`) as Record<string, unknown> || {};
                            return (
                                <tr key={rIdx} className="h-3.75">
                                    <td className="uppercase text-[8.3px]">{asString(sub.subjectCode) || ''}</td>
                                    <td className="text-left px-1 font-bold truncate">
                                        {asString(sub.subjectName)}
                                    </td>
                                    <td>{asString(sub.quarter1Grade)}</td>
                                    <td>{asString(sub.quarter2Grade)}</td>
                                    <td className="font-bold">{asString(sub.finalGrade)}</td>
                                    <td className="uppercase text-[8.3px]">{asString(sub.remarks)}</td>
                                </tr>
                            );
                        })}
                        <tr className="font-bold h-3.75 border-t-black border-t">
                            <td colSpan={2} className="text-right italic font-bold text-[10.3px] px-2">General Average for the Semester</td>
                            <td colSpan={2}></td>
                            <td className="border-l-black border-l">
                                <input type="text" className="border-none bg-transparent w-full text-center font-bold focus:outline-none" 
                                    value={getVal(`scholasticRecords[${blockIdx}].generalAverage`)} 
                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].generalAverage`, e.target.value)} 
                                />
                            </td>
                            <td className="uppercase text-[8.3px]">
                                <input type="text" className="border-none bg-transparent w-full text-center font-bold focus:outline-none" 
                                    value={getVal(`scholasticRecords[${blockIdx}].generalAverageRemarks`)} 
                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].generalAverageRemarks`, e.target.value)} 
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="h-1 sf-header-shade border-t border-black w-full mt-auto shrink-0"></div>
                
                <table className="excel-table text-[9px] text-center border-none w-full border-t border-black">
                    <tbody>
                        <tr className="h-3.75 text-left">
                            <td className="w-[60%] border-r-black px-1 font-bold">REMARKS:</td>
                            <td className="px-1 text-center font-bold">Prepared by:</td>
                        </tr>
                        <tr className="h-4.5">
                            <td className="w-[60%] border-r-black border-b-transparent">
                                <input type="text" className="border-none bg-transparent w-full px-1 text-left focus:outline-none" 
                                    value={getVal(`scholasticRecords[${blockIdx}].customRemarks`)} 
                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].customRemarks`, e.target.value)} 
                                />
                            </td>
                            <td className="border-b-transparent relative align-bottom pb-1">
                                <div className="border-b border-black mx-4 flex items-center justify-center font-bold text-[10px]">
                                    <AutoShrinkText text={getVal(`scholasticRecords[${blockIdx}].adviser`)} />
                                </div>
                            </td>
                        </tr>
                        <tr className="h-3 text-center border-t-transparent text-[8px]">
                            <td className="w-[60%] border-r-black"></td>
                            <td>Signature of Adviser over Printed Name</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    if (pageNumber === 2) {
        return (
            <div className="sf10-container bg-white flex flex-col items-center font-['Arial_Narrow',Arial,sans-serif] antialiased p-8 print:p-0">
                <div className="page w-204 h-[12.95in] bg-white p-[15pt_0.35in_0.15in_0.35in] flex flex-col justify-between box-border relative print:m-0 border border-gray-200 print:border-none leading-[1.1]">
                    <style>{`
                        @page { size: 8.5in 13in; margin: 0in; }
                        body { font-family: "Arial Narrow", Arial, sans-serif; font-stretch: condensed; }
                        .fill-blank { 
                            border-bottom: 1px solid black !important; 
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
                        .sf-header-shade { background-color: #DDD9C4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .excel-table { width: 100%; border-collapse: collapse; border: 1px solid black; }
                        .excel-table th, .excel-table td { border: 1px solid black !important; padding: 0px 2px; font-size: 10px; }
                        .border-thick { border: 1.2pt solid black !important; }
                        .border-thick-b { border-bottom: 1.2pt solid black !important; }
                    `}</style>

                    <div className="flex flex-col h-full justify-start">
                        <div>
                            <div className="flex justify-between items-start mb-0.5 px-1 text-[9.8px] font-bold">
                                <div>SF10-SHS</div>
                                <div>Page 2 of 2</div>
                            </div>
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap text-[11px] font-bold">LAST NAME:</span>
                                <span className="fill-blank min-w-30 px-2 uppercase" style={{ fontWeight: 'bold' }}>{getVal('learner.lastName')}</span>
                                <span className="mx-1 whitespace-nowrap text-[11px] font-bold">FIRST NAME:</span>
                                <span className="fill-blank grow px-2 uppercase" style={{ fontWeight: 'bold' }}>{getVal('learner.firstName')}</span>
                                <span className="mx-1 whitespace-nowrap text-[11px] font-bold">NAME EXTN. (Jr,I,II):</span>
                                <span className="fill-blank min-w-12.5 px-1 uppercase">{getVal('learner.nameExtension')}</span>
                                <span className="mx-1 whitespace-nowrap text-[11px] font-bold">MIDDLE NAME:</span>
                                <span className="fill-blank min-w-25 px-2 uppercase">{getVal('learner.middleName')}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-y-1 mt-2">
                                {renderScholasticBlock(2)}
                                {renderScholasticBlock(3)}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="text-[11.3px] font-bold mt-2 mb-0 px-1 uppercase leading-tight text-center">
                                CERTIFICATE OF TRANSFER
                            </div>
                            <div className="border-thick bg-white overflow-hidden shadow-sm mt-1">
                                <div className="p-2 px-4 text-[11.3px] leading-relaxed">
                                    <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                        <span className="mr-1 whitespace-nowrap font-bold">Admitted to Grade:</span>
                                        <span className="fill-blank min-w-12.5 uppercase font-bold text-center">
                                            <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal(`certification.admittedGrade`)} onChange={(e) => onUpdate?.(`certification.admittedGrade`, e.target.value)} />
                                        </span>
                                        <span className="ml-4 mr-1 whitespace-nowrap font-bold">Track/Strand:</span>
                                        <span className="fill-blank grow uppercase font-bold text-center">
                                            <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal(`certification.trackStrand`)} onChange={(e) => onUpdate?.(`certification.trackStrand`, e.target.value)} />
                                        </span>
                                    </div>
                                    <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                        <span className="mr-1 whitespace-nowrap font-bold">Eligible for Admission to Grade:</span>
                                        <span className="fill-blank min-w-12.5 uppercase font-bold text-center">
                                            <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal(`certification.eligibleGrade`)} onChange={(e) => onUpdate?.(`certification.eligibleGrade`, e.target.value)} />
                                        </span>
                                        <span className="ml-4 mr-1 whitespace-nowrap font-bold">Track/Strand:</span>
                                        <span className="fill-blank grow uppercase font-bold text-center">
                                            <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal(`certification.eligibleTrackStrand`)} onChange={(e) => onUpdate?.(`certification.eligibleTrackStrand`, e.target.value)} />
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end mt-4 px-10">
                                        <div className="min-w-37.5 text-center">
                                            <div className="border-b border-black w-full mb-px min-h-3.5 font-bold text-center uppercase">
                                                <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal(`certification.date`)} onChange={(e) => onUpdate?.(`certification.date`, e.target.value)} />
                                            </div>
                                            <div className="text-[10px] uppercase">Date</div>
                                        </div>
                                        <div className="grow mx-10 text-center">
                                            <div className="border-b border-black w-full mb-px min-h-3.5 flex items-center justify-center uppercase font-bold">
                                                <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal(`certification.principalSignatureName`)} onChange={(e) => onUpdate?.(`certification.principalSignatureName`, e.target.value)} />
                                            </div>
                                            <div className="text-[10px] uppercase pt-1">Signature of Principal/School Head over Printed Name</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // PAGE 1
    return (
        <div className="sf10-container bg-white flex flex-col items-center font-['Arial_Narrow',Arial,sans-serif] antialiased p-8 print:p-0">
            <div className="page w-204 h-[12.95in] bg-white p-[15pt_0.35in_0.15in_0.35in] flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none leading-[1.05]">
                <style>{`
                    @page { size: 8.5in 13in; margin: 0in; }
                    body { font-family: "Arial Narrow", Arial, sans-serif; font-stretch: condensed; }
                    .fill-blank { border-bottom: 1px solid black !important; display: inline-flex; align-items: flex-end; justify-content: center !important; white-space: nowrap; overflow: hidden; padding-bottom: -1px; font-family: inherit; font-stretch: condensed; font-weight: bold !important; text-align: center !important; }
                    .sf-header-shade { background-color: #DDD9C4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .excel-table { width: 100%; border-collapse: collapse; border: 1px solid black; }
                    .excel-table th, .excel-table td { border: 1px solid black !important; padding: 0px 4px; height: 16px; min-height: 16px; font-size: 10px; }
                    .border-thick { border: 1.5pt solid black !important; }
                    .border-thick-b { border-bottom: 1.5pt solid black !important; }
                `}</style>

                <div className="grow">
                    <div className="flex items-start mb-0 relative h-16">
                        <div className="absolute top-0 left-0 w-24">
                            <div className="text-[10.3px] font-bold">SF10-SHS</div>
                            <img src={logoLeft} alt="Logo Left" className="h-11 mx-auto mt-1" />
                        </div>
                        <div className="w-full text-center leading-tight">
                            <div className="text-[11.3px] mb-0.5">Republic of the Philippines</div>
                            <div className="text-[11.3px] mb-0.5">Department of Education</div>
                            <div className="text-[13.3px] font-bold mt-1 uppercase tracking-tight leading-none px-20">
                                Learner Permanent Academic Record for Senior High School (SF10-SHS)
                            </div>
                            <div className="text-[10.3px] italic">(Formerly Form 137)</div>
                        </div>
                        <div className="absolute top-0 right-0 w-24">
                            <img src={logoRight} alt="Logo Right" className="h-14 mx-auto" />
                        </div>
                    </div>

                    {/* Learner's Information */}
                    <div className="mt-0.5 mb-1 border-thick overflow-hidden">
                        <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[11.5pt]">LEARNER'S INFORMATION</div>
                        <div className="p-1 px-4 text-[11.3px]">
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap">LAST NAME:</span>
                                <span className="fill-blank min-w-30 px-2 uppercase font-bold">{getVal('learner.lastName')}</span>
                                <span className="mx-1 whitespace-nowrap">FIRST NAME:</span>
                                <span className="fill-blank grow px-2 uppercase font-bold">{getVal('learner.firstName')}</span>
                                <span className="mx-1 whitespace-nowrap">NAME EXTN. (Jr,I,II):</span>
                                <span className="fill-blank min-w-12.5 px-1 uppercase">{getVal('learner.nameExtension')}</span>
                                <span className="mx-1 whitespace-nowrap">MIDDLE NAME:</span>
                                <span className="fill-blank min-w-25 px-2 uppercase">{getVal('learner.middleName')}</span>
                            </div>
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap">Learner Reference Number (LRN):</span>
                                <span className="fill-blank min-w-37.5 px-4 uppercase font-bold text-[13px]">{getVal('learner.lrn')}</span>
                                <span className="mx-4 whitespace-nowrap">Birthdate (mm/dd/yyyy):</span>
                                <span className="fill-blank min-w-20 px-2 uppercase">{formatDate(getVal('learner.birthdate'))}</span>
                                <span className="mx-4 whitespace-nowrap">Sex:</span>
                                <span className="fill-blank min-w-10 px-1 uppercase">{getVal('learner.sex')}</span>
                                <span className="mx-4 whitespace-nowrap">Date of SHS Admission:</span>
                                <span className="fill-blank min-w-20 px-1 uppercase">{formatDate(getVal('learner.shsAdmissionDate'))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Eligibility */}
                    <div className="mt-1 mb-1 border-thick overflow-hidden">
                        <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[11.5pt]">
                            ELIGIBILITY FOR SHS ENROLMENT
                        </div>
                        <div className="p-1 px-2 text-[11.3px]">
                            <div className="flex items-end mb-1 flex-nowrap shrink-0 justify-between">
                                <div className="flex items-center">
                                    <div className="w-3.5 h-3.5 border border-black mb-0.5 mx-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                        {getRaw('eligibility.isHsCompleter') ? '✓' : ''}
                                    </div>
                                    <span className="mr-1 whitespace-nowrap text-[9.5pt]">High School Completer*</span>
                                    <span className="mx-1 whitespace-nowrap text-[9.5pt]">Gen. Ave:</span>
                                    <span className="fill-blank min-w-10 px-1 text-[9.5pt] font-bold">{getVal('eligibility.hsGenAve')}</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3.5 h-3.5 border border-black mb-0.5 mx-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                        {getRaw('eligibility.isJhsCompleter') ? '✓' : ''}
                                    </div>
                                    <span className="mr-1 whitespace-nowrap text-[9.5pt]">Junior High School Completer</span>
                                    <span className="mx-1 whitespace-nowrap text-[9.5pt]">Gen. Ave:</span>
                                    <span className="fill-blank min-w-10 px-1 text-[9.5pt] font-bold">{getVal('eligibility.jhsGenAve')}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap ml-6 text-[9.5pt]">Date of Graduation/Completion:</span>
                                <span className="fill-blank min-w-20 px-1 font-bold">{formatDate(getVal('eligibility.hsGraduationDate') || getVal('eligibility.jhsGraduationDate'))}</span>
                                <span className="mx-2 whitespace-nowrap text-[9.5pt]">Name of School:</span>
                                <span className="fill-blank min-w-37.5 grow px-2 uppercase font-bold text-[9.5pt]">
                                    <AutoShrinkText align="left" text={getVal('eligibility.jhsSchoolName')} />
                                </span>
                                <span className="mx-2 whitespace-nowrap text-[9.5pt]">School Add.:</span>
                                <span className="fill-blank min-w-25 grow px-2 uppercase font-bold text-[9.5pt]">
                                    <AutoShrinkText align="left" text={getVal('eligibility.jhsSchoolAddress')} />
                                </span>
                            </div>

                            <div className="flex items-end mb-1 mt-2 flex-nowrap shrink-0 justify-between">
                                <div className="flex items-center">
                                    <div className="w-3.5 h-3.5 border border-black mb-0.5 mx-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                        {getRaw('eligibility.isPeptPasser') ? '✓' : ''}
                                    </div>
                                    <span className="mr-1 whitespace-nowrap text-[9.5pt]">PEPT Passer**</span>
                                    <span className="mx-1 whitespace-nowrap text-[9.5pt]">Rating:</span>
                                    <span className="fill-blank min-w-10 px-1 text-[9.5pt] font-bold">{getVal('eligibility.peptRating')}</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3.5 h-3.5 border border-black mb-0.5 mx-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                        {getRaw('eligibility.isAlsPasser') ? '✓' : ''}
                                    </div>
                                    <span className="mr-1 whitespace-nowrap text-[9.5pt]">ALS A&E Passer***</span>
                                    <span className="mx-1 whitespace-nowrap text-[9.5pt]">Rating:</span>
                                    <span className="fill-blank min-w-10 px-1 text-[9.5pt] font-bold">{getVal('eligibility.alsRating')}</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3.5 h-3.5 border border-black mb-0.5 mx-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                        {getRaw('eligibility.isOther') ? '✓' : ''}
                                    </div>
                                    <span className="mr-1 whitespace-nowrap text-[9.5pt]">Others (Pls.Specify):</span>
                                    <span className="fill-blank min-w-15 grow px-1 text-[9.5pt] font-bold text-left">{getVal('eligibility.otherCredentials')}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap ml-6 text-[9.5pt]">Date of Examination/Assessment:</span>
                                <span className="fill-blank min-w-20 px-1 font-bold">{formatDate(getVal('eligibility.peptDate'))}</span>
                                <span className="mx-2 whitespace-nowrap text-[9.5pt]">Name & Address of CLC:</span>
                                <span className="fill-blank min-w-37.5 grow px-2 uppercase font-bold text-[9.5pt]">
                                    <AutoShrinkText align="left" text={getVal('eligibility.alsClcNameAddress')} />
                                </span>
                            </div>
                        </div>
                        <div className="px-2 pb-1 flex justify-between text-[8px] italic">
                            <span>*High School Completers are students who graduated from secondary school under the old curriculum</span>
                            <span>***ALS A&E - Alternative Learning System Accreditation and Equivalency Test for JHS</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-1 mt-1">
                        {renderScholasticBlock(0)}
                        {renderScholasticBlock(1)}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SF10SHSRenderer;
