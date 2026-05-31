<script setup lang="ts">
import type { ChatGroupDetail, User } from '@/services/types'
import { ArrowLeft, Check, Search } from 'lucide-vue-next'
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RecycleScroller } from 'vue-virtual-scroller'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()
const group = shallowRef<ChatGroupDetail | null>(null)
const query = shallowRef('')
const selectedIds = shallowRef<Set<string>>(new Set())
const error = shallowRef('')
const isLoading = shallowRef(true)
const isSubmitting = shallowRef(false)

const groupId = computed(() => String(route.params.groupId))
const memberIds = computed(() => new Set(group.value?.members.map(member => member.userId) ?? []))
const isOwner = computed(() => group.value?.members.some(member => member.userId === auth.user?.id && member.holder) ?? false)
const needsOwnerApproval = computed(() => Boolean(group.value?.joinApproval && !isOwner.value))
const candidates = computed(() =>
  chat.friends
    .map(item => item.friend)
    .filter(friend => friend.id !== auth.user?.id && !memberIds.value.has(friend.id)),
)
const filteredCandidates = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword)
    return candidates.value
  return candidates.value.filter((friend) => {
    const fields = [friend.nickname, friend.userName, friend.email, friend.province, friend.city]
    return fields.some(field => field.toLowerCase().includes(keyword))
  })
})
const selectedCount = computed(() => selectedIds.value.size)
const canSubmit = computed(() => selectedCount.value > 0 && !isSubmitting.value)

onMounted(async () => {
  try {
    await Promise.all([auth.fetchMe(), chat.bootstrap()])
    group.value = await chat.getGroup(groupId.value)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '群组不存在'
  }
  finally {
    isLoading.value = false
  }
})

function goBack() {
  router.back()
}

function isSelected(userId: string) {
  return selectedIds.value.has(userId)
}

function toggleUser(user: User) {
  const next = new Set(selectedIds.value)
  if (next.has(user.id))
    next.delete(user.id)
  else next.add(user.id)
  selectedIds.value = next
}

async function submit() {
  if (!canSubmit.value)
    return

  isSubmitting.value = true
  error.value = ''
  try {
    await chat.inviteGroupMembers(groupId.value, Array.from(selectedIds.value))
    router.replace({ name: 'group-detail', params: { groupId: groupId.value }, query: { invited: String(selectedCount.value) } })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '邀请失败'
  }
  finally {
    isSubmitting.value = false
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
        <h1 class="min-w-0 flex-1 text-center text-base font-semibold">
          邀请成员
        </h1>
        <button class="h-9 px-2 text-sm font-semibold text-[#3477f5] disabled:text-[#6f6f73]" type="button" :disabled="!canSubmit" @click="submit">
          {{ isSubmitting ? '邀请中' : selectedCount ? `完成(${selectedCount})` : '完成' }}
        </button>
      </div>

      <div class="shrink-0 bg-[#1c1c1e] px-4 py-3">
        <div class="flex h-10 items-center rounded-full bg-[#0b0b0c] px-3">
          <Search :size="18" class="shrink-0 text-[#a4a3a8]" />
          <input
            v-model="query"
            class="ml-2 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#6f6f73]"
            placeholder="搜索好友"
            type="search"
          >
        </div>
      </div>

      <div v-if="isLoading" class="px-4 py-10 text-center text-sm text-[#a4a3a8]">
        加载中
      </div>
      <template v-else>
        <p v-if="needsOwnerApproval" class="px-4 py-2 text-xs leading-5 text-[#7ca8ff]">
          群主已开启入群验证，你的邀请会发送给群主确认。
        </p>

        <RecycleScroller
          v-if="filteredCandidates.length"
          class="min-h-0 flex-1 overflow-y-auto bg-[#1c1c1e]"
          :items="filteredCandidates"
          key-field="id"
          :item-size="62"
        >
          <template #default="{ item: friend }">
            <button
              class="flex h-[62px] w-full items-center border-b border-white/10 px-4 text-left active:bg-white/5"
              type="button"
              @click="toggleUser(friend)"
            >
              <span
                class="grid size-6 shrink-0 place-items-center rounded-full border"
                :class="isSelected(friend.id) ? 'border-[#3477f5] bg-[#3477f5] text-white' : 'border-[#5f5f63] text-transparent'"
              >
                <Check :size="16" />
              </span>
              <AvatarBadge :src="friend.avatar" :name="friend.nickname || friend.userName" size="sm" class="ml-3" />
              <span class="ml-3 min-w-0 flex-1">
                <span class="block truncate text-sm">{{ friend.nickname || friend.userName }}</span>
                <span class="mt-0.5 block truncate text-xs text-[#a4a3a8]">账号: {{ friend.userName }}</span>
              </span>
            </button>
          </template>
        </RecycleScroller>

        <div v-else class="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
          <p class="text-base text-[#a4a3a8]">
            {{ query ? '没有匹配的好友' : '暂无可邀请的好友' }}
          </p>
          <p class="mt-2 text-xs leading-5 text-[#6f6f73]">
            只有你的好友且尚未在群里的联系人可以被邀请。
          </p>
        </div>

        <p v-if="error" class="px-4 py-3 text-center text-sm text-red-300">
          {{ error }}
        </p>
      </template>

      <div class="shrink-0 border-t border-white/10 bg-[#1c1c1e] px-4 py-3">
        <button
          class="flex h-11 w-full items-center justify-center rounded-[8px] bg-[#3477f5] text-sm font-semibold text-white active:bg-[#2d67d6] disabled:bg-[#243453] disabled:text-[#7f8796]"
          type="button"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ isSubmitting ? '邀请中' : selectedCount ? (needsOwnerApproval ? `发送邀请(${selectedCount})` : `邀请 ${selectedCount} 人`) : '选择好友' }}
        </button>
      </div>
    </section>
  </AppShell>
</template>
