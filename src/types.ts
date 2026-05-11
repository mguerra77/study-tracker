export type Status = "todo" | "doing" | "done" | "archived";
export type ProjectStatus = "active" | "paused" | "archived" | "done";
export type Priority = "low" | "medium" | "high";
export type Energy = "low" | "medium" | "high";
export type StudyStatus = "not_started" | "in_progress" | "reviewing" | "done";
export type StudyType = "topic" | "assignment" | "exam" | "practice" | "note";
export type SessionType = "study" | "work" | "personal";
export type EventType = "exam" | "deadline" | "meeting" | "reminder" | "class";

export interface Area {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Project {
  id: number;
  area_id: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  area_id?: number | null;
  project_id?: number | null;
  title: string;
  description?: string | null;
  status: Status;
  priority: Priority;
  energy: Energy;
  scheduled_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StudyItem {
  id: number;
  project_id: number;
  title: string;
  item_type: StudyType;
  status: StudyStatus;
  planned_date?: string | null;
  planned_week?: number | null;
  due_date?: string | null;
  notes?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  area_id?: number | null;
  project_id?: number | null;
  task_id?: number | null;
  session_type: SessionType;
  start_time: string;
  end_time?: string | null;
  duration_minutes: number;
  note?: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  area_id?: number | null;
  project_id?: number | null;
  title: string;
  description?: string | null;
  start_time: string;
  end_time?: string | null;
  event_type: EventType;
  created_at: string;
}

export interface Note {
  id: number;
  project_id?: number | null;
  study_item_id?: number | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type TaskInput = Omit<Task, "id" | "completed_at" | "sort_order" | "created_at" | "updated_at">;
export type StudyItemInput = Omit<StudyItem, "id" | "sort_order" | "created_at" | "updated_at">;
export type SessionInput = Partial<Omit<Session, "id" | "created_at">>;
export type CalendarEventInput = Omit<CalendarEvent, "id" | "created_at">;
export type NoteInput = Omit<Note, "id" | "created_at" | "updated_at">;
