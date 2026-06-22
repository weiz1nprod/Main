import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Quiz } from '../types';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export default function QuizView() {
  const { materialId } = useParams<{ materialId: string }>();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    async function load() {
      if (!materialId) return;
      const qSnapshot = await getDocs(query(collection(db, 'quizzes'), where('materialId', '==', materialId)));
      const loaded: Quiz[] = [];
      qSnapshot.docs.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as Quiz);
      });
      setQuizzes(loaded);
      setLoading(false);
    }
    load();
  }, [materialId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando questionário...</div>;
  if (quizzes.length === 0) return <div className="p-8 text-center text-slate-500">Questionário não encontrado.</div>;

  // Assume first quiz document has the questions
  const quiz = quizzes[0];
  const questions = quiz.questions;
  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (option: string) => {
    if (showExplanation) return;
    setSelectedOption(option);
    setShowExplanation(true);
    
    if (option === currentQuestion.correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(c => c + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
        <CheckCircle2 size={64} className="text-green-500 mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Questionário Concluído!</h2>
        <p className="text-slate-600 mt-2 text-lg">Você acertou {score} de {questions.length} perguntas.</p>
        
        <div className="mt-8 flex gap-4">
          <Link to="/study" className="px-6 py-3 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-colors">
            Voltar aos Materiais
          </Link>
          <button 
            onClick={() => {
              setCurrentQuestionIndex(0);
              setSelectedOption(null);
              setShowExplanation(false);
              setScore(0);
              setIsFinished(false);
            }} 
            className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Refazer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
            <Link to="/study" className="p-2 hover:bg-slate-100 rounded-full mr-2 text-slate-600 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Questionário</h2>
        </div>
        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
          Pergunta {currentQuestionIndex + 1} de {questions.length}
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-8">{currentQuestion.question}</h3>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            
            let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all ";
            
            if (!showExplanation) {
              btnClass += "border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700";
            } else {
              if (isCorrect) {
                btnClass += "border-green-500 bg-green-50 text-green-900";
              } else if (isSelected && !isCorrect) {
                btnClass += "border-red-500 bg-red-50 text-red-900";
              } else {
                btnClass += "border-slate-200 opacity-50 bg-slate-50";
              }
            }

            return (
              <button 
                key={idx} 
                onClick={() => handleOptionSelect(option)}
                disabled={showExplanation}
                className={btnClass}
              >
                <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showExplanation && isCorrect && <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 ml-2" />}
                    {showExplanation && isSelected && !isCorrect && <XCircle size={20} className="text-red-500 flex-shrink-0 ml-2" />}
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="font-semibold text-blue-900 mb-1">Explicação</h4>
            <p className="text-blue-800 text-sm md:text-base leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}

        {showExplanation && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Próxima Pergunta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
