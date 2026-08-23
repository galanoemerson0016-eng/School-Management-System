import { describe, it, expect } from 'vitest';
import {
    SSHS_ELECTIVE_CATALOG,
    findElectiveInCatalog,
    checkSubjectPrerequisites,
    evaluateShsGraduationStatus,
    evaluateTransfereeCredits,
    getClassSizeLimit,
    SSHS_CLASS_SIZE_LIMITS
} from './curriculum';

describe('SSHS Annex A Elective Catalog', () => {
    it('contains all official DepEd Order No. 017, s. 2026 electives', () => {
        expect(SSHS_ELECTIVE_CATALOG.length).toBeGreaterThanOrEqual(70);
        
        // Check Academic Electives
        const acadElectives = SSHS_ELECTIVE_CATALOG.filter(e => e.track === 'Academic');
        expect(acadElectives.length).toBeGreaterThanOrEqual(50);

        // Check Tech-Pro Electives
        const techProElectives = SSHS_ELECTIVE_CATALOG.filter(e => e.track === 'Tech-Pro');
        expect(techProElectives.length).toBeGreaterThanOrEqual(25);
    });

    it('finds electives correctly with fuzzy matching', () => {
        const bio = findElectiveInCatalog('Biology 1');
        expect(bio).toBeDefined();
        expect(bio?.hours).toBe(80);
        expect(bio?.cluster).toBe('Science, Technology, Engineering, and Mathematics');

        const beautyCare = findElectiveInCatalog('Aesthetic Services (Beauty Care)');
        expect(beautyCare).toBeDefined();
        expect(beautyCare?.hours).toBe(320);
        expect(beautyCare?.ncLevel).toBe('NC II');
    });
});

describe('SSHS Prerequisite Validation Engine', () => {
    it('validates single prerequisites correctly', () => {
        const resUnsatisfied = checkSubjectPrerequisites('Contemporary Literature 2', []);
        expect(resUnsatisfied.valid).toBe(false);
        expect(resUnsatisfied.missingPrerequisites).toContain('Contemporary Literature 1');

        const resSatisfied = checkSubjectPrerequisites('Contemporary Literature 2', ['Contemporary Literature 1']);
        expect(resSatisfied.valid).toBe(true);
        expect(resSatisfied.missingPrerequisites.length).toBe(0);
    });

    it('validates multi-subject chained prerequisites', () => {
        const resPartial = checkSubjectPrerequisites('Biology 4', ['Biology 1', 'Biology 2']);
        expect(resPartial.valid).toBe(false);
        expect(resPartial.missingPrerequisites).toContain('Biology 3');

        const resAll = checkSubjectPrerequisites('Biology 4', ['Biology 1', 'Biology 2', 'Biology 3']);
        expect(resAll.valid).toBe(true);
    });

    it('validates "any one" prerequisite rules', () => {
        const resNone = checkSubjectPrerequisites('Art Criticism and Creative Markets', ['General Mathematics']);
        expect(resNone.valid).toBe(false);

        const resOne = checkSubjectPrerequisites('Art Criticism and Creative Markets', ['Creative Industries - Visual Arts']);
        expect(resOne.valid).toBe(true);
    });
});

describe('SSHS Graduation Requirements (Tables 9 & 10)', () => {
    const G11_CORES = [
        { subjectName: 'Effective Communication', finalGrade: 85, isPassed: true },
        { subjectName: 'General Mathematics', finalGrade: 88, isPassed: true },
        { subjectName: 'General Science', finalGrade: 86, isPassed: true },
        { subjectName: 'Life and Career Skills', finalGrade: 90, isPassed: true },
        { subjectName: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', finalGrade: 89, isPassed: true }
    ];

    it('evaluates Pure Academic Track graduation eligibility', () => {
        // 5 cores (800h) + 15 acad electives (1,200h) = 2,000h
        const acadElectives = [
            'Biology 1', 'Biology 2', 'Biology 3', 'Biology 4',
            'Chemistry 1', 'Chemistry 2', 'Chemistry 3', 'Chemistry 4',
            'Physics 1', 'Physics 2', 'Pre-Calculus', 'Basic Calculus',
            'Research 1', 'Research 2', 'Design and Innovation'
        ].map(name => ({ subjectName: name, finalGrade: 85, isPassed: true }));

        const evalResult = evaluateShsGraduationStatus('Academic', [...G11_CORES, ...acadElectives], { isCrossTrack: false });
        expect(evalResult.status).toBe('Eligible');
        expect(evalResult.isEligible).toBe(true);
        expect(evalResult.totalHours).toBe(2000);
        expect(evalResult.coreHours).toBe(800);
        expect(evalResult.electiveHours).toBe(1200);
    });

    it('evaluates Academic Track with Cross-Track option', () => {
        // 5 cores (800h) + 11 acad electives (880h) + 1 Tech-Pro elective (320h) = 2,000h
        const acadElectives = [
            'Biology 1', 'Biology 2', 'Biology 3', 'Biology 4',
            'Chemistry 1', 'Chemistry 2', 'Chemistry 3', 'Chemistry 4',
            'Pre-Calculus', 'Research 1', 'Research 2'
        ].map(name => ({ subjectName: name, finalGrade: 85, isPassed: true }));

        const techProElective = { subjectName: 'Caregiving (Child Care)', finalGrade: 88, isPassed: true };

        const evalResult = evaluateShsGraduationStatus('Academic', [...G11_CORES, ...acadElectives, techProElective], { isCrossTrack: true });
        expect(evalResult.status).toBe('Eligible');
        expect(evalResult.isEligible).toBe(true);
        expect(evalResult.totalHours).toBe(2000);
    });

    it('evaluates Pure Tech-Pro Track graduation eligibility', () => {
        // 5 cores (800h) + G11 Tech-Pro (320h) + G12 Tech-Pro (320h) + Work Immersion (640h) = 2,080h
        const techProSubjects = [
            { subjectName: 'Tourism Services', finalGrade: 88, isPassed: true },
            { subjectName: 'Events Management Services', finalGrade: 90, isPassed: true },
            { subjectName: 'Work Immersion for Tech-Pro Track', finalGrade: 92, isPassed: true },
            { subjectName: 'Work Immersion 2', finalGrade: 94, isPassed: true }
        ];

        const evalResult = evaluateShsGraduationStatus('Tech-Pro', [...G11_CORES, ...techProSubjects], { isCrossTrack: false });
        expect(evalResult.status).toBe('Eligible');
        expect(evalResult.isEligible).toBe(true);
        expect(evalResult.totalHours).toBe(2080);
    });

    it('disqualifies learner if any extra elective fails (DO 017 Section 26.b)', () => {
        const acadElectives = [
            'Biology 1', 'Biology 2', 'Biology 3', 'Biology 4',
            'Chemistry 1', 'Chemistry 2', 'Chemistry 3', 'Chemistry 4',
            'Physics 1', 'Physics 2', 'Pre-Calculus', 'Basic Calculus',
            'Research 1', 'Research 2', 'Design and Innovation'
        ].map(name => ({ subjectName: name, finalGrade: 85, isPassed: true }));

        // Extra elective failed
        const extraFailedElective = { subjectName: 'Creative Composition 1', finalGrade: 70, isPassed: false };

        const evalResult = evaluateShsGraduationStatus('Academic', [...G11_CORES, ...acadElectives, extraFailedElective]);
        expect(evalResult.status).toBe('Disqualified');
        expect(evalResult.isEligible).toBe(false);
        expect(evalResult.failedSubjects).toContain('Creative Composition 1');
        expect(evalResult.disqualificationReason).toContain('Section 26.b');
    });
});

describe('SSHS Annex F.2 Equivalency Matrix & Transferee Evaluator', () => {
    it('credits 2016 K-12 subjects as corresponding SSHS electives', () => {
        const completedK12 = [
            'General Biology 1',
            'General Biology 2',
            'Pre-Calculus',
            'Basic Calculus',
            'Practical Research 1',
            'Practical Research 2'
        ];

        const evalRes = evaluateTransfereeCredits(completedK12);
        expect(evalRes.creditedSshsElectives).toContain('Biology 1');
        expect(evalRes.creditedSshsElectives).toContain('Pre-Calculus');
        expect(evalRes.creditedSshsElectives).toContain('Basic Calculus');
        expect(evalRes.creditedSshsElectives).toContain('Research 1');
        expect(evalRes.recommendation).toBe('Qualified for Grade 12');
    });
});

describe('SSHS Class Size Limits (Table 7)', () => {
    it('enforces maximum class sizes per classification', () => {
        const coreSize = getClassSizeLimit('General Mathematics', 'Grade 11');
        expect(coreSize.maxStudents).toBe(SSHS_CLASS_SIZE_LIMITS.core);
        expect(coreSize.maxStudents).toBe(40);

        const techProSize = getClassSizeLimit('Automotive Servicing (Electrical Repair)', 'Grade 12');
        expect(techProSize.maxStudents).toBe(SSHS_CLASS_SIZE_LIMITS.techpro);
        expect(techProSize.maxStudents).toBe(25);

        const acadSize = getClassSizeLimit('Biology 1', 'Grade 11');
        expect(acadSize.maxStudents).toBe(SSHS_CLASS_SIZE_LIMITS.academic);
        expect(acadSize.maxStudents).toBe(30);
    });
});
