import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { DocumentFilters as Filters } from '@/hooks/useStorageCentre';

interface DocumentFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function DocumentFilters({ filters, onFiltersChange }: DocumentFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employee-search">Employee Name</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="employee-search"
              placeholder="Search by name..."
              className="pl-8"
              value={filters.employeeName || ''}
              onChange={(e) => onFiltersChange({ ...filters, employeeName: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-type">Document Type</Label>
          <Select
            value={filters.documentType || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, documentType: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="document-type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="visa">Visa</SelectItem>
              <SelectItem value="id_card">ID Card</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="certificate">Certificate</SelectItem>
              <SelectItem value="receipt">Receipt</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select
            value={filters.source || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, source: value === 'all' ? undefined : value as any })
            }
          >
            <SelectTrigger id="source">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="profile">Profile</SelectItem>
              <SelectItem value="cash_control">Cash Control</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, status: value === 'all' ? undefined : value as any })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="replaced">Replaced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
