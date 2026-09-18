import ExcelJS from 'exceljs';
import type { Student, SchoolProfile, Section } from '../types';
import { isZipTemplate, readNodeTemplateFallback } from '../utils/node-template-fallback';

export interface SF2ExportParams {
    schoolProfile: SchoolProfile;
    section: Section;
    students: Student[];
    activeSchoolYear: string;
    selectedMonth: string;
    attendanceData: Record<string, Record<string, string>>; // LRN -> date_XX -> status
    dateLabels: { dayNumber: string; weekday: string; dateStr: string; }[];
}

/**
 * Main export function. It automatically detects whether to use the JHS or SHS template.
 */
export async function populateSF2Workbook(params: SF2ExportParams): Promise<ExcelJS.Workbook> {
    const gl = params.section.section_grade_level?.toLowerCase() || '';
    const isSHS = gl.includes('11') || gl.includes('12');
    const isElem = /\b(1|2|3|4|5|6|kinder|kindergarten|k)\b/.test(gl);
    
    if (isSHS) {
        return await populateSHS(params);
    } else if (isElem) {
        return await populateJHS(params, 'SF2_ELEM.xlsx');
    } else {
        return await populateJHS(params, 'SF2_JHS.xlsx');
    }
}

/**
 * Headless buffer generator for SF2 Excel report using official DepEd templates
 */
export async function generateSF2WorkbookBuffer(params: SF2ExportParams): Promise<Uint8Array> {
    const workbook = await populateSF2Workbook(params);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer as ArrayBuffer);
}

export async function exportSF2Excel(params: SF2ExportParams) {
    const workbook = await populateSF2Workbook(params);
    const gl = params.section.section_grade_level?.toLowerCase() || '';
    const isSHS = gl.includes('11') || gl.includes('12');
    const prefix = isSHS ? 'SF2_SHS' : 'SF2_JHS';
    await downloadWorkbook(workbook, `${prefix}_${params.section.section_name}_${params.selectedMonth}.xlsx`);
}

/**
 * Loads official SF2 template binary with browser fetch and Node/Electron filesystem fallback
 */
async function fetchSF2TemplateBuffer(templateFilename: string): Promise<ArrayBuffer> {
    const cleanFilename = templateFilename.replace(/^\.?\/?templates\//, '');
    const cleanBase = (import.meta.env.BASE_URL || './').endsWith('/') 
        ? (import.meta.env.BASE_URL || './') 
        : `${import.meta.env.BASE_URL || './'}/`;
    const timestamp = Date.now();

    const candidateUrls = [
        `${cleanBase}templates/${cleanFilename}?t=${timestamp}`,
        `/templates/${cleanFilename}?t=${timestamp}`,
        `templates/${cleanFilename}?t=${timestamp}`,
        `./templates/${cleanFilename}?t=${timestamp}`
    ];

    for (const url of candidateUrls) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const ab = await res.arrayBuffer();
                const bytes = new Uint8Array(ab);
                if (bytes.length >= 1000 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
                    return ab;
                }
            }
        } catch {
            // Try next candidate
        }
    }

    const nodeBytes = await readNodeTemplateFallback([cleanFilename], 1000);
    if (isZipTemplate(nodeBytes)) return nodeBytes.slice().buffer as ArrayBuffer;

    throw new Error(`Failed to load SF2 template: ${cleanFilename}. Ensure file exists in public/templates.`);
}

/**
 * Downloads the workbook to the user's computer
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Junior High School SF2 Export
 */
async function populateJHS(params: SF2ExportParams, templatePath = 'SF2_JHS.xlsx'): Promise<ExcelJS.Workbook> {
    const { schoolProfile, section, students, activeSchoolYear, selectedMonth, attendanceData, dateLabels } = params;
    
    const arrayBuffer = await fetchSF2TemplateBuffer(templatePath);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const sheet = workbook.worksheets[0]; 
    
    if (schoolProfile.school_id) sheet.getCell('F3').value = schoolProfile.school_id;
    if (activeSchoolYear) sheet.getCell('M3').value = activeSchoolYear;
    if (selectedMonth) sheet.getCell('AA3').value = selectedMonth; 
    if (schoolProfile.name) sheet.getCell('F4').value = schoolProfile.name;
    if (section.section_grade_level) sheet.getCell('AA4').value = section.section_grade_level;
    if (section.section_name) sheet.getCell('AM4').value = section.section_name;

    const jhsDateCols: number[] = [];
    sheet.getRow(7).eachCell((cell, colNumber) => {
        const val = cell.value?.toString().trim().toUpperCase();
        if (val && ['M', 'T', 'W', 'TH', 'F'].includes(val)) {
            if (cell.isMerged && cell.master !== cell) return;
            jhsDateCols.push(colNumber);
        }
    });
    const dateCols = jhsDateCols.slice(0, 25);
    
    dateLabels.forEach((dl, idx) => {
        if (idx < dateCols.length) {
            const cell = sheet.getCell(6, dateCols[idx]);
            cell.value = dl.dayNumber;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
    });

    const males = students.filter(s => s.gender === 'Male').sort((a, b) => a.last_name.localeCompare(b.last_name));
    const females = students.filter(s => s.gender === 'Female').sort((a, b) => a.last_name.localeCompare(b.last_name));

    // Find dynamic row boundaries
    let maleTotalRow = -1;
    let femaleTotalRow = -1;
    sheet.eachRow((r, rowNumber) => {
        r.eachCell((cell) => {
            const v = cell.value?.toString().toUpperCase().trim() || '';
            if (v.includes('<=== MALE | TOTAL')) maleTotalRow = rowNumber;
            if (v.includes('<=== FEMALE | TOTAL')) femaleTotalRow = rowNumber;
        });
    });

    const maleStartRow = 8;
    const baseTemplateMaleRows = maleTotalRow !== -1 ? maleTotalRow - maleStartRow : 20;

    if (males.length > baseTemplateMaleRows) {
        throw new Error(`Template Error: Your class has ${males.length} Male students, but the SF2 template only has ${baseTemplateMaleRows} empty rows for Males. To prevent formatting corruption, please open the SF2_JHS.xlsx template in Microsoft Excel and insert more blank rows into the Male section, then try again.`);
    } else if (males.length < baseTemplateMaleRows) {
        const diff = baseTemplateMaleRows - males.length;
        for (let i = 0; i < diff; i++) {
            sheet.getRow(maleStartRow + males.length + i).hidden = true;
        }
    }

    const maleShift = males.length > baseTemplateMaleRows ? males.length - baseTemplateMaleRows : 0;
    const femaleStartRow = maleTotalRow !== -1 ? maleTotalRow + 1 + maleShift : maleStartRow + males.length + 9;
    const baseTemplateFemaleRows = femaleTotalRow !== -1 ? femaleTotalRow - (maleTotalRow + 1) : 20;

    if (females.length > baseTemplateFemaleRows) {
        throw new Error(`Template Error: Your class has ${females.length} Female students, but the SF2 template only has ${baseTemplateFemaleRows} empty rows for Females. To prevent formatting corruption, please open the SF2_JHS.xlsx template in Microsoft Excel and insert more blank rows into the Female section, then try again.`);
    } else if (females.length < baseTemplateFemaleRows) {
        const diff = baseTemplateFemaleRows - females.length;
        for (let i = 0; i < diff; i++) {
            sheet.getRow(femaleStartRow + females.length + i).hidden = true;
        }
    }

    // Populate Students
    fillStudentsJHS(sheet, males, maleStartRow, attendanceData, dateLabels, dateCols);
    fillStudentsJHS(sheet, females, femaleStartRow, attendanceData, dateLabels, dateCols);

    // Populate Daily Totals & Summary Table
    fillDailyTotalsAndSummary(sheet, males, females, attendanceData, dateLabels, dateCols, maleTotalRow, femaleTotalRow, { m: 44, f: 45, total: 46, absent: 39, present: 41 }, selectedMonth);

    // Populate Signatures dynamically
    let adviserSigned = false;
    let headSigned = false;
    sheet.eachRow((r, rowNumber) => {
        r.eachCell((cell, colNumber) => {
            const val = cell.value?.toString().toLowerCase() || '';
            if (!adviserSigned && val.includes('(signature of adviser')) {
                sheet.getCell(rowNumber - 1, colNumber).value = schoolProfile.adviser_name || section.adviser_name || '';
                adviserSigned = true;
            }
            if (!headSigned && val.includes('(signature of school head')) {
                sheet.getCell(rowNumber - 1, colNumber).value = schoolProfile.head_name || '';
                headSigned = true;
            }
        });
    });

    return workbook;
}

/**
 * Senior High School SF2 Export
 */
async function populateSHS(params: SF2ExportParams): Promise<ExcelJS.Workbook> {
    const { schoolProfile, section, students, activeSchoolYear, selectedMonth, attendanceData, dateLabels } = params;
    
    const arrayBuffer = await fetchSF2TemplateBuffer('SF2_SHS.xlsx');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const sheet = workbook.worksheets[0];
    
    if (schoolProfile.name) sheet.getCell('I5').value = schoolProfile.name;
    if (schoolProfile.school_id) sheet.getCell('Y5').value = schoolProfile.school_id;
    if ((section as Section & { semester?: string }).semester) sheet.getCell('I7').value = (section as Section & { semester?: string }).semester;
    if (activeSchoolYear) sheet.getCell('U8').value = activeSchoolYear;
    if (section.section_grade_level) sheet.getCell('AN8').value = section.section_grade_level;
    if (section.section_name) sheet.getCell('I12').value = section.section_name;
    if (selectedMonth) sheet.getCell('BN11').value = selectedMonth;

    // Dynamically set Track and Strand instead of using hardcoded template text
    const trackStrand = [section.track, section.strand].filter(Boolean).join(' - ');
    if (trackStrand) {
        sheet.getCell('BN8').value = trackStrand;
    } else {
        sheet.getCell('BN8').value = 'Academic Track'; // fallback
    }

    const shsDateCols: number[] = [];
    sheet.getRow(17).eachCell((cell, colNumber) => {
        const val = cell.value?.toString().trim().toUpperCase();
        if (val && ['M', 'T', 'W', 'TH', 'F'].includes(val)) {
            if (cell.isMerged && cell.master !== cell) return;
            shsDateCols.push(colNumber);
        }
    });
    const dateCols = shsDateCols.slice(0, 25);
    
    dateLabels.forEach((dl, idx) => {
        if (idx < dateCols.length) {
            const cell = sheet.getCell(16, dateCols[idx]);
            cell.value = dl.dayNumber;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
    });

    const males = students.filter(s => s.gender === 'Male').sort((a, b) => a.last_name.localeCompare(b.last_name));
    const females = students.filter(s => s.gender === 'Female').sort((a, b) => a.last_name.localeCompare(b.last_name));

    // Find dynamic row boundaries
    let maleTotalRow = -1;
    let femaleTotalRow = -1;
    sheet.eachRow((r, rowNumber) => {
        r.eachCell((cell) => {
            const v = cell.value?.toString().toUpperCase().trim() || '';
            if (v.includes('<=== MALE | TOTAL')) maleTotalRow = rowNumber;
            if (v.includes('<=== FEMALE | TOTAL')) femaleTotalRow = rowNumber;
        });
    });

    const maleStartRow = 18;
    const baseTemplateMaleRows = maleTotalRow !== -1 ? maleTotalRow - maleStartRow : 20;

    if (males.length > baseTemplateMaleRows) {
        throw new Error(`Template Error: Your class has ${males.length} Male students, but the SF2 template only has ${baseTemplateMaleRows} empty rows for Males. To prevent formatting corruption, please open the SF2_SHS.xlsx template in Microsoft Excel and insert more blank rows into the Male section, then try again.`);
    } else if (males.length < baseTemplateMaleRows) {
        const diff = baseTemplateMaleRows - males.length;
        for (let i = 0; i < diff; i++) {
            sheet.getRow(maleStartRow + males.length + i).hidden = true;
        }
    }

    const maleShift = males.length > baseTemplateMaleRows ? males.length - baseTemplateMaleRows : 0;
    const femaleStartRow = maleTotalRow !== -1 ? maleTotalRow + 1 + maleShift : maleStartRow + males.length + 9;
    const baseTemplateFemaleRows = femaleTotalRow !== -1 ? femaleTotalRow - (maleTotalRow + 1) : 20;

    if (females.length > baseTemplateFemaleRows) {
        throw new Error(`Template Error: Your class has ${females.length} Female students, but the SF2 template only has ${baseTemplateFemaleRows} empty rows for Females. To prevent formatting corruption, please open the SF2_SHS.xlsx template in Microsoft Excel and insert more blank rows into the Female section, then try again.`);
    } else if (females.length < baseTemplateFemaleRows) {
        const diff = baseTemplateFemaleRows - females.length;
        for (let i = 0; i < diff; i++) {
            sheet.getRow(femaleStartRow + females.length + i).hidden = true;
        }
    }

    // Populate Students
    fillStudentsSHS(sheet, males, maleStartRow, attendanceData, dateLabels, dateCols);
    fillStudentsSHS(sheet, females, femaleStartRow, attendanceData, dateLabels, dateCols);

    // Populate Daily Totals & Summary Table
    fillDailyTotalsAndSummary(sheet, males, females, attendanceData, dateLabels, dateCols, maleTotalRow, femaleTotalRow, { m: 73, f: 75, total: 76, absent: 61, present: 64 }, selectedMonth);

    // Populate Signatures dynamically
    let adviserSignedSHS = false;
    let headSignedSHS = false;
    sheet.eachRow((r, rowNumber) => {
        r.eachCell((cell, colNumber) => {
            const val = cell.value?.toString().toLowerCase() || '';
            if (!adviserSignedSHS && val.includes('(signature of adviser')) {
                sheet.getCell(rowNumber - 1, colNumber).value = schoolProfile.adviser_name || section.adviser_name || '';
                adviserSignedSHS = true;
            }
            if (!headSignedSHS && val.includes('(signature of school head')) {
                sheet.getCell(rowNumber - 1, colNumber).value = schoolProfile.head_name || '';
                headSignedSHS = true;
            }
        });
    });

    return workbook;
}

/**
 * Fills student data and attendance into JHS template
 */
function fillStudentsJHS(
    sheet: ExcelJS.Worksheet, 
    students: Student[], 
    startRow: number, 
    attendanceData: Record<string, Record<string, string>>,
    dateLabels: { dateStr: string; }[],
    dateCols: number[]
) {
    let row = startRow;
    students.forEach((student) => {
        const fullName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name.charAt(0) + '.' : ''}`.trim();
        
        sheet.getCell(row, 3).value = fullName; 

        const record = attendanceData[student.lrn] || {};
        let absentTotal = 0;

        dateLabels.forEach((dl, idx) => {
            if (idx < dateCols.length) {
                const col = dateCols[idx];
                const status = (record[`date_${dl.dateStr}`] || '').toLowerCase();
                let mark = '';
                if (status === 'absent') {
                    mark = 'X';
                    absentTotal++;
                } else if (status === 'tardy' || status === 'late' || status === 'tardy-upper') {
                    mark = 'L';
                } else if (status === 'cutting' || status === 'tardy-lower') {
                    mark = 'CC';
                } else if (status === 'excused') {
                    mark = 'E';
                }
                
                if (mark) {
                    const cell = sheet.getCell(row, col);
                    cell.value = mark;
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                }
            }
        });

        const totalDays = dateLabels.filter(dl => dl.dateStr).length;
        const presentTotal = totalDays > 0 ? totalDays - absentTotal : 0;

        const absentCell = sheet.getCell(row, 39);
        absentCell.value = absentTotal;
        absentCell.font = absentCell.font ? { ...absentCell.font, size: 9 } : { size: 9 };
        absentCell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        const presentCell = sheet.getCell(row, 41);
        presentCell.value = presentTotal; 
        presentCell.font = presentCell.font ? { ...presentCell.font, size: 9 } : { size: 9 };
        presentCell.alignment = { vertical: 'middle', horizontal: 'center' };

        row++;
    });
}

/**
 * Fills student data and attendance into SHS template
 */
function fillStudentsSHS(
    sheet: ExcelJS.Worksheet, 
    students: Student[], 
    startRow: number, 
    attendanceData: Record<string, Record<string, string>>,
    dateLabels: { dateStr: string; }[],
    dateCols: number[]
) {
    let row = startRow;
    students.forEach((student) => {
        const fullName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name.charAt(0) + '.' : ''}`.trim();
        
        sheet.getCell(row, 7).value = fullName; 

        const record = attendanceData[student.lrn] || {};
        let absentTotal = 0;

        dateLabels.forEach((dl, idx) => {
            if (idx < dateCols.length) {
                const col = dateCols[idx];
                const status = (record[`date_${dl.dateStr}`] || '').toLowerCase();
                let mark = '';
                if (status === 'absent') {
                    mark = 'X';
                    absentTotal++;
                } else if (status === 'tardy' || status === 'late' || status === 'tardy-upper') {
                    mark = 'L';
                } else if (status === 'cutting' || status === 'tardy-lower') {
                    mark = 'CC';
                }
                
                if (mark) {
                    const cell = sheet.getCell(row, col);
                    cell.value = mark;
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                }
            }
        });

        const totalDays = dateLabels.filter(dl => dl.dateStr).length;
        const presentTotal = totalDays > 0 ? totalDays - absentTotal : 0;
        
        const absentCell = sheet.getCell(row, 61);
        absentCell.value = absentTotal; 
        absentCell.font = absentCell.font ? { ...absentCell.font, size: 9 } : { size: 9 };
        absentCell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        const presentCell = sheet.getCell(row, 64);
        presentCell.value = presentTotal; 
        presentCell.font = presentCell.font ? { ...presentCell.font, size: 9 } : { size: 9 };
        presentCell.alignment = { vertical: 'middle', horizontal: 'center' };

        row++;
    });
}

function fillDailyTotalsAndSummary(
    sheet: ExcelJS.Worksheet,
    males: Student[],
    females: Student[],
    attendanceData: Record<string, Record<string, string>>,
    dateLabels: { dayNumber: string; weekday: string; dateStr: string; }[],
    dateCols: number[],
    maleTotalRow: number,
    femaleTotalRow: number,
    summaryCols: { m: number, f: number, total: number, absent: number, present: number },
    selectedMonth: string
) {
    if (maleTotalRow === -1 || femaleTotalRow === -1) return;
    
    let totalSchoolDays = 0;
    let totalMalePresent = 0;
    let totalFemalePresent = 0;
    let totalMaleAbsent = 0;
    let totalFemaleAbsent = 0;

    const calculateConsecutive = (studentList: Student[]) => {
        let count = 0;
        studentList.forEach(s => {
            let consecutive = 0;
            let has5 = false;
            dateLabels.forEach((dl, idx) => {
                if (idx < dateCols.length && dl.dateStr) {
                    const status = (attendanceData[s.lrn]?.[`date_${dl.dateStr}`] || '').toLowerCase();
                    if (status === 'absent') {
                        consecutive++;
                        if (consecutive >= 5) has5 = true;
                    } else {
                        consecutive = 0;
                    }
                }
            });
            if (has5) count++;
        });
        return count;
    };

    const totalMaleConsecutive = calculateConsecutive(males);
    const totalFemaleConsecutive = calculateConsecutive(females);

    const setCell = (cell: ExcelJS.Cell, val: string | number, size: number = 7) => {
        cell.value = val;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'SansSerif', size };
    };

    const setTotalCell = (cell: ExcelJS.Cell, val: string | number) => {
        cell.value = val;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Arial', size: 7, bold: true };
    };

    dateLabels.forEach((dl, idx) => {
        if (idx < dateCols.length && dl.dateStr) {
            totalSchoolDays++;
            const col = dateCols[idx];
            
            let maleAbsents = 0;
            males.forEach(m => {
                const status = (attendanceData[m.lrn]?.[`date_${dl.dateStr}`] || '').toLowerCase();
                if (status === 'absent') maleAbsents++;
            });
            const malePresents = males.length - maleAbsents;
            totalMalePresent += malePresents;
            totalMaleAbsent += maleAbsents;
            
            setCell(sheet.getCell(maleTotalRow, col), malePresents);
            
            let femaleAbsents = 0;
            females.forEach(f => {
                const status = (attendanceData[f.lrn]?.[`date_${dl.dateStr}`] || '').toLowerCase();
                if (status === 'absent') femaleAbsents++;
            });
            const femalePresents = females.length - femaleAbsents;
            totalFemalePresent += femalePresents;
            totalFemaleAbsent += femaleAbsents;

            setCell(sheet.getCell(femaleTotalRow, col), femalePresents);
            setCell(sheet.getCell(femaleTotalRow + 1, col), malePresents + femalePresents); // Combined
        }
    });

    const mLen = males.length;
    const fLen = females.length;
    const totalLen = mLen + fLen;

    setTotalCell(sheet.getCell(maleTotalRow, summaryCols.absent), totalMaleAbsent);
    setTotalCell(sheet.getCell(maleTotalRow, summaryCols.present), totalMalePresent);
    
    setTotalCell(sheet.getCell(femaleTotalRow, summaryCols.absent), totalFemaleAbsent);
    setTotalCell(sheet.getCell(femaleTotalRow, summaryCols.present), totalFemalePresent);
    
    setTotalCell(sheet.getCell(femaleTotalRow + 1, summaryCols.absent), totalMaleAbsent + totalFemaleAbsent);
    setTotalCell(sheet.getCell(femaleTotalRow + 1, summaryCols.present), totalMalePresent + totalFemalePresent);

    setTotalCell(sheet.getCell(maleTotalRow, 1), mLen);
    setTotalCell(sheet.getCell(femaleTotalRow, 1), fLen);
    setTotalCell(sheet.getCell(femaleTotalRow + 1, 1), totalLen);
    
    const maleADA = totalSchoolDays > 0 ? totalMalePresent / totalSchoolDays : 0;
    const femaleADA = totalSchoolDays > 0 ? totalFemalePresent / totalSchoolDays : 0;
    const totalADA = maleADA + femaleADA;
    
    const malePct = mLen > 0 ? (maleADA / mLen) * 100 : 0;
    const femalePct = fLen > 0 ? (femaleADA / fLen) * 100 : 0;
    const totalPct = totalLen > 0 ? (totalADA / totalLen) * 100 : 0;

    const round2 = (num: number) => num % 1 === 0 ? num.toString() : num.toFixed(2);

    sheet.eachRow((r, rowNumber) => {
        if (rowNumber > femaleTotalRow) {
            let rowText = '';
            r.eachCell((cell, colNumber) => { 
                if (colNumber >= summaryCols.m - 15 && colNumber < summaryCols.m) {
                    if (cell.value) rowText += cell.value.toString().toLowerCase() + ' '; 
                }
            });
            rowText = rowText.replace(/\s+/g, ' ');

            if (rowText.includes('month :') || rowText.includes('no. of days of classes')) {
                const monthCol = summaryCols.m > 60 ? 61 : 39;
                const monthCell = r.getCell(monthCol);
                if (monthCell.value && monthCell.value.toString().includes('Month')) {
                    monthCell.value = `Month : ${selectedMonth}`;
                }

                const classCol = summaryCols.m > 60 ? 67 : 42;
                const classCell = r.getCell(classCol);
                if (classCell.value && classCell.value.toString().includes('Classes')) {
                    classCell.value = `No. of Days of Classes: ${totalSchoolDays}`;
                }
            } else if (rowText.includes('percentage of enrolment')) {
                setCell(r.getCell(summaryCols.m), mLen > 0 ? 100 : '');
                setCell(r.getCell(summaryCols.f), fLen > 0 ? 100 : '');
                setCell(r.getCell(summaryCols.total), totalLen > 0 ? 100 : '');
            } else if (rowText.includes('late enrolment') || rowText.includes('late enrollment')) {
                setCell(r.getCell(summaryCols.m), '');
                setCell(r.getCell(summaryCols.f), '');
                setCell(r.getCell(summaryCols.total), '');
            } else if (rowText.includes('enrolment as of')) {
                setCell(r.getCell(summaryCols.m), mLen);
                setCell(r.getCell(summaryCols.f), fLen);
                setCell(r.getCell(summaryCols.total), totalLen);
            } else if (rowText.includes('registered learners as of') || rowText.includes('registered learner as of')) {
                setCell(r.getCell(summaryCols.m), mLen);
                setCell(r.getCell(summaryCols.f), fLen);
                setCell(r.getCell(summaryCols.total), totalLen);
            } else if (rowText.includes('percentage of attendance')) {
                setCell(r.getCell(summaryCols.m), malePct === 0 ? '' : round2(malePct) + '%', 5);
                setCell(r.getCell(summaryCols.f), femalePct === 0 ? '' : round2(femalePct) + '%', 5);
                setCell(r.getCell(summaryCols.total), totalPct === 0 ? '' : round2(totalPct) + '%', 5);
            } else if (rowText.includes('average daily attendance')) {
                setCell(r.getCell(summaryCols.m), maleADA === 0 ? '' : round2(maleADA), 6);
                setCell(r.getCell(summaryCols.f), femaleADA === 0 ? '' : round2(femaleADA), 6);
                setCell(r.getCell(summaryCols.total), totalADA === 0 ? '' : round2(totalADA), 6);
            } else if (rowText.includes('5 consecutive days')) {
                setCell(r.getCell(summaryCols.m), totalMaleConsecutive);
                setCell(r.getCell(summaryCols.f), totalFemaleConsecutive);
                setCell(r.getCell(summaryCols.total), totalMaleConsecutive + totalFemaleConsecutive);
            } else if (rowText.includes('dropped out') || rowText.includes('nls')) {
                setCell(r.getCell(summaryCols.m), '');
                setCell(r.getCell(summaryCols.f), '');
                setCell(r.getCell(summaryCols.total), '');
            } else if (rowText.includes('transferred out')) {
                setCell(r.getCell(summaryCols.m), '');
                setCell(r.getCell(summaryCols.f), '');
                setCell(r.getCell(summaryCols.total), '');
            } else if (rowText.includes('transferred in')) {
                setCell(r.getCell(summaryCols.m), '');
                setCell(r.getCell(summaryCols.f), '');
                setCell(r.getCell(summaryCols.total), '');
            }
        }
    });
}
