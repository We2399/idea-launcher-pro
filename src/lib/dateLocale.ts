import { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { zhCN } from 'date-fns/locale/zh-CN';  
import { zhTW } from 'date-fns/locale/zh-TW';
import { id } from 'date-fns/locale/id';
import { Language } from '@/contexts/LanguageContext';

const localeMap: Record<Language, Locale> = {
  'en': enUS,
  'zh-CN': zhCN, 
  'zh-TW': zhTW,
  'id': id,
};

export const getDateLocale = (language: Language): Locale => {
  return localeMap[language] || enUS;
};

export const getLocalizedDateFormat = (language: Language): string => {
  const formatMap: Record<Language, string> = {
    'en': 'MMM dd, yyyy',
    'zh-CN': 'yyyy年MM月dd日',
    'zh-TW': 'yyyy年MM月dd日', 
    'id': 'dd MMM yyyy',
  };
  return formatMap[language] || 'MMM dd, yyyy';
};

export const getLocalizedDateTimeFormat = (language: Language): string => {
  const formatMap: Record<Language, string> = {
    'en': 'MMM dd, yyyy HH:mm',
    'zh-CN': 'yyyy年MM月dd日 HH:mm',
    'zh-TW': 'yyyy年MM月dd日 HH:mm',
    'id': 'dd MMM yyyy HH:mm',
  };
  return formatMap[language] || 'MMM dd, yyyy HH:mm';
};