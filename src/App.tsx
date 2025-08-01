import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DebugProvider, useDebug } from "@/contexts/DebugContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { DebugFloatingButton } from "@/components/DebugFloatingButton";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createDebugSupabaseClient, debugFetch } from "@/utils/debugWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import Index from "./pages/Index";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Microsites from "./pages/Microsites";
import MicrositeEdit from "./pages/MicrositeEdit";
import PublicMicrosite from "./pages/PublicMicrosite";
import NotFound from "./pages/NotFound";
import { Auth } from "./pages/Auth";

const queryClient = new QueryClient();

// Debug initialization component
const DebugInitializer = ({ children }: { children: React.ReactNode }) => {
  const { addEntry } = useDebug();
  const initializedRef = useRef(false);
  
  useEffect(() => {
    // Only initialize once per app lifecycle
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Initialize global fetch debugging
    const restoreFetch = debugFetch(addEntry);
    
    // Replace the Supabase client globally with debug-wrapped version
    const debugClient = createDebugSupabaseClient(supabase, addEntry);
    Object.setPrototypeOf(supabase, Object.getPrototypeOf(debugClient));
    Object.assign(supabase, debugClient);
    
    // Log initialization once
    addEntry({
      type: 'info',
      source: 'Debug System',
      request: { action: 'Debug system initialized' },
    });
    
    return () => {
      restoreFetch();
    };
  }, []); // Empty dependency array to run only once
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DebugProvider>
      <AuthProvider>
        <DebugInitializer>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Header />
              <main className="min-h-screen">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/users" element={
                    <ProtectedRoute requireAdmin>
                      <Users />
                    </ProtectedRoute>
                  } />
                  <Route path="/users/:userId" element={
                    <ProtectedRoute requireAdmin>
                      <UserDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/microsites" element={
                    <ProtectedRoute>
                      <Microsites />
                    </ProtectedRoute>
                  } />
                  <Route path="/microsites/:id/edit" element={
                    <ProtectedRoute>
                      <MicrositeEdit />
                    </ProtectedRoute>
                  } />
                  <Route path="/microsites/new" element={
                    <ProtectedRoute>
                      <MicrositeEdit />
                    </ProtectedRoute>
                  } />
                  <Route path="/m/:micrositeUrl" element={<PublicMicrosite />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </BrowserRouter>
            <DebugFloatingButton />
          </TooltipProvider>
        </DebugInitializer>
      </AuthProvider>
    </DebugProvider>
  </QueryClientProvider>
);

export default App;
