import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, ChevronDown, ChevronRight, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadDebuggerProps {
  qrDataUrl: string;
}

interface UploadAttempt {
  id: string;
  timestamp: string;
  method: string;
  success: boolean;
  error?: string;
  response?: any;
  requestDetails?: any;
}

export const FileUploadDebugger: React.FC<FileUploadDebuggerProps> = ({ qrDataUrl }) => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [attempts, setAttempts] = useState<UploadAttempt[]>([]);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  const addAttempt = (attempt: Omit<UploadAttempt, 'id' | 'timestamp'>) => {
    const newAttempt: UploadAttempt = {
      ...attempt,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setAttempts(prev => [newAttempt, ...prev]);
    return newAttempt.id;
  };

  const analyzeQRCode = () => {
    try {
      const base64Data = qrDataUrl.split(',')[1];
      const mimeType = qrDataUrl.split(',')[0].split(':')[1].split(';')[0];
      const decoded = atob(base64Data);
      
      return {
        mimeType,
        base64Length: base64Data.length,
        decodedSize: decoded.length,
        firstChars: base64Data.substring(0, 50) + '...',
        lastChars: '...' + base64Data.substring(base64Data.length - 50),
        isValidBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Analysis failed' };
    }
  };

  const testFileUpload = async (method: string, customFormData?: FormData) => {
    setTesting(true);
    const attemptId = addAttempt({ method, success: false });

    try {
      let formData: FormData;
      let requestDetails: any = {};

      if (customFormData) {
        formData = customFormData;
      } else {
        // Create blob from data URL
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        const filename = `qr-code-debug-${Date.now()}.png`;

        formData = new FormData();
        
        // Try different field names based on method
        switch (method) {
          case 'files_array':
            formData.append('files[]', blob, filename);
            break;
          case 'file_single':
            formData.append('file', blob, filename);
            break;
          case 'files_no_bracket':
            formData.append('files', blob, filename);
            break;
          case 'current_method':
          default:
            formData.append('files[]', blob, filename);
            break;
        }

        formData.append('type', 'default');

        // Capture request details for debugging
        requestDetails = {
          filename,
          blobSize: blob.size,
          blobType: blob.type,
          formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
            key,
            valueType: typeof value,
            isFile: value instanceof File,
            fileName: value instanceof File ? value.name : undefined,
            fileSize: value instanceof File ? value.size : undefined,
          })),
        };
      }

      // Test upload via edge function
      const uploadResponse = await supabase.functions.invoke('printful-upload-file', {
        body: { 
          imageDataUrl: qrDataUrl, 
          filename: `qr-code-debug-${method}-${Date.now()}.png` 
        }
      });

      const success = !uploadResponse.error;
      
      // Update attempt with results
      setAttempts(prev => prev.map(attempt => 
        attempt.id === attemptId 
          ? { 
              ...attempt, 
              success,
              error: uploadResponse.error?.message,
              response: uploadResponse.data || uploadResponse.error,
              requestDetails,
            }
          : attempt
      ));

      if (success) {
        toast({
          title: `✅ ${method} upload succeeded!`,
          description: `File ID: ${uploadResponse.data?.fileId}`,
        });
      } else {
        toast({
          title: `❌ ${method} upload failed`,
          description: uploadResponse.error?.message || 'Unknown error',
          variant: 'destructive',
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setAttempts(prev => prev.map(attempt => 
        attempt.id === attemptId 
          ? { 
              ...attempt, 
              success: false,
              error: errorMessage,
            }
          : attempt
      ));

      toast({
        title: `❌ ${method} test failed`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const qrAnalysis = analyzeQRCode();

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <FileText className="h-5 w-5" />
          File Upload Debugger
          <Badge variant="outline" className="text-xs">DEBUG MODE</Badge>
        </CardTitle>
        <CardDescription className="text-amber-700">
          Test different file upload methods to isolate the Printful API issue
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* QR Code Analysis */}
        <Collapsible open={debugPanelOpen} onOpenChange={setDebugPanelOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                QR Code Analysis
              </span>
              {debugPanelOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-muted/30 p-3 rounded text-sm font-mono space-y-2">
              {qrAnalysis.error ? (
                <div className="text-destructive">Error: {qrAnalysis.error}</div>
              ) : (
                <>
                  <div><strong>MIME Type:</strong> {qrAnalysis.mimeType}</div>
                  <div><strong>Base64 Length:</strong> {qrAnalysis.base64Length?.toLocaleString()} chars</div>
                  <div><strong>Decoded Size:</strong> {qrAnalysis.decodedSize?.toLocaleString()} bytes</div>
                  <div><strong>Valid Base64:</strong> {qrAnalysis.isValidBase64 ? '✅' : '❌'}</div>
                  <div><strong>First 50 chars:</strong> {qrAnalysis.firstChars}</div>
                  <div><strong>Last 50 chars:</strong> {qrAnalysis.lastChars}</div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Test Upload Methods */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Test Different Upload Methods</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testFileUpload('current_method')}
              disabled={testing}
              className="justify-start"
            >
              {testing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              Current (files[])
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testFileUpload('file_single')}
              disabled={testing}
              className="justify-start"
            >
              {testing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              Single (file)
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testFileUpload('files_no_bracket')}
              disabled={testing}
              className="justify-start"
            >
              {testing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              No Brackets (files)
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testFileUpload('files_array')}
              disabled={testing}
              className="justify-start"
            >
              {testing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              Array (files[])
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {attempts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Test Results</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="border rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {attempt.success ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium">{attempt.method}</span>
                      <Badge variant={attempt.success ? "default" : "destructive"} className="text-xs">
                        {attempt.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{attempt.timestamp}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(prev => ({ ...prev, [attempt.id]: !prev[attempt.id] }))}
                      >
                        {showDetails[attempt.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  
                  {attempt.error && (
                    <div className="mt-1 text-xs text-destructive bg-destructive/10 p-1 rounded">
                      {attempt.error}
                    </div>
                  )}
                  
                  {showDetails[attempt.id] && (
                    <div className="mt-2 text-xs bg-muted/30 p-2 rounded font-mono">
                      <div><strong>Request Details:</strong></div>
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(attempt.requestDetails, null, 2)}
                      </pre>
                      <div className="mt-2"><strong>Response:</strong></div>
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(attempt.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {attempts.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Summary:</strong> {attempts.filter(a => a.success).length} successful, {attempts.filter(a => !a.success).length} failed out of {attempts.length} attempts.
              {attempts.some(a => a.success) && (
                <div className="mt-1 text-success font-medium">
                  ✅ Working method found! Use the successful method for production.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};