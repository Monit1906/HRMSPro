import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, string> = {
  // Attendance
  Present: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "Half Day": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "On Leave": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Weekend: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Holiday: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  // Leave & expense
  Pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  // Employee
  Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  // Payroll
  Draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Processed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  // Performance
  Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Self Review": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Manager Review": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  // Recruitment
  Applied: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Screened: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Interview: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Offer: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Hired: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  // Job
  Open: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "On Hold": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const cls = STATUS_MAP[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", cls, className)}>
      {status}
    </span>
  );
}
