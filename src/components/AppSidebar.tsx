import { NavLink, useLocation } from 'react-router-dom';
import { useMachineStore } from '@/store/machineStore';
import {
  Settings, Calculator, Ruler, Layers, Magnet, Circle,
  RotateCcw, Zap, BatteryCharging, BarChart3, ChevronLeft, ChevronRight,
  AlertCircle, TrendingUp, Gauge
} from 'lucide-react';
import { useState } from 'react';

const STEPS = [
  { path: '/step/1', label: 'Paramètres d\'entrée', icon: Settings, step: 1 },
  { path: '/step/2', label: 'Valeurs nominales', icon: Calculator, step: 2 },
  { path: '/step/3', label: 'Dimensions principales', icon: Ruler, step: 3 },
  { path: '/step/4', label: 'Stator', icon: Layers, step: 4 },
  { path: '/step/5', label: 'Circuit magnétique', icon: Magnet, step: 5 },
  { path: '/step/6', label: 'Entrefer & Carter', icon: Circle, step: 6 },
  { path: '/step/7', label: 'Rotor & Pôles', icon: RotateCcw, step: 7 },
  { path: '/step/8', label: 'Réactances', icon: Zap, step: 8 },
  { path: '/step/9', label: 'Excitation', icon: BatteryCharging, step: 9 },
  { path: '/step/10', label: 'Excitation en charge', icon: BarChart3, step: 10 },
  { path: '/step/11', label: 'Paramètres dynamiques', icon: Zap, step: 11 },
  { path: '/step/12', label: 'Court-circuit', icon: AlertCircle, step: 12 },
  { path: '/step/13', label: 'Surcharge statique', icon: TrendingUp, step: 13 },
  { path: '/step/14', label: 'Pertes & Rendement', icon: Gauge, step: 14 },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentStep = useMachineStore((s) => s.currentStep);
  const isCalculated = useMachineStore((s) => s.isCalculated); // <-- Récupération de l'état de validation

  const getStepStatus = (step: number) => {
    const currentPath = location.pathname;
    const isActive = currentPath === `/step/${step}`;
    if (isActive) return 'active';
    if (step < currentStep) return 'complete';
    return 'pending';
  };

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-sidebar-accent-foreground tracking-wider">
              SYNCDESIGN
            </h2>
            <span className="text-[10px] text-sidebar-primary font-bold tracking-widest">PRO</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {STEPS.map((s) => {
          const status = getStepStatus(s.step);
          const Icon = s.icon;
          const isLocked = !isCalculated && s.step > 1; // <-- Vérification si l'étape doit être bloquée

          return (
            <NavLink
              key={s.path}
              to={s.path}
              onClick={(e) => {
                if (isLocked) e.preventDefault(); // <-- Empêche la navigation si bloqué
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm transition-all ${
                  isLocked
                    ? 'opacity-40 cursor-not-allowed grayscale' // <-- Style pour les éléments bloqués
                    : isActive
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <div className="relative">
                <Icon size={18} />
                {status === 'complete' && !isLocked && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-success" />
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{s.label}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      status === 'active'
                        ? 'text-sidebar-primary'
                        : 'text-sidebar-foreground/50'
                    }`}
                  >
                    {s.step}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40 text-center">
            Machine Synchrone Designer
          </p>
        </div>
      )}
    </aside>
  );
}