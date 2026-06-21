import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Flashcard, Quiz, Material, MindMapData, ForumPost } from '../types';

export const addMaterial = async (material: Omit<Material, 'id'>) => {
  const docRef = await addDoc(collection(db, 'materials'), material);
  return docRef.id;
};

export const getMaterials = async (userId: string) => {
  const q = query(collection(db, 'materials'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
};

export const addFlashcards = async (flashcards: Omit<Flashcard, 'id'>[]) => {
  const promises = flashcards.map(fc => addDoc(collection(db, 'flashcards'), fc));
  await Promise.all(promises);
};

export const getDueFlashcards = async (userId: string, targetDate: number) => {
  const q = query(
    collection(db, 'flashcards'),
    where('userId', '==', userId),
    where('nextReviewDate', '<=', targetDate)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
};

export const updateFlashcard = async (id: string, data: Partial<Flashcard>) => {
  const docRef = doc(db, 'flashcards', id);
  await updateDoc(docRef, data);
};

export const addQuiz = async (quiz: Omit<Quiz, 'id'>) => {
  const docRef = await addDoc(collection(db, 'quizzes'), quiz);
  return docRef.id;
};

export const getForumPosts = async () => {
  const snapshot = await getDocs(collection(db, 'forumPosts'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
};

export const addForumPost = async (post: Omit<ForumPost, 'id'>) => {
  const docRef = await addDoc(collection(db, 'forumPosts'), post);
  return docRef.id;
};

export const addCommentToPost = async (postId: string, comment: ForumPost['comments'][0], currentComments: ForumPost['comments']) => {
   const newComments = [...(currentComments || []), comment];
   const docRef = doc(db, 'forumPosts', postId);
   await updateDoc(docRef, { comments: newComments });
};
