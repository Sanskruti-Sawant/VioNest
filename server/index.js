import cors from 'cors';
import express from 'express';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const defaultDbPath = path.join(projectRoot, 'data', 'vionest.json');
const dbPath = process.env.DATABASE_PATH || defaultDbPath;
const dataDir = path.dirname(dbPath);
const port = Number(process.env.PORT || 4000);

const defaultData = {
  users: [],
  expenses: [],
  tasks: [],
};

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeExpense(expense) {
  return {
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    paidBy: expense.paidBy,
    date: expense.date,
    splitWith: expense.splitWith || [],
    splitType: expense.splitType,
    customSplits: expense.customSplits,
    deductFromBudget: Boolean(expense.deductFromBudget),
  };
}

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    assignedTo: task.assignedTo,
    status: task.status,
    dueDate: task.dueDate,
    completedBy: task.completedBy,
    completedAt: task.completedAt,
  };
}

function ensureSeedData(data) {
  if (data.users.length > 0) return data;

  const seedUsers = [
    { id: 'u1', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', email: 'alex@example.com' },
    { id: 'u2', name: 'Maya', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya', email: 'maya@example.com' },
    { id: 'u3', name: 'Rohan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan', email: 'rohan@example.com' },
    { id: 'u4', name: 'Aria Stark', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria', email: 'aria@example.com' },
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
      deductFromBudget: true,
      createdAt: nowIso(),
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
      deductFromBudget: true,
      createdAt: nowIso(),
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
      deductFromBudget: false,
      createdAt: nowIso(),
    },
  ];

  const seedTasks = [
    { id: 't1', title: 'Deep clean the kitchen', category: 'Cleaning', assignedTo: 'u1', status: 'Pending', dueDate: nowIso(), createdAt: nowIso() },
    { id: 't2', title: 'Restock herbal teas', category: 'Groceries', assignedTo: 'u2', status: 'Completed', dueDate: nowIso(), completedBy: 'u2', completedAt: new Date(Date.now() - 5 * 3600000).toISOString(), createdAt: nowIso() },
  ];

  return {
    users: seedUsers,
    expenses: seedExpenses,
    tasks: seedTasks,
  };
}

async function createServer() {
  await mkdir(dataDir, { recursive: true });

  const adapter = new JSONFile(dbPath);
  const db = new Low(adapter, defaultData);
  await db.read();
  db.data = ensureSeedData(db.data || defaultData);
  await db.write();

  const app = express();
  const frontendOrigin = process.env.FRONTEND_ORIGIN;
  app.use(cors(frontendOrigin ? { origin: frontendOrigin } : undefined));
  app.use(express.json({ limit: '1mb' }));

  const persist = async () => {
    await db.write();
  };

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: 'connected' });
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      let user = db.data.users.find((entry) => entry.email.toLowerCase() === email);
      if (!user) {
        const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
        user = {
          id: createId('u'),
          name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          email,
        };
        db.data.users.push(user);
        await persist();
      }

      return res.json({ user });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Failed to login.' });
    }
  });

  app.get('/api/users', async (_req, res) => {
    res.json({ users: [...db.data.users] });
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

      const existing = db.data.users.find((entry) => entry.email.toLowerCase() === email);
      if (existing) {
        return res.status(409).json({ error: 'A member with this email already exists.' });
      }

      const user = { id: createId('u'), name, email, avatar };
      db.data.users.push(user);
      await persist();

      return res.status(201).json({ user });
    } catch (error) {
      console.error('Create user error:', error);
      return res.status(500).json({ error: 'Failed to create user.' });
    }
  });

  app.get('/api/expenses', async (_req, res) => {
    const expenses = [...db.data.expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(normalizeExpense);
    res.json({ expenses });
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const expense = req.body || {};
      const record = {
        id: createId('e'),
        title: String(expense.title || '').trim(),
        amount: Number(expense.amount || 0),
        category: String(expense.category || 'Other'),
        paidBy: String(expense.paidBy || ''),
        date: String(expense.date || nowIso()),
        splitWith: Array.isArray(expense.splitWith) ? expense.splitWith : [],
        splitType: String(expense.splitType || 'Equal'),
        customSplits: expense.customSplits || undefined,
        deductFromBudget: Boolean(expense.deductFromBudget),
        createdAt: nowIso(),
      };

      if (!record.title || !record.paidBy || !record.amount) {
        return res.status(400).json({ error: 'Title, amount and payer are required.' });
      }

      db.data.expenses.unshift(record);
      await persist();

      return res.status(201).json({ expense: normalizeExpense(record) });
    } catch (error) {
      console.error('Create expense error:', error);
      return res.status(500).json({ error: 'Failed to create expense.' });
    }
  });

  app.get('/api/tasks', async (_req, res) => {
    const tasks = [...db.data.tasks]
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(normalizeTask);
    res.json({ tasks });
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
        completedBy: undefined,
        completedAt: undefined,
        createdAt: nowIso(),
      };

      if (!record.title || !record.assignedTo) {
        return res.status(400).json({ error: 'Title and assignee are required.' });
      }

      db.data.tasks.unshift(record);
      await persist();

      return res.status(201).json({ task: normalizeTask(record) });
    } catch (error) {
      console.error('Create task error:', error);
      return res.status(500).json({ error: 'Failed to create task.' });
    }
  });

  app.patch('/api/tasks/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = String(req.body?.userId || '');
      const task = db.data.tasks.find((entry) => entry.id === id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      task.status = nextStatus;
      task.completedBy = nextStatus === 'Completed' ? userId || task.assignedTo : undefined;
      task.completedAt = nextStatus === 'Completed' ? nowIso() : undefined;

      await persist();
      return res.json({ task: normalizeTask(task) });
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
    console.log(`JSON database: ${dbPath}`);
  });
}

createServer().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
