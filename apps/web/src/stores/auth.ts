import type { User } from '@/services/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'
import {
  getAuthToken,
  getAuthUserCookie,
  removeAuthToken,
  removeAuthUserCookie,
  setAuthToken,
  setAuthUserCookie,
} from '@/services/auth-cookie'
import { disconnectSocket } from '@/services/socket'

interface SessionResponse {
  token: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  clearLegacyAuthStorage()

  const token = ref(getAuthToken())
  const user = ref<User | null>(readUserCookie())
  const isAuthed = computed(() => Boolean(token.value))

  function persist(nextToken: string, nextUser: User) {
    token.value = nextToken
    user.value = nextUser
    setAuthToken(nextToken)
    setAuthUserCookie(JSON.stringify(nextUser))
  }

  async function login(payload: { userName: string, password: string }) {
    const session = await api.post<unknown, SessionResponse>('/auth/login', payload)
    persist(session.token, session.user)
  }

  async function register(payload: { userName: string, password: string }) {
    await api.post('/auth/register', payload)
  }

  async function fetchMe() {
    if (!token.value)
      return
    user.value = await api.get<unknown, User>('/users/me')
    setAuthUserCookie(JSON.stringify(user.value))
  }

  async function updateMe(payload: Partial<User>) {
    user.value = await api.patch<unknown, User>('/users/me', payload)
    setAuthUserCookie(JSON.stringify(user.value))
  }

  function logout() {
    disconnectSocket()
    token.value = ''
    user.value = null
    removeAuthToken()
    removeAuthUserCookie()
  }

  return { token, user, isAuthed, login, register, fetchMe, updateMe, logout }
})

function clearLegacyAuthStorage() {
  try {
    window.localStorage.removeItem('chat-token')
    window.localStorage.removeItem('chat-user')
  }
  catch {}
}

function readUserCookie() {
  const raw = getAuthUserCookie()
  if (!raw)
    return null

  try {
    return JSON.parse(raw) as User
  }
  catch {
    removeAuthUserCookie()
    return null
  }
}
