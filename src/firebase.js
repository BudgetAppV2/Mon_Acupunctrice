import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAe8Rwy_oOq8F4pLharn_cfj2gQc3RLTEg",
  authDomain: "mon-acupunctrice-hub.firebaseapp.com",
  projectId: "mon-acupunctrice-hub",
  storageBucket: "mon-acupunctrice-hub.firebasestorage.app",
  messagingSenderId: "431888629563",
  appId: "1:431888629563:web:f129e44615e5194faf411e"
}

const app = initializeApp(firebaseConfig)
export const db      = getFirestore(app)
export const storage = getStorage(app)
