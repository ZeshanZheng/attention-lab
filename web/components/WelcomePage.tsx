import { Icon } from './Icon.tsx';

export function WelcomePage({ onEnter }: { onEnter: () => void }) {
  return <main className="welcome-screen" aria-labelledby="welcome-title">
    <div className="welcome-content">
      <h1 id="welcome-title"><span>欢迎您来到</span>注意力实验室！</h1>
      <p id="welcome-description">通过修改向量、观察计算和完成实验，理解 Q、K、V 如何配合，掌握注意力从匹配到信息聚合的过程。</p>
      <button type="button" className="welcome-enter" onClick={onEnter}>进入实验室<Icon name="arrow" size={20} /></button>
    </div>
  </main>;
}
