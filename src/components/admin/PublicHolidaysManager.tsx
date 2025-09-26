import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Plus, Trash2, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  country_code: string;
  year: number;
  is_recurring: boolean;
}

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'MO', name: 'Macau' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
];

export function PublicHolidaysManager() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: undefined as Date | undefined,
    country_code: 'US',
    is_recurring: false,
  });

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear, selectedCountry]);

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('public_holidays')
        .select('*')
        .eq('year', selectedYear)
        .eq('country_code', selectedCountry)
        .order('date');

      if (error) throw error;

      setHolidays(data || []);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to fetch holidays',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!formData.name || !formData.date) {
      toast({
        title: t('error'),
        description: 'Please fill in all required fields',
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('public_holidays')
        .insert([{
          name: formData.name,
          date: format(formData.date, 'yyyy-MM-dd'),
          country_code: formData.country_code,
          year: formData.date.getFullYear(),
          is_recurring: formData.is_recurring,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: t('success'),
        description: 'Holiday added successfully'
      });

      setFormData({
        name: '',
        date: undefined,
        country_code: selectedCountry,
        is_recurring: false,
      });
      setShowAddForm(false);
      fetchHolidays();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to add holiday',
        variant: "destructive"
      });
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      const { error } = await supabase
        .from('public_holidays')
        .delete()
        .eq('id', holidayId);

      if (error) throw error;

      toast({
        title: t('success'),
        description: 'Holiday deleted successfully'
      });

      fetchHolidays();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to delete holiday',
        variant: "destructive"
      });
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i - 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Public Holidays Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 flex items-end">
              <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Holiday
              </Button>
            </div>
          </div>

          {showAddForm && (
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Holiday Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., New Year's Day"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Country</label>
                    <Select 
                      value={formData.country_code} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, country_code: value }))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="recurring"
                      checked={formData.is_recurring}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked }))}
                    />
                    <label htmlFor="recurring" className="text-sm font-medium">
                      Recurring annually
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleAddHoliday}>Add Holiday</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <h3 className="text-lg font-medium">
              Holidays for {selectedCountry} - {selectedYear}
            </h3>
            
            {holidays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No holidays found for this year and country.
              </div>
            ) : (
              <div className="space-y-2">
                {holidays.map(holiday => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{holiday.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(holiday.date), 'MMMM dd, yyyy')}
                        {holiday.is_recurring && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}