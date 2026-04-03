import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  BarChart3, 
  CheckCircle2, 
  Bell, 
  Plus, 
  ShoppingCart, 
  Zap, 
  Home as HomeIcon, 
  Utensils, 
  MoreHorizontal,
  X,
  TrendingDown,
  TrendingUp,
  Brush,
  ShoppingBag,
  Moon,
  Settings,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  Check,
  Users,
  Wallet,
  Target,
  LogOut
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { cn } from './lib/utils';
import { 
  User, 
  Expense, 
  Task, 
  Category, 
  Settlement 
} from './types';

import Auth from './components/Auth';

type Tab = 'home' | 'expenses' | 'analysis' | 'tasks' | 'members';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(50000);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const currentUser = useMemo(
    () => members.find((u) => u.id === currentUserId) || members[0] || null,
    [members, currentUserId],
  );

  const loadHouseholdData = async () => {
    const [usersData, expensesData, tasksData] = await Promise.all([
      apiRequest<{ users: User[] }>('/api/users'),
      apiRequest<{ expenses: Expense[] }>('/api/expenses'),
      apiRequest<{ tasks: Task[] }>('/api/tasks'),
    ]);

    setMembers(usersData.users);
    setExpenses(expensesData.expenses);
    setTasks(tasksData.tasks);
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const syncData = async () => {
      try {
        await loadHouseholdData();
      } catch (error) {
        console.error('Failed to sync household data:', error);
      }
    };

    syncData();
  }, [isLoggedIn]);

  // Calculations
  const totalHouseholdBalance = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const userBalance = useMemo(() => {
    // Simple balance calculation for demo
    // In a real app, this would be more complex (who owes whom)
    return -500; // Mocking "You owe ₹500" from the image
  }, [expenses]);

  const taskProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const getAIInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const prompt = `Analyze these expenses for a shared household: ${JSON.stringify(expenses)}. 
      Give me 3 short, actionable tips to save money this month. 
      Format as a short list.`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.text) {
        setAiInsights(data.text);
      } else {
        setAiInsights("Could not generate insights at this time.");
      }
    } catch (error) {
      console.error("AI Insight Error:", error);
      setAiInsights("Error connecting to AI service.");
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const topSpender = useMemo(() => {
    const spending: Record<string, number> = {};
    expenses.forEach(e => {
      spending[e.paidBy] = (spending[e.paidBy] || 0) + e.amount;
    });
    const topId = Object.entries(spending).sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      user: members.find(u => u.id === topId),
      amount: spending[topId || ''] || 0
    };
  }, [expenses, members]);

  const budgetSpent = useMemo(() => {
    return expenses
      .filter(e => e.deductFromBudget)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const spendingTrends = useMemo(() => {
    // Mock data for the chart
    return [
      { day: 'Mon', amount: 400 },
      { day: 'Tue', amount: 300 },
      { day: 'Wed', amount: 600 },
      { day: 'Thu', amount: 450 },
      { day: 'Fri', amount: 700 },
      { day: 'Sat', amount: 550 },
      { day: 'Sun', amount: 800 },
    ];
  }, []);

  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      const data = await apiRequest<{ expense: Expense }>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpense),
      });
      setExpenses((prev) => [data.expense, ...prev]);
      setIsAddExpenseOpen(false);
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Could not save expense. Please try again.');
    }
  };

  const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      const data = await apiRequest<{ task: Task }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
      });
      setTasks((prev) => [data.task, ...prev]);
      setIsAddTaskOpen(false);
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('Could not save task. Please try again.');
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!currentUserId) return;

    try {
      const data = await apiRequest<{ task: Task }>(`/api/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: currentUserId }),
      });

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Could not update task. Please try again.');
    }
  };

  const handleAddMember = async (newMember: Omit<User, 'id'>) => {
    try {
      const data = await apiRequest<{ user: User }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(newMember),
      });
      setMembers((prev) => [...prev, data.user]);
      setIsAddMemberOpen(false);
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Could not add member. Please try again.');
    }
  };

  const handleLogin = async (email: string) => {
    setAuthError(null);
    setIsLoadingApp(true);

    try {
      const data = await apiRequest<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      setCurrentUserId(data.user.id);
      setIsLoggedIn(true);
      await loadHouseholdData();
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError('Could not login right now. Please verify backend is running.');
    } finally {
      setIsLoadingApp(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setActiveTab('home');
  };

  if (!isLoggedIn) {
    return (
      <>
        <Auth onLogin={handleLogin} />
        {(isLoadingApp || authError) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="glass-panel px-4 py-2 rounded-full text-xs font-semibold">
              {isLoadingApp ? 'Signing in...' : authError}
            </div>
          </div>
        )}
      </>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
        <p className="text-sm font-semibold text-on-surface-variant">Loading your household...</p>
      </div>
    );
  }

  const NavItems = () => (
    <>
      {(['home', 'expenses', 'analysis', 'tasks', 'members'] as Tab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={cn(
            "flex items-center gap-3 p-3 transition-all duration-300 w-full rounded-xl",
            activeTab === tab 
              ? "primary-gradient text-on-primary-fixed shadow-lg" 
              : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
          )}
        >
          {tab === 'home' && <LayoutDashboard size={24} />}
          {tab === 'expenses' && <ReceiptText size={24} />}
          {tab === 'analysis' && <BarChart3 size={24} />}
          {tab === 'tasks' && <CheckCircle2 size={24} />}
          {tab === 'members' && <Users size={24} />}
          <span className="text-sm font-semibold uppercase tracking-wider">{tab}</span>
        </button>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-surface-container/40 backdrop-blur-2xl border-r border-outline-variant/10 p-6 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container-high">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary tracking-tight font-headline">VioNest</h1>
            <p className="text-[8px] text-on-surface-variant uppercase font-bold tracking-wider leading-tight">Expenses & chores, beautifully managed.</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItems />
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-outline-variant/10">
          <div className="flex items-center gap-3 px-3 py-2 text-on-surface-variant">
            <UserIcon size={20} />
            <span className="text-sm font-medium">{currentUser.name}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-error hover:bg-error/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 relative pb-24 lg:pb-0 overflow-x-hidden">
        {/* Background Stars */}
        <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-1/3 left-3/4 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-primary rounded-full"></div>
          <div className="absolute top-2/3 left-1/5 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-3/4 left-2/3 w-0.5 h-0.5 bg-secondary rounded-full"></div>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center lg:px-12">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container-high">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold text-primary tracking-tight font-headline">VioNest</h1>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-2xl font-bold font-headline capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant/10">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-xs font-bold text-on-surface-variant">Household Active</span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 pt-4 lg:px-12 lg:pt-8 lg:max-w-6xl lg:mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero Balance */}
              <section className="flex flex-col items-center justify-center text-center py-8">
                <p className="text-on-surface-variant font-medium tracking-widest uppercase text-xs mb-2">Household Balance</p>
                <h2 className="text-5xl font-extrabold font-headline text-on-surface tracking-tighter">₹{totalHouseholdBalance.toLocaleString()}</h2>
                <div className={cn(
                  "mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/10",
                  userBalance < 0 ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
                )}>
                  <span className="text-sm font-semibold">
                    {userBalance < 0 ? `You owe ₹${Math.abs(userBalance)}` : `You are owed ₹${userBalance}`}
                  </span>
                  {userBalance < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                </div>
              </section>

              {/* Bento Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="glass-panel rounded-lg p-6 flex flex-col items-center justify-between aspect-square lg:aspect-auto lg:h-64">
                  <p className="text-sm font-semibold text-on-surface-variant">Task Progress</p>
                  <div className="relative w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center">
                    <svg className="w-10 h-10 lg:w-32 lg:h-32 transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        className="text-surface-container-highest" 
                        cx="50" 
                        cy="50" 
                        fill="transparent" 
                        r="40" 
                        stroke="currentColor" 
                        strokeWidth="8"
                      ></circle>
                      <circle 
                        className="text-primary" 
                        cx="50" 
                        cy="50" 
                        fill="transparent" 
                        r="40" 
                        stroke="currentColor" 
                        strokeDasharray="251.2" 
                        strokeDashoffset={251.2 - (251.2 * taskProgress) / 100} 
                        strokeWidth="8" 
                        style={{ strokeLinecap: 'round', transition: 'stroke-dashoffset 0.5s ease' }}
                      ></circle>
                    </svg>
                    <span className="absolute text-xl lg:text-3xl font-bold font-headline">{taskProgress}%</span>
                  </div>
                  <span className="text-[11px] font-bold text-tertiary uppercase tracking-widest">Great job!</span>
                </div>

                <div className="glass-panel rounded-lg p-6 flex flex-col justify-between lg:h-64">
                  <div>
                    <p className="text-sm font-semibold text-on-surface-variant">Top Spender</p>
                    <div className="flex items-center gap-3 mt-2">
                      <img src={topSpender.user?.avatar} alt={topSpender.user?.name} className="w-10 h-10 rounded-full border border-primary/20" />
                      <p className="text-lg lg:text-xl font-bold">{topSpender.user?.name}</p>
                    </div>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-4 border border-primary/10">
                    <p className="text-[10px] text-primary-dim uppercase font-bold">Contribution</p>
                    <p className="text-primary font-bold text-2xl lg:text-3xl">₹{(topSpender.amount / 1000).toFixed(1)}k</p>
                  </div>
                </div>

                <div className="hidden lg:flex glass-panel rounded-lg p-6 flex-col justify-between h-64">
                  <p className="text-sm font-semibold text-on-surface-variant">Active Rituals</p>
                  <div className="space-y-3">
                    {tasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", task.status === 'Completed' ? "bg-tertiary" : "bg-primary animate-pulse")}></div>
                        <span className="text-xs font-medium truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('tasks')} className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">View All Tasks</button>
                </div>
              </div>

              {/* Quick Actions */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="flex items-center justify-center gap-3 primary-gradient text-on-primary-fixed font-bold py-4 rounded-xl primary-glow active:scale-95 transition-all md:col-span-2"
                >
                  <Plus size={20} />
                  <span>Add Expense</span>
                </button>
                <button 
                  onClick={() => setIsAddTaskOpen(true)}
                  className="flex items-center justify-center gap-3 glass-panel text-on-surface font-bold py-4 rounded-xl active:scale-95 transition-all md:col-span-2"
                >
                  <CheckCircle2 size={20} />
                  <span>New Task</span>
                </button>
              </section>

              {/* Recent Activity */}
              <section className="space-y-4 pb-12">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg lg:text-xl font-bold font-headline">Recent Activity</h3>
                  <button onClick={() => setActiveTab('expenses')} className="text-sm text-primary font-bold">See All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenses.slice(0, 4).map(expense => (
                    <div key={expense.id} className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-surface-container-high transition-all">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                        expense.category === 'Food' ? "bg-secondary-container text-on-secondary-container" : 
                        expense.category === 'Utilities' ? "bg-tertiary-container text-on-tertiary" : "bg-surface-container-highest text-primary"
                      )}>
                        {expense.category === 'Food' ? <ShoppingCart size={20} /> : 
                         expense.category === 'Utilities' ? <Zap size={20} /> : <ReceiptText size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface truncate">{expense.title}</p>
                        <p className="text-xs text-on-surface-variant truncate">
                          Paid by {members.find(u => u.id === expense.paidBy)?.name} • {formatRelativeDate(expense.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">₹{expense.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">{expense.splitType} Split</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <section className="py-8">
                <p className="text-on-surface-variant font-medium tracking-widest uppercase text-xs mb-2">Monthly Budget Status</p>
                <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8">
                  <div>
                    <h2 className="text-5xl font-extrabold font-headline text-primary tracking-tighter">₹{(monthlyBudget - budgetSpent).toLocaleString()}</h2>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">Remaining of ₹{monthlyBudget.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 max-w-xs space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span>Spent: ₹{budgetSpent.toLocaleString()}</span>
                      <span>{Math.round((budgetSpent / monthlyBudget) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          (budgetSpent / monthlyBudget) > 0.9 ? "bg-error" : "bg-primary"
                        )}
                        style={{ width: `${Math.min(100, (budgetSpent / monthlyBudget) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                <div className="glass-panel p-8 rounded-lg flex flex-col justify-between h-48 lg:h-56">
                  <Wallet className="text-secondary" size={40} />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Household Total</p>
                    <p className="text-3xl lg:text-4xl font-bold font-headline">₹{totalHouseholdBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="glass-panel p-8 rounded-lg flex flex-col justify-between h-48 lg:h-56">
                  <TrendingUp className="text-tertiary" size={40} />
                  <div>
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Your Balance</p>
                    <p className={cn("text-3xl lg:text-4xl font-bold font-headline", userBalance < 0 ? "text-error" : "text-tertiary")}>
                      ₹{Math.abs(userBalance).toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg lg:text-xl font-bold font-headline">Smart Settlements</h3>
                  <span className="text-primary text-xs font-bold uppercase tracking-widest">Auto-Grouped</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.filter(u => u.id !== currentUserId).slice(0, 4).map((user, i) => (
                    <div key={user.id} className="glass-panel p-6 rounded-lg flex items-center justify-between group hover:bg-surface-container-high transition-all">
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-primary/20" />
                          <div className="absolute -right-1 -bottom-1 bg-surface-container rounded-full p-0.5">
                            {i % 2 === 0 ? <ArrowRight className="text-primary" size={12} /> : <ArrowLeft className="text-error" size={12} />}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-on-surface font-bold truncate">{user.name}</p>
                          <p className="text-on-surface-variant text-xs truncate">
                            {i % 2 === 0 ? `Owes you ₹450.00` : `You owe ₹124.00`}
                          </p>
                        </div>
                      </div>
                      <button className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 shrink-0",
                        i % 2 === 0 ? "bg-primary/10 text-primary hover:bg-primary hover:text-on-primary" : "primary-gradient text-on-primary-fixed shadow-lg"
                      )}>
                        {i % 2 === 0 ? 'REQUEST' : 'SETTLE'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4 pb-12">
                <h3 className="text-lg lg:text-xl font-bold font-headline">Recent Expenses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenses.map(expense => (
                    <div key={expense.id} className="glass-panel p-5 rounded-lg flex items-center justify-between hover:bg-surface-container-high transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                          expense.category === 'Food' ? "bg-secondary/20 text-secondary" : 
                          expense.category === 'Utilities' ? "bg-tertiary/20 text-tertiary" : "bg-primary/20 text-primary"
                        )}>
                          {expense.category === 'Food' ? <Utensils size={20} /> : 
                           expense.category === 'Utilities' ? <Zap size={20} /> : <HomeIcon size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface truncate">{expense.title}</p>
                          <p className="text-xs text-on-surface-variant truncate">{expense.category} • Shared by {expense.splitWith.length} • {formatRelativeDate(expense.date)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold font-headline text-on-surface">₹{expense.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">Split {expense.splitType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <section className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-on-surface-variant font-medium tracking-wide uppercase text-[11px] font-headline">Monthly Summary</p>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-5xl font-extrabold font-headline text-on-surface tracking-tighter">₹{totalHouseholdBalance.toLocaleString()}</h2>
                      <span className="text-primary font-semibold">+12% vs last month</span>
                    </div>
                  </div>
                  <button 
                    onClick={getAIInsights}
                    disabled={isLoadingInsights}
                    className="px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2"
                  >
                    <Zap size={14} className={isLoadingInsights ? "animate-pulse" : ""} />
                    {isLoadingInsights ? "ANALYZING..." : "AI INSIGHTS"}
                  </button>
                </div>
                
                {aiInsights && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-4 rounded-lg border-l-4 border-primary mt-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Gemini Analysis</p>
                      <button onClick={() => setAiInsights(null)} className="text-on-surface-variant hover:text-on-surface">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                      {aiInsights}
                    </div>
                  </motion.div>
                )}
              </section>

              <div className="glass-panel rounded-xl p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg font-headline">Spending Trends</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-surface-container-highest text-xs font-semibold text-primary">WEEK</span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold text-on-surface-variant">MONTH</span>
                  </div>
                </div>
                <div className="h-48 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spendingTrends}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d0bcff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#d0bcff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#afa9b5', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1c1823', border: 'none', borderRadius: '8px', color: '#ede5f3' }}
                        itemStyle={{ color: '#d0bcff' }}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#d0bcff" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="glass-panel rounded-xl p-6 space-y-6">
                  <h3 className="font-bold text-lg font-headline">By Category</h3>
                  <div className="flex justify-center py-4 relative">
                    <div className="relative w-32 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#d0bcff', '#bba2fe', '#ffd9e3', '#a996d7'][index % 4]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BarChart3 className="text-primary" size={24} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {categoryData.map((cat, i) => (
                      <div key={cat.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#d0bcff', '#bba2fe', '#ffd9e3', '#a996d7'][i % 4] }}></div>
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <span className="text-sm font-bold">₹{cat.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6 space-y-6">
                  <h3 className="font-bold text-lg font-headline">Task Efficiency</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                        <span>Chores Done</span>
                        <span className="text-tertiary">{taskProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-tertiary rounded-full transition-all duration-500" style={{ width: `${taskProgress}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                        <span>Contribution</span>
                        <span className="text-primary">Balanced</span>
                      </div>
                      <div className="flex h-2 w-full gap-1">
                        <div className="flex-1 bg-primary rounded-full"></div>
                        <div className="flex-1 bg-secondary rounded-full opacity-60"></div>
                        <div className="flex-1 bg-primary-dim rounded-full opacity-40"></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-container/50 p-4 rounded-lg flex items-center gap-3">
                    <TrendingUp className="text-tertiary" size={20} />
                    <p className="text-xs text-on-surface-variant font-medium">You completed 5 more tasks than last week!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <section className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-on-surface-variant font-medium text-sm uppercase tracking-widest">Tonight's Harmony</p>
                    <h2 className="text-3xl font-extrabold font-headline text-on-surface">Task Flow</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-extrabold font-headline text-primary">{taskProgress}%</span>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Completed</p>
                  </div>
                </div>
                <div className="relative h-3 w-full bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-linear-to-r from-primary to-primary-container rounded-full shadow-[0_0_15px_rgba(208,188,255,0.4)] transition-all duration-500"
                    style={{ width: `${taskProgress}%` }}
                  ></div>
                </div>
              </section>

              {/* Category Cards */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                <div className="glass-panel p-6 rounded-lg space-y-2 hover:bg-surface-container-high transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center mb-2">
                    <Brush className="text-secondary" size={20} />
                  </div>
                  <h3 className="font-headline text-lg text-on-surface">Cleaning</h3>
                  <p className="text-on-surface-variant text-sm">{tasks.filter(t => t.category === 'Cleaning' && t.status === 'Pending').length} pending</p>
                </div>
                <div className="glass-panel p-6 rounded-lg space-y-2 hover:bg-surface-container-high transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center mb-2">
                    <ShoppingBag className="text-tertiary" size={20} />
                  </div>
                  <h3 className="font-headline text-lg text-on-surface">Groceries</h3>
                  <p className="text-on-surface-variant text-sm">
                    {tasks.filter(t => t.category === 'Groceries' && t.status === 'Pending').length} pending
                  </p>
                </div>
                <div className="glass-panel p-6 rounded-lg space-y-2 hover:bg-surface-container-high transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <HomeIcon className="text-primary" size={20} />
                  </div>
                  <h3 className="font-headline text-lg text-on-surface">Repairs</h3>
                  <p className="text-on-surface-variant text-sm">All clear</p>
                </div>
                <div className="glass-panel p-6 rounded-lg space-y-2 hover:bg-surface-container-high transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
                    <Zap className="text-secondary" size={20} />
                  </div>
                  <h3 className="font-headline text-lg text-on-surface">Utilities</h3>
                  <p className="text-on-surface-variant text-sm">1 urgent</p>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
                <section className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-headline">Active Rituals</h3>
                    <MoreHorizontal className="text-on-surface-variant" size={20} />
                  </div>
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <div 
                        key={task.id} 
                        className={cn(
                          "p-5 rounded-xl flex items-center justify-between transition-all",
                          task.status === 'Completed' ? "bg-surface-container-high/40 opacity-60" : "bg-surface-container-high"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                              task.status === 'Completed' ? "bg-primary border-primary" : "border-primary/40 hover:border-primary"
                            )}
                          >
                            {task.status === 'Completed' && <Check className="text-surface" size={16} strokeWidth={3} />}
                          </button>
                          <div className="min-w-0">
                            <h4 className={cn("font-semibold text-on-surface truncate", task.status === 'Completed' && "line-through")}>{task.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter shrink-0",
                                task.category === 'Cleaning' ? "bg-secondary-container/40 text-secondary" : "bg-tertiary-container/20 text-tertiary"
                              )}>
                                {task.category}
                              </span>
                              <p className="text-xs text-on-surface-variant flex items-center gap-1 truncate">
                                <UserIcon size={12} /> {task.status === 'Completed' ? `Done by ${members.find(u => u.id === task.completedBy)?.name}` : `For ${members.find(u => u.id === task.assignedTo)?.name}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={cn(
                            "text-[10px] font-bold",
                            task.status === 'Completed' ? "text-on-surface-variant" : "text-primary"
                          )}>
                            {isToday(parseISO(task.dueDate)) ? 'TODAY' : 'TOMORROW'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="lg:col-span-4 space-y-6">
                  <h3 className="text-xl font-bold font-headline">Household Settings</h3>
                  <div className="glass-panel p-6 rounded-lg space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Moon className="text-primary-dim" size={20} />
                        <div>
                          <p className="text-sm font-bold">Sleep Mode</p>
                          <p className="text-[10px] text-on-surface-variant">Silent after 10 PM</p>
                        </div>
                      </div>
                      <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Settings className="text-primary-dim" size={20} />
                        <div>
                          <p className="text-sm font-bold">Auto-Rotate</p>
                          <p className="text-[10px] text-on-surface-variant">Cycle weekly</p>
                        </div>
                      </div>
                      <div className="w-11 h-6 bg-surface-container rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-outline-variant/10">
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Members</h4>
                      <div className="space-y-3">
                        {members.map(user => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-primary/20" />
                              <span className="text-sm font-medium">{user.name}</span>
                            </div>
                            <div className={cn("w-2 h-2 rounded-full", user.id === currentUserId ? "bg-primary animate-pulse" : "bg-surface-container-highest")}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <section className="flex justify-between items-end">
                <div>
                  <p className="text-on-surface-variant font-medium text-sm uppercase tracking-widest">Household Circle</p>
                  <h2 className="text-3xl font-extrabold font-headline text-on-surface">Members</h2>
                </div>
                <button 
                  onClick={() => setIsAddMemberOpen(true)}
                  className="flex items-center gap-2 primary-gradient text-on-primary-fixed px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={20} />
                  <span>Add Member</span>
                </button>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(member => (
                  <div key={member.id} className="glass-panel p-6 rounded-xl flex items-center gap-4 hover:bg-surface-container-high transition-all">
                    <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full border-2 border-primary/20" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-on-surface truncate">{member.name}</h3>
                      <p className="text-sm text-on-surface-variant truncate">{member.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-tighter">
                          {member.id === currentUserId ? 'Admin' : 'Member'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold uppercase tracking-tighter">
                          {expenses.filter(e => e.paidBy === member.id).length} Expenses
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <section className="glass-panel p-8 rounded-xl space-y-6">
                <div className="flex items-center gap-3">
                  <Target className="text-primary" size={24} />
                  <h3 className="text-xl font-bold font-headline">Household Dynamics</h3>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Manage your celestial household members here. You can add new members directly without them needing to create an account. These members can be assigned to expenses and tasks to keep your sanctuary in perfect harmony.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="bg-surface-container/50 p-4 rounded-lg">
                    <p className="text-xs font-bold text-primary uppercase mb-1">Total Members</p>
                    <p className="text-2xl font-bold">{members.length}</p>
                  </div>
                  <div className="bg-surface-container/50 p-4 rounded-lg">
                    <p className="text-xs font-bold text-secondary uppercase mb-1">Active This Week</p>
                    <p className="text-2xl font-bold">{new Set(expenses.map(e => e.paidBy)).size}</p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB */}
      <div className="fixed bottom-28 right-6 z-40 lg:bottom-10 lg:right-10">
        <button 
          onClick={() => {
            if (activeTab === 'tasks') setIsAddTaskOpen(true);
            else if (activeTab === 'members') setIsAddMemberOpen(true);
            else setIsAddExpenseOpen(true);
          }}
          className="w-16 h-16 rounded-full primary-gradient text-on-primary-fixed flex items-center justify-center shadow-[0_8px_30px_rgba(208,188,255,0.3)] active:scale-90 transition-all duration-300 hover:scale-110"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface-variant/60 backdrop-blur-2xl rounded-t-[3rem] shadow-[0_-8px_30px_rgb(0,0,0,0.15)] lg:hidden">
        {(['home', 'expenses', 'analysis', 'tasks', 'members'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex flex-col items-center justify-center p-3 transition-all duration-300",
              activeTab === tab 
                ? "primary-gradient text-on-primary-fixed rounded-full scale-90 shadow-[0_0_15px_rgba(208,188,255,0.3)]" 
                : "text-on-surface-variant hover:text-primary"
            )}
          >
            {tab === 'home' && <LayoutDashboard size={24} />}
            {tab === 'expenses' && <ReceiptText size={24} />}
            {tab === 'analysis' && <BarChart3 size={24} />}
            {tab === 'tasks' && <CheckCircle2 size={24} />}
            {tab === 'members' && <Users size={24} />}
            <span className="text-[11px] font-semibold uppercase tracking-wider mt-1">{tab}</span>
          </button>
        ))}
      </nav>

      {/* Add Expense Modal */}
      <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="New Expense">
        <AddExpenseForm members={members} currentUserId={currentUserId} onSubmit={handleAddExpense} />
      </Modal>

      {/* Add Task Modal */}
      <Modal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} title="New Task">
        <AddTaskForm members={members} onSubmit={handleAddTask} />
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Add Member">
        <AddMemberForm onSubmit={handleAddMember} />
      </Modal>
    </div>
  </div>
  );
}

function AddMemberForm({ onSubmit }: { onSubmit: (member: Omit<User, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <form className="space-y-6" onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        name,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@home.com`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      });
    }}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-2">Full Name</label>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-6 text-lg font-medium focus:ring-4 focus:ring-primary/30 transition-all" 
            placeholder="e.g. Sarah Jenkins" 
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-2">Email (Optional)</label>
          <input 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-6 text-lg font-medium focus:ring-4 focus:ring-primary/30 transition-all" 
            placeholder="sarah@example.com" 
            type="email"
          />
        </div>
      </div>
      <button 
        className="primary-gradient primary-glow w-full py-4 rounded-xl text-on-primary-fixed font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all" 
        type="submit"
      >
        Add to Household
      </button>
    </form>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4 bg-surface/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md glass-panel rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 flex justify-between items-center border-b border-outline-variant/10">
          <h3 className="font-headline font-bold text-lg text-primary">{title}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function AddExpenseForm({ members, currentUserId, onSubmit }: { members: User[], currentUserId: string | null, onSubmit: (expense: Omit<Expense, 'id'>) => void }) {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [paidBy, setPaidBy] = useState(currentUserId || members[0]?.id || '');
  const [deductFromBudget, setDeductFromBudget] = useState(true);
  const [splitType, setSplitType] = useState<'Equal' | 'Custom'>('Equal');

  useEffect(() => {
    setPaidBy(currentUserId || members[0]?.id || '');
  }, [currentUserId, members]);

  return (
    <form className="space-y-6" onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        title: title || 'New Expense',
        amount: parseFloat(amount) || 0,
        category,
        paidBy,
        date: new Date().toISOString(),
        splitWith: members.map(u => u.id),
        splitType,
        deductFromBudget
      });
    }}>
      <div className="text-center space-y-2">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Amount</label>
        <div className="relative inline-block w-full">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-bold text-2xl">₹</span>
          <input 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-surface-container-lowest border-none rounded-full py-4 pl-12 pr-6 text-3xl font-bold font-headline text-center focus:ring-4 focus:ring-primary/30 transition-all placeholder:text-outline-variant" 
            placeholder="0.00" 
            type="number"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-2">Description</label>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-6 text-lg font-medium focus:ring-4 focus:ring-primary/30 transition-all" 
            placeholder="What was it for?" 
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-2">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-6 text-lg font-medium focus:ring-4 focus:ring-primary/30 transition-all appearance-none"
            >
              <option value="Food">Food</option>
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Leisure">Leisure</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-2">Paid By</label>
            <select 
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-6 text-lg font-medium focus:ring-4 focus:ring-primary/30 transition-all appearance-none"
            >
              {members.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl">
          <div className="flex items-center gap-3">
            <Target className={cn(deductFromBudget ? "text-primary" : "text-on-surface-variant")} size={20} />
            <div>
              <p className="text-sm font-bold">Deduct from Budget</p>
              <p className="text-[10px] text-on-surface-variant">Subtract from monthly limit</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setDeductFromBudget(!deductFromBudget)}
            className={cn(
              "w-11 h-6 rounded-full relative transition-colors",
              deductFromBudget ? "bg-primary" : "bg-surface-container-highest"
            )}
          >
            <div className={cn(
              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
              deductFromBudget ? "right-1" : "left-1"
            )}></div>
          </button>
        </div>
      </div>

      <button 
        className="primary-gradient primary-glow w-full py-4 rounded-xl text-on-primary-fixed font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all" 
        type="submit"
      >
        Record Expense
      </button>
    </form>
  );
}

function AddTaskForm({ members, onSubmit }: { members: User[], onSubmit: (task: Omit<Task, 'id'>) => void }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Task['category']>('Cleaning');
  const [assignedTo, setAssignedTo] = useState(members[0]?.id || '');

  return (
    <form className="space-y-6" onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        title,
        category,
        assignedTo,
        status: 'Pending',
        dueDate: new Date().toISOString()
      });
    }}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-2">Task Title</label>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-6 text-lg font-medium focus:ring-4 focus:ring-primary/30 transition-all" 
            placeholder="e.g. Deep clean the kitchen"
            required
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {(['Cleaning', 'Groceries', 'Maintenance', 'Other'] as Task['category'][]).map(cat => (
              <button 
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all",
                  category === cat ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                )}
              >
                {cat === 'Cleaning' && <Brush size={14} />}
                {cat === 'Groceries' && <ShoppingBag size={14} />}
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-2">Assign To</label>
          <div className="flex flex-wrap gap-3">
            {members.map(user => (
              <button 
                key={user.id}
                type="button"
                onClick={() => setAssignedTo(user.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                  assignedTo === user.id ? "bg-primary/10 border border-primary/30" : "opacity-60"
                )}
              >
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-primary/20" />
                <span className="text-[10px] font-bold">{user.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        type="submit"
        className="primary-gradient primary-glow w-full py-4 rounded-xl text-on-primary-fixed font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all" 
      >
        Assign Task
      </button>
    </form>
  );
}

function formatRelativeDate(dateString: string) {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}
