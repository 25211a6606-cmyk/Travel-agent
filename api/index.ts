import express from "express";
import Database from "better-sqlite3";
import path from "path";

const app = express();
app.use(express.json());

// NOTE: In a real Vercel deployment, SQLite will NOT persist data.
// You should replace this with a connection to Vercel Postgres or Supabase.
const db = new Database("/tmp/expense.db");

// Initialize database (Same schema as server.ts)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee'
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    merchant TEXT NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    type TEXT NOT NULL DEFAULT 'general',
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

// Seed initial users if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run("Default Employee", "employee@gmail.com", "password123", "employee");
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run("Default Manager", "manager@gmail.com", "password123", "manager");
}

// API Routes (Copy of server.ts logic)
app.post("/api/signup", (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, password, role);
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(result.lastInsertRowid);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: "Email already exists or invalid data" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?").get(email, password);
  if (user) res.json(user);
  else res.status(401).json({ error: "Invalid credentials" });
});

app.get("/api/users", (req, res) => {
  const { email } = req.query;
  if (email) {
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE email = ?").get(email);
    if (user) return res.json(user);
    else return res.status(404).json({ error: "User not found" });
  }
  const users = db.prepare("SELECT id, name, email, role FROM users").all();
  res.json(users);
});

app.get("/api/expenses", (req, res) => {
  const { userId, role } = req.query;
  let expenses;
  if (role === 'manager') {
    expenses = db.prepare("SELECT e.*, u.name as userName FROM expenses e JOIN users u ON e.userId = u.id ORDER BY e.date DESC").all();
  } else {
    expenses = db.prepare("SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC").all(userId);
  }
  res.json(expenses);
});

app.post("/api/expenses", (req, res) => {
  const { userId, merchant, date, amount, category, description, type } = req.body;
  const result = db.prepare("INSERT INTO expenses (userId, merchant, date, amount, category, description, type) VALUES (?, ?, ?, ?, ?, ?, ?)").run(userId, merchant, date, amount, category, description, type || 'general');
  
  const managers = db.prepare("SELECT id FROM users WHERE role = 'manager'").all() as { id: number }[];
  const employee = db.prepare("SELECT name FROM users WHERE id = ?").get(userId) as { name: string };
  const insertNotif = db.prepare("INSERT INTO notifications (userId, message, type) VALUES (?, ?, ?)");
  managers.forEach(m => insertNotif.run(m.id, `New expense from ${employee.name}: ₹${amount}`, 'request'));
  
  res.json({ id: result.lastInsertRowid });
});

app.patch("/api/expenses/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare("UPDATE expenses SET status = ? WHERE id = ?").run(status, id);
  const expense = db.prepare("SELECT userId, merchant, amount FROM expenses WHERE id = ?").get(id) as { userId: number, merchant: string, amount: number };
  db.prepare("INSERT INTO notifications (userId, message, type) VALUES (?, ?, ?)")
    .run(expense.userId, `Expense for ${expense.merchant} (₹${expense.amount}) ${status}.`, 'approval');
  res.json({ success: true });
});

app.get("/api/notifications", (req, res) => {
  const { userId } = req.query;
  const notifications = db.prepare("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 10").all(userId);
  res.json(notifications);
});

app.patch("/api/notifications/read", (req, res) => {
  const { userId } = req.body;
  db.prepare("UPDATE notifications SET isRead = 1 WHERE userId = ?").run(userId);
  res.json({ success: true });
});

app.get("/api/stats", (req, res) => {
  const { userId, role } = req.query;
  let stats;
  if (role === 'manager') {
    stats = db.prepare("SELECT SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pendingAmount, SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approvedAmount, COUNT(*) as totalCount FROM expenses").get();
  } else {
    stats = db.prepare("SELECT SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pendingAmount, SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approvedAmount, COUNT(*) as totalCount FROM expenses WHERE userId = ?").get(userId);
  }
  res.json(stats);
});

export default app;
