<script setup lang="ts">
defineProps<{
  headers: string[]
}>()
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-border">
    <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
      <thead>
        <tr class="border-b border-border bg-surface-muted">
          <th
            v-for="(h, i) in headers"
            :key="i"
            class="px-4 py-3 font-semibold text-foreground"
          >
            {{ h }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border bg-surface">
        <slot />
      </tbody>
    </table>
  </div>
</template>
