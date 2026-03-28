<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoginForm from '../components/auth/LoginForm.vue'
import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.replace(redirect)
  } catch {
    error.value = 'Invalid email or password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 class="text-2xl font-semibold text-foreground">Sign in</h1>
      <p class="mt-1 text-sm text-muted">Project Hub</p>
      <LoginForm
        v-model:email="email"
        v-model:password="password"
        class="mt-8"
        :loading="loading"
        :error="error"
        @submit="onSubmit"
      />
      <p class="mt-6 text-center text-sm text-muted">
        No account?
        <router-link
          to="/register"
          class="font-medium text-primary hover:text-primary-hover"
        >
          Register
        </router-link>
        ·
        <router-link
          to="/forgot-password"
          class="text-primary hover:text-primary-hover"
        >
          Forgot password
        </router-link>
      </p>
    </div>
  </div>
</template>
