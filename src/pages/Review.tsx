import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getDueFlashcards, updateFlashcard } from '../lib/db';
import { Flashcard } from '../types';
import { calculateSM2 } from '../lib/sm2';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function Review({ user }: { user: User }) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function fetchDue() {
      const dueCards = await getDueFlashcards(user.uid, Date.now());
      setFlashcards(dueCards);
      setLoading(false);
    }
    fetchDue();
  }, [user.uid]);

  const currentCard = flashcards[currentIndex];

  const handleScore = async (quality: number) => {
    if (!currentCard) return;
    
    // SuperMemo-2 calculation
    const result = calculateSM2(
      quality,
      currentCard.repetitions || 0,
      currentCard.interval || 0,
      currentCard.easeFactor || 2.5
    );

    // Optimistically update UI
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(c => c + 1);
      setShowAnswer(false);
    } else {
      setCompleted(true);
    }

    // Save to DB in background
    await updateFlashcard(currentCard.id, {
      nextReviewDate: result.nextReviewDate,
      interval: result.interval,
      easeFactor: result.easeFactor,
      repetitions: result.repetitions
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Buscando flashcards...</div>;

  if (completed || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center p-8">
        <CheckCircle2 size={64} className="text-green-500 mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tudo em dia!</h2>
        <p className="text-slate-500 mt-2 max-w-sm">Você revisou todos os flashcards pendentes de hoje. O algoritmo de repetição espaçada programará a próxima revisão.</p>
        <button onClick={() => window.location.reload()} className="mt-8 flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-800">
          <RotateCcw size={18} />
          <span>Verificar novamente</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Revisão Espaçada</h2>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">{currentIndex + 1} de {flashcards.length}</span>
      </div>

      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col"
        onClick={() => !showAnswer && setShowAnswer(true)}
      >
        <div className="p-8 md:p-12 flex-1 flex flex-col justify-center items-center text-center cursor-pointer">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-800">{currentCard.question}</h3>
          
          {!showAnswer && (
            <p className="text-slate-400 mt-8 text-sm animate-pulse">Toque para ver a resposta</p>
          )}

          {showAnswer && (
            <div className="mt-8 pt-8 border-t border-slate-100 w-full animate-in fade-in slide-in-from-bottom-4">
              <p className="text-xl md:text-2xl text-slate-600 font-medium">{currentCard.answer}</p>
            </div>
          )}
        </div>

        {showAnswer && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 grid grid-cols-4 gap-2">
            <button onClick={() => handleScore(0)} className="py-3 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition-colors">Errei</button>
            <button onClick={() => handleScore(3)} className="py-3 bg-orange-100 text-orange-700 rounded-xl font-semibold hover:bg-orange-200 transition-colors">Difícil</button>
            <button onClick={() => handleScore(4)} className="py-3 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition-colors">Bom</button>
            <button onClick={() => handleScore(5)} className="py-3 bg-green-100 text-green-700 rounded-xl font-semibold hover:bg-green-200 transition-colors">Fácil</button>
          </div>
        )}
      </div>
    </div>
  );
}
