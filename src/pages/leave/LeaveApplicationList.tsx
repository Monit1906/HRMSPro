import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLeaveApplications, setLeaveApplications, getLeaveTypes, deductLeaveBalance, restoreLeaveBalance } from "@/lib/mockData";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { exportCsv } from "@/lib/exportCsv";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function LeaveApplicationList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { can } = useRole();
  const applications = getLeaveApplications();
  const leaveTypes = getLeaveTypes();

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((a) => a.status === "Pending").length,
    approved: applications.filter((a) => a.status === "Approved").length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
  }), [applications]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return applications.filter((app) => {
      const matchSearch = app.employeeName.toLowerCase().includes(q) || app.leaveType.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || app.status === statusFilter;
      const matchType = leaveTypeFilter === "all" || app.leaveType === leaveTypeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [applications, searchQuery, statusFilter, leaveTypeFilter]);

  const handleApprove = useCallback((id: string) => {
    const app = applications.find((a) => a.id === id);
    setLeaveApplications(applications.map((a) =>
      a.id === id ? { ...a, status: "Approved" as const, approvedBy: "HR/Admin", approvedOn: new Date().toISOString() } : a
    ));
    if (app) deductLeaveBalance(app.employeeId, app.leaveType, app.days);
    toast.success("Leave application approved");
  }, [applications]);

  const confirmReject = useCallback(() => {
    if (!selectedId || !rejectionReason.trim()) { toast.error("Please provide a rejection reason"); return; }
    const app = applications.find((a) => a.id === selectedId);
    setLeaveApplications(applications.map((a) =>
      a.id === selectedId ? { ...a, status: "Rejected" as const, rejectionReason } : a
    ));
    // Restore balance if it was previously approved
    if (app && app.status === "Approved") restoreLeaveBalance(app.employeeId, app.leaveType, app.days);
    toast.success("Leave application rejected");
    setRejectDialogOpen(false);
    setRejectionReason("");
    setSelectedId(null);
  }, [selectedId, rejectionReason, applications]);

  const handleExport = useCallback(() => {
    exportCsv(
      [
        ["Employee", "Leave Type", "Start", "End", "Days", "Status"],
        ...filtered.map((a) => [a.employeeName, a.leaveType, a.startDate, a.endDate, a.days, a.status]),
      ],
      "leave-applications"
    );
  }, [filtered]);

  return (
    <div className="space-y-4">
      <PageHeader title="Leave Applications" description="Review and manage leave requests">
        <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="h-4 w-4" />Export</Button>
        <Button onClick={() => navigate("/leave/applications/add")} className="gap-2"><Plus className="h-4 w-4" />Apply Leave</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total" value={stats.total} />
        <StatCard title="Pending" value={stats.pending} iconClass="bg-orange-50 text-orange-600" icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Approved" value={stats.approved} iconClass="bg-green-50 text-green-600" icon={<CheckCircle className="h-4 w-4" />} />
        <StatCard title="Rejected" value={stats.rejected} iconClass="bg-red-50 text-red-600" icon={<XCircle className="h-4 w-4" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {leaveTypes.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.employeeName}</TableCell>
                <TableCell>{app.leaveType}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <p>{formatDate(app.startDate)}</p>
                  <p>to {formatDate(app.endDate)}</p>
                </TableCell>
                <TableCell>{app.days}</TableCell>
                <TableCell className="max-w-[180px] truncate text-sm">{app.reason}</TableCell>
                <TableCell className="text-sm">{formatDate(app.appliedOn)}</TableCell>
                <TableCell><StatusBadge status={app.status} /></TableCell>
                <TableCell>
                  {app.status === "Pending" && can("approve_leave") && (
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 gap-1" onClick={() => handleApprove(app.id)}><CheckCircle className="h-3 w-3" />Approve</Button>
                      <Button size="sm" variant="destructive" className="h-7 gap-1" onClick={() => { setSelectedId(app.id); setRejectDialogOpen(true); }}><XCircle className="h-3 w-3" />Reject</Button>
                    </div>
                  )}
                  {app.status === "Approved" && app.approvedBy && <p className="text-xs text-muted-foreground">by {app.approvedBy}</p>}
                  {app.status === "Rejected" && app.rejectionReason && <p className="text-xs text-destructive truncate max-w-[120px]">{app.rejectionReason}</p>}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <EmptyState colSpan={8} message="No leave applications found" />}
          </TableBody>
        </Table>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(v) => { if (!v) { setRejectDialogOpen(false); setRejectionReason(""); setSelectedId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Application</DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Rejection Reason *</Label>
            <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectionReason(""); setSelectedId(null); }}>Cancel</Button>
              <Button variant="destructive" onClick={confirmReject}>Confirm Rejection</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
