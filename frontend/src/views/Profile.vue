<script setup lang="ts">
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/vue/24/outline'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Button from '../components/ui/UiButton.vue'
import Card from '../components/ui/UiCard.vue'
import Input from '../components/ui/UiInput.vue'
import { useAuthStore } from '../stores/auth.store'
import { useUiStore, type ThemeMode } from '../stores/ui.store'

const auth = useAuthStore()
const ui = useUiStore()

const themeOptions: {
  mode: ThemeMode
  label: string
  icon: typeof SunIcon
}[] = [
  { mode: 'light', label: 'Light', icon: SunIcon },
  { mode: 'dark', label: 'Dark', icon: MoonIcon },
  { mode: 'system', label: 'System', icon: ComputerDesktopIcon },
]

const lastName = ref('')
const firstName = ref('')
const patronymic = ref('')
const department = ref('')
const jobTitle = ref('')
const phone = ref('')
const email = ref('')

const saving = ref(false)
const profileFeedback = ref<{
  text: string
  kind: 'success' | 'error'
} | null>(null)

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const savingPassword = ref(false)
const passwordFeedback = ref<{
  text: string
  kind: 'success' | 'error'
} | null>(null)

function fillFromUser() {
  const u = auth.user
  if (!u) return
  lastName.value = u.last_name ?? ''
  firstName.value = u.first_name ?? ''
  patronymic.value = u.patronymic ?? ''
  department.value = u.department ?? ''
  jobTitle.value = u.job_title ?? ''
  phone.value = u.phone ?? ''
  email.value = u.email ?? ''
}

onMounted(async () => {
  try {
    await auth.fetchMe()
  } catch {
    /* keep cached user */
  }
  fillFromUser()
})

async function save() {
  saving.value = true
  profileFeedback.value = null
  try {
    await auth.updateProfile({
      email: email.value,
      last_name: lastName.value,
      first_name: firstName.value,
      patronymic: patronymic.value,
      department: department.value,
      job_title: jobTitle.value,
      phone: phone.value,
    })
    profileFeedback.value = {
      text: 'Данные сохранены.',
      kind: 'success',
    }
  } catch {
    profileFeedback.value = {
      text: 'Не удалось сохранить (возможно, email уже занят).',
      kind: 'error',
    }
  } finally {
    saving.value = false
  }
}

async function savePassword() {
  passwordFeedback.value = null
  if (newPassword.value !== confirmPassword.value) {
    passwordFeedback.value = {
      text: 'Новый пароль и подтверждение не совпадают.',
      kind: 'error',
    }
    return
  }
  if (newPassword.value.length < 8) {
    passwordFeedback.value = {
      text: 'Новый пароль — не менее 8 символов.',
      kind: 'error',
    }
    return
  }
  savingPassword.value = true
  try {
    await auth.changePassword(currentPassword.value, newPassword.value)
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordFeedback.value = {
      text: 'Пароль изменён.',
      kind: 'success',
    }
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const err = (e.response?.data as { error?: string } | undefined)?.error
      if (e.response?.status === 401) {
        passwordFeedback.value = {
          text: 'Неверный текущий пароль.',
          kind: 'error',
        }
      } else if (err) {
        passwordFeedback.value = { text: err, kind: 'error' }
      } else {
        passwordFeedback.value = {
          text: 'Не удалось сменить пароль.',
          kind: 'error',
        }
      }
    } else {
      passwordFeedback.value = {
        text: 'Не удалось сменить пароль.',
        kind: 'error',
      }
    }
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div>
    <Breadcrumb
      class="mb-4"
      :items="[
        { label: 'Home', to: '/dashboard' },
        { label: 'Profile' },
      ]"
    />
    <h1 class="text-2xl font-semibold text-foreground">Профиль</h1>
    <p class="mt-1 text-sm text-muted">
      Личные данные и безопасность
    </p>
    <p
      v-if="auth.user?.role === 'admin' || auth.user?.role === 'staff'"
      class="mt-3 text-sm"
    >
      <RouterLink
        to="/admin/users"
        class="font-medium text-primary underline underline-offset-2 hover:no-underline"
      >
        Пользователи и глобальные роли
      </RouterLink>
    </p>

    <div
      class="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start"
    >
      <div class="flex min-w-0 flex-col gap-6">
        <Card class="min-w-0" title="Персональные данные">
          <form class="space-y-4" @submit.prevent="save">
            <div class="grid gap-4 sm:grid-cols-2">
              <Input
                id="pf-last-name"
                v-model="lastName"
                label="Фамилия"
                autocomplete="family-name"
              />
              <Input
                id="pf-first-name"
                v-model="firstName"
                label="Имя"
                autocomplete="given-name"
              />
            </div>
            <Input
              id="pf-patronymic"
              v-model="patronymic"
              label="Отчество"
              autocomplete="additional-name"
            />
            <Input
              id="pf-department"
              v-model="department"
              label="Название подразделения"
              autocomplete="organization"
            />
            <Input
              id="pf-job"
              v-model="jobTitle"
              label="Должность"
              autocomplete="organization-title"
            />
            <div class="grid gap-4 sm:grid-cols-2">
              <Input
                id="pf-phone"
                v-model="phone"
                label="Телефон"
                type="tel"
                autocomplete="tel"
              />
              <Input
                id="pf-email"
                v-model="email"
                label="Email"
                type="email"
                required
                autocomplete="email"
              />
            </div>
            <p
              v-if="profileFeedback"
              class="text-sm"
              :class="
                profileFeedback.kind === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-destructive'
              "
            >
              {{ profileFeedback.text }}
            </p>
            <Button type="submit" :disabled="saving">
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </Button>
          </form>
        </Card>

        <Card class="min-w-0" title="Appearance">
          <p class="mb-3 text-sm text-muted">
            Color theme for this device
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in themeOptions"
              :key="opt.mode"
              type="button"
              class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
              :class="
                ui.theme === opt.mode
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface-muted/50 text-muted hover:bg-surface-muted hover:text-foreground'
              "
              :aria-pressed="ui.theme === opt.mode"
              @click="ui.setTheme(opt.mode)"
            >
              <component :is="opt.icon" class="h-5 w-5 shrink-0" aria-hidden="true" />
              {{ opt.label }}
            </button>
          </div>
        </Card>
      </div>

      <Card class="min-w-0" title="Смена пароля">
        <form class="space-y-4" @submit.prevent="savePassword">
          <Input
            id="pf-cur-pw"
            v-model="currentPassword"
            label="Текущий пароль"
            type="password"
            autocomplete="current-password"
          />
          <Input
            id="pf-new-pw"
            v-model="newPassword"
            label="Новый пароль"
            type="password"
            autocomplete="new-password"
          />
          <Input
            id="pf-confirm-pw"
            v-model="confirmPassword"
            label="Подтверждение нового пароля"
            type="password"
            autocomplete="new-password"
          />
          <p
            v-if="passwordFeedback"
            class="text-sm"
            :class="
              passwordFeedback.kind === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive'
            "
          >
            {{ passwordFeedback.text }}
          </p>
          <Button type="submit" :disabled="savingPassword">
            {{ savingPassword ? 'Сохранение…' : 'Сменить пароль' }}
          </Button>
        </form>
      </Card>
    </div>
  </div>
</template>
