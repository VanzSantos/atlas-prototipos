/** Marca do Atlas: o titã ajoelhado sustentando o globo nos ombros. */
export function Marca() {
  return (
    <span className="atlas-marca">
      <svg className="atlas-marca-icone" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        {/* globo */}
        <circle cx="16" cy="8.6" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="16" cy="8.6" rx="3.1" ry="7.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <path d="M8.8 8.6h14.4M10 5h12M10 12.2h12" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* titã: cabeça baixa, braços erguidos segurando o globo */}
        <circle cx="14.6" cy="18.4" r="1.8" fill="currentColor" />
        <path d="M11.6 20.2 9 16.4l1.4-4.2M20.6 20.2l2.4-3.8-1.4-4.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* ombros e tronco */}
        <path d="M11.4 20.4h9.4M16.2 20.6l.4 4.4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        {/* pernas: uma apoiada, outra com o joelho no chão */}
        <path d="M17.2 25l4.4.4v4.4M15.8 25.2l-3.2 4.4H8.4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Atlas</span>
    </span>
  );
}
