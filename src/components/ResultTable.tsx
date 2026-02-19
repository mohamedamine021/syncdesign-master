interface ResultTableProps {
  rows: { label: string; symbol?: string; value: string; unit?: string }[];
  title?: string;
}

export function ResultTable({ rows, title }: ResultTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {title && (
        <div className="px-4 py-2 bg-muted/50 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Paramètre</th>
            <th>Symbole</th>
            <th className="text-right">Valeur</th>
            <th>Unité</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/30 transition-colors">
              <td className="text-foreground font-sans text-sm">{r.label}</td>
              <td className="text-muted-foreground text-xs">{r.symbol || '—'}</td>
              <td className="text-right result-highlight">{r.value}</td>
              <td className="text-muted-foreground text-xs">{r.unit || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
