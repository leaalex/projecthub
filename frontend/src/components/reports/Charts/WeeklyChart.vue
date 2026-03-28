<script setup lang="ts">
import Chart from 'chart.js/auto'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'bar'> | null = null

function build() {
  if (!canvasRef.value) return
  chart?.destroy()
  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Tasks',
          data: props.values,
          backgroundColor: 'rgba(109, 40, 217, 0.6)',
          borderColor: 'rgba(109, 40, 217, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Tasks by status',
          color: '#0f172a',
        },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  })
}

onMounted(() => build())

watch(
  () => [props.labels, props.values],
  () => build(),
  { deep: true },
)

onUnmounted(() => {
  chart?.destroy()
})
</script>

<template>
  <div class="relative h-64 w-full">
    <canvas ref="canvasRef" />
  </div>
</template>
