import { create } from "zustand";
import { api } from "./api";
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
  StudyStatus,
  Task,
  TaskInput,
} from "./types";

interface TrackerState {
  areas: Area[];
  projects: Project[];
  tasks: Task[];
  studyItems: StudyItem[];
  sessions: Session[];
  events: CalendarEvent[];
  notes: Note[];
  selectedProjectId: number | null;
  search: string;
  loading: boolean;
  error: string | null;
  loadAll: () => Promise<void>;
  setSelectedProjectId: (id: number | null) => void;
  setSearch: (search: string) => void;
  createArea: (name: string, color: string) => Promise<void>;
  updateArea: (id: number, name: string, color: string) => Promise<void>;
  deleteArea: (id: number) => Promise<void>;
  createProject: (areaId: number, name: string, description?: string | null) => Promise<Project>;
  updateProject: (id: number, areaId: number, name: string, description: string | null, status: ProjectStatus) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  createTask: (input: TaskInput) => Promise<void>;
  updateTask: (id: number, input: TaskInput) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  completeTask: (task: Task) => Promise<void>;
  focusTask: (task: Task) => Promise<void>;
  reorderTodayTasks: (ids: number[]) => Promise<void>;
  createStudyItem: (input: StudyItemInput) => Promise<void>;
  updateStudyItem: (id: number, input: StudyItemInput) => Promise<void>;
  setStudyStatus: (item: StudyItem, status: StudyStatus) => Promise<void>;
  deleteStudyItem: (id: number) => Promise<void>;
  reorderStudyItems: (ids: number[]) => Promise<void>;
  createSession: (input: SessionInput) => Promise<Session>;
  finishSession: (id: number, endTime: string, durationMinutes: number, note?: string | null) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;
  createEvent: (input: CalendarEventInput) => Promise<void>;
  updateEvent: (id: number, input: CalendarEventInput) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  createNote: (input: NoteInput) => Promise<void>;
  updateNote: (id: number, input: NoteInput) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
}

const replaceById = <T extends { id: number }>(items: T[], item: T) =>
  items.map((current) => (current.id === item.id ? item : current));

const asError = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const useTracker = create<TrackerState>((set, get) => ({
  areas: [],
  projects: [],
  tasks: [],
  studyItems: [],
  sessions: [],
  events: [],
  notes: [],
  selectedProjectId: null,
  search: "",
  loading: false,
  error: null,

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const [areas, projects, tasks, studyItems, sessions, events, notes] = await Promise.all([
        api.listAreas(),
        api.listProjects(),
        api.listTasks(),
        api.listStudyItems(),
        api.listSessions(),
        api.listCalendarEvents(),
        api.listNotes(),
      ]);
      set((state) => ({
        areas,
        projects,
        tasks,
        studyItems,
        sessions,
        events,
        notes,
        selectedProjectId:
          state.selectedProjectId && projects.some((project) => project.id === state.selectedProjectId)
            ? state.selectedProjectId
            : null,
        loading: false,
      }));
    } catch (error) {
      set({ error: asError(error), loading: false });
    }
  },

  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSearch: (search) => set({ search }),

  createArea: async (name, color) => {
    const area = await api.createArea(name, color);
    set((state) => ({ areas: [...state.areas, area] }));
  },
  updateArea: async (id, name, color) => {
    const area = await api.updateArea(id, name, color);
    set((state) => ({ areas: replaceById(state.areas, area) }));
  },
  deleteArea: async (id) => {
    await api.deleteArea(id);
    await get().loadAll();
  },

  createProject: async (areaId, name, description) => {
    const project = await api.createProject(areaId, name, description, "active");
    set((state) => ({ projects: [...state.projects, project], selectedProjectId: project.id }));
    return project;
  },
  updateProject: async (id, areaId, name, description, status) => {
    const project = await api.updateProject(id, areaId, name, description, status);
    set((state) => ({ projects: replaceById(state.projects, project) }));
  },
  deleteProject: async (id) => {
    await api.deleteProject(id);
    await get().loadAll();
  },

  createTask: async (input) => {
    const task = await api.createTask(input);
    set((state) => ({ tasks: [task, ...state.tasks] }));
  },
  updateTask: async (id, input) => {
    const task = await api.updateTask(id, input);
    set((state) => ({ tasks: replaceById(state.tasks, task) }));
  },
  deleteTask: async (id) => {
    await api.deleteTask(id);
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
  },
  completeTask: async (task) => {
    await get().updateTask(task.id, { ...task, status: task.status === "done" ? "todo" : "done" });
  },
  focusTask: async (task) => {
    const currentFocus = get().tasks.find((item) => item.status === "doing" && item.id !== task.id);
    if (currentFocus) {
      await get().updateTask(currentFocus.id, { ...currentFocus, status: "todo" });
    }
    await get().updateTask(task.id, { ...task, status: "doing" });
  },
  reorderTodayTasks: async (ids) => {
    await api.reorderTasks(ids);
    await get().loadAll();
  },

  createStudyItem: async (input) => {
    const item = await api.createStudyItem(input);
    set((state) => ({ studyItems: [...state.studyItems, item] }));
  },
  updateStudyItem: async (id, input) => {
    const item = await api.updateStudyItem(id, input);
    set((state) => ({ studyItems: replaceById(state.studyItems, item) }));
  },
  setStudyStatus: async (item, status) => {
    await get().updateStudyItem(item.id, { ...item, status });
  },
  deleteStudyItem: async (id) => {
    await api.deleteStudyItem(id);
    set((state) => ({ studyItems: state.studyItems.filter((item) => item.id !== id) }));
  },
  reorderStudyItems: async (ids) => {
    await api.reorderStudyItems(ids);
    await get().loadAll();
  },

  createSession: async (input) => {
    const session = await api.createSession(input);
    set((state) => ({ sessions: [session, ...state.sessions] }));
    return session;
  },
  finishSession: async (id, endTime, durationMinutes, note) => {
    const session = await api.finishSession(id, endTime, durationMinutes, note);
    set((state) => ({ sessions: replaceById(state.sessions, session) }));
  },
  deleteSession: async (id) => {
    await api.deleteSession(id);
    set((state) => ({ sessions: state.sessions.filter((session) => session.id !== id) }));
  },

  createEvent: async (input) => {
    const event = await api.createCalendarEvent(input);
    set((state) => ({ events: [...state.events, event] }));
  },
  updateEvent: async (id, input) => {
    const event = await api.updateCalendarEvent(id, input);
    set((state) => ({ events: replaceById(state.events, event) }));
  },
  deleteEvent: async (id) => {
    await api.deleteCalendarEvent(id);
    set((state) => ({ events: state.events.filter((event) => event.id !== id) }));
  },

  createNote: async (input) => {
    const note = await api.createNote(input);
    set((state) => ({ notes: [note, ...state.notes] }));
  },
  updateNote: async (id, input) => {
    const note = await api.updateNote(id, input);
    set((state) => ({ notes: replaceById(state.notes, note) }));
  },
  deleteNote: async (id) => {
    await api.deleteNote(id);
    set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }));
  },
}));
