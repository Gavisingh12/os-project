 
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, HardDrive, FilePlus2, Eye } from "lucide-react";
import AnimateOnMount from '@/components/AnimateOnMount';
import { slideUp, slideInLeft, slideInRight } from '@/lib/animation';
import { useNodes } from '@/hooks/useNodes';
import { useFiles } from '@/hooks/useFiles';
import { CreateNodeDialog } from '@/components/CreateNodeDialog';
import { UploadFileDialog } from '@/components/UploadFileDialog';
import { NodeCard } from '@/components/NodeCard';
import { FileTable } from '@/components/FileTable';
import { useAuth } from '@/contexts/AuthContext';
import { ReplicaInsert } from '@/types/supabase';
import Navbar from '@/components/Navbar';
import { useReplicas } from '@/hooks/useReplicas';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { user } = useAuth();
  const { nodes, isLoadingNodes, createNode, updateNode } = useNodes();
  const { files, isLoadingFiles, createFile, deleteFile } = useFiles();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { replicas, createReplica } = useReplicas(selectedFile || undefined);

  const activeNodes = nodes.filter(node => node.status === 'online');
  const totalStorage = nodes.reduce((acc, node) => acc + node.storage_total, 0);
  const usedStorage = nodes.reduce((acc, node) => acc + node.storage_used, 0);
  const averageReplicationFactor = files.length > 0 
    ? files.reduce((acc, file) => acc + (file.replicas?.length || 0), 0) / files.length 
    : 0;

  const handleToggleNodeStatus = (nodeId: string, status: string) => {
    updateNode({ id: nodeId, status });
  };

  const handleCreateFile = async (fileData: any) => {
    return await new Promise((resolve, reject) => {
      createFile(fileData, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error)
      });
    });
  };

  const handleCreateReplica = async (replicaData: ReplicaInsert) => {
    await createReplica(replicaData);
    return Promise.resolve();
  };

  const handleViewFile = (fileId: string, fileName: string) => {
    // In a real application, this would open or download the file
    toast({
      title: "Viewing File",
      description: `Opening file: ${fileName}`,
    });
    
    // Simulate file viewing by showing content after a delay
    setTimeout(() => {
      toast({
        title: "File Content",
        description: `This is the simulated content of file: ${fileName}`,
      });
    }, 1000);
  };

  const handleDownloadFile = (fileId: string, fileName: string) => {
    // In a real application, this would download the file
    toast({
      title: "Downloading File",
      description: `Starting download for: ${fileName}`,
    });
    
    // Simulate download completion after a delay
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `File ${fileName} has been downloaded successfully`,
      });
    }, 2000);
  };

  const handleRebalanceData = () => {
    // Get available online nodes
    const onlineNodes = nodes.filter(node => node.status === 'online');
    
    if (onlineNodes.length < 2) {
      toast({
        title: "Rebalance Failed",
        description: "Need at least two online nodes to rebalance data",
        variant: "destructive"
      });
      return;
    }
    
    // Get all files with their replicas
    const filesWithReplicas = files.filter(file => file.replicas && file.replicas.length > 0);
    
    if (filesWithReplicas.length === 0) {
      toast({
        title: "Nothing to Rebalance",
        description: "No files with replicas found in the system",
        variant: "destructive"
      });
      return;
    }
    
    // Start rebalancing simulation
    toast({
      title: "Rebalancing Data",
      description: "Redistributing data across available nodes...",
    });
    
    // Simulate rebalancing progress
    setTimeout(() => {
      toast({
        title: "Rebalancing in Progress",
        description: "50% complete - moving files to optimize distribution",
      });
    }, 1000);
    
    // Simulate rebalance completion
    setTimeout(() => {
      toast({
        title: "Rebalance Complete",
        description: "Data has been optimally distributed across nodes",
      });
      
      // Show detailed results
      setTimeout(() => {
        toast({
          title: "Rebalance Results",
          description: `Balanced ${filesWithReplicas.length} files across ${onlineNodes.length} nodes`,
        });
      }, 500);
    }, 3000);
  };

  if (isLoadingNodes || isLoadingFiles) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="p-4 md:p-8">
        <AnimateOnMount animation={slideUp} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Distributed File System</h1>
          <p className="text-gray-600">Store files across multiple nodes with fault tolerance</p>
        </AnimateOnMount>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimateOnMount animation={slideUp} delay={100}>
                <Card>
                  <CardHeader>
                    <CardTitle>Files</CardTitle>
                    <CardDescription>Stored files and replicas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-2">{files.length}</div>
                    <div className="text-sm text-gray-500">
                      Total replication factor: {averageReplicationFactor.toFixed(1)}x
                    </div>
                    <div className="mt-4 flex gap-2">
                      <UploadFileDialog 
                        nodes={nodes} 
                        onCreateFile={handleCreateFile}
                        onCreateReplica={handleCreateReplica}
                      />
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnMount>
              
              <AnimateOnMount animation={slideInLeft} delay={200}>
                <Card>
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Node health and storage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {nodes.length === 0 ? (
                        <p className="text-sm text-gray-500">No nodes available. Add a node to get started.</p>
                      ) : (
                        nodes.map((node) => (
                          <div key={node.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{node.name}</span>
                              <span className={`text-xs ${node.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                                {node.status === 'online' ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-blue-500"
                                style={{ width: `${(node.storage_used / node.storage_total) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500">{Math.round((node.storage_used / node.storage_total) * 100)}% used</div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnMount>
              
              <AnimateOnMount animation={slideInRight} delay={300}>
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>System operations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <UploadFileDialog 
                      nodes={nodes} 
                      onCreateFile={handleCreateFile}
                      onCreateReplica={handleCreateReplica}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      Add New File
                    </UploadFileDialog>
                    <CreateNodeDialog 
                      onCreateNode={(nodeData) => createNode(nodeData)}
                      variant="outline"
                      className="w-full justify-start"
                    />
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleRebalanceData}
                    >
                      <HardDrive className="mr-2 h-4 w-4" />
                      Rebalance Data
                    </Button>
                  </CardContent>
                </Card>
              </AnimateOnMount>
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <AnimateOnMount animation={slideUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Stored Files</CardTitle>
                  <CardDescription>Files distributed across nodes</CardDescription>
                </CardHeader>
                <CardContent>
                  <FileTable 
                    files={files} 
                    nodes={nodes} 
                    onDeleteFile={(fileId) => deleteFile(fileId)}
                    onViewFile={handleViewFile}
                    onDownloadFile={handleDownloadFile}
                  />
                </CardContent>
              </Card>
            </AnimateOnMount>
          </TabsContent>
          
          <TabsContent value="nodes">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {nodes.length === 0 ? (
                <div className="col-span-3 text-center py-8">
                  <p className="text-gray-500 mb-4">No nodes available</p>
                  <CreateNodeDialog onCreateNode={(nodeData) => createNode(nodeData)} />
                </div>
              ) : (
                nodes.map((node, i) => (
                  <AnimateOnMount key={node.id} animation={slideUp} delay={i * 100}>
                    <NodeCard 
                      node={node} 
                      files={files}
                      onToggleStatus={handleToggleNodeStatus}
                    />
                  </AnimateOnMount>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
