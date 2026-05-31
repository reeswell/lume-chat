<script setup lang="ts">
import { ArrowLeft, Check, Radio } from 'lucide-vue-next'
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
const router = useRouter()
const title = shallowRef('')
const desc = shallowRef('')
const type = shallowRef<'group' | 'channel'>('group')
const joinApproval = shallowRef(false)
const error = shallowRef('')
const isSubmitting = shallowRef(false)

const canSubmit = computed(() => title.value.trim().length >= 2 && title.value.trim().length <= 40 && !isSubmitting.value)

function goBack() {
  router.back()
}

async function submit() {
  if (!canSubmit.value)
    return
  isSubmitting.value = true
  error.value = ''
  try {
    const group = await chat.createGroup({
      title: title.value.trim(),
      desc: desc.value.trim(),
      type: type.value,
      joinApproval: joinApproval.value,
    })
    router.replace({ name: 'chat-room', params: { roomId: group.id } })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '创建群组失败'
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
          创建群组
        </h1>
        <button class="h-9 px-2 text-sm font-semibold text-[#3477f5] disabled:text-[#a4a3a8]" type="button" :disabled="!canSubmit" @click="submit">
          完成
        </button>
      </div>

      <form class="min-h-0 flex-1 overflow-y-auto pt-3" @submit.prevent="submit">
        <div class="bg-[#1c1c1e]">
          <label class="flex min-h-[56px] items-center border-b border-white/10 px-4">
            <span class="w-20 shrink-0 text-sm text-[#a4a3a8]">群名称</span>
            <input v-model="title" class="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#5f5f63]" maxlength="40" placeholder="填写群名称">
          </label>
          <label class="block px-4 py-3">
            <p class="mb-2 text-sm text-[#a4a3a8]">群简介</p>
            <textarea v-model="desc" class="min-h-[92px] w-full resize-none rounded-[8px] border border-white/10 bg-[#0f0f0f] px-3 py-2 text-base leading-6 outline-none placeholder:text-[#5f5f63]" maxlength="100" placeholder="简单介绍这个群" />
          </label>
        </div>

        <div class="mt-3 bg-[#1c1c1e]">
          <button class="flex min-h-[56px] w-full items-center border-b border-white/10 px-4 text-left active:bg-white/5" type="button" @click="type = 'group'">
            <Radio :size="18" class="text-[#3477f5]" />
            <span class="ml-3 min-w-0 flex-1">
              <span class="block text-base">普通群</span>
              <span class="mt-1 block text-xs text-[#a4a3a8]">成员都可以参与聊天</span>
            </span>
            <Check v-if="type === 'group'" :size="20" class="text-[#3477f5]" />
          </button>
          <button class="flex min-h-[56px] w-full items-center px-4 text-left active:bg-white/5" type="button" @click="type = 'channel'">
            <Radio :size="18" class="text-[#3477f5]" />
            <span class="ml-3 min-w-0 flex-1">
              <span class="block text-base">广播群</span>
              <span class="mt-1 block text-xs text-[#a4a3a8]">适合公告和通知</span>
            </span>
            <Check v-if="type === 'channel'" :size="20" class="text-[#3477f5]" />
          </button>
        </div>

        <div class="mt-3 bg-[#1c1c1e]">
          <div class="flex min-h-[76px] w-full items-center px-4 py-3">
            <span class="min-w-0 flex-1 pr-4">
              <span class="block text-base">入群验证</span>
              <span class="mt-1 block max-w-full whitespace-normal break-words text-xs leading-5 text-[#a4a3a8]">
                {{ joinApproval ? '开启后，成员申请入群需要群主同意' : '默认关闭，用户可直接加入' }}
              </span>
            </span>
            <span class="mr-3 shrink-0 text-xs" :class="joinApproval ? 'text-[#7ca8ff]' : 'text-[#a4a3a8]'">{{ joinApproval ? '已开启' : '已关闭' }}</span>
            <button
              class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
              type="button"
              :aria-checked="joinApproval"
              aria-label="入群验证"
              role="switch"
              :class="joinApproval ? 'bg-[#3477f5]' : 'bg-[#3a3a3c]'"
              @click="joinApproval = !joinApproval"
            >
              <span class="absolute top-1 size-5 rounded-full bg-white transition-all" :class="joinApproval ? 'left-6' : 'left-1'" />
            </button>
          </div>
        </div>

        <p v-if="error" class="px-4 py-3 text-center text-sm text-red-300">
          {{ error }}
        </p>
        <p class="px-4 py-3 text-xs leading-5 text-[#6f6f73]">
          创建后你会自动成为群主。{{ joinApproval ? '其他用户申请入群时，需要你在系统通知里同意。' : '其他用户可以直接加入，群主邀请始终会直接入群。' }}
        </p>
      </form>
    </section>
  </AppShell>
</template>
