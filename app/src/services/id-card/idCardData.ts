/**
 * Student ID Generator — view-model builder.
 *
 * Normalizes a Student + SchoolProfile + IdCardConfig into a flat, render-ready
 * model consumed by IdCardFront / IdCardBack. Keeps all formatting/defaulting in
 * one place so the React components stay purely presentational and the same model
 * feeds both the on-screen preview and the PDF export.
 */
import type { IdCardConfig, IdCardTemplate, SchoolProfile, Student } from '../../types';

export const DEFAULT_ID_PRIMARY_COLOR = '#0A3D91'; // DepEd blue
export const DEFAULT_ID_ACCENT_COLOR = '#ed1c24';  // DepEd red

/** Config used when a school has never opened the template settings. */
export function getDefaultIdCardConfig(): IdCardConfig {
    return {
        template: 'standard',
        primaryColor: DEFAULT_ID_PRIMARY_COLOR,
        accentColor: DEFAULT_ID_ACCENT_COLOR,
        show: { qr: true, barcode: true, gradeSection: true, signature: true, address: true, slot: true },
        emergencyText: '',
        serialPrefix: '',
    };
}

/** Merge a (possibly partial/legacy) stored config over the defaults. */
export function resolveIdCardConfig(config?: IdCardConfig | null): IdCardConfig {
    const defaults = getDefaultIdCardConfig();
    if (!config) return defaults;
    return {
        ...defaults,
        ...config,
        show: { ...defaults.show, ...(config.show || {}) },
    };
}

/** "FIRST MIDDLE LAST EXT" (uppercased), collapsing empty parts. */
export function composeFullName(student: Pick<Student, 'first_name' | 'middle_name' | 'last_name' | 'name_extension'>): string {
    return [student.first_name, student.middle_name, student.last_name, student.name_extension]
        .map((p) => (p || '').trim())
        .filter(Boolean)
        .join(' ')
        .toUpperCase();
}

/** "LAST, FIRST M." — for compact layouts / sorting. */
export function composeNameLastFirst(student: Pick<Student, 'first_name' | 'middle_name' | 'last_name' | 'name_extension'>): string {
    const mid = (student.middle_name || '').trim();
    const initial = mid ? ` ${mid.charAt(0).toUpperCase()}.` : '';
    const ext = (student.name_extension || '').trim();
    const last = `${(student.last_name || '').trim()}${ext ? ` ${ext}` : ''}`.toUpperCase();
    return `${last}, ${(student.first_name || '').trim().toUpperCase()}${initial}`.replace(/^,\s*/, '');
}

/**
 * Deterministic serial — stable per student, no global counter needed.
 * Format: `${prefix}${last 6 digits of LRN}`. Falls back to a hash for TEMP LRNs.
 */
export function buildSerial(config: IdCardConfig, student: Pick<Student, 'lrn' | 'id_serial'>): string {
    if (student.id_serial) return student.id_serial;
    const prefix = config.serialPrefix || '';
    const digits = (student.lrn || '').replace(/\D/g, '');
    const tail = digits.length >= 6 ? digits.slice(-6) : (digits || hashTail(student.lrn || ''));
    return `${prefix}${tail}`;
}

function hashTail(input: string): string {
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
    return String(h % 1_000_000).padStart(6, '0');
}

/** Human-readable payload encoded into the QR — scans show student info directly. */
export function buildQrPayload(
    student: Pick<Student, 'lrn' | 'first_name' | 'last_name' | 'middle_name' | 'name_extension' | 'grade_level' | 'student_section'>,
): string {
    const name = composeFullName(student);
    const gradeSec = [student.grade_level, student.student_section]
        .map((p) => (p || '').trim())
        .filter(Boolean)
        .join(' – ');
    return [
        `Name: ${name}`,
        `LRN: ${student.lrn}`,
        `Grade Level and Section: ${gradeSec || 'N/A'}`,
    ].join('\n');
}

export interface IdCardViewModel {
    lrn: string;
    fullName: string;
    nameLastFirst: string;
    gradeLevel: string;
    section: string;
    gradeSectionLine: string;
    serial: string;
    photoUrl?: string;
    // School branding
    schoolName: string;
    schoolId: string;
    region: string;
    division: string;
    district: string;
    schoolAddress: string;
    municipality: string;
    province: string;
    logoUrl?: string;
    signatureUrl?: string;
    bgImageUrl?: string;
    bgImageOpacity: number;
    bgImageSize: 'cover' | 'contain' | 'stretch' | 'actual';
    bgImagePositionX: number;
    bgImagePositionY: number;
    bgImageScale: number;
    bgImageBlur: number;
    bgImageBrightness: number;
    bgImageApplyToBack: boolean;
    signatoryName: string;
    signatoryPosition: string;
    deptName: string;
    validityText: string;
    emergencyText: string;
    emergencyName: string;
    emergencyAddress: string;
    emergencyContact: string;
    signatureScale: number;
    signatureOffsetY: number;
    // Resolved config
    template: IdCardTemplate;
    primaryColor: string;
    accentColor: string;
    show: IdCardConfig['show'];
    headerTextColor?: string;
    headerFontFamily?: 'sans-serif' | 'serif' | 'monospace';
    headerFontSizeScale: number;
    // Pre-rasterized codes (data URLs) — filled in by the page before export.
    qrDataUrl?: string;
    barcodeDataUrl?: string;
    qrPayload: string;
}

export function buildIdCardModel(
    student: Student,
    profile: SchoolProfile,
    rawConfig?: IdCardConfig | null,
    activeSchoolYear?: string,
): IdCardViewModel {
    const config = resolveIdCardConfig(rawConfig);
    const gradeLevel = (student.grade_level || '').trim();
    const section = (student.student_section || '').trim();
    const addressParts = [profile.district, profile.municipality || profile.city, profile.province]
        .map((p) => (p || '').trim())
        .filter(Boolean);

    return {
        lrn: student.lrn,
        fullName: composeFullName(student),
        nameLastFirst: composeNameLastFirst(student),
        gradeLevel,
        section,
        gradeSectionLine: [gradeLevel, section].filter(Boolean).join(' – '),
        serial: buildSerial(config, student),
        photoUrl: student.photo_url,
        schoolName: profile.name || '',
        schoolId: profile.school_id || '',
        region: config.regionName?.trim() || profile.region || 'Region III',
        division: config.divisionName?.trim() || profile.division || 'SCHOOLS DIVISION OF TARLAC PROVINCE',
        district: config.districtName?.trim() || profile.district || 'VICTORIA EAST DISTRICT',
        schoolAddress: addressParts.join(', '),
        municipality: profile.municipality || profile.city || '',
        province: profile.province || '',
        logoUrl: profile.logo_url,
        signatureUrl: profile.head_signature_url,
        bgImageUrl: config.bgImageUrl,
        bgImageOpacity: config.bgImageOpacity ?? 1,
        bgImageSize: config.bgImageSize ?? 'cover',
        bgImagePositionX: config.bgImagePositionX ?? 50,
        bgImagePositionY: config.bgImagePositionY ?? 50,
        bgImageScale: config.bgImageScale ?? 100,
        bgImageBlur: config.bgImageBlur ?? 0,
        bgImageBrightness: config.bgImageBrightness ?? 100,
        bgImageApplyToBack: config.bgImageApplyToBack ?? true,
        signatoryName: config.signatoryName?.trim() || profile.head_name || '',
        signatoryPosition: config.signatoryPosition?.trim() || profile.head_position || 'School Head',
        deptName: config.deptName?.trim() || 'Department of Education',
        validityText: config.validityText?.trim() || (activeSchoolYear ? `S.Y. ${activeSchoolYear}` : 'S.Y. 2026-2027'),
        emergencyText: config.emergencyText?.trim() || 'In Case of Emergency Please Notify:',
        emergencyName: student.guardian_name?.trim() || student.parent_name?.trim() || student.father_name?.trim() || student.mother_name?.trim() || 'Parent\'s Name',
        emergencyAddress: student.address?.trim() || 'Brgy. Municipality, Province',
        emergencyContact: student.parent_contact?.trim() || student.contact_number?.trim() || '0912-345-6789',
        signatureScale: config.signatureScale ?? 1.0,
        signatureOffsetY: config.signatureOffsetY ?? 0,
        template: config.template,
        primaryColor: config.primaryColor || DEFAULT_ID_PRIMARY_COLOR,
        accentColor: config.accentColor || DEFAULT_ID_ACCENT_COLOR,
        show: config.show,
        headerTextColor: config.headerTextColor,
        headerFontFamily: config.headerFontFamily,
        headerFontSizeScale: config.headerFontSizeScale ?? 1.0,
        qrPayload: buildQrPayload(student),
    };
}
