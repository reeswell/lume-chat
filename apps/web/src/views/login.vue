<script setup lang="ts">
import { ArrowRight, LoaderCircle } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const mode = ref<'login' | 'register'>('login')
const userName = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login({ userName: userName.value, password: password.value })
      router.push((route.query.redirect as string) || '/chat')
    }
    else {
      await auth.register({
        userName: userName.value,
        password: password.value,
      })
      password.value = ''
      mode.value = 'login'
      success.value = '注册成功，请登录'
    }
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh bg-[#050505] text-white sm:px-4 sm:py-4">
    <section
      class="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-[#0f0f0f] px-6 sm:rounded-[8px] sm:border sm:border-white/10"
    >
      <div class="mb-10">
        <div class="mb-5 grid size-12 place-items-center rounded-[8px] bg-[#3477f5] font-bold">
          LC
        </div>
        <h1 class="text-2xl font-semibold">
          LumeChat
        </h1>
        <p class="mt-2 text-sm text-[#a4a3a8]">
          登录后进入聊天室
        </p>
      </div>

      <form @submit.prevent="submit">
        <div class="mb-6 flex rounded-[8px] bg-[#1c1c1e] p-1">
          <button
            class="wechat-pressable h-10 flex-1 rounded-[6px] text-sm font-semibold"
            :class="mode === 'login' ? 'bg-[#3477f5] text-white' : 'text-white/55'" type="button"
            @click="mode = 'login'"
          >
            登录
          </button>
          <button
            class="wechat-pressable h-10 flex-1 rounded-[6px] text-sm font-semibold"
            :class="mode === 'register' ? 'bg-[#3477f5] text-white' : 'text-white/55'" type="button"
            @click="mode = 'register'"
          >
            注册
          </button>
        </div>

        <label class="mb-4 block">
          <span class="mb-2 block text-sm font-semibold text-white/70">账号</span>
          <input
            v-model="userName"
            class="h-12 w-full rounded-[8px] border border-white/10 bg-[#1c1c1e] px-4 text-white outline-none transition focus:border-[#3477f5]"
            autocomplete="username"
          >
        </label>
        <label class="mb-4 block">
          <span class="mb-2 block text-sm font-semibold text-white/70">密码</span>
          <input
            v-model="password"
            class="h-12 w-full rounded-[8px] border border-white/10 bg-[#1c1c1e] px-4 text-white outline-none transition focus:border-[#3477f5]"
            type="password" autocomplete="current-password"
          >
        </label>
        <Transition name="wechat-list">
          <p v-if="error" class="mb-4 rounded-[8px] bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {{ error }}
          </p>
        </Transition>
        <Transition name="wechat-list">
          <p v-if="success" class="mb-4 rounded-[8px] bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {{ success }}
          </p>
        </Transition>
        <button
          class="wechat-pressable flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#3477f5] px-4 font-semibold text-white disabled:opacity-60"
          type="submit" :disabled="loading"
        >
          <LoaderCircle v-if="loading" class="animate-spin" :size="18" />
          <span>{{ mode === 'login' ? '进入' : '创建账号' }}</span>
          <ArrowRight v-if="!loading" :size="18" />
        </button>
      </form>
    </section>
  </div>
</template>
