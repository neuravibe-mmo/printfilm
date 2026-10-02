import type { User } from '../api'

export const USER_UPDATED_EVENT = 'pf-user-updated'

/** Phát các thay đổi hồ sơ người dùng cho thanh trên cùng và các thành phần khác để đồng bộ hóa hình đại diện */
export function dispatchUserUpdated(user: User) {
  window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, { detail: user }))
}
