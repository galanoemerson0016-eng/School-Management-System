
import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
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
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-500 cursor-not-allowed">
                -- Choose Student --
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-3 py-2 bg-white border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-deped-blue focus:border-deped-blue flex items-center justify-between transition-all hover:bg-gray-50"
            >
                <span className={`block truncate ${selectedStudent ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {selectedStudent
                        ? `${selectedStudent.last_name}, ${selectedStudent.first_name}`
                        : '-- Choose Student --'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white shadow-xl rounded-md border border-gray-200 max-h-96 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top">

                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter students..."
                                className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-deped-blue/20 focus:border-deped-blue transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                        {/* Male Group */}
                        {filteredGroups.male.length > 0 && (
                            <div className="mb-2">
                                <div className="px-3 py-1.5 text-xs font-bold text-deped-blue/80 uppercase tracking-wider bg-gray-50 rounded-sm mb-1">
                                    Male ({filteredGroups.male.length})
                                </div>
                                {filteredGroups.male.map(student => (
                                    <button
                                        key={student.lrn}
                                        onClick={() => handleSelect(student.lrn)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors ${selectedStudentLrn === student.lrn
                                            ? 'bg-deped-blue/10 text-deped-blue font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span>{student.last_name}, {student.first_name}</span>
                                        {selectedStudentLrn === student.lrn && <Check className="w-4 h-4 text-deped-blue" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Female Group */}
                        {filteredGroups.female.length > 0 && (
                            <div className="mb-1">
                                <div className="px-3 py-1.5 text-xs font-bold text-pink-600/80 uppercase tracking-wider bg-pink-50 rounded-sm mb-1 mt-2">
                                    Female ({filteredGroups.female.length})
                                </div>
                                {filteredGroups.female.map(student => (
                                    <button
                                        key={student.lrn}
                                        onClick={() => handleSelect(student.lrn)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors ${selectedStudentLrn === student.lrn
                                            ? 'bg-deped-blue/10 text-deped-blue font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span>{student.last_name}, {student.first_name}</span>
                                        {selectedStudentLrn === student.lrn && <Check className="w-4 h-4 text-deped-blue" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {filteredGroups.male.length === 0 && filteredGroups.female.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm italic">
                                No students found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
