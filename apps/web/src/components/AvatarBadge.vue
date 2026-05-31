<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  src?: string
  name: string
  online?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})

const palettes = [
  ['#3477f5', '#1f4fb8'],
  ['#14b8a6', '#0f766e'],
  ['#f97316', '#b45309'],
  ['#8b5cf6', '#5b21b6'],
  ['#ef4444', '#991b1b'],
  ['#22c55e', '#15803d'],
  ['#06b6d4', '#0369a1'],
  ['#f59e0b', '#92400e'],
]

const displayName = computed(() => props.name?.trim() || 'U')
const initials = computed(() => {
  const value = displayName.value
  if (/[\u4E00-\u9FA5]/.test(value))
    return value.slice(0, 1)
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})
const hash = computed(() => Array.from(displayName.value).reduce((total, char) => total + char.charCodeAt(0), 0))
const palette = computed(() => palettes[hash.value % palettes.length])
const safeInitials = computed(() => initials.value.replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&apos;',
})[char] ?? char))
const avatarSrc = computed(() => {
  const [start, end] = palette.value
  const fontSize = initials.value.length > 1 ? 38 : 46
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${start}" />
          <stop offset="1" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#g)" />
      <circle cx="92" cy="24" r="26" fill="rgba(255,255,255,.12)" />
      <circle cx="22" cy="96" r="32" fill="rgba(0,0,0,.12)" />
      <text x="60" y="72" text-anchor="middle" font-size="${fontSize}" font-family="Avenir Next, Nunito Sans, Arial, sans-serif" font-weight="700" fill="#fff">${safeInitials.value}</text>
    </svg>
  `
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
})
const imageSrc = computed(() => props.src?.trim() || avatarSrc.value)

const sizeClass = computed(() => {
  if (props.size === 'lg')
    return 'size-[76px] rounded-[8px]'
  if (props.size === 'sm')
    return 'size-8 rounded-[8px]'
  return 'size-11 rounded-full'
})
</script>

<template>
  <div class="relative shrink-0 overflow-hidden bg-[#3477f5]/15" :class="sizeClass">
    <img :src="imageSrc" :alt="displayName" class="h-full w-full object-cover">
    <span v-if="online" class="wechat-online-dot absolute bottom-1 right-1 size-2.5 rounded-full border border-white bg-emerald-500" />
  </div>
</template>
