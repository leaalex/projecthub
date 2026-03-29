<script setup lang="ts"></script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-md rounded-xl border border-border bg-surface p-8">
      <h1 class="text-2xl font-semibold text-foreground">Forgot password</h1>
      <p class="mt-4 text-sm leading-relaxed text-muted">
        Password reset is not available in this version. Please contact your
        administrator to restore access to your account.
      </p>
      <router-link
        to="/login"
        class="mt-6 inline-block text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to sign in
      </router-link>
    </div>
  </div>
</template>
