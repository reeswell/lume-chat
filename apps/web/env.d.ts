/// <reference types="vite/client" />

import type {} from 'vue-router'

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SOCKET_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, unknown>
  export default component
}
