import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main 
        className={`min-h-screen p-4 lg:p-8 pt-16 lg:pt-8 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
