/**
 * Desktop Phone Attendance Gateway QR Modal
 * Displays a large QR code and local network IP link for teachers to open the
 * Mobile Phone Attendance Portal on their smartphones. Includes a real-time live feed of incoming phone scans.
 */
import { useState, useEffect } from 'react';
import { generateQrDataUrl } from '../../services/id-card/codes';
import { 
    subscribeToAttendanceUpdates, 
    pushAttendanceSessionToBackend,
    startAttendancePairing,
    revokeAttendancePairing,
    type MobileAttendanceSyncEvent 
} from '../../services/mobile-attendance-sync';
import { useAppStore } from '../../stores/app-store';
import { 
    Smartphone, X, Wifi, Copy, Check, ExternalLink, RefreshCw, Activity
} from 'lucide-react';

interface PhoneAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PhoneAttendanceModal({ isOpen, onClose }: PhoneAttendanceModalProps) {
    const students = useAppStore((s) => s.students);
    const sections = useAppStore((s) => s.sections);
    const attendanceRecords = useAppStore((s) => s.attendanceRecords);
    const schoolProfile = useAppStore((s) => s.schoolProfile);

    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [localIp, setLocalIp] = useState<string>('localhost');
    const [availableIps, setAvailableIps] = useState<Array<{ name: string; address: string }>>([]);
    const [fullMobileUrl, setFullMobileUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [recentScans, setRecentScans] = useState<MobileAttendanceSyncEvent[]>([]);
    const [pairingToken, setPairingToken] = useState('');
    const [pairingExpiresAt, setPairingExpiresAt] = useState(0);
    const [pairingError, setPairingError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        void startAttendancePairing()
            .then((pairing) => {
                if (cancelled) {
                    void revokeAttendancePairing(pairing.token);
                    return;
                }
                setPairingError('');
                setPairingToken(pairing.token);
                setPairingExpiresAt(pairing.expiresAt);
            })
            .catch((error) => {
                if (!cancelled) setPairingError(error instanceof Error ? error.message : 'Unable to secure the mobile gateway');
            });
        return () => { cancelled = true; };
    }, [isOpen]);

    const handleClose = () => {
        onClose();
    };

    const handleStopAccess = () => {
        const token = pairingToken;
        setPairingToken('');
        setPairingExpiresAt(0);
        if (token) void revokeAttendancePairing(token);
        onClose();
    };

    // Fetch local network IP & candidate interfaces from Electron or browser location
    useEffect(() => {
        if (!isOpen) return;

        async function resolveNetworkIp() {
            let candidates: Array<{ name: string; address: string }> = [];
            let resolvedIp = '';

            // 1. Query Express / Vite REST endpoint for LAN Wi-Fi IP address
            try {
                const res = await fetch('/api/network-ip');
                if (res.ok) {
                    const data = await res.json();
                    if (data.candidates && data.candidates.length > 0) {
                        candidates = data.candidates;
                    }
                    if (data.ip && data.ip !== 'localhost' && data.ip !== '127.0.0.1') {
                        resolvedIp = data.ip;
                    }
                }
            } catch {
                // Ignore fallback
            }

            // 2. Query Electron API if available
            if (window.electronAPI && window.electronAPI.getAllLocalIps) {
                try {
                    const list = await window.electronAPI.getAllLocalIps();
                    if (list && list.length > 0) {
                        candidates = Array.from(new Set([...candidates, ...list]));
                    }
                } catch {
                    // Ignore
                }
            }

            if (!resolvedIp && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                resolvedIp = window.location.hostname;
            }

            if (!resolvedIp && window.electronAPI && window.electronAPI.getLocalIp) {
                try {
                    const hostIp = await window.electronAPI.getLocalIp();
                    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
                        resolvedIp = hostIp;
                    }
                } catch {
                    // Ignore
                }
            }

            if (candidates.length > 0) {
                setAvailableIps(candidates);
            }
            if (resolvedIp) {
                setLocalIp(resolvedIp);
            }
        }

        void resolveNetworkIp();
    }, [isOpen]);

    // Re-generate QR code whenever localIp changes
    useEffect(() => {
        if (!isOpen || !localIp || !pairingToken) return;
        let cancelled = false;

        async function updateQr() {
            const port = window.location.port || '3001';
            const protocol = window.location.protocol.startsWith('http') ? window.location.protocol : 'http:';
            // Build direct mobile link URL
            const url = `${protocol}//${localIp}:${port}/#/mobile-attendance?pair=${encodeURIComponent(pairingToken)}`;
            setFullMobileUrl(url);

            const qrUrl = await generateQrDataUrl(url, { size: 400, margin: 1 });
            if (!cancelled) setQrDataUrl(qrUrl);
        }

        void updateQr();
        return () => { cancelled = true; };
    }, [isOpen, localIp, pairingToken]);

    // Push active desktop session data (students, sections, records) to Express server for mobile phone clients
    useEffect(() => {
        if (!isOpen || !pairingToken) return;
        pushAttendanceSessionToBackend({
            students,
            sections,
            records: attendanceRecords,
            schoolProfile,
            localIp
        });
    }, [isOpen, localIp, students, sections, attendanceRecords, schoolProfile, pairingToken]);

    // Subscribe to live phone scans & updates
    useEffect(() => {
        if (!isOpen) return;

        const unsubscribe = subscribeToAttendanceUpdates((event) => {
            setRecentScans((prev) => [event, ...prev].slice(0, 10));
        });

        return () => unsubscribe();
    }, [isOpen]);

    const handleCopy = () => {
        if (!fullMobileUrl) return;
        navigator.clipboard.writeText(fullMobileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden space-y-0">
                {/* Modal Header */}
                <div className="p-6 bg-linear-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur border border-white/20">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-wide uppercase flex items-center gap-2">
                                Phone Attendance Gateway
                            </h2>
                            <p className="text-xs text-emerald-100 font-medium">
                                Scan QR code with any smartphone to open Mobile Attendance
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {pairingError && (
                        <div role="alert" className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300">
                            Secure pairing could not start: {pairingError}
                        </div>
                    )}

                    {pairingToken && pairingExpiresAt > 0 && (
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                            Secure paired session active until {new Date(pairingExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Reopen this panel to view the same QR code.
                            <button type="button" onClick={handleStopAccess} className="ml-2 underline font-black text-rose-700 dark:text-rose-300">Stop phone access</button>
                        </div>
                    )}
                    {/* Step-by-Step Instructions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 space-y-1">
                            <span className="font-extrabold text-emerald-800 dark:text-emerald-300">1. Connect Wi-Fi</span>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                Ensure phone is connected to the school/local Wi-Fi.
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/30 space-y-1">
                            <span className="font-extrabold text-teal-800 dark:text-teal-300">2. Scan QR Code</span>
                            <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                                Open phone camera and scan the QR code below.
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/30 space-y-1">
                            <span className="font-extrabold text-sky-800 dark:text-sky-300">3. Live Sync</span>
                            <p className="text-[11px] text-sky-700 dark:text-sky-400 font-medium">
                                Attendance edits on phone reflect live on this PC!
                            </p>
                        </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
                        {qrDataUrl ? (
                            <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200">
                                <img src={qrDataUrl} alt="Mobile Attendance QR Code" className="w-56 h-56 object-contain" />
                            </div>
                        ) : (
                            <div className="w-56 h-56 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                            </div>
                        )}

                        {/* Network URL Display & Copy */}
                        <div className="w-full space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                                    Desktop Wi-Fi IP Address:
                                </span>
                                {availableIps.length > 0 ? (
                                    <select
                                        value={localIp}
                                        onChange={(e) => setLocalIp(e.target.value)}
                                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-white/10 focus:outline-none max-w-56"
                                    >
                                        {availableIps.map(item => (
                                            <option key={item.address} value={item.address}>
                                                {item.address} ({item.name})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={localIp}
                                        onChange={(e) => setLocalIp(e.target.value.trim())}
                                        placeholder="e.g. 192.168.1.100"
                                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-white/10 focus:outline-none"
                                    />
                                )}
                            </div>

                            {(localIp === 'localhost' || localIp === '127.0.0.1') && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800/40">
                                    ⚠️ <b>Important for Mobile Access:</b> <code className="font-mono">localhost</code> only works on this computer. Make sure your phone and computer are on the same Wi-Fi, then type your PC's IP address (e.g., <code className="font-mono">192.168.1.100</code>) in the box above to update the QR code.
                                </p>
                            )}

                            <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10">
                                <input
                                    type="text"
                                    readOnly
                                    value={fullMobileUrl}
                                    className="flex-1 bg-transparent text-xs font-mono text-slate-800 dark:text-white border-none focus:outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                                <a
                                    href={fullMobileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 cursor-pointer"
                                    title="Open directly in browser tab"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Live Incoming Phone Scans Stream */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            Live Smartphone Activity Log ({recentScans.length})
                        </h4>
                        {recentScans.length === 0 ? (
                            <div className="py-4 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                                Waiting for phone scans... Scan the QR code above to start live attendance.
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                                {recentScans.map((sc, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-200"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                            <span className="font-bold text-slate-800 dark:text-white">
                                                {sc.studentName || sc.record.student_lrn}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                                                {sc.record.status}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            {new Date(sc.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
