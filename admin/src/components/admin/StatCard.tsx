import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "info" | "warn";
  className?: string;
};

// Thẻ thống kê Bảng điều khiển/Trung tâm tác vụ
export function StatCard({ label, value, hint, icon: Icon, tone = "default", className }: StatCardProps) {
  return (
    <div className={cn("admin-panel admin-stat-card", `tone-${tone}`, className)}>
      <div className="admin-stat-icon">
        <Icon className="h-5 w-5" />
      </div>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      {hint ? <div className="admin-stat-hint">{hint}</div> : null}
    </div>
  );
}
