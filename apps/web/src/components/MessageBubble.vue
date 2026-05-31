<script setup lang="ts">
import type { Message } from '@/services/types'
import { computed } from 'vue'

const props = defineProps<{
  message: Message
  mine: boolean
  showTime?: boolean
  showSenderName?: boolean
}>()

const emit = defineEmits<{
  viewFriendRequest: [message: Message]
}>()

const isPendingFriendRequest = computed(() =>
  !props.mine
  && props.message.type === 'validate'
  && props.message.state === 'friend'
  && props.message.status === '0'
  && Boolean(props.message.senderId),
)

const isAcceptedFriendRequest = computed(() =>
  props.message.type === 'validate'
  && props.message.state === 'friend'
  && props.message.status === '1',
)

const isNotice = computed(() => props.message.style === 'notice' || props.message.type === 'org')
const displayName = computed(() => props.message.nickname || props.message.userName)
const formattedTime = computed(() => {
  const date = new Date(props.message.createdAt)
  if (Number.isNaN(date.getTime()))
    return ''

  const now = new Date()
  const isToday = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

  if (isToday)
    return time
  return `${date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} ${time}`
})
</script>

<template>
  <Transition name="wechat-list">
    <div v-if="showTime && formattedTime" class="flex justify-center px-6">
      <span class="rounded-[6px] bg-white/5 px-2 py-0.5 text-[11px] leading-5 text-[#85858a]">
        {{ formattedTime }}
      </span>
    </div>
  </Transition>

  <div v-if="isNotice" class="wechat-message flex justify-center px-6">
    <span class="max-w-full rounded-full bg-[#2a2a2d] px-3 py-1.5 text-center text-xs leading-5 text-[#b7b7bc]">
      {{ message.content }}
    </span>
  </div>

  <div v-else class="wechat-message flex" :class="[mine ? 'justify-end pl-12' : 'justify-start pr-12', mine ? 'wechat-message--mine' : '']">
    <div class="flex max-w-[78%] flex-col" :class="mine ? 'items-end' : 'items-start'">
      <div v-if="showSenderName && !mine" class="mb-1 px-1 text-xs leading-4 text-[#8c8c92]">
        {{ displayName }}
      </div>
      <div
        class="min-h-9 rounded-[10px] px-3 py-2 text-[15px] leading-6 shadow-sm"
        :class="mine ? 'wechat-bubble-outgoing rounded-tr-[3px]' : 'wechat-bubble-incoming rounded-tl-[3px]'"
      >
        {{ message.content }}
        <button v-if="isPendingFriendRequest" class="wechat-pressable mt-3 block rounded-[8px] bg-[#3477f5] px-3 py-1.5 text-sm font-semibold text-white" type="button" @click="emit('viewFriendRequest', message)">
          查看
        </button>
        <span v-else-if="isAcceptedFriendRequest" class="mt-3 block text-xs text-[#a4a3a8]">已同意</span>
      </div>
    </div>
  </div>
</template>
