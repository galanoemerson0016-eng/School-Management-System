const fs = require('fs');
const path = require('path');

const files = [
    'SF9Page.tsx',
    'AttendancePage.tsx',
    'SF10Page.tsx',
    'ReportsPage.tsx',
    'EnrollmentCenterPage.tsx',
    'CertificateGeneratorPage.tsx',
    'SF8Page.tsx',
    'LIRPage.tsx',
    'SF5Page.tsx'
];

const pagesDir = 'c:\\Users\\Emerson\\Pictures\\FormEase G7 Special\\app\\src\\pages';

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) return;
    
    let lines = fs.readFileSync(filePath, 'utf8').split('\n');
    
    let groupedStart = -1;
    let groupedEnd = -1;
    let sortedStart = -1;
    let sortedEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const groupedSections = useMemo(() => {')) {
            groupedStart = i;
        }
        if (groupedStart !== -1 && groupedEnd === -1 && lines[i].includes('}, [')) {
            groupedEnd = i;
        }
        
        if (lines[i].includes('const sortedSections = useMemo(() => {') || 
            lines[i].includes('const availableSections = useMemo(() => {') ||
            lines[i].includes('const filteredSections = useMemo(() => {')) {
            sortedStart = i;
        }
        if (sortedStart !== -1 && sortedEnd === -1 && lines[i].includes('}, [')) {
            sortedEnd = i;
        }
    }
    
    if (groupedStart !== -1 && sortedStart !== -1 && groupedStart < sortedStart) {
        console.log(`Fixing ${file}...`);
        const groupedBlock = lines.splice(groupedStart, groupedEnd - groupedStart + 1);
        
        // Find new sortedStart
        let newSortedEnd = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('const sortedSections = useMemo(() => {') || 
                lines[i].includes('const availableSections = useMemo(() => {') ||
                lines[i].includes('const filteredSections = useMemo(() => {')) {
                // Find end
                for (let j = i; j < lines.length; j++) {
                    if (lines[j].includes('}, [')) {
                        newSortedEnd = j;
                        break;
                    }
                }
                break;
            }
        }
        
        if (newSortedEnd !== -1) {
            lines.splice(newSortedEnd + 1, 0, '', ...groupedBlock);
            fs.writeFileSync(filePath, lines.join('\n'));
        }
    } else if (groupedStart === -1 && sortedStart !== -1) {
        // If groupedSections is missing but sortedSections exists, maybe I accidentally deleted it.
        // Let's add it back.
        console.log(`Adding missing groupedSections to ${file}...`);
        const depName = lines[sortedStart].includes('sortedSections') ? 'sortedSections' : 
                        lines[sortedStart].includes('availableSections') ? 'availableSections' : 'filteredSections';
        
        const groupedBlock = [
            `    const groupedSections = useMemo(() => {`,
            `        const groups = {`,
            `            'ELEMENTARY': [],`,
            `            'JUNIOR HIGH SCHOOL': [],`,
            `            'SENIOR HIGH SCHOOL': [],`,
            `            'OTHERS': []`,
            `        };`,
            `        `,
            `        ${depName}.forEach(s => {`,
            `            const gl = (s.section_grade_level || '').toLowerCase();`,
            `            const num = parseInt(gl.replace(/\\D/g, '')) || 0;`,
            `            `,
            `            if (gl.includes('kinder') || (num >= 1 && num <= 6)) {`,
            `                groups['ELEMENTARY'].push(s);`,
            `            } else if (num >= 7 && num <= 10) {`,
            `                groups['JUNIOR HIGH SCHOOL'].push(s);`,
            `            } else if (num >= 11 && num <= 12) {`,
            `                groups['SENIOR HIGH SCHOOL'].push(s);`,
            `            } else {`,
            `                groups['OTHERS'].push(s);`,
            `            }`,
            `        });`,
            `        `,
            `        return groups;`,
            `    }, [${depName}]);`
        ];
        
        // Find sortedEnd
        let sortedEndIdx = -1;
        for (let j = sortedStart; j < lines.length; j++) {
            if (lines[j].includes('}, [')) {
                sortedEndIdx = j;
                break;
            }
        }
        
        if (sortedEndIdx !== -1) {
            lines.splice(sortedEndIdx + 1, 0, '', ...groupedBlock);
            fs.writeFileSync(filePath, lines.join('\n'));
        }
    }
});
