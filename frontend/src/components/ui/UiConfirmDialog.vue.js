/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { storeToRefs } from 'pinia';
import { onUnmounted, watch } from 'vue';
import { useConfirmStore } from '../../stores/confirm.store';
import Button from './UiButton.vue';
const store = useConfirmStore();
const { open, options } = storeToRefs(store);
function onKey(e) {
    if (!open.value)
        return;
    if (e.key === 'Escape')
        store.answer(false);
}
watch(open, (v) => {
    if (v)
        document.addEventListener('keydown', onKey);
    else
        document.removeEventListener('keydown', onKey);
}, { immediate: true });
onUnmounted(() => document.removeEventListener('keydown', onKey));
const __VLS_ctx = {
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
if (__VLS_ctx.open && __VLS_ctx.options) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "fixed inset-0 z-[90] flex items-center justify-end p-3 sm:p-4 md:p-5" },
        role: "dialog",
        'aria-modal': "true",
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-[90]']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:p-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:p-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.open && __VLS_ctx.options))
                    return;
                __VLS_ctx.store.answer(false);
                // @ts-ignore
                [open, options, store,];
            } },
        ...{ class: "absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" },
        'aria-hidden': "true",
    });
    /** @type {__VLS_StyleScopedClasses['absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-foreground/25']} */ ;
    /** @type {__VLS_StyleScopedClasses['backdrop-blur-[2px]']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-panel relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl ring-1 ring-foreground/5" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-panel']} */ ;
    /** @type {__VLS_StyleScopedClasses['relative']} */ ;
    /** @type {__VLS_StyleScopedClasses['z-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['ring-foreground/5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "text-lg font-semibold text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.options.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-2 text-sm text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    (__VLS_ctx.options.message);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 flex justify-end gap-2" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    const __VLS_12 = Button || Button;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        ...{ 'onClick': {} },
        variant: "secondary",
    }));
    const __VLS_14 = __VLS_13({
        ...{ 'onClick': {} },
        variant: "secondary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    let __VLS_17;
    const __VLS_18 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.open && __VLS_ctx.options))
                    return;
                __VLS_ctx.store.answer(false);
                // @ts-ignore
                [options, options, store,];
            } });
    const { default: __VLS_19 } = __VLS_15.slots;
    (__VLS_ctx.options.cancelLabel);
    // @ts-ignore
    [options,];
    var __VLS_15;
    var __VLS_16;
    const __VLS_20 = Button || Button;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        ...{ 'onClick': {} },
        variant: (__VLS_ctx.options.danger ? 'ghost-danger' : 'primary'),
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onClick': {} },
        variant: (__VLS_ctx.options.danger ? 'ghost-danger' : 'primary'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_25;
    const __VLS_26 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.open && __VLS_ctx.options))
                    return;
                __VLS_ctx.store.answer(true);
                // @ts-ignore
                [options, store,];
            } });
    const { default: __VLS_27 } = __VLS_23.slots;
    (__VLS_ctx.options.confirmLabel);
    // @ts-ignore
    [options,];
    var __VLS_23;
    var __VLS_24;
}
// @ts-ignore
[];
var __VLS_9;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
