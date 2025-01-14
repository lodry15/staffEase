import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  QueryConstraint,
  query,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { db } from '../firebase';

export class FirestoreError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError: Error
  ) {
    super(message);
    this.name = 'FirestoreError';
  }
}

export async function addDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data);
  } catch (error) {
    throw new FirestoreError(
      'add-document-failed',
      `Failed to add document to ${collectionName}`,
      error as Error
    );
  }
}

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  } catch (error) {
    throw new FirestoreError(
      'get-document-failed',
      `Failed to get document from ${collectionName}`,
      error as Error
    );
  }
}

export async function getCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  } catch (error) {
    throw new FirestoreError(
      'get-collection-failed',
      `Failed to get collection ${collectionName}`,
      error as Error
    );
  }
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
  } catch (error) {
    throw new FirestoreError(
      'update-document-failed',
      `Failed to update document in ${collectionName}`,
      error as Error
    );
  }
}

export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    throw new FirestoreError(
      'delete-document-failed',
      `Failed to delete document from ${collectionName}`,
      error as Error
    );
  }
}