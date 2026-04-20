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
import { getDepartments, setDepartments } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function DepartmentList() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const departments = getDepartments();

  const resetForm = useCallback(() => { setOpen(false); setEditingId(null); setForm({ name: "", code: "", description: "" }); }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setDepartments(departments.map((d) => d.id === editingId ? { ...d, ...form } : d));
      toast.success("Department updated");
    } else {
      setDepartments([...departments, { id: String(Date.now()), ...form, employeeCount: 0 }]);
      toast.success("Department added");
    }
    resetForm();
  }, [editingId, form, departments, resetForm]);

  const handleEdit = useCallback((dept: typeof departments[0]) => {
    setForm({ name: dept.name, code: dept.code, description: dept.description });
    setEditingId(dept.id);
    setOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDepartments(departments.filter((d) => d.id !== id));
    toast.success("Department deleted");
  }, [departments]);

  return (
    <div className="space-y-4">
      <PageHeader title="Departments" description="Manage organisational departments">
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { setForm({ name: "", code: "", description: "" }); setEditingId(null); }}><Plus className="h-4 w-4" />Add Department</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Department</DialogTitle><DialogDescription>Manage your organisational structure</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Department Name *</Label><Input className="mt-1" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Code *</Label><Input className="mt-1" required value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea className="mt-1" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{editingId ? "Update" : "Add"} Department</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Employees</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-mono text-xs font-semibold">{dept.code}</TableCell>
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{dept.description}</TableCell>
                <TableCell>{dept.employeeCount}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(dept)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(dept.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {departments.length === 0 && <EmptyState colSpan={5} message="No departments yet" />}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
