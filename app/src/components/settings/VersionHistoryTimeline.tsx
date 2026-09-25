import React from 'react';
import { History } from 'lucide-react';

interface VersionHistoryTimelineProps {
    onCheckForUpdates?: () => void;
}

export function VersionHistoryTimeline({ onCheckForUpdates }: VersionHistoryTimelineProps) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                        <History className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Historical Release Changelog</h3>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">Complete record of previous versions, updates, and bug fixes.</p>
                    </div>
                </div>
                {onCheckForUpdates && (
                    <button
                        onClick={onCheckForUpdates}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                    >
                        Check for Updates
                    </button>
                )}
            </div>

            <div className="relative max-h-150 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-6 relative pl-3 border-l-2 border-slate-100 dark:border-white/5 ml-2.5">
                                {/* Version 3.5.19 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.19</span>
                                        <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5">Latest Production</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 25, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🛡️ <strong>Data Integrity Recovery</strong>: Removed unsafe startup filters and deletion paths for legitimate learners, sections, and grades.</li>
                                        <li>💾 <strong>Verified v3.5.17 Backup Recovery</strong>: Offers an explicit restore only for checksum-verified pre-update backups.</li>
                                        <li>📚 <strong>Temporary Grade Retention</strong>: Backups preserve temporary grade records for review instead of omitting them.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.17 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.17</span>
                                        <span className="rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider px-2 py-0.5">Previous Production</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 21, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>⚡ <strong>Automated Startup Database Healing</strong>: Scans IndexedDB on launch, recalculating legacy unnormalized weights (&gt; 120) and restoring genuine DepEd grades with zero manual re-encoding.</li>
                                        <li>🎯 <strong>Weight Normalization Engine</strong>: Converted whole weights (40, 60, 20) to standard decimal fractions (0.40, 0.60, 0.20) and table headers to standard percentages (40%), eliminating thousands-scale weighted scores and the 4000% header bug.</li>
                                        <li>🛡️ <strong>Ghost Record Suppression</strong>: Score container verification ensures empty raw score arrays never produce phantom grades.</li>
                                        <li>📋 <strong>DepEd SF9 Dynamic Specialization Cleanliness</strong>: Streamlined SF9 Learner's Progress Report for Elementary and Junior High School (Grades 1–10) by dynamically omitting SHS-only Track and Strand fields.</li>
                                        <li>🔒 <strong>Production Section Security Guard</strong>: Isolated mock test section generators strictly to development environments (<code>import.meta.env.DEV</code>), preventing mock test sections from populating production school profiles.</li>
                                        <li>📊 <strong>Official Excel Template &amp; Formula Preservation</strong>: 100% native DepEd formula integrity across SF9, SHS G12, and SSHS Pilot.</li>
                                        <li>🔒 <strong>Zero Data Loss Guarantee</strong>: 100% backward-compatible update preserving all client records and profiles in IndexedDB.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.16 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-[#0d1225]" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.16</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 19, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🎨 <strong>Official FormEase Pro Default Branding</strong>: Replaced all default school logo placeholders with the official FormEase Pro logo (<code>app-logo.png</code>).</li>
                                        <li>🛡️ <strong>Zero-Crash Production Boot Shield</strong>: Bundler optimization eliminates artificial vendor chunk splits, guaranteeing crash-free immediate launch.</li>
                                        <li>⚡ <strong>Multi-Section Subject Deduplication &amp; Scope Architecture</strong>: Unified subject presentation to prevent artificial duplicates across advisory and handled sections, displaying clear section badges and accurate cross-section learner counts.</li>
                                        <li>🛡️ <strong>Automated Startup Database Healing</strong>: Scans IndexedDB on app launch, recalculating legacy unnormalized weights (&gt; 120) and restoring genuine DepEd grades with zero teacher re-encoding.</li>
                                        <li>🎯 <strong>Weight Normalization Engine</strong>: Converted whole weights (40, 60, 20) to standard fractions (0.40, 0.60, 0.20) and display percentages (40%), eliminating thousands-scale weighted scores and the 4000% header bug.</li>
                                        <li>🔒 <strong>Zero Data Loss Guarantee</strong>: 100% backward-compatible update preserving all client records and profiles in IndexedDB.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.15 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-[#0d1225]" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.15</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 19, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>⚡ <strong>Multi-Section Subject Deduplication &amp; Scope Architecture</strong>: Unified subject presentation to prevent artificial duplicates across advisory and handled sections, displaying clear section badges and accurate cross-section learner counts.</li>
                                        <li>🛡️ <strong>Automated Startup Database Healing</strong>: Scans IndexedDB on app launch, recalculating legacy unnormalized weights (&gt; 120) and restoring genuine DepEd grades with zero teacher re-encoding.</li>
                                        <li>🎯 <strong>Weight Normalization Engine</strong>: Converted whole weights (40, 60, 20) to standard fractions (0.40, 0.60, 0.20) and display percentages (40%), eliminating thousands-scale weighted scores and the 4000% header bug.</li>
                                        <li>✨ <strong>Grading Table Crosshair &amp; Focus Authority</strong>: Enhanced input responsiveness, resilient cell navigation, and automatic guide alignment across all grading tables.</li>
                                        <li>🔒 <strong>Zero Data Loss Guarantee</strong>: 100% backward-compatible update preserving all client records and profiles in IndexedDB.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.14 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-[#0d1225]" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.14</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 17, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>⚡ <strong>Automated Startup Database Healing</strong>: Scans IndexedDB on app launch, recalculating legacy unnormalized weights (&gt; 120) and restoring genuine DepEd grades with zero teacher re-encoding.</li>
                                        <li>🎯 <strong>Weight Normalization Engine</strong>: Converted whole weights (40, 60, 20) to standard fractions (0.40, 0.60, 0.20) and display percentages (40%), eliminating thousands-scale weighted scores and the 4000% header bug.</li>
                                        <li>🛡️ <strong>Ghost Record Suppression</strong>: Verifies score containers in resolveStudentQuarterGrade ensuring empty score arrays never output phantom 100 grades in SF9, SF10, or Consolidated Grades.</li>
                                        <li>📊 <strong>Grade 11 SF9 Excel &amp; PDF Export Resilience</strong>: Fixed style index boundaries and shared formulas in sheet6.xml for clean export without Excel repair warnings.</li>
                                        <li>🔒 <strong>Zero Data Loss Guarantee</strong>: 100% backward-compatible update preserving all client records and profiles in IndexedDB.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.9 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-[#0d1225]" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.9</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 15, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🎓 <strong>Official DepEd DO 8, s. 2015 Grade 12 Categorization</strong>: Fully aligned traditional Senior High School subject categories into Core Subjects (Universal), Applied Subjects, Strand-Specific Specialized Subjects (GAS, ABM, STEM, HUMSS, TVL, Sports, Arts), and Work Immersion / Culminating Activity.</li>
                                        <li>🚫 <strong>Eliminated Misapplied SSHS Clusters</strong>: Removed incorrect SSHS cluster categories (such as <em>"General Academic Elective"</em>, <em>"Arts, Social Sciences, and Humanities"</em>, <em>"Field Experience"</em>) from Grade 12 Traditional K-12 section creation and teaching load panels.</li>
                                        <li>⚡ <strong>Grade 12 GAS & TVL 3-Term Official Presets</strong>: Added full DepEd 12-subject trimester presets for General Academic Strand (GAS) and Technical-Vocational-Livelihood (TVL) tracks with balanced 4-subject per term distributions.</li>
                                        <li>🛡️ <strong>Universal Core Subject Accuracy</strong>: Fully recognized all 18 DepEd Core subjects (including HOPE 1–4, PE & Health 1–4, DRRR, Earth & Life, Philosophy) preventing accidental misclassification into electives.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.8 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-[#0d1225]" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.8</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 15, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🎓 <strong>Senior High School Track & Strand Scoping</strong>: Eliminated the 105-subject overload in section creation. Selecting Grade 12 (e.g. ABM, STEM, HUMSS, TVL) automatically presents only Core, Applied, and Strand-specific specialized subjects.</li>
                                        <li>✨ <strong>Official DepEd 12-Subject Preset Auto-Application</strong>: Creating or configuring Grade 12 sections automatically loads the official DepEd 12-subject trimester model (T1, T2, T3) instead of dumping un-filtered database records.</li>
                                        <li>🧹 <strong>Dedicated "Clear All" & Quick Selection Controls</strong>: Added 1-click Clear All in the curriculum header and a quick toolbar (Select All / Clear All) in the Catalog Checklist, with an explicit cleared state guard to prevent unintended subject resets.</li>
                                        <li>🛡️ <strong>Grade 11 SSHS DepEd Order No. 017, s. 2026 Conformance</strong>: Grade 11 strictly presents SSHS Core and Academic/TechPro cluster electives, completely isolating old K-12 offerings.</li>
                                        <li>🚀 <strong>Clean Setup Assurance</strong>: Verified removal of sample records on clean client installs.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.7 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-[#0d1225]" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.7</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 15, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>⚡ <strong>Self-Healing Grade Reconciliation Engine</strong>: Automatic startup scanning that detects duplicate or legacy GMRC and Values Education entries, consolidates them seamlessly, re-maps associated grades, and unhides all client records with zero data loss.</li>
                                        <li>📚 <strong>Curriculum-Compliant GMRC & Values Education Separation</strong>: Strict DepEd curriculum distinction ensuring Elementary (Grades 1–6) exclusively uses "GMRC (Good Manners and Right Conduct)" and Junior High School (Grades 7–10) exclusively uses "Values Education".</li>
                                        <li>📊 <strong>Official Excel Template & OpenXML Formula Integrity</strong>: Validated and preserved native DepEd formulas across Senior High School Grade 12 3-Term ECR, SSHS Pilot ECR, ECR Academic G2–G10, Grade 1 PACE/SF9, and SF9 Grade 11 Academic & Tech-Pro templates.</li>
                                        <li>🎯 <strong>Section-Isolated Highest Possible Score (HPS)</strong>: Independent HPS assignment per section, ensuring complete flexibility across classes without cross-contamination.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.6 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.6</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 15, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🛡️ <strong>Pre-Update Safety Vault Engine</strong>: Automated comprehensive offline backup vault preserving complete Excel & PDF archives of SF2, SF5, SF6, SF9, and ECR class records before any updates.</li>
                                        <li>🖨️ <strong>Grade 1 PACE Form 4-Page Print Fidelity</strong>: Exact 4-page print setup preservation and blank-guarded VLOOKUP formulas preventing 0 ratings on unencoded competencies.</li>
                                        <li>🎯 <strong>Section-Isolated Highest Possible Score (HPS)</strong>: Independent HPS assignment per section, ensuring complete flexibility across classes without cross-contamination.</li>
                                        <li>⚡ <strong>Automated Grade Reconciliation</strong>: Startup reconciliation engine scanning local databases on app launch, reconnecting orphaned records, unhiding Elementary/JHS subjects, and restoring PE & Health dual components.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.5 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.5</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🛡️ <strong>Raw Score Persistence Engine</strong>: Permanently eliminated score loss and reversion across GMRC, Values Education, Makabansa, Language, Reading & Literacy, and EPP/TLE on page navigation.</li>
                                        <li>💾 <strong>DebouncedInput Safe Flush</strong>: Guaranteed automatic saving of all active cell inputs on component unmount, field blur, and tab/section transitions.</li>
                                        <li>📊 <strong>SF9 Multi-Level Excel Outlines</strong>: Restored native Excel outline groupings, hierarchical collapse controls, and clean XML quote encoding across all grade levels.</li>
                                        <li>🎂 <strong>Dynamic Birthdate-Driven Age</strong>: Automated age derivation on SF9 summary sheets utilizing standard DepEd formula references.</li>
                                        <li>📈 <strong>DepEd Formula Integrity</strong>: Restored Term 2 MAPEH formula calculations, School ID formula references (F15), and clean blank cells for unencoded grades.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.4 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.4</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>💾 <strong>Grade Management Live Save Persistence</strong>: Input debounce reduced to 400ms with automatic flush on component unmount, field blur, and page navigation, permanently eliminating lost grade entries.</li>
                                        <li>📚 <strong>DepEd Order 17 s. 2026 SSHS Electives Classification</strong>: Physical Education 1 & 2 correctly designated as electives, unblocking all 80 Academic and 48 Tech-Pro elective choices during section offering imports.</li>
                                        <li>🔗 <strong>Composite Subject Resolution & ECR Sync Protection</strong>: Accurate grouping and ID sync for Effective Communication / Mabisang Komunikasyon, safeguarding manual grades from being overwritten during E-Class Record sync.</li>
                                        <li>📄 <strong>SF9 Multi-Level Learning Area Fallbacks</strong>: Enhanced composite and component subject name matching across SF9 report cards and SF10 permanent records.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.3</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🖼️ <strong>Base64 Data URL Image Resolution for React-PDF</strong>: Automated Base64 Data URL conversion for local image assets in Node.js test environments, completely eliminating <code>fetch failed</code> warnings in Vitest.</li>
                                        <li>🧹 <strong>ESLint Code Compliance</strong>: Conformed caught error variable names (<code>_e</code>) to strict ESLint <code>/^_/u</code> rule standards across PDF renderer utility methods.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🎓 <strong>Grade 11 SSHS Academic SF9 Multi-Level Renderer</strong>: Complete layout alignment with official DepEd Grade 11 Academic SF9 format, including 39-unit curriculum rules (6 units Core, 3 units Electives).</li>
                                        <li>🎨 <strong>Elective Term Shading & Grade Suppression</strong>: Non-offered elective terms render with solid neutral gray (<code>#A6A6A6</code>) shading and zero grade text. Single-term electives compute Final Grade directly from the offered term score.</li>
                                        <li>📄 <strong>Strict 1-Page Landscape Layout Budget</strong>: Compacted layout budget ensuring zero vertical spillover to Page 2 across A4 and Letter landscape formats.</li>
                                        <li>🏛️ <strong>Dynamic Schools Division Header</strong>: Formatted as <code>SCHOOLS DIVISION OF ...</code> or fallback <code>SCHOOLS DIVISION OF _____</code> when blank.</li>
                                        <li>🎂 <strong>Automated Age Calculation & #VALUE! / ##### Elimination</strong>: Robust birthdate parsing and dynamic age derivation across both React-PDF renderer and Excel exports.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 13, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>📊 <strong>Summary of Grades Term Shading (SHS G11)</strong>: Automated visual graying out of unoffered terms for academic electives in SHS Grade 11 with clean em-dash markers and zero false incomplete grade flags.</li>
                                        <li>📄 <strong>Grade 1 PACE Form Master Excel Setup</strong>: Complete 17-sheet master workbook generation with strict 4-page print layout and single-subject PACE form isolation.</li>
                                        <li>🛡️ <strong>3-Tier Ghost & Duplicate Subject Prevention</strong>: Intelligent deduplication protecting TVL/SHS parenthetical specializations while preventing duplicate subject entries.</li>
                                        <li>📖 <strong>SF9 Booklet (Template 2) Live Synchronization</strong>: Seamless live grade and subject synchronization for Grade 1 MATATAG and SHS Grade 11 in 2-page duplex booklets.</li>
                                        <li>💾 <strong>Comprehensive Master Backups & OpenXML Repair</strong>: High-fidelity OpenXML repair ensuring smooth Excel export without formula calculation errors or corruption.</li>
                                    </ul>
                                </div>

                                {/* Version 3.5.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 11, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>📖 <strong>Double-Sided SF9 Booklet (Template 2)</strong>: High-fidelity 2-up front-and-back printable booklet with automatic cut guides, page-flipping duplex symmetry, and strict 2-page pagination on A4 and Letter.</li>
                                        <li>🎨 <strong>SF10 Customization & Dynamic Layout Engine</strong>: Added Subject Customization and Layout management modal allowing educators to reorder subjects, define custom learning areas, and edit historical grade entries.</li>
                                        <li>🎓 <strong>Senior High School Grade 12 Cross-Curricular SF9</strong>: Integrated official DepEd SF9 templates and export pipelines for Grade 12 Academic and TechPro tracks with Cross-School subject support.</li>
                                        <li>📋 <strong>Teaching Load Matrix & Live Advisory Sync</strong>: Added dedicated Teaching Load Matrix management modal for advisory sections, enabling live multi-subject assignment, STE curriculum filtering, and automated two-way synchronization with ECR.</li>
                                        <li>💾 <strong>Master Excel Automated Database Backup</strong>: One-click comprehensive multi-sheet Excel workbook generator encapsulating all student profiles, class records, and section rosters for offline auditing and emergency recovery.</li>
                                    </ul>
                                </div>

                                {/* Version 3.4.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.4.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 8, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🎨 <strong>Modern Tailwind v4 Class Compatibility</strong>: Streamlined gradient syntax to modern <code>bg-linear-to-br</code> and resolved redundant dark border styling across administration controls.</li>
                                        <li>✅ <strong>Section Form Indicator Precision</strong>: Optimized SVG checkmark rendering in advisory subject selection rosters with <code>stroke-3</code>.</li>
                                        <li>⚡ <strong>Strict Type & Hook Optimization</strong>: Enforced comprehensive React hooks dependency safety and strict types across SF9, PACE, and Consolidated Grades.</li>
                                    </ul>
                                </div>

                                {/* Version 3.4.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.4.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 8, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🛡️ <strong>Self-Healing Grade Reconciliation Engine</strong>: Automatic startup scanning that detects and reconnects orphaned grades/HPS records and unhides all client records with zero data loss.</li>
                                        <li>🎓 <strong>Senior High School (SHS) Grade 12 3-Term ECR</strong>: Integrated official DepEd 3-term E-Class Record for Grade 12 with ST1/ST2 relocated as WW6/WW7, single Term Exam, and full native formula preservation.</li>
                                        <li>🔬 <strong>SSHS Pilot E-Class Record Suite</strong>: Complete official 8-subject sheets (Core, Applied, Specialized, Apprenticeship/Immersion) with automated 3-term summaries and formula preservation.</li>
                                        <li>🎨 <strong>Special Curricular Programs (SCP) Support</strong>: Full official 3-term template integration for SPFL, SPJ, SPA, SPS, SPTVE, SSES, and SPSTEM with per-component breakdowns.</li>
                                        <li>📑 <strong>SF9 Multi-Level Report Cards</strong>: High-fidelity DepEd School Form 9 exports across Key Stage 1 (PACE Form & SF9), Grades 2–10, and Senior High School with 100% DepEd layout and formula preservation.</li>
                                        <li>🔒 <strong>Guaranteed Subject Visibility</strong>: Enforced full-year visibility (<code>term: 'all'</code>) for all Elementary and JHS subjects, permanently eliminating <code>term: 'none'</code> visibility filters.</li>
                                    </ul>
                                </div>

                                {/* Version 3.3.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.3.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 3, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>📊 <strong>Dynamic Term Summary Averaging</strong>: Upgraded Grade 11 TechPro and Academic SF9 summary formulas to dynamically average graded subjects using <code>AVERAGE</code>, eliminating hardcoded division by 7.</li>
                                        <li>📋 <strong>SSHS Grade 11 ECR Roster & Header Injection</strong>: Injected student names, LRNs, and section metadata directly into term and final grade worksheets, resolving blank names and <code>#VALUE!</code> cascading errors.</li>
                                        <li>🎵 <strong>Parent MAPEH 2-Pass Hierarchy</strong>: Restored composite parent MAPEH grade calculation with dynamic 2-pass averaging and hierarchical sorting in Temporary Grade Slips and E-Class Record views.</li>
                                        <li>⚡ <strong>Robust OpenXML Tag Processing</strong>: Enhanced spreadsheet XML updater with precise matching distinguishing self-closing tags from element pairs to prevent XML tag corruption.</li>
                                    </ul>
                                </div>

                                {/* Version 3.3.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.3.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">September 2, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🔍 <strong>Live Grade Sync Inspector & Root-Cause Debugger</strong>: Multi-module cross-system comparison across ECR, Grade Management, SF9, Grade Slips, and SF10 with 1-click sync actions.</li>
                                        <li>✉️ <strong>Client Diagnostic & Error Reporter</strong>: Automatic technical report generator and cloud uploader enabling teachers to submit bug reports directly with offline queueing.</li>
                                        <li>🛡️ <strong>E-Class Record (ECR) Source-of-Truth Hierarchy</strong>: Established live computed ECR transmuted scores as the primary source of truth across Advisory Grade Management and school forms.</li>
                                        <li>✨ <strong>Subject Deduplication & Smooth Scrolling</strong>: Fixed subject duplication in Grade Slips and optimized matrix table direct scrolling with sticky pinned headers.</li>
                                    </ul>
                                </div>

                                {/* Version 3.2.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.2.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 31, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>📢 <strong>Real-Time Global System Broadcasts</strong>: Live cloud announcement subsystem delivering real-time top banners and modal notices to desktop clients.</li>
                                        <li>🔑 <strong>License Portal Broadcast Manager</strong>: Administrative broadcast portal to publish, schedule, filter, and delete client notices with custom severities.</li>
                                        <li>📑 <strong>Official DepEd SF9 Report Card Suite</strong>: 3-term DepEd SF9 report card template export generators for Grades 1, 2, 3, 4–10, and Grade 11 (TechPro & Academic).</li>
                                        <li>📊 <strong>E-Class Record (ECR) Export Suite</strong>: Complete official templates for EPP/TLE, MAPEH 9-sheet, and GMRC & Values Education with formula preservation.</li>
                                    </ul>
                                </div>

                                {/* Version 3.1.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.1.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 27, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>📚 <strong>Grade Management Multi-Subject Visibility</strong>: Resolved advisory section curriculum merging ensuring all standard DepEd learning areas render seamlessly in the Master Summary of Grades.</li>
                                        <li>⚡ <strong>Responsive Grade Input Engine</strong>: Reduced input debounce latency down to 300ms across Electronic Class Records for instantaneous, snappy score input.</li>
                                        <li>🛡️ <strong>Zero-Lockout Pure Advisory Workflows</strong>: Guaranteed full access to all grade-level subjects in E-Class Record and permitted score inputs prior to explicit HPS configuration.</li>
                                        <li>🎯 <strong>Curriculum Definition Cleanup</strong>: Cleaned Junior High School (Grades 7–10) curriculum standards by removing unneeded Specialization placeholders.</li>
                                    </ul>
                                </div>

                                {/* Version 3.1.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.1.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 27, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>📑 <strong>Official DepEd Grades 2-10 3-Term E-Class Record Export</strong>: Complete integration of official DepEd templates for Academic & MAPEH/TLE learning areas (.xlsx and batch .zip) preserving 100% of Excel formulas.</li>
                                        <li>🛡️ <strong>HPS Resolution & Score Bounding</strong>: Fixed section matching and enforced $[0, 100]\%$ boundary checks to eliminate transmuted grade overflow (100 vs 77).</li>
                                        <li>🔒 <strong>Protected Grade Management Clear All</strong>: Scoped summary sheet clearing strictly to manual/imported overrides, leaving teacher E-Class Records completely untouched.</li>
                                        <li>📊 <strong>Full Word Scale Descriptors</strong>: Unified summary descriptors to display the full word scale (<em>Advancing</em>, <em>Benchmarking</em>, <em>Connecting</em>, <em>Developing</em>, <em>Emerging</em>).</li>
                                    </ul>
                                </div>

                                {/* Version 3.0.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.0.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 23, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>☁️ <strong>Automated Google Drive Cloud Backup Onboarding</strong>: Integrated step-by-step connection wizard with hourly sync, exit protection, and full database restore.</li>
                                        <li>📊 <strong>E-Class Dynamic Grade Sync</strong>: Live transmuted grade synchronization for all standalone subjects and composite MAPEH (Music & Arts, PE & Health) / EC&MK components.</li>
                                        <li>🛡️ <strong>Safe & Scoped Grade Management Clear All</strong>: Scoped to manual/imported sheet overrides with zero risk to teacher E-Class Records.</li>
                                        <li>📋 <strong>Curriculum & Virtual Subject Matching</strong>: Full DepEd learning area alias resolution supporting manual cell input and Excel template imports.</li>
                                    </ul>
                                </div>

                                {/* Version 3.0.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.0.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 23, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🎓 <strong>Strengthened Senior High School Curriculum (DO 017, s. 2026)</strong>: Full integration for Grade 11 Core Subjects, Academic & Tech-Pro clusters, and curriculum scoping.</li>
                                        <li>📊 <strong>Annex E Unit-Weighted Grading</strong>: Automated unit calculations for SF9 (Report Card), SF10-SHS (Permanent Record), SF5, and Summary of Grades.</li>
                                        <li>🛡️ <strong>Strict Advisory Subject Scoping</strong>: Automatically excludes unassigned database catalog electives from learner progress records.</li>
                                        <li>👥 <strong>DepEd Class Size Limit Monitoring</strong>: Integrated Table 7 class size limits (40 Core, 30 Academic, 25 Tech-Pro).</li>
                                    </ul>
                                </div>

                                {/* Version 3.0.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.0.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 22, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🚀 <strong>Major v3.0 Core Architecture</strong>: Standardized next-generation architecture with offline-first Dexie/IndexedDB database encryption, atomic write verification, and zero-loss backup synchronization.</li>
                                        <li>🛡️ <strong>Enterprise Multi-Platform Deployment</strong>: Automated Windows (<code>.exe</code>) and macOS (<code>.dmg</code>) compilation and distribution pipelines with SHA-512 cryptographic checksum verification.</li>
                                        <li>📋 <strong>DepEd Form Automation Suite</strong>: Unified DepEd grading, PACE Form Excel exports, SF1-SF10 automated pipelines, and high-speed honor evaluations.</li>
                                        <li>☁️ <strong>Integrated Cloud & Mobile Ecosystem</strong>: Direct Google Drive cloud backup synchronization and real-time mobile QR attendance scanning gateway.</li>
                                    </ul>
                                </div>

                                {/* Version 2.11.7 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.11.7</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 18, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🛡️ <strong>Stable Core Baseline Rollout</strong>: Standardized the complete application core on the proven, stable baseline.</li>
                                        <li>🚀 <strong>Multi-Platform Cloud Deploy</strong>: Seamless 1-click update deployment across Windows and macOS platforms.</li>
                                    </ul>
                                </div>

                                {/* Version 2.11.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.11.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>📋 <strong>Grade 1 PACE Form Support</strong>: Added Grade 1 PACE Form Excel export templates & services for Reading & Literacy, GMRC & MAKABANSA, Language, and Mathematics.</li>
                                        <li>📄 <strong>Interactive PACE Renderer</strong>: Added dedicated PACE Form interactive rendering page & template configuration.</li>
                                        <li>🎓 <strong>School Forms Integration</strong>: Integrated PACE Form navigation tab into School Forms Page.</li>
                                    </ul>
                                </div>

                                {/* Version 2.10.4 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.10.4</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🏫 <strong>Grade 11 & Grade 12 SF9 Routing Fix</strong>: Fixed Grade 11 and Grade 12 SF9 template matching to strictly exclude Senior High from Grade 1 rules.</li>
                                        <li>📜 <strong>Restored SHS Template Layout</strong>: Restored official SHS multi-semester Track/Strand SF9 template rendering and Excel exporter for Grade 11 & Grade 12.</li>
                                        <li>📐 <strong>Junior High & Elementary Alignment</strong>: Standardized <code>isGrade1to10</code> range check (1 to 10) for Junior High and Elementary sections.</li>
                                    </ul>
                                </div>

                                {/* Version 2.10.3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.10.3</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🎓 <strong>Certificate Generator Enhancement</strong>: Instant 50ms scan with zero-flicker stale state clearing and multi-format quarter string matching.</li>
                                        <li>🔗 <strong>Bidirectional Subject Resolution</strong>: Resolved subject ID and subject name mapping for accurate DepEd honor qualification evaluation.</li>
                                        <li>📊 <strong>Attendance Absent Sentinel</strong>: Fixed attendance absent sentinel (-1) calculation in Reports Page.</li>
                                        <li>📋 <strong>Grade 1 & PACE Support</strong>: Added Grade 1 SF9 Excel export template and PACE Reading & Literacy exporter.</li>
                                    </ul>
                                </div>

                                {/* Version 2.10.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.10.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 8, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🐛 <strong>SF2 Export Hotfix</strong>: Fixed an Electron application URL protocol error that caused "Failed to fetch" errors when attempting to download SF2 Excel files in the production binary.</li>
                                        <li>📁 <strong>Template Fetch Routes</strong>: Re-linked local template fetch routes to bypass <code>file:///</code> absolute root mapping conflicts on Windows and macOS.</li>
                                    </ul>
                                </div>

                                {/* Version 2.10.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.10.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 8, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🧮 <strong>Mathematical Precision Update</strong>: Fixed a mathematical oversight in the Summative Tests calculation to strictly enforce the independent 30/30/40 weighting for ST1, ST2, and TE components.</li>
                                        <li>⚖️ <strong>Dynamic Missing Assessment Re-weighting</strong>: Ensured missing assessments are dynamically re-weighted to prevent penalizing students for exams not yet administered.</li>
                                    </ul>
                                </div>

                                {/* Version 2.10.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.10.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 8, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>📊 <strong>Native SF2 Excel Export</strong>: Added native SF2 Excel (JHS & SHS & ELEM) export functionality with automated summary table calculations.</li>
                                        <li>🛡️ <strong>Silent Auto-Updates</strong>: Enforced 1-click silent NSIS background updates to prevent application uninstallation prompts during auto-updates.</li>
                                        <li>✨ <strong>Template Alignment Fixes</strong>: Fixed various template mismatching issues for perfectly aligned Excel formatting, and protected user's hardcoded template School Name fields from being overwritten.</li>
                                    </ul>
                                </div>

                                {/* Version 2.9.7 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.9.7</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 7, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>📅 <strong>Unified MM/DD/YYYY Attendance Format</strong>: Standardized attendance calendar date pickers across desktop and mobile screens into a clean, single-box control displaying dates in <code>MM/DD/YYYY</code> format.</li>
                                        <li>🗓️ <strong>Multi-Date Historical Attendance Editing</strong>: Enabled teachers to select any past date from the calendar on laptop or mobile phone to view, mark, or edit attendance records with real-time cross-device sync.</li>
                                        <li>🛡️ <strong>Today-Only Parent SMS Safeguard</strong>: Integrated date verification into the SMS gateway so updating attendance for past dates automatically skips sending SMS alerts to parents.</li>
                                        <li>📱 <strong>Real-Time Smartphone Parent SMS Alerts</strong>: Triggered live Parent SMS notifications on the laptop app whenever attendance is punched or scanned from a connected mobile phone.</li>
                                        <li>📹 <strong>Camera Stream Stabilization</strong>: Refactored QR scanner video stream lifecycle using React refs to eliminate 3-second black screen flickering.</li>
                                        <li>🔑 <strong>Google Drive Token & Auto-Updater Protection</strong>: Refactored Google Drive OAuth refresh token storage and configured NSIS 1-click background updates (<code>oneClick: true</code>) for silent binary upgrades.</li>
                                    </ul>
                                </div>

                                {/* Version 2.9.6 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.9.6</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 6, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>☁️ <strong>Optimized Google Drive Release Asset Sync Engine</strong>: Updated automated Google Drive release sync pipeline (`sync-gdrive-release.cjs`) to upload strictly binary installers (`.exe` for Windows and the 2 `.dmg` installers for macOS) and auto-purge metadata files (`.yml`, `.yaml`, `.blockmap`, `.zip`) from target release folders.</li>
                                    </ul>
                                </div>

                                {/* Version 2.9.5 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.9.5</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 6, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>🛡️ <strong>Auto-Updater Installer Restart Safeguard</strong>: Integrated top-level module scope protection and safe fallback checks around Express gateway server shutdown during automatic updates to prevent installer restart JavaScript errors (`expressServer is not defined`).</li>
                                        <li>📊 <strong>Unified Live Grade Engine Across All School Forms & Reports</strong>: Real-time transmuted grade calculation matching E-Class Record and Summary of Grades live across SF9 (Report Card), SF10 (Form 137), SF5, SF6, LIR, Grade Slips, and Analytics.</li>
                                        <li>🔢 <strong>Natural Grade-Level Section Sorting</strong>: Updated Temporary Grade Slips and Reports to sort strictly by numerical Grade Level (Grade 7 ➔ Grade 12), then alphabetically by Section Name.</li>
                                        <li>🏆 <strong>Excellence Awards & Certificate Generator Restoration</strong>: Restored Subject Excellence Awards (FG ≥ 90) across all JHS and SHS grade levels with enhanced section ID and name matching.</li>
                                        <li>🔑 <strong>Unrestricted Application Master Access</strong>: Updated RBAC permissions so all installed standalone application instances provide 100% full access to all forms, certificates, and settings.</li>
                                        <li>🧹 <strong>Cascade Section & Roster Purge Maintenance Utility</strong>: Added a 1-click database cleanup tool under Settings ➔ Data Maintenance to purge orphaned sections, ghost rosters, and unlinked grade records.</li>
                                    </ul>
                                </div>

                                {/* Version 2.9.4 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.9.4</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 6, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed <strong>Summative Tests & Term Examination (30%) Computation</strong>: Updated Total Score and Total HPS to calculate dynamically based on completed assessments only, preventing premature grade drops when Term Exams are un-administered.</li>
                                        <li>Unified <strong>Summary of Grades & E-Class Record Transmuted Grade Engine</strong>: Re-aligned transmuted grade calculations between E-Class Records and Summary of Grades for 100% exact parity with zero discrepancy across all school forms (SF9, SF10, LIR).</li>
                                        <li>Optimized <strong>macOS Update Flow</strong>: Provided tailored 1-click 🍏 <strong>Download macOS Update (.dmg)</strong> installer workflow with 2-step drag-and-drop installation instructions for Mac users.</li>
                                    </ul>
                                </div>

                                {/* Version 2.9.3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.9.3</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 5, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed <strong>Instant Mobile Student Roster Sync</strong>: Integrated 24/7 background session push from desktop App store to Express server memory so mobile devices load all students and sections instantly upon scanning.</li>
                                    </ul>
                                </div>

                                {/* Version 2.9.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.9.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 5, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed <strong>Packaged Electron Mobile Server</strong>: Bundled `server.js` into ASAR release build so the Mobile Gateway server runs automatically on port 3001 in installed apps.</li>
                                    </ul>
                                </div>

                                {/* Version 2.9.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.9.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 5, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added <strong>Mobile Phone Attendance Portal</strong> (`/mobile-attendance`) for real-time Wi-Fi attendance marking.</li>
                                        <li>Built <strong>Real-Time Cross-Device Sync Engine</strong> with multi-device polling, BroadcastChannel, and server timestamping.</li>
                                        <li>Added <strong>Interactive 1-Click Chrome Setup Guide</strong> with copy buttons for flags and laptop IP address.</li>
                                        <li>Added <strong>Native Camera QR Photo Scanner</strong> fallback (`Snap QR Photo`).</li>
                                        <li>Standardized Class Records and School Forms to <strong>DepEd Order 15 series of 2026</strong>.</li>
                                        <li>Added <strong>Automated 1-Time Storage Reset Safeguard</strong> to enforce clean default settings on update.</li>
                                    </ul>
                                </div>

                                {/* Version 2.8.4 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.8.4</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 4, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added <strong>Parent SMS Broadcast Center</strong> with 57 categorized message templates across 11 categories (Weather, PTC, Grades, Awards, Exams, Programs, Clearance, Graduation, Attendance, Health, General).</li>
                                        <li>Added <strong>Specific Student SMS Targeting</strong> — send SMS to individual student parents with searchable picker and checkbox selection.</li>
                                        <li>Added <strong>SMS Broadcast History Log</strong> tracking last 10 broadcasts with sent/failed delivery metrics.</li>
                                        <li>Redesigned <strong>Announcements Page</strong> with Quick-Action Dashboard Cards, collapsible login banner, and enriched empty states.</li>
                                    </ul>
                                </div>

                                {/* Version 2.8.3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.8.3</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 4, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added <strong>Parent SMS Broadcast Center</strong> with 57 categorized message templates across 11 categories (Weather, PTC, Grades, Awards, Exams, Programs, Clearance, Graduation, Attendance, Health, General).</li>
                                        <li>Added <strong>Specific Student Targeting</strong> — send SMS to individual student parents with searchable picker and checkbox selection.</li>
                                        <li>Added <strong>SMS Broadcast History Log</strong> tracking last 10 broadcasts with sent/failed counts.</li>
                                        <li>Redesigned <strong>Announcements Page</strong> with Quick-Action Dashboard Cards, collapsible login banner, and enriched empty states.</li>
                                        <li>Expanded onboarding wizard to 22 spotlight steps with auto-scrolling.</li>
                                        <li>Standardized E-Class Record terminology from "Quarterly" to "Term" for 3-term calendar support.</li>
                                    </ul>
                                </div>

                                {/* Version 2.8.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.8.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 2, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Deduplicated E-Class Record subject selector options by normalized title.</li>
                                        <li>Fixed dark mode printable document sheet background to enforce pure paper-white canvas for printing.</li>
                                    </ul>
                                </div>

                                {/* Version 2.8.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.8.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">August 2, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added <strong>SF2 Attendance Roster Filtering</strong> based on learner's first day of attendance date.</li>
                                        <li>Pre-enrollment date cells are now shaded and non-editable with helpful tooltips.</li>
                                        <li>Added <strong>Clean Duplicates</strong> utility in Subjects manager for bulk-deleting redundant database records.</li>
                                        <li>Automatic normalized subject deduplication in SF9 and Consolidated Grade matrices.</li>
                                    </ul>
                                </div>

                                {/* Version 2.8.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.8.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 30, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Full <strong>Dark Mode</strong> support across all School Forms (SF2, SF5, SF6, SF8, SF9, SF10, LIR, Grade Slips, Name Tags).</li>
                                        <li>Added <strong>Post-Update What's New</strong> screen on app startup after updating.</li>
                                        <li>macOS auto-updater and release download fallback with Firebase Hosting redirects.</li>
                                        <li>Excel template export sheet name sanitization and deduplication.</li>
                                    </ul>
                                </div>

                                {/* Version 2.7.6 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.7.6</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 28, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Embedded <strong>Version Description (What's New)</strong> inside the post-update Data Reconciliation Report modal.</li>
                                    </ul>
                                </div>

                                {/* Version 2.7.5 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.7.5</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 28, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed SF2 summary column header from TARDY back to PRESENT and synchronized student row totals.</li>
                                        <li>Synchronized Excel export headers and calculated present counts.</li>
                                    </ul>
                                </div>

                                {/* Version 2.7.4 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.7.4</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 28, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added Section selection dropdown in <strong>Temporary Grade Slips</strong> for browsing and printing any section's grade slips.</li>
                                        <li>Prioritized advisory classes at the top of the dropdown list.</li>
                                    </ul>
                                </div>

                                {/* Version 2.7.3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.7.3</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 28, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Updated all 35 DepEd-compliant AI prompt generators with exact decoded <strong>Gemini share links</strong>.</li>
                                        <li>Added 35th template card: Daily Lesson Log (DLL) + Exemplar.</li>
                                    </ul>
                                </div>

                                {/* Version 2.7.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.7.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 28, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed SF2 button redirecting to Dashboard instead of Attendance page.</li>
                                        <li>Resolved fixed backdrop overlay and scrolling issues in Student Information modal.</li>
                                        <li>Assigned valid URLs to all 34+ DepEd generator cards with interactive template launchers.</li>
                                    </ul>
                                </div>

                                {/* Version 2.7.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.7.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 27, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added dedicated <strong>Online Generators</strong> sidebar page with 34+ DepEd-compliant AI prompt generators, ILAW lesson logs, Matatag weekly logs, and Looker Studio K-12 Lesson Exemplars.</li>
                                        <li>Added multi-advisory section listing sorted numerically by Grade Level, featured adviser avatar card, and signature upload shortcut.</li>
                                        <li>Redesigned Reports landing page into a 4-column compact grid fitting 100% in desktop viewport without vertical scrollbars.</li>
                                        <li>Upgraded DepEd Curriculum & Subject Management banner to a clean white glassmorphic card.</li>
                                        <li>Streamlined Games & Tools dashboard by moving lesson plan generators into the dedicated Online Generators tab.</li>
                                    </ul>
                                </div>

                                {/* Version 2.7.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.7.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 26, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added interactive Games & Classroom Tools Suite (Bomb Pass, Quiz Show Jeopardy, Save the Balloon, Crossword Generator, 3D Wheel of Names, 3D Coin Flip, 3D Dice Roller, Tug of War, Raffle Jar, Bouncing Words).</li>
                                        <li>Corrected Tagalog Division Name formatting to Lalawigan ng Tarlac and Tarlac Province on Certificate Generator.</li>
                                        <li>Resolved login page exit button responsiveness.</li>
                                    </ul>
                                </div>

                                {/* Version 2.5.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.5.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 12, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Redesigned and optimized Settings "Backups & Recovery" tab layout into a modern 2-column dashboard grid.</li>
                                        <li>Commented out incomplete "Multi-Device Sync" and "School Year Archiver" features to simplify user interface.</li>
                                        <li>Fixed multiple pre-existing TypeScript compile warnings and linter errors to achieve clean build status.</li>
                                    </ul>
                                </div>

                                {/* Version 2.5.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.5.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 5, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added daily QR attendance scanning functionality.</li>
                                        <li>Added calendar announcements feature.</li>
                                        <li>Improved robustness and speed of grade sheets synchronization.</li>
                                    </ul>
                                </div>

                                {/* Version 2.4.5 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.4.5</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 5, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed the application icon missing from the installed app so the FormEase Pro logo appears on the executable, installer, desktop shortcuts, and taskbar.</li>
                                        <li>Rebuilt the Windows icon with multi-size images for crisp rendering in the title bar, taskbar, and Explorer.</li>
                                        <li>Included missing DepEd and school certificate logo assets in the application bundle.</li>
                                    </ul>
                                </div>

                                {/* Version 2.4.4 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.4.4</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 5, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Resolved CORS/relative path loading bugs for fonts and logos on both routing subpaths and Electron.</li>
                                        <li>Centered advanced certificate text blocks and improved margins for Title and Date lines.</li>
                                        <li>Added automatic signature display toggle checkboxes in place of manual uploads.</li>
                                        <li>Fixed missing Subject Awards search by adding a grade-level subjects fallback.</li>
                                        <li>Configured application user model ID to link native taskbar and titlebar window icons to the desktop shortcut on Windows.</li>
                                    </ul>
                                </div>

                                {/* Version 2.4.3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.4.3</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 4, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed a layout formatting bug in the Advanced Certificate Generator preview within the installed app by statically compiling and bundling the certificate stylesheet.</li>
                                    </ul>
                                </div>

                                {/* Version 2.4.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.4.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 4, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added native window close interception prompts to prevent closing the application without confirming.</li>
                                        <li>Optimized the Institutional Profile edit page dimensions, scaling down image elements and inputs to fit on screen without vertical scrollbars.</li>
                                        <li>Implemented a select dropdown menu with 18 official offerings for Grade Levels Offered.</li>
                                    </ul>
                                </div>

                                {/* Version 2.3.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.3.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 26, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed a critical UI bug where the FormEase Update Center modal blocked the application screen without a close/dismiss option.</li>
                                        <li>Added a new database scanner check under Settings -&gt; Self-Healing Diagnostics to identify and automatically repair (delete) corrupted or unreadable student profiles.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.7 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.7</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed a discrepancy in the section teaching load subject list by filtering out other sections' subjects and deduplicating by exact subject name (preserving unique parenthesized electives).</li>
                                        <li>Replaced the non-operational Academic Health card on the dashboard with a functional 'Class Sections & Subject Loads' card tracking active sections and teaching loads.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.6 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.6</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed a critical freeze in SF2 Daily Attendance caused by calendar holiday parsing logic.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.5 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.5</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added custom Student Enrollment Template download and import with LRN bypass support.</li>
                                        <li>Automatically normalizes student names to ALL CAPS when imported.</li>
                                        <li>Prevents database record duplication/resets by automatically merging existing students during template or SF1 imports.</li>
                                        <li>Intelligently formats and hides temporary IDs (`TEMP-` prefix) in the students list, dropdown selector, reports (SF9/SF10), and CSV exports.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.4 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.4</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Implemented 7-day offline grace limit and automatic reconnection license checks.</li>
                                        <li>Gated PDF report generation and printing behind active product validation checks.</li>
                                        <li>Added user-friendly offline limit warnings to the Product Activation screen.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.3</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added Track display for Grade 11 section cards and Track & Strand display for Grade 12 section cards.</li>
                                        <li>Integrated dynamic statement-form comment suggestions engine with Tone selection in SF9 Remarks.</li>
                                        <li>Capped SF9 comments at 250 characters with validation warning and automatic spacing/punctuation helpers.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added option to edit custom grading weight percentages (Written, Performance, Exam) for subjects.</li>
                                        <li>Excluded calendar holiday dates dynamically from SF2 daily attendance.</li>
                                        <li>Updated sidebar and main workspace to modern flat edge-to-edge layouts (no rounded edges).</li>
                                        <li>Added sign-out confirmation popup with automatic silent database backup.</li>
                                        <li>Fixed the backup restore interface to support importing auto-backups and logout-backups.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Removed redundant PDF Download button from the SF2 page.</li>
                                        <li>Wired up custom printing to PDF using Electron backend.</li>
                                        <li>Fixed overlapping character spacing issues in Chrome/Electron printing.</li>
                                        <li>Added auto-loading of standard subjects (Grade 1 to 12) for empty databases.</li>
                                        <li>Fixed month-switching and session logout SF2 data preservation.</li>
                                    </ul>
                                </div>
                            </div>
            </div>
        </div>
    );
}
