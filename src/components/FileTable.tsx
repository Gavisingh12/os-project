import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Layers
} from "lucide-react";
import { DFSFile, DFSNode, formatBytes } from "@/services/dfsEngine";
import { FilePreviewDialog } from "./FilePreviewDialog";

interface FileTableProps {
  files: DFSFile[];
  nodes: DFSNode[];
  onDeleteFile: (fileId: string) => void;
  onDownloadFile: (fileId: string) => void;
}

export function FileTable({
  files,
  nodes,
  onDeleteFile,
  onDownloadFile
}: FileTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'offline'>('all');
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<DFSFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, DFSNode>);

  const getFileIcon = (file: DFSFile) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-600" />;
    if (file.type.includes('json') || file.type.includes('javascript') || file.type.includes('python')) {
      return <FileCode className="h-4 w-4 text-blue-600" />;
    }
    if (file.type.includes('zip') || file.type.includes('tar') || file.type.includes('octet-stream')) {
      return <FileArchive className="h-4 w-4 text-slate-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.replicas.some(r => nodeMap[r.node_id]?.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const onlineReplicas = file.replicas.filter(r => nodeMap[r.node_id]?.status === 'online');
    const isAvailable = onlineReplicas.length > 0;

    if (!matchesSearch) return false;
    if (statusFilter === 'available') return isAvailable;
    if (statusFilter === 'offline') return !isAvailable;
    return true;
  });

  const handleOpenPreview = (file: DFSFile) => {
    setSelectedFileForPreview(file);
    setPreviewOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFiles.map(f => f.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    selectedIds.forEach(id => onDeleteFile(id));
    setSelectedIds([]);
  };

  const handleBatchDownload = () => {
    selectedIds.forEach(id => onDownloadFile(id));
  };

  return (
    <div className="space-y-4">
      {/* Batch Action Strip (Shown when files are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-900">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span>{selectedIds.length} of {filteredFiles.length} file(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDownload}
              className="text-xs h-7 px-2.5 rounded-md border-blue-200 bg-white hover:bg-blue-50 text-blue-700"
            >
              <Download className="h-3 w-3 mr-1" />
              Download Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDelete}
              className="text-xs h-7 px-2.5 rounded-md border-rose-200 bg-white hover:bg-rose-50 text-rose-700"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="text-xs h-7 px-2 text-slate-500 hover:text-slate-800"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search files or DataNodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 h-9 rounded-lg focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3 text-blue-600" /> Filter:
          </span>
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className={`text-xs h-8 px-3 rounded-md font-medium ${
              statusFilter === 'all'
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-0'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            All ({files.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'available' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('available')}
            className={`text-xs h-8 px-3 rounded-md font-medium ${
              statusFilter === 'available'
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-0'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            Available
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'offline' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('offline')}
            className={`text-xs h-8 px-3 rounded-md font-medium ${
              statusFilter === 'offline'
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-0'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            Offline
          </Button>
        </div>
      </div>

      {/* Clean Table Container */}
      <div className="enterprise-card overflow-hidden border border-slate-200/90 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredFiles.length && filteredFiles.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2.5 px-3 text-slate-900">File Inode & Type</th>
                <th className="py-2.5 px-3 text-slate-900">Payload Size</th>
                <th className="py-2.5 px-3 text-slate-900">Chunk Blocks</th>
                <th className="py-2.5 px-3 text-slate-900">DataNode Placement</th>
                <th className="py-2.5 px-3 text-slate-900">Allocated</th>
                <th className="py-2.5 px-3 text-right text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 font-medium">
                    No files found matching current search/filter.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const onlineReplicas = file.replicas.filter(r => nodeMap[r.node_id]?.status === 'online');
                  const isAvailable = onlineReplicas.length > 0;
                  const isSelected = selectedIds.includes(file.id);

                  return (
                    <tr
                      key={file.id}
                      className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}
                    >
                      <td className="py-3 px-3 align-middle text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(file.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      {/* Name & Type */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shadow-2xs">
                            {getFileIcon(file)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block text-xs truncate max-w-xs sm:max-w-md">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {file.type || 'raw'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 align-middle font-mono font-medium text-slate-800">
                        {formatBytes(file.size)}
                      </td>

                      {/* Blocks / Chunks */}
                      <td className="py-3 px-4 align-middle">
                        <Badge variant="outline" className="text-[11px] font-mono border-slate-200 text-slate-700 bg-slate-50 font-normal">
                          <Layers className="h-3 w-3 mr-1 text-blue-600" />
                          {file.chunks?.length || 1} Blocks
                        </Badge>
                      </td>

                      {/* Replica Nodes */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {file.replicas.map(replica => {
                            const node = nodeMap[replica.node_id];
                            const isOnline = node?.status === 'online';

                            return (
                              <span
                                key={replica.id}
                                title={`${node?.name || 'Node'}: ${isOnline ? 'Online' : 'Offline'}`}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                                  isOnline
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-rose-200 bg-rose-50 text-rose-800'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {node?.name.replace('DataNode-', 'DN-') || replica.node_id.substring(0, 6)}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Upload Date */}
                      <td className="py-3 px-4 align-middle text-[11px] text-slate-500 font-mono">
                        {new Date(file.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Dialog Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Inspect Chunks and View Content"
                            onClick={() => handleOpenPreview(file)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Download Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title={isAvailable ? "Reconstruct and Download File" : "Cannot Download: All Replica Nodes Offline"}
                            onClick={() => onDownloadFile(file.id)}
                            className={`h-8 w-8 p-0 rounded-md ${
                              isAvailable
                                ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          {/* Delete with Confirmation Dialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete file and free storage"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-slate-200 text-slate-900 rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-900">Delete File?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 text-xs">
                                  Permanently purge "{file.name}" ({formatBytes(file.size)}) and delete its replicas across all DataNodes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeleteFile(file.id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg"
                                >
                                  Delete Permanently
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
        file={selectedFileForPreview}
        nodes={nodes}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDownload={onDownloadFile}
      />
    </div>
  );
}
