/**
 * Mobile Attendance Real-Time Sync Service
 * Enables real-time two-way synchronization between Mobile Phone Attendance and FormEase Pro Desktop.
 * 
 * Supports:
 * - Electron IPC (zero-latency direct sync via main process — EXE only)
 * - BroadcastChannel API (sub-millisecond instant sync across local windows/tabs)
 * - LocalStorage sync fallback
 * - Local Wi-Fi HTTP Server REST API push & pull sync
 */
import type { AttendanceRecord, Student, Section } from '../types';

export interface MobileAttendanceSyncEvent {
    type: 'ATTENDANCE_UPDATE' | 'SESSION_RESET';
    record: AttendanceRecord;
    studentName?: string;
    timestamp: number;
    sourceDevice?: string;
}

export interface MobileAttendanceSessionData {
    date: string;
    sectionId: string;
    students: Student[];
    sections: Section[];
    records: AttendanceRecord[];
    schoolName?: string;
}

const CHANNEL_NAME = 'formease_mobile_attendance_sync';
const STORAGE_SYNC_KEY = 'formease_mobile_sync_event';
const SESSION_CACHE_KEY = 'formease_mobile_session_cache';

let activePairingToken = '';
let activePairingExpiresAt = 0;
let activePairingTransport: 'http' | 'ipc' | null = null;

function usesHttpGateway(): boolean {
    return typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol);
}

function tokenFromCurrentUrl(): string {
    if (typeof window === 'undefined') return '';
    const hashQuery = window.location.hash.includes('?')
        ? window.location.hash.slice(window.location.hash.indexOf('?') + 1)
        : '';
    return new URLSearchParams(hashQuery).get('pair')
        || new URLSearchParams(window.location.search).get('pair')
        || '';
}

export function getAttendancePairingToken(): string {
    return activePairingToken || tokenFromCurrentUrl();
}

export function getAttendancePairingHeaders(): Record<string, string> {
    const token = getAttendancePairingToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function startAttendancePairing(): Promise<{ token: string; expiresAt: number }> {
    if (activePairingToken && activePairingExpiresAt > Date.now()) {
        return { token: activePairingToken, expiresAt: activePairingExpiresAt };
    }
    let pairing: { token?: string; expiresAt?: number; error?: string };
    if (!usesHttpGateway() && window.electronAPI?.startAttendancePairing) {
        pairing = await window.electronAPI.startAttendancePairing();
        activePairingTransport = 'ipc';
    } else {
        const response = await fetch('/api/attendance/pairing', { method: 'POST' });
        if (!response.ok) throw new Error('Unable to start mobile attendance pairing');
        pairing = await response.json();
        activePairingTransport = 'http';
    }
    if (!pairing.token || !pairing.expiresAt) {
        throw new Error(pairing.error || 'Mobile attendance pairing did not return a valid token');
    }
    activePairingToken = pairing.token;
    activePairingExpiresAt = pairing.expiresAt;
    return { token: pairing.token, expiresAt: pairing.expiresAt };
}

export async function revokeAttendancePairing(token = activePairingToken): Promise<void> {
    if (!token) return;
    try {
        if (activePairingTransport === 'ipc' && window.electronAPI?.revokeAttendancePairing) {
            await window.electronAPI.revokeAttendancePairing(token);
        } else {
            await fetch('/api/attendance/pairing', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
        }
    } finally {
        if (token === activePairingToken) {
            activePairingToken = '';
            activePairingExpiresAt = 0;
            activePairingTransport = null;
        }
    }
}

export function getAttendancePairingExpiry(): number {
    return activePairingExpiresAt;
}

let channel: BroadcastChannel | null = null;
try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(CHANNEL_NAME);
    }
} catch (e) {
    console.warn('BroadcastChannel not supported in this context:', e);
}

/**
 * Broadcast an attendance update event to all listening clients (Desktop & Mobile)
 */
export function broadcastAttendanceUpdate(
    record: AttendanceRecord, 
    studentName?: string, 
    serverHost?: string,
    sourceDevice?: 'Smartphone' | 'Desktop PC'
): void {
    const event: MobileAttendanceSyncEvent = {
        type: 'ATTENDANCE_UPDATE',
        record,
        studentName,
        timestamp: Date.now(),
        sourceDevice: sourceDevice || (window.navigator?.userAgent?.includes('Mobile') ? 'Smartphone' : 'Desktop PC'),
    };

    // 0. Electron IPC — direct main-process bridge (zero-CORS, instant, EXE only)
    if (!usesHttpGateway() && window.electronAPI && window.electronAPI.pushAttendanceUpdate) {
        window.electronAPI.pushAttendanceUpdate(event).catch(() => {});
        return;
    }

    // 1. BroadcastChannel
    try {
        if (channel) {
            channel.postMessage(event);
        }
    } catch (err) {
        console.error('BroadcastChannel postMessage failed:', err);
    }

    // 2. LocalStorage event trigger
    try {
        localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(event));
    } catch (err) {
        console.error('LocalStorage sync write failed:', err);
    }

    // 3. Push to Local Express REST API server (single resolved endpoint)
    const targetHost = serverHost || (typeof window !== 'undefined' ? window.location.hostname : '') || 'localhost';
    const port = (typeof window !== 'undefined' ? window.location.port : '') || '3001';
    const endpoint = (typeof window !== 'undefined' && window.location.port)
        ? `/api/attendance/update`
        : `http://${targetHost}:${port}/api/attendance/update`;

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAttendancePairingHeaders() },
        body: JSON.stringify(event),
    }).catch(() => {
        // Silently fail if local REST API server endpoint is unreachable
    });
}

/**
 * Subscribe to real-time attendance update events from any device
 */
export function subscribeToAttendanceUpdates(
    onEvent: (event: MobileAttendanceSyncEvent) => void,
    serverHost?: string
): () => void {
    const handlers: Array<() => void> = [];
    const seenEventKeys = new Set<string>();
    const seenRecordFingerprints = new Map<string, { status: string; timestamp: number }>();

    function deduplicatedOnEvent(ev: MobileAttendanceSyncEvent): void {
        if (!ev || !ev.record) return;
        const lrn = ev.record.student_lrn;
        const date = ev.record.date;
        const status = ev.record.status;
        const ts = ev.timestamp || Date.now();

        const exactKey = `${lrn}_${date}_${status}_${ts}`;
        if (seenEventKeys.has(exactKey)) return;
        seenEventKeys.add(exactKey);

        // Keep set size manageable
        if (seenEventKeys.size > 2000) {
            const first = seenEventKeys.values().next().value;
            if (first) seenEventKeys.delete(first);
        }

        const fingerprintKey = `${lrn}_${date}`;
        const existing = seenRecordFingerprints.get(fingerprintKey);
        if (existing && existing.status === status && existing.timestamp >= ts) {
            return; // Ignore duplicate or older state for the same student on the same day
        }

        seenRecordFingerprints.set(fingerprintKey, { status, timestamp: ts });
        onEvent(ev);
    }

    // 1. BroadcastChannel listener
    if (channel) {
        const bcHandler = (e: MessageEvent<MobileAttendanceSyncEvent>) => {
            if (e.data && e.data.type === 'ATTENDANCE_UPDATE') {
                deduplicatedOnEvent(e.data);
            }
        };
        channel.addEventListener('message', bcHandler);
        handlers.push(() => channel?.removeEventListener('message', bcHandler));
    }

    // 2. LocalStorage storage event listener
    const storageHandler = (e: StorageEvent) => {
        if (e.key === STORAGE_SYNC_KEY && e.newValue) {
            try {
                const event: MobileAttendanceSyncEvent = JSON.parse(e.newValue);
                if (event && event.type === 'ATTENDANCE_UPDATE') {
                    deduplicatedOnEvent(event);
                }
            } catch (err) {
                console.error('Failed to parse storage sync event:', err);
            }
        }
    };
    window.addEventListener('storage', storageHandler);
    handlers.push(() => window.removeEventListener('storage', storageHandler));

    // 3. Electron IPC direct polling (most reliable for EXE — bypasses network entirely)
    // 4. HTTP Polling Fallback (Every 3 seconds for active sync across Wi-Fi networks)
    let lastCheckTimestamp = 0; // 0 queries all pending events on first poll
    const targetHost = serverHost || (typeof window !== 'undefined' ? window.location.hostname : '') || 'localhost';
    const currentPort = (typeof window !== 'undefined' ? window.location.port : '') || '3001';
    
    // Resolve single valid HTTP endpoint
    const pollUrl = (typeof window !== 'undefined' && window.location.port)
        ? `/api/attendance/updates`
        : `http://${targetHost}:${currentPort}/api/attendance/updates`;

    const intervalId = setInterval(async () => {
        // Electron IPC path — direct main-process query, zero network overhead
        if (!usesHttpGateway() && window.electronAPI && window.electronAPI.getAttendanceUpdates) {
            try {
                const data = await window.electronAPI.getAttendanceUpdates(lastCheckTimestamp);
                if (data) {
                    if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                        for (const ev of data.events) {
                            deduplicatedOnEvent(ev as MobileAttendanceSyncEvent);
                        }
                    }
                    const serverTs = (data as { serverTime?: number; lastUpdated?: number }).serverTime || (data as { lastUpdated?: number }).lastUpdated;
                    if (serverTs && serverTs > 0) {
                        lastCheckTimestamp = serverTs;
                    } else if (lastCheckTimestamp === 0) {
                        lastCheckTimestamp = Date.now() - 60000;
                    }
                }
                return; // IPC succeeded, skip HTTP polling
            } catch {
                // Fall through to HTTP polling
            }
        }

        // HTTP Polling fallback
        try {
            const res = await fetch(`${pollUrl}?since=${lastCheckTimestamp}`, {
                headers: getAttendancePairingHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                    for (const ev of data.events) {
                        deduplicatedOnEvent(ev);
                    }
                }
                // Update lastCheckTimestamp using serverTime or lastUpdated from server response
                const serverTs = data.serverTime || data.lastUpdated;
                if (serverTs && serverTs > 0) {
                    lastCheckTimestamp = serverTs;
                } else if (lastCheckTimestamp === 0) {
                    lastCheckTimestamp = Date.now() - 60000;
                }
            }
        } catch {
            // Silently ignore unreachable endpoint
        }
    }, 3000);

    handlers.push(() => clearInterval(intervalId));

    // Cleanup function
    return () => {
        handlers.forEach(cleanup => cleanup());
    };
}

/**
 * Cache current desktop attendance session state for mobile offline access
 */
export function cacheSessionState(sessionData: MobileAttendanceSessionData): void {
    try {
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessionData));
    } catch (e) {
        console.error('Failed to cache session state:', e);
    }
}

/**
 * Retrieve cached session state for mobile portal
 */
export function getCachedSessionState(): MobileAttendanceSessionData | null {
    try {
        const data = localStorage.getItem(SESSION_CACHE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to parse cached session state:', e);
    }
    return null;
}

/**
 * Push active desktop session data (students, sections, records, school profile) to Express backend
 */
export function pushAttendanceSessionToBackend(data: {
    date?: string;
    students?: Student[];
    sections?: Section[];
    records?: AttendanceRecord[];
    schoolProfile?: unknown;
    localIp?: string;
}): void {
    if (typeof window === 'undefined') return;

    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Only expose fields required by the phone roll-call UI. Full learner
    // profiles contain addresses, birthdays, parent contacts and other PII;
    // the school profile also contains licensing and signature data.
    const mobileStudents = (data.students || []).map((student) => ({
        lrn: student.lrn,
        first_name: student.first_name,
        last_name: student.last_name,
        middle_name: student.middle_name,
        name_extension: student.name_extension,
        gender: student.gender,
        grade_level: student.grade_level,
        student_section: student.student_section,
    }));
    const mobileSections = (data.sections || []).map((section) => ({
        id: section.id,
        section_name: section.section_name,
        is_advisory: section.is_advisory,
    }));
    const mobileRecords = (data.records || []).map((record) => ({
        id: record.id,
        student_lrn: record.student_lrn,
        section_id: record.section_id,
        date: record.date,
        status: record.status,
        time_in: record.time_in,
        time_out: record.time_out,
    }));

    const sessionObj = {
        date: data.date || todayIso,
        students: mobileStudents,
        sections: mobileSections,
        records: mobileRecords,
        schoolProfile: data.schoolProfile && typeof data.schoolProfile === 'object'
            ? { name: String((data.schoolProfile as { name?: unknown }).name || '') }
            : null,
        lastUpdated: Date.now()
    };

    // 1. Direct Electron Native Main Process Bridge (Zero-CORS, 100% Reliable)
    if (!usesHttpGateway() && window.electronAPI && window.electronAPI.pushAttendanceSession) {
        window.electronAPI.pushAttendanceSession(sessionObj).catch(() => {});
        return;
    }

    // 2. Web REST API Fallback
    const payload = JSON.stringify(sessionObj);
    const host = data.localIp || (typeof window !== 'undefined' ? window.location.hostname : '') || 'localhost';
    const port = (typeof window !== 'undefined' ? window.location.port : '') || '3001';
    const endpoint = (typeof window !== 'undefined' && window.location.port)
        ? `/api/attendance/session`
        : `http://${host}:${port}/api/attendance/session`;

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAttendancePairingHeaders() },
        body: payload,
    }).catch(() => {
        // Silently ignore unreachable endpoint
    });
}
