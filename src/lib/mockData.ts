// ─── Types ────────────────────────────────────────────────────────────────────
export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  branch: string;
  dateOfJoining: string;
  dateOfBirth: string;
  status: "Active" | "Inactive" | "On Leave";
  reportingManagers: string[];
  address: string;
  emergencyContact: string;
  bloodGroup?: string;
  gender: string;
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
  employees:       makeStore<Employee[]>("hrms_employees"),
  departments:     makeStore<Department[]>("hrms_departments"),
  designations:    makeStore<Designation[]>("hrms_designations"),
  branches:        makeStore<Branch[]>("hrms_branches"),
  leaveTypes:      makeStore<LeaveType[]>("hrms_leaveTypes"),
  leaves:          makeStore<LeaveApplication[]>("hrms_leaveApplications"),
  attendance:      makeStore<Attendance[]>("hrms_attendance"),
  holidays:        makeStore<Holiday[]>("hrms_holidays"),
  weekOff:         makeStore<WeekOffConfig[]>("hrms_weekOffConfigs"),
  payroll:         makeStore<PayrollEntry[]>("hrms_payroll"),
  salaryStructures: makeStore<SalaryStructure[]>("hrms_salaryStructures"),
  performance:     makeStore<PerformanceReview[]>("hrms_performanceReviews"),
  jobs:            makeStore<JobPosting[]>("hrms_jobPostings"),
  applicants:      makeStore<Applicant[]>("hrms_applicants"),
  expenses:        makeStore<ExpenseClaim[]>("hrms_expenseClaims"),
  shifts:          makeStore<Shift[]>("hrms_shifts"),
  shiftAssignments: makeStore<ShiftAssignment[]>("hrms_shiftAssignments"),
  indianPayroll:   makeStore<IndianPayrollEntry[]>("hrms_v3_indian"),
};

// Named exports that existing pages import
export const getEmployees = () => stores.employees.get();
export const setEmployees = (v: Employee[]) => stores.employees.set(v);
export const getDepartments = () => stores.departments.get();
export const setDepartments = (v: Department[]) => stores.departments.set(v);
export const getDesignations = () => stores.designations.get();
export const setDesignations = (v: Designation[]) => stores.designations.set(v);
export const getBranches = () => stores.branches.get();
export const setBranches = (v: Branch[]) => stores.branches.set(v);
export const getLeaveTypes = () => stores.leaveTypes.get();
export const setLeaveTypes = (v: LeaveType[]) => stores.leaveTypes.set(v);
export const getLeaveApplications = () => stores.leaves.get();
export const setLeaveApplications = (v: LeaveApplication[]) => stores.leaves.set(v);
export const getAttendance = () => stores.attendance.get();
export const setAttendance = (v: Attendance[]) => stores.attendance.set(v);
export const getHolidays = () => stores.holidays.get();
export const setHolidays = (v: Holiday[]) => stores.holidays.set(v);
export const getWeekOffConfigs = () => stores.weekOff.get();
export const setWeekOffConfigs = (v: WeekOffConfig[]) => stores.weekOff.set(v);
export const getPayroll = () => stores.payroll.get();
export const setPayroll = (v: PayrollEntry[]) => stores.payroll.set(v);
export const getSalaryStructures = () => stores.salaryStructures.get();
export const setSalaryStructures = (v: SalaryStructure[]) => stores.salaryStructures.set(v);
export const getPerformanceReviews = () => stores.performance.get();
export const setPerformanceReviews = (v: PerformanceReview[]) => stores.performance.set(v);
export const getJobPostings = () => stores.jobs.get();
export const setJobPostings = (v: JobPosting[]) => stores.jobs.set(v);
export const getApplicants = () => stores.applicants.get();
export const setApplicants = (v: Applicant[]) => stores.applicants.set(v);
export const getExpenseClaims = () => stores.expenses.get();
export const setExpenseClaims = (v: ExpenseClaim[]) => stores.expenses.set(v);
export const getShifts = () => stores.shifts.get();
export const setShifts = (v: Shift[]) => stores.shifts.set(v);
export const getShiftAssignments = () => stores.shiftAssignments.get();
export const setShiftAssignments = (v: ShiftAssignment[]) => stores.shiftAssignments.set(v);
export const getIndianPayroll = () => stores.indianPayroll.get();
export const setIndianPayroll = (v: IndianPayrollEntry[]) => stores.indianPayroll.set(v);

export function getPayrollMasters(): PayrollMasters {
  const raw = localStorage.getItem("hrms_payrollMasters");
  if (raw) return JSON.parse(raw);
  return { basicPercent: 50, hraPercent: 20, ti1Percent: 10, ti1Label: "Allowance 1", maFixed: 1250, pfRate: 12, pfCap: 1800, esicRate: 0.75, esicThreshold: 21000 };
}
export function setPayrollMasters(v: PayrollMasters) { localStorage.setItem("hrms_payrollMasters", JSON.stringify(v)); }

export function getCompanySettings(): CompanySettings {
  const raw = localStorage.getItem("hrms_companySettings");
  if (raw) return JSON.parse(raw);
  return {
    name: "TechCorp Solutions", legalName: "TechCorp Solutions Pvt. Ltd.",
    email: "hr@techcorp.com", phone: "+91 22 4000 5000", website: "https://techcorp.com",
    address: "Bandra Kurla Complex", city: "Mumbai", state: "Maharashtra",
    country: "India", currency: "INR", timezone: "Asia/Kolkata",
    fiscalYearStart: "April", logo: "", workingHours: 8, payDay: 1,
    probationPeriod: 90, noticeEmailLeave: true, noticeEmailAttendance: false, noticeEmailPayroll: true,
  };
}
export function setCompanySettings(v: CompanySettings) { localStorage.setItem("hrms_companySettings", JSON.stringify(v)); }

export function getCurrentUser() {
  const savedId = localStorage.getItem("hrms_current_user_id") || "3";
  const userMap: Record<string, { id: string; name: string; role: string; email: string }> = {
    "1": { id: "1", name: "Rahul Sharma",    role: "Employee",   email: "rahul@techcorp.com" },
    "2": { id: "2", name: "Priya Patel",     role: "Admin",      email: "priya@techcorp.com" },
    "3": { id: "3", name: "Emily Rodriguez", role: "HR Manager", email: "emily@techcorp.com" },
  };
  return userMap[savedId] ?? userMap["3"];
}

// ─── Seed data initialization ─────────────────────────────────────────────────
export function initializeMockData() {
  const needsReset =
    !localStorage.getItem("hrms_shifts") ||
    !localStorage.getItem("hrms_expenseClaims") ||
    !localStorage.getItem("hrms_payrollMasters") ||
    !localStorage.getItem("hrms_v3_indian");
  if (needsReset) localStorage.removeItem("hrms_initialized");
  if (localStorage.getItem("hrms_initialized")) return;

  const departments: Department[] = [
    { id: "1", name: "Engineering", code: "ENG", description: "Software Development", employeeCount: 45 },
    { id: "2", name: "Human Resources", code: "HR", description: "People Operations", employeeCount: 8 },
    { id: "3", name: "Finance", code: "FIN", description: "Finance & Accounting", employeeCount: 12 },
    { id: "4", name: "Sales", code: "SAL", description: "Sales & Marketing", employeeCount: 28 },
    { id: "5", name: "Operations", code: "OPS", description: "Business Operations", employeeCount: 15 },
  ];

  const designations: Designation[] = [
    { id: "1", title: "Software Engineer", code: "SE", level: "L2", department: "Engineering" },
    { id: "2", title: "Senior Software Engineer", code: "SSE", level: "L3", department: "Engineering" },
    { id: "3", title: "Engineering Manager", code: "EM", level: "L4", department: "Engineering" },
    { id: "4", title: "HR Manager", code: "HRM", level: "L4", department: "Human Resources" },
    { id: "5", title: "HR Executive", code: "HRE", level: "L2", department: "Human Resources" },
    { id: "6", title: "Finance Manager", code: "FM", level: "L4", department: "Finance" },
    { id: "7", title: "Accountant", code: "ACC", level: "L2", department: "Finance" },
    { id: "8", title: "Sales Manager", code: "SM", level: "L4", department: "Sales" },
    { id: "9", title: "Sales Executive", code: "SEX", level: "L2", department: "Sales" },
  ];

  const branches: Branch[] = [
    { id: "1", name: "Mumbai HQ", code: "MUM", address: "Bandra Kurla Complex, G Block", city: "Mumbai", state: "Maharashtra", country: "India", latitude: 19.0596, longitude: 72.8656, radius: 200, contactPerson: "Rajesh Kumar", phone: "+91 22 4000 5000" },
    { id: "2", name: "Delhi Office", code: "DEL", address: "Connaught Place, Block A", city: "New Delhi", state: "Delhi", country: "India", latitude: 28.6315, longitude: 77.2167, radius: 150, contactPerson: "Priya Sharma", phone: "+91 11 2341 5678" },
    { id: "3", name: "Bangalore Tech Park", code: "BLR", address: "Whitefield, ITPL Road", city: "Bangalore", state: "Karnataka", country: "India", latitude: 12.9716, longitude: 77.5946, radius: 300, contactPerson: "Amit Singh", phone: "+91 80 4567 8901" },
  ];

  const employees: Employee[] = [
    { id: "1", employeeId: "EMP001", firstName: "Rahul", lastName: "Sharma", email: "rahul.sharma@techcorp.com", phone: "+91 9876543210", department: "Engineering", designation: "Senior Software Engineer", branch: "Mumbai HQ", dateOfJoining: "2021-03-15", dateOfBirth: "1990-05-20", status: "Active", reportingManagers: ["3"], address: "Andheri West, Mumbai 400058", emergencyContact: "+91 9876543200", bloodGroup: "B+", gender: "Male", monthlySalary: 85000 },
    { id: "2", employeeId: "EMP002", firstName: "Priya", lastName: "Patel", email: "priya.patel@techcorp.com", phone: "+91 9876543211", department: "Human Resources", designation: "HR Manager", branch: "Mumbai HQ", dateOfJoining: "2020-01-10", dateOfBirth: "1988-11-15", status: "Active", reportingManagers: [], address: "Bandra East, Mumbai 400051", emergencyContact: "+91 9876543201", bloodGroup: "A+", gender: "Female", monthlySalary: 75000 },
    { id: "3", employeeId: "EMP003", firstName: "Emily", lastName: "Rodriguez", fatherName: "Carlos Rodriguez", email: "emily@techcorp.com", phone: "+91 9876543212", department: "Human Resources", designation: "HR Executive", branch: "Mumbai HQ", dateOfJoining: "2022-06-01", dateOfBirth: "1992-04-20", status: "Active", reportingManagers: ["2"], address: "Powai, Mumbai 400076", emergencyContact: "+91 9876543202", bloodGroup: "O+", gender: "Female", monthlySalary: 45000 },
    { id: "4", employeeId: "EMP004", firstName: "Arjun", lastName: "Mehta", fatherName: "Suresh Mehta", email: "arjun.mehta@techcorp.com", phone: "+91 9876543213", department: "Finance", designation: "Finance Manager", branch: "Delhi Office", dateOfJoining: "2019-08-20", dateOfBirth: "1985-08-10", status: "Active", reportingManagers: [], address: "Connaught Place, New Delhi 110001", emergencyContact: "+91 9876543203", bloodGroup: "AB+", gender: "Male", monthlySalary: 90000 },
    { id: "5", employeeId: "EMP005", firstName: "Kavya", lastName: "Nair", fatherName: "Mohan Nair", email: "kavya.nair@techcorp.com", phone: "+91 9876543214", department: "Sales", designation: "Sales Manager", branch: "Bangalore Tech Park", dateOfJoining: "2020-11-05", dateOfBirth: "1991-12-25", status: "On Leave", reportingManagers: [], address: "Whitefield, Bangalore 560066", emergencyContact: "+91 9876543204", bloodGroup: "B-", gender: "Female", monthlySalary: 70000 },
    { id: "6", employeeId: "EMP006", firstName: "Vikram", lastName: "Singh", fatherName: "Jagtar Singh", email: "vikram.singh@techcorp.com", phone: "+91 9876543215", department: "Engineering", designation: "Software Engineer", branch: "Bangalore Tech Park", dateOfJoining: "2023-01-15", dateOfBirth: "1998-03-08", status: "Active", reportingManagers: ["1"], address: "Koramangala, Bangalore 560034", emergencyContact: "+91 9876543205", bloodGroup: "A-", gender: "Male", monthlySalary: 55000 },
  ];

  const leaveTypes: LeaveType[] = [
    { id: "1", name: "Sick Leave", code: "SL", isUnlimited: false, requiresApproval: true, description: "Medical/health reasons", color: "#ef4444" },
    { id: "2", name: "Casual Leave", code: "CL", isUnlimited: false, requiresApproval: true, description: "Personal work or casual needs", color: "#3b82f6" },
    { id: "3", name: "Earned Leave", code: "EL", isUnlimited: false, requiresApproval: true, description: "Accrued paid leave", color: "#10b981" },
    { id: "4", name: "Maternity Leave", code: "ML", isUnlimited: false, requiresApproval: true, description: "Maternity / paternity leave", color: "#f59e0b" },
    { id: "5", name: "Loss of Pay", code: "LOP", isUnlimited: true, requiresApproval: true, description: "Unpaid leave — deducted from salary", color: "#6b7280" },
  ];

  const today = new Date();
  const leaveApplications: LeaveApplication[] = [
    { id: "1", employeeId: "1", employeeName: "Rahul Sharma", leaveType: "Sick Leave", startDate: "2026-04-10", endDate: "2026-04-11", days: 2, reason: "Fever and cold", status: "Approved", appliedOn: "2026-04-09", approvedBy: "Emily Rodriguez", approvedOn: "2026-04-09" },
    { id: "2", employeeId: "5", employeeName: "Kavya Nair", leaveType: "Earned Leave", startDate: "2026-04-15", endDate: "2026-04-22", days: 6, reason: "Family vacation", status: "Approved", appliedOn: "2026-04-05", approvedBy: "Emily Rodriguez", approvedOn: "2026-04-06" },
    { id: "3", employeeId: "6", employeeName: "Vikram Singh", leaveType: "Casual Leave", startDate: "2026-04-21", endDate: "2026-04-21", days: 1, reason: "Personal work", status: "Pending", appliedOn: "2026-04-18" },
    { id: "4", employeeId: "3", employeeName: "Emily Rodriguez", leaveType: "Sick Leave", startDate: "2026-04-19", endDate: "2026-04-19", days: 1, reason: "Doctor appointment", status: "Pending", appliedOn: "2026-04-18" },
  ];

  const attendance: Attendance[] = [
    { id: "1", employeeId: "1", employeeName: "Rahul Sharma", date: "2026-04-18", checkIn: "09:05", checkOut: "18:30", status: "Present", workHours: 9.4, branch: "Mumbai HQ" },
    { id: "2", employeeId: "2", employeeName: "Priya Patel", date: "2026-04-18", checkIn: "08:55", checkOut: "18:00", status: "Present", workHours: 9.1, branch: "Mumbai HQ" },
    { id: "3", employeeId: "4", employeeName: "Arjun Mehta", date: "2026-04-18", checkIn: "09:30", checkOut: "17:45", status: "Present", workHours: 8.3, branch: "Delhi Office" },
    { id: "4", employeeId: "6", employeeName: "Vikram Singh", date: "2026-04-18", checkIn: "10:15", checkOut: "19:00", status: "Present", workHours: 8.8, branch: "Bangalore Tech Park" },
    { id: "5", employeeId: "3", employeeName: "Emily Rodriguez", date: "2026-04-18", checkIn: "09:00", checkOut: "17:30", status: "Present", workHours: 8.5, branch: "Mumbai HQ" },
    { id: "6", employeeId: "5", employeeName: "Kavya Nair", date: "2026-04-18", status: "On Leave", branch: "Bangalore Tech Park" },
    { id: "7", employeeId: "1", employeeName: "Rahul Sharma", date: "2026-04-17", checkIn: "09:10", checkOut: "18:15", status: "Present", workHours: 9.1, branch: "Mumbai HQ" },
    { id: "8", employeeId: "2", employeeName: "Priya Patel", date: "2026-04-17", checkIn: "08:50", checkOut: "17:55", status: "Present", workHours: 9.1, branch: "Mumbai HQ" },
    { id: "9", employeeId: "4", employeeName: "Arjun Mehta", date: "2026-04-17", status: "Absent", branch: "Delhi Office" },
    { id: "10", employeeId: "3", employeeName: "Emily Rodriguez", date: "2026-04-17", checkIn: "09:05", checkOut: "18:00", status: "Present", workHours: 8.9, branch: "Mumbai HQ" },
  ];

  const holidays: Holiday[] = [
    { id: "1", name: "Maharashtra Day", date: "2026-05-01", type: "Public", description: "Maharashtra Day / Labour Day", applicableBranches: ["1", "2", "3"] },
    { id: "2", name: "Independence Day", date: "2026-08-15", type: "Public", description: "Indian Independence Day", applicableBranches: ["1", "2", "3"] },
    { id: "3", name: "Gandhi Jayanti", date: "2026-10-02", type: "Public", description: "Gandhi Jayanti", applicableBranches: ["1", "2", "3"] },
    { id: "4", name: "Diwali", date: "2026-10-20", type: "Public", description: "Diwali Festival", applicableBranches: ["1", "2", "3"] },
    { id: "5", name: "Christmas", date: "2026-12-25", type: "Public", description: "Christmas Day", applicableBranches: ["1", "2", "3"] },
    { id: "6", name: "Company Foundation Day", date: "2026-06-15", type: "Optional", description: "Company founding anniversary", applicableBranches: ["1"] },
  ];

  const payroll: PayrollEntry[] = [
    { id: "1", employeeId: "1", employeeName: "Rahul Sharma", month: "2026-03", basicSalary: 42500, hra: 17000, da: 8500, specialAllowance: 17000, allowances: 42500, deductions: 2000, providentFund: 5100, professionalTax: 200, tax: 3000, netSalary: 74700, status: "Paid", processedOn: "2026-04-01", paidOn: "2026-04-01", salaryStructure: "Standard" },
    { id: "2", employeeId: "2", employeeName: "Priya Patel", month: "2026-03", basicSalary: 37500, hra: 15000, da: 7500, specialAllowance: 15000, allowances: 37500, deductions: 1500, providentFund: 4500, professionalTax: 200, tax: 2500, netSalary: 65800, status: "Paid", processedOn: "2026-04-01", paidOn: "2026-04-01", salaryStructure: "Standard" },
    { id: "3", employeeId: "3", employeeName: "Emily Rodriguez", month: "2026-03", basicSalary: 22500, hra: 9000, da: 4500, specialAllowance: 9000, allowances: 22500, deductions: 1000, providentFund: 2700, professionalTax: 174, tax: 800, netSalary: 39826, status: "Paid", processedOn: "2026-04-01", paidOn: "2026-04-01" },
    { id: "4", employeeId: "4", employeeName: "Arjun Mehta", month: "2026-03", basicSalary: 45000, hra: 18000, da: 9000, specialAllowance: 18000, allowances: 45000, deductions: 2000, providentFund: 1800, professionalTax: 200, tax: 3500, netSalary: 80500, status: "Processed", processedOn: "2026-04-01", salaryStructure: "Senior" },
  ];

  const salaryStructures: SalaryStructure[] = [
    { id: "1", name: "Standard", basicPercent: 50, hraPercent: 20, daPercent: 10, specialAllowancePercent: 20, pfPercent: 12, professionalTax: 200 },
    { id: "2", name: "Senior", basicPercent: 45, hraPercent: 22, daPercent: 10, specialAllowancePercent: 23, pfPercent: 12, professionalTax: 200 },
    { id: "3", name: "Contract", basicPercent: 70, hraPercent: 10, daPercent: 5, specialAllowancePercent: 15, pfPercent: 0, professionalTax: 0 },
  ];

  const performanceReviews: PerformanceReview[] = [
    {
      id: "1", employeeId: "1", employeeName: "Rahul Sharma", reviewPeriod: "Q1 2026", reviewType: "Quarterly",
      goals: [
        { id: "g1", title: "Complete API migration", description: "Migrate REST to GraphQL", targetDate: "2026-03-31", weight: 40, selfScore: 4, managerScore: 4, status: "Completed" },
        { id: "g2", title: "Code review turnaround", description: "Review PRs within 24 hours", targetDate: "2026-03-31", weight: 30, selfScore: 5, managerScore: 4, status: "Completed" },
        { id: "g3", title: "Upskilling", description: "Complete AWS certification", targetDate: "2026-03-31", weight: 30, selfScore: 3, managerScore: 3, status: "In Progress" },
      ],
      selfRating: 4.0, managerRating: 3.7, overallRating: 3.85, status: "Completed",
      comments: "Delivered strong results this quarter.", managerComments: "Good performance, needs to complete upskilling.",
      reviewedBy: "Priya Patel", reviewedOn: "2026-04-05", createdOn: "2026-04-01",
    },
    {
      id: "2", employeeId: "3", employeeName: "Emily Rodriguez", reviewPeriod: "Q1 2026", reviewType: "Quarterly",
      goals: [
        { id: "g4", title: "Reduce time-to-hire", description: "Bring avg. time-to-hire below 30 days", targetDate: "2026-03-31", weight: 50, selfScore: 4, managerScore: 0, status: "Completed" },
        { id: "g5", title: "Onboarding satisfaction", description: "Score 4.5+ on onboarding survey", targetDate: "2026-03-31", weight: 50, selfScore: 5, managerScore: 0, status: "In Progress" },
      ],
      selfRating: 4.5, managerRating: 0, overallRating: 0, status: "Manager Review",
      comments: "Very productive quarter!", managerComments: "", createdOn: "2026-04-02",
    },
  ];

  const jobPostings: JobPosting[] = [
    { id: "1", title: "Senior React Developer", department: "Engineering", branch: "Mumbai HQ", type: "Full-Time", experience: "4-6 years", description: "Build scalable React apps", requirements: "React, TypeScript, Node.js", status: "Open", postedOn: "2026-04-01", closingDate: "2026-04-30", applicantCount: 12 },
    { id: "2", title: "Sales Executive", department: "Sales", branch: "Delhi Office", type: "Full-Time", experience: "1-3 years", description: "Drive B2B sales", requirements: "Communication, CRM", status: "Open", postedOn: "2026-04-05", closingDate: "2026-04-25", applicantCount: 8 },
    { id: "3", title: "HR Intern", department: "Human Resources", branch: "Bangalore Tech Park", type: "Internship", experience: "Fresher", description: "Support HR operations", requirements: "MBA HR (pursuing)", status: "Open", postedOn: "2026-04-10", closingDate: "2026-04-20", applicantCount: 25 },
  ];

  const applicants: Applicant[] = [
    { id: "1", jobId: "1", jobTitle: "Senior React Developer", name: "Ankit Verma", email: "ankit@email.com", phone: "+91 9876500001", experience: "5 years", currentCompany: "InfoSys", resume: "", stage: "Interview", appliedOn: "2026-04-03", notes: "Strong TypeScript skills", rating: 4, interviewDate: "2026-04-22" },
    { id: "2", jobId: "1", jobTitle: "Senior React Developer", name: "Sneha Rao", email: "sneha@email.com", phone: "+91 9876500002", experience: "4 years", currentCompany: "Wipro", resume: "", stage: "Screened", appliedOn: "2026-04-04", notes: "Good portfolio", rating: 3 },
    { id: "3", jobId: "2", jobTitle: "Sales Executive", name: "Rohan Das", email: "rohan@email.com", phone: "+91 9876500003", experience: "2 years", currentCompany: "TCS", resume: "", stage: "Applied", appliedOn: "2026-04-06", notes: "", rating: 0 },
  ];

  const expenseClaims: ExpenseClaim[] = [
    { id: "1", employeeId: "1", employeeName: "Rahul Sharma", category: "Travel", amount: 4500, currency: "INR", date: "2026-04-10", description: "Client visit — Mumbai to Pune", receiptRef: "RCP001", projectCode: "PROJ-01", status: "Approved", submittedOn: "2026-04-11", approvedBy: "Emily Rodriguez", approvedOn: "2026-04-12" },
    { id: "2", employeeId: "3", employeeName: "Emily Rodriguez", category: "Training", amount: 12000, currency: "INR", date: "2026-04-05", description: "HR Certification workshop", receiptRef: "RCP002", projectCode: "HR-TRAIN", status: "Pending", submittedOn: "2026-04-06" },
    { id: "3", employeeId: "4", employeeName: "Arjun Mehta", category: "Meals & Entertainment", amount: 3200, currency: "INR", date: "2026-04-08", description: "Client dinner — Delhi", receiptRef: "RCP003", projectCode: "PROJ-02", status: "Paid", submittedOn: "2026-04-09", approvedBy: "Emily Rodriguez", approvedOn: "2026-04-10", paidOn: "2026-04-15" },
  ];

  const shifts: Shift[] = [
    { id: "1", name: "General Shift", startTime: "09:00", endTime: "18:00", breakMinutes: 60, color: "#14b8a6", weekDays: [1, 2, 3, 4, 5] },
    { id: "2", name: "Morning Shift", startTime: "06:00", endTime: "14:00", breakMinutes: 30, color: "#3b82f6", weekDays: [1, 2, 3, 4, 5, 6] },
    { id: "3", name: "Night Shift", startTime: "22:00", endTime: "06:00", breakMinutes: 30, color: "#8b5cf6", weekDays: [1, 2, 3, 4, 5] },
  ];

  const shiftAssignments: ShiftAssignment[] = [
    { id: "1", employeeId: "1", shiftId: "1", startDate: "2026-01-01", endDate: "", type: "Permanent" },
    { id: "2", employeeId: "2", shiftId: "1", startDate: "2026-01-01", endDate: "", type: "Permanent" },
    { id: "3", employeeId: "3", shiftId: "1", startDate: "2026-01-01", endDate: "", type: "Permanent" },
    { id: "4", employeeId: "4", shiftId: "1", startDate: "2026-01-01", endDate: "", type: "Permanent" },
    { id: "5", employeeId: "5", shiftId: "2", startDate: "2026-01-01", endDate: "", type: "Permanent" },
    { id: "6", employeeId: "6", shiftId: "1", startDate: "2026-01-01", endDate: "", type: "Permanent" },
  ];

  const weekOffConfigs: WeekOffConfig[] = [
    { id: "1", weekOffDays: [0, 6], effectiveFrom: "2026-01-01" },
  ];

  const payrollMasters: PayrollMasters = {
    basicPercent: 50, hraPercent: 20, ti1Percent: 10, ti1Label: "Transport Allowance",
    maFixed: 1250, pfRate: 12, pfCap: 1800, esicRate: 0.75, esicThreshold: 21000,
  };

  // Indian payroll seed
  const indianPayroll: IndianPayrollEntry[] = employees.map((emp, i) => ({
    id: `2026-04-${emp.id}`, sno: i + 1, employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    fatherName: emp.fatherName || "—",
    designationName: emp.designation, branch: emp.branch, month: "2026-04",
    salary: emp.monthlySalary || 30000, mode: "Biometric" as const,
    alt: 1, td: 26, wd: 22, idle: 0, idleRate: 0, p: 22, l: 0, a: 0, off: 4,
    ded: 0, pd: 22, na: 0, idleAmount: 0, minusHrs: 0,
    basic: 0, ti1: 0, ma: 0, hra: 0, overTime: 0, totalAdd: 0,
    esic: 0, pf: 0, pt: 0, tds: 0, pf12: 0, pt200: 0, esic075: 0,
    bonusDed: 0, loan: 0, adv: 0, rOff: 0, totalDed: 0, netSalary: 0, status: "Draft" as const,
  }));

  // Persist all
  stores.departments.set(departments);
  stores.designations.set(designations);
  stores.branches.set(branches);
  stores.employees.set(employees);
  stores.leaveTypes.set(leaveTypes);
  stores.leaves.set(leaveApplications);
  stores.attendance.set(attendance);
  stores.holidays.set(holidays);
  stores.payroll.set(payroll);
  stores.salaryStructures.set(salaryStructures);
  stores.performance.set(performanceReviews);
  stores.jobs.set(jobPostings);
  stores.applicants.set(applicants);
  stores.expenses.set(expenseClaims);
  stores.shifts.set(shifts);
  stores.shiftAssignments.set(shiftAssignments);
  stores.weekOff.set(weekOffConfigs);
  stores.indianPayroll.set(indianPayroll);
  setPayrollMasters(payrollMasters);

  localStorage.setItem("hrms_initialized", "1");
}
