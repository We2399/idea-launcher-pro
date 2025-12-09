import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DelegationSettings } from '@/components/admin/DelegationSettings';
import { LeaveAllocationManager } from '@/components/admin/LeaveAllocationManager';
import { WorkScheduleManager } from '@/components/admin/WorkScheduleManager';
import { PublicHolidaysManager } from '@/components/admin/PublicHolidaysManager';
import { OrganizationManager } from '@/components/admin/OrganizationManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Users, Shield, Clock, Globe, Database, Building2 } from 'lucide-react';
import StorageCentre from '@/pages/StorageCentre';

export default function Settings() {
  const { userRole } = useAuth();
  const { t } = useLanguage();

  if (userRole !== 'hr_admin' && userRole !== 'administrator') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">{t('accessDenied')}</h2>
          <p className="text-muted-foreground">{t('noPermissionToView')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-area-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('administratorSettings')}</h1>
        <p className="text-muted-foreground">{t('manageSystemSettings')}</p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('organization')}
          </TabsTrigger>
          <TabsTrigger value="delegation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('delegation')}
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('leaveManagement')}
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('workSchedules')}
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('publicHolidays')}
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {t('storageCentre')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="organization">
          <OrganizationManager />
        </TabsContent>
        
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
        
        <TabsContent value="storage">
          <StorageCentre />
        </TabsContent>
      </Tabs>
    </div>
  );
}