import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

const COLLECTION_PATH = 'artifacts/g7-special/public/data/licenses';

export const licenseService = {
  async getAllLicenses() {
    const q = query(collection(db, COLLECTION_PATH), orderBy('expires_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createLicense(serial: string, batchId: string = '', durationMonths: number = 12) {
    const now = new Date();
    const expiresAt = new Date();
    
    if (durationMonths === -1) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 99); // "Lifetime"
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
    }

    await setDoc(doc(db, COLLECTION_PATH, serial), {
      serial,
      status: 'pending',
      machine_id: '',
      activated_at: null,
      registered_to: null,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
      batch_id: batchId,
      duration_months: durationMonths
    });
  },

  async bulkCreate(serials: string[], batchId: string = '', durationMonths: number = 12) {
    const batch = writeBatch(db);
    const now = new Date();
    const expiresAt = new Date();
    
    if (durationMonths === -1) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 99);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
    }

    serials.forEach(serial => {
      const docRef = doc(db, COLLECTION_PATH, serial);
      batch.set(docRef, {
        serial,
        status: 'pending',
        machine_id: '',
        activated_at: null,
        registered_to: null,
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
        batch_id: batchId,
        duration_months: durationMonths
      });
    });

    await batch.commit();
  },

  async resetLicense(serial: string) {
    const docRef = doc(db, COLLECTION_PATH, serial);
    await setDoc(docRef, {
      status: 'pending',
      machine_id: '',
      activated_at: null,
    }, { merge: true });
  },

  async revokeLicense(serial: string) {
    await deleteDoc(doc(db, COLLECTION_PATH, serial));
  }
};
