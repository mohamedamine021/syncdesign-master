'use client';

import { useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

// ============================================
// MATH COMPONENTS (HTML-based, no KaTeX)
// ============================================
function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex justify-center items-center py-1 overflow-x-auto text-slate-800 dark:text-slate-200 text-sm">
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
  pi: <span className="mx-0.5">π</span>,
  phi: <span className="mx-0.5">Φ</span>,
  cos: <span className="mx-0.5">cos(φ)</span>,
  alpha: <span className="mx-0.5">α</span>,
  beta: <span className="mx-0.5">β</span>,
  tau: <span className="mx-0.5">τ</span>,
  delta: <span className="mx-0.5">δ</span>,
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function Step4() {
  const { inputs, nominal, mainDimensions, stator, setCurrentStep } = useMachineStore();

  const statorData = useMemo(() => {
    if (!inputs || !nominal || !mainDimensions) return null;

    try {
      return CalculationEngine.calcStator(inputs, nominal, mainDimensions);
    } catch (error) {
      console.error('[Step4] calcStator error:', error);
      return null;
    }
  }, [inputs, nominal, mainDimensions, stator]);

  // Update step on mount
  useMemo(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  // Error state: missing required inputs
  if (!inputs || !nominal || !mainDimensions) {
    return (
      <StepLayout
        stepNumber={4}
        title="Enroulements, encoches et culasse du stator"
        description="Dimensionnement complet de la partie statorique"
      >
        <p className="text-destructive font-medium">
          Paramètres manquants. Veuillez compléter les étapes 1 à 3 (entrées, valeurs nominales, dimensions principales).
        </p>
      </StepLayout>
    );
  }

  // Error state: calculation failed
  if (!statorData) {
    return (
      <StepLayout
        stepNumber={4}
        title="Enroulements, encoches et culasse du stator"
        description="Dimensionnement complet de la partie statorique"
      >
        <p className="text-destructive font-medium">
          Erreur lors du calcul des paramètres du stator. Vérifiez les données d'entrée.
        </p>
      </StepLayout>
    );
  }

  const fmt = (v: number | null | undefined, d: number = 2): string => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '—';
    return v.toFixed(d);
  };

  // Extract values with safe defaults
  const q1 = statorData.q1 || 0;
  const Z1 = statorData.Z1 || 0;
  const t1 = statorData.t1 || 0;
  const up1 = statorData.up1 || 0;
  const w1 = statorData.w1 || 0;
  const Y = statorData.Y || 0;
  const Kw1 = statorData.Kw1 || 0;
  const Phi0 = statorData.Phi0 || 0;
  const PhiCh = statorData.PhiCh || 0;
  const Bd0 = statorData.Bd0 || 0;
  const BdN = statorData.BdN || 0;
  const Bd1 = statorData.Bd1 || 0;
  const Bc = statorData.Bc || 0;
  const Sc = statorData.Sc || 0;
  const DeltaC = statorData.DeltaC || 0;
  const Ra75 = statorData.Ra75 || 0;
  const Ra75_pu = statorData.Ra75pu || 0;
  const Gm = statorData.Gm || 0;
  const be = statorData.be || 0;
  const he = statorData.he || 0;
  const Lc = statorData.Lc || 0;

  const D = mainDimensions.D || 0;
  const lDeltaFinal = mainDimensions.lDeltaFinal || 0;
  const alphaDelta = mainDimensions.alphaDelta || 0;
  const tau = mainDimensions.tau || 0;
  const l = mainDimensions.l || 0;
  const Uph = nominal.Uph || 0;
  const In = nominal.In || 0;
  const f = inputs.f || 0;
  const p = nominal.p || 0;

  return (
    <StepLayout
      stepNumber={4}
      title="Enroulements, encoches et culasse du stator"
      description="Dimensionnement complet de la partie statorique"
    >
      {/* ============================================ */}
      {/* 2-COLUMN GRID: LEFT (Results) & RIGHT (Formulas) */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Summary Cards + Result Tables */}
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Nombre d'encoches</p>
              <p className="text-2xl font-bold font-mono text-foreground">{Z1}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Pas dentaire (cm)</p>
              <p className="text-2xl font-bold font-mono text-foreground">{fmt(t1, 2)}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Spires/phase</p>
              <p className="text-2xl font-bold font-mono text-foreground">{w1}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Induction (Gauss)</p>
              <p className="text-2xl font-bold font-mono text-foreground">{fmt(Bd0, 0)}</p>
            </div>
          </div>

          {/* Result Tables */}
          <ResultTable
            title="Enroulements & Géométrie"
            rows={[
              { label: 'Encoches/pôle/phase', symbol: 'q₁', value: String(q1) },
              { label: 'Nombre total encoches', symbol: 'Z₁', value: String(Z1) },
              { label: 'Pas dentaire', symbol: 't₁', value: fmt(t1, 2), unit: 'cm' },
              { label: 'Conducteurs/encoche', symbol: 'up₁', value: String(up1) },
              { label: 'Spires par phase', symbol: 'w₁', value: String(w1) },
              { label: 'Pas d\'enroulement', symbol: 'Y', value: String(Y) },
              { label: 'Facteur d\'enroulement', symbol: 'Kw₁', value: fmt(Kw1, 3) },
            ]}
          />

          <ResultTable
            title="Flux & Inductions"
            rows={[
              { label: 'Flux à vide', symbol: 'Φ₀', value: fmt(Phi0 / 1e6, 2), unit: '× 10⁶ Wb' },
              { label: 'Flux en charge', symbol: 'Φ_ch', value: fmt(PhiCh / 1e6, 2), unit: '× 10⁶ Wb' },
              { label: 'Induction entrefer (vide)', symbol: 'B_δ₀', value: fmt(Bd0, 0), unit: 'Gauss' },
              { label: 'Induction entrefer (charge)', symbol: 'B_δN', value: fmt(BdN, 0), unit: 'Gauss' },
              { label: 'Induction dent', symbol: 'B_d1', value: fmt(Bd1, 0), unit: 'Gauss' },
              { label: 'Induction culasse', symbol: 'B_c', value: fmt(Bc, 0), unit: 'Gauss' },
            ]}
          />

          <ResultTable
            title="Conducteur & Résistance"
            rows={[
              { label: 'Section conducteur', symbol: 'S_c', value: fmt(Sc, 1), unit: 'mm²' },
              { label: 'Densité courant', symbol: 'Δ_c', value: fmt(DeltaC, 2), unit: 'A/mm²' },
              { label: 'Longueur moyenne', symbol: 'L_c', value: fmt(Lc, 2), unit: 'm' },
              { label: 'Résistance 75°C', symbol: 'R_a75', value: fmt(Ra75, 4), unit: 'Ω' },
              { label: 'Résistance (p.u.)', symbol: 'R_a75*', value: fmt(Ra75_pu, 4) },
              { label: 'Poids cuivre', symbol: 'G_m', value: fmt(Gm, 1), unit: 'kg' },
            ]}
          />

          {/* Slot Geometry SVG */}
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <p className="text-sm font-semibold text-foreground mb-3">Géométrie de l'encoche</p>
            <svg viewBox="0 0 150 300" className="w-full max-w-xs mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Stator back iron */}
              <rect x="20" y="10" width="110" height="280" rx="3" className="stroke-border" strokeDasharray="4 2" />
              {/* Slot opening */}
              <rect x="55" y="10" width="40" height="18" className="fill-primary/20 stroke-primary" />
              {/* Upper coil */}
              <rect x="40" y="35" width="70" height="100" rx="2" className="fill-accent/20 stroke-accent" />
              {/* Insulation divider */}
              <line x1="40" y1="138" x2="110" y2="138" className="stroke-warning" strokeDasharray="3 2" strokeWidth="1" />
              {/* Lower coil */}
              <rect x="40" y="145" width="70" height="100" rx="2" className="fill-accent/20 stroke-accent" />
              {/* Dimensions */}
              <text x="115" y="90" className="fill-muted-foreground text-[10px] font-mono">
                h_e={fmt(he, 0)}mm
              </text>
              <text x="70" y="285" className="fill-muted-foreground text-[10px] font-mono">
                b_e={fmt(be, 1)}mm
              </text>
            </svg>
          </div>
        </div>

        {/* RIGHT COLUMN: Engineering Formulas */}
        <div className="space-y-6">
          <Formula label="Nombre total d'encoches">
            <div className="flex items-center justify-center gap-1">
              Z<sub className="text-xs">1</sub> <span className="mx-1">=</span> 2p {sym.dot} m {sym.dot} q<sub className="text-xs">1</sub>
              <span className="mx-1">=</span>
              <span className="font-mono">{Z1}</span>
            </div>
          </Formula>

          <Formula label="Pas dentaire">
            <div className="flex items-center justify-center gap-1">
              t<sub className="text-xs">1</sub> <span className="mx-1">=</span>
              <Frac num={<>{sym.pi} {sym.dot} D</>} den={<>Z<sub className="text-xs">1</sub></>} />
              <span className="mx-1">=</span>
              <span className="font-mono">{fmt(t1, 2)} cm</span>
            </div>
          </Formula>

          <Formula label="Spires par phase">
            <div className="flex items-center justify-center gap-1">
              w<sub className="text-xs">1</sub> <span className="mx-1">=</span>
              <Frac num={<>p {sym.dot} q<sub className="text-xs">1</sub> {sym.dot} up<sub className="text-xs">1</sub></>} den={<>a</>} />
              <span className="mx-1">=</span>
              <span className="font-mono">{w1}</span>
            </div>
          </Formula>

          <Formula label="Flux magnétique à vide">
            <div className="flex items-center justify-center gap-1 text-xs">
              <Frac
                num={<>4 {sym.dot} U<sub>ph</sub> {sym.dot} 10<sup>8</sup></>}
                den={<>0.09 {sym.dot} f {sym.dot} w<sub>1</sub> {sym.dot} K<sub>01</sub></>}
              />
              <span className="mx-1">=</span>
              <span className="font-mono">{fmt(Phi0 / 1e6, 2)} × 10⁶ Wb</span>
            </div>
          </Formula>

          <Formula label="Induction entrefer à vide">
            <div className="flex items-center justify-center gap-1">
              B<sub className="text-xs">δ0</sub> <span className="mx-1">=</span>
              <Frac
                num={<>{sym.phi}<sub>0</sub></>}
                den={<>{sym.alpha}<sub>δ</sub> {sym.dot} {sym.tau} {sym.dot} l<sub>δ</sub></>}
              />
              <span className="mx-1">=</span>
              <span className="font-mono">{fmt(Bd0, 0)} G</span>
            </div>
          </Formula>

          <Formula label="Flux en charge (1.08 × Φ₀)">
            <div className="flex items-center justify-center gap-1">
              {sym.phi}<sub>ch</sub> <span className="mx-1">=</span> 1.08 {sym.dot} {sym.phi}<sub>0</sub>
              <span className="mx-1">=</span>
              <span className="font-mono">{fmt(PhiCh / 1e6, 2)} × 10⁶ Wb</span>
            </div>
          </Formula>

          <Formula label="Induction dent (avec saturation)">
            <div className="flex items-center justify-center gap-1 text-xs">
              <Frac
                num={<>B<sub>δN</sub> {sym.dot} t<sub>1</sub> {sym.dot} l<sub>δ</sub></>}
                den={<>b<sub>d1</sub> {sym.dot} l {sym.dot} K<sub>f</sub></>}
              />
              <span className="mx-1">=</span>
              <span className="font-mono">{fmt(Bd1, 0)} G</span>
            </div>
          </Formula>

          <Formula label="Induction culasse stator">
            <div className="flex items-center justify-center gap-1">
              B<sub className="text-xs">c</sub> <span className="mx-1">=</span>
              <Frac num={<>{sym.phi}<sub>ch</sub></>} den={<>2 {sym.dot} h<sub>c</sub> {sym.dot} l {sym.dot} K<sub>f</sub></>} />
              <span className="mx-1">=</span>
              <span className="font-mono">{fmt(Bc, 0)} G</span>
            </div>
          </Formula>

          <Formula label="Densité courant (A/mm²)">
            <div className="flex items-center justify-center gap-1">
              Δ<sub className="text-xs">c</sub> <span className="mx-1">=</span>
              <Frac num={<>I<sub>n</sub></>} den={<>S<sub>c</sub></>} />
              <span className="mx-1">=</span>
              <span className="font-mono">{fmt(DeltaC, 2)} A/mm²</span>
            </div>
          </Formula>

          <Formula label="Résistance stator à 75°C">
            <div className="flex items-center justify-center gap-1">
              R<sub className="text-xs">a75</sub> <span className="mx-1">=</span>
              <Frac num={<>1</>} den={<>46</>} />
              {sym.dot}
              <Frac num={<>L<sub>c</sub></>} den={<>S<sub>c</sub></>} />
              <span className="mx-1">=</span>
              <span className="font-mono">{fmt(Ra75, 4)} Ω</span>
            </div>
          </Formula>

          {/* Info box */}
          <div className="rounded-lg border border-info/50 bg-info/10 p-4">
            <p className="text-xs text-info font-medium">
              ℹ Tous les calculs sont extraits de la fonction CalculationEngine.calcStator() avec les spécifications IEC 60034.
            </p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
