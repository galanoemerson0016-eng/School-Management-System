import { describe, it, expect } from 'vitest';
import {
    buildIdCardModel,
    buildSerial,
    composeFullName,
    composeNameLastFirst,
    getDefaultIdCardConfig,
    resolveIdCardConfig,
} from './idCardData';
import type { IdCardConfig, SchoolProfile, Student } from '../../types';

const student: Student = {
    lrn: '123456789012',
    first_name: 'Juan',
    middle_name: 'Santos',
    last_name: 'Dela Cruz',
    name_extension: 'Jr',
    gender: 'Male',
    birthday: '2010-01-01',
    age: 15,
    address: 'Somewhere',
    grade_level: 'Grade 7',
    student_section: 'Rose',
};

const profile: SchoolProfile = {
    school_id: '100001',
    name: 'Test National High School',
    region: 'Region IV-A',
    division: 'Cavite',
    district: 'District 1',
    head_name: 'Maria Reyes',
    head_position: 'Principal II',
    grade_levels_offered: 'Grade 7-10',
    municipality: 'Dasmariñas',
    province: 'Cavite',
};

describe('name composition', () => {
    it('composes full name uppercased in first-middle-last-ext order', () => {
        expect(composeFullName(student)).toBe('JUAN SANTOS DELA CRUZ JR');
    });

    it('composes last-first with middle initial', () => {
        expect(composeNameLastFirst(student)).toBe('DELA CRUZ JR, JUAN S.');
    });

    it('drops empty parts gracefully', () => {
        expect(composeFullName({ first_name: 'Ana', last_name: 'Lim' })).toBe('ANA LIM');
    });
});

describe('config resolution', () => {
    it('fills defaults for an undefined config', () => {
        const c = resolveIdCardConfig(undefined);
        expect(c.template).toBe('standard');
        expect(c.show.qr).toBe(true);
    });

    it('merges partial show flags over defaults', () => {
        const partial = { template: 'compact', show: { qr: false } } as unknown as IdCardConfig;
        const c = resolveIdCardConfig(partial);
        expect(c.template).toBe('compact');
        expect(c.show.qr).toBe(false);
        expect(c.show.barcode).toBe(true); // default preserved
    });
});

describe('serial', () => {
    it('uses prefix + last 6 LRN digits', () => {
        const cfg = { ...getDefaultIdCardConfig(), serialPrefix: '2026-' };
        expect(buildSerial(cfg, { lrn: '123456789012' })).toBe('2026-789012');
    });

    it('prefers an already-issued serial', () => {
        expect(buildSerial(getDefaultIdCardConfig(), { lrn: '123456789012', id_serial: 'FIXED-1' })).toBe('FIXED-1');
    });

    it('produces a stable 6-digit fallback for TEMP LRNs', () => {
        const a = buildSerial(getDefaultIdCardConfig(), { lrn: 'TEMP-abc' });
        const b = buildSerial(getDefaultIdCardConfig(), { lrn: 'TEMP-abc' });
        expect(a).toBe(b);
        expect(a).toMatch(/^\d{6}$/);
    });
});

describe('buildIdCardModel', () => {
    it('maps student + school + config into a render model', () => {
        const model = buildIdCardModel(student, profile, undefined);
        expect(model.fullName).toBe('JUAN SANTOS DELA CRUZ JR');
        expect(model.lrn).toBe('123456789012');
        expect(model.gradeSectionLine).toBe('Grade 7 – Rose');
        expect(model.schoolName).toBe('Test National High School');
        expect(model.signatoryName).toBe('Maria Reyes');
        expect(model.signatoryPosition).toBe('Principal II');
        expect(model.schoolAddress).toContain('Cavite');
    });

    it('honors signatory overrides from config', () => {
        const cfg = { ...getDefaultIdCardConfig(), signatoryName: 'Custom Head', signatoryPosition: 'OIC' };
        const model = buildIdCardModel(student, profile, cfg);
        expect(model.signatoryName).toBe('Custom Head');
        expect(model.signatoryPosition).toBe('OIC');
    });

    it('honors custom identity, validity, and emergency text overrides from config', () => {
        const cfg = {
            ...getDefaultIdCardConfig(),
            deptName: 'Custom Department',
            regionName: 'NCR',
            divisionName: 'Manila Division',
            districtName: 'District X',
            validityText: 'VALIDITY UNTIL 2028',
            emergencyText: 'CONTACT IMMEDIATELY:',
        };
        const model = buildIdCardModel(student, profile, cfg);
        expect(model.deptName).toBe('Custom Department');
        expect(model.region).toBe('NCR');
        expect(model.division).toBe('Manila Division');
        expect(model.district).toBe('District X');
        expect(model.validityText).toBe('VALIDITY UNTIL 2028');
        expect(model.emergencyText).toBe('CONTACT IMMEDIATELY:');
    });

    it('falls back to schoolProfile or activeSchoolYear or system defaults when config is empty', () => {
        // Test fallbacks using profile values
        const modelWithProfile = buildIdCardModel(student, profile, undefined, '2026-2027');
        expect(modelWithProfile.deptName).toBe('Department of Education');
        expect(modelWithProfile.region).toBe('Region IV-A'); // from profile
        expect(modelWithProfile.division).toBe('Cavite'); // from profile
        expect(modelWithProfile.district).toBe('District 1'); // from profile
        expect(modelWithProfile.validityText).toBe('S.Y. 2026-2027'); // from activeSchoolYear
        expect(modelWithProfile.emergencyText).toBe('In Case of Emergency Please Notify:');

        // Test fallbacks when profile values are missing
        const emptyProfile: SchoolProfile = {
            school_id: '',
            name: '',
            region: '',
            division: '',
            district: '',
            head_name: '',
            head_position: '',
            grade_levels_offered: '',
        };
        const modelEmpty = buildIdCardModel(student, emptyProfile, undefined, undefined);
        expect(modelEmpty.region).toBe('Region III'); // default fallback
        expect(modelEmpty.division).toBe('SCHOOLS DIVISION OF TARLAC PROVINCE'); // default fallback
        expect(modelEmpty.district).toBe('VICTORIA EAST DISTRICT'); // default fallback
        expect(modelEmpty.validityText).toBe('S.Y. 2026-2027'); // default fallback when no active school year is passed
    });

    it('builds a human-readable QR payload with name, LRN, and grade/section', () => {
        const model = buildIdCardModel(student, profile, undefined);
        expect(model.qrPayload).toContain('Name: JUAN SANTOS DELA CRUZ JR');
        expect(model.qrPayload).toContain('LRN: 123456789012');
        expect(model.qrPayload).toContain('Grade Level and Section: Grade 7 – Rose');
    });
});
