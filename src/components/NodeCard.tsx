import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { HardDrive, Power, Trash2, Layers, ShieldAlert } from "lucide-react";
import { DFSNode, DFSFile, formatBytes } from "@/services/dfsEngine";

interface NodeCardProps {
  node: DFSNode;
  nodes: DFSNode[];
  files: DFSFile[];
  onToggleStatus: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

export function NodeCard({
  node,
  nodes,
  files,
  onToggleStatus,
  onDeleteNode
}: NodeCardProps) {
  const isOnline = node.status === 'online';

  const filesOnNode = files.filter(file =>
    file.replicas.some(rep => rep.node_id === node.id)
  );

  const usagePercent = Math.min(100, Math.round((node.storage_used / node.storage_total) * 100));

  const potentiallyInaccessibleFiles = filesOnNode.filter(file => {
    const hasOtherOnlineReplica = file.replicas.some(r => {
      if (r.node_id === node.id) return false;
      const otherNode = nodes.find(n => n.id === r.node_id);
      return otherNode?.status === 'online';
    });
    return !hasOtherOnlineReplica;
  });

  return (
    <div className={`enterprise-card p-5 flex flex-col justify-between h-full transition-all ${
      isOnline
        ? 'hover:border-blue-400 hover:shadow-card'
        : 'bg-rose-50/20 border-rose-200/80 opacity-90'
    }`}>
      {/* Node Top Section */}
      <div className="space-y-4">
        {/* Header: Icon, Name & Status */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border ${
              isOnline
                ? 'border-blue-100 bg-blue-50 text-blue-600 shadow-2xs'
                : 'border-rose-200 bg-rose-50 text-rose-600'
            }`}>
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                {node.name}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {node.ip}:{node.port} • {node.rack}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] font-mono px-2 py-0.2 ${
              isOnline
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Storage Capacity Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-500 font-sans">Capacity:</span>
            <span className="text-slate-800 font-medium">
              {formatBytes(node.storage_used)} / {formatBytes(node.storage_total)} ({usagePercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                usagePercent > 80 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.max(2, usagePercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Free: {formatBytes(Math.max(0, node.storage_total - node.storage_used))}</span>
            <span>Total: {formatBytes(node.storage_total)}</span>
          </div>
        </div>

        {/* Replicas Hosted Clean Summary */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
          <span className="text-slate-600 font-medium flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            Replicas Assigned
          </span>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {filesOnNode.length} {filesOnNode.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* Warning if taking offline causes data loss */}
        {isOnline && potentiallyInaccessibleFiles.length > 0 && (
          <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="text-[11px] leading-tight">
              Contains only live replica of <b>{potentiallyInaccessibleFiles.length} file(s)</b>.
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons with Standardized Heights */}
      <div className="grid grid-cols-3 gap-2 pt-3.5 mt-auto border-t border-slate-100">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggleStatus(node.id)}
          className={`col-span-2 text-xs font-semibold h-8 rounded-lg border transition-all ${
            isOnline
              ? 'border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:border-rose-300'
              : 'border-blue-200 bg-white hover:bg-blue-50 text-blue-600 hover:border-blue-300'
          }`}
        >
          <Power className="h-3.5 w-3.5 mr-1.5" />
          {isOnline ? 'Simulate Crash' : 'Reactivate'}
        </Button>

        {/* Delete Node Modal */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-8"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white border-slate-200 text-slate-900 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900">Decommission DataNode?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 text-xs">
                This will remove "{node.name}" from the active cluster pool. Use "Self-Heal" afterward to re-replicate missing blocks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white border-slate-200 text-slate-700 rounded-lg">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDeleteNode(node.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg"
              >
                Confirm Decommission
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
