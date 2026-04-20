import { useState, useMemo, useCallback } from "react";
import { Plus, Search, Star, Eye, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getJobPostings, setJobPostings, getApplicants, setApplicants, getDepartments, getBranches, type JobPosting, type Applicant } from "@/lib/mockData";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "sonner";

const STAGES: Applicant["stage"][] = ["Applied","Screened","Interview","Offer","Hired","Rejected"];
const EMPTY_JOB = { title: "", department: "", branch: "", type: "Full-Time" as JobPosting["type"], experience: "", description: "", requirements: "", closingDate: "", status: "Open" as JobPosting["status"] };
const EMPTY_APP = { jobId: "", name: "", email: "", phone: "", experience: "", currentCompany: "", resume: "", stage: "Applied" as Applicant["stage"], notes: "", rating: 0, interviewDate: "" };

export default function RecruitmentPage() {
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [viewAppId, setViewAppId] = useState<string | null>(null);
  const [editJobId, setEditJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("all");
  const [jobForm, setJobForm] = useState(EMPTY_JOB);
  const [appForm, setAppForm] = useState(EMPTY_APP);

  const jobs = getJobPostings();
  const applicants = getApplicants();
  const departments = getDepartments();
  const branches = getBranches();

  const stats = useMemo(() => ({
    open: jobs.filter((j) => j.status === "Open").length,
    total: applicants.length,
    interview: applicants.filter((a) => a.stage === "Interview").length,
    hired: applicants.filter((a) => a.stage === "Hired").length,
  }), [jobs, applicants]);

  const filteredApplicants = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return applicants.filter((a) => {
      const matchSearch = a.name.toLowerCase().includes(q) || a.jobTitle.toLowerCase().includes(q);
      const matchJob = selectedJobId === "all" || a.jobId === selectedJobId;
      return matchSearch && matchJob;
    });
  }, [applicants, searchQuery, selectedJobId]);

  const viewApp = applicants.find((a) => a.id === viewAppId);

  const submitJob = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editJobId) {
      setJobPostings(jobs.map((j) => j.id === editJobId ? { ...j, ...jobForm } : j));
      toast.success("Job posting updated");
    } else {
      setJobPostings([...jobs, { id: String(Date.now()), ...jobForm, postedOn: new Date().toISOString().split("T")[0], applicantCount: 0 }]);
      toast.success("Job posted");
    }
    setJobDialogOpen(false);
  }, [editJobId, jobForm, jobs]);

  const submitApp = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const job = jobs.find((j) => j.id === appForm.jobId);
    setApplicants([...applicants, { id: String(Date.now()), ...appForm, jobTitle: job?.title || "", appliedOn: new Date().toISOString().split("T")[0] }]);
    setJobPostings(jobs.map((j) => j.id === appForm.jobId ? { ...j, applicantCount: j.applicantCount + 1 } : j));
    toast.success("Applicant added");
    setAppDialogOpen(false);
    setAppForm(EMPTY_APP);
  }, [appForm, applicants, jobs]);

  const moveStage = useCallback((id: string, stage: Applicant["stage"]) => {
    setApplicants(applicants.map((a) => a.id === id ? { ...a, stage } : a));
    toast.success(`Moved to ${stage}`);
  }, [applicants]);

  return (
    <div className="space-y-4">
      <PageHeader title="Recruitment Pipeline" description="Manage job postings and track candidates">
        <Button variant="outline" onClick={() => { setAppForm(EMPTY_APP); setAppDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Applicant</Button>
        <Button onClick={() => { setJobForm(EMPTY_JOB); setEditJobId(null); setJobDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Post Job</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Open Positions" value={stats.open} />
        <StatCard title="Total Applicants" value={stats.total} />
        <StatCard title="In Interview" value={stats.interview} />
        <StatCard title="Hired" value={stats.hired} />
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList><TabsTrigger value="pipeline">Candidate Pipeline</TabsTrigger><TabsTrigger value="jobs">Job Postings</TabsTrigger></TabsList>

        <TabsContent value="pipeline" className="mt-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Jobs" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Jobs</SelectItem>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {/* Stage counts */}
          <div className="flex gap-2 flex-wrap">
            {STAGES.map((stage) => (
              <div key={stage} className="text-center px-3 py-1.5 bg-muted rounded-lg text-xs">
                <p className="font-bold">{filteredApplicants.filter((a) => a.stage === stage).length}</p>
                <p className="text-muted-foreground">{stage}</p>
              </div>
            ))}
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead>Position</TableHead><TableHead>Experience</TableHead><TableHead>Applied</TableHead><TableHead>Rating</TableHead><TableHead>Stage</TableHead><TableHead>Move To</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {filteredApplicants.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell><p className="font-medium">{app.name}</p><p className="text-xs text-muted-foreground">{app.currentCompany}</p></TableCell>
                    <TableCell>{app.jobTitle}</TableCell>
                    <TableCell>{app.experience}</TableCell>
                    <TableCell>{new Date(app.appliedOn).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((i) => <Star key={i} className={`h-3 w-3 cursor-pointer ${i <= app.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} onClick={() => setApplicants(applicants.map((a) => a.id === app.id ? { ...a, rating: i } : a))} />)}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={app.stage} /></TableCell>
                    <TableCell>
                      {app.stage !== "Hired" && app.stage !== "Rejected" && (
                        <Select onValueChange={(v) => moveStage(app.id, v as Applicant["stage"])}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Move to" /></SelectTrigger>
                          <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewAppId(app.id)}><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
                {filteredApplicants.length === 0 && <EmptyState colSpan={8} message="No candidates found" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Job Title</TableHead><TableHead>Department</TableHead><TableHead>Branch</TableHead><TableHead>Type</TableHead><TableHead>Applicants</TableHead><TableHead>Closing</TableHead><TableHead>Status</TableHead><TableHead className="w-20" /></TableRow></TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell><p className="font-medium">{j.title}</p><p className="text-xs text-muted-foreground">Posted {new Date(j.postedOn).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></TableCell>
                    <TableCell>{j.department}</TableCell>
                    <TableCell>{j.branch}</TableCell>
                    <TableCell>{j.type}</TableCell>
                    <TableCell>{applicants.filter((a) => a.jobId === j.id).length}</TableCell>
                    <TableCell>{new Date(j.closingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                    <TableCell><StatusBadge status={j.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setJobForm({ title: j.title, department: j.department, branch: j.branch, type: j.type, experience: j.experience, description: j.description, requirements: j.requirements, closingDate: j.closingDate, status: j.status }); setEditJobId(j.id); setJobDialogOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setJobPostings(jobs.filter((x) => x.id !== j.id)); toast.success("Job deleted"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && <EmptyState colSpan={8} message="No job postings yet" />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Applicant */}
      <Dialog open={!!viewAppId} onOpenChange={(v) => { if (!v) setViewAppId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Candidate Profile</DialogTitle><DialogDescription>{viewApp?.jobTitle}</DialogDescription></DialogHeader>
          {viewApp && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <div><p className="font-semibold text-base">{viewApp.name}</p><p className="text-muted-foreground">{viewApp.email} · {viewApp.phone}</p></div>
                <StatusBadge status={viewApp.stage} />
              </div>
              {[["Experience", viewApp.experience],["Current Company", viewApp.currentCompany],["Applied On", new Date(viewApp.appliedOn).toLocaleDateString()]].map(([l, v]) => (
                <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span>{v}</span></div>
              ))}
              {viewApp.notes && <p className="text-xs bg-muted rounded p-2">{viewApp.notes}</p>}
              <div>
                <p className="text-muted-foreground mb-2">Move to Stage</p>
                <div className="flex flex-wrap gap-1">{STAGES.map((s) => <Button key={s} size="sm" variant={s === viewApp.stage ? "default" : "outline"} className="h-7 text-xs" onClick={() => { moveStage(viewApp.id, s); setViewAppId(null); }}>{s}</Button>)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Post Job */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editJobId ? "Edit" : "Post New"} Job</DialogTitle></DialogHeader>
          <form onSubmit={submitJob} className="space-y-3">
            <div><Label>Job Title *</Label><Input className="mt-1" required value={jobForm.title} onChange={(e) => setJobForm((p) => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Department *</Label><Select value={jobForm.department} onValueChange={(v) => setJobForm((p) => ({ ...p, department: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Branch *</Label><Select value={jobForm.branch} onValueChange={(v) => setJobForm((p) => ({ ...p, branch: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={jobForm.type} onValueChange={(v) => setJobForm((p) => ({ ...p, type: v as JobPosting["type"] }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Full-Time">Full-Time</SelectItem><SelectItem value="Part-Time">Part-Time</SelectItem><SelectItem value="Contract">Contract</SelectItem><SelectItem value="Internship">Internship</SelectItem></SelectContent></Select></div>
              <div><Label>Experience</Label><Input className="mt-1" placeholder="e.g. 3-5 years" value={jobForm.experience} onChange={(e) => setJobForm((p) => ({ ...p, experience: e.target.value }))} /></div>
            </div>
            <div><Label>Closing Date *</Label><Input type="date" className="mt-1" required value={jobForm.closingDate} onChange={(e) => setJobForm((p) => ({ ...p, closingDate: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea className="mt-1" rows={2} value={jobForm.description} onChange={(e) => setJobForm((p) => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setJobDialogOpen(false)}>Cancel</Button><Button type="submit">{editJobId ? "Update" : "Post"} Job</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Applicant */}
      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Applicant</DialogTitle></DialogHeader>
          <form onSubmit={submitApp} className="space-y-3">
            <div><Label>Job *</Label><Select value={appForm.jobId} onValueChange={(v) => setAppForm((p) => ({ ...p, jobId: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select job" /></SelectTrigger><SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input className="mt-1" required value={appForm.name} onChange={(e) => setAppForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Email *</Label><Input type="email" className="mt-1" required value={appForm.email} onChange={(e) => setAppForm((p) => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input className="mt-1" value={appForm.phone} onChange={(e) => setAppForm((p) => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Experience</Label><Input className="mt-1" value={appForm.experience} onChange={(e) => setAppForm((p) => ({ ...p, experience: e.target.value }))} /></div>
            </div>
            <div><Label>Current Company</Label><Input className="mt-1" value={appForm.currentCompany} onChange={(e) => setAppForm((p) => ({ ...p, currentCompany: e.target.value }))} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAppDialogOpen(false)}>Cancel</Button><Button type="submit">Add Applicant</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
