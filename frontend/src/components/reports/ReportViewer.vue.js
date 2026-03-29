/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed } from 'vue';
import Card from '../ui/UiCard.vue';
import Skeleton from '../ui/UiSkeleton.vue';
import { formatDateShort } from '../../utils/formatters';
import WeeklyChart from './Charts/WeeklyChart.vue';
const props = defineProps();
const chartLabels = computed(() => props.report ? Object.keys(props.report.by_status) : []);
const chartValues = computed(() => props.report ? Object.values(props.report.by_status) : []);
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-y-4" },
    });
    /** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-4 sm:grid-cols-3" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
    for (const [i] of __VLS_vFor((3))) {
        const __VLS_0 = Skeleton;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            key: (i),
            variant: "card",
        }));
        const __VLS_2 = __VLS_1({
            key: (i),
            variant: "card",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        // @ts-ignore
        [loading,];
    }
    const __VLS_5 = Skeleton;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        variant: "line",
        lines: (2),
    }));
    const __VLS_7 = __VLS_6({
        variant: "line",
        lines: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    const __VLS_10 = Skeleton;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        variant: "card",
    }));
    const __VLS_12 = __VLS_11({
        variant: "card",
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
}
else if (__VLS_ctx.report) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid gap-4 sm:grid-cols-3" },
    });
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
    const __VLS_15 = Card || Card;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        padding: "p-4",
    }));
    const __VLS_17 = __VLS_16({
        padding: "p-4",
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    const { default: __VLS_20 } = __VLS_18.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-semibold text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.report.total_tasks);
    // @ts-ignore
    [report, report,];
    var __VLS_18;
    const __VLS_21 = Card || Card;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
        padding: "p-4",
    }));
    const __VLS_23 = __VLS_22({
        padding: "p-4",
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    const { default: __VLS_26 } = __VLS_24.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-semibold text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.report.completed_in_week);
    // @ts-ignore
    [report,];
    var __VLS_24;
    const __VLS_27 = Card || Card;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
        padding: "p-4",
    }));
    const __VLS_29 = __VLS_28({
        padding: "p-4",
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    const { default: __VLS_32 } = __VLS_30.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-2xl font-semibold text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.report.projects_count);
    // @ts-ignore
    [report,];
    var __VLS_30;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    (__VLS_ctx.formatDateShort(__VLS_ctx.report.week_start));
    (__VLS_ctx.formatDateShort(__VLS_ctx.report.week_end));
    const __VLS_33 = Card || Card;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
        padding: "p-4",
    }));
    const __VLS_35 = __VLS_34({
        padding: "p-4",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    const { default: __VLS_38 } = __VLS_36.slots;
    const __VLS_39 = WeeklyChart;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
        labels: (__VLS_ctx.chartLabels),
        values: (__VLS_ctx.chartValues),
    }));
    const __VLS_41 = __VLS_40({
        labels: (__VLS_ctx.chartLabels),
        values: (__VLS_ctx.chartValues),
    }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    // @ts-ignore
    [report, report, formatDateShort, formatDateShort, chartLabels, chartValues,];
    var __VLS_36;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
