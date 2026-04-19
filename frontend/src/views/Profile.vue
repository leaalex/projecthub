<script setup lang="ts">
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/vue/24/outline'
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Breadcrumb from '../components/ui/UiBreadcrumb.vue'
import Button from '../components/ui/UiButton.vue'
import Card from '../components/ui/UiCard.vue'
import Input from '../components/ui/UiInput.vue'
import UiSegmentedControl from '../components/ui/UiSegmentedControl.vue'
import { useToast } from '@app/composables/useToast'
import { useAuthStore } from '@app/auth.store'
import { useUiStore, type ThemeMode } from '@app/ui.store'
import type { AppLocale } from '@domain/session/locale'

const auth = useAuthStore()
const ui = useUiStore()
const { t } = useI18n()
const toast = useToast()

const themeOptions = computed(() => {
  const opts: { mode: ThemeMode; label: string; icon: typeof SunIcon }[] = [
    { mode: 'light', label: t('appearance.themeLight'), icon: SunIcon },
    { mode: 'dark', label: t('appearance.themeDark'), icon: MoonIcon },
    { mode: 'system', label: t('appearance.themeSystem'), icon: ComputerDesktopIcon },
  ]
  return opts
})

const breadcrumbItems = computed(() => [
  { label: t('common.home'), to: '/dashboard' },
  { label: t('profile.title') },
])

const localeSegOptions = computed(() => [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
])

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

watch(
  () => ui.locale,
  async (loc) => {
    if (!auth.user) return
    const serverLoc: AppLocale = auth.user.locale === 'en' ? 'en' : 'ru'
    if (loc === serverLoc) return
    try {
      await auth.updateProfile({ locale: loc })
    } catch {
      ui.setLocale(serverLoc)
      toast.error(t('profile.feedbackLocaleSaveFailed'))
    }
  },
)

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
      text: t('profile.feedbackSaved'),
      kind: 'success',
    }
  } catch {
    profileFeedback.value = {
      text: t('profile.feedbackSaveFailed'),
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
      text: t('profile.feedbackPasswordMismatch'),
      kind: 'error',
    }
    return
  }
  if (newPassword.value.length < 8) {
    passwordFeedback.value = {
      text: t('profile.feedbackPasswordShort'),
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
      text: t('profile.feedbackPasswordChanged'),
      kind: 'success',
    }
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const err = (e.response?.data as { error?: string } | undefined)?.error
      if (e.response?.status === 401) {
        passwordFeedback.value = {
          text: t('profile.feedbackWrongCurrent'),
          kind: 'error',
        }
      } else if (err) {
        passwordFeedback.value = { text: err, kind: 'error' }
      } else {
        passwordFeedback.value = {
          text: t('profile.feedbackPasswordFailed'),
          kind: 'error',
        }
      }
    } else {
      passwordFeedback.value = {
        text: t('profile.feedbackPasswordFailed'),
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
    <Breadcrumb class="mb-4" :items="breadcrumbItems" />
    <h1 class="text-2xl font-semibold text-foreground">
      {{ t('profile.title') }}
    </h1>
    <p class="mt-1 text-sm text-muted">
      {{ t('profile.subtitle') }}
    </p>

    <div
      class="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start"
    >
      <div class="flex min-w-0 flex-col gap-6">
        <Card class="min-w-0" :title="t('profile.personalData')">
          <form class="space-y-4" @submit.prevent="save">
            <div class="grid gap-4 sm:grid-cols-2">
              <Input
                id="pf-last-name"
                v-model="lastName"
                :label="t('profile.lastName')"
                autocomplete="family-name"
              />
              <Input
                id="pf-first-name"
                v-model="firstName"
                :label="t('profile.firstName')"
                autocomplete="given-name"
              />
            </div>
            <Input
              id="pf-patronymic"
              v-model="patronymic"
              :label="t('profile.patronymic')"
              autocomplete="additional-name"
            />
            <Input
              id="pf-department"
              v-model="department"
              :label="t('profile.department')"
              autocomplete="organization"
            />
            <Input
              id="pf-job"
              v-model="jobTitle"
              :label="t('profile.jobTitle')"
              autocomplete="organization-title"
            />
            <div class="grid gap-4 sm:grid-cols-2">
              <Input
                id="pf-phone"
                v-model="phone"
                :label="t('profile.phone')"
                type="tel"
                autocomplete="tel"
              />
              <Input
                id="pf-email"
                v-model="email"
                :label="t('profile.email')"
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
              {{ saving ? t('profile.saving') : t('profile.save') }}
            </Button>
          </form>
        </Card>

        <Card class="min-w-0" :title="t('appearance.title')">
          <p class="mb-3 text-sm text-muted">
            {{ t('appearance.themeHint') }}
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
          <p class="mb-2 mt-5 text-sm font-medium text-foreground">
            {{ t('appearance.language') }}
          </p>
          <p class="mb-3 text-sm text-muted">
            {{ t('appearance.languageHint') }}
          </p>
          <UiSegmentedControl
            v-model="ui.locale"
            :aria-label="t('appearance.language')"
            :options="localeSegOptions"
          />
        </Card>
      </div>

      <Card class="min-w-0" :title="t('profile.changePassword')">
        <form class="space-y-4" @submit.prevent="savePassword">
          <Input
            id="pf-cur-pw"
            v-model="currentPassword"
            :label="t('profile.currentPassword')"
            type="password"
            autocomplete="current-password"
          />
          <Input
            id="pf-new-pw"
            v-model="newPassword"
            :label="t('profile.newPassword')"
            type="password"
            autocomplete="new-password"
          />
          <Input
            id="pf-confirm-pw"
            v-model="confirmPassword"
            :label="t('profile.confirmPassword')"
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
            {{
              savingPassword ? t('profile.saving') : t('profile.changePasswordButton')
            }}
          </Button>
        </form>
      </Card>
    </div>
  </div>
</template>
