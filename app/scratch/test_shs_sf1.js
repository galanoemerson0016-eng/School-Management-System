const XLSX = require('xlsx');

// Helper to convert Excel date serial to YYYY-MM-DD
const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
};

// Helper: parse string dates (MM/DD/YYYY, M/D/YYYY, etc.)
const parseStringDate = (dateStr) => {
    if (!dateStr) return '';
    let cleanStr = dateStr.trim();
    cleanStr = cleanStr.replace(/[-.]/g, '/');

    if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        if (parts.length === 3) {
            let [m, d, y] = parts;
            if (m.length === 1) m = '0' + m;
            if (d.length === 1) d = '0' + d;
            if (y.length === 2) y = '20' + y;
            const isoCheck = `${y}-${m}-${d}`;
            const checkDate = new Date(isoCheck);
            if (!isNaN(checkDate.getTime())) {
                return isoCheck;
            }
        }
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
        return cleanStr;
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }
    return '';
};

try {
    const filePath = 'C:\\Users\\Emerson\\Downloads\\School Form 1 (SF 1) (1).xls';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Detect SHS
    const isSHS = (sheetName || '').toLowerCase().includes('shs') || 
                  jsonData.some(row => row && row.some(cell => {
                      const cStr = String(cell);
                      return cStr.includes('Senior High School') || cStr.includes('SF1-SHS') || cStr.includes('SF 1-SHS');
                  }));
                  
    console.log('Detected isSHS:', isSHS);

    let headerRowIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.some(cell => String(cell).includes('LRN') || String(cell).includes('Learner Reference Number'))) {
            headerRowIndex = i;
            break;
        }
    }
    const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 6;
    console.log('Dynamic start row index:', startRow);

    const students = [];
    let isScanningMales = true;

    for (let i = startRow; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;

        const colC = String(row[2] || '').trim();

        if (colC.includes('TOTAL MALE')) {
            isScanningMales = false;
            continue;
        }
        if (colC.includes('TOTAL FEMALE')) {
            break;
        }

        let lrnRaw = row[0];
        if (!lrnRaw) {
            lrnRaw = row[1];
        }
        
        if (!lrnRaw) continue;
        if (!colC.includes(',')) continue;

        const nameParts = colC.split(',').map(s => s.trim());
        const lastName = nameParts[0];
        let firstName = nameParts[1] || '';
        let middleName = nameParts[2] || '';

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
            const dobRaw = row[11];
            if (typeof dobRaw === 'number') {
                birthdate = excelDateToJSDate(dobRaw);
            } else if (typeof dobRaw === 'string') {
                birthdate = parseStringDate(dobRaw);
            } else if (dobRaw instanceof Date) {
                birthdate = dobRaw.toISOString().split('T')[0];
            }

            age = Number(row[14]) || 0;
            religion = String(row[16] || '').trim();

            const street = String(row[20] || '').trim();
            const barangay = String(row[25] || '').trim();
            const municipality = String(row[30] || '').trim();
            const province = String(row[32] || '').trim();
            address = [street, barangay, municipality, province].filter(Boolean).join(', ');

            fatherName = String(row[36] || '').trim();
            motherName = String(row[41] || '').trim();
            guardianName = String(row[43] || '').trim();
            relationship = String(row[47] || '').trim();
        } else {
            const dobRaw = row[7];
            if (typeof dobRaw === 'number') {
                birthdate = excelDateToJSDate(dobRaw);
            } else if (typeof dobRaw === 'string') {
                birthdate = parseStringDate(dobRaw);
            } else if (dobRaw instanceof Date) {
                birthdate = dobRaw.toISOString().split('T')[0];
            }

            age = Number(row[9]) || 0;

            motherTongue = String(row[11] || '').trim();
            isIP = String(row[12] || '').trim().toUpperCase() === 'YES' || String(row[12] || '').trim() === '/';
            ethnicGroup = String(row[13] || '').trim();
            religion = String(row[14] || '').trim();

            const houseNo = String(row[17] || '').trim();
            const street = String(row[18] || '').trim();
            const barangay = String(row[20] || '').trim();
            const municipality = String(row[21] || '').trim();
            const province = String(row[22] || '').trim();
            address = [houseNo, street, barangay, municipality, province].filter(Boolean).join(', ');

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

    console.log('\nParsed Students count:', students.length);
    console.log('\n--- FIRST 5 STUDENTS DUMP ---');
    console.log(JSON.stringify(students.slice(0, 5), null, 2));

} catch (error) {
    console.error(error);
}
