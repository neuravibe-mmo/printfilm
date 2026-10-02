/** Hiển thị ID tài khoản công khai: thêm số 0 nếu có ít hơn bốn chữ số */
export function formatAccountId(userId: number): string {
  const n = Math.max(0, Math.floor(userId));
  if (n < 10000) return String(n).padStart(4, "0");
  return String(n);
}

/** Phân tích ID tài khoản từ cụm từ tìm kiếm (hỗ trợ 0001 hoặc số thuần) */
export function parseAccountIdQuery(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/^0+/, "") || "0";
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}
