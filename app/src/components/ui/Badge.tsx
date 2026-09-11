import React, { forwardRef } from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'outline';
    size?: 'sm' | 'md';
    dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    (
        {
            children,
            variant = 'default',
            size = 'sm',
            dot = false,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'inline-flex items-center font-semibold uppercase tracking-wider rounded-md select-none leading-none';

        const variantStyles = {
            default:
                'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
            brand:
                'bg-blue-50 dark:bg-blue-950/50 text-deped-blue dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50',
            success:
                'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
            warning:
                'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50',
            danger:
                'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50',
            outline:
                'bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
        };

        const dotColors = {
            default: 'bg-slate-400',
            brand: 'bg-deped-blue dark:bg-blue-400',
            success: 'bg-emerald-500',
            warning: 'bg-amber-500',
            danger: 'bg-rose-500',
            outline: 'bg-slate-400',
        };

        const sizeStyles = {
            sm: 'px-1.5 py-0.5 text-[10px] gap-1',
            md: 'px-2 py-1 text-[11px] gap-1.5',
        };

        return (
            <span
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
                {...props}
            >
                {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
