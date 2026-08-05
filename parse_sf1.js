const path = require('path');
const xlsxPath = path.join(__dirname, 'app', 'node_modules', 'xlsx');
console.log('XLSX Path:', xlsxPath);
const xlsx = require(xlsxPath);
const sf1Path = 'C:\\Users\\Emerson\\Downloads\\SF1_Template.xls';
try {
  const wb = xlsx.readFile(sf1Path);
  console.log('Sheets:', wb.SheetNames);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Total rows:', rows.length);
  rows.slice(0, 60).forEach((r, i) => console.log(`Row ${i}:`, JSON.stringify(r)));
} catch (err) {
  console.error('Error reading XLS:', err);
}
