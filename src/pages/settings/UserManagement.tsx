import { useState, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, KeyRound, Shield, Eye, EyeOff, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRole, SYSTEM_USERS, type AppUser } from "@/contexts/RoleContext";
import { getEmployees } from "@/lib/mockData";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  Admin:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "HR Manager": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Employee:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

interface UserFormData {
  username: string;
  name: string;
  role: AppUser["role"];
  email: string;
  employeeId: string;
  password: string;
  confirmPassword: string;
  locationPermission: boolean;
  dailyHoursTarget: number;
}

const EMPTY_FORM: UserFormData = {
  username: "", name: "", role: "Employee", email: "",
  employeeId: "", password: "", confirmPassword: "",
  locationPermission: false, dailyHoursTarget: 8,
};

export default function UserManagement() {
  const { getAllUsers, createEmployeeUser, updateEmployeeUser, deleteEmployeeUser, setUserPassword, verifyPassword, user: currentUser } = useRole();
  const employees = getEmployees();

  const [formOpen, setFormOpen]     = useState(false);
  const [pwdOpen, setPwdOpen]       = useState(false);
  const [editing, setEditing]       = useState<AppUser | null>(null);
  const [pwdTarget, setPwdTarget]   = useState<AppUser | null>(null);

  const [form, setForm]             = useState<UserFormData>(EMPTY_FORM);
  const [showPwd, setShowPwd]       = useState(false);
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdError, setPwdError]     = useState("");

  const allUsers = getAllUsers();
  const empUsers = useMemo(() => allUsers.filter((u) => !SYSTEM_USERS.some((s) => s.id === u.id)), [allUsers]);

  const upd = useCallback((k: keyof UserFormData, v: string | boolean | number) => setForm((p) => ({ ...p, [k]: v })), []);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((u: AppUser) => {
    setEditing(u);
    setForm({
      username: u.username,
      name: u.name,
      role: u.role,
      email: u.email,
      employeeId: u.employeeId || "",
      password: "",
      confirmPassword: "",
      locationPermission: u.locationPermission ?? false,
      dailyHoursTarget: u.dailyHoursTarget ?? 8,
    });
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) { toast.error("Username required"); return; }
    if (!form.name.trim()) { toast.error("Name required"); return; }

    if (editing) {
      // Update
      const ok = updateEmployeeUser(editing.id, {
        username: form.username.trim(),
        name: form.name.trim(),
        role: form.role,
        email: form.email.trim(),
        employeeId: form.employeeId || undefined,
        locationPermission: form.locationPermission,
        dailyHoursTarget: form.dailyHoursTarget,
      });
      if (ok) {
        if (form.password) {
          if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
          setUserPassword(editing.id, form.password);
        }
        toast.success("User updated");
        setFormOpen(false);
      } else {
        toast.error("Failed to update user");
      }
    } else {
      // Create
      if (!form.password) { toast.error("Password required for new users"); return; }
      if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
      const result = createEmployeeUser({
        username: form.username.trim(),
        name: form.name.trim(),
        role: form.role,
        email: form.email.trim(),
        employeeId: form.employeeId || undefined,
        locationPermission: form.locationPermission,
        dailyHoursTarget: form.dailyHoursTarget,
        password: form.password,
      });
      if (result.success) {
        toast.success("User account created");
        setFormOpen(false);
      } else {
        toast.error(result.error || "Failed to create user");
      }
    }
  }, [form, editing, createEmployeeUser, updateEmployeeUser, setUserPassword]);

  const handleDelete = useCallback((u: AppUser) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    const ok = deleteEmployeeUser(u.id);
    if (ok) toast.success("User deleted");
    else toast.error("Failed to delete user");
  }, [deleteEmployeeUser]);

  const openChangePwd = useCallback((u: AppUser) => {
    setPwdTarget(u);
    setNewPwd("");
    setConfirmPwd("");
    setPwdError("");
    setPwdOpen(true);
  }, []);

  const handleChangePwd = useCallback(() => {
    if (!newPwd) { setPwdError("Enter a new password"); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match"); return; }
    if (newPwd.length < 4) { setPwdError("Password must be at least 4 characters"); return; }
    const ok = setUserPassword(pwdTarget!.id, newPwd);
    if (ok) { toast.success("Password updated"); setPwdOpen(false); }
    else toast.error("No permission to change this password");
  }, [newPwd, confirmPwd, pwdTarget, setUserPassword]);

  const linkedEmployee = useCallback((employeeId?: string) => {
    if (!employeeId) return null;
    return employees.find((e) => e.id === employeeId);
  }, [employees]);

  return (
    <div className="space-y-4">
      <PageHeader title="User Management" description="Create and manage login accounts for employees">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />Add User Account
        </Button>
      </PageHeader>

      {/* System users (read-only) */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">System Users (Built-in)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SYSTEM_USERS.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{u.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${ROLE_COLORS[u.role]}`}>{u.role}</Badge>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openChangePwd(u)}>
                    <KeyRound className="h-3 w-3" />Reset Pwd
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employee users */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <p className="text-sm font-semibold">Employee Accounts ({empUsers.length})</p>
            <p className="text-xs text-muted-foreground">Accounts created for employees to log in and use the portal</p>
          </div>
          {empUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Username</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Role</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Linked Employee</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Location</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Daily Target</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empUsers.map((u) => {
                    const emp = linkedEmployee(u.employeeId);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-sm">{u.name}</TableCell>
                        <TableCell className="font-mono text-xs">{u.username}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={`text-xs ${ROLE_COLORS[u.role]}`}>{u.role}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {emp ? <span>{emp.firstName} {emp.lastName} <span className="text-muted-foreground text-xs">({emp.employeeId})</span></span> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3 w-3" />
                            {u.locationPermission ? <span className="text-green-600">Not required</span> : <span className="text-orange-500">Branch required</span>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />{u.dailyHoursTarget ?? 8}h
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)} title="Edit user"><Edit className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openChangePwd(u)} title="Change password"><KeyRound className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(u)} title="Delete user"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No employee accounts yet — click "Add User Account" to create one
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User Account" : "Create User Account"}</DialogTitle>
            <DialogDescription>{editing ? "Update user details and optionally reset password" : "Create a new login account for an employee"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Username *</Label>
                <Input className="mt-1 h-9 font-mono" placeholder="e.g. john.doe" value={form.username} onChange={(e) => upd("username", e.target.value.replace(/\s+/g, ""))} />
                <p className="text-xs text-muted-foreground mt-1">Used to log in — no spaces allowed</p>
              </div>
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input className="mt-1 h-9" placeholder="Employee full name" value={form.name} onChange={(e) => upd("name", e.target.value)} />
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={(v) => upd("role", v as AppUser["role"])}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="HR Manager">HR Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" className="mt-1 h-9" placeholder="email@company.com" value={form.email} onChange={(e) => upd("email", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Link to Employee Record</Label>
                <Select value={form.employeeId || "__none"} onValueChange={(v) => upd("employeeId", v === "__none" ? "" : v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select employee (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Not linked</SelectItem>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Links this login to an employee profile for attendance & payslip access</p>
              </div>
            </div>

            {/* Location & hours settings */}
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attendance Settings</p>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Allow check-in from anywhere</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">If off, employee must be within a branch radius to check in/out</p>
                </div>
                <Switch checked={form.locationPermission} onCheckedChange={(v) => upd("locationPermission", v)} />
              </div>
              <div>
                <Label className="text-sm flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Daily Hours Target</Label>
                <Input type="number" min="1" max="24" step="0.5" className="mt-1 h-9 w-24" value={form.dailyHoursTarget} onChange={(e) => upd("dailyHoursTarget", parseFloat(e.target.value) || 8)} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label>{editing ? "New Password (leave blank to keep current)" : "Password *"}</Label>
              <div className="relative">
                <Input type={showPwd ? "text" : "password"} className="pr-10 h-9" placeholder={editing ? "Leave blank to keep" : "Set login password"} value={form.password} onChange={(e) => upd("password", e.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && (
                <Input type={showPwd ? "text" : "password"} className="h-9" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => upd("confirmPassword", e.target.value)} />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Update User" : "Create User"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>{pwdTarget?.name} — {pwdTarget?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>New Password *</Label>
              <div className="relative mt-1">
                <Input type={showNewPwd ? "text" : "password"} className="pr-10 h-9" placeholder="Enter new password" value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setPwdError(""); }} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPwd(!showNewPwd)}>
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirm Password *</Label>
              <Input type={showNewPwd ? "text" : "password"} className="mt-1 h-9" placeholder="Confirm new password" value={confirmPwd} onChange={(e) => { setConfirmPwd(e.target.value); setPwdError(""); }} />
            </div>
            {pwdError && <p className="text-sm text-destructive">{pwdError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPwdOpen(false)}>Cancel</Button>
              <Button onClick={handleChangePwd} className="gap-1.5"><KeyRound className="h-3.5 w-3.5" />Update Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
