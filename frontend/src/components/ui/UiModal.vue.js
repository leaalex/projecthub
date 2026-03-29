/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { nextTick, onMounted, onUnmounted, ref, watch, } from 'vue';
const props = withDefaults(defineProps(), { wide: false });
const emit = defineEmits();
const panelRef = ref(null);
function close() {
    emit('update:modelValue', false);
}
function onDocKey(e) {
    if (e.key === 'Escape' && props.modelValue)
        close();
}
function getFocusable(root) {
    const sel = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(root.querySelectorAll(sel));
}
function onPanelKeydown(e) {
    if (e.key !== 'Tab' || !panelRef.value)
        return;
    const list = getFocusable(panelRef.value);
    if (list.length === 0)
        return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey) {
        if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    }
    else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}
watch(() => props.modelValue, async (open) => {
    if (!open)
        return;
    await nextTick();
    const root = panelRef.value;
    if (!root)
        return;
    const list = getFocusable(root);
    const first = list.find((el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') ?? list[0];
    first?.focus();
});
onMounted(() => document.addEventListener('keydown', onDocKey));
onUnmounted(() => document.removeEventListener('keydown', onDocKey));
const __VLS_defaults = { wide: false };
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
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    name: "modal",
}));
const __VLS_8 = __VLS_7({
    name: "modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const { default: __VLS_11 } = __VLS_9.slots;
if (__VLS_ctx.modelValue) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "fixed inset-0 z-50 flex justify-end p-3 sm:p-4 md:p-5" },
        role: "dialog",
        'aria-modal': "true",
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-50']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:p-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ onClick: (__VLS_ctx.close) },
        ...{ class: "absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-foreground/25']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-[2px]']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onKeydown: (__VLS_ctx.onPanelKeydown) },
        ref: "panelRef",
        ...{ class: "modal-panel relative z-10 flex h-full max-h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl ring-1 ring-foreground/5" },
        ...{ class: (__VLS_ctx.wide ? 'max-w-2xl' : 'max-w-lg') },
    });
    /** @type {__VLS_StyleScopedClasses['modal-panel']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-h-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['ring-foreground/5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
    if (__VLS_ctx.title) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-lg font-semibold text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.title);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.close) },
        type: "button",
        ...{ class: "ml-auto shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground" },
        'aria-label': "Close",
    });
    /** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
    let __VLS_12;
    /** @ts-ignore @type {typeof __VLS_components.XMarkIcon} */
    XMarkIcon;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_14 = __VLS_13({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:py-5']} */ ;
    var __VLS_17 = {};
}
// @ts-ignore
[modelValue, close, close, onPanelKeydown, wide, title, title,];
var __VLS_9;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_18 = __VLS_17;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
const __VLS_export = {};
export default {};
