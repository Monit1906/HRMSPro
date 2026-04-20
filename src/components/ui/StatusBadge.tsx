import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, string> = {
  // Generic
  Active:   "bg-green-100 text-green-700 border-green-200",
  Inactive: "bg-gray-100 text-gray-600 border-gray-200",
  "On Leave": "bg-blue-100 text-blue-700 border-blue-200",

  // Leave / expense / payroll
  Pending:  "bg-orange-100 text-orange-700 border-orange-200",
  Approved: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Paid:     "bg-blue-100 text-blue-700 border-blue-200",

  // Payroll
  Draft:     "bg-gray-100 text-gray-600 border-gray-200",
  Processed: "bg-blue-100 text-blue-700 border-blue-200",

  // Attendance
  Present:  "bg-green-100 text-green-700 border-green-200",
  Absent:   "bg-red-100 text-red-700 border-red-200",
  "Half Day": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Weekend:  "bg-gray-100 text-gray-600 border-gray-200",
  Holiday:  "bg-purple-100 text-purple-700 border-purple-200",

  // Performance
  Completed: "bg-green-100 text-green-700 border-green-200",
  "Self Review": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Manager Review": "bg-blue-100 text-blue-700 border-blue-200",

  // Recruitment
  Applied:  "bg-gray-100 text-gray-700 border-gray-200",
  Screened: "bg-blue-100 text-blue-700 border-blue-200",
  Interview: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Offer:    "bg-purple-100 text-purple-700 border-purple-200",
  Hired:    "bg-green-100 text-green-700 border-green-200",

  // Jobs
  Open:    "bg-green-100 text-green-700 border-green-200",
  Closed:  "bg-gray-100 text-gray-600 border-gray-200",
  "On Hold": "bg-yellow-100 text-yellow-700 border-yellow-200",
};

interface Props {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: Props) {
  return (
    <Badge className={cn("border text-xs font-medium", STATUS_MAP[status] ?? "bg-gray-100 text-gray-600", className)}>
      {status}
    </Badge>
  );
}
