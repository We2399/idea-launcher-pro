import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Plus, Trash2, Globe, Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<Array<{ name: string; date: string; isValid: boolean; error?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Parse CSV file
  const parseCSV = (text: string): Array<{ name: string; date: string }> => {
    const lines = text.trim().split('\n');
    const results: Array<{ name: string; date: string }> = [];
    
    // Skip header row if it looks like a header
    const startIndex = lines[0]?.toLowerCase().includes('name') || lines[0]?.toLowerCase().includes('date') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle both CSV and semicolon-separated formats
      const separator = line.includes(';') ? ';' : ',';
      const parts = line.split(separator).map(p => p.trim().replace(/^["']|["']$/g, ''));
      
      if (parts.length >= 2) {
        results.push({
          name: parts[0],
          date: parts[1]
        });
      }
    }
    
    return results;
  };

  // Validate and parse date string
  const parseDate = (dateStr: string): { date: Date | null; format: string } => {
    const formats = [
      'yyyy-MM-dd',
      'dd/MM/yyyy',
      'MM/dd/yyyy',
      'dd-MM-yyyy',
      'MM-dd-yyyy',
      'dd.MM.yyyy',
      'yyyy/MM/dd'
    ];
    
    for (const fmt of formats) {
      try {
        const parsed = parse(dateStr, fmt, new Date());
        if (isValid(parsed)) {
          return { date: parsed, format: fmt };
        }
      } catch {
        continue;
      }
    }
    
    return { date: null, format: '' };
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      
      const preview = parsed.map(item => {
        const { date } = parseDate(item.date);
        const isValidDate = date !== null;
        const isCorrectYear = date ? date.getFullYear() === selectedYear : false;
        
        return {
          name: item.name,
          date: item.date,
          isValid: isValidDate && isCorrectYear,
          error: !isValidDate 
            ? 'Invalid date format' 
            : !isCorrectYear 
              ? `Date not in year ${selectedYear}` 
              : undefined
        };
      });
      
      setImportPreview(preview);
    };
    reader.readAsText(file);
  };

  // Import holidays from preview
  const handleImport = async () => {
    const validItems = importPreview.filter(item => item.isValid);
    
    if (validItems.length === 0) {
      toast({
        title: t('error'),
        description: 'No valid holidays to import',
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    
    try {
      const holidaysToInsert = validItems.map(item => {
        const { date } = parseDate(item.date);
        return {
          name: item.name,
          date: format(date!, 'yyyy-MM-dd'),
          country_code: selectedCountry,
          year: selectedYear,
          is_recurring: false,
          created_by: user?.id
        };
      });

      const { error } = await supabase
        .from('public_holidays')
        .insert(holidaysToInsert);

      if (error) throw error;

      toast({
        title: t('success'),
        description: `Successfully imported ${validItems.length} holidays`
      });

      setImportPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchHolidays();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to import holidays',
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = `Holiday Name,Date (YYYY-MM-DD)
New Year's Day,${selectedYear}-01-01
Independence Day,${selectedYear}-07-04
Christmas Day,${selectedYear}-12-25`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `public_holidays_template_${selectedCountry}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear import preview
  const clearImportPreview = () => {
    setImportPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            {t('publicHolidaysManagement')}
          </CardTitle>
          <CardDescription>
            {t('publicHolidaysDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('year')}</label>
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
              <label className="text-sm font-medium mb-2 block">{t('country')}</label>
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
            
            <div className="flex-1 flex items-end gap-2 flex-wrap">
              <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t('addHoliday')}
              </Button>
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('downloadTemplate')}
              </Button>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="holiday-csv-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('importCSV')}
                </Button>
              </div>
            </div>
          </div>

          {/* Import Preview */}
          {importPreview.length > 0 && (
            <Card className="border-2 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import Preview ({importPreview.filter(i => i.isValid).length} valid / {importPreview.length} total)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {importPreview.map((item, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg border",
                        item.isValid ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={item.isValid ? "default" : "destructive"}>
                          {item.isValid ? "Valid" : "Invalid"}
                        </Badge>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.date}</span>
                      </div>
                      {item.error && (
                        <span className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {item.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Supported date formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, DD.MM.YYYY
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleImport} 
                    disabled={importing || importPreview.filter(i => i.isValid).length === 0}
                  >
                    {importing ? "Importing..." : `Import ${importPreview.filter(i => i.isValid).length} Holidays`}
                  </Button>
                  <Button variant="outline" onClick={clearImportPreview}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
              {t('holidaysFor')} {selectedCountry} - {selectedYear}
            </h3>
            
            {holidays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('noHolidaysFound')}
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
                            {t('recurring')}
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