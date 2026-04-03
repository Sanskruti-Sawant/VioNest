import { User, Expense, Task } from './types';

export const MOCK_USERS: User[] = [
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
  }
];

export const CURRENT_USER_ID = 'u1';

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1',
    title: 'Groceries & Essentials',
    amount: 2400,
    category: 'Food',
    paidBy: 'u1',
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
    splitWith: ['u1', 'u2', 'u3', 'u4'],
    splitType: 'Equal',
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
  },
  {
    id: 'e4',
    title: 'Whole Foods Market',
    amount: 245.80,
    category: 'Food',
    paidBy: 'u4',
    date: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    splitWith: ['u1', 'u4'],
    splitType: 'Equal',
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Deep clean the kitchen',
    category: 'Cleaning',
    assignedTo: 'u1',
    status: 'Pending',
    dueDate: new Date().toISOString(),
  },
  {
    id: 't2',
    title: 'Restock herbal teas',
    category: 'Groceries',
    assignedTo: 'u2',
    status: 'Completed',
    dueDate: new Date().toISOString(),
    completedBy: 'u2',
    completedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 't3',
    title: 'Vacuum the living area',
    category: 'Cleaning',
    assignedTo: 'u3',
    status: 'Pending',
    dueDate: new Date(Date.now() + 24 * 3600000).toISOString(),
  }
];
