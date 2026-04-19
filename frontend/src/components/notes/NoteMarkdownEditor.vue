<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/vue/24/outline'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import './markdown.css'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disabled?: boolean
  }>(),
  { placeholder: '', disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-primary underline' },
    }),
    Markdown.configure({
      html: false,
      transformPastedText: true,
    }),
  ],
  content: props.modelValue || '',
  editable: !props.disabled,
  editorProps: {
    attributes: {
      class: 'note-md-editor__inner',
      ...(props.placeholder
        ? { 'data-placeholder': props.placeholder }
        : {}),
    },
  },
  onUpdate: ({ editor: ed }) => {
    emit('update:modelValue', ed.storage.markdown.getMarkdown())
  },
})

watch(
  () => props.modelValue,
  md => {
    const ed = editor.value
    if (!ed || ed.isDestroyed) return
    const cur = ed.storage.markdown.getMarkdown()
    if (md !== cur) {
      ed.commands.setContent(md || '', { emitUpdate: false })
    }
  },
)

watch(
  () => props.disabled,
  d => {
    editor.value?.setEditable(!d)
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function chain() {
  return editor.value?.chain().focus()
}
</script>

<template>
  <div class="note-md-editor overflow-hidden rounded-lg border border-border bg-surface">
    <div
      v-if="!disabled"
      class="flex flex-wrap gap-1 border-b border-border bg-surface-muted/50 p-2"
    >
      <button
        type="button"
        class="rounded px-2 py-1 text-xs font-medium text-foreground hover:bg-border/60"
        :title="t('notes.editor.toolbar.bold')"
        :aria-label="t('notes.editor.toolbar.bold')"
        @click="chain()?.toggleBold().run()"
      >
        B
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs font-medium italic text-foreground hover:bg-border/60"
        :title="t('notes.editor.toolbar.italic')"
        :aria-label="t('notes.editor.toolbar.italic')"
        @click="chain()?.toggleItalic().run()"
      >
        I
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 font-mono text-xs text-foreground hover:bg-border/60"
        :title="t('notes.editor.toolbar.code')"
        :aria-label="t('notes.editor.toolbar.code')"
        @click="chain()?.toggleCode().run()"
      >
        &lt;/&gt;
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs text-foreground hover:bg-border/60"
        :title="t('notes.editor.toolbar.heading2')"
        :aria-label="t('notes.editor.toolbar.heading2')"
        @click="chain()?.toggleHeading({ level: 2 }).run()"
      >
        H2
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs text-foreground hover:bg-border/60"
        :title="t('notes.editor.toolbar.bulletList')"
        :aria-label="t('notes.editor.toolbar.bulletList')"
        @click="chain()?.toggleBulletList().run()"
      >
        •
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs text-foreground hover:bg-border/60"
        :title="t('notes.editor.toolbar.orderedList')"
        :aria-label="t('notes.editor.toolbar.orderedList')"
        @click="chain()?.toggleOrderedList().run()"
      >
        1.
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs text-foreground hover:bg-border/60"
        :title="t('notes.editor.toolbar.blockquote')"
        :aria-label="t('notes.editor.toolbar.blockquote')"
        @click="chain()?.toggleBlockquote().run()"
      >
        ”
      </button>
      <button
        type="button"
        class="rounded p-1.5 text-foreground hover:bg-border/60"
        :title="t('notes.editor.toolbar.undo')"
        :aria-label="t('notes.editor.toolbar.undo')"
        @click="chain()?.undo().run()"
      >
        <ArrowUturnLeftIcon class="h-4 w-4" />
      </button>
      <button
        type="button"
        class="rounded p-1.5 text-foreground hover:bg-border/60"
        :title="t('notes.editor.toolbar.redo')"
        :aria-label="t('notes.editor.toolbar.redo')"
        @click="chain()?.redo().run()"
      >
        <ArrowUturnRightIcon class="h-4 w-4" />
      </button>
    </div>
    <editor-content
      :editor="editor"
      class="note-md-editor__content max-h-[min(360px,55vh)] overflow-y-auto px-3 py-2 text-sm text-foreground"
    />
  </div>
</template>

<style scoped>
.note-md-editor__content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-muted, #9ca3af);
  pointer-events: none;
  height: 0;
}
</style>
