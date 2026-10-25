import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Cpu, Layers, Network, ShieldCheck, Server, Database } from 'lucide-react';

export default function ArchitecturePage() {
  const concepts = [
    {
      title: "1. Master-Worker Architecture (NameNode & DataNodes)",
      tag: "Topology",
      icon: Server,
      description: "Our DFS employs a centralized metadata coordinator (Master/NameNode) and distributed storage workers (DataNodes). The NameNode maintains the Inode directory, mapping filenames to logical block IDs and physical node locations. DataNodes store the raw block chunks and handle direct read/write pipelines.",
      points: [
        "Master stores metadata in high-speed memory for sub-millisecond lookups.",
        "DataNodes periodically emit heartbeats (every 3000ms) to affirm health.",
        "Clients query the Master for block locations, then fetch data directly from DataNodes."
      ]
    },
    {
      title: "2. Block-Level Chunking (Splitting Files into Blocks)",
      tag: "Storage Layer",
      icon: Layers,
      description: "Rather than treating files as monolithic entities, large files are segmented into fixed-size logical blocks (128 KB, 256 KB, 512 KB, 1 MB). Each block receives an independent cryptographic checksum to verify integrity against bit rot or disk degradation.",
      points: [
        "Enables files larger than any single physical drive to be stored across the cluster.",
        "Supports concurrent read/write streaming across multiple nodes.",
        "Granular replication reduces network recovery overhead upon node failure."
      ]
    },
    {
      title: "3. N-Way Replication Factor (Fault Tolerance)",
      tag: "Reliability",
      icon: ShieldCheck,
      description: "Every file block is replicated across multiple independent DataNodes (default replication factor = 2x or 3x). If any single DataNode experiences power loss, hardware failure, or network partition, the file remains fully accessible through surviving replicas.",
      points: [
        "High availability: Files withstand (N - 1) simultaneous node failures.",
        "Read throughput scales linearly with the number of replicas.",
        "Client reads are routed to the nearest available replica node."
      ]
    },
    {
      title: "4. Quorum Consensus & Split-Brain Prevention",
      tag: "Consensus",
      icon: Cpu,
      description: "To prevent inconsistent states and corrupt writes, the cluster maintains a strict quorum policy. Operations require more than 50% of the nodes to be reachable (Floor(N/2) + 1). If a network partition leaves fewer than quorum nodes active, the cluster degrades gracefully rather than allowing split-brain writes.",
      points: [
        "Avoids data corruption during network isolation.",
        "Guarantees that at least one surviving node contains the most recent block revision.",
        "Automatic quorum recovery when isolated nodes re-establish connectivity."
      ]
    },
    {
      title: "5. Rack-Aware Replica Placement",
      tag: "Failure Domains",
      icon: Network,
      description: "Replicas are placed strategically across different physical racks (e.g., Rack-Alpha and Rack-Beta). Even if an entire rack switch or power distribution unit (PDU) fails, replicas in alternate racks preserve complete file availability.",
      points: [
        "Protects against rack-level switch failures and localized power outages.",
        "Balances cross-rack network bandwidth with intra-rack high-speed transfers.",
        "Enforces failure domain diversity during file allocation."
      ]
    },
    {
      title: "6. Self-Healing & Cluster Rebalancing",
      tag: "Autonomic OS",
      icon: Database,
      description: "The Distributed File System operates autonomically. When nodes fail, the Self-Healing engine detects under-replicated blocks and automatically replicates them onto healthy nodes. The Rebalance engine minimizes storage variance across nodes to prevent hotspot saturation.",
      points: [
        "Zero-touch recovery from permanent hardware decommissioning.",
        "Variance minimization balances disk utilization across all cluster members.",
        "Background scheduling avoids saturating user I/O pipelines."
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          OS Architecture & Core Distributed Principles
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Theoretical foundation and operational mechanisms of our Distributed File System (inspired by Google File System & HDFS)
        </p>
      </div>

      {/* Concept Cards Grid with Aligned Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {concepts.map((concept, index) => {
          const Icon = concept.icon;
          return (
            <div
              key={index}
              className="enterprise-card-interactive p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="icon-squircle h-9 w-9">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 tracking-tight">{concept.title}</h3>
                  </div>
                  <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-[10px] font-mono font-semibold">
                    {concept.tag}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {concept.description}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2 mt-auto">
                <span className="label-micro block text-slate-700">Key OS Implementation Details:</span>
                <ul className="space-y-1.5">
                  {concept.points.map((pt, pIdx) => (
                    <li key={pIdx} className="text-[11px] text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="text-blue-600 font-bold mt-0.5">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
