import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen p-4 lg:p-8 pt-16 lg:pt-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
