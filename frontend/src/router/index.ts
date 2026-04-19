import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@app/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: () => {
        const auth = useAuthStore()
        return auth.isAuthenticated ? '/dashboard' : '/login'
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPassword.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/Projects.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('../views/ProjectDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:id/trash',
      name: 'project-trash',
      component: () => import('../views/ProjectTrash.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:id/settings',
      name: 'project-settings',
      component: () => import('../views/ProjectSettings.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:id/members',
      name: 'project-members',
      redirect: (to) => `/projects/${to.params.id}/settings`,
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('../views/Tasks.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('../views/Notes.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/Reports.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/ui-kit',
      name: 'ui-kit',
      component: () => import('../views/UiShowcase.vue'),
      meta: { requiresAuth: true, requiresStaffOrAdmin: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/Admin/Users.vue'),
      meta: { requiresAuth: true, requiresStaffOrAdmin: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return { name: 'dashboard' }
  }
  if (
    to.meta.requiresStaffOrAdmin &&
    auth.user?.role !== 'admin' &&
    auth.user?.role !== 'staff'
  ) {
    return { name: 'dashboard' }
  }
  if (
    to.meta.layout === 'auth' &&
    auth.token &&
    (to.name === 'login' || to.name === 'register')
  ) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
