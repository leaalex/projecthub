<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav class="text-sm text-muted" aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-1">
      <li v-for="(item, i) in items" :key="i" class="flex items-center gap-1">
        <span v-if="i > 0" class="text-border" aria-hidden="true">/</span>
        <router-link
          v-if="item.to && i < items.length - 1"
          :to="item.to"
          class="text-primary transition-colors hover:underline"
        >
          {{ item.label }}
        </router-link>
        <span
          v-else
          class="font-medium text-foreground"
          :aria-current="i === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
