/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed } from 'vue';
import { formatTaskStatus } from '../../utils/formatters';
const props = defineProps();
const label = computed(() => {
    if (props.kind === 'status')
        return formatTaskStatus(props.value);
    return props.value;
});
const classNames = computed(() => {
    if (props.kind === 'status') {
        const m = {
            todo: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
            in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
            review: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
            done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
        };
        return m[props.value] ?? m.todo;
    }
    const m = {
        low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        medium: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
        critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    };
    return m[props.value] ?? m.medium;
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
    ...{ class: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize" },
    ...{ class: (__VLS_ctx.classNames) },
});
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
(__VLS_ctx.label);
// @ts-ignore
[classNames, label,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
