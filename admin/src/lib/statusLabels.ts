/** Project pipeline status → Chinese label */
export const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  SCRIPTING: "脚本生成中",
  SCRIPT_READY: "脚本就绪",
  IMAGING: "分镜图生成中",
  IMAGE_READY: "分镜图就绪",
  VIDEOING: "视频生成中",
  VIDEO_READY: "视频就绪",
  AUDIOING: "配音中",
  COMPOSING: "合成中",
  AUDITING: "审核中",
  DONE: "已完成",
  REJECTED: "已拒绝",
  FAILED: "失败",
  CANCELLED: "已取消",
};

/** Order payment status → Chinese */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  closed: "已关闭",
};

/** Work audit / visibility → Chinese */
export const AUDIT_STATUS_LABELS: Record<string, string> = {
  pending: "待审核",
  passed: "已通过",
  rejected: "已拒绝",
};

export const VISIBILITY_LABELS: Record<string, string> = {
  public: "公开",
  private: "私密",
  unlisted: "不公开列出",
};

/** Wallet ledger kind → Chinese */
export const LEDGER_KIND_LABELS: Record<string, string> = {
  topup: "充值",
  grant: "赠送",
  adjust: "调账",
  freeze: "冻结",
  unfreeze: "解冻",
  settle: "结算",
  refund: "退款",
};

/** Payment channel → Chinese */
export const PAY_TYPE_LABELS: Record<string, string> = {
  alipay: "支付宝",
  wxpay: "微信",
};

/** Unified task platform status → Chinese */
export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "排队中",
  leased: "已租约",
  running: "执行中",
  awaiting_poll: "等待轮询",
  awaiting_review: "待审核",
  cancel_requested: "取消中",
  succeeded: "已成功",
  failed: "失败",
  cancelled: "已取消",
};

/** Task domain → Chinese */
export const TASK_DOMAIN_LABELS: Record<string, string> = {
  drama: "漫剧",
  kepu: "AI短视频",
  tools: "工具",
  studio: "工作室",
  api: "开放 API",
};

/** Task type → Chinese（轻量同步 + 平台任务） */
export const TASK_TYPE_LABELS: Record<string, string> = {
  agent_chat: "漫剧助手聊天",
  skill_optimize: "Skill 优化提示词",
  voice_prompt: "角色音色描述",
  content_expand: "选题扩写",
  script_summary: "剧本摘要",
  episode_script: "分集剧本",
  fragment_plan: "AI 分镜",
  fragment_video: "分镜视频",
  seed_assets: "资产抽取",
  asset_image: "资产生图",
  asset_video: "资产视频",
  voice_synthesis: "配音合成",
  project_pipeline: "科普流水线",
  shot_regen_image: "单镜重绘",
  shot_regen_video: "单镜视频",
  shot_regen_audio: "单镜配音",
  project_regen_audio: "全片配音",
  project_compose_only: "仅合成",
  v1_image: "API 生图",
  v1_video: "API 生视频",
  v1_seedance: "API Seedance",
  tool_image: "工具生图",
  tool_video: "工具生视频",
};

// Resolve project status display text
export function projectStatusLabel(status: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`status.project.${status}`);
    if (res !== `status.project.${status}`) return res;
  }
  return PROJECT_STATUS_LABELS[status] ?? status;
}

// Resolve order status display text
export function orderStatusLabel(status: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`status.order.${status}`);
    if (res !== `status.order.${status}`) return res;
  }
  return ORDER_STATUS_LABELS[status] ?? status;
}

// Resolve audit status display text
export function auditStatusLabel(status: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`status.audit.${status}`);
    if (res !== `status.audit.${status}`) return res;
  }
  return AUDIT_STATUS_LABELS[status] ?? status;
}

// Resolve visibility display text
export function visibilityLabel(status: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`status.visibility.${status}`);
    if (res !== `status.visibility.${status}`) return res;
  }
  return VISIBILITY_LABELS[status] ?? status;
}

// Resolve ledger kind display text
export function ledgerKindLabel(kind: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`status.ledger.${kind}`);
    if (res !== `status.ledger.${kind}`) return res;
  }
  return LEDGER_KIND_LABELS[kind] ?? kind;
}

// Resolve pay type display text
export function payTypeLabel(payType: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`status.payType.${payType}`);
    if (res !== `status.payType.${payType}`) return res;
  }
  return PAY_TYPE_LABELS[payType] ?? payType;
}

// Resolve task status display text
export function taskStatusLabel(status: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`status.task.${status}`);
    if (res !== `status.task.${status}`) return res;
  }
  return TASK_STATUS_LABELS[status] ?? status;
}

// Resolve task domain display text
export function taskDomainLabel(domain: string, t?: (key: string) => string): string {
  if (t) {
    const direct = t(`status.taskDomain.${domain}`);
    if (direct !== `status.taskDomain.${domain}`) return direct;
    const filterRes = t(`dashboard.filters.${domain}`);
    if (filterRes !== `dashboard.filters.${domain}`) return filterRes;
  }
  return TASK_DOMAIN_LABELS[domain] ?? domain;
}

// Resolve task type display text
export function taskTypeLabel(taskType: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`status.taskType.${taskType}`);
    if (res !== `status.taskType.${taskType}`) return res;
  }
  return TASK_TYPE_LABELS[taskType] ?? taskType;
}

// Resolve billing basis display text
export function billingBasisLabel(
  basis?: string,
  estimated?: boolean,
  t?: (key: string) => string,
): string {
  const b = basis || (estimated ? "estimate" : "");
  if (t) {
    if (b === "estimate" || estimated) return t("status.billingBasis.estimate");
    if (b === "upstream_usage") return t("status.billingBasis.upstream_usage");
    if (b === "upstream_cost") return t("status.billingBasis.upstream_cost");
    if (b === "unknown") return t("status.billingBasis.unknown");
    return t("status.billingBasis.estimate");
  }
  if (b === "estimate" || estimated) return "估算";
  if (b === "upstream_usage") return "实测(token)";
  if (b === "upstream_cost") return "实测(费用)";
  if (b === "unknown") return "实测(未分类)";
  return "估算";
}

/** Filter options for project status select (value stays English for API) */
export const PROJECT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "全部状态" },
  ...Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

// Resolve template category display text
export function templateCategoryLabel(category: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`templates.categories.${category}`);
    if (res !== `templates.categories.${category}`) return res;
  }
  return category;
}

// Resolve template name display text
export function templateName(id: string, defaultName: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`templates.builtIn.${id}.name`);
    if (res !== `templates.builtIn.${id}.name`) return res;
  }
  return defaultName;
}

// Resolve template description display text
export function templateDesc(id: string, defaultDesc: string, t?: (key: string) => string): string {
  if (t) {
    const res = t(`templates.builtIn.${id}.description`);
    if (res !== `templates.builtIn.${id}.description`) return res;
  }
  return defaultDesc;
}
