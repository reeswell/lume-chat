import type { ChatGroup, ChatGroupDetail, Conversation, Friend, Message, User } from '@/services/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'
import { getSocket } from '@/services/socket'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const friends = ref<Friend[]>([])
  const groups = ref<ChatGroup[]>([])
  const currentRoomId = ref('')
  const messagesByRoom = ref<Record<string, Message[]>>({})
  const onlineUsers = ref<Record<string, string>>({})
  const currentConversation = computed(() => conversations.value.find(item => item.roomId === currentRoomId.value))
  const currentMessages = computed(() => messagesByRoom.value[currentRoomId.value] ?? [])
  const chatConversations = computed(() => conversations.value.filter(item => item.type !== 'system'))
  const systemConversation = computed(() => conversations.value.find(item => item.type === 'system'))
  const chatUnread = computed(() => chatConversations.value.reduce((total, item) => total + item.unread, 0))
  const systemUnread = computed(() => systemConversation.value?.unread ?? 0)

  async function bootstrap(): Promise<void> {
    await Promise.all([fetchConversations(), fetchContacts()])
    connectSocket()
    joinUserRoom()
    joinConversationRooms()
  }

  async function fetchConversations(): Promise<void> {
    conversations.value = await api.get<unknown, Conversation[]>('/conversations')
  }

  async function fetchContacts(): Promise<void> {
    const [friendRows, groupRows] = await Promise.all([
      api.get<unknown, Friend[]>('/friends'),
      api.get<unknown, ChatGroup[]>('/groups'),
    ])
    friends.value = friendRows
    groups.value = groupRows
  }

  async function selectRoom(roomId: string): Promise<void> {
    currentRoomId.value = roomId
    const auth = useAuthStore()
    const socket = getSocket()
    const conversation = conversations.value.find(item => item.roomId === roomId)
    if (auth.user != null && (conversation === undefined || conversation.removedAt === null))
      socket.emit('join', { roomId, userName: auth.user.userName })
    await loadMessages(roomId)
    await markRead(roomId)
  }

  function joinConversationRooms(): void {
    const auth = useAuthStore()
    if (!auth.user)
      return

    const socket = getSocket()
    for (const conversation of conversations.value) {
      if (conversation.removedAt !== null)
        continue
      socket.emit('join', { roomId: conversation.roomId, userName: auth.user.userName })
    }
  }

  function joinUserRoom(): void {
    const auth = useAuthStore()
    if (!auth.user)
      return

    getSocket().emit('joinUser', { userId: auth.user.id, userName: auth.user.userName })
  }

  async function loadMessages(roomId = currentRoomId.value): Promise<void> {
    if (!roomId)
      return
    messagesByRoom.value[roomId] = await api.get<unknown, Message[]>(`/messages/${roomId}`)
  }

  async function searchMessages(roomId: string, q: string): Promise<Message[]> {
    return api.get<unknown, Message[]>(`/messages/${roomId}/search`, { params: { q } })
  }

  function send(content: string): void {
    const auth = useAuthStore()
    if (!auth.user || !currentRoomId.value || !content.trim())
      return

    getSocket().emit('mes', {
      roomId: currentRoomId.value,
      content: content.trim(),
      senderId: auth.user.id,
      style: 'mess',
    })
  }

  async function markRead(roomId: string): Promise<void> {
    await Promise.all([
      api.post(`/messages/${roomId}/read`),
      api.post(`/conversations/${roomId}/read`),
    ])
    await fetchConversations()
  }

  async function searchUsers(q: string): Promise<User[]> {
    return api.get<unknown, User[]>('/users/search', { params: { q } })
  }

  async function getUser(userId: string): Promise<User> {
    return api.get<unknown, User>(`/users/${userId}`)
  }

  async function addFriend(targetUserId: string, message?: string): Promise<void> {
    await api.post('/friends/request', { targetUserId, message })
  }

  async function acceptFriend(userId: string): Promise<void> {
    const result = await api.post<unknown, { roomId: string }>(`/friends/${userId}/accept`)
    await bootstrap()
    await selectRoom(result.roomId)
  }

  async function removeFriend(userId: string): Promise<void> {
    await api.delete(`/friends/${userId}`)
    const removedConversation = conversations.value.find(item => item.type === 'friend' && item.friendId === userId)
    await Promise.all([fetchContacts(), fetchConversations()])
    if (removedConversation?.roomId === currentRoomId.value)
      currentRoomId.value = ''
  }

  async function searchGroups(q: string): Promise<ChatGroup[]> {
    return api.get<unknown, ChatGroup[]>('/groups/search', { params: { q } })
  }

  async function getGroup(groupId: string): Promise<ChatGroupDetail> {
    return api.get<unknown, ChatGroupDetail>(`/groups/${groupId}`)
  }

  async function createGroup(payload: { title: string, desc?: string, type?: string, joinApproval?: boolean }): Promise<ChatGroup> {
    const group = await api.post<unknown, ChatGroup>('/groups', payload)
    await bootstrap()
    await selectRoom(group.id)
    return group
  }

  async function requestJoinGroup(groupId: string, message?: string): Promise<void> {
    await api.post(`/groups/${groupId}/request`, { message })
  }

  async function acceptGroupRequest(messageId: string): Promise<void> {
    const result = await api.post<unknown, { roomId: string }>(`/groups/requests/${messageId}/accept`)
    await bootstrap()
    await selectRoom(result.roomId)
  }

  async function rejectGroupRequest(messageId: string): Promise<void> {
    await api.post(`/groups/requests/${messageId}/reject`)
    await fetchConversations()
  }

  async function quitGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/quit`)
    await Promise.all([fetchContacts(), fetchConversations()])
    if (currentRoomId.value === groupId)
      currentRoomId.value = ''
  }

  async function updateGroupSettings(groupId: string, payload: { joinApproval?: boolean }): Promise<ChatGroup> {
    const group = await api.patch<unknown, ChatGroup>(`/groups/${groupId}/settings`, payload)
    await Promise.all([fetchContacts(), fetchConversations()])
    return group
  }

  async function inviteGroupMember(groupId: string, targetUserId: string): Promise<void> {
    await inviteGroupMembers(groupId, [targetUserId])
  }

  async function inviteGroupMembers(groupId: string, targetUserIds: string[]): Promise<void> {
    await Promise.all(targetUserIds.map(async targetUserId => api.post(`/groups/${groupId}/invite`, { targetUserId })))
    await Promise.all([fetchContacts(), fetchConversations()])
  }

  async function removeGroupMember(groupId: string, userId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/${userId}`)
    await Promise.all([fetchContacts(), fetchConversations()])
    if (currentRoomId.value === groupId)
      await loadMessages(groupId)
  }

  async function dissolveGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}`)
    await Promise.all([fetchContacts(), fetchConversations()])
    if (currentRoomId.value === groupId)
      currentRoomId.value = ''
  }

  function connectSocket(): void {
    const socket = getSocket()
    if (!socket.connected)
      socket.connect()
    socket.off('mes')
    socket.off('mes:sent')
    socket.off('getHisMeg')
    socket.off('joined')
    socket.off('leaved')
    socket.off('takeValidate')
    socket.off('friendAccepted')
    socket.off('friendRemoved')
    socket.off('groupJoined')
    socket.off('groupRemoved')
    socket.on('mes', receiveMessage)
    socket.on('mes:sent', receiveMessage)
    socket.on('takeValidate', receiveMessage)
    socket.on('friendAccepted', refreshState)
    socket.on('friendRemoved', refreshState)
    socket.on('groupJoined', refreshState)
    socket.on('groupRemoved', refreshState)
    socket.on('getHisMeg', (messages: Message[]) => {
      if (messages.length > 0)
        messagesByRoom.value[messages[0].roomId] = messages
    })
    socket.on('joined', (users: Record<string, string>) => {
      onlineUsers.value = users
    })
    socket.on('leaved', (users: Record<string, string>) => {
      onlineUsers.value = users
    })
  }

  function receiveMessage(message: Message): void {
    const current = messagesByRoom.value[message.roomId] ?? []
    if (!current.some(item => item.id === message.id))
      messagesByRoom.value[message.roomId] = [...current, message]
    if (message.roomId === currentRoomId.value) {
      void markRead(message.roomId)
      return
    }
    void fetchConversations().then(joinConversationRooms)
  }

  async function refreshState(): Promise<void> {
    await Promise.all([fetchContacts(), fetchConversations()])
    joinConversationRooms()
  }

  function resetSession(): void {
    conversations.value = []
    friends.value = []
    groups.value = []
    currentRoomId.value = ''
    messagesByRoom.value = {}
    onlineUsers.value = {}
  }

  return {
    conversations,
    friends,
    groups,
    currentRoomId,
    messagesByRoom,
    onlineUsers,
    currentConversation,
    currentMessages,
    chatConversations,
    systemConversation,
    chatUnread,
    systemUnread,
    bootstrap,
    fetchConversations,
    fetchContacts,
    selectRoom,
    loadMessages,
    searchMessages,
    send,
    searchUsers,
    getUser,
    addFriend,
    acceptFriend,
    removeFriend,
    searchGroups,
    getGroup,
    createGroup,
    requestJoinGroup,
    acceptGroupRequest,
    rejectGroupRequest,
    quitGroup,
    updateGroupSettings,
    inviteGroupMember,
    inviteGroupMembers,
    removeGroupMember,
    dissolveGroup,
    resetSession,
  }
})
