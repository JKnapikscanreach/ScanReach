import { useState } from 'react';
import { Search, Plus, ExternalLink, QrCode, Eye, Edit, ArrowUpDown, Filter } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRCodeModal } from '@/components/QRCodeModal';
import { MicrositePreviewModal } from '@/components/MicrositePreviewModal';
import { useMicrosites } from '@/hooks/useMicrosites';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SortField = 'name' | 'created_at' | 'scan_count' | 'status';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'draft' | 'published';

export default function Microsites() {
  const navigate = useNavigate();
  const { microsites, loading, error, refetch } = useMicrosites();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (micrositeId: string) => {
    navigate(`/microsites/${micrositeId}/edit`);
  };

  const handleCreateMicrosite = async () => {
    try {
      const micrositeId = nanoid();
      const micrositeUrl = `microsite-${nanoid(8)}`;
      
      // Create a new microsite with auto-generated data
      const { error } = await supabase
        .from('microsites')
        .insert({
          id: micrositeId,
          name: `New Microsite ${Date.now()}`,
          url: micrositeUrl,
          status: 'draft',
          user_id: 'system', // This should be replaced with actual user ID when auth is implemented
          scan_count: 0
        });

      if (error) throw error;

      toast.success('Microsite created successfully');
      navigate(`/microsites/${micrositeId}/edit`);
    } catch (error) {
      console.error('Error creating microsite:', error);
      toast.error('Failed to create microsite');
    }
  };

  const filteredAndSortedMicrosites = microsites
    .filter(microsite => {
      const matchesSearch = microsite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        microsite.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${microsite.user.first_name} ${microsite.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || microsite.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'scan_count':
          aValue = a.scan_count;
          bValue = b.scan_count;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedMicrosites.length / itemsPerPage);
  const paginatedMicrosites = filteredAndSortedMicrosites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Microsites</h1>
          <p className="text-muted-foreground">Manage user microsites and landing pages</p>
        </div>
        <Button onClick={handleCreateMicrosite}>
          <Plus className="h-4 w-4 mr-2" />
          Create Microsite
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search microsites or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Microsites Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('name')}
                  className="h-8 p-0 font-semibold"
                >
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('status')}
                  className="h-8 p-0 font-semibold"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('created_at')}
                  className="h-8 p-0 font-semibold"
                >
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('scan_count')}
                  className="h-8 p-0 font-semibold"
                >
                  Scans
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                </TableRow>
              ))
            ) : paginatedMicrosites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No microsites found matching your filters.' 
                    : 'No microsites found.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedMicrosites.map((microsite) => (
                <TableRow 
                  key={microsite.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(microsite.id)}
                >
                  <TableCell className="font-medium">
                    {microsite.name}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={microsite.status === 'published' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {microsite.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {microsite.user.first_name} {microsite.user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {microsite.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(microsite.created_at)}</TableCell>
                  <TableCell className="font-mono">
                    {microsite.scan_count.toLocaleString()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-1">
                      <QRCodeModal 
                        micrositeUrl={microsite.url || `https://example.com/m/${microsite.id}`}
                        micrositeName={microsite.name}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <MicrositePreviewModal
                        micrositeUrl={microsite.url}
                        micrositeName={microsite.name}
                        status={microsite.status as 'draft' | 'published'}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRowClick(microsite.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination and Summary */}
      {!loading && filteredAndSortedMicrosites.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedMicrosites.length)} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedMicrosites.length)} of{' '}
            {filteredAndSortedMicrosites.length} microsites
            {(searchTerm || statusFilter !== 'all') && (
              <span> (filtered from {microsites.length} total)</span>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                {totalPages > 5 && <span className="text-muted-foreground">...</span>}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">Error: {error}</p>
        </div>
      )}
    </div>
  );
}