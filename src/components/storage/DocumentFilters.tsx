import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { DocumentFilters as Filters } from '@/hooks/useStorageCentre';
import { useLanguage } from '@/contexts/LanguageContext';

interface DocumentFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function DocumentFilters({ filters, onFiltersChange }: DocumentFiltersProps) {
  const { t } = useLanguage();

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('filters')}</h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="h-4 w-4 mr-1" />
          {t('clear')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employee-search">{t('employeeName')}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="employee-search"
              placeholder={t('searchByName')}
              className="pl-8"
              value={filters.employeeName || ''}
              onChange={(e) => onFiltersChange({ ...filters, employeeName: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-type">{t('documentTypeFilter')}</Label>
          <Select
            value={filters.documentType || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, documentType: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="document-type">
              <SelectValue placeholder={t('allTypesFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTypesFilter')}</SelectItem>
              <SelectItem value="passport">{t('passport')}</SelectItem>
              <SelectItem value="visa">{t('visa')}</SelectItem>
              <SelectItem value="id_card">{t('idCard')}</SelectItem>
              <SelectItem value="contract">{t('contract')}</SelectItem>
              <SelectItem value="certificate">{t('certificate')}</SelectItem>
              <SelectItem value="receipt">{t('receipt')}</SelectItem>
              <SelectItem value="other">{t('otherSource')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">{t('sourceFilter')}</Label>
          <Select
            value={filters.source || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, source: value === 'all' ? undefined : value as any })
            }
          >
            <SelectTrigger id="source">
              <SelectValue placeholder={t('allSourcesFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allSourcesFilter')}</SelectItem>
              <SelectItem value="profile">{t('profileSource')}</SelectItem>
              <SelectItem value="cash_control">{t('cashControlSource')}</SelectItem>
              <SelectItem value="other">{t('otherSource')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t('statusFilter')}</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, status: value === 'all' ? undefined : value as any })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder={t('allStatusesFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatusesFilter')}</SelectItem>
              <SelectItem value="pending_approval">{t('pendingApprovalStatus')}</SelectItem>
              <SelectItem value="active">{t('activeStatus')}</SelectItem>
              <SelectItem value="rejected">{t('rejectedStatus')}</SelectItem>
              <SelectItem value="replaced">{t('replacedStatus')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}