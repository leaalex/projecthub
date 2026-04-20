<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import RegisterForm from '../components/auth/RegisterForm.vue'
import { useAuthStore } from '@app/auth.store'
import { mapApiError } from '@infra/api/errorMap'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await auth.register(email.value, password.value, name.value)
    await router.replace('/dashboard')
  } catch (e: unknown) {
    error.value = mapApiError(e, 'auth.errors.registrationFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-md rounded-xl border border-border bg-surface p-8">
      <h1 class="text-2xl font-semibold text-foreground">{{ t('auth.createAccount') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ t('common.brand') }}</p>
      <RegisterForm
        v-model:name="name"
        v-model:email="email"
        v-model:password="password"
        class="mt-8"
        :loading="loading"
        :error="error"
        @submit="onSubmit"
      />
      <p class="mt-6 text-center text-sm text-muted">
        {{ t('auth.alreadyHaveAccount') }}
        <router-link
          to="/login"
          class="font-medium text-primary hover:text-primary-hover"
        >
          {{ t('auth.signIn') }}
        </router-link>
      </p>
    </div>
  </div>
</template>
