import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimationProvider } from './animations/AnimationProvider';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { ScrollToTop } from './components/ScrollToTop';
import { Footer } from './sections/Footer';
import { useAuth } from './context/AuthContext';
import { CustomCursor } from './components/experience/CustomCursor';
import { SiteLoader } from './components/experience/SiteLoader';

const Home = lazy(() => import('./pages/Home'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PaymentReceiptPage = lazy(() => import('./pages/PaymentReceiptPage'));
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const CreateServicePage = lazy(() => import('./pages/CreateServicePage'));
const MyServicesPage = lazy(() => import('./pages/MyServicesPage'));
const EditServicePage = lazy(() => import('./pages/EditServicePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const NotFoundPage = () => (
  <div className="min-h-[70vh] bg-noir-bg flex flex-col items-center justify-center px-6 text-center">
    <h1 className="text-6xl md:text-8xl font-display font-semibold text-noir-ink tracking-wide uppercase mb-6">404</h1>
    <p className="text-noir-muted text-lg uppercase tracking-normal mb-8">The page you requested does not exist.</p>
    <a href="/events" className="btn-noir !py-4 !px-10">Browse Events</a>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-noir-bg" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'organizer' ? '/dashboard/seller' : '/dashboard/buyer'} replace />;
  }

  return <>{children}</>;
};

const RouteFallback = () => (
  <div className="min-h-[60vh] bg-noir-bg flex items-center justify-center">
    <div className="route-fallback">
      <span className="route-fallback__ring" />
      <span className="route-fallback__ring route-fallback__ring--accent" />
    </div>
  </div>
);

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard/');

  if (isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard/');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="route-stage"
        initial={isDashboardRoute ? false : { opacity: 0, y: 26, filter: 'blur(18px)' }}
        animate={isDashboardRoute ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={isDashboardRoute ? { opacity: 0 } : { opacity: 0, y: -18, filter: 'blur(14px)' }}
        transition={{ duration: isDashboardRoute ? 0.16 : 0.58, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<ServicesPage />} />
            <Route path="/services" element={<Navigate to="/events" replace />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/event/:id" element={<ServiceDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Dashboard Routes */}
            <Route
              path="/dashboard/buyer/*"
              element={(
                <ProtectedRoute allowedRoles={['user', 'admin']}>
                  <BuyerDashboard />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/seller/*"
              element={(
                <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                  <SellerDashboard />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/admin"
              element={(
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/create-service"
              element={(
                <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                  <CreateServicePage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/my-services"
              element={(
                <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                  <MyServicesPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/edit-service/:id"
              element={(
                <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                  <EditServicePage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/profile"
              element={(
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/receipt/:orderId"
              element={(
                <ProtectedRoute>
                  <PaymentReceiptPage />
                </ProtectedRoute>
              )}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AnimationProvider>
          <Router>
            <SiteLoader />
            <CustomCursor />
            <ScrollToTop />
            <AppShell>
              <div className="flex-grow min-w-0">
                <AnimatedRoutes />
              </div>
            </AppShell>
          </Router>
        </AnimationProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
