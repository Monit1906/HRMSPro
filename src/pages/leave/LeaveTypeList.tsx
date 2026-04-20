import { useState, useCallback } from "react";
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getLeaveTypes, setLeaveTypes } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

const EMPTY_FORM = { name: "", code: "", isUnlimited: true, requiresApproval: true, description: "", color: "#3b82f6" };

export default function LeaveTypeList() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const leaveTypes = getLeaveTypes();

  const upd = useCallback((k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v })), []);

  const resetForm = useCallback(() => { setOpen(false); setEditingId(null); setForm(EMPTY_FORM); }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setLeaveTypes(leaveTypes.map((t) => t.id === editingId ? { ...t, ...form } : t));
      toast.success("Leave type updated");
    } else {
      setLeaveTypes([...leaveTypes, { id: String(Date.now()), ...form }]);
      toast.success("Leave type added");
    }
    resetForm();
  }, [editingId, form, leaveTypes, resetForm]);

  const handleEdit = useCallback((type: typeof leaveTypes[0]) => {
    setForm({ name: type.name, code: type.code, isUnlimited: type.isUnlimited, requiresApproval: type.requiresApproval, description: type.description, color: type.color });
    setEditingId(type.id);
    setOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setLeaveTypes(leaveTypes.filter((t) => t.id !== id));
    toast.success("Leave type deleted");
  }, [leaveTypes]);

  return (
    <div className="space-y-4">
      <PageHeader title="Leave Types" description="Configure leave categories and policies">
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); }}><Plus className="h-4 w-4" />Add Leave Type</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Leave Type" : "Add New Leave Type"}</DialogTitle>
              <DialogDescription>{editingId ? "Update leave category details" : "Create a new leave category"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name *</Label><Input className="mt-1" required value={form.name} onChange={(e) => upd("name", e.target.value)} /></div>
                <div><Label>Code *</Label><Input className="mt-1" required value={form.code} onChange={(e) => upd("code", e.target.value)} /></div>
              </div>
              <div><Label>Description</Label><Textarea className="mt-1" rows={2} value={form.description} onChange={(e) => upd("description", e.target.value)} /></div>
              <div><Label>Display Color</Label><Input type="color" className="mt-1 h-10 cursor-pointer" value={form.color} onChange={(e) => upd("color", e.target.value)} /></div>
              <div className="flex items-center justify-between py-1 border-t">
                <div><p className="text-sm font-medium">Unlimited Leave</p><p className="text-xs text-muted-foreground">{form.isUnlimited ? "No annual cap" : "Annual allocation needed"}</p></div>
                <Switch checked={form.isUnlimited} onCheckedChange={(v) => upd("isUnlimited", v)} />
              </div>
              <div className="flex items-center justify-between py-1 border-t">
                <p className="text-sm font-medium">Requires Approval</p>
                <Switch checked={form.requiresApproval} onCheckedChange={(v) => upd("requiresApproval", v)} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{editingId ? "Update" : "Add"} Leave Type</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Policy</TableHead><TableHead>Color</TableHead><TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-mono text-xs font-semibold">{type.code}</TableCell>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{type.description}</TableCell>
                <TableCell className="text-sm">
                  {type.isUnlimited ? "Unlimited" : "Limited"}
                  {type.requiresApproval && " · Needs Approval"}
                </TableCell>
                <TableCell><div className="h-5 w-5 rounded-full border" style={{ backgroundColor: type.color }} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(type)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(type.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {leaveTypes.length === 0 && <EmptyState colSpan={6} message="No leave types configured" />}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
