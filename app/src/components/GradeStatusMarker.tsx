import type { GradeCompletionStatus } from '../services/grade-calculation';

interface GradeStatusMarkerProps {
  status: GradeCompletionStatus | undefined;
  kind: 'subject' | 'average';
}

export function GradeStatusMarker({ status, kind }: GradeStatusMarkerProps) {
  if (status !== 'provisional') return null;

  const label = kind === 'average' ? 'PROV' : 'P';
  const description = kind === 'average' ? 'Provisional average' : 'Provisional subject final';
  return (
    <span
      aria-label={description}
      className="text-[7px] font-black text-amber-600"
      title={description}
    >
      {label}
    </span>
  );
}
