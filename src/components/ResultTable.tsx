import React from 'react';

interface ResultTableProps {
  // ⬇️ C'est ici que la magie opère : symbol accepte maintenant du JSX (ReactNode)
  rows: { label: string; symbol?: React.ReactNode; value: string; unit?: string }[];
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
      <table className="data-table w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="p-3 border-b">Paramètre</th>
            <th className="p-3 border-b">Symbole</th>
            <th className="p-3 border-b text-right">Valeur</th>
            <th className="p-3 border-b">Unité</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/30 transition-colors">
              <td className="p-3 border-b border-muted/50 text-foreground font-sans text-sm">
                {r.label}
              </td>
              {/* Le symbole s'affichera parfaitement avec sa police mathématique */}
              <td className="p-3 border-b border-muted/50 text-muted-foreground text-xs">
                {r.symbol || '—'}
              </td>
              <td className="p-3 border-b border-muted/50 text-right result-highlight font-medium">
                {r.value}
              </td>
              <td className="p-3 border-b border-muted/50 text-muted-foreground text-xs">
                {r.unit || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}