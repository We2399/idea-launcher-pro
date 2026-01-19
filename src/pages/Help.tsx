import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  FileText, 
  Calendar, 
  CheckSquare, 
  DollarSign, 
  User, 
  MessageCircle,
  Users, 
  Settings, 
  BarChart3, 
  Wallet,
  Bell,
  HelpCircle,
  BookOpen,
  Shield,
  Clock,
  Upload
} from 'lucide-react';

interface FeatureSection {
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
  steps: string[];
  tips?: string[];
  adminOnly?: boolean;
}

export default function Help() {
  const { t } = useLanguage();
  const { userRole } = useAuth();
  
  const isAdmin = userRole === 'administrator' || userRole === 'hr_admin';

  const generalFeatures: FeatureSection[] = [
    {
      icon: Home,
      titleKey: 'helpDashboard',
      descriptionKey: 'helpDashboardDesc',
      steps: [
        'helpDashboardStep1',
        'helpDashboardStep2',
        'helpDashboardStep3',
        'helpDashboardStep4'
      ],
      tips: ['helpDashboardTip1']
    },
    {
      icon: FileText,
      titleKey: 'helpLeaveRequests',
      descriptionKey: 'helpLeaveRequestsDesc',
      steps: [
        'helpLeaveStep1',
        'helpLeaveStep2',
        'helpLeaveStep3',
        'helpLeaveStep4'
      ],
      tips: ['helpLeaveTip1', 'helpLeaveTip2']
    },
    {
      icon: Calendar,
      titleKey: 'helpCalendar',
      descriptionKey: 'helpCalendarDesc',
      steps: [
        'helpCalendarStep1',
        'helpCalendarStep2',
        'helpCalendarStep3'
      ]
    },
    {
      icon: CheckSquare,
      titleKey: 'helpTasks',
      descriptionKey: 'helpTasksDesc',
      steps: [
        'helpTasksStep1',
        'helpTasksStep2',
        'helpTasksStep3'
      ]
    },
    {
      icon: DollarSign,
      titleKey: 'helpCashControl',
      descriptionKey: 'helpCashControlDesc',
      steps: [
        'helpCashStep1',
        'helpCashStep2',
        'helpCashStep3',
        'helpCashStep4'
      ]
    },
    {
      icon: Wallet,
      titleKey: 'helpPayroll',
      descriptionKey: 'helpPayrollDesc',
      steps: [
        'helpPayrollStep1',
        'helpPayrollStep2',
        'helpPayrollStep3'
      ]
    },
    {
      icon: User,
      titleKey: 'helpProfile',
      descriptionKey: 'helpProfileDesc',
      steps: [
        'helpProfileStep1',
        'helpProfileStep2',
        'helpProfileStep3',
        'helpProfileStep4'
      ],
      tips: ['helpProfileTip1']
    },
    {
      icon: MessageCircle,
      titleKey: 'helpChat',
      descriptionKey: 'helpChatDesc',
      steps: [
        'helpChatStep1',
        'helpChatStep2',
        'helpChatStep3'
      ]
    },
    {
      icon: Bell,
      titleKey: 'helpNotifications',
      descriptionKey: 'helpNotificationsDesc',
      steps: [
        'helpNotificationStep1',
        'helpNotificationStep2',
        'helpNotificationStep3'
      ]
    }
  ];

  const adminFeatures: FeatureSection[] = [
    {
      icon: Users,
      titleKey: 'helpEmployees',
      descriptionKey: 'helpEmployeesDesc',
      steps: [
        'helpEmployeesStep1',
        'helpEmployeesStep2',
        'helpEmployeesStep3',
        'helpEmployeesStep4'
      ],
      adminOnly: true
    },
    {
      icon: Upload,
      titleKey: 'helpStorageCentre',
      descriptionKey: 'helpStorageCentreDesc',
      steps: [
        'helpStorageStep1',
        'helpStorageStep2',
        'helpStorageStep3',
        'helpStorageStep4'
      ],
      adminOnly: true
    },
    {
      icon: Clock,
      titleKey: 'helpLeaveAllocation',
      descriptionKey: 'helpLeaveAllocationDesc',
      steps: [
        'helpAllocationStep1',
        'helpAllocationStep2',
        'helpAllocationStep3'
      ],
      adminOnly: true
    },
    {
      icon: Settings,
      titleKey: 'helpSettings',
      descriptionKey: 'helpSettingsDesc',
      steps: [
        'helpSettingsStep1',
        'helpSettingsStep2',
        'helpSettingsStep3',
        'helpSettingsStep4'
      ],
      adminOnly: true
    },
    {
      icon: BarChart3,
      titleKey: 'helpReports',
      descriptionKey: 'helpReportsDesc',
      steps: [
        'helpReportsStep1',
        'helpReportsStep2',
        'helpReportsStep3'
      ],
      adminOnly: true
    },
    {
      icon: Shield,
      titleKey: 'helpDelegation',
      descriptionKey: 'helpDelegationDesc',
      steps: [
        'helpDelegationStep1',
        'helpDelegationStep2',
        'helpDelegationStep3'
      ],
      adminOnly: true
    }
  ];

  const renderFeatureSection = (feature: FeatureSection, index: number) => {
    const Icon = feature.icon;
    return (
      <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg mb-2 px-2">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t(feature.titleKey)}</span>
                {feature.adminOnly && (
                  <Badge variant="secondary" className="text-xs">{t('adminOnly')}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-normal">{t(feature.descriptionKey)}</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-4 px-2">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">{t('howToUse')}:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                {feature.steps.map((step, i) => (
                  <li key={i}>{t(step)}</li>
                ))}
              </ol>
            </div>
            {feature.tips && feature.tips.length > 0 && (
              <div className="bg-accent/50 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-1">{t('helpTips')}:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {feature.tips.map((tip, i) => (
                    <li key={i}>{t(tip)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
          <HelpCircle className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('helpCenter')}</h1>
          <p className="text-muted-foreground">{t('helpCenterDesc')}</p>
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('gettingStarted')}
          </CardTitle>
          <CardDescription>{t('gettingStartedDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium text-sm">{t('helpStep1Title')}</h4>
                <p className="text-xs text-muted-foreground">{t('helpStep1Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium text-sm">{t('helpStep2Title')}</h4>
                <p className="text-xs text-muted-foreground">{t('helpStep2Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium text-sm">{t('helpStep3Title')}</h4>
                <p className="text-xs text-muted-foreground">{t('helpStep3Desc')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Features */}
      <Card>
        <CardHeader>
          <CardTitle>{t('helpGeneralFeatures')}</CardTitle>
          <CardDescription>{t('helpGeneralFeaturesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {generalFeatures.map((feature, index) => renderFeatureSection(feature, index))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Admin Features */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('helpAdminFeatures')}
            </CardTitle>
            <CardDescription>{t('helpAdminFeaturesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {adminFeatures.map((feature, index) => renderFeatureSection(feature, index + generalFeatures.length))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Quick FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>{t('helpFAQ')}</CardTitle>
          <CardDescription>{t('helpFAQDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger>{t('helpFAQ1Q')}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t('helpFAQ1A')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger>{t('helpFAQ2Q')}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t('helpFAQ2A')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3">
              <AccordionTrigger>{t('helpFAQ3Q')}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t('helpFAQ3A')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-4">
              <AccordionTrigger>{t('helpFAQ4Q')}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t('helpFAQ4A')}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
