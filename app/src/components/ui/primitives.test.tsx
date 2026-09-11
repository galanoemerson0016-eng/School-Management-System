import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Badge } from './Badge';

describe('Design System UI Primitives', () => {
    describe('Button', () => {
        it('renders primary button with DepEd brand styling', () => {
            render(<Button variant="primary">Submit Form</Button>);
            const btn = screen.getByRole('button', { name: /submit form/i });
            expect(btn).toBeDefined();
            expect(btn.className).toContain('bg-deped-blue');
        });

        it('renders loading state and disables button', () => {
            render(<Button isLoading>Saving</Button>);
            const btn = screen.getByRole('button');
            expect(btn.hasAttribute('disabled')).toBe(true);
        });

        it('renders with correct size classes', () => {
            render(<Button size="sm">Small Action</Button>);
            const btn = screen.getByRole('button', { name: /small action/i });
            expect(btn.className).toContain('h-8');
            expect(btn.className).toContain('text-xs');
        });
    });

    describe('Card', () => {
        it('renders structured card with header, title, and content', () => {
            render(
                <Card>
                    <CardHeader>
                        <CardTitle>School Statistics</CardTitle>
                        <CardDescription>Overview of student population</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Total: 1,240 learners</p>
                    </CardContent>
                    <CardFooter>
                        <span>Updated today</span>
                    </CardFooter>
                </Card>
            );

            expect(screen.getByText('School Statistics')).toBeDefined();
            expect(screen.getByText('Overview of student population')).toBeDefined();
            expect(screen.getByText('Total: 1,240 learners')).toBeDefined();
            expect(screen.getByText('Updated today')).toBeDefined();
        });
    });

    describe('Badge', () => {
        it('renders semantic success badge with dot', () => {
            const { container } = render(<Badge variant="success" dot>Passed</Badge>);
            expect(screen.getByText('Passed')).toBeDefined();
            expect(container.querySelector('.bg-emerald-500')).not.toBeNull();
        });

        it('renders brand badge for DepEd status', () => {
            render(<Badge variant="brand">Active S.Y.</Badge>);
            expect(screen.getByText('Active S.Y.')).toBeDefined();
        });
    });
});
