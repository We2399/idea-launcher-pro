import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getDateLocale, getLocalizedDateFormat } from '@/lib/dateLocale';
import { useTranslationHelpers } from '@/lib/translations';
import { Calendar, CalendarDays } from 'lucide-react';

interface CreateLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSuccess?: () => void;
}

interface LeaveType {
  id: string;
  name: string;
  max_days_per_year: number;
  requires_approval: boolean;
}

export function CreateLeaveDialog({ open, onOpenChange, selectedDate, onSuccess }: CreateLeaveDialogProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { translateLeaveType } = useTranslationHelpers();
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    end_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    reason: ''
  });

  React.useEffect(() => {
    if (open) {
      fetchLeaveTypes();
      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        setFormData(prev => ({
          ...prev,
          start_date: dateStr,
          end_date: dateStr
        }));
      }
    }
  }, [open, selectedDate]);

  const fetchLeaveTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setLeaveTypes(data || []);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to fetch leave types',
        variant: 'destructive',
      });
    }
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Check for overlapping leave requests
  const hasOverlap = async (startDate: string, endDate: string) => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('leave_requests')
      .select('id,start_date,end_date,status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved', 'senior_approved']);
    
    if (error) throw error;
    
    return (data || []).some((r) => {
      // Overlap if not (newEnd < existingStart or newStart > existingEnd)
      return !(endDate < r.start_date || startDate > r.end_date);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        toast({
          title: t('error'),
          description: t('endDateBeforeStart'),
          variant: 'destructive',
        });
        return;
      }

      // Check for overlapping requests
      if (await hasOverlap(formData.start_date, formData.end_date)) {
        toast({
          title: t('error'),
          description: t('overlappingDates'),
          variant: 'destructive',
        });
        return;
      }

      const days = calculateDays();

      const { error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: user.id,
          leave_type_id: formData.leave_type_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          days_requested: days,
          reason: formData.reason,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('requestSubmitted'),
      });

      onOpenChange(false);
      onSuccess?.();
      setFormData({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: ''
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to submit leave request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('createLeaveRequest')}
          </DialogTitle>
          <DialogDescription>
            {selectedDate 
              ? `${t('createLeaveRequest')} ${format(selectedDate, getLocalizedDateFormat(language), { locale: getDateLocale(language) })}`
              : t('submitLeaveRequest')
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leave_type">{t('leaveType')}</Label>
            <Select value={formData.leave_type_id} onValueChange={(value) => setFormData({ ...formData, leave_type_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectLeaveType')} />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {translateLeaveType(type.name)} ({type.max_days_per_year} {t('days')}/year max)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{t('startDate')}</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">{t('endDate')}</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          {formData.start_date && formData.end_date && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">{t('requestSummary')}</div>
              <div className="text-sm text-muted-foreground">
                {t('duration')}: {calculateDays()} {calculateDays() !== 1 ? t('days') : t('day')}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">{t('reasonOptional')}</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder={t('reasonPlaceholder')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !formData.leave_type_id}>
              {loading ? t('submitting') : t('submitLeaveRequest')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}