<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  if (auth.isAuthed)
    auth.fetchMe().catch(() => {})
})
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="wechat-page" mode="out-in">
      <component :is="Component" :key="`${String(route.name)}:${JSON.stringify(route.params)}`" />
    </Transition>
  </RouterView>
</template>
