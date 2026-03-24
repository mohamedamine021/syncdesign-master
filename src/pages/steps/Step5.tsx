import { useMemo, useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

// Safe HTML-based math rendering components (no KaTeX/LaTeX to avoid bundler errors)
function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card dark:bg-slate-950 p-4 rounded-lg border border-border shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{label}</p>
      <div className="flex justify-center items-center py-2 overflow-x-auto text-foreground">
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
      <span className="border-t border-current px-1">3</span>
    </span>
  ),
};

export default function Step5() {
  const { inputs, nominal, mainDimensions: dim, stator, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(5);
    }
  }, [setCurrentStep]);

  // Calculate air gap on-demand using useMemo
  const airGap = useMemo(() => {
    // Safety check: verify all required inputs exist
    if (!dim || !stator) {
      return null;
    }

    try {
      // Call CalculationEngine.calcAirGap with required parameters
      // Arguments: (dim: MainDimensions, stator: StatorDesign, xd_star?, xSigma_star?, Kprime?)
      const result = CalculationEngine.calcAirGap(dim, stator);
      return result;
    } catch (e) {
      console.error('[Step5] Error calculating air gap:', e);
      return null;
    }
  }, [dim, stator]);

  // Format numbers safely
  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || !Number.isFinite(v)) {
      return '—';
    }
    return v.toFixed(d);
  };

  // Error handling: if critical inputs are missing, show error state
  if (!inputs || !nominal || !dim || !stator) {
    return (
      <StepLayout
        stepNumber={5}
        title="Entrefer & Coefficient de Carter"
        description="Calcul de l'entrefer et du coefficient de Carter"
      >
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive font-semibold">Erreur de calcul</p>
          <p className="text-xs text-destructive/80 mt-1">
            Paramètres manquants: vérifiez que les étapes précédentes sont complètes.
          </p>
        </div>
      </StepLayout>
    );
  }

  // If air gap calculation failed, show error
  if (!airGap) {
    return (
      <StepLayout
        stepNumber={5}
        title="Entrefer & Coefficient de Carter"
        description="Calcul de l'entrefer et du coefficient de Carter"
      >
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive font-semibold">Erreur de calcul</p>
          <p className="text-xs text-destructive/80 mt-1">
            Impossible de calculer les paramètres de l'entrefer. Vérifiez les données d'entrée.
          </p>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout
      stepNumber={5}
      title="Entrefer & Coefficient de Carter"
      description="Calcul de l'entrefer et du coefficient de Carter"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Summary Cards & Results Table */}
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground font-semibold mb-2">ENTREFER</p>
              <p className="text-2xl font-bold font-mono text-foreground">{fmt(airGap.delta, 2)}</p>
              <p className="text-xs text-muted-foreground mt-1">cm</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground font-semibold mb-2">COEFF. CARTER</p>
              <p className="text-2xl font-bold font-mono text-foreground">{fmt(airGap.Kdelta, 3)}</p>
              <p className="text-xs text-muted-foreground mt-1">sans unité</p>
            </div>
          </div>

          {/* Results Table */}
          <ResultTable
            title="Résultats - Entrefer & Carter"
            rows={[
              {
                label: 'Entrefer calculé',
                symbol: 'δ',
                value: fmt(airGap.delta, 2),
                unit: 'cm',
              },
              {
                label: 'Entrefer (millimètres)',
                symbol: 'δ',
                value: fmt((airGap.delta || 0) * 10, 1),
                unit: 'mm',
              },
              {
                label: 'Coefficient de Carter',
                symbol: 'K_δ',
                value: fmt(airGap.Kdelta, 3),
                unit: '',
              },
              {
                label: 'Charge linéique',
                symbol: 'A',
                value: fmt(dim.A, 0),
                unit: 'A/cm',
              },
              {
                label: 'Pas polaire',
                symbol: 'τ',
                value: fmt(dim.tau, 2),
                unit: 'cm',
              },
              {
                label: 'Densité flux entrefer',
                symbol: 'B_δ0',
                value: fmt(stator.Bd0, 0),
                unit: 'Gauss',
              },
            ]}
          />
        </div>

        {/* RIGHT COLUMN: Engineering Formulas */}
        <div className="space-y-6">
          <Formula label="Entrefer calculé (δ)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>δ = </span>
              <Frac
                num={<span>0.36 {sym.dot} A {sym.dot} τ</span>}
                den={<span>K' {sym.dot} (x_d* - x_σ*) {sym.dot} B_δ0</span>}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Où: K' = {fmt(1.06, 2)}, x_d* = {fmt(1.35, 2)}, x_σ* = {fmt(0.1, 2)}
            </div>
          </Formula>

          <Formula label="Rapport d'ouverture d'encoche (b₀/δ)">
            <div className="flex items-center justify-center gap-1">
              <span>ratio = </span>
              <Frac num={<span>b₀</span>} den={<span>δ</span>} />
              <span>=</span>
              <Frac num={<span>l_e / 10</span>} den={<span>δ</span>} />
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Où: l_e = {fmt(stator.le, 1)} (largeur ouverture)
            </div>
          </Formula>

          <Formula label="Coefficient de saturation (γ)">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>γ = </span>
              <Frac num={<span>ratio²</span>} den={<span>5 + ratio</span>} />
            </div>
          </Formula>

          <Formula label="Coefficient de Carter (K_δ)">
            <div className="flex items-center justify-center gap-1">
              <span>K_δ = </span>
              <Frac
                num={<span>t₁</span>}
                den={<span>t₁ - γ {sym.dot} δ</span>}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Où: t₁ = {fmt(stator.t1, 2)} cm (pas dentaire)
            </div>
          </Formula>

          <Formula label="Entrefer apparent (δ_app)">
            <div className="flex items-center justify-center gap-1">
              <span>δ_app = δ {sym.dot} K_δ = {fmt((airGap.delta || 0) * (airGap.Kdelta || 1), 3)} cm</span>
            </div>
          </Formula>
        </div>
      </div>

      {/* Full-width validation section */}
      <div className="mt-8 rounded-lg border border-border p-6 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground mb-4">Vérification des paramètres</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-xs text-muted-foreground font-semibold mb-2">ENTREFER</p>
            <p className="text-lg font-bold font-mono text-foreground">{fmt(airGap.delta, 2)} cm</p>
            <p className="text-xs text-muted-foreground mt-2">
              {(airGap.delta || 0) > 0 && (airGap.delta || 0) < 1
                ? '✓ Valeur nominale correcte'
                : '⚠ Entrefer anormal'}
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-xs text-muted-foreground font-semibold mb-2">COEFF. CARTER</p>
            <p className="text-lg font-bold font-mono text-foreground">{fmt(airGap.Kdelta, 3)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {(airGap.Kdelta || 0) > 1 && (airGap.Kdelta || 0) < 1.5
                ? '✓ Norme IEC'
                : '⚠ Hors limites'}
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card">
            <p className="text-xs text-muted-foreground font-semibold mb-2">CHARGE LINÉIQUE</p>
            <p className="text-lg font-bold font-mono text-foreground">{fmt(dim.A, 0)} A/cm</p>
            <p className="text-xs text-muted-foreground mt-2">
              {(dim.A || 0) > 0 && (dim.A || 0) < 1000
                ? '✓ Plage nominale'
                : '⚠ À vérifier'}
            </p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
