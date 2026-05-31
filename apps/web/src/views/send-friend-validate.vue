<script setup lang="ts">
import type { User } from '@/services/types'
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()
const target = shallowRef<User | null>(null)
const message = shallowRef('')
const remark = shallowRef('')
const error = shallowRef('')
const isSubmitting = shallowRef(false)

const userId = computed(() => String(route.params.userId))
const defaultMessage = computed(() => {
  const name = auth.user?.nickname || auth.user?.userName || ''
  return name ? `我是 ${name}` : '你好，我想添加你为好友'
})

onMounted(async () => {
  try {
    await Promise.all([auth.fetchMe(), chat.bootstrap()])
    target.value = await chat.getUser(userId.value)
    message.value = defaultMessage.value
    remark.value = target.value.nickname || target.value.userName
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '用户不存在'
  }
})

function cancel() {
  router.back()
}

async function send() {
  if (!target.value || isSubmitting.value)
    return
  isSubmitting.value = true
  error.value = ''
  try {
    await chat.addFriend(target.value.id, message.value.trim() || defaultMessage.value)
    router.replace({ name: 'contacts', query: { requestSent: '1', userId: target.value.id } })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '发送失败'
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppShell :show-nav="false">
    <section class="flex h-full min-h-0 flex-col bg-[#0f0f0f] text-white">
      <div class="flex h-11 shrink-0 items-center bg-[#0f0f0f] px-3">
        <button class="h-full pr-3 text-sm text-[#a4a3a8]" type="button" @click="cancel">
          取消
        </button>
        <h1 class="min-w-0 flex-1 text-center text-base font-semibold">
          朋友验证
        </h1>
        <button class="h-full pl-3 text-sm font-semibold text-[#3477f5] disabled:text-[#a4a3a8]" type="button" :disabled="isSubmitting || !target" @click="send">
          {{ isSubmitting ? '发送中' : '发送' }}
        </button>
      </div>

      <p v-if="error && !target" class="px-4 py-10 text-center text-sm text-red-300">
        {{ error }}
      </p>

      <template v-else-if="target">
        <div class="px-4 pb-4 pt-6">
          <p class="text-sm leading-6 text-[#a4a3a8]">
            你需要发送验证申请，等对方通过。
          </p>
        </div>

        <div class="bg-[#1c1c1e]">
          <div class="flex min-h-[76px] items-center border-b border-white/10 px-4 py-3">
            <AvatarBadge :src="target.avatar" :name="target.nickname || target.userName" />
            <div class="ml-3 min-w-0 flex-1">
              <p class="truncate text-base font-semibold">
                {{ target.nickname || target.userName }}
              </p>
              <p class="mt-1 truncate text-sm text-[#a4a3a8]">
                账号: {{ target.userName }}
              </p>
            </div>
          </div>
        </div>

        <div class="px-4 pt-5 text-sm text-[#a4a3a8]">
          发送添加朋友申请
        </div>
        <div class="mt-2 bg-[#1c1c1e] px-4 py-3">
          <textarea
            v-model="message"
            class="min-h-[92px] w-full resize-none bg-transparent text-base leading-6 text-white outline-none placeholder:text-[#a4a3a8]"
            maxlength="50"
            placeholder="告诉对方你是谁"
          />
          <p class="mt-2 text-right text-xs text-[#a4a3a8]">
            {{ message.length }}/50
          </p>
        </div>

        <div class="px-4 pt-5 text-sm text-[#a4a3a8]">
          设置备注
        </div>
        <label class="mt-2 flex min-h-[50px] items-center bg-[#1c1c1e] px-4">
          <input v-model="remark" class="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-[#a4a3a8]" placeholder="备注名" maxlength="24">
        </label>

        <p class="px-4 pt-4 text-xs leading-5 text-[#a4a3a8]">
          对方通过后，会出现在你的联系人列表中。
        </p>

        <p v-if="error" class="mx-3 mt-3 rounded-[8px] bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {{ error }}
        </p>
      </template>
    </section>
  </AppShell>
</template>
