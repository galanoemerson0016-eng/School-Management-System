const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = 'C:\\Users\\Emerson\\Downloads\\DO_s2026_015r.pdf';
const outputPath = 'C:\\Users\\Emerson\\Desktop\\FormEase Pro\\app\\scratch\\do_015_text.txt';

async function extractText() {
    try {
        console.log('Reading PDF:', pdfPath);
        if (!fs.existsSync(pdfPath)) {
            console.error('PDF file does not exist at:', pdfPath);
            return;
        }
        const buffer = fs.readFileSync(pdfPath);
        
        console.log('Parsing PDF...');
        let text = '';
        if (typeof pdf === 'function') {
            const data = await pdf(buffer);
            text = data.text;
            console.log('Successfully extracted using default export function. Total pages:', data.numpages);
        } else if (pdf && pdf.PDFParse) {
            const uint8Array = new Uint8Array(buffer);
            const parser = new pdf.PDFParse(uint8Array);
            const result = await parser.getText();
            text = result.text;
            console.log('Successfully extracted using PDFParse class. Total pages:', result.total);
        } else {
            console.error('Unknown pdf-parse export structure:', typeof pdf, Object.keys(pdf || {}));
            return;
        }
        
        console.log('Writing text to:', outputPath);
        fs.writeFileSync(outputPath, text, 'utf8');
    } catch (err) {
        console.error('Error parsing PDF:', err);
    }
}

extractText();
