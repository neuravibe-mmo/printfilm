import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

// Khối nội dung có tiêu đề (thẻ nền trắng)
export function PageSection({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: PageSectionProps) {
  return (
    <section className={cn("admin-panel admin-section", className)}>
      <div className="admin-section-header">
        <div>
          <h3 className="admin-section-title">{title}</h3>
          {description ? <p className="admin-section-desc">{description}</p> : null}
        </div>
        {actions ? <div className="admin-section-actions">{actions}</div> : null}
      </div>
      <div className={cn("admin-section-body", bodyClassName)}>{children}</div>
    </section>
  );
}
