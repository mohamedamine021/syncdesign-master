interface ParamInputProps {
  label: string;
  symbol: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function ParamInput({ label, symbol, value, unit, onChange, min, max, step = 1 }: ParamInputProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-xs text-muted-foreground ml-2 font-mono">({symbol})</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : 0)}
          min={min}
          max={max}
          step={step}
          placeholder="—"
          className="w-28 px-3 py-1.5 rounded-md border border-input bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-xs text-muted-foreground w-12">{unit}</span>
      </div>
    </div>
  );
}
