import { useCookies } from '@vueuse/integrations/useCookies'

const TOKEN_COOKIE = 'chat-token'
const USER_COOKIE = 'chat-user'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

const cookies = useCookies([TOKEN_COOKIE, USER_COOKIE], { doNotParse: true })
const cookieOptions = {
  maxAge: COOKIE_MAX_AGE,
  path: '/',
  sameSite: 'lax' as const,
}

export function getAuthToken() {
  return cookies.get<string>(TOKEN_COOKIE) ?? ''
}

export function setAuthToken(token: string) {
  cookies.set(TOKEN_COOKIE, token, cookieOptions)
}

export function removeAuthToken() {
  cookies.remove(TOKEN_COOKIE, { path: '/' })
}

export function getAuthUserCookie() {
  return cookies.get<string>(USER_COOKIE) ?? ''
}

export function setAuthUserCookie(user: string) {
  cookies.set(USER_COOKIE, user, cookieOptions)
}

export function removeAuthUserCookie() {
  cookies.remove(USER_COOKIE, { path: '/' })
}
