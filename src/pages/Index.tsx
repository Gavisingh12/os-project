import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HardDrive,
  Files,
  Server,
  ShieldCheck,
  RefreshCw,
  Plus,
  Layers,
  Activity,
  FileCheck2,
  Cpu,
  Network
} from "lucide-react";

import { useDFS } from '@/hooks/useDFS';
import Navbar from '@/components/Navbar';
import { TopologyMap } from '@/components/TopologyMap';
import { StorageChart } from '@/components/StorageChart';
import { FileTable } from '@/components/FileTable';
import { NodeCard } from '@/components/NodeCard';
import { CreateNodeDialog } from '@/components/CreateNodeDialog';
import { UploadFileDialog } from '@/components/UploadFileDialog';

export default function Index() {
  const {
    nodes,
    files,
    onlineNodes,
    offlineNodes,
    totalStorageBytes,
    usedStorageBytes,
    clusterHealthPercent,
    averageReplication,
    isProcessing,
    toggleNode,
    addNode,
    deleteNode,
    uploadFile,
    deleteFile,
    rebalance,
    selfHeal,
    downloadFile,
    resetCluster,
    formatBytes
  } = useDFS();

  const [activeTab, setActiveTab] = useState('topology');

  const totalChunksCount = files.reduce((acc, f) => acc + (f.chunks?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onlineCount={onlineNodes.length}
        totalCount={nodes.length}
        healthPercent={clusterHealthPercent}
        onRebalance={rebalance}
        onSelfHeal={selfHeal}
        onReset={resetCluster}
        isProcessing={isProcessing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero Banner with Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Files & Blocks */}
          <Card className="glass-card border-slate-800 text-slate-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Distributed Files</span>
              <div className="h-8 w-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Files className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{files.length}</span>
              <span className="text-xs text-slate-400 font-mono">({totalChunksCount} Blocks)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Avg Replication: <span className="text-cyan-400 font-mono">{averageReplication}x</span>
            </p>
          </Card>

          {/* Card 2: Cluster Nodes */}
          <Card className="glass-card border-slate-800 text-slate-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Storage DataNodes</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Server className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{onlineNodes.length}</span>
              <span className="text-xs text-slate-400 font-mono">/ {nodes.length} Online</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Quorum: <span className="text-emerald-400 font-mono">{onlineNodes.length >= Math.ceil(nodes.length / 2) ? 'Maintained' : 'Degraded'}</span>
            </p>
          </Card>

          {/* Card 3: Storage Pool */}
          <Card className="glass-card border-slate-800 text-slate-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Storage Pool</span>
              <div className="h-8 w-8 rounded-lg bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <HardDrive className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{formatBytes(usedStorageBytes)}</span>
              <span className="text-xs text-slate-400 font-mono">/ {formatBytes(totalStorageBytes)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (usedStorageBytes / (totalStorageBytes || 1)) * 100)}%` }}
              />
            </div>
          </Card>

          {/* Card 4: Fault Tolerance State */}
          <Card className="glass-card border-slate-800 text-slate-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Fault Tolerance</span>
              <div className="h-8 w-8 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{clusterHealthPercent}%</span>
              <span className="text-xs text-slate-400 font-mono">Health</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Max Tolerable Failures: <span className="text-purple-400 font-mono">1 Node</span>
            </p>
          </Card>
        </div>

        {/* Action Bar (Upload & Add Node Buttons) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-950/20 text-xs font-mono">
              Cluster Mode: Active
            </Badge>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Select an action to test distributed storage, failure simulation, or self-healing.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <UploadFileDialog
              nodes={nodes}
              onUploadFile={uploadFile}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            />
            <CreateNodeDialog
              onCreateNode={addNode}
              variant="outline"
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            />
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger value="topology" className="text-xs font-medium data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Network className="h-3.5 w-3.5 mr-1.5" />
              Cluster Topology & Health
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs font-medium data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Files className="h-3.5 w-3.5 mr-1.5" />
              Distributed Files ({files.length})
            </TabsTrigger>
            <TabsTrigger value="nodes" className="text-xs font-medium data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Server className="h-3.5 w-3.5 mr-1.5" />
              DataNodes Management ({nodes.length})
            </TabsTrigger>
            <TabsTrigger value="concepts" className="text-xs font-medium data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Cpu className="h-3.5 w-3.5 mr-1.5" />
              OS Concepts Guide
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Topology & Storage Metrics */}
          <TabsContent value="topology" className="space-y-6 mt-0">
            <TopologyMap nodes={nodes} onToggleNode={toggleNode} />
            <StorageChart nodes={nodes} />
          </TabsContent>

          {/* TAB 2: Distributed Files Management */}
          <TabsContent value="files" className="space-y-4 mt-0">
            <Card className="glass-card border-slate-800 text-slate-100">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-100">
                      Distributed Files Repository
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Inspect block chunks, check replica placements, view real file contents, or download reconstructed data.
                    </CardDescription>
                  </div>
                  <UploadFileDialog
                    nodes={nodes}
                    onUploadFile={uploadFile}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white self-start sm:self-auto"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <FileTable
                  files={files}
                  nodes={nodes}
                  onDeleteFile={deleteFile}
                  onDownloadFile={downloadFile}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: DataNodes Management */}
          <TabsContent value="nodes" className="space-y-4 mt-0">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-100">Storage DataNodes Pool</h3>
                <p className="text-xs text-slate-400">
                  Manage individual physical/virtual nodes, simulate hardware crashes, and inspect local chunk allocations.
                </p>
              </div>
              <CreateNodeDialog
                onCreateNode={addNode}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nodes.map(node => (
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
          </TabsContent>

          {/* TAB 4: OS Concepts Guide for Viva & Project Presentation */}
          <TabsContent value="concepts" className="space-y-6 mt-0">
            <Card className="glass-card border-slate-800 text-slate-100">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Operating System Core Principles Implemented
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  How this project satisfies the requirements of a Distributed Operating System File System (DFS / HDFS / GFS)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                    <h4 className="font-bold text-sm text-cyan-300">1. Block-Level Chunking</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Files are not saved as monolithic blobs. Instead, the Master splits files into uniform fixed-size blocks (128KB - 1MB), calculating a checksum for each block to ensure data integrity during transmission and storage.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                    <h4 className="font-bold text-sm text-emerald-300">2. N-Way Replication Factor</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Every block is replicated across multiple independent DataNodes (default 2x or 3x). If any single storage node suffers hardware failure, files remain instantly reconstructible from surviving replicas.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                    <h4 className="font-bold text-sm text-purple-300">3. Fault Detection & Quorum</h4>
                    <p className="text-slate-400 leading-relaxed">
                      The NameNode tracks node heartbeat signals. When a node stops responding, it is marked offline. If all replicas of a file become offline, access is temporarily locked to prevent serving corrupted data.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                    <h4 className="font-bold text-sm text-amber-300">4. Self-Healing & Cluster Rebalancing</h4>
                    <p className="text-slate-400 leading-relaxed">
                      The Self-Heal engine detects under-replicated blocks and automatically replicates them onto healthy nodes. The Rebalance algorithm minimizes storage variance across nodes to prevent hotspot saturation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
