import { api, type User } from '../api'

type Props = {
  user: Pick<User, 'nickname' | 'avatar_url'> | null | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  title?: string
}

const SIZE_CLASS = {
  sm: 'pf-user-avatar--sm',
  md: 'pf-user-avatar--md',
  lg: 'pf-user-avatar--lg',
  xl: 'pf-user-avatar--xl',
} as const

/** Hình đại diện của người dùng: Nếu có hình ảnh sẽ hiển thị, nếu không thì chữ cái đầu tiên của biệt danh sẽ được sử dụng. */
export default function UserAvatar({ user, size = 'md', className = '', title }: Props) {
  const nickname = user?.nickname || 'P'
  const initial = nickname.slice(0, 1).toUpperCase()
  const src = user?.avatar_url ? api.assetUrl(user.avatar_url, user.avatar_url) : ''

  return (
    <span
      className={`pf-user-avatar ${SIZE_CLASS[size]} ${src ? 'has-image' : ''} ${className}`.trim()}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      {src ? <img src={src} alt="" /> : initial}
    </span>
  )
}
