import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { Employee } from "@/types";

const EMPLOYEES_COLLECTION = "employees";

export const getEmployees = async (workshopId: string): Promise<Employee[]> => {
  try {
    const q = query(collection(db, EMPLOYEES_COLLECTION), where("workshopId", "==", workshopId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
  } catch (error) {
    console.error("Error fetching employees: ", error);
    return [];
  }
};

export const createEmployee = async (employee: Omit<Employee, "id">): Promise<Employee> => {
  try {
    const newDocRef = doc(collection(db, EMPLOYEES_COLLECTION));
    const newEmployee = { ...employee, id: newDocRef.id };
    await setDoc(newDocRef, newEmployee);
    return newEmployee as Employee;
  } catch (error) {
    console.error("Error creating employee: ", error);
    throw error;
  }
};

export const updateEmployee = async (employeeId: string, data: Partial<Employee>): Promise<void> => {
  try {
    const docRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating employee: ", error);
    throw error;
  }
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  try {
    const docRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting employee: ", error);
    throw error;
  }
};
