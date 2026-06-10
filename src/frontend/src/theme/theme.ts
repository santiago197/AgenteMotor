import { createTheme, alpha } from '@mui/material/styles';
import type { PolicyStatus } from '../types';

// Custom palette for policy statuses
export const policyStatusColors: Record<PolicyStatus, { main: string; light: string; dark: string }> = {
  VIGENTE: { main: '#4caf50', light: '#81c784', dark: '#388e3c' },
  PROXIMA_VENCER: { main: '#ff9800', light: '#ffb74d', dark: '#f57c00' },
  VENCIDA_RENOVABLE: { main: '#f57c00', light: '#ffb74d', dark: '#e65100' },
  VENCIDA_CRITICA: { main: '#f44336', light: '#e57373', dark: '#d32f2f' },
  VENCIDA_PERDIDA: { main: '#9e9e9e', light: '#bdbdbd', dark: '#757575' },
};

export const policyStatusLabels: Record<PolicyStatus, string> = {
  VIGENTE: 'Vigente',
  PROXIMA_VENCER: 'Próxima a vencer',
  VENCIDA_RENOVABLE: 'Vencida - Renovable',
  VENCIDA_CRITICA: 'Vencida - Crítica',
  VENCIDA_PERDIDA: 'Vencida - Perdida',
};

export function createAppTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#6C63FF',
        light: '#8B83FF',
        dark: '#4B44B2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#00D9FF',
        light: '#33E1FF',
        dark: '#00A3BF',
        contrastText: '#000000',
      },
      background: {
        default: isDark ? '#121212' : '#F1F5F9',
        paper: isDark ? '#1e1e1e' : '#ffffff',
      },
      error: {
        main: '#FF5252',
        light: '#FF7B7B',
        dark: '#D32F2F',
      },
      warning: {
        main: '#FFB74D',
        light: '#FFD180',
        dark: '#FF9800',
      },
      success: {
        main: '#69F0AE',
        light: '#B9F6CA',
        dark: '#00E676',
      },
      info: {
        main: '#40C4FF',
        light: '#80D8FF',
        dark: '#0091EA',
      },
      text: {
        primary: isDark ? '#F1F5F9' : '#0F172A',
        secondary: isDark ? '#94A3B8' : '#475569',
      },
      divider: alpha('#94A3B8', 0.12),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1.1rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        color: '#94A3B8',
      },
      body1: {
        fontSize: '0.938rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0 1px 3px rgba(0,0,0,0.3)',
      '0 2px 6px rgba(0,0,0,0.35)',
      '0 4px 12px rgba(0,0,0,0.4)',
      '0 6px 16px rgba(0,0,0,0.4)',
      '0 8px 24px rgba(0,0,0,0.45)',
      '0 12px 32px rgba(0,0,0,0.5)',
      '0 16px 40px rgba(0,0,0,0.5)',
      '0 20px 48px rgba(0,0,0,0.55)',
      '0 24px 56px rgba(0,0,0,0.55)',
      '0 28px 64px rgba(0,0,0,0.6)',
      '0 32px 72px rgba(0,0,0,0.6)',
      '0 36px 80px rgba(0,0,0,0.65)',
      '0 40px 88px rgba(0,0,0,0.65)',
      '0 44px 96px rgba(0,0,0,0.7)',
      '0 48px 104px rgba(0,0,0,0.7)',
      '0 52px 112px rgba(0,0,0,0.75)',
      '0 56px 120px rgba(0,0,0,0.75)',
      '0 60px 128px rgba(0,0,0,0.8)',
      '0 64px 136px rgba(0,0,0,0.8)',
      '0 68px 144px rgba(0,0,0,0.85)',
      '0 72px 152px rgba(0,0,0,0.85)',
      '0 76px 160px rgba(0,0,0,0.9)',
      '0 80px 168px rgba(0,0,0,0.9)',
      '0 84px 176px rgba(0,0,0,0.95)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: '#374151 transparent',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: '#374151',
              borderRadius: 3,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(108, 99, 255, 0.6)',
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.08)',
            backgroundImage: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              '& fieldset': {
                borderColor: 'rgba(148, 163, 184, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(148, 163, 184, 0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#6C63FF',
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.03em',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: 'rgba(148, 163, 184, 0.08)',
          },
          head: {
            fontWeight: 600,
            color: '#94A3B8',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.1)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            '&.Mui-selected': {
              backgroundColor: 'rgba(108, 99, 255, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(108, 99, 255, 0.25)',
              },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.8rem',
            backgroundColor: isDark ? '#1E293B' : '#334155',
            border: '1px solid rgba(148, 163, 184, 0.1)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });
}

export default createAppTheme('dark');
