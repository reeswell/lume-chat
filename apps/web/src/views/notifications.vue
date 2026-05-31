<script setup lang="ts">
import type { Message } from '@/services/types'
import { ChevronRight } from 'lucide-vue-next'
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { RecycleScroller } from 'vue-virtual-scroller'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'

const auth = useAuthStore()
const chat = useChatStore()
const router = useRouter()

const systemRoomId = computed(() => chat.systemConversation?.roomId ?? '')
const notifications = computed(() =>
  (systemRoomId.value ? chat.messagesByRoom[systemRoomId.value] ?? [] : [])
    .filter(message => message.type === 'validate' || message.type === 'info')
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
)

onMounted(async () => {
  await auth.fetchMe()
  await chat.bootstrap()
  await openSystemRoom()
})

watch(systemRoomId, async (roomId) => {
  if (!roomId)
    return
  await openSystemRoom()
})

async function openSystemRoom() {
  if (!systemRoomId.value)
    return
  await chat.selectRoom(systemRoomId.value)
}

function goBack() {
  router.back()
}

function goDetail(message: Message) {
  if (message.type !== 'validate')
    return
  router.push({ name: 'apply-detail', params: { roomId: message.roomId, messageId: message.id } })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getActionText(message: Message) {
  if (message.type !== 'validate')
    return '已查看'
  if (message.status === '0')
    return '查看'
  if (message.status === '2')
    return '已拒绝'
  return '已同意'
}

function getSummary(message: Message) {
  if (message.type === 'validate' && message.state === 'group')
    return `申请加入群聊：${message.content}`
  return message.content
}
</script>

<template>
  <AppShell :show-nav="false">
    <section class="flex h-full min-h-0 flex-col bg-[#0f0f0f] text-white">
      <div class="flex h-11 shrink-0 items-center bg-[#0f0f0f] px-3">
        <button class="h-full pr-3 text-sm" type="button" @click="goBack">
          返回
        </button>
        <h1 class="min-w-0 flex-1 text-center text-base font-semibold">
          通知
        </h1>
        <span class="w-10" />
      </div>

      <RecycleScroller
        class="min-h-0 flex-1 overflow-y-auto"
        :items="notifications"
        key-field="id"
        :item-size="76"
      >
        <template #default="{ item: message }">
          <button
            class="flex h-[76px] w-full items-center bg-[#1c1c1e] px-3 py-2 text-left active:bg-white/5"
            type="button"
            @click="goDetail(message)"
          >
            <AvatarBadge :src="message.avatar" :name="message.nickname || message.userName" />
            <span class="ml-3 flex min-w-0 flex-1 flex-col">
              <span class="flex min-w-0 items-center">
                <span class="min-w-0 flex-1 truncate text-base font-semibold">{{ message.nickname || message.userName }}</span>
                <span class="ml-2 shrink-0 text-[10px] text-[#a4a3a8]">{{ formatTime(message.createdAt) }}</span>
              </span>
              <span class="mt-1 line-clamp-2 text-sm leading-5 text-[#a4a3a8]">{{ getSummary(message) }}</span>
            </span>
            <span class="ml-3 shrink-0">
              <span
                v-if="message.type === 'validate'"
                class="inline-flex h-7 min-w-12 items-center justify-center rounded-[8px] px-2 text-xs"
                :class="message.status === '0' ? 'bg-[#3477f5] text-white' : 'bg-white/10 text-[#a4a3a8]'"
              >
                {{ getActionText(message) }}
              </span>
              <ChevronRight v-else class="text-[#a4a3a8]" :size="18" />
            </span>
          </button>
        </template>
        <template #empty>
          <p v-if="!notifications.length" class="px-4 py-10 text-center text-sm text-[#a4a3a8]">
            暂无通知
          </p>
        </template>
      </RecycleScroller>
    </section>
  </AppShell>
</template>
