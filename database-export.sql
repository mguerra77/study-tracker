PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#8fae88',
            created_at TEXT NOT NULL
        );
INSERT INTO "areas" VALUES(1,'Facultad','#87a9c8','2026-05-11T16:57:52.786684074+00:00');
INSERT INTO "areas" VALUES(2,'Trabajo','#d59a6f','2026-05-11T16:57:52.786684074+00:00');
INSERT INTO "areas" VALUES(3,'Personal','#8fae88','2026-05-11T16:57:52.786684074+00:00');
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
INSERT INTO "calendar_events" VALUES(2,1,NULL,'Exposición TP Datos',NULL,'2026-05-14T09:00',NULL,'deadline','2026-05-13T15:17:39.166898159+00:00');
INSERT INTO "calendar_events" VALUES(3,1,NULL,'TP2 Datos',NULL,'2026-06-23T09:00',NULL,'deadline','2026-05-13T15:18:34.359504244+00:00');
INSERT INTO "calendar_events" VALUES(4,1,NULL,'Charla ETB I',NULL,'2026-06-01T09:00',NULL,'class','2026-05-13T15:19:17.008371670+00:00');
INSERT INTO "calendar_events" VALUES(5,1,NULL,'Charla EBT I',NULL,'2026-06-08T09:00',NULL,'class','2026-05-13T15:19:40.730741576+00:00');
INSERT INTO "calendar_events" VALUES(6,1,NULL,'Charla EBT I',NULL,'2026-06-10T09:00',NULL,'class','2026-05-13T15:20:00.583404223+00:00');
INSERT INTO "calendar_events" VALUES(7,1,NULL,'Parcial ETB I',NULL,'2026-06-24T09:00',NULL,'exam','2026-05-13T15:23:02.220495769+00:00');
INSERT INTO "calendar_events" VALUES(8,1,NULL,'TP Concurrente',NULL,'2026-05-27T09:00',NULL,'deadline','2026-05-13T15:24:28.555950972+00:00');
INSERT INTO "calendar_events" VALUES(9,1,NULL,'TP Concurrente',NULL,'2026-06-16T09:00',NULL,'deadline','2026-05-13T15:25:11.613451382+00:00');
INSERT INTO "calendar_events" VALUES(10,1,NULL,'Parcial Redes',NULL,'2026-05-29T09:00',NULL,'exam','2026-05-13T15:25:39.334101157+00:00');
INSERT INTO "calendar_events" VALUES(11,1,NULL,'TP Lenguajes y Compiladores',NULL,'2026-05-25T09:00',NULL,'deadline','2026-05-13T15:28:28.417322237+00:00');
INSERT INTO "calendar_events" VALUES(12,1,NULL,'Recuperatorio EBT I',NULL,'2026-06-03T09:00',NULL,'exam','2026-05-18T20:12:44.172755444+00:00');
CREATE TABLE notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
            study_item_id INTEGER REFERENCES study_items(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
CREATE TABLE projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
INSERT INTO "projects" VALUES(1,1,'Programacion Concurrente',NULL,'active','2026-05-11T16:59:04.547973361+00:00','2026-05-11T16:59:04.547973361+00:00');
INSERT INTO "projects" VALUES(2,1,'Ciencia de Datos',NULL,'active','2026-05-11T17:02:21.290019752+00:00','2026-05-11T17:02:21.290019752+00:00');
INSERT INTO "projects" VALUES(3,1,'Lenguajes y Compiladores',NULL,'active','2026-05-12T16:10:41.109306843+00:00','2026-05-12T16:10:41.109306843+00:00');
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
INSERT INTO "sessions" VALUES(1,1,3,2,'study','2026-05-12T16:11:16.232Z','2026-05-12T18:13:32.121Z',122,NULL,'2026-05-12T16:11:16.233686124+00:00');
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
INSERT INTO "study_items" VALUES(2,1,'Async','topic','in_progress','2026-06-30',NULL,NULL,NULL,0,'2026-05-11T17:14:07.860893003+00:00','2026-05-11T17:14:25.570764531+00:00');
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
INSERT INTO "tasks" VALUES(2,1,3,'TP Lenguajes y Compiladores',NULL,'doing','medium','medium','2026-05-12',NULL,NULL,2,'2026-05-12T16:11:04.463600674+00:00','2026-05-12T16:11:11.577741750+00:00');
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('areas',3);
INSERT INTO "sqlite_sequence" VALUES('projects',3);
INSERT INTO "sqlite_sequence" VALUES('study_items',2);
INSERT INTO "sqlite_sequence" VALUES('calendar_events',12);
INSERT INTO "sqlite_sequence" VALUES('tasks',2);
INSERT INTO "sqlite_sequence" VALUES('sessions',1);
COMMIT;
