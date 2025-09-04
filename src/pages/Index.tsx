import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Users, BarChart3, User, Clock } from 'lucide-react';

const Index = () => {
  const { user, userRole } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Leave Management System</h1>
            <p className="text-xl text-muted-foreground">
              Streamline your organization's leave management process
            </p>
          </div>
          
          <div className="space-y-4">
            <Link to="/auth">
              <Button size="lg" className="w-full">
                Get Started
              </Button>
            </Link>
            
            <div className="text-sm text-muted-foreground">
              Secure • Efficient • Easy to Use
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboardCards = [
    {
      title: 'Leave Requests',
      description: 'Submit and manage your leave requests',
      icon: FileText,
      href: '/requests',
      color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20'
    },
    {
      title: 'Calendar',
      description: 'View leave calendar and upcoming time off',
      icon: Calendar,
      href: '/calendar',
      color: 'from-green-500/10 to-green-600/10 border-green-500/20'
    },
    {
      title: 'Profile',
      description: 'Update your personal information',
      icon: User,
      href: '/profile',
      color: 'from-purple-500/10 to-purple-600/10 border-purple-500/20'
    }
  ];

  // Add manager/HR specific cards
  if (userRole === 'manager' || userRole === 'hr_admin') {
    dashboardCards.push({
      title: 'Team Management',
      description: 'Manage your team\'s leave requests',
      icon: Users,
      href: '/employees',
      color: 'from-orange-500/10 to-orange-600/10 border-orange-500/20'
    });
  }

  if (userRole === 'hr_admin') {
    dashboardCards.push({
      title: 'Reports',
      description: 'View comprehensive leave reports',
      icon: BarChart3,
      href: '/reports',
      color: 'from-red-500/10 to-red-600/10 border-red-500/20'
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back!</h1>
          <p className="text-muted-foreground">
            Manage your leave requests and stay updated with your team's schedule
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.href}>
                <Card className={`h-full transition-all duration-200 hover:shadow-lg bg-gradient-to-br ${card.color} hover:scale-105`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background/50">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">--</div>
                  <div className="text-sm text-muted-foreground">Pending Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">--</div>
                  <div className="text-sm text-muted-foreground">Days Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">--</div>
                  <div className="text-sm text-muted-foreground">This Year</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
