import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Server,
  LayoutDashboard,
  Network,
  Files,
  BarChart3,
  Sliders,
  BookOpen,
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDFS } from '@/hooks/useDFS';
import { UploadFileDialog } from '@/components/UploadFileDialog';
import { CreateNodeDialog } from '@/components/CreateNodeDialog';
import { DFSShellModal } from '@/components/DFSShellModal';

export function Layout() {
  const [shellOpen, setShellOpen] = useState(false);
  const {
    nodes,
    files,
    onlineNodes,
    clusterHealthPercent,
    uploadFile,
    addNode
  } = useDFS();

  const isQuorumHealthy = onlineNodes.length >= Math.ceil(nodes.length / 2);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'DataNodes & Topology', path: '/nodes', icon: Network },
    { name: 'File Explorer', path: '/files', icon: Files },
    { name: 'Storage Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Cluster Operations', path: '/operations', icon: Sliders },
    { name: 'OS Architecture Guide', path: '/architecture', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header - Compact Enterprise Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <Server className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                    Distributed File System
                  </h1>
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Cluster v2.4
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Fault-Tolerant Block Storage & Quorum Manager
                </p>
              </div>
            </div>

            {/* Quick Status & Global Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Cluster Health Pill */}
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium ${
                isQuorumHealthy
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isQuorumHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isQuorumHealthy ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                </span>
                <span className="font-mono text-[11px] font-semibold">
                  {onlineNodes.length}/{nodes.length} Nodes ({clusterHealthPercent}%)
                </span>
              </div>

              {/* DFS Shell Terminal Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShellOpen(true)}
                className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-100 font-mono text-xs h-8 px-2.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                title="Launch DFS Interactive CLI Shell"
              >
                <Terminal className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden md:inline font-semibold">DFS Shell</span>
              </Button>

              {/* Upload File Button */}
              <UploadFileDialog
                nodes={nodes}
                onUploadFile={uploadFile}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 px-3 rounded-lg shadow-xs border-0"
              />

              {/* Add Node Button */}
              <CreateNodeDialog
                onCreateNode={addNode}
                variant="outline"
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs h-8 px-3 rounded-lg shadow-xs hidden sm:flex"
              />
            </div>
          </div>

          {/* Clean Navigation Tabs - Integrated Strip */}
          <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-1.5 border-t border-slate-200 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              let badgeCount: number | null = null;
              if (item.path === '/nodes') badgeCount = nodes.length;
              if (item.path === '/files') badgeCount = files.length;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.name}</span>
                  {badgeCount !== null && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white text-slate-700 border border-slate-200">
                      {badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <Outlet />
      </main>

      {/* Interactive DFS Shell Modal */}
      <DFSShellModal open={shellOpen} onOpenChange={setShellOpen} />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Operating Systems Distributed Systems Project • High-Availability Cluster</span>
          <span className="font-mono text-[11px] text-blue-600 font-semibold">Quorum Consensus • Block Replication • Self-Healing</span>
        </div>
      </footer>
    </div>
  );
}
