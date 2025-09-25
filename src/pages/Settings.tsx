import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DelegationSettings } from '@/components/admin/DelegationSettings';
import { LeaveAllocationManager } from '@/components/admin/LeaveAllocationManager';
import { WorkScheduleManager } from '@/components/admin/WorkScheduleManager';
import { PublicHolidaysManager } from '@/components/admin/PublicHolidaysManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Users, Shield, Clock, Globe } from 'lucide-react';

export default function Settings() {
  const { userRole } = useAuth();

  if (userRole !== 'hr_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Administrator Settings</h1>
        <p className="text-muted-foreground">Manage system settings and role delegation</p>
      </div>

      <Tabs defaultValue="delegation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="delegation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Delegation
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leave Management
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Work Schedules
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Public Holidays
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="delegation">
          <DelegationSettings />
        </TabsContent>
        
        <TabsContent value="allocations">
          <LeaveAllocationManager />
        </TabsContent>
        
        <TabsContent value="schedules">
          <WorkScheduleManager />
        </TabsContent>
        
        <TabsContent value="holidays">
          <PublicHolidaysManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}