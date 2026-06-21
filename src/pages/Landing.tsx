import { ReactNode } from 'react';
import { Plane, BookOpen, BrainCircuit, Network, Calendar, Users, LogIn } from 'lucide-react';

interface LandingProps {
  onLogin: () => Promise<any>;
}

export default function Landing({ onLogin }: LandingProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="flex items-center space-x-2 text-blue-700">
          <Plane className="w-6 h-6" />
          <span className="text-xl font-bold tracking-tight">AeroMechanic</span>
        </div>
        <button
          onClick={onLogin}
          className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-medium hover:bg-blue-100 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>Entrar / Cadastrar</span>
        </button>
      </header>

      {/* Hero */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto">
        <div className="mb-6 inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span>Potencializado por IA Gemini</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
          Sua licença de mecânico <span className="text-blue-600">mais próxima do que nunca</span>.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Faça upload das suas apostilas e manuais. Transformamos seus PDFs em flashcards, quizzes e mapas mentais automaticamente para aprimorar seus estudos diários.
        </p>
        <button
          onClick={onLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl shadow-blue-600/20"
        >
          Comece a Estudar Gratuitamente
        </button>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center tracking-tight mb-12">Tudo o que você precisa para dominar a matéria</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BrainCircuit className="w-8 h-8 text-blue-500" />}
              title="Resumos Inteligentes"
              description="A IA analisa seus manuais e extrai pontos-chave em cartões e perguntas."
            />
            <FeatureCard 
              icon={<BookOpen className="w-8 h-8 text-indigo-500" />}
              title="Revisão Espaçada"
              description="Algoritmo otimizado que programa suas revisões para garantir a memorização de longo prazo."
            />
            <FeatureCard 
              icon={<Network className="w-8 h-8 text-emerald-500" />}
              title="Mapas Mentais"
              description="Visualize as conexões complexas dos sistemas das aeronaves de forma clara."
            />
            <FeatureCard 
              icon={<Calendar className="w-8 h-8 text-amber-500" />}
              title="Planejamento e Lembretes"
              description="Integração com Google Calendar para te lembrar da hora de revisar os materiais."
            />
            <FeatureCard 
              icon={<Plane className="w-8 h-8 text-sky-500" />}
              title="Foco Aeronáutico"
              description="Especializado no vocabulário e nas necessidades dos estudantes de manutenção."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-purple-500" />}
              title="Fórum de Dúvidas"
              description="Troque ideias e resolva questões de aerodinâmica e motores com a comunidade."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 border-t border-slate-200">
        <p>&copy; {new Date().getFullYear()} AeroMechanic. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
      <div className="mb-4 bg-white w-14 h-14 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-800 tracking-tight">{title}</h3>
      <p className="text-slate-600 line-clamp-3">{description}</p>
    </div>
  );
}
