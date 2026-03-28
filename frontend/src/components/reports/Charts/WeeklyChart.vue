<script setup lang="ts">
import Chart from 'chart.js/auto'
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useUiStore } from '../../../stores/ui.store'

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'bar'> | null = null

const ui = useUiStore()
const { theme } = storeToRefs(ui)

function readCssColor(varName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  return v || fallback
}

function parseCssColorToRgb(s: string): { r: number; g: number; b: number } | null {
  const t = s.trim()
  const hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t)
  if (hex)
    return {
      r: parseInt(hex[1], 16),
      g: parseInt(hex[2], 16),
      b: parseInt(hex[3], 16),
    }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(t)
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] }
  return null
}

function build() {
  if (!canvasRef.value) return
  chart?.destroy()

  const primaryRaw = readCssColor('--color-primary', '#0e7490')
  const fgRaw = readCssColor('--color-foreground', '#0f172a')
  const primaryRgb = parseCssColorToRgb(primaryRaw) ?? { r: 14, g: 116, b: 144 }
  const fgRgb = parseCssColorToRgb(fgRaw) ?? { r: 15, g: 23, b: 42 }

  const bg = `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.65)`
  const border = `rgb(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b})`
  const titleColor = `rgb(${fgRgb.r},${fgRgb.g},${fgRgb.b})`

  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Tasks',
          data: props.values,
          backgroundColor: bg,
          borderColor: border,
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
          color: titleColor,
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

watch(theme, () => nextTick(() => build()))

onUnmounted(() => {
  chart?.destroy()
})
</script>

<template>
  <div class="relative h-64 w-full">
    <canvas ref="canvasRef" />
  </div>
</template>
