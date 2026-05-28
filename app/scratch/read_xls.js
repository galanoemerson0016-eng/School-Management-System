const XLSX = require('xlsx');

try {
    const filePath = 'C:\\Users\\Emerson\\Downloads\\School Form 1 (SF 1) (1).xls';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log('Searching for totals or stop markers...');
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        
        row.forEach((val, idx) => {
            if (val && String(val).toUpperCase().includes('TOTAL')) {
                console.log(`Row ${i}, Col ${idx}: "${String(val).trim()}"`);
            }
        });
    }
} catch (error) {
    console.error(error);
}
