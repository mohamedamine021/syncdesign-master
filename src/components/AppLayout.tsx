import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { ThemeToggle } from './ThemeToggle';

export function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="relative flex-1 overflow-auto min-h-0 flex flex-col">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
