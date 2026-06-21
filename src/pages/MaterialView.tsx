import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Material } from '../types';
import { ArrowLeft, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function MaterialView() {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<number>(0);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const ref = doc(db, 'materials', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setMaterial({ id: snap.id, ...snap.data() } as Material);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando conteúdo...</div>;
  if (!material) return <div className="p-8 text-center text-slate-500">Material não encontrado.</div>;
  if (!material.topics || material.topics.length === 0) {
    return (
        <div className="p-8 text-center text-slate-500">
            <p>O conteúdo em tópicos ainda não está disponível para este material.</p>
            <Link to="/study" className="text-blue-600 mt-4 inline-block hover:underline">Voltar</Link>
        </div>
    );
  }

  const currentContent = material.topics[activeTopic];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] -m-4 sm:-m-6 md:-m-8">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center shrink-0">
        <Link to="/study" className="p-2 hover:bg-slate-100 rounded-full mr-2 text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-semibold text-slate-800 flex-1 truncate">{material.title}</h1>
        <BookOpen size={20} className="text-slate-400" />
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Menu de Tópicos (sidebar no desktop, scroll horizontal no mobile) */}
        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 shrink-0 overflow-y-auto overflow-x-auto flex flex-row md:flex-col p-2 space-y-0 md:space-y-1 space-x-2 md:space-x-0">
          {material.topics.map((topic, index) => (
            <button
              key={index}
              onClick={() => setActiveTopic(index)}
              className={`text-left px-4 py-3 md:py-4 rounded-xl md:rounded-lg text-sm transition-all whitespace-nowrap md:whitespace-normal shrink-0 max-w-[200px] md:max-w-none ${
                activeTopic === index 
                ? 'bg-blue-100 text-blue-800 font-medium shadow-sm' 
                : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <span className="md:line-clamp-2">{topic.title}</span>
            </button>
          ))}
        </div>

        {/* Área de Leitura */}
        <div className="flex-1 overflow-y-auto bg-white p-4 md:p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
              {currentContent.title}
            </h2>
            <div className="prose prose-slate prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-600">
                <ReactMarkdown>{currentContent.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
