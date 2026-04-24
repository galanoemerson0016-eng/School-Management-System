import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const filePath = 'c:\\Users\\Emerson\\Desktop\\Web App\\School Management System\\app\\Templates\\School-Form-10-JHS-Learners-Academic Permanent-Record _2_unlocked.xlsx';
const workbook = XLSX.readFile(filePath);

const structure = {};

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref']);
  
  const sheetData = {
    dimensions: sheet['!ref'],
    cols: {},
    rows: {},
    merged_cells: (sheet['!merges'] || []).map(m => XLSX.utils.encode_range(m)),
    cells: {}
  };

  // Approximate widths/heights (XLSX doesn't give precise pixels easily without more work, 
  // but we can get the '!cols' and '!rows' info if available)
  if (sheet['!cols']) {
    sheet['!cols'].forEach((col, i) => {
      sheetData.cols[XLSX.utils.encode_col(i)] = col.wpx || col.width * 7 || 64;
    });
  }
  
  if (sheet['!rows']) {
    sheet['!rows'].forEach((row, i) => {
      sheetData.rows[i + 1] = row.hpx || row.hpt || 15;
    });
  }

  // Extract cell values and some basic style hints if possible (XLSX basic doesn't do much style)
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      const cell = sheet[cell_ref];
      if (cell) {
        sheetData.cells[cell_ref] = {
          v: cell.v ? cell.v.toString() : '',
          t: cell.t
        };
      }
    }
  }

  structure[sheetName] = sheetData;
});

fs.writeFileSync('src/data/excel_structure_v2.json', JSON.stringify(structure, null, 2));
console.log('Extraction complete: app/src/data/excel_structure_v2.json');
