<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Button from '../ui/UiButton.vue'
import Input from '../ui/UiInput.vue'

const { t } = useI18n()

const name = defineModel<string>('name', { default: '' })
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
    <Input id="reg-name" v-model="name" :label="t('auth.fields.name')" type="text" autocomplete="name" />
    <Input
      id="reg-email"
      v-model="email"
      :label="t('auth.fields.email')"
      type="email"
      required
      autocomplete="email"
    />
    <Input
      id="reg-password"
      v-model="password"
      :label="t('auth.fields.password')"
      type="password"
      required
      minlength="6"
      autocomplete="new-password"
    />
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <Button type="submit" block :loading="loading">{{ t('auth.register') }}</Button>
  </form>
</template>
