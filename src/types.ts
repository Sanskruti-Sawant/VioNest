export type Category = 'Food' | 'Utilities' | 'Rent' | 'Leisure' | 'Other';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  paidBy: string; // User ID
  date: string;
  splitWith: string[]; // User IDs
  splitType: 'Equal' | 'Custom';
  customSplits?: Record<string, number>; // User ID -> Amount
  deductFromBudget?: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: 'Cleaning' | 'Groceries' | 'Maintenance' | 'Other';
  assignedTo: string; // User ID
  status: 'Pending' | 'Completed';
  dueDate: string;
  completedBy?: string; // User ID
  completedAt?: string;
}

export interface Settlement {
  from: string; // User ID
  to: string; // User ID
  amount: number;
}
