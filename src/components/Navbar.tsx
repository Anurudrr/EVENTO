import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X, Sparkles, LogOut, LayoutDashboard, ChevronDown, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Avatar';
import { NotificationBell } from './NotificationBell';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Explore', href: '/explore' },
  { name: 'Events', href: '/events' },
  { name: 'About', href: '/about' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

export const Navbar: React.FC = React.memo(() => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  const dashboardPath = user?.role === 'admin'
    ? '/dashboard/admin'
    : user?.role === 'organizer'
      ? '/dashboard/seller'
      : '/dashboard/buyer';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? 'py-4' : 'py-6'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className={`rounded-none px-8 py-3 flex items-center justify-between transition-all duration-500 border border-noir-border ${
          isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-2xl shadow-noir-accent/5' : 'bg-white/40 backdrop-blur-md'
        }`}>
          <div className="flex items-center gap-16">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 90 }}
                className="w-12 h-12 bg-noir-accent flex items-center justify-center text-white shadow-xl shadow-noir-accent/20"
              >
                <Sparkles className="w-7 h-7" />
              </motion.div>
              <span className="text-xl font-serif font-semibold text-noir-ink tracking-wide">EVENTO</span>
            </Link>

            <div className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-[10px] font-semibold uppercase tracking-[0.4em] transition-all duration-300 relative group ${
                    location.pathname === link.href
                      ? 'text-noir-accent'
                      : 'text-noir-muted hover:text-noir-ink'
                  }`}
                >
                  {link.name}
                  {location.pathname === link.href && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-2 left-0 w-full h-0.5 bg-noir-accent"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <button className="flex items-center gap-3 text-[10px] font-semibold text-noir-muted hover:text-noir-ink transition-colors uppercase tracking-[0.3em]">
              <Globe className="w-4 h-4" />
              <span>EN</span>
              <span className="text-noir-border">|</span>
              <span>USD</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <NotificationBell
                  buttonClassName="relative flex h-12 w-12 items-center justify-center border border-noir-border bg-white text-noir-accent transition-colors hover:border-noir-accent"
                />
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-4 bg-white border border-noir-border text-noir-ink rounded-none pl-2 pr-5 py-2 hover:border-noir-accent transition-all group"
                  >
                    <Avatar
                      src={user?.profilePicture}
                      name={user?.name}
                      size="sm"
                      className="border-noir-border rounded-none"
                    />
                    <span className="text-xs font-semibold uppercase tracking-widest">{user?.name?.split(' ')[0] || 'User'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-72 bg-white rounded-none border border-noir-border shadow-2xl p-4 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-4 border-b border-noir-border mb-3">
                          <p className="text-[10px] font-semibold text-noir-accent uppercase tracking-[0.4em] mb-2">Signed in as</p>
                          <p className="text-sm font-mono font-semibold text-noir-ink truncate">{user?.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-4 px-4 py-4 text-xs font-semibold uppercase tracking-widest text-noir-muted hover:text-noir-accent hover:bg-noir-accent/5 transition-all group"
                        >
                          <UserCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          My Profile
                        </Link>
                        <Link
                          to={dashboardPath}
                          className="flex items-center gap-4 px-4 py-4 text-xs font-semibold uppercase tracking-widest text-noir-muted hover:text-noir-accent hover:bg-noir-accent/5 transition-all group"
                        >
                          <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          Dashboard
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-4 px-4 py-4 text-xs font-semibold uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all group"
                        >
                          <LogOut className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link to="/login" className="text-xs font-semibold uppercase tracking-[0.3em] text-noir-muted hover:text-noir-ink transition-colors">
                  Log In
                </Link>
                <Link to="/signup" className="btn-noir !py-3 !px-10 !text-xs">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <button
            className="lg:hidden p-3 text-noir-ink border border-noir-border"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="lg:hidden fixed inset-0 w-full h-screen bg-noir-bg z-40 p-10 flex flex-col justify-center"
          >
            <button
              className="absolute top-10 right-10 p-4 border border-noir-border text-noir-ink"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>

            <div className="flex flex-col gap-12">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-6xl font-display font-semibold uppercase tracking-wide transition-colors ${
                    location.pathname === link.href ? 'text-noir-accent' : 'text-noir-ink hover:text-noir-accent'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-noir-border w-full" />
              <div className="flex flex-col gap-8">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" className="text-2xl font-semibold uppercase tracking-widest text-noir-ink">
                      My Profile
                    </Link>
                    <Link to={dashboardPath} className="text-2xl font-semibold uppercase tracking-widest text-noir-ink">
                      Dashboard
                    </Link>
                    <button onClick={logout} className="text-2xl font-semibold uppercase tracking-widest text-rose-500 text-left">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-2xl font-semibold uppercase tracking-widest text-noir-ink">
                      Log In
                    </Link>
                    <Link to="/signup" className="btn-noir text-center !py-6 !text-xl">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
});
