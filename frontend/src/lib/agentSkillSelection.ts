/** Kiểm tra kỹ năng của tác nhân: Bộ đệm cục bộ và giá trị mặc định */

import type { AgentSkill } from '../api/agentSkills'

const STORAGE_KEY = 'agentSkillIds:v1'

/** Đọc id Kỹ năng được chọn cuối cùng; nếu không có bộ đệm, trả về null */
export function loadStoredSkillIds(): number[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed
      .map((item) => Number(item))
      .filter((id) => Number.isInteger(id) && id > 0)
  } catch {
    return null
  }
}

/** Viết và kiểm tra Skill id */
export function saveStoredSkillIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* Bỏ qua ở chế độ riêng tư hoặc khi hết hạn mức */
  }
}

/** Đã kiểm tra mặc định: tất cả các kỹ năng được kích hoạt */
export function defaultSkillIds(skills: AgentSkill[]): number[] {
  return skills.filter((skill) => skill.is_active).map((skill) => skill.id)
}

/** Sử dụng danh sách hiện có để sửa id bộ đệm; nếu không có bộ đệm, hãy sử dụng mục được bật mặc định */
export function resolveSelectedSkillIds(skills: AgentSkill[], stored: number[] | null): number[] {
  const valid = new Set(skills.map((skill) => skill.id))
  if (stored == null) return defaultSkillIds(skills)
  return stored.filter((id) => valid.has(id))
}

/** Tên Kỹ năng đã chọn sẽ hiển thị trên nút */
export function skillTriggerLabel(skills: AgentSkill[], selectedIds: number[]): string {
  if (skills.length === 0) return 'Skill'
  if (selectedIds.length === 0) return '不使用 Skill'
  if (selectedIds.length === 1) {
    const hit = skills.find((skill) => skill.id === selectedIds[0])
    return hit?.name || 'Skill'
  }
  return `Skill · ${selectedIds.length}`
}
