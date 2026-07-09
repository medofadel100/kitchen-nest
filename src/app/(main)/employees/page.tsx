"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { Employee, EmployeeTransaction } from '@/types';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/lib/firebase/employees';
import { Users, Plus, Edit2, Trash2, DollarSign, Wallet, TrendingDown, TrendingUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmployeesPage() {
  const { appUser } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (appUser?.workshopId) {
      loadEmployees();
    }
  }, [appUser]);

  const loadEmployees = async () => {
    setLoading(true);
    const data = await getEmployees(appUser!.workshopId);
    setEmployees(data);
    setLoading(false);
  };

  const calculateNetSalary = (employee: Employee) => {
    let net = employee.baseSalary;
    employee.transactions.forEach(t => {
      if (t.type === 'bonus' || t.type === 'overtime') net += t.amount;
      if (t.type === 'advance' || t.type === 'deduction') net -= t.amount;
    });
    return net;
  };

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEmp = {
      workshopId: appUser!.workshopId,
      name: formData.get('name') as string,
      jobTitle: formData.get('jobTitle') as string,
      hasSystemAccess: false,
      salaryType: formData.get('salaryType') as 'daily' | 'weekly' | 'monthly',
      baseSalary: Number(formData.get('baseSalary')),
      transactions: [],
      createdAt: new Date().toISOString(),
    };
    
    await createEmployee(newEmp);
    setIsAddModalOpen(false);
    loadEmployees();
  };

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const formData = new FormData(e.currentTarget);
    const newTransaction: EmployeeTransaction = {
      id: Date.now().toString(),
      type: formData.get('type') as any,
      amount: Number(formData.get('amount')),
      date: formData.get('date') as string,
      note: formData.get('note') as string,
    };

    const updatedTransactions = [...selectedEmployee.transactions, newTransaction];
    await updateEmployee(selectedEmployee.id, { transactions: updatedTransactions });
    
    setIsTransactionModalOpen(false);
    setSelectedEmployee(null);
    loadEmployees();
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      await deleteEmployee(id);
      loadEmployees();
    }
  };

  const filteredEmployees = employees.filter(e => e.name.includes(search) || e.jobTitle.includes(search));

  return (
    <RoleGuard allowedRoles={['admin', 'manager', 'accountant']} fallback={
      <div className="flex items-center justify-center h-full w-full bg-zinc-950 p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">عفواً، لا تملك صلاحية</h2>
          <p className="text-red-300/80">هذه الصفحة مخصصة لمديري الورشة والمحاسبين فقط.</p>
        </div>
      </div>
    }>
      <div className="flex flex-col h-full bg-zinc-950 text-white p-8 overflow-y-auto" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
              شؤون الموظفين
            </h1>
            <p className="text-zinc-500 mt-2">إدارة سجلات الموظفين، الرواتب، السلف، والمكافآت.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Plus size={20} />
            إضافة موظف جديد
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-zinc-500">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="ابحث بالاسم أو الوظيفة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pr-11 pl-4 focus:outline-none focus:border-emerald-500 transition-colors text-white"
          />
        </div>

        {/* Employees Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
            <Users size={48} className="mx-auto text-zinc-600 mb-4" />
            <h3 className="text-lg font-bold text-zinc-400">لا يوجد موظفين</h3>
            <p className="text-zinc-600 text-sm mt-1">قم بإضافة أول موظف للورشة الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-colors group relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{emp.name}</h3>
                    <span className="inline-block bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-md mt-1">{emp.jobTitle}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedEmployee(emp); setIsTransactionModalOpen(true); }}
                      className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-emerald-950 transition-colors"
                      title="إضافة حركة مالية"
                    >
                      <DollarSign size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">نظام الراتب:</span>
                    <span className="text-zinc-300">{emp.salaryType === 'daily' ? 'يومية' : emp.salaryType === 'weekly' ? 'أسبوعي' : 'شهري'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">الراتب الأساسي:</span>
                    <span className="text-zinc-300">{emp.baseSalary} ج.م</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-zinc-800 pt-3">
                    <span className="text-emerald-400">الصافي المستحق:</span>
                    <span className="text-emerald-400 text-lg">{calculateNetSalary(emp)} ج.م</span>
                  </div>
                </div>

                {emp.transactions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-500 mb-2 font-bold">آخر الحركات:</p>
                    <div className="space-y-2">
                      {emp.transactions.slice(-3).reverse().map(t => (
                        <div key={t.id} className="flex justify-between items-center text-xs bg-zinc-950/50 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            {t.type === 'bonus' || t.type === 'overtime' ? (
                              <TrendingUp size={14} className="text-emerald-400" />
                            ) : (
                              <TrendingDown size={14} className="text-red-400" />
                            )}
                            <span className="text-zinc-400">
                              {t.type === 'advance' ? 'سلفة' : t.type === 'deduction' ? 'خصم' : t.type === 'bonus' ? 'مكافأة' : 'إضافي'}
                            </span>
                          </div>
                          <span className={t.type === 'bonus' || t.type === 'overtime' ? 'text-emerald-400' : 'text-red-400'}>
                            {t.type === 'bonus' || t.type === 'overtime' ? '+' : '-'}{t.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6">إضافة موظف جديد</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">اسم الموظف</label>
                <input type="text" name="name" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">المسمى الوظيفي</label>
                <input type="text" name="jobTitle" required placeholder="مثال: نجار، فني تجميع، مساعد..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">نظام الراتب</label>
                  <select name="salaryType" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none appearance-none">
                    <option value="daily">يومية</option>
                    <option value="weekly">أسبوعي</option>
                    <option value="monthly">شهري</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">القيمة (ج.م)</label>
                  <input type="number" name="baseSalary" required min="0" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-xl font-bold transition-colors">إضافة</button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors">إلغاء</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isTransactionModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-2">حركة مالية لـ <span className="text-emerald-400">{selectedEmployee.name}</span></h2>
            <p className="text-sm text-zinc-500 mb-6">تسجيل سلفة، خصم، أو مكافأة.</p>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">النوع</label>
                  <select name="type" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none appearance-none">
                    <option value="advance">سلفة</option>
                    <option value="deduction">خصم</option>
                    <option value="bonus">مكافأة</option>
                    <option value="overtime">وقت إضافي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">المبلغ (ج.م)</label>
                  <input type="number" name="amount" required min="1" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">التاريخ</label>
                <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">ملاحظات (اختياري)</label>
                <input type="text" name="note" placeholder="سبب الخصم أو المكافأة..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
              </div>
              <div className="flex gap-3 mt-8">
                <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-xl font-bold transition-colors">حفظ الحركة</button>
                <button type="button" onClick={() => {setIsTransactionModalOpen(false); setSelectedEmployee(null);}} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors">إلغاء</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </RoleGuard>
  );
}
