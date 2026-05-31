import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/chat' },
    { path: '/login', name: 'login', component: async () => import('@/views/login.vue') },
    {
      path: '/chat',
      name: 'chat',
      component: async () => import('@/views/chat.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/chat/room/:roomId',
      name: 'chat-room',
      component: async () => import('@/views/chat-room.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/chat/apply/:roomId/:messageId',
      name: 'apply-detail',
      component: async () => import('@/views/apply-detail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: async () => import('@/views/contacts.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/add',
      name: 'add-friend',
      component: async () => import('@/views/add-friend.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/user/:userId',
      name: 'friend-detail',
      component: async () => import('@/views/friend-detail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/user/:userId/info',
      name: 'friend-info',
      component: async () => import('@/views/friend-info.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contacts/user/:userId/validate',
      name: 'send-friend-validate',
      component: async () => import('@/views/send-friend-validate.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/groups/add',
      name: 'add-group',
      component: async () => import('@/views/add-group.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/groups/create',
      name: 'create-group',
      component: async () => import('@/views/create-group.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/groups/:groupId',
      name: 'group-detail',
      component: async () => import('@/views/group-detail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/groups/:groupId/invite',
      name: 'group-invite',
      component: async () => import('@/views/group-invite.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/groups/:groupId/validate',
      name: 'send-group-validate',
      component: async () => import('@/views/send-group-validate.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: async () => import('@/views/profile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: async () => import('@/views/profile-edit.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/notifications',
      name: 'notifications',
      component: async () => import('@/views/notifications.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth === true && !auth.isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthed)
    return { name: 'chat' }
  return true
})

export default router
