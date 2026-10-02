import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminFilterBarProps = {
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

/** Thanh lọc danh sách bên quản lý: hàng đơn nhỏ gọn và nằm ngang, tự động ngắt dòng khi không đủ chỗ */
export function AdminFilterBar({ children, trailing, className }: AdminFilterBarProps) {
  return (
    <div className={cn("admin-filter-bar", className)}>
      <div className="admin-filter-bar-main">{children}</div>
      {trailing ? <div className="admin-filter-bar-trailing">{trailing}</div> : null}
    </div>
  );
}

type AdminFilterFieldProps = {
  label?: string;
  children: ReactNode;
  className?: string;
};

/** Trường nội tuyến của thanh bộ lọc: nhãn và điều khiển nằm trên cùng một dòng */
export function AdminFilterField({ label, children, className }: AdminFilterFieldProps) {
  return (
    <label className={cn("admin-filter-inline", className)}>
      {label ? <span className="admin-filter-inline-label">{label}</span> : null}
      {children}
    </label>
  );
}
