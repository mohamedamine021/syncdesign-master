import { useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { CalculationEngine } from '@/engine/CalculationEngine';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';

// ============================================================================
// CUSTOM MATH RENDERING COMPONENTS (No KaTeX/LaTeX - HTML-based)
// ============================================================================

function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {label}
      </p>
      <div className="flex justify-center items-center py-2 overflow-x-auto text-slate-800 dark:text-slate-200 font-serif">
        {children}
      </div>
    </div>
  );
}

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center mx-1 align-middle">
      <span className="border-b border-current px-1 leading-tight text-sm">{num}</span>
      <span className="px-1 leading-tight text-sm">{den}</span>
    </span>
  );
}

const sym = {
  dot: <span className="mx-0.5">·</span>,
  sqrt3: (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-0.5">3</span>
    </span>
  ),
  cos: <span className="mr-1">cos φ</span>,
  phi: <span className="italic mx-0.5">φ</span>,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Step2() {
  const { inputs, nominal, setCurrentStep } = useMachineStore();

  // ============================================================================
  // CALCULATION HOOK: Verify data exists; compute if necessary
  // ============================================================================

  const calculatedNominal = useMemo(() => {
    // Check if inputs exist
    if (!inputs || typeof inputs.Pn !== 'number') {
      return null;
    }

    // If nominal already exists in store, use it
    if (nominal) {
      return nominal;
    }

    // Otherwise, compute it using CalculationEngine
    try {
      const computed = CalculationEngine.calcNominal(inputs);
      return computed;
    } catch (error) {
      console.error('[Step2] Error computing nominal values:', error);
      return null;
    }
  }, [inputs, nominal]);

  // ============================================================================
  // EFFECT: Update current step
  // ============================================================================

  if (!calculatedNominal) {
    return (
      <StepLayout
        stepNumber={2}
        title="Valeurs nominales"
        description="Calcul automatique des grandeurs nominales de la machine"
      >
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
          <p className="text-destructive font-semibold">Erreur de calcul</p>
          <p className="text-destructive/80 text-sm mt-2">
            Impossible de calculer les valeurs nominales. Veuillez vérifier que tous les
            paramètres d'entrée sont correctement saisis (Pn, Un, cos φ, f, nn).
          </p>
        </div>
      </StepLayout>
    );
  }

  setCurrentStep(2);

  const fmt = (v: number, d = 2) => {
    if (!Number.isFinite(v)) return '—';
    return v.toFixed(d);
  };

  // ============================================================================
  // RENDER: 2-Column Layout (Left: Cards + Table | Right: Formulas)
  // ============================================================================

  return (
    <StepLayout
      stepNumber={2}
      title="Valeurs nominales"
      description="Calcul automatique des grandeurs nominales de la machine"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ============================================================================ */
        {/* LEFT COLUMN: Summary Cards + Results Table */}
        {/* ============================================================================ */}
        <div className="space-y-6">
          {/* Nominal Power Card */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
              Puissance nominale
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {fmt(inputs.Pn, 1)}
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400">kW</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              Facteur de puissance : {fmt(inputs.cosPhi, 2)}
            </p>
          </div>

          {/* Frequency & Speed Card */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                Fréquence
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {fmt(inputs.f, 0)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Hz</p>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                Vitesse nominale
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {fmt(inputs.nn, 0)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">tr/min</p>
            </div>
          </div>

          {/* Results Table */}
          <ResultTable
            title="Résultats calculés"
            rows={[
              {
                label: 'Tension par phase',
                symbol: 'U_ph',
                value: fmt(calculatedNominal.Uph, 1),
                unit: 'V',
              },
              {
                label: 'Puissance apparente',
                symbol: 'S_n',
                value: fmt(calculatedNominal.Sn, 1),
                unit: 'kVA',
              },
              {
                label: 'Courant nominal',
                symbol: 'I_n',
                value: fmt(calculatedNominal.In, 1),
                unit: 'A',
              },
              {
                label: 'Paires de pôles',
                symbol: 'p',
                value: String(calculatedNominal.p),
                unit: '—',
              },
              {
                label: 'Nombre de pôles',
                symbol: '2p',
                value: String(2 * calculatedNominal.p),
                unit: '—',
              },
            ]}
          />
        </div>

        {/* ============================================================================ */}
        {/* RIGHT COLUMN: Engineering Formulas */}
        {/* ============================================================================ */}
        <div className="space-y-6">
          {/* Formula 1: Phase Voltage */}
          <Formula label="Tension par phase (couplage étoile)">
            <span>
              U<sub>ph</sub> = <Frac num="U_n" den={sym.sqrt3} />
            </span>
          </Formula>

          {/* Formula 2: Apparent Power */}
          <Formula label="Puissance apparente nominale">
            <span>
              S<sub>n</sub> = <Frac num="P_n" den={sym.cos} />
            </span>
          </Formula>

          {/* Formula 3: Nominal Current */}
          <Formula label="Courant nominal par phase (couplage étoile)">
            <span>
              I<sub>n</sub> =
              <Frac
                num={
                  <span>
                    S<sub>n</sub> × 10<sup>3</sup>
                  </span>
                }
                den={
                  <span>
                    {sym.sqrt3}
                    {sym.dot}U<sub>n</sub>
                  </span>
                }
              />
            </span>
          </Formula>

          {/* Formula 4: Pole Pairs */}
          <Formula label="Nombre de paires de pôles">
            <span>
              p = <Frac num="60 × f" den="n_n" />
            </span>
          </Formula>

          {/* Info Box */}
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4 shadow-sm">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-2">
              Remarque
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Ces valeurs nominales servent de base au dimensionnement des circuits statorique
              et rotorique. Elles sont strictement dérivées des spécifications d'entrée.
            </p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
