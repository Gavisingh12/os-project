import { Server, Activity, ShieldCheck, RotateCcw, Wrench, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  onlineCount: number;
  totalCount: number;
  healthPercent: number;
  onRebalance: () => void;
  onSelfHeal: () => void;
  onReset: () => void;
  isProcessing?: boolean;
}

export default function Navbar({
  onlineCount,
  totalCount,
  healthPercent,
  onRebalance,
  onSelfHeal,
  onReset,
  isProcessing = false
}: NavbarProps) {
  const isHealthy = healthPercent >= 75;
  const isDegraded = healthPercent > 0 && healthPercent < 75;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/20">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Distributed File System
              </h1>
              <Badge variant="outline" className="hidden sm:inline-flex border-cyan-500/30 text-cyan-400 bg-cyan-950/30 text-xs font-mono">
                DFS Cluster v2.4
              </Badge>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Fault-Tolerant Block Storage & Replication Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Cluster Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Health Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'bg-emerald-400' : isDegraded ? 'bg-amber-400' : 'bg-rose-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-rose-500'}`} />
            </span>
            <span className="text-slate-300 font-medium hidden md:inline">Cluster Status:</span>
            <span className={`font-semibold ${isHealthy ? 'text-emerald-400' : isDegraded ? 'text-amber-400' : 'text-rose-400'}`}>
              {onlineCount}/{totalCount} Nodes Live ({healthPercent}%)
            </span>
          </div>

          {/* Quick cluster ops */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSelfHeal}
            disabled={isProcessing}
            title="Scan cluster and heal under-replicated files"
            className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs hidden sm:flex items-center gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Self-Heal</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRebalance}
            disabled={isProcessing}
            title="Redistribute block replicas uniformly across online nodes"
            className="border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs hidden md:flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Rebalance</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isProcessing}
            title="Reset to default demo nodes & files"
            className="text-slate-400 hover:text-slate-100 text-xs flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Cluster</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
