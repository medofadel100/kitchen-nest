"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { KitchenProject } from '@/types';
import {
  CheckCircle2, Clock, MapPin, Building2,
  Box, Download, Smartphone
} from 'lucide-react';
import { SceneExporterHandle } from '@/components/canvas/SceneExporter';
import { SplashLoader } from '@/components/SplashLoader';

// model-viewer type declaration (web component from Google)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          'ios-src'?: string;
          ar?: boolean | '';
          'ar-modes'?: string;
          'camera-controls'?: boolean | '';
          'shadow-intensity'?: string;
          'auto-rotate'?: boolean | '';
          'rotation-per-second'?: string;
          style?: React.CSSProperties;
          alt?: string;
          poster?: string;
        },
        HTMLElement
      >;
    }
  }
}

const KitchenCanvas3D = dynamic(
  () => import('@/components/canvas/KitchenCanvas3D').then(mod => mod.KitchenCanvas3D),
  { ssr: false, loading: () => <SplashLoader text="جاري تحميل التصميم 3D..." /> }
);

export default function SharedProjectPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState<KitchenProject | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showAR, setShowAR] = useState(false);

  const exporterRef = useRef<SceneExporterHandle>(null);
  const loadProjectData = useProjectStore(state => state.loadProjectData);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // استخدام الـ API الجديد الآمن — shareToken مش projectId
        const response = await fetch(`/api/share/${params.id}`);
        if (!response.ok) {
          setError(
            response.status === 404
              ? 'رابط المشاركة غير صحيح أو انتهت صلاحيته.'
              : 'حدث خطأ أثناء تحميل المشروع.'
          );
          return;
        }
        const data = await response.json();
        setProject(data);
        loadProjectData(data);
      } catch {
        setError('حدث خطأ في الاتصال بالإنترنت. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [params.id, loadProjectData]);

  // تصدير المشهد كـ GLB وتحضيره للـ AR
  const handleExportGLB = async () => {
    if (!exporterRef.current) {
      alert('يرجى الانتظار حتى يكتمل تحميل المشهد ثلاثي الأبعاد أولاً.');
      return;
    }
    setIsExporting(true);
    try {
      const blob = await exporterRef.current.exportGLB();
      const url = URL.createObjectURL(blob);

      // نظّف الـ URL القديم لو موجود
      if (glbUrl) URL.revokeObjectURL(glbUrl);
      setGlbUrl(url);
      setShowAR(true);
    } catch (err) {
      console.error('GLB export failed:', err);
      alert('فشل تصدير الملف. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadGLB = async () => {
    if (!exporterRef.current) return;
    setIsExporting(true);
    try {
      const blob = await exporterRef.current.exportGLB();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kitchen-${project?.projectName ?? 'design'}.glb`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('فشل تصدير الملف.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-zinc-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mb-4" />
        <p className="text-zinc-400 font-bold animate-pulse">جاري تحميل التصميم 3D...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-zinc-950 p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">عذراً</h1>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-white" dir="rtl">

      {/* model-viewer script — يُحمَّل مرة واحدة */}
      <script
        type="module"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        async
      />

      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 p-4 shrink-0 z-20 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Building2 className="text-emerald-950" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">
                {project.projectName || 'تصميم مطبخ'}
              </h1>
              <p className="text-emerald-400 text-sm font-bold mt-1 tracking-wide">
                تصميم 3D تفاعلي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* زرار AR */}
            <button
              onClick={handleExportGLB}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                isExporting
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-violet-500 hover:bg-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
              }`}
            >
              <Smartphone size={16} />
              {isExporting ? 'جاري التحضير...' : 'شوفه في مكانك (AR)'}
            </button>

            {/* زرار تحميل GLB */}
            <button
              onClick={handleDownloadGLB}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all"
            >
              <Download size={16} />
              تحميل 3D
            </button>

            {/* بيانات العميل */}
            <div className="flex items-center gap-4 bg-zinc-950/50 px-4 py-2 rounded-2xl border border-zinc-800 hidden md:flex">
              <div className="text-center">
                <span className="block text-zinc-500 text-xs font-bold mb-1">العميل</span>
                <span className="text-white font-bold">{project.clientName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">

        {/* AR Modal */}
        {showAR && glbUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-2xl bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <button
                  onClick={() => setShowAR(false)}
                  className="text-zinc-400 hover:text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  ✕ إغلاق
                </button>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Box size={20} className="text-violet-400" />
                  معاينة AR
                </h2>
              </div>

              {/* model-viewer */}
              <model-viewer
                src={glbUrl}
                ar
                ar-modes="scene-viewer webxr"
                camera-controls
                auto-rotate
                rotation-per-second="15deg"
                shadow-intensity="1"
                style={{ width: '100%', height: '420px', background: '#18181b' }}
                alt={`تصميم مطبخ — ${project.projectName}`}
              >
                <button
                  slot="ar-button"
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(139,92,246,0.4)',
                  }}
                >
                  📱 شوف المطبخ في مكانك الحقيقي (AR)
                </button>
              </model-viewer>

              <div className="p-4 bg-zinc-950/50 text-center">
                <p className="text-zinc-400 text-sm">
                  📱 على <strong className="text-white">Android</strong>: اضغط زرار AR أدناه للمعاينة في غرفتك
                  &nbsp;·&nbsp;
                  على <strong className="text-white">iPhone</strong>: شغّل الـ 3D وتحرك حواليه
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3D Viewer */}
        <div className="absolute inset-0 z-0">
          <KitchenCanvas3D readOnly={true} exporterRef={exporterRef} />
        </div>

        {/* Floating Info Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-8 right-8 z-10 w-80 pointer-events-none hidden md:block"
        >
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4 border-b border-zinc-800 pb-3">
              تفاصيل المشروع
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-bold">الحالة</div>
                  <div className="text-sm font-bold text-zinc-200">
                    {project.status === 'design' ? 'قيد المراجعة' :
                     project.status === 'approved' ? 'تم الاعتماد ✅' :
                     project.status === 'in_production' ? 'قيد التصنيع' :
                     project.status === 'installed' ? 'تم التركيب ✅' : project.status}
                  </div>
                </div>
              </div>

              {typeof (project as any).quoteGrandTotalWithVat === 'number' && (
                <div className="pt-2 pb-1">
                  <div className="text-xs text-zinc-500 font-bold">إجمالي السعر</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    {(project as any).quoteGrandTotalWithVat.toLocaleString()} <span className="text-base text-emerald-500/50">EGP</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-bold mt-1">شامل ضريبة القيمة المضافة (VAT)</div>
                </div>
              )}

              {project.deliveryDate && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-blue-400">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-bold">تاريخ التسليم المتوقع</div>
                    <div className="text-sm font-bold text-zinc-200">{project.deliveryDate}</div>
                  </div>
                </div>
              )}

              {project.projectAddress && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-bold">الموقع</div>
                    <div className="text-sm font-bold text-zinc-200">{project.projectAddress}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 text-center leading-relaxed">
                اسحب بأصبعك أو بالماوس لرؤية التصميم من كل الزوايا.
                <br />
                اضغط "شوفه في مكانك" لمعاينة AR بالحجم الطبيعي.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}