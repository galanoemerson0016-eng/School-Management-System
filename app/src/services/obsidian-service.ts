import type { Section, Student, ClassRecord, Subject } from '../types';
import { resolveStudentQuarterGrade } from '../utils/grading-helpers';

export interface ObsidianExportOptions {
    vaultName?: string;
    includeStudents?: boolean;
    includeGrades?: boolean;
    activeSchoolYear?: string;
}

/**
 * Trigger Obsidian URI to open or create a note in an active Obsidian Vault.
 */
export function openInObsidian(vaultName: string, noteTitle: string, markdownContent: string): boolean {
    try {
        const cleanVault = encodeURIComponent(vaultName.trim() || 'FormEase');
        const cleanTitle = encodeURIComponent(noteTitle.trim());
        const cleanContent = encodeURIComponent(markdownContent);
        const uri = `obsidian://new?vault=${cleanVault}&name=${cleanTitle}&content=${cleanContent}`;
        window.open(uri, '_self');
        return true;
    } catch (err) {
        console.error('Failed to open Obsidian URI:', err);
        return false;
    }
}

/**
 * Downloads a single .md file to the user's computer.
 */
export function downloadMarkdownFile(filename: string, content: string): void {
    const cleanFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate a rich Markdown note for a Class Section.
 */
export function generateSectionMarkdown(
    section: Section,
    students: Student[],
    subjects: Subject[],
    classRecords: ClassRecord[],
    activeSchoolYear: string = '2026-2027'
): string {
    const sectionStudents: Student[] = students.filter(
        (s: Student) => s.student_section === section.section_name || s.grade_level === section.section_grade_level
    );

    const maleStudents: Student[] = sectionStudents.filter(
        (s: Student) => s.gender?.toLowerCase() === 'male' || s.gender === 'Male'
    );
    const femaleStudents: Student[] = sectionStudents.filter(
        (s: Student) => s.gender?.toLowerCase() === 'female' || s.gender === 'Female'
    );

    const taughtList = section.taught_subjects && section.taught_subjects.length > 0
        ? section.taught_subjects.map(s => `- [[Subject - ${s}|${s}]]`).join('\n')
        : '*(All grade level subjects)*';

    const maleRows = maleStudents.map((s: Student, i: number) => `| ${i + 1} | \`${s.lrn}\` | **${s.last_name}**, ${s.first_name} ${s.middle_name || ''} | [[Learner - ${s.lrn}\\|Notes]] |`).join('\n');
    const femaleRows = femaleStudents.map((s: Student, i: number) => `| ${i + 1} | \`${s.lrn}\` | **${s.last_name}**, ${s.first_name} ${s.middle_name || ''} | [[Learner - ${s.lrn}\\|Notes]] |`).join('\n');

    return `---
title: Section ${section.section_name} (Grade ${section.section_grade_level})
tags:
  - section
  - grade-${section.section_grade_level}
  - sy-${activeSchoolYear.replace('-', '_')}
adviser: "${section.adviser_name || 'N/A'}"
grade_level: "${section.section_grade_level}"
total_learners: ${sectionStudents.length}
created: ${new Date().toISOString().split('T')[0]}
---

# 🏫 Section: ${section.section_name}

- **Grade Level**: Grade ${section.section_grade_level}
- **Adviser**: **${section.adviser_name || 'Unassigned'}**
- **School Year**: ${activeSchoolYear}
- **Track / Strand**: ${section.track || 'General Curriculum'}
- **Total Learners**: **${sectionStudents.length}** (👦 Male: ${maleStudents.length} | 👧 Female: ${femaleStudents.length})

---

## 📚 Taught Learning Areas
${taughtList}

---

## 👦 Male Learners (${maleStudents.length})

| # | LRN | Full Name | Learner Note |
| :---: | :---: | :--- | :---: |
${maleRows || '| - | - | *No male learners registered* | - |'}

---

## 👧 Female Learners (${femaleStudents.length})

| # | LRN | Full Name | Learner Note |
| :---: | :---: | :--- | :---: |
${femaleRows || '| - | - | *No female learners registered* | - |'}

---

## 📝 Adviser's Class Notes & Observations
- 

`;
}

/**
 * Generate a Markdown note for a Student Anecdotal & Progress Record.
 */
export function generateStudentAnecdotalMarkdown(
    student: Student,
    section: Section | undefined,
    subjects: Subject[],
    classRecords: ClassRecord[],
    activeSchoolYear: string = '2026-2027'
): string {
    const fullName = `${student.last_name}, ${student.first_name} ${student.middle_name || ''}`.trim();
    const sectionName = section?.section_name || student.student_section || 'Unassigned';
    const gradeLevel = section?.section_grade_level || student.grade_level || 'N/A';

    // Calculate quarterly grades for active subjects
    const relevantSubjects = subjects.filter(s => s.grade_level === gradeLevel && s.term !== 'none');
    const gradeRows = relevantSubjects.map(sub => {
        const q1 = resolveStudentQuarterGrade(student.lrn, sub.id, 1, activeSchoolYear, classRecords, [], [], gradeLevel, section?.track, subjects, section?.id);
        const q2 = resolveStudentQuarterGrade(student.lrn, sub.id, 2, activeSchoolYear, classRecords, [], [], gradeLevel, section?.track, subjects, section?.id);
        const q3 = resolveStudentQuarterGrade(student.lrn, sub.id, 3, activeSchoolYear, classRecords, [], [], gradeLevel, section?.track, subjects, section?.id);
        const q4 = resolveStudentQuarterGrade(student.lrn, sub.id, 4, activeSchoolYear, classRecords, [], [], gradeLevel, section?.track, subjects, section?.id);
        
        const validGrades = [q1, q2, q3, q4].filter(g => g > 0);
        const finalGrade = validGrades.length > 0 ? Math.round(validGrades.reduce((a, b) => a + b, 0) / validGrades.length) : '';
        
        return `| **${sub.subject_name}** | ${q1 || '-'} | ${q2 || '-'} | ${q3 || '-'} | ${q4 || '-'} | **${finalGrade || '-'}** |`;
    }).join('\n');

    return `---
title: Learner ${fullName} (${student.lrn})
tags:
  - learner
  - lrn-${student.lrn}
  - section-${sectionName.toLowerCase().replace(/\s+/g, '_')}
lrn: "${student.lrn}"
gender: "${student.gender || 'N/A'}"
section: "${sectionName}"
grade_level: "${gradeLevel}"
created: ${new Date().toISOString().split('T')[0]}
---

# 👤 Learner Progress Note: ${fullName}

- **LRN**: \`${student.lrn}\`
- **Gender**: ${student.gender || 'N/A'}
- **Section**: [[Section ${sectionName}|${sectionName}]] (Grade ${gradeLevel})
- **Birthday**: ${student.birthday || 'N/A'}
- **Address**: ${student.address || 'N/A'}
- **Contact**: ${student.contact_number || 'N/A'}

---

## 📊 Academic Performance Overview (${activeSchoolYear})

| Learning Area | Q1 | Q2 | Q3 | Q4 | Final |
| :--- | :---: | :---: | :---: | :---: | :---: |
${gradeRows || '| *No subjects recorded* | - | - | - | - | - |'}

---

## 📌 Anecdotal Incident / Behavioral Log

| Date | Observation / Incident | Action Taken | Follow-up / Remarks |
| :---: | :--- | :--- | :--- |
| ${new Date().toISOString().split('T')[0]} | Initial observation logged | Advisory conference | Ongoing |

---

## 💬 Teacher & Guidance Counselor Remarks
- 

`;
}
