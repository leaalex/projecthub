/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref } from 'vue';
import UiAvatar from '../components/ui/UiAvatar.vue';
import UiBadge from '../components/ui/UiBadge.vue';
import UiBreadcrumb from '../components/ui/UiBreadcrumb.vue';
import UiButton from '../components/ui/UiButton.vue';
import UiCard from '../components/ui/UiCard.vue';
import UiCheckboxRow from '../components/ui/UiCheckboxRow.vue';
import UiEmptyState from '../components/ui/UiEmptyState.vue';
import UiFilterChip from '../components/ui/UiFilterChip.vue';
import UiFormSection from '../components/ui/UiFormSection.vue';
import UiInput from '../components/ui/UiInput.vue';
import UiMenuButton from '../components/ui/UiMenuButton.vue';
import UiModal from '../components/ui/UiModal.vue';
import UiScrollPanel from '../components/ui/UiScrollPanel.vue';
import UiSegmentedControl from '../components/ui/UiSegmentedControl.vue';
import UiSelect from '../components/ui/UiSelect.vue';
import UiSkeleton from '../components/ui/UiSkeleton.vue';
import UiTextAction from '../components/ui/UiTextAction.vue';
import UiTable from '../components/ui/UiTable.vue';
import { useConfirm } from '../composables/useConfirm';
import { useToast } from '../composables/useToast';
const { confirm } = useConfirm();
const toast = useToast();
const demoInput = ref('Sample value');
const demoErrorInput = ref('');
const demoDisabled = ref('Read-only value');
const demoDate = ref('');
const demoCheckboxIds = ref([1, 2]);
const demoFilterChips = ref(['todo', 'done']);
const demoSelectPlain = ref('mocha');
const demoSelectDisabledOpt = ref('a');
const demoSelectSm = ref('latte');
const demoSelectEmpty = ref('');
const demoSelectFilterable = ref('');
const demoSelectMulti = ref(['latte']);
const demoSelectFilterableMulti = ref(['ams', 'vie']);
const demoMenuValue = ref('latte');
const demoMenuActionLog = ref('—');
const menuActionOptions = [
    { value: 'edit', label: 'Edit' },
    { value: 'copy', label: 'Duplicate' },
    { value: 'archive', label: 'Archive' },
    { value: 'del', label: 'Delete', disabled: true },
];
const selectFlavorOptions = [
    { value: 'latte', label: 'Latte' },
    { value: 'mocha', label: 'Mocha' },
    { value: 'tea', label: 'Tea' },
];
const selectWithDisabledOption = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B', disabled: true },
    { value: 'c', label: 'Option C' },
];
/** Long list for filterable demos */
const selectCityOptions = [
    { value: 'ams', label: 'Amsterdam' },
    { value: 'ath', label: 'Athens' },
    { value: 'bcn', label: 'Barcelona' },
    { value: 'ber', label: 'Berlin' },
    { value: 'bru', label: 'Brussels' },
    { value: 'bud', label: 'Budapest' },
    { value: 'cph', label: 'Copenhagen' },
    { value: 'dub', label: 'Dublin' },
    { value: 'edi', label: 'Edinburgh' },
    { value: 'hel', label: 'Helsinki' },
    { value: 'lis', label: 'Lisbon' },
    { value: 'lon', label: 'London' },
    { value: 'mad', label: 'Madrid' },
    { value: 'muc', label: 'Munich' },
    { value: 'osl', label: 'Oslo' },
    { value: 'par', label: 'Paris' },
    { value: 'pra', label: 'Prague' },
    { value: 'rom', label: 'Rome' },
    { value: 'sto', label: 'Stockholm' },
    { value: 'vie', label: 'Vienna' },
    { value: 'war', label: 'Warsaw' },
    { value: 'zag', label: 'Zagreb' },
];
const modalOpen = ref(false);
const buttonLoading = ref(false);
const demoSegment = ref('list');
const demoSegmentThree = ref('b');
const segmentedTwo = [
    { value: 'list', label: 'List' },
    { value: 'board', label: 'Board' },
];
const segmentedThree = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
];
const statuses = ['todo', 'in_progress', 'review', 'done'];
const priorities = ['low', 'medium', 'high', 'critical'];
function flashLoading() {
    buttonLoading.value = true;
    window.setTimeout(() => {
        buttonLoading.value = false;
    }, 1500);
}
async function runConfirmDemo() {
    const ok = await confirm({
        title: 'Confirm dialog',
        message: 'This is a demo of UiConfirmDialog (global).',
        confirmLabel: 'OK',
    });
    toast.info(ok ? 'Confirmed' : 'Cancelled');
}
function onDemoMenuSelect(v) {
    demoMenuActionLog.value = String(v);
    toast.info(`Action: ${v}`);
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
const __VLS_0 = UiBreadcrumb;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'UI kit' },
    ]),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'UI kit' },
    ]),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mb-8" },
});
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-3 max-w-3xl text-xs leading-relaxed text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-relaxed']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-foreground/90" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-8" },
});
/** @type {__VLS_StyleScopedClasses['space-y-8']} */ ;
const __VLS_5 = UiCard || UiCard;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    title: "Buttons",
}));
const __VLS_7 = __VLS_6({
    title: "Buttons",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const { default: __VLS_10 } = __VLS_8.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap items-center gap-3" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
const __VLS_11 = UiButton || UiButton;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
    variant: "primary",
}));
const __VLS_13 = __VLS_12({
    variant: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
const { default: __VLS_16 } = __VLS_14.slots;
var __VLS_14;
const __VLS_17 = UiButton || UiButton;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
    variant: "secondary",
}));
const __VLS_19 = __VLS_18({
    variant: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
const { default: __VLS_22 } = __VLS_20.slots;
var __VLS_20;
const __VLS_23 = UiButton || UiButton;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
    variant: "ghost",
}));
const __VLS_25 = __VLS_24({
    variant: "ghost",
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
const { default: __VLS_28 } = __VLS_26.slots;
var __VLS_26;
const __VLS_29 = UiButton || UiButton;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
    variant: "danger",
}));
const __VLS_31 = __VLS_30({
    variant: "danger",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
const { default: __VLS_34 } = __VLS_32.slots;
var __VLS_32;
const __VLS_35 = UiButton || UiButton;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
    variant: "ghost-danger",
}));
const __VLS_37 = __VLS_36({
    variant: "ghost-danger",
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
const { default: __VLS_40 } = __VLS_38.slots;
var __VLS_38;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-4 flex flex-wrap items-center gap-3" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
const __VLS_41 = UiButton || UiButton;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
    loading: (true),
}));
const __VLS_43 = __VLS_42({
    loading: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
const { default: __VLS_46 } = __VLS_44.slots;
var __VLS_44;
const __VLS_47 = UiButton || UiButton;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
    disabled: true,
}));
const __VLS_49 = __VLS_48({
    disabled: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
const { default: __VLS_52 } = __VLS_50.slots;
var __VLS_50;
const __VLS_53 = UiButton || UiButton;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.buttonLoading),
}));
const __VLS_55 = __VLS_54({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.buttonLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
let __VLS_58;
const __VLS_59 = ({ click: {} },
    { onClick: (__VLS_ctx.flashLoading) });
const { default: __VLS_60 } = __VLS_56.slots;
// @ts-ignore
[buttonLoading, flashLoading,];
var __VLS_56;
var __VLS_57;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-4 max-w-xs" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
const __VLS_61 = UiButton || UiButton;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
    block: true,
    variant: "secondary",
}));
const __VLS_63 = __VLS_62({
    block: true,
    variant: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
const { default: __VLS_66 } = __VLS_64.slots;
// @ts-ignore
[];
var __VLS_64;
// @ts-ignore
[];
var __VLS_8;
const __VLS_67 = UiCard || UiCard;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
    title: "Segmented control (UiSegmentedControl)",
}));
const __VLS_69 = __VLS_68({
    title: "Segmented control (UiSegmentedControl)",
}, ...__VLS_functionalComponentArgsRest(__VLS_68));
const { default: __VLS_72 } = __VLS_70.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-4 text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-col gap-6" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-2 text-xs font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
const __VLS_73 = UiSegmentedControl;
// @ts-ignore
const __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
    modelValue: (__VLS_ctx.demoSegment),
    'aria-label': "Demo two options",
    options: (__VLS_ctx.segmentedTwo),
}));
const __VLS_75 = __VLS_74({
    modelValue: (__VLS_ctx.demoSegment),
    'aria-label': "Demo two options",
    options: (__VLS_ctx.segmentedTwo),
}, ...__VLS_functionalComponentArgsRest(__VLS_74));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-2 text-xs text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.demoSegment);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-2 text-xs font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
const __VLS_78 = UiSegmentedControl;
// @ts-ignore
const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
    modelValue: (__VLS_ctx.demoSegmentThree),
    'aria-label': "Demo three options",
    options: (__VLS_ctx.segmentedThree),
}));
const __VLS_80 = __VLS_79({
    modelValue: (__VLS_ctx.demoSegmentThree),
    'aria-label': "Demo three options",
    options: (__VLS_ctx.segmentedThree),
}, ...__VLS_functionalComponentArgsRest(__VLS_79));
// @ts-ignore
[demoSegment, demoSegment, segmentedTwo, demoSegmentThree, segmentedThree,];
var __VLS_70;
const __VLS_83 = UiCard || UiCard;
// @ts-ignore
const __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
    title: "Inputs (UiInput)",
}));
const __VLS_85 = __VLS_84({
    title: "Inputs (UiInput)",
}, ...__VLS_functionalComponentArgsRest(__VLS_84));
const { default: __VLS_88 } = __VLS_86.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid max-w-md gap-4" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
const __VLS_89 = UiInput;
// @ts-ignore
const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
    id: "ui-demo-1",
    modelValue: (__VLS_ctx.demoInput),
    label: "With label",
    placeholder: "Type here…",
}));
const __VLS_91 = __VLS_90({
    id: "ui-demo-1",
    modelValue: (__VLS_ctx.demoInput),
    label: "With label",
    placeholder: "Type here…",
}, ...__VLS_functionalComponentArgsRest(__VLS_90));
const __VLS_94 = UiInput;
// @ts-ignore
const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
    id: "ui-demo-2",
    modelValue: (__VLS_ctx.demoErrorInput),
    label: "With error",
    placeholder: "Required",
    error: "This field cannot be empty",
}));
const __VLS_96 = __VLS_95({
    id: "ui-demo-2",
    modelValue: (__VLS_ctx.demoErrorInput),
    label: "With error",
    placeholder: "Required",
    error: "This field cannot be empty",
}, ...__VLS_functionalComponentArgsRest(__VLS_95));
const __VLS_99 = UiInput;
// @ts-ignore
const __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
    id: "ui-demo-3",
    modelValue: (__VLS_ctx.demoDisabled),
    label: "Disabled",
    disabled: true,
}));
const __VLS_101 = __VLS_100({
    id: "ui-demo-3",
    modelValue: (__VLS_ctx.demoDisabled),
    label: "Disabled",
    disabled: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_100));
const __VLS_104 = UiInput;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
    id: "ui-demo-date",
    modelValue: (__VLS_ctx.demoDate),
    type: "date",
    label: "Date (type=&quot;date&quot;)",
}));
const __VLS_106 = __VLS_105({
    id: "ui-demo-date",
    modelValue: (__VLS_ctx.demoDate),
    type: "date",
    label: "Date (type=&quot;date&quot;)",
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
// @ts-ignore
[demoInput, demoErrorInput, demoDisabled, demoDate,];
var __VLS_86;
const __VLS_109 = UiCard || UiCard;
// @ts-ignore
const __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109({
    title: "Form sections & filters",
}));
const __VLS_111 = __VLS_110({
    title: "Form sections & filters",
}, ...__VLS_functionalComponentArgsRest(__VLS_110));
const { default: __VLS_114 } = __VLS_112.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-4 text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
const __VLS_115 = UiFormSection || UiFormSection;
// @ts-ignore
const __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
    title: "Sample checklist",
}));
const __VLS_117 = __VLS_116({
    title: "Sample checklist",
}, ...__VLS_functionalComponentArgsRest(__VLS_116));
const { default: __VLS_120 } = __VLS_118.slots;
{
    const { actions: __VLS_121 } = __VLS_118.slots;
    const __VLS_122 = UiTextAction || UiTextAction;
    // @ts-ignore
    const __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({
        ...{ 'onClick': {} },
    }));
    const __VLS_124 = __VLS_123({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_123));
    let __VLS_127;
    const __VLS_128 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.demoCheckboxIds =
                    __VLS_ctx.demoCheckboxIds.length < 3 ? [1, 2, 3] : [];
                // @ts-ignore
                [demoCheckboxIds, demoCheckboxIds,];
            } });
    const { default: __VLS_129 } = __VLS_125.slots;
    (__VLS_ctx.demoCheckboxIds.length < 3 ? 'Select all' : 'Clear');
    // @ts-ignore
    [demoCheckboxIds,];
    var __VLS_125;
    var __VLS_126;
    // @ts-ignore
    [];
}
const __VLS_130 = UiScrollPanel || UiScrollPanel;
// @ts-ignore
const __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
    maxHeightClass: "max-h-28",
}));
const __VLS_132 = __VLS_131({
    maxHeightClass: "max-h-28",
}, ...__VLS_functionalComponentArgsRest(__VLS_131));
const { default: __VLS_135 } = __VLS_133.slots;
const __VLS_136 = UiCheckboxRow || UiCheckboxRow;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({
    modelValue: (__VLS_ctx.demoCheckboxIds),
    value: (1),
}));
const __VLS_138 = __VLS_137({
    modelValue: (__VLS_ctx.demoCheckboxIds),
    value: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
const { default: __VLS_141 } = __VLS_139.slots;
// @ts-ignore
[demoCheckboxIds,];
var __VLS_139;
const __VLS_142 = UiCheckboxRow || UiCheckboxRow;
// @ts-ignore
const __VLS_143 = __VLS_asFunctionalComponent1(__VLS_142, new __VLS_142({
    modelValue: (__VLS_ctx.demoCheckboxIds),
    value: (2),
}));
const __VLS_144 = __VLS_143({
    modelValue: (__VLS_ctx.demoCheckboxIds),
    value: (2),
}, ...__VLS_functionalComponentArgsRest(__VLS_143));
const { default: __VLS_147 } = __VLS_145.slots;
// @ts-ignore
[demoCheckboxIds,];
var __VLS_145;
const __VLS_148 = UiCheckboxRow || UiCheckboxRow;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent1(__VLS_148, new __VLS_148({
    modelValue: (__VLS_ctx.demoCheckboxIds),
    value: (3),
}));
const __VLS_150 = __VLS_149({
    modelValue: (__VLS_ctx.demoCheckboxIds),
    value: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
const { default: __VLS_153 } = __VLS_151.slots;
// @ts-ignore
[demoCheckboxIds,];
var __VLS_151;
// @ts-ignore
[];
var __VLS_133;
// @ts-ignore
[];
var __VLS_118;
const __VLS_154 = UiFormSection || UiFormSection;
// @ts-ignore
const __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154({
    title: "Filter chips",
    ...{ class: "mt-6" },
}));
const __VLS_156 = __VLS_155({
    title: "Filter chips",
    ...{ class: "mt-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_155));
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
const { default: __VLS_159 } = __VLS_157.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_160 = UiFilterChip || UiFilterChip;
// @ts-ignore
const __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({
    modelValue: (__VLS_ctx.demoFilterChips),
    value: "todo",
}));
const __VLS_162 = __VLS_161({
    modelValue: (__VLS_ctx.demoFilterChips),
    value: "todo",
}, ...__VLS_functionalComponentArgsRest(__VLS_161));
const { default: __VLS_165 } = __VLS_163.slots;
// @ts-ignore
[demoFilterChips,];
var __VLS_163;
const __VLS_166 = UiFilterChip || UiFilterChip;
// @ts-ignore
const __VLS_167 = __VLS_asFunctionalComponent1(__VLS_166, new __VLS_166({
    modelValue: (__VLS_ctx.demoFilterChips),
    value: "in_progress",
}));
const __VLS_168 = __VLS_167({
    modelValue: (__VLS_ctx.demoFilterChips),
    value: "in_progress",
}, ...__VLS_functionalComponentArgsRest(__VLS_167));
const { default: __VLS_171 } = __VLS_169.slots;
// @ts-ignore
[demoFilterChips,];
var __VLS_169;
const __VLS_172 = UiFilterChip || UiFilterChip;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent1(__VLS_172, new __VLS_172({
    modelValue: (__VLS_ctx.demoFilterChips),
    value: "done",
}));
const __VLS_174 = __VLS_173({
    modelValue: (__VLS_ctx.demoFilterChips),
    value: "done",
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
const { default: __VLS_177 } = __VLS_175.slots;
// @ts-ignore
[demoFilterChips,];
var __VLS_175;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-2 text-xs text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.demoFilterChips.join(', ') || '—');
// @ts-ignore
[demoFilterChips,];
var __VLS_157;
// @ts-ignore
[];
var __VLS_112;
const __VLS_178 = UiCard || UiCard;
// @ts-ignore
const __VLS_179 = __VLS_asFunctionalComponent1(__VLS_178, new __VLS_178({
    title: "Select (UiSelect)",
}));
const __VLS_180 = __VLS_179({
    title: "Select (UiSelect)",
}, ...__VLS_functionalComponentArgsRest(__VLS_179));
const { default: __VLS_183 } = __VLS_181.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid max-w-md gap-6" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
const __VLS_184 = UiSelect;
// @ts-ignore
const __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184({
    id: "ui-sel-1",
    modelValue: (__VLS_ctx.demoSelectPlain),
    label: "Basic",
    placeholder: "Choose a drink…",
    options: (__VLS_ctx.selectFlavorOptions),
}));
const __VLS_186 = __VLS_185({
    id: "ui-sel-1",
    modelValue: (__VLS_ctx.demoSelectPlain),
    label: "Basic",
    placeholder: "Choose a drink…",
    options: (__VLS_ctx.selectFlavorOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_185));
const __VLS_189 = UiSelect;
// @ts-ignore
const __VLS_190 = __VLS_asFunctionalComponent1(__VLS_189, new __VLS_189({
    id: "ui-sel-2",
    modelValue: (__VLS_ctx.demoSelectDisabledOpt),
    label: "With disabled option",
    options: (__VLS_ctx.selectWithDisabledOption),
}));
const __VLS_191 = __VLS_190({
    id: "ui-sel-2",
    modelValue: (__VLS_ctx.demoSelectDisabledOpt),
    label: "With disabled option",
    options: (__VLS_ctx.selectWithDisabledOption),
}, ...__VLS_functionalComponentArgsRest(__VLS_190));
const __VLS_194 = UiSelect;
// @ts-ignore
const __VLS_195 = __VLS_asFunctionalComponent1(__VLS_194, new __VLS_194({
    id: "ui-sel-3",
    modelValue: (__VLS_ctx.demoSelectSm),
    label: "Same compact height as other controls",
    options: (__VLS_ctx.selectFlavorOptions),
}));
const __VLS_196 = __VLS_195({
    id: "ui-sel-3",
    modelValue: (__VLS_ctx.demoSelectSm),
    label: "Same compact height as other controls",
    options: (__VLS_ctx.selectFlavorOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_195));
const __VLS_199 = UiSelect;
// @ts-ignore
const __VLS_200 = __VLS_asFunctionalComponent1(__VLS_199, new __VLS_199({
    id: "ui-sel-4",
    modelValue: (__VLS_ctx.demoSelectEmpty),
    label: "Error state",
    placeholder: "Required",
    error: "Pick a value",
    options: (__VLS_ctx.selectFlavorOptions),
}));
const __VLS_201 = __VLS_200({
    id: "ui-sel-4",
    modelValue: (__VLS_ctx.demoSelectEmpty),
    label: "Error state",
    placeholder: "Required",
    error: "Pick a value",
    options: (__VLS_ctx.selectFlavorOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_200));
const __VLS_204 = UiSelect;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({
    id: "ui-sel-5",
    modelValue: (__VLS_ctx.demoSelectFilterable),
    label: "Filterable (search)",
    placeholder: "Pick a city…",
    filterable: true,
    options: (__VLS_ctx.selectCityOptions),
}));
const __VLS_206 = __VLS_205({
    id: "ui-sel-5",
    modelValue: (__VLS_ctx.demoSelectFilterable),
    label: "Filterable (search)",
    placeholder: "Pick a city…",
    filterable: true,
    options: (__VLS_ctx.selectCityOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-2" },
});
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
const __VLS_209 = UiSelect;
// @ts-ignore
const __VLS_210 = __VLS_asFunctionalComponent1(__VLS_209, new __VLS_209({
    id: "ui-sel-6",
    modelValue: (__VLS_ctx.demoSelectMulti),
    label: "Multiple",
    placeholder: "Pick drinks…",
    multiple: true,
    options: (__VLS_ctx.selectFlavorOptions),
}));
const __VLS_211 = __VLS_210({
    id: "ui-sel-6",
    modelValue: (__VLS_ctx.demoSelectMulti),
    label: "Multiple",
    placeholder: "Pick drinks…",
    multiple: true,
    options: (__VLS_ctx.selectFlavorOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_210));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-muted" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.demoSelectMulti.join(', ') || '—');
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-y-2" },
});
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
const __VLS_214 = UiSelect;
// @ts-ignore
const __VLS_215 = __VLS_asFunctionalComponent1(__VLS_214, new __VLS_214({
    id: "ui-sel-7",
    modelValue: (__VLS_ctx.demoSelectFilterableMulti),
    label: "Filterable + multiple",
    placeholder: "Pick cities…",
    filterable: true,
    multiple: true,
    options: (__VLS_ctx.selectCityOptions),
}));
const __VLS_216 = __VLS_215({
    id: "ui-sel-7",
    modelValue: (__VLS_ctx.demoSelectFilterableMulti),
    label: "Filterable + multiple",
    placeholder: "Pick cities…",
    filterable: true,
    multiple: true,
    options: (__VLS_ctx.selectCityOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_215));
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-xs text-muted" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.demoSelectFilterableMulti.join(', ') || '—');
// @ts-ignore
[demoSelectPlain, selectFlavorOptions, selectFlavorOptions, selectFlavorOptions, selectFlavorOptions, demoSelectDisabledOpt, selectWithDisabledOption, demoSelectSm, demoSelectEmpty, demoSelectFilterable, selectCityOptions, selectCityOptions, demoSelectMulti, demoSelectMulti, demoSelectFilterableMulti, demoSelectFilterableMulti,];
var __VLS_181;
const __VLS_219 = UiCard || UiCard;
// @ts-ignore
const __VLS_220 = __VLS_asFunctionalComponent1(__VLS_219, new __VLS_219({
    title: "Menu button (UiMenuButton)",
}));
const __VLS_221 = __VLS_220({
    title: "Menu button (UiMenuButton)",
}, ...__VLS_functionalComponentArgsRest(__VLS_220));
const { default: __VLS_224 } = __VLS_222.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-4 text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-col flex-wrap gap-6 sm:flex-row sm:items-center" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center gap-3" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-xs font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
const __VLS_225 = UiMenuButton;
// @ts-ignore
const __VLS_226 = __VLS_asFunctionalComponent1(__VLS_225, new __VLS_225({
    modelValue: (__VLS_ctx.demoMenuValue),
    ariaLabel: "Choose drink",
    title: "Choose drink",
    options: (__VLS_ctx.selectFlavorOptions),
}));
const __VLS_227 = __VLS_226({
    modelValue: (__VLS_ctx.demoMenuValue),
    ariaLabel: "Choose drink",
    title: "Choose drink",
    options: (__VLS_ctx.selectFlavorOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_226));
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-xs text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.demoMenuValue);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex items-center gap-3" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "text-xs font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
const __VLS_230 = UiMenuButton;
// @ts-ignore
const __VLS_231 = __VLS_asFunctionalComponent1(__VLS_230, new __VLS_230({
    ...{ 'onSelect': {} },
    ariaLabel: "Row actions",
    title: "Row actions",
    options: (__VLS_ctx.menuActionOptions),
    placement: "bottom-start",
}));
const __VLS_232 = __VLS_231({
    ...{ 'onSelect': {} },
    ariaLabel: "Row actions",
    title: "Row actions",
    options: (__VLS_ctx.menuActionOptions),
    placement: "bottom-start",
}, ...__VLS_functionalComponentArgsRest(__VLS_231));
let __VLS_235;
const __VLS_236 = ({ select: {} },
    { onSelect: (__VLS_ctx.onDemoMenuSelect) });
var __VLS_233;
var __VLS_234;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-xs text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
(__VLS_ctx.demoMenuActionLog);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "max-w-xs flex-1" },
});
/** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "mb-1 block text-xs font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
const __VLS_237 = UiMenuButton;
// @ts-ignore
const __VLS_238 = __VLS_asFunctionalComponent1(__VLS_237, new __VLS_237({
    modelValue: (__VLS_ctx.demoMenuValue),
    variant: "field",
    ariaLabel: "Choose drink",
    placeholder: "Pick a drink",
    options: (__VLS_ctx.selectFlavorOptions),
}));
const __VLS_239 = __VLS_238({
    modelValue: (__VLS_ctx.demoMenuValue),
    variant: "field",
    ariaLabel: "Choose drink",
    placeholder: "Pick a drink",
    options: (__VLS_ctx.selectFlavorOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_238));
// @ts-ignore
[selectFlavorOptions, selectFlavorOptions, demoMenuValue, demoMenuValue, demoMenuValue, menuActionOptions, onDemoMenuSelect, demoMenuActionLog,];
var __VLS_222;
const __VLS_242 = UiCard || UiCard;
// @ts-ignore
const __VLS_243 = __VLS_asFunctionalComponent1(__VLS_242, new __VLS_242({
    title: "Badges & avatars",
}));
const __VLS_244 = __VLS_243({
    title: "Badges & avatars",
}, ...__VLS_functionalComponentArgsRest(__VLS_243));
const { default: __VLS_247 } = __VLS_245.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-3 text-sm font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
for (const [s] of __VLS_vFor((__VLS_ctx.statuses))) {
    const __VLS_248 = UiBadge;
    // @ts-ignore
    const __VLS_249 = __VLS_asFunctionalComponent1(__VLS_248, new __VLS_248({
        key: (s),
        kind: "status",
        value: (s),
    }));
    const __VLS_250 = __VLS_249({
        key: (s),
        kind: "status",
        value: (s),
    }, ...__VLS_functionalComponentArgsRest(__VLS_249));
    // @ts-ignore
    [statuses,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-3 mt-6 text-sm font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
for (const [p] of __VLS_vFor((__VLS_ctx.priorities))) {
    const __VLS_253 = UiBadge;
    // @ts-ignore
    const __VLS_254 = __VLS_asFunctionalComponent1(__VLS_253, new __VLS_253({
        key: (p),
        kind: "priority",
        value: (p),
    }));
    const __VLS_255 = __VLS_254({
        key: (p),
        kind: "priority",
        value: (p),
    }, ...__VLS_functionalComponentArgsRest(__VLS_254));
    // @ts-ignore
    [priorities,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-3 mt-6 text-sm font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-3 text-xs text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap items-center gap-4" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
const __VLS_258 = UiAvatar;
// @ts-ignore
const __VLS_259 = __VLS_asFunctionalComponent1(__VLS_258, new __VLS_258({
    name: "Alex Doe",
    email: "alex@example.com",
}));
const __VLS_260 = __VLS_259({
    name: "Alex Doe",
    email: "alex@example.com",
}, ...__VLS_functionalComponentArgsRest(__VLS_259));
const __VLS_263 = UiAvatar;
// @ts-ignore
const __VLS_264 = __VLS_asFunctionalComponent1(__VLS_263, new __VLS_263({
    name: "Jamie Smith",
    email: "jamie@example.com",
}));
const __VLS_265 = __VLS_264({
    name: "Jamie Smith",
    email: "jamie@example.com",
}, ...__VLS_functionalComponentArgsRest(__VLS_264));
const __VLS_268 = UiAvatar;
// @ts-ignore
const __VLS_269 = __VLS_asFunctionalComponent1(__VLS_268, new __VLS_268({
    email: "only@email.com",
}));
const __VLS_270 = __VLS_269({
    email: "only@email.com",
}, ...__VLS_functionalComponentArgsRest(__VLS_269));
// @ts-ignore
[];
var __VLS_245;
const __VLS_273 = UiCard || UiCard;
// @ts-ignore
const __VLS_274 = __VLS_asFunctionalComponent1(__VLS_273, new __VLS_273({
    title: "Cards & table",
}));
const __VLS_275 = __VLS_274({
    title: "Cards & table",
}, ...__VLS_functionalComponentArgsRest(__VLS_274));
const { default: __VLS_278 } = __VLS_276.slots;
const __VLS_279 = UiCard || UiCard;
// @ts-ignore
const __VLS_280 = __VLS_asFunctionalComponent1(__VLS_279, new __VLS_279({
    ...{ class: "mb-6 border-dashed bg-surface-muted/30 p-4 shadow-none" },
}));
const __VLS_281 = __VLS_280({
    ...{ class: "mb-6 border-dashed bg-surface-muted/30 p-4 shadow-none" },
}, ...__VLS_functionalComponentArgsRest(__VLS_280));
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-muted/30']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-none']} */ ;
const { default: __VLS_284 } = __VLS_282.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
// @ts-ignore
[];
var __VLS_282;
const __VLS_285 = UiTable || UiTable;
// @ts-ignore
const __VLS_286 = __VLS_asFunctionalComponent1(__VLS_285, new __VLS_285({
    headers: (['Name', 'Role', 'Status']),
}));
const __VLS_287 = __VLS_286({
    headers: (['Name', 'Role', 'Status']),
}, ...__VLS_functionalComponentArgsRest(__VLS_286));
const { default: __VLS_290 } = __VLS_288.slots;
for (const [row] of __VLS_vFor((3))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
        key: (row),
        ...{ class: "text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    (row);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "px-4 py-3 text-muted" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
        ...{ class: "px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_288;
// @ts-ignore
[];
var __VLS_276;
const __VLS_291 = UiCard || UiCard;
// @ts-ignore
const __VLS_292 = __VLS_asFunctionalComponent1(__VLS_291, new __VLS_291({
    title: "Breadcrumb (sample)",
}));
const __VLS_293 = __VLS_292({
    title: "Breadcrumb (sample)",
}, ...__VLS_functionalComponentArgsRest(__VLS_292));
const { default: __VLS_296 } = __VLS_294.slots;
const __VLS_297 = UiBreadcrumb;
// @ts-ignore
const __VLS_298 = __VLS_asFunctionalComponent1(__VLS_297, new __VLS_297({
    items: ([
        { label: 'Projects', to: '/projects' },
        { label: 'Alpha', to: '/projects/1' },
        { label: 'Settings' },
    ]),
}));
const __VLS_299 = __VLS_298({
    items: ([
        { label: 'Projects', to: '/projects' },
        { label: 'Alpha', to: '/projects/1' },
        { label: 'Settings' },
    ]),
}, ...__VLS_functionalComponentArgsRest(__VLS_298));
// @ts-ignore
[];
var __VLS_294;
const __VLS_302 = UiCard || UiCard;
// @ts-ignore
const __VLS_303 = __VLS_asFunctionalComponent1(__VLS_302, new __VLS_302({
    title: "Empty state & skeletons",
}));
const __VLS_304 = __VLS_303({
    title: "Empty state & skeletons",
}, ...__VLS_functionalComponentArgsRest(__VLS_303));
const { default: __VLS_307 } = __VLS_305.slots;
const __VLS_308 = UiEmptyState || UiEmptyState;
// @ts-ignore
const __VLS_309 = __VLS_asFunctionalComponent1(__VLS_308, new __VLS_308({
    ...{ class: "mb-8" },
    title: "Nothing here",
    description: "UiEmptyState for lists with no data.",
}));
const __VLS_310 = __VLS_309({
    ...{ class: "mb-8" },
    title: "Nothing here",
    description: "UiEmptyState for lists with no data.",
}, ...__VLS_functionalComponentArgsRest(__VLS_309));
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
const { default: __VLS_313 } = __VLS_311.slots;
const __VLS_314 = UiButton || UiButton;
// @ts-ignore
const __VLS_315 = __VLS_asFunctionalComponent1(__VLS_314, new __VLS_314({
    variant: "secondary",
}));
const __VLS_316 = __VLS_315({
    variant: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_315));
const { default: __VLS_319 } = __VLS_317.slots;
// @ts-ignore
[];
var __VLS_317;
// @ts-ignore
[];
var __VLS_311;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-6 sm:grid-cols-3" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-2 text-xs font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
const __VLS_320 = UiSkeleton;
// @ts-ignore
const __VLS_321 = __VLS_asFunctionalComponent1(__VLS_320, new __VLS_320({
    variant: "line",
    lines: (3),
}));
const __VLS_322 = __VLS_321({
    variant: "line",
    lines: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_321));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-2 text-xs font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
const __VLS_325 = UiSkeleton;
// @ts-ignore
const __VLS_326 = __VLS_asFunctionalComponent1(__VLS_325, new __VLS_325({
    variant: "card",
}));
const __VLS_327 = __VLS_326({
    variant: "card",
}, ...__VLS_functionalComponentArgsRest(__VLS_326));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-2 text-xs font-medium text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
const __VLS_330 = UiSkeleton;
// @ts-ignore
const __VLS_331 = __VLS_asFunctionalComponent1(__VLS_330, new __VLS_330({
    variant: "avatar",
}));
const __VLS_332 = __VLS_331({
    variant: "avatar",
}, ...__VLS_functionalComponentArgsRest(__VLS_331));
// @ts-ignore
[];
var __VLS_305;
const __VLS_335 = UiCard || UiCard;
// @ts-ignore
const __VLS_336 = __VLS_asFunctionalComponent1(__VLS_335, new __VLS_335({
    title: "Modal & global overlays",
}));
const __VLS_337 = __VLS_336({
    title: "Modal & global overlays",
}, ...__VLS_functionalComponentArgsRest(__VLS_336));
const { default: __VLS_340 } = __VLS_338.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap gap-3" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
const __VLS_341 = UiButton || UiButton;
// @ts-ignore
const __VLS_342 = __VLS_asFunctionalComponent1(__VLS_341, new __VLS_341({
    ...{ 'onClick': {} },
}));
const __VLS_343 = __VLS_342({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_342));
let __VLS_346;
const __VLS_347 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.modalOpen = true;
            // @ts-ignore
            [modalOpen,];
        } });
const { default: __VLS_348 } = __VLS_344.slots;
// @ts-ignore
[];
var __VLS_344;
var __VLS_345;
const __VLS_349 = UiButton || UiButton;
// @ts-ignore
const __VLS_350 = __VLS_asFunctionalComponent1(__VLS_349, new __VLS_349({
    ...{ 'onClick': {} },
    variant: "secondary",
}));
const __VLS_351 = __VLS_350({
    ...{ 'onClick': {} },
    variant: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_350));
let __VLS_354;
const __VLS_355 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.toast.success('Saved successfully');
            // @ts-ignore
            [toast,];
        } });
const { default: __VLS_356 } = __VLS_352.slots;
// @ts-ignore
[];
var __VLS_352;
var __VLS_353;
const __VLS_357 = UiButton || UiButton;
// @ts-ignore
const __VLS_358 = __VLS_asFunctionalComponent1(__VLS_357, new __VLS_357({
    ...{ 'onClick': {} },
    variant: "secondary",
}));
const __VLS_359 = __VLS_358({
    ...{ 'onClick': {} },
    variant: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_358));
let __VLS_362;
const __VLS_363 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.toast.error('Something went wrong');
            // @ts-ignore
            [toast,];
        } });
const { default: __VLS_364 } = __VLS_360.slots;
// @ts-ignore
[];
var __VLS_360;
var __VLS_361;
const __VLS_365 = UiButton || UiButton;
// @ts-ignore
const __VLS_366 = __VLS_asFunctionalComponent1(__VLS_365, new __VLS_365({
    ...{ 'onClick': {} },
    variant: "secondary",
}));
const __VLS_367 = __VLS_366({
    ...{ 'onClick': {} },
    variant: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_366));
let __VLS_370;
const __VLS_371 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.toast.info('FYI: demo info toast');
            // @ts-ignore
            [toast,];
        } });
const { default: __VLS_372 } = __VLS_368.slots;
// @ts-ignore
[];
var __VLS_368;
var __VLS_369;
const __VLS_373 = UiButton || UiButton;
// @ts-ignore
const __VLS_374 = __VLS_asFunctionalComponent1(__VLS_373, new __VLS_373({
    ...{ 'onClick': {} },
    variant: "ghost",
}));
const __VLS_375 = __VLS_374({
    ...{ 'onClick': {} },
    variant: "ghost",
}, ...__VLS_functionalComponentArgsRest(__VLS_374));
let __VLS_378;
const __VLS_379 = ({ click: {} },
    { onClick: (__VLS_ctx.runConfirmDemo) });
const { default: __VLS_380 } = __VLS_376.slots;
// @ts-ignore
[runConfirmDemo,];
var __VLS_376;
var __VLS_377;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mt-4 text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({
    ...{ class: "rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({
    ...{ class: "rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({
    ...{ class: "rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({
    ...{ class: "rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-mono text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
// @ts-ignore
[];
var __VLS_338;
const __VLS_381 = UiModal || UiModal;
// @ts-ignore
const __VLS_382 = __VLS_asFunctionalComponent1(__VLS_381, new __VLS_381({
    modelValue: (__VLS_ctx.modalOpen),
    title: "Demo modal",
}));
const __VLS_383 = __VLS_382({
    modelValue: (__VLS_ctx.modalOpen),
    title: "Demo modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_382));
const { default: __VLS_386 } = __VLS_384.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "text-sm text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)({
    ...{ class: "text-foreground" },
});
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-4 flex justify-end gap-2" },
});
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
const __VLS_387 = UiButton || UiButton;
// @ts-ignore
const __VLS_388 = __VLS_asFunctionalComponent1(__VLS_387, new __VLS_387({
    ...{ 'onClick': {} },
    variant: "ghost",
}));
const __VLS_389 = __VLS_388({
    ...{ 'onClick': {} },
    variant: "ghost",
}, ...__VLS_functionalComponentArgsRest(__VLS_388));
let __VLS_392;
const __VLS_393 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.modalOpen = false;
            // @ts-ignore
            [modalOpen, modalOpen,];
        } });
const { default: __VLS_394 } = __VLS_390.slots;
// @ts-ignore
[];
var __VLS_390;
var __VLS_391;
// @ts-ignore
[];
var __VLS_384;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
