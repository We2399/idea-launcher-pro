import React, { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ImpersonationProvider, useImpersonation } from '@/contexts/ImpersonationContext';
import { IndustryProvider } from '@/contexts/IndustryContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy-load ALL pages to reduce initial bundle parse time on Android WebView
const Index = lazy(() => import('./pages/Index'));
const Auth = lazy(() => import('./pages/Auth'));
const Requests = lazy(() => import('./pages/Requests'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Profile = lazy(() => import('./pages/Profile'));
const Employees = lazy(() => import('./pages/Employees'));
const Reports = lazy(() => import('./pages/Reports'));
const Tasks = lazy(() => import('./pages/Tasks'));
const CashControl = lazy(() => import('./pages/CashControl'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const StorageCentre = lazy(() => import('./pages/StorageCentre'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Chat = lazy(() => import('./pages/Chat'));
const Help = lazy(() => import('./pages/Help'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ProfileWithApproval = lazy(() => import('./components/profile/ProfileWithApproval'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Simple loading fallback for lazy-loaded pages
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
    <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const queryClient = new QueryClient();

// Separate component to use impersonation hook inside the provider
function MainAppLayout() {
  const { isImpersonating } = useImpersonation();
  
  // Initialize push notifications for native mobile platforms
  usePushNotifications();
  
  // Initialize global chat notification sound listener (plays on all pages)
  useUnreadMessagesCount();
  
  return (
    <SidebarProvider defaultOpen={false}>
      {/* Add top padding when impersonation banner is visible */}
      <div className={`min-h-screen flex w-full ${isImpersonating ? 'pt-[52px]' : ''}`}>
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="safe-area-main flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/cash-control" element={<CashControl />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/help" element={<Help />} />
                <Route path="/profile" element={<ProfileWithApproval />} />
                <Route path="/employees" element={
                  <ProtectedRoute requiredRole={['manager', 'hr_admin', 'administrator']}>
                    <Employees />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute requiredRole={['hr_admin', 'administrator']}>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/storage-centre" element={
                  <ProtectedRoute requiredRole={['hr_admin', 'administrator']}>
                    <StorageCentre />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute requiredRole={['hr_admin', 'administrator']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}

// App component with all providers
const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ImpersonationProvider>
            <LanguageProvider>
              <TooltipProvider>
                <BrowserRouter>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/*" element={
                        <ProtectedRoute>
                          <IndustryProvider>
                            <ErrorBoundary>
                              <MainAppLayout />
                            </ErrorBoundary>
                          </IndustryProvider>
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </LanguageProvider>
          </ImpersonationProvider>
        </AuthProvider>
        <Toaster />
        <Sonner />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;