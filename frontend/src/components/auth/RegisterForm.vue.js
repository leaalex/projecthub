/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import Button from '../ui/UiButton.vue';
import Input from '../ui/UiInput.vue';
const name = defineModel('name', { default: '' });
const email = defineModel('email', { default: '' });
const password = defineModel('password', { default: '' });
const __VLS_props = defineProps();
const emit = defineEmits();
const __VLS_defaultModels = {
    'name': '',
    'email': '',
    'password': '',
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
    id: "reg-name",
    modelValue: (__VLS_ctx.name),
    label: "Name",
    type: "text",
    autocomplete: "name",
}));
const __VLS_2 = __VLS_1({
    id: "reg-name",
    modelValue: (__VLS_ctx.name),
    label: "Name",
    type: "text",
    autocomplete: "name",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_5 = Input;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    id: "reg-email",
    modelValue: (__VLS_ctx.email),
    label: "Email",
    type: "email",
    required: true,
    autocomplete: "email",
}));
const __VLS_7 = __VLS_6({
    id: "reg-email",
    modelValue: (__VLS_ctx.email),
    label: "Email",
    type: "email",
    required: true,
    autocomplete: "email",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const __VLS_10 = Input;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    id: "reg-password",
    modelValue: (__VLS_ctx.password),
    label: "Password",
    type: "password",
    required: true,
    minlength: "6",
    autocomplete: "new-password",
}));
const __VLS_12 = __VLS_11({
    id: "reg-password",
    modelValue: (__VLS_ctx.password),
    label: "Password",
    type: "password",
    required: true,
    minlength: "6",
    autocomplete: "new-password",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-destructive" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
    (__VLS_ctx.error);
}
const __VLS_15 = Button || Button;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    type: "submit",
    block: true,
    loading: (__VLS_ctx.loading),
}));
const __VLS_17 = __VLS_16({
    type: "submit",
    block: true,
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
const { default: __VLS_20 } = __VLS_18.slots;
// @ts-ignore
[name, email, password, error, error, loading,];
var __VLS_18;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
