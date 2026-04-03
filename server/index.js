import cors from 'cors';
import express from 'express';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const defaultDbPath = path.join(projectRoot, 'data', 'vionest.sqlite');
const dbPath = process.env.DATABASE_PATH || defaultDbPath;
const dataDir = path.dirname(dbPath);
const port = Number(process.env.PORT || 4000);

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeExpense(row) {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    category: row.category,
    paidBy: row.paid_by,
    date: row.date,
    splitWith: JSON.parse(row.split_with || '[]'),
    splitType: row.split_type,
    customSplits: row.custom_splits ? JSON.parse(row.custom_splits) : undefined,
    deductFromBudget: Boolean(row.deduct_from_budget),
  };
}

function normalizeTask(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    assignedTo: row.assigned_to,
    status: row.status,
    dueDate: row.due_date,
    completedBy: row.completed_by || undefined,
    completedAt: row.completed_at || undefined,
  };
}

async function bootstrapDatabase(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      paid_by TEXT NOT NULL,
      date TEXT NOT NULL,
      split_with TEXT NOT NULL,
      split_type TEXT NOT NULL,
      custom_splits TEXT,
      deduct_from_budget INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (paid_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      assigned_to TEXT NOT NULL,
      status TEXT NOT NULL,
      due_date TEXT NOT NULL,
      completed_by TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (completed_by) REFERENCES users(id)
    );
  `);

  const userCount = await db.get('SELECT COUNT(*) AS count FROM users');
  if (userCount?.count > 0) return;

  const seedUsers = [
    {
      id: 'u1',
      name: 'Alex',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      email: 'alex@example.com',
    },
    {
      id: 'u2',
      name: 'Maya',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
      email: 'maya@example.com',
    },
    {
      id: 'u3',
      name: 'Rohan',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan',
      email: 'rohan@example.com',
    },
    {
      id: 'u4',
      name: 'Aria Stark',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria',
      email: 'aria@example.com',
    },
  ];

  const seedExpenses = [
    {
      id: 'e1',
      title: 'Groceries & Essentials',
      amount: 2400,
      category: 'Food',
      paidBy: 'u1',
      date: new Date(Date.now() - 2 * 3600000).toISOString(),
      splitWith: ['u1', 'u2', 'u3', 'u4'],
      splitType: 'Equal',
      deductFromBudget: 1,
    },
    {
      id: 'e2',
      title: 'Electricity Bill',
      amount: 4120,
      category: 'Utilities',
      paidBy: 'u2',
      date: new Date(Date.now() - 24 * 3600000).toISOString(),
      splitWith: ['u1', 'u2', 'u3', 'u4'],
      splitType: 'Equal',
      deductFromBudget: 1,
    },
    {
      id: 'e3',
      title: 'Rent Payment',
      amount: 12000,
      category: 'Rent',
      paidBy: 'u1',
      date: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
      splitWith: ['u1', 'u2', 'u3', 'u4'],
      splitType: 'Equal',
      deductFromBudget: 0,
    },
  ];

  const seedTasks = [
    {
      id: 't1',
      title: 'Deep clean the kitchen',
      category: 'Cleaning',
      assignedTo: 'u1',
      status: 'Pending',
      dueDate: nowIso(),
    },
    {
      id: 't2',
      title: 'Restock herbal teas',
      category: 'Groceries',
      assignedTo: 'u2',
      status: 'Completed',
      dueDate: nowIso(),
      completedBy: 'u2',
      completedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
  ];

  for (const user of seedUsers) {
    await db.run(
      'INSERT INTO users (id, name, avatar, email, created_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.name, user.avatar, user.email, nowIso()],
    );
  }

  for (const expense of seedExpenses) {
    await db.run(
      `INSERT INTO expenses
       (id, title, amount, category, paid_by, date, split_with, split_type, custom_splits, deduct_from_budget, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.id,
        expense.title,
        expense.amount,
        expense.category,
        expense.paidBy,
        expense.date,
        JSON.stringify(expense.splitWith),
        expense.splitType,
        null,
        expense.deductFromBudget,
        nowIso(),
      ],
    );
  }

  for (const task of seedTasks) {
    await db.run(
      `INSERT INTO tasks
       (id, title, category, assigned_to, status, due_date, completed_by, completed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.category,
        task.assignedTo,
        task.status,
        task.dueDate,
        task.completedBy || null,
        task.completedAt || null,
        nowIso(),
      ],
    );
  }
}

async function createServer() {
  await mkdir(dataDir, { recursive: true });

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await bootstrapDatabase(db);

  const app = express();
  const frontendOrigin = process.env.FRONTEND_ORIGIN;
  app.use(cors(frontendOrigin ? { origin: frontendOrigin } : undefined));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: 'connected' });
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      let user = await db.get('SELECT id, name, avatar, email FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (!user) {
        const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
        const newUser = {
          id: createId('u'),
          name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          email,
        };

        await db.run(
          'INSERT INTO users (id, name, avatar, email, created_at) VALUES (?, ?, ?, ?, ?)',
          [newUser.id, newUser.name, newUser.avatar, newUser.email, nowIso()],
        );

        user = newUser;
      }

      return res.json({ user });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Failed to login.' });
    }
  });

  app.get('/api/users', async (_req, res) => {
    const users = await db.all('SELECT id, name, avatar, email FROM users ORDER BY created_at ASC');
    res.json({ users });
  });

  app.post('/api/users', async (req, res) => {
    try {
      const name = String(req.body?.name || '').trim();
      const emailInput = String(req.body?.email || '').trim().toLowerCase();
      const email = emailInput || `${name.toLowerCase().replace(/\s+/g, '.')}@home.local`;
      const avatar = String(req.body?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`);

      if (!name) {
        return res.status(400).json({ error: 'Name is required.' });
      }

      const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (existing) {
        return res.status(409).json({ error: 'A member with this email already exists.' });
      }

      const user = { id: createId('u'), name, email, avatar };
      await db.run(
        'INSERT INTO users (id, name, avatar, email, created_at) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.name, user.avatar, user.email, nowIso()],
      );

      res.status(201).json({ user });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user.' });
    }
  });

  app.get('/api/expenses', async (_req, res) => {
    const rows = await db.all('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
    res.json({ expenses: rows.map(normalizeExpense) });
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const expense = req.body || {};
      const id = createId('e');
      const record = {
        id,
        title: String(expense.title || '').trim(),
        amount: Number(expense.amount || 0),
        category: String(expense.category || 'Other'),
        paidBy: String(expense.paidBy || ''),
        date: String(expense.date || nowIso()),
        splitWith: Array.isArray(expense.splitWith) ? expense.splitWith : [],
        splitType: String(expense.splitType || 'Equal'),
        customSplits: expense.customSplits || null,
        deductFromBudget: expense.deductFromBudget ? 1 : 0,
      };

      if (!record.title || !record.paidBy || !record.amount) {
        return res.status(400).json({ error: 'Title, amount and payer are required.' });
      }

      await db.run(
        `INSERT INTO expenses
         (id, title, amount, category, paid_by, date, split_with, split_type, custom_splits, deduct_from_budget, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.title,
          record.amount,
          record.category,
          record.paidBy,
          record.date,
          JSON.stringify(record.splitWith),
          record.splitType,
          record.customSplits ? JSON.stringify(record.customSplits) : null,
          record.deductFromBudget,
          nowIso(),
        ],
      );

      res.status(201).json({
        expense: {
          id: record.id,
          title: record.title,
          amount: record.amount,
          category: record.category,
          paidBy: record.paidBy,
          date: record.date,
          splitWith: record.splitWith,
          splitType: record.splitType,
          customSplits: record.customSplits || undefined,
          deductFromBudget: Boolean(record.deductFromBudget),
        },
      });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'Failed to create expense.' });
    }
  });

  app.get('/api/tasks', async (_req, res) => {
    const rows = await db.all('SELECT * FROM tasks ORDER BY due_date DESC, created_at DESC');
    res.json({ tasks: rows.map(normalizeTask) });
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const task = req.body || {};
      const record = {
        id: createId('t'),
        title: String(task.title || '').trim(),
        category: String(task.category || 'Other'),
        assignedTo: String(task.assignedTo || ''),
        status: String(task.status || 'Pending'),
        dueDate: String(task.dueDate || nowIso()),
      };

      if (!record.title || !record.assignedTo) {
        return res.status(400).json({ error: 'Title and assignee are required.' });
      }

      await db.run(
        `INSERT INTO tasks
         (id, title, category, assigned_to, status, due_date, completed_by, completed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.title,
          record.category,
          record.assignedTo,
          record.status,
          record.dueDate,
          null,
          null,
          nowIso(),
        ],
      );

      res.status(201).json({
        task: {
          id: record.id,
          title: record.title,
          category: record.category,
          assignedTo: record.assignedTo,
          status: record.status,
          dueDate: record.dueDate,
        },
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Failed to create task.' });
    }
  });

  app.patch('/api/tasks/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = String(req.body?.userId || '');
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);

      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      const completedBy = nextStatus === 'Completed' ? userId || task.assigned_to : null;
      const completedAt = nextStatus === 'Completed' ? nowIso() : null;

      await db.run(
        'UPDATE tasks SET status = ?, completed_by = ?, completed_at = ? WHERE id = ?',
        [nextStatus, completedBy, completedAt, id],
      );

      const updated = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      return res.json({ task: normalizeTask(updated) });
    } catch (error) {
      console.error('Toggle task error:', error);
      return res.status(500).json({ error: 'Failed to update task.' });
    }
  });

  app.post('/api/generate', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    try {
      const prompt = String(req.body?.prompt || '').trim();
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      return res.json({ text: result.text || '' });
    } catch (error) {
      console.error('Generate error:', error);
      return res.status(500).json({ error: 'Failed to generate AI response.' });
    }
  });

  app.listen(port, () => {
    console.log(`VioNest backend running on http://localhost:${port}`);
    console.log(`SQLite database: ${dbPath}`);
  });
}

createServer().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
