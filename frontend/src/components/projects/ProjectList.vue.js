/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import ProjectCard from './ProjectCard.vue';
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
    ...{ class: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
for (const [p] of __VLS_vFor((__VLS_ctx.projects))) {
    const __VLS_0 = ProjectCard;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onOpen': {} },
        ...{ 'onEdit': {} },
        key: (p.id),
        project: (p),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onOpen': {} },
        ...{ 'onEdit': {} },
        key: (p.id),
        project: (p),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ open: {} },
        { onOpen: (...[$event]) => {
                __VLS_ctx.emit('open', $event);
                // @ts-ignore
                [projects, emit,];
            } });
    const __VLS_7 = ({ edit: {} },
        { onEdit: (...[$event]) => {
                __VLS_ctx.emit('edit', $event);
                // @ts-ignore
                [emit,];
            } });
    var __VLS_3;
    var __VLS_4;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
