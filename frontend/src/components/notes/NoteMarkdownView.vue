<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import './markdown.css'

const props = defineProps<{
  source: string
}>()

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: true }),
    Markdown.configure({ html: false }),
  ],
  content: props.source || '',
  editable: false,
})

watch(
  () => props.source,
  md => {
    const ed = editor.value
    if (!ed || ed.isDestroyed) return
    const cur = ed.storage.markdown.getMarkdown()
    if (md !== cur) {
      ed.commands.setContent(md || '', { emitUpdate: false })
    }
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="note-md-view text-sm text-foreground">
    <editor-content
      :editor="editor"
      class="note-md-editor__content px-1 py-2"
    />
  </div>
</template>
