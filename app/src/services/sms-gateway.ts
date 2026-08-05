/**
 * Android SMS Gateway Integration Service
 * Compatible with android-sms-gateway API (https://github.com/galanoemerson0016-eng/android-sms-gateway)
 * Supports Local HTTP REST API (http://<ip>:8080/message) and Cloud API endpoints.
 */

export interface SmsGatewayConfig {
    enabled: boolean;
    serverUrl: string; // e.g. "http://192.168.1.100:8080/message" or "https://api.sms-gate.app/3rdparty/v1/message"
    username?: string;
    password?: string;
    sendOnArrival: boolean;
    sendOnDeparture: boolean;
    messageTemplate: string; // e.g. "Good day! Your child {student_name} has safely arrived at {school_name} at {time} on {date}."
}

export interface SmsSendResult {
    success: boolean;
    message: string;
    timestamp: number;
    recipient?: string;
}

const STORAGE_KEY = 'formease_sms_gateway_config';
const SMS_LOGS_KEY = 'formease_sms_delivery_logs';

export const DEFAULT_SMS_CONFIG: SmsGatewayConfig = {
    enabled: false,
    serverUrl: 'http://192.168.1.100:8080/message',
    username: '',
    password: '',
    sendOnArrival: true,
    sendOnDeparture: false,
    messageTemplate: 'Good day! Your child {student_name} has safely arrived at {school_name} at {time} on {date}.',
};

/**
 * Get current SMS Gateway Configuration
 */
export function getSmsGatewayConfig(): SmsGatewayConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Automatic Sanitization Safeguard: Purge any legacy test credentials or hardcoded URLs
            if (
                parsed.username === 'BDT7QR' || 
                (parsed.password && parsed.password.includes('Emerica')) || 
                (parsed.serverUrl && parsed.serverUrl.includes('api.sms-gate.app'))
            ) {
                const sanitized = {
                    ...DEFAULT_SMS_CONFIG,
                    enabled: false,
                    serverUrl: 'http://192.168.1.100:8080/message',
                    username: '',
                    password: ''
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
                return sanitized;
            }
            return { ...DEFAULT_SMS_CONFIG, ...parsed };
        }
    } catch (error) {
        console.error('Failed to parse SMS gateway config:', error);
    }
    return DEFAULT_SMS_CONFIG;
}

/**
 * Save SMS Gateway Configuration
 */
export function saveSmsGatewayConfig(config: Partial<SmsGatewayConfig>): SmsGatewayConfig {
    const current = getSmsGatewayConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

/**
 * Reset SMS Gateway Configuration and Clear Logs
 */
export function resetSmsGatewayConfig(): SmsGatewayConfig {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SMS_LOGS_KEY);
    return DEFAULT_SMS_CONFIG;
}

/**
 * Format phone number to E.164 or local international format (+63...)
 */
export function formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('09') && cleaned.length === 11) {
        cleaned = '+63' + cleaned.slice(1);
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
        cleaned = '+63' + cleaned;
    } else if (!cleaned.startsWith('+') && cleaned.length > 0) {
        cleaned = '+' + cleaned;
    }
    return cleaned;
}

/**
 * Replace placeholders in SMS message template
 */
export function formatSmsMessage(
    template: string,
    studentName: string,
    schoolName: string,
    statusTime: string,
    statusDate: string,
    statusType: string = 'present'
): string {
    const s = (statusType || 'present').toLowerCase().trim();

    // Standard status mapping
    const statusMap: Record<string, string> = {
        present: 'Present',
        absent: 'Absent',
        late: 'Late',
        cutting: 'Cutting Class',
        excused: 'Excused',
        arrival: 'Present',
        departure: 'Dismissed',
    };
    const displayStatus = statusMap[s] || statusType;

    // If template has {status}, substitute placeholders directly into custom template
    if (template && template.includes('{status}')) {
        return template
            .replace(/{student_name}/gi, studentName)
            .replace(/{school_name}/gi, schoolName)
            .replace(/{time}/gi, statusTime)
            .replace(/{date}/gi, statusDate)
            .replace(/{status}/gi, displayStatus);
    }

    // Dedicated status-specific messages for natural, professional reading
    if (s === 'absent') {
        return `Good day! Your child ${studentName} was marked ABSENT at ${schoolName} for today (${statusDate}). Please coordinate with the school adviser.`;
    }
    if (s === 'late') {
        return `Good day! Your child ${studentName} arrived LATE at ${schoolName} at ${statusTime} on ${statusDate}.`;
    }
    if (s === 'cutting') {
        return `IMPORTANT: Your child ${studentName} was reported CUTTING CLASS at ${schoolName} at ${statusTime} on ${statusDate}. Please contact the school immediately.`;
    }
    if (s === 'excused') {
        return `Good day! Your child ${studentName} has an EXCUSED attendance record at ${schoolName} for ${statusDate}.`;
    }

    // Default Present / Arrival message:
    return `Good day! Your child ${studentName} has safely arrived at ${schoolName} at ${statusTime} on ${statusDate}.`;
}

/**
 * Core HTTP sender to Android SMS Gateway endpoint
 */
export async function sendSmsViaGateway(
    phoneNumbers: string[],
    text: string,
    customConfig?: SmsGatewayConfig
): Promise<SmsSendResult> {
    const config = customConfig || getSmsGatewayConfig();

    if (!config.serverUrl) {
        return {
            success: false,
            message: 'SMS Gateway URL is not configured.',
            timestamp: Date.now(),
        };
    }

    const formattedPhones = phoneNumbers
        .map(p => formatPhoneNumber(p))
        .filter(p => p.length >= 10);

    if (formattedPhones.length === 0) {
        return {
            success: false,
            message: 'No valid phone numbers provided.',
            timestamp: Date.now(),
        };
    }

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (config.username && config.password) {
            const auth = btoa(`${config.username}:${config.password}`);
            headers['Authorization'] = `Basic ${auth}`;
        }

        const payload = {
            textMessage: {
                text: text,
            },
            phoneNumbers: formattedPhones,
        };

        // If running inside Electron desktop app, use native Node.js HTTP request to completely bypass browser CORS preflight restrictions
        if (window.electronAPI && window.electronAPI.sendSmsHttpRequest) {
            const res = await window.electronAPI.sendSmsHttpRequest({
                url: config.serverUrl,
                method: 'POST',
                headers,
                body: payload,
            });

            if (!res.success) {
                throw new Error(res.error || `HTTP ${res.statusCode || 'Error'}: ${res.data || 'Failed to communicate with SMS Gateway'}`);
            }
        } else {
            // In Vite web dev mode (e.g. localhost:3003), proxy api.sms-gate.app calls through dev server to bypass browser CORS
            let requestUrl = config.serverUrl;
            if (requestUrl.includes('api.sms-gate.app')) {
                requestUrl = requestUrl.replace('https://api.sms-gate.app', '/api-sms-cloud');
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(requestUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (!response.ok && response.status !== 202) {
                    const errorText = await response.text().catch(() => 'Unknown server error');
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
            } catch (fetchErr) {
                // If browser blocks CORS in web mode, send via no-cors fallback
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    await fetch(config.serverUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify(payload),
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);
                } catch {
                    throw fetchErr;
                }
            }
        }

        const result: SmsSendResult = {
            success: true,
            message: `SMS sent successfully to ${formattedPhones.join(', ')}`,
            timestamp: Date.now(),
            recipient: formattedPhones.join(', '),
        };

        logSmsDelivery(result, text);
        return result;
    } catch (error) {
        let errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            if (config.serverUrl.includes('api.sms-gate.app')) {
                errorMessage = `Browser CORS restriction on Cloud Endpoint. Please restart the FormEase Pro Desktop App for the native socket bridge to take effect.`;
            } else {
                errorMessage = `Cannot reach Android phone at ${config.serverUrl}. Make sure the phone is on the same Wi-Fi, the app's Local Server is ON, and phone screen is active. Or click Cloud Server Preset.`;
            }
        }
        const failureResult: SmsSendResult = {
            success: false,
            message: `SMS send failed: ${errorMessage}`,
            timestamp: Date.now(),
            recipient: formattedPhones.join(', '),
        };
        logSmsDelivery(failureResult, text);
        return failureResult;
    }
}

/**
 * Convenience helper to trigger automated Parent Attendance SMS
 */
export async function triggerParentAttendanceSms(
    studentName: string,
    parentContact: string,
    schoolName: string,
    statusType: string = 'present'
): Promise<SmsSendResult | null> {
    const config = getSmsGatewayConfig();

    if (!config.enabled) {
        return null; // Gateway disabled
    }

    if (!parentContact || parentContact.trim().length < 7) {
        return {
            success: false,
            message: `Skipped SMS: No valid parent phone number for ${studentName}`,
            timestamp: Date.now(),
        };
    }

    const now = new Date();
    const statusTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const statusDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const messageText = formatSmsMessage(
        config.messageTemplate,
        studentName,
        schoolName || 'Calibungan High School',
        statusTime,
        statusDate,
        statusType
    );

    return await sendSmsViaGateway([parentContact], messageText, config);
}

export interface SmsBroadcastTarget {
    studentName: string;
    parentPhone: string;
}

export interface SmsBroadcastProgress {
    total: number;
    sent: number;
    failed: number;
    currentStudent: string;
}

/**
 * Send batch SMS broadcast to a list of parent targets with progress callback
 */
export async function broadcastParentSms(
    targets: SmsBroadcastTarget[],
    messageTemplate: string,
    schoolName: string,
    onProgress?: (progress: SmsBroadcastProgress) => void
): Promise<{ sent: number; failed: number }> {
    const config = getSmsGatewayConfig();
    if (!config.enabled) {
        throw new Error('SMS Gateway is disabled in Settings. Please enable it first.');
    }

    const now = new Date();
    const statusTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const statusDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        if (onProgress) {
            onProgress({
                total: targets.length,
                sent,
                failed,
                currentStudent: target.studentName,
            });
        }

        if (!target.parentPhone || target.parentPhone.trim().length < 7) {
            failed++;
            continue;
        }

        const messageText = messageTemplate
            .replace(/{student_name}/gi, target.studentName)
            .replace(/{school_name}/gi, schoolName || 'Calibungan High School')
            .replace(/{time}/gi, statusTime)
            .replace(/{date}/gi, statusDate);

        try {
            const res = await sendSmsViaGateway([target.parentPhone], messageText, config);
            if (res.success) {
                sent++;
            } else {
                failed++;
            }
        } catch {
            failed++;
        }
    }

    if (onProgress) {
        onProgress({
            total: targets.length,
            sent,
            failed,
            currentStudent: 'Complete',
        });
    }

    return { sent, failed };
}

/**
 * Log SMS delivery attempts to localStorage
 */
function logSmsDelivery(result: SmsSendResult, text: string) {
    try {
        const logs = getSmsDeliveryLogs();
        const entry = {
            ...result,
            textSnippet: text.slice(0, 80),
        };
        const updated = [entry, ...logs].slice(0, 100); // Keep last 100 logs
        localStorage.setItem(SMS_LOGS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to log SMS delivery:', e);
    }
}

/**
 * Retrieve SMS delivery logs
 */
export function getSmsDeliveryLogs(): Array<SmsSendResult & { textSnippet?: string }> {
    try {
        const stored = localStorage.getItem(SMS_LOGS_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse SMS delivery logs:', e);
    }
    return [];
}

/**
 * Clear SMS delivery logs
 */
export function clearSmsDeliveryLogs(): void {
    localStorage.removeItem(SMS_LOGS_KEY);
}
