import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Server, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateNodeDialogProps {
  onCreateNode: (name: string, capacityGB: number, rack: string) => void;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function CreateNodeDialog({
  onCreateNode,
  className,
  children,
  variant = "default"
}: CreateNodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [capacityGB, setCapacityGB] = useState(64);
  const [rack, setRack] = useState('Rack-Alpha');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateNode(name.trim(), Math.max(1, capacityGB), rack);
    setName('');
    setCapacityGB(64);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={cn("text-xs font-medium h-9 px-3.5 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition-colors", className)}
        >
          {children || (
            <>
              <Plus className="mr-1.5 h-4 w-4 text-blue-600" />
              Add DataNode
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 rounded-xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Provision Storage DataNode
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Register a new DataNode instance in the cluster pool
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Node Name */}
          <div className="space-y-1.5">
            <Label htmlFor="node-name" className="text-xs font-semibold text-slate-900">
              Node Identifier / Hostname
            </Label>
            <Input
              id="node-name"
              placeholder="e.g. DataNode-05"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-white border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500"
            />
          </div>

          {/* Storage Capacity */}
          <div className="space-y-1.5">
            <Label htmlFor="node-cap" className="text-xs font-semibold text-slate-900">
              Storage Capacity (GB)
            </Label>
            <Input
              id="node-cap"
              type="number"
              min={1}
              max={10000}
              value={isNaN(capacityGB) ? '' : capacityGB}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCapacityGB(isNaN(val) ? 0 : val);
              }}
              required
              className="bg-white border-slate-200 text-xs text-slate-900 font-mono focus-visible:ring-blue-500"
            />
            <p className="text-[10px] text-slate-500 font-mono">
              Initial OS reserve: 200 MB will be allocated for block tables.
            </p>
          </div>

          {/* Rack Domain Assignment */}
          <div className="space-y-1.5">
            <Label htmlFor="node-rack" className="text-xs font-semibold text-slate-900">
              Failure Domain (Rack / Subnet)
            </Label>
            <select
              id="node-rack"
              value={rack}
              onChange={(e) => setRack(e.target.value)}
              className="w-full h-9 rounded-md bg-white border border-slate-200 text-xs text-slate-900 px-3 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Rack-Alpha">Rack-Alpha (Subnet 192.168.10.x)</option>
              <option value="Rack-Beta">Rack-Beta (Subnet 192.168.20.x)</option>
              <option value="Rack-Gamma">Rack-Gamma (Subnet 192.168.30.x)</option>
            </select>
            <p className="text-[10px] text-slate-500">
              Rack-awareness ensures replicas are spread across power failure domains.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={!name.trim() || capacityGB < 1}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-9 rounded-lg border-0 shadow-xs transition-colors"
            >
              Register & Connect DataNode
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
