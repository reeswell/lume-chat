export interface User {
  id: string
  userName: string
  nickname: string
  avatar: string
  signature: string
  email: string
  province: string
  city: string
  gender: string
  age: number
}

export interface Conversation {
  id: string
  ownerId: string
  roomId: string
  title: string
  avatar: string
  type: 'friend' | 'group' | 'channel' | 'system' | string
  friendId?: string
  groupId?: string
  lastMessage: string
  lastMessageAt?: string
  unread: number
  pinned: boolean
  removedAt?: string | null
}

export interface Message {
  id: string
  roomId: string
  senderId?: string
  userName: string
  nickname: string
  avatar: string
  content: string
  style: string
  type: string
  state?: string
  status?: string
  targetUserId?: string
  targetGroupId?: string
  friendRoom?: string
  createdAt: string
}

export interface Friend {
  id: string
  roomId: string
  friend: User
  createDate: string
}

export interface ChatGroup {
  id: string
  groupCode: string
  title: string
  desc: string
  img: string
  userNum: number
  type: string
  holderId: string
  holderName: string
  joinApproval: boolean
  createDate: string
  removedAt?: string | null
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  userName: string
  manager: boolean
  holder: boolean
  card?: string
  user: User
}

export type ChatGroupDetail = ChatGroup & {
  members: GroupMember[]
}
