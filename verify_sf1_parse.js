const path = require('path');
const xlsx = require(path.join(__dirname, 'app', 'node_modules', 'xlsx'));
const wb = xlsx.readFile('C:\\Users\\Emerson\\Downloads\\SF1_Template.xls');
const sheet = wb.Sheets[wb.SheetNames[0]];
const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Row 2 (School ID, Region, Division):', jsonData[2]);
console.log('Row 3 (School Name, SY, Grade Level, Section):', jsonData[3]);

let headerRowIndex = -1;
for (let i = 0; i < jsonData.length; i++) {
  const row = jsonData[i];
  if (row && row.some(cell => String(cell).includes('LRN'))) {
    headerRowIndex = i;
    break;
  }
}
console.log('Header Row Index:', headerRowIndex);

let males = [];
let females = [];
let isScanningMales = true;

for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
  const row = jsonData[i];
  if (!row) continue;
  const colC = String(row[2] || '').trim();
  if (colC.includes('TOTAL MALE')) { isScanningMales = false; continue; }
  if (colC.includes('TOTAL FEMALE')) break;
  if (!colC.includes(',')) continue;

  const lrn = String(row[0] || row[1] || '').trim();
  const name = colC;
  const sex = String(row[6] || '').trim();
  const dob = String(row[7] || '').trim();
  const barangay = String(row[17] || '').trim();
  const city = String(row[20] || '').trim();
  const father = String(row[27] || '').trim();
  const mother = String(row[31] || '').trim();

  const item = { lrn, name, sex, dob, barangay, city, father, mother };
  if (sex === 'M') males.push(item);
  else if (sex === 'F') females.push(item);
}

console.log(`Parsed Total: ${males.length + females.length} (Males: ${males.length}, Females: ${females.length})`);
console.log('\n--- First 3 Males ---');
console.log(males.slice(0, 3));
console.log('\n--- First 3 Females ---');
console.log(females.slice(0, 3));
