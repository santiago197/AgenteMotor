import Chip from '@mui/material/Chip';
import type { PolicyStatus } from '../types';
import { policyStatusColors, policyStatusLabels } from '../theme/theme';

interface PolicyStatusChipProps {
  status: PolicyStatus;
  size?: 'small' | 'medium';
}

export default function PolicyStatusChip({ status, size = 'small' }: PolicyStatusChipProps) {
  const color = policyStatusColors[status];

  return (
    <Chip
      label={policyStatusLabels[status]}
      size={size}
      sx={{
        backgroundColor: `${color.main}20`,
        color: color.light,
        borderColor: `${color.main}40`,
        border: '1px solid',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        letterSpacing: '0.03em',
      }}
    />
  );
}
