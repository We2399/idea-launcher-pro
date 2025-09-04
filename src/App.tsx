import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Requests from "./pages/Requests";
import CalendarPage from "./pages/Calendar";
import Profile from "./pages/Profile";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
                      <main className="flex-1 p-6">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/requests" element={<Requests />} />
                          <Route path="/calendar" element={<CalendarPage />} />
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;