import { useState } from 'react';
import { 
    MessageSquare, Smartphone, Send, CheckCircle2, AlertCircle, RefreshCw, Trash2, ExternalLink, Eye, EyeOff 
} from 'lucide-react';
import { 
    getSmsGatewayConfig, 
    saveSmsGatewayConfig, 
    resetSmsGatewayConfig,
    sendSmsViaGateway, 
    getSmsDeliveryLogs, 
    clearSmsDeliveryLogs, 
    type SmsGatewayConfig 
} from '../../services/sms-gateway';

export function SmsGatewaySettings() {
    const [config, setConfig] = useState<SmsGatewayConfig>(() => getSmsGatewayConfig());
    const [showPassword, setShowPassword] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(null);
    const [logs, setLogs] = useState(() => getSmsDeliveryLogs());

    const handleSave = (updated: Partial<SmsGatewayConfig>) => {
        const newCfg = saveSmsGatewayConfig(updated);
        setConfig(newCfg);
    };

    const handleResetDefaults = () => {
        const resetCfg = resetSmsGatewayConfig();
        setConfig(resetCfg);
        setLogs([]);
        setTestFeedback({ success: true, message: 'SMS Gateway settings and logs have been reset to clean defaults.' });
    };

    const handleTestSms = async () => {
        if (!testPhone || testPhone.trim().length < 7) {
            setTestFeedback({ success: false, message: 'Please enter a valid mobile number (e.g. 09123456789)' });
            return;
        }
        setIsTesting(true);
        setTestFeedback(null);
        try {
            const result = await sendSmsViaGateway(
                [testPhone],
                `FormEase Pro Alert Test: Hello! The Android SMS Gateway is working properly. (${new Date().toLocaleTimeString()})`,
                config
            );
            setTestFeedback({ success: result.success, message: result.message });
            setLogs(getSmsDeliveryLogs());
        } catch (err) {
            setTestFeedback({ success: false, message: err instanceof Error ? err.message : String(err) });
        } finally {
            setIsTesting(false);
        }
    };

    const handleClearLogs = () => {
        clearSmsDeliveryLogs();
        setLogs([]);
    };

    return (
        <div className="space-y-6">
            {/* Header / Intro Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                Parent SMS Alert Gateway
                            </h3>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                Automated 100% Free SMS notifications to parents via Android SMS Gateway REST API.
                            </p>
                        </div>
                    </div>

                    {/* Enable Toggle Switch */}
                    <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-white/5 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shrink-0">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            Gateway Active
                        </span>
                        <div className="relative inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => handleSave({ enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-500"></div>
                        </div>
                    </label>
                </div>

                {/* Integration Details Banner */}
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 space-y-3">
                    <div className="flex items-start gap-3">
                        <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-900 dark:text-blue-300 space-y-1">
                            <p className="font-bold">Compatible with open-source Android SMS Gateway</p>
                            <p className="text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                                Turn any spare Android phone with an unli-text SIM promo into a 100% free SMS Gateway server.
                            </p>
                            <a
                                href="https://github.com/capcom6/android-sms-gateway"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                            >
                                View Official GitHub Repo <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* Step-by-Step Instructions Card */}
                    <div className="pt-3 border-t border-blue-200/60 dark:border-blue-800/40 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-white/70 dark:bg-black/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
                            <p className="font-bold text-blue-900 dark:text-blue-200">1. Install Android App</p>
                            <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-normal">
                                Download APK from GitHub Releases, install on Android phone, and grant SMS permissions. *(Xiaomi: App info ➔ ⋮ ➔ Allow restricted settings).*
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/70 dark:bg-black/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
                            <p className="font-bold text-blue-900 dark:text-blue-200">2. Turn ON Server</p>
                            <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-normal">
                                Connect phone to school Wi-Fi. Turn <b>Local Server</b> switch ON (or Cloud Server) and note your phone IP & credentials.
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/70 dark:bg-black/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
                            <p className="font-bold text-blue-900 dark:text-blue-200">3. Connect & Test</p>
                            <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-normal">
                                Paste your phone IP below (e.g. <code className="font-mono">http://192.168.1.100:8080/message</code>) and click <b>Send Test SMS</b>!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Configuration Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Server URL */}
                    <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Gateway Server Endpoint URL
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSave({ 
                                        serverUrl: 'http://192.168.1.100:8080/message',
                                        username: '',
                                        password: ''
                                    })}
                                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                    Local IP Preset
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    type="button"
                                    onClick={() => handleSave({ 
                                        serverUrl: 'https://api.sms-gate.app/3rdparty/v1/message',
                                        username: '',
                                        password: ''
                                    })}
                                    className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                                >
                                    Cloud Server Preset
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    type="button"
                                    onClick={handleResetDefaults}
                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                                >
                                    Reset to Defaults
                                </button>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={config.serverUrl}
                            onChange={(e) => handleSave({ serverUrl: e.target.value })}
                            placeholder="http://192.168.1.100:8080/message"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                        <p className="text-[10px] text-slate-400 font-medium">
                            Enter local network IP endpoint (e.g. <code className="font-mono">http://192.168.1.100:8080/message</code>) or Cloud API URL.
                        </p>
                    </div>

                    {/* Basic Auth Username */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Basic Auth Username (Optional)
                        </label>
                        <input
                            type="text"
                            value={config.username || ''}
                            onChange={(e) => handleSave({ username: e.target.value })}
                            placeholder="Optional API username"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                    </div>

                    {/* Basic Auth Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Basic Auth Password (Optional)
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={config.password || ''}
                                onChange={(e) => handleSave({ password: e.target.value })}
                                placeholder="Optional API password"
                                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Event Triggers */}
                    <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-100 dark:border-white/5">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Automatic Attendance Triggers
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.sendOnArrival}
                                    onChange={(e) => handleSave({ sendOnArrival: e.target.checked })}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Send SMS when student arrives (QR / Barcode scanned Present/Late)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Message Template Editor */}
                    <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                SMS Message Template
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold">
                                Use placeholders below
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            value={config.messageTemplate}
                            onChange={(e) => handleSave({ messageTemplate: e.target.value })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                        />
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold">
                                {'{student_name}'}
                            </span>
                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold">
                                {'{school_name}'}
                            </span>
                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold">
                                {'{time}'}
                            </span>
                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold">
                                {'{date}'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Connection Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-500" />
                    Test SMS Gateway Connection
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Send a real-time test SMS message to verify your Android SMS Gateway connection.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="Enter mobile number (e.g. 09123456789)"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <button
                        onClick={handleTestSms}
                        disabled={isTesting || !config.enabled}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/15"
                    >
                        {isTesting ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                Send Test SMS
                            </>
                        )}
                    </button>
                </div>

                {testFeedback && (
                    <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                        testFeedback.success 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40'
                    }`}>
                        {testFeedback.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <span>{testFeedback.message}</span>
                    </div>
                )}
            </div>

            {/* Delivery Logs */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-indigo-500" />
                        Recent SMS Delivery Logs ({logs.length})
                    </h4>
                    {logs.length > 0 && (
                        <button
                            onClick={handleClearLogs}
                            className="text-[10px] px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" /> Clear Logs
                        </button>
                    )}
                </div>

                {logs.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                        No SMS delivery logs recorded yet.
                    </div>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {logs.map((log, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${log.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <span className="font-bold text-slate-700 dark:text-slate-200">
                                            {log.recipient || 'Unknown Recipient'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic">
                                        "{log.textSnippet}"
                                    </p>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono font-semibold shrink-0">
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
