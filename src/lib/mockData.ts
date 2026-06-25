// ─── Types ────────────────────────────────────────────────────────────────────
export interface Employee {
  id: string; employeeId: string; firstName: string; lastName: string;
  fatherName?: string; email: string; phone: string; department: string;
  designation: string; branch: string; dateOfJoining: string; dateOfBirth: string;
  status: "Active" | "Inactive" | "On Leave"; reportingManagers: string[];
  address: string; emergencyContact: string; bloodGroup?: string; gender: string;
  monthlySalary?: number;
}
export interface Department { id: string; name: string; code: string; description: string; headOfDepartment?: string; employeeCount: number; }
export interface Designation { id: string; title: string; code: string; level: string; department: string; }
export interface Branch { id: string; name: string; code: string; address: string; city: string; state: string; country: string; latitude: number; longitude: number; radius: number; contactPerson: string; phone: string; }
export interface LeaveType { id: string; name: string; code: string; isUnlimited: boolean; requiresApproval: boolean; description: string; color: string; }
export interface LeaveApplication { id: string; employeeId: string; employeeName: string; leaveType: string; startDate: string; endDate: string; days: number; reason: string; status: "Pending" | "Approved" | "Rejected"; appliedOn: string; approvedBy?: string; approvedOn?: string; rejectionReason?: string; }
export interface Attendance { id: string; employeeId: string; employeeName: string; date: string; checkIn?: string; checkOut?: string; checkInLocation?: { lat: number; lng: number; address: string }; checkOutLocation?: { lat: number; lng: number; address: string }; status: "Present" | "Absent" | "Half Day" | "On Leave" | "Weekend" | "Holiday"; workHours?: number; branch: string; }
export interface Holiday { id: string; name: string; date: string; type: "Public" | "Optional" | "Restricted"; description: string; applicableBranches: string[]; }
export interface WeekOffConfig { id: string; employeeId?: string; department?: string; branch?: string; weekOffDays: number[]; effectiveFrom: string; }
export interface PayrollEntry { id: string; employeeId: string; employeeName: string; month: string; basicSalary: number; hra: number; da: number; specialAllowance: number; allowances: number; deductions: number; providentFund: number; professionalTax: number; tax: number; netSalary: number; status: "Draft" | "Processed" | "Paid"; processedOn?: string; paidOn?: string; salaryStructure?: string; }
export interface SalaryStructure { id: string; name: string; basicPercent: number; hraPercent: number; daPercent: number; specialAllowancePercent: number; pfPercent: number; professionalTax: number; }
export interface PerformanceReview { id: string; employeeId: string; employeeName: string; reviewPeriod: string; reviewType: "Quarterly" | "Annual" | "Probation"; goals: PerformanceGoal[]; selfRating: number; managerRating: number; overallRating: number; status: "Draft" | "Self Review" | "Manager Review" | "Completed"; comments: string; managerComments: string; reviewedBy?: string; reviewedOn?: string; createdOn: string; }
export interface PerformanceGoal { id: string; title: string; description: string; targetDate: string; weight: number; selfScore: number; managerScore: number; status: "Not Started" | "In Progress" | "Completed" | "Overdue"; }
export interface JobPosting { id: string; title: string; department: string; branch: string; type: "Full-Time" | "Part-Time" | "Contract" | "Internship"; experience: string; description: string; requirements: string; status: "Open" | "Closed" | "On Hold"; postedOn: string; closingDate: string; applicantCount: number; }
export interface Applicant { id: string; jobId: string; jobTitle: string; name: string; email: string; phone: string; experience: string; currentCompany: string; resume: string; stage: "Applied" | "Screened" | "Interview" | "Offer" | "Hired" | "Rejected"; appliedOn: string; notes: string; rating: number; interviewDate?: string; }
export interface ExpenseClaim { id: string; employeeId: string; employeeName: string; category: string; amount: number; currency: string; date: string; description: string; receiptRef: string; projectCode: string; status: "Pending" | "Approved" | "Rejected" | "Paid"; submittedOn: string; approvedBy?: string; approvedOn?: string; paidOn?: string; rejectionReason?: string; }
export interface Shift { id: string; name: string; startTime: string; endTime: string; breakMinutes: number; color: string; weekDays: number[]; }
export interface ShiftAssignment { id: string; employeeId: string; shiftId: string; startDate: string; endDate: string; type: "Permanent" | "Temporary"; }

export interface IndianPayrollEntry {
  id: string; sno: number; employeeId: string; employeeName: string; fatherName: string;
  designationName: string; branch: string; month: string; salary: number;
  mode: "Biometric" | "Manual" | "App"; alt: number; td: number; wd: number;
  idle: number; idleRate: number; p: number; l: number; a: number; off: number;
  ded: number; pd: number; na: number; idleAmount: number; minusHrs: number;
  basic: number; ti1: number; ma: number; hra: number; overTime: number; totalAdd: number;
  esic: number; pf: number; pt: number; tds: number; pf12: number; pt200: number;
  esic075: number; bonusDed: number; loan: number; adv: number; rOff: number;
  totalDed: number; netSalary: number; status: "Draft" | "Processed" | "Paid";
}

export interface PayrollMasters {
  basicPercent: number; hraPercent: number; ti1Percent: number; ti1Label: string;
  maFixed: number; pfRate: number; pfCap: number; esicRate: number; esicThreshold: number;
}

export interface CompanySettings {
  name: string; legalName: string; email: string; phone: string; website: string;
  address: string; city: string; state: string; country: string; currency: string;
  timezone: string; fiscalYearStart: string; logo: string; workingHours: number;
  payDay: number; probationPeriod: number; noticeEmailLeave: boolean;
  noticeEmailAttendance: boolean; noticeEmailPayroll: boolean;
}

// ─── Generic localStorage accessor factory ────────────────────────────────────
function makeStore<T>(key: string) {
  return {
    get(): T {
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : ([] as unknown as T);
      } catch {
        return [] as unknown as T;
      }
    },
    set(value: T): void {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };
}

const stores = {
  employees:        makeStore<Employee[]>("hrms_employees"),
  departments:      makeStore<Department[]>("hrms_departments"),
  designations:     makeStore<Designation[]>("hrms_designations"),
  branches:         makeStore<Branch[]>("hrms_branches"),
  leaveTypes:       makeStore<LeaveType[]>("hrms_leaveTypes"),
  leaves:           makeStore<LeaveApplication[]>("hrms_leaveApplications"),
  attendance:       makeStore<Attendance[]>("hrms_attendance"),
  holidays:         makeStore<Holiday[]>("hrms_holidays"),
  weekOff:          makeStore<WeekOffConfig[]>("hrms_weekOffConfigs"),
  payroll:          makeStore<PayrollEntry[]>("hrms_payroll"),
  salaryStructures: makeStore<SalaryStructure[]>("hrms_salaryStructures"),
  performance:      makeStore<PerformanceReview[]>("hrms_performanceReviews"),
  jobs:             makeStore<JobPosting[]>("hrms_jobPostings"),
  applicants:       makeStore<Applicant[]>("hrms_applicants"),
  expenses:         makeStore<ExpenseClaim[]>("hrms_expenseClaims"),
  shifts:           makeStore<Shift[]>("hrms_shifts"),
  shiftAssignments: makeStore<ShiftAssignment[]>("hrms_shiftAssignments"),
  indianPayroll:    makeStore<IndianPayrollEntry[]>("hrms_v3_indian"),
};

// Named exports
export const getEmployees          = () => stores.employees.get();
export const setEmployees          = (v: Employee[]) => stores.employees.set(v);
export const getDepartments        = () => stores.departments.get();
export const setDepartments        = (v: Department[]) => stores.departments.set(v);
export const getDesignations       = () => stores.designations.get();
export const setDesignations       = (v: Designation[]) => stores.designations.set(v);
export const getBranches           = () => stores.branches.get();
export const setBranches           = (v: Branch[]) => stores.branches.set(v);
export const getLeaveTypes         = () => stores.leaveTypes.get();
export const setLeaveTypes         = (v: LeaveType[]) => stores.leaveTypes.set(v);
export const getLeaveApplications  = () => stores.leaves.get();
export const setLeaveApplications  = (v: LeaveApplication[]) => stores.leaves.set(v);
export const getAttendance         = () => stores.attendance.get();
export const setAttendance         = (v: Attendance[]) => stores.attendance.set(v);
export const getHolidays           = () => stores.holidays.get();
export const setHolidays           = (v: Holiday[]) => stores.holidays.set(v);
export const getWeekOffConfigs     = () => stores.weekOff.get();
export const setWeekOffConfigs     = (v: WeekOffConfig[]) => stores.weekOff.set(v);
export const getPayroll            = () => stores.payroll.get();
export const setPayroll            = (v: PayrollEntry[]) => stores.payroll.set(v);
export const getSalaryStructures   = () => stores.salaryStructures.get();
export const setSalaryStructures   = (v: SalaryStructure[]) => stores.salaryStructures.set(v);
export const getPerformanceReviews = () => stores.performance.get();
export const setPerformanceReviews = (v: PerformanceReview[]) => stores.performance.set(v);
export const getJobPostings        = () => stores.jobs.get();
export const setJobPostings        = (v: JobPosting[]) => stores.jobs.set(v);
export const getApplicants         = () => stores.applicants.get();
export const setApplicants         = (v: Applicant[]) => stores.applicants.set(v);
export const getExpenseClaims      = () => stores.expenses.get();
export const setExpenseClaims      = (v: ExpenseClaim[]) => stores.expenses.set(v);
export const getShifts             = () => stores.shifts.get();
export const setShifts             = (v: Shift[]) => stores.shifts.set(v);
export const getShiftAssignments   = () => stores.shiftAssignments.get();
export const setShiftAssignments   = (v: ShiftAssignment[]) => stores.shiftAssignments.set(v);
export const getIndianPayroll      = () => stores.indianPayroll.get();
export const setIndianPayroll      = (v: IndianPayrollEntry[]) => stores.indianPayroll.set(v);

export function getPayrollMasters(): PayrollMasters {
  const raw = localStorage.getItem("hrms_payrollMasters");
  if (raw) return JSON.parse(raw);
  return { basicPercent: 50, hraPercent: 20, ti1Percent: 10, ti1Label: "Transport Allowance", maFixed: 1250, pfRate: 12, pfCap: 1800, esicRate: 0.75, esicThreshold: 21000 };
}
export function setPayrollMasters(v: PayrollMasters) { localStorage.setItem("hrms_payrollMasters", JSON.stringify(v)); }

export function getCompanySettings(): CompanySettings {
  const raw = localStorage.getItem("hrms_companySettings");
  if (raw) return JSON.parse(raw);
  return {
    name: "", legalName: "", email: "", phone: "", website: "",
    address: "", city: "", state: "", country: "India", currency: "INR",
    timezone: "Asia/Kolkata", fiscalYearStart: "April", logo: "",
    workingHours: 8, payDay: 1, probationPeriod: 90,
    noticeEmailLeave: true, noticeEmailAttendance: false, noticeEmailPayroll: true,
  };
}
export function setCompanySettings(v: CompanySettings) { localStorage.setItem("hrms_companySettings", JSON.stringify(v)); }

export function getCurrentUser() {
  const savedId = localStorage.getItem("hrms_current_user_id") || "2";
  const userMap: Record<string, { id: string; name: string; role: string; email: string }> = {
    "1": { id: "1", name: "Rahul Sharma",    role: "Employee",   email: "rahul@techcorp.com" },
    "2": { id: "2", name: "Priya Patel",     role: "Admin",      email: "priya@techcorp.com" },
    "3": { id: "3", name: "Emily Rodriguez", role: "HR Manager", email: "emily@techcorp.com" },
  };
  return userMap[savedId] ?? userMap["2"];
}

// ─── Reset all app data (keep passwords + session) ───────────────────────────
export function resetAllData(): void {
  const keep = new Set(["hrms_passwords", "hrms_current_user_id", "hrms_session", "hrms_theme"]);
  Object.keys(localStorage)
    .filter((k) => k.startsWith("hrms_") && !keep.has(k))
    .forEach((k) => localStorage.removeItem(k));
}

// ─── Fresh initialisation — zero data, no seed ───────────────────────────────
const INIT_KEY = "hrms_v4_initialized";

export function initializeMockData() {
  if (localStorage.getItem(INIT_KEY)) return;

  // Clear any legacy seed data from older versions
  const keep = new Set(["hrms_passwords", "hrms_current_user_id", "hrms_session", "hrms_theme"]);
  Object.keys(localStorage)
    .filter((k) => k.startsWith("hrms_") && !keep.has(k))
    .forEach((k) => localStorage.removeItem(k));

  // Initialise all stores as empty
  stores.employees.set([]);
  stores.departments.set([]);
  stores.designations.set([]);
  stores.branches.set([]);
  stores.leaveTypes.set([]);
  stores.leaves.set([]);
  stores.attendance.set([]);
  stores.holidays.set([]);
  stores.weekOff.set([]);
  stores.payroll.set([]);
  stores.salaryStructures.set([]);
  stores.performance.set([]);
  stores.jobs.set([]);
  stores.applicants.set([]);
  stores.expenses.set([]);
  stores.shifts.set([]);
  stores.shiftAssignments.set([]);
  stores.indianPayroll.set([]);

  setPayrollMasters({ basicPercent: 50, hraPercent: 20, ti1Percent: 10, ti1Label: "Transport Allowance", maFixed: 1250, pfRate: 12, pfCap: 1800, esicRate: 0.75, esicThreshold: 21000 });

  localStorage.setItem(INIT_KEY, "1");
}
