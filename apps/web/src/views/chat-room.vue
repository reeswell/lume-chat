<script setup lang="ts">
import type { MessageListItem } from '@/composables/useMessageSearch'
import type { ChatGroupDetail, Message } from '@/services/types'
import { useTimeoutFn } from '@vueuse/core'
import { ChevronsUp, Search, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import AppShell from '@/components/AppShell.vue'
import ChatRoomHeader from '@/components/chat/ChatRoomHeader.vue'
import MessageComposer from '@/components/chat/MessageComposer.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import { useMessageScroller } from '@/composables/useMessageScroller'
import { useMessageSearch } from '@/composables/useMessageSearch'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()

const draft = shallowRef('')
const composer = useTemplateRef<InstanceType<typeof MessageComposer>>('composer')
const initialUnreadCount = shallowRef(0)
const shouldScrollAfterOwnMessage = shallowRef(false)
const groupDetail = shallowRef<ChatGroupDetail | null>(null)
const sendBlockedMessage = shallowRef('')

const roomId = computed(() => String(route.params.roomId))
const headerConversation = computed(() => chat.currentConversation ?? chat.conversations.find(item => item.roomId === roomId.value))
const isGroupConversation = computed(() => {
  const conversation = headerConversation.value
  return Boolean(conversation && (conversation.type === 'group' || conversation.type === 'channel' || conversation.groupId))
})
const normalizedUnreadCount = computed(() => Math.min(initialUnreadCount.value, chat.currentMessages.length))
const unreadStartMessageIndex = computed(() => {
  if (normalizedUnreadCount.value <= 0)
    return -1
  return Math.max(chat.currentMessages.length - normalizedUnreadCount.value, 0)
})
const messageItems = computed<MessageListItem[]>(() => {
  const items: MessageListItem[] = []
  chat.currentMessages.forEach((message, index, messages) => {
    if (index === unreadStartMessageIndex.value) {
      items.push({
        id: `unread-divider-${roomId.value}-${normalizedUnreadCount.value}`,
        kind: 'unread-divider',
        unread: normalizedUnreadCount.value,
      })
    }
    items.push({
      id: message.id,
      kind: 'message',
      message,
      mine: message.senderId === auth.user?.id,
      showTime: shouldShowMessageTime(message, messages[index - 1]),
      showSenderName: isGroupConversation.value && message.senderId !== auth.user?.id,
    })
  })
  return items
})
const unreadDividerIndex = computed(() => messageItems.value.findIndex(item => item.kind === 'unread-divider'))

const {
  messageScroller,
  messageScrollerHost,
  hasAppliedInitialScroll,
  isNearBottom,
  pendingNewMessageCount,
  waitForScrollerLayout,
  scrollToInitialPosition,
  scrollToBottomPosition,
  jumpToLatestMessages,
  scrollToItem,
  handleMessageScroll,
} = useMessageScroller(messageItems, unreadDividerIndex)

const {
  isSearchOpen,
  searchQuery,
  searchResults,
  isSearchingMessages,
  openSearchPanel,
  closeSearchPanel,
  searchChatMessages,
  formatSearchTime,
} = useMessageSearch(roomId)

const currentGroupMember = computed(() => {
  const userId = auth.user?.id
  if (!userId)
    return null
  return groupDetail.value?.members.find(member => member.userId === userId) ?? null
})
const isHistoricalGroupConversation = computed(() => Boolean(isGroupConversation.value && headerConversation.value?.removedAt))
const canAccessCurrentRoom = computed(() => !isGroupConversation.value || Boolean(currentGroupMember.value) || isHistoricalGroupConversation.value)
const canSendMessage = computed(() => {
  if (!chat.currentRoomId)
    return false
  if (isHistoricalGroupConversation.value)
    return false
  if (!isGroupConversation.value)
    return true
  if (!currentGroupMember.value || !groupDetail.value)
    return false
  return groupDetail.value.type !== 'channel' || groupDetail.value.holderId === auth.user?.id
})
const shouldShowComposer = computed(() => canSendMessage.value)
const removedByName = computed(() => {
  const owner = groupDetail.value?.members.find(member => member.holder)
  return owner?.user.nickname || owner?.userName || groupDetail.value?.holderName || '群主'
})
const composerStatusText = computed(() => {
  if (isHistoricalGroupConversation.value)
    return '你已被移出群聊，仍可查看移出前的聊天记录'
  if (!canAccessCurrentRoom.value)
    return '你已不在该群聊'
  if (groupDetail.value?.type === 'channel' && groupDetail.value.holderId !== auth.user?.id)
    return '广播群仅群主可发言'
  return ''
})

const { start: resetSendBlockedTimer } = useTimeoutFn(() => {
  sendBlockedMessage.value = ''
}, 1800)

onMounted(async () => {
  initialUnreadCount.value = getRouteUnreadCount()
  await auth.fetchMe()
  await chat.bootstrap()
  try {
    await chat.selectRoom(roomId.value)
  }
  catch {
    router.replace({ name: 'chat' })
    return
  }
  await loadConversationAccess()
  if (!canAccessCurrentRoom.value) {
    router.replace({ name: 'chat' })
    return
  }
  await scrollToInitialPosition()
  clearUnreadRouteQuery()
})

watch(
  () => chat.currentMessages.length,
  async (count, previousCount) => {
    if (!hasAppliedInitialScroll.value || count <= previousCount)
      return

    await nextTick()
    if (shouldScrollAfterOwnMessage.value || isNearBottom.value) {
      await scrollToBottomPosition()
      isNearBottom.value = true
      pendingNewMessageCount.value = 0
    }
    else {
      pendingNewMessageCount.value += count - previousCount
    }
    shouldScrollAfterOwnMessage.value = false
  },
)

function send(): void {
  if (isHistoricalGroupConversation.value) {
    showSendBlockedMessage()
    return
  }

  const value = draft.value
  draft.value = ''
  shouldScrollAfterOwnMessage.value = true
  chat.send(value)
}

function showSendBlockedMessage(): void {
  sendBlockedMessage.value = `你已被${removedByName.value}移出群聊`
  resetSendBlockedTimer()
}

function viewFriendRequest(message: Message): void {
  router.push({
    name: 'apply-detail',
    params: {
      roomId: message.roomId,
      messageId: message.id,
    },
  })
}

function shouldShowMessageTime(message: Message, previous?: Message): boolean {
  if (!previous)
    return true

  const currentTime = new Date(message.createdAt).getTime()
  const previousTime = new Date(previous.createdAt).getTime()
  if (Number.isNaN(currentTime) || Number.isNaN(previousTime))
    return false

  return currentTime - previousTime >= 5 * 60 * 1000
}

function closeComposerPanels(): void {
  composer.value?.closePicker()
}

async function loadConversationAccess(): Promise<void> {
  groupDetail.value = null
  if (!isGroupConversation.value)
    return

  const groupId = headerConversation.value?.groupId ?? roomId.value
  try {
    groupDetail.value = await chat.getGroup(groupId)
  }
  catch {
    groupDetail.value = null
  }
}

function getRouteUnreadCount(): number {
  const queryValue = route.query.unread
  const rawUnread = Array.isArray(queryValue) ? queryValue[0] : queryValue
  const count = Number(rawUnread)
  if (!Number.isFinite(count) || count <= 0)
    return 0
  return Math.floor(count)
}

function getItemSizeDependencies(item: MessageListItem): unknown[] {
  if (item.kind === 'unread-divider')
    return [item.unread]
  return [item.message.content, item.showTime, item.showSenderName]
}

async function jumpToSearchResult(message: Message): Promise<void> {
  const index = messageItems.value.findIndex(item => item.kind === 'message' && item.message.id === message.id)
  if (index >= 0) {
    closeSearchPanel()
    await waitForScrollerLayout()
    scrollToItem(index)
  }
}

function clearUnreadRouteQuery(): void {
  if (route.query.unread === undefined)
    return

  const query = { ...route.query }
  delete query.unread
  void router.replace({ query })
}

function openConversationProfile(): void {
  const conversation = headerConversation.value
  if (!conversation)
    return

  if (conversation.type === 'group' || conversation.type === 'channel' || conversation.groupId) {
    router.push({
      name: 'group-detail',
      params: { groupId: conversation.groupId ?? conversation.roomId },
      query: { source: 'chat' },
    })
    return
  }

  if (conversation.type !== 'friend')
    return

  const userId = conversation.friendId
    ?? chat.friends.find(item => item.roomId === conversation.roomId)?.friend.id
  if (!userId)
    return

  router.push({
    name: 'friend-detail',
    params: { userId },
    query: { source: 'chat' },
  })
}
</script>

<template>
  <AppShell :show-nav="false">
    <section class="relative grid h-full min-h-0 grid-rows-[44px_1fr_auto] bg-[var(--vc-page-bg)]">
      <ChatRoomHeader :conversation="headerConversation" @open-profile="openConversationProfile" @open-search="openSearchPanel" />

      <Transition name="wechat-pop">
        <button
          v-if="pendingNewMessageCount > 0"
          class="wechat-pressable absolute right-3 top-[58px] z-20 flex h-9 items-center gap-1.5 rounded-full border border-[var(--vc-border)] bg-[var(--vc-field-bg)] px-3 text-xs font-semibold text-[var(--vc-text-soft)] shadow-[0_10px_28px_rgba(0,0,0,.28)] backdrop-blur"
          type="button"
          :aria-label="`跳转到${pendingNewMessageCount}条新消息`"
          @click="jumpToLatestMessages"
        >
          <ChevronsUp :size="16" class="rotate-180 text-[#7ca8ff]" />
          <span>{{ pendingNewMessageCount }} 条新消息</span>
        </button>
      </Transition>

      <div ref="messageScrollerHost" class="min-h-0 overflow-hidden">
        <DynamicScroller
          ref="messageScroller"
          class="h-full min-h-0 overflow-y-auto bg-[var(--vc-page-bg)] px-3 py-4"
          :items="messageItems"
          key-field="id"
          :min-item-size="44"
          @scroll="handleMessageScroll"
          @pointerdown="closeComposerPanels"
        >
          <template #default="{ item, active, index }">
            <DynamicScrollerItem
              :item="item"
              :active="active"
              :index="index"
              :size-dependencies="getItemSizeDependencies(item)"
              class="py-1.5"
            >
              <Transition name="wechat-list">
                <div
                  v-if="item.kind === 'unread-divider'"
                  class="flex justify-center px-6 py-2"
                >
                  <span class="rounded-full bg-[var(--vc-field-bg)] px-3 py-1 text-xs leading-5 text-[var(--vc-text-muted)]">
                    以下为 {{ item.unread }} 条新消息
                  </span>
                </div>
              </Transition>
              <MessageBubble
                v-if="item.kind === 'message'"
                :message="item.message"
                :mine="item.mine"
                :show-time="item.showTime"
                :show-sender-name="item.showSenderName"
                @view-friend-request="viewFriendRequest"
              />
            </DynamicScrollerItem>
          </template>
        </DynamicScroller>
      </div>

      <MessageComposer v-if="shouldShowComposer" ref="composer" v-model="draft" :disabled="!draft.trim() || !chat.currentRoomId" @send="send" />
      <div v-else class="border-t border-[var(--vc-border)] bg-[var(--vc-surface-soft)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-center text-sm text-[var(--vc-text-muted)]">
        {{ composerStatusText }}
      </div>

      <Transition name="wechat-pop">
        <div
          v-if="sendBlockedMessage"
          class="pointer-events-none absolute bottom-[86px] left-1/2 z-40 max-w-[78%] -translate-x-1/2 rounded-[8px] bg-[#2f2f33]/95 px-4 py-2.5 text-center text-sm leading-5 text-white shadow-[0_12px_32px_rgba(0,0,0,.32)] backdrop-blur"
        >
          {{ sendBlockedMessage }}
        </div>
      </Transition>

      <Transition name="wechat-panel">
        <div v-if="isSearchOpen" class="absolute inset-0 z-30 flex flex-col bg-[var(--vc-page-bg)] text-[var(--vc-text)]">
          <form class="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--vc-border)] bg-[var(--vc-surface)] px-3" @submit.prevent="searchChatMessages">
            <button class="wechat-icon-button grid size-9 place-items-center text-[var(--vc-text-muted)]" type="button" title="关闭" @click="closeSearchPanel">
              <X :size="20" />
            </button>
            <label class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-[var(--vc-field-bg)] px-3 text-[var(--vc-text-muted)]">
              <Search :size="17" />
              <input
                v-model="searchQuery"
                class="min-w-0 flex-1 bg-transparent text-sm text-[var(--vc-text)] outline-none placeholder:text-[var(--vc-text-muted)]"
                placeholder="查找聊天记录"
                type="search"
                autofocus
              >
            </label>
            <button class="px-2 text-sm font-semibold text-[#3477f5]" type="submit">
              搜索
            </button>
          </form>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <p v-if="isSearchingMessages" class="px-4 py-8 text-center text-sm text-[#a4a3a8]">
              搜索中
            </p>
            <p v-else-if="searchQuery.trim() && !searchResults.length" class="px-4 py-8 text-center text-sm text-[#a4a3a8]">
              没有找到相关聊天记录
            </p>
            <button
              v-for="message in searchResults"
              :key="message.id"
              class="wechat-pressable flex w-full gap-3 border-b border-white/10 px-4 py-3 text-left active:bg-white/5"
              type="button"
              @click="jumpToSearchResult(message)"
            >
              <span class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[8px] bg-[#242427] text-xs text-[#a4a3a8]">
                {{ message.nickname.slice(0, 1) || message.userName.slice(0, 1) || '消' }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="truncate text-sm font-semibold">{{ message.nickname || message.userName || '系统消息' }}</span>
                  <span class="shrink-0 text-xs text-[#7d7d83]">{{ formatSearchTime(message.createdAt) }}</span>
                </span>
                <span class="mt-1 block truncate text-sm leading-5 text-[#c8c8ce]">{{ message.content }}</span>
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </section>
  </AppShell>
</template>
