'use client';

import { useMemo, useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

// ============ CUSTOM HTML MATH COMPONENTS (NO KATEX) ============
function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex justify-center items-center py-1 overflow-x-auto text-slate-800 dark:text-slate-200">{children}</div>
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
  cos: <span className="mr-1">cos(φ)</span>,
  pi: <span className="mx-0.5">π</span>,
  delta: <span className="mx-0.5">δ</span>,
  sigma: <span className="mx-0.5">σ</span>,
  phi: <span className="mx-0.5">Φ</span>,
};

// ============ STEP 7: NO-LOAD CHARACTERISTIC ============
export default function Step7() {
  const { inputs, nominal, mainDimensions: dim, stator, airGap, setCurrentStep } = useMachineStore();

  // Update step on mount
  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(7);
    }
  }, [setCurrentStep]);

  // ============ USEMEMO: CALCULATE OR RETRIEVE ============
  const noLoadData = useMemo(() => {
    // Verify all required inputs exist
    if (!dim || !stator || !airGap || !inputs || !nominal) {
      return null;
    }

    try {
      // Call CalculationEngine.calcNoLoadCharacteristic with EXACT signature
      const result = CalculationEngine.calcNoLoadCharacteristic(
        dim,
        stator,
        airGap,
        1.52,    // boe_cm (default)
        99,      // Da (default)
        0.68     // alpha_delta (default)
      );
      return result;
    } catch (error) {
      console.error('[v0] Error calculating no-load characteristic:', error);
      return null;
    }
  }, [dim, stator, airGap, inputs, nominal]);

  // ============ ERROR HANDLING ============
  if (!dim || !stator || !airGap) {
    return (
      <StepLayout
        stepNumber={7}
        title="Caractéristique à vide"
        description="Calcul des FMM du circuit magnétique"
      >
        <p className="text-destructive">
          Données manquantes. Veuillez compléter les étapes précédentes.
        </p>
      </StepLayout>
    );
  }

  if (!noLoadData) {
    return (
      <StepLayout
        stepNumber={7}
        title="Caractéristique à vide"
        description="Calcul des FMM du circuit magnétique"
      >
        <p className="text-destructive">
          Calcul impossible. Vérifiez les paramètres d'entrée.
        </p>
      </StepLayout>
    );
  }

  // ============ FORMATTING FUNCTION ============
  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '—';
    return v.toFixed(d);
  };

  // ============ RENDER ============
  return (
    <StepLayout
      stepNumber={7}
      title="Caractéristique à vide"
      description="Calcul des FMM du circuit magnétique et de la courbe magnétisante"
    >
      {/* 2-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* ========== LEFT COLUMN: SUMMARY CARDS + TABLE ========== */}
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="rounded-lg border border-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground mb-4">Paramètres magnétiques</h3>

            <div className="p-3 rounded-md bg-card border border-border">
              <p className="text-xs text-muted-foreground">Entrefer - K_delta</p>
              <p className="text-lg font-mono text-foreground font-bold">{fmt(noLoadData.Kdelta, 3)}</p>
            </div>

            <div className="p-3 rounded-md bg-card border border-border">
              <p className="text-xs text-muted-foreground">FMM entrefer</p>
              <p className="text-lg font-mono text-foreground font-bold">{fmt(noLoadData.F_delta, 0)} A</p>
            </div>

            <div className="p-3 rounded-md bg-card border border-border">
              <p className="text-xs text-muted-foreground">Induction dent</p>
              <p className="text-lg font-mono text-foreground font-bold">{fmt(noLoadData.Bd13, 0)} G</p>
            </div>

            <div className="p-3 rounded-md bg-card border border-border">
              <p className="text-xs text-muted-foreground">Induction culasse</p>
              <p className="text-lg font-mono text-foreground font-bold">{fmt(noLoadData.Bc, 0)} G</p>
            </div>
          </div>

          {/* Results Table */}
          <ResultTable
            title="Détail des FMM du circuit magnétique"
            rows={[
              { label: 'Entrefer', symbol: 'Kdelta', value: fmt(noLoadData.Kdelta, 3) },
              { label: 'FMM entrefer', symbol: 'F_δ', value: fmt(noLoadData.F_delta, 0), unit: 'A' },
              { label: 'FMM dents stator', symbol: 'F_d1', value: fmt(noLoadData.F_d1, 0), unit: 'A' },
              { label: 'FMM culasse stator', symbol: 'F_c', value: fmt(noLoadData.F_c, 0), unit: 'A' },
              { label: 'FMM culasse rotor', symbol: 'F_a', value: fmt(noLoadData.F_a, 0), unit: 'A' },
              { label: 'FMM zone pôle', symbol: 'F_M0', value: fmt(noLoadData.F_M0, 0), unit: 'A' },
              { label: 'FMM jonction', symbol: 'F_δM', value: fmt(noLoadData.F_delta_M, 0), unit: 'A' },
              { label: 'FMM TOTALE', symbol: 'F₀', value: fmt(noLoadData.F_0, 0), unit: 'A' },
              { label: 'Flux magnétique', symbol: 'Φ_M', value: `${fmt(noLoadData.Phi_M / 1e6, 3)} × 10⁶`, unit: 'Mx' },
            ]}
          />
        </div>

        {/* ========== RIGHT COLUMN: ENGINEERING FORMULAS ========== */}
        <div className="space-y-4">
          <Formula label="a) Coefficient de Carter (K_delta)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>K_delta</span>
              <span>=</span>
              <Frac
                num={
                  <div className="flex items-center gap-1">
                    <span>t</span>
                    <sub>1</sub>
                  </div>
                }
                den={
                  <div className="flex items-center gap-0.5">
                    <span>t</span>
                    <sub>1</sub>
                    <span>−</span>
                    <span>γ</span>
                    {sym.dot}
                    <span>δ</span>
                  </div>
                }
              />
            </div>
          </Formula>

          <Formula label="b) FMM entrefer (F_delta)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>F</span>
              <sub>δ</sub>
              <span>=</span>
              <span>1.6 · δ · K</span>
              <sub>delta</sub>
              <span>· B</span>
              <sub>d0</sub>
            </div>
          </Formula>

          <Formula label="c) FMM dents statoriques (F_d1)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>F</span>
              <sub>d1</sub>
              <span>=</span>
              <span>2 · h</span>
              <sub>e</sub>
              <span>· H</span>
              <sub>d13</sub>
            </div>
          </Formula>

          <Formula label="d) FMM culasse statorique (F_c)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>F</span>
              <sub>c</sub>
              <span>=</span>
              <span>l</span>
              <sub>c</sub>
              <span>· ξ(B</span>
              <sub>c</sub>
              <span>) · H</span>
              <sub>c</sub>
            </div>
          </Formula>

          <Formula label="e) FMM zone pôle (F_M0)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>F</span>
              <sub>M0</sub>
              <span>=</span>
              <span>2(h</span>
              <sub>m</sub>
              <span>+ h</span>
              <sub>p</sub>
              <span>) · H</span>
              <sub>M</sub>
            </div>
          </Formula>

          <Formula label="f) FMM culasse rotor (F_a)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>F</span>
              <sub>a</sub>
              <span>=</span>
              <span>l</span>
              <sub>a</sub>
              <span>· H</span>
              <sub>a</sub>
            </div>
          </Formula>

          <Formula label="g) FMM jonction pôle-culasse (F_deltaM)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>F</span>
              <sub>δM</sub>
              <span>=</span>
              <span>1.6 · δ</span>
              <sub>jonc</sub>
              <span>· B</span>
              <sub>M</sub>
            </div>
          </Formula>

          <Formula label="h) FMM TOTALE du circuit magnétique (F_0)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>F</span>
              <sub>0</sub>
              <span>=</span>
              <span>F</span>
              <sub>δ</sub>
              <span>+ F</span>
              <sub>d1</sub>
              <span>+ F</span>
              <sub>c</sub>
              <span>+ F</span>
              <sub>a</sub>
              <span>+ F</span>
              <sub>M0</sub>
              <span>+ F</span>
              <sub>δM</sub>
            </div>
          </Formula>

          <Formula label="i) Flux magnétique total (Phi_M)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>Φ</span>
              <sub>M</sub>
              <span>=</span>
              <span>Φ</span>
              <sub>ch</sub>
              <span>+</span>
              <span>Φ</span>
              <sub>σ</sub>
              <span>=</span>
              <span>Φ</span>
              <sub>ch</sub>
              <span>+ 2(λ</span>
              <sub>p</sub>
              <span>+ λ</span>
              <sub>m</sub>
              <span>) · F</span>
              <sub>sum</sub>
            </div>
          </Formula>
        </div>
      </div>

      {/* VALIDATION SECTION BELOW */}
      <div className="mt-8 rounded-lg border border-border p-5 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground mb-4">Vérification magnétique</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-md border ${noLoadData.Bd13 < 18000 ? 'border-success/50 bg-success/10' : 'border-warning/50 bg-warning/10'}`}>
            <p className="text-xs text-muted-foreground mb-1">Induction dent</p>
            <p className="text-lg font-mono font-bold">{fmt(noLoadData.Bd13, 0)} G</p>
            <p className="text-xs mt-1">{noLoadData.Bd13 < 18000 ? '✓ OK' : '⚠ Saturation'}</p>
          </div>
          
          <div className={`p-4 rounded-md border ${noLoadData.Bc < 15000 ? 'border-success/50 bg-success/10' : 'border-warning/50 bg-warning/10'}`}>
            <p className="text-xs text-muted-foreground mb-1">Induction culasse</p>
            <p className="text-lg font-mono font-bold">{fmt(noLoadData.Bc, 0)} G</p>
            <p className="text-xs mt-1">{noLoadData.Bc < 15000 ? '✓ OK' : '⚠ Saturation'}</p>
          </div>

          <div className="p-4 rounded-md border border-info/50 bg-info/10">
            <p className="text-xs text-muted-foreground mb-1">FMM totale</p>
            <p className="text-lg font-mono font-bold">{fmt(noLoadData.F_0, 0)} A</p>
            <p className="text-xs mt-1 text-info">Circuit magnétique complet</p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
