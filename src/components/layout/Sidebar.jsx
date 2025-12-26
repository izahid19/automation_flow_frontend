import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Package,
  Factory,
  Users,
  LogOut,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'sales_executive', 'md', 'designer'] },
    { path: '/quotes', label: 'Quotes', icon: FileText, roles: ['admin', 'sales_executive', 'md', 'designer'] },
    { path: '/approvals', label: 'Approvals', icon: CheckSquare, roles: ['admin', 'sales_executive', 'md'] },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: Package, roles: ['admin', 'sales_executive', 'md'] },
    { path: '/manufacturers', label: 'Manufacturers', icon: Factory, roles: ['admin', 'sales_executive', 'md'] },
    { path: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role || ''));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          Quote Manager
        </h1>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm [text-shadow:_0_1px_2px_rgba(0,0,0,0.2)]'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-primary to-orange-400 text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut size={20} className="mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex-col">
        <SidebarContent />
      </aside>

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout?"
        message="Are you sure you want to logout from your account?"
        confirmText="Logout"
        variant="default"
      />
    </>
  );
};

export default Sidebar;
