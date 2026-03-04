import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { Layout } from '@/shared/components/Layout';
import { LoginPage } from '@/features/auth/LoginPage';
import { PlannerPage } from '@/features/planner/PlannerPage';
import { ManageDashboard } from '@/features/manage/ManageDashboard';
import { PeoplePage } from '@/features/manage/PeoplePage';
import { PersonDetailPage } from '@/features/manage/PersonDetailPage';
import { ProjectsPage } from '@/features/manage/ProjectsPage';
import { ProjectDetailPage } from '@/features/manage/ProjectDetailPage';
import { SettingsPage } from '@/features/manage/SettingsPage';
import { RateCardsPage } from '@/features/manage/RateCardsPage';
import { RolesPage } from '@/features/manage/RolesPage';
import { ClientsPage } from '@/features/manage/ClientsPage';
import { ClientDetailPage } from '@/features/manage/ClientDetailPage';
import { TeamsPage } from '@/features/manage/TeamsPage';
import { SkillsPage } from '@/features/manage/SkillsPage';
import { TagsPage } from '@/features/manage/TagsPage';
import { InsightsPage } from '@/features/insights/InsightsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes — require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/planner/people" replace />} />
          <Route path="/planner/people" element={<PlannerPage />} />
          <Route path="/planner/projects" element={<PlannerPage />} />

          {/* Manage */}
          <Route path="/manage" element={<ManageDashboard />} />
          <Route path="/manage/people" element={<PeoplePage />} />
          <Route path="/manage/people/:id" element={<PersonDetailPage />} />
          <Route path="/manage/projects" element={<ProjectsPage />} />
          <Route path="/manage/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/manage/rate-cards" element={<RateCardsPage />} />
          <Route path="/manage/roles" element={<RolesPage />} />
          <Route path="/manage/clients" element={<ClientsPage />} />
          <Route path="/manage/clients/:id" element={<ClientDetailPage />} />
          <Route path="/manage/teams" element={<TeamsPage />} />
          <Route path="/manage/skills" element={<SkillsPage />} />
          <Route path="/manage/tags" element={<TagsPage />} />

          {/* Analyze */}
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
