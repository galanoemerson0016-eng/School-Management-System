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
    serverHost?: string
): void {
    const event: MobileAttendanceSyncEvent = {
        type: 'ATTENDANCE_UPDATE',
        record,
        studentName,
        timestamp: Date.now(),
        sourceDevice: window.navigator?.userAgent?.includes('Mobile') ? 'Smartphone' : 'Desktop PC',
    };

    // 0. Electron IPC — direct main-process bridge (zero-CORS, instant, EXE only)
    if (window.electronAPI && window.electronAPI.pushAttendanceUpdate) {
        window.electronAPI.pushAttendanceUpdate(event).catch(() => {});
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

    // 3. Push to Local Express REST API server across all active ports
    //    Port 3001 is the production default (EXE); 3003 is a legacy fallback.
    const targetHost = serverHost || window.location.hostname || 'localhost';
    const port = window.location.port || '3001';
    const endpoints = Array.from(new Set([
        `http://localhost:3001/api/attendance/update`,
        `http://127.0.0.1:3001/api/attendance/update`,
        `/api/attendance/update`,
        `http://${targetHost}:${port}/api/attendance/update`,
        `http://${targetHost}:3003/api/attendance/update`,
    ]));

    for (const apiUrl of endpoints) {
        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        }).catch(() => {
            // Silently fail if local REST API server endpoint is unreachable
        });
    }
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
    // 4. HTTP Polling Fallback (Every 1.5 seconds for active sync across Wi-Fi networks)
    let lastCheckTimestamp = 0; // 0 queries all pending events on first poll
    const targetHost = serverHost || (typeof window !== 'undefined' ? window.location.hostname : '') || 'localhost';
    const currentPort = (typeof window !== 'undefined' ? window.location.port : '') || '3001';
    
    // Build valid HTTP endpoints
    const rawUrls = [
        `http://localhost:3001/api/attendance/updates`,
        `http://127.0.0.1:3001/api/attendance/updates`,
        `/api/attendance/updates`,
        targetHost && currentPort ? `http://${targetHost}:${currentPort}/api/attendance/updates` : '',
        targetHost ? `http://${targetHost}:3001/api/attendance/updates` : '',
        targetHost ? `http://${targetHost}:3003/api/attendance/updates` : '',
    ].filter(Boolean);
    const pollUrls = Array.from(new Set(rawUrls));

    const intervalId = setInterval(async () => {
        // Electron IPC path — direct main-process query, zero network overhead
        if (window.electronAPI && window.electronAPI.getAttendanceUpdates) {
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
        for (const pollUrl of pollUrls) {
            try {
                const res = await fetch(`${pollUrl}?since=${lastCheckTimestamp}`);
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
                    break; // Endpoint succeeded, don't query remaining fallback ports
                }
            } catch {
                // Try next endpoint
            }
        }
    }, 1500);

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

    const sessionObj = {
        date: data.date || todayIso,
        students: data.students || [],
        sections: data.sections || [],
        records: data.records || [],
        schoolProfile: data.schoolProfile || null,
        lastUpdated: Date.now()
    };

    // 1. Direct Electron Native Main Process Bridge (Zero-CORS, 100% Reliable)
    if (window.electronAPI && window.electronAPI.pushAttendanceSession) {
        window.electronAPI.pushAttendanceSession(sessionObj).catch(() => {});
    }

    // 2. Web REST API Fallback
    const payload = JSON.stringify(sessionObj);
    const host = data.localIp || window.location.hostname || 'localhost';
    const port = window.location.port || '3001';
    const endpoints = Array.from(new Set([
        `/api/attendance/session`,
        `http://localhost:3001/api/attendance/session`,
        `http://127.0.0.1:3001/api/attendance/session`,
        `http://localhost:3003/api/attendance/session`,
        `http://${host}:3001/api/attendance/session`,
        `http://${host}:${port}/api/attendance/session`
    ]));

    for (const url of endpoints) {
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        }).catch(() => {
            // Silently ignore unreachable endpoints
        });
    }
}
