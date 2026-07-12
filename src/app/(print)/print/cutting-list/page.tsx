"use client";

import React, { useEffect, useState, useRef } from 'react';
import { CuttingListPrint } from '@/components/print/CuttingListPrint';
import { KitchenProject, Material, NestingResult } from '@/types';

export default function CuttingListPrintPage() {
  const [data, setData] = useState<{ project: KitchenProject, nestingDetails: { material: Material; result: NestingResult; piecesCount: number }[] } | null>(null);
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (hasPrinted.current) return;
    
    try {
      const project = JSON.parse(localStorage.getItem('print_project') || 'null');
      const nestingDetails = JSON.parse(localStorage.getItem('print_nesting') || 'null');

      if (project && nestingDetails) {
        setData({ project, nestingDetails });
        hasPrinted.current = true;
        setTimeout(() => {
          window.print();
        }, 1000);
      } else {
        console.error('Missing print data:', { project: !!project, nestingDetails: !!nestingDetails });
      }
    } catch (e) {
      console.error('Error loading print data:', e);
    }
  }, []);

  if (!data) return <div className="p-8 text-center text-red-600">خطأ: لم يتم العثور على بيانات الطباعة. يرجى المحاولة مرة أخرى من لوحة التحكم.</div>;

  return <CuttingListPrint project={data.project} nestingDetails={data.nestingDetails} />;
}
