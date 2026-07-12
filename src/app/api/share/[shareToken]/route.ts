import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { KitchenProject } from '@/types';

// GET /api/share/[shareToken] — Public read via safe random token (Admin SDK, bypasses Security Rules)
export async function GET(
  _request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const db = getAdminDb();

    // Query projects collection by shareToken field
    const snapshot = await db
      .collection('projects')
      .where('shareToken', '==', params.shareToken)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'رابط المشاركة غير صحيح أو انتهت صلاحيته.' },
        { status: 404 }
      );
    }

    const docSnap = snapshot.docs[0];
    const project = {
      id: docSnap.id,
      ...(docSnap.data() as Omit<KitchenProject, 'id'>),
    };

    // ⛔ لا نكشف أي بيانات تكلفة داخلية للورشة
    const grandTotal = (project as any).grandTotal ?? null;
    const grandTotalWithVat = (project as any).grandTotalWithVat ?? (project as any).grandTotal_with_vat ?? null;

    return NextResponse.json({
      id: project.id,
      projectName: project.projectName,
      clientName: project.clientName,
      projectAddress: project.projectAddress,
      engineerName: project.engineerName,
      officeName: project.officeName,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      status: project.status,
      deliveryDate: project.deliveryDate,
      room: project.room,
      units: project.units,
      appliances: project.appliances,
      selectedCountertopId: project.selectedCountertopId,
      selectedSinkId: project.selectedSinkId,
      selectedFaucetId: project.selectedFaucetId,
      countertopLengthM: project.countertopLengthM,

      // ✅ إجمالي سعر واحد فقط (شاملة VAT) — لو موجود في الـ doc
      // لو المشروع لا يخزن grandTotalWithVat فعليًا، هنسترجع قيم من الحقول المحتملة.
      quoteGrandTotalWithVat: grandTotalWithVat ?? grandTotal,

      // ⚠️ مش بنكشف: profitMarginPercent / payments / workshopId
    });
  } catch (error) {
    console.error("Share API Error:", error);

    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

