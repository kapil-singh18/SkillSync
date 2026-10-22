import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppShell = () => (
  <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
    <Sidebar />
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <TopBar />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto"
        role="main"
      >
        <div className="p-6 min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);

export default AppShell;
