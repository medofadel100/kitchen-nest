import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, where } from "firebase/firestore";
import { KitchenTemplate } from "@/types";

const TEMPLATES_COLLECTION = "templates";

// Fetch all templates for the current workshop
export const getTemplates = async (workshopId: string = "default_workshop"): Promise<KitchenTemplate[]> => {
  try {
    const q = query(collection(db, TEMPLATES_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KitchenTemplate))
      .filter(tpl => tpl.workshopId === workshopId);
  } catch (error) {
    console.error("Error fetching templates: ", error);
    return [];
  }
};

// Fetch a single template by ID
export const getTemplateById = async (templateId: string): Promise<KitchenTemplate | null> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as KitchenTemplate;
    }
    return null;
  } catch (error) {
    console.error("Error fetching template: ", error);
    return null;
  }
};

// Create a new template
export const createTemplate = async (template: Omit<KitchenTemplate, "id">): Promise<KitchenTemplate> => {
  try {
    const newDocRef = doc(collection(db, TEMPLATES_COLLECTION));
    const newTemplate = { ...template, id: newDocRef.id };
    await setDoc(newDocRef, newTemplate);
    return newTemplate as KitchenTemplate;
  } catch (error) {
    console.error("Error creating template: ", error);
    throw error;
  }
};

// Update an existing template
export const updateTemplate = async (templateId: string, data: Partial<KitchenTemplate>): Promise<void> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating template: ", error);
    throw error;
  }
};

// Delete a template
export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting template: ", error);
    throw error;
  }
};
