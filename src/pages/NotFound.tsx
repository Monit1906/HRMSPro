import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <p className="text-7xl font-bold text-muted-foreground/30">404</p>
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <Button onClick={() => navigate("/")} className="gap-2 mt-2"><Home className="h-4 w-4" />Go to Dashboard</Button>
    </div>
  );
}
