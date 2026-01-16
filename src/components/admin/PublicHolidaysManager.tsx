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
import { CalendarIcon, Plus, Trash2, Globe, Upload, Download, FileText, AlertCircle, ArrowUp } from 'lucide-react';
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

const defaultCountries = [
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

// Get stored country order from localStorage
const getStoredCountryOrder = (): typeof defaultCountries => {
  try {
    const stored = localStorage.getItem('publicHolidays_countryOrder');
    if (stored) {
      const codes = JSON.parse(stored) as string[];
      // Rebuild countries array in stored order
      const ordered = codes
        .map(code => defaultCountries.find(c => c.code === code))
        .filter(Boolean) as typeof defaultCountries;
      // Add any new countries not in stored list
      const remaining = defaultCountries.filter(c => !codes.includes(c.code));
      return [...ordered, ...remaining];
    }
  } catch {
    // Ignore parse errors
  }
  return defaultCountries;
};

// Save country order to localStorage
const saveCountryOrder = (countries: typeof defaultCountries) => {
  localStorage.setItem('publicHolidays_countryOrder', JSON.stringify(countries.map(c => c.code)));
};

export function PublicHolidaysManager() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [importing, setImporting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [importPreview, setImportPreview] = useState<Array<{ name: string; date: string; isValid: boolean; error?: string }>>([]);
  const [countries, setCountries] = useState(getStoredCountryOrder);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map language code to database language code
  const getDbLanguageCode = (lang: string): string => {
    const mapping: Record<string, string> = {
      'en': 'en',
      'zh-TW': 'zh-TW',
      'zh-CN': 'zh-CN',
      'id': 'id'
    };
    return mapping[lang] || 'en';
  };

  // Move a country to the top of the list
  const moveCountryToTop = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (!country || countries[0]?.code === countryCode) return;
    
    const newOrder = [country, ...countries.filter(c => c.code !== countryCode)];
    setCountries(newOrder);
    saveCountryOrder(newOrder);
    toast({
      title: t('success'),
      description: `${country.name} moved to top`
    });
  };
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: undefined as Date | undefined,
    country_code: 'US',
    is_recurring: false,
  });

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear, selectedCountry, language]);

  const fetchHolidays = async () => {
    try {
      const dbLanguage = getDbLanguageCode(language);
      
      // First try to get holidays in user's language
      let { data, error } = await supabase
        .from('public_holidays')
        .select('*')
        .eq('year', selectedYear)
        .eq('country_code', selectedCountry)
        .eq('language_code', dbLanguage)
        .order('date');

      if (error) throw error;

      // Fallback to English if no holidays found in user's language
      if ((!data || data.length === 0) && dbLanguage !== 'en') {
        const fallbackResult = await supabase
          .from('public_holidays')
          .select('*')
          .eq('year', selectedYear)
          .eq('country_code', selectedCountry)
          .eq('language_code', 'en')
          .order('date');
        
        if (!fallbackResult.error && fallbackResult.data && fallbackResult.data.length > 0) {
          data = fallbackResult.data;
        }
      }

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

  // Parse CSV file - handles both "Name, Date" and "Date, Name" column orders
  const parseCSV = (text: string): Array<{ name: string; date: string }> => {
    const lines = text.trim().split('\n');
    const results: Array<{ name: string; date: string }> = [];
    
    // Detect if first row is header
    const firstLine = lines[0]?.toLowerCase() || '';
    const isHeader = firstLine.includes('name') || firstLine.includes('date') || 
                     firstLine.includes('holiday') || firstLine.includes('日期') || 
                     firstLine.includes('名稱') || firstLine.includes('假期');
    const startIndex = isHeader ? 1 : 0;
    
    // Check column order from header if present (default: assume first column could be date)
    let dateFirst = false;
    if (isHeader) {
      const separator = firstLine.includes(';') ? ';' : ',';
      const headerParts = firstLine.split(separator).map(p => p.trim().toLowerCase());
      // If first column contains date-related words, date is first
      dateFirst = headerParts[0]?.includes('date') || headerParts[0]?.includes('日期');
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle both CSV and semicolon-separated formats
      const separator = line.includes(';') ? ';' : ',';
      const parts = line.split(separator).map(p => p.trim().replace(/^["']|["']$/g, ''));
      
      if (parts.length >= 2) {
        // Auto-detect column order by checking which part looks like a date
        // Date patterns: YYYY-MM-DD, DD/MM/YYYY, etc.
        const datePattern = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})$/;
        const firstIsDate = datePattern.test(parts[0]);
        const secondIsDate = datePattern.test(parts[1]);
        
        let name: string, date: string;
        
        if (firstIsDate && !secondIsDate) {
          // First column is date
          date = parts[0];
          name = parts[1];
        } else if (secondIsDate && !firstIsDate) {
          // Second column is date
          name = parts[0];
          date = parts[1];
        } else if (dateFirst) {
          // Use header detection
          date = parts[0];
          name = parts[1];
        } else {
          // Default: assume Name, Date order
          name = parts[0];
          date = parts[1];
        }
        
        results.push({ name, date });
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

  // Translate holidays using AI
  const translateHolidays = async (holidays: Array<{ name: string; date: string }>, sourceLanguage: string) => {
    try {
      const response = await supabase.functions.invoke('translate-holidays', {
        body: { holidays, sourceLanguage }
      });
      
      if (response.error) throw response.error;
      return response.data.holidays;
    } catch (error) {
      console.error('Translation failed:', error);
      // Return original holidays with same name for all languages as fallback
      return holidays.map(h => ({
        ...h,
        translations: {
          en: h.name,
          'zh-TW': h.name,
          'zh-CN': h.name,
          id: h.name
        }
      }));
    }
  };

  // Import holidays from preview - REPLACES existing holidays for this year/country (all languages)
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
    setTranslating(true);
    
    try {
      // Detect source language based on current UI language
      const sourceLanguage = getDbLanguageCode(language);
      
      // Translate holidays to all 4 languages
      toast({
        title: t('translating') || 'Translating...',
        description: t('translatingHolidays') || 'Auto-translating holidays to all languages...'
      });
      
      const translatedHolidays = await translateHolidays(
        validItems.map(item => ({ name: item.name, date: item.date })),
        sourceLanguage
      );
      
      setTranslating(false);

      // Generate a unique source_import_id to link all translations
      const sourceImportId = crypto.randomUUID();
      const allLanguages = ['en', 'zh-TW', 'zh-CN', 'id'];

      // Delete existing holidays for this year and country (ALL languages)
      const { error: deleteError } = await supabase
        .from('public_holidays')
        .delete()
        .eq('year', selectedYear)
        .eq('country_code', selectedCountry);

      if (deleteError) throw deleteError;

      // Build holiday records for all 4 languages
      const allHolidaysToInsert: any[] = [];
      
      translatedHolidays.forEach((holiday: any) => {
        const { date: parsedDate } = parseDate(holiday.date);
        
        allLanguages.forEach(lang => {
          const translatedName = holiday.translations?.[lang] || holiday.name;
          allHolidaysToInsert.push({
            name: translatedName,
            date: format(parsedDate!, 'yyyy-MM-dd'),
            country_code: selectedCountry,
            year: selectedYear,
            is_recurring: false,
            created_by: user?.id,
            language_code: lang,
            source_import_id: sourceImportId
          });
        });
      });

      const { error } = await supabase
        .from('public_holidays')
        .insert(allHolidaysToInsert);

      if (error) throw error;

      toast({
        title: t('success'),
        description: `${t('importedHolidaysAllLanguages') || `Imported ${validItems.length} holidays for ${selectedCountry} ${selectedYear} in all 4 languages`}`
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
      setTranslating(false);
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
            
            <div className="flex items-end gap-2">
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => moveCountryToTop(selectedCountry)}
                disabled={countries[0]?.code === selectedCountry}
                title="Move country to top of list"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
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
                    Importing will <strong>replace all existing holidays</strong> for {selectedCountry} {selectedYear}. 
                    Supported formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
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