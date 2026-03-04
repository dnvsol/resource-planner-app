import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  Person,
  PersonDetail,
  Project,
  ProjectDetail,
  Assignment,
  Team,
  Role,
  Client,
  Skill,
  Tag,
  Contract,
  ScheduledLeave,
  RateCard,
  OtherExpense,
  ProjectRate,
  ProjectFinancials,
  UtilizationData,
  CapacityData,
  ApiResponse,
  PaginatedResponse,
} from '@dnvsol/shared';

// Re-export domain types so consumers can import them from hooks
export type {
  Person,
  PersonDetail,
  PersonSkill,
  Project,
  ProjectDetail,
  ProjectPhase,
  Assignment,
  Team,
  Role,
  Client,
  Skill,
  Tag,
  Contract,
  ScheduledLeave,
  RateCard,
  RateCardEntry,
  OtherExpense,
  ProjectRate,
  ProjectFinancials,
  UtilizationData,
  CapacityData,
} from '@dnvsol/shared';

// ---------------------------------------------------------------------------
// Query key factory — centralised so mutations can invalidate consistently
// ---------------------------------------------------------------------------

export const queryKeys = {
  people: {
    all: ['people'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['people', 'list', filters] as const,
    detail: (id: string) => ['people', 'detail', id] as const,
    contracts: (personId: string) =>
      ['people', personId, 'contracts'] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['projects', 'list', filters] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },
  assignments: {
    all: ['assignments'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['assignments', 'list', filters] as const,
  },
  teams: ['teams'] as const,
  roles: ['roles'] as const,
  clients: ['clients'] as const,
  skills: ['skills'] as const,
  tags: ['tags'] as const,
  leaves: {
    all: ['leaves'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['leaves', 'list', filters] as const,
  },
  rateCards: {
    all: ['rateCards'] as const,
    detail: (id: string) => ['rateCards', 'detail', id] as const,
  },
  otherExpenses: (projectId: string) =>
    ['projects', projectId, 'otherExpenses'] as const,
  projectRates: (projectId: string) =>
    ['projects', projectId, 'rates'] as const,
  projectFinancials: (projectId: string) =>
    ['projects', projectId, 'financials'] as const,
  insights: {
    utilization: (startDate: string, endDate: string) =>
      ['insights', 'utilization', startDate, endDate] as const,
    capacity: (startDate: string, endDate: string, period: string) =>
      ['insights', 'capacity', startDate, endDate, period] as const,
  },
  reports: {
    projects: (startDate?: string, endDate?: string) =>
      ['reports', 'projects', startDate, endDate] as const,
    profitability: (startDate?: string, endDate?: string) =>
      ['reports', 'profitability', startDate, endDate] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Generic fetcher helpers
// ---------------------------------------------------------------------------

async function fetchPaginated<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<T>> {
  const { data } = await apiClient.get<PaginatedResponse<T>>(url, { params });
  return data;
}

async function fetchOne<T>(url: string): Promise<T> {
  const { data } = await apiClient.get<ApiResponse<T>>(url);
  return data.data;
}

async function fetchArray<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const { data } = await apiClient.get<ApiResponse<T[]>>(url, { params });
  return data.data;
}

// ---------------------------------------------------------------------------
// People hooks
// ---------------------------------------------------------------------------

export function usePeople(
  filters?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Person>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.people.list(filters),
    queryFn: () => fetchPaginated<Person>('/people', filters),
    ...options,
  });
}

export function usePerson(
  id: string,
  options?: Omit<UseQueryOptions<PersonDetail>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.people.detail(id),
    queryFn: () => fetchOne<PersonDetail>(`/people/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useContracts(
  personId: string,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Contract>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.people.contracts(personId),
    queryFn: () =>
      fetchPaginated<Contract>(`/people/${personId}/contracts`),
    enabled: !!personId,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Projects hooks
// ---------------------------------------------------------------------------

export function useProjects(
  filters?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Project>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => fetchPaginated<Project>('/projects', filters),
    ...options,
  });
}

export function useProject(
  id: string,
  options?: Omit<UseQueryOptions<ProjectDetail>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => fetchOne<ProjectDetail>(`/projects/${id}`),
    enabled: !!id,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Assignments hooks
// ---------------------------------------------------------------------------

export function useAssignments(
  filters?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Assignment>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.assignments.list(filters),
    queryFn: () => fetchPaginated<Assignment>('/assignments', filters),
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Organisation entity hooks
// ---------------------------------------------------------------------------

export function useTeams(
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Team>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: () => fetchPaginated<Team>('/teams'),
    ...options,
  });
}

export function useRoles(
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Role>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: () => fetchPaginated<Role>('/roles'),
    ...options,
  });
}

export function useClients(
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Client>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: () => fetchPaginated<Client>('/clients'),
    ...options,
  });
}

export function useSkills(
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Skill>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: () => fetchPaginated<Skill>('/skills'),
    ...options,
  });
}

export function useTags(
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Tag>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => fetchPaginated<Tag>('/tags'),
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Leaves hooks
// ---------------------------------------------------------------------------

export function useLeaves(
  filters?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<ScheduledLeave>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: queryKeys.leaves.list(filters),
    queryFn: () => fetchPaginated<ScheduledLeave>('/leaves', filters),
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks — People
// ---------------------------------------------------------------------------

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<Person>) => {
      const { data } = await apiClient.post<ApiResponse<Person>>(
        '/people',
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Person> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Person>>(
        `/people/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.people.detail(variables.id),
      });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/people/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks — Projects
// ---------------------------------------------------------------------------

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<Project>) => {
      const { data } = await apiClient.post<ApiResponse<Project>>(
        '/projects',
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: Partial<Project> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Project>>(
        `/projects/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.id),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks — Assignments
// ---------------------------------------------------------------------------

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<Assignment>) => {
      const { data } = await apiClient.post<ApiResponse<Assignment>>(
        '/assignments',
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      // Assignments affect person and project detail views
      queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: Partial<Assignment> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Assignment>>(
        `/assignments/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks — Clients
// ---------------------------------------------------------------------------

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string }) => {
      const { data } = await apiClient.post<ApiResponse<Client>>('/clients', body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Client>>(`/clients/${id}`, body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks — Teams
// ---------------------------------------------------------------------------

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string }) => {
      const { data } = await apiClient.post<ApiResponse<Team>>('/teams', body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Team>>(
        `/teams/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks — Roles
// ---------------------------------------------------------------------------

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      name: string;
      defaultHourlyRate: number;
      defaultHourlyCost: number;
    }) => {
      const { data } = await apiClient.post<ApiResponse<Role>>('/roles', body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      defaultHourlyRate?: number;
      defaultHourlyCost?: number;
    }) => {
      const { data } = await apiClient.patch<ApiResponse<Role>>(
        `/roles/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks — Skills
// ---------------------------------------------------------------------------

export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string }) => {
      const { data } = await apiClient.post<ApiResponse<Skill>>(
        '/skills',
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Skill>>(
        `/skills/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks — Tags
// ---------------------------------------------------------------------------

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string; entityType: Tag['entityType'] }) => {
      const { data } = await apiClient.post<ApiResponse<Tag>>('/tags', body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
    }) => {
      const { data } = await apiClient.patch<ApiResponse<Tag>>(
        `/tags/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
    },
  });
}

// ---------------------------------------------------------------------------
// Rate Cards hooks
// ---------------------------------------------------------------------------

export function useRateCards() {
  return useQuery({
    queryKey: queryKeys.rateCards.all,
    queryFn: () => fetchArray<RateCard>('/rate-cards'),
  });
}

export function useRateCard(id: string) {
  return useQuery({
    queryKey: queryKeys.rateCards.detail(id),
    queryFn: () => fetchOne<RateCard & { entries: Array<{ id: string; role_id: string; rate_hourly: number; rate_daily: number; role_name: string }> }>(`/rate-cards/${id}`),
    enabled: !!id,
  });
}

export function useCreateRateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; cardType?: string; rateMode?: string; isDefault?: boolean }) => {
      const { data } = await apiClient.post<ApiResponse<RateCard>>('/rate-cards', body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rateCards.all });
    },
  });
}

export function useUpdateRateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; cardType?: string; rateMode?: string; isDefault?: boolean }) => {
      const { data } = await apiClient.put<ApiResponse<RateCard>>(`/rate-cards/${id}`, body);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rateCards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rateCards.detail(variables.id) });
    },
  });
}

export function useDeleteRateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/rate-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rateCards.all });
    },
  });
}

export function useCreateRateCardEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rateCardId, ...body }: { rateCardId: string; roleId: string; rateHourly?: number; rateDaily?: number }) => {
      const { data } = await apiClient.post<ApiResponse<unknown>>(`/rate-cards/${rateCardId}/entries`, body);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rateCards.detail(variables.rateCardId) });
    },
  });
}

export function useUpdateRateCardEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rateCardId, entryId, ...body }: { rateCardId: string; entryId: string; rateHourly?: number; rateDaily?: number }) => {
      const { data } = await apiClient.put<ApiResponse<unknown>>(`/rate-cards/${rateCardId}/entries/${entryId}`, body);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rateCards.detail(variables.rateCardId) });
    },
  });
}

export function useDeleteRateCardEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rateCardId, entryId }: { rateCardId: string; entryId: string }) => {
      await apiClient.delete(`/rate-cards/${rateCardId}/entries/${entryId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rateCards.detail(variables.rateCardId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Other Expenses hooks
// ---------------------------------------------------------------------------

export function useOtherExpenses(projectId: string) {
  return useQuery({
    queryKey: queryKeys.otherExpenses(projectId),
    queryFn: () => fetchArray<OtherExpense>(`/projects/${projectId}/other-expenses`),
    enabled: !!projectId,
  });
}

export function useCreateOtherExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...body }: { projectId: string; description: string; amount: number; date: string; isCharge?: boolean }) => {
      const { data } = await apiClient.post<ApiResponse<OtherExpense>>(`/projects/${projectId}/other-expenses`, body);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.otherExpenses(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
    },
  });
}

export function useUpdateOtherExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, expenseId, ...body }: { projectId: string; expenseId: string; description?: string; amount?: number; date?: string; isCharge?: boolean }) => {
      const { data } = await apiClient.put<ApiResponse<OtherExpense>>(`/projects/${projectId}/other-expenses/${expenseId}`, body);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.otherExpenses(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
    },
  });
}

export function useDeleteOtherExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, expenseId }: { projectId: string; expenseId: string }) => {
      await apiClient.delete(`/projects/${projectId}/other-expenses/${expenseId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.otherExpenses(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Project Rates hooks
// ---------------------------------------------------------------------------

export function useProjectRates(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectRates(projectId),
    queryFn: () => fetchArray<ProjectRate>(`/projects/${projectId}/rates`),
    enabled: !!projectId,
  });
}

export function useSetProjectRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, rates }: { projectId: string; rates: Array<{ roleId: string; rateHourly: number; rateDaily: number }> }) => {
      await apiClient.put(`/projects/${projectId}/rates`, { rates });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectRates(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Financial Insights hooks
// ---------------------------------------------------------------------------

export function useProjectFinancials(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectFinancials(projectId),
    queryFn: () => fetchOne<ProjectFinancials>(`/projects/${projectId}/financials`),
    enabled: !!projectId,
  });
}

export function useUtilization(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.insights.utilization(startDate, endDate),
    queryFn: () => fetchArray<UtilizationData>('/insights/utilization', { startDate, endDate }),
    enabled: !!startDate && !!endDate,
  });
}

export function useCapacity(startDate: string, endDate: string, period: string = 'month') {
  return useQuery({
    queryKey: queryKeys.insights.capacity(startDate, endDate, period),
    queryFn: () => fetchArray<CapacityData>('/insights/capacity', { startDate, endDate, period }),
    enabled: !!startDate && !!endDate,
  });
}

// ---------------------------------------------------------------------------
// Report hooks
// ---------------------------------------------------------------------------

export function useProjectsReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.reports.projects(startDate, endDate),
    queryFn: () => {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      return fetchArray<{
        projectId: string;
        projectName: string;
        clientName: string | null;
        pricingModel: string;
        financials: ProjectFinancials;
      }>('/reports/projects', params);
    },
  });
}

export function useProfitabilityReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.reports.profitability(startDate, endDate),
    queryFn: () => {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      return fetchArray<{
        clientId: string | null;
        clientName: string;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
        margin: number;
        projectCount: number;
      }>('/reports/profitability', params);
    },
  });
}
