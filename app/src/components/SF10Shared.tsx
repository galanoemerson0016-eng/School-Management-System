/* eslint-disable react-refresh/only-export-components */
import React from 'react';

export interface BoundData {
    [key: string]: unknown;
}

export type AnyObject = Record<string, unknown>;

export const asString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
};

export interface SF10RendererProps {
    pageNumber: number;
    data: BoundData;
    onUpdate?: (path: string, value: string) => void;
    dbSubjects?: Array<{ id: string; subject_name: string; subject_code?: string; grade_level?: string }>;
}

export const AutoShrinkText: React.FC<{ text: string; minScale?: number; align?: 'left' | 'center' | 'right' }> = ({ text, minScale = 0.5, align = 'center' }) => {
    const [scale, setScale] = React.useState(1);
    const textRef = React.useRef<HTMLSpanElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        const updateScale = () => {
            if (textRef.current && containerRef.current) {
                const textWidth = textRef.current.scrollWidth;
                const containerWidth = containerRef.current.clientWidth;
                if (textWidth > containerWidth && containerWidth > 0) {
                    setScale(Math.max(minScale, containerWidth / textWidth));
                } else {
                    setScale(1);
                }
            }
        };

        updateScale();

        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            const ro = new ResizeObserver(() => {
                updateScale();
            });
            ro.observe(containerRef.current);
            return () => ro.disconnect();
        }
    }, [text, minScale]);

    const justifyClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
    const originX = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';

    return (
        <div ref={containerRef} className={`w-full h-full flex items-end ${justifyClass} overflow-hidden relative`}>
            <span
                ref={textRef}
                className="inline-block whitespace-nowrap"
                style={{
                    transform: `scaleX(${scale})`,
                    transformOrigin: `${originX} bottom`,
                }}
            >
                {text}
            </span>
        </div>
    );
};

import {
    type SF10EducationLevel,
    getEducationLevel,
    getSubjectGroupsForLevel,
    filterDbSubjectsForLevel,
    ELEM_DEPED_CORE_SUBJECTS,
    ELEM_DEPED_OLD_K12_SUBJECTS,
    ELEM_SPECIAL_PROGRAMS,
    JHS_DEPED_CORE_SUBJECTS,
    JHS_DEPED_OLD_K12_SUBJECTS,
    JHS_TVE_ELECTIVES,
    JHS_SPECIAL_PROGRAMS,
    SHS_CORE_SUBJECTS,
    SHS_APPLIED_SUBJECTS,
    SHS_SPECIALIZED_SUBJECTS
} from '../lib/sf10Subjects';

export {
    type SF10EducationLevel,
    getEducationLevel,
    getSubjectGroupsForLevel,
    filterDbSubjectsForLevel,
    ELEM_DEPED_CORE_SUBJECTS,
    ELEM_DEPED_OLD_K12_SUBJECTS,
    ELEM_SPECIAL_PROGRAMS,
    JHS_DEPED_CORE_SUBJECTS,
    JHS_DEPED_OLD_K12_SUBJECTS,
    JHS_TVE_ELECTIVES,
    JHS_SPECIAL_PROGRAMS,
    SHS_CORE_SUBJECTS,
    SHS_APPLIED_SUBJECTS,
    SHS_SPECIALIZED_SUBJECTS
};

// Backwards-compatible aliases
export const DEPED_CORE_SUBJECTS = JHS_DEPED_CORE_SUBJECTS;
export const DEPED_OLD_K12_SUBJECTS = JHS_DEPED_OLD_K12_SUBJECTS;
export const TVE_ELECTIVES = JHS_TVE_ELECTIVES;
export const SPECIAL_PROGRAM_SUBJECTS = JHS_SPECIAL_PROGRAMS;

export interface SF10SubjectComboboxProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    level?: SF10EducationLevel;
    gradeLevel?: string | number;
    dbSubjects?: Array<{ id: string; subject_name: string; subject_code?: string; grade_level?: string }>;
    className?: string;
    inputClassName?: string;
    isComponent?: boolean;
}

/**
 * Interactive Subject Combobox for SF10:
 * Enforces strict educational level filtering:
 * - Elementary forms ONLY show Elementary subjects.
 * - JHS forms ONLY show JHS subjects.
 * - SHS forms ONLY show SHS subjects.
 * Includes "-- Blank (Hide Row) --" option and custom free-typing.
 */
export const SF10SubjectCombobox: React.FC<SF10SubjectComboboxProps> = ({
    value,
    onChange,
    placeholder = '',
    level,
    gradeLevel,
    dbSubjects = [],
    className = '',
    inputClassName = '',
}) => {
    const effectiveLevel = level || getEducationLevel(gradeLevel, 'jhs');
    const optionGroups = getSubjectGroupsForLevel(effectiveLevel);
    const allStandardForLevel = optionGroups.flatMap(g => g.subjects);
    const customDbSubjects = filterDbSubjectsForLevel(dbSubjects, effectiveLevel, allStandardForLevel);

    return (
        <div className={`relative group flex items-center w-full min-w-0 ${className}`}>
            <input
                type="text"
                className={`w-full border-none bg-transparent focus:outline-none focus:bg-amber-50/70 uppercase print:placeholder:text-transparent pr-4 ${inputClassName}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            {/* Subtle dropdown button on hover / focus */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity print:hidden pointer-events-auto">
                <div className="relative flex items-center bg-slate-100/90 hover:bg-blue-100 border border-slate-300 rounded px-1 py-0.5 text-[9px] text-slate-700 shadow-xs cursor-pointer">
                    <span className="text-[8px] font-bold">▾</span>
                    <select
                        value=""
                        onChange={(e) => {
                            const selected = e.target.value;
                            if (selected === '__blank__') {
                                onChange('');
                            } else if (selected) {
                                onChange(selected);
                            }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Click to choose a subject or hide/blank row"
                    >
                        <option value="" disabled>-- Select Subject --</option>
                        <option value="__blank__">🚫 -- Blank (Hide Row) --</option>
                        {optionGroups.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                                {group.subjects.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </optgroup>
                        ))}
                        {customDbSubjects.length > 0 && (
                            <optgroup label={`🏫 School Database Subjects (${effectiveLevel.toUpperCase()})`}>
                                {customDbSubjects.map((s) => (
                                    <option key={s.id} value={s.subject_name}>{s.subject_name}</option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>
            </div>
        </div>
    );
};

export interface SF10RemarkComboboxProps {
    value: string;
    onChange?: (val: string) => void;
    disabled?: boolean;
    className?: string;
    inputClassName?: string;
}

/**
 * SF10RemarkCombobox provides an in-place editable remark cell for learning areas
 * with quick dropdown selection of "PASSED", "FAILED", or clear, while also allowing custom typing.
 */
export const SF10RemarkCombobox: React.FC<SF10RemarkComboboxProps> = ({
    value,
    onChange,
    disabled = false,
    className = '',
    inputClassName = '',
}) => {
    if (disabled) {
        return (
            <input
                type="text"
                disabled
                className={`w-full text-center border-none bg-transparent uppercase focus:outline-none text-[8.3px] disabled:opacity-0 ${inputClassName}`}
                value=""
                readOnly
            />
        );
    }

    return (
        <div className={`relative group flex items-center justify-center w-full min-w-0 ${className}`}>
            <input
                type="text"
                className={`w-full text-center border-none bg-transparent uppercase focus:outline-none focus:bg-amber-50/70 text-[8.3px] pr-2.5 ${inputClassName}`}
                value={value}
                onChange={(e) => onChange?.(e.target.value.toUpperCase())}
            />
            {/* Dropdown trigger button */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity print:hidden pointer-events-auto">
                <div className="relative flex items-center bg-slate-100/90 hover:bg-blue-100 border border-slate-300 rounded px-0.5 py-0.2 text-[8px] text-slate-700 shadow-xs cursor-pointer">
                    <span className="text-[7px] font-bold">▾</span>
                    <select
                        value=""
                        onChange={(e) => {
                            const selected = e.target.value;
                            if (selected === '__blank__') {
                                onChange?.('');
                            } else if (selected) {
                                onChange?.(selected);
                            }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Click to choose remark (PASSED / FAILED)"
                    >
                        <option value="" disabled>-- Select Remark --</option>
                        <option value="PASSED">PASSED</option>
                        <option value="FAILED">FAILED</option>
                        <option value="__blank__">🚫 -- Clear / Blank --</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export interface SF10GeneralAverageRemarkComboboxProps {
    value: string;
    onChange?: (val: string) => void;
    className?: string;
    inputClassName?: string;
}

/**
 * SF10GeneralAverageRemarkCombobox provides an in-place editable remark cell for the General Average row
 * with quick dropdown selection of "PROMOTED", "RETAINED", or clear, while also allowing custom typing.
 */
export const SF10GeneralAverageRemarkCombobox: React.FC<SF10GeneralAverageRemarkComboboxProps> = ({
    value,
    onChange,
    className = '',
    inputClassName = '',
}) => {
    return (
        <div className={`relative group flex items-center justify-center w-full min-w-0 ${className}`}>
            <input
                type="text"
                className={`w-full text-center border-none bg-transparent uppercase font-bold focus:outline-none focus:bg-amber-50/70 text-[8.3px] pr-2.5 ${inputClassName}`}
                value={value}
                onChange={(e) => onChange?.(e.target.value.toUpperCase())}
            />
            {/* Dropdown trigger button */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity print:hidden pointer-events-auto">
                <div className="relative flex items-center bg-slate-100/90 hover:bg-blue-100 border border-slate-300 rounded px-0.5 py-0.2 text-[8px] text-slate-700 shadow-xs cursor-pointer">
                    <span className="text-[7px] font-bold">▾</span>
                    <select
                        value=""
                        onChange={(e) => {
                            const selected = e.target.value;
                            if (selected === '__blank__') {
                                onChange?.('');
                            } else if (selected) {
                                onChange?.(selected);
                            }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Click to choose status (PROMOTED / RETAINED)"
                    >
                        <option value="" disabled>-- Select Status --</option>
                        <option value="PROMOTED">PROMOTED</option>
                        <option value="RETAINED">RETAINED</option>
                        <option value="__blank__">🚫 -- Clear / Blank --</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export interface EditableSpanProps {
    value: string;
    onChange?: (val: string) => void;
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    align?: 'left' | 'center' | 'right';
    style?: React.CSSProperties;
}

/**
 * EditableSpan allows direct in-place editing of scholastic header & learner detail lines on the SF10 form.
 * In print mode, it renders borderless text matching official DepEd styling.
 */
export const EditableSpan: React.FC<EditableSpanProps> = ({
    value,
    onChange,
    className = '',
    inputClassName = '',
    placeholder = '',
    align = 'center',
    style
}) => {
    const [isEditing, setIsEditing] = React.useState(false);

    if (!onChange) {
        return (
            <span className={`${className} min-w-0`} style={style}>
                <AutoShrinkText align={align} text={value} />
            </span>
        );
    }

    if (isEditing) {
        return (
            <span className={`${className} min-w-0 relative bg-amber-50/80 ring-1 ring-blue-400 rounded-xs`} style={style}>
                <input
                    type="text"
                    autoFocus
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                            setIsEditing(false);
                        }
                    }}
                    placeholder={placeholder}
                    className={`w-full h-full border-none bg-transparent focus:outline-none uppercase print:placeholder:text-transparent ${inputClassName}`}
                    style={{ textAlign: align, fontWeight: 'inherit', fontSize: 'inherit', fontFamily: 'inherit' }}
                />
            </span>
        );
    }

    return (
        <span
            className={`${className} min-w-0 cursor-pointer hover:bg-amber-50/60 transition-colors group relative`}
            style={style}
            onClick={() => setIsEditing(true)}
            title="Click to edit"
        >
            <AutoShrinkText align={align} text={value || placeholder} />
        </span>
    );
};
