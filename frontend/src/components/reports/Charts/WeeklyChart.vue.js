/// <reference types="../../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import Chart from 'chart.js/auto';
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useUiStore } from '../../../stores/ui.store';
const props = defineProps();
const canvasRef = ref(null);
let chart = null;
const ui = useUiStore();
const { theme } = storeToRefs(ui);
function readCssColor(varName, fallback) {
    if (typeof document === 'undefined')
        return fallback;
    const v = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
    return v || fallback;
}
function parseCssColorToRgb(s) {
    const t = s.trim();
    const hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);
    if (hex)
        return {
            r: parseInt(hex[1], 16),
            g: parseInt(hex[2], 16),
            b: parseInt(hex[3], 16),
        };
    const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(t);
    if (rgb)
        return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
    return null;
}
function build() {
    if (!canvasRef.value)
        return;
    chart?.destroy();
    const primaryRaw = readCssColor('--color-primary', '#0e7490');
    const fgRaw = readCssColor('--color-foreground', '#0f172a');
    const primaryRgb = parseCssColorToRgb(primaryRaw) ?? { r: 14, g: 116, b: 144 };
    const fgRgb = parseCssColorToRgb(fgRaw) ?? { r: 15, g: 23, b: 42 };
    const bg = `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.65)`;
    const border = `rgb(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b})`;
    const titleColor = `rgb(${fgRgb.r},${fgRgb.g},${fgRgb.b})`;
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
    });
}
onMounted(() => build());
watch(() => [props.labels, props.values], () => build(), { deep: true });
watch(theme, () => nextTick(() => build()));
onUnmounted(() => {
    chart?.destroy();
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "relative h-64 w-full" },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.canvas)({
    ref: "canvasRef",
});
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
