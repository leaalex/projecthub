<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-md rounded-xl border border-border bg-surface p-8">
      <h1 class="text-2xl font-semibold text-foreground">{{ t('auth.forgotPassword') }}</h1>
      <p class="mt-4 text-sm leading-relaxed text-muted">
        {{ t('auth.forgotPasswordBody') }}
      </p>
      <router-link
        to="/login"
        class="mt-6 inline-block text-sm font-medium text-primary hover:text-primary-hover"
      >
        {{ t('auth.backToSignIn') }}
      </router-link>
    </div>
  </div>
</template>
