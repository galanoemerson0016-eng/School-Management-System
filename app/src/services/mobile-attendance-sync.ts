/**
 * Mobile Attendance Real-Time Sync Service
 * Enables real-time two-way synchronization between Mobile Phone Attendance and FormEase Pro Desktop.
 * 
 * Supports:
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
    const targetHost = serverHost || window.location.hostname || 'localhost';
    const port = window.location.port || '3003';
    const endpoints = Array.from(new Set([
        `/api/attendance/update`,
        `http://${targetHost}:${port}/api/attendance/update`,
        `http://${targetHost}:3003/api/attendance/update`,
        `http://${targetHost}:3001/api/attendance/update`
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

    // 1. BroadcastChannel listener
    if (channel) {
        const bcHandler = (e: MessageEvent<MobileAttendanceSyncEvent>) => {
            if (e.data && e.data.type === 'ATTENDANCE_UPDATE') {
                onEvent(e.data);
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
                    onEvent(event);
                }
            } catch (err) {
                console.error('Failed to parse storage sync event:', err);
            }
        }
    };
    window.addEventListener('storage', storageHandler);
    handlers.push(() => window.removeEventListener('storage', storageHandler));

    // 3. HTTP Polling Fallback (Every 1.5 seconds for active sync across Wi-Fi networks)
    let lastCheckTimestamp = Date.now() - 120000; // 2-minute sliding lookback window
    const seenEventKeys = new Set<string>();
    const targetHost = serverHost || window.location.hostname || 'localhost';
    const currentPort = window.location.port || '3003';
    const pollUrls = Array.from(new Set([
        `/api/attendance/updates`,
        `http://${targetHost}:${currentPort}/api/attendance/updates`,
        `http://${targetHost}:3003/api/attendance/updates`,
        `http://${targetHost}:3001/api/attendance/updates`
    ]));

    const intervalId = setInterval(async () => {
        for (const pollUrl of pollUrls) {
            try {
                const res = await fetch(`${pollUrl}?since=${lastCheckTimestamp}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                        for (const ev of data.events) {
                            const eventKey = `${ev.record?.student_lrn}_${ev.record?.date}_${ev.record?.status}_${ev.timestamp}`;
                            if (!seenEventKeys.has(eventKey)) {
                                seenEventKeys.add(eventKey);
                                onEvent(ev);
                            }
                        }
                    }
                    // Keep a sliding 2-minute lookback window so cross-device clock drift never drops events
                    lastCheckTimestamp = Math.max(0, Date.now() - 120000);
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
    students?: Student[];
    sections?: Section[];
    records?: AttendanceRecord[];
    schoolProfile?: any;
    localIp?: string;
}): void {
    if (typeof window === 'undefined') return;

    const payload = JSON.stringify({
        students: data.students || [],
        sections: data.sections || [],
        records: data.records || [],
        schoolProfile: data.schoolProfile || null,
        lastUpdated: Date.now()
    });

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
