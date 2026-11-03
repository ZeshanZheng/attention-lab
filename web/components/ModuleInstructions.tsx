import type { ReactNode } from 'react';

export function ModuleInstructions({ title, children }: { title: string; children: ReactNode }) {
  return <details className="module-instructions"><summary>{title}</summary><div className="module-instructions-body">{children}</div></details>;
}
