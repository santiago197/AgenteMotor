import type { ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { PolicyStatus } from '../types';
import { policyStatusColors } from '../theme/theme';

interface DashboardCardProps {
  title: string;
  count: number;
  status: PolicyStatus;
  onClick: () => void;
  icon: ReactNode;
  loading?: boolean;
  active?: boolean;
}

export default function DashboardCard({
  title,
  count,
  status,
  onClick,
  icon,
  loading = false,
  active = false,
}: DashboardCardProps) {
  const color = policyStatusColors[status];

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={48} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: active
          ? `linear-gradient(135deg, ${color.main}15 0%, ${color.dark}10 100%)`
          : 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
        border: active
          ? `1.5px solid ${color.main}60`
          : '1px solid rgba(148, 163, 184, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 40px ${color.main}25`,
          borderColor: `${color.main}40`,
        },
      }}
    >
      {/* Glow effect */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color.main}15 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: `${color.main}15`,
              color: color.main,
              mb: 2,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              color: color.main,
              fontWeight: 800,
              fontSize: '2rem',
              lineHeight: 1,
            }}
          >
            {count}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
