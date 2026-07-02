import { useState, useCallback } from "react";
import { Plus, MoreVertical, Edit, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { getBranches, setBranches, type Branch } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

const EMPTY = { name: "", code: "", address: "", city: "", state: "", country: "", latitude: 0, longitude: 0, radius: 100, contactPerson: "", phone: "" };

type BranchForm = typeof EMPTY;

function BranchFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  title,
}: {
  open: boolean;
  onClose: () => void;
  initial: BranchForm;
  onSubmit: (form: BranchForm) => void;
  title: string;
}) {
  const [form, setForm] = useState<BranchForm>(initial);
  const upd = useCallback((k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v })), []);

  // Sync when initial changes (for edit mode)
  useState(() => { setForm(initial); });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Configure office location with geo-fencing radius</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Branch Name *</Label><Input className="mt-1" required value={form.name} onChange={(e) => upd("name", e.target.value)} /></div>
            <div><Label>Code *</Label><Input className="mt-1" required value={form.code} onChange={(e) => upd("code", e.target.value)} /></div>
          </div>
          <div><Label>Address *</Label><Textarea className="mt-1" rows={2} required value={form.address} onChange={(e) => upd("address", e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>City *</Label><Input className="mt-1" required value={form.city} onChange={(e) => upd("city", e.target.value)} /></div>
            <div><Label>State *</Label><Input className="mt-1" required value={form.state} onChange={(e) => upd("state", e.target.value)} /></div>
            <div><Label>Country *</Label><Input className="mt-1" required value={form.country} onChange={(e) => upd("country", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Latitude *</Label><Input type="number" step="any" className="mt-1" required value={form.latitude || ""} onChange={(e) => upd("latitude", parseFloat(e.target.value))} /></div>
            <div><Label>Longitude *</Label><Input type="number" step="any" className="mt-1" required value={form.longitude || ""} onChange={(e) => upd("longitude", parseFloat(e.target.value))} /></div>
            <div><Label>Radius (m) *</Label><Input type="number" className="mt-1" required value={form.radius} onChange={(e) => upd("radius", parseInt(e.target.value))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact Person *</Label><Input className="mt-1" required value={form.contactPerson} onChange={(e) => upd("contactPerson", e.target.value)} /></div>
            <div><Label>Phone *</Label><Input className="mt-1" required value={form.phone} onChange={(e) => upd("phone", e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{title.startsWith("Edit") ? "Save Changes" : "Add Branch"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BranchList() {
  const [addOpen, setAddOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [tick, setTick] = useState(0);
  const branches = getBranches();

  const handleAdd = useCallback((form: BranchForm) => {
    setBranches([...getBranches(), { id: String(Date.now()), ...form }]);
    toast.success("Branch added");
    setAddOpen(false);
    setTick((t) => t + 1);
  }, []);

  const handleEdit = useCallback((form: BranchForm) => {
    if (!editBranch) return;
    setBranches(getBranches().map((b) => b.id === editBranch.id ? { ...b, ...form } : b));
    toast.success("Branch updated");
    setEditBranch(null);
    setTick((t) => t + 1);
  }, [editBranch]);

  const handleDelete = useCallback((id: string) => {
    setBranches(getBranches().filter((x) => x.id !== id));
    toast.success("Branch deleted");
    setTick((t) => t + 1);
  }, []);

  const editForm: BranchForm = editBranch
    ? { name: editBranch.name, code: editBranch.code, address: editBranch.address, city: editBranch.city, state: editBranch.state, country: editBranch.country, latitude: editBranch.latitude, longitude: editBranch.longitude, radius: editBranch.radius, contactPerson: editBranch.contactPerson, phone: editBranch.phone }
    : EMPTY;

  return (
    <div className="space-y-4">
      <PageHeader title="Branches / Sites" description="Manage office locations with geo-fencing">
        <Button className="gap-2" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add Branch</Button>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Geo-fence</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs font-semibold">{b.code}</TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3 text-muted-foreground" />{b.city}, {b.state}</div>
                  <p className="text-xs text-muted-foreground">{b.country}</p>
                </TableCell>
                <TableCell className="text-sm">
                  <p>{b.contactPerson}</p>
                  <p className="text-xs text-muted-foreground">{b.phone}</p>
                </TableCell>
                <TableCell className="text-xs">
                  <p>{b.radius}m radius</p>
                  <p className="text-muted-foreground">{b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}</p>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditBranch(b)}>
                        <Edit className="mr-2 h-4 w-4" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {branches.length === 0 && <EmptyState colSpan={6} message="No branches configured" />}
          </TableBody>
        </Table>
      </Card>

      {/* Add dialog */}
      <BranchFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        initial={EMPTY}
        onSubmit={handleAdd}
        title="Add New Branch / Site"
      />

      {/* Edit dialog */}
      {editBranch && (
        <BranchFormDialog
          open={!!editBranch}
          onClose={() => setEditBranch(null)}
          initial={editForm}
          onSubmit={handleEdit}
          title={`Edit Branch — ${editBranch.name}`}
        />
      )}
    </div>
  );
}
