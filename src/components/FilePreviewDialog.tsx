import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DFSFile, DFSNode, formatBytes } from '@/services/dfsEngine';
import { Download, FileText, HardDrive, Layers, Clock, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

interface FilePreviewDialogProps {
  file: DFSFile | null;
  nodes: DFSNode[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (fileId: string) => void;
}

export function FilePreviewDialog({
  file,
  nodes,
  open,
  onOpenChange,
  onDownload
}: FilePreviewDialogProps) {
  if (!file) return null;

  const nodeMap = nodes.reduce((acc, n) => {
    acc[n.id] = n;
    return acc;
  }, {} as Record<string, DFSNode>);

  const onlineReplicas = file.replicas.filter(r => nodeMap[r.node_id]?.status === 'online');
  const isAccessible = onlineReplicas.length > 0;

  let textPreview = '';
  const isImage = file.type.startsWith('image/');
  const isText = file.type.startsWith('text/') || file.type.includes('json') || file.type.includes('log') || file.name.endsWith('.txt') || file.name.endsWith('.log') || file.name.endsWith('.json');

  if (file.dataUrl && isText) {
    try {
      if (file.dataUrl.includes('charset=utf-8,')) {
        textPreview = decodeURIComponent(file.dataUrl.split('charset=utf-8,')[1] || '');
      } else if (file.dataUrl.includes('base64,')) {
        textPreview = atob(file.dataUrl.split('base64,')[1] || '');
      }
    } catch {
      textPreview = 'Unable to decode raw text stream.';
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 text-slate-900 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{file.name}</span>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-medium font-mono ${
                    isAccessible
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                      : 'border-rose-200 text-rose-700 bg-rose-50'
                  }`}
                >
                  {isAccessible ? 'Replicas Online' : 'All Replicas Offline'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Distributed Block Inspection & Replica Map
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* File Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">File Size</span>
            <span className="font-mono font-bold text-blue-600">{formatBytes(file.size)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Logical Blocks</span>
            <span className="font-mono font-bold text-slate-800">{file.chunks.length} Block{file.chunks.length === 1 ? '' : 's'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Target Replication</span>
            <span className="font-mono font-bold text-slate-800">{file.targetReplicationFactor || file.replicas.length}x</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Available Copies</span>
            <span className={`font-mono font-bold ${onlineReplicas.length > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {onlineReplicas.length} / {file.replicas.length} Live
            </span>
          </div>
        </div>

        {/* Replica Nodes Distribution */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-blue-600" />
            Physical Replica Placement
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {file.replicas.map((rep) => {
              const node = nodeMap[rep.node_id];
              const isOnline = node?.status === 'online';

              return (
                <div
                  key={rep.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                    isOnline
                      ? 'border-slate-200 bg-white text-slate-800'
                      : 'border-rose-200 bg-rose-50/50 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">{node?.name || rep.node_id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {node?.ip || 'IP Unknown'} • {node?.rack || 'Default'}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-mono font-semibold ${
                      isOnline
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : 'border-rose-200 text-rose-700 bg-rose-50'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <Tabs defaultValue="chunks" className="w-full">
          <TabsList className="bg-slate-100 border border-slate-200 p-0.5 rounded-lg text-xs">
            <TabsTrigger
              value="chunks"
              className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs text-slate-600 font-medium"
            >
              <Layers className="h-3.5 w-3.5 mr-1 text-current" />
              OS Block Map ({file.chunks.length})
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs text-slate-600 font-medium"
            >
              <Eye className="h-3.5 w-3.5 mr-1 text-current" />
              Payload Preview
            </TabsTrigger>
          </TabsList>

          {/* Block Chunk Details Tab */}
          <TabsContent value="chunks" className="mt-3 space-y-2">
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold font-mono text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Block Index</th>
                    <th className="py-2.5 px-3">Block Size</th>
                    <th className="py-2.5 px-3">Stored On Node</th>
                    <th className="py-2.5 px-3">Integrity Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono bg-white">
                  {file.chunks.map((chk) => {
                    const node = nodeMap[chk.nodeId];
                    return (
                      <tr key={chk.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-blue-600 font-semibold">Block {chk.chunkIndex}</td>
                        <td className="py-2 px-3 text-slate-700">{formatBytes(chk.chunkSize)}</td>
                        <td className="py-2 px-3 text-slate-600">{node?.name || chk.nodeId}</td>
                        <td className="py-2 px-3 text-slate-400 text-[10px]">{chk.checksum}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Content Preview Tab */}
          <TabsContent value="preview" className="mt-3">
            {isImage && file.dataUrl ? (
              <div className="flex justify-center p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-60 overflow-hidden">
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  className="max-h-52 object-contain rounded border border-slate-200"
                />
              </div>
            ) : isText && textPreview ? (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 max-h-52 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {textPreview}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                Binary or non-text file format. Click Download to retrieve reconstructed file from cluster blocks.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-2">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Uploaded: {new Date(file.created_at).toLocaleString()}
          </div>
          <Button
            size="sm"
            onClick={() => onDownload(file.id)}
            disabled={!isAccessible}
            className={`text-xs font-medium h-9 px-4 rounded-lg shadow-xs transition-colors ${
              isAccessible
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-0'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {isAccessible ? 'Reconstruct & Download' : 'Replicas Offline'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
