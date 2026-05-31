import type { ComputedRef } from 'vue'
import type { Message } from '@/services/types'
import { shallowRef } from 'vue'
import { useChatStore } from '@/stores/chat'

export interface ChatMessageItem {
  id: string
  kind: 'message'
  message: Message
  mine: boolean
  showTime: boolean
  showSenderName: boolean
}

export interface UnreadDividerItem {
  id: string
  kind: 'unread-divider'
  unread: number
}

export type MessageListItem = ChatMessageItem | UnreadDividerItem

export function useMessageSearch(roomId: ComputedRef<string>) {
  const chat = useChatStore()
  const isSearchOpen = shallowRef(false)
  const searchQuery = shallowRef('')
  const searchResults = shallowRef<Message[]>([])
  const isSearchingMessages = shallowRef(false)

  function openSearchPanel(): void {
    isSearchOpen.value = true
    searchQuery.value = ''
    searchResults.value = []
  }

  function closeSearchPanel(): void {
    isSearchOpen.value = false
    searchQuery.value = ''
    searchResults.value = []
  }

  async function searchChatMessages(): Promise<void> {
    const keyword = searchQuery.value.trim()
    if (!keyword) {
      searchResults.value = []
      return
    }
    isSearchingMessages.value = true
    try {
      searchResults.value = await chat.searchMessages(roomId.value, keyword)
    }
    finally {
      isSearchingMessages.value = false
    }
  }

  function formatSearchTime(value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime()))
      return ''
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return {
    isSearchOpen,
    searchQuery,
    searchResults,
    isSearchingMessages,
    openSearchPanel,
    closeSearchPanel,
    searchChatMessages,
    formatSearchTime,
  }
}
