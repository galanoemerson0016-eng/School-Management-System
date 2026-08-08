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

        const cellsToCheck = [
            { label: 'School ID', cell: 'C6' },
            { label: 'School Year', cell: 'K6' },
            { label: 'Report Month', cell: 'X6' },
            { label: 'School Name', cell: 'C8' },
            { label: 'Grade Level', cell: 'X8' },
            { label: 'Section Name', cell: 'AC8' }
        ];

        cellsToCheck.forEach(item => {
            const cell = sheet[item.cell];
            console.log(`${item.label} (${item.cell}):`, cell ? cell.v : 'EMPTY');
        });

        console.log('D12:', sheet['D12'] ? sheet['D12'].v : 'EMPTY');
        console.log('D13:', sheet['D13'] ? sheet['D13'].v : 'EMPTY');
        
        console.log('Row 14 Male start (A14):', sheet['A14'] ? sheet['A14'].v : 'EMPTY');
        console.log('Row 14 Male start (B14):', sheet['B14'] ? sheet['B14'].v : 'EMPTY');
        
        console.log('Row 37 Female start (A37):', sheet['A37'] ? sheet['A37'].v : 'EMPTY');
        console.log('Row 37 Female start (B37):', sheet['B37'] ? sheet['B37'].v : 'EMPTY');

    } catch (e) {
        console.error('Error reading file:', e.message);
    }
});
