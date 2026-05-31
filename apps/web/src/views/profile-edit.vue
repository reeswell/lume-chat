<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import AvatarBadge from '@/components/AvatarBadge.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const form = reactive({
  nickname: '',
  signature: '',
  email: '',
  city: '',
  province: '',
  gender: 'secret',
  age: 18,
})

onMounted(() => {
  void auth.fetchMe()
})

watch(
  () => auth.user,
  (user) => {
    if (!user)
      return
    Object.assign(form, {
      nickname: user.nickname,
      signature: user.signature,
      email: user.email,
      city: user.city,
      province: user.province,
      gender: user.gender,
      age: user.age,
    })
  },
  { immediate: true },
)

function goBack() {
  router.back()
}

async function save() {
  await auth.updateMe(form)
  router.push({ name: 'profile' })
}
</script>

<template>
  <AppShell :show-nav="false">
    <section class="h-full overflow-y-auto bg-[#0f0f0f] pb-5 text-white">
      <div class="flex h-11 items-center bg-[#1c1c1e] px-3">
        <button class="grid size-9 place-items-center text-[#a4a3a8]" type="button" title="返回" @click="goBack">
          <ArrowLeft :size="24" />
        </button>
        <h1 class="min-w-0 flex-1 text-center text-base font-semibold">
          编辑资料
        </h1>
        <button class="w-12 text-right text-sm font-semibold text-[#3477f5]" type="button" @click="save">
          完成
        </button>
      </div>

      <div class="flex min-h-[92px] items-center bg-[#1c1c1e] px-3">
        <AvatarBadge :name="form.nickname || auth.user?.userName || 'U'" />
        <div class="ml-3 min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">
            头像由名称自动生成
          </p>
          <p class="mt-1 truncate text-xs text-[#a4a3a8]">
            修改昵称后头像会自动更新
          </p>
        </div>
      </div>

      <form class="mt-3 bg-[#1c1c1e]" @submit.prevent="save">
        <label class="flex min-h-[52px] items-center border-b border-white/10 px-3">
          <span class="w-20 shrink-0 text-sm">昵称</span>
          <input v-model="form.nickname" class="h-10 min-w-0 flex-1 bg-transparent text-right text-sm text-white outline-none">
        </label>
        <label class="flex min-h-[52px] items-center border-b border-white/10 px-3">
          <span class="w-20 shrink-0 text-sm">邮箱</span>
          <input v-model="form.email" class="h-10 min-w-0 flex-1 bg-transparent text-right text-sm text-white outline-none">
        </label>
        <label class="flex min-h-[52px] items-center border-b border-white/10 px-3">
          <span class="w-20 shrink-0 text-sm">年龄</span>
          <input v-model.number="form.age" class="h-10 min-w-0 flex-1 bg-transparent text-right text-sm text-white outline-none" type="number" min="1" max="120">
        </label>
        <label class="flex min-h-[52px] items-center border-b border-white/10 px-3">
          <span class="w-20 shrink-0 text-sm">省份</span>
          <input v-model="form.province" class="h-10 min-w-0 flex-1 bg-transparent text-right text-sm text-white outline-none">
        </label>
        <label class="flex min-h-[52px] items-center border-b border-white/10 px-3">
          <span class="w-20 shrink-0 text-sm">城市</span>
          <input v-model="form.city" class="h-10 min-w-0 flex-1 bg-transparent text-right text-sm text-white outline-none">
        </label>
        <label class="block px-3 py-3">
          <span class="mb-2 block text-sm">签名</span>
          <textarea v-model="form.signature" class="min-h-24 w-full resize-none rounded-[8px] border border-white/10 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none" />
        </label>
      </form>
    </section>
  </AppShell>
</template>
