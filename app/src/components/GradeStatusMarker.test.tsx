import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GradeStatusMarker } from './GradeStatusMarker';

describe('GradeStatusMarker', () => {
  it('labels provisional subject finals and averages clearly', () => {
    const { rerender } = render(<GradeStatusMarker status="provisional" kind="subject" />);
    expect(screen.getByLabelText('Provisional subject final').textContent).toBe('P');

    rerender(<GradeStatusMarker status="provisional" kind="average" />);
    expect(screen.getByLabelText('Provisional average').textContent).toBe('PROV');
  });

  it('keeps complete and missing grades free from provisional markers', () => {
    const { rerender } = render(<GradeStatusMarker status="complete" kind="average" />);
    expect(screen.queryByText('PROV')).toBeNull();

    rerender(<GradeStatusMarker status="missing" kind="subject" />);
    expect(screen.queryByText('P')).toBeNull();
  });
});
