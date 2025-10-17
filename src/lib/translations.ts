import { useLanguage } from '@/contexts/LanguageContext';

// Helper functions to translate database values to localized strings

export const useTranslationHelpers = () => {
  const { t } = useLanguage();

  // Translate leave type names from database
  const translateLeaveType = (leaveTypeName: string): string => {
    const leaveTypeMap: Record<string, string> = {
      'Annual Leave': t('annualLeave'),
      'Sick Leave': t('sickLeave'), 
      'Maternity Leave': t('maternityLeave'),
      'Paternity Leave': t('paternityLeave'),
      'Vacation': t('vacation'),
      'Emergency Leave': t('emergencyLeave'),
      'Compassionate Leave': t('compassionateLeave'),
      'Study Leave': t('studyLeave'),
      'Unpaid Leave': t('unpaidLeave'),
      'Others': t('others'),
    };
    
    return leaveTypeMap[leaveTypeName] || leaveTypeName;
  };

  // Translate status values
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': t('pending'),
      'approved': t('approved'),
      'rejected': t('rejected'),
      'paid': t('paid'),
      'senior_approved': t('seniorApproved'),
    };
    
    return statusMap[status] || status;
  };

  // Translate transaction types
  const translateTransactionType = (type: 'request' | 'expense' | 'reimbursement'): string => {
    const typeMap: Record<string, string> = {
      'request': t('request'),
      'expense': t('expense'),
      'reimbursement': t('reimbursement'),
    };
    
    return typeMap[type] || type;
  };

  // Translate category values
  const translateCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'general': t('general'),
      'travel': t('travel'),
      'meals': t('meals'), 
      'supplies': t('supplies'),
      'equipment': t('equipment'),
      'training': t('training'),
      'groceries': t('groceries'),
      'others': t('others'),
    };
    
    return categoryMap[category] || category;
  };

  return {
    translateLeaveType,
    translateStatus,
    translateTransactionType,
    translateCategory,
  };
};