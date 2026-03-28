<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Button from '../components/common/Button.vue'
import Card from '../components/common/Card.vue'
import Input from '../components/common/Input.vue'
import { useAuthStore } from '../stores/auth.store'

const auth = useAuthStore()
const name = ref('')
const email = ref('')
const saving = ref(false)
const message = ref<string | null>(null)

onMounted(() => {
  name.value = auth.user?.name ?? ''
  email.value = auth.user?.email ?? ''
})

async function save() {
  saving.value = true
  message.value = null
  try {
    await auth.updateProfile({
      name: name.value,
      email: email.value,
    })
    message.value = 'Profile saved.'
  } catch {
    message.value = 'Could not save profile (email may be taken).'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-foreground">Profile</h1>
    <p class="mt-1 text-sm text-muted">Update your account</p>

    <Card class="mt-6 max-w-md" title="Details">
      <form class="space-y-4" @submit.prevent="save">
        <Input id="pf-name" v-model="name" label="Name" />
        <Input
          id="pf-email"
          v-model="email"
          label="Email"
          type="email"
          required
          autocomplete="email"
        />
        <p v-if="message" class="text-sm text-muted">{{ message }}</p>
        <Button type="submit" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save' }}
        </Button>
      </form>
    </Card>
  </div>
</template>
