import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslationHelpers } from '@/lib/translations';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

interface RequestFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  leaveTypeFilter: string;
  onLeaveTypeFilterChange: (value: string) => void;
  leaveTypes: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function RequestFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  leaveTypeFilter,
  onLeaveTypeFilterChange,
  leaveTypes,
  onClearFilters,
  hasActiveFilters,
}: RequestFiltersProps) {
  const { t } = useLanguage();
  const { translateLeaveType, translateStatus } = useTranslationHelpers();
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('searchByEmployeeReason')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="pending">{translateStatus('pending')}</SelectItem>
              <SelectItem value="approved">{translateStatus('approved')}</SelectItem>
              <SelectItem value="rejected">{translateStatus('rejected')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={leaveTypeFilter} onValueChange={onLeaveTypeFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTypes')}</SelectItem>
              {leaveTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {translateLeaveType(type.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              {t('clear')}
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t('search')}: {searchQuery}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSearchChange('')}
              />
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t('status')}: {translateStatus(statusFilter)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onStatusFilterChange('all')}
              />
            </Badge>
          )}
          {leaveTypeFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t('type')}: {translateLeaveType(leaveTypes.find(t => t.id === leaveTypeFilter)?.name || '')}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onLeaveTypeFilterChange('all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}