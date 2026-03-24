'use client';

import { useMemo, useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Composants HTML pour les formules mathématiques sécurisées (pas de KaTeX/LaTeX)
function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card dark:bg-slate-950 p-4 rounded-lg border border-border shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{label}</p>
      <div className="flex justify-center items-center py-1 overflow-x-auto text-foreground">{children}</div>
    </div>
  );
}

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center mx-1 align-middle">
      <span className="border-b border-current px-1 leading-tight">{num}</span>
      <span className="px-1 leading-tight">{den}</span>
    </span>
  );
}

const sym = {
  dot: <span className="mx-0.5">·</span>,
  sqrt3: (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-1">3</span>
    </span>
  ),
  sum: <span className="mx-0.5">Σ</span>,
  eta: <span className="mx-0.5">η</span>,
  cos: <span className="mr-1">cos(φ)</span>,
  pi: <span className="mx-0.5">π</span>,
};

export default function Step10() {
  const {
    inputs,
    nominal,
    mainDimensions,
    stator,
    airGap,
    rotor,
    reactances,
    excitation,
    losses,
    setCurrentStep,
  } = useMachineStore();

  useEffect(() => {
    setCurrentStep(10);
  }, [setCurrentStep]);

  // Formule de formatage pour les nombres
  const fmt = (v: number | null | undefined, d = 2) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '—';
    return v.toFixed(d);
  };

  // useMemo pour calculer les pertes si elles n'existent pas
  const calculatedLosses = useMemo(() => {
    if (losses) {
      return losses;
    }

    // Vérifier si tous les paramètres d'entrée nécessaires existent
    if (!inputs || !nominal || !mainDimensions || !stator || !airGap || !rotor || !reactances || !excitation) {
      return null;
    }

    try {
      // Appeler calcLossesAndEfficiency avec les bons paramètres
      const result = CalculationEngine.calcLossesAndEfficiency(
        inputs,
        nominal,
        mainDimensions,
        stator,
        airGap,
        excitation,
        reactances
      );

      // Transformer le résultat pour correspondre à l'interface LossesAndEfficiency
      if (result && result.losses_kW && result.efficiency) {
        return {
          Pc: result.losses_kW.iron_yoke_Pc || 0,
          Pcd: result.losses_kW.iron_teeth_Pcd || 0,
          Psur: result.losses_kW.pole_surface_Psur || 0,
          Pmec: result.losses_kW.mechanical_Pmec || 0,
          Pelec: result.losses_kW.stator_copper_Pelec || 0,
          Psup: result.losses_kW.supplementary_Psup || 0,
          PB: result.losses_kW.excitation_PB || 0,
          totalLosses: result.losses_kW.total_SigmaP || 0,
          efficiency: result.efficiency.eta_per_unit || 0,
        };
      }
    } catch (error) {
      console.error('[v0] Error calculating losses:', error);
    }

    return null;
  }, [losses, inputs, nominal, mainDimensions, stator, airGap, rotor, reactances, excitation]);

  // Si les paramètres de base manquent, afficher erreur
  if (!inputs || !nominal || !mainDimensions || !stator || !airGap) {
    return (
      <StepLayout stepNumber={10} title="Bilan des pertes et rendement">
        <p className="text-destructive font-semibold">
          Paramètres insuffisants. Veuillez compléter les étapes précédentes (Entrées, Dimensions, Stator, Entrefer).
        </p>
      </StepLayout>
    );
  }

  // Si les pertes n'ont pas pu être calculées
  if (!calculatedLosses) {
    return (
      <StepLayout stepNumber={10} title="Bilan des pertes et rendement">
        <p className="text-destructive font-semibold">
          Calcul impossible. Données manquantes pour les pertes (Rotor, Réactances, Excitation).
        </p>
      </StepLayout>
    );
  }

  const eta = calculatedLosses.efficiency * 100;

  // Données pour le pie chart
  const lossData = [
    { name: 'Fer culasse', value: parseFloat(fmt(calculatedLosses.Pc, 2)) },
    { name: 'Fer dents', value: parseFloat(fmt(calculatedLosses.Pcd, 2)) },
    { name: 'Surface', value: parseFloat(fmt(calculatedLosses.Psur, 2)) },
    { name: 'Mécaniques', value: parseFloat(fmt(calculatedLosses.Pmec, 2)) },
    { name: 'Électriques', value: parseFloat(fmt(calculatedLosses.Pelec, 2)) },
    { name: 'Supplémentaires', value: parseFloat(fmt(calculatedLosses.Psup, 2)) },
    { name: 'Excitation', value: parseFloat(fmt(calculatedLosses.PB, 2)) },
  ].filter((item) => item.value > 0);

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--info))',
    'hsl(var(--success))',
    'hsl(var(--destructive))',
    'hsl(var(--warning))',
    'hsl(var(--muted-foreground))',
  ];

  // Vérifications critères
  type Check = { label: string; value: string; status: 'green' | 'yellow' | 'red' };
  const checks: Check[] = [
    {
      label: 'Rendement global',
      value: `${fmt(eta, 1)}%`,
      status: eta > 93 ? 'green' : eta > 90 ? 'yellow' : 'red',
    },
    {
      label: 'Pertes totales',
      value: `${fmt(calculatedLosses.totalLosses, 1)} kW`,
      status: calculatedLosses.totalLosses < inputs.Pn * 0.08 ? 'green' : calculatedLosses.totalLosses < inputs.Pn * 0.12 ? 'yellow' : 'red',
    },
    {
      label: 'Puissance utile',
      value: `${fmt(inputs.Pn, 0)} kW`,
      status: 'green',
    },
    {
      label: 'Puissance absorbée',
      value: `${fmt(inputs.Pn + calculatedLosses.totalLosses, 2)} kW`,
      status: 'green',
    },
  ];

  const statusColors = {
    green: 'border-success/50 bg-success/10 text-success',
    yellow: 'border-warning/50 bg-warning/10 text-warning',
    red: 'border-destructive/50 bg-destructive/10 text-destructive',
  };

  return (
    <StepLayout
      stepNumber={10}
      title="Bilan des pertes et rendement"
      description="Calcul des pertes en régime nominal et rendement global de la machine synchrone"
    >
      {/* 2 colonnes : vérifications + pie chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Colonne GAUCHE : Vérifications et rendement */}
        <div className="rounded-lg border border-border p-6 bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Vérifications critères</h3>
          <div className="space-y-3">
            {checks.map((c, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${statusColors[c.status]}`}>
                <div className={`w-3 h-3 rounded-full ${c.status === 'green' ? 'bg-success' : c.status === 'yellow' ? 'bg-warning' : 'bg-destructive'}`} />
                <span className="flex-1 text-sm font-medium">{c.label}</span>
                <span className="font-mono text-sm font-bold">{c.value}</span>
              </div>
            ))}
          </div>

          {/* Rendement principal */}
          <div className={`mt-6 p-6 rounded-lg border-2 text-center ${eta > 93 ? 'border-success/50 bg-success/10' : eta > 90 ? 'border-warning/50 bg-warning/10' : 'border-destructive/50 bg-destructive/10'}`}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              Rendement global (η)
            </p>
            <p className={`text-4xl font-bold font-mono ${eta > 93 ? 'text-success' : eta > 90 ? 'text-warning' : 'text-destructive'}`}>
              {fmt(eta, 1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {eta > 93 ? 'Excellent — IE3 Premium Efficiency' : eta > 90 ? 'Bon — IE2 High Efficiency' : 'À améliorer'}
            </p>
          </div>
        </div>

        {/* Colonne DROITE : Formules mathématiques */}
        <div className="space-y-4">
          <Formula label="Rendement global">
            <div className="flex items-center gap-2">
              <span>{sym.eta}</span>
              <span>=</span>
              <span>1</span>
              <span>−</span>
              <Frac
                num={<span>{sym.sum}P</span>}
                den={
                  <span>
                    P<span className="text-xs">n</span> + {sym.sum}P
                  </span>
                }
              />
            </div>
          </Formula>

          <Formula label="Pertes totales">
            <div className="flex items-center gap-1">
              <span>{sym.sum}P</span>
              <span>=</span>
              <span>P</span>
              <span className="text-xs">c</span>
              <span>+</span>
              <span>P</span>
              <span className="text-xs">cd</span>
              <span>+</span>
              <span>P</span>
              <span className="text-xs">sur</span>
              <span>+</span>
              <span>P</span>
              <span className="text-xs">mec</span>
              <span>+</span>
              <span>P</span>
              <span className="text-xs">elec</span>
              <span>+</span>
              <span>P</span>
              <span className="text-xs">sup</span>
              <span>+</span>
              <span>P</span>
              <span className="text-xs">B</span>
            </div>
          </Formula>

          <Formula label="Pertes fer culasse">
            <div className="flex items-center gap-1">
              <span>P</span>
              <span className="text-xs">c</span>
              <span>=</span>
              <span>k</span>
              <span className="text-xs">dc</span>
              <span>{sym.dot}</span>
              <span>ρ</span>
              <span className="text-xs">c</span>
              <span>{sym.dot}</span>
              <span>G</span>
              <span className="text-xs">c</span>
            </div>
          </Formula>

          <Formula label="Pertes fer dents">
            <div className="flex items-center gap-1">
              <span>P</span>
              <span className="text-xs">cd</span>
              <span>=</span>
              <span>k</span>
              <span className="text-xs">d</span>
              <span>{sym.dot}</span>
              <span>ρ</span>
              <span className="text-xs">cd</span>
              <span>{sym.dot}</span>
              <span>G</span>
              <span className="text-xs">d</span>
            </div>
          </Formula>

          <Formula label="Pertes mécaniques">
            <div className="flex items-center gap-1">
              <span>P</span>
              <span className="text-xs">mec</span>
              <span>=</span>
              <span>0.8</span>
              <span>{sym.dot}</span>
              <span>2p</span>
              <span>{sym.dot}</span>
              <Frac num={<span>v_p</span>} den={<span>40</span>} />
              <span>³</span>
              <span>√</span>
              <Frac num={<span>l_M</span>} den={<span>19</span>} />
            </div>
          </Formula>

          <Formula label="Pertes électriques stator">
            <div className="flex items-center gap-1">
              <span>P</span>
              <span className="text-xs">elec</span>
              <span>=</span>
              <span>3</span>
              <span>{sym.dot}</span>
              <span>I</span>
              <span className="text-xs">n</span>
              <span>²</span>
              <span>{sym.dot}</span>
              <span>r</span>
              <span className="text-xs">a75</span>
            </div>
          </Formula>

          <Formula label="Pertes supplémentaires">
            <div className="flex items-center gap-1">
              <span>P</span>
              <span className="text-xs">sup</span>
              <span>=</span>
              <span>0.05</span>
              <span>{sym.dot}</span>
              <span>S</span>
              <span className="text-xs">n</span>
            </div>
          </Formula>

          <Formula label="Pertes d'excitation">
            <div className="flex items-center gap-1">
              <span>P</span>
              <span className="text-xs">B</span>
              <span>=</span>
              <span>I</span>
              <span className="text-xs">B</span>
              <span>²</span>
              <span>{sym.dot}</span>
              <span>R</span>
              <span className="text-xs">B75</span>
              <span>+</span>
              <span>2</span>
              <span>{sym.dot}</span>
              <span>Δ</span>
              <span>U</span>
              <span>{sym.dot}</span>
              <span>I</span>
              <span className="text-xs">B</span>
            </div>
          </Formula>
        </div>
      </div>

      {/* Pie chart des pertes - pleine largeur */}
      <div className="mt-8 rounded-lg border border-border p-6 bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Répartition des pertes ({fmt(calculatedLosses.totalLosses, 1)} kW)
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={lossData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }) => `${name}: ${value} kW`}
            >
              {lossData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: any) => `${value.toFixed(2)} kW`}
            />
            <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau détaillé des pertes - pleine largeur */}
      <div className="mt-8">
        <ResultTable
          title="Détail complet des pertes en régime nominal"
          rows={[
            { label: 'Pertes fer culasse', symbol: 'Pc', value: fmt(calculatedLosses.Pc, 2), unit: 'kW' },
            { label: 'Pertes fer dents', symbol: 'Pcd', value: fmt(calculatedLosses.Pcd, 2), unit: 'kW' },
            { label: 'Pertes surface (pôles)', symbol: 'Psur', value: fmt(calculatedLosses.Psur, 2), unit: 'kW' },
            { label: 'Pertes mécaniques', symbol: 'Pmec', value: fmt(calculatedLosses.Pmec, 2), unit: 'kW' },
            { label: 'Pertes électriques stator', symbol: 'Pelec', value: fmt(calculatedLosses.Pelec, 2), unit: 'kW' },
            { label: 'Pertes supplémentaires', symbol: 'Psup', value: fmt(calculatedLosses.Psup, 2), unit: 'kW' },
            { label: 'Pertes d\'excitation (balais)', symbol: 'PB', value: fmt(calculatedLosses.PB, 2), unit: 'kW' },
            { label: 'PERTES TOTALES', symbol: '{sum}P', value: fmt(calculatedLosses.totalLosses, 2), unit: 'kW' },
            { label: 'RENDEMENT', symbol: '{eta}', value: `${fmt(eta, 1)}%`, unit: '' },
            { label: 'Efficacité énergétique', symbol: 'Catégorie', value: eta > 93 ? 'IE3' : eta > 90 ? 'IE2' : 'IE1', unit: '' },
          ]}
        />
      </div>

      {/* Section informationnelle */}
      <div className="mt-8 rounded-lg border border-info/50 bg-info/10 p-6">
        <p className="text-sm text-info font-medium mb-3">
          📊 Interprétation des résultats :
        </p>
        <ul className="text-sm text-info/90 space-y-1 list-disc list-inside">
          <li>Un rendement {'>'} 93% est considéré comme excellent (norme IE3)</li>
          <li>Les pertes dominantes indiquent où concentrer les améliorations de conception</li>
          <li>Le pie chart montre la contribution de chaque type de perte au total</li>
          <li>La puissance absorbée = Puissance nominale + Pertes totales</li>
        </ul>
      </div>
    </StepLayout>
  );
}
