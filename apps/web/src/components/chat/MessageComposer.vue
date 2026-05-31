<script setup lang="ts">
import { SendHorizontal, SmilePlus } from 'lucide-vue-next'
import { nextTick, shallowRef, useTemplateRef, watch } from 'vue'
import EmojiPicker from './EmojiPicker.vue'

defineProps<{
  disabled: boolean
}>()

const emit = defineEmits<{
  send: []
}>()

const draft = defineModel<string>({ required: true })
const isPickerOpen = shallowRef(false)
const input = useTemplateRef<HTMLTextAreaElement>('input')

watch(draft, async () => {
  await nextTick()
  resizeInput()
})

function togglePicker() {
  isPickerOpen.value = !isPickerOpen.value
  if (isPickerOpen.value)
    input.value?.blur()
}

async function insertEmoji(emoji: string) {
  draft.value = `${draft.value}${emoji}`
  await nextTick()
  resizeInput()
}

function submit() {
  isPickerOpen.value = false
  emit('send')
}

function closePicker() {
  isPickerOpen.value = false
}

function handleInputFocus() {
  closePicker()
  resizeInput()
}

function resizeInput() {
  const el = input.value
  if (!el)
    return

  el.style.height = '40px'
  el.style.height = `${Math.min(el.scrollHeight, 104)}px`
  el.style.overflowY = el.scrollHeight > 104 ? 'auto' : 'hidden'
}

defineExpose({ closePicker })
</script>

<template>
  <form class="relative border-t border-white/10 bg-[#1b1b1d] px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]" @submit.prevent="submit">
    <Transition name="wechat-panel">
      <div v-if="isPickerOpen" class="absolute inset-x-0 bottom-full z-20 px-3 pb-2">
        <EmojiPicker @select="insertEmoji" />
      </div>
    </Transition>

    <div class="flex items-center gap-2.5">
      <textarea
        ref="input"
        v-model="draft"
        class="h-10 max-h-[104px] min-h-10 flex-1 resize-none overflow-y-hidden rounded-[10px] border border-[#313136] bg-[#101012] px-3.5 py-2 text-[15px] leading-6 text-white outline-none transition placeholder:text-[#8d8d93] focus:border-[#4a86ff] focus:bg-[#111114]"
        placeholder="写点什么"
        rows="1"
        @focus="handleInputFocus"
        @input="resizeInput"
        @pointerdown="closePicker"
        @keydown.enter.exact.prevent="submit"
      />
      <button
        class="wechat-icon-button grid size-10 shrink-0 place-items-center rounded-[10px] border border-[#343439] bg-[#202024] text-[#b2b2b8] active:bg-[#28282d]"
        :class="isPickerOpen ? 'border-[#4a86ff]/70 bg-[#24324a] text-[#8eb5ff]' : ''"
        type="button"
        title="选择表情"
        @click="togglePicker"
      >
        <SmilePlus :size="21" />
      </button>
      <button
        class="wechat-icon-button grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#3477f5] text-white disabled:bg-[#24304d] disabled:text-[#6f87bd]"
        type="submit"
        :disabled="disabled"
        title="发送"
      >
        <SendHorizontal :size="21" />
      </button>
    </div>
  </form>
</template>
