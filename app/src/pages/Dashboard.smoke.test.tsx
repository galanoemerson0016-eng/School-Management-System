import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Mock heavy dependencies that require browser APIs or external services ──

vi.mock('../stores', () => ({
    useAppStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
        selector({
            students: [],
            sections: [],
            subjects: [],
            schoolYears: [],
            announcements: [],
            classRecords: [],
            enrollments: [],
            attendanceRecords: [],
            activeSchoolYear: '2026-2027',
            schoolProfile: { name: 'Demo School', head_name: '' },
            gradingSheetRecords: [{ id: 'grade-1', student_lrn: '123', subject_id: 'sub-1', quarter: 1, final_grade: '85' }],
            observedValues: [],
            hpsRecords: [],
            sf2Sheets: [],
            isSyncReady: true,
        })
    ),
}));

vi.mock('../stores/auth-store', () => ({
    useAuthStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
        selector({
            user: { uid: 'test-uid', displayName: 'Teacher Demo', role: 'teacher', section: '' },
        })
    ),
}));

// framer-motion: render children without animations so layout effects don't error
vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_target, tag: string) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ({ children, ...props }: any) => React.createElement(tag, props, children),
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: () => false,
}));

// Lucide icons: replace with simple spans to avoid SVG issues in jsdom
vi.mock('lucide-react', () => {
    const mockIcon = (name: string) => (props: Record<string, unknown>) => React.createElement('span', { 'data-icon': name, ...props });
    return {
        Users: mockIcon('Users'),
        Calendar: mockIcon('Calendar'),
        Bell: mockIcon('Bell'),
        Trophy: mockIcon('Trophy'),
        AlertTriangle: mockIcon('AlertTriangle'),
        ChevronLeft: mockIcon('ChevronLeft'),
        ChevronRight: mockIcon('ChevronRight'),
        Clock: mockIcon('Clock'),
        ListChecks: mockIcon('ListChecks'),
        Search: mockIcon('Search'),
        Plus: mockIcon('Plus'),
        Activity: mockIcon('Activity'),
        HelpCircle: mockIcon('HelpCircle'),
        Layers: mockIcon('Layers'),
    };
});

import { Dashboard } from './Dashboard';

describe('Dashboard (smoke)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing with empty store state', () => {
        expect(() => render(<Dashboard />)).not.toThrow();
    });

    it('shows the school year in the rendered output', () => {
        render(<Dashboard />);
        expect(screen.getByText(/2026-2027/i)).toBeTruthy();
    });

    it('renders an enrollment count of 0 when no students', () => {
        render(<Dashboard />);
        // The dashboard should show "0" somewhere for enrollment
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThan(0);
    });
});
