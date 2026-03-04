import { useEffect } from 'react';
import { useMachineStore } from '@/store/machineStore';
import { CalculationEngine } from '@/engine/CalculationEngine';
import { StepLayout } from '@/components/StepLayout';
import { ParamInput } from '@/components/ParamInput';

export default function Step1() {
  const { inputs, setInputs, setCurrentStep, recalculate } = useMachineStore();

  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  return (
    <StepLayout
      stepNumber={1}
      title="Paramètres d'entrée"
      description="Définir le cahier des charges de la machine synchrone (alternateur)"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-4">Cahier des charges</h3>
          <ParamInput label="Puissance nominale" symbol="Pₙ" value={inputs.Pn} unit="kW" onChange={(v) => setInputs({ Pn: v })} min={1} step={10} />
          <ParamInput label="Tension nominale" symbol="Uₙ" value={inputs.Un} unit="V" onChange={(v) => setInputs({ Un: v })} min={100} step={100} />
          <ParamInput label="Facteur de puissance" symbol="cos φ" value={inputs.cosPhi} unit="" onChange={(v) => setInputs({ cosPhi: v })} min={0.1} max={1} step={0.01} />
          <ParamInput label="Fréquence" symbol="f" value={inputs.f} unit="Hz" onChange={(v) => setInputs({ f: v })} min={1} step={5} />
          <ParamInput label="Vitesse nominale" symbol="nₙ" value={inputs.nn} unit="tr/min" onChange={(v) => setInputs({ nn: v })} min={1} step={50} />
          <ParamInput label="Nombre de phases" symbol="m" value={inputs.m} unit="" onChange={(v) => setInputs({ m: v })} min={1} max={6} step={1} />
        </div>

        <div className="rounded-lg border border-border p-5 bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground mb-4">Validation</h3>
          {(() => {
            const errors = CalculationEngine.validateInputs(inputs);
            if (errors.length === 0) {
              return (
                <div className="flex items-center gap-2 text-success">
                  <div className="w-3 h-3 rounded-full bg-success animate-pulse-glow" />
                  <span className="text-sm font-medium">Tous les paramètres sont valides</span>
                </div>
              );
            }
            return (
              <div className="space-y-2">
                {errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-destructive">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-sm">{e}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="mt-6 p-4 rounded-md bg-card border border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">CONFIGURATION</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-mono text-foreground">Alternateur synchrone</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arbre</span>
                <span className="font-mono text-foreground">Horizontal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ventilation</span>
                <span className="font-mono text-foreground">Radiale</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Couplage</span>
                <span className="font-mono text-foreground">Étoile (Y)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const errors = CalculationEngine.validateInputs(inputs);
              if (errors.length > 0) {
                alert(`Veuillez corriger les erreurs :\n${errors.join('\n')}`);
              } else {
                recalculate();
              }
            }}
            className="mt-6 w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Calculer les paramètres
          </button>
        </div>
      </div>
    </StepLayout>
  );
}
