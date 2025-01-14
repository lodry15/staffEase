import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyDIjdohaR0xCuq3qGkWrrMqR3gvNS7eiwI",
  authDomain: "staffease-81e04.firebaseapp.com",
  projectId: "staffease-81e04",
  storageBucket: "staffease-81e04.firebasestorage.app",
  messagingSenderId: "427202649255",
  appId: "1:427202649255:web:368bd337fad107176c4f82"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Set persistence to LOCAL to keep user logged in
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });