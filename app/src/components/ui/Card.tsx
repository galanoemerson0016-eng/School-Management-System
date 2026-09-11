import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    bordered?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', bordered = true, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 rounded-lg shadow-2xs ${
                    bordered ? 'border border-slate-200 dark:border-slate-800' : ''
                } ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`flex flex-col space-y-1 p-4 pb-2 border-b border-slate-100 dark:border-slate-800/60 ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <h3
                ref={ref}
                className={`text-sm font-semibold tracking-tight text-slate-900 dark:text-white ${className}`}
                {...props}
            >
                {children}
            </h3>
        );
    }
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <p
                ref={ref}
                className={`text-xs text-slate-500 dark:text-slate-400 ${className}`}
                {...props}
            >
                {children}
            </p>
        );
    }
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div ref={ref} className={`p-4 ${className}`} {...props}>
                {children}
            </div>
        );
    }
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`flex items-center p-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);
CardFooter.displayName = 'CardFooter';
