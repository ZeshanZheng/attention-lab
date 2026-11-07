import type { ReactNode } from 'react';

export function Fraction({ numerator, denominator, label }: { numerator: ReactNode; denominator: ReactNode; label: string }) {
  return <span className="math-fraction" role="math" aria-label={label}><span className="fraction-numerator" aria-hidden="true">{numerator}</span><span className="fraction-denominator" aria-hidden="true">{denominator}</span></span>;
}

export function Exponential({ children, label }: { children: ReactNode; label: string }) {
  return <span className="math-power" role="math" aria-label={`e 的 ${label} 次方`}>e<sup>{children}</sup></span>;
}

// Format stored lesson notation at display time, preserving the original snapshots.
export function MathText({ children }: { children: string }) {
  return <>{children.split(/exp\(([^()]*)\)/g).map((part, index) => index % 2 === 0 ? part :
    <Exponential key={index} label={part}>{part.split(/(_[A-Za-z0-9]+)/g).map((piece, position) => piece.startsWith('_') ? <sub key={position}>{piece.slice(1)}</sub> : piece)}</Exponential>)}</>;
}
