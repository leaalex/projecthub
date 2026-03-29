/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/20/solid';
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch, } from 'vue';
const DROPDOWN_Z = 70;
const MAX_PANEL_PX = 240;
const GAP_PX = 4;
const props = withDefaults(defineProps(), {
    placeholder: 'Select…',
    block: true,
    teleport: true,
    filterable: false,
    multiple: false,
});
const emit = defineEmits();
const uid = useId();
const baseId = computed(() => props.id ?? `ui-select-${uid}`);
const open = ref(false);
const rootRef = ref(null);
const buttonRef = ref(null);
const panelRef = ref(null);
const optionsListRef = ref(null);
const searchInputRef = ref(null);
const searchQuery = ref('');
const activeIndex = ref(0);
const floatingStyle = ref({});
function updateFloatingPosition() {
    const el = buttonRef.value;
    if (!el)
        return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - GAP_PX - 8;
    const maxH = Math.min(MAX_PANEL_PX, Math.max(96, spaceBelow));
    floatingStyle.value = {
        position: 'fixed',
        top: `${r.bottom + GAP_PX}px`,
        left: `${r.left}px`,
        width: `${r.width}px`,
        minWidth: `${r.width}px`,
        maxHeight: `${maxH}px`,
        zIndex: String(DROPDOWN_Z),
    };
}
function onScrollOrResize() {
    if (open.value && props.teleport)
        updateFloatingPosition();
}
const filteredOptions = computed(() => {
    const q = props.filterable ? searchQuery.value.trim().toLowerCase() : '';
    return props.options
        .map((opt, sourceIndex) => ({ opt, sourceIndex }))
        .filter(({ opt }) => {
        if (!q)
            return true;
        return opt.label.toLowerCase().includes(q);
    });
});
const enabledFilteredIndices = computed(() => filteredOptions.value
    .map((row, fi) => (row.opt.disabled ? -1 : fi))
    .filter((fi) => fi >= 0));
const selectedOption = computed(() => {
    if (props.multiple)
        return undefined;
    const mv = props.modelValue;
    if (Array.isArray(mv))
        return undefined;
    return props.options.find((o) => valuesEqual(o.value, mv));
});
const selectedValues = computed(() => {
    if (!props.multiple)
        return [];
    const mv = props.modelValue;
    return Array.isArray(mv) ? [...mv] : [];
});
/** Multiple mode: human-readable list of selected option labels (comma-separated). */
const multipleSelectedLabels = computed(() => {
    if (!props.multiple)
        return '';
    const sel = selectedValues.value;
    if (sel.length === 0)
        return '';
    return sel
        .map((v) => props.options.find((o) => valuesEqual(o.value, v))?.label ?? String(v))
        .join(', ');
});
const displayTitle = computed(() => {
    if (!props.multiple)
        return undefined;
    const text = multipleSelectedLabels.value;
    return text || undefined;
});
/** Единая компактная сетка (см. style.css --ui-control-h) */
const triggerClass = 'h-8 min-h-8 px-3 text-xs leading-normal';
const optionRowClass = 'min-h-8 px-3 py-1.5 text-xs leading-normal';
const searchFieldClass = 'h-8 min-h-8 px-3 text-xs leading-normal';
const chevronIconClass = 'h-3.5 w-3.5 shrink-0';
const displayLabel = computed(() => {
    if (props.multiple) {
        const text = multipleSelectedLabels.value;
        if (!text)
            return props.placeholder ?? '';
        return text;
    }
    const s = selectedOption.value;
    if (s)
        return s.label;
    if (props.placeholder)
        return props.placeholder;
    return '';
});
const showPlaceholderStyle = computed(() => {
    if (props.multiple) {
        return selectedValues.value.length === 0 && props.placeholder !== undefined;
    }
    return !selectedOption.value && props.placeholder !== undefined;
});
const activeDescendantId = computed(() => {
    if (!open.value)
        return undefined;
    const row = filteredOptions.value[activeIndex.value];
    if (!row)
        return undefined;
    return `${baseId.value}-opt-${row.sourceIndex}`;
});
function valuesEqual(a, b) {
    return a === b;
}
function isSelectedValue(v) {
    if (props.multiple) {
        return selectedValues.value.some((x) => valuesEqual(x, v));
    }
    const mv = props.modelValue;
    if (Array.isArray(mv))
        return false;
    return valuesEqual(mv, v);
}
function toggleValue(v) {
    const cur = selectedValues.value;
    const i = cur.findIndex((x) => valuesEqual(x, v));
    const next = [...cur];
    if (i >= 0)
        next.splice(i, 1);
    else
        next.push(v);
    emit('update:modelValue', next);
}
function selectFilteredIndex(fi) {
    const row = filteredOptions.value[fi];
    if (!row || row.opt.disabled)
        return;
    if (props.multiple) {
        toggleValue(row.opt.value);
        return;
    }
    emit('update:modelValue', row.opt.value);
    open.value = false;
    nextTick(() => buttonRef.value?.focus());
}
function moveActive(delta) {
    const enabled = enabledFilteredIndices.value;
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
    if (props.disabled)
        return;
    open.value = !open.value;
}
function syncActiveToSelection() {
    if (!props.multiple) {
        const mv = props.modelValue;
        if (Array.isArray(mv)) {
            activeIndex.value = enabledFilteredIndices.value[0] ?? 0;
            return;
        }
        const fi = filteredOptions.value.findIndex((row) => valuesEqual(row.opt.value, mv));
        const row = fi >= 0 ? filteredOptions.value[fi] : undefined;
        if (row && !row.opt.disabled) {
            activeIndex.value = fi;
            return;
        }
    }
    activeIndex.value = enabledFilteredIndices.value[0] ?? 0;
}
watch(open, (v) => {
    if (!v) {
        searchQuery.value = '';
        return;
    }
    syncActiveToSelection();
    nextTick(() => {
        if (props.teleport)
            updateFloatingPosition();
        if (props.filterable) {
            searchInputRef.value?.focus();
        }
        else {
            scrollActiveIntoView();
        }
    });
});
watch(() => [props.modelValue, props.multiple], () => {
    if (!open.value)
        syncActiveToSelection();
});
watch(() => [searchQuery.value, props.filterable, open.value], () => {
    if (!open.value || !props.filterable)
        return;
    syncActiveToSelection();
    scrollActiveIntoView();
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
function focusOptionsList() {
    optionsListRef.value?.focus();
}
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
            selectFilteredIndex(activeIndex.value);
        }
        else {
            open.value = true;
        }
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open.value) {
            open.value = true;
            return;
        }
        if (props.filterable) {
            searchInputRef.value?.focus();
            return;
        }
        moveActive(1);
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open.value) {
            open.value = true;
            return;
        }
        moveActive(-1);
    }
}
function onSearchKeydown(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        open.value = false;
        buttonRef.value?.focus();
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusOptionsList();
        const first = enabledFilteredIndices.value[0];
        if (first !== undefined) {
            activeIndex.value = first;
            scrollActiveIntoView();
        }
        return;
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
        selectFilteredIndex(activeIndex.value);
        if (!props.multiple) {
            return;
        }
    }
    if (e.key === 'Home') {
        e.preventDefault();
        const first = enabledFilteredIndices.value[0];
        if (first !== undefined)
            activeIndex.value = first;
    }
    if (e.key === 'End') {
        e.preventDefault();
        const en = enabledFilteredIndices.value;
        const last = en[en.length - 1];
        if (last !== undefined)
            activeIndex.value = last;
    }
}
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
    placeholder: 'Select…',
    block: true,
    teleport: true,
    filterable: false,
    multiple: false,
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
    ...{ class: "relative" },
    ...{ class: (__VLS_ctx.block ? 'w-full' : 'inline-block min-w-[8rem]') },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
if (__VLS_ctx.label) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        for: (__VLS_ctx.baseId),
        ...{ class: "mb-1 block text-xs font-medium text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['block']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.label);
}
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
    disabled: (__VLS_ctx.disabled),
    title: (__VLS_ctx.displayTitle),
    ...{ class: ([
            'flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
            __VLS_ctx.triggerClass,
            __VLS_ctx.showPlaceholderStyle ? 'text-muted' : 'text-foreground',
        ]) },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:pointer-events-none']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "min-w-0 flex-1 truncate" },
});
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
(__VLS_ctx.displayLabel);
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.ChevronDownIcon} */
ChevronDownIcon;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "shrink-0 text-muted transition-transform duration-200" },
    ...{ class: ([__VLS_ctx.chevronIconClass, __VLS_ctx.open && 'rotate-180']) },
    'aria-hidden': "true",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "shrink-0 text-muted transition-transform duration-200" },
    ...{ class: ([__VLS_ctx.chevronIconClass, __VLS_ctx.open && 'rotate-180']) },
    'aria-hidden': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
let __VLS_5;
/** @ts-ignore @type {typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    to: "body",
    disabled: (!__VLS_ctx.teleport),
}));
const __VLS_7 = __VLS_6({
    to: "body",
    disabled: (!__VLS_ctx.teleport),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const { default: __VLS_10 } = __VLS_8.slots;
let __VLS_11;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
    enterActiveClass: "transition duration-100 ease-out",
    enterFromClass: "opacity-0",
    enterToClass: "opacity-100",
    leaveActiveClass: "transition duration-75 ease-in",
    leaveFromClass: "opacity-100",
    leaveToClass: "opacity-0",
}));
const __VLS_13 = __VLS_12({
    enterActiveClass: "transition duration-100 ease-out",
    enterFromClass: "opacity-0",
    enterToClass: "opacity-100",
    leaveActiveClass: "transition duration-75 ease-in",
    leaveFromClass: "opacity-100",
    leaveToClass: "opacity-0",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
const { default: __VLS_16 } = __VLS_14.slots;
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ref: "panelRef",
        ...{ class: ([
                'flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-lg ring-1 ring-black/5 dark:ring-white/10',
                __VLS_ctx.teleport
                    ? 'fixed'
                    : 'absolute left-0 right-0 z-50 mt-1 min-w-full max-h-60',
            ]) },
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
    if (__VLS_ctx.filterable) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ onKeydown: (__VLS_ctx.onSearchKeydown) },
            ...{ onKeydown: () => { } },
            ref: "searchInputRef",
            type: "search",
            autocomplete: "off",
            'aria-label': "Filter options",
            ...{ class: ([
                    'w-full shrink-0 border-b border-border bg-surface text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    __VLS_ctx.searchFieldClass,
                ]) },
            placeholder: "Search…",
        });
        (__VLS_ctx.searchQuery);
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
        /** @type {__VLS_StyleScopedClasses['placeholder:text-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-inset']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onKeydown: (__VLS_ctx.onListKeydown) },
        id: (`${__VLS_ctx.baseId}-listbox`),
        ref: "optionsListRef",
        role: "listbox",
        tabindex: "-1",
        'aria-multiselectable': (__VLS_ctx.multiple ? true : undefined),
        ...{ class: "min-h-0 flex-1 overflow-auto py-1" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
    for (const [row, fi] of __VLS_vFor((__VLS_ctx.filteredOptions))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.open))
                        return;
                    __VLS_ctx.selectFilteredIndex(fi);
                    // @ts-ignore
                    [block, label, label, baseId, baseId, baseId, baseId, toggle, onButtonKeydown, open, open, open, open, activeDescendantId, disabled, displayTitle, triggerClass, showPlaceholderStyle, displayLabel, chevronIconClass, teleport, teleport, teleport, floatingStyle, filterable, onSearchKeydown, searchFieldClass, searchQuery, onListKeydown, multiple, filteredOptions, selectFilteredIndex,];
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
        if (__VLS_ctx.multiple) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "flex h-4 w-4 shrink-0 items-center justify-center" },
                'aria-hidden': "true",
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            if (__VLS_ctx.isSelectedValue(row.opt.value)) {
                let __VLS_17;
                /** @ts-ignore @type {typeof __VLS_components.CheckIcon} */
                CheckIcon;
                // @ts-ignore
                const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
                    ...{ class: "h-3.5 w-3.5 text-primary" },
                }));
                const __VLS_19 = __VLS_18({
                    ...{ class: "h-3.5 w-3.5 text-primary" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_18));
                /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "min-w-0 flex-1" },
        });
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        (row.opt.label);
        // @ts-ignore
        [baseId, multiple, isSelectedValue, isSelectedValue, optionClasses,];
    }
    if (__VLS_ctx.filteredOptions.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "px-3 py-2 text-sm text-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    }
}
// @ts-ignore
[filteredOptions,];
var __VLS_14;
// @ts-ignore
[];
var __VLS_8;
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-1 text-sm text-destructive" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
    (__VLS_ctx.error);
}
// @ts-ignore
[error, error,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
