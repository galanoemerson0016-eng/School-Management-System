const path = require('path');
const xlsx = require(path.join(__dirname, 'app', 'node_modules', 'xlsx'));
const sf1Path = 'C:\\Users\\Emerson\\Downloads\\SF1_Template.xls';
const wb = xlsx.readFile(sf1Path);
const sheet = wb.Sheets[wb.SheetNames[0]];

console.log('Row 2 & 3 merged ranges or cell keys:');
Object.keys(sheet).filter(k => k.startsWith('A') || k.startsWith('F') || k.startsWith('K') || k.startsWith('U') || k.startsWith('AA') || k.startsWith('AF')).forEach(k => {
  if (k.match(/^[A-Z]+[1-9]$/)) {
    console.log(`${k}:`, sheet[k].v);
  }
});
