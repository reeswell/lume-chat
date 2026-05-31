<script setup lang="ts">
import { Github, Search } from 'lucide-vue-next'
import { computed, onMounted, shallowRef } from 'vue'

const emit = defineEmits<{
  select: [emoji: string]
}>()

const RECENT_KEY = 'chat:recent-emojis'
const MAX_RECENT = 24
const PROJECT_URL = 'https://github.com/reeswell/chat'

const query = shallowRef('')
const activeCategory = shallowRef('smileys')
const recent = shallowRef<string[]>([])

const categories = [
  {
    id: 'recent',
    icon: '🕘',
    title: '最近使用',
    emojis: [] as string[],
  },
  {
    id: 'smileys',
    icon: '😀',
    title: '表情',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴'],
  },
  {
    id: 'people',
    icon: '👋',
    title: '人物',
    emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '👏', '🙌', '🫶', '💪', '🦾', '👀', '🧠', '👑', '🎩', '🧢', '💍', '💄', '💋'],
  },
  {
    id: 'nature',
    icon: '🐶',
    title: '自然',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🐺', '🐗', '🐴', '🦄', '🐝', '🦋', '🌸', '🌹', '🌻', '🌈', '⭐', '🔥'],
  },
  {
    id: 'food',
    icon: '🍔',
    title: '食物',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥐', '🍞', '🥨', '🧀', '🍖', '🍗', '🍔', '🍟', '🍕', '🌭', '🌮', '🍜', '🍣', '🍰', '☕', '🍺'],
  },
  {
    id: 'travel',
    icon: '🚗',
    title: '出行',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚚', '🚲', '🛵', '🏍️', '✈️', '🚀', '🚁', '⛵', '🚢', '🏠', '🏢', '🏫', '🏥', '🏦', '⛺', '🌋', '🗻', '🏖️', '🏝️', '🌃', '🌉'],
  },
  {
    id: 'activity',
    icon: '⚽',
    title: '活动',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '🥊', '🥋', '⛳', '🎣', '🎽', '🎿', '🛷', '🎮', '🕹️', '🎲', '🎯', '🎨', '🎤', '🎧', '🎬', '🎹', '🥁'],
  },
  {
    id: 'symbols',
    icon: '❤️',
    title: '符号',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☯️', '♈', '♉', '♊', '♋', '✅', '☑️', '✔️', '❌', '❗', '❓', '💯'],
  },
] as const

const tabCategories = computed(() => categories)
const activeTitle = computed(() => tabCategories.value.find(category => category.id === activeCategory.value)?.title ?? '表情')
const activeEmojis = computed(() => {
  if (activeCategory.value === 'recent')
    return recent.value
  return tabCategories.value.find(category => category.id === activeCategory.value)?.emojis ?? []
})
const searchResults = computed(() => {
  const keyword = query.value.trim()
  const normalized = keyword.toLowerCase()
  if (!keyword)
    return []
  return categories
    .filter(category => category.id !== 'recent')
    .filter(category => category.title.includes(keyword) || category.id.includes(normalized) || category.emojis.some(emoji => emoji.includes(keyword)))
    .flatMap(category => category.emojis.filter(emoji => emoji.includes(keyword) || category.title.includes(keyword) || category.id.includes(normalized)))
    .filter((emoji, index, all) => all.indexOf(emoji) === index)
})
const displayEmojis = computed(() => query.value.trim() ? searchResults.value : activeEmojis.value)
const emptyText = computed(() => query.value.trim() ? '没有匹配的表情' : '还没有最近使用')

onMounted(() => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]')
    if (Array.isArray(saved))
      recent.value = saved.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT)
    if (recent.value.length)
      activeCategory.value = 'recent'
  }
  catch {
    recent.value = []
  }
})

function chooseEmoji(emoji: string) {
  recent.value = [emoji, ...recent.value.filter(item => item !== emoji)].slice(0, MAX_RECENT)
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value))
  emit('select', emoji)
}
</script>

<template>
  <div class="overflow-hidden rounded-t-[8px] border border-white/10 bg-[#141416] shadow-2xl">
    <div class="flex h-11 items-center gap-1 overflow-x-auto border-b border-white/10 px-2">
      <button
        v-for="category in tabCategories"
        :key="category.id"
        class="wechat-icon-button grid size-9 shrink-0 place-items-center border-b-2 text-lg active:bg-white/10"
        :class="activeCategory === category.id ? 'border-[#3477f5]' : 'border-transparent'"
        type="button"
        :title="category.title"
        @click="activeCategory = category.id"
      >
        {{ category.icon }}
      </button>
      <a
        class="wechat-icon-button ml-auto grid size-9 shrink-0 place-items-center rounded-[8px] text-[#a4a3a8] active:bg-white/10 active:text-white"
        :href="PROJECT_URL"
        target="_blank"
        rel="noopener noreferrer"
        title="reeswell/chat"
        aria-label="reeswell/chat"
      >
        <Github :size="18" />
      </a>
    </div>

    <div class="p-3">
      <label class="flex h-10 items-center rounded-[8px] bg-[#2a2a2d] px-3">
        <Search :size="18" class="shrink-0 text-[#a4a3a8]" />
        <input
          v-model="query"
          class="ml-2 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#8e8e93]"
          placeholder="搜索"
          type="search"
        >
      </label>

      <p class="mt-3 text-sm font-semibold text-[#d8d8dc]">
        {{ query ? '搜索结果' : activeTitle }}
      </p>
      <div v-if="displayEmojis.length" class="mt-2 grid max-h-[260px] grid-cols-8 gap-1 overflow-y-auto pr-1">
        <button
          v-for="emoji in displayEmojis"
          :key="`${activeCategory}-${emoji}`"
          class="wechat-icon-button grid aspect-square place-items-center rounded-[8px] text-2xl active:bg-white/10"
          type="button"
          @click="chooseEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
      <p v-else class="py-8 text-center text-sm text-[#8e8e93]">
        {{ emptyText }}
      </p>
    </div>
  </div>
</template>
