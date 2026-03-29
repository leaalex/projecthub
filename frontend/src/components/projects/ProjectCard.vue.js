/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { PencilSquareIcon } from '@heroicons/vue/24/outline';
import { timeAgo } from '../../utils/formatters';
import Button from '../ui/UiButton.vue';
const __VLS_props = defineProps();
const emit = defineEmits();
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
    ...{ class: "flex flex-col justify-between rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:shadow-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "font-semibold text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.project.name);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-1 line-clamp-2 text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
(__VLS_ctx.project.description || 'No description');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-2 text-xs text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/80" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/80']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    'aria-hidden': "true",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.project.owner
    ? __VLS_ctx.project.owner.name || __VLS_ctx.project.owner.email
    : `User #${__VLS_ctx.project.owner_id}`);
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-1 text-xs text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
(__VLS_ctx.timeAgo(__VLS_ctx.project.updated_at));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-4 flex items-center gap-2" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_0 = Button || Button;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    ...{ class: "min-w-0 flex-1" },
    variant: "secondary",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    ...{ class: "min-w-0 flex-1" },
    variant: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('open', __VLS_ctx.project.id);
            // @ts-ignore
            [project, project, project, project, project, project, project, project, timeAgo, emit,];
        } });
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
const { default: __VLS_7 } = __VLS_3.slots;
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
const __VLS_8 = Button || Button;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    type: "button",
    variant: "secondary",
    ...{ class: "shrink-0 px-2.5" },
    'aria-label': (`Edit project ${__VLS_ctx.project.name}`),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    type: "button",
    variant: "secondary",
    ...{ class: "shrink-0 px-2.5" },
    'aria-label': (`Edit project ${__VLS_ctx.project.name}`),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_13;
const __VLS_14 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.emit('edit', __VLS_ctx.project.id);
            // @ts-ignore
            [project, project, emit,];
        } });
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
const { default: __VLS_15 } = __VLS_11.slots;
let __VLS_16;
/** @ts-ignore @type {typeof __VLS_components.PencilSquareIcon} */
PencilSquareIcon;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    ...{ class: "h-4 w-4" },
    'aria-hidden': "true",
}));
const __VLS_18 = __VLS_17({
    ...{ class: "h-4 w-4" },
    'aria-hidden': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "sr-only" },
});
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
// @ts-ignore
[];
var __VLS_11;
var __VLS_12;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
