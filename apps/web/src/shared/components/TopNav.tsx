import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  Users,
  FolderKanban,
  CreditCard,
  Briefcase,
  Zap,
  Tag,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore, displayName, userInitials } from '@/shared/stores/auth.store';

interface NavItem {
  label: string;
  path: string;
  matchPaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'People', path: '/planner/people', matchPaths: ['/planner/people'] },
  { label: 'Projects', path: '/planner/projects', matchPaths: ['/planner/projects'] },
  {
    label: 'Manage',
    path: '/manage',
    matchPaths: ['/manage', '/settings'],
  },
  { label: 'Reports', path: '/reports', matchPaths: ['/reports'] },
  { label: 'Insights', path: '/insights', matchPaths: ['/insights'] },
];

const MANAGE_ITEMS = [
  { label: 'People', path: '/manage/people', icon: Users },
  { label: 'Projects', path: '/manage/projects', icon: FolderKanban },
  { label: 'Rate Cards', path: '/manage/rate-cards', icon: CreditCard },
  { label: 'Roles', path: '/manage/roles', icon: Briefcase },
  { label: 'Teams', path: '/manage/teams', icon: Users },
  { label: 'Clients', path: '/manage/clients', icon: FolderKanban },
  { label: 'Skills', path: '/manage/skills', icon: Zap },
  { label: 'Tags', path: '/manage/tags', icon: Tag },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function TopNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const initials = userInitials(user);

  const [manageOpen, setManageOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const manageRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (manageRef.current && !manageRef.current.contains(e.target as Node)) {
        setManageOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function isActive(item: NavItem): boolean {
    return (item.matchPaths ?? [item.path]).some((p) => pathname.startsWith(p));
  }

  return (
    <>
      <header className="flex h-[48px] flex-shrink-0 items-center border-b border-gray-200 bg-white px-4">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="mr-3 rounded p-1 text-gray-500 hover:bg-gray-100 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo icon only */}
        <Link to="/" className="mr-6 flex items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.4" />
            </svg>
          </div>
        </Link>

        {/* Desktop nav items */}
        <nav className="hidden h-full items-stretch gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const isManage = item.label === 'Manage';

            if (isManage) {
              return (
                <div key={item.path} ref={manageRef} className="relative flex items-stretch">
                  <button
                    onClick={() => {
                      setManageOpen((v) => !v);
                    }}
                    className={clsx(
                      'flex items-center border-b-2 px-3 text-sm font-medium transition-colors',
                      active
                        ? 'border-indigo-600 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-900',
                    )}
                  >
                    {item.label}
                  </button>

                  {manageOpen && (
                    <div className="absolute left-0 top-full z-50 mt-0 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
                      {MANAGE_ITEMS.map((mi) => {
                        const Icon = mi.icon;
                        return (
                          <button
                            key={mi.path}
                            onClick={() => {
                              navigate(mi.path);
                              setManageOpen(false);
                            }}
                            className={clsx(
                              'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                              pathname.startsWith(mi.path)
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-700 hover:bg-gray-50',
                            )}
                          >
                            <Icon className="h-4 w-4 text-gray-400" />
                            {mi.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center border-b-2 px-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-indigo-600 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: user menu + account badge */}
        <div ref={userRef} className="relative flex items-center gap-3">
          {/* Avatar */}
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 ring-1 ring-gray-300 hover:bg-gray-300"
          >
            {initials}
          </button>

          {/* Account name + Live badge + user name */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm font-medium text-gray-700">vsol</span>
            <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Live
            </span>
          </div>
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="hidden items-center gap-1 sm:flex"
          >
            <span className="text-sm text-gray-500">
              {displayName(user)?.toLowerCase()}
            </span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
              <div className="border-b px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{displayName(user)}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  navigate('/settings');
                  setUserOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                Settings
              </button>
              <button
                onClick={() => {
                  logout();
                  setUserOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="border-b border-gray-200 bg-white md:hidden">
          <nav className="flex flex-col py-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const isManage = item.label === 'Manage';

              if (isManage) {
                return (
                  <div key={item.path}>
                    <button
                      onClick={() => navigate('/manage')}
                      className={clsx(
                        'w-full px-4 py-2.5 text-left text-sm font-medium',
                        active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700',
                      )}
                    >
                      Manage
                    </button>
                    <div className="bg-gray-50 py-1">
                      {MANAGE_ITEMS.map((mi) => {
                        const Icon = mi.icon;
                        return (
                          <button
                            key={mi.path}
                            onClick={() => navigate(mi.path)}
                            className={clsx(
                              'flex w-full items-center gap-2.5 px-6 py-2 text-sm',
                              pathname.startsWith(mi.path)
                                ? 'text-indigo-700'
                                : 'text-gray-600',
                            )}
                          >
                            <Icon className="h-4 w-4 text-gray-400" />
                            {mi.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'px-4 py-2.5 text-sm font-medium',
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
