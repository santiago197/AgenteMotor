import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/Login/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ClientesListPage from '../pages/Clients/ClientesListPage';
import ClienteFormPage from '../pages/Clients/ClienteFormPage';
import ClienteDetallePage from '../pages/Clients/ClienteDetallePage';
import PolizasInformePage from '../pages/Policies/PolizasInformePage';
import PolizaDetallePage from '../pages/Policy/PolizaDetallePage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'clientes', element: <ClientesListPage /> },
      { path: 'clientes/nuevo', element: <ClienteFormPage /> },
      { path: 'clientes/:id', element: <ClienteDetallePage /> },
      { path: 'clientes/:id/editar', element: <ClienteFormPage /> },
      { path: 'polizas', element: <PolizasInformePage /> },
      { path: 'polizas/:id', element: <PolizaDetallePage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
