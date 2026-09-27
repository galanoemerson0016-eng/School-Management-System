import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  deleteDoc,
  writeBatch,
  addDoc,
  runTransaction
} from 'firebase/firestore';

let activeProduct: 'formease-pro' | 'anecdotal-record' | 'id-generator' = 'formease-pro';
let COLLECTION_PATH = 'artifacts/g7-special/public/data/licenses';
let REQUESTS_PATH = 'artifacts/g7-special/admin/data/purchase_requests';
let TRIALS_PATH = 'artifacts/g7-special/public/data/trials';
let DOWNLOADS_DOC_PATH = 'artifacts/g7-special/public/data/downloads_info';

// Robust date parser for Firestore data
const parseFirestoreDate = (date: any) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date);
  if (typeof date === 'object' && date.seconds) return new Date(date.seconds * 1000);
  if (typeof date === 'object' && typeof date.toDate === 'function') return date.toDate();
  return new Date(date);
};

export const licenseService = {
  setProduct(product: 'formease-pro' | 'anecdotal-record' | 'id-generator') {
    activeProduct = product;
    if (product === 'formease-pro') {
      COLLECTION_PATH = 'artifacts/g7-special/public/data/licenses';
      REQUESTS_PATH = 'artifacts/g7-special/admin/data/purchase_requests';
      TRIALS_PATH = 'artifacts/g7-special/public/data/trials';
      DOWNLOADS_DOC_PATH = 'artifacts/g7-special/public/data/downloads_info';
    } else if (product === 'anecdotal-record') {
      COLLECTION_PATH = 'artifacts/anecdotal-record/public/data/licenses';
      REQUESTS_PATH = 'artifacts/anecdotal-record/admin/data/purchase_requests';
      TRIALS_PATH = 'artifacts/anecdotal-record/public/data/trials';
      DOWNLOADS_DOC_PATH = 'artifacts/anecdotal-record/public/data/downloads_info';
    } else if (product === 'id-generator') {
      COLLECTION_PATH = 'artifacts/id-generator/public/data/licenses';
      REQUESTS_PATH = 'artifacts/id-generator/admin/data/purchase_requests';
      TRIALS_PATH = 'artifacts/id-generator/public/data/trials';
      DOWNLOADS_DOC_PATH = 'artifacts/id-generator/public/data/downloads_info';
    }
  },

  getProduct() {
    return activeProduct;
  },

  // --- ADMIN METHODS ---
  async getAllLicenses() {
    try {
      const q = query(collection(db, COLLECTION_PATH));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data,
          id: doc.id, 
          serial: data.serial || doc.id,
          status: data.status || 'pending',
          machine_id: data.machine_id || '',
          activated_at: data.activated_at || null,
          registered_to: data.registered_to || null,
          expires_at: data.expires_at || null,
          batch_id: data.batch_id || '',
          duration_months: data.duration_months || 12,
          platform: data.platform || 'windows',
          created_at: data.created_at || null
        };
      });
    } catch (e) {
      console.error("Failed to get licenses:", e);
      return [];
    }
  },

  async createLicense(serial: string, batchId: string = '', durationMonths: number = 12, registeredTo: string | null = null, platform: string = 'windows') {
    const now = new Date();
    try {
      await setDoc(doc(db, COLLECTION_PATH, serial), {
        serial,
        status: 'pending',
        machine_id: '',
        activated_at: null,
        registered_to: registeredTo,
        expires_at: null,
        created_at: now.toISOString(),
        batch_id: batchId,
        duration_months: durationMonths,
        platform: platform
      });
    } catch (error) {
      console.error("Create License failed:", error);
      throw error;
    }
  },

  async bulkCreate(serials: string[], batchId: string = '', durationMonths: number = 12, platform: string = 'windows') {
    const batch = writeBatch(db);
    const now = new Date();

    serials.forEach(serial => {
      const docRef = doc(db, COLLECTION_PATH, serial);
      batch.set(docRef, {
        serial,
        status: 'pending',
        machine_id: '',
        activated_at: null,
        registered_to: null,
        expires_at: null,
        created_at: now.toISOString(),
        batch_id: batchId,
        duration_months: durationMonths,
        platform: platform
      });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Bulk Create failed:", error);
      throw error;
    }
  },

  async resetLicense(serial: string) {
    const docRef = doc(db, COLLECTION_PATH, serial);
    await setDoc(docRef, {
      status: 'pending',
      machine_id: '',
      activated_at: null,
      expires_at: null,
      registered_to: null,
      reset_at: new Date().toISOString()
    }, { merge: true });
  },

  async revokeLicense(serial: string) {
    await deleteDoc(doc(db, COLLECTION_PATH, serial));
  },

  async cleanupPendingLicenses() {
    const q = query(collection(db, COLLECTION_PATH));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.docs.forEach(docSnap => {
      if (docSnap.data().status === 'pending') {
        batch.delete(docSnap.ref);
        count++;
      }
    });
    
    await batch.commit();
    return count;
  },

  async repairExpirations() {
    try {
      const q = query(collection(db, COLLECTION_PATH));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let count = 0;
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'activated') {
          const activatedAt = parseFirestoreDate(data.activated_at);
          
          if (activatedAt && !isNaN(activatedAt.getTime())) {
            const correctExpiry = new Date(activatedAt.getTime() + 365 * 24 * 60 * 60 * 1000);
            
            batch.update(docSnap.ref, {
              expires_at: correctExpiry.toISOString()
            });
            count++;
          }
        }
      });
      
      if (count > 0) {
        await batch.commit();
      }
      return count;
    } catch (error) {
      console.error("Repair failed:", error);
      throw error;
    }
  },

  // --- PURCHASE REQUEST METHODS ---
  async getAllRequests() {
    try {
      const q = query(collection(db, REQUESTS_PATH));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    } catch (e) {
      console.error("Failed to get requests:", e);
      return [];
    }
  },

  async deleteRequest(requestId: string) {
    await deleteDoc(doc(db, REQUESTS_PATH, requestId));
  },

  async submitRequest(data: { name: string; email: string; payment_method: string; duration: number; proof_id?: string; platform?: string; proof_image?: string }) {
    return await addDoc(collection(db, REQUESTS_PATH), {
      ...data,
      status: 'pending',
      created_at: new Date().toISOString(),
      license_key: null
    });
  },

  async approveRequest(requestId: string, serial: string, platform: string, registeredTo: string) {
    const requestRef = doc(db, REQUESTS_PATH, requestId);
    const licenseRef = doc(db, COLLECTION_PATH, serial);
    await runTransaction(db, async transaction => {
      const request = await transaction.get(requestRef);
      const existingLicense = await transaction.get(licenseRef);
      if (!request.exists()) throw new Error('Purchase request no longer exists.');
      if (request.data().status === 'approved') {
        if (request.data().license_key === serial) return;
        throw new Error('This request was already approved. Refresh before continuing.');
      }
      if (existingLicense.exists()) throw new Error('This license key already exists. Generate a new key.');
      transaction.set(licenseRef, {
        serial, platform, status: 'pending', machine_id: '', activated_at: null,
        expires_at: null, registered_to: registeredTo, created_at: new Date().toISOString(),
        duration_months: request.data().duration || 12,
      });
      transaction.update(requestRef, {
        status: 'approved', license_key: serial, approved_at: new Date().toISOString(),
      });
    });
  },

  async declineRequest(requestId: string, reason: string) {
    const requestRef = doc(db, REQUESTS_PATH, requestId);
    await setDoc(requestRef, {
      status: 'declined',
      decline_reason: reason,
      declined_at: new Date().toISOString()
    }, { merge: true });
  },

  async checkRequestStatus(email: string, proofId: string) {
    try {
      // Looked up via a Cloud Function (admin privileges) instead of a
      // direct Firestore query — purchase_requests holds customer PII and
      // live license keys, so it is no longer publicly listable.
      const checkUrl = import.meta.env.VITE_CHECK_STATUS_URL || 'https://us-central1-formease-licensing.cloudfunctions.net/checkOrderStatus';
      const res = await fetch(checkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, proofId })
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []) as any[];
    } catch (e) {
      console.error("Failed to check status:", e);
      return [];
    }
  },

  async getAllTrials() {
    try {
      const q = query(collection(db, TRIALS_PATH));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          machine_id: data.machine_id || doc.id,
          started_at: parseFirestoreDate(data.started_at)?.toISOString() || null,
          platform: data.platform || 'windows'
        };
      });
    } catch (e) {
      console.error("Failed to get trials:", e);
      return [];
    }
  },

  async deleteTrial(trialId: string) {
    await deleteDoc(doc(db, TRIALS_PATH, trialId));
  },

  async getDownloadsInfo() {
    try {
      const docRef = doc(db, DOWNLOADS_DOC_PATH, 'latest');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return {
        win_url: '',
        mac_url: '',
        version: '1.0.49',
        notes: ''
      };
    } catch (e) {
      console.error("Failed to get downloads info:", e);
      return {
        win_url: '',
        mac_url: '',
        version: '1.0.49',
        notes: ''
      };
    }
  },

  async updateDownloadsInfo(info: { win_url: string; mac_url: string; version: string; notes: string }) {
    const docRef = doc(db, DOWNLOADS_DOC_PATH, 'latest');
    await setDoc(docRef, info, { merge: true });
  },

  // --- SYSTEM BROADCASTS & ANNOUNCEMENTS ---
  async getAllBroadcasts() {
    try {
      const q = query(collection(db, 'system_broadcasts'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          severity: data.severity || 'info',
          display_type: data.display_type || 'banner',
          action_label: data.action_label || '',
          action_url: data.action_url || '',
          is_active: data.is_active !== false,
          created_at: data.created_at || new Date().toISOString(),
          expires_at: data.expires_at || null,
          product: data.product || 'formease-pro',
        };
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return items;
    } catch (e) {
      console.error("Failed to get broadcasts:", e);
      return [];
    }
  },

  async createBroadcast(broadcast: {
    title: string;
    content: string;
    severity?: 'info' | 'warning' | 'urgent' | 'success';
    display_type?: 'banner' | 'modal';
    action_label?: string;
    action_url?: string;
    is_active?: boolean;
    expires_at?: string | null;
    product?: string;
  }) {
    const now = new Date();
    const docRef = doc(collection(db, 'system_broadcasts'));
    await setDoc(docRef, {
      title: broadcast.title.trim(),
      content: broadcast.content.trim(),
      severity: broadcast.severity || 'info',
      display_type: broadcast.display_type || 'banner',
      action_label: (broadcast.action_label || '').trim(),
      action_url: (broadcast.action_url || '').trim(),
      is_active: broadcast.is_active !== false,
      created_at: now.toISOString(),
      expires_at: broadcast.expires_at || null,
      product: broadcast.product || activeProduct,
    });
    return docRef.id;
  },

  async updateBroadcast(id: string, updates: Partial<{
    title: string;
    content: string;
    severity: 'info' | 'warning' | 'urgent' | 'success';
    display_type: 'banner' | 'modal';
    action_label: string;
    action_url: string;
    is_active: boolean;
    expires_at: string | null;
    product: string;
  }>) {
    const docRef = doc(db, 'system_broadcasts', id);
    await setDoc(docRef, updates, { merge: true });
  },

  async deleteBroadcast(id: string) {
    await deleteDoc(doc(db, 'system_broadcasts', id));
  },

  // --- CLIENT BUG & DIAGNOSTIC REPORTS ---
  async getAllDiagnosticReports() {
    try {
      const q = query(collection(db, 'diagnostic_reports'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ticket_id: data.ticket_id || docSnap.id,
          created_at: data.created_at || '',
          timestamp: data.timestamp || 0,
          app_version: data.app_version || '3.2.0',
          machine_id: data.machine_id || '',
          status: data.status || 'open',
          category: data.category || 'grade_sync',
          user_note: data.user_note || '',
          section_name: data.section_name || '',
          grade_level: data.grade_level || '',
          student_lrn: data.student_lrn || '',
          student_name: data.student_name || '',
          total_mismatches: data.total_mismatches ?? 0,
          sync_rate: data.sync_rate ?? 100,
          active_school_year: data.active_school_year || '',
          school: data.school || {},
          submitted_by: data.submitted_by || {},
          client_info: data.client_info || {},
          report_markdown: data.report_markdown || '',
          technical_details: data.technical_details || {}
        };
      });
    } catch (e) {
      console.error("Failed to get diagnostic reports:", e);
      return [];
    }
  },

  async updateDiagnosticReportStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved') {
    const docRef = doc(db, 'diagnostic_reports', ticketId);
    await setDoc(docRef, { status }, { merge: true });
  },

  async deleteDiagnosticReport(ticketId: string) {
    await deleteDoc(doc(db, 'diagnostic_reports', ticketId));
  }
};

