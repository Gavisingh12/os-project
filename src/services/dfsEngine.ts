// Distributed File System (DFS) Core Engine
// Implements block-level chunking, replication factor, fault tolerance, and cluster balance

export interface FileChunk {
  id: string;
  fileId: string;
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  checksum: string;
  nodeId: string;
}

export interface DFSNode {
  id: string;
  name: string;
  ip: string;
  port: number;
  rack: string;
  status: 'online' | 'offline';
  storage_total: number; // in Bytes
  storage_used: number;  // in Bytes
  created_at: string;
}

export interface DFSReplica {
  id: string;
  file_id: string;
  node_id: string;
  created_at: string;
}

export interface DFSFile {
  id: string;
  name: string;
  size: number; // in Bytes
  type: string;
  created_at: string;
  dataUrl?: string;
  chunks: FileChunk[];
  replicas: DFSReplica[];
  targetReplicationFactor: number;
}

const STORAGE_KEY_NODES = 'dfs_cluster_nodes_v2';
const STORAGE_KEY_FILES = 'dfs_cluster_files_v2';

// Helper: generate mock MD5/SHA checksum
function generateChecksum(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${hex.split('').reverse().join('')}`.substring(0, 16);
}

// Format bytes to human readable format
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Seed initial default cluster nodes
function getInitialNodes(): DFSNode[] {
  return [
    {
      id: 'node-alpha-101',
      name: 'DataNode-01 (Primary)',
      ip: '192.168.10.11',
      port: 8001,
      rack: 'Rack-Alpha',
      status: 'online',
      storage_total: 50 * 1024 * 1024 * 1024, // 50 GB
      storage_used: 12.4 * 1024 * 1024 * 1024,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'node-beta-102',
      name: 'DataNode-02 (Storage)',
      ip: '192.168.10.12',
      port: 8002,
      rack: 'Rack-Alpha',
      status: 'online',
      storage_total: 100 * 1024 * 1024 * 1024, // 100 GB
      storage_used: 28.5 * 1024 * 1024 * 1024,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'node-gamma-103',
      name: 'DataNode-03 (Backup)',
      ip: '192.168.20.13',
      port: 8003,
      rack: 'Rack-Beta',
      status: 'online',
      storage_total: 80 * 1024 * 1024 * 1024, // 80 GB
      storage_used: 18.2 * 1024 * 1024 * 1024,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'node-delta-104',
      name: 'DataNode-04 (Mirror)',
      ip: '192.168.20.14',
      port: 8004,
      rack: 'Rack-Beta',
      status: 'offline', // Demonstrating fault tolerance out-of-the-box
      storage_total: 64 * 1024 * 1024 * 1024, // 64 GB
      storage_used: 9.1 * 1024 * 1024 * 1024,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ];
}

// Seed initial default files with chunking metadata
function getInitialFiles(): DFSFile[] {
  return [
    {
      id: 'file-os-kernel-log',
      name: 'system_kernel_boot.log',
      size: 4.8 * 1024 * 1024, // 4.8 MB
      type: 'text/plain',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      dataUrl: 'data:text/plain;charset=utf-8,' + encodeURIComponent(
        `[OS KERNEL LOG - CLUSTER INITIALIZATION]\n` +
        `0.000000: Booting Linux DFS Engine v5.15.0-x86_64\n` +
        `0.002410: Initializing Distributed Block Storage Layer (HDFS-compatible)...\n` +
        `0.004820: Master Coordinator heartbeat interval set to 3000ms\n` +
        `0.012900: DataNode-01 registered at 192.168.10.11:8001 (Rack: Rack-Alpha)\n` +
        `0.018200: DataNode-02 registered at 192.168.10.12:8002 (Rack: Rack-Alpha)\n` +
        `0.024500: DataNode-03 registered at 192.168.20.13:8003 (Rack: Rack-Beta)\n` +
        `0.031000: DataNode-04 registered at 192.168.20.14:8004 [OFFLINE]\n` +
        `0.045000: Target replication factor = 2x. Quorum verified. Cluster is READY.\n`
      ),
      targetReplicationFactor: 2,
      chunks: [
        { id: 'chk-1', fileId: 'file-os-kernel-log', fileName: 'system_kernel_boot.log', chunkIndex: 0, totalChunks: 2, chunkSize: 2.4 * 1024 * 1024, checksum: generateChecksum('kernel-1'), nodeId: 'node-alpha-101' },
        { id: 'chk-2', fileId: 'file-os-kernel-log', fileName: 'system_kernel_boot.log', chunkIndex: 1, totalChunks: 2, chunkSize: 2.4 * 1024 * 1024, checksum: generateChecksum('kernel-2'), nodeId: 'node-beta-102' }
      ],
      replicas: [
        { id: 'rep-1', file_id: 'file-os-kernel-log', node_id: 'node-alpha-101', created_at: new Date().toISOString() },
        { id: 'rep-2', file_id: 'file-os-kernel-log', node_id: 'node-beta-102', created_at: new Date().toISOString() }
      ]
    },
    {
      id: 'file-memory-dump',
      name: 'core_memory_snapshot.bin',
      size: 16.2 * 1024 * 1024, // 16.2 MB
      type: 'application/octet-stream',
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      dataUrl: 'data:application/octet-stream;base64,T1NfQ09SRV9NRU1PUllfU05BUFNIT1RfSEVYX0RBVEE=',
      targetReplicationFactor: 3,
      chunks: [
        { id: 'chk-3', fileId: 'file-memory-dump', fileName: 'core_memory_snapshot.bin', chunkIndex: 0, totalChunks: 3, chunkSize: 5.4 * 1024 * 1024, checksum: generateChecksum('mem-1'), nodeId: 'node-alpha-101' },
        { id: 'chk-4', fileId: 'file-memory-dump', fileName: 'core_memory_snapshot.bin', chunkIndex: 1, totalChunks: 3, chunkSize: 5.4 * 1024 * 1024, checksum: generateChecksum('mem-2'), nodeId: 'node-beta-102' },
        { id: 'chk-5', fileId: 'file-memory-dump', fileName: 'core_memory_snapshot.bin', chunkIndex: 2, totalChunks: 3, chunkSize: 5.4 * 1024 * 1024, checksum: generateChecksum('mem-3'), nodeId: 'node-gamma-103' }
      ],
      replicas: [
        { id: 'rep-3', file_id: 'file-memory-dump', node_id: 'node-alpha-101', created_at: new Date().toISOString() },
        { id: 'rep-4', file_id: 'file-memory-dump', node_id: 'node-beta-102', created_at: new Date().toISOString() },
        { id: 'rep-5', file_id: 'file-memory-dump', node_id: 'node-gamma-103', created_at: new Date().toISOString() }
      ]
    },
    {
      id: 'file-process-tree',
      name: 'process_hierarchy.json',
      size: 1.2 * 1024 * 1024, // 1.2 MB
      type: 'application/json',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      dataUrl: 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
        clusterName: "OS-FaultTolerant-DFS",
        protocolVersion: "DFS/2.4",
        scheduling: "FairShare-RoundRobin",
        topology: {
          master: { hostname: "Master-Coordinator-0", port: 9000, state: "ACTIVE" },
          racks: ["Rack-Alpha", "Rack-Beta"]
        },
        processes: [
          { pid: 1, name: "systemd", cpu: 0.1, memoryMB: 14.2 },
          { pid: 104, name: "dfs-namenode", cpu: 2.4, memoryMB: 256.0 },
          { pid: 219, name: "dfs-datanode-worker", cpu: 4.1, memoryMB: 512.5 }
        ]
      }, null, 2)),
      targetReplicationFactor: 2,
      chunks: [
        { id: 'chk-6', fileId: 'file-process-tree', fileName: 'process_hierarchy.json', chunkIndex: 0, totalChunks: 1, chunkSize: 1.2 * 1024 * 1024, checksum: generateChecksum('proc-1'), nodeId: 'node-gamma-103' }
      ],
      replicas: [
        { id: 'rep-6', file_id: 'file-process-tree', node_id: 'node-gamma-103', created_at: new Date().toISOString() },
        { id: 'rep-7', file_id: 'file-process-tree', node_id: 'node-delta-104', created_at: new Date().toISOString() }
      ]
    }
  ];
}

class DFSEngine {
  private nodes: DFSNode[] = [];
  private files: DFSFile[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedNodes = localStorage.getItem(STORAGE_KEY_NODES);
      const storedFiles = localStorage.getItem(STORAGE_KEY_FILES);

      this.nodes = storedNodes ? JSON.parse(storedNodes) : getInitialNodes();
      this.files = storedFiles ? JSON.parse(storedFiles) : getInitialFiles();
      this.recalculateNodeStorage();
    } catch {
      this.nodes = getInitialNodes();
      this.files = getInitialFiles();
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(this.nodes));
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(this.files));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getNodes(): DFSNode[] {
    return [...this.nodes];
  }

  public getFiles(): DFSFile[] {
    return [...this.files];
  }

  // Recalculates exact storage used for each node based on assigned replicas
  private recalculateNodeStorage() {
    // Base system reserve per node (e.g., OS filesystem overhead ~ 200MB)
    const baseOverhead = 200 * 1024 * 1024;
    const usageMap: Record<string, number> = {};

    this.nodes.forEach(n => {
      usageMap[n.id] = baseOverhead;
    });

    this.files.forEach(file => {
      file.replicas.forEach(rep => {
        if (usageMap[rep.node_id] !== undefined) {
          usageMap[rep.node_id] += file.size;
        }
      });
    });

    this.nodes = this.nodes.map(node => ({
      ...node,
      storage_used: Math.min(node.storage_total, usageMap[node.id] || baseOverhead)
    }));
  }

  // Reset demo cluster to clean default state
  public resetCluster() {
    this.nodes = getInitialNodes();
    this.files = getInitialFiles();
    this.recalculateNodeStorage();
    this.saveState();
  }

  // Add new DataNode
  public addNode(name: string, storageTotalGB: number, rack = 'Rack-Alpha') {
    const nextNum = this.nodes.length + 1;
    const newNode: DFSNode = {
      id: `node-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: name || `DataNode-0${nextNum}`,
      ip: `192.168.${rack === 'Rack-Beta' ? '20' : '10'}.${10 + nextNum}`,
      port: 8000 + nextNum,
      rack: rack,
      status: 'online',
      storage_total: Math.max(1, storageTotalGB) * 1024 * 1024 * 1024,
      storage_used: 200 * 1024 * 1024, // 200MB initial OS reserve
      created_at: new Date().toISOString()
    };

    this.nodes.push(newNode);
    this.saveState();
    return newNode;
  }

  // Toggle online / offline status (Simulate Node Failure)
  public toggleNodeStatus(nodeId: string, targetStatus?: 'online' | 'offline') {
    this.nodes = this.nodes.map(node => {
      if (node.id === nodeId) {
        const newStatus = targetStatus ?? (node.status === 'online' ? 'offline' : 'online');
        return { ...node, status: newStatus };
      }
      return node;
    });
    this.saveState();
  }

  // Delete node with full storage recalculation
  public deleteNode(nodeId: string): { affectedFilesCount: number } {
    let affectedFilesCount = 0;
    this.files = this.files.map(file => {
      const hasReplicaOnNode = file.replicas.some(r => r.node_id === nodeId);
      if (hasReplicaOnNode) {
        affectedFilesCount++;
        return {
          ...file,
          replicas: file.replicas.filter(r => r.node_id !== nodeId),
          chunks: file.chunks.filter(c => c.nodeId !== nodeId)
        };
      }
      return file;
    });

    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.recalculateNodeStorage();
    this.saveState();
    return { affectedFilesCount };
  }

  // Check if file is available (at least one replica on an online node)
  public isFileAvailable(fileId: string): { available: boolean; onlineNodes: DFSNode[]; offlineNodes: DFSNode[] } {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return { available: false, onlineNodes: [], offlineNodes: [] };

    const onlineNodes: DFSNode[] = [];
    const offlineNodes: DFSNode[] = [];

    file.replicas.forEach(r => {
      const node = this.nodes.find(n => n.id === r.node_id);
      if (node) {
        if (node.status === 'online') {
          onlineNodes.push(node);
        } else {
          offlineNodes.push(node);
        }
      }
    });

    return {
      available: onlineNodes.length > 0,
      onlineNodes,
      offlineNodes
    };
  }

  // Upload file with block chunking and multi-node replication
  public async uploadFile(
    file: File,
    selectedNodeIds: string[],
    chunkSizeKB = 512
  ): Promise<DFSFile> {
    if (selectedNodeIds.length === 0) {
      throw new Error('Please select at least one online node for storage.');
    }

    // Read real file data URL for preview and download capability
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file contents'));
      reader.readAsDataURL(file);
    });

    const fileId = `file-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const chunkSizeBytes = chunkSizeKB * 1024;
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSizeBytes));

    // Create chunks and distribute across chosen nodes (Round-Robin placement)
    const chunks: FileChunk[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const assignedNodeId = selectedNodeIds[i % selectedNodeIds.length];
      const remainingBytes = file.size - (i * chunkSizeBytes);
      const currentChunkSize = Math.min(chunkSizeBytes, Math.max(1, remainingBytes));

      chunks.push({
        id: `chunk-${fileId}-${i}`,
        fileId,
        fileName: file.name,
        chunkIndex: i,
        totalChunks,
        chunkSize: currentChunkSize,
        checksum: generateChecksum(`${file.name}-${i}-${file.size}`),
        nodeId: assignedNodeId
      });
    }

    // Create replicas on each selected node
    const replicas: DFSReplica[] = selectedNodeIds.map((nodeId, idx) => ({
      id: `rep-${fileId}-${idx}`,
      file_id: fileId,
      node_id: nodeId,
      created_at: new Date().toISOString()
    }));

    const newFile: DFSFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      created_at: new Date().toISOString(),
      dataUrl,
      chunks,
      replicas,
      targetReplicationFactor: selectedNodeIds.length
    };

    this.files.unshift(newFile);
    this.recalculateNodeStorage();
    this.saveState();
    return newFile;
  }

  // Delete file and accurately free up used storage
  public deleteFile(fileId: string): boolean {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return false;

    this.files = this.files.filter(f => f.id !== fileId);
    this.recalculateNodeStorage();
    this.saveState();
    return true;
  }

  // Real Rebalance algorithm: redistributes replicas to minimize storage variance
  public rebalanceCluster(): {
    rebalancedFiles: number;
    movedReplicas: number;
    beforeStdDev: number;
    afterStdDev: number;
  } {
    const onlineNodes = this.nodes.filter(n => n.status === 'online');
    if (onlineNodes.length < 2) {
      throw new Error('Rebalancing requires at least 2 online nodes.');
    }

    const calcStdDev = () => {
      const usages = onlineNodes.map(n => n.storage_used / n.storage_total);
      const mean = usages.reduce((a, b) => a + b, 0) / usages.length;
      const variance = usages.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / usages.length;
      return Math.sqrt(variance);
    };

    const beforeStdDev = calcStdDev();
    let movedReplicas = 0;
    let rebalancedFiles = 0;

    // Iterate through files and migrate replicas from most utilized node to least utilized node
    this.files.forEach(file => {
      let fileMoved = false;
      file.replicas.forEach(rep => {
        // Sort online nodes by utilization
        onlineNodes.sort((a, b) => (a.storage_used / a.storage_total) - (b.storage_used / b.storage_total));
        const leastUsed = onlineNodes[0];
        const currentNode = onlineNodes.find(n => n.id === rep.node_id);

        if (currentNode && (currentNode.storage_used / currentNode.storage_total) > (leastUsed.storage_used / leastUsed.storage_total) + 0.15) {
          // Check if leastUsed already has a replica of this file
          const alreadyHasReplica = file.replicas.some(r => r.node_id === leastUsed.id);
          if (!alreadyHasReplica) {
            rep.node_id = leastUsed.id;
            movedReplicas++;
            fileMoved = true;
            this.recalculateNodeStorage();
          }
        }
      });
      if (fileMoved) rebalancedFiles++;
    });

    this.recalculateNodeStorage();
    const afterStdDev = calcStdDev();
    this.saveState();

    return {
      rebalancedFiles,
      movedReplicas,
      beforeStdDev: Number(beforeStdDev.toFixed(3)),
      afterStdDev: Number(afterStdDev.toFixed(3))
    };
  }

  // Self-Healing: Re-replicate under-replicated files across online nodes
  public selfHealCluster(): { healedFilesCount: number; newReplicasCreated: number } {
    const onlineNodes = this.nodes.filter(n => n.status === 'online');
    if (onlineNodes.length === 0) {
      throw new Error('No online nodes available to self-heal.');
    }

    let healedFilesCount = 0;
    let newReplicasCreated = 0;

    this.files.forEach(file => {
      // Count current active online replicas
      const activeOnlineReplicas = file.replicas.filter(r =>
        onlineNodes.some(on => on.id === r.node_id)
      );

      const neededReplicas = Math.max(0, file.targetReplicationFactor - activeOnlineReplicas.length);

      if (neededReplicas > 0) {
        // Find online nodes that don't currently have a replica
        const candidateNodes = onlineNodes.filter(on =>
          !file.replicas.some(r => r.node_id === on.id)
        );

        const nodesToAssign = candidateNodes.slice(0, neededReplicas);

        nodesToAssign.forEach((targetNode, idx) => {
          file.replicas.push({
            id: `rep-healed-${file.id}-${Date.now()}-${idx}`,
            file_id: file.id,
            node_id: targetNode.id,
            created_at: new Date().toISOString()
          });
          newReplicasCreated++;
        });

        if (nodesToAssign.length > 0) {
          healedFilesCount++;
        }
      }
    });

    this.recalculateNodeStorage();
    this.saveState();

    return { healedFilesCount, newReplicasCreated };
  }
}

export const dfsEngine = new DFSEngine();
