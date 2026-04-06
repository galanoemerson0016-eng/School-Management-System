import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import {
    defaultSchoolProfile,
    defaultSubjects,
    defaultSections,
    defaultStudents,
    defaultClassRecords,
    defaultObservedValues
} from '../lib/initial-data';

export default function DataSeeder() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const seedData = async () => {
        if (!confirm('This will overwrite existing data in Firestore. Continue?')) return;

        setLoading(true);
        setStatus('Starting migration... Check Console (F12) for details.');
        console.log("--- STARTING MIGRATION ---");

        try {
            // 0. Connectivity Test
            setStatus('Testing Firestore Connection...');
            console.log("Step 0: Testing connection to 'test/ping'...");
            try {
                await setDoc(doc(db, 'test', 'ping'), {
                    timestamp: new Date(),
                    userAgent: navigator.userAgent
                });
                console.log("✅ Step 0: Connection successful.");
            } catch (pingError) {
                console.error("❌ Step 0 Failed: Connection blocked or rules denied.", pingError);
                throw new Error("Could not connect to Firestore. Check your Internet, Firewall, or Rules.");
            }

            // 1. School Profile (Single Doc)
            setStatus('Seeding School Profile...');
            console.log("Step 1: Seeding School Profile...");
            await setDoc(doc(db, 'settings', 'schoolProfile'), defaultSchoolProfile);
            console.log("✅ Step 1 Done.");

            // 2. Subjects
            setStatus(`Seeding ${defaultSubjects.length} Subjects...`);
            // Batch writes (limit 500 ops per batch)
            // Ideally we should use batch but for simplicity in this seed script we loop await setDoc
            // or we use multiple batches if data is large.
            // Given the small size, we can iterate.
            console.log("Step 2: Seeding Subjects...");
            for (const subj of defaultSubjects) {
                console.log(`  - Writing Subject: ${subj.id}`);
                await setDoc(doc(db, 'subjects', subj.id), subj);
            }
            console.log("✅ Step 2 Done.");

            // 3. Sections
            setStatus(`Seeding ${defaultSections.length} Sections...`);
            console.log("Step 3: Seeding Sections...");
            for (const sec of defaultSections) {
                console.log(`  - Writing Section: ${sec.id}`);
                await setDoc(doc(db, 'sections', sec.id), sec);
            }
            console.log("✅ Step 3 Done.");

            // 4. Students
            setStatus(`Seeding ${defaultStudents.length} Students...`);
            console.log("Step 4: Seeding Students...");
            for (const stud of defaultStudents) {
                console.log(`  - Writing Student: ${stud.lrn}`);
                await setDoc(doc(db, 'students', stud.lrn), stud);
            }
            console.log("✅ Step 4 Done.");

            // 5. Class Records (Grades)
            setStatus(`Seeding ${defaultClassRecords.length} Grades (this might take a while)...`);
            console.log("Step 5: Seeding Grades...");
            let count = 0;
            for (const rec of defaultClassRecords) {
                count++;
                if (count % 10 === 0) console.log(`  - Writing Grade ${count}/${defaultClassRecords.length}`);
                await setDoc(doc(db, 'grades', rec.id), rec);
            }
            console.log("✅ Step 5 Done.");

            // 6. Observed Values
            setStatus('Seeding Observed Values...');
            console.log("Step 6: Seeding Values...");
            for (const val of defaultObservedValues) {
                await setDoc(doc(db, 'observedValues', val.id), val);
            }
            console.log("✅ Step 6 Done.");

            setStatus('Migration Complete! ✅');
            console.log("--- MIGRATION COMPLETE ---");
        } catch (error) {
            console.error("🔥 MIGRATION FAILED:", error);
            setStatus('Error: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-white border rounded shadow-lg">
            <h3 className="mb-2 font-bold text-gray-800">🔥 Firebase Migration</h3>
            {status && <p className="mb-2 text-xs text-gray-600">{status}</p>}
            <button
                onClick={seedData}
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-orange-500 rounded hover:bg-orange-600 disabled:opacity-50"
            >
                {loading ? 'Migrating...' : 'Start Migration'}
            </button>
        </div>
    );
}
