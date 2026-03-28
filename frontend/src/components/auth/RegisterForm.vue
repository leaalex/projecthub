<script setup lang="ts">
import Button from '../common/Button.vue'
import Input from '../common/Input.vue'

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
    <Input id="reg-name" v-model="name" label="Name" type="text" autocomplete="name" />
    <Input
      id="reg-email"
      v-model="email"
      label="Email"
      type="email"
      required
      autocomplete="email"
    />
    <Input
      id="reg-password"
      v-model="password"
      label="Password"
      type="password"
      required
      minlength="6"
      autocomplete="new-password"
    />
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <Button type="submit" block :loading="loading">Register</Button>
  </form>
</template>
