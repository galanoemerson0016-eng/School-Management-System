/**
 * Daily Attendance Sheet — quick per-day roll call for the whole school or one
 * section, with QR/barcode check-in (USB wedge scanner or camera) and automatic
 * sync into the matching SF2 monthly sheets.
 */
import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { useAppStore } from '../stores';
import { extractLrnFromScan } from '../utils/scan-utils';
import type { AttendanceRecord, Student } from '../types';
import {
    ClipboardCheck, ScanLine, Camera, X, Search, CheckCircle2, AlertCircle, QrCode, Download, Printer, FileDown, Smartphone,
} from 'lucide-react';
import { generateQrDataUrl } from '../services/id-card/codes';
import { triggerParentAttendanceSms } from '../services/sms-gateway';
import { formatLearnerName } from '../utils/student-name';
import { broadcastAttendanceUpdate } from '../services/mobile-attendance-sync';
import { PhoneAttendanceModal } from '../components/attendance/PhoneAttendanceModal';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import jsQR from 'jsqr';

type DailyStatus = AttendanceRecord['status'];

const STATUSES: Array<{
    id: DailyStatus;
    label: string;
    short: string;
    chip: string;        // idle chip styling
    active: string;      // selected chip styling
    summaryCard: string;
    summaryValue: string;
}> = [
    {
        id: 'present', label: 'Present', short: 'P',
        chip: 'border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/15',
        active: 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30',
        summaryCard: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
        summaryValue: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        id: 'absent', label: 'Absent', short: 'A',
        chip: 'border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 bg-red-50/60 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/15',
        active: 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/30',
        summaryCard: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400',
        summaryValue: 'text-red-600 dark:text-red-400',
    },
    {
        id: 'late', label: 'Late', short: 'L',
        chip: 'border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/15',
        active: 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/30',
        summaryCard: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400',
        summaryValue: 'text-amber-600 dark:text-amber-400',
    },
    {
        id: 'cutting', label: 'Cutting Class', short: 'CC',
        chip: 'border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-500/5 hover:bg-violet-100 dark:hover:bg-violet-500/15',
        active: 'bg-violet-500 border-violet-500 text-white shadow-md shadow-violet-500/30',
        summaryCard: 'bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20 text-violet-700 dark:text-violet-400',
        summaryValue: 'text-violet-600 dark:text-violet-400',
    },
    {
        id: 'excused', label: 'Excused', short: 'EX',
        chip: 'border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/15',
        active: 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/30',
        summaryCard: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400',
        summaryValue: 'text-blue-600 dark:text-blue-400',
    },
];

function todayIso(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function composeName(s: Student): string {
    return formatLearnerName(s, { middleInitialOnly: true });
}

export function DailyAttendancePage() {
    const students = useAppStore((s) => s.students);
    const sections = useAppStore((s) => s.sections);
    const attendanceRecords = useAppStore((s) => s.attendanceRecords);
    const upsertAttendanceRecords = useAppStore((s) => s.upsertAttendanceRecords);
    const deleteAttendanceRecords = useAppStore((s) => s.deleteAttendanceRecords);
    const showNotification = useAppStore((s) => s.showNotification);

    const [date, setDate] = useState(todayIso());
    // null = user hasn't chosen yet → default to the advisory class when one exists
    const [sectionChoice, setSectionChoice] = useState<string | null>(null);
    const sectionFilter = useMemo(() => {
        if (sectionChoice !== null) return sectionChoice;
        return sections.find((s) => s.is_advisory)?.section_name ?? 'all';
    }, [sectionChoice, sections]);
    const [search, setSearch] = useState('');
    const [scanMode, setScanMode] = useState(false);
    const lateCutoffStorageKey = 'school_attendance_late_cutoff_time';
    const [lateCutoffTime, setLateCutoffTime] = useState(() => {
        try {
            return localStorage.getItem(lateCutoffStorageKey) || '08:00';
        } catch {
            return '08:00';
        }
    });
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [lastScan, setLastScan] = useState<{ ok: boolean; text: string; lrn?: string } | null>(null);
    const schoolProfile = useAppStore((s) => s.schoolProfile);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showPhoneGatewayModal, setShowPhoneGatewayModal] = useState(false);

    // Push active desktop roster & session data to local server for mobile clients
    useEffect(() => {
        if (!students || students.length === 0) return;
        const host = window.location.hostname || 'localhost';
        const currentPort = window.location.port || '3003';
        const proto = window.location.protocol.startsWith('https') ? 'https:' : 'http:';
        const endpoints = Array.from(new Set([
            `/api/attendance/session`,
            `${proto}//${host}:${currentPort}/api/attendance/session`,
            `${proto}//${host}:3003/api/attendance/session`,
            `${proto}//${host}:3001/api/attendance/session`
        ]));

        const payload = JSON.stringify({
            date,
            students,
            sections,
            records: attendanceRecords,
            schoolProfile,
        });

        for (const url of endpoints) {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
            }).catch(() => {});
        }
    }, [date, students, sections, attendanceRecords, schoolProfile]);
    const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null);
    const [studentQrDataUrl, setStudentQrDataUrl] = useState<string>('');

    // (Mobile attendance is now globally synced in App.tsx)
    useEffect(() => {
        if (!selectedStudentForQr) return;
        let cancelled = false;
        void generateQrDataUrl(selectedStudentForQr.lrn, { size: 360, margin: 1 }).then((url) => {
            if (!cancelled) setStudentQrDataUrl(url);
        });
        return () => {
            cancelled = true;
        };
    }, [selectedStudentForQr]);

    const downloadStudentQrCard = useCallback(async (student: Student) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 750;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. Clear & draw outer white card background
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(0, 0, 600, 750, 24);
            } else {
                ctx.rect(0, 0, 600, 750);
            }
            ctx.fill();

            // 2. Card Border (Subtle slate border)
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 6;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(12, 12, 576, 726, 20);
            } else {
                ctx.rect(12, 12, 576, 726);
            }
            ctx.stroke();

            // 3. Header: School Name (Emerald Green)
            ctx.fillStyle = '#059669';
            ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            const schoolName = (schoolProfile?.name || 'School Attendance').toUpperCase();
            ctx.fillText(schoolName, 300, 65);

            // 4. Subtitle: ATTENDANCE QR BADGE (Muted Slate Gray)
            ctx.fillStyle = '#64748B';
            ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
            ctx.fillText('ATTENDANCE QR BADGE', 300, 98);

            // 5. QR Code (Centered on white)
            const qrDataUrl = await generateQrDataUrl(student.lrn, { size: 360, margin: 1 });
            if (qrDataUrl) {
                const img = new Image();
                img.src = qrDataUrl;
                await new Promise((resolve) => { img.onload = resolve; });
                ctx.drawImage(img, 120, 130, 360, 360);
            }

            // 6. Student Full Name (Dark Slate)
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
            const fullName = composeName(student);
            ctx.fillText(fullName, 300, 545);

            // 7. LRN Number (Monospace Slate)
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 22px monospace';
            ctx.fillText(`LRN: ${student.lrn}`, 300, 595);

            // 8. Grade & Section (Sky Blue)
            ctx.fillStyle = '#0284C7';
            ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
            const secText = [student.grade_level, student.student_section].filter(Boolean).join(' — ');
            ctx.fillText(secText || 'Student Record', 300, 640);

            // Download PNG link
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `QR_Attendance_${student.last_name}_${student.first_name}_${student.lrn}.png`;
            a.click();
            showNotification(`Downloaded QR Card for ${student.first_name}`, 'success');
        } catch (err) {
            console.error('Failed to download QR card:', err);
            showNotification('Failed to generate QR card', 'error');
        }
    }, [schoolProfile, showNotification]);

    const downloadPureQrCode = useCallback(async (student: Student) => {
        try {
            const qrDataUrl = await generateQrDataUrl(student.lrn, { size: 512, margin: 1 });
            if (!qrDataUrl) return;
            const a = document.createElement('a');
            a.href = qrDataUrl;
            a.download = `QR_${student.last_name}_${student.first_name}_${student.lrn}.png`;
            a.click();
            showNotification(`Downloaded QR Code PNG for ${student.first_name}`, 'success');
        } catch (err) {
            console.error('Failed to download QR code:', err);
        }
    }, [showNotification]);

    const handleBatchDownloadAllQrCards = useCallback(async (studentList: Student[]) => {
        if (studentList.length === 0) return;
        showNotification(`Generating ${studentList.length} QR Code Cards...`, 'info');
        for (let i = 0; i < studentList.length; i++) {
            await downloadStudentQrCard(studentList[i]);
            await new Promise((r) => setTimeout(r, 200));
        }
        showNotification(`Finished downloading ${studentList.length} QR Cards!`, 'success');
    }, [downloadStudentQrCard, showNotification]);

    const handlePrintQrSheet = useCallback(async (studentList: Student[]) => {
        if (studentList.length === 0) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showNotification('Please allow popups to print QR Sheet', 'error');
            return;
        }

        const schoolName = schoolProfile?.name || 'FormEase Pro School';

        const qrItems = await Promise.all(
            studentList.map(async (s) => ({
                student: s,
                qrUrl: await generateQrDataUrl(s.lrn, { size: 256, margin: 1 }),
            }))
        );

        const cardsHtml = qrItems
            .map(
                ({ student, qrUrl }) => `
                <div class="qr-card">
                    <div class="header">${schoolName}</div>
                    <div class="subtitle">ATTENDANCE QR BADGE</div>
                    <img src="${qrUrl}" class="qr-img" />
                    <div class="student-name">${student.last_name}, ${student.first_name}</div>
                    <div class="lrn">LRN: ${student.lrn}</div>
                    <div class="section">${student.grade_level || ''} ${student.student_section ? `— ${student.student_section}` : ''}</div>
                </div>
            `
            )
            .join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Student Attendance QR Badges Sheet</title>
                <style>
                    @page { size: A4; margin: 10mm; }
                    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background: #fff; color: #0f172a; }
                    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                    .qr-card { border: 2px solid #cbd5e1; border-radius: 12px; padding: 12px; text-align: center; background: #fff; page-break-inside: avoid; }
                    .header { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #059669; }
                    .subtitle { font-size: 8px; font-weight: 700; color: #64748b; letter-spacing: 1px; margin-bottom: 6px; }
                    .qr-img { width: 130px; height: 130px; margin: 0 auto; display: block; }
                    .student-name { font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 6px; }
                    .lrn { font-size: 10px; font-family: monospace; font-weight: 700; color: #475569; }
                    .section { font-size: 9px; font-weight: 700; color: #0284c7; margin-top: 2px; }
                </style>
            </head>
            <body>
                <div class="grid">${cardsHtml}</div>
                <script>
                    window.onload = () => { window.print(); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }, [schoolProfile, showNotification]);

    useEffect(() => {
        try {
            localStorage.setItem(lateCutoffStorageKey, lateCutoffTime);
        } catch {
            // ignore localStorage failures
        }
    }, [lateCutoffTime]);

    // ---------- Roster ----------
    const roster = useMemo(() => {
        const bySection = sectionFilter === 'all'
            ? students
            : students.filter((s) => (s.student_section || '') === sectionFilter);
        const q = search.trim().toLowerCase();
        const searched = q
            ? bySection.filter((s) =>
                composeName(s).toLowerCase().includes(q) || s.lrn.toLowerCase().includes(q))
            : bySection;
        // SF-form ordering: males alphabetically first, then females
        const genderRank = (s: Student) => (s.gender === 'Male' ? 0 : s.gender === 'Female' ? 1 : 2);
        return [...searched].sort((a, b) => {
            const genderCmp = genderRank(a) - genderRank(b);
            if (genderCmp !== 0) return genderCmp;
            const gradeA = parseInt((a.grade_level || '').replace(/\D/g, '')) || 0;
            const gradeB = parseInt((b.grade_level || '').replace(/\D/g, '')) || 0;
            if (gradeA !== gradeB) return gradeA - gradeB;
            const secCmp = (a.student_section || '').localeCompare(b.student_section || '');
            if (secCmp !== 0) return secCmp;
            const lastCmp = a.last_name.localeCompare(b.last_name);
            if (lastCmp !== 0) return lastCmp;
            return a.first_name.localeCompare(b.first_name);
        });
    }, [students, sectionFilter, search]);

    const sectionNames = useMemo(() => {
        return [...sections]
            .sort((a, b) => {
                const ga = parseInt(a.section_grade_level.replace(/\D/g, '')) || 0;
                const gb = parseInt(b.section_grade_level.replace(/\D/g, '')) || 0;
                if (ga !== gb) return ga - gb;
                return a.section_name.localeCompare(b.section_name);
            })
            .map((s) => s.section_name);
    }, [sections]);

    // ---------- Marks for the selected day ----------
    const marks = useMemo(() => {
        const map = new Map<string, DailyStatus>();
        attendanceRecords.forEach((r) => {
            if (r.date === date) map.set(r.student_lrn, r.status);
        });
        return map;
    }, [attendanceRecords, date]);

    // ---------- Marking ----------
    const setStatus = useCallback(async (student: Student, status: DailyStatus | null) => {
        const id = `${student.lrn}_${date}`;
        try {
            if (status === null) {
                await deleteAttendanceRecords([id]);
            } else {
                const record: AttendanceRecord = {
                    id,
                    student_lrn: student.lrn,
                    date,
                    status,
                    section_id: student.student_section || '',
                };
                await upsertAttendanceRecords([record]);

                const studentName = composeName(student);
                broadcastAttendanceUpdate(record, studentName);

                // Trigger Parent SMS Notification for all attendance statuses (present, absent, late, cutting, excused)
                const parentPhone = student.parent_contact || student.parent_guardian_contact || student.contact_number || '';
                if (parentPhone) {
                    const studentName = composeName(student);
                    const schoolName = schoolProfile?.name || 'Calibungan High School';
                    void triggerParentAttendanceSms(studentName, parentPhone, schoolName, status, date)
                        .then((res) => {
                            if (res && res.success) {
                                showNotification(`📱 SMS Alert (${status.toUpperCase()}) Sent to Parent (${parentPhone})`, 'info');
                            }
                        })
                        .catch((err) => console.error('SMS trigger error:', err));
                }
            }
        } catch {
            showNotification('Failed to save attendance mark', 'error');
        }
    }, [date, deleteAttendanceRecords, upsertAttendanceRecords, showNotification, schoolProfile]);

    const toggleStatus = useCallback((student: Student, status: DailyStatus) => {
        const current = marks.get(student.lrn);
        void setStatus(student, current === status ? null : status);
    }, [marks, setStatus]);

    const bulkSet = useCallback(async (status: DailyStatus) => {
        if (roster.length === 0) return;
        const records: AttendanceRecord[] = roster.map((s) => ({
            id: `${s.lrn}_${date}`,
            student_lrn: s.lrn,
            date,
            status,
            section_id: s.student_section || '',
        }));
        try {
            await upsertAttendanceRecords(records);
            showNotification(`Marked ${roster.length} student(s) as ${status}`, 'success');

            // Broadcast real-time sync update for each record to mobile clients
            roster.forEach((student, idx) => {
                const rec = records[idx];
                if (rec) {
                    broadcastAttendanceUpdate(rec, composeName(student));
                }
            });

            // Trigger SMS to parents for ALL statuses (present, absent, late, cutting, excused)
            const schoolName = schoolProfile?.name || 'Calibungan High School';
            let smsCount = 0;
            roster.forEach((student) => {
                const parentPhone = student.parent_contact || student.parent_guardian_contact || student.contact_number || '';
                if (parentPhone) {
                    smsCount++;
                    void triggerParentAttendanceSms(composeName(student), parentPhone, schoolName, status, date);
                }
            });
            if (smsCount > 0) {
                showNotification(`📱 Triggered ${smsCount} Parent SMS Alerts (${status.toUpperCase()})`, 'info');
            }
        } catch {
            showNotification('Bulk update failed', 'error');
        }
    }, [roster, date, upsertAttendanceRecords, showNotification, schoolProfile]);

    const bulkSetUnmarkedToPresent = useCallback(async () => {
        const unmarkedStudents = roster.filter((s) => !marks.has(s.lrn));
        if (unmarkedStudents.length === 0) return;
        const records: AttendanceRecord[] = unmarkedStudents.map((s) => ({
            id: `${s.lrn}_${date}`,
            student_lrn: s.lrn,
            date,
            status: 'present',
            section_id: s.student_section || '',
        }));
        try {
            await upsertAttendanceRecords(records);
            showNotification(`Marked ${unmarkedStudents.length} unmarked student(s) as Present`, 'success');

            // Broadcast real-time sync update for each record to mobile clients
            unmarkedStudents.forEach((student, idx) => {
                const rec = records[idx];
                if (rec) {
                    broadcastAttendanceUpdate(rec, composeName(student));
                }
            });

            const schoolName = schoolProfile?.name || 'Calibungan High School';
            let smsCount = 0;
            unmarkedStudents.forEach((student) => {
                const parentPhone = student.parent_contact || student.parent_guardian_contact || student.contact_number || '';
                if (parentPhone) {
                    smsCount++;
                    void triggerParentAttendanceSms(composeName(student), parentPhone, schoolName, 'present', date);
                }
            });
            if (smsCount > 0) {
                showNotification(`📱 Triggered ${smsCount} Parent SMS Alerts (PRESENT)`, 'info');
            }
        } catch {
            showNotification('Auto-mark failed', 'error');
        }
    }, [roster, marks, date, upsertAttendanceRecords, showNotification, schoolProfile]);

    const bulkClear = useCallback(async () => {
        const ids = roster.filter((s) => marks.has(s.lrn)).map((s) => `${s.lrn}_${date}`);
        if (ids.length === 0) return;
        try {
            await deleteAttendanceRecords(ids);
            showNotification(`Cleared ${ids.length} mark(s)`, 'success');
        } catch {
            showNotification('Clear failed', 'error');
        }
    }, [roster, marks, date, deleteAttendanceRecords, showNotification]);

    // ---------- Scan handling (shared by USB wedge + camera) ----------
    const studentsRef = useRef(students);
    const lateCutoffRef = useRef(lateCutoffTime);
    useEffect(() => {
        studentsRef.current = students;
        lateCutoffRef.current = lateCutoffTime;
    }, [students, lateCutoffTime]);

    const getAutoScanStatus = useCallback((): DailyStatus => {
        const [cutoffHour, cutoffMinute] = lateCutoffRef.current.split(':').map(Number);
        const cutoff = new Date();
        cutoff.setHours(Number.isFinite(cutoffHour) ? cutoffHour : 8, Number.isFinite(cutoffMinute) ? cutoffMinute : 0, 0, 0);
        return new Date() >= cutoff ? 'late' : 'present';
    }, []);

    const handleScan = useCallback((raw: string) => {
        const lrn = extractLrnFromScan(raw);
        if (!lrn) return;
        const student = studentsRef.current.find((s) => s.lrn === lrn);
        if (!student) {
            setLastScan({ ok: false, text: `No student found for scan: ${lrn}` });
            showNotification(`Scan not recognized: ${lrn}`, 'error');
            return;
        }
        const autoStatus = getAutoScanStatus();
        void setStatus(student, autoStatus);
        setLastScan({ ok: true, text: `${composeName(student)} — ${autoStatus.toUpperCase()}`, lrn });
        showNotification(`${composeName(student)} marked ${autoStatus}`, 'success');
    }, [getAutoScanStatus, setStatus, showNotification]);

    // USB scanner (keyboard wedge): rapid keystrokes ending with Enter
    useEffect(() => {
        if (!scanMode) return;
        let buffer = '';
        let lastKeyTime = 0;
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
            const now = Date.now();
            if (e.key === 'Enter') {
                if (buffer.length >= 4) {
                    handleScan(buffer);
                    e.preventDefault();
                }
                buffer = '';
                return;
            }
            if (e.key.length !== 1) return;
            // Scanners type far faster than humans; a long pause starts a new code
            if (now - lastKeyTime > 100) buffer = '';
            buffer += e.key;
            lastKeyTime = now;
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [scanMode, handleScan]);

    // Camera QR scanning via jsQR
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const lastDecodeRef = useRef<{ payload: string; time: number }>({ payload: '', time: 0 });
    const handleScanRef = useRef(handleScan);
    useEffect(() => {
        handleScanRef.current = handleScan;
    }, [handleScan]);

    useEffect(() => {
        if (!cameraOpen) return;
        let stream: MediaStream | null = null;
        let timer: ReturnType<typeof setInterval> | null = null;
        let cancelled = false;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const start = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                const video = videoRef.current;
                if (!video) return;
                video.srcObject = stream;
                await video.play();
                setCameraError('');
                timer = setInterval(() => {
                    if (!ctx || !video.videoWidth) return;
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });
                    if (code && code.data) {
                        const now = Date.now();
                        const last = lastDecodeRef.current;
                        // Debounce: ignore the same code re-read within 3 seconds
                        if (code.data === last.payload && now - last.time < 3000) return;
                        lastDecodeRef.current = { payload: code.data, time: now };
                        handleScanRef.current(code.data);
                    }
                }, 200);
            } catch (error) {
                console.error('Camera access failed:', error);
                setCameraError('Camera unavailable. Check permissions or use a USB scanner instead.');
            }
        };
        void start();

        return () => {
            cancelled = true;
            if (timer) clearInterval(timer);
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, [cameraOpen]);

    // ---------- Summary + trend ----------
    const summary = useMemo(() => {
        const emptySplit = () => ({ total: 0, male: 0, female: 0 });
        const counts: Record<DailyStatus, { total: number; male: number; female: number }> = {
            present: emptySplit(), absent: emptySplit(), late: emptySplit(), cutting: emptySplit(), excused: emptySplit(),
        };
        let male = 0;
        let female = 0;
        let marked = 0;
        roster.forEach((s) => {
            if (s.gender === 'Male') male += 1;
            else if (s.gender === 'Female') female += 1;
            const st = marks.get(s.lrn);
            if (!st) return;
            marked += 1;
            counts[st].total += 1;
            if (s.gender === 'Male') counts[st].male += 1;
            else if (s.gender === 'Female') counts[st].female += 1;
        });
        const total = roster.length;
        const rate = total > 0 ? Math.round((counts.present.total / total) * 100) : 0;
        return { counts, total, male, female, marked, unmarked: total - marked, rate };
    }, [roster, marks]);

    const trendData = useMemo(() => {
        const [y, m] = date.split('-').map(Number);
        if (!y || !m) return [];
        const monthPrefix = `${y}-${String(m).padStart(2, '0')}-`;
        const lrnScope = sectionFilter === 'all'
            ? null
            : new Set(students.filter((s) => (s.student_section || '') === sectionFilter).map((s) => s.lrn));
        const byDay = new Map<number, { present: number; total: number }>();
        attendanceRecords.forEach((r) => {
            if (!r.date.startsWith(monthPrefix)) return;
            if (lrnScope && !lrnScope.has(r.student_lrn)) return;
            const day = Number(r.date.slice(8));
            if (!day) return;
            const agg = byDay.get(day) || { present: 0, total: 0 };
            agg.total += 1;
            if (r.status === 'present' || r.status === 'late') agg.present += 1;
            byDay.set(day, agg);
        });
        return Array.from(byDay.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([day, agg]) => ({
                day,
                rate: agg.total > 0 ? Math.round((agg.present / agg.total) * 100) : 0,
            }));
    }, [attendanceRecords, date, sectionFilter, students]);

    const monthLabel = useMemo(() => {
        const d = new Date(date + 'T00:00:00');
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [date]);

    const trendInsights = useMemo(() => {
        if (trendData.length === 0) {
            return { avg: 0, high: 0, highDay: 0, low: 0, lowDay: 0, days: 0 };
        }

        const total = trendData.reduce((sum, item) => sum + item.rate, 0);
        const highPoint = trendData.reduce((best, item) => (item.rate > best.rate ? item : best), trendData[0]);
        const lowPoint = trendData.reduce((worst, item) => (item.rate < worst.rate ? item : worst), trendData[0]);

        return {
            avg: Math.round(total / trendData.length),
            high: highPoint.rate,
            highDay: highPoint.day,
            low: lowPoint.rate,
            lowDay: lowPoint.day,
            days: trendData.length,
        };
    }, [trendData]);

    // ---------- Render ----------
    return (
        <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto space-y-4">
            {/* Controls bar */}
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#0d1225] shadow-xs p-4 flex flex-wrap items-center gap-3">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value || todayIso())}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-400 cursor-pointer shadow-xs"
                />
                <select
                    value={sectionFilter}
                    onChange={(e) => setSectionChoice(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1225] text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-400"
                >
                    <option value="all">All Sections</option>
                    {sectionNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                <div className="relative flex-1 min-w-45">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or LRN..."
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-400 placeholder:text-slate-400"
                    />
                </div>

                {/* Scan & QR controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowQrModal(true)}
                        className="h-10 px-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                        title="Download or print student QR codes for daily attendance scanning"
                    >
                        <QrCode className="w-4 h-4" />
                        Download QR Codes
                    </button>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/10 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        <span>Auto scan</span>
                        <span className="text-slate-500 dark:text-slate-400 normal-case font-semibold tracking-normal">Late after</span>
                        <input
                            type="time"
                            value={lateCutoffTime}
                            onChange={(e) => setLateCutoffTime(e.target.value || '08:00')}
                            className="bg-transparent outline-none text-emerald-700 dark:text-emerald-300 font-black"
                            title="Students scanned at or after this time are marked late"
                        />
                    </div>
                    <button
                        onClick={() => setScanMode(!scanMode)}
                        title="USB QR/barcode scanner mode: scans type the LRN followed by Enter"
                        className={`h-10 px-3 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                            scanMode
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                        }`}
                    >
                        <ScanLine className="w-4 h-4" />
                        {scanMode ? 'Scanner On' : 'USB Scanner'}
                    </button>
                    <button
                        onClick={() => setCameraOpen(true)}
                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:border-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Camera className="w-4 h-4" />
                        Camera
                    </button>
                    <button
                        onClick={() => setShowPhoneGatewayModal(true)}
                        className="h-10 px-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
                        title="Scan QR code on your phone to open Phone Attendance Gateway"
                    >
                        <Smartphone className="w-4 h-4 text-indigo-200" />
                        Phone Gateway
                    </button>
                </div>
            </div>

            {/* Last scan feedback */}
            {(scanMode || lastScan) && (
                <div className={`rounded-xl border px-4 py-2.5 flex items-center gap-2 text-sm font-bold ${
                    lastScan
                        ? lastScan.ok
                            ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                }`}>
                    {lastScan ? (
                        lastScan.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                        <ScanLine className="w-4 h-4 shrink-0 animate-pulse" />
                    )}
                    <span className="truncate">
                        {lastScan ? lastScan.text : `Scanner ready — scans mark present before ${lateCutoffTime} and late after.`}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                {/* Main sheet */}
                <div className="xl:col-span-2 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#0d1225] shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-2 justify-between">
                        <h3 className="flex items-center gap-2 text-base font-black text-slate-800 dark:text-white">
                            <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                            Daily Attendance Sheet
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {summary.unmarked > 0 && (
                                <button onClick={() => void bulkSetUnmarkedToPresent()} className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm animate-pulse">Fill Unmarked Present ({summary.unmarked})</button>
                            )}
                            <button onClick={() => void bulkSet('present')} className="h-8 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer">All Present</button>
                            <button onClick={() => void bulkSet('absent')} className="h-8 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer">All Absent</button>
                            <button onClick={() => void bulkSet('late')} className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer">All Late</button>
                            <button onClick={() => void bulkSet('cutting')} className="h-8 px-3 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer">All Cutting</button>
                            <button onClick={() => void bulkClear()} className="h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer">Clear</button>
                        </div>
                    </div>

                    {summary.unmarked > 0 && roster.length > 0 && (
                        <div className="bg-emerald-50/90 dark:bg-emerald-500/15 border-b border-emerald-100 dark:border-emerald-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                <span>Notice: <strong>{summary.unmarked}</strong> student(s) in this section are currently unmarked.</span>
                            </span>
                            <button
                                onClick={() => void bulkSetUnmarkedToPresent()}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                                Mark All {summary.unmarked} Unmarked as Present ✓
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                    <th className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Student</th>
                                    {STATUSES.map((s) => (
                                        <th key={s.id} className="px-2 py-3 text-center">
                                            <span className={`block text-[11px] font-black uppercase tracking-wider ${s.summaryValue}`}>{s.label}</span>
                                            <span className="block text-[9px] font-bold text-slate-400">{s.short}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {roster.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                                            No students match the current filter.
                                        </td>
                                    </tr>
                                )}
                                {roster.map((student, index) => {
                                    const current = marks.get(student.lrn);
                                    const isLastScanned = lastScan?.ok && lastScan.lrn === student.lrn;
                                    const group = student.gender === 'Male' ? 'MALE' : student.gender === 'Female' ? 'FEMALE' : 'UNSPECIFIED';
                                    const prev = index > 0 ? roster[index - 1] : null;
                                    const prevGroup = prev ? (prev.gender === 'Male' ? 'MALE' : prev.gender === 'Female' ? 'FEMALE' : 'UNSPECIFIED') : null;
                                    const groupCount = roster.filter((s) =>
                                        (s.gender === 'Male' ? 'MALE' : s.gender === 'Female' ? 'FEMALE' : 'UNSPECIFIED') === group,
                                    ).length;
                                    const separator = group !== prevGroup ? (
                                        <tr key={`sep-${group}`} className={`border-y ${
                                            group === 'MALE'
                                                ? 'bg-sky-50/70 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20'
                                                : group === 'FEMALE'
                                                    ? 'bg-pink-50/70 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20'
                                                    : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'
                                        }`}>
                                            <td colSpan={6} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${
                                                group === 'MALE'
                                                    ? 'text-sky-600 dark:text-sky-400'
                                                    : group === 'FEMALE'
                                                        ? 'text-pink-600 dark:text-pink-400'
                                                        : 'text-slate-500 dark:text-slate-400'
                                            }`}>
                                                {group} · {groupCount}
                                            </td>
                                        </tr>
                                    ) : null;
                                    return (
                                        <Fragment key={student.lrn}>
                                        {separator}
                                        <tr
                                            className={`border-b border-slate-50 dark:border-white/3 transition-colors ${
                                                isLastScanned ? 'bg-emerald-50/70 dark:bg-emerald-500/10' : 'hover:bg-slate-50/50 dark:hover:bg-white/2'
                                            }`}
                                        >
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight">{composeName(student)}</p>
                                                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                                            {[student.grade_level, student.student_section].filter(Boolean).join(' — ') || 'No section assigned'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedStudentForQr(student)}
                                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shrink-0 cursor-pointer active:scale-95"
                                                        title={`View & Download QR Code for ${composeName(student)}`}
                                                    >
                                                        <QrCode className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            {STATUSES.map((s) => (
                                                <td key={s.id} className="px-2 py-2.5 text-center">
                                                    <button
                                                        onClick={() => toggleStatus(student, s.id)}
                                                        title={`${s.label}${current === s.id ? ' (click to clear)' : ''}`}
                                                        className={`w-10 h-9 rounded-lg border-2 text-xs font-black transition-all active:scale-95 cursor-pointer ${
                                                            current === s.id ? s.active : s.chip
                                                        }`}
                                                    >
                                                        {s.short}
                                                    </button>
                                                </td>
                                            ))}
                                        </tr>
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right rail: summary + trend */}
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#0d1225] shadow-xs p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                            <h3 className="text-base font-black text-slate-800 dark:text-white">Summary</h3>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>

                        {/* Hero: present rate ring + totals */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 shrink-0">
                                <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                                    <circle cx="40" cy="40" r="34" fill="none" strokeWidth="8" className="stroke-slate-100 dark:stroke-white/10" />
                                    <circle
                                        cx="40" cy="40" r="34" fill="none" strokeWidth="8" strokeLinecap="round"
                                        className="stroke-emerald-500 transition-all duration-500"
                                        strokeDasharray={`${(summary.rate / 100) * 213.6} 213.6`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{summary.rate}%</span>
                                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">present</span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{summary.total}</span>
                                    <span className="text-[11px] font-bold text-slate-400">students</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400">
                                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                                        {summary.male} Male
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400">
                                        <span className="w-2 h-2 rounded-full bg-pink-500" />
                                        {summary.female} Female
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                            style={{ width: `${summary.total > 0 ? (summary.marked / summary.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Marked {summary.marked}/{summary.total}
                                        {summary.unmarked > 0 ? (
                                            <span className="text-amber-500"> · {summary.unmarked} left</span>
                                        ) : summary.total > 0 ? (
                                            <span className="text-emerald-500"> · Complete ✓</span>
                                        ) : null}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status tiles: 2-column grid with M/F split bars */}
                        <div className="grid grid-cols-2 gap-2">
                            {STATUSES.map((s) => {
                                const c = summary.counts[s.id];
                                return (
                                    <div key={s.id} className={`rounded-xl border p-3 ${s.summaryCard}`}>
                                        <div className="flex items-baseline justify-between gap-1">
                                            <span className={`text-2xl font-black leading-none ${s.summaryValue}`}>{c.total}</span>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-wider mt-1 truncate opacity-90">{s.label}</p>
                                        <div className="mt-2 space-y-1">
                                            <div className="h-1 flex rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                                                {c.total > 0 && (
                                                    <>
                                                        <div className="h-full bg-sky-500" style={{ width: `${(c.male / c.total) * 100}%` }} />
                                                        <div className="h-full bg-pink-500" style={{ width: `${(c.female / c.total) * 100}%` }} />
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                                    {c.male} M
                                                </span>
                                                <span className="flex items-center gap-1 text-pink-700 dark:text-pink-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                                    {c.female} F
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className={`rounded-xl border p-3 flex flex-col ${
                                summary.unmarked > 0
                                    ? 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                                    : 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            }`}>
                                <span className="text-2xl font-black leading-none">{summary.unmarked}</span>
                                <p className="text-[10px] font-black uppercase tracking-wider mt-1 truncate opacity-90">Unmarked</p>
                                <p className="text-[11px] font-bold mt-auto pt-2">
                                    {summary.total === 0 ? '—' : summary.unmarked > 0 ? 'Still to mark' : 'All marked ✓'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 dark:border-emerald-500/20 bg-white dark:bg-[#0d1225] shadow-xs p-4">
                        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-emerald-50/90 via-emerald-50/30 to-transparent dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-transparent pointer-events-none" />
                        <div className="relative flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 pt-0.5">
                                <div className="flex items-start gap-2.5">
                                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <ClipboardCheck className="w-4 h-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-black leading-none text-slate-800 dark:text-white">Monthly Trend</h3>
                                        <p className="mt-1 text-[11px] font-semibold leading-tight text-slate-400 md:whitespace-nowrap">
                                            Daily attendance rate · {monthLabel}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 text-[10px] font-black uppercase tracking-wider">
                                <span className="rounded-full border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 px-2.5 py-1">
                                    {trendInsights.avg}% avg
                                </span>
                                <span className="rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300 px-2.5 py-1">
                                    {trendInsights.days} days
                                </span>
                            </div>
                        </div>

                        <div className="relative grid grid-cols-3 gap-2 mb-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-3 py-2 text-center">
                                <div className="text-emerald-600 dark:text-emerald-400 text-sm leading-none tracking-normal normal-case">{trendInsights.high}%</div>
                                <div className="mt-0.5 whitespace-nowrap leading-none text-[10px] md:text-[11px]">Peak Day {trendInsights.highDay}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-3 py-2 text-center">
                                <div className="text-slate-700 dark:text-slate-200 text-sm tracking-normal normal-case">{trendInsights.avg}%</div>
                                <div className="mt-0.5 leading-tight">Average</div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-3 py-2 text-center">
                                <div className="text-amber-600 dark:text-amber-400 text-sm tracking-normal normal-case">{trendInsights.low}%</div>
                                <div className="mt-0.5 leading-tight">Low Day {trendInsights.lowDay}</div>
                            </div>
                        </div>

                        {trendData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-xs font-semibold text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                                No attendance recorded this month yet.
                            </div>
                        ) : (
                            <div className="h-56 [--da-stroke:#10b981] [--da-fill:#10b981] dark:[--da-stroke:#059669] dark:[--da-fill:#059669] rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                                        <defs>
                                            <linearGradient id="daTrendFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--da-fill)" stopOpacity={0.25} />
                                                <stop offset="100%" stopColor="var(--da-fill)" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-slate-200 dark:text-white/10" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} stroke="#94a3b8" />
                                        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={(v: number) => `${v}%`} />
                                        <Tooltip
                                            formatter={(value) => [`${value ?? 0}% present`, 'Rate']}
                                            labelFormatter={(day) => `${monthLabel.split(' ')[0]} ${String(day)}`}
                                            cursor={{ stroke: 'var(--da-stroke)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            contentStyle={{ borderRadius: 16, fontSize: 12, fontWeight: 600, border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 18px 50px rgba(15,23,42,0.12)' }}
                                        />
                                        <ReferenceLine y={trendInsights.avg} stroke="currentColor" strokeDasharray="6 6" className="text-emerald-300 dark:text-emerald-700" />
                                        <Area type="monotone" dataKey="rate" stroke="var(--da-stroke)" strokeWidth={3} fill="url(#daTrendFill)" dot={{ r: 3, fill: 'var(--da-stroke)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Camera scan modal */}
            {cameraOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setCameraOpen(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                <Camera className="w-4 h-4 text-emerald-500" />
                                Scan Student ID QR Code
                            </h4>
                            <button onClick={() => setCameraOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                        <div className="relative aspect-video bg-black">
                            {/* Preview is mirrored like a selfie so hand movement matches the screen;
                                decoding uses the raw (unmirrored) stream, so scans are unaffected. */}
                            <video ref={videoRef} className="w-full h-full object-cover -scale-x-100" playsInline muted />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-44 h-44 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                            </div>
                            {cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                                    <p className="text-sm font-bold text-red-400 text-center">{cameraError}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 space-y-1">
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                Scanning marks students automatically as <span className="uppercase text-emerald-500">present</span> before {lateCutoffTime} and <span className="uppercase text-amber-500">late</span> at or after that time. Keep scanning — each new code is recorded automatically.
                            </p>
                            {lastScan && (
                                <p className={`text-xs font-bold ${lastScan.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                                    Last: {lastScan.text}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Single Student QR Modal */}
            {selectedStudentForQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedStudentForQr(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-emerald-500" />
                                Attendance QR Code
                            </h4>
                            <button onClick={() => setSelectedStudentForQr(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-150 dark:border-white/10 inline-block">
                                {studentQrDataUrl ? (
                                    <img src={studentQrDataUrl} alt="Student QR Code" className="w-48 h-48 mx-auto" />
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 font-semibold text-xs">Generating QR...</div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white leading-snug">{composeName(selectedStudentForQr)}</h3>
                                <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">LRN: {selectedStudentForQr.lrn}</p>
                                <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-1">
                                    {[selectedStudentForQr.grade_level, selectedStudentForQr.student_section].filter(Boolean).join(' — ') || 'Student Record'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    onClick={() => void downloadStudentQrCard(selectedStudentForQr)}
                                    className="h-10 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Card
                                </button>
                                <button
                                    onClick={() => void downloadPureQrCode(selectedStudentForQr)}
                                    className="h-10 px-3 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <FileDown className="w-4 h-4 text-sky-500" />
                                    Pure QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Section QR Codes Download Modal */}
            {showQrModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowQrModal(false)} />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-emerald-500" />
                                    Download Student Attendance QR Codes
                                </h4>
                                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                    {roster.length} learner(s) in {sectionFilter === 'all' ? 'All Sections' : sectionFilter}
                                </p>
                            </div>
                            <button onClick={() => setShowQrModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        {/* Action Bar */}
                        <div className="p-4 bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                Export QR code badges for daily attendance scanning.
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => void handlePrintQrSheet(roster)}
                                    disabled={roster.length === 0}
                                    className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print QR Sheet
                                </button>
                                <button
                                    onClick={() => void handleBatchDownloadAllQrCards(roster)}
                                    disabled={roster.length === 0}
                                    className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    Download All Cards
                                </button>
                            </div>
                        </div>

                        {/* Student Roster QR Download Table */}
                        <div className="p-4 overflow-y-auto flex-1 space-y-2">
                            {roster.length === 0 ? (
                                <div className="py-12 text-center text-sm font-semibold text-slate-400">
                                    No students found for the current selection.
                                </div>
                            ) : (
                                roster.map((s) => (
                                    <div key={s.lrn} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{composeName(s)}</p>
                                            <p className="text-xs font-semibold text-slate-400">LRN: {s.lrn} · {[s.grade_level, s.student_section].filter(Boolean).join(' — ')}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => void downloadStudentQrCard(s)}
                                                className="h-8 px-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Card
                                            </button>
                                            <button
                                                onClick={() => void downloadPureQrCode(s)}
                                                className="h-8 px-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                                            >
                                                <FileDown className="w-3.5 h-3.5 text-sky-500" />
                                                PNG
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Phone Gateway QR Modal */}
            <PhoneAttendanceModal
                isOpen={showPhoneGatewayModal}
                onClose={() => setShowPhoneGatewayModal(false)}
            />
        </div>
    );
}
