import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, Send, Trash2, HelpCircle } from "lucide-react";
import { useDFS } from "@/hooks/useDFS";

interface DFSShellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
}

export function DFSShellModal({ open, onOpenChange }: DFSShellModalProps) {
  const {
    nodes,
    files,
    onlineNodes,
    offlineNodes,
    toggleNode,
    deleteFile,
    rebalance,
    selfHeal,
    formatBytes
  } = useDFS();

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: 'init-1',
      type: 'output',
      text: 'Distributed File System (DFS) Interactive Shell v2.4\nType "help" for a list of available cluster commands.'
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const appendLog = (type: CommandLog['type'], text: string) => {
    setLogs(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type, text }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInput(history[history.length - 1 - nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(history[history.length - 1 - nextIdx] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const executeCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    appendLog('input', `$ ${trimmed}`);
    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const parts = trimmed.split(' ').filter(Boolean);
    const cmd = parts[0]?.toLowerCase();
    const subCmd = parts[1]?.toLowerCase();
    const arg = parts.slice(2).join(' ');

    if (cmd === 'help') {
      appendLog(
        'output',
        `AVAILABLE DFS CLUSTER COMMANDS:
  dfs -ls               List all files, sizes, blocks, and replica node locations
  dfs -nodes            Display current status of all storage DataNodes
  dfs -df               Show storage capacity, free space, and cluster headroom
  dfs -cat <filename>   Reconstruct and print the contents of a file
  dfs -rm <filename>    Delete a file and purge its distributed block chunks
  dfs -crash <node>     Simulate hardware power failure on a DataNode
  dfs -recover <node>   Restore a crashed DataNode back online
  dfs -selfheal         Trigger automated replica healing across online nodes
  dfs -rebalance        Execute greedy variance storage rebalancing
  clear                 Clear terminal output screen
  help                  Show this reference manual`
      );
    } else if (cmd === 'clear') {
      setLogs([]);
    } else if (cmd === 'dfs') {
      if (!subCmd || subCmd === '-h' || subCmd === '--help') {
        appendLog('output', 'Usage: dfs [-ls | -nodes | -df | -cat <file> | -rm <file> | -crash <node> | -recover <node> | -selfheal | -rebalance]');
      } else if (subCmd === '-ls') {
        if (files.length === 0) {
          appendLog('output', 'Directory empty: No files currently stored in DFS.');
        } else {
          const list = files
            .map(f => {
              const liveReps = f.replicas.filter(r => onlineNodes.some(n => n.id === r.node_id)).length;
              return `${f.name.padEnd(28)} | ${formatBytes(f.size).padEnd(9)} | ${f.chunks.length} blocks | ${liveReps}/${f.replicas.length} live replicas`;
            })
            .join('\n');
          appendLog('output', `INODE DIRECTORY (${files.length} files):\n${list}`);
        }
      } else if (subCmd === '-nodes') {
        const nodeList = nodes
          .map(n => `[${n.status.toUpperCase().padEnd(7)}] ${n.name.padEnd(24)} (${n.ip}) - Rack: ${n.rack} - Used: ${formatBytes(n.storage_used)} / ${formatBytes(n.storage_total)}`)
          .join('\n');
        appendLog('output', `CLUSTER STORAGE POOL (${onlineNodes.length}/${nodes.length} ONLINE):\n${nodeList}`);
      } else if (subCmd === '-df') {
        const totalCap = nodes.reduce((acc, n) => acc + n.storage_total, 0);
        const totalUsed = nodes.reduce((acc, n) => acc + n.storage_used, 0);
        const totalFree = Math.max(0, totalCap - totalUsed);
        appendLog(
          'output',
          `FILESYSTEM DISK POOL USAGE:
  Total Capacity:     ${formatBytes(totalCap)}
  Allocated Storage:  ${formatBytes(totalUsed)}
  Available Headroom: ${formatBytes(totalFree)}
  Cluster Quorum:     ${onlineNodes.length >= Math.ceil(nodes.length / 2) ? 'QUORUM HEALTHY' : 'QUORUM DEGRADED'}`
        );
      } else if (subCmd === '-cat') {
        const fileName = parts.slice(2).join(' ').trim();
        if (!fileName) {
          appendLog('error', 'Error: Must specify filename. Example: dfs -cat system_kernel_boot.log');
          return;
        }
        const file = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
        if (!file) {
          appendLog('error', `Error: File "${fileName}" not found in Inode catalog.`);
          return;
        }
        const hasLiveReplica = file.replicas.some(r => onlineNodes.some(on => on.id === r.node_id));
        if (!hasLiveReplica) {
          appendLog('error', `Read Failed: All nodes containing replicas for "${fileName}" are offline.`);
          return;
        }
        if (file.dataUrl) {
          try {
            let decoded = '';
            if (file.dataUrl.includes('charset=utf-8,')) {
              decoded = decodeURIComponent(file.dataUrl.split('charset=utf-8,')[1] || '');
            } else if (file.dataUrl.includes('base64,')) {
              decoded = atob(file.dataUrl.split('base64,')[1] || '');
            }
            appendLog('success', `--- START OF ${file.name} ---\n${decoded || '[Binary payload cannot be rendered in shell]'}\n--- END OF FILE ---`);
          } catch {
            appendLog('output', `[Binary file: ${formatBytes(file.size)}]`);
          }
        } else {
          appendLog('output', `[File payload present in ${file.chunks.length} blocks]`);
        }
      } else if (subCmd === '-rm') {
        const fileName = parts.slice(2).join(' ').trim();
        if (!fileName) {
          appendLog('error', 'Error: Must specify filename to remove. Example: dfs -rm process_hierarchy.json');
          return;
        }
        const file = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
        if (!file) {
          appendLog('error', `Error: File "${fileName}" does not exist.`);
          return;
        }
        deleteFile(file.id);
        appendLog('success', `Purged Inode and reclaimed blocks for "${fileName}".`);
      } else if (subCmd === '-crash') {
        const target = parts.slice(2).join(' ').trim();
        if (!target) {
          appendLog('error', 'Error: Specify node name or ID. Example: dfs -crash DataNode-01');
          return;
        }
        const node = nodes.find(n => n.name.toLowerCase().includes(target.toLowerCase()) || n.id.toLowerCase() === target.toLowerCase());
        if (!node) {
          appendLog('error', `Node "${target}" not found.`);
          return;
        }
        if (node.status === 'offline') {
          appendLog('error', `Node "${node.name}" is already offline.`);
        } else {
          toggleNode(node.id);
          appendLog('success', `Simulated hardware crash on "${node.name}".`);
        }
      } else if (subCmd === '-recover') {
        const target = parts.slice(2).join(' ').trim();
        if (!target) {
          appendLog('error', 'Error: Specify node name or ID. Example: dfs -recover DataNode-04');
          return;
        }
        const node = nodes.find(n => n.name.toLowerCase().includes(target.toLowerCase()) || n.id.toLowerCase() === target.toLowerCase());
        if (!node) {
          appendLog('error', `Node "${target}" not found.`);
          return;
        }
        if (node.status === 'online') {
          appendLog('error', `Node "${node.name}" is already online.`);
        } else {
          toggleNode(node.id);
          appendLog('success', `Brought "${node.name}" back online.`);
        }
      } else if (subCmd === '-selfheal') {
        selfHeal();
        appendLog('success', 'Executed autonomic replica self-healing scan across surviving nodes.');
      } else if (subCmd === '-rebalance') {
        rebalance();
        appendLog('success', 'Triggered greedy variance storage rebalancer across active DataNodes.');
      } else {
        appendLog('error', `Unknown sub-command: "${subCmd}". Type "help" for syntax.`);
      }
    } else {
      appendLog('error', `Command not found: "${cmd}". Type "help" for a list of commands.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executeCommand(input);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-slate-950 border border-slate-800 text-slate-100 rounded-xl shadow-2xl p-0 overflow-hidden flex flex-col h-[520px]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
              <Terminal className="h-3.5 w-3.5 text-blue-400" />
              <span>root@dfs-namenode-0:~#</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              RPC Port: 9000
            </span>
            <button
              onClick={() => setLogs([])}
              title="Clear Terminal"
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Output Body */}
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 select-text bg-slate-950">
          {logs.map((log) => {
            if (log.type === 'input') {
              return (
                <div key={log.id} className="text-blue-400 font-semibold">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'error') {
              return (
                <div key={log.id} className="text-rose-400 bg-rose-950/20 border border-rose-900/30 p-2 rounded whitespace-pre-wrap">
                  {log.text}
                </div>
              );
            }
            if (log.type === 'success') {
              return (
                <div key={log.id} className="text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2 rounded whitespace-pre-wrap">
                  {log.text}
                </div>
              );
            }
            return (
              <div key={log.id} className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {log.text}
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/90 border-t border-slate-800">
          <span className="font-mono text-xs text-emerald-400 font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type 'dfs -ls', 'dfs -df', 'dfs -cat <file>', 'help'..."
            className="flex-1 bg-transparent border-0 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-[11px]"
          >
            <Send className="h-3 w-3 mr-1" />
            Execute
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
