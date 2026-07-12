import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { KitchenProject } from '@/types';

// GET /api/public-project/[id] - Public read access (Admin SDK, bypasses Security Rules)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getAdminDb();
    const docRef = db.collection('projects').doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = { id: docSnap.id, ...(docSnap.data() as Omit<KitchenProject, 'id'>) };

    // ⚠️ نكشف بس البيانات الآمنة للعرض — مش بيانات تكلفة داخلية
    return NextResponse.json({
      id: project.id,
      projectName: project.projectName,
      clientName: project.clientName,
      clientPhone: project.clientPhone,
      projectAddress: project.projectAddress,
      engineerName: project.engineerName,
      projectSource: project.projectSource,
      officeName: project.officeName,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      status: project.status,
      room: project.room,
      units: project.units,
      appliances: project.appliances,
      selectedCountertopId: project.selectedCountertopId,
      selectedSinkId: project.selectedSinkId,
      selectedFaucetId: project.selectedFaucetId,
      countertopLengthM: project.countertopLengthM,
      deliveryDate: project.deliveryDate,
      // ⛔ profitMarginPercent / settings / payments — محذوفة عمدًا
    });
  } catch (error) {
    console.error('Error fetching public project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}