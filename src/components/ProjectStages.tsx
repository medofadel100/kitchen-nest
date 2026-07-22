"use client";

import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { PROJECT_STAGES, ProjectStage } from '@/types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

export const ProjectStages: React.FC = () => {
  const { projectDetails } = useProjectStore();
  const stagesLog = projectDetails?.stagesLog || [];
  const currentStage = projectDetails?.currentStage || 'design';

  const currentIdx = PROJECT_STAGES.findIndex(s => s.key === currentStage);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4">
      <h3 className="text-sm font-bold text-white mb-3">مراحل المشروع</h3>
      <div className="space-y-0">
        {PROJECT_STAGES.map((stage, idx) => {
          const log = stagesLog.find(l => l.stage === stage.key);
          const isCompleted = log?.completedAt;
          const isCurrent = stage.key === currentStage;
          const isPending = idx > currentIdx;

          return (
            <div key={stage.key} className="flex items-start gap-3 relative">
              {/* Vertical line connector */}
              {idx < PROJECT_STAGES.length - 1 && (
                <div className={`absolute right-[11px] top-6 w-0.5 h-full ${
                  isCompleted ? 'bg-emerald-500' : 'bg-zinc-800'
                }`} />
              )}

              {/* Status icon */}
              <div className="relative z-10 shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 size={22} className="text-emerald-500" />
                ) : isCurrent ? (
                  <Clock size={22} className="text-amber-400 animate-pulse" />
                ) : (
                  <Circle size={22} className="text-zinc-700" />
                )}
              </div>

              {/* Stage info */}
              <div className="pb-4 flex-1 min-w-0">
                <p className={`text-xs font-bold ${
                  isCompleted ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-zinc-600'
                }`}>
                  {stage.labelAr}
                </p>
                {isCompleted && log?.completedAt && (
                  <p className="text-[10px] text-zinc-600 font-mono">
                    {new Date(log.completedAt).toLocaleDateString('ar-EG')}
                  </p>
                )}
                {isCurrent && (
                  <p className="text-[10px] text-amber-500/60">المرحلة الحالية</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
