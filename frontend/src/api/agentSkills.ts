/** API kỹ năng của tác nhân: Danh sách/Tải lên/Bật/Xóa */

import { getDramaApiBase } from './drama'

/** Tập hợp các tiêu đề yêu cầu; không ép buộc JSON khi sử dụng FormData */
function authHeaders(json = true): HeadersInit {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

/** Yêu cầu API kỹ năng đại lý với trạng thái đăng nhập */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getDramaApiBase()}${path}`, {
    ...init,
    headers: { ...authHeaders(init?.body instanceof FormData ? false : true), ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const detail = err.detail
    throw new Error(typeof detail === 'string' ? detail : '请求失败')
  }
  return res.json()
}

export type AgentSkill = {
  id: number
  slug: string
  name: string
  description: string
  tasks: string[]
  is_builtin: boolean
  is_active: boolean
  user_id: number | null
  body: string
  created_at?: string | null
  updated_at?: string | null
}

/** Danh sách tích hợp + Kỹ năng người dùng hiện tại */
export function listAgentSkills() {
  return request<{ items: AgentSkill[] }>('/api/drama/skills')
}

/** Tải lên văn bản đánh dấu */
export function uploadAgentSkillMarkdown(markdown: string) {
  return request<AgentSkill>('/api/drama/skills', {
    method: 'POST',
    body: JSON.stringify({ markdown }),
  })
}

/** Tải lên tệp .md */
export async function uploadAgentSkillFile(file: File) {
  const token = localStorage.getItem('token')
  const body = new FormData()
  body.append('file', file)
  const res = await fetch(`${getDramaApiBase()}/api/drama/skills/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(typeof err.detail === 'string' ? err.detail : '上传失败')
  }
  return res.json() as Promise<AgentSkill>
}

/** Bật/tắt hoặc sửa văn bản */
export function patchAgentSkill(skillId: number, body: { markdown?: string; is_active?: boolean }) {
  return request<AgentSkill>(`/api/drama/skills/${skillId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/** Xóa kỹ năng người dùng (không thể xóa tích hợp) */
export function deleteAgentSkill(skillId: number) {
  return request<{ ok: boolean }>(`/api/drama/skills/${skillId}`, { method: 'DELETE' })
}

/** Nhấp để kiểm tra từ nhắc nhở Tối ưu hóa kỹ năng (giữ lại tham chiếu @asset) */
export function optimizePromptWithSkills(body: {
  prompt: string
  skill_ids: number[]
  task?: 'video_prompt' | 'image_prompt' | 'shot_plan'
}) {
  return request<{ prompt: string }>('/api/drama/skills/optimize', {
    method: 'POST',
    body: JSON.stringify({
      prompt: body.prompt,
      skill_ids: body.skill_ids,
      task: body.task || 'video_prompt',
    }),
  })
}
