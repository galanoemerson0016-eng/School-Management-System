import * as XLSX from 'xlsx';
import type { Student } from '../types';

// Helper to convert Excel date serial to YYYY-MM-DD
const excelDateToJSDate = (serial: number) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
};

// Helper: parse string dates (MM/DD/YYYY, M/D/YYYY, etc.)
// Also handles - or . separators.
const parseStringDate = (dateStr: string): string => {
    if (!dateStr) return '';
    let cleanStr = dateStr.trim();

    // Normalize . and - to /
    cleanStr = cleanStr.replace(/[-.]/g, '/');

    // Handle M/D/YYYY format explicitly if detected
    if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        // Expecting 3 parts: M, D, Y
        if (parts.length === 3) {
            let [m, d, y] = parts;

            // Pad M and D
            if (m.length === 1) m = '0' + m;
            if (d.length === 1) d = '0' + d;

            // Handle 2-digit year (assume 20xx)
            if (y.length === 2) y = '20' + y;

            // Validate constructed date string (YYYY-MM-DD)
            const isoCheck = `${y}-${m}-${d}`;
            const checkDate = new Date(isoCheck);
            if (!isNaN(checkDate.getTime())) {
                return isoCheck;
            }
        }
    }

    // Check if already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
        return cleanStr;
    }

    // Fallback: Try generic parsing (good for "May 15, 2012")
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }

    return ''; // Return empty if invalid so input stays blank (less confusing than showing garbage)
};

export const parseSF1 = async (file: File): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) return reject("No data read from file");

                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert to array of arrays (0-indexed rows and cols)
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                const students: Student[] = [];
                let isScanningMales = true;

                // Start scanning from Row 7 (Index 6) as per VBA
                for (let i = 6; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row) continue;

                    // Column C is Index 2
                    const colC = String(row[2] || '').trim();

                    // Check for Headers/Stop Markers
                    if (colC.includes('TOTAL MALE')) {
                        isScanningMales = false; // Next section is females
                        continue;
                    }
                    if (colC.includes('TOTAL FEMALE')) {
                        break; // End of list
                    }

                    // Extract LRN (Col A -> Index 0)
                    const lrnRaw = row[0];
                    if (!lrnRaw) continue; // Skip empty rows
                    if (!colC.includes(',')) continue; // Name must have comma

                    // Parse Name (Col C)
                    const nameParts = colC.split(',').map(s => s.trim());
                    const lastName = nameParts[0];
                    const firstName = nameParts[1] || '';
                    const middleName = nameParts[2] || '';

                    // Parse Birthdate (Col H -> Index 7)
                    let birthdate = '';
                    const dobRaw = row[7];
                    if (typeof dobRaw === 'number') {
                        birthdate = excelDateToJSDate(dobRaw);
                    } else if (typeof dobRaw === 'string') {
                        birthdate = parseStringDate(dobRaw);
                    } else if (dobRaw instanceof Date) {
                        birthdate = dobRaw.toISOString().split('T')[0];
                    }

                    // Parse Age (Col J -> Index 9)
                    const age = Number(row[9]) || 0;

                    // Parse Address (Col R=17, U=20, W=22)
                    const addr1 = row[17] || '';
                    const addr2 = row[20] || '';
                    const addr3 = row[22] || '';
                    const address = [addr1, addr2, addr3].filter(Boolean).join(', ');

                    students.push({
                        lrn: String(lrnRaw),
                        last_name: lastName,
                        first_name: firstName,
                        middle_name: middleName,
                        gender: isScanningMales ? 'Male' : 'Female',
                        birthday: birthdate,
                        age: age,
                        address: address,
                        grade_level: '',
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
