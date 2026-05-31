import type { AxiosResponse } from 'axios'
import axios, { isAxiosError } from 'axios'
import { getAuthToken } from './auth-cookie'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token !== undefined && token !== '')
    config.headers.Authorization = `Bearer ${token}`
  return config
})

function extractErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const responseMessage = (data as { message?: string | string[] }).message
      if (Array.isArray(responseMessage))
        return responseMessage.join(', ')
      if (typeof responseMessage === 'string')
        return responseMessage
    }
    if (error.message !== '')
      return error.message
  }
  if (error instanceof Error && error.message !== '')
    return error.message
  return '请求失败'
}

api.interceptors.response.use(
  // Callers use api.get<_, T> expecting unwrapped T; axios types require AxiosResponse.
  // @ts-expect-error intentional response unwrap
  (response: AxiosResponse<unknown>) => response.data,
  async (error: unknown) => Promise.reject(new Error(extractErrorMessage(error))),
)
