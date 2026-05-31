<script setup lang="ts">
import type { User } from '@/services/types'
import { ArrowLeft } from 'lucide-vue-next'
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
const route = useRoute()
const router = useRouter()
const user = shallowRef<User | null>(null)
const error = shallowRef('')

const userId = computed(() => String(route.params.userId))

onMounted(async () => {
  try {
    await chat.bootstrap()
    user.value = await chat.getUser(userId.value)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '用户不存在'
  }
})

function goBack() {
  router.back()
}

const isFriend = computed(() => chat.friends.some(item => item.friend.id === userId.value))
</script>

<template>
  <AppShell :show-nav="false">
    <section class="h-full overflow-y-auto bg-[#0f0f0f] text-white">
      <div class="flex h-11 items-center bg-[#1c1c1e] px-3">
        <button class="grid size-9 place-items-center text-[#a4a3a8]" type="button" title="返回" @click="goBack">
          <ArrowLeft :size="24" />
        </button>
        <h1 class="min-w-0 flex-1 text-center text-base font-semibold">
          朋友资料
        </h1>
        <span class="w-9" />
      </div>

      <p v-if="error" class="px-4 py-10 text-center text-sm text-red-300">
        {{ error }}
      </p>
      <div v-else-if="user" class="mt-3 bg-[#1c1c1e]">
        <div class="flex min-h-[52px] items-center border-b border-white/10 px-4">
          <span class="w-24 shrink-0 text-sm text-[#a4a3a8]">昵称</span>
          <span class="min-w-0 flex-1 truncate text-right text-sm">{{ user.nickname || '-' }}</span>
        </div>
        <div class="flex min-h-[52px] items-center border-b border-white/10 px-4">
          <span class="w-24 shrink-0 text-sm text-[#a4a3a8]">账号</span>
          <span class="min-w-0 flex-1 truncate text-right text-sm">{{ user.userName }}</span>
        </div>
        <div class="flex min-h-[52px] items-center border-b border-white/10 px-4">
          <span class="w-24 shrink-0 text-sm text-[#a4a3a8]">地区</span>
          <span class="min-w-0 flex-1 truncate text-right text-sm">{{ user.province }} {{ user.city }}</span>
        </div>
        <div v-if="isFriend" class="flex min-h-[52px] items-center border-b border-white/10 px-4">
          <span class="w-24 shrink-0 text-sm text-[#a4a3a8]">性别</span>
          <span class="min-w-0 flex-1 truncate text-right text-sm">{{ user.gender || '-' }}</span>
        </div>
        <div v-if="isFriend" class="flex min-h-[52px] items-center border-b border-white/10 px-4">
          <span class="w-24 shrink-0 text-sm text-[#a4a3a8]">年龄</span>
          <span class="min-w-0 flex-1 truncate text-right text-sm">{{ user.age }}</span>
        </div>
        <div v-if="isFriend" class="px-4 py-3">
          <p class="mb-2 text-sm text-[#a4a3a8]">
            个性签名
          </p>
          <p class="min-h-16 rounded-[8px] border border-white/10 bg-[#0f0f0f] px-3 py-2 text-sm leading-6">
            {{ user.signature || '这个人很懒，暂时没有签名哦！' }}
          </p>
        </div>
        <p v-else class="px-4 py-4 text-sm leading-6 text-[#a4a3a8]">
          你们还不是好友，仅展示昵称、账号和地区等公开信息。
        </p>
      </div>
    </section>
  </AppShell>
</template>
