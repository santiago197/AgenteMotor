import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useThemeStore } from './store/themeStore';
import { createAppTheme } from './theme/theme';
import { queryClient } from './lib/queryClient';
import Router from './router';

function App() {
  const { mode } = useThemeStore();
  const theme = createAppTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
