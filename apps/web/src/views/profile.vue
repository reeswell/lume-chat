<script setup lang="ts">
import { Bell, ChevronRight, Moon, Sun } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useThemeStore } from '@/stores/theme'
import { userConfirmed } from '@/utils/confirm'

const auth = useAuthStore()
const chat = useChatStore()
const theme = useThemeStore()
const router = useRouter()

onMounted(async () => {
  await Promise.all([auth.fetchMe(), chat.bootstrap()])
})

function logout() {
  if (!userConfirmed('您确定退出账号吗？'))
    return
  auth.logout()
  chat.resetSession()
  router.push({ name: 'login' })
}

function goNotifications() {
  router.push({ name: 'notifications' })
}

function goEditProfile() {
  router.push({ name: 'profile-edit' })
}
</script>

<template>
  <AppShell>
    <section class="h-full overflow-y-auto bg-[var(--vc-page-bg)] pb-4 text-[var(--vc-text)]">
      <div class="h-[50px]" />
      <button class="wechat-pressable flex h-[100px] w-full items-center bg-[var(--vc-surface)] px-3 text-left active:bg-[var(--vc-hover)]" type="button" @click="goEditProfile">
        <AvatarBadge :src="auth.user?.avatar" :name="auth.user?.nickname || auth.user?.userName || 'U'" />
        <div class="ml-3 min-w-0 flex-1 text-sm">
          <p class="mb-1 truncate">
            账号: {{ auth.user?.userName }}
          </p>
          <p class="mb-1 truncate text-[var(--vc-text-muted)]">
            昵称: {{ auth.user?.nickname || '-' }}
          </p>
          <p class="truncate text-[var(--vc-text-muted)]">
            邮箱: {{ auth.user?.email || '-' }}
          </p>
        </div>
        <ChevronRight class="text-[var(--vc-text-muted)]" :size="18" />
      </button>

      <div class="mt-5 bg-[var(--vc-surface)]">
        <button class="wechat-pressable flex h-[54px] w-full items-center border-b border-[var(--vc-border)] px-3 text-left active:bg-[var(--vc-hover)]" type="button" @click="goNotifications">
          <span class="grid size-8 place-items-center rounded-[8px] bg-[#3477f5] text-white">
            <Bell :size="18" />
          </span>
          <span class="ml-3 min-w-0 flex-1 text-sm">系统信息</span>
          <Transition name="wechat-badge">
            <span v-if="chat.systemUnread" class="mr-2 min-w-5 rounded-full bg-[#3477f5] px-1.5 text-center text-xs font-semibold leading-5 text-white">{{ chat.systemUnread > 99 ? '99+' : chat.systemUnread }}</span>
          </Transition>
          <ChevronRight class="text-[var(--vc-text-muted)]" :size="18" />
        </button>
        <button class="wechat-pressable flex h-[54px] w-full items-center px-3 text-left active:bg-[var(--vc-hover)]" type="button" :title="theme.nextLabel" @click="theme.toggle">
          <span class="grid size-8 place-items-center rounded-[8px] bg-[var(--vc-field-bg)] text-[var(--vc-accent)]">
            <Sun v-if="theme.isDark" :size="18" />
            <Moon v-else :size="18" />
          </span>
          <span class="ml-3 min-w-0 flex-1 text-sm">{{ theme.label }}</span>
          <span class="mr-2 text-xs text-[var(--vc-text-muted)]">{{ theme.nextLabel }}</span>
          <ChevronRight class="text-[var(--vc-text-muted)]" :size="18" />
        </button>
      </div>

      <button class="wechat-pressable mx-3 mt-5 h-11 w-[calc(100%-1.5rem)] rounded-[8px] bg-[var(--vc-surface)] text-sm font-semibold text-[var(--vc-text)] active:bg-[var(--vc-hover)]" type="button" @click="logout">
        退出登录
      </button>
    </section>
  </AppShell>
</template>
