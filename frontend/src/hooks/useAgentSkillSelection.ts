/** Tải Kỹ năng tác nhân hiển thị và nhớ kiểm tra */

import { useCallback, useEffect, useState } from 'react'
import { listAgentSkills, uploadAgentSkillFile, type AgentSkill } from '../api/agentSkills'
import {
  loadStoredSkillIds,
  resolveSelectedSkillIds,
  saveStoredSkillIds,
} from '../lib/agentSkillSelection'

type UseAgentSkillSelectionResult = {
  skills: AgentSkill[]
  selectedIds: number[]
  loaded: boolean
  uploading: boolean
  uploadError: string
  setSelectedIds: (ids: number[]) => void
  toggleSkill: (skillId: number) => void
  selectAll: () => void
  selectNone: () => void
  uploadSkill: (file: File) => Promise<void>
}

/** Liệt kê các kỹ năng và đồng bộ hóa kiểm tra cục bộ */
export function useAgentSkillSelection(): UseAgentSkillSelectionResult {
  /*
   * kỹ năng hiển thị Kỹ năng
   * selectedId hiện đã được kiểm tra
   * đã tải Danh sách đã xong chưa?
   * đang tải lên Đang tải lên md
   * uploadError tải lên bản sao không thành công
   */
  const [skills, setSkills] = useState<AgentSkill[]>([])
  const [selectedIds, setSelectedIdsState] = useState<number[]>([])
  const [loaded, setLoaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    let cancelled = false
    void listAgentSkills()
      .then((res) => {
        if (cancelled) return
        const items = res.items || []
        setSkills(items)
        setSelectedIdsState(resolveSelectedSkillIds(items, loadStoredSkillIds()))
        setLoaded(true)
      })
      .catch(() => {
        if (cancelled) return
        setSkills([])
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setSelectedIds = useCallback((ids: number[]) => {
    setSelectedIdsState(ids)
    saveStoredSkillIds(ids)
  }, [])

  const toggleSkill = useCallback((skillId: number) => {
    setSelectedIdsState((prev) => {
      const next = prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
      saveStoredSkillIds(next)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    const ids = skills.filter((skill) => skill.is_active).map((skill) => skill.id)
    setSelectedIds(ids.length ? ids : skills.map((skill) => skill.id))
  }, [skills, setSelectedIds])

  const selectNone = useCallback(() => {
    setSelectedIds([])
  }, [setSelectedIds])

  const uploadSkill = useCallback(async (file: File) => {
    setUploading(true)
    setUploadError('')
    try {
      const created = await uploadAgentSkillFile(file)
      const res = await listAgentSkills()
      const items = res.items || []
      setSkills(items)
      setSelectedIdsState((prev) => {
        const next = prev.includes(created.id) ? prev : [...prev, created.id]
        saveStoredSkillIds(next)
        return next
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }, [])

  return {
    skills,
    selectedIds,
    loaded,
    uploading,
    uploadError,
    setSelectedIds,
    toggleSkill,
    selectAll,
    selectNone,
    uploadSkill,
  }
}
