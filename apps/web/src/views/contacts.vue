<script setup lang="ts">
import type { ChatGroup, User } from '@/services/types'
import { watchDebounced } from '@vueuse/core'
import { ChevronRight, Search, UserCheck, UserPlus } from 'lucide-vue-next'
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RecycleScroller } from 'vue-virtual-scroller'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useChatStore } from '@/stores/chat'

type SearchResultItem
  = | { id: string, kind: 'user', user: User }
    | { id: string, kind: 'group', group: ChatGroup }

const chat = useChatStore()
const route = useRoute()
const router = useRouter()
const q = shallowRef('')
const foundUsers = shallowRef<User[]>([])
const foundGroups = shallowRef<ChatGroup[]>([])
const status = shallowRef('')
const activeTab = shallowRef<'friends' | 'groups'>('friends')

const tabs = [
  { key: 'friends', label: '好友' },
  { key: 'groups', label: '群组' },
] as const

const searchResults = computed<SearchResultItem[]>(() => [
  ...foundUsers.value.map(user => ({ id: `user-${user.id}`, kind: 'user' as const, user })),
  ...foundGroups.value.map(group => ({ id: `group-${group.id}`, kind: 'group' as const, group })),
])
const activeTabIndex = computed(() => tabs.findIndex(tab => tab.key === activeTab.value))
const hasResults = computed(() => searchResults.value.length > 0)
const isSearching = computed(() => q.value.trim().length > 0)
const friendIdSet = computed(() => new Set(chat.friends.map(item => item.friend.id)))
const activeGroupIdSet = computed(() => new Set(chat.groups.filter(item => !item.removedAt).map(item => item.id)))

onMounted(() => {
  void chat.bootstrap()
  if (route.query.requestSent === '1')
    status.value = '好友申请已发送'
})

watchDebounced(q, () => {
  void search()
}, { debounce: 300 })

watch(
  () => chat.friends.map(item => item.friend.id).join(','),
  () => {
    if (!status.value)
      return
    const requestedId = typeof route.query.userId === 'string' ? route.query.userId : ''
    if (!requestedId || friendIdSet.value.has(requestedId))
      status.value = ''
  },
)

async function search() {
  const keyword = q.value.trim()
  if (!keyword) {
    foundUsers.value = []
    foundGroups.value = []
    return
  }
  const [users, groups] = await Promise.all([chat.searchUsers(keyword), chat.searchGroups(keyword)])
  foundUsers.value = users
  foundGroups.value = groups
}

function openUser(userId: string) {
  router.push({ name: 'friend-detail', params: { userId } })
}

async function openFriend(roomId: string) {
  await chat.selectRoom(roomId)
  router.push({ name: 'chat-room', params: { roomId } })
}

function openGroupDetail(groupId: string) {
  router.push({ name: 'group-detail', params: { groupId } })
}

async function openGroup(groupId: string) {
  await chat.selectRoom(groupId)
  router.push({ name: 'chat-room', params: { roomId: groupId } })
}
</script>

<template>
  <AppShell>
    <section class="flex h-full min-h-0 flex-col bg-[#0f0f0f] text-white">
      <div class="flex h-11 shrink-0 items-center justify-center bg-[#1c1c1e] px-4">
        <h1 class="text-base font-semibold">
          联系人
        </h1>
      </div>

      <form class="bg-[#1c1c1e] px-3 py-2" @submit.prevent="search">
        <label class="wechat-pressable flex h-9 items-center gap-2 rounded-full bg-[#0f0f0f] px-3 text-[#a4a3a8] focus-within:bg-[#151519] focus-within:text-[#d7d7dd]">
          <Search :size="18" />
          <input v-model="q" class="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-center placeholder:text-[#a4a3a8]" placeholder="搜索账号或群">
          <button class="wechat-icon-button grid size-7 place-items-center text-[#a4a3a8]" type="submit" title="搜索">
            <Search :size="16" />
          </button>
        </label>
      </form>

      <div class="relative flex h-11 shrink-0 items-center bg-[#1c1c1e]">
        <span
          class="absolute bottom-0 left-0 h-0.5 w-[75px] rounded-full bg-[#3477f5] transition-transform duration-200 ease-out"
          :style="{ transform: `translateX(${Math.max(activeTabIndex, 0) * 75}px)` }"
        />
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="wechat-pressable h-full w-[75px] text-sm"
          :class="activeTab === tab.key ? 'font-semibold text-[#3477f5]' : 'text-white/70'"
          type="button"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="min-h-0 flex-1">
        <div v-if="isSearching" class="h-full overflow-y-auto border-b border-white/10 bg-[#151515] px-3 py-3">
          <Transition name="wechat-list">
            <p v-if="status" class="mb-3 rounded-[8px] bg-[#3477f5]/15 px-3 py-2 text-sm text-[#7ca8ff]">
              {{ status }}
            </p>
          </Transition>
          <RecycleScroller
            v-if="searchResults.length"
            class="wechat-scroll h-[calc(100%-3.5rem)]"
            :items="searchResults"
            key-field="id"
            :item-size="58"
          >
            <template #default="{ item }">
              <button v-if="item.kind === 'user'" class="wechat-pressable flex h-[58px] w-full items-center text-left active:bg-white/5" type="button" @click="openUser(item.user.id)">
                <AvatarBadge :src="item.user.avatar" :name="item.user.nickname" />
                <div class="ml-3 min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">
                    {{ item.user.nickname }}
                  </p>
                  <p class="truncate text-xs text-[#a4a3a8]">
                    @{{ item.user.userName }}
                  </p>
                </div>
                <span v-if="!friendIdSet.has(item.user.id)" class="wechat-icon-button grid size-9 place-items-center rounded-[8px] bg-[#3477f5] text-white" title="添加好友">
                  <UserPlus :size="18" />
                </span>
                <span v-else class="flex shrink-0 items-center gap-1 text-sm text-[#a4a3a8]">
                  <UserCheck :size="17" />
                  已添加
                </span>
              </button>
              <button v-else class="wechat-pressable flex h-[58px] w-full items-center text-left active:bg-white/5" type="button" @click="openGroupDetail(item.group.id)">
                <AvatarBadge :src="item.group.img" :name="item.group.title" />
                <div class="ml-3 min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">
                    {{ item.group.title }}
                  </p>
                  <p class="truncate text-xs text-[#a4a3a8]">
                    {{ item.group.userNum }} 人 · {{ item.group.groupCode }}
                  </p>
                </div>
                <span class="rounded-[8px] px-3 py-2 text-sm font-semibold" :class="activeGroupIdSet.has(item.group.id) ? 'bg-white/10 text-[#a4a3a8]' : 'bg-[#3477f5] text-white'">
                  {{ activeGroupIdSet.has(item.group.id) ? '已加入' : '查看' }}
                </span>
              </button>
            </template>
          </RecycleScroller>
          <Transition name="wechat-list">
            <p v-if="!hasResults" class="px-4 py-8 text-center text-sm text-[#a4a3a8]">
              暂无搜索结果
            </p>
          </Transition>
        </div>

        <RecycleScroller
          v-else-if="activeTab === 'friends'"
          class="wechat-scroll h-full"
          :items="chat.friends"
          key-field="id"
          :item-size="55"
        >
          <template #default="{ item }">
            <button class="wechat-pressable flex h-[55px] w-full items-center px-3 text-left active:bg-white/5" type="button" @click="openFriend(item.roomId)">
              <AvatarBadge :src="item.friend.avatar" :name="item.friend.nickname" />
              <span class="ml-3 flex h-full min-w-0 flex-1 items-center border-b border-white/10 text-base">
                <span class="min-w-0 flex-1 truncate">{{ item.friend.nickname }}</span>
                <ChevronRight class="shrink-0 text-[#a4a3a8]" :size="18" />
              </span>
            </button>
          </template>
          <template #empty>
            <Transition name="wechat-list">
              <p v-if="!chat.friends.length" class="px-4 py-10 text-center text-sm text-[#a4a3a8]">
                暂无好友
              </p>
            </Transition>
          </template>
        </RecycleScroller>

        <RecycleScroller
          v-else
          class="wechat-scroll h-full"
          :items="chat.groups"
          key-field="id"
          :item-size="55"
        >
          <template #default="{ item: group }">
            <button class="wechat-pressable flex h-[55px] w-full items-center px-3 text-left active:bg-white/5" type="button" @click="openGroup(group.id)">
              <AvatarBadge :src="group.img" :name="group.title" />
              <span class="ml-3 flex h-full min-w-0 flex-1 items-center justify-between border-b border-white/10">
                <span class="truncate text-base">{{ group.title }}</span>
                <span class="ml-2 flex shrink-0 items-center gap-2 text-xs text-[#a4a3a8]">
                  <span v-if="group.removedAt" class="rounded-[8px] bg-white/10 px-2 py-1 text-[#8d8d93]">已移出</span>
                  <span>{{ group.userNum }} 人</span>
                </span>
              </span>
            </button>
          </template>
          <template #empty>
            <Transition name="wechat-list">
              <p v-if="!chat.groups.length" class="px-4 py-10 text-center text-sm text-[#a4a3a8]">
                暂无群组
              </p>
            </Transition>
          </template>
        </RecycleScroller>
      </div>
    </section>
  </AppShell>
</template>
