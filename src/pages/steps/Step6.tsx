import { useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

// HTML-based formula rendering components (NO KaTeX/LaTeX)
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
      <span className="border-b border-current px-1 leading-tight text-sm">{num}</span>
      <span className="px-1 leading-tight text-sm">{den}</span>
    </span>
  );
}

const sym = {
  dot: <span className="mx-0.5">·</span>,
  sqrt: (content: string) => (
    <span className="inline-flex items-center mx-1">
      <span className="text-lg mr-0.5">√</span>
      <span className="border-t border-current px-0.5">{content}</span>
    </span>
  ),
  alpha: <span>α</span>,
  sigma: <span>σ</span>,
  tau: <span>τ</span>,
  phi: <span>Φ</span>,
};

export default function Step6() {
  const { inputs, nominal, mainDimensions: dim, stator, airGap, setCurrentStep } = useMachineStore();

  // useMemo: Check if rotor exists; if not, calculate it
  const calculatedRotor = useMemo(() => {
    if (!dim || !stator || !airGap) return null;
    
    try {
      return CalculationEngine.calcRotor(dim, stator, airGap);
    } catch (error) {
      console.error('[v0] Error calculating rotor:', error);
      return null;
    }
  }, [dim, stator, airGap]);

  setCurrentStep?.(6);

  // Error handling: Check required inputs
  if (!inputs?.Pn || !nominal || !dim || !stator || !airGap) {
    return (
      <StepLayout stepNumber={6} title="Rotor & Pôles" description="Dimensionnement des pôles et de la culasse rotorique">
        <p className="text-destructive font-semibold">Données manquantes. Veuillez compléter les étapes précédentes.</p>
      </StepLayout>
    );
  }

  if (!calculatedRotor) {
    return (
      <StepLayout stepNumber={6} title="Rotor & Pôles" description="Dimensionnement des pôles et de la culasse rotorique">
        <p className="text-destructive font-semibold">Calcul impossible. Erreur lors du dimensionnement du rotor.</p>
      </StepLayout>
    );
  }

  const fmt = (v: number | null | undefined, d = 2): string => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '—';
    return v.toFixed(d);
  };

  return (
    <StepLayout 
      stepNumber={6} 
      title="Rotor & Pôles" 
      description="Dimensionnement des pôles et de la culasse rotorique"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Summary Cards & Results Table */}
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Arc polaire</p>
              <p className="text-2xl font-mono font-bold text-foreground">{fmt(calculatedRotor.bp, 1)}</p>
              <p className="text-xs text-muted-foreground">cm</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Rayon épanoui</p>
              <p className="text-2xl font-mono font-bold text-foreground">{fmt(calculatedRotor.Rp, 1)}</p>
              <p className="text-xs text-muted-foreground">cm</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Hauteur épanoui</p>
              <p className="text-2xl font-mono font-bold text-foreground">{fmt(calculatedRotor.hp, 1)}</p>
              <p className="text-xs text-muted-foreground">cm</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Coeff. dispersion</p>
              <p className="text-2xl font-mono font-bold text-foreground">{fmt(calculatedRotor.sigmaN, 3)}</p>
              <p className="text-xs text-muted-foreground">p.u.</p>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-lg border border-border bg-muted/30 p-5">
            <ResultTable 
              title="Résumé - Rotor & Pôles"
              rows={[
                { label: 'Arc polaire', symbol: 'bp', value: fmt(calculatedRotor.bp, 1), unit: 'cm' },
                { label: 'Rayon épanouissement', symbol: 'Rp', value: fmt(calculatedRotor.Rp, 1), unit: 'cm' },
                { label: 'Hauteur épanouissement', symbol: 'hp', value: fmt(calculatedRotor.hp, 1), unit: 'cm' },
                { label: 'Coefficient dispersion', symbol: 'σn', value: fmt(calculatedRotor.sigmaN, 3), unit: 'p.u.' },
                { label: 'Flux dans le pôle', symbol: 'ΦM', value: `${fmt(calculatedRotor.PhiM / 1e6, 2)} × 10⁶`, unit: 'Mx' },
                { label: 'Largeur noyau polaire', symbol: 'bM', value: fmt(calculatedRotor.bM, 1), unit: 'cm' },
                { label: 'Hauteur noyau polaire', symbol: 'hM', value: fmt(calculatedRotor.hM, 1), unit: 'cm' },
                { label: 'Hauteur culasse rotor', symbol: 'Ha', value: fmt(calculatedRotor.Ha, 1), unit: 'cm' },
                { label: 'Induction culasse rotor', symbol: 'Ba', value: fmt(calculatedRotor.Ba, 0), unit: 'Gauss' },
              ]}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Engineering Formulas */}
        <div className="space-y-4">
          {/* Formula 1: Arc polaire */}
          <Formula label="Arc polaire">
            <span>
              b<sub>p</sub> = {sym.alpha}<sub>p</sub> {sym.dot} {sym.tau} = {fmt(calculatedRotor.bp, 1)} cm
            </span>
          </Formula>

          {/* Formula 2: Rayon d'épanouissement */}
          <Formula label="Rayon d'épanouissement polaire">
            <div className="text-center">
              <div>R<sub>p</sub> = <Frac num={<>D</>} den={<>2</>}/> + <Frac num={<>8D({sym.delta}<sub>M</sub> - {sym.delta})</>} den={<>b<sub>p</sub><sup>2</sup></>}/></div>
              <div className="text-xs mt-1 text-muted-foreground">= {fmt(calculatedRotor.Rp, 1)} cm</div>
            </div>
          </Formula>

          {/* Formula 3: Hauteur d'épanouissement */}
          <Formula label="Hauteur d'épanouissement polaire">
            <div className="text-center">
              <div>h<sub>p</sub> = h' + R<sub>p</sub> - {sym.sqrt(`R_p^2 - (b_p/2)^2`)}</div>
              <div className="text-xs mt-1 text-muted-foreground">= {fmt(calculatedRotor.hp, 1)} cm</div>
            </div>
          </Formula>

          {/* Formula 4: Coefficient de dispersion polaire */}
          <Formula label="Coefficient de dispersion polaire">
            <div className="text-center">
              <div>{sym.sigma}<sub>n</sub> = 1 + K<sub>{sym.sigma}</sub> <Frac num={<>35 {sym.delta}</>} den={<>{sym.tau}<sup>2</sup></>}/></div>
              <div className="text-xs mt-1 text-muted-foreground">= {fmt(calculatedRotor.sigmaN, 3)}</div>
            </div>
          </Formula>

          {/* Formula 5: Flux dans le pôle */}
          <Formula label="Flux dans la zone polaire">
            <div className="text-center">
              <div>{sym.phi}<sub>M</sub> = {sym.sigma}<sub>n</sub> {sym.dot} {sym.phi}<sub>ch</sub></div>
              <div className="text-xs mt-1 text-muted-foreground">= {fmt(calculatedRotor.PhiM / 1e6, 2)} × 10⁶ Mx</div>
            </div>
          </Formula>

          {/* Formula 6: Largeur noyau polaire */}
          <Formula label="Largeur du noyau polaire">
            <div className="text-center">
              <div>b<sub>M</sub> = <Frac num={<>{sym.phi}<sub>M</sub></>} den={<>B<sub>M</sub>* · K<sub>f</sub> · l<sub>M</sub></>}/></div>
              <div className="text-xs mt-1 text-muted-foreground">= {fmt(calculatedRotor.bM, 1)} cm</div>
            </div>
          </Formula>

          {/* Formula 7: Hauteur noyau polaire */}
          <Formula label="Hauteur du noyau polaire">
            <div className="text-center">
              <div>h<sub>M</sub> = 10.5 {sym.delta} + 8</div>
              <div className="text-xs mt-1 text-muted-foreground">= {fmt(calculatedRotor.hM, 1)} cm</div>
            </div>
          </Formula>

          {/* Formula 8: Hauteur culasse rotor */}
          <Formula label="Hauteur de la culasse du rotor">
            <div className="text-center">
              <div>H<sub>a</sub> = <Frac num={<>D - 2{sym.delta} - 2(h<sub>p</sub> + h<sub>M</sub>) - d<sub>arbre</sub></>} den={<>2</>}/></div>
              <div className="text-xs mt-1 text-muted-foreground">= {fmt(calculatedRotor.Ha, 1)} cm</div>
            </div>
          </Formula>

          {/* Formula 9: Induction culasse rotor */}
          <Formula label="Induction dans la culasse du rotor">
            <div className="text-center">
              <div>B<sub>a</sub> = <Frac num={<>{sym.phi}<sub>M</sub></>} den={<>2 H<sub>a</sub> l<sub>a</sub></>}/></div>
              <div className="text-xs mt-1 text-muted-foreground">= {fmt(calculatedRotor.Ba, 0)} Gauss</div>
            </div>
          </Formula>
        </div>
      </div>

      {/* Validation Section */}
      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Vérification magnétique du rotor</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-md border text-sm ${calculatedRotor.Ba < 15000 ? 'border-success/50 bg-success/10' : 'border-warning/50 bg-warning/10'}`}>
            <p className="text-muted-foreground text-xs">Induction culasse</p>
            <p className={`font-mono font-bold ${calculatedRotor.Ba < 15000 ? 'text-success' : 'text-warning'}`}>{fmt(calculatedRotor.Ba, 0)} Gauss</p>
            <p className="text-xs text-muted-foreground mt-1">{calculatedRotor.Ba < 15000 ? '✓ OK' : '⚠ Élevé'}</p>
          </div>
          <div className={`p-3 rounded-md border text-sm ${calculatedRotor.Ha > 5 ? 'border-success/50 bg-success/10' : 'border-warning/50 bg-warning/10'}`}>
            <p className="text-muted-foreground text-xs">Hauteur culasse</p>
            <p className={`font-mono font-bold ${calculatedRotor.Ha > 5 ? 'text-success' : 'text-warning'}`}>{fmt(calculatedRotor.Ha, 1)} cm</p>
            <p className="text-xs text-muted-foreground mt-1">{calculatedRotor.Ha > 5 ? '✓ OK' : '⚠ Faible'}</p>
          </div>
          <div className={`p-3 rounded-md border text-sm ${calculatedRotor.sigmaN >= 1.1 && calculatedRotor.sigmaN <= 1.3 ? 'border-success/50 bg-success/10' : 'border-warning/50 bg-warning/10'}`}>
            <p className="text-muted-foreground text-xs">Coefficient dispersion</p>
            <p className={`font-mono font-bold ${calculatedRotor.sigmaN >= 1.1 && calculatedRotor.sigmaN <= 1.3 ? 'text-success' : 'text-warning'}`}>{fmt(calculatedRotor.sigmaN, 3)}</p>
            <p className="text-xs text-muted-foreground mt-1">{calculatedRotor.sigmaN >= 1.1 && calculatedRotor.sigmaN <= 1.3 ? '✓ OK' : '⚠ Hors plage'}</p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
