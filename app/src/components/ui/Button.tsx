import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'secondary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'inline-flex items-center justify-center font-medium select-none cursor-pointer transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deped-blue/30 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98]';

        const variantStyles = {
            primary:
                'bg-deped-blue hover:bg-[#072C6B] text-white border border-transparent shadow-2xs',
            secondary:
                'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs',
            outline:
                'bg-transparent text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800',
            ghost:
                'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
            destructive:
                'bg-rose-600 hover:bg-rose-700 text-white border border-transparent shadow-2xs',
            success:
                'bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent shadow-2xs',
        };

        const sizeStyles = {
            sm: 'h-8 px-2.5 text-xs rounded-md gap-1.5',
            md: 'h-9 px-3.5 text-xs rounded-md gap-2',
            lg: 'h-10 px-4 text-sm rounded-md gap-2',
            icon: 'h-8 w-8 p-0 rounded-md',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-current" />
                ) : (
                    leftIcon && <span className="shrink-0">{leftIcon}</span>
                )}
                {children}
                {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';
