import { Outlet } from 'react-router-dom';
import { TopNav } from '@/shared/components/TopNav';

export function Layout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNav />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
