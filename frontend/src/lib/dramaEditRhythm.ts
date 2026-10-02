/**
 * Công thức nhịp điệu để chỉnh sửa vở kịch ngắn (sáu loại kỹ năng cộng đồng, được sử dụng để đề xuất thời lượng của bảng phân cảnh/lập kế hoạch xuất tập đầy đủ)
 * Tài liệu căn chỉnh/EPISODE_RULES.md §10 P3
 */

export type DramaEditRhythmId =
  | 'breath'
  | 'heartbeat'
  | 'wave'
  | 'elastic'
  | 'pulse'
  | 'silence_hammer'

export type DramaEditRhythmPreset = {
  id: DramaEditRhythmId
  label: string
  hint: string
  /** Trọng lượng nhịp tương đối, sẽ được chuẩn hóa thành tổng số giây mục tiêu */
  weights: number[]
}

export const DRAMA_EDIT_RHYTHM_PRESETS: DramaEditRhythmPreset[] = [
  {
    id: 'breath',
    label: '呼吸式',
    hint: '缓入—展开—回落，适合建立与抒情',
    weights: [3, 5, 4, 3],
  },
  {
    id: 'heartbeat',
    label: '心跳式',
    hint: '短促加速，适合冲突与对峙',
    weights: [2, 2, 3, 2, 4],
  },
  {
    id: 'wave',
    label: '海浪式',
    hint: '层层推高再泄力，适合高潮戏',
    weights: [3, 4, 5, 6, 3],
  },
  {
    id: 'elastic',
    label: '弹性时间',
    hint: '关键动作拉长，其余压缩',
    weights: [2, 6, 2, 3],
  },
  {
    id: 'pulse',
    label: '脉冲式',
    hint: '规律跳动，适合卡点与群像',
    weights: [3, 3, 3, 3],
  },
  {
    id: 'silence_hammer',
    label: '静默锤击',
    hint: '蓄势静场后猛切，适合反转',
    weights: [5, 2, 6],
  },
]

const SEGMENT_MIN = 3
const SEGMENT_MAX = 15

// Gán giây cho N đoạn theo công thức nhịp độ (kẹp 3–15, tổng gần bằng targetTotal)
export function suggestRhythmDurations(
  segmentCount: number,
  rhythmId: DramaEditRhythmId,
  targetTotal = 15,
): number[] {
  const count = Math.max(1, Math.floor(segmentCount))
  const preset =
    DRAMA_EDIT_RHYTHM_PRESETS.find((p) => p.id === rhythmId) || DRAMA_EDIT_RHYTHM_PRESETS[0]
  const weights: number[] = []
  for (let i = 0; i < count; i++) {
    weights.push(preset.weights[i % preset.weights.length] || 3)
  }
  const sumW = weights.reduce((a, b) => a + b, 0) || 1
  const raw = weights.map((w) => (w / sumW) * Math.max(SEGMENT_MIN * count, targetTotal))
  const clamped = raw.map((v) => Math.max(SEGMENT_MIN, Math.min(SEGMENT_MAX, Math.round(v))))
  // Tinh chỉnh tổng: nếu quá ngắn thì thêm từ đoạn tối đa; nếu nó quá dài, hãy trừ nó khỏi đoạn lớn nhất.
  let total = clamped.reduce((a, b) => a + b, 0)
  const goal = Math.max(SEGMENT_MIN * count, Math.min(15, Math.round(targetTotal)))
  let guard = 0
  while (total < goal && guard < 40) {
    const idx = clamped.indexOf(Math.max(...clamped))
    if (clamped[idx] < SEGMENT_MAX) {
      clamped[idx] += 1
      total += 1
    } else break
    guard += 1
  }
  while (total > goal && guard < 80) {
    const idx = clamped.indexOf(Math.max(...clamped))
    if (clamped[idx] > SEGMENT_MIN) {
      clamped[idx] -= 1
      total -= 1
    } else break
    guard += 1
  }
  return clamped
}

// Kế hoạch xuất toàn tập: Thời lượng đề xuất cho mỗi cảnh quay (D-2 / số cảnh hiện có)
export function suggestEpisodeFragmentDurations(
  fragmentCount: number,
  rhythmId: DramaEditRhythmId,
  /** Thời lượng mục tiêu trung bình của ống kính đơn */
  perFragmentTarget = 10,
): number[] {
  const count = Math.max(1, Math.floor(fragmentCount))
  const total = Math.min(15 * count, Math.max(4 * count, perFragmentTarget * count))
  return suggestRhythmDurations(count, rhythmId, total).map((sec) =>
    Math.max(4, Math.min(15, sec)),
  )
}
