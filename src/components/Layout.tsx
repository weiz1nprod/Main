import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Clock, BarChart2, MessageSquare, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

interface LayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const navItems = [
    { to: '/', icon: Home, label: 'Início' },
    { to: '/study', icon: BookOpen, label: 'Materiais' },
    { to: '/review', icon: Clock, label: 'Revisão' },
    { to: '/progress', icon: BarChart2, label: 'Progresso' },
    { to: '/forum', icon: MessageSquare, label: 'Fórum' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-16 md:pb-0 md:flex-row font-sans">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
        <h1 className="font-semibold text-lg tracking-tight text-blue-900">AeroMechanic</h1>
        <button onClick={onLogout} className="p-2 text-slate-500 hover:text-slate-900">
          <LogOut size={20} />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6">
          <h1 className="font-semibold text-xl tracking-tight text-blue-900">AeroMechanic</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full" />
            <span className="text-sm font-medium truncate">{user.displayName}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-2 w-full text-left text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 z-10 pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-lg ${
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`
            }
          >
            <item.icon size={24} />
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
