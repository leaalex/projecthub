/** Секция заметок проекта (`note_sections`). */
export interface NoteSection {
  id: number
  project_id: number
  name: string
  position: number
  created_at: string
  updated_at: string
}

/** Заметка, связанная с проектом. */
export interface Note {
  id: number
  project_id: number
  /** id из `note_sections`, не task_sections. */
  section_id: number | null
  author_id: number
  title: string
  body: string
  position: number
  created_at: string
  updated_at: string
  /** Присутствует только на GET /notes/:id — id задач, связанных с заметкой. */
  linked_task_ids?: number[]
}

/** Запись в корзине (без body). */
export type NoteTrashItem = Pick<
  Note,
  'id' | 'project_id' | 'section_id' | 'title' | 'created_at' | 'updated_at'
>

export interface CreateNotePayload {
  title: string
  body?: string
  section_id?: number
}

export interface UpdateNotePayload {
  title?: string
  body?: string
}

export interface NoteLinkedTask {
  id: number
  title: string
  project_id: number
}
