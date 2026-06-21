import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { FileUp, Search, X, Loader2, Calendar } from 'lucide-react';
import { addMaterial, addFlashcards, addQuiz } from '../lib/db';
import { getAccessToken } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User;
  token: string | null;
}

export default function Dashboard({ user, token }: DashboardProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const fetchDriveFiles = async () => {
    if (!token) return;
    setLoadingFiles(true);
    try {
      const res = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/pdf'&fields=files(id,name,iconLink)", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (showPicker) {
      fetchDriveFiles();
    }
  }, [showPicker, token]);

  const handleSelectFile = async (file: any) => {
    setShowPicker(false);
    setProcessing(true);
    
    try {
      const apiUrl = '/api/generate-study-material';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, accessToken: token })
      });
      
      if (!res.ok) {
        throw new Error("Erro ao processar PDF. " + await res.text());
      }
      
      const parsed = await res.json();
      
      // Save to Firebase
      const materialId = await addMaterial({
        title: file.name.replace('.pdf', ''),
        sourceType: 'drive',
        driveFileId: file.id,
        createdAt: Date.now(),
        userId: user.uid,
        mindmap: parsed.mindmap
      });

      const flashcards = parsed.flashcards.map((fc: any) => ({
        ...fc,
        userId: user.uid,
        materialId,
        nextReviewDate: Date.now(),
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0
      }));
      
      if (flashcards.length > 0) {
        await addFlashcards(flashcards);
      }
      
      if (parsed.quiz && parsed.quiz.length > 0) {
        await addQuiz({
          userId: user.uid,
          materialId,
          questions: parsed.quiz
        });
      }
      
      alert('Material processado com sucesso!');
      navigate('/study');
      
    } catch (err) {
      console.error(err);
      alert(`Falha ao processar material: ${(err as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  const scheduleStudy = async () => {
    if (!token) return;
    try {
      const event = {
        summary: 'Sessão de Estudos: AeroMechanic',
        description: 'Revisão diária de flashcards e materiais.',
        start: { dateTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: new Date(Date.now() + 1000 * 60 * 120).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      if (res.ok) alert('Agendado no seu Google Calendar!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Olá, {user.displayName?.split(' ')[0]}</h2>
        <p className="text-slate-500">O que vamos estudar hoje?</p>
      </header>

      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowPicker(true)}
          disabled={processing}
          className="flex flex-col items-center justify-center p-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors shadow-sm disabled:opacity-75"
        >
          {processing ? (
             <><Loader2 className="w-10 h-10 mb-4 animate-spin" /><span className="font-semibold text-lg">Analisando PDF com Gemini...</span><span className="text-sm text-blue-200 mt-2">Extraindo e gerando questões e mapa mental</span></>
          ) : (
            <><FileUp className="w-10 h-10 mb-4" /><span className="font-semibold text-lg">Importar PDF do Drive</span><span className="text-sm text-blue-200 mt-2">Gera flashcards, quizzes e mapa mental</span></>
          )}
        </button>

        <button
          onClick={scheduleStudy}
          className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 rounded-2xl transition-colors shadow-sm"
        >
          <Calendar className="w-10 h-10 mb-4 text-blue-500" />
          <span className="font-semibold text-lg">Agendar Estudo</span>
          <span className="text-sm text-slate-500 mt-2">Cria um lembrete no Google Calendar</span>
        </button>
      </div>

      {/* Drive File Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Selecionar PDF no Drive</h3>
              <button onClick={() => setShowPicker(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {loadingFiles ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
              ) : driveFiles.length === 0 ? (
                <p className="text-center text-slate-500 p-8">Nenhum PDF encontrado no seu Google Drive.</p>
              ) : (
                <ul className="space-y-2">
                  {driveFiles.map(f => (
                    <li key={f.id}>
                      <button onClick={() => handleSelectFile(f)} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center space-x-3 transition-colors border border-transparent hover:border-slate-200">
                        <img src={f.iconLink} alt="pdf" className="w-6 h-6" />
                        <span className="truncate flex-1 font-medium text-slate-700">{f.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
