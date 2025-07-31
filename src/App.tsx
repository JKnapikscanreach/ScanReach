import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DebugProvider, useDebug } from "@/contexts/DebugContext";
import { DebugFloatingButton } from "@/components/DebugFloatingButton";
import { Header } from "@/components/Header";
import { createDebugSupabaseClient, debugFetch } from "@/utils/debugWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import Index from "./pages/Index";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Microsites from "./pages/Microsites";
import MicrositeEdit from "./pages/MicrositeEdit";
import NotFound from "./pages/NotFound";

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
      <DebugInitializer>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:userId" element={<UserDetail />} />
                <Route path="/microsites" element={<Microsites />} />
                <Route path="/microsites/:id/edit" element={<MicrositeEdit />} />
                <Route path="/microsites/new" element={<MicrositeEdit />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </BrowserRouter>
          <DebugFloatingButton />
        </TooltipProvider>
      </DebugInitializer>
    </DebugProvider>
  </QueryClientProvider>
);

export default App;
