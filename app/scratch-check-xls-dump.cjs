const xlsx = require('xlsx');

const files = [
    'C:\\Users\\Emerson\\Desktop\\FormEase Pro\\docs\\SF2 JHS.xls',
    'C:\\Users\\Emerson\\Desktop\\FormEase Pro\\docs\\SF2 SHS.xls'
];

files.forEach(file => {
    console.log(`\n--- Inspecting: ${file} ---`);
    try {
        const workbook = xlsx.readFile(file);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const range = xlsx.utils.decode_range(sheet['!ref']);
        // Print first 20 rows, first 10 columns
        for(let R = range.s.r; R <= Math.min(20, range.e.r); ++R) {
            let rowText = [];
            for(let C = range.s.c; C <= Math.min(10, range.e.c); ++C) {
                const cellAddress = {c:C, r:R};
                const cellRef = xlsx.utils.encode_cell(cellAddress);
                const cell = sheet[cellRef];
                rowText.push(cell ? String(cell.v).substring(0, 15) : 'EMPTY');
            }
            console.log(`Row ${R+1}:`, rowText.join(' | '));
        }

    } catch (e) {
        console.error('Error reading file:', e.message);
    }
});
