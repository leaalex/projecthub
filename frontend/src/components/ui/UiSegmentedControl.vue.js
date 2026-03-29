/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
const __VLS_props = withDefaults(defineProps(), { ariaLabel: 'Segmented control' });
const emit = defineEmits();
const __VLS_defaults = { ariaLabel: 'Segmented control' };
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "inline-flex gap-0.5 rounded-lg border border-border bg-surface-muted/50 p-0.5" },
    role: "tablist",
    'aria-label': (__VLS_ctx.ariaLabel),
});
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-muted/50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-0.5']} */ ;
for (const [opt] of __VLS_vFor((__VLS_ctx.options))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('update:modelValue', opt.value);
                // @ts-ignore
                [ariaLabel, options, emit,];
            } },
        key: (opt.value),
        type: "button",
        role: "tab",
        'aria-selected': (__VLS_ctx.modelValue === opt.value),
        tabindex: (__VLS_ctx.modelValue === opt.value ? 0 : -1),
        disabled: (opt.disabled),
        ...{ class: "inline-flex h-8 min-h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" },
        ...{ class: (__VLS_ctx.modelValue === opt.value
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground') },
    });
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:pointer-events-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
    (opt.label);
    // @ts-ignore
    [modelValue, modelValue, modelValue,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
