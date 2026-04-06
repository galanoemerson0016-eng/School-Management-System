import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, initializeFirestore } from "firebase/firestore";

// Hardcoded config to avoid dotenv issues
const firebaseConfig = {
    apiKey: "AIzaSyBTJg6gPNE4-Q_eanL_qz_OfsfIfqiK_j4",
    authDomain: "school-management-system-chs.firebaseapp.com",
    projectId: "school-management-system-chs",
    storageBucket: "school-management-system-chs.firebasestorage.app",
    messagingSenderId: "853915272444",
    appId: "1:853915272444:web:8655477672cf4665ff4379",
    measurementId: "G-YGTN8C010V"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

// --- DATA ---

const defaultSchoolProfile = {
    school_id: '123456',
    name: 'Sample Elementary School',
    region: 'Region IV-A',
    division: 'Division of Cavite',
    district: 'District I',
    head_name: 'Juan A. Dela Cruz',
    head_position: 'OIC-School Head, HT-VI',
    grade_levels_offered: 'Grade 7-12',
};

const defaultSubjects = [
    // ===== Grade 7 Subjects =====
    { id: 'g7-filipino', subject_name: 'Filipino', grade_level: 'Grade 7' },
    { id: 'g7-english', subject_name: 'English', grade_level: 'Grade 7' },
    { id: 'g7-math', subject_name: 'Mathematics', grade_level: 'Grade 7' },
    { id: 'g7-science', subject_name: 'Science', grade_level: 'Grade 7' },
    { id: 'g7-ap', subject_name: 'Araling Panlipunan', grade_level: 'Grade 7' },
    { id: 'g7-values', subject_name: 'Values Education', grade_level: 'Grade 7' },
    { id: 'g7-tle', subject_name: 'Technology and Livelihood Education', grade_level: 'Grade 7' },
    { id: 'g7-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 7' },
    { id: 'g7-music-arts', subject_name: 'Music and Arts', subject_code: 'MAPEH', grade_level: 'Grade 7' },
    { id: 'g7-pe-health', subject_name: 'Physical Education and Health', subject_code: 'MAPEH', grade_level: 'Grade 7' },

    // ===== Grade 8 Subjects =====
    { id: 'g8-filipino', subject_name: 'Filipino', grade_level: 'Grade 8' },
    { id: 'g8-english', subject_name: 'English', grade_level: 'Grade 8' },
    { id: 'g8-math', subject_name: 'Mathematics', grade_level: 'Grade 8' },
    { id: 'g8-science', subject_name: 'Science', grade_level: 'Grade 8' },
    { id: 'g8-ap', subject_name: 'Araling Panlipunan', grade_level: 'Grade 8' },
    { id: 'g8-values', subject_name: 'Values Education', grade_level: 'Grade 8' },
    { id: 'g8-tle', subject_name: 'Technology and Livelihood Education', grade_level: 'Grade 8' },
    { id: 'g8-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 8' },
    { id: 'g8-music-arts', subject_name: 'Music and Arts', subject_code: 'MAPEH', grade_level: 'Grade 8' },
    { id: 'g8-pe-health', subject_name: 'Physical Education and Health', subject_code: 'MAPEH', grade_level: 'Grade 8' },
];

const defaultSections = [
    { id: 'sec-g7-einstein', section_name: 'Einstein', section_grade_level: 'Grade 7', section_room: 'Room 101' },
    { id: 'sec-g8-curie', section_name: 'Curie', section_grade_level: 'Grade 8', section_room: 'Room 102' },
    { id: 'sec-g9-newton', section_name: 'Newton', section_grade_level: 'Grade 9', section_room: 'Room 103' },
    { id: 'sec-g10-darwin', section_name: 'Darwin', section_grade_level: 'Grade 10', section_room: 'Room 104' },
];

const defaultStudents = [
    // Grade 7 Students
    { lrn: '100000000001', first_name: 'Juan', last_name: 'Dela Cruz', middle_name: 'Santos', gender: 'Male', birthday: '2012-05-15', age: 12, address: '123 Rizal St., Cavite City', grade_level: 'Grade 7', student_section: 'Einstein' },
    { lrn: '100000000002', first_name: 'Maria', last_name: 'Santos', middle_name: 'Reyes', gender: 'Female', birthday: '2012-08-20', age: 12, address: '456 Bonifacio St., Cavite City', grade_level: 'Grade 7', student_section: 'Einstein' },
    { lrn: '100000000003', first_name: 'Pedro', last_name: 'Reyes', middle_name: 'Garcia', gender: 'Male', birthday: '2012-03-10', age: 12, address: '789 Mabini St., Cavite City', grade_level: 'Grade 7', student_section: 'Einstein' },
];

const defaultClassRecords = [
    // Filipino - All 4 quarters
    { id: 'cr-1', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-filipino', school_year: '2025-2026', quarter: 1, written_works: [18, 17, 19, 16, 18, 15, 17, 18, 16, 19], performance_tasks: [18, 19, 17, 18, 16, 19, 17, 18, 16, 17], quarterly_exam: 42, final_grade: 87 },
    { id: 'cr-2', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-filipino', school_year: '2025-2026', quarter: 2, written_works: [17, 18, 16, 17, 19, 18, 16, 17, 18, 16], performance_tasks: [17, 18, 19, 16, 17, 18, 19, 16, 17, 18], quarterly_exam: 44, final_grade: 88 },
];

const defaultObservedValues = [
    // Quarter 1
    { id: 'ov-q1', student_lrn: '100000000001', school_year: '2025-2026', quarter: 1, values: { 'MAKA-DIYOS_0': 'AO', 'MAKA-DIYOS_1': 'AO', 'MAKATAO_0': 'SO', 'MAKATAO_1': 'AO', 'MAKA KALIKASAN_0': 'AO', 'MAKABANSA_0': 'AO', 'MAKABANSA_1': 'SO' } },
];

// --- MIGRATION LOGIC ---

async function main() {
    console.log("🚀 Starting Node.js Migration...");

    try {
        console.log("Seeding School Profile...");
        await setDoc(doc(db, 'settings', 'schoolProfile'), defaultSchoolProfile);

        console.log(`Seeding ${defaultSubjects.length} Subjects...`);
        for (const subj of defaultSubjects) {
            await setDoc(doc(db, 'subjects', subj.id), subj);
        }

        console.log(`Seeding ${defaultSections.length} Sections...`);
        for (const sec of defaultSections) {
            await setDoc(doc(db, 'sections', sec.id), sec);
        }

        console.log(`Seeding ${defaultStudents.length} Students...`);
        for (const stud of defaultStudents) {
            await setDoc(doc(db, 'students', stud.lrn), stud);
        }

        console.log(`Seeding ${defaultClassRecords.length} Grades (Partial)...`);
        for (const rec of defaultClassRecords) {
            await setDoc(doc(db, 'grades', rec.id), rec);
        }

        console.log(`Seeding ${defaultObservedValues.length} Observed Values...`);
        for (const val of defaultObservedValues) {
            await setDoc(doc(db, 'observedValues', val.id), val);
        }

        console.log("✅ Migration Complete!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Migration Failed:", e);
        process.exit(1);
    }
}

main();
