import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Microsite {
  id: string;
  name: string;
  url?: string;
  created_at: string;
  updated_at: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function Microsites() {
  const [microsites, setMicrosites] = useState<Microsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMicrosites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('microsites')
        .select(`
          *,
          user:users(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMicrosites(data || []);
    } catch (error) {
      console.error('Error fetching microsites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMicrosites();
  }, []);

  const filteredMicrosites = microsites.filter(microsite =>
    microsite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    microsite.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${microsite.user.first_name} ${microsite.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Microsite
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search microsites or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Microsites Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading microsites...
                </TableCell>
              </TableRow>
            ) : filteredMicrosites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {searchTerm ? 'No microsites found matching your search.' : 'No microsites found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMicrosites.map((microsite) => (
                <TableRow key={microsite.id}>
                  <TableCell className="font-medium">
                    {microsite.name}
                  </TableCell>
                  <TableCell>
                    {microsite.url ? (
                      <a
                        href={microsite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {microsite.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
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
                  <TableCell>
                    <Badge variant={microsite.url ? 'default' : 'secondary'}>
                      {microsite.url ? 'Active' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {!loading && filteredMicrosites.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredMicrosites.length} of {microsites.length} microsites
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}