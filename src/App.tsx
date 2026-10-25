import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import NodesPage from "@/pages/NodesPage";
import FilesPage from "@/pages/FilesPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import OperationsPage from "@/pages/OperationsPage";
import ArchitecturePage from "@/pages/ArchitecturePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/nodes" element={<NodesPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
          </Route>
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
