"use client";

import React, { useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useSettingsStore } from "@/store/settingsStore";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const syncFromCloud = useSettingsStore(state => state.syncFromCloud);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      // Sync settings when user logs in
      syncFromCloud(user.uid);
    }
  }, [user, loading, router, syncFromCloud]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden selection:bg-emerald-500/30 w-full">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto relative w-full h-full">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] pointer-events-none"></div>
        {children}
      </main>
    </div>
  );
}
