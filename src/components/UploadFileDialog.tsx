import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Layers, AlertCircle } from "lucide-react";
import { DFSNode, formatBytes } from "@/services/dfsEngine";
import { cn } from "@/lib/utils";

interface UploadFileDialogProps {
  nodes: DFSNode[];
  onUploadFile: (file: File, selectedNodeIds: string[], chunkSizeKB: number) => Promise<unknown>;
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function UploadFileDialog({
  nodes,
  onUploadFile,
  children,
  variant = "default",
  className
}: UploadFileDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [chunkSizeKB, setChunkSizeKB] = useState<number>(512);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onlineNodes = nodes.filter(n => n.status === 'online');

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      if (selectedNodes.length === 0 && onlineNodes.length > 0) {
        setSelectedNodes(onlineNodes.slice(0, Math.min(3, onlineNodes.length)).map(n => n.id));
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const calculatedChunksCount = selectedFile
    ? Math.max(1, Math.ceil(selectedFile.size / (chunkSizeKB * 1024)))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || selectedNodes.length === 0) return;

    setIsUploading(true);
    try {
      await onUploadFile(selectedFile, selectedNodes, chunkSizeKB);
      setSelectedFile(null);
      setOpen(false);
    } catch {
      // handled in useDFS
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={cn(
            "bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-3.5 rounded-lg shadow-xs border-0 transition-colors",
            className
          )}
        >
          {children || (
            <>
              <Upload className="h-4 w-4 mr-1.5" />
              Upload File
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-white border border-slate-200 text-slate-900 rounded-xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Upload & Distribute File
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Segment file into blocks and replicate across selected cluster DataNodes
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* File Picker / Dropzone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-900">Select Source File</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer bg-slate-50/70 hover:bg-blue-50/20 transition-all"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {formatBytes(selectedFile.size)} • {selectedFile.type || 'Raw File'}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px] font-mono border-emerald-200 text-emerald-700 bg-emerald-50">
                    Selected
                  </Badge>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Upload className="h-6 w-6 mx-auto text-slate-400" />
                  <p className="text-xs text-slate-800 font-medium">
                    Click to browse or drop your file here
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Supports documents, images, logs, binaries, and text
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Block Chunking Configuration */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <Label htmlFor="chunk-size" className="text-xs font-semibold text-slate-900 block mb-1">
                OS Block Size
              </Label>
              <select
                id="chunk-size"
                value={chunkSizeKB}
                onChange={(e) => setChunkSizeKB(Number(e.target.value))}
                className="w-full h-8 rounded-md bg-white border border-slate-200 text-xs text-slate-900 px-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={128}>128 KB (Fine grain)</option>
                <option value={256}>256 KB</option>
                <option value={512}>512 KB (Standard)</option>
                <option value={1024}>1 MB (Throughput)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-900 block mb-1">
                Generated Blocks
              </Label>
              <div className="h-8 flex items-center px-2.5 rounded-md bg-white border border-slate-200 font-mono text-xs text-blue-600 font-semibold">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                {calculatedChunksCount} Block{calculatedChunksCount === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          {/* Target Replica Nodes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-900">
                Target DataNodes ({selectedNodes.length}x Replication)
              </Label>
              <span className="text-[10px] text-slate-500 font-mono font-medium">
                {selectedNodes.length >= 2 ? (
                  <span className="text-emerald-600 font-semibold">Fault Tolerant (≥2)</span>
                ) : (
                  <span className="text-amber-600 font-semibold">Single Point of Failure</span>
                )}
              </span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {onlineNodes.length === 0 ? (
                <div className="p-3 text-center text-xs text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                  <AlertCircle className="h-4 w-4 mx-auto mb-1 text-rose-600" />
                  No online nodes available. Bring at least one node online to upload.
                </div>
              ) : (
                onlineNodes.map(node => {
                  const isChecked = selectedNodes.includes(node.id);
                  const freeBytes = Math.max(0, node.storage_total - node.storage_used);
                  const hasSpace = !selectedFile || freeBytes >= selectedFile.size;

                  return (
                    <label
                      key={node.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/50 text-slate-900 font-medium'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNodes([...selectedNodes, node.id]);
                            } else {
                              setSelectedNodes(selectedNodes.filter(id => id !== node.id));
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block text-xs">{node.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {node.ip} • {node.rack}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono">
                        <span className={hasSpace ? 'text-slate-500' : 'text-rose-600 font-semibold'}>
                          {formatBytes(freeBytes)} Free
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={!selectedFile || selectedNodes.length === 0 || isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 rounded-lg border-0 shadow-xs transition-colors"
            >
              {isUploading ? "Chunking & Distributing Blocks..." : "Execute Distributed Write Pipeline"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
