/** Trạng thái tạo nội dung truyện tranh (phù hợp với params.Generation.status) */
export const DRAMA_GENERATION_STATUSES = [
  "queued",
  "running",
  "generating",
  "done",
  "failed",
  "cancelled",
] as const;

/** Trạng thái tạo chương trình truyện tranh Nhãn Trung Quốc (nhàn rỗi chỉ được sử dụng để khôi phục hiển thị khi không có params.thế hệ như bảng phân cảnh) */
export function dramaGenerationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    queued: "排队中",
    running: "生成中",
    generating: "生成中",
    done: "已完成",
    failed: "失败",
    cancelled: "已取消",
    idle: "未开始",
  };
  return map[status] ?? status;
}

/** Hiển thị danh sách/chi tiết: hiển thị giá trị trống — */
export function formatDramaGenerationStatus(status: string | null | undefined): string {
  if (!status) return "—";
  return dramaGenerationStatusLabel(status);
}

/** Loại nội dung truyện tranh Nhãn tiếng Trung */
export function dramaAssetTypeLabel(type: string): string {
  const map: Record<string, string> = {
    character: "角色",
    scene: "场景",
    prop: "道具",
    material: "素材",
    narration: "旁白",
    video: "视频",
    audio: "音频",
    text: "文本",
    none: "未分类",
  };
  return map[type] ?? type;
}
