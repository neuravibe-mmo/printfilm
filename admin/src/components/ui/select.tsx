import * as React from "react";
import { cn } from "@/lib/utils";

// Lựa chọn thả xuống thống nhất về phía quản lý
export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn("admin-control admin-select", className)} {...props} />;
}

// Thống nhất văn bản nhiều dòng về mặt quản lý
export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn("admin-control admin-textarea", className)} {...props} />;
}
