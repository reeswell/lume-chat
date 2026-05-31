<script setup lang="ts">
import { UserPlus, UsersRound } from 'lucide-vue-next'
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import ConversationList from '@/components/chat/ConversationList.vue'
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
const router = useRouter()
const showMenu = shallowRef(false)

onMounted(async () => {
  await chat.bootstrap()
})

function openRoom(roomId: string) {
  const conversation = chat.chatConversations.find(item => item.roomId === roomId)
  const unread = conversation?.unread ?? 0
  router.push({
    name: 'chat-room',
    params: { roomId },
    ...(unread > 0 ? { query: { unread: String(unread) } } : {}),
  })
}

function goContacts() {
  showMenu.value = false
  router.push({ name: 'add-group' })
}

function goAddFriend() {
  showMenu.value = false
  router.push({ name: 'add-friend' })
}

function openCreateGroup() {
  showMenu.value = false
  router.push({ name: 'create-group' })
}
</script>

<template>
  <AppShell>
    <div class="relative h-full">
      <ConversationList :conversations="chat.chatConversations" :current-room-id="chat.currentRoomId" :online-users="chat.onlineUsers" @select-room="openRoom" @open-menu="showMenu = !showMenu" />

      <Transition name="wechat-fade">
        <button v-if="showMenu" class="absolute inset-0 z-10 bg-transparent" type="button" aria-label="关闭菜单" @click="showMenu = false" />
      </Transition>
      <Transition name="wechat-pop">
        <div v-if="showMenu" class="absolute right-10 top-5 z-20 w-[120px] origin-top-right rounded-[8px] bg-[#4c4c4c] py-1 text-sm text-white shadow-soft">
          <span class="absolute -right-2 top-3 h-4 w-4 rotate-45 bg-[#4c4c4c]" />
          <button class="wechat-pressable relative flex w-full items-center gap-2 px-3 py-2 text-left active:bg-white/10" type="button" @click="goAddFriend">
            <UserPlus :size="16" />
            添加好友
          </button>
          <button class="wechat-pressable relative flex w-full items-center gap-2 px-3 py-2 text-left active:bg-white/10" type="button" @click="goContacts">
            <UsersRound :size="16" />
            添加群组
          </button>
          <button class="wechat-pressable relative flex w-full items-center gap-2 px-3 py-2 text-left active:bg-white/10" type="button" @click="openCreateGroup">
            <UsersRound :size="16" />
            创建群组
          </button>
        </div>
      </Transition>
    </div>
  </AppShell>
</template>
