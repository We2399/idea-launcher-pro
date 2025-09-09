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
  const { t } = useLanguage();
  const { toast } = useToast();
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
        title: 'Error',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        toast({
          title: 'Error',
          description: 'End date cannot be before start date',
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
        title: 'Success',
        description: 'Leave request submitted successfully',
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
        title: 'Error',
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
            Create Leave Request
          </DialogTitle>
          <DialogDescription>
            {selectedDate 
              ? `Create a leave request starting from ${format(selectedDate, 'MMMM dd, yyyy')}`
              : 'Submit a new leave request'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leave_type">Leave Type</Label>
            <Select value={formData.leave_type_id} onValueChange={(value) => setFormData({ ...formData, leave_type_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.max_days_per_year} days/year max)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
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
              <div className="text-sm font-medium">Request Summary</div>
              <div className="text-sm text-muted-foreground">
                Duration: {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Enter reason for leave request..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.leave_type_id}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}