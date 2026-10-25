import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Server, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4 font-sans">
      <div className="text-center max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
        <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
          <Server className="h-6 w-6" />
        </div>
        <h1 className="text-5xl font-extrabold font-mono text-blue-600">404</h1>
        <h2 className="text-lg font-bold text-slate-900">Cluster Route Not Found</h2>
        <p className="text-xs text-slate-500">
          The path <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-slate-800">{location.pathname}</code> does not map to any active cluster module or page.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-4 rounded-lg border-0 shadow-xs transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Return to Cluster Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

