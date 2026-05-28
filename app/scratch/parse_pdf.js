const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = 'C:\\Users\\Emerson\\Downloads\\SSHS-SHAPING-PAPER-BCD-a_o-May-22 (1).pdf';
const outputPath = path.join(__dirname, 'shaping_paper_text.txt');

async function extractText() {
    try {
        console.log('Reading PDF file as buffer...');
        const buffer = fs.readFileSync(pdfPath);
        
        console.log('Converting buffer to Uint8Array...');
        const uint8Array = new Uint8Array(buffer);
        
        console.log('Instantiating PDFParse...');
        const parser = new pdf.PDFParse(uint8Array);
        
        console.log('Calling getText()...');
        const result = await parser.getText();
        
        console.log('Writing text to file...');
        fs.writeFileSync(outputPath, result.text, 'utf8');
        
        console.log('SUCCESS: Extracted PDF text successfully to shaping_paper_text.txt!');
        console.log('Total pages:', result.total);
    } catch (error) {
        console.error('FAILED to parse PDF:', error);
    }
}

extractText();
