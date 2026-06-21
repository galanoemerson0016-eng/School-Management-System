export interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

export const TERMS_AND_CONDITIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: [
      "By installing, copying, activating, or otherwise using FormEase Pro (the \"Software\"), you agree to be bound by these Terms and Conditions.",
      "If you do not agree to these terms, do not install or use the Software.",
      "These terms apply to all educators, school coordinators, administrators, and institutions who purchase, activate, or utilize the Software."
    ]
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: [
      "FormEase Pro is a native desktop-based School Management System (SMS) built with Electron and React.",
      "The Software provides offline-first tools to manage student profiles, advisory sections, daily attendance records (SF2), grading sheets (E-Class Records), and automated generation of Department of Education (DepEd) school forms including SF1, SF2, SF5, SF6, SF8, SF9 (Report Cards), and SF10 (Permanent Records).",
      "All automated forms, calculations, and templates are designed to align with official DepEd guidelines. However, these outputs are tools to assist educators—they do not replace professional verification and judgment."
    ]
  },
  {
    id: "licensing",
    title: "3. Product Activation & Licensing",
    content: [
      "Access to the Software requires a valid product license key. Each license is bound to a unique hardware profile (Machine ID) and operating system platform.",
      "Bypassing license verification, using unauthorized activation mechanisms, sharing activation keys with unregistered users, or attempting to reverse-engineer the licensing code is strictly prohibited.",
      "We reserve the right to deactivate or blacklist license keys associated with fraudulent activity, duplicate registrations, or breach of these terms."
    ]
  },
  {
    id: "data-ownership",
    title: "4. Data Ownership & Local Storage",
    content: [
      "FormEase Pro operates on an offline-first architecture. All student profiles, LRNs, grades, attendance sheets, and school records are stored locally within the application's internal database (IndexedDB) on your personal device.",
      "You retain absolute ownership of all input data. We do not host, store, or have access to your database or student records on our servers.",
      "You are solely responsible for maintaining, securing, and backing up your local database files. FormEase Pro and its developer shall not be held liable for any data loss resulting from hardware failure, operating system corruption, accidental deletion, or software uninstallation."
    ]
  },
  {
    id: "cloud-sync",
    title: "5. Google Drive Synchronization",
    content: [
      "The Software provides an optional cloud synchronization and backup feature using Google Drive.",
      "This integration establishes a direct, peer-to-peer connection between your local desktop client and your personal Google Drive account via secure Google APIs (Google OAuth).",
      "FormEase Pro does not act as an intermediary server. We do not transmit, view, store, or share your Google login credentials, OAuth tokens, or backed-up database files. All synchronized files remain strictly within your personal Google account."
    ]
  },
  {
    id: "intellectual-property",
    title: "6. Intellectual Property",
    content: [
      "FormEase Pro, including its source code, design layout, assets, user interfaces, branding, and licensing system, is the exclusive intellectual property of Emerson M. Galano.",
      "You are granted a non-exclusive, non-transferable, revocable license to run the Software on supported personal computers according to your purchase terms.",
      "You may not copy, modify, distribute, resell, lease, rent, or create derivative works based on the Software without prior written consent from the developer."
    ]
  },
  {
    id: "acceptable-use",
    title: "7. Acceptable Use & Regulatory Compliance",
    content: [
      "You agree to use the Software solely for lawful educational purposes and in accordance with your school district's guidelines and the Department of Education (DepEd) policy statements.",
      "As student data is protected by law, you are responsible for ensuring that your collection, entry, and processing of student data comply with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines."
    ]
  },
  {
    id: "disclaimer",
    title: "8. Disclaimer of Warranties",
    content: [
      "FormEase Pro is provided on an \"as is\" and \"as available\" basis without warranties of any kind, whether express or implied.",
      "While the developer takes extreme care to ensure the accuracy of formulas, calculations, and school forms generation, we do not warrant that the Software will be completely error-free, uninterrupted, or perfectly accurate in every scenario.",
      "Educators are urged to cross-reference and verify all computed grades, attendance totals, and school forms before official submission or distribution to parents."
    ]
  },
  {
    id: "limitation-liability",
    title: "9. Limitation of Liability",
    content: [
      "To the maximum extent permitted by applicable law, FormEase Pro and its developer, Emerson M. Galano, shall not be liable for any indirect, incidental, consequential, special, or punitive damages.",
      "This includes, but is not limited to, damages for loss of profits, loss of student data, grading discrepancies, administrative penalties, or system downtime arising out of the use or inability to use the Software.",
      "In no event shall total liability for any claims exceed the fee paid by you for the active license key in the 12 months preceding the incident."
    ]
  },
  {
    id: "governing-law",
    title: "10. Governing Law & Dispute Resolution",
    content: [
      "These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of the Philippines.",
      "Any disputes or issues arising from these terms that cannot be settled amicably shall be brought exclusively before the competent courts of the Philippines."
    ]
  },
  {
    id: "changes-terms",
    title: "11. Changes to These Terms",
    content: [
      "We reserve the right to update or modify these Terms and Conditions at any time. The \"Last Updated\" date at the top of the terms will reflect the date of the latest revision.",
      "Your continued use of the Software following any changes constitutes your binding acceptance of the updated Terms and Conditions."
    ]
  },
  {
    id: "contact",
    title: "12. Contact Information",
    content: [
      "For licensing inquiries, billing questions, technical support, or feedback, you can reach out directly via:",
      "• Email: galanoemerson0014@gmail.com",
      "• Facebook support: https://www.facebook.com/xshame14/",
      "• Website: https://form-ease-app.web.app/"
    ]
  }
];

export const PRIVACY_POLICY: LegalSection[] = [
  {
    id: "intro",
    title: "1. Introduction",
    content: [
      "FormEase Pro (\"we\", \"us\", or \"our\") respects your privacy and is dedicated to securing the personal data of educators and students.",
      "This Privacy Policy outlines how the Software collects, handles, stores, and safeguards information, ensuring complete transparency and compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines."
    ]
  },
  {
    id: "controller",
    title: "2. Data Control & Ownership",
    content: [
      "For the purposes of the Data Privacy Act of 2012, you (the educator) or your school/institution act as the Data Controller for all student records, grades, and attendance data entered into the Software.",
      "FormEase Pro operates as a native offline utility and does not collect, store, transmit, or process student records on external servers.",
      "All student names, LRNs, grades, and school forms remain strictly local to your device and are processed under your authority."
    ]
  },
  {
    id: "collection",
    title: "3. Information We Process",
    content: [
      "We process the following categories of information:",
      "1. License Activation Data: When you activate the Software, we collect your product license key, name (adviser name), and a unique hardware fingerprint (Machine ID). This is transmitted to our secure Firebase licensing database to bind and validate your product registration.",
      "2. Student Academic Data (Local Only): The student records, attendance logs, and grade entries you input are saved locally on your device (IndexedDB). This data is never sent to our servers.",
      "3. Google Drive Sync Data (Local/User-controlled Only): If you choose to enable Google Drive sync, the app requests permission to read and write backup files in your drive. This interaction is direct and local. We do not store or see your OAuth credentials or backup files."
    ]
  },
  {
    id: "data-sharing",
    title: "4. Data Sharing & Disclosure",
    content: [
      "We do not sell, lease, or share personal data with third parties.",
      "Because all academic records are stored locally on your machine, it is impossible for us to disclose student data to third parties. License registry information is kept confidential and is accessed only for validation and support purposes."
    ]
  },
  {
    id: "data-security",
    title: "5. Data Security Measures",
    content: [
      "We implement industry-standard security practices to safeguard data transmission during activation and update checks.",
      "Local Security: All database files are stored in your device's local application data folder. You are responsible for maintaining hardware-level security, including strong operating system passwords and drive encryption, to protect student records from physical or unauthorized local access."
    ]
  },
  {
    id: "children-privacy",
    title: "6. Children's Privacy",
    content: [
      "The Software is designed for use by professional educators and school administrators.",
      "We do not knowingly collect personal data from children under the age of 18. Any student personal data saved within the Software is inputted by the educator under the authority and consent procedures of their respective academic institution."
    ]
  },
  {
    id: "user-rights",
    title: "7. Your Rights under RA 10173",
    content: [
      "Under the Data Privacy Act of 2012, users have the right to access, correct, block, or delete their personal data.",
      "Because your school database is local, you have immediate access to exercise these rights. You can edit, search, export, or permanently purge student profiles, grades, and logs directly from the application UI.",
      "Uninstalling the Software will erase the local application data directory containing the IndexedDB database files."
    ]
  },
  {
    id: "policy-changes",
    title: "8. Changes to This Privacy Policy",
    content: [
      "We may update this Privacy Policy from time to time to accommodate new features, security updates, or changes in regulatory compliance.",
      "Any updates will be posted inside the Software with a revised \"Last Updated\" date.",
      "Your continued use of the Software after updates constitute your acceptance of the revised policy."
    ]
  },
  {
    id: "contact-privacy",
    title: "9. Contact Us",
    content: [
      "If you have any questions or concerns regarding this Privacy Policy, your data privacy rights, or how FormEase Pro manages activation records, please contact us:",
      "• Email: galanoemerson0014@gmail.com",
      "• Support Chat: https://www.facebook.com/xshame14/"
    ]
  }
];
