import type { ComputedRef } from 'vue'
import type { DynamicScrollerExposed } from 'vue-virtual-scroller'
import type { MessageListItem } from './useMessageSearch'
import { nextTick, shallowRef, useTemplateRef } from 'vue'

const INITIAL_SCROLL_ATTEMPTS = 6

export function useMessageScroller(
  messageItems: ComputedRef<MessageListItem[]>,
  unreadDividerIndex: ComputedRef<number>,
) {
  const messageScroller = useTemplateRef<DynamicScrollerExposed<MessageListItem>>('messageScroller')
  const messageScrollerHost = useTemplateRef<HTMLElement>('messageScrollerHost')
  const hasAppliedInitialScroll = shallowRef(false)
  const isNearBottom = shallowRef(true)
  const pendingNewMessageCount = shallowRef(0)

  function waitForPaint(): Promise<void> {
    if (typeof requestAnimationFrame === 'undefined')
      return Promise.resolve()
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }

  async function waitForScrollerLayout(): Promise<void> {
    await nextTick()
    await waitForPaint()
  }

  function getScrollerElement(): HTMLElement | null {
    return messageScrollerHost.value?.querySelector<HTMLElement>('.vue-recycle-scroller') ?? null
  }

  function scrollLastItemIntoView(): void {
    const lastIndex = messageItems.value.length - 1
    if (lastIndex < 0)
      return
    messageScroller.value?.scrollToItem(lastIndex)
  }

  function scrollToNativeBottom(): void {
    const element = getScrollerElement()
    if (!element) {
      messageScroller.value?.scrollToBottom()
      return
    }
    const bottom = Math.max(element.scrollHeight - element.clientHeight, 0)
    messageScroller.value?.scrollToPosition(bottom)
    element.scrollTop = bottom
  }

  function updateNearBottomState(): void {
    const element = getScrollerElement()
    if (!element) {
      isNearBottom.value = true
      pendingNewMessageCount.value = 0
      return
    }

    isNearBottom.value = element.scrollHeight - element.scrollTop - element.clientHeight < 96
    if (isNearBottom.value)
      pendingNewMessageCount.value = 0
  }

  async function scrollToBottomPosition(): Promise<void> {
    for (let attempt = 0; attempt < INITIAL_SCROLL_ATTEMPTS; attempt += 1) {
      await waitForScrollerLayout()
      messageScroller.value?.forceUpdate?.()
      scrollLastItemIntoView()
      await waitForScrollerLayout()
      scrollToNativeBottom()
      isNearBottom.value = true
    }
  }

  async function scrollToUnreadPosition(): Promise<void> {
    const targetUnreadIndex = unreadDividerIndex.value
    if (targetUnreadIndex < 0)
      return
    for (let attempt = 0; attempt < INITIAL_SCROLL_ATTEMPTS; attempt += 1) {
      await waitForScrollerLayout()
      messageScroller.value?.forceUpdate?.()
      messageScroller.value?.scrollToItem(targetUnreadIndex)
      await waitForScrollerLayout()
      updateNearBottomState()
    }
  }

  async function scrollToInitialPosition(): Promise<void> {
    if (unreadDividerIndex.value >= 0)
      await scrollToUnreadPosition()
    else
      await scrollToBottomPosition()
    pendingNewMessageCount.value = 0
    hasAppliedInitialScroll.value = true
  }

  async function jumpToLatestMessages(): Promise<void> {
    pendingNewMessageCount.value = 0
    await scrollToBottomPosition()
  }

  function scrollToItem(index: number): void {
    messageScroller.value?.scrollToItem(index)
  }

  function handleMessageScroll(event: Event): void {
    const element = event.currentTarget
    if (!(element instanceof HTMLElement))
      return
    isNearBottom.value = element.scrollHeight - element.scrollTop - element.clientHeight < 96
    if (isNearBottom.value)
      pendingNewMessageCount.value = 0
  }

  return {
    messageScroller,
    messageScrollerHost,
    hasAppliedInitialScroll,
    isNearBottom,
    pendingNewMessageCount,
    waitForScrollerLayout,
    scrollToInitialPosition,
    scrollToBottomPosition,
    jumpToLatestMessages,
    scrollToItem,
    handleMessageScroll,
  }
}
