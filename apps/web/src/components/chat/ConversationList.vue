<script setup lang="ts">
import type { Conversation } from '@/services/types'
import { Plus, Search } from 'lucide-vue-next'
import { computed, shallowRef } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import AvatarBadge from '@/components/AvatarBadge.vue'

const props = defineProps<{
  conversations: Conversation[]
  currentRoomId: string
  onlineUsers: Record<string, string>
}>()

const emit = defineEmits<{
  selectRoom: [roomId: string]
  openMenu: []
}>()

const filter = shallowRef('')
const activeTab = shallowRef<'all' | 'group' | 'unread'>('all')

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'group', label: '群聊' },
  { key: 'unread', label: '未读' },
] as const

const filteredConversations = computed(() => {
  const keyword = filter.value.trim().toLowerCase()
  return props.conversations.filter((item) => {
    const matchesKeyword = !keyword || item.title.toLowerCase().includes(keyword) || item.lastMessage.toLowerCase().includes(keyword)
    const matchesTab = activeTab.value === 'all' || (activeTab.value === 'group' ? item.type === 'group' || item.type === 'channel' : item.unread > 0)
    return matchesKeyword && matchesTab
  })
})

const activeTabIndex = computed(() => tabs.findIndex(tab => tab.key === activeTab.value))
const groupUnread = computed(() => props.conversations.filter(item => (item.type === 'group' || item.type === 'channel') && item.unread > 0).length)
const allUnread = computed(() => props.conversations.reduce((total, item) => total + item.unread, 0))
const unreadCount = computed(() => props.conversations.filter(item => item.unread > 0).length)

function getBadge(tab: (typeof tabs)[number]['key']) {
  if (tab === 'all')
    return allUnread.value
  if (tab === 'group')
    return groupUnread.value
  return unreadCount.value
}

function formatTime(value?: string) {
  if (!value)
    return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function isOnline(conversation: Conversation) {
  return Boolean(props.onlineUsers[conversation.title])
}

function selectRoom(roomId: string) {
  emit('selectRoom', roomId)
}
</script>

<template>
  <section class="flex h-full min-h-0 flex-col bg-[#0f0f0f] text-white">
    <div class="flex h-11 shrink-0 items-center justify-between bg-[#1c1c1e] px-4">
      <span class="w-8" />
      <h1 class="text-base font-semibold">
        聊天
      </h1>
      <button class="wechat-icon-button grid size-8 place-items-center text-white" type="button" title="添加" @click="emit('openMenu')">
        <Plus :size="20" />
      </button>
    </div>
    <div class="bg-[#1c1c1e] px-3 py-2">
      <label class="wechat-pressable flex h-9 items-center gap-2 rounded-full bg-[#0f0f0f] px-3 text-[#a4a3a8] focus-within:bg-[#151519] focus-within:text-[#d7d7dd]">
        <Search :size="18" />
        <input v-model="filter" class="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-center placeholder:text-[#a4a3a8]" placeholder="搜索">
      </label>
    </div>

    <div class="relative h-11 shrink-0 bg-[#1c1c1e]">
      <span
        class="absolute bottom-0 left-0 h-0.5 w-[83px] rounded-full bg-[#3477f5] transition-transform duration-200 ease-out"
        :style="{ transform: `translateX(${Math.max(activeTabIndex, 0) * 83}px)` }"
      />
      <div class="flex h-full w-[250px] items-center">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="wechat-pressable relative h-full flex-1 text-sm"
          :class="activeTab === tab.key ? 'font-semibold text-[#3477f5]' : 'text-white/70'"
          type="button"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <Transition name="wechat-badge">
            <span v-if="getBadge(tab.key)" class="absolute right-3 top-1 min-w-4 rounded-full bg-[#3477f5] px-1 text-[10px] leading-4 text-white">{{ getBadge(tab.key) }}</span>
          </Transition>
        </button>
      </div>
    </div>

    <RecycleScroller
      class="wechat-scroll min-h-0 flex-1 overflow-y-auto"
      :items="filteredConversations"
      key-field="id"
      :item-size="76"
    >
      <template #default="{ item: conversation }">
        <button
          class="wechat-pressable relative flex h-[76px] w-full items-center px-3 text-left active:bg-white/5"
          :class="conversation.roomId === currentRoomId ? 'bg-white/5' : ''"
          type="button"
          @click="selectRoom(conversation.roomId)"
        >
          <AvatarBadge :src="conversation.avatar" :name="conversation.title" :online="isOnline(conversation)" />
          <span class="ml-3 flex h-14 min-w-0 flex-1 flex-col border-b border-white/10" :class="conversation.unread ? 'pr-10' : 'pr-3'">
            <span class="flex items-center pr-11">
              <span class="min-w-0 flex-1 truncate text-base font-semibold">{{ conversation.title }}</span>
            </span>
            <span class="mt-1 block truncate text-sm text-[#a4a3a8]">{{ conversation.lastMessage || '暂无消息' }}</span>
          </span>
          <span v-if="conversation.lastMessageAt" class="absolute right-3 top-[14px] shrink-0 text-[10px] text-[#a4a3a8]">{{ formatTime(conversation.lastMessageAt) }}</span>
          <Transition name="wechat-badge">
            <span v-if="conversation.unread" class="absolute right-4 top-[30px] grid min-w-5 place-items-center rounded-full bg-[#3477f5] px-1.5 py-0.5 text-xs font-semibold text-white">{{ conversation.unread }}</span>
          </Transition>
        </button>
      </template>
      <template #empty>
        <Transition name="wechat-list">
          <p v-if="!filteredConversations.length" class="px-4 py-10 text-center text-sm text-[#a4a3a8]">
            暂无会话
          </p>
        </Transition>
      </template>
    </RecycleScroller>
  </section>
</template>
