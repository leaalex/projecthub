<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'

const { t } = useI18n()

const email = defineModel<string>('email', { default: '' })
const password = defineModel<string>('password', { default: '' })

defineProps<{
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <Input
      id="login-email"
      v-model="email"
      :label="t('auth.fields.email')"
      type="email"
      required
      autocomplete="email"
    />
    <Input
      id="login-password"
      v-model="password"
      :label="t('auth.fields.password')"
      type="password"
      required
      autocomplete="current-password"
    />
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <Button type="submit" block :loading="loading">{{ t('auth.signIn') }}</Button>
  </form>
</template>
