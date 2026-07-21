import { NextRequest, NextResponse } from 'next/server';
import type { KitchenProject } from '@/types';

type ApprovalAction = "approve" | "request_revision";

// محاولة استخدام Admin SDK، fallback للـ client SDK لو مش متاح
async function queryProjectByShareToken(shareToken: string): Promise<KitchenProject | null> {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    const snapshot = await db
      .collection('projects')
      .where('shareToken', '==', shareToken)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...(docSnap.data() as Omit<KitchenProject, 'id'>) };
  } catch {
    // Fallback: use client Firestore when Admin SDK is not configured
    const { db } = await import('@/lib/firebase');
    const { collection, query, where, getDocs, limit: fsLimit } = await import('firebase/firestore');
    const q = query(collection(db, 'projects'), where('shareToken', '==', shareToken), fsLimit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...(docSnap.data() as Omit<KitchenProject, 'id'>) };
  }
}

// GET /api/share/[shareToken] — Public read via safe random token
export async function GET(
  _request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const project = await queryProjectByShareToken(params.shareToken);

    if (!project) {
      return NextResponse.json(
        { error: 'رابط المشاركة غير صحيح أو انتهت صلاحيته.' },
        { status: 404 }
      );
    }

    // ⛔ لا نكشف أي بيانات تكلفة داخلية للورشة
    const grandTotal = (project as any).grandTotal ?? null;
    const grandTotalWithVat = (project as any).grandTotalWithVat ?? (project as any).grandTotal_with_vat ?? null;

    return NextResponse.json({
      id: project.id,
      projectName: project.projectName,
      clientName: project.clientName,
      clientPhone: project.clientPhone,
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
      quoteGrandTotalWithVat: grandTotalWithVat ?? grandTotal,

      // ✅ بيانات الموافقة (للعميل)
      approvalStatus: project.approvalStatus,
      approvalNote: project.approvalNote,
      approvalDate: project.approvalDate,

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

// POST /api/share/[shareToken] — Client approves or requests revision
export async function POST(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const body = await request.json();
    const { action, note } = body as { action: ApprovalAction; note?: string };

    if (!action || !["approve", "request_revision"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'request_revision'." },
        { status: 400 }
      );
    }

    const project = await queryProjectByShareToken(params.shareToken);
    if (!project) {
      return NextResponse.json(
        { error: "رابط المشاركة غير صحيح." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const approvalStatus = action === "approve" ? "approved" : "revision_requested";
    const status = action === "approve" ? "approved" : "client_review";

    const updateData: Partial<KitchenProject> = {
      approvalStatus,
      status,
      approvalDate: now,
      approvalNote: note || undefined,
      updatedAt: now,
    };

    // Update via Admin SDK or client SDK fallback
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      const db = getAdminDb();
      await db.collection('projects').doc(project.id).update(updateData);
    } catch {
      const { db } = await import('@/lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'projects', project.id), updateData as any);
    }

    return NextResponse.json({
      success: true,
      approvalStatus,
      message: action === "approve"
        ? "تمت الموافقة على التصميم بنجاح!"
        : "تم إرسال طلب التعديل بنجاح.",
    });
  } catch (error) {
    console.error("Approval API Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

