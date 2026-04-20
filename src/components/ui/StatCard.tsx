import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  iconClass?: string;
  onClick?: () => void;
  className?: string;
}

export default function StatCard({ title, value, sub, icon, iconClass, onClick, className }: StatCardProps) {
  return (
    <Card
      className={cn("transition-shadow", onClick && "cursor-pointer hover:shadow-md", className)}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-start gap-3">
        {icon && (
          <div className={cn("p-2 rounded-lg shrink-0", iconClass ?? "bg-primary/10 text-primary")}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-bold truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground truncate mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
