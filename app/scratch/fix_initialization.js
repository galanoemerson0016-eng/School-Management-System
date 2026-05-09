const fs = require('fs');
const path = require('path');

const files = [
    'SF10Page.tsx',
    'AttendancePage.tsx',
    'SF9Page.tsx',
    'SF5Page.tsx',
    'ConsolidatedGradesPage.tsx',
    'EClassRecord.tsx',
    'NameTagPage.tsx',
    'ReportsPage.tsx',
    'EnrollmentCenterPage.tsx',
    'CertificateGeneratorPage.tsx',
    'SF8Page.tsx',
    'LIRPage.tsx'
];

const pagesDir = 'c:\\Users\\Emerson\\Pictures\\FormEase G7 Special\\app\\src\\pages';

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find groupedSections and sortedSections/availableSections
    const groupedRegex = /const groupedSections = useMemo\(\(\) => \{[\s\S]*?\}, \[.*?\]\);/g;
    const sortedRegex = /const (sortedSections|availableSections) = useMemo\(\(\) => \{[\s\S]*?\}, \[.*?\]\);/g;
    
    const groupedMatch = content.match(groupedRegex);
    const sortedMatch = content.match(sortedRegex);
    
    if (groupedMatch && sortedMatch) {
        const groupedBlock = groupedMatch[0];
        const sortedBlock = sortedMatch[0];
        
        const groupedIndex = content.indexOf(groupedBlock);
        const sortedIndex = content.indexOf(sortedBlock);
        
        if (groupedIndex < sortedIndex) {
            console.log(`Fixing ${file}...`);
            // Remove groupedBlock
            content = content.replace(groupedBlock, '');
            // Re-find sortedBlock index in new content
            const newSortedIndex = content.indexOf(sortedBlock);
            const insertIndex = newSortedIndex + sortedBlock.length;
            
            content = content.slice(0, insertIndex) + '\n\n' + groupedBlock + content.slice(insertIndex);
            
            fs.writeFileSync(filePath, content);
        }
    }
});
