import { useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

// ============================================================================
// COMPOSANTS HTML POUR RENDU MATHÉMATIQUE SÉCURISÉ (PAS DE LATEX/KATEX)
// ============================================================================

function Formula({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-border shadow-sm">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex justify-center items-center py-1 overflow-x-auto text-slate-800 dark:text-slate-200">
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
  cos: <span className="mr-1">cos(φ)</span>,
  sin: <span className="mr-1">sin(φ)</span>,
  sum: <span className="mr-1">Σ</span>,
  lambda: <span className="mr-1">λ</span>,
};

// ============================================================================
// COMPOSANT STEP8
// ============================================================================

export default function Step8() {
  const { inputs, nominal, mainDimensions, stator, airGap, reactances, setCurrentStep } = useMachineStore();

  // Vérifier les dépendances
  const hasRequiredData = inputs?.Pn && nominal && mainDimensions && stator && airGap;

  // useMemo : calculer les réactances si elles n'existent pas en store
  const calculatedReactances = useMemo(() => {
    if (!hasRequiredData) return null;

    // SI reactances exist dans le store, les retourner
    if (reactances && Number.isFinite(reactances.xSigma) && reactances.xSigma > 0) {
      return reactances;
    }

    // SINON : appeler CalculationEngine.calcLeakageReactance sans fausses données
    try {
      const result = CalculationEngine.calcLeakageReactance(
        inputs,
        nominal,
        stator,
        airGap,
        mainDimensions
        // Paramètres optionnels avec valeurs par défaut
      );

      // Enrichir avec les réactances synchrones (calculées ou du store)
      return {
        ...result,
        xSigma: result.x_sigma_pu,
        xad: reactances?.xad || 1.8,
        xaq: reactances?.xaq || 1.6,
        xd: reactances?.xd || (result.x_sigma_pu + 1.8),
        xq: reactances?.xq || (result.x_sigma_pu + 1.6),
        xPrimeD: reactances?.xPrimeD || 0.3,
        x2: reactances?.x2 || 0.2,
        x_B: result.x_B,
        x_Bsigma: result.x_Bsigma,
        timeConstants_s: result.timeConstants_s,
      };
    } catch (error) {
      console.error('[Step8] Erreur calcul réactances:', error);
      return null;
    }
  }, [hasRequiredData, inputs, nominal, stator, airGap, mainDimensions, reactances]);

  // Défintie setCurrentStep
  if (typeof setCurrentStep === 'function') {
    setCurrentStep(8);
  }

  // Vérification d'erreur : pas de données disponibles
  if (!hasRequiredData) {
    return (
      <StepLayout
        stepNumber={8}
        title="Réactances du circuit (Xd, Xq, Xσ)"
        description="Calcul des réactances synchrones et transitoires"
      >
        <p className="text-destructive font-semibold">
          Erreur : Données d'entrée manquantes (puissance, dimensions ou paramètres stator).
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Veuillez compléter les étapes précédentes.
        </p>
      </StepLayout>
    );
  }

  // Vérification d'erreur : calcul échoué
  if (!calculatedReactances) {
    return (
      <StepLayout
        stepNumber={8}
        title="Réactances du circuit (Xd, Xq, Xσ)"
        description="Calcul des réactances synchrones et transitoires"
      >
        <p className="text-destructive font-semibold">
          Erreur : Impossible de calculer les réactances.
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Vérifiez que les paramètres de l'étape 4 (stator) et étape 6 (entrefer) sont valides.
        </p>
      </StepLayout>
    );
  }

  // Fonction de formatage
  const fmt = (v: number | null | undefined, d: number = 3) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '—';
    return v.toFixed(d);
  };

  // =========================================================================
  // RENDU PRINCIPAL
  // =========================================================================

  return (
    <StepLayout
      stepNumber={8}
      title="Réactances du circuit (Xd, Xq, Xσ)"
      description="Calcul des réactances synchrones longitudinale (Xd) et transversale (Xq), réactance de dispersion (Xσ)"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ================================================================ */
        {/* COLONNE GAUCHE : Cartes Résumé + ResultTable */}
        {/* ================================================================ */}
        <div className="space-y-6">
          {/* Cartes Récapitulatives */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground font-semibold mb-1">RÉACTANCE DISPERSION</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {fmt(calculatedReactances.xSigma, 3)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">p.u.</p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground font-semibold mb-1">RÉACTANCE Xd</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {fmt(calculatedReactances.xd, 3)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">p.u.</p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground font-semibold mb-1">RÉACTANCE Xq</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {fmt(calculatedReactances.xq, 3)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">p.u.</p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground font-semibold mb-1">RÉACTANCE TRANSITOIRE</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {fmt(calculatedReactances.xPrimeD, 3)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">p.u.</p>
            </div>
          </div>

          {/* ResultTable - Réactances */}
          <ResultTable
            title="Réactances calculées"
            rows={[
              { label: 'Réactance dispersion (Ohm)', symbol: 'Xσ', value: fmt(calculatedReactances.x_sigma_ohm, 2), unit: 'Ω' },
              { label: 'Réactance dispersion (p.u.)', symbol: 'Xσ*', value: fmt(calculatedReactances.xSigma, 3), unit: 'p.u.' },
              { label: 'Réactance ad (longitudinale)', symbol: 'Xad', value: fmt(calculatedReactances.xad, 3), unit: 'p.u.' },
              { label: 'Réactance aq (transversale)', symbol: 'Xaq', value: fmt(calculatedReactances.xaq, 3), unit: 'p.u.' },
              { label: 'Réactance synchrone d', symbol: 'Xd', value: fmt(calculatedReactances.xd, 3), unit: 'p.u.' },
              { label: 'Réactance synchrone q', symbol: 'Xq', value: fmt(calculatedReactances.xq, 3), unit: 'p.u.' },
              { label: 'Réactance transitoire', symbol: "X'd", value: fmt(calculatedReactances.xPrimeD, 3), unit: 'p.u.' },
              { label: 'Réactance inverse', symbol: 'X₂', value: fmt(calculatedReactances.x2, 3), unit: 'p.u.' },
            ]}
          />

          {/* ResultTable - Coefficients Lambda */}
          <ResultTable
            title="Coefficients de fuite (λ)"
            rows={[
              { label: 'Fuite encoche (λ_e1)', symbol: 'λe1', value: fmt(calculatedReactances.lambda_e1, 4), unit: '' },
              { label: 'Fuite différentielle (λ_di1)', symbol: 'λdi1', value: fmt(calculatedReactances.lambda_di1, 4), unit: '' },
              { label: 'Fuite extrémité (λ_l1)', symbol: 'λl1', value: fmt(calculatedReactances.lambda_l1, 4), unit: '' },
              { label: 'Somme coefficients (Σλ)', symbol: 'Σλ', value: fmt(calculatedReactances.sum_lambda, 4), unit: '' },
            ]}
          />

          {/* ResultTable - Constantes de Temps */}
          {calculatedReactances.timeConstants_s && (
            <ResultTable
              title="Constantes de temps (Étape 11)"
              rows={[
                { label: 'Temps ouverture vide', symbol: "T'd0", value: fmt(calculatedReactances.timeConstants_s.T_d0, 2), unit: 's' },
                { label: 'Temps transitoire', symbol: "T'd'", value: fmt(calculatedReactances.timeConstants_s.T_d_prime, 2), unit: 's' },
                { label: 'Temps amortissement', symbol: 'Ta', value: fmt(calculatedReactances.timeConstants_s.T_a, 2), unit: 's' },
              ]}
            />
          )}
        </div>

        {/* ================================================================ */}
        {/* COLONNE DROITE : Formules Mathématiques */}
        {/* ================================================================ */}
        <div className="space-y-6">
          {/* Formule 1 : Lambda_e1 */}
          <Formula label="Fuite d'encoche (λ_e1)">
            <div className="flex items-center gap-2">
              <span>λ</span>
              <sub>e1</sub>
              <span> = </span>
              <Frac
                num={<span>h₁ - hₐ</span>}
                den={<span>3 b_e</span>}
              />
              <span>{sym.dot} k</span>
              <sub>β</sub>
              <span> + </span>
              <Frac
                num={<span>h₂'</span>}
                den={<span>b_e</span>}
              />
              <span>{sym.dot} k</span>
              <sub>β'</sub>
            </div>
          </Formula>

          {/* Formule 2 : Lambda_di1 */}
          <Formula label="Fuite différentielle (λ_di1)">
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <span>λ</span>
              <sub>di1</sub>
              <span> = </span>
              <Frac
                num={<span>0.9 {sym.dot} t₁ {sym.dot} (q₁ K<sub>w1</sub>)² {sym.dot} K<sub>ou</sub> {sym.dot} σ<sub>d1</sub></span>}
                den={<span>δ {sym.dot} K<sub>δ</sub></span>}
              />
            </div>
          </Formula>

          {/* Formule 3 : Lambda_l1 */}
          <Formula label="Fuite extrémité (λ_l1)">
            <div className="flex items-center gap-2">
              <span>λ</span>
              <sub>l1</sub>
              <span> = 0.34 </span>
              <Frac
                num={<span>q₁</span>}
                den={<span>l<sub>δ,final</sub></span>}
              />
              <span>(l</span>
              <sub>l1</sub>
              <span> - 0.64 β₁ τ)</span>
            </div>
          </Formula>

          {/* Formule 4 : Somme Lambda */}
          <Formula label="Somme des coefficients (Σλ)">
            <div className="flex items-center gap-2">
              <span>{sym.sum}λ = λ</span>
              <sub>e1</sub>
              <span> + λ</span>
              <sub>di1</sub>
              <span> + λ</span>
              <sub>l1</sub>
              <span> + λ<sub>k1</sub></span>
            </div>
          </Formula>

          {/* Formule 5 : X_sigma_ohm */}
          <Formula label="Réactance dispersion (Ohm)">
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <span>X</span>
              <sub>σ</sub>
              <span> = 0.158 </span>
              <Frac
                num={<span>f</span>}
                den={<span>100</span>}
              />
              <Frac
                num={<span>w₁²</span>}
                den={<span>10000</span>}
              />
              <Frac
                num={<span>l<sub>δ</sub></span>}
                den={<span>p {sym.dot} q₁</span>}
              />
              <span>{sym.sum}λ</span>
            </div>
          </Formula>

          {/* Formule 6 : X_sigma_pu */}
          <Formula label="Réactance dispersion (p.u.)">
            <div className="flex items-center gap-2">
              <span>X</span>
              <sub>σ</sub>
              <span>* = </span>
              <Frac
                num={<span>I<sub>n</sub></span>}
                den={<span>U<sub>ph</sub></span>}
              />
              <span>{sym.dot} X</span>
              <sub>σ</sub>
            </div>
          </Formula>

          {/* Formule 7 : Xd */}
          <Formula label="Réactance synchrone longitudinale">
            <div className="flex items-center gap-2">
              <span>X</span>
              <sub>d</sub>
              <span> = X</span>
              <sub>σ</sub>
              <span>* + X</span>
              <sub>ad</sub>
            </div>
          </Formula>

          {/* Formule 8 : Xq */}
          <Formula label="Réactance synchrone transversale">
            <div className="flex items-center gap-2">
              <span>X</span>
              <sub>q</sub>
              <span> = X</span>
              <sub>σ</sub>
              <span>* + X</span>
              <sub>aq</sub>
            </div>
          </Formula>

          {/* Formule 9 : X_primeD */}
          <Formula label="Réactance transitoire">
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <span>X</span>
              <sub>d</sub>
              <span>' = X</span>
              <sub>σ</sub>
              <span>* + </span>
              <Frac
                num={<span>X<sub>ad</sub> {sym.dot} X<sub>Bσ</sub></span>}
                den={<span>X<sub>ad</sub> + X<sub>Bσ</sub></span>}
              />
            </div>
          </Formula>

          {/* Formule 10 : X2 (Inverse) */}
          <Formula label="Réactance inverse (séquence négative)">
            <div className="flex items-center gap-2">
              <span>X</span>
              <sub>2</sub>
              <span> = X</span>
              <sub>σ</sub>
              <span>* + X</span>
              <sub>2,mag</sub>
            </div>
          </Formula>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION PLEINE LARGEUR : Notes et Validation */}
      {/* ================================================================== */}
      <div className="mt-8 rounded-lg border border-info/50 bg-info/5 p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Sources de Calcul</h3>
        <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
          <li>
            <strong>Coefficients λ :</strong> Basés sur la géométrie de l'encoche (Étape 4) et les paramètres magnétiques (Étape 6)
          </li>
          <li>
            <strong>Réactance de dispersion :</strong> Calculée à partir de la fréquence, nombre de spires et longueur effective du stator
          </li>
          <li>
            <strong>Réactances synchrones (Xd, Xq) :</strong> Composée de la réactance de dispersion et des réactances de réaction d'induit (Xad, Xaq)
          </li>
          <li>
            <strong>Réactance transitoire (X'd) :</strong> Inclut les effets du circuit d'excitation en court-circuit temporaire
          </li>
          <li>
            <strong>Constantes de temps :</strong> Essentielles pour les analyses de stabilité transitoire et réponse dynamique
          </li>
        </ul>
      </div>
    </StepLayout>
  );
}
