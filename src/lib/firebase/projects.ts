import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, where } from "firebase/firestore";
import { KitchenProject } from "@/types";

const PROJECTS_COLLECTION = "projects";

// Fetch all projects for the current workshop
export const getProjects = async (workshopId: string = "default_workshop"): Promise<KitchenProject[]> => {
  try {
    const q = query(collection(db, PROJECTS_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KitchenProject))
      .filter(proj => proj.workshopId === workshopId);
  } catch (error) {
    console.error("Error fetching projects: ", error);
    return [];
  }
};

// Fetch a single project by ID - PUBLIC READ for share links
export const getProjectById = async (projectId: string): Promise<KitchenProject | null> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as KitchenProject;
    }
    return null;
  } catch (error) {
    console.error("Error fetching project: ", error);
    return null;
  }
};

// Fetch a project by its public shareToken — آمن: Token عشوائي 16 حرف غير قابل للتخمين
export const getProjectByShareToken = async (shareToken: string): Promise<KitchenProject | null> => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("shareToken", "==", shareToken)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as KitchenProject;
  } catch (error) {
    console.error("Error fetching project by shareToken: ", error);
    return null;
  }
};

// Create a new project
export const createProject = async (project: Omit<KitchenProject, "id">): Promise<KitchenProject> => {
  try {
    const newDocRef = doc(collection(db, PROJECTS_COLLECTION));
    const newProject = { ...project, id: newDocRef.id };
    await setDoc(newDocRef, newProject);
    return newProject as KitchenProject;
  } catch (error) {
    console.error("Error creating project: ", error);
    throw error;
  }
};

// Firestore rejects `undefined` values — recursively strip them
const stripUndefined = (obj: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        v !== null && typeof v === "object" && !Array.isArray(v)
          ? stripUndefined(v as Record<string, unknown>)
          : v,
      ])
  );
};

// Update an existing project
export const updateProject = async (projectId: string, data: Partial<KitchenProject>): Promise<void> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(docRef, stripUndefined(data as Record<string, unknown>) as any);
  } catch (error) {
    console.error("Error updating project: ", error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting project: ", error);
    throw error;
  }
};