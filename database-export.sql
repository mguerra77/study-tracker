PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#8fae88',
            created_at TEXT NOT NULL
        );
INSERT INTO areas VALUES(1,'Facultad','#87a9c8','2026-05-11T23:06:47.143949275+00:00');
INSERT INTO areas VALUES(2,'Trabajo','#d59a6f','2026-05-11T23:06:47.143949275+00:00');
INSERT INTO areas VALUES(3,'Personal','#8fae88','2026-05-11T23:06:47.143949275+00:00');
CREATE TABLE projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
INSERT INTO projects VALUES(1,1,'Ciencia de Datos',NULL,'active','2026-05-11T23:19:04.258264310+00:00','2026-05-11T23:19:04.258264310+00:00');
INSERT INTO projects VALUES(2,1,'Lenguajes y Compiladores',NULL,'active','2026-05-12T23:52:04.422453809+00:00','2026-05-12T23:52:04.422453809+00:00');
CREATE TABLE tasks (
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
INSERT INTO tasks VALUES(1,1,2,'Entender TP Lox',NULL,'done','medium','medium','2026-05-12',NULL,'2026-05-13T01:28:42.749341323+00:00',1,'2026-05-12T23:52:44.441333633+00:00','2026-05-13T01:28:42.749354507+00:00');
INSERT INTO tasks VALUES(2,1,NULL,'Terminal con fixes de emails de requerimientos',NULL,'done','medium','medium','2026-05-12',NULL,'2026-05-13T02:25:46.423887960+00:00',2,'2026-05-13T01:30:08.708096924+00:00','2026-05-13T02:25:46.423897147+00:00');
CREATE TABLE study_items (
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
INSERT INTO study_items VALUES(1,1,'Métricas de Clasificación','topic','in_progress','2026-05-14',NULL,NULL,NULL,1,'2026-05-11T23:19:46.015315753+00:00','2026-05-11T23:20:23.611621950+00:00');
INSERT INTO study_items VALUES(2,1,'Ingeniería de features','topic','not_started','2026-05-15',NULL,NULL,NULL,2,'2026-05-11T23:23:00.445502760+00:00','2026-05-11T23:23:00.445502760+00:00');
CREATE TABLE sessions (
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
INSERT INTO sessions VALUES(1,1,2,1,'study','2026-05-13T00:01:06.543Z','2026-05-13T01:01:12.069Z',60,NULL,'2026-05-13T00:01:06.545418311+00:00');
INSERT INTO sessions VALUES(2,1,NULL,2,'study','2026-05-13T01:30:23.244Z','2026-05-13T02:25:42.511Z',55,NULL,'2026-05-13T01:30:23.245509912+00:00');
CREATE TABLE calendar_events (
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
CREATE TABLE notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
            study_item_id INTEGER REFERENCES study_items(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('areas',3);
INSERT INTO sqlite_sequence VALUES('projects',3);
INSERT INTO sqlite_sequence VALUES('study_items',2);
INSERT INTO sqlite_sequence VALUES('tasks',2);
INSERT INTO sqlite_sequence VALUES('sessions',2);
COMMIT;
