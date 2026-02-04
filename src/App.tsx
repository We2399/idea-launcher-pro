import React from 'react';
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
import Index from './pages/Index';
import Auth from './pages/Auth';
import Requests from './pages/Requests';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import CashControl from './pages/CashControl';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import StorageCentre from './pages/StorageCentre';
import Payroll from './pages/Payroll';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import Help from './pages/Help';
import PrivacyPolicy from './pages/PrivacyPolicy';
// New enhanced components
import CalendarWithColors from './components/calendar/CalendarWithColors';
import ProfileWithApproval from './components/profile/ProfileWithApproval';

import ResetPassword from './pages/ResetPassword';

const queryClient = new QueryClient();

// Separate component to use impersonation hook inside the provider
function MainAppLayout() {
  const { isImpersonating } = useImpersonation();
  
  // Initialize push notifications for native mobile platforms
  usePushNotifications();
  
  return (
    <SidebarProvider defaultOpen={false}>
      {/* Add top padding when impersonation banner is visible */}
      <div className={`min-h-screen flex w-full ${isImpersonating ? 'pt-[52px]' : ''}`}>
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="safe-area-main flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ImpersonationProvider>
          <LanguageProvider>
            <TooltipProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/*" element={
                    <ProtectedRoute>
                      <IndustryProvider>
                        <MainAppLayout />
                      </IndustryProvider>
                    </ProtectedRoute>
                  } />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </ImpersonationProvider>
      </AuthProvider>
      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
};

export default App;