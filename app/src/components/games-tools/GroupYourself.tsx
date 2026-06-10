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
    { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669' },
    { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB' },
    { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' },
    { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' },
    { bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED' },
    { bg: '#F0FDFA', border: '#99F6E4', text: '#0D9488' },
    { bg: '#FDF2F8', border: '#FBCFE8', text: '#DB2777' },
    { bg: '#ECFEFF', border: '#A5F3FC', text: '#0891B2' },
    { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5' },
    { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C' },
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
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Group Yourself</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Randomly group learners from any class.</p>
            </div>
          </div>
        </div>

        {/* Class Selector */}
        <div className="flex gap-4 items-end flex-wrap mb-6 border-b border-slate-100 dark:border-white/5 pb-6">
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class / Section</label>
            <select
              value={selectedSectionName}
              onChange={(e) => {
                setSelectedSectionName(e.target.value);
                clearGroups();
              }}
              className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-sm font-semibold"
            >
              <option value="">Select section...</option>
              {sections.map((s) => (
                <option key={s.id} value={s.section_name}>
                  Grade {s.section_grade_level} - {s.section_name}
                </option>
              ))}
            </select>
          </div>

          {filteredStudents.length > 0 && (
            <span className="text-xs font-bold text-slate-400 pb-2">
              {filteredStudents.length} student(s) loaded
            </span>
          )}
        </div>

        {/* Group Settings */}
        {filteredStudents.length > 0 && (
          <div className="flex justify-between items-center gap-4 flex-wrap bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-4 rounded-2xl mb-6">
            <div className="inline-flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setGroupMode('bySize')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  groupMode === 'bySize'
                    ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                By Group Size
              </button>
              <button
                onClick={() => setGroupMode('byCount')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  groupMode === 'byCount'
                    ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                By Number of Groups
              </button>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {groupMode === 'bySize' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Students per group:</span>
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
                  <span className="text-xs font-bold text-slate-400">Number of groups:</span>
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
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-md transition text-sm"
              >
                <Dice5 className="w-4 h-4" /> Randomize Groups
              </button>

              {grouped && (
                <button
                  onClick={clearGroups}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-white/10 hover:border-red-500 rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 font-semibold transition text-sm"
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
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition text-sm"
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
                  className="border-2 rounded-2xl p-4 flex flex-col gap-3 transition-shadow hover:shadow-md"
                  style={{
                    backgroundColor: color.bg,
                    borderColor: color.border,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ color: color.text, backgroundColor: color.border }}
                    >
                      Group {idx + 1}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: color.text }}>
                      {group.length} members
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {group.map((student) => (
                      <li
                        key={student.lrn}
                        className="text-xs font-bold p-2 bg-white/70 dark:bg-slate-900/30 rounded-lg shadow-xs"
                        style={{ color: color.text }}
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
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Users className="w-12 h-12 text-slate-300" />
            <span className="font-bold">No groups generated yet</span>
            <span className="text-xs">Select a section and click Randomize Groups to start.</span>
          </div>
        )}
      </div>
    </div>
  );
}
