/** Trang canvas miễn phí: canvas vô hạn toàn màn hình React Flow (không có bố cục shell ứng dụng) */
import { useParams } from 'react-router-dom'
import RequireAuth from '../RequireAuth'
import { CanvasWorkspace } from './CanvasWorkspace'
import { useI18n } from '../../../i18n'

/** Hiển thị canvas miễn phí toàn màn hình sau khi xác thực */
export default function CanvasPage() {
  return (
    <RequireAuth>
      <CanvasPageInner />
    </RequireAuth>
  )
}

/** Đọc projectId từ tuyến đường và gắn kết không gian làm việc */
function CanvasPageInner() {
  const { t } = useI18n()
  const { projectId } = useParams()
  const id = Number(projectId)

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="free-canvas-page" style={{ display: 'grid', placeItems: 'center' }}>
        <p style={{ color: '#64748b' }}>{t('drama.canvas.invalidProjectId')}</p>
      </div>
    )
  }

  return <CanvasWorkspace projectId={id} />
}
