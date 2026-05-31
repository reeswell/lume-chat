<script setup lang="ts">
import type { ChatGroupDetail } from '@/services/types'
import { ArrowLeft, Check, ChevronRight, LogOut, Trash2, UserMinus, UserPlus, UsersRound } from 'lucide-vue-next'
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RecycleScroller } from 'vue-virtual-scroller'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { userConfirmed } from '@/utils/confirm'

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()
const group = shallowRef<ChatGroupDetail | null>(null)
const joinApproval = shallowRef(true)
const error = shallowRef('')
const notice = shallowRef('')
const isLoading = shallowRef(true)
const isJoining = shallowRef(false)
const isQuitting = shallowRef(false)
const isDissolving = shallowRef(false)
const isUpdatingSetting = shallowRef(false)
const removingUserId = shallowRef('')

const groupId = computed(() => String(route.params.groupId))
const isMember = computed(() => chat.groups.some(item => item.id === groupId.value && !item.removedAt))
const removedConversation = computed(() => chat.conversations.find(item => item.roomId === groupId.value && item.removedAt))
const isRemovedFromGroup = computed(() => Boolean(removedConversation.value))
const owner = computed(() => group.value?.members.find(item => item.holder))
const managers = computed(() => group.value?.members.filter(item => item.holder || item.manager) ?? [])
const members = computed(() => group.value?.members ?? [])
const memberListHeight = computed(() => `${Math.min(members.value.length * 54, 360)}px`)
const isOwner = computed(() => owner.value?.userId === auth.user?.id)
const joinModeLabel = computed(() => joinApproval.value ? '需要群主同意' : '允许直接加入')
const joinButtonText = computed(() => joinApproval.value ? '申请加入群聊' : '加入群聊')

onMounted(async () => {
  try {
    await Promise.all([auth.fetchMe(), chat.bootstrap()])
    await reloadGroup()
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

async function reloadGroup() {
  group.value = await chat.getGroup(groupId.value)
  joinApproval.value = group.value.joinApproval
}

async function openRoom() {
  if (!group.value)
    return
  await chat.selectRoom(group.value.id)
  router.push({ name: 'chat-room', params: { roomId: group.value.id } })
}

async function requestJoin() {
  if (isRemovedFromGroup.value)
    return
  if (!group.value || isJoining.value)
    return

  if (joinApproval.value) {
    router.push({ name: 'send-group-validate', params: { groupId: groupId.value } })
    return
  }

  isJoining.value = true
  error.value = ''
  try {
    await chat.requestJoinGroup(groupId.value)
    await chat.bootstrap()
    await chat.selectRoom(groupId.value)
    router.replace({ name: 'chat-room', params: { roomId: groupId.value } })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '加入群聊失败'
  }
  finally {
    isJoining.value = false
  }
}

function openUser(userId: string) {
  if (userId === auth.user?.id) {
    router.push({ name: 'profile' })
    return
  }
  router.push({ name: 'friend-detail', params: { userId }, query: { source: 'group' } })
}

async function toggleJoinApproval() {
  if (!group.value || !isOwner.value || isUpdatingSetting.value)
    return

  const next = !joinApproval.value
  isUpdatingSetting.value = true
  error.value = ''
  notice.value = ''
  try {
    const updated = await chat.updateGroupSettings(group.value.id, { joinApproval: next })
    joinApproval.value = updated.joinApproval
    group.value = { ...group.value, joinApproval: updated.joinApproval }
    notice.value = next ? '已开启入群验证' : '已关闭入群验证'
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '更新群设置失败'
  }
  finally {
    isUpdatingSetting.value = false
  }
}

async function removeMember(userId: string, name: string) {
  if (!group.value || removingUserId.value)
    return
  if (!userConfirmed(`确定将 ${name} 移出群聊吗？`))
    return

  removingUserId.value = userId
  error.value = ''
  notice.value = ''
  try {
    await chat.removeGroupMember(group.value.id, userId)
    await reloadGroup()
    notice.value = '已移出群成员'
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '移出成员失败'
  }
  finally {
    removingUserId.value = ''
  }
}

async function quitGroup() {
  if (!group.value || isQuitting.value)
    return
  if (!userConfirmed(`确定退出 ${group.value.title} 吗？`))
    return

  isQuitting.value = true
  error.value = ''
  try {
    await chat.quitGroup(group.value.id)
    router.replace({ name: 'chat' })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '退出群聊失败'
  }
  finally {
    isQuitting.value = false
  }
}

async function dissolveGroup() {
  if (!group.value || isDissolving.value)
    return
  if (!userConfirmed(`确定解散 ${group.value.title} 吗？解散后所有成员都会离开群聊。`))
    return

  isDissolving.value = true
  error.value = ''
  try {
    await chat.dissolveGroup(group.value.id)
    router.replace({ name: 'chat' })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '解散群聊失败'
  }
  finally {
    isDissolving.value = false
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
          群资料
        </h1>
        <span class="w-9" />
      </div>

      <div v-if="isLoading" class="px-4 py-10 text-center text-sm text-[#a4a3a8]">
        加载中
      </div>
      <p v-else-if="error && !group" class="px-4 py-10 text-center text-sm text-red-300">
        {{ error }}
      </p>

      <template v-else-if="group">
        <div class="min-h-0 flex-1 overflow-y-auto pb-4">
          <div class="bg-[#1c1c1e] px-4 py-6">
            <div class="flex items-center">
              <AvatarBadge :src="group.img" :name="group.title" size="lg" />
              <div class="ml-4 min-w-0 flex-1">
                <p class="truncate text-xl font-semibold leading-8">
                  {{ group.title }}
                </p>
                <p class="mt-1 truncate text-sm text-[#a4a3a8]">
                  群号: {{ group.groupCode }}
                </p>
                <p class="mt-1 truncate text-sm text-[#a4a3a8]">
                  {{ group.userNum }} 人 · {{ group.type === 'channel' ? '广播群' : '普通群' }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-3 bg-[#1c1c1e]">
            <div class="flex min-h-[52px] items-center border-b border-white/10 px-4">
              <span class="w-20 shrink-0 text-sm text-[#a4a3a8]">群主</span>
              <span class="min-w-0 flex-1 truncate text-right text-sm">{{ owner?.user.nickname || group.holderName }}</span>
            </div>
            <div class="flex min-h-[52px] items-center border-b border-white/10 px-4">
              <span class="w-20 shrink-0 text-sm text-[#a4a3a8]">入群方式</span>
              <span class="min-w-0 flex-1 truncate text-right text-sm">{{ joinModeLabel }}</span>
            </div>
            <div class="flex min-h-[52px] items-center border-b border-white/10 px-4">
              <span class="w-20 shrink-0 text-sm text-[#a4a3a8]">简介</span>
              <span class="min-w-0 flex-1 truncate text-right text-sm">{{ group.desc || '暂无简介' }}</span>
            </div>
            <div class="flex min-h-[58px] w-full items-center px-4">
              <span class="w-20 shrink-0 text-sm text-[#a4a3a8]">管理员</span>
              <span class="flex min-w-0 flex-1 items-center justify-end gap-1">
                <AvatarBadge v-for="manager in managers.slice(0, 4)" :key="manager.id" :name="manager.user.nickname || manager.userName" size="sm" />
              </span>
            </div>
          </div>

          <div v-if="isOwner" class="mt-3 bg-[#1c1c1e]">
            <div class="flex min-h-[76px] w-full items-center border-b border-white/10 px-4 py-3">
              <span class="min-w-0 flex-1 pr-4">
                <span class="block text-base">入群验证</span>
                <span class="mt-1 block max-w-full whitespace-normal break-words text-xs leading-5 text-[#a4a3a8]">
                  {{ joinApproval ? '开启后，成员申请入群需要群主同意' : '关闭后用户可直接加入，群主邀请始终直接通过' }}
                </span>
              </span>
              <span class="mr-3 shrink-0 text-xs" :class="joinApproval ? 'text-[#7ca8ff]' : 'text-[#a4a3a8]'">{{ joinApproval ? '已开启' : '已关闭' }}</span>
              <button
                class="relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60"
                type="button"
                :aria-checked="joinApproval"
                aria-label="入群验证"
                role="switch"
                :class="joinApproval ? 'bg-[#3477f5]' : 'bg-[#3a3a3c]'"
                :disabled="isUpdatingSetting"
                @click="toggleJoinApproval"
              >
                <span class="absolute top-1 size-5 rounded-full bg-white transition-all" :class="joinApproval ? 'left-6' : 'left-1'" />
              </button>
            </div>
          </div>

          <div v-if="isMember" class="mt-3 bg-[#1c1c1e]">
            <RouterLink
              class="flex min-h-[56px] w-full items-center px-4 text-left active:bg-white/5"
              :to="{ name: 'group-invite', params: { groupId } }"
            >
              <span class="grid size-8 shrink-0 place-items-center rounded-[8px] bg-[#3477f5] text-white">
                <UserPlus :size="18" />
              </span>
              <span class="ml-3 min-w-0 flex-1 text-base">邀请成员</span>
              <span class="text-xs text-[#a4a3a8]">选择联系人</span>
              <ChevronRight :size="20" class="ml-1 text-[#6f6f73]" />
            </RouterLink>
          </div>

          <div class="mt-3 bg-[#1c1c1e]">
            <div class="flex min-h-[44px] items-center border-b border-white/10 px-4">
              <span class="min-w-0 flex-1 text-sm font-semibold">群成员</span>
              <span class="text-xs text-[#a4a3a8]">{{ members.length }} 人</span>
            </div>
            <RecycleScroller
              class="overflow-y-auto"
              :style="{ height: memberListHeight }"
              :items="members"
              key-field="id"
              :item-size="54"
            >
              <template #default="{ item: member }">
                <div class="flex h-[54px] items-center px-4">
                  <button class="flex min-w-0 flex-1 items-center py-2 text-left active:bg-white/5" type="button" @click="openUser(member.userId)">
                    <AvatarBadge :src="member.user.avatar" :name="member.user.nickname || member.userName" size="sm" />
                    <span class="ml-3 min-w-0 flex-1 truncate text-sm">{{ member.card || member.user.nickname || member.userName }}</span>
                    <span v-if="member.holder" class="rounded-[8px] bg-[#3477f5]/15 px-2 py-1 text-xs text-[#7ca8ff]">群主</span>
                    <span v-else-if="member.manager" class="rounded-[8px] bg-white/10 px-2 py-1 text-xs text-[#a4a3a8]">管理员</span>
                  </button>
                  <button
                    v-if="isOwner && !member.holder"
                    class="ml-2 grid size-8 place-items-center rounded-[8px] text-[#ff6b6b] active:bg-[#2a1517] disabled:opacity-50"
                    type="button"
                    title="移出群聊"
                    :disabled="Boolean(removingUserId)"
                    @click="removeMember(member.userId, member.card || member.user.nickname || member.userName)"
                  >
                    <UserMinus :size="17" />
                  </button>
                </div>
              </template>
            </RecycleScroller>
          </div>

          <p v-if="notice" class="px-4 py-3 text-center text-sm text-[#7ca8ff]">
            {{ notice }}
          </p>
          <p v-if="error" class="px-4 py-3 text-center text-sm text-red-300">
            {{ error }}
          </p>
        </div>

        <div class="shrink-0 border-t border-white/10 bg-[#1c1c1e] px-4 py-4">
          <template v-if="isMember">
            <button
              class="flex h-11 w-full items-center justify-center rounded-[8px] bg-[#3477f5] text-sm font-semibold text-white active:bg-[#2d67d6]"
              type="button"
              @click="openRoom"
            >
              <Check :size="18" class="mr-2" />
              进入群聊
            </button>
            <button
              v-if="isOwner"
              class="mt-3 flex h-11 w-full items-center justify-center rounded-[8px] bg-[#2a1517] text-sm font-semibold text-[#ff6b6b] active:bg-[#3a1b1e] disabled:opacity-60"
              type="button"
              :disabled="isDissolving"
              @click="dissolveGroup"
            >
              <Trash2 :size="18" class="mr-2" />
              {{ isDissolving ? '解散中' : '解散群聊' }}
            </button>
            <button
              v-else
              class="mt-3 flex h-11 w-full items-center justify-center rounded-[8px] bg-[#2a1517] text-sm font-semibold text-[#ff6b6b] active:bg-[#3a1b1e] disabled:opacity-60"
              type="button"
              :disabled="isQuitting"
              @click="quitGroup"
            >
              <LogOut :size="18" class="mr-2" />
              {{ isQuitting ? '退出中' : '退出群聊' }}
            </button>
          </template>
          <template v-else-if="isRemovedFromGroup">
            <div class="flex h-11 items-center justify-center text-center text-base text-[#8d8d93]">
              你已被移出群聊，只能查看历史消息
            </div>
          </template>
          <template v-else>
            <button
              class="flex h-11 w-full items-center justify-center rounded-[8px] bg-[#3477f5] text-sm font-semibold text-white active:bg-[#2d67d6] disabled:opacity-60"
              type="button"
              :disabled="isJoining"
              @click="requestJoin"
            >
              <UsersRound :size="18" class="mr-2" />
              {{ isJoining ? '处理中' : joinButtonText }}
            </button>
          </template>
        </div>
      </template>
    </section>
  </AppShell>
</template>
