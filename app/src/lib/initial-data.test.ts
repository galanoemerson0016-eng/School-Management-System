import { describe, it, expect } from 'vitest';
import { initialSections, initialStudents, initialClassRecords } from './initial-data';

describe('Production Initial Data', () => {
    it('should have empty sections for clean client production installation', () => {
        expect(initialSections).toEqual([]);
    });

    it('should have empty students for clean client production installation', () => {
        expect(initialStudents).toEqual([]);
    });

    it('should have empty class records for clean client production installation', () => {
        expect(initialClassRecords).toEqual([]);
    });
});
