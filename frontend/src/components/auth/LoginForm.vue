<script setup lang="ts">
import Button from '../common/Button.vue'
import Input from '../common/Input.vue'

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
      label="Email"
      type="email"
      required
      autocomplete="email"
    />
    <Input
      id="login-password"
      v-model="password"
      label="Password"
      type="password"
      required
      autocomplete="current-password"
    />
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <Button type="submit" block :loading="loading">Sign in</Button>
  </form>
</template>
