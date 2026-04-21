import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Save, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getEmployees } from "@/lib/mockData";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: "Documents" | "IT" | "HR" | "Facilities";
  done: boolean;
  notes: string;
  completedAt?: string;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, "done" | "notes" | "completedAt">[] = [
  // Documents
  { id: "doc-offer",    label: "Offer Letter Signed",        description: "Collect signed copy of offer letter",                  category: "Documents" },
  { id: "doc-nda",      label: "NDA Signed",                 description: "Non-disclosure agreement signed and filed",             category: "Documents" },
  { id: "doc-id",       label: "ID Proof Submitted",         description: "Aadhaar / Passport / Driving Licence collected",        category: "Documents" },
  { id: "doc-address",  label: "Address Proof Submitted",    description: "Utility bill or bank statement collected",              category: "Documents" },
  { id: "doc-edu",      label: "Education Certificates",     description: "Degree / Diploma certificates verified and copied",     category: "Documents" },
  { id: "doc-prev",     label: "Previous Employment Docs",   description: "Relieving letter and experience certificate collected", category: "Documents" },
  { id: "doc-pf",       label: "PF Nomination Form",         description: "PF nomination form filled and submitted",              category: "Documents" },
  { id: "doc-bank",     label: "Bank Account Details",       description: "Bank account number and IFSC collected for payroll",   category: "Documents" },
  // IT
  { id: "it-email",     label: "Company Email Created",      description: "Official email account created and credentials shared", category: "IT" },
  { id: "it-laptop",    label: "Laptop / Device Assigned",   description: "Device allocated, serial number recorded",             category: "IT" },
  { id: "it-access",    label: "System Access Granted",      description: "VPN, HRMS, and tools access provisioned",              category: "IT" },
  { id: "it-badge",     label: "Access Card / Badge Issued", description: "Physical or digital access card issued",               category: "IT" },
  // HR
  { id: "hr-induction", label: "Induction Session Done",     description: "Company overview and culture session completed",       category: "HR" },
  { id: "hr-policy",    label: "HR Policy Acknowledged",     description: "Employee handbook read and signed",                    category: "HR" },
  { id: "hr-buddy",     label: "Buddy Assigned",             description: "Onboarding buddy / mentor assigned",                  category: "HR" },
  { id: "hr-meeting",   label: "Intro Meeting Scheduled",    description: "Meeting with manager and team scheduled",             category: "HR" },
  { id: "hr-training",  label: "Training Plan Created",      description: "First 30-day training roadmap shared",                category: "HR" },
  // Facilities
  { id: "fac-seat",     label: "Seating Assigned",           description: "Workstation or desk assigned",                         category: "Facilities" },
  { id: "fac-tour",     label: "Office Tour Done",           description: "Shown key areas: cafeteria, restroom, exits",          category: "Facilities" },
];

const STORAGE_KEY = (empId: string) => `hrms_onboarding_${empId}`;
const CATEGORY_COLORS: Record<string, string> = {
  Documents: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  HR: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Facilities: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

function loadChecklist(empId: string): ChecklistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(empId));
    if (raw) {
      const saved: Record<string, { done: boolean; notes: string; completedAt?: string }> = JSON.parse(raw);
      return DEFAULT_ITEMS.map((item) => ({
        ...item,
        done: saved[item.id]?.done ?? false,
        notes: saved[item.id]?.notes ?? "",
        completedAt: saved[item.id]?.completedAt,
      }));
    }
  } catch { /* ignore */ }
  return DEFAULT_ITEMS.map((item) => ({ ...item, done: false, notes: "" }));
}

function saveChecklist(empId: string, items: ChecklistItem[]) {
  const data: Record<string, { done: boolean; notes: string; completedAt?: string }> = {};
  items.forEach((item) => { data[item.id] = { done: item.done, notes: item.notes, completedAt: item.completedAt }; });
  localStorage.setItem(STORAGE_KEY(empId), JSON.stringify(data));
}

const CATEGORIES: ChecklistItem["category"][] = ["Documents", "IT", "HR", "Facilities"];

export default function EmployeeOnboarding() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const employees = getEmployees();
  const employee = employees.find((e) => e.id === id);

  const [items, setItems] = useState<ChecklistItem[]>(() => loadChecklist(id || ""));
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const toggle = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, done: !item.done, completedAt: !item.done ? new Date().toISOString() : undefined }
          : item
      )
    );
  }, []);

  const updateNotes = useCallback((itemId: string, notes: string) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, notes } : item)));
  }, []);

  const handleSave = useCallback(() => {
    saveChecklist(id || "", items);
    toast.success("Onboarding checklist saved");
  }, [id, items]);

  // Auto-save on change
  useEffect(() => {
    if (id) saveChecklist(id, items);
  }, [items, id]);

  if (!employee) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Employee not found</p>
        <Button className="mt-4" onClick={() => navigate("/employees")}>Back to Employees</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/employees/${id}`)} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Onboarding Checklist</h1>
          <p className="text-sm text-muted-foreground">{employee.firstName} {employee.lastName} · {employee.employeeId} · {employee.designation}</p>
        </div>
        <Button onClick={handleSave} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />Save
        </Button>
      </div>

      {/* Progress overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Overall Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{progress}%</span>
              {progress === 100 && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Complete!</Badge>}
            </div>
          </div>
          <Progress value={progress} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">{completedCount} of {totalCount} tasks completed</p>

          {/* Category summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {CATEGORIES.map((cat) => {
              const catItems = items.filter((i) => i.category === cat);
              const catDone = catItems.filter((i) => i.done).length;
              return (
                <div key={cat} className="text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat]}`}>{cat}</span>
                  <p className="text-xs text-muted-foreground mt-1">{catDone}/{catItems.length}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Checklist by category */}
      {CATEGORIES.map((category) => {
        const catItems = items.filter((i) => i.category === category);
        const catDone = catItems.filter((i) => i.done).length;

        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${CATEGORY_COLORS[category]}`}>{category}</span>
                </CardTitle>
                <span className="text-xs text-muted-foreground">{catDone}/{catItems.length} done</span>
              </div>
              <Progress value={(catDone / catItems.length) * 100} className="h-1 mt-1" />
            </CardHeader>
            <CardContent className="pt-1 space-y-1">
              {catItems.map((item) => (
                <div key={item.id} className={`rounded-lg border transition-colors ${item.done ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900" : "border-border"}`}>
                  <div
                    className="flex items-start gap-3 p-3 cursor-pointer select-none"
                    onClick={() => toggle(item.id)}
                  >
                    <div className="shrink-0 mt-0.5">
                      {item.done
                        ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        : <Circle className="h-5 w-5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      {item.completedAt && item.done && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                          Completed {new Date(item.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedNotes(expandedNotes === item.id ? null : item.id);
                      }}
                    >
                      {expandedNotes === item.id ? "Hide notes" : "Notes"}
                    </Button>
                  </div>
                  {expandedNotes === item.id && (
                    <div className="px-3 pb-3 pt-0" onClick={(e) => e.stopPropagation()}>
                      <Label className="text-xs text-muted-foreground">Notes / Remarks</Label>
                      <Textarea
                        className="mt-1 text-sm resize-none"
                        rows={2}
                        placeholder="Add notes here…"
                        value={item.notes}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
