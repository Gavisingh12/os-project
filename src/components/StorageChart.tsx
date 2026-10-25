import React from 'react';
import { DFSNode, formatBytes } from '@/services/dfsEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface StorageChartProps {
  nodes: DFSNode[];
}

export function StorageChart({ nodes }: StorageChartProps) {
  const barData = nodes.map(node => ({
    name: node.name.replace('DataNode-', 'DN-'),
    fullName: node.name,
    usedGB: Number((node.storage_used / (1024 * 1024 * 1024)).toFixed(2)),
    freeGB: Number(((node.storage_total - node.storage_used) / (1024 * 1024 * 1024)).toFixed(2)),
    status: node.status
  }));

  const totalUsed = nodes.reduce((acc, n) => acc + n.storage_used, 0);
  const totalCap = nodes.reduce((acc, n) => acc + n.storage_total, 0);
  const totalFree = Math.max(0, totalCap - totalUsed);

  const pieData = [
    { name: 'Used Storage', value: totalUsed, color: '#2563EB' },
    { name: 'Available Pool', value: totalFree, color: '#93C5FD' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
      {/* Node Utilization Bar Chart */}
      <div className="enterprise-card p-5 lg:col-span-2 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            DataNode Storage Allocation (GB)
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Active block footprint vs free disk capacity per node
          </p>
        </div>

        <div className="h-64 w-full pt-4 min-h-[250px]">
          <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={240}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" GB" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '8px',
                  color: '#0F172A',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)'
                }}
                formatter={(value: any, name: string) => [
                  `${value} GB`,
                  name === 'usedGB' ? 'Used Storage' : 'Free Storage'
                ]}
              />
              <Bar dataKey="usedGB" stackId="a" fill="#2563EB" isAnimationActive={false} radius={[0, 0, 4, 4]}>
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-used-${index}`}
                    fill={entry.status === 'offline' ? '#EF4444' : '#2563EB'}
                  />
                ))}
              </Bar>
              <Bar dataKey="freeGB" stackId="a" fill="#CBD5E1" isAnimationActive={false} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cluster Total Pie Distribution */}
      <div className="enterprise-card p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Cluster Storage Pool
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Aggregated capacity breakdown
          </p>
        </div>

        <div className="w-full h-44 my-auto min-h-[180px]">
          <ResponsiveContainer width="100%" height={170} minWidth={0} minHeight={170}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
                isAnimationActive={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '8px',
                  color: '#0F172A',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)'
                }}
                formatter={(value: any) => formatBytes(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs pt-3 border-t border-slate-100">
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Used Space</span>
            <span className="font-mono font-bold text-blue-600">{formatBytes(totalUsed)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] font-medium">Total Pool</span>
            <span className="font-mono font-bold text-slate-800">{formatBytes(totalCap)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
