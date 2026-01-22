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
  Package,
  Factory,
  Users,
  LogOut,
  Menu,
  Tag,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'sales_executive', 'manager', 'designer', 'accountant'] },
    { path: '/quotes', label: 'Quotes', icon: FileText, roles: ['admin', 'sales_executive', 'manager', 'designer', 'accountant'] },
    { path: '/order-sheet', label: 'Order Sheet', icon: Package, roles: ['admin', 'sales_executive', 'manager', 'accountant'] },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: Package, roles: ['admin', 'manager', 'accountant'] },
    { path: '/manufacturers', label: 'Add Manufacturers', icon: Factory, roles: ['admin', 'manager'] },
    { path: '/users', label: 'Users', icon: Users, roles: ['admin'] },
    { path: '/invoice-label', label: 'Invoice Label', icon: Tag, roles: ['admin'] },
    { path: '/purchase-order-label', label: 'PO Label', icon: Tag, roles: ['admin'] },
    { path: '/quote-mail-settings', label: 'Quote Mail Settings', icon: Mail, roles: ['admin', 'manager'] },
    { path: '/po-mail-settings', label: 'PO Mail Settings', icon: Mail, roles: ['admin', 'manager'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role || ''));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <h1 className="text-xl font-bold bg-linear-to-r from-primary to-orange-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden">
            Quote Manager
          </h1>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className={collapsed ? '' : 'ml-auto'}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </Button>
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
                  ? 'bg-primary text-white shadow-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.2)]'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : ''}
          >
            <item.icon size={20} />
            {!collapsed && <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User Section */}
      <div className="p-4">
        <div className={`flex items-center gap-3 px-4 py-3 mb-2 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-linear-to-br from-primary to-orange-400 text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="font-medium truncate">{user?.name}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                user?.role === 'admin' 
                  ? 'bg-red-500/20 text-red-400' 
                  : user?.role === 'manager' 
                  ? 'bg-green-500/20 text-green-400'
                  : user?.role === 'designer'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : user?.role === 'accountant'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {user?.role === 'sales_executive' ? 'Sales' : user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? "Logout" : ""}
        >
          <LogOut size={20} className={collapsed ? "" : "mr-3"} />
          {!collapsed && "Logout"}
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
      <aside className={`hidden lg:flex fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
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
