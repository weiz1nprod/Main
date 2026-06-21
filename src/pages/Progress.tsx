import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Flashcard } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Progress({ user }: { user: User }) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'flashcards'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setFlashcards(snap.docs.map(d => d.data() as Flashcard));
      setLoading(false);
    }
    load();
  }, [user.uid]);

  if (loading) return <div className="p-8">Carregando progresso...</div>;

  const newCards = flashcards.filter(f => f.repetitions === 0).length;
  const learningCards = flashcards.filter(f => f.repetitions > 0 && f.easeFactor < 2.5).length;
  const masteredCards = flashcards.filter(f => f.repetitions > 0 && f.easeFactor >= 2.5).length;

  const data = [
    { name: 'Novos', value: newCards, color: '#94A3B8' },
    { name: 'Aprendendo', value: learningCards, color: '#3B82F6' },
    { name: 'Dominados', value: masteredCards, color: '#22C55E' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Evolução Diária</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-700">{flashcards.length}</span>
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-2">Total de Cartões</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-blue-200 bg-blue-50/50 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-blue-700">{learningCards}</span>
          <span className="text-sm font-medium text-blue-600/80 uppercase tracking-wider mt-2">Em Aprendizado</span>
        </div>
         <div className="bg-white p-6 rounded-2xl border border-green-200 bg-green-50/50 shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-green-700">{masteredCards}</span>
          <span className="text-sm font-medium text-green-600/80 uppercase tracking-wider mt-2">Dominados</span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-8">
        <h3 className="font-bold text-slate-800 mb-6 text-center">Distribuição de Conhecimento</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
