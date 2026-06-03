import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import type { LogEntry } from '../types';
import dayjs from 'dayjs';

interface LogTimelineProps {
  logs: LogEntry[];
}

const ACTION_ICONS: Record<string, typeof NoteAltIcon> = {
  LLAMADA: PhoneIcon,
  EMAIL: EmailIcon,
  VISITA: EventIcon,
  RENOVACION: HistoryIcon,
};

const ACTION_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
  LLAMADA: 'primary',
  EMAIL: 'info',
  VISITA: 'success',
  RENOVACION: 'warning',
};

export default function LogTimeline({ logs }: LogTimelineProps) {
  if (logs.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 6,
          color: 'text.secondary',
        }}
      >
        <HistoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.4 }} />
        <Typography variant="body1">No hay gestiones registradas</Typography>
      </Box>
    );
  }

  return (
    <Timeline position="alternate">
      {logs.map((log, index) => {
        const IconComponent = ACTION_ICONS[log.accion] ?? NoteAltIcon;
        const dotColor = ACTION_COLORS[log.accion] ?? 'primary';

        return (
          <TimelineItem key={log.id}>
            <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
              {dayjs(log.fecha).format('DD/MM/YYYY HH:mm')}
            </TimelineOppositeContent>
            <TimelineSeparator>
              {index > 0 && <TimelineConnector sx={{ bgcolor: `${dotColor}.dark` }} />}
              <TimelineDot color={dotColor} variant="outlined">
                <IconComponent fontSize="small" />
              </TimelineDot>
              {index < logs.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent sx={{ py: '12px', px: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {log.accion}
                </Typography>
                {log.notas && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {log.notas}
                  </Typography>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
