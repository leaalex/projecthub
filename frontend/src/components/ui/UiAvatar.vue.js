/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed } from 'vue';
const props = defineProps();
const initials = computed(() => {
    const n = props.name?.trim();
    if (n) {
        const parts = n.split(/\s+/).filter(Boolean);
        if (parts.length >= 2)
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return n.slice(0, 2).toUpperCase();
    }
    const e = props.email?.trim();
    if (e) {
        const local = e.split('@')[0] ?? e;
        return local.slice(0, 2).toUpperCase();
    }
    return '?';
});
function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++)
        h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}
/** Fixed palette (Tailwind); works in light/dark. */
const PALETTE = [
    'bg-sky-600 text-white dark:bg-sky-700',
    'bg-teal-600 text-white dark:bg-teal-700',
    'bg-indigo-600 text-white dark:bg-indigo-700',
    'bg-violet-600 text-white dark:bg-violet-700',
    'bg-cyan-600 text-white dark:bg-cyan-700',
    'bg-blue-600 text-white dark:bg-blue-700',
    'bg-emerald-600 text-white dark:bg-emerald-700',
    'bg-fuchsia-600 text-white dark:bg-fuchsia-800',
];
const paletteClass = computed(() => {
    const key = props.email || props.name || 'x';
    return PALETTE[hashString(key) % PALETTE.length];
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold" },
    ...{ class: (__VLS_ctx.paletteClass) },
    title: (__VLS_ctx.email || __VLS_ctx.name || undefined),
    'aria-hidden': "true",
});
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
(__VLS_ctx.initials);
// @ts-ignore
[paletteClass, email, name, initials,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
