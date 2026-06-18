export function BrandIcon({ className = "size-9" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Kritisa"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="96" height="96" rx="28" fill="#FDFBF7" />
      <circle cx="48" cy="48" r="34" fill="#FFFEFB" stroke="#1A1A1A" strokeWidth="5" />
      <path
        d="M36 42c0-9 5-15 13-18l3 6c-4 2-7 5-8 9h7v18H36V42Zm22 0c0-9 5-15 13-18l3 6c-4 2-7 5-8 9h7v18H58V42Z"
        fill="#9A4F20"
      />
      <path d="M30 68h36" stroke="#1A1A1A" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
