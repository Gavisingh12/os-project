 
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FilePlus, Upload, FileSymlink } from "lucide-react";
import { Node, FileInsert, ReplicaInsert } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';

interface UploadFileDialogProps {
  nodes: Node[];
  onCreateFile: (file: FileInsert) => Promise<any>;
  onCreateReplica: (replica: ReplicaInsert) => Promise<any>;
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  className?: string;
}

export function UploadFileDialog({ 
  nodes, 
  onCreateFile, 
  onCreateReplica,
  children,
  variant = "default",
  className
}: UploadFileDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const onlineNodes = nodes.filter(node => node.status === 'online');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: "File required",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedNodes.length === 0) {
      toast({
        title: "No nodes selected",
        description: "Please select at least one node for storage",
        variant: "destructive"
      });
      return;
    }
    
    const result = await uploadFile(selectedFile, selectedNodes);
    
    if (result !== null) {
      setSelectedFile(null);
      setSelectedNodes([]);
      setOpen(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          {children || (
            <>
              <FilePlus className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <input
              type="file"
              id="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                onClick={handleUploadClick}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
            </div>
            {selectedFile && (
              <div className="flex items-center p-2 mt-2 bg-muted rounded-md">
                <FileSymlink className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm truncate">{selectedFile.name}</span>
                <span className="text-xs ml-auto text-muted-foreground">
                  {Math.round(selectedFile.size / 1024)} KB
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Select Nodes for Storage</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {onlineNodes.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-2">No online nodes available</p>
              ) : (
                onlineNodes.map((node) => {
                  const fileSizeMB = selectedFile ? Math.ceil(selectedFile.size / (1024 * 1024)) : 0;
                  const availableStorage = node.storage_total - node.storage_used;
                  const hasEnoughSpace = availableStorage >= fileSizeMB;
                  
                  return (
                    <div key={node.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`node-${node.id}`}
                        checked={selectedNodes.includes(node.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNodes([...selectedNodes, node.id]);
                          } else {
                            setSelectedNodes(selectedNodes.filter(id => id !== node.id));
                          }
                        }}
                        className="rounded"
                        disabled={!hasEnoughSpace && fileSizeMB > 0}
                      />
                      <label 
                        htmlFor={`node-${node.id}`} 
                        className={`text-sm ${!hasEnoughSpace && fileSizeMB > 0 ? 'text-gray-400' : ''}`}
                      >
                        {node.name} ({node.storage_used}/{node.storage_total} GB)
                        {!hasEnoughSpace && fileSizeMB > 0 && <span className="ml-1 text-red-500">(Not enough space)</span>}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
            {selectedNodes.length > 0 && (
              <p className="text-xs text-gray-500">
                Replication Factor: {selectedNodes.length}x
              </p>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={isUploading || onlineNodes.length === 0 || selectedNodes.length === 0 || !selectedFile}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
