import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'content_items'

export function useContentItems() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q,
      (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          // Convertir Timestamp Firestore → Date JS
          scheduledDate: d.data().scheduledDate?.toDate?.() ?? null,
          createdAt:     d.data().createdAt?.toDate?.()     ?? null,
        }))
        setItems(data)
        setLoading(false)
      },
      (err) => {
        console.error('Firestore error:', err)
        setError(err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const addItem = async (item) => {
    await addDoc(collection(db, COLLECTION), {
      ...item,
      scheduledDate: item.scheduledDate ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const updateItem = async (id, updates) => {
    await updateDoc(doc(db, COLLECTION, id), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id))
  }

  return { items, loading, error, addItem, updateItem, deleteItem }
}
