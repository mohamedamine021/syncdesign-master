import { NavLink, useLocation } from 'react-router-dom';
import { useMachineStore } from '@/store/machineStore';
import {
  Settings, Calculator, Ruler, Layers, Magnet, Circle,
  RotateCcw, Zap, BatteryCharging, BarChart3, ChevronLeft, ChevronRight,
  AlertCircle, TrendingUp, Gauge, Home 
} from 'lucide-react';
import { useState } from 'react';

// Noms traduits en français selon la terminologie des machines électriques
const STEPS = [
  { path: '/step/1', label: 'Paramètres d\'entrée', icon: Settings, step: 1 },
  { path: '/step/2', label: 'Grandeurs nominales', icon: Calculator, step: 2 },
  { path: '/step/3', label: 'Dimensions principales', icon: Ruler, step: 3 },
  { path: '/step/4', label: 'Dimensionnement Stator', icon: Layers, step: 4 },
  { path: '/step/5', label: 'Entrefer', icon: Magnet, step: 5 },
  { path: '/step/6', label: 'Dimensionnement Rotor', icon: Circle, step: 6 },
  { path: '/step/7', label: 'Circuit magnétique', icon: RotateCcw, step: 7 },
  { path: '/step/8', label: 'Réactances de fuite', icon: Zap, step: 8 },
  { path: '/step/9', label: 'Excitation en charge', icon: BatteryCharging, step: 9 },
  { path: '/step/10', label: 'Système d\'excitation', icon: BarChart3, step: 10 },
  { path: '/step/11', label: 'Paramètres dynamiques', icon: Zap, step: 11 },
  { path: '/step/12', label: 'Court-circuit', icon: AlertCircle, step: 12 },
  { path: '/step/13', label: 'Surcharge statique', icon: TrendingUp, step: 13 },
  { path: '/step/14', label: 'Pertes et Rendement', icon: Gauge, step: 14 },
];



export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentStep = useMachineStore((s) => s.currentStep);
  const isCalculated = useMachineStore((s) => s.isCalculated);

  const getStepStatus = (step: number) => {
    const currentPath = location.pathname;
    const isActive = currentPath === `/step/${step}`;
    if (isActive) return 'active';
    if (step < currentStep) return 'complete';
    return 'pending';
  };

  return (
    <aside
      className={`flex min-h-0 flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 overflow-y-auto overscroll-contain ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header avec le Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-3'} px-4 py-4 border-b border-sidebar-border`}>
        {!collapsed && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* L'image pointe maintenant vers le fichier .ico */}
            <img 
              src="/logo.ico" 
              alt="Logo SyncDesign" 
              className="w-9 h-9 object-contain drop-shadow-sm"
              onError={(e) => {
                // Fallback de sécurité au cas où l'image ne charge pas
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-sidebar-accent-foreground tracking-wider leading-tight truncate">
                SYNCDESIGN
              </h2>
              <span className="text-[10px] text-sidebar-primary font-bold tracking-widest leading-tight">PRO</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        
        {/* BOUTON ACCUEIL */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 mx-2 mb-4 mt-2 rounded-md text-sm transition-all border border-sidebar-border/50 bg-sidebar-accent/20 ${
              isActive
                ? 'bg-sidebar-accent text-sidebar-primary font-bold border-sidebar-primary/30'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground'
            }`
          }
        >
          <div className="relative shrink-0">
            <Home size={18} className="text-primary" />
          </div>
          {!collapsed && (
            <span className="flex-1 truncate text-[13px] font-bold tracking-tight">
              Accueil
            </span>
          )}
        </NavLink>

        {/* Petite ligne de séparation */}
        <div className="h-px bg-sidebar-border/60 mx-4 mb-4" />

        {/* Les étapes normales de calcul */}
        {STEPS.map((s) => {
          const status = getStepStatus(s.step);
          const Icon = s.icon;
          const isLocked = !isCalculated && s.step > 1;

          return (
            <NavLink
              key={s.path}
              to={s.path}
              onClick={(e) => {
                if (isLocked) e.preventDefault();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm transition-all ${
                  isLocked
                    ? 'opacity-40 cursor-not-allowed grayscale'
                    : isActive
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <div className="relative shrink-0">
                <Icon size={18} />
                {status === 'complete' && !isLocked && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-success" />
                )}
              </div>
              {!collapsed && (
                <span className="flex-1 truncate text-[13px] font-semibold tracking-tight" title={s.label}>
                  {s.label}
                </span>
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