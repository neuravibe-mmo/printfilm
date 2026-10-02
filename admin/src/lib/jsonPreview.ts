/** Compact JSON preview for admin task list / tooltips. */

// Nén đối tượng thành một bản tóm tắt trên một dòng; trả về giá trị rỗng -
export function compactJsonPreview(value: unknown, maxLen = 96): string {
  if (value == null) return "—";
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return "—";
    return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
  }
  if (typeof value !== "object") {
    const s = String(value);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  }
  if (Array.isArray(value) && value.length === 0) return "[]";
  if (!Array.isArray(value) && Object.keys(value as object).length === 0) return "—";
  try {
    const s = JSON.stringify(value);
    if (!s || s === "{}" || s === "[]") return "—";
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  } catch {
    return "—";
  }
}

// Làm đẹp JSON nhiều dòng (cửa sổ bật lên chi tiết)
export function prettyJson(value: unknown): string {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// Có nội dung JSON nào có thể được hiển thị không?
export function hasJsonContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}
