"use client";

import React from "react";
import { ProjectCostSummary } from "@/types";
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

interface SmartPricingSuggestionProps {
  pricingResult: ProjectCostSummary;
  profitMargin: number;
}

export const SmartPricingSuggestion = ({
  pricingResult,
  profitMargin,
}: SmartPricingSuggestionProps) => {
  const cost = pricingResult.subtotalBeforeMargin;
  const lowPrice = cost * 1.3;
  const highPrice = cost * 1.5;
  const userPrice = pricingResult.grandTotal;

  // Determine competitiveness
  let status: "competitive" | "below" | "above";
  if (userPrice >= lowPrice && userPrice <= highPrice) {
    status = "competitive";
  } else if (userPrice < lowPrice) {
    status = "below";
  } else {
    status = "above";
  }

  const statusConfig = {
    competitive: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      label: "متنافس",
      icon: CheckCircle,
    },
    below: {
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      label: "أقل من السوق",
      icon: AlertTriangle,
    },
    above: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      label: "أعلى من السوق",
      icon: AlertTriangle,
    },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  // Bar chart calculation
  const barMin = lowPrice * 0.85;
  const barMax = highPrice * 1.15;
  const barRange = barMax - barMin;
  const lowPos = ((lowPrice - barMin) / barRange) * 100;
  const highPos = ((highPrice - barMin) / barRange) * 100;
  const userPos = Math.min(100, Math.max(0, ((userPrice - barMin) / barRange) * 100));

  const costBreakdown = [
    { label: "الخامات", value: pricingResult.totalMaterialCost },
    { label: "شريط الحرف", value: pricingResult.totalEdgeBandingCost },
    { label: "الإكسسوارات", value: pricingResult.totalAccessoriesCost },
    { label: "كاونترتوب", value: pricingResult.countertopCost },
    { label: "الحوض", value: pricingResult.sinkCost },
    { label: "الخلاط", value: pricingResult.faucetCost },
  ].filter((item) => item.value > 0);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-900/80">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="text-emerald-500" />
          تحليل التسعير الذكي
        </h2>
        <p className="text-zinc-500 text-sm mt-1">مقارنة بأسعار السوق المصري للمطابخ</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Cost Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
            <DollarSign size={16} />
            توزيع التكلفة
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {costBreakdown.map((item) => (
              <div key={item.label} className="bg-zinc-800/50 rounded-xl p-3">
                <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                <p className="text-sm font-bold font-mono text-white">
                  {item.value.toLocaleString()} <span className="text-xs text-zinc-500">EGP</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-zinc-800/80 rounded-xl p-3 flex justify-between items-center border border-zinc-700/50">
            <span className="text-sm font-bold text-zinc-300">إجمالي التكلفة قبل الربح</span>
            <span className="text-lg font-black font-mono text-white">
              {cost.toLocaleString()} <span className="text-sm text-zinc-500">EGP</span>
            </span>
          </div>
        </div>

        {/* Market Range */}
        <div>
          <h3 className="text-sm font-bold text-zinc-400 mb-4">نطاق السعر في السوق (هامش 30%-50%)</h3>

          {/* Bar chart */}
          <div className="relative h-16 bg-zinc-800 rounded-xl overflow-hidden">
            {/* Market range band */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/20 border-y-2 border-emerald-500/40"
              style={{ left: `${lowPos}%`, width: `${highPos - lowPos}%` }}
            />
            {/* Low marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400"
              style={{ left: `${lowPos}%` }}
            />
            <div
              className="absolute -top-5 text-[10px] text-emerald-400 font-bold font-mono"
              style={{ left: `${lowPos}%`, transform: "translateX(-50%)" }}
            >
              {lowPrice.toLocaleString()}
            </div>
            {/* High marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400"
              style={{ left: `${highPos}%` }}
            />
            <div
              className="absolute -top-5 text-[10px] text-emerald-400 font-bold font-mono"
              style={{ left: `${highPos}%`, transform: "translateX(-50%)" }}
            >
              {highPrice.toLocaleString()}
            </div>

            {/* User price marker */}
            <div
              className="absolute top-0 bottom-0 w-1 rounded-full"
              style={{
                left: `${userPos}%`,
                backgroundColor:
                  status === "competitive"
                    ? "#10b981"
                    : status === "below"
                    ? "#eab308"
                    : "#ef4444",
                transform: "translateX(-50%)",
              }}
            />
            <div
              className="absolute bottom-[-22px] text-[10px] font-bold font-mono whitespace-nowrap"
              style={{
                left: `${userPos}%`,
                transform: "translateX(-50%)",
                color:
                  status === "competitive"
                    ? "#10b981"
                    : status === "below"
                    ? "#eab308"
                    : "#ef4444",
              }}
            >
              سعرك: {userPrice.toLocaleString()}
            </div>

            {/* Center labels */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs text-zinc-400 font-bold">
                {lowPrice.toLocaleString()} — {highPrice.toLocaleString()} EGP
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-zinc-700/30">
            <p className="text-xs text-zinc-500 mb-1">هامش الربح المستخدم</p>
            <p className="text-2xl font-black text-white">{profitMargin}%</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-zinc-700/30">
            <p className="text-xs text-zinc-500 mb-1">السعر المقترح (منخفض)</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">
              {lowPrice.toLocaleString()} <span className="text-sm">EGP</span>
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-zinc-700/30">
            <p className="text-xs text-zinc-500 mb-1">السعر المقترح (مرتفع)</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">
              {highPrice.toLocaleString()} <span className="text-sm">EGP</span>
            </p>
          </div>
        </div>

        {/* Competitiveness Indicator */}
        <div
          className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 flex items-center gap-3`}
        >
          <StatusIcon className={`${cfg.color} shrink-0`} size={24} />
          <div>
            <p className={`font-bold ${cfg.color}`}>تقييم التنافسية: {cfg.label}</p>
            <p className="text-sm text-zinc-400 mt-1">
              {status === "competitive" &&
                "سعرك ضمن نطاق السوق المتوقع — ممتاز للمحافظة على حجم الأعمال."}
              {status === "below" &&
                "سعرك أقل من متوسط السوق. قد تحقق مبيعات أعلى لكن بهامش ربح أقل."}
              {status === "above" &&
                "سعرك أعلى من متوسط السوق. تأكد من تقديم قيمة مضافة تبرر السعر (جودة عالية، ضمان، تسليم سريع)."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
