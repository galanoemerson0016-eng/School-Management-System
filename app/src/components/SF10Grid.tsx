import React from 'react';
import excelStructure from '../data/excel_structure_v2.json';
import { cellToCoords, rangeToSpan, SCALING } from '../utils/excelUtils';

interface CellData {
  v: string;
  align?: 'left' | 'center' | 'right';
  border?: boolean;
}

interface SheetData {
  dimensions: string;
  cols: Record<string, number>;
  rows: Record<string, number>;
  merged_cells: string[];
  cells: Record<string, CellData>;
}

interface SF10GridProps {
  sheetName: 'Front' | 'Back';
  dataOverrides?: Record<string, string>;
  onCellEdit?: (cellRef: string, value: string) => void;
  dataMapping?: Record<string, string>;
}

const SF10Grid: React.FC<SF10GridProps> = ({ 
  sheetName, 
  dataOverrides = {}, 
  onCellEdit,
  dataMapping = {}
}) => {
  const workbook = excelStructure as Record<string, SheetData>;
  const sheet = workbook[sheetName];
  if (!sheet) return <div className="p-10 text-center text-red-500 font-bold bg-red-50 rounded border">Structure for "{sheetName}" not found in Excel data.</div>;

  const { cols = {}, rows = {}, merged_cells = [], cells = {} } = sheet;

  const colLetters = Object.keys(cols).sort((a, b) => {
    const aC = cellToCoords(a + '1').col;
    const bC = cellToCoords(b + '1').col;
    return aC - bC;
  });

  const rowNumbers = Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b));

  if (colLetters.length === 0 || rowNumbers.length === 0) {
     return <div className="p-10 text-center text-gray-500">The selected sheet is empty or has no dimensions defined.</div>;
  }

  const gridTemplateColumns = colLetters
    .map(letter => `${(cols[letter] || 0) * SCALING.COL_UNIT}px`)
    .join(' ');

  const gridTemplateRows = rowNumbers
    .map(num => `${(rows[num] || 0) * SCALING.ROW_UNIT}px`)
    .join(' ');

  const getCellValue = (ref: string) => {
    if (dataOverrides[ref] !== undefined) return dataOverrides[ref];
    if (dataMapping[ref] !== undefined) return dataMapping[ref];
    return cells[ref]?.v || '';
  };

  return (
    <div className="sf10-wrapper perspective-1000 py-12 px-4 flex justify-center bg-[#f0f2f5] min-h-screen">
      <div 
        className="sf10-page-container relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] mx-auto border border-gray-200 transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)]"
        style={{
          width: 'fit-content',
          padding: '0.4in',
          boxSizing: 'border-box',
          backgroundColor: '#fff',
          pageBreakAfter: 'always',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap');
          
          .sf10-grid {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 7pt;
            line-height: 1.1;
            color: #000;
          }
          
          .cell-editable:hover {
            background-color: rgba(58, 123, 255, 0.05) !important;
            outline: 1px dashed #3A7BFF;
          }
          
          .cell-editable:focus {
            background-color: rgba(58, 123, 255, 0.1) !important;
            outline: 1px solid #3A7BFF;
            z-index: 10;
          }

          @media print {
            body { background: white !important; padding: 0 !important; }
            .sf10-wrapper { background: none !important; padding: 0 !important; display: block !important; }
            .sf10-page-container {
              width: 8.5in !important;
              height: 13in !important;
              padding: 0.25in !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .sf10-grid {
               zoom: 0.98;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        `}</style>

        {/* Floating Logos for High Fidelity (Only on Page 1) */}
        {sheetName === 'Front' && (
          <>
            <img 
              src={`${import.meta.env.BASE_URL}logos/logo_left.png`} 
              alt="DepEd Logo" 
              className="absolute top-[0.6in] left-[0.6in] w-[0.8in] h-auto pointer-events-none"
            />
            <img 
              src={`${import.meta.env.BASE_URL}logos/logo_right.png`} 
              alt="DepEd Logo" 
              className="absolute top-12 right-[0.6in] w-[0.9in] h-auto pointer-events-none"
            />
          </>
        )}

        <div 
          className="sf10-grid relative z-10"
          style={{
            display: 'grid',
            gridTemplateColumns,
            gridTemplateRows,
          }}
        >
          {merged_cells.map(range => {
            const span = rangeToSpan(range);
            const startRef = range.split(':')[0];
            const cellData = cells[startRef];
            const val = getCellValue(startRef);
            
            // Premium Header Styles
            const isHeader = (val === 'LEARNER\'S INFORMATION' || val === 'ELIGIBILITY FOR JHS ENROLMENT' || val === 'SCHOLASTIC RECORD' || val === 'LEARNING AREAS' || val === 'Remedial Classes' || val === 'CERTIFICATION');
            
            return (
              <div
                key={range}
                className={onCellEdit && !isHeader ? "cell-editable" : ""}
                style={{
                  gridRow: `${span.rowStart} / ${span.rowEnd}`,
                  gridColumn: `${span.colStart} / ${span.colEnd}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: cellData?.align === 'center' ? 'center' : cellData?.align === 'right' ? 'flex-end' : 'flex-start',
                  textAlign: cellData?.align || 'left',
                  border: cellData?.border ? '0.5pt solid #000' : 'none',
                  padding: '1px 3px',
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  backgroundColor: isHeader ? '#eee' : 'transparent',
                  fontWeight: (isHeader || val.toUpperCase() === val) ? 'bold' : 'normal',
                  fontSize: isHeader ? '8pt' : '7pt',
                  cursor: onCellEdit && !isHeader ? 'text' : 'default',
                  transition: 'background-color 0.2s',
                }}
                contentEditable={!!onCellEdit && !isHeader}
                suppressContentEditableWarning={true}
                onBlur={(e) => onCellEdit && !isHeader && onCellEdit(startRef, e.currentTarget.innerText)}
              >
                {val}
              </div>
            );
          })}

          {Object.entries(cells).filter(([ref, cellData]) => {
            const isMerged = merged_cells.some(range => {
              const span = rangeToSpan(range);
              const coords = cellToCoords(ref);
              return coords.row >= span.rowStart && coords.row < span.rowEnd &&
                     coords.col >= span.colStart && coords.col < span.colEnd;
            });
            return !isMerged && (cellData.v || cellData.border);
          }).map(([ref, cellData]) => {
            const coords = cellToCoords(ref);
            const val = getCellValue(ref);
            
            return (
              <div
                key={ref}
                className={onCellEdit ? "cell-editable" : ""}
                style={{
                  gridRow: coords.row,
                  gridColumn: coords.col,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: cellData?.align === 'center' ? 'center' : cellData?.align === 'right' ? 'flex-end' : 'flex-start',
                  textAlign: cellData?.align || 'left',
                  border: cellData?.border ? '0.5pt solid #000' : 'none',
                  padding: '1px 3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  cursor: onCellEdit ? 'text' : 'default',
                }}
                contentEditable={!!onCellEdit}
                suppressContentEditableWarning={true}
                onBlur={(e) => onCellEdit && onCellEdit(ref, e.currentTarget.innerText)}
              >
                {val}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SF10Grid;
