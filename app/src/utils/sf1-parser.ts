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
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

                // Detect if this is a Senior High School (SHS) SF1
                const isSHS = (sheetName || '').toLowerCase().includes('shs') || 
                              jsonData.some(row => row && row.some(cell => {
                                  const cStr = String(cell);
                                  return cStr.includes('Senior High School') || cStr.includes('SF1-SHS') || cStr.includes('SF 1-SHS');
                              }));

                // Dynamic Header / Start Scan Row detection
                let headerRowIndex = -1;
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row.some(cell => String(cell).includes('LRN') || String(cell).includes('Learner Reference Number'))) {
                        headerRowIndex = i;
                        break;
                    }
                }
                const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 6;

                const students: Student[] = [];
                let isScanningMales = true;

                for (let i = startRow; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row) continue;

                    // Column C is Index 2 (Name column in both JHS/ES and SHS)
                    const colC = String(row[2] || '').trim();

                    // Check for Headers/Stop Markers
                    if (colC.includes('TOTAL MALE')) {
                        isScanningMales = false; // Next section is females
                        continue;
                    }
                    if (colC.includes('TOTAL FEMALE')) {
                        break; // End of list
                    }

                    // Extract LRN (Col A/Index 0 is primary, fallback to Col B)
                    let lrnRaw = row[0];
                    if (!lrnRaw) {
                        lrnRaw = row[1];
                    }
                    
                    if (!lrnRaw) continue; // Not a valid LRN (Skip rows with no LRN)

                    if (!colC.includes(',')) continue; // Name must have comma

                    // Parse Name (Col C)
                    const nameParts = colC.split(',').map(s => s.trim());
                    const lastName = nameParts[0];
                    let firstName = nameParts[1] || '';
                    let middleName = nameParts[2] || '';

                    // Smart name parsing fallback for FirstName MiddleName formats (when no second comma is present)
                    if (!middleName && firstName.includes(' ')) {
                        const firstParts = firstName.split(/\s+/);
                        if (firstParts.length > 1) {
                            middleName = firstParts.pop() || '';
                            firstName = firstParts.join(' ');
                        }
                    }

                    let birthdate = '';
                    let age = 0;
                    let religion = '';
                    let motherTongue = '';
                    let isIP = false;
                    let ethnicGroup = '';
                    let address = '';
                    let fatherName = '';
                    let motherName = '';
                    let guardianName = '';
                    let relationship = '';

                    if (isSHS) {
                        // --- SHS SPECIFIC INDEXES ---
                        // Parse Birthdate (Col L -> Index 11)
                        const dobRaw = row[11];
                        if (typeof dobRaw === 'number') {
                            birthdate = excelDateToJSDate(dobRaw);
                        } else if (typeof dobRaw === 'string') {
                            birthdate = parseStringDate(dobRaw);
                        } else if (dobRaw instanceof Date) {
                            birthdate = dobRaw.toISOString().split('T')[0];
                        }

                        // Parse Age (Col O -> Index 14)
                        age = Number(row[14]) || 0;

                        // Religion (Col Q -> Index 16)
                        religion = String(row[16] || '').trim();

                        // Address parsing (Col U=20 Purok/Street, Z=25 Barangay, AE=30 Municipality, AG=32 Province)
                        const street = String(row[20] || '').trim();
                        const barangay = String(row[25] || '').trim();
                        const municipality = String(row[30] || '').trim();
                        const province = String(row[32] || '').trim();
                        address = [street, barangay, municipality, province].filter(Boolean).join(', ');

                        // Parent/Guardian Info (Col AK=36 Father, AP=41 Mother, AR=43 Guardian, AV=47 Relationship)
                        fatherName = String(row[36] || '').trim();
                        motherName = String(row[41] || '').trim();
                        guardianName = String(row[43] || '').trim();
                        relationship = String(row[47] || '').trim();
                    } else {
                        // --- STANDARD JHS/ES INDEXES ---
                        // Parse Birthdate (Col H -> Index 7)
                        const dobRaw = row[7];
                        if (typeof dobRaw === 'number') {
                            birthdate = excelDateToJSDate(dobRaw);
                        } else if (typeof dobRaw === 'string') {
                            birthdate = parseStringDate(dobRaw);
                        } else if (dobRaw instanceof Date) {
                            birthdate = dobRaw.toISOString().split('T')[0];
                        }

                        // Parse Age (Col J -> Index 9)
                        age = Number(row[9]) || 0;

                        // Mother Tongue (L=11), IP (M=12), Ethnicity (N=13), Religion (O=14)
                        motherTongue = String(row[11] || '').trim();
                        isIP = String(row[12] || '').trim().toUpperCase() === 'YES' || String(row[12] || '').trim() === '/';
                        ethnicGroup = String(row[13] || '').trim();
                        religion = String(row[14] || '').trim();

                        // Parse Address (Col R=17, S=18, T=19, U=20, V=21, W=22)
                        const houseNo = String(row[17] || '').trim();
                        const street = String(row[18] || '').trim();
                        const barangay = String(row[20] || '').trim();
                        const municipality = String(row[21] || '').trim();
                        const province = String(row[22] || '').trim();
                        address = [houseNo, street, barangay, municipality, province].filter(Boolean).join(', ');

                        // Father Index 27 or 23, Mother Index 31 or 24, Guardian Index 35 or 25, Relationship Index 36 or 26
                        fatherName = String(row[27] || row[23] || '').trim();
                        motherName = String(row[31] || row[24] || '').trim();
                        guardianName = String(row[35] || row[25] || '').trim();
                        relationship = String(row[36] || row[26] || '').trim();
                    }

                    students.push({
                        lrn: String(lrnRaw).trim(),
                        last_name: lastName,
                        first_name: firstName,
                        middle_name: middleName,
                        gender: isScanningMales ? 'Male' : 'Female',
                        birthday: birthdate,
                        age: age,
                        address: address,
                        mother_tongue: motherTongue,
                        is_ip: isIP,
                        ethnic_group: ethnicGroup,
                        religion: religion,
                        father_name: fatherName,
                        mother_name: motherName,
                        guardian_name: guardianName,
                        guardian_relationship: relationship,
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
