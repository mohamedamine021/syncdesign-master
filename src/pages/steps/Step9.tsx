import { useEffect, useMemo } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { StepLayout } from '@/components/StepLayout';
import { ResultTable } from '@/components/ResultTable';
import { CalculationEngine } from '@/engine/CalculationEngine';

// ============================================================================
// HTML-Based Math Components (NO KaTeX/LaTeX)
// ============================================================================
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
};

// ============================================================================
// Step9: Système d'excitation (Excitation System)
// ============================================================================
export default function Step9() {
  const { inputs, nominal, mainDimensions: dim, airGap, stator, rotor, excitation, setCurrentStep } = useMachineStore();

  useEffect(() => {
    if (typeof setCurrentStep === 'function') {
      setCurrentStep(9);
    }
  }, [setCurrentStep]);

  // Calcul useMemo : vérifie si excitation existe, sinon appelle calcExcitationSystem
  const excitationData = useMemo(() => {
    if (excitation) return excitation;

    if (!nominal || !dim || !airGap || !stator || !rotor || !inputs) {
      return null;
    }

    try {
      // Récupère la FMM nominale d'excitation (exemple: 99 A, voir Step7)
      const F_Bn = 99;
      const result = CalculationEngine.calcExcitationSystem(
        nominal,
        dim,
        airGap,
        F_Bn,
        inputs.f || 50
      );

      // Transforme la structure de retour en format ExcitationSystem compatible avec le reste
      return {
        Uexc: result.electricalSpecs.U_exc_V,
        Fbn: F_Bn,
        IB: result.electricalSpecs.I_B_Nominal_A,
        DeltaB: result.thermal.delta_B_A_mm2,
        ThetaB: result.electricalSpecs.Theta_B,
        wB: result.coilSizing.omega_B_turns,
        SB: result.commercialWire.section_mm2,
        rB: result.electricalSpecs.R_B_75_Ohm,
        PBn: result.electricalSpecs.P_Excitation_kW,
        GB: result.coilSizing.weight_copper_kg,
      };
    } catch (error) {
      console.error('[v0] Error calculating excitation system:', error);
      return null;
    }
  }, [excitation, nominal, dim, airGap, stator, rotor, inputs]);

  // Affiche erreur si données manquantes ou calcul échoué
  if (!excitationData) {
    return (
      <StepLayout 
        stepNumber={9} 
        title="Système d'excitation" 
        description="Calcul du courant d'excitation et vérifications thermiques"
      >
        <p className="text-destructive">
          Données manquantes. Veuillez compléter les étapes précédentes (Étapes 1-8).
        </p>
      </StepLayout>
    );
  }

  const fmt = (v: number | null | undefined, d = 2) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '—';
    return v.toFixed(d);
  };

  return (
    <StepLayout 
      stepNumber={9} 
      title="Système d'excitation" 
      description="Calcul du courant d'excitation et vérifications thermiques"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Summary Cards + Results Table */}
        <div className="space-y-4">
          {/* Cartes résumé principales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Courant nominal</p>
              <p className="text-2xl font-bold font-mono text-foreground">{fmt(excitationData.IB, 0)}</p>
              <p className="text-xs text-muted-foreground">A</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Densité courant</p>
              <p className="text-2xl font-bold font-mono text-foreground">{fmt(excitationData.DeltaB, 2)}</p>
              <p className="text-xs text-muted-foreground">A/mm²</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Spires par pôle</p>
              <p className="text-2xl font-bold font-mono text-foreground">{excitationData.wB}</p>
              <p className="text-xs text-muted-foreground">tours</p>
            </div>
            <div className={`p-4 rounded-lg border text-center ${
              excitationData.ThetaB <= 100 
                ? 'border-success/50 bg-success/10' 
                : 'border-destructive/50 bg-destructive/10'
            }`}>
              <p className="text-xs text-muted-foreground mb-1">Température</p>
              <p className={`text-2xl font-bold font-mono ${
                excitationData.ThetaB <= 100 ? 'text-success' : 'text-destructive'
              }`}>
                {fmt(excitationData.ThetaB, 0)}
              </p>
              <p className="text-xs text-muted-foreground">°C</p>
            </div>
          </div>

          {/* Tableau résumé détaillé */}
          <ResultTable
            title="Paramètres du système d'excitation"
            rows={[
              { label: 'Tension d\'excitation', symbol: 'U_exc', value: fmt(excitationData.Uexc, 0), unit: 'V' },
              { label: 'FMM nominale excitation', symbol: 'F_Bn', value: fmt(excitationData.Fbn, 0), unit: 'A' },
              { label: 'Courant nominal', symbol: 'I_B', value: fmt(excitationData.IB, 0), unit: 'A' },
              { label: 'Densité courant', symbol: 'Δ_B', value: fmt(excitationData.DeltaB, 2), unit: 'A/mm²' },
              { label: 'Température', symbol: 'Θ_B', value: fmt(excitationData.ThetaB, 0), unit: '°C' },
              { label: 'Spires par pôle', symbol: 'w_B', value: String(excitationData.wB) },
              { label: 'Section conducteur', symbol: 'S_B', value: fmt(excitationData.SB, 1), unit: 'mm²' },
              { label: 'Résistance à 75°C', symbol: 'r_B', value: fmt(excitationData.rB, 4), unit: 'Ω' },
              { label: 'Puissance excitation', symbol: 'P_Bn', value: fmt(excitationData.PBn, 1), unit: 'kW' },
              { label: 'Poids cuivre', symbol: 'G_B', value: fmt(excitationData.GB, 1), unit: 'kg' },
            ]}
          />
        </div>

        {/* ================================================================
            COLONNE DROITE: Formules mathématiques d'ingénierie
            ================================================================ */}
        <div className="space-y-4">
          {/* Formule 1 : FMM et courant */}
          <Formula label="FMM et courant nominaux">
            <div className="text-center">
              <div className="mb-3">
                <span>ω<sub>B</sub> = </span>
                <Frac num="F_Bn" den="2 · I_B" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Nombre de spires pour générer la FMM requise
              </div>
            </div>
          </Formula>

          {/* Formule 2 : Hauteur bobine */}
          <Formula label="Dimensions de la bobine">
            <div className="text-center">
              <div className="mb-3">
                <span>h<sub>bobine</sub> = 0.1 · a<sub>eff</sub> · (ω<sub>B</sub> + 1)</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Hauteur effective de la bobine d'excitation
              </div>
            </div>
          </Formula>

          {/* Formule 3 : Longueur moyenne de spire */}
          <Formula label="Longueur moyenne de spire">
            <div className="text-center">
              <div className="mb-3">
                <span>L<sub>Bmoy</sub> = 2(l<sub>M</sub> - 2b') + π(b<sub>m</sub> + Δ + b/2)</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Longueur du trajet moyen d'une spire
              </div>
            </div>
          </Formula>

          {/* Formule 4 : Poids cuivre */}
          <Formula label="Poids total du cuivre">
            <div className="text-center">
              <div className="mb-3">
                <span>G<sub>B</sub> = 8.9 · L<sub>B,total</sub> · S<sub>B</sub> · 10<sup>-3</sup></span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Poids du cuivre (densité = 8.9 g/cm³)
              </div>
            </div>
          </Formula>

          {/* Formule 5 : Résistance thermique */}
          <Formula label="Résistance à température donnée">
            <div className="text-center">
              <div className="mb-3">
                <span>R<sub>B,75</sub> = R<sub>B,120</sub> · </span>
                <Frac num="235 + 75" den="235 + 120" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Correction de résistance par la loi de Wyeth (cuivre pur)
              </div>
            </div>
          </Formula>

          {/* Formule 6 : Courant maximal */}
          <Formula label="Courant d'excitation maximal">
            <div className="text-center">
              <div className="mb-3">
                <span>I<sub>B,max</sub> = </span>
                <Frac num="U'_exc" den="R_B,120" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Courant limite (marge de surcharge disponible)
              </div>
            </div>
          </Formula>

          {/* Formule 7 : Puissance excitation */}
          <Formula label="Puissance d'excitation nominale">
            <div className="text-center">
              <div className="mb-3">
                <span>P<sub>Bn</sub> = U<sub>exc</sub> · I<sub>B,max</sub> / 1000</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Puissance nominale requise pour l'excitation (en kW)
              </div>
            </div>
          </Formula>

          {/* Formule 8 : Densité courant estimée */}
          <Formula label="Densité courant thermique estimée">
            <div className="text-center">
              <div className="mb-3">
                <span>Δ<sub>B</sub> = 20 · √(Θ<sub>B</sub> · α · k / b<sub>max</sub>)</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Estimation basée sur le coefficient de refroidissement
              </div>
            </div>
          </Formula>

          {/* Formule 9 : Section commerciale */}
          <Formula label="Sélection du fil commercial">
            <div className="text-center">
              <div className="mb-3">
                <span>S<sub>théo</sub> = </span>
                <Frac 
                  num="k_marge · ρ₁₃₀ · p · F_Bn · L_Bmoy · 10⁻²" 
                  den="U'_exc" 
                />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Section théorique avant sélection dans le catalogue commercial
              </div>
            </div>
          </Formula>

          {/* Formule 10 : Vérification thermique */}
          <Formula label="Vérification thermique">
            <div className="text-center">
              <div className="mb-3">
                <span>Θ<sub>B</sub> = Θ<sub>amb</sub> + Δ<sub>élev</sub></span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {excitationData.ThetaB <= 100 
                  ? '✓ Température dans les limites (≤ 100°C classe F)' 
                  : '⚠ Température DÉPASSÉE — améliorer le refroidissement'}
              </div>
            </div>
          </Formula>
        </div>
      </div>

      {/* Validation et avertissements */}
      <div className="mt-8 rounded-lg border-2 border-border p-5 bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Vérifications et critères</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-md border text-sm ${
            excitationData.DeltaB <= 6 
              ? 'border-success/50 bg-success/10 text-success' 
              : excitationData.DeltaB <= 8 
                ? 'border-warning/50 bg-warning/10 text-warning'
                : 'border-destructive/50 bg-destructive/10 text-destructive'
          }`}>
            <p className="font-semibold mb-1">Densité courant</p>
            <p>{fmt(excitationData.DeltaB, 2)} A/mm²</p>
            <p className="text-xs mt-1">
              {excitationData.DeltaB <= 6 ? '✓ Très bonne' : excitationData.DeltaB <= 8 ? '⚠ Acceptable' : '✗ Élevée'}
            </p>
          </div>

          <div className={`p-4 rounded-md border text-sm ${
            excitationData.ThetaB <= 100 
              ? 'border-success/50 bg-success/10 text-success' 
              : 'border-destructive/50 bg-destructive/10 text-destructive'
          }`}>
            <p className="font-semibold mb-1">Température</p>
            <p>{fmt(excitationData.ThetaB, 0)}°C</p>
            <p className="text-xs mt-1">
              {excitationData.ThetaB <= 100 ? '✓ Limite classe F' : '✗ DÉPASSEMENT'}
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-muted/50 text-sm">
            <p className="font-semibold mb-1">Puissance excitation</p>
            <p>{fmt(excitationData.PBn, 1)} kW</p>
            <p className="text-xs text-muted-foreground mt-1">
              Puissance à prévoir pour le système d'excitation
            </p>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
