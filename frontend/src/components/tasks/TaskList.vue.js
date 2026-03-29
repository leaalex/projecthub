/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import TaskCard from './TaskCard.vue';
const __VLS_props = withDefaults(defineProps(), { emptyMessage: '', projects: () => [], assignableUsers: () => [] });
const emit = defineEmits();
const __VLS_defaults = { emptyMessage: '', projects: () => [], assignableUsers: () => [] };
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
    ...{ class: "overflow-hidden rounded-lg border border-border bg-surface shadow-sm" },
});
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
if (__VLS_ctx.$slots.header) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "border-b border-border px-3 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    var __VLS_0 = {};
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "divide-y divide-border" },
});
/** @type {__VLS_StyleScopedClasses['divide-y']} */ ;
/** @type {__VLS_StyleScopedClasses['divide-border']} */ ;
for (const [t] of __VLS_vFor((__VLS_ctx.tasks))) {
    const __VLS_2 = TaskCard;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent1(__VLS_2, new __VLS_2({
        ...{ 'onComplete': {} },
        ...{ 'onReopen': {} },
        ...{ 'onInfo': {} },
        ...{ 'onUpdated': {} },
        key: (t.id),
        ...{ class: "px-3" },
        task: (t),
        canEdit: (__VLS_ctx.canEditTask?.(t) ?? false),
        projects: (__VLS_ctx.projects),
        assignableUsers: (__VLS_ctx.assignableUsers),
    }));
    const __VLS_4 = __VLS_3({
        ...{ 'onComplete': {} },
        ...{ 'onReopen': {} },
        ...{ 'onInfo': {} },
        ...{ 'onUpdated': {} },
        key: (t.id),
        ...{ class: "px-3" },
        task: (t),
        canEdit: (__VLS_ctx.canEditTask?.(t) ?? false),
        projects: (__VLS_ctx.projects),
        assignableUsers: (__VLS_ctx.assignableUsers),
    }, ...__VLS_functionalComponentArgsRest(__VLS_3));
    let __VLS_7;
    const __VLS_8 = ({ complete: {} },
        { onComplete: (...[$event]) => {
                __VLS_ctx.emit('complete', $event);
                // @ts-ignore
                [$slots, tasks, canEditTask, projects, assignableUsers, emit,];
            } });
    const __VLS_9 = ({ reopen: {} },
        { onReopen: (...[$event]) => {
                __VLS_ctx.emit('reopen', $event);
                // @ts-ignore
                [emit,];
            } });
    const __VLS_10 = ({ info: {} },
        { onInfo: (...[$event]) => {
                __VLS_ctx.emit('info', $event);
                // @ts-ignore
                [emit,];
            } });
    const __VLS_11 = ({ updated: {} },
        { onUpdated: (...[$event]) => {
                __VLS_ctx.emit('taskUpdated');
                // @ts-ignore
                [emit,];
            } });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    var __VLS_5;
    var __VLS_6;
    // @ts-ignore
    [];
}
if (__VLS_ctx.tasks.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "px-3 py-8 text-center text-sm text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    (__VLS_ctx.emptyMessage || 'No tasks yet.');
}
// @ts-ignore
var __VLS_1 = __VLS_0;
// @ts-ignore
[tasks, emptyMessage,];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
const __VLS_export = {};
export default {};
