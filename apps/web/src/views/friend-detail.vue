<script setup lang="ts">
import type { User } from '@/services/types'
import { ArrowLeft, ChevronRight, MoreHorizontal } from 'lucide-vue-next'
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { userConfirmed } from '@/utils/confirm'

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()
const user = shallowRef<User | null>(null)
const isLoading = shallowRef(true)
const isDeleting = shallowRef(false)
const error = shallowRef('')

const userId = computed(() => String(route.params.userId))
const friend = computed(() => chat.friends.find(item => item.friend.id === userId.value))
const isSelf = computed(() => auth.user?.id === userId.value)
const displayName = computed(() => user.value?.nickname || user.value?.userName || '好友')
const sourceText = computed(() => {
  if (route.query.source === 'phone')
    return '来自手机号搜索'
  if (route.query.source === 'chat')
    return '来自聊天会话'
  return '来自账号搜索'
})

onMounted(async () => {
  try {
    await Promise.all([auth.fetchMe(), chat.bootstrap()])
    user.value = await chat.getUser(userId.value)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '用户不存在'
  }
  finally {
    isLoading.value = false
  }
})

function goBack() {
  router.back()
}

function addFriend() {
  router.push({ name: 'send-friend-validate', params: { userId: userId.value } })
}

function openFriendInfo() {
  router.push({ name: 'friend-info', params: { userId: userId.value } })
}

async function sendMessage() {
  if (!friend.value)
    return
  await chat.selectRoom(friend.value.roomId)
  router.push({ name: 'chat-room', params: { roomId: friend.value.roomId } })
}

async function deleteFriend() {
  if (!friend.value || isDeleting.value)
    return
  if (!userConfirmed(`确定删除 ${displayName.value} 吗？`))
    return

  isDeleting.value = true
  try {
    await chat.removeFriend(userId.value)
    router.replace({ name: 'chat' })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '删除好友失败'
  }
  finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <AppShell :show-nav="false">
    <section class="flex h-full min-h-0 flex-col bg-[#0f0f0f] text-white">
      <div class="flex h-11 shrink-0 items-center bg-[#1c1c1e] px-3">
        <button class="grid size-9 place-items-center text-[#a4a3a8]" type="button" title="返回" @click="goBack">
          <ArrowLeft :size="24" />
        </button>
        <span class="min-w-0 flex-1" />
        <button class="grid size-9 place-items-center text-[#a4a3a8]" type="button" title="更多">
          <MoreHorizontal :size="22" />
        </button>
      </div>

      <div v-if="isLoading" class="px-4 py-10 text-center text-sm text-[#a4a3a8]">
        加载中
      </div>
      <p v-else-if="error" class="px-4 py-10 text-center text-sm text-red-300">
        {{ error }}
      </p>

      <template v-else-if="user">
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="bg-[#1c1c1e] px-4 py-6">
            <div class="flex items-center">
              <AvatarBadge :name="displayName" size="lg" />
              <div class="ml-4 min-w-0 flex-1">
                <p class="truncate text-xl font-semibold leading-8">
                  {{ displayName }}
                </p>
                <p class="mt-1 truncate text-sm text-[#a4a3a8]">
                  账号: {{ user.userName }}
                </p>
                <p class="mt-1 truncate text-sm text-[#a4a3a8]">
                  地区: {{ user.province }} {{ user.city }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-3 bg-[#1c1c1e]">
            <button class="flex min-h-[56px] w-full items-center border-b border-white/10 px-4 text-left active:bg-white/5" type="button" @click="openFriendInfo">
              <span class="min-w-0 flex-1 text-base font-semibold">朋友资料</span>
              <ChevronRight class="text-[#a4a3a8]" :size="18" />
            </button>
            <div class="flex min-h-[52px] items-center px-4">
              <span class="w-20 shrink-0 text-sm text-[#a4a3a8]">来源</span>
              <span class="min-w-0 flex-1 truncate text-right text-sm text-white">{{ sourceText }}</span>
            </div>
          </div>

          <p v-if="error" class="px-4 py-3 text-center text-sm text-red-300">
            {{ error }}
          </p>
        </div>

        <div class="shrink-0 border-t border-white/10 bg-[#1c1c1e] px-4 py-4">
          <button
            v-if="friend"
            class="flex h-11 w-full items-center justify-center rounded-[8px] bg-[#3477f5] text-sm font-semibold text-white active:bg-[#2d67d6]"
            type="button"
            @click="sendMessage"
          >
            发消息
          </button>
          <button
            v-if="friend"
            class="mt-3 flex h-11 w-full items-center justify-center rounded-[8px] bg-[#2a1517] text-sm font-semibold text-[#ff6b6b] active:bg-[#3a1b1e] disabled:opacity-60"
            type="button"
            :disabled="isDeleting"
            @click="deleteFriend"
          >
            {{ isDeleting ? '删除中' : '删除好友' }}
          </button>
          <button
            v-else-if="!isSelf"
            class="flex h-11 w-full items-center justify-center rounded-[8px] bg-[#3477f5] text-sm font-semibold text-white active:bg-[#2d67d6]"
            type="button"
            @click="addFriend"
          >
            添加好友
          </button>
          <p v-else class="py-5 text-center text-sm text-[#a4a3a8]">
            这是你自己
          </p>
        </div>
      </template>
    </section>
  </AppShell>
</template>
