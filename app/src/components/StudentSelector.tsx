
import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Student } from '../types';

interface StudentSelectorProps {
    students: Student[];
    selectedStudentLrn: string | null;
    onSelect: (lrn: string) => void;
    disabled?: boolean;
}

export const StudentSelector = ({ students, selectedStudentLrn, onSelect, disabled = false }: StudentSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter and Sort Students
    const filteredGroups = useMemo(() => {
        const query = searchQuery.toLowerCase();

        const filterFn = (s: Student) => {
            const last = s.last_name?.toLowerCase() || '';
            const first = s.first_name?.toLowerCase() || '';
            return last.includes(query) || first.includes(query);
        };

        const sortFn = (a: Student, b: Student) =>
            (a.last_name || '').localeCompare(b.last_name || '');

        const male = students
            .filter(s => s.gender === 'Male' && filterFn(s))
            .sort(sortFn);

        const female = students
            .filter(s => s.gender === 'Female' && filterFn(s))
            .sort(sortFn);

        return { male, female };
    }, [students, searchQuery]);

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedStudent = students.find(s => s.lrn === selectedStudentLrn);

    const handleSelect = (lrn: string) => {
        onSelect(lrn);
        setIsOpen(false);
        setSearchQuery('');
    };

    if (disabled) {
        return (
            <div className="w-full h-14 px-5 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-3xl text-slate-300 dark:text-slate-500 flex items-center cursor-not-allowed text-[13px] font-bold opacity-50">
                -- Select Section First --
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-15 text-left px-5 bg-white dark:bg-white/5 border-2 rounded-3xl flex items-center justify-between transition-all hover:border-slate-300 dark:hover:border-white/20 shadow-xs ${isOpen ? 'ring-8 ring-indigo-600/5 border-indigo-600 bg-indigo-50/10 dark:bg-indigo-500/10' : 'border-slate-100 dark:border-white/10'}`}
            >
                <div className="flex flex-col truncate">
                    <span className={`block truncate text-[13px] leading-tight ${selectedStudent ? 'text-slate-900 dark:text-white font-black' : 'text-slate-400 dark:text-slate-500 font-bold'}`}>
                        {selectedStudent
                            ? `${selectedStudent.last_name}, ${selectedStudent.first_name}`
                            : 'Search Learner Name...'}
                    </span>
                    {selectedStudent && !selectedStudent.lrn?.startsWith('TEMP-') && (
                        <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
                            LRN: {selectedStudent.lrn}
                        </span>
                    )}
                </div>
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-all ${isOpen ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-50 dark:bg-white/10 text-slate-400 dark:text-slate-300'}`}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-100 w-full mt-3 bg-white dark:bg-[#0d1225] shadow-[0_20px_70px_rgba(0,0,0,0.4)] rounded-3xl border border-slate-100 dark:border-white/10 max-h-100 flex flex-col overflow-hidden backdrop-blur-xl"
                    >
                        {/* Search Header */}
                        <div className="p-4 border-b border-slate-50 dark:border-white/10 bg-slate-50/30 dark:bg-white/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    autoFocus
                                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    placeholder="Type to filter..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-slate-500 dark:hover:text-slate-300"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="overflow-y-auto flex-1 p-3 space-y-4 custom-scrollbar">
                            {/* Male Group */}
                            {filteredGroups.male.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-4 py-1.5 text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] flex items-center justify-between">
                                        <span>Male Students</span>
                                        <span className="opacity-40">{filteredGroups.male.length}</span>
                                    </div>
                                    {filteredGroups.male.map(student => (
                                        <button
                                            key={student.lrn}
                                            onClick={() => handleSelect(student.lrn)}
                                            className={`w-full text-left px-4 py-3.5 text-[12px] rounded-2xl flex items-center justify-between transition-all group ${selectedStudentLrn === student.lrn
                                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none font-black'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-bold'
                                                }`}
                                        >
                                            <span className="truncate">{student.last_name}, {student.first_name}</span>
                                            {selectedStudentLrn === student.lrn ? (
                                                <Check className="w-4 h-4 text-white" />
                                            ) : (
                                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Female Group */}
                            {filteredGroups.female.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-4 py-1.5 text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center justify-between">
                                        <span>Female Students</span>
                                        <span className="opacity-40">{filteredGroups.female.length}</span>
                                    </div>
                                    {filteredGroups.female.map(student => (
                                        <button
                                            key={student.lrn}
                                            onClick={() => handleSelect(student.lrn)}
                                            className={`w-full text-left px-4 py-3.5 text-[12px] rounded-2xl flex items-center justify-between transition-all group ${selectedStudentLrn === student.lrn
                                                ? 'bg-rose-600 text-white shadow-xl shadow-rose-200 font-black'
                                                : 'text-slate-600 hover:bg-slate-50 font-bold'
                                                }`}
                                        >
                                            <span className="truncate">{student.last_name}, {student.first_name}</span>
                                            {selectedStudentLrn === student.lrn ? (
                                                <Check className="w-4 h-4 text-white" />
                                            ) : (
                                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {filteredGroups.male.length === 0 && filteredGroups.female.length === 0 && (
                                <div className="p-10 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
                                        <Search className="w-6 h-6 text-slate-200" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">No Learners Found</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                            Try adjusting your search query<br/>for "{searchQuery}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
