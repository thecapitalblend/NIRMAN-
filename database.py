import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "balaji.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS owners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner_id INTEGER,
        address TEXT,
        plot_size TEXT,
        facing TEXT,
        contract_amount REAL DEFAULT 0,
        start_date TEXT,
        expected_end_date TEXT,
        status TEXT DEFAULT 'Active',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_id) REFERENCES owners(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        skill TEXT,
        daily_rate REAL DEFAULT 0,
        overtime_rate REAL DEFAULT 0,
        joining_date TEXT,
        active INTEGER DEFAULT 1,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL,
        site_id INTEGER NOT NULL,
        attendance_date TEXT NOT NULL,
        status TEXT NOT NULL,
        overtime_hours REAL DEFAULT 0,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(worker_id, site_id, attendance_date),
        FOREIGN KEY(worker_id) REFERENCES workers(id) ON DELETE CASCADE,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS worker_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL,
        site_id INTEGER,
        transaction_date TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(worker_id) REFERENCES workers(id) ON DELETE CASCADE,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS owner_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        site_id INTEGER,
        transaction_date TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_id) REFERENCES owners(id) ON DELETE CASCADE,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER NOT NULL,
        expense_date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        paid_to TEXT,
        payment_mode TEXT,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
    );
    """)
    conn.commit()
    conn.close()

def query(sql, params=()):
    conn = get_connection()
    cur = conn.execute(sql, params)
    rows = cur.fetchall()
    conn.close()
    return rows

def execute(sql, params=()):
    conn = get_connection()
    cur = conn.execute(sql, params)
    conn.commit()
    last_id = cur.lastrowid
    conn.close()
    return last_id
