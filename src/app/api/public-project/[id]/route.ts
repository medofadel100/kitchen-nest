import { NextRequest, NextResponse } from 'next/server';
import type { KitchenProject } from '@/types';

async function getProjectById(id: string): Promise<KitchenProject | null> {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    const docSnap = await db.collection('projects').doc(id).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...(docSnap.data() as Omit<KitchenProject, 'id'>) };
  } catch {
    const { db } = await import('@/lib/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(doc(db, 'projects', id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...(docSnap.data() as Omit<KitchenProject, 'id'>) };
  }
}

// GET /api/public-project/[id] - Public read access
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await getProjectById(params.id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

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
