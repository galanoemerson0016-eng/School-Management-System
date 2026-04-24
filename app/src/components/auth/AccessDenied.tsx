import { ShieldAlert } from 'lucide-react';

export function AccessDenied({ title = 'Access Denied', message = 'You do not have permission to open this page.' }: { title?: string; message?: string }) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center p-8">
            <div className="max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <ShieldAlert className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">{title}</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">{message}</p>
            </div>
        </div>
    );
}