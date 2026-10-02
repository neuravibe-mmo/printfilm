import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetaItem = {
  label: string;
  value: ReactNode;
  full?: boolean;
};

type StatItem = {
  label: string;
  value: ReactNode;
};

/** Chi tiết tiêu đề + nội dung phân vùng cửa sổ bật lên */
export function AdminDetailSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("admin-detail-section", className)}>
      {title ? <h4 className="admin-detail-section-title">{title}</h4> : null}
      {children}
    </section>
  );
}

/** Lưới khóa-giá trị chỉ đọc (thông tin cơ bản) */
export function AdminDetailMeta({ items }: { items: MetaItem[] }) {
  return (
    <dl className="admin-detail-meta">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn("admin-detail-meta-item", item.full && "admin-detail-meta-item--full")}
        >
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Lưới bốn ô vuông chi phí/chỉ báo */
export function AdminDetailStatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="admin-detail-stat-grid">
      {items.map((item) => (
        <div key={item.label} className="admin-detail-stat-card">
          <div className="admin-detail-stat-label">{item.label}</div>
          <div className="admin-detail-stat-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

/** Hộp chứa biểu mẫu được nhúng trong cửa sổ bật lên */
export function AdminDetailTableWrap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("admin-detail-table-wrap", className)}>{children}</div>;
}

/** Khối văn bản ghi chú/tập lệnh */
export function AdminDetailNote({
  children,
  empty = false,
  className,
}: {
  children: ReactNode;
  empty?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("admin-detail-note", empty && "admin-detail-note--empty", className)}>
      {children}
    </div>
  );
}
