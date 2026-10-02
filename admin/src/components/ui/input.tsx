import * as React from "react";
import { cn } from "@/lib/utils";

// Nhập văn bản thống nhất ở phía quản lý
export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn("admin-control", className)}
      {...props}
    />
  );
}
