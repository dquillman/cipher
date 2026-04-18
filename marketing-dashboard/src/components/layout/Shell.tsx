import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar.tsx';
import { Sidebar } from './Sidebar.tsx';

interface ShellProps {
  onLogout: () => void;
}

export function Shell({ onLogout }: ShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
