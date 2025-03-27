 
import { Button } from "@/components/ui/button";
import { FileX, Download, Eye } from "lucide-react";
import { type File, type Node } from "@/types/supabase";
import { toast } from "@/hooks/use-toast";

interface FileTableProps {
  files: File[];
  nodes: Node[];
  onDeleteFile: (fileId: string) => void;
  onViewFile?: (fileId: string, fileName: string) => void;
  onDownloadFile?: (fileId: string, fileName: string) => void;
}

export function FileTable({ 
  files, 
  nodes, 
  onDeleteFile, 
  onViewFile, 
  onDownloadFile 
}: FileTableProps) {
  // Map node IDs to node objects for easier lookup
  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, Node>);
  
  const handleViewFile = (fileId: string, fileName: string) => {
    // Check if at least one replica is on an online node
    const file = files.find(f => f.id === fileId);
    const hasAccessibleReplica = file?.replicas?.some(replica => {
      const node = nodeMap[replica.node_id];
      return node?.status === 'online';
    });
    
    if (!hasAccessibleReplica) {
      toast({
        title: "File unavailable",
        description: "This file cannot be accessed because all nodes containing it are offline.",
        variant: "destructive"
      });
      return;
    }
    
    if (onViewFile) {
      onViewFile(fileId, fileName);
    }
  };
  
  const handleDownloadFile = (fileId: string, fileName: string) => {
    // Check if at least one replica is on an online node
    const file = files.find(f => f.id === fileId);
    const hasAccessibleReplica = file?.replicas?.some(replica => {
      const node = nodeMap[replica.node_id];
      return node?.status === 'online';
    });
    
    if (!hasAccessibleReplica) {
      toast({
        title: "File unavailable",
        description: "This file cannot be downloaded because all nodes containing it are offline.",
        variant: "destructive"
      });
      return;
    }
    
    if (onDownloadFile) {
      onDownloadFile(fileId, fileName);
    }
  };
  
  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3">Name</th>
            <th className="text-left py-3">Size</th>
            <th className="text-left py-3">Replicas</th>
            <th className="text-left py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-500">
                No files uploaded yet
              </td>
            </tr>
          ) : (
            files.map((file) => (
              <tr key={file.id} className="border-b">
                <td className="py-3">{file.name}</td>
                <td className="py-3">{file.size} MB</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {file.replicas?.map(replica => {
                      const node = nodeMap[replica.node_id];
                      return (
                        <span 
                          key={replica.id} 
                          className={`px-2 py-1 text-xs rounded-full ${
                            node?.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {node?.name || `Node ${replica.node_id.substring(0, 4)}`}
                        </span>
                      );
                    })}
                    {(!file.replicas || file.replicas.length === 0) && (
                      <span className="text-xs text-gray-500">No replicas</span>
                    )}
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {onViewFile && (
                      <Button variant="ghost" size="sm" onClick={() => handleViewFile(file.id, file.name)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onDownloadFile && (
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(file.id, file.name)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onDeleteFile(file.id)}>
                      <FileX className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
