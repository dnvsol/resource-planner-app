import { useState, useMemo } from 'react';
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
  ChevronUp,
  ChevronDown,
  Search,
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

type SortKey = 'label' | 'count';
type SortDir = 'asc' | 'desc';

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

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('label');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const allItems: ManageItem[] = [
    { label: 'Projects', path: '/manage/projects', icon: FolderKanban, count: projectsRes?.data?.length, loading: prLoading },
    { label: 'People', path: '/manage/people', icon: Users, count: peopleRes?.data?.length, loading: pLoading },
    { label: 'Clients', path: '/manage/clients', icon: Building2, count: clientsRes?.data?.length, loading: cLoading },
    { label: 'Rate Cards', path: '/manage/rate-cards', icon: CreditCard, count: rateCardsData?.length, loading: rcLoading },
    { label: 'Roles', path: '/manage/roles', icon: Briefcase, count: rolesRes?.data?.length, loading: rLoading },
    { label: 'Skills', path: '/manage/skills', icon: Zap, count: skillsRes?.data?.length, loading: sLoading },
    { label: 'Teams', path: '/manage/teams', icon: Users, count: teamsRes?.data?.length, loading: tLoading },
    { label: 'Tags', path: '/manage/tags', icon: Tag, count: tagsRes?.data?.length, loading: tagLoading },
  ];

  const items = useMemo(() => {
    let list = allItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.label.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      if (sortKey === 'label') {
        const cmp = a.label.localeCompare(b.label);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const aCount = a.count ?? 0;
      const bCount = b.count ?? 0;
      return sortDir === 'asc' ? aCount - bCount : bCount - aCount;
    });
    return list;
  }, [search, sortKey, sortDir, allItems]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="ml-1 inline h-3 w-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="ml-1 inline h-3 w-3 text-indigo-600" />
      : <ChevronDown className="ml-1 inline h-3 w-3 text-indigo-600" />;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<Settings className="h-6 w-6" />}
        title="Manage"
      />

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Search bar */}
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_80px_80px] border-b border-gray-100 px-5 py-3">
          <button
            onClick={() => handleSort('label')}
            className="flex items-center text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
          >
            Name <SortIcon col="label" />
          </button>
          <button
            onClick={() => handleSort('count')}
            className="flex items-center justify-center text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
          >
            Count <SortIcon col="count" />
          </button>
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
