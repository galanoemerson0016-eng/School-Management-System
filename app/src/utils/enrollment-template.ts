import * as XLSX from 'xlsx';
import type { Student } from '../types';

/**
 * Downloads a sample spreadsheet (.xlsx) for student enrollment
 * containing headers based on whether the section is advisory or not.
 */
export const downloadEnrollmentTemplate = (sectionName: string, isAdvisory: boolean = true) => {
    const headers = isAdvisory 
        ? ['LRN', 'LAST NAME', 'FIRST NAME', 'MIDDLE NAME', 'NAME EXTENSION', 'GENDER']
        : ['LAST NAME', 'FIRST NAME', 'MIDDLE NAME', 'NAME EXTENSION', 'GENDER'];
    
    // Provide sample entries to guide the user
    const data = [
        headers,
        isAdvisory 
            ? ['102345678901', 'DOE', 'JOHN', 'SMITH', 'JR', 'Male']
            : ['DOE', 'JOHN', 'SMITH', 'JR', 'Male'],
        isAdvisory
            ? ['102345678902', 'DELA CRUZ', 'MARIA', 'SANTOS', '', 'Female']
            : ['DELA CRUZ', 'MARIA', 'SANTOS', '', 'Female']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Auto-fit column widths
    const wscols = isAdvisory 
        ? [
            { wch: 15 }, // LRN
            { wch: 20 }, // LAST NAME
            { wch: 20 }, // FIRST NAME
            { wch: 20 }, // MIDDLE NAME
            { wch: 15 }, // NAME EXTENSION
            { wch: 10 }  // GENDER
          ]
        : [
            { wch: 20 }, // LAST NAME
            { wch: 20 }, // FIRST NAME
            { wch: 20 }, // MIDDLE NAME
            { wch: 15 }, // NAME EXTENSION
            { wch: 10 }  // GENDER
          ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, 'Enrollment Template');

    const fileName = `Student_Enrollment_Template_${sectionName.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
};

/**
 * Parses the custom enrollment spreadsheet / CSV.
 * Converts names to uppercase (ALL CAPS), validates gender, and generates
 * unique temporary LRNs starting with "TEMP-" if not provided.
 */
export const parseEnrollmentTemplate = async (file: File): Promise<Partial<Student>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) return reject("No data read from file");

                // Parse workbook (works for .xlsx, .xls, and .csv)
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert worksheet to double-array (AOA)
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

                if (jsonData.length === 0) {
                    return reject("The uploaded file is empty.");
                }

                // Locate header row containing standard columns
                let headerRowIndex = -1;
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row.some(cell => {
                        const cellStr = String(cell).toUpperCase().trim();
                        return cellStr === 'LAST NAME' || cellStr === 'FIRST NAME';
                    })) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    return reject("Could not find a valid header row. Make sure your template contains 'LAST NAME' and 'FIRST NAME' columns.");
                }

                const headers = (jsonData[headerRowIndex] as unknown[]).map(h => String(h || '').toUpperCase().trim());
                
                const colLrnIdx = headers.indexOf('LRN');
                const colLastNameIdx = headers.indexOf('LAST NAME');
                const colFirstNameIdx = headers.indexOf('FIRST NAME');
                const colMiddleNameIdx = headers.indexOf('MIDDLE NAME');
                const colNameExtensionIdx = headers.indexOf('NAME EXTENSION');
                const colGenderIdx = headers.indexOf('GENDER');

                if (colLastNameIdx === -1 || colFirstNameIdx === -1 || colGenderIdx === -1) {
                    return reject("Required columns ('LAST NAME', 'FIRST NAME', 'GENDER') are missing from the sheet.");
                }

                const students: Partial<Student>[] = [];

                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row) continue;

                    const lastNameRaw = String(row[colLastNameIdx] || '').trim();
                    const firstNameRaw = String(row[colFirstNameIdx] || '').trim();

                    // Skip row if both first name and last name are empty
                    if (!lastNameRaw && !firstNameRaw) continue;

                    let lrn = '';
                    if (colLrnIdx !== -1) {
                        lrn = String(row[colLrnIdx] || '').trim();
                    }
                    // Validate LRN format (must be 12 digits or a TEMP LRN)
                    if (!lrn || (!/^\d{12}$/.test(lrn) && !lrn.startsWith('TEMP-'))) {
                        lrn = `TEMP-${Date.now()}-${Math.floor(Math.random() * 10000)}-${i}`;
                    }

                    const middleNameRaw = colMiddleNameIdx !== -1 ? String(row[colMiddleNameIdx] || '').trim() : '';
                    const nameExtRaw = colNameExtensionIdx !== -1 ? String(row[colNameExtensionIdx] || '').trim() : '';
                    const genderRaw = String(row[colGenderIdx] || '').trim();

                    // Resolve gender defaults
                    let gender: 'Male' | 'Female' = 'Male';
                    if (genderRaw.toLowerCase().startsWith('f')) {
                        gender = 'Female';
                    }

                    // Strict uppercase rule
                    const lastName = lastNameRaw.toUpperCase();
                    const firstName = firstNameRaw.toUpperCase();
                    const middleName = middleNameRaw.toUpperCase();
                    const nameExtension = nameExtRaw.toUpperCase();

                    students.push({
                        lrn,
                        last_name: lastName,
                        first_name: firstName,
                        middle_name: middleName,
                        name_extension: nameExtension,
                        gender,
                        birthday: '',
                        age: 0,
                        address: '',
                        contact_number: '',
                        enrollment_date: new Date().toISOString().split('T')[0]
                    });
                }

                resolve(students);
            } catch (error) {
                reject("Parse error: " + error);
            }
        };

        reader.onerror = () => reject("File reading failed");
        reader.readAsBinaryString(file);
    });
};
