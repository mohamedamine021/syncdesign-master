import React, { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { CalculationEngine } from '@/engine/CalculationEngine';
import { StepLayout } from '@/components/StepLayout';
import { ParamInput } from '@/components/ParamInput';

// ==========================================================================
// TRADUCTEUR D'ERREURS (Anglais -> Français)
// ==========================================================================
const translateError = (errorMsg: string): string => {
  if (errorMsg.includes('Pn must be positive')) return 'La puissance nominale (Pₙ) doit être strictement positive.';
  if (errorMsg.includes('Un must be positive')) return 'La tension nominale (Uₙ) doit être strictement positive.';
  if (errorMsg.includes('cos φ must be in (0, 1]')) return 'Le facteur de puissance (cos φ) doit être compris entre 0 (exclu) et 1.';
  if (errorMsg.includes('Frequency must be positive')) return 'La fréquence (f) doit être strictement positive.';
  if (errorMsg.includes('Speed must be positive')) return 'La vitesse de rotation (nₙ) doit être strictement positive.';
  if (errorMsg.includes('Phases must be >= 1')) return 'Le nombre de phases (m) doit être supérieur ou égal à 1.';
  if (errorMsg.includes('60f/n must be a positive integer')) return 'Le rapport 60·f/n (paires de pôles) doit tomber sur un entier positif exact.';
  
  return errorMsg; // Fallback au cas où une autre erreur apparaît
};

export default function Step1() {
  const { inputs, setInputs, setCurrentStep, recalculate, isCalculated, setIsCalculated } = useMachineStore();

  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Validation dynamique en temps réel
  const rawErrors = CalculationEngine.validateInputs(inputs);
  const isValid = rawErrors.length === 0;

  // Traduction des erreurs pour l'affichage
  const errors = rawErrors.map(translateError);

  // Gestionnaire de modification : met à jour la valeur et annule la validation précédente
  const handleChange = (key: keyof typeof inputs, value: number) => {
    setInputs({ [key]: value });
    if (isCalculated) {
      setIsCalculated(false);
    }
  };

  const handleCalculate = () => {
    if (isValid) {
      recalculate();
      setIsCalculated(true);
    }
  };

  // ==========================================================================
  // Fonction magique pour passer à la case suivante avec "Entrée"
  // ==========================================================================
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      
      const formContainer = e.currentTarget;
      const focusableElements = Array.from(
        formContainer.querySelectorAll('input, button')
      ) as HTMLElement[];
      
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      
      if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1].focus();
      } 
      else if (currentIndex === focusableElements.length - 1 && isValid) {
        handleCalculate();
        (document.activeElement as HTMLElement).blur();
      }
    }
  };

  return (
    <StepLayout
      stepNumber={1}
      title="Paramètres d'entrée"
      description="Définir le cahier des charges de la machine synchrone (alternateur)"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLONNE GAUCHE : Formulaire */}
        <div 
          className="rounded-lg border border-border p-5 space-y-1 bg-card"
          onKeyDown={handleKeyDown}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Cahier des charges</h3>
          <ParamInput label="Puissance nominale" symbol="Pₙ" value={inputs.Pn} unit="kW" onChange={(v) => handleChange('Pn', v)} min={1} step={10} />
          <ParamInput label="Tension nominale" symbol="Uₙ" value={inputs.Un} unit="V" onChange={(v) => handleChange('Un', v)} min={100} step={100} />
          <ParamInput label="Facteur de puissance" symbol="cos φ" value={inputs.cosPhi} unit="" onChange={(v) => handleChange('cosPhi', v)} min={0.1} max={1} step={0.01} />
          <ParamInput label="Fréquence" symbol="f" value={inputs.f} unit="Hz" onChange={(v) => handleChange('f', v)} min={1} step={5} />
          <ParamInput label="Vitesse nominale" symbol="nₙ" value={inputs.nn} unit="tr/min" onChange={(v) => handleChange('nn', v)} min={1} step={50} />
          <ParamInput label="Nombre de phases" symbol="m" value={inputs.m} unit="" onChange={(v) => handleChange('m', v)} min={1} max={6} step={1} />
        </div>

        {/* COLONNE DROITE : Validation et Configuration */}
        <div className="rounded-lg border border-border p-5 bg-muted/30 h-fit">
          <h3 className="text-sm font-semibold text-foreground mb-4">Validation</h3>
          
          {/* Messages d'erreur ou de succès */}
          {isValid ? (
            <div className="flex items-center gap-2 text-success p-3 bg-success/10 rounded-md border border-success/20">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse shrink-0" />
              <span className="text-sm font-medium">Tous les paramètres sont valides</span>
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
              {errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-destructive">
                  <div className="w-2 h-2 rounded-full bg-destructive shrink-0 mt-1.5" />
                  <span className="text-sm font-medium leading-tight">{e}</span>
                </div>
              ))}
            </div>
          )}

          {/* Configuration fixe */}
          <div className="mt-6 p-4 rounded-md bg-card border border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">CONFIGURATION SYSTÈME</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-muted-foreground">Type de machine</span>
                <span className="font-mono text-foreground font-medium">Alternateur synchrone</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-muted-foreground">Orientation de l'arbre</span>
                <span className="font-mono text-foreground font-medium">Horizontale</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-muted-foreground">Système de ventilation</span>
                <span className="font-mono text-foreground font-medium">Radiale</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Couplage statorique</span>
                <span className="font-mono text-foreground font-medium">Étoile (Y)</span>
              </div>
            </div>
          </div>

          {/* Bouton d'action moderne */}
          <button
            onClick={handleCalculate}
            disabled={!isValid}
            className={`mt-6 w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              isCalculated
                ? 'bg-success text-success-foreground shadow-md shadow-success/20' 
                : isValid
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                  : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
            }`}
          >
            {isCalculated ? 'Calcul Validé ✓' : 'Calculer les paramètres'}
          </button>
          
        </div>
      </div>
    </StepLayout>
  );
}