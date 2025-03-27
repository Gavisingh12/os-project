 
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Server } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NodeInsert } from "@/types/supabase";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nodeSchema = z.object({
  name: z.string().min(1, "Node name is required"),
  storage_total: z.number().min(1, "Storage must be at least 1GB"),
});

type NodeFormValues = z.infer<typeof nodeSchema>;

interface CreateNodeDialogProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onCreateNode: (node: NodeInsert) => void;
  variant?: ButtonProps["variant"];
  className?: string;
  children?: React.ReactNode;
}

export function CreateNodeDialog({ 
  onCreateNode, 
  variant = "default", 
  className, 
  children,
  ...props 
}: CreateNodeDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  
  const form = useForm<NodeFormValues>({
    resolver: zodResolver(nodeSchema),
    defaultValues: {
      name: "",
      storage_total: 100,
    },
  });
  
  const onSubmit = (data: NodeFormValues) => {
    if (!user) return;
    
    onCreateNode({
      name: data.name,
      storage_total: data.storage_total,
      storage_used: 0,
      status: 'online',
      user_id: user.id,
    });
    
    form.reset();
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("w-full justify-start", className)} variant={variant} {...props}>
          {children || (
            <>
              <Server className="mr-2 h-4 w-4" />
              Add New Node
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Node</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Node Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Node 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="storage_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Capacity (GB)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="100" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">Create Node</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
