import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useDFS } from '@/hooks/useDFS';
import { TopologyMap } from '@/components/TopologyMap';
import { NodeCard } from '@/components/NodeCard';
import { CreateNodeDialog } from '@/components/CreateNodeDialog';

export default function NodesPage() {
  const {
    nodes,
    files,
    onlineNodes,
    offlineNodes,
    toggleNode,
    addNode,
    deleteNode
  } = useDFS();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Cluster Nodes & Topology
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time visual map connecting Master NameNode to storage workers across rack domains.
          </p>
        </div>

        <CreateNodeDialog
          onCreateNode={addNode}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-3.5 rounded-lg shadow-xs border-0 self-start sm:self-auto"
        />
      </div>

      {/* Section 1: Interactive Network Topology Map */}
      <TopologyMap nodes={nodes} onToggleNode={toggleNode} />

      {/* Section 2: DataNodes Physical Hardware & Storage Cards */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Registered DataNode Pool ({nodes.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {onlineNodes.length} active online • {offlineNodes.length} offline
            </p>
          </div>

          <Badge variant="outline" className="border-slate-200 text-slate-700 bg-white text-xs font-mono">
            Heartbeat: 3000ms
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              nodes={nodes}
              files={files}
              onToggleStatus={toggleNode}
              onDeleteNode={deleteNode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
