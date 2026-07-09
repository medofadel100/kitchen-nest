import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from "firebase/firestore";
import { InventoryItem, InventoryTransaction } from "@/types";

const INVENTORY_COLLECTION = "inventory";

// Get all inventory items for a workshop
export const getInventory = async (workshopId: string): Promise<InventoryItem[]> => {
  try {
    const q = query(collection(db, INVENTORY_COLLECTION), where("workshopId", "==", workshopId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() } as InventoryItem));
  } catch (error) {
    console.error("Error fetching inventory: ", error);
    return [];
  }
};

// Update or add stock to an inventory item
export const addStock = async (
  workshopId: string, 
  itemId: string, 
  itemType: 'material' | 'hardware', 
  nameAr: string,
  quantityToAdd: number, 
  note?: string
): Promise<void> => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, `${workshopId}_${itemId}`);
    const docSnap = await getDoc(docRef);

    const transaction: InventoryTransaction = {
      id: Date.now().toString(),
      type: 'in',
      quantity: quantityToAdd,
      date: new Date().toISOString(),
      note
    };

    if (docSnap.exists()) {
      const currentData = docSnap.data() as InventoryItem;
      await updateDoc(docRef, {
        quantityInStock: currentData.quantityInStock + quantityToAdd,
        transactions: [...currentData.transactions, transaction],
        updatedAt: new Date().toISOString()
      });
    } else {
      const newItem: InventoryItem = {
        id: itemId,
        workshopId,
        itemType,
        nameAr,
        quantityInStock: quantityToAdd,
        transactions: [transaction],
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, newItem);
    }
  } catch (error) {
    console.error("Error adding stock: ", error);
    throw error;
  }
};

// Deduct stock for a project
export const deductStockForProject = async (
  workshopId: string, 
  projectId: string, 
  deductions: { itemId: string, quantity: number }[]
): Promise<void> => {
  try {
    for (const deduction of deductions) {
      const docRef = doc(db, INVENTORY_COLLECTION, `${workshopId}_${deduction.itemId}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentData = docSnap.data() as InventoryItem;
        
        const transaction: InventoryTransaction = {
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          type: 'out',
          quantity: deduction.quantity,
          date: new Date().toISOString(),
          projectId,
          note: `سحب للتصنيع لمشروع #${projectId}`
        };

        await updateDoc(docRef, {
          quantityInStock: currentData.quantityInStock - deduction.quantity,
          transactions: [...currentData.transactions, transaction],
          updatedAt: new Date().toISOString()
        });
      } else {
        throw new Error(`Item ${deduction.itemId} not found in inventory!`);
      }
    }
  } catch (error) {
    console.error("Error deducting stock: ", error);
    throw error;
  }
};
