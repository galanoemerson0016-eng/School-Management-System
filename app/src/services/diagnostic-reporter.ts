import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getMachineId } from '../utils/machine-id';
import type { SchoolProfile, User } from '../types';

export interface DiagnosticSubmissionPayload {
  category: 'grade_sync' | 'ecr' | 'sf9' | 'sf10' | 'database' | 'general';
  userNote?: string;
  sectionName?: string;
  gradeLevel?: string;
  studentLrn?: string;
  studentName?: string;
  totalMismatches?: number;
  syncRate?: number;
  reportMarkdown: string;
  technicalDetails?: Record<string, unknown>;
  schoolProfile?: Partial<SchoolProfile>;
  user?: Partial<User>;
  activeSchoolYear?: string;
}

export interface SubmissionResult {
  success: boolean;
  ticketId: string;
  method: 'cloud' | 'offline_queued' | 'email_fallback';
  message: string;
}

const OFFLINE_QUEUE_KEY = 'formease_pending_diagnostic_reports';

export class DiagnosticReporter {
  /**
   * Submits a diagnostic error report to Firestore, falling back to local queue or email
   */
  static async submitReport(payload: DiagnosticSubmissionPayload): Promise<SubmissionResult> {
    const ticketId = `FE-DIAG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const machineId = getMachineId();

    const reportDocument = {
      ticket_id: ticketId,
      created_at: new Date().toISOString(),
      timestamp: Date.now(),
      app_version: '3.2.0',
      machine_id: machineId,
      status: 'open',
      category: payload.category,
      user_note: payload.userNote || '',
      section_name: payload.sectionName || '',
      grade_level: payload.gradeLevel || '',
      student_lrn: payload.studentLrn || '',
      student_name: payload.studentName || '',
      total_mismatches: payload.totalMismatches ?? 0,
      sync_rate: payload.syncRate ?? 100,
      active_school_year: payload.activeSchoolYear || '',
      school: {
        id: payload.schoolProfile?.school_id || '',
        name: payload.schoolProfile?.name || 'Unknown School',
        division: payload.schoolProfile?.division || '',
        region: payload.schoolProfile?.region || '',
      },
      submitted_by: {
        name: payload.user?.displayName || 'Anonymous User',
        email: payload.user?.email || 'N/A',
        role: payload.user?.role || 'teacher',
      },
      client_info: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
        screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
      },
      report_markdown: payload.reportMarkdown,
      technical_details: payload.technicalDetails || {},
    };

    // Attempt direct Firestore write
    if (navigator.onLine) {
      try {
        const docRef = doc(collection(db, 'diagnostic_reports'), ticketId);
        await setDoc(docRef, reportDocument);

        console.log(`[DiagnosticReporter] Successfully uploaded report ${ticketId} to Firestore.`);
        return {
          success: true,
          ticketId,
          method: 'cloud',
          message: `Report #${ticketId} submitted directly to developer Emerson! We will inspect this issue promptly.`,
        };
      } catch (cloudErr) {
        console.warn('[DiagnosticReporter] Cloud upload failed, queueing offline:', cloudErr);
      }
    }

    // Offline or cloud failed: Queue locally
    try {
      const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = rawQueue ? JSON.parse(rawQueue) : [];
      queue.push(reportDocument);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

      return {
        success: true,
        ticketId,
        method: 'offline_queued',
        message: `Report #${ticketId} saved locally. It will automatically upload to the developer once you are back online.`,
      };
    } catch (localErr) {
      console.error('[DiagnosticReporter] Failed to queue report locally:', localErr);
      return {
        success: false,
        ticketId,
        method: 'email_fallback',
        message: 'Could not save report locally. Please copy the diagnostic summary or send via Email.',
      };
    }
  }

  /**
   * Attempts to flush any offline queued reports once internet connectivity resumes
   */
  static async flushOfflineReports(): Promise<number> {
    if (!navigator.onLine) return 0;

    try {
      const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!rawQueue) return 0;

      const queue = JSON.parse(rawQueue);
      if (!Array.isArray(queue) || queue.length === 0) return 0;

      const remaining: unknown[] = [];
      let sentCount = 0;

      for (const item of queue) {
        try {
          const report = item as { ticket_id: string };
          const docRef = doc(collection(db, 'diagnostic_reports'), report.ticket_id);
          await setDoc(docRef, item);
          sentCount++;
        } catch {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
      }

      if (sentCount > 0) {
        console.log(`[DiagnosticReporter] Flushed ${sentCount} queued diagnostic reports to Firestore.`);
      }

      return sentCount;
    } catch (err) {
      console.error('[DiagnosticReporter] Error flushing offline reports:', err);
      return 0;
    }
  }

  /**
   * Generates a mailto link pre-formatted for developer Emerson
   */
  static getEmailFallbackUrl(ticketId: string, payload: DiagnosticSubmissionPayload): string {
    const to = 'galanoemerson0016@gmail.com';
    const schoolName = payload.schoolProfile?.name || 'School';
    const subject = encodeURIComponent(`[FormEase Bug Report] ${schoolName} - Ticket #${ticketId}`);
    
    let bodyText = `Ticket ID: ${ticketId}\n`;
    bodyText += `School: ${schoolName}\n`;
    bodyText += `User: ${payload.user?.displayName || 'User'} (${payload.user?.email || ''})\n`;
    bodyText += `Active SY: ${payload.activeSchoolYear || ''}\n`;
    bodyText += `Section: ${payload.sectionName || ''} (${payload.gradeLevel || ''})\n`;
    if (payload.userNote) {
      bodyText += `User Note: ${payload.userNote}\n`;
    }
    bodyText += `\n--- DIAGNOSTIC DATA ---\n\n`;
    bodyText += payload.reportMarkdown;

    return `mailto:${to}?subject=${subject}&body=${encodeURIComponent(bodyText.substring(0, 1800))}`;
  }
}

// Auto-flush when browser comes online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void DiagnosticReporter.flushOfflineReports();
  });
  // Also attempt flush on startup
  setTimeout(() => {
    void DiagnosticReporter.flushOfflineReports();
  }, 5000);
}
