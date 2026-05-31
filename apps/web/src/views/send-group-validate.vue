<script setup lang="ts">
import type { ChatGroupDetail } from '@/services/types'
import { ArrowLeft } from 'lucide-vue-next'
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
const group = shallowRef<ChatGroupDetail | null>(null)
const message = shallowRef('')
const error = shallowRef('')
const isSubmitting = shallowRef(false)

const groupId = computed(() => String(route.params.groupId))
const canSubmit = computed(() => !isSubmitting.value && Boolean(group.value))
const requiresApproval = computed(() => group.value?.joinApproval ?? false)
const submitText = computed(() => requiresApproval.value ? '发送' : '加入')

onMounted(async () => {
  try {
    await Promise.all([auth.fetchMe(), chat.bootstrap()])
    group.value = await chat.getGroup(groupId.value)
    message.value = `我是 ${auth.user?.nickname || auth.user?.userName || ''}`.trim()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '群组不存在'
  }
})

function goBack() {
  router.back()
}

async function submit() {
  if (!canSubmit.value)
    return
  isSubmitting.value = true
  error.value = ''
  try {
    await chat.requestJoinGroup(groupId.value, message.value)
    if (requiresApproval.value) {
      router.replace({ name: 'add-group', query: { requestSent: '1', groupId: groupId.value } })
      return
    }
    await chat.bootstrap()
    await chat.selectRoom(groupId.value)
    router.replace({ name: 'chat-room', params: { roomId: groupId.value } })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '发送入群申请失败'
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
          入群验证
        </h1>
        <button class="h-9 px-2 text-sm font-semibold text-[#3477f5] disabled:text-[#a4a3a8]" type="button" :disabled="!canSubmit" @click="submit">
          {{ submitText }}
        </button>
      </div>

      <div v-if="group" class="bg-[#1c1c1e]">
        <div class="flex h-[76px] items-center px-3">
          <AvatarBadge :src="group.img" :name="group.title" />
          <div class="ml-3 min-w-0 flex-1">
            <p class="truncate text-base font-semibold">
              {{ group.title }}
            </p>
            <p class="mt-1 truncate text-sm text-[#a4a3a8]">
              {{ group.userNum }} 人 · {{ group.groupCode }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="requiresApproval" class="mt-3 bg-[#1c1c1e] px-4 py-3">
        <p class="mb-2 text-sm text-[#a4a3a8]">
          验证信息
        </p>
        <textarea
          v-model="message"
          class="min-h-[92px] w-full resize-none bg-transparent text-base leading-6 outline-none placeholder:text-[#5f5f63]"
          maxlength="80"
          placeholder="告诉群主你是谁"
        />
      </div>
      <p v-else class="px-4 py-4 text-sm leading-6 text-[#a4a3a8]">
        该群已关闭入群验证，点击加入后会直接进入群聊。
      </p>

      <p v-if="error" class="px-4 py-3 text-center text-sm text-red-300">
        {{ error }}
      </p>
    </section>
  </AppShell>
</template>
