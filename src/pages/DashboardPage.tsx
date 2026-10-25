import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Files,
  Server,
  HardDrive,
  ShieldCheck,
  ArrowRight,
  Eye,
  Download,
  Power,
  RefreshCw,
  Search,
  Activity,
  Layers,
  Trash2
} from 'lucide-react';
import { useDFS } from '@/hooks/useDFS';
import { FilePreviewDialog } from '@/components/FilePreviewDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DashboardPage() {
  const {
    nodes,
    files,
    onlineNodes,
    offlineNodes,
    totalStorageBytes,
    usedStorageBytes,
    clusterHealthPercent,
    averageReplication,
    downloadFile,
    deleteFile,
    toggleNode,
    selfHeal,
    rebalance,
    isProcessing,
    formatBytes
  } = useDFS();

  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const totalBlocks = files.reduce((acc, f) => acc + (f.chunks?.length || 0), 0);
  const isQuorumHealthy = onlineNodes.length >= Math.ceil(nodes.length / 2);

  const underReplicatedFiles = files.filter(f => {
    const liveCount = f.replicas.filter(r =>
      onlineNodes.some(on => on.id === r.node_id)
    ).length;
    return liveCount < f.targetReplicationFactor;
  });

  const handleOpenPreview = (file: any) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, typeof nodes[0]>);

  const [simSpeed, setSimSpeed] = useState<number>(1);

  return (
    <div className="space-y-5">
      {/* 1. Clean Minimalist Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Cluster Dashboard
            </h2>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
              isQuorumHealthy
                ? 'border-emerald-200 text-emerald-800 bg-emerald-50'
                : 'border-rose-200 text-rose-800 bg-rose-50'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isQuorumHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {isQuorumHealthy ? 'Quorum Healthy' : 'Quorum Degraded'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master NameNode: <span className="font-mono text-slate-700 font-semibold">192.168.10.1:9000</span> • Heartbeat Interval: <span className="font-mono font-medium">{Math.round(3000 / simSpeed)}ms</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Simulation Clock Speed Controller */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
            <span className="text-[10px] text-slate-500 font-mono font-semibold mr-1">Rate:</span>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  simSpeed === spd
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={selfHeal}
            disabled={isProcessing || onlineNodes.length === 0}
            className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs h-8 px-3 rounded-lg shadow-2xs"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
            Self-Heal
            {underReplicatedFiles.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                {underReplicatedFiles.length}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={rebalance}
            disabled={isProcessing || onlineNodes.length < 2}
            className="border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs h-8 px-3 rounded-lg shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-blue-600 ${isProcessing ? 'animate-spin' : ''}`} />
            Rebalance
          </Button>
        </div>
      </div>

      {/* 2. Unified Continuous KPI Strip */}
      <div className="enterprise-card divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden">
        {/* KPI 1: Cluster Consensus */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="label-micro">Cluster Quorum</span>
            <div className="icon-squircle h-8 w-8">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="metric-value">{clusterHealthPercent}% Active</div>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              {onlineNodes.length} of {nodes.length} DataNodes Reachable
            </p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px]">Consensus Policy:</span>
            <span className="font-mono font-semibold text-slate-700 text-[11px]">{'> 50% Quorum'}</span>
          </div>
        </div>

        {/* KPI 2: Distributed Storage Pool */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="label-micro">Storage Pool</span>
            <div className="icon-squircle h-8 w-8">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="metric-value">{formatBytes(usedStorageBytes)}</div>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              of {formatBytes(totalStorageBytes)} Total Capacity ({Math.min(100, Math.round((usedStorageBytes / (totalStorageBytes || 1)) * 100))}%)
            </p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (usedStorageBytes / (totalStorageBytes || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Inode & Blocks */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="label-micro">Inodes & Blocks</span>
            <div className="icon-squircle h-8 w-8">
              <Files className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="metric-value">{files.length} Files</div>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Striped into <span className="font-mono font-semibold text-slate-700">{totalBlocks}</span> physical blocks
            </p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px]">Avg Redundancy:</span>
            <span className="font-mono font-bold text-blue-600 text-[11px]">{averageReplication}x Replicas</span>
          </div>
        </div>

        {/* KPI 4: Fault Tolerance State */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="label-micro">Fault Resilience</span>
            <div className="icon-squircle-emerald h-8 w-8">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {underReplicatedFiles.length === 0 ? 'Fully Replicated' : `${underReplicatedFiles.length} Under-Replicated`}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              {underReplicatedFiles.length === 0 ? 'All blocks satisfy target factor' : 'Replica deficit detected'}
            </p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px]">Failure Domains:</span>
            <span className="font-mono text-slate-700 font-semibold text-[11px]">Rack-Alpha & Beta</span>
          </div>
        </div>
      </div>

      {/* 3. DataNodes Storage Fleet (Full-width clean 4-card grid) */}
      <div className="enterprise-card overflow-hidden">
        <div className="enterprise-card-header flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Server className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">DataNode Storage Fleet</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {nodes.length} Nodes
            </span>
          </div>
          <Link to="/nodes" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 group">
            <span>Topology Map</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 4-column responsive grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {nodes.map((node) => {
            const isOnline = node.status === 'online';
            const usagePercent = Math.min(100, Math.round((node.storage_used / node.storage_total) * 100));

            return (
              <div
                key={node.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isOnline
                    ? 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-card shadow-xs'
                    : 'bg-rose-50/20 border-rose-200/80 opacity-90'
                }`}
              >
                <div>
                  {/* Top Node Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isOnline ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <HardDrive className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <h4 className="font-bold text-xs text-slate-900 leading-tight">{node.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          {node.ip}:{node.port} • <span className="font-medium text-slate-600">{node.rack}</span>
                        </span>
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

                  {/* Storage Progress */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-600 font-medium">{formatBytes(node.storage_used)} used</span>
                      <span className="text-slate-900 font-bold">{usagePercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercent > 80 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.max(2, usagePercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick 1-Click Failure Simulation Button */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-slate-500 font-mono">Capacity: {formatBytes(node.storage_total)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleNode(node.id)}
                    className={`text-[11px] h-7 px-2.5 rounded-lg font-semibold transition-colors ${
                      isOnline
                        ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <Power className="h-3 w-3 mr-1" />
                    {isOnline ? 'Simulate Crash' : 'Recover'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Distributed File Inodes Catalog (Full-width clean table) */}
      <div className="enterprise-card overflow-hidden">
        <div className="enterprise-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Files className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Distributed Inode Catalog</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {files.length} Files
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-40 sm:w-56">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search file inodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg shadow-2xs focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
            <Link to="/files" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 shrink-0 group">
              <span>All Files</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Inode Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 text-slate-900">File Inode Name</th>
                <th className="py-2.5 px-4 text-slate-900">Size</th>
                <th className="py-2.5 px-4 text-slate-900">Blocks</th>
                <th className="py-2.5 px-4 text-slate-900">DataNode Placement</th>
                <th className="py-2.5 px-4 text-right text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                    No files matching query. Use "Upload File" in the header to distribute data.
                  </td>
                </tr>
              ) : (
                filteredFiles.slice(0, 8).map((file) => {
                  const onlineReplicas = file.replicas.filter(r =>
                    nodeMap[r.node_id]?.status === 'online'
                  );
                  const isAvailable = onlineReplicas.length > 0;

                  return (
                    <tr key={file.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2.5 px-4 align-middle">
                        <span className="font-semibold text-xs text-slate-900 block truncate max-w-xs">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {file.type || 'binary/raw'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 align-middle font-mono text-slate-800 font-semibold">
                        {formatBytes(file.size)}
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                          <Layers className="h-3 w-3 text-blue-600" />
                          {file.chunks?.length || 1} blk
                        </span>
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        <div className="flex flex-wrap gap-1 items-center">
                          {file.replicas.map(rep => {
                            const node = nodeMap[rep.node_id];
                            const isOnline = node?.status === 'online';
                            return (
                              <span
                                key={rep.id}
                                title={`${node?.name}: ${isOnline ? 'Online' : 'Offline'}`}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border font-medium ${
                                  isOnline
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-rose-200 bg-rose-50 text-rose-800'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {node?.name.replace('DataNode-', 'DN-') || 'Node'}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Inspect Chunks and View"
                            onClick={() => handleOpenPreview(file)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={isAvailable ? "Download" : "Replica offline"}
                            onClick={() => downloadFile(file.id)}
                            disabled={!isAvailable}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete file"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-slate-200 text-slate-900 rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-900 font-bold">Delete File?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 text-xs">
                                  Purge "{file.name}" ({formatBytes(file.size)}) and free all its block replicas across nodes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white border-slate-200 text-slate-700 rounded-lg">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteFile(file.id)} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FilePreviewDialog
        file={previewFile}
        nodes={nodes}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDownload={downloadFile}
      />
    </div>
  );
}
