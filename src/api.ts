import { invoke } from "@tauri-apps/api/core";
import type {
  Area,
  CalendarEvent,
  CalendarEventInput,
  Note,
  NoteInput,
  Project,
  ProjectStatus,
  Session,
  SessionInput,
  StudyItem,
  StudyItemInput,
  Task,
  TaskInput,
} from "./types";

const call = <T>(command: string, args?: Record<string, unknown>) => invoke<T>(command, args);

export const api = {
  listAreas: () => call<Area[]>("list_areas"),
  createArea: (name: string, color: string) => call<Area>("create_area", { name, color }),
  updateArea: (id: number, name: string, color: string) => call<Area>("update_area", { id, name, color }),
  deleteArea: (id: number) => call<void>("delete_area", { id }),

  listProjects: () => call<Project[]>("list_projects"),
  createProject: (areaId: number, name: string, description?: string | null, status?: ProjectStatus) =>
    call<Project>("create_project", { areaId, name, description, status }),
  updateProject: (id: number, areaId: number, name: string, description: string | null, status: ProjectStatus) =>
    call<Project>("update_project", { id, areaId, name, description, status }),
  deleteProject: (id: number) => call<void>("delete_project", { id }),

  listTasks: () => call<Task[]>("list_tasks"),
  createTask: (input: TaskInput) => call<Task>("create_task", { input }),
  updateTask: (id: number, input: TaskInput) => call<Task>("update_task", { id, input }),
  deleteTask: (id: number) => call<void>("delete_task", { id }),
  reorderTasks: (ids: number[]) => call<void>("reorder_tasks", { ids }),

  listStudyItems: () => call<StudyItem[]>("list_study_items"),
  createStudyItem: (input: StudyItemInput) => call<StudyItem>("create_study_item", { input }),
  updateStudyItem: (id: number, input: StudyItemInput) => call<StudyItem>("update_study_item", { id, input }),
  deleteStudyItem: (id: number) => call<void>("delete_study_item", { id }),
  reorderStudyItems: (ids: number[]) => call<void>("reorder_study_items", { ids }),

  listSessions: () => call<Session[]>("list_sessions"),
  createSession: (input: SessionInput) => call<Session>("create_session", { input }),
  finishSession: (id: number, endTime: string, durationMinutes: number, note?: string | null) =>
    call<Session>("finish_session", { id, endTime, durationMinutes, note }),
  deleteSession: (id: number) => call<void>("delete_session", { id }),

  listCalendarEvents: () => call<CalendarEvent[]>("list_calendar_events"),
  createCalendarEvent: (input: CalendarEventInput) => call<CalendarEvent>("create_calendar_event", { input }),
  updateCalendarEvent: (id: number, input: CalendarEventInput) =>
    call<CalendarEvent>("update_calendar_event", { id, input }),
  deleteCalendarEvent: (id: number) => call<void>("delete_calendar_event", { id }),

  listNotes: () => call<Note[]>("list_notes"),
  createNote: (input: NoteInput) => call<Note>("create_note", { input }),
  updateNote: (id: number, input: NoteInput) => call<Note>("update_note", { id, input }),
  deleteNote: (id: number) => call<void>("delete_note", { id }),
};
