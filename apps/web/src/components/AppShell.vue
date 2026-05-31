<script setup lang="ts">
import { MessageCircle, UserRound, UsersRound } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'

type TabKey = 'contacts' | 'chat' | 'profile'

withDefaults(
  defineProps<{
    showNav?: boolean
  }>(),
  {
    showNav: true,
  },
)

const ROUTE_TAB_MAP: Record<string, TabKey> = {
  'contacts': 'contacts',
  'add-friend': 'contacts',
  'friend-detail': 'contacts',
  'friend-info': 'contacts',
  'send-friend-validate': 'contacts',
  'add-group': 'contacts',
  'create-group': 'contacts',
  'group-detail': 'contacts',
  'group-invite': 'contacts',
  'send-group-validate': 'contacts',
  'chat': 'chat',
  'chat-room': 'chat',
  'apply-detail': 'chat',
  'profile': 'profile',
  'profile-edit': 'profile',
  'notifications': 'profile',
}

const chat = useChatStore()
const route = useRoute()

const activeTab = computed<TabKey | undefined>(() => ROUTE_TAB_MAP[String(route.name ?? '')])

function tabClass(tab: TabKey): string {
  return activeTab.value === tab ? 'text-[#3477f5]' : 'text-[var(--vc-text-muted)]'
}
</script>

<template>
  <div class="min-h-dvh bg-[var(--vc-app-bg)] text-[var(--vc-text)] sm:px-4 sm:py-4">
    <div class="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[var(--vc-page-bg)] shadow-soft sm:rounded-[8px] sm:border sm:border-[var(--vc-border)]">
      <main class="min-h-0 flex-1 overflow-hidden">
        <slot />
      </main>

      <nav v-if="showNav" class="grid h-[54px] shrink-0 grid-cols-3 border-t border-[var(--vc-border)] bg-[var(--vc-surface)] pb-[env(safe-area-inset-bottom)]">
        <RouterLink class="wechat-pressable relative flex flex-col items-center justify-center gap-0.5 text-xs hover:text-[var(--vc-text)]" :class="tabClass('contacts')" to="/contacts" title="联系人">
          <UsersRound :size="20" />
          <span>联系人</span>
        </RouterLink>
        <RouterLink class="wechat-pressable relative flex flex-col items-center justify-center gap-0.5 text-xs hover:text-[var(--vc-text)]" :class="tabClass('chat')" to="/chat" title="聊天">
          <Transition name="wechat-badge">
            <span v-if="chat.chatUnread" class="absolute right-[28%] top-1 min-w-4 rounded-full bg-[#3477f5] px-1 text-center text-[10px] leading-4 text-white">{{ chat.chatUnread > 99 ? '99+' : chat.chatUnread }}</span>
          </Transition>
          <MessageCircle :size="21" />
          <span>聊天</span>
        </RouterLink>
        <RouterLink class="wechat-pressable relative flex flex-col items-center justify-center gap-0.5 text-xs hover:text-[var(--vc-text)]" :class="tabClass('profile')" to="/profile" title="我的">
          <Transition name="wechat-badge">
            <span v-if="chat.systemUnread" class="absolute right-[28%] top-1 min-w-4 rounded-full bg-[#3477f5] px-1 text-center text-[10px] leading-4 text-white">{{ chat.systemUnread > 99 ? '99+' : chat.systemUnread }}</span>
          </Transition>
          <UserRound :size="20" />
          <span>我的</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>
