/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../../private/var/folders/p2/hljwtr5j32x0g71xlqrg8w4c0000gn/T/cursor-sandbox-cache/0445add87fa25f8b7cc62665664d9fee/npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '../components/ui/UiButton.vue';
import Breadcrumb from '../components/ui/UiBreadcrumb.vue';
import EmptyState from '../components/ui/UiEmptyState.vue';
import Skeleton from '../components/ui/UiSkeleton.vue';
import Modal from '../components/ui/UiModal.vue';
import ProjectForm from '../components/projects/ProjectForm.vue';
import ProjectList from '../components/projects/ProjectList.vue';
import { useConfirm } from '../composables/useConfirm';
import { useAuthStore } from '../stores/auth.store';
import { useProjectStore } from '../stores/project.store';
const router = useRouter();
const auth = useAuthStore();
const store = useProjectStore();
const canCreateProjects = computed(() => auth.user?.role !== 'user');
const projectsSubtitle = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'staff'
    ? 'All projects in the workspace'
    : 'Projects you own');
const { confirm } = useConfirm();
const showModal = ref(false);
const name = ref('');
const description = ref('');
const saving = ref(false);
const editModalOpen = ref(false);
const editId = ref(0);
const editName = ref('');
const editDescription = ref('');
const editSaving = ref(false);
onMounted(() => {
    store.fetchList().catch(() => { });
});
async function createProject() {
    saving.value = true;
    try {
        await store.create({
            name: name.value,
            description: description.value,
        });
        showModal.value = false;
        name.value = '';
        description.value = '';
    }
    finally {
        saving.value = false;
    }
}
function openProject(id) {
    router.push(`/projects/${id}`);
}
function openEditProject(id) {
    const p = store.projects.find((x) => x.id === id);
    if (!p)
        return;
    editId.value = id;
    editName.value = p.name;
    editDescription.value = p.description ?? '';
    editModalOpen.value = true;
}
async function saveEditProject() {
    editSaving.value = true;
    try {
        await store.update(editId.value, {
            name: editName.value,
            description: editDescription.value,
        });
        editModalOpen.value = false;
    }
    finally {
        editSaving.value = false;
    }
}
async function removeEditProject() {
    const ok = await confirm({
        title: 'Delete project',
        message: 'Delete this project and its task links?',
        confirmLabel: 'Delete',
        danger: true,
    });
    if (!ok)
        return;
    await store.remove(editId.value);
    editModalOpen.value = false;
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
        { label: 'Projects' },
    ]),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "mb-4" },
    items: ([
        { label: 'Home', to: '/dashboard' },
        { label: 'Projects' },
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
(__VLS_ctx.projectsSubtitle);
if (__VLS_ctx.canCreateProjects) {
    const __VLS_5 = Button || Button;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        ...{ 'onClick': {} },
    }));
    const __VLS_7 = __VLS_6({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    let __VLS_10;
    const __VLS_11 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.canCreateProjects))
                    return;
                __VLS_ctx.showModal = true;
                // @ts-ignore
                [projectsSubtitle, canCreateProjects, showModal,];
            } });
    const { default: __VLS_12 } = __VLS_8.slots;
    // @ts-ignore
    [];
    var __VLS_8;
    var __VLS_9;
}
if (__VLS_ctx.store.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" },
    });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
    for (const [i] of __VLS_vFor((6))) {
        const __VLS_13 = Skeleton;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            key: (i),
            variant: "card",
        }));
        const __VLS_15 = __VLS_14({
            key: (i),
            variant: "card",
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        // @ts-ignore
        [store,];
    }
}
else if (!__VLS_ctx.store.projects.length) {
    const __VLS_18 = EmptyState || EmptyState;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        ...{ class: "mt-6" },
        title: "No projects yet",
        description: (__VLS_ctx.canCreateProjects
            ? 'Create your first project to start organizing tasks.'
            : 'Ask a project owner to invite you. You cannot create projects yet.'),
    }));
    const __VLS_20 = __VLS_19({
        ...{ class: "mt-6" },
        title: "No projects yet",
        description: (__VLS_ctx.canCreateProjects
            ? 'Create your first project to start organizing tasks.'
            : 'Ask a project owner to invite you. You cannot create projects yet.'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    const { default: __VLS_23 } = __VLS_21.slots;
    if (__VLS_ctx.canCreateProjects) {
        const __VLS_24 = Button || Button;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
            ...{ 'onClick': {} },
        }));
        const __VLS_26 = __VLS_25({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        let __VLS_29;
        const __VLS_30 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.store.loading))
                        return;
                    if (!(!__VLS_ctx.store.projects.length))
                        return;
                    if (!(__VLS_ctx.canCreateProjects))
                        return;
                    __VLS_ctx.showModal = true;
                    // @ts-ignore
                    [canCreateProjects, canCreateProjects, showModal, store,];
                } });
        const { default: __VLS_31 } = __VLS_27.slots;
        // @ts-ignore
        [];
        var __VLS_27;
        var __VLS_28;
    }
    // @ts-ignore
    [];
    var __VLS_21;
}
else {
    const __VLS_32 = ProjectList;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
        ...{ 'onOpen': {} },
        ...{ 'onEdit': {} },
        ...{ class: "mt-6" },
        projects: (__VLS_ctx.store.projects),
    }));
    const __VLS_34 = __VLS_33({
        ...{ 'onOpen': {} },
        ...{ 'onEdit': {} },
        ...{ class: "mt-6" },
        projects: (__VLS_ctx.store.projects),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    let __VLS_37;
    const __VLS_38 = ({ open: {} },
        { onOpen: (__VLS_ctx.openProject) });
    const __VLS_39 = ({ edit: {} },
        { onEdit: (__VLS_ctx.openEditProject) });
    /** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
    var __VLS_35;
    var __VLS_36;
}
const __VLS_40 = Modal || Modal;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    modelValue: (__VLS_ctx.showModal),
    title: "New project",
}));
const __VLS_42 = __VLS_41({
    modelValue: (__VLS_ctx.showModal),
    title: "New project",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const { default: __VLS_45 } = __VLS_43.slots;
const __VLS_46 = ProjectForm;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
    ...{ 'onSubmit': {} },
    ...{ 'onCancel': {} },
    name: (__VLS_ctx.name),
    description: (__VLS_ctx.description),
    submitLabel: "Create",
    loading: (__VLS_ctx.saving),
}));
const __VLS_48 = __VLS_47({
    ...{ 'onSubmit': {} },
    ...{ 'onCancel': {} },
    name: (__VLS_ctx.name),
    description: (__VLS_ctx.description),
    submitLabel: "Create",
    loading: (__VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_47));
let __VLS_51;
const __VLS_52 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.createProject) });
const __VLS_53 = ({ cancel: {} },
    { onCancel: (...[$event]) => {
            __VLS_ctx.showModal = false;
            // @ts-ignore
            [showModal, showModal, store, openProject, openEditProject, name, description, saving, createProject,];
        } });
var __VLS_49;
var __VLS_50;
// @ts-ignore
[];
var __VLS_43;
const __VLS_54 = Modal || Modal;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
    modelValue: (__VLS_ctx.editModalOpen),
    title: "Edit project",
}));
const __VLS_56 = __VLS_55({
    modelValue: (__VLS_ctx.editModalOpen),
    title: "Edit project",
}, ...__VLS_functionalComponentArgsRest(__VLS_55));
const { default: __VLS_59 } = __VLS_57.slots;
const __VLS_60 = ProjectForm || ProjectForm;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
    ...{ 'onSubmit': {} },
    ...{ 'onCancel': {} },
    name: (__VLS_ctx.editName),
    description: (__VLS_ctx.editDescription),
    submitLabel: "Save",
    loading: (__VLS_ctx.editSaving),
}));
const __VLS_62 = __VLS_61({
    ...{ 'onSubmit': {} },
    ...{ 'onCancel': {} },
    name: (__VLS_ctx.editName),
    description: (__VLS_ctx.editDescription),
    submitLabel: "Save",
    loading: (__VLS_ctx.editSaving),
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
let __VLS_65;
const __VLS_66 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.saveEditProject) });
const __VLS_67 = ({ cancel: {} },
    { onCancel: (...[$event]) => {
            __VLS_ctx.editModalOpen = false;
            // @ts-ignore
            [editModalOpen, editModalOpen, editName, editDescription, editSaving, saveEditProject,];
        } });
const { default: __VLS_68 } = __VLS_63.slots;
{
    const { 'actions-start': __VLS_69 } = __VLS_63.slots;
    const __VLS_70 = Button || Button;
    // @ts-ignore
    const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        ...{ 'onClick': {} },
        variant: "ghost-danger",
        type: "button",
    }));
    const __VLS_72 = __VLS_71({
        ...{ 'onClick': {} },
        variant: "ghost-danger",
        type: "button",
    }, ...__VLS_functionalComponentArgsRest(__VLS_71));
    let __VLS_75;
    const __VLS_76 = ({ click: {} },
        { onClick: (__VLS_ctx.removeEditProject) });
    const { default: __VLS_77 } = __VLS_73.slots;
    // @ts-ignore
    [removeEditProject,];
    var __VLS_73;
    var __VLS_74;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_63;
var __VLS_64;
// @ts-ignore
[];
var __VLS_57;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
