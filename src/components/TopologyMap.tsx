import React from 'react';
import { DFSNode, formatBytes } from '@/services/dfsEngine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Server, Network, HardDrive, Power } from 'lucide-react';

interface TopologyMapProps {
  nodes: DFSNode[];
  onToggleNode: (nodeId: string) => void;
}

export function TopologyMap({ nodes, onToggleNode }: TopologyMapProps) {
  const onlineCount = nodes.filter(n => n.status === 'online').length;

  return (
    <div className="enterprise-card p-5 sm:p-6 space-y-6">
      {/* Topology Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="icon-squircle">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Interactive Cluster Topology
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Real-time coordinator network routing blocks across rack domains. Simulate individual node crashes or full rack power outages.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Rack-Alpha Switch Control */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const alphaNodes = nodes.filter(n => n.rack === 'Rack-Alpha');
              const anyOnline = alphaNodes.some(n => n.status === 'online');
              alphaNodes.forEach(n => {
                if (anyOnline && n.status === 'online') onToggleNode(n.id);
                else if (!anyOnline && n.status === 'offline') onToggleNode(n.id);
              });
            }}
            className="text-[11px] font-mono font-semibold h-7 px-2.5 rounded-lg border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-2xs"
          >
            <Power className="h-3 w-3 mr-1 text-blue-600" />
            Toggle Rack-Alpha
          </Button>

          {/* Rack-Beta Switch Control */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const betaNodes = nodes.filter(n => n.rack === 'Rack-Beta');
              const anyOnline = betaNodes.some(n => n.status === 'online');
              betaNodes.forEach(n => {
                if (anyOnline && n.status === 'online') onToggleNode(n.id);
                else if (!anyOnline && n.status === 'offline') onToggleNode(n.id);
              });
            }}
            className="text-[11px] font-mono font-semibold h-7 px-2.5 rounded-lg border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-2xs"
          >
            <Power className="h-3 w-3 mr-1 text-blue-600" />
            Toggle Rack-Beta
          </Button>

          <Badge
            variant="outline"
            className={`text-xs font-mono font-semibold px-2.5 py-0.5 border ${
              onlineCount >= Math.ceil(nodes.length / 2)
                ? 'border-emerald-200 text-emerald-800 bg-emerald-50'
                : 'border-rose-200 text-rose-800 bg-rose-50'
            }`}
          >
            {onlineCount >= Math.ceil(nodes.length / 2) ? 'Quorum Active' : 'Quorum Degraded'}
          </Badge>
        </div>
      </div>

      {/* Master Coordinator Box - Symmetrically Centered */}
      <div className="flex flex-col items-center justify-center">
        <div className="bg-gradient-to-r from-blue-50/60 via-white to-blue-50/40 border border-blue-200/80 rounded-xl p-4 shadow-card w-full max-w-md flex items-center gap-4 ring-1 ring-blue-500/10">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Server className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 tracking-tight">Master Coordinator (NameNode)</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1">
              <span className="font-semibold text-slate-800">192.168.10.1:9000</span>
              <span>•</span>
              <span className="text-blue-600 font-bold font-sans">Active Leader</span>
              <span>•</span>
              <span>Heartbeat: 3000ms</span>
            </div>
          </div>
        </div>

        {/* Clean Symmetrical Line Downward with Active Pulse */}
        <div className="w-0.5 h-6 bg-blue-500/60"></div>
        <div className="w-full max-w-3xl h-0.5 bg-slate-200 relative">
          <div className="absolute left-1/2 -top-1 w-2.5 h-2.5 rounded-full bg-blue-600 -translate-x-1/2 shadow-xs"></div>
        </div>
      </div>

      {/* DataNodes Grid with Identical Height & Symmetrical Alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {nodes.map((node) => {
          const isOnline = node.status === 'online';
          const usagePercent = Math.round((node.storage_used / node.storage_total) * 100);

          return (
            <div
              key={node.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                isOnline
                  ? 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-card shadow-xs'
                  : 'bg-rose-50/20 border-rose-200/80 opacity-90'
              }`}
            >
              {/* Node Card Top */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center border ${
                      isOnline
                        ? 'border-blue-100 bg-blue-50 text-blue-600'
                        : 'border-rose-200 bg-rose-50 text-rose-600'
                    }`}>
                      <HardDrive className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">
                        {node.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {node.ip}:{node.port}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono px-2 py-0.5 font-semibold ${
                      isOnline
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-rose-200 bg-rose-50 text-rose-800'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>

                {/* Rack Domain Badge */}
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 font-mono">
                  <span className="text-[11px] text-slate-500 font-sans font-medium">Domain:</span>
                  <span className="font-bold text-slate-800 text-[11px]">{node.rack}</span>
                </div>

                {/* Storage Meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>Capacity:</span>
                    <span className="font-bold text-slate-900">
                      {formatBytes(node.storage_used)} / {formatBytes(node.storage_total)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        usagePercent > 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-mono font-medium">
                    {usagePercent}% utilized
                  </div>
                </div>
              </div>

              {/* Action Button Pinned to Bottom */}
              <div className="pt-3 mt-auto border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleNode(node.id)}
                  className={`w-full text-xs font-semibold h-8 rounded-lg border transition-all ${
                    isOnline
                      ? 'border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:border-rose-300'
                      : 'border-blue-200 bg-white hover:bg-blue-50 text-blue-600 hover:border-blue-300'
                  }`}
                >
                  <Power className="h-3 w-3 mr-1.5" />
                  {isOnline ? 'Simulate Crash' : 'Reactivate Node'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
