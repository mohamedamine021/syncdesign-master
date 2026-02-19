import { Formula } from './Formula';

interface FormulaResultProps {
  label: string;
  tex: string;
  result: string;
  unit?: string;
}

export function FormulaResult({ label, tex, result, unit = '' }: FormulaResultProps) {
  return (
    <div className="formula-card space-y-2">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <Formula tex={tex} display />
      <div className="flex items-baseline gap-2 pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">Résultat :</span>
        <span className="result-highlight text-lg">{result}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
