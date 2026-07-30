import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores';
import { ArrowLeft, Users, Download, Trash2, Dice5 } from 'lucide-react';
import type { Student } from '../../types';

interface GroupYourselfProps {
  onBack: () => void;
}

export function GroupYourself({ onBack }: GroupYourselfProps) {
  const { sections, students } = useAppStore();

  const [selectedSectionName, setSelectedSectionName] = useState<string>('');
  const [groupMode, setGroupMode] = useState<'bySize' | 'byCount'>('bySize');
  const [groupSize, setGroupSize] = useState(4);
  const [groupCount, setGroupCount] = useState(4);
  const [groups, setGroups] = useState<Student[][]>([]);
  const [grouped, setGrouped] = useState(false);

  const groupColors = [
    { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-500/30', badge: 'bg-emerald-100 dark:bg-emerald-900/60', text: 'text-emerald-700 dark:text-emerald-300', itemBg: 'bg-white/80 dark:bg-white/5' },
    { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-500/30', badge: 'bg-blue-100 dark:bg-blue-900/60', text: 'text-blue-700 dark:text-blue-300', itemBg: 'bg-white/80 dark:bg-white/5' },
    { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-500/30', badge: 'bg-rose-100 dark:bg-rose-900/60', text: 'text-rose-700 dark:text-rose-300', itemBg: 'bg-white/80 dark:bg-white/5' },
    { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-500/30', badge: 'bg-amber-100 dark:bg-amber-900/60', text: 'text-amber-700 dark:text-amber-300', itemBg: 'bg-white/80 dark:bg-white/5' },
    { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-500/30', badge: 'bg-purple-100 dark:bg-purple-900/60', text: 'text-purple-700 dark:text-purple-300', itemBg: 'bg-white/80 dark:bg-white/5' },
    { bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-500/30', badge: 'bg-teal-100 dark:bg-teal-900/60', text: 'text-teal-700 dark:text-teal-300', itemBg: 'bg-white/80 dark:bg-white/5' },
    { bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-500/30', badge: 'bg-pink-100 dark:bg-pink-900/60', text: 'text-pink-700 dark:text-pink-300', itemBg: 'bg-white/80 dark:bg-white/5' },
    { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-500/30', badge: 'bg-cyan-100 dark:bg-cyan-900/60', text: 'text-cyan-700 dark:text-cyan-300', itemBg: 'bg-white/80 dark:bg-white/5' },
    { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-500/30', badge: 'bg-indigo-100 dark:bg-indigo-900/60', text: 'text-indigo-700 dark:text-indigo-300', itemBg: 'bg-white/80 dark:bg-white/5' },
    { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-500/30', badge: 'bg-orange-100 dark:bg-orange-900/60', text: 'text-orange-700 dark:text-orange-300', itemBg: 'bg-white/80 dark:bg-white/5' },
  ];

  const getGroupColor = (index: number) => {
    return groupColors[index % groupColors.length];
  };

  const formatStudentName = (student: Student): string => {
    const middle = student.middle_name ? ` ${student.middle_name.charAt(0)}.` : '';
    const ext = student.name_extension ? ` ${student.name_extension}` : '';
    return `${student.last_name}, ${student.first_name}${middle}${ext}`;
  };

  // Filter students based on the selected section name
  const filteredStudents = useMemo(() => {
    if (!selectedSectionName) return [];
    return students
      .filter((s) => s.student_section === selectedSectionName)
      .sort((a, b) => {
        const aName = `${a.last_name || ''}, ${a.first_name || ''}`.toLowerCase();
        const bName = `${b.last_name || ''}, ${b.first_name || ''}`.toLowerCase();
        return aName.localeCompare(bName);
      });
  }, [selectedSectionName, students]);

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const generateGroups = () => {
    if (filteredStudents.length === 0) return;

    const shuffled = shuffleArray(filteredStudents);
    const result: Student[][] = [];

    if (groupMode === 'bySize') {
      const size = Math.max(1, groupSize);
      for (let i = 0; i < shuffled.length; i += size) {
        result.push(shuffled.slice(i, i + size));
      }
    } else {
      const count = Math.max(1, groupCount);
      const baseSize = Math.floor(shuffled.length / count);
      const remainder = shuffled.length % count;
      let idx = 0;
      for (let i = 0; i < count; i++) {
        const size = baseSize + (i < remainder ? 1 : 0);
        result.push(shuffled.slice(idx, idx + size));
        idx += size;
      }
    }

    setGroups(result.filter((g) => g.length > 0));
    setGrouped(true);
  };

  const clearGroups = () => {
    setGroups([]);
    setGrouped(false);
  };

  const exportGroups = () => {
    if (!grouped || groups.length === 0) return;
    const lines: string[] = ['Group,Student Name'];
    groups.forEach((group, idx) => {
      group.forEach((student) => {
        lines.push(`Group ${idx + 1},"${formatStudentName(student)}"`);
      });
    });
    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `groups-${selectedSectionName || 'class'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-xs">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Group Yourself</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Randomly group learners from any class.</p>
            </div>
          </div>
        </div>

        {/* Class Selector */}
        <div className="flex gap-4 items-end flex-wrap mb-6 border-b border-slate-100 dark:border-white/10 pb-6">
          <div className="flex flex-col gap-1.5 min-w-55">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wide">Class / Section</label>
            <select
              value={selectedSectionName}
              onChange={(e) => {
                setSelectedSectionName(e.target.value);
                clearGroups();
              }}
              className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-sm font-semibold cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white">Select section...</option>
              {sections.map((s) => (
                <option key={s.id} value={s.section_name} className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white">
                  Grade {s.section_grade_level} - {s.section_name}
                </option>
              ))}
            </select>
          </div>

          {filteredStudents.length > 0 && (
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 pb-2">
              {filteredStudents.length} student(s) loaded
            </span>
          )}
        </div>

        {/* Group Settings */}
        {filteredStudents.length > 0 && (
          <div className="flex justify-between items-center gap-4 flex-wrap bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 p-4 rounded-2xl mb-6">
            <div className="inline-flex gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
              <button
                onClick={() => setGroupMode('bySize')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  groupMode === 'bySize'
                    ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                By Group Size
              </button>
              <button
                onClick={() => setGroupMode('byCount')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  groupMode === 'byCount'
                    ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                By Number of Groups
              </button>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {groupMode === 'bySize' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Students per group:</span>
                  <input
                    value={groupSize}
                    onChange={(e) => setGroupSize(Math.max(1, parseInt(e.target.value) || 1))}
                    type="number"
                    min="1"
                    max={filteredStudents.length}
                    className="w-16 px-2.5 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-center font-bold text-sm"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-400">Number of groups:</span>
                  <input
                    value={groupCount}
                    onChange={(e) => setGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
                    type="number"
                    min="1"
                    max={filteredStudents.length}
                    className="w-16 px-2.5 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-center font-bold text-sm"
                  />
                </div>
              )}

              <button
                onClick={generateGroups}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-md transition text-sm cursor-pointer"
              >
                <Dice5 className="w-4 h-4" /> Randomize Groups
              </button>

              {grouped && (
                <button
                  onClick={clearGroups}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-white/10 hover:border-red-500 rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 font-semibold transition text-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {grouped && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{groups.length} Group(s) Generated</span>
            <button
              onClick={exportGroups}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition text-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        )}

        {grouped ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groups.map((group, idx) => {
              const color = getGroupColor(idx);
              return (
                <div
                  key={idx}
                  className={`border-2 rounded-2xl p-4 flex flex-col gap-3 transition-shadow hover:shadow-md ${color.bg} ${color.border}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${color.badge} ${color.text}`}
                    >
                      Group {idx + 1}
                    </span>
                    <span className={`text-xs font-semibold ${color.text}`}>
                      {group.length} members
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {group.map((student) => (
                      <li
                        key={student.lrn}
                        className={`text-xs font-bold p-2.5 rounded-lg shadow-xs ${color.itemBg} ${color.text}`}
                      >
                        {formatStudentName(student)}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-2">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <span className="font-bold">No groups generated yet</span>
            <span className="text-xs">Select a section and click Randomize Groups to start.</span>
          </div>
        )}
      </div>
    </div>
  );
}
