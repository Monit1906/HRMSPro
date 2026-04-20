import { ReactNode } from "react";
import { TableRow, TableCell } from "@/components/ui/table";

interface EmptyStateProps {
  /** Number of columns in the table (for colSpan). Pass 0 to render as a plain div. */
  colSpan?: number;
  message?: string;
  action?: ReactNode;
}

export default function EmptyState({ colSpan, message = "No records found", action }: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
      <p className="text-sm">{message}</p>
      {action}
    </div>
  );

  if (colSpan) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="p-0">
          {content}
        </TableCell>
      </TableRow>
    );
  }
  return content;
}
