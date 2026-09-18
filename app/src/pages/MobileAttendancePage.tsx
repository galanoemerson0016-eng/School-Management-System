/**
 * Mobile Phone Attendance Portal
 * Apple iOS Human Interface Guidelines (HIG) UI/UX Design.
 * Features frosted glass navigation, iOS segmented controls, grouped inset cards, live camera QR scanner, and real-time PC sync.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import type { AttendanceRecord, Student } from '../types';
import { extractLrnFromScan } from '../utils/scan-utils';
import { formatLearnerName } from '../utils/student-name';
import { 
    broadcastAttendanceUpdate, 
    subscribeToAttendanceUpdates,
    getAttendancePairingToken,
    getAttendancePairingHeaders
} from '../services/mobile-attendance-sync';
import { 
    Camera, ScanLine, X, Search, CheckCircle2, AlertCircle, RefreshCw, 
    Smartphone, Check, Wifi, Sparkles, Calendar, BookOpen, Info,
    AlertTriangle, ChevronDown, Copy
} from 'lucide-react';
import jsQR from 'jsqr';

type DailyStatus = AttendanceRecord['status'];

const STATUSES: Array<{
    id: DailyStatus;
    label: string;
    short: string;
    activeClass: string;
    inactiveClass: string;
    badgeBg: string;
}> = [
    { 
        id: 'present', 
        label: 'Present', 
        short: 'P', 
        activeClass: 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30 border border-emerald-600 ring-2 ring-emerald-400/60 scale-[1.03]', 
        inactiveClass: 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 font-extrabold',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 font-semibold' 
    },
    { 
        id: 'absent', 
        label: 'Absent', 
        short: 'A', 
        activeClass: 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/30 border border-rose-600 ring-2 ring-rose-400/60 scale-[1.03]', 
        inactiveClass: 'bg-rose-50/90 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-extrabold',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/60 font-semibold' 
    },
    { 
        id: 'late', 
        label: 'Late', 
        short: 'L', 
        activeClass: 'bg-amber-600 text-white font-black shadow-md shadow-amber-600/30 border border-amber-600 ring-2 ring-amber-400/60 scale-[1.03]', 
        inactiveClass: 'bg-amber-50/90 hover:bg-amber-100 text-amber-700 border border-amber-200/80 font-extrabold',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/60 font-semibold' 
    },
    { 
        id: 'cutting', 
        label: 'Cutting Class', 
        short: 'CC', 
        activeClass: 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/30 border border-purple-600 ring-2 ring-purple-400/60 scale-[1.03]', 
        inactiveClass: 'bg-purple-50/90 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-extrabold',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/60 font-semibold' 
    },
    { 
        id: 'excused', 
        label: 'Excused', 
        short: 'EX', 
        activeClass: 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 border border-blue-600 ring-2 ring-blue-400/60 scale-[1.03]', 
        inactiveClass: 'bg-blue-50/90 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-extrabold',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/60 font-semibold' 
    },
];

function normalizeDateStr(dStr: string): string {
    if (!dStr) return '';
    let cleaned = dStr.trim();
    if (cleaned.includes('T')) {
        cleaned = cleaned.split('T')[0];
    }
    if (cleaned.includes('/')) {
        const parts = cleaned.split('/');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else if (parts[2].length === 4) {
                const p0 = Number(parts[0]);
                const p1 = Number(parts[1]);
                if (p0 > 12) {
                    return `${parts[2]}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
                } else {
                    return `${parts[2]}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
                }
            }
        }
    }
    return cleaned;
}

function todayIso(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatShortLrn(lrn: string): string {
    if (!lrn) return '';
    if (lrn.startsWith('TEMP-')) {
        const parts = lrn.split('-');
        return `TEMP #${parts[parts.length - 1] || parts[parts.length - 2] || 'ID'}`;
    }
    return `LRN ${lrn}`;
}

export function MobileAttendancePage() {
    const pairingToken = useMemo(() => getAttendancePairingToken(), []);
    const students = useAppStore((s) => s.students);
    const sections = useAppStore((s) => s.sections);
    const attendanceRecords = useAppStore((s) => s.attendanceRecords);
    const upsertAttendanceRecords = useAppStore((s) => s.upsertAttendanceRecords);
    const setStudents = useAppStore((s) => s.setStudents);
    const setSections = useAppStore((s) => s.setSections);
    const setSchoolProfile = useAppStore((s) => s.setSchoolProfile);
    const schoolProfile = useAppStore((s) => s.schoolProfile);
    const globalSelectedSection = useAppStore((s) => s.selectedSection);
    const setGlobalSelectedSection = useAppStore((s) => s.setSelectedSection);

    const [date, setDate] = useState(todayIso());
    const userHasCustomDateRef = useRef(false);
    const [selectedSectionId, setSelectedSectionId] = useState<string>(() => {
        const adv = sections.find(s => s.id === globalSelectedSection || s.section_name === globalSelectedSection)
            || sections.find(s => s.is_advisory);
        return adv ? adv.id : 'all';
    });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    const [localMarks, setLocalMarks] = useState<Map<string, AttendanceRecord>>(new Map());
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [lastScanResult, setLastScanResult] = useState<{ ok: boolean; message: string; timestamp: string } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [copiedFlag, setCopiedFlag] = useState(false);
    const [copiedIp, setCopiedIp] = useState(false);
    const [showSetupGuide, setShowSetupGuide] = useState(false);
    const [pairingError, setPairingError] = useState(pairingToken ? '' : 'This mobile attendance link is missing its secure pairing. Scan a new QR code from the FormEase desktop app.');

    useEffect(() => {
        const globalMatch = sections.find(s => s.id === globalSelectedSection || s.section_name === globalSelectedSection);
        const selectedExists = sections.some(s => s.id === selectedSectionId);
        const nextId = globalMatch?.id || (selectedExists ? selectedSectionId : sections.find(s => s.is_advisory)?.id);
        if (nextId && nextId !== selectedSectionId) setSelectedSectionId(nextId);
    }, [sections, globalSelectedSection, selectedSectionId]);

    const handleCopyFlag = useCallback(() => {
        const flagUrl = 'chrome://flags/#unsafely-treat-insecure-origin-as-secure';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            void navigator.clipboard.writeText(flagUrl);
        } else {
            const el = document.createElement('textarea');
            el.value = flagUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopiedFlag(true);
        setTimeout(() => setCopiedFlag(false), 2000);
    }, []);

    const handleCopyIp = useCallback(() => {
        const hostUrl = `http://${window.location.host}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            void navigator.clipboard.writeText(hostUrl);
        } else {
            const el = document.createElement('textarea');
            el.value = hostUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopiedIp(true);
        setTimeout(() => setCopiedIp(false), 2000);
    }, []);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const syncDesktopSession = useCallback(async (manual = false) => {
        if (!pairingToken) return;
        if (manual) setIsSyncing(true);
        try {
            const host = window.location.hostname || 'localhost';
            const port = window.location.port || '3003';
            const endpoints = Array.from(new Set([
                `/api/attendance/session`,
                `http://${host}:${port}/api/attendance/session`,
                `http://${host}:3003/api/attendance/session`,
                `http://${host}:3001/api/attendance/session`
            ]));

            for (const apiUrl of endpoints) {
                try {
                    const res = await fetch(apiUrl, { headers: getAttendancePairingHeaders() });
                    if (res.ok) {
                        setPairingError('');
                        const data = await res.json();
                        let updated = false;
                        if (data.date && (!userHasCustomDateRef.current || manual)) {
                            setDate(data.date);
                        }
                        if (data.students && Array.isArray(data.students) && data.students.length > 0) {
                            setStudents(data.students);
                            updated = true;
                        }
                        if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
                            setSections(data.sections);
                            updated = true;
                        }
                        if (data.records && Array.isArray(data.records) && data.records.length > 0) {
                            void upsertAttendanceRecords(data.records);
                            // Prune local marks only if reflected in incoming desktop records
                            setLocalMarks(prev => {
                                const next = new Map(prev);
                                for (const rec of data.records) {
                                    const local = next.get(rec.student_lrn);
                                    if (local && local.status === rec.status && local.date === rec.date) {
                                        next.delete(rec.student_lrn);
                                    }
                                }
                                return next;
                            });
                            updated = true;
                        }
                        if (data.schoolProfile) {
                            setSchoolProfile(data.schoolProfile);
                        }
                        if (updated) {
                            break;
                        }
                    } else if (res.status === 401) {
                        setPairingError('This secure pairing has expired or was closed. Scan a new QR code from the FormEase desktop app.');
                    }
                } catch {
                    // Try next endpoint
                }
            }
        } catch (e) {
            console.warn('Failed to sync session from desktop server:', e);
        } finally {
            if (manual) {
                setTimeout(() => setIsSyncing(false), 500);
            }
        }
    }, [pairingToken, setStudents, setSections, upsertAttendanceRecords, setSchoolProfile]);

    useEffect(() => {
        void syncDesktopSession(false);
        const timer = setInterval(() => {
            void syncDesktopSession(false);
        }, 3000);
        return () => clearInterval(timer);
    }, [syncDesktopSession]);

    const playBeep = useCallback((success = true) => {
        try {
            if (!audioCtxRef.current) {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                audioCtxRef.current = new AudioCtx();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = success ? 'sine' : 'sawtooth';
            osc.frequency.setValueAtTime(success ? 880 : 300, ctx.currentTime);
            if (success) {
                osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
            }
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch {
            // Ignore audio context errors
        }
    }, []);

    const triggerHaptic = useCallback(() => {
        try {
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(100);
            }
        } catch {
            // Ignore haptic errors
        }
    }, []);

    useEffect(() => {
        if (!pairingToken) return;
        const unsubscribe = subscribeToAttendanceUpdates((event) => {
            if (event.record) {
                void upsertAttendanceRecords([event.record]);
            }
        });
        return () => unsubscribe();
    }, [pairingToken, upsertAttendanceRecords]);

    const activeSection = useMemo(() => {
        return sections.find(s => s.id === selectedSectionId || s.section_name === selectedSectionId);
    }, [sections, selectedSectionId]);

    const roster = useMemo(() => {
        return students.filter(s => {
            if (selectedSectionId === 'all') return true;
            if (activeSection) {
                return s.student_section === activeSection.section_name || s.student_section === activeSection.id;
            }
            return s.student_section === selectedSectionId;
        });
    }, [students, selectedSectionId, activeSection]);

    const dayRecordsMap = useMemo(() => {
        const map = new Map<string, AttendanceRecord>();
        const targetDate = normalizeDateStr(date);

        // 1. Fill from global store
        for (const r of attendanceRecords) {
            if (!r || !r.student_lrn || !r.date) continue;
            const recDate = normalizeDateStr(r.date);
            if (recDate === targetDate) {
                map.set(r.student_lrn, r);
            }
        }

        // 2. Overlay local user taps & real-time updates
        for (const [lrn, rec] of localMarks.entries()) {
            if (!rec || !rec.date) continue;
            const recDate = normalizeDateStr(rec.date);
            if (recDate === targetDate) {
                map.set(lrn, rec);
            }
        }

        return map;
    }, [attendanceRecords, date, localMarks]);

    const filteredRoster = useMemo(() => {
        const q = search.toLowerCase().trim();
        const list = roster.filter(s => {
            const matchesSearch = !q || 
                s.last_name.toLowerCase().includes(q) || 
                s.first_name.toLowerCase().includes(q) || 
                s.lrn.includes(q);
            if (!matchesSearch) return false;
            const rec = dayRecordsMap.get(s.lrn);
            const currentStatus = rec ? rec.status : 'unmarked';
            if (statusFilter === 'all') return true;
            if (statusFilter === 'unmarked') return !rec;
            return currentStatus === statusFilter;
        });

        // DepEd Official Roster Sorting: Male A-Z, then Female A-Z
        return list.sort((a, b) => {
            const isAMale = (a.gender || '').toLowerCase().startsWith('m') || (a.gender || '').toLowerCase() === 'boy';
            const isBMale = (b.gender || '').toLowerCase().startsWith('m') || (b.gender || '').toLowerCase() === 'boy';

            if (isAMale && !isBMale) return -1;
            if (!isAMale && isBMale) return 1;

            const nameA = `${a.last_name || ''} ${a.first_name || ''}`.toLowerCase();
            const nameB = `${b.last_name || ''} ${b.first_name || ''}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [roster, search, dayRecordsMap, statusFilter]);

    const groupedRoster = useMemo(() => {
        const males = filteredRoster.filter(s => 
            (s.gender || '').toLowerCase().startsWith('m') || (s.gender || '').toLowerCase() === 'boy'
        );
        const females = filteredRoster.filter(s => 
            !((s.gender || '').toLowerCase().startsWith('m') || (s.gender || '').toLowerCase() === 'boy')
        );
        return { males, females };
    }, [filteredRoster]);

    const summaryStats = useMemo(() => {
        let present = 0, absent = 0, late = 0, cutting = 0, excused = 0, unmarked = 0;
        for (const s of roster) {
            const rec = dayRecordsMap.get(s.lrn);
            if (!rec) {
                unmarked++;
                continue;
            }
            switch (rec.status) {
                case 'present': present++; break;
                case 'absent': absent++; break;
                case 'late': late++; break;
                case 'cutting': cutting++; break;
                case 'excused': excused++; break;
            }
        }
        return { total: roster.length, present, absent, late, cutting, excused, unmarked };
    }, [roster, dayRecordsMap]);

    const handleSetStatus = useCallback(async (student: Student, targetStatus: DailyStatus) => {
        triggerHaptic();
        playBeep(true);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const time24 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const existing = dayRecordsMap.get(student.lrn);
        const record: AttendanceRecord = {
            id: existing?.id || `${student.lrn}_${date}`,
            student_lrn: student.lrn,
            section_id: activeSection?.id || student.student_section || '',
            date: date,
            status: targetStatus,
            time_in: targetStatus === 'present' || targetStatus === 'late' ? time24 : existing?.time_in,
            time_out: existing?.time_out,
        };

        // 1. Instantly update local state — phone UI turns green/red/amber immediately
        setLocalMarks(prev => {
            const next = new Map(prev);
            next.set(student.lrn, record);
            return next;
        });

        // 2. Save to store/database (non-blocking for UI)
        try {
            await upsertAttendanceRecords([record]);
        } catch (e) {
            console.warn('[MobileAttendance] Store save error (UI still updated):', e);
        }

        // 3. Always broadcast to desktop PC regardless of store success
        const studentFullName = formatLearnerName(student, { middleInitialOnly: true });
        broadcastAttendanceUpdate(record, studentFullName, undefined, 'Smartphone');

        setLastScanResult({
            ok: true,
            message: `Marked ${student.first_name} as ${targetStatus.toUpperCase()}`,
            timestamp: timeStr,
        });
    }, [triggerHaptic, playBeep, dayRecordsMap, date, activeSection, upsertAttendanceRecords]);

    const processScannedCode = useCallback(async (scannedText: string) => {
        const extractedLrn = extractLrnFromScan(scannedText);
        const student = students.find(s => s.lrn === extractedLrn || s.lrn === scannedText.trim());
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        if (!student) {
            triggerHaptic();
            playBeep(false);
            setLastScanResult({ ok: false, message: `Unrecognized QR: ${scannedText.slice(0, 10)}`, timestamp: timeStr });
            return;
        }
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const isLate = currentMinutes > (8 * 60);
        await handleSetStatus(student, isLate ? 'late' : 'present');
    }, [students, triggerHaptic, playBeep, handleSetStatus]);

    const handleImageQrUpload = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
                    if (code && code.data) {
                        void processScannedCode(code.data);
                    } else {
                        triggerHaptic();
                        playBeep(false);
                        setLastScanResult({
                            ok: false,
                            message: 'No readable QR code found in photo. Please re-align and snap again.',
                            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                        });
                    }
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }, [processScannedCode, triggerHaptic, playBeep]);

    const processScannedCodeRef = useRef(processScannedCode);
    useEffect(() => {
        processScannedCodeRef.current = processScannedCode;
    }, [processScannedCode]);

    useEffect(() => {
        if (!cameraOpen) return;
        let cancelled = false;
        const currentVideo = videoRef.current;

        async function startCamera() {
            setCameraError('');
            try {
                let stream: MediaStream | null = null;

                const attempts = [
                    { video: { facingMode: { exact: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
                    { video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } },
                    { video: { facingMode: 'environment' } },
                    { video: { facingMode: 'user' } },
                    { video: true }
                ];

                if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
                    for (const constraint of attempts) {
                        try {
                            stream = await navigator.mediaDevices.getUserMedia(constraint);
                            if (stream) break;
                        } catch {
                            // Try next constraint
                        }
                    }
                }

                if (!stream) {
                    // Legacy vendor getUserMedia fallback (for older mobile browsers)
                    const legacyNav = (navigator as unknown as {
                        getUserMedia?: (c: unknown, s: (stream: MediaStream) => void, e: (err: unknown) => void) => void;
                        webkitGetUserMedia?: (c: unknown, s: (stream: MediaStream) => void, e: (err: unknown) => void) => void;
                        mozGetUserMedia?: (c: unknown, s: (stream: MediaStream) => void, e: (err: unknown) => void) => void;
                    });
                    const getUserMediaFn = legacyNav.getUserMedia || legacyNav.webkitGetUserMedia || legacyNav.mozGetUserMedia;
                    if (getUserMediaFn) {
                        stream = await new Promise<MediaStream>((resolve, reject) => {
                            getUserMediaFn.call(navigator, { video: true }, resolve, reject);
                        });
                    }
                }

                if (cancelled || !stream) { stream?.getTracks().forEach(t => t.stop()); return; }
                if (videoRef.current) { 
                    const v = videoRef.current;
                    v.setAttribute('playsinline', 'true');
                    v.setAttribute('autoplay', 'true');
                    v.setAttribute('muted', 'true');
                    v.srcObject = stream; 
                    try {
                        await v.play(); 
                    } catch (pErr) {
                        console.warn('Video play error:', pErr);
                    }
                    requestAnimationFrame(scanFrame); 
                }
            } catch (err: unknown) {
                const errorName = (err as { name?: string })?.name || '';
                const msg = errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError'
                    ? 'Camera permission denied. Tap "Snap QR Photo" below or check site settings.'
                    : 'Live camera video stream unavailable. Tap "Snap QR Photo" below.';
                setCameraError(msg);
            }
        }

        let lastScannedCode = '';
        let lastScanTime = 0;
        function scanFrame() {
            if (cancelled || !videoRef.current || !canvasRef.current) return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
                if (code && code.data) {
                    const now = Date.now();
                    if (code.data !== lastScannedCode || now - lastScanTime > 2500) {
                        lastScannedCode = code.data;
                        lastScanTime = now;
                        void processScannedCodeRef.current(code.data);
                    }
                }
            }
            animFrameRef.current = requestAnimationFrame(scanFrame);
        }
        void startCamera();
        return () => {
            cancelled = true;
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (currentVideo && currentVideo.srcObject) {
                (currentVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        };
    }, [cameraOpen, facingMode]);

    if (pairingError) {
        return (
            <main className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-6 text-slate-900">
                <section role="alert" className="w-full max-w-md rounded-3xl bg-white border border-rose-200 shadow-xl p-7 text-center space-y-4">
                    <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" aria-hidden="true" />
                    <h1 className="text-xl font-black">Secure pairing required</h1>
                    <p className="text-sm text-slate-600 leading-relaxed">{pairingError}</p>
                    <button onClick={() => void syncDesktopSession(true)} disabled={!pairingToken || isSyncing} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-50">
                        {isSyncing ? 'Checking…' : 'Try again'}
                    </button>
                </section>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-[#f2f2f7] text-slate-900 font-sans pb-28 select-none antialiased">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-linear-to-b from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Smartphone className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-semibold text-slate-900 tracking-tight leading-none truncate">
                                Attendance
                            </h1>
                            <p className="text-[11px] text-slate-500 font-normal truncate max-w-44 mt-0.5">
                                {schoolProfile?.name || 'FormEase Pro'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={() => void syncDesktopSession(true)}
                            disabled={isSyncing}
                            className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border border-slate-200/50 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                            title="Sync roster from desktop PC"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                        </button>

                        <button
                            onClick={() => setCameraOpen(!cameraOpen)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${
                                cameraOpen 
                                    ? 'bg-rose-500 text-white' 
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                        >
                            {cameraOpen ? (
                                <>
                                    <X className="w-3.5 h-3.5 shrink-0" />
                                    <span className="whitespace-nowrap">Close</span>
                                </>
                            ) : (
                                <>
                                    <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className="whitespace-nowrap">Scan QR</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-100">
                    <div className="bg-slate-100/70 hover:bg-slate-100 rounded-xl px-3 py-1.5 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-1.5 min-w-0 w-full">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setDate(e.target.value);
                                        userHasCustomDateRef.current = true;
                                    }
                                }}
                                className="bg-transparent border-none text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer w-full"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-100/70 hover:bg-slate-100 rounded-xl px-3 py-1.5 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-1.5 min-w-0 w-full">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <select
                                value={selectedSectionId}
                                onChange={(e) => {
                                    setSelectedSectionId(e.target.value);
                                    if (e.target.value !== 'all') setGlobalSelectedSection(e.target.value);
                                }}
                                className="bg-transparent border-none text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer w-full truncate"
                            >
                                <option value="all">All Students ({students.length})</option>
                                {sections.map(sec => (
                                    <option key={sec.id} value={sec.id}>
                                        {sec.section_name} {sec.is_advisory ? '(Advisory)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {cameraOpen && (
                <div className="bg-slate-900 border-b border-indigo-500/30 p-4 space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-top duration-300 text-white">
                    <div className="relative aspect-video max-h-60 w-full rounded-2xl bg-black overflow-hidden border border-white/10 shadow-inner flex items-center justify-center">
                        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />

                        <div className="absolute inset-0 border border-indigo-400/30 pointer-events-none flex items-center justify-center">
                            <div className="w-44 h-44 border-2 border-indigo-400 rounded-2xl animate-pulse flex items-center justify-center relative">
                                <ScanLine className="w-full h-1 text-indigo-400 animate-bounce opacity-80" />
                            </div>
                        </div>

                        <button
                            onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/80 active:scale-95 cursor-pointer"
                            title="Flip camera"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Camera Error Alert if live stream fails */}
                    {cameraError && (
                        <div className="bg-rose-500/20 border border-rose-500/40 p-2.5 rounded-xl flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <p className="text-xs text-rose-200 font-medium">{cameraError}</p>
                        </div>
                    )}

                    {/* ALWAYS VISIBLE 1-MINUTE CHROME SETUP GUIDE ACCORDION */}
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setShowSetupGuide(v => !v)}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition-all flex items-center justify-between cursor-pointer border border-amber-500/40"
                        >
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>{showSetupGuide ? 'Hide 1-Minute Chrome Setup' : 'How to Enable Live Video Stream (1-Minute Setup)'}</span>
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSetupGuide ? 'rotate-180' : ''}`} />
                        </button>

                        {showSetupGuide && (
                            <div className="p-3 bg-black/60 rounded-xl border border-white/10 space-y-3 text-xs text-slate-200 text-left">
                                <div className="space-y-1">
                                    <div className="font-bold text-amber-300 flex items-center justify-between">
                                        <span>Step 1: Copy Chrome Flag Link</span>
                                        <button
                                            type="button"
                                            onClick={handleCopyFlag}
                                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                                        >
                                            {copiedFlag ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copiedFlag ? 'Copied Flag URL' : 'Copy Flag URL'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-300">
                                        Paste into Chrome search bar:
                                    </p>
                                    <div className="p-2 rounded-lg bg-white/10 font-mono text-[11px] text-amber-200 break-all select-all font-semibold">
                                        chrome://flags/#unsafely-treat-insecure-origin-as-secure
                                    </div>
                                </div>

                                <div className="space-y-1 pt-1 border-t border-white/10">
                                    <div className="font-bold text-emerald-300 flex items-center justify-between">
                                        <span>Step 2: Enable & Paste Laptop Address</span>
                                        <button
                                            type="button"
                                            onClick={handleCopyIp}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                                        >
                                            {copiedIp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copiedIp ? 'Copied Laptop IP' : 'Copy Laptop IP'}
                                        </button>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/10 font-mono text-[11px] text-emerald-200 break-all select-all font-semibold">
                                        {`http://${window.location.host}`}
                                    </div>
                                    <p className="text-[10px] text-slate-300 leading-normal pt-0.5">
                                        Change setting to <b>Enabled</b>, paste the address above in the text box below it, then tap <b>Relaunch</b> at the bottom.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Camera Photo QR Scanner Fallback (Native Camera / Gallery) */}
                    <div className="pt-1 flex items-center justify-center gap-2">
                        <label className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer">
                            <Camera className="w-4 h-4 text-emerald-300" />
                            <span>Snap QR Photo (Native Camera)</span>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageQrUpload(file);
                                    e.target.value = '';
                                }}
                            />
                        </label>
                    </div>
                </div>
            )}

            {lastScanResult && (
                <div className={`mx-4 mt-3 p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs transition-all ${
                    lastScanResult.ok 
                        ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200/80 text-rose-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {lastScanResult.ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{lastScanResult.message}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-70">{lastScanResult.timestamp}</span>
                </div>
            )}

            <main className="p-4 space-y-3">
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search student or LRN..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-200/60 text-slate-900 text-xs font-normal placeholder:text-slate-400 focus:bg-slate-200/90 transition-all border-none focus:outline-none"
                        />
                    </div>

                    <div className="p-1.5 bg-slate-200/60 rounded-2xl space-y-1 text-xs">
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`py-1.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-center font-semibold ${
                                    statusFilter === 'all'
                                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900 font-medium'
                                }`}
                            >
                                All ({roster.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter('unmarked')}
                                className={`py-1.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-center font-semibold ${
                                    statusFilter === 'unmarked'
                                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900 font-medium'
                                }`}
                            >
                                Unmarked ({summaryStats.unmarked})
                            </button>
                        </div>

                        <div className="grid grid-cols-5 gap-1">
                            {STATUSES.map(st => {
                                const count = st.id === 'present' ? summaryStats.present :
                                              st.id === 'absent' ? summaryStats.absent :
                                              st.id === 'late' ? summaryStats.late :
                                              st.id === 'cutting' ? summaryStats.cutting : summaryStats.excused;
                                const isSelected = statusFilter === st.id;
                                return (
                                    <button
                                        key={st.id}
                                        onClick={() => setStatusFilter(st.id)}
                                        className={`py-1.5 rounded-xl text-[11px] transition-all cursor-pointer text-center font-semibold truncate ${
                                            isSelected
                                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                                : 'text-slate-600 hover:text-slate-900 font-medium'
                                        }`}
                                    >
                                        {st.short} {count > 0 ? `(${count})` : ''}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Attendance Legend & Quick Reference */}
                    <div className="bg-white rounded-2xl p-2.5 border border-slate-200/70 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                            <span className="flex items-center gap-1.5 text-slate-600">
                                <Info className="w-3.5 h-3.5 text-indigo-500" />
                                Attendance Legend
                            </span>
                            <span className="text-[9px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                Status Guide
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 text-center">
                            <div className="py-1 px-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex flex-col items-center justify-center">
                                <span className="font-black text-xs text-emerald-700">P</span>
                                <span className="text-[9px] font-bold text-emerald-600 truncate w-full">Present</span>
                            </div>
                            <div className="py-1 px-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/80 flex flex-col items-center justify-center">
                                <span className="font-black text-xs text-rose-700">A</span>
                                <span className="text-[9px] font-bold text-rose-600 truncate w-full">Absent</span>
                            </div>
                            <div className="py-1 px-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 flex flex-col items-center justify-center">
                                <span className="font-black text-xs text-amber-700">L</span>
                                <span className="text-[9px] font-bold text-amber-600 truncate w-full">Late</span>
                            </div>
                            <div className="py-1 px-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200/80 flex flex-col items-center justify-center">
                                <span className="font-black text-xs text-purple-700">CC</span>
                                <span className="text-[9px] font-bold text-purple-600 truncate w-full">Cutting</span>
                            </div>
                            <div className="py-1 px-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/80 flex flex-col items-center justify-center">
                                <span className="font-black text-xs text-blue-700">EX</span>
                                <span className="text-[9px] font-bold text-blue-600 truncate w-full">Excused</span>
                            </div>
                        </div>
                    </div>
                </div>

                {roster.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center space-y-4 shadow-2xs border border-slate-200/60 mt-4">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-b from-indigo-50 to-indigo-100 text-indigo-600 border border-indigo-200/50 mx-auto flex items-center justify-center shadow-2xs">
                            <Wifi className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                                No Students Loaded Yet
                            </h3>
                            <p className="text-xs text-slate-500 font-normal max-w-xs mx-auto">
                                FormEase Pro is ready to sync class rosters from your desktop PC.
                            </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-left space-y-1 text-[11px] text-slate-600">
                            <div className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                Instructions:
                            </div>
                            <p>1. Open FormEase Pro on your laptop (connected to Wi-Fi).</p>
                            <p>2. Open **Daily Attendance** on PC to send class roster.</p>
                        </div>

                        <button
                            onClick={() => void syncDesktopSession(true)}
                            disabled={isSyncing}
                            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Fetch Roster from PC'}
                        </button>
                    </div>
                ) : filteredRoster.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200/60 shadow-2xs">
                        No students found matching search filters.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Male Group */}
                        {groupedRoster.males.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5 text-indigo-700">
                                        👦 MALE LEARNERS ({groupedRoster.males.length})
                                    </span>
                                </div>
                                {groupedRoster.males.map(student => {
                                    const rec = dayRecordsMap.get(student.lrn);
                                    const currentStatus = rec ? rec.status : null;

                                    return (
                                        <div
                                            key={student.lrn}
                                            className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-2xl bg-linear-to-b from-indigo-50 to-indigo-100/80 text-indigo-600 border border-indigo-200/50 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                        {student.last_name[0]}{student.first_name[0]}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight leading-tight truncate whitespace-nowrap" title={`${student.last_name}, ${student.first_name} ${student.middle_name || ''}`}>
                                                            {student.last_name}, {student.first_name} {student.middle_name ? student.middle_name[0] + '.' : ''}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal mt-0.5">
                                                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono text-[10px] border border-slate-200/40">
                                                                {formatShortLrn(student.lrn)}
                                                            </span>
                                                            <span>•</span>
                                                            <span>Boy</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {currentStatus ? (
                                                    <div className={`px-2.5 py-1 rounded-full text-[10px] border shrink-0 flex items-center gap-1 ${
                                                        STATUSES.find(s => s.id === currentStatus)?.badgeBg || ''
                                                    }`}>
                                                        <Check className="w-3 h-3" />
                                                        {currentStatus.toUpperCase()}
                                                        {rec?.time_in && (
                                                            <span className="font-mono text-[9px] opacity-75">
                                                                ({rec.time_in})
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200/60 shrink-0">
                                                        Unmarked
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
                                                {STATUSES.map(st => {
                                                    const isActive = currentStatus === st.id;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={st.id}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                void handleSetStatus(student, st.id);
                                                            }}
                                                            className={`py-2 rounded-xl text-xs transition-all active:scale-95 touch-manipulation cursor-pointer flex items-center justify-center select-none ${
                                                                isActive ? st.activeClass : st.inactiveClass
                                                            }`}
                                                            title={`Mark ${st.label}`}
                                                        >
                                                            <span>{st.short}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Female Group */}
                        {groupedRoster.females.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-2">
                                    <span className="flex items-center gap-1.5 text-rose-700">
                                        👧 FEMALE LEARNERS ({groupedRoster.females.length})
                                    </span>
                                </div>
                                {groupedRoster.females.map(student => {
                                    const rec = dayRecordsMap.get(student.lrn);
                                    const currentStatus = rec ? rec.status : null;

                                    return (
                                        <div
                                            key={student.lrn}
                                            className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-2xl bg-linear-to-b from-rose-50 to-rose-100/80 text-rose-600 border border-rose-200/50 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                        {student.last_name[0]}{student.first_name[0]}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight leading-tight truncate whitespace-nowrap" title={`${student.last_name}, ${student.first_name} ${student.middle_name || ''}`}>
                                                            {student.last_name}, {student.first_name} {student.middle_name ? student.middle_name[0] + '.' : ''}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal mt-0.5">
                                                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono text-[10px] border border-slate-200/40">
                                                                {formatShortLrn(student.lrn)}
                                                            </span>
                                                            <span>•</span>
                                                            <span>Girl</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {currentStatus ? (
                                                    <div className={`px-2.5 py-1 rounded-full text-[10px] border shrink-0 flex items-center gap-1 ${
                                                        STATUSES.find(s => s.id === currentStatus)?.badgeBg || ''
                                                    }`}>
                                                        <Check className="w-3 h-3" />
                                                        {currentStatus.toUpperCase()}
                                                        {rec?.time_in && (
                                                            <span className="font-mono text-[9px] opacity-75">
                                                                ({rec.time_in})
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200/60 shrink-0">
                                                        Unmarked
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
                                                {STATUSES.map(st => {
                                                    const isActive = currentStatus === st.id;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={st.id}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                void handleSetStatus(student, st.id);
                                                            }}
                                                            className={`py-2 rounded-xl text-xs transition-all active:scale-95 touch-manipulation cursor-pointer flex items-center justify-center select-none ${
                                                                isActive ? st.activeClass : st.inactiveClass
                                                            }`}
                                                            title={`Mark ${st.label}`}
                                                        >
                                                            <span>{st.short}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 px-4 py-2.5 shadow-lg shadow-slate-900/5">
                <div className="grid grid-cols-5 gap-1.5 max-w-lg mx-auto text-center">
                    <div className="p-1.5 rounded-xl bg-slate-100/70">
                        <div className="text-[9px] font-medium text-slate-400 uppercase">Total</div>
                        <div className="text-xs font-semibold text-slate-900">{summaryStats.total}</div>
                    </div>
                    <div className="p-1.5 rounded-xl bg-emerald-50/80 text-emerald-800">
                        <div className="text-[9px] font-medium text-emerald-600 uppercase">Present</div>
                        <div className="text-xs font-bold text-emerald-700">{summaryStats.present}</div>
                    </div>
                    <div className="p-1.5 rounded-xl bg-rose-50/80 text-rose-800">
                        <div className="text-[9px] font-medium text-rose-600 uppercase">Absent</div>
                        <div className="text-xs font-bold text-rose-700">{summaryStats.absent}</div>
                    </div>
                    <div className="p-1.5 rounded-xl bg-amber-50/80 text-amber-800">
                        <div className="text-[9px] font-medium text-amber-600 uppercase">Late</div>
                        <div className="text-xs font-bold text-amber-700">{summaryStats.late}</div>
                    </div>
                    <div className="p-1.5 rounded-xl bg-blue-50/80 text-blue-800">
                        <div className="text-[9px] font-medium text-blue-600 uppercase">Excused</div>
                        <div className="text-xs font-bold text-blue-700">{summaryStats.excused}</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
