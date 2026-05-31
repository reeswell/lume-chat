import type { User } from '@lume-chat/shared-types'

/** Fields returned by {@link publicUserSelect} — aligned with API `User`. */
export type PublicUser = Pick<User, 'id' | 'userName' | 'nickname' | 'avatar' | 'signature' | 'email' | 'province' | 'city' | 'gender' | 'age'>

export function friendRoomId(a: string, b: string): string {
  return [a, b].sort().join('-')
}

export function publicUserSelect() {
  return {
    id: true,
    userName: true,
    nickname: true,
    avatar: true,
    signature: true,
    email: true,
    province: true,
    city: true,
    gender: true,
    age: true,
  }
}
