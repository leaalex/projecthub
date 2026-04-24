/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import type { MarkdownStorage } from 'tiptap-markdown'
import 'vue-router'

declare module '@tiptap/core' {
  interface Storage {
    markdown: MarkdownStorage
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    requiresStaffOrAdmin?: boolean
    layout?: string
  }
}
