import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
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

// Fetch a single project by ID
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

// Update an existing project
export const updateProject = async (projectId: string, data: Partial<KitchenProject>): Promise<void> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(docRef, data);
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
