/** Marca do Atlas: o titã ajoelhado sustentando o globo nos ombros. */
export function Marca() {
  return (
    <span className="atlas-marca">
      <svg className="atlas-marca-icone" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        {/* globo */}
        <circle cx="16" cy="8.5" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <ellipse cx="16" cy="8.5" rx="3" ry="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M9 8.5h14M10.2 5h11.6M10.2 12h11.6" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* titã: cabeça, braços erguidos segurando o globo, tronco e pernas ajoelhadas */}
        <circle cx="16" cy="18" r="1.9" fill="currentColor" />
        <path
          d="M10.4 13.2 12 19.6l2.6 1.6M21.6 13.2 20 19.6l-2.6 1.6M16 20.4v5.2M16 25.6l-4.6 1.2v3.4M16 25.6l4.4 2.6 2.6 1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Atlas</span>
    </span>
  );
}
