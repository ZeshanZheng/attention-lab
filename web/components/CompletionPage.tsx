import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from './Icon.tsx';

const BURSTS = [
  { x: 15, y: 28, delay: 0, color: '#246de3', radius: 120 },
  { x: 83, y: 25, delay: .55, color: '#068aaa', radius: 135 },
  { x: 25, y: 73, delay: 1.15, color: '#7652d4', radius: 110 },
  { x: 76, y: 71, delay: 1.8, color: '#c78522', radius: 125 },
  { x: 47, y: 17, delay: 2.45, color: '#487ad8', radius: 140 },
  { x: 56, y: 82, delay: 3.1, color: '#bf5b98', radius: 100 },
] as const;

export function CompletionPage({ onReturn }: { onReturn: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);

  return <main className="welcome-screen completion-screen" aria-labelledby="completion-title" style={{ backgroundImage: `url("${import.meta.env.BASE_URL}images/welcome-blue-white.png")` }}>
    <div className="completion-fireworks" aria-hidden="true">
      {BURSTS.map((burst, burstIndex) => <div className="firework" key={burstIndex} style={{ left: `${burst.x}%`, top: `${burst.y}%`, '--burst-delay': `${burst.delay}s`, '--burst-color': burst.color } as CSSProperties}>
        <i className="firework-rocket" />
        {Array.from({ length: 18 }, (_, index) => {
          const angle = index * Math.PI * 2 / 18;
          const distance = burst.radius * (index % 3 === 0 ? .72 : 1);
          return <i className="firework-spark" key={index} style={{ '--spark-x': `${Math.cos(angle) * distance}px`, '--spark-y': `${Math.sin(angle) * distance}px`, '--spark-angle': `${index * 20 + 90}deg` } as CSSProperties} />;
        })}
      </div>)}
    </div>
    <div className="welcome-content completion-content">
      <h1 id="completion-title" ref={headingRef} tabIndex={-1}>恭喜您已经完成了实验！</h1>
      <button type="button" className="welcome-enter completion-return" onClick={onReturn}>回到开始界面<Icon name="arrow" size={20} /></button>
    </div>
  </main>;
}
