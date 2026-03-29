/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import Button from '../ui/UiButton.vue';
import Input from '../ui/UiInput.vue';
import UiTextarea from '../ui/UiTextarea.vue';
const name = defineModel('name', { default: '' });
const description = defineModel('description', { default: '' });
const __VLS_props = defineProps();
const emit = defineEmits();
const __VLS_defaultModels = {
    'name': '',
    'description': '',
};
let __VLS_modelEmit;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (...[$event]) => {
            __VLS_ctx.emit('submit');
            // @ts-ignore
            [emit,];
        } },
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
const __VLS_0 = Input;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    id: "pf-name",
    modelValue: (__VLS_ctx.name),
    label: "Name",
    required: true,
    autofocus: true,
}));
const __VLS_2 = __VLS_1({
    id: "pf-name",
    modelValue: (__VLS_ctx.name),
    label: "Name",
    required: true,
    autofocus: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_5 = UiTextarea;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    id: "pf-desc",
    modelValue: (__VLS_ctx.description),
    label: "Description",
    rows: (3),
}));
const __VLS_7 = __VLS_6({
    id: "pf-desc",
    modelValue: (__VLS_ctx.description),
    label: "Description",
    rows: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap items-center gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
var __VLS_10 = {};
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "ml-auto flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_12 = Button || Button;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    type: "button",
    variant: "ghost",
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    type: "button",
    variant: "ghost",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_17;
const __VLS_18 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('cancel');
            // @ts-ignore
            [emit, name, description,];
        } });
const { default: __VLS_19 } = __VLS_15.slots;
// @ts-ignore
[];
var __VLS_15;
var __VLS_16;
const __VLS_20 = Button || Button;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    type: "submit",
    loading: (__VLS_ctx.loading),
}));
const __VLS_22 = __VLS_21({
    type: "submit",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const { default: __VLS_25 } = __VLS_23.slots;
(__VLS_ctx.submitLabel ?? 'Save');
// @ts-ignore
[loading, submitLabel,];
var __VLS_23;
// @ts-ignore
var __VLS_11 = __VLS_10;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
const __VLS_export = {};
export default {};
