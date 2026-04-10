import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  LogOut, 
  PlusCircle, 
  List, 
  Menu,
  X,
  Sparkles,
  Settings,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { NotificationBell } from '../components/NotificationBell';

interface SidebarItem {
  icon: any;
  label: string;
  path: string;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const buyerItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/buyer' },
    { icon: Calendar, label: 'My Bookings', path: '/dashboard/buyer' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const sellerItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/seller' },
    { icon: PlusCircle, label: 'Create Service', path: '/dashboard/create-service' },
    { icon: List, label: 'My Services', path: '/dashboard/my-services' },
    { icon: Calendar, label: 'Booking Requests', path: '/dashboard/seller' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const adminItems: SidebarItem[] = [
    { icon: Shield, label: 'Admin Overview', path: '/dashboard/admin' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const items = user?.role === 'admin'
    ? adminItems
    : user?.role === 'organizer'
      ? sellerItems
      : buyerItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-noir-bg font-sans selection:bg-noir-accent/30">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-noir-bg/80 z-40 lg:hidden backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-noir-card border-r border-noir-border flex flex-col z-50 transition-all duration-500 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl shadow-noir-accent/10' : '-translate-x-full'}
      `}>
        <div className="p-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-noir-accent rounded-none flex items-center justify-center shadow-xl shadow-noir-accent/20 group-hover:rotate-12 transition-transform duration-500">
              <Sparkles className="text-noir-bg w-7 h-7" />
            </div>
            <span className="text-noir-ink font-display text-2xl font-semibold tracking-wide uppercase">EVENTO</span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-3 rounded-none bg-noir-bg text-noir-accent hover:bg-noir-accent hover:text-noir-bg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-grow px-6 space-y-2 overflow-y-auto py-4">
          <div className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.5em] mb-6 px-4">Main Menu</div>
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-5 py-4 rounded-none transition-all duration-500 group ${
                  isActive 
                    ? 'bg-noir-accent text-noir-bg shadow-2xl shadow-noir-accent/20' 
                    : 'text-noir-muted hover:bg-noir-accent/5 hover:text-noir-accent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-none flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-noir-bg/20 text-noir-bg' : 'bg-noir-bg text-noir-accent group-hover:bg-noir-accent group-hover:text-noir-bg'}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-[10px] font-mono uppercase tracking-widest">{item.label}</span>
                </div>
                {isActive && (
                  <motion.div layoutId="active-indicator">
                    <ChevronRight className="w-4 h-4 text-noir-bg" />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-8 border-t border-noir-border space-y-4">
          <div className="bg-noir-bg p-6 rounded-none border border-noir-border mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-none bg-noir-accent/20 flex items-center justify-center text-noir-accent">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-widest">Pro Plan</span>
            </div>
            <p className="text-[10px] text-noir-muted leading-relaxed mb-4 font-medium uppercase tracking-wider">Unlock premium event features and analytics.</p>
            <button className="btn-noir w-full !py-3 !rounded-none text-[10px] font-mono font-semibold uppercase tracking-widest">Upgrade Now</button>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-4 w-full rounded-none text-rose-500 hover:bg-rose-500/10 transition-all duration-500 group"
          >
            <div className="w-10 h-10 rounded-none bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[10px] font-mono uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow lg:ml-72 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-noir-bg/80 backdrop-blur-xl border-b border-noir-border px-6 md:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 bg-noir-card border border-noir-border rounded-none text-noir-accent shadow-sm"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-2xl font-display font-semibold text-noir-ink tracking-wide uppercase">
                Dashboard
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-noir-muted font-mono font-semibold uppercase tracking-widest">
                <span>Overview</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-noir-accent">Welcome back</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 bg-noir-card px-4 py-2 rounded-none border border-noir-border shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-widest">System Online</span>
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationBell
                buttonClassName="relative flex h-12 w-12 items-center justify-center rounded-none border border-noir-border bg-noir-card text-noir-accent shadow-sm transition-colors hover:border-noir-accent"
                panelClassName="bg-noir-card"
              />
              <button className="w-12 h-12 rounded-none bg-noir-card border border-noir-border flex items-center justify-center text-noir-accent hover:border-noir-accent transition-colors shadow-sm">
                <Settings className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 pl-6 border-l border-noir-border">
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-display font-semibold text-noir-ink leading-snug mb-1 uppercase tracking-wide">{user?.name}</span>
                  <span className="block text-[10px] text-noir-accent font-mono font-semibold uppercase tracking-widest">{user?.role}</span>
                </div>
                <Avatar 
                  src={user?.profilePicture} 
                  name={user?.name} 
                  size="md" 
                  className="rounded-none border-2 border-noir-border shadow-xl shadow-noir-accent/20 transition-opacity duration-300"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 md:p-12 flex-grow relative">
          {/* Background Decorative Text */}
          <div className="absolute bottom-10 right-10 pointer-events-none opacity-[0.03] select-none">
            <h2 className="text-[15vw] font-display font-semibold text-noir-ink leading-snug tracking-wide uppercase">{user?.role}</h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="relative z-10"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
