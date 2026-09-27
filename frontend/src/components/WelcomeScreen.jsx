import { BookOpen, Calculator, FileText, Beaker, Sparkles } from 'lucide-react';

const quickActions = [
  {
    icon: BookOpen,
    label: 'Explain Concept',
    description: 'Get clear explanations with examples',
    prompt: 'Explain the water cycle in detail',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: Calculator,
    label: 'Solve Problems',
    description: 'Step-by-step problem solving',
    prompt: 'Solve: 3x + 7 = 22, show every step',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: FileText,
    label: 'Summarize Topic',
    description: 'Quick notes and key points',
    prompt: 'Summarize the French Revolution with key points',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Beaker,
    label: 'Create Quiz',
    description: 'Test your knowledge with questions',
    prompt: 'Create a 5-question quiz on photosynthesis',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

export const WelcomeScreen = ({ onQuickAction }) => {
  return (
    <div className="flex flex-col items-center justify-center my-auto px-3 sm:px-4 py-2 sm:py-8 text-center animate-fade-in">
      {/* Logo & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
        <div className="w-9 h-9 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
          <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="text-left">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight">EduGenie</h1>
          <p className="text-[10px] sm:text-xs text-indigo-500 font-medium">AI-Powered Learning Assistant</p>
        </div>
      </div>

      <p className="text-slate-500 text-xs sm:text-sm max-w-sm mb-3 sm:mb-6 leading-relaxed">
        Ask questions, understand complex concepts, and master any subject with step-by-step guidance.
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-md mb-3 sm:mb-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onQuickAction(action.prompt)}
              className="quick-action group p-2.5 sm:p-4"
              aria-label={action.label}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 ${action.bg} rounded-lg flex items-center justify-center mb-0.5 sm:mb-1`}>
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${action.color}`} />
              </div>
              <span className="font-semibold text-slate-700 text-xs sm:text-sm">{action.label}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 leading-tight hidden xs:inline sm:inline">{action.description}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span>
        Tip: Be specific for better answers
      </p>
    </div>
  );
};
