import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/app-store';
import { ArrowLeft, Users, Download, Trash2, Dice5 } from 'lucide-react';
import type { Student } from '../../types';

interface RandomGroupingsProps {
  onBack: () => void;
}

export function RandomGroupings({ onBack }: RandomGroupingsProps) {
  const { sections, students } = useAppStore();

  const [selectedSectionName, setSelectedSectionName] = useState<string>('');
  const [groupMode, setGroupMode] = useState<'bySize' | 'byCount'>('bySize');
  const [groupSize, setGroupSize] = useState(4);
  const [groupCount, setGroupCount] = useState(4);
  const [groups, setGroups] = useState<Student[][]>([]);
  const [grouped, setGrouped] = useState(false);

  const groupColors = [
    { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
    { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-400' },
    { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-400' },
    { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-400' },
    { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-400' },
    { bg: 'bg-pink-50 dark:bg-pink-950/20', border: 'border-pink-500', text: 'text-pink-700 dark:text-pink-400' },
    { bg: 'bg-cyan-50 dark:bg-cyan-950/20', border: 'border-cyan-500', text: 'text-cyan-700 dark:text-cyan-400' },
    { bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-500', text: 'text-indigo-700 dark:text-indigo-400' },
  ];

  const getGroupColor = (index: number) => {
    return groupColors[index % groupColors.length];
  };

  const formatStudentName = (student: Student): string => {
    const middle = student.middle_name ? ` ${student.middle_name.charAt(0)}.` : '';
    const ext = student.name_extension ? ` ${student.name_extension}` : '';
    return `${student.last_name}, ${student.first_name}${middle}${ext}`;
  };

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
        const name = formatStudentName(student);
        lines.push(`Group ${idx + 1},"${name.replace(/"/g, '""')}"`);
      });
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `groups-${selectedSectionName || 'class'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Random Groupings Generator</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Generate fully customized random groups from class lists.</p>
              </div>
            </div>
          </div>
          {grouped && (
            <div className="flex gap-2">
              <button
                onClick={exportGroups}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button
                onClick={clearGroups}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold transition"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            </div>
          )}
        </div>

        {!grouped ? (
          <div className="flex flex-col gap-6 max-w-md mx-auto py-8">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Class / Section</label>
              <select
                value={selectedSectionName}
                onChange={(e) => setSelectedSectionName(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-sm font-semibold"
              >
                <option value="">Choose a class...</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.section_name}>
                    Grade {sec.section_grade_level} - {sec.section_name} ({students.filter((s) => s.student_section === sec.section_name).length} learners)
                  </option>
                ))}
              </select>
            </div>

            {selectedSectionName && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Grouping Method</label>
                  <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl">
                    <button
                      onClick={() => setGroupMode('bySize')}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                        groupMode === 'bySize'
                          ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      By Group Size
                    </button>
                    <button
                      onClick={() => setGroupMode('byCount')}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                        groupMode === 'byCount'
                          ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      By Group Count
                    </button>
                  </div>
                </div>

                {groupMode === 'bySize' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Size of each group</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="2"
                        max="10"
                        value={groupSize}
                        onChange={(e) => setGroupSize(parseInt(e.target.value))}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="w-12 text-center font-bold text-sm text-slate-700 dark:text-slate-300">
                        {groupSize} kids
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Number of groups</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="2"
                        max="15"
                        value={groupCount}
                        onChange={(e) => setGroupCount(parseInt(e.target.value))}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="w-12 text-center font-bold text-sm text-slate-700 dark:text-slate-300">
                        {groupCount} groups
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={generateGroups}
                  disabled={filteredStudents.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-xl text-sm transition shadow-md"
                >
                  <Dice5 className="w-4 h-4" /> Generate Groups
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
            {groups.map((group, gIdx) => {
              const color = getGroupColor(gIdx);
              return (
                <div key={gIdx} className={`border-2 rounded-2xl p-4 flex flex-col gap-2 shadow-xs ${color.bg} ${color.border}`}>
                  <span className={`text-xs font-black uppercase tracking-wider ${color.text}`}>
                    Group {gIdx + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    {group.map((student) => (
                      <div key={student.lrn} className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                        • {formatStudentName(student)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
