const fs = require('fs');
const path = require('path');

const scratchDir = path.join(__dirname, 'scratch');
const sf9Path = path.join(__dirname, 'src', 'pages', 'SF9Page.tsx');

// Start from a clean git status of the file
console.log('Restoring SF9Page.tsx from clean git status first...');
const { execSync } = require('child_process');
try {
    execSync('git checkout src/pages/SF9Page.tsx', { cwd: __dirname });
} catch (err) {
    console.error('Failed to git checkout:', err.message);
}

let sf9Content = fs.readFileSync(sf9Path, 'utf8');

const files = fs.readdirSync(scratchDir);
const steps = [];

files.forEach(file => {
    if (file.startsWith('step_') && file.endsWith('.json')) {
        const stepNum = parseInt(file.replace('step_', '').replace('.json', ''), 10);
        const filePath = path.join(scratchDir, file);
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Normalize path string from JSON
            let targetFile = (data.TargetFile || '').replace(/\\/g, '/');
            if (targetFile.includes('SF9Page.tsx')) {
                steps.push({
                    stepNum,
                    file,
                    targetContent: data.TargetContent || data.targetContent || '',
                    replacementContent: data.ReplacementContent || data.replacementContent || '',
                });
            }
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    }
});

// Sort steps chronologically
steps.sort((a, b) => a.stepNum - b.stepNum);

console.log(`Found ${steps.length} steps for SF9Page.tsx`);

let successCount = 0;
steps.forEach(step => {
    // Some targetContent might be wrapped in quotes
    let target = step.targetContent;
    if (target.startsWith('"') && target.endsWith('"')) {
        try {
            target = JSON.parse(target);
        } catch {
            target = target.slice(1, -1);
        }
    }
    
    let replacement = step.replacementContent;
    if (replacement.startsWith('"') && replacement.endsWith('"')) {
        try {
            replacement = JSON.parse(replacement);
        } catch {
            replacement = replacement.slice(1, -1);
        }
    }
    
    // Normalize newlines in both target and sf9Content for matching
    const normTarget = target.replace(/\r\n/g, '\n');
    const normContent = sf9Content.replace(/\r\n/g, '\n');
    
    if (normContent.includes(normTarget)) {
        sf9Content = normContent.replace(normTarget, replacement.replace(/\r\n/g, '\n'));
        console.log(`[OK] Applied ${step.file} (Step ${step.stepNum})`);
        successCount++;
    } else {
        console.warn(`[WARN] Could not find TargetContent for ${step.file} (Step ${step.stepNum})`);
    }
});

fs.writeFileSync(sf9Path, sf9Content, 'utf8');
console.log(`Finished. Applied ${successCount}/${steps.length} steps.`);
