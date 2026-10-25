import React from 'react';
import { useDFS } from '@/hooks/useDFS';
import { FileTable } from '@/components/FileTable';
import { UploadFileDialog } from '@/components/UploadFileDialog';

export default function FilesPage() {
  const {
    nodes,
    files,
    uploadFile,
    deleteFile,
    downloadFile,
    averageReplication,
    formatBytes
  } = useDFS();

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalBlocks = files.reduce((acc, f) => acc + (f.chunks?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Distributed File Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse files striped across DataNodes, inspect block chunks, and download reconstructed data.
          </p>
        </div>

        <UploadFileDialog
          nodes={nodes}
          onUploadFile={uploadFile}
          className="enterprise-btn-primary font-medium text-xs h-9 px-4 rounded-lg border-0 self-start sm:self-auto"
        />
      </div>

      {/* Symmetrical Quick Summary Pill Bar */}
      <div className="enterprise-card divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 grid grid-cols-2 sm:grid-cols-4 overflow-hidden">
        <div className="p-5">
          <span className="label-micro block">Total Files</span>
          <span className="metric-value font-mono block mt-1.5">{files.length}</span>
        </div>
        <div className="p-5">
          <span className="label-micro block">Physical Blocks</span>
          <span className="metric-value font-mono text-blue-600 block mt-1.5">{totalBlocks}</span>
        </div>
        <div className="p-5">
          <span className="label-micro block">Aggregate Payload</span>
          <span className="metric-value font-mono block mt-1.5">{formatBytes(totalBytes)}</span>
        </div>
        <div className="p-5">
          <span className="label-micro block">Avg Redundancy</span>
          <span className="metric-value font-mono text-blue-600 block mt-1.5">{averageReplication}x</span>
        </div>
      </div>

      {/* Main File Table Card */}
      <div className="enterprise-card p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3.5">
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">File Inodes & Placement</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click the Eye icon to view block checksums and preview content, or Download to reconstruct from online nodes.
          </p>
        </div>

        <FileTable
          files={files}
          nodes={nodes}
          onDeleteFile={deleteFile}
          onDownloadFile={downloadFile}
        />
      </div>
    </div>
  );
}
