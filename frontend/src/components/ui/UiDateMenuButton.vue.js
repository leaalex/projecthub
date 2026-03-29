/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { CalendarDaysIcon, XMarkIcon, } from '@heroicons/vue/24/outline';
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch, } from 'vue';
const DROPDOWN_Z = 70;
const GAP_PX = 4;
const PANEL_MIN_W = 220;
const props = withDefaults(defineProps(), {
    disabled: false,
    placement: 'bottom-end',
    teleport: true,
});
const emit = defineEmits();
const uid = useId();
const baseId = computed(() => `ui-date-menu-${uid}`);
const inputId = computed(() => `${baseId.value}-date`);
const open = ref(false);
const rootRef = ref(null);
const buttonRef = ref(null);
const panelRef = ref(null);
const dateInputRef = ref(null);
const floatingStyle = ref({});
const localValue = ref('');
const tooltipTitle = computed(() => {
    if (props.title)
        return props.title;
    const v = props.modelValue.trim();
    if (!v)
        return 'Due date';
    return `Due date: ${v.slice(0, 10)}`;
});
const displayDate = computed(() => props.modelValue.trim().slice(0, 10));
function updateFloatingPosition() {
    const el = buttonRef.value;
    if (!el)
        return;
    const r = el.getBoundingClientRect();
    const panelW = Math.max(PANEL_MIN_W, r.width);
    let left = props.placement === 'bottom-end' ? r.right - panelW : r.left;
    const margin = 8;
    left = Math.min(left, window.innerWidth - panelW - margin);
    left = Math.max(margin, left);
    floatingStyle.value = {
        position: 'fixed',
        top: `${r.bottom + GAP_PX}px`,
        left: `${left}px`,
        width: `${panelW}px`,
        minWidth: `${panelW}px`,
        zIndex: String(DROPDOWN_Z),
    };
}
function onScrollOrResize() {
    if (open.value && props.teleport)
        updateFloatingPosition();
}
function syncToParent() {
    emit('update:modelValue', localValue.value.trim());
}
function closeFocusTrigger() {
    open.value = false;
    nextTick(() => buttonRef.value?.focus());
}
function onDocPointerDown(e) {
    if (!open.value)
        return;
    const t = e.target;
    if (rootRef.value?.contains(t))
        return;
    if (panelRef.value?.contains(t))
        return;
    syncToParent();
    closeFocusTrigger();
}
function toggle() {
    if (props.disabled)
        return;
    if (open.value) {
        syncToParent();
        closeFocusTrigger();
    }
    else {
        localValue.value = props.modelValue.trim();
        open.value = true;
        nextTick(() => {
            updateFloatingPosition();
            dateInputRef.value?.focus();
        });
    }
}
function clearDue() {
    localValue.value = '';
    emit('update:modelValue', '');
    closeFocusTrigger();
}
function clearFromChip() {
    localValue.value = '';
    emit('update:modelValue', '');
    if (open.value)
        closeFocusTrigger();
}
function onPanelKeydown(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        syncToParent();
        closeFocusTrigger();
        emit('escape');
    }
}
function onButtonKeydown(e) {
    if (props.disabled)
        return;
    if (e.key === 'Escape') {
        e.preventDefault();
        if (open.value) {
            syncToParent();
            closeFocusTrigger();
        }
        emit('escape');
    }
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
    }
}
watch(() => props.modelValue, (v) => {
    if (!open.value)
        localValue.value = (v ?? '').trim();
});
onMounted(() => {
    document.addEventListener('pointerdown', onDocPointerDown, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
});
onUnmounted(() => {
    document.removeEventListener('pointerdown', onDocPointerDown, true);
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
});
const __VLS_defaults = {
    disabled: false,
    placement: 'bottom-end',
    teleport: true,
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
    ...{ class: "relative inline-flex max-w-full min-w-0 items-center gap-1.5" },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggle) },
    ...{ onKeydown: (__VLS_ctx.onButtonKeydown) },
    id: (__VLS_ctx.baseId),
    ref: "buttonRef",
    type: "button",
    'aria-expanded': (__VLS_ctx.open),
    'aria-haspopup': "dialog",
    'aria-controls': (__VLS_ctx.open ? `${__VLS_ctx.baseId}-panel` : undefined),
    'aria-label': (__VLS_ctx.ariaLabel),
    disabled: (__VLS_ctx.disabled),
    title: (__VLS_ctx.tooltipTitle),
    ...{ class: "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" },
});
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
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
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.CalendarDaysIcon} */
CalendarDaysIcon;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "h-5 w-5" },
    'aria-hidden': "true",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
if (__VLS_ctx.displayDate) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "min-w-0 max-w-[9rem] shrink truncate text-xs text-foreground" },
        title: (__VLS_ctx.displayDate),
    });
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-w-[9rem]']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink']} */ ;
    /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    (__VLS_ctx.displayDate);
}
if (__VLS_ctx.displayDate) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearFromChip) },
        type: "button",
        ...{ class: "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" },
        'aria-label': "Clear due date",
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
    let __VLS_5;
    /** @ts-ignore @type {typeof __VLS_components.XMarkIcon} */
    XMarkIcon;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        ...{ class: "h-3.5 w-3.5" },
        'aria-hidden': "true",
    }));
    const __VLS_7 = __VLS_6({
        ...{ class: "h-3.5 w-3.5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
}
let __VLS_10;
/** @ts-ignore @type {typeof __VLS_components.Teleport | typeof __VLS_components.Teleport} */
Teleport;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    to: "body",
    disabled: (!__VLS_ctx.teleport),
}));
const __VLS_12 = __VLS_11({
    to: "body",
    disabled: (!__VLS_ctx.teleport),
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
const { default: __VLS_15 } = __VLS_13.slots;
let __VLS_16;
/** @ts-ignore @type {typeof __VLS_components.Transition | typeof __VLS_components.Transition} */
Transition;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    enterActiveClass: "transition duration-100 ease-out",
    enterFromClass: "opacity-0",
    enterToClass: "opacity-100",
    leaveActiveClass: "transition duration-75 ease-in",
    leaveFromClass: "opacity-100",
    leaveToClass: "opacity-0",
}));
const __VLS_18 = __VLS_17({
    enterActiveClass: "transition duration-100 ease-out",
    enterFromClass: "opacity-0",
    enterToClass: "opacity-100",
    leaveActiveClass: "transition duration-75 ease-in",
    leaveFromClass: "opacity-100",
    leaveToClass: "opacity-0",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const { default: __VLS_21 } = __VLS_19.slots;
if (__VLS_ctx.open) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onKeydown: (__VLS_ctx.onPanelKeydown) },
        id: (`${__VLS_ctx.baseId}-panel`),
        ref: "panelRef",
        role: "dialog",
        'aria-label': "Due date",
        ...{ class: "fixed rounded-md border border-border bg-surface p-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10" },
        ...{ style: (__VLS_ctx.floatingStyle) },
    });
    /** @type {__VLS_StyleScopedClasses['fixed']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['ring-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['ring-black/5']} */ ;
    /** @type {__VLS_StyleScopedClasses['dark:ring-white/10']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "sr-only" },
        for: (__VLS_ctx.inputId),
    });
    /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.syncToParent) },
        id: (__VLS_ctx.inputId),
        ref: "dateInputRef",
        type: "date",
        ...{ class: "w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" },
    });
    (__VLS_ctx.localValue);
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-border']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:outline-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['focus-visible:ring-ring']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.clearDue) },
        type: "button",
        ...{ class: "mt-2 w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-surface-muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
}
// @ts-ignore
[toggle, onButtonKeydown, baseId, baseId, baseId, open, open, open, ariaLabel, disabled, disabled, tooltipTitle, displayDate, displayDate, displayDate, displayDate, clearFromChip, teleport, onPanelKeydown, floatingStyle, inputId, inputId, syncToParent, localValue, clearDue,];
var __VLS_19;
// @ts-ignore
[];
var __VLS_13;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
