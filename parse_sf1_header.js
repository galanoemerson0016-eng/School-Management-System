const path = require('path');
const xlsxPath = path.join(__dirname, 'app', 'node_modules', 'xlsx');
const xlsx = require(xlsxPath);
const sf1Path = 'C:\\Users\\Emerson\\Downloads\\SF1_Template.xls';

try {
  const wb = xlsx.readFile(sf1Path);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('=== HEADER ROWS ===');
  rows.slice(0, 10).forEach((r, i) => console.log(`Row ${i}:`, JSON.stringify(r)));
  
  console.log('=== MALE SAMPLE (Rows 10-15) ===');
  rows.slice(10, 15).forEach((r, i) => console.log(`Row ${i + 10}:`, JSON.stringify(r)));

  console.log('=== SUMMARY & FOOTER ROWS (Rows 52-60) ===');
  rows.slice(52, 60).forEach((r, i) => console.log(`Row ${i + 52}:`, JSON.stringify(r)));

} catch (err) {
  console.error('Error reading XLS:', err);
}
