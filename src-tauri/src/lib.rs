use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension, Row};
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;
use tauri::Manager;

struct Db(Mutex<Connection>);

type CommandResult<T> = Result<T, String>;

#[derive(Debug, Serialize)]
struct Area {
    id: i64,
    name: String,
    color: String,
    created_at: String,
}

#[derive(Debug, Serialize)]
struct Project {
    id: i64,
    area_id: i64,
    name: String,
    description: Option<String>,
    status: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize)]
struct Task {
    id: i64,
    area_id: Option<i64>,
    project_id: Option<i64>,
    title: String,
    description: Option<String>,
    status: String,
    priority: String,
    energy: String,
    scheduled_date: Option<String>,
    due_date: Option<String>,
    completed_at: Option<String>,
    sort_order: i64,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize)]
struct StudyItem {
    id: i64,
    project_id: i64,
    title: String,
    item_type: String,
    status: String,
    planned_date: Option<String>,
    planned_week: Option<i64>,
    due_date: Option<String>,
    notes: Option<String>,
    sort_order: i64,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize)]
struct Session {
    id: i64,
    area_id: Option<i64>,
    project_id: Option<i64>,
    task_id: Option<i64>,
    session_type: String,
    start_time: String,
    end_time: Option<String>,
    duration_minutes: i64,
    note: Option<String>,
    created_at: String,
}

#[derive(Debug, Serialize)]
struct CalendarEvent {
    id: i64,
    area_id: Option<i64>,
    project_id: Option<i64>,
    title: String,
    description: Option<String>,
    start_time: String,
    end_time: Option<String>,
    event_type: String,
    created_at: String,
}

#[derive(Debug, Serialize)]
struct Note {
    id: i64,
    project_id: Option<i64>,
    study_item_id: Option<i64>,
    title: String,
    content: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Deserialize)]
struct TaskInput {
    area_id: Option<i64>,
    project_id: Option<i64>,
    title: String,
    description: Option<String>,
    status: Option<String>,
    priority: Option<String>,
    energy: Option<String>,
    scheduled_date: Option<String>,
    due_date: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StudyItemInput {
    project_id: i64,
    title: String,
    item_type: Option<String>,
    status: Option<String>,
    planned_date: Option<String>,
    planned_week: Option<i64>,
    due_date: Option<String>,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SessionInput {
    area_id: Option<i64>,
    project_id: Option<i64>,
    task_id: Option<i64>,
    session_type: Option<String>,
    start_time: Option<String>,
    end_time: Option<String>,
    duration_minutes: Option<i64>,
    note: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CalendarEventInput {
    area_id: Option<i64>,
    project_id: Option<i64>,
    title: String,
    description: Option<String>,
    start_time: String,
    end_time: Option<String>,
    event_type: Option<String>,
}

#[derive(Debug, Deserialize)]
struct NoteInput {
    project_id: Option<i64>,
    study_item_id: Option<i64>,
    title: String,
    content: String,
}

fn now() -> String {
    Utc::now().to_rfc3339()
}

fn db_error(error: impl std::fmt::Display) -> String {
    error.to_string()
}

fn migrate(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#8fae88',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
            project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            priority TEXT NOT NULL DEFAULT 'medium',
            energy TEXT NOT NULL DEFAULT 'medium',
            scheduled_date TEXT,
            due_date TEXT,
            completed_at TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS study_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            item_type TEXT NOT NULL DEFAULT 'topic',
            status TEXT NOT NULL DEFAULT 'not_started',
            planned_date TEXT,
            planned_week INTEGER,
            due_date TEXT,
            notes TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
            project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
            task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
            session_type TEXT NOT NULL DEFAULT 'study',
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration_minutes INTEGER NOT NULL DEFAULT 0,
            note TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
            project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            description TEXT,
            start_time TEXT NOT NULL,
            end_time TEXT,
            event_type TEXT NOT NULL DEFAULT 'reminder',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
            study_item_id INTEGER REFERENCES study_items(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        ",
    )?;

    let area_count: i64 = conn.query_row("SELECT COUNT(*) FROM areas", [], |row| row.get(0))?;
    if area_count == 0 {
        let timestamp = now();
        let defaults = [
            ("Facultad", "#87a9c8"),
            ("Trabajo", "#d59a6f"),
            ("Personal", "#8fae88"),
        ];

        for (name, color) in defaults {
            conn.execute(
                "INSERT INTO areas (name, color, created_at) VALUES (?1, ?2, ?3)",
                params![name, color, timestamp],
            )?;
        }
    }

    Ok(())
}

fn area_from_row(row: &Row<'_>) -> rusqlite::Result<Area> {
    Ok(Area {
        id: row.get(0)?,
        name: row.get(1)?,
        color: row.get(2)?,
        created_at: row.get(3)?,
    })
}

fn project_from_row(row: &Row<'_>) -> rusqlite::Result<Project> {
    Ok(Project {
        id: row.get(0)?,
        area_id: row.get(1)?,
        name: row.get(2)?,
        description: row.get(3)?,
        status: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn task_from_row(row: &Row<'_>) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get(0)?,
        area_id: row.get(1)?,
        project_id: row.get(2)?,
        title: row.get(3)?,
        description: row.get(4)?,
        status: row.get(5)?,
        priority: row.get(6)?,
        energy: row.get(7)?,
        scheduled_date: row.get(8)?,
        due_date: row.get(9)?,
        completed_at: row.get(10)?,
        sort_order: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

fn study_item_from_row(row: &Row<'_>) -> rusqlite::Result<StudyItem> {
    Ok(StudyItem {
        id: row.get(0)?,
        project_id: row.get(1)?,
        title: row.get(2)?,
        item_type: row.get(3)?,
        status: row.get(4)?,
        planned_date: row.get(5)?,
        planned_week: row.get(6)?,
        due_date: row.get(7)?,
        notes: row.get(8)?,
        sort_order: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

fn session_from_row(row: &Row<'_>) -> rusqlite::Result<Session> {
    Ok(Session {
        id: row.get(0)?,
        area_id: row.get(1)?,
        project_id: row.get(2)?,
        task_id: row.get(3)?,
        session_type: row.get(4)?,
        start_time: row.get(5)?,
        end_time: row.get(6)?,
        duration_minutes: row.get(7)?,
        note: row.get(8)?,
        created_at: row.get(9)?,
    })
}

fn event_from_row(row: &Row<'_>) -> rusqlite::Result<CalendarEvent> {
    Ok(CalendarEvent {
        id: row.get(0)?,
        area_id: row.get(1)?,
        project_id: row.get(2)?,
        title: row.get(3)?,
        description: row.get(4)?,
        start_time: row.get(5)?,
        end_time: row.get(6)?,
        event_type: row.get(7)?,
        created_at: row.get(8)?,
    })
}

fn note_from_row(row: &Row<'_>) -> rusqlite::Result<Note> {
    Ok(Note {
        id: row.get(0)?,
        project_id: row.get(1)?,
        study_item_id: row.get(2)?,
        title: row.get(3)?,
        content: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

#[tauri::command]
fn list_areas(db: tauri::State<'_, Db>) -> CommandResult<Vec<Area>> {
    let conn = db.0.lock().map_err(db_error)?;
    let mut stmt = conn
        .prepare("SELECT id, name, color, created_at FROM areas ORDER BY id ASC")
        .map_err(db_error)?;
    let rows = stmt
        .query_map([], area_from_row)
        .map_err(db_error)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(db_error)?;
    Ok(rows)
}

#[tauri::command]
fn create_area(db: tauri::State<'_, Db>, name: String, color: String) -> CommandResult<Area> {
    let conn = db.0.lock().map_err(db_error)?;
    let timestamp = now();
    conn.execute(
        "INSERT INTO areas (name, color, created_at) VALUES (?1, ?2, ?3)",
        params![name.trim(), color, timestamp],
    )
    .map_err(db_error)?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, name, color, created_at FROM areas WHERE id = ?1",
        params![id],
        area_from_row,
    )
    .map_err(db_error)
}

#[tauri::command]
fn update_area(db: tauri::State<'_, Db>, id: i64, name: String, color: String) -> CommandResult<Area> {
    let conn = db.0.lock().map_err(db_error)?;
    conn.execute(
        "UPDATE areas SET name = ?1, color = ?2 WHERE id = ?3",
        params![name.trim(), color, id],
    )
    .map_err(db_error)?;
    conn.query_row(
        "SELECT id, name, color, created_at FROM areas WHERE id = ?1",
        params![id],
        area_from_row,
    )
    .map_err(db_error)
}

#[tauri::command]
fn delete_area(db: tauri::State<'_, Db>, id: i64) -> CommandResult<()> {
    db.0.lock()
        .map_err(db_error)?
        .execute("DELETE FROM areas WHERE id = ?1", params![id])
        .map_err(db_error)?;
    Ok(())
}

#[tauri::command]
fn list_projects(db: tauri::State<'_, Db>) -> CommandResult<Vec<Project>> {
    let conn = db.0.lock().map_err(db_error)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, area_id, name, description, status, created_at, updated_at
             FROM projects ORDER BY status ASC, name ASC",
        )
        .map_err(db_error)?;
    let rows = stmt
        .query_map([], project_from_row)
        .map_err(db_error)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(db_error)?;
    Ok(rows)
}

#[tauri::command]
fn create_project(
    db: tauri::State<'_, Db>,
    area_id: i64,
    name: String,
    description: Option<String>,
    status: Option<String>,
) -> CommandResult<Project> {
    let conn = db.0.lock().map_err(db_error)?;
    let timestamp = now();
    conn.execute(
        "INSERT INTO projects (area_id, name, description, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        params![area_id, name.trim(), description, status.unwrap_or_else(|| "active".into()), timestamp],
    )
    .map_err(db_error)?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, area_id, name, description, status, created_at, updated_at FROM projects WHERE id = ?1",
        params![id],
        project_from_row,
    )
    .map_err(db_error)
}

#[tauri::command]
fn update_project(
    db: tauri::State<'_, Db>,
    id: i64,
    area_id: i64,
    name: String,
    description: Option<String>,
    status: String,
) -> CommandResult<Project> {
    let conn = db.0.lock().map_err(db_error)?;
    conn.execute(
        "UPDATE projects SET area_id = ?1, name = ?2, description = ?3, status = ?4, updated_at = ?5 WHERE id = ?6",
        params![area_id, name.trim(), description, status, now(), id],
    )
    .map_err(db_error)?;
    conn.query_row(
        "SELECT id, area_id, name, description, status, created_at, updated_at FROM projects WHERE id = ?1",
        params![id],
        project_from_row,
    )
    .map_err(db_error)
}

#[tauri::command]
fn delete_project(db: tauri::State<'_, Db>, id: i64) -> CommandResult<()> {
    db.0.lock()
        .map_err(db_error)?
        .execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(db_error)?;
    Ok(())
}

#[tauri::command]
fn list_tasks(db: tauri::State<'_, Db>) -> CommandResult<Vec<Task>> {
    let conn = db.0.lock().map_err(db_error)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, area_id, project_id, title, description, status, priority, energy,
                    scheduled_date, due_date, completed_at, sort_order, created_at, updated_at
             FROM tasks ORDER BY scheduled_date IS NULL, scheduled_date ASC, sort_order ASC, id DESC",
        )
        .map_err(db_error)?;
    let rows = stmt
        .query_map([], task_from_row)
        .map_err(db_error)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(db_error)?;
    Ok(rows)
}

#[tauri::command]
fn create_task(db: tauri::State<'_, Db>, input: TaskInput) -> CommandResult<Task> {
    let conn = db.0.lock().map_err(db_error)?;
    let timestamp = now();
    let next_order: i64 = conn
        .query_row("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tasks", [], |row| row.get(0))
        .map_err(db_error)?;
    conn.execute(
        "INSERT INTO tasks
         (area_id, project_id, title, description, status, priority, energy, scheduled_date, due_date, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)",
        params![
            input.area_id,
            input.project_id,
            input.title.trim(),
            input.description,
            input.status.unwrap_or_else(|| "todo".into()),
            input.priority.unwrap_or_else(|| "medium".into()),
            input.energy.unwrap_or_else(|| "medium".into()),
            input.scheduled_date,
            input.due_date,
            next_order,
            timestamp
        ],
    )
    .map_err(db_error)?;
    get_task(&conn, conn.last_insert_rowid())
}

#[tauri::command]
fn update_task(db: tauri::State<'_, Db>, id: i64, input: TaskInput) -> CommandResult<Task> {
    let conn = db.0.lock().map_err(db_error)?;
    let completed_at = if input.status.as_deref() == Some("done") {
        conn.query_row("SELECT completed_at FROM tasks WHERE id = ?1", params![id], |row| row.get::<_, Option<String>>(0))
            .optional()
            .map_err(db_error)?
            .flatten()
            .or_else(|| Some(now()))
    } else {
        None
    };

    conn.execute(
        "UPDATE tasks
         SET area_id = ?1, project_id = ?2, title = ?3, description = ?4, status = ?5,
             priority = ?6, energy = ?7, scheduled_date = ?8, due_date = ?9, completed_at = ?10, updated_at = ?11
         WHERE id = ?12",
        params![
            input.area_id,
            input.project_id,
            input.title.trim(),
            input.description,
            input.status.unwrap_or_else(|| "todo".into()),
            input.priority.unwrap_or_else(|| "medium".into()),
            input.energy.unwrap_or_else(|| "medium".into()),
            input.scheduled_date,
            input.due_date,
            completed_at,
            now(),
            id
        ],
    )
    .map_err(db_error)?;
    get_task(&conn, id)
}

#[tauri::command]
fn delete_task(db: tauri::State<'_, Db>, id: i64) -> CommandResult<()> {
    db.0.lock()
        .map_err(db_error)?
        .execute("DELETE FROM tasks WHERE id = ?1", params![id])
        .map_err(db_error)?;
    Ok(())
}

#[tauri::command]
fn reorder_tasks(db: tauri::State<'_, Db>, ids: Vec<i64>) -> CommandResult<()> {
    let mut conn = db.0.lock().map_err(db_error)?;
    let tx = conn.transaction().map_err(db_error)?;
    for (index, id) in ids.iter().enumerate() {
        tx.execute(
            "UPDATE tasks SET sort_order = ?1, updated_at = ?2 WHERE id = ?3",
            params![index as i64, now(), id],
        )
        .map_err(db_error)?;
    }
    tx.commit().map_err(db_error)?;
    Ok(())
}

fn get_task(conn: &Connection, id: i64) -> CommandResult<Task> {
    conn.query_row(
        "SELECT id, area_id, project_id, title, description, status, priority, energy,
                scheduled_date, due_date, completed_at, sort_order, created_at, updated_at
         FROM tasks WHERE id = ?1",
        params![id],
        task_from_row,
    )
    .map_err(db_error)
}

#[tauri::command]
fn list_study_items(db: tauri::State<'_, Db>) -> CommandResult<Vec<StudyItem>> {
    let conn = db.0.lock().map_err(db_error)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, title, item_type, status, planned_date, planned_week, due_date,
                    notes, sort_order, created_at, updated_at
             FROM study_items ORDER BY project_id ASC, planned_week IS NULL, planned_week ASC, sort_order ASC, id ASC",
        )
        .map_err(db_error)?;
    let rows = stmt
        .query_map([], study_item_from_row)
        .map_err(db_error)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(db_error)?;
    Ok(rows)
}

#[tauri::command]
fn create_study_item(db: tauri::State<'_, Db>, input: StudyItemInput) -> CommandResult<StudyItem> {
    let conn = db.0.lock().map_err(db_error)?;
    let timestamp = now();
    let next_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM study_items WHERE project_id = ?1",
            params![input.project_id],
            |row| row.get(0),
        )
        .map_err(db_error)?;
    conn.execute(
        "INSERT INTO study_items
         (project_id, title, item_type, status, planned_date, planned_week, due_date, notes, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)",
        params![
            input.project_id,
            input.title.trim(),
            input.item_type.unwrap_or_else(|| "topic".into()),
            input.status.unwrap_or_else(|| "not_started".into()),
            input.planned_date,
            input.planned_week,
            input.due_date,
            input.notes,
            next_order,
            timestamp
        ],
    )
    .map_err(db_error)?;
    get_study_item(&conn, conn.last_insert_rowid())
}

#[tauri::command]
fn update_study_item(db: tauri::State<'_, Db>, id: i64, input: StudyItemInput) -> CommandResult<StudyItem> {
    let conn = db.0.lock().map_err(db_error)?;
    conn.execute(
        "UPDATE study_items
         SET project_id = ?1, title = ?2, item_type = ?3, status = ?4, planned_date = ?5,
             planned_week = ?6, due_date = ?7, notes = ?8, updated_at = ?9
         WHERE id = ?10",
        params![
            input.project_id,
            input.title.trim(),
            input.item_type.unwrap_or_else(|| "topic".into()),
            input.status.unwrap_or_else(|| "not_started".into()),
            input.planned_date,
            input.planned_week,
            input.due_date,
            input.notes,
            now(),
            id
        ],
    )
    .map_err(db_error)?;
    get_study_item(&conn, id)
}

#[tauri::command]
fn delete_study_item(db: tauri::State<'_, Db>, id: i64) -> CommandResult<()> {
    db.0.lock()
        .map_err(db_error)?
        .execute("DELETE FROM study_items WHERE id = ?1", params![id])
        .map_err(db_error)?;
    Ok(())
}

#[tauri::command]
fn reorder_study_items(db: tauri::State<'_, Db>, ids: Vec<i64>) -> CommandResult<()> {
    let mut conn = db.0.lock().map_err(db_error)?;
    let tx = conn.transaction().map_err(db_error)?;
    for (index, id) in ids.iter().enumerate() {
        tx.execute(
            "UPDATE study_items SET sort_order = ?1, updated_at = ?2 WHERE id = ?3",
            params![index as i64, now(), id],
        )
        .map_err(db_error)?;
    }
    tx.commit().map_err(db_error)?;
    Ok(())
}

fn get_study_item(conn: &Connection, id: i64) -> CommandResult<StudyItem> {
    conn.query_row(
        "SELECT id, project_id, title, item_type, status, planned_date, planned_week, due_date,
                notes, sort_order, created_at, updated_at
         FROM study_items WHERE id = ?1",
        params![id],
        study_item_from_row,
    )
    .map_err(db_error)
}

#[tauri::command]
fn list_sessions(db: tauri::State<'_, Db>) -> CommandResult<Vec<Session>> {
    let conn = db.0.lock().map_err(db_error)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, area_id, project_id, task_id, session_type, start_time, end_time,
                    duration_minutes, note, created_at
             FROM sessions ORDER BY start_time DESC",
        )
        .map_err(db_error)?;
    let rows = stmt
        .query_map([], session_from_row)
        .map_err(db_error)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(db_error)?;
    Ok(rows)
}

#[tauri::command]
fn create_session(db: tauri::State<'_, Db>, input: SessionInput) -> CommandResult<Session> {
    let conn = db.0.lock().map_err(db_error)?;
    let timestamp = now();
    conn.execute(
        "INSERT INTO sessions
         (area_id, project_id, task_id, session_type, start_time, end_time, duration_minutes, note, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            input.area_id,
            input.project_id,
            input.task_id,
            input.session_type.unwrap_or_else(|| "study".into()),
            input.start_time.unwrap_or_else(|| timestamp.clone()),
            input.end_time,
            input.duration_minutes.unwrap_or(0),
            input.note,
            timestamp
        ],
    )
    .map_err(db_error)?;
    get_session(&conn, conn.last_insert_rowid())
}

#[tauri::command]
fn finish_session(db: tauri::State<'_, Db>, id: i64, end_time: String, duration_minutes: i64, note: Option<String>) -> CommandResult<Session> {
    let conn = db.0.lock().map_err(db_error)?;
    conn.execute(
        "UPDATE sessions SET end_time = ?1, duration_minutes = ?2, note = ?3 WHERE id = ?4",
        params![end_time, duration_minutes, note, id],
    )
    .map_err(db_error)?;
    get_session(&conn, id)
}

#[tauri::command]
fn delete_session(db: tauri::State<'_, Db>, id: i64) -> CommandResult<()> {
    db.0.lock()
        .map_err(db_error)?
        .execute("DELETE FROM sessions WHERE id = ?1", params![id])
        .map_err(db_error)?;
    Ok(())
}

fn get_session(conn: &Connection, id: i64) -> CommandResult<Session> {
    conn.query_row(
        "SELECT id, area_id, project_id, task_id, session_type, start_time, end_time,
                duration_minutes, note, created_at
         FROM sessions WHERE id = ?1",
        params![id],
        session_from_row,
    )
    .map_err(db_error)
}

#[tauri::command]
fn list_calendar_events(db: tauri::State<'_, Db>) -> CommandResult<Vec<CalendarEvent>> {
    let conn = db.0.lock().map_err(db_error)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, area_id, project_id, title, description, start_time, end_time, event_type, created_at
             FROM calendar_events ORDER BY start_time ASC",
        )
        .map_err(db_error)?;
    let rows = stmt
        .query_map([], event_from_row)
        .map_err(db_error)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(db_error)?;
    Ok(rows)
}

#[tauri::command]
fn create_calendar_event(db: tauri::State<'_, Db>, input: CalendarEventInput) -> CommandResult<CalendarEvent> {
    let conn = db.0.lock().map_err(db_error)?;
    conn.execute(
        "INSERT INTO calendar_events
         (area_id, project_id, title, description, start_time, end_time, event_type, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            input.area_id,
            input.project_id,
            input.title.trim(),
            input.description,
            input.start_time,
            input.end_time,
            input.event_type.unwrap_or_else(|| "reminder".into()),
            now()
        ],
    )
    .map_err(db_error)?;
    get_event(&conn, conn.last_insert_rowid())
}

#[tauri::command]
fn update_calendar_event(db: tauri::State<'_, Db>, id: i64, input: CalendarEventInput) -> CommandResult<CalendarEvent> {
    let conn = db.0.lock().map_err(db_error)?;
    conn.execute(
        "UPDATE calendar_events
         SET area_id = ?1, project_id = ?2, title = ?3, description = ?4, start_time = ?5, end_time = ?6, event_type = ?7
         WHERE id = ?8",
        params![
            input.area_id,
            input.project_id,
            input.title.trim(),
            input.description,
            input.start_time,
            input.end_time,
            input.event_type.unwrap_or_else(|| "reminder".into()),
            id
        ],
    )
    .map_err(db_error)?;
    get_event(&conn, id)
}

#[tauri::command]
fn delete_calendar_event(db: tauri::State<'_, Db>, id: i64) -> CommandResult<()> {
    db.0.lock()
        .map_err(db_error)?
        .execute("DELETE FROM calendar_events WHERE id = ?1", params![id])
        .map_err(db_error)?;
    Ok(())
}

fn get_event(conn: &Connection, id: i64) -> CommandResult<CalendarEvent> {
    conn.query_row(
        "SELECT id, area_id, project_id, title, description, start_time, end_time, event_type, created_at
         FROM calendar_events WHERE id = ?1",
        params![id],
        event_from_row,
    )
    .map_err(db_error)
}

#[tauri::command]
fn list_notes(db: tauri::State<'_, Db>) -> CommandResult<Vec<Note>> {
    let conn = db.0.lock().map_err(db_error)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, study_item_id, title, content, created_at, updated_at
             FROM notes ORDER BY updated_at DESC",
        )
        .map_err(db_error)?;
    let rows = stmt
        .query_map([], note_from_row)
        .map_err(db_error)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(db_error)?;
    Ok(rows)
}

#[tauri::command]
fn create_note(db: tauri::State<'_, Db>, input: NoteInput) -> CommandResult<Note> {
    let conn = db.0.lock().map_err(db_error)?;
    let timestamp = now();
    conn.execute(
        "INSERT INTO notes (project_id, study_item_id, title, content, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        params![input.project_id, input.study_item_id, input.title.trim(), input.content, timestamp],
    )
    .map_err(db_error)?;
    get_note(&conn, conn.last_insert_rowid())
}

#[tauri::command]
fn update_note(db: tauri::State<'_, Db>, id: i64, input: NoteInput) -> CommandResult<Note> {
    let conn = db.0.lock().map_err(db_error)?;
    conn.execute(
        "UPDATE notes SET project_id = ?1, study_item_id = ?2, title = ?3, content = ?4, updated_at = ?5 WHERE id = ?6",
        params![input.project_id, input.study_item_id, input.title.trim(), input.content, now(), id],
    )
    .map_err(db_error)?;
    get_note(&conn, id)
}

#[tauri::command]
fn delete_note(db: tauri::State<'_, Db>, id: i64) -> CommandResult<()> {
    db.0.lock()
        .map_err(db_error)?
        .execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(db_error)?;
    Ok(())
}

fn get_note(conn: &Connection, id: i64) -> CommandResult<Note> {
    conn.query_row(
        "SELECT id, project_id, study_item_id, title, content, created_at, updated_at FROM notes WHERE id = ?1",
        params![id],
        note_from_row,
    )
    .map_err(db_error)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&data_dir)?;
            let db_path = data_dir.join("study-tracker.sqlite3");
            let conn = Connection::open(db_path)?;
            migrate(&conn)?;
            app.manage(Db(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_areas,
            create_area,
            update_area,
            delete_area,
            list_projects,
            create_project,
            update_project,
            delete_project,
            list_tasks,
            create_task,
            update_task,
            delete_task,
            reorder_tasks,
            list_study_items,
            create_study_item,
            update_study_item,
            delete_study_item,
            reorder_study_items,
            list_sessions,
            create_session,
            finish_session,
            delete_session,
            list_calendar_events,
            create_calendar_event,
            update_calendar_event,
            delete_calendar_event,
            list_notes,
            create_note,
            update_note,
            delete_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running Study Tracker");
}
