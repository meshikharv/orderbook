import { trustColor, trustLabel } from '../utils/format';

interface Props {
  score: number;
  showLabel?: boolean;
}

export function TrustBadge({ score, showLabel = false }: Props) {
  const color = trustColor(score);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: color + '22', color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {score}{showLabel && ` · ${trustLabel(score)}`}
    </span>
  );
}
