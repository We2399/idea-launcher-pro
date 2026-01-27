import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Calendar, FileText, MessageCircle, Wallet, Shield, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import jiejieLadyIcon from '@/assets/jiejie-lady-icon.png';

interface WelcomeSlidesProps {
  onComplete: () => void;
}

export function WelcomeSlides({ onComplete }: WelcomeSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t, language } = useLanguage();

  const brandName = language === 'zh-TW' || language === 'zh-CN' ? '姐姐 心連站' : 'Jie Jie';

  const slides = [
    {
      id: 'welcome',
      icon: Heart,
      image: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&auto=format&fit=crop&q=80',
      title: t('welcomeSlideTitle'),
      subtitle: t('welcomeSlideSubtitle'),
      color: 'from-hermes/80 to-hermes-dark/90',
    },
    {
      id: 'calendar',
      icon: Calendar,
      image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=80',
      title: t('calendarSlideTitle'),
      subtitle: t('calendarSlideSubtitle'),
      color: 'from-primary/80 to-primary/90',
    },
    {
      id: 'documents',
      icon: FileText,
      image: 'https://images.unsplash.com/photo-1568234928966-359c35dd8327?w=800&auto=format&fit=crop&q=80',
      title: t('documentsSlideTitle'),
      subtitle: t('documentsSlideSubtitle'),
      color: 'from-accent/80 to-accent/90',
    },
    {
      id: 'chat',
      icon: MessageCircle,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      title: t('chatSlideTitle'),
      subtitle: t('chatSlideSubtitle'),
      color: 'from-hermes/80 to-hermes-dark/90',
    },
    {
      id: 'payroll',
      icon: Wallet,
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
      title: t('payrollSlideTitle'),
      subtitle: t('payrollSlideSubtitle'),
      color: 'from-primary/80 to-primary/90',
    },
    {
      id: 'security',
      icon: Shield,
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      title: t('securitySlideTitle'),
      subtitle: t('securitySlideSubtitle'),
      color: 'from-accent/80 to-accent/90',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <img
          src={currentSlideData.image}
          alt=""
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${currentSlideData.color}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-float" />
      <div className="absolute top-40 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-16 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Skip Button */}
        <div className="flex justify-end p-4 pt-safe">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            {t('skip')}
          </Button>
        </div>

        {/* Logo on first slide */}
        {currentSlide === 0 && (
          <div className="flex justify-center mt-8 animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-white/30 to-white/10 rounded-full blur-lg animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm p-2 ring-2 ring-white/30 shadow-2xl">
                <img
                  src={jiejieLadyIcon}
                  alt={brandName}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Bottom Section */}
        <div className="mt-auto">
          {/* Glassmorphism Card */}
          <div className="mx-4 mb-6 p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-fade-in">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                <Icon className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-white">
                {currentSlideData.title}
              </h2>
              <p className="text-white/80 text-sm leading-relaxed">
                {currentSlideData.subtitle}
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between px-4 pb-8 pb-safe">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`w-12 h-12 rounded-full ${
                currentSlide === 0
                  ? 'opacity-0'
                  : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <Button
              onClick={handleNext}
              className="flex-1 mx-4 h-14 rounded-2xl bg-white text-foreground font-semibold text-lg shadow-xl hover:bg-white/90 transition-all"
            >
              {currentSlide === slides.length - 1 ? t('getStarted') : t('next')}
              {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5 ml-2" />}
            </Button>

            <div className="w-12" /> {/* Spacer for balance */}
          </div>
        </div>
      </div>
    </div>
  );
}
