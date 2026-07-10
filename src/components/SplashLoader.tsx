"use client";

import React from 'react';

export const SplashLoader = ({ text = 'جاري تجهيز المشروع...' }: { text?: string }) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" />

      <div className="relative w-[520px] max-w-[92vw] rounded-3xl border border-zinc-800/80 bg-zinc-950/80 shadow-2xl overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-[520px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent blur-2xl animate-[splashGlow_1.8s_ease-in-out_infinite]" />

        <div className="relative p-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.6)]" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">KitchenNest</div>
              <div className="text-xs text-zinc-400 font-semibold">Loading &amp; rendering</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            </div>

            <div className="flex-1">
              <div className="text-sm text-white/90 font-bold">{text}</div>
              <div className="mt-3 h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-[35%] bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-[splashBar_1.2s_ease-in-out_infinite]" />
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">قد يستغرق تحميل المشهد ثوانٍ قليلة…</div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 text-zinc-500 text-xs">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-[pulseDot_1s_ease-in-out_infinite]" />
              rendering engine
            </span>
            <span className="text-zinc-700">•</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-[pulseDot_1s_ease-in-out_infinite_0.2s]" />
              geometry &amp; history
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

