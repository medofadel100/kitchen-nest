"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Settings, Box, Users, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export const AppSidebar = () => {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'الرئيسية', icon: LayoutDashboard },
    { href: '/projects', label: 'المشاريع', icon: FolderKanban },
    { href: '/inventory', label: 'المخزن', icon: Package },
    { href: '/employees', label: 'شؤون الموظفين', icon: Users },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-72 bg-zinc-950/80 backdrop-blur-xl border-l border-zinc-800/50 flex flex-col shadow-2xl relative z-10 shrink-0 print:hidden"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      
      <div className="p-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Box className="text-zinc-950" size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500">
            KitchenNest
          </h1>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">SaaS Platform</p>
        </div>
      </div>
      
      <nav className="flex-1 mt-6 px-4">
        <ul className="space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            const Icon = link.icon;
            
            return (
              <li key={link.href}>
                <Link 
                  href={link.href}
                  className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'text-white bg-zinc-800/50 border border-zinc-700/50 shadow-inner' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-zinc-800/80 border border-zinc-700 rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  )}
                  
                  <Icon size={22} className={`transition-transform duration-300 ${isActive ? 'text-emerald-400' : 'group-hover:scale-110 group-hover:text-zinc-200'}`} />
                  <span className="font-semibold text-sm">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 m-4 rounded-2xl bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <span className="text-emerald-400 font-bold text-xs">WP</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">ورشة النجارة</p>
              <p className="text-xs text-zinc-500">خطة احترافية</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
