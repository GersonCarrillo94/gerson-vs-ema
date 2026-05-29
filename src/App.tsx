import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/features/scoring/components/ToastProvider';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { LinkPartnerPage } from '@/pages/auth/LinkPartnerPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { LessonsMapPage } from '@/pages/lessons/LessonsMapPage';
import { SublevelPage } from '@/pages/lessons/SublevelPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { MeetingsPage } from '@/pages/meetings/MeetingsPage';
import { PartnerProgressPage } from '@/pages/partner/PartnerProgressPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      {/* AuthProvider se monta una sola vez y gestiona toda la sesión */}
      <AuthProvider />
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Ruta semi-protegida: requiere sesión pero no compañero */}
          <Route
            path="/link-partner"
            element={
              <AuthGuard>
                <LinkPartnerPage />
              </AuthGuard>
            }
          />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/lessons"
            element={
              <AuthGuard>
                <AppLayout>
                  <LessonsMapPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/lessons/:id"
            element={
              <AuthGuard>
                <AppLayout>
                  <SublevelPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/chat"
            element={
              <AuthGuard>
                <AppLayout>
                  <ChatPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/meetings"
            element={
              <AuthGuard>
                <AppLayout>
                  <MeetingsPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/partner"
            element={
              <AuthGuard>
                <AppLayout>
                  <PartnerProgressPage />
                </AppLayout>
              </AuthGuard>
            }
          />

          <Route
            path="/settings"
            element={
              <AuthGuard>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </AuthGuard>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
