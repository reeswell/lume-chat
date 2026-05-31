<script setup lang="ts">
import { ArrowLeft, Search, UserPlus, XCircle } from 'lucide-vue-next'
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
const router = useRouter()
const query = shallowRef('')
const isSearching = shallowRef(false)
const error = shallowRef('')

const trimmedQuery = computed(() => query.value.trim())

function goBack() {
  router.back()
}

function focusSearch() {
  isSearching.value = true
  error.value = ''
}

function cancelSearch() {
  if (query.value) {
    query.value = ''
    error.value = ''
    return
  }
  isSearching.value = false
}

async function submitSearch() {
  if (!trimmedQuery.value)
    return
  error.value = ''
  const users = await chat.searchUsers(trimmedQuery.value)
  if (!users.length) {
    error.value = '该用户不存在'
    return
  }
  router.push({
    name: 'friend-detail',
    params: { userId: users[0].id },
    query: { source: /^\d+$/.test(trimmedQuery.value) ? 'phone' : 'account' },
  })
}
</script>

<template>
  <AppShell :show-nav="false">
    <section class="flex h-full min-h-0 flex-col bg-[#0f0f0f] text-white">
      <template v-if="isSearching">
        <div class="flex h-[64px] shrink-0 items-center gap-3 bg-[#1c1c1e] px-3">
          <label class="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#0f0f0f] px-3">
            <Search class="text-[#a4a3a8]" :size="21" />
            <input
              v-model="query"
              class="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-[#a4a3a8]"
              autofocus
              placeholder="账号/手机号"
              @keyup.enter="submitSearch"
            >
            <button v-if="query" class="grid size-7 place-items-center text-[#a4a3a8]" type="button" title="清空" @click="query = ''">
              <XCircle :size="20" />
            </button>
          </label>
          <button class="shrink-0 text-sm text-[#3477f5]" type="button" @click="cancelSearch">
            取消
          </button>
        </div>

        <button v-if="trimmedQuery" class="flex h-[78px] shrink-0 items-center border-b border-white/10 bg-[#151515] px-3 text-left active:bg-white/5" type="button" @click="submitSearch">
          <span class="grid size-12 shrink-0 place-items-center rounded-[8px] bg-[#3477f5] text-white">
            <Search :size="28" />
          </span>
          <span class="ml-3 min-w-0 flex-1 text-base font-semibold">
            搜索: <span class="text-[#7ca8ff]">{{ trimmedQuery }}</span>
          </span>
        </button>
        <p v-if="error" class="px-4 py-5 text-center text-sm text-[#a4a3a8]">
          {{ error }}
        </p>
      </template>

      <template v-else>
        <div class="relative flex h-11 shrink-0 items-center justify-center bg-[#1c1c1e] px-4">
          <button class="absolute left-3 grid size-9 place-items-center text-[#a4a3a8]" type="button" title="返回" @click="goBack">
            <ArrowLeft :size="24" />
          </button>
          <h1 class="text-base font-semibold">
            添加朋友
          </h1>
        </div>

        <div class="bg-[#1c1c1e] px-3 py-3">
          <button class="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0f0f0f] text-[#a4a3a8]" type="button" @click="focusSearch">
            <Search :size="20" />
            <span class="text-base">账号/手机号</span>
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto bg-[#0f0f0f] px-4 py-5">
          <div class="rounded-[8px] border border-white/10 bg-[#1c1c1e] p-4">
            <div class="flex items-center">
              <span class="grid size-10 shrink-0 place-items-center rounded-[8px] bg-[#3477f5] text-white">
                <UserPlus :size="22" />
              </span>
              <div class="ml-3 min-w-0 flex-1">
                <p class="text-base font-semibold">
                  通过账号或手机号添加
                </p>
                <p class="mt-1 text-sm leading-5 text-[#a4a3a8]">
                  输入对方账号或手机号，搜索后进入资料页发送好友申请。
                </p>
              </div>
            </div>
          </div>
          <p class="px-1 pt-4 text-xs leading-5 text-[#a4a3a8]">
            添加好友需要对方同意。申请通过后，对方会出现在你的联系人列表中。
          </p>
        </div>
      </template>
    </section>
  </AppShell>
</template>
