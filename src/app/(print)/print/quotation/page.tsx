"use client";

import React, { useEffect, useState } from 'react';
import { QuotationPrint } from '@/components/print/QuotationPrint';
import { KitchenProject, KitchenUnit, ProjectCostSummary } from '@/types';

export default function QuotationPrintPage() {
  const [data, setData] = useState<{ project: KitchenProject, pricing: ProjectCostSummary, units: KitchenUnit[] } | null>(null);

  useEffect(() => {
    try {
      const project = JSON.parse(localStorage.getItem('print_project') || 'null');
      const pricing = JSON.parse(localStorage.getItem('print_pricing') || 'null');
      const units = JSON.parse(localStorage.getItem('print_units') || 'null');

      if (project && pricing && units) {
        setData({ project, pricing, units });
        setTimeout(() => {
          window.print();
        }, 500);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (!data) return <div className="p-8 text-center">جاري تحميل البيانات...</div>;

  return <QuotationPrint project={data.project} pricingResult={data.pricing} units={data.units} />;
}
