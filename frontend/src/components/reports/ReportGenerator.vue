<script setup lang="ts">
import Button from '../common/Button.vue'

const emit = defineEmits<{
  generate: []
  downloadPdf: []
  downloadExcel: []
}>()

defineProps<{
  generating?: boolean
}>()
</script>

<template>
  <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
    <h3 class="text-sm font-semibold text-foreground">Export</h3>
    <p class="mt-1 text-sm text-muted">
      Custom report queue is a stub; weekly stats load from the API above.
    </p>
    <div class="mt-4 flex flex-wrap gap-2">
      <Button :disabled="generating" @click="emit('generate')">
        {{ generating ? 'Queueing…' : 'Generate report (stub)' }}
      </Button>
      <Button variant="secondary" @click="emit('downloadPdf')">
        Download PDF
      </Button>
      <Button variant="secondary" @click="emit('downloadExcel')">
        Download Excel
      </Button>
    </div>
  </div>
</template>
