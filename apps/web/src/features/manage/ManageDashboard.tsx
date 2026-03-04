import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Users,
  FolderKanban,
  CreditCard,
  Briefcase,
  Zap,
  Tag,
  Building2,
  ChevronRight,
} from 'lucide-react';
import {
  usePeople,
  useProjects,
  useClients,
  useRateCards,
  useRoles,
  useSkills,
  useTeams,
  useTags,
} from '@/shared/api/hooks';
import { PageHeader } from '@/shared/components/PageHeader';

interface ManageItem {
  label: string;
  path: string;
  icon: React.ElementType;
  count: number | undefined;
  loading: boolean;
}

export function ManageDashboard() {
  const navigate = useNavigate();
  const { data: peopleRes, isLoading: pLoading } = usePeople();
  const { data: projectsRes, isLoading: prLoading } = useProjects();
  const { data: clientsRes, isLoading: cLoading } = useClients();
  const { data: rateCardsData, isLoading: rcLoading } = useRateCards();
  const { data: rolesRes, isLoading: rLoading } = useRoles();
  const { data: skillsRes, isLoading: sLoading } = useSkills();
  const { data: teamsRes, isLoading: tLoading } = useTeams();
  const { data: tagsRes, isLoading: tagLoading } = useTags();

  const items: ManageItem[] = [
    { label: 'Projects', path: '/manage/projects', icon: FolderKanban, count: projectsRes?.data?.length, loading: prLoading },
    { label: 'People', path: '/manage/people', icon: Users, count: peopleRes?.data?.length, loading: pLoading },
    { label: 'Clients', path: '/manage/clients', icon: Building2, count: clientsRes?.data?.length, loading: cLoading },
    { label: 'Rate Cards', path: '/manage/rate-cards', icon: CreditCard, count: rateCardsData?.length, loading: rcLoading },
    { label: 'Roles', path: '/manage/roles', icon: Briefcase, count: rolesRes?.data?.length, loading: rLoading },
    { label: 'Skills', path: '/manage/skills', icon: Zap, count: skillsRes?.data?.length, loading: sLoading },
    { label: 'Teams', path: '/manage/teams', icon: Users, count: teamsRes?.data?.length, loading: tLoading },
    { label: 'Tags', path: '/manage/tags', icon: Tag, count: tagsRes?.data?.length, loading: tagLoading },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<Settings className="h-6 w-6" />}
        title="Manage"
      />

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_80px_80px] border-b border-gray-100 px-5 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Name</span>
          <span className="text-center text-xs font-medium uppercase tracking-wider text-gray-500">Count</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="grid w-full grid-cols-[1fr_80px_80px] items-center px-5 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                </div>
                <span className="text-center text-sm text-gray-600">
                  {item.loading ? (
                    <span className="inline-block h-4 w-8 animate-pulse rounded bg-gray-200" />
                  ) : (
                    item.count ?? 0
                  )}
                </span>
                <div className="flex justify-end">
                  <span className="flex items-center gap-1 text-xs font-medium text-indigo-600">
                    Details
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
