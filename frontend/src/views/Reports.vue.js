/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted, ref } from 'vue';
import Breadcrumb from '../components/ui/UiBreadcrumb.vue';
import Button from '../components/ui/UiButton.vue';
import EmptyState from '../components/ui/UiEmptyState.vue';
import Modal from '../components/ui/UiModal.vue';
import Skeleton from '../components/ui/UiSkeleton.vue';
import ReportSettings from '../components/reports/ReportSettings.vue';
import ReportViewer from '../components/reports/ReportViewer.vue';
import Card from '../components/ui/UiCard.vue';
import Table from '../components/ui/UiTable.vue';
import { useConfirm } from '../composables/useConfirm';
import { useToast } from '../composables/useToast';
import { api } from '../utils/api';
import { formatDateShort } from '../utils/formatters';
const report = ref(null);
const loading = ref(true);
const generating = ref(false);
const msg = ref(null);
const { confirm } = useConfirm();
const toast = useToast();
const modalOpen = ref(false);
const savedReports = ref([]);
const loadingExports = ref(false);
const deletingId = ref(null);
async function loadWeekly() {
    loading.value = true;
    msg.value = null;
    try {
        const { data } = await api.get('/reports/weekly');
        report.value = data;
    }
    catch {
        msg.value = 'Could not load report.';
    }
    finally {
        loading.value = false;
    }
}
async function loadExports() {
    loadingExports.value = true;
    try {
        const { data } = await api.get('/reports/exports');
        savedReports.value = data.reports;
    }
    catch {
        savedReports.value = [];
    }
    finally {
        loadingExports.value = false;
    }
}
onMounted(async () => {
    await loadWeekly();
    await loadExports();
});
function parseFilename(cd, fallback) {
    if (!cd)
        return fallback;
    const m = /filename="([^"]+)"/.exec(cd);
    if (m?.[1])
        return m[1];
    const m2 = /filename\*=UTF-8''([^;]+)/.exec(cd);
    if (m2?.[1])
        return decodeURIComponent(m2[1]);
    return fallback;
}
function formatBytes(n) {
    if (n < 1024)
        return `${n} B`;
    if (n < 1024 * 1024)
        return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
async function onCreateReport(cfg) {
    generating.value = true;
    msg.value = null;
    try {
        await api.post('/reports/generate', cfg);
        modalOpen.value = false;
        await loadExports();
    }
    catch (e) {
        const err = e;
        msg.value = err.response?.data?.error ?? 'Could not create report.';
    }
    finally {
        generating.value = false;
    }
}
async function downloadSaved(r) {
    msg.value = null;
    const fallback = r.display_name || `report.${r.format}`;
    try {
        const resp = await api.get(`/reports/exports/${r.id}/download`, { responseType: 'blob' });
        const ct = resp.headers['content-type'] || '';
        if (ct.includes('application/json')) {
            const text = await resp.data.text();
            try {
                const j = JSON.parse(text);
                msg.value = j.error ?? 'Download failed.';
            }
            catch {
                msg.value = 'Download failed.';
            }
            return;
        }
        const url = URL.createObjectURL(resp.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = parseFilename(resp.headers['content-disposition'], fallback);
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
    catch (e) {
        const err = e;
        const blob = err.response?.data;
        if (blob instanceof Blob) {
            const text = await blob.text();
            try {
                const j = JSON.parse(text);
                msg.value = j.error ?? 'Download failed.';
            }
            catch {
                msg.value = 'Download failed.';
            }
        }
        else {
            msg.value = 'Download failed.';
        }
    }
}
async function deleteSaved(r) {
    const ok = await confirm({
        title: 'Delete report',
        message: `Remove “${r.display_name}” from the server? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
    });
    if (!ok)
        return;
    msg.value = null;
    deletingId.value = r.id;
    try {
        await api.delete(`/reports/exports/${r.id}`);
        await loadExports();
        toast.success('Report deleted');
    }
    catch (e) {
        const err = e;
        msg.value = err.response?.data?.error ?? 'Could not delete report.';
    }
    finally {
        deletingId.value = null;
    }
}
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
        { label: 'Reports' },
    ]),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'Reports' },
    ]),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap items-center justify-between gap-4" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
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
const __VLS_5 = Button || Button;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    ...{ 'onClick': {} },
    type: "button",
}));
const __VLS_7 = __VLS_6({
    ...{ 'onClick': {} },
    type: "button",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_10;
const __VLS_11 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.modalOpen = true;
            // @ts-ignore
            [modalOpen,];
        } });
const { default: __VLS_12 } = __VLS_8.slots;
// @ts-ignore
[];
var __VLS_8;
var __VLS_9;
if (__VLS_ctx.msg) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-4 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.msg);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-6 space-y-6" },
});
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
const __VLS_13 = ReportViewer;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    report: (__VLS_ctx.report),
    loading: (__VLS_ctx.loading),
}));
const __VLS_15 = __VLS_14({
    report: (__VLS_ctx.report),
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const __VLS_18 = Card || Card;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    padding: "p-4",
}));
const __VLS_20 = __VLS_19({
    padding: "p-4",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
const { default: __VLS_23 } = __VLS_21.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "text-lg font-semibold text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-1 text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
if (__VLS_ctx.loadingExports) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-4 space-y-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
    for (const [i] of __VLS_vFor((3))) {
        const __VLS_24 = Skeleton;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
            key: (i),
            variant: "line",
        }));
        const __VLS_26 = __VLS_25({
            key: (i),
            variant: "line",
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        // @ts-ignore
        [msg, msg, report, loading, loadingExports,];
    }
}
else if (!__VLS_ctx.savedReports.length) {
    const __VLS_29 = EmptyState;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        ...{ class: "mt-4" },
        title: "No saved reports yet",
        description: "Generate a report with New report to save a file on the server.",
    }));
    const __VLS_31 = __VLS_30({
        ...{ class: "mt-4" },
        title: "No saved reports yet",
        description: "Generate a report with New report to save a file on the server.",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
}
else {
    const __VLS_34 = Table || Table;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        ...{ class: "mt-4" },
        headers: (['Name', 'Format', 'Size', 'Created', 'Actions']),
    }));
    const __VLS_36 = __VLS_35({
        ...{ class: "mt-4" },
        headers: (['Name', 'Format', 'Size', 'Created', 'Actions']),
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    const { default: __VLS_39 } = __VLS_37.slots;
    for (const [r] of __VLS_vFor((__VLS_ctx.savedReports))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (r.id),
            ...{ class: "hover:bg-surface-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 font-medium text-foreground" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (r.display_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 uppercase" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        (r.format);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (__VLS_ctx.formatBytes(r.size_bytes));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        (__VLS_ctx.formatDateShort(r.created_at));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
            ...{ class: "px-4 py-3 text-right" },
        });
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-wrap items-center justify-end gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_40 = Button || Button;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
            ...{ 'onClick': {} },
            type: "button",
            variant: "secondary",
        }));
        const __VLS_42 = __VLS_41({
            ...{ 'onClick': {} },
            type: "button",
            variant: "secondary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        let __VLS_45;
        const __VLS_46 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loadingExports))
                        return;
                    if (!!(!__VLS_ctx.savedReports.length))
                        return;
                    __VLS_ctx.downloadSaved(r);
                    // @ts-ignore
                    [savedReports, savedReports, formatBytes, formatDateShort, downloadSaved,];
                } });
        const { default: __VLS_47 } = __VLS_43.slots;
        // @ts-ignore
        [];
        var __VLS_43;
        var __VLS_44;
        const __VLS_48 = Button || Button;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            ...{ 'onClick': {} },
            type: "button",
            variant: "ghost-danger",
            loading: (__VLS_ctx.deletingId === r.id),
            disabled: (__VLS_ctx.deletingId !== null && __VLS_ctx.deletingId !== r.id),
        }));
        const __VLS_50 = __VLS_49({
            ...{ 'onClick': {} },
            type: "button",
            variant: "ghost-danger",
            loading: (__VLS_ctx.deletingId === r.id),
            disabled: (__VLS_ctx.deletingId !== null && __VLS_ctx.deletingId !== r.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        let __VLS_53;
        const __VLS_54 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loadingExports))
                        return;
                    if (!!(!__VLS_ctx.savedReports.length))
                        return;
                    __VLS_ctx.deleteSaved(r);
                    // @ts-ignore
                    [deletingId, deletingId, deletingId, deleteSaved,];
                } });
        const { default: __VLS_55 } = __VLS_51.slots;
        // @ts-ignore
        [];
        var __VLS_51;
        var __VLS_52;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_37;
}
// @ts-ignore
[];
var __VLS_21;
const __VLS_56 = Modal || Modal;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
    modelValue: (__VLS_ctx.modalOpen),
    title: "New report",
    wide: true,
}));
const __VLS_58 = __VLS_57({
    modelValue: (__VLS_ctx.modalOpen),
    title: "New report",
    wide: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const { default: __VLS_61 } = __VLS_59.slots;
const __VLS_62 = ReportSettings;
// @ts-ignore
const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
    ...{ 'onGenerate': {} },
    generating: (__VLS_ctx.generating),
}));
const __VLS_64 = __VLS_63({
    ...{ 'onGenerate': {} },
    generating: (__VLS_ctx.generating),
}, ...__VLS_functionalComponentArgsRest(__VLS_63));
let __VLS_67;
const __VLS_68 = ({ generate: {} },
    { onGenerate: (__VLS_ctx.onCreateReport) });
var __VLS_65;
var __VLS_66;
// @ts-ignore
[modalOpen, generating, onCreateReport,];
var __VLS_59;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
