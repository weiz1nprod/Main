import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getMaterials } from '../lib/db';
import { db } from '../lib/firebase';
import { Material, Quiz } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FileText, PlayCircle, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudyList({ user }: { user: User }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const mats = await getMaterials(user.uid);
      setMaterials(mats);
      
      const qSnapshot = await getDocs(query(collection(db, 'quizzes'), where('userId', '==', user.uid)));
      const qzData: Record<string, Quiz[]> = {};
      qSnapshot.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() } as Quiz;
        if (!qzData[data.materialId]) qzData[data.materialId] = [];
        qzData[data.materialId].push(data);
      });
      setQuizzes(qzData);
      setLoading(false);
    }
    load();
  }, [user.uid]);

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando materiais...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Meus Materiais</h2>
      
      {materials.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          Você ainda não importou nenhum PDF.<br />Vá para a aba Início para adicionar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(mat => (
            <div key={mat.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex space-x-3 items-start mb-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 line-clamp-2" title={mat.title}>{mat.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{new Date(mat.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 mt-4">
                {mat.mindmap && (
                  <Link to={`/mindmap/${mat.id}`} className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-blue-600 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <Network size={18} />
                    <span>Ver Mapa Mental</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
