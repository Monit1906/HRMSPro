import { useState, useCallback } from "react";
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDesignations, setDesignations, getDepartments } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function DesignationList() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", code: "", level: "", department: "" });
  const designations = getDesignations();
  const departments = getDepartments();

  const resetForm = useCallback(() => { setOpen(false); setEditingId(null); setForm({ title: "", code: "", level: "", department: "" }); }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setDesignations(designations.map((d) => d.id === editingId ? { ...d, ...form } : d));
      toast.success("Designation updated");
    } else {
      setDesignations([...designations, { id: String(Date.now()), ...form }]);
      toast.success("Designation added");
    }
    resetForm();
  }, [editingId, form, designations, resetForm]);

  const handleEdit = useCallback((d: typeof designations[0]) => {
    setForm({ title: d.title, code: d.code, level: d.level, department: d.department });
    setEditingId(d.id);
    setOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Designations" description="Manage job titles and positions">
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { setForm({ title: "", code: "", level: "", department: "" }); setEditingId(null); }}><Plus className="h-4 w-4" />Add Designation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Designation</DialogTitle><DialogDescription>Manage job titles and levels</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Title *</Label><Input className="mt-1" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Code *</Label><Input className="mt-1" required value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} /></div>
              <div><Label>Level *</Label><Input className="mt-1" required value={form.level} placeholder="e.g. L2, Senior, Manager" onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} /></div>
              <div>
                <Label>Department *</Label>
                <Select value={form.department} onValueChange={(v) => setForm((p) => ({ ...p, department: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{editingId ? "Update" : "Add"} Designation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Level</TableHead><TableHead>Department</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
          <TableBody>
            {designations.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs font-semibold">{d.code}</TableCell>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell>{d.level}</TableCell>
                <TableCell>{d.department}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(d)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => { setDesignations(designations.filter((x) => x.id !== d.id)); toast.success("Deleted"); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {designations.length === 0 && <EmptyState colSpan={5} message="No designations yet" />}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
