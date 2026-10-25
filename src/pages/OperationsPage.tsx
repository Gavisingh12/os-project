import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useDFS } from '@/hooks/useDFS';

export default function OperationsPage() {
  const {
    nodes,
    files,
    onlineNodes,
    offlineNodes,
    rebalance,
    selfHeal,
    resetCluster,
    isProcessing
  } = useDFS();

  const underReplicatedFiles = files.filter(f => {
    const liveCount = f.replicas.filter(r =>
      onlineNodes.some(on => on.id === r.node_id)
    ).length;
    return liveCount < f.targetReplicationFactor;
  });

  const isQuorumNormal = onlineNodes.length >= Math.ceil(nodes.length / 2);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Cluster Maintenance & Fault Recovery
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Automated replica self-healing, greedy storage rebalancing, and cluster state management
        </p>
      </div>

      {/* Cluster Health Banner */}
      <div className="enterprise-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="icon-squircle">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900 tracking-tight">Coordinator Heartbeat Monitor</h4>
              <Badge
                variant="outline"
                className={`text-xs font-mono font-semibold ${
                  isQuorumNormal
                    ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    : 'border-amber-200 text-amber-700 bg-amber-50'
                }`}
              >
                {isQuorumNormal ? 'Quorum Healthy' : 'Quorum Degraded'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Heartbeat polling active • {onlineNodes.length}/{nodes.length} DataNodes responsive • Quorum threshold: <span className="font-mono font-semibold text-slate-700">{Math.ceil(nodes.length / 2)}</span> nodes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={resetCluster}
            disabled={isProcessing}
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs h-9 px-3.5 rounded-lg shadow-xs transition-colors font-medium"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Reset Cluster State
          </Button>
        </div>
      </div>

      {/* Operation Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Operation 1: Automated Self-Healing */}
        <div className="enterprise-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="icon-squircle">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">Cluster Self-Healing Engine</h3>
                  <span className="text-[11px] text-slate-500">Automated Under-Replication Recovery</span>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-xs font-mono font-bold ${
                  underReplicatedFiles.length > 0
                    ? 'border-amber-200 text-amber-700 bg-amber-50'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                }`}
              >
                {underReplicatedFiles.length > 0 ? `${underReplicatedFiles.length} Under-Replicated` : 'All Replicas Healthy'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              When DataNodes crash or fail, files lose redundancy. Self-healing scans the metadata catalog, detects blocks with fewer active replicas than the target replication factor, and recreates new block copies on healthy surviving nodes.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Healthy Storage Nodes:</span>
                <span className="text-slate-800 font-bold">{onlineNodes.length} Online</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Files Requiring Repair:</span>
                <span className={underReplicatedFiles.length > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {underReplicatedFiles.length} File(s)
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={selfHeal}
            disabled={isProcessing || onlineNodes.length === 0}
            className="enterprise-btn-primary w-full font-semibold text-xs h-9 rounded-lg border-0 transition-colors mt-auto"
          >
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Trigger Self-Healing Scan
          </Button>
        </div>

        {/* Operation 2: Storage Rebalancing */}
        <div className="enterprise-card p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="icon-squircle">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">Storage Rebalance Engine</h3>
                  <span className="text-[11px] text-slate-500">Uniform Load Distribution</span>
                </div>
              </div>

              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs font-mono font-bold">
                Variance Optimizer
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              As files are uploaded and deleted, certain DataNodes can become disproportionately filled. The rebalancer computes the standard deviation of cluster storage and moves block replicas to achieve uniform capacity across all active nodes.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Eligible Rebalance Targets:</span>
                <span className="text-slate-800 font-bold">{onlineNodes.length} Online</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Algorithm:</span>
                <span className="text-blue-600 font-bold font-mono">Greedy Variance Minimization</span>
              </div>
            </div>
          </div>

          <Button
            onClick={rebalance}
            disabled={isProcessing || onlineNodes.length < 2}
            className="enterprise-btn-primary w-full font-semibold text-xs h-9 rounded-lg border-0 transition-colors mt-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isProcessing ? 'animate-spin' : ''}`} />
            Run Cluster Rebalancing
          </Button>
        </div>
      </div>
    </div>
  );
}
