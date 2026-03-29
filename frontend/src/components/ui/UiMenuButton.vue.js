/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ChevronDownIcon } from '@heroicons/vue/20/solid';
import { EllipsisVerticalIcon, XMarkIcon, } from '@heroicons/vue/24/outline';
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch, } from 'vue';
const DROPDOWN_Z = 70;
const MAX_PANEL_PX = 240;
const GAP_PX = 4;
const props = withDefaults(defineProps(), {
    variant: 'icon',
    modelValue: undefined,
    placeholder: 'Select…',
    placement: 'bottom-end',
    teleport: true,
    minPanelWidth: 160,
    summary: '',
    showClear: false,
    clearAriaLabel: 'Clear',
});
const emit = defineEmits();
const uid = useId();
const baseId = computed(() => `ui-menu-btn-${uid}`);
const open = ref(false);
const rootRef = ref(null);
const buttonRef = ref(null);
const panelRef = ref(null);
const optionsListRef = ref(null);
const activeIndex = ref(0);
const floatingStyle = ref({});
const rows = computed(() => props.options.map((opt, sourceIndex) => ({ opt, sourceIndex })));
const summaryText = computed(() => props.summary.trim());
const fieldTriggerText = computed(() => {
    if (props.variant !== 'field')
        return '';
    const mv = props.modelValue;
    if (mv === undefined || mv === null || mv === '') {
        return props.placeholder;
    }
    const row = props.options.find((o) => o.value === mv);
    if (row)
        return row.label;
    return props.placeholder;
});
const enabledIndices = computed(() => rows.value
    .map((row, fi) => (row.opt.disabled ? -1 : fi))
    .filter((fi) => fi >= 0));
const effectivePlacement = computed(() => {
    if (props.variant === 'field')
        return 'bottom-start';
    return props.placement;
});
function updateFloatingPosition() {
    const el = buttonRef.value;
    if (!el)
        return;
    const r = el.getBoundingClientRect();
    const panelW = Math.max(props.minPanelWidth, r.width);
    const spaceBelow = window.innerHeight - r.bottom - GAP_PX - 8;
    const maxH = Math.min(MAX_PANEL_PX, Math.max(96, spaceBelow));
    let left;
    if (effectivePlacement.value === 'bottom-end') {
        left = r.right - panelW;
    }
    else {
        left = r.left;
    }
    const margin = 8;
    left = Math.min(left, window.innerWidth - panelW - margin);
    left = Math.max(margin, left);
    floatingStyle.value = {
        position: 'fixed',
        top: `${r.bottom + GAP_PX}px`,
        left: `${left}px`,
        width: `${panelW}px`,
        minWidth: `${panelW}px`,
        maxHeight: `${maxH}px`,
        zIndex: String(DROPDOWN_Z),
    };
}
function onScrollOrResize() {
    if (open.value && props.teleport)
        updateFloatingPosition();
}
function valuesEqual(a, b) {
    return a === b;
}
function isSelectedValue(v) {
    const mv = props.modelValue;
    if (mv === undefined || mv === null)
        return false;
    return valuesEqual(mv, v);
}
const activeDescendantId = computed(() => {
    if (!open.value)
        return undefined;
    const row = rows.value[activeIndex.value];
    if (!row)
        return undefined;
    return `${baseId.value}-opt-${row.sourceIndex}`;
});
function syncActiveToSelection() {
    const mv = props.modelValue;
    if (mv !== undefined && mv !== null) {
        const fi = rows.value.findIndex((row) => valuesEqual(row.opt.value, mv));
        const row = fi >= 0 ? rows.value[fi] : undefined;
        if (row && !row.opt.disabled) {
            activeIndex.value = fi;
            return;
        }
    }
    activeIndex.value = enabledIndices.value[0] ?? 0;
}
function selectIndex(fi) {
    const row = rows.value[fi];
    if (!row || row.opt.disabled)
        return;
    emit('select', row.opt.value);
    emit('update:modelValue', row.opt.value);
    open.value = false;
    nextTick(() => buttonRef.value?.focus());
}
function moveActive(delta) {
    const enabled = enabledIndices.value;
    if (!enabled.length)
        return;
    let idx = enabled.indexOf(activeIndex.value);
    if (idx < 0)
        idx = 0;
    idx = (idx + delta + enabled.length) % enabled.length;
    activeIndex.value = enabled[idx];
    scrollActiveIntoView();
}
function scrollActiveIntoView() {
    nextTick(() => {
        const list = optionsListRef.value;
        if (!list)
            return;
        const el = list.querySelector(`[data-fi="${activeIndex.value}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    });
}
function onDocPointerDown(e) {
    if (!open.value)
        return;
    const t = e.target;
    if (rootRef.value?.contains(t))
        return;
    if (panelRef.value?.contains(t))
        return;
    open.value = false;
}
function toggle() {
    if (props.disabled || !props.options.length)
        return;
    open.value = !open.value;
}
watch(open, (v) => {
    if (!v)
        return;
    syncActiveToSelection();
    nextTick(() => {
        if (props.teleport)
            updateFloatingPosition();
        scrollActiveIntoView();
    });
});
watch(() => props.modelValue, () => {
    if (!open.value)
        syncActiveToSelection();
});
onMounted(() => {
    document.addEventListener('pointerdown', onDocPointerDown, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    syncActiveToSelection();
});
onUnmounted(() => {
    document.removeEventListener('pointerdown', onDocPointerDown, true);
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
});
function onButtonKeydown(e) {
    if (props.disabled)
        return;
    if (e.key === 'Escape') {
        if (open.value) {
            e.preventDefault();
            open.value = false;
        }
        else {
            emit('escape');
        }
        return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (open.value) {
            selectIndex(activeIndex.value);
        }
        else {
            toggle();
        }
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open.value) {
            toggle();
            return;
        }
        moveActive(1);
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open.value) {
            toggle();
            return;
        }
        moveActive(-1);
    }
}
function onListKeydown(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        open.value = false;
        buttonRef.value?.focus();
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveActive(1);
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveActive(-1);
    }
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectIndex(activeIndex.value);
    }
    if (e.key === 'Home') {
        e.preventDefault();
        const first = enabledIndices.value[0];
        if (first !== undefined)
            activeIndex.value = first;
    }
    if (e.key === 'End') {
        e.preventDefault();
        const en = enabledIndices.value;
        const last = en[en.length - 1];
        if (last !== undefined)
            activeIndex.value = last;
    }
}
const optionRowClass = 'min-h-8 px-3 py-1.5 text-xs leading-normal';
function optionClasses(fi, row) {
    const selected = isSelectedValue(row.opt.value);
    const active = fi === activeIndex.value;
    return [
        'flex w-full cursor-pointer select-none items-center gap-2 text-left text-foreground',
        optionRowClass,
        row.opt.disabled && 'cursor-not-allowed opacity-50',
        !row.opt.disabled && active && 'bg-surface-muted',
        !row.opt.disabled && !active && 'hover:bg-surface-muted/80',
        selected && 'font-medium',
    ];
}
const __VLS_defaults = {
    variant: 'icon',
    modelValue: undefined,
    placeholder: 'Select…',
    placement: 'bottom-end',
    teleport: true,
    minPanelWidth: 160,
    summary: '',
    showClear: false,
    clearAriaLabel: 'Clear',
};
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
    ref: "rootRef",
    ...{ class: (__VLS_ctx.variant === 'field'
            ? 'relative block w-full min-w-0'
            : 'relative inline-flex max-w-full min-w-0 items-center gap-1.5') },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggle) },
    ...{ onKeydown: (__VLS_ctx.onButtonKeydown) },
    id: (__VLS_ctx.baseId),
    ref: "buttonRef",
    type: "button",
    role: "combobox",
    'aria-expanded': (__VLS_ctx.open),
    'aria-haspopup': "listbox",
    'aria-controls': (__VLS_ctx.open ? `${__VLS_ctx.baseId}-listbox` : undefined),
    'aria-activedescendant': (__VLS_ctx.activeDescendantId),
    'aria-label': (__VLS_ctx.ariaLabel),
    disabled: (__VLS_ctx.disabled || !__VLS_ctx.options.length),
    title: (__VLS_ctx.title),
    ...{ class: (__VLS_ctx.variant === 'field'
            ? 'inline-flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 text-left text-xs text-foreground transition-colors hover:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
            : 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50') },
});
if (__VLS_ctx.variant === 'field') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "min-w-0 flex-1 truncate text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.fieldTriggerText);
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.ChevronDownIcon} */
    ChevronDownIcon;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ class: "h-4 w-4 shrink-0 text-muted" },
        'aria-hidden': "true",
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "h-4 w-4 shrink-0 text-muted" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
}
else {
    var __VLS_5 = {};
    let __VLS_7;
    /** @ts-ignore @type {typeof __VLS_components.EllipsisVerticalIcon} */
    EllipsisVerticalIcon;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }));
    const __VLS_9 = __VLS_8({
        ...{ class: "h-5 w-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
}
if (__VLS_ctx.variant === 'icon') {
    if (__VLS_ctx.summaryText) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "min-w-0 max-w-[9rem] shrink truncate text-xs text-foreground" },
            title: (__VLS_ctx.summaryText),
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-[9rem]']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink']} */ ;
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        (__VLS_ctx.summaryText);
    }
    if (__VLS_ctx.showClear) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.variant === 'icon'))
                        return;
                    if (!(__VLS_ctx.showClear))
                        return;
                    __VLS_ctx.emit('clear');
                    // @ts-ignore
                    [variant, variant, variant, variant, toggle, onButtonKeydown, baseId, baseId, open, open, activeDescendantId, ariaLabel, disabled, options, title, fieldTriggerText, summaryText, summaryText, summaryText, showClear, emit,];
                } },
            type: "button",
            ...{ class: "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" },
            'aria-label': (__VLS_ctx.clearAriaLabel),
            disabled: (__VLS_ctx.disabled),
        });
        /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:pointer-events-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        let __VLS_12;
        /** @ts-ignore @type {typeof __VLS_components.XMarkIcon} */
        XMarkIcon;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            ...{ class: "h-3.5 w-3.5" },
            'aria-hidden': "true",
        }));
        const __VLS_14 = __VLS_13({
            ...{ class: "h-3.5 w-3.5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
    }
}
let __VLS_17;
/** @ts-ignore @type {typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
    to: "body",
    disabled: (!__VLS_ctx.teleport),
}));
const __VLS_19 = __VLS_18({
    to: "body",
    disabled: (!__VLS_ctx.teleport),
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
const { default: __VLS_22 } = __VLS_20.slots;
let __VLS_23;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
    enterActiveClass: "transition duration-100 ease-out",
    enterFromClass: "opacity-0",
    enterToClass: "opacity-100",
    leaveActiveClass: "transition duration-75 ease-in",
    leaveFromClass: "opacity-100",
    leaveToClass: "opacity-0",
}));
const __VLS_25 = __VLS_24({
    enterActiveClass: "transition duration-100 ease-out",
    enterFromClass: "opacity-0",
    enterToClass: "opacity-100",
    leaveActiveClass: "transition duration-75 ease-in",
    leaveFromClass: "opacity-100",
    leaveToClass: "opacity-0",
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
const { default: __VLS_28 } = __VLS_26.slots;
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ref: "panelRef",
        ...{ class: "flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-lg ring-1 ring-black/5 dark:ring-white/10" },
        ...{ class: (__VLS_ctx.teleport
                ? 'fixed'
                : 'absolute right-0 top-full z-50 mt-1 min-w-40 max-h-60') },
        ...{ style: (__VLS_ctx.teleport ? __VLS_ctx.floatingStyle : undefined) },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['ring-black/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:ring-white/10']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onKeydown: (__VLS_ctx.onListKeydown) },
        id: (`${__VLS_ctx.baseId}-listbox`),
        ref: "optionsListRef",
        role: "listbox",
        tabindex: "-1",
        ...{ class: "min-h-0 flex-1 overflow-auto py-1" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    for (const [row, fi] of __VLS_vFor((__VLS_ctx.rows))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.open))
                        return;
                    __VLS_ctx.selectIndex(fi);
                    // @ts-ignore
                    [baseId, open, disabled, clearAriaLabel, teleport, teleport, teleport, floatingStyle, onListKeydown, rows, selectIndex,];
                } },
            ...{ onMouseenter: (...[$event]) => {
                    if (!(__VLS_ctx.open))
                        return;
                    !row.opt.disabled && (__VLS_ctx.activeIndex = fi);
                    // @ts-ignore
                    [activeIndex,];
                } },
            id: (`${__VLS_ctx.baseId}-opt-${row.sourceIndex}`),
            key: (`${row.opt.value}-${row.sourceIndex}`),
            type: "button",
            role: "option",
            'data-fi': (fi),
            'aria-selected': (__VLS_ctx.isSelectedValue(row.opt.value)),
            disabled: (row.opt.disabled),
            ...{ class: (__VLS_ctx.optionClasses(fi, row)) },
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "min-w-0 flex-1" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        (row.opt.label);
        // @ts-ignore
        [baseId, isSelectedValue, optionClasses,];
    }
}
// @ts-ignore
[];
var __VLS_26;
// @ts-ignore
[];
var __VLS_20;
// @ts-ignore
var __VLS_6 = __VLS_5;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
const __VLS_export = {};
export default {};
