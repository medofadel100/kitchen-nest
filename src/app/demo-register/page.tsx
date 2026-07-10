"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Lock, Mail, User, Phone, MapPin, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function DemoRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    workshopName: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      // Set persistence
      await setPersistence(auth, browserLocalPersistence);

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Mark user as demo account
      await setDoc(doc(db, 'workshops', user.uid), {
        ownerId: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        workshopName: formData.workshopName || 'ورشة Demo',
        address: formData.address,
        isDemo: true, // Mark as demo account
        createdAt: new Date().toISOString(),
      });

      // Create 3 demo projects
      const projects = [
        {
          name: 'مشروع مطبخ عصري',
          description: 'مشروع تجريبي 1 - تصميم مطبخ عصري',
          createdAt: new Date().toISOString(),
        },
        {
          name: 'مشروع مطبخ كلاسيك',
          description: 'مشروع تجريبي 2 - تصميم مطبخ كلاسيكي',
          createdAt: new Date().toISOString(),
        },
        {
          name: 'مشروع مطبخ صغير',
          description: 'مشروع تجريبي 3 - تصميم مطبخ صغير',
          createdAt: new Date().toISOString(),
        },
      ];

      for (const project of projects) {
        const projectRef = await addDoc(collection(db, 'projects'), {
          ...project,
          ownerId: user.uid,
          isDemo: true,
        });

        // Add demo room data
        await setDoc(doc(db, 'rooms', `${projectRef.id}_room`), {
          projectId: projectRef.id,
          widthMm: 4000,
          lengthMm: 3000,
          heightMm: 2800,
          name: 'غرفة المطبخ',
          fixtures: [],
          obstacles: [],
          createdAt: new Date().toISOString(),
        });

        // Add demo units
        const demoUnits = [
          { type: 'base', label: 'وحدة أرضية', position: { xMm: 500, yMm: 500, zMm: 0, rotationDeg: 0 }, dimensions: { widthMm: 600, depthMm: 600, heightMm: 850 } },
          { type: 'wall', label: 'وحدة معلقة', position: { xMm: 1500, yMm: 500, zMm: 1200, rotationDeg: 0 }, dimensions: { widthMm: 800, depthMm: 350, heightMm: 700 } },
          { type: 'tall', label: 'وحدة طولية', position: { xMm: 3500, yMm: 500, zMm: 500, rotationDeg: 0 }, dimensions: { widthMm: 600, depthMm: 600, heightMm: 2100 } },
        ];

        for (const unit of demoUnits) {
          await addDoc(collection(db, 'projects', projectRef.id, 'units'), {
            ...unit,
            materialId: 'default',
            colorHex: '#D4B896',
            doorMaterialId: 'default',
            doorColorHex: '#D4B896',
            doorCount: 2,
            drawerCount: 0,
            shelfCount: 2,
            hingeType: 'standard',
            handleType: 'standard',
            hasLedProfile: false,
            isHidden: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Redirect to projects page
      router.push('/projects');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجل بالفعل.');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صالح.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل.');
      } else {
        setError('حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.05] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800 rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Lock className="text-zinc-950" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">تسجيل Demo</h1>
          <p className="text-zinc-400 mt-2 text-sm">جرب النظام مجاناً مع 3 مشاريع تجريبية</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">الاسم الكامل *</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
                  placeholder="محمد أحمد"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">البريد الإلكتروني *</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600 text-left"
                  placeholder="name@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">رقم الموبايل *</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
                  <Phone size={18} />
                </div>
                <input 
                  type="tel" 
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600 text-left"
                  placeholder="+966 50 000 0000"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">اسم الورشة / المصنع</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  name="workshopName"
                  value={formData.workshopName}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
                  placeholder="ورشة الإبداع"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">العنوان</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
                  <MapPin size={18} />
                </div>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
                  placeholder="المدينة، المنطقة، الشارع"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">كلمة المرور *</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pr-11 pl-12 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600 text-left"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">تأكيد كلمة المرور *</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-500">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600 text-left"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-4">
            <p className="text-emerald-400 text-sm font-medium">
              ✨ ستحصل على 3 مشاريع تجريبية جاهزة للتجربة:
            </p>
            <ul className="text-emerald-300 text-xs mt-2 space-y-1 list-disc list-inside">
              <li>مشروع مطبخ عصري</li>
              <li>مشروع مطبخ كلاسيكي</li>
              <li>مشروع مطبخ صغير</li>
            </ul>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 text-emerald-950 py-3 rounded-xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                إنشاء حساب Demo
                <ArrowRight size={20} className="rotate-180" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-zinc-800/80 pt-6">
          <p className="text-zinc-500 text-sm">
            لديك حساب بالفعل؟
            <button 
              onClick={() => router.push('/login')}
              className="text-emerald-400 font-bold mr-2 hover:text-emerald-300 transition-colors"
            >
              تسجيل الدخول
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}