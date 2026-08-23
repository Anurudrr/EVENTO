import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Home, BookOpen, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForRole } from '../utils/dashboard';

interface NavTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchExact?: boolean;
}

const tabs: NavTab[] = [
  { label: 'Home', href: '/', icon: Home, matchExact: true },
  { label: 'Explore', href: '/events', icon: Compass },
  { label: 'Bookings', href: '/dashboard/buyer', icon: BookOpen },
  { label: 'Profile', href: '/profile', icon: User },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const dashboardPath = getDashboardPathForRole(user?.role);

  const resolvedTabs = tabs.map((tab) => {
    if (tab.href === '/dashboard/buyer') {
      return { ...tab, href: isAuthenticated ? dashboardPath : '/login' };
    }
    if (tab.href === '/profile') {
      return { ...tab, href: isAuthenticated ? '/profile' : '/login' };
    }
    return tab;
  });

  const isActive = (tab: NavTab) => {
    if (tab.matchExact) return location.pathname === tab.href;
    return location.pathname.startsWith(tab.href);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-noir-border bg-white/95 backdrop-blur-xl"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4">
        {resolvedTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);

          return (
            <Link
              key={tab.label}
              to={tab.href}
              id={`bottom-nav-${tab.label.toLowerCase()}`}
              className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                active ? 'text-noir-accent' : 'text-noir-muted'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.2em]">
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 h-0.5 w-8 bg-noir-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
