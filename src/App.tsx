import {
  DragDropContext,
  Draggable,
  Droppable,
  type DraggableProvidedDragHandleProps,
  type DraggableProvidedDraggableProps,
  type DropResult,
} from "@hello-pangea/dnd";
import clsx from "clsx";
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Flame,
  Focus,
  GraduationCap,
  GripVertical,
  Inbox,
  Layers3,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  TimerReset,
  Trash2,
  User,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTracker } from "./store";
import type { Area, CalendarEvent, CalendarEventInput, EventType, Project, Session, StudyItem, StudyStatus, StudyType, Task } from "./types";

const colors = ["#87a9c8", "#d59a6f", "#8fae88", "#b79ac8", "#d8be6a"];

const dateKey = (value: Date) => {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const todayKey = () => dateKey(new Date());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const weekStart = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
};

const dateLabel = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const [date, time] = value.split("T");
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && value.includes("T")) {
    return parsed.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) + (time ? ` · ${time.slice(0, 5)}` : "");
  }
  return date.split("-").reverse().join("/");
};

const minutesLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
};

const projectIcon = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("facultad")) return GraduationCap;
  if (normalized.includes("trabajo")) return Briefcase;
  if (normalized.includes("personal")) return User;
  return Layers3;
};

const studyStatusLabels: Record<StudyStatus, string> = {
  not_started: "Sin empezar",
  in_progress: "En curso",
  reviewing: "Repaso",
  done: "Estudiado",
};

const studyStatusValue: Record<StudyStatus, number> = {
  not_started: 0,
  in_progress: 35,
  reviewing: 70,
  done: 100,
};

const taskStatusLabels: Record<Task["status"], string> = {
  todo: "Pendiente",
  doing: "En foco",
  done: "Hecha",
  archived: "Archivada",
};

const priorityLabels: Record<Task["priority"], string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

const energyLabels: Record<Task["energy"], string> = {
  low: "Baja energia",
  medium: "Energia media",
  high: "Alta energia",
};

const eventTypeLabels: Record<EventType, string> = {
  exam: "Parcial",
  deadline: "Entrega",
  meeting: "Reunión",
  reminder: "Recordatorio",
  class: "Clase",
};

function App() {
  const store = useTracker();
  const today = todayKey();
  const selectedProject = store.projects.find((project) => project.id === store.selectedProjectId) ?? null;
  const [quickTask, setQuickTask] = useState("");
  const [taskProjectId, setTaskProjectId] = useState<number | "">("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newAreaName, setNewAreaName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(today);
  const [newEventType, setNewEventType] = useState<EventType>("deadline");

  useEffect(() => {
    store.loadAll();
  }, []);

  useEffect(() => {
    if (!taskProjectId && selectedProject) setTaskProjectId(selectedProject.id);
  }, [selectedProject?.id]);

  const filteredTasks = useMemo(() => {
    const query = store.search.trim().toLowerCase();
    if (!query) return store.tasks;
    return store.tasks.filter((task) => {
      const project = store.projects.find((item) => item.id === task.project_id);
      return `${task.title} ${task.description ?? ""} ${project?.name ?? ""}`.toLowerCase().includes(query);
    });
  }, [store.search, store.tasks, store.projects]);

  const todayTasks = filteredTasks
    .filter((task) => task.status !== "archived")
    .filter((task) => task.scheduled_date === today || (!task.scheduled_date && task.status !== "done"))
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.sort_order - b.sort_order);

  const focusTask = store.tasks.find((task) => task.status === "doing") ?? todayTasks.find((task) => task.status !== "done") ?? null;
  const openSession = store.sessions.find((session) => !session.end_time) ?? null;
  const todaySessions = store.sessions.filter((session) => session.start_time.slice(0, 10) === today);
  const weeklyStartDate = weekStart(new Date());
  const weeklySessions = store.sessions.filter((session) => new Date(session.start_time) >= weeklyStartDate);
  const todayMinutes = todaySessions.reduce((sum, session) => sum + session.duration_minutes, 0);
  const weeklyMinutes = weeklySessions.reduce((sum, session) => sum + session.duration_minutes, 0);
  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!quickTask.trim()) return;
    const project = store.projects.find((item) => item.id === taskProjectId);
    await store.createTask({
      title: quickTask,
      description: null,
      status: "todo",
      priority: taskPriority,
      energy: "medium",
      scheduled_date: today,
      due_date: null,
      project_id: project?.id ?? null,
      area_id: project?.area_id ?? store.areas[0]?.id ?? null,
    });
    setQuickTask("");
  };

  const createArea = async (event: FormEvent) => {
    event.preventDefault();
    if (!newAreaName.trim()) return;
    await store.createArea(newAreaName, colors[store.areas.length % colors.length]);
    setNewAreaName("");
  };

  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!newProjectName.trim()) return;
    await store.createProject(store.areas[0]?.id ?? 1, newProjectName, null);
    setNewProjectName("");
  };

  const createEvent = async (event: FormEvent) => {
    event.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;
    const input: CalendarEventInput = {
      area_id: selectedProject?.area_id ?? store.areas[0]?.id ?? null,
      project_id: selectedProject?.id ?? null,
      title: newEventTitle,
      description: null,
      start_time: `${newEventDate}T09:00`,
      end_time: null,
      event_type: newEventType,
    };
    await store.createEvent(input);
    setNewEventTitle("");
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const items = Array.from(todayTasks);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    await store.reorderTodayTasks(items.map((task) => task.id));
  };

  return (
    <main className="flex min-h-screen bg-[#0f1110] text-ink">
      <Sidebar
        areas={store.areas}
        projects={store.projects}
        selectedProjectId={store.selectedProjectId}
        onSelectProject={store.setSelectedProjectId}
        onCreateArea={createArea}
        onCreateProject={createProject}
        newAreaName={newAreaName}
        setNewAreaName={setNewAreaName}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        onUpdateArea={async (area) => {
          const name = window.prompt("Nombre del área", area.name);
          if (name?.trim()) await store.updateArea(area.id, name, area.color);
        }}
        onDeleteArea={async (id) => {
          if (window.confirm("Eliminar esta área también elimina sus proyectos.")) await store.deleteArea(id);
        }}
        onUpdateProject={async (project) => {
          const name = window.prompt("Nombre del proyecto", project.name);
          if (name?.trim()) await store.updateProject(project.id, project.area_id, name, project.description ?? null, project.status);
        }}
        onDeleteProject={store.deleteProject}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-line px-6">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={store.search}
              onChange={(event) => store.setSearch(event.target.value)}
              className="field h-10 w-full pl-9"
              placeholder="Buscar tarea, proyecto o nota"
            />
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted md:flex">
            <CalendarDays className="h-4 w-4" />
            {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </header>

        {store.error ? (
          <div className="m-6 rounded-md border border-rust/40 bg-rust/10 p-4 text-sm text-rust">
            {store.error}
          </div>
        ) : null}

        {selectedProject ? (
          <ProjectView project={selectedProject} />
        ) : (
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-auto p-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
          <div className="space-y-6">
            <section className="panel">
              <div className="section-title">
                <div>
                  <p className="eyebrow">Hoy</p>
                  <h1 className="text-xl font-semibold">Qué conviene hacer ahora</h1>
                </div>
                <span className="rounded border border-line px-2.5 py-1 text-xs text-muted">{todayTasks.length} tareas</span>
              </div>

              <form onSubmit={createTask} className="grid gap-2 md:grid-cols-[1fr_150px_116px_42px]">
                <input
                  value={quickTask}
                  onChange={(event) => setQuickTask(event.target.value)}
                  className="field"
                  placeholder="Agregar tarea para hoy"
                />
                <select value={taskProjectId} onChange={(event) => setTaskProjectId(Number(event.target.value) || "")} className="field">
                  <option value="">Sin proyecto</option>
                  {store.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as "low" | "medium" | "high")} className="field">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
                <button className="icon-button" title="Agregar tarea" type="submit">
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="today">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="mt-4 space-y-2">
                      {todayTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                          {(dragProvided) => (
                            <TaskRow
                              task={task}
                              project={store.projects.find((project) => project.id === task.project_id)}
                              onComplete={() => store.completeTask(task)}
                              onFocus={() => store.focusTask(task)}
                              onEdit={async () => {
                                const title = window.prompt("Editar tarea", task.title);
                                if (title?.trim()) await store.updateTask(task.id, { ...task, title });
                              }}
                              onDelete={() => store.deleteTask(task.id)}
                              dragHandleProps={dragProvided.dragHandleProps}
                              refProps={dragProvided.innerRef}
                              draggableProps={dragProvided.draggableProps}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {todayTasks.length === 0 ? <EmptyLine text="Nada urgente. Agregá una tarea pequeña y arrancá." /> : null}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </section>

            <FocusPanel
              task={focusTask}
              project={store.projects.find((project) => project.id === focusTask?.project_id)}
              openSession={openSession}
              onStart={async () => {
                if (!focusTask || openSession) return;
                await store.createSession({
                  area_id: focusTask.area_id,
                  project_id: focusTask.project_id,
                  task_id: focusTask.id,
                  session_type: "study",
                  start_time: new Date().toISOString(),
                });
              }}
              onFinish={async () => {
                if (!openSession) return;
                const end = new Date();
                const start = new Date(openSession.start_time);
                const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000));
                await store.finishSession(openSession.id, end.toISOString(), minutes, null);
              }}
            />
          </div>

          <div className="space-y-6">
            <StatsPanel todayMinutes={todayMinutes} weeklyMinutes={weeklyMinutes} sessions={todaySessions.length} streak={weeklySessions.length} />
            <CalendarPanel
              events={store.events}
              onCreate={createEvent}
              title={newEventTitle}
              setTitle={setNewEventTitle}
              date={newEventDate}
              setDate={setNewEventDate}
              eventType={newEventType}
              setEventType={setNewEventType}
              onUpdate={async (event) => {
                const title = window.prompt("Editar evento", event.title);
                if (title?.trim()) await store.updateEvent(event.id, { ...event, title });
              }}
              onDelete={store.deleteEvent}
            />
          </div>
        </div>
        )}
      </section>
    </main>
  );
}

function Sidebar(props: {
  areas: Area[];
  projects: Project[];
  selectedProjectId: number | null;
  newAreaName: string;
  newProjectName: string;
  setNewAreaName: (value: string) => void;
  setNewProjectName: (value: string) => void;
  onSelectProject: (id: number | null) => void;
  onCreateArea: (event: FormEvent) => void;
  onCreateProject: (event: FormEvent) => void;
  onUpdateArea: (area: Area) => void;
  onDeleteArea: (id: number) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: number) => void;
}) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-line bg-rail p-4 lg:block">
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-moss/20 text-moss">
          <NotebookPen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Study Tracker</p>
          <p className="text-xs text-muted">Local y ligero</p>
        </div>
      </div>

      <button onClick={() => props.onSelectProject(null)} className={clsx("nav-item mb-3", props.selectedProjectId === null && "active")}>
        <Inbox className="h-4 w-4" />
        Dashboard
      </button>

      <div className="space-y-5">
        {props.areas.map((area) => {
          const Icon = projectIcon(area.name);
          const projects = props.projects.filter((project) => project.area_id === area.id && project.status !== "archived");
          return (
            <div key={area.id}>
              <div className="group mb-2 flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: area.color }} />
                <Icon className="h-3.5 w-3.5" />
                <span className="min-w-0 flex-1 truncate">{area.name}</span>
                <button className="ghost-icon h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => props.onUpdateArea(area)} title="Editar área">
                  <Pencil className="h-3 w-3" />
                </button>
                <button className="ghost-icon h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => props.onDeleteArea(area.id)} title="Eliminar área">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-1">
                {projects.map((project) => (
                  <div key={project.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => props.onSelectProject(project.id)}
                      className={clsx("nav-item min-w-0 flex-1", project.id === props.selectedProjectId && "active")}
                    >
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </button>
                    <button className="ghost-icon opacity-0 group-hover:opacity-100" onClick={() => props.onUpdateProject(project)} title="Editar proyecto">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button className="ghost-icon opacity-0 group-hover:opacity-100" onClick={() => props.onDeleteProject(project.id)} title="Eliminar proyecto">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={props.onCreateProject} className="mt-6 flex gap-2">
        <input value={props.newProjectName} onChange={(event) => props.setNewProjectName(event.target.value)} className="field h-9 min-w-0" placeholder="Nuevo proyecto" />
        <button className="icon-button h-9 w-9" title="Agregar proyecto">
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <form onSubmit={props.onCreateArea} className="mt-3 flex gap-2">
        <input value={props.newAreaName} onChange={(event) => props.setNewAreaName(event.target.value)} className="field h-9 min-w-0" placeholder="Nueva área" />
        <button className="icon-button h-9 w-9" title="Agregar área">
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}

function TaskRow(props: {
  task: Task;
  project?: Project;
  onComplete: () => void;
  onFocus: () => void;
  onEdit: () => void;
  onDelete: () => void;
  refProps: (element?: HTMLElement | null) => void;
  draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
}) {
  return (
    <div ref={props.refProps} {...props.draggableProps} className={clsx("task-row", props.task.status === "done" && "opacity-55")}>
      <button onClick={props.onComplete} className="ghost-icon" title="Completar">
        {props.task.status === "done" ? <Check className="h-4 w-4 text-moss" /> : <Circle className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={clsx("truncate text-sm font-medium", props.task.status === "done" && "line-through")}>{props.task.title}</p>
        <p className="truncate text-xs text-muted">{props.project?.name ?? "Sin proyecto"} · energía {props.task.energy}</p>
      </div>
      <span className={clsx("pill", props.task.priority === "high" && "hot", props.task.priority === "low" && "cool")}>{props.task.priority}</span>
      <button onClick={props.onFocus} className="ghost-icon" title="Poner en foco">
        <Focus className="h-4 w-4" />
      </button>
      <button onClick={props.onEdit} className="ghost-icon" title="Editar">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={props.onDelete} className="ghost-icon" title="Eliminar">
        <Trash2 className="h-4 w-4" />
      </button>
      <button {...(props.dragHandleProps ?? {})} className="ghost-icon cursor-grab" title="Reordenar">
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

function FocusPanel(props: {
  task: Task | null;
  project?: Project;
  openSession: Session | null;
  onStart: () => void;
  onFinish: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!props.openSession) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(props.openSession!.start_time).getTime()) / 1000)));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [props.openSession?.id]);

  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">En foco</p>
          <h2 className="text-lg font-semibold">{props.task?.title ?? "Elegí una tarea concreta"}</h2>
        </div>
        <Focus className="h-5 w-5 text-moss" />
      </div>
      <div className="rounded-md border border-line bg-[#101210] p-4">
        <p className="text-sm text-muted">{props.project?.name ?? "Sin proyecto asignado"}</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold tabular-nums">{minutesLabel(Math.floor(elapsed / 60))}</p>
            <p className="text-xs text-muted">{props.openSession ? "Sesión en marcha" : "Timer opcional"}</p>
          </div>
          {props.openSession ? (
            <button className="primary-button rust" onClick={props.onFinish}>
              <TimerReset className="h-4 w-4" />
              Cerrar sesión
            </button>
          ) : (
            <button className="primary-button" onClick={props.onStart} disabled={!props.task}>
              <Clock3 className="h-4 w-4" />
              Iniciar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function StatsPanel(props: { todayMinutes: number; weeklyMinutes: number; sessions: number; streak: number }) {
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Tiempo registrado</p>
          <h2 className="text-lg font-semibold">Progreso visible</h2>
        </div>
        <Flame className="h-5 w-5 text-rust" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Hoy" value={minutesLabel(props.todayMinutes)} />
        <Metric label="Semana" value={minutesLabel(props.weeklyMinutes)} />
        <Metric label="Sesiones" value={String(props.sessions)} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#101210]">
        <div className="h-full rounded-full bg-moss" style={{ width: `${Math.min(100, (props.weeklyMinutes / 600) * 100)}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">Meta suave: 10h semanales. Streak activo: {props.streak} sesiones recientes.</p>
    </section>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-[#101210] p-3">
      <p className="text-xs text-muted">{props.label}</p>
      <p className="mt-1 text-lg font-semibold">{props.value}</p>
    </div>
  );
}

function CalendarPanel(props: {
  events: CalendarEvent[];
  title: string;
  date: string;
  eventType: EventType;
  setTitle: (value: string) => void;
  setDate: (value: string) => void;
  setEventType: (value: EventType) => void;
  onCreate: (event: FormEvent) => void;
  onUpdate: (event: CalendarEvent) => void;
  onDelete: (id: number) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const start = addDays(weekStart(new Date()), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const visibleEvents = props.events.filter((event) => {
    const key = event.start_time.slice(0, 10);
    return days.some((day) => dateKey(day) === key);
  });

  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Calendario</p>
          <h2 className="text-lg font-semibold">Semana</h2>
        </div>
        <div className="flex items-center gap-1">
          <button className="ghost-icon" onClick={() => setWeekOffset((value) => value - 1)} title="Semana anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="ghost-icon" onClick={() => setWeekOffset(0)} title="Semana actual">
            <CalendarDays className="h-4 w-4 text-sky" />
          </button>
          <button className="ghost-icon" onClick={() => setWeekOffset((value) => value + 1)} title="Semana siguiente">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <form onSubmit={props.onCreate} className="grid gap-2 md:grid-cols-[1fr_132px_150px_42px]">
        <input value={props.title} onChange={(event) => props.setTitle(event.target.value)} className="field" placeholder="Parcial, entrega o reunión" />
        <select value={props.eventType} onChange={(event) => props.setEventType(event.target.value as EventType)} className="field">
          <option value="deadline">Entrega</option>
          <option value="exam">Parcial</option>
          <option value="meeting">Reunión</option>
          <option value="class">Clase</option>
          <option value="reminder">Recordatorio</option>
        </select>
        <input value={props.date} onChange={(event) => props.setDate(event.target.value)} type="date" className="field" />
        <button className="icon-button" title="Agregar evento">
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-4 grid gap-2 md:grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day);
          const dayEvents = props.events.filter((event) => event.start_time.slice(0, 10) === key);
          const isToday = key === todayKey();
          return (
            <div key={key} className={clsx("min-h-36 rounded-md border bg-[#101210] p-2", isToday ? "border-sky/60" : "border-line")}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {day.toLocaleDateString("es-AR", { weekday: "short" })}
                  </p>
                  <p className={clsx("text-sm font-semibold", isToday && "text-sky")}>{day.getDate()}</p>
                </div>
                <span className="text-[11px] text-muted">{dayEvents.length || ""}</span>
              </div>
              <div className="space-y-1.5">
                {dayEvents.map((event) => (
                  <div key={event.id} className={clsx("calendar-event", event.event_type)} title={event.title}>
                    <button className="min-w-0 flex-1 text-left" onClick={() => props.onUpdate(event)}>
                      <span className="block truncate text-xs font-medium">{event.title}</span>
                      <span className="block truncate text-[11px] opacity-80">{eventTypeLabels[event.event_type]}</span>
                    </button>
                    <button onClick={() => props.onDelete(event.id)} className="grid h-5 w-5 place-items-center rounded text-current opacity-70 hover:bg-black/20 hover:opacity-100" title="Eliminar evento">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {visibleEvents.length === 0 ? <p className="mt-3 text-center text-sm text-muted">Sin entregas ni parciales en esta semana.</p> : null}
    </section>
  );
}

function ProjectView({ project }: { project: Project }) {
  const store = useTracker();
  const [title, setTitle] = useState("");
  const [itemType, setItemType] = useState<StudyType>("topic");
  const [plannedDate, setPlannedDate] = useState("");
  const [note, setNote] = useState("");

  const items = store.studyItems.filter((item) => item.project_id === project.id);
  const projectTasks = store.tasks
    .filter((task) => task.project_id === project.id && task.status !== "archived")
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.sort_order - b.sort_order);
  const notes = store.notes.filter((item) => item.project_id === project.id && !item.study_item_id);
  const groups = items.reduce<Record<string, StudyItem[]>>((acc, item) => {
    const key = item.planned_week ? `Semana ${item.planned_week}` : item.item_type === "assignment" ? "TPs" : item.item_type === "exam" ? "Parciales" : "Temas";
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {});
  const done = items.filter((item) => item.status === "done").length;
  const inProgress = items.filter((item) => item.status === "in_progress").length;
  const reviewing = items.filter((item) => item.status === "reviewing").length;

  const createItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    await store.createStudyItem({
      project_id: project.id,
      title,
      item_type: itemType,
      status: "not_started",
      planned_date: plannedDate || null,
      planned_week: null,
      due_date: null,
      notes: null,
    });
    setTitle("");
    setPlannedDate("");
  };

  const createNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    await store.createNote({ project_id: project.id, study_item_id: null, title: "Nota rápida", content: note });
    setNote("");
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const ordered = Array.from(items).sort((a, b) => a.sort_order - b.sort_order);
    const [moved] = ordered.splice(result.source.index, 1);
    ordered.splice(result.destination.index, 0, moved);
    await store.reorderStudyItems(ordered.map((item) => item.id));
  };

  return (
    <div className="flex-1 overflow-auto p-6">
    <section className="panel mx-auto max-w-5xl">
      <div className="section-title">
        <div>
          <p className="eyebrow">Proyecto</p>
          <h2 className="text-lg font-semibold">{project.name}</h2>
        </div>
        <span className="pill cool">{items.length ? Math.round((done / items.length) * 100) : 0}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#101210]">
        <div className="h-full rounded-full bg-sky" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Sin empezar" value={String(items.filter((item) => item.status === "not_started").length)} />
        <Metric label="En curso" value={String(inProgress)} />
        <Metric label="Repaso" value={String(reviewing)} />
        <Metric label="Estudiado" value={String(done)} />
      </div>

      <form onSubmit={createItem} className="grid gap-2 md:grid-cols-[1fr_140px_150px_42px]">
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="field" placeholder="Tema, TP o práctica" />
        <select value={itemType} onChange={(event) => setItemType(event.target.value as StudyType)} className="field">
          <option value="topic">Tema</option>
          <option value="assignment">TP</option>
          <option value="exam">Parcial</option>
          <option value="practice">Práctica</option>
          <option value="note">Apunte</option>
        </select>
        <input
          value={plannedDate}
          onChange={(event) => setPlannedDate(event.target.value)}
          type="date"
          className="field"
          title="Fecha de estudio"
        />
        <button className="icon-button" title="Agregar ítem">
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="study-items">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="mt-4 space-y-4">
              {Object.entries(groups).map(([group, groupItems]) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{group}</p>
                  <div className="space-y-2">
                    {groupItems.map((item) => {
                      const index = items.findIndex((current) => current.id === item.id);
                      return (
                        <Draggable draggableId={`study-${item.id}`} index={index} key={item.id}>
                          {(dragProvided) => (
                            <StudyRow
                              item={item}
                              onStatus={(status) => store.setStudyStatus(item, status)}
                              onSetDate={async (date) => {
                                await store.updateStudyItem(item.id, { ...item, planned_date: date || null });
                              }}
                              onEdit={async () => {
                                const edited = window.prompt("Editar ítem", item.title);
                                if (edited?.trim()) await store.updateStudyItem(item.id, { ...item, title: edited });
                              }}
                              onDelete={() => store.deleteStudyItem(item.id)}
                              refProps={dragProvided.innerRef}
                              draggableProps={dragProvided.draggableProps}
                              dragHandleProps={dragProvided.dragHandleProps}
                            />
                          )}
                        </Draggable>
                      );
                    })}
                  </div>
                </div>
              ))}
              {provided.placeholder}
              {items.length === 0 ? <EmptyLine text="Agregá el primer tema para hacer visible el avance." /> : null}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <ProjectTaskList
        tasks={projectTasks}
        onComplete={store.completeTask}
        onFocus={store.focusTask}
        onEdit={async (task) => {
          const title = window.prompt("Editar tarea", task.title);
          if (title?.trim()) await store.updateTask(task.id, { ...task, title });
        }}
        onDelete={store.deleteTask}
      />

      <form onSubmit={createNote} className="mt-5 flex gap-2">
        <input value={note} onChange={(event) => setNote(event.target.value)} className="field min-w-0" placeholder="Nota rápida del proyecto" />
        <button className="icon-button" title="Agregar nota">
          <Plus className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-3 space-y-2">
        {notes.slice(0, 3).map((item) => (
          <div key={item.id} className="flex gap-2 rounded-md border border-line bg-[#101210] p-3 text-sm text-muted">
            <span className="min-w-0 flex-1">{item.content}</span>
            <button onClick={() => store.deleteNote(item.id)} className="ghost-icon h-7 w-7" title="Eliminar nota">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
    </div>
  );
}

function ProjectTaskList(props: {
  tasks: Task[];
  onComplete: (task: Task) => void;
  onFocus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Tareas del proyecto</p>
        <span className="pill">{props.tasks.length}</span>
      </div>
      <div className="space-y-2">
        {props.tasks.map((task) => (
          <div key={task.id} className={clsx("task-row", task.status === "done" && "opacity-60")}>
            <button onClick={() => props.onComplete(task)} className="ghost-icon" title="Completar">
              {task.status === "done" ? <Check className="h-4 w-4 text-moss" /> : <Circle className="h-4 w-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={clsx("truncate text-sm font-medium", task.status === "done" && "line-through")}>{task.title}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className={clsx("pill", task.status === "doing" && "hot", task.status === "done" && "cool")}>{taskStatusLabels[task.status]}</span>
                <span className={clsx("pill", task.priority === "high" && "hot", task.priority === "low" && "cool")}>{priorityLabels[task.priority]}</span>
                <span className={clsx("pill", task.energy === "high" && "hot", task.energy === "low" && "cool")}>{energyLabels[task.energy]}</span>
                <span className="pill">{dateLabel(task.scheduled_date)}</span>
              </div>
            </div>
            <button onClick={() => props.onFocus(task)} className="ghost-icon" title="Poner en foco">
              <Focus className="h-4 w-4" />
            </button>
            <button onClick={() => props.onEdit(task)} className="ghost-icon" title="Editar">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => props.onDelete(task.id)} className="ghost-icon" title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {props.tasks.length === 0 ? <EmptyLine text="Todavía no hay tareas ejecutables para este proyecto." /> : null}
      </div>
    </div>
  );
}

function StudyRow(props: {
  item: StudyItem;
  onStatus: (status: StudyStatus) => void;
  onSetDate: (date: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  refProps: (element?: HTMLElement | null) => void;
  draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
}) {
  const nextStatus: StudyStatus =
    props.item.status === "not_started"
      ? "in_progress"
      : props.item.status === "in_progress"
        ? "reviewing"
        : props.item.status === "reviewing"
          ? "done"
          : "not_started";

  return (
    <div ref={props.refProps} {...props.draggableProps} className="task-row">
      <button onClick={() => props.onStatus(nextStatus)} className="ghost-icon" title="Cambiar estado">
        {props.item.status === "done" ? <Check className="h-4 w-4 text-moss" /> : <Circle className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={clsx("truncate text-sm font-medium", props.item.status === "done" && "line-through opacity-60")}>{props.item.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={clsx("pill", props.item.status === "done" && "cool", props.item.status === "reviewing" && "hot")}>
            {studyStatusLabels[props.item.status]}
          </span>
          <span className="pill">{props.item.item_type}</span>
          <span className="pill">{props.item.planned_date ? dateLabel(props.item.planned_date) : "Sin fecha"}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#0f1110]">
          <div className="h-full rounded-full bg-moss" style={{ width: `${studyStatusValue[props.item.status]}%` }} />
        </div>
      </div>
      <input
        value={props.item.planned_date ?? ""}
        onChange={(event) => props.onSetDate(event.target.value)}
        type="date"
        className="field hidden h-8 w-36 md:block"
        title="Fecha de estudio"
      />
      <button onClick={props.onEdit} className="ghost-icon" title="Editar">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={props.onDelete} className="ghost-icon" title="Eliminar">
        <Trash2 className="h-4 w-4" />
      </button>
      <button {...(props.dragHandleProps ?? {})} className="ghost-icon cursor-grab" title="Reordenar">
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-line px-3 py-4 text-center text-sm text-muted">{text}</div>;
}

export default App;
