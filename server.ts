import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("expense.db");

// Initialize database
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
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run("John Manager", "john.manager@gmail.com", "password123", "manager");
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run("Jane Employee", "jane.employee@gmail.com", "password123", "employee");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/signup", (req, res) => {
    const { name, email, password, role } = req.body;
    
    // Server-side validation
    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({ error: "Email must end with @gmail.com" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    try {
      const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, password, role);
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(result.lastInsertRowid);
      res.json(user);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.get("/api/expenses", (req, res) => {
    const { userId, role } = req.query;
    let expenses;
    if (role === 'manager') {
      // Managers see all pending expenses or all expenses? 
      // Let's say they see all for now, but usually they see their team's.
      // For this demo, they see all.
      expenses = db.prepare(`
        SELECT e.*, u.name as userName 
        FROM expenses e 
        JOIN users u ON e.userId = u.id
        ORDER BY e.date DESC
      `).all();
    } else {
      expenses = db.prepare("SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC").all(userId);
    }
    res.json(expenses);
  });

  app.post("/api/expenses", (req, res) => {
    const { userId, merchant, date, amount, category, description, type } = req.body;
    const result = db.prepare(`
      INSERT INTO expenses (userId, merchant, date, amount, category, description, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, merchant, date, amount, category, description, type || 'general');
    
    // Notify all managers
    const managers = db.prepare("SELECT id FROM users WHERE role = 'manager'").all() as { id: number }[];
    const employee = db.prepare("SELECT name FROM users WHERE id = ?").get(userId) as { name: string };
    
    const insertNotif = db.prepare("INSERT INTO notifications (userId, message, type) VALUES (?, ?, ?)");
    managers.forEach(manager => {
      insertNotif.run(manager.id, `New expense request from ${employee.name}: ₹${amount} for ${merchant}`, 'request');
    });

    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/expenses/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE expenses SET status = ? WHERE id = ?").run(status, id);
    
    // Notify the employee
    const expense = db.prepare("SELECT userId, merchant, amount FROM expenses WHERE id = ?").get(id) as { userId: number, merchant: string, amount: number };
    db.prepare("INSERT INTO notifications (userId, message, type) VALUES (?, ?, ?)")
      .run(expense.userId, `Your expense for ${expense.merchant} (₹${expense.amount}) has been ${status}.`, 'approval');

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
      stats = db.prepare(`
        SELECT 
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pendingAmount,
          SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approvedAmount,
          COUNT(*) as totalCount
        FROM expenses
      `).get();
    } else {
      stats = db.prepare(`
        SELECT 
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pendingAmount,
          SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approvedAmount,
          COUNT(*) as totalCount
        FROM expenses
        WHERE userId = ?
      `).get(userId);
    }
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
