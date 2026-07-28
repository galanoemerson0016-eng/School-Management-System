import React, { useState } from 'react';
import { 
  ArrowLeft, BookOpen, Copy, Check, ExternalLink
} from 'lucide-react';

export interface WebTemplateItem {
  id: string;
  title: string;
  badge: string;
  badgeColor?: string;
  description: string;
  url?: string;
}

interface LessonPlannerTemplatesProps {
  plannerType: 'daily-ilaw' | 'weekly-ilaw' | 'semi-ilaw' | 'weekly-matatag' | 'semi-detailed' | 'trimester' | 'detailed';
  title: string;
  badge: string;
  description: string;
  onBack: () => void;
}

export function LessonPlannerTemplates({ 
  plannerType, 
  title, 
  badge, 
  description, 
  onBack 
}: LessonPlannerTemplatesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getTemplates = (): WebTemplateItem[] => {
    switch (plannerType) {
      case 'daily-ilaw':
        return [
          {
            id: 'dll_ilaw_daily',
            title: 'DLL ILAW Format (Separate Each Day)',
            badge: 'Daily ILAW',
            badgeColor: 'amber',
            description: 'ILAW-based Daily Lesson Log with individual sections for each instructional day of the week.',
            url: 'https://gemini.google.com/share/4c7a51091c42'
          },
          {
            id: 'dll_ilaw_daily_selectable',
            title: 'DLL ILAW FORMAT (SEPARATE EACH DAY) with selectable Lesson Flow',
            badge: 'Daily ILAW',
            badgeColor: 'amber',
            description: 'ILAW-based Daily Lesson Log with selectable Lesson Flow elements and individual sections for each day.',
            url: 'https://gemini.google.com/share/5bcb25b0daa3'
          },
          {
            id: 'dlp_ilaw_2',
            title: 'DLP ILAW #2 (Flow - Review - Motivation - Discussion)',
            badge: 'New',
            badgeColor: 'green',
            description: 'Daily Lesson Log structure focusing on the Review, Motivation, and Discussion flow within the ILAW framework.',
            url: 'https://share.gemini.google/1JNqnilImeJs'
          },
          {
            id: 'ilaw_dlp_4as',
            title: 'ILAW DLP 4A\'s Format',
            badge: 'New',
            badgeColor: 'green',
            description: 'Daily Lesson Plan format structured around the Activity, Analysis, Abstraction, and Application (4A\'s) model under the ILAW framework.',
            url: 'https://share.gemini.google/uu6uJ9RANIre'
          },
          {
            id: 'ilaw_dlp_short',
            title: 'ILAW DLP (Short)',
            badge: 'New',
            badgeColor: 'green',
            description: 'A condensed Daily Lesson Plan template following the ILAW framework for quick lesson preparation.',
            url: 'https://share.gemini.google/ZFbXOcwMy4aG'
          },
          {
            id: 'ilaw_filipino_only',
            title: 'ILAW Filipino Only',
            badge: 'New',
            badgeColor: 'green',
            description: 'Daily Lesson Plan template customized specifically for Filipino language instruction under the ILAW framework.',
            url: 'https://gemini.google/share/7d91cb3c79a6?skid=af51d5f5-030e-433d-b6c7-e098186de797'
          },
          {
            id: 'ilaw_co_maker_daily',
            title: 'ILAW CO maker (Daily)',
            badge: 'New',
            badgeColor: 'green',
            description: 'Daily Classroom Observation (CO) lesson plan maker aligned with the ILAW framework.',
            url: 'https://share.gemini.google/J7qeJVhdZ47A'
          }
        ];

      case 'weekly-ilaw':
        return [
          {
            id: 'dll_ilaw_weekly',
            title: 'DLL ILAW Format (Weekly)',
            badge: 'Weekly ILAW',
            badgeColor: 'teal',
            description: 'ILAW-structured weekly Daily Lesson Log consolidating all instructional days in a single view.',
            url: 'https://gemini.google.com/share/bcac87affd11'
          },
          {
            id: 'dll_ilaw_weekly_selectable',
            title: 'ILAW Weekly DLL with Selectable Lesson Flow',
            badge: 'Weekly ILAW',
            badgeColor: 'slate',
            description: 'ILAW-structured weekly Daily Lesson Log consolidating all instructional days with selectable Lesson Flow.',
            url: 'https://gemini.google.com/share/b213e0a2aefb'
          }
        ];

      case 'semi-ilaw':
        return [
          {
            id: 'dlp_trimester_ilaw',
            title: 'Semi-detailed ILAW Format',
            badge: 'Semi-Detailed ILAW',
            badgeColor: 'fuchsia',
            description: 'A streamlined lesson planner focusing on Intentions (I), Learning Experiences (L), Assessment (A), and Ways Forward (W).',
            url: 'https://gemini.google.com/share/8d696fc086ec'
          }
        ];

      case 'weekly-matatag':
        return [
          {
            id: '9b58e5a1f0f8',
            title: 'MATATAG + Exemplar + Summative Test',
            badge: 'Matatag Standard',
            badgeColor: 'blue',
            description: 'Complete weekly log generation with integrated exemplar uploads and assessment creation.',
            url: 'https://gemini.google.com/share/9b58e5a1f0f8'
          },
          {
            id: 'ea9323e60569',
            title: 'Revised Matatag Weekly Planner',
            badge: 'Updated v2.0',
            badgeColor: 'green',
            description: 'Optimized for the latest curriculum adjustments. Faster generation with streamlined prompts.',
            url: 'https://gemini.google.com/share/ea9323e60569'
          },
          {
            id: 'a8f51e51cc31',
            title: 'K-12 Format Weekly',
            badge: 'DepEd Official',
            badgeColor: 'slate',
            description: 'Standard DepEd format for K-12. Reliable and compliant for submission.',
            url: 'https://gemini.google.com/share/a8f51e51cc31'
          },
          {
            id: '0b1f834a1b72',
            title: 'K-12 Filipino Subject Planner',
            badge: 'Filipino',
            badgeColor: 'yellow',
            description: 'Designed specifically for subjects taught in Filipino (ESP, AP, Filipino).',
            url: 'https://gemini.google.com/share/0b1f834a1b72'
          },
          {
            id: 'eb4d60eea4d9',
            title: 'Revised K-12 Weekly Planner',
            badge: 'New Release',
            badgeColor: 'slate',
            description: 'Updated fields for better alignment with 2025 observation tools.',
            url: 'https://gemini.google.com/share/eb4d60eea4d9'
          },
          {
            id: '1f3a9ad9b96f',
            title: '4A\'s Weekly Lesson Planner',
            badge: '4A\'s Method',
            badgeColor: 'purple',
            description: 'Strictly follows the Activity, Analysis, Abstraction, Application flow.',
            url: 'https://gemini.google.com/share/1f3a9ad9b96f'
          },
          {
            id: 'b794457e459d',
            title: 'Revised MELC Format',
            badge: 'MELC Based',
            badgeColor: 'slate',
            description: 'Focuses on Most Essential Learning Competencies for streamlined delivery.',
            url: 'https://gemini.google.com/share/b794457e459d'
          },
          {
            id: '4b678d686ea0',
            title: 'SHS Lesson Planner',
            badge: 'Senior High',
            badgeColor: 'slate',
            description: 'Tailored fields for Core, Applied, and Specialized SHS subjects.',
            url: 'https://gemini.google.com/share/4b678d686ea0'
          },
          {
            id: '883b56c0bdb0',
            title: 'WEELMAT Generator',
            badge: 'Auto-Gen',
            badgeColor: 'red',
            description: 'All-in-one generator for Weekly Learning Materials and Activity sheets.',
            url: 'https://gemini.google.com/share/883b56c0bdb0'
          }
        ];

      case 'semi-detailed':
        return [
          {
            id: '234221a94346',
            title: 'Semi-Detailed K-12 Format',
            badge: 'Classic Format',
            badgeColor: 'slate',
            description: 'Standard semi-detailed format suitable for daily logs.',
            url: 'https://gemini.google.com/share/234221a94346'
          },
          {
            id: '68ffbb53d5e7',
            title: 'Detailed K-12 CO (PMES/COI)',
            badge: 'CO Ready',
            badgeColor: 'rose',
            description: 'Includes explicit indicators for Classroom Observation (CO) and PMES.',
            url: 'https://gemini.google.com/share/68ffbb53d5e7'
          },
          {
            id: 'e19dca7d2e01',
            title: 'Semi-Detailed Matatag Format',
            badge: 'Matatag SD',
            badgeColor: 'slate',
            description: 'Simplified Matatag layout for quick daily planning.',
            url: 'https://gemini.google.com/share/e19dca7d2e01'
          },
          {
            id: 'a7db5f0ed258',
            title: 'Matatag Semi-Detailed + PMES COI',
            badge: 'COI Aligned',
            badgeColor: 'rose',
            description: 'Matatag aligned with embedded indicators for performance evaluation.',
            url: 'https://gemini.google.com/share/a7db5f0ed258'
          },
          {
            id: '63005656c51c',
            title: 'SHS Daily Planner',
            badge: 'Daily Log',
            badgeColor: 'slate',
            description: 'Day-by-day lesson logging for Senior High School tracks.',
            url: 'https://gemini.google.com/share/63005656c51c'
          },
          {
            id: 'c828ed20ea73',
            title: '4A\'s Semi-Detailed AI',
            badge: 'Simplified 4A',
            badgeColor: 'purple',
            description: 'Concise 4A\'s framework for quicker preparation.',
            url: 'https://gemini.google.com/share/c828ed20ea73'
          }
        ];

      case 'trimester':
        return [
          {
            id: 'dlp_trimester',
            title: 'Trimester Semi-Detailed Lesson Planner',
            badge: 'Trimester',
            badgeColor: 'slate',
            description: 'Comprehensive semi-detailed planner designed for schools following a trimester academic calendar.',
            url: 'https://gemini.google.com/share/9a7491b432ca'
          },
          {
            id: 'dll_trimester_weekly',
            title: 'Trimester DLL Weekly Format',
            badge: 'Trimester',
            badgeColor: 'slate',
            description: 'Efficient weekly Daily Lesson Log format optimized for trimester schedules.',
            url: 'https://gemini.google.com/share/d8c230ab537a'
          },
          {
            id: 'dll_trimester_daily',
            title: 'Trimester DLL (Separate Each Day)',
            badge: 'Trimester',
            badgeColor: 'slate',
            description: 'Detailed Daily Lesson Log format with distinct sections for each instructional day.',
            url: 'https://gemini.google.com/share/ffd12f51f1f3'
          }
        ];

      case 'detailed':
      default:
        return [
          {
            id: 'dlp_1',
            title: 'Detailed Lesson Plan 1',
            badge: 'Comprehensive',
            badgeColor: 'slate',
            description: 'Full script format covering teacher\'s activity and student\'s expected response.',
            url: 'https://gemini.google.com/share/f98c14afc2e9'
          },
          {
            id: 'dlp_4a',
            title: '4A\'s Detailed Lesson Planner',
            badge: '4A\'s Expert',
            badgeColor: 'purple',
            description: 'Deep dive into the 4A\'s with specific prompts for each stage.',
            url: 'https://gemini.google.com/share/e4c200369e65'
          },
          {
            id: 'dlp_matatag',
            title: 'Matatag Detailed Planner',
            badge: 'New Matatag',
            badgeColor: 'blue',
            description: 'Detailed script aligned with the new Matatag curriculum structure.',
            url: 'https://gemini.google.com/share/658da4b65b61'
          },
          {
            id: 'dlp_7e',
            title: '7E\'s Detailed Lesson Planner',
            badge: '7E Cycle',
            badgeColor: 'emerald',
            description: 'Inquiry-based model: Elicit, Engage, Explore, Explain, Elaborate, Evaluate, Extend.',
            url: 'https://gemini.google.com/share/7fa907ce9a59'
          },
          {
            id: 'dlp_annotated',
            title: 'Annotated Lesson Planner',
            badge: 'With Notes',
            badgeColor: 'amber',
            description: 'Includes side-columns for teacher annotations and post-lesson reflections.',
            url: 'https://gemini.google.com/share/4560eeb21b7f'
          },
          {
            id: 'dlp_exemplar',
            title: 'Daily Lesson Log (DLL) + Exemplar',
            badge: 'DLL + Exemplar',
            badgeColor: 'blue',
            description: 'One-day DLL format with integrated lesson exemplar upload for streamlined daily preparation.',
            url: 'https://gemini.google.com/share/3bc0dd129f42'
          }
        ];
    }
  };

  const templates = getTemplates();

  const handleUseTemplate = (tpl: WebTemplateItem) => {
    if (tpl.url) {
      window.open(tpl.url, '_blank', 'noopener,noreferrer');
    } else {
      const promptText = `DepEd Lesson Plan Template: ${tpl.title}\nDescription: ${tpl.description}\nBadge: ${tpl.badge}`;
      navigator.clipboard.writeText(promptText);
      setCopiedId(tpl.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-4 lg:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                {badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => handleUseTemplate(tpl)}
            className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all flex flex-col justify-between group hover:-translate-y-1 cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50`}>
                  {tpl.badge}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base mb-1.5 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tpl.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  {tpl.description}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              {tpl.url ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const promptText = `DepEd Lesson Plan Template: ${tpl.title}\nDescription: ${tpl.description}\nBadge: ${tpl.badge}\n\n[Prompt Outline Structure]\n- Intention (I): Learning Objectives & Alignment\n- Learning Experience (L): Activities & Discussion\n- Assessment (A): Formative Quiz\n- Ways Forward (W): Reflection & Next Steps`;
                      navigator.clipboard.writeText(promptText);
                      setCopiedId(tpl.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Copy Template Outline"
                  >
                    {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(tpl.url, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95"
                  >
                    <span>Use Template</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const promptText = `DepEd Lesson Plan Template: ${tpl.title}\nDescription: ${tpl.description}\nBadge: ${tpl.badge}\n\n[Prompt Outline Structure]\n- Intention (I): Learning Objectives & Alignment\n- Learning Experience (L): Activities & Discussion\n- Assessment (A): Formative Quiz\n- Ways Forward (W): Reflection & Next Steps`;
                    navigator.clipboard.writeText(promptText);
                    setCopiedId(tpl.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <span>{copiedId === tpl.id ? 'Copied Outline!' : 'Copy Template Outline'}</span>
                  {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
