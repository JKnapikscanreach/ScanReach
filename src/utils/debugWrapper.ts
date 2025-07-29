import { SupabaseClient } from '@supabase/supabase-js';
import { DebugEntry } from '@/contexts/DebugContext';

// Debug wrapper for Supabase operations
export const createDebugSupabaseClient = (
  client: SupabaseClient,
  addDebugEntry: (entry: Omit<DebugEntry, 'id' | 'timestamp'>) => void
) => {
  return new Proxy(client, {
    get(target, prop) {
      const original = target[prop as keyof SupabaseClient];
      
      if (prop === 'from') {
        return (table: string) => {
          const queryBuilder = (target as any).from(table);
          return createDebugQueryBuilder(queryBuilder, table, addDebugEntry);
        };
      }
      
      if (prop === 'functions') {
        return {
          invoke: async (functionName: string, options?: any) => {
            const startTime = Date.now();
            try {
              addDebugEntry({
                type: 'edge-function',
                method: 'POST',
                url: `functions/${functionName}`,
                request: options,
                source: 'Supabase Edge Function'
              });

              const result = await target.functions.invoke(functionName, options);
              const duration = Date.now() - startTime;

              addDebugEntry({
                type: 'edge-function',
                method: 'POST', 
                url: `functions/${functionName}`,
                request: options,
                response: result,
                duration,
                status: result.error ? 500 : 200,
                error: result.error?.message,
                source: 'Supabase Edge Function'
              });

              return result;
            } catch (error) {
              const duration = Date.now() - startTime;
              addDebugEntry({
                type: 'error',
                method: 'POST',
                url: `functions/${functionName}`,
                request: options,
                duration,
                error: error instanceof Error ? error.message : 'Unknown error',
                source: 'Supabase Edge Function'
              });
              throw error;
            }
          }
        };
      }

      if (prop === 'storage') {
        return {
          from: (bucket: string) => ({
            upload: async (path: string, file: File | Blob, options?: any) => {
              const startTime = Date.now();
              try {
                addDebugEntry({
                  type: 'upload',
                  method: 'POST',
                  url: `storage/${bucket}/${path}`,
                  request: { 
                    fileName: file instanceof File ? file.name : 'blob',
                    fileSize: file.size,
                    fileType: file.type,
                    options 
                  },
                  source: 'Supabase Storage'
                });

                const result = await target.storage.from(bucket).upload(path, file, options);
                const duration = Date.now() - startTime;

                addDebugEntry({
                  type: 'upload',
                  method: 'POST',
                  url: `storage/${bucket}/${path}`,
                  request: { 
                    fileName: file instanceof File ? file.name : 'blob',
                    fileSize: file.size,
                    fileType: file.type,
                    options 
                  },
                  response: result,
                  duration,
                  status: result.error ? 400 : 200,
                  error: result.error?.message,
                  source: 'Supabase Storage'
                });

                return result;
              } catch (error) {
                const duration = Date.now() - startTime;
                addDebugEntry({
                  type: 'error',
                  method: 'POST',
                  url: `storage/${bucket}/${path}`,
                  duration,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  source: 'Supabase Storage'
                });
                throw error;
              }
            }
          })
        };
      }

      return original;
    }
  });
};

// Debug wrapper for query builder operations
const createDebugQueryBuilder = (
  queryBuilder: any,
  table: string,
  addDebugEntry: (entry: Omit<DebugEntry, 'id' | 'timestamp'>) => void
) => {
  return new Proxy(queryBuilder, {
    get(target, prop) {
      const original = target[prop];

      // Intercept execution methods
      if (['single', 'maybeSingle', 'then', 'catch'].includes(prop as string)) {
        return async function(...args: any[]) {
          const startTime = Date.now();
          const operation = target.url?.split('/').pop() || 'unknown';
          
          try {
            addDebugEntry({
              type: 'supabase',
              method: target.method || 'GET',
              url: `table/${table}`,
              request: { 
                operation,
                query: target.url,
                headers: target.headers 
              },
              source: 'Supabase Query'
            });

            const result = await original.apply(target, args);
            const duration = Date.now() - startTime;

            addDebugEntry({
              type: 'supabase',
              method: target.method || 'GET',
              url: `table/${table}`,
              request: { 
                operation,
                query: target.url,
                headers: target.headers 
              },
              response: result,
              duration,
              status: result.error ? 400 : 200,
              error: result.error?.message,
              source: 'Supabase Query'
            });

            return result;
          } catch (error) {
            const duration = Date.now() - startTime;
            addDebugEntry({
              type: 'error',
              method: target.method || 'GET',
              url: `table/${table}`,
              duration,
              error: error instanceof Error ? error.message : 'Unknown error',
              source: 'Supabase Query'
            });
            throw error;
          }
        };
      }

      return original;
    }
  });
};

// Debug wrapper for fetch requests with enhanced API tracking
export const debugFetch = (
  addDebugEntry: (entry: Omit<DebugEntry, 'id' | 'timestamp'>) => void
) => {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const startTime = Date.now();
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    
    // Enhanced request logging
    const requestBody = init?.body;
    let parsedRequestBody;
    
    if (requestBody) {
      try {
        if (typeof requestBody === 'string') {
          parsedRequestBody = JSON.parse(requestBody);
        } else {
          parsedRequestBody = requestBody;
        }
      } catch {
        parsedRequestBody = requestBody;
      }
    }

    // Determine API provider
    let apiProvider = 'Unknown';
    if (url.includes('printful.com')) {
      apiProvider = 'Printful';
    } else if (url.includes('supabase.co')) {
      apiProvider = 'Supabase';
    } else if (url.includes('/functions/v1/')) {
      apiProvider = 'Edge Function';
    }

    addDebugEntry({
      type: 'fetch',
      method,
      url,
      source: `${apiProvider} API`,
      request: {
        headers: init?.headers ? Object.fromEntries(
          Object.entries(init.headers).map(([k, v]) => 
            k.toLowerCase().includes('authorization') ? [k, '[REDACTED]'] : [k, v]
          )
        ) : undefined,
        body: parsedRequestBody,
        timestamp: new Date().toISOString(),
      },
    });

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;
      
      let responseData;
      let responseHeaders: Record<string, string> = {};
      
      try {
        // Capture response headers
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        responseData = await response.clone().text();
        try {
          responseData = JSON.parse(responseData);
        } catch {
          // Keep as string if not JSON
        }
      } catch {
        responseData = 'Unable to read response body';
      }

      addDebugEntry({
        type: response.ok ? 'fetch' : 'error',
        method,
        url,
        source: `${apiProvider} API`,
        request: {
          headers: init?.headers ? Object.fromEntries(
            Object.entries(init.headers).map(([k, v]) => 
              k.toLowerCase().includes('authorization') ? [k, '[REDACTED]'] : [k, v]
            )
          ) : undefined,
          body: parsedRequestBody,
          timestamp: new Date().toISOString(),
        },
        response: {
          data: responseData,
          headers: responseHeaders,
          timestamp: new Date().toISOString(),
        },
        status: response.status,
        duration,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      addDebugEntry({
        type: 'error',
        method,
        url,
        source: `${apiProvider} API`,
        request: {
          headers: init?.headers ? Object.fromEntries(
            Object.entries(init.headers).map(([k, v]) => 
              k.toLowerCase().includes('authorization') ? [k, '[REDACTED]'] : [k, v]
            )
          ) : undefined,
          body: parsedRequestBody,
          timestamp: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  };

  return () => {
    window.fetch = originalFetch;
  };
};