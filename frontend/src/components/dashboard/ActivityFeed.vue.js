/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import Card from '../ui/UiCard.vue';
import EmptyState from '../ui/UiEmptyState.vue';
import { timeAgo } from '../../utils/formatters';
const __VLS_props = defineProps();
function formatAt(at) {
    if (at === '—')
        return at;
    return timeAgo(at);
}
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
const __VLS_0 = Card || Card;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    padding: "p-4",
}));
const __VLS_2 = __VLS_1({
    padding: "p-4",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
    ...{ class: "mb-3 text-sm font-semibold text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
if (__VLS_ctx.items.length) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "space-y-2 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    for (const [it, i] of __VLS_vFor((__VLS_ctx.items))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (i),
            ...{ class: "flex justify-between gap-4 border-b border-border py-2 last:border-0" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['last:border-0']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (it.label);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "shrink-0 text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (__VLS_ctx.formatAt(it.at));
        // @ts-ignore
        [items, items, formatAt,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "py-2" },
    });
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    const __VLS_7 = EmptyState;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        title: "No recent activity",
        description: "Summary items will show here when available.",
    }));
    const __VLS_9 = __VLS_8({
        title: "No recent activity",
        description: "Summary items will show here when available.",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
