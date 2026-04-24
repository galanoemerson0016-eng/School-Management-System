import { useState } from 'react';
import { useAppStore } from '../../stores';
import type { Section, Student } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileText, AlertCircle, UserPlus, Info, Download, FileSpreadsheet } from 'lucide-react';
import { useRef } from 'react';

interface BulkStudentModalProps {
    open: boolean;
    section: Section | null;
    onClose: () => void;
}

export function BulkStudentModal({ open, section, onClose }: BulkStudentModalProps) {
    const { bulkAddStudents } = useAppStore();
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState<Partial<Student>[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!open || !section) return null;

    const parseNames = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const parsed: Partial<Student>[] = lines.map((line, index) => {
            // Support: Last, First, Middle, Gender OR Last\tFirst\tMiddle\tGender
            const parts = line.includes('\t') ? line.split('\t') : line.split(',').map(p => p.trim());
            
            let last = '';
            let first = '';
            let middle = '';
            let gender: 'Male' | 'Female' = 'Male';

            // Check if one of the parts looks like a gender
            const genderPart = parts.find(p => ['male', 'female', 'm', 'f'].includes(p.toLowerCase()));
            if (genderPart) {
                const g = genderPart.toLowerCase();
                gender = (g === 'male' || g === 'm') ? 'Male' : 'Female';
            }

            if (parts.length >= 2) {
                // If we found a gender, we try to exclude it from name parts if it's there
                const nameParts = parts.filter(p => !['male', 'female', 'm', 'f'].includes(p.toLowerCase()));
                last = nameParts[0] || '';
                first = nameParts[1] || '';
                middle = nameParts[2] || '';
            } else {
                const spaceParts = line.trim().split(/\s+/);
                if (spaceParts.length === 2) {
                    first = spaceParts[0];
                    last = spaceParts[1];
                } else if (spaceParts.length >= 3) {
                    first = spaceParts[0];
                    middle = spaceParts.slice(1, -1).join(' ');
                    last = spaceParts[spaceParts.length - 1];
                } else {
                    last = line.trim();
                }
            }

            return {
                lrn: `TEMP_${section.id}_${Date.now()}_${index}`,
                last_name: last,
                first_name: first,
                middle_name: middle,
                gender: gender,
                grade_level: section.section_grade_level,
                student_section: section.section_name,
                address: '',
                birthday: '2010-01-01',
                age: 12
            };
        });
        setPreview(parsed);
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            // Remove header if present
            const lines = content.split('\n');
            if (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('gender')) {
                setRawText(lines.slice(1).join('\n'));
                parseNames(lines.slice(1).join('\n'));
            } else {
                setRawText(content);
                parseNames(content);
            }
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const headers = 'Last Name,First Name,Middle Name,Gender (Male/Female)\n';
        const sample = 'Dela Cruz,Juan,Reyes,Male\nSantos,Maria,Lopez,Female\n';
        const blob = new Blob([headers + sample], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students_template.csv';
        a.click();
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setRawText(val);
        parseNames(val);
    };

    const handleSave = async () => {
        if (preview.length === 0) return;
        setIsProcessing(true);
        try {
            await bulkAddStudents(preview as Student[]);
            onClose();
            setRawText('');
            setPreview([]);
        } catch (error) {
            console.error('Bulk add failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-emerald-600 p-8 text-white relative shrink-0">
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 mb-1">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">Bulk Name Import</h3>
                            <p className="text-emerald-100/60 font-bold uppercase tracking-widest text-[9px]">
                                Section: {section.section_name} • {section.section_grade_level}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {/* Instructions */}
                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex flex-col md:flex-row gap-5 items-start">
                        <div className="flex gap-4">
                            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-[10px] text-emerald-800 leading-relaxed">
                                <p className="font-black uppercase mb-1">How to use:</p>
                                <p>You can paste names directly or upload a CSV file. Use the format: <span className="font-black">Last, First, Middle, Gender</span></p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button 
                                onClick={downloadTemplate}
                                className="flex-1 whitespace-nowrap px-4 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-3 h-3" />
                                Template
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".csv" 
                                onChange={handleCSVUpload}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 whitespace-nowrap px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <FileSpreadsheet className="w-3 h-3" />
                                Upload CSV
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Paste Names List</label>
                        <textarea 
                            value={rawText}
                            onChange={handleTextChange}
                            placeholder={"Dela Cruz, Juan, Reyes\nSantos, Maria, Lopez\n..."}
                            className="w-full h-48 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl p-5 text-sm font-bold transition-all outline-none resize-none font-mono"
                        />
                    </div>

                    {preview.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Preview ({preview.length} students)</label>
                                <span className="text-[9px] font-black text-emerald-600 uppercase">Will be saved as {section.section_name}</span>
                            </div>
                            <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                                {preview.slice(0, 10).map((p, i) => (
                                    <div key={i} className="px-5 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-black">
                                                {i + 1}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 uppercase">
                                                {p.last_name}, {p.first_name} {p.middle_name}
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${p.gender === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                            {p.gender}
                                        </span>
                                    </div>
                                ))}
                                {preview.length > 10 && (
                                    <div className="px-5 py-3 text-center text-[9px] font-bold text-slate-400 italic">
                                        And {preview.length - 10} more...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 pt-0 flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isProcessing || preview.length === 0}
                        className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Importing...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Import {preview.length} Students
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
