"use client";

import React, { useEffect, useState, useRef } from 'react';
import { QuotationPrint } from '@/components/print/QuotationPrint';
import { KitchenProject, KitchenUnit, ProjectCostSummary } from '@/types';

export default function QuotationPrintPage() {
  const [data, setData] = useState<{ project: KitchenProject, pricing: ProjectCostSummary, units: KitchenUnit[] } | null>(null);
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (hasPrinted.current) return;
    
    try {
      const project = JSON.parse(localStorage.getItem('print_project') || 'null');
      const pricing = JSON.parse(localStorage.getItem('print_pricing') || 'null');
      const units = JSON.parse(localStorage.getItem('print_units') || 'null');

      if (project && pricing && units) {
        setData({ project, pricing, units });
        hasPrinted.current = true;
        setTimeout(() => {
          window.print();
        }, 1000);
      } else {
        console.error('Missing print data:', { project: !!project, pricing: !!pricing, units: !!units });
      }
    } catch (e) {
      console.error('Error loading print data:', e);
    }
  }, []);

  if (!data) return <div className="p-8 text-center text-red-600">خطأ: لم يتم العثور على بيانات الطباعة. يرجى المحاولة مرة أخرى من لوحة التحكم.</div>;

  return <QuotationPrint project={data.project} pricingResult={data.pricing} units={data.units} />;
}
