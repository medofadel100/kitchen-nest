"use client";

import React, { useEffect, useState } from 'react';
import { CuttingListPrint } from '@/components/print/CuttingListPrint';
import { KitchenProject, Material, NestingResult } from '@/types';

export default function CuttingListPrintPage() {
  const [data, setData] = useState<{ project: KitchenProject, nestingDetails: { material: Material; result: NestingResult; piecesCount: number }[] } | null>(null);

  useEffect(() => {
    try {
      const project = JSON.parse(localStorage.getItem('print_project') || 'null');
      const nestingDetails = JSON.parse(localStorage.getItem('print_nesting') || 'null');

      if (project && nestingDetails) {
        setData({ project, nestingDetails });
        setTimeout(() => {
          window.print();
        }, 500);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (!data) return <div className="p-8 text-center">جاري تحميل البيانات...</div>;

  return <CuttingListPrint project={data.project} nestingDetails={data.nestingDetails} />;
}
