import { useState, useEffect, useCallback } from 'react';
import { dfsEngine, DFSNode, DFSFile, formatBytes } from '@/services/dfsEngine';
import { toast } from '@/hooks/use-toast';

export function useDFS() {
  const [nodes, setNodes] = useState<DFSNode[]>(() => dfsEngine.getNodes());
  const [files, setFiles] = useState<DFSFile[]>(() => dfsEngine.getFiles());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Subscribe to engine state changes
    const unsubscribe = dfsEngine.subscribe(() => {
      setNodes(dfsEngine.getNodes());
      setFiles(dfsEngine.getFiles());
    });
    return unsubscribe;
  }, []);

  const onlineNodes = nodes.filter(n => n.status === 'online');
  const offlineNodes = nodes.filter(n => n.status === 'offline');
  const totalStorageBytes = nodes.reduce((acc, n) => acc + n.storage_total, 0);
  const usedStorageBytes = nodes.reduce((acc, n) => acc + n.storage_used, 0);
  const clusterHealthPercent = nodes.length > 0
    ? Math.round((onlineNodes.length / nodes.length) * 100)
    : 0;

  const averageReplication = files.length > 0
    ? (files.reduce((acc, f) => acc + f.replicas.length, 0) / files.length).toFixed(1)
    : '0';

  const toggleNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const willBeOffline = node.status === 'online';
    if (willBeOffline) {
      // Check if files will lose all online replicas
      const impactedFiles = files.filter(f => {
        const hasOtherOnlineReplica = f.replicas.some(r => {
          if (r.node_id === nodeId) return false;
          const otherNode = nodes.find(n => n.id === r.node_id);
          return otherNode?.status === 'online';
        });
        return !hasOtherOnlineReplica;
      });

      if (impactedFiles.length > 0) {
        toast({
          title: "⚠️ Quorum Warning: Data Inaccessible",
          description: `Taking "${node.name}" offline will make ${impactedFiles.length} file(s) temporarily unavailable until a replica node is brought back online.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Node Offline (Simulated Failure)",
          description: `"${node.name}" is now offline. System redirected traffic to healthy replicas.`
        });
      }
    } else {
      toast({
        title: "Node Reconnected",
        description: `"${node.name}" is now online and actively serving read/write chunks.`
      });
    }

    dfsEngine.toggleNodeStatus(nodeId);
  }, [nodes, files]);

  const addNode = useCallback((name: string, capacityGB: number, rack?: string) => {
    const node = dfsEngine.addNode(name, capacityGB, rack);
    toast({
      title: "DataNode Registered",
      description: `Added "${node.name}" (${capacityGB} GB) to cluster cluster rack.`
    });
    return node;
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const { affectedFilesCount } = dfsEngine.deleteNode(nodeId);
    toast({
      title: "Node Removed",
      description: `Removed node "${node?.name || nodeId}". ${affectedFilesCount > 0 ? `${affectedFilesCount} files lost their replica on this node.` : ''}`
    });
  }, [nodes]);

  const uploadFile = useCallback(async (file: File, selectedNodeIds: string[], chunkSizeKB = 512) => {
    setIsProcessing(true);
    try {
      const createdFile = await dfsEngine.uploadFile(file, selectedNodeIds, chunkSizeKB);
      toast({
        title: "File Distributed Successfully",
        description: `"${file.name}" split into ${createdFile.chunks.length} blocks & replicated across ${selectedNodeIds.length} nodes.`
      });
      return createdFile;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast({
        title: "Upload Failed",
        description: msg,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    const success = dfsEngine.deleteFile(fileId);
    if (success) {
      toast({
        title: "File Deleted",
        description: `"${file?.name || 'File'}" and all its block replicas were purged, freeing node storage.`
      });
    }
  }, [files]);

  const rebalance = useCallback(() => {
    setIsProcessing(true);
    try {
      const result = dfsEngine.rebalanceCluster();
      toast({
        title: "Cluster Rebalanced",
        description: `Optimized storage distribution! Moved ${result.movedReplicas} replicas across nodes (variance reduced from ${result.beforeStdDev} to ${result.afterStdDev}).`
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rebalance failed';
      toast({
        title: "Rebalance Failed",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const selfHeal = useCallback(() => {
    setIsProcessing(true);
    try {
      const result = dfsEngine.selfHealCluster();
      if (result.newReplicasCreated > 0) {
        toast({
          title: "Self-Healing Completed",
          description: `Auto-healed ${result.healedFilesCount} under-replicated files by creating ${result.newReplicasCreated} new replicas on active nodes!`
        });
      } else {
        toast({
          title: "Cluster Fully Redundant",
          description: "All files currently satisfy their target replication factor. No recovery action needed."
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Self-heal failed';
      toast({
        title: "Self-Heal Failed",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const downloadFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    const { available, onlineNodes: liveNodes } = dfsEngine.isFileAvailable(fileId);
    if (!available) {
      toast({
        title: "❌ Read Operation Failed",
        description: `Cannot reconstruct "${file.name}": All nodes holding replicas are currently OFFLINE. Bring at least one node online.`,
        variant: "destructive"
      });
      return;
    }

    if (!file.dataUrl) {
      toast({
        title: "File content unavailable",
        description: "No binary data available for download.",
        variant: "destructive"
      });
      return;
    }

    // Trigger real download
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "File Downloaded",
      description: `Reconstructed "${file.name}" from live replica node "${liveNodes[0]?.name}".`
    });
  }, [files]);

  const resetCluster = useCallback(() => {
    dfsEngine.resetCluster();
    toast({
      title: "Cluster Reset",
      description: "Restored default demo nodes, files, and fault-tolerance topology."
    });
  }, []);

  return {
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
  };
}
