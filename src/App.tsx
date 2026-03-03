import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Plane, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Bell, 
  User, 
  ChevronRight,
  Filter,
  MoreVertical,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Settings,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'employee' | 'manager';
}

interface Expense {
  id: number;
  userId: number;
  userName?: string;
  merchant: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'general' | 'travel';
}

interface Stats {
  pendingAmount: number;
  approvedAmount: number;
  totalCount: number;
}

interface Notification {
  id: number;
  message: string;
  type: string;
  isRead: number;
  createdAt: string;
}

function ExpenseTable({ 
  expenses, 
  currentUser, 
  handleStatusUpdate, 
  title 
}: { 
  expenses: Expense[], 
  currentUser: User | null, 
  handleStatusUpdate: (id: number, status: 'approved' | 'rejected') => void,
  title: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Filter size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Merchant & Date</th>
              <th className="px-6 py-4">Category</th>
              {currentUser?.role === 'manager' && <th className="px-6 py-4">Employee</th>}
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <AnimatePresence mode="popLayout">
              {expenses.map((expense) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={expense.id} 
                  className="group hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        expense.type === 'travel' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {expense.type === 'travel' ? <Plane size={20} /> : <Receipt size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expense.merchant}</p>
                        <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {expense.category}
                    </span>
                  </td>
                  {currentUser?.role === 'manager' && (
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{expense.userName}</p>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">₹{expense.amount.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={expense.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {currentUser?.role === 'manager' && expense.status !== 'approved' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleStatusUpdate(expense.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-semibold text-xs"
                        >
                          <CheckCircle2 size={14} />
                          Approve
                        </button>
                        {expense.status === 'pending' && (
                          <button 
                            onClick={() => handleStatusUpdate(expense.id, 'rejected')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-semibold text-xs"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        )}
                      </div>
                    ) : (
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {expenses.length === 0 && (
              <tr>
                <td colSpan={currentUser?.role === 'manager' ? 6 : 5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Receipt size={48} strokeWidth={1} />
                    <p className="text-sm">No expenses found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('expense_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats>({ pendingAmount: 0, approvedAmount: 0, totalCount: 0 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'employee' | 'manager' | null>(null);

  // Login/Signup form state
  const [authData, setAuthData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'employee' | 'manager'
  });

  useEffect(() => {
    if (selectedRole) {
      setAuthData(prev => ({ ...prev, role: selectedRole }));
    }
  }, [selectedRole]);

  // Expense form state
  const [formData, setFormData] = useState({
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Travel',
    description: '',
    type: 'travel'
  });

  useEffect(() => {
    const verifyUser = async () => {
      if (currentUser) {
        try {
          const res = await fetch(`/api/users?email=${currentUser.email}`);
          if (!res.ok) {
            handleLogout();
          }
        } catch (error) {
          // If server is down, don't necessarily log out, but maybe just log it
          console.error("Failed to verify user session");
        }
      }
    };
    verifyUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchExpenses();
      fetchStats();
      fetchNotifications();
    }
  }, [currentUser, activeTab]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    // Frontend validation
    if (!authData.email.endsWith("@gmail.com")) {
      setLoginError("Email must end with @gmail.com");
      setLoading(false);
      return;
    }
    if (authData.password.length < 8) {
      setLoginError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isSignUp ? '/api/signup' : '/api/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        localStorage.setItem('expense_user', JSON.stringify(data));
      } else {
        setLoginError(data.error || (isSignUp ? 'Signup failed' : 'Login failed'));
      }
    } catch (error) {
      setLoginError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('expense_user');
    setActiveTab('Dashboard');
    setAuthData({ name: '', email: '', password: '', role: 'employee' });
    setIsSignUp(false);
    setSelectedRole(null);
  };

  const fetchExpenses = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/expenses?userId=${currentUser.id}&role=${currentUser.role}`);
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchStats = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/stats?userId=${currentUser.id}&role=${currentUser.role}`);
      const data = await res.json();
      setStats(data || { pendingAmount: 0, approvedAmount: 0, totalCount: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: currentUser.id, amount: parseFloat(formData.amount) })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          merchant: '',
          date: new Date().toISOString().split('T')[0],
          amount: '',
          category: 'Travel',
          description: '',
          type: 'travel'
        });
        fetchExpenses();
        fetchStats();
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/expenses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchExpenses();
        fetchStats();
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!currentUser) {
    if (!selectedRole && !isSignUp) {
      return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="col-span-1 md:col-span-2 text-center mb-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome to Expense Pro</h1>
              <p className="text-gray-500 mt-2">Select your role to continue</p>
            </div>

            <RoleCard 
              title="Employee" 
              description="Submit expenses, track reimbursements, and plan business trips."
              icon={<User className="w-8 h-8" />}
              onClick={() => setSelectedRole('employee')}
              color="indigo"
            />
            <RoleCard 
              title="Manager" 
              description="Review team expenses, approve reports, and manage budgets."
              icon={<CheckCircle2 className="text-emerald-500 w-8 h-8" />}
              onClick={() => setSelectedRole('manager')}
              color="emerald"
            />

            <div className="col-span-1 md:col-span-2 text-center mt-4">
              <button 
                onClick={() => setIsSignUp(true)}
                className="text-indigo-600 font-semibold hover:underline"
              >
                New here? Create an account
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-8 text-center bg-[#151619] text-white relative">
            {!isSignUp && (
              <button 
                onClick={() => setSelectedRole(null)}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="rotate-180" size={20} />
              </button>
            )}
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignUp ? 'Join Expense Pro' : `${selectedRole === 'manager' ? 'Manager' : 'Employee'} Portal`}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isSignUp ? 'Create your account' : 'Sign in to continue'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="p-8 space-y-5">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <XCircle size={16} />
                {loginError}
              </div>
            )}

            {isSignUp && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={authData.name}
                    onChange={e => setAuthData({...authData, name: e.target.value})}
                    placeholder="John Doe" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Role</label>
                  <select 
                    value={authData.role}
                    onChange={e => setAuthData({...authData, role: e.target.value as 'employee' | 'manager'})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Email Address</label>
              <input 
                required
                type="email" 
                value={authData.email}
                onChange={e => setAuthData({...authData, email: e.target.value})}
                placeholder={isSignUp ? "user@gmail.com" : (selectedRole === 'manager' ? "manager@gmail.com" : "employee@gmail.com")} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
              <input 
                required
                type="password" 
                value={authData.password}
                onChange={e => setAuthData({...authData, password: e.target.value})}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-3 ${selectedRole === 'manager' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50`}
            >
              {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>

            <div className="pt-4 text-center">
              <button 
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setLoginError('');
                  if (isSignUp) setSelectedRole(null);
                }}
                className="text-sm text-indigo-600 font-semibold hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>

            {!isSignUp && (
              <div className="pt-2 text-center border-t border-gray-100 mt-4">
                <p className="text-[10px] text-gray-400 mt-4">
                  Default {selectedRole} credentials:<br/>
                  {selectedRole === 'manager' ? (
                    <>manager@gmail.com / password123<br/>john.manager@gmail.com / password123</>
                  ) : (
                    <>employee@gmail.com / password123<br/>jane.employee@gmail.com / password123</>
                  )}
                </p>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#151619] text-white flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Expense Pro</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'Dashboard'} 
            onClick={() => setActiveTab('Dashboard')}
          />
          <SidebarItem 
            icon={<Receipt size={20} />} 
            label={currentUser?.role === 'manager' ? "Team Expenses" : "My Expenses"} 
            active={activeTab === 'Expenses'} 
            onClick={() => setActiveTab('Expenses')}
          />
          <SidebarItem 
            icon={<Plane size={20} />} 
            label={currentUser?.role === 'manager' ? "Team Trips" : "My Trips"} 
            active={activeTab === 'Trips'} 
            onClick={() => setActiveTab('Trips')}
          />
          <SidebarItem 
            icon={<CheckCircle2 size={20} />} 
            label={currentUser?.role === 'manager' ? "Approvals" : "My Requests"} 
            active={activeTab === 'Approvals'} 
            onClick={() => setActiveTab('Approvals')}
          />
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'Settings'} 
            onClick={() => setActiveTab('Settings')}
          />
        </nav>

        <div className="p-4 border-t border-white/10">
          <div onClick={handleLogout} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{currentUser?.role}</p>
            </div>
            <LogOut size={16} className="text-gray-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 z-10">
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) markNotificationsAsRead();
                }}
                className="relative text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell size={20} />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setIsNotificationsOpen(false)}
                    ></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-30 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">
                          Recent
                        </span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  notif.type === 'request' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                  {notif.type === 'request' ? <Receipt size={16} /> : <CheckCircle2 size={16} />}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-800 leading-relaxed">{notif.message}</p>
                                  <p className="text-[10px] text-gray-400">
                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No notifications yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={18} />
              New Expense
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {activeTab === 'Dashboard' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    title={currentUser?.role === 'manager' ? "Team Pending" : "My Pending"} 
                    value={`₹${(stats.pendingAmount || 0).toLocaleString()}`} 
                    icon={<Clock className="text-amber-500" />}
                    trend="+12% from last month"
                    trendUp={true}
                  />
                  <StatCard 
                    title={currentUser?.role === 'manager' ? "Team Reimbursed" : "My Reimbursed"} 
                    value={`₹${(stats.approvedAmount || 0).toLocaleString()}`} 
                    icon={<CheckCircle2 className="text-emerald-500" />}
                    trend="-5% from last month"
                    trendUp={false}
                  />
                  <StatCard 
                    title={currentUser?.role === 'manager' ? "Total Team Reports" : "My Total Reports"} 
                    value={stats.totalCount.toString()} 
                    icon={<Receipt className="text-indigo-500" />}
                    trend="+2 new today"
                    trendUp={true}
                  />
                </div>

                {currentUser?.role === 'employee' && (
                  <div className="bg-indigo-600 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl shadow-indigo-100">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Need a reimbursement?</h2>
                      <p className="text-indigo-100 opacity-90">Submit your expenses now for quick manager approval.</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg"
                    >
                      Ask for Approval
                    </button>
                  </div>
                )}

                {currentUser?.role === 'manager' && (
                  <div className="bg-emerald-600 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl shadow-emerald-100">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Pending Approvals</h2>
                      <p className="text-emerald-100 opacity-90">You have team members waiting for expense reimbursements.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('Approvals')}
                      className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-lg"
                    >
                      Review Queue
                    </button>
                  </div>
                )}

                <ExpenseTable 
                  expenses={expenses} 
                  currentUser={currentUser} 
                  handleStatusUpdate={handleStatusUpdate}
                  title={currentUser?.role === 'manager' ? 'Team Approval Queue' : 'My Recent Expenses'}
                />
              </>
            )}

            {activeTab === 'Expenses' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Manage Your Expenses</h2>
                      <p className="text-sm text-gray-500">View and organize all your submitted expense reports.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    Create New Expense
                  </button>
                </div>

                <ExpenseTable 
                  expenses={expenses} 
                  currentUser={currentUser} 
                  handleStatusUpdate={handleStatusUpdate}
                  title="All Expenses"
                />
              </div>
            )}

            {activeTab === 'Trips' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Plane size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Business Trips</h2>
                      <p className="text-sm text-gray-500">Track your business travel and related expenses.</p>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm">
                    Plan a Trip
                  </button>
                </div>

                <ExpenseTable 
                  expenses={expenses.filter(e => e.type === 'travel')} 
                  currentUser={currentUser} 
                  handleStatusUpdate={handleStatusUpdate}
                  title="Travel Reports"
                />
              </div>
            )}

            {activeTab === 'Approvals' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Pending Approvals</h2>
                      <p className="text-sm text-gray-500">
                        {currentUser?.role === 'manager' 
                          ? "Review and approve expense reports submitted by your team members."
                          : "This section is for managers to review team expenses."}
                      </p>
                    </div>
                  </div>
                  {currentUser?.role === 'manager' && expenses.filter(e => e.status === 'pending').length > 0 && (
                    <button 
                      onClick={async () => {
                        const pending = expenses.filter(e => e.status === 'pending');
                        for (const exp of pending) {
                          await handleStatusUpdate(exp.id, 'approved');
                        }
                      }}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      Approve All
                    </button>
                  )}
                </div>

                <ExpenseTable 
                  expenses={expenses.filter(e => e.status === 'pending')} 
                  currentUser={currentUser} 
                  handleStatusUpdate={handleStatusUpdate}
                  title="Approval Queue"
                />
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
                    <Settings size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Settings</h2>
                    <p className="text-gray-500">Manage your profile and application preferences.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Profile Information</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase">Full Name</p>
                        <p className="font-medium">{currentUser?.name}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase">Email Address</p>
                        <p className="font-medium">{currentUser?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="font-medium">Email Notifications</p>
                        <div className="w-10 h-6 bg-indigo-600 rounded-full relative">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="font-medium">Dark Mode</p>
                        <div className="w-10 h-6 bg-gray-200 rounded-full relative">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Expense Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold">Add New Expense</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Merchant</label>
                    <input 
                      required
                      type="text" 
                      value={formData.merchant}
                      onChange={e => setFormData({...formData, merchant: e.target.value})}
                      placeholder="e.g. Uber, Starbucks" 
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Amount (₹)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      placeholder="₹0.00" 
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option>Travel</option>
                      <option>Meals</option>
                      <option>Lodging</option>
                      <option>Supplies</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="What was this expense for?" 
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Submit Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
        active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </div>
  );
}

function RoleCard({ title, description, icon, onClick, color }: { title: string, description: string, icon: React.ReactNode, onClick: () => void, color: 'indigo' | 'emerald' }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`bg-white p-8 rounded-3xl border-2 border-transparent hover:border-${color}-500 shadow-xl cursor-pointer transition-all group`}
    >
      <div className={`w-16 h-16 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title} Login</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      <div className={`mt-6 flex items-center gap-2 text-${color}-600 font-bold text-sm`}>
        Enter Portal <ChevronRight size={16} />
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-xl">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-600 border-red-100'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]} capitalize`}>
      {status}
    </span>
  );
}
