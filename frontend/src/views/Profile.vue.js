/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ComputerDesktopIcon, MoonIcon, SunIcon, } from '@heroicons/vue/24/outline';
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import Breadcrumb from '../components/ui/UiBreadcrumb.vue';
import Button from '../components/ui/UiButton.vue';
import Card from '../components/ui/UiCard.vue';
import Input from '../components/ui/UiInput.vue';
import { useAuthStore } from '../stores/auth.store';
import { useUiStore } from '../stores/ui.store';
const auth = useAuthStore();
const ui = useUiStore();
const themeOptions = [
    { mode: 'light', label: 'Light', icon: SunIcon },
    { mode: 'dark', label: 'Dark', icon: MoonIcon },
    { mode: 'system', label: 'System', icon: ComputerDesktopIcon },
];
const lastName = ref('');
const firstName = ref('');
const patronymic = ref('');
const department = ref('');
const jobTitle = ref('');
const phone = ref('');
const email = ref('');
const saving = ref(false);
const profileFeedback = ref(null);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const savingPassword = ref(false);
const passwordFeedback = ref(null);
function fillFromUser() {
    const u = auth.user;
    if (!u)
        return;
    lastName.value = u.last_name ?? '';
    firstName.value = u.first_name ?? '';
    patronymic.value = u.patronymic ?? '';
    department.value = u.department ?? '';
    jobTitle.value = u.job_title ?? '';
    phone.value = u.phone ?? '';
    email.value = u.email ?? '';
}
onMounted(async () => {
    try {
        await auth.fetchMe();
    }
    catch {
        /* keep cached user */
    }
    fillFromUser();
});
async function save() {
    saving.value = true;
    profileFeedback.value = null;
    try {
        await auth.updateProfile({
            email: email.value,
            last_name: lastName.value,
            first_name: firstName.value,
            patronymic: patronymic.value,
            department: department.value,
            job_title: jobTitle.value,
            phone: phone.value,
        });
        profileFeedback.value = {
            text: 'Данные сохранены.',
            kind: 'success',
        };
    }
    catch {
        profileFeedback.value = {
            text: 'Не удалось сохранить (возможно, email уже занят).',
            kind: 'error',
        };
    }
    finally {
        saving.value = false;
    }
}
async function savePassword() {
    passwordFeedback.value = null;
    if (newPassword.value !== confirmPassword.value) {
        passwordFeedback.value = {
            text: 'Новый пароль и подтверждение не совпадают.',
            kind: 'error',
        };
        return;
    }
    if (newPassword.value.length < 8) {
        passwordFeedback.value = {
            text: 'Новый пароль — не менее 8 символов.',
            kind: 'error',
        };
        return;
    }
    savingPassword.value = true;
    try {
        await auth.changePassword(currentPassword.value, newPassword.value);
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
        passwordFeedback.value = {
            text: 'Пароль изменён.',
            kind: 'success',
        };
    }
    catch (e) {
        if (axios.isAxiosError(e)) {
            const err = e.response?.data?.error;
            if (e.response?.status === 401) {
                passwordFeedback.value = {
                    text: 'Неверный текущий пароль.',
                    kind: 'error',
                };
            }
            else if (err) {
                passwordFeedback.value = { text: err, kind: 'error' };
            }
            else {
                passwordFeedback.value = {
                    text: 'Не удалось сменить пароль.',
                    kind: 'error',
                };
            }
        }
        else {
            passwordFeedback.value = {
                text: 'Не удалось сменить пароль.',
                kind: 'error',
            };
        }
    }
    finally {
        savingPassword.value = false;
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
        { label: 'Profile' },
    ]),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'Profile' },
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
if (__VLS_ctx.auth.user?.role === 'admin' || __VLS_ctx.auth.user?.role === 'staff') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "mt-3 text-sm" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    let __VLS_5;
    /** @ts-ignore @type {typeof __VLS_components.RouterLink | typeof __VLS_components.RouterLink} */
    RouterLink;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        to: "/admin/users",
        ...{ class: "font-medium text-primary underline underline-offset-2 hover:no-underline" },
    }));
    const __VLS_7 = __VLS_6({
        to: "/admin/users",
        ...{ class: "font-medium text-primary underline underline-offset-2 hover:no-underline" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['underline']} */ ;
    /** @type {__VLS_StyleScopedClasses['underline-offset-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:no-underline']} */ ;
    const { default: __VLS_10 } = __VLS_8.slots;
    // @ts-ignore
    [auth, auth,];
    var __VLS_8;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mt-6 grid gap-6 lg:grid-cols-2 lg:items-start" },
});
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:items-start']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex min-w-0 flex-col gap-6" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
const __VLS_11 = Card || Card;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
    ...{ class: "min-w-0" },
    title: "Персональные данные",
}));
const __VLS_13 = __VLS_12({
    ...{ class: "min-w-0" },
    title: "Персональные данные",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
const { default: __VLS_16 } = __VLS_14.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.save) },
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 sm:grid-cols-2" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
const __VLS_17 = Input;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
    id: "pf-last-name",
    modelValue: (__VLS_ctx.lastName),
    label: "Фамилия",
    autocomplete: "family-name",
}));
const __VLS_19 = __VLS_18({
    id: "pf-last-name",
    modelValue: (__VLS_ctx.lastName),
    label: "Фамилия",
    autocomplete: "family-name",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
const __VLS_22 = Input;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
    id: "pf-first-name",
    modelValue: (__VLS_ctx.firstName),
    label: "Имя",
    autocomplete: "given-name",
}));
const __VLS_24 = __VLS_23({
    id: "pf-first-name",
    modelValue: (__VLS_ctx.firstName),
    label: "Имя",
    autocomplete: "given-name",
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
const __VLS_27 = Input;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
    id: "pf-patronymic",
    modelValue: (__VLS_ctx.patronymic),
    label: "Отчество",
    autocomplete: "additional-name",
}));
const __VLS_29 = __VLS_28({
    id: "pf-patronymic",
    modelValue: (__VLS_ctx.patronymic),
    label: "Отчество",
    autocomplete: "additional-name",
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
const __VLS_32 = Input;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    id: "pf-department",
    modelValue: (__VLS_ctx.department),
    label: "Название подразделения",
    autocomplete: "organization",
}));
const __VLS_34 = __VLS_33({
    id: "pf-department",
    modelValue: (__VLS_ctx.department),
    label: "Название подразделения",
    autocomplete: "organization",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_37 = Input;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
    id: "pf-job",
    modelValue: (__VLS_ctx.jobTitle),
    label: "Должность",
    autocomplete: "organization-title",
}));
const __VLS_39 = __VLS_38({
    id: "pf-job",
    modelValue: (__VLS_ctx.jobTitle),
    label: "Должность",
    autocomplete: "organization-title",
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "grid gap-4 sm:grid-cols-2" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
const __VLS_42 = Input;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
    id: "pf-phone",
    modelValue: (__VLS_ctx.phone),
    label: "Телефон",
    type: "tel",
    autocomplete: "tel",
}));
const __VLS_44 = __VLS_43({
    id: "pf-phone",
    modelValue: (__VLS_ctx.phone),
    label: "Телефон",
    type: "tel",
    autocomplete: "tel",
}, ...__VLS_functionalComponentArgsRest(__VLS_43));
const __VLS_47 = Input;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
    id: "pf-email",
    modelValue: (__VLS_ctx.email),
    label: "Email",
    type: "email",
    required: true,
    autocomplete: "email",
}));
const __VLS_49 = __VLS_48({
    id: "pf-email",
    modelValue: (__VLS_ctx.email),
    label: "Email",
    type: "email",
    required: true,
    autocomplete: "email",
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
if (__VLS_ctx.profileFeedback) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm" },
        ...{ class: (__VLS_ctx.profileFeedback.kind === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive') },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (__VLS_ctx.profileFeedback.text);
}
const __VLS_52 = Button || Button;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
    type: "submit",
    disabled: (__VLS_ctx.saving),
}));
const __VLS_54 = __VLS_53({
    type: "submit",
    disabled: (__VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const { default: __VLS_57 } = __VLS_55.slots;
(__VLS_ctx.saving ? 'Сохранение…' : 'Сохранить');
// @ts-ignore
[save, lastName, firstName, patronymic, department, jobTitle, phone, email, profileFeedback, profileFeedback, profileFeedback, saving, saving,];
var __VLS_55;
// @ts-ignore
[];
var __VLS_14;
const __VLS_58 = Card || Card;
// @ts-ignore
const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
    ...{ class: "min-w-0" },
    title: "Appearance",
}));
const __VLS_60 = __VLS_59({
    ...{ class: "min-w-0" },
    title: "Appearance",
}, ...__VLS_functionalComponentArgsRest(__VLS_59));
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
const { default: __VLS_63 } = __VLS_61.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "mb-3 text-sm text-muted" },
});
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-wrap gap-2" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
for (const [opt] of __VLS_vFor((__VLS_ctx.themeOptions))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.ui.setTheme(opt.mode);
                // @ts-ignore
                [themeOptions, ui,];
            } },
        key: (opt.mode),
        type: "button",
        ...{ class: "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors" },
        ...{ class: (__VLS_ctx.ui.theme === opt.mode
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface-muted/50 text-muted hover:bg-surface-muted hover:text-foreground') },
        'aria-pressed': (__VLS_ctx.ui.theme === opt.mode),
    });
    /** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['border']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
    const __VLS_64 = (opt.icon);
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
        ...{ class: "h-5 w-5 shrink-0" },
        'aria-hidden': "true",
    }));
    const __VLS_66 = __VLS_65({
        ...{ class: "h-5 w-5 shrink-0" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['w-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
    (opt.label);
    // @ts-ignore
    [ui, ui,];
}
// @ts-ignore
[];
var __VLS_61;
const __VLS_69 = Card || Card;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
    ...{ class: "min-w-0" },
    title: "Смена пароля",
}));
const __VLS_71 = __VLS_70({
    ...{ class: "min-w-0" },
    title: "Смена пароля",
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
const { default: __VLS_74 } = __VLS_72.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.savePassword) },
    ...{ class: "space-y-4" },
});
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
const __VLS_75 = Input;
// @ts-ignore
const __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
    id: "pf-cur-pw",
    modelValue: (__VLS_ctx.currentPassword),
    label: "Текущий пароль",
    type: "password",
    autocomplete: "current-password",
}));
const __VLS_77 = __VLS_76({
    id: "pf-cur-pw",
    modelValue: (__VLS_ctx.currentPassword),
    label: "Текущий пароль",
    type: "password",
    autocomplete: "current-password",
}, ...__VLS_functionalComponentArgsRest(__VLS_76));
const __VLS_80 = Input;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
    id: "pf-new-pw",
    modelValue: (__VLS_ctx.newPassword),
    label: "Новый пароль",
    type: "password",
    autocomplete: "new-password",
}));
const __VLS_82 = __VLS_81({
    id: "pf-new-pw",
    modelValue: (__VLS_ctx.newPassword),
    label: "Новый пароль",
    type: "password",
    autocomplete: "new-password",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
const __VLS_85 = Input;
// @ts-ignore
const __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
    id: "pf-confirm-pw",
    modelValue: (__VLS_ctx.confirmPassword),
    label: "Подтверждение нового пароля",
    type: "password",
    autocomplete: "new-password",
}));
const __VLS_87 = __VLS_86({
    id: "pf-confirm-pw",
    modelValue: (__VLS_ctx.confirmPassword),
    label: "Подтверждение нового пароля",
    type: "password",
    autocomplete: "new-password",
}, ...__VLS_functionalComponentArgsRest(__VLS_86));
if (__VLS_ctx.passwordFeedback) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "text-sm" },
        ...{ class: (__VLS_ctx.passwordFeedback.kind === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive') },
    });
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    (__VLS_ctx.passwordFeedback.text);
}
const __VLS_90 = Button || Button;
// @ts-ignore
const __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
    type: "submit",
    disabled: (__VLS_ctx.savingPassword),
}));
const __VLS_92 = __VLS_91({
    type: "submit",
    disabled: (__VLS_ctx.savingPassword),
}, ...__VLS_functionalComponentArgsRest(__VLS_91));
const { default: __VLS_95 } = __VLS_93.slots;
(__VLS_ctx.savingPassword ? 'Сохранение…' : 'Сменить пароль');
// @ts-ignore
[savePassword, currentPassword, newPassword, confirmPassword, passwordFeedback, passwordFeedback, passwordFeedback, savingPassword, savingPassword,];
var __VLS_93;
// @ts-ignore
[];
var __VLS_72;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
