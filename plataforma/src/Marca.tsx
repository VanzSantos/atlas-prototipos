/** Marca do Atlas: um globo simples, na mesma cor do nome. */
export function Marca() {
  return (
    <span className="atlas-marca">
      <svg
        className="atlas-marca-icone"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="3.8" ry="9" />
        <path d="M3 12h18" />
      </svg>
      <span>Atlas</span>
    </span>
  );
}
