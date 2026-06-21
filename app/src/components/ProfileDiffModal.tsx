import React, { useState } from 'react';
import { X, Check, HelpCircle } from 'lucide-react';
import type { Student } from '../types';

export interface ProfileDiffItem {
  fieldName: string;
  label: string;
  currentValue: string;
  incomingValue: string;
  keepIncoming: boolean;
}

interface ProfileDiffModalProps {
  open: boolean;
  studentName: string;
  lrn: string;
  diffItems: ProfileDiffItem[];
  onConfirm: (mergedFields: Record<string, string>) => void;
  onCancel: () => void;
}

export function ProfileDiffModal({
  open,
  studentName,
  lrn,
  diffItems: initialDiffItems,
  onConfirm,
  onCancel
}: ProfileDiffModalProps) {
  const [diffItems, setDiffItems] = useState<ProfileDiffItem[]>(initialDiffItems);

  if (!open) return null;

  const handleToggleField = (index: number) => {
    setDiffItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, keepIncoming: !item.keepIncoming } : item))
    );
  };

  const handleAcceptAllIncoming = () => {
    setDiffItems(prev => prev.map(item => ({ ...item, keepIncoming: true })));
  };

  const handleKeepAllExisting = () => {
    setDiffItems(prev => prev.map(item => ({ ...item, keepIncoming: false })));
  };

  const handleApply = () => {
    const mergedFields: Record<string, string> = {};
    diffItems.forEach(item => {
      if (item.keepIncoming) {
        mergedFields[item.fieldName] = item.incomingValue;
      }
    });
    onConfirm(mergedFields);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Resolve Profile Conflict</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">An existing record was found matching this student profile.</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh] custom-scrollbar">
          {/* Target Student Identity Card */}
          <div className="rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Learner</p>
            <h4 className="text-base font-extrabold text-slate-800 dark:text-white mt-1">{studentName}</h4>
            <p className="font-mono text-xs text-slate-500 mt-0.5">LRN: {lrn}</p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Select values to import</p>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptAllIncoming}
                className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Accept All Imported
              </button>
              <span className="text-slate-350">|</span>
              <button
                onClick={handleKeepAllExisting}
                className="text-[11px] font-extrabold text-slate-500 hover:underline cursor-pointer"
              >
                Keep All Existing
              </button>
            </div>
          </div>

          {/* Diffs Table */}
          <div className="border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden bg-slate-50/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-white/3 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-white/5">
                  <th className="py-2.5 px-4">Field</th>
                  <th className="py-2.5 px-4">Current Database</th>
                  <th className="py-2.5 px-4">Incoming Excel</th>
                  <th className="py-2.5 px-4 text-center">Import?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-white/5 text-xs">
                {diffItems.map((item, index) => (
                  <tr key={item.fieldName} className="hover:bg-slate-100/20 dark:hover:bg-white/2">
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-gray-200">{item.label}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-750">
                      {item.currentValue || <span className="italic text-slate-300">empty</span>}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-white bg-indigo-500/5 dark:bg-indigo-400/5">
                      {item.incomingValue || <span className="italic text-slate-300">empty</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleField(index)}
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-md border transition-all cursor-pointer ${
                          item.keepIncoming
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/2 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Skip Student
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-indigo-600/10"
          >
            Apply Merge
          </button>
        </div>

      </div>
    </div>
  );
}
