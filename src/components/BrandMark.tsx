export function BrandMark({ size = 34, chip = 52 }: { size?: number; chip?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-2xl bg-[#161c29] shadow-[0_2px_10px_rgba(45,212,191,0.22),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      style={{ width: chip, height: chip }}
    >
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="bf-brandmark" x1="24" y1="20" x2="96" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6ff0dc" />
            <stop offset="0.5" stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#11a594" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#bf-brandmark)" strokeWidth="17" strokeLinejoin="round">
          <path d="M62,14 L50,42 Q26,44 26,55 Q26,66 44,62" />
          <path d="M62,14 L50,42 Q26,44 26,55 Q26,66 44,62" transform="rotate(180 60 60)" />
        </g>
      </svg>
    </span>
  );
}
