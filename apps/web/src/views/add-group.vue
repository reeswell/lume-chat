<script setup lang="ts">
import type { ChatGroup } from '@/services/types'
import { ArrowLeft, Search, UsersRound } from 'lucide-vue-next'
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RecycleScroller } from 'vue-virtual-scroller'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
const route = useRoute()
const router = useRouter()
const query = shallowRef('')
const groups = shallowRef<ChatGroup[]>([])
const isSearching = shallowRef(false)
const error = shallowRef('')

const activeGroupIdSet = computed(() => new Set(chat.groups.filter(item => !item.removedAt).map(item => item.id)))
const statusText = computed(() => route.query.requestSent === '1' ? '入群申请已发送，等待群主确认' : '')

function goBack() {
  router.back()
}

async function search() {
  const keyword = query.value.trim()
  if (!keyword || isSearching.value)
    return

  isSearching.value = true
  error.value = ''
  try {
    await chat.bootstrap()
    groups.value = await chat.searchGroups(keyword)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '搜索失败'
  }
  finally {
    isSearching.value = false
  }
}

function openGroup(groupId: string) {
  router.push({ name: 'group-detail', params: { groupId } })
}
</script>

<template>
  <AppShell :show-nav="false">
    <section class="flex h-full min-h-0 flex-col bg-[#0f0f0f] text-white">
      <div class="flex h-11 shrink-0 items-center bg-[#1c1c1e] px-3">
        <button class="grid size-9 place-items-center text-[#a4a3a8]" type="button" title="返回" @click="goBack">
          <ArrowLeft :size="24" />
        </button>
        <h1 class="min-w-0 flex-1 text-center text-base font-semibold">
          添加群组
        </h1>
        <span class="w-9" />
      </div>

      <form class="bg-[#1c1c1e] px-3 py-3" @submit.prevent="search">
        <label class="flex h-10 items-center gap-2 rounded-[8px] bg-[#0f0f0f] px-3 text-[#a4a3a8]">
          <Search :size="18" />
          <input v-model="query" class="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-[#5f5f63]" placeholder="群名称 / 群号">
          <button class="shrink-0 text-sm font-semibold text-[#3477f5]" type="submit">搜索</button>
        </label>
      </form>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <p v-if="statusText" class="mx-3 mt-3 rounded-[8px] bg-[#3477f5]/15 px-3 py-2 text-sm text-[#7ca8ff]">
          {{ statusText }}
        </p>
        <p v-if="error" class="px-4 py-3 text-center text-sm text-red-300">
          {{ error }}
        </p>

        <RecycleScroller
          v-if="groups.length"
          class="mt-3 h-[calc(100%-0.75rem)] bg-[#1c1c1e]"
          :items="groups"
          key-field="id"
          :item-size="68"
        >
          <template #default="{ item: group }">
            <button class="flex h-[68px] w-full items-center px-3 text-left active:bg-white/5" type="button" @click="openGroup(group.id)">
              <AvatarBadge :src="group.img" :name="group.title" />
              <span class="ml-3 flex min-w-0 flex-1 flex-col border-b border-white/10 py-3">
                <span class="truncate text-base font-semibold">{{ group.title }}</span>
                <span class="mt-1 truncate text-xs text-[#a4a3a8]">{{ group.userNum }} 人 · {{ group.groupCode }}</span>
              </span>
              <span class="ml-3 shrink-0 rounded-[8px] px-3 py-2 text-sm font-semibold" :class="activeGroupIdSet.has(group.id) ? 'bg-white/10 text-[#a4a3a8]' : 'bg-[#3477f5] text-white'">
                {{ activeGroupIdSet.has(group.id) ? '已加入' : '查看' }}
              </span>
            </button>
          </template>
        </RecycleScroller>

        <div v-else class="px-8 py-12 text-center text-[#a4a3a8]">
          <UsersRound class="mx-auto mb-4 text-[#3477f5]" :size="34" />
          <p class="text-sm leading-6">
            输入群名称或群号，先查看群资料，再发送入群验证。
          </p>
        </div>
      </div>
    </section>
  </AppShell>
</template>
