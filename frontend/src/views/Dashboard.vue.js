/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref } from 'vue';
import ActivityFeed from '../components/dashboard/ActivityFeed.vue';
import StatsCard from '../components/dashboard/StatsCard.vue';
import Breadcrumb from '../components/ui/UiBreadcrumb.vue';
import Card from '../components/ui/UiCard.vue';
import Skeleton from '../components/ui/UiSkeleton.vue';
import { api } from '../utils/api';
import { useProjectStore } from '../stores/project.store';
const projectStore = useProjectStore();
const report = ref(null);
const health = ref(null);
const dashboardLoading = ref(true);
onMounted(async () => {
    try {
        const [h, w] = await Promise.all([
            api.get('/health'),
            api.get('/reports/weekly'),
        ]);
        health.value = h.data.status;
        report.value = w.data;
        await projectStore.fetchList();
    }
    catch {
        health.value = null;
    }
    finally {
        dashboardLoading.value = false;
    }
});
const activityItems = computed(() => {
    if (!report.value)
        return [];
    return [
        {
            label: `Total tasks in scope: ${report.value.total_tasks}`,
            at: report.value.week_start,
        },
        {
            label: `Projects owned: ${report.value.projects_count}`,
            at: '—',
        },
    ];
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
const __VLS_0 = Breadcrumb;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'Dashboard' },
    ]),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'Dashboard' },
    ]),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
    ...{ class: "text-2xl font-semibold text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-1 text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
if (__VLS_ctx.dashboardLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
    for (const [i] of __VLS_vFor((4))) {
        const __VLS_5 = Skeleton;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
            key: (i),
            variant: "card",
        }));
        const __VLS_7 = __VLS_6({
            key: (i),
            variant: "card",
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        // @ts-ignore
        [dashboardLoading,];
    }
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
    const __VLS_10 = StatsCard;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        title: "API",
        value: (__VLS_ctx.health === null ? '…' : __VLS_ctx.health === 'ok' ? 'OK' : '—'),
        hint: "Health check",
    }));
    const __VLS_12 = __VLS_11({
        title: "API",
        value: (__VLS_ctx.health === null ? '…' : __VLS_ctx.health === 'ok' ? 'OK' : '—'),
        hint: "Health check",
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    const __VLS_15 = StatsCard;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        title: "Projects",
        value: (__VLS_ctx.projectStore.projects.length),
        hint: "Owned by you",
    }));
    const __VLS_17 = __VLS_16({
        title: "Projects",
        value: (__VLS_ctx.projectStore.projects.length),
        hint: "Owned by you",
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    const __VLS_20 = StatsCard;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        title: "Tasks (scope)",
        value: (__VLS_ctx.report?.total_tasks ?? '—'),
        hint: "Visible tasks",
    }));
    const __VLS_22 = __VLS_21({
        title: "Tasks (scope)",
        value: (__VLS_ctx.report?.total_tasks ?? '—'),
        hint: "Visible tasks",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    const __VLS_25 = StatsCard;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        title: "Done this week",
        value: (__VLS_ctx.report?.completed_in_week ?? '—'),
        hint: "Completed in current week",
    }));
    const __VLS_27 = __VLS_26({
        title: "Done this week",
        value: (__VLS_ctx.report?.completed_in_week ?? '—'),
        hint: "Completed in current week",
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-6 grid gap-6 lg:grid-cols-2" },
});
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
if (__VLS_ctx.dashboardLoading) {
    const __VLS_30 = Card || Card;
    // @ts-ignore
    const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        ...{ class: "min-w-0" },
        padding: "p-4",
    }));
    const __VLS_32 = __VLS_31({
        ...{ class: "min-w-0" },
        padding: "p-4",
    }, ...__VLS_functionalComponentArgsRest(__VLS_31));
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    const { default: __VLS_35 } = __VLS_33.slots;
    const __VLS_36 = Skeleton;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        variant: "line",
        lines: (4),
    }));
    const __VLS_38 = __VLS_37({
        variant: "line",
        lines: (4),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    // @ts-ignore
    [dashboardLoading, health, health, projectStore, report, report,];
    var __VLS_33;
}
else {
    const __VLS_41 = ActivityFeed;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
        items: (__VLS_ctx.activityItems),
    }));
    const __VLS_43 = __VLS_42({
        items: (__VLS_ctx.activityItems),
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
}
if (__VLS_ctx.dashboardLoading) {
    const __VLS_46 = Card || Card;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        ...{ class: "min-w-0" },
        padding: "p-4",
    }));
    const __VLS_48 = __VLS_47({
        ...{ class: "min-w-0" },
        padding: "p-4",
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    const { default: __VLS_51 } = __VLS_49.slots;
    const __VLS_52 = Skeleton;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
        variant: "line",
        ...{ class: "mb-3 max-w-[8rem]" },
    }));
    const __VLS_54 = __VLS_53({
        variant: "line",
        ...{ class: "mb-3 max-w-[8rem]" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-[8rem]']} */ ;
    const __VLS_57 = Skeleton;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        variant: "line",
        lines: (4),
    }));
    const __VLS_59 = __VLS_58({
        variant: "line",
        lines: (4),
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    // @ts-ignore
    [dashboardLoading, activityItems,];
    var __VLS_49;
}
else {
    const __VLS_62 = Card || Card;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        ...{ class: "min-w-0 text-sm text-muted" },
        padding: "p-4",
    }));
    const __VLS_64 = __VLS_63({
        ...{ class: "min-w-0 text-sm text-muted" },
        padding: "p-4",
    }, ...__VLS_functionalComponentArgsRest(__VLS_63));
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    const { default: __VLS_67 } = __VLS_65.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "font-medium text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "mt-2 space-y-1" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    let __VLS_68;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
        ...{ class: "text-primary hover:underline" },
        to: "/projects",
    }));
    const __VLS_70 = __VLS_69({
        ...{ class: "text-primary hover:underline" },
        to: "/projects",
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
    const { default: __VLS_73 } = __VLS_71.slots;
    // @ts-ignore
    [];
    var __VLS_71;
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    let __VLS_74;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
        ...{ class: "text-primary hover:underline" },
        to: "/tasks",
    }));
    const __VLS_76 = __VLS_75({
        ...{ class: "text-primary hover:underline" },
        to: "/tasks",
    }, ...__VLS_functionalComponentArgsRest(__VLS_75));
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
    const { default: __VLS_79 } = __VLS_77.slots;
    // @ts-ignore
    [];
    var __VLS_77;
    __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({});
    let __VLS_80;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
        ...{ class: "text-primary hover:underline" },
        to: "/reports",
    }));
    const __VLS_82 = __VLS_81({
        ...{ class: "text-primary hover:underline" },
        to: "/reports",
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
    const { default: __VLS_85 } = __VLS_83.slots;
    // @ts-ignore
    [];
    var __VLS_83;
    // @ts-ignore
    [];
    var __VLS_65;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
