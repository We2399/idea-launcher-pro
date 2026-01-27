import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Home, CheckSquare, MessageCircle, DollarSign, FileText, Calendar, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeatureTourProps {
  onComplete: () => void;
}

interface TourStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export function FeatureTour({ onComplete }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useLanguage();

  const steps: TourStep[] = [
    {
      id: 'dashboard',
      icon: Home,
      title: t('tourDashboardTitle'),
      description: t('tourDashboardDesc'),
      target: 'dashboard',
      position: 'center',
    },
    {
      id: 'tasks',
      icon: CheckSquare,
      title: t('tourTasksTitle'),
      description: t('tourTasksDesc'),
      target: 'tasks',
      position: 'bottom',
    },
    {
      id: 'chat',
      icon: MessageCircle,
      title: t('tourChatTitle'),
      description: t('tourChatDesc'),
      target: 'chat',
      position: 'bottom',
    },
    {
      id: 'money',
      icon: DollarSign,
      title: t('tourMoneyTitle'),
      description: t('tourMoneyDesc'),
      target: 'money',
      position: 'bottom',
    },
    {
      id: 'documents',
      icon: FileText,
      title: t('tourDocumentsTitle'),
      description: t('tourDocumentsDesc'),
      target: 'documents',
      position: 'bottom',
    },
    {
      id: 'calendar',
      icon: Calendar,
      title: t('tourCalendarTitle'),
      description: t('tourCalendarDesc'),
      target: 'calendar',
      position: 'center',
    },
    {
      id: 'settings',
      icon: Settings,
      title: t('tourSettingsTitle'),
      description: t('tourSettingsDesc'),
      target: 'settings',
      position: 'center',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Tour Card */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto">
        <div className="relative p-6 rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl animate-scale-in">
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Step Counter */}
          <div className="text-xs text-muted-foreground mb-4">
            {currentStep + 1} / {steps.length}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-1 ring-primary/20">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3 mb-6">
            <h3 className="text-xl font-bold text-foreground">
              {currentStepData.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-6 bg-primary'
                    : index < currentStep
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1"
            >
              {t('skip')}
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 gap-2"
            >
              {currentStep === steps.length - 1 ? t('finish') : t('next')}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
