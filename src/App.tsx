import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
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

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <div className="min-h-screen flex w-full">
                        <AppSidebar />
                        <div className="flex-1 flex flex-col">
                          <Header />
                          <main className="flex-1 p-0">
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/requests" element={<Requests />} />
                              <Route path="/calendar" element={<Calendar />} />
                              <Route path="/tasks" element={<Tasks />} />
                              <Route path="/cash-control" element={<CashControl />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/employees" element={
                                <ProtectedRoute requiredRole={['manager', 'hr_admin']}>
                                  <Employees />
                                </ProtectedRoute>
                              } />
                              <Route path="/reports" element={
                                <ProtectedRoute requiredRole={['hr_admin']}>
                                  <Reports />
                                </ProtectedRoute>
                              } />
                              <Route path="/settings" element={
                                <ProtectedRoute requiredRole={['hr_admin']}>
                                  <Settings />
                                </ProtectedRoute>
                              } />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
};

export default App;