<script setup lang="ts">
import type { ChatGroupDetail } from '@/services/types'
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()

const roomId = computed(() => String(route.params.roomId))
const messageId = computed(() => String(route.params.messageId))
const request = computed(() => chat.messagesByRoom[roomId.value]?.find(message => message.id === messageId.value))
const group = shallowRef<ChatGroupDetail | null>(null)
const isGroupRequest = computed(() => request.value?.state === 'group')
const requestTitle = computed(() => request.value?.nickname || request.value?.userName || '用户')
const requestDesc = computed(() => isGroupRequest.value ? `申请加入 ${group.value?.title || '群聊'}` : '添加您为好友')
const handledText = computed(() => {
  if (request.value?.status === '1')
    return isGroupRequest.value ? '已同意入群' : '已同意'
  if (request.value?.status === '2')
    return '已拒绝'
  return ''
})

onMounted(async () => {
  await auth.fetchMe()
  await chat.bootstrap()
  await chat.loadMessages(roomId.value)
  if (request.value?.targetGroupId)
    group.value = await chat.getGroup(request.value.targetGroupId)
})

function goBack() {
  router.back()
}

async function agree() {
  if (!request.value?.senderId)
    return
  if (isGroupRequest.value) {
    await chat.acceptGroupRequest(request.value.id)
    router.push({ name: 'chat' })
    return
  }
  await chat.acceptFriend(request.value.senderId)
  router.push({ name: 'chat' })
}

async function reject() {
  if (!request.value || !isGroupRequest.value)
    return
  await chat.rejectGroupRequest(request.value.id)
  router.push({ name: 'notifications' })
}
</script>

<template>
  <AppShell :show-nav="false">
    <section class="h-full overflow-y-auto bg-[#0f0f0f] text-white">
      <div class="flex h-11 items-center bg-[#0f0f0f] px-3">
        <button class="h-full pr-3 text-sm" type="button" @click="goBack">
          返回
        </button>
        <h1 class="min-w-0 flex-1 text-center text-base font-semibold">
          通知
        </h1>
        <span class="w-10" />
      </div>

      <div v-if="request" class="border-b border-white/10 bg-[#1c1c1e]">
        <div class="flex h-[76px] items-center px-3">
          <AvatarBadge :src="request.avatar" :name="request.nickname || request.userName" />
          <div class="ml-3 min-w-0 flex-1">
            <p class="truncate text-base font-semibold">
              {{ requestTitle }}
            </p>
            <p class="mt-1 truncate text-sm text-[#a4a3a8]">
              账号: {{ request.userName }}
            </p>
            <p class="mt-1 truncate text-xs text-[#a4a3a8]">
              {{ requestDesc }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="request" class="flex px-4 py-3 text-sm">
        <span class="shrink-0 pr-5 text-[#a4a3a8]">验证信息</span>
        <span class="min-w-0 flex-1 text-white">{{ request.content || `我是 ${request.nickname || request.userName}` }}</span>
      </div>

      <div v-if="request?.status === '0'" class="mt-5 space-y-5 px-4">
        <button class="h-11 w-full rounded-full bg-[#3477f5] text-sm font-semibold text-white" type="button" @click="agree">
          同意
        </button>
        <button v-if="isGroupRequest" class="h-11 w-full rounded-full bg-[#2a1517] text-sm font-semibold text-[#ff6b6b]" type="button" @click="reject">
          拒绝
        </button>
      </div>
      <p v-else-if="request" class="mt-5 text-center text-sm text-[#a4a3a8]">
        {{ handledText }}
      </p>
      <p v-else class="px-4 py-10 text-center text-sm text-[#a4a3a8]">
        通知不存在
      </p>
    </section>
  </AppShell>
</template>
