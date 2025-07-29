import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDebug, DebugEntry } from '@/contexts/DebugContext';
import { ChevronDown, ChevronRight, Download, Trash2, Search, Filter } from 'lucide-react';

interface MasterDebugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MasterDebugModal: React.FC<MasterDebugModalProps> = ({ open, onOpenChange }) => {
  const { entries, clearEntries, exportEntries } = useDebug();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = searchTerm === '' || 
        entry.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.error?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || entry.type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [entries, searchTerm, filterType]);

  const toggleExpanded = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const getStatusColor = (entry: DebugEntry) => {
    if (entry.error) return 'destructive';
    if (entry.status && entry.status >= 400) return 'destructive';
    if (entry.status && entry.status >= 300) return 'secondary';
    return 'default';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'supabase': return 'bg-green-100 text-green-800';
      case 'fetch': return 'bg-blue-100 text-blue-800';
      case 'edge-function': return 'bg-purple-100 text-purple-800';
      case 'upload': return 'bg-orange-100 text-orange-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return `${duration}ms`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString() + '.' + timestamp.getMilliseconds().toString().padStart(3, '0');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Master Debug Console
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportEntries}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={clearEntries}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by URL, source, or error..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All ({entries.length})
            </Button>
            <Button
              variant={filterType === 'error' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('error')}
            >
              Errors ({entries.filter(e => e.type === 'error').length})
            </Button>
            <Button
              variant={filterType === 'supabase' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('supabase')}
            >
              Supabase ({entries.filter(e => e.type === 'supabase').length})
            </Button>
            <Button
              variant={filterType === 'edge-function' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('edge-function')}
            >
              Edge Functions ({entries.filter(e => e.type === 'edge-function').length})
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="p-3">
                <Collapsible>
                  <CollapsibleTrigger
                    className="w-full"
                    onClick={() => toggleExpanded(entry.id)}
                  >
                    <div className="flex items-center justify-between w-full text-left">
                      <div className="flex items-center gap-3">
                        {expandedEntries.has(entry.id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                        <Badge className={getTypeColor(entry.type)}>
                          {entry.type}
                        </Badge>
                        <span className="font-mono text-sm">
                          {entry.method} {entry.url}
                        </span>
                        {entry.status && (
                          <Badge variant={getStatusColor(entry)}>
                            {entry.status}
                          </Badge>
                        )}
                        {entry.duration && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(entry.duration)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        {entry.source && (
                          <Badge variant="outline" className="text-xs">
                            {entry.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {entry.request && (
                        <div>
                          <h4 className="font-semibold mb-2">Request</h4>
                          <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(entry.request, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {entry.response && (
                        <div>
                          <h4 className="font-semibold mb-2">Response</h4>
                          <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(entry.response, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {entry.error && (
                        <div className="md:col-span-2">
                          <h4 className="font-semibold mb-2 text-destructive">Error</h4>
                          <pre className="bg-destructive/10 border border-destructive/20 p-3 rounded text-xs overflow-auto">
                            {entry.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
            
            {filteredEntries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {entries.length === 0 
                  ? 'No debug entries yet. Enable debug mode and start making requests.'
                  : 'No entries match your search criteria.'
                }
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};