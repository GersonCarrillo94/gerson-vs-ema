import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { LessonsMapPage } from '@/pages/lessons/LessonsMapPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { MeetingsPage } from '@/pages/meetings/MeetingsPage';
import { PartnerProgressPage } from '@/pages/partner/PartnerProgressPage';

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
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
