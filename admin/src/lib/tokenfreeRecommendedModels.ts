export type ModelCapability = "text" | "image" | "video" | "audio";

export type UpstreamModelOption = { id: string; label: string; capability: string };

/** Kiểm tra id TokenFree được thêm khi đề xuất; video bao gồm 2.5 / 2.0 / Mini */
export const RECOMMENDED_MODEL_IDS: Record<ModelCapability, string[]> = {
  text: ["kimi-k2.6"],
  image: ["gpt-image-2-5"],
  video: ["seedance-2-5", "seedance-2-0", "seedance-2-0-mini"],
  audio: [
    "qwen-tts-2025-05-22",
    "qwen3-tts-flash",
    "gemini-3.1-flash-tts",
    "gemini-2.5-pro-preview-tts",
    "elevenlabs-tts",
    "elevenlabs/text-to-speech-multilingual-v2",
  ],
};

const CAPABILITY_ORDER: ModelCapability[] = ["text", "image", "video", "audio"];

// Nhận điểm truy cập/tên viết tắt của Seedance vào id thư mục TokenFree
export function canonicalChannelModelId(model: string): string {
  const mid = (model || "").trim();
  if (!mid) return "";
  const low = mid.toLowerCase();
  if (!low.includes("seedance")) return mid;
  if (low.includes("mini")) return "seedance-2-0-mini";
  if (/(?:2-5|2\.5|260628)/.test(low)) return "seedance-2-5";
  if (/(?:2-0|2\.0|260128)/.test(low)) return "seedance-2-0";
  const compact = low.replace(/_/g, "-");
  if (compact === "seedance-2" || compact === "seedance2" || compact.endsWith("seedance-2")) {
    return "seedance-2-0";
  }
  return mid;
}

// Hợp nhất ba bí danh của Seedance 2.0 và giữ nguyên thứ tự ban đầu
export function canonicalizeChannelModels(models: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of models) {
    const id = canonicalChannelModelId(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

// Chỉ có một Seedance của cùng một mẫu trong danh mục và ID thông số kỹ thuật được hiển thị đầu tiên.
export function collapseCatalogModels(models: UpstreamModelOption[]): UpstreamModelOption[] {
  const map = new Map<string, UpstreamModelOption>();
  for (const model of models) {
    const id = canonicalChannelModelId(model.id);
    if (!id) continue;
    const prev = map.get(id);
    if (!prev || model.id === id) {
      map.set(id, {
        ...model,
        id,
        label: model.id === id ? model.label || id : id,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
}

// Id đề xuất thực tế trong thư mục ngược dòng
export function pickRecommendedModelIds(models: UpstreamModelOption[]): string[] {
  const ids = new Set(models.map((item) => canonicalChannelModelId(item.id)));
  const out: string[] = [];
  for (const cap of CAPABILITY_ORDER) {
    for (const want of RECOMMENDED_MODEL_IDS[cap]) {
      if (ids.has(want) && !out.includes(want)) out.push(want);
    }
  }
  return out;
}

// Các mục mặc định cho từng khả năng; logic viết video id Seedance-2.5, được căn chỉnh theo các tùy chọn thả xuống
export function pickRecommendedDefaults(models: UpstreamModelOption[]): Record<ModelCapability, string> {
  const ids = new Set(models.map((item) => canonicalChannelModelId(item.id)));
  const out: Record<ModelCapability, string> = { text: "", image: "", video: "", audio: "" };
  for (const cap of CAPABILITY_ORDER) {
    if (cap === "video" && (ids.has("seedance-2-5") || ids.has("seedance-2.5"))) {
      out.video = "seedance-2.5";
      continue;
    }
    out[cap] = RECOMMENDED_MODEL_IDS[cap].find((id) => ids.has(id)) || "";
  }
  return out;
}

// Kiểm tra và đề xuất: chuẩn hóa rồi thêm danh sách rút gọn mà không xóa Seedance 2.0 đã chọn
export function mergeRecommendedSelection(selected: string[], catalog: UpstreamModelOption[]): string[] {
  const recommended = pickRecommendedModelIds(catalog);
  return canonicalizeChannelModels([...selected, ...recommended]);
}
