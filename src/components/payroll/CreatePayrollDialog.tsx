import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  existingPayroll?: any; // For editing disputed payrolls
  resolutionNotes?: string; // Resolution notes from dispute
}

interface LineItem {
  item_type: 'bonus' | 'allowance' | 'other' | 'deduction';
  category: string;
  description: string;
  amount: number;
}

export function CreatePayrollDialog({ open, onClose, existingPayroll, resolutionNotes }: Props) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const isEditMode = !!existingPayroll;

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [baseSalary, setBaseSalary] = useState(0);
  const [currency, setCurrency] = useState('USD');

  // Load existing payroll data when in edit mode
  useEffect(() => {
    if (existingPayroll && open) {
      setSelectedEmployee(existingPayroll.user_id);
      setMonth(existingPayroll.month);
      setYear(existingPayroll.year);
      setBaseSalary(Number(existingPayroll.base_salary) || 0);
      setCurrency(existingPayroll.currency || 'USD');
      // Load line items if available
      if (existingPayroll.payroll_line_items) {
        setLineItems(existingPayroll.payroll_line_items.map((item: any) => ({
          item_type: item.item_type,
          category: item.category,
          description: item.description,
          amount: Number(item.amount),
        })));
      }
    }
  }, [existingPayroll, open]);

  // Fetch employees (excluding admins and HR admins)
  const { data: employees } = useQuery({
    queryKey: ['employees-for-payroll'],
    queryFn: async () => {
      // First get admin/HR user IDs
      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['administrator', 'hr_admin']);

      const adminIds = new Set(adminUsers?.map(u => u.user_id) || []);

      // Get ALL profiles
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, employee_id, base_monthly_salary, salary_currency');

      if (error) throw error;

      // Filter out admins and HR in JavaScript
      return allProfiles?.filter(p => !adminIds.has(p.user_id)) || [];
    },
    enabled: open,
  });

  // Fetch recurring allowances for selected employee
  const { data: recurringAllowances } = useQuery({
    queryKey: ['recurring-allowances', selectedEmployee],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_recurring_allowances')
        .select('*')
        .eq('user_id', selectedEmployee)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployee,
  });

  // Update base salary when employee selected (only for new payrolls, not edit mode)
  useEffect(() => {
    if (selectedEmployee && employees && !isEditMode) {
      const employee = employees.find((e) => e.user_id === selectedEmployee);
      if (employee) {
        setBaseSalary(Number(employee.base_monthly_salary) || 0);
        setCurrency(employee.salary_currency || 'USD');
      }
    }
  }, [selectedEmployee, employees, isEditMode]);

  const addLineItem = (type: LineItem['item_type']) => {
    setLineItems([
      ...lineItems,
      { item_type: type, category: '', description: '', amount: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateTotals = () => {
    let bonuses = 0;
    let allowances = 0;
    let others = 0;
    let deductions = 0;

    lineItems.forEach((item) => {
      const amount = Number(item.amount) || 0;
      if (item.item_type === 'bonus') bonuses += amount;
      else if (item.item_type === 'allowance') allowances += amount;
      else if (item.item_type === 'other') others += amount;
      else if (item.item_type === 'deduction') deductions += amount;
    });

    // Add recurring allowances
    if (recurringAllowances) {
      recurringAllowances.forEach((ra) => {
        allowances += Number(ra.amount);
      });
    }

    const gross = baseSalary + bonuses + allowances + others;
    const net = gross - deductions;

    return { bonuses, allowances, others, deductions, gross, net };
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployee) throw new Error('Please select an employee');
      if (lineItems.some((item) => !item.category || !item.description)) {
        throw new Error('Please fill in all line item details');
      }

      if (isEditMode) {
        // Use resolve-payroll-dispute for editing
        const { data, error } = await supabase.functions.invoke('resolve-payroll-dispute', {
          body: {
            payroll_record_id: existingPayroll.id,
            action: 'revise',
            resolution_notes: resolutionNotes || '',
            base_salary: baseSalary,
            currency: currency,
            line_items: lineItems,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      } else {
        // Create new payroll
        const { error } = await supabase.functions.invoke('create-payroll-record', {
          body: {
            employee_id: selectedEmployee,
            month,
            year,
            base_salary: baseSalary,
            currency: currency,
            line_items: lineItems,
          },
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      const message = isEditMode ? t('payrollRevised') : t('payrollCreated');
      toast({ title: t('success'), description: message });
      queryClient.invalidateQueries({ queryKey: ['all-payroll-records'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payroll-approvals'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const resetForm = () => {
    setSelectedEmployee('');
    setMonth(currentDate.getMonth() + 1);
    setYear(currentDate.getFullYear());
    setLineItems([]);
    setBaseSalary(0);
    setCurrency('USD');
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editPayroll') : t('createPayroll')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee & Period Selection */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 md:col-span-1">
              <Label>{t('employee')} *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('selectEmployee')} />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('month')} *</Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('year')} *</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Base Salary */}
          {selectedEmployee && (
            <Card className="p-4 bg-primary/5">
              <div className="space-y-2">
                <Label htmlFor="baseSalary">{t('baseSalary')}</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  {t('defaultFromProfile')}: {formatCurrency(Number(employees?.find(e => e.user_id === selectedEmployee)?.base_monthly_salary || 0), currency)}
                </p>
              </div>
            </Card>
          )}

          {/* Recurring Allowances */}
          {recurringAllowances && recurringAllowances.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">{t('recurringAllowances')}</h3>
              <div className="space-y-2">
                {recurringAllowances.map((ra) => (
                  <div key={ra.id} className="flex justify-between p-3 bg-muted rounded">
                    <div>
                      <div className="font-medium">{ra.description || ra.allowance_type}</div>
                      <div className="text-sm text-muted-foreground">{ra.allowance_type}</div>
                    </div>
                    <span className="font-medium">{formatCurrency(Number(ra.amount), ra.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => addLineItem('bonus')} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> {t('addBonus')}
              </Button>
              <Button onClick={() => addLineItem('allowance')} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> {t('addAllowance')}
              </Button>
              <Button onClick={() => addLineItem('other')} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> {t('addOther')}
              </Button>
              <Button onClick={() => addLineItem('deduction')} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> {t('addDeduction')}
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-2">
                    <Label className="text-xs">{t('type')}</Label>
                    <div className="mt-1 text-sm font-medium capitalize">{item.item_type}</div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">{t('category')}</Label>
                    <Input
                      value={item.category}
                      onChange={(e) => updateLineItem(index, 'category', e.target.value)}
                      placeholder={t('enterCategory')}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs">{t('description')}</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder={t('enterDescription')}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">{t('amount')}</Label>
                    <Input
                      type="number"
                      value={item.amount === 0 ? '' : item.amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateLineItem(index, 'amount', val === '' ? 0 : Number(val));
                      }}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      onClick={() => removeLineItem(index)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <Card className="p-4 bg-primary/5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('baseSalary')}</span>
                <span className="font-medium">{formatCurrency(baseSalary, currency)}</span>
              </div>
              {totals.bonuses > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{t('bonuses')}</span>
                  <span className="font-medium">{formatCurrency(totals.bonuses, currency)}</span>
                </div>
              )}
              {totals.allowances > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{t('allowances')}</span>
                  <span className="font-medium">{formatCurrency(totals.allowances, currency)}</span>
                </div>
              )}
              {totals.others > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{t('others')}</span>
                  <span className="font-medium">{formatCurrency(totals.others, currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>{t('grossTotal')}</span>
                <span>{formatCurrency(totals.gross, currency)}</span>
              </div>
              {totals.deductions > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t('deductions')}</span>
                  <span>-{formatCurrency(totals.deductions, currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>{t('netTotal')}</span>
                <span>{formatCurrency(totals.net, currency)}</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button onClick={onClose} variant="outline">
              {t('cancel')}
            </Button>
            <Button 
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !selectedEmployee}
            >
              {isEditMode ? t('saveChanges') : t('createPayroll')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
