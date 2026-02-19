import { useEffect, useRef } from 'react';
import katex from 'katex';

interface FormulaProps {
  tex: string;
  display?: boolean;
  className?: string;
}

export function Formula({ tex, display = false, className = '' }: FormulaProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(tex, ref.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
        });
      } catch {
        ref.current.textContent = tex;
      }
    }
  }, [tex, display]);

  return <span ref={ref} className={className} />;
}
