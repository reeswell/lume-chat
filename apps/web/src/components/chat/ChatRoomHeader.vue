<script setup lang="ts">
import type { Conversation } from '@/services/types'
import { ChevronLeft, Search } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import AvatarBadge from '@/components/AvatarBadge.vue'

defineProps<{
  conversation?: Conversation
}>()

const emit = defineEmits<{
  openProfile: []
  openSearch: []
}>()

const router = useRouter()
</script>

<template>
  <header class="flex h-11 items-center gap-2 bg-[#1c1c1e] px-2 text-white">
    <button class="wechat-pressable flex h-full items-center gap-0.5 pr-2 text-sm text-white" type="button" @click="router.back()">
      <ChevronLeft :size="22" />
      返回
    </button>
    <div v-if="conversation" class="min-w-0 flex-1 text-center">
      <h1 class="truncate text-base font-semibold">
        {{ conversation.title }}
      </h1>
    </div>
    <p v-else class="min-w-0 flex-1 text-center text-sm text-white/60">
      选择一个会话
    </p>
    <button
      v-if="conversation"
      class="wechat-icon-button grid size-9 place-items-center rounded-[8px] active:bg-white/10"
      type="button"
      :aria-label="`查找${conversation.title}聊天记录`"
      @click="emit('openSearch')"
    >
      <Search :size="18" />
    </button>
    <button
      v-if="conversation"
      class="wechat-icon-button grid size-9 place-items-center rounded-[8px] active:bg-white/10"
      type="button"
      :aria-label="`查看${conversation.title}资料`"
      @click="emit('openProfile')"
    >
      <AvatarBadge :name="conversation.title" size="sm" />
    </button>
    <span v-else class="w-11" />
  </header>
</template>
