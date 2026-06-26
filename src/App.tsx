import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/layout/Layout";
import PageLoader from "@/components/ui/PageLoader";
import { useRole } from "@/contexts/RoleContext";

// Auth
const LoginPage          = lazy(() => import("@/pages/LoginPage"));

// App pages — lazy loaded
const Dashboard          = lazy(() => import("@/pages/Dashboard"));
const EmployeeList       = lazy(() => import("@/pages/employees/EmployeeList"));
const EmployeeAdd        = lazy(() => import("@/pages/employees/EmployeeAdd"));
const EmployeeDetail     = lazy(() => import("@/pages/employees/EmployeeDetail"));
const EmployeeOnboarding = lazy(() => import("@/pages/employees/EmployeeOnboarding"));
const DepartmentList     = lazy(() => import("@/pages/setup/DepartmentList"));
const DesignationList    = lazy(() => import("@/pages/setup/DesignationList"));
const BranchList         = lazy(() => import("@/pages/setup/BranchList"));
const LeaveTypeList      = lazy(() => import("@/pages/leave/LeaveTypeList"));
const LeaveApplicationList = lazy(() => import("@/pages/leave/LeaveApplicationList"));
const LeaveApplicationAdd  = lazy(() => import("@/pages/leave/LeaveApplicationAdd"));
const LeaveBalance       = lazy(() => import("@/pages/leave/LeaveBalance"));
const AttendanceList     = lazy(() => import("@/pages/attendance/AttendanceList"));
const AttendanceCheckIn  = lazy(() => import("@/pages/attendance/AttendanceCheckIn"));
const HolidayList        = lazy(() => import("@/pages/calendar/HolidayList"));
const WeekOffConfig      = lazy(() => import("@/pages/calendar/WeekOffConfig"));
const PayrollList        = lazy(() => import("@/pages/payroll/PayrollList"));
const PayrollProcess     = lazy(() => import("@/pages/payroll/PayrollProcess"));
const PayrollSheet       = lazy(() => import("@/pages/payroll/PayrollSheet"));
const PayrollMasters     = lazy(() => import("@/pages/payroll/PayrollMasters"));
const Reports            = lazy(() => import("@/pages/reports/Reports"));
const PayrollSummaryReport = lazy(() => import("@/pages/reports/PayrollSummaryReport"));
const EmployeePortal     = lazy(() => import("@/pages/portal/EmployeePortal"));
const PerformancePage    = lazy(() => import("@/pages/performance/PerformancePage"));
const RecruitmentPage    = lazy(() => import("@/pages/recruitment/RecruitmentPage"));
const CompanySettings    = lazy(() => import("@/pages/settings/CompanySettings"));
const UserManagement     = lazy(() => import("@/pages/settings/UserManagement"));
const ExpenseClaimsPage  = lazy(() => import("@/pages/expenses/ExpenseClaimsPage"));
const ShiftManagementPage = lazy(() => import("@/pages/shifts/ShiftManagementPage"));
const NotFound           = lazy(() => import("@/pages/NotFound"));

// Inner component — can safely call useRole() because RoleProvider wraps App
function AppContent() {
  const { isAuthenticated } = useRole();

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          {/* Employee */}
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/employees/add" element={<EmployeeAdd />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="/employees/:id/onboarding" element={<EmployeeOnboarding />} />

          {/* Setup */}
          <Route path="/setup/departments" element={<DepartmentList />} />
          <Route path="/setup/designations" element={<DesignationList />} />
          <Route path="/setup/branches" element={<BranchList />} />

          {/* Leave */}
          <Route path="/leave/types" element={<LeaveTypeList />} />
          <Route path="/leave/applications" element={<LeaveApplicationList />} />
          <Route path="/leave/applications/add" element={<LeaveApplicationAdd />} />
          <Route path="/leave/balance" element={<LeaveBalance />} />

          {/* Attendance */}
          <Route path="/attendance" element={<AttendanceList />} />
          <Route path="/attendance/checkin" element={<AttendanceCheckIn />} />

          {/* Calendar */}
          <Route path="/calendar/holidays" element={<HolidayList />} />
          <Route path="/calendar/weekoff" element={<WeekOffConfig />} />

          {/* Payroll */}
          <Route path="/payroll" element={<PayrollList />} />
          <Route path="/payroll/process" element={<PayrollProcess />} />
          <Route path="/payroll/sheet" element={<PayrollSheet />} />
          <Route path="/payroll/masters" element={<PayrollMasters />} />

          {/* Portal */}
          <Route path="/portal" element={<EmployeePortal />} />

          {/* Other modules */}
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/recruitment" element={<RecruitmentPage />} />
          <Route path="/expenses" element={<ExpenseClaimsPage />} />
          <Route path="/shifts" element={<ShiftManagementPage />} />
          <Route path="/settings" element={<CompanySettings />} />
          <Route path="/settings/users" element={<UserManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/payroll-summary" element={<PayrollSummaryReport />} />

          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
