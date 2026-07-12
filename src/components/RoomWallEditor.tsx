"use client";

import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { getWallsFromPolygon, wallListToPolygon, snapAngleToCommon, MIN_ROOM_POLYGON_VERTICES } from '@/lib/roomGeometry';
import { convertMmToDisplayUnit, convertDisplayUnitToMm } from '@/utils/measurements';
import { Plus, Trash2, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Common angle options for quick selection
const COMMON_ANGLES = [90, 45, 135, 180, 0, -90, -45, -135];

export const RoomWallEditor = () => {
  const { room, getRoomWalls, setRoomFromWallList, displayUnit, isSnappingEnabled, updateRoomDetails, visibleWalls, setVisibleWalls } = useProjectStore();
  const [walls, setWalls] = useState<{ lengthMm: number; angleDeg: number }[]>([]);
  const [closureError, setClosureError] = useState<string | null>(null);

  // Initialize walls from room polygon
  useEffect(() => {
    if (room && room.polygonMm && room.polygonMm.length >= 3) {
      const roomWalls = getWallsFromPolygon(room.polygonMm);
      const wallList = roomWalls.map((w, i) => {
        // Calculate turn angle (angle from previous wall)
        const prevWall = roomWalls[(i - 1 + roomWalls.length) % roomWalls.length];
        const turnAngle = w.angleDeg - prevWall.angleDeg;
        // Normalize to -180 to 180
        const normalizedAngle = ((turnAngle + 180) % 360) - 180;
        return {
          lengthMm: Math.round(w.lengthMm),
          angleDeg: Math.round(normalizedAngle),
        };
      });
      setWalls(wallList);
    }
  }, [room, getRoomWalls]);

  // Check if polygon closes properly
  useEffect(() => {
    if (walls.length > 0) {
      const polygon = wallListToPolygon(walls);
      const first = polygon[0];
      const last = polygon[polygon.length - 1];
      const dist = Math.hypot(last.xMm - first.xMm, last.yMm - first.yMm);
      
      if (dist > 50) {
        setClosureError(`الشكل غير مغلق - الفرق: ${Math.round(dist)} مم. عدل الزوايا لتغليق الشكل.`);
      } else {
        setClosureError(null);
      }
    }
  }, [walls]);

  const updateWallLength = (index: number, lengthMm: number) => {
    const newWalls = [...walls];
    newWalls[index] = { ...newWalls[index], lengthMm };
    setWalls(newWalls);
  };

  const updateWallAngle = (index: number, angleDeg: number) => {
    const newWalls = [...walls];
    if (isSnappingEnabled) {
      angleDeg = snapAngleToCommon(angleDeg, 10);
    }
    newWalls[index] = { ...newWalls[index], angleDeg };
    setWalls(newWalls);
  };

  const addWall = () => {
    setWalls([...walls, { lengthMm: 3000, angleDeg: 90 }]);
  };

  const deleteWall = (index: number) => {
    if (walls.length <= MIN_ROOM_POLYGON_VERTICES) return;
    const newWalls = walls.filter((_, i) => i !== index);
    setWalls(newWalls);
  };

  const applyChanges = () => {
    if (closureError) return;
    setRoomFromWallList(walls);
  };

  if (!room) {
    return (
      <div className="p-4 text-sm text-zinc-500 text-center">
        لا توجد غرفة محددة
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-bold text-zinc-400 mb-2 flex items-center gap-2">
        <span>تحرير الغرفة الرقمي</span>
        <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded">
          {walls.length} حواجز
        </span>
      </h3>

      <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800 mb-2">
        <span className="text-zinc-500 text-xs font-medium">
          ارتفاع الغرفة ({displayUnit}) <span className="text-red-400">*</span>
        </span>
        <input
          type="number"
          min={100}
          value={convertMmToDisplayUnit(room.heightMm, displayUnit)}
          onChange={(e) => updateRoomDetails(room.id, { heightMm: convertDisplayUnitToMm(Number(e.target.value), displayUnit) })}
          className="w-20 bg-transparent text-white font-mono text-sm text-left outline-none"
        />
      </div>

      {/* 👁️ إظهار/إخفاء الحوائط — ديناميكي حسب عدد الحوائط الفعلي */}
      <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800">
        <h4 className="text-[10px] font-bold text-zinc-500 mb-2 flex items-center gap-1.5">
          <Eye size={10} />
          إظهار / إخفاء الحوائط
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {(() => {
            const roomWalls = getWallsFromPolygon(room.polygonMm || []);
            return roomWalls.map((wall, i) => {
              const wallKey = i === 0 ? 'back' : i === 1 ? 'right' : i === 2 ? 'front' : i === 3 ? 'left' : `wall_${i}` as `wall_${number}`;
              const isVisible = visibleWalls[wallKey] ?? true;
              return (
                  <button
                    key={wall.id}
                    onClick={() => {
                      setVisibleWalls({ [wallKey as keyof typeof visibleWalls]: !isVisible });
                    }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                    isVisible
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'
                  }`}
                >
                  {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                  حائط {i + 1} ({convertMmToDisplayUnit(wall.lengthMm, displayUnit)})
                </button>
              );
            });
          })()}
        </div>
      </div>

      {closureError && (
        <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{closureError}</span>
        </div>
      )}

      <div className="max-h-64 min-h-0 overflow-y-auto custom-scrollbar">
        <table className="w-full text-xs">

          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="text-right pb-1">#</th>
              <th className="text-right pb-1">الطول</th>
              <th className="text-right pb-1">الزاوية</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {walls.map((wall, index) => (
              <tr key={index} className="border-b border-zinc-800/50 last:border-0">
                <td className="py-1.5 text-zinc-400">{index + 1}</td>
                <td className="py-1.5">
                  <input
                    type="number"
                    value={convertMmToDisplayUnit(wall.lengthMm, displayUnit)}
                    onChange={(e) => updateWallLength(index, convertDisplayUnitToMm(Number(e.target.value), displayUnit))}
                    className="w-16 bg-zinc-900/50 border border-zinc-700 rounded px-1 py-0.5 text-white font-mono text-left outline-none"
                  />
                </td>
                <td className="py-1.5">
                  <select
                    value={wall.angleDeg}
                    onChange={(e) => updateWallAngle(index, Number(e.target.value))}
                    className="w-16 bg-zinc-900/50 border border-zinc-700 rounded px-1 py-0.5 text-white font-mono outline-none"
                  >
                    {COMMON_ANGLES.map(angle => (
                      <option key={angle} value={angle} className="text-black">
                        {angle}°
                      </option>
                    ))}
                    <option value={wall.angleDeg} className="text-black">
                      {wall.angleDeg}° (مخصص)
                    </option>
                  </select>
                </td>
                <td className="py-1.5">
                  {walls.length > MIN_ROOM_POLYGON_VERTICES && (
                    <button
                      onClick={() => deleteWall(index)}
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={addWall}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors text-xs font-bold"
        >
          <Plus size={14} />
          إضافة حائط
        </button>
        <button
          onClick={applyChanges}
          disabled={!!closureError}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${
            closureError
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          تطبيق التغييرات
        </button>
      </div>

      <div className="text-[10px] text-zinc-600 pt-1">
        <p>ملاحظة: الزاوية تُقاس من الحيطان السابقة. 90° = الاستمرار مباشرة.</p>
      </div>
    </div>
  );
};