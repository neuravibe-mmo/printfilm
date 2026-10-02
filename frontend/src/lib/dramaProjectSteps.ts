/** Các bước trong quy trình làm việc của dự án phim truyền hình: Phác thảo cốt truyện → Bản phân cảnh → Tạo video */

export type ProjectStepKey = 'outline' | 'storyboard' | 'video'
export type WorkspaceViewKey = ProjectStepKey | 'assets' | 'episodes'

export type ProjectStepItem = {
  key: ProjectStepKey
  label: string
  order: number
}

export type WorkspaceLocationState = {
  activeStep?: WorkspaceViewKey
  returnStep?: ProjectStepKey | 'episodes'
}

// Nếu có kịch bản thì làm theo dàn ý; nếu không có kịch bản thì vào thẳng storyboard (danh sách tập)
export function buildProjectSteps(hasScript: boolean): ProjectStepItem[] {
  const steps: Array<{ key: ProjectStepKey; label: string }> = hasScript
    ? [
        { key: 'outline', label: '剧情大纲' },
        { key: 'storyboard', label: '分镜' },
        { key: 'video', label: '生成视频' },
      ]
    : [
        { key: 'storyboard', label: '分镜' },
        { key: 'video', label: '生成视频' },
      ]
  return steps.map((step, index) => ({ ...step, order: index + 1 }))
}

export function getInitialProjectStep(hasScript: boolean): ProjectStepKey {
  return hasScript ? 'outline' : 'storyboard'
}

export function isProjectStepKey(value: string | undefined): value is ProjectStepKey {
  return value === 'outline' || value === 'storyboard' || value === 'video'
}

/** Trạng thái cũ activeStep=episodes ánh xạ tới bảng phân cảnh */
export function normalizeWorkspaceStep(value: string | undefined): ProjectStepKey | 'assets' | null {
  if (value === 'assets') return 'assets'
  if (value === 'episodes' || value === 'storyboard' || value === 'video') {
    return value === 'episodes' ? 'storyboard' : value
  }
  if (value === 'outline') return 'outline'
  return null
}

export function getNextProjectStep(
  steps: ProjectStepItem[],
  currentStep: ProjectStepKey,
): ProjectStepKey | null {
  const currentIndex = steps.findIndex((step) => step.key === currentStep)
  if (currentIndex < 0 || currentIndex >= steps.length - 1) return null
  return steps[currentIndex + 1].key
}

/** Tất cả các video được tạo/tạo kịch bản phân cảnh đều được chuyển sang định tuyến đa dạng */
export function isEpisodesRouteStep(step: ProjectStepKey | string | undefined): boolean {
  return step === 'storyboard' || step === 'video' || step === 'episodes'
}
