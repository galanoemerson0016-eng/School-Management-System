import React from 'react';
import { getSF10RowsForGrade } from '../lib/subjectConfig';
import { AutoShrinkText, asString, SF10SubjectCombobox, SF10RemarkCombobox, SF10GeneralAverageRemarkCombobox, EditableSpan, type AnyObject, type SF10RendererProps } from './SF10Shared';

export const SF10JHSRenderer: React.FC<SF10RendererProps> = ({ pageNumber, data, onUpdate, dbSubjects }) => {
    
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
        const label = String(row.label || '').trim();
        const classes: string[] = [];
        
        if (label.length > 28) {
            classes.push('whitespace-nowrap', 'tracking-tighter', 'text-[10px]');
        }

        if (label.includes('*Arabic Language') || label.includes('*Islamic Values Education')) return classes.join(' ');
        if (!row.indent) {
            classes.push('font-bold');
            return classes.join(' ');
        }
        if (label === 'Music and Arts' || label === 'Physical Education and Health' ||
            label === 'Music' || label === 'Arts' || label === 'Physical Education' || label === 'Health') {
            classes.push('pl-7.5');
        } else {
            classes.push('pl-10');
        }
        return classes.join(' ');
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

    // Determine grade category for dynamic labeling
    const getGradeInfo = () => {
        // Priority 1: Check explicit flag from mapper
        if (data.isES === true) {
            return { gradeNum: 1, isES: true, isJHS: false, isSHS: false, formType: 'SF10-ES' };
        }
        const rawGrade = getVal('learner.gradeLevel') || getVal('scholasticRecords[0].gradeLevel') || '';
        let gradeNum = parseInt(rawGrade.replace(/\D/g, '')) || 7;
        
        // If we found it from scholasticRecords[0] but it's JHS, and it's G7, 
        // we should check if the learner.gradeLevel override exists in data[path]
        const learnerGradeOverride = asString(data['learner.gradeLevel']);
        if (learnerGradeOverride) {
            gradeNum = parseInt(learnerGradeOverride.replace(/\D/g, '')) || gradeNum;
        }

        return {
            gradeNum,
            isES: gradeNum >= 1 && gradeNum <= 6,
            isJHS: gradeNum >= 7 && gradeNum <= 10,
            isSHS: gradeNum >= 11 && gradeNum <= 12,
            formType: gradeNum <= 6 ? 'SF10-ES' : gradeNum <= 10 ? 'SF10-JHS' : 'SF10-SHS'
        };
    };

    const { isES, isSHS, formType } = getGradeInfo();

    // Assets
    const baseUrl = import.meta.env.BASE_URL || '/';
    const logoLeft = `${baseUrl}deped_logo_left.png`;
    const logoRight = `${baseUrl}deped_logo_right.png`;

            // PAGE 2 (High-Fidelity Implementation)
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
                        .excel-table th, .excel-table td { border: 1px solid black !important; padding: 0px 2px; font-size: ${isES ? '8.3px' : '10px'}; }
                        .border-thick { border: 1.2pt solid black !important; }
                        .border-thick-b { border-bottom: 1.2pt solid black !important; }
                        .h-spacer td { height: 3pt !important; min-height: 0 !important; padding: 0 !important; line-height: 0; }
                    `}</style>

                    <div className="flex flex-col h-full justify-start">
                        <div>
                            <div className="flex justify-between items-start mb-0.5 px-1 text-[9.8px] font-bold">
                                <div>{formType}</div>
                                <div>Page 2 of 2</div>
                            </div>



                            <div className="grid grid-cols-1 gap-y-1">
                                {(isES ? [4, 5, 6] : [2, 3, 4]).map((blockIdx) => (
                                    <div key={blockIdx} className="border-thick bg-white overflow-hidden flex flex-col shadow-sm">
                                        <div className={`px-2 ${isES ? 'py-0.5 space-y-0.5' : 'py-0.5 space-y-0'} border-thick-b ${isES ? 'text-[11.3px]' : 'text-[11px]'} bg-white`}>
                                            <div className="flex items-end flex-nowrap shrink-0 gap-1">
                                                <span className="whitespace-nowrap">School:</span>
                                                <EditableSpan className="fill-blank flex-[1.6] uppercase font-bold text-[10.3px]" align="left" value={getVal(`scholasticRecords[${blockIdx}].schoolName`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].schoolName`, v)} />
                                                <span className="whitespace-nowrap ml-1">School ID:</span>
                                                <EditableSpan className="fill-blank min-w-13 max-w-16 px-1 uppercase font-bold" value={getVal(`scholasticRecords[${blockIdx}].schoolId`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].schoolId`, v)} />
                                                <span className="whitespace-nowrap ml-1">District:</span>
                                                <EditableSpan className="fill-blank flex-1 px-1 uppercase font-bold" value={getVal(`scholasticRecords[${blockIdx}].district`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].district`, v)} />
                                                <span className="whitespace-nowrap ml-1">Division:</span>
                                                <EditableSpan className="fill-blank flex-[1.4] px-1 uppercase font-bold" value={getVal(`scholasticRecords[${blockIdx}].division`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].division`, v)} />
                                                <span className="whitespace-nowrap ml-1">Region:</span>
                                                <EditableSpan className="fill-blank flex-[0.75] min-w-10 max-w-22 px-1 uppercase font-bold text-center" value={getVal(`scholasticRecords[${blockIdx}].region`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].region`, v)} />
                                            </div>
                                            <div className="flex items-end mb-0 flex-nowrap shrink-0 gap-1">
                                                <span className="whitespace-nowrap">Classified as Grade:</span>
                                                <EditableSpan className="fill-blank min-w-5 max-w-7 px-1 uppercase font-bold text-center" value={getVal(`scholasticRecords[${blockIdx}].gradeLevel`).replace(/\D/g, "") || getVal(`scholasticRecords[${blockIdx}].gradeLevel`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].gradeLevel`, v)} />
                                                <span className="whitespace-nowrap ml-1">Section:</span>
                                                <EditableSpan className="fill-blank flex-[1.4] min-w-18 px-1 uppercase font-bold" value={getVal(`scholasticRecords[${blockIdx}].section`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].section`, v)} />
                                                <span className="whitespace-nowrap ml-1">School Year:</span>
                                                <EditableSpan className="fill-blank min-w-14 max-w-18 px-1 uppercase font-bold text-center" value={getVal(`scholasticRecords[${blockIdx}].schoolYear`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].schoolYear`, v)} />
                                                <span className="whitespace-nowrap ml-1">Name of Adviser/Teacher:</span>
                                                <EditableSpan className="fill-blank flex-[2.6] min-w-28 px-1 uppercase font-bold" align="left" value={getVal(`scholasticRecords[${blockIdx}].adviserTeacher`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].adviserTeacher`, v)} />
                                                <span className="whitespace-nowrap ml-1">Signature:</span>
                                                <span className="fill-blank min-w-8 max-w-10"></span>
                                            </div>
                                        </div>

                                        <table className="excel-table text-[13px] text-center border-none w-full">
                                            {(() => {
                                                const isExtraBlock = isES ? (blockIdx >= 6) : (blockIdx >= 4);
                                                const rawGrade = getVal(`scholasticRecords[${blockIdx}].gradeLevel`) || "";
                                                const rawGradeLevelNum = Number(getRaw(`scholasticRecords[${blockIdx}].gradeLevelNum`));
                                                const blockGradeNum = Number.isFinite(rawGradeLevelNum) && rawGradeLevelNum > 0 ? rawGradeLevelNum : parseInt(rawGrade.replace(/\D/g, "")) || 0;
                                                
                                                const { gradeNum: currentGradeLevel } = getGradeInfo();
                                                const is3Term = isES 
                                                    ? !!getRaw(`scholasticRecords[${blockIdx}].is3Term`) 
                                                    : (isExtraBlock || blockGradeNum >= currentGradeLevel || blockGradeNum === 0);
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const customCurriculum = (getRaw("curriculum") as any);
                                                // For previous JHS records: use old curriculum if current grade >= 9 and this block is a lower grade
                                                const useOldCurriculum = !isES && currentGradeLevel >= 9 && blockGradeNum > 0 && blockGradeNum < currentGradeLevel;
                                                // For ES extra blocks, suppress subjects; for JHS show whatever grade is set
                                                const rows = (isES && isExtraBlock) ? [] : getSF10RowsForGrade(blockGradeNum || (isES ? 1 : 0), customCurriculum, { useOldCurriculum });
                                                const finalRows = rows;

                                                return (
                                                    <>
                                                        <thead className="bg-white font-bold">
                                                            <tr className="h-3.25">
                                                                <td rowSpan={2} className="w-[35%] border-r-black border-r">LEARNING AREAS</td>
                                                                <td colSpan={is3Term ? 3 : 4} className="border-l-black border-l">
                                                                    {is3Term ? "Term Rating" : "Quarterly Rating"}
                                                                </td>
                                                                <td rowSpan={2} className="w-[12%] leading-tight text-[8.8px]">FINAL<br/>RATING</td>
                                                                <td rowSpan={2} className="w-[15%]">REMARKS</td>
                                                            </tr>
                                                            <tr className="h-3.25 text-[8.3px]">
                                                                <td className={`${is3Term ? "w-[11%]" : "w-[8.25%]"} border-l-black border-l`}>1</td>
                                                                <td className={is3Term ? "w-[11%]" : "w-[8.25%]"}>2</td>
                                                                <td className={is3Term ? "w-[11%]" : "w-[8.25%]"}>3</td>
                                                                {(!is3Term) && <td className="w-[8.25%]">4</td>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {finalRows.map((row, rIdx) => {
                                                                const sub = (getRaw(`scholasticRecords[${blockIdx}].subjects.${row.key}`) as AnyObject) || {};
                                                                const dotKey = `scholasticRecords[${blockIdx}].subjects.${row.key}.label`;
                                                                const underKey = `scholasticRecords[${blockIdx}].subjects.${row.key}_label`;
                                                                const hasOverride = sub.label !== undefined || data[dotKey] !== undefined || data[underKey] !== undefined;
                                                                const customLabel = hasOverride
                                                                    ? asString(sub.label !== undefined ? sub.label : (data[dotKey] !== undefined ? data[dotKey] : data[underKey]))
                                                                    : undefined;

                                                                const displayLabel = customLabel !== undefined ? customLabel : (row.label !== " " ? row.label : "");
                                                                const isBlank = !displayLabel || displayLabel.trim() === '';
                                                                const shouldShowData = !isBlank;

                                                                const isComponent = ['music', 'arts', 'physicalEducation', 'health', 'musicAndArts', 'peAndHealth', 'musicarts', 'pehealth'].includes(row.key) || (row.indent && row.key !== 'mapeh');
                                                                const finalRatingVal = isComponent ? '' : (shouldShowData ? asString(sub.finalRating) : '');
                                                                const remarksVal = isComponent ? '' : (shouldShowData ? asString(sub.remarks) : '');

                                                                return (
                                                                    <tr key={rIdx} className="h-3.75">
                                                                        <td className={`text-left px-1 ${getLearningAreaIndentClass(row)} ${(displayLabel && (displayLabel.includes("Arabic") || displayLabel.includes("Islamic"))) ? "text-[8.3px]" : ""}`}>
                                                                            <SF10SubjectCombobox
                                                                                value={displayLabel}
                                                                                onChange={(val) => {
                                                                                    onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}_label`, val);
                                                                                    onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.label`, val);
                                                                                }}
                                                                                placeholder=""
                                                                                dbSubjects={dbSubjects}
                                                                                isComponent={isComponent}
                                                                                level={isES || (blockGradeNum >= 1 && blockGradeNum <= 6) ? 'elem' : 'jhs'}
                                                                                gradeLevel={blockGradeNum || (isES ? 1 : 7)}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-center border-none bg-transparent focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                                value={shouldShowData ? asString(sub.q1) : ''}
                                                                                onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.q1`, e.target.value)}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-center border-none bg-transparent focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                                value={shouldShowData ? asString(sub.q2) : ''}
                                                                                onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.q2`, e.target.value)}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-center border-none bg-transparent focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                                value={shouldShowData ? asString(sub.q3) : ''}
                                                                                onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.q3`, e.target.value)}
                                                                            />
                                                                        </td>
                                                                        {(!is3Term) && (
                                                                            <td>
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full text-center border-none bg-transparent focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                                    value={shouldShowData ? asString(sub.q4) : ''}
                                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.q4`, e.target.value)}
                                                                                />
                                                                            </td>
                                                                        )}
                                                                        <td className="font-bold">
                                                                            <input
                                                                                type="text"
                                                                                disabled={isComponent}
                                                                                className="w-full text-center border-none bg-transparent font-bold focus:outline-none focus:bg-amber-50/70 text-[10px] disabled:opacity-0"
                                                                                value={finalRatingVal}
                                                                                onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.finalRating`, e.target.value)}
                                                                            />
                                                                        </td>
                                                                        <td className="uppercase text-[8.3px]">
                                                                            <SF10RemarkCombobox
                                                                                disabled={isComponent}
                                                                                value={remarksVal}
                                                                                onChange={(val) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.remarks`, val)}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            <tr className="font-bold h-3.75 border-t-black border-t">
                                                                <td></td>
                                                                <td colSpan={is3Term ? 3 : 4} className="text-center italic font-bold text-[10.3px]">General Average</td>
                                                                <td className="border-l-black border-l">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full text-center border-none bg-transparent font-bold focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                        value={getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`)}
                                                                        onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.generalAverage`, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="uppercase text-[8.3px]">
                                                                    {(() => {
                                                                        const genAvgRemPath = `scholasticRecords[${blockIdx}].subjects.remarks`;
                                                                        const hasGenAvgRemOverride = data[genAvgRemPath] !== undefined;
                                                                        const genAvgRaw = parseFloat(getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`));
                                                                        const computedGenAvgRem = genAvgRaw >= 75 ? 'PROMOTED' : genAvgRaw > 0 ? 'RETAINED' : '';
                                                                        const rawRem = getVal(genAvgRemPath);
                                                                        const displayGenAvgRem = hasGenAvgRemOverride 
                                                                            ? asString(data[genAvgRemPath]) 
                                                                            : (rawRem === 'PASSED' ? 'PROMOTED' : (rawRem || computedGenAvgRem));
                                                                        return (
                                                                            <SF10GeneralAverageRemarkCombobox
                                                                                value={displayGenAvgRem}
                                                                                onChange={(val) => onUpdate?.(genAvgRemPath, val)}
                                                                            />
                                                                        );
                                                                    })()}
                                                                </td>
                                                            </tr>
                                                    </tbody>
                                                    </>
                                                );
                                            })()}
                                        </table>

                                        <div className="h-2 sf-header-shade border border-black w-full mt-auto shrink-0"></div>
                                        <div className="bg-white">
                                            <table className="excel-table text-center w-full border-collapse" style={{ border: 'none' }}>
                                                <thead>
                                                    <tr className="h-4.25 bg-white">
                                                        <td className="text-center font-bold text-[9.3px] border-black border-b border-r" style={{ width: '30%' }}>Remedial Classes</td>
                                                        <td colSpan={4} className="text-left text-[9.3px] px-2 font-bold border-black border-b">
                                                            <span>Conducted from (mm/dd/yyyy)</span>
                                                            <span className="fill-blank min-w-20 mx-1 h-4 px-1">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.conductedFrom`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.conductedFrom`, e.target.value)}
                                                                />
                                                            </span>
                                                            <span className="ml-8">to (mm/dd/yyyy)</span>
                                                            <span className="fill-blank min-w-20 mx-1 h-4 px-1">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.conductedTo`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.conductedTo`, e.target.value)}
                                                                />
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr className="h-3.5 font-bold uppercase text-[8.0px] bg-white">
                                                        <td className="border-black border-r" style={{ width: '30%' }}>Learning Areas</td>
                                                        <td className="border-black border-r" style={{ width: '15%' }}>Final Rating</td>
                                                        <td className="border-black border-r" style={{ width: '18%' }}>Remedial Class Mark</td>
                                                        <td className="border-black border-r leading-tight" style={{ width: '22%' }}>Recomputed Final Grade</td>
                                                        <td style={{ width: '15%' }}>Remarks</td>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[0, 1].map((rIdx) => (
                                                        <tr key={rIdx} className="h-3.5">
                                                            <td className="border-black border-r text-left px-1">
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-none bg-transparent focus:outline-none text-[8.5px] uppercase"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].learningArea`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].learningArea`, e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="border-black border-r">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].finalRating`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].finalRating`, e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="border-black border-r">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].remedialMark`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].remedialMark`, e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="border-black border-r">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].recomputedGrade`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].recomputedGrade`, e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent uppercase focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].remarks`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].remarks`, e.target.value)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            {/* Transfer Out / Completer Section */}
                            <div className="text-[11.3px] font-bold mt-0.5 mb-0 px-1 uppercase leading-tight">
                                {isES ? 'For Transfer Out / Elementary School Completer Only' : 'For Transfer Out / JHS Completer Only'}
                            </div>

                            {/* Certification Boxes: ES = 3, JHS = 1 */}
                            <div className="space-y-0.5 mb-0.5">
                                {(isES ? [1, 2, 3] : [1]).map((certIdx) => (
                                    <div key={certIdx} className="border-thick bg-white overflow-hidden shadow-sm">
                                        <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[11.5pt]">CERTIFICATION</div>
                                        <div className="p-1 px-2 text-[10px] leading-relaxed">
                                            <div className="flex items-end mb-0.5 flex-nowrap shrink-0 gap-1">
                                                <span className="whitespace-nowrap">I CERTIFY that this is a true record of</span>
                                                <span className="fill-blank grow min-w-35 uppercase font-bold text-center px-1">
                                                    <input
                                                        type="text"
                                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px] tracking-tight placeholder:text-gray-300 print:placeholder:text-transparent"
                                                        value={getVal(`certification.page2_cert${certIdx}.recordOf`)}
                                                        onChange={(e) => onUpdate?.(`certification.page2_cert${certIdx}.recordOf`, e.target.value)}
                                                        placeholder="Enter Name"
                                                    />
                                                </span>
                                                <span className="whitespace-nowrap">with LRN</span>
                                                <span className="fill-blank w-20 min-w-18 max-w-21 shrink-0 uppercase font-bold text-center px-0.5">
                                                    <input
                                                        type="text"
                                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px]"
                                                        value={getVal(`certification.page2_cert${certIdx}.lrn`)}
                                                        onChange={(e) => onUpdate?.(`certification.page2_cert${certIdx}.lrn`, e.target.value)}
                                                    />
                                                </span>
                                                <span className="whitespace-nowrap">and that he/she is eligible for admission to Grade</span>
                                                <span className="fill-blank w-7 min-w-6 max-w-7.5 shrink-0 uppercase font-bold text-center px-0.5">
                                                    <input
                                                        type="text"
                                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px] placeholder:text-gray-300 print:placeholder:text-transparent"
                                                        value={getVal(`certification.page2_cert${certIdx}.admissionGrade`)}
                                                        onChange={(e) => onUpdate?.(`certification.page2_cert${certIdx}.admissionGrade`, e.target.value)}
                                                        placeholder="Grade"
                                                    />
                                                </span>
                                                <span>.</span>
                                            </div>
                                            <div className="flex items-end mb-1 flex-nowrap shrink-0 gap-1">
                                                <span className="whitespace-nowrap">Name of School:</span>
                                                <span className="fill-blank grow uppercase font-bold text-center px-1">
                                                    <input
                                                        type="text"
                                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px] placeholder:text-gray-300 print:placeholder:text-transparent"
                                                        value={getVal(`certification.page2_cert${certIdx}.schoolName`)}
                                                        onChange={(e) => onUpdate?.(`certification.page2_cert${certIdx}.schoolName`, e.target.value)}
                                                        placeholder="School Name"
                                                    />
                                                </span>
                                                <span className="whitespace-nowrap">School ID:</span>
                                                <span className="fill-blank w-17.5 min-w-15 shrink-0 uppercase font-bold text-center px-0.5">
                                                    <input
                                                        type="text"
                                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px]"
                                                        value={getVal(`certification.page2_cert${certIdx}.schoolId`)}
                                                        onChange={(e) => onUpdate?.(`certification.page2_cert${certIdx}.schoolId`, e.target.value)}
                                                        placeholder="ID"
                                                    />
                                                </span>
                                                {isES && <>
                                                    <span className="whitespace-nowrap">Division:</span>
                                                    <span className="fill-blank grow uppercase px-1">
                                                        <input
                                                            type="text"
                                                            className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px]"
                                                            value={getVal(`certification.page2_cert${certIdx}.division`)}
                                                            onChange={(e) => onUpdate?.(`certification.page2_cert${certIdx}.division`, e.target.value)}
                                                        />
                                                    </span>
                                                </>}
                                                <span className="whitespace-nowrap">Last School Year Attended:</span>
                                                <span className="fill-blank w-20 min-w-18 shrink-0 uppercase font-bold text-center px-0.5">
                                                    <input
                                                        type="text"
                                                        className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px]"
                                                        value={getVal(`certification.page2_cert${certIdx}.lastSchoolYearAttended`)}
                                                        onChange={(e) => onUpdate?.(`certification.page2_cert${certIdx}.lastSchoolYearAttended`, e.target.value)}
                                                        placeholder="YYYY-YYYY"
                                                    />
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end mt-0 px-2">
                                                <div className="min-w-30 text-center">
                                                    <div className="border-b border-black w-full mb-px min-h-3.5 font-bold text-center uppercase px-1">
                                                        <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal(`certification.page2_cert${certIdx}.date`)} onChange={(e) => onUpdate?.(`certification.page2_cert${certIdx}.date`, e.target.value)} />
                                                    </div>
                                                    <div className="text-[10px] uppercase">Date</div>
                                                </div>
                                                <div className="grow mx-10 text-center">
                                                    <div className="border-b border-black w-full mb-px min-h-3.5 flex items-center justify-center uppercase font-bold">
                                                        <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal(`certification.page2_cert${certIdx}.principalSignatureName`)} onChange={(e) => onUpdate?.(`certification.page2_cert${certIdx}.principalSignatureName`, e.target.value)} />
                                                    </div>
                                                    <div className="text-[10px] uppercase pt-1">Signature of Principal/School Head over Printed Name</div>
                                                </div>
                                                <div className="w-35 text-center">
                                                    <div className="text-[10px] uppercase">(Affix School Seal Here)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-end mt-1 px-1 text-[10px] italic shrink-0">
                                <div>(May add Certification box if needed)</div>
                                <div>Revised 2025 based on DepEd Order No. 10, s. 2024</div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @page { size: 8.5in 13in; margin: 0mm; }
                    @media print {
                        html, body { height: 13in !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
                        .sf10-container { background: white !important; padding: 0 !important; margin: 0 !important; height: 13in !important; min-height: 13in !important; display: block !important; overflow: hidden !important; }
                        .page { box-shadow: none !important; margin: 0 !important; padding: 10pt 0.3in 0.3in 0.3in !important; height: 12.95in !important; width: 8.5in !important; display: block !important; break-after: avoid-page !important; position: relative !important; }
                    }
                `}</style>
            </div>
        );
    }

    // PAGE 1 (Matching User Template Exactly)
    return (
        <div className="sf10-container bg-white flex flex-col items-center font-['Arial_Narrow',Arial,sans-serif] antialiased p-8 print:p-0">
            
            <div className="page w-204 h-[12.95in] bg-white p-[15pt_0.35in_0.15in_0.35in] flex flex-col justify-start box-border relative print:m-0 border border-gray-200 print:border-none leading-[1.05]">
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
                    .excel-table th, .excel-table td { border: 1px solid black !important; padding: 0px 4px; height: 16px; min-height: 16px; font-size: ${isES ? '9.8px' : '13px'}; }
                    .border-thick { border: 1.5pt solid black !important; }
                    .border-thick-b { border-bottom: 1.5pt solid black !important; }
                    .h-spacer td { height: 3pt !important; min-height: 0 !important; padding: 0 !important; line-height: 0; }
                    .fill-blank-left {
                        border-bottom: 1px solid black;
                        display: inline-flex;
                        align-items: flex-end;
                        justify-content: flex-start !important;
                        white-space: nowrap;
                        overflow: hidden;
                        padding-bottom: -1px;
                        font-family: inherit;
                        font-stretch: condensed;
                        text-align: left !important;
                    }
                `}</style>

                <div className="grow">
                    {/* Header */}
                    <div className="flex items-start mb-0 relative h-16">
                        <div className="absolute top-0 left-0 w-24">
                            <div className="text-[10.3px] font-bold">{formType}</div>
                            <img src={logoLeft} alt="Logo Left" className="h-11 mx-auto mt-1" />
                        </div>
                        <div className="w-full text-center leading-tight">
<div className="text-[11.3px] mb-0.5">Republic of the Philippines</div>
                            <div className="text-[11.3px] mb-0.5">Department of Education</div>
                            <div className="text-[13.3px] font-bold mt-1 uppercase tracking-tight leading-none px-20">
                                {isES 
                                    ? "Learner Permanent Academic Record for Elementary School (SF10-ES)"
                                    : isSHS
                                    ? "Learner Permanent Academic Record for Senior High School (SF10-SHS)"
                                    : "Learner Permanent Academic Record for Junior High School (SF10-JHS)"
                                }
                            </div>
                            <div className="text-[10.3px] italic">(Formerly Form 137)</div>
                        </div>
                        <div className="absolute top-0 right-0 w-24">
                            <img src={logoRight} alt="Logo Right" className="h-14 mx-auto" />
                        </div>
                    </div>

                    {/* Learner's Information */}
                    <div className="mt-0.5 mb-1 border-thick overflow-hidden">
                        <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[11.5pt]">LEARNER'S PERSONAL INFORMATION</div>
                        <div className="p-1 px-4 text-[11.3px]">
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap">LAST NAME:</span>
                                <EditableSpan className="fill-blank min-w-30 px-2 uppercase font-bold" value={getVal('learner.lastName')} onChange={(v) => onUpdate?.('learner.lastName', v)} />
                                <span className="mx-1 whitespace-nowrap">FIRST NAME:</span>
                                <EditableSpan className="fill-blank grow px-2 uppercase font-bold" value={getVal('learner.firstName')} onChange={(v) => onUpdate?.('learner.firstName', v)} />
                                <span className="mx-1 whitespace-nowrap">NAME EXTN. (Jr,I,II):</span>
                                <EditableSpan className="fill-blank min-w-12.5 px-1 uppercase" value={getVal('learner.nameExtension')} onChange={(v) => onUpdate?.('learner.nameExtension', v)} />
                                <span className="mx-1 whitespace-nowrap">MIDDLE NAME:</span>
                                <EditableSpan className="fill-blank min-w-25 px-2 uppercase" value={getVal('learner.middleName')} onChange={(v) => onUpdate?.('learner.middleName', v)} />
                            </div>
                            <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                <span className="mr-1 whitespace-nowrap">Learner Reference Number (LRN):</span>
                                <EditableSpan className="fill-blank min-w-37.5 px-4 uppercase font-bold text-[13px]" value={getVal('learner.lrn')} onChange={(v) => onUpdate?.('learner.lrn', v)} />
                                <span className="mx-4 whitespace-nowrap">Birthdate (mm/dd/yyyy):</span>
                                <span className="fill-blank min-w-25 px-2 uppercase">{formatDate(getVal('learner.birthdate'))}</span>
                                <span className="mx-4 whitespace-nowrap">Sex:</span>
                                <EditableSpan className="fill-blank grow px-1 uppercase" value={getVal('learner.sex')} onChange={(v) => onUpdate?.('learner.sex', v)} />
                            </div>
                        </div>
                    </div>

                    {/* Eligibility */}
                    <div className="mt-1 mb-1 border-thick overflow-hidden">
                        <div className="text-center font-bold sf-header-shade border-thick-b py-0.5 text-[11.5pt]">
                            {isES ? "ELIGIBILITY FOR ELEMENTARY SCHOOL ENROLMENT" : "ELIGIBILITY FOR JHS ENROLMENT"}
                        </div>
                        <div className="p-1 px-2 text-[11.3px]">
                            {isES ? (
                                <>
                                    <div className="border border-black p-1 mb-1 bg-white">
                                        <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                            <span className="mr-1 whitespace-nowrap italic">Credential Presented for Grade 1:</span>
                                            <div className="w-3.5 h-3.5 border border-black mb-0.5 mx-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                                {getRaw('eligibility.kinderProgressReport.checked') ? '✓' : ''}
                                            </div>
                                            <span className="mr-3 whitespace-nowrap text-[9.5pt]">Kinder Progress Report</span>
                                            <div className="w-3.5 h-3.5 border border-black mb-0.5 mx-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                                {getRaw('eligibility.eccdChecklist.checked') ? '✓' : ''}
                                            </div>
                                            <span className="mr-3 whitespace-nowrap text-[9.5pt]">ECCD Checklist</span>
                                            <div className="w-3.5 h-3.5 border border-black mb-0.5 mx-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                                {getRaw('eligibility.kinderCertificate.checked') ? '✓' : ''}
                                            </div>
                                            <span className="mr-1 whitespace-nowrap text-[9.5pt]">Kindergarten Certificate of Completion</span>
                                        </div>
                                        <div className="flex items-end flex-nowrap shrink-0">
                                            <span className="mr-1 whitespace-nowrap">Name of School:</span>
                                            <span className="fill-blank min-w-37.5 grow px-2 uppercase text-[9.5pt] font-bold">
                                                <AutoShrinkText align="left" text={getVal('eligibility.nameOfElementarySchool')} />
                                            </span>
                                            <span className="mx-2 whitespace-nowrap">School ID:</span>
                                            <span className="fill-blank min-w-15 px-1 uppercase text-[9.5pt] font-bold">
                                                <AutoShrinkText text={getVal('eligibility.schoolId')} />
                                            </span>
                                            <span className="mx-2 whitespace-nowrap">Address of School:</span>
                                            <span className="fill-blank grow px-2 uppercase text-[9.5pt] font-bold">
                                                <AutoShrinkText align="left" text={getVal('eligibility.addressOfSchool')} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-[10.3px] italic mt-1 font-bold">Other Credential Presented</div>
                                    <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                        <div className="w-3.5 h-3.5 border border-black mb-0.5 mr-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                            {getRaw('eligibility.peptPasser.checked') ? '✓' : ''}
                                        </div>
                                        <span className="mr-1 whitespace-nowrap">PEPT Passer</span>
                                        <span className="mx-2 whitespace-nowrap">Rating:</span>
                                        <span className="fill-blank min-w-12.5 px-1 uppercase text-[9.5pt] font-bold">
                                            <AutoShrinkText text={getVal('eligibility.peptPasser.rating')} />
                                        </span>
                                        
                                        <div className="w-3.5 h-3.5 border border-black mb-0.5 ml-6 mr-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                            {getRaw('eligibility.dateOfExamination.checked') || getVal('eligibility.dateOfExamination') ? '✓' : ''}
                                        </div>
                                        <span className="mr-2 whitespace-nowrap">Date of Examination/Assessment (mm/dd/yyyy):</span>
                                        <span className="fill-blank min-w-22.5 px-2 uppercase text-[9.5pt] font-bold">
                                            <AutoShrinkText text={formatDate(getVal('eligibility.dateOfExamination'))} />
                                        </span>

                                        <div className="w-3.5 h-3.5 border border-black mb-0.5 ml-6 mr-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                            {getRaw('eligibility.other.checked') ? '✓' : ''}
                                        </div>
                                        <span className="mr-1 whitespace-nowrap">Others (Pls. Specify):</span>
                                        <span className="fill-blank min-w-20 grow px-1 uppercase text-[9.5pt] font-bold">
                                            <AutoShrinkText text={getVal('eligibility.other.specify')} />
                                        </span>
                                    </div>
                                    <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                        <span className="mr-2 whitespace-nowrap">Name and Address of Testing Center:</span>
                                        <span className="fill-blank grow px-2 uppercase text-[9.5pt] font-bold">
                                            <AutoShrinkText align="left" text={getVal('eligibility.testingCenter') || getVal('eligibility.nameAndAddressOfTestingCenter')} />
                                        </span>
                                        <span className="mx-2 whitespace-nowrap">Remark:</span>
                                        <span className="fill-blank min-w-37.5 px-2 uppercase text-[8.5pt] font-bold">
                                            <AutoShrinkText align="left" text={getVal('eligibility.remark')} />
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                            <div className="w-3 h-3 border border-black mb-0.5 mr-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                                {getRaw('eligibility.elementaryCompleter.checked') ? '✓' : ''}
                                            </div>
                                            <span className="mr-1 whitespace-nowrap">Elementary School Completer</span>
                                            <span className="mx-1 whitespace-nowrap">General Average:</span>
                                            <EditableSpan className="fill-blank min-w-10 px-1 uppercase text-[9.5pt]" value={getVal('eligibility.elementaryCompleter.generalAverage')} onChange={(v) => onUpdate?.('eligibility.elementaryCompleter.generalAverage', v)} />
                                            <span className="mx-2 whitespace-nowrap">Citation (if any):</span>
                                            <EditableSpan className="fill-blank grow px-1 uppercase text-[8.5pt]" value={getVal('eligibility.elementaryCompleter.citation')} onChange={(v) => onUpdate?.('eligibility.elementaryCompleter.citation', v)} />
                                    </div>
                                    <div className="flex items-end mb-1 flex-nowrap shrink-0">
                                        <span className="mr-1 whitespace-nowrap">Name of Elementary School:</span>
                                        <EditableSpan className="fill-blank min-w-37.5 grow px-2 uppercase text-[9.5pt]" align="left" value={getVal('eligibility.nameOfElementarySchool')} onChange={(v) => onUpdate?.('eligibility.nameOfElementarySchool', v)} />
                                        <span className="mx-2 whitespace-nowrap">School ID:</span>
                                        <EditableSpan className="fill-blank min-w-15 px-1 uppercase text-[9.5pt]" value={getVal('eligibility.schoolId')} onChange={(v) => onUpdate?.('eligibility.schoolId', v)} />
                                        <span className="mx-2 whitespace-nowrap">Address of School:</span>
                                        <EditableSpan className="fill-blank grow px-2 uppercase text-[9.5pt]" align="left" value={getVal('eligibility.addressOfSchool')} onChange={(v) => onUpdate?.('eligibility.addressOfSchool', v)} />
                                    </div>
                                </>
                            )}
                            <div className="flex items-end mb-0 flex-nowrap shrink-0">
                                <div className="w-3 h-3 border border-black mb-0.5 mr-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                    {getRaw('eligibility.peptPasser.checked') ? '✓' : ''}
                                </div>
                                <span className="mr-1 whitespace-nowrap">PEPT Passer</span>
                                <span className="mx-2 whitespace-nowrap">Rating:</span>
                                <span className="fill-blank min-w-12.5 px-1 uppercase text-[9.5pt]">
                                    <AutoShrinkText text={getVal('eligibility.peptPasser.rating')} />
                                </span>
                                <div className="w-3 h-3 border border-black mb-0.5 ml-4 mr-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                    {getRaw('eligibility.alsPasser.checked') ? '✓' : ''}
                                </div>
                                <span className="mr-1 whitespace-nowrap">ALS A&E Passer</span>
                                <span className="mx-2 whitespace-nowrap">Rating:</span>
                                <span className="fill-blank min-w-12.5 px-1 uppercase text-[9.5pt]">
                                    <AutoShrinkText text={getVal('eligibility.alsPasser.rating')} />
                                </span>
                                <div className="w-3 h-3 border border-black mb-0.5 ml-4 mr-2 flex items-center justify-center font-bold text-[10.3px] shrink-0">
                                    {getRaw('eligibility.other.checked') ? '✓' : ''}
                                </div>
                                <span className="mr-1 whitespace-nowrap">Others (Specify):</span>
                                <span className="fill-blank min-w-20 grow px-1 uppercase text-[9.5pt]">
                                    <AutoShrinkText text={getVal('eligibility.other.specify')} />
                                </span>
                            </div>
                            <div className="flex items-end mb-1 mt-1 flex-nowrap shrink-0">
                                <span className="mr-2 whitespace-nowrap">Date of Examination/Assessment (mm/dd/yyyy):</span>
                                <span className="fill-blank min-w-25 px-2 uppercase text-[9.5pt]">
                                    <AutoShrinkText text={formatDate(getVal('eligibility.dateOfExamination'))} />
                                </span>
                                <span className="mx-2 whitespace-nowrap">Name and Address of Testing Center:</span>
                                <span className="fill-blank grow px-2 uppercase text-[9.5pt]" style={{ fontWeight: 'bold' }}>
                                    <AutoShrinkText align="left" text={getVal('eligibility.testingCenter') || getVal('eligibility.nameAndAddressOfTestingCenter')} />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Scholastic Record Blocks Section */}
                    <div className="border-thick mt-0.5 grow flex flex-col overflow-hidden">
                        <div className="text-center font-bold sf-header-shade border-thick-b py-0 text-[11.5pt] uppercase tracking-widest leading-tight">Scholastic Record</div>
                        <div className={isES ? "grid grid-cols-2 gap-1.5 p-1 bg-white grow overflow-hidden" : "p-1 grow overflow-hidden"}>
                            {(isES ? [0, 1, 2, 3] : [0, 1]).map((blockIdx) => (
                                <div key={blockIdx} className={isES ? "border border-black overflow-hidden flex flex-col grow" : "my-0.5 border-thick overflow-hidden grow"}>
                                    <div className="p-0 text-[11.3px] flex flex-col h-full">
                                        <div className="px-1 py-0.5 space-y-0.5 border-b border-black bg-white text-[11.3px]">
                                            <div className="flex items-end mb-0 flex-nowrap shrink-0 gap-1">
                                                <span className="whitespace-nowrap">School:</span>
                                                <EditableSpan className="fill-blank flex-[1.6] uppercase font-bold text-[10.3px]" align="left" value={getVal(`scholasticRecords[${blockIdx}].schoolName`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].schoolName`, v)} />
                                                <span className="whitespace-nowrap ml-1">School ID:</span>
                                                <EditableSpan className="fill-blank min-w-13 max-w-16 px-1 uppercase font-bold" value={getVal(`scholasticRecords[${blockIdx}].schoolId`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].schoolId`, v)} />
                                                <span className="whitespace-nowrap ml-1">District:</span>
                                                <EditableSpan className="fill-blank flex-1 px-1 uppercase font-bold" value={getVal(`scholasticRecords[${blockIdx}].district`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].district`, v)} />
                                                <span className="whitespace-nowrap ml-1">Division:</span>
                                                <EditableSpan className="fill-blank flex-[1.4] px-1 uppercase font-bold" value={getVal(`scholasticRecords[${blockIdx}].division`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].division`, v)} />
                                                <span className="whitespace-nowrap ml-1">Region:</span>
                                                <EditableSpan className="fill-blank flex-[0.75] min-w-10 max-w-22 px-1 uppercase font-bold text-center" value={getVal(`scholasticRecords[${blockIdx}].region`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].region`, v)} />
                                            </div>
                                            <div className="flex items-end mb-0 flex-nowrap shrink-0 gap-1">
                                                <span className="whitespace-nowrap">Classified as Grade:</span>
                                                <EditableSpan className="fill-blank min-w-5 max-w-7 px-1 uppercase font-bold text-center" value={getVal(`scholasticRecords[${blockIdx}].gradeLevel`).replace(/\D/g, "") || getVal(`scholasticRecords[${blockIdx}].gradeLevel`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].gradeLevel`, v)} />
                                                <span className="whitespace-nowrap ml-1">Section:</span>
                                                <EditableSpan className="fill-blank flex-[1.4] min-w-18 px-1 uppercase font-bold" value={getVal(`scholasticRecords[${blockIdx}].section`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].section`, v)} />
                                                <span className="whitespace-nowrap ml-1">School Year:</span>
                                                <EditableSpan className="fill-blank min-w-14 max-w-18 px-1 uppercase font-bold text-center" value={getVal(`scholasticRecords[${blockIdx}].schoolYear`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].schoolYear`, v)} />
                                                <span className="whitespace-nowrap ml-1">Name of Adviser/Teacher:</span>
                                                <EditableSpan className="fill-blank flex-[2.6] min-w-28 px-1 uppercase font-bold" align="left" value={getVal(`scholasticRecords[${blockIdx}].adviserTeacher`)} onChange={(v) => onUpdate?.(`scholasticRecords[${blockIdx}].adviserTeacher`, v)} />
                                                <span className="whitespace-nowrap ml-1">Signature:</span>
                                                <span className="fill-blank min-w-8 max-w-10"></span>
                                            </div>
                                        </div>
                                        <table className="excel-table text-[13px] text-center border-none w-full grow">
                                            {(() => {
                                                const { gradeNum: currentGradeLevel } = getGradeInfo();
                                                const rawGrade = getVal(`scholasticRecords[${blockIdx}].gradeLevel`) || "";
                                                const rawGradeLevelNum = Number(getRaw(`scholasticRecords[${blockIdx}].gradeLevelNum`));
                                                const blockGradeNum = Number.isFinite(rawGradeLevelNum) && rawGradeLevelNum > 0 ? rawGradeLevelNum : parseInt(rawGrade.replace(/\D/g, "")) || 0;
                                                
                                                const isExtraBlock = isES ? (blockIdx >= 6) : (blockIdx >= 4);
                                                const is3Term = isES 
                                                    ? !!getRaw(`scholasticRecords[${blockIdx}].is3Term`) 
                                                    : (isExtraBlock || blockGradeNum >= currentGradeLevel || blockGradeNum === 0);
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const customCurriculum = (getRaw("curriculum") as any);
                                                // For previous JHS records: use old curriculum if current grade >= 9 and this block is a lower grade
                                                const useOldCurriculum = !isES && currentGradeLevel >= 9 && blockGradeNum > 0 && blockGradeNum < currentGradeLevel;
                                                const rows = getSF10RowsForGrade(blockGradeNum, customCurriculum, { useOldCurriculum });
                                                
                                                let finalRows = [...rows];
                                                if (isES) {
                                                    const isAL = (r: { label?: string }) => r.label && r.label.includes("*Arabic Language");
                                                    const isIVE = (r: { label?: string }) => r.label && r.label.includes("*Islamic Values Education");
                                                    const coreRows = rows.filter(r => !isAL(r) && !isIVE(r));
                                                    const alRow = rows.find(isAL) || { key: "arabic", label: "*Arabic Language", type: "subject" };
                                                    const iveRow = rows.find(isIVE) || { key: "islamic", label: "*Islamic Values Education", type: "subject" };
                                                    finalRows = [...coreRows];
                                                    while (finalRows.length < 13) {
                                                        finalRows.push({ key: `extra_${finalRows.length}`, label: " ", type: "subject" });
                                                    }
                                                    finalRows.push(alRow);
                                                    finalRows.push(iveRow);
                                                }

                                                return (
                                                    <>
                                                        <thead className="bg-white font-bold">
                                                            <tr className={isES ? "h-4.5" : "h-3.5"}>
                                                                <td rowSpan={2} className={isES ? "w-[35%] border-r-black border-r text-[11.3px]" : "w-[35%] border-r-black border-r"}>LEARNING AREAS</td>
                                                                <td colSpan={is3Term ? 3 : 4} className="border-l-black border-l">
                                                                    {is3Term ? "Term Rating" : "Quarterly Rating"}
                                                                </td>
                                                                <td rowSpan={2} className={isES ? "w-[12%] leading-tight text-[11.3px]" : "w-[12%] leading-tight"}>FINAL<br/>RATING</td>
                                                                <td rowSpan={2} className={isES ? "w-[20%]" : "w-[15%]"}>REMARKS</td>
                                                            </tr>
                                                            <tr className={isES ? "h-4 text-[10.3px]" : "h-3 text-[10.3px]"}>
                                                                <td className={`${is3Term ? "w-[11%]" : (isES ? "w-[8.25%]" : "w-[8.25%]")} border-l-black border-l`}>1</td>
                                                                <td className={is3Term ? "w-[11%]" : (isES ? "w-[8.25%]" : "w-[8.25%]")}>2</td>
                                                                <td className={is3Term ? "w-[11%]" : (isES ? "w-[8.25%]" : "w-[8.25%]")}>3</td>
                                                                {(!is3Term) && <td className={isES ? "w-[8.25%]" : "w-[8.25%]"}>4</td>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {finalRows.map((row, rIdx) => {
                                                                const sub = (getRaw(`scholasticRecords[${blockIdx}].subjects.${row.key}`) as AnyObject) || {};
                                                                const dotKey = `scholasticRecords[${blockIdx}].subjects.${row.key}.label`;
                                                                const underKey = `scholasticRecords[${blockIdx}].subjects.${row.key}_label`;
                                                                const hasOverride = sub.label !== undefined || data[dotKey] !== undefined || data[underKey] !== undefined;
                                                                const customLabel = hasOverride
                                                                    ? asString(sub.label !== undefined ? sub.label : (data[dotKey] !== undefined ? data[dotKey] : data[underKey]))
                                                                    : undefined;

                                                                const displayLabel = customLabel !== undefined ? customLabel : (row.label !== " " ? row.label : "");
                                                                const isBlank = !displayLabel || displayLabel.trim() === '';
                                                                const shouldShowData = !isBlank;

                                                                const isComponent = ['music', 'arts', 'physicalEducation', 'health', 'musicAndArts', 'peAndHealth', 'musicarts', 'pehealth'].includes(row.key) || (row.indent && row.key !== 'mapeh');
                                                                const finalRatingVal = isComponent ? '' : (shouldShowData ? asString(sub.finalRating) : '');
                                                                const remarksVal = isComponent ? '' : (shouldShowData ? asString(sub.remarks) : '');

                                                                return (
                                                                    <tr key={rIdx} className={isES ? "h-4.5" : "h-3.75"}>
                                                                        <td className={`text-left ${getLearningAreaIndentClass(row)} ${isES ? "text-[11.8px]" : ""}`}>
                                                                            <SF10SubjectCombobox
                                                                                value={displayLabel}
                                                                                onChange={(val) => {
                                                                                    onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}_label`, val);
                                                                                    onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.label`, val);
                                                                                }}
                                                                                placeholder=""
                                                                                dbSubjects={dbSubjects}
                                                                                isComponent={isComponent}
                                                                                level={isES || (blockGradeNum >= 1 && blockGradeNum <= 6) ? 'elem' : 'jhs'}
                                                                                gradeLevel={blockGradeNum || (isES ? 1 : 7)}
                                                                            />
                                                                        </td>
                                                                        <td className={`${is3Term ? "w-[11%]" : (isES ? "w-[8.25%]" : "w-[11%]")} ${isES ? "text-[11.8px]" : ""}`}>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-center border-none bg-transparent focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                                value={shouldShowData ? asString(sub.q1) : ''}
                                                                                onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.q1`, e.target.value)}
                                                                            />
                                                                        </td>
                                                                        <td className={`${is3Term ? "w-[11%]" : (isES ? "w-[8.25%]" : "w-[11%]")} ${isES ? "text-[11.8px]" : ""}`}>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-center border-none bg-transparent focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                                value={shouldShowData ? asString(sub.q2) : ''}
                                                                                onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.q2`, e.target.value)}
                                                                            />
                                                                        </td>
                                                                        <td className={`${is3Term ? "w-[11%]" : (isES ? "w-[8.25%]" : "w-[11%]")} ${isES ? "text-[11.8px]" : ""}`}>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-center border-none bg-transparent focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                                value={shouldShowData ? asString(sub.q3) : ''}
                                                                                onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.q3`, e.target.value)}
                                                                            />
                                                                        </td>
                                                                        {(!is3Term) && (
                                                                            <td className={`${isES ? "w-[8.25%]" : "w-[11%]"} ${isES ? "text-[11.8px]" : ""}`}>
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full text-center border-none bg-transparent focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                                    value={shouldShowData ? asString(sub.q4) : ''}
                                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.q4`, e.target.value)}
                                                                                />
                                                                            </td>
                                                                        )}
                                                                        <td className={`font-bold ${isES ? "text-[11.3px]" : ""}`}>
                                                                            <input
                                                                                type="text"
                                                                                disabled={isComponent}
                                                                                className="w-full text-center border-none bg-transparent font-bold focus:outline-none focus:bg-amber-50/70 text-[10px] disabled:opacity-0"
                                                                                value={finalRatingVal}
                                                                                onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.finalRating`, e.target.value)}
                                                                            />
                                                                        </td>
                                                                        <td className={`uppercase ${isES ? "text-[10.3px]" : "text-[9.3px]"}`}>
                                                                            <SF10RemarkCombobox
                                                                                disabled={isComponent}
                                                                                inputClassName={isES ? "text-[10.3px]" : "text-[8.5px]"}
                                                                                value={remarksVal}
                                                                                onChange={(val) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.${row.key}.remarks`, val)}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            <tr className={isES ? "font-bold h-4.5 bg-white" : "font-bold h-3.75"}>
                                                                <td></td>
                                                                <td colSpan={is3Term ? 3 : 4} className="text-center italic font-bold text-[10.3px]">General Average</td>
                                                                <td className={`border-l-black border-l ${isES ? "text-[11.3px]" : ""}`}>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full text-center border-none bg-transparent font-bold focus:outline-none focus:bg-amber-50/70 text-[10px]"
                                                                        value={getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`)}
                                                                        onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].subjects.generalAverage`, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="uppercase text-[10.3px]">
                                                                    {(() => {
                                                                        const genAvgRemPath = `scholasticRecords[${blockIdx}].subjects.remarks`;
                                                                        const hasGenAvgRemOverride = data[genAvgRemPath] !== undefined;
                                                                        const genAvgRaw = parseFloat(getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`));
                                                                        const computedGenAvgRem = genAvgRaw >= 75 ? 'PROMOTED' : genAvgRaw > 0 ? 'RETAINED' : '';
                                                                        const rawRem = getVal(genAvgRemPath);
                                                                        const displayGenAvgRem = hasGenAvgRemOverride 
                                                                            ? asString(data[genAvgRemPath]) 
                                                                            : (rawRem === 'PASSED' ? 'PROMOTED' : (rawRem || computedGenAvgRem));
                                                                        return (
                                                                            <SF10GeneralAverageRemarkCombobox
                                                                                inputClassName={isES ? "text-[10.3px]" : "text-[8.5px]"}
                                                                                value={displayGenAvgRem}
                                                                                onChange={(val) => onUpdate?.(genAvgRemPath, val)}
                                                                            />
                                                                        );
                                                                    })()}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </>
                                                );
                                            })()}
                                        </table>
                                        <div className="h-2 sf-header-shade border border-black w-full mt-auto shrink-0"></div>
                                        <div className="bg-white">
                                            <table className="excel-table text-[11.3px] text-center border-none w-full grow">
                                                <thead>
                                                    <tr className="h-3.5 font-bold text-[9.3px] bg-white">
                                                        <td className="border-black border-b border-r" style={{ width: '30%' }}>Remedial Classes</td>
                                                        <td colSpan={4} className="text-left text-[9.3px] px-2 font-bold border-black border-b">
                                                            <span>Conducted from:</span>
                                                            <span className="fill-blank min-w-15 mx-1 px-1">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.conductedFrom`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.conductedFrom`, e.target.value)}
                                                                />
                                                            </span>
                                                            <span className="ml-6">to:</span>
                                                            <span className="fill-blank min-w-15 mx-1 px-1">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.conductedTo`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.conductedTo`, e.target.value)}
                                                                />
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr className="h-3 font-bold text-[9.3px] uppercase bg-white">
                                                        <td className="border-black border-r" style={{ width: '30%' }}>Learning Areas</td>
                                                        <td className="border-black border-r" style={{ width: '15%' }}>Final Rating</td>
                                                        <td className="border-black border-r" style={{ width: '18%' }}>Remedial Mark</td>
                                                        <td className="border-black border-r leading-tight" style={{ width: '22%' }}>Recomputed Grade</td>
                                                        <td style={{ width: '15%' }}>Remarks</td>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[0, 1].map((rIdx) => (
                                                        <tr key={rIdx} className="h-2.75">
                                                            <td className="border-black border-r text-left px-1">
                                                                <input
                                                                    type="text"
                                                                    className="w-full border-none bg-transparent focus:outline-none text-[8.5px] uppercase"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].learningArea`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].learningArea`, e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="border-black border-r">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].finalRating`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].finalRating`, e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="border-black border-r">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].remedialMark`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].remedialMark`, e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="border-black border-r">
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].recomputedGrade`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].recomputedGrade`, e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="w-full text-center border-none bg-transparent uppercase focus:outline-none text-[8.5px]"
                                                                    value={getVal(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].remarks`)}
                                                                    onChange={(e) => onUpdate?.(`scholasticRecords[${blockIdx}].remedial.classes[${rIdx}].remarks`, e.target.value)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {!isES && (
                            <div className="mt-0.5 mb-0.5 bg-white overflow-hidden">
                                <div className="text-[11.3px] font-bold p-1 px-2 uppercase leading-tight border-b border-black bg-white">For Transfer Out / JHS Completer Only</div>
                                <div className="text-center font-bold sf-header-shade border-b border-black py-0.5 text-[11.5pt]">CERTIFICATION</div>
                                <div className="p-1 px-2 text-[10px] leading-relaxed">
                                    <div className="flex items-end mb-1 flex-nowrap shrink-0 gap-1">
                                        <span className="whitespace-nowrap">I CERTIFY that this is a true record of</span>
                                        <span className="fill-blank grow min-w-35 uppercase font-bold text-center px-1">
                                            <input
                                                type="text"
                                                className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px] tracking-tight placeholder:text-gray-300 print:placeholder:text-transparent"
                                                value={getVal("certification.page1.recordOf")}
                                                onChange={(e) => onUpdate?.("certification.page1.recordOf", e.target.value)}
                                                placeholder="Enter Name"
                                            />
                                        </span>
                                        <span className="whitespace-nowrap">with LRN</span>
                                        <span className="fill-blank w-20 min-w-18 max-w-21 shrink-0 uppercase font-bold text-center px-0.5">
                                            <input
                                                type="text"
                                                className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px]"
                                                value={getVal("certification.page1.lrn")}
                                                onChange={(e) => onUpdate?.("certification.page1.lrn", e.target.value)}
                                            />
                                        </span>
                                        <span className="whitespace-nowrap">and that he/she is eligible for admission to Grade</span>
                                        <span className="fill-blank w-7 min-w-6 max-w-7.5 shrink-0 uppercase font-bold text-center px-0.5">
                                            <input
                                                type="text"
                                                className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px] placeholder:text-gray-300 print:placeholder:text-transparent"
                                                value={getVal("certification.page1.eligibleForGrade")}
                                                onChange={(e) => onUpdate?.("certification.page1.eligibleForGrade", e.target.value)}
                                                placeholder="Grade"
                                            />
                                        </span>
                                        <span>.</span>
                                    </div>
                                    <div className="flex items-end mb-1 flex-nowrap shrink-0 gap-1">
                                        <span className="whitespace-nowrap">Name of School:</span>
                                        <span className="fill-blank grow uppercase font-bold text-center px-1">
                                            <input
                                                type="text"
                                                className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px] placeholder:text-gray-300 print:placeholder:text-transparent"
                                                value={getVal("certification.page1.schoolName")}
                                                onChange={(e) => onUpdate?.("certification.page1.schoolName", e.target.value)}
                                                placeholder="School Name"
                                            />
                                        </span>
                                        <span className="whitespace-nowrap">School ID:</span>
                                        <span className="fill-blank w-17.5 min-w-15 shrink-0 uppercase font-bold text-center px-0.5">
                                            <input
                                                type="text"
                                                className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px]"
                                                value={getVal("certification.page1.schoolId")}
                                                onChange={(e) => onUpdate?.("certification.page1.schoolId", e.target.value)}
                                                placeholder="ID"
                                            />
                                        </span>
                                        <span className="whitespace-nowrap">Last School Year Attended:</span>
                                        <span className="fill-blank w-20 min-w-18 shrink-0 uppercase font-bold text-center px-0.5">
                                            <input
                                                type="text"
                                                className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none text-[9.5px]"
                                                value={getVal("certification.page1.lastSchoolYearAttended")}
                                                onChange={(e) => onUpdate?.("certification.page1.lastSchoolYearAttended", e.target.value)}
                                                placeholder="YYYY-YYYY"
                                            />
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end gap-4 pt-0">
                                        <div className="min-w-25 text-center">
                                            <div className="border-b border-black w-full mb-0.5 min-h-4">
                                                <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal("certification.page1.date")} onChange={(e) => onUpdate?.("certification.page1.date", e.target.value)} />
                                            </div>
                                            <div className="text-[10px] uppercase leading-tight">Date</div>
                                        </div>
                                        <div className="grow text-center">
                                            <div className="border-b border-black w-full mb-0.5 min-h-4 flex items-center justify-center">
                                                <input type="text" className="border-none bg-transparent w-full text-center font-bold uppercase focus:outline-none" value={getVal("certification.page1.principalSignatureName")} onChange={(e) => onUpdate?.("certification.page1.principalSignatureName", e.target.value)} />
                                            </div>
                                            <div className="text-[10px] uppercase leading-tight">Signature of Principal/School Head over Printed Name</div>
                                        </div>
                                        <div className="min-w-37.5 text-center">
                                            <div className="text-[10px] uppercase">(Affix School Seal Here)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`@page { size: 8.5in 13in; margin: 0mm; } @media print { html, body { height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; } .sf10-container { background: white !important; padding: 0 !important; margin: 0 !important; height: auto !important; display: block !important; } .page { box-shadow: none !important; margin: 0 !important; padding: 15pt 0.35in 0.15in 0.35in !important; height: 12.95in !important; width: 8.5in !important; display: flex !important; flex-direction: column !important; break-after: page !important; position: relative !important; } }`}</style>
        </div>
    );
};

export default SF10JHSRenderer;
