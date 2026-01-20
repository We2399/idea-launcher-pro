import { useIndustry, IndustryType } from '@/contexts/IndustryContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Terminology {
  // Singular terms
  employee: string;
  employer: string;
  manager: string;
  staff: string;
  
  // Plural terms
  employees: string;
  employers: string;
  
  // Action terms
  inviteEmployee: string;
  manageEmployees: string;
  
  // Descriptions
  employeeDescription: string;
  employerDescription: string;
  oneEmployeeFree: string;
}

const getTerminology = (industryType: IndustryType, t: (key: string) => string): Terminology => {
  if (industryType === 'household') {
    return {
      employee: t('helperTerm'),
      employer: t('employerTerm'),
      manager: t('employerTerm'),
      staff: t('helperTerm'),
      employees: t('helpersTerm'),
      employers: t('employersTerm'),
      inviteEmployee: t('inviteHelper'),
      manageEmployees: t('manageHelpers'),
      employeeDescription: t('helperDescription'),
      employerDescription: t('householdEmployerDescription'),
      oneEmployeeFree: t('oneHelperFree'),
    };
  }
  
  // Business terminology
  return {
    employee: t('staffTerm'),
    employer: t('managerTerm'),
    manager: t('managerTerm'),
    staff: t('staffTerm'),
    employees: t('staffMembersTerm'),
    employers: t('managersTerm'),
    inviteEmployee: t('inviteStaff'),
    manageEmployees: t('manageStaff'),
    employeeDescription: t('staffDescription'),
    employerDescription: t('businessEmployerDescription'),
    oneEmployeeFree: t('oneStaffFree'),
  };
};

export const useTerminology = () => {
  const { industryType, loading } = useIndustry();
  const { t } = useLanguage();
  
  const terminology = getTerminology(industryType, t);
  
  return {
    ...terminology,
    industryType,
    isHousehold: industryType === 'household',
    isBusiness: industryType === 'business',
    loading,
  };
};

// Utility hook for getting terminology without context (e.g., during signup)
export const getTerminologyForIndustry = (industryType: IndustryType, t: (key: string) => string) => {
  return getTerminology(industryType, t);
};
